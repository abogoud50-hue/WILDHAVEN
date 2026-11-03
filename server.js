// خادم اللعب المحلي: يقدّم ملفات اللعبة + وسيط WebSocket. التشغيل: npm install && node server.js
const http = require('http'), fs = require('fs'), path = require('path'), { WebSocketServer } = require('ws');
const T = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css' }, rooms = new Map();
const srv = http.createServer((q, r) => {
  const u = q.url.split('?')[0], p = path.join(__dirname, u === '/' ? 'index.html' : u);
  if (!p.startsWith(__dirname + path.sep) || !T[path.extname(p)] || p === __filename) { r.writeHead(404); return r.end(); }
  fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': T[path.extname(p)] }); r.end(d); });
});
let nid = 1;
new WebSocketServer({ server: srv }).on('connection', (ws) => {
  ws.id = nid++;
  ws.on('message', (raw) => {
    let m; try { m = JSON.parse(raw); } catch { return; }
    if (m.t === 'host') {
      let c; do c = String(100000 + Math.floor(Math.random() * 900000)); while (rooms.has(c));
      rooms.set(c, new Set([ws])); ws.room = c; ws.send(JSON.stringify({ t: 'code', code: c }));
    } else if (m.t === 'join') {
      const r = rooms.get(String(m.code));
      if (!r) return ws.send(JSON.stringify({ t: 'err' }));
      r.add(ws); ws.room = String(m.code); ws.send(JSON.stringify({ t: 'ok' }));
    } else if (m.t === 's' && ws.room) {
      const out = JSON.stringify({ t: 's', id: ws.id, x: m.x, y: m.y, z: m.z, r: m.r });
      for (const o of rooms.get(ws.room)) if (o !== ws && o.readyState === 1) o.send(out);
    }
  });
  ws.on('close', () => {
    const r = rooms.get(ws.room); if (!r) return;
    r.delete(ws); for (const o of r) o.send(JSON.stringify({ t: 'left', id: ws.id }));
    if (!r.size) rooms.delete(ws.room);
  });
});
srv.listen(8080, '0.0.0.0', () => {
  const ips = Object.values(require('os').networkInterfaces()).flat().filter((i) => i.family === 'IPv4' && !i.internal);
  console.log('افتح اللعبة من الأجهزة على نفس الشبكة:'); ips.forEach((i) => console.log(`  http://${i.address}:8080`));
});
