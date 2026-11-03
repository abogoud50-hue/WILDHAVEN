import * as THREE from 'three';
// المنزل = نقطة البداية، وبجانبه مخزن محفوظ (يبقى بعد الموت).
export class Home {
  constructor(scene, world, x, z) {
    this.x = x + 3; this.z = z;
    const y = Math.max(world.heightAt(this.x, this.z), -0.6), M = (c) => new THREE.MeshLambertMaterial({ color: c });
    const b = new THREE.Mesh(new THREE.BoxGeometry(1.2, .8, .8), M(0x7a4e2a)); b.position.set(this.x, y + .4, this.z);
    const l = new THREE.Mesh(new THREE.BoxGeometry(1.3, .15, .9), M(0xe8b84a)); l.position.set(this.x, y + .87, this.z);
    scene.add(b, l);
    this.stash = JSON.parse(localStorage.getItem('wh_stash') || '[]');
  }
  near(p) { return Math.hypot(p.x - this.x, p.z - this.z) < 2.6; }
  _save() { localStorage.setItem('wh_stash', JSON.stringify(this.stash)); }
  // خانة ممسوكة → تخزين، خانة فارغة → سحب أول صنف
  use(inv, ITEMS) {
    const s = inv.current;
    if (s) {
      inv.slots[inv.sel] = null; inv.onChange();
      const t = this.stash.find((i) => i.id === s.id); t ? (t.count += s.count) : this.stash.push({ ...s });
      this._save(); return `📦 خُزّن ${ITEMS[s.id].n} ×${s.count}`;
    }
    const t = this.stash[0]; if (!t) return '📦 المخزن فارغ';
    const left = inv.add(t.id, t.count);
    if (left === t.count) return 'الحقيبة ممتلئة';
    const got = t.count - left; t.count = left; if (!left) this.stash.shift();
    this._save(); return `📦 سُحب ${ITEMS[t.id ?? 'wood']?.n ?? ''} ×${got}`;
  }
}
