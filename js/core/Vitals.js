// الصحة والطاقة: ركض 12/ث، سباحة 6/ث، قفز 8، ضربة 6. نفاد الطاقة = إنهاك حتى تعود إلى 25.
export class Vitals {
  constructor() {
    const $ = (i) => document.getElementById(i);
    this.e = { hpF: $('hpF'), hpT: $('hpT'), stF: $('stF'), stT: $('stT'), st: document.querySelector('.bar.st') };
    this.reset();
  }
  reset() { this.hp = 100; this.st = 100; this.tired = false; this._h = this._s = this._t = null; }
  can(n) { return !this.tired && this.st >= n; }
  spend(n) { this.st = Math.max(0, this.st - n); if (this.st <= 0) this.tired = true; }
  hurt(n) { this.hp = Math.max(0, this.hp - n); }
  heal(h, s) { this.hp = Math.min(100, this.hp + h); this.st = Math.min(100, this.st + s); if (this.st >= 25) this.tired = false; }
  update(dt, run, moving, swim) {
    if (run) this.spend(12 * dt);
    else if (swim && moving) this.spend(6 * dt);
    else this.st = Math.min(100, this.st + (moving ? 4 : 10) * dt);
    if (this.tired && this.st >= 25) this.tired = false;
    if (swim && this.tired) this.hurt(3 * dt);
    else if (this.st > 60 && this.hp < 100) this.hp = Math.min(100, this.hp + dt);
  }
  render() {
    const h = Math.round(this.hp), s = Math.round(this.st), e = this.e;
    if (h !== this._h) { this._h = h; e.hpF.style.width = h + '%'; e.hpT.textContent = h; }
    if (s !== this._s) { this._s = s; e.stF.style.width = s + '%'; e.stT.textContent = s; }
    if (this.tired !== this._t) { this._t = this.tired; e.st.classList.toggle('tired', this.tired); }
  }
}
