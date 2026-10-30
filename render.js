'use strict';

let bgCache = null, vigCache = null, redCache = null, worldCache = null, orcaSprite = null;

function makeCacheCanvas(w,h){
  const c = document.createElement('canvas');
  c.width = Math.max(1,Math.round(w));
  c.height = Math.max(1,Math.round(h));
  return c;
}

function buildCaches(){
  bgCache = makeCacheCanvas(W,H);
  const bg = bgCache.getContext('2d');
  const g = bg.createLinearGradient(0,0,0,H);
  g.addColorStop(0,'#020b13');
  g.addColorStop(0.32,'#051925');
  g.addColorStop(0.62,'#082b38');
  g.addColorStop(1,'#04141f');
  bg.fillStyle = g;
  bg.fillRect(0,0,W,H);
  const glow = bg.createRadialGradient(cx, cy, 40, cx, cy, Math.max(W,H)*0.72);
  glow.addColorStop(0,'rgba(30,130,155,.24)');
  glow.addColorStop(0.42,'rgba(10,65,88,.14)');
  glow.addColorStop(1,'rgba(0,0,0,0)');
  bg.fillStyle = glow;
  bg.fillRect(0,0,W,H);

  vigCache = makeCacheCanvas(W,H);
  const vg = vigCache.getContext('2d');
  const v = vg.createRadialGradient(W/2,H/2,Math.min(W,H)*0.28,W/2,H/2,Math.max(W,H)*0.72);
  v.addColorStop(0,'rgba(0,0,0,0)');
  v.addColorStop(1,'rgba(0,6,10,.52)');
  vg.fillStyle = v;
  vg.fillRect(0,0,W,H);

  redCache = makeCacheCanvas(W,H);
  const rg = redCache.getContext('2d');
  const rr = rg.createRadialGradient(W/2,H/2,Math.min(W,H)*0.18,W/2,H/2,Math.max(W,H)*0.66);
  rr.addColorStop(0,'rgba(255,40,60,0)');
  rr.addColorStop(0.7,'rgba(255,40,60,.18)');
  rr.addColorStop(1,'rgba(255,25,45,.55)');
  rg.fillStyle = rr;
  rg.fillRect(0,0,W,H);
  buildWorldCache();
  buildOrcaSprite();
}

function traceIslandC(g, scale){
  const s = scale || 1;
  g.beginPath();
  for(let i=0;i<islandPoints.length;i++){
    const p = islandPoints[i];
    if(i===0) g.moveTo(p.x*s,p.y*s);
    else g.lineTo(p.x*s,p.y*s);
  }
  g.closePath();
}

function islandPath(scale){
  traceIslandC(ctx, scale);
}

function buildWorldCache(){
  const CW = 1320, CH = 1020;
  worldCache = makeCacheCanvas(CW,CH);
  const g = worldCache.getContext('2d');
  g.translate(CW/2,CH/2);

  for(const c of floatChunks){
    const x = Math.cos(c.a)*c.d, y = Math.sin(c.a)*c.d;
    g.save();
    g.translate(x,y);
    g.rotate(c.a);
    g.globalAlpha = 0.2;
    g.fillStyle = '#c7edf6';
    g.beginPath();
    c.pts.forEach((q,i)=>{ if(i===0) g.moveTo(q.x,q.y); else g.lineTo(q.x,q.y); });
    g.closePath(); g.fill();
    g.strokeStyle = 'rgba(235,253,255,.45)';
    g.lineWidth = 0.8; g.stroke();
    g.restore();
  }

  g.save();
  g.translate(0,22);
  g.scale(RX*1.12,RY*0.72);
  const sh = g.createRadialGradient(0,0,0.25,0,0,1);
  sh.addColorStop(0,'rgba(0,0,0,.48)');
  sh.addColorStop(0.7,'rgba(0,10,15,.2)');
  sh.addColorStop(1,'rgba(0,0,0,0)');
  g.fillStyle = sh;
  g.beginPath(); g.arc(0,0,1,0,TAU); g.fill();
  g.restore();

  g.save();
  traceIslandC(g,1.075);
  g.fillStyle = 'rgba(77,195,220,.14)';
  g.fill();
  g.strokeStyle = 'rgba(150,235,250,.18)';
  g.lineWidth = 2; g.stroke();
  g.restore();

  const iceGrad = g.createLinearGradient(-RX*.6,-RY,-RX*.1,RY);
  iceGrad.addColorStop(0,'#dbeeff');
  iceGrad.addColorStop(0.36,'#b9e3f2');
  iceGrad.addColorStop(0.76,'#8bc4d8');
  iceGrad.addColorStop(1,'#6ea9bf');
  g.save();
  traceIslandC(g,1);
  g.fillStyle = iceGrad;
  g.fill();
  g.strokeStyle = 'rgba(240,253,255,.85)';
  g.lineWidth = 4; g.stroke();
  g.restore();

  g.save();
  traceIslandC(g,0.955);
  const topGrad = g.createLinearGradient(-RX*.4,-RY*.8,RX*.3,RY*.7);
  topGrad.addColorStop(0,'#f4fdff');
  topGrad.addColorStop(0.48,'#dcf4fb');
  topGrad.addColorStop(1,'#b6e0eb');
  g.fillStyle = topGrad;
  g.fill();
  g.strokeStyle = 'rgba(255,255,255,.65)';
  g.lineWidth = 1.4; g.stroke();
  g.restore();

  g.save();
  traceIslandC(g,0.9);
  g.strokeStyle = 'rgba(255,255,255,.22)';
  g.lineWidth = 8; g.stroke();
  g.restore();

  g.save();
  for(const d of snowDots){
    g.globalAlpha = d.a*1.35;
    g.fillStyle = '#ffffff';
    g.beginPath(); g.arc(d.x,d.y,d.r,0,TAU); g.fill();
  }
  g.restore();

  g.save();
  g.globalAlpha = 0.32;
  g.fillStyle = '#ffffff';
  for(let i=0;i<6;i++){
    const a = i*1.05;
    const x = Math.cos(a)*RX*0.52;
    const y = Math.sin(a)*RY*0.42;
    g.beginPath(); g.ellipse(x,y,25+i*2,9+i,0.4,0,TAU); g.fill();
  }
  g.restore();

  for(const p of PADS){
    const built = state.turrets.some(tr=>tr.pad===PADS.indexOf(p));
    if(built) continue;
    g.save();
    g.translate(p.x,p.y);
    g.globalAlpha = 0.5;
    g.fillStyle = 'rgba(9,47,64,.26)';
    g.beginPath(); g.arc(0,0,25,0,TAU); g.fill();
    g.strokeStyle = 'rgba(180,240,252,.5)';
    g.lineWidth = 1.2;
    g.setLineDash([4,5]);
    g.beginPath(); g.arc(0,0,23,0,TAU); g.stroke();
    g.setLineDash([]);
    g.globalAlpha = 0.55;
    g.strokeStyle = 'rgba(225,252,255,.65)';
    g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(-6,0); g.lineTo(6,0); g.moveTo(0,-6); g.lineTo(0,6); g.stroke();
    g.restore();
  }
}

function drawOrcaBody(g,r){
  g.save();
  g.fillStyle = '#0b141d';
  g.beginPath();
  g.moveTo(-r*0.95,-r*0.1);
  g.quadraticCurveTo(-r*1.42,-r*0.55,-r*1.5,-r*0.12);
  g.quadraticCurveTo(-r*1.35,-r*0.02,-r*0.95,r*0.1);
  g.closePath(); g.fill();
  g.beginPath();
  g.moveTo(-r*0.95,-r*0.1);
  g.quadraticCurveTo(-r*1.42,r*0.3,-r*1.48,r*0.55);
  g.quadraticCurveTo(-r*1.2,r*0.1,-r*0.95,r*0.1);
  g.closePath(); g.fill();

  const bodyGrad = g.createLinearGradient(-r, -r*0.7, r*0.8, r*0.8);
  bodyGrad.addColorStop(0,'#243440');
  bodyGrad.addColorStop(0.55,'#0b141c');
  bodyGrad.addColorStop(1,'#03070b');
  g.fillStyle = bodyGrad;
  g.beginPath(); g.ellipse(0,0,r*1.12,r*0.7,0,0,TAU); g.fill();

  g.fillStyle = 'rgba(210,238,247,.14)';
  g.beginPath(); g.ellipse(r*0.14,r*0.18,r*0.82,r*0.38,0,0,TAU); g.fill();

  g.fillStyle = '#d9eef3';
  g.beginPath(); g.ellipse(r*0.68,-r*0.1,r*0.25,r*0.2,-0.25,0,TAU); g.fill();
  g.fillStyle = '#071018';
  g.beginPath(); g.arc(r*0.73,-r*0.08,r*0.09,0,TAU); g.fill();
  g.fillStyle = '#eafcff';
  g.beginPath(); g.arc(r*0.76,-r*0.12,r*0.032,0,TAU); g.fill();

  g.fillStyle = 'rgba(189,222,232,.34)';
  g.beginPath(); g.ellipse(-r*0.26,-r*0.28,r*0.34,r*0.12,0.15,0,TAU); g.fill();

  g.fillStyle = '#0a141c';
  g.beginPath();
  g.moveTo(-r*0.22,-r*0.55);
  g.quadraticCurveTo(-r*0.62,-r*1.24,-r*0.92,-r*0.8);
  g.quadraticCurveTo(-r*0.55,-r*0.55,-r*0.32,-r*0.32);
  g.closePath(); g.fill();

  g.fillStyle = 'rgba(6,14,21,.92)';
  g.beginPath(); g.ellipse(r*0.3,r*0.46,r*0.34,r*0.13,0.4,0,TAU); g.fill();
  g.beginPath(); g.ellipse(-r*0.18,-r*0.42,r*0.26,r*0.1,-0.3,0,TAU); g.fill();
  g.restore();
}

function buildOrcaSprite(){
  orcaSprite = makeCacheCanvas(240,240);
  const g = orcaSprite.getContext('2d');
  g.translate(120,120);
  drawOrcaBody(g,60);
}

function drawBackdrop(t){
  if(bgCache) ctx.drawImage(bgCache,0,0,W,H);
  else { ctx.fillStyle = '#04121c'; ctx.fillRect(0,0,W,H); }

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const aurora = [
    {y:0.06,amp:34,sp:0.22,color:'rgba(80,240,185,.09)',w:52},
    {y:0.13,amp:46,sp:0.16,color:'rgba(95,205,255,.07)',w:40},
    {y:0.2,amp:28,sp:0.28,color:'rgba(150,125,255,.06)',w:34}
  ];
  for(const a of aurora){
    ctx.beginPath();
    const baseY = H*a.y;
    ctx.moveTo(-20, baseY);
    for(let x=-20;x<=W+20;x+=44){
      const yy = baseY + Math.sin(x*0.005 + t*a.sp)*a.amp + Math.sin(x*0.013 - t*a.sp*1.7)*a.amp*0.35;
      ctx.lineTo(x,yy);
    }
    ctx.strokeStyle = a.color;
    ctx.lineWidth = a.w;
    ctx.lineCap = 'round';
    ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  ctx.lineWidth = 1.2;
  for(let i=0;i<5;i++){
    const y = H*(0.3 + i*0.14);
    ctx.beginPath();
    for(let x=-30;x<=W+30;x+=24){
      const yy = y + Math.sin(x*0.011 + t*0.55 + i*1.3)*7 + Math.sin(x*0.004 - t*0.31)*11;
      if(x===-30) ctx.moveTo(x,yy); else ctx.lineTo(x,yy);
    }
    ctx.strokeStyle = 'rgba(95,205,230,'+(0.028 + (i%3)*0.012)+')';
    ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  for(const gl of seaGlints){
    const tw = 0.5 + 0.5*Math.sin(t*1.4 + gl.ph);
    if(tw < 0.55) continue;
    ctx.globalAlpha = (tw-0.55)*0.5;
    ctx.fillStyle = '#9cecff';
    ctx.beginPath();
    ctx.arc(gl.x*W, H*0.24 + gl.y*H*0.72, gl.r, 0, TAU);
    ctx.fill();
  }
  ctx.restore();

  ctx.save();
  for(const f of screenSnow){
    const x = f.x*W + Math.sin(t*0.25 + f.ph)*f.amp;
    const y = (f.y*H + t*f.sp) % (H+20) - 10;
    ctx.globalAlpha = f.a;
    ctx.fillStyle = '#dffaff';
    ctx.beginPath();
    ctx.arc(x,y,f.r,0,TAU);
    ctx.fill();
  }
  ctx.restore();
}

function drawFloatChunks(t){
  for(const c of floatChunks){
    const x = Math.cos(c.a)*c.d + Math.sin(t*0.16 + c.phase)*5;
    const y = Math.sin(c.a)*c.d + Math.cos(t*0.12 + c.phase)*4;
    ctx.save();
    ctx.translate(x,y);
    ctx.rotate(c.a + Math.sin(t*0.1+c.phase)*0.1);
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = '#c7edf6';
    ctx.beginPath();
    c.pts.forEach((p,i)=>{ if(i===0) ctx.moveTo(p.x,p.y); else ctx.lineTo(p.x,p.y); });
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(235,253,255,.5)';
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.restore();
  }
}

function drawIsland(t){
  const dmg = clamp(1 - state.integrity/Math.max(1,state.maxIntegrity), 0, 1);

  if(worldCache) ctx.drawImage(worldCache, -worldCache.width/2, -worldCache.height/2);

  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.strokeStyle = 'rgba(205,248,255,.55)';
  ctx.lineWidth = 1.4;
  ctx.setLineDash([9,17]);
  ctx.lineDashOffset = -t*16;
  ctx.beginPath(); ctx.ellipse(0,0,RX+13,RY+10,0,0,TAU); ctx.stroke();
  ctx.globalAlpha = 0.28;
  ctx.lineDashOffset = t*12;
  ctx.beginPath(); ctx.ellipse(0,0,RX+27,RY+21,0,0,TAU); ctx.stroke();
  ctx.restore();

  if(dmg > 0.02){
    const cracksToShow = Math.ceil(crackLines.length*dmg);
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for(let i=0;i<cracksToShow;i++){
      const c = crackLines[i];
      ctx.globalAlpha = c.a*0.5 + dmg*0.4;
      ctx.strokeStyle = dmg > 0.55 ? 'rgba(32,74,94,.9)' : 'rgba(46,104,127,.75)';
      ctx.lineWidth = c.w;
      ctx.beginPath();
      c.pts.forEach((q,j)=>{ if(j===0) ctx.moveTo(q.x,q.y); else ctx.lineTo(q.x,q.y); });
      ctx.stroke();
      ctx.globalAlpha *= 0.45;
      ctx.strokeStyle = 'rgba(255,255,255,.75)';
      ctx.lineWidth = c.w*0.5;
      ctx.stroke();
    }
    ctx.restore();
  }

  if(state.hitFlash > 0.01){
    ctx.save();
    ctx.globalAlpha = state.hitFlash*0.35;
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = 'rgba(255,90,100,.8)';
    ctx.lineWidth = 8;
    islandPath(1);
    ctx.stroke();
    ctx.restore();
  }
}

function drawPads(t){
  if(state.phase === 'over') return;
  if(!state.selectedBuild || state.selectedBuild.kind !== 'turret') return;
  for(let i=0;i<PADS.length;i++){
    const p = PADS[i];
    if(state.turrets.some(tr=>tr.pad===i)) continue;
    const pulse = 0.5 + 0.5*Math.sin(t*2.4 + i);
    ctx.save();
    ctx.translate(p.x,p.y);
    ctx.globalAlpha = 0.82;
    ctx.strokeStyle = 'rgba(130,244,255,'+(0.55+pulse*0.35)+')';
    ctx.lineWidth = 2.2;
    ctx.setLineDash([4,5]);
    ctx.lineDashOffset = -t*10;
    ctx.beginPath(); ctx.arc(0,0,24,0,TAU); ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = '#c9fbff';
    ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(-7,0); ctx.lineTo(7,0); ctx.moveTo(0,-7); ctx.lineTo(0,7); ctx.stroke();
    ctx.globalAlpha = 0.22 + pulse*0.22;
    ctx.strokeStyle = '#7ce8ff';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0,0,31+pulse*3,0,TAU); ctx.stroke();
    ctx.restore();
  }
}

function drawTraps(t){
  for(const tr of state.traps){
    const spec = TRAP_BY[tr.id];
    const st = trapStats(tr);
    const cooling = state.time < tr.cooldownUntil;
    const active = tr.activeUntil > 0;
    ctx.save();
    ctx.translate(tr.x,tr.y);
    if(cooling){
      ctx.globalAlpha = 0.38;
    }
    if(active){
      const p = 0.6 + 0.4*Math.sin(t*7);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = 'rgba(255,220,140,'+(0.25+p*0.2)+')';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0,0,st.radius*0.4+p*4,0,TAU); ctx.stroke();
      ctx.restore();
    }
    drawTrapSprite(ctx,tr,t,false);
    if(cooling && spec.kind !== 'decoy'){
      const frac = clamp((tr.cooldownUntil-state.time)/st.cooldown,0,1);
      ctx.globalAlpha = 0.7;
      ctx.strokeStyle = 'rgba(130,220,240,.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0,0,22,-Math.PI/2,-Math.PI/2 + TAU*(1-frac));
      ctx.stroke();
    }
    if(state.selectedItem === tr){
      ctx.globalAlpha = 0.45;
      ctx.strokeStyle = spec.color;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6,8]);
      ctx.lineDashOffset = -t*14;
      ctx.beginPath(); ctx.arc(0,0,st.radius,0,TAU); ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();
  }
}

function drawTrapSprite(g, tr, t, icon){
  const spec = TRAP_BY[tr.id];
  const pulse = 0.5 + 0.5*Math.sin(t*3 + (tr.idNum||0));
  g.save();
  g.fillStyle = 'rgba(0,0,0,.28)';
  g.beginPath(); g.ellipse(0,5,20,10,0,0,TAU); g.fill();
  g.fillStyle = 'rgba(9,39,53,.92)';
  g.strokeStyle = 'rgba(150,230,248,.3)';
  g.lineWidth = 1.2;
  g.beginPath(); g.arc(0,0,18,0,TAU); g.fill(); g.stroke();
  if(spec.kind === 'mine'){
    g.fillStyle = '#1c2c37';
    g.beginPath(); g.arc(0,0,11,0,TAU); g.fill();
    g.strokeStyle = spec.color;
    g.lineWidth = 1.8;
    for(let i=0;i<8;i++){
      const a=i/8*TAU;
      g.beginPath(); g.moveTo(Math.cos(a)*11,Math.sin(a)*11); g.lineTo(Math.cos(a)*15,Math.sin(a)*15); g.stroke();
    }
    g.fillStyle = 'rgba(255,120,105,'+(0.55+pulse*0.45)+')';
    g.beginPath(); g.arc(0,0,4.2,0,TAU); g.fill();
  } else if(spec.kind === 'net'){
    g.strokeStyle = '#9fdcff';
    g.lineWidth = 1.2;
    for(let i=-2;i<=2;i++){
      g.beginPath(); g.moveTo(-12,i*5); g.lineTo(12,i*5); g.stroke();
      g.beginPath(); g.moveTo(i*5,-12); g.lineTo(i*5,12); g.stroke();
    }
    g.strokeStyle = 'rgba(210,246,255,.8)';
    g.beginPath(); g.arc(0,0,13,0,TAU); g.stroke();
  } else if(spec.kind === 'spikes'){
    g.fillStyle = '#dffaff';
    g.strokeStyle = '#8ed8ee';
    g.lineWidth = 1;
    for(let i=0;i<7;i++){
      const a=i/7*TAU;
      g.beginPath();
      g.moveTo(Math.cos(a)*7,Math.sin(a)*7);
      g.lineTo(Math.cos(a-0.16)*15,Math.sin(a-0.16)*15);
      g.lineTo(Math.cos(a+0.16)*15,Math.sin(a+0.16)*15);
      g.closePath(); g.fill(); g.stroke();
    }
    g.fillStyle = 'rgba(255,255,255,.55)';
    g.beginPath(); g.arc(0,0,5,0,TAU); g.fill();
  } else if(spec.kind === 'decoy'){
    g.save();
    g.rotate(Math.sin(t*2 + (tr.idNum||0))*0.2);
    g.fillStyle = '#ffd27a';
    g.beginPath();
    g.moveTo(-11,0);
    g.quadraticCurveTo(-2,-11,9,-3);
    g.lineTo(15,0);
    g.lineTo(9,3);
    g.quadraticCurveTo(-2,11,-11,0);
    g.fill();
    g.fillStyle = '#3a2a12';
    g.beginPath(); g.arc(4,-1.5,1.7,0,TAU); g.fill();
    g.restore();
  } else if(spec.kind === 'freeze'){
    g.strokeStyle = '#a9f3ff';
    g.lineWidth = 1.6;
    for(let i=0;i<3;i++){
      const a=i/3*Math.PI;
      g.beginPath();
      g.moveTo(Math.cos(a)*13,Math.sin(a)*13);
      g.lineTo(-Math.cos(a)*13,-Math.sin(a)*13);
      g.stroke();
    }
    g.fillStyle = 'rgba(125,240,255,'+(0.5+pulse*0.4)+')';
    g.beginPath(); g.arc(0,0,4,0,TAU); g.fill();
  }
  if(!icon){
    g.fillStyle = spec.color;
    g.globalAlpha = 0.8;
    g.beginPath(); g.arc(14,-14,2,0,TAU); g.fill();
  }
  g.restore();
}

function drawTurretSprite(g, t, time, icon){
  const spec = TURRET_BY[t.id];
  const lvl = t.level || 1;
  const recoil = t.recoil || 0;
  g.save();
  g.fillStyle = 'rgba(0,0,0,.3)';
  g.beginPath(); g.ellipse(0,5,20,12,0,0,TAU); g.fill();

  g.fillStyle = 'rgba(221,246,255,.96)';
  g.beginPath(); g.arc(0,0,17,0,TAU); g.fill();
  g.strokeStyle = 'rgba(120,200,220,.8)';
  g.lineWidth = 1.4;
  g.stroke();
  g.fillStyle = 'rgba(120,185,205,.35)';
  g.beginPath(); g.arc(0,0,12,0,TAU); g.fill();

  g.save();
  g.rotate(t.angle||0);
  g.translate(-recoil*3,0);
  if(spec.id === 'harpoon'){
    g.fillStyle = '#315c70';
    g.fillRect(0,-5,21,4);
    g.fillRect(0,1,21,4);
    g.fillStyle = spec.accent;
    g.fillRect(19,-5,4,4);
    g.fillRect(19,1,4,4);
  } else if(spec.id === 'ice'){
    g.fillStyle = '#4d92ae';
    g.fillRect(0,-4,20,8);
    g.fillStyle = spec.accent;
    g.beginPath();
    g.moveTo(19,-7); g.lineTo(28,0); g.lineTo(19,7); g.lineTo(15,0);
    g.closePath(); g.fill();
  } else if(spec.id === 'sonic'){
    g.strokeStyle = spec.accent;
    g.lineWidth = 2.2;
    g.beginPath(); g.arc(3,0,11,-1.05,1.05); g.stroke();
    g.beginPath(); g.arc(3,0,16,-0.9,0.9); g.stroke();
    g.fillStyle = spec.color;
    g.beginPath(); g.arc(0,0,6,0,TAU); g.fill();
  } else if(spec.id === 'mortar'){
    g.fillStyle = '#5c6f7c';
    g.fillRect(0,-7,18,14);
    g.fillStyle = spec.accent;
    g.beginPath(); g.ellipse(18,0,5,7,0,0,TAU); g.fill();
    g.fillStyle = '#2d3b46';
    g.beginPath(); g.arc(18,0,3,0,TAU); g.fill();
  } else if(spec.id === 'tesla'){
    g.strokeStyle = spec.color;
    g.lineWidth = 2;
    for(let i=0;i<3;i++){
      g.beginPath(); g.arc(8+i*4,0,5,0,TAU); g.stroke();
    }
    g.fillStyle = spec.accent;
    g.beginPath(); g.arc(21,0,4,0,TAU); g.fill();
  } else if(spec.id === 'aurora'){
    g.fillStyle = '#3d7b6d';
    g.beginPath();
    g.moveTo(0,-6); g.lineTo(24,-4); g.lineTo(30,0); g.lineTo(24,4); g.lineTo(0,6);
    g.closePath(); g.fill();
    g.fillStyle = spec.color;
    g.fillRect(6,-2,22,4);
    g.fillStyle = spec.accent;
    g.beginPath(); g.moveTo(26,-4); g.lineTo(34,0); g.lineTo(26,4); g.closePath(); g.fill();
  }
  g.restore();

  g.fillStyle = spec.color;
  for(let i=0;i<lvl;i++){
    g.globalAlpha = 0.9;
    g.beginPath();
    g.arc(-6 + i*3.2, 20, 1.4, 0, TAU);
    g.fill();
  }
  g.globalAlpha = 1;
  g.restore();
}

function drawTurrets(t){
  for(const tr of state.turrets){
    ctx.save();
    ctx.translate(tr.x,tr.y);
    if(state.selectedItem === tr){
      const st = turretStats(tr);
      ctx.globalAlpha = 0.45;
      ctx.strokeStyle = TURRET_BY[tr.id].color;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6,8]);
      ctx.lineDashOffset = -t*14;
      ctx.beginPath(); ctx.arc(0,0,st.range,0,TAU); ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    }
    drawTurretSprite(ctx, tr, t, false);
    ctx.restore();
  }
}

function drawEnemy(e, t){
  const r = e.r;
  const bob = Math.sin(t*4 + e.seed)*1.4;
  const frozen = e.stunUntil > state.time;
  const slowed = e.slowUntil > state.time;
  ctx.save();
  ctx.translate(e.x,e.y+bob);

  ctx.globalAlpha = 0.3;
  ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.ellipse(0, r*0.5, r*0.98, r*0.42, 0, 0, TAU); ctx.fill();
  ctx.globalAlpha = 1;

  ctx.save();
  ctx.rotate(e.angle + Math.sin(t*7 + e.seed)*0.035);
  const scl = r/60;
  ctx.scale(scl,scl);
  if(orcaSprite){
    ctx.drawImage(orcaSprite,-120,-120,240,240);
  } else {
    ctx.fillStyle = '#0a121a';
    ctx.beginPath(); ctx.ellipse(0,0,r*1.1,r*0.68,0,0,TAU); ctx.fill();
  }
  ctx.restore();

  if(slowed){
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = '#bff4ff';
    ctx.lineWidth = 1.3;
    for(let i=0;i<5;i++){
      const a=i/5*TAU + t*0.3;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a)*r*0.8,Math.sin(a)*r*0.5);
      ctx.lineTo(Math.cos(a+0.2)*r*1.02,Math.sin(a+0.2)*r*0.62);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  if(e.type === 'boss'){
    ctx.strokeStyle = 'rgba(255,120,100,.6)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(0,0,r*1.22,r*0.8,0,0,TAU); ctx.stroke();
  }
  if(frozen){
    ctx.save();
    ctx.globalAlpha = 0.6;
    ctx.strokeStyle = '#d8fbff';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0,0,r*1.24,0,TAU); ctx.stroke();
    for(let i=0;i<6;i++){
      const a=i/6*TAU + t*0.4;
      ctx.fillStyle = '#eaffff';
      ctx.beginPath(); ctx.arc(Math.cos(a)*r*1.24,Math.sin(a)*r*1.24,r*0.08,0,TAU); ctx.fill();
    }
    ctx.restore();
  }

  if(e.hp < e.maxHp - 0.1 || e.type === 'boss'){
    const w = Math.max(34, r*2.1);
    ctx.save();
    ctx.fillStyle = 'rgba(2,12,18,.78)';
    ctx.fillRect(-w/2, -r-15, w, 4.5);
    const p = clamp(e.hp/e.maxHp,0,1);
    ctx.fillStyle = p>0.5?'#7df3c8':p>0.25?'#ffd27a':'#ff7a7f';
    ctx.fillRect(-w/2, -r-15, w*p, 4.5);
    ctx.strokeStyle = 'rgba(220,250,255,.35)';
    ctx.lineWidth = 0.8;
    ctx.strokeRect(-w/2, -r-15, w, 4.5);
    ctx.restore();
  }
  if(e.type === 'boss'){
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.font = '800 10px ui-rounded, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffb3ad';
    ctx.fillText('ЛЕДОКОЛ', 0, -r-22);
    ctx.restore();
  }
  ctx.restore();
}

function drawEnemies(t){
  const sorted = state.enemies.slice().sort((a,b)=>a.y-b.y);
  for(const e of sorted) drawEnemy(e,t);
}

function drawSealSprite(g, seal, t, scale){
  const s = scale || 1;
  const moving = seal.moving;
  const bob = Math.sin(t*3.2)*1.3;
  g.save();
  g.scale(s,s);
  g.fillStyle = 'rgba(0,0,0,.28)';
  g.beginPath(); g.ellipse(0,11,29,12,0,0,TAU); g.fill();

  g.save();
  g.translate(0,bob);
  g.rotate(seal.angle || 0);

  const bodyGrad = g.createLinearGradient(-24,-18,20,20);
  bodyGrad.addColorStop(0,'#e8f7fb');
  bodyGrad.addColorStop(0.48,'#b6d5e2');
  bodyGrad.addColorStop(1,'#7fa4b4');
  g.fillStyle = bodyGrad;
  g.beginPath(); g.ellipse(-2,0,25,16,0,0,TAU); g.fill();

  g.fillStyle = 'rgba(245,253,255,.7)';
  g.beginPath(); g.ellipse(-2,5,18,8,0,0,TAU); g.fill();

  const flip = moving ? Math.sin(t*14)*0.4 : Math.sin(t*2.4)*0.14;
  g.fillStyle = '#9dbfcd';
  g.save();
  g.translate(-7,9); g.rotate(0.5+flip);
  g.beginPath(); g.ellipse(0,5,11,5,0,0,TAU); g.fill();
  g.restore();
  g.save();
  g.translate(-7,-9); g.rotate(-0.5-flip);
  g.beginPath(); g.ellipse(0,-5,11,5,0,0,TAU); g.fill();
  g.restore();

  g.fillStyle = '#83a8b8';
  g.save();
  g.translate(-23,0); g.rotate(flip*0.8);
  g.beginPath(); g.moveTo(0,-7); g.quadraticCurveTo(-12,-12,-15,0); g.quadraticCurveTo(-12,12,0,7); g.closePath(); g.fill();
  g.restore();

  const hx = 18, hy = 0;
  const headGrad = g.createRadialGradient(hx+3,hy-5,2,hx,hy,16);
  headGrad.addColorStop(0,'#f7feff');
  headGrad.addColorStop(1,'#b7d7e3');
  g.fillStyle = headGrad;
  g.beginPath(); g.arc(hx,hy,14,0,TAU); g.fill();

  g.fillStyle = '#ff8f9c';
  g.beginPath(); g.ellipse(hx+13,hy+3,3.2,2.6,0,0,TAU); g.fill();

  g.strokeStyle = '#e7f6fa';
  g.lineWidth = 0.9;
  for(let i=-1;i<=1;i++){
    g.beginPath();
    g.moveTo(hx+9,hy+3);
    g.lineTo(hx+22,hy+1+i*4.5);
    g.stroke();
  }

  g.fillStyle = '#10242e';
  g.beginPath(); g.arc(hx+5,hy-4,2.6,0,TAU); g.fill();
  g.beginPath(); g.arc(hx+5,hy+4,2.6,0,TAU); g.fill();
  g.fillStyle = '#ffffff';
  g.beginPath(); g.arc(hx+5.8,hy-4.8,0.9,0,TAU); g.fill();
  g.beginPath(); g.arc(hx+5.8,hy+3.2,0.9,0,TAU); g.fill();

  g.fillStyle = '#e8673c';
  g.save();
  g.translate(9,0);
  g.beginPath(); g.roundRect(-3,-14,7,28,3);
  g.fill();
  g.fillStyle = '#ffb37a';
  g.beginPath(); g.roundRect(-3,-14,7,5,2);
  g.fill();
  g.restore();

  g.restore();
  g.restore();
}

function drawSeal(t){
  ctx.save();
  ctx.translate(state.seal.x,state.seal.y);
  drawSealSprite(ctx, state.seal, t, 1);
  ctx.restore();
}

function drawProjectiles(t){
  for(const p of state.projectiles){
    if(p.kind === 'harpoon' || p.kind === 'ice'){
      const a = Math.atan2(p.vy,p.vx);
      ctx.save();
      ctx.translate(p.x,p.y);
      ctx.rotate(a);
      ctx.strokeStyle = p.color;
      ctx.lineWidth = p.kind === 'harpoon' ? 2.6 : 2;
      ctx.beginPath();
      ctx.moveTo(-10,0);
      ctx.lineTo(8,0);
      ctx.stroke();
      if(p.kind === 'ice'){
        ctx.fillStyle = '#e8fdff';
        ctx.beginPath();
        ctx.moveTo(9,0); ctx.lineTo(3,-4); ctx.lineTo(-2,0); ctx.lineTo(3,4); ctx.closePath(); ctx.fill();
      } else {
        ctx.fillStyle = '#e9feff';
        ctx.beginPath(); ctx.moveTo(13,0); ctx.lineTo(6,-3.5); ctx.lineTo(6,3.5); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    } else if(p.kind === 'mortar'){
      const prog = clamp(p.t/p.dur,0,1);
      const height = Math.sin(prog*Math.PI)*68;
      ctx.save();
      ctx.globalAlpha = 0.28;
      ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.ellipse(p.x,p.y,7,4,0,0,TAU); ctx.fill();
      ctx.restore();
      ctx.save();
      ctx.translate(p.x,p.y-height);
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(0,0,6,0,TAU); ctx.fill();
      ctx.fillStyle = '#fff4d9';
      ctx.beginPath(); ctx.arc(-1.5,-1.5,2.2,0,TAU); ctx.fill();
      ctx.restore();
    }
  }
}

function drawEffects(t){
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for(const b of state.beams){
    const a = clamp(b.life/b.maxLife,0,1);
    ctx.globalAlpha = a;
    ctx.strokeStyle = b.color;
    ctx.lineWidth = b.width*2.2;
    ctx.beginPath(); ctx.moveTo(b.ax,b.ay); ctx.lineTo(b.bx,b.by); ctx.stroke();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(1,b.width*0.6);
    ctx.beginPath(); ctx.moveTo(b.ax,b.ay); ctx.lineTo(b.bx,b.by); ctx.stroke();
  }
  for(const r of state.rings){
    const k = 1 - r.life/r.maxLife;
    const a = clamp(r.life/r.maxLife,0,1);
    ctx.globalAlpha = a;
    ctx.strokeStyle = r.color;
    ctx.lineWidth = r.width*(0.5+a*0.7);
    ctx.beginPath(); ctx.arc(r.x,r.y,r.max*(0.15+k*0.85),0,TAU); ctx.stroke();
  }
  ctx.restore();

  for(const p of state.particles){
    const a = clamp(p.life/p.maxLife,0,1);
    ctx.globalAlpha = a;
    ctx.fillStyle = p.color;
    if(p.glow){
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.beginPath(); ctx.arc(p.x,p.y,p.size*(0.8+a*0.6),0,TAU); ctx.fill();
      ctx.restore();
    } else {
      ctx.beginPath(); ctx.arc(p.x,p.y,p.size,0,TAU); ctx.fill();
    }
  }
  ctx.globalAlpha = 1;

  for(const tx of state.texts){
    const a = clamp(tx.life/tx.maxLife,0,1);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.font = '900 '+tx.size+'px ui-rounded, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(2,14,21,.7)';
    ctx.strokeText(tx.text,tx.x,tx.y);
    ctx.fillStyle = tx.color;
    ctx.fillText(tx.text,tx.x,tx.y);
    ctx.restore();
  }
}

function drawGhost(t){
  if(state.selectedBuild && state.selectedBuild.kind === 'trap' && state.pointer){
    const w = state.pointer;
    const spec = TRAP_BY[state.selectedBuild.id];
    const n = ellipseNorm(w.x,w.y);
    const ok = n >= 1.04 && n <= 2.15;
    ctx.save();
    ctx.translate(w.x,w.y);
    ctx.globalAlpha = 0.8;
    ctx.strokeStyle = ok ? '#9feaff' : '#ff8d95';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5,6]);
    ctx.lineDashOffset = -t*12;
    ctx.beginPath(); ctx.arc(0,0,spec.radius,0,TAU); ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 0.65;
    drawTrapSprite(ctx,{id:spec.id,level:1,idNum:1},t,false);
    ctx.restore();
  }
}

function drawWorld(t){
  ctx.save();
  ctx.translate(cx,cy);
  const sx = Math.sin(t*91)*state.shake*0.5;
  const sy = Math.cos(t*77)*state.shake*0.5;
  ctx.translate(sx,sy);
  ctx.scale(viewScale,viewScale);

  drawIsland(t);
  drawTraps(t);
  drawPads(t);
  drawTurrets(t);
  drawEnemies(t);
  drawSeal(t);
  drawGhost(t);
  drawProjectiles(t);
  drawEffects(t);

  ctx.restore();
}

function drawScreenOverlay(t){
  if(vigCache) ctx.drawImage(vigCache,0,0,W,H);
  if(state.hitFlash > 0.01){
    ctx.save();
    ctx.globalAlpha = Math.min(1,state.hitFlash*1.1);
    if(redCache) ctx.drawImage(redCache,0,0,W,H);
    ctx.restore();
  }
  if(state.integrity/state.maxIntegrity < 0.28 && (state.phase==='wave'||state.phase==='build')){
    const pulse = 0.5 + 0.5*Math.sin(t*4);
    ctx.save();
    ctx.globalAlpha = (0.28 - state.integrity/state.maxIntegrity)/0.28*0.55*(0.5+pulse*0.5);
    if(redCache) ctx.drawImage(redCache,0,0,W,H);
    ctx.restore();
  }
}

function render(t){
  drawBackdrop(t);
  drawWorld(t);
  drawScreenOverlay(t);
}

let logicAccum = 0;
let loopActive = false;
let rafHandle = 0;

function startLoop(){
  if(loopActive) return;
  loopActive = true;
  lastFrame = performance.now();
  rafHandle = requestAnimationFrame(frame);
}

function stopLoop(){
  loopActive = false;
  if(rafHandle) cancelAnimationFrame(rafHandle);
  rafHandle = 0;
}

function frame(now){
  if(!loopActive) return;
  const realDt = Math.min(0.25, Math.max(0, (now - lastFrame)/1000)) || 0;
  lastFrame = now;
  visualTime += realDt;
  if(state.phase === 'menu'){
    render(visualTime);
    loopActive = false;
    return;
  }
  const frozen = state.paused || state.modal;
  if(!frozen && state.phase !== 'over'){
    logicAccum += realDt;
    while(logicAccum > 0){
      const step = Math.min(0.05, logicAccum);
      update(step);
      logicAccum -= step;
      if(state.phase !== 'wave' && state.phase !== 'build') break;
    }
  } else {
    logicAccum = 0;
  }
  if(!state.paused && !state.modal){
    updateEffects(realDt);
    if(state.phase === 'over') state.shake *= Math.exp(-realDt*4);
  }
  refreshHud();
  render(visualTime);
  if(state.phase === 'over'){
    loopActive = false;
    rafHandle = 0;
    return;
  }
  rafHandle = requestAnimationFrame(frame);
}

function drawLogoSeal(){
  const c = els.logoSeal;
  if(!c) return;
  const g = c.getContext('2d');
  g.setTransform(1,0,0,1,0,0);
  g.clearRect(0,0,c.width,c.height);
  g.save();
  g.translate(c.width/2,c.height/2);
  g.scale(2.15,2.15);
  drawSealSprite(g,{angle:-0.45,moving:false},0.6,1);
  g.restore();
}

window.addEventListener('resize', ()=>{ resize(); buildCaches(); if(state.phase==='menu') render(visualTime); });
resize();
buildCaches();
initGame();
render(visualTime);
