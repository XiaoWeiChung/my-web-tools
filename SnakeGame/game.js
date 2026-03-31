/**
 * 贪吃蛇游戏 - 增强版
 */

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

// ===== 配置 =====
const GRID = 20;
const COLS = canvas.width / GRID;
const ROWS = canvas.height / GRID;

// ===== 游戏状态 =====
let snake = [];
let direction = { x: 1, y: 0 };
let nextDirection = { x: 1, y: 0 };
let food = null;
let score = 0;
let best = parseInt(localStorage.getItem('snake-best')) || 0;
let baseSpeed = 120;
let speed = 120;
let state = 'start';
let particles = [];
let trail = [];
let frameId = null;
let lastTime = 0;
let accumulator = 0;
let combo = 0;
let comboTimer = 0;

// 新玩法状态
let specialFood = null;     // ⭐ 加分食物
let specialTimer = 0;
let poisonFood = null;       // 💀 毒食物
let poisonTimer = 0;
let speedBoost = null;       // ⚡ 加速道具
let speedBoostTimer = 0;
let isSpeedBoosted = false;  // 当前是否加速中
let speedBoostRemaining = 0;
let shield = null;           // 🛡️ 护盾道具
let shieldTimer = 0;
let isShielded = false;      // 当前是否有护盾
let shieldRemaining = 0;
let obstacles = [];          // 🧱 障碍物
let floatingTexts = [];      // 飘字效果

// ===== 颜色 =====
const COLORS = {
    head: '#6366f1',
    headGlow: 'rgba(99,102,241,0.4)',
    headShield: '#38bdf8',
    headShieldGlow: 'rgba(56,189,248,0.5)',
    body: '#818cf8',
    bodyAlt: '#6366f1',
    bodyBoosted: '#fbbf24',
    bodyBoostedAlt: '#f59e0b',
    food: '#10b981',
    foodGlow: 'rgba(16,185,129,0.4)',
    foodInner: '#34d399',
    special: '#f59e0b',
    specialGlow: 'rgba(245,158,11,0.4)',
    poison: '#ef4444',
    poisonGlow: 'rgba(239,68,68,0.35)',
    speedBoost: '#fbbf24',
    speedGlow: 'rgba(251,191,36,0.4)',
    shield: '#38bdf8',
    shieldGlow: 'rgba(56,189,248,0.4)',
    obstacle: '#374151',
    obstacleEdge: '#4b5563',
    gridLine: 'rgba(255,255,255,0.03)',
};

// ===== 初始化 =====
$('#best').textContent = best;

$$('.diff-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        $$('.diff-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        baseSpeed = parseInt(btn.dataset.speed);
        speed = baseSpeed;
        $('#levelBadge').textContent = btn.dataset.name;
    });
});

$('#btnStart').addEventListener('click', startGame);
$('#btnRestart').addEventListener('click', startGame);

function startGame() {
    const startX = Math.floor(COLS / 2);
    const startY = Math.floor(ROWS / 2);
    snake = [
        { x: startX, y: startY },
        { x: startX - 1, y: startY },
        { x: startX - 2, y: startY },
    ];
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    score = 0;
    combo = 0;
    comboTimer = 0;
    speed = baseSpeed;
    specialFood = null; specialTimer = 0;
    poisonFood = null; poisonTimer = 0;
    speedBoost = null; speedBoostTimer = 0;
    isSpeedBoosted = false; speedBoostRemaining = 0;
    shield = null; shieldTimer = 0;
    isShielded = false; shieldRemaining = 0;
    obstacles = [];
    particles = [];
    trail = [];
    floatingTexts = [];
    $('#score').textContent = '0';
    spawnFood();
    setState('playing');
    lastTime = performance.now();
    accumulator = 0;
    if (frameId) cancelAnimationFrame(frameId);
    frameId = requestAnimationFrame(gameFrame);
}

function setState(s) {
    state = s;
    $('#startOverlay').classList.toggle('hidden', s !== 'start');
    $('#pauseOverlay').classList.toggle('hidden', s !== 'paused');
    $('#gameoverOverlay').classList.toggle('hidden', s !== 'gameover');
}

// ===== 主循环 =====
function gameFrame(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (state === 'playing') {
        accumulator += dt;
        const curSpeed = isSpeedBoosted ? speed * 0.55 : speed;
        while (accumulator >= curSpeed) {
            update();
            if (state !== 'playing') break;
            accumulator -= curSpeed;
        }
        // 更新 buff 计时
        updateBuffTimers(dt);
    }
    render();
    updateParticles();
    frameId = requestAnimationFrame(gameFrame);
}

function updateBuffTimers(dt) {
    // 加速 buff
    if (isSpeedBoosted) {
        speedBoostRemaining -= dt;
        if (speedBoostRemaining <= 0) {
            isSpeedBoosted = false;
            speedBoostRemaining = 0;
        }
    }
    // 护盾 buff
    if (isShielded) {
        shieldRemaining -= dt;
        if (shieldRemaining <= 0) {
            isShielded = false;
            shieldRemaining = 0;
        }
    }
}

// ===== 逻辑更新 =====
function update() {
    direction = { ...nextDirection };
    const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

    // 穿墙
    if (head.x < 0) head.x = COLS - 1;
    if (head.x >= COLS) head.x = 0;
    if (head.y < 0) head.y = ROWS - 1;
    if (head.y >= ROWS) head.y = 0;

    // 撞障碍物
    if (obstacles.some(o => o.x === head.x && o.y === head.y)) {
        if (isShielded) {
            // 护盾抵消，移除该障碍物
            obstacles = obstacles.filter(o => !(o.x === head.x && o.y === head.y));
            spawnParticles(head.x * GRID + GRID/2, head.y * GRID + GRID/2, COLORS.shield, 10);
            addFloatingText(head.x * GRID, head.y * GRID, '🛡️破障!', '#38bdf8');
            isShielded = false;
            shieldRemaining = 0;
        } else {
            gameOver(); return;
        }
    }

    // 撞自己
    if (snake.some(s => s.x === head.x && s.y === head.y)) {
        if (isShielded) {
            spawnParticles(head.x * GRID + GRID/2, head.y * GRID + GRID/2, COLORS.shield, 8);
            addFloatingText(head.x * GRID, head.y * GRID, '🛡️免死!', '#38bdf8');
            isShielded = false;
            shieldRemaining = 0;
        } else {
            gameOver(); return;
        }
    }

    // 拖尾
    const tailEnd = snake[snake.length - 1];
    trail.push({ x: tailEnd.x, y: tailEnd.y, alpha: 0.3 });
    if (trail.length > 8) trail.shift();

    snake.unshift(head);
    let ate = false;

    // 吃普通食物
    if (head.x === food.x && head.y === food.y) {
        const pts = isSpeedBoosted ? 20 + combo * 4 : 10 + combo * 2;
        score += pts;
        combo++;
        comboTimer = 3000;
        ate = true;
        spawnParticles(food.x * GRID + GRID/2, food.y * GRID + GRID/2, COLORS.food, 12);
        addFloatingText(food.x * GRID, food.y * GRID, `+${pts}`, '#10b981');
        spawnFood();
        maybeSpawnItems();
    }
    // 吃特殊食物 ⭐
    else if (specialFood && head.x === specialFood.x && head.y === specialFood.y) {
        const pts = isSpeedBoosted ? 60 : 30;
        score += pts;
        combo += 3;
        comboTimer = 3000;
        ate = true;
        spawnParticles(specialFood.x * GRID + GRID/2, specialFood.y * GRID + GRID/2, COLORS.special, 20);
        addFloatingText(specialFood.x * GRID, specialFood.y * GRID, `+${pts} ⭐`, '#f59e0b');
        specialFood = null; specialTimer = 0;
    }
    // 吃毒食物 💀
    else if (poisonFood && head.x === poisonFood.x && head.y === poisonFood.y) {
        score = Math.max(0, score - 15);
        combo = 0;
        comboTimer = 0;
        spawnParticles(poisonFood.x * GRID + GRID/2, poisonFood.y * GRID + GRID/2, COLORS.poison, 15);
        addFloatingText(poisonFood.x * GRID, poisonFood.y * GRID, '-15 💀', '#ef4444');
        poisonFood = null; poisonTimer = 0;
        // 蛇缩短（最少保留3节）
        if (snake.length > 4) { snake.pop(); snake.pop(); }
    }
    // 吃加速道具 ⚡
    else if (speedBoost && head.x === speedBoost.x && head.y === speedBoost.y) {
        isSpeedBoosted = true;
        speedBoostRemaining = 4000;
        ate = true;
        spawnParticles(speedBoost.x * GRID + GRID/2, speedBoost.y * GRID + GRID/2, COLORS.speedBoost, 15);
        addFloatingText(speedBoost.x * GRID, speedBoost.y * GRID, '⚡加速x2!', '#fbbf24');
        speedBoost = null; speedBoostTimer = 0;
    }
    // 吃护盾 🛡️
    else if (shield && head.x === shield.x && head.y === shield.y) {
        isShielded = true;
        shieldRemaining = 6000;
        ate = true;
        spawnParticles(shield.x * GRID + GRID/2, shield.y * GRID + GRID/2, COLORS.shield, 15);
        addFloatingText(shield.x * GRID, shield.y * GRID, '🛡️护盾!', '#38bdf8');
        shield = null; shieldTimer = 0;
    }

    if (!ate) snake.pop();
    $('#score').textContent = score;

    // 道具倒计时
    if (specialFood) { specialTimer -= speed; if (specialTimer <= 0) specialFood = null; }
    if (poisonFood) { poisonTimer -= speed; if (poisonTimer <= 0) poisonFood = null; }
    if (speedBoost) { speedBoostTimer -= speed; if (speedBoostTimer <= 0) speedBoost = null; }
    if (shield) { shieldTimer -= speed; if (shieldTimer <= 0) shield = null; }
    if (comboTimer > 0) { comboTimer -= speed; if (comboTimer <= 0) combo = 0; }

    // 随分数增加障碍物
    maybeSpawnObstacle();
}

// ===== 生成逻辑 =====
function isOccupied(x, y) {
    if (snake.some(s => s.x === x && s.y === y)) return true;
    if (food && food.x === x && food.y === y) return true;
    if (specialFood && specialFood.x === x && specialFood.y === y) return true;
    if (poisonFood && poisonFood.x === x && poisonFood.y === y) return true;
    if (speedBoost && speedBoost.x === x && speedBoost.y === y) return true;
    if (shield && shield.x === x && shield.y === y) return true;
    if (obstacles.some(o => o.x === x && o.y === y)) return true;
    return false;
}

function randomFreePos() {
    let pos, tries = 0;
    do {
        pos = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
        tries++;
    } while (isOccupied(pos.x, pos.y) && tries < 200);
    return pos;
}

function spawnFood() { food = randomFreePos(); }

function maybeSpawnItems() {
    const eaten = Math.floor(score / 10);
    // ⭐ 每吃5个出现
    if (eaten % 5 === 0 && !specialFood) {
        specialFood = randomFreePos();
        specialTimer = 5000;
    }
    // 💀 分数>30后随机出现
    if (score > 30 && !poisonFood && Math.random() < 0.35) {
        poisonFood = randomFreePos();
        poisonTimer = 6000;
    }
    // ⚡ 分数>50后随机出现
    if (score > 50 && !speedBoost && !isSpeedBoosted && Math.random() < 0.2) {
        speedBoost = randomFreePos();
        speedBoostTimer = 5000;
    }
    // 🛡️ 分数>80后随机出现
    if (score > 80 && !shield && !isShielded && Math.random() < 0.15) {
        shield = randomFreePos();
        shieldTimer = 5000;
    }
}

function maybeSpawnObstacle() {
    // 每50分加一个障碍物，最多15个
    const target = Math.min(Math.floor(score / 50), 15);
    while (obstacles.length < target) {
        const pos = randomFreePos();
        // 不在蛇头附近3格内
        const head = snake[0];
        if (Math.abs(pos.x - head.x) < 3 && Math.abs(pos.y - head.y) < 3) continue;
        obstacles.push(pos);
    }
}

function gameOver() {
    state = 'gameover';
    if (score > best) {
        best = score;
        localStorage.setItem('snake-best', best);
        $('#best').textContent = best;
    }
    $('#finalScore').textContent = score;
    $('#finalMsg').textContent = score >= best && score > 0 ? '🎉 新纪录!' : '再来一次?';
    setState('gameover');
    snake.forEach(s => spawnParticles(s.x * GRID + GRID/2, s.y * GRID + GRID/2, '#ef4444', 4));
}

// ===== 渲染 =====
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 背景
    ctx.fillStyle = '#0f0f24';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 加速时背景微变
    if (isSpeedBoosted) {
        ctx.fillStyle = 'rgba(251,191,36,0.02)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    if (isShielded) {
        ctx.fillStyle = 'rgba(56,189,248,0.02)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // 网格
    ctx.strokeStyle = COLORS.gridLine;
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= COLS; i++) {
        ctx.beginPath(); ctx.moveTo(i * GRID, 0); ctx.lineTo(i * GRID, canvas.height); ctx.stroke();
    }
    for (let i = 0; i <= ROWS; i++) {
        ctx.beginPath(); ctx.moveTo(0, i * GRID); ctx.lineTo(canvas.width, i * GRID); ctx.stroke();
    }

    // 障碍物 🧱
    obstacles.forEach(o => {
        const ox = o.x * GRID, oy = o.y * GRID;
        ctx.fillStyle = COLORS.obstacle;
        roundRect(ox + 1, oy + 1, GRID - 2, GRID - 2, 4);
        ctx.fillStyle = COLORS.obstacleEdge;
        roundRect(ox + 3, oy + 3, GRID - 6, GRID - 6, 3);
        // 裂纹效果
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(ox + 5, oy + 5); ctx.lineTo(ox + GRID - 7, oy + GRID - 5);
        ctx.moveTo(ox + GRID - 5, oy + 6); ctx.lineTo(ox + 6, oy + GRID - 6);
        ctx.stroke();
    });

    // 拖尾
    trail.forEach(t => {
        const c = isSpeedBoosted ? '251,191,36' : '99,102,241';
        ctx.fillStyle = `rgba(${c},${t.alpha * 0.15})`;
        roundRect(t.x * GRID + 2, t.y * GRID + 2, GRID - 4, GRID - 4, 4);
        t.alpha *= 0.85;
    });
    trail = trail.filter(t => t.alpha > 0.01);

    // 普通食物 🟢
    if (food) drawItem(food, COLORS.food, COLORS.foodGlow, COLORS.foodInner, 'circle');

    // 特殊食物 ⭐
    if (specialFood) drawItem(specialFood, COLORS.special, COLORS.specialGlow, null, 'star', specialTimer, 5000);

    // 毒食物 💀
    if (poisonFood) drawItem(poisonFood, COLORS.poison, COLORS.poisonGlow, null, 'skull', poisonTimer, 6000);

    // 加速道具 ⚡
    if (speedBoost) drawItem(speedBoost, COLORS.speedBoost, COLORS.speedGlow, null, 'bolt', speedBoostTimer, 5000);

    // 护盾道具 🛡️
    if (shield) drawItem(shield, COLORS.shield, COLORS.shieldGlow, null, 'shield', shieldTimer, 5000);

    // 蛇身
    snake.forEach((seg, i) => {
        const x = seg.x * GRID, y = seg.y * GRID;
        const isHead = i === 0;
        const progress = i / snake.length;

        if (isHead) {
            const hx = x + GRID/2, hy = y + GRID/2;
            const glowColor = isShielded ? COLORS.headShieldGlow : (isSpeedBoosted ? 'rgba(251,191,36,0.4)' : COLORS.headGlow);
            const hglow = ctx.createRadialGradient(hx, hy, 0, hx, hy, GRID);
            hglow.addColorStop(0, glowColor);
            hglow.addColorStop(1, 'transparent');
            ctx.fillStyle = hglow;
            ctx.fillRect(hx - GRID, hy - GRID, GRID * 2, GRID * 2);

            ctx.fillStyle = isShielded ? COLORS.headShield : (isSpeedBoosted ? '#fbbf24' : COLORS.head);
            roundRect(x + 1, y + 1, GRID - 2, GRID - 2, 6);

            // 护盾光环
            if (isShielded) {
                ctx.strokeStyle = `rgba(56,189,248,${0.3 + Math.sin(performance.now()/200)*0.2})`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(hx, hy, GRID/2 + 3, 0, Math.PI * 2);
                ctx.stroke();
            }

            drawEyes(x, y);
        } else {
            const alpha = 1 - progress * 0.4;
            let c1, c2;
            if (isSpeedBoosted) { c1 = COLORS.bodyBoosted; c2 = COLORS.bodyBoostedAlt; }
            else { c1 = COLORS.body; c2 = COLORS.bodyAlt; }
            ctx.globalAlpha = alpha;
            ctx.fillStyle = i % 2 === 0 ? c1 : c2;
            const shrink = progress * 2;
            roundRect(x + 2 + shrink, y + 2 + shrink, GRID - 4 - shrink*2, GRID - 4 - shrink*2, 5);
            ctx.globalAlpha = 1;
        }
    });

    // HUD: Combo
    if (combo > 1 && comboTimer > 0) {
        ctx.fillStyle = `rgba(245,158,11,${Math.min(comboTimer/1000,1)})`;
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`🔥 x${combo} COMBO`, canvas.width/2, 24);
    }

    // HUD: Buff 状态条
    let buffY = 40;
    if (isSpeedBoosted) {
        drawBuffBar(10, buffY, '⚡ 加速', speedBoostRemaining, 4000, '#fbbf24');
        buffY += 18;
    }
    if (isShielded) {
        drawBuffBar(10, buffY, '🛡️ 护盾', shieldRemaining, 6000, '#38bdf8');
    }

    // 飘字
    floatingTexts.forEach(ft => {
        ctx.globalAlpha = ft.alpha;
        ctx.fillStyle = ft.color;
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, ft.x + GRID/2, ft.y);
        ft.y -= 0.8;
        ft.alpha -= 0.015;
        ctx.globalAlpha = 1;
    });
    floatingTexts = floatingTexts.filter(ft => ft.alpha > 0);
}

// ===== 绘制道具 =====
function drawItem(item, color, glowColor, innerColor, shape, timer, maxTimer) {
    const pulse = 1 + Math.sin(performance.now()/300) * 0.12;
    const ix = item.x * GRID + GRID/2;
    const iy = item.y * GRID + GRID/2;
    const ir = (GRID/2 - 2) * pulse;

    // 快消失时闪烁
    let alpha = 1;
    if (timer !== undefined && timer < 2000) {
        alpha = Math.sin(performance.now()/100) * 0.3 + 0.7;
    }
    ctx.globalAlpha = alpha;

    // 光晕
    const glow = ctx.createRadialGradient(ix, iy, 0, ix, iy, ir * 2);
    glow.addColorStop(0, glowColor);
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(ix - ir*2, iy - ir*2, ir*4, ir*4);

    ctx.fillStyle = color;
    if (shape === 'circle') {
        ctx.beginPath(); ctx.arc(ix, iy, ir, 0, Math.PI*2); ctx.fill();
        if (innerColor) {
            ctx.fillStyle = innerColor;
            ctx.beginPath(); ctx.arc(ix - 2, iy - 2, ir*0.4, 0, Math.PI*2); ctx.fill();
        }
    } else if (shape === 'star') {
        drawStar(ix, iy, ir, 5);
    } else if (shape === 'skull') {
        // 💀 骷髅形状：圆头 + X 眼
        ctx.beginPath(); ctx.arc(ix, iy - 1, ir * 0.8, 0, Math.PI*2); ctx.fill();
        ctx.fillRect(ix - ir*0.4, iy + ir*0.3, ir*0.8, ir*0.4);
        // X 眼
        ctx.strokeStyle = '#0f0f24';
        ctx.lineWidth = 1.5;
        const ex = 3, ey = 2;
        ctx.beginPath(); ctx.moveTo(ix-ex-1, iy-ey-2); ctx.lineTo(ix-ex+2, iy-ey+1); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ix-ex+2, iy-ey-2); ctx.lineTo(ix-ex-1, iy-ey+1); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ix+ex-1, iy-ey-2); ctx.lineTo(ix+ex+2, iy-ey+1); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ix+ex+2, iy-ey-2); ctx.lineTo(ix+ex-1, iy-ey+1); ctx.stroke();
    } else if (shape === 'bolt') {
        // ⚡ 闪电
        ctx.beginPath();
        ctx.moveTo(ix + 1, iy - ir);
        ctx.lineTo(ix - ir*0.5, iy);
        ctx.lineTo(ix + 1, iy - 1);
        ctx.lineTo(ix - 1, iy + ir);
        ctx.lineTo(ix + ir*0.5, iy);
        ctx.lineTo(ix - 1, iy + 1);
        ctx.closePath();
        ctx.fill();
    } else if (shape === 'shield') {
        // 🛡️ 盾牌
        ctx.beginPath();
        ctx.moveTo(ix, iy - ir);
        ctx.quadraticCurveTo(ix + ir, iy - ir*0.5, ix + ir*0.8, iy);
        ctx.quadraticCurveTo(ix + ir*0.3, iy + ir*0.8, ix, iy + ir);
        ctx.quadraticCurveTo(ix - ir*0.3, iy + ir*0.8, ix - ir*0.8, iy);
        ctx.quadraticCurveTo(ix - ir, iy - ir*0.5, ix, iy - ir);
        ctx.fill();
        // 内部十字
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(ix, iy - ir*0.4); ctx.lineTo(ix, iy + ir*0.4); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ix - ir*0.3, iy); ctx.lineTo(ix + ir*0.3, iy); ctx.stroke();
    }

    // 倒计时环
    if (timer !== undefined && maxTimer) {
        const pct = timer / maxTimer;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(ix, iy, ir + 3, -Math.PI/2, -Math.PI/2 + Math.PI*2*pct);
        ctx.stroke();
    }

    ctx.globalAlpha = 1;
}

function drawBuffBar(x, y, label, remaining, max, color) {
    const w = 100, h = 10;
    const pct = Math.max(0, remaining / max);
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    roundRect(x, y, w, h, 4);
    ctx.fillStyle = color;
    roundRect(x, y, w * pct, h, 4);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(label, x + 4, y + 8);
}

function addFloatingText(x, y, text, color) {
    floatingTexts.push({ x, y, text, color, alpha: 1 });
}

// ===== 绘制辅助 =====
function roundRect(x, y, w, h, r) {
    if (w <= 0 || h <= 0) return;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.fill();
}

function drawEyes(x, y) {
    const cx = x + GRID/2, cy = y + GRID/2;
    const eyeOffset = 4, eyeR = 2.5, pupilR = 1.2;
    let ex1, ey1, ex2, ey2;
    if (direction.x === 1) { ex1 = cx+3; ey1 = cy-eyeOffset; ex2 = cx+3; ey2 = cy+eyeOffset; }
    else if (direction.x === -1) { ex1 = cx-3; ey1 = cy-eyeOffset; ex2 = cx-3; ey2 = cy+eyeOffset; }
    else if (direction.y === -1) { ex1 = cx-eyeOffset; ey1 = cy-3; ex2 = cx+eyeOffset; ey2 = cy-3; }
    else { ex1 = cx-eyeOffset; ey1 = cy+3; ex2 = cx+eyeOffset; ey2 = cy+3; }
    ctx.fillStyle = '#e0e0f0';
    ctx.beginPath(); ctx.arc(ex1, ey1, eyeR, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(ex2, ey2, eyeR, 0, Math.PI*2); ctx.fill();
    // 加速时瞳孔变红
    ctx.fillStyle = isSpeedBoosted ? '#ef4444' : '#1a1a2e';
    ctx.beginPath(); ctx.arc(ex1+direction.x, ey1+direction.y, pupilR, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(ex2+direction.x, ey2+direction.y, pupilR, 0, Math.PI*2); ctx.fill();
}

function drawStar(cx, cy, r, points) {
    ctx.beginPath();
    for (let i = 0; i < points*2; i++) {
        const radius = i%2===0 ? r : r*0.45;
        const angle = (i*Math.PI)/points - Math.PI/2;
        const x = cx + Math.cos(angle)*radius;
        const y = cy + Math.sin(angle)*radius;
        i===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
    }
    ctx.closePath();
    ctx.fill();
}

// ===== 粒子 =====
function spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        const angle = (Math.PI*2*i)/count + Math.random()*0.5;
        const spd = 1.5 + Math.random()*3;
        particles.push({ x, y, vx: Math.cos(angle)*spd, vy: Math.sin(angle)*spd, life: 1, decay: 0.015+Math.random()*0.02, size: 2+Math.random()*3, color });
    }
}

function updateParticles() {
    particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.vx *= 0.96; p.vy *= 0.96; p.life -= p.decay; });
    particles = particles.filter(p => p.life > 0);
    particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size*p.life, 0, Math.PI*2); ctx.fill();
    });
    ctx.globalAlpha = 1;
}

// ===== 输入 =====
const KEY_MAP = {
    ArrowUp:{x:0,y:-1}, ArrowDown:{x:0,y:1}, ArrowLeft:{x:-1,y:0}, ArrowRight:{x:1,y:0},
    w:{x:0,y:-1}, s:{x:0,y:1}, a:{x:-1,y:0}, d:{x:1,y:0},
    W:{x:0,y:-1}, S:{x:0,y:1}, A:{x:-1,y:0}, D:{x:1,y:0},
};

document.addEventListener('keydown', e => {
    const dir = KEY_MAP[e.key];
    if (dir) {
        e.preventDefault();
        if (dir.x !== -direction.x || dir.y !== -direction.y) nextDirection = dir;
        if (state === 'start') startGame();
        return;
    }
    if (e.key === ' ' || e.key === 'Escape') {
        e.preventDefault();
        if (state === 'playing') setState('paused');
        else if (state === 'paused') setState('playing');
    }
    if (e.key === 'Enter') {
        if (state === 'start' || state === 'gameover') startGame();
    }
});

$$('.touch-btn').forEach(btn => {
    const dirMap = { up:{x:0,y:-1}, down:{x:0,y:1}, left:{x:-1,y:0}, right:{x:1,y:0} };
    btn.addEventListener('touchstart', e => {
        e.preventDefault();
        const dir = dirMap[btn.dataset.dir];
        if (dir && (dir.x !== -direction.x || dir.y !== -direction.y)) nextDirection = dir;
    });
});

let touchStartX = 0, touchStartY = 0;
canvas.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; touchStartY = e.touches[0].clientY; }, { passive: true });
canvas.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 30) return;
    let dir;
    if (Math.abs(dx) > Math.abs(dy)) dir = dx > 0 ? {x:1,y:0} : {x:-1,y:0};
    else dir = dy > 0 ? {x:0,y:1} : {x:0,y:-1};
    if (dir.x !== -direction.x || dir.y !== -direction.y) nextDirection = dir;
}, { passive: true });

render();
