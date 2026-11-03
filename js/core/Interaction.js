import { ITEMS } from '../player/Inventory.js';

const KINDS = {
  tree: { id: 'wood',  gain: 2, tool: 'axe',     need: 'فأس',  sfx: 'chop' },
  rock: { id: 'stone', gain: 1, tool: 'pickaxe', need: 'معول', sfx: 'pick' },
};

export class Interaction {
  constructor(world, player, inv, audio) {
    Object.assign(this, { world, player, inv, audio, cd: 0 });
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
    const cur = this.inv.current;
    this.btn.classList.toggle('ready', !!k && cur?.id === k.tool);
    this.lbl.textContent = cur ? ITEMS[cur.id].i : '✋';
    const act = input.consumeAct();
    if (act && this.cd <= 0) {
      this.cd = 0.45;
      if (!k) return this.audio.hit('miss');
      if (cur?.id !== k.tool) { this.audio.hit('hand'); return this.say(`تحتاج ${k.need}`); }
      this.audio.hit(k.sfx);
      const got = k.gain - this.inv.add(k.id, k.gain);
      if (got > 0) { best.left--; this.say(`+${got} ${ITEMS[k.id].n}`); } else this.say('الحقيبة ممتلئة');
    }
  }
}
