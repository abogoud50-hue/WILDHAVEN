// عصا تحكم عائمة (يسار) + سحب للنظر (يمين) + أزرار القفز والركض
export class TouchControls {
  constructor() {
    this.move = { x: 0, y: 0 };   // y موجب = للأمام
    this.look = { dx: 0, dy: 0 }; // يتجمع حتى يستهلكه اللاعب
    this.jump = false;
    this.sprint = false;
    this.act = false; this.cam = false;

    const $ = (id) => document.getElementById(id);
    const joyZone = $('joyZone'), base = $('joyBase'), knob = $('joyKnob');
    const lookZone = $('lookZone');
    const R = 50;
    let joyId = null, cx = 0, cy = 0;
    let lookId = null, lx = 0, ly = 0;

    joyZone.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (joyId !== null) return;
      const t = e.changedTouches[0];
      joyId = t.identifier; cx = t.clientX; cy = t.clientY;
      base.style.display = 'block';
      base.style.left = cx + 'px'; base.style.top = cy + 'px';
    }, { passive: false });

    joyZone.addEventListener('touchmove', (e) => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        if (t.identifier !== joyId) continue;
        let dx = t.clientX - cx, dy = t.clientY - cy;
        const len = Math.hypot(dx, dy);
        if (len > R) { dx = dx / len * R; dy = dy / len * R; }
        knob.style.transform = `translate(${dx}px, ${dy}px)`;
        this.move.x = dx / R; this.move.y = -dy / R;
      }
    }, { passive: false });

    const joyEnd = (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier !== joyId) continue;
        joyId = null; this.move.x = 0; this.move.y = 0;
        base.style.display = 'none'; knob.style.transform = '';
      }
    };
    joyZone.addEventListener('touchend', joyEnd);
    joyZone.addEventListener('touchcancel', joyEnd);

    lookZone.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (lookId !== null) return;
      const t = e.changedTouches[0];
      lookId = t.identifier; lx = t.clientX; ly = t.clientY;
    }, { passive: false });

    lookZone.addEventListener('touchmove', (e) => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        if (t.identifier !== lookId) continue;
        this.look.dx += t.clientX - lx; this.look.dy += t.clientY - ly;
        lx = t.clientX; ly = t.clientY;
      }
    }, { passive: false });

    const lookEnd = (e) => {
      for (const t of e.changedTouches) if (t.identifier === lookId) lookId = null;
    };
    lookZone.addEventListener('touchend', lookEnd);
    lookZone.addEventListener('touchcancel', lookEnd);

    $('btnJump').addEventListener('touchstart', (e) => { e.preventDefault(); this.jump = true; }, { passive: false });
    $('btnSprint').addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.sprint = !this.sprint;
      e.currentTarget.classList.toggle('on', this.sprint);
    }, { passive: false });

    $('btnAct').addEventListener('touchstart', (e) => { e.preventDefault(); this.act = true; }, { passive: false });

    // لوحة المفاتيح للاختبار على الكمبيوتر فقط
    const keys = {};
    const upd = () => {
      this.move.x = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0);
      this.move.y = (keys.KeyW ? 1 : 0) - (keys.KeyS ? 1 : 0);
    };
    addEventListener('keydown', (e) => { keys[e.code] = true; if (e.code === 'Space') this.jump = true; if (e.code === 'KeyE') this.act = true; if (e.code === 'KeyV') this.cam = true; if (e.code === 'ShiftLeft') this.sprint = true; upd(); });
    addEventListener('keyup', (e) => { keys[e.code] = false; if (e.code === 'ShiftLeft') this.sprint = false; upd(); });
  }

  consumeLook() {
    const d = { dx: this.look.dx, dy: this.look.dy };
    this.look.dx = 0; this.look.dy = 0;
    return d;
  }
  consumeJump() { const j = this.jump; this.jump = false; return j; }
  consumeAct() { const a = this.act; this.act = false; return a; }
  consumeCam() { const c = this.cam; this.cam = false; return c; }
}
