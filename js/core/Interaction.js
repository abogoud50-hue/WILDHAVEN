import { ITEMS } from '../player/Inventory.js';

const KINDS = {
  tree: { id: 'wood',  gain: 2, label: '🪓 اقطع شجرة' },
  rock: { id: 'stone', gain: 1, label: '⛏️ اجمع حجر' },
};

export class Interaction {
  constructor(world, player, inv) {
    Object.assign(this, { world, player, inv, cd: 0 });
    this.btn = document.getElementById('btnAct');
    this.lbl = document.getElementById('actLbl');
    this.toast = document.getElementById('toast');
  }
  say(msg) {
    this.toast.textContent = msg; this.toast.style.opacity = 1;
    clearTimeout(this._t); this._t = setTimeout(() => (this.toast.style.opacity = 0), 1400);
  }
  update(dt, input) {
    this.cd -= dt;
    const p = this.player, fx = -Math.sin(p.yaw), fz = -Math.cos(p.yaw);
    let best = null, bd = 9;
    for (const c of this.world.nearColliders(p.x, p.z)) {
      if (c.left <= 0) continue;
      const dx = c.x - p.x, dz = c.z - p.z, len = Math.hypot(dx, dz), d = len - c.r;
      if (d > 1.6 || (dx * fx + dz * fz) / len < 0.35) continue; // قريب وأمامك
      if (d < bd) { bd = d; best = c; }
    }
    const k = best && KINDS[best.type];
    this.btn.classList.toggle('ready', !!k);
    this.lbl.textContent = k ? k.label : 'تفاعل';
    if (input.consumeAct() && k && this.cd <= 0) {
      this.cd = 0.45;
      const got = k.gain - this.inv.add(k.id, k.gain);
      if (got > 0) { best.left--; this.say(`+${got} ${ITEMS[k.id].n}`); } else this.say('الحقيبة ممتلئة');
    }
  }
}
