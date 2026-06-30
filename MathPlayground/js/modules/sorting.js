(function() {
/**
 * 排序模块 - 支持闯关/自由练习/冒险故事模式
 */

let ctx = null;
let state = null;
let gameMode = 'level';
let storyInfo = null;

function generateQuestion() {
  const difficulty = ctx.store.get('difficulty');
  const level = ctx.store.get('modules').sorting.level;
  const max = Math.min(CONFIG.LEVELS[Math.min(level, 5)].maxNumber, difficulty);
  // count 不能超过 max（否则无法生成不重复数字）
  const count = Math.min(level + 3, 7, max);

  // 生成不重复的随机数
  const numbers = new Set();
  while (numbers.size < count) {
    numbers.add(Math.floor(Math.random() * max) + 1);
  }

  const sorted = [...numbers].sort((a, b) => a - b);
  const ascending = Math.random() > 0.3; // 大部分从小到大
  const correctOrder = ascending ? sorted : [...sorted].reverse();
  
  // 确保洗牌后不会碰巧就是正确顺序
  let shuffled = shuffle([...numbers]);
  let reshuffleAttempts = 0;
  while (reshuffleAttempts < 10 && shuffled.every((n, i) => n === correctOrder[i])) {
    shuffled = shuffle([...numbers]);
    reshuffleAttempts++;
  }

  return {
    numbers: shuffled,
    correctOrder,
    ascending,
  };
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function initState() {
  const level = ctx.store.get('modules').sorting.level;
  const levelConfig = CONFIG.LEVELS[Math.min(level, 5)];
  const totalQuestions = gameMode === 'free' ? 999 : levelConfig.questionCount;
  return {
    level,
    questionIndex: 0,
    totalQuestions,
    starsEarned: 0,
    currentQuestion: null,
    userOrder: [],
    answered: false,
  };
}

function render() {
  const app = ctx.ui.getApp();
  const char = CONFIG.CHARACTERS[ctx.store.get('character')];

  if (!state.currentQuestion) {
    state.currentQuestion = generateQuestion();
    state.userOrder = [...state.currentQuestion.numbers];
    state.answered = false;
  }

  const q = state.currentQuestion;
  const isFree = gameMode === 'free';
  const progress = isFree ? 0 : ((state.questionIndex) / state.totalQuestions * 100).toFixed(0);
  const direction = q.ascending ? '从小到大' : '从大到小';

  // 冒险故事提示
  let storyHtml = '';
  if (gameMode === 'adventure' && storyInfo && state.questionIndex === 0) {
    storyHtml = `<div class="story-intro bounce-in"><span>${storyInfo.emoji}</span> ${storyInfo.intro}</div>`;
  }

  app.innerHTML = `
    <div class="game-container">
      ${ctx.ui.renderHeader()}
      <div class="game-hud">
        <span>${isFree ? '自由练习' : (gameMode === 'adventure' ? '冒险故事' : '第 ' + state.level + ' 关')}</span>
        <span>${isFree ? '已答 ' + state.questionIndex + ' 题' : (state.questionIndex + 1) + ' / ' + state.totalQuestions}</span>
        <span>⭐ ${state.starsEarned}</span>
      </div>
      ${!isFree ? `<div class="game-progress-bar"><div class="game-progress-fill" style="width: ${progress}%"></div></div>` : ''}
      ${storyHtml}
      <div class="game-question bounce-in">
        <p>${char.emoji} 把数字${direction}排好队！</p>
      </div>
      <div class="sorting-area" id="sortingArea">
        ${state.userOrder.map((num, idx) => `
          <div class="sort-item" draggable="true" data-index="${idx}" data-value="${num}">
            ${num}
          </div>
        `).join('')}
      </div>
      <div class="sorting-hint">💡 点击两个数字来交换位置</div>
      <div class="modal-actions" style="margin-top: 16px;">
        <button class="btn btn-primary" id="btnCheck">✓ 检查答案</button>
        ${isFree ? '<button class="btn btn-secondary" id="btnQuitFree">结束练习</button>' : ''}
      </div>
      <div id="feedbackArea"></div>
    </div>
  `;

  ctx.ui.bindBack(ctx.router);
  bindSortingEvents();

  document.getElementById('btnCheck')?.addEventListener('click', checkAnswer);
  document.getElementById('btnQuitFree')?.addEventListener('click', () => ctx.router.navigate('/'));
  ctx.audio.speak(`把数字${direction}排好队`);
}

function bindSortingEvents() {
  let selectedIndex = null;
  const items = document.querySelectorAll('.sort-item');

  items.forEach(item => {
    item.addEventListener('click', () => {
      if (state.answered) return;
      const idx = parseInt(item.dataset.index);

      if (selectedIndex === null) {
        selectedIndex = idx;
        item.classList.add('selected');
      } else if (selectedIndex === idx) {
        selectedIndex = null;
        item.classList.remove('selected');
      } else {
        // 交换
        [state.userOrder[selectedIndex], state.userOrder[idx]] =
          [state.userOrder[idx], state.userOrder[selectedIndex]];
        selectedIndex = null;
        ctx.audio.playClick();
        render(); // 重新渲染
      }
    });

    // 触屏拖拽支持
    let touchStartIdx = null;
    item.addEventListener('touchstart', (e) => {
      touchStartIdx = parseInt(item.dataset.index);
      item.classList.add('selected');
    });

    item.addEventListener('touchend', (e) => {
      const touch = e.changedTouches[0];
      const target = document.elementFromPoint(touch.clientX, touch.clientY);
      if (target && target.classList.contains('sort-item')) {
        const targetIdx = parseInt(target.dataset.index);
        if (touchStartIdx !== null && touchStartIdx !== targetIdx) {
          [state.userOrder[touchStartIdx], state.userOrder[targetIdx]] =
            [state.userOrder[targetIdx], state.userOrder[touchStartIdx]];
          ctx.audio.playClick();
          render();
        }
      }
      touchStartIdx = null;
    });
  });
}

function checkAnswer() {
  if (state.answered) return;
  state.answered = true;

  const q = state.currentQuestion;
  const correct = state.userOrder.every((num, i) => num === q.correctOrder[i]);

  if (correct) {
    state.starsEarned++;
    ctx.audio.playCorrect();
    ctx.store.addStars(1);
    ctx.ui.showFeedback(document.getElementById('feedbackArea'), true);
  } else {
    ctx.audio.playWrong();
    ctx.ui.showFeedback(document.getElementById('feedbackArea'), false);
    // 显示正确顺序
    const area = document.getElementById('sortingArea');
    if (area) {
      area.innerHTML = q.correctOrder.map(num =>
        `<div class="sort-item correct">${num}</div>`
      ).join('');
    }
  }

  setTimeout(() => nextQuestion(), CONFIG.NEXT_QUESTION_DELAY + 500);
}

function nextQuestion() {
  state.questionIndex++;
  state.currentQuestion = null;
  state.userOrder = [];
  if (gameMode !== 'free' && state.questionIndex >= state.totalQuestions) showResult();
  else render();
}

function showResult() {
  const levelConfig = CONFIG.LEVELS[Math.min(state.level, 5)];
  const passed = state.starsEarned >= levelConfig.starsToPass;
  const char = CONFIG.CHARACTERS[ctx.store.get('character')];

  if (passed && state.level <= 5 && gameMode === 'level') {
    ctx.store.updateModuleProgress('sorting', state.level + 1, state.starsEarned);
    ctx.audio.playLevelUp();
  }

  const app = ctx.ui.getApp();
  app.innerHTML = `
    <div class="game-container">
      ${ctx.ui.renderHeader()}
      <div class="placeholder-body">
        <span class="placeholder-emoji bounce-in">${passed ? '🎉' : '💪'}</span>
        <h2>${passed ? '排列高手！' : '再排排看！'}</h2>
        <p>${char.emoji} ${passed ? '排队整整齐齐！' : '多练习就熟练了！'}</p>
        <p>获得 ${state.starsEarned} / ${state.totalQuestions} ⭐</p>
        <div class="modal-actions">
          <button class="btn btn-primary" id="btnNext">${passed ? '下一关' : '再来一次'}</button>
          <button class="btn btn-secondary" id="btnHome">返回首页</button>
        </div>
      </div>
    </div>
  `;
  ctx.ui.bindBack(ctx.router);
  document.getElementById('btnNext')?.addEventListener('click', () => { state = initState(); render(); });
  document.getElementById('btnHome')?.addEventListener('click', () => ctx.router.navigate('/'));
}

window.GAME_MODULES = window.GAME_MODULES || {}; window.GAME_MODULES['sorting'] = {
  name: 'sorting',
  init(container, context) { ctx = context; gameMode = context.mode || 'level'; storyInfo = context.story || null; state = initState(); render(); },
  destroy() { ctx = null; state = null; }
};

})();
