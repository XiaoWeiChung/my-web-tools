/* ======================================================================
   椰子英语乐园 · 交互逻辑 (app.js)
   依赖：icons.js (getIcon)、data.js (THEMES, ALPHABET)
   ====================================================================== */
(function () {
  'use strict';

  /* ============ 工具 ============ */
  var $ = function (sel) { return document.querySelector(sel); };
  var $$ = function (sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); };

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function iconBox(key, cls) {
    return '<span class="' + (cls || 'ce-icon-box') + '">' + getIcon(key) + '</span>';
  }

  /* ============ 语音（speech-playback） ============ */
  var soundOn = true;
  var ttsSupported = ('speechSynthesis' in window) &&
    (typeof window.SpeechSynthesisUtterance !== 'undefined');
  var voices = [];        // 全部可用英文嗓音
  var curVoice = null;    // 当前选中嗓音
  var STORE_KEY = 'ce_voice_uri';

  // macOS / 系统上音质较好、自然的英文嗓音（优先选用）
  var GOOD = ['samantha', 'ava', 'allison', 'susan', 'karen', 'moira', 'tessa',
              'serena', 'fiona', 'daniel', 'google us english', 'google uk english female',
              'microsoft aria', 'microsoft jenny', 'microsoft zira', 'microsoft guy'];
  // 已知机械/趣味/低质量嗓音，避免选中（就是“被压缩”的元凶）
  var BAD = ['fred', 'albert', 'bad news', 'bahh', 'bells', 'boing', 'bubbles', 'cellos',
             'deranged', 'good news', 'jester', 'organ', 'superstar', 'trinoids', 'whisper',
             'wobble', 'zarvox', 'junior', 'ralph', 'kathy', 'princess', 'pipe organ',
             'eddy', 'flo', 'grandma', 'grandpa', 'reed', 'rocko', 'sandy', 'shelley'];

  // 口音/地区 → 中文
  var LANG_ZH = {
    'en-us': '美式', 'en_us': '美式',
    'en-gb': '英式', 'en_gb': '英式',
    'en-au': '澳式', 'en_au': '澳式',
    'en-in': '印度', 'en_in': '印度',
    'en-ie': '爱尔兰', 'en_ie': '爱尔兰',
    'en-za': '南非', 'en_za': '南非',
    'en-ca': '加拿大', 'en_ca': '加拿大'
  };
  // 常见英文嗓音性别（用于中文标注；未知则不标性别）
  var FEMALE = ['samantha', 'ava', 'allison', 'susan', 'karen', 'moira', 'tessa', 'serena',
                'fiona', 'victoria', 'zira', 'aria', 'jenny', 'zoe', 'kate', 'stephanie',
                'female', 'google us english', 'google uk english female'];
  var MALE = ['daniel', 'alex', 'tom', 'fred', 'oliver', 'arthur', 'guy', 'david', 'mark',
              'male', 'google uk english male', 'rishi', 'aaron', 'gordon'];

  function langZh(lang) {
    return LANG_ZH[(lang || '').toLowerCase()] || (/^en/i.test(lang) ? '英语' : lang);
  }
  function genderZh(name) {
    var n = (name || '').toLowerCase();
    for (var i = 0; i < FEMALE.length; i++) { if (n.indexOf(FEMALE[i]) !== -1) return '女声'; }
    for (var j = 0; j < MALE.length; j++) { if (n.indexOf(MALE[j]) !== -1) return '男声'; }
    return '';
  }
  function voiceLabel(v) {
    var clean = v.name.replace(/\s*\(.*?\)\s*/g, '').trim();
    var parts = [langZh(v.lang)];
    var g = genderZh(v.name);
    if (g) parts.push(g);
    if (/premium|enhanced|natural|siri/i.test(v.name)) parts.push('高清');
    return parts.join('·') + '（' + clean + '）';
  }

  function scoreVoice(v) {
    var name = (v.name || '').toLowerCase();
    for (var i = 0; i < BAD.length; i++) { if (name.indexOf(BAD[i]) !== -1) return -100; }
    var s = 0;
    for (var j = 0; j < GOOD.length; j++) { if (name.indexOf(GOOD[j]) !== -1) { s += 50; break; } }
    if (/en[-_]us/i.test(v.lang)) s += 10;        // 优先美式
    else if (/^en/i.test(v.lang)) s += 5;
    if (v.localService) s += 3;                   // 本地嗓音更稳定
    if (/premium|enhanced|natural/i.test(name)) s += 8; // 增强版音质更好
    return s;
  }

  function loadVoices() {
    if (!ttsSupported) return;
    var all = window.speechSynthesis.getVoices() || [];
    voices = all.filter(function (v) { return /^en/i.test(v.lang); })
                .sort(function (a, b) { return scoreVoice(b) - scoreVoice(a); });
    // 恢复上次选择，否则用评分最高的
    var saved = null;
    try { saved = localStorage.getItem(STORE_KEY); } catch (e) {}
    curVoice = (saved && voices.filter(function (v) { return v.voiceURI === saved; })[0]) ||
               voices[0] || null;
    renderVoiceOptions();
  }

  function speak(text) {
    if (!soundOn || !ttsSupported || !text) return;
    try {
      window.speechSynthesis.cancel(); // 防止排队堆叠
      var u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-US';
      u.rate = 0.9;
      u.pitch = 1.0;
      u.volume = 1.0;
      // iOS Safari workaround: 先设所有参数，最后设 voice
      // 并重新从 voices 列表获取引用（iOS 有时会丢失引用）
      if (curVoice) {
        var fresh = (window.speechSynthesis.getVoices() || [])
          .filter(function (v) { return v.voiceURI === curVoice.voiceURI; })[0];
        if (fresh) { u.voice = fresh; u.lang = fresh.lang; }
      }
      window.speechSynthesis.speak(u);
    } catch (e) { /* 静默降级 */ }
  }
  function stopSpeak() {
    if (ttsSupported) { try { window.speechSynthesis.cancel(); } catch (e) {} }
  }

  /* ============ 声音开关 + 嗓音选择 ============ */
  var soundToggle = $('#soundToggle');
  var voiceSelect = $('#voiceSelect');

  function renderVoiceOptions() {
    if (!voiceSelect) return;
    if (!voices.length) {
      voiceSelect.innerHTML = '<option>无可用英文语音</option>';
      voiceSelect.disabled = true;
      return;
    }
    voiceSelect.disabled = false;
    voiceSelect.innerHTML = voices.map(function (v) {
      var label = voiceLabel(v);
      var sel = (curVoice && v.voiceURI === curVoice.voiceURI) ? ' selected' : '';
      return '<option value="' + v.voiceURI + '"' + sel + '>' + label + '</option>';
    }).join('');
  }

  if (voiceSelect) {
    voiceSelect.addEventListener('change', function () {
      var v = voices.filter(function (x) { return x.voiceURI === voiceSelect.value; })[0];
      if (v) {
        curVoice = v;
        try { localStorage.setItem(STORE_KEY, v.voiceURI); } catch (e) {}
        if (soundOn) speak('Hello');  // 选完即试听
      }
    });
  }

  function renderSoundBtn() {
    soundToggle.textContent = soundOn ? '🔊' : '🔇';
    soundToggle.title = soundOn ? '声音开启（点击关闭）' : '声音关闭（点击开启）';
  }
  soundToggle.addEventListener('click', function () {
    soundOn = !soundOn;
    if (!soundOn) stopSpeak();
    renderSoundBtn();
  });
  renderSoundBtn();

  // 加载嗓音列表（部分浏览器异步返回）
  if (ttsSupported) {
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  } else if (voiceSelect) {
    voiceSelect.style.display = 'none';
  }

  /* ============ 屏幕切换 ============ */
  var screens = {
    home: $('#homeScreen'),
    topic: $('#topicScreen'),
    word: $('#wordScreen'),
    abc: $('#abcScreen'),
    game: $('#gameScreen')
  };
  function show(name) {
    Object.keys(screens).forEach(function (k) {
      screens[k].classList.toggle('hidden', k !== name);
    });
    stopSpeak();
    if (name === 'topic') renderTopics();
    if (name === 'abc') renderAbc();
    if (name === 'game') startGame();
    window.scrollTo(0, 0);
  }
  // 所有带 data-go 的按钮统一处理导航
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-go]');
    if (!btn) return;
    show(btn.getAttribute('data-go'));
  });

  /* ============ 单词主题（word-learning） ============ */
  var topicGrid = $('#topicGrid');
  function renderTopics() {
    topicGrid.innerHTML = THEMES.map(function (t) {
      return '<button class="topic-card" data-topic="' + t.id + '">' +
        iconBox(t.icon) +
        '<span class="t-name">' + t.name + '</span>' +
        '<span class="t-en">' + t.en + '</span>' +
      '</button>';
    }).join('');
  }
  topicGrid.addEventListener('click', function (e) {
    var card = e.target.closest('[data-topic]');
    if (!card) return;
    openTopic(card.getAttribute('data-topic'));
  });

  var wordGrid = $('#wordGrid');
  var wordTopicTitle = $('#wordTopicTitle');
  function openTopic(id) {
    var theme = THEMES.filter(function (t) { return t.id === id; })[0];
    if (!theme) return;
    wordTopicTitle.textContent = theme.name + ' · ' + theme.en;
    wordGrid.innerHTML = theme.words.map(function (w) {
      return '<button class="word-card" data-say="' + w.en + '">' +
        iconBox(w.icon) +
        '<span class="w-en">' + w.en + '</span>' +
        '<span class="w-zh">' + w.zh + '</span>' +
      '</button>';
    }).join('');
    show('word');
  }
  wordGrid.addEventListener('click', function (e) {
    var card = e.target.closest('[data-say]');
    if (!card) return;
    speak(card.getAttribute('data-say'));
    card.classList.remove('pop');
    void card.offsetWidth; // 重置动画
    card.classList.add('pop');
  });

  /* ============ 字母 ABC（alphabet-learning） ============ */
  var abcGrid = $('#abcGrid');

  // 朗读模式：letter（只读字母）| word（字母+单词）| phonics（自然拼读）
  var abcMode = 'letter';
  try { abcMode = localStorage.getItem('ce_abc_mode') || 'letter'; } catch (e) {}

  function sayLetter(letter, word) {
    // 微信 WebView 等部分 TTS 引擎对单字母会加前缀或误读
    // 用完整的字母音节拼写，确保任何引擎都能正确朗读字母名
    var NAMES = {
      A:'aye', B:'bee', C:'see', D:'dee', E:'ee', F:'eff',
      G:'gee', H:'aitch', I:'eye', J:'jay', K:'kay', L:'ell',
      M:'em', N:'en', O:'oh', P:'pee', Q:'queue', R:'are',
      S:'ess', T:'tee', U:'you', V:'vee', W:'double you',
      X:'ex', Y:'why', Z:'zee'
    };
    var spoken = NAMES[letter] || letter;
    if (abcMode === 'word') {
      speak(spoken + '. ' + word);
    } else {
      speak(spoken);
    }
  }

  var abcModeBox = $('#abcMode');
  function renderAbcMode() {
    if (!abcModeBox) return;
    $$('#abcMode .mode-btn').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-mode') === abcMode);
    });
  }
  if (abcModeBox) {
    abcModeBox.addEventListener('click', function (e) {
      var b = e.target.closest('.mode-btn');
      if (!b) return;
      abcMode = b.getAttribute('data-mode');
      try { localStorage.setItem('ce_abc_mode', abcMode); } catch (err) {}
      renderAbcMode();
    });
    renderAbcMode();
  }

  function renderAbc() {
    if (abcGrid.dataset.ready) return; // 只渲染一次
    abcGrid.innerHTML = ALPHABET.map(function (a) {
      return '<button class="abc-card" data-letter="' + a.letter +
          '" data-word="' + a.word + '">' +
        '<span class="abc-letter">' + a.letter + '</span>' +
        iconBox(a.icon, 'abc-icon-box') +
        '<span class="abc-meta">' +
          '<span class="abc-word">' + a.word + '</span>' +
          '<span class="abc-zh">' + a.zh + '</span>' +
        '</span>' +
      '</button>';
    }).join('');
    abcGrid.dataset.ready = '1';
  }
  abcGrid.addEventListener('click', function (e) {
    var card = e.target.closest('[data-letter]');
    if (!card) return;
    sayLetter(card.getAttribute('data-letter'), card.getAttribute('data-word'));
    card.classList.remove('pop');
    void card.offsetWidth;
    card.classList.add('pop');
  });

  /* ============ 听音找图（listening-game） ============ */
  var gameGrid = $('#gameGrid');
  var gameFeedback = $('#gameFeedback');
  var gameScoreEl = $('#gameScore');
  var replayBtn = $('#replaySound');
  var score = 0;
  var currentTarget = null;
  var locked = false;

  // 汇总全部单词作为题池
  var ALL_WORDS = THEMES.reduce(function (acc, t) {
    return acc.concat(t.words.map(function (w) {
      return { icon: w.icon, en: w.en, zh: w.zh, theme: t.id };
    }));
  }, []);

  function pickOptions(target, n) {
    // 优先同主题干扰项，不足再用全池补齐
    var sameTheme = ALL_WORDS.filter(function (w) {
      return w.theme === target.theme && w.en !== target.en;
    });
    var others = ALL_WORDS.filter(function (w) {
      return w.theme !== target.theme && w.en !== target.en;
    });
    var distractors = shuffle(sameTheme).concat(shuffle(others)).slice(0, n - 1);
    return shuffle(distractors.concat([target]));
  }

  function newQuestion() {
    locked = false;
    gameFeedback.textContent = '';
    currentTarget = ALL_WORDS[Math.floor(Math.random() * ALL_WORDS.length)];
    var options = pickOptions(currentTarget, 4);
    gameGrid.innerHTML = options.map(function (w) {
      return '<button class="game-card" data-en="' + w.en + '">' +
        iconBox(w.icon) + '</button>';
    }).join('');
    speak(currentTarget.en);
  }

  function startGame() {
    score = 0;
    gameScoreEl.textContent = '0';
    newQuestion();
  }

  gameGrid.addEventListener('click', function (e) {
    var card = e.target.closest('[data-en]');
    if (!card || locked) return;
    if (card.getAttribute('data-en') === currentTarget.en) {
      // 答对
      locked = true;
      card.classList.add('correct');
      gameFeedback.textContent = '🎉 太棒啦！';
      score += 1;
      gameScoreEl.textContent = String(score);
      speak('Great! ' + currentTarget.en);
      setTimeout(newQuestion, 1400);
    } else {
      // 答错：温柔提示，不扣分，可重试
      card.classList.add('wrong');
      gameFeedback.textContent = '再试一次呀 💪';
      setTimeout(function () { card.classList.remove('wrong'); }, 500);
    }
  });

  replayBtn.addEventListener('click', function () {
    if (currentTarget) speak(currentTarget.en);
  });

  /* ============ 休息提醒（break-reminder） ============ */
  var BREAK_MS = 20 * 60 * 1000; // 20 分钟前台活跃时长
  var TICK_MS = 1000;
  var activeMs = 0;
  var breakModal = $('#breakModal');
  var breakOkBtn = $('#breakOkBtn');
  var breakTimer = null;

  function tick() {
    // 仅在页面可见时累计
    if (document.visibilityState !== 'visible') return;
    if (!breakModal.classList.contains('hidden')) return; // 弹框中暂停累计
    activeMs += TICK_MS;
    if (activeMs >= BREAK_MS) showBreak();
  }
  function showBreak() {
    stopSpeak();              // 弹框时暂停语音
    breakModal.classList.remove('hidden');
  }
  function startTimer() {
    if (breakTimer) clearInterval(breakTimer);
    breakTimer = setInterval(tick, TICK_MS);
  }
  breakOkBtn.addEventListener('click', function () {
    breakModal.classList.add('hidden');
    activeMs = 0; // 重置，继续下一轮
  });
  // 切到后台不累计；恢复可见后继续（tick 自身判断可见性即可）
  document.addEventListener('visibilitychange', function () { /* tick 内已处理 */ });

  /* ============ 初始化 ============ */
  // 渲染所有静态 data-icon 占位（首页菜单、弹框等）
  $$('[data-icon]').forEach(function (el) {
    el.innerHTML = getIcon(el.getAttribute('data-icon'));
  });

  show('home');
  startTimer();
})();
