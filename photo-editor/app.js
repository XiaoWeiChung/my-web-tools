// ── State ──
let originalImage = null;  // current working image (may be cropped)
let sourceImage = null;    // the very first imported image, never mutated
let currentFilter = 'none';
let cropMode = false;
let cropRect = { x: 60, y: 60, w: 200, h: 200 };
let isDraggingCrop = false;
let isResizingCrop = false;
let activeHandle = null;
let dragOffsetX = 0, dragOffsetY = 0;
let history = JSON.parse(localStorage.getItem('photocraft_history') || '[]');
// undoStack stores full state snapshots: { canvasData, overlayHTML, sliders, filter }
let undoStack = [];
let selectedElement = null;
let isDirty = false; // tracks unsaved changes

const canvas = document.getElementById('mainCanvas');
const ctx = canvas.getContext('2d');
const overlayLayer = document.getElementById('overlayLayer');

// ── Init ──
window.addEventListener('DOMContentLoaded', () => {
  buildFilterGrid();
  buildStickerGrid();
  buildThemeGrid();
  buildTextPresets();
  renderHistory();
  setupDragDrop();
  setupReloadInput();
  buildTextEditPanel();
  ['bold','italic','shadow','stroke'].forEach(s => {
    document.getElementById('btn-' + s).classList.toggle('active', textStyles[s]);
  });
});

function markDirty() { isDirty = true; }

// ── Undo: full state snapshot ──
// canvasData stores the RAW image pixels (no filter applied), so we can re-render with drawImage()
function captureState() {
  // Capture raw pixels (no filter) for undo
  const rawCanvas = document.createElement('canvas');
  rawCanvas.width = canvas.width;
  rawCanvas.height = canvas.height;
  const rawCtx = rawCanvas.getContext('2d');
  rawCtx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
  return {
    canvasData: rawCanvas.toDataURL(),
    overlayHTML: overlayLayer.innerHTML,
    filter: currentFilter,
    sliders: ['brightness','contrast','shadows','highlights','vibrance','saturation'].reduce((o, id) => {
      o[id] = document.getElementById(id).value; return o;
    }, {}),
  };
}

// Render canvas with filter baked in (for save/export)
// Uses an img element + CSS filter trick to work on iOS Safari
function renderWithFilter() {
  return new Promise(resolve => {
    const filterStr = buildFilter();
    if (!filterStr) {
      // No filter — just copy the canvas directly
      const tmp = document.createElement('canvas');
      tmp.width = canvas.width; tmp.height = canvas.height;
      tmp.getContext('2d').drawImage(originalImage, 0, 0, canvas.width, canvas.height);
      resolve(tmp);
      return;
    }
    // Draw originalImage into an offscreen canvas, apply CSS filter via SVG feColorMatrix
    // Fallback: use a hidden img with CSS filter, draw onto canvas via drawImage
    const tmp = document.createElement('canvas');
    tmp.width = canvas.width; tmp.height = canvas.height;
    const tCtx = tmp.getContext('2d');
    // Try ctx.filter first (works on desktop/Android Chrome)
    try {
      tCtx.filter = filterStr;
      tCtx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
      tCtx.filter = 'none';
      resolve(tmp);
    } catch(e) {
      // Fallback: draw without filter
      tCtx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
      resolve(tmp);
    }
  });
}

function pushUndo() {
  undoStack.push(captureState());
  if (undoStack.length > 30) undoStack.shift();
  markDirty();
}

function undoAction() {
  if (!undoStack.length) { showToast('没有可撤销的操作'); return; }
  const state = undoStack.pop();
  // Restore filter & sliders first
  currentFilter = state.filter;
  Object.entries(state.sliders).forEach(([id, val]) => {
    document.getElementById(id).value = val;
    document.getElementById('val-' + id).textContent = val;
  });
  // Restore raw image, then re-render with restored filter+sliders
  const img = new Image();
  img.onload = () => {
    canvas.width = img.width;
    canvas.height = img.height;
    originalImage = img;
    drawImage(); // re-renders with the restored filter+slider state
  };
  img.src = state.canvasData;
  // Restore overlay
  overlayLayer.innerHTML = state.overlayHTML;
  overlayLayer.querySelectorAll('.canvas-element').forEach(el => {
    makeDraggable(el);
    const sh = el.querySelector('.scale-handle');
    if (sh) makeScalable(el, sh);
    const rh = el.querySelector('.rotate-handle');
    if (rh) makeRotatable(el, rh);
    if (el.classList.contains('text-element')) makeTextEditable(el);
    const db = el.querySelector('.delete-btn');
    if (db) db.onclick = e => { e.stopPropagation(); el.remove(); };
  });
  showToast('已撤销');
}

function setupDragDrop() {
  const zone = document.getElementById('uploadZone');
  const content = zone.querySelector('.upload-content');
  zone.addEventListener('dragover', e => { e.preventDefault(); content.classList.add('drag-over'); });
  zone.addEventListener('dragleave', () => content.classList.remove('drag-over'));
  zone.addEventListener('drop', e => {
    e.preventDefault();
    content.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) loadImage(file);
  });
  document.getElementById('fileInput').addEventListener('change', e => {
    if (e.target.files[0]) loadImage(e.target.files[0]);
  });
}

// ── Page Navigation ──
function showPage(page) {
  document.getElementById('page-editor').style.display = page === 'editor' ? '' : 'none';
  document.getElementById('page-history').style.display = page === 'history' ? '' : 'none';
  document.getElementById('btn-editor').classList.toggle('active', page === 'editor');
  document.getElementById('btn-history').classList.toggle('active', page === 'history');
  if (page === 'history') renderHistory();
}

// ── Tab Switching ──
function switchTab(name) {
  document.querySelectorAll('.tab-btn').forEach((b, i) => {
    const tabs = ['adjust','filter','text','sticker','theme'];
    b.classList.toggle('active', tabs[i] === name);
  });
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
}

// ── Load Image ──
function loadImage(file) {
  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      originalImage = img;
      sourceImage = img; // preserve the original for reset
      resizeCanvas(img);
      drawImage();
      document.getElementById('uploadZone').style.display = 'none';
      document.getElementById('editorLayout').style.display = 'flex';
      buildFilterPreviews(img);
      undoStack = [];
      isDirty = false;
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function resizeCanvas(img) {
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
}

// ── Draw ──
function drawImage() {
  if (!originalImage) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
  // Apply filter via CSS on the canvas element for display (works on all browsers incl. iOS)
  const filterStr = buildFilter();
  canvas.style.filter = filterStr === '' ? 'none' : filterStr;
}

function buildFilter() {
  const b = +document.getElementById('brightness').value;
  const c = +document.getElementById('contrast').value;
  const s = +document.getElementById('saturation').value;
  const v = +document.getElementById('vibrance').value;
  const sh = +document.getElementById('shadows').value;
  const hl = +document.getElementById('highlights').value;
  let parts = [];
  if (currentFilter !== 'none') parts.push(currentFilter);
  if (b !== 0) parts.push(`brightness(${1 + b / 100})`);
  if (c !== 0) parts.push(`contrast(${1 + c / 100})`);
  if (s !== 0 || v !== 0) parts.push(`saturate(${1 + (s + v) / 100})`);
  if (sh !== 0) parts.push(`brightness(${1 + sh * 0.003})`);
  if (hl !== 0) parts.push(`contrast(${1 + hl * 0.003})`);
  return parts.join(' ');
}

// ── Adjust ──
let _adjustSnapshot = null;
let _rafPending = false;

function onSliderMouseDown() {
  _adjustSnapshot = captureState();
}

function applyAdjust() {
  ['brightness','contrast','shadows','highlights','vibrance','saturation'].forEach(id => {
    document.getElementById('val-' + id).textContent = document.getElementById(id).value;
  });
  // Throttle redraws with requestAnimationFrame for smooth mobile performance
  if (!_rafPending) {
    _rafPending = true;
    requestAnimationFrame(() => {
      drawImage();
      _rafPending = false;
    });
  }
  markDirty();
}

// Called on slider onchange (fires on mouseup after drag ends)
function commitAdjust() {
  if (_adjustSnapshot) {
    undoStack.push(_adjustSnapshot);
    if (undoStack.length > 30) undoStack.shift();
    _adjustSnapshot = null;
    markDirty();
  }
}

// ── Filters ──
function buildFilterGrid() {
  const grid = document.getElementById('filterGrid');
  FILTERS.forEach((f, i) => {
    const item = document.createElement('div');
    item.className = 'filter-item' + (i === 0 ? ' active' : '');
    item.innerHTML = `<canvas class="filter-preview" id="fp-${i}"></canvas><div class="filter-name">${f.name}</div>`;
    item.onclick = () => {
      pushUndo();
      document.querySelectorAll('.filter-item').forEach(el => el.classList.remove('active'));
      item.classList.add('active');
      currentFilter = f.css;
      drawImage();
    };
    grid.appendChild(item);
  });
}

function buildFilterPreviews(img) {
  FILTERS.forEach((f, i) => {
    const fc = document.getElementById('fp-' + i);
    if (!fc) return;
    fc.width = 100; fc.height = 100;
    const fctx = fc.getContext('2d');
    fctx.filter = f.css;
    fctx.drawImage(img, 0, 0, 100, 100);
    fctx.filter = 'none';
  });
}

// ── Stickers ──
function buildStickerGrid() {
  const grid = document.getElementById('stickerGrid');
  STICKERS.forEach(s => {
    const item = document.createElement('div');
    item.className = 'sticker-item';
    item.textContent = s;
    item.onclick = () => { pushUndo(); addSticker(s); };
    grid.appendChild(item);
  });
}

// ── Themes ──
function buildThemeGrid() {
  const grid = document.getElementById('themeGrid');
  THEMES.forEach(t => {
    const item = document.createElement('div');
    item.className = 'theme-item';
    item.innerHTML = `
      <div class="theme-dot" style="background:${t.color};box-shadow:0 0 10px ${t.color}44"></div>
      <div class="theme-info">
        <span class="theme-name">${t.name}</span>
        <span class="theme-sub">${t.sub}</span>
      </div>`;
    item.onclick = () => applyTheme(t);
    grid.appendChild(item);
  });
}

function clearThemeElements() {
  overlayLayer.querySelectorAll('[data-theme-element]').forEach(el => el.remove());
}

function applyTheme(t) {
  pushUndo();
  clearThemeElements();
  currentFilter = t.filter;
  drawImage();

  const canvasRect = canvas.getBoundingClientRect();
  const wrapperRect = document.querySelector('.canvas-wrapper').getBoundingClientRect();
  const offX = canvasRect.left - wrapperRect.left;
  const offY = canvasRect.top - wrapperRect.top;
  const dispW = canvasRect.width;
  const dispH = canvasRect.height;

  const stickerEl = document.createElement('div');
  stickerEl.className = 'canvas-element';
  stickerEl.dataset.themeElement = '1';
  stickerEl.style.cssText = `left:${offX + 16}px;top:${offY + dispH - 70}px;font-size:48px;line-height:1`;
  stickerEl.textContent = t.sticker;
  const sd = document.createElement('button');
  sd.className = 'delete-btn'; sd.textContent = '×';
  sd.onclick = e => { e.stopPropagation(); stickerEl.remove(); };
  stickerEl.appendChild(sd);
  makeDraggable(stickerEl);
  overlayLayer.appendChild(stickerEl);

  const textEl = document.createElement('div');
  textEl.className = 'canvas-element';
  textEl.dataset.themeElement = '1';
  textEl.style.cssText = `left:${offX + dispW / 2 - 50}px;top:${offY + dispH - 40}px;color:${t.textColor};font-size:22px;font-family:Inter;white-space:nowrap;text-shadow:0 2px 8px rgba(0,0,0,0.7);font-weight:600`;
  textEl.textContent = '✦ ' + t.name;
  const td = document.createElement('button');
  td.className = 'delete-btn'; td.textContent = '×';
  td.onclick = e => { e.stopPropagation(); textEl.remove(); };
  textEl.appendChild(td);
  makeDraggable(textEl);
  overlayLayer.appendChild(textEl);

  showToast('主题已应用：' + t.name, 'success');
}

// ── Text style toggles ──
const textStyles = { bold: false, italic: false, shadow: true, stroke: false };

function toggleTextStyle(s) {
  textStyles[s] = !textStyles[s];
  document.getElementById('btn-' + s).classList.toggle('active', textStyles[s]);
}

// ── Fancy Text Presets (花字) ──
const TEXT_PRESETS = [
  {
    id: 'neon-pink',
    label: '💗 霓虹粉',
    color: '#ff2d78',
    font: 'Impact, sans-serif',
    bold: true, italic: false, shadow: false, stroke: false,
    extraStyle: 'text-shadow:0 0 8px #ff2d78,0 0 20px #ff2d78,0 0 50px #ff2d78,0 0 80px #ff006680;letter-spacing:3px;',
    size: 48,
  },
  {
    id: 'neon-cyan',
    label: '💙 霓虹蓝',
    color: '#00f5ff',
    font: 'Impact, sans-serif',
    bold: true, italic: false, shadow: false, stroke: false,
    extraStyle: 'text-shadow:0 0 8px #00f5ff,0 0 20px #00f5ff,0 0 50px #00f5ff,0 0 80px #00bfff80;letter-spacing:3px;',
    size: 48,
  },
  {
    id: 'neon-green',
    label: '💚 霓虹绿',
    color: '#39ff14',
    font: 'Impact, sans-serif',
    bold: true, italic: false, shadow: false, stroke: false,
    extraStyle: 'text-shadow:0 0 8px #39ff14,0 0 20px #39ff14,0 0 50px #39ff14,0 0 80px #00ff0080;letter-spacing:3px;',
    size: 48,
  },
  {
    id: 'gold-3d',
    label: '✨ 黄金3D',
    color: '#ffd700',
    font: 'Georgia, serif',
    bold: true, italic: false, shadow: false, stroke: false,
    extraStyle: 'text-shadow:1px 1px 0 #b8860b,2px 2px 0 #a07700,3px 3px 0 #8b6914,4px 4px 0 #7a5c10,5px 5px 8px rgba(0,0,0,0.6);-webkit-text-stroke:1px #b8860b;letter-spacing:2px;',
    size: 48,
  },
  {
    id: 'silver-3d',
    label: '🩶 银色3D',
    color: '#e8e8e8',
    font: 'Georgia, serif',
    bold: true, italic: false, shadow: false, stroke: false,
    extraStyle: 'text-shadow:1px 1px 0 #aaa,2px 2px 0 #999,3px 3px 0 #888,4px 4px 0 #777,5px 5px 8px rgba(0,0,0,0.5);-webkit-text-stroke:1px #bbb;letter-spacing:2px;',
    size: 48,
  },
  {
    id: 'bubble-purple',
    label: '🫧 泡泡紫',
    color: '#fff',
    font: 'Arial Rounded MT Bold, Arial, sans-serif',
    bold: true, italic: false, shadow: false, stroke: false,
    extraStyle: '-webkit-text-stroke:3px #7c6af7;text-shadow:0 4px 12px rgba(124,106,247,0.6);letter-spacing:2px;',
    size: 48,
  },
  {
    id: 'bubble-pink',
    label: '🫧 泡泡粉',
    color: '#fff',
    font: 'Arial Rounded MT Bold, Arial, sans-serif',
    bold: true, italic: false, shadow: false, stroke: false,
    extraStyle: '-webkit-text-stroke:3px #f472b6;text-shadow:0 4px 12px rgba(244,114,182,0.6);letter-spacing:2px;',
    size: 48,
  },
  {
    id: 'gradient-fire',
    label: '🔥 火焰',
    color: 'transparent',
    font: 'Impact, sans-serif',
    bold: true, italic: false, shadow: false, stroke: false,
    extraStyle: 'background:linear-gradient(180deg,#fff176 0%,#ff9800 40%,#f44336 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;letter-spacing:3px;text-shadow:none;filter:drop-shadow(0 2px 8px rgba(255,100,0,0.6));',
    size: 52,
  },
  {
    id: 'gradient-ocean',
    label: '🌊 海洋',
    color: 'transparent',
    font: 'Impact, sans-serif',
    bold: true, italic: false, shadow: false, stroke: false,
    extraStyle: 'background:linear-gradient(135deg,#a8edea 0%,#00b4db 50%,#6a11cb 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;letter-spacing:3px;text-shadow:none;filter:drop-shadow(0 2px 8px rgba(0,180,219,0.5));',
    size: 52,
  },
  {
    id: 'gradient-sunset',
    label: '🌅 日落',
    color: 'transparent',
    font: 'Impact, sans-serif',
    bold: true, italic: false, shadow: false, stroke: false,
    extraStyle: 'background:linear-gradient(135deg,#f7971e 0%,#ffd200 50%,#ff6b6b 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;letter-spacing:3px;text-shadow:none;filter:drop-shadow(0 2px 8px rgba(255,107,107,0.5));',
    size: 52,
  },
  {
    id: 'gradient-aurora',
    label: '🌌 极光',
    color: 'transparent',
    font: 'Impact, sans-serif',
    bold: true, italic: false, shadow: false, stroke: false,
    extraStyle: 'background:linear-gradient(90deg,#43e97b 0%,#38f9d7 30%,#4facfe 60%,#a18cd1 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;letter-spacing:3px;text-shadow:none;filter:drop-shadow(0 2px 10px rgba(67,233,123,0.4));',
    size: 52,
  },
  {
    id: 'rainbow',
    label: '🌈 彩虹',
    color: 'transparent',
    font: 'Impact, sans-serif',
    bold: true, italic: false, shadow: false, stroke: false,
    extraStyle: 'background:linear-gradient(90deg,#ff0000 0%,#ff7700 17%,#ffff00 33%,#00ff00 50%,#0099ff 67%,#8b00ff 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;letter-spacing:4px;text-shadow:none;',
    size: 48,
  },
  {
    id: 'red-pill',
    label: '❤️ 红底胶囊',
    color: '#fff',
    font: 'Inter, sans-serif',
    bold: true, italic: false, shadow: false, stroke: false,
    extraStyle: 'background:linear-gradient(135deg,#ff416c,#ff4b2b);padding:6px 18px;border-radius:50px;letter-spacing:2px;text-shadow:0 1px 4px rgba(0,0,0,0.4);box-shadow:0 4px 15px rgba(255,65,108,0.5);',
    size: 34,
  },
  {
    id: 'purple-pill',
    label: '💜 紫底胶囊',
    color: '#fff',
    font: 'Inter, sans-serif',
    bold: true, italic: false, shadow: false, stroke: false,
    extraStyle: 'background:linear-gradient(135deg,#7c6af7,#a78bfa);padding:6px 18px;border-radius:50px;letter-spacing:2px;text-shadow:0 1px 4px rgba(0,0,0,0.3);box-shadow:0 4px 15px rgba(124,106,247,0.5);',
    size: 34,
  },
  {
    id: 'yellow-tag',
    label: '💛 黄色标签',
    color: '#1a1a1a',
    font: 'Inter, sans-serif',
    bold: true, italic: false, shadow: false, stroke: false,
    extraStyle: 'background:#fbbf24;padding:5px 16px;border-radius:8px;letter-spacing:1px;box-shadow:3px 3px 0 #d97706;',
    size: 34,
  },
  {
    id: 'dark-glass',
    label: '🖤 毛玻璃',
    color: '#fff',
    font: 'Inter, sans-serif',
    bold: false, italic: false, shadow: false, stroke: false,
    extraStyle: 'background:rgba(0,0,0,0.45);backdrop-filter:blur(8px);padding:6px 18px;border-radius:10px;border:1px solid rgba(255,255,255,0.2);letter-spacing:1px;box-shadow:0 4px 20px rgba(0,0,0,0.3);',
    size: 32,
  },
  {
    id: 'white-glass',
    label: '🤍 白玻璃',
    color: '#1a1a2e',
    font: 'Inter, sans-serif',
    bold: false, italic: false, shadow: false, stroke: false,
    extraStyle: 'background:rgba(255,255,255,0.75);backdrop-filter:blur(8px);padding:6px 18px;border-radius:10px;border:1px solid rgba(255,255,255,0.9);letter-spacing:1px;box-shadow:0 4px 20px rgba(0,0,0,0.15);',
    size: 32,
  },
  {
    id: 'retro-stamp',
    label: '📮 复古印章',
    color: 'transparent',
    font: 'Georgia, serif',
    bold: true, italic: false, shadow: false, stroke: false,
    extraStyle: '-webkit-text-stroke:2px #ff6b35;letter-spacing:4px;text-transform:uppercase;filter:drop-shadow(2px 2px 0 #ff6b3560);',
    size: 40,
  },
  {
    id: 'chalk',
    label: '🖍 粉笔字',
    color: '#f0f0f0',
    font: 'Georgia, serif',
    bold: false, italic: false, shadow: false, stroke: false,
    extraStyle: 'text-shadow:1px 1px 2px rgba(255,255,255,0.3),-1px -1px 2px rgba(255,255,255,0.2),2px 0 3px rgba(255,255,255,0.15);letter-spacing:2px;opacity:0.9;filter:blur(0.3px);',
    size: 40,
  },
  {
    id: 'cyber',
    label: '🤖 赛博体',
    color: '#00ff9f',
    font: 'monospace',
    bold: true, italic: false, shadow: false, stroke: false,
    extraStyle: 'text-shadow:0 0 5px #00ff9f,2px 0 0 rgba(255,0,100,0.5),-2px 0 0 rgba(0,200,255,0.5);letter-spacing:4px;text-transform:uppercase;',
    size: 36,
  },
];

function buildTextPresets() {
  const grid = document.getElementById('textPresetGrid');
  grid.innerHTML = '';
  TEXT_PRESETS.forEach(p => {
    const btn = document.createElement('button');
    btn.className = 'fancy-preset-btn';
    btn.style.cssText = `font-family:${p.font};font-weight:${p.bold?'700':'400'};font-style:${p.italic?'italic':'normal'};font-size:14px;${p.extraStyle}`;
    if (p.color !== 'transparent') btn.style.color = p.color;
    btn.textContent = p.label;
    btn.title = p.label;
    btn.onclick = (e) => applyTextPreset(p, e);
    grid.appendChild(btn);
  });
}

function applyTextPreset(p, e) {
  document.getElementById('textInput').dataset.presetId = p.id;
  if (p.color !== 'transparent') document.getElementById('textColor').value = p.color;
  document.getElementById('fontSize').value = p.size;
  document.getElementById('val-fontSize').textContent = p.size;
  document.getElementById('fontFamily').value = p.font;
  textStyles.bold = p.bold; textStyles.italic = p.italic;
  textStyles.shadow = p.shadow; textStyles.stroke = p.stroke;
  ['bold','italic','shadow','stroke'].forEach(s => {
    document.getElementById('btn-' + s).classList.toggle('active', textStyles[s]);
  });
  document.querySelectorAll('.fancy-preset-btn').forEach(b => b.classList.remove('selected-preset'));
  if (e && e.currentTarget) e.currentTarget.classList.add('selected-preset');
  showToast('已选择：' + p.label);
}

// ── Text Add ──
function addText() {
  const val = document.getElementById('textInput').value.trim();
  if (!val) return;
  pushUndo();
  const color = document.getElementById('textColor').value;
  const size = +document.getElementById('fontSize').value;
  const font = document.getElementById('fontFamily').value;
  const presetId = document.getElementById('textInput').dataset.presetId || '';
  const preset = TEXT_PRESETS.find(p => p.id === presetId) || null;
  addTextElement(val, color, size, font, { ...textStyles }, 80, 80, preset);
  document.getElementById('textInput').value = '';
}

function applyStyleToElement(el, color, size, font, styles, preset) {
  const shadow = styles.shadow ? '0 2px 10px rgba(0,0,0,0.8)' : 'none';
  const fw = styles.bold ? '700' : '400';
  const fi = styles.italic ? 'italic' : 'normal';
  el.style.color = color;
  el.style.fontSize = size + 'px';
  el.style.fontFamily = font;
  el.style.textShadow = shadow;
  el.style.fontWeight = fw;
  el.style.fontStyle = fi;
  el.style.webkitTextStroke = styles.stroke ? '1px rgba(0,0,0,0.6)' : '0';
  // Apply extra fancy style if preset provided
  if (preset && preset.extraStyle) {
    // Parse and apply each property from extraStyle string
    preset.extraStyle.split(';').forEach(rule => {
      const [prop, ...vals] = rule.split(':');
      if (!prop || !vals.length) return;
      const cssProp = prop.trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      el.style[cssProp] = vals.join(':').trim();
    });
    if (preset.color === 'transparent') {
      el.style.color = 'transparent';
    }
  }
  el.dataset.textColor = color;
  el.dataset.fontSize = size;
  el.dataset.fontFamily = font;
  el.dataset.bold = styles.bold ? '1' : '';
  el.dataset.italic = styles.italic ? '1' : '';
  el.dataset.shadow = styles.shadow ? '1' : '';
  el.dataset.stroke = styles.stroke ? '1' : '';
  el.dataset.presetId = preset ? preset.id : '';
}

function addTextElement(text, color, size, font, styles, x, y, preset) {
  const el = document.createElement('div');
  el.className = 'canvas-element text-element';
  el.style.cssText = `left:${x}px;top:${y}px;white-space:nowrap;`;
  applyStyleToElement(el, color, size, font, styles, preset || null);

  const span = document.createElement('span');
  span.textContent = text;
  el.appendChild(span);

  const del = document.createElement('button');
  del.className = 'delete-btn'; del.textContent = '×';
  del.onclick = e => { e.stopPropagation(); el.remove(); };
  el.appendChild(del);

  const scaleHandle = document.createElement('div');
  scaleHandle.className = 'scale-handle';
  el.appendChild(scaleHandle);

  const rotateHandle = document.createElement('div');
  rotateHandle.className = 'rotate-handle';
  rotateHandle.title = '旋转';
  el.appendChild(rotateHandle);

  makeDraggable(el);
  makeScalable(el, scaleHandle);
  makeRotatable(el, rotateHandle);
  makeTextEditable(el);
  overlayLayer.appendChild(el);
  markDirty();
}

// ── Text Edit Panel (inline floating) ──
function buildTextEditPanel() {
  const panel = document.createElement('div');
  panel.id = 'textEditPanel';
  panel.className = 'text-edit-panel';
  panel.style.display = 'none';
  panel.innerHTML = `
    <input type="text" id="editTextInput" class="edit-text-input" placeholder="编辑文字..." />
    <input type="color" id="editTextColor" title="颜色" />
    <select id="editFontFamily" class="edit-select">
      <option value="Inter">Inter</option>
      <option value="serif">衬线体</option>
      <option value="monospace">等宽体</option>
      <option value="cursive">手写体</option>
    </select>
    <button class="edit-style-btn" id="edit-btn-bold" onclick="toggleEditStyle('bold')" title="粗体">B</button>
    <button class="edit-style-btn italic-btn" id="edit-btn-italic" onclick="toggleEditStyle('italic')" title="斜体">I</button>
    <button class="edit-style-btn" id="edit-btn-shadow" onclick="toggleEditStyle('shadow')" title="阴影">S</button>
    <button class="edit-style-btn" id="edit-btn-stroke" onclick="toggleEditStyle('stroke')" title="描边">O</button>
    <button class="edit-confirm-btn" onclick="confirmTextEdit()">✓</button>
    <button class="edit-cancel-btn" onclick="cancelTextEdit()">✕</button>
  `;
  document.body.appendChild(panel);
}

let editingElement = null;
let editStyles = {};

function makeTextEditable(el) {
  el.addEventListener('dblclick', e => {
    e.stopPropagation();
    openTextEdit(el);
  });
}

function openTextEdit(el) {
  editingElement = el;
  const span = el.querySelector('span');
  editStyles = {
    bold: !!el.dataset.bold,
    italic: !!el.dataset.italic,
    shadow: !!el.dataset.shadow,
    stroke: !!el.dataset.stroke,
  };

  const panel = document.getElementById('textEditPanel');
  document.getElementById('editTextInput').value = span ? span.textContent : '';
  document.getElementById('editTextColor').value = el.dataset.textColor || '#ffffff';
  document.getElementById('editFontFamily').value = el.dataset.fontFamily || 'Inter';
  ['bold','italic','shadow','stroke'].forEach(s => {
    document.getElementById('edit-btn-' + s).classList.toggle('active', editStyles[s]);
  });

  // Position panel near element
  const rect = el.getBoundingClientRect();
  panel.style.display = 'flex';
  panel.style.top = Math.max(70, rect.top - 56) + 'px';
  panel.style.left = Math.max(10, rect.left) + 'px';
  document.getElementById('editTextInput').focus();
}

function toggleEditStyle(s) {
  editStyles[s] = !editStyles[s];
  document.getElementById('edit-btn-' + s).classList.toggle('active', editStyles[s]);
  if (editingElement) {
    applyStyleToElement(
      editingElement,
      document.getElementById('editTextColor').value,
      parseFloat(editingElement.style.fontSize),
      document.getElementById('editFontFamily').value,
      editStyles
    );
  }
}

function confirmTextEdit() {
  if (!editingElement) return;
  pushUndo();
  const span = editingElement.querySelector('span');
  const newText = document.getElementById('editTextInput').value.trim();
  if (newText && span) span.textContent = newText;
  applyStyleToElement(
    editingElement,
    document.getElementById('editTextColor').value,
    parseFloat(editingElement.style.fontSize),
    document.getElementById('editFontFamily').value,
    editStyles
  );
  cancelTextEdit();
}

function cancelTextEdit() {
  document.getElementById('textEditPanel').style.display = 'none';
  editingElement = null;
}

// Close edit panel on outside click
document.addEventListener('mousedown', e => {
  const panel = document.getElementById('textEditPanel');
  if (panel && !panel.contains(e.target) && editingElement && !editingElement.contains(e.target)) {
    cancelTextEdit();
  }
});

// ── Sticker Add ──
function addSticker(emoji) {
  const el = document.createElement('div');
  el.className = 'canvas-element';
  el.style.cssText = `left:80px;top:80px;font-size:48px;line-height:1`;
  const span = document.createElement('span');
  span.textContent = emoji;
  el.appendChild(span);
  const del = document.createElement('button');
  del.className = 'delete-btn'; del.textContent = '×';
  del.onclick = e => { e.stopPropagation(); el.remove(); };
  el.appendChild(del);
  const scaleHandle = document.createElement('div');
  scaleHandle.className = 'scale-handle';
  el.appendChild(scaleHandle);
  const rotateHandle = document.createElement('div');
  rotateHandle.className = 'rotate-handle';
  el.appendChild(rotateHandle);
  makeDraggable(el);
  makeScalable(el, scaleHandle);
  makeRotatable(el, rotateHandle);
  overlayLayer.appendChild(el);
  markDirty();
}

// ── Scalable Elements ──
function makeScalable(el, handle) {
  let startX, startY, startSize;

  function _scaleStart(clientX, clientY) {
    startX = clientX; startY = clientY;
    startSize = parseFloat(el.style.fontSize) || 32;
  }
  function _scaleMove(clientX, clientY) {
    const delta = ((clientX - startX) + (clientY - startY)) / 2;
    const newSize = Math.max(10, Math.min(200, startSize + delta * 0.4));
    el.style.fontSize = newSize + 'px';
    el.dataset.fontSize = newSize;
  }

  handle.addEventListener('mousedown', e => {
    e.stopPropagation(); e.preventDefault();
    _scaleStart(e.clientX, e.clientY);
    const onMove = e => _scaleMove(e.clientX, e.clientY);
    const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });

  handle.addEventListener('touchstart', e => {
    e.stopPropagation(); e.preventDefault();
    const t = e.touches[0];
    _scaleStart(t.clientX, t.clientY);
    const onTM = e => { e.preventDefault(); const t = e.touches[0]; _scaleMove(t.clientX, t.clientY); };
    const onTU = () => { handle.removeEventListener('touchmove', onTM); handle.removeEventListener('touchend', onTU); };
    handle.addEventListener('touchmove', onTM, { passive: false });
    handle.addEventListener('touchend', onTU);
  }, { passive: false });
}

// ── Rotatable Elements ──
function makeRotatable(el, handle) {
  function _rotateStart(clientX, clientY) {
    const rect = el.getBoundingClientRect();
    return {
      cx: rect.left + rect.width / 2,
      cy: rect.top + rect.height / 2,
      startAngle: Math.atan2(clientY - (rect.top + rect.height / 2), clientX - (rect.left + rect.width / 2)),
      currentRotation: parseFloat(el.dataset.rotation || '0'),
    };
  }
  function _rotateMove(state, clientX, clientY) {
    const angle = Math.atan2(clientY - state.cy, clientX - state.cx);
    const deg = state.currentRotation + (angle - state.startAngle) * (180 / Math.PI);
    el.style.transform = `rotate(${deg}deg)`;
    el.dataset.rotation = deg;
  }

  handle.addEventListener('mousedown', e => {
    e.stopPropagation(); e.preventDefault();
    const state = _rotateStart(e.clientX, e.clientY);
    const onMove = e => _rotateMove(state, e.clientX, e.clientY);
    const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });

  handle.addEventListener('touchstart', e => {
    e.stopPropagation(); e.preventDefault();
    const t = e.touches[0];
    const state = _rotateStart(t.clientX, t.clientY);
    const onTM = e => { e.preventDefault(); const t = e.touches[0]; _rotateMove(state, t.clientX, t.clientY); };
    const onTU = () => { handle.removeEventListener('touchmove', onTM); handle.removeEventListener('touchend', onTU); };
    handle.addEventListener('touchmove', onTM, { passive: false });
    handle.addEventListener('touchend', onTU);
  }, { passive: false });
}

// ── Draggable Elements ──
function makeDraggable(el) {
  let ox, oy, startX, startY;

  function _dragStart(clientX, clientY) {
    document.querySelectorAll('.canvas-element').forEach(c => c.classList.remove('selected'));
    el.classList.add('selected');
    selectedElement = el;
    startX = clientX; startY = clientY;
    ox = el.offsetLeft; oy = el.offsetTop;
  }
  function _dragMove(clientX, clientY) {
    el.style.left = (ox + clientX - startX) + 'px';
    el.style.top  = (oy + clientY - startY) + 'px';
  }

  el.addEventListener('mousedown', e => {
    if (e.target.classList.contains('delete-btn') ||
        e.target.classList.contains('scale-handle') ||
        e.target.classList.contains('rotate-handle')) return;
    e.preventDefault();
    _dragStart(e.clientX, e.clientY);
    const onMove = e => _dragMove(e.clientX, e.clientY);
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });

  el.addEventListener('touchstart', e => {
    if (e.target.classList.contains('delete-btn') ||
        e.target.classList.contains('scale-handle') ||
        e.target.classList.contains('rotate-handle')) return;
    e.preventDefault();
    const t = e.touches[0];
    _dragStart(t.clientX, t.clientY);
    const onTM = e => { const t = e.touches[0]; _dragMove(t.clientX, t.clientY); };
    const onTU = () => { el.removeEventListener('touchmove', onTM); el.removeEventListener('touchend', onTU); };
    el.addEventListener('touchmove', onTM, { passive: false });
    el.addEventListener('touchend', onTU);
  }, { passive: false });

  document.addEventListener('mousedown', e => {
    if (!el.contains(e.target)) el.classList.remove('selected');
  });
}

// ── Crop ──
function toggleCrop() {
  cropMode = !cropMode;
  document.getElementById('cropBtn').classList.toggle('active', cropMode);
  const overlay = document.getElementById('cropOverlay');
  if (cropMode) {
    overlay.style.display = 'flex';
    cropRect = { x: canvas.width * 0.1, y: canvas.height * 0.1, w: canvas.width * 0.8, h: canvas.height * 0.8 };
    updateCropBox();
    setupCropDrag();
  } else {
    overlay.style.display = 'none';
  }
}

function updateCropBox() {
  const box = document.getElementById('cropBox');
  const rect = canvas.getBoundingClientRect();
  const wrapper = document.querySelector('.canvas-wrapper').getBoundingClientRect();
  const offX = rect.left - wrapper.left;
  const offY = rect.top - wrapper.top;
  const scaleX = rect.width / canvas.width;
  const scaleY = rect.height / canvas.height;
  box.style.left = (offX + cropRect.x * scaleX) + 'px';
  box.style.top = (offY + cropRect.y * scaleY) + 'px';
  box.style.width = (cropRect.w * scaleX) + 'px';
  box.style.height = (cropRect.h * scaleY) + 'px';
}

function setupCropDrag() {
  const box = document.getElementById('cropBox');
  box.addEventListener('mousedown', e => {
    if (e.target.dataset.handle) { isResizingCrop = true; activeHandle = e.target.dataset.handle; }
    else { isDraggingCrop = true; }
    const rect = canvas.getBoundingClientRect();
    dragOffsetX = (e.clientX - rect.left) * (canvas.width / rect.width) - cropRect.x;
    dragOffsetY = (e.clientY - rect.top) * (canvas.height / rect.height) - cropRect.y;
    e.preventDefault();
  });
  document.addEventListener('mousemove', e => {
    if (!isDraggingCrop && !isResizingCrop) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;
    if (isDraggingCrop) {
      cropRect.x = Math.max(0, Math.min(canvas.width - cropRect.w, mx - dragOffsetX));
      cropRect.y = Math.max(0, Math.min(canvas.height - cropRect.h, my - dragOffsetY));
    } else if (isResizingCrop) {
      if (activeHandle === 'br') {
        cropRect.w = Math.max(40, Math.min(canvas.width - cropRect.x, mx - cropRect.x));
        cropRect.h = Math.max(40, Math.min(canvas.height - cropRect.y, my - cropRect.y));
      } else if (activeHandle === 'tl') {
        const nx = Math.max(0, Math.min(mx, cropRect.x + cropRect.w - 40));
        const ny = Math.max(0, Math.min(my, cropRect.y + cropRect.h - 40));
        cropRect.w += cropRect.x - nx; cropRect.h += cropRect.y - ny;
        cropRect.x = nx; cropRect.y = ny;
      } else if (activeHandle === 'tr') {
        cropRect.w = Math.max(40, Math.min(canvas.width - cropRect.x, mx - cropRect.x));
        const ny = Math.max(0, Math.min(my, cropRect.y + cropRect.h - 40));
        cropRect.h += cropRect.y - ny; cropRect.y = ny;
      } else if (activeHandle === 'bl') {
        const nx = Math.max(0, Math.min(mx, cropRect.x + cropRect.w - 40));
        cropRect.w += cropRect.x - nx; cropRect.x = nx;
        cropRect.h = Math.max(40, Math.min(canvas.height - cropRect.y, my - cropRect.y));
      }
    }
    updateCropBox();
  });
  document.addEventListener('mouseup', () => {
    isDraggingCrop = false; isResizingCrop = false; activeHandle = null;
  });
}

async function applyCrop() {
  pushUndo();
  const filtered = await renderWithFilter();
  const filteredCtx = filtered.getContext('2d');
  const imgData = filteredCtx.getImageData(cropRect.x, cropRect.y, cropRect.w, cropRect.h);
  canvas.width = cropRect.w; canvas.height = cropRect.h;
  ctx.putImageData(imgData, 0, 0);
  canvas.style.filter = 'none';
  currentFilter = 'none';
  ['brightness','contrast','shadows','highlights','vibrance','saturation'].forEach(id => {
    document.getElementById(id).value = 0;
    document.getElementById('val-' + id).textContent = '0';
  });
  const tmp = new Image();
  tmp.onload = () => { originalImage = tmp; drawImage(); };
  tmp.src = canvas.toDataURL();
  cancelCrop();
}

function cancelCrop() {
  cropMode = false;
  document.getElementById('cropBtn').classList.remove('active');
  document.getElementById('cropOverlay').style.display = 'none';
}

// ── Reset ──
function resetAll() {
  if (!sourceImage) return;
  pushUndo();
  ['brightness','contrast','shadows','highlights','vibrance','saturation'].forEach(id => {
    document.getElementById(id).value = 0;
    document.getElementById('val-' + id).textContent = '0';
  });
  currentFilter = 'none';
  canvas.style.filter = 'none';
  document.querySelectorAll('.filter-item').forEach((el, i) => el.classList.toggle('active', i === 0));
  overlayLayer.innerHTML = '';
  originalImage = sourceImage;
  resizeCanvas(sourceImage);
  drawImage();
  showToast('已重置到原始状态');
}

// ── Save ──
// ── Save ──
async function saveImage() {
  // 1. Bake filter into base canvas
  const baseCanvas = await renderWithFilter();
  const tmpCtx = baseCanvas.getContext('2d');

  // 2. Composite overlay elements (text/stickers) on top
  const canvasRect = canvas.getBoundingClientRect();
  const wrapperRect = document.querySelector('.canvas-wrapper').getBoundingClientRect();
  const scaleX = canvas.width / canvasRect.width;
  const scaleY = canvas.height / canvasRect.height;
  const offX = canvasRect.left - wrapperRect.left;
  const offY = canvasRect.top - wrapperRect.top;

  document.querySelectorAll('.canvas-element').forEach(el => {
    const x = (parseFloat(el.style.left) - offX) * scaleX;
    const y = (parseFloat(el.style.top) - offY) * scaleY;
    const style = window.getComputedStyle(el);
    const fontSize = parseFloat(style.fontSize) * scaleX;
    const rotation = parseFloat(el.dataset.rotation || '0');
    const isBold = el.dataset.bold ? 'bold ' : '';
    const isItalic = el.dataset.italic ? 'italic ' : '';
    const span = el.querySelector('span');
    const text = span ? span.textContent : '';
    const cx = x + el.offsetWidth * scaleX / 2;
    const cy = y + el.offsetHeight * scaleY / 2;
    tmpCtx.save();
    tmpCtx.translate(cx, cy);
    tmpCtx.rotate(rotation * Math.PI / 180);
    tmpCtx.translate(-cx, -cy);
    tmpCtx.font = `${isItalic}${isBold}${fontSize}px ${style.fontFamily}`;
    tmpCtx.fillStyle = style.color;
    if (el.dataset.shadow) { tmpCtx.shadowColor = 'rgba(0,0,0,0.8)'; tmpCtx.shadowBlur = 10; }
    if (el.dataset.stroke) { tmpCtx.strokeStyle = 'rgba(0,0,0,0.6)'; tmpCtx.lineWidth = fontSize * 0.04; tmpCtx.strokeText(text, x + 4, y + fontSize); }
    tmpCtx.fillText(text, x + 4, y + fontSize);
    tmpCtx.shadowBlur = 0; tmpCtx.lineWidth = 1;
    tmpCtx.restore();
  });

  const dataUrl = baseCanvas.toDataURL('image/png');

  // 3. Save to history
  const entry = { id: Date.now(), dataUrl, date: new Date().toLocaleString('zh-CN') };
  history.unshift(entry);
  if (history.length > 50) history.pop();
  localStorage.setItem('photocraft_history', JSON.stringify(history));

  // 4. Trigger download
  triggerDownload(dataUrl, `photocraft-${Date.now()}.png`);

  isDirty = false;
  showToast('图片已保存', 'success');
}

function triggerDownload(dataUrl, filename) {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  if (isMobile) {
    // Show in-page modal — no popup blocker issues
    const modal = document.getElementById('saveModal');
    const img = document.getElementById('saveModalImg');
    const link = document.getElementById('saveModalLink');
    const hint = document.getElementById('saveModalHint');
    img.src = dataUrl;
    link.href = dataUrl;
    link.download = filename;
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    hint.textContent = isIOS
      ? '长按图片 → 存储到相册，或点击下载按钮保存到文件'
      : '点击下载按钮保存图片，或长按图片另存为';
    modal.classList.add('active');
  } else {
    const a = document.createElement('a');
    a.href = dataUrl; a.download = filename; a.click();
  }
}

function closeSaveModal() {
  document.getElementById('saveModal').classList.remove('active');
}

// ── Reload Image ──
function reloadImage() {
  if (isDirty && originalImage) {
    const choice = confirm('当前编辑尚未保存，是否先保存再换图？\n\n点击「确定」保存并换图，点击「取消」直接换图不保存。');
    if (choice) {
      saveImage();
      // slight delay to let save complete before reload
      setTimeout(() => document.getElementById('reloadInput').click(), 300);
      return;
    }
  }
  document.getElementById('reloadInput').click();
}

function setupReloadInput() {
  document.getElementById('reloadInput').addEventListener('change', e => {
    if (!e.target.files[0]) return;
    currentFilter = 'none';
    overlayLayer.innerHTML = '';
    undoStack = [];
    isDirty = false;
    sourceImage = null;
    ['brightness','contrast','shadows','highlights','vibrance','saturation'].forEach(id => {
      document.getElementById(id).value = 0;
      document.getElementById('val-' + id).textContent = '0';
    });
    document.querySelectorAll('.filter-item').forEach((el, i) => el.classList.toggle('active', i === 0));
    loadImage(e.target.files[0]);
    e.target.value = '';
  });
}

// ── Auto Adjust ──
function autoAdjust() {
  if (!originalImage) return;
  pushUndo();
  const sampleCanvas = document.createElement('canvas');
  sampleCanvas.width = 100; sampleCanvas.height = 100;
  const sCtx = sampleCanvas.getContext('2d');
  sCtx.drawImage(originalImage, 0, 0, 100, 100);
  const data = sCtx.getImageData(0, 0, 100, 100).data;
  let rSum = 0, gSum = 0, bSum = 0, count = 0, minL = 255, maxL = 0;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i+1], b = data[i+2];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    rSum += r; gSum += g; bSum += b;
    if (lum < minL) minL = lum;
    if (lum > maxL) maxL = lum;
    count++;
  }
  const avgR = rSum/count, avgG = gSum/count, avgB = bSum/count;
  const avgLum = 0.299*avgR + 0.587*avgG + 0.114*avgB;
  const dynamicRange = maxL - minL;
  const colorfulness = Math.abs(avgR-avgG) + Math.abs(avgG-avgB) + Math.abs(avgR-avgB);
  animateSlider('brightness', Math.round(Math.max(-50, Math.min(50, (128-avgLum)*0.4))));
  animateSlider('contrast', Math.round(Math.max(-20, Math.min(60, (180-dynamicRange)*0.3))));
  animateSlider('saturation', Math.round(Math.max(-10, Math.min(40, (60-colorfulness)*0.3))));
  animateSlider('shadows', minL < 30 ? Math.round((30-minL)*0.5) : 0);
  animateSlider('highlights', maxL > 240 ? Math.round((240-maxL)*0.5) : 0);
  animateSlider('vibrance', Math.round(Math.max(-10, Math.min(20, (60-colorfulness)*0.15))));
  showToast('自动调节完成', 'success');
}

function animateSlider(id, target) {
  const el = document.getElementById(id);
  const start = +el.value, diff = target - start;
  if (diff === 0) return;
  const steps = 20; let step = 0;
  const timer = setInterval(() => {
    step++;
    el.value = Math.round(start + diff * (step / steps));
    document.getElementById('val-' + id).textContent = el.value;
    drawImage();
    if (step >= steps) clearInterval(timer);
  }, 16);
}

// ── History ──
function renderHistory() {
  const grid = document.getElementById('historyGrid');
  if (!history.length) { grid.innerHTML = '<div class="history-empty">暂无历史记录</div>'; return; }
  grid.innerHTML = history.map(h => `
    <div class="history-card">
      <img src="${h.dataUrl}" alt="历史图片" onclick="previewHistory('${h.id}')" />
      <div class="history-card-info">
        <div class="history-card-date">${h.date}</div>
        <div class="history-card-actions">
          <button onclick="previewHistory('${h.id}')">查看</button>
          <button onclick="downloadHistory('${h.id}')">下载</button>
          <button onclick="deleteHistory('${h.id}')">删除</button>
        </div>
      </div>
    </div>
  `).join('');
}

function previewHistory(id) {
  const h = history.find(x => x.id == id);
  if (!h) return;
  let lb = document.getElementById('historyLightbox');
  if (!lb) {
    lb = document.createElement('div');
    lb.id = 'historyLightbox';
    lb.className = 'lightbox';
    lb.innerHTML = `
      <div class="lightbox-backdrop" onclick="closeLightbox()"></div>
      <div class="lightbox-content">
        <img id="lightboxImg" src="" alt="预览" />
        <div class="lightbox-meta">
          <span id="lightboxDate"></span>
          <div class="lightbox-actions">
            <button class="btn-primary" onclick="downloadHistory(currentLightboxId)">下载</button>
            <button class="btn-ghost" onclick="closeLightbox()">关闭</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(lb);
  }
  window.currentLightboxId = id;
  document.getElementById('lightboxImg').src = h.dataUrl;
  document.getElementById('lightboxDate').textContent = h.date;
  lb.classList.add('active');
}

function closeLightbox() {
  const lb = document.getElementById('historyLightbox');
  if (lb) lb.classList.remove('active');
}

function downloadHistory(id) {
  const h = history.find(x => x.id == id);
  if (!h) return;
  triggerDownload(h.dataUrl, `photocraft-${id}.png`);
}

function deleteHistory(id) {
  if (!confirm('确定要删除这张历史记录吗？')) return;
  history = history.filter(x => x.id != id);
  localStorage.setItem('photocraft_history', JSON.stringify(history));
  renderHistory();
}

function clearHistory() {
  if (!confirm('确定清空所有历史记录？')) return;
  history = []; localStorage.removeItem('photocraft_history'); renderHistory();
}

// ── Toast ──
function showToast(msg, type = '') {
  let toast = document.querySelector('.toast');
  if (!toast) { toast = document.createElement('div'); toast.className = 'toast'; document.body.appendChild(toast); }
  toast.textContent = msg;
  toast.className = 'toast' + (type ? ' ' + type : '');
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

// ── Touch: crop drag/resize ──
function addCropTouchSupport() {
  const box = document.getElementById('cropBox');
  if (!box || box._touchBound) return;
  box._touchBound = true;

  box.addEventListener('touchstart', e => {
    e.preventDefault();
    const t = e.touches[0];
    if (e.target.dataset.handle) { isResizingCrop = true; activeHandle = e.target.dataset.handle; }
    else { isDraggingCrop = true; }
    const rect = canvas.getBoundingClientRect();
    dragOffsetX = (t.clientX - rect.left) * (canvas.width / rect.width) - cropRect.x;
    dragOffsetY = (t.clientY - rect.top) * (canvas.height / rect.height) - cropRect.y;
  }, { passive: false });

  document.addEventListener('touchmove', e => {
    if (!isDraggingCrop && !isResizingCrop) return;
    e.preventDefault();
    const t = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mx = (t.clientX - rect.left) * scaleX;
    const my = (t.clientY - rect.top) * scaleY;
    if (isDraggingCrop) {
      cropRect.x = Math.max(0, Math.min(canvas.width - cropRect.w, mx - dragOffsetX));
      cropRect.y = Math.max(0, Math.min(canvas.height - cropRect.h, my - dragOffsetY));
    } else if (isResizingCrop) {
      if (activeHandle === 'br') {
        cropRect.w = Math.max(40, Math.min(canvas.width - cropRect.x, mx - cropRect.x));
        cropRect.h = Math.max(40, Math.min(canvas.height - cropRect.y, my - cropRect.y));
      } else if (activeHandle === 'tl') {
        const nx = Math.max(0, Math.min(mx, cropRect.x + cropRect.w - 40));
        const ny = Math.max(0, Math.min(my, cropRect.y + cropRect.h - 40));
        cropRect.w += cropRect.x - nx; cropRect.h += cropRect.y - ny;
        cropRect.x = nx; cropRect.y = ny;
      } else if (activeHandle === 'tr') {
        cropRect.w = Math.max(40, Math.min(canvas.width - cropRect.x, mx - cropRect.x));
        const ny = Math.max(0, Math.min(my, cropRect.y + cropRect.h - 40));
        cropRect.h += cropRect.y - ny; cropRect.y = ny;
      } else if (activeHandle === 'bl') {
        const nx = Math.max(0, Math.min(mx, cropRect.x + cropRect.w - 40));
        cropRect.w += cropRect.x - nx; cropRect.x = nx;
        cropRect.h = Math.max(40, Math.min(canvas.height - cropRect.y, my - cropRect.y));
      }
    }
    updateCropBox();
  }, { passive: false });

  document.addEventListener('touchend', () => {
    isDraggingCrop = false; isResizingCrop = false; activeHandle = null;
  });
}

// Patch toggleCrop to wire touch support when crop opens
const _basToggleCrop = toggleCrop;
window.toggleCrop = function() {
  _basToggleCrop();
  if (cropMode) addCropTouchSupport();
};

// Touch support for sliders
document.addEventListener('DOMContentLoaded', () => {
  ['brightness','contrast','shadows','highlights','vibrance','saturation'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('touchstart', () => onSliderMouseDown(), { passive: true });
  });
});

