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
    description: 'A libre 32-map deathmatch archive. RIFTWAD can launch the levels for local exploration, but it does not add bots, online play or matchmaking.',
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
    id: 'ancient-aliens',
    title: 'Ancient Aliens',
    studio: 'skillsaw & collaborators',
    year: 'v1.2 · 2016',
    format: 'Doom II PWAD · Boom',
    genre: 'Action',
    duration: '32 maps',
    maps: 'Boom-compatible',
    status: 'External engine required',
    license: 'Project download only · not bundled by RIFTWAD',
    artwork: 'assets/screenshots/ancient-aliens-gameplay.jpg',
    artworkCredit: 'Gameplay screenshot: Ancient Aliens project / ModDB',
    description: 'A colorful 32-map synthwave megawad with custom music and a Boom-compatible ruleset. Use a compatible source port such as Woof! or DSDA-Doom; its files are not bundled here.',
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
    license: 'Project download only · not bundled by RIFTWAD',
    artwork: 'assets/screenshots/eviternity-gameplay.jpg',
    artworkCredit: 'Gameplay screenshot: Eviternity project / ModDB',
    description: 'A six-chapter Doom II megawad built around distinct visual worlds and Boom features. Open its release with a Boom-capable port; the current browser runtime does not claim that compatibility.',
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
    license: 'Project download only · not bundled by RIFTWAD',
    artwork: 'assets/screenshots/back-to-saturn-x-gameplay.jpg',
    artworkCredit: 'Gameplay screenshot: Back to Saturn X project / ModDB',
    description: 'A polished two-WAD science-fiction episode with custom art and music. The project release supplies both PWAD files; add them locally to a compatible Doom II base archive.',
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
    license: 'Official package only · not bundled by RIFTWAD',
    artwork: 'assets/screenshots/adventures-of-square-gameplay.png',
    artworkCredit: 'Gameplay screenshot: BigBrik Games / Square press kit',
    description: 'A colorful standalone total conversion with its own modified GZDoom package, music, voice work and controller support. RIFTWAD links to the official project rather than repackaging its files.',
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
    license: 'Not bundled or hosted by RIFTWAD',
    artwork: 'assets/screenshots/plutonia-gateway-of-hell.webp',
    artworkCredit: 'Gameplay screenshot: Doom Wiki / Fandom · MAP30: The Gateway of Hell',
    description: 'A demanding Final Doom campaign known for compressed combat spaces and high-pressure encounters. RIFTWAD can launch a lawfully owned copy selected from your device, but does not distribute this IWAD.',
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
    license: 'Not bundled or hosted by RIFTWAD',
    artwork: 'assets/screenshots/tnt-steel-works.webp',
    artworkCredit: 'Gameplay screenshot: Doom Wiki / Fandom · MAP14: Steel Works',
    description: 'A Final Doom campaign with industrial spaces, larger progression routes and authored set pieces. Attach a legally acquired TNT IWAD from your device to play it here.',
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
    description: 'A local route for compatible mapsets and experiments. Attach one base IWAD and up to three PWADs; files stay in this browser session and are never uploaded by RIFTWAD.',
    playable: false,
  },
  {
    id: 'blasphemer',
    title: 'Blasphemer',
    studio: 'Blasphemer project',
    year: 'v0.1.8',
    format: 'Free Heretic IWAD',
    genre: 'Horror',
    duration: 'Campaign + deathmatch',
    maps: 'Heretic-compatible',
    status: 'External engine required',
    license: 'BSD 3-Clause content · attribution retained',
    artwork: 'assets/screenshots/blasphemer-gameplay.webp',
    artworkCredit: 'Gameplay screenshot: Blasphemer project / jeshimoth.com',
    description: 'A fully playable libre dark-fantasy IWAD for the Heretic engine. It is verified in the index, but cannot launch in RIFTWAD yet because this browser runtime currently implements Doom 1.10 only.',
    playable: false,
    projectUrl: 'https://github.com/Blasphemer/blasphemer/releases/tag/v0.1.8',
    projectLabel: 'View official release',
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
    artworkCredit: 'Gameplay screenshot: RIFTWAD local C-Dogs SDL browser build',
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
    description: 'An open C engine studied for a future browser port. The upstream source has no Resident Evil game data and currently targets X11/GLX or Win32/WGL, so RIFTWAD does not package, emulate or launch it as a game.',
    playable: false,
    probePath: 'openresident.html',
    projectUrl: 'https://github.com/XProger/OpenResident',
    projectLabel: 'Open WebGL2 probe',
  },
];

const LIBRARY_KEY = 'riftwad-library-v2';

export class CatalogController {
  #onPlay;
  #onImport;
  #activeGenre = 'All';
  #query = '';
  #pinned = new Set();
  #selectedId = 'freedoom-phase-1';

  constructor({ onPlayGame, onImportWad }) {
    this.#onPlay = onPlayGame;
    this.#onImport = onImportWad;
  }

  init() {
    this.#pinned = this.#readLibrary();
    this.#wireControls();
    this.render();
    this.#selectGame(COLLECTIONS.find((item) => item.featured) ?? COLLECTIONS[0], false);
  }

  render() {
    const filtered = this.#filteredItems();
    const grid = document.getElementById('catalog-grid');
    const count = document.getElementById('result-count');
    if (grid) grid.innerHTML = filtered.map((game, index) => this.#cardTemplate(game, index)).join('');
    if (count) count.textContent = `${filtered.length.toString().padStart(2, '0')} records`;
    this.#renderLibrary();
    this.#renderCollectionStats();
  }

  focusCatalog(genre = 'All') {
    this.#activeGenre = genre;
    this.#syncGenreButtons();
    this.render();
    document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  #wireControls() {
    document.querySelectorAll('[data-rift-nav]').forEach((button) => {
      button.addEventListener('click', () => document.getElementById(button.dataset.riftNav)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
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
    });
  }

  #filteredItems() {
    const format = document.getElementById('filter-format')?.value ?? 'All';
    return COLLECTIONS.filter((game) => {
      const matchesGenre = this.#activeGenre === 'All' || game.genre === this.#activeGenre;
      const matchesFormat = format === 'All' || game.format.includes(format);
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
        <div class="card-actions"><button class="rift-button rift-button-compact" data-action="${action}" data-game="${game.id}">${actionLabel}</button><button class="icon-button ${saved ? 'is-saved' : ''}" data-action="toggle-library" data-game="${game.id}" aria-label="${saved ? 'Remove from' : 'Add to'} Library" aria-pressed="${saved}">${saved ? '★' : '☆'}</button></div>
      </div>
    </article>`;
  }

  #selectGame(game, scroll = true) {
    if (!game) return;
    this.#selectedId = game.id;
    const fields = {
      'featured-title': game.title,
      'featured-studio': `${game.studio} · ${game.year}`,
      'featured-description': game.description,
      'featured-status': game.status,
      'featured-license': game.license,
      'featured-credit': game.artworkCredit,
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
      const saved = JSON.parse(localStorage.getItem(LIBRARY_KEY) ?? localStorage.getItem('riftwad-library-v1') ?? '[]');
      return new Set(Array.isArray(saved) ? saved.filter((id) => COLLECTIONS.some((game) => game.id === id)) : []);
    } catch { return new Set(); }
  }
}
