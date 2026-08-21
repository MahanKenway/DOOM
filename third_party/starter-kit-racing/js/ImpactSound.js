// Procedural collision sound: car body crashing into a hard barrier —
// metal against rock/concrete, so a dry percussive smash with a gritty
// crunch, not a ringing metallic clang. Layers:
// - Crash: a big full-band noise burst, the dominant smash.
// - Crunch body: white noise through broad, heavily damped resonators — a
//   dull broadband roar (coloured, not pitched), gated so it grinds.
// - Rubble crackle: dense gravelly noise bursts, grit crushed against stone.
// - Low knock: a short dry punch, the mass meeting a solid wall.
// - Debris: a couple of dull chips bouncing out.
//
// `hardness` (0..1): a light scuff is a short dull crunch; a full crash is a
//   loud broad smash with debris. `seed`: re-rolls detune, gating, timing.

const DURATION = 0.6;

// Resonances for the crunch body (Hz), heavily damped (broad, ~unpitched) so
// the noise reads as a dull stony crunch rather than a ringing metal tone.
const RES_FREQS = [ 380, 620, 1050, 1480, 2100, 2950 ];
const RES_DAMP = [ 0.20, 0.18, 0.20, 0.26, 0.34, 0.42 ];

// White-noise burst through a state-variable bandpass, decaying into `data`.
function addNoiseBurst( data, sampleRate, random, startTime, fc, qDamp, decay, amp ) {

	const svfF = 2 * Math.sin( Math.PI * Math.min( 0.28, fc / sampleRate ) );
	let low = 0, band = 0;

	const start = Math.floor( startTime * sampleRate );
	const end = Math.min( data.length, start + Math.floor( decay * 7 * sampleRate ) );

	for ( let i = start; i < end; i ++ ) {

		const dt = ( i - start ) / sampleRate;
		const white = random() * 2 - 1;
		low += svfF * band;
		const high = white - low - qDamp * band;
		band += svfF * high;
		data[ i ] += band * amp * Math.exp( - dt / decay );

	}

}

export function fillImpact( data, sampleRate, seed, hardness ) {

	let noiseSeed = seed * 48271 + 11;

	const random = () => {

		noiseSeed = ( noiseSeed * 1664525 + 1013904223 ) | 0;
		return ( noiseSeed >>> 9 ) / 8388608;

	};

	const n = data.length;
	data.fill( 0 );

	// --- Crash: big full-band noise burst, fast attack --------------------

	const crashDecay = 0.04 + 0.04 * hardness;
	const crashGain = 1.0 + hardness * 0.7;
	let crashHp = 0; // gentle highpass: trim sub-rumble, keep body
	const crashEnd = Math.min( n, Math.floor( crashDecay * 6 * sampleRate ) );

	for ( let i = 0; i < crashEnd; i ++ ) {

		const t = i / sampleRate;
		const white = random() * 2 - 1;
		crashHp += ( white - crashHp ) * 0.05;
		const attack = 1 - Math.exp( - t / 0.001 );
		data[ i ] += ( white - crashHp ) * attack * Math.exp( - t / crashDecay ) * crashGain;

	}

	// --- Tear body: noise through metallic resonators, rough envelope -----

	const numRes = RES_FREQS.length;
	const resF = new Float32Array( numRes );
	const resLow = new Float32Array( numRes );
	const resBand = new Float32Array( numRes );

	for ( let r = 0; r < numRes; r ++ ) {

		const f = RES_FREQS[ r ] * ( 1 + ( random() * 2 - 1 ) * 0.08 );
		resF[ r ] = 2 * Math.sin( Math.PI * Math.min( 0.28, f / sampleRate ) );

	}

	const tearDecay = 0.10 + 0.06 * hardness;
	const tearGain = ( 0.35 + 0.35 * hardness ) * 0.4;
	const roughCoeff = 1 - Math.exp( - 2 * Math.PI * 55 / sampleRate );
	let rough = 0;
	const tearEnd = Math.min( n, Math.floor( tearDecay * 6 * sampleRate ) );

	for ( let i = 0; i < tearEnd; i ++ ) {

		const t = i / sampleRate;
		const white = random() * 2 - 1;

		// Rough, bursty amplitude (lowpassed noise, rectified and sharpened)
		// so the resonators are hit in rips rather than a smooth hiss.
		rough += ( white - rough ) * roughCoeff;
		const gate = 0.15 + 3.5 * rough * rough;

		const drive = white * gate * Math.exp( - t / tearDecay );

		let out = 0;
		for ( let r = 0; r < numRes; r ++ ) {

			const f = resF[ r ];
			resLow[ r ] += f * resBand[ r ];
			const high = drive - resLow[ r ] - RES_DAMP[ r ] * resBand[ r ];
			resBand[ r ] += f * high;
			out += resBand[ r ];

		}

		data[ i ] += out * tearGain;

	}

	// --- Rubble crackle: dense gravelly noise bursts ----------------------

	const numClicks = Math.round( ( 45 + hardness * 75 ) * ( 0.8 + random() * 0.4 ) );
	const crackleGain = 0.35 + hardness * 0.65;
	let refractory = 1;

	for ( let c = 0; c < numClicks; c ++ ) {

		// Density decays over the crush (~50 ms), sparse stragglers after
		const t0 = - 0.05 * Math.log( 1 - random() * 0.9995 );

		// Pareto energies, alpha 1.3, clamped; amp ~ sqrt(E), slow refractory
		const energy = Math.min( 1000, Math.pow( 1 - random(), - 1 / 1.3 ) );
		const amp = Math.sqrt( energy * 0.01 ) * crackleGain * refractory;
		refractory *= 0.992;

		// Broad, gritty burst — grit crushed against stone, not a bright ping
		const fc = 700 + random() * ( 2000 + hardness * 2000 );
		addNoiseBurst( data, sampleRate, random, t0, fc, 0.3 + random() * 0.4,
			0.0015 + random() * 0.006, amp );

	}

	// --- Low knock: short dry punch, mass meeting a solid wall -------------

	const thudFreq = 70 + random() * 30;
	const thudDur = 0.02 + 0.012 * hardness;
	const thudGain = 0.3 + hardness * 0.28;
	const thudEnd = Math.min( n, Math.floor( thudDur * sampleRate ) );

	for ( let i = 0; i < thudEnd; i ++ ) {

		const t = i / sampleRate;
		const w = Math.sin( Math.PI * t / thudDur );
		data[ i ] += Math.sin( 6.2831853 * thudFreq * t ) * w * thudGain;

	}

	// --- Debris: a couple of dull chips bouncing out ----------------------

	const numPieces = hardness > 0.6 ? 2 : 1;

	for ( let d = 0; d < numPieces; d ++ ) {

		const fc = 1200 + random() * 1300;
		const restitution = 0.55 + random() * 0.15;
		let bounceT = 0.09 + random() * 0.15;
		let interval = 0.05 + random() * 0.06;
		let bounceAmp = ( 0.04 + random() * 0.06 ) * hardness;

		while ( bounceT < 0.5 && bounceAmp > 0.004 ) {

			addNoiseBurst( data, sampleRate, random, bounceT, fc, 0.32,
				0.004 + random() * 0.01, bounceAmp );

			bounceT += interval;
			interval *= restitution;
			bounceAmp *= restitution * restitution;

		}

	}

	// Normalize
	let peak = 0;
	for ( let i = 0; i < n; i ++ ) peak = Math.max( peak, Math.abs( data[ i ] ) );

	if ( peak > 0 ) {

		const norm = 0.9 / peak;
		for ( let i = 0; i < n; i ++ ) data[ i ] *= norm;

	}

}

export function createImpactBuffer( context, seed, hardness ) {

	const length = Math.floor( DURATION * context.sampleRate );
	const buffer = context.createBuffer( 1, length, context.sampleRate );

	fillImpact( buffer.getChannelData( 0 ), context.sampleRate, seed, hardness );

	return buffer;

}
