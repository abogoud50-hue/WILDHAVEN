// WILDHAVEN - Network Module
// حالياً: تجهيز واجهة الشبكة دون تفعيل اللعب الجماعي بعد.

export class Net {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.onStatus = null;
    this.enabled = false;
    this.status = 'اللعب الجماعي غير متاح حالياً';
  }

  setStatus(message) {
    this.status = message;
    if (typeof this.onStatus === 'function') {
      this.onStatus(message);
    }
  }

  host() {
    this.setStatus('اللعب الجماعي لم يتم تفعيله بعد');
  }

  join(code) {
    this.setStatus('الاتصال باللاعبين غير متاح حالياً');
  }

  update(dt) {
    // سيتم إضافة تحديث الاتصال هنا عند تنفيذ نظام الشبكة.
  }

  disconnect() {
    this.setStatus('غير متصل');
  }
}
