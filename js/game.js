'use strict';
/* =====================================================================
   Trognons & Donjons — game.js : logique du prototype du donjon
   Écran logique 360 x 640 en portrait, mis à l'échelle.
   ===================================================================== */
const W=360,H=640,T=32,COLS=11,ROWS=11,OX=4,OY=66,CTRL_Y=OY+ROWS*T+8;
const cv=document.getElementById('c'),cx=cv.getContext('2d');
let scale=1,offX=0,offY=0,dprNow=1;
function resize(){
  dprNow=Math.min(window.devicePixelRatio||1,3);
  const vw=innerWidth,vh=innerHeight;
  scale=Math.min(vw/W,vh/H);offX=(vw-W*scale)/2;offY=(vh-H*scale)/2;
  cv.width=Math.round(vw*dprNow);cv.height=Math.round(vh*dprNow);cv.style.width=vw+'px';cv.style.height=vh+'px';
}
addEventListener('resize',resize);resize();

/* ---------- petits outils ---------- */
const rnd=(a,b)=>a+Math.random()*(b-a), ri=(a,b)=>Math.floor(rnd(a,b+1)), pickR=a=>a[Math.floor(Math.random()*a.length)];
const clamp=(v,a,b)=>v<a?a:v>b?b:v, len=(x,y)=>Math.hypot(x,y);
function norm(x,y){const l=Math.hypot(x,y)||1;return{x:x/l,y:y/l}}

/* ---------- sauvegarde ---------- */
const SAVE_KEY='trognons-et-donjons-proto';
let save={fibres:0,eclats:0,oeufs:0,trognons:[],record:0};
try{Object.assign(save,JSON.parse(localStorage.getItem(SAVE_KEY)||'{}'))}catch(e){}
function writeSave(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(save))}catch(e){}}

/* ---------- sons (fabriqués par le jeu) ---------- */
let ac=null;
function audio(){if(!ac){try{ac=new (window.AudioContext||window.webkitAudioContext)()}catch(e){}}if(ac&&ac.state==='suspended')ac.resume()}
function tone(f,d,type='square',vol=.08,slide=0,delay=0){
  if(!ac)return;const t=ac.currentTime+delay,o=ac.createOscillator(),g=ac.createGain();
  o.type=type;o.frequency.setValueAtTime(f,t);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(30,f+slide),t+d);
  g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g).connect(ac.destination);o.start(t);o.stop(t+d+.02);
}
function noise(d,vol=.1,freq=1200){
  if(!ac)return;const n=Math.floor(ac.sampleRate*d),b=ac.createBuffer(1,n,ac.sampleRate),a=b.getChannelData(0);
  for(let i=0;i<n;i++)a[i]=(Math.random()*2-1)*(1-i/n);
  const s=ac.createBufferSource(),f=ac.createBiquadFilter(),g=ac.createGain();f.type='lowpass';f.frequency.value=freq;g.gain.value=vol;
  s.buffer=b;s.connect(f).connect(g).connect(ac.destination);s.start();
}
const SFX={
  swing:()=>noise(.09,.07,2600),
  hit:()=>{tone(220,.08,'square',.06,-120);noise(.06,.08,900)},
  hurt:()=>{tone(300,.25,'sawtooth',.07,-220)},
  pick:()=>tone(880,.07,'triangle',.07,300),
  coin:()=>{tone(988,.06,'triangle',.06);tone(1319,.1,'triangle',.06,0,.06)},
  roll:()=>noise(.12,.05,700),
  fire:()=>{tone(180,.25,'sawtooth',.05,260);noise(.2,.05,1800)},
  stun:()=>{tone(660,.1,'sine',.08);tone(520,.1,'sine',.08,0,.1);tone(660,.15,'sine',.08,0,.2)},
  capture:()=>{[523,659,784,1047].forEach((f,i)=>tone(f,.16,'triangle',.08,0,i*.08))},
  door:()=>tone(330,.12,'triangle',.06,120),
  clear:()=>{[392,523,659].forEach((f,i)=>tone(f,.18,'triangle',.07,0,i*.09))},
  egg:()=>{[659,784,988,1319].forEach((f,i)=>tone(f,.2,'sine',.08,0,i*.1))},
  shoot:()=>tone(500,.08,'square',.035,-200),
  ko:()=>{[392,330,262,196].forEach((f,i)=>tone(f,.25,'triangle',.08,0,i*.15))},
};

/* ---------- entrées : clavier + écran tactile ---------- */
const keys={};
const input={mx:0,my:0,atk:false,roll:false,pow:false};
addEventListener('keydown',e=>{keys[e.code]=true;audio();
  if(e.code==='KeyJ'||e.code==='Space')input.atk=true;
  if(e.code==='KeyK'||e.code==='ShiftLeft')input.roll=true;
  if(e.code==='KeyL')input.pow=true;});
addEventListener('keyup',e=>{keys[e.code]=false});
const BTN={atk:{x:294,y:CTRL_Y+100,r:40},roll:{x:212,y:CTRL_Y+158,r:27},pow:{x:208,y:CTRL_Y+62,r:27}};
const joy={id:null,bx:0,by:0,x:0,y:0};
const pressed={};const btnDown={atk:0,roll:0,pow:0};
function toLogical(e){return{x:(e.clientX-offX)/scale,y:(e.clientY-offY)/scale}}
cv.addEventListener('pointerdown',e=>{
  audio();const p=toLogical(e);try{cv.setPointerCapture(e.pointerId)}catch(_){}
  for(const k in BTN){const b=BTN[k];if(len(p.x-b.x,p.y-b.y)<b.r+14){input[k]=true;pressed[e.pointerId]=k;btnDown[k]=.12;return}}
  if(p.x<180&&p.y>OY){joy.id=e.pointerId;joy.bx=p.x;joy.by=Math.max(p.y,CTRL_Y+50);joy.x=p.x;joy.y=p.y}
});
cv.addEventListener('pointermove',e=>{if(e.pointerId===joy.id){const p=toLogical(e);joy.x=p.x;joy.y=p.y}});
function up(e){if(e.pointerId===joy.id)joy.id=null;delete pressed[e.pointerId]}
cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
function readMove(){
  let x=0,y=0;
  if(keys.KeyA||keys.ArrowLeft||keys.KeyQ)x-=1;if(keys.KeyD||keys.ArrowRight)x+=1;
  if(keys.KeyW||keys.ArrowUp||keys.KeyZ)y-=1;if(keys.KeyS||keys.ArrowDown)y+=1;
  if(joy.id!==null){const dx=joy.x-joy.bx,dy=joy.y-joy.by,l=len(dx,dy);if(l>6){const m=Math.min(1,l/40);x=dx/l*m;y=dy/l*m}}
  const l=len(x,y);if(l>1){x/=l;y/=l}
  input.mx=x;input.my=y;
}

/* ---------- les espèces (futurs trognons) ---------- */
const SPECIES={
  glouton:{nom:'Glouton',hp:3,r:11,col:'#b48ce0'},
  epineux:{nom:'Épineux',hp:2,r:11,col:'#7fbf5a'},
  bourdon:{nom:'Bourdon',hp:2,r:9,col:'#ffcf4d'},
};

/* ---------- génération d'un étage ---------- */
const TEMPLATES=[
  [],
  [[2,2],[2,8],[8,2],[8,8]],
  [[3,3],[3,4],[4,3],[3,7],[3,6],[4,7],[7,3],[6,3],[7,4],[7,7],[7,6],[6,7]],
  [[3,2],[3,3],[3,4],[3,6],[3,7],[3,8],[7,2],[7,3],[7,4],[7,6],[7,7],[7,8]],
  [[2,4],[4,8],[6,2],[8,6],[3,6],[7,3]],
  [[2,2],[2,3],[3,2],[2,8],[2,7],[3,8],[8,2],[8,3],[7,2],[8,8],[8,7],[7,8]],
  [[4,4],[4,6],[6,4],[6,6]],
];
const DIRS={n:[0,-1],s:[0,1],w:[-1,0],e:[1,0]},OPP={n:'s',s:'n',w:'e',e:'w'};
let floorN=1,rooms={},cur=null,run=null;

function genFloor(){
  rooms={};const key=(x,y)=>x+','+y;const seed=Math.floor(Math.random()*1e9);
  const want=6+Math.min(4,floorN);
  const list=[[2,2]];rooms[key(2,2)]={gx:2,gy:2};
  let guard=0;
  while(list.length<want&&guard++<500){
    const [x,y]=pickR(list),d=pickR(Object.values(DIRS)),nx=x+d[0],ny=y+d[1];
    if(nx<0||ny<0||nx>4||ny>4||rooms[key(nx,ny)])continue;
    let nb=0;for(const dd of Object.values(DIRS))if(rooms[key(nx+dd[0],ny+dd[1])])nb++;
    if(nb>1&&Math.random()<.7)continue;
    rooms[key(nx,ny)]={gx:nx,gy:ny};list.push([nx,ny]);
  }
  const dist={};dist[key(2,2)]=0;const q=[[2,2]];
  while(q.length){const [x,y]=q.shift();for(const d of Object.values(DIRS)){const k=key(x+d[0],y+d[1]);if(rooms[k]&&dist[k]===undefined){dist[k]=dist[key(x,y)]+1;q.push([x+d[0],y+d[1]])}}}
  let far=key(2,2);for(const k in dist)if(dist[k]>dist[far])far=k;
  const others=Object.keys(rooms).filter(k=>k!==far&&k!==key(2,2));
  const eggRoom=Math.random()<.6?pickR(others):null;
  const chestRooms=new Set(others.filter(k=>k!==eggRoom&&Math.random()<.3));
  for(const k in rooms){
    const r=rooms[k];r.key=k;r.seed=seed;r.seen=false;r.cleared=false;r.openT=0;r.start=k===key(2,2);r.exit=k===far;
    r.egg=k===eggRoom;r.chest=chestRooms.has(k);r.doors={};
    for(const n in DIRS){const d=DIRS[n];if(rooms[key(r.gx+d[0],r.gy+d[1])])r.doors[n]=key(r.gx+d[0],r.gy+d[1])}
    r.grid=[];for(let y=0;y<ROWS;y++){r.grid.push([]);for(let x=0;x<COLS;x++)r.grid[y].push(x===0||y===0||x===COLS-1||y===ROWS-1?1:0)}
    if(!r.start&&!r.exit){for(const [cy,cxx] of pickR(TEMPLATES))r.grid[cy][cxx]=2}
    r.enemies=null;r.loot=[];r.cache=null;
  }
  return rooms[key(2,2)];
}

/* ---------- entités ---------- */
let hero,buddy,shots=[],parts=[],floats=[],motes=[],shake=0,fade=0,banner=null,msg=null,clock=0;
function newHero(){return{x:5.5*T,y:6.5*T,r:10,fx:0,fy:1,hp:6,max:6,inv:0,atk:0,atkDone:false,roll:0,rollCd:0,rollA:0,walk:0,moving:false,kx:0,ky:0,blinkT:2,blink:false}}
function newBuddy(){return{x:hero.x+16,y:hero.y-6,cd:0,squash:0,spark:0}}
function initMotes(){motes=[];for(let i=0;i<16;i++)motes.push({x:rnd(30,320),y:rnd(30,320),vx:rnd(-4,4),vy:rnd(-6,-1),ph:Math.random()*6,s:rnd(.6,1.4)})}

function spawnEnemies(r){
  r.enemies=[];if(r.start)return;
  const n=r.exit?2+Math.min(3,floorN):ri(2,3)+Math.min(2,floorN-1);
  let auraLeft=Math.random()<.55?1:0;
  const types=floorN===1?['glouton','glouton','epineux','bourdon']:['glouton','epineux','bourdon','bourdon'];
  for(let i=0;i<n;i++){
    let tx,ty,g=0;
    do{tx=ri(1,9);ty=ri(1,9);g++}while(g<200&&(r.grid[ty][tx]!==0||len((tx+.5)*T-hero.x,(ty+.5)*T-hero.y)<3.2*T));
    const t=pickR(types),s=SPECIES[t],hp=s.hp+(floorN>2?1:0);
    const e={t,x:(tx+.5)*T,y:(ty+.5)*T,r:s.r,hp,max:hp,st:'idle',tm:rnd(.3,1.2),flash:0,
      aura:false,stun:false,stunT:0,dead:false,ph:Math.random()*6,sq:0,kx:0,ky:0,dx:0,dy:0,bloom:0,hopT:0};
    if(auraLeft>0){e.aura=true;auraLeft--}
    r.enemies.push(e);
  }
}

/* ---------- collisions ---------- */
function solidAt(tx,ty,forHero){
  if(tx<0||ty<0||tx>=COLS||ty>=ROWS)return!forHero;
  const v=cur.grid[ty][tx];if(v===0)return false;
  if(v===1&&forHero&&cur.cleared){
    if(tx===5&&ty===0&&cur.doors.n)return false;if(tx===5&&ty===ROWS-1&&cur.doors.s)return false;
    if(ty===5&&tx===0&&cur.doors.w)return false;if(ty===5&&tx===COLS-1&&cur.doors.e)return false;
  }
  return true;
}
function hits(x,y,r,forHero){
  const x0=Math.floor((x-r)/T),x1=Math.floor((x+r)/T),y0=Math.floor((y-r)/T),y1=Math.floor((y+r)/T);
  for(let ty=y0;ty<=y1;ty++)for(let tx=x0;tx<=x1;tx++){
    if(!solidAt(tx,ty,forHero))continue;
    const nx=clamp(x,tx*T,tx*T+T),ny=clamp(y,ty*T,ty*T+T);if(len(x-nx,y-ny)<r)return true;
  }
  return false;
}
function moveBody(b,dx,dy,forHero){
  let bx=false,by=false;
  if(!hits(b.x+dx,b.y,b.r,forHero))b.x+=dx;else bx=true;
  if(!hits(b.x,b.y+dy,b.r,forHero))b.y+=dy;else by=true;
  return{bx,by};
}

/* ---------- effets ---------- */
function burst(x,y,col,n=8,sp=90,life=.45,o={}){for(let i=0;i<n;i++){const a=Math.random()*6.283,s=rnd(sp*.4,sp);parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s+(o.up||0),life:life*rnd(.7,1.2),max:life,col,r:rnd(1.4,3.4)*(o.size||1),glow:!!o.glow,grav:o.grav||0})}}
function floatText(x,y,txt,col='#4a3324'){floats.push({x,y,txt,col,t:0})}
function say(t,d=2.2){msg={t,d}}

/* ---------- butin ---------- */
function drop(x,y,kind,n=1){for(let i=0;i<n;i++){const a=Math.random()*6.283,s=rnd(40,90);cur.loot.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,kind,t:0})}}
function collect(l){
  if(l.kind==='fibre'){run.fibres++;SFX.pick();burst(l.x,l.y,'#9bd47a',5,40,.3)}
  else if(l.kind==='eclat'){run.eclats++;SFX.coin();burst(l.x,l.y,'#ffe27a',6,50,.35,{glow:true})}
  else if(l.kind==='coeur'){hero.hp=Math.min(hero.max,hero.hp+2);SFX.pick();floatText(hero.x,hero.y-26,'+1 ♥','#e2574a')}
  else if(l.kind==='oeuf'){run.oeufs++;SFX.egg();say('Un œuf ! Il éclora au refuge.');burst(l.x,l.y,'#fff3c4',18,120,.6,{glow:true})}
}

/* ---------- une descente ---------- */
function startRun(keepFloor){
  if(!keepFloor){floorN=1;run={fibres:0,eclats:0,oeufs:0,trognons:[]}}
  hero=hero&&keepFloor?Object.assign(hero,{x:5.5*T,y:6.5*T,inv:0,atk:0,roll:0}):newHero();
  buddy=newBuddy();
  cur=genFloor();shots=[];parts=[];floats=[];initMotes();
  enterRoom(cur,null);
  banner={t:'Les Racines · étage '+floorN,d:2.2};
  state='play';hideOv();
}
function enterRoom(r,from){
  cur=r;shots=[];r.seen=true;
  if(from){
    const d=OPP[from];
    if(d==='n'){hero.x=5.5*T;hero.y=1.5*T}if(d==='s'){hero.x=5.5*T;hero.y=(ROWS-1.5)*T}
    if(d==='w'){hero.x=1.5*T;hero.y=5.5*T}if(d==='e'){hero.x=(COLS-1.5)*T;hero.y=5.5*T}
  }
  if(buddy){buddy.x=hero.x+14;buddy.y=hero.y-8}
  if(!r.cache)r.cache=renderRoomCanvas(r,COLS,ROWS,T);
  if(!r.enemies)spawnEnemies(r);
  if(r.enemies.filter(e=>!e.dead&&!e.stun).length===0&&!r.cleared){r.cleared=true;r.openT=1;onClear(r,true)}
  fade=.28;
}
function onClear(r,silent){
  if(!silent){SFX.clear();if(r.chest)say('Un coffre est apparu !')}
  if(r.chest&&!r.chestObj){r.chestObj={x:5.5*T,y:5.5*T,open:false};if(!silent)burst(5.5*T,5.5*T,'#fff3c4',14,90,.6,{glow:true})}
  if(r.egg&&!r.eggTaken){r.loot.push({x:5.5*T,y:4.6*T,vx:0,vy:0,kind:'oeuf',t:0,still:true});r.eggTaken=true}
  if(r.exit&&!r.portal)r.portal={x:5.5*T,y:4.5*T,t:0};
}

/* ---------- mise à jour ---------- */
let state='title',last=performance.now();
function update(dt){
  clock+=dt;readMove();
  for(const k in btnDown)btnDown[k]=Math.max(0,btnDown[k]-dt);
  for(const m of motes){m.ph+=dt;m.x+=m.vx*dt+Math.sin(m.ph)*4*dt;m.y+=m.vy*dt;if(m.y<20){m.y=330;m.x=rnd(30,320)}if(m.x<20)m.x=330;if(m.x>335)m.x=25}
  if(buddy){buddy.squash=Math.max(0,buddy.squash-dt*4)}
  if(hero){hero.blinkT-=dt;if(hero.blinkT<0){hero.blink=true;if(hero.blinkT<-.12){hero.blink=false;hero.blinkT=rnd(2,4.5)}}}
  if(state!=='play'){input.atk=input.roll=input.pow=false;updParts(dt);return}
  const h=hero;
  h.inv=Math.max(0,h.inv-dt);h.rollCd=Math.max(0,h.rollCd-dt);buddy.cd=Math.max(0,buddy.cd-dt);
  if(banner){banner.d-=dt;if(banner.d<=0)banner=null}
  if(msg){msg.d-=dt;if(msg.d<=0)msg=null}
  fade=Math.max(0,fade-dt);shake=Math.max(0,shake-dt*30);
  if(cur.cleared)cur.openT=Math.min(1,cur.openT+dt*2.2);

  const near=cur.enemies.find(e=>e.stun&&!e.dead&&len(e.x-h.x,e.y-h.y)<36);
  BTN.atk.mode=near?'heart':'sword';

  if(input.atk){
    if(near){capture(near)}
    else if(h.atk<=0&&h.roll<=0){h.atk=.24;h.atkDone=false;SFX.swing()}
  }
  if(input.roll&&h.roll<=0&&h.rollCd<=0&&h.atk<=0){
    const d=(input.mx||input.my)?norm(input.mx,input.my):{x:h.fx,y:h.fy};
    h.fx=d.x;h.fy=d.y;h.roll=.28;h.rollCd=.75;SFX.roll();burst(h.x,h.y+8,'#d8c3a0',8,55,.35);
  }
  aimT=findTarget();
  if(input.pow&&buddy.cd<=0){
    buddy.cd=3.5;buddy.squash=1;SFX.fire();
    const d=aimT?norm(aimT.x-buddy.x,aimT.y-buddy.y):{x:h.fx,y:h.fy};
    shots.push({x:buddy.x,y:buddy.y,vx:d.x*240,vy:d.y*240,r:7,friend:true,dmg:2,life:1.6,t:0,target:aimT});
    burst(buddy.x,buddy.y,'#ffb347',8,70,.35,{glow:true});
  }
  input.atk=input.roll=input.pow=false;

  let mvx=0,mvy=0;
  if(h.roll>0){h.roll-=dt;mvx=h.fx*250;mvy=h.fy*250;(h.trail=h.trail||[]).push({x:h.x,y:h.y,p:1-h.roll/.28});if(h.trail.length>5)h.trail.shift();h.rollA=(1-h.roll/.28)*Math.PI*2*(h.fx<0?-1:1);h.moving=false;if(Math.random()<.5)burst(h.x,h.y+9,'#d8c3a0',1,20,.3)}
  else{
    h.rollA=0;h.trail=[];const sp=h.atk>0?55:118;mvx=input.mx*sp;mvy=input.my*sp;
    h.moving=!!(input.mx||input.my);
    if(h.moving){const d=norm(input.mx,input.my);if(h.atk<=0){h.fx=d.x;h.fy=d.y}h.walk+=dt*11*len(input.mx,input.my);if(Math.random()<dt*6)burst(h.x,h.y+9,'rgba(200,170,130,.8)',1,15,.35)}
  }
  h.kx*=Math.pow(.001,dt);h.ky*=Math.pow(.001,dt);
  moveBody(h,(mvx+h.kx)*dt,(mvy+h.ky)*dt,true);

  if(h.atk>0){
    h.atk-=dt;
    if(!h.atkDone&&h.atk<.18){h.atkDone=true;
      const px=h.x+h.fx*16,py=h.y+h.fy*16;
      for(const e of cur.enemies){if(e.dead||e.stun)continue;if(len(e.x-px,e.y-py)<e.r+20)damage(e,1,h.fx,h.fy)}
    }
  }

  if(cur.cleared){
    let dir=null;
    if(h.y<10&&cur.doors.n)dir='n';else if(h.y>ROWS*T-10&&cur.doors.s)dir='s';
    else if(h.x<10&&cur.doors.w)dir='w';else if(h.x>COLS*T-10&&cur.doors.e)dir='e';
    if(dir){SFX.door();enterRoom(rooms[cur.doors[dir]],dir);return}
  }

  // compagnon : flotte à côté du héros
  const side=h.fx<0?1:-1,tx=h.x+side*15-h.fx*6,ty=h.y-10-h.fy*8;
  buddy.x+=(tx-buddy.x)*Math.min(1,dt*5);buddy.y+=(ty-buddy.y)*Math.min(1,dt*5);
  buddy.spark-=dt;if(buddy.spark<0){buddy.spark=rnd(.08,.2);parts.push({x:buddy.x+rnd(-4,4),y:buddy.y-10,vx:rnd(-8,8),vy:rnd(-30,-15),life:.6,max:.6,col:pickR(['#ffd27a','#ff9a4a','#fff1b0']),r:rnd(.8,1.6),glow:true,grav:0})}

  for(const e of cur.enemies){if(!e.dead)updEnemy(e,dt)}
  if(!cur.cleared&&cur.enemies.every(e=>e.dead||e.stun)){cur.cleared=true;onClear(cur,false)}

  for(const s of shots){
    if(s.target&&!s.target.dead&&!s.target.stun){const d=norm(s.target.x-s.x,s.target.y-s.y);const k=Math.min(1,dt*7);s.vx+=(d.x*240-s.vx)*k;s.vy+=(d.y*240-s.vy)*k}
    s.x+=s.vx*dt;s.y+=s.vy*dt;s.life-=dt;s.t+=dt;
    if(s.friend&&Math.random()<.8)parts.push({x:s.x,y:s.y,vx:rnd(-15,15)-s.vx*.1,vy:rnd(-15,15)-s.vy*.1,life:.3,max:.3,col:pickR(['#ffd27a','#ff8a3a','#ffb347']),r:rnd(1.2,2.6),glow:true,grav:0});
    if(hits(s.x,s.y,3,false)){s.life=0;burst(s.x,s.y,s.friend?'#ffb347':'#9bd27f',7,70,.35,{glow:s.friend})}
    if(s.friend){for(const e of cur.enemies){if(!e.dead&&!e.stun&&len(e.x-s.x,e.y-s.y)<e.r+s.r){const n=norm(s.vx,s.vy);damage(e,s.dmg,n.x,n.y);s.life=0;burst(s.x,s.y,'#ffb36b',12,100,.45,{glow:true});break}}}
    else if(len(h.x-s.x,h.y-s.y)<h.r+s.r){hurtHero(1,s.vx,s.vy);s.life=0}
  }
  shots=shots.filter(s=>s.life>0);

  for(const l of cur.loot){
    l.t+=dt;
    if(!l.still){l.x+=l.vx*dt;l.y+=l.vy*dt;l.vx*=Math.pow(.02,dt);l.vy*=Math.pow(.02,dt);if(hits(l.x,l.y,4,false)){l.vx*=-.5;l.vy*=-.5}}
    const d=len(h.x-l.x,h.y-l.y);
    if(l.t>.35&&d<70&&l.kind!=='oeuf'){const n=norm(h.x-l.x,h.y-l.y);l.x+=n.x*260*dt;l.y+=n.y*260*dt}
    if(l.t>.3&&d<h.r+9){l.got=true;collect(l)}
  }
  cur.loot=cur.loot.filter(l=>!l.got);

  const c=cur.chestObj;
  if(c&&!c.open&&len(h.x-c.x,h.y-c.y)<26){c.open=true;SFX.coin();burst(c.x,c.y-6,'#ffd86b',20,130,.6,{glow:true});drop(c.x,c.y,'eclat',ri(4,7));drop(c.x,c.y,'fibre',ri(2,4));if(Math.random()<.4)drop(c.x,c.y,'coeur')}
  if(cur.portal){const p=cur.portal;p.t+=dt;if(Math.random()<dt*14)parts.push({x:p.x+rnd(-12,12),y:p.y+rnd(-4,4),vx:rnd(-4,4),vy:rnd(-30,-15),life:.9,max:.9,col:pickR(['#cbb8ff','#ffffff','#9f86f0']),r:rnd(.8,1.8),glow:true,grav:0});
    if(len(h.x-p.x,h.y-p.y)<18)showPortal()}
  updParts(dt);
}
function updParts(dt){
  for(const p of parts){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=Math.pow(.08,dt);p.vy=p.vy*Math.pow(.08,dt)+p.grav*dt;p.life-=dt}
  parts=parts.filter(p=>p.life>0);
  for(const f of floats){f.t+=dt;f.y-=24*dt}floats=floats.filter(f=>f.t<1);
}

// cible du souffle : l'ennemi le plus proche, avec une préférence pour celui qu'on regarde
let aimT=null;
function findTarget(){
  let best=null,bs=1e9;
  for(const e of cur.enemies){if(e.dead||e.stun)continue;const dx=e.x-hero.x,dy=e.y-hero.y,d=len(dx,dy);if(d>270)continue;
    const dot=(dx*hero.fx+dy*hero.fy)/(d||1),sc=d*(1.35-.45*dot);if(sc<bs){bs=sc;best=e}}
  return best;
}
function damage(e,n,dx,dy){
  e.hp-=n;e.flash=.13;e.kx=dx*190;e.ky=dy*190;SFX.hit();shake=4;burst(e.x,e.y,SPECIES[e.t].col,8,90);
  if(e.hp<=0){
    if(e.aura){e.hp=0;e.stun=true;e.st='stun';SFX.stun();floatText(e.x,e.y-26,'Assommé !','#e2774a');say('Approche-toi et appuie sur ♥ pour le sauver !',3)}
    else{e.dead=true;burst(e.x,e.y,SPECIES[e.t].col,16,130,.6);burst(e.x,e.y,'#ffffff',6,60,.3,{glow:true});drop(e.x,e.y,'fibre',ri(1,2));if(Math.random()<.6)drop(e.x,e.y,'eclat',ri(1,2));if(Math.random()<.12)drop(e.x,e.y,'coeur')}
  }
}
function capture(e){
  e.dead=true;SFX.capture();burst(e.x,e.y,'#ffd86b',24,150,.9,{glow:true});burst(e.x,e.y,'#ffffff',12,100,.7,{glow:true});
  run.trognons.push(e.t);floatText(e.x,e.y-26,'Trognon sauvé !','#e2774a');say(SPECIES[e.t].nom+' rejoindra ton refuge.',2.5);
}
function hurtHero(n,dx,dy){
  const h=hero;if(h.inv>0||h.roll>0)return;
  h.hp-=n;h.inv=1;const d=norm(dx,dy);h.kx=d.x*260;h.ky=d.y*260;SFX.hurt();shake=7;burst(h.x,h.y,'#e2574a',12,110);
  if(h.hp<=0)ko();
}
function updEnemy(e,dt){
  const h=hero;
  e.flash=Math.max(0,e.flash-dt);e.ph+=dt;e.sq=Math.max(0,e.sq-dt*3);e.bloom=Math.max(0,e.bloom-dt*1.5);
  e.kx*=Math.pow(.002,dt);e.ky*=Math.pow(.002,dt);
  if(e.stun){e.stunT+=dt;moveBody(e,e.kx*dt,e.ky*dt,false);return}
  const toH=norm(h.x-e.x,h.y-e.y),dH=len(h.x-e.x,h.y-e.y);
  let vx=0,vy=0;e.tm-=dt;
  if(e.t==='glouton'){
    if(e.st==='idle'){if(e.tm<=0){e.st='hop';e.tm=.38;e.dx=toH.x+rnd(-.35,.35);e.dy=toH.y+rnd(-.35,.35);e.sq=1}}
    else{vx=e.dx*150;vy=e.dy*150;if(e.tm<=0){e.st='idle';e.tm=rnd(.5,1.1);e.sq=.8;burst(e.x,e.y+10,'rgba(200,170,130,.9)',4,30,.3)}}
  }else if(e.t==='epineux'){
    if(e.tm<=0){e.tm=rnd(1.8,2.6);SFX.shoot();e.sq=1;e.bloom=1;shots.push({x:e.x,y:e.y-10,vx:toH.x*125,vy:toH.y*125,r:5,friend:false,life:3,t:0})}
    if(!e.dx||Math.random()<dt*.5){const a=Math.random()*6.283;e.dx=Math.cos(a);e.dy=Math.sin(a)}vx=e.dx*20;vy=e.dy*20;
  }else if(e.t==='bourdon'){
    if(e.st==='idle'){
      if(!e.dx||Math.random()<dt*.8){const a=Math.random()*6.283;e.dx=Math.cos(a);e.dy=Math.sin(a)}vx=e.dx*55;vy=e.dy*55;
      if(e.tm<=0&&dH<170){e.st='aim';e.tm=.6;e.dx=toH.x;e.dy=toH.y}
    }else if(e.st==='aim'){if(e.tm<=0){e.st='dash';e.tm=.45}}
    else if(e.st==='dash'){vx=e.dx*245;vy=e.dy*245;if(Math.random()<.6)burst(e.x,e.y,'rgba(255,240,200,.8)',1,10,.25);if(e.tm<=0){e.st='idle';e.tm=rnd(1.2,2)}}
  }
  const r=moveBody(e,(vx+e.kx)*dt,(vy+e.ky)*dt,false);
  if(r.bx)e.dx=-e.dx;if(r.by)e.dy=-e.dy;
  if(dH<e.r+h.r-2)hurtHero(1,-toH.x,-toH.y);
  for(const o of cur.enemies){if(o===e||o.dead)continue;const d=len(o.x-e.x,o.y-e.y);if(d<e.r+o.r&&d>0){const n=norm(e.x-o.x,e.y-o.y);moveBody(e,n.x*30*dt,n.y*30*dt,false)}}
}

/* ---------- écrans ---------- */
const ov=document.getElementById('ov'),card=document.getElementById('card');
function hideOv(){ov.className='hide'}
function showOv(html,btns,cls=''){
  card.innerHTML=html;card.className='card '+cls;ov.className=cls==='title'?'titleov':'';
  for(const b of btns){const el=document.createElement('button');el.textContent=b.l;if(b.alt)el.className='alt';el.onclick=()=>{audio();b.f()};card.appendChild(el)}
  ov.classList.remove('hide');
}
function lootLine(r){return `<div class="loot"><span><i class="ic fibre"></i>${r.fibres}</span><span><i class="ic eclat"></i>${r.eclats}</span><span><i class="ic oeuf"></i>${r.oeufs}</span><span><i class="ic trognon"></i>${r.trognons.length}</span></div>`}
function bank(){save.fibres+=run.fibres;save.eclats+=run.eclats;save.oeufs+=run.oeufs;save.trognons.push(...run.trognons);save.record=Math.max(save.record,floorN);writeSave()}
function demoScene(){
  floorN=1;hero=newHero();hero.y=6.2*T;buddy=newBuddy();cur=genFloor();cur.seen=true;cur.cache=renderRoomCanvas(cur,COLS,ROWS,T);cur.enemies=[];cur.cleared=true;cur.openT=1;
  initMotes();run={fibres:0,eclats:0,oeufs:0,trognons:[]};
}
function showTitle(){
  state='title';demoScene();
  showOv(`<div class="logo"><span class="l1">Trognons</span><span class="amp">&amp;</span><span class="l2">Donjons</span></div>
  <p class="small">Prototype du donjon</p>
  <p>Descends dans les Racines, ramasse du butin et <b>sauve les créatures dorées</b> : assomme-les, puis appuie sur ♥ à côté d'elles.</p>
  <p class="small">Clavier : flèches ou ZQSD, J attaque, K roulade, L souffle de Braisou.</p>
  ${save.trognons.length+save.eclats>0?`<p class="small">Au refuge : ${save.eclats} éclats · ${save.oeufs} œufs · ${save.trognons.length} trognons</p>`:''}`,
  [{l:'Descendre',f:()=>startRun(false)}],'title');
}
function showPortal(){
  if(state!=='play')return;state='portal';
  showOv(`<h2>Fin de l'étage ${floorN}</h2><p>Rentre au refuge avec ton butin, ou descends plus bas : plus de butin, plus de danger.</p>${lootLine(run)}`,
  [{l:'Descendre à l\'étage '+(floorN+1),f:()=>{floorN++;startRun(true)}},
   {l:'Rentrer au refuge',alt:true,f:()=>{bank();showHome('De retour au refuge !')}}]);
  hero.y+=26;
}
function ko(){
  state='ko';SFX.ko();
  run.fibres=Math.floor(run.fibres/2);run.eclats=Math.floor(run.eclats/2);
  setTimeout(()=>showOv(`<h2>K.O. !</h2><p>Braisou te ramène au refuge. Tu perds la moitié du butin de la descente, mais tes œufs et tes trognons sont saufs.</p>${lootLine(run)}`,
  [{l:'Rentrer',f:()=>{bank();showHome('Repose-toi bien…')}}]),800);
}
function showHome(t){
  state='home';
  const counts={};for(const k of save.trognons)counts[k]=(counts[k]||0)+1;
  const list=Object.keys(counts).map(k=>`${SPECIES[k].nom} ×${counts[k]}`).join(' · ')||'aucun pour l\'instant';
  showOv(`<h2>${t}</h2><div class="loot"><span><i class="ic fibre"></i>${save.fibres}</span><span><i class="ic eclat"></i>${save.eclats}</span><span><i class="ic oeuf"></i>${save.oeufs}</span></div>
  <p><b>Trognons sauvés :</b> ${list}</p><p class="small">Étage le plus profond : ${save.record}. Le refuge arrive à l'étape suivante.</p>`,
  [{l:'Nouvelle descente',f:()=>startRun(false)}]);
}

/* ---------- dessin ---------- */
function drawWorld(){
  const Wp=COLS*T,Hp=ROWS*T;
  G.save();G.translate(OX+(Math.random()-.5)*shake,OY+(Math.random()-.5)*shake);
  G.save();bp();rrect(0,0,Wp,Hp,10);G.clip();
  G.drawImage(cur.cache,0,0,Wp,Hp);
  for(const d of['n','s','w','e'])if(cur.doors[d])drawGate(d,cur.openT,Wp,Hp,T);
  if(cur.portal)drawPortalArt(cur.portal.x,cur.portal.y,cur.portal.t);
  // objets et personnages triés par profondeur
  const L=[];
  if(cur.chestObj){const c=cur.chestObj;L.push({y:c.y,f:()=>drawChestArt(c.x,c.y+6,c.open,clock)})}
  for(const l of cur.loot){const b=Math.sin(l.t*6)*1.6;
    L.push({y:l.y,f:()=>{if(l.kind==='fibre')drawFibreArt(l.x,l.y,b);else if(l.kind==='eclat')drawEclatArt(l.x,l.y,b,clock+l.x);else if(l.kind==='coeur')drawHeartArt(l.x,l.y,b);else drawEggArt(l.x,l.y+6,b,clock)}})}
  for(const e of cur.enemies)if(!e.dead)L.push({y:e.y,f:()=>drawEnemy(e)});
  if(state==='play'&&aimT&&buddy&&buddy.cd<=0&&!aimT.dead)drawTargetMark(aimT.x,aimT.y+(aimT.t==='bourdon'?7:9),clock);
  if(hero)L.push({y:hero.y,f:drawHero});
  if(buddy)L.push({y:buddy.y+12,f:()=>drawBraisouArt(buddy.x,buddy.y+Math.sin(clock*3)*2,clock,buddy.squash,aimT&&!aimT.dead?norm(aimT.x-buddy.x,aimT.y-buddy.y):{x:hero.fx,y:hero.fy},'normal')});
  L.sort((a,b)=>a.y-b.y).forEach(o=>o.f());
  drawLabels();
  for(const s of shots){if(s.friend)drawFireballArt(s.x,s.y,s.vx,s.vy,s.t);else{shadowE(s.x,s.y+8,3.5,1.3,.2);drawSeedArt(s.x,s.y,s.t)}}
  // particules
  for(const p of parts){const a=Math.max(0,p.life/p.max);
    if(p.glow){G.save();G.globalCompositeOperation='lighter';G.globalAlpha=a;dot(p.x,p.y,p.r*2.2,hexA(p.col,.25));dot(p.x,p.y,p.r,p.col);G.restore()}
    else{G.globalAlpha=a;dot(p.x,p.y,p.r,p.col);G.globalAlpha=1}}
  // poussières lumineuses
  G.save();G.globalCompositeOperation='lighter';for(const m of motes){const a=.25+.25*Math.sin(m.ph*2);dot(m.x,m.y,2.6*m.s,`rgba(255,236,170,${a*.25})`);dot(m.x,m.y,.9*m.s,`rgba(255,246,200,${a})`)}G.restore();
  drawAmbience(cur,Wp,Hp,clock);
  for(const f of floats){G.globalAlpha=Math.min(1,(1-f.t)*2);text(f.txt,f.x,f.y,12,f.col,'center',700,'#fff8ec')}G.globalAlpha=1;
  G.restore();
  if(fade>0){G.fillStyle=`rgba(30,18,12,${fade/.28*.9})`;bp();rrect(0,0,Wp,Hp,10);G.fill()}
  bp();rrect(0,0,Wp,Hp,10);st('#3a2418',2.5);
  G.restore();
}
function hexA(c,a){if(c[0]!=='#')return c;const n=parseInt(c.slice(1),16);return`rgba(${n>>16},${(n>>8)&255},${n&255},${a})`}
function drawHero(){
  const h=hero;if(h.inv>0&&Math.floor(h.inv*14)%2===0&&state==='play')return;
  FLASH=false;
  const behind=h.atk>0&&h.fy<-.5;
  if(h.atk>0&&behind)drawSwordSwing(h.x,h.y-8,Math.atan2(h.fy,h.fx),1-h.atk/.24);
  if(h.roll>0){
    (h.trail||[]).forEach((t,i)=>{if(i%2)return;G.save();G.globalAlpha=.12+i*.05;drawHeroRollArt(t.x,t.y+9,t.p,h.fx,h.fy,true);G.restore()});
    drawHeroRollArt(h.x,h.y+9,1-h.roll/.28,h.fx,h.fy,false);return}
  drawHeroArt(h.x,h.y+9,{fx:h.fx,fy:h.fy,walk:h.walk,moving:h.moving,t:clock,blink:h.blink,roll:h.roll,rollA:h.rollA});
  if(h.atk>0&&!behind)drawSwordSwing(h.x,h.y-8,Math.atan2(h.fy,h.fx),1-h.atk/.24);
}
function drawEnemy(e){
  const toH=norm(hero.x-e.x,hero.y-e.y);
  if(e.aura)drawAura(e.x,e.y-4,e.r,e.ph);
  let mode=e.stun?'dizzy':'normal';if(e.t==='bourdon'&&(e.st==='aim'||e.st==='dash'))mode='angry';
  if(e.t==='bourdon'&&e.st==='aim')drawAimLine(e.x,e.y-6,e.dx,e.dy,1-e.tm/.6);
  FLASH=e.flash>0;
  const o={t:e.ph,look:{x:toH.x,y:toH.y},mode,sq:e.sq,hop:e.st==='hop'?Math.sin((1-e.tm/.38)*Math.PI):0,bloom:e.bloom};
  if(e.t==='glouton')drawGloutonArt(e.x,e.y+10,o);
  else if(e.t==='epineux')drawEpineuxArt(e.x,e.y+10,o);
  else{const jit=e.st==='aim'?Math.sin(e.ph*60)*1.2:0;drawBourdonArt(e.x+jit,e.y-6,o)}
  FLASH=false;
  if(e.t==='bourdon'&&e.st==='aim')drawBubble(e.x,e.y-24,'!');
  if(e.stun)drawStunStars(e.x,e.y-24,e.stunT);
}
function drawLabels(){
  for(const e of cur.enemies){if(e.dead||!e.stun||len(hero.x-e.x,hero.y-e.y)>=36)continue;
    const y=e.y-38+Math.sin(clock*6)*1.5;bp();rrect(e.x-25,y-10,50,16,8);fs('#e2574a','#7a1f18',1.1);text('♥ Sauver',e.x,y+2,10,'#fff','center',700)}
}
function drawHud(){
  panel(6,6,W-12,52,14);
  for(let i=0;i<hero.max/2;i++){const v=clamp((hero.hp-i*2)/2,0,1);drawHudHeart(22+i*23,24,8.2,v)}
  const items=[['fibre',run.fibres],['eclat',run.eclats],['oeuf',run.oeufs],['trognon',run.trognons.length]];
  items.forEach(([k,n],i)=>{const x=18+i*44;drawIcon(k,x,44,clock);text(String(n),x+9,48,12.5,'#4a3324','left',700)});
  // ruban d'étage
  const rx=196,ry=14;bp();G.moveTo(rx,ry);G.lineTo(rx+96,ry);G.lineTo(rx+90,ry+11);G.lineTo(rx+96,ry+22);G.lineTo(rx,ry+22);G.lineTo(rx+6,ry+11);G.closePath();fs(lg(0,ry,0,ry+22,[[0,'#7fbf5a'],[1,'#4f8a45']]),'#24432a',1.1);
  text('Racines · '+floorN,rx+48,ry+15.5,11,'#ffffff','center',700,'#2f5a2a');
  // mini-carte
  const mx=W-60,my=13,s=8.4;
  bp();rrect(mx-4,my-4,s*5+8,s*5+8,6);G.fillStyle='rgba(201,166,118,.25)';G.fill();
  for(const k in rooms){const r=rooms[k];const vis=r.seen||Object.values(r.doors).some(d=>rooms[d].seen);if(!vis)continue;
    bp();rrect(mx+r.gx*s+.8,my+r.gy*s+.8,s-1.6,s-1.6,2.4);G.fillStyle=r===cur?'#e2774a':r.seen?'#c4a77a':'rgba(196,167,122,.35)';G.fill();
    if(r===cur){bp();rrect(mx+r.gx*s+.8,my+r.gy*s+.8,s-1.6,s-1.6,2.4);st('#7a3a1a',.9)}
    if(r.exit&&r.seen)dot(mx+r.gx*s+s/2,my+r.gy*s+s/2,1.8,'#8f74d9')}
}
function drawControls(){
  drawControlPad(W,H+200,CTRL_Y);
  const bx=joy.id!==null?joy.bx:84,by=joy.id!==null?joy.by:CTRL_Y+112;
  let kx=bx,ky=by;if(joy.id!==null){const dx=joy.x-bx,dy=joy.y-by,l=len(dx,dy),m=Math.min(l,40);if(l>0){kx=bx+dx/l*m;ky=by+dy/l*m}}
  drawJoystickArt(bx,by,kx,ky,joy.id!==null);
  const heart=BTN.atk.mode==='heart';
  drawButtonArt(BTN.atk,heart?'#e2574a':'#e8804f',heart?'#9a2e26':'#a8502c',heart?'heart':'sword',0,btnDown.atk>0,clock);
  drawButtonArt(BTN.pow,'#ff9a4a','#b5592a','flame',buddy?buddy.cd/3.5:0,btnDown.pow>0,clock);
  drawButtonArt(BTN.roll,'#7fb36a','#4f7f3e','roll',hero?hero.rollCd/.75:0,btnDown.roll>0,clock);
  text('Souffle',BTN.pow.x,BTN.pow.y-BTN.pow.r-7,10.5,'#7a5a3a','center',600);
  text('Roulade',BTN.roll.x,BTN.roll.y+BTN.roll.r+16,10.5,'#7a5a3a','center',600);
}
function drawBanner(){
  if(banner){const a=Math.min(1,banner.d*2),y=OY+120;G.globalAlpha=a;
    bp();G.moveTo(44,y);G.lineTo(316,y);G.lineTo(304,y+22);G.lineTo(316,y+44);G.lineTo(44,y+44);G.lineTo(56,y+22);G.closePath();fs(lg(0,y,0,y+44,[[0,'#fff6e2'],[1,'#f0dcb6']]),'#8a6a48',1.6);
    text(banner.t,180,y+29,19,'#e2774a','center',700,'#fff8ec');G.globalAlpha=1}
  if(msg){const a=Math.min(1,msg.d*2);G.globalAlpha=a;G.font='600 12.5px Fredoka, sans-serif';const w=Math.min(344,G.measureText(msg.t).width+26),y=OY+ROWS*T-40;
    bp();rrect(180-w/2,y,w,28,14);fs('rgba(58,38,30,.88)','#2a1a14',1);text(msg.t,180,y+18.5,12.5,'#fff8ec','center',600);G.globalAlpha=1}
}
function render(){
  G=cx;const d=dprNow;
  cx.setTransform(1,0,0,1,0,0);cx.fillStyle='#d9bd8f';cx.fillRect(0,0,cv.width,cv.height);
  cx.setTransform(d*scale,0,0,d*scale,d*offX,d*offY);
  // fond au-dessus de la zone de jeu
  cx.fillStyle='#ecdcbf';cx.fillRect(-offX/scale,-offY/scale,W+2*offX/scale,CTRL_Y+offY/scale);
  if(cur){drawWorld();if(state!=='title')drawHud();drawBanner()}
  drawControls();
}
function loop(now){
  const dt=Math.min(.033,(now-last)/1000);last=now;
  update(dt);render();requestAnimationFrame(loop);
}
window.__g={get hero(){return hero},get cur(){return cur},get rooms(){return rooms},get state(){return state},get run(){return run},input,startRun,damage,capture};
(document.fonts&&document.fonts.load?document.fonts.load('600 16px Fredoka'):Promise.resolve()).catch(()=>{}).then(()=>{showTitle();requestAnimationFrame(loop)});
