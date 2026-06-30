/**
 * 护眼计时器模块
 * 连续使用 20 分钟后弹出休息提示
 */

class EyeCareTimer {
  constructor() {
    this._timerId = null;
    this._startTime = null;
  }

  start() {
    // 从 sessionStorage 恢复（刷新不重置）
    const saved = sessionStorage.getItem('eyeCareStart');
    this._startTime = saved ? parseInt(saved) : Date.now();
    sessionStorage.setItem('eyeCareStart', this._startTime);

    this._timerId = setInterval(() => this._check(), 10000); // 每10秒检查
  }

  stop() {
    if (this._timerId) {
      clearInterval(this._timerId);
      this._timerId = null;
    }
  }

  reset() {
    this._startTime = Date.now();
    sessionStorage.setItem('eyeCareStart', this._startTime);
  }

  _check() {
    const elapsed = Date.now() - this._startTime;
    if (elapsed >= CONFIG.EYE_CARE_INTERVAL) {
      this._showReminder();
    }
  }

  _showReminder() {
    this.stop(); // 暂停计时
    const char = CONFIG.CHARACTERS[store.get('character')];
    ui.modal({
      title: '休息一下吧！',
      content: `${char.emoji} 说："眼睛累了，休息一下吧！看看远处的绿色，活动活动小手！"`,
      confirmText: '休息好了！',
      onConfirm: () => {
        this.reset();
        this.start();
      },
      closable: false,
    });
  }
}

const eyeCareTimer = new EyeCareTimer();
