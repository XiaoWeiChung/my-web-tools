/* ======================================================================
   椰子英语乐园 · 图标库 (icons.js)
   可爱卡通风内联 SVG 插画（非 emoji，矢量高清，可任意放大不失真）。
   getIcon(key) 返回一段 SVG 字符串；找不到时返回一个友好的占位图标。
   日后若要换成位图/AI 插画，只需改写这里，不动 data.js 与 app.js。
   ====================================================================== */
(function (global) {
  'use strict';

  // 统一画布 100x100，圆润描边，明亮配色的可爱风
  function svg(inner) {
    return '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" ' +
      'class="ce-svg" stroke-linecap="round" stroke-linejoin="round">' + inner + '</svg>';
  }

  var ICONS = {};

  /* ---- 颜色：一滴可爱的颜料 ---- */
  var COLOR_HEX = {
    color_red: '#ff6b6b', color_yellow: '#ffd93d', color_blue: '#4dabf7',
    color_green: '#69db7c', color_purple: '#b197fc', color_orange: '#ffa94d',
    color_pink: '#ffa6d5', color_brown: '#a97142', color_black: '#495057',
    color_white: '#f1f3f5', color_gray: '#adb5bd'
  };
  Object.keys(COLOR_HEX).forEach(function (k) {
    var c = COLOR_HEX[k];
    ICONS[k] = svg(
      '<path d="M50 12 C66 38 80 54 80 68 a30 30 0 0 1-60 0 C20 54 34 38 50 12 Z" ' +
      'fill="' + c + '" stroke="#5b4636" stroke-width="3"/>' +
      '<ellipse cx="40" cy="58" rx="7" ry="10" fill="#ffffff" opacity="0.5"/>'
    );
  });

  /* ---- 数字 1-20：彩色圆底 + 数字 ---- */
  var NUM_PALETTE = ['#ff8787', '#ffd43b', '#69db7c', '#4dabf7', '#b197fc', '#ffa94d'];
  for (var ni = 1; ni <= 20; ni++) {
    (function (n) {
      var c = NUM_PALETTE[(n - 1) % NUM_PALETTE.length];
      var fs = n >= 10 ? 36 : 48; // 两位数字缩小字号以适配圆形
      ICONS['num_' + n] = svg(
        '<circle cx="50" cy="50" r="38" fill="' + c + '" stroke="#5b4636" stroke-width="3"/>' +
        '<text x="50" y="' + (n >= 10 ? 63 : 68) + '" text-anchor="middle" font-size="' + fs + '" font-weight="800" ' +
        'font-family="Comic Sans MS, Arial, sans-serif" fill="#fff">' + n + '</text>'
      );
    })(ni);
  }

  function add(key, inner) { ICONS[key] = svg(inner); }

  global.CE_ICONS = ICONS;
  global.__ceAddIcon = add;

  global.getIcon = function (key) {
    if (key && ICONS[key]) return ICONS[key];
    // 占位：一个可爱的小问号星星
    return svg(
      '<circle cx="50" cy="50" r="38" fill="#ffe8a3" stroke="#5b4636" stroke-width="3"/>' +
      '<text x="50" y="66" text-anchor="middle" font-size="42" font-weight="800" fill="#5b4636">?</text>'
    );
  };
})(typeof window !== 'undefined' ? window : this);

/* ---------------- 手绘卡通图标：动物 ---------------- */
(function (A) {
  // 猫
  A('cat',
    '<ellipse cx="50" cy="58" rx="30" ry="28" fill="#ffd8a8" stroke="#5b4636" stroke-width="3"/>' +
    '<path d="M26 38 L20 18 L40 30 Z" fill="#ffd8a8" stroke="#5b4636" stroke-width="3"/>' +
    '<path d="M74 38 L80 18 L60 30 Z" fill="#ffd8a8" stroke="#5b4636" stroke-width="3"/>' +
    '<circle cx="40" cy="54" r="4" fill="#5b4636"/><circle cx="60" cy="54" r="4" fill="#5b4636"/>' +
    '<path d="M46 64 q4 5 8 0" fill="none" stroke="#5b4636" stroke-width="3"/>' +
    '<path d="M30 60 H18 M30 66 H18 M70 60 H82 M70 66 H82" stroke="#5b4636" stroke-width="2"/>');
  // 狗
  A('dog',
    '<ellipse cx="50" cy="58" rx="28" ry="26" fill="#e8c4a0" stroke="#5b4636" stroke-width="3"/>' +
    '<ellipse cx="24" cy="50" rx="9" ry="18" fill="#b07d52" stroke="#5b4636" stroke-width="3"/>' +
    '<ellipse cx="76" cy="50" rx="9" ry="18" fill="#b07d52" stroke="#5b4636" stroke-width="3"/>' +
    '<circle cx="41" cy="54" r="4" fill="#5b4636"/><circle cx="59" cy="54" r="4" fill="#5b4636"/>' +
    '<ellipse cx="50" cy="64" rx="6" ry="4" fill="#5b4636"/>' +
    '<path d="M50 68 V74 M50 74 q-6 2-8-2 M50 74 q6 2 8-2" fill="none" stroke="#5b4636" stroke-width="3"/>');
  // 兔子
  A('rabbit',
    '<ellipse cx="50" cy="62" rx="26" ry="24" fill="#fff" stroke="#5b4636" stroke-width="3"/>' +
    '<ellipse cx="40" cy="28" rx="7" ry="20" fill="#fff" stroke="#5b4636" stroke-width="3"/>' +
    '<ellipse cx="60" cy="28" rx="7" ry="20" fill="#fff" stroke="#5b4636" stroke-width="3"/>' +
    '<ellipse cx="40" cy="28" rx="3" ry="12" fill="#ffc9c9"/><ellipse cx="60" cy="28" rx="3" ry="12" fill="#ffc9c9"/>' +
    '<circle cx="42" cy="60" r="3.5" fill="#5b4636"/><circle cx="58" cy="60" r="3.5" fill="#5b4636"/>' +
    '<path d="M50 66 v4 M44 70 q6 4 12 0" fill="none" stroke="#5b4636" stroke-width="2.5"/>' +
    '<circle cx="50" cy="67" r="3" fill="#ffc9c9"/>');
  // 熊
  A('bear',
    '<circle cx="30" cy="34" r="11" fill="#b07d52" stroke="#5b4636" stroke-width="3"/>' +
    '<circle cx="70" cy="34" r="11" fill="#b07d52" stroke="#5b4636" stroke-width="3"/>' +
    '<circle cx="50" cy="58" r="30" fill="#c69968" stroke="#5b4636" stroke-width="3"/>' +
    '<circle cx="40" cy="54" r="4" fill="#5b4636"/><circle cx="60" cy="54" r="4" fill="#5b4636"/>' +
    '<ellipse cx="50" cy="66" rx="11" ry="9" fill="#f1d9bf"/>' +
    '<ellipse cx="50" cy="64" rx="5" ry="3.5" fill="#5b4636"/>' +
    '<path d="M50 67 v4" stroke="#5b4636" stroke-width="2.5"/>');
})(window.__ceAddIcon);

/* ---------------- 手绘卡通图标：更多动物 ---------------- */
(function (A) {
  // 鱼
  A('fish',
    '<path d="M62 50 q-20-22-44 0 q24 22 44 0 Z" fill="#4dabf7" stroke="#5b4636" stroke-width="3"/>' +
    '<path d="M62 50 L84 36 V64 Z" fill="#74c0fc" stroke="#5b4636" stroke-width="3"/>' +
    '<circle cx="32" cy="46" r="3.5" fill="#5b4636"/>' +
    '<path d="M40 50 q6-6 12 0" fill="none" stroke="#fff" stroke-width="2.5" opacity="0.7"/>');
  // 鸟
  A('bird',
    '<circle cx="50" cy="52" r="26" fill="#ffd43b" stroke="#5b4636" stroke-width="3"/>' +
    '<circle cx="58" cy="46" r="4" fill="#5b4636"/>' +
    '<path d="M72 52 L86 48 L74 58 Z" fill="#ffa94d" stroke="#5b4636" stroke-width="2.5"/>' +
    '<path d="M44 56 q-16 4-22 16 q18 0 26-10" fill="#fcc419" stroke="#5b4636" stroke-width="3"/>' +
    '<path d="M36 78 l-4 8 M46 80 l-2 8" stroke="#ffa94d" stroke-width="3"/>');
  // 猪
  A('pig',
    '<circle cx="50" cy="56" r="30" fill="#ffc9d6" stroke="#5b4636" stroke-width="3"/>' +
    '<path d="M30 34 L26 22 L40 30 Z" fill="#ffc9d6" stroke="#5b4636" stroke-width="3"/>' +
    '<path d="M70 34 L74 22 L60 30 Z" fill="#ffc9d6" stroke="#5b4636" stroke-width="3"/>' +
    '<circle cx="41" cy="52" r="3.5" fill="#5b4636"/><circle cx="59" cy="52" r="3.5" fill="#5b4636"/>' +
    '<ellipse cx="50" cy="64" rx="12" ry="9" fill="#ff9ebb" stroke="#5b4636" stroke-width="2.5"/>' +
    '<circle cx="46" cy="64" r="2.5" fill="#5b4636"/><circle cx="54" cy="64" r="2.5" fill="#5b4636"/>');
  // 狮子
  A('lion',
    '<circle cx="50" cy="52" r="34" fill="#ffa94d" stroke="#5b4636" stroke-width="3"/>' +
    '<circle cx="50" cy="54" r="24" fill="#ffd8a8" stroke="#5b4636" stroke-width="3"/>' +
    '<circle cx="42" cy="50" r="3.5" fill="#5b4636"/><circle cx="58" cy="50" r="3.5" fill="#5b4636"/>' +
    '<path d="M44 60 q6 6 12 0" fill="none" stroke="#5b4636" stroke-width="2.5"/>' +
    '<ellipse cx="50" cy="58" rx="4" ry="3" fill="#5b4636"/>');
  // 斑马
  A('zebra',
    '<ellipse cx="50" cy="58" rx="26" ry="26" fill="#fff" stroke="#5b4636" stroke-width="3"/>' +
    '<path d="M40 34 L36 22 L46 32 Z M60 34 L64 22 L54 32 Z" fill="#fff" stroke="#5b4636" stroke-width="3"/>' +
    '<path d="M38 40 V52 M50 36 V54 M62 40 V52" stroke="#5b4636" stroke-width="4"/>' +
    '<circle cx="42" cy="62" r="3.5" fill="#5b4636"/><circle cx="58" cy="62" r="3.5" fill="#5b4636"/>' +
    '<ellipse cx="50" cy="72" rx="6" ry="4" fill="#5b4636"/>');
})(window.__ceAddIcon);

/* ---------------- 手绘卡通图标：水果 ---------------- */
(function (A) {
  A('apple',
    '<path d="M50 28 C40 18 22 22 24 42 C26 64 40 80 50 80 C60 80 74 64 76 42 C78 22 60 18 50 28 Z" ' +
    'fill="#ff6b6b" stroke="#5b4636" stroke-width="3"/>' +
    '<path d="M50 28 V16" stroke="#7a4f2a" stroke-width="4"/>' +
    '<path d="M50 20 q10-8 16-2 q-8 8-16 2" fill="#69db7c" stroke="#5b4636" stroke-width="2.5"/>' +
    '<ellipse cx="38" cy="42" rx="6" ry="9" fill="#fff" opacity="0.5"/>');
  A('banana',
    '<path d="M24 38 q4 36 44 40 q12-2 14-8 q-30 4-44-34 Z" fill="#ffd43b" stroke="#5b4636" stroke-width="3"/>' +
    '<path d="M24 38 q-3-4 0-8" stroke="#5b4636" stroke-width="3" fill="none"/>' +
    '<path d="M82 70 q3 3 0 6" stroke="#5b4636" stroke-width="3" fill="none"/>');
  A('grape',
    '<g fill="#b197fc" stroke="#5b4636" stroke-width="2.5">' +
    '<circle cx="50" cy="36" r="9"/><circle cx="38" cy="50" r="9"/><circle cx="62" cy="50" r="9"/>' +
    '<circle cx="50" cy="62" r="9"/><circle cx="34" cy="68" r="9"/><circle cx="66" cy="68" r="9"/>' +
    '<circle cx="50" cy="80" r="9"/></g>' +
    '<path d="M50 27 V16" stroke="#7a4f2a" stroke-width="4"/>' +
    '<path d="M50 18 q10-6 14 0" fill="#69db7c" stroke="#5b4636" stroke-width="2.5"/>');
  A('orange',
    '<circle cx="50" cy="54" r="32" fill="#ffa94d" stroke="#5b4636" stroke-width="3"/>' +
    '<path d="M50 22 q6 0 6 6 q-6 2-6-6" fill="#69db7c" stroke="#5b4636" stroke-width="2"/>' +
    '<ellipse cx="40" cy="44" rx="7" ry="10" fill="#fff" opacity="0.4"/>');
  A('strawberry',
    '<path d="M50 84 C30 80 22 58 26 44 C32 32 68 32 74 44 C78 58 70 80 50 84 Z" ' +
    'fill="#ff6b6b" stroke="#5b4636" stroke-width="3"/>' +
    '<path d="M30 40 q20-12 40 0 q-8-16-20-16 q-12 0-20 16 Z" fill="#69db7c" stroke="#5b4636" stroke-width="2.5"/>' +
    '<g fill="#fff"><circle cx="42" cy="54" r="2"/><circle cx="56" cy="54" r="2"/>' +
    '<circle cx="49" cy="64" r="2"/><circle cx="36" cy="64" r="2"/><circle cx="62" cy="64" r="2"/></g>');
  A('watermelon',
    '<path d="M16 38 a34 34 0 0 0 68 0 Z" fill="#ff8787" stroke="#5b4636" stroke-width="3"/>' +
    '<path d="M16 38 a34 34 0 0 0 68 0" fill="none" stroke="#69db7c" stroke-width="6"/>' +
    '<g fill="#5b4636"><circle cx="40" cy="50" r="2.5"/><circle cx="52" cy="56" r="2.5"/>' +
    '<circle cx="62" cy="48" r="2.5"/><circle cx="48" cy="46" r="2.5"/></g>');
})(window.__ceAddIcon);

/* ---------------- 手绘卡通图标：物品 A-Z 配套 ---------------- */
(function (A) {
  A('egg',
    '<path d="M50 18 C34 18 26 50 30 66 a20 20 0 0 0 40 0 C74 50 66 18 50 18 Z" ' +
    'fill="#fff7e6" stroke="#5b4636" stroke-width="3"/>' +
    '<ellipse cx="42" cy="46" rx="5" ry="8" fill="#fff" opacity="0.6"/>');
  A('hat',
    '<path d="M30 60 q20-44 40 0 Z" fill="#4dabf7" stroke="#5b4636" stroke-width="3"/>' +
    '<rect x="18" y="60" width="64" height="10" rx="5" fill="#74c0fc" stroke="#5b4636" stroke-width="3"/>' +
    '<circle cx="50" cy="22" r="5" fill="#ffd43b" stroke="#5b4636" stroke-width="2.5"/>');
  A('icecream',
    '<path d="M36 44 h28 L50 86 Z" fill="#ffe08a" stroke="#5b4636" stroke-width="3"/>' +
    '<path d="M40 52 h20 M44 62 h12" stroke="#5b4636" stroke-width="2"/>' +
    '<circle cx="40" cy="38" r="12" fill="#ff9ebb" stroke="#5b4636" stroke-width="3"/>' +
    '<circle cx="60" cy="38" r="12" fill="#74c0fc" stroke="#5b4636" stroke-width="3"/>' +
    '<circle cx="50" cy="30" r="12" fill="#ffd43b" stroke="#5b4636" stroke-width="3"/>');
  A('juice',
    '<path d="M34 34 h32 l-4 48 a4 4 0 0 1-4 4 h-16 a4 4 0 0 1-4-4 Z" fill="#ffa94d" stroke="#5b4636" stroke-width="3"/>' +
    '<rect x="30" y="28" width="40" height="8" rx="4" fill="#ffd8a8" stroke="#5b4636" stroke-width="2.5"/>' +
    '<path d="M58 28 L70 12" stroke="#ff6b6b" stroke-width="4"/>');
  A('kite',
    '<path d="M50 16 L74 44 L50 84 L26 44 Z" fill="#ff8787" stroke="#5b4636" stroke-width="3"/>' +
    '<path d="M50 16 V84 M26 44 H74" stroke="#5b4636" stroke-width="2.5"/>' +
    '<path d="M50 84 q6 8 0 14 q-6-6 0-14" fill="#ffd43b" stroke="#5b4636" stroke-width="2"/>');
  A('moon',
    '<path d="M62 20 a34 34 0 1 0 18 52 A28 28 0 0 1 62 20 Z" fill="#ffe08a" stroke="#5b4636" stroke-width="3"/>' +
    '<circle cx="44" cy="40" r="3" fill="#e8c46a"/><circle cx="40" cy="58" r="4" fill="#e8c46a"/>');
  A('crown',
    '<path d="M22 70 L28 38 L42 56 L50 32 L58 56 L72 38 L78 70 Z" fill="#ffd43b" stroke="#5b4636" stroke-width="3"/>' +
    '<rect x="22" y="70" width="56" height="10" rx="3" fill="#ffc078" stroke="#5b4636" stroke-width="3"/>' +
    '<circle cx="50" cy="30" r="4" fill="#ff6b6b" stroke="#5b4636" stroke-width="2"/>');
  A('sun',
    '<circle cx="50" cy="50" r="22" fill="#ffd43b" stroke="#5b4636" stroke-width="3"/>' +
    '<g stroke="#ffa94d" stroke-width="5"><path d="M50 12 V24 M50 76 V88 M12 50 H24 M76 50 H88"/>' +
    '<path d="M24 24 L32 32 M76 24 L68 32 M24 76 L32 68 M76 76 L68 68"/></g>' +
    '<circle cx="43" cy="48" r="3" fill="#5b4636"/><circle cx="57" cy="48" r="3" fill="#5b4636"/>' +
    '<path d="M44 56 q6 5 12 0" fill="none" stroke="#5b4636" stroke-width="2.5"/>');
  A('tree',
    '<rect x="44" y="56" width="12" height="28" rx="3" fill="#b07d52" stroke="#5b4636" stroke-width="3"/>' +
    '<circle cx="50" cy="40" r="22" fill="#69db7c" stroke="#5b4636" stroke-width="3"/>' +
    '<circle cx="34" cy="48" r="13" fill="#69db7c" stroke="#5b4636" stroke-width="3"/>' +
    '<circle cx="66" cy="48" r="13" fill="#69db7c" stroke="#5b4636" stroke-width="3"/>');
  A('umbrella',
    '<path d="M16 50 a34 30 0 0 1 68 0 Z" fill="#ff6b6b" stroke="#5b4636" stroke-width="3"/>' +
    '<path d="M16 50 q9-8 17 0 q9-8 17 0 q9-8 17 0 q9-8 17 0" fill="none" stroke="#5b4636" stroke-width="2.5"/>' +
    '<path d="M50 50 V80 a8 8 0 0 1-14 4" fill="none" stroke="#5b4636" stroke-width="3"/>');
  A('van',
    '<rect x="14" y="44" width="56" height="26" rx="6" fill="#4dabf7" stroke="#5b4636" stroke-width="3"/>' +
    '<path d="M70 52 h12 l4 10 v8 H70 Z" fill="#74c0fc" stroke="#5b4636" stroke-width="3"/>' +
    '<circle cx="32" cy="74" r="8" fill="#5b4636"/><circle cx="72" cy="74" r="8" fill="#5b4636"/>' +
    '<circle cx="32" cy="74" r="3" fill="#fff"/><circle cx="72" cy="74" r="3" fill="#fff"/>');
  A('box',
    '<path d="M22 40 L50 30 L78 40 L50 50 Z" fill="#ffc078" stroke="#5b4636" stroke-width="3"/>' +
    '<path d="M22 40 V72 L50 82 V50 Z" fill="#ffa94d" stroke="#5b4636" stroke-width="3"/>' +
    '<path d="M78 40 V72 L50 82 V50 Z" fill="#ffd8a8" stroke="#5b4636" stroke-width="3"/>');
})(window.__ceAddIcon);

/* ---------------- 手绘卡通图标：界面装饰 ---------------- */
(function (A) {
  // ABC 积木
  A('abc',
    '<rect x="14" y="44" width="34" height="34" rx="6" fill="#ff8787" stroke="#5b4636" stroke-width="3"/>' +
    '<rect x="52" y="44" width="34" height="34" rx="6" fill="#4dabf7" stroke="#5b4636" stroke-width="3"/>' +
    '<rect x="33" y="20" width="34" height="34" rx="6" fill="#ffd43b" stroke="#5b4636" stroke-width="3"/>' +
    '<text x="31" y="70" text-anchor="middle" font-size="22" font-weight="800" fill="#fff">A</text>' +
    '<text x="69" y="70" text-anchor="middle" font-size="22" font-weight="800" fill="#fff">C</text>' +
    '<text x="50" y="46" text-anchor="middle" font-size="22" font-weight="800" fill="#fff">B</text>');
  // 游戏手柄
  A('game',
    '<rect x="16" y="40" width="68" height="34" rx="17" fill="#b197fc" stroke="#5b4636" stroke-width="3"/>' +
    '<path d="M30 50 v12 M24 56 h12" stroke="#fff" stroke-width="4"/>' +
    '<circle cx="66" cy="52" r="4" fill="#ffd43b"/><circle cx="74" cy="62" r="4" fill="#ff8787"/>');
  // 休息：闭眼月亮 + 星星
  A('rest',
    '<circle cx="50" cy="50" r="34" fill="#ffe08a" stroke="#5b4636" stroke-width="3"/>' +
    '<path d="M34 48 q6-6 12 0 M54 48 q6-6 12 0" fill="none" stroke="#5b4636" stroke-width="3"/>' +
    '<path d="M40 62 q10 8 20 0" fill="none" stroke="#5b4636" stroke-width="3"/>' +
    '<text x="74" y="30" font-size="18" fill="#ffa94d">z</text>' +
    '<text x="82" y="20" font-size="13" fill="#ffa94d">z</text>');
})(window.__ceAddIcon);

/* ---------------- 扩充：更多动物 ---------------- */
(function (A) {
  A('duck',
    '<ellipse cx="46" cy="60" rx="26" ry="22" fill="#ffd43b" stroke="#5b4636" stroke-width="3"/>' +
    '<circle cx="66" cy="42" r="14" fill="#ffd43b" stroke="#5b4636" stroke-width="3"/>' +
    '<circle cx="70" cy="40" r="3" fill="#5b4636"/>' +
    '<path d="M78 44 L92 46 L78 52 Z" fill="#ffa94d" stroke="#5b4636" stroke-width="2.5"/>' +
    '<path d="M24 64 q-8 4-10 12" fill="#fcc419" stroke="#5b4636" stroke-width="3"/>');
  A('frog',
    '<circle cx="32" cy="32" r="11" fill="#69db7c" stroke="#5b4636" stroke-width="3"/>' +
    '<circle cx="68" cy="32" r="11" fill="#69db7c" stroke="#5b4636" stroke-width="3"/>' +
    '<circle cx="32" cy="30" r="4" fill="#5b4636"/><circle cx="68" cy="30" r="4" fill="#5b4636"/>' +
    '<path d="M22 50 a28 24 0 0 0 56 0 Z" fill="#8ce99a" stroke="#5b4636" stroke-width="3"/>' +
    '<path d="M36 64 q14 10 28 0" fill="none" stroke="#5b4636" stroke-width="3"/>');
  A('elephant',
    '<circle cx="46" cy="50" r="30" fill="#adb5bd" stroke="#5b4636" stroke-width="3"/>' +
    '<path d="M40 70 q-6 18 6 22 q6-2 4-10" fill="#adb5bd" stroke="#5b4636" stroke-width="3"/>' +
    '<ellipse cx="22" cy="44" rx="14" ry="18" fill="#ced4da" stroke="#5b4636" stroke-width="3"/>' +
    '<circle cx="50" cy="44" r="3.5" fill="#5b4636"/>' +
    '<circle cx="64" cy="40" r="3.5" fill="#5b4636"/>');
  A('monkey',
    '<circle cx="50" cy="54" r="28" fill="#b07d52" stroke="#5b4636" stroke-width="3"/>' +
    '<circle cx="24" cy="44" r="10" fill="#b07d52" stroke="#5b4636" stroke-width="3"/>' +
    '<circle cx="76" cy="44" r="10" fill="#b07d52" stroke="#5b4636" stroke-width="3"/>' +
    '<ellipse cx="50" cy="60" rx="18" ry="15" fill="#f1d9bf"/>' +
    '<circle cx="42" cy="50" r="3.5" fill="#5b4636"/><circle cx="58" cy="50" r="3.5" fill="#5b4636"/>' +
    '<path d="M44 64 q6 5 12 0" fill="none" stroke="#5b4636" stroke-width="2.5"/>');
  A('tiger',
    '<circle cx="50" cy="54" r="30" fill="#ffa94d" stroke="#5b4636" stroke-width="3"/>' +
    '<circle cx="30" cy="34" r="9" fill="#ffa94d" stroke="#5b4636" stroke-width="3"/>' +
    '<circle cx="70" cy="34" r="9" fill="#ffa94d" stroke="#5b4636" stroke-width="3"/>' +
    '<path d="M38 34 v10 M50 30 v12 M62 34 v10" stroke="#5b4636" stroke-width="3"/>' +
    '<circle cx="42" cy="52" r="3.5" fill="#5b4636"/><circle cx="58" cy="52" r="3.5" fill="#5b4636"/>' +
    '<ellipse cx="50" cy="62" rx="6" ry="4" fill="#5b4636"/>');
})(window.__ceAddIcon);

/* ---------------- 扩充：更多水果 ---------------- */
(function (A) {
  A('pear',
    '<path d="M50 24 C44 24 44 34 46 40 C34 46 32 70 50 82 C68 70 66 46 54 40 C56 34 56 24 50 24 Z" ' +
    'fill="#a9e34b" stroke="#5b4636" stroke-width="3"/>' +
    '<path d="M50 24 V16" stroke="#7a4f2a" stroke-width="4"/>' +
    '<ellipse cx="42" cy="60" rx="5" ry="8" fill="#fff" opacity="0.5"/>');
  A('cherry',
    '<path d="M50 22 q-18 14-26 28 M50 22 q14 16 18 30" fill="none" stroke="#7a4f2a" stroke-width="3"/>' +
    '<circle cx="34" cy="62" r="13" fill="#ff6b6b" stroke="#5b4636" stroke-width="3"/>' +
    '<circle cx="64" cy="64" r="13" fill="#ff6b6b" stroke="#5b4636" stroke-width="3"/>' +
    '<path d="M50 22 q8-4 14 0" fill="#69db7c" stroke="#5b4636" stroke-width="2.5"/>');
  A('peach',
    '<path d="M50 30 q-26-10-26 20 q0 28 26 32 q26-4 26-32 q0-30-26-20 Z" fill="#ffc9d6" stroke="#5b4636" stroke-width="3"/>' +
    '<path d="M50 32 q0 30 0 50" stroke="#ff9ebb" stroke-width="2.5" fill="none"/>' +
    '<path d="M52 30 q8-12 16-10 q-2 10-12 12" fill="#69db7c" stroke="#5b4636" stroke-width="2.5"/>');
  A('lemon',
    '<ellipse cx="50" cy="52" rx="32" ry="24" fill="#ffe066" stroke="#5b4636" stroke-width="3"/>' +
    '<path d="M82 52 q6 0 8 0 M18 52 q-6 0-8 0" stroke="#e8c46a" stroke-width="4"/>' +
    '<ellipse cx="40" cy="44" rx="7" ry="9" fill="#fff" opacity="0.5"/>');
  A('pineapple',
    '<path d="M50 18 q-8 8-4 18 M50 18 q8 8 4 18 M50 14 v14" fill="none" stroke="#69db7c" stroke-width="3"/>' +
    '<ellipse cx="50" cy="56" rx="24" ry="30" fill="#ffd43b" stroke="#5b4636" stroke-width="3"/>' +
    '<path d="M36 40 L64 56 M64 40 L36 56 M34 56 L60 76 M66 56 L42 78" stroke="#e8a317" stroke-width="2.5"/>');
})(window.__ceAddIcon);

/* ---------------- 扩充：交通工具 ---------------- */
(function (A) {
  A('car',
    '<path d="M16 60 L24 44 h52 l8 16 Z" fill="#ff8787" stroke="#5b4636" stroke-width="3"/>' +
    '<rect x="14" y="58" width="72" height="14" rx="6" fill="#ff6b6b" stroke="#5b4636" stroke-width="3"/>' +
    '<path d="M34 46 h14 v10 h-20 Z M52 46 h12 l6 10 h-18 Z" fill="#d3f3ff" stroke="#5b4636" stroke-width="2"/>' +
    '<circle cx="32" cy="74" r="8" fill="#5b4636"/><circle cx="68" cy="74" r="8" fill="#5b4636"/>' +
    '<circle cx="32" cy="74" r="3" fill="#fff"/><circle cx="68" cy="74" r="3" fill="#fff"/>');
  A('bus',
    '<rect x="16" y="30" width="68" height="42" rx="8" fill="#ffd43b" stroke="#5b4636" stroke-width="3"/>' +
    '<rect x="24" y="38" width="16" height="14" rx="3" fill="#d3f3ff" stroke="#5b4636" stroke-width="2"/>' +
    '<rect x="44" y="38" width="16" height="14" rx="3" fill="#d3f3ff" stroke="#5b4636" stroke-width="2"/>' +
    '<rect x="64" y="38" width="12" height="14" rx="3" fill="#d3f3ff" stroke="#5b4636" stroke-width="2"/>' +
    '<circle cx="32" cy="74" r="8" fill="#5b4636"/><circle cx="68" cy="74" r="8" fill="#5b4636"/>');
  A('train',
    '<rect x="22" y="28" width="48" height="44" rx="10" fill="#4dabf7" stroke="#5b4636" stroke-width="3"/>' +
    '<rect x="30" y="36" width="32" height="16" rx="4" fill="#d3f3ff" stroke="#5b4636" stroke-width="2"/>' +
    '<rect x="18" y="68" width="56" height="8" rx="4" fill="#5b4636"/>' +
    '<circle cx="32" cy="80" r="6" fill="#495057"/><circle cx="60" cy="80" r="6" fill="#495057"/>' +
    '<rect x="70" y="20" width="8" height="14" rx="3" fill="#868e96"/>');
  A('plane',
    '<path d="M20 52 L80 44 q8 0 8 4 q0 4-8 4 L20 56 Z" fill="#e9ecef" stroke="#5b4636" stroke-width="3"/>' +
    '<path d="M40 50 L30 28 h8 L54 48 Z" fill="#ced4da" stroke="#5b4636" stroke-width="2.5"/>' +
    '<path d="M40 54 L30 76 h8 L54 56 Z" fill="#ced4da" stroke="#5b4636" stroke-width="2.5"/>' +
    '<circle cx="70" cy="48" r="3" fill="#4dabf7"/>');
  A('boat',
    '<path d="M18 58 h64 l-10 20 a4 4 0 0 1-4 2 H32 a4 4 0 0 1-4-2 Z" fill="#ff8787" stroke="#5b4636" stroke-width="3"/>' +
    '<path d="M50 54 V20 L74 50 Z" fill="#ffd43b" stroke="#5b4636" stroke-width="3"/>' +
    '<path d="M50 54 V24 L30 50 Z" fill="#fff" stroke="#5b4636" stroke-width="2.5"/>');
  A('bike',
    '<circle cx="28" cy="62" r="16" fill="none" stroke="#5b4636" stroke-width="4"/>' +
    '<circle cx="72" cy="62" r="16" fill="none" stroke="#5b4636" stroke-width="4"/>' +
    '<path d="M28 62 L46 40 h16 L72 62 M46 40 L40 62 M62 40 q8 2 10 22" fill="none" stroke="#ff6b6b" stroke-width="3.5"/>' +
    '<path d="M40 38 h12" stroke="#5b4636" stroke-width="3"/>');
})(window.__ceAddIcon);

/* ---------------- 扩充：形状 ---------------- */
(function (A) {
  A('shape_circle', '<circle cx="50" cy="50" r="34" fill="#ff8787" stroke="#5b4636" stroke-width="3"/>');
  A('shape_square', '<rect x="20" y="20" width="60" height="60" rx="8" fill="#4dabf7" stroke="#5b4636" stroke-width="3"/>');
  A('shape_triangle', '<path d="M50 18 L84 80 H16 Z" fill="#69db7c" stroke="#5b4636" stroke-width="3" stroke-linejoin="round"/>');
  A('shape_star',
    '<path d="M50 14 L61 40 L89 42 L67 60 L74 88 L50 72 L26 88 L33 60 L11 42 L39 40 Z" ' +
    'fill="#ffd43b" stroke="#5b4636" stroke-width="3" stroke-linejoin="round"/>');
  A('shape_heart',
    '<path d="M50 82 C20 60 16 36 34 28 C44 24 50 34 50 38 C50 34 56 24 66 28 C84 36 80 60 50 82 Z" ' +
    'fill="#ff6b6b" stroke="#5b4636" stroke-width="3"/>');
  A('shape_diamond', '<path d="M50 16 L82 50 L50 84 L18 50 Z" fill="#b197fc" stroke="#5b4636" stroke-width="3" stroke-linejoin="round"/>');
})(window.__ceAddIcon);

/* ---------------- 扩充：身体 / 家庭 ---------------- */
(function (A) {
  A('hand',
    '<path d="M36 84 V52 q0-6 6-6 q0 0 0-6 V30 q0-6 6-6 q6 0 6 6 v14 q0-6 6-6 q6 0 6 6 v6 q0-6 6-6 q6 0 6 6 v22 q0 12-14 16 H50 q-14-4-14-16 Z" ' +
    'fill="#ffd8a8" stroke="#5b4636" stroke-width="3"/>');
  A('eye',
    '<path d="M14 50 q36-30 72 0 q-36 30-72 0 Z" fill="#fff" stroke="#5b4636" stroke-width="3"/>' +
    '<circle cx="50" cy="50" r="13" fill="#4dabf7" stroke="#5b4636" stroke-width="2.5"/>' +
    '<circle cx="50" cy="50" r="5" fill="#5b4636"/><circle cx="54" cy="46" r="2" fill="#fff"/>');
  A('foot',
    '<path d="M34 76 q-6-30 6-44 q12-12 22-2 q8 8 4 24 q-3 12-4 22 q-1 6-14 6 q-12 0-14-6 Z" ' +
    'fill="#ffd8a8" stroke="#5b4636" stroke-width="3"/>' +
    '<g fill="#ffe8cc" stroke="#5b4636" stroke-width="1.5">' +
    '<circle cx="60" cy="30" r="4"/><circle cx="66" cy="38" r="3.5"/><circle cx="68" cy="47" r="3"/></g>');
  A('mom',
    '<circle cx="50" cy="36" r="18" fill="#ffd8a8" stroke="#5b4636" stroke-width="3"/>' +
    '<path d="M30 34 q4-20 20-20 q16 0 20 20 q-8-6-20-6 q-12 0-20 6 Z" fill="#b07d52" stroke="#5b4636" stroke-width="3"/>' +
    '<circle cx="43" cy="38" r="2.5" fill="#5b4636"/><circle cx="57" cy="38" r="2.5" fill="#5b4636"/>' +
    '<path d="M44 44 q6 4 12 0" fill="none" stroke="#5b4636" stroke-width="2"/>' +
    '<path d="M28 84 q0-22 22-22 q22 0 22 22 Z" fill="#ff9ebb" stroke="#5b4636" stroke-width="3"/>');
  A('dad',
    '<circle cx="50" cy="38" r="18" fill="#ffd8a8" stroke="#5b4636" stroke-width="3"/>' +
    '<path d="M32 30 q2-16 18-16 q16 0 18 16 q-8-4-18-4 q-10 0-18 4 Z" fill="#5b4636"/>' +
    '<circle cx="43" cy="40" r="2.5" fill="#5b4636"/><circle cx="57" cy="40" r="2.5" fill="#5b4636"/>' +
    '<path d="M44 46 q6 4 12 0" fill="none" stroke="#5b4636" stroke-width="2"/>' +
    '<path d="M28 84 q0-22 22-22 q22 0 22 22 Z" fill="#4dabf7" stroke="#5b4636" stroke-width="3"/>');
  A('baby',
    '<circle cx="50" cy="42" r="22" fill="#ffd8a8" stroke="#5b4636" stroke-width="3"/>' +
    '<path d="M40 22 q10-6 20 0" fill="none" stroke="#5b4636" stroke-width="2"/>' +
    '<circle cx="42" cy="44" r="3" fill="#5b4636"/><circle cx="58" cy="44" r="3" fill="#5b4636"/>' +
    '<circle cx="50" cy="52" r="4" fill="#ff9ebb"/>' +
    '<path d="M30 80 q0-16 20-16 q20 0 20 16 Z" fill="#a9e34b" stroke="#5b4636" stroke-width="3"/>');
})(window.__ceAddIcon);

/* ---------------- 扩充：食物 ---------------- */
(function (A) {
  A('bread',
    '<path d="M22 56 q0-26 28-26 q28 0 28 26 v18 a4 4 0 0 1-4 4 H26 a4 4 0 0 1-4-4 Z" ' +
    'fill="#ffd8a8" stroke="#5b4636" stroke-width="3"/>' +
    '<path d="M30 50 q4-10 12-10 M48 46 q4-8 12-6" fill="none" stroke="#e8a317" stroke-width="2.5"/>');
  A('milk',
    '<path d="M34 30 h32 v8 l4 40 a4 4 0 0 1-4 4 H34 a4 4 0 0 1-4-4 l4-40 Z" fill="#fff" stroke="#5b4636" stroke-width="3"/>' +
    '<rect x="34" y="52" width="32" height="20" fill="#d3f3ff" stroke="#5b4636" stroke-width="2.5"/>' +
    '<text x="50" y="68" text-anchor="middle" font-size="14" font-weight="800" fill="#4dabf7">MILK</text>');
  A('cake',
    '<path d="M24 50 h52 v22 a4 4 0 0 1-4 4 H28 a4 4 0 0 1-4-4 Z" fill="#ffc9d6" stroke="#5b4636" stroke-width="3"/>' +
    '<path d="M24 56 q13 8 26 0 q13 8 26 0" fill="none" stroke="#ff9ebb" stroke-width="3"/>' +
    '<rect x="46" y="32" width="8" height="16" fill="#ffd43b" stroke="#5b4636" stroke-width="2"/>' +
    '<path d="M50 26 q4 4 0 6 q-4-2 0-6" fill="#ff6b6b"/>');
  A('cookie',
    '<circle cx="50" cy="52" r="32" fill="#e8b06a" stroke="#5b4636" stroke-width="3"/>' +
    '<g fill="#5b4636"><circle cx="40" cy="42" r="3.5"/><circle cx="60" cy="46" r="3.5"/>' +
    '<circle cx="46" cy="60" r="3.5"/><circle cx="62" cy="62" r="3.5"/><circle cx="36" cy="56" r="3"/></g>');
  A('candy',
    '<circle cx="50" cy="50" r="18" fill="#ff8787" stroke="#5b4636" stroke-width="3"/>' +
    '<path d="M68 50 L86 40 L82 60 Z" fill="#ffd43b" stroke="#5b4636" stroke-width="2.5"/>' +
    '<path d="M32 50 L14 40 L18 60 Z" fill="#ffd43b" stroke="#5b4636" stroke-width="2.5"/>' +
    '<path d="M44 44 q6 6 12 0" fill="none" stroke="#fff" stroke-width="2.5"/>');
  A('egg2',
    '<ellipse cx="50" cy="56" rx="34" ry="24" fill="#fff" stroke="#5b4636" stroke-width="3"/>' +
    '<circle cx="50" cy="56" r="13" fill="#ffd43b" stroke="#5b4636" stroke-width="2.5"/>');
})(window.__ceAddIcon);

/* ---------------- 扩充：自然 / 天气 ---------------- */
(function (A) {
  A('cloud',
    '<path d="M28 66 a16 16 0 0 1 2-32 a20 20 0 0 1 38 4 a14 14 0 0 1 2 28 Z" ' +
    'fill="#e9ecef" stroke="#5b4636" stroke-width="3"/>');
  A('rain',
    '<path d="M28 50 a14 14 0 0 1 2-28 a18 18 0 0 1 34 4 a12 12 0 0 1 2 24 Z" ' +
    'fill="#ced4da" stroke="#5b4636" stroke-width="3"/>' +
    '<path d="M34 60 l-4 12 M50 60 l-4 12 M66 60 l-4 12" stroke="#4dabf7" stroke-width="4"/>');
  A('star',
    '<path d="M50 14 L61 40 L89 42 L67 60 L74 88 L50 72 L26 88 L33 60 L11 42 L39 40 Z" ' +
    'fill="#ffd43b" stroke="#5b4636" stroke-width="3" stroke-linejoin="round"/>' +
    '<circle cx="44" cy="50" r="3" fill="#5b4636"/><circle cx="56" cy="50" r="3" fill="#5b4636"/>' +
    '<path d="M45 58 q5 4 10 0" fill="none" stroke="#5b4636" stroke-width="2"/>');
  A('flower',
    '<g fill="#ff9ebb" stroke="#5b4636" stroke-width="2.5">' +
    '<circle cx="50" cy="30" r="11"/><circle cx="70" cy="44" r="11"/><circle cx="62" cy="66" r="11"/>' +
    '<circle cx="38" cy="66" r="11"/><circle cx="30" cy="44" r="11"/></g>' +
    '<circle cx="50" cy="48" r="11" fill="#ffd43b" stroke="#5b4636" stroke-width="2.5"/>');
  A('leaf',
    '<path d="M50 18 C20 36 24 72 50 84 C76 72 80 36 50 18 Z" fill="#69db7c" stroke="#5b4636" stroke-width="3"/>' +
    '<path d="M50 22 V80 M50 40 L34 34 M50 52 L66 46 M50 64 L36 58" stroke="#2f9e44" stroke-width="2.5" fill="none"/>');
  A('snow',
    '<g stroke="#4dabf7" stroke-width="4" fill="none">' +
    '<path d="M50 14 V86 M18 50 H82 M26 26 L74 74 M74 26 L26 74"/></g>' +
    '<g stroke="#74c0fc" stroke-width="3" fill="none">' +
    '<path d="M50 24 l-6 6 M50 24 l6 6 M50 76 l-6-6 M50 76 l6-6"/></g>');
})(window.__ceAddIcon);

/* ---------------- 扩充：衣物 ---------------- */
(function (A) {
  A('shirt',
    '<path d="M34 28 L20 40 L28 50 L34 44 V78 h32 V44 L72 50 L80 40 L66 28 q-16 10-32 0 Z" ' +
    'fill="#4dabf7" stroke="#5b4636" stroke-width="3" stroke-linejoin="round"/>');
  A('shoe',
    '<path d="M16 60 q0-14 14-16 q4 8 14 8 q18 0 30 12 q8 4 8 10 H16 Z" ' +
    'fill="#ff6b6b" stroke="#5b4636" stroke-width="3"/>' +
    '<path d="M30 48 q4 6 0 12 M40 50 q4 6 0 10" stroke="#fff" stroke-width="2.5" fill="none"/>');
  A('sock',
    '<path d="M40 18 v34 q0 6-6 12 L20 78 q-6 6 2 8 l16-4 q8-4 14-14 l8-14 V18 Z" ' +
    'fill="#ffd43b" stroke="#5b4636" stroke-width="3"/>' +
    '<path d="M40 30 H62 M40 40 H62" stroke="#ffa94d" stroke-width="3"/>');
  A('pants',
    '<path d="M30 24 h40 v18 l-4 38 h-12 l-4-30 -4 30 H34 l-4-38 Z" ' +
    'fill="#4263eb" stroke="#5b4636" stroke-width="3" stroke-linejoin="round"/>');
  A('dress',
    '<path d="M40 24 h20 l4 12 -4 6 L74 80 H26 L40 42 l-4-6 Z" ' +
    'fill="#ff9ebb" stroke="#5b4636" stroke-width="3" stroke-linejoin="round"/>' +
    '<circle cx="50" cy="50" r="3" fill="#fff"/><circle cx="50" cy="62" r="3" fill="#fff"/>');
})(window.__ceAddIcon);

/* ---------------- 扩充：玩具 / 物品 ---------------- */
(function (A) {
  A('ball',
    '<circle cx="50" cy="50" r="32" fill="#ff8787" stroke="#5b4636" stroke-width="3"/>' +
    '<path d="M18 50 H82 M50 18 V82 M27 27 Q50 50 27 73 M73 27 Q50 50 73 73" fill="none" stroke="#5b4636" stroke-width="2"/>');
  A('teddy',
    '<circle cx="30" cy="30" r="10" fill="#b07d52" stroke="#5b4636" stroke-width="3"/>' +
    '<circle cx="70" cy="30" r="10" fill="#b07d52" stroke="#5b4636" stroke-width="3"/>' +
    '<circle cx="50" cy="52" r="26" fill="#c69968" stroke="#5b4636" stroke-width="3"/>' +
    '<circle cx="42" cy="48" r="3.5" fill="#5b4636"/><circle cx="58" cy="48" r="3.5" fill="#5b4636"/>' +
    '<ellipse cx="50" cy="58" rx="9" ry="7" fill="#f1d9bf"/>' +
    '<ellipse cx="50" cy="56" rx="4" ry="3" fill="#5b4636"/>');
  A('blocks',
    '<rect x="22" y="48" width="28" height="28" rx="4" fill="#ff8787" stroke="#5b4636" stroke-width="3"/>' +
    '<rect x="52" y="48" width="28" height="28" rx="4" fill="#4dabf7" stroke="#5b4636" stroke-width="3"/>' +
    '<rect x="37" y="20" width="28" height="28" rx="4" fill="#ffd43b" stroke="#5b4636" stroke-width="3"/>');
  A('book',
    '<path d="M50 28 q-14-8-30-4 V72 q16-4 30 4 q14-8 30-4 V24 q-16-4-30 4 Z" ' +
    'fill="#a9e34b" stroke="#5b4636" stroke-width="3"/>' +
    '<path d="M50 28 V76" stroke="#5b4636" stroke-width="2.5"/>');
  A('drum',
    '<ellipse cx="50" cy="36" rx="28" ry="10" fill="#ffd43b" stroke="#5b4636" stroke-width="3"/>' +
    '<path d="M22 36 V60 a28 10 0 0 0 56 0 V36" fill="#ff8787" stroke="#5b4636" stroke-width="3"/>' +
    '<path d="M22 40 L78 56 M78 40 L22 56" stroke="#fff" stroke-width="2.5"/>' +
    '<path d="M40 30 L30 12 M60 30 L70 12" stroke="#5b4636" stroke-width="3"/>' +
    '<circle cx="30" cy="12" r="4" fill="#b07d52"/><circle cx="70" cy="12" r="4" fill="#b07d52"/>');
})(window.__ceAddIcon);

/* ---------------- 扩充：气球 ---------------- */
(function (A) {
  A('balloon',
    '<path d="M50 16 C32 16 26 38 32 54 C36 64 46 70 50 70 C54 70 64 64 68 54 C74 38 68 16 50 16 Z" ' +
    'fill="#ff6b6b" stroke="#5b4636" stroke-width="3"/>' +
    '<path d="M50 70 L46 76 h8 Z" fill="#ff6b6b" stroke="#5b4636" stroke-width="2"/>' +
    '<path d="M50 76 q6 8 0 14" fill="none" stroke="#5b4636" stroke-width="2.5"/>' +
    '<ellipse cx="42" cy="36" rx="6" ry="10" fill="#fff" opacity="0.5"/>');
})(window.__ceAddIcon);

/* ---------------- 扩充：职业 ---------------- */
(function (A) {
  function face(extra) {
    return '<circle cx="50" cy="50" r="22" fill="#ffd8a8" stroke="#5b4636" stroke-width="3"/>' +
      '<circle cx="43" cy="50" r="2.8" fill="#5b4636"/><circle cx="57" cy="50" r="2.8" fill="#5b4636"/>' +
      '<path d="M44 58 q6 4 12 0" fill="none" stroke="#5b4636" stroke-width="2"/>' + (extra || '');
  }
  A('doctor',
    face() +
    '<path d="M30 80 q0-18 20-18 q20 0 20 18 Z" fill="#fff" stroke="#5b4636" stroke-width="3"/>' +
    '<path d="M44 34 q6-6 12 0 q-2-8-6-8 q-4 0-6 8 Z" fill="#fff" stroke="#5b4636" stroke-width="2.5"/>' +
    '<path d="M48 66 v8 h4 v-8 M46 70 h8" stroke="#ff6b6b" stroke-width="2.5"/>');
  A('teacher',
    face('<path d="M28 38 q22-14 44 0 V32 q-22-10-44 0 Z" fill="#5b4636"/>') +
    '<path d="M30 80 q0-18 20-18 q20 0 20 18 Z" fill="#a9e34b" stroke="#5b4636" stroke-width="3"/>' +
    '<rect x="60" y="64" width="20" height="14" rx="2" fill="#fff" stroke="#5b4636" stroke-width="2"/>');
  A('police',
    '<rect x="30" y="22" width="40" height="10" rx="3" fill="#4263eb" stroke="#5b4636" stroke-width="2.5"/>' +
    '<rect x="44" y="16" width="12" height="8" rx="2" fill="#4263eb" stroke="#5b4636" stroke-width="2.5"/>' +
    face() +
    '<path d="M30 80 q0-18 20-18 q20 0 20 18 Z" fill="#4263eb" stroke="#5b4636" stroke-width="3"/>');
  A('chef',
    '<path d="M34 34 a10 10 0 0 1 4-16 a10 10 0 0 1 24 0 a10 10 0 0 1 4 16 Z" fill="#fff" stroke="#5b4636" stroke-width="3"/>' +
    '<rect x="34" y="34" width="32" height="6" fill="#fff" stroke="#5b4636" stroke-width="2.5"/>' +
    face() +
    '<path d="M30 80 q0-18 20-18 q20 0 20 18 Z" fill="#fff" stroke="#5b4636" stroke-width="3"/>');
  A('firefighter',
    '<path d="M28 34 q22-16 44 0 l-2-8 q-20-10-40 0 Z" fill="#ff6b6b" stroke="#5b4636" stroke-width="2.5"/>' +
    face() +
    '<path d="M30 80 q0-18 20-18 q20 0 20 18 Z" fill="#ffa94d" stroke="#5b4636" stroke-width="3"/>');
})(window.__ceAddIcon);

/* ---------------- 扩充：乐器 ---------------- */
(function (A) {
  A('guitar',
    '<circle cx="40" cy="64" r="22" fill="#ffa94d" stroke="#5b4636" stroke-width="3"/>' +
    '<circle cx="40" cy="64" r="7" fill="#5b4636"/>' +
    '<rect x="52" y="20" width="10" height="40" rx="3" transform="rotate(40 57 40)" fill="#b07d52" stroke="#5b4636" stroke-width="3"/>' +
    '<path d="M48 58 L70 30 M52 62 L74 34" stroke="#fff" stroke-width="1.5" opacity="0.7"/>');
  A('piano',
    '<rect x="18" y="36" width="64" height="40" rx="6" fill="#495057" stroke="#5b4636" stroke-width="3"/>' +
    '<rect x="22" y="52" width="56" height="22" fill="#fff" stroke="#5b4636" stroke-width="2"/>' +
    '<path d="M32 52 V70 M42 52 V70 M52 52 V70 M62 52 V70 M72 52 V70" stroke="#5b4636" stroke-width="2"/>' +
    '<g fill="#495057"><rect x="29" y="52" width="6" height="13"/><rect x="39" y="52" width="6" height="13"/>' +
    '<rect x="59" y="52" width="6" height="13"/><rect x="69" y="52" width="6" height="13"/></g>');
  A('trumpet',
    '<path d="M16 50 h36 M16 44 v12" stroke="#ffd43b" stroke-width="3" fill="none"/>' +
    '<path d="M52 38 a14 14 0 0 1 0 24 L80 70 q6 2 6-20 q0-22-6-20 Z" fill="#ffd43b" stroke="#5b4636" stroke-width="3"/>' +
    '<rect x="50" y="34" width="6" height="32" rx="2" fill="#e8a317" stroke="#5b4636" stroke-width="2"/>' +
    '<g fill="#e8a317"><rect x="58" y="30" width="5" height="14"/><rect x="66" y="30" width="5" height="14"/></g>');
  A('violin',
    '<path d="M50 16 q-14 4-14 24 q-8 4-8 18 q0 16 22 18 q22-2 22-18 q0-14-8-18 q0-20-14-24 Z" ' +
    'fill="#b07d52" stroke="#5b4636" stroke-width="3"/>' +
    '<path d="M50 28 V72" stroke="#5b4636" stroke-width="2"/>' +
    '<path d="M34 52 q4-4 0-8 M66 52 q-4-4 0-8" stroke="#5b4636" stroke-width="2" fill="none"/>');
  A('xylophone',
    '<g stroke="#5b4636" stroke-width="2.5">' +
    '<rect x="20" y="40" width="12" height="40" rx="3" fill="#ff6b6b"/>' +
    '<rect x="34" y="44" width="12" height="36" rx="3" fill="#ffd43b"/>' +
    '<rect x="48" y="48" width="12" height="32" rx="3" fill="#69db7c"/>' +
    '<rect x="62" y="52" width="12" height="28" rx="3" fill="#4dabf7"/></g>' +
    '<circle cx="78" cy="30" r="5" fill="#b07d52" stroke="#5b4636" stroke-width="2"/>' +
    '<path d="M78 30 L60 50" stroke="#b07d52" stroke-width="3"/>');
})(window.__ceAddIcon);

/* ---------------- 扩充：房间物品 ---------------- */
(function (A) {
  A('bed',
    '<path d="M14 70 V46 h60 a12 12 0 0 1 12 12 V70" fill="#ffd8a8" stroke="#5b4636" stroke-width="3"/>' +
    '<rect x="20" y="40" width="22" height="14" rx="4" fill="#fff" stroke="#5b4636" stroke-width="2.5"/>' +
    '<path d="M14 64 H86" stroke="#5b4636" stroke-width="3"/>' +
    '<path d="M14 70 V80 M86 70 V80" stroke="#5b4636" stroke-width="3"/>');
  A('chair',
    '<path d="M34 20 V60 M34 44 h28 M62 30 V60" stroke="#b07d52" stroke-width="5" fill="none" stroke-linecap="round"/>' +
    '<path d="M30 60 h36 v6 H30 Z" fill="#ffa94d" stroke="#5b4636" stroke-width="3"/>' +
    '<path d="M32 66 V82 M64 66 V82" stroke="#b07d52" stroke-width="5" stroke-linecap="round"/>');
  A('table',
    '<rect x="18" y="40" width="64" height="10" rx="4" fill="#ffa94d" stroke="#5b4636" stroke-width="3"/>' +
    '<path d="M26 50 V80 M74 50 V80" stroke="#b07d52" stroke-width="6" stroke-linecap="round"/>');
  A('lamp',
    '<path d="M34 30 h32 l10 24 H24 Z" fill="#ffd43b" stroke="#5b4636" stroke-width="3"/>' +
    '<rect x="46" y="54" width="8" height="22" fill="#b07d52" stroke="#5b4636" stroke-width="2.5"/>' +
    '<path d="M36 80 h28" stroke="#5b4636" stroke-width="5" stroke-linecap="round"/>' +
    '<g stroke="#ffa94d" stroke-width="2.5"><path d="M50 14 V24 M34 18 L38 26 M66 18 L62 26"/></g>');
  A('clock',
    '<circle cx="50" cy="52" r="32" fill="#fff" stroke="#5b4636" stroke-width="3"/>' +
    '<circle cx="50" cy="52" r="3" fill="#5b4636"/>' +
    '<path d="M50 52 V32 M50 52 L66 60" stroke="#5b4636" stroke-width="3" stroke-linecap="round"/>' +
    '<path d="M50 24 v6 M50 80 v-6 M22 52 h6 M78 52 h-6" stroke="#adb5bd" stroke-width="2.5"/>' +
    '<path d="M40 16 L34 24 M60 16 L66 24" stroke="#ff8787" stroke-width="3"/>');
  A('door',
    '<rect x="28" y="18" width="44" height="64" rx="4" fill="#b07d52" stroke="#5b4636" stroke-width="3"/>' +
    '<rect x="36" y="26" width="28" height="48" rx="3" fill="#c69968" stroke="#5b4636" stroke-width="2"/>' +
    '<circle cx="60" cy="52" r="3.5" fill="#ffd43b" stroke="#5b4636" stroke-width="2"/>');
  A('window',
    '<rect x="22" y="24" width="56" height="52" rx="6" fill="#d3f3ff" stroke="#5b4636" stroke-width="3"/>' +
    '<path d="M50 24 V76 M22 50 H78" stroke="#5b4636" stroke-width="3"/>' +
    '<path d="M30 34 q8 6 0 12" fill="none" stroke="#fff" stroke-width="2.5"/>');
})(window.__ceAddIcon);

/* ---------------- 扩充：动物（第二批） ---------------- */
(function (A) {
  A('cow',
    '<ellipse cx="50" cy="56" rx="30" ry="27" fill="#fff" stroke="#5b4636" stroke-width="3"/>' +
    '<path d="M24 36 L18 22 L34 30 Z M76 36 L82 22 L66 30 Z" fill="#ffc9d6" stroke="#5b4636" stroke-width="3"/>' +
    '<path d="M30 44 q-8-6-12 2 q6 6 12 0 Z M70 44 q8-6 12 2 q-6 6-12 0 Z" fill="#5b4636"/>' +
    '<circle cx="41" cy="52" r="3.5" fill="#5b4636"/><circle cx="59" cy="52" r="3.5" fill="#5b4636"/>' +
    '<ellipse cx="50" cy="66" rx="14" ry="10" fill="#ffc9d6" stroke="#5b4636" stroke-width="2.5"/>' +
    '<circle cx="45" cy="66" r="2.5" fill="#5b4636"/><circle cx="55" cy="66" r="2.5" fill="#5b4636"/>');
  A('sheep',
    '<circle cx="34" cy="44" r="10" fill="#fff" stroke="#5b4636" stroke-width="3"/>' +
    '<circle cx="66" cy="44" r="10" fill="#fff" stroke="#5b4636" stroke-width="3"/>' +
    '<circle cx="50" cy="38" r="12" fill="#fff" stroke="#5b4636" stroke-width="3"/>' +
    '<circle cx="40" cy="62" r="12" fill="#fff" stroke="#5b4636" stroke-width="3"/>' +
    '<circle cx="60" cy="62" r="12" fill="#fff" stroke="#5b4636" stroke-width="3"/>' +
    '<circle cx="50" cy="66" r="14" fill="#fff" stroke="#5b4636" stroke-width="3"/>' +
    '<ellipse cx="50" cy="54" rx="14" ry="13" fill="#5b4636"/>' +
    '<circle cx="44" cy="52" r="2.8" fill="#fff"/><circle cx="56" cy="52" r="2.8" fill="#fff"/>');
  A('horse',
    '<path d="M30 80 V50 q0-22 22-26 l18-6 q6 4 0 10 q10 6 8 24 V80" fill="#c69968" stroke="#5b4636" stroke-width="3"/>' +
    '<path d="M70 28 q8-2 10 2 q-2 6-10 6 Z" fill="#b07d52" stroke="#5b4636" stroke-width="2.5"/>' +
    '<path d="M52 24 q-8-4-6-12 q8 2 10 10" fill="#5b4636"/>' +
    '<circle cx="64" cy="34" r="3.2" fill="#5b4636"/>');
  A('mouse',
    '<circle cx="50" cy="58" r="26" fill="#adb5bd" stroke="#5b4636" stroke-width="3"/>' +
    '<circle cx="30" cy="38" r="14" fill="#ced4da" stroke="#5b4636" stroke-width="3"/>' +
    '<circle cx="70" cy="38" r="14" fill="#ced4da" stroke="#5b4636" stroke-width="3"/>' +
    '<circle cx="42" cy="56" r="3.5" fill="#5b4636"/><circle cx="58" cy="56" r="3.5" fill="#5b4636"/>' +
    '<ellipse cx="50" cy="66" rx="5" ry="4" fill="#ff9ebb"/>' +
    '<path d="M30 66 H16 M30 72 H18" stroke="#5b4636" stroke-width="2"/>');
  A('owl',
    '<ellipse cx="50" cy="56" rx="26" ry="28" fill="#b07d52" stroke="#5b4636" stroke-width="3"/>' +
    '<path d="M28 32 L36 44 M72 32 L64 44" stroke="#5b4636" stroke-width="3"/>' +
    '<circle cx="40" cy="48" r="11" fill="#fff" stroke="#5b4636" stroke-width="2.5"/>' +
    '<circle cx="60" cy="48" r="11" fill="#fff" stroke="#5b4636" stroke-width="2.5"/>' +
    '<circle cx="40" cy="48" r="5" fill="#5b4636"/><circle cx="60" cy="48" r="5" fill="#5b4636"/>' +
    '<path d="M50 56 L45 64 h10 Z" fill="#ffa94d" stroke="#5b4636" stroke-width="2"/>');
  A('panda',
    '<circle cx="50" cy="54" r="28" fill="#fff" stroke="#5b4636" stroke-width="3"/>' +
    '<circle cx="28" cy="32" r="11" fill="#5b4636"/><circle cx="72" cy="32" r="11" fill="#5b4636"/>' +
    '<ellipse cx="38" cy="52" rx="9" ry="11" fill="#5b4636"/><ellipse cx="62" cy="52" rx="9" ry="11" fill="#5b4636"/>' +
    '<circle cx="38" cy="52" r="3" fill="#fff"/><circle cx="62" cy="52" r="3" fill="#fff"/>' +
    '<ellipse cx="50" cy="64" rx="4" ry="3" fill="#5b4636"/>' +
    '<path d="M50 67 v3" stroke="#5b4636" stroke-width="2"/>');
})(window.__ceAddIcon);

/* ---------------- 扩充：水果（第二批） ---------------- */
(function (A) {
  A('mango',
    '<path d="M58 22 C36 18 22 38 26 58 C30 78 52 84 64 76 C80 64 80 30 58 22 Z" ' +
    'fill="#ffb84d" stroke="#5b4636" stroke-width="3"/>' +
    '<path d="M58 22 q6-8 0-10" stroke="#7a4f2a" stroke-width="3" fill="none"/>' +
    '<ellipse cx="44" cy="46" rx="6" ry="9" fill="#fff" opacity="0.45"/>' +
    '<path d="M40 64 q12 6 24-2" fill="none" stroke="#e8902a" stroke-width="2.5"/>');
  A('kiwi',
    '<circle cx="50" cy="52" r="32" fill="#7a5230" stroke="#5b4636" stroke-width="3"/>' +
    '<circle cx="50" cy="52" r="24" fill="#a9e34b" stroke="#5b4636" stroke-width="2"/>' +
    '<circle cx="50" cy="52" r="7" fill="#fff"/>' +
    '<g fill="#5b4636"><circle cx="50" cy="34" r="1.6"/><circle cx="66" cy="44" r="1.6"/>' +
    '<circle cx="62" cy="64" r="1.6"/><circle cx="38" cy="64" r="1.6"/><circle cx="34" cy="44" r="1.6"/></g>');
  A('coconut',
    '<circle cx="50" cy="54" r="32" fill="#8a5a2b" stroke="#5b4636" stroke-width="3"/>' +
    '<circle cx="50" cy="54" r="24" fill="#fff" stroke="#5b4636" stroke-width="2"/>' +
    '<g fill="#8a5a2b"><circle cx="42" cy="48" r="3"/><circle cx="58" cy="48" r="3"/><circle cx="50" cy="60" r="3"/></g>' +
    '<path d="M40 30 q10-12 20 0" fill="none" stroke="#69db7c" stroke-width="3"/>');
  A('blueberry',
    '<g fill="#4263eb" stroke="#5b4636" stroke-width="2.5">' +
    '<circle cx="38" cy="56" r="15"/><circle cx="62" cy="56" r="15"/><circle cx="50" cy="40" r="14"/></g>' +
    '<g fill="#748ffc"><path d="M50 32 l2 4 4-1-3 3 1 4-4-2-4 2 1-4-3-3 4 1Z"/></g>' +
    '<path d="M34 52 q4-4 8 0 M58 52 q4-4 8 0" fill="none" stroke="#1c2c6b" stroke-width="2"/>');
})(window.__ceAddIcon);

/* ---------------- 扩充：形状（第二批） ---------------- */
(function (A) {
  A('shape_oval', '<ellipse cx="50" cy="50" rx="36" ry="24" fill="#ffa6d5" stroke="#5b4636" stroke-width="3"/>');
  A('shape_rect', '<rect x="14" y="30" width="72" height="40" rx="6" fill="#74c0fc" stroke="#5b4636" stroke-width="3"/>');
  A('shape_pentagon', '<path d="M50 14 L84 40 L71 82 H29 L16 40 Z" fill="#a9e34b" stroke="#5b4636" stroke-width="3" stroke-linejoin="round"/>');
  A('shape_hexagon', '<path d="M30 18 H70 L88 50 L70 82 H30 L12 50 Z" fill="#ffd43b" stroke="#5b4636" stroke-width="3" stroke-linejoin="round"/>');
  A('shape_crescent', '<path d="M62 16 a34 34 0 1 0 16 50 A26 26 0 0 1 62 16 Z" fill="#ffd43b" stroke="#5b4636" stroke-width="3"/>');
  A('shape_arrow', '<path d="M16 42 H56 V28 L86 50 L56 72 V58 H16 Z" fill="#ff8787" stroke="#5b4636" stroke-width="3" stroke-linejoin="round"/>');
})(window.__ceAddIcon);

/* ---------------- 扩充：交通工具（第二批） ---------------- */
(function (A) {
  A('truck',
    '<rect x="12" y="44" width="44" height="28" rx="4" fill="#69db7c" stroke="#5b4636" stroke-width="3"/>' +
    '<path d="M56 52 h16 l12 12 v8 H56 Z" fill="#8ce99a" stroke="#5b4636" stroke-width="3"/>' +
    '<rect x="60" y="54" width="12" height="10" fill="#d3f3ff" stroke="#5b4636" stroke-width="2"/>' +
    '<circle cx="28" cy="76" r="8" fill="#5b4636"/><circle cx="70" cy="76" r="8" fill="#5b4636"/>');
  A('rocket',
    '<path d="M50 12 C66 28 66 52 58 68 H42 C34 52 34 28 50 12 Z" fill="#ff6b6b" stroke="#5b4636" stroke-width="3"/>' +
    '<circle cx="50" cy="38" r="7" fill="#d3f3ff" stroke="#5b4636" stroke-width="2.5"/>' +
    '<path d="M42 60 L28 76 L42 70 Z M58 60 L72 76 L58 70 Z" fill="#ffa94d" stroke="#5b4636" stroke-width="2.5"/>' +
    '<path d="M44 68 q6 14 12 0" fill="#ffd43b" stroke="#5b4636" stroke-width="2"/>');
  A('helicopter',
    '<rect x="14" y="40" width="14" height="24" rx="20 0 0 20" fill="#ffd43b" stroke="#5b4636" stroke-width="3"/>' +
    '<ellipse cx="48" cy="54" rx="30" ry="16" fill="#ffd43b" stroke="#5b4636" stroke-width="3"/>' +
    '<circle cx="38" cy="52" r="7" fill="#d3f3ff" stroke="#5b4636" stroke-width="2"/>' +
    '<path d="M14 32 H82 M48 32 V40" stroke="#5b4636" stroke-width="3"/>' +
    '<path d="M70 60 v14 M64 74 h12" stroke="#5b4636" stroke-width="3"/>');
  A('taxi',
    '<path d="M16 60 L24 44 h52 l8 16 Z" fill="#ffd43b" stroke="#5b4636" stroke-width="3"/>' +
    '<rect x="14" y="58" width="72" height="14" rx="6" fill="#fcc419" stroke="#5b4636" stroke-width="3"/>' +
    '<rect x="42" y="36" width="16" height="8" fill="#5b4636"/>' +
    '<path d="M34 46 h14 v10 h-20 Z M52 46 h12 l6 10 h-18 Z" fill="#d3f3ff" stroke="#5b4636" stroke-width="2"/>' +
    '<circle cx="32" cy="74" r="8" fill="#5b4636"/><circle cx="68" cy="74" r="8" fill="#5b4636"/>');
  A('scooter',
    '<circle cx="26" cy="66" r="14" fill="none" stroke="#5b4636" stroke-width="4"/>' +
    '<circle cx="72" cy="66" r="14" fill="none" stroke="#5b4636" stroke-width="4"/>' +
    '<path d="M26 66 L48 40 h18 q8 0 8 26" fill="none" stroke="#ff6b6b" stroke-width="4"/>' +
    '<path d="M48 40 q4-12 14-12 h6" fill="none" stroke="#5b4636" stroke-width="3"/>' +
    '<path d="M40 52 h20 l-4 14 H44 Z" fill="#ffa94d" stroke="#5b4636" stroke-width="2.5"/>');
  A('police_car',
    '<path d="M16 60 L24 44 h52 l8 16 Z" fill="#4dabf7" stroke="#5b4636" stroke-width="3"/>' +
    '<rect x="14" y="58" width="72" height="14" rx="6" fill="#fff" stroke="#5b4636" stroke-width="3"/>' +
    '<rect x="42" y="34" width="16" height="8" rx="2" fill="#ff6b6b" stroke="#5b4636" stroke-width="2"/>' +
    '<path d="M34 46 h14 v10 h-20 Z M52 46 h12 l6 10 h-18 Z" fill="#d3f3ff" stroke="#5b4636" stroke-width="2"/>' +
    '<circle cx="32" cy="74" r="8" fill="#5b4636"/><circle cx="68" cy="74" r="8" fill="#5b4636"/>');
})(window.__ceAddIcon);

/* ---------------- 扩充：家庭与身体（第二批） ---------------- */
(function (A) {
  A('grandma2',
    '<circle cx="50" cy="40" r="20" fill="#ffd8a8" stroke="#5b4636" stroke-width="3"/>' +
    '<path d="M28 36 q4-20 22-20 q18 0 22 20 q-10-4-22-4 q-12 0-22 4 Z" fill="#e9ecef" stroke="#5b4636" stroke-width="3"/>' +
    '<circle cx="43" cy="42" r="6" fill="none" stroke="#5b4636" stroke-width="2"/>' +
    '<circle cx="57" cy="42" r="6" fill="none" stroke="#5b4636" stroke-width="2"/>' +
    '<path d="M49 42 h2" stroke="#5b4636" stroke-width="2"/>' +
    '<path d="M44 50 q6 4 12 0" fill="none" stroke="#5b4636" stroke-width="2"/>' +
    '<path d="M28 82 q0-20 22-20 q22 0 22 20 Z" fill="#b197fc" stroke="#5b4636" stroke-width="3"/>');
  A('grandpa2',
    '<circle cx="50" cy="42" r="20" fill="#ffd8a8" stroke="#5b4636" stroke-width="3"/>' +
    '<path d="M32 36 q2-18 18-18 q16 0 18 18 q-8-4-18-4 q-10 0-18 4 Z" fill="#e9ecef" stroke="#5b4636" stroke-width="3"/>' +
    '<circle cx="43" cy="44" r="6" fill="none" stroke="#5b4636" stroke-width="2"/>' +
    '<circle cx="57" cy="44" r="6" fill="none" stroke="#5b4636" stroke-width="2"/>' +
    '<path d="M49 44 h2" stroke="#5b4636" stroke-width="2"/>' +
    '<path d="M40 56 q10 6 20 0 v6 q-10 4-20 0 Z" fill="#e9ecef" stroke="#5b4636" stroke-width="2"/>' +
    '<path d="M30 82 q0-18 20-18 q20 0 20 18 Z" fill="#69db7c" stroke="#5b4636" stroke-width="3"/>');
  A('boy',
    '<path d="M30 30 q20-14 40 0 V26 q-20-10-40 0 Z" fill="#5b4636"/>' +
    '<circle cx="50" cy="42" r="20" fill="#ffd8a8" stroke="#5b4636" stroke-width="3"/>' +
    '<circle cx="43" cy="42" r="2.8" fill="#5b4636"/><circle cx="57" cy="42" r="2.8" fill="#5b4636"/>' +
    '<path d="M44 50 q6 4 12 0" fill="none" stroke="#5b4636" stroke-width="2"/>' +
    '<path d="M30 82 q0-20 20-20 q20 0 20 20 Z" fill="#4dabf7" stroke="#5b4636" stroke-width="3"/>');
  A('girl',
    '<circle cx="50" cy="42" r="20" fill="#ffd8a8" stroke="#5b4636" stroke-width="3"/>' +
    '<path d="M30 42 q0-26 20-26 q20 0 20 26 q-6-4-6-14 q-6 6-14 6 q-8 0-14-6 q0 10-6 14 Z" fill="#b07d52" stroke="#5b4636" stroke-width="3"/>' +
    '<path d="M30 50 q-6 10-4 24 M70 50 q6 10 4 24" fill="#b07d52" stroke="#5b4636" stroke-width="3"/>' +
    '<circle cx="43" cy="44" r="2.8" fill="#5b4636"/><circle cx="57" cy="44" r="2.8" fill="#5b4636"/>' +
    '<path d="M44 52 q6 4 12 0" fill="none" stroke="#5b4636" stroke-width="2"/>' +
    '<path d="M32 82 q0-18 18-18 q18 0 18 18 Z" fill="#ff9ebb" stroke="#5b4636" stroke-width="3"/>');
  A('ear',
    '<path d="M40 22 q26-6 30 20 q2 18-10 24 q-8 4-8 12 q-2 6-10 4 q-12-4-14-22 q-2-30 12-38 Z" ' +
    'fill="#ffd8a8" stroke="#5b4636" stroke-width="3"/>' +
    '<path d="M46 40 q14-4 14 12 q0 8-8 10" fill="none" stroke="#5b4636" stroke-width="2.5"/>');
  A('nose',
    '<path d="M50 18 q-6 28-14 40 q-2 10 14 10 q16 0 14-10 q-8-12-14-40 Z" ' +
    'fill="#ffd8a8" stroke="#5b4636" stroke-width="3"/>' +
    '<path d="M40 60 q4 4 8 2 M60 60 q-4 4-8 2" fill="none" stroke="#5b4636" stroke-width="2"/>');
  A('mouth',
    '<path d="M20 44 q30-16 60 0 q-12 26-30 26 q-18 0-30-26 Z" fill="#ff6b6b" stroke="#5b4636" stroke-width="3"/>' +
    '<path d="M20 44 q30 10 60 0" fill="none" stroke="#5b4636" stroke-width="2.5"/>' +
    '<rect x="38" y="44" width="10" height="9" rx="2" fill="#fff"/><rect x="52" y="44" width="10" height="9" rx="2" fill="#fff"/>');
})(window.__ceAddIcon);

/* ---------------- 扩充：食物（第二批） ---------------- */
(function (A) {
  A('pizza',
    '<path d="M50 16 L84 76 q-34 14-68 0 Z" fill="#ffd43b" stroke="#5b4636" stroke-width="3" stroke-linejoin="round"/>' +
    '<path d="M50 28 L74 70 q-24 8-48 0 Z" fill="#ffa94d" stroke="#5b4636" stroke-width="1.5"/>' +
    '<circle cx="46" cy="48" r="4" fill="#ff6b6b"/><circle cx="58" cy="58" r="4" fill="#ff6b6b"/>' +
    '<circle cx="40" cy="62" r="4" fill="#ff6b6b"/><circle cx="56" cy="42" r="3" fill="#69db7c"/>');
  A('burger',
    '<path d="M24 36 q26-18 52 0 Z" fill="#ffa94d" stroke="#5b4636" stroke-width="3"/>' +
    '<rect x="22" y="36" width="56" height="8" fill="#69db7c" stroke="#5b4636" stroke-width="2"/>' +
    '<rect x="22" y="44" width="56" height="10" fill="#b07d52" stroke="#5b4636" stroke-width="2"/>' +
    '<rect x="22" y="54" width="56" height="6" fill="#ffd43b" stroke="#5b4636" stroke-width="2"/>' +
    '<path d="M24 60 q26 16 52 0 v4 q-26 14-52 0 Z" fill="#ffc078" stroke="#5b4636" stroke-width="2.5"/>');
  A('apple_food',
    '<path d="M50 30 C42 22 28 26 30 40 C32 58 42 70 50 70 C58 70 68 58 70 40 C72 26 58 22 50 30 Z" ' +
    'fill="#ff6b6b" stroke="#5b4636" stroke-width="3"/><path d="M50 30 V20" stroke="#7a4f2a" stroke-width="4"/>');
  A('carrot',
    '<path d="M30 70 L66 34 q8 8 0 16 L46 86 q-12-2-16-16 Z" fill="#ffa94d" stroke="#5b4636" stroke-width="3"/>' +
    '<path d="M66 34 q6-14 18-16 q-2 14-14 18 M70 38 q10-8 18-6" fill="#69db7c" stroke="#5b4636" stroke-width="2.5"/>' +
    '<path d="M42 62 l6-6 M52 52 l6-6" stroke="#e8902a" stroke-width="2"/>');
  A('corn',
    '<path d="M50 18 q18 6 18 36 q0 24-18 30 q-18-6-18-30 q0-30 18-36 Z" fill="#ffd43b" stroke="#5b4636" stroke-width="3"/>' +
    '<path d="M34 40 q-12-6-16 4 q10 8 18 2 M66 40 q12-6 16 4 q-10 8-18 2" fill="#a9e34b" stroke="#5b4636" stroke-width="2.5"/>' +
    '<g fill="#e8a317"><circle cx="44" cy="42" r="2"/><circle cx="56" cy="42" r="2"/><circle cx="50" cy="52" r="2"/><circle cx="44" cy="62" r="2"/><circle cx="56" cy="62" r="2"/></g>');
  A('rice',
    '<path d="M24 52 h52 q-4 22-26 22 q-22 0-26-22 Z" fill="#fff" stroke="#5b4636" stroke-width="3"/>' +
    '<path d="M24 52 q26-8 52 0" fill="none" stroke="#5b4636" stroke-width="2"/>' +
    '<g fill="#fff" stroke="#5b4636" stroke-width="1.5"><ellipse cx="40" cy="42" rx="4" ry="7"/>' +
    '<ellipse cx="52" cy="38" rx="4" ry="7"/><ellipse cx="62" cy="44" rx="4" ry="7"/></g>');
  A('fish_food',
    '<path d="M60 50 q-20-20-42 0 q22 20 42 0 Z" fill="#ffa94d" stroke="#5b4636" stroke-width="3"/>' +
    '<path d="M60 50 L82 36 V64 Z" fill="#ffc078" stroke="#5b4636" stroke-width="3"/>' +
    '<circle cx="32" cy="46" r="3" fill="#5b4636"/>');
})(window.__ceAddIcon);

/* ---------------- 扩充：自然与天气（第二批） ---------------- */
(function (A) {
  A('rainbow',
    '<g fill="none" stroke-width="6">' +
    '<path d="M16 70 a34 34 0 0 1 68 0" stroke="#ff6b6b"/>' +
    '<path d="M24 70 a26 26 0 0 1 52 0" stroke="#ffd43b"/>' +
    '<path d="M32 70 a18 18 0 0 1 36 0" stroke="#69db7c"/>' +
    '<path d="M40 70 a10 10 0 0 1 20 0" stroke="#4dabf7"/></g>');
  A('mountain',
    '<path d="M10 76 L36 34 L52 58 L64 40 L90 76 Z" fill="#69db7c" stroke="#5b4636" stroke-width="3" stroke-linejoin="round"/>' +
    '<path d="M30 44 L36 34 L43 44 Z M58 50 L64 40 L70 50 Z" fill="#fff" stroke="#5b4636" stroke-width="1.5"/>');
  A('water',
    '<path d="M50 14 C66 40 80 56 80 70 a30 30 0 0 1-60 0 C20 56 34 40 50 14 Z" fill="#4dabf7" stroke="#5b4636" stroke-width="3"/>' +
    '<path d="M40 56 q4 12 14 14" fill="none" stroke="#fff" stroke-width="3" opacity="0.7"/>');
  A('fire',
    '<path d="M50 14 q4 16-6 24 q-2-8-8-10 q4 14-8 22 q-6 18 22 22 q28-4 22-24 q-8 6-12-2 q8-18-6-30 q2 12-6 14 q4-16-4-16 Z" ' +
    'fill="#ff8787" stroke="#5b4636" stroke-width="3"/>' +
    '<path d="M50 44 q6 8-2 18 q-8-4-6-12 q4 2 8-6 Z" fill="#ffd43b"/>');
  A('tree2',
    '<rect x="44" y="58" width="12" height="26" rx="3" fill="#b07d52" stroke="#5b4636" stroke-width="3"/>' +
    '<path d="M50 12 L74 50 H58 L74 72 H26 L42 50 H26 Z" fill="#69db7c" stroke="#5b4636" stroke-width="3" stroke-linejoin="round"/>');
  A('wind',
    '<g fill="none" stroke="#74c0fc" stroke-width="5" stroke-linecap="round">' +
    '<path d="M16 40 H60 a8 8 0 1 0-8-8"/>' +
    '<path d="M16 54 H74 a8 8 0 1 1-8 8"/>' +
    '<path d="M16 68 H46 a6 6 0 1 0-6-6"/></g>');
})(window.__ceAddIcon);

/* ---------------- 扩充：衣物（第二批） ---------------- */
(function (A) {
  A('coat',
    '<path d="M34 24 L20 36 l8 12 6-6 V80 h32 V42 l6 6 8-12 -14-12 q-16 10-32 0 Z" fill="#b07d52" stroke="#5b4636" stroke-width="3" stroke-linejoin="round"/>' +
    '<path d="M50 30 V80" stroke="#5b4636" stroke-width="2"/>' +
    '<circle cx="50" cy="46" r="2.5" fill="#5b4636"/><circle cx="50" cy="58" r="2.5" fill="#5b4636"/>');
  A('scarf',
    '<path d="M30 26 q20 16 40 0 q4 8-2 14 q-18 12-36 0 q-6-6-2-14 Z" fill="#ff8787" stroke="#5b4636" stroke-width="3"/>' +
    '<path d="M40 40 l-6 38 h12 l4-30 Z" fill="#ffa6c1" stroke="#5b4636" stroke-width="3"/>' +
    '<path d="M40 70 h12 M38 78 h14" stroke="#5b4636" stroke-width="2"/>');
  A('gloves',
    '<path d="M30 40 v24 q0 12 12 14 h6 q12-2 12-14 V40 q0-6-6 0 v-6 q0-6-6 0 v6 q0-6-6 0 v6 q0-6-6 0 Z" fill="#4dabf7" stroke="#5b4636" stroke-width="3"/>' +
    '<rect x="28" y="62" width="36" height="8" fill="#74c0fc" stroke="#5b4636" stroke-width="2"/>');
  A('boots',
    '<path d="M36 16 h16 v40 l18 8 q6 4 0 12 H36 q-6 0-6-8 Z" fill="#ff6b6b" stroke="#5b4636" stroke-width="3" stroke-linejoin="round"/>' +
    '<path d="M30 68 h44" stroke="#5b4636" stroke-width="2.5"/>' +
    '<path d="M36 26 h16" stroke="#fff" stroke-width="3"/>');
  A('shorts',
    '<path d="M28 28 h44 v18 l-3 24 H53 l-3-20 -3 20 H31 l-3-24 Z" fill="#69db7c" stroke="#5b4636" stroke-width="3" stroke-linejoin="round"/>' +
    '<path d="M28 32 h44" stroke="#5b4636" stroke-width="2"/>');
  A('cap',
    '<path d="M22 56 q4-32 28-32 q24 0 28 24 H50 Z" fill="#ff8787" stroke="#5b4636" stroke-width="3"/>' +
    '<path d="M50 48 H86 q2 8-6 10 H50 Z" fill="#ff6b6b" stroke="#5b4636" stroke-width="3"/>' +
    '<circle cx="50" cy="26" r="4" fill="#ffd43b" stroke="#5b4636" stroke-width="2"/>');
})(window.__ceAddIcon);

/* ---------------- 扩充：玩具（第二批） ---------------- */
(function (A) {
  A('car_toy',
    '<rect x="18" y="50" width="64" height="20" rx="8" fill="#ffd43b" stroke="#5b4636" stroke-width="3"/>' +
    '<path d="M30 50 q8-14 24-14 q14 0 20 14 Z" fill="#ff8787" stroke="#5b4636" stroke-width="3"/>' +
    '<circle cx="34" cy="72" r="8" fill="#5b4636"/><circle cx="66" cy="72" r="8" fill="#5b4636"/>');
  A('robot',
    '<rect x="30" y="34" width="40" height="36" rx="8" fill="#adb5bd" stroke="#5b4636" stroke-width="3"/>' +
    '<rect x="40" y="44" width="9" height="9" rx="2" fill="#4dabf7"/><rect x="51" y="44" width="9" height="9" rx="2" fill="#4dabf7"/>' +
    '<path d="M42 62 h16" stroke="#5b4636" stroke-width="2.5"/>' +
    '<path d="M50 34 V24 M50 24 a4 4 0 1 0 0.1 0" fill="#ff6b6b" stroke="#5b4636" stroke-width="2.5"/>' +
    '<rect x="22" y="44" width="8" height="16" rx="3" fill="#ced4da" stroke="#5b4636" stroke-width="2"/>' +
    '<rect x="70" y="44" width="8" height="16" rx="3" fill="#ced4da" stroke="#5b4636" stroke-width="2"/>' +
    '<rect x="36" y="70" width="10" height="12" fill="#868e96" stroke="#5b4636" stroke-width="2"/>' +
    '<rect x="54" y="70" width="10" height="12" fill="#868e96" stroke="#5b4636" stroke-width="2"/>');
  A('doll',
    '<circle cx="50" cy="34" r="16" fill="#ffd8a8" stroke="#5b4636" stroke-width="3"/>' +
    '<path d="M34 32 q0-20 16-20 q16 0 16 20 q-6-4-16-4 q-10 0-16 4 Z" fill="#ffd43b" stroke="#5b4636" stroke-width="3"/>' +
    '<circle cx="44" cy="36" r="2.5" fill="#5b4636"/><circle cx="56" cy="36" r="2.5" fill="#5b4636"/>' +
    '<circle cx="50" cy="42" r="3" fill="#ff9ebb"/>' +
    '<path d="M36 80 q0-30 14-30 q14 0 14 30 Z" fill="#ff9ebb" stroke="#5b4636" stroke-width="3"/>');
  A('top',
    '<path d="M30 30 h40 L50 50 Z" fill="#ff8787" stroke="#5b4636" stroke-width="3" stroke-linejoin="round"/>' +
    '<path d="M50 50 L62 74 L50 84 L38 74 Z" fill="#ffd43b" stroke="#5b4636" stroke-width="3" stroke-linejoin="round"/>' +
    '<path d="M50 84 v8" stroke="#5b4636" stroke-width="3"/>');
  A('yoyo',
    '<circle cx="50" cy="62" r="22" fill="#4dabf7" stroke="#5b4636" stroke-width="3"/>' +
    '<circle cx="50" cy="62" r="6" fill="#fff" stroke="#5b4636" stroke-width="2"/>' +
    '<path d="M50 40 V14 q8 0 8 8" fill="none" stroke="#5b4636" stroke-width="3"/>');
})(window.__ceAddIcon);

/* ---------------- 扩充：职业（第二批） ---------------- */
(function (A) {
  function face(extra) {
    return '<circle cx="50" cy="50" r="22" fill="#ffd8a8" stroke="#5b4636" stroke-width="3"/>' +
      '<circle cx="43" cy="50" r="2.8" fill="#5b4636"/><circle cx="57" cy="50" r="2.8" fill="#5b4636"/>' +
      '<path d="M44 58 q6 4 12 0" fill="none" stroke="#5b4636" stroke-width="2"/>' + (extra || '');
  }
  A('farmer',
    '<path d="M24 34 h52 l-6-8 H30 Z" fill="#ffd43b" stroke="#5b4636" stroke-width="2.5"/>' +
    '<path d="M34 26 q16-10 32 0 V20 q-16-8-32 0 Z" fill="#ffe066" stroke="#5b4636" stroke-width="2.5"/>' +
    face() +
    '<path d="M30 80 q0-18 20-18 q20 0 20 18 Z" fill="#a9e34b" stroke="#5b4636" stroke-width="3"/>');
  A('pilot',
    '<path d="M28 34 q22-14 44 0 l-2-10 q-20-8-40 0 Z" fill="#4263eb" stroke="#5b4636" stroke-width="2.5"/>' +
    '<circle cx="50" cy="26" r="5" fill="#ffd43b" stroke="#5b4636" stroke-width="2"/>' +
    face() +
    '<path d="M30 80 q0-18 20-18 q20 0 20 18 Z" fill="#4dabf7" stroke="#5b4636" stroke-width="3"/>');
  A('nurse',
    '<path d="M30 80 q0-18 20-18 q20 0 20 18 Z" fill="#fff" stroke="#5b4636" stroke-width="3"/>' +
    face('<path d="M28 38 q22-14 44 0 V32 q-22-10-44 0 Z" fill="#fff" stroke="#5b4636" stroke-width="2.5"/>' +
         '<path d="M47 26 h6 v6 h-6 Z M44 29 h12" stroke="#ff6b6b" stroke-width="2"/>'));
  A('singer',
    face('<path d="M28 36 q22-14 44 0 V30 q-22-10-44 0 Z" fill="#b07d52" stroke="#5b4636" stroke-width="3"/>') +
    '<path d="M30 80 q0-18 20-18 q20 0 20 18 Z" fill="#ff9ebb" stroke="#5b4636" stroke-width="3"/>' +
    '<rect x="62" y="58" width="7" height="20" rx="3" transform="rotate(20 65 68)" fill="#495057" stroke="#5b4636" stroke-width="2"/>' +
    '<circle cx="60" cy="56" r="6" fill="#868e96" stroke="#5b4636" stroke-width="2"/>');
  A('painter',
    '<path d="M30 30 q20-12 40 0 V24 q-20-8-40 0 Z" fill="#ff8787" stroke="#5b4636" stroke-width="2.5"/>' +
    face() +
    '<path d="M30 80 q0-18 20-18 q20 0 20 18 Z" fill="#ffd43b" stroke="#5b4636" stroke-width="3"/>' +
    '<path d="M60 64 l16-6" stroke="#b07d52" stroke-width="3"/><circle cx="78" cy="56" r="4" fill="#ff6b6b"/>');
})(window.__ceAddIcon);

/* ---------------- 扩充：乐器（第二批） ---------------- */
(function (A) {
  A('flute',
    '<rect x="16" y="46" width="68" height="9" rx="4" transform="rotate(-12 50 50)" fill="#ffd43b" stroke="#5b4636" stroke-width="3"/>' +
    '<g fill="#5b4636"><circle cx="40" cy="52" r="2.2"/><circle cx="50" cy="50" r="2.2"/><circle cx="60" cy="48" r="2.2"/><circle cx="70" cy="46" r="2.2"/></g>');
  A('saxophone',
    '<path d="M44 18 v30 q0 18-14 22 q-12 4-8 16 q14 4 22-6 q12-14 12-32 V18 Z" fill="#ffd43b" stroke="#5b4636" stroke-width="3"/>' +
    '<rect x="40" y="14" width="10" height="8" rx="2" fill="#e8a317" stroke="#5b4636" stroke-width="2"/>' +
    '<g fill="#e8a317"><circle cx="48" cy="34" r="2.5"/><circle cx="50" cy="46" r="2.5"/></g>');
  A('harp',
    '<path d="M26 80 V24 q30 6 44 50" fill="none" stroke="#b07d52" stroke-width="5"/>' +
    '<path d="M26 80 H70" stroke="#b07d52" stroke-width="5"/>' +
    '<g stroke="#ffd43b" stroke-width="2"><path d="M34 76 V32 M42 76 V40 M50 76 V50 M58 76 V60"/></g>');
  A('maracas',
    '<g><circle cx="34" cy="36" r="14" fill="#ff8787" stroke="#5b4636" stroke-width="3"/>' +
    '<rect x="30" y="48" width="8" height="22" rx="3" fill="#b07d52" stroke="#5b4636" stroke-width="2.5"/></g>' +
    '<g><circle cx="66" cy="42" r="14" fill="#ffd43b" stroke="#5b4636" stroke-width="3"/>' +
    '<rect x="62" y="54" width="8" height="22" rx="3" fill="#b07d52" stroke="#5b4636" stroke-width="2.5"/></g>');
  A('bell',
    '<path d="M50 18 a6 6 0 0 1 6 6 q16 6 16 30 q0 8 6 14 H22 q6-6 6-14 q0-24 16-30 a6 6 0 0 1 6-6 Z" fill="#ffd43b" stroke="#5b4636" stroke-width="3"/>' +
    '<circle cx="50" cy="80" r="5" fill="#e8a317" stroke="#5b4636" stroke-width="2.5"/>');
})(window.__ceAddIcon);

/* ---------------- 扩充：房间物品（第二批） ---------------- */
(function (A) {
  A('sofa',
    '<path d="M20 50 q0-10 10-10 h40 q10 0 10 10 v6 q-6 0-6 8 H26 q0-8-6-8 Z" fill="#ffa94d" stroke="#5b4636" stroke-width="3"/>' +
    '<rect x="18" y="56" width="64" height="16" rx="6" fill="#ffd8a8" stroke="#5b4636" stroke-width="3"/>' +
    '<path d="M24 72 v8 M76 72 v8" stroke="#5b4636" stroke-width="3"/>');
  A('tv',
    '<rect x="16" y="24" width="68" height="44" rx="6" fill="#495057" stroke="#5b4636" stroke-width="3"/>' +
    '<rect x="22" y="30" width="56" height="32" rx="3" fill="#74c0fc" stroke="#5b4636" stroke-width="2"/>' +
    '<path d="M40 76 h20 M50 68 v8" stroke="#5b4636" stroke-width="3"/>');
  A('mirror',
    '<rect x="30" y="16" width="40" height="60" rx="20" fill="#d3f3ff" stroke="#5b4636" stroke-width="3"/>' +
    '<path d="M40 30 q-4 8 0 18" fill="none" stroke="#fff" stroke-width="3"/>' +
    '<rect x="34" y="76" width="32" height="6" rx="2" fill="#b07d52" stroke="#5b4636" stroke-width="2"/>');
  A('cup',
    '<path d="M28 34 h36 v26 q0 12-18 12 q-18 0-18-12 Z" fill="#fff" stroke="#5b4636" stroke-width="3"/>' +
    '<path d="M64 40 q14 0 14 12 q0 12-14 12" fill="none" stroke="#5b4636" stroke-width="3"/>' +
    '<path d="M36 24 q4 6 0 8 M48 24 q4 6 0 8" stroke="#adb5bd" stroke-width="2.5" fill="none"/>');
  A('plate',
    '<circle cx="50" cy="52" r="34" fill="#fff" stroke="#5b4636" stroke-width="3"/>' +
    '<circle cx="50" cy="52" r="22" fill="none" stroke="#adb5bd" stroke-width="2.5"/>');
  A('fridge',
    '<rect x="28" y="16" width="44" height="68" rx="8" fill="#e9ecef" stroke="#5b4636" stroke-width="3"/>' +
    '<path d="M28 44 H72" stroke="#5b4636" stroke-width="2.5"/>' +
    '<path d="M36 26 v10 M36 52 v14" stroke="#868e96" stroke-width="4" stroke-linecap="round"/>');
  A('key',
    '<circle cx="32" cy="50" r="16" fill="none" stroke="#ffd43b" stroke-width="7"/>' +
    '<path d="M46 50 H82 M70 50 V62 M82 50 V62" stroke="#ffd43b" stroke-width="7" fill="none" stroke-linecap="round"/>');
})(window.__ceAddIcon);

/* ---------------- 扩充：颜色（第二批） ---------------- */
(function () {
  var more = { color_skyblue: '#a5d8ff', color_lime: '#c0eb75', color_gold: '#ffd700' };
  Object.keys(more).forEach(function (k) {
    window.__ceAddIcon(k,
      '<path d="M50 12 C66 38 80 54 80 68 a30 30 0 0 1-60 0 C20 54 34 38 50 12 Z" ' +
      'fill="' + more[k] + '" stroke="#5b4636" stroke-width="3"/>' +
      '<ellipse cx="40" cy="58" rx="7" ry="10" fill="#ffffff" opacity="0.5"/>');
  });
})();
