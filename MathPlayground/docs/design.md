# 数学小乐园 - 技术设计文档

## 1. 概述

本文档描述"数学小乐园"的技术架构和实现方案。项目为纯前端单页应用（SPA），使用 HTML5 + CSS3 + Vanilla JavaScript 实现，无需后端服务。

## 2. 项目结构

```
MathPlayground/
├── index.html          # 入口 HTML
├── css/
│   ├── main.css        # 全局样式、变量、布局
│   ├── components.css  # 通用组件样式（按钮、卡片、弹窗）
│   └── animations.css  # 动画关键帧定义
├── js/
│   ├── main.js         # 应用入口、路由、初始化
│   ├── config.js       # 全局配置常量（难度参数、题目范围等）
│   ├── store.js        # 状态管理（进度、星星、角色、设置）
│   ├── router.js       # 页面路由（hash-based）
│   ├── audio.js        # 音效与语音播报模块
│   ├── timer.js        # 护眼计时器模块
│   ├── ui.js           # 通用 UI 工具（弹窗、反馈动画、过渡）
│   └── modules/
│       ├── counting.js     # 数数游戏
│       ├── arithmetic.js   # 加减法计算
│       ├── comparison.js   # 比大小
│       ├── shapes.js       # 认识形状
│       ├── patterns.js     # 找规律
│       └── sorting.js      # 排序
├── assets/
│   └── sounds/         # 音效文件（answer-correct.mp3 等）
└── docs/
    ├── requirements.md
    └── design.md
```

## 3. 架构设计

### 3.1 整体架构

采用**模块化单页应用**架构，基于 ES Modules 组织代码：

```
┌─────────────────────────────────────────────┐
│                 index.html                   │
├─────────────────────────────────────────────┤
│  main.js（入口）                             │
│    ├── router.js（页面切换）                  │
│    ├── store.js（状态管理）                   │
│    ├── audio.js（音效/语音）                  │
│    ├── timer.js（护眼计时）                   │
│    ├── ui.js（通用UI）                       │
│    └── modules/*（6个游戏模块）               │
└─────────────────────────────────────────────┘
```

### 3.2 页面路由

使用 hash-based 路由实现页面切换，无需刷新页面：

| 路由              | 页面         | 说明                  |
|-------------------|-------------|----------------------|
| `#/`              | 首页         | 角色选择 + 模块入口    |
| `#/counting`      | 数数游戏     | —                    |
| `#/arithmetic`    | 加减法       | —                    |
| `#/comparison`    | 比大小       | —                    |
| `#/shapes`        | 认识形状     | —                    |
| `#/patterns`      | 找规律       | —                    |
| `#/sorting`       | 排序         | —                    |
| `#/settings`      | 设置页       | 难度、音效、角色配置   |
| `#/progress`      | 进度页       | 星星、勋章、关卡进度   |

### 3.3 状态管理（store.js）

集中管理应用状态，持久化到 localStorage：

```javascript
// 状态结构
const state = {
  character: 'coconut',        // 当前角色
  difficulty: 10,              // 数字范围：10 / 20 / 100
  soundEnabled: true,          // 音效开关
  stars: 0,                    // 总星星数
  badges: [],                  // 已解锁勋章
  modules: {
    counting:    { level: 1, bestScore: 0 },
    arithmetic:  { level: 1, bestScore: 0 },
    comparison:  { level: 1, bestScore: 0 },
    shapes:      { level: 1, bestScore: 0 },
    patterns:    { level: 1, bestScore: 0 },
    sorting:     { level: 1, bestScore: 0 },
  },
  eyeCareLastReset: Date.now() // 护眼计时器上次重置时间
};
```

API 设计：
- `store.get(key)` — 读取状态
- `store.set(key, value)` — 更新状态并持久化
- `store.subscribe(callback)` — 状态变更时通知 UI 刷新
- `store.reset()` — 重置所有进度（需确认）

## 4. 核心模块设计

### 4.1 游戏模块通用接口

每个游戏模块（counting / arithmetic / comparison / shapes / patterns / sorting）遵循统一接口：

```javascript
// 模块接口规范
export default {
  name: 'moduleName',
  
  // 初始化模块，渲染到容器
  init(container, options) {},
  
  // 生成一道题目，返回题目对象
  generateQuestion(difficulty) {},
  
  // 渲染题目到 DOM
  renderQuestion(question) {},
  
  // 校验用户答案，返回 { correct, feedback }
  checkAnswer(question, userAnswer) {},
  
  // 清理模块资源
  destroy() {}
};
```

### 4.2 数数游戏（counting.js）

**核心逻辑：**
- 随机生成 N 个可爱物品（emoji），N 在难度范围内
- 用户逐个点击计数，每次点击高亮物品并更新计数器
- 最后选择正确数字提交答案
- 倒数模式：从给定数字开始，依次点击递减

**数据结构：**
```javascript
{
  type: 'count' | 'countdown',
  items: ['🍎', '🍎', '🍊', ...],  // 随机 emoji 数组
  correctAnswer: 7,
  options: [5, 6, 7, 8]             // 选择项（含干扰）
}
```

### 4.3 加减法计算（arithmetic.js）

**核心逻辑：**
- 根据难度生成加法/减法/混合题目
- 可视化辅助：用圆点或物品图形表示数量
- 减法确保结果非负

**数据结构：**
```javascript
{
  type: 'add' | 'subtract' | 'mixed',
  operand1: 5,
  operand2: 3,
  operator: '+',
  correctAnswer: 8,
  visual: { left: 5, right: 3 }  // 图形辅助的数量
}
```

### 4.4 比大小（comparison.js）

**核心逻辑：**
- 初级：两组物品图形比较，选出多的一组
- 进阶：两个数字，选择正确的比较符号（> < =）
- 提供图形辅助过渡到纯数字

**数据结构：**
```javascript
{
  mode: 'visual' | 'numeric' | 'symbol',
  left: { value: 5, items: ['🐟','🐟','🐟','🐟','🐟'] },
  right: { value: 3, items: ['🐟','🐟','🐟'] },
  correctAnswer: '>'  // 或 'left' / 'right'
}
```

### 4.5 认识形状（shapes.js）

**核心逻辑：**
- 识别模式：展示一个形状，选择正确名称
- 寻找模式：在场景图中点击指定形状
- 配对模式：将形状拖拽到对应轮廓

**形状绘制：** 使用 CSS clip-path 或 SVG 绘制基本形状：
```javascript
const SHAPES = {
  circle:    { name: '圆形', emoji: '⭕', cssClass: 'shape-circle' },
  triangle:  { name: '三角形', emoji: '🔺', cssClass: 'shape-triangle' },
  square:    { name: '正方形', emoji: '🟦', cssClass: 'shape-square' },
  rectangle: { name: '长方形', emoji: '🟩', cssClass: 'shape-rectangle' },
  star:      { name: '五角星', emoji: '⭐', cssClass: 'shape-star' }
};
```

### 4.6 找规律（patterns.js）

**核心逻辑：**
- 展示一组序列（颜色/形状/数字），最后一个为空
- 用户从选项中选择或拖入正确的下一个元素
- 难度递增：AB → ABC → AABB → 数字递增

**规律模板：**
```javascript
const PATTERN_TEMPLATES = [
  { type: 'AB',   generate: (items) => [items[0], items[1], items[0], items[1], '?'] },
  { type: 'ABC',  generate: (items) => [items[0], items[1], items[2], items[0], items[1], '?'] },
  { type: 'AABB', generate: (items) => [items[0], items[0], items[1], items[1], items[0], '?'] },
  { type: 'increment', generate: (start, step) => [start, start+step, start+2*step, '?'] }
];
```

### 4.7 排序（sorting.js）

**核心逻辑：**
- 展示一组乱序数字或大小不同的物品
- 用户通过拖拽调整顺序（从小到大或从大到小）
- 校验时比较用户序列与正确序列

**拖拽实现：**
- 使用 HTML5 Drag and Drop API
- 触屏设备使用 touchstart/touchmove/touchend 模拟
- 拖拽过程中显示插入指示线

## 5. 公共服务模块

### 5.1 音效与语音（audio.js）

**音效播放：** 使用 Web Audio API 创建轻量音效：
- 答对音效：短促上升音
- 答错音效：短促低沉音
- 获得星星：叮当声
- 按钮点击：轻触反馈音

**语音播报：** 使用 Web Speech Synthesis API 朗读题目：
```javascript
function speak(text) {
  if (!store.get('soundEnabled')) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'zh-CN';
  utterance.rate = 0.8;  // 稍慢语速，适合幼儿
  speechSynthesis.speak(utterance);
}
```

### 5.2 护眼计时器（timer.js）

- 页面加载时启动计时
- 每秒检查是否超过 20 分钟
- 超时后弹出全屏遮罩提示休息
- 提示中角色 emoji 表达"眼睛累了"
- 点击"休息好了"按钮后重置计时器
- 计时状态存入 sessionStorage（刷新页面不重置）

### 5.3 通用 UI 工具（ui.js）

提供以下通用能力：

| 功能 | 方法 | 说明 |
|------|------|------|
| 反馈弹窗 | `ui.showFeedback(correct)` | 答对/答错的动画反馈 |
| 模态弹窗 | `ui.modal(options)` | 通用确认/提示弹窗 |
| 过渡动画 | `ui.transition(el, type)` | 进入/退出页面动画 |
| Toast | `ui.toast(text)` | 轻量消息提示 |
| 星星动画 | `ui.starBurst(count)` | 获得星星时的粒子动画 |

### 5.4 路由（router.js）

基于 hash 的简单路由：

```javascript
class Router {
  constructor(routes) {
    this.routes = routes; // { path: renderFunction }
    window.addEventListener('hashchange', () => this.resolve());
  }
  
  navigate(path) {
    window.location.hash = path;
  }
  
  resolve() {
    const path = window.location.hash.slice(1) || '/';
    const handler = this.routes[path];
    if (handler) handler();
  }
}
```

## 6. 游戏系统设计

### 6.1 闯关模式

每个模块包含 5 个关卡，每关 5 道题：

```javascript
const LEVEL_CONFIG = {
  1: { questionCount: 5, maxNumber: 5,  optionCount: 3, starsToPass: 3 },
  2: { questionCount: 5, maxNumber: 7,  optionCount: 3, starsToPass: 3 },
  3: { questionCount: 5, maxNumber: 10, optionCount: 4, starsToPass: 4 },
  4: { questionCount: 5, maxNumber: 15, optionCount: 4, starsToPass: 4 },
  5: { questionCount: 5, maxNumber: 20, optionCount: 4, starsToPass: 4 },
};
```

- 每关得星规则：答对 1 题 = 1 颗星
- 通关条件：获得 `starsToPass` 以上星星
- 通关后解锁下一关
- 每关可重复挑战

### 6.2 自由练习模式

- 不限关卡，随机出题
- 题目难度根据当前设置的数字范围生成
- 不记录关卡进度，但星星照常累积
- 适合日常练习巩固
- 加减法模块的自由练习支持选择练习类型：只练加法 / 只练减法 / 加减混合

### 6.3 角色系统

```javascript
const CHARACTERS = {
  coconut: { name: '椰子', emoji: '🥥', unlocked: true },
  cat:     { name: '小猫', emoji: '🐱', unlocked: false, unlockStars: 30 },
  rabbit:  { name: '小兔', emoji: '🐰', unlocked: false, unlockStars: 60 },
  bear:    { name: '小熊', emoji: '🐻', unlocked: false, unlockStars: 120 },
};
```

- 角色仅影响界面显示和语音鼓励内容
- 切换角色不影响学习进度
- 达到星星数自动解锁新角色

### 6.4 奖励与成就

**勋章系统：**
```javascript
const BADGES = [
  { id: 'first_star',      name: '第一颗星',   condition: (s) => s.stars >= 1, emoji: '🌟' },
  { id: 'ten_stars',       name: '十星闪耀',   condition: (s) => s.stars >= 6, emoji: '✨' },
  { id: 'counting_master', name: '数数达人',   condition: (s) => s.modules.counting.level > 5, emoji: '🔢' },
  { id: 'math_wizard',     name: '计算小能手', condition: (s) => s.modules.arithmetic.level > 5, emoji: '🧮' },
  { id: 'star_collector',  name: '星星收集家', condition: (s) => s.stars >= 60, emoji: '💫' },
  { id: 'shape_expert',    name: '形状专家',   condition: (s) => s.modules.shapes.level > 5, emoji: '🔷' },
  { id: 'all_clear',       name: '全部通关',   condition: (s) => Object.values(s.modules).every(m => m.level > 5), emoji: '🏆' },
];
```

每次状态变更时检查是否有新勋章解锁，解锁时展示庆祝动画。

## 7. UI 与样式方案

### 7.1 设计 Token（CSS 变量）

```css
:root {
  /* 主色调 */
  --color-pink: #FFB6C1;
  --color-blue: #87CEEB;
  --color-green: #98FB98;
  --color-yellow: #FFFACD;
  --color-purple: #DDA0DD;
  
  /* 语义色 */
  --color-correct: #4CAF50;
  --color-wrong: #FF6B6B;
  --color-star: #FFD700;
  
  /* 字体 */
  --font-size-xl: 2rem;
  --font-size-lg: 1.5rem;
  --font-size-md: 1.2rem;
  --font-size-sm: 1rem;
  
  /* 圆角 */
  --radius-lg: 20px;
  --radius-md: 12px;
  --radius-sm: 8px;
  
  /* 阴影 */
  --shadow-card: 0 4px 12px rgba(0,0,0,0.1);
  --shadow-btn: 0 3px 6px rgba(0,0,0,0.15);
  
  /* 按钮最小尺寸（适合幼儿点击） */
  --btn-min-size: 56px;
}
```

### 7.2 响应式断点

```css
/* 手机竖屏 */
@media (max-width: 480px) { ... }

/* 平板竖屏 */
@media (min-width: 481px) and (max-width: 768px) { ... }

/* 平板横屏（主要目标） */
@media (min-width: 769px) and (max-width: 1024px) { ... }

/* PC */
@media (min-width: 1025px) { ... }
```

布局策略：
- 平板横屏：游戏区占 70%，侧边栏（角色+进度）占 30%
- 手机竖屏：纵向堆叠，游戏区满宽，进度栏折叠到顶部
- PC：居中容器，最大宽度 1200px

### 7.3 动画方案

使用 CSS @keyframes + JS 控制时机：

| 动画 | 触发场景 | 实现方式 |
|------|---------|---------|
| 弹入 | 题目出现 | `scale(0) → scale(1)` + bounce |
| 摇晃 | 答错反馈 | `translateX` 左右抖动 |
| 飞入 | 星星获得 | 从题目区飞到星星计数器 |
| 粒子爆炸 | 通关/获勋章 | CSS radial + opacity 渐隐 |
| 淡入淡出 | 页面切换 | opacity + translateY |
| 心跳 | 按钮 hover | `scale(1.05)` pulse |

### 7.4 交互规范

- 所有可点击区域最小 56x56px（符合移动端触控规范）
- 拖拽元素有明显抓手视觉反馈（放大 + 阴影加深）
- 答对后延迟 1.5s 自动进入下一题
- 答错允许重试（不扣星），最多 2 次重试后显示正确答案

## 8. 数据存储方案

### 8.1 localStorage 结构

```javascript
// key: 'mathPlayground_state'
{
  version: 1,                    // 数据版本，用于未来迁移
  character: 'coconut',
  difficulty: 10,
  soundEnabled: true,
  stars: 42,
  badges: ['first_star', 'counting_master'],
  modules: {
    counting:    { level: 3, bestScore: 24 },
    arithmetic:  { level: 2, bestScore: 16 },
    comparison:  { level: 1, bestScore: 8 },
    shapes:      { level: 1, bestScore: 0 },
    patterns:    { level: 1, bestScore: 0 },
    sorting:     { level: 1, bestScore: 0 }
  },
  unlockedCharacters: ['coconut', 'cat']
}
```

### 8.2 数据持久化策略

- 每次答题后立即保存（防丢失）
- 读取时做 schema 校验，数据异常则重置为默认值
- 提供版本号字段，未来升级时做数据迁移
- sessionStorage 仅存护眼计时器状态（刷新不重置、关闭标签重置）

## 9. 性能优化

| 策略 | 说明 |
|------|------|
| 模块懒加载 | 游戏模块使用动态 `import()` 按需加载 |
| CSS 动画优先 | 动画使用 transform/opacity，避免触发 layout |
| 事件委托 | 选项区域使用父容器事件委托，减少监听器 |
| 资源内联 | emoji 替代图片，减少 HTTP 请求 |
| 60fps 保障 | 动画使用 requestAnimationFrame，拖拽使用 will-change |
| DOM 复用 | 切题时复用 DOM 节点，仅更新内容 |

## 10. 兼容性

### 10.1 浏览器支持

| 浏览器 | 最低版本 |
|--------|---------|
| Chrome / Edge | 80+ |
| Safari (iOS) | 14+ |
| Firefox | 78+ |
| 微信内置浏览器 | 支持 |

### 10.2 API 兼容性处理

- Web Speech Synthesis：部分浏览器不支持，降级为不播报（静默跳过）
- Drag and Drop：iOS Safari 不完整支持，使用 touch 事件 polyfill
- ES Modules：通过 `<script type="module">` 原生支持，不需要打包工具

## 11. 安全性

- 无外部网络请求，无第三方脚本引入
- localStorage 数据为非敏感的游戏进度
- 无用户注册/登录，无个人信息采集
- 页面内无外链，防止幼儿误触离开

## 12. 开发计划

| 阶段 | 内容 | 预计工作量 |
|------|------|-----------|
| Phase 1 | 基础框架搭建（路由、状态、UI 骨架） | 1 天 |
| Phase 2 | 数数游戏 + 加减法（核心玩法验证） | 1 天 |
| Phase 3 | 比大小 + 认识形状 | 1 天 |
| Phase 4 | 找规律 + 排序 | 1 天 |
| Phase 5 | 角色系统 + 奖励系统 + 闯关模式 | 1 天 |
| Phase 6 | 音效语音 + 护眼提醒 + 响应式适配 | 1 天 |
| Phase 7 | 整体调优、动画打磨、兼容性测试 | 1 天 |
