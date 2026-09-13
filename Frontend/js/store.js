const store = (() => {
  const NOW = 1789171200000;
  const games = [
    { id: 'minecraft', title: 'Minecraft', platform: 'PC', genre: 'Sandbox', releaseYear: 2011, status: 'playing', rating: 5, playtimeMin: 2538, activity: 'Sleeping', lastPlayed: 'Today', addedAt: 1761500000000, lastPlayedAt: NOW - 7200000, favorite: true, notes: 'Building a survival base.', cover: 'assets/covers/minecraft.png' },
    { id: 'elden-ring', title: 'Elden Ring', platform: 'PC', genre: 'Action RPG', releaseYear: 2022, status: 'playing', rating: 5, playtimeMin: 4080, activity: 'Fighting', lastPlayed: 'Today', addedAt: 1770000000000, lastPlayedAt: NOW - 18000000, favorite: false, notes: 'Raiding the capital with two friends.', cover: 'assets/covers/elden-ring.png' },
    { id: 'god-of-war', title: 'God of War', platform: 'PlayStation 5', genre: 'Action', releaseYear: 2018, status: 'completed', rating: 5, playtimeMin: 1980, activity: 'Unknown', lastPlayed: 'Last week', addedAt: 1772000000000, lastPlayedAt: NOW - 518400000, favorite: false, notes: '', cover: 'assets/covers/god-of-war.png' },
    { id: 'baldurs-gate-3', title: "Baldur's Gate 3", platform: 'PC', genre: 'RPG', releaseYear: 2023, status: 'completed', rating: 5, playtimeMin: 7200, activity: 'Unknown', lastPlayed: '1 week ago', addedAt: 1774000000000, lastPlayedAt: NOW - 777600000, favorite: true, notes: 'Finished the origin tale, replaying Act 3.', cover: 'assets/covers/baldurs-gate-3.png' },
    { id: 'hades', title: 'Hades', platform: 'PC', genre: 'Roguelike', releaseYear: 2020, status: 'completed', rating: 5, playtimeMin: 3240, activity: 'Unknown', lastPlayed: '2 weeks ago', addedAt: 1756000000000, lastPlayedAt: NOW - 1036800000, favorite: false, notes: '', cover: 'assets/covers/hades.png' },
    { id: 'stardew-valley', title: 'Stardew Valley', platform: 'PC', genre: 'Simulation', releaseYear: 2016, status: 'completed', rating: 4, playtimeMin: 3180, activity: 'Unknown', lastPlayed: '2 weeks ago', addedAt: 1752000000000, lastPlayedAt: NOW - 1296000000, favorite: true, notes: '', cover: 'assets/covers/stardew-valley.png' },
    { id: 'celeste', title: 'Celeste', platform: 'Switch', genre: 'Platformer', releaseYear: 2018, status: 'completed', rating: 4, playtimeMin: 1560, activity: 'Unknown', lastPlayed: '3 weeks ago', addedAt: 1750000000000, lastPlayedAt: NOW - 1555200000, favorite: false, notes: '', cover: 'assets/covers/celeste.png' },
    { id: 'doom-eternal', title: 'DOOM Eternal', platform: 'PC', genre: 'FPS', releaseYear: 2020, status: 'paused', rating: 4, playtimeMin: 1860, activity: 'Paused', lastPlayed: 'Last month', addedAt: 1748000000000, lastPlayedAt: NOW - 2592000000, favorite: false, notes: '', cover: 'assets/covers/doom-eternal.png' },
    { id: 'starfield', title: 'Starfield', platform: 'PC', genre: 'RPG', releaseYear: 2023, status: 'dropped', rating: 2, playtimeMin: 480, activity: 'Unknown', lastPlayed: 'A month ago', addedAt: 1775000000000, lastPlayedAt: NOW - 3888000000, favorite: false, notes: '', cover: 'assets/covers/starfield.png' },
    { id: 'cyberpunk-2077', title: 'Cyberpunk 2077', platform: 'PC', genre: 'RPG', releaseYear: 2020, status: 'backlog', rating: 0, playtimeMin: 0, activity: 'Unknown', lastPlayed: 'Never', addedAt: NOW - 172800000, lastPlayedAt: 0, favorite: false, notes: '', cover: 'assets/covers/cyberpunk-2077.png' },
    { id: 'hollow-knight', title: 'Hollow Knight', platform: 'PC', genre: 'Metroidvania', releaseYear: 2017, status: 'backlog', rating: 0, playtimeMin: 0, activity: 'Unknown', lastPlayed: 'Never', addedAt: NOW - 259200000, lastPlayedAt: 0, favorite: false, notes: '', cover: 'assets/covers/hollow-knight.png' },
    { id: 'disco-elysium', title: 'Disco Elysium', platform: 'PC', genre: 'RPG', releaseYear: 2019, status: 'backlog', rating: 0, playtimeMin: 0, activity: 'Unknown', lastPlayed: 'Never', addedAt: NOW - 475200000, lastPlayedAt: 0, favorite: false, notes: '', cover: 'assets/covers/disco-elysium.png' }
  ];

  const filter = { status: 'all', search: '', sort: 'recent' };

  const sorters = {
    recent: (a, b) => b.lastPlayedAt - a.lastPlayedAt,
    added: (a, b) => b.addedAt - a.addedAt,
    title: (a, b) => a.title.localeCompare(b.title),
    playtime: (a, b) => b.playtimeMin - a.playtimeMin,
    rating: (a, b) => b.rating - a.rating
  };

  const byId = id => games.find(g => g.id === id);
  const list = () => games;

  const visible = () => {
    let out = games.slice();
    if (filter.status === 'favorites') out = out.filter(g => g.favorite);
    else if (filter.status !== 'all') out = out.filter(g => g.status === filter.status);
    const q = filter.search.trim().toLowerCase();
    if (q) out = out.filter(g => g.title.toLowerCase().includes(q));
    return out.sort(sorters[filter.sort] || sorters.recent);
  };

  const stats = () => {
    const count = s => games.filter(g => g.status === s).length;
    return {
      total: games.length,
      playing: count('playing'),
      completed: count('completed'),
      backlog: count('backlog'),
      paused: count('paused'),
      dropped: count('dropped'),
      totalMin: games.reduce((a, g) => a + g.playtimeMin, 0)
    };
  };

  const setFilter = patch => Object.assign(filter, patch);
  const getFilter = () => ({ ...filter });

  const slug = t => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'game';

  const add = data => {
    let id = slug(data.title), n = 2;
    while (byId(id)) id = `${slug(data.title)}-${n++}`;
    const g = {
      id,
      title: data.title,
      platform: data.platform,
      genre: data.genre,
      releaseYear: data.releaseYear,
      status: data.status,
      rating: data.rating || 0,
      playtimeMin: 0,
      activity: data.status === 'playing' ? 'In Menu' : 'Unknown',
      lastPlayed: data.status === 'playing' ? 'Today' : 'Never',
      addedAt: Date.now(),
      lastPlayedAt: data.status === 'playing' ? Date.now() : 0,
      favorite: false,
      notes: data.notes || '',
      cover: data.cover || ''
    };
    games.unshift(g);
    return g;
  };

  const update = (id, patch) => {
    const g = byId(id);
    Object.assign(g, patch);
    return g;
  };

  const remove = id => {
    const g = byId(id);
    games.splice(games.indexOf(g), 1);
  };

  const toggleFavorite = id => {
    const g = byId(id);
    g.favorite = !g.favorite;
    return g;
  };

  return { byId, list, visible, stats, setFilter, getFilter, add, update, remove, toggleFavorite };
})();
