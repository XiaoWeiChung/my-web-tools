(function() {
/**
 * 加减法计算模块 - 支持闯关/自由练习/冒险故事模式
 */

let ctx = null;
let state = null;
let gameMode = 'level';
let storyInfo = null;
let opType = 'mixed'; // add | subtract | mixed（仅自由练习模式可选）

function getMaxNumber() {
  const difficulty = ctx.store.get('difficulty');
  const level = ctx.store.get('modules').arithmetic.level;
  const levelConfig = CONFIG.LEVELS[Math.min(level, 5)];
  return Math.min(levelConfig.maxNumber, difficulty);
}

function pickType() {
  const level = ctx.store.get('modules').arithmetic.level;
  // 自由练习模式：尊重用户选择
  if (gameMode === 'free') {
    if (opType === 'add') return 'add';
    if (opType === 'subtract') return 'subtract';
    return Math.random() < 0.5 ? 'add' : 'subtract';
  }
  // 闯关/冒险：按关卡难度
  const types = level >= 2 ? ['add', 'subtract'] : ['add'];
  return types[Math.floor(Math.random() * types.length)];
}

function generateQuestion() {
  const max = getMaxNumber();
  const level = ctx.store.get('modules').arithmetic.level;
  const type = pickType();

  let a, b, answer;
  const lastKey = state.lastKey || '';
  let genAttempts = 0;
  do {
    if (type === 'add') {
      a = Math.floor(Math.random() * (max - 1)) + 1;
      b = Math.floor(Math.random() * (max - a)) + 1;
      answer = a + b;
    } else {
      a = Math.floor(Math.random() * (max - 1)) + 2;
      b = Math.floor(Math.random() * (a - 1)) + 1;
      answer = a - b;
    }
    genAttempts++;
  } while (`${a}${type}${b}` === lastKey && genAttempts < 10);

  const operator = type === 'add' ? '+' : '-';
  const optionCount = CONFIG.LEVELS[Math.min(level, 5)].optionCount;
  const options = new Set([answer]);
  let attempts = 0;
  while (options.size < optionCount && attempts < 50) {
    attempts++;
    let wrong = answer + Math.floor(Math.random() * 5) - 2;
    if (wrong < 0) wrong = answer + Math.floor(Math.random() * 3) + 1;
    if (wrong !== answer && wrong >= 0) options.add(wrong);
  }
  let fallback = answer + 1;
  while (options.size < optionCount) {
    if (fallback !== answer) options.add(fallback);
    fallback++;
  }

  return { a, b, operator, type, correctAnswer: answer, options: shuffle([...options]) };
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function initState() {
  const level = ctx.store.get('modules').arithmetic.level;
  const levelConfig = CONFIG.LEVELS[Math.min(level, 5)];
  const totalQuestions = gameMode === 'free' ? 999 : levelConfig.questionCount;
  return {
    level,
    questionIndex: 0,
    totalQuestions,
    starsEarned: 0,
    retries: 0,
    currentQuestion: null,
    answered: false,
  };
}

function renderOpSelect() {
  const app = ctx.ui.getApp();
  const char = CONFIG.CHARACTERS[ctx.store.get('character')];
  app.innerHTML = `
    <div class="game-container">
      ${ctx.ui.renderHeader()}
      <div class="mode-select-body">
        <div class="mode-select-title">
          <span class="mode-module-emoji">🧮</span>
          <h2>${char.emoji} 想练习什么？</h2>
        </div>
        <div class="mode-grid">
          <button class="mode-card" data-op="add">
            <span class="mode-card-emoji">➕</span>
            <span class="mode-card-name">只练加法</span>
            <span class="mode-card-desc">专心练习加法</span>
          </button>
          <button class="mode-card" data-op="subtract">
            <span class="mode-card-emoji">➖</span>
            <span class="mode-card-name">只练减法</span>
            <span class="mode-card-desc">专心练习减法</span>
          </button>
          <button class="mode-card" data-op="mixed">
            <span class="mode-card-emoji">🔀</span>
            <span class="mode-card-name">加减混合</span>
            <span class="mode-card-desc">加法减法都练</span>
          </button>
        </div>
      </div>
    </div>
  `;
  ctx.ui.bindBack(ctx.router);
  document.querySelectorAll('.mode-card').forEach(card => {
    card.addEventListener('click', () => {
      ctx.audio.playClick();
      opType = card.dataset.op;
      state = initState();
      render();
    });
  });
}

function render() {
  const app = ctx.ui.getApp();
  const char = CONFIG.CHARACTERS[ctx.store.get('character')];

  if (!state.currentQuestion) {
    state.currentQuestion = generateQuestion();
    state.answered = false;
    state.retries = 0;
  }

  const q = state.currentQuestion;
  const isFree = gameMode === 'free';
  const progress = isFree ? 0 : ((state.questionIndex) / state.totalQuestions * 100).toFixed(0);
  const emoji = CONFIG.ITEM_EMOJIS[Math.floor(Math.random() * CONFIG.ITEM_EMOJIS.length)];
  const opLabel = { add: '加法练习', subtract: '减法练习', mixed: '加减混合' }[opType];

  // 冒险故事提示
  let storyHtml = '';
  if (gameMode === 'adventure' && storyInfo && state.questionIndex === 0) {
    storyHtml = `<div class="story-intro bounce-in"><span>${storyInfo.emoji}</span> ${storyInfo.intro}</div>`;
  }

  // 可视化辅助
  const leftVisual = Array(q.a).fill(emoji).join(' ');
  const rightVisual = Array(q.b).fill(emoji).join(' ');

  app.innerHTML = `
    <div class="game-container">
      ${ctx.ui.renderHeader()}
      <div class="game-hud">
        <span>${isFree ? opLabel : (gameMode === 'adventure' ? '冒险故事' : '第 ' + state.level + ' 关')}</span>
        <span>${isFree ? '已答 ' + state.questionIndex + ' 题' : (state.questionIndex + 1) + ' / ' + state.totalQuestions}</span>
        <span>⭐ ${state.starsEarned}</span>
      </div>
      ${!isFree ? `<div class="game-progress-bar"><div class="game-progress-fill" style="width: ${progress}%"></div></div>` : ''}
      ${storyHtml}
      <div class="game-question bounce-in">
        <p class="question-expression">${q.a} ${q.operator} ${q.b} = ？</p>
      </div>
      <div class="game-visual">
        <div class="visual-group">
          <span class="visual-items">${leftVisual}</span>
        </div>
        <span class="visual-operator">${q.operator}</span>
        <div class="visual-group">
          <span class="visual-items">${rightVisual}</span>
        </div>
      </div>
      <div id="optionsArea"></div>
      <div id="feedbackArea"></div>
      ${isFree ? '<div class="modal-actions" style="margin-top:12px"><button class="btn btn-secondary" id="btnQuitFree">结束练习</button></div>' : ''}
    </div>
  `;

  ctx.ui.bindBack(ctx.router);
  document.getElementById('btnQuitFree')?.addEventListener('click', () => ctx.router.navigate('/'));

  // 渲染选项
  const optionsArea = document.getElementById('optionsArea');
  const container = ctx.ui.renderOptions(
    q.options.map(n => ({ label: String(n), value: n })),
    (value, btn) => handleAnswer(value, btn)
  );
  optionsArea.appendChild(container);

  ctx.audio.speak(`${q.a} ${q.operator === '+' ? '加' : '减'} ${q.b} 等于几？`);
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
  state.lastKey = state.currentQuestion ? `${state.currentQuestion.a}${state.currentQuestion.type}${state.currentQuestion.b}` : '';
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
    ctx.store.updateModuleProgress('arithmetic', state.level + 1, state.starsEarned);
    ctx.audio.playLevelUp();
  }

  const app = ctx.ui.getApp();
  app.innerHTML = `
    <div class="game-container">
      ${ctx.ui.renderHeader()}
      <div class="placeholder-body">
        <span class="placeholder-emoji bounce-in">${passed ? '🎉' : '💪'}</span>
        <h2>${passed ? '太棒了！过关啦！' : '差一点点，再试试！'}</h2>
        <p>${char.emoji} ${passed ? '你是计算小能手！' : '多练习就会越来越好！'}</p>
        <p>获得 ${state.starsEarned} / ${state.totalQuestions} ⭐</p>
        <div class="modal-actions">
          <button class="btn btn-primary" id="btnNext">${passed ? '下一关' : '再来一次'}</button>
          <button class="btn btn-secondary" id="btnHome">返回首页</button>
        </div>
      </div>
    </div>
  `;

  ctx.ui.bindBack(ctx.router);

  document.getElementById('btnNext')?.addEventListener('click', () => {
    state = initState();
    render();
  });
  document.getElementById('btnHome')?.addEventListener('click', () => ctx.router.navigate('/'));
}

window.GAME_MODULES = window.GAME_MODULES || {}; window.GAME_MODULES['arithmetic'] = {
  name: 'arithmetic',
  init(container, context) {
    ctx = context;
    gameMode = context.mode || 'level';
    storyInfo = context.story || null;
    opType = 'mixed';
    // 自由练习模式：先让用户选择练加法/减法/混合
    if (gameMode === 'free') {
      renderOpSelect();
    } else {
      state = initState();
      render();
    }
  },
  destroy() { ctx = null; state = null; }
};

})();
