export const ITEMS = {
  axe:     { n: 'فأس',   i: '🪓',  max: 1 },
  pickaxe: { n: 'معول',  i: '⛏️', max: 1 },
  knife:   { n: 'سكين',  i: '🔪',  max: 1 },
  apple:   { n: 'تفاحة', i: '🍎',  max: 10 },
  wood:    { n: 'خشب',   i: '🪵',  max: 20 },
  stone:   { n: 'حجر',   i: '🪨',  max: 20 },
};

export class Inventory {
  constructor() {
    this.slots = Array(6).fill(null);
    this.sel = 0;
    this.onChange = () => {};
    this.add('axe'); this.add('pickaxe'); this.add('knife'); this.add('apple', 3);
  }
  // يرجع الكمية التي لم تتسع
  add(id, n = 1) {
    const max = ITEMS[id].max;
    for (const s of this.slots) if (n && s && s.id === id && s.count < max) { const a = Math.min(n, max - s.count); s.count += a; n -= a; }
    for (let i = 0; i < 6 && n > 0; i++) if (!this.slots[i]) { const a = Math.min(n, max); this.slots[i] = { id, count: a }; n -= a; }
    this.onChange();
    return n;
  }
  select(i) { this.sel = i; this.onChange(true); }
  get current() { return this.slots[this.sel]; }
}
