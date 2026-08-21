import * as THREE from 'three';

const MAX_SEGMENTS = 4096;
const VERTS_PER_SEGMENT = 6;
const FLOATS_PER_SEGMENT = VERTS_PER_SEGMENT * 3;
const COLOR_FLOATS_PER_SEGMENT = VERTS_PER_SEGMENT * 4;

const WIDTH = 0.08;
const Y_OFFSET = 0.05;
const MIN_SEGMENT_LENGTH = 0.02;
const INTENSITY_MIN = 0.5;
const INTENSITY_MAX = 2.0;
const INV_INTENSITY_RANGE = 1 / ( INTENSITY_MAX - INTENSITY_MIN );

const STORAGE_PREFIX = 'racing.driftMarks.';
const STORAGE_VERSION = 1;
const QUANTIZE = 1000;

const _wheelWorld = new THREE.Vector3();
const _dir = new THREE.Vector3();
const _side = new THREE.Vector3();
const _pL = new THREE.Vector3();
const _pR = new THREE.Vector3();
const _cL = new THREE.Vector3();
const _cR = new THREE.Vector3();
const _replayPrev = new THREE.Vector3();
const _replayCurr = new THREE.Vector3();

class DriftTrail {

	constructor( scene, material ) {

		const positions = new Float32Array( MAX_SEGMENTS * FLOATS_PER_SEGMENT );
		const colors = new Float32Array( MAX_SEGMENTS * COLOR_FLOATS_PER_SEGMENT );

		// Pre-fill RGB to 1; only per-segment alpha is written at runtime.
		for ( let i = 0; i < MAX_SEGMENTS * VERTS_PER_SEGMENT; i ++ ) {

			const o = i * 4;
			colors[ o ] = 1;
			colors[ o + 1 ] = 1;
			colors[ o + 2 ] = 1;

		}

		const geometry = new THREE.BufferGeometry();

		const posAttr = new THREE.BufferAttribute( positions, 3 );
		posAttr.setUsage( THREE.DynamicDrawUsage );
		geometry.setAttribute( 'position', posAttr );

		const colorAttr = new THREE.BufferAttribute( colors, 4 );
		colorAttr.setUsage( THREE.DynamicDrawUsage );
		geometry.setAttribute( 'color', colorAttr );

		geometry.setDrawRange( 0, 0 );

		this.mesh = new THREE.Mesh( geometry, material );
		this.mesh.frustumCulled = false;
		this.mesh.renderOrder = - 1;
		scene.add( this.mesh );

		this.positions = positions;
		this.colors = colors;
		this.geometry = geometry;
		this.segmentIndex = 0;
		this.drawCount = 0;
		this.prev = new THREE.Vector3();
		this.active = false;
		this.dirty = false;

	}

	track( wheel, groundY, intensity, emit ) {

		if ( ! wheel ) return;

		wheel.getWorldPosition( _wheelWorld );
		_wheelWorld.y = groundY;

		if ( emit && this.active ) {

			const alpha = THREE.MathUtils.clamp( ( intensity - INTENSITY_MIN ) * INV_INTENSITY_RANGE, 0, 1 );
			this._writeSegment( this.prev, _wheelWorld, alpha, true );

		}

		this.prev.copy( _wheelWorld );
		this.active = emit;

	}

	_writeSegment( prev, curr, alpha, markDirty ) {

		_dir.subVectors( curr, prev );
		_dir.y = 0;
		const len = _dir.length();
		if ( len < MIN_SEGMENT_LENGTH ) return;
		_dir.divideScalar( len );

		_side.set( _dir.z, 0, - _dir.x ).multiplyScalar( WIDTH );

		_pL.copy( prev ).add( _side );
		_pR.copy( prev ).sub( _side );
		_cL.copy( curr ).add( _side );
		_cR.copy( curr ).sub( _side );

		const offset = this.segmentIndex * FLOATS_PER_SEGMENT;
		const p = this.positions;

		// Winding CCW from above so DoubleSide isn't strictly required.
		p[ offset +  0 ] = _pL.x; p[ offset +  1 ] = _pL.y; p[ offset +  2 ] = _pL.z;
		p[ offset +  3 ] = _pR.x; p[ offset +  4 ] = _pR.y; p[ offset +  5 ] = _pR.z;
		p[ offset +  6 ] = _cL.x; p[ offset +  7 ] = _cL.y; p[ offset +  8 ] = _cL.z;
		p[ offset +  9 ] = _pR.x; p[ offset + 10 ] = _pR.y; p[ offset + 11 ] = _pR.z;
		p[ offset + 12 ] = _cR.x; p[ offset + 13 ] = _cR.y; p[ offset + 14 ] = _cR.z;
		p[ offset + 15 ] = _cL.x; p[ offset + 16 ] = _cL.y; p[ offset + 17 ] = _cL.z;

		const colorOffset = this.segmentIndex * COLOR_FLOATS_PER_SEGMENT;
		const c = this.colors;

		for ( let i = 0; i < VERTS_PER_SEGMENT; i ++ ) {

			c[ colorOffset + i * 4 + 3 ] = alpha;

		}

		if ( markDirty ) {

			const posAttr = this.geometry.attributes.position;
			posAttr.addUpdateRange( offset, FLOATS_PER_SEGMENT );
			posAttr.needsUpdate = true;

			const colAttr = this.geometry.attributes.color;
			colAttr.addUpdateRange( colorOffset, COLOR_FLOATS_PER_SEGMENT );
			colAttr.needsUpdate = true;

			this.dirty = true;

		}

		this.segmentIndex = ( this.segmentIndex + 1 ) % MAX_SEGMENTS;

		if ( this.drawCount < MAX_SEGMENTS * VERTS_PER_SEGMENT ) {

			this.drawCount += VERTS_PER_SEGMENT;
			this.geometry.setDrawRange( 0, this.drawCount );

		}

	}

	serialize() {

		const segCount = this.drawCount / VERTS_PER_SEGMENT;
		if ( segCount === 0 ) return [];

		const start = ( segCount < MAX_SEGMENTS ) ? 0 : this.segmentIndex;
		const p = this.positions;
		const c = this.colors;
		const strokes = [];
		let stroke = null;
		let lastX = 0, lastY = 0, lastZ = 0;
		let havePrev = false;

		for ( let i = 0; i < segCount; i ++ ) {

			const slot = ( start + i ) % MAX_SEGMENTS;
			const offset = slot * FLOATS_PER_SEGMENT;

			// midpoint(pL, pR) === prev; midpoint(cL, cR) === curr
			const px = Math.round( ( p[ offset + 0 ] + p[ offset + 3 ] ) * 0.5 * QUANTIZE );
			const py = Math.round( ( p[ offset + 1 ] + p[ offset + 4 ] ) * 0.5 * QUANTIZE );
			const pz = Math.round( ( p[ offset + 2 ] + p[ offset + 5 ] ) * 0.5 * QUANTIZE );
			const cx = Math.round( ( p[ offset +  6 ] + p[ offset + 12 ] ) * 0.5 * QUANTIZE );
			const cy = Math.round( ( p[ offset +  7 ] + p[ offset + 13 ] ) * 0.5 * QUANTIZE );
			const cz = Math.round( ( p[ offset +  8 ] + p[ offset + 14 ] ) * 0.5 * QUANTIZE );

			const aByte = Math.round( c[ slot * COLOR_FLOATS_PER_SEGMENT + 3 ] * 255 );

			const continued = havePrev && px === lastX && py === lastY && pz === lastZ;

			if ( ! continued ) {

				stroke = { a: [ px, py, pz ], d: [], i: [] };
				strokes.push( stroke );
				stroke.d.push( cx - px, cy - py, cz - pz );

			} else {

				stroke.d.push( cx - lastX, cy - lastY, cz - lastZ );

			}

			stroke.i.push( aByte );
			lastX = cx; lastY = cy; lastZ = cz;
			havePrev = true;

		}

		return strokes;

	}

	load( strokes ) {

		for ( const s of strokes ) {

			let x = s.a[ 0 ];
			let y = s.a[ 1 ];
			let z = s.a[ 2 ];
			_replayPrev.set( x / QUANTIZE, y / QUANTIZE, z / QUANTIZE );

			const intensities = s.i;
			const deltas = s.d;
			const segs = intensities.length;

			for ( let n = 0; n < segs; n ++ ) {

				x += deltas[ n * 3 + 0 ];
				y += deltas[ n * 3 + 1 ];
				z += deltas[ n * 3 + 2 ];
				_replayCurr.set( x / QUANTIZE, y / QUANTIZE, z / QUANTIZE );

				this._writeSegment( _replayPrev, _replayCurr, intensities[ n ] / 255, false );
				_replayPrev.copy( _replayCurr );

			}

		}

		this.geometry.attributes.position.needsUpdate = true;
		this.geometry.attributes.color.needsUpdate = true;

	}

}

export class DriftMarks {

	constructor( scene, trackId ) {

		const material = new THREE.MeshBasicMaterial( {
			color: 0x111111,
			transparent: true,
			opacity: 0.5,
			vertexColors: true,
			depthWrite: false,
			side: THREE.DoubleSide,
			polygonOffset: true,
			polygonOffsetFactor: - 4,
			polygonOffsetUnits: - 4,
		} );

		this.trails = [
			new DriftTrail( scene, material ),
			new DriftTrail( scene, material ),
		];

		this.storageKey = STORAGE_PREFIX + ( trackId || 'default' );
		this._load();

		window.addEventListener( 'pagehide', () => this._save() );

	}

	update( dt, vehicle ) {

		const emit = vehicle.driftIntensity > 0.5 && Math.abs( vehicle.linearSpeed ) > 0.15;

		if ( ! emit && ! this.trails[ 0 ].active && ! this.trails[ 1 ].active ) return;

		const groundY = vehicle.container.position.y + Y_OFFSET;
		const intensity = vehicle.driftIntensity;

		this.trails[ 0 ].track( vehicle.wheelBL, groundY, intensity, emit );
		this.trails[ 1 ].track( vehicle.wheelBR, groundY, intensity, emit );

	}

	_load() {

		try {

			const raw = localStorage.getItem( this.storageKey );
			if ( ! raw ) return;
			const data = JSON.parse( raw );
			if ( ! data || data.v !== STORAGE_VERSION || ! Array.isArray( data.t ) ) return;

			for ( let i = 0; i < this.trails.length; i ++ ) {

				const strokes = data.t[ i ];
				if ( Array.isArray( strokes ) ) this.trails[ i ].load( strokes );

			}

		} catch {}

	}

	_save() {

		if ( ! this.trails.some( ( trail ) => trail.dirty ) ) return;

		try {

			const t = this.trails.map( ( trail ) => trail.serialize() );

			if ( t.every( ( s ) => s.length === 0 ) ) {

				localStorage.removeItem( this.storageKey );

			} else {

				localStorage.setItem( this.storageKey, JSON.stringify( { v: STORAGE_VERSION, t } ) );

			}

			for ( const trail of this.trails ) trail.dirty = false;

		} catch {}

	}

}
