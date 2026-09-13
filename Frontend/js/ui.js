const ui = (() => {
  const main = document.getElementById('main');
  const STATUS = { playing: 'Playing', completed: 'Completed', backlog: 'Backlog', paused: 'Paused', dropped: 'Dropped' };
  const FILTERS = [['all', 'All'], ['playing', 'Playing'], ['completed', 'Completed'], ['backlog', 'Backlog'], ['paused', 'Paused'], ['dropped', 'Dropped'], ['favorites', 'Favorites']];
  const SORTS = [['recent', 'Recently Played'], ['added', 'Recently Added'], ['title', 'Alphabetical'], ['playtime', 'Playtime'], ['rating', 'Rating']];

  const escapeHtml = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmtTime = min => {
    const h = Math.floor(min / 60), m = Math.round(min % 60);
    return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m`;
  };
  const stars = r => '★'.repeat(r) + '☆'.repeat(5 - r);
  const coverColor = title => {
    let h = 0;
    for (const c of title) h = (h * 31 + c.charCodeAt(0)) % 360;
    return `hsl(${h} 30% 22%)`;
  };
  const favIcon = on => `<svg class="fav-icon${on ? ' on' : ''}" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M12 20.5C12 20.5 3.5 14.8 3.5 9.3 3.5 6.4 5.7 4.5 8 4.5c1.7 0 3.2 1 4 2.4.8-1.4 2.3-2.4 4-2.4 2.3 0 4.5 1.9 4.5 4.8 0 5.5-8.5 11.2-8.5 11.2z"/></svg>`;
  const coverStyle = g => g.cover ? `background-image:url('${g.cover}')` : `background:${coverColor(g.title)}`;

  const currentGame = () => {
    const list = store.list();
    const playing = list.filter(g => g.status === 'playing').sort((a, b) => b.lastPlayedAt - a.lastPlayedAt);
    if (playing.length) return playing[0];
    if (list.length) return list.slice().sort((a, b) => b.lastPlayedAt - a.lastPlayedAt)[0];
    return null;
  };

  const pulse = id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('flash');
    void el.offsetWidth;
    el.classList.add('flash');
  };

  const heroHtml = () => {
    const g = currentGame();
    if (!g) return `<section class="hero panel hero-empty"><div class="hero-info"><span class="hero-tag">Library Empty</span><h2 class="hero-title">Add your first game</h2><p class="hero-empty-text">Games you add appear here with live activity tracking.</p></div><a class="btn btn-primary" href="#/add">Add Game</a></section>`;
    const live = g.status === 'playing';
    return `
    <section class="hero panel" aria-label="Currently playing">
      ${g.cover ? `<img class="hero-cover" src="${g.cover}" alt="${escapeHtml(g.title)} cover art">` : `<div class="hero-cover hero-letter" style="background:${coverColor(g.title)}">${escapeHtml(g.title[0])}</div>`}
      <div class="hero-info">
        <span class="hero-tag">${live ? 'Playing Now' : 'Last Session'}</span>
        <h2 class="hero-title" id="heroTitle">${escapeHtml(g.title)}</h2>
        <div class="hero-activity">
          ${live ? '<span class="live-dot" aria-hidden="true"></span>' : ''}
          <span class="hero-activity-value" id="heroActivity">${escapeHtml(g.activity)}</span>
          <span class="hero-activity-label">${live ? 'Current Activity' : 'Last Activity'}</span>
        </div>
      </div>
      <dl class="hero-stats">
        <div class="hero-stat"><dt>Playtime</dt><dd id="heroPlaytime">${fmtTime(g.playtimeMin)}</dd></div>
        <div class="hero-stat"><dt>Platform</dt><dd>${escapeHtml(g.platform)}</dd></div>
        <div class="hero-stat"><dt>Genre</dt><dd>${escapeHtml(g.genre)}</dd></div>
      </dl>
    </section>`;
  };

  const statsHtml = s => `
  <section class="stat-row" aria-label="Library statistics">
    ${[['s-total', s.total, 'Total Games'], ['s-playing', s.playing, 'Playing'], ['s-completed', s.completed, 'Completed'], ['s-backlog', s.backlog, 'Backlog'], ['s-dropped', s.dropped, 'Dropped']].map(([id, n, label]) => `<div class="panel stat"><span class="stat-num" id="${id}">${n}</span><span class="stat-label">${label}</span></div>`).join('')}
  </section>`;

  const toolbarHtml = f => `
  <div class="toolbar">
    <input class="search" type="search" id="search" placeholder="Search games" aria-label="Search games" value="${escapeHtml(f.search)}">
    <div class="toolbar-row">
      <div class="pills" role="group" aria-label="Filter games by status">
        ${FILTERS.map(([v, l]) => `<button class="pill-btn${f.status === v ? ' active' : ''}" data-filter="${v}" aria-pressed="${f.status === v}">${l}</button>`).join('')}
      </div>
      <select id="sort" aria-label="Sort games">
        ${SORTS.map(([v, l]) => `<option value="${v}"${f.sort === v ? ' selected' : ''}>${l}</option>`).join('')}
      </select>
    </div>
  </div>`;

  const cardWrap = g => `
  <div class="card-wrap" data-id="${g.id}">
    <a class="card" href="#/game/${g.id}">
      <div class="card-cover" style="${coverStyle(g)}">
        ${g.cover ? '' : `<span class="card-letter" aria-hidden="true">${escapeHtml(g.title[0])}</span>`}
        <span class="status-dot dot-${g.status}" title="${STATUS[g.status]}"></span>
        <span class="card-time">${fmtTime(g.playtimeMin)}</span>
      </div>
      <div class="card-body">
        <h3 class="card-title">${escapeHtml(g.title)}</h3>
        <p class="card-meta">${escapeHtml(g.platform)} · ${escapeHtml(g.genre)}</p>
        <div class="card-foot">
          <span class="pill pill-${g.status}">${STATUS[g.status]}</span>
          ${g.rating ? `<span class="card-rating" aria-label="Rated ${g.rating} of 5">${stars(g.rating)}</span>` : ''}
        </div>
      </div>
    </a>
    <button class="fav-btn" data-action="fav" data-id="${g.id}" aria-pressed="${g.favorite}" aria-label="${g.favorite ? 'Remove from favorites' : 'Add to favorites'}">${favIcon(g.favorite)}</button>
  </div>`;

  const gridHtml = list => `
  <div class="grid-head"><span class="count">${list.length} ${list.length === 1 ? 'game' : 'games'}</span></div>
  ${list.length ? `<div class="grid">${list.map(cardWrap).join('')}</div>` : `<div class="empty panel"><p>No games match.</p><button class="btn" data-action="clear-filters">Clear Filters</button></div>`}`;

  const gridOnly = () => gridHtml(store.visible());

  const renderLibrary = kind => {
    store.setFilter({ status: kind });
    const f = store.getFilter();
    const s = store.stats();
    const heading = kind === 'all' ? 'Game Library' : kind === 'favorites' ? 'Favorites' : STATUS[kind];
    main.innerHTML = `
      ${kind === 'all' ? `<div id="heroWrap">${heroHtml()}</div>${statsHtml(s)}` : ''}
      <h2 class="section-title">${heading}</h2>
      ${toolbarHtml(f)}
      <div id="gridWrap">${gridHtml(store.visible())}</div>`;
  };

  const kv = (label, value, id, extra = '') => `<div class="kv ${extra}"><dt>${label}</dt><dd${id ? ` id="${id}"` : ''}>${value}</dd></div>`;

  const renderGameDetail = id => {
    const g = store.byId(id);
    if (!g) { main.innerHTML = `<div class="empty panel"><p>Game not found.</p><a class="btn" href="#/library">Back to Library</a></div>`; return; }
    main.innerHTML = `
    <a class="back-link" href="#/library">← Library</a>
    <section class="detail panel">
      <div class="detail-cover" style="${coverStyle(g)}">${g.cover ? '' : `<span class="card-letter">${escapeHtml(g.title[0])}</span>`}</div>
      <div class="detail-main">
        <div class="detail-head">
          <h2>${escapeHtml(g.title)}</h2>
          <span class="pill pill-${g.status}" id="dStatus">${STATUS[g.status]}</span>
        </div>
        <dl class="detail-grid">
          ${kv('Platform', escapeHtml(g.platform))}
          ${kv('Genre', escapeHtml(g.genre))}
          ${kv('Release', g.releaseYear || '—')}
          ${kv('Total Playtime', fmtTime(g.playtimeMin), 'dPlaytime')}
          ${kv('Rating', g.rating ? `${g.rating} / 5 <span class="card-rating">${stars(g.rating)}</span>` : 'Unrated')}
          ${kv('Current Activity', escapeHtml(g.activity), 'dActivity', 'live')}
          ${kv('Last Played', escapeHtml(g.lastPlayed))}
        </dl>
        <div class="detail-notes">
          <h3>Notes</h3>
          <p>${g.notes ? escapeHtml(g.notes) : 'No notes yet.'}</p>
        </div>
      </div>
      <div class="detail-actions">
        <a class="btn" href="#/edit/${g.id}">Edit Game</a>
        <button class="btn" data-action="fav" data-id="${g.id}" id="dFav" aria-pressed="${g.favorite}">${favIcon(g.favorite)}${g.favorite ? ' Favorited' : ' Favorite'}</button>
        <button class="btn btn-danger" data-action="delete" data-id="${g.id}">Delete Game</button>
      </div>
    </section>`;
  };

  const PLATFORMS = ['PC', 'PlayStation 5', 'Xbox Series X', 'Switch', 'Mac'];
  const GENRES = ['Sandbox', 'RPG', 'Action RPG', 'FPS', 'Platformer', 'Roguelike', 'Simulation', 'Strategy', 'Metroidvania', 'Action', 'Puzzle'];

  const setErr = (errId, name, msg) => {
    document.getElementById(errId).textContent = msg;
    const input = document.querySelector(`[name="${name}"]`);
    if (input) input.setAttribute('aria-invalid', msg ? 'true' : 'false');
  };

  const bindForm = (edit, g) => {
    const form = document.getElementById('gameForm');
    const fileInput = document.getElementById('fCover');
    let coverData = g && g.cover ? g.cover : '';
    fileInput.addEventListener('change', () => {
      const file = fileInput.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => { coverData = reader.result; };
      reader.readAsDataURL(file);
    });
    form.addEventListener('submit', e => {
      e.preventDefault();
      const data = new FormData(form);
      const title = (data.get('title') || '').toString().trim();
      const yearVal = (data.get('releaseYear') || '').toString().trim();
      let ok = true;
      setErr('errTitle', 'title', title ? '' : 'Give the game a title.');
      if (!title) ok = false;
      let year = 0;
      if (yearVal) {
        const y = Number(yearVal);
        const max = new Date().getFullYear() + 1;
        const bad = !Number.isInteger(y) || y < 1970 || y > max;
        setErr('errYear', 'releaseYear', bad ? `Enter a year between 1970 and ${max}.` : '');
        if (bad) ok = false; else year = y;
      }
      if (!ok) return;
      const payload = {
        title,
        platform: (data.get('platform') || '').toString().trim() || 'PC',
        genre: (data.get('genre') || '').toString().trim() || 'Other',
        releaseYear: year,
        status: data.get('status'),
        rating: Number(data.get('rating')),
        notes: (data.get('notes') || '').toString().trim(),
        cover: coverData
      };
      if (edit) {
        store.update(g.id, payload);
        location.hash = `#/game/${g.id}`;
      } else {
        const ng = store.add(payload);
        location.hash = `#/game/${ng.id}`;
      }
    });
  };

  const renderAddGame = (id, edit) => {
    const g = edit ? store.byId(id) : null;
    if (edit && !g) { main.innerHTML = `<div class="empty panel"><p>Game not found.</p><a class="btn" href="#/library">Back to Library</a></div>`; return; }
    const maxYear = new Date().getFullYear() + 1;
    main.innerHTML = `
    <form class="form panel" id="gameForm" novalidate>
      <div class="field">
        <label for="fTitle">Title <span class="req" aria-hidden="true">*</span></label>
        <input id="fTitle" name="title" value="${g ? escapeHtml(g.title) : ''}" required autocomplete="off">
        <p class="field-err" id="errTitle" role="alert"></p>
      </div>
      <div class="field-row cols-2">
        <div class="field"><label for="fPlatform">Platform</label><input id="fPlatform" name="platform" list="dlPlatforms" value="${g ? escapeHtml(g.platform) : ''}" autocomplete="off"></div>
        <div class="field"><label for="fGenre">Genre</label><input id="fGenre" name="genre" list="dlGenres" value="${g ? escapeHtml(g.genre) : ''}" autocomplete="off"></div>
      </div>
      <datalist id="dlPlatforms">${PLATFORMS.map(p => `<option value="${p}">`).join('')}</datalist>
      <datalist id="dlGenres">${GENRES.map(p => `<option value="${p}">`).join('')}</datalist>
      <div class="field-row">
        <div class="field">
          <label for="fYear">Release Year</label>
          <input id="fYear" name="releaseYear" type="number" min="1970" max="${maxYear}" value="${g && g.releaseYear ? g.releaseYear : ''}">
          <p class="field-err" id="errYear" role="alert"></p>
        </div>
        <div class="field">
          <label for="fStatus">Status</label>
          <select id="fStatus" name="status">${Object.entries(STATUS).map(([v, l]) => `<option value="${v}"${(g ? g.status : 'backlog') === v ? ' selected' : ''}>${l}</option>`).join('')}</select>
        </div>
        <div class="field">
          <label for="fRating">Rating</label>
          <select id="fRating" name="rating">${[0, 1, 2, 3, 4, 5].map(n => `<option value="${n}"${(g ? g.rating || 0 : 0) === n ? ' selected' : ''}>${n === 0 ? 'Unrated' : n + ' / 5'}</option>`).join('')}</select>
        </div>
      </div>
      <div class="field"><label for="fNotes">Notes</label><textarea id="fNotes" name="notes" rows="4">${g ? escapeHtml(g.notes) : ''}</textarea></div>
      <div class="field"><label for="fCover">Cover Image</label><input id="fCover" name="cover" type="file" accept="image/*"><p class="field-hint">Optional. A generated cover is used when empty.</p></div>
      <div class="form-actions">
        <button class="btn btn-primary" type="submit">${edit ? 'Save Changes' : 'Add Game'}</button>
        <a class="btn" href="${edit ? `#/game/${g.id}` : '#/library'}">Cancel</a>
      </div>
    </form>`;
    bindForm(edit, g);
  };

  const renderStatistics = () => {
    const s = store.stats();
    const games = store.list();
    const bar = (label, min, max) => `
      <div class="bar-row"><span class="bar-label">${escapeHtml(label)}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${max ? Math.round(min / max * 100) : 0}%"></div></div>
      <span class="bar-val">${fmtTime(min)}</span></div>`;
    const statusMin = {};
    Object.keys(STATUS).forEach(k => { statusMin[k] = games.filter(g => g.status === k).reduce((a, g) => a + g.playtimeMin, 0); });
    const maxStatus = Math.max(1, ...Object.values(statusMin));
    const sumBy = key => {
      const m = {};
      games.forEach(g => { m[g[key]] = (m[g[key]] || 0) + g.playtimeMin; });
      return m;
    };
    const platMin = Object.entries(sumBy('platform')).sort((a, b) => b[1] - a[1]);
    const maxPlat = Math.max(1, ...platMin.map(t => t[1]));
    const topGenre = Object.entries(sumBy('genre')).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const maxGenre = Math.max(1, ...topGenre.map(t => t[1]));
    const completion = s.total ? Math.round(s.completed / s.total * 100) : 0;
    main.innerHTML = `
      <section class="stat-row" aria-label="Summary">
        <div class="panel stat"><span class="stat-num">${fmtTime(s.totalMin)}</span><span class="stat-label">Total Playtime</span></div>
        <div class="panel stat"><span class="stat-num">${s.total}</span><span class="stat-label">Total Games</span></div>
        <div class="panel stat"><span class="stat-num">${s.completed}</span><span class="stat-label">Completed</span></div>
        <div class="panel stat"><span class="stat-num">${completion}%</span><span class="stat-label">Completion</span></div>
      </section>
      <section class="panel chart"><h2 class="section-title">Playtime by Status</h2>${Object.entries(STATUS).map(([k, l]) => bar(l, statusMin[k], maxStatus)).join('')}</section>
      <section class="panel chart"><h2 class="section-title">Playtime by Platform</h2>${platMin.map(([l, m]) => bar(l, m, maxPlat)).join('')}</section>
      <section class="panel chart"><h2 class="section-title">Playtime by Genre</h2>${topGenre.map(([l, m]) => bar(l, m, maxGenre)).join('')}</section>`;
  };

  const renderSettings = () => {
    main.innerHTML = `
    <section class="panel settings-panel">
      <h2 class="section-title">Backend Connection</h2>
      <dl class="settings-grid">
        ${kv('REST API Base', `<span class="mono">${escapeHtml(CONFIG.API_BASE_URL)}</span>`)}
        ${kv('WebSocket', `<span class="mono">${escapeHtml(CONFIG.WEBSOCKET_URL)}</span>`)}
        ${kv('WebSocket Status', '<span id="settingsWsStatus">…</span>')}
        ${kv('Data Source', 'Local placeholder data')}
      </dl>
      <p class="settings-note">The UI runs on local placeholder data. Once the backend is available, REST calls and live activity events connect through <code>js/api.js</code> and <code>js/ws.js</code> using the endpoints above.</p>
    </section>
    <section class="panel settings-panel">
      <h2 class="section-title">Live Activity</h2>
      <p class="settings-note">Activities tracked by the backend: Sleeping, Walking, Mining, Fighting, Exploring, In Menu, Paused, Unknown. Events update the library in real time without a page reload.</p>
    </section>`;
    setConn(wsStatus);
  };

  let wsStatus = 'connecting';
  const setConn = s => {
    wsStatus = s;
    const el = document.getElementById('connStatus');
    if (el) {
      el.className = `conn conn-${s}`;
      el.querySelector('.conn-text').textContent = s === 'online' ? 'Live' : s === 'connecting' ? 'Connecting' : 'Offline';
    }
    const sw = document.getElementById('settingsWsStatus');
    if (sw) sw.innerHTML = `<span class="conn-dot conn-dot-${s}" aria-hidden="true"></span> <span class="conn-text-inline">${s === 'online' ? 'Connected' : s === 'connecting' ? 'Connecting' : 'Offline'}</span>`;
  };

  const refreshGame = id => {
    const g = store.byId(id);
    if (!g) return;
    const heroWrap = document.getElementById('heroWrap');
    if (heroWrap) {
      const h = currentGame();
      heroWrap.innerHTML = heroHtml();
      if (h && h.id === id) pulse('heroActivity');
    }
    const wrap = document.querySelector(`.card-wrap[data-id="${id}"]`);
    if (wrap) wrap.outerHTML = cardWrap(g);
    if (document.getElementById('s-total')) {
      const st = store.stats();
      document.getElementById('s-total').textContent = st.total;
      const map = { 's-playing': st.playing, 's-completed': st.completed, 's-backlog': st.backlog, 's-dropped': st.dropped };
      Object.entries(map).forEach(([k, v]) => { const el = document.getElementById(k); if (el) el.textContent = v; });
    }
    if (document.getElementById('dActivity')) {
      const dAct = document.getElementById('dActivity');
      dAct.textContent = g.activity;
      pulse('dActivity');
      const dt = document.getElementById('dPlaytime');
      if (dt) dt.textContent = fmtTime(g.playtimeMin);
      const ds = document.getElementById('dStatus');
      if (ds) { ds.className = `pill pill-${g.status}`; ds.textContent = STATUS[g.status]; }
      const df = document.getElementById('dFav');
      if (df) {
        df.innerHTML = `${favIcon(g.favorite)}${g.favorite ? ' Favorited' : ' Favorite'}`;
        df.setAttribute('aria-pressed', String(g.favorite));
      }
    }
  };

  return { renderLibrary, renderGameDetail, renderAddGame, renderStatistics, renderSettings, gridOnly, refreshGame, setConn };
})();
