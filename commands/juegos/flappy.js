const path = require('path');
const { sendHtmlGame } = require(path.join(__dirname, '../../htmlTransport'));

function gameFrame(title, subtitle, body, script) {
    return `<style>
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}
html,body{margin:0;padding:0;width:100%;background:transparent;font-family:Arial,sans-serif;color:#f8fafc;touch-action:manipulation}
.gw{width:100%;max-width:620px;margin:auto;padding:8px}.head{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:7px}.title{font-weight:900;font-size:16px}.sub{font-size:9px;color:#94a3b8;margin-top:2px}.brand{font-size:8px;color:#64748b;text-align:center;margin-top:6px;letter-spacing:.7px}.panel{background:#0f172a;border:1px solid rgba(255,255,255,.14);border-radius:16px;padding:8px;overflow:hidden}canvas{display:block;width:100%;height:auto;border-radius:12px;background:#70c5ce;touch-action:none}
</style><div class="gw"><div class="head"><div><div class="title">${title}</div><div class="sub">${subtitle}</div></div></div><div class="panel">${body}</div><div class="brand">GAMESWHATS · HTML MINI GAME</div></div><script>(function(){${script}})()</script>`;
}

function getGameHtml() {
    const body = `<canvas id="c" width="320" height="480"></canvas>`;

    const script = `
var c=document.getElementById('c'),x=c.getContext('2d'),W=320,H=480;
var bird,pipes,score,best=0,state='start',frame=0,grav=0.32,jump=-5.9,gap=118,speed=2.35,groundY=H-70;
function reset(){bird={x:70,y:200,vy:0,rot:0};pipes=[];score=0;state='start';frame=0}
function addPipe(){var top=70+Math.random()*(groundY-gap-140);pipes.push({x:W+10,top:top,bot:top+gap,w:52,passed:false})}
function flap(){if(state==='start'){state='play';bird.vy=jump;return}if(state==='dead'){reset();return}if(state==='play')bird.vy=jump}
function hit(){if(bird.y+12>groundY||bird.y-12<0)return true;for(var i=0;i<pipes.length;i++){var p=pipes[i];if(bird.x+14>p.x&&bird.x-10<p.x+p.w){if(bird.y-12<p.top||bird.y+12>p.bot)return true}}return false}
function update(){if(state!=='play')return;frame++;bird.vy+=grav;bird.y+=bird.vy;bird.rot=Math.min(Math.PI/2.2,Math.max(-0.6,bird.vy*0.08));if(frame%90===0)addPipe();for(var i=pipes.length-1;i>=0;i--){pipes[i].x-=speed;if(!pipes[i].passed&&pipes[i].x+pipes[i].w<bird.x){pipes[i].passed=true;score++}if(pipes[i].x<-60)pipes.splice(i,1)}if(hit()){state='dead';if(score>best)best=score}}
function drawBird(){x.save();x.translate(bird.x,bird.y);x.rotate(bird.rot);x.fillStyle='#f2d74e';x.beginPath();x.ellipse(0,0,15,12,0,0,7);x.fill();x.fillStyle='#fff';x.beginPath();x.arc(6,-3,5,0,7);x.fill();x.fillStyle='#000';x.beginPath();x.arc(8,-3,2.2,0,7);x.fill();x.fillStyle='#e05a3c';x.beginPath();x.moveTo(12,1);x.lineTo(22,0);x.lineTo(12,5);x.fill();x.fillStyle='#e8b84a';x.beginPath();x.ellipse(-6,2,7,5,0.3,0,7);x.fill();x.restore()}
function drawPipe(p){x.fillStyle='#73bf2e';x.fillRect(p.x,0,p.w,p.top);x.fillRect(p.x,p.bot,p.w,groundY-p.bot);x.fillStyle='#5aa01e';x.fillRect(p.x-3,p.top-22,p.w+6,22);x.fillRect(p.x-3,p.bot,p.w+6,22);x.fillStyle='#8fd63b';x.fillRect(p.x+4,0,8,p.top-22);x.fillRect(p.x+4,p.bot+22,8,groundY-p.bot-22)}
function draw(){x.fillStyle='#70c5ce';x.fillRect(0,0,W,H);x.fillStyle='#e8f4f8';for(var i=0;i<5;i++){x.beginPath();x.ellipse(40+i*70,90+Math.sin(i)*20,35,16,0,0,7);x.fill()}x.fillStyle='#5a9e4a';x.fillRect(0,groundY-25,W,30);x.fillStyle='#d4c28a';x.fillRect(0,groundY,W,H-groundY);x.fillStyle='#c4b07a';for(var i=0;i<W;i+=18)x.fillRect(i,groundY,10,6);for(var i=0;i<pipes.length;i++)drawPipe(pipes[i]);drawBird();x.fillStyle='#fff';x.strokeStyle='#000';x.lineWidth=3;x.font='bold 36px Arial';x.textAlign='center';if(state==='play'||state==='dead'){x.strokeText(score,W/2,70);x.fillText(score,W/2,70)}if(state==='start'){x.fillStyle='rgba(0,0,0,0.35)';x.fillRect(0,0,W,H);x.fillStyle='#fff';x.font='bold 28px Arial';x.fillText('FLAPPY BIRD',W/2,160);x.font='bold 15px Arial';x.fillText('Toca para empezar',W/2,210);x.font='13px Arial';x.fillText('Mejor: '+best,W/2,250)}if(state==='dead'){x.fillStyle='rgba(0,0,0,0.45)';x.fillRect(0,0,W,H);x.fillStyle='#fff';x.font='bold 26px Arial';x.fillText('GAME OVER',W/2,190);x.font='bold 16px Arial';x.fillText('Puntos: '+score,W/2,230);x.fillText('Mejor: '+best,W/2,255);x.font='13px Arial';x.fillText('Toca para reiniciar',W/2,295)}x.textAlign='left'}
function loop(){update();draw();requestAnimationFrame(loop)}
c.onpointerdown=function(e){e.preventDefault();flap()};
reset();loop();
`;

    return gameFrame('FLAPPY BIRD', 'CLÁSICO · TÁCTIL', body, script);
}

module.exports = {
    name: 'flappy',
    aliases: ['flappy', 'flappybird', 'bird'],
    category: 'juegos',
    description: 'Flappy Bird clásico con menú de inicio y controles 100% táctiles',
    async execute({ Minato, m }) {
        try {
            const html = getGameHtml();
            await sendHtmlGame(Minato, m.chat, html, 'FLAPPY BIRD');
        } catch (err) {
            console.error('Error al enviar Flappy Bird:', err);
            await Minato.sendMessage(m.chat, {
                text: '❌ Tu versión de WhatsApp o cliente actual no soporta el renderizado interactivo de Meta AI.'
            }, { quoted: m.raw });
        }
    }
};
