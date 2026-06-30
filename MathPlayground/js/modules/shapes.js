(function() {
/**
 * 认识形状模块 - 支持闯关/自由练习/冒险故事模式
 */

const SHAPES = [
  { id: 'circle',    name: '圆形',   emoji: '⭕' },
  { id: 'triangle',  name: '三角形', emoji: '🔺' },
  { id: 'square',    name: '正方形', emoji: '🟦' },
  { id: 'rectangle', name: '长方形', emoji: '🟩' },
  { id: 'star',      name: '五角星', emoji: '⭐' },
];

let ctx = null;
let state = null;
let gameMode = 'level';
let storyInfo = null;

function generateQuestion() {
  let targetIdx;
  const lastShape = state.lastShape || '';
  let genAttempts = 0;
  do {
    targetIdx = Math.floor(Math.random() * SHAPES.length);
    genAttempts++;
  } while (SHAPES[targetIdx].name === lastShape && genAttempts < 10);
  const target = SHAPES[targetIdx];

  // 选项：正确名称 + 干扰名称
  const level = ctx.store.get('modules').shapes.level;
  const optionCount = CONFIG.LEVELS[Math.min(level, 5)].optionCount;
  const options = new Set([target.name]);
  while (options.size < optionCount) {
    const random = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    options.add(random.name);
  }

  return {
    shape: target,
    correctAnswer: target.name,
    options: shuffle([...options]),
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
  const level = ctx.store.get('modules').shapes.level;
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
        <p>${char.emoji} 这是什么形状？</p>
      </div>
      <div class="shape-display">
        <span class="shape-big-emoji bounce-in">${q.shape.emoji}</span>
      </div>
      <div id="optionsArea"></div>
      <div id="feedbackArea"></div>
      ${isFree ? '<div class="modal-actions" style="margin-top:12px"><button class="btn btn-secondary" id="btnQuitFree">结束练习</button></div>' : ''}
    </div>
  `;

  ctx.ui.bindBack(ctx.router);
  document.getElementById('btnQuitFree')?.addEventListener('click', () => ctx.router.navigate('/'));

  const optionsArea = document.getElementById('optionsArea');
  const container = ctx.ui.renderOptions(
    q.options.map(name => ({ label: name, value: name })),
    (value, btn) => handleAnswer(value, btn)
  );
  optionsArea.appendChild(container);

  ctx.audio.speak('这是什么形状？');
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
        if (b.textContent === q.correctAnswer) b.classList.add('correct');
      });
      ctx.ui.showFeedback(document.getElementById('feedbackArea'), false);
      setTimeout(() => nextQuestion(), CONFIG.NEXT_QUESTION_DELAY + 500);
    }
  }
}

function nextQuestion() {
  state.questionIndex++;
  if (state.currentQuestion) state.lastShape = state.currentQuestion.correctAnswer;
  state.currentQuestion = null;
  if (gameMode !== 'free' && state.questionIndex >= state.totalQuestions) showResult();
  else render();
}

function showResult() {
  const levelConfig = CONFIG.LEVELS[Math.min(state.level, 5)];
  const passed = state.starsEarned >= levelConfig.starsToPass;
  const char = CONFIG.CHARACTERS[ctx.store.get('character')];

  if (passed && state.level <= 5 && gameMode === 'level') {
    ctx.store.updateModuleProgress('shapes', state.level + 1, state.starsEarned);
    ctx.audio.playLevelUp();
  }

  const app = ctx.ui.getApp();
  app.innerHTML = `
    <div class="game-container">
      ${ctx.ui.renderHeader()}
      <div class="placeholder-body">
        <span class="placeholder-emoji bounce-in">${passed ? '🎉' : '💪'}</span>
        <h2>${passed ? '形状大师！' : '再认认看！'}</h2>
        <p>${char.emoji} ${passed ? '你认识好多形状！' : '多看看就记住啦！'}</p>
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

window.GAME_MODULES = window.GAME_MODULES || {}; window.GAME_MODULES['shapes'] = {
  name: 'shapes',
  init(container, context) { ctx = context; gameMode = context.mode || 'level'; storyInfo = context.story || null; state = initState(); render(); },
  destroy() { ctx = null; state = null; }
};

})();
