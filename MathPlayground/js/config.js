/**
 * 全局配置常量
 */
const CONFIG = {
  // 应用名称
  APP_NAME: '数学小乐园',

  // localStorage key
  STORAGE_KEY: 'mathPlayground_state',

  // 护眼提醒间隔（毫秒）
  EYE_CARE_INTERVAL: 20 * 60 * 1000, // 20 分钟

  // 答对后自动下一题延时
  NEXT_QUESTION_DELAY: 1500,

  // 最大重试次数（答错后）
  MAX_RETRIES: 2,

  // 语音语速
  SPEECH_RATE: 0.8,

  // 难度选项
  DIFFICULTY_OPTIONS: [10, 20, 100],

  // 关卡配置
  LEVELS: {
    1: { questionCount: 5, maxNumber: 5,  optionCount: 3, starsToPass: 3 },
    2: { questionCount: 5, maxNumber: 7,  optionCount: 3, starsToPass: 3 },
    3: { questionCount: 5, maxNumber: 10, optionCount: 4, starsToPass: 4 },
    4: { questionCount: 5, maxNumber: 15, optionCount: 4, starsToPass: 4 },
    5: { questionCount: 5, maxNumber: 20, optionCount: 4, starsToPass: 4 },
  },

  // 角色
  CHARACTERS: {
    coconut: { name: '椰子', emoji: '🥥', unlocked: true, unlockStars: 0 },
    cat:     { name: '小猫', emoji: '🐱', unlocked: false, unlockStars: 30 },
    rabbit:  { name: '小兔', emoji: '🐰', unlocked: false, unlockStars: 60 },
    bear:    { name: '小熊', emoji: '🐻', unlocked: false, unlockStars: 120 },
  },

  // 勋章
  BADGES: [
    { id: 'first_star',      name: '第一颗星',   emoji: '🌟', condition: (s) => s.stars >= 1 },
    { id: 'ten_stars',       name: '十星闪耀',   emoji: '✨', condition: (s) => s.stars >= 6 },
    { id: 'counting_master', name: '数数达人',   emoji: '🔢', condition: (s) => s.modules.counting.level > 5 },
    { id: 'math_wizard',     name: '计算小能手', emoji: '🧮', condition: (s) => s.modules.arithmetic.level > 5 },
    { id: 'star_collector',  name: '星星收集家', emoji: '💫', condition: (s) => s.stars >= 60 },
    { id: 'shape_expert',    name: '形状专家',   emoji: '🔷', condition: (s) => s.modules.shapes.level > 5 },
    { id: 'all_clear',       name: '全部通关',   emoji: '🏆', condition: (s) => Object.values(s.modules).every(m => m.level > 5) },
  ],

  // 游戏模块列表
  MODULES: [
    { id: 'counting',    name: '数数游戏', emoji: '🔢', description: '数一数有几个' },
    { id: 'arithmetic',  name: '加减法',   emoji: '🧮', description: '算一算等于几' },
    { id: 'comparison',  name: '比大小',   emoji: '⚖️', description: '谁大谁小' },
    { id: 'shapes',      name: '认识形状', emoji: '🔷', description: '这是什么形状' },
    { id: 'patterns',    name: '找规律',   emoji: '🔮', description: '下一个是什么' },
    { id: 'sorting',     name: '排排队',   emoji: '📊', description: '从小到大排好' },
  ],

  // 物品 emoji 池
  ITEM_EMOJIS: ['🍎', '🍊', '🍋', '🍇', '🍓', '🍑', '🍌', '🐱', '🐶', '🐰', '🐻', '🐸', '🌸', '🌼', '⭐', '❤️', '🎈', '🍭'],
};
