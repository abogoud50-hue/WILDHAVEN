import { ITEMS } from '../player/Inventory.js';

export class Hotbar {
  constructor(inv) {
    this.inv = inv;
    this.el = document.getElementById('hotbar');
    this.name = document.getElementById('itemName');
    this.cells = [];
    for (let i = 0; i < 6; i++) {
      const c = document.createElement('div');
      c.addEventListener('pointerdown', (e) => { e.preventDefault(); inv.select(i); });
      this.el.appendChild(c); this.cells.push(c);
    }
    inv.onChange = (show) => this.render(show);
    this.render();
  }
  render(show) {
    this.cells.forEach((c, i) => {
      const s = this.inv.slots[i];
      c.className = 'slot' + (i === this.inv.sel ? ' sel' : '');
      c.innerHTML = s ? `<span>${ITEMS[s.id].i}</span>${s.count > 1 ? `<b>${s.count}</b>` : ''}` : '';
    });
    if (show) {
      const s = this.inv.current;
      this.name.textContent = s ? ITEMS[s.id].n : '';
      this.name.style.opacity = s ? 1 : 0;
      clearTimeout(this._t);
      this._t = setTimeout(() => (this.name.style.opacity = 0), 1500);
    }
  }
}
