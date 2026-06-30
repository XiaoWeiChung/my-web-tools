(function() {
/**
 * 数数游戏模块 - 支持正数和倒数，支持闯关/自由练习/冒险故事模式
 */

let ctx = null;
let state = null;
let gameMode = 'level'; // level | free | adventure
let storyInfo = null;

function getMaxNumber() {
  const difficulty = ctx.store.get('difficulty');
  const level = ctx.store.get('modules').counting.level;
  const levelConfig = CONFIG.LEVELS[Math.min(level, 5)];
  return Math.min(levelConfig.maxNumber, difficulty);
}

function generateQuestion() {
  const max = getMaxNumber();
  let count;
  // 避免和上一题一样的数字
  const lastAnswer = state.lastAnswer || -1;
  let genAttempts = 0;
  do {
    count = Math.floor(Math.random() * max) + 1;
    genAttempts++;
  } while (count === lastAnswer && genAttempts < 10 && max > 1);

  const emoji = CONFIG.ITEM_EMOJIS[Math.floor(Math.random() * CONFIG.ITEM_EMOJIS.length)];
  const items = Array(count).fill(emoji);

  // 根据关卡决定是否出倒数题
  const level = ctx.store.get('modules').counting.level;
  const isCountdown = level >= 3 && Math.random() > 0.5;

  const optionCount = CONFIG.LEVELS[Math.min(level, 5)].optionCount;
  const options = new Set([count]);
  let attempts = 0;
  while (options.size < optionCount && attempts < 50) {
    attempts++;
    let wrong = count + Math.floor(Math.random() * 5) - 2;
    if (wrong < 1) wrong = count + Math.floor(Math.random() * 3) + 1;
    if (wrong !== count && wrong >= 1) options.add(wrong);
  }
  // 保底：如果还是不够，用递增数字填充
  let fallback = count + 1;
  while (options.size < optionCount) {
    if (fallback !== count) options.add(fallback);
    fallback++;
  }

  return {
    items,
    correctAnswer: count,
    options: shuffle([...options]),
    isCountdown,
  };
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function initState() {
  const level = ctx.store.get('modules').counting.level;
  const levelConfig = CONFIG.LEVELS[Math.min(level, 5)];
  const totalQuestions = gameMode === 'free' ? 999 : levelConfig.questionCount;
  return {
    level,
    questionIndex: 0,
    totalQuestions,
    starsEarned: 0,
    retries: 0,
    currentQuestion: null,
    countedItems: 0,
    answered: false,
  };
}

function render() {
  const app = ctx.ui.getApp();
  const char = CONFIG.CHARACTERS[ctx.store.get('character')];

  if (!state.currentQuestion) {
    state.currentQuestion = generateQuestion();
    state.countedItems = 0;
    state.answered = false;
    state.retries = 0;
  }

  const q = state.currentQuestion;
  const isFree = gameMode === 'free';
  const progress = isFree ? 0 : ((state.questionIndex) / state.totalQuestions * 100).toFixed(0);

  // 冒险故事提示
  let storyHtml = '';
  if (gameMode === 'adventure' && storyInfo && state.questionIndex === 0) {
    storyHtml = `<div class="story-intro bounce-in"><span>${storyInfo.emoji}</span> ${storyInfo.intro}</div>`;
  }

  // 倒数模式的提示文字
  const questionText = q.isCountdown
    ? `${char.emoji} 倒着数！从${q.items.length}数到1，点一个少一个！`
    : `${char.emoji} 数一数，下面有几个？`;

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
        <p>${questionText}</p>
      </div>
      <div class="game-visual" id="visualArea">
        ${q.items.map((item, i) => {
          const counted = q.isCountdown
            ? i >= (q.items.length - state.countedItems)
            : i < state.countedItems;
          return `<span class="game-visual-item ${counted ? 'counted' : ''}" data-index="${i}">${item}</span>`;
        }).join('')}
      </div>
      <div class="game-counter">
        <span class="counter-label">${q.isCountdown ? '还剩：' : '你数了：'}</span>
        <span class="counter-value" id="counterValue">${q.isCountdown ? (q.items.length - state.countedItems) : state.countedItems}</span>
      </div>
      <div id="optionsArea"></div>
      <div id="feedbackArea"></div>
      ${isFree ? '<div class="modal-actions" style="margin-top:12px"><button class="btn btn-secondary" id="btnQuitFree">结束练习</button></div>' : ''}
    </div>
  `;

  ctx.ui.bindBack(ctx.router);
  document.getElementById('btnQuitFree')?.addEventListener('click', () => ctx.router.navigate('/'));

  // 点击物品计数
  const visualItems = document.querySelectorAll('.game-visual-item:not(.counted)');
  visualItems.forEach(el => {
    el.addEventListener('click', () => {
      if (state.answered) return;
      const idx = parseInt(el.dataset.index);

      if (q.isCountdown) {
        // 倒数：从右到左点击
        const expectedIdx = q.items.length - 1 - state.countedItems;
        if (idx === expectedIdx) {
          state.countedItems++;
          el.classList.add('counted');
          el.classList.add('pulse');
          document.getElementById('counterValue').textContent = q.items.length - state.countedItems;
          ctx.audio.playClick();
          if (state.countedItems === q.items.length) {
            setTimeout(() => showOptions(), 500);
          }
        } else {
          el.classList.add('shake');
          setTimeout(() => el.classList.remove('shake'), 400);
        }
      } else {
        // 正数：从左到右点击
        if (idx === state.countedItems) {
          state.countedItems++;
          el.classList.add('counted');
          el.classList.add('pulse');
          document.getElementById('counterValue').textContent = state.countedItems;
          ctx.audio.playClick();
          if (state.countedItems === q.items.length) {
            setTimeout(() => showOptions(), 500);
          }
        } else {
          el.classList.add('shake');
          setTimeout(() => el.classList.remove('shake'), 400);
        }
      }
    });
  });

  // 如果已全部数完，直接显示选项
  if (state.countedItems === q.items.length) {
    showOptions();
  }

  const speakText = q.isCountdown ? '倒着数，从大到小' : '数一数，下面有几个？';
  ctx.audio.speak(speakText);
}

function showOptions() {
  const q = state.currentQuestion;
  const area = document.getElementById('optionsArea');
  if (!area || state.answered) return;

  const container = ctx.ui.renderOptions(
    q.options.map(n => ({ label: String(n), value: n })),
    (value, btn) => handleAnswer(value, btn)
  );
  area.innerHTML = '';
  area.appendChild(container);
}

function handleAnswer(value, btn) {
  if (state.answered) return;

  const q = state.currentQuestion;
  const correct = value === q.correctAnswer;

  if (correct) {
    state.answered = true;
    btn.classList.add('correct');
    state.starsEarned++;
    ctx.audio.playCorrect();
    ctx.store.addStars(1);
    ctx.ui.showFeedback(document.getElementById('feedbackArea'), true);
    setTimeout(() => nextQuestion(), CONFIG.NEXT_QUESTION_DELAY);
  } else {
    btn.classList.add('wrong');
    btn.disabled = true;
    state.retries++;
    ctx.audio.playWrong();

    if (state.retries >= CONFIG.MAX_RETRIES) {
      state.answered = true;
      document.querySelectorAll('.btn-option').forEach(b => {
        if (parseInt(b.textContent) === q.correctAnswer) b.classList.add('correct');
      });
      ctx.ui.showFeedback(document.getElementById('feedbackArea'), false);
      setTimeout(() => nextQuestion(), CONFIG.NEXT_QUESTION_DELAY + 500);
    }
  }
}

function nextQuestion() {
  state.questionIndex++;
  state.lastAnswer = state.currentQuestion ? state.currentQuestion.correctAnswer : null;
  state.currentQuestion = null;

  if (gameMode !== 'free' && state.questionIndex >= state.totalQuestions) {
    showResult();
  } else {
    render();
  }
}

function showResult() {
  const levelConfig = CONFIG.LEVELS[Math.min(state.level, 5)];
  const passed = state.starsEarned >= levelConfig.starsToPass;
  const char = CONFIG.CHARACTERS[ctx.store.get('character')];

  if (passed && state.level <= 5 && gameMode === 'level') {
    ctx.store.updateModuleProgress('counting', state.level + 1, state.starsEarned);
    ctx.audio.playLevelUp();
  }

  const app = ctx.ui.getApp();
  app.innerHTML = `
    <div class="game-container">
      ${ctx.ui.renderHeader()}
      <div class="placeholder-body">
        <span class="placeholder-emoji bounce-in">${passed ? '🎉' : '💪'}</span>
        <h2>${passed ? '太棒了！过关啦！' : '差一点点，再试试！'}</h2>
        <p>${char.emoji} ${passed ? '你真厉害！' : '加油，你可以的！'}</p>
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

window.GAME_MODULES = window.GAME_MODULES || {}; window.GAME_MODULES['counting'] = {
  name: 'counting',
  init(container, context) {
    ctx = context;
    gameMode = context.mode || 'level';
    storyInfo = context.story || null;
    state = initState();
    render();
  },
  destroy() { ctx = null; state = null; }
};

})();
