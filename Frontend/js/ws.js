const wsClient = (() => {
  let socket = null;
  const statusListeners = new Set();
  const eventListeners = new Set();

  const setStatus = s => statusListeners.forEach(f => f(s));
  const onStatus = f => statusListeners.add(f);
  const onEvent = f => eventListeners.add(f);

  const connect = () => {
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) return;
    setStatus('connecting');
    try {
      socket = new WebSocket(CONFIG.WEBSOCKET_URL);
    } catch {
      setStatus('offline');
      return;
    }
    socket.onopen = () => setStatus('online');
    socket.onmessage = e => {
      let msg;
      try { msg = JSON.parse(e.data); } catch { return; }
      eventListeners.forEach(f => f(msg));
    };
    socket.onerror = () => setStatus('offline');
    socket.onclose = () => setStatus('offline');
  };

  return { connect, onStatus, onEvent };
})();
