// بوصلة أعلى منتصف الشاشة بأسلوب PUBG (الشمال = اتجاه -z)
const L = { 0: 'ش', 45: 'شر', 90: 'ق', 135: 'جر', 180: 'ج', 225: 'جغ', 270: 'غ', 315: 'شغ' };
export class Compass {
  constructor() { this.c = document.getElementById('cmp').getContext('2d'); }
  update(yaw) {
    const c = this.c, W = 360, h = (((-yaw * 180) / Math.PI) % 360 + 360) % 360;
    c.clearRect(0, 0, W, 46); c.direction = 'ltr'; c.textAlign = 'center'; c.fillStyle = c.strokeStyle = '#fff';
    for (let a = Math.floor((h - 62) / 5) * 5; a <= h + 62; a += 5) {
      const x = W / 2 + (a - h) * 2.8, d = ((a % 360) + 360) % 360;
      c.globalAlpha = Math.max(0, 1 - Math.abs(a - h) / 66);
      if (d % 45 === 0) { c.font = 'bold 14px system-ui'; c.fillStyle = d === 0 ? '#ff5a4a' : '#fff'; c.fillText(L[d], x, 38); }
      else if (d % 15 === 0) { c.font = '10px system-ui'; c.fillStyle = '#fff'; c.fillText(d, x, 38); }
      else c.fillRect(x - .5, 31, 1, 5);
    }
    c.globalAlpha = 1; c.fillStyle = '#e8b84a'; c.font = 'bold 13px system-ui'; c.fillText(Math.round(h) % 360 + '°', W / 2, 12);
    c.beginPath(); c.moveTo(W / 2 - 5, 16); c.lineTo(W / 2 + 5, 16); c.lineTo(W / 2, 23); c.fill();
  }
}
