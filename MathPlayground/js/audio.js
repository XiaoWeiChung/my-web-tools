/**
 * 音效与语音播报模块
 */

class Audio {
  constructor() {
    this._ctx = null;
  }

  _getContext() {
    if (!this._ctx) {
      try {
        this._ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        return null;
      }
    }
    // 恢复被浏览器暂停的 context
    if (this._ctx && this._ctx.state === 'suspended') {
      this._ctx.resume();
    }
    return this._ctx;
  }

  // 播放简单音调
  _playTone(frequency, duration, type = 'sine') {
    if (!store.get('soundEnabled')) return;
    try {
      const ctx = this._getContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      // 静默忽略
    }
  }

  // 答对音效
  playCorrect() {
    this._playTone(523, 0.1);
    setTimeout(() => this._playTone(659, 0.1), 100);
    setTimeout(() => this._playTone(784, 0.2), 200);
  }

  // 答错音效
  playWrong() {
    this._playTone(200, 0.3, 'square');
  }

  // 获得星星
  playStar() {
    this._playTone(880, 0.1);
    setTimeout(() => this._playTone(1047, 0.15), 100);
  }

  // 按钮点击
  playClick() {
    this._playTone(440, 0.05);
  }

  // 通关
  playLevelUp() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => this._playTone(freq, 0.2), i * 150);
    });
  }

  // 语音播报
  speak(text) {
    if (!store.get('soundEnabled')) return;
    if (!window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      utterance.rate = CONFIG.SPEECH_RATE;
      utterance.pitch = 1.1;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      // 语音不可用，静默跳过
    }
  }
}

const audio = new Audio();
