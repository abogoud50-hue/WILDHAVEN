import * as THREE from 'three';
// لاعب جماعي محلي: يتصل بخادم server.js على نفس الشبكة (Wi-Fi أو نقطة اتصال). المضيف يحصل على رمز من 6 أرقام.
export class Net {
  constructor(scene, player) { Object.assign(this, { scene, player, peers: new Map(), ws: null, t: 0, onStatus: () => {} }); }
  _open(first) {
    this.close();
    const ws = this.ws = new WebSocket((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host);
    ws.onopen = () => ws.send(JSON.stringify(first));
    ws.onerror = () => this.onStatus('تعذر الاتصال. شغّل server.js وافتح اللعبة من عنوانه (http) على نفس الشبكة.');
    ws.onclose = () => { this.peers.forEach((p) => this.scene.remove(p.m)); this.peers.clear(); this.room = false; };
    ws.onmessage = (e) => {
      const m = JSON.parse(e.data);
      if (m.t === 'code') { this.room = true; this.onStatus('رمز الجلسة: ' + m.code); }
      else if (m.t === 'ok') { this.room = true; this.onStatus('تم الانضمام إلى الجلسة'); }
      else if (m.t === 'err') this.onStatus('الرمز غير صحيح');
      else if (m.t === 'left') { const p = this.peers.get(m.id); if (p) { this.scene.remove(p.m); this.peers.delete(m.id); } }
      else if (m.t === 's') {
        let p = this.peers.get(m.id);
        if (!p) { p = { m: this._mk(), x: m.x, y: m.y, z: m.z }; this.peers.set(m.id, p); this.scene.add(p.m); }
        Object.assign(p, { tx: m.x, ty: m.y, tz: m.z, r: m.r });
      }
    };
  }
  _mk() {
    const mat = (c) => new THREE.MeshLambertMaterial({ color: c }), g = new THREE.Group();
    const b = new THREE.Mesh(new THREE.CapsuleGeometry(.28, .7, 4, 8), mat(0x3f7fd0)); b.position.y = .85;
    const h = new THREE.Mesh(new THREE.SphereGeometry(.2, 10, 8), mat(0xe0b48c)); h.position.y = 1.6;
    g.add(b, h); return g;
  }
  host() { this._open({ t: 'host' }); }
  join(code) { this._open({ t: 'join', code }); }
  close() { if (this.ws) { this.ws.onclose = null; this.ws.close(); } this.ws = null; this.peers.forEach((p) => this.scene.remove(p.m)); this.peers.clear(); this.room = false; }
  update(dt) {
    if (!this.room || !this.ws || this.ws.readyState !== 1) return;
    this.t += dt;
    if (this.t >= 0.1) { this.t = 0; const p = this.player; this.ws.send(JSON.stringify({ t: 's', x: p.x, y: p.y, z: p.z, r: p.face })); }
    const k = Math.min(1, dt * 10);
    this.peers.forEach((p) => {
      if (p.tx === undefined) return;
      p.x += (p.tx - p.x) * k; p.y += (p.ty - p.y) * k; p.z += (p.tz - p.z) * k;
      p.m.position.set(p.x, p.y, p.z); p.m.rotation.y = p.r;
    });
  }
}
