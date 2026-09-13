const api = (() => {
  const request = async (path, options = {}) => {
    const res = await fetch(CONFIG.API_BASE_URL + path, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    });
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    return res.status === 204 ? null : res.json();
  };

  return {
    getGames: () => request('/games'),
    getGame: id => request(`/games/${id}`),
    createGame: data => request('/games', { method: 'POST', body: JSON.stringify(data) }),
    updateGame: (id, data) => request(`/games/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    deleteGame: id => request(`/games/${id}`, { method: 'DELETE' }),
    currentActivity: () => request('/activity/current')
  };
})();
