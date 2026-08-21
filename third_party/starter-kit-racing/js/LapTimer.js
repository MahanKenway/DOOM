import * as THREE from 'three';
import { CELL_RAW, GRID_SCALE, TRACK_CELLS, TYPE_NAMES, computeSpawnPosition } from './Track.js';

const FINISH = TYPE_NAMES[ 3 ];
const STORAGE_PREFIX = 'racing.bestLap.';
const _tmp = new THREE.Vector3();

function loadBest( key ) {

	try {

		const v = localStorage.getItem( key );
		const n = v !== null ? Number( v ) : NaN;
		return Number.isFinite( n ) ? n : null;

	} catch {

		return null;

	}

}

function saveBest( key, value ) {

	try {

		localStorage.setItem( key, String( value ) );

	} catch {}

}

function formatTime( t ) {

	if ( t === null || t === undefined ) return '0:00.00';

	const m = Math.floor( t / 60 );
	const s = t - m * 60;
	return `${ m }:${ s.toFixed( 2 ).padStart( 5, '0' ) }`;

}

export class LapTimer {

	constructor( cells, trackId ) {

		this.storageKey = STORAGE_PREFIX + ( trackId || 'default' );
		this.lap = 1;
		this.bestLap = loadBest( this.storageKey );
		this.lastLap = null;
		this.currentLapTime = 0;
		this.running = false;

		this.lineCenter = new THREE.Vector3();
		this.lineForward = new THREE.Vector3( 0, 0, 1 );
		this.lineRight = new THREE.Vector3( 1, 0, 0 );

		this.prevForwardProj = null;

		this.cellSize = CELL_RAW * GRID_SCALE;
		this.requiredCells = new Set();
		this.visitedCells = new Set();

		const list = cells || TRACK_CELLS;
		this.enabled = list.some( ( c ) => c[ 2 ] === FINISH );

		if ( this.enabled ) {

			const spawn = computeSpawnPosition( list );
			this.lineCenter.set( spawn.position[ 0 ], 0, spawn.position[ 2 ] );
			this.lineForward.set( Math.sin( spawn.angle ), 0, Math.cos( spawn.angle ) );
			this.lineRight.set( this.lineForward.z, 0, - this.lineForward.x );

			for ( const c of list ) {

				if ( c[ 2 ] !== FINISH ) this.requiredCells.add( c[ 0 ] + ',' + c[ 1 ] );

			}

			this.buildUI();

		}

	}

	buildUI() {

		const style = document.createElement( 'style' );
		style.textContent = `
			#lap-timer {
				position: absolute;
				top: 12px;
				left: 12px;
				color: #fff;
				font: 600 13px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
				background: rgba(0,0,0,0.5);
				padding: 10px 14px;
				border-radius: 10px;
				line-height: 1.4;
				text-shadow: 0 1px 2px rgba(0,0,0,0.6);
				user-select: none;
				pointer-events: none;
				z-index: 10;
				min-width: 140px;
				backdrop-filter: blur(8px);
				-webkit-backdrop-filter: blur(8px);
			}
			#lap-timer .row { display: flex; justify-content: space-between; gap: 12px; }
			#lap-timer .label { opacity: 0.65; font-weight: 500; letter-spacing: 0.06em; }
			#lap-timer .current { font: 700 24px/1.1 -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-variant-numeric: tabular-nums; margin: 4px 0 6px; }
			#lap-timer .stat { font-size: 12px; font-variant-numeric: tabular-nums; opacity: 0.9; }
		`;
		document.head.appendChild( style );

		const placeholder = formatTime( null );
		const el = document.createElement( 'div' );
		el.id = 'lap-timer';
		el.innerHTML =
			'<div class="row"><span class="label">LAP</span><span class="lap">1</span></div>' +
			`<div class="current">${ placeholder }</div>` +
			`<div class="row stat"><span class="label">LAST</span><span class="last">${ placeholder }</span></div>` +
			`<div class="row stat"><span class="label">BEST</span><span class="best">${ formatTime( this.bestLap ) }</span></div>`;
		document.body.appendChild( el );

		this.lapEl = el.querySelector( '.lap' );
		this.currentEl = el.querySelector( '.current' );
		this.lastEl = el.querySelector( '.last' );
		this.bestEl = el.querySelector( '.best' );

	}

	update( dt, position, hasInput ) {

		if ( ! this.enabled ) return;
		if ( ! this.running && ! hasInput ) return;
		this.running = true;

		this.currentLapTime += dt;
		this.currentEl.textContent = formatTime( this.currentLapTime );

		const gx = Math.floor( position.x / this.cellSize );
		const gz = Math.floor( position.z / this.cellSize );
		const key = gx + ',' + gz;
		if ( this.requiredCells.has( key ) ) this.visitedCells.add( key );

		_tmp.copy( position ).sub( this.lineCenter );
		const forwardProj = _tmp.dot( this.lineForward );
		const lateralProj = Math.abs( _tmp.dot( this.lineRight ) );

		if ( this.prevForwardProj !== null ) {

			const onLine = lateralProj <= this.cellSize * 0.5;
			const noTeleport = Math.abs( forwardProj - this.prevForwardProj ) < 5;
			const crossedForward = this.prevForwardProj < 0 && forwardProj >= 0;

			if ( onLine && noTeleport && crossedForward ) {

				if ( this.visitedCells.size === this.requiredCells.size ) this.completeLap();
				this.visitedCells.clear();

			}

		}

		this.prevForwardProj = forwardProj;

	}

	completeLap() {

		const isBest = this.bestLap === null || this.currentLapTime < this.bestLap;

		this.lastLap = this.currentLapTime;
		if ( isBest ) {

			this.bestLap = this.currentLapTime;
			saveBest( this.storageKey, this.bestLap );

		}
		this.lap += 1;
		this.currentLapTime = 0;

		this.lapEl.textContent = this.lap;
		this.lastEl.textContent = formatTime( this.lastLap );
		this.bestEl.textContent = formatTime( this.bestLap );

		const color = isBest ? '#5af168' : '#ff6e6e';
		this.currentEl.animate(
			[ { color }, { color }, { color: '#fff' } ],
			{ duration: 1200, easing: 'ease-out' }
		);

	}

}
