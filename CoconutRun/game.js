const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");
const gameShell = document.querySelector(".game-shell");
const arenaWrap = document.querySelector(".arena-wrap");

const overlay = document.getElementById("overlay");
const startBtn = document.getElementById("start-btn");
const statusEl = document.getElementById("status");
const toastEl = document.getElementById("toast");
const leftBtn = document.getElementById("left-btn");
const rightBtn = document.getElementById("right-btn");
const jumpBtn = document.getElementById("jump-btn");
const mobilePauseBtn = document.getElementById("mobile-pause-btn");

const livesEl = document.getElementById("lives");
const coinsEl = document.getElementById("coins");
const scoreEl = document.getElementById("score");
const speedEl = document.getElementById("speed");

const AVATAR_PATHS = {
  coconut: "./assets/coconut_source.png",
  mango: "./assets/mango_source.png",
};

let idleSceneMessage = "按“开始游戏”启动";
let reduceMotionMq = null;

const state = {
  running: false,
  paused: false,
  gameOver: false,
  lane: 1,
  laneVisual: 1,
  jumpHeight: 0,
  jumpVelocity: 0,
  lives: 5,
  coins: 0,
  score: 0,
  speedFactor: 1,
  elapsedMs: 0,
  lastTs: 0,
  invincibleUntil: 0,
  toastTimer: 0,
  shake: 0,
  entities: {
    obstacles: [],
    coins: [],
    powers: [],
  },
  effects: {
    shieldUntil: 0,
    magnetUntil: 0,
    doubleUntil: 0,
    slowUntil: 0,
  },
  spawns: {
    obstacleAt: 0,
    coinAt: 0,
    powerAt: 0,
    lastObstacleLane: null,
  },
  mango: {
    active: false,
    x: 0,
    y: 0,
    vx: 0,
    text: "",
    until: 0,
    nextAt: 0,
  },
};

const assets = {
  coconutAvatar: null,
  mangoAvatar: null,
};

let touchStartX = null;
let touchStartY = null;

init();

async function init() {
  idleSceneMessage = "正在加载头像素材...";
  resizeCanvas();
  bindEvents();
  setStatus("正在准备头像与赛道...");

  try {
    const [coconutImg, mangoImg] = await Promise.all([
      loadImage(AVATAR_PATHS.coconut),
      loadImage(AVATAR_PATHS.mango),
    ]);

    const coconutCrop = await detectFaceCrop(coconutImg);
    const mangoCrop = await detectFaceCrop(mangoImg);

    assets.coconutAvatar = buildRoundAvatar(coconutImg, coconutCrop);
    assets.mangoAvatar = buildRoundAvatar(mangoImg, mangoCrop);

    setStatus("头像已就位，准备开跑！");
    startBtn.disabled = false;
    idleSceneMessage = "按“开始游戏”启动";
    drawIdleScene(idleSceneMessage);
  } catch (error) {
    idleSceneMessage = "素材加载失败，请检查图片路径。";
    drawIdleScene(idleSceneMessage);
    setStatus("素材加载失败，请检查图片路径。");
    console.error(error);
  }
}

function bindEvents() {
  window.addEventListener("resize", resizeCanvas);
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", resizeCanvas);
  }

  window.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    if (event.key === "Escape") {
      event.preventDefault();
      togglePause();
      return;
    }
    if (key === "r") {
      if (!startBtn.disabled) {
        event.preventDefault();
        startGame();
      }
      return;
    }
    if (key === "arrowleft" || key === "a") {
      moveLane(-1);
    } else if (key === "arrowright" || key === "d") {
      moveLane(1);
    } else if (key === "arrowup" || key === "w" || key === "j") {
      jump();
    } else if (key === "arrowdown" || key === "s") {
      if (!event.repeat) fastFall();
    } else if (key === " ") {
      event.preventDefault();
      togglePause();
    }
  });

  startBtn.addEventListener("click", () => {
    if (!state.running || state.gameOver) {
      startGame();
    }
  });

  leftBtn.addEventListener("click", () => moveLane(-1));
  jumpBtn.addEventListener("click", () => jump());
  rightBtn.addEventListener("click", () => moveLane(1));
  mobilePauseBtn.addEventListener("click", () => togglePause());

  arenaWrap.addEventListener("touchstart", (event) => {
    if (event.target.closest("button")) return;
    if (event.touches.length > 0) {
      touchStartX = event.touches[0].clientX;
      touchStartY = event.touches[0].clientY;
    }
  });

  arenaWrap.addEventListener("touchend", (event) => {
    if (event.target.closest("button")) return;
    if (touchStartX == null) return;
    const endX = event.changedTouches[0].clientX;
    const endY = event.changedTouches[0].clientY;
    const delta = endX - touchStartX;
    const deltaY = endY - touchStartY;
    const absX = Math.abs(delta);
    const absY = Math.abs(deltaY);
    const swipePx = 26;

    if (state.jumpHeight > 12 && deltaY > swipePx && absY > absX) {
      fastFall();
    } else if (absX > swipePx && absX > absY) {
      moveLane(delta > 0 ? 1 : -1);
    } else if (deltaY < -swipePx && absY >= absX) {
      jump();
    } else if (absX <= 18 && absY <= 18) {
      jump();
    }

    touchStartX = null;
    touchStartY = null;
  });

  // 手机上防止游戏区域滚动抢手势
  arenaWrap.addEventListener(
    "touchmove",
    (event) => {
      if (window.matchMedia("(max-width: 720px)").matches) {
        event.preventDefault();
      }
    },
    { passive: false }
  );

  gameShell.addEventListener(
    "touchmove",
    (event) => {
      if (window.matchMedia("(max-width: 720px)").matches && state.running) {
        event.preventDefault();
      }
    },
    { passive: false }
  );
}

function startGame() {
  state.running = true;
  state.paused = false;
  state.gameOver = false;
  state.lane = 1;
  state.laneVisual = 1;
  state.jumpHeight = 0;
  state.jumpVelocity = 0;
  state.lives = 5;
  state.coins = 0;
  state.score = 0;
  state.speedFactor = 1;
  state.elapsedMs = 0;
  state.lastTs = 0;
  state.invincibleUntil = 0;
  state.toastTimer = 0;
  state.shake = 0;
  state.entities.obstacles = [];
  state.entities.coins = [];
  state.entities.powers = [];
  state.effects.shieldUntil = 0;
  state.effects.magnetUntil = 0;
  state.effects.doubleUntil = 0;
  state.effects.slowUntil = 0;

  const now = performance.now();
  state.spawns.obstacleAt = now + 500;
  state.spawns.coinAt = now + 250;
  state.spawns.powerAt = now + 6200;
  state.spawns.lastObstacleLane = null;
  state.mango.nextAt = now + randomBetween(9000, 17000);
  state.mango.active = false;

  overlay.classList.remove("show");
  startBtn.textContent = "再来一局";
  mobilePauseBtn.textContent = "暂停";
  showToast("冲鸭！椰子开始跑酷啦");
  syncHud();
  requestAnimationFrame(gameLoop);
}

function gameLoop(ts) {
  if (!state.running) return;

  if (!state.lastTs) state.lastTs = ts;
  const dt = Math.min((ts - state.lastTs) / 1000, 0.034);
  state.lastTs = ts;

  if (!state.paused && !state.gameOver) {
    update(dt, ts);
  }

  render();
  if (state.running) requestAnimationFrame(gameLoop);
}

function update(dt, now) {
  state.elapsedMs += dt * 1000;
  state.speedFactor = Math.min(4.2, 1 + state.elapsedMs / 47000);
  state.laneVisual += (state.lane - state.laneVisual) * Math.min(1, dt * 11);
  state.shake = Math.max(0, state.shake - dt * 2.2);
  state.jumpHeight = Math.max(0, state.jumpHeight + state.jumpVelocity * dt);
  state.jumpVelocity -= 1880 * dt;
  if (state.jumpHeight === 0 && state.jumpVelocity < 0) {
    state.jumpVelocity = 0;
  }

  const worldSpeed = baseScrollSpeed(now) * dt;
  const playerY = canvas.height * 0.84 - state.jumpHeight;
  const playerX = laneX(state.laneVisual, playerY);

  maybeSpawn(now);
  updateMango(now, dt);

  for (const item of state.entities.obstacles) {
    item.y += worldSpeed * item.speedMul;
  }
  for (const coin of state.entities.coins) {
    coin.y += worldSpeed * coin.speedMul;
    if (isEffectActive("magnetUntil", now)) {
      const coinX = laneX(coin.lane, coin.y);
      const dx = playerX - coinX;
      const dy = playerY - coin.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 220) {
        coin.magnetX = (coin.magnetX || coinX) + dx * dt * 6.5;
        coin.y += dy * dt * 1.4;
      }
    }
  }
  for (const item of state.entities.powers) {
    item.y += worldSpeed * item.speedMul;
  }

  state.entities.obstacles = state.entities.obstacles.filter((item) => item.y < canvas.height + 100);
  state.entities.coins = state.entities.coins.filter((item) => item.y < canvas.height + 100);
  state.entities.powers = state.entities.powers.filter((item) => item.y < canvas.height + 100);

  handleCollisions(now, playerX, playerY, state.jumpHeight);
  syncHud();
}

function maybeSpawn(now) {
  if (now >= state.spawns.obstacleAt && state.entities.obstacles.length < 8) {
    spawnObstacle();
    const min = Math.max(620, 1120 - state.speedFactor * 90);
    const max = Math.max(980, 1500 - state.speedFactor * 110);
    state.spawns.obstacleAt = now + randomBetween(min, max);
  }

  if (now >= state.spawns.coinAt && state.entities.coins.length < 18) {
    spawnCoin();
    state.spawns.coinAt = now + randomBetween(380, 700);
  }

  if (now >= state.spawns.powerAt && state.entities.powers.length < 3) {
    spawnPower();
    state.spawns.powerAt = now + randomBetween(10000, 16500);
  }
}

function spawnObstacle() {
  const nearHorizonY = canvas.height * 0.18;
  const y = nearHorizonY + randomBetween(-6, 12);
  state.entities.obstacles.push({
    lane: pickObstacleLane(y),
    y,
    speedMul: randomBetween(0.88, 1.12),
    type: Math.random() < 0.5 ? "cone" : "box",
  });
}

function pickObstacleLane(newY) {
  const minDy = 46 + state.speedFactor * 10;
  const blocked = new Set();
  for (const o of state.entities.obstacles) {
    if (Math.abs(o.y - newY) < minDy) {
      blocked.add(o.lane);
    }
  }
  let candidates = [0, 1, 2].filter((l) => !blocked.has(l));
  if (candidates.length === 0) {
    candidates = [0, 1, 2];
  }
  const last = state.spawns.lastObstacleLane;
  if (last !== null && candidates.length > 1) {
    const noRepeat = candidates.filter((l) => l !== last);
    if (noRepeat.length) {
      candidates = noRepeat;
    }
  }
  const lane = candidates[Math.floor(Math.random() * candidates.length)];
  state.spawns.lastObstacleLane = lane;
  return lane;
}

function pickLaneAvoidingObstacles(y, minDy) {
  const blocked = new Set();
  for (const o of state.entities.obstacles) {
    if (Math.abs(o.y - y) < minDy) {
      blocked.add(o.lane);
    }
  }
  const candidates = [0, 1, 2].filter((l) => !blocked.has(l));
  if (candidates.length) {
    return candidates[Math.floor(Math.random() * candidates.length)];
  }
  return randomLane();
}

function spawnCoin() {
  const nearHorizonY = canvas.height * 0.18;
  const count = Math.random() < 0.3 ? 2 : 1;
  for (let i = 0; i < count; i += 1) {
    const y = nearHorizonY - i * 18 + randomBetween(-4, 6);
    state.entities.coins.push({
      lane: pickLaneAvoidingObstacles(y, 36),
      y,
      speedMul: randomBetween(0.95, 1.18),
      magnetX: null,
    });
  }
}

function spawnPower() {
  const pool = ["shield", "magnet", "double", "heal"];
  const type = pool[Math.floor(Math.random() * pool.length)];
  const nearHorizonY = canvas.height * 0.18;
  const y = nearHorizonY + randomBetween(-4, 8);
  state.entities.powers.push({
    lane: pickLaneAvoidingObstacles(y, 42),
    y,
    speedMul: 1,
    type,
  });
}

function updateMango(now, dt) {
  if (!state.mango.active && now >= state.mango.nextAt) {
    triggerMangoBoost(now);
  }

  if (!state.mango.active) return;

  state.mango.x += state.mango.vx * dt;
  if (now > state.mango.until || state.mango.x > canvas.width + 80) {
    state.mango.active = false;
  }
}

function triggerMangoBoost(now) {
  const boosts = [
    {
      text: "芒果祝福：+1 生命",
      apply: () => {
        state.lives = Math.min(5, state.lives + 1);
      },
    },
    {
      text: "芒果祝福：障碍清空",
      apply: () => {
        state.entities.obstacles = [];
      },
    },
    {
      text: "芒果祝福：护盾 9 秒",
      apply: () => {
        state.effects.shieldUntil = now + 9000;
      },
    },
    {
      text: "芒果祝福：磁铁吸金 10 秒",
      apply: () => {
        state.effects.magnetUntil = now + 10000;
      },
    },
    {
      text: "芒果祝福：金币雨 +25",
      apply: () => {
        state.coins += 25;
        state.score += 150;
      },
    },
    {
      text: "芒果祝福：慢速安全模式 8 秒",
      apply: () => {
        state.effects.slowUntil = now + 8000;
      },
    },
  ];

  const boost = boosts[Math.floor(Math.random() * boosts.length)];
  boost.apply();
  showToast(boost.text);

  state.mango.active = true;
  state.mango.text = boost.text;
  state.mango.x = -78;
  state.mango.y = canvas.height * 0.27;
  state.mango.vx = randomBetween(170, 250);
  state.mango.until = now + 4200;
  state.mango.nextAt = now + randomBetween(11000, 22000);
}

function handleCollisions(now, playerX, playerY, jumpHeight) {
  const isShield = isEffectActive("shieldUntil", now);
  const isDouble = isEffectActive("doubleUntil", now);

  const obstacleRemain = [];
  for (const item of state.entities.obstacles) {
    const itemX = laneX(item.lane, item.y);
    const closeY = Math.abs(item.y - playerY) < 42;
    const closeX = Math.abs(itemX - playerX) < 40;
    const jumpedOver = jumpHeight > 58;
    if (closeY && closeX) {
      if (jumpedOver) {
        state.score += 30;
        continue;
      }
      if (isShield) {
        state.score += 45;
        continue;
      }
      if (now > state.invincibleUntil) {
        state.lives -= 1;
        state.invincibleUntil = now + 1250;
        state.shake = 0.45;
        showToast("撞到了障碍，注意换道！");
        if (state.lives <= 0) {
          endGame();
          return;
        }
      }
      continue;
    }
    obstacleRemain.push(item);
  }
  state.entities.obstacles = obstacleRemain;

  const coinRemain = [];
  for (const coin of state.entities.coins) {
    const coinX = coin.magnetX == null ? laneX(coin.lane, coin.y) : coin.magnetX;
    const got = Math.hypot(coinX - playerX, coin.y - playerY) < 38;
    if (got) {
      state.coins += isDouble ? 2 : 1;
      state.score += isDouble ? 24 : 12;
      continue;
    }
    coinRemain.push(coin);
  }
  state.entities.coins = coinRemain;

  const powerRemain = [];
  for (const item of state.entities.powers) {
    const itemX = laneX(item.lane, item.y);
    const got = Math.hypot(itemX - playerX, item.y - playerY) < 42;
    if (got) {
      applyPower(item.type, now);
      continue;
    }
    powerRemain.push(item);
  }
  state.entities.powers = powerRemain;
}

function applyPower(type, now) {
  if (type === "shield") {
    state.effects.shieldUntil = now + 7000;
    showToast("获得护盾，撞到障碍也不掉命！");
  } else if (type === "magnet") {
    state.effects.magnetUntil = now + 9000;
    showToast("获得磁铁，自动吸金币！");
  } else if (type === "double") {
    state.effects.doubleUntil = now + 9000;
    showToast("双倍金币开启！");
  } else if (type === "heal") {
    state.lives = Math.min(5, state.lives + 1);
    showToast("补给包：生命 +1");
  }
}

function endGame() {
  state.gameOver = true;
  state.running = false;
  mobilePauseBtn.textContent = "暂停";
  overlay.classList.add("show");
  setStatus(`游戏结束：分数 ${Math.floor(state.score)}，金币 ${state.coins}`);
  startBtn.textContent = "重新开始";
  showToast("本局结束，点击重新开始");
}

function togglePause() {
  if (!state.running || state.gameOver) return;
  state.paused = !state.paused;
  mobilePauseBtn.textContent = state.paused ? "继续" : "暂停";
  showToast(state.paused ? "已暂停" : "继续冲刺");
}

function moveLane(dir) {
  if (!state.running || state.paused || state.gameOver) return;
  const next = clamp(state.lane + dir, 0, 2);
  if (next !== state.lane) {
    state.lane = next;
  }
}

function jump() {
  if (!state.running || state.paused || state.gameOver) return;
  if (state.jumpHeight > 3) return;
  state.jumpVelocity = 840;
}

function fastFall() {
  if (!state.running || state.paused || state.gameOver) return;
  if (state.jumpHeight < 14) return;
  state.jumpVelocity = -3400;
}

function render() {
  const motionScale = prefersReducedMotion() ? 0.22 : 1;
  const shakeX = (Math.random() - 0.5) * 16 * state.shake * motionScale;
  const shakeY = (Math.random() - 0.5) * 12 * state.shake * motionScale;
  ctx.save();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.translate(shakeX, shakeY);

  drawBackground();
  drawTrack();
  drawCoins();
  drawObstacles();
  drawPowers();
  drawPlayer();
  drawMango();
  drawEffectsBadges();

  if (state.paused) {
    drawPauseLayer();
  }

  ctx.restore();
}

function drawIdleScene(tip) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();
  drawTrack();
  ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
  roundRect(ctx, canvas.width * 0.27, canvas.height * 0.43, canvas.width * 0.46, 74, 18);
  ctx.fill();
  ctx.fillStyle = "#7c4e86";
  ctx.font = `700 ${Math.floor(canvas.height * 0.03)}px sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText(tip, canvas.width / 2, canvas.height * 0.49);
}

function drawBackground() {
  const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
  g.addColorStop(0, "#80dfff");
  g.addColorStop(0.42, "#c6f1ff");
  g.addColorStop(0.68, "#ffeec2");
  g.addColorStop(1, "#ffd1ad");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawMountainLayer(0.52, "#e8c3ff", 0.12, 65);
  drawMountainLayer(0.58, "#d5aff2", 0.08, 85);
  drawCityBlocks();

  for (let i = 0; i < 8; i += 1) {
    const x = (i / 8) * canvas.width + ((state.elapsedMs / 16) % 120) - 120;
    const y = 30 + (i % 3) * 35;
    drawCloud(x, y, 0.9 + (i % 2) * 0.25);
  }
}

function drawTrack() {
  const topY = canvas.height * 0.17;
  const bottomY = canvas.height * 0.98;
  const topHalf = canvas.width * 0.12;
  const bottomHalf = canvas.width * 0.36;
  const cx = canvas.width / 2;

  const leftWallTop = cx - topHalf - 24;
  const leftWallBottom = cx - bottomHalf - 42;
  const rightWallTop = cx + topHalf + 24;
  const rightWallBottom = cx + bottomHalf + 42;

  ctx.fillStyle = "rgba(124, 84, 136, 0.55)";
  ctx.beginPath();
  ctx.moveTo(cx - topHalf, topY);
  ctx.lineTo(leftWallTop, topY);
  ctx.lineTo(leftWallBottom, bottomY);
  ctx.lineTo(cx - bottomHalf, bottomY);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + topHalf, topY);
  ctx.lineTo(rightWallTop, topY);
  ctx.lineTo(rightWallBottom, bottomY);
  ctx.lineTo(cx + bottomHalf, bottomY);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(cx - topHalf, topY);
  ctx.lineTo(cx + topHalf, topY);
  ctx.lineTo(cx + bottomHalf, bottomY);
  ctx.lineTo(cx - bottomHalf, bottomY);
  ctx.closePath();
  const road = ctx.createLinearGradient(0, topY, 0, bottomY);
  road.addColorStop(0, "#8661a4");
  road.addColorStop(0.55, "#4b325d");
  road.addColorStop(1, "#241a2d");
  ctx.fillStyle = road;
  ctx.fill();

  const tileRows = 16;
  for (let i = 0; i < tileRows; i += 1) {
    const t0 = (i / tileRows + (state.elapsedMs / 1400)) % 1;
    const t1 = ((i + 1) / tileRows + (state.elapsedMs / 1400)) % 1;
    const y0 = lerp(topY, bottomY, t0);
    const y1 = lerp(topY, bottomY, t1);
    const half0 = lerp(topHalf, bottomHalf, t0);
    const half1 = lerp(topHalf, bottomHalf, t1);
    const laneShade = i % 2 === 0 ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.02)";
    ctx.fillStyle = laneShade;
    ctx.beginPath();
    ctx.moveTo(cx - half0, y0);
    ctx.lineTo(cx + half0, y0);
    ctx.lineTo(cx + half1, y1);
    ctx.lineTo(cx - half1, y1);
    ctx.closePath();
    ctx.fill();
  }

  ctx.strokeStyle = "rgba(255,255,255,0.14)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx - topHalf / 3, topY);
  ctx.lineTo(cx - bottomHalf / 3, bottomY);
  ctx.moveTo(cx + topHalf / 3, topY);
  ctx.lineTo(cx + bottomHalf / 3, bottomY);
  ctx.stroke();

  ctx.strokeStyle = "rgba(255,255,255,0.48)";
  ctx.lineWidth = 4;
  ctx.setLineDash([22, 20]);
  ctx.lineDashOffset = -(state.elapsedMs / 22);
  ctx.beginPath();
  ctx.moveTo(cx, topY + 6);
  ctx.lineTo(cx, bottomY);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = "rgba(255,255,255,0.16)";
  ctx.fillRect(cx - topHalf - 2, topY - 2, topHalf * 2 + 4, 5);
}

function drawObstacles() {
  for (const item of state.entities.obstacles) {
    const x = laneX(item.lane, item.y);
    const size = perspective(item.y, 18, 60);
    const shadowW = size * 0.72;
    const shadowH = size * 0.22;

    ctx.fillStyle = "rgba(0, 0, 0, 0.22)";
    ctx.beginPath();
    ctx.ellipse(x, item.y + size * 0.68, shadowW, shadowH, 0, 0, Math.PI * 2);
    ctx.fill();

    if (item.type === "cone") {
      ctx.fillStyle = "#ff8a65";
      ctx.beginPath();
      ctx.moveTo(x, item.y - size * 0.75);
      ctx.lineTo(x - size * 0.6, item.y + size * 0.7);
      ctx.lineTo(x + size * 0.6, item.y + size * 0.7);
      ctx.closePath();
      ctx.fill();
    } else {
      roundRect(ctx, x - size * 0.6, item.y - size * 0.45, size * 1.2, size * 0.9, 8);
      const boxGrad = ctx.createLinearGradient(x - size * 0.6, item.y, x + size * 0.6, item.y);
      boxGrad.addColorStop(0, "#bf3f52");
      boxGrad.addColorStop(1, "#ff6e6e");
      ctx.fillStyle = boxGrad;
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.fillRect(x - size * 0.52, item.y - size * 0.35, size * 0.42, size * 0.7);
    }

    ctx.fillStyle = "rgba(255,255,255,0.65)";
    ctx.fillRect(x - size * 0.3, item.y - 2, size * 0.6, 3);
  }
}

function drawCoins() {
  for (const coin of state.entities.coins) {
    const x = coin.magnetX == null ? laneX(coin.lane, coin.y) : coin.magnetX;
    const r = perspective(coin.y, 6, 16);
    ctx.fillStyle = "rgba(0,0,0,0.16)";
    ctx.beginPath();
    ctx.ellipse(x, coin.y + r * 0.96, r * 0.82, r * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.fillStyle = "#ffd54f";
    ctx.arc(x, coin.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.fillStyle = "#fff8d0";
    ctx.arc(x, coin.y, r * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPowers() {
  const icons = {
    shield: "🛡️",
    magnet: "🧲",
    double: "x2",
    heal: "❤",
  };

  for (const item of state.entities.powers) {
    const x = laneX(item.lane, item.y);
    const size = perspective(item.y, 14, 30);
    roundRect(ctx, x - size * 0.62, item.y - size * 0.6, size * 1.24, size * 1.2, 10);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.strokeStyle = "#87c8ff";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#2f557a";
    ctx.font = `700 ${Math.floor(size * 0.64)}px sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(icons[item.type], x, item.y + size * 0.22);
  }
}

function drawPlayer() {
  const y = canvas.height * 0.84 - state.jumpHeight;
  const x = laneX(state.laneVisual, y);
  const scale = 1 + state.jumpHeight / 360;
  const runCycle = (state.elapsedMs / 1000) * (Math.PI * 2) * 4.2;
  const onGround = state.jumpHeight < 10;
  const bob = onGround ? Math.sin(runCycle * 2) * 2.4 * scale : Math.sin(state.elapsedMs / 200) * 0.8 * scale;
  ctx.save();
  if (performance.now() < state.invincibleUntil) {
    ctx.globalAlpha = 0.68 + Math.sin(state.elapsedMs / 90) * 0.22;
  }
  drawChibiRunner({
    x,
    y: y + bob,
    scale,
    bodyMain: "#f7d73d",
    bodySub: "#2f7b4e",
    accent: "#ffffff",
    avatar: assets.coconutAvatar,
    legPhase: runCycle,
    jumpHeight: state.jumpHeight,
  });
  ctx.restore();

  if (isEffectActive("shieldUntil")) {
    const ringY = y + bob - 28 * scale;
    ctx.strokeStyle = "rgba(79, 195, 247, 0.85)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(x, ringY, 40 * scale + Math.sin(state.elapsedMs / 90) * 3.2, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawChibiRunner({ x, y, scale, bodyMain, bodySub, accent, avatar, legPhase, jumpHeight }) {
  const headSize = 50 * scale;
  const torsoW = 40 * scale;
  const torsoH = 46 * scale;
  const torsoTop = y - 25 * scale;
  const torsoBottom = torsoTop + torsoH;
  const torsoCx = x;
  const torsoCy = (torsoTop + torsoBottom) / 2;
  const onGround = jumpHeight < 10;
  const air = clamp(jumpHeight / 95, 0, 1);

  const groundFeetY = y + 36 * scale;
  const shadA = 0.12 + air * 0.1 + (onGround ? 0.06 : 0);
  const shadRx = Math.max(11 * scale, (21 - jumpHeight * 0.045) * scale);
  const shadRy = Math.max(4 * scale, (8.5 - jumpHeight * 0.018) * scale);
  ctx.fillStyle = `rgba(0, 0, 0, ${shadA})`;
  ctx.beginPath();
  ctx.ellipse(x, groundFeetY + 2 * scale, shadRx, shadRy, 0, 0, Math.PI * 2);
  ctx.fill();

  const lean = onGround ? 0.11 * Math.sin(legPhase * 2) : -0.07 - air * 0.05;

  const s = Math.sin(legPhase);
  const c = Math.cos(legPhase);
  const hipSpread = 8.2 * scale;
  const shin = 15 * scale;

  ctx.save();
  ctx.translate(torsoCx, torsoCy);
  ctx.rotate(lean);
  ctx.translate(-torsoCx, -torsoCy);

  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (onGround) {
    drawRunnerLegSegments(x - hipSpread, torsoBottom, -s, c, shin, groundFeetY, scale, bodySub);
    drawRunnerLegSegments(x + hipSpread, torsoBottom, s, c, shin, groundFeetY, scale, bodySub);
  } else {
    drawJumpLegs(x, torsoBottom, scale, bodySub, air, groundFeetY, s);
  }

  roundRect(ctx, x - torsoW / 2, torsoTop, torsoW, torsoH, 11 * scale);
  const shirtGrad = ctx.createLinearGradient(x - torsoW / 2, torsoTop, x + torsoW / 2, torsoBottom);
  shirtGrad.addColorStop(0, bodyMain);
  shirtGrad.addColorStop(0.55, bodyMain);
  shirtGrad.addColorStop(1, bodySub);
  ctx.fillStyle = shirtGrad;
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.08)";
  ctx.lineWidth = 1.2 * scale;
  ctx.stroke();

  ctx.fillStyle = accent;
  ctx.fillRect(x - torsoW / 2, torsoTop + torsoH * 0.52, torsoW, 4.5 * scale);

  const shoulderY = torsoTop + 15 * scale;
  const shoulderLX = x - torsoW * 0.38;
  const shoulderRX = x + torsoW * 0.38;
  const armThick = 4.8 * scale;
  const upperArm = 13 * scale;
  const foreArm = 12 * scale;

  if (onGround) {
    const opp = -s;
    drawRunnerArm(shoulderLX, shoulderY, opp, scale, bodySub, armThick, upperArm, foreArm, -1);
    drawRunnerArm(shoulderRX, shoulderY, -opp, scale, bodySub, armThick, upperArm, foreArm, 1);
  } else {
    drawJumpArms(shoulderLX, shoulderRX, shoulderY, scale, bodySub, armThick, upperArm, foreArm, air);
  }

  ctx.restore();

  const neckX = x;
  const neckY = torsoTop + headSize * 0.08;
  ctx.save();
  ctx.translate(neckX, neckY);
  ctx.rotate(-lean * 0.62);
  ctx.translate(-neckX, -neckY);
  ctx.fillStyle = "rgba(47, 123, 78, 0.35)";
  roundRect(ctx, x - 7 * scale, torsoTop - 4 * scale, 14 * scale, 8 * scale, 4 * scale);
  ctx.fill();

  const faceCx = x;
  const faceCy = torsoTop - headSize * 0.28;

  if (avatar) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(faceCx, faceCy, headSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, faceCx - headSize / 2, faceCy - headSize / 2, headSize, headSize);
    ctx.restore();
    ctx.strokeStyle = "rgba(255,255,255,0.95)";
    ctx.lineWidth = 3 * scale;
    ctx.beginPath();
    ctx.arc(faceCx, faceCy, headSize / 2, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawRunnerLegSegments(hipX, hipY, stride, phaseCos, shinLen, footY, scale, color) {
  const kneeX = hipX + stride * 13.5 * scale;
  const kneeY = hipY + 9 * scale - Math.abs(phaseCos) * 9 * scale;

  const dy = footY - kneeY;
  const dyClamped = clamp(dy, -shinLen * 0.985, shinLen * 0.985);
  const rest = shinLen * shinLen - dyClamped * dyClamped;
  const fxOff = rest > 0 ? Math.sqrt(rest) : 0;
  const sign = stride >= 0 ? 1 : -1;
  const footX = kneeX + sign * fxOff;
  const footYUse = footY;

  ctx.strokeStyle = color;
  ctx.lineWidth = 5.8 * scale;
  ctx.beginPath();
  ctx.moveTo(hipX, hipY);
  ctx.lineTo(kneeX, kneeY);
  ctx.lineTo(footX, footYUse);
  ctx.stroke();

  ctx.fillStyle = "#1a3d2e";
  ctx.beginPath();
  ctx.ellipse(footX, footYUse + 1.2 * scale, 5.2 * scale, 2.6 * scale, stride * 0.2, 0, Math.PI * 2);
  ctx.fill();
}

function drawJumpLegs(x, hipY, scale, color, air, groundY, s) {
  const tuck = air;
  const out = 10 * scale * (0.35 + tuck * 0.45);
  const lift = 16 * scale * tuck;
  ctx.strokeStyle = color;
  ctx.lineWidth = 5.4 * scale;
  ctx.beginPath();
  ctx.moveTo(x - 8 * scale, hipY);
  ctx.quadraticCurveTo(x - out, hipY + lift * 0.6, x - 12 * scale - out * 0.2, hipY + lift);
  ctx.moveTo(x + 8 * scale, hipY);
  ctx.quadraticCurveTo(x + out, hipY + lift * 0.6, x + 12 * scale + out * 0.2, hipY + lift);
  ctx.stroke();

  if (tuck < 0.55) {
    ctx.fillStyle = "#1a3d2e";
    const fx = x + s * 3 * scale;
    ctx.beginPath();
    ctx.ellipse(fx, groundY - (1 - tuck) * 10 * scale, 5 * scale, 2.4 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawRunnerArm(sx, sy, swing, scale, color, thick, upper, fore, side) {
  const swingRad = swing * 0.62;
  const elbowX = sx + Math.sin(swingRad) * upper * side;
  const elbowY = sy + Math.cos(swingRad) * upper * 0.85;
  const handX = elbowX + Math.sin(swingRad + 0.35 * side) * fore;
  const handY = elbowY + Math.cos(swingRad * 0.6) * fore * 0.92;

  ctx.strokeStyle = color;
  ctx.lineWidth = thick;
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(elbowX, elbowY);
  ctx.lineTo(handX, handY);
  ctx.stroke();

  ctx.fillStyle = "rgba(247, 215, 61, 0.85)";
  ctx.beginPath();
  ctx.arc(handX, handY, 3.2 * scale, 0, Math.PI * 2);
  ctx.fill();
}

function drawJumpArms(slX, srX, sy, scale, color, thick, upper, fore, air) {
  const reach = (0.55 + air * 0.4) * upper;
  ctx.strokeStyle = color;
  ctx.lineWidth = thick;
  ctx.beginPath();
  ctx.moveTo(slX, sy);
  ctx.lineTo(slX - reach * 0.75, sy - reach * 0.55 - air * 6 * scale);
  ctx.moveTo(srX, sy);
  ctx.lineTo(srX + reach * 0.75, sy - reach * 0.55 - air * 6 * scale);
  ctx.stroke();

  ctx.fillStyle = "rgba(247, 215, 61, 0.85)";
  ctx.beginPath();
  ctx.arc(slX - reach * 0.75, sy - reach * 0.55 - air * 6 * scale, 3 * scale, 0, Math.PI * 2);
  ctx.arc(srX + reach * 0.75, sy - reach * 0.55 - air * 6 * scale, 3 * scale, 0, Math.PI * 2);
  ctx.fill();
}

function drawMango() {
  if (!state.mango.active) return;
  const x = state.mango.x;
  const y = state.mango.y;

  drawChibiRunner({
    x,
    y,
    scale: 0.86,
    bodyMain: "#5ca6ff",
    bodySub: "#2f63c2",
    accent: "#ffffff",
    avatar: assets.mangoAvatar,
    legPhase: (state.elapsedMs / 1000) * (Math.PI * 2) * 3.6 + 1.2,
    jumpHeight: 0,
  });

  roundRect(ctx, x + 24, y - 95, 250, 46, 14);
  ctx.fillStyle = "rgba(255,255,255,0.88)";
  ctx.fill();
  ctx.strokeStyle = "#ffd16a";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "#6a4a3e";
  ctx.font = "700 16px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("芒果来帮忙啦！", x + 36, y - 75);
  ctx.font = "600 13px sans-serif";
  ctx.fillStyle = "#835843";
  ctx.fillText(state.mango.text.replace("芒果祝福：", ""), x + 36, y - 58);
}

function drawEffectsBadges() {
  const now = performance.now();
  const effects = [];
  if (isEffectActive("shieldUntil", now)) {
    effects.push(`护盾 ${effectSecondsLeft("shieldUntil", now)}s`);
  }
  if (isEffectActive("magnetUntil", now)) {
    effects.push(`吸金 ${effectSecondsLeft("magnetUntil", now)}s`);
  }
  if (isEffectActive("doubleUntil", now)) {
    effects.push(`双倍 ${effectSecondsLeft("doubleUntil", now)}s`);
  }
  if (isEffectActive("slowUntil", now)) {
    effects.push(`慢速 ${effectSecondsLeft("slowUntil", now)}s`);
  }
  if (effects.length === 0) return;

  const text = `Buff：${effects.join(" / ")}`;
  ctx.font = "700 13px sans-serif";
  const width = ctx.measureText(text).width + 26;
  const bx = 14;
  const by = canvas.height - 46;
  roundRect(ctx, bx, by, width, 30, 14);
  const bg = ctx.createLinearGradient(bx, by, bx + width, by + 30);
  bg.addColorStop(0, "rgba(255,255,255,0.94)");
  bg.addColorStop(1, "rgba(245, 252, 255, 0.9)");
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.strokeStyle = "rgba(124, 200, 255, 0.45)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = "#2f4f5c";
  ctx.textAlign = "left";
  ctx.fillText(text, bx + 13, canvas.height - 24);
}

function drawPauseLayer() {
  const g = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  g.addColorStop(0, "rgba(32, 18, 48, 0.42)");
  g.addColorStop(1, "rgba(18, 40, 58, 0.38)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(255, 255, 255, 0.14)";
  roundRect(ctx, canvas.width * 0.18, canvas.height * 0.4, canvas.width * 0.64, 88, 20);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.font = `800 ${Math.floor(canvas.height * 0.055)}px sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText("已暂停", canvas.width / 2, canvas.height * 0.465);
  ctx.font = `600 ${Math.floor(canvas.height * 0.028)}px sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.82)";
  ctx.fillText("空格 / Esc 继续", canvas.width / 2, canvas.height * 0.505);
}

function syncHud() {
  livesEl.textContent = `${state.lives} / 5`;
  coinsEl.textContent = String(state.coins);
  scoreEl.textContent = String(Math.floor(state.score + state.elapsedMs / 40));
  speedEl.textContent = state.speedFactor.toFixed(1);
}

function baseScrollSpeed(now) {
  const slow = isEffectActive("slowUntil", now) ? 0.72 : 1;
  return (290 + state.speedFactor * 72) * slow;
}

function laneX(lane, y) {
  const topY = canvas.height * 0.17;
  const bottomY = canvas.height * 0.98;
  const t = clamp((y - topY) / (bottomY - topY), 0, 1);
  const spread = lerp(canvas.width * 0.06, canvas.width * 0.24, t);
  return canvas.width / 2 + (lane - 1) * spread;
}

function perspective(y, nearSize, farSize) {
  const topY = canvas.height * 0.17;
  const bottomY = canvas.height * 0.95;
  const t = clamp((y - topY) / (bottomY - topY), 0, 1);
  return lerp(nearSize, farSize, t);
}

function isEffectActive(key, now = performance.now()) {
  return state.effects[key] > now;
}

function effectSecondsLeft(key, now = performance.now()) {
  const until = state.effects[key];
  if (!until || until <= now) return 0;
  return Math.max(1, Math.ceil((until - now) / 1000));
}

function prefersReducedMotion() {
  if (!window.matchMedia) return false;
  if (!reduceMotionMq) {
    reduceMotionMq = window.matchMedia("(prefers-reduced-motion: reduce)");
  }
  return reduceMotionMq.matches;
}

function drawMountainLayer(baseRatio, color, driftSpeed, peakHeight) {
  const baselineY = canvas.height * baseRatio;
  const drift = (state.elapsedMs * driftSpeed) % canvas.width;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-80, canvas.height);
  for (let i = -1; i <= 7; i += 1) {
    const px = i * (canvas.width / 3) - drift;
    const py = baselineY - (i % 2 === 0 ? peakHeight : peakHeight * 0.5);
    ctx.lineTo(px, baselineY);
    ctx.lineTo(px + canvas.width / 6, py);
    ctx.lineTo(px + canvas.width / 3, baselineY);
  }
  ctx.lineTo(canvas.width + 80, canvas.height);
  ctx.closePath();
  ctx.fill();
}

function drawCityBlocks() {
  const baseY = canvas.height * 0.64;
  const drift = (state.elapsedMs * 0.03) % 120;
  for (let i = -1; i < 12; i += 1) {
    const x = i * 120 - drift;
    const h = 50 + ((i * 37) % 70);
    const w = 66 + ((i * 17) % 34);
    ctx.fillStyle = i % 2 === 0 ? "rgba(142, 111, 168, 0.35)" : "rgba(118, 91, 145, 0.32)";
    roundRect(ctx, x, baseY - h, w, h, 6);
    ctx.fill();
  }
}

function drawCloud(x, y, scale) {
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.beginPath();
  ctx.arc(x, y, 12 * scale, 0, Math.PI * 2);
  ctx.arc(x + 12 * scale, y - 8 * scale, 10 * scale, 0, Math.PI * 2);
  ctx.arc(x + 22 * scale, y, 11 * scale, 0, Math.PI * 2);
  ctx.fill();
}

function showToast(text) {
  toastEl.textContent = text;
  toastEl.classList.add("show");
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => toastEl.classList.remove("show"), 1800);
}

function setStatus(text) {
  statusEl.textContent = text;
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.floor(rect.width);
  canvas.height = Math.floor(rect.height);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (state.running) {
    render();
  } else {
    drawIdleScene(idleSceneMessage);
  }
}

async function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`加载失败: ${src}`));
  });
}

async function detectFaceCrop(image) {
  if ("FaceDetector" in window) {
    try {
      const detector = new window.FaceDetector({
        fastMode: true,
        maxDetectedFaces: 5,
      });
      const faces = await detector.detect(image);
      if (faces && faces.length > 0) {
        const best = faces
          .map((f) => f.boundingBox)
          .sort((a, b) => b.width * b.height - a.width * a.height)[0];
        return toSquareCrop(image, best);
      }
    } catch (error) {
      console.warn("人脸检测不可用，使用智能兜底裁切。", error);
    }
  }

  return {
    x: image.width * 0.22,
    y: image.height * 0.05,
    size: Math.min(image.width * 0.58, image.height * 0.68),
  };
}

function toSquareCrop(image, box) {
  const size = Math.max(box.width, box.height) * 1.65;
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;
  const x = clamp(centerX - size / 2, 0, image.width - size);
  const y = clamp(centerY - size / 2, 0, image.height - size);
  return { x, y, size: Math.min(size, image.width, image.height) };
}

function buildRoundAvatar(image, crop) {
  const c = document.createElement("canvas");
  c.width = 200;
  c.height = 200;
  const cctx = c.getContext("2d");
  cctx.clearRect(0, 0, 200, 200);
  cctx.beginPath();
  cctx.arc(100, 100, 95, 0, Math.PI * 2);
  cctx.clip();
  cctx.drawImage(image, crop.x, crop.y, crop.size, crop.size, 0, 0, 200, 200);
  return c;
}

function roundRect(context, x, y, w, h, r) {
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + w, y, x + w, y + h, r);
  context.arcTo(x + w, y + h, x, y + h, r);
  context.arcTo(x, y + h, x, y, r);
  context.arcTo(x, y, x + w, y, r);
  context.closePath();
}

function randomLane() {
  return Math.floor(Math.random() * 3);
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}
