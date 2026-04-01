/**
 * 极速狂飙 - 俯视角无尽赛车
 */
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;
const $ = s => document.querySelector(s);

// ===== 车道 =====
const LANES = 5;
const LANE_W = 56;
const ROAD_W = LANES * LANE_W;
const ROAD_X = (W - ROAD_W) / 2;

// ===== 车辆模板 =====
const CAR_MODELS = [
    { name: '闪电', color: '#ef4444', accent: '#fca5a5', speed: 1.0, handling: 1.0, w: 28, h: 48 },
    { name: '幽灵', color: '#6366f1', accent: '#a5b4fc', speed: 0.9, handling: 1.2, w: 26, h: 46 },
    { name: '猛兽', color: '#f59e0b', accent: '#fde68a', speed: 1.1, handling: 0.85, w: 32, h: 52 },
    { name: '暗影', color: '#10b981', accent: '#6ee7b7', speed: 1.05, handling: 1.05, w: 27, h: 47 },
];

// 障碍车模板
const OBS_CARS = [
    { name: 'sedan', color: '#64748b', accent: '#94a3b8', w: 26, h: 44 },
    { name: 'suv', color: '#78716c', accent: '#a8a29e', w: 30, h: 50 },
    { name: 'truck', color: '#57534e', accent: '#78716c', w: 34, h: 62 },
    { name: 'taxi', color: '#eab308', accent: '#fde047', w: 26, h: 44 },
    { name: 'police', color: '#1d4ed8', accent: '#60a5fa', w: 28, h: 48 },
    { name: 'bus', color: '#16a34a', accent: '#4ade80', w: 36, h: 72 },
];

// ===== 状态 =====
let state = 'start';
let score = 0, best = parseInt(localStorage.getItem('race-best')) || 0;
let frameId, lastTime = 0;
let player, obstacles, powerups, coins, particles, floats, roadMarks;
let gameSpeed, distance, nearMissTimer;
let selectedCar = 0;
let sceneBg, sceneGrass;

// 场景
const SCENES = [
    { name: '城市高速', bg: '#555555', grass: '#2d5a27', road: '#444444', line: '#cccccc', dist: 0 },
    { name: '沙漠公路', bg: '#c2a366', grass: '#d4a843', road: '#8b7355', line: '#e8d5a3', dist: 2000 },
    { name: '雪山赛道', bg: '#b8c9d9', grass: '#d4e4ef', road: '#8899aa', line: '#ffffff', dist: 5000 },
    { name: '夜间都市', bg: '#1a1a2e', grass: '#0f1a0f', road: '#222233', line: '#666688', dist: 9000 },
];

$('#best').textContent = best;

// ===== 车辆选择 =====
function initCarSelect() {
    const el = $('#carSelect');
    el.innerHTML = CAR_MODELS.map((c, i) => `
        <div class="car-opt ${i === 0 ? 'active' : ''}" data-idx="${i}">
            <canvas width="40" height="40" id="carPrev${i}"></canvas>
            <div class="car-opt-name">${c.name}</div>
        </div>
    `).join('');
    CAR_MODELS.forEach((c, i) => {
        const cv = document.getElementById(`carPrev${i}`);
        const cx = cv.getContext('2d');
        drawCarModel(cx, 20, 22, c, 0.7);
    });
    el.addEventListener('click', e => {
        const opt = e.target.closest('.car-opt');
        if (!opt) return;
        document.querySelectorAll('.car-opt').forEach(o => o.classList.remove('active'));
        opt.classList.add('active');
        selectedCar = parseInt(opt.dataset.idx);
    });
}
initCarSelect();

// ===== 开始 =====
$('#btnStart').addEventListener('click', startGame);
$('#btnRestart').addEventListener('click', startGame);

function startGame() {
    const model = CAR_MODELS[selectedCar];
    player = {
        lane: 2, targetLane: 2,
        x: laneX(2), y: H - 100,
        w: model.w, h: model.h,
        model, lives: 3,
        nitro: 0, nitroActive: false, nitroTimer: 0,
        shielded: false, shieldTimer: 0,
        magnetized: false, magnetTimer: 0,
        slowmo: false, slowmoTimer: 0,
        invincible: false, invTimer: 0,
        laneProgress: 0,
    };
    obstacles = []; powerups = []; coins = []; particles = []; floats = [];
    roadMarks = [];
    for (let i = 0; i < 20; i++) roadMarks.push({ y: i * 40 });
    gameSpeed = 3; distance = 0; score = 0; nearMissTimer = 0;
    $('#score').textContent = '0';
    updateHUD();
    setState('playing');
    lastTime = performance.now();
    if (frameId) cancelAnimationFrame(frameId);
    frameId = requestAnimationFrame(loop);
}

function setState(s) {
    state = s;
    $('#startOv').classList.toggle('hidden', s !== 'start');
    $('#goOv').classList.toggle('hidden', s !== 'gameover');
}

function updateHUD() {
    let h = '';
    for (let i = 0; i < player.lives; i++) h += '❤️';
    for (let i = player.lives; i < 3; i++) h += '🖤';
    $('#lives').innerHTML = h;
    const kmh = Math.round(gameSpeed * 30);
    $('#speedHud').textContent = `${kmh} km/h`;
    $('#speedHud').style.borderColor = player.nitroActive ? 'rgba(251,191,36,0.5)' : 'rgba(239,68,68,0.3)';
}

function laneX(lane) { return ROAD_X + lane * LANE_W + LANE_W / 2; }

function getScene() {
    let s = SCENES[0];
    for (const sc of SCENES) { if (distance >= sc.dist) s = sc; }
    return s;
}

// ===== 主循环 =====
function loop(ts) {
    const dt = Math.min(ts - lastTime, 50);
    lastTime = ts;
    if (state === 'playing') update(dt);
    render();
    frameId = requestAnimationFrame(loop);
}

function update(dt) {
    const spd = player.slowmo ? gameSpeed * 0.4 : gameSpeed;
    distance += spd * 0.1;

    // 速度递增
    gameSpeed = Math.min(12, 3 + distance * 0.003 + (player.nitroActive ? 3 : 0));

    // 玩家平滑变道
    const targetX = laneX(player.targetLane);
    const moveSpeed = 0.15 * (player.model.handling || 1);
    player.x += (targetX - player.x) * moveSpeed;
    player.lane = player.targetLane;

    // Buff 计时
    if (player.nitroActive) { player.nitroTimer -= dt; if (player.nitroTimer <= 0) { player.nitroActive = false; } }
    if (player.shielded) { player.shieldTimer -= dt; if (player.shieldTimer <= 0) player.shielded = false; }
    if (player.magnetized) { player.magnetTimer -= dt; if (player.magnetTimer <= 0) player.magnetized = false; }
    if (player.slowmo) { player.slowmoTimer -= dt; if (player.slowmoTimer <= 0) player.slowmo = false; }
    if (player.invincible) { player.invTimer -= dt; if (player.invTimer <= 0) player.invincible = false; }
    if (nearMissTimer > 0) nearMissTimer -= dt;

    // 路面标线移动
    roadMarks.forEach(m => { m.y += spd * 2; if (m.y > H + 20) m.y -= H + 60; });

    // 生成障碍车
    if (Math.random() < 0.015 + distance * 0.000005) {
        const lane = Math.floor(Math.random() * LANES);
        const tmpl = OBS_CARS[Math.floor(Math.random() * OBS_CARS.length)];
        // 避免同车道连续生成
        const tooClose = obstacles.some(o => o.lane === lane && o.y < 100);
        if (!tooClose) {
            obstacles.push({
                x: laneX(lane), y: -tmpl.h,
                w: tmpl.w, h: tmpl.h,
                lane, speed: 0.3 + Math.random() * 0.8,
                color: tmpl.color, accent: tmpl.accent,
                name: tmpl.name, passed: false,
            });
        }
    }

    // 生成金币
    if (Math.random() < 0.04) {
        const lane = Math.floor(Math.random() * LANES);
        coins.push({ x: laneX(lane), y: -10, lane });
    }

    // 生成道具
    if (Math.random() < 0.004) {
        const lane = Math.floor(Math.random() * LANES);
        const types = ['nitro', 'shield', 'magnet', 'slowmo', 'repair'];
        const icons = { nitro: '⚡', shield: '🛡️', magnet: '🧲', slowmo: '⏱️', repair: '🔧' };
        const colors = { nitro: '#fbbf24', shield: '#38bdf8', magnet: '#a78bfa', slowmo: '#67e8f9', repair: '#f472b6' };
        const t = types[Math.floor(Math.random() * types.length)];
        powerups.push({ x: laneX(lane), y: -15, lane, type: t, icon: icons[t], color: colors[t] });
    }

    // 移动障碍
    obstacles.forEach(o => { o.y += (spd - o.speed) * 2; });
    obstacles = obstacles.filter(o => o.y < H + 80);

    // 移动金币
    coins.forEach(c => {
        c.y += spd * 2;
        if (player.magnetized) {
            const dx = player.x - c.x, dy = player.y - c.y;
            const d = Math.sqrt(dx*dx + dy*dy);
            if (d < 120 && d > 5) { c.x += dx/d * 4; c.y += dy/d * 4; }
        }
    });
    coins = coins.filter(c => c.y < H + 20);

    // 移动道具
    powerups.forEach(p => { p.y += spd * 2; });
    powerups = powerups.filter(p => p.y < H + 20);

    // 碰撞检测
    checkCollisions();

    // 近距离闪避检测
    obstacles.forEach(o => {
        if (!o.passed && o.y > player.y + player.h/2) {
            o.passed = true;
            const dx = Math.abs(o.x - player.x);
            if (dx < LANE_W * 0.8 && dx > player.w/2) {
                score += 5;
                nearMissTimer = 500;
                addFloat(player.x, player.y - 30, '⚡ 近距离 +5', '#fbbf24', 12);
            }
        }
    });

    // 分数
    score += Math.floor(spd * 0.05);
    $('#score').textContent = score;
    updateHUD();

    // 粒子
    particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.life -= p.decay; });
    particles = particles.filter(p => p.life > 0);
    floats.forEach(f => { f.y -= 0.5; f.alpha -= 0.01; });
    floats = floats.filter(f => f.alpha > 0);

    // 氮气拖尾
    if (player.nitroActive) {
        for (let i = 0; i < 2; i++) {
            particles.push({
                x: player.x + (Math.random()-0.5)*10,
                y: player.y + player.h/2,
                vx: (Math.random()-0.5)*1, vy: 2 + Math.random()*2,
                life: 1, decay: 0.04, size: 3 + Math.random()*3,
                color: ['#fbbf24','#f97316','#ef4444'][Math.floor(Math.random()*3)],
            });
        }
    }
}

function checkCollisions() {
    // 障碍车碰撞
    if (!player.invincible) {
        obstacles.forEach(o => {
            if (rectHit(player.x-player.w/2, player.y-player.h/2, player.w, player.h,
                        o.x-o.w/2, o.y-o.h/2, o.w, o.h)) {
                if (player.shielded) {
                    player.shielded = false;
                    addFloat(player.x, player.y-20, '🛡️ 护盾破碎', '#38bdf8', 13);
                    spawnCrashParticles(o.x, o.y, '#38bdf8');
                    o.y = H + 100; // 移除
                } else {
                    playerCrash(o);
                }
            }
        });
    }

    // 金币
    coins.forEach(c => {
        if (c.dead) return;
        if (Math.abs(c.x - player.x) < 20 && Math.abs(c.y - player.y) < 20) {
            score += 3;
            c.dead = true;
            addFloat(c.x, c.y, '+3', '#fbbf24', 11);
        }
    });
    coins = coins.filter(c => !c.dead);

    // 道具
    powerups.forEach(p => {
        if (p.dead) return;
        if (Math.abs(p.x - player.x) < 22 && Math.abs(p.y - player.y) < 22) {
            applyPowerup(p);
            p.dead = true;
        }
    });
    powerups = powerups.filter(p => !p.dead);
}

function rectHit(x1,y1,w1,h1,x2,y2,w2,h2) {
    return x1<x2+w2 && x1+w1>x2 && y1<y2+h2 && y1+h1>y2;
}

function playerCrash(o) {
    player.lives--;
    spawnCrashParticles(player.x, player.y, '#ef4444');
    addFloat(player.x, player.y-30, '💥', '#ef4444', 20);
    o.y = H + 100;
    if (player.lives <= 0) {
        gameOver();
    } else {
        player.invincible = true;
        player.invTimer = 1500;
        updateHUD();
    }
}

function applyPowerup(p) {
    switch(p.type) {
        case 'nitro': player.nitroActive = true; player.nitroTimer = 3000; addFloat(p.x,p.y,'⚡ 氮气加速!','#fbbf24',14); break;
        case 'shield': player.shielded = true; player.shieldTimer = 8000; addFloat(p.x,p.y,'🛡️ 护盾!','#38bdf8',14); break;
        case 'magnet': player.magnetized = true; player.magnetTimer = 6000; addFloat(p.x,p.y,'🧲 磁铁!','#a78bfa',14); break;
        case 'slowmo': player.slowmo = true; player.slowmoTimer = 4000; addFloat(p.x,p.y,'⏱️ 减速!','#67e8f9',14); break;
        case 'repair': player.lives = Math.min(3, player.lives+1); addFloat(p.x,p.y,'🔧 修复!','#f472b6',14); break;
    }
    spawnCrashParticles(p.x, p.y, p.color);
    updateHUD();
}

function gameOver() {
    state = 'gameover';
    if (score > best) { best = score; localStorage.setItem('race-best', best); $('#best').textContent = best; }
    $('#finalScore').textContent = score;
    const km = (distance/100).toFixed(1);
    $('#finalMsg').textContent = score >= best && score > 0 ? `🎉 新纪录! 行驶 ${km} km` : `行驶 ${km} km`;
    setState('gameover');
}

function spawnCrashParticles(x, y, color) {
    for (let i = 0; i < 12; i++) {
        const a = Math.random()*Math.PI*2;
        particles.push({ x, y, vx: Math.cos(a)*3, vy: Math.sin(a)*3, life: 1, decay: 0.025, size: 3+Math.random()*3, color });
    }
}
function addFloat(x,y,text,color,size) { floats.push({x,y,text,color,size:size||13,alpha:1}); }

// ===== 渲染 =====
function render() {
    const scene = getScene();
    ctx.fillStyle = scene.grass;
    ctx.fillRect(0, 0, W, H);

    // 路面
    ctx.fillStyle = scene.road;
    ctx.fillRect(ROAD_X, 0, ROAD_W, H);

    // 路肩
    ctx.fillStyle = scene.name === '夜间都市' ? '#333344' : '#888';
    ctx.fillRect(ROAD_X - 4, 0, 4, H);
    ctx.fillRect(ROAD_X + ROAD_W, 0, 4, H);

    // 路面标线
    ctx.fillStyle = scene.line;
    roadMarks.forEach(m => {
        for (let i = 1; i < LANES; i++) {
            ctx.globalAlpha = 0.4;
            ctx.fillRect(ROAD_X + i * LANE_W - 1, m.y, 2, 20);
        }
    });
    ctx.globalAlpha = 1;

    // 中线（双黄线）
    const midLane = Math.floor(LANES / 2);
    roadMarks.forEach(m => {
        ctx.fillStyle = '#f59e0b';
        ctx.globalAlpha = 0.5;
        ctx.fillRect(ROAD_X + midLane * LANE_W - 3, m.y, 2, 20);
        ctx.fillRect(ROAD_X + midLane * LANE_W + 1, m.y, 2, 20);
    });
    ctx.globalAlpha = 1;

    // 草地纹理
    if (state === 'playing' || state === 'gameover') {
        ctx.fillStyle = scene.name === '雪山赛道' ? '#c8dae8' : (scene.name === '沙漠公路' ? '#b89a55' : '#245a1e');
        for (let i = 0; i < 12; i++) {
            const gy = ((distance * 2 + i * 55) % H);
            ctx.fillRect(5 + (i*7)%30, gy, 3, 8);
            ctx.fillRect(W - 10 - (i*11)%30, gy + 20, 3, 8);
        }
    }

    if (state === 'start') return;

    // 金币
    coins.forEach(c => {
        const pulse = 1 + Math.sin(performance.now()/200 + c.x)*0.15;
        const r = 7 * pulse;
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath(); ctx.arc(c.x, c.y, r*0.65, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#92400e';
        ctx.font = `bold ${Math.round(r*0.9)}px sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('$', c.x, c.y+1);
    });

    // 道具
    powerups.forEach(p => {
        const pulse = 1 + Math.sin(performance.now()/250)*0.1;
        const g = ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,16);
        g.addColorStop(0, p.color+'50'); g.addColorStop(1,'transparent');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(p.x,p.y,16,0,Math.PI*2); ctx.fill();
        ctx.font = `${15*pulse}px sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(p.icon, p.x, p.y);
    });

    // 障碍车
    obstacles.forEach(o => drawObstacleCar(o));

    // 玩家车
    if (player) {
        const blink = player.invincible ? Math.sin(performance.now()/60) > 0 : true;
        if (blink) drawPlayerCar();
    }

    // 粒子
    particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.size*p.life,0,Math.PI*2); ctx.fill();
    });
    ctx.globalAlpha = 1;

    // 飘字
    floats.forEach(f => {
        ctx.globalAlpha = f.alpha;
        ctx.fillStyle = f.color;
        ctx.font = `bold ${f.size}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(f.text, f.x, f.y);
    });
    ctx.globalAlpha = 1;

    // 近距离闪避提示
    if (nearMissTimer > 0) {
        ctx.globalAlpha = nearMissTimer / 500;
        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('⚡ NEAR MISS!', W/2, 30);
        ctx.globalAlpha = 1;
    }

    // 减速效果
    if (player && player.slowmo) {
        ctx.globalAlpha = 0.08;
        ctx.fillStyle = '#67e8f9';
        ctx.fillRect(0,0,W,H);
        ctx.globalAlpha = 1;
    }

    // 场景名
    const sc = getScene();
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(sc.name, W - 10, H - 8);
}

// ===== 绘制玩家车 =====
function drawPlayerCar() {
    const m = player.model;
    const x = player.x, y = player.y;
    drawCarModel(ctx, x, y, m, 1);

    // 护盾
    if (player.shielded) {
        ctx.strokeStyle = `rgba(56,189,248,${0.3+Math.sin(performance.now()/200)*0.2})`;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(x, y, m.w/2+10, 0, Math.PI*2); ctx.stroke();
    }
    // 磁铁范围
    if (player.magnetized) {
        ctx.strokeStyle = `rgba(167,139,250,${0.12+Math.sin(performance.now()/300)*0.08})`;
        ctx.lineWidth = 1; ctx.setLineDash([3,3]);
        ctx.beginPath(); ctx.arc(x, y, 60, 0, Math.PI*2); ctx.stroke();
        ctx.setLineDash([]);
    }
}

// ===== 绘制车辆模型 =====
function drawCarModel(c, x, y, m, scale) {
    const w = m.w * scale, h = m.h * scale;
    const hw = w/2, hh = h/2;

    // 阴影
    c.fillStyle = 'rgba(0,0,0,0.2)';
    c.beginPath();
    c.ellipse(x+2, y+2, hw+2, hh+2, 0, 0, Math.PI*2);
    c.fill();

    // 车身主体
    c.fillStyle = m.color;
    c.beginPath();
    c.moveTo(x - hw + 4, y - hh + 6);       // 左前
    c.quadraticCurveTo(x, y - hh - 2, x + hw - 4, y - hh + 6); // 前盖弧线
    c.lineTo(x + hw, y - hh + 14);           // 右前翼
    c.lineTo(x + hw + 2, y + 4);             // 右侧
    c.lineTo(x + hw, y + hh - 6);            // 右后翼
    c.quadraticCurveTo(x, y + hh + 2, x - hw, y + hh - 6); // 后部弧线
    c.lineTo(x - hw - 2, y + 4);             // 左侧
    c.lineTo(x - hw, y - hh + 14);           // 左前翼
    c.closePath();
    c.fill();

    // 车顶（深色）
    c.fillStyle = 'rgba(0,0,0,0.15)';
    c.beginPath();
    c.moveTo(x - hw + 8, y - 6);
    c.quadraticCurveTo(x, y - 12, x + hw - 8, y - 6);
    c.lineTo(x + hw - 8, y + 8);
    c.quadraticCurveTo(x, y + 12, x - hw + 8, y + 8);
    c.closePath();
    c.fill();

    // 前挡风玻璃
    c.fillStyle = m.accent;
    c.globalAlpha = 0.6;
    c.beginPath();
    c.moveTo(x - hw + 7, y - hh + 14);
    c.quadraticCurveTo(x, y - hh + 8, x + hw - 7, y - hh + 14);
    c.lineTo(x + hw - 9, y - 6);
    c.quadraticCurveTo(x, y - 4, x - hw + 9, y - 6);
    c.closePath();
    c.fill();
    c.globalAlpha = 1;

    // 后挡风
    c.fillStyle = m.accent;
    c.globalAlpha = 0.4;
    c.beginPath();
    c.moveTo(x - hw + 9, y + 8);
    c.quadraticCurveTo(x, y + 6, x + hw - 9, y + 8);
    c.lineTo(x + hw - 7, y + hh - 10);
    c.quadraticCurveTo(x, y + hh - 6, x - hw + 7, y + hh - 10);
    c.closePath();
    c.fill();
    c.globalAlpha = 1;

    // 车灯（前）
    c.fillStyle = '#fef3c7';
    c.beginPath(); c.arc(x - hw + 6, y - hh + 8, 2.5*scale, 0, Math.PI*2); c.fill();
    c.beginPath(); c.arc(x + hw - 6, y - hh + 8, 2.5*scale, 0, Math.PI*2); c.fill();

    // 尾灯
    c.fillStyle = '#ef4444';
    c.fillRect(x - hw + 3, y + hh - 5, 5*scale, 2.5*scale);
    c.fillRect(x + hw - 3 - 5*scale, y + hh - 5, 5*scale, 2.5*scale);

    // 中线装饰
    c.strokeStyle = m.accent;
    c.globalAlpha = 0.3;
    c.lineWidth = 1;
    c.beginPath(); c.moveTo(x, y - hh + 4); c.lineTo(x, y + hh - 4); c.stroke();
    c.globalAlpha = 1;
}

// ===== 绘制障碍车（朝下开）=====
function drawObstacleCar(o) {
    const x = o.x, y = o.y;
    const hw = o.w/2, hh = o.h/2;

    // 阴影
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath(); ctx.ellipse(x+2,y+2,hw+2,hh+2,0,0,Math.PI*2); ctx.fill();

    // 车身
    ctx.fillStyle = o.color;
    ctx.beginPath();
    ctx.moveTo(x - hw + 3, y + hh - 5);
    ctx.quadraticCurveTo(x, y + hh + 2, x + hw - 3, y + hh - 5);
    ctx.lineTo(x + hw, y + hh - 12);
    ctx.lineTo(x + hw + 1, y - 4);
    ctx.lineTo(x + hw - 1, y - hh + 5);
    ctx.quadraticCurveTo(x, y - hh - 1, x - hw + 1, y - hh + 5);
    ctx.lineTo(x - hw - 1, y - 4);
    ctx.lineTo(x - hw, y + hh - 12);
    ctx.closePath();
    ctx.fill();

    // 车顶
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.beginPath();
    ctx.moveTo(x-hw+7, y-4); ctx.quadraticCurveTo(x,y-10,x+hw-7,y-4);
    ctx.lineTo(x+hw-7,y+8); ctx.quadraticCurveTo(x,y+12,x-hw+7,y+8);
    ctx.closePath(); ctx.fill();

    // 挡风玻璃
    ctx.fillStyle = o.accent;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.moveTo(x-hw+6, y-hh+12); ctx.quadraticCurveTo(x,y-hh+6,x+hw-6,y-hh+12);
    ctx.lineTo(x+hw-8,y-4); ctx.quadraticCurveTo(x,y-2,x-hw+8,y-4);
    ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 1;

    // 尾灯（在上方，因为对向行驶）
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(x-hw+2, y-hh+3, 4, 2);
    ctx.fillRect(x+hw-6, y-hh+3, 4, 2);

    // 警车特殊：警灯
    if (o.name === 'police') {
        const flash = Math.sin(performance.now()/100) > 0;
        ctx.fillStyle = flash ? '#ef4444' : '#3b82f6';
        ctx.beginPath(); ctx.arc(x-4, y-hh+8, 3, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = flash ? '#3b82f6' : '#ef4444';
        ctx.beginPath(); ctx.arc(x+4, y-hh+8, 3, 0, Math.PI*2); ctx.fill();
    }

    // 出租车特殊：顶灯
    if (o.name === 'taxi') {
        ctx.fillStyle = '#fde047';
        ctx.fillRect(x-4, y-6, 8, 4);
    }
}

// ===== 输入控制 =====
document.addEventListener('keydown', e => {
    if (state !== 'playing') {
        if (e.key === 'Enter') { if (state === 'start') startGame(); else if (state === 'gameover') startGame(); }
        return;
    }
    if ((e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') && player.targetLane > 0) {
        e.preventDefault(); player.targetLane--;
    }
    if ((e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') && player.targetLane < LANES - 1) {
        e.preventDefault(); player.targetLane++;
    }
    if (e.key === ' ') {
        e.preventDefault();
        if (!player.nitroActive && player.nitro >= 0) {
            player.nitroActive = true;
            player.nitroTimer = 2000;
        }
    }
});

// 触屏滑动
let touchStartX = 0;
canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    touchStartX = e.touches[0].clientX;
}, { passive: false });

canvas.addEventListener('touchend', e => {
    e.preventDefault();
    if (state !== 'playing') return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) < 25) return;
    if (dx < 0 && player.targetLane > 0) player.targetLane--;
    if (dx > 0 && player.targetLane < LANES - 1) player.targetLane++;
}, { passive: false });

// 初始渲染
render();
