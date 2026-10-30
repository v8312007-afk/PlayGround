'use strict';

const $id = (id) => document.getElementById(id);
const clamp = (v,a,b) => v < a ? a : v > b ? b : v;
const lerp = (a,b,t) => a + (b-a)*t;
const rand = (a,b) => a + Math.random()*(b-a);
const TAU = Math.PI*2;
const canvas = $id('game');
const ctx = canvas.getContext('2d');
const RX = 338, RY = 252;

const TURRETS = [
  {id:'harpoon',name:'Гарпун',desc:'Быстрые одиночные выстрелы',cost:70,color:'#63e4ff',accent:'#e8feff',range:242,fireRate:0.58,damage:16,projectile:'harpoon'},
  {id:'ice',name:'Криопушка',desc:'Осколки замедляют косаток',cost:105,color:'#82d8ff',accent:'#e6fbff',range:222,fireRate:1.0,damage:10,projectile:'ice',slow:0.48,slowTime:2.6},
  {id:'sonic',name:'Соник',desc:'Круговая волна урона',cost:135,color:'#a595ff',accent:'#e8e2ff',range:178,fireRate:1.8,damage:17,projectile:'sonic',aoe:108},
  {id:'mortar',name:'Миномёт',desc:'Взрыв по большой площади',cost:175,color:'#ffb86b',accent:'#ffedc9',range:330,fireRate:2.4,damage:40,projectile:'mortar',aoe:88},
  {id:'tesla',name:'Тесла',desc:'Цепная молния по трём врагам',cost:205,color:'#ffe66d',accent:'#fffbd2',range:252,fireRate:1.35,damage:21,projectile:'tesla',chain:3},
  {id:'aurora',name:'Аврора',desc:'Пробивающий луч северного сияния',cost:250,color:'#7dffd0',accent:'#d8fff4',range:336,fireRate:2.2,damage:64,projectile:'aurora'}
];

const TRAPS = [
  {id:'mine',name:'Мина',desc:'Взрыв при приближении',cost:50,color:'#ff7a6b',radius:48,damage:72,cooldown:6,kind:'mine'},
  {id:'net',name:'Сеть',desc:'Удерживает косаток на месте',cost:65,color:'#8fd3ff',radius:84,damage:12,cooldown:9,kind:'net',root:2.4},
  {id:'spikes',name:'Шипы',desc:'Ледяные шипы и кровотечение',cost:70,color:'#cfefff',radius:70,damage:28,cooldown:9,kind:'spikes',bleed:20,bleedTime:3},
  {id:'decoy',name:'Приманка',desc:'Отвлекает стаю и взрывается',cost:85,color:'#ffd27a',radius:80,damage:58,cooldown:12,kind:'decoy',taunt:3.2},
  {id:'freeze',name:'Заморозка',desc:'Замораживает всех вокруг',cost:100,color:'#7cf1ff',radius:108,damage:20,cooldown:12,kind:'freeze',stun:2.1}
];

const TURRET_BY = Object.fromEntries(TURRETS.map(t=>[t.id,t]));
const TRAP_BY = Object.fromEntries(TRAPS.map(t=>[t.id,t]));
const PADS = [
  {x:-172,y:-98},{x:0,y:-138},{x:172,y:-98},
  {x:-252,y:8},{x:0,y:12},{x:252,y:8},
  {x:-172,y:122},{x:0,y:152},{x:172,y:122}
];

const ENEMY_BASE = {
  scout:{name:'Разведчик',hp:44,speed:50,r:19,dmg:3.8,bounty:12},
  raider:{name:'Косатка',hp:108,speed:42,r:27,dmg:6,bounty:19},
  brute:{name:'Тяжёлая',hp:235,speed:31,r:38,dmg:10,bounty:32},
  boss:{name:'Ледокол',hp:940,speed:24,r:56,dmg:22,bounty:140}
};

const ICE_UP = [
  {id:'hp',name:'Толщина льда',desc:'+30 к максимальной прочности. Сразу восстанавливает 30.',base:110,max:5},
  {id:'regen',name:'Авторемонт',desc:'+0.5 прочности в секунду между волнами и в бою.',base:140,max:5},
  {id:'armor',name:'Ледяная броня',desc:'-7% урона по льдине за уровень.',base:165,max:4}
];
const SEAL_UP = [
  {id:'speed',name:'Быстрые ласты',desc:'+10% скорости передвижения тюленя.',base:90,max:5},
  {id:'roar',name:'Мощный голос',desc:'-8% перезарядки рыка за уровень.',base:120,max:4},
  {id:'radius',name:'Широкое эхо',desc:'+12% радиуса рыка.',base:120,max:4},
  {id:'greed',name:'Рыбный нюх',desc:'+10% рыбы за каждого врага.',base:130,max:4}
];

function loadBest(){ try{ return Number(localStorage.getItem('iceguard_best'))||0; }catch(e){ return 0; } }
function saveBest(v){ try{ localStorage.setItem('iceguard_best', String(v)); }catch(e){} }

const state = {
  phase:'menu', paused:false, modal:null, wave:0, best:loadBest(),
  fish:160, integrity:100, maxIntegrity:100,
  time:0, buildTimer:0, spawnTimer:0, spawnQueue:[],
  turrets:[], traps:[], enemies:[], projectiles:[], particles:[], rings:[], beams:[], texts:[],
  seal:{x:0,y:155,angle:-Math.PI/2,vx:0,vy:0,moving:false},
  selectedBuild:null, selectedItem:null, selectedItemKind:null,
  shake:0, hitFlash:0, roarCd:0, pointer:null, nextId:1,
  meta:{ice:{hp:0,regen:0,armor:0},seal:{speed:0,roar:0,radius:0,greed:0}},
  muted:false, tiltEnabled:false, tiltCal:null, tiltVec:{x:0,y:0},
  warnedLow:false, overTimer:0
};

const els = {
  waveNum:$id('waveNum'), bestNum:$id('bestNum'), iceFill:$id('iceFill'), icePct:$id('icePct'), fishNum:$id('fishNum'),
  soundBtn:$id('soundBtn'), pauseBtn:$id('pauseBtn'), rushBtn:$id('rushBtn'), rushTime:$id('rushTime'),
  turretCards:$id('turretCards'), trapCards:$id('trapCards'), dockHint:$id('dockHint'),
  stick:$id('stick'), knob:$id('stickKnob'), roar:$id('roar'), roarCool:$id('roarCool'), roarCoolTxt:$id('roarCoolTxt'),
  banner:$id('banner'), bannerKicker:$id('bannerKicker'), bannerMain:$id('bannerMain'), bannerSub:$id('bannerSub'),
  toast:$id('toast'),
  tp:$id('turretPanel'), tpKicker:$id('tpKicker'), tpName:$id('tpName'), tpLevel:$id('tpLevel'), tpIcon:$id('tpIcon'),
  tpStats:$id('tpStats'), tpUpgrade:$id('tpUpgrade'), tpCost:$id('tpCost'), tpSell:$id('tpSell'), tpClose:$id('tpClose'),
  start:$id('startScreen'), playBtn:$id('playBtn'), soundStart:$id('soundStart'), tiltStart:$id('tiltStart'), bestStart:$id('bestStart'),
  pause:$id('pauseScreen'), resumeBtn:$id('resumeBtn'), restartBtn:$id('restartBtn'), soundPause:$id('soundPause'), tiltPause:$id('tiltPause'),
  pauseWave:$id('pauseWave'), pauseFish:$id('pauseFish'), pauseIce:$id('pauseIce'), pauseMetaBtn:$id('pauseMetaBtn'),
  over:$id('overScreen'), overWave:$id('overWave'), overBest:$id('overBest'), overFish:$id('overFish'), againBtn:$id('againBtn'),
  metaModal:$id('metaModal'), metaTitle:$id('metaTitle'), metaList:$id('metaList'), metaClose:$id('metaClose'),
  metaIceBtn:$id('metaIceBtn'), metaSealBtn:$id('metaSealBtn'), logoSeal:$id('logoSeal')
};

let W = 1, H = 1, DPR = 1, cx = 0, cy = 0, viewScale = 1;
let visualTime = 0;
let lastFrame = performance.now();
let tapInfo = null;
const hudCache = {};
let metaTab = 'ice';
let toastTimer = 0;
const input = { keys:new Set(), joy:{x:0,y:0} };

const islandPoints = [];
const snowDots = [];
const crackLines = [];
const floatChunks = [];
const screenSnow = [];
const seaGlints = [];
let seed = 20260214;
function srand(){ seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }

for(let i=0;i<28;i++){
  const a = i/28*TAU;
  const n = 1 + (srand()-.5)*0.062;
  islandPoints.push({x:Math.cos(a)*RX*n, y:Math.sin(a)*RY*n, a});
}
for(let i=0;i<70;i++){
  const a = srand()*TAU, d = Math.sqrt(srand())*0.82;
  snowDots.push({x:Math.cos(a)*RX*d, y:Math.sin(a)*RY*d, r:rand(.8,3.2), a:rand(.1,.4)});
}
for(let i=0;i<11;i++){
  const a = srand()*TAU;
  const start = {x:Math.cos(a)*RX*.86, y:Math.sin(a)*RY*.86};
  const pts = [start];
  let x = start.x, y = start.y;
  const inward = Math.atan2(-y,-x) + rand(-.45,.45);
  const len = rand(40,150);
  for(let j=0;j<4;j++){
    x += Math.cos(inward + rand(-.3,.3))*len/4;
    y += Math.sin(inward + rand(-.3,.3))*len/4;
    pts.push({x,y});
  }
  crackLines.push({pts, w:rand(.7,2.1), a:rand(.18,.42)});
}
for(let i=0;i<11;i++){
  const a = srand()*TAU, d = rand(390,690), size=rand(6,20);
  const pts=[];
  for(let j=0;j<6;j++) pts.push({x:Math.cos(j/6*TAU)*size*rand(.6,1.15), y:Math.sin(j/6*TAU)*size*rand(.4,.9)});
  floatChunks.push({a,d,size,phase:srand()*TAU,pts});
}
for(let i=0;i<38;i++){
  screenSnow.push({x:srand(), y:srand(), r:rand(.5,2.1), sp:rand(9,26), amp:rand(8,28), ph:srand()*TAU, a:rand(.08,.3)});
}
for(let i=0;i<22;i++){
  seaGlints.push({x:srand(), y:srand(), r:rand(.5,1.5), ph:srand()*TAU});
}

function resize(){
  W = window.innerWidth; H = window.innerHeight;
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(W*DPR); canvas.height = Math.round(H*DPR);
  canvas.style.width = W+'px'; canvas.style.height = H+'px';
  ctx.setTransform(DPR,0,0,DPR,0,0);
  const portrait = W < H;
  viewScale = Math.max(Math.min(W/820, H/860), 0.34);
  cx = W/2;
  cy = H * (portrait ? 0.445 : 0.47);
}

function setupDockVar(){
  const dock = $id('dock');
  const upd = () => document.documentElement.style.setProperty('--dock-h', Math.round(dock.getBoundingClientRect().height)+'px');
  if(window.ResizeObserver){ new ResizeObserver(upd).observe(dock); }
  upd();
  setTimeout(upd, 300);
}

function toWorld(sx,sy){ return {x:(sx-cx)/viewScale, y:(sy-cy)/viewScale}; }
function ellipseNorm(x,y){ return Math.sqrt((x/RX)*(x/RX)+(y/RY)*(y/RY)); }
function setText(el,txt){ if(el && el.textContent !== String(txt)) el.textContent = txt; }
function lerpAngle(a,b,t){ let d=((b-a+Math.PI)%TAU+TAU)%TAU-Math.PI; return a+d*t; }

function iceMax(){ return 100 + (state.meta.ice.hp||0)*30; }
function iceRegen(){ return (state.meta.ice.regen||0)*0.5; }
function iceArmor(){ return (state.meta.ice.armor||0)*0.07; }
function sealSpeed(){ return 156*(1+(state.meta.seal.speed||0)*0.1); }
function roarCooldown(){ return 9*(1-(state.meta.seal.roar||0)*0.08); }
function roarRadius(){ return 178*(1+(state.meta.seal.radius||0)*0.12); }
function fishMult(){ return 1+(state.meta.seal.greed||0)*0.1; }

function turretStats(t){
  const s = TURRET_BY[t.id], l = t.level-1;
  return {
    damage: s.damage*(1+0.45*l),
    fireRate: s.fireRate*(1-0.06*l),
    range: s.range*(1+0.05*l),
    aoe: s.aoe ? s.aoe*(1+0.06*l) : 0
  };
}
function trapStats(t){
  const s = TRAP_BY[t.id], l = t.level-1;
  return {
    damage: s.damage*(1+0.4*l),
    radius: s.radius*(1+0.06*l),
    cooldown: s.cooldown*(1-0.07*l)
  };
}
function turretUpCost(t){ return Math.round(TURRET_BY[t.id].cost*(0.9+0.58*t.level)); }
function trapUpCost(t){ return Math.round(TRAP_BY[t.id].cost*(0.9+0.55*t.level)); }

let audioCtx = null;
let master = null;
const lastSfx = {};
function initAudio(){
  if(audioCtx) return;
  try{
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    master = audioCtx.createGain();
    master.gain.value = state.muted ? 0 : 0.6;
    master.connect(audioCtx.destination);
  }catch(e){ audioCtx = null; }
}
function tone(freq, dur, type, vol, freq2, delay){
  if(!audioCtx || state.muted) return;
  const t0 = audioCtx.currentTime + (delay||0);
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = type || 'sine';
  o.frequency.setValueAtTime(freq, t0);
  if(freq2) o.frequency.exponentialRampToValueAtTime(Math.max(20,freq2), t0+dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol||0.05, t0+0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t0+dur);
  o.connect(g); g.connect(master);
  o.start(t0); o.stop(t0+dur+0.03);
}
function sfx(name){
  if(!audioCtx || state.muted) return;
  const now = performance.now();
  if(lastSfx[name] && now - lastSfx[name] < 45) return;
  lastSfx[name] = now;
  switch(name){
    case 'shoot': tone(560,0.055,'square',0.018,250); break;
    case 'ice': tone(880,0.09,'sine',0.02,1320); break;
    case 'boom': tone(90,0.25,'sawtooth',0.05,42); break;
    case 'tesla': tone(1200,0.07,'square',0.02,420); break;
    case 'beam': tone(320,0.18,'triangle',0.03,980); break;
    case 'build': tone(300,0.09,'triangle',0.05,520); tone(520,0.12,'sine',0.04,760,0.06); break;
    case 'upgrade': tone(420,0.08,'sine',0.05,640); tone(760,0.14,'sine',0.04,1020,0.07); break;
    case 'roar': tone(150,0.45,'sawtooth',0.07,55); tone(300,0.3,'square',0.025,90,0.03); break;
    case 'hit': tone(130,0.08,'square',0.03,70); break;
    case 'wave': tone(220,0.35,'sawtooth',0.045,330); tone(330,0.5,'sine',0.035,440,0.16); break;
    case 'done': tone(520,0.16,'sine',0.04,780); tone(780,0.24,'sine',0.035,1040,0.12); break;
    case 'over': tone(220,0.6,'sawtooth',0.06,60); tone(150,0.8,'sine',0.05,40,0.12); break;
    case 'tap': tone(640,0.04,'sine',0.02,820); break;
  }
}

function toggleSound(){
  state.muted = !state.muted;
  if(master) master.gain.value = state.muted ? 0 : 0.6;
  refreshSoundButtons();
  if(!state.muted){ initAudio(); if(audioCtx && audioCtx.state==='suspended') audioCtx.resume(); sfx('tap'); }
  showToast(state.muted ? 'Звук выключен' : 'Звук включён');
}
function refreshSoundButtons(){
  [els.soundBtn, els.soundStart, els.soundPause].forEach(b=>{
    if(!b) return;
    if(b === els.soundStart || b === els.soundPause){ b.classList.toggle('on', !state.muted); }
    else { b.classList.toggle('off', state.muted); }
  });
}

async function toggleTilt(){
  if(state.tiltEnabled){
    state.tiltEnabled = false;
    state.tiltVec.x = 0; state.tiltVec.y = 0;
    window.removeEventListener('deviceorientation', onTilt);
    refreshTiltButtons();
    showToast('Наклон выключен');
    return;
  }
  try{
    if(typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function'){
      const res = await DeviceOrientationEvent.requestPermission();
      if(res !== 'granted'){ showToast('Доступ к датчикам не разрешён'); return; }
    }
  }catch(e){ showToast('Датчики недоступны на этом устройстве'); return; }
  state.tiltEnabled = true;
  state.tiltCal = null;
  window.addEventListener('deviceorientation', onTilt);
  refreshTiltButtons();
  showToast('Наклон включён — держите телефон ровно');
}
function onTilt(e){
  if(!state.tiltEnabled) return;
  const g = e.gamma, b = e.beta;
  if(g == null && b == null) return;
  if(!state.tiltCal) state.tiltCal = {g:g||0,b:b||0};
  const dx = clamp(((g||0)-state.tiltCal.g)/24, -1, 1);
  const dy = clamp(((b||0)-state.tiltCal.b)/24, -1, 1);
  state.tiltVec.x = Math.abs(dx)<0.12 ? 0 : dx;
  state.tiltVec.y = Math.abs(dy)<0.12 ? 0 : dy;
}
function refreshTiltButtons(){
  [els.tiltStart, els.tiltPause].forEach(b=>{ if(b) b.classList.toggle('on', state.tiltEnabled); });
  els.stick.classList.toggle('tilt-active', state.tiltEnabled);
}

function showToast(txt){
  els.toast.textContent = txt;
  els.toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>els.toast.classList.remove('show'), 2100);
}
function showBanner(kicker, main, sub){
  els.bannerKicker.textContent = kicker;
  els.bannerMain.textContent = main;
  els.bannerSub.textContent = sub;
  els.banner.classList.remove('show');
  void els.banner.offsetWidth;
  els.banner.classList.add('show');
}
