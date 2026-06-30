(function() {
/**
 * 比大小模块 - 支持闯关/自由练习/冒险故事模式
 */

let ctx = null;
let state = null;
let gameMode = 'level';
let storyInfo = null;

function getMaxNumber() {
  const difficulty = ctx.store.get('difficulty');
  const level = ctx.store.get('modules').comparison.level;
  const levelConfig = CONFIG.LEVELS[Math.min(level, 5)];
  return Math.min(levelConfig.maxNumber, difficulty);
}

function generateQuestion() {
  const max = getMaxNumber();
  const level = ctx.store.get('modules').comparison.level;
  
  let a, b;
  const lastA = state.lastA || -1;
  const lastB = state.lastB || -1;
  let genAttempts = 0;
  do {
    a = Math.floor(Math.random() * max) + 1;
    b = Math.floor(Math.random() * max) + 1;
    if (Math.random() < 0.15) b = a;
    genAttempts++;
  } while (a === lastA && b === lastB && genAttempts < 10);

  let correctAnswer;
  if (a > b) correctAnswer = '>';
  else if (a < b) correctAnswer = '<';
  else correctAnswer = '=';

  // 低关卡用图形模式
  const mode = level <= 2 ? 'visual' : 'numeric';
  const emoji = CONFIG.ITEM_EMOJIS[Math.floor(Math.random() * CONFIG.ITEM_EMOJIS.length)];

  return { a, b, correctAnswer, mode, emoji, options: ['>', '<', '='] };
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function initState() {
  const level = ctx.store.get('modules').comparison.level;
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

  let visualHtml = '';
  if (q.mode === 'visual') {
    const leftItems = Array(Math.min(q.a, 10)).fill(q.emoji).join(' ');
    const rightItems = Array(Math.min(q.b, 10)).fill(q.emoji).join(' ');
    visualHtml = `
      <div class="comparison-visual">
        <div class="compare-side">
          <div class="compare-items">${leftItems}${q.a > 10 ? '…' : ''}</div>
          <div class="compare-number">${q.a}</div>
        </div>
        <div class="compare-middle">？</div>
        <div class="compare-side">
          <div class="compare-items">${rightItems}${q.b > 10 ? '…' : ''}</div>
          <div class="compare-number">${q.b}</div>
        </div>
      </div>
    `;
  } else {
    visualHtml = `
      <div class="comparison-numeric">
        <span class="compare-big-number">${q.a}</span>
        <span class="compare-symbol">？</span>
        <span class="compare-big-number">${q.b}</span>
      </div>
    `;
  }

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
        <p>${char.emoji} 比一比，中间应该填什么符号？</p>
      </div>
      ${visualHtml}
      <div id="optionsArea"></div>
      <div id="feedbackArea"></div>
      ${isFree ? '<div class="modal-actions" style="margin-top:12px"><button class="btn btn-secondary" id="btnQuitFree">结束练习</button></div>' : ''}
    </div>
  `;

  ctx.ui.bindBack(ctx.router);
  document.getElementById('btnQuitFree')?.addEventListener('click', () => ctx.router.navigate('/'));

  const optionsArea = document.getElementById('optionsArea');
  const container = ctx.ui.renderOptions(
    q.options.map(s => ({ label: s, value: s })),
    (value, btn) => handleAnswer(value, btn)
  );
  optionsArea.appendChild(container);

  ctx.audio.speak(`${q.a} 和 ${q.b}，比一比大小`);
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
  if (state.currentQuestion) { state.lastA = state.currentQuestion.a; state.lastB = state.currentQuestion.b; }
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
    ctx.store.updateModuleProgress('comparison', state.level + 1, state.starsEarned);
    ctx.audio.playLevelUp();
  }

  const app = ctx.ui.getApp();
  app.innerHTML = `
    <div class="game-container">
      ${ctx.ui.renderHeader()}
      <div class="placeholder-body">
        <span class="placeholder-emoji bounce-in">${passed ? '🎉' : '💪'}</span>
        <h2>${passed ? '太棒了！' : '再试试吧！'}</h2>
        <p>${char.emoji} ${passed ? '比大小难不倒你！' : '继续加油！'}</p>
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

window.GAME_MODULES = window.GAME_MODULES || {}; window.GAME_MODULES['comparison'] = {
  name: 'comparison',
  init(container, context) { ctx = context; gameMode = context.mode || 'level'; storyInfo = context.story || null; state = initState(); render(); },
  destroy() { ctx = null; state = null; }
};

})();
