/**
 * 状态管理模块
 * 集中管理应用状态，持久化到 localStorage
 */

function getDefaultState() {
  return {
    version: 1,
    character: 'coconut',
    difficulty: 10,
    soundEnabled: true,
    stars: 0,
    badges: [],
    modules: {
      counting:    { level: 1, bestScore: 0 },
      arithmetic:  { level: 1, bestScore: 0 },
      comparison:  { level: 1, bestScore: 0 },
      shapes:      { level: 1, bestScore: 0 },
      patterns:    { level: 1, bestScore: 0 },
      sorting:     { level: 1, bestScore: 0 },
    },
    unlockedCharacters: ['coconut'],
  };
}

class Store {
  constructor() {
    this._state = this._load();
    this._listeners = [];
  }

  _load() {
    try {
      const raw = localStorage.getItem(CONFIG.STORAGE_KEY);
      if (!raw) return getDefaultState();
      const data = JSON.parse(raw);
      if (!data || typeof data !== 'object' || !data.version) {
        return getDefaultState();
      }
      // 合并默认值（处理新增字段）
      const defaults = getDefaultState();
      return { ...defaults, ...data, modules: { ...defaults.modules, ...data.modules } };
    } catch {
      return getDefaultState();
    }
  }

  _save() {
    try {
      localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(this._state));
    } catch (e) {
      console.warn('保存状态失败:', e);
    }
  }

  _notify() {
    this._listeners.forEach(fn => fn(this._state));
  }

  get(key) {
    if (key) return this._state[key];
    return { ...this._state };
  }

  set(key, value) {
    this._state[key] = value;
    this._save();
    this._notify();
  }

  update(updater) {
    updater(this._state);
    this._save();
    this._notify();
  }

  subscribe(fn) {
    this._listeners.push(fn);
    return () => {
      this._listeners = this._listeners.filter(l => l !== fn);
    };
  }

  // 增加星星
  addStars(count) {
    this._state.stars += count;
    this._checkUnlocks();
    this._save();
    this._notify();
  }

  // 更新模块进度
  updateModuleProgress(moduleId, level, score) {
    const mod = this._state.modules[moduleId];
    if (level > mod.level) mod.level = level;
    if (score > mod.bestScore) mod.bestScore = score;
    this._checkUnlocks();
    this._save();
    this._notify();
  }

  // 检查角色和勋章解锁
  _checkUnlocks() {
    // 角色解锁
    for (const [id, char] of Object.entries(CONFIG.CHARACTERS)) {
      if (!this._state.unlockedCharacters.includes(id) && this._state.stars >= char.unlockStars) {
        this._state.unlockedCharacters.push(id);
      }
    }
    // 勋章检查
    for (const badge of CONFIG.BADGES) {
      if (!this._state.badges.includes(badge.id) && badge.condition(this._state)) {
        this._state.badges.push(badge.id);
      }
    }
  }

  reset() {
    this._state = getDefaultState();
    this._save();
    this._notify();
  }
}

const store = new Store();
