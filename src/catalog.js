const COLLECTIONS = [
  {
    id: 'freedoom',
    title: 'Freedoom: Phase 1',
    studio: 'Freedoom project',
    year: '2024',
    format: 'Bundled IWAD',
    genre: 'Action',
    duration: '35–60 min',
    maps: '9 maps',
    status: 'Ready to play',
    artwork: 'assets/covers/freedoom-rift.png',
    description: 'The launch collection. A complete, open WAD ready to run in your browser.',
    playable: true,
    featured: true,
  },
  {
    id: 'midnight-signal',
    title: 'Midnight Signal',
    studio: 'Local WAD slot',
    year: 'Your file',
    format: 'IWAD + PWAD',
    genre: 'Horror',
    duration: '20–90 min',
    maps: 'Custom mapset',
    status: 'Bring your own WAD',
    artwork: 'assets/covers/horror-rift.png',
    description: 'A dark shelf reserved for survival-horror mapsets and authored campaigns.',
    playable: false,
  },
  {
    id: 'siltline',
    title: 'Siltline Observatory',
    studio: 'Local WAD slot',
    year: 'Your file',
    format: 'IWAD + PWAD',
    genre: 'Exploration',
    duration: '30–120 min',
    maps: 'Custom mapset',
    status: 'Bring your own WAD',
    artwork: 'assets/covers/exploration-rift.png',
    description: 'For quiet world-building, hub maps, long walks and unusual spaces.',
    playable: false,
  },
  {
    id: 'grid-assembly',
    title: 'Grid Assembly',
    studio: 'Local WAD slot',
    year: 'Your file',
    format: 'PWAD',
    genre: 'Experimental',
    duration: 'Variable',
    maps: 'Patch or mapset',
    status: 'Bring your own WAD',
    artwork: 'assets/covers/experimental-rift.png',
    description: 'A place for mods, visual experiments and maps that bend the original language.',
    playable: false,
  },
];

const LIBRARY_KEY = 'riftwad-library-v1';

export class CatalogController {
  #onPlay;
  #onImport;
  #activeGenre = 'All';
  #query = '';
  #pinned = new Set();

  constructor({ onPlayFreedoom, onImportWad }) {
    this.#onPlay = onPlayFreedoom;
    this.#onImport = onImportWad;
  }

  init() {
    this.#pinned = this.#readLibrary();
    this.#wireControls();
    this.render();
  }

  render() {
    const filtered = this.#filteredItems();
    const grid = document.getElementById('catalog-grid');
    const count = document.getElementById('result-count');
    if (grid) {
      grid.innerHTML = filtered.map((game, index) => this.#cardTemplate(game, index)).join('');
    }
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
      button.addEventListener('click', () => {
        const target = document.getElementById(button.dataset.riftNav);
        target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
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

      if (action === 'play-featured') this.#onPlay?.();
      if (action === 'import') this.#onImport?.();
      if (action === 'focus-genre') this.focusCatalog(button.dataset.genre ?? 'All');
      if (action === 'toggle-library' && game) {
        this.#toggleLibrary(game.id);
        this.render();
      }
      if (action === 'select-game' && game) this.#selectGame(game);
    });
  }

  #filteredItems() {
    const format = document.getElementById('filter-format')?.value ?? 'All';
    return COLLECTIONS.filter((game) => {
      const matchesGenre = this.#activeGenre === 'All' || game.genre === this.#activeGenre;
      const matchesFormat = format === 'All' || game.format.includes(format);
      const haystack = `${game.title} ${game.genre} ${game.description}`.toLowerCase();
      return matchesGenre && matchesFormat && (!this.#query || haystack.includes(this.#query));
    });
  }

  #cardTemplate(game, index) {
    const saved = this.#pinned.has(game.id);
    return `
      <article class="game-card ${game.featured ? 'is-featured-card' : ''}" style="--card-index:${index}">
        <button class="game-card-media" data-action="select-game" data-game="${game.id}" aria-label="View ${game.title}">
          <img src="${game.artwork}" alt="" loading="lazy" />
          <span class="card-index">// ${String(index + 1).padStart(2, '0')}</span>
          <span class="card-state ${game.playable ? 'is-ready' : ''}">${game.playable ? 'RUNNABLE' : 'LOCAL SLOT'}</span>
        </button>
        <div class="game-card-body">
          <div class="card-overline"><span>${game.genre}</span><span>${game.format}</span></div>
          <h3>${game.title}</h3>
          <p>${game.description}</p>
          <div class="card-meta"><span>${game.year}</span><span>${game.duration}</span><span>${game.maps}</span></div>
          <div class="card-actions">
            <button class="rift-button rift-button-compact" data-action="${game.playable ? 'play-featured' : 'import'}" data-game="${game.id}">
              ${game.playable ? 'Play now' : 'Add WAD'}
            </button>
            <button class="icon-button ${saved ? 'is-saved' : ''}" data-action="toggle-library" data-game="${game.id}" aria-label="${saved ? 'Remove from' : 'Add to'} Library" aria-pressed="${saved}">
              ${saved ? '★' : '☆'}
            </button>
          </div>
        </div>
      </article>`;
  }

  #selectGame(game) {
    const title = document.getElementById('featured-title');
    const studio = document.getElementById('featured-studio');
    const description = document.getElementById('featured-description');
    const cover = document.getElementById('featured-cover');
    const status = document.getElementById('featured-status');
    const button = document.getElementById('btn-freedoom');
    if (title) title.textContent = game.title;
    if (studio) studio.textContent = `${game.studio} · ${game.year}`;
    if (description) description.textContent = game.description;
    if (cover) { cover.src = game.artwork; cover.alt = ''; }
    if (status) status.textContent = game.status;
    if (button) {
      button.dataset.action = game.playable ? 'play-featured' : 'import';
      button.textContent = game.playable ? 'Launch featured' : 'Attach local WAD';
    }
    document.getElementById('featured')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
      const count = COLLECTIONS.filter((game) => game.genre === genre).length;
      item.textContent = String(count).padStart(2, '0');
    });
  }

  #syncGenreButtons() {
    document.querySelectorAll('[data-genre]').forEach((button) => {
      button.classList.toggle('is-active', button.dataset.genre === this.#activeGenre);
    });
  }

  #toggleLibrary(id) {
    if (this.#pinned.has(id)) this.#pinned.delete(id);
    else this.#pinned.add(id);
    try {
      localStorage.setItem(LIBRARY_KEY, JSON.stringify([...this.#pinned]));
    } catch {
      // Library remains functional for this session if storage is unavailable.
    }
  }

  #readLibrary() {
    try {
      const saved = JSON.parse(localStorage.getItem(LIBRARY_KEY) ?? '[]');
      return new Set(Array.isArray(saved) ? saved.filter((id) => COLLECTIONS.some((game) => game.id === id)) : []);
    } catch {
      return new Set();
    }
  }
}
