import * as THREE from 'three';
import { CONFIG } from '../config.js';

const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const W = {
  clear:  { n: 'صافٍ',  cloud: 0,  rain: 0, fog: 0 },
  cloudy: { n: 'غائم',  cloud: 1,  rain: 0, fog: 0 },
  rain:   { n: 'ماطر',  cloud: 1,  rain: 1, fog: 0.3 },
  fog:    { n: 'ضباب',  cloud: .5, rain: 0, fog: 1 },
};
const BAG = ['clear', 'clear', 'clear', 'cloudy', 'cloudy', 'rain', 'fog'];
const NIGHT = new THREE.Color(0x060a18), DAY = new THREE.Color(0x9ccbe8), DUSK = new THREE.Color(0xe0885a);
const GREY = new THREE.Color(0x8a939b), WHITE = new THREE.Color(0xffffff), WARM = new THREE.Color(0xffa860);

export class Environment {
  constructor(scene, camera, q, sun, hemi) {
    Object.assign(this, { scene, camera, q, sun, hemi });
    this.time = CONFIG.day.startHour / 24;
    this.cur = { cloud: 0, rain: 0, fog: 0 };
    this.tgt = W.clear; this.weatherName = W.clear.n; this.timer = 60;
    this.day = 1; this.sunDir = new THREE.Vector3(); this.c = new THREE.Color(); this.g = new THREE.Color();

    scene.add(sun.target);
    sun.castShadow = q.shadows;
    if (q.shadows) {
      const s = sun.shadow, c = s.camera;
      s.mapSize.set(q.shadowMap, q.shadowMap);
      c.left = c.bottom = -45; c.right = c.top = 45; c.near = 1; c.far = 260; s.bias = -0.0006;
    }

    const orb = (r, col) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 8), new THREE.MeshBasicMaterial({ color: col, fog: false, depthWrite: false })); scene.add(m); return m; };
    this.sunM = orb(5, 0xfff3c0); this.moonM = orb(3.5, 0xdfe6f5);

    const n = 250, p = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const u = Math.random() * 2 - 1, a = Math.random() * 6.283, r = Math.sqrt(1 - u * u);
      p.set([r * Math.cos(a) * 105, Math.abs(u) * 105, r * Math.sin(a) * 105], i * 3);
    }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(p, 3));
    this.stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 2, sizeAttenuation: false, fog: false, transparent: true, depthWrite: false }));
    this.stars.frustumCulled = false; scene.add(this.stars);

    this.rn = q.rain; this.rp = new Float32Array(this.rn * 6);
    for (let i = 0; i < this.rn; i++) {
      const x = (Math.random() - .5) * 30, y = Math.random() * 20 - 10, z = (Math.random() - .5) * 30;
      this.rp.set([x, y, z, x, y + .7, z], i * 6);
    }
    const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.BufferAttribute(this.rp, 3));
    this.rainM = new THREE.LineSegments(rg, new THREE.LineBasicMaterial({ color: 0xb8c4d8, transparent: true, opacity: 0, fog: false }));
    this.rainM.frustumCulled = false; scene.add(this.rainM);
  }

  get clock() {
    const h = (this.time * 24) | 0, m = ((this.time * 24 - h) * 60) | 0;
    return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
  }

  update(dt, p) {
    const cam = this.camera.position;
    this.time = (this.time + dt / CONFIG.day.lengthSec) % 1;

    this.timer -= dt;
    if (this.timer <= 0) { const k = BAG[(Math.random() * BAG.length) | 0]; this.tgt = W[k]; this.weatherName = W[k].n; this.timer = 50 + Math.random() * 60; }
    const k = Math.min(1, dt * 0.25);
    for (const f in this.cur) this.cur[f] += (this.tgt[f] - this.cur[f]) * k;
    const { cloud, rain, fog } = this.cur;

    const a = (this.time - 0.25) * Math.PI * 2;
    this.sunDir.set(Math.cos(a), Math.sin(a), 0.3).normalize();
    const e = this.sunDir.y, day = this.day = sm(-0.12, 0.25, e);
    const dusk = Math.max(0, 1 - Math.abs(e) / 0.25);

    const c = this.c.copy(NIGHT).lerp(DAY, day).lerp(DUSK, dusk * 0.55);
    c.lerp(this.g.copy(GREY).multiplyScalar(0.15 + 0.85 * day), cloud * 0.6);
    this.scene.background.copy(c);
    const f = this.scene.fog; f.color.copy(c);
    f.far = this.q.fog * (1 - 0.5 * Math.max(fog, rain * 0.6)); f.near = f.far * (0.4 - 0.3 * fog);

    const L = this.sun, s = e > -0.05 ? 1 : -1;
    L.position.set(p.x + this.sunDir.x * 100 * s, p.y + this.sunDir.y * 100 * s, p.z + this.sunDir.z * 100 * s);
    L.target.position.set(p.x, p.y, p.z);
    L.intensity = Math.max(day * 1.3 * (1 - 0.6 * cloud), (1 - day) * 0.22);
    L.color.copy(WHITE).lerp(WARM, dusk * 0.6);
    this.hemi.intensity = 0.22 + 0.8 * day * (1 - 0.4 * cloud);

    this.sunM.position.copy(cam).addScaledVector(this.sunDir, 100);
    this.moonM.position.copy(cam).addScaledVector(this.sunDir, -100);
    this.sunM.visible = e > -0.08 && cloud < 0.85;
    this.moonM.visible = e < 0.1 && cloud < 0.85;
    this.stars.position.copy(cam);
    this.stars.material.opacity = (1 - day) * (1 - cloud * 0.9);

    const rm = this.rainM;
    rm.visible = rain > 0.03;
    if (rm.visible) {
      rm.material.opacity = 0.55 * rain; rm.position.copy(cam);
      const r = this.rp, fall = 28 * dt;
      for (let i = 0; i < this.rn; i++) {
        r[i * 6 + 1] -= fall; r[i * 6 + 4] -= fall;
        if (r[i * 6 + 1] < -10) { r[i * 6 + 1] += 20; r[i * 6 + 4] += 20; }
      }
      rm.geometry.attributes.position.needsUpdate = true;
    }
  }
}
