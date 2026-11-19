'use strict';
/* =====================================================================
   Trognons & Donjons — art.js
   Tout le dessin du jeu, en vectoriel (aucune image) : décors, héros,
   compagnon, monstres, butin, interface.
   Style : livre d'images chaleureux, contours brun foncé, ombrage doux.
   ===================================================================== */
const RES = 3;                 // finesse des décors pré-rendus
let G = null;                  // contexte de dessin courant
let FLASH = false;             // dessine tout en blanc (coup reçu)
const OUT = '#3a2622';         // contour principal
const TAU = Math.PI * 2;

/* ---------- outils ---------- */
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function hashStr(s){let h=2166136261;for(const ch of s){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function bp(){G.beginPath()}
function el(x,y,rx,ry,r=0){G.ellipse(x,y,Math.max(.01,rx),Math.max(.01,ry),r,0,TAU)}
function ci(x,y,r){G.arc(x,y,Math.max(.01,r),0,TAU)}
function rrect(x,y,w,h,r){if(G.roundRect)G.roundRect(x,y,w,h,r);else G.rect(x,y,w,h)}
function fl(c){G.fillStyle=FLASH?'#ffffff':c;G.fill()}
function st(c=OUT,w=1.1){G.strokeStyle=FLASH?'#ffffff':c;G.lineWidth=w;G.lineJoin='round';G.lineCap='round';G.stroke()}
function fs(c,o=OUT,w=1.1){fl(c);if(o)st(o,w)}
function dot(x,y,r,c){bp();ci(x,y,r);fl(c)}
function lg(x0,y0,x1,y1,stops){if(FLASH)return'#fff';const g=G.createLinearGradient(x0,y0,x1,y1);for(const s of stops)g.addColorStop(s[0],s[1]);return g}
function rg(x,y,r0,r1,stops,x1,y1){if(FLASH)return'#fff';const g=G.createRadialGradient(x,y,r0,x1??x,y1??y,r1);for(const s of stops)g.addColorStop(s[0],s[1]);return g}
function shadowE(x,y,rx,ry,a=.24){bp();el(x,y,rx,ry);G.fillStyle=`rgba(58,34,24,${a})`;G.fill()}
function glow(x,y,r,col,a){G.save();G.globalCompositeOperation='lighter';bp();ci(x,y,r);G.fillStyle=rg(x,y,0,r,[[0,`rgba(${col},${a})`],[1,`rgba(${col},0)`]]);G.fill();G.restore()}
function sparkle(x,y,s,c){bp();G.moveTo(x,y-s);G.quadraticCurveTo(x,y,x+s,y);G.quadraticCurveTo(x,y,x,y+s);G.quadraticCurveTo(x,y,x-s,y);G.quadraticCurveTo(x,y,x,y-s);fl(c)}
function star5(x,y,r,c){bp();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=i%2?r*.45:r;G.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr)}G.closePath();fs(c,'#8a5a1a',.7)}
function heartPath(s){bp();G.moveTo(0,s*.9);G.bezierCurveTo(-s*1.25,s*.05,-s*1.1,-s*.95,-s*.5,-s*.95);G.bezierCurveTo(-s*.15,-s*.95,0,-s*.65,0,-s*.42);G.bezierCurveTo(0,-s*.65,s*.15,-s*.95,s*.5,-s*.95);G.bezierCurveTo(s*1.1,-s*.95,s*1.25,s*.05,0,s*.9);G.closePath()}

/* ---------- yeux (le cœur du « mignon ») ---------- */
function eyePair(x,y,sp,rx,ry,look,mode,t,ink='#2b1d1a'){
  for(const s of[-1,1]){
    const ex=x+s*sp+(look?look.x*1.1:0),ey=y+(look?look.y*.9:0);
    if(mode==='closed'){bp();G.moveTo(ex-rx*1.1,ey);G.quadraticCurveTo(ex,ey+ry*.9,ex+rx*1.1,ey);st(ink,1);continue}
    if(mode==='dizzy'){bp();for(let k=0;k<18;k++){const a=k*.75+t*7*s,r=k/18*rx*1.5;G.lineTo(ex+Math.cos(a)*r,ey+Math.sin(a)*r)}st(ink,.8);continue}
    if(mode==='happy'){bp();G.moveTo(ex-rx*1.1,ey+ry*.3);G.quadraticCurveTo(ex,ey-ry*1.1,ex+rx*1.1,ey+ry*.3);st(ink,1.1);continue}
    bp();el(ex,ey,rx,ry);fl(ink);
    dot(ex-rx*.32,ey-ry*.38,rx*.46,'#ffffff');dot(ex+rx*.38,ey+ry*.38,rx*.2,'#ffffff');
    if(mode==='angry'){bp();G.moveTo(ex+s*rx*1.4,ey-ry*1.75);G.lineTo(ex-s*rx*.7,ey-ry*1.05);st(ink,1.15)}
  }
}
function cheeks(x,y,sp,rx=1.7,ry=1.05,a=.5){if(FLASH)return;for(const s of[-1,1]){bp();el(x+s*sp,y,rx,ry);G.fillStyle=`rgba(255,120,110,${a})`;G.fill()}}

/* =====================================================================
   DÉCORS : une salle est pré-rendue une fois dans une image en mémoire
   ===================================================================== */
const PAL={
  soilA:'#c19f6e',soilB:'#d4b585',
  slabs:['#dcc6a0','#d4bc92','#e3cfaa','#cdb388'],slabEdge:'#8a6a48',
  moss:['rgba(108,150,66,.55)','rgba(140,182,88,.5)','rgba(92,134,58,.5)'],
  leafDark:'#1d3a26',leafMid:['#3f7448','#467e4d','#3a6b42','#4a8550'],leafLight:'#5f9e57',leafHi:'#93c76f',
  earthA:'#8d5c3b',earthB:'#5b3824',root:'#7a4f33',rootHi:'#a87650',
};
function renderRoomCanvas(room,COLS,ROWS,T){
  const Wp=COLS*T,Hp=ROWS*T;
  const c=document.createElement('canvas');c.width=Wp*RES;c.height=Hp*RES;
  const prev=G;G=c.getContext('2d');G.scale(RES,RES);
  const R=mulberry(hashStr(room.key+'#'+room.seed));
  const pick=a=>a[Math.floor(R()*a.length)];
  const g=room.grid,isDoor=(d)=>!!room.doors[d];

  // ---- sol de terre battue
  G.fillStyle=lg(0,0,0,Hp,[[0,PAL.soilA],[1,PAL.soilB]]);G.fillRect(0,0,Wp,Hp);
  for(let i=0;i<1600;i++){G.fillStyle=pick(['rgba(120,82,48,.16)','rgba(255,240,210,.18)','rgba(86,58,34,.12)','rgba(150,110,60,.15)']);G.fillRect(R()*Wp,R()*Hp,R()*1.5+.4,R()*1.5+.4)}
  // ---- dalles : un chemin entre les portes, des dalles éparses ailleurs
  for(let ty=1;ty<ROWS-1;ty++)for(let tx=1;tx<COLS-1;tx++){
    const lane=(tx===5&&((ty<5&&isDoor('n'))||(ty>5&&isDoor('s'))||ty===5))||(ty===5&&((tx<5&&isDoor('w'))||(tx>5&&isDoor('e'))));
    if(R()>(lane?.92:.22))continue;
    const x0=tx*T+1.4+R()*1.6,y0=ty*T+1.4+R()*1.6,w=T-3.2-R()*2,h=T-3.2-R()*2,tone=pick(PAL.slabs);
    bp();rrect(x0,y0+1.4,w,h,5);G.fillStyle='rgba(110,78,48,.55)';G.fill();
    bp();rrect(x0,y0,w,h,5);G.fillStyle=lg(x0,y0,x0+w,y0+h,[[0,tone],[1,'#c4a87c']]);G.fill();
    bp();G.moveTo(x0+4,y0+1.1);G.lineTo(x0+w-4,y0+1.1);st('rgba(255,248,230,.6)',1.1);
    for(let k=0;k<6;k++){G.fillStyle='rgba(140,104,66,.25)';G.fillRect(x0+2+R()*(w-4),y0+2+R()*(h-4),1,1)}
    if(R()<.4){bp();let px=x0+3+R()*(w-6),py=y0+3+R()*(h-6);G.moveTo(px,py);for(let k=0;k<3;k++){px+=(R()-.5)*9;py+=(R()-.5)*9;G.lineTo(clampN(px,x0+2,x0+w-2),clampN(py,y0+2,y0+h-2))}st('rgba(105,74,46,.5)',.6)}
    if(R()<.3){for(let k=0;k<5;k++){bp();ci(x0+(R()<.5?2:w-2)+(R()-.5)*4,y0+R()*h,1+R()*2);G.fillStyle=pick(PAL.moss);G.fill()}}
  }
  // ---- plaques de mousse
  for(let i=0;i<9;i++){const mx=T+R()*(Wp-2*T),my=T+R()*(Hp-2*T);for(let j=0;j<9;j++){bp();ci(mx+(R()-.5)*16,my+(R()-.5)*11,1.6+R()*3.6);G.fillStyle=pick(PAL.moss);G.fill()}}
  // ---- petits détails
  for(let i=0;i<34;i++){
    const x=T+6+R()*(Wp-2*T-12),y=T+8+R()*(Hp-2*T-14),tx=Math.floor(x/T),ty=Math.floor(y/T);
    if(g[ty][tx]===2)continue;const k=R();
    if(k<.3)grassTuft(x,y,R);else if(k<.45)pebbles(x,y,R);else if(k<.58)clover(x,y);else if(k<.68)tinyMush(x,y,R);else if(k<.84)fallenLeaf(x,y,R);else flower(x,y,R);
  }
  // touffes d'herbe le long des murs
  for(let i=0;i<22;i++){const side=Math.floor(R()*4);let x,y;
    if(side===0){x=T+R()*(Wp-2*T);y=T+5}else if(side===1){x=T+R()*(Wp-2*T);y=Hp-T-2}else if(side===2){x=T+3;y=T+R()*(Hp-2*T)}else{x=Wp-T-3;y=T+R()*(Hp-2*T)}
    if(Math.abs(x-Wp/2)<20||Math.abs(y-Hp/2)<20)continue;grassTuft(x,y,R)}
  // ---- terre plus sombre et ombre douce au pied des haies
  G.fillStyle=lg(26,0,48,0,[[0,'rgba(48,28,18,.42)'],[1,'rgba(48,28,18,0)']]);G.fillRect(26,0,22,Hp);
  G.fillStyle=lg(Wp-26,0,Wp-42,0,[[0,'rgba(48,28,18,.28)'],[1,'rgba(48,28,18,0)']]);G.fillRect(Wp-42,0,16,Hp);
  G.fillStyle=lg(0,Hp-24,0,Hp-36,[[0,'rgba(48,28,18,.25)'],[1,'rgba(48,28,18,0)']]);G.fillRect(0,Hp-36,Wp,12);
  G.fillStyle=rg(Wp/2,Hp/2,Wp*.32,Wp*.62,[[0,'rgba(90,60,30,0)'],[1,'rgba(90,60,30,.18)']]);G.fillRect(0,0,Wp,Hp);
  // ---- obstacles
  for(let ty=0;ty<ROWS;ty++)for(let tx=0;tx<COLS;tx++)if(g[ty][tx]===2){
    const k=R(),x=tx*T+T/2,y=tx*0+ty*T+T/2+6;
    if(k<.5)boulder(x,y,R);else if(k<.75)stump(x,y,R);else mushrooms(x,y,R);
  }
  // ---- murs : talus de terre au nord, haies feuillues tout autour
  drawWalls(room,Wp,Hp,T,R,pick);
  G=prev;return c;
}
function clampN(v,a,b){return v<a?a:v>b?b:v}
function grassTuft(x,y,R){const n=4+Math.floor(R()*4),cols=['#5e8f3f','#6fa34a','#86b85a'];
  for(let i=0;i<n;i++){const a=-Math.PI/2+(i/(n-1)-.5)*1.4+(R()-.5)*.2,l=4+R()*4;bp();G.moveTo(x+(i-n/2)*.9,y);G.quadraticCurveTo(x+(i-n/2)*.9+Math.cos(a)*l*.3,y-l*.5,x+Math.cos(a)*l,y+Math.sin(a)*l);st(cols[i%3],1.1)}}
function pebbles(x,y,R){for(let i=0;i<3;i++){const px=x+(R()-.5)*8,py=y+(R()-.5)*5,r=1.2+R()*1.6;bp();el(px,py+.6,r,r*.7);G.fillStyle='rgba(70,50,35,.35)';G.fill();bp();el(px,py,r,r*.72);G.fillStyle=['#a99a8a','#bcae9c','#948576'][i%3];G.fill();dot(px-r*.3,py-r*.3,r*.3,'rgba(255,255,255,.5)')}}
function clover(x,y){for(let i=0;i<3;i++){const a=i*TAU/3-Math.PI/2;dot(x+Math.cos(a)*1.8,y+Math.sin(a)*1.8,1.6,'#6fa34a')}dot(x,y,.6,'#4f7f35')}
function tinyMush(x,y,R){const c=R()<.5?'#e2574a':'#f0a050';bp();rrect(x-.8,y-3,1.6,3,.6);G.fillStyle='#f6ead2';G.fill();bp();G.arc(x,y-3,2.6,Math.PI,0);G.closePath();fs(c,OUT,.6);dot(x-1,y-4,.45,'#fff');dot(x+.9,y-3.6,.35,'#fff')}
function fallenLeaf(x,y,R){const a=R()*TAU,c=['#d98a3a','#c9a03a','#b85a2e','#8fae4a'][Math.floor(R()*4)];G.save();G.translate(x,y);G.rotate(a);bp();el(0,0,3.4,1.6);G.fillStyle=c;G.fill();bp();G.moveTo(-3,0);G.lineTo(3,0);st('rgba(80,50,20,.5)',.4);G.restore()}
function flower(x,y,R){const c=['#f4a6b8','#fff6c8','#b9a6f0','#ffffff'][Math.floor(R()*4)];bp();G.moveTo(x,y+3);G.lineTo(x,y);st('#5e8f3f',.7);for(let i=0;i<5;i++){const a=i*TAU/5;dot(x+Math.cos(a)*1.5,y+Math.sin(a)*1.5,1.15,c)}dot(x,y,.8,'#f0b83a')}

function boulder(x,y,R){
  shadowE(x+1,y+6,13,4.5,.3);
  G.save();G.translate(x,y);
  bp();G.moveTo(-12.5,3);G.bezierCurveTo(-14,-6,-8,-15,-1,-14.5);G.bezierCurveTo(7,-15,13.5,-8,12.5,1);G.bezierCurveTo(12,7,5,8.5,0,8.2);G.bezierCurveTo(-6,8.5,-12,7.5,-12.5,3);G.closePath();
  fs(lg(0,-15,0,8,[[0,'#c4b6a6'],[.55,'#a29382'],[1,'#7d6e60']]),'#3a2a26',1.2);
  bp();G.moveTo(-9,-4);G.bezierCurveTo(-8,-11,-2,-12.5,3,-12);G.bezierCurveTo(7,-11.5,9,-8,8.5,-5);G.quadraticCurveTo(0,-2.5,-9,-4);G.fillStyle='rgba(235,226,212,.45)';G.fill();
  bp();G.moveTo(2,1);G.lineTo(4.5,-3);G.lineTo(7.5,-2);st('rgba(70,55,45,.55)',.7);
  // coiffe de mousse
  for(let i=0;i<8;i++){const a=-Math.PI+i/7*Math.PI,px=Math.cos(a)*8*(.6+R()*.4),py=-11+Math.sin(a)*2.5+R()*2;bp();ci(px,py,2+R()*1.8);G.fillStyle=['#5e9a48','#76b056','#4f8a3e'][i%3];G.fill()}
  dot(-3,-13.2,.9,'#9fd07a');dot(2.5,-12.6,.7,'#9fd07a');
  if(R()<.5){dot(5,-12.5,1,'#fff6c8');dot(5,-12.5,.4,'#f0b83a')}
  G.restore();
}
function stump(x,y,R){
  shadowE(x+1,y+6,12.5,4.2,.3);
  G.save();G.translate(x,y);
  // racines
  for(const s of[-1,1]){bp();G.moveTo(s*8,3);G.quadraticCurveTo(s*12,5,s*13.5,7.5);G.lineTo(s*10,6.5);G.closePath();fs('#6e4630','#3a2622',.9)}
  bp();G.moveTo(-10.5,-6);G.lineTo(-10.5,4);G.quadraticCurveTo(0,8.5,10.5,4);G.lineTo(10.5,-6);G.closePath();
  fs(lg(-10,0,10,0,[[0,'#7a4e31'],[.45,'#9a6842'],[1,'#5e3a26']]),'#3a2622',1.2);
  for(const lx of[-6,-1.5,3.5,7.5]){bp();G.moveTo(lx,-4);G.quadraticCurveTo(lx+1,0,lx,5);st('rgba(50,30,18,.4)',.7)}
  bp();el(0,-6,10.5,5);fs('#dcb37a','#3a2622',1.1);
  bp();el(0,-6,7,3.3);st('#b9884e',.7);bp();el(0,-6,3.6,1.7);st('#b9884e',.7);dot(.4,-6,.7,'#a0723e');
  bp();G.moveTo(1,-6);G.lineTo(6,-8.5);st('rgba(120,80,40,.5)',.5);
  if(R()<.6){bp();rrect(7.5,-1,1.6,3,.6);G.fillStyle='#f6ead2';G.fill();bp();G.arc(8.3,-1,2.6,Math.PI,0);G.closePath();fs('#f0a050',OUT,.6)}
  G.restore();
}
function mushrooms(x,y,R){
  shadowE(x+1,y+6,12,4,.28);
  G.save();G.translate(x,y);
  const m=(mx,my,s,c)=>{bp();rrect(mx-2*s,my-7*s,4*s,8*s,2*s);fs(lg(mx-2*s,0,mx+2*s,0,[[0,'#fff6e2'],[1,'#e6d2b0']]),OUT,.9);
    bp();G.moveTo(mx-8*s,my-6*s);G.bezierCurveTo(mx-8.5*s,my-15*s,mx+8.5*s,my-15*s,mx+8*s,my-6*s);G.quadraticCurveTo(mx,my-4*s,mx-8*s,my-6*s);G.closePath();
    fs(lg(0,my-15*s,0,my-5*s,[[0,c[0]],[1,c[1]]]),OUT,1);
    dot(mx-3.5*s,my-10*s,1.6*s,'#fff4e6');dot(mx+2.5*s,my-11.5*s,1.2*s,'#fff4e6');dot(mx+4.8*s,my-8*s,.9*s,'#fff4e6');
    bp();el(mx-4*s,my-12.5*s,2.4*s,1*s,-.5);G.fillStyle='rgba(255,255,255,.35)';G.fill()};
  const c1=R()<.5?['#ff7a5e','#c9402f']:['#ffb05a','#d9772e'];
  m(5,4,.62,c1);m(-5,5,.75,c1);m(1,7,1,['#ff6a55','#b8372a']);
  G.restore();
}

function drawWalls(room,Wp,Hp,T,R,pick){
  const D=room.doors,mid=Wp/2,midY=Hp/2;
  const L=29,Rr=Wp-29,TOP=17,B=Hp-27,FACE=33;   // bords intérieurs de la haie
  const ph=[R()*9,R()*9,R()*9,R()*9];
  const wav=(v,k)=>Math.sin(v*.11+ph[k])*1.6+Math.sin(v*.29+ph[k]*2)*1.1;
  // contour intérieur ondulé, dans le sens horaire
  const pts=[];
  for(let x=L;x<Rr;x+=4)pts.push([x,TOP+wav(x,0),'n']);
  for(let y=TOP;y<B;y+=4)pts.push([Rr-wav(y,1),y,'e']);
  for(let x=Rr;x>L;x-=4)pts.push([x,B-wav(x,2),'s']);
  for(let y=B;y>TOP;y-=4)pts.push([L+wav(y,3),y,'w']);
  const inGap=(x,y)=>(D.n&&y<FACE+4&&Math.abs(x-mid)<16)||(D.s&&y>B-6&&Math.abs(x-mid)<16)||(D.w&&x<L+6&&Math.abs(y-midY)<16)||(D.e&&x>Rr-6&&Math.abs(y-midY)<16);

  // ---- 1. talus de terre au nord, sous la haie
  const faceBot=x=>FACE+Math.sin(x*.17+ph[0])*1.4+Math.sin(x*.41)*.8;
  bp();G.moveTo(L-8,TOP-4);G.lineTo(Rr+8,TOP-4);for(let x=Rr+8;x>=L-8;x-=3)G.lineTo(x,faceBot(x));G.closePath();
  G.fillStyle=lg(0,TOP-4,0,FACE+2,[[0,'#3e2516'],[.35,PAL.earthB],[1,PAL.earthA]]);G.fill();
  for(let i=0;i<3;i++){bp();for(let x=L-6;x<=Rr+6;x+=5)G.lineTo(x,TOP+5+i*4.2+Math.sin(x*.13+i*2+ph[1])*1.1);st('rgba(40,22,12,.32)',.6)}
  for(let i=0;i<22;i++){const sx=L+R()*(Rr-L),sy=TOP+5+R()*(FACE-TOP-8);if(D.n&&Math.abs(sx-mid)<18)continue;bp();el(sx,sy,1.4+R()*1.4,1+R()*.7);G.fillStyle=pick(['#9b8b7a','#857565','#b0a08e']);G.fill();dot(sx-.4,sy-.4,.4,'rgba(255,255,255,.35)')}
  // lisière terre / sol : liseré sombre, miettes, puis ombre douce sur le sol
  bp();for(let x=L-8;x<=Rr+8;x+=3)G.lineTo(x,faceBot(x));st('rgba(46,26,14,.55)',1.3);
  bp();for(let x=L-8;x<=Rr+8;x+=3)G.lineTo(x,faceBot(x)-1.3);st('rgba(196,150,100,.35)',.7);
  for(let i=0;i<26;i++){const x=L+R()*(Rr-L);if(D.n&&Math.abs(x-mid)<18)continue;const y=faceBot(x)+1+R()*3;bp();el(x,y,.8+R()*1.2,.6+R()*.6);G.fillStyle=pick(['#7a5236','#946746','#a99a8a']);G.fill()}
  G.fillStyle=lg(0,FACE,0,FACE+12,[[0,'rgba(46,26,14,.32)'],[1,'rgba(46,26,14,0)']]);G.fillRect(L,FACE,Rr-L,12);
  // racines qui pendent du talus
  for(let i=0;i<16;i++){const rx=L+4+R()*(Rr-L-8);if(D.n&&Math.abs(rx-mid)<22)continue;const l=7+R()*13,sw=(R()-.5)*8,y0=TOP+1;
    bp();G.moveTo(rx,y0);G.bezierCurveTo(rx+sw*.3,y0+l*.4,rx+sw,y0+l*.7,rx+sw*.6,y0+l);st('#4a2c1a',2.6);
    bp();G.moveTo(rx,y0);G.bezierCurveTo(rx+sw*.3,y0+l*.4,rx+sw,y0+l*.7,rx+sw*.6,y0+l);st(PAL.root,1.7);
    bp();G.moveTo(rx-.4,y0+1);G.bezierCurveTo(rx+sw*.3-.4,y0+l*.4,rx+sw-.4,y0+l*.7,rx+sw*.6-.3,y0+l-1);st(PAL.rootHi,.5);
    if(R()<.5){bp();G.moveTo(rx+sw*.5,y0+l*.6);G.quadraticCurveTo(rx+sw*.5+3,y0+l*.7,rx+sw*.5+4,y0+l*.9);st(PAL.root,.6)}}
  // passage nord : arche dans le talus
  if(D.n){bp();G.moveTo(mid-14,FACE+2);G.lineTo(mid-14,TOP-2);G.quadraticCurveTo(mid,TOP-16,mid+14,TOP-2);G.lineTo(mid+14,FACE+2);G.closePath();G.fillStyle=lg(0,0,0,FACE,[[0,'#0e0806'],[1,'#4a3020']]);G.fill();
    bp();G.moveTo(mid-15.5,FACE+1);G.lineTo(mid-15.5,TOP-2);G.quadraticCurveTo(mid,TOP-17.5,mid+15.5,TOP-2);G.lineTo(mid+15.5,FACE+1);st('#2e1a10',4);st('#8a5a3a',2.2);st('#b98a5a',.6);
    for(const s of[-1,1]){bp();el(mid+s*15.5,FACE,3,1.6);fs('#6e4630','#2e1a10',.8)}}

  // ---- 2. masse de la haie : un seul bloc continu (plus de trous entre les touffes)
  bp();G.rect(-4,-4,Wp+8,Hp+8);pts.forEach((p,i)=>i?G.lineTo(p[0],p[1]):G.moveTo(p[0],p[1]));G.closePath();
  G.save();G.clip('evenodd');
  G.fillStyle=PAL.leafDark;G.fillRect(-4,-4,Wp+8,Hp+8);
  // remplissage de touffes dans l'épaisseur
  const fill=[];
  for(let y=-2;y<Hp+4;y+=6)for(let x=-2;x<Wp+4;x+=6){const inside=x<L+2||x>Rr-2||y<TOP+2||y>B-2;if(inside)fill.push({x:x+(R()-.5)*4,y:y+(R()-.5)*4,r:4.5+R()*2.6})}
  fill.sort((a,b)=>a.y-b.y);
  for(const c of fill)leafCluster(c.x,c.y,c.r,R,pick,false);
  G.restore();

  // ---- 3. passages est, ouest et sud : sentier qui s'enfonce dans la haie
  const path=(x,y,w,h,horiz,toOut)=>{G.fillStyle=horiz?lg(toOut?x+w:x,0,toOut?x:x+w,0,[[0,PAL.soilB],[.6,'#8a6440'],[1,'#2a1810']]):lg(0,y,0,y+h,[[0,PAL.soilB],[.6,'#8a6440'],[1,'#2a1810']]);G.fillRect(x,y,w,h)};
  if(D.w)path(-4,midY-15,L+6,30,true,true);
  if(D.e)path(Rr-2,midY-15,Wp-Rr+6,30,true,false);
  if(D.s)path(mid-15,B-2,30,Hp-B+6,false,false);
  if(D.n){bp();G.rect(mid-13,-4,26,TOP+3);G.fillStyle='#120b08';G.fill()}

  // ---- 4. bordure : grosses touffes contourées le long du sol, puis embouts autour des passages
  const rim=[];
  for(let i=0;i<pts.length;i+=1){const [x,y,side]=pts[i];if(i%2&&side!=='n')continue;
    let cx_=x,cy=y;if(side==='n')cy-=3.5;else if(side==='s')cy+=3.5;else if(side==='w')cx_-=3.5;else cx_+=3.5;
    if(inGap(cx_,cy))continue;rim.push({x:cx_,y:cy,r:5.2+R()*2.4})}
  const cap=(x,y)=>rim.push({x,y,r:6+R()*1.5});
  if(D.w)for(let x=2;x<L;x+=6){cap(x,midY-18);cap(x,midY+18)}
  if(D.e)for(let x=Rr+2;x<Wp;x+=6){cap(x,midY-18);cap(x,midY+18)}
  if(D.s)for(let y=B+2;y<Hp;y+=6){cap(mid-18,y);cap(mid+18,y)}
  if(D.n)for(let y=0;y<TOP;y+=6){cap(mid-17,y);cap(mid+17,y)}
  rim.sort((a,b)=>a.y-b.y);
  for(const c of rim){bp();ci(c.x+.3,c.y+1.2,c.r+1.3);G.fillStyle='#16301f';G.fill()}
  for(const c of rim)leafCluster(c.x,c.y,c.r,R,pick,true);

  // ---- 5. lisière haie / sol : herbes qui débordent sur la terre
  for(const [x,y,side] of pts){if(side==='n'||R()<.45||inGap(x,y))continue;
    const ox=side==='w'?2.5:side==='e'?-2.5:0,oy=side==='s'?-2:2;
    const n=3+Math.floor(R()*3),dir=side==='w'?.6:side==='e'?-.6:0;
    for(let k=0;k<n;k++){const a=-Math.PI/2+dir+(k/(n-1)-.5)*1.2,l=3+R()*3.5,bx=x+ox+(k-n/2)*.8,by=y+oy+(side==='s'?0:4);
      bp();G.moveTo(bx,by);G.quadraticCurveTo(bx+Math.cos(a)*l*.4,by-l*.5,bx+Math.cos(a)*l,by+Math.sin(a)*l);st(pick(['#4f8a3e','#6fa34a','#86b85a']),1)}}
}
function leafCluster(x,y,r,R,pick,rim){
  bp();ci(x,y,r);G.fillStyle=pick(PAL.leafMid);G.fill();
  if(rim){bp();G.arc(x,y,r,.15*Math.PI,.85*Math.PI);st('rgba(20,40,26,.55)',.9)}
  bp();el(x-r*.22,y-r*.3,r*.62,r*.5);G.fillStyle=PAL.leafLight;G.fill();
  dot(x-r*.42,y-r*.5,r*.2,PAL.leafHi);
  if(rim&&R()<.35){bp();el(x+r*.4,y-r*.2,r*.32,r*.15,.6);G.fillStyle='#6fae5a';G.fill()}
  const k=R();if(k<.05){for(let i=0;i<5;i++){const a=i*TAU/5;dot(x+Math.cos(a)*1.4,y+Math.sin(a)*1.4,1,'#f7b6c6')}dot(x,y,.7,'#f0c43a')}
  else if(k<.085){dot(x+1,y,1.3,'#d8423a');dot(x-1.4,y+1,1.1,'#d8423a');dot(x+.6,y-.4,.4,'#fff')}
}
/* grille d'une porte, dessinée à chaque image (elle s'escamote quand la salle est vidée) */
function drawGate(dir,open,Wp,Hp,T){
  if(open>=1)return;const mid=Wp/2;G.save();
  const o=open*open*26;
  if(dir==='n'||dir==='s'){
    const y0=dir==='n'?6:Hp-T,y1=dir==='n'?T:Hp-4;
    bp();G.rect(mid-15,y0,30,y1-y0);G.clip();
    G.translate(0,dir==='n'?-o:o);
    for(const sx of[-9,0,9]){bp();rrect(mid+sx-2.6,y0-2,5.2,y1-y0+4,2.4);fs(lg(mid+sx-3,0,mid+sx+3,0,[[0,'#a87650'],[1,'#6e4630']]),'#3a2418',1);
      bp();G.moveTo(mid+sx,y0+(dir==='n'?y1-y0:4));G.lineTo(mid+sx-2.6,y0+(dir==='n'?y1-y0-4:0));G.lineTo(mid+sx+2.6,y0+(dir==='n'?y1-y0-4:0));G.closePath();fs('#c9a06a','#3a2418',.8)}
    bp();G.moveTo(mid-15,y0+8);for(let i=0;i<=6;i++)G.lineTo(mid-15+i*5,y0+8+(i%2?4:0));st('#3f7a3a',2);st('#6fae55',.9);
    for(const lx of[-12,3,12]){bp();el(mid+lx,y0+10,2.2,1.2,.5);fs('#7fbf5a','#24432a',.6)}
  }else{
    const x0=dir==='w'?4:Wp-T,x1=dir==='w'?T:Wp-4;
    bp();G.rect(x0,Hp/2-15,x1-x0,30);G.clip();
    G.translate(dir==='w'?-o:o,0);
    for(const sy of[-9,0,9]){bp();rrect(x0-2,Hp/2+sy-2.6,x1-x0+4,5.2,2.4);fs(lg(0,Hp/2+sy-3,0,Hp/2+sy+3,[[0,'#a87650'],[1,'#6e4630']]),'#3a2418',1)}
    bp();G.moveTo(x0+12,Hp/2-15);for(let i=0;i<=6;i++)G.lineTo(x0+12+(i%2?4:0),Hp/2-15+i*5);st('#3f7a3a',2);st('#6fae55',.9);
  }
  G.restore();
}
/* lumière d'ambiance : rayons de soleil et vignette */
function drawAmbience(room,Wp,Hp,t){
  const R=mulberry(hashStr(room.key+'light'+room.seed));
  G.save();G.globalCompositeOperation='lighter';
  for(let i=0;i<2;i++){const x0=40+R()*(Wp-120),w=18+R()*16,sk=70+R()*40,a=.07+.025*Math.sin(t*.8+i*2);
    bp();G.moveTo(x0,0);G.lineTo(x0+w,0);G.lineTo(x0+w+sk,Hp);G.lineTo(x0+sk,Hp);G.closePath();
    G.fillStyle=lg(0,0,0,Hp,[[0,`rgba(255,232,170,${a})`],[1,'rgba(255,232,170,0)']]);G.fill()}
  G.restore();
  G.fillStyle=rg(Wp/2,Hp/2,Wp*.3,Wp*.78,[[0,'rgba(40,22,14,0)'],[1,'rgba(40,22,14,.38)']]);G.fillRect(0,0,Wp,Hp);
}

/* =====================================================================
   LE HÉROS : petit gardien à capuche-feuille
   (x,y) = position des pieds.  o = {fx,fy,walk,moving,t,blink,roll,rollA}
   ===================================================================== */
function drawHeroArt(x,y,o){
  const dir=Math.abs(o.fy)>Math.abs(o.fx)*1.05?(o.fy>0?'down':'up'):'side';
  const ph=o.walk,mv=o.moving;
  const bob=mv?-Math.abs(Math.sin(ph))*1.5:Math.sin(o.t*2.4)*.45;
  shadowE(x,y,8.5,3.1);
  G.save();G.translate(x,y);
  if(dir==='side'&&o.fx<0)G.scale(-1,1);
  if(o.roll>0){G.translate(0,-11);G.rotate(o.rollA);G.scale(1,.9);G.translate(0,11)}
  const sway=mv?Math.sin(ph)*1.1:Math.sin(o.t*2)*.4;
  const lL=mv?Math.max(0,Math.sin(ph))*2.3:0,lR=mv?Math.max(0,-Math.sin(ph))*2.3:0,arm=mv?Math.sin(ph)*1.7:0;
  const skin=rg(-2.5,-22,1,9.5,[[0,'#ffe8cf'],[.7,'#ffd4ad'],[1,'#f1b388']]);
  const tunic=lg(-6,0,6,0,[[0,'#fff3da'],[.6,'#f3ddb2'],[1,'#d8bb88']]);
  const hood=lg(0,-31,0,-17,[[0,'#97d775'],[1,'#58a04c']]);
  const boot=(bx,by,rx=2.7)=>{bp();el(bx,by,rx,2.1);fs('#7a4a30');dot(bx-.8,by-.7,.6,'#a8714c')};
  if(dir==='down'){
    boot(-3,-1.9-lL);boot(3,-1.9-lR);
    bp();G.moveTo(-5.4,-13+bob);G.quadraticCurveTo(-9.6,-6+bob,-8.6+sway,-2.6);G.quadraticCurveTo(0,-.6,8.6+sway,-2.6);G.quadraticCurveTo(9.6,-6+bob,5.4,-13+bob);G.closePath();fs(lg(0,-13,0,-2,[[0,'#5f9f4e'],[1,'#3f7a3a']]));
    bp();G.moveTo(-5,-13+bob);G.quadraticCurveTo(-6.8,-7+bob,-6,-3.3);G.quadraticCurveTo(0,-1.5,6,-3.3);G.quadraticCurveTo(6.8,-7+bob,5,-13+bob);G.closePath();fs(tunic);
    bp();G.moveTo(-6.3,-6.6+bob);G.quadraticCurveTo(0,-5+bob,6.3,-6.6+bob);G.lineTo(6.1,-4.9+bob);G.quadraticCurveTo(0,-3.3+bob,-6.1,-4.9+bob);G.closePath();fl('#8a5a3a');
    bp();rrect(-1.3,-6.4+bob,2.6,2,.5);fs('#ffcf4d','#7a4a1a',.5);
    bp();G.moveTo(-4.6,-12.4+bob);G.lineTo(4.9,-6.7+bob);st('#7a4a30',1.3);
    bp();el(4.6,-3.6+bob,2,1.6);fs('#9a6842','#5a3420',.7);
    bp();ci(-6.7,-7.6+bob+arm,2.1);fs(skin);bp();ci(6.7,-7.6+bob-arm,2.1);fs(skin);
    headFront(0,-19+bob,o,skin,hood);
  }else if(dir==='up'){
    boot(-3,-1.9-lL);boot(3,-1.9-lR);
    bp();ci(-6.7,-7.6+bob-arm,2.1);fs(skin);bp();ci(6.7,-7.6+bob+arm,2.1);fs(skin);
    bp();G.moveTo(-5,-13+bob);G.quadraticCurveTo(-6.8,-7+bob,-6,-3.3);G.quadraticCurveTo(0,-1.5,6,-3.3);G.quadraticCurveTo(6.8,-7+bob,5,-13+bob);G.closePath();fs(tunic);
    bp();G.moveTo(-5.6,-13.5+bob);G.quadraticCurveTo(-9.8,-6+bob,-8.8+sway,-1.8);G.quadraticCurveTo(0,.3,8.8+sway,-1.8);G.quadraticCurveTo(9.8,-6+bob,5.6,-13.5+bob);G.closePath();fs(lg(0,-14,0,-1,[[0,'#6fb05a'],[1,'#42803c']]));
    bp();G.moveTo(0,-13+bob);G.quadraticCurveTo(-.6,-7+bob,0,-1.5);st('rgba(40,80,40,.45)',.8);
    // petite épée au dos
    G.save();G.translate(-3.5,-11+bob);G.rotate(-.75);swordShape(.75);G.restore();
    const hy=-19+bob;
    bp();ci(0,hy,8.9);fs(hood);
    bp();G.moveTo(-6.5,hy+5);G.quadraticCurveTo(0,hy+8.5,6.5,hy+5);G.quadraticCurveTo(0,hy+6.3,-6.5,hy+5);fl('#8a4b2e');
    bp();G.moveTo(0,hy-8.8);G.quadraticCurveTo(-.6,hy-2,0,hy+5);st('rgba(40,90,40,.45)',.8);
    bp();el(-3,hy-4,2.6,4,-.3);G.fillStyle='rgba(255,255,255,.18)';G.fill();
    sprout(0,hy-8.8,o.t,1);
  }else{
    const s1=mv?Math.sin(ph)*2.6:0;
    boot(-1.2-s1,-1.9-(mv?Math.max(0,-Math.sin(ph))*1.6:0),3);
    bp();G.moveTo(-3.6,-13+bob);G.quadraticCurveTo(-9.8+sway,-7+bob,-8.6+sway*1.4,-2.2);G.quadraticCurveTo(-2,-1.4,1.4,-3);G.closePath();fs(lg(0,-13,0,-2,[[0,'#5f9f4e'],[1,'#3f7a3a']]));
    bp();G.moveTo(-4,-13+bob);G.quadraticCurveTo(-5.6,-7+bob,-4.8,-3.2);G.quadraticCurveTo(.5,-1.6,5,-3.2);G.quadraticCurveTo(5.4,-7+bob,4,-13+bob);G.closePath();fs(tunic);
    boot(1.6+s1,-1.9-(mv?Math.max(0,Math.sin(ph))*1.6:0),3);
    bp();G.moveTo(-5,-6.4+bob);G.quadraticCurveTo(0,-5+bob,5.2,-6.4+bob);G.lineTo(5,-4.8+bob);G.quadraticCurveTo(0,-3.3+bob,-4.8,-4.8+bob);G.closePath();fl('#8a5a3a');
    bp();el(-4.4,-4.8+bob,1.9,1.6);fs('#9a6842','#5a3420',.7);
    bp();ci(1.2+arm*1.2,-7.4+bob,2.1);fs(skin);
    const hy=-19+bob;
    bp();ci(.8,hy,8.4);fs(skin);
    bp();G.moveTo(-8.9,hy+2.2);G.bezierCurveTo(-10,hy-9,-2,hy-12.6,2,hy-12.1);G.bezierCurveTo(7,hy-11.3,9.8,hy-6.2,8.6,hy-3.6);G.quadraticCurveTo(4,hy-5.6,-.5,hy-3.4);G.quadraticCurveTo(-3.4,hy+.8,-3.4,hy+5.4);G.quadraticCurveTo(-7.2,hy+5.8,-8.9,hy+2.2);G.closePath();fs(hood);
    bp();G.moveTo(-.3,hy-3.5);G.quadraticCurveTo(3,hy-1,4.5,hy-2.4);G.quadraticCurveTo(6.5,hy-.6,8.5,hy-3.3);G.quadraticCurveTo(4,hy-5.5,-.3,hy-3.5);fl('#8a4b2e');
    bp();G.moveTo(-2,hy-4.3);G.quadraticCurveTo(3.5,hy-6.9,8,hy-4.6);st('#b0e08c',.9);
    const e=o.blink?'closed':'normal';
    if(e==='closed'){bp();G.moveTo(3.4,hy+2.3);G.quadraticCurveTo(4.6,hy+3.3,5.8,hy+2.3);st('#2b1d1a',1)}
    else{bp();el(4.7,hy+2.3,1.55,2.2);fl('#2b1d1a');dot(4.25,hy+1.5,.72,'#fff');dot(5.2,hy+3.1,.3,'#fff')}
    if(!FLASH){bp();el(5.6,hy+5,1.6,1);G.fillStyle='rgba(255,120,110,.5)';G.fill()}
    bp();G.moveTo(7.2,hy+5.6);G.quadraticCurveTo(8,hy+6.3,8.7,hy+5.4);st('#7a3b2a',.8);
    sprout(1,hy-12,o.t,-1);
  }
  G.restore();
}
function headFront(hx,hy,o,skin,hood){
  bp();ci(hx,hy,8.4);fs(skin);
  bp();G.moveTo(-7.8,hy-1.4);G.quadraticCurveTo(-6,hy+1.6,-4.2,hy-1.1);G.quadraticCurveTo(-2.2,hy+1.9,0,hy-.9);G.quadraticCurveTo(2.2,hy+1.9,4.2,hy-1.1);G.quadraticCurveTo(6,hy+1.6,7.8,hy-1.4);G.lineTo(7.8,hy-5);G.lineTo(-7.8,hy-5);G.closePath();fl('#8a4b2e');
  bp();G.moveTo(-9.2,hy+1.6);G.bezierCurveTo(-10.3,hy-9,-4,hy-12.6,0,hy-12.3);G.bezierCurveTo(4,hy-12.6,10.3,hy-9,9.2,hy+1.6);G.quadraticCurveTo(8,hy-4.4,0,hy-5.1);G.quadraticCurveTo(-8,hy-4.4,-9.2,hy+1.6);G.closePath();fs(hood);
  bp();G.moveTo(-7.4,hy-3.5);G.quadraticCurveTo(0,hy-6.5,7.4,hy-3.5);st('#b0e08c',1);
  bp();G.moveTo(0,hy-12.1);G.quadraticCurveTo(-.5,hy-9,0,hy-5.8);st('rgba(40,90,40,.5)',.8);
  bp();el(-4.5,hy-8.5,2.4,1.3,-.5);G.fillStyle='rgba(255,255,255,.25)';G.fill();
  eyePair(hx,hy+2.7,3.35,1.6,2.2,null,o.blink?'closed':'normal',o.t);
  cheeks(hx,hy+5,5.3);
  bp();G.moveTo(-1,hy+5.5);G.quadraticCurveTo(0,hy+6.5,1,hy+5.5);st('#7a3b2a',.8);
  sprout(0,hy-12.1,o.t,1);
}
function sprout(x,y,t,s){
  bp();G.moveTo(x,y);G.quadraticCurveTo(x+s*1.2,y-3.4,x+s*3.2,y-4.4);st(OUT,1.7);st('#5a9e4c',.8);
  G.save();G.translate(x+s*5.2,y-4.9);G.rotate(-s*.3+Math.sin(t*3)*.18);bp();el(0,0,3.1,1.7);fs('#97d775',OUT,.9);bp();G.moveTo(-2.4,0);G.lineTo(2.4,0);st('rgba(40,90,40,.5)',.5);G.restore();
}
/* l'épée, pointant vers +x depuis la garde */
function swordShape(s=1){
  G.save();G.scale(s,s);
  bp();rrect(-5,-1.1,5,2.2,1);fs('#8a5a3a',OUT,.9);dot(-5.6,0,1.4,'#ffcf4d');
  bp();G.moveTo(1,-1.7);G.lineTo(13,-1.3);G.lineTo(15.6,0);G.lineTo(13,1.3);G.lineTo(1,1.7);G.closePath();fs(lg(0,-2,0,2,[[0,'#ffffff'],[.5,'#dfe5ee'],[1,'#a9b4c4']]),OUT,.9);
  bp();G.moveTo(2,-.3);G.lineTo(12.5,-.2);st('rgba(255,255,255,.9)',.5);
  bp();el(.4,-2.6,1.5,2.4,.4);fs('#7fbf5a',OUT,.7);bp();el(.4,2.6,1.5,2.4,-.4);fs('#7fbf5a',OUT,.7);
  G.restore();
}
function drawSwordSwing(x,y,a,p){
  const a0=a-1.3,cur=a0+p*2.6,from=Math.max(a0,cur-1.5);
  G.save();G.translate(x,y);
  bp();G.arc(0,0,23,from,cur);G.arc(0,0,12,cur,from,true);G.closePath();
  G.fillStyle=`rgba(255,255,255,${.55*(1-p*.5)})`;G.fill();
  bp();G.arc(0,0,22.5,from+.2,cur);st('rgba(255,250,220,.9)',1.2);
  G.rotate(cur);G.translate(6,0);swordShape(1.05);
  G.restore();
}

/* =====================================================================
   BRAISOU : petit esprit de braise, le premier trognon
   ===================================================================== */
function flamePath(w,h,t){
  bp();G.moveTo(w,4);G.arc(0,4,w,0,Math.PI);
  const lx=-w*.62+Math.sin(t*9)*.8,ly=-h*.55+Math.sin(t*11)*1.2,cx_=Math.sin(t*7)*1.4,cy=-h+Math.sin(t*13)*1.5,rx=w*.62+Math.sin(t*10+1)*.8,ry=-h*.5+Math.sin(t*12)*1.2;
  G.quadraticCurveTo(-w*1.08,-h*.15,lx,ly);G.quadraticCurveTo(-w*.25,-h*.32,cx_,cy);G.quadraticCurveTo(w*.18,-h*.38,rx,ry);G.quadraticCurveTo(w*1.08,-h*.12,w,4);G.closePath();
}
function drawBraisouArt(x,y,t,sq,look,mode){
  glow(x,y,26,'255,150,60',.32+.06*Math.sin(t*9));
  shadowE(x,y+15,5.5,2,.16);
  G.save();G.translate(x,y);G.scale(1+sq*.3,1-sq*.22);
  flamePath(9,15.5,t);fs(lg(0,-15,0,13,[[0,'#ff5a2a'],[1,'#ff8a3a']]),'#6e2410',1.1);
  flamePath(6.6,11,t+1.3);fl('#ffad42');
  bp();el(0,4,5.3,4.7);fl(rg(0,5,0,5.5,[[0,'#fff6c2'],[1,'#ffd56a']]));
  for(const s of[-1,1]){bp();el(s*8.4,5,1.9,1.5,s*.4);fs('#ff8a3a','#6e2410',.8)}
  eyePair(0,3,2.4,1.15,1.6,look,mode||'normal',t,'#3a1408');
  cheeks(0,5.6,3.8,1.2,.75,.55);
  bp();G.moveTo(-.8,6.4);G.quadraticCurveTo(0,7.2,.8,6.4);st('#3a1408',.7);
  G.restore();
}

/* =====================================================================
   MONSTRES
   o = {t, look:{x,y}, mode:'normal'|'angry'|'dizzy', sq, hop, bloom}
   ===================================================================== */
function drawGloutonArt(x,y,o){
  const hop=o.hop||0;
  shadowE(x,y,11*(1-hop*.25),3.6*(1-hop*.25));
  G.save();G.translate(x,y-hop*8);
  const wob=Math.sin(o.t*6)*.05;let sx=1+wob+o.sq*.28,sy=1-wob-o.sq*.22;if(hop>.05){sx-=.1;sy+=.14}
  G.scale(sx,sy);
  const ink='#3d2350';
  bp();G.moveTo(-12,0);G.bezierCurveTo(-13.2,-10,-8,-19,0,-19);G.bezierCurveTo(8,-19,13.2,-10,12,0);G.quadraticCurveTo(6,2.3,0,1.7);G.quadraticCurveTo(-6,2.3,-12,0);G.closePath();
  fs(lg(0,-19,0,2,[[0,'#d2b0fa'],[.5,'#a77de0'],[1,'#7650b4']]),ink,1.25);
  if(!FLASH){dot(-6,-5,1.7,'rgba(255,255,255,.22)');dot(6.5,-3.5,1.1,'rgba(255,255,255,.22)');dot(3,-1.5,.8,'rgba(255,255,255,.22)');dot(-2,-2,.6,'rgba(255,255,255,.2)')}
  bp();el(-5.6,-13.2,3.7,2.2,-.6);fl('rgba(255,255,255,.72)');dot(-1.4,-15.6,.9,'rgba(255,255,255,.85)');
  bp();el(-8,.6,1.7,1.5);fl('#6e46a6');bp();el(7.5,.8,1.4,1.3);fl('#6e46a6');
  bp();G.moveTo(0,-18.8);G.quadraticCurveTo(.4,-21.8,2,-23);st(ink,1.7);st('#6b8a3a',.8);
  G.save();G.translate(4.3,-22.6);G.rotate(-.35+Math.sin(o.t*4)*.15);bp();el(0,0,2.9,1.45);fs('#8cc66d',ink,.9);G.restore();
  eyePair(0,-9.5,4.3,1.95,2.55,o.look,o.mode,o.t);
  cheeks(0,-5.6,7.3,1.6,1,.45);
  if(o.mode==='dizzy'){bp();G.moveTo(-2,-3.6);G.quadraticCurveTo(-1,-4.6,0,-3.6);G.quadraticCurveTo(1,-2.6,2,-3.6);st(ink,.9)}
  else if(hop>.05||o.sq>.3){bp();el(0,-3.8,3.2,2.3);fs('#4a1f5a',ink,.8);bp();el(0,-2.6,1.9,1);fl('#ff8fb0')}
  else{bp();G.moveTo(-2.2,-4.4);G.quadraticCurveTo(0,-2.5,2.2,-4.4);st(ink,1)}
  G.restore();
}
function drawEpineuxArt(x,y,o){
  const ink='#24432a',bloom=o.bloom||0;
  shadowE(x,y,11,3.6);
  G.save();G.translate(x,y);
  for(const s of[-1,1])for(const k of[0,1]){bp();G.moveTo(s*3,-1);G.quadraticCurveTo(s*(7+k*2),1+k,s*(11-k*3),2.5+k*1.5);st('#5a3824',1.8);st('#8a5a3a',.7)}
  for(const s of[-1,1]){G.save();G.translate(s*7.5,-7);G.rotate(s*(.55+Math.sin(o.t*3+s)*.12+(o.sq||0)*.4));
    bp();G.moveTo(0,0);G.quadraticCurveTo(s*5,-4,s*10,0);G.quadraticCurveTo(s*5,3.4,0,0);G.closePath();fs(lg(0,-3,0,3,[[0,'#8fd06a'],[1,'#4f8f3e']]),ink,.9);
    bp();G.moveTo(s*.8,0);G.lineTo(s*8,0);st('rgba(36,67,42,.5)',.5);G.restore()}
  G.save();G.scale(1+(o.sq||0)*.12,1-(o.sq||0)*.1);
  const spikes=[[-9.8,-8,-2.6],[-9,-14.5,-2.2],[9.8,-8,-.5],[9,-14.5,-.9],[-6.8,-2.8,-2.4],[6.8,-2.8,-.7],[-4.6,-19,-2],[4.6,-19,-1.1]];
  for(const [sx,sy,a] of spikes){G.save();G.translate(sx,sy);G.rotate(a);bp();G.moveTo(0,-1.4);G.lineTo(3.8,0);G.lineTo(0,1.4);G.closePath();fs('#fff1cc',ink,.7);G.restore()}
  bp();G.moveTo(0,-20.5);G.bezierCurveTo(9.4,-19.5,11.2,-8,8,-1.6);G.quadraticCurveTo(0,1.2,-8,-1.6);G.bezierCurveTo(-11.2,-8,-9.4,-19.5,0,-20.5);G.closePath();
  fs(lg(-9,0,9,0,[[0,'#a6dc80'],[.5,'#7cbf5a'],[1,'#56953f']]),ink,1.25);
  for(const s of[-1,1]){bp();G.moveTo(s*3.6,-19.2);G.quadraticCurveTo(s*5.8,-10,s*4.2,-1);st('rgba(36,67,42,.33)',.9)}
  bp();el(-4.4,-14.5,2.2,3.6,.25);fl('rgba(255,255,255,.25)');
  // bouton de fleur au sommet (s'ouvre quand il tire)
  const pl=2.6+bloom*3.4;
  for(let i=0;i<5;i++){G.save();G.translate(0,-21);G.rotate(i*TAU/5+o.t*.3);bp();el(0,-pl*.6,1.8+bloom*.8,pl*.62);fs('#f592b4','#7a2a4a',.7);G.restore()}
  dot(0,-21,1.5+bloom*.6,'#ffd24d');
  eyePair(0,-11,3.7,1.7,2.2,o.look,o.mode==='dizzy'?'dizzy':'angry',o.t);
  if(o.mode!=='dizzy'){bp();G.moveTo(-2.4,-6.2);G.quadraticCurveTo(0,-4.6,2.4,-6.2);st(ink,.9);
    for(const s of[-1,1]){bp();G.moveTo(s*1.6,-5.4);G.lineTo(s*1,-4.1);G.lineTo(s*.5,-5.2);G.closePath();fl('#ffffff')}}
  G.restore();G.restore();
}
function drawBourdonArt(x,y,o){
  const ink='#3a2622',fly=Math.sin(o.t*5)*1.5;
  shadowE(x,y+13,7,2.4,.2);
  G.save();G.translate(x,y+fly);
  if(o.look&&o.look.x<-.2)G.scale(-1,1);
  const flap=Math.abs(Math.sin(o.t*48));
  for(const [wx,wr] of[[-2.5,-.55],[3,.45]]){G.save();G.translate(wx,-7);G.rotate(wr);G.scale(1,.45+.55*flap);bp();el(0,-5.5,3.8,6.2);fs('rgba(225,242,255,.72)','rgba(255,255,255,.95)',.8);bp();G.moveTo(0,-1);G.lineTo(0,-9);st('rgba(160,190,220,.6)',.4);G.restore()}
  bp();G.moveTo(-2,8);G.lineTo(0,12.5);G.lineTo(2,8);G.closePath();fs('#3a2622',ink,.6);
  for(let i=0;i<18;i++){const a=i/18*TAU;bp();ci(Math.cos(a)*8.4,Math.sin(a)*7.8,2.2);fl(ink)}
  bp();el(0,0,9,8.4);fl(lg(0,-8,0,8,[[0,'#ffe27a'],[1,'#f2b52e']]));
  for(let i=0;i<18;i++){const a=i/18*TAU;bp();ci(Math.cos(a)*8.4,Math.sin(a)*7.8,1.45);fl(i>11||i<3?'#f6c23e':'#ffd85a')}
  G.save();bp();el(0,0,9.4,8.8);G.clip();
  bp();G.moveTo(-10,3);G.quadraticCurveTo(0,5.5,10,3);G.lineTo(10,5.6);G.quadraticCurveTo(0,8.1,-10,5.6);G.closePath();fl('#3a2622');
  bp();G.moveTo(-10,7.8);G.quadraticCurveTo(0,10.3,10,7.8);G.lineTo(10,11);G.lineTo(-10,11);G.closePath();fl('#3a2622');
  G.restore();
  bp();el(-3.6,-4.6,2.6,1.6,-.4);fl('rgba(255,255,255,.55)');
  for(const s of[-1,1]){bp();G.moveTo(s*2.4,-7.4);G.quadraticCurveTo(s*3,-11,s*5,-12.6);st(ink,.9);dot(s*5.2,-12.8,1.3,ink)}
  eyePair(0,-1.4,3.2,1.65,2.1,null,o.mode,o.t);
  cheeks(0,1.4,5.6,1.4,.85,.5);
  if(o.mode==='angry'){bp();G.moveTo(-1.2,2.4);G.lineTo(1.2,2.4);st(ink,.9)}
  else if(o.mode!=='dizzy'){bp();G.moveTo(-1,1.8);G.quadraticCurveTo(0,2.8,1,1.8);st(ink,.8)}
  G.restore();
}
function drawAura(x,y,r,t){
  glow(x,y,r+16,'255,205,80',.38+.12*Math.sin(t*4));
  for(let i=0;i<3;i++){const a=t*1.8+i*TAU/3;sparkle(x+Math.cos(a)*(r+7),y+Math.sin(a)*(r+4)*.7,2+Math.sin(t*6+i)*.8,'#fff3b0')}
}
function drawStunStars(x,y,t){for(let i=0;i<3;i++){const a=t*3+i*TAU/3;star5(x+Math.cos(a)*10,y+Math.sin(a)*3,2.6,'#ffd84d')}}
function drawAimLine(x,y,dx,dy,p){G.save();G.setLineDash([3,4]);G.lineDashOffset=-p*20;bp();G.moveTo(x,y);G.lineTo(x+dx*70,y+dy*70);st(`rgba(226,87,74,${.35+p*.5})`,1.6);G.restore()}
function drawBubble(x,y,txt){bp();rrect(x-6,y-14,12,12,5);fs('#fff8ec',OUT,1);bp();G.moveTo(x-2,y-2.4);G.lineTo(x,y+1.5);G.lineTo(x+2,y-2.4);fl('#fff8ec');G.fillStyle='#e2574a';G.font='700 10px Fredoka, sans-serif';G.textAlign='center';G.fillText(txt,x,y-4.4)}

/* =====================================================================
   BUTIN, COFFRE, PORTAIL, TIRS
   ===================================================================== */
function drawFibreArt(x,y,b){shadowE(x,y+1,4,1.5,.2);G.save();G.translate(x,y-3+b);G.rotate(-.2);
  for(const [a,c] of[[-.35,'#5e9a48'],[0,'#7cbf5a'],[.35,'#93cf6c']]){G.save();G.rotate(a);bp();G.moveTo(0,4);G.quadraticCurveTo(-2.4,-1,0,-6.5);G.quadraticCurveTo(2.4,-1,0,4);fs(c,'#24432a',.7);G.restore()}
  bp();G.moveTo(-2,1.8);G.lineTo(2,1.8);st('#c9a06a',1.3);G.restore()}
function drawEclatArt(x,y,b,t){glow(x,y-4+b,9,'255,210,90',.3);shadowE(x,y+1,3.8,1.4,.2);G.save();G.translate(x,y-4+b);
  bp();G.moveTo(0,-6.5);G.lineTo(4.6,-1.8);G.lineTo(3,4.5);G.lineTo(-3,4.5);G.lineTo(-4.6,-1.8);G.closePath();fs('#ffc93d','#8a5a1a',.8);
  bp();G.moveTo(0,-6.5);G.lineTo(-4.6,-1.8);G.lineTo(-1.2,-.6);G.closePath();fl('#fff1a8');
  bp();G.moveTo(0,-6.5);G.lineTo(4.6,-1.8);G.lineTo(1.2,-.6);G.closePath();fl('#ffe066');
  bp();G.moveTo(-1.2,-.6);G.lineTo(1.2,-.6);G.lineTo(3,4.5);G.lineTo(-3,4.5);G.closePath();fl('#f2a92a');
  const s=Math.max(0,Math.sin(t*3));if(s>.7)sparkle(2.5,-5,2.4*(s-.7)/.3,'#ffffff');G.restore()}
function drawHeartArt(x,y,b,s=4.6){shadowE(x,y+1,3.8,1.4,.2);G.save();G.translate(x,y-4+b);heartPath(s);fs(lg(0,-s,0,s,[[0,'#ff7b6b'],[1,'#d9372e']]),'#6e1a14',.9);bp();el(-s*.45,-s*.45,s*.28,s*.18,-.6);fl('rgba(255,255,255,.75)');G.restore()}
function drawEggArt(x,y,b,t){
  glow(x,y-6,20,'255,235,160',.32+.1*Math.sin(t*3));
  shadowE(x,y+3,11,3.2,.25);
  for(let i=0;i<9;i++){const a=i/9*TAU;bp();G.moveTo(x+Math.cos(a)*5,y+1+Math.sin(a)*2);G.lineTo(x+Math.cos(a+.9)*11,y+1+Math.sin(a+.9)*3.6);st(i%2?'#8a5a3a':'#a87650',1.5)}
  bp();el(x,y+.5,10,3.4);st('#6e4630',1.2);
  G.save();G.translate(x,y-6+b*.5);G.rotate(Math.sin(t*2)*.06);
  bp();G.moveTo(0,-9.5);G.bezierCurveTo(6.6,-9.5,8,1,7,4);G.bezierCurveTo(5.6,7.6,-5.6,7.6,-7,4);G.bezierCurveTo(-8,1,-6.6,-9.5,0,-9.5);G.closePath();fs(lg(-6,0,6,0,[[0,'#fffaf0'],[1,'#f1e0c2']]),OUT,1);
  dot(-2.6,-3,1.7,'#7cc6e6');dot(2.8,1.4,1.4,'#f49ab4');dot(.6,-6,1,'#9bd47a');dot(-3.6,3,1,'#f49ab4');dot(3.6,-3.4,.9,'#7cc6e6');
  bp();el(-3,-5.5,1.5,2.6,.3);fl('rgba(255,255,255,.8)');G.restore();
  if(Math.sin(t*2.3)>.6)sparkle(x+7,y-14,2.4,'#fff')}
function drawChestArt(x,y,open,t){
  if(open)glow(x,y-10,24,'255,220,120',.35);
  shadowE(x,y+5,13,3.6,.3);G.save();G.translate(x,y);
  if(open){bp();G.moveTo(-11,-9);G.lineTo(11,-9);G.lineTo(10,-19);G.quadraticCurveTo(0,-23,-10,-19);G.closePath();fs('#8a5a32','#3a2418',1.1);
    bp();G.moveTo(-6,-9);G.lineTo(-5.5,-19.8);st('#6e6a78',2.2);bp();G.moveTo(6,-9);G.lineTo(5.5,-19.8);st('#6e6a78',2.2)}
  bp();rrect(-11.5,-9,23,14,2.5);fs(lg(0,-9,0,5,[[0,'#c9874b'],[1,'#9a5e30']]),'#3a2418',1.2);
  for(const ly of[-4.5,0]){bp();G.moveTo(-11,ly);G.lineTo(11,ly);st('rgba(60,30,15,.35)',.6)}
  for(const bx of[-7.5,7.5]){bp();rrect(bx-1.6,-9,3.2,14,.8);fs('#7d7a88','#3a2a2a',.7);dot(bx,-6.5,.6,'#d8d6e0');dot(bx,2,.6,'#d8d6e0')}
  if(open){bp();el(0,-9,10.5,2.2);fl('#3a2214');for(let i=0;i<4;i++)dot(-4+i*2.6,-9.6+Math.sin(i)*.4,1.4,'#ffd24d')}
  else{bp();G.moveTo(-11.5,-8.5);G.quadraticCurveTo(0,-18,11.5,-8.5);G.closePath();fs(lg(0,-17,0,-8,[[0,'#dc9a5a'],[1,'#b57440']]),'#3a2418',1.2);
    bp();G.moveTo(-7.5,-8.7);G.quadraticCurveTo(-7,-14.8,-5.8,-15.4);st('#7d7a88',2.4);bp();G.moveTo(7.5,-8.7);G.quadraticCurveTo(7,-14.8,5.8,-15.4);st('#7d7a88',2.4);
    bp();rrect(-2.2,-10.6,4.4,5,1.2);fs('#ffcf4d','#7a4a1a',.8);dot(0,-8.4,.8,'#5a3410');
    if(Math.sin(t*2)>.8)sparkle(-6,-13,2,'#fff')}
  G.restore()}
function drawPortalArt(x,y,t){
  glow(x,y,34,'150,120,255',.35+.08*Math.sin(t*3));
  G.save();G.translate(x,y);
  bp();el(0,1.5,19,11);G.fillStyle='rgba(40,20,60,.35)';G.fill();
  G.save();bp();el(0,0,15.5,9);G.clip();
  bp();el(0,0,16,9.5);G.fillStyle=rg(0,0,0,16,[[0,'#d8ccff'],[.35,'#8f74e6'],[1,'#2e1c5a']]);G.fill();
  for(let i=0;i<6;i++){bp();G.ellipse(0,0,3+i*2.3,1.7+i*1.3,0,t*(2.2-i*.15)+i,t*(2.2-i*.15)+i+2.3);st(`rgba(230,220,255,${.75-i*.1})`,1.1)}
  G.restore();
  bp();el(0,0,16.5,10);st('#3a2418',4.6);st('#8a5a3a',2.6);bp();G.ellipse(0,0,16.5,10,0,Math.PI*1.1,Math.PI*1.6);st('#b98a5a',1);
  for(const [a,c] of[[.4,'#7fbf5a'],[2.2,'#93cf6c'],[3.6,'#6fae55'],[5.2,'#7fbf5a']]){G.save();G.translate(Math.cos(a)*16.5,Math.sin(a)*10);G.rotate(a+1.2);bp();el(0,0,3.2,1.5);fs(c,'#24432a',.6);G.restore()}
  G.restore();
  G.fillStyle='#fff8ec';G.strokeStyle=OUT;G.lineWidth=3;G.lineJoin='round';G.font='600 10px Fredoka, sans-serif';G.textAlign='center';
  const ly=y-18+Math.sin(t*2)*1.2;G.strokeText('Sortie',x,ly);G.fillText('Sortie',x,ly);
}
function drawFireballArt(x,y,vx,vy,t){
  glow(x,y,16,'255,140,50',.5);
  G.save();G.translate(x,y);G.rotate(Math.atan2(vy,vx));
  bp();G.moveTo(7,0);G.bezierCurveTo(6,-6,-3,-6,-13,-1+Math.sin(t*40)*1.2);G.bezierCurveTo(-3,6,6,6,7,0);fs('#ff6a2e','#6e2410',.8);
  bp();G.moveTo(5.4,0);G.bezierCurveTo(4.6,-3.6,-1,-3.6,-7,0);G.bezierCurveTo(-1,3.6,4.6,3.6,5.4,0);fl('#ffb347');
  dot(2.6,0,2.4,'#fff4c2');G.restore()}
function drawSeedArt(x,y,t){
  G.save();G.translate(x,y);G.rotate(t*12);
  for(let i=0;i<6;i++){const a=i*TAU/6;bp();G.moveTo(Math.cos(a)*3,Math.sin(a)*3);G.lineTo(Math.cos(a+.25)*6.2,Math.sin(a+.25)*6.2);st('#2f5a2a',1.2)}
  bp();ci(0,0,4);fs(rg(-1.2,-1.2,0,4.4,[[0,'#b8e08a'],[1,'#4f8a3e']]),'#24432a',.9);dot(-1.2,-1.3,.9,'rgba(255,255,255,.7)');G.restore()}

/* =====================================================================
   INTERFACE
   ===================================================================== */
function drawHudHeart(x,y,s,v){
  G.save();G.translate(x,y);
  heartPath(s);G.fillStyle='rgba(58,38,34,.25)';G.save();G.translate(0,1.4);G.fill();G.restore();
  heartPath(s);fs('#d6bf9a','#8a6a48',1.1);
  if(v>0){G.save();if(v<1){bp();G.rect(-s*1.5,-s*1.5,s*1.5,s*3);G.clip()}heartPath(s);fs(lg(0,-s,0,s,[[0,'#ff8070'],[1,'#d1322a']]),'#6e1a14',1.1);bp();el(-s*.45,-s*.42,s*.3,s*.18,-.6);fl('rgba(255,255,255,.8)');G.restore()}
  G.restore();
}
function drawIcon(kind,x,y,t=0){
  if(kind==='fibre')drawFibreArt(x,y+4,0);
  else if(kind==='eclat'){G.save();G.translate(x,y+4);G.scale(.9,.9);drawEclatArt(0,0,0,t);G.restore()}
  else if(kind==='oeuf'){G.save();G.translate(x,y);G.scale(.62,.62);bp();G.moveTo(0,-9.5);G.bezierCurveTo(6.6,-9.5,8,1,7,4);G.bezierCurveTo(5.6,7.6,-5.6,7.6,-7,4);G.bezierCurveTo(-8,1,-6.6,-9.5,0,-9.5);G.closePath();fs('#fff6e6',OUT,1.6);dot(-2.6,-3,1.8,'#7cc6e6');dot(2.8,1.4,1.5,'#f49ab4');G.restore()}
  else if(kind==='trognon'){G.save();G.translate(x,y+5.5);G.scale(.5,.5);drawGloutonArt(0,0,{t,look:{x:0,y:0},mode:'happy',sq:0,hop:0});G.restore()}
}
function panel(x,y,w,h,r=12){
  bp();rrect(x,y+2.5,w,h,r);G.fillStyle='rgba(120,84,50,.35)';G.fill();
  bp();rrect(x,y,w,h,r);G.fillStyle=lg(0,y,0,y+h,[[0,'#fff8ea'],[1,'#f6e6c8']]);G.fill();st('#c9a676',1.4);
  bp();rrect(x+3,y+3,w-6,h-6,r-3);st('rgba(201,166,118,.45)',.8);
}
function text(t,x,y,size,col='#4a3324',align='left',weight=600,outline=null){
  G.font=`${weight} ${size}px Fredoka, "Trebuchet MS", sans-serif`;G.textAlign=align;
  if(outline){G.strokeStyle=outline;G.lineWidth=size*.28;G.lineJoin='round';G.strokeText(t,x,y)}
  G.fillStyle=col;G.fillText(t,x,y);
}
function drawButtonArt(b,base,dark,icon,cd,pressed,t){
  const y=b.y+(pressed?2.5:0);
  bp();ci(b.x,b.y+4.5,b.r);G.fillStyle=dark;G.fill();
  bp();ci(b.x,y,b.r);G.fillStyle=rg(b.x-b.r*.35,y-b.r*.45,b.r*.1,b.r*1.15,[[0,lighten(base)],[1,base]]);G.fill();st(dark,1.6);
  bp();el(b.x-b.r*.3,y-b.r*.5,b.r*.45,b.r*.22,-.4);G.fillStyle='rgba(255,255,255,.35)';G.fill();
  G.save();G.translate(b.x,y);const s=b.r/30;G.scale(s,s);
  if(icon==='sword'){G.rotate(-Math.PI/4);G.translate(-6,0);G.scale(1.3,1.3);swordShape(1)}
  else if(icon==='heart'){heartPath(13);fs('#ffffff',dark,2.2);bp();el(-5,-5,2.6,1.6,-.6);fl('rgba(255,180,180,.6)')}
  else if(icon==='flame'){G.scale(1.25,1.25);flamePath(8,13,t);fs('#fff3d0',dark,1.6);flamePath(5,8.5,t+1);fl('#ffcf6a')}
  else if(icon==='roll'){bp();G.arc(0,0,11,-2.6,1.9);st(dark,7.5);st('#ffffff',4.5);bp();G.moveTo(-5,-12.5);G.lineTo(-11.5,-5.5);G.lineTo(-1,-3.5);G.closePath();fs('#ffffff',dark,1.6)}
  G.restore();
  if(cd>0){G.save();bp();G.moveTo(b.x,y);G.arc(b.x,y,b.r,-Math.PI/2,-Math.PI/2+TAU*cd);G.closePath();G.fillStyle='rgba(58,38,34,.45)';G.fill();G.restore()}
}
function lighten(hex){const n=parseInt(hex.slice(1),16),r=Math.min(255,(n>>16)+60),g=Math.min(255,((n>>8)&255)+60),b=Math.min(255,(n&255)+60);return`rgb(${r},${g},${b})`}
function drawControlPad(W,H,y0){
  G.fillStyle=lg(0,y0,0,H,[[0,'#e9d3ab'],[1,'#d9bd8f']]);G.fillRect(0,y0,W,H-y0);
  const R=mulberry(7);
  for(let i=0;i<160;i++){G.fillStyle='rgba(140,100,60,.12)';G.fillRect(R()*W,y0+R()*(H-y0),1+R()*2,1)}
  // frise de feuillage
  bp();G.moveTo(0,y0);for(let x=0;x<=W;x+=12)G.quadraticCurveTo(x+6,y0+7,x+12,y0);G.lineTo(W,y0-2);G.lineTo(0,y0-2);G.closePath();G.fillStyle='#4f8a45';G.fill();
  for(let x=6;x<W;x+=24){G.save();G.translate(x,y0+3);G.rotate(.5);bp();el(0,0,4,1.8);fs('#7fbf5a','#24432a',.6);G.restore()}
  G.fillStyle='rgba(58,38,34,.18)';G.fillRect(0,y0+6,W,2);
}
function drawJoystickArt(bx,by,kx,ky,active){
  bp();ci(bx,by+3,46);G.fillStyle='rgba(120,84,50,.25)';G.fill();
  bp();ci(bx,by,46);G.fillStyle=rg(bx,by,10,46,[[0,'rgba(255,248,234,.55)'],[1,'rgba(201,166,118,.55)']]);G.fill();st('rgba(138,106,72,.6)',1.5);
  for(let i=0;i<4;i++){const a=i*Math.PI/2;G.save();G.translate(bx+Math.cos(a)*36,by+Math.sin(a)*36);G.rotate(a);bp();G.moveTo(3,0);G.lineTo(-2,-3.5);G.lineTo(-2,3.5);G.closePath();G.fillStyle='rgba(138,106,72,.55)';G.fill();G.restore()}
  bp();ci(kx,ky+3,21);G.fillStyle='#8a6a48';G.fill();
  bp();ci(kx,ky,21);G.fillStyle=rg(kx-6,ky-7,2,24,[[0,'#f6dfb6'],[1,'#c9a26e']]);G.fill();st('#8a6a48',1.4);
  bp();ci(kx,ky,13);st('rgba(138,106,72,.4)',1);
}

/* =====================================================================
   ROULADE : le héros se roule en boule dans sa cape-feuille
   p = avancement 0..1, (dx,dy) = direction
   ===================================================================== */
function drawHeroRollArt(x,y,p,dx,dy,ghost){
  const sgn=dx<-.1?-1:1,a=p*TAU*1.25*sgn;
  let sx=1,sy=1,lift=Math.sin(p*Math.PI)*3;
  if(p<.14){const k=p/.14;sx=1+.25*(1-k);sy=1-.22*(1-k)}
  else if(p>.86){const k=(p-.86)/.14;sx=1+.2*k;sy=1-.18*k}
  if(!ghost)shadowE(x,y,8*(1-lift*.04),3*(1-lift*.04));
  G.save();G.translate(x,y-9.5-lift);G.scale(sx,sy);
  if(!ghost){ // traits de vitesse derrière
    const n=norm2(dx,dy);G.save();G.globalAlpha=.55*Math.sin(p*Math.PI);
    for(const o of[-5,0,5]){const px=-n.x*13+(-n.y)*o,py=-n.y*13+n.x*o;bp();G.moveTo(px,py);G.lineTo(px-n.x*(7+Math.abs(o)*.3),py-n.y*(7+Math.abs(o)*.3));st('#fff8ec',1.6)}
    G.restore()}
  G.rotate(a);
  bp();ci(0,0,9.6);fs(lg(0,-9.6,0,9.6,[[0,'#97d775'],[1,'#4c8f43']]),ghost?null:OUT,1.1);
  if(ghost){G.restore();return}
  // nervure de la cape et pan de tunique
  bp();G.moveTo(0,-9.4);G.quadraticCurveTo(3.4,0,0,9.4);st('rgba(40,90,40,.5)',.9);
  bp();G.arc(0,0,9.6,.35,1.25);G.arc(0,0,5.6,1.25,.35,true);G.closePath();fl('#f3ddb2');st(OUT,.8);
  // visage niché, yeux plissés
  bp();ci(-4.4,3.2,3.4);fs('#ffd9b5',OUT,.8);
  bp();G.moveTo(-6,3);G.quadraticCurveTo(-5.4,2,-4.8,3);st('#2b1d1a',.7);bp();G.moveTo(-3.9,3.4);G.quadraticCurveTo(-3.3,2.4,-2.7,3.4);st('#2b1d1a',.7);
  // bottes
  bp();el(5.6,-5.2,2.4,1.8,.8);fs('#7a4a30',OUT,.8);bp();el(7.2,-1.6,2.3,1.7,1.2);fs('#7a4a30',OUT,.8);
  // la pousse dépasse
  bp();G.moveTo(-2,-9.2);G.quadraticCurveTo(-3.6,-11.6,-5.6,-12);st(OUT,1.5);st('#5a9e4c',.7);
  bp();el(-7.4,-12.1,2.4,1.3,.3);fs('#97d775',OUT,.8);
  bp();el(-3.4,-5.2,2.6,1.4,-.7);G.fillStyle='rgba(255,255,255,.3)';G.fill();
  G.restore();
}
function norm2(x,y){const l=Math.hypot(x,y)||1;return{x:x/l,y:y/l}}
function drawTargetMark(x,y,t){
  G.save();G.translate(x,y);
  for(let i=0;i<4;i++){const a=t*2+i*Math.PI/2;bp();G.arc(0,0,13,a,a+.9);st('#fff2c2',3.2);bp();G.arc(0,0,13,a,a+.9);st('#ff8a3a',1.6)}
  G.restore();
}
