const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const characters = {
    kall: {
        name: 'Kall',
        draw: function(ctx, x, y, width, height, facingRight, state, frame) {
            ctx.save();
            ctx.translate(x + width / 2, y + height / 2);
            if (!facingRight) ctx.scale(-1, 1);
            
            ctx.fillStyle = '#e63946';
            ctx.fillRect(-width/2 + 4, -height/2 + 20, width - 8, height - 24);
            
            ctx.fillStyle = '#ffcc99';
            ctx.fillRect(-width/2 + 12, -height/2 + 4, 16, 18);
            
            ctx.fillStyle = '#222';
            ctx.fillRect(-width/2 + 14, -height/2 + 8, 4, 4);
            ctx.fillRect(-width/2 + 22, -height/2 + 8, 4, 4);
            
            ctx.fillStyle = '#4a3728';
            ctx.fillRect(-width/2 + 10, -height/2, 20, 8);
            
            ctx.fillStyle = '#333';
            ctx.fillRect(-width/2 + 2, -height/2 + 28, 8, 16);
            ctx.fillRect(-width/2 + width - 10, -height/2 + 28, 8, 16);
            
            ctx.fillStyle = '#2c3e50';
            ctx.fillRect(-width/2 + 14, -height/2 + 42, 10, 14);
            
            ctx.fillStyle = '#e74c3c';
            ctx.fillRect(-width/2 + 12, height/2 - 6, 10, 6);
            ctx.fillRect(-width/2 + width - 22, height/2 - 6, 10, 6);
            
            ctx.restore();
        }
    },
    neo: {
        name: 'Neo',
        draw: function(ctx, x, y, width, height, facingRight, state, frame) {
            ctx.save();
            ctx.translate(x + width / 2, y + height / 2);
            if (!facingRight) ctx.scale(-1, 1);
            
            ctx.fillStyle = '#2c3e50';
            ctx.fillRect(-width/2 + 4, -height/2 + 20, width - 8, height - 24);
            
            ctx.fillStyle = '#1a1a2e';
            ctx.fillRect(-width/2 + 6, -height/2 + 22, width - 12, height - 30);
            
            ctx.fillStyle = '#ffcc99';
            ctx.fillRect(-width/2 + 14, -height/2 + 6, 14, 16);
            
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(-width/2 + 16, -height/2 + 10, 4, 4);
            ctx.fillRect(-width/2 + 24, -height/2 + 10, 4, 4);
            
            ctx.fillStyle = '#000';
            ctx.fillRect(-width/2 + 17, -height/2 + 11, 2, 2);
            ctx.fillRect(-width/2 + 25, -height/2 + 11, 2, 2);
            
            ctx.fillStyle = '#e63946';
            ctx.fillRect(-width/2 + 2, -height/2 + 28, 8, 14);
            ctx.fillRect(-width/2 + width - 10, -height/2 + 28, 8, 14);
            
            ctx.fillStyle = '#34495e';
            ctx.fillRect(-width/2 + 14, -height/2 + 40, 10, 14);
            
            ctx.fillStyle = '#e74c3c';
            ctx.fillRect(-width/2 + 12, height/2 - 6, 10, 6);
            ctx.fillRect(-width/2 + width - 22, height/2 - 6, 10, 6);
            
            ctx.restore();
        }
    }
};

let selectedCharacter = 'neo';

let playerAnimFrame = 0;
let playerAnimTimer = 0;
let playerState = 'idle';

const GRAVITY = 0.6;
const FRICTION = 0.85;
const MOVE_SPEED = 6;
const JUMP_FORCE = -14;

const SCREEN_WIDTH = 800;
const SCREEN_HEIGHT = 600;

let DEBUG_MODE = true;
let debugInfo = '';
let eventLog = [];

function toggleDebug() {
    DEBUG_MODE = !DEBUG_MODE;
    const btn = document.getElementById('debugToggle');
    btn.textContent = 'Villuleit: ' + (DEBUG_MODE ? 'KVEIKT' : 'SLÖKKT');
    btn.style.background = DEBUG_MODE ? '#e63946' : '#4a4e69';
    logEvent('Villuleit breytt: ' + (DEBUG_MODE ? 'KVEIKT' : 'SLÖKKT'));
}

function selectCharacter(charKey) {
    if (!characters[charKey]) return;
    selectedCharacter = charKey;
    playerAnimFrame = 0;
    playerAnimTimer = 0;
    playerState = 'idle';
    
    document.querySelectorAll('.char-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('char-' + charKey).classList.add('active');
    logEvent('Karakter valinn: ' + characters[charKey].name);
}

function logEvent(msg) {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const timestamp = hours + ':' + minutes + ':' + seconds;
    const logMsg = '[' + timestamp + '] ' + msg;
    console.log(logMsg);
    eventLog.push(logMsg);
    if (eventLog.length > 20) eventLog.shift();
    
    const eventLogEl = document.getElementById('eventLog');
    if (eventLogEl) {
        eventLogEl.innerHTML = eventLog.map(m => '<div>' + m + '</div>').join('');
        eventLogEl.scrollTop = eventLogEl.scrollHeight;
    }
}

let currentLevel = 1;
let WORLD_WIDTH = SCREEN_WIDTH * 5;
let currentTheme = 'grasslands';

let cameraX = 0;
let gameWon = false;
let lives = 3;
let livesArray = [true, true, true];

const keys = {
    left: false,
    right: false,
    jump: false,
    shoot: false
};

const player = {
    x: 100,
    y: 300,
    width: 48,
    height: 72,
    velX: 0,
    velY: 0,
    onGround: false,
    color: '#e63946',
    facingRight: true
};

let platforms = [];
let coins = [];
let enemies = [];
let castle = {};
let decorations = [];
let bullets = [];
let shootCooldown = 0;
let particles = [];
let lifePowerups = [];
let boss = null;

function createParticles(x, y, color, count = 15) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            velX: (Math.random() - 0.5) * 10,
            velY: (Math.random() - 0.5) * 10 - 3,
            size: Math.random() * 6 + 2,
            color: color,
            life: 1.0,
            decay: Math.random() * 0.03 + 0.02
        });
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.velX;
        p.y += p.velY;
        p.velY += 0.2;
        p.life -= p.decay;
        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

function drawParticles() {
    particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - cameraX, p.y, p.size, p.size);
    });
    ctx.globalAlpha = 1.0;
}

function generateLevel1() {
    WORLD_WIDTH = SCREEN_WIDTH * 5;
    currentTheme = 'grasslands';
    platforms = [];
    coins = [];
    enemies = [];
    decorations = [];
    lifePowerups = [];
    
    platforms.push({ x: 0, y: 550, width: 600, height: 50 });
    
    platforms.push({ x: 700, y: 520, width: 150, height: 25 });
    platforms.push({ x: 900, y: 450, width: 100, height: 25 });
    platforms.push({ x: 1050, y: 380, width: 120, height: 25 });
    platforms.push({ x: 1200, y: 320, width: 100, height: 25 });
    platforms.push({ x: 1400, y: 400, width: 150, height: 25 });
    
    platforms.push({ x: 1600, y: 550, width: 500, height: 50 });
    
    platforms.push({ x: 1700, y: 480, width: 80, height: 25 });
    platforms.push({ x: 1850, y: 400, width: 100, height: 25 });
    platforms.push({ x: 2000, y: 320, width: 80, height: 25 });
    platforms.push({ x: 2150, y: 250, width: 120, height: 25 });
    
    platforms.push({ x: 2300, y: 550, width: 400, height: 50 });
    
    platforms.push({ x: 2400, y: 470, width: 100, height: 25 });
    platforms.push({ x: 2550, y: 380, width: 150, height: 25 });
    platforms.push({ x: 2750, y: 300, width: 100, height: 25 });
    platforms.push({ x: 2900, y: 220, width: 80, height: 25 });
    
    platforms.push({ x: 3100, y: 550, width: 450, height: 50 });
    
    platforms.push({ x: 3200, y: 450, width: 120, height: 25 });
    platforms.push({ x: 3400, y: 350, width: 100, height: 25 });
    platforms.push({ x: 3550, y: 280, width: 150, height: 25 });
    platforms.push({ x: 3750, y: 200, width: 100, height: 25 });
    
    platforms.push({ x: 3950, y: 550, width: 500, height: 50 });
    
    coins.push(
        { x: 760, y: 480, width: 20, height: 20, collected: false },
        { x: 930, y: 410, width: 20, height: 20, collected: false },
        { x: 1090, y: 340, width: 20, height: 20, collected: false },
        { x: 1230, y: 280, width: 20, height: 20, collected: false },
        { x: 1450, y: 360, width: 20, height: 20, collected: false },
        { x: 1730, y: 440, width: 20, height: 20, collected: false },
        { x: 1880, y: 360, width: 20, height: 20, collected: false },
        { x: 2030, y: 280, width: 20, height: 20, collected: false },
        { x: 2190, y: 210, width: 20, height: 20, collected: false },
        { x: 2440, y: 430, width: 20, height: 20, collected: false },
        { x: 2600, y: 340, width: 20, height: 20, collected: false },
        { x: 2780, y: 260, width: 20, height: 20, collected: false },
        { x: 2930, y: 180, width: 20, height: 20, collected: false },
        { x: 3240, y: 410, width: 20, height: 20, collected: false },
        { x: 3430, y: 310, width: 20, height: 20, collected: false },
        { x: 3600, y: 240, width: 20, height: 20, collected: false },
        { x: 3780, y: 160, width: 20, height: 20, collected: false }
    );
    
    enemies.push({ x: 200, y: 520, width: 32, height: 30, velX: 1.5, platformIndex: 0 });
    enemies.push({ x: 450, y: 520, width: 32, height: 30, velX: -1.5, platformIndex: 0 });
    enemies.push({ x: 730, y: 490, width: 32, height: 30, velX: 1.2, platformIndex: 1 });
    enemies.push({ x: 1450, y: 370, width: 32, height: 30, velX: -1.8, platformIndex: 5 });
    enemies.push({ x: 1650, y: 520, width: 32, height: 30, velX: 2, platformIndex: 6 });
    enemies.push({ x: 1900, y: 520, width: 32, height: 30, velX: -1.5, platformIndex: 6 });
    enemies.push({ x: 2150, y: 220, width: 32, height: 30, velX: 1, platformIndex: 9 });
    enemies.push({ x: 2450, y: 520, width: 32, height: 30, velX: 1.8, platformIndex: 10 });
    enemies.push({ x: 2800, y: 270, width: 32, height: 30, velX: -1.2, platformIndex: 13 });
    enemies.push({ x: 3300, y: 520, width: 32, height: 30, velX: 2, platformIndex: 16 });
    enemies.push({ x: 3600, y: 250, width: 32, height: 30, velX: 1.5, platformIndex: 18 });
    
    for (let i = 0; i < 12; i++) {
        decorations.push({ type: 'tree', x: 100 + i * 350, y: 530, size: 40 + Math.random() * 25 });
    }
    for (let i = 0; i < 8; i++) {
        decorations.push({ type: 'bush', x: 200 + i * 450, y: 525 + Math.random() * 25, size: 12 + Math.random() * 10 });
    }
    for (let i = 0; i < 15; i++) {
        decorations.push({ type: 'cloud', x: i * 280 + Math.random() * 150, y: 40 + Math.random() * 60, size: 25 + Math.random() * 15 });
    }
    
    castle = { x: WORLD_WIDTH - 280, y: 350, width: 220, height: 200, doorX: WORLD_WIDTH - 180, doorY: 420, doorWidth: 60, doorHeight: 130 };
    platforms.push({ x: WORLD_WIDTH - 320, y: 550, width: 350, height: 50 });
    
    lifePowerups.push({ x: 1450, y: 320, width: 24, height: 24, collected: false });
    lifePowerups.push({ x: 2200, y: 210, width: 24, height: 24, collected: false });
    
    boss = { x: WORLD_WIDTH - 400, y: 450, width: 60, height: 80, health: 5, maxHealth: 5, velX: 2, color: '#8b0000' };
}

function generateLevel2() {
    WORLD_WIDTH = SCREEN_WIDTH * 5;
    currentTheme = 'desert';
    platforms = [];
    coins = [];
    enemies = [];
    decorations = [];
    lifePowerups = [];
    
    platforms.push({ x: 0, y: 550, width: 700, height: 50 });
    
    platforms.push({ x: 200, y: 480, width: 100, height: 25 });
    platforms.push({ x: 350, y: 420, width: 80, height: 25 });
    platforms.push({ x: 500, y: 350, width: 100, height: 25 });
    platforms.push({ x: 700, y: 280, width: 120, height: 25 });
    platforms.push({ x: 900, y: 350, width: 100, height: 25 });
    platforms.push({ x: 1100, y: 420, width: 80, height: 25 });
    
    platforms.push({ x: 1250, y: 550, width: 600, height: 50 });
    
    platforms.push({ x: 1350, y: 470, width: 100, height: 25 });
    platforms.push({ x: 1500, y: 400, width: 80, height: 25 });
    platforms.push({ x: 1650, y: 320, width: 120, height: 25 });
    platforms.push({ x: 1850, y: 250, width: 100, height: 25 });
    
    platforms.push({ x: 2000, y: 550, width: 500, height: 50 });
    
    platforms.push({ x: 2100, y: 450, width: 80, height: 25 });
    platforms.push({ x: 2250, y: 380, width: 100, height: 25 });
    platforms.push({ x: 2450, y: 300, width: 80, height: 25 });
    platforms.push({ x: 2600, y: 380, width: 100, height: 25 });
    platforms.push({ x: 2750, y: 450, width: 80, height: 25 });
    
    platforms.push({ x: 2900, y: 550, width: 550, height: 50 });
    
    platforms.push({ x: 3000, y: 460, width: 100, height: 25 });
    platforms.push({ x: 3150, y: 380, width: 80, height: 25 });
    platforms.push({ x: 3300, y: 300, width: 100, height: 25 });
    platforms.push({ x: 3450, y: 220, width: 80, height: 25 });
    
    coins.push(
        { x: 230, y: 440, width: 20, height: 20, collected: false },
        { x: 370, y: 380, width: 20, height: 20, collected: false },
        { x: 530, y: 310, width: 20, height: 20, collected: false },
        { x: 740, y: 240, width: 20, height: 20, collected: false },
        { x: 930, y: 310, width: 20, height: 20, collected: false },
        { x: 1130, y: 380, width: 20, height: 20, collected: false },
        { x: 1380, y: 430, width: 20, height: 20, collected: false },
        { x: 1530, y: 360, width: 20, height: 20, collected: false },
        { x: 1690, y: 280, width: 20, height: 20, collected: false },
        { x: 1880, y: 210, width: 20, height: 20, collected: false },
        { x: 2130, y: 410, width: 20, height: 20, collected: false },
        { x: 2280, y: 340, width: 20, height: 20, collected: false },
        { x: 2480, y: 260, width: 20, height: 20, collected: false },
        { x: 2630, y: 340, width: 20, height: 20, collected: false },
        { x: 2780, y: 410, width: 20, height: 20, collected: false },
        { x: 3030, y: 420, width: 20, height: 20, collected: false },
        { x: 3180, y: 340, width: 20, height: 20, collected: false },
        { x: 3330, y: 260, width: 20, height: 20, collected: false },
        { x: 3480, y: 180, width: 20, height: 20, collected: false }
    );
    
    enemies.push({ x: 100, y: 520, width: 32, height: 30, velX: 1.8, platformIndex: 0 });
    enemies.push({ x: 400, y: 520, width: 32, height: 30, velX: -2, platformIndex: 0 });
    enemies.push({ x: 700, y: 250, width: 32, height: 30, velX: 1.5, platformIndex: 4 });
    enemies.push({ x: 1300, y: 520, width: 32, height: 30, velX: 2, platformIndex: 7 });
    enemies.push({ x: 1700, y: 290, width: 32, height: 30, velX: -1.8, platformIndex: 9 });
    enemies.push({ x: 2150, y: 520, width: 32, height: 30, velX: 1.5, platformIndex: 12 });
    enemies.push({ x: 2450, y: 270, width: 32, height: 30, velX: -1.2, platformIndex: 14 });
    enemies.push({ x: 3050, y: 520, width: 32, height: 30, velX: 2, platformIndex: 17 });
    enemies.push({ x: 3350, y: 270, width: 32, height: 30, velX: 1.5, platformIndex: 19 });
    
    for (let i = 0; i < 10; i++) {
        decorations.push({ type: 'cactus', x: 150 + i * 380, y: 530, size: 20 + Math.random() * 15 });
    }
    for (let i = 0; i < 3; i++) {
        decorations.push({ type: 'pyramid', x: 400 + i * 1400, y: 530, size: 50 + Math.random() * 25 });
    }
    for (let i = 0; i < 12; i++) {
        decorations.push({ type: 'cloud', x: i * 300 + Math.random() * 180, y: 40 + Math.random() * 50, size: 25 + Math.random() * 12 });
    }
    
    castle = { x: WORLD_WIDTH - 250, y: 350, width: 200, height: 200, doorX: WORLD_WIDTH - 150, doorY: 420, doorWidth: 55, doorHeight: 130 };
    platforms.push({ x: WORLD_WIDTH - 300, y: 550, width: 350, height: 50 });
    
    lifePowerups.push({ x: 450, y: 250, width: 24, height: 24, collected: false });
    lifePowerups.push({ x: 1400, y: 200, width: 24, height: 24, collected: false });
    
    boss = { x: WORLD_WIDTH - 380, y: 450, width: 60, height: 80, health: 5, maxHealth: 5, velX: 2.5, color: '#d4a017' };
}

function generateLevel3() {
    WORLD_WIDTH = SCREEN_WIDTH * 4;
    currentTheme = 'cave';
    platforms = [];
    coins = [];
    enemies = [];
    decorations = [];
    lifePowerups = [];
    coins = [];
    enemies = [];
    decorations = [];
    
    platforms.push({ x: 0, y: 550, width: 350, height: 50 });
    
    platforms.push({ x: 200, y: 500, width: 80, height: 25 });
    platforms.push({ x: 350, y: 450, width: 60, height: 25 });
    platforms.push({ x: 480, y: 400, width: 80, height: 25 });
    platforms.push({ x: 620, y: 350, width: 60, height: 25 });
    platforms.push({ x: 750, y: 400, width: 80, height: 25 });
    platforms.push({ x: 900, y: 450, width: 60, height: 25 });
    platforms.push({ x: 1050, y: 350, width: 80, height: 25 });
    platforms.push({ x: 1200, y: 300, width: 100, height: 25 });
    
    platforms.push({ x: 1350, y: 550, width: 300, height: 50 });
    
    platforms.push({ x: 1450, y: 480, width: 60, height: 25 });
    platforms.push({ x: 1580, y: 420, width: 80, height: 25 });
    platforms.push({ x: 1720, y: 360, width: 60, height: 25 });
    platforms.push({ x: 1850, y: 420, width: 80, height: 25 });
    platforms.push({ x: 2000, y: 480, width: 60, height: 25 });
    platforms.push({ x: 2150, y: 400, width: 80, height: 25 });
    
    platforms.push({ x: 2300, y: 550, width: 350, height: 50 });
    
    platforms.push({ x: 2400, y: 460, width: 60, height: 25 });
    platforms.push({ x: 2520, y: 380, width: 80, height: 25 });
    platforms.push({ x: 2650, y: 300, width: 60, height: 25 });
    platforms.push({ x: 2780, y: 380, width: 80, height: 25 });
    platforms.push({ x: 2920, y: 450, width: 60, height: 25 });
    
    coins.push(
        { x: 220, y: 460, width: 20, height: 20, collected: false },
        { x: 370, y: 410, width: 20, height: 20, collected: false },
        { x: 500, y: 360, width: 20, height: 20, collected: false },
        { x: 640, y: 310, width: 20, height: 20, collected: false },
        { x: 770, y: 360, width: 20, height: 20, collected: false },
        { x: 920, y: 410, width: 20, height: 20, collected: false },
        { x: 1080, y: 310, width: 20, height: 20, collected: false },
        { x: 1230, y: 260, width: 20, height: 20, collected: false },
        { x: 1480, y: 440, width: 20, height: 20, collected: false },
        { x: 1610, y: 380, width: 20, height: 20, collected: false },
        { x: 1750, y: 320, width: 20, height: 20, collected: false },
        { x: 1880, y: 380, width: 20, height: 20, collected: false },
        { x: 2030, y: 440, width: 20, height: 20, collected: false },
        { x: 2180, y: 360, width: 20, height: 20, collected: false },
        { x: 2450, y: 420, width: 20, height: 20, collected: false },
        { x: 2560, y: 340, width: 20, height: 20, collected: false },
        { x: 2680, y: 260, width: 20, height: 20, collected: false },
        { x: 2810, y: 340, width: 20, height: 20, collected: false },
        { x: 2950, y: 410, width: 20, height: 20, collected: false }
    );
    
    enemies.push({ x: 100, y: 520, width: 32, height: 30, velX: 1.5, platformIndex: 0 });
    enemies.push({ x: 650, y: 320, width: 32, height: 30, velX: -1.2, platformIndex: 4 });
    enemies.push({ x: 1250, y: 270, width: 32, height: 30, velX: 1.8, platformIndex: 8 });
    enemies.push({ x: 1600, y: 390, width: 32, height: 30, velX: -1.5, platformIndex: 12 });
    enemies.push({ x: 1900, y: 450, width: 32, height: 30, velX: 1.2, platformIndex: 14 });
    enemies.push({ x: 2200, y: 370, width: 32, height: 30, velX: -1.8, platformIndex: 16 });
    enemies.push({ x: 2550, y: 350, width: 32, height: 30, velX: 1.5, platformIndex: 22 });
    enemies.push({ x: 2850, y: 420, width: 32, height: 30, velX: -1.2, platformIndex: 24 });
    
    for (let i = 0; i < 20; i++) {
        decorations.push({ type: 'stalactite', x: i * 130 + Math.random() * 80, y: Math.random() * 120, size: 15 + Math.random() * 25 });
    }
    for (let i = 0; i < 12; i++) {
        decorations.push({ type: 'rock', x: i * 200 + Math.random() * 120, y: 530 + Math.random() * 20, size: 12 + Math.random() * 12 });
    }
    
    castle = { x: WORLD_WIDTH - 220, y: 350, width: 180, height: 200, doorX: WORLD_WIDTH - 130, doorY: 420, doorWidth: 50, doorHeight: 130 };
    platforms.push({ x: WORLD_WIDTH - 280, y: 550, width: 320, height: 50 });
    
    lifePowerups.push({ x: 600, y: 300, width: 24, height: 24, collected: false });
    lifePowerups.push({ x: 1200, y: 180, width: 24, height: 24, collected: false });
    
    boss = { x: WORLD_WIDTH - 350, y: 450, width: 60, height: 80, health: 5, maxHealth: 5, velX: 2.5, color: '#4a0d4a' };
}

function generateLevel4() {
    WORLD_WIDTH = SCREEN_WIDTH * 5;
    currentTheme = 'snow';
    platforms = [];
    coins = [];
    enemies = [];
    decorations = [];
    lifePowerups = [];
    
    platforms.push({ x: 0, y: 550, width: 600, height: 50 });
    
    platforms.push({ x: 200, y: 480, width: 100, height: 25 });
    platforms.push({ x: 400, y: 400, width: 80, height: 25 });
    platforms.push({ x: 600, y: 320, width: 120, height: 25 });
    platforms.push({ x: 850, y: 250, width: 100, height: 25 });
    platforms.push({ x: 1100, y: 320, width: 80, height: 25 });
    
    platforms.push({ x: 1300, y: 550, width: 400, height: 50 });
    
    platforms.push({ x: 1400, y: 480, width: 80, height: 25 });
    platforms.push({ x: 1550, y: 400, width: 100, height: 25 });
    platforms.push({ x: 1750, y: 320, width: 80, height: 25 });
    platforms.push({ x: 1900, y: 250, width: 120, height: 25 });
    platforms.push({ x: 2100, y: 320, width: 100, height: 25 });
    
    platforms.push({ x: 2300, y: 550, width: 500, height: 50 });
    
    platforms.push({ x: 2400, y: 480, width: 80, height: 25 });
    platforms.push({ x: 2550, y: 400, width: 100, height: 25 });
    platforms.push({ x: 2750, y: 320, width: 80, height: 25 });
    platforms.push({ x: 2900, y: 250, width: 120, height: 25 });
    platforms.push({ x: 3100, y: 320, width: 100, height: 25 });
    platforms.push({ x: 3300, y: 400, width: 80, height: 25 });
    platforms.push({ x: 3500, y: 480, width: 100, height: 25 });
    platforms.push({ x: 3700, y: 550, width: 300, height: 50 });
    
    coins.push(
        { x: 240, y: 440, width: 20, height: 20, collected: false },
        { x: 420, y: 360, width: 20, height: 20, collected: false },
        { x: 630, y: 280, width: 20, height: 20, collected: false },
        { x: 880, y: 210, width: 20, height: 20, collected: false },
        { x: 1130, y: 280, width: 20, height: 20, collected: false },
        { x: 1430, y: 440, width: 20, height: 20, collected: false },
        { x: 1580, y: 360, width: 20, height: 20, collected: false },
        { x: 1780, y: 280, width: 20, height: 20, collected: false },
        { x: 1930, y: 210, width: 20, height: 20, collected: false },
        { x: 2130, y: 280, width: 20, height: 20, collected: false },
        { x: 2430, y: 440, width: 20, height: 20, collected: false },
        { x: 2580, y: 360, width: 20, height: 20, collected: false },
        { x: 2780, y: 280, width: 20, height: 20, collected: false },
        { x: 2930, y: 210, width: 20, height: 20, collected: false },
        { x: 3130, y: 280, width: 20, height: 20, collected: false },
        { x: 3330, y: 360, width: 20, height: 20, collected: false },
        { x: 3530, y: 440, width: 20, height: 20, collected: false },
        { x: 3730, y: 510, width: 20, height: 20, collected: false }
    );
    
    enemies.push({ x: 150, y: 520, width: 32, height: 30, velX: 1.8, platformIndex: 0 });
    enemies.push({ x: 400, y: 520, width: 32, height: 30, velX: -2, platformIndex: 0 });
    enemies.push({ x: 950, y: 350, width: 32, height: 30, velX: 1.5, platformIndex: 3 });
    enemies.push({ x: 1250, y: 230, width: 32, height: 30, velX: -1.8, platformIndex: 5 });
    enemies.push({ x: 1700, y: 520, width: 32, height: 30, velX: 2, platformIndex: 7 });
    enemies.push({ x: 2000, y: 320, width: 32, height: 30, velX: -1.5, platformIndex: 9 });
    enemies.push({ x: 2300, y: 520, width: 32, height: 30, velX: 1.8, platformIndex: 12 });
    enemies.push({ x: 2700, y: 370, width: 32, height: 30, velX: -1.2, platformIndex: 14 });
    enemies.push({ x: 3000, y: 370, width: 32, height: 30, velX: 1.5, platformIndex: 17 });
    enemies.push({ x: 3400, y: 520, width: 32, height: 30, velX: 2, platformIndex: 19 });
    enemies.push({ x: 3700, y: 270, width: 32, height: 30, velX: -1.8, platformIndex: 21 });
    
    for (let i = 0; i < 15; i++) {
        decorations.push({ type: 'snowtree', x: i * 350 + Math.random() * 150, y: 530, size: 40 + Math.random() * 20 });
    }
    for (let i = 0; i < 10; i++) {
        decorations.push({ type: 'cloud', x: i * 400 + Math.random() * 200, y: 40 + Math.random() * 60, size: 30 + Math.random() * 15 });
    }
    
    castle = { x: WORLD_WIDTH - 220, y: 350, width: 180, height: 200, doorX: WORLD_WIDTH - 130, doorY: 420, doorWidth: 50, doorHeight: 130 };
    platforms.push({ x: WORLD_WIDTH - 280, y: 550, width: 320, height: 50 });
    
    lifePowerups.push({ x: 600, y: 280, width: 24, height: 24, collected: false });
    lifePowerups.push({ x: 1900, y: 210, width: 24, height: 24, collected: false });
    
    boss = { x: WORLD_WIDTH - 350, y: 450, width: 60, height: 80, health: 5, maxHealth: 5, velX: 3, color: '#4a90d9' };
}

function generateLevel5() {
    WORLD_WIDTH = SCREEN_WIDTH * 4;
    currentTheme = 'volcanic';
    platforms = [];
    coins = [];
    enemies = [];
    decorations = [];
    lifePowerups = [];
    
    platforms.push({ x: 0, y: 550, width: 400, height: 50 });
    
    platforms.push({ x: 150, y: 500, width: 60, height: 25 });
    platforms.push({ x: 280, y: 450, width: 80, height: 25 });
    platforms.push({ x: 420, y: 400, width: 60, height: 25 });
    platforms.push({ x: 550, y: 340, width: 80, height: 25 });
    platforms.push({ x: 700, y: 400, width: 60, height: 25 });
    platforms.push({ x: 850, y: 340, width: 80, height: 25 });
    platforms.push({ x: 1000, y: 280, width: 100, height: 25 });
    
    platforms.push({ x: 1150, y: 550, width: 350, height: 50 });
    
    platforms.push({ x: 1250, y: 480, width: 60, height: 25 });
    platforms.push({ x: 1380, y: 420, width: 80, height: 25 });
    platforms.push({ x: 1520, y: 360, width: 60, height: 25 });
    platforms.push({ x: 1650, y: 420, width: 80, height: 25 });
    platforms.push({ x: 1800, y: 480, width: 60, height: 25 });
    
    platforms.push({ x: 1900, y: 550, width: 400, height: 50 });
    
    platforms.push({ x: 2000, y: 460, width: 80, height: 25 });
    platforms.push({ x: 2150, y: 380, width: 60, height: 25 });
    platforms.push({ x: 2280, y: 300, width: 80, height: 25 });
    platforms.push({ x: 2420, y: 380, width: 60, height: 25 });
    platforms.push({ x: 2550, y: 460, width: 80, height: 25 });
    
    platforms.push({ x: 2700, y: 550, width: 350, height: 50 });
    
    platforms.push({ x: 2800, y: 440, width: 60, height: 25 });
    platforms.push({ x: 2920, y: 360, width: 80, height: 25 });
    platforms.push({ x: 3050, y: 440, width: 60, height: 25 });
    
    coins.push(
        { x: 170, y: 460, width: 20, height: 20, collected: false },
        { x: 300, y: 410, width: 20, height: 20, collected: false },
        { x: 440, y: 360, width: 20, height: 20, collected: false },
        { x: 580, y: 300, width: 20, height: 20, collected: false },
        { x: 730, y: 360, width: 20, height: 20, collected: false },
        { x: 880, y: 300, width: 20, height: 20, collected: false },
        { x: 1030, y: 240, width: 20, height: 20, collected: false },
        { x: 1280, y: 440, width: 20, height: 20, collected: false },
        { x: 1410, y: 380, width: 20, height: 20, collected: false },
        { x: 1550, y: 320, width: 20, height: 20, collected: false },
        { x: 1680, y: 380, width: 20, height: 20, collected: false },
        { x: 1830, y: 440, width: 20, height: 20, collected: false },
        { x: 2030, y: 420, width: 20, height: 20, collected: false },
        { x: 2180, y: 340, width: 20, height: 20, collected: false },
        { x: 2310, y: 260, width: 20, height: 20, collected: false },
        { x: 2450, y: 340, width: 20, height: 20, collected: false },
        { x: 2580, y: 420, width: 20, height: 20, collected: false },
        { x: 2830, y: 400, width: 20, height: 20, collected: false },
        { x: 2950, y: 320, width: 20, height: 20, collected: false },
        { x: 3080, y: 400, width: 20, height: 20, collected: false }
    );
    
    enemies.push({ x: 100, y: 520, width: 32, height: 30, velX: 1.8, platformIndex: 0 });
    enemies.push({ x: 300, y: 520, width: 32, height: 30, velX: -2, platformIndex: 0 });
    enemies.push({ x: 600, y: 370, width: 32, height: 30, velX: 1.5, platformIndex: 4 });
    enemies.push({ x: 900, y: 310, width: 32, height: 30, velX: -1.8, platformIndex: 6 });
    enemies.push({ x: 1050, y: 250, width: 32, height: 30, velX: 2, platformIndex: 7 });
    enemies.push({ x: 1300, y: 450, width: 32, height: 30, velX: 1.2, platformIndex: 9 });
    enemies.push({ x: 1700, y: 390, width: 32, height: 30, velX: -1.5, platformIndex: 12 });
    enemies.push({ x: 2050, y: 430, width: 32, height: 30, velX: 1.8, platformIndex: 15 });
    enemies.push({ x: 2300, y: 270, width: 32, height: 30, velX: -1.2, platformIndex: 17 });
    enemies.push({ x: 2600, y: 430, width: 32, height: 30, velX: 1.5, platformIndex: 20 });
    enemies.push({ x: 2850, y: 370, width: 32, height: 30, velX: -1.8, platformIndex: 22 });
    
    for (let i = 0; i < 8; i++) {
        decorations.push({ type: 'lava', x: 100 + i * 350, y: 560, size: 25 + Math.random() * 15 });
    }
    for (let i = 0; i < 6; i++) {
        decorations.push({ type: 'rock', x: i * 400 + Math.random() * 180, y: 530 + Math.random() * 20, size: 15 + Math.random() * 12 });
    }
    for (let i = 0; i < 10; i++) {
        decorations.push({ type: 'smoke', x: i * 280 + Math.random() * 120, y: 25 + Math.random() * 60, size: 25 + Math.random() * 15 });
    }
    
    castle = { x: WORLD_WIDTH - 200, y: 350, width: 160, height: 200, doorX: WORLD_WIDTH - 120, doorY: 420, doorWidth: 45, doorHeight: 130 };
    platforms.push({ x: WORLD_WIDTH - 250, y: 550, width: 300, height: 50 });
    
    lifePowerups.push({ x: 500, y: 300, width: 24, height: 24, collected: false });
    lifePowerups.push({ x: 1400, y: 200, width: 24, height: 24, collected: false });
    
    boss = { x: WORLD_WIDTH - 320, y: 450, width: 60, height: 80, health: 5, maxHealth: 5, velX: 3.5, color: '#ff4500' };
}

function generateWorld() {
    switch(currentLevel) {
        case 1: generateLevel1(); break;
        case 2: generateLevel2(); break;
        case 3: generateLevel3(); break;
        case 4: generateLevel4(); break;
        case 5: generateLevel5(); break;
        default: generateLevel1();
    }
}

let score = 0;
let gameOver = false;
let gameState = 'title';

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function resumeAudio() {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

document.addEventListener('click', resumeAudio);
document.addEventListener('keydown', resumeAudio);

function playJumpSound() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.setValueAtTime(400, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
}

function playCoinSound() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1000, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1500, audioCtx.currentTime + 0.05);
    osc.frequency.exponentialRampToValueAtTime(2000, audioCtx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.15);
}

function playGameOverSound() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.5);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.5);
}

function playEnemyDeathSound() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = 'square';
    osc.frequency.setValueAtTime(200, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.15);
}

function playWinSound() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + i * 0.15);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime + i * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + i * 0.15 + 0.3);
        osc.start(audioCtx.currentTime + i * 0.15);
        osc.stop(audioCtx.currentTime + i * 0.15 + 0.3);
    });
}

function playShootSound() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.08);
}

function drawBackground() {
    let gradient;
    
    switch(currentTheme) {
        case 'desert':
            gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, '#ff9966');
            gradient.addColorStop(0.4, '#ffcc99');
            gradient.addColorStop(1, '#ffe4b5');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.fillStyle = '#d2691e';
            let grassHillX = -cameraX * 0.2;
            ctx.beginPath();
            ctx.moveTo(0, 600);
            for (let x = 0; x <= 800; x += 40) {
                const y = 500 + Math.sin((x + grassHillX) * 0.004) * 50;
                ctx.lineTo(x, y);
            }
            ctx.lineTo(800, 600);
            ctx.closePath();
            ctx.fill();
            break;
            
        case 'cave':
            gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, '#1a1a1a');
            gradient.addColorStop(0.5, '#2d2d2d');
            gradient.addColorStop(1, '#1a1a1a');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.fillStyle = '#3d3d3d';
            let caveHillX = -cameraX * 0.1;
            ctx.beginPath();
            ctx.moveTo(0, 600);
            for (let x = 0; x <= 800; x += 60) {
                const y = 520 + Math.sin((x + caveHillX) * 0.006) * 30;
                ctx.lineTo(x, y);
            }
            ctx.lineTo(800, 600);
            ctx.closePath();
            ctx.fill();
            break;
            
        case 'snow':
            gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, '#b8d4e8');
            gradient.addColorStop(0.4, '#d6eaf8');
            gradient.addColorStop(1, '#f0f8ff');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.fillStyle = '#a8c8dc';
            let snowHillX = -cameraX * 0.25;
            ctx.beginPath();
            ctx.moveTo(0, 600);
            for (let x = 0; x <= 800; x += 35) {
                const y = 510 + Math.sin((x + snowHillX) * 0.005) * 45;
                ctx.lineTo(x, y);
            }
            ctx.lineTo(800, 600);
            ctx.closePath();
            ctx.fill();
            break;
            
        case 'volcanic':
            gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, '#2c1810');
            gradient.addColorStop(0.3, '#4a2c2a');
            gradient.addColorStop(0.6, '#1a0a05');
            gradient.addColorStop(1, '#0d0502');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.fillStyle = '#3d1f1a';
            let volcHillX = -cameraX * 0.15;
            ctx.beginPath();
            ctx.moveTo(0, 600);
            for (let x = 0; x <= 800; x += 50) {
                const y = 530 + Math.sin((x + volcHillX) * 0.005) * 35;
                ctx.lineTo(x, y);
            }
            ctx.lineTo(800, 600);
            ctx.closePath();
            ctx.fill();
            break;
            
        default:
            gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, '#87ceeb');
            gradient.addColorStop(0.4, '#b8e0f0');
            gradient.addColorStop(1, '#d4f1f9');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.fillStyle = '#7cb87c';
            let grassDefaultHillX = -cameraX * 0.3;
            ctx.beginPath();
            ctx.moveTo(0, 600);
            for (let x = 0; x <= 800; x += 30) {
                const y = 480 + Math.sin((x + grassDefaultHillX) * 0.003) * 60 + Math.sin((x + grassDefaultHillX) * 0.007) * 30;
                ctx.lineTo(x, y);
            }
            ctx.lineTo(800, 600);
            ctx.closePath();
            ctx.fill();
            
            ctx.fillStyle = '#5a9a5a';
            ctx.beginPath();
            ctx.moveTo(0, 600);
            for (let x = 0; x <= 800; x += 30) {
                const y = 520 + Math.sin((x + grassDefaultHillX * 1.5) * 0.004 + 1) * 40 + Math.sin((x + grassDefaultHillX) * 0.008) * 20;
                ctx.lineTo(x, y);
            }
            ctx.lineTo(800, 600);
            ctx.closePath();
            ctx.fill();
    }
}

function drawDecorations() {
    decorations.forEach(dec => {
        const dx = dec.x - cameraX * (dec.type === 'cloud' ? 0.2 : 0.5);
        if (dx < -100 || dx > SCREEN_WIDTH + 100) return;
        
        switch(dec.type) {
            case 'tree':
                ctx.fillStyle = '#5d4037';
                ctx.fillRect(dx + dec.size * 0.35, dec.y - dec.size * 0.3, dec.size * 0.3, dec.size * 0.5);
                ctx.fillStyle = '#2e7d32';
                ctx.beginPath();
                ctx.arc(dx, dec.y - dec.size * 0.5, dec.size * 0.6, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(dx - dec.size * 0.35, dec.y - dec.size * 0.3, dec.size * 0.4, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(dx + dec.size * 0.35, dec.y - dec.size * 0.35, dec.size * 0.4, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'bush':
                ctx.fillStyle = '#388e3c';
                ctx.beginPath();
                ctx.arc(dx, dec.y, dec.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(dx - dec.size * 0.6, dec.y + 2, dec.size * 0.7, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(dx + dec.size * 0.6, dec.y + 2, dec.size * 0.7, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'cloud':
                ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                ctx.beginPath();
                ctx.arc(dx, dec.y, dec.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(dx - dec.size * 0.7, dec.y + 5, dec.size * 0.7, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(dx + dec.size * 0.7, dec.y + 5, dec.size * 0.7, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'cactus':
                ctx.fillStyle = '#228b22';
                ctx.fillRect(dx, dec.y - dec.size * 1.5, dec.size * 0.3, dec.size * 1.5);
                ctx.fillRect(dx - dec.size * 0.4, dec.y - dec.size * 0.8, dec.size * 0.3, dec.size * 0.5);
                ctx.fillRect(dx + dec.size * 0.1, dec.y - dec.size * 1.1, dec.size * 0.3, dec.size * 0.4);
                break;
                
            case 'pyramid':
                ctx.fillStyle = '#deb887';
                ctx.beginPath();
                ctx.moveTo(dx, dec.y);
                ctx.lineTo(dx + dec.size / 2, dec.y - dec.size);
                ctx.lineTo(dx + dec.size, dec.y);
                ctx.closePath();
                ctx.fill();
                ctx.fillStyle = '#d2b48c';
                ctx.beginPath();
                ctx.moveTo(dx + dec.size * 0.3, dec.y);
                ctx.lineTo(dx + dec.size / 2, dec.y - dec.size * 0.6);
                ctx.lineTo(dx + dec.size * 0.7, dec.y);
                ctx.closePath();
                ctx.fill();
                break;
                
            case 'stalactite':
                ctx.fillStyle = '#5a5a5a';
                ctx.beginPath();
                ctx.moveTo(dx, dec.y);
                ctx.lineTo(dx + dec.size * 0.3, dec.y + dec.size);
                ctx.lineTo(dx - dec.size * 0.3, dec.y + dec.size);
                ctx.closePath();
                ctx.fill();
                break;
                
            case 'rock':
                ctx.fillStyle = '#4a4a4a';
                ctx.beginPath();
                ctx.ellipse(dx, dec.y, dec.size, dec.size * 0.6, 0, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'mushroom':
                ctx.fillStyle = '#8b4513';
                ctx.fillRect(dx - 2, dec.y - dec.size * 0.3, 4, dec.size * 0.3);
                ctx.fillStyle = '#ff4444';
                ctx.beginPath();
                ctx.arc(dx, dec.y - dec.size * 0.3, dec.size * 0.5, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'snowtree':
                ctx.fillStyle = '#4a3728';
                ctx.fillRect(dx + dec.size * 0.4, dec.y - dec.size * 0.2, dec.size * 0.2, dec.size * 0.3);
                ctx.fillStyle = '#e8f4f8';
                ctx.beginPath();
                ctx.moveTo(dx, dec.y - dec.size * 0.2);
                ctx.lineTo(dx + dec.size / 2, dec.y - dec.size);
                ctx.lineTo(dx + dec.size, dec.y - dec.size * 0.2);
                ctx.closePath();
                ctx.fill();
                break;
                
            case 'snowman':
                ctx.fillStyle = '#f5f5f5';
                ctx.beginPath();
                ctx.arc(dx, dec.y, dec.size * 0.8, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(dx, dec.y - dec.size * 1.3, dec.size * 0.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(dx, dec.y - dec.size * 2, dec.size * 0.35, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'lava':
                ctx.fillStyle = '#ff4500';
                ctx.beginPath();
                ctx.arc(dx, dec.y, dec.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ffa500';
                ctx.beginPath();
                ctx.arc(dx, dec.y, dec.size * 0.6, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'smoke':
                ctx.fillStyle = 'rgba(100, 100, 100, 0.4)';
                ctx.beginPath();
                ctx.arc(dx, dec.y, dec.size, 0, Math.PI * 2);
                ctx.fill();
                break;
        }
    });
}

function drawPlayer() {
    const screenX = player.x - cameraX;
    const char = characters[selectedCharacter];
    
    if (!player.onGround) {
        playerState = 'jump';
        playerAnimTimer++;
        if (playerAnimTimer > 8) {
            playerAnimTimer = 0;
            playerAnimFrame = (playerAnimFrame + 1) % 2;
        }
    } else if (Math.abs(player.velX) > 0.5) {
        playerState = 'run';
        playerAnimTimer++;
        if (playerAnimTimer > 5) {
            playerAnimTimer = 0;
            playerAnimFrame = (playerAnimFrame + 1) % 4;
        }
    } else {
        playerState = 'idle';
        playerAnimFrame = 0;
        playerAnimTimer = 0;
    }
    
    char.draw(ctx, screenX, player.y, player.width, player.height, player.facingRight, playerState, playerAnimFrame);
    
    const gunX = player.facingRight ? player.x + player.width - 4 : player.x - 8;
    ctx.fillStyle = '#333';
    ctx.fillRect(gunX - cameraX, player.y + 30, 16, 10);
    ctx.fillStyle = '#555';
    ctx.fillRect(gunX - cameraX + (player.facingRight ? 10 : 0), player.y + 32, 6, 6);
}

function drawPlatforms() {
    platforms.forEach(platform => {
        if (platform.x - cameraX > SCREEN_WIDTH || platform.x + platform.width - cameraX < 0) return;
        
        const px = platform.x - cameraX;
        
        switch(currentTheme) {
            case 'desert':
                ctx.fillStyle = '#c2956e';
                ctx.beginPath();
                ctx.roundRect(px, platform.y, platform.width, platform.height, 5);
                ctx.fill();
                ctx.fillStyle = '#d4a574';
                ctx.fillRect(px, platform.y, platform.width, 8);
                break;
                
            case 'cave':
                ctx.fillStyle = '#4a4a4a';
                ctx.beginPath();
                ctx.roundRect(px, platform.y, platform.width, platform.height, 3);
                ctx.fill();
                ctx.fillStyle = '#5a5a5a';
                ctx.fillRect(px, platform.y, platform.width, 6);
                break;
                
            case 'snow':
                ctx.fillStyle = '#a8c8dc';
                ctx.beginPath();
                ctx.roundRect(px, platform.y, platform.width, platform.height, 5);
                ctx.fill();
                ctx.fillStyle = '#e8f4f8';
                ctx.beginPath();
                ctx.roundRect(px, platform.y, platform.width, 10, [5, 5, 0, 0]);
                ctx.fill();
                break;
                
            case 'volcanic':
                ctx.fillStyle = '#2a1a1a';
                ctx.beginPath();
                ctx.roundRect(px, platform.y, platform.width, platform.height, 3);
                ctx.fill();
                ctx.fillStyle = '#4a2a2a';
                ctx.fillRect(px, platform.y, platform.width, 8);
                break;
                
            default:
                ctx.fillStyle = '#3d5a45';
                ctx.beginPath();
                ctx.roundRect(px, platform.y, platform.width, platform.height, 8);
                ctx.fill();
                ctx.fillStyle = '#5a8a5f';
                ctx.beginPath();
                ctx.roundRect(px, platform.y, platform.width, 10, [8, 8, 0, 0]);
                ctx.fill();
                ctx.fillStyle = '#7bc086';
                for (let i = 0; i < platform.width - 10; i += 15) {
                    const grassHeight = 6 + Math.sin(i * 0.5) * 3;
                    ctx.beginPath();
                    ctx.moveTo(px + i + 5, platform.y + 2);
                    ctx.lineTo(px + i + 8, platform.y - grassHeight);
                    ctx.lineTo(px + i + 11, platform.y + 2);
                    ctx.fill();
                }
        }
    });
}

function drawCoins() {
    coins.forEach(coin => {
        if (coin.collected) return;
        if (coin.x - cameraX > SCREEN_WIDTH || coin.x + coin.width - cameraX < 0) return;
        
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(coin.x - cameraX + coin.width / 2, coin.y + coin.height / 2, 12, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ffea00';
        ctx.beginPath();
        ctx.arc(coin.x - cameraX + coin.width / 2 - 3, coin.y + coin.height / 2 - 3, 4, 0, Math.PI * 2);
        ctx.fill();
    });
}

function drawLifePowerups() {
    lifePowerups.forEach(powerup => {
        if (powerup.collected) return;
        if (powerup.x - cameraX > SCREEN_WIDTH || powerup.x + powerup.width - cameraX < 0) return;
        
        const x = powerup.x - cameraX + powerup.width / 2;
        const y = powerup.y + powerup.height / 2;
        
        ctx.fillStyle = '#e63946';
        ctx.beginPath();
        ctx.moveTo(x, y + 5);
        ctx.bezierCurveTo(x, y, x - 10, y, x - 10, y + 10);
        ctx.bezierCurveTo(x - 10, y + 18, x, y + 25, x, y + 28);
        ctx.bezierCurveTo(x, y + 25, x + 10, y + 18, x + 10, y + 10);
        ctx.bezierCurveTo(x + 10, y, x, y, x, y + 5);
        ctx.fill();
    });
}

function drawEnemies() {
    enemies.forEach(enemy => {
        if (enemy.x - cameraX > SCREEN_WIDTH || enemy.x + enemy.width - cameraX < 0) return;
        
        ctx.fillStyle = '#6a4c93';
        ctx.fillRect(enemy.x - cameraX, enemy.y, enemy.width, enemy.height);
        
        ctx.fillStyle = '#9d4edd';
        ctx.fillRect(enemy.x - cameraX, enemy.y, enemy.width, 8);
        
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(enemy.x - cameraX + 6, enemy.y + 12, 8, 8);
        ctx.fillRect(enemy.x - cameraX + 18, enemy.y + 12, 8, 8);
        
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(enemy.x - cameraX + 7, enemy.y + 13, 3, 3);
        ctx.fillRect(enemy.x - cameraX + 19, enemy.y + 13, 3, 3);
    });
}

function drawBoss() {
    if (!boss || boss.health <= 0) return;
    if (boss.x - cameraX > SCREEN_WIDTH || boss.x + boss.width - cameraX < 0) return;
    
    const bossX = boss.x - cameraX;
    
    ctx.fillStyle = boss.color;
    ctx.fillRect(bossX, boss.y, boss.width, boss.height);
    
    ctx.fillStyle = '#ffcc00';
    ctx.fillRect(bossX + 10, boss.y + 15, 40, 10);
    
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(bossX + 15, boss.y + 17, 8, 6);
    ctx.fillRect(bossX + 37, boss.y + 17, 8, 6);
    
    const healthBarWidth = 50;
    const healthPercent = boss.health / boss.maxHealth;
    ctx.fillStyle = '#333';
    ctx.fillRect(bossX, boss.y - 15, healthBarWidth, 8);
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(bossX, boss.y - 15, healthBarWidth * healthPercent, 8);
}

function drawBullets() {
    bullets.forEach(bullet => {
        ctx.fillStyle = '#ffeb3b';
        ctx.beginPath();
        ctx.arc(bullet.x - cameraX, bullet.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(bullet.x - cameraX, bullet.y, 2, 0, Math.PI * 2);
        ctx.fill();
    });
}

function drawCastle() {
    if (castle.x - cameraX > SCREEN_WIDTH || castle.x + castle.width - cameraX < 0) return;
    
    const cx = castle.x - cameraX;
    
    ctx.fillStyle = '#4a4e69';
    ctx.fillRect(cx, castle.y, castle.width, castle.height);
    
    ctx.fillStyle = '#22223b';
    ctx.fillRect(cx, castle.y, castle.width, 30);
    
    for (let i = 0; i < 5; i++) {
        ctx.fillRect(cx + i * 45, castle.y - 20, 30, 20);
    }
    
    ctx.fillStyle = '#9a8c98';
    ctx.fillRect(cx + 20, castle.y - 10, 20, 30);
    
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(castle.doorX - cameraX, castle.doorY, castle.doorWidth, castle.doorHeight);
    
    ctx.fillStyle = '#c9ada7';
    ctx.beginPath();
    ctx.arc(castle.doorX - cameraX + castle.doorWidth / 2, castle.doorY + 20, 15, Math.PI, 0);
    ctx.fill();
}

function updateEnemies() {
    enemies.forEach(enemy => {
        const platform = platforms[enemy.platformIndex];
        if (!platform) return;
        
        enemy.x += enemy.velX;
        
        if (enemy.x <= platform.x) {
            enemy.x = platform.x;
            enemy.velX = Math.abs(enemy.velX);
        }
        if (enemy.x + enemy.width >= platform.x + platform.width) {
            enemy.x = platform.x + platform.width - enemy.width;
            enemy.velX = -Math.abs(enemy.velX);
        }
        
        if (checkCollision(player, enemy)) {
            const playerBottom = player.y + player.height;
            const enemyTop = enemy.y;
            
            if (player.velY > 0 && playerBottom - player.velY <= enemyTop + 10) {
                const enemyIndex = enemies.indexOf(enemy);
                createParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, '#8b4513', 20);
                enemies.splice(enemyIndex, 1);
                player.velY = -10;
                score += 2;
                playEnemyDeathSound();
            } else if (!gameOver) {
                loseLife();
            }
        }
    });
}

function updateBoss() {
    if (!boss || boss.health <= 0) return;
    
    const castlePlatform = platforms.find(p => p.x + p.width > boss.x && p.x < boss.x + boss.width);
    if (castlePlatform) {
        if (boss.x <= castlePlatform.x) {
            boss.x = castlePlatform.x;
            boss.velX = Math.abs(boss.velX);
        }
        if (boss.x + boss.width >= castlePlatform.x + castlePlatform.width) {
            boss.x = castlePlatform.x + castlePlatform.width - boss.width;
            boss.velX = -Math.abs(boss.velX);
        }
    }
    boss.x += boss.velX;
    
    if (checkCollision(player, boss)) {
        if (!gameOver) {
            loseLife();
        }
    }
    
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        if (checkCollision(bullet, boss)) {
            bullets.splice(i, 1);
            boss.health--;
            createParticles(boss.x + boss.width / 2, boss.y + boss.height / 2, boss.color, 10);
            
            if (boss.health <= 0) {
                createParticles(boss.x + boss.width / 2, boss.y + boss.height / 2, boss.color, 30);
                score += 20;
            }
        }
    }
}

function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        bullet.x += bullet.velX;
        
        if (bullet.x < 0 || bullet.x > WORLD_WIDTH) {
            bullets.splice(i, 1);
            continue;
        }
        
        platforms.forEach(platform => {
            if (checkCollision(bullet, platform)) {
                bullets.splice(i, 1);
            }
        });
        
        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];
            const enemyScreenX = enemy.x - cameraX;
            const isVisible = enemyScreenX + enemy.width > 0 && enemyScreenX < SCREEN_WIDTH;
            
            if (isVisible && checkCollision(bullet, enemy)) {
                createParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, '#8b4513', 20);
                enemies.splice(j, 1);
                bullets.splice(i, 1);
                score += 2;
                playEnemyDeathSound();
                break;
            }
        }
    }
}

function drawLives() {
    for (let i = 0; i < 3; i++) {
        const x = 20 + i * 35;
        const y = 100;
        
        if (livesArray[i]) {
            ctx.fillStyle = '#e63946';
            ctx.beginPath();
            ctx.moveTo(x, y + 5);
            ctx.bezierCurveTo(x, y, x - 10, y, x - 10, y + 10);
            ctx.bezierCurveTo(x - 10, y + 18, x, y + 25, x, y + 28);
            ctx.bezierCurveTo(x, y + 25, x + 10, y + 18, x + 10, y + 10);
            ctx.bezierCurveTo(x + 10, y, x, y, x, y + 5);
            ctx.fill();
        } else {
            ctx.strokeStyle = '#888';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x, y + 5);
            ctx.bezierCurveTo(x, y, x - 10, y, x - 10, y + 10);
            ctx.bezierCurveTo(x - 10, y + 18, x, y + 25, x, y + 28);
            ctx.bezierCurveTo(x, y + 25, x + 10, y + 18, x + 10, y + 10);
            ctx.bezierCurveTo(x + 10, y, x, y, x, y + 5);
            ctx.stroke();
        }
    }
}

function drawScore() {
    ctx.fillStyle = currentTheme === 'cave' || currentTheme === 'volcanic' ? '#fff' : '#1d3557';
    ctx.font = 'bold 24px Courier New';
    ctx.fillText('Mynt: ' + score, 20, 40);
    ctx.fillText('Borð: ' + currentLevel, 20, 70);
    drawLives();
    
    if (DEBUG_MODE) {
        ctx.fillStyle = '#ff0000';
        ctx.font = '12px Courier New';
        ctx.textAlign = 'right';
        ctx.fillText('Leikmaður: x=' + Math.round(player.x) + ' y=' + Math.round(player.y) + ' vy=' + Math.round(player.velY), SCREEN_WIDTH - 10, SCREEN_HEIGHT - 25);
        if (debugInfo) {
            ctx.fillText(debugInfo, SCREEN_WIDTH - 10, SCREEN_HEIGHT - 10);
        }
        ctx.textAlign = 'left';
    }
}

function drawTitleScreen() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#e63946';
    ctx.font = 'bold 64px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('KALL', canvas.width / 2, canvas.height / 2 - 40);
    
    ctx.fillStyle = '#fff';
    ctx.font = '24px Courier New';
    ctx.fillText('Smelltu á skjáinn til að byrja', canvas.width / 2, canvas.height / 2 + 30);
    ctx.textAlign = 'left';
}

function drawGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#e63946';
    ctx.font = 'bold 48px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('LEIK LOKIÐ', canvas.width / 2, canvas.height / 2 - 20);
    
    ctx.fillStyle = '#fff';
    ctx.font = '24px Courier New';
    ctx.fillText('Mynt: ' + score, canvas.width / 2, canvas.height / 2 + 30);
    ctx.fillText('Smelltu á skjáinn til að byrja aftur', canvas.width / 2, canvas.height / 2 + 70);
    ctx.textAlign = 'left';
}

function drawWin() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#4ade80';
    ctx.font = 'bold 48px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('ÞÚ VANNST!', canvas.width / 2, canvas.height / 2 - 20);
    
    ctx.fillStyle = '#fff';
    ctx.font = '24px Courier New';
    ctx.fillText('Mynt: ' + score, canvas.width / 2, canvas.height / 2 + 30);
    ctx.fillText('Smelltu á R til að spila aftur', canvas.width / 2, canvas.height / 2 + 70);
    ctx.textAlign = 'left';
}

function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

function updateCamera() {
    const targetX = player.x - SCREEN_WIDTH / 3;
    cameraX += (targetX - cameraX) * 0.1;
    
    if (cameraX < 0) cameraX = 0;
    if (cameraX > WORLD_WIDTH - SCREEN_WIDTH) cameraX = WORLD_WIDTH - SCREEN_WIDTH;
}

function updatePlayer() {
    if (keys.left) {
        player.velX = -MOVE_SPEED;
        player.facingRight = false;
    } else if (keys.right) {
        player.velX = MOVE_SPEED;
        player.facingRight = true;
    } else {
        player.velX *= FRICTION;
    }

    if (shootCooldown > 0) shootCooldown--;
    
    if (keys.shoot && shootCooldown === 0) {
        const bulletX = player.facingRight ? player.x + player.width : player.x;
        bullets.push({
            x: bulletX,
            y: player.y + player.height / 2,
            velX: player.facingRight ? 12 : -12,
            width: 10,
            height: 10
        });
        shootCooldown = 15;
        playShootSound();
    }

    if (keys.jump && player.onGround) {
        player.velY = JUMP_FORCE;
        player.onGround = false;
        playJumpSound();
    }

    player.velY += GRAVITY;

    player.x += player.velX;
    player.y += player.velY;

    player.onGround = false;

    platforms.forEach(platform => {
        if (checkCollision(player, platform)) {
            if (player.velY > 0 && player.y + player.height - player.velY <= platform.y + 5) {
                player.y = platform.y - player.height;
                player.velY = 0;
                player.onGround = true;
            } else if (player.velY < 0 && player.y - player.velY >= platform.y + platform.height) {
                player.y = platform.y + platform.height;
                player.velY = 0;
            } else if (player.velX > 0) {
                player.x = platform.x - player.width;
                player.velX = 0;
            } else if (player.velX < 0) {
                player.x = platform.x + platform.width;
                player.velX = 0;
            }
        }
    });

    if (player.x < 0) player.x = 0;
    if (player.x + player.width > WORLD_WIDTH) player.x = WORLD_WIDTH - player.width;

    if (player.y > canvas.height) {
        if (!gameOver) {
            loseLife();
        }
    }

    if (checkCollision(player, {
        x: castle.doorX,
        y: castle.doorY,
        width: castle.doorWidth,
        height: castle.doorHeight
    })) {
        if (!gameWon && (!boss || boss.health <= 0)) {
            gameWon = true;
            score += 10;
            playWinSound();
        }
    }

    coins.forEach(coin => {
        if (!coin.collected && checkCollision(player, coin)) {
            coin.collected = true;
            score++;
            playCoinSound();
        }
    });
    
    lifePowerups.forEach(powerup => {
        if (!powerup.collected && checkCollision(player, powerup)) {
            powerup.collected = true;
            if (lives < 3) {
                lives++;
                livesArray[lives - 1] = true;
            } else {
                score += 5;
            }
        }
    });
}

function resetGame() {
    console.trace('resetGame CALLED');
    logEvent('resetGame() kallað');
    player.x = 100;
    player.y = 300;
    player.velX = 0;
    player.velY = 0;
    player.facingRight = true;
    score = 0;
    lives = 3;
    livesArray = [true, true, true];
    gameOver = false;
    gameWon = false;
    gameState = 'playing';
    cameraX = 0;
    bullets = [];
    shootCooldown = 0;
    debugInfo = '';
    generateWorld();
    logEvent('--- NÝR LEIKUR: Borð ' + currentLevel + ' ---');
}

function respawnPlayer() {
    let bestPlatform = null;
    let bestScore = Infinity;
    
    platforms.forEach(platform => {
        const platformCenterX = platform.x + platform.width / 2;
        
        if (platformCenterX < player.x + 100) {
            let hasNearbyEnemy = false;
            enemies.forEach(enemy => {
                if (Math.abs(enemy.x - platformCenterX) < 150) {
                    hasNearbyEnemy = true;
                }
            });
            
            if (!hasNearbyEnemy) {
                const score = player.x - platformCenterX;
                if (score >= 0 && score < bestScore) {
                    bestScore = score;
                    bestPlatform = platform;
                }
            }
        }
    });
    
    if (bestPlatform) {
        player.x = bestPlatform.x + bestPlatform.width / 2 - player.width / 2;
        player.y = bestPlatform.y - player.height;
    } else {
        player.x = 100;
        player.y = 300;
    }
    
    player.velX = 0;
    player.velY = 0;
    player.facingRight = true;
    cameraX = Math.max(0, player.x - 200);
    bullets = [];
}

function loseLife() {
    lives--;
    livesArray[lives] = false;
    createParticles(player.x + player.width / 2, player.y + player.height / 2, player.color, 25);
    
    if (lives <= 0) {
        playGameOverSound();
        gameOver = true;
    } else {
        playGameOverSound();
        setTimeout(() => {
            respawnPlayer();
        }, 500);
        gameOver = true;
        setTimeout(() => {
            gameOver = false;
        }, 600);
    }
}

function selectLevel(level) {
    currentLevel = level;
    resetGame();
    document.querySelectorAll('.level-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('level' + level).classList.add('active');
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameState === 'title') {
        drawBackground();
        drawTitleScreen();
    } else {
        drawBackground();
        drawDecorations();
        drawCastle();
        drawPlatforms();
        drawCoins();
        drawLifePowerups();
        drawEnemies();
        drawBoss();
        drawBullets();
        drawPlayer();
        drawParticles();
        drawScore();

        if (!gameOver && !gameWon) {
            updatePlayer();
            updateEnemies();
            updateBoss();
            updateBullets();
            updateParticles();
            updateCamera();
        } else if (gameWon) {
            drawWin();
        } else {
            drawGameOver();
        }
    }

    requestAnimationFrame(gameLoop);
}

document.addEventListener('keydown', (e) => {
    if (['w', 'W', ' ', 'a', 'A', 'd', 'D', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
    }
    if (e.key === 'a' || e.key === 'A') keys.left = true;
    if (e.key === 'd' || e.key === 'D') keys.right = true;
    if (e.key === 'w' || e.key === 'W' || e.key === ' ') keys.jump = true;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        keys.shoot = true;
        if (e.key === 'ArrowLeft') player.facingRight = false;
        if (e.key === 'ArrowRight') player.facingRight = true;
    }
    if (e.key === 'r' || e.key === 'R') {
        if (gameOver || gameWon) resetGame();
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'a' || e.key === 'A') keys.left = false;
    if (e.key === 'd' || e.key === 'D') keys.right = false;
    if (e.key === 'w' || e.key === 'W' || e.key === ' ') keys.jump = false;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        keys.shoot = false;
    }
});

function setupTouchControls() {
    const btnLeft = document.getElementById('btnLeft');
    const btnRight = document.getElementById('btnRight');
    const btnJump = document.getElementById('btnJump');
    const btnShoot = document.getElementById('btnShoot');
    
    if (!btnLeft || !btnRight || !btnJump || !btnShoot) return;
    
    const handleTouchStart = (e, key) => {
        e.preventDefault();
        keys[key] = true;
    };
    
    const handleTouchEnd = (e, key) => {
        e.preventDefault();
        keys[key] = false;
    };
    
    btnLeft.addEventListener('touchstart', (e) => handleTouchStart(e, 'left'), { passive: false });
    btnLeft.addEventListener('touchend', (e) => handleTouchEnd(e, 'left'), { passive: false });
    btnLeft.addEventListener('mousedown', (e) => { e.preventDefault(); keys.left = true; });
    btnLeft.addEventListener('mouseup', (e) => { e.preventDefault(); keys.left = false; });
    btnLeft.addEventListener('mouseleave', (e) => { e.preventDefault(); keys.left = false; });
    
    btnRight.addEventListener('touchstart', (e) => handleTouchStart(e, 'right'), { passive: false });
    btnRight.addEventListener('touchend', (e) => handleTouchEnd(e, 'right'), { passive: false });
    btnRight.addEventListener('mousedown', (e) => { e.preventDefault(); keys.right = true; });
    btnRight.addEventListener('mouseup', (e) => { e.preventDefault(); keys.right = false; });
    btnRight.addEventListener('mouseleave', (e) => { e.preventDefault(); keys.right = false; });
    
    btnJump.addEventListener('touchstart', (e) => handleTouchStart(e, 'jump'), { passive: false });
    btnJump.addEventListener('touchend', (e) => handleTouchEnd(e, 'jump'), { passive: false });
    btnJump.addEventListener('mousedown', (e) => { e.preventDefault(); keys.jump = true; });
    btnJump.addEventListener('mouseup', (e) => { e.preventDefault(); keys.jump = false; });
    btnJump.addEventListener('mouseleave', (e) => { e.preventDefault(); keys.jump = false; });
    
    btnShoot.addEventListener('touchstart', (e) => handleTouchStart(e, 'shoot'), { passive: false });
    btnShoot.addEventListener('touchend', (e) => handleTouchEnd(e, 'shoot'), { passive: false });
    btnShoot.addEventListener('mousedown', (e) => { e.preventDefault(); keys.shoot = true; });
    btnShoot.addEventListener('mouseup', (e) => { e.preventDefault(); keys.shoot = false; });
    btnShoot.addEventListener('mouseleave', (e) => { e.preventDefault(); keys.shoot = false; });
}

canvas.addEventListener('touchstart', (e) => {
    if (gameState === 'title') {
        gameState = 'playing';
        resetGame();
    } else if (gameOver || gameWon) {
        resetGame();
    }
});

canvas.addEventListener('click', (e) => {
    if (gameState === 'title') {
        gameState = 'playing';
        resetGame();
    } else if (gameOver || gameWon) {
        resetGame();
    }
});

setupTouchControls();

generateWorld();
gameLoop();
