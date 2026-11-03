import { CONFIG } from '../config.js';

export class Minimap {
  constructor(world) {
    this.cv = document.getElementById('mini');
    this.ctx = this.cv.getContext('2d');
    const S = this.S = this.cv.width, half = this.half = CONFIG.world.size / 2;
    this.t = 0;
    // رسم التضاريس مرة واحدة فقط
    const b = document.createElement('canvas'); b.width = b.height = S;
    const bc = b.getContext('2d'), im = bc.createImageData(S, S);
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
      const h = world.heightAt((i / S - 0.5) * 2 * half, (j / S - 0.5) * 2 * half);
      const c = h < -0.1 ? [38, 98, 135] : h < 1.6 ? [220, 198, 144] : h < 12 ? [63, 122, 58] : h < 22 ? [125, 122, 114] : [232, 236, 239];
      im.data.set([c[0], c[1], c[2], 255], (j * S + i) * 4);
    }
    bc.putImageData(im, 0, 0);
    this.base = b;
  }
  toMap(x, z) { return [(x / (2 * this.half) + 0.5) * this.S, (z / (2 * this.half) + 0.5) * this.S]; }
  update(dt, p) {
    this.t += dt; if (this.t < 0.1) return; this.t = 0;
    const c = this.ctx;
    c.clearRect(0, 0, this.S, this.S);
    c.drawImage(this.base, 0, 0);
    c.font = '11px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    for (const z of CONFIG.zones) {
      const [mx, my] = this.toMap(z.x, z.z);
      c.fillStyle = 'rgba(0,0,0,.55)'; c.beginPath(); c.arc(mx, my, 7, 0, 6.3); c.fill();
      c.fillText(z.icon, mx, my + 1);
    }
    const [px, py] = this.toMap(p.x, p.z);
    c.save(); c.translate(px, py); c.rotate(-p.yaw);
    c.fillStyle = '#ffd24a'; c.strokeStyle = '#000'; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(0, -7); c.lineTo(5, 6); c.lineTo(0, 3); c.lineTo(-5, 6); c.closePath(); c.fill(); c.stroke();
    c.restore();
  }
}
