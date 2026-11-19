'use strict';
/* =====================================================================
   Trognons & Donjons — refuge.js
   Le refuge : couveuse, trognons qui grandissent, expéditions.
   Les minuteries utilisent l'heure réelle : elles avancent jeu fermé.
   Durées raccourcies pour le prototype (à allonger plus tard).
   ===================================================================== */
const EGG_TIME=3*60*1000, EXPE_TIME=5*60*1000, FEED_COST=5, EXPE_MAX=2;
const STAGES=[{nom:'Bébé',xp:0,sc:.62},{nom:'Jeune',xp:3,sc:.8},{nom:'Adulte',xp:8,sc:1}];
const NAMES={glouton:['Mûron','Gloupi','Bouli','Myrtille','Gélou','Prunelle'],epineux:['Piquou','Chardon','Ronce','Cactou','Épi','Brindille'],bourdon:['Bzzou','Miellou','Zébulon','Pollen','Vrombi','Nectar']};
const ROLES={glouton:'Combattant : il bondit sur les ennemis.',epineux:'Gardien : ses épines protègent le groupe.',bourdon:'Voyageur : il rend les expéditions plus rentables.'};

/* ---------- données ---------- */
function newTrognon(sp){const id=save.nextId||1;save.nextId=id+1;return{id,sp,nom:pickR(NAMES[sp]),xp:0,busy:false}}
function migrateSave(){
  if(!save.nextId)save.nextId=1;
  save.trognons=(save.trognons||[]).map(t=>typeof t==='string'?newTrognon(t):t);
  if(!Array.isArray(save.couveuse))save.couveuse=[null,null];
  if(save.expe===undefined)save.expe=null;
}
migrateSave();
function stageOf(t){let s=0;for(let i=0;i<STAGES.length;i++)if(t.xp>=STAGES[i].xp)s=i;return s}
function mmss(ms){const s=Math.max(0,Math.ceil(ms/1000));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')}

/* ---------- état visuel ---------- */
const refu={bg:null,pets:[],smoke:[],toast:null,sel:new Set(),panel:null,timer:null,hero:{x:146,y:252},spark:0};
const SPOTS={couveuse:{x:78,y:318,r:42},board:{x:284,y:312,r:42},hut:{x:180,y:178,r:58},door:{x:180,y:584,r:42}};
const PEN={x0:46,x1:314,y0:420,y1:528};

function enterRefuge(msgTxt){
  state='refuge';hideOv();cur=null;
  if(!refu.bg)refu.bg=renderRefugeBg();
  syncPets();if(!motes.length)initMotes();
  if(msgTxt)refuSay(msgTxt,3.2);
}
function refuSay(t,d=2.6){refu.toast={t,d}}
function syncPets(){
  const keep=new Map(refu.pets.map(p=>[p.ref.id,p]));
  refu.pets=save.trognons.filter(t=>!t.busy).map(t=>keep.get(t.id)||{ref:t,x:rnd(PEN.x0+16,PEN.x1-16),y:rnd(PEN.y0+14,PEN.y1-8),tx:0,ty:0,wait:rnd(0,2),ph:Math.random()*6,face:1,moving:false,heart:0});
  for(const p of refu.pets){p.ref=save.trognons.find(t=>t.id===p.ref.id)||p.ref}
}

function updRefuge(dt){
  for(const p of refu.pets){
    p.ph+=dt;p.heart=Math.max(0,p.heart-dt);
    if(p.wait>0){p.wait-=dt;p.moving=false;continue}
    if(!p.tx){p.tx=rnd(PEN.x0+16,PEN.x1-16);p.ty=rnd(PEN.y0+14,PEN.y1-6)}
    const dx=p.tx-p.x,dy=p.ty-p.y,d=Math.hypot(dx,dy),sp=14+stageOf(p.ref)*4;
    if(d<2){p.tx=0;p.wait=rnd(1,3.5);p.moving=false}else{p.x+=dx/d*sp*dt;p.y+=dy/d*sp*dt;p.face=dx<0?-1:1;p.moving=true}
  }
  if(Math.random()<dt*5)refu.smoke.push({x:222+rnd(-2,2),y:98,r:rnd(3,5),vy:rnd(-12,-8),vx:rnd(2,6),life:2.4,max:2.4});
  for(const s of refu.smoke){s.x+=s.vx*dt;s.y+=s.vy*dt;s.r+=dt*3;s.life-=dt}refu.smoke=refu.smoke.filter(s=>s.life>0);
  if(refu.toast){refu.toast.d-=dt;if(refu.toast.d<=0)refu.toast=null}
  refu.spark-=dt;if(refu.spark<0&&buddy){refu.spark=rnd(.1,.25);parts.push({x:214+rnd(-4,4),y:236,vx:rnd(-8,8),vy:rnd(-30,-15),life:.6,max:.6,col:pickR(['#ffd27a','#ff9a4a','#fff1b0']),r:rnd(.8,1.6),glow:true,grav:0})}
}

/* ---------- toucher ---------- */
function refugeTap(p){
  for(const pet of [...refu.pets].sort((a,b)=>b.y-a.y)){if(Math.hypot(p.x-pet.x,p.y-(pet.y-8))<18){openPanel(()=>petPanel(pet.ref));SFX.pick();return}}
  for(const k in SPOTS){const s=SPOTS[k];if(Math.hypot(p.x-s.x,p.y-s.y)<s.r){SFX.door();
    if(k==='couveuse')openPanel(couveusePanel);else if(k==='board')openPanel(expePanel);else if(k==='hut')openPanel(hutPanel);else startRun(false);return}}
}

/* ---------- panneaux ---------- */
function openPanel(fn){refu.panel=fn;renderPanel();clearInterval(refu.timer);refu.timer=setInterval(()=>{if(refu.panel&&state==='refuge')renderPanel()},1000)}
function closePanel(){refu.panel=null;clearInterval(refu.timer);hideOv()}
function renderPanel(){
  refu.panelPet=null;
  const {html,acts={},btns=[]}=refu.panel();
  showOv(html,[...btns,{l:'Fermer',alt:true,f:closePanel}],'panel');
  card.querySelectorAll('[data-act]').forEach(el=>{const a=acts[el.dataset.act];if(a)el.onclick=()=>{audio();a()}});
}
function couveusePanel(){
  const acts={};let rows='';
  save.couveuse.forEach((s,i)=>{
    if(!s){rows+=`<div class="row"><div><b>Nid ${i+1}</b><br><span class="small">vide</span></div><button class="mini" data-act="put${i}" ${save.oeufs>0?'':'disabled'}>Couver un œuf</button></div>`;
      acts['put'+i]=()=>{if(save.oeufs<=0)return;save.oeufs--;save.couveuse[i]={until:Date.now()+EGG_TIME,sp:pickR(['glouton','epineux','bourdon'])};writeSave();SFX.egg();renderPanel()}}
    else{const left=s.until-Date.now();
      if(left>0)rows+=`<div class="row"><div><b>Nid ${i+1}</b><br><span class="small">ça bouge un peu…</span></div><div class="timer">${mmss(left)}</div></div>`;
      else{rows+=`<div class="row"><div><b>Nid ${i+1}</b><br><span class="small">il va éclore !</span></div><button class="mini go" data-act="hatch${i}">Faire éclore</button></div>`;acts['hatch'+i]=()=>hatch(i)}}
  });
  return{html:`<h2>La couveuse</h2><p class="small">Œufs en réserve : <b>${save.oeufs}</b>. Un œuf met ${EGG_TIME/60000} minutes à éclore (durée de test).</p>${rows}`,acts};
}
function hatch(i){
  const s=save.couveuse[i];if(!s||s.until>Date.now())return;
  const t=newTrognon(s.sp);save.trognons.push(t);save.couveuse[i]=null;writeSave();
  syncPets();const p=refu.pets.find(p=>p.ref.id===t.id);if(p){p.x=SPOTS.couveuse.x+20;p.y=SPOTS.couveuse.y+20;p.heart=2}
  SFX.capture();burst(SPOTS.couveuse.x,SPOTS.couveuse.y-10,'#fff3c4',24,130,.8,{glow:true});
  closePanel();refuSay(`${t.nom} le ${SPECIES[t.sp].nom} est né !`,3.5);
}
function petPanel(t){
  t=save.trognons.find(x=>x.id===t.id)||t;refu.panelPet=t;
  const s=stageOf(t),next=STAGES[s+1],acts={};
  const pct=next?Math.round((t.xp-STAGES[s].xp)/(next.xp-STAGES[s].xp)*100):100;
  let feed='';
  if(t.busy)feed=`<p class="small">Parti en expédition.</p>`;
  else if(next){feed=`<button class="mini go wide" data-act="feed" ${save.fibres>=FEED_COST?'':'disabled'}>Nourrir (${FEED_COST} fibres)</button>`;
    acts.feed=()=>{if(save.fibres<FEED_COST)return;save.fibres-=FEED_COST;t.xp++;const p=refu.pets.find(p=>p.ref.id===t.id);if(p){p.heart=1.6;burst(p.x,p.y-10,'#ff9ab0',8,50,.5,{glow:true})}
      SFX.pick();if(stageOf(t)>s){SFX.clear();refuSay(`${t.nom} devient ${STAGES[stageOf(t)].nom.toLowerCase()} !`,3);if(p)burst(p.x,p.y-10,'#fff3c4',18,110,.7,{glow:true})}writeSave();renderPanel()}}
  else feed=`<p class="small">Adulte : il a fini de grandir.</p>`;
  return{html:`<div class="petico"><canvas id="petcv" width="540" height="450"></canvas></div><h2>${t.nom}</h2><p class="small">${SPECIES[t.sp].nom} · ${STAGES[s].nom}</p><p>${ROLES[t.sp]}</p>
    <div class="bar"><i style="width:${pct}%"></i></div><p class="small">${next?`Encore ${next.xp-t.xp} repas pour devenir ${next.nom.toLowerCase()}.`:'Croissance terminée.'} Fibres : ${save.fibres}</p>${feed}`,acts,after:()=>{}};
}
function expePanel(){
  const acts={};
  if(save.expe){const left=save.expe.until-Date.now(),names=save.expe.ids.map(id=>(save.trognons.find(t=>t.id===id)||{}).nom).join(' et ');
    if(left>0)return{html:`<h2>Expédition</h2><p>${names} explorent les Racines.</p><div class="timer big">${mmss(left)}</div><p class="small">Ils rapporteront leur butin même si tu fermes le jeu.</p>`};
    acts.claim=claimExpe;
    return{html:`<h2>Ils sont rentrés !</h2><p>${names} rapportent :</p><div class="loot"><span><i class="ic fibre"></i>${save.expe.f}</span><span><i class="ic eclat"></i>${save.expe.e}</span>${save.expe.o?`<span><i class="ic oeuf"></i>${save.expe.o}</span>`:''}</div><button class="mini go wide" data-act="claim">Récupérer le butin</button>`,acts};
  }
  const ok=save.trognons.filter(t=>!t.busy&&stageOf(t)>=1),babies=save.trognons.filter(t=>stageOf(t)===0).length;
  for(const id of[...refu.sel])if(!ok.find(t=>t.id===id))refu.sel.delete(id);
  let list=ok.map(t=>{acts['sel'+t.id]=()=>{if(refu.sel.has(t.id))refu.sel.delete(t.id);else if(refu.sel.size<EXPE_MAX)refu.sel.add(t.id);renderPanel()};
    return`<button class="pick ${refu.sel.has(t.id)?'on':''}" data-act="sel${t.id}">${t.nom}<small>${SPECIES[t.sp].nom} · ${STAGES[stageOf(t)].nom}</small></button>`}).join('');
  if(!ok.length)list=`<p class="small">Aucun trognon assez grand pour partir.${babies?' Nourris tes bébés pour qu\'ils deviennent jeunes.':' Sauve des créatures dans le donjon ou fais éclore des œufs.'}</p>`;
  acts.go=()=>{if(!refu.sel.size)return;const ids=[...refu.sel];let f=0,e=0,o=0;
    for(const id of ids){const t=save.trognons.find(x=>x.id===id);t.busy=true;const s=stageOf(t),b=t.sp==='bourdon'?1.4:1;f+=Math.round((4+s*3+ri(0,3))*b);e+=Math.round((2+s*2+ri(0,2))*b);if(Math.random()<.12)o++}
    save.expe={until:Date.now()+EXPE_TIME,ids,f,e,o};refu.sel.clear();writeSave();syncPets();SFX.door();closePanel();refuSay('Bonne route, les trognons !')};
  return{html:`<h2>Expéditions</h2><p class="small">Choisis jusqu'à ${EXPE_MAX} trognons (jeunes ou adultes). Durée : ${EXPE_TIME/60000} minutes (durée de test).</p><div class="picks">${list}</div>
    <button class="mini go wide" data-act="go" ${refu.sel.size?'':'disabled'}>Partir en expédition</button>`,acts};
}
function claimExpe(){
  const x=save.expe;if(!x||x.until>Date.now())return;
  save.fibres+=x.f;save.eclats+=x.e;save.oeufs+=x.o;for(const id of x.ids){const t=save.trognons.find(t=>t.id===id);if(t)t.busy=false}
  save.expe=null;writeSave();syncPets();SFX.coin();burst(SPOTS.board.x,SPOTS.board.y-10,'#ffd86b',20,120,.7,{glow:true});closePanel();refuSay(`+${x.f} fibres, +${x.e} éclats${x.o?', +'+x.o+' œuf':''} !`,3);
}
function hutPanel(){
  const counts={};for(const t of save.trognons)counts[t.sp]=(counts[t.sp]||0)+1;
  const bes=Object.keys(SPECIES).map(k=>`<span class="tag ${counts[k]?'':'off'}">${SPECIES[k].nom}${counts[k]?' ×'+counts[k]:' ?'}</span>`).join('');
  return{html:`<h2>Ton refuge</h2><p>${save.trognons.length} trognon${save.trognons.length>1?'s':''} vivent ici.</p><p class="small">Bestiaire des Racines</p><div class="tags">${bes}</div>
  <p class="small">Étage le plus profond : ${save.record||0}<br>Bientôt : améliorer la couveuse, l'atelier, choisir son compagnon.</p>`};
}

/* =====================================================================
   DESSIN DU REFUGE
   ===================================================================== */
function renderRefugeBg(){
  const c=document.createElement('canvas');c.width=W*RES;c.height=H*RES;
  const prev=G;G=c.getContext('2d');G.scale(RES,RES);
  const R=mulberry(4242),pick=a=>a[Math.floor(R()*a.length)];
  // herbe
  G.fillStyle=lg(0,0,0,H,[[0,'#8fbd5f'],[1,'#a7cc6c']]);G.fillRect(0,0,W,H);
  for(let i=0;i<2600;i++){const x=R()*W,y=R()*H,l=2+R()*3;bp();G.moveTo(x,y);G.lineTo(x+(R()-.5)*2,y-l);st(pick(['rgba(70,120,40,.35)','rgba(160,200,100,.4)','rgba(90,140,50,.3)']),.7)}
  for(let i=0;i<14;i++){const mx=R()*W,my=120+R()*(H-160);for(let j=0;j<8;j++){bp();ci(mx+(R()-.5)*26,my+(R()-.5)*14,3+R()*5);G.fillStyle='rgba(120,170,70,.35)';G.fill()}}
  // chemins de terre
  const road=(pts,w)=>{for(const [wd,col] of[[w+5,'#9a7448'],[w,'#d2ae78'],[w-8,'rgba(226,196,148,.6)']]){bp();G.moveTo(pts[0],pts[1]);G.bezierCurveTo(pts[2],pts[3],pts[4],pts[5],pts[6],pts[7]);st(col,wd)}};
  road([180,222,170,330,192,450,180,575],28);
  road([168,262,120,262,96,286,82,312],18);
  road([194,262,240,262,268,286,284,306],18);
  for(let i=0;i<40;i++){const t=R(),x=180+(R()-.5)*16,y=230+t*340;pebbles(x,y,R)}
  // enclos : herbe plus dense, abreuvoir, botte de foin
  bp();rrect(PEN.x0-10,PEN.y0-22,PEN.x1-PEN.x0+20,PEN.y1-PEN.y0+40,18);G.fillStyle='rgba(120,175,70,.45)';G.fill();
  for(let i=0;i<30;i++)grassTuft(PEN.x0+R()*(PEN.x1-PEN.x0),PEN.y0-10+R()*(PEN.y1-PEN.y0+20),R);
  for(let i=0;i<14;i++)flower(PEN.x0+R()*(PEN.x1-PEN.x0),PEN.y0+R()*(PEN.y1-PEN.y0),R);
  // abreuvoir
  G.save();G.translate(296,438);shadowE(0,8,22,4,.25);bp();rrect(-20,-6,40,14,4);fs('#a8714c','#3a2418',1.1);bp();rrect(-17,-5,34,7,3);fl(lg(0,-5,0,2,[[0,'#9fd8f0'],[1,'#5aa8d0']]));bp();G.moveTo(-12,-3);G.lineTo(-4,-3);st('rgba(255,255,255,.7)',1);G.restore();
  // foin
  G.save();G.translate(64,440);shadowE(0,6,16,4,.25);bp();el(0,0,15,9);fs('#e8c45a','#7a5a1a',1);for(let i=0;i<9;i++){bp();G.moveTo(-12+i*3,-4+R()*3);G.lineTo(-10+i*3,4);st('#c9a03a',.7)}G.restore();
  // clôture
  const fx0=PEN.x0-14,fx1=PEN.x1+14,fy0=PEN.y0-26,fy1=PEN.y1+22;
  const post=(x,y)=>{shadowE(x+1,y+2,3,1.2,.3);bp();rrect(x-2.4,y-13,4.8,15,1.6);fs('#9a6842','#3a2418',.9);dot(x,y-12.4,1.8,'#b98a5a')};
  const rail=(x0,y0,x1,y1)=>{for(const dy of[-9,-4]){bp();G.moveTo(x0,y0+dy);G.lineTo(x1,y1+dy);st('#3a2418',3);st('#b98a5a',1.8)}};
  rail(fx0,fy0,fx1,fy0);
  for(let x=fx0;x<=fx1;x+=22)post(x,fy0);
  rail(fx0,fy0,fx0,fy1);rail(fx1,fy0,fx1,fy1);
  for(let y=fy0+22;y<=fy1;y+=22){post(fx0,y);post(fx1,y)}
  // bordure de forêt
  const trees=[];
  for(let x=-10;x<=W+10;x+=26)trees.push({x:x+(R()-.5)*10,y:30+(R()-.5)*16,r:20+R()*8});
  for(let x=-10;x<=W+10;x+=34)if(Math.abs(x-180)>80)trees.push({x:x+(R()-.5)*10,y:70+(R()-.5)*10,r:16+R()*6});
  for(let y=110;y<H-40;y+=30){trees.push({x:-4+R()*8,y,r:14+R()*6});trees.push({x:W+4-R()*8,y,r:14+R()*6})}
  trees.sort((a,b)=>a.y-b.y);
  for(const t of trees){shadowE(t.x+3,t.y+t.r*.8,t.r*.9,t.r*.32,.25);bp();rrect(t.x-3,t.y,6,t.r*.75,2);fs('#7a4e31','#3a2418',1);
    for(let k=0;k<7;k++){const a=k/7*TAU,cx2=t.x+Math.cos(a)*t.r*.45,cy2=t.y-t.r*.3+Math.sin(a)*t.r*.3;bp();ci(cx2,cy2+1,t.r*.55+1.2);G.fillStyle=PAL.leafDark;G.fill()}
    for(let k=0;k<7;k++){const a=k/7*TAU,cx2=t.x+Math.cos(a)*t.r*.45,cy2=t.y-t.r*.3+Math.sin(a)*t.r*.3;leafCluster(cx2,cy2,t.r*.55,R,pick,false)}
    leafCluster(t.x,t.y-t.r*.4,t.r*.5,R,pick,false)}
  // cabane
  drawHut(180,178);
  // couveuse : souche + nid tressé + lanterne
  G.save();G.translate(SPOTS.couveuse.x,SPOTS.couveuse.y);
  shadowE(0,14,30,7,.3);
  bp();G.moveTo(-22,0);G.lineTo(-22,10);G.quadraticCurveTo(0,18,22,10);G.lineTo(22,0);G.closePath();fs(lg(-22,0,22,0,[[0,'#7a4e31'],[.5,'#9a6842'],[1,'#5e3a26']]),'#3a2418',1.1);
  bp();el(0,0,24,8);fs('#dcb37a','#3a2418',1);
  bp();el(0,-3,26,10);fs(lg(0,-13,0,7,[[0,'#c99a5a'],[1,'#8a5a32']]),'#3a2418',1.2);
  for(let i=0;i<14;i++){const a=i/14*Math.PI;bp();G.moveTo(-26+i*4,-5);G.quadraticCurveTo(-24+i*4,2,-22+i*4,5);st('rgba(70,40,20,.45)',.8)}
  bp();el(0,-6,19,5.5);fl('#5a3a22');
  for(let i=0;i<12;i++){bp();G.moveTo(-18+R()*36,-6+R()*3);G.lineTo(-18+R()*36,-6+R()*3);st('#e8c45a',.7)}
  G.restore();
  G.save();G.translate(30,296);bp();G.moveTo(0,10);G.lineTo(0,-30);st('#3a2418',3);st('#8a5a3a',1.8);bp();G.moveTo(0,-30);G.quadraticCurveTo(6,-31,8,-26);st('#3a2418',1.6);
  bp();rrect(4.5,-27,7,9,2);fs('#ffd98a','#5a3a1a',1);G.restore();
  // tableau des expéditions
  G.save();G.translate(SPOTS.board.x,SPOTS.board.y);
  shadowE(0,14,28,5,.3);
  for(const s of[-1,1]){bp();rrect(s*22-2.5,-30,5,44,1.6);fs('#8a5a3a','#3a2418',1)}
  bp();G.moveTo(-30,-34);G.lineTo(30,-34);G.lineTo(24,-42);G.lineTo(-24,-42);G.closePath();fs('#6e8f3e','#24432a',1);
  bp();rrect(-27,-32,54,34,3);fs(lg(0,-32,0,2,[[0,'#c9874b'],[1,'#a06a3c']]),'#3a2418',1.2);
  bp();rrect(-20,-28,26,22,1.5);fs('#f6e6c8','#8a6a48',.7);
  bp();G.moveTo(-17,-12);G.quadraticCurveTo(-10,-22,-4,-14);G.quadraticCurveTo(0,-10,2,-22);G.setLineDash([1.5,1.5]);st('#a0522d',.8);G.setLineDash([]);
  bp();G.moveTo(.5,-24);G.lineTo(3.5,-21);G.moveTo(3.5,-24);G.lineTo(.5,-21);st('#d8423a',1);
  dot(-19,-27,1.2,'#d8423a');dot(5,-27,1.2,'#d8423a');
  bp();rrect(9,-26,13,9,1);fs('#fff8ea','#8a6a48',.6);bp();rrect(10,-14,11,8,1);fs('#ffeaa8','#8a6a48',.6);
  G.restore();
  // entrée du donjon
  G.save();G.translate(SPOTS.door.x,SPOTS.door.y);
  shadowE(0,6,40,10,.25);
  bp();el(0,0,30,15);fl(rg(0,4,2,30,[[0,'#060302'],[1,'#3a2418']]));
  for(let i=0;i<3;i++){bp();G.moveTo(-16+i*3,-4+i*4);G.lineTo(16-i*3,-4+i*4);st('rgba(160,120,80,'+(.45-i*.12)+')',2.2)}
  bp();G.ellipse(0,0,31,16,0,Math.PI*1.02,Math.PI*1.98);st('#2e1a10',7);st('#8a5a3a',4.2);st('#b98a5a',1);
  for(const s of[-1,1]){bp();G.moveTo(s*30,2);G.quadraticCurveTo(s*38,8,s*44,6);st('#2e1a10',4);st('#8a5a3a',2.4)}
  for(let i=0;i<8;i++){const a=Math.PI*(1.05+i*.12);leafCluster(Math.cos(a)*32,Math.sin(a)*17-2,4+R()*2,R,pick,true)}
  for(const s of[-1,1]){bp();G.moveTo(s*46,10);G.lineTo(s*46,-16);st('#3a2418',2.6);st('#8a5a3a',1.4);bp();rrect(s*46-3.5,-24,7,9,2);fs('#ffd98a','#5a3a1a',.9)}
  G.restore();
  G=prev;return c;
}
function drawHut(x,y){
  G.save();G.translate(x,y);
  shadowE(4,40,72,12,.3);
  // murs
  bp();rrect(-56,-28,112,68,8);fs(lg(0,-28,0,40,[[0,'#d39a5e'],[1,'#a86f3e']]),'#3a2418',1.4);
  for(let i=0;i<6;i++){bp();G.moveTo(-55,-18+i*10.5);G.lineTo(55,-18+i*10.5);st('rgba(90,50,20,.35)',.8)}
  for(let i=0;i<14;i++){const px=-50+(i*37)%100,py=-14+(i*13)%52;bp();G.moveTo(px,py);G.lineTo(px+3,py);st('rgba(90,50,20,.3)',.6)}
  // pierres de fondation
  for(let i=0;i<8;i++){bp();el(-49+i*14,39,7.5,4);fs(i%2?'#a99a8a':'#bcae9c','#3a2a26',.8)}
  // fenêtres
  for(const s of[-1,1]){G.save();G.translate(s*33,4);bp();ci(0,0,10);fs('#7a4a30','#3a2418',1.2);bp();ci(0,0,7.6);fl(rg(-2,-2,1,8,[[0,'#fff3c4'],[1,'#ffc46a']]));bp();G.moveTo(-7.6,0);G.lineTo(7.6,0);G.moveTo(0,-7.6);G.lineTo(0,7.6);st('#7a4a30',1.6);
    bp();rrect(-11,8,22,5,2);fs('#8a5a3a','#3a2418',.8);for(let k=0;k<4;k++)dot(-7+k*4.6,7,2,['#f7b6c6','#fff6c8','#e2574a','#b9a6f0'][k]);G.restore()}
  // porte ronde
  bp();G.moveTo(-14,40);G.lineTo(-14,10);G.arc(0,10,14,Math.PI,0);G.lineTo(14,40);G.closePath();fs(lg(-14,0,14,0,[[0,'#6fb05a'],[1,'#3f7a3a']]),'#24432a',1.4);
  for(const lx of[-7,0,7]){bp();G.moveTo(lx,0+Math.abs(lx)*.5);G.lineTo(lx,40);st('rgba(30,60,30,.4)',.7)}
  dot(8,24,1.8,'#ffcf4d');bp();rrect(-17,38,34,4,1.5);fs('#9b8b7a','#3a2a26',.8);
  // toit-feuille
  bp();G.moveTo(-76,-20);G.bezierCurveTo(-70,-70,-28,-96,0,-98);G.bezierCurveTo(28,-96,70,-70,76,-20);
  for(let i=0;i<=10;i++){const px=76-i*15.2;G.quadraticCurveTo(px-7.6,-12+(i%2?2:-1),px-15.2,-20)}
  G.closePath();fs(lg(0,-98,0,-14,[[0,'#97d775'],[.6,'#62a650'],[1,'#3f7a3a']]),'#24432a',1.5);
  bp();G.moveTo(0,-97);G.quadraticCurveTo(-3,-60,0,-22);st('rgba(30,70,30,.45)',1.4);
  for(let i=0;i<5;i++){const yy=-84+i*14;for(const s of[-1,1]){bp();G.moveTo(0,yy);G.quadraticCurveTo(s*18,yy+2,s*(26+i*9),yy+12);st('rgba(30,70,30,.35)',.9)}}
  bp();G.moveTo(-50,-60);G.bezierCurveTo(-40,-80,-20,-90,-4,-92);st('rgba(255,255,255,.35)',2);
  // tige au sommet
  bp();G.moveTo(0,-97);G.quadraticCurveTo(4,-108,12,-110);st('#24432a',3);st('#6b8a3a',1.6);
  G.save();G.translate(16,-109);G.rotate(-.3);bp();el(0,0,6,3);fs('#97d775','#24432a',1);G.restore();
  // cheminée
  bp();rrect(36,-74,14,24,2);fs('#a99a8a','#3a2a26',1.1);bp();rrect(34,-78,18,6,2);fs('#8a7b6c','#3a2a26',1);
  // enseigne
  bp();rrect(-24,-26,48,14,3);fs('#f6e6c8','#7a4a30',1.2);
  G.fillStyle='#7a4a30';G.font='700 9.5px Fredoka, sans-serif';G.textAlign='center';G.fillText('Refuge',0,-16);
  G.restore();
}
function tag(x,y,txt,badge){
  G.font='600 10px Fredoka, sans-serif';const w=G.measureText(txt).width+14;
  bp();rrect(x-w/2,y-9,w,15,7.5);fs('rgba(255,248,234,.94)','#8a6a48',1);text(txt,x,y+2,10,'#5a3a24','center',600);
  if(badge){const bx=x+w/2-2,by=y-9;bp();ci(bx,by,6);fs('#e2574a','#7a1f18',1);text(badge,bx,by+3.4,9,'#fff','center',700)}
}
function drawRefuge(){
  G=cx;const now=Date.now();
  G.drawImage(refu.bg,0,0,W,H);
  // œufs dans la couveuse
  save.couveuse.forEach((s,i)=>{if(!s)return;const ready=s.until<=now,x=SPOTS.couveuse.x-9+i*18,y=SPOTS.couveuse.y-8;
    const wob=ready?Math.sin(clock*12)*.18:Math.sin(clock*2+i)*.05;G.save();G.translate(x,y);G.rotate(wob);G.scale(.72,.72);
    if(ready)glow(0,-4,18,'255,235,160',.4);
    bp();G.moveTo(0,-9.5);G.bezierCurveTo(6.6,-9.5,8,1,7,4);G.bezierCurveTo(5.6,7.6,-5.6,7.6,-7,4);G.bezierCurveTo(-8,1,-6.6,-9.5,0,-9.5);G.closePath();fs(lg(-6,0,6,0,[[0,'#fffaf0'],[1,'#f1e0c2']]),OUT,1.2);
    dot(-2.6,-3,1.7,'#7cc6e6');dot(2.8,1.4,1.4,'#f49ab4');dot(.6,-6,1,'#9bd47a');G.restore()});
  // lanterne de la couveuse et fenêtres de la cabane
  glow(38,273,22,'255,200,110',.35+.05*Math.sin(clock*7));
  for(const s of[-1,1])glow(180+s*33,182,20,'255,200,110',.22);
  glow(SPOTS.door.x-46,SPOTS.door.y-20,16,'255,200,110',.3);glow(SPOTS.door.x+46,SPOTS.door.y-20,16,'255,200,110',.3);
  // fumée
  for(const s of refu.smoke){const a=s.life/s.max;dot(s.x,s.y,s.r,`rgba(240,236,228,${a*.55})`)}
  // héros et Braisou devant la cabane
  const L=[];
  L.push({y:refu.hero.y,f:()=>drawHeroArt(refu.hero.x,refu.hero.y,{fx:0,fy:1,walk:0,moving:false,t:clock,blink:hero&&hero.blink,roll:0})});
  L.push({y:250,f:()=>drawBraisouArt(214,232+Math.sin(clock*3)*2,clock,0,{x:-.5,y:.4},'normal')});
  for(const p of refu.pets)L.push({y:p.y,f:()=>drawPet(p)});
  L.sort((a,b)=>a.y-b.y).forEach(o=>o.f());
  // expédition en cours : drapeau sur le tableau
  if(save.expe){const done=save.expe.until<=now;tag(SPOTS.board.x,SPOTS.board.y-58,done?'De retour !':'En route '+mmss(save.expe.until-now),done?'!':null)}
  else tag(SPOTS.board.x,SPOTS.board.y-58,'Expéditions');
  const ready=save.couveuse.filter(s=>s&&s.until<=now).length,inc=save.couveuse.filter(s=>s&&s.until>now);
  tag(SPOTS.couveuse.x,SPOTS.couveuse.y-40,inc.length&&!ready?'Couveuse '+mmss(Math.min(...inc.map(s=>s.until))-now):'Couveuse',ready?'!':(save.oeufs>0&&save.couveuse.includes(null)?String(save.oeufs):null));
  tag(180,PEN.y0-40,refu.pets.length?'Enclos':'Enclos (vide)');
  // particules + poussières
  for(const p of parts){const a=Math.max(0,p.life/p.max);G.save();G.globalAlpha=a;if(p.glow){G.globalCompositeOperation='lighter';dot(p.x,p.y,p.r*2.2,hexA(p.col,.25))}dot(p.x,p.y,p.r,p.col);G.restore()}
  G.save();G.globalCompositeOperation='lighter';for(const m of motes){const a=.25+.25*Math.sin(m.ph*2);const mx=m.x,my=m.y*1.7+60;dot(mx,my,2.6*m.s,`rgba(255,236,170,${a*.25})`);dot(mx,my,.9*m.s,`rgba(255,246,200,${a})`)}G.restore();
  // bouton de descente
  const by=SPOTS.door.y+30+Math.sin(clock*3)*1.2;bp();rrect(118,by-13,124,28,14);G.fillStyle='#9a4a26';G.fill();bp();rrect(118,by-16,124,28,14);fs(lg(0,by-16,0,by+12,[[0,'#f39a62'],[1,'#e2774a']]),'#9a4a26',1.6);
  text('Descendre au donjon',180,by+2.5,13,'#fff','center',700,'rgba(120,50,20,.6)');
  // en-tête
  panel(6,6,W-12,52,14);
  text('Le Refuge',18,28,17,'#e2774a','left',700,'#fff8ec');
  const items=[['fibre',save.fibres],['eclat',save.eclats],['oeuf',save.oeufs],['trognon',save.trognons.length]];
  items.forEach(([k,n],i)=>{const x=18+i*44;drawIcon(k,x,44,clock);text(String(n),x+9,48,12.5,'#4a3324','left',700)});
  text('Touche un bâtiment',W-18,26,10.5,'#8a6a48','right',600);text('ou un trognon',W-18,40,10.5,'#8a6a48','right',600);
  if(refu.toast){const a=Math.min(1,refu.toast.d*2);G.globalAlpha=a;G.font='600 13px Fredoka, sans-serif';const w=Math.min(340,G.measureText(refu.toast.t).width+28);
    bp();rrect(180-w/2,72,w,30,15);fs('rgba(58,38,30,.9)','#2a1a14',1);text(refu.toast.t,180,92,13,'#fff8ec','center',600);G.globalAlpha=1}
}
function drawPet(p){
  const t=p.ref,sc=STAGES[stageOf(t)].sc,hop=p.moving&&t.sp==='glouton'?Math.abs(Math.sin(p.ph*7))*.7:0;
  G.save();G.translate(p.x,p.y);G.scale(sc,sc);
  const o={t:p.ph,look:{x:p.face*.6,y:.4},mode:'normal',sq:p.moving&&t.sp==='epineux'?Math.abs(Math.sin(p.ph*8))*.4:0,hop,bloom:p.heart>0?1:.3,friend:true};
  if(t.sp==='glouton')drawGloutonArt(0,0,o);else if(t.sp==='epineux')drawEpineuxArt(0,0,o);else drawBourdonArt(0,-12,o);
  G.restore();
  if(p.heart>0){G.save();G.globalAlpha=Math.min(1,p.heart);G.translate(p.x,p.y-30*sc-(1.6-p.heart)*8);heartPath(4.2);fs('#ff7b8a','#7a1f28',.8);G.restore()}
}
function renderPetPreview(){
  const c=document.getElementById('petcv');if(!c||!refu.panel)return;
  const t=refu.panelPet;if(!t)return;
  const g=c.getContext('2d'),prev=G;G=g;g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,c.width,c.height);g.setTransform(7.8,0,0,7.8,270,354);
  const o={t:clock,look:{x:0,y:.3},mode:'normal',sq:0,hop:0,bloom:.6,friend:true};const sc=STAGES[stageOf(t)].sc;g.scale(sc,sc);
  if(t.sp==='glouton')drawGloutonArt(0,0,o);else if(t.sp==='epineux')drawEpineuxArt(0,0,o);else drawBourdonArt(0,-12,o);
  G=prev;
}
