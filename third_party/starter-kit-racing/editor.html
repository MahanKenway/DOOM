<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
	<title>Track Editor</title>
	<style>
		* { box-sizing: border-box; }
		body { margin: 0; overflow: hidden; background: #000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
		canvas { display: block; touch-action: none; }

		#toolbar {
			position: absolute;
			bottom: 20px;
			left: 50%;
			transform: translateX(-50%);
			display: flex;
			align-items: center;
			gap: 6px;
			padding: 8px 10px;
			background: rgba(255, 255, 255, 0.92);
			backdrop-filter: blur(12px);
			-webkit-backdrop-filter: blur(12px);
			border-radius: 999px;
			border: 1px solid rgba(0, 0, 0, 0.06);
			box-shadow: 0 10px 30px rgba(0, 0, 0, 0.18);
			z-index: 10;
		}

		#toolbar button {
			padding: 9px;
			border: none;
			border-radius: 999px;
			background: transparent;
			color: #4a5260;
			cursor: pointer;
			transition: all 0.15s;
			display: flex;
			align-items: center;
			justify-content: center;
		}
		#toolbar button svg {
			width: 20px;
			height: 20px;
			display: block;
		}
		#toolbar button:hover {
			background: rgba(0, 0, 0, 0.05);
			color: #1f2430;
		}
		#toolbar button.active {
			background: #1f2430;
			color: #fff;
			box-shadow: 0 2px 6px rgba(31, 36, 48, 0.25);
		}

		.separator {
			width: 1px;
			height: 24px;
			background: rgba(0, 0, 0, 0.1);
			margin: 0 2px;
			flex-shrink: 0;
		}

		#toolbar button.action {
			background: #4caf6a;
			color: #fff;
			box-shadow: 0 2px 6px rgba(76, 175, 106, 0.3);
		}
		#toolbar button.action:hover {
			background: #3f9a5a;
			color: #fff;
		}

		#toolbar button.danger {
			color: #b3603a;
		}
		#toolbar button.danger:hover {
			background: rgba(220, 100, 60, 0.12);
			color: #a64b25;
		}

		#toast {
			position: absolute;
			bottom: 90px;
			left: 50%;
			transform: translateX(-50%);
			padding: 10px 24px;
			background: rgba(255, 255, 255, 0.95);
			backdrop-filter: blur(12px);
			-webkit-backdrop-filter: blur(12px);
			color: #1f2430;
			border-radius: 999px;
			border: 1px solid rgba(0, 0, 0, 0.06);
			box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
			font-size: 13px;
			font-weight: 400;
			opacity: 0;
			transition: opacity 0.3s;
			pointer-events: none;
			z-index: 20;
		}
		#toast.show { opacity: 1; }

		#github-link {
			position: absolute;
			top: 12px;
			right: 12px;
			color: #1f2430;
			background: rgba(255, 255, 255, 0.92);
			padding: 8px;
			border-radius: 999px;
			border: 1px solid rgba(0, 0, 0, 0.06);
			box-shadow: 0 4px 14px rgba(0, 0, 0, 0.18);
			backdrop-filter: blur(12px);
			-webkit-backdrop-filter: blur(12px);
			line-height: 0;
			z-index: 10;
			transition: background 0.15s;
		}
		#github-link:hover { background: #fff; }
		#github-link svg { display: block; width: 20px; height: 20px; }

	</style>
	<script type="importmap">
	{
		"imports": {
			"three": "https://cdn.jsdelivr.net/npm/three@0.185.1/build/three.module.js",
			"three/addons/": "https://cdn.jsdelivr.net/npm/three@0.185.1/examples/jsm/"
		}
	}
	</script>
</head>
<body>
	<a id="github-link" href="https://github.com/mrdoob/Starter-Kit-Racing" aria-label="View source on GitHub">
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-2.05c-3.2.7-3.88-1.36-3.88-1.36-.52-1.34-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.18 1.18.92-.26 1.91-.39 2.89-.39.98 0 1.97.13 2.89.39 2.21-1.5 3.18-1.18 3.18-1.18.62 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.06.78 2.13v3.16c0 .31.21.67.79.56C20.21 21.39 23.5 17.07 23.5 12 23.5 5.65 18.35.5 12 .5z"/></svg>
	</a>
	<div id="toolbar">
		<button id="btn-pan" title="View (3)" aria-label="View">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="5 9 2 12 5 15"/><polyline points="9 5 12 2 15 5"/><polyline points="15 19 12 22 9 19"/><polyline points="19 9 22 12 19 15"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/></svg>
		</button>
		<button id="btn-road" class="active" title="Road (1)" aria-label="Road">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
		</button>
		<button id="btn-erase" title="Erase (2)" aria-label="Erase">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/></svg>
		</button>
		<div class="separator"></div>
		<button id="btn-play" class="action" title="Play track" aria-label="Play track">
			<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
		</button>
		<div class="separator"></div>
		<button id="btn-clear" class="danger" title="Clear track" aria-label="Clear track">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
		</button>
	</div>

	<div id="toast"></div>

	<script type="module">
	import * as THREE from 'three';
	import { ORIENT_DEG, CELL_RAW, GRID_SCALE, encodeCells, decodeCells } from './js/Track.js';
	import { ColorMapGLTFLoader } from './js/Loader.js';

	// ─── Auto-tile lookup ─────────────────────────────────────
	// Bitmask: N=8 S=4 E=2 W=1
	// Corner connectivity: 0°=S+W, 90°=S+E, 180°=N+E, 270°=N+W

	const ORIENT_FLIP = { 0: 10, 10: 0, 16: 22, 22: 16 };

	const AUTOTILE = [
		[ 'track-straight', 0 ],    //  0: isolated
		[ 'track-straight', 16 ],   //  1: W
		[ 'track-straight', 16 ],   //  2: E
		[ 'track-straight', 16 ],   //  3: E+W
		[ 'track-straight', 0 ],    //  4: S
		[ 'track-corner',   0 ],    //  5: S+W
		[ 'track-corner',   16 ],   //  6: S+E
		[ 'track-straight', 16 ],   //  7: S+E+W
		[ 'track-straight', 0 ],    //  8: N
		[ 'track-corner',   22 ],   //  9: N+W
		[ 'track-corner',   10 ],   // 10: N+E
		[ 'track-straight', 16 ],   // 11: N+E+W
		[ 'track-straight', 0 ],    // 12: N+S
		[ 'track-straight', 0 ],    // 13: N+S+W
		[ 'track-straight', 0 ],    // 14: N+S+E
		[ 'track-straight', 0 ],    // 15: N+S+E+W
	];

	// ─── State ────────────────────────────────────────────────

	const grid = new Map(); // "gx,gz" → { type, orient, isFinish, mesh }
	let tool = 'road'; // 'road', 'erase', 'pan'

	function cellKey( gx, gz ) { return gx + ',' + gz; }

	// ─── Renderer ─────────────────────────────────────────────

	const renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.shadowMap.enabled = true;
	renderer.toneMapping = THREE.ACESFilmicToneMapping;
	renderer.toneMappingExposure = 1.0;
	document.body.appendChild( renderer.domElement );

	// ─── Scene ────────────────────────────────────────────────

	const scene = new THREE.Scene();
	scene.background = new THREE.Color( 0xadb2ba );
	scene.fog = new THREE.Fog( 0xadb2ba, 80, 160 );

	const dirLight = new THREE.DirectionalLight( 0xffffff, 5 );
	dirLight.position.set( 11.4, 15, - 5.3 );
	dirLight.castShadow = true;
	dirLight.shadow.mapSize.setScalar( 4096 );
	dirLight.shadow.camera.near = 0.5;
	dirLight.shadow.camera.far = 100;
	dirLight.shadow.camera.left = - 60;
	dirLight.shadow.camera.right = 60;
	dirLight.shadow.camera.top = 60;
	dirLight.shadow.camera.bottom = - 60;
	scene.add( dirLight );

	const hemiLight = new THREE.HemisphereLight( 0xc8d8e8, 0x7a8a5a, 1.5 );
	scene.add( hemiLight );

	// Ground
	const gridSize = 30;
	const cellWorld = CELL_RAW * GRID_SCALE;
	const worldSize = gridSize * cellWorld;

	const groundMat = new THREE.MeshStandardMaterial( { color: 0x328260, metalness: 0 } );
	const ground = new THREE.Mesh( new THREE.PlaneGeometry( worldSize, worldSize ), groundMat );
	ground.rotation.x = - Math.PI / 2;
	ground.position.y = - 0.14;
	ground.receiveShadow = true;
	scene.add( ground );

	// Grid helper
	const gridHelper = new THREE.GridHelper( worldSize, gridSize, 0x1a4a36, 0x1a4a36 );
	gridHelper.position.y = - 0.13;
	gridHelper.material.opacity = 0.25;
	gridHelper.material.transparent = true;
	gridHelper.material.depthTest = false;
	gridHelper.renderOrder = 1;
	scene.add( gridHelper );

	// Track group (mirrors game structure)
	const trackGroup = new THREE.Group();
	trackGroup.position.y = - 0.5;
	trackGroup.scale.setScalar( GRID_SCALE );
	scene.add( trackGroup );

	// Ghost preview group
	const ghostGroup = new THREE.Group();
	ghostGroup.position.y = - 0.5;
	ghostGroup.scale.setScalar( GRID_SCALE );
	scene.add( ghostGroup );
	let ghostMesh = null;

	// ─── Camera (orthographic, top-down) ──────────────────────

	const frustum = 30;
	const aspect = window.innerWidth / window.innerHeight;
	const camera = new THREE.OrthographicCamera(
		- frustum * aspect, frustum * aspect,
		frustum, - frustum,
		0.1, 200
	);
	const cellCenter = 0.5 * CELL_RAW * GRID_SCALE;

	// Shift the cell centered above the toolbar (mirror the toolbar's bottom
	// margin above it so the cell sits in the middle of the visible area).
	function computeCamOffsetZ() {

		const rect = document.getElementById( 'toolbar' ).getBoundingClientRect();
		const pad = window.innerHeight - rect.bottom;
		const reserved = window.innerHeight - rect.top + pad;
		return reserved / window.innerHeight * frustum;

	}

	let camOffsetZ = computeCamOffsetZ();
	camera.position.set( cellCenter, 50, cellCenter + camOffsetZ );
	camera.lookAt( cellCenter, 0, cellCenter + camOffsetZ );

	const camTarget = new THREE.Vector3( cellCenter, 0, cellCenter + camOffsetZ );

	window.addEventListener( 'resize', () => {

		const a = window.innerWidth / window.innerHeight;
		camera.left = - frustum * a;
		camera.right = frustum * a;

		const newOffset = computeCamOffsetZ();
		const dz = newOffset - camOffsetZ;
		camOffsetZ = newOffset;
		camTarget.z += dz;
		camera.position.z += dz;
		camera.lookAt( camTarget.x, 0, camTarget.z );

		camera.updateProjectionMatrix();
		renderer.setSize( window.innerWidth, window.innerHeight );

	} );

	// ─── Load models ──────────────────────────────────────────

	const loader = new ColorMapGLTFLoader();

	const modelNames = [ 'track-straight', 'track-corner', 'track-bump', 'track-finish' ];
	const models = {};

	async function loadModels() {

		const promises = modelNames.map( ( name ) =>
			new Promise( ( resolve, reject ) => {

				loader.load( `models/${ name }.glb`, ( gltf ) => {

					gltf.scene.traverse( ( child ) => {

						if ( child.isMesh ) child.material.side = THREE.FrontSide;

					} );

					models[ name ] = gltf.scene;
					resolve();

				}, undefined, reject );

			} )
		);

		await Promise.all( promises );

	}

	// ─── Auto-tile resolve ────────────────────────────────────

	// Exit bitmask for each piece type/orient
	// Bits: N=8 S=4 E=2 W=1
	function getCellExits( cell ) {

		const t = cell.type;
		const o = cell.orient;

		if ( t === 'track-corner' ) {

			if ( o === 0 ) return 5;    // S+W
			if ( o === 16 ) return 6;   // S+E
			if ( o === 10 ) return 10;  // N+E
			if ( o === 22 ) return 9;   // N+W

		}

		// Straight, finish, bump — all symmetric
		if ( o === 0 || o === 10 ) return 12; // N+S
		return 3; // E+W

	}

	// Check which neighbors have a road exit facing toward this cell
	function getConnectivityMask( gx, gz ) {

		let mask = 0;

		// N neighbor has S exit?
		const n = grid.get( cellKey( gx, gz - 1 ) );
		if ( n && ( getCellExits( n ) & 4 ) ) mask |= 8;

		// S neighbor has N exit?
		const s = grid.get( cellKey( gx, gz + 1 ) );
		if ( s && ( getCellExits( s ) & 8 ) ) mask |= 4;

		// E neighbor has W exit?
		const e = grid.get( cellKey( gx + 1, gz ) );
		if ( e && ( getCellExits( e ) & 1 ) ) mask |= 2;

		// W neighbor has E exit?
		const w = grid.get( cellKey( gx - 1, gz ) );
		if ( w && ( getCellExits( w ) & 2 ) ) mask |= 1;

		return mask;

	}

	// Raw presence mask (any road in adjacent cell)
	function getPresenceMask( gx, gz ) {

		let mask = 0;
		if ( grid.has( cellKey( gx, gz - 1 ) ) ) mask |= 8;
		if ( grid.has( cellKey( gx, gz + 1 ) ) ) mask |= 4;
		if ( grid.has( cellKey( gx + 1, gz ) ) ) mask |= 2;
		if ( grid.has( cellKey( gx - 1, gz ) ) ) mask |= 1;
		return mask;

	}

	// Count bits in a 4-bit mask
	function bitCount( mask ) {

		return ( mask >> 3 & 1 ) + ( mask >> 2 & 1 ) + ( mask >> 1 & 1 ) + ( mask & 1 );

	}

	// Count how many of a cell's exits are connected to neighbors
	function connectedExitCount( gx, gz ) {

		const cell = grid.get( cellKey( gx, gz ) );
		if ( ! cell ) return 0;
		return bitCount( getCellExits( cell ) & getConnectivityMask( gx, gz ) );

	}

	// When a new cell has 3+ neighbors, pick the best pair to connect.
	// Prefer corners over straights, then prefer neighbors with more existing connections.
	const DIR_INFO = [
		{ bit: 8, dx: 0, dz: - 1 }, // N
		{ bit: 4, dx: 0, dz: 1 },   // S
		{ bit: 2, dx: 1, dz: 0 },   // E
		{ bit: 1, dx: - 1, dz: 0 }, // W
	];

	function pickBestPair( mask, gx, gz ) {

		const active = DIR_INFO.filter( d => mask & d.bit );
		if ( active.length <= 2 ) return mask;

		let bestMask = active[ 0 ].bit | active[ 1 ].bit;
		let bestScore = - 1;
		let bestIsCorner = false;

		for ( let i = 0; i < active.length; i ++ ) {

			for ( let j = i + 1; j < active.length; j ++ ) {

				const pairMask = active[ i ].bit | active[ j ].bit;
				const isCorner = ( pairMask !== 3 && pairMask !== 12 ); // not E+W or N+S

				const s1 = connectedExitCount( gx + active[ i ].dx, gz + active[ i ].dz );
				const s2 = connectedExitCount( gx + active[ j ].dx, gz + active[ j ].dz );
				const score = s1 + s2;

				if ( ( isCorner && ! bestIsCorner ) ||
					( isCorner === bestIsCorner && score > bestScore ) ) {

					bestMask = pairMask;
					bestScore = score;
					bestIsCorner = isCorner;

				}

			}

		}

		return bestMask;

	}

	// Only count neighbors that can actually connect:
	// either they already exit toward us, or they have a free (unconnected) exit
	function getAvailableMask( gx, gz ) {

		let mask = 0;
		const dirs = [
			[ 0, - 1, 8, 4 ], // N neighbor, sets N bit, check if neighbor has S exit
			[ 0, 1, 4, 8 ],   // S neighbor, sets S bit, check if neighbor has N exit
			[ 1, 0, 2, 1 ],   // E neighbor, sets E bit, check if neighbor has W exit
			[ - 1, 0, 1, 2 ], // W neighbor, sets W bit, check if neighbor has E exit
		];

		for ( const [ dx, dz, bit, oppBit ] of dirs ) {

			const neighbor = grid.get( cellKey( gx + dx, gz + dz ) );
			if ( ! neighbor ) continue;

			const exits = getCellExits( neighbor );

			// Already has an exit facing us
			if ( exits & oppBit ) { mask |= bit; continue; }

			// Has a free (unconnected) exit — could change to face us
			const conn = getConnectivityMask( gx + dx, gz + dz );
			if ( bitCount( exits & conn ) < 2 ) mask |= bit;

		}

		return mask;

	}

	// Resolve tile for new cells: use available neighbors, pick best pair if 3+
	function resolveNewTile( gx, gz ) {

		const pMask = getAvailableMask( gx, gz );

		if ( bitCount( pMask ) >= 3 ) {

			return AUTOTILE[ pickBestPair( pMask, gx, gz ) ];

		}

		return AUTOTILE[ pMask ];

	}

	function resolveTile( gx, gz ) {

		const cMask = getConnectivityMask( gx, gz );

		// If any neighbor connects toward us, use connectivity-based auto-tile
		if ( cMask !== 0 ) return AUTOTILE[ cMask ];

		// No neighbor connects toward us — orient parallel to nearest road
		const pMask = getPresenceMask( gx, gz );
		if ( pMask !== 0 ) {

			// Find any adjacent road cell and match its direction
			const dirs = [ [ 0, - 1, 8 ], [ 0, 1, 4 ], [ 1, 0, 2 ], [ - 1, 0, 1 ] ];
			for ( const [ dx, dz, bit ] of dirs ) {

				if ( ! ( pMask & bit ) ) continue;
				const neighbor = grid.get( cellKey( gx + dx, gz + dz ) );
				if ( ! neighbor ) continue;

				const exits = getCellExits( neighbor );
				// Match the neighbor's running direction
				if ( exits & 12 ) return [ 'track-straight', 0 ];  // neighbor runs N-S
				if ( exits & 3 ) return [ 'track-straight', 16 ];  // neighbor runs E-W

			}

		}

		return AUTOTILE[ 0 ]; // isolated default

	}

	function placeMesh( gx, gz, cell ) {

		if ( cell.mesh ) trackGroup.remove( cell.mesh );

		const src = models[ cell.type ];
		if ( ! src ) return;

		const mesh = src.clone();
		mesh.position.set( ( gx + 0.5 ) * CELL_RAW, 0.5, ( gz + 0.5 ) * CELL_RAW );
		mesh.rotation.y = THREE.MathUtils.degToRad( ORIENT_DEG[ cell.orient ] || 0 );
		mesh.traverse( ( c ) => {

			if ( c.isMesh ) {

				c.castShadow = true;
				c.receiveShadow = true;

			}

		} );

		trackGroup.add( mesh );
		cell.mesh = mesh;

	}

	function resolveCell( gx, gz ) {

		const key = cellKey( gx, gz );
		const cell = grid.get( key );
		if ( ! cell ) return;

		let baseType, orient;

		if ( ! cell.mesh ) {

			// New cell: connect to neighbors, pick best pair if 3+
			[ baseType, orient ] = resolveNewTile( gx, gz );

		} else {

			// Existing cell: re-resolve, but don't break existing connections
			const cMask = getConnectivityMask( gx, gz );
			const currentExits = getCellExits( cell );
			const currentConnected = currentExits & cMask;

			[ baseType, orient ] = resolveTile( gx, gz );

			// Check if the proposed shape keeps all current connections
			const proposedExits = getCellExits( { type: baseType, orient } );
			if ( ( proposedExits & currentConnected ) !== currentConnected ) {

				// Would disconnect something — keep current shape
				return;

			}

		}

		// Finish cells use track-finish but only when resolved as straight
		const type = ( cell.isFinish && baseType === 'track-straight' ) ? 'track-finish' : baseType;

		// Skip if nothing changed and mesh already exists
		if ( cell.type === type && cell.orient === orient && cell.mesh ) return;

		cell.type = type;
		cell.orient = orient;

		placeMesh( gx, gz, cell );

	}

	function resolveCellAndNeighbors( gx, gz ) {

		resolveCell( gx, gz );
		resolveCell( gx, gz - 1 );
		resolveCell( gx, gz + 1 );
		resolveCell( gx + 1, gz );
		resolveCell( gx - 1, gz );

	}

	// ─── Cell operations ──────────────────────────────────────

	function placeRoad( gx, gz ) {

		const key = cellKey( gx, gz );

		if ( grid.has( key ) ) {

			const cell = grid.get( key );

			// Click on finish tile → flip direction (rotate 180°)
			if ( cell.isFinish ) {

				cell.orient = ORIENT_FLIP[ cell.orient ] ?? cell.orient;
				placeMesh( gx, gz, cell );
				save();

			}

			return;

		}

		grid.set( key, { type: 'track-straight', orient: 0, isFinish: false, mesh: null } );
		resolveCellAndNeighbors( gx, gz );
		save();

	}

	function placeFinish() {

		const cell = { type: 'track-finish', orient: 0, isFinish: true, mesh: null };
		grid.set( cellKey( 0, 0 ), cell );
		placeMesh( 0, 0, cell );

	}

	function eraseRoad( gx, gz ) {

		const key = cellKey( gx, gz );
		if ( ! grid.has( key ) ) return;

		// Don't allow erasing the finish tile
		const cell = grid.get( key );
		if ( cell.isFinish ) return;

		if ( cell.mesh ) trackGroup.remove( cell.mesh );
		grid.delete( key );

		// Re-resolve neighbors
		resolveCell( gx, gz - 1 );
		resolveCell( gx, gz + 1 );
		resolveCell( gx + 1, gz );
		resolveCell( gx - 1, gz );

		save();

	}

	function clearAll() {

		for ( const [ , cell ] of grid ) {

			if ( cell.mesh ) trackGroup.remove( cell.mesh );

		}

		grid.clear();
		placeFinish();
		save();

	}

	// ─── Ghost preview ────────────────────────────────────────

	// Neighbor cells whose meshes are temporarily swapped during ghost preview
	const ghostNeighborBackups = []; // { cell, originalMesh }

	function addGhostPiece( type, orient, gx, gz, opacity ) {

		const src = models[ type ];
		if ( ! src ) return;

		const mesh = src.clone();
		mesh.position.set( ( gx + 0.5 ) * CELL_RAW, 0.5, ( gz + 0.5 ) * CELL_RAW );

		const deg = ORIENT_DEG[ orient ] || 0;
		mesh.rotation.y = THREE.MathUtils.degToRad( deg );

		mesh.traverse( ( c ) => {

			if ( c.isMesh ) {

				c.material = c.material.clone();
				c.material.transparent = true;
				c.material.opacity = opacity;

			}

		} );

		ghostGroup.add( mesh );

	}

	function updateGhost( gx, gz ) {

		clearGhost();

		if ( tool !== 'road' ) return;

		const key = cellKey( gx, gz );
		if ( grid.has( key ) ) return; // already occupied

		// Temporarily insert ghost cell into grid
		const ghostCell = { type: 'track-straight', orient: 0, isFinish: false, mesh: null };
		grid.set( key, ghostCell );

		// Resolve ghost: connect to neighbors, pick best pair if 3+
		const [ type, orient ] = resolveNewTile( gx, gz );

		// Update ghost cell in grid so neighbors see its correct exits
		ghostCell.type = type;
		ghostCell.orient = orient;

		// Show ghost piece
		addGhostPiece( type, orient, gx, gz, 0.4 );

		// Check how neighbors would change and preview those changes
		const neighbors = [ [ gx, gz - 1 ], [ gx, gz + 1 ], [ gx + 1, gz ], [ gx - 1, gz ] ];

		for ( const [ nx, nz ] of neighbors ) {

			const nKey = cellKey( nx, nz );
			const nCell = grid.get( nKey );
			if ( ! nCell ) continue;

			// Re-resolve neighbor, but skip if it would break existing connections
			const nExits = getCellExits( nCell );
			const nConn = getConnectivityMask( nx, nz );
			const nConnected = nExits & nConn;

			const [ newType, newOrient ] = resolveTile( nx, nz );
			const proposedExits = getCellExits( { type: newType, orient: newOrient } );
			if ( ( proposedExits & nConnected ) !== nConnected ) continue;

			const finalType = ( nCell.isFinish && newType === 'track-straight' ) ? 'track-finish' : newType;

			if ( finalType !== nCell.type || newOrient !== nCell.orient ) {

				// Hide the real mesh temporarily
				if ( nCell.mesh ) {

					nCell.mesh.visible = false;
					ghostNeighborBackups.push( { cell: nCell } );

				}

				// Show preview of what the neighbor would become
				addGhostPiece( finalType, newOrient, nx, nz, 0.7 );

			}

		}

		// Remove the temporary ghost cell from the grid
		grid.delete( key );

	}

	function clearGhost() {

		// Restore hidden neighbor meshes
		for ( const { cell } of ghostNeighborBackups ) {

			if ( cell.mesh ) cell.mesh.visible = true;

		}

		ghostNeighborBackups.length = 0;

		// Remove all ghost preview meshes
		while ( ghostGroup.children.length > 0 ) {

			ghostGroup.remove( ghostGroup.children[ 0 ] );

		}

	}

	// ─── Raycasting ───────────────────────────────────────────

	const raycaster = new THREE.Raycaster();
	const mouse = new THREE.Vector2();

	function screenToGrid( clientX, clientY ) {

		mouse.x = ( clientX / window.innerWidth ) * 2 - 1;
		mouse.y = - ( clientY / window.innerHeight ) * 2 + 1;

		raycaster.setFromCamera( mouse, camera );

		const plane = new THREE.Plane( new THREE.Vector3( 0, 1, 0 ), 0.51 );
		const hit = new THREE.Vector3();
		raycaster.ray.intersectPlane( plane, hit );

		if ( ! hit ) return null;

		const gx = Math.floor( hit.x / cellWorld );
		const gz = Math.floor( hit.z / cellWorld );

		return { gx, gz };

	}

	// ─── Persistence ──────────────────────────────────────────

	function save() {

		const arr = [];
		for ( const [ key, cell ] of grid ) {

			const [ gx, gz ] = key.split( ',' ).map( Number );
			arr.push( [ gx, gz, cell.type, cell.orient ] );

		}

		const encoded = encodeCells( arr );
		localStorage.setItem( 'racing-editor-cells', encoded );

	}

	function loadSaved() {

		const params = new URLSearchParams( window.location.search );
		const mapParam = params.get( 'map' );
		const encoded = mapParam || localStorage.getItem( 'racing-editor-cells' );

		if ( ! encoded ) return;

		try {

			const arr = decodeCells( encoded );

			for ( const [ gx, gz, type, orient ] of arr ) {

				const isFinish = ( type === 'track-finish' );
				const cell = { type, orient, isFinish, mesh: null };
				grid.set( cellKey( gx, gz ), cell );
				placeMesh( gx, gz, cell );

			}

		} catch ( e ) {

			console.warn( 'Failed to load saved map', e );

		}

	}

	// ─── Toast ────────────────────────────────────────────────

	let toastTimer = 0;

	function showToast( msg ) {

		const el = document.getElementById( 'toast' );
		el.textContent = msg;
		el.classList.add( 'show' );
		clearTimeout( toastTimer );
		toastTimer = setTimeout( () => el.classList.remove( 'show' ), 2000 );

	}

	// ─── Toolbar ──────────────────────────────────────────────

	const btnRoad = document.getElementById( 'btn-road' );
	const btnErase = document.getElementById( 'btn-erase' );
	const btnPan = document.getElementById( 'btn-pan' );

	function selectTool( t ) {

		tool = t;
		btnRoad.classList.toggle( 'active', t === 'road' );
		btnErase.classList.toggle( 'active', t === 'erase' );
		btnPan.classList.toggle( 'active', t === 'pan' );

		if ( t === 'pan' ) clearGhost();

		updateCursor();

	}

	btnRoad.addEventListener( 'click', () => selectTool( 'road' ) );
	btnErase.addEventListener( 'click', () => selectTool( 'erase' ) );
	btnPan.addEventListener( 'click', () => selectTool( 'pan' ) );

	document.getElementById( 'toolbar' ).addEventListener( 'pointerenter', clearGhost );

	function getCellsArray() {

		const arr = [];
		for ( const [ key, cell ] of grid ) {

			const [ gx, gz ] = key.split( ',' ).map( Number );
			arr.push( [ gx, gz, cell.type, cell.orient ] );

		}

		return arr;

	}

	document.getElementById( 'btn-play' ).addEventListener( 'click', () => {

		if ( grid.size === 0 ) {

			showToast( 'Draw some road first!' );
			return;

		}

		const encoded = encodeCells( getCellsArray() );
		window.open( 'index.html?map=' + encoded, '_blank' );

	} );

	document.getElementById( 'btn-clear' ).addEventListener( 'click', () => {

		if ( ! confirm( 'Clear the entire track?' ) ) return;

		clearAll();
		showToast( 'Track cleared' );

	} );

	// ─── Input (pointer events) ───────────────────────────────

	let isPanning = false;
	let isDrawing = false;
	let isErasing = false;
	let panStart = { x: 0, y: 0 };
	let camStart = { x: 0, z: 0 };
	let lastDrawCell = null;
	let spaceDown = false;

	// Track active pointers for multi-touch (pinch/pan)
	const pointers = new Map();
	let pinchStartDist = 0;
	let pinchStartZoom = 1;

	const el = renderer.domElement;

	function updateCursor() {

		if ( isPanning ) el.style.cursor = 'grabbing';
		else if ( spaceDown || tool === 'pan' ) el.style.cursor = 'grab';
		else el.style.cursor = '';

	}

	el.addEventListener( 'contextmenu', ( e ) => e.preventDefault() );

	function handleDraw( clientX, clientY ) {

		const cell = screenToGrid( clientX, clientY );
		if ( ! cell ) return;

		if ( lastDrawCell && lastDrawCell.gx === cell.gx && lastDrawCell.gz === cell.gz ) return;
		lastDrawCell = cell;

		if ( isErasing ) {

			eraseRoad( cell.gx, cell.gz );

		} else if ( isDrawing ) {

			placeRoad( cell.gx, cell.gz );

		}

	}

	function getPinchDist() {

		const pts = [ ...pointers.values() ];
		const dx = pts[ 1 ].x - pts[ 0 ].x;
		const dy = pts[ 1 ].y - pts[ 0 ].y;
		return Math.sqrt( dx * dx + dy * dy );

	}

	function getPinchMid() {

		const pts = [ ...pointers.values() ];
		return {
			x: ( pts[ 0 ].x + pts[ 1 ].x ) / 2,
			y: ( pts[ 0 ].y + pts[ 1 ].y ) / 2
		};

	}

	el.addEventListener( 'pointerdown', ( e ) => {

		el.setPointerCapture( e.pointerId );
		pointers.set( e.pointerId, { x: e.clientX, y: e.clientY } );

		// Two pointers → switch to pan/pinch
		if ( pointers.size === 2 ) {

			isDrawing = false;
			isErasing = false;
			isPanning = true;

			const mid = getPinchMid();
			panStart.x = mid.x;
			panStart.y = mid.y;
			camStart.x = camTarget.x;
			camStart.z = camTarget.z;
			pinchStartDist = getPinchDist();
			pinchStartZoom = camera.zoom;
			return;

		}

		if ( pointers.size > 2 ) return;

		// Single pointer
		// Middle mouse, ctrl+click, space+click, or pan tool → pan
		if ( e.button === 1 || ( e.button === 0 && ( e.ctrlKey || e.metaKey || spaceDown || tool === 'pan' ) ) ) {

			isPanning = true;
			panStart.x = e.clientX;
			panStart.y = e.clientY;
			camStart.x = camTarget.x;
			camStart.z = camTarget.z;
			updateCursor();
			return;

		}

		if ( e.button === 0 ) {

			if ( tool === 'erase' ) {

				isErasing = true;

			} else {

				isDrawing = true;

			}

			lastDrawCell = null;

			// On touch, defer draw until pointermove confirms single-finger gesture
			if ( e.pointerType !== 'touch' ) handleDraw( e.clientX, e.clientY );

		} else if ( e.button === 2 ) {

			isErasing = true;
			lastDrawCell = null;
			handleDraw( e.clientX, e.clientY );

		}

	} );

	el.addEventListener( 'pointermove', ( e ) => {

		pointers.set( e.pointerId, { x: e.clientX, y: e.clientY } );

		// Two-pointer pan + pinch
		if ( pointers.size === 2 && isPanning ) {

			const mid = getPinchMid();
			const scale = frustum * 2 / window.innerHeight / camera.zoom;
			camTarget.x = camStart.x - ( mid.x - panStart.x ) * scale;
			camTarget.z = camStart.z - ( mid.y - panStart.y ) * scale;
			camera.position.x = camTarget.x;
			camera.position.z = camTarget.z;
			camera.lookAt( camTarget.x, 0, camTarget.z );

			const dist = getPinchDist();
			camera.zoom = Math.max( 0.1, Math.min( 10, pinchStartZoom * ( dist / pinchStartDist ) ) );
			camera.updateProjectionMatrix();
			return;

		}

		// Single-pointer pan
		if ( isPanning ) {

			const zoom = camera.zoom;
			const dx = ( e.clientX - panStart.x ) / window.innerWidth * frustum * 2 * ( window.innerWidth / window.innerHeight ) / zoom;
			const dz = ( e.clientY - panStart.y ) / window.innerHeight * frustum * 2 / zoom;
			camTarget.x = camStart.x - dx;
			camTarget.z = camStart.z - dz;
			camera.position.x = camTarget.x;
			camera.position.z = camTarget.z;
			camera.lookAt( camTarget.x, 0, camTarget.z );
			return;

		}

		if ( isDrawing || isErasing ) {

			handleDraw( e.clientX, e.clientY );
			return;

		}

		// Hover ghost (mouse only)
		if ( e.pointerType === 'mouse' ) {

			const cell = screenToGrid( e.clientX, e.clientY );
			if ( cell ) updateGhost( cell.gx, cell.gz );
			else clearGhost();

		}

	} );

	window.addEventListener( 'pointerup', ( e ) => {

		pointers.delete( e.pointerId );

		if ( pointers.size === 0 ) {

			// Touch tap: if we deferred draw and never moved, draw now
			if ( ( isDrawing || isErasing ) && lastDrawCell === null && ! isPanning ) {

				handleDraw( e.clientX, e.clientY );

			}

			isPanning = false;
			isDrawing = false;
			isErasing = false;
			lastDrawCell = null;
			updateCursor();

		}

	} );

	window.addEventListener( 'pointercancel', ( e ) => {

		pointers.delete( e.pointerId );

	} );

	// Trackpad: two-finger scroll → pan, pinch (ctrl+wheel) → zoom
	el.addEventListener( 'wheel', ( e ) => {

		e.preventDefault();

		if ( e.ctrlKey ) {

			const zoomSpeed = 1.02;
			camera.zoom *= e.deltaY > 0 ? 1 / zoomSpeed : zoomSpeed;
			camera.zoom = Math.max( 0.1, Math.min( 10, camera.zoom ) );
			camera.updateProjectionMatrix();

		} else {

			const scale = frustum * 2 / window.innerHeight / camera.zoom;
			camTarget.x += e.deltaX * scale;
			camTarget.z += e.deltaY * scale;
			camera.position.x = camTarget.x;
			camera.position.z = camTarget.z;
			camera.lookAt( camTarget.x, 0, camTarget.z );

		}

	}, { passive: false } );

	window.addEventListener( 'keydown', ( e ) => {

		if ( e.key === ' ' ) {

			if ( ! spaceDown ) {

				spaceDown = true;
				updateCursor();

			}

			e.preventDefault();

		} else if ( e.key === '1' ) {

			selectTool( 'road' );

		} else if ( e.key === '2' ) {

			selectTool( 'erase' );

		} else if ( e.key === '3' ) {

			selectTool( 'pan' );

		}

	} );

	window.addEventListener( 'keyup', ( e ) => {

		if ( e.key === ' ' ) {

			spaceDown = false;
			updateCursor();

		}

	} );

	// ─── Init & render loop ───────────────────────────────────

	await loadModels();
	loadSaved();

	// Start with a finish cell if the grid is empty
	if ( grid.size === 0 ) {

		placeFinish();

	}

	function animate() {

		requestAnimationFrame( animate );
		renderer.render( scene, camera );

	}

	animate();

	</script>
</body>
</html>
