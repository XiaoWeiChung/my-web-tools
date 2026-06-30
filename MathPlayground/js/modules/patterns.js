(function() {
/**
 * 找规律模块 - 支持闯关/自由练习/冒险故事模式
 */

const PATTERN_ITEMS = ['🔴', '🔵', '🟡', '🟢', '🟣', '🟠'];
const SHAPE_ITEMS = ['⭕', '🔺', '🟦', '⭐', '💜'];

let ctx = null;
let state = null;
let gameMode = 'level';
let storyInfo = null;

function generateQuestion() {
  const level = ctx.store.get('modules').patterns.level;
  let sequence, answer, options;
  const lastSeq = state.lastSeq || '';
  let genAttempts = 0;

  do {
    if (level <= 2) {
      // AB 模式
      const items = shuffle([...PATTERN_ITEMS]).slice(0, 2);
      sequence = [items[0], items[1], items[0], items[1], items[0]];
      answer = items[1];
      options = shuffle([...new Set([answer, ...PATTERN_ITEMS.filter(i => i !== answer).slice(0, 2)])]);
    } else if (level <= 3) {
      // ABC 模式
      const items = shuffle([...PATTERN_ITEMS]).slice(0, 3);
      sequence = [items[0], items[1], items[2], items[0], items[1]];
      answer = items[2];
      options = shuffle([...new Set([answer, ...PATTERN_ITEMS.filter(i => i !== answer).slice(0, 2)])]);
    } else if (level <= 4) {
      // AABB 模式: A,A,B,B,A,A -> 下一个是 B
      const items = shuffle([...SHAPE_ITEMS]).slice(0, 2);
      sequence = [items[0], items[0], items[1], items[1], items[0], items[0]];
      answer = items[1];
      options = shuffle([...new Set([answer, ...SHAPE_ITEMS.filter(i => i !== answer).slice(0, 2)])]);
    } else {
      // 数字递增规律
      const start = Math.floor(Math.random() * 5) + 1;
      const step = Math.floor(Math.random() * 3) + 1;
      sequence = [String(start), String(start + step), String(start + 2 * step), String(start + 3 * step)];
      answer = String(start + 4 * step);
      const wrongOptions = [
        String(start + 4 * step + 1),
        String(start + 4 * step - 1),
        String(start + 5 * step),
      ];
      options = shuffle([answer, ...wrongOptions.slice(0, 2)]);
    }
    genAttempts++;
  } while (sequence.join(',') === lastSeq && genAttempts < 10);

  return { sequence, correctAnswer: answer, options };
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
  const level = ctx.store.get('modules').patterns.level;
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

  const sequenceHtml = q.sequence.map(item =>
    `<span class="pattern-item">${item}</span>`
  ).join('') + '<span class="pattern-item pattern-blank">❓</span>';

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
        <p>${char.emoji} 找找规律，下一个是什么？</p>
      </div>
      <div class="pattern-sequence">${sequenceHtml}</div>
      <div id="optionsArea"></div>
      <div id="feedbackArea"></div>
      ${isFree ? '<div class="modal-actions" style="margin-top:12px"><button class="btn btn-secondary" id="btnQuitFree">结束练习</button></div>' : ''}
    </div>
  `;

  ctx.ui.bindBack(ctx.router);
  document.getElementById('btnQuitFree')?.addEventListener('click', () => ctx.router.navigate('/'));

  const optionsArea = document.getElementById('optionsArea');
  const container = ctx.ui.renderOptions(
    q.options.map(item => ({ label: item, value: item })),
    (value, btn) => handleAnswer(value, btn)
  );
  optionsArea.appendChild(container);

  ctx.audio.speak('找找规律，下一个是什么？');
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
  if (state.currentQuestion) state.lastSeq = state.currentQuestion.sequence.join(',');
  state.currentQuestion = null;
  if (gameMode !== 'free' && state.questionIndex >= state.totalQuestions) showResult();
  else render();
}

function showResult() {
  const levelConfig = CONFIG.LEVELS[Math.min(state.level, 5)];
  const passed = state.starsEarned >= levelConfig.starsToPass;
  const char = CONFIG.CHARACTERS[ctx.store.get('character')];

  if (passed && state.level <= 5 && gameMode === 'level') {
    ctx.store.updateModuleProgress('patterns', state.level + 1, state.starsEarned);
    ctx.audio.playLevelUp();
  }

  const app = ctx.ui.getApp();
  app.innerHTML = `
    <div class="game-container">
      ${ctx.ui.renderHeader()}
      <div class="placeholder-body">
        <span class="placeholder-emoji bounce-in">${passed ? '🎉' : '💪'}</span>
        <h2>${passed ? '你的眼睛真亮！' : '仔细看看规律！'}</h2>
        <p>${char.emoji} ${passed ? '找规律难不倒你！' : '再观察观察！'}</p>
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

window.GAME_MODULES = window.GAME_MODULES || {}; window.GAME_MODULES['patterns'] = {
  name: 'patterns',
  init(container, context) { ctx = context; gameMode = context.mode || 'level'; storyInfo = context.story || null; state = initState(); render(); },
  destroy() { ctx = null; state = null; }
};

})();
