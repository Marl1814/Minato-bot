// Archivo: commands/juegos/doom.js
const { sendHtmlGame } = require('../../htmlTransport');

function getRealDoomHtml() {
    return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<style>
    * { box-sizing: border-box; margin: 0; padding: 0; user-select: none; -webkit-user-select: none; }
    body { background: #000; color: #fff; font-family: monospace; overflow: hidden; display: flex; flex-direction: column; align-items: center; height: 100vh; }
    
    #screen-container { position: relative; width: 100%; max-width: 400px; height: 240px; background: #000; margin-top: 5px; display: flex; justify-content: center; align-items: center; border: 2px solid #333; }
    canvas { width: 100%; height: 100%; image-rendering: pixelated; display: block; }
    
    #loading-box { position: absolute; width: 80%; text-align: center; color: #f00; font-weight: bold; font-size: 13px; z-index: 10; }
    .progress-bar-container { width: 100%; height: 14px; background: #222; border: 1px solid #555; border-radius: 7px; margin-top: 8px; overflow: hidden; }
    .progress-bar { width: 0%; height: 100%; background: linear-gradient(90deg, #800, #f00); transition: width 0.2s ease; }

    #controls { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; width: 100%; max-width: 360px; padding: 8px; margin-top: 4px; }
    .btn { background: #222; color: #fff; border: 1px solid #555; padding: 12px 0; font-weight: bold; border-radius: 6px; text-align: center; font-size: 14px; touch-action: manipulation; }
    .btn:active { background: #555; }
    .btn-fire { background: #800; border-color: #f00; color: #fff; grid-column: span 2; }
    .btn-action { background: #080; border-color: #0f0; color: #fff; grid-column: span 2; }
    .btn-enter { background: #880; border-color: #ff0; color: #000; grid-column: span 4; font-size: 13px; padding: 8px 0; }
</style>
</head>
<body>

<div id="screen-container">
    <div id="loading-box">
        <div id="status-text">CARGANDO RECURSOS (0%)...</div>
        <div class="progress-bar-container">
            <div id="progress-bar" class="progress-bar"></div>
        </div>
    </div>
    <canvas id="canvas" width="320" height="200"></canvas>
</div>

<div id="controls">
    <div class="btn btn-enter" id="btnEnter"> [ ENTER / START ] </div>
    
    <div></div><div class="btn" id="btnU">▲</div><div></div><div></div>
    <div class="btn" id="btnL">◄</div><div class="btn" id="btnD">▼</div><div class="btn" id="btnR">►</div><div></div>
    
    <div class="btn btn-fire" id="btnF">🔥 DISPARAR (CTRL)</div>
    <div class="btn btn-action" id="btnE">🚪 ABRIR (ESPACIO)</div>
</div>

<script type="module">
const progressBar = document.getElementById('progress-bar');
const statusText = document.getElementById('status-text');
const loadingBox = document.getElementById('loading-box');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

function updateProgress(percent, label) {
    progressBar.style.width = percent + '%';
    statusText.innerText = \`\${label} (\${percent}%)\`;
}

// Monitoreo simulado de descarga de recursos
let currentProgress = 10;
updateProgress(currentProgress, 'DESCARGANDO WASM');

const progressInterval = setInterval(() => {
    if (currentProgress < 85) {
        currentProgress += Math.floor(Math.random() * 10) + 5;
        if (currentProgress > 85) currentProgress = 85;
        updateProgress(currentProgress, currentProgress < 50 ? 'DESCARGANDO WASM' : 'CARGANDO ARCHIVO WAD');
    }
}, 250);

import { DOOM } from 'https://cdn.jsdelivr.net/npm/wasm-doom@1.0.4/+esm';

const game = new DOOM({
    screenWidth: 320,
    screenHeight: 200,
    wasmURL: 'https://cdn.jsdelivr.net/npm/wasm-doom@1.0.4/wasm/doom.wasm',
    onFrameRender: ({ screen }) => {
        if (loadingBox.style.display !== 'none') {
            clearInterval(progressInterval);
            updateProgress(100, '¡LISTO!');
            setTimeout(() => { loadingBox.style.display = 'none'; }, 300);
        }
        const frame = new ImageData(new Uint8ClampedArray(screen.buffer), 320, 200);
        ctx.putImageData(frame, 0, 0);
    }
});

await game.start();

// Controles táctiles
const keyMap = {
    'U': 'ArrowUp', 'D': 'ArrowDown', 'L': 'ArrowLeft', 'R': 'ArrowRight',
    'FIRE': 'Control', 'USE': ' ', 'ENTER': 'Enter'
};

function sendKey(keyName, isDown) {
    const code = keyMap[keyName];
    if (!code) return;
    const eventType = isDown ? 'keydown' : 'keyup';
    window.dispatchEvent(new KeyboardEvent(eventType, { key: code, code: code, bubbles: true }));
}

const bindTouch = (id, keyName) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('touchstart', (e) => { e.preventDefault(); sendKey(keyName, true); });
    el.addEventListener('touchend', (e) => { e.preventDefault(); sendKey(keyName, false); });
    el.addEventListener('mousedown', (e) => { e.preventDefault(); sendKey(keyName, true); });
    el.addEventListener('mouseup', (e) => { e.preventDefault(); sendKey(keyName, false); });
};

bindTouch('btnU', 'U'); bindTouch('btnD', 'D'); bindTouch('btnL', 'L'); bindTouch('btnR', 'R');
bindTouch('btnF', 'FIRE'); bindTouch('btnE', 'USE'); bindTouch('btnEnter', 'ENTER');
</script>

</body>
</html>`;
}

module.exports = {
    name: 'doom',
    aliases: ['doom3d', 'realdoom'],
    description: 'Ejecuta el DOOM original (1993) en WebAssembly.',
    async execute({ Minato, m }) {
        try {
            const html = getRealDoomHtml();
            await sendHtmlGame(Minato, m.chat, html, 'DOOM (1993) - Original Wasm');
        } catch (err) {
            console.error('Error al enviar DOOM Real:', err);
            await Minato.sendMessage(m.chat, { text: '❌ No se pudo inicializar el motor WASM de DOOM.' }, { quoted: m.raw });
        }
    }
};
