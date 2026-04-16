(() => {
  "use strict";

  const DB_NAME = "coconut-puzzle-v1";
  const DB_STORE = "photos";
  const DB_VERSION = 1;
  const MAX_HISTORY = 50;

  const $ = (sel, root = document) => root.querySelector(sel);

  /** @type {IDBDatabase | null} */
  let dbPromise = null;

  function openDb() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(DB_STORE)) {
          const s = db.createObjectStore(DB_STORE, { keyPath: "id" });
          s.createIndex("createdAt", "createdAt", { unique: false });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbPromise;
  }

  async function idbGetAll() {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(DB_STORE, "readonly");
      const s = tx.objectStore(DB_STORE);
      const req = s.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async function idbPut(entry) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(DB_STORE, "readwrite");
      tx.objectStore(DB_STORE).put(entry);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async function idbDelete(id) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(DB_STORE, "readwrite");
      tx.objectStore(DB_STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async function idbClear() {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(DB_STORE, "readwrite");
      tx.objectStore(DB_STORE).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  function uid() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }

  function hashSeed(str) {
    let h = 1779033703;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 3432918353);
      h >>>= 0;
    }
    return h >>> 0;
  }

  function mulberry32(seed) {
    return function () {
      let t = (seed += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function isLandscape() {
    return window.matchMedia("(orientation: landscape)").matches
      ? true
      : window.innerWidth > window.innerHeight;
  }

  function getGrid(pieceCount, landscape) {
    switch (pieceCount) {
      case 4:
        return { rows: 2, cols: 2 };
      case 8:
        return landscape ? { rows: 2, cols: 4 } : { rows: 4, cols: 2 };
      case 16:
        return { rows: 4, cols: 4 };
      case 32:
        return landscape ? { rows: 4, cols: 8 } : { rows: 8, cols: 4 };
      default:
        return { rows: 2, cols: 2 };
    }
  }

  function generateTabs(rows, cols, rng) {
    /** @type {number[][]} */
    const hTab = Array.from({ length: Math.max(0, rows - 1) }, () =>
      Array.from({ length: cols }, () => (rng() < 0.5 ? 1 : -1)),
    );
    /** @type {number[][]} */
    const vTab = Array.from({ length: rows }, () =>
      Array.from({ length: Math.max(0, cols - 1) }, () => (rng() < 0.5 ? 1 : -1)),
    );
    return { hTab, vTab };
  }

  /**
   * @param {number} r
   * @param {number} c
   * @param {number} Wc
   * @param {number} Hc
   * @param {number} R
   * @param {number} rows
   * @param {number} cols
   * @param {number[][]} hTab
   * @param {number[][]} vTab
   */
  function buildPiecePath(r, c, Wc, Hc, R, rows, cols, hTab, vTab) {
    const p = new Path2D();
    p.moveTo(0, 0);

    if (r === 0) {
      p.lineTo(Wc, 0);
    } else {
      const s = hTab[r - 1][c];
      if (s > 0) {
        p.lineTo(Wc / 2 - R, 0);
        p.arc(Wc / 2, 0, R, Math.PI, 0, false);
        p.lineTo(Wc, 0);
      } else {
        p.lineTo(Wc / 2 - R, 0);
        p.arc(Wc / 2, 0, R, 0, Math.PI, false);
        p.lineTo(Wc, 0);
      }
    }

    if (c === cols - 1) {
      p.lineTo(Wc, Hc);
    } else {
      const s = vTab[r][c];
      if (s > 0) {
        p.lineTo(Wc, Hc / 2 - R);
        p.arc(Wc, Hc / 2, R, -Math.PI / 2, Math.PI / 2, false);
        p.lineTo(Wc, Hc);
      } else {
        p.lineTo(Wc, Hc / 2 - R);
        p.arc(Wc, Hc / 2, R, Math.PI / 2, -Math.PI / 2, false);
        p.lineTo(Wc, Hc);
      }
    }

    if (r === rows - 1) {
      p.lineTo(0, Hc);
    } else {
      const s = hTab[r][c];
      if (s > 0) {
        p.lineTo(Wc / 2 + R, Hc);
        p.arc(Wc / 2, Hc, R, 0, Math.PI, false);
        p.lineTo(0, Hc);
      } else {
        p.lineTo(Wc / 2 + R, Hc);
        p.arc(Wc / 2, Hc, R, Math.PI, 0, false);
        p.lineTo(0, Hc);
      }
    }

    if (c === 0) {
      p.lineTo(0, 0);
    } else {
      const s = vTab[r][c - 1];
      if (s > 0) {
        p.lineTo(0, Hc / 2 + R);
        p.arc(0, Hc / 2, R, Math.PI / 2, -Math.PI / 2, false);
        p.lineTo(0, 0);
      } else {
        p.lineTo(0, Hc / 2 + R);
        p.arc(0, Hc / 2, R, Math.PI / 2, (3 * Math.PI) / 2, false);
        p.lineTo(0, 0);
      }
    }

    p.closePath();
    return p;
  }

  /**
   * @param {HTMLImageElement} img
   * @param {number} r
   * @param {number} c
   * @param {number} rows
   * @param {number} cols
   * @param {number[][]} hTab
   * @param {number[][]} vTab
   * @param {number} cellW
   * @param {number} cellH
   */
  function renderPieceCanvas(img, r, c, rows, cols, hTab, vTab, cellW, cellH) {
    const R = Math.max(6, Math.min(cellW, cellH) * 0.22);
    const pad = R;
    const Wc = cellW;
    const Hc = cellH;
    const path = buildPiecePath(r, c, Wc, Hc, R, rows, cols, hTab, vTab);

    const canvas = document.createElement("canvas");
    const w = Math.ceil(Wc + 2 * pad);
    const h = Math.ceil(Hc + 2 * pad);
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return canvas;

    ctx.save();
    ctx.translate(pad, pad);
    ctx.clip(path);

    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    const sw = iw / cols;
    const sh = ih / rows;
    const sx = c * sw;
    const sy = r * sh;
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, Wc, Hc);

    ctx.restore();

    ctx.save();
    ctx.translate(pad, pad);
    ctx.strokeStyle = "rgba(45, 32, 58, 0.28)";
    ctx.lineWidth = 1.25;
    ctx.stroke(path);
    ctx.restore();

    return canvas;
  }

  function formatTime(ms) {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${r.toString().padStart(2, "0")}`;
  }

  function showToast(msg) {
    const el = $("#toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => el.classList.remove("show"), 2200);
  }

  /** @type {{ id: string, blob: Blob, url: string, img: HTMLImageElement } | null} */
  let current = null;
  let selectedCount = 4;

  const screens = {
    home: $("#screen-home"),
    pick: $("#screen-pick"),
    play: $("#screen-play"),
  };

  function showScreen(name) {
    Object.entries(screens).forEach(([k, el]) => {
      el.classList.toggle("hidden", k !== name);
    });
  }

  async function trimHistoryIfNeeded() {
    const all = await idbGetAll();
    if (all.length <= MAX_HISTORY) return;
    all.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    const overflow = all.length - MAX_HISTORY;
    for (let i = 0; i < overflow; i++) {
      await idbDelete(all[i].id);
    }
  }

  async function saveBlobToHistory(blob) {
    const id = uid();
    const createdAt = Date.now();
    const entry = { id, createdAt, blob };
    await idbPut(entry);
    await trimHistoryIfNeeded();
    return entry;
  }

  function revokeCurrent() {
    if (current?.url && current.url.startsWith("blob:")) {
      URL.revokeObjectURL(current.url);
    }
    current = null;
  }

  /** 内置图（builtin 目录下静态资源，无需联网） */
  const BUILTIN = [
    {
      id: "196892a1a674898030b978214938382d",
      file: "196892a1a674898030b978214938382d.jpeg",
      label: "精选 1",
    },
    {
      id: "2dbf462603af71d62c78f2de33cb8259",
      file: "2dbf462603af71d62c78f2de33cb8259.jpeg",
      label: "精选 2",
    },
    {
      id: "42cad257ea0a79dafa5037ab05662886",
      file: "42cad257ea0a79dafa5037ab05662886.jpeg",
      label: "精选 3",
    },
    {
      id: "774098524a179c4d24a2ea0815e6a40f",
      file: "774098524a179c4d24a2ea0815e6a40f.jpg",
      label: "精选 4",
    },
    {
      id: "93c6c82d389226bb9cb4489c1cf91982",
      file: "93c6c82d389226bb9cb4489c1cf91982.jpg",
      label: "精选 5",
    },
    {
      id: "a35bbbd0996542e7b422af760d781e5f",
      file: "a35bbbd0996542e7b422af760d781e5f.png",
      label: "精选 6",
    },
  ];

  function builtinUrl(file) {
    return new URL(`builtin/${file}`, window.location.href).href;
  }

  function wireBuiltin() {
    const grid = $("#builtin-grid");
    if (!grid) return;
    grid.innerHTML = "";
    BUILTIN.forEach((b) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "builtin-tile";
      btn.setAttribute("role", "listitem");
      const img = document.createElement("img");
      img.src = builtinUrl(b.file);
      img.alt = "";
      img.width = 120;
      img.height = 120;
      const cap = document.createElement("span");
      cap.className = "builtin-cap";
      cap.textContent = b.label;
      btn.appendChild(img);
      btn.appendChild(cap);
      btn.addEventListener("click", async () => {
        try {
          revokeCurrent();
          const url = builtinUrl(b.file);
          const imgEl = new Image();
          await new Promise((resolve, reject) => {
            imgEl.onload = resolve;
            imgEl.onerror = reject;
            imgEl.src = url;
          });
          current = {
            id: `builtin-${b.id}`,
            blob: null,
            url,
            img: imgEl,
            isBuiltin: true,
          };
          setPickPreview(url);
          selectedCount = 4;
          applyDefaultPieceSelection();
          showScreen("pick");
          showToast(`已选：${b.label}`);
        } catch {
          showToast("内置图加载失败，请用本地服务器打开试试");
        }
      });
      grid.appendChild(btn);
    });
  }

  async function loadImageFromBlob(blob) {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = url;
    });
    return { url, img };
  }

  function setPickPreview(url) {
    const wrap = $("#pick-preview-wrap");
    wrap.innerHTML = "";
    const im = document.createElement("img");
    im.src = url;
    im.alt = "预览";
    wrap.appendChild(im);
  }

  function wireHome() {
    $("#file-input").addEventListener("change", async (e) => {
      const file = e.target.files && e.target.files[0];
      e.target.value = "";
      if (!file || !file.type.startsWith("image/")) {
        showToast("请选择一张图片～");
        return;
      }
      try {
        revokeCurrent();
        const blob = file;
        const { id } = await saveBlobToHistory(blob);
        const { url, img } = await loadImageFromBlob(blob);
        current = { id, blob, url, img, isBuiltin: false };
        setPickPreview(url);
        selectedCount = 4;
        applyDefaultPieceSelection();
        showScreen("pick");
        showToast("已保存到历史");
      } catch {
        showToast("读取图片失败");
      }
    });

    $("#btn-open-history").addEventListener("click", () => openHistory());
  }

  function wirePick() {
    $("#btn-pick-back").addEventListener("click", () => {
      revokeCurrent();
      showScreen("home");
    });

    $$("#count-grid .count-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        $$("#count-grid .count-btn").forEach((b) => b.classList.remove("selected"));
        btn.classList.add("selected");
        selectedCount = Number(btn.dataset.count);
        $("#btn-start-play").disabled = false;
      });
    });

    $("#btn-start-play").addEventListener("click", () => {
      if (!current) return;
      startPlay();
    });
  }

  function applyDefaultPieceSelection() {
    $$("#count-grid .count-btn").forEach((b) =>
      b.classList.toggle("selected", Number(b.dataset.count) === selectedCount),
    );
    $("#btn-start-play").disabled = false;
  }

  function $$(sel, root = document) {
    return Array.from(root.querySelectorAll(sel));
  }

  /** @type {ReturnType<typeof setInterval> | null} */
  let playTimer = null;
  let playStartedAt = 0;
  let moves = 0;

  /** @type {any} */
  let playState = null;

  function onOrientationWhilePlay() {
    if (!playState || !current) return;
    setTimeout(() => {
      if (!playState || !current) return;
      const landscape = isLandscape();
      if (landscape === playState.landscapeKey) return;
      showToast("方向变了，本局已按新布局重开～");
      $("#win-overlay").classList.add("hidden");
      startPlay();
    }, 280);
  }

  function stopPlayTimer() {
    if (playTimer) clearInterval(playTimer);
    playTimer = null;
  }

  function updateHud() {
    if (!playState) return;
    const elapsed = Date.now() - playStartedAt;
    $("#stat-time").textContent = `时间 ${formatTime(elapsed)}`;
    $("#stat-moves").textContent = `步数 ${moves}`;
    const total = playState.rows * playState.cols;
    $("#stat-progress").textContent = `进度 ${playState.lockedCount} / ${total}`;
  }

  function layoutBoardSize(img) {
    const inner = $("#board-inner");
    const frame = $("#board-frame");
    const maxW = Math.min(window.innerWidth - 36, 860);
    const maxH = Math.min(window.innerHeight * 0.48, 420);
    const ir = (img.naturalWidth || 1) / (img.naturalHeight || 1);
    let bw = maxW - 24;
    let bh = bw / ir;
    if (bh > maxH) {
      bh = maxH;
      bw = bh * ir;
    }
    inner.style.width = `${Math.round(bw)}px`;
    inner.style.height = `${Math.round(bh)}px`;
    frame.style.width = `${Math.round(bw + 20)}px`;
    const ghost = $("#ghost-img");
    ghost.src = current.url;
    ghost.classList.remove("off");
    $("#btn-toggle-ghost").setAttribute("aria-pressed", "true");
    return { bw: Math.round(bw), bh: Math.round(bh) };
  }

  function startPlay() {
    if (!current) return;
    const landscape = isLandscape();
    const { rows, cols } = getGrid(selectedCount, landscape);
    const seed = hashSeed(
      `${current.id}|${selectedCount}|${rows}x${cols}|${landscape ? "L" : "P"}`,
    );
    const rng = mulberry32(seed);
    const { hTab, vTab } = generateTabs(rows, cols, rng);

    const { bw, bh } = layoutBoardSize(current.img);
    const cellW = bw / cols;
    const cellH = bh / rows;
    const R = Math.max(6, Math.min(cellW, cellH) * 0.22);

    $("#slots-layer").innerHTML = "";
    $("#pieces-layer").innerHTML = "";
    $("#tray").innerHTML = "";
    $("#win-overlay").classList.add("hidden");

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const slot = document.createElement("div");
        slot.className = "slot";
        slot.style.left = `${c * cellW}px`;
        slot.style.top = `${r * cellH}px`;
        slot.style.width = `${cellW}px`;
        slot.style.height = `${cellH}px`;
        $("#slots-layer").appendChild(slot);
      }
    }

    moves = 0;
    playStartedAt = Date.now();
    stopPlayTimer();
    playTimer = setInterval(updateHud, 500);
    updateHud();

    /** @type {{ r: number, c: number, el: HTMLElement, locked: boolean }[]} */
    const pieces = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const canvas = renderPieceCanvas(
          current.img,
          r,
          c,
          rows,
          cols,
          hTab,
          vTab,
          cellW,
          cellH,
        );
        const el = document.createElement("div");
        el.className = "piece";
        el.dataset.r = String(r);
        el.dataset.c = String(c);
        const pw = canvas.width;
        const ph = canvas.height;
        el.style.width = `${pw}px`;
        el.style.height = `${ph}px`;
        el.appendChild(canvas);
        pieces.push({ r, c, el, locked: false });
      }
    }

    shuffleInPlace(pieces);
    const tray = $("#tray");
    const trayScale = Math.min(1, 200 / (cellW + 2 * R));
    for (const p of pieces) {
      p.el.style.position = "relative";
      p.el.style.left = "";
      p.el.style.top = "";
      p.el.style.transform = `scale(${trayScale})`;
      p.el.style.transformOrigin = "center center";
      tray.appendChild(p.el);
      wirePieceDrag(p, { rows, cols, cellW, cellH, R, trayScale });
    }

    playState = {
      rows,
      cols,
      cellW,
      cellH,
      R,
      hTab,
      vTab,
      trayScale,
      pieces,
      lockedCount: 0,
      landscapeKey: landscape,
    };

    showScreen("play");

    $("#btn-toggle-ghost").onclick = () => {
      const g = $("#ghost-img");
      const on = g.classList.toggle("off");
      $("#btn-toggle-ghost").setAttribute("aria-pressed", on ? "false" : "true");
    };

    $("#btn-reshuffle").onclick = () => {
      if (!playState) return;
      const unlocked = playState.pieces.filter((p) => !p.locked);
      shuffleInPlace(unlocked);
      unlocked.forEach((p) => {
        if (p.el.parentElement !== tray) tray.appendChild(p.el);
        p.el.style.position = "relative";
        p.el.style.left = "";
        p.el.style.top = "";
        p.el.style.transform = `scale(${playState.trayScale})`;
      });
      showToast("碎片已重新打乱");
    };

    $("#btn-play-back").onclick = () => {
      stopPlayTimer();
      playState = null;
      showScreen("pick");
      setPickPreview(current.url);
    };

    $("#btn-win-again").onclick = () => {
      $("#win-overlay").classList.add("hidden");
      startPlay();
    };

    $("#btn-win-home").onclick = () => {
      $("#win-overlay").classList.add("hidden");
      stopPlayTimer();
      playState = null;
      revokeCurrent();
      showScreen("home");
    };
  }

  function shuffleInPlace(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  /**
   * @param {{ r: number, c: number, el: HTMLElement, locked: boolean }} piece
   * @param {*} ctxp
   */
  function wirePieceDrag(piece, ctxp) {
    const { rows, cols, cellW, cellH, R, trayScale } = ctxp;
    const inner = $("#board-inner");
    const tray = $("#tray");

    let dragging = false;
    let startX = 0;
    let startY = 0;
    let origLeft = 0;
    let origTop = 0;
    /** @type {number | null} */
    let activePointer = null;

    const onDown = (ev) => {
      if (piece.locked) return;
      if (ev.button != null && ev.button !== 0) return;
      ev.preventDefault();
      dragging = true;
      activePointer = ev.pointerId;
      try {
        piece.el.setPointerCapture(ev.pointerId);
      } catch (_) {}
      piece.el.classList.add("dragging");
      const rect = piece.el.getBoundingClientRect();
      startX = ev.clientX;
      startY = ev.clientY;
      origLeft = rect.left;
      origTop = rect.top;

      document.body.appendChild(piece.el);
      piece.el.style.position = "fixed";
      piece.el.style.left = `${origLeft}px`;
      piece.el.style.top = `${origTop}px`;
      piece.el.style.transform = "scale(1)";
      piece.el.style.zIndex = "120";

      piece.el.addEventListener("pointermove", onMove);
      piece.el.addEventListener("pointerup", onUp);
      piece.el.addEventListener("pointercancel", onUp);
    };

    const onMove = (ev) => {
      if (!dragging || ev.pointerId !== activePointer) return;
      ev.preventDefault();
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      piece.el.style.left = `${origLeft + dx}px`;
      piece.el.style.top = `${origTop + dy}px`;
    };

    const onUp = (ev) => {
      if (!dragging) return;
      if (ev && ev.pointerId !== activePointer) return;
      dragging = false;
      try {
        if (ev && piece.el.hasPointerCapture(ev.pointerId)) {
          piece.el.releasePointerCapture(ev.pointerId);
        }
      } catch (_) {}
      activePointer = null;
      piece.el.classList.remove("dragging");

      piece.el.removeEventListener("pointermove", onMove);
      piece.el.removeEventListener("pointerup", onUp);
      piece.el.removeEventListener("pointercancel", onUp);

      if (!playState) {
        tray.appendChild(piece.el);
        piece.el.style.position = "relative";
        piece.el.style.left = "";
        piece.el.style.top = "";
        piece.el.style.transform = `scale(${trayScale})`;
        piece.el.style.zIndex = "";
        return;
      }

      const layer = $("#pieces-layer");
      const innerRect = inner.getBoundingClientRect();
      const pr = piece.el.getBoundingClientRect();
      const px = pr.left + pr.width / 2;
      const py = pr.top + pr.height / 2;

      const bx = px - innerRect.left;
      const by = py - innerRect.top;

      const tr = piece.r;
      const tc = piece.c;
      const tx = tc * cellW + cellW / 2;
      const ty = tr * cellH + cellH / 2;

      const dist = Math.hypot(bx - tx, by - ty);
      const snap = Math.min(cellW, cellH) * 0.22;

      moves += 1;
      updateHud();

      if (dist <= snap) {
        piece.locked = true;
        piece.el.classList.add("locked");
        layer.appendChild(piece.el);
        piece.el.style.position = "absolute";
        piece.el.style.left = `${tc * cellW - R}px`;
        piece.el.style.top = `${tr * cellH - R}px`;
        piece.el.style.transform = "none";
        piece.el.style.zIndex = "5";
        playState.lockedCount += 1;
        updateHud();
        if (playState.lockedCount >= rows * cols) {
          stopPlayTimer();
          const elapsed = Date.now() - playStartedAt;
          $("#win-meta").textContent = `用时 ${formatTime(elapsed)} · 步数 ${moves}`;
          $("#win-overlay").classList.remove("hidden");
        }
      } else {
        tray.appendChild(piece.el);
        piece.el.style.position = "relative";
        piece.el.style.left = "";
        piece.el.style.top = "";
        piece.el.style.transform = `scale(${trayScale})`;
        piece.el.style.zIndex = "";
      }
    };

    piece.el.addEventListener("pointerdown", onDown);
  }

  async function openHistory() {
    const ov = $("#history-overlay");
    const list = $("#history-list");
    const empty = $("#history-empty");
    ov.classList.remove("hidden");
    ov.setAttribute("aria-hidden", "false");

    const refresh = async () => {
      const all = await idbGetAll();
      all.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      list.innerHTML = "";
      if (!all.length) {
        empty.classList.remove("hidden");
        return;
      }
      empty.classList.add("hidden");
      for (const item of all) {
        const card = document.createElement("div");
        card.className = "history-item";
        const url = URL.createObjectURL(item.blob);
        const img = document.createElement("img");
        img.src = url;
        img.alt = "历史缩略";
        const meta = document.createElement("div");
        meta.className = "hi-meta";
        const d = new Date(item.createdAt);
        meta.textContent = d.toLocaleString();
        const actions = document.createElement("div");
        actions.className = "hi-actions";
        const use = document.createElement("button");
        use.type = "button";
        use.textContent = "使用";
        use.addEventListener("click", async () => {
          try {
            revokeCurrent();
            const { url: u, img } = await loadImageFromBlob(item.blob);
            current = { id: item.id, blob: item.blob, url: u, img, isBuiltin: false };
            setPickPreview(u);
            URL.revokeObjectURL(url);
            ov.classList.add("hidden");
            showScreen("pick");
            selectedCount = 4;
            applyDefaultPieceSelection();
          } catch {
            showToast("加载失败");
          }
        });
        const del = document.createElement("button");
        del.type = "button";
        del.className = "danger";
        del.textContent = "删除";
        del.addEventListener("click", async () => {
          if (current && current.id === item.id) revokeCurrent();
          await idbDelete(item.id);
          URL.revokeObjectURL(url);
          showToast("已删除");
          refresh();
        });
        actions.appendChild(use);
        actions.appendChild(del);
        card.appendChild(img);
        card.appendChild(meta);
        card.appendChild(actions);
        list.appendChild(card);
      }
    };

    await refresh();

    $("#btn-history-close").onclick = () => {
      ov.classList.add("hidden");
      ov.setAttribute("aria-hidden", "true");
      $$(".history-item img").forEach((im) => {
        if (im.src.startsWith("blob:")) URL.revokeObjectURL(im.src);
      });
    };

    $("#btn-history-clear").onclick = async () => {
      if (!confirm("确定清空全部历史？此操作不可恢复。")) return;
      revokeCurrent();
      await idbClear();
      showToast("历史已清空");
      await refresh();
    };
  }

  function init() {
    wireHome();
    wireBuiltin();
    wirePick();
    window.addEventListener("orientationchange", onOrientationWhilePlay);
    showScreen("home");
  }

  init();
})();
