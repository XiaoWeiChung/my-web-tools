/**
 * 应用入口
 */
(function() {

// ===== 首页 =====
function renderHome() {
  const state = store.get();
  const char = CONFIG.CHARACTERS[state.character];

  const modulesHtml = CONFIG.MODULES.map(mod => {
    const progress = state.modules[mod.id];
    return `
      <button class="module-card" data-module="${mod.id}">
        <span class="module-emoji">${mod.emoji}</span>
        <span class="module-name">${mod.name}</span>
        <span class="module-desc">${mod.description}</span>
        <span class="module-level">第 ${progress.level} 关</span>
      </button>
    `;
  }).join('');

  ui.render(`
    <div class="home-page">
      <header class="home-header">
        <div class="home-avatar-section">
          <span class="home-avatar">${char.emoji}</span>
          <h1 class="home-title">${CONFIG.APP_NAME}</h1>
          <p class="home-subtitle">${char.name}陪你一起学数学！</p>
        </div>
        <div class="home-stats">
          <span class="stat-item">⭐ ${state.stars}</span>
          <span class="stat-item">🏅 ${state.badges.length}</span>
        </div>
      </header>
      <nav class="module-grid">
        ${modulesHtml}
      </nav>
      <footer class="home-footer">
        <button class="btn btn-secondary" id="btnSettings">⚙️ 设置</button>
        <button class="btn btn-secondary" id="btnProgress">🏆 成就</button>
      </footer>
    </div>
  `);

  // 绑定事件
  document.querySelectorAll('.module-card').forEach(card => {
    card.addEventListener('click', () => {
      audio.playClick();
      router.navigate('/' + card.dataset.module);
    });
  });

  document.getElementById('btnSettings')?.addEventListener('click', () => {
    audio.playClick();
    router.navigate('/settings');
  });

  document.getElementById('btnProgress')?.addEventListener('click', () => {
    audio.playClick();
    router.navigate('/progress');
  });
}

// ===== 设置页 =====
function renderSettings() {
  const state = store.get();

  const characterOptions = Object.entries(CONFIG.CHARACTERS).map(([id, char]) => {
    const unlocked = state.unlockedCharacters.includes(id);
    const selected = state.character === id;
    return `
      <button class="char-option ${selected ? 'selected' : ''} ${!unlocked ? 'locked' : ''}" 
              data-char="${id}" ${!unlocked ? 'disabled' : ''}>
        <span class="char-emoji">${char.emoji}</span>
        <span class="char-name">${char.name}</span>
        ${!unlocked ? `<span class="char-lock">🔒 ${char.unlockStars}⭐解锁</span>` : ''}
      </button>
    `;
  }).join('');

  ui.render(`
    <div class="settings-page">
      ${ui.renderHeader()}
      <div class="settings-body">
        <section class="settings-section">
          <h2>数字范围</h2>
          <div class="difficulty-options">
            ${CONFIG.DIFFICULTY_OPTIONS.map(d => `
              <button class="btn ${state.difficulty === d ? 'btn-primary' : 'btn-secondary'} btn-difficulty" data-diff="${d}">
                ${d} 以内
              </button>
            `).join('')}
          </div>
        </section>
        <section class="settings-section">
          <h2>选择角色</h2>
          <div class="char-grid">${characterOptions}</div>
        </section>
        <section class="settings-section">
          <h2>声音</h2>
          <button class="btn ${state.soundEnabled ? 'btn-primary' : 'btn-secondary'}" id="btnSound">
            ${state.soundEnabled ? '🔊 已开启' : '🔇 已关闭'}
          </button>
        </section>
        <section class="settings-section">
          <h2>数据</h2>
          <button class="btn btn-danger" id="btnReset">🗑️ 重置所有进度</button>
        </section>
      </div>
    </div>
  `);

  ui.bindBack(router);

  // 难度选择
  document.querySelectorAll('.btn-difficulty').forEach(btn => {
    btn.addEventListener('click', () => {
      store.set('difficulty', parseInt(btn.dataset.diff));
      renderSettings();
    });
  });

  // 角色选择
  document.querySelectorAll('.char-option:not([disabled])').forEach(btn => {
    btn.addEventListener('click', () => {
      store.set('character', btn.dataset.char);
      renderSettings();
    });
  });

  // 声音开关
  document.getElementById('btnSound')?.addEventListener('click', () => {
    store.set('soundEnabled', !store.get('soundEnabled'));
    renderSettings();
  });

  // 重置
  document.getElementById('btnReset')?.addEventListener('click', () => {
    ui.modal({
      title: '确认重置',
      content: '这会清除所有学习进度、星星和勋章，确定要重置吗？',
      confirmText: '确定重置',
      cancelText: '取消',
      onConfirm: () => {
        store.reset();
        ui.toast('已重置所有进度');
        renderSettings();
      },
    });
  });
}

// ===== 成就/进度页 =====
function renderProgress() {
  const state = store.get();

  const badgesHtml = CONFIG.BADGES.map(badge => {
    const unlocked = state.badges.includes(badge.id);
    return `
      <div class="badge-item ${unlocked ? 'unlocked' : 'locked'}">
        <span class="badge-emoji">${badge.emoji}</span>
        <span class="badge-name">${badge.name}</span>
        ${!unlocked ? '<span class="badge-lock">🔒</span>' : ''}
      </div>
    `;
  }).join('');

  const modulesHtml = CONFIG.MODULES.map(mod => {
    const progress = state.modules[mod.id];
    return `
      <div class="progress-module">
        <span>${mod.emoji} ${mod.name}</span>
        <span>第 ${progress.level} 关 | 最佳 ${progress.bestScore}⭐</span>
      </div>
    `;
  }).join('');

  ui.render(`
    <div class="progress-page">
      ${ui.renderHeader()}
      <div class="progress-body">
        <section class="progress-section">
          <h2>⭐ 星星总数：${state.stars}</h2>
        </section>
        <section class="progress-section">
          <h2>🏅 勋章收集</h2>
          <div class="badge-grid">${badgesHtml}</div>
        </section>
        <section class="progress-section">
          <h2>📊 学习进度</h2>
          <div class="progress-list">${modulesHtml}</div>
        </section>
      </div>
    </div>
  `);

  ui.bindBack(router);
}

// ===== 冒险故事场景 =====
const ADVENTURE_STORIES = {
  counting: [
    { intro: '小松鼠要收集松果过冬，帮它数一数树上有几个松果吧！', emoji: '🐿️' },
    { intro: '小蜜蜂要给花朵传粉，数数花园里有几朵花？', emoji: '🐝' },
    { intro: '小鸭子要过河，数数河里有几块石头可以踩？', emoji: '🦆' },
  ],
  arithmetic: [
    { intro: '小兔子有一些胡萝卜，妈妈又给了它一些，现在一共有几个？', emoji: '🐰' },
    { intro: '小猴子摘了一些桃子，吃掉几个后还剩几个？', emoji: '🐵' },
    { intro: '小熊要分蜂蜜给朋友们，算算够不够分？', emoji: '🐻' },
  ],
  comparison: [
    { intro: '两只小鸟比赛捉虫子，看看谁捉的多？', emoji: '🐦' },
    { intro: '两棵苹果树比一比，哪棵树上的苹果多？', emoji: '🌳' },
    { intro: '小猫和小狗比赛跳远，谁跳得更远？', emoji: '🐱' },
  ],
  shapes: [
    { intro: '小蚂蚁要搬家，帮它找到圆形的饼干当车轮！', emoji: '🐜' },
    { intro: '小鱼要穿过不同形状的门洞，认出这是什么形状？', emoji: '🐟' },
    { intro: '小鸟要筑巢，帮它找到三角形的树枝搭屋顶！', emoji: '🐤' },
  ],
  patterns: [
    { intro: '小蜗牛的壳上有漂亮的花纹，下一个应该是什么？', emoji: '🐌' },
    { intro: '花园里的花是按规律种的，猜猜下一朵是什么颜色？', emoji: '🌷' },
    { intro: '小火车的车厢有规律地排列，下一节是什么？', emoji: '🚂' },
  ],
  sorting: [
    { intro: '小朋友们要排队做操，帮他们从矮到高排好队！', emoji: '👦' },
    { intro: '图书馆的书要按号码排好，帮忙排一排！', emoji: '📚' },
    { intro: '彩虹桥的石阶要从小到大排列才能走过去！', emoji: '🌈' },
  ],
};

// ===== 模式选择页 =====
function renderModeSelect(moduleId) {
  const modConfig = CONFIG.MODULES.find(m => m.id === moduleId);
  if (!modConfig) { router.navigate('/'); return; }

  const state = store.get();
  const char = CONFIG.CHARACTERS[state.character];

  ui.render(`
    <div class="mode-select-page">
      ${ui.renderHeader()}
      <div class="mode-select-body">
        <div class="mode-select-title">
          <span class="mode-module-emoji">${modConfig.emoji}</span>
          <h2>${modConfig.name}</h2>
        </div>
        <div class="mode-grid">
          <button class="mode-card" data-mode="level">
            <span class="mode-card-emoji">🏰</span>
            <span class="mode-card-name">闯关模式</span>
            <span class="mode-card-desc">逐关挑战，解锁新关卡</span>
          </button>
          <button class="mode-card" data-mode="free">
            <span class="mode-card-emoji">🎮</span>
            <span class="mode-card-name">自由练习</span>
            <span class="mode-card-desc">随机出题，轻松练习</span>
          </button>
          <button class="mode-card" data-mode="adventure">
            <span class="mode-card-emoji">📖</span>
            <span class="mode-card-name">冒险故事</span>
            <span class="mode-card-desc">帮助小动物解决问题</span>
          </button>
        </div>
      </div>
    </div>
  `);

  ui.bindBack(router);

  document.querySelectorAll('.mode-card').forEach(card => {
    card.addEventListener('click', () => {
      audio.playClick();
      const mode = card.dataset.mode;
      loadGameModule(moduleId, mode);
    });
  });
}

// ===== 加载游戏模块 =====
function loadGameModule(moduleId, mode = 'level') {
  const modConfig = CONFIG.MODULES.find(m => m.id === moduleId);
  if (!modConfig) { router.navigate('/'); return; }

  // 获取冒险故事
  let story = null;
  if (mode === 'adventure') {
    const stories = ADVENTURE_STORIES[moduleId] || [];
    story = stories[Math.floor(Math.random() * stories.length)];
  }

  try {
    const module = window.GAME_MODULES[moduleId];
    if (module) {
      module.init(ui.getApp(), { router, store, audio, ui, CONFIG, mode, story });
    } else {
      throw new Error('Module not found');
    }
  } catch (e) {
    ui.render(`
      <div class="placeholder-page">
        ${ui.renderHeader()}
        <div class="placeholder-body">
          <span class="placeholder-emoji">${modConfig.emoji}</span>
          <h2>${modConfig.name}</h2>
          <p>即将上线，敬请期待！</p>
          <button class="btn btn-primary" id="btnBackHome">返回首页</button>
        </div>
      </div>
    `);
    ui.bindBack(router);
    document.getElementById('btnBackHome')?.addEventListener('click', () => router.navigate('/'));
  }
}

// ===== 注册路由 =====
router.register('/', renderHome);
router.register('/settings', renderSettings);
router.register('/progress', renderProgress);

// 为每个游戏模块注册路由（进入模式选择页）
CONFIG.MODULES.forEach(mod => {
  router.register('/' + mod.id, () => renderModeSelect(mod.id));
});

// ===== 启动应用 =====
router.start();
eyeCareTimer.start();

})();
