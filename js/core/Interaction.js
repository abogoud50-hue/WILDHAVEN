import { ITEMS } from '../player/Inventory.js';

const KINDS = {
  tree: { id: 'wood',  gain: 2, tool: 'axe',     need: 'فأس',  sfx: 'chop' },
  rock: { id: 'stone', gain: 1, tool: 'pickaxe', need: 'معول', sfx: 'pick' },
};

export class Interaction {
  constructor(world, player, inv, audio, vit, home) {
    Object.assign(this, { world, player, inv, audio, vit, home, cd: 0 });
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
    const p = this.player, V = this.vit, fx = -Math.sin(p.yaw), fz = -Math.cos(p.yaw);
    let best = null, bd = 9;
    for (const c of this.world.nearColliders(p.x, p.z)) {
      if (c.left <= 0) continue;
      const dx = c.x - p.x, dz = c.z - p.z, len = Math.hypot(dx, dz), d = len - c.r;
      if (d > 1.6 || (dx * fx + dz * fz) / len < 0.35) continue; // قريب وأمامك
      if (d < bd) { bd = d; best = c; }
    }
    const k = best && KINDS[best.type], cur = this.inv.current, atHome = !k && this.home.near(p);
    this.btn.classList.toggle('ready', !!(k && cur?.id === k.tool && !V.tired) || atHome || cur?.id === 'apple');
    this.lbl.textContent = atHome ? '📦' : cur ? ITEMS[cur.id].i : '✋';
    const act = input.consumeAct();
    if (!act || this.cd > 0) return;
    this.cd = 0.45;
    if (atHome) return this.say(this.home.use(this.inv, ITEMS));
    if (!k && cur?.id === 'apple') { this.inv.use(this.inv.sel); V.heal(10, 35); this.audio.hit('hand'); return this.say('🍎 +طاقة'); }
    if (!k) return this.audio.hit('miss');
    if (cur?.id !== k.tool) { this.audio.hit('hand'); return this.say(`تحتاج ${k.need}`); }
    if (!V.can(6)) return this.say('منهك — استرح أو كل تفاحة');
    V.spend(6); this.audio.hit(k.sfx);
    const got = k.gain - this.inv.add(k.id, k.gain);
    if (got > 0) { best.left--; this.say(`+${got} ${ITEMS[k.id].n}`); } else this.say('الحقيبة ممتلئة');
  }
}
