// صوت مُولَّد برمجياً (WebAudio) — بدون ملفات خارجية. لاحقاً يمكن استبداله بملفات مسجّلة بنفس الواجهة.
const STEP = { // [نوع الفلتر، التردد، الشدة، المدة]
  sand: ['lowpass', 1100, .25, .13], grass: ['bandpass', 1500, .2, .1],
  rock: ['highpass', 2200, .3, .07], water: ['bandpass', 700, .3, .28],
};

export class AudioManager {
  constructor() { this.ctx = null; this.birdT = 3; }

  start() {
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C || this.ctx) return;
    const x = this.ctx = new C();
    this.out = x.createGain(); this.out.gain.value = 0.9; this.out.connect(x.destination);

    const n = x.sampleRate * 3, buf = this.buf = x.createBuffer(1, n, x.sampleRate), d = buf.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < n; i++) { const w = Math.random() * 2 - 1; b0 = .99 * b0 + w * .07; b1 = .96 * b1 + w * .2; b2 = .8 * b2 + w * .5; d[i] = (b0 + b1 + b2 + w * .2) * .4; }

    const loop = (type, f) => {
      const s = x.createBufferSource(); s.buffer = buf; s.loop = true;
      const fl = x.createBiquadFilter(); fl.type = type; fl.frequency.value = f;
      const g = x.createGain(); g.gain.value = 0;
      s.connect(fl); fl.connect(g); g.connect(this.out); s.start(0, Math.random() * 2);
      return g;
    };
    this.wind = loop('lowpass', 450);
    this.waves = loop('lowpass', 800);
    this.rainG = loop('highpass', 1800);
    const lfo = x.createOscillator(); lfo.frequency.value = 0.13;
    const lg = x.createGain(); lg.gain.value = 0.06; lfo.connect(lg); lg.connect(this.waves.gain); lfo.start(); // تموّج الأمواج

    // صراصير الليل: تردد عالٍ مع تضمين سريع
    const o = x.createOscillator(); o.frequency.value = 4300;
    const am = x.createGain(); am.gain.value = 0.5;
    const l2 = x.createOscillator(); l2.type = 'square'; l2.frequency.value = 11;
    const lg2 = x.createGain(); lg2.gain.value = 0.5;
    this.crick = x.createGain(); this.crick.gain.value = 0;
    l2.connect(lg2); lg2.connect(am.gain); o.connect(am); am.connect(this.crick); this.crick.connect(this.out);
    o.start(); l2.start();
  }

  suspend(s) { if (this.ctx) s ? this.ctx.suspend() : this.ctx.resume(); }

  chirp() {
    const x = this.ctx, t = x.currentTime, o = x.createOscillator(), g = x.createGain();
    const f = 2200 + Math.random() * 1800, n = 2 + (Math.random() * 3 | 0);
    for (let i = 0; i < n; i++) {
      const s = t + i * .11;
      o.frequency.setValueAtTime(f, s); o.frequency.exponentialRampToValueAtTime(f * 1.35, s + .07);
      g.gain.setValueAtTime(0, s); g.gain.linearRampToValueAtTime(.045, s + .02); g.gain.linearRampToValueAtTime(0, s + .09);
    }
    o.connect(g); g.connect(this.out); o.start(t); o.stop(t + n * .11 + .1);
  }

  step(surface) {
    if (!this.ctx) return;
    const x = this.ctx, t = x.currentTime, P = STEP[surface] || STEP.grass;
    const s = x.createBufferSource(); s.buffer = this.buf;
    const f = x.createBiquadFilter(); f.type = P[0]; f.frequency.value = P[1] * (0.85 + Math.random() * .3); f.Q.value = .9;
    const g = x.createGain();
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(P[2], t + .015); g.gain.exponentialRampToValueAtTime(.001, t + P[3]);
    s.connect(f); f.connect(g); g.connect(this.out); s.start(t, Math.random() * 2, P[3] + .05);
  }

  update(dt, env, p, world) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime, cl = (v) => Math.min(1, Math.max(0, v));
    const alt = cl(p.y / 25), shore = cl((Math.hypot(p.x, p.z) / world.R - 0.62) / 0.3);
    const set = (g, v) => g.gain.setTargetAtTime(v, t, 0.6);
    set(this.wind, .03 + .1 * alt + .1 * env.cur.cloud + .05 * env.cur.rain);
    set(this.waves, .08 + .2 * shore);
    set(this.rainG, .2 * env.cur.rain);
    set(this.crick, .035 * (1 - env.day) * (1 - env.cur.rain) * (1 - shore * .6));
    this.birdT -= dt;
    if (this.birdT <= 0) { this.birdT = 4 + Math.random() * 9; if (env.day > .6 && env.cur.rain < .3 && shore < .9) this.chirp(); }
  }
}
