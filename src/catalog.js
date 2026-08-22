export const COLLECTIONS = [
  {
    id: 'freedoom-phase-1',
    title: 'Freedoom: Phase 1',
    studio: 'Freedoom project',
    year: 'v0.13.0',
    format: 'Bundled IWAD',
    genre: 'Action',
    duration: '4 episodes · 36 maps',
    maps: 'Doom-compatible',
    status: 'Free / bundled',
    license: 'BSD-style free content · attribution retained',
    artwork: 'assets/screenshots/freedoom-phase1.png',
    artworkCredit: 'Screenshot: Freedoom project',
    source: 'assets/freedoom1.wad',
    description: 'A complete, libre Doom-compatible campaign designed as an independent base game. Four episodes make it the natural starting point for classic mapsets.',
    playable: true,
    featured: true,
  },
  {
    id: 'freedoom-phase-2',
    title: 'Freedoom: Phase 2',
    studio: 'Freedoom project',
    year: 'v0.13.0',
    format: 'Bundled IWAD',
    genre: 'Action',
    duration: '32 maps',
    maps: 'Doom II-compatible',
    status: 'Free / bundled',
    license: 'BSD-style free content · attribution retained',
    artwork: 'assets/screenshots/freedoom-phase2.png',
    artworkCredit: 'Screenshot: Freedoom project',
    source: 'assets/freedoom2.wad',
    description: 'A single 32-level campaign built for the Doom II ruleset, including the expanded monster roster and super shotgun used by many community mapsets.',
    playable: true,
  },
  {
    id: 'freedm',
    title: 'FreeDM: Arena Archive',
    studio: 'Freedoom project',
    year: 'v0.13.0',
    format: 'Bundled IWAD',
    genre: 'Action',
    duration: '32 arenas',
    maps: 'Doom II-compatible',
    status: 'Free / bundled · solo exploration',
    license: 'BSD-style free content · attribution retained',
    artwork: 'assets/screenshots/freedm.png',
    artworkCredit: 'Screenshot: Freedoom project',
    source: 'assets/freedm.wad',
    description: 'A libre 32-map deathmatch archive. RetroPlay can launch the levels for local exploration, but it does not add bots, online play or matchmaking.',
    playable: true,
    playLabel: 'Explore archive',
  },
  {
    id: 'hacx-1-2',
    title: 'Hacx: Twitch ’n Kill',
    studio: 'Banjo Software / Hacx project',
    year: 'v1.2 · 2010',
    format: 'Bundled IWAD + PWAD',
    genre: 'Action',
    duration: '21 missions',
    maps: 'Doom II-compatible',
    status: 'Royalty-free / non-commercial bundle',
    license: 'Custom royalty-free license · no commercial use · credit retained',
    artwork: 'assets/screenshots/hacx-gameplay.jpg',
    artworkCredit: 'Gameplay screenshot: Hacx project / Dr Nostromo',
    source: ['assets/freedoom2.wad', 'assets/hacx.wad'],
    allowLayeredIwad: true,
    description: 'A cyberpunk 21-level Doom-engine campaign. This runtime layers the bundled Hacx archive over its bundled Doom II-compatible base, under Hacx’s royalty-free, non-commercial distribution terms.',
    playable: true,
  },
  {
    id: 'blasphemer',
    title: 'Blasphemer',
    studio: 'Blasphemer project / Chocolate Heretic',
    year: 'v0.1.8 WebAssembly runtime',
    format: 'Bundled independent runtime',
    genre: 'Fantasy shooter',
    duration: 'Free campaign + deathmatch',
    maps: 'Bundled Blasphemer Heretic-compatible IWAD',
    status: 'Free / bundled',
    license: 'GPL-2.0-or-later engine and game data · notices retained',
    artwork: 'assets/screenshots/blasphemer-runtime.png',
    artworkCredit: 'Gameplay screenshot: RetroPlay local Blasphemer browser runtime',
    description: 'A complete free dark-fantasy shooter running through Chocolate Heretic in its own WebAssembly module. It bundles the Blasphemer IWAD, starts with no player upload or external game download, keeps configuration and saves in the browser, and provides fullscreen plus PSP-style touch controls.',
    playable: true,
    runtimePath: 'blasphemer.html',
    runtimeLabel: 'Launch Blasphemer',
    catalogState: 'INDEPENDENT RUNTIME',
  },
  {
    id: 'cdogs-sdl',
    title: 'C-Dogs SDL',
    studio: 'C-Dogs SDL project',
    year: 'v2.4.0',
    format: 'Bundled independent runtime',
    genre: 'Action',
    duration: 'Campaigns + dogfights',
    maps: 'Native C-Dogs data',
    status: 'Free / bundled',
    license: 'GPL-2.0 engine · free upstream game data · attribution retained',
    artwork: 'assets/screenshots/cdogs-sdl-browser.png',
    artworkCredit: 'Gameplay screenshot: RetroPlay local C-Dogs SDL browser build',
    description: 'A top-down retro action game running in its own C-Dogs SDL WebAssembly module. It includes the libre upstream campaign and dogfight data, has PSP-style mobile controls and never shares Doom’s WAD loader or game loop.',
    playable: true,
    runtimePath: 'cdogs.html',
    runtimeLabel: 'Launch C-Dogs',
    catalogState: 'INDEPENDENT RUNTIME',
  },
  {
    id: 'gnu-freedink',
    title: 'GNU FreeDink',
    studio: 'GNU FreeDink project',
    year: 'v109.6',
    format: 'Bundled independent runtime',
    genre: 'Exploration',
    duration: 'Complete action-adventure',
    maps: 'Native FreeDink game data',
    status: 'Free / bundled',
    license: 'GPLv3-or-later engine · official redistributable game data · notices retained',
    artwork: 'assets/screenshots/freedink-runtime.png',
    artworkCredit: 'Gameplay screenshot: Duskfire’s Blog / GNU FreeDink',
    description: 'A complete libre 2D action-adventure running in its own GNU FreeDink WebAssembly module. It includes official FreeDink game data, keeps saves inside the browser and has PSP-style touch controls without sharing Doom’s WAD loader or game loop.',
    playable: true,
    runtimePath: 'freedink.html',
    runtimeLabel: 'Launch FreeDink',
    catalogState: 'INDEPENDENT RUNTIME',
  },
  {
    id: 'opentyrian2000',
    title: 'OpenTyrian2000',
    studio: 'OpenTyrian2000 project',
    year: 'Tyrian 2000 freeware release',
    format: 'Bundled independent runtime',
    genre: 'Action',
    duration: 'Campaign + arcade modes',
    maps: 'Native Tyrian 2000 data',
    status: 'Free / bundled',
    license: 'GPLv2-or-later engine · project-documented freeware data · notices retained',
    artwork: 'assets/screenshots/opentyrian-runtime.png',
    artworkCredit: 'Gameplay screenshot: OpenTyrian / LaunchBox Games Database',
    description: 'An arcade vertical shooter running in its own OpenTyrian2000 WebAssembly module. It bundles the project-documented freeware Tyrian 2000 data, persists saves inside the browser and provides PSP-style touch controls without sharing Doom’s WAD loader or game loop.',
    playable: true,
    runtimePath: 'opentyrian.html',
    runtimeLabel: 'Launch OpenTyrian',
    catalogState: 'INDEPENDENT RUNTIME',
  },
  {
    id: 'librequake',
    title: 'LibreQuake',
    studio: 'LibreQuake project / Qwasm',
    year: 'v0.09-beta Lite',
    format: 'Bundled independent runtime',
    genre: 'Action',
    duration: 'Free campaign + arena modes',
    maps: 'Native LibreQuake Lite data',
    status: 'Free / bundled',
    license: 'GPL engine lineage · LibreQuake free game data · notices retained',
    artwork: 'assets/screenshots/librequake-runtime.png',
    artworkCredit: 'Gameplay screenshot: LibreQuake project / Flathub',
    description: 'A first-person action campaign using the classic Quake engine in its own Qwasm WebAssembly module. It bundles independent LibreQuake Lite data, keeps saves in the browser and has PSP-style touch controls without using original Quake assets or sharing Doom’s WAD loader and game loop.',
    playable: true,
    runtimePath: 'librequake.html',
    runtimeLabel: 'Launch LibreQuake',
    catalogState: 'INDEPENDENT RUNTIME',
  },
  {
    id: 'openttd',
    title: 'OpenTTD',
    studio: 'OpenTTD project / OpenGFX / OpenSFX / OpenMSX',
    year: 'v15.3 browser runtime',
    format: 'Bundled independent runtime',
    genre: 'Strategy',
    duration: 'Open-ended transport strategy',
    maps: 'Native OpenTTD procedural worlds',
    status: 'Free / bundled',
    license: 'GPL-2.0 engine + OpenGFX/OpenMSX · OpenSFX attribution notice retained',
    artwork: 'assets/screenshots/openttd-runtime.webp',
    artworkCredit: 'Gameplay screenshot: RetroPlay local OpenTTD browser runtime',
    description: 'A complete transport-strategy game in its own OpenTTD WebAssembly runtime. It bundles the free OpenGFX graphics, OpenSFX effects and OpenMSX music sets, keeps saves in the browser, includes PSP-style touch controls and never asks the player to upload Transport Tycoon Deluxe files.',
    playable: true,
    runtimePath: 'openttd.html',
    runtimeLabel: 'Launch OpenTTD',
    catalogState: 'INDEPENDENT RUNTIME',
  },
  {
    id: 'freerct',
    title: 'FreeRCT',
    studio: 'FreeRCT project',
    year: 'WebAssembly runtime',
    format: 'Bundled independent runtime',
    genre: 'Strategy',
    duration: 'Open-ended theme-park strategy',
    maps: 'Native FreeRCT scenarios and sandbox worlds',
    status: 'Free / bundled',
    license: 'GPL-2.0-only engine and clean-room game data · notices retained',
    artwork: 'assets/screenshots/freerct-runtime.webp',
    artworkCredit: 'Gameplay screenshot: RetroPlay local FreeRCT browser runtime',
    description: 'A complete clean-room theme-park strategy game in its own FreeRCT WebAssembly runtime. It bundles its own libre graphics, rides, scenery and scenarios, keeps saves in the browser and offers PSP-style touch controls without asking players to upload RollerCoaster Tycoon or OpenRCT2 files.',
    playable: true,
    runtimePath: 'freerct.html',
    runtimeLabel: 'Launch FreeRCT',
    catalogState: 'INDEPENDENT RUNTIME',
  },
  {
    id: 'neverball',
    title: 'Neverball',
    studio: 'Neverball project',
    year: 'WebAssembly runtime',
    format: 'Bundled independent runtime',
    genre: 'Experimental',
    duration: '3D physics-puzzle campaign',
    maps: 'Bundled base + Easy set',
    status: 'Free / bundled',
    license: 'GPLv2-or-later engine and base data · notices retained',
    artwork: 'assets/screenshots/neverball-runtime.png',
    artworkCredit: 'Gameplay screenshot: RetroPlay local Neverball browser runtime',
    description: 'A complete 3D physics-puzzle game in its own Neverball WebAssembly runtime. It bundles the libre base game and Easy level set, keeps saves in the browser, includes PSP-style touch controls and never asks the player to upload data or download a campaign.',
    playable: true,
    runtimePath: 'neverball.html',
    runtimeLabel: 'Launch Neverball',
    catalogState: 'INDEPENDENT RUNTIME',
  },
  {
    id: 'armawebtron',
    title: 'Armawebtron',
    studio: 'Glen Harpring / Armawebtron contributors',
    year: 'Bundled browser build',
    format: 'Bundled independent runtime',
    genre: 'Arcade',
    duration: 'Ten-round local arena sessions',
    maps: 'Classic local grid arena plus upstream preset modes',
    status: 'Free / bundled',
    license: 'GPL-2.0-or-later code and retained upstream source / assets',
    artwork: 'assets/screenshots/armawebtron-runtime.webp',
    artworkCredit: 'Gameplay screenshot: RetroPlay local Armawebtron browser runtime',
    description: 'A complete existing open-source 3D lightcycle arena game, bundled from the GPL Armawebtron browser project. It launches immediately into the official Classic local preset with three AI rivals, ten rounds, neon trails, browser-local configuration, PSP touch controls, gamepad support and fullscreen—no account, upload or network server required.',
    playable: true,
    runtimePath: 'armawebtron.html',
    runtimeLabel: 'Launch Armawebtron',
    catalogState: 'UPSTREAM OPEN-SOURCE RUNTIME',
  },
  {
    id: 'tuxracer-js',
    title: 'TuxRacer.js',
    studio: 'Jan Ebbe / Extreme Tux Racer & Tux Racer contributors',
    year: 'Bundled browser build',
    format: 'Bundled independent runtime',
    genre: 'Racing',
    duration: 'Downhill course runs',
    maps: 'Twenty bundled open-source ski courses',
    status: 'Free / bundled',
    license: 'GPL-2.0-only code and retained upstream credits / source',
    artwork: 'assets/screenshots/tuxracer-runtime.webp',
    artworkCredit: 'Gameplay screenshot: RetroPlay local TuxRacer.js browser runtime',
    description: 'A complete existing open-source 3D downhill racer, bundled from the TuxRacer.js project with its penguin, snow courses, music and sound. Race for the finish, collect herring and switch among twenty local courses with keyboard, the game’s touch joystick, RetroPlay PSP controls, gamepad support and fullscreen—no upload, account or external game data required.',
    playable: true,
    runtimePath: 'tuxracer.html',
    runtimeLabel: 'Launch TuxRacer.js',
    catalogState: 'UPSTREAM OPEN-SOURCE RUNTIME',
  },
  {
    id: 'starter-kit-racing',
    title: 'Starter Kit Racing',
    studio: 'mrdoob / Kenney',
    year: 'Pinned Three.js runtime',
    format: 'Bundled independent runtime',
    genre: '3D Racing',
    duration: 'Single-player lap runs',
    maps: 'Bundled mesh track with forest, tents and bumps',
    status: 'Free / bundled',
    license: 'MIT upstream source · Kenney CC0 glTF models · notices retained',
    artwork: 'assets/screenshots/starter-kit-racing-runtime.webp',
    artworkCredit: 'Gameplay screenshot: RetroPlay local Starter Kit Racing browser runtime',
    description: 'A complete existing Three.js driving game from mrdoob’s Starter Kit Racing. Accelerate a physical truck around a fully local track with real glTF road, forest, tent and vehicle meshes, lighting, smoke trails and lap timing—fully local with keyboard, PSP touch controls, gamepad support and fullscreen, without an account, upload, server or remote playable content.',
    playable: true,
    runtimePath: 'starter-kit-racing.html',
    runtimeLabel: 'Launch Starter Kit Racing',
    catalogState: 'UPSTREAM OPEN-SOURCE RUNTIME',
  },
  {
    id: 'astray',
    title: 'Astray',
    studio: 'wwwtyro / Astray contributors',
    year: 'Pinned WebGL runtime',
    format: 'Bundled independent runtime',
    genre: 'Physics Maze',
    duration: 'Procedural maze progression',
    maps: 'Infinite locally generated three-dimensional mazes',
    status: 'Free / bundled',
    license: 'Unlicense / public-domain upstream source · notices retained',
    artwork: 'assets/screenshots/astray-runtime.webp',
    artworkCredit: 'Gameplay screenshot: RetroPlay local Astray browser runtime',
    description: 'A complete existing WebGL physics-maze game, bundled from the Astray project. Roll a steel ball through dark three-dimensional brick labyrinths, build momentum around corners and reach an exit that generates the next, larger maze—fully local with keyboard, PSP touch controls, gamepad support and fullscreen, without an account, upload, server or external game data.',
    playable: true,
    runtimePath: 'astray.html',
    runtimeLabel: 'Launch Astray',
    catalogState: 'UPSTREAM OPEN-SOURCE RUNTIME',
  },
  {
    id: 'neon-rift',
    title: 'Neon Rift',
    studio: 'RetroPlay',
    year: 'Original browser runtime',
    format: 'Bundled independent runtime',
    genre: 'Racing',
    duration: 'Three-rift night race',
    maps: 'Procedural low-poly signal route',
    status: 'Free / bundled',
    license: 'RetroPlay original runtime · non-commercial platform deployment',
    artwork: 'assets/screenshots/neon-rift-runtime.webp',
    artworkCredit: 'Gameplay screenshot: RetroPlay local Neon Rift runtime',
    description: 'An original low-poly 3D night racer built for RetroPlay. Thread three escalating rifts, collect signal cores, protect your boost and clear the route with keyboard, PSP-style touch controls, gamepad support and fullscreen—no upload, account or external game data required.',
    playable: true,
    runtimePath: 'neon-rift.html',
    runtimeLabel: 'Launch Neon Rift',
    catalogState: 'INDEPENDENT RUNTIME',
  },
  {
    id: 'obsidian-relay',
    title: 'Obsidian Relay',
    studio: 'RetroPlay',
    year: 'Original browser runtime',
    format: 'Bundled OpenResident WebGL2/WASM runtime',
    genre: 'Survival',
    duration: 'Compact relay-station survival run',
    maps: 'Original procedural deep-relay station',
    status: 'Free / bundled',
    license: 'RetroPlay original gameplay and assets · OpenResident adapter source retained under BSD-2-Clause · non-commercial platform deployment',
    artwork: 'assets/screenshots/obsidian-relay-runtime.webp',
    artworkCredit: 'Gameplay screenshot: RetroPlay local Obsidian Relay browser runtime',
    description: 'An original 3D survival-exploration game built through RetroPlay’s OpenResident WebGL2/WebAssembly renderer path. Recover two signal cells, restore a stranded deep-sea relay and reach the emergency bulkhead while hostile echoes pursue you—fully bundled with keyboard, PSP-style touch controls, gamepad support and fullscreen.',
    playable: true,
    runtimePath: 'shadow-station.html',
    runtimeLabel: 'Launch Obsidian Relay',
    catalogState: 'ORIGINAL 3D RUNTIME',
  },
  {
    id: 'hexgl',
    title: 'HexGL',
    studio: 'BKcore / Thibaut Despoulain',
    year: 'Pinned WebGL runtime',
    format: 'Bundled independent runtime',
    genre: 'Racing',
    duration: 'Cityscape time trial',
    maps: 'Native Cityscape track and ship assets',
    status: 'Free / bundled · non-commercial package',
    license: 'MIT root code · retained CC BY-NC / CC BY asset notices',
    artwork: 'assets/screenshots/hexgl-runtime.webp',
    artworkCredit: 'Gameplay screenshot: RetroPlay local HexGL browser runtime',
    description: 'A fast, futuristic 3D WebGL racer in its own fully local runtime. It bundles the Cityscape course, ship, texture, geometry and audio assets, launches straight into a race without uploads or external game data, and includes fullscreen, gamepad and PSP-style touch controls.',
    playable: true,
    runtimePath: 'hexgl.html',
    runtimeLabel: 'Launch HexGL',
    catalogState: 'INDEPENDENT RUNTIME',
  },
  {
    id: 'hextris',
    title: 'Hextris',
    studio: 'Logan Engstrom, Garrett Finucane, Noah Moroze & Michael Yang',
    year: 'Pinned HTML5 runtime',
    format: 'Bundled independent runtime',
    genre: 'Arcade Puzzle',
    duration: 'Endless score run',
    maps: 'Procedural color-block waves',
    status: 'Free / bundled',
    license: 'GPL-3.0-or-later · source and notices retained',
    artwork: 'assets/screenshots/hextris-runtime.webp',
    artworkCredit: 'Gameplay screenshot: RetroPlay local Hextris browser runtime',
    description: 'A fast arcade-puzzle game running as a complete local HTML5 runtime. Rotate the hexagonal ring, group matching colors and survive accelerating block waves from first load with keyboard, gamepad or PSP-style touch controls — no upload, account, advertising service or external game data required.',
    playable: true,
    runtimePath: 'hextris.html',
    runtimeLabel: 'Launch Hextris',
    catalogState: 'INDEPENDENT RUNTIME',
  },
  {
    id: 'rocksndiamonds',
    title: "Rocks'n'Diamonds",
    studio: 'Artsoft Entertainment / Holger Schemel',
    year: 'v4.4.2.4 WebAssembly runtime',
    format: 'Bundled independent runtime',
    genre: 'Rock & Gem Action Puzzle',
    duration: 'Classic level sets + endless exploration',
    maps: 'Bundled Emeralds, Diamonds, Pearls and Crystals levels',
    status: 'Free / bundled',
    license: 'GPL-2.0-or-later engine and included game data · notices retained',
    artwork: 'assets/screenshots/rocksndiamonds-runtime.webp',
    artworkCredit: "Gameplay screenshot: RetroPlay local Rocks'n'Diamonds browser runtime",
    description: 'A complete rock-and-gem action puzzle compiled from the official Rocks’n’Diamonds source. Dig, collect gems and evade hazards through the bundled classic level sets from first load with keyboard, gamepad or PSP-style touch controls — no upload, original game data or network service required.',
    playable: true,
    runtimePath: 'rocksndiamonds.html',
    runtimeLabel: "Launch Rocks'n'Diamonds",
    catalogState: 'INDEPENDENT RUNTIME',
  },
  {
    id: 'beats-into-shapes',
    title: 'Beats into Shapes',
    studio: 'CoCoSol & Edmond · Youth Hacking 4 Freedom 2024',
    year: 'Godot Web runtime',
    format: 'Bundled independent runtime',
    genre: 'Rhythm',
    duration: 'Four original forge tracks',
    maps: 'Native timing lanes and progression',
    status: 'Free / bundled',
    license: 'GPL-3.0-or-later game · MIT isolation worker · notices retained',
    artwork: 'assets/screenshots/beats-into-shapes-runtime.webp',
    artworkCredit: 'Gameplay screenshot: RetroPlay local Beats into Shapes browser runtime',
    description: 'A full rhythm-forge game running from the official Godot Web release in its own local WebGL 2 runtime. Hit left, centre and right lanes to forge shapes in time with four bundled original tracks; browser-local progress, fullscreen, gamepad and PSP-style touch controls are ready without an upload, account or remote playable data.',
    playable: true,
    runtimePath: 'beats-into-shapes.html',
    runtimeLabel: 'Launch Beats into Shapes',
    catalogState: 'INDEPENDENT RUNTIME',
  },
  {
    id: '2048',
    title: '2048',
    studio: 'Gabriele Cirulli & contributors',
    year: 'Original HTML5 runtime',
    format: 'Bundled independent runtime',
    genre: 'Arcade Puzzle',
    duration: 'Endless number-puzzle runs',
    maps: 'Local board, swipe and score logic',
    status: 'Free / bundled',
    license: 'MIT · source and notices retained',
    artwork: 'assets/screenshots/2048-runtime.webp',
    artworkCredit: 'Gameplay screenshot: RetroPlay local 2048 browser runtime',
    description: 'The original 2048 number puzzle bundled as a local HTML5 game. Slide tiles with keyboard, swipe, gamepad or PSP-style controls; its best score stays in the browser and no account, upload or online score service is required.',
    playable: true,
    runtimePath: '2048.html',
    runtimeLabel: 'Launch 2048',
    catalogState: 'INDEPENDENT RUNTIME',
  },
  {
    id: 'javascript-tetris',
    title: 'JavaScript Tetris',
    studio: 'Jake Gordon & Richard Birkby',
    year: 'Pinned HTML5 Canvas runtime',
    format: 'Bundled independent runtime',
    genre: 'Arcade Puzzle',
    duration: 'Endless line-clearing runs',
    maps: 'Local canvas board and texture',
    status: 'Free / bundled',
    license: 'MIT · source and notices retained',
    artwork: 'assets/screenshots/javascript-tetris-runtime.webp',
    artworkCredit: 'Gameplay screenshot: RetroPlay local JavaScript Tetris browser runtime',
    description: 'A compact canvas version of the block-stacking classic that begins on launch. Rotate, shift and drop pieces using keyboard, gamepad or PSP-style touch controls, with no ROM, account, upload or external playable data.',
    playable: true,
    runtimePath: 'javascript-tetris.html',
    runtimeLabel: 'Launch Tetris',
    catalogState: 'INDEPENDENT RUNTIME',
  },
  {
    id: 'adarkroom',
    title: 'A Dark Room',
    studio: 'Michael Townsend & contributors',
    year: 'v1.4 browser runtime',
    format: 'Bundled independent runtime',
    genre: 'Exploration',
    duration: 'Branching survival adventure',
    maps: 'Local story, encounters, audio and translations',
    status: 'Free / bundled',
    license: 'MPL-2.0 · source and notices retained',
    artwork: 'assets/screenshots/adarkroom-runtime.webp',
    artworkCredit: 'Gameplay screenshot: RetroPlay local A Dark Room browser runtime',
    description: 'A minimalist survival adventure that unfolds from its first fire into a wider world. Story, sound, translations and saves are local to the browser, with direct touch interaction, fullscreen and no account, upload or remote game data.',
    playable: true,
    runtimePath: 'adarkroom.html',
    runtimeLabel: 'Enter A Dark Room',
    catalogState: 'INDEPENDENT RUNTIME',
  },
  {
    id: 'digger-remastered',
    title: 'Digger Remastered',
    studio: 'Digger Remastered contributors',
    year: 'SDL2 / WebAssembly runtime',
    format: 'Bundled independent runtime',
    genre: 'Action',
    duration: 'Classic digging-action runs',
    maps: 'Upstream local game logic and score table',
    status: 'Free / bundled',
    license: 'Historical mixed upstream notices retained',
    artwork: 'assets/screenshots/digger-runtime.webp',
    artworkCredit: 'Gameplay screenshot: RetroPlay local Digger Remastered WebAssembly runtime',
    description: 'A fully local SDL2/WebAssembly build of the remastered 1983 digging-action classic. Collect emeralds, manage falling gold bags and escape Hobbins with keyboard, gamepad or PSP-style touch controls—without an upload or external game service.',
    playable: true,
    runtimePath: 'digger.html',
    runtimeLabel: 'Launch Digger',
    catalogState: 'INDEPENDENT RUNTIME',
  },
  {
    id: 'ancient-aliens',
    title: 'Ancient Aliens',
    studio: 'skillsaw & collaborators',
    year: 'v1.2 · 2016',
    format: 'Doom II PWAD · Boom',
    genre: 'Action',
    duration: '32 maps',
    maps: 'Boom-compatible',
    status: 'External engine required',
    license: 'Project download only · not bundled by RetroPlay',
    artwork: 'assets/screenshots/ancient-aliens-gameplay.jpg',
    artworkCredit: 'Gameplay screenshot: Ancient Aliens project / ModDB',
    description: 'A colorful 32-map synthwave megawad with custom music and a Boom-compatible ruleset. Use a compatible source port such as Woof! or DSDA-Doom; its files are not bundled here.',
    downloadUrl: 'https://www.moddb.com/games/doom-ii/addons/ancient-aliens',
    downloadLabel: 'Download Ancient Aliens',
    downloadNote: 'Official ModDB release · requires a lawful Doom II base IWAD.',
    playable: false,
    projectUrl: 'https://www.moddb.com/games/doom-ii/addons/ancient-aliens',
    projectLabel: 'View official release',
  },
  {
    id: 'eviternity',
    title: 'Eviternity',
    studio: 'Dragonfly & team',
    year: '2019',
    format: 'Doom II PWAD · Boom',
    genre: 'Exploration',
    duration: '32 maps',
    maps: 'Boom-compatible',
    status: 'External engine required',
    license: 'Project download only · not bundled by RetroPlay',
    artwork: 'assets/screenshots/eviternity-gameplay.jpg',
    artworkCredit: 'Gameplay screenshot: Eviternity project / ModDB',
    description: 'A six-chapter Doom II megawad built around distinct visual worlds and Boom features. Open its release with a Boom-capable port; the current browser runtime does not claim that compatibility.',
    downloadUrl: 'https://www.moddb.com/mods/eviternity',
    downloadLabel: 'Download Eviternity',
    downloadNote: 'Official ModDB release · requires a lawful Doom II base IWAD.',
    playable: false,
    projectUrl: 'https://www.moddb.com/mods/eviternity',
    projectLabel: 'View official release',
  },
  {
    id: 'back-to-saturn-x-e1',
    title: 'Back to Saturn X: E1',
    studio: 'BTSX team',
    year: '2012–2017',
    format: 'Doom II PWAD pair',
    genre: 'Exploration',
    duration: '25 maps + 2 secrets',
    maps: 'Doom II / Chocolate-compatible',
    status: 'Download project WADs locally',
    license: 'Project download only · not bundled by RetroPlay',
    artwork: 'assets/screenshots/back-to-saturn-x-gameplay.jpg',
    artworkCredit: 'Gameplay screenshot: Back to Saturn X project / ModDB',
    description: 'A polished two-WAD science-fiction episode with custom art and music. The project release supplies both PWAD files; add them locally to a compatible Doom II base archive.',
    downloadUrl: 'https://www.doomworld.com/files/file/18748-back-to-saturn-x-e1-get-out-of-my-stations/',
    downloadLabel: 'Download BTSX: Episode 1',
    downloadNote: 'Official Doomworld file page · requires a lawful Doom II base IWAD.',
    playable: false,
    projectUrl: 'https://www.moddb.com/mods/back-to-saturn-x',
    projectLabel: 'View official release',
    catalogState: 'OFFICIAL DOWNLOAD',
  },
  {
    id: 'adventures-of-square',
    title: 'The Adventures of Square',
    studio: 'BigBrik Games',
    year: 'Secant Edition',
    format: 'Standalone GZDoom total conversion',
    genre: 'Experimental',
    duration: '19 levels + 3 secrets',
    maps: 'GZDoom package required',
    status: 'External engine required',
    license: 'Official package only · not bundled by RetroPlay',
    artwork: 'assets/screenshots/adventures-of-square-gameplay.png',
    artworkCredit: 'Gameplay screenshot: BigBrik Games / Square press kit',
    description: 'A colorful standalone total conversion with its own modified GZDoom package, music, voice work and controller support. RetroPlay links to the official project rather than repackaging its files.',
    downloadUrl: 'https://bigbrikgames.itch.io/square',
    downloadLabel: 'Download Square v2.1',
    downloadNote: 'Official BigBrik Games itch.io package for Windows and macOS.',
    playable: false,
    projectUrl: 'http://adventuresofsquare.com/',
    projectLabel: 'View official project',
  },
  {
    id: 'plutonia',
    title: 'The Plutonia Experiment',
    studio: 'Casali brothers / Final Doom',
    year: '1996',
    format: 'Commercial IWAD',
    genre: 'Horror',
    duration: '32 maps',
    maps: 'Final Doom campaign',
    status: 'Requires your legal IWAD',
    license: 'Not bundled or hosted by RetroPlay',
    artwork: 'assets/screenshots/plutonia-gateway-of-hell.webp',
    artworkCredit: 'Gameplay screenshot: Doom Wiki / Fandom · MAP30: The Gateway of Hell',
    description: 'A demanding Final Doom campaign known for compressed combat spaces and high-pressure encounters. RetroPlay can launch a lawfully owned copy selected from your device, but does not distribute this IWAD.',
    downloadUrl: 'https://store.steampowered.com/app/2290/Final_DOOM/',
    downloadLabel: 'Buy Final DOOM on Steam',
    downloadNote: 'Official commercial store page; RetroPlay does not host the IWAD.',
    playable: false,
  },
  {
    id: 'tnt-evilution',
    title: 'TNT: Evilution',
    studio: 'TeamTNT / Final Doom',
    year: '1996',
    format: 'Commercial IWAD',
    genre: 'Exploration',
    duration: '32 maps',
    maps: 'Final Doom campaign',
    status: 'Requires your legal IWAD',
    license: 'Not bundled or hosted by RetroPlay',
    artwork: 'assets/screenshots/tnt-steel-works.webp',
    artworkCredit: 'Gameplay screenshot: Doom Wiki / Fandom · MAP14: Steel Works',
    description: 'A Final Doom campaign with industrial spaces, larger progression routes and authored set pieces. Attach a legally acquired TNT IWAD from your device to play it here.',
    downloadUrl: 'https://store.steampowered.com/app/2290/Final_DOOM/',
    downloadLabel: 'Buy Final DOOM on Steam',
    downloadNote: 'Official commercial store page; RetroPlay does not host the IWAD.',
    playable: false,
  },
  {
    id: 'community-slot',
    title: 'Community WAD shelf',
    studio: 'License-reviewed import',
    year: 'Your archive',
    format: 'IWAD + PWAD',
    genre: 'Experimental',
    duration: 'Variable',
    maps: 'Mapset or patch',
    status: 'Attach a compatible WAD',
    license: 'Only archives you have the right to use',
    artwork: 'assets/screenshots/freedoom-phase2.png',
    artworkCredit: 'Gameplay screenshot: Freedoom project · example compatible runtime',
    description: 'A local route for compatible mapsets and experiments. Attach one base IWAD and up to three PWADs; files stay in this browser session and are never uploaded by RetroPlay.',
    downloadUrl: 'https://freedoom.github.io/download.html',
    downloadLabel: 'Download free Freedoom base',
    downloadNote: 'Optional free base IWAD; download a mapset only from its own official release.',
    playable: false,
  },
  {
    id: 'ecwolf',
    title: 'ECWolf',
    studio: 'ECWolf project / ECWolf JS',
    year: 'Emscripten runtime',
    format: 'Local-data independent runtime',
    genre: 'Action',
    duration: 'Compatible local campaigns',
    maps: 'Player-provided lawful data',
    status: 'Engine bundled / data local',
    license: 'GPL engine resources · original game data not distributed',
    artwork: 'assets/screenshots/ecwolf-runtime.png',
    artworkCredit: 'Gameplay screenshot: ECWolf / DieHard Wolfers',
    description: 'A Wolfenstein-compatible ECWolf WebAssembly engine with PSP-style controls, browser-local storage and stable fullscreen. RetroPlay ships only the engine resources: select a complete lawful compatible game-data set locally to launch it, with no original game files uploaded or bundled.',
    downloadUrl: 'https://maniacsvault.net/ecwolf/download.php',
    downloadLabel: 'Get supported Wolf3D data',
    downloadNote: 'Official ECWolf data options page, including legal store and supported shareware paths.',
    playable: true,
    runtimePath: 'ecwolf.html',
    runtimeLabel: 'Launch ECWolf',
    catalogState: 'LOCAL DATA RUNTIME',
  },
  {
    id: 'openresident-research',
    title: 'OpenResident',
    studio: 'XProger',
    year: 'Engine research',
    format: 'Resident Evil engine',
    genre: 'Horror',
    duration: 'Prototype track',
    maps: 'Native data required',
    status: 'WebAssembly study · not playable',
    license: 'BSD 2-Clause engine code · no game data bundled',
    artwork: 'assets/screenshots/openresident-gameplay.webp',
    artworkCredit: 'Gameplay screenshot: XProger/OpenResident README',
    description: 'An open C engine studied for a future browser port. The upstream source has no Resident Evil game data and currently targets X11/GLX or Win32/WGL, so RetroPlay does not package, emulate or launch it as a game.',
    downloadNote: 'No legal Resident Evil game-data download is provided here; this entry links only to the engine source and stays non-playable.',
    playable: false,
    probePath: 'openresident.html',
    projectUrl: 'https://github.com/XProger/OpenResident',
    projectLabel: 'Open WebGL2 probe',
  },
  {
    id: 'supertuxkart',
    title: 'SuperTuxKart',
    studio: 'SuperTuxKart team',
    year: 'v1.5 stable release',
    format: 'Full-game desktop download',
    genre: 'Racing',
    duration: 'Arcade cups, time trials and battle modes',
    maps: 'Open-source 3D tracks and characters',
    status: 'Free full game / download required',
    license: 'GPLv3-or-later game and bundled open assets',
    artwork: 'assets/screenshots/supertuxkart-runtime.jpg',
    artworkCredit: 'Official screenshot: SuperTuxKart 1.5 release',
    description: 'A polished 3D open-source kart racer with the bright arcade energy of late-1990s console racers. Download the complete game from its official release page for cups, time trials, battle modes and local multiplayer; RetroPlay links to the official build rather than repackaging a desktop game.',
    projectUrl: 'https://supertuxkart.net/Download',
    projectLabel: 'Open official download page',
    downloadUrl: 'https://github.com/supertuxkart/stk-code/releases/download/1.5/SuperTuxKart-1.5-linux-x86_64.tar.gz',
    downloadLabel: 'Direct Linux x86_64 v1.5 download',
    downloadNote: 'Official full-game release. Use the official download page above for Windows, macOS, Android and other supported platforms.',
    playable: false,
    catalogState: 'OFFICIAL DOWNLOAD',
  },
];

const FEATURED_ORDER = [
  'hexgl',
  'ecwolf',
  'astray',
  'tuxracer-js',
  'starter-kit-racing',
  'neverball',
  'freerct',
  'openttd',
  'librequake',
  'opentyrian2000',
  'gnu-freedink',
  'blasphemer',
  'hacx-1-2',
  'freedoom-phase-1',
  'freedoom-phase-2',
];

const LIBRARY_KEY = 'retroplay-library-v2';
const LEGACY_LIBRARY_KEYS = ['riftwad-library-v2', 'riftwad-library-v1', 'retroplay-library-v1'];

export class CatalogController {
  #onPlay;
  #onImport;
  #activeGenre = 'All';
  #query = '';
  #pinned = new Set();
  #selectedId = FEATURED_ORDER[0];
  #featuredIndex = 0;
  #featuredInterval = null;
  #featuredTransition = null;
  #motionObserver = null;
  #motionEnabled = false;
  #tiltFrame = null;
  #tiltState = null;
  #quickView = null;
  #depthDeck = null;
  #depthDeckPosition = 0;
  #depthDeckDrag = null;
  #depthDeckWheelTimer = null;
  #catalogDepth = 0.78;
  #lastResultCount = null;
  #countFrame = null;

  constructor({ onPlayGame, onImportWad }) {
    this.#onPlay = onPlayGame;
    this.#onImport = onImportWad;
  }

  init() {
    this.#pinned = this.#readLibrary();
    this.#wireControls();
    this.#wireFeaturedCarousel();
    this.#wireElasticDepthControl();
    this.#wireMotionSystem();
    this.render();
    this.#selectGame(this.#featuredGames()[0] ?? COLLECTIONS[0], false, false);
    this.#startFeaturedAutoplay();
  }

  render() {
    const filtered = this.#filteredItems();
    const grid = document.getElementById('catalog-grid');
    const count = document.getElementById('result-count');
    if (grid) grid.innerHTML = this.#catalogMarkup(filtered);
    if (count) this.#renderResultCount(count, filtered.length);
    this.#renderLibrary();
    this.#renderCollectionStats();
    this.#applyMotionTargets();
  }

  #renderResultCount(element, nextCount) {
    const format = (value) => `${String(value).padStart(2, '0')} records`;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const startCount = this.#lastResultCount;
    this.#lastResultCount = nextCount;
    if (this.#countFrame) cancelAnimationFrame(this.#countFrame);
    if (startCount === null || startCount === nextCount || reduced || document.hidden) {
      element.textContent = format(nextCount);
      return;
    }
    const startedAt = performance.now();
    const duration = 320;
    const tick = (now) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = format(Math.round(startCount + (nextCount - startCount) * eased));
      if (progress < 1) this.#countFrame = requestAnimationFrame(tick);
      else this.#countFrame = null;
    };
    this.#countFrame = requestAnimationFrame(tick);
  }

  focusCatalog(genre = 'All') {
    this.#activeGenre = genre;
    this.#syncGenreButtons();
    this.render();
    document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  #featuredGames() {
    return FEATURED_ORDER.map((id) => COLLECTIONS.find((game) => game.id === id)).filter(Boolean);
  }

  #catalogMarkup(filtered) {
    if (!filtered.length) return '<p class="catalog-empty">No games match this filter. Reset the filters to see the full library.</p>';
    const allowed = new Set(filtered.map((game) => game.id));
    const primary = this.#featuredGames().filter((game) => allowed.has(game.id));
    const primaryIds = new Set(primary.map((game) => game.id));
    const more = filtered.filter((game) => !primaryIds.has(game.id));
    const group = (label, title, note, games, offset, extraClass = '') => !games.length ? '' : `<section class="catalog-group ${extraClass}"><header class="catalog-group-heading"><span>${label}</span><div><h3>${title}</h3><p>${note}</p></div><b>${String(games.length).padStart(2, '0')}</b></header><div class="catalog-grid">${games.map((game, index) => this.#cardTemplate(game, offset + index)).join('')}</div></section>`;
    return `${group('// PRIME', 'Featured Games', 'The rotating playable selection at the top of RetroPlay.', primary, 0, 'catalog-group-featured')}${group('// ARCHIVE', 'And More Games', 'More engines, worlds, downloads and experiments in the RetroPlay archive.', more, primary.length, 'catalog-group-more')}`;
  }

  #wireFeaturedCarousel() {
    const panel = document.querySelector('.featured-panel');
    document.getElementById('featured-prev')?.addEventListener('click', () => this.#stepFeatured(-1, true));
    document.getElementById('featured-next')?.addEventListener('click', () => this.#stepFeatured(1, true));
    panel?.addEventListener('pointerenter', () => { panel.classList.add('is-paused'); this.#stopFeaturedAutoplay(); });
    panel?.addEventListener('pointerleave', () => { panel.classList.remove('is-paused'); this.#startFeaturedAutoplay(); });
    panel?.addEventListener('focusin', () => { panel.classList.add('is-paused'); this.#stopFeaturedAutoplay(); });
    panel?.addEventListener('focusout', () => window.setTimeout(() => {
      if (!panel.contains(document.activeElement)) { panel.classList.remove('is-paused'); this.#startFeaturedAutoplay(); }
    }, 0));
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.#stopFeaturedAutoplay(); else this.#startFeaturedAutoplay();
    });
    const quality = document.documentElement.dataset.visualQuality;
    if (quality !== 'static') this.#mountFeaturedDepthDeck();
    window.addEventListener('retroplay:themechange', () => this.#layoutFeaturedDepthDeck(this.#depthDeckPosition, false));
  }

  #mountFeaturedDepthDeck() {
    const media = document.querySelector('.featured-media');
    const games = this.#featuredGames();
    if (!media || !games.length) return;
    const root = document.createElement('div');
    root.className = 'depth-deck';
    root.tabIndex = 0;
    root.setAttribute('role', 'group');
    root.setAttribute('aria-label', 'Featured games depth deck. Drag or use left and right arrow keys to browse.');
    root.innerHTML = `<div class="depth-deck-stage">${games.map((game, index) => `<button class="depth-deck-card" data-depth-index="${index}" aria-label="Show ${game.title}"><img src="${game.artwork}" alt="" draggable="false" /><span>${String(index + 1).padStart(2, '0')}</span></button>`).join('')}</div><span class="depth-deck-hint" aria-hidden="true">DRAG / DEPTH</span>`;
    media.append(root);
    this.#depthDeck = root;
    const setFocus = (raw, animate = true) => {
      const count = games.length;
      const index = ((Math.round(raw) % count) + count) % count;
      this.#depthDeckPosition = index;
      this.#layoutFeaturedDepthDeck(index, animate);
      this.#featuredIndex = index;
      this.#selectGame(games[index], false, true);
    };
    root.addEventListener('click', (event) => {
      const card = event.target.closest('[data-depth-index]');
      if (!card || this.#depthDeckDrag?.moved) return;
      setFocus(Number(card.dataset.depthIndex), true);
    });
    root.addEventListener('pointerdown', (event) => {
      this.#depthDeckDrag = { id: event.pointerId, x: event.clientX, start: this.#depthDeckPosition, moved: false };
    });
    root.addEventListener('pointermove', (event) => {
      const drag = this.#depthDeckDrag;
      if (!drag || drag.id !== event.pointerId) return;
      const dx = event.clientX - drag.x;
      if (!drag.moved && Math.abs(dx) > 4) { drag.moved = true; root.setPointerCapture?.(event.pointerId); }
      if (!drag.moved) return;
      const step = Math.max(root.getBoundingClientRect().width * .42, 80);
      this.#layoutFeaturedDepthDeck(drag.start - dx / step, false);
    });
    const finishDrag = (event) => {
      const drag = this.#depthDeckDrag;
      if (!drag || (event && drag.id !== event.pointerId)) return;
      this.#depthDeckDrag = null;
      if (!drag.moved) return;
      const dx = (event?.clientX ?? drag.x) - drag.x;
      const step = Math.max(root.getBoundingClientRect().width * .42, 80);
      setFocus(drag.start - dx / step, true);
    };
    root.addEventListener('pointerup', finishDrag);
    root.addEventListener('pointercancel', finishDrag);
    root.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') { event.preventDefault(); setFocus(this.#depthDeckPosition - 1, true); }
      if (event.key === 'ArrowRight') { event.preventDefault(); setFocus(this.#depthDeckPosition + 1, true); }
    });
    root.addEventListener('wheel', (event) => {
      if (!event.shiftKey) return;
      event.preventDefault();
      const direction = event.deltaY + event.deltaX > 0 ? 1 : -1;
      this.#layoutFeaturedDepthDeck(this.#depthDeckPosition + direction * .34, false);
      if (this.#depthDeckWheelTimer) window.clearTimeout(this.#depthDeckWheelTimer);
      this.#depthDeckWheelTimer = window.setTimeout(() => setFocus(this.#depthDeckPosition + direction, true), 120);
    }, { passive: false });
    this.#layoutFeaturedDepthDeck(this.#featuredIndex, false);
  }

  #layoutFeaturedDepthDeck(position, animate = true) {
    const root = this.#depthDeck;
    if (!root) return;
    const cards = [...root.querySelectorAll('.depth-deck-card')];
    const count = cards.length;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const isDark = document.documentElement.dataset.theme === 'dark';
    const depthSpacing = isDark ? 120 : 104;
    const depthFalloff = isDark ? .22 : .16;
    const depthBlur = isDark ? 1.55 : 1.25;
    cards.forEach((card, index) => {
      let distance = index - position;
      distance = ((distance % count) + count) % count;
      if (distance > count / 2) distance -= count;
      const back = Math.max(0, distance);
      const shown = Math.abs(distance) <= 3.5;
      const tx = 34 * distance;
      const tz = -depthSpacing * distance;
      const rotation = (isDark ? 13 : 11) * Math.max(0, Math.min(1, distance));
      const opacity = distance < 0 ? Math.max(0, 1 + distance) : (shown ? 1 - back * depthFalloff : 0);
      card.style.transitionDuration = animate && !reduced ? '620ms' : '0ms';
      card.style.transform = `translate(-50%, -50%) translateX(${tx.toFixed(1)}px) translateZ(${tz.toFixed(1)}px) rotateY(${rotation.toFixed(2)}deg)`;
      card.style.opacity = opacity.toFixed(3);
      card.style.filter = `brightness(${Math.max(isDark ? .20 : .28, 1 - back * (isDark ? .23 : .18)).toFixed(2)}) blur(${Math.min(isDark ? 5.5 : 4, back * depthBlur).toFixed(2)}px)`;
      card.style.zIndex = String(120 - Math.round(distance * 10));
      card.style.pointerEvents = shown && opacity > .1 ? 'auto' : 'none';
      card.classList.toggle('is-depth-active', Math.abs(distance) < .48);
    });
  }

  #wireElasticDepthControl() {
    const input = document.getElementById('catalog-depth');
    const output = document.getElementById('catalog-depth-value');
    const control = document.getElementById('elastic-depth-control');
    if (!input || !output || !control) return;
    const saved = Number(localStorage.getItem('retroplay-card-depth'));
    if (Number.isFinite(saved) && saved >= 40 && saved <= 100) input.value = String(saved);
    const apply = () => {
      this.#catalogDepth = Number(input.value) / 100;
      document.documentElement.style.setProperty('--catalog-depth', String(this.#catalogDepth));
      control.style.setProperty('--range-fill', `${((Number(input.value) - 40) / 60) * 100}%`);
      output.value = `${input.value}%`;
      output.textContent = `${input.value}%`;
      try { localStorage.setItem('retroplay-card-depth', input.value); } catch { /* session-only fallback */ }
    };
    input.addEventListener('input', apply);
    input.addEventListener('pointerdown', () => control.classList.add('is-adjusting'));
    ['pointerup', 'pointercancel', 'lostpointercapture', 'blur'].forEach((type) => input.addEventListener(type, () => control.classList.remove('is-adjusting')));
    apply();
  }

  #wireMotionSystem() {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const quality = document.documentElement.dataset.visualQuality;
    if (reduced || quality === 'static') return;
    this.#motionEnabled = true;
    document.documentElement.classList.add('motion-ready');
    if ('IntersectionObserver' in window) {
      this.#motionObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-revealed');
          this.#motionObserver?.unobserve(entry.target);
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.07 });
    }
    document.addEventListener('pointermove', (event) => {
      if (event.pointerType === 'touch') return;
      const target = event.target?.closest?.('.game-card, .collection-card, .featured-panel');
      if (!target) return;
      const bounds = target.getBoundingClientRect();
      target.style.setProperty('--pointer-x', `${((event.clientX - bounds.left) / bounds.width) * 100}%`);
      target.style.setProperty('--pointer-y', `${((event.clientY - bounds.top) / bounds.height) * 100}%`);
    }, { passive: true });
    this.#wireCardTilt();
  }

  #wireCardTilt() {
    const finePointer = window.matchMedia?.('(hover: hover) and (pointer: fine)').matches;
    if (!finePointer) return;
    const caption = document.createElement('div');
    caption.className = 'card-quickview';
    caption.setAttribute('aria-hidden', 'true');
    caption.innerHTML = '<span>QUICK VIEW</span><i></i>';
    document.body.append(caption);
    this.#quickView = caption;
    const reset = (card) => {
      card.classList.remove('is-tilting', 'is-tilt-ready');
      card.style.removeProperty('--tilt-x');
      card.style.removeProperty('--tilt-y');
      card.style.removeProperty('--tilt-shift');
      this.#quickView?.classList.remove('is-visible');
      if (this.#tiltState?.card === card) this.#tiltState = null;
    };
    document.addEventListener('pointerover', (event) => {
      const card = event.target?.closest?.('.game-card');
      if (!card || card.contains(event.relatedTarget)) return;
      card.classList.add('is-tilt-ready', 'is-tilting');
      const title = card.querySelector('h3')?.textContent?.trim() ?? 'GAME';
      this.#quickView.querySelector('span').textContent = `QUICK VIEW / ${title.toUpperCase()}`;
      this.#quickView.classList.add('is-visible');
    });
    document.addEventListener('pointerout', (event) => {
      const card = event.target?.closest?.('.game-card.is-tilting');
      if (!card || card.contains(event.relatedTarget)) return;
      reset(card);
    });
    document.addEventListener('pointermove', (event) => {
      const card = event.target?.closest?.('.game-card.is-tilting');
      if (!card) return;
      this.#tiltState = { card, x: event.clientX, y: event.clientY };
      if (this.#tiltFrame) return;
      this.#tiltFrame = requestAnimationFrame(() => {
        this.#tiltFrame = null;
        const state = this.#tiltState;
        if (!state?.card.isConnected) return;
        const bounds = state.card.getBoundingClientRect();
        const dx = ((state.x - bounds.left) / bounds.width) - 0.5;
        const dy = ((state.y - bounds.top) / bounds.height) - 0.5;
        state.card.style.setProperty('--tilt-x', `${(-dy * 15 * this.#catalogDepth).toFixed(2)}deg`);
        state.card.style.setProperty('--tilt-y', `${(dx * 17 * this.#catalogDepth).toFixed(2)}deg`);
        state.card.style.setProperty('--tilt-shift', `${(dx * 15 * this.#catalogDepth).toFixed(1)}px`);
        this.#quickView.style.setProperty('--tooltip-x', `${Math.min(window.innerWidth - 24, state.x + 18)}px`);
        this.#quickView.style.setProperty('--tooltip-y', `${Math.min(window.innerHeight - 24, state.y + 18)}px`);
      });
    }, { passive: true });
  }

  #applyMotionTargets() {
    if (!this.#motionEnabled || !this.#motionObserver) return;
    const targets = document.querySelectorAll('.featured-panel, .genre-deck, .catalog-heading, .filter-panel, .catalog-group, .import-panel, .library-section, .about-panel, .game-card, .collection-card');
    targets.forEach((target, index) => {
      if (target.dataset.motionBound) return;
      target.dataset.motionBound = 'true';
      target.classList.add('reveal-target');
      target.style.setProperty('--reveal-delay', `${Math.min(index % 9, 6) * 38}ms`);
      this.#motionObserver.observe(target);
    });
  }

  #startFeaturedAutoplay() {
    this.#stopFeaturedAutoplay();
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    this.#featuredInterval = window.setInterval(() => this.#stepFeatured(1, false), 10000);
  }

  #stopFeaturedAutoplay() {
    if (this.#featuredInterval) window.clearInterval(this.#featuredInterval);
    this.#featuredInterval = null;
  }

  #stepFeatured(direction, fromUser) {
    const games = this.#featuredGames();
    if (!games.length) return;
    this.#featuredIndex = (this.#featuredIndex + direction + games.length) % games.length;
    this.#selectGame(games[this.#featuredIndex], false, true);
    if (fromUser) this.#startFeaturedAutoplay();
  }

  #wireControls() {
    document.querySelectorAll('[data-retro-nav]').forEach((button) => {
      button.addEventListener('click', () => document.getElementById(button.dataset.retroNav)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    });

    document.querySelectorAll('[data-genre]').forEach((button) => {
      button.addEventListener('click', () => {
        this.#activeGenre = button.dataset.genre;
        this.#syncGenreButtons();
        this.render();
      });
    });

    document.getElementById('search-input')?.addEventListener('input', (event) => {
      this.#query = event.target.value.trim().toLowerCase();
      this.render();
    });
    document.getElementById('filter-format')?.addEventListener('change', () => this.render());

    document.addEventListener('click', (event) => {
      const button = event.target.closest('[data-action]');
      if (!button) return;
      const game = COLLECTIONS.find((item) => item.id === button.dataset.game);
      const action = button.dataset.action;
      if (action === 'play-game' && game?.playable) this.#onPlay?.(game);
      if (action === 'import') this.#onImport?.(game);
      if (action === 'open-project' && game?.projectUrl) window.open(game.projectUrl, '_blank', 'noopener,noreferrer');
      if (action === 'open-runtime' && game?.runtimePath) window.location.assign(game.runtimePath);
      if (action === 'open-probe' && game?.probePath) window.location.assign(game.probePath);
      if (action === 'focus-genre') this.focusCatalog(button.dataset.genre ?? 'All');
      if (action === 'toggle-library' && game) { this.#toggleLibrary(game.id); this.render(); }
      if (action === 'select-game' && game) this.#selectGame(game);
      if (action === 'select-featured' && game) {
        this.#featuredIndex = this.#featuredGames().findIndex((item) => item.id === game.id);
        this.#selectGame(game, false, true);
        this.#startFeaturedAutoplay();
      }
    });
  }

  #filteredItems() {
    const format = document.getElementById('filter-format')?.value ?? 'All';
    return COLLECTIONS.filter((game) => {
      const matchesGenre = this.#activeGenre === 'All' || game.genre === this.#activeGenre;
      const matchesFormat = format === 'All' || game.format.toLowerCase().includes(format.toLowerCase());
      const haystack = `${game.title} ${game.genre} ${game.description} ${game.license}`.toLowerCase();
      return matchesGenre && matchesFormat && (!this.#query || haystack.includes(this.#query));
    });
  }

  #cardTemplate(game, index) {
    const saved = this.#pinned.has(game.id);
    const isRuntime = Boolean(game.runtimePath);
    const isProbe = !game.playable && Boolean(game.probePath);
    const isExternal = !game.playable && Boolean(game.projectUrl);
    const action = isRuntime ? 'open-runtime' : (game.playable ? 'play-game' : (isProbe ? 'open-probe' : (isExternal ? 'open-project' : 'import')));
    const actionLabel = isRuntime ? (game.runtimeLabel ?? 'Launch runtime') : (game.playable ? (game.playLabel ?? 'Play now') : (isProbe ? (game.projectLabel ?? 'Open technical probe') : (isExternal ? (game.projectLabel ?? 'View project') : 'Attach WAD')));
    const state = game.catalogState ?? (isRuntime ? 'INDEPENDENT RUNTIME' : (game.playable ? 'BUNDLED' : (isProbe ? 'WEBGL2 STUDY' : (isExternal ? 'EXTERNAL ENGINE' : 'OWNED FILE'))));
    const download = game.downloadUrl ? `<a class="card-download-link" href="${game.downloadUrl}" target="_blank" rel="noopener noreferrer">⇩ ${game.downloadLabel ?? 'Official download'}</a>` : '';
    const downloadNote = game.downloadNote ? `<p class="card-download-note">${game.downloadNote}</p>` : '';
    return `<article class="game-card ${game.featured ? 'is-featured-card' : ''}" style="--card-index:${index}">
      <button class="game-card-media" data-action="select-game" data-game="${game.id}" aria-label="View ${game.title}">
        <img src="${game.artwork}" alt="" loading="lazy" />
        <span class="card-index">// ${String(index + 1).padStart(2, '0')}</span>
        <span class="card-state ${game.playable ? 'is-ready' : ''}">${state}</span>
      </button>
      <div class="game-card-body">
        <div class="card-overline"><span>${game.genre}</span><span>${game.format}</span></div>
        <h3>${game.title}</h3><p>${game.description}</p>
        <p class="card-license">${game.license}</p>
        <div class="card-meta"><span>${game.year}</span><span>${game.duration}</span><span>${game.maps}</span></div>
        <div class="card-actions"><button class="retro-button retro-button-compact" data-magnet data-action="${action}" data-game="${game.id}">${actionLabel}</button><button class="icon-button ${saved ? 'is-saved' : ''}" data-action="toggle-library" data-game="${game.id}" aria-label="${saved ? 'Remove from' : 'Add to'} Library" aria-pressed="${saved}">${saved ? '★' : '☆'}</button></div>${download}${downloadNote}
      </div>
    </article>`;
  }

  #selectGame(game, scroll = true, animate = true) {
    if (!game) return;
    const panel = document.querySelector('.featured-panel');
    const apply = () => {
      this.#selectedId = game.id;
      const fields = {
        'featured-title': game.title,
        'featured-studio': `${game.studio} · ${game.year}`,
        'featured-description': game.description,
        'featured-status': game.status,
        'featured-license': game.license,
        'featured-credit': game.artworkCredit,
        'featured-index': `R-${String(this.#featuredIndex + 1).padStart(2, '0')} / ${String(this.#featuredGames().length).padStart(2, '0')}`,
      };
      Object.entries(fields).forEach(([id, value]) => { const el = document.getElementById(id); if (el) el.textContent = value; });
      const cover = document.getElementById('featured-cover');
      if (cover) { cover.src = game.artwork; cover.alt = `${game.title} preview`; }
      const button = document.getElementById('btn-freedoom');
      if (button) {
        const isRuntime = Boolean(game.runtimePath);
        const isProbe = !game.playable && Boolean(game.probePath);
        const isExternal = !game.playable && Boolean(game.projectUrl);
        button.dataset.action = isRuntime ? 'open-runtime' : (game.playable ? 'play-game' : (isProbe ? 'open-probe' : (isExternal ? 'open-project' : 'import')));
        button.dataset.game = game.id;
        button.textContent = isRuntime ? (game.runtimeLabel ?? 'Launch runtime') : (game.playable ? (game.playLabel ?? 'Launch now') : (isProbe ? (game.projectLabel ?? 'Open technical probe') : (isExternal ? (game.projectLabel ?? 'View project') : 'Attach legal WAD')));
      }
      document.getElementById('featured-format').textContent = game.format;
      document.getElementById('featured-session').textContent = game.duration;
      document.getElementById('featured-topology').textContent = game.maps;
      const dots = document.getElementById('featured-dots');
      if (dots) dots.innerHTML = this.#featuredGames().map((item, index) => `<button class="featured-dot ${item.id === game.id ? 'is-active' : ''}" data-action="select-featured" data-game="${item.id}" aria-label="Show ${item.title}" aria-current="${item.id === game.id ? 'true' : 'false'}"><span>${String(index + 1).padStart(2, '0')}</span></button>`).join('');
      const timer = document.getElementById('featured-timer');
      if (timer) { timer.classList.remove('is-counting'); void timer.offsetWidth; timer.classList.add('is-counting'); }
      document.querySelectorAll('.game-card').forEach((card) => {
        card.classList.toggle('is-current', Boolean(card.querySelector(`[data-game="${game.id}"]`)));
      });
      const selectedDepthIndex = this.#featuredGames().findIndex((item) => item.id === game.id);
      if (selectedDepthIndex >= 0) {
        this.#featuredIndex = selectedDepthIndex;
        this.#depthDeckPosition = selectedDepthIndex;
        this.#layoutFeaturedDepthDeck(selectedDepthIndex, !reduced);
      }
    };
    if (this.#featuredTransition) window.clearTimeout(this.#featuredTransition);
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (animate && panel && !reduced) {
      panel.classList.add('is-transitioning');
      this.#featuredTransition = window.setTimeout(() => {
        apply();
        panel.classList.remove('is-transitioning');
        panel.classList.add('is-arriving');
        requestAnimationFrame(() => panel.classList.remove('is-arriving'));
      }, 220);
    } else apply();
    if (scroll) document.getElementById('featured')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  #renderLibrary() {
    const grid = document.getElementById('library-grid');
    const counter = document.getElementById('library-count');
    const empty = document.getElementById('library-empty');
    const games = COLLECTIONS.filter((game) => this.#pinned.has(game.id));
    if (counter) counter.textContent = String(games.length).padStart(2, '0');
    if (empty) empty.hidden = games.length > 0;
    if (grid) grid.innerHTML = games.map((game, index) => this.#cardTemplate(game, index)).join('');
  }

  #renderCollectionStats() {
    document.querySelectorAll('[data-collection-count]').forEach((item) => {
      const genre = item.dataset.collectionCount;
      item.textContent = String(COLLECTIONS.filter((game) => game.genre === genre).length).padStart(2, '0');
    });
  }

  #syncGenreButtons() {
    document.querySelectorAll('[data-genre]').forEach((button) => button.classList.toggle('is-active', button.dataset.genre === this.#activeGenre));
  }

  #toggleLibrary(id) {
    if (this.#pinned.has(id)) this.#pinned.delete(id); else this.#pinned.add(id);
    try { localStorage.setItem(LIBRARY_KEY, JSON.stringify([...this.#pinned])); } catch { /* session-only fallback */ }
  }

  #readLibrary() {
    try {
      const legacy = LEGACY_LIBRARY_KEYS.map((key) => localStorage.getItem(key)).find((value) => value != null);
      const saved = JSON.parse(localStorage.getItem(LIBRARY_KEY) ?? legacy ?? '[]');
      return new Set(Array.isArray(saved) ? saved.filter((id) => COLLECTIONS.some((game) => game.id === id)) : []);
    } catch { return new Set(); }
  }
}
