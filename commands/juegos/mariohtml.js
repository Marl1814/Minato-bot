const path = require('path');
const { sendHtmlGame } = require(path.join(__dirname, '../../htmlTransport'));

function gameFrame(title, subtitle, body, script) {
    return `<style>
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}
html,body{margin:0;padding:0;width:100%;background:transparent;font-family:Arial,sans-serif;color:#f8fafc;touch-action:manipulation}
.gw{width:100%;max-width:620px;margin:auto;padding:8px}.head{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:7px}.title{font-weight:900;font-size:16px}.sub{font-size:9px;color:#94a3b8;margin-top:2px}.brand{font-size:8px;color:#64748b;text-align:center;margin-top:6px;letter-spacing:.7px}.panel{background:#0f172a;border:1px solid rgba(255,255,255,.14);border-radius:16px;padding:8px;overflow:hidden}.row{display:flex;gap:8px;margin-top:8px}.btn{flex:1;min-height:46px;border:1px solid rgba(255,255,255,.18);border-radius:12px;background:#1e293b;color:white;font-weight:800;font-size:13px;touch-action:none}.btn:active{filter:brightness(1.4);transform:scale(.97)}canvas{display:block;width:100%;height:auto;border-radius:12px;background:#5c94fc;touch-action:none}
</style><div class="gw"><div class="head"><div><div class="title">${title}</div><div class="sub">${subtitle}</div></div></div><div class="panel">${body}</div><div class="brand">GAMESWHATS · HTML MINI GAME</div></div><script>(function(){${script}})()</script>`;
}

function getGameHtml() {
    const body = `<canvas id="c" width="480" height="320"></canvas>
    <div class="row">
      <button class="btn" id="left">◀</button>
      <button class="btn" id="jump">SALTO</button>
      <button class="btn" id="right">▶</button>
    </div>`;

    const script = `
var c=document.getElementById('c'),x=c.getContext('2d'),W=480,H=320;
var cam=0,keys={l:0,r:0,j:0},score=0,coins=0,lives=3,time=400,frame=0,dead=false,win=false,level=1,big=false,inv=0;
var player={x:40,y:200,vx:0,vy:0,w:16,h:24,onGround:false};
var gravity=0.42,jumpF=-8.4,speed=2.8;
var ground=[],pipes=[],enemies=[],coinList=[],mushrooms=[],castleX=0;

function buildLevel(n){
  ground=[];pipes=[];enemies=[];coinList=[];mushrooms=[];
  // Suelo continuo (evitamos huecos mortales entre tubos)
  for(var i=0;i<110;i++) ground.push({x:i*32,y:288,w:32,h:32});

  if(n===1){
    ground.push({x:260,y:240,w:64,h:16},{x:360,y:200,w:48,h:16},{x:460,y:240,w:64,h:16});
    ground.push({x:600,y:180,w:80,h:16},{x:740,y:220,w:48,h:16},{x:880,y:160,w:96,h:16});
    ground.push({x:1050,y:200,w:64,h:16},{x:1180,y:160,w:80,h:16});
    pipes=[{x:220,y:224,w:32,h:64},{x:500,y:192,w:32,h:96},{x:800,y:208,w:32,h:80},{x:1100,y:176,w:32,h:112}];
    enemies=[
      {x:150,y:272,vx:-0.7,w:16,h:16,alive:true,type:'goomba',shell:false},
      {x:340,y:272,vx:-0.8,w:16,h:16,alive:true,type:'goomba',shell:false},
      {x:420,y:272,vx:-0.6,w:16,h:16,alive:true,type:'koopa',shell:false},
      {x:650,y:272,vx:-0.9,w:16,h:16,alive:true,type:'goomba',shell:false},
      {x:920,y:272,vx:-0.7,w:16,h:16,alive:true,type:'koopa',shell:false},
      {x:1150,y:272,vx:-0.8,w:16,h:16,alive:true,type:'goomba',shell:false}
    ];
    coinList=[{x:140,y:220,t:1},{x:170,y:200,t:1},{x:200,y:220,t:1},{x:300,y:180,t:1},{x:340,y:160,t:1},{x:400,y:170,t:1},{x:560,y:140,t:1},{x:640,y:130,t:1},{x:720,y:150,t:1},{x:900,y:120,t:1},{x:940,y:120,t:1},{x:1120,y:130,t:1}];
    mushrooms=[{x:380,y:160,vx:0.9,active:true}];
    castleX=1350;
  }
  if(n===2){
    ground.push({x:200,y:240,w:48,h:16},{x:280,y:200,w:48,h:16},{x:360,y:160,w:48,h:16},{x:480,y:200,w:64,h:16});
    ground.push({x:620,y:240,w:48,h:16},{x:720,y:180,w:80,h:16},{x:880,y:140,w:64,h:16},{x:1020,y:200,w:96,h:16});
    ground.push({x:1200,y:160,w:80,h:16},{x:1360,y:220,w:64,h:16});
    pipes=[{x:420,y:192,w:32,h:96},{x:800,y:160,w:32,h:128},{x:1150,y:176,w:32,h:112}];
    enemies=[
      {x:150,y:272,vx:-0.75,w:16,h:16,alive:true,type:'goomba',shell:false},
      {x:300,y:272,vx:-0.85,w:16,h:16,alive:true,type:'koopa',shell:false},
      {x:520,y:272,vx:-0.7,w:16,h:16,alive:true,type:'goomba',shell:false},
      {x:700,y:272,vx:-0.9,w:16,h:16,alive:true,type:'koopa',shell:false},
      {x:950,y:272,vx:-0.8,w:16,h:16,alive:true,type:'goomba',shell:false},
      {x:1100,y:272,vx:-0.75,w:16,h:16,alive:true,type:'koopa',shell:false},
      {x:1300,y:272,vx:-0.85,w:16,h:16,alive:true,type:'goomba',shell:false}
    ];
    coinList=[{x:220,y:180,t:1},{x:300,y:140,t:1},{x:380,y:120,t:1},{x:500,y:140,t:1},{x:640,y:180,t:1},{x:760,y:110,t:1},{x:920,y:100,t:1},{x:1060,y:140,t:1},{x:1240,y:120,t:1},{x:1380,y:160,t:1}];
    mushrooms=[{x:500,y:160,vx:1.0,active:true},{x:900,y:100,vx:-0.9,active:true}];
    castleX=1550;
  }
  if(n===3){
    ground.push({x:180,y:240,w:48,h:16},{x:260,y:200,w:48,h:16},{x:340,y:160,w:48,h:16},{x:420,y:120,w:48,h:16});
    ground.push({x:560,y:180,w:64,h:16},{x:700,y:140,w:48,h:16},{x:820,y:200,w:80,h:16},{x:980,y:150,w:64,h:16});
    ground.push({x:1120,y:110,w:48,h:16},{x:1240,y:180,w:96,h:16},{x:1440,y:140,w:80,h:16},{x:1600,y:200,w:64,h:16});
    pipes=[{x:500,y:160,w:32,h:128},{x:920,y:144,w:32,h:144},{x:1350,y:160,w:32,h:128}];
    enemies=[
      {x:140,y:272,vx:-0.8,w:16,h:16,alive:true,type:'goomba',shell:false},
      {x:280,y:272,vx:-0.9,w:16,h:16,alive:true,type:'koopa',shell:false},
      {x:450,y:272,vx:-0.75,w:16,h:16,alive:true,type:'goomba',shell:false},
      {x:640,y:272,vx:-0.85,w:16,h:16,alive:true,type:'koopa',shell:false},
      {x:800,y:272,vx:-0.95,w:16,h:16,alive:true,type:'goomba',shell:false},
      {x:1020,y:272,vx:-0.8,w:16,h:16,alive:true,type:'koopa',shell:false},
      {x:1220,y:272,vx:-0.9,w:16,h:16,alive:true,type:'goomba',shell:false},
      {x:1500,y:272,vx:-0.85,w:16,h:16,alive:true,type:'koopa',shell:false}
    ];
    coinList=[{x:200,y:180,t:1},{x:280,y:140,t:1},{x:360,y:100,t:1},{x:440,y:80,t:1},{x:600,y:120,t:1},{x:740,y:100,t:1},{x:880,y:140,t:1},{x:1040,y:90,t:1},{x:1160,y:70,t:1},{x:1300,y:120,t:1},{x:1480,y:100,t:1},{x:1650,y:140,t:1}];
    mushrooms=[{x:450,y:80,vx:1.1,active:true},{x:1000,y:110,vx:-1.0,active:true}];
    castleX=1850;
  }
}

function box(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y}

function hurt(){
  if(inv>0)return;
  if(big){big=false;player.h=24;inv=90;return;}
  lives--;
  if(lives<=0){dead=true;}
  else{player.x=40;player.y=200;player.vx=0;player.vy=0;cam=0;inv=120;}
}

function reset(){
  player={x:40,y:200,vx:0,vy:0,w:16,h:big?32:24,onGround:false};
  cam=0;time=400;frame=0;dead=false;win=false;inv=0;
  buildLevel(level);
}

function nextLevel(){
  level++;
  if(level>3){win=true;return;}
  big=false;reset();
}

function update(){
  if(dead||win)return;
  frame++;if(inv>0)inv--;
  if(frame%60===0)time--;
  if(time<=0){hurt();time=100;}

  if(keys.l)player.vx=-speed; else if(keys.r)player.vx=speed; else player.vx*=0.78;
  player.vy+=gravity;
  player.x+=player.vx; player.y+=player.vy;
  player.h=big?32:24;

  player.onGround=false;
  for(var i=0;i<ground.length;i++){
    var g=ground[i];
    if(box(player,g)&&player.vy>0&&player.y+player.h-player.vy<=g.y+6){
      player.y=g.y-player.h;player.vy=0;player.onGround=true;
    }
  }
  for(var i=0;i<pipes.length;i++){
    var p=pipes[i];
    if(box(player,p)){
      if(player.vy>0&&player.y+player.h-player.vy<=p.y+8){player.y=p.y-player.h;player.vy=0;player.onGround=true;}
      else{if(player.vx>0)player.x=p.x-player.w; if(player.vx<0)player.x=p.x+p.w;}
    }
  }

  cam=Math.max(0,player.x-160);

  // Hongos
  for(var i=mushrooms.length-1;i>=0;i--){
    var m=mushrooms[i];
    if(!m.active)continue;
    m.x+=m.vx;
    if(box(player,{x:m.x,y:m.y,w:16,h:16})){
      m.active=false; big=true; player.h=32; score+=1000;
    }
  }

  // Enemigos
  for(var i=0;i<enemies.length;i++){
    var e=enemies[i];
    if(!e.alive)continue;
    e.x+=e.vx;

    // Caparazón en movimiento
    if(e.shell&&Math.abs(e.vx)>1){
      for(var j=0;j<enemies.length;j++){
        if(i!==j&&enemies[j].alive&&box(e,enemies[j])){enemies[j].alive=false;score+=100;}
      }
    }

    if(box(player,e)){
      if(player.vy>0&&player.y+player.h-e.y<16){
        // Pisar
        if(e.type==='koopa'&&!e.shell){
          e.shell=true; e.vx=0; e.h=12; player.vy=-6.5; score+=100;
        }else if(e.shell){
          // Empujar caparazón
          e.vx = player.x<e.x ? 4.5 : -4.5;
          player.vy=-5;
        }else{
          e.alive=false; player.vy=-6.5; score+=100;
        }
      }else if(!(e.shell&&e.vx===0)){
        // Daño
        if(e.shell&&Math.abs(e.vx)>1){ // caparazón volador
          // también hace daño
        }
        hurt();
      }else if(e.shell&&e.vx===0){
        // Empujar caparazón quieto
        e.vx = player.x<e.x ? 4.2 : -4.2;
      }
    }
  }

  // Monedas
  for(var i=0;i<coinList.length;i++){
    var c=coinList[i];
    if(c.t&&box(player,{x:c.x,y:c.y,w:12,h:16})){
      c.t=0; coins++; score+=200;
      if(coins>=100){coins=0; if(lives<99)lives++;}
    }
  }

  // Castillo (meta)
  if(player.x>castleX){score+=time*10; nextLevel();}

  if(player.y>H+60)hurt();
}

function drawMario(px,py){
  if(inv>0&&frame%4<2)return;
  var h=big?32:24;
  x.fillStyle='#e52521'; x.fillRect(px+2,py+(big?12:8),12,big?14:10);
  x.fillStyle='#f0c0a0'; x.fillRect(px+3,py+(big?4:2),10,big?10:8);
  x.fillStyle='#e52521'; x.fillRect(px+2,py,12,big?5:4);
  x.fillStyle='#000'; x.fillRect(px+9,py+(big?7:4),2,2);
  x.fillStyle='#3d7af0'; x.fillRect(px+3,py+(big?18:12),10,big?10:8);
  x.fillStyle='#6b3e26'; x.fillRect(px+1,py+h-4,6,4); x.fillRect(px+9,py+h-4,6,4);
}

function draw(){
  x.fillStyle='#5c94fc';x.fillRect(0,0,W,H);
  x.fillStyle='#fff';
  x.beginPath();x.ellipse(100-cam*0.2,40,28,13,0,0,7);x.fill();
  x.beginPath();x.ellipse(320-cam*0.2,50,32,14,0,0,7);x.fill();
  x.beginPath();x.ellipse(600-cam*0.2,35,30,12,0,0,7);x.fill();
  x.fillStyle='#00a800';
  x.beginPath();x.ellipse(250-cam*0.35,290,70,25,0,0,7);x.fill();
  x.beginPath();x.ellipse(700-cam*0.35,295,80,22,0,0,7);x.fill();

  for(var i=0;i<ground.length;i++){
    var g=ground[i];
    x.fillStyle='#c84c0c';x.fillRect(g.x-cam,g.y,g.w,g.h);
    x.fillStyle='#f8c060';x.fillRect(g.x-cam,g.y,g.w,4);
  }
  for(var i=0;i<pipes.length;i++){
    var p=pipes[i];
    x.fillStyle='#00a800';x.fillRect(p.x-cam,p.y,p.w,p.h);
    x.fillStyle='#00d000';x.fillRect(p.x-cam-3,p.y,p.w+6,14);
  }

  // Hongos
  for(var i=0;i<mushrooms.length;i++){
    var m=mushrooms[i]; if(!m.active)continue;
    x.fillStyle='#e52521';x.fillRect(m.x-cam,m.y,16,10);
    x.fillStyle='#fff';x.fillRect(m.x-cam+3,m.y+2,4,4);x.fillRect(m.x-cam+9,m.y+2,4,4);
    x.fillStyle='#f0c0a0';x.fillRect(m.x-cam,m.y+10,16,6);
  }

  // Monedas
  x.fillStyle='#f8c060';
  for(var i=0;i<coinList.length;i++) if(coinList[i].t){x.beginPath();x.ellipse(coinList[i].x-cam+6,coinList[i].y+8,5,7,0,0,7);x.fill();}

  // Enemigos
  for(var i=0;i<enemies.length;i++){
    var e=enemies[i]; if(!e.alive)continue;
    if(e.type==='goomba'){
      x.fillStyle='#8b4513';x.fillRect(e.x-cam,e.y,16,16);
      x.fillStyle='#000';x.fillRect(e.x-cam+3,e.y+4,3,3);x.fillRect(e.x-cam+10,e.y+4,3,3);
    }else{
      // Koopa / caparazón
      if(e.shell){
        x.fillStyle='#2d8f2d';x.fillRect(e.x-cam,e.y+4,16,12);
        x.fillStyle='#1a5f1a';x.fillRect(e.x-cam+2,e.y+6,12,8);
      }else{
        x.fillStyle='#2d8f2d';x.fillRect(e.x-cam,e.y,16,16);
        x.fillStyle='#f0c0a0';x.fillRect(e.x-cam+4,e.y-6,8,8);
        x.fillStyle='#000';x.fillRect(e.x-cam+6,e.y-4,2,2);
      }
    }
  }

  // Castillo
  x.fillStyle='#6b3e26';x.fillRect(castleX-cam,180,70,108);
  x.fillStyle='#8b5a2b';x.fillRect(castleX-cam+10,140,50,40);
  x.fillStyle='#3d2b1f';x.fillRect(castleX-cam+25,220,20,68);
  x.fillStyle='#f8c060';x.fillRect(castleX-cam+5,170,15,15);x.fillRect(castleX-cam+50,170,15,15);

  drawMario(player.x-cam,player.y);

  // HUD
  x.fillStyle='#fff';x.font='bold 13px Arial';
  x.fillText('MARIO',10,16); x.fillText(String(score).padStart(6,'0'),10,32);
  x.fillText('×'+coins,120,32); x.fillText('WORLD 1-'+level,220,16);
  x.fillText('TIME',340,16); x.fillText(time,340,32);
  x.fillText('×'+lives,420,32);

  if(dead){
    x.fillStyle='rgba(0,0,0,0.72)';x.fillRect(0,0,W,H);
    x.fillStyle='#fff';x.font='bold 28px Arial';x.textAlign='center';
    x.fillText('GAME OVER',W/2,H/2-10);
    x.font='14px Arial';x.fillText('Toca SALTO para reiniciar',W/2,H/2+25);x.textAlign='left';
  }
  if(win){
    x.fillStyle='rgba(0,0,0,0.72)';x.fillRect(0,0,W,H);
    x.fillStyle='#f8c060';x.font='bold 24px Arial';x.textAlign='center';
    x.fillText('¡MUNDO COMPLETADO!',W/2,H/2-15);
    x.fillStyle='#fff';x.font='14px Arial';x.fillText('Puntos: '+score,W/2,H/2+15);
    x.fillText('Toca SALTO para reiniciar',W/2,H/2+40);x.textAlign='left';
  }
}

function loop(){update();draw();requestAnimationFrame(loop);}

function hold(id,key){
  var b=document.getElementById(id);
  b.onpointerdown=function(e){e.preventDefault();keys[key]=1;if(key==='j'&&(dead||win)){level=1;score=0;coins=0;lives=3;big=false;reset();}if(key==='j'&&player.onGround)player.vy=jumpF;};
  ['pointerup','pointerleave','pointercancel'].forEach(function(ev){b.addEventListener(ev,function(){keys[key]=0;});});
}
hold('left','l');hold('right','r');hold('jump','j');
c.onpointerdown=function(e){e.preventDefault();if(dead||win){level=1;score=0;coins=0;lives=3;big=false;reset();return;}if(player.onGround)player.vy=jumpF;};

reset();loop();
`;

    return gameFrame('SUPER MARIO', '1-1 · 1-2 · 1-3 + Hongo + Koopa', body, script);
}

module.exports = {
    name: 'mario',
    aliases: ['mario', 'supermario', 'mariobros'],
    category: 'juegos',
    description: 'Super Mario Bros completo con hongos, koopas, vidas y castillo',
    async execute({ Minato, m }) {
        try {
            const html = getGameHtml();
            await sendHtmlGame(Minato, m.chat, html, 'SUPER MARIO');
        } catch (err) {
            console.error('Error al enviar Mario:', err);
            await Minato.sendMessage(m.chat, {
                text: '❌ Tu versión de WhatsApp o cliente actual no soporta el renderizado interactivo de Meta AI.'
            }, { quoted: m.raw });
        }
    }
};
