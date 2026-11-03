export class Settings {
  constructor({ player, audio, net }) {
    const $ = (i) => document.getElementById(i);
    const st = Object.assign({ fps: true, vol: 90 }, JSON.parse(localStorage.getItem('wh_set') || '{}'));
    const apply = () => {
      localStorage.setItem('wh_set', JSON.stringify(st));
      $('fps').style.display = st.fps ? '' : 'none';
      $('sFps').textContent = st.fps ? 'تشغيل' : 'إيقاف'; $('sFps').classList.toggle('on', st.fps);
      $('sView').textContent = player.third ? 'ثالث' : 'أول';
      audio.vol = st.vol / 100; if (audio.out) audio.out.gain.value = audio.vol;
      $('sVol').value = st.vol;
    };
    $('btnSet').onclick = () => { apply(); $('settings').classList.add('show'); };
    $('sClose').onclick = () => $('settings').classList.remove('show');
    $('sView').onclick = () => { player.third = !player.third; apply(); };
    $('sFps').onclick = () => { st.fps = !st.fps; apply(); };
    $('sVol').oninput = (e) => { st.vol = +e.target.value; apply(); };
    net.onStatus = (m) => ($('sNet').textContent = m);
    $('sHost').onclick = () => net.host();
    $('sJoin').onclick = () => { const c = $('sCode').value.trim(); if (/^\d{6}$/.test(c)) net.join(c); else $('sNet').textContent = 'أدخل رمزاً من 6 أرقام'; };
    $('sReset').onclick = () => { if (confirm('إعادة ضبط اللعبة؟ ستُمسح الإعدادات ويُعاد تحميل العالم.')) { localStorage.clear(); location.reload(); } };
    apply();
  }
}
