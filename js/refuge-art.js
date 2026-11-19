'use strict';
/* =====================================================================
   Trognons & Donjons — refuge-art.js
   Le décor du refuge (pré-rendu une fois) et sa vie (papillons, mare,
   feuilles qui tombent, trognons qui dorment).
   ===================================================================== */

/* ---------- outils de courbe ---------- */
function bezPt(p,t){const u=1-t;return[u*u*u*p[0]+3*u*u*t*p[2]+3*u*t*t*p[4]+t*t*t*p[6],u*u*u*p[1]+3*u*u*t*p[3]+3*u*t*t*p[5]+t*t*t*p[7]]}
function bezNorm(p,t){const a=bezPt(p,Math.max(0,t-.01)),b=bezPt(p,Math.min(1,t+.01)),dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy)||1;return[-dy/l,dx/l]}
const GRASS=['#5e9a3e','#6fab48','#82bb56','#4f8a36','#93c763'];

/* ---------- sol ---------- */
function refugeGround(R,pick){
  G.fillStyle=lg(0,0,W,H,[[0,'#8fc05c'],[.5,'#89b856'],[1,'#7aab4c']]);G.fillRect(0,0,W,H);
  for(let i=0;i<26;i++){const x=R()*W,y=R()*H,r=30+R()*60;bp();ci(x,y,r);G.fillStyle=rg(x,y,0,r,[[0,R()<.5?'rgba(170,210,110,.28)':'rgba(70,120,40,.22)'],[1,'rgba(0,0,0,0)']]);G.fill()}
  for(let i=0;i<4200;i++){const x=R()*W,y=R()*H,l=2+R()*3.4,a=-Math.PI/2+(R()-.5)*.9;bp();G.moveTo(x,y);G.lineTo(x+Math.cos(a)*l,y+Math.sin(a)*l);st(pick(['rgba(60,110,35,.4)','rgba(150,200,95,.45)','rgba(85,140,50,.35)','rgba(185,220,120,.35)']),.75)}
  // touffes et parterres de fleurs
  for(let i=0;i<60;i++)grassTuft(R()*W,70+R()*(H-90),R);
  for(let i=0;i<16;i++){const fx=20+R()*(W-40),fy=110+R()*(H-160),c=pick(['#f4a6b8','#fff6c8','#b9a6f0','#ffffff','#ffd36a']);
    for(let k=0;k<7;k++){const x=fx+(R()-.5)*18,y=fy+(R()-.5)*10;bp();G.moveTo(x,y+3);G.lineTo(x,y);st('#4f8a36',.7);for(let j=0;j<5;j++){const a=j*TAU/5;dot(x+Math.cos(a)*1.4,y+Math.sin(a)*1.4,1.05,c)}dot(x,y,.7,'#f0b83a')}}
  for(let i=0;i<30;i++)clover(R()*W,80+R()*(H-100));
}
/* ---------- sentier de terre avec pas japonais ---------- */
function trail(p,w,R,pick,stones){
  bp();G.moveTo(p[0],p[1]);G.bezierCurveTo(p[2],p[3],p[4],p[5],p[6],p[7]);
  st('rgba(70,50,25,.22)',w+7);st('#b48c58',w+2);st('#cba06a',w);st('rgba(222,190,140,.55)',w-9);
  for(let i=0;i<w*9;i++){const t=R(),[x,y]=bezPt(p,t),[nx,ny]=bezNorm(p,t),o=(R()-.5)*w*.85;G.fillStyle=pick(['rgba(120,84,48,.35)','rgba(240,215,170,.4)','rgba(150,110,65,.3)']);G.fillRect(x+nx*o,y+ny*o,1+R()*1.4,1+R()*1.2)}
  for(let i=0;i<w*1.2;i++){const t=R(),[x,y]=bezPt(p,t),[nx,ny]=bezNorm(p,t),o=(R()-.5)*w*.7;pebbles(x+nx*o,y+ny*o,R)}
  if(stones)for(let t=.04;t<.98;t+=stones){const [x,y]=bezPt(p,t),[nx,ny]=bezNorm(p,t),o=(R()-.5)*5;flagstone(x+nx*o,y+ny*o,6+R()*2.5,R)}
  // l'herbe déborde sur les bords
  for(let t=0;t<=1;t+=.012)for(const s of[-1,1]){if(R()<.35)continue;const [x,y]=bezPt(p,t),[nx,ny]=bezNorm(p,t),ex=x+nx*s*w/2,ey=y+ny*s*w/2,n=2+Math.floor(R()*3);
    for(let k=0;k<n;k++){const bx=ex+(R()-.5)*3,by=ey+(R()-.5)*3,l=3+R()*4,dx=-nx*s*.7+(R()-.5)*.6,dy=-1;bp();G.moveTo(bx,by);G.quadraticCurveTo(bx+dx*l*.4,by+dy*l*.5,bx+dx*l,by+dy*l*.8);st(pick(GRASS),1)}}
}
function flagstone(x,y,r,R){
  const n=7,pts=[];for(let i=0;i<n;i++){const a=i/n*TAU,rr=r*(.8+R()*.3);pts.push([x+Math.cos(a)*rr,y+Math.sin(a)*rr*.62])}
  const path=()=>{bp();pts.forEach((q,i)=>{const nq=pts[(i+1)%n],mx=(q[0]+nq[0])/2,my=(q[1]+nq[1])/2;if(!i)G.moveTo(mx,my);else G.quadraticCurveTo(q[0],q[1],mx,my)});const q=pts[0],nq=pts[1];G.quadraticCurveTo(q[0],q[1],(q[0]+nq[0])/2,(q[1]+nq[1])/2);G.closePath()};
  G.save();G.translate(0,1.4);path();G.fillStyle='rgba(70,50,30,.4)';G.fill();G.restore();
  path();G.fillStyle=lg(x-r,y-r,x+r,y+r,[[0,'#d9d0c0'],[1,'#a69a88']]);G.fill();st('rgba(60,45,35,.55)',.7);
  bp();el(x-r*.2,y-r*.22,r*.55,r*.22,-.1);G.fillStyle='rgba(255,255,255,.3)';G.fill();
  if(R()<.5)for(let k=0;k<3;k++)dot(x+(R()-.5)*r,y+r*.3*(R()),1+R(),'rgba(110,160,70,.7)');
}
/* ---------- arbres ---------- */
function oak(x,y,s,R,pick){
  shadowE(x+9*s,y+3*s,27*s,8*s,.26);
  // tronc évasé avec racines
  bp();G.moveTo(x-9*s,y+2*s);G.quadraticCurveTo(x-4*s,y-2*s,x-4*s,y-20*s);G.lineTo(x+4*s,y-20*s);G.quadraticCurveTo(x+4*s,y-2*s,x+10*s,y+2*s);G.quadraticCurveTo(x+4*s,y+1*s,x+2*s,y+3*s);G.quadraticCurveTo(x-2*s,y+1*s,x-9*s,y+2*s);G.closePath();
  fs(lg(x-6*s,0,x+6*s,0,[[0,'#6e4630'],[.4,'#9a6842'],[1,'#4a2c1a']]),'#2e1a10',1);
  for(const lx of[-2,1.5]){bp();G.moveTo(x+lx*s,y-18*s);G.quadraticCurveTo(x+(lx+.8)*s,y-9*s,x+lx*s,y);st('rgba(40,22,12,.45)',.7)}
  // couronne : touffes ombrées, du fond vers l'avant
  const cy=y-30*s,cl=[];
  for(let i=0;i<13;i++){const a=i/13*TAU,rr=(.55+R()*.35);cl.push({x:x+Math.cos(a)*17*s*rr,y:cy+Math.sin(a)*12*s*rr,r:(9+R()*4)*s})}
  cl.push({x,y:cy-6*s,r:12*s},{x:x-7*s,y:cy-2*s,r:10*s},{x:x+8*s,y:cy+1*s,r:10*s});
  cl.sort((a,b)=>a.y-b.y);
  for(const c of cl){bp();ci(c.x,c.y+1.5,c.r+1.6);G.fillStyle='#1f3d26';G.fill()}
  for(const c of cl){
    const lo=(c.y-cy)/(14*s);
    bp();ci(c.x,c.y,c.r);G.fillStyle=lo>.3?'#3a6e3e':pick(['#41794a','#47824d','#3e7547']);G.fill();
    bp();el(c.x-c.r*.22,c.y-c.r*.28,c.r*.66,c.r*.52);G.fillStyle=lo>.4?'#4f8a4a':'#5c9e54';G.fill();
    bp();el(c.x-c.r*.36,c.y-c.r*.44,c.r*.3,c.r*.2,-.4);G.fillStyle='#8cc46a';G.fill();
    bp();G.arc(c.x,c.y,c.r-.4,Math.PI*1.05,Math.PI*1.55);st('rgba(190,230,140,.55)',.9);
  }
  if(R()<.45){const col=pick(['#e2574a','#ffb35a','#f7b6c6']);for(let k=0;k<6;k++){const c=pick(cl);dot(c.x+(R()-.5)*c.r,c.y+(R()-.5)*c.r*.6,1.5*s,col);dot(c.x+(R()-.5)*c.r,c.y+(R()-.5)*c.r*.6,.5,'#fff')}}
}
function pine(x,y,s,R){
  shadowE(x+8*s,y+3*s,18*s,6*s,.26);
  bp();rrect(x-3*s,y-10*s,6*s,12*s,2);fs('#7a4e31','#2e1a10',.9);
  for(let i=0;i<4;i++){const ty=y-10*s-i*11*s,w=(20-i*4)*s;
    bp();G.moveTo(x,ty-16*s);G.lineTo(x+w,ty);for(let k=0;k<=4;k++)G.quadraticCurveTo(x+w-(k+.5)*w/2.5,ty+4*s,x+w-(k+1)*w/2.5,ty);G.closePath();
    fs(lg(x-w,0,x+w,0,[[0,'#5c9a52'],[.5,'#3f7a45'],[1,'#2a5534']]),'#1a3320',1);
    bp();G.moveTo(x,ty-15*s);G.lineTo(x-w*.6,ty-2*s);st('rgba(170,220,130,.4)',1)}
}
function bush(x,y,s,R,pick,berries){
  shadowE(x+3,y+2,13*s,4*s,.24);
  const cl=[];for(let i=0;i<6;i++)cl.push({x:x+(R()-.5)*16*s,y:y-5*s-R()*6*s,r:(5+R()*3)*s});cl.sort((a,b)=>a.y-b.y);
  for(const c of cl){bp();ci(c.x,c.y+1,c.r+1.3);G.fillStyle='#1f3d26';G.fill()}
  for(const c of cl)leafCluster(c.x,c.y,c.r,R,pick,true);
  if(berries)for(let k=0;k<5;k++){const c=pick(cl);dot(c.x+(R()-.5)*c.r,c.y+(R()-.5)*c.r,1.3,berries);dot(c.x,c.y,.4,'#fff')}
}
/* ---------- cabane ---------- */
function drawHut(x,y){
  G.save();G.translate(x,y);
  shadowE(10,44,82,13,.3);
  // terrasse en planches
  bp();rrect(-40,36,80,14,3);fs('#b98a5a','#4a2c1a',1.1);for(let i=1;i<6;i++){bp();G.moveTo(-40+i*13.3,37);G.lineTo(-40+i*13.3,49);st('rgba(70,40,20,.45)',.7)}
  bp();rrect(-30,48,60,7,2);fs('#a07448','#4a2c1a',1);
  // fondations
  for(let i=0;i<9;i++){bp();el(-56+i*14,37,7.6,4.4);fs(['#b8ab9a','#a39584','#c4b8a8'][i%3],'#3a2a26',.8);dot(-58+i*14,35.6,1.2,'rgba(255,255,255,.4)')}
  // murs en rondins
  for(let i=0;i<6;i++){const ly=-26+i*10.6;bp();rrect(-57,ly,114,10.8,5.2);fs(lg(0,ly,0,ly+10.8,[[0,'#e2ab70'],[.5,'#c48a52'],[1,'#94602f']]),'#4a2a14',.9);
    for(let k=0;k<4;k++){const gx=-48+((i*31+k*27)%96);bp();G.moveTo(gx,ly+5);G.lineTo(gx+7,ly+5.2);st('rgba(90,50,20,.35)',.6)}
    for(const s of[-1,1]){bp();ci(s*58,ly+5.4,5.4);fs('#ecc58e','#4a2a14',.9);bp();ci(s*58,ly+5.4,3.2);st('#c49660',.6);dot(s*58,ly+5.4,.8,'#b07a44')}}
  // ombre portée du toit sur le mur
  G.fillStyle=lg(0,-28,0,-10,[[0,'rgba(40,20,10,.5)'],[1,'rgba(40,20,10,0)']]);G.fillRect(-57,-28,114,18);
  // fenêtres rondes avec volets et jardinières
  for(const s of[-1,1]){G.save();G.translate(s*34,6);
    for(const v of[-1,1]){bp();rrect(v*12-(v>0?0:6)-(v>0?-1:0),-10,6,20,2);fs('#5e9a4f','#24432a',.9);bp();G.moveTo(v*12-(v>0?-4:3),-6);G.lineTo(v*12-(v>0?-4:3),6);st('rgba(30,60,30,.5)',.6)}
    bp();ci(0,0,10.5);fs('#7a4a30','#3a2418',1.2);bp();ci(0,0,8);fl(rg(-2,-3,1,9,[[0,'#fff6cf'],[.6,'#ffd27a'],[1,'#f0a94a']]));
    bp();G.moveTo(-8,0);G.lineTo(8,0);G.moveTo(0,-8);G.lineTo(0,8);st('#7a4a30',1.7);
    bp();G.moveTo(-7,-5);G.quadraticCurveTo(-3,-1,-6.5,4);st('rgba(226,87,74,.55)',2);bp();G.moveTo(7,-5);G.quadraticCurveTo(3,-1,6.5,4);st('rgba(226,87,74,.55)',2);
    bp();rrect(-13,9,26,6,2);fs('#8a5a3a','#3a2418',.9);
    for(let k=0;k<6;k++){dot(-10+k*4,8+(k%2),2.2,['#4f8a36','#6fab48'][k%2])}
    for(let k=0;k<5;k++)dot(-9+k*4.5,6.6-(k%2)*1.4,1.6,['#f7b6c6','#fff6c8','#e2574a','#b9a6f0','#ffd36a'][k]);
    G.restore()}
  // porte ronde
  bp();G.moveTo(-17,37);G.lineTo(-17,8);G.arc(0,8,17,Math.PI,0);G.lineTo(17,37);G.closePath();fs('#9b8b7a','#3a2a26',1.1);
  for(let k=0;k<9;k++){const a=Math.PI+k*Math.PI/8;bp();G.moveTo(Math.cos(a)*14.5,8+Math.sin(a)*14.5);G.lineTo(Math.cos(a)*17,8+Math.sin(a)*17);st('rgba(60,45,35,.5)',.7)}
  bp();G.moveTo(-14,37);G.lineTo(-14,8);G.arc(0,8,14,Math.PI,0);G.lineTo(14,37);G.closePath();fs(lg(-14,0,14,0,[[0,'#7bbd62'],[1,'#3f7a3a']]),'#24432a',1.3);
  for(const lx of[-7,0,7]){bp();G.moveTo(lx,-5+Math.abs(lx)*.6);G.lineTo(lx,37);st('rgba(30,60,30,.45)',.8)}
  for(const hy of[14,30]){bp();G.moveTo(-14,hy);G.lineTo(-4,hy);st('#3a3238',1.8)}
  bp();ci(0,6,4.4);fs('#ffe6a8','#24432a',1);bp();G.moveTo(-4.4,6);G.lineTo(4.4,6);G.moveTo(0,1.6);G.lineTo(0,10.4);st('#24432a',.7);
  bp();ci(8.5,22,2.4);fs('#ffcf4d','#7a4a1a',.8);
  bp();rrect(-15,36,30,3.5,1.5);fs('#7a6a5a','#3a2a26',.7);
  // lanterne accrochée
  bp();G.moveTo(22,-12);G.lineTo(28,-12);G.lineTo(28,-8);st('#3a3238',1.4);bp();rrect(25,-8,6,8,1.6);fs('#ffe08a','#3a3238',1);bp();G.moveTo(24.5,-8.5);G.lineTo(31.5,-8.5);st('#3a3238',1.4);
  // tonneau et bûches
  G.save();G.translate(70,30);shadowE(2,10,10,3,.3);bp();rrect(-8,-12,16,22,6);fs(lg(-8,0,8,0,[[0,'#8a5a32'],[.5,'#c08850'],[1,'#7a4a28']]),'#3a2418',1);for(const by of[-7,4]){bp();G.moveTo(-8,by);G.lineTo(8,by);st('#5a5660',1.6)}bp();el(0,-12,8,2.6);fs('#a87650','#3a2418',.9);G.restore();
  G.save();G.translate(-78,28);shadowE(0,10,15,3.5,.3);for(let r2=0;r2<3;r2++)for(let k=0;k<3-r2;k++){const lx=-8+k*8+r2*4,ly=6-r2*7;bp();ci(lx,ly,4.2);fs('#c49660','#4a2a14',.9);bp();ci(lx,ly,2.4);st('#a07040',.5)}G.restore();
  // pots de fleurs sur la terrasse
  for(const s of[-1,1]){G.save();G.translate(s*30,38);bp();G.moveTo(-4,-4);G.lineTo(4,-4);G.lineTo(3,3);G.lineTo(-3,3);G.closePath();fs('#d9774a','#5a2a14',.8);dot(-1.5,-6,2.4,'#5e9a3e');dot(1.6,-7,2.2,'#6fab48');dot(0,-8.5,1.5,s<0?'#f7b6c6':'#ffd36a');G.restore()}
  // cheminée en pierres
  for(let r2=0;r2<4;r2++)for(let k=0;k<2;k++){bp();rrect(36+k*7.5-(r2%2)*3.5,-52-r2*6,8,6,2);fs(['#b0a290','#9a8c7a','#c2b6a4'][(r2+k)%3],'#3a2a26',.8)}
  bp();rrect(33,-80,20,6,2);fs('#8a7b6c','#3a2a26',1);
  // toit : feuille arrière, feuille principale, petite feuille
  bp();G.moveTo(-84,-14);G.bezierCurveTo(-84,-58,-50,-90,-10,-96);G.bezierCurveTo(30,-98,76,-66,82,-16);G.closePath();fs('#2f6a35','#1a3320',1.3);
  bp();G.moveTo(-76,-20);G.bezierCurveTo(-70,-70,-28,-98,0,-100);G.bezierCurveTo(28,-98,70,-70,76,-20);
  for(let i=0;i<=10;i++){const px=76-i*15.2;G.quadraticCurveTo(px-7.6,-11+(i%2?2.5:-1),px-15.2,-20)}
  G.closePath();fs(lg(-60,-100,40,-14,[[0,'#a6e07e'],[.45,'#6cb054'],[1,'#3a7638']]),'#1f3d26',1.6);
  bp();G.moveTo(0,-99);G.quadraticCurveTo(-4,-60,0,-21);st('rgba(30,70,30,.5)',1.6);
  for(let i=0;i<6;i++){const yy=-88+i*12.5;for(const s of[-1,1]){bp();G.moveTo(0,yy);G.quadraticCurveTo(s*16,yy+1,s*(22+i*9.5),yy+11);st('rgba(30,70,30,.35)',.95)}}
  bp();G.moveTo(-54,-58);G.bezierCurveTo(-44,-78,-24,-90,-6,-93);st('rgba(255,255,255,.45)',2.2);
  // mousse, fleurs et champignons sur le bord du toit
  for(let i=0;i<14;i++){const px=-70+i*10.5,py=-21+((i*7)%5)*.6;dot(px,py,3.2,'#4f8a3e');dot(px-1,py-1.2,1.8,'#7fbf5a')}
  for(const [fx,fc] of[[-58,'#f7b6c6'],[-30,'#fff6c8'],[18,'#f7b6c6'],[46,'#ffd36a']]){for(let j=0;j<5;j++){const a=j*TAU/5;dot(fx+Math.cos(a)*1.5,-24+Math.sin(a)*1.5,1.1,fc)}dot(fx,-24,.7,'#f0b83a')}
  G.save();G.translate(-46,-46);bp();rrect(-1,-1,2,4,1);fl('#fff6e2');bp();G.arc(0,-1,3.2,Math.PI,0);G.closePath();fs('#e2574a',OUT,.7);dot(-1,-2.4,.6,'#fff');G.restore();
  bp();G.moveTo(64,-26);G.quadraticCurveTo(72,-14,78,-18);G.quadraticCurveTo(74,-30,64,-26);fs('#8cc66d','#1f3d26',1);
  // tige au sommet
  bp();G.moveTo(0,-99);G.quadraticCurveTo(4,-110,12,-112);st('#1f3d26',3.2);st('#6b8a3a',1.7);
  G.save();G.translate(17,-111);G.rotate(-.3);bp();el(0,0,6.5,3.2);fs('#a6e07e','#1f3d26',1);bp();G.moveTo(-5,0);G.lineTo(5,0);st('rgba(30,70,30,.5)',.6);G.restore();
  // enseigne
  bp();G.moveTo(-14,-30);G.lineTo(-12,-24);G.moveTo(14,-30);G.lineTo(12,-24);st('#3a3238',.9);
  bp();rrect(-26,-25,52,15,4);fs(lg(0,-25,0,-10,[[0,'#fff4dc'],[1,'#ead2a6']]),'#7a4a30',1.3);
  G.fillStyle='#7a4a30';G.font='700 10px Fredoka, sans-serif';G.textAlign='center';G.fillText('Refuge',0,-14);
  G.restore();
}
/* ---------- potager et puits ---------- */
function garden(x,y,R){
  G.save();G.translate(x,y);
  shadowE(0,4,40,8,.18);
  bp();rrect(-38,-16,76,32,8);fs(lg(0,-16,0,16,[[0,'#8a5a36'],[1,'#6e4428']]),'#3a2418',1.1);
  for(let r2=0;r2<3;r2++){bp();G.moveTo(-32,-8+r2*9);G.lineTo(32,-8+r2*9);st('rgba(40,22,10,.45)',2.2);st('rgba(170,120,80,.35)',.8)}
  for(let k=0;k<6;k++){const cx2=-28+k*11,cy=-10;bp();G.moveTo(cx2,cy+3);G.lineTo(cx2,cy);st('#e67e3a',2.4);for(const a of[-.5,0,.5]){bp();G.moveTo(cx2,cy);G.lineTo(cx2+Math.sin(a)*4,cy-5);st('#4f8a36',1.2)}}
  for(let k=0;k<5;k++){const cx2=-24+k*12,cy=0;bp();ci(cx2,cy,4.4);fs('#8fcf6a','#24432a',.8);bp();ci(cx2,cy,2.4);fl('#b8e690');bp();G.moveTo(cx2-4,cy);G.quadraticCurveTo(cx2,cy-2,cx2+4,cy);st('rgba(36,67,42,.5)',.6)}
  for(let k=0;k<6;k++){const cx2=-28+k*11,cy=9;dot(cx2,cy,2.6,'#e2574a');dot(cx2+.8,cy-.8,.7,'#fff');bp();G.moveTo(cx2,cy-2.4);G.lineTo(cx2+1.5,cy-4.5);st('#4f8a36',1)}
  // petite clôture
  for(let k=0;k<7;k++){bp();rrect(-40+k*13.3,13,3,8,1);fs('#c49660','#4a2a14',.7)}
  bp();G.moveTo(-40,17);G.lineTo(40,17);st('#4a2a14',2);st('#c49660',1);
  G.restore();
}
function well(x,y){
  G.save();G.translate(x,y);shadowE(4,12,22,6,.28);
  for(const s of[-1,1]){bp();rrect(s*15-2,-34,4,40,1.5);fs('#8a5a3a','#3a2418',.9)}
  bp();G.moveTo(-22,-30);G.lineTo(0,-44);G.lineTo(22,-30);G.closePath();fs(lg(0,-44,0,-30,[[0,'#7fbf5a'],[1,'#4f8a45']]),'#24432a',1.1);
  bp();G.moveTo(-15,-24);G.lineTo(15,-24);st('#3a2418',2.4);st('#a87650',1.2);
  bp();G.moveTo(3,-24);G.lineTo(3,-12);st('#c9a06a',.8);bp();rrect(-.5,-13,7,6,1.5);fs('#a87650','#3a2418',.8);
  bp();el(0,2,18,8);fs('#a39584','#3a2a26',1.1);
  bp();rrect(-18,-2,36,10,2);fs(lg(0,-2,0,8,[[0,'#b8ab9a'],[1,'#8a7c6c']]),'#3a2a26',1.1);
  for(let k=0;k<5;k++){bp();G.moveTo(-18+k*9,-2);G.lineTo(-18+k*9,8);st('rgba(50,40,30,.4)',.6)}
  bp();el(0,-2,18,6.5);fs('#c4b8a8','#3a2a26',1);bp();el(0,-1.5,13,4);fl(lg(0,-5,0,2,[[0,'#2a5a78'],[1,'#123048']]));
  G.restore();
}
/* ---------- couveuse ---------- */
function nestStation(x,y,R){
  G.save();G.translate(x,y);
  shadowE(0,14,36,9,.28);
  bp();el(0,10,32,10);fs(lg(0,0,0,20,[[0,'#c4b8a8'],[1,'#8a7c6c']]),'#3a2a26',1.1);
  for(let k=0;k<8;k++){const a=k/8*TAU;bp();G.moveTo(Math.cos(a)*22,10+Math.sin(a)*7);G.lineTo(Math.cos(a)*32,10+Math.sin(a)*10);st('rgba(60,45,35,.4)',.7)}
  // arche en bois avec guirlande
  for(const s of[-1,1]){bp();G.moveTo(s*28,10);G.quadraticCurveTo(s*31,-22,s*12,-40);st('#3a2418',4);st('#9a6842',2.4)}
  bp();G.moveTo(-12,-40);G.quadraticCurveTo(0,-47,12,-40);st('#3a2418',4);st('#9a6842',2.4);
  for(let k=0;k<11;k++){const t=k/10,ax=-27+t*54,ay=-12-Math.sin(t*Math.PI)*30;G.save();G.translate(ax,ay);G.rotate(t*3);bp();el(0,0,3.2,1.6);fs(k%2?'#7fbf5a':'#5fa04a','#24432a',.6);G.restore();if(k%3===1)dot(ax,ay+2,1.3,'#f7b6c6')}
  // lanterne suspendue
  bp();G.moveTo(0,-43);G.lineTo(0,-34);st('#3a3238',.8);bp();rrect(-3.5,-34,7,8,2);fs('#ffe08a','#3a3238',1);bp();G.moveTo(-4,-34);G.lineTo(4,-34);st('#3a3238',1.4);
  // nid tressé
  bp();el(0,-2,27,11);fs(lg(0,-13,0,9,[[0,'#d9aa66'],[1,'#8a5a32']]),'#3a2418',1.3);
  for(let r2=0;r2<3;r2++)for(let k=0;k<12;k++){const a=Math.PI*(.05+k/12*.9),cx2=Math.cos(a)*25,cy=-2+Math.sin(a)*8-r2*3;bp();G.ellipse(cx2,cy,3,1.4,a,0,Math.PI);st('rgba(80,46,20,.5)',.6)}
  bp();el(0,-6,20,5.8);fl('#5a3a22');bp();el(0,-5,17,4);fl('#7a5232');
  for(let k=0;k<16;k++){const a=R()*TAU,r2=18+R()*8;bp();G.moveTo(Math.cos(a)*r2*.8,-6+Math.sin(a)*5);G.lineTo(Math.cos(a)*r2,-7+Math.sin(a)*6-R()*2);st(R()<.5?'#e8c45a':'#c9a03a',.8)}
  // ardoise
  G.save();G.translate(30,4);G.rotate(.12);bp();rrect(-8,-7,16,11,1.5);fs('#3e4a44','#8a5a3a',1.6);G.fillStyle='#f6ead2';G.font='600 5px Fredoka, sans-serif';G.textAlign='center';G.fillText('œufs',0,0);G.restore();
  // paille éparpillée
  for(let k=0;k<20;k++){const a=R()*TAU,r2=24+R()*14;bp();const px=Math.cos(a)*r2,py=12+Math.sin(a)*r2*.35;G.moveTo(px,py);G.lineTo(px+(R()-.5)*5,py+(R()-.5)*2);st('#e8c45a',.7)}
  G.restore();
}
/* ---------- tableau des expéditions ---------- */
function expeBoard(x,y,R){
  G.save();G.translate(x,y);
  shadowE(4,14,34,6,.28);
  for(const s of[-1,1]){bp();rrect(s*24-2.6,-36,5.2,50,1.6);fs(lg(s*24-3,0,s*24+3,0,[[0,'#a87650'],[1,'#6e4630']]),'#3a2418',1);
    bp();G.moveTo(s*24-2.6,6);G.lineTo(s*24+2.6,8);G.moveTo(s*24-2.6,9);G.lineTo(s*24+2.6,11);st('#c9a06a',1)}
  // toit en bardeaux
  bp();G.moveTo(-34,-38);G.lineTo(34,-38);G.lineTo(26,-50);G.lineTo(-26,-50);G.closePath();fs('#8a5a3a','#3a2418',1.1);
  for(let r2=0;r2<2;r2++)for(let k=0;k<8;k++){const bx=-30+k*8+r2*4-(r2?2:0),by=-48+r2*5.5;bp();G.moveTo(bx,by);G.lineTo(bx+8,by);G.lineTo(bx+8,by+5);G.quadraticCurveTo(bx+4,by+7,bx,by+5);G.closePath();fs(r2?'#6fae55':'#5e9a48','#24432a',.6)}
  // panneau
  bp();rrect(-30,-36,60,38,3);fs(lg(0,-36,0,2,[[0,'#d39a5e'],[1,'#a86f3e']]),'#3a2418',1.3);
  bp();rrect(-27,-33,54,32,2);fl('#c48a52');
  // carte
  G.save();G.rotate(-.04);bp();rrect(-24,-31,30,24,1.5);fs('#f6ead2','#8a6a48',.8);
  bp();G.moveTo(-21,-26);G.quadraticCurveTo(-14,-16,-10,-20);st('rgba(110,170,70,.6)',3);bp();ci(-3,-24,3.4);fl('rgba(110,170,220,.5)');
  bp();G.moveTo(-20,-11);G.quadraticCurveTo(-12,-22,-6,-15);G.quadraticCurveTo(-2,-11,1,-24);G.setLineDash([1.5,1.5]);st('#a0522d',.9);G.setLineDash([]);
  bp();G.moveTo(-.5,-26.5);G.lineTo(3,-23);G.moveTo(3,-26.5);G.lineTo(-.5,-23);st('#d8423a',1.2);G.restore();
  dot(-22,-31,1.4,'#d8423a');dot(4,-31,1.4,'#3a7ad8');
  // petites fiches
  G.save();G.translate(16,-26);G.rotate(.08);bp();rrect(-6,-4,13,9,1);fs('#fff8ea','#8a6a48',.6);for(let k=0;k<3;k++){bp();G.moveTo(-4,-1.5+k*2.4);G.lineTo(4,-1.5+k*2.4);st('rgba(90,70,50,.5)',.5)}G.restore();dot(16,-30,1.2,'#ffcf4d');
  G.save();G.translate(16,-12);G.rotate(-.1);bp();rrect(-6,-4,12,8,1);fs('#ffeaa8','#8a6a48',.6);G.restore();dot(16,-16,1.2,'#7fbf5a');
  // boussole
  bp();ci(-12,-3,0);G.save();G.translate(22,-3);bp();ci(0,0,4);fs('#ffcf4d','#7a4a1a',.8);bp();ci(0,0,2.8);fl('#fff8ea');bp();G.moveTo(0,-2.4);G.lineTo(.8,0);G.lineTo(0,2.4);G.lineTo(-.8,0);G.closePath();fl('#d8423a');G.restore();
  // fanions
  bp();G.moveTo(-28,-54);G.quadraticCurveTo(0,-46,28,-54);st('#5a3a24',.7);
  for(let k=0;k<6;k++){const t=(k+.5)/6,fx=-28+t*56,fy=-54+Math.sin(t*Math.PI)*8;bp();G.moveTo(fx-3,fy);G.lineTo(fx+3,fy);G.lineTo(fx,fy+6);G.closePath();fs(['#e2574a','#ffcf4d','#7fbf5a','#7cc6e6','#f49ab4','#ff9a4a'][k],'#5a3a24',.5)}
  // caisse et sac
  G.save();G.translate(42,8);shadowE(0,6,10,3,.3);bp();rrect(-8,-8,16,13,1.5);fs('#c49660','#4a2a14',1);bp();G.moveTo(-8,-8);G.lineTo(8,5);G.moveTo(8,-8);G.lineTo(-8,5);st('rgba(74,42,20,.5)',.8);
  bp();rrect(-5,-18,11,11,4);fs('#6fae55','#24432a',1);bp();rrect(-3,-13,7,4,1.5);fs('#5a9a48','#24432a',.6);bp();G.moveTo(-3,-18);G.quadraticCurveTo(.5,-22,4,-18);st('#7a4a30',1);G.restore();
  G.restore();
}
/* ---------- enclos ---------- */
function penFence(R){
  const x0=PEN.x0-14,x1=PEN.x1+14,y0=PEN.y0-26,y1=PEN.y1+22,gate=16;
  const post=(x,y)=>{shadowE(x+1.5,y+2,3.4,1.3,.3);bp();G.moveTo(x-2.6,y+1);G.lineTo(x-2.6,y-12);G.lineTo(x,y-15.5);G.lineTo(x+2.6,y-12);G.lineTo(x+2.6,y+1);G.closePath();fs(lg(x-3,0,x+3,0,[[0,'#c49660'],[1,'#7a4e31']]),'#3a2418',.9);bp();G.moveTo(x-2.6,y-6);G.lineTo(x+2.6,y-5);st('#c9a06a',1.2)};
  const rail=(ax,ay,bx,by)=>{for(const dy of[-10,-4.5]){bp();G.moveTo(ax,ay+dy);G.quadraticCurveTo((ax+bx)/2,(ay+by)/2+dy+1.4,bx,by+dy);st('#3a2418',3.2);st('#b98a5a',2);st('rgba(255,230,190,.35)',.6)}};
  const top=[];for(let x=x0;x<=x1;x+=22.4)top.push(x);
  for(let i=0;i<top.length-1;i++){const a=top[i],b=top[i+1];if(a<180+gate&&b>180-gate)continue;rail(a,y0,b,y0)}
  rail(x0,y0,x0,y1);rail(x1,y0,x1,y1);
  for(const x of top)if(Math.abs(x-180)>gate-6||true)post(x,y0);
  for(let y=y0+22;y<=y1;y+=22){post(x0,y);post(x1,y)}
}
function penInside(R,pick){
  // herbe tassée et plus claire
  bp();rrect(PEN.x0-8,PEN.y0-20,PEN.x1-PEN.x0+16,PEN.y1-PEN.y0+36,20);G.fillStyle=rg(180,PEN.y0+50,20,170,[[0,'rgba(190,225,120,.35)'],[1,'rgba(120,175,70,.15)']]);G.fill();
  for(let i=0;i<26;i++)grassTuft(PEN.x0+R()*(PEN.x1-PEN.x0),PEN.y0-6+R()*(PEN.y1-PEN.y0+16),R);
  // niche
  G.save();G.translate(78,452);shadowE(4,10,22,5,.3);
  bp();rrect(-17,-10,34,20,3);fs(lg(0,-10,0,10,[[0,'#d39a5e'],[1,'#a86f3e']]),'#3a2418',1.1);
  for(let k=1;k<3;k++){bp();G.moveTo(-17,-10+k*6.6);G.lineTo(17,-10+k*6.6);st('rgba(90,50,20,.35)',.7)}
  bp();G.moveTo(-8,10);G.lineTo(-8,1);G.arc(0,1,8,Math.PI,0);G.lineTo(8,10);G.closePath();fl('#3a2214');
  bp();G.moveTo(-22,-8);G.quadraticCurveTo(0,-34,22,-8);G.quadraticCurveTo(0,-14,-22,-8);fs(lg(0,-30,0,-8,[[0,'#97d775'],[1,'#4f8a45']]),'#1f3d26',1.1);
  bp();G.moveTo(0,-28);G.quadraticCurveTo(-1,-18,0,-11);st('rgba(30,70,30,.45)',.8);
  bp();rrect(-9,-4,18,5,2);fs('#fff4dc','#7a4a30',.7);G.fillStyle='#7a4a30';G.font='700 4px Fredoka, sans-serif';G.textAlign='center';G.fillText('dodo',0,-.3);
  G.restore();
  // foin
  G.save();G.translate(118,444);shadowE(0,6,15,4,.25);bp();el(0,0,14,8.4);fs(lg(0,-8,0,8,[[0,'#f2d474'],[1,'#c9a03a']]),'#7a5a1a',1);for(let i=0;i<10;i++){bp();G.moveTo(-11+i*2.4,-5+R()*3);G.lineTo(-10+i*2.4,5);st('rgba(150,110,30,.6)',.6)}for(let i=0;i<6;i++){bp();G.moveTo(-6+i*2.4,-7);G.lineTo(-6+i*2.4+(R()-.5)*4,-11);st('#e8c45a',.8)}G.restore();
  // mare avec roseaux et nénuphars
  G.save();G.translate(282,500);
  bp();el(0,2,32,15);fl('rgba(70,50,30,.3)');
  bp();el(0,0,30,13.5);fs(rg(-6,-3,2,32,[[0,'#8fd2ec'],[.6,'#4fa0cc'],[1,'#2d6f96']]),'#3a5a3a',1.3);
  bp();el(0,0,30,13.5);st('rgba(180,160,120,.8)',2.2);
  for(const [lx,ly,lr] of[[-14,-3,4.2],[10,4,3.6],[16,-5,3]]){bp();G.moveTo(lx,ly);G.arc(lx,ly,lr,.4,TAU-.2);G.closePath();fs('#6fbf5a','#2f6a35',.7)}
  for(let k=0;k<3;k++)dot(-13+k*1.4,-3.4,1.1,k===1?'#ffffff':'#f7b6c6');
  for(let k=0;k<7;k++){const rx=-34+k*3.2,ry=-6+(k%2)*2;bp();G.moveTo(rx,ry+6);G.quadraticCurveTo(rx-1,ry-6,rx+(k%2?2:-1),ry-14+(k%3)*2);st('#4f8a36',1.4);if(k%3===0){bp();el(rx+(k%2?2:-1),ry-15+(k%3)*2,1.4,3.4);fs('#8a5a32','#3a2418',.5)}}
  for(let k=0;k<9;k++){const a=k/9*TAU;pebbles(Math.cos(a)*33,Math.sin(a)*15+1,R)}
  G.restore();
  // tabourets champignons et balle
  for(const [mx,my,s] of[[124,506,1],[140,512,.8]]){G.save();G.translate(mx,my);G.scale(s,s);shadowE(0,3,7,2.4,.25);bp();rrect(-2.4,-6,4.8,8,2);fs('#fff6e2',OUT,.8);bp();G.moveTo(-8,-5);G.bezierCurveTo(-8,-13,8,-13,8,-5);G.quadraticCurveTo(0,-3,-8,-5);fs('#e2574a',OUT,1);dot(-3,-8,1.3,'#fff');dot(2.6,-9,1,'#fff');G.restore()}
  G.save();G.translate(236,446);shadowE(0,4,5,1.8,.25);bp();ci(0,0,4.6);fs('#ffffff',OUT,.9);G.save();bp();ci(0,0,4.6);G.clip();bp();G.rect(-5,-1.6,10,3.2);fl('#e2574a');G.restore();bp();ci(0,0,4.6);st(OUT,.9);G.restore();
}
/* ---------- entrée du donjon ---------- */
function dungeonGate(x,y,R,pick){
  G.save();G.translate(x,y);
  shadowE(0,14,64,16,.28);
  // butte de terre couverte d'herbe
  bp();G.moveTo(-62,12);G.bezierCurveTo(-58,-26,-24,-40,0,-40);G.bezierCurveTo(24,-40,58,-26,62,12);G.quadraticCurveTo(0,22,-62,12);G.closePath();
  fs(lg(0,-40,0,14,[[0,'#7fbf5a'],[.45,'#5e9a48'],[1,'#8a6440']]),'#2f4a2a',1.2);
  for(let k=0;k<40;k++){const a=Math.PI*(1.05+R()*.9),r2=40+R()*20,gx=Math.cos(a)*r2*1.1,gy=Math.sin(a)*r2*.75;bp();G.moveTo(gx,gy);G.lineTo(gx+(R()-.5)*2,gy-3-R()*3);st(pick(GRASS),.9)}
  // trou et marches
  bp();el(0,4,28,15);fl(rg(0,8,2,30,[[0,'#050302'],[.7,'#1e120b'],[1,'#3a2418']]));
  for(let i=0;i<3;i++){bp();rrect(-18+i*4,-2+i*5,36-i*8,4.4,1.6);fs(lg(0,0,0,4,[[0,`rgba(185,170,150,${.85-i*.25})`],[1,`rgba(110,95,80,${.85-i*.25})`]]),`rgba(40,30,20,${.7-i*.2})`,.7)}
  // grosses racines en arche
  for(const s of[-1,1]){bp();G.moveTo(s*34,14);G.bezierCurveTo(s*40,-14,s*20,-30,0,-26);st('#2e1a10',9);st('#7a4e31',6.6);st('#a87650',2.2)}
  for(const s of[-1,1]){bp();G.moveTo(s*24,-24);G.bezierCurveTo(s*44,-28,s*56,-10,s*60,8);st('#2e1a10',6);st('#8a5a3a',3.8);st('#b98a5a',1)}
  for(let k=0;k<6;k++){const t=k/5,rx=-30+t*60,ry=-26-Math.sin(t*Math.PI)*4;bp();G.moveTo(rx,ry);G.quadraticCurveTo(rx+2,ry+6,rx+(R()-.5)*4,ry+10+R()*6);st('#5a3824',1.1)}
  // mousse sur les racines
  for(let k=0;k<10;k++){const t=R(),a=Math.PI*(1.1+t*.8);leafCluster(Math.cos(a)*30,-14+Math.sin(a)*14,3+R()*2,R,pick,true)}
  // champignons lumineux
  for(const [mx,my,s] of[[-44,4,1],[-38,10,.7],[42,6,.9],[50,0,.6]]){G.save();G.translate(mx,my);G.scale(s,s);bp();rrect(-1.4,-5,2.8,6,1);fl('#e6f6ff');bp();G.moveTo(-5,-4);G.bezierCurveTo(-5,-10,5,-10,5,-4);G.quadraticCurveTo(0,-3,-5,-4);fs('#7fd4f0','#2a5a78',.8);dot(-1.5,-6.5,.9,'#fff');G.restore()}
  // lanternes et panneau
  for(const s of[-1,1]){bp();G.moveTo(s*70,14);G.lineTo(s*70,-22);st('#3a2418',3);st('#8a5a3a',1.6);bp();G.moveTo(s*70,-22);G.quadraticCurveTo(s*70-s*-6,-24,s*70+s*6,-19);st('#3a2418',1.4);bp();rrect(s*70+s*6-3.5,-19,7,9,2);fs('#ffd98a','#5a3a1a',.9)}
  G.save();G.translate(-62,-30);G.rotate(-.08);bp();G.moveTo(0,40);G.lineTo(0,4);st('#3a2418',2.6);st('#8a5a3a',1.4);
  bp();G.moveTo(-14,-6);G.lineTo(12,-6);G.lineTo(18,0);G.lineTo(12,6);G.lineTo(-14,6);G.closePath();fs(lg(0,-6,0,6,[[0,'#d39a5e'],[1,'#a86f3e']]),'#3a2418',1);
  G.fillStyle='#4a2a14';G.font='700 6.5px Fredoka, sans-serif';G.textAlign='center';G.fillText('Racines',1,2.4);G.restore();
  G.restore();
}

/* =====================================================================
   PRÉ-RENDU DU DÉCOR
   ===================================================================== */
function renderRefugeBg(){
  const c=document.createElement('canvas');c.width=W*RES;c.height=H*RES;
  const prev=G;G=c.getContext('2d');G.scale(RES,RES);
  const R=mulberry(4242),pick=a=>a[Math.floor(R()*a.length)];
  refugeGround(R,pick);
  trail([180,224,172,330,190,450,180,566],26,R,pick,.07);
  trail([166,262,124,258,98,284,84,304],17,R,pick,.16);
  trail([194,262,238,258,266,282,282,300],17,R,pick,.16);
  penInside(R,pick);
  garden(66,232,R);
  well(304,222);
  nestStation(SPOTS.couveuse.x,SPOTS.couveuse.y,R);
  expeBoard(SPOTS.board.x,SPOTS.board.y,R);
  dungeonGate(SPOTS.door.x,SPOTS.door.y,R,pick);
  // lisière de forêt (arbres variés, buissons)
  const T2=[];
  for(let x=-14;x<=W+14;x+=30)T2.push({k:R()<.25?'pine':'oak',x:x+(R()-.5)*12,y:58+R()*12,s:1+R()*.25});
  for(let x=-6;x<=W+6;x+=40)if(Math.abs(x-180)>96)T2.push({k:'oak',x:x+(R()-.5)*10,y:96+R()*10,s:.8+R()*.2});
  for(let y=130;y<H-30;y+=34){T2.push({k:R()<.3?'pine':'oak',x:-8+R()*10,y,s:.75+R()*.2});T2.push({k:R()<.3?'pine':'oak',x:W+8-R()*10,y:y+14,s:.75+R()*.2})}
  for(let y=140;y<H-40;y+=46){T2.push({k:'bush',x:20+R()*6,y:y+20,s:.9});T2.push({k:'bush',x:W-20-R()*6,y:y+30,s:.9})}
  T2.push({k:'bush',x:122,y:120,s:1,b:'#d8423a'},{k:'bush',x:244,y:122,s:1,b:'#7a6ad8'},{k:'bush',x:30,y:560,s:1.1,b:'#d8423a'},{k:'bush',x:330,y:548,s:1.1});
  T2.sort((a,b)=>a.y-b.y);
  for(const t of T2){if(t.k==='oak')oak(t.x,t.y,t.s,R,pick);else if(t.k==='pine')pine(t.x,t.y,t.s,R);else bush(t.x,t.y,t.s,R,pick,t.b)}
  drawHut(180,178);
  penFence(R);
  // lumière douce du soleil (haut gauche) et vignette
  G.fillStyle=lg(0,0,W,H,[[0,'rgba(255,236,170,.18)'],[.5,'rgba(255,236,170,0)'],[1,'rgba(40,60,20,.12)']]);G.fillRect(0,0,W,H);
  G.fillStyle=rg(W/2,H/2,W*.45,H*.62,[[0,'rgba(30,40,15,0)'],[1,'rgba(30,40,15,.28)']]);G.fillRect(0,0,W,H);
  G=prev;return c;
}

/* =====================================================================
   VIE DU REFUGE (à chaque image)
   ===================================================================== */
const fx={flies:[],leaves:[]};
function initRefugeFx(){
  fx.flies=[];for(let i=0;i<5;i++)fx.flies.push({x:rnd(40,320),y:rnd(140,540),tx:0,ty:0,ph:Math.random()*6,c:pickR(['#ffffff','#ffd36a','#7cc6e6','#f49ab4'])});
  fx.leaves=[];
}
function updRefugeFx(dt){
  if(!fx.flies.length)initRefugeFx();
  for(const f of fx.flies){f.ph+=dt;if(!f.tx||Math.hypot(f.tx-f.x,f.ty-f.y)<6){f.tx=rnd(40,320);f.ty=rnd(140,540)}
    const d=norm(f.tx-f.x,f.ty-f.y);f.x+=d.x*22*dt+Math.sin(f.ph*3)*10*dt;f.y+=d.y*22*dt+Math.cos(f.ph*4)*12*dt}
  if(Math.random()<dt*.6)fx.leaves.push({x:rnd(10,350),y:rnd(50,90),vx:rnd(4,12),vy:rnd(10,16),a:Math.random()*6,va:rnd(-2,2),life:rnd(5,8),c:pickR(['#8cc46a','#d9a03a','#c9763a','#6fab48'])});
  for(const l of fx.leaves){l.x+=l.vx*dt+Math.sin(l.a)*8*dt;l.y+=l.vy*dt;l.a+=l.va*dt;l.life-=dt}
  fx.leaves=fx.leaves.filter(l=>l.life>0&&l.y<H);
}
function drawRefugeFx(){
  // reflets sur la mare
  G.save();G.translate(282,500);bp();el(0,0,28,12);G.clip();
  for(let k=0;k<4;k++){const ph=clock*.8+k*1.6,px=Math.sin(ph)*16,py=Math.cos(ph*.7+k)*5;bp();el(px,py,6+k,1.2);G.fillStyle=`rgba(255,255,255,${.25+.15*Math.sin(clock*2+k)})`;G.fill()}
  G.restore();
  // feuilles qui tombent
  for(const l of fx.leaves){G.save();G.translate(l.x,l.y);G.rotate(l.a);G.globalAlpha=Math.min(1,l.life);bp();el(0,0,3,1.5);fs(l.c,'rgba(40,30,20,.5)',.4);G.restore()}
  // papillons
  for(const f of fx.flies){const flap=Math.abs(Math.sin(f.ph*16));G.save();G.translate(f.x,f.y);
    for(const s of[-1,1]){G.save();G.scale(s*(.3+.7*flap),1);bp();el(2.6,-1.4,2.6,2);fs(f.c,'rgba(60,40,30,.7)',.5);bp();el(2,1.6,1.8,1.4);fs(f.c,'rgba(60,40,30,.7)',.5);G.restore()}
    bp();G.moveTo(0,-2.4);G.lineTo(0,2.4);st('#3a2622',1);G.restore()}
  // rayons de soleil
  G.save();G.globalCompositeOperation='lighter';
  for(let i=0;i<3;i++){const x0=30+i*110,a=.05+.02*Math.sin(clock*.6+i*2);bp();G.moveTo(x0,60);G.lineTo(x0+26,60);G.lineTo(x0+150,H);G.lineTo(x0+110,H);G.closePath();G.fillStyle=lg(0,60,0,H,[[0,`rgba(255,236,170,${a})`],[1,'rgba(255,236,170,0)']]);G.fill()}
  G.restore();
}
