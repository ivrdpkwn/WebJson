++ /home/zhou/projects/WebJson/public/worker.js
// Web Worker for JSON formatting/minifying
self.addEventListener('message', (ev) => {
  const msg = ev.data || {};
  if (!msg.type || !msg.text) return;
  try {
    if (msg.type === 'format') {
      const j = JSON.parse(msg.text);
      // pretty with 4 spaces
      const out = JSON.stringify(j, null, 4);
      self.postMessage({ ok: true, result: out });
    } else if (msg.type === 'minify') {
      const j = JSON.parse(msg.text);
      const out = JSON.stringify(j);
      self.postMessage({ ok: true, result: out });
    } else {
      self.postMessage({ ok: false, error: 'unknown type' });
    }
  } catch (e) {
    self.postMessage({ ok: false, error: e && e.message ? e.message : String(e) });
  }
});
