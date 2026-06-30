/**
 * 通用 UI 工具模块
 */

class UI {
  constructor() {
    this._modalEl = null;
  }

  // 获取 app 容器
  getApp() {
    return document.getElementById('app');
  }

  // 渲染页面内容
  render(html) {
    const app = this.getApp();
    app.innerHTML = html;
    app.classList.add('fade-in');
    setTimeout(() => app.classList.remove('fade-in'), 300);
  }

  // 答对/答错反馈
  showFeedback(container, correct) {
    const el = document.createElement('div');
    el.className = `feedback ${correct ? 'feedback-correct' : 'feedback-wrong'}`;
    el.textContent = correct ? '✅ 答对啦！' : '❌ 再想想~';
    container.appendChild(el);
    setTimeout(() => el.remove(), 1500);
  }

  // 星星飞入动画
  starBurst(container, count = 1) {
    for (let i = 0; i < count; i++) {
      const star = document.createElement('span');
      star.className = 'star-burst';
      star.textContent = '⭐';
      star.style.animationDelay = `${i * 0.1}s`;
      container.appendChild(star);
      setTimeout(() => star.remove(), 1000);
    }
  }

  // Toast 消息
  toast(text, duration = 2000) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = text;
    document.body.appendChild(el);
    setTimeout(() => {
      el.classList.add('toast-hide');
      setTimeout(() => el.remove(), 300);
    }, duration);
  }

  // 模态弹窗
  modal({ title, content, confirmText = '确定', cancelText, onConfirm, onCancel, closable = true }) {
    // 移除已有弹窗
    this.closeModal();

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-box bounce-in">
        <h2 class="modal-title">${title}</h2>
        <div class="modal-content">${content}</div>
        <div class="modal-actions">
          ${cancelText ? `<button class="btn btn-secondary modal-cancel">${cancelText}</button>` : ''}
          <button class="btn btn-primary modal-confirm">${confirmText}</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    this._modalEl = overlay;

    overlay.querySelector('.modal-confirm').addEventListener('click', () => {
      this.closeModal();
      if (onConfirm) onConfirm();
    });

    if (cancelText) {
      overlay.querySelector('.modal-cancel').addEventListener('click', () => {
        this.closeModal();
        if (onCancel) onCancel();
      });
    }

    if (closable) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          this.closeModal();
          if (onCancel) onCancel();
        }
      });
    }
  }

  closeModal() {
    if (this._modalEl) {
      this._modalEl.remove();
      this._modalEl = null;
    }
  }

  // 生成选项按钮 HTML
  renderOptions(options, onSelect) {
    const container = document.createElement('div');
    container.className = 'options-grid';
    options.forEach((opt) => {
      const btn = document.createElement('button');
      btn.className = 'btn btn-option';
      btn.textContent = opt.label ?? opt;
      btn.addEventListener('click', () => onSelect(opt.value ?? opt, btn));
      container.appendChild(btn);
    });
    return container;
  }

  // 顶部导航栏 HTML
  renderHeader() {
    const state = store.get();
    const char = CONFIG.CHARACTERS[state.character];
    return `
      <header class="header">
        <button class="btn btn-icon btn-back" id="btnBack">← 返回</button>
        <div class="header-center">
          <span class="header-avatar">${char.emoji}</span>
          <span class="header-title">${CONFIG.APP_NAME}</span>
        </div>
        <div class="header-stars">
          <span class="star-count">⭐ ${state.stars}</span>
        </div>
      </header>
    `;
  }

  // 绑定返回按钮
  bindBack(router) {
    const btn = document.getElementById('btnBack');
    if (btn) {
      btn.addEventListener('click', () => router.navigate('/'));
    }
  }
}

const ui = new UI();
