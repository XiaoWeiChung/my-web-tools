/**
 * 雷电战机 - 网页版
 */
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;
const $ = s => document.querySelector(s);

// ===== 游戏状态 =====
let state = 'start'; // start, playing, paused, gameover
let score = 0;
let best = parseInt(localStorage.getItem('thunder-best')) || 0;
let frameId = null;
let lastTime = 0;

// 玩家
let player = null;
// 实体列表
let bullets = [];       // 玩家子弹
let enemies = [];       // 敌机
let enemyBullets = [];  // 敌机子弹
let powerups = [];      // 道具
let explosions = [];    // 爆炸
let particles = [];     // 粒子
let stars = [];         // 背景星星
let floats = [];        // 飘字
let coins = [];         // 金币
let bombEffect = null;  // 炸弹特效状态
let shockwave = null;   // 冲击波

// 波次系统
let wave = 1;
let waveTimer = 0;
let waveEnemiesLeft = 0;
let spawnTimer = 0;
let bossActive = false;

// ===== 配置 =====
const PLAYER_SPEED = 5;
const BULLET_SPEED = 8;
const FIRE_RATE = 120; // ms

// ===== 初始化 =====
$('#best').textContent = best;
initStars();

// ===== 玩家类 =====
function createPlayer() {
    return {
        x: W / 2, y: H - 80,
        w: 32, h: 36,
        lives: 5,
        bombs: 2,
        bombTypes: ['fire', 'ice', 'thunder', 'nuke'],  // 可用炸弹类型
        currentBomb: 0,  // 当前选中的炸弹索引
        weaponLevel: 1,  // 1-5
        fireTimer: 0,
        shielded: false,
        shieldTimer: 0,
        magnetized: false,
        magnetTimer: 0,
        invincible: false,
        invincibleTimer: 0,
        extraBarrels: 0,   // 永久额外弹道 0-3
        laserActive: false,
        laserTimer: 0,
        wingmen: 0,        // 僚机数量 0-2
        frozen: false,     // 冰冻全场
        frozenTimer: 0,
    };
}

// ===== 敌机模板 =====
const ENEMY_TYPES = {
    small:  { w: 24, h: 24, hp: 2, speed: 1.0, score: 10, color: '#4ade80', fireRate: 0 },
    medium: { w: 30, h: 30, hp: 4, speed: 0.7, score: 25, color: '#facc15', fireRate: 2500 },
    fast: { w: 20, h: 20, hp: 2, speed: 2.0, score: 15, color: '#38bdf8', fireRate: 0 },
    elite: { w: 34, h: 34, hp: 8, speed: 0.5, score: 50, color: '#f87171', fireRate: 1400 },
    boss: { w: 64, h: 56, hp: 100, speed: 0.4, score: 300, color: '#c084fc', fireRate: 900 },
};

// ===== 道具类型 =====
const POWERUP_TYPES = [
    { type: 'weapon', icon: '⚡', color: '#fbbf24', desc: '武器升级' },
    { type: 'shield', icon: '🛡️', color: '#38bdf8', desc: '护盾' },
    { type: 'bomb', icon: '💣', color: '#f87171', desc: '炸弹+1' },
    { type: 'heal', icon: '❤️', color: '#f472b6', desc: '回血' },
    { type: 'magnet', icon: '🧲', color: '#a78bfa', desc: '磁铁' },
    { type: 'barrel', icon: '🚀', color: '#fb923c', desc: '弹道+1' },
    { type: 'homing', icon: '🎯', color: '#f43f5e', desc: '追踪导弹' },
    { type: 'laser', icon: '🔥', color: '#22d3ee', desc: '激光炮' },
];

// ===== 开始游戏 =====
$('#btnStart').addEventListener('click', startGame);
$('#btnRestart').addEventListener('click', startGame);
$('#btnResume').addEventListener('click', () => setState('playing'));

function startGame() {
    player = createPlayer();
    bullets = []; enemies = []; enemyBullets = []; powerups = [];
    explosions = []; particles = []; floats = []; coins = [];
    bombEffect = null; shockwave = null;
    score = 0; wave = 1; waveTimer = 0; spawnTimer = 0;
    waveEnemiesLeft = 0; bossActive = false;
    $('#score').textContent = '0';
    updateHUD();
    startWave();
    setState('playing');
    lastTime = performance.now();
    if (frameId) cancelAnimationFrame(frameId);
    frameId = requestAnimationFrame(gameLoop);
}

function setState(s) {
    state = s;
    $('#startOv').classList.toggle('hidden', s !== 'start');
    $('#pauseOv').classList.toggle('hidden', s !== 'paused');
    $('#gameoverOv').classList.toggle('hidden', s !== 'gameover');
}

function updateHUD() {
    let livesHtml = '';
    for (let i = 0; i < player.lives; i++) livesHtml += '❤️';
    for (let i = player.lives; i < 5; i++) livesHtml += '🖤';
    $('#lives').innerHTML = livesHtml;
    let waveText = bossActive ? '⚠️ BOSS' : `第 ${wave} 波`;
    const bombIcons = { fire: '🔥', ice: '🌊', thunder: '⚡', nuke: '☢️' };
    if (player.bombs > 0) {
        const bType = player.bombTypes[player.currentBomb];
        waveText += ` ${bombIcons[bType]}×${player.bombs}`;
    }
    if (player.extraBarrels > 0) waveText += ` 🚀×${player.extraBarrels}`;
    $('#wave').textContent = waveText;
}

// ===== 波次系统 =====
function startWave() {
    if (wave % 5 === 0) {
        spawnBoss();
    } else {
        // 敌机数量随波次递增：第1波10个，第2波14个，第10波42个...
        waveEnemiesLeft = 8 + wave * 4;
        spawnTimer = 0;
        // 第3波起每波出编队
        if (wave >= 3) {
            setTimeout(() => spawnFormation(), 1500);
            // 第7波起出两次编队
            if (wave >= 7) setTimeout(() => spawnFormation(), 4000);
        }
    }
    addFloat(W/2, H/2 - 40, bossActive ? '⚠️ BOSS 来袭!' : `第 ${wave} 波`, '#fbbf24', 28);
}

// 编队生成
function spawnFormation() {
    const formations = ['v', 'line', 'circle', 'zigzag'];
    const type = formations[Math.floor(Math.random() * formations.length)];
    const count = Math.min(5 + Math.floor(wave / 2), 12);
    const eType = wave >= 6 ? 'medium' : 'small';
    const t = ENEMY_TYPES[eType];

    for (let i = 0; i < count; i++) {
        let x, y;
        switch (type) {
            case 'v':
                x = W/2 + (i - count/2) * 30;
                y = -30 - Math.abs(i - count/2) * 25;
                break;
            case 'line':
                x = (W / (count + 1)) * (i + 1);
                y = -30 - i * 8;
                break;
            case 'circle':
                const angle = (Math.PI * i) / count;
                x = W/2 + Math.cos(angle) * 80;
                y = -30 - Math.sin(angle) * 40;
                break;
            case 'zigzag':
                x = 40 + (i % 2 === 0 ? i * 35 : i * 35 + 20);
                y = -30 - i * 20;
                break;
        }
        x = Math.max(t.w, Math.min(W - t.w, x));
        const hp = t.hp + Math.floor(wave * 0.8);
        enemies.push({
            x, y, w: t.w, h: t.h,
            hp, maxHp: hp,
            speed: t.speed + wave * 0.1,
            score: t.score + 5,
            color: t.color,
            fireRate: t.fireRate,
            fireTimer: Math.random() * 3000,
            type: eType,
        });
    }
    addFloat(W/2, H/2, `${count}机编队!`, '#f87171', 16);
}

function spawnBoss() {
    bossActive = true;
    const t = ENEMY_TYPES.boss;
    const bossHp = t.hp + wave * 15;
    enemies.push({
        x: W/2, y: -60, w: t.w, h: t.h,
        hp: bossHp, maxHp: bossHp,
        speed: t.speed, score: t.score + wave * 20,
        color: t.color, fireRate: t.fireRate,
        fireTimer: 0, type: 'boss',
        movePhase: 0, targetY: 70,
    });
    updateHUD();
}

function spawnEnemy() {
    const roll = Math.random();
    let type;
    if (wave >= 8 && roll < 0.12) type = 'elite';
    else if (wave >= 4 && roll < 0.25) type = 'medium';
    else if (roll < 0.4) type = 'fast';
    else type = 'small';

    const t = ENEMY_TYPES[type];
    const hp = t.hp + Math.floor(wave * 0.8);
    enemies.push({
        x: t.w/2 + Math.random() * (W - t.w),
        y: -t.h,
        w: t.w, h: t.h,
        hp, maxHp: hp,
        speed: t.speed + wave * 0.1,
        score: t.score,
        color: t.color,
        fireRate: (type === 'small' && wave >= 4) ? 3500 : t.fireRate,
        fireTimer: Math.random() * 2000,
        type,
    });
}

// ===== 主循环 =====
function gameLoop(ts) {
    const dt = Math.min(ts - lastTime, 50);
    lastTime = ts;
    if (state === 'playing') {
        update(dt);
    }
    render();
    frameId = requestAnimationFrame(gameLoop);
}

// ===== 更新 =====
function update(dt) {
    // 玩家开火
    player.fireTimer -= dt;
    if (player.fireTimer <= 0) {
        firePlayerBullets();
        player.fireTimer = FIRE_RATE - player.weaponLevel * 8;
    }

    // Buff 计时
    if (player.shielded) { player.shieldTimer -= dt; if (player.shieldTimer <= 0) player.shielded = false; }
    if (player.magnetized) { player.magnetTimer -= dt; if (player.magnetTimer <= 0) player.magnetized = false; }
    if (player.invincible) { player.invincibleTimer -= dt; if (player.invincibleTimer <= 0) player.invincible = false; }
    if (player.laserActive) { player.laserTimer -= dt; if (player.laserTimer <= 0) player.laserActive = false; }
    if (player.frozen) { player.frozenTimer -= dt; if (player.frozenTimer <= 0) player.frozen = false; }

    // 生成敌机
    if (!bossActive && waveEnemiesLeft > 0) {
        spawnTimer -= dt;
        if (spawnTimer <= 0) {
            spawnEnemy();
            waveEnemiesLeft--;
            spawnTimer = Math.max(200, 800 - wave * 40);
        }
    }

    // 移动子弹
    bullets.forEach(b => {
        if (b.type === 'homing') {
            // 追踪导弹：找最近敌机
            b.life -= dt;
            let target = null, minDist = Infinity;
            enemies.forEach(e => {
                if (e.hp <= 0) return;
                const d = Math.sqrt((e.x-b.x)**2 + (e.y-b.y)**2);
                if (d < minDist) { minDist = d; target = e; }
            });
            if (target) {
                const angle = Math.atan2(target.y - b.y, target.x - b.x);
                const turnSpeed = 0.12;
                const curAngle = Math.atan2(b.vy, b.vx);
                let diff = angle - curAngle;
                while (diff > Math.PI) diff -= Math.PI*2;
                while (diff < -Math.PI) diff += Math.PI*2;
                const newAngle = curAngle + Math.sign(diff) * Math.min(Math.abs(diff), turnSpeed);
                b.vx = Math.cos(newAngle) * 5;
                b.vy = Math.sin(newAngle) * 5;
            }
            b.x += b.vx;
            b.y += b.vy;
            // 追踪导弹拖尾
            particles.push({ x: b.x, y: b.y, vx: (Math.random()-0.5)*0.5, vy: 1, life: 0.6, decay: 0.04, size: 2, color: '#f43f5e' });
        } else if (b.type === 'laser') {
            // 激光跟随玩家位置
            b.x = player.x;
            b.y = 0;
            b.h = player.y - player.h/2;
        } else if (b.vx !== undefined) {
            b.x += b.vx;
            b.y += b.vy;
        } else {
            b.y -= b.speed;
        }
    });
    bullets = bullets.filter(b => {
        if (b.type === 'laser') return player.laserActive;
        if (b.type === 'homing') return b.life > 0 && b.y > -20 && b.y < H+20 && b.x > -20 && b.x < W+20;
        return b.y > -10 && b.y < H+10 && b.x > -20 && b.x < W+20;
    });

    enemyBullets.forEach(b => { const sm = player.frozen ? 0.3 : 1; b.x += b.vx * sm; b.y += b.vy * sm; });
    enemyBullets = enemyBullets.filter(b => b.y < H + 10 && b.y > -10 && b.x > -10 && b.x < W + 10);

    // 移动敌机
    const speedMult = player.frozen ? 0.25 : 1;
    enemies.forEach(e => {
        if (e.type === 'boss') {
            // Boss 移动模式
            if (e.y < e.targetY) { e.y += 1; }
            else {
                e.movePhase += dt * 0.001;
                e.x = W/2 + Math.sin(e.movePhase) * (W/2 - e.w);
            }
            // Boss 开火
            e.fireTimer -= dt;
            if (e.fireTimer <= 0 && e.y >= e.targetY) {
                fireBossPattern(e);
                e.fireTimer = e.fireRate;
            }
        } else {
            e.y += e.speed * speedMult;
            // 普通敌机开火
            if (e.fireRate > 0) {
                e.fireTimer -= dt;
                if (e.fireTimer <= 0) {
                    const angle = Math.atan2(player.y - e.y, player.x - e.x);
                    enemyBullets.push({ x: e.x, y: e.y + e.h/2, vx: Math.cos(angle)*3, vy: Math.sin(angle)*3, r: 3 });
                    e.fireTimer = e.fireRate + Math.random() * 500;
                }
            }
        }
    });
    // 移除出界和已死亡的敌机
    enemies = enemies.filter(e => e.hp > 0 && (e.y < H + 60 || e.type === 'boss'));

    // 移动道具
    powerups.forEach(p => { p.y += 1.5; });
    powerups = powerups.filter(p => p.y < H + 20);

    // 移动金币
    coins.forEach(c => {
        if (player.magnetized) {
            const dx = player.x - c.x, dy = player.y - c.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist > 5) { c.x += dx/dist * 5; c.y += dy/dist * 5; }
        } else {
            c.y += 1.2;
        }
    });
    coins = coins.filter(c => c.y < H + 20);

    // 更新炸弹特效
    if (bombEffect) {
        bombEffect.timer -= dt;
        if (bombEffect.timer <= 0) bombEffect = null;
    }
    if (shockwave) {
        shockwave.r += shockwave.speed;
        if (shockwave.r >= shockwave.maxR) shockwave = null;
    }
    // 炸弹延迟伤害
    enemies.forEach(e => {
        if (e.bombHitDelay !== undefined) {
            e.bombHitDelay -= dt;
            // 核弹推开效果
            if (e.pushTimer > 0) {
                e.x += e.pushVx;
                e.y += e.pushVy;
                e.pushTimer -= dt;
            }
            if (e.bombHitDelay <= 0) {
                e.hp -= e.bombDmg;
                const colors = { fire: '#f97316', ice: '#38bdf8', thunder: '#fbbf24', nuke: '#c084fc' };
                spawnHitParticles(e.x, e.y, colors[e.bombType] || '#fbbf24');
                addExplosion(e.x, e.y, e.w);
                if (e.hp <= 0) { e.hp = 0; destroyEnemy(e); }
                delete e.bombHitDelay;
                delete e.bombDmg;
                delete e.bombType;
                delete e.pushVx;
                delete e.pushVy;
                delete e.pushTimer;
            }
        }
    });
    enemies = enemies.filter(e => e.hp > 0);

    // 碰撞检测
    checkCollisions();

    // 更新爆炸
    explosions.forEach(ex => { ex.timer -= dt; ex.r += 1.5; });
    explosions = explosions.filter(ex => ex.timer > 0);

    // 更新粒子
    particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += 0.05; p.life -= p.decay; });
    particles = particles.filter(p => p.life > 0);

    // 更新飘字
    floats.forEach(f => { f.y -= 0.6; f.alpha -= 0.008; });
    floats = floats.filter(f => f.alpha > 0);

    // 更新星星
    stars.forEach(s => { s.y += s.speed; if (s.y > H) { s.y = 0; s.x = Math.random() * W; } });

    // 检查波次完成
    if (!bossActive && waveEnemiesLeft <= 0 && enemies.length === 0) {
        wave++;
        startWave();
        updateHUD();
    }
}

// ===== 玩家开火 =====
function firePlayerBullets() {
    const lv = player.weaponLevel;
    const bx = player.x, by = player.y - player.h/2;
    const dmg = 1;  // 基础伤害固定为1，靠子弹数量提升DPS

    if (lv >= 5) {
        for (let i = -2; i <= 2; i++) {
            const angle = -Math.PI/2 + i * 0.12;
            bullets.push({ x: bx, y: by, speed: BULLET_SPEED, vx: Math.cos(angle)*BULLET_SPEED, vy: Math.sin(angle)*BULLET_SPEED, dmg, w: 6, h: 14, type: 'normal' });
        }
    } else if (lv >= 4) {
        bullets.push({ x: bx-10, y: by, speed: BULLET_SPEED, dmg, w: 6, h: 14, type: 'normal' });
        bullets.push({ x: bx+10, y: by, speed: BULLET_SPEED, dmg, w: 6, h: 14, type: 'normal' });
        bullets.push({ x: bx, y: by-5, speed: BULLET_SPEED+1, dmg: dmg+1, w: 8, h: 16, type: 'power' });
    } else if (lv >= 3) {
        bullets.push({ x: bx-8, y: by, speed: BULLET_SPEED, dmg, w: 6, h: 12, type: 'normal' });
        bullets.push({ x: bx, y: by-4, speed: BULLET_SPEED, dmg, w: 6, h: 12, type: 'normal' });
        bullets.push({ x: bx+8, y: by, speed: BULLET_SPEED, dmg, w: 6, h: 12, type: 'normal' });
    } else if (lv >= 2) {
        bullets.push({ x: bx-6, y: by, speed: BULLET_SPEED, dmg, w: 6, h: 12, type: 'normal' });
        bullets.push({ x: bx+6, y: by, speed: BULLET_SPEED, dmg, w: 6, h: 12, type: 'normal' });
    } else {
        bullets.push({ x: bx, y: by, speed: BULLET_SPEED, dmg, w: 6, h: 12, type: 'normal' });
    }

    // 额外弹道（永久，斜向两侧发射）
    for (let i = 0; i < player.extraBarrels; i++) {
        const spread = (i + 1) * 0.25;
        bullets.push({ x: bx, y: by, speed: BULLET_SPEED, vx: -Math.sin(spread)*BULLET_SPEED, vy: -Math.cos(spread)*BULLET_SPEED, dmg, w: 3, h: 10, type: 'extra' });
        bullets.push({ x: bx, y: by, speed: BULLET_SPEED, vx: Math.sin(spread)*BULLET_SPEED, vy: -Math.cos(spread)*BULLET_SPEED, dmg, w: 3, h: 10, type: 'extra' });
    }

    // 激光炮（贯穿，不消失）
    if (player.laserActive) {
        bullets.push({ x: bx, y: by, speed: 0, dmg: 2, w: 8, h: by, type: 'laser', pierce: true });
    }

    // 僚机开火
    for (let i = 0; i < player.wingmen; i++) {
        const side = i === 0 ? -1 : 1;
        const wx = bx + side * 28;
        const wy = by + 20;
        bullets.push({ x: wx, y: wy, speed: BULLET_SPEED - 1, dmg: 1, w: 4, h: 10, type: 'wingman' });
    }
}

// 追踪导弹
function fireHomingMissiles() {
    const count = 3;
    for (let i = 0; i < count; i++) {
        const offsetX = (i - 1) * 20;
        bullets.push({
            x: player.x + offsetX, y: player.y - player.h/2,
            speed: 4, dmg: 5, w: 6, h: 14,
            type: 'homing', pierce: false,
            vx: offsetX * 0.1, vy: -4,
            life: 3000,
        });
    }
}

// Boss 弹幕
function fireBossPattern(boss) {
    const patterns = [fireRadial, fireAimed, fireSpiral, fireShotgun, fireCross];
    patterns[Math.floor(Math.random() * patterns.length)](boss);
}

function fireRadial(boss) {
    const count = 10 + wave;
    const spd = 2 + wave * 0.1;
    for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count;
        enemyBullets.push({ x: boss.x, y: boss.y + boss.h/2, vx: Math.cos(angle)*spd, vy: Math.sin(angle)*spd, r: 4 });
    }
}

function fireAimed(boss) {
    const count = 2 + Math.floor(wave / 4);
    const spd = 3 + wave * 0.08;
    for (let i = -count; i <= count; i++) {
        const angle = Math.atan2(player.y - boss.y, player.x - boss.x) + i * 0.1;
        enemyBullets.push({ x: boss.x, y: boss.y + boss.h/2, vx: Math.cos(angle)*spd, vy: Math.sin(angle)*spd, r: 3 });
    }
}

function fireSpiral(boss) {
    const base = performance.now() * 0.004;
    const arms = 8 + Math.floor(wave / 2);
    for (let i = 0; i < arms; i++) {
        const angle = base + (Math.PI * 2 * i) / arms;
        enemyBullets.push({ x: boss.x, y: boss.y + boss.h/2, vx: Math.cos(angle)*2.2, vy: Math.sin(angle)*2.2, r: 3 });
    }
}

function fireShotgun(boss) {
    // 散弹：3组密集弹幕
    for (let g = -1; g <= 1; g++) {
        const baseAngle = Math.atan2(player.y - boss.y, player.x + g * 80 - boss.x);
        for (let i = 0; i < 5; i++) {
            const angle = baseAngle + (Math.random() - 0.5) * 0.4;
            const spd = 3 + Math.random() * 1.5;
            enemyBullets.push({ x: boss.x + g * 20, y: boss.y + boss.h/2, vx: Math.cos(angle)*spd, vy: Math.sin(angle)*spd, r: 3 });
        }
    }
}

function fireCross(boss) {
    // 十字弹幕：4个方向各发一排
    const spd = 3 + wave * 0.1;
    const dirs = [[0,1],[0,-1],[1,0],[-1,0],[0.7,0.7],[-0.7,0.7],[0.7,-0.7],[-0.7,-0.7]];
    dirs.forEach(([dx, dy]) => {
        for (let j = 0; j < 3; j++) {
            const s = spd - j * 0.5;
            enemyBullets.push({ x: boss.x, y: boss.y, vx: dx*s, vy: dy*s, r: 3 });
        }
    });
}

// ===== 碰撞检测 =====
function checkCollisions() {
    // 玩家子弹 vs 敌机
    bullets.forEach(b => {
        enemies.forEach(e => {
            if (b.dead || e.hp <= 0) return;
            let hit = false;
            if (b.type === 'laser') {
                // 激光：检测敌机是否在激光柱范围内
                hit = e.x + e.w/2 > b.x - b.w/2 && e.x - e.w/2 < b.x + b.w/2 && e.y > 0 && e.y < player.y;
            } else {
                hit = rectHit(b.x - b.w/2, b.y - b.h/2, b.w, b.h, e.x - e.w/2, e.y - e.h/2, e.w, e.h);
            }
            if (hit) {
                e.hp -= b.dmg;
                if (!b.pierce) b.dead = true; // 激光不消失
                spawnHitParticles(b.x || e.x, b.y || e.y, e.color);
                if (e.hp <= 0) destroyEnemy(e);
            }
        });
    });
    bullets = bullets.filter(b => !b.dead);

    // 敌机子弹 vs 玩家
    if (!player.invincible) {
        enemyBullets.forEach(b => {
            if (b.dead) return;
            if (circleRectHit(b.x, b.y, b.r, player.x - player.w/2, player.y - player.h/2, player.w, player.h)) {
                b.dead = true;
                if (player.shielded) {
                    player.shielded = false;
                    addFloat(player.x, player.y - 20, '🛡️ 护盾破碎', '#38bdf8', 14);
                    spawnHitParticles(player.x, player.y, '#38bdf8');
                } else {
                    playerHit();
                }
            }
        });
        enemyBullets = enemyBullets.filter(b => !b.dead);
    }

    // 敌机 vs 玩家（撞机）
    if (!player.invincible) {
        enemies.forEach(e => {
            if (e.hp <= 0) return;
            if (rectHit(player.x-player.w/2, player.y-player.h/2, player.w, player.h, e.x-e.w/2, e.y-e.h/2, e.w, e.h)) {
                if (player.shielded) {
                    player.shielded = false;
                    e.hp -= 5;
                    if (e.hp <= 0) destroyEnemy(e);
                } else {
                    playerHit();
                }
            }
        });
    }

    // 玩家 vs 道具
    powerups.forEach(p => {
        if (p.dead) return;
        if (rectHit(player.x-player.w/2, player.y-player.h/2, player.w, player.h, p.x-12, p.y-12, 24, 24)) {
            applyPowerup(p);
            p.dead = true;
        }
    });
    powerups = powerups.filter(p => !p.dead);

    // 玩家 vs 金币
    coins.forEach(c => {
        if (c.dead) return;
        const dist = Math.sqrt((player.x-c.x)**2 + (player.y-c.y)**2);
        if (dist < 20) {
            score += c.value;
            $('#score').textContent = score;
            c.dead = true;
            addFloat(c.x, c.y, `+${c.value}`, '#fbbf24', 12);
        }
    });
    coins = coins.filter(c => !c.dead);
}

function rectHit(x1,y1,w1,h1,x2,y2,w2,h2) {
    return x1 < x2+w2 && x1+w1 > x2 && y1 < y2+h2 && y1+h1 > y2;
}

function circleRectHit(cx,cy,cr,rx,ry,rw,rh) {
    const nx = Math.max(rx, Math.min(cx, rx+rw));
    const ny = Math.max(ry, Math.min(cy, ry+rh));
    return (cx-nx)**2 + (cy-ny)**2 < cr*cr;
}

function destroyEnemy(e) {
    score += e.score;
    $('#score').textContent = score;
    addExplosion(e.x, e.y, e.type === 'boss' ? 50 : e.w);
    addFloat(e.x, e.y - 10, `+${e.score}`, e.color, 14);

    // 掉落金币
    const coinCount = e.type === 'boss' ? 12 : (e.type === 'elite' ? 4 : 1);
    for (let i = 0; i < coinCount; i++) {
        coins.push({ x: e.x + (Math.random()-0.5)*30, y: e.y + (Math.random()-0.5)*20, value: e.type === 'boss' ? 10 : 5 });
    }

    // 掉落道具（降低掉率）
    const dropChance = e.type === 'boss' ? 1 : (e.type === 'elite' ? 0.3 : 0.1);
    if (Math.random() < dropChance) {
        // 武器升级权重更高
        const weights = [
            { type: 'weapon', icon: '⚡', color: '#fbbf24', desc: '武器升级', weight: player.weaponLevel >= 5 ? 0 : 20 },
            { type: 'shield', icon: '🛡️', color: '#38bdf8', desc: '护盾', weight: 16 },
            { type: 'bomb', icon: '💣', color: '#f87171', desc: '炸弹+1', weight: 14 },
            { type: 'heal', icon: '❤️', color: '#f472b6', desc: '回血', weight: player.lives >= 5 ? 0 : 14 },
            { type: 'magnet', icon: '🧲', color: '#a78bfa', desc: '磁铁', weight: 8 },
            { type: 'barrel', icon: '🚀', color: '#fb923c', desc: '弹道+1', weight: player.extraBarrels >= 3 ? 0 : 8 },
            { type: 'homing', icon: '🎯', color: '#f43f5e', desc: '追踪导弹', weight: 7 },
            { type: 'laser', icon: '🔥', color: '#22d3ee', desc: '激光炮', weight: 5 },
            { type: 'wingman', icon: '✈️', color: '#60a5fa', desc: '僚机', weight: player.wingmen >= 2 ? 0 : 5 },
            { type: 'freeze', icon: '❄️', color: '#67e8f9', desc: '冰冻弹', weight: 5 },
        ];
        const total = weights.reduce((s, w) => s + w.weight, 0);
        let roll = Math.random() * total;
        let pu = weights[0];
        for (const w of weights) { roll -= w.weight; if (roll <= 0) { pu = w; break; } }
        powerups.push({ x: e.x, y: e.y, type: pu.type, icon: pu.icon, color: pu.color, desc: pu.desc });
    }

    if (e.type === 'boss') {
        bossActive = false;
        wave++;
        setTimeout(() => { startWave(); updateHUD(); }, 1500);
    }
}

function playerHit() {
    player.lives--;
    updateHUD();
    addExplosion(player.x, player.y, 20);
    if (player.lives <= 0) {
        gameOver();
    } else {
        player.invincible = true;
        player.invincibleTimer = 2000;
        addFloat(player.x, player.y - 30, '💥', '#ef4444', 20);
    }
}

function applyPowerup(p) {
    switch (p.type) {
        case 'weapon':
            player.weaponLevel = Math.min(5, player.weaponLevel + 1);
            addFloat(p.x, p.y, `⚡ Lv${player.weaponLevel}`, '#fbbf24', 14);
            break;
        case 'shield':
            player.shielded = true;
            player.shieldTimer = 8000;
            addFloat(p.x, p.y, '🛡️ 护盾', '#38bdf8', 14);
            break;
        case 'bomb':
            player.bombs = Math.min(5, player.bombs + 1);
            addFloat(p.x, p.y, '💣+1', '#f87171', 14);
            break;
        case 'heal':
            player.lives = Math.min(5, player.lives + 1);
            addFloat(p.x, p.y, '❤️+1', '#f472b6', 14);
            break;
        case 'magnet':
            player.magnetized = true;
            player.magnetTimer = 6000;
            addFloat(p.x, p.y, '🧲 磁铁', '#a78bfa', 14);
            break;
        case 'barrel':
            if (player.extraBarrels < 3) {
                player.extraBarrels++;
                addFloat(p.x, p.y, `🚀 弹道+1 (${player.extraBarrels}/3)`, '#fb923c', 14);
            } else {
                // 已满，转为加分
                score += 50;
                $('#score').textContent = score;
                addFloat(p.x, p.y, '🚀 已满! +50', '#fb923c', 14);
            }
            break;
        case 'homing':
            fireHomingMissiles();
            addFloat(p.x, p.y, '🎯 追踪导弹!', '#f43f5e', 14);
            break;
        case 'laser':
            player.laserActive = true;
            player.laserTimer = 5000;
            addFloat(p.x, p.y, '🔥 激光炮!', '#22d3ee', 14);
            break;
        case 'wingman':
            if (player.wingmen < 2) {
                player.wingmen++;
                addFloat(p.x, p.y, `✈️ 僚机+1 (${player.wingmen}/2)`, '#60a5fa', 14);
            } else {
                score += 50;
                $('#score').textContent = score;
                addFloat(p.x, p.y, '✈️ 已满! +50', '#60a5fa', 14);
            }
            break;
        case 'freeze':
            player.frozen = true;
            player.frozenTimer = 5000;
            addFloat(p.x, p.y, '❄️ 全场冰冻!', '#67e8f9', 16);
            // 冰冻视觉效果
            for (let i = 0; i < 20; i++) {
                particles.push({
                    x: Math.random() * W, y: Math.random() * H,
                    vx: (Math.random()-0.5)*2, vy: -Math.random()*2,
                    life: 1, decay: 0.01, size: 3, color: '#67e8f9',
                });
            }
            break;
    }
    updateHUD();
    spawnHitParticles(p.x, p.y, p.color);
}

function useBomb() {
    if (player.bombs <= 0) return;
    player.bombs--;
    const bType = player.bombTypes[player.currentBomb];
    // 切换到下一种炸弹
    player.currentBomb = (player.currentBomb + 1) % player.bombTypes.length;
    updateHUD();
    enemyBullets = [];

    const bombNames = { fire: '🔥 火焰弹', ice: '🌊 冰霜弹', thunder: '⚡ 雷电弹', nuke: '☢️ 核弹' };
    addFloat(W/2, H/2 - 60, bombNames[bType], '#fbbf24', 22);

    if (bType === 'fire') useBombFire();
    else if (bType === 'ice') useBombIce();
    else if (bType === 'thunder') useBombThunder();
    else if (bType === 'nuke') useBombNuke();
}

// 🔥 火焰弹：蘑菇云 + 灼烧
function useBombFire() {
    bombEffect = { type: 'fire', timer: 600, maxTimer: 600, x: W/2, y: H/2 };
    shockwave = { x: W/2, y: H/2, r: 0, maxR: 350, speed: 8, color: '#f97316' };
    // 大量火焰粒子
    for (let i = 0; i < 60; i++) {
        const angle = Math.random() * Math.PI * 2;
        const spd = 1 + Math.random() * 5;
        particles.push({
            x: W/2, y: H/2, vx: Math.cos(angle)*spd, vy: Math.sin(angle)*spd - 2,
            life: 1, decay: 0.008 + Math.random()*0.01,
            size: 4 + Math.random()*6,
            color: ['#f97316','#ef4444','#fbbf24','#fde68a'][Math.floor(Math.random()*4)],
        });
    }
    // 标记敌机延迟爆炸
    enemies.forEach(e => {
        const dist = Math.sqrt((e.x - W/2)**2 + (e.y - H/2)**2);
        e.bombHitDelay = dist / 8; // 距离越远延迟越久
        e.bombDmg = 25;
        e.bombType = 'fire';
    });
}

// 🌊 冰霜弹：冰冻冲击波
function useBombIce() {
    bombEffect = { type: 'ice', timer: 600, maxTimer: 600, x: W/2, y: H/2 };
    shockwave = { x: W/2, y: H/2, r: 0, maxR: 400, speed: 6, color: '#38bdf8' };
    // 冰晶粒子
    for (let i = 0; i < 50; i++) {
        const angle = Math.random() * Math.PI * 2;
        const spd = 2 + Math.random() * 4;
        particles.push({
            x: W/2, y: H/2, vx: Math.cos(angle)*spd, vy: Math.sin(angle)*spd,
            life: 1, decay: 0.006 + Math.random()*0.008,
            size: 3 + Math.random()*5,
            color: ['#38bdf8','#67e8f9','#bae6fd','#ffffff'][Math.floor(Math.random()*4)],
        });
    }
    player.frozen = true;
    player.frozenTimer = 6000;
    enemies.forEach(e => {
        const dist = Math.sqrt((e.x - W/2)**2 + (e.y - H/2)**2);
        e.bombHitDelay = dist / 6;
        e.bombDmg = 15;
        e.bombType = 'ice';
    });
}

// ⚡ 雷电弹：闪电链
function useBombThunder() {
    bombEffect = { type: 'thunder', timer: 600, maxTimer: 600, x: W/2, y: H/2, chains: [] };
    // 生成闪电链路径
    const sorted = [...enemies].sort((a, b) => {
        const da = Math.sqrt((a.x - player.x)**2 + (a.y - player.y)**2);
        const db = Math.sqrt((b.x - player.x)**2 + (b.y - player.y)**2);
        return da - db;
    });
    let prev = { x: player.x, y: player.y };
    sorted.forEach((e, i) => {
        bombEffect.chains.push({ from: { ...prev }, to: { x: e.x, y: e.y }, delay: i * 80, hit: false });
        prev = { x: e.x, y: e.y };
        e.bombHitDelay = i * 80;
        e.bombDmg = 20;
        e.bombType = 'thunder';
    });
    // 电弧粒子
    for (let i = 0; i < 30; i++) {
        particles.push({
            x: player.x, y: player.y,
            vx: (Math.random()-0.5)*6, vy: (Math.random()-0.5)*6,
            life: 1, decay: 0.02, size: 2 + Math.random()*2,
            color: ['#fbbf24','#38bdf8','#ffffff'][Math.floor(Math.random()*3)],
        });
    }
}

// ☢️ 核弹：超大爆炸 + 冲击波推开
function useBombNuke() {
    bombEffect = { type: 'nuke', timer: 800, maxTimer: 800, x: W/2, y: H * 0.4, phase: 0 };
    shockwave = { x: W/2, y: H * 0.4, r: 0, maxR: 500, speed: 4, color: '#a78bfa' };
    // 蘑菇云粒子
    for (let i = 0; i < 80; i++) {
        const angle = Math.random() * Math.PI * 2;
        const spd = 0.5 + Math.random() * 3;
        particles.push({
            x: W/2, y: H * 0.4,
            vx: Math.cos(angle)*spd, vy: Math.sin(angle)*spd - Math.random()*3,
            life: 1, decay: 0.004 + Math.random()*0.006,
            size: 5 + Math.random()*8,
            color: ['#c084fc','#a78bfa','#f87171','#fbbf24','#ffffff'][Math.floor(Math.random()*5)],
        });
    }
    enemies.forEach(e => {
        const dist = Math.sqrt((e.x - W/2)**2 + (e.y - H*0.4)**2);
        e.bombHitDelay = dist / 4;
        e.bombDmg = 35;
        e.bombType = 'nuke';
        // 推开效果
        const angle = Math.atan2(e.y - H*0.4, e.x - W/2);
        e.pushVx = Math.cos(angle) * 3;
        e.pushVy = Math.sin(angle) * 3;
        e.pushTimer = 300;
    });
}

function gameOver() {
    state = 'gameover';
    if (score > best) {
        best = score;
        localStorage.setItem('thunder-best', best);
        $('#best').textContent = best;
    }
    $('#finalScore').textContent = score;
    $('#finalMsg').textContent = score >= best && score > 0 ? `🎉 新纪录! 存活 ${wave} 波` : `存活 ${wave} 波`;
    setState('gameover');
}

// ===== 渲染 =====
function render() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#080818';
    ctx.fillRect(0, 0, W, H);

    // 星星背景
    stars.forEach(s => {
        ctx.globalAlpha = s.alpha;
        ctx.fillStyle = s.color;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.size, 0, Math.PI*2); ctx.fill();
    });
    ctx.globalAlpha = 1;

    if (state === 'start') return;

    // 金币（加大 + 金色光晕 + $符号）
    coins.forEach(c => {
        const pulse = 1 + Math.sin(performance.now()/200 + c.x)*0.15;
        const r = 8 * pulse;
        // 光晕
        const cg = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, r * 2.5);
        cg.addColorStop(0, 'rgba(251,191,36,0.25)');
        cg.addColorStop(1, 'transparent');
        ctx.fillStyle = cg;
        ctx.beginPath(); ctx.arc(c.x, c.y, r * 2.5, 0, Math.PI*2); ctx.fill();
        // 金币外圈
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, Math.PI*2); ctx.fill();
        // 金币内圈
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath(); ctx.arc(c.x, c.y, r * 0.7, 0, Math.PI*2); ctx.fill();
        // 高光
        ctx.fillStyle = '#fde68a';
        ctx.beginPath(); ctx.arc(c.x - 2, c.y - 2, r * 0.3, 0, Math.PI*2); ctx.fill();
        // $ 符号
        ctx.fillStyle = '#92400e';
        ctx.font = `bold ${Math.round(r)}px sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('$', c.x, c.y + 1);
    });

    // 道具
    powerups.forEach(p => {
        const pulse = 1 + Math.sin(performance.now()/250)*0.1;
        // 光晕
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 18);
        g.addColorStop(0, p.color + '40'); g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.fillRect(p.x-18, p.y-18, 36, 36);
        // 图标
        ctx.font = `${16*pulse}px sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(p.icon, p.x, p.y);
    });

    // 敌机子弹（加大 + 红色光晕）
    enemyBullets.forEach(b => {
        // 外层光晕
        const bg = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r * 3);
        bg.addColorStop(0, 'rgba(239,68,68,0.3)');
        bg.addColorStop(1, 'transparent');
        ctx.fillStyle = bg;
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r * 3, 0, Math.PI*2); ctx.fill();
        // 外圈
        ctx.fillStyle = '#ef4444';
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r + 2, 0, Math.PI*2); ctx.fill();
        // 内核亮色
        ctx.fillStyle = '#fca5a5';
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r * 0.6, 0, Math.PI*2); ctx.fill();
    });

    // 敌机
    enemies.forEach(e => {
        drawEnemy(e);
    });

    // 玩家子弹
    bullets.forEach(b => {
        if (b.type === 'laser') {
            // 激光柱
            const grad = ctx.createLinearGradient(b.x, 0, b.x, player.y);
            grad.addColorStop(0, 'rgba(34,211,238,0.1)');
            grad.addColorStop(0.5, 'rgba(34,211,238,0.4)');
            grad.addColorStop(1, 'rgba(34,211,238,0.6)');
            ctx.fillStyle = grad;
            ctx.fillRect(b.x - b.w/2, 0, b.w, player.y - player.h/2);
            // 激光核心
            ctx.fillStyle = `rgba(255,255,255,${0.5 + Math.sin(performance.now()/50)*0.3})`;
            ctx.fillRect(b.x - 1.5, 0, 3, player.y - player.h/2);
            return;
        }
        if (b.type === 'homing') {
            // 追踪导弹
            ctx.fillStyle = '#f43f5e';
            ctx.shadowColor = '#f43f5e'; ctx.shadowBlur = 10;
            ctx.beginPath();
            const angle = Math.atan2(b.vy, b.vx);
            ctx.save();
            ctx.translate(b.x, b.y);
            ctx.rotate(angle + Math.PI/2);
            ctx.moveTo(0, -7);
            ctx.lineTo(4, 5);
            ctx.lineTo(-4, 5);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
            ctx.shadowBlur = 0;
            return;
        }
        if (b.type === 'extra') {
            ctx.fillStyle = '#fb923c';
            ctx.shadowColor = '#fb923c'; ctx.shadowBlur = 6;
        } else if (b.type === 'wingman') {
            ctx.fillStyle = '#60a5fa';
            ctx.shadowColor = '#60a5fa'; ctx.shadowBlur = 6;
        } else if (b.type === 'power') {
            ctx.fillStyle = '#fbbf24';
            ctx.shadowColor = '#fbbf24'; ctx.shadowBlur = 8;
        } else {
            ctx.fillStyle = '#38bdf8';
            ctx.shadowColor = '#38bdf8'; ctx.shadowBlur = 6;
        }
        ctx.fillRect(b.x - b.w/2, b.y - b.h/2, b.w, b.h);
        ctx.shadowBlur = 0;
    });

    // 玩家
    if (player) drawPlayer();

    // 爆炸
    explosions.forEach(ex => {
        const alpha = ex.timer / ex.maxTimer;
        ctx.globalAlpha = alpha * 0.6;
        const g = ctx.createRadialGradient(ex.x, ex.y, 0, ex.x, ex.y, ex.r);
        g.addColorStop(0, '#fbbf24');
        g.addColorStop(0.4, '#f87171');
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(ex.x, ex.y, ex.r, 0, Math.PI*2); ctx.fill();
        ctx.globalAlpha = 1;
    });

    // 粒子
    particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI*2); ctx.fill();
    });
    ctx.globalAlpha = 1;

    // 冲击波
    if (shockwave) {
        const alpha = 1 - shockwave.r / shockwave.maxR;
        ctx.strokeStyle = shockwave.color;
        ctx.lineWidth = 3 + alpha * 4;
        ctx.globalAlpha = alpha * 0.6;
        ctx.beginPath(); ctx.arc(shockwave.x, shockwave.y, shockwave.r, 0, Math.PI*2); ctx.stroke();
        ctx.lineWidth = 1;
        ctx.globalAlpha = alpha * 0.3;
        ctx.beginPath(); ctx.arc(shockwave.x, shockwave.y, shockwave.r * 0.7, 0, Math.PI*2); ctx.stroke();
        ctx.globalAlpha = 1;
    }

    // 炸弹特效
    if (bombEffect) {
        const progress = 1 - bombEffect.timer / bombEffect.maxTimer;
        const alpha = bombEffect.timer / bombEffect.maxTimer;
        if (bombEffect.type === 'fire') {
            const stemH = 80 * Math.min(progress * 2, 1);
            const capR = 40 * Math.min(progress * 1.5, 1);
            ctx.globalAlpha = alpha * 0.7;
            const grad = ctx.createLinearGradient(bombEffect.x, bombEffect.y, bombEffect.x, bombEffect.y - stemH);
            grad.addColorStop(0, '#f97316'); grad.addColorStop(1, '#fbbf24');
            ctx.fillStyle = grad;
            ctx.fillRect(bombEffect.x - 12, bombEffect.y - stemH, 24, stemH);
            const capGrad = ctx.createRadialGradient(bombEffect.x, bombEffect.y - stemH, 0, bombEffect.x, bombEffect.y - stemH, capR);
            capGrad.addColorStop(0, '#fbbf24'); capGrad.addColorStop(0.5, '#f97316'); capGrad.addColorStop(1, 'rgba(239,68,68,0)');
            ctx.fillStyle = capGrad;
            ctx.beginPath(); ctx.arc(bombEffect.x, bombEffect.y - stemH, capR, 0, Math.PI*2); ctx.fill();
            ctx.globalAlpha = 1;
        } else if (bombEffect.type === 'ice') {
            const r = 200 * Math.min(progress * 2, 1);
            ctx.globalAlpha = alpha * 0.15;
            ctx.fillStyle = '#bae6fd';
            ctx.fillRect(0, 0, W, H);
            ctx.globalAlpha = alpha * 0.4;
            const iceGrad = ctx.createRadialGradient(bombEffect.x, bombEffect.y, 0, bombEffect.x, bombEffect.y, r);
            iceGrad.addColorStop(0, '#67e8f9'); iceGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = iceGrad;
            ctx.beginPath(); ctx.arc(bombEffect.x, bombEffect.y, r, 0, Math.PI*2); ctx.fill();
            ctx.globalAlpha = 1;
        } else if (bombEffect.type === 'thunder') {
            const elapsed = bombEffect.maxTimer - bombEffect.timer;
            bombEffect.chains.forEach(chain => {
                if (elapsed < chain.delay) return;
                const a = Math.max(0, 1 - (elapsed - chain.delay) / 400);
                ctx.strokeStyle = `rgba(251,191,36,${a})`;
                ctx.lineWidth = 2 + a * 2;
                ctx.shadowColor = '#fbbf24'; ctx.shadowBlur = 10 * a;
                ctx.beginPath(); ctx.moveTo(chain.from.x, chain.from.y);
                const dx = chain.to.x - chain.from.x, dy = chain.to.y - chain.from.y;
                for (let s = 1; s <= 6; s++) {
                    const t = s / 6;
                    const jx = s < 6 ? (Math.random()-0.5)*20 : 0;
                    const jy = s < 6 ? (Math.random()-0.5)*20 : 0;
                    ctx.lineTo(chain.from.x + dx*t + jx, chain.from.y + dy*t + jy);
                }
                ctx.stroke(); ctx.shadowBlur = 0;
            });
        } else if (bombEffect.type === 'nuke') {
            if (progress < 0.15) {
                ctx.globalAlpha = (0.15 - progress) / 0.15 * 0.8;
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, W, H);
                ctx.globalAlpha = 1;
            }
            const stemH = 120 * Math.min(progress * 2, 1);
            const capR = 70 * Math.min(progress * 1.5, 1);
            ctx.globalAlpha = alpha * 0.6;
            const nGrad = ctx.createLinearGradient(bombEffect.x, bombEffect.y, bombEffect.x, bombEffect.y - stemH);
            nGrad.addColorStop(0, '#a78bfa'); nGrad.addColorStop(0.5, '#c084fc'); nGrad.addColorStop(1, '#f87171');
            ctx.fillStyle = nGrad;
            ctx.fillRect(bombEffect.x - 16, bombEffect.y - stemH, 32, stemH);
            const nCapGrad = ctx.createRadialGradient(bombEffect.x, bombEffect.y - stemH, 0, bombEffect.x, bombEffect.y - stemH, capR);
            nCapGrad.addColorStop(0, '#fbbf24'); nCapGrad.addColorStop(0.3, '#f87171'); nCapGrad.addColorStop(0.6, '#c084fc'); nCapGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = nCapGrad;
            ctx.beginPath(); ctx.arc(bombEffect.x, bombEffect.y - stemH, capR, 0, Math.PI*2); ctx.fill();
            ctx.strokeStyle = `rgba(251,191,36,${alpha * 0.5})`;
            ctx.lineWidth = 3;
            ctx.beginPath(); ctx.ellipse(bombEffect.x, bombEffect.y + 5, capR * 0.8 * Math.min(progress*3,1), 10, 0, 0, Math.PI*2); ctx.stroke();
            ctx.globalAlpha = 1;
        }
    }

    // 飘字效果
    floats.forEach(f => {
        ctx.globalAlpha = f.alpha;
        ctx.fillStyle = f.color;
        ctx.font = `bold ${f.size}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(f.text, f.x, f.y);
    });
    ctx.globalAlpha = 1;
}

// ===== 绘制玩家 =====
function drawPlayer() {
    const px = player.x, py = player.y;
    const blink = player.invincible ? Math.sin(performance.now()/60) > 0 : true;
    if (!blink) return;

    // 引擎火焰
    const flicker = Math.random() * 4;
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(px - 6, py + player.h/2);
    ctx.lineTo(px, py + player.h/2 + 12 + flicker);
    ctx.lineTo(px + 6, py + player.h/2);
    ctx.fill();
    ctx.fillStyle = '#bae6fd';
    ctx.beginPath();
    ctx.moveTo(px - 3, py + player.h/2);
    ctx.lineTo(px, py + player.h/2 + 7 + flicker/2);
    ctx.lineTo(px + 3, py + player.h/2);
    ctx.fill();

    // 机身
    ctx.fillStyle = '#c7d2fe';
    ctx.beginPath();
    ctx.moveTo(px, py - player.h/2);          // 机头
    ctx.lineTo(px + 6, py - 4);
    ctx.lineTo(px + player.w/2, py + 8);      // 右翼
    ctx.lineTo(px + player.w/2 - 2, py + player.h/2);
    ctx.lineTo(px + 4, py + player.h/2 - 4);
    ctx.lineTo(px, py + player.h/2 - 2);
    ctx.lineTo(px - 4, py + player.h/2 - 4);
    ctx.lineTo(px - player.w/2 + 2, py + player.h/2);
    ctx.lineTo(px - player.w/2, py + 8);      // 左翼
    ctx.lineTo(px - 6, py - 4);
    ctx.closePath();
    ctx.fill();

    // 座舱
    ctx.fillStyle = '#6366f1';
    ctx.beginPath();
    ctx.ellipse(px, py - 4, 4, 7, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#818cf8';
    ctx.beginPath();
    ctx.ellipse(px, py - 6, 2, 4, 0, 0, Math.PI*2);
    ctx.fill();

    // 护盾光环
    if (player.shielded) {
        ctx.strokeStyle = `rgba(56,189,248,${0.3 + Math.sin(performance.now()/200)*0.2})`;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(px, py, player.w/2 + 8, 0, Math.PI*2); ctx.stroke();
    }

    // 磁铁范围
    if (player.magnetized) {
        ctx.strokeStyle = `rgba(167,139,250,${0.15 + Math.sin(performance.now()/300)*0.1})`;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.arc(px, py, 80, 0, Math.PI*2); ctx.stroke();
        ctx.setLineDash([]);
    }

    // 武器等级指示
    if (player.weaponLevel > 1) {
        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`Lv${player.weaponLevel}`, px, py + player.h/2 + 22);
    }

    // 僚机
    for (let i = 0; i < player.wingmen; i++) {
        const side = i === 0 ? -1 : 1;
        const wx = px + side * 28;
        const wy = py + 20;
        const bob = Math.sin(performance.now()/400 + i) * 2;
        // 小飞机
        ctx.fillStyle = '#93c5fd';
        ctx.beginPath();
        ctx.moveTo(wx, wy - 8 + bob);
        ctx.lineTo(wx + 6, wy + 4 + bob);
        ctx.lineTo(wx - 6, wy + 4 + bob);
        ctx.closePath();
        ctx.fill();
        // 小引擎
        ctx.fillStyle = '#60a5fa';
        ctx.beginPath();
        ctx.moveTo(wx - 2, wy + 4 + bob);
        ctx.lineTo(wx, wy + 8 + bob + Math.random()*2);
        ctx.lineTo(wx + 2, wy + 4 + bob);
        ctx.fill();
    }
}

// ===== 绘制敌机 =====
function drawEnemy(e) {
    const ex = e.x, ey = e.y;
    if (player && player.frozen) ctx.globalAlpha = 0.7;

    if (e.type === 'boss') {
        drawBossShip(ex, ey, e);
    } else if (e.type === 'elite') {
        drawEliteShip(ex, ey, e);
    } else if (e.type === 'medium') {
        drawMediumShip(ex, ey, e);
    } else if (e.type === 'fast') {
        drawFastShip(ex, ey, e);
    } else {
        drawSmallShip(ex, ey, e);
    }

    // 血条（多血量敌机）
    if (e.maxHp > 1 && e.type !== 'boss') {
        const hpPct = e.hp / e.maxHp;
        const barW = e.w + 4;
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(ex - barW/2, ey - e.h/2 - 7, barW, 4);
        ctx.fillStyle = hpPct > 0.5 ? '#4ade80' : (hpPct > 0.25 ? '#facc15' : '#ef4444');
        ctx.fillRect(ex - barW/2, ey - e.h/2 - 7, barW * hpPct, 4);
    }
    ctx.globalAlpha = 1;
}

// --- 小型敌机：轻型战斗机 ---
function drawSmallShip(x, y, e) {
    // 引擎火焰
    ctx.fillStyle = '#f87171';
    ctx.beginPath();
    ctx.moveTo(x - 3, y - e.h/2);
    ctx.lineTo(x, y - e.h/2 - 6 - Math.random()*3);
    ctx.lineTo(x + 3, y - e.h/2);
    ctx.fill();
    // 机身（朝下飞）
    ctx.fillStyle = '#4ade80';
    ctx.beginPath();
    ctx.moveTo(x, y + e.h/2);              // 机头（朝下）
    ctx.lineTo(x + 5, y + 2);
    ctx.lineTo(x + e.w/2, y - 4);          // 右翼尖
    ctx.lineTo(x + 6, y - 2);
    ctx.lineTo(x + 4, y - e.h/2);          // 右尾
    ctx.lineTo(x - 4, y - e.h/2);          // 左尾
    ctx.lineTo(x - 6, y - 2);
    ctx.lineTo(x - e.w/2, y - 4);          // 左翼尖
    ctx.lineTo(x - 5, y + 2);
    ctx.closePath();
    ctx.fill();
    // 座舱
    ctx.fillStyle = '#166534';
    ctx.beginPath();
    ctx.ellipse(x, y + 2, 3, 5, 0, 0, Math.PI*2);
    ctx.fill();
}

// --- 高速敌机：小型尖头 ---
function drawFastShip(x, y, e) {
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(x - 2, y - e.h/2);
    ctx.lineTo(x, y - e.h/2 - 8 - Math.random()*4);
    ctx.lineTo(x + 2, y - e.h/2);
    ctx.fill();
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(x, y + e.h/2);              // 尖头
    ctx.lineTo(x + 4, y + 2);
    ctx.lineTo(x + e.w/2, y - e.h/4);      // 右翼
    ctx.lineTo(x + 3, y - e.h/2);
    ctx.lineTo(x - 3, y - e.h/2);
    ctx.lineTo(x - e.w/2, y - e.h/4);      // 左翼
    ctx.lineTo(x - 4, y + 2);
    ctx.closePath();
    ctx.fill();
    // 中线
    ctx.strokeStyle = '#0c4a6e';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x, y + e.h/2 - 2); ctx.lineTo(x, y - e.h/2 + 2); ctx.stroke();
}

// --- 中型敌机：双引擎轰炸机 ---
function drawMediumShip(x, y, e) {
    const hw = e.w/2, hh = e.h/2;
    // 双引擎火焰
    ctx.fillStyle = '#f97316';
    [-8, 8].forEach(ox => {
        ctx.beginPath();
        ctx.moveTo(x + ox - 3, y - hh);
        ctx.lineTo(x + ox, y - hh - 7 - Math.random()*3);
        ctx.lineTo(x + ox + 3, y - hh);
        ctx.fill();
    });
    // 主机身
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.moveTo(x, y + hh);                 // 机头
    ctx.lineTo(x + 7, y + 4);
    ctx.lineTo(x + hw, y - 2);             // 右翼
    ctx.lineTo(x + hw - 2, y - hh + 4);
    ctx.lineTo(x + hw - 6, y - hh);        // 右尾翼
    ctx.lineTo(x + 4, y - hh + 2);
    ctx.lineTo(x, y - hh + 6);
    ctx.lineTo(x - 4, y - hh + 2);
    ctx.lineTo(x - hw + 6, y - hh);        // 左尾翼
    ctx.lineTo(x - hw + 2, y - hh + 4);
    ctx.lineTo(x - hw, y - 2);             // 左翼
    ctx.lineTo(x - 7, y + 4);
    ctx.closePath();
    ctx.fill();
    // 机身中央深色
    ctx.fillStyle = '#92400e';
    ctx.beginPath();
    ctx.ellipse(x, y, 4, 8, 0, 0, Math.PI*2);
    ctx.fill();
    // 座舱
    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.ellipse(x, y + 4, 3, 4, 0, 0, Math.PI*2);
    ctx.fill();
}

// --- 精英敌机：重型战机 ---
function drawEliteShip(x, y, e) {
    const hw = e.w/2, hh = e.h/2;
    // 三引擎火焰
    ctx.fillStyle = '#fbbf24';
    [-10, 0, 10].forEach(ox => {
        ctx.beginPath();
        ctx.moveTo(x + ox - 2, y - hh);
        ctx.lineTo(x + ox, y - hh - 8 - Math.random()*4);
        ctx.lineTo(x + ox + 2, y - hh);
        ctx.fill();
    });
    // 装甲机身
    ctx.fillStyle = '#f87171';
    ctx.beginPath();
    ctx.moveTo(x, y + hh);                 // 机头
    ctx.lineTo(x + 8, y + 6);
    ctx.lineTo(x + hw, y);                 // 右翼
    ctx.lineTo(x + hw + 4, y - 6);         // 右翼尖（外扩）
    ctx.lineTo(x + hw - 2, y - 8);
    ctx.lineTo(x + 6, y - hh + 6);
    ctx.lineTo(x + 8, y - hh);             // 右尾翼
    ctx.lineTo(x + 3, y - hh + 4);
    ctx.lineTo(x, y - hh + 8);
    ctx.lineTo(x - 3, y - hh + 4);
    ctx.lineTo(x - 8, y - hh);             // 左尾翼
    ctx.lineTo(x - 6, y - hh + 6);
    ctx.lineTo(x - hw + 2, y - 8);
    ctx.lineTo(x - hw - 4, y - 6);         // 左翼尖
    ctx.lineTo(x - hw, y);
    ctx.lineTo(x - 8, y + 6);
    ctx.closePath();
    ctx.fill();
    // 装甲板
    ctx.fillStyle = '#991b1b';
    ctx.beginPath();
    ctx.moveTo(x - 5, y - 4);
    ctx.lineTo(x + 5, y - 4);
    ctx.lineTo(x + 3, y + 8);
    ctx.lineTo(x - 3, y + 8);
    ctx.closePath();
    ctx.fill();
    // 座舱（红色发光）
    ctx.fillStyle = '#fca5a5';
    ctx.beginPath();
    ctx.ellipse(x, y + 2, 3, 4, 0, 0, Math.PI*2);
    ctx.fill();
}

// --- Boss：巨型旗舰 ---
function drawBossShip(x, y, e) {
    const hw = e.w/2, hh = e.h/2;
    const pulse = Math.sin(performance.now()/300) * 0.1;

    // 引擎火焰（4个）
    ctx.fillStyle = '#c084fc';
    [-20, -8, 8, 20].forEach(ox => {
        const fl = 10 + Math.random() * 6;
        ctx.beginPath();
        ctx.moveTo(x + ox - 4, y - hh);
        ctx.lineTo(x + ox, y - hh - fl);
        ctx.lineTo(x + ox + 4, y - hh);
        ctx.fill();
    });
    // 内焰
    ctx.fillStyle = '#e9d5ff';
    [-20, -8, 8, 20].forEach(ox => {
        const fl = 5 + Math.random() * 4;
        ctx.beginPath();
        ctx.moveTo(x + ox - 2, y - hh);
        ctx.lineTo(x + ox, y - hh - fl);
        ctx.lineTo(x + ox + 2, y - hh);
        ctx.fill();
    });

    // 主舰体
    ctx.fillStyle = '#7c3aed';
    ctx.beginPath();
    ctx.moveTo(x, y + hh);                     // 舰首
    ctx.lineTo(x + 12, y + hh - 10);
    ctx.lineTo(x + hw - 8, y + 6);             // 右前翼根
    ctx.lineTo(x + hw + 8, y - 4);             // 右翼尖
    ctx.lineTo(x + hw, y - 10);
    ctx.lineTo(x + hw - 4, y - hh + 8);
    ctx.lineTo(x + hw + 2, y - hh);            // 右尾翼
    ctx.lineTo(x + hw - 8, y - hh + 4);
    ctx.lineTo(x + 10, y - hh + 2);
    ctx.lineTo(x, y - hh + 10);
    ctx.lineTo(x - 10, y - hh + 2);
    ctx.lineTo(x - hw + 8, y - hh + 4);
    ctx.lineTo(x - hw - 2, y - hh);            // 左尾翼
    ctx.lineTo(x - hw + 4, y - hh + 8);
    ctx.lineTo(x - hw, y - 10);
    ctx.lineTo(x - hw - 8, y - 4);             // 左翼尖
    ctx.lineTo(x - hw + 8, y + 6);
    ctx.lineTo(x - 12, y + hh - 10);
    ctx.closePath();
    ctx.fill();

    // 舰体装甲纹理
    ctx.fillStyle = '#5b21b6';
    ctx.beginPath();
    ctx.moveTo(x - 8, y - 10);
    ctx.lineTo(x + 8, y - 10);
    ctx.lineTo(x + 12, y + 10);
    ctx.lineTo(x - 12, y + 10);
    ctx.closePath();
    ctx.fill();

    // 中央核心（发光）
    const coreGlow = ctx.createRadialGradient(x, y + 4, 0, x, y + 4, 14);
    coreGlow.addColorStop(0, `rgba(239,68,68,${0.8 + pulse})`);
    coreGlow.addColorStop(0.5, 'rgba(239,68,68,0.3)');
    coreGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = coreGlow;
    ctx.beginPath(); ctx.arc(x, y + 4, 14, 0, Math.PI*2); ctx.fill();

    // 核心
    ctx.fillStyle = '#ef4444';
    ctx.beginPath(); ctx.arc(x, y + 4, 6, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#fca5a5';
    ctx.beginPath(); ctx.arc(x, y + 3, 3, 0, Math.PI*2); ctx.fill();

    // 双眼（威慑感）
    const eyeGlow = ctx.createRadialGradient(x - 16, y - 2, 0, x - 16, y - 2, 8);
    eyeGlow.addColorStop(0, 'rgba(239,68,68,0.6)');
    eyeGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = eyeGlow;
    ctx.beginPath(); ctx.arc(x - 16, y - 2, 8, 0, Math.PI*2); ctx.fill();
    const eyeGlow2 = ctx.createRadialGradient(x + 16, y - 2, 0, x + 16, y - 2, 8);
    eyeGlow2.addColorStop(0, 'rgba(239,68,68,0.6)');
    eyeGlow2.addColorStop(1, 'transparent');
    ctx.fillStyle = eyeGlow2;
    ctx.beginPath(); ctx.arc(x + 16, y - 2, 8, 0, Math.PI*2); ctx.fill();

    ctx.fillStyle = '#ef4444';
    ctx.beginPath(); ctx.arc(x - 16, y - 2, 4, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 16, y - 2, 4, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#fef2f2';
    ctx.beginPath(); ctx.arc(x - 16, y - 3, 1.5, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 16, y - 3, 1.5, 0, Math.PI*2); ctx.fill();

    // 武器挂载点
    ctx.fillStyle = '#a78bfa';
    [-hw + 4, hw - 4].forEach(ox => {
        ctx.fillRect(x + ox - 2, y - 4, 4, 10);
    });

    // 血条
    const hpPct = e.hp / e.maxHp;
    const barW = e.w + 30;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(x - barW/2, y - hh - 14, barW, 6);
    ctx.fillStyle = hpPct > 0.5 ? '#4ade80' : (hpPct > 0.25 ? '#facc15' : '#ef4444');
    ctx.fillRect(x - barW/2, y - hh - 14, barW * hpPct, 6);
    // 血条边框
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x - barW/2, y - hh - 14, barW, 6);
}

// ===== 特效 =====
function addExplosion(x, y, size) {
    explosions.push({ x, y, r: size * 0.3, maxTimer: 400, timer: 400 });
    for (let i = 0; i < 15; i++) {
        const angle = Math.random() * Math.PI * 2;
        const spd = 1 + Math.random() * 3;
        particles.push({
            x, y, vx: Math.cos(angle)*spd, vy: Math.sin(angle)*spd,
            life: 1, decay: 0.02 + Math.random()*0.02,
            size: 2 + Math.random()*3,
            color: ['#fbbf24','#f87171','#fb923c'][Math.floor(Math.random()*3)],
        });
    }
}

function spawnHitParticles(x, y, color) {
    for (let i = 0; i < 6; i++) {
        const angle = Math.random() * Math.PI * 2;
        particles.push({
            x, y, vx: Math.cos(angle)*2, vy: Math.sin(angle)*2,
            life: 1, decay: 0.03, size: 2, color,
        });
    }
}

function addFloat(x, y, text, color, size) {
    floats.push({ x, y, text, color, size: size || 14, alpha: 1 });
}

function initStars() {
    for (let i = 0; i < 80; i++) {
        stars.push({
            x: Math.random() * W,
            y: Math.random() * H,
            size: Math.random() * 1.5 + 0.3,
            speed: Math.random() * 1.5 + 0.3,
            alpha: Math.random() * 0.6 + 0.2,
            color: ['#e0e7ff','#bfdbfe','#c4b5fd','#fef3c7'][Math.floor(Math.random()*4)],
        });
    }
}

// ===== 输入控制 =====
let mouseDown = false;
let mouseX = 0, mouseY = 0;

canvas.addEventListener('mousedown', e => { mouseDown = true; updateMouse(e); });
canvas.addEventListener('mousemove', e => { if (mouseDown || state === 'playing') updateMouse(e); });
canvas.addEventListener('mouseup', () => mouseDown = false);
canvas.addEventListener('mouseleave', () => mouseDown = false);

function updateMouse(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = W / rect.width;
    const scaleY = H / rect.height;
    mouseX = (e.clientX - rect.left) * scaleX;
    mouseY = (e.clientY - rect.top) * scaleY;
    if (state === 'playing' && player) {
        player.x = Math.max(player.w/2, Math.min(W - player.w/2, mouseX));
        player.y = Math.max(player.h/2, Math.min(H - player.h/2, mouseY));
    }
}

// 触屏
canvas.addEventListener('touchstart', e => { e.preventDefault(); updateTouch(e); }, { passive: false });
canvas.addEventListener('touchmove', e => { e.preventDefault(); updateTouch(e); }, { passive: false });

function updateTouch(e) {
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const scaleX = W / rect.width;
    const scaleY = H / rect.height;
    const tx = (touch.clientX - rect.left) * scaleX;
    const ty = (touch.clientY - rect.top) * scaleY;
    if (state === 'playing' && player) {
        player.x = Math.max(player.w/2, Math.min(W - player.w/2, tx));
        player.y = Math.max(player.h/2, Math.min(H - player.h/2, ty - 40)); // 手指偏移
    }
}

// 键盘
document.addEventListener('keydown', e => {
    if (e.key === ' ') { e.preventDefault(); if (state === 'playing') useBomb(); }
    if (e.key === 'q' || e.key === 'Q') {
        if (state === 'playing' && player) {
            player.currentBomb = (player.currentBomb + 1) % player.bombTypes.length;
            const bombIcons = { fire: '🔥 火焰弹', ice: '🌊 冰霜弹', thunder: '⚡ 雷电弹', nuke: '☢️ 核弹' };
            addFloat(player.x, player.y - 40, bombIcons[player.bombTypes[player.currentBomb]], '#fbbf24', 13);
            updateHUD();
        }
    }
    if (e.key === 'p' || e.key === 'P') {
        if (state === 'playing') setState('paused');
        else if (state === 'paused') setState('playing');
    }
    if (e.key === 'Enter') {
        if (state === 'start') startGame();
        else if (state === 'gameover') startGame();
    }
});

// 暂停点击
$('#pauseOv').addEventListener('click', () => setState('playing'));

// 初始渲染
render();
