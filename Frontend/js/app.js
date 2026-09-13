(() => {
  const main = document.getElementById('main');
  const pageTitleEl = document.getElementById('pageTitle');
  const menuBtn = document.getElementById('menuBtn');
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('backdrop');
  const navLinks = document.querySelectorAll('.nav a');

  const TITLES = { library: 'Library', playing: 'Playing Now', completed: 'Completed', backlog: 'Backlog', favorites: 'Favorites', statistics: 'Statistics', settings: 'Settings', add: 'Add Game', edit: 'Edit Game' };
  const LIST_PAGES = ['library', 'playing', 'completed', 'backlog', 'favorites'];

  const parseHash = () => {
    const [a, b] = location.hash.replace(/^#\/?/, '').split('/');
    return { page: a || 'library', param: b };
  };

  const setMenu = open => {
    sidebar.classList.toggle('open', open);
    backdrop.hidden = !open;
    menuBtn.setAttribute('aria-expanded', String(open));
    if (open) sidebar.querySelector('a').focus();
    else menuBtn.focus();
  };

  menuBtn.addEventListener('click', () => setMenu(!sidebar.classList.contains('open')));
  backdrop.addEventListener('click', () => setMenu(false));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && sidebar.classList.contains('open')) setMenu(false);
  });

  const syncNav = () => {
    const { page } = parseHash();
    const active = page === 'game' || page === 'edit' || page === 'add' ? 'library' : page;
    navLinks.forEach(a => a.classList.toggle('active', a.dataset.route === active));
  };

  const route = () => {
    const { page, param } = parseHash();
    setMenu(false);
    if (page === 'game') {
      const g = store.byId(param);
      pageTitleEl.textContent = g ? g.title : 'Game';
      ui.renderGameDetail(param);
    } else if (page === 'add') {
      pageTitleEl.textContent = TITLES.add;
      ui.renderAddGame();
    } else if (page === 'edit') {
      pageTitleEl.textContent = TITLES.edit;
      ui.renderAddGame(param, true);
    } else if (page === 'statistics') {
      pageTitleEl.textContent = TITLES.statistics;
      ui.renderStatistics();
    } else if (page === 'settings') {
      pageTitleEl.textContent = TITLES.settings;
      ui.renderSettings();
    } else {
      const kind = page === 'library' ? 'all' : LIST_PAGES.includes(page) ? page : 'all';
      pageTitleEl.textContent = TITLES[page] || 'Library';
      ui.renderLibrary(kind);
    }
    syncNav();
    main.classList.remove('view-enter');
    void main.offsetWidth;
    main.classList.add('view-enter');
    window.scrollTo(0, 0);
  };

  main.addEventListener('click', e => {
    const pill = e.target.closest('.pill-btn');
    if (pill) {
      store.setFilter({ status: pill.dataset.filter });
      document.querySelectorAll('.pill-btn').forEach(p => {
        const on = p === pill;
        p.classList.toggle('active', on);
        p.setAttribute('aria-pressed', String(on));
      });
      const gw = document.getElementById('gridWrap');
      if (gw) gw.innerHTML = ui.gridOnly();
      return;
    }
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const { action, id } = btn.dataset;
    if (action === 'fav') ui.refreshGame(store.toggleFavorite(id).id);
    else if (action === 'delete') {
      if (!btn.classList.contains('arm')) {
        btn.classList.add('arm');
        btn.textContent = 'Confirm Delete';
        setTimeout(() => {
          btn.classList.remove('arm');
          btn.textContent = 'Delete Game';
        }, 3000);
        return;
      }
      store.remove(id);
      location.hash = '#/library';
    }
    else if (action === 'clear-filters') {
      store.setFilter({ search: '' });
      const si = document.getElementById('search');
      if (si) si.value = '';
      const gw = document.getElementById('gridWrap');
      if (gw) gw.innerHTML = ui.gridOnly();
    }
  });

  main.addEventListener('input', e => {
    if (e.target.id !== 'search') return;
    store.setFilter({ search: e.target.value });
    const gw = document.getElementById('gridWrap');
    if (gw) gw.innerHTML = ui.gridOnly();
  });

  main.addEventListener('change', e => {
    if (e.target.id !== 'sort') return;
    store.setFilter({ sort: e.target.value });
    const gw = document.getElementById('gridWrap');
    if (gw) gw.innerHTML = ui.gridOnly();
  });

  wsClient.onStatus(ui.setConn);
  wsClient.onEvent(msg => {
    const g = store.byId(msg.gameId);
    if (!g) return;
    if (msg.type === 'activity_changed') store.update(g.id, { activity: msg.activity });
    else if (msg.type === 'playtime_updated') store.update(g.id, { playtimeMin: msg.playtimeMin });
    else if (msg.type === 'game_status_changed') store.update(g.id, { status: msg.status });
    else if (msg.type === 'game_started') store.update(g.id, { status: 'playing', activity: g.activity === 'Unknown' ? 'In Menu' : g.activity, lastPlayed: 'Now', lastPlayedAt: Date.now() });
    else if (msg.type === 'game_stopped') store.update(g.id, { activity: 'Paused' });
    ui.refreshGame(g.id);
  });
  wsClient.connect();

  window.addEventListener('hashchange', route);
  route();
})();
