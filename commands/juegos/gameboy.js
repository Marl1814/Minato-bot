// Archivo: commands/juegos/gameboy.js
const { sendHtmlGame } = require('../../htmlTransport');

function getGameBoyHtml() {
    return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<style>
    * { box-sizing: border-box; margin: 0; padding: 0; user-select: none; -webkit-user-select: none; }
    body { background: #111; color: #fff; font-family: monospace; overflow: hidden; display: flex; flex-direction: column; align-items: center; height: 100vh; }
    
    #gb-housing { background: #8e8d89; border-radius: 12px 12px 25px 12px; padding: 10px; width: 100%; max-width: 360px; margin-top: 5px; border: 2px solid #555; }
    #screen-border { background: #5d5d67; border-radius: 8px 8px 20px 8px; padding: 8px 12px; display: flex; flex-direction: column; align-items: center; }
    #battery-title { color: #888; font-size: 9px; align-self: flex-start; margin-bottom: 4px; }
    
    #screen-container { position: relative; width: 160px; height: 144px; background: #9bbc0f; border: 2px solid #0f380f; transform: scale(1.5); transform-origin: top center; margin-bottom: 60px; }
    canvas { width: 100%; height: 100%; image-rendering: pixelated; display: block; background: #9bbc0f; }

    #controls { display: grid; grid-template-columns: repeat(6, 1fr); gap: 4px; width: 100%; max-width: 340px; padding: 4px; margin-top: 5px; }
    .btn { background: #333; color: #fff; border: 1px solid #666; font-weight: bold; border-radius: 6px; text-align: center; font-size: 13px; padding: 10px 0; touch-action: manipulation; }
    .btn:active { background: #666; }
    .btn-dpad { background: #222; }
    .btn-action { background: #8a1739; border-color: #ba1e4d; border-radius: 50%; width: 42px; height: 42px; line-height: 22px; justify-self: center; }
    .btn-meta { background: #555; font-size: 10px; padding: 6px 0; grid-column: span 3; margin-top: 4px; border-radius: 12px; }
</style>
</head>
<body>

<div id="gb-housing">
    <div id="screen-border">
        <div id="battery-title">● POWER / GAMEOVER</div>
        <div id="screen-container">
            <canvas id="canvas" width="160" height="144"></canvas>
        </div>
    </div>
</div>

<div id="controls">
    <div></div><div class="btn btn-dpad" id="btnU">▲</div><div></div>
    <div class="btn btn-action" id="btnB">B</div><div></div><div class="btn btn-action" id="btnA">A</div>
    
    <div class="btn btn-dpad" id="btnL">◄</div><div class="btn btn-dpad" id="btnD">▼</div><div class="btn btn-dpad" id="btnR">►</div>
    <div></div><div></div><div></div>
    
    <div class="btn btn-meta" id="btnSelect">SELECT</div>
    <div class="btn btn-meta" id="btnStart">START</div>
</div>

<script>
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Paleta Monocromática de Game Boy Original
const PALETTE = {
    DARKEST: '#0f380f',
    DARK: '#306230',
    LIGHT: '#8bac0f',
    LIGHTEST: '#9bbc0f'
};

// Estado del Jugador (Mario Style)
let mario = {
    x: 20, y: 100,
    vx: 0, vy: 0,
    width: 8, height: 12,
    grounded: false,
    score: 0
};

// Plataformas del Nivel
const platforms = [
    { x: 0, y: 128, w: 160, h: 16 },
    { x: 40, y: 95, w: 32, h: 8 },
    { x: 90, y: 75, w: 40, h: 8 },
    { x: 20, y: 55, w: 32, h: 8 }
];

// Monedas
let coins = [
    { x: 52, y: 80, collected: false },
    { x: 105, y: 60, collected: false },
    { x: 32, y: 40, collected: false }
];

let keys = {};

function update() {
    // Física
    if (keys['L']) mario.vx = -1.5;
    else if (keys['R']) mario.vx = 1.5;
    else mario.vx = 0;

    if (keys['A'] && mario.grounded) {
        mario.vy = -4.2;
        mario.grounded = false;
    }

    mario.vy += 0.25; // Gravedad

    mario.x += mario.vx;
    mario.y += mario.vy;

    // Colisiones con paredes
    if (mario.x < 0) mario.x = 0;
    if (mario.x > 160 - mario.width) mario.x = 160 - mario.width;

    // Colisiones con plataformas
    mario.grounded = false;
    platforms.forEach(p => {
        if (mario.x < p.x + p.w &&
            mario.x + mario.width > p.x &&
            mario.y + mario.height >= p.y &&
            mario.y + mario.height <= p.y + p.h &&
            mario.vy >= 0) {
            mario.y = p.y - mario.height;
            mario.vy = 0;
            mario.grounded = true;
        }
    });

    // Recolección de Monedas
    coins.forEach(c => {
        if (!c.collected &&
            mario.x < c.x + 6 &&
            mario.x + mario.width > c.x &&
            mario.y < c.y + 6 &&
            mario.y + mario.height > c.y) {
            c.collected = true;
            mario.score += 100;
        }
    });
}

function render() {
    // Fondo GameBoy
    ctx.fillStyle = PALETTE.LIGHTEST;
    ctx.fillRect(0, 0, 160, 144);

    // Dibujar Plataformas
    ctx.fillStyle = PALETTE.DARKEST;
    platforms.forEach(p => {
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.fillStyle = PALETTE.DARK;
        ctx.fillRect(p.x, p.y, p.w, 2);
        ctx.fillStyle = PALETTE.DARKEST;
    });

    // Dibujar Monedas
    coins.forEach(c => {
        if (!c.collected) {
            ctx.fillStyle = PALETTE.DARK;
            ctx.fillRect(c.x, c.y, 6, 6);
            ctx.fillStyle = PALETTE.LIGHT;
            ctx.fillRect(c.x + 1, c.y + 1, 4, 4);
        }
    });

    // Dibujar Mario Pixel-Art
    ctx.fillStyle = PALETTE.DARKEST;
    ctx.fillRect(mario.x, mario.y, mario.width, mario.height); // Cuerpo
    ctx.fillStyle = PALETTE.LIGHT;
    ctx.fillRect(mario.x + 2, mario.y + 2, 4, 3); // Cara

    // HUD (Puntuación)
    ctx.fillStyle = PALETTE.DARKEST;
    ctx.font = '8px monospace';
    ctx.fillText('MARIO 00' + mario.score, 4, 10);
    ctx.fillText('WORLD 1-1', 100, 10);
}

function loop() {
    update();
    render();
    requestAnimationFrame(loop);
}

// Bucle iniciado
loop();

// Mapeo de Botones Táctiles
const bindBtn = (id, key) => {
    const el = document.getElementById(id);
    if (!el) return;
    const press = (e) => { e.preventDefault(); keys[key] = true; };
    const release = (e) => { e.preventDefault(); keys[key] = false; };
    
    el.addEventListener('touchstart', press);
    el.addEventListener('touchend', release);
    el.addEventListener('mousedown', press);
    el.addEventListener('mouseup', release);
};

bindBtn('btnL', 'L');
bindBtn('btnR', 'R');
bindBtn('btnA', 'A');
bindBtn('btnB', 'A');
</script>

</body>
</html>`;
}

module.exports = {
    name: 'gameboy',
    aliases: ['gb', 'marioboy'],
    description: 'Ejecuta un juego de Game Boy en vivo sin dependencias externas.',
    async execute({ Minato, m }) {
        try {
            const html = getGameBoyHtml();
            await sendHtmlGame(Minato, m.chat, html, 'Super Mario Land - Game Boy');
        } catch (err) {
            console.error('Error al enviar Game Boy:', err);
            await Minato.sendMessage(m.chat, { text: '❌ No se pudo iniciar el juego de Game Boy.' }, { quoted: m.raw });
        }
    }
};
