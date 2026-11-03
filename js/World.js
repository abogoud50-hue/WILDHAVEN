import * as THREE from 'three';
import { CONFIG } from '../config.js';

const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

function rng(seed) { // مولّد أرقام عشوائية ثابت (نفس العالم لكل اللاعبين مستقبلاً)
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

export class World {
  constructor(scene, q) {
    this.q = q;
    this.R = CONFIG.world.radius;
    this.grid = new Map(); // شبكة مصادمات الأشجار والصخور
    this.cell = 8;
    this.rand = rng(CONFIG.world.seed);

    this._buildTerrain(scene);
    this._buildWater(scene);
    this._scatter(scene);
  }

  // ارتفاع التضاريس: شاطئ خارجي ← غابة ← جبل
  heightAt(x, z) {
    const d = Math.hypot(x, z) / this.R;
    const mask = smooth(0.7, 1.05, d);
    const n = Math.sin(x * 0.05) * Math.cos(z * 0.045) + 0.5 * Math.sin(x * 0.13 + z * 0.1);
    const mx = x + 60, mz = z + 50;
    const peak = Math.pow(Math.max(0, 1 - Math.hypot(mx, mz) / 75), 2) * 30;
    const inland = 1 - mask;
    return -4 + inland * 7 + n * 1.2 * inland + peak * inland;
  }

  _buildTerrain(scene) {
    const seg = this.q.segments, size = CONFIG.world.size;
    const geo = new THREE.PlaneGeometry(size, size, seg, seg);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position, col = new Float32Array(pos.count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i), h = this.heightAt(x, z);
      pos.setY(i, h);
      if (h < 1.6) c.set(0xdcc690);          // رمل
      else if (h < 12) c.set(0x3f7a3a).offsetHSL(0, 0, (Math.sin(x * .3) * Math.cos(z * .3)) * 0.03); // عشب
      else if (h < 22) c.set(0x7d7a72);      // صخر
      else c.set(0xe8ecef);                  // قمة
      col.set([c.r, c.g, c.b], i * 3);
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.computeVertexNormals();
    scene.add(new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true })));
  }

  _buildWater(scene) {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(2000, 2000).rotateX(-Math.PI / 2),
      new THREE.MeshLambertMaterial({ color: 0x2a7fa8, transparent: true, opacity: 0.8 })
    );
    m.position.y = -0.1;
    scene.add(m);
  }

  _addCollider(x, z, r) {
    const k = Math.floor(x / this.cell) + ',' + Math.floor(z / this.cell);
    if (!this.grid.has(k)) this.grid.set(k, []);
    this.grid.get(k).push({ x, z, r });
  }

  nearColliders(x, z) {
    const out = [], cx = Math.floor(x / this.cell), cz = Math.floor(z / this.cell);
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
      const a = this.grid.get((cx + i) + ',' + (cz + j));
      if (a) out.push(...a);
    }
    return out;
  }

  _scatter(scene) {
    const r = this.rand, S = CONFIG.world.size / 2 - 5, m = new THREE.Matrix4(), q = new THREE.Quaternion();
    const nT = this.q.trees, nR = this.q.rocks;
    const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.2, 0.3, 2.4, 5), new THREE.MeshLambertMaterial({ color: 0x6b4a2b }), nT);
    const leaves = new THREE.InstancedMesh(new THREE.ConeGeometry(1.5, 4.5, 6), new THREE.MeshLambertMaterial({ color: 0x1f5c2e, flatShading: true }), nT);
    const rocks = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0), new THREE.MeshLambertMaterial({ color: 0x8a8880, flatShading: true }), nR);

    let t = 0, tries = 0;
    while (t < nT && tries++ < nT * 20) {
      const x = (r() * 2 - 1) * S, z = (r() * 2 - 1) * S, h = this.heightAt(x, z);
      if (h < 2.2 || h > 13) continue;
      const s = 0.8 + r() * 0.7;
      m.compose(new THREE.Vector3(x, h + 1.2 * s, z), q, new THREE.Vector3(s, s, s)); trunks.setMatrixAt(t, m);
      m.compose(new THREE.Vector3(x, h + 4.2 * s, z), q, new THREE.Vector3(s, s, s)); leaves.setMatrixAt(t, m);
      this._addCollider(x, z, 0.45 * s);
      t++;
    }
    trunks.count = leaves.count = t;

    let k = 0; tries = 0;
    while (k < nR && tries++ < nR * 20) {
      const x = (r() * 2 - 1) * S, z = (r() * 2 - 1) * S, h = this.heightAt(x, z);
      if (h < 0.8) continue;
      const s = 0.6 + r() * 1.6;
      m.compose(new THREE.Vector3(x, h + s * 0.4, z), q, new THREE.Vector3(s, s * 0.8, s)); rocks.setMatrixAt(k, m);
      this._addCollider(x, z, s * 0.85);
      k++;
    }
    rocks.count = k;
    scene.add(trunks, leaves, rocks);
  }
}
