// Procedural 4-stroke, 4-cylinder engine synth.
//
// Each cylinder fires once per engine cycle (2 crank revolutions) at a fixed,
// slightly uneven crank offset with a fixed per-cylinder gain; the stationary
// asymmetry builds the half-order harmonic comb. Cycle-to-cycle jitter stays
// small — real combustion varies only a few percent.
//
// Per firing: a damped-chirp "thump" pulse (crossfaded to a rounder table as
// load drops) plus a band-passed noise burst. Combustion follows fuel rather
// than volume: it fades to near-silence when coasting at revs (deceleration
// fuel cut), leaving the mechanical layer, and sparse overrun pops fire on
// the firing grid into the exhaust pipe.
//
// Mix chain: ring-modulation by lowpassed noise -> exhaust-pipe feedback comb
// (feedback pumped by exhaust-valve state) -> tanh waveshaper -> fixed
// formants -> tracking lowpass -> parallel short-comb muffler. A broadband
// 3-9 kHz mechanical layer (valvetrain hash + ticks) bypasses the lowpass.

const CYLINDERS = 4;
const TABLE_SIZE = 2048;

// Fixed, uneven firing offsets and per-cylinder gains. The lumpier the
// offsets, the stronger the low-order lope (a big-engine rumble).
const CRANK_OFFSETS = [ 0, 0.21, 0.495, 0.72 ];
const CYL_GAINS = [ 1.08, 0.94, 1.03, 0.92 ];

export const RPM_IDLE = 1000;
export const RPM_MAX = 6700;

export class EngineCore {

	constructor( sampleRate ) {

		this.sampleRate = sampleRate;

		this.phase = 0; // engine cycle phase [0,1), 720° of crank

		this.rpm = RPM_IDLE;
		this.load = 0;

		// Per-sample smoothing coefficients (~40ms and ~60ms time constants)
		this.rpmSmooth = 1 - Math.exp( - 1 / ( 0.04 * sampleRate ) );
		this.loadSmooth = 1 - Math.exp( - 1 / ( 0.06 * sampleRate ) );

		// Per-cylinder firing state
		this.jitter = new Float32Array( CYLINDERS ).fill( 1 );
		this.prevPos = new Float32Array( CYLINDERS );

		// Firing pulse tables, indexed by position within the firing window.
		// thump: sharp-attack damped chirp (on-throttle combustion)
		// thumpSoft: rounder, duller pulse (low-load combustion)
		// gate: fast decay envelope for the combustion noise burst
		this.thumpTable = new Float32Array( TABLE_SIZE );
		this.thumpSoftTable = new Float32Array( TABLE_SIZE );
		this.gateTable = new Float32Array( TABLE_SIZE );

		for ( let i = 0; i < TABLE_SIZE; i ++ ) {

			const u = i / TABLE_SIZE;

			const attack = Math.sin( Math.PI * 0.5 * Math.min( u * 12, 1 ) );
			this.thumpTable[ i ] = attack * (
				Math.sin( Math.PI * 2 * ( u * 1.4 + 0.9 * u * u ) ) * Math.exp( - 3.2 * u ) * 0.5 +
				Math.sin( Math.PI * 2 * ( u * 3.7 + 0.8 ) ) * Math.exp( - 6.5 * u ) * 0.55
			);

			const softAttack = Math.sin( Math.PI * 0.5 * Math.min( u * 6, 1 ) );
			this.thumpSoftTable[ i ] = softAttack * (
				Math.sin( Math.PI * 2 * ( u * 1.3 + 0.4 * u * u ) ) * Math.exp( - 3 * u ) * 0.85 +
				Math.sin( Math.PI * 2 * ( u * 2.9 + 0.6 ) ) * Math.exp( - 5.5 * u ) * 0.3
			);

			this.gateTable[ i ] = attack * Math.exp( - 6 * u );

		}

		// Band-pass state (state-variable filter) for combustion noise
		this.svfLow = 0;
		this.svfBand = 0;

		// Slow noise generators: crank wobble and combustion ring-mod
		this.wobble = 0;
		this.wobbleCoeff = 1 - Math.exp( - 2 * Math.PI * 60 / sampleRate );
		this.amNoise = 0;
		this.amCoeff = 1 - Math.exp( - 2 * Math.PI * 1800 / sampleRate );

		// Mechanical layer: highpassed hash + valvetrain ticks
		this.mechLp = 0;
		this.mechLpCoeff = 1 - Math.exp( - 2 * Math.PI * 3000 / sampleRate );
		this.tickEnv = 0;
		this.tickDecay = Math.exp( - 1 / ( 0.0012 * sampleRate ) );
		this.tickAmp = 0;

		// Overrun pops (deceleration fuel cut crackle)
		this.popEnv = 0;
		this.popDecay = Math.exp( - 1 / ( 0.004 * sampleRate ) );
		this.popRing = 0;
		this.popRingDecay = Math.exp( - 1 / ( 0.1 * sampleRate ) );
		this.popClusterSlots = 0;
		this.liftOffSamples = 0;
		this.prevCombustion = 0;

		// Exhaust pipe: feedback comb delay, feedback pumped by valve state
		this.pipeBuffer = new Float32Array( 1024 );
		this.pipeIndex = 0;
		this.pipeDelay = Math.min( 1000, Math.round( sampleRate / 140 ) );
		this.pipeLp = 0;

		// Muffler: short parallel combs add metallic shimmer a single pipe cannot
		this.muffBuffers = [ new Float32Array( 32 ), new Float32Array( 32 ), new Float32Array( 32 ) ];
		this.muffDelays = [
			Math.max( 2, Math.round( 0.00018 * sampleRate ) ),
			Math.max( 3, Math.round( 0.00034 * sampleRate ) ),
			Math.max( 4, Math.round( 0.00055 * sampleRate ) ),
		];
		this.muffIndex = 0;

		// Fixed formant bank: resonances that stay put while the firing rate
		// sweeps underneath give the engine its "voice".
		this.formantF = [ 470, 780, 1024 ].map(
			( f ) => 2 * Math.sin( Math.PI * f / sampleRate )
		);
		this.formantGain = [ 1.0, 0.75, 0.55 ];
		this.formantLow = new Float32Array( 3 );
		this.formantBand = new Float32Array( 3 );

		// DC blocker doubling as a bass trim: a first-order highpass that keeps
		// the firing fundamental from booming.
		this.lp1 = 0;
		this.lp2 = 0;
		this.dcR = 1 - 2 * Math.PI * 90 / sampleRate;
		this.dcState = 0;
		this.dcPrev = 0;

		this.noiseSeed = 22222;

	}

	// Fill `output` with `n` samples. `targetRpm` in real RPM, `targetLoad` 0..1.
	process( output, n, targetRpm, targetLoad ) {

		const sr = this.sampleRate;

		// Block-rate coefficients from current smoothed state
		const rpm01 = Math.min( 1, Math.max( 0, ( this.rpm - RPM_IDLE ) / ( RPM_MAX - RPM_IDLE ) ) );
		const load = this.load;

		// Fuel model: idle keeps a little combustion going, but coasting at
		// revs cuts fuel entirely (DFCO) — combustion disappears, it does
		// not just get quieter.
		const idleFuel = 0.02 + 0.23 * Math.min( 1, Math.max( 0, ( 0.3 - rpm01 ) / 0.3 ) );
		const combustion = Math.max( load, idleFuel );
		const combGain = Math.pow( combustion, 0.7 );
		const fuelCut = load < 0.05 && rpm01 > 0.18;

		// Lift-off detection: residual fuel pops cluster right after the cut
		if ( this.prevCombustion > 0.35 && combustion < 0.1 ) {

			this.liftOffSamples = Math.floor( 0.25 * sr );

		}

		this.prevCombustion = combustion;

		// Combustion noise band tracks RPM upward
		const noiseFreq = 700 + rpm01 * 1000;
		const svfF = 2 * Math.sin( Math.PI * Math.min( 0.24, noiseFreq / sr ) );
		const svfQ = 1.8; // heavier damping = wider rasp band

		// Throttle opens the tone, revs brighten it
		const cutoff = Math.min( 7000, 1400 * Math.pow( 2, load * 1.5 + rpm01 * 1.1 ) );
		const lpA = 1 - Math.exp( - 2 * Math.PI * cutoff / sr );

		const drive = 2.2 + load * 2.2 + rpm01 * 0.8;
		const post = 0.62 / Math.tanh( drive * 0.9 );

		// Small cycle-to-cycle variation; character lives in the fixed
		// per-cylinder asymmetry, not here.
		const unevenness = 0.06 - 0.04 * Math.min( 1, load * 0.8 + rpm01 * 0.8 );

		// Level follows fuel gently; timbre (pulse shape, gating) follows fully.
		const levelScale = Math.pow( combustion, 0.35 );

		const gateFloor = ( 0.06 + load * 0.3 ) * combustion; // intake roar under load
		const raspGain = ( 2.6 + load * 0.9 ) * levelScale;
		const thumpGain = 1.4 * levelScale;
		// Pulse sharpness tracks fuel: idle combustion still knocks, only a
		// true fuel-cut coast goes fully round
		const softMix = Math.min( 1, combustion * 2.2 );
		const subGain = 0.085 * ( 1 - rpm01 * 0.4 ) * levelScale;
		const whineGain = rpm01 * rpm01 * ( 0.25 + 0.75 * load ) * 0.045;
		const amDepth = 0.22 + load * 0.3;

		// Mechanical hash: RPM-scaled, load-independent, bypasses the lowpass
		const mechGain = 0.02 + 0.045 * rpm01;
		const tickGain = 0.5 + rpm01 * 0.5;

		// Overrun pop probability per firing slot
		const popP = this.liftOffSamples > 0 ? 0.22 : 0.05;

		const wobbleAmt = 0.004 - 0.002 * rpm01;
		const pipeMask = this.pipeBuffer.length - 1;
		const muffMask = 31;

		for ( let i = 0; i < n; i ++ ) {

			this.rpm += ( targetRpm - this.rpm ) * this.rpmSmooth;
			this.load += ( targetLoad - this.load ) * this.loadSmooth;
			if ( this.liftOffSamples > 0 ) this.liftOffSamples --;

			// 4-stroke: cycle frequency = rpm / 60 / 2
			this.phase += this.rpm / 120 / sr;
			if ( this.phase >= 1 ) this.phase -= 1;

			// Slow, shallow crank wobble
			this.wobble += ( this.random() * 2 - 1 - this.wobble ) * this.wobbleCoeff;
			const phase = this.phase + this.wobble * wobbleAmt;

			// Sum firing pulses from all cylinders (windows may overlap)
			let thump = 0;
			let gate = gateFloor;
			let valveOpen = 0;

			for ( let k = 0; k < CYLINDERS; k ++ ) {

				let s = phase - CRANK_OFFSETS[ k ];
				s -= Math.floor( s );

				// New firing: small amplitude variation, valvetrain tick,
				// and (under fuel cut) a chance of an overrun pop
				if ( s < this.prevPos[ k ] ) {

					this.jitter[ k ] = 1 + ( this.random() * 2 - 1 ) * unevenness;

					this.tickEnv = 1;
					this.tickAmp = ( 0.2 + this.random() * 0.8 ) * tickGain;

					if ( fuelCut ) {

						const p = this.popClusterSlots > 0 ? popP * 3 : popP;
						if ( this.popClusterSlots > 0 ) this.popClusterSlots --;

						if ( this.random() < p ) {

							// Log-normal-ish amplitude, rare louder bangs
							let amp = 0.5 * Math.exp( ( this.random() + this.random() - 1 ) * 1.1 );
							if ( this.random() < 0.06 ) amp *= 2.5;

							this.popEnv = Math.min( 1.6, amp );
							this.popRing = 1;
							this.popClusterSlots = 3 + ( this.random() * 3 | 0 );

						}

					}

				}

				this.prevPos[ k ] = s;

				// Firing window spans a quarter of the cycle
				const u = s * 4;

				if ( u < 1 ) {

					const ti = ( u * TABLE_SIZE ) | 0;
					const g = this.jitter[ k ] * CYL_GAINS[ k ];
					thump += ( this.thumpTable[ ti ] * softMix +
						this.thumpSoftTable[ ti ] * ( 1 - softMix ) ) * g;
					gate += this.gateTable[ ti ] * g;

					// Exhaust valve opening pumps the pipe feedback
					const vo = Math.sin( Math.PI * u );
					if ( vo > valveOpen ) valveOpen = vo;

				}

			}

			// Combustion noise: white -> bandpass -> gated by firing envelope
			const white = this.random() * 2 - 1;
			this.svfLow += svfF * this.svfBand;
			const svfHigh = white - this.svfLow - svfQ * this.svfBand;
			this.svfBand += svfF * svfHigh;
			const rasp = this.svfBand * gate * raspGain;

			// Sub at the mean firing rate fattens the bottom end;
			// whine locked to a high non-integer crank multiple (gear mesh).
			const sub = Math.sin( 6.2831853 * this.phase * CYLINDERS ) * subGain;
			const whine = Math.sin( 6.2831853 * this.phase * 2 * 12.6 ) * whineGain;

			let x = thump * thumpGain + rasp + sub + whine;

			// Overrun pop: positively skewed transient into the pipe
			if ( this.popEnv > 0.001 ) {

				const pw = this.random() * 2 - 1;
				x += ( pw + 0.7 * Math.abs( pw ) ) * this.popEnv;
				this.popEnv *= this.popDecay;

			}

			this.popRing *= this.popRingDecay;

			// Combustion texture: ring-modulate by lowpassed noise
			this.amNoise += ( white - this.amNoise ) * this.amCoeff;
			x *= 1 + this.amNoise * amDepth * 4;

			// Exhaust pipe comb: feedback breathes with the exhaust valve
			// (closed valve reflects, open valve vents) and rings after pops
			const fb = Math.min( 0.85, 0.7 - 0.62 * valveOpen + 0.3 * this.popRing );
			const read = this.pipeBuffer[ ( this.pipeIndex - this.pipeDelay ) & pipeMask ];
			this.pipeLp += ( read - this.pipeLp ) * 0.32;
			const pipe = x + this.pipeLp * fb;
			this.pipeBuffer[ this.pipeIndex & pipeMask ] = pipe;
			this.pipeIndex ++;

			x = x * 0.4 + pipe * 0.6;

			// Overdrive
			x = Math.tanh( x * drive ) * post;

			// Fixed formants (Q ~ 6), mixed with the dry path
			let formants = 0;

			for ( let k = 0; k < 3; k ++ ) {

				const f = this.formantF[ k ];
				this.formantLow[ k ] += f * this.formantBand[ k ];
				const high = x - this.formantLow[ k ] - 0.17 * this.formantBand[ k ];
				this.formantBand[ k ] += f * high;
				formants += this.formantBand[ k ] * this.formantGain[ k ];

			}

			x = x * 0.6 + formants * 0.5;

			// Muffler shimmer: tiny parallel combs on the pipe output
			let muff = 0;

			for ( let m = 0; m < 3; m ++ ) {

				const buf = this.muffBuffers[ m ];
				const d = buf[ ( this.muffIndex - this.muffDelays[ m ] ) & muffMask ];
				buf[ this.muffIndex & muffMask ] = x + d * 0.35;
				muff += d;

			}

			this.muffIndex ++;
			x = x * 0.85 + muff * 0.1;

			// Tracking lowpass, ~9 dB/oct (second pole only partly mixed in)
			this.lp1 += ( x - this.lp1 ) * lpA;
			this.lp2 += ( this.lp1 - this.lp2 ) * lpA;
			x = this.lp1 * 0.35 + this.lp2 * 0.65;

			// Mechanical layer BYPASSES the lowpass: 3-9 kHz hash amplitude-
			// modulated at firing rate, plus per-firing valvetrain ticks
			this.mechLp += ( white - this.mechLp ) * this.mechLpCoeff;
			const hf = white - this.mechLp;
			x += hf * ( mechGain * ( 0.5 + gate ) + this.tickEnv * this.tickAmp * 0.12 );
			this.tickEnv *= this.tickDecay;

			// DC blocker / bass trim
			const dc = x - this.dcPrev + this.dcR * this.dcState;
			this.dcPrev = x;
			this.dcState = dc;

			// Output soft limit — formant ringing can peak past unity
			output[ i ] = Math.tanh( dc * 0.9 );

		}

	}

	random() {

		this.noiseSeed = ( this.noiseSeed * 1664525 + 1013904223 ) | 0;
		return ( this.noiseSeed >>> 9 ) / 8388608;

	}

}

if ( typeof registerProcessor !== 'undefined' ) {

	class EngineSoundProcessor extends AudioWorkletProcessor {

		static get parameterDescriptors() {

			return [
				{ name: 'rpm', defaultValue: RPM_IDLE, minValue: 0, maxValue: 9000, automationRate: 'k-rate' },
				{ name: 'load', defaultValue: 0, minValue: 0, maxValue: 1, automationRate: 'k-rate' },
			];

		}

		constructor() {

			super();
			this.core = new EngineCore( sampleRate );

		}

		process( inputs, outputs, parameters ) {

			const channels = outputs[ 0 ];
			const first = channels[ 0 ];

			this.core.process( first, first.length, parameters.rpm[ 0 ], parameters.load[ 0 ] );

			for ( let c = 1; c < channels.length; c ++ ) {

				channels[ c ].set( first );

			}

			return true;

		}

	}

	registerProcessor( 'engine-sound', EngineSoundProcessor );

}
