'use strict';

function makeWave(n){
  const list = [];
  const count = 2 + Math.ceil(n*1.25);
  for(let i=0;i<count;i++){
    const r = Math.random();
    let type = 'scout';
    if(n >= 2 && r < 0.36) type = 'raider';
    if(n >= 4 && r < 0.15) type = 'brute';
    if(n >= 6 && r > 0.92) type = 'brute';
    list.push(type);
  }
  if(n % 5 === 0) list.push('boss');
  return list;
}

function makeTurret(id, padIndex, free){
  const p = PADS[padIndex] || {x:0,y:0};
  return {id, x:p.x, y:p.y, pad:padIndex, level:1, cd:0, angle:-Math.PI/2, spent:free?0:TURRET_BY[id].cost, recoil:0, idNum:state.nextId++};
}

function makeTrap(id, x, y){
  return {id, x, y, level:1, spent:TRAP_BY[id].cost, cooldownUntil:0, activeUntil:0, idNum:state.nextId++};
}

function startWave(){
  state.wave++;
  state.phase = 'wave';
  state.spawnQueue = makeWave(state.wave);
  state.spawnTimer = 0.35;
  state.buildTimer = 0;
  const boss = state.wave % 5 === 0;
  showBanner('ВОЛНА ' + state.wave, boss ? 'ЛЕДОКОЛ' : String(state.wave), boss ? 'Идёт босс — держите оборону' : 'Косатки приближаются');
  sfx('wave');
}

function startGame(){
  initAudio();
  if(audioCtx && audioCtx.state==='suspended') audioCtx.resume();
  state.phase = 'wave';
  state.paused = false;
  state.modal = null;
  state.wave = 0;
  state.time = 0;
  state.fish = 160;
  state.meta = {ice:{hp:0,regen:0,armor:0},seal:{speed:0,roar:0,radius:0,greed:0}};
  state.maxIntegrity = iceMax();
  state.integrity = state.maxIntegrity;
  state.turrets = [makeTurret('harpoon', 0, true)];
  state.traps = [];
  state.enemies = [];
  state.projectiles = [];
  state.particles = [];
  state.rings = [];
  state.beams = [];
  state.texts = [];
  state.spawnQueue = [];
  state.spawnTimer = 0;
  state.buildTimer = 0;
  state.selectedBuild = null;
  state.selectedItem = null;
  state.selectedItemKind = null;
  state.shake = 0;
  state.hitFlash = 0;
  state.roarCd = 0;
  state.warnedLow = false;
  state.overTimer = 0;
  state.pointer = null;
  state.seal.x = 0;
  state.seal.y = 155;
  state.seal.vx = 0;
  state.seal.vy = 0;
  state.seal.angle = -Math.PI/2;
  state.seal.moving = false;
  els.start.classList.add('hidden');
  els.over.classList.add('hidden');
  els.pause.classList.add('hidden');
  els.metaModal.classList.add('hidden');
  els.tp.classList.add('hidden');
  setBuildTab('turret');
  refreshAllCards();
  refreshHud(true);
  startWave();
  startLoop();
  setTimeout(()=>showToast('Стройте турели на свободных падах'), 700);
}

function addParticle(x,y,color,size,life,vx,vy,gravity,glow){
  if(state.particles.length > 520) return;
  state.particles.push({x,y,vx:vx||0,vy:vy||0,color,size:size||2,life:life||.6,maxLife:life||.6,gravity:gravity||0,glow:!!glow,spin:rand(-6,6),rot:rand(0,TAU)});
}
function burst(x,y,color,count,speed,size,life){
  for(let i=0;i<count;i++){
    const a = rand(0,TAU), s = rand(speed*.25,speed);
    addParticle(x,y,color,rand(size*.4,size),rand((life||.6)*.5,life||.6),Math.cos(a)*s,Math.sin(a)*s,18,true);
  }
}
function addRing(x,y,max,color,width,life){
  state.rings.push({x,y,max,color,width:width||3,life:life||.5,maxLife:life||.5});
}
function addBeam(ax,ay,bx,by,color,width,life){
  state.beams.push({ax,ay,bx,by,color,width:width||2,life:life||.16,maxLife:life||.16});
}
function addText(x,y,text,color,size){
  if(state.texts.length > 40) return;
  state.texts.push({x,y,text,color:color||'#e8fdff',size:size||12,life:.9,maxLife:.9});
}

function damageEnemy(e, amount){
  if(e.dead) return;
  e.hp -= amount;
  e.hitFlash = Math.min(1, (e.hitFlash||0)+0.5);
  if(amount >= 20) addParticle(e.x,e.y,'#bff6ff',2.5,.35,rand(-30,30),rand(-30,30),0,true);
  if(e.hp <= 0){
    e.dead = true;
    const bounty = Math.round(e.bounty*fishMult());
    state.fish += bounty;
    addText(e.x,e.y-12,'+'+bounty,'#ffe09a',13);
    burst(e.x,e.y,'#9beeff',14,110,3.5,.8);
    burst(e.x,e.y,'#ffffff',8,70,2,.6);
    state.shake = Math.max(state.shake, e.type==='boss'?18:4);
    addRing(e.x,e.y,e.r*2.1,'#b9f6ff',2,.45);
    sfx(e.type==='boss'?'boom':'hit');
  }
}

function damageIce(amount){
  if(state.phase !== 'wave' && state.phase !== 'build') return;
  state.integrity -= amount*(1-iceArmor());
  state.hitFlash = Math.min(1, state.hitFlash + amount*0.025);
  if(!state.warnedLow && state.integrity/state.maxIntegrity < 0.3){
    state.warnedLow = true;
    showToast('Льдина трещит! Прокачайте прочность');
  }
  if(state.integrity <= 0){
    state.integrity = 0;
    gameOver();
  }
}

function gameOver(){
  if(state.phase === 'over') return;
  state.phase = 'over';
  state.overTimer = 0;
  state.best = Math.max(state.best, state.wave);
  saveBest(state.best);
  setText(els.bestNum, state.best);
  setText(els.bestStart, state.best);
  setText(els.overWave, state.wave);
  setText(els.overBest, state.best);
  setText(els.overFish, Math.floor(state.fish));
  els.tp.classList.add('hidden');
  state.selectedItem = null;
  state.selectedItemKind = null;
  clearTimeout(toastTimer);
  els.toast.classList.remove('show');
  els.over.classList.remove('hidden');
  sfx('over');
  for(let i=0;i<30;i++){
    const a=rand(0,TAU), s=rand(20,120);
    addParticle(rand(-RX*.8,RX*.8),rand(-RY*.8,RY*.8),'#c8f6ff',rand(2,6),rand(.8,1.8),Math.cos(a)*s,Math.sin(a)*s,10,true);
  }
  state.shake = 22;
}

function spawnEnemy(type){
  const base = ENEMY_BASE[type];
  const a = rand(0,TAU);
  const x = Math.cos(a)*(RX + rand(68,112));
  const y = Math.sin(a)*(RY + rand(64,106));
  const edge = {x:Math.cos(a)*RX*0.93, y:Math.sin(a)*RY*0.93};
  const scaleHp = Math.pow(1.17, state.wave-1);
  const scaleDmg = 1 + (state.wave-1)*0.06;
  const scaleSpd = 1 + Math.min(0.45, (state.wave-1)*0.016);
  const e = {
    type, x, y, tx:edge.x, ty:edge.y, angle:Math.atan2(edge.y-y, edge.x-x),
    r:base.r, hp:base.hp*scaleHp, maxHp:base.hp*scaleHp, speed:base.speed*scaleSpd,
    dmg:base.dmg*scaleDmg, bounty:base.bounty, attacking:false, dead:false,
    slowUntil:0, stunUntil:0, rootUntil:0, bleedUntil:0, bleedDps:0,
    tauntUntil:0, tauntX:0, tauntY:0, seed:rand(0,TAU), hitFlash:0, age:0,
    idNum:state.nextId++
  };
  if(type==='boss'){ e.hp*=1.05; e.maxHp=e.hp; }
  state.enemies.push(e);
  addRing(x,y,base.r*2.4,'#8ee8ff',2,.5);
  burst(x,y,'#a9efff',8,60,2.5,.5);
}

function completeWave(){
  if(state.phase !== 'wave') return;
  state.phase = 'build';
  state.buildTimer = 13;
  const reward = 42 + state.wave*14;
  state.fish += reward;
  state.integrity = Math.min(state.maxIntegrity, state.integrity + 4);
  showBanner('ВОЛНА ' + state.wave, 'ОТБИТА', '+' + reward + ' рыбы · подготовка 13с');
  showToast('Волна ' + state.wave + ' отбита · +' + reward + ' рыбы');
  addRing(0,0,RX*1.7,'#c4fbff',3,.8);
  sfx('done');
}

function fireTurret(t, target){
  const s = TURRET_BY[t.id], st = turretStats(t);
  t.cd = st.fireRate;
  t.recoil = 1;
  const angle = Math.atan2(target.y-t.y, target.x-t.x);
  const muzzle = {x:t.x+Math.cos(angle)*22, y:t.y+Math.sin(angle)*22};
  addParticle(muzzle.x,muzzle.y,s.accent,2.4,.18,rand(-14,14),rand(-14,14),0,true);
  if(s.projectile === 'harpoon'){
    state.projectiles.push({kind:'harpoon',x:muzzle.x,y:muzzle.y,vx:Math.cos(angle)*720,vy:Math.sin(angle)*720,speed:720,damage:st.damage,target,life:1.5,color:s.color,size:3.5});
    sfx('shoot');
  } else if(s.projectile === 'ice'){
    state.projectiles.push({kind:'ice',x:muzzle.x,y:muzzle.y,vx:Math.cos(angle)*520,vy:Math.sin(angle)*520,speed:520,damage:st.damage,target,life:1.8,color:s.color,size:4,slow:s.slow,slowTime:s.slowTime});
    sfx('ice');
  } else if(s.projectile === 'sonic'){
    const aoe = st.aoe;
    addRing(t.x,t.y,aoe*1.3,'#c9c2ff',4,.5);
    addRing(t.x,t.y,aoe*0.8,'#8f7dff',2,.4);
    for(const e of state.enemies){
      if(e.dead) continue;
      const d = Math.hypot(e.x-t.x,e.y-t.y);
      if(d < aoe+e.r) damageEnemy(e, st.damage*(1-Math.min(.55,d/aoe*.55)));
    }
    state.shake = Math.max(state.shake,3);
    sfx('beam');
  } else if(s.projectile === 'mortar'){
    const dist = Math.hypot(target.x-t.x,target.y-t.y);
    state.projectiles.push({kind:'mortar',x:t.x,y:t.y,startX:t.x,startY:t.y,tx:target.x,ty:target.y,t:0,dur:clamp(dist/430,.42,1.3),damage:st.damage,aoe:st.aoe,color:s.color,size:5});
    sfx('shoot');
  } else if(s.projectile === 'tesla'){
    const chain = [target];
    let last = target;
    for(let i=1;i<s.chain;i++){
      let best=null, bestD=170;
      for(const e of state.enemies){
        if(e.dead || chain.includes(e)) continue;
        const d = Math.hypot(e.x-last.x,e.y-last.y);
        if(d < bestD){ best=e; bestD=d; }
      }
      if(!best) break;
      chain.push(best); last=best;
    }
    let from = {x:t.x,y:t.y};
    for(let i=0;i<chain.length;i++){
      const e = chain[i];
      addBeam(from.x,from.y,e.x,e.y, i===0?'#fff0a0':'#ffe66d', i===0?2.6:1.8,.2);
      damageEnemy(e, st.damage*(1-i*0.12));
      from = {x:e.x,y:e.y};
    }
    sfx('tesla');
  } else if(s.projectile === 'aurora'){
    const dx = target.x-t.x, dy = target.y-t.y, len = Math.hypot(dx,dy)||1;
    const ux=dx/len, uy=dy/len;
    addBeam(t.x,t.y,t.x+ux*st.range,t.y+uy*st.range,'#96ffdb',7,.28);
    addBeam(t.x,t.y,t.x+ux*st.range,t.y+uy*st.range,'#efffff',2.4,.22);
    for(const e of state.enemies){
      if(e.dead) continue;
      const px=e.x-t.x, py=e.y-t.y;
      const proj = px*ux+py*uy;
      if(proj < 0 || proj > st.range) continue;
      const perp = Math.abs(px*uy-py*ux);
      if(perp < 26+e.r) damageEnemy(e, st.damage*(perp<10?1:.65));
    }
    state.shake = Math.max(state.shake,5);
    sfx('beam');
  }
}

function explode(x,y,radius,damage,color){
  addRing(x,y,radius*1.35,color||'#ffe0a6',5,.5);
  addRing(x,y,radius*.65,'#fff4d2',2,.35);
  burst(x,y,color||'#ffbe6b',18,150,4,.7);
  burst(x,y,'#ffffff',8,80,2,.45);
  state.shake = Math.max(state.shake,7);
  for(const e of state.enemies){
    if(e.dead) continue;
    const d = Math.hypot(e.x-x,e.y-y);
    if(d < radius+e.r) damageEnemy(e, damage*(1-Math.min(.45,d/radius*.45)));
  }
  sfx('boom');
}

function useRoar(){
  if(state.phase !== 'wave' && state.phase !== 'build') return;
  if(state.paused || state.modal || state.roarCd > 0) return;
  state.roarCd = roarCooldown();
  const rad = roarRadius();
  const s = state.seal;
  addRing(s.x,s.y,rad,'#b9f8ff',6,.75);
  addRing(s.x,s.y,rad*.64,'#6fe6ff',3,.55);
  burst(s.x,s.y,'#bdf7ff',26,180,4,.8);
  for(const e of state.enemies){
    if(e.dead) continue;
    const dx = e.x-s.x, dy=e.y-s.y, d = Math.hypot(dx,dy)||1;
    if(d < rad+e.r){
      const k = (1-Math.min(1,d/rad))*42;
      e.x += dx/d*k; e.y += dy/d*k;
      e.stunUntil = Math.max(e.stunUntil, state.time+1.0);
      e.attacking = false;
      damageEnemy(e, 10+state.wave*2.5);
    }
  }
  state.shake = Math.max(state.shake,13);
  sfx('roar');
}

function triggerTrap(tr, e){
  const spec = TRAP_BY[tr.id], st = trapStats(tr);
  if(spec.kind === 'decoy'){
    tr.activeUntil = state.time + spec.taunt;
    addRing(tr.x,tr.y,st.radius*2.2,'#ffe09a',3,.6);
    burst(tr.x,tr.y,'#ffd27a',14,70,3,.6);
    for(const en of state.enemies){
      if(en.dead) continue;
      const d = Math.hypot(en.x-tr.x,en.y-tr.y);
      if(d < st.radius*2.4){
        en.tauntUntil = state.time + spec.taunt;
        en.tauntX = tr.x; en.tauntY = tr.y;
        en.attacking = false;
      }
    }
    sfx('tap');
    return;
  }
  tr.cooldownUntil = state.time + st.cooldown;
  if(spec.kind === 'mine'){
    explode(tr.x,tr.y,st.radius,st.damage,'#ffb07a');
  } else if(spec.kind === 'net'){
    addRing(tr.x,tr.y,st.radius,'#9fe2ff',3,.55);
    for(const en of state.enemies){
      if(en.dead) continue;
      if(Math.hypot(en.x-tr.x,en.y-tr.y) < st.radius+en.r){
        en.rootUntil = Math.max(en.rootUntil, state.time+spec.root);
        en.attacking = false;
        damageEnemy(en, st.damage);
      }
    }
    sfx('ice');
  } else if(spec.kind === 'spikes'){
    addRing(tr.x,tr.y,st.radius,'#e4feff',3,.5);
    for(const en of state.enemies){
      if(en.dead) continue;
      if(Math.hypot(en.x-tr.x,en.y-tr.y) < st.radius+en.r){
        en.bleedUntil = Math.max(en.bleedUntil, state.time+spec.bleedTime);
        en.bleedDps = Math.max(en.bleedDps, spec.bleed);
        damageEnemy(en, st.damage);
      }
    }
    sfx('hit');
  } else if(spec.kind === 'freeze'){
    addRing(tr.x,tr.y,st.radius,'#b9f8ff',4,.7);
    addRing(tr.x,tr.y,st.radius*.6,'#f0ffff',2,.5);
    for(const en of state.enemies){
      if(en.dead) continue;
      if(Math.hypot(en.x-tr.x,en.y-tr.y) < st.radius+en.r){
        en.stunUntil = Math.max(en.stunUntil, state.time+spec.stun);
        en.attacking = false;
        damageEnemy(en, st.damage);
      }
    }
    sfx('ice');
  }
}

function updateEffects(dt){
  for(const p of state.particles){
    p.life -= dt;
    p.x += p.vx*dt;
    p.y += p.vy*dt;
    p.vy += p.gravity*dt;
    p.vx *= (1-dt*0.8);
    p.rot += p.spin*dt;
  }
  state.particles = state.particles.filter(p=>p.life>0);
  for(const r of state.rings){ r.life -= dt; }
  state.rings = state.rings.filter(r=>r.life>0);
  for(const b of state.beams){ b.life -= dt; }
  state.beams = state.beams.filter(b=>b.life>0);
  for(const t of state.texts){ t.life -= dt; t.y -= 24*dt; }
  state.texts = state.texts.filter(t=>t.life>0);
}

function update(dt){
  state.time += dt;
  if(state.phase !== 'wave' && state.phase !== 'build') return;
  const s = state.seal;

  let ix = 0, iy = 0;
  if(input.keys.has('a')||input.keys.has('arrowleft')) ix -= 1;
  if(input.keys.has('d')||input.keys.has('arrowright')) ix += 1;
  if(input.keys.has('w')||input.keys.has('arrowup')) iy -= 1;
  if(input.keys.has('s')||input.keys.has('arrowdown')) iy += 1;
  if(input.joy.x || input.joy.y){ ix += input.joy.x; iy += input.joy.y; }
  if(state.tiltEnabled){ ix += state.tiltVec.x*1.15; iy += state.tiltVec.y*1.15; }
  const len = Math.hypot(ix,iy);
  if(len > 1){ ix/=len; iy/=len; }
  const sp = sealSpeed();
  const targetVx = ix*sp, targetVy = iy*sp;
  const accel = 1 - Math.exp(-dt*11);
  s.vx = lerp(s.vx, targetVx, accel);
  s.vy = lerp(s.vy, targetVy, accel);
  s.x += s.vx*dt; s.y += s.vy*dt;
  const speedNow = Math.hypot(s.vx,s.vy);
  s.moving = speedNow > 12;
  if(s.moving){ s.angle = lerpAngle(s.angle, Math.atan2(s.vy,s.vx), 1-Math.exp(-dt*14)); }
  const limitX = RX - 52, limitY = RY - 54;
  const n = Math.sqrt((s.x/limitX)*(s.x/limitX)+(s.y/limitY)*(s.y/limitY));
  if(n > 1){ s.x /= n; s.y /= n; s.vx*=.3; s.vy*=.3; }
  if(s.moving && Math.random() < dt*10){
    addParticle(s.x - Math.cos(s.angle)*20, s.y - Math.sin(s.angle)*20 + 11, 'rgba(220,250,255,.7)', rand(1,2.5), .45, rand(-8,8), rand(-6,2), -6, false);
  }

  if(state.roarCd > 0) state.roarCd = Math.max(0, state.roarCd - dt);
  state.shake *= Math.exp(-dt*5);
  state.hitFlash = Math.max(0, state.hitFlash - dt*1.8);

  if(state.phase === 'build'){
    state.buildTimer -= dt;
    if(state.buildTimer <= 0) startWave();
  } else {
    if(state.spawnQueue.length){
      state.spawnTimer -= dt;
      if(state.spawnTimer <= 0){
        spawnEnemy(state.spawnQueue.shift());
        state.spawnTimer = rand(.62,1.02);
      }
    } else if(state.enemies.length === 0){
      completeWave();
    }
  }

  if(iceRegen() > 0 && state.integrity < state.maxIntegrity){
    state.integrity = Math.min(state.maxIntegrity, state.integrity + iceRegen()*dt);
  }

  for(const t of state.turrets){
    t.cd -= dt;
    t.recoil = Math.max(0,(t.recoil||0) - dt*6);
    const st = turretStats(t);
    let target = null, bestD = Infinity;
    for(const e of state.enemies){
      if(e.dead) continue;
      const d = Math.hypot(e.x-t.x,e.y-t.y);
      if(d < st.range+e.r && d < bestD){ bestD = d; target = e; }
    }
    if(target){
      t.angle = lerpAngle(t.angle, Math.atan2(target.y-t.y,target.x-t.x), 1-Math.exp(-dt*12));
      if(t.cd <= 0) fireTurret(t,target);
    } else if(t.cd < 0) t.cd = 0;
  }

  for(const tr of state.traps){
    const spec = TRAP_BY[tr.id], st = trapStats(tr);
    if(tr.activeUntil > 0){
      if(state.time >= tr.activeUntil){
        tr.activeUntil = 0;
        tr.cooldownUntil = state.time + st.cooldown;
        explode(tr.x,tr.y,st.radius,st.damage,'#ffd27a');
      } else {
        for(const en of state.enemies){
          if(en.dead || en.tauntUntil < state.time) continue;
          const d = Math.hypot(en.x-tr.x,en.y-tr.y);
          if(d < st.radius*2.4){
            en.tauntX = tr.x; en.tauntY = tr.y;
          }
        }
      }
      continue;
    }
    if(state.time < tr.cooldownUntil) continue;
    for(const en of state.enemies){
      if(en.dead) continue;
      if(Math.hypot(en.x-tr.x,en.y-tr.y) < st.radius+en.r){
        triggerTrap(tr,en);
        break;
      }
    }
  }

  updateEnemies(dt);

  for(const p of state.projectiles){
    p.life -= dt;
    if(p.kind === 'mortar'){
      p.t += dt;
      p.x = lerp(p.startX,p.tx,Math.min(1,p.t/p.dur));
      p.y = lerp(p.startY,p.ty,Math.min(1,p.t/p.dur));
      if(p.t >= p.dur){ p.dead = true; explode(p.tx,p.ty,p.aoe,p.damage,p.color); }
      continue;
    }
    if(p.target && !p.target.dead){
      const a = Math.atan2(p.target.y-p.y,p.target.x-p.x);
      p.vx = lerp(p.vx, Math.cos(a)*p.speed, 0.16);
      p.vy = lerp(p.vy, Math.sin(a)*p.speed, 0.16);
    }
    p.x += p.vx*dt; p.y += p.vy*dt;
    for(const e of state.enemies){
      if(e.dead) continue;
      if(Math.hypot(e.x-p.x,e.y-p.y) < e.r+5){
        p.dead = true;
        damageEnemy(e,p.damage);
        if(p.kind === 'ice'){
          e.slowUntil = Math.max(e.slowUntil, state.time+p.slowTime);
          addRing(e.x,e.y,e.r*2,'#bff2ff',1.5,.3);
        }
        burst(p.x,p.y,p.color,5,50,2,.3);
        break;
      }
    }
    if(p.life <= 0) p.dead = true;
  }
  state.projectiles = state.projectiles.filter(p=>!p.dead);
  state.enemies = state.enemies.filter(e=>!e.dead);

  if(state.integrity <= 0) gameOver();
}

function updateEnemies(dt){
  const now = state.time;
  for(const e of state.enemies){
    if(e.dead) continue;
    e.age += dt;
    e.hitFlash = Math.max(0, e.hitFlash - dt*3);
    const frozen = e.stunUntil > now || e.rootUntil > now;
    if(!frozen){
      const taunted = e.tauntUntil > now;
      const tx = taunted ? e.tauntX : e.tx;
      const ty = taunted ? e.tauntY : e.ty;
      const dx = tx-e.x, dy=ty-e.y, d = Math.hypot(dx,dy)||1;
      const slowMul = e.slowUntil > now ? 0.52 : 1;
      if(d > (taunted?14:5)){
        const sp = e.speed*slowMul;
        e.x += dx/d*sp*dt;
        e.y += dy/d*sp*dt;
        e.angle = lerpAngle(e.angle, Math.atan2(dy,dx), 1-Math.exp(-dt*6));
        e.attacking = false;
      } else if(taunted){
        e.angle += dt*2.2;
        e.attacking = false;
      } else {
        e.attacking = true;
      }
    }
    if(e.bleedUntil > now){
      damageEnemy(e, e.bleedDps*dt);
      if(Math.random() < dt*6) addParticle(e.x+rand(-e.r,e.r),e.y+rand(-e.r,e.r),'#ffd0d5',1.5,.4,rand(-10,10),rand(-20,-5),10,false);
    }
    if(e.attacking && !e.dead){
      damageIce(e.dmg*dt);
      if(Math.random() < dt*4){
        addParticle(e.x+rand(-e.r*.5,e.r*.5), e.y+rand(-e.r*.5,e.r*.5), '#d8fbff', rand(1.5,3.5), .5, rand(-30,30), rand(-40,-10), 20, true);
        state.shake = Math.max(state.shake, 2.2);
        sfx('hit');
      }
    }
    if(e.slowUntil > now && Math.random() < dt*5){
      addParticle(e.x+rand(-e.r,e.r),e.y+rand(-e.r,e.r),'#c8f4ff',1.4,.5,rand(-8,8),rand(-16,-3),8,false);
    }
  }
  for(let i=0;i<state.enemies.length;i++){
    const a = state.enemies[i];
    if(a.dead) continue;
    for(let j=i+1;j<state.enemies.length;j++){
      const b = state.enemies[j];
      if(b.dead) continue;
      const dx=b.x-a.x, dy=b.y-a.y;
      const d = Math.hypot(dx,dy)||1;
      const min = (a.r+b.r)*0.86;
      if(d < min){
        const push = (min-d)*0.5;
        a.x -= dx/d*push; a.y -= dy/d*push;
        b.x += dx/d*push; b.y += dy/d*push;
      }
    }
  }
}

function selectBuild(kind,id){
  if(state.phase !== 'wave' && state.phase !== 'build') return;
  if(state.selectedBuild && state.selectedBuild.kind===kind && state.selectedBuild.id===id){
    state.selectedBuild = null;
  } else {
    state.selectedBuild = {kind,id};
    state.selectedItem = null; state.selectedItemKind = null;
    els.tp.classList.add('hidden');
  }
  refreshAllCards();
  const spec = kind==='turret'?TURRET_BY[id]:TRAP_BY[id];
  els.dockHint.textContent = kind==='turret'
    ? (state.selectedBuild ? spec.name + ': тапните свободный пад на льдине' : 'Выберите турель, затем пустой пад на льдине')
    : (state.selectedBuild ? spec.name + ': тапните воду вокруг льдины' : 'Выберите ловушку, затем воду вокруг льдины');
  sfx('tap');
}

function tryBuildTurret(padIndex){
  const sel = state.selectedBuild;
  if(!sel || sel.kind !== 'turret') return;
  if(state.turrets.some(t=>t.pad===padIndex)){ showToast('Этот пад уже занят'); return; }
  const spec = TURRET_BY[sel.id];
  if(state.fish < spec.cost){ showToast('Не хватает рыбы: нужно ' + spec.cost); return; }
  state.fish -= spec.cost;
  const t = makeTurret(sel.id, padIndex, false);
  t.spent = spec.cost;
  state.turrets.push(t);
  const p = PADS[padIndex];
  burst(p.x,p.y,spec.color,14,90,3,.6);
  addRing(p.x,p.y,52,spec.color,2,.45);
  sfx('build');
  showToast(spec.name + ' установлена');
  state.selectedBuild = null;
  refreshAllCards(); refreshHud(true);
}

function placeTrap(wx,wy){
  const sel = state.selectedBuild;
  if(!sel || sel.kind !== 'trap') return;
  const spec = TRAP_BY[sel.id];
  const n = ellipseNorm(wx,wy);
  if(n < 1.04){ showToast('Ловушку можно ставить только в воде'); return; }
  if(n > 2.15){ showToast('Слишком далеко от льдины'); return; }
  if(state.traps.length >= 10){ showToast('Достигнут лимит ловушек: 10'); return; }
  if(state.traps.some(t=>Math.hypot(t.x-wx,t.y-wy) < 62)){ showToast('Слишком близко к другой ловушке'); return; }
  if(state.fish < spec.cost){ showToast('Не хватает рыбы: нужно ' + spec.cost); return; }
  state.fish -= spec.cost;
  const tr = makeTrap(sel.id, wx, wy);
  state.traps.push(tr);
  addRing(wx,wy,spec.radius,'#9feaff',2,.5);
  burst(wx,wy,spec.color,10,50,2.5,.5);
  sfx('build');
  showToast(spec.name + ' установлена');
  state.selectedBuild = null;
  refreshAllCards(); refreshHud(true);
}

function openItem(kind,item){
  state.selectedItem = item;
  state.selectedItemKind = kind;
  state.selectedBuild = null;
  refreshAllCards();
  const spec = kind==='turret'?TURRET_BY[item.id]:TRAP_BY[item.id];
  els.tpKicker.textContent = kind==='turret' ? 'ТУРЕЛЬ' : 'ЛОВУШКА';
  els.tpName.textContent = spec.name;
  refreshItemPanel();
  els.tp.classList.remove('hidden');
  els.dockHint.textContent = 'Улучшайте постройку или закройте панель';
  drawItemIcon(els.tpIcon, kind, item);
  sfx('tap');
}

function refreshItemPanel(){
  const item = state.selectedItem, kind = state.selectedItemKind;
  if(!item || !kind) return;
  const spec = kind==='turret'?TURRET_BY[item.id]:TRAP_BY[item.id];
  const st = kind==='turret'?turretStats(item):trapStats(item);
  setText(els.tpLevel, 'УРОВЕНЬ ' + item.level + ' / 5');
  const stats = kind==='turret' ? [
    ['УРОН', Math.round(st.damage)],
    ['ТЕМП', (1/st.fireRate).toFixed(1)+'/с'],
    ['РАДИУС', Math.round(st.range)]
  ] : [
    ['УРОН', Math.round(st.damage)],
    ['РАДИУС', Math.round(st.radius)],
    ['ЗАРЯД', st.cooldown.toFixed(1)+'с']
  ];
  els.tpStats.innerHTML = stats.map(([k,v])=>'<div class="tp-stat"><span>'+k+'</span><b>'+v+'</b></div>').join('');
  const maxed = item.level >= 5;
  const cost = kind==='turret' ? turretUpCost(item) : trapUpCost(item);
  els.tpUpgrade.disabled = maxed || state.fish < cost;
  els.tpUpgrade.innerHTML = maxed ? 'МАКСИМАЛЬНЫЙ УРОВЕНЬ' : 'УЛУЧШИТЬ · <b>' + cost + '</b>';
  els.tpSell.textContent = 'Продать · ' + Math.floor((item.spent||spec.cost)*0.6);
}

function upgradeItem(){
  const item = state.selectedItem, kind = state.selectedItemKind;
  if(!item || !kind || item.level >= 5) return;
  const cost = kind==='turret'?turretUpCost(item):trapUpCost(item);
  if(state.fish < cost){ showToast('Не хватает рыбы'); return; }
  state.fish -= cost;
  item.level++;
  item.spent += cost;
  const spec = kind==='turret'?TURRET_BY[item.id]:TRAP_BY[item.id];
  addRing(item.x,item.y,kind==='turret'?58:spec.radius*.8,spec.color,3,.5);
  burst(item.x,item.y,spec.color,14,80,3,.6);
  showToast(spec.name + ' · уровень ' + item.level);
  sfx('upgrade');
  refreshItemPanel(); refreshHud(true);
}

function sellItem(){
  const item = state.selectedItem, kind = state.selectedItemKind;
  if(!item || !kind) return;
  const refund = Math.floor((item.spent||0)*0.6);
  state.fish += refund;
  if(kind==='turret') state.turrets = state.turrets.filter(t=>t!==item);
  else state.traps = state.traps.filter(t=>t!==item);
  addText(item.x,item.y-15,'+'+refund,'#ffe09a',13);
  burst(item.x,item.y,'#9feaff',10,70,2.5,.5);
  els.tp.classList.add('hidden');
  state.selectedItem = null; state.selectedItemKind = null;
  showToast('Продано · +' + refund + ' рыбы');
  sfx('tap');
  refreshHud(true);
}

function openMeta(tab){
  if(state.phase === 'over' || state.phase === 'menu') return;
  state.modal = 'meta';
  metaTab = tab || metaTab;
  els.metaModal.classList.remove('hidden');
  els.pause.classList.add('hidden');
  state.paused = false;
  renderMeta();
  render(visualTime);
  stopLoop();
}
function closeMeta(){
  state.modal = null;
  els.metaModal.classList.add('hidden');
  startLoop();
}
function renderMeta(){
  els.metaTitle.textContent = metaTab === 'ice' ? 'Льдина' : 'Тюлень';
  document.querySelectorAll('.meta-tab').forEach(b=>b.classList.toggle('active', b.dataset.meta===metaTab));
  const list = metaTab === 'ice' ? ICE_UP : SEAL_UP;
  const levels = metaTab === 'ice' ? state.meta.ice : state.meta.seal;
  const icons = {
    hp:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l8 3v7c0 5-4 8-8 10-4-2-8-5-8-10V5z"/></svg>',
    regen:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 12a8 8 0 1 1-2.3-5.6"/><path d="M20 4v5h-5"/></svg>',
    armor:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l8 3v7c0 5-4 8-8 10-4-2-8-5-8-10V5z"/><path d="M9 12l2 2 4-5"/></svg>',
    speed:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h11M9 6l6 6-6 6M18 6v12"/></svg>',
    roar:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 10v4M8 7v10M12 4v16M16 8v8M20 10v4"/></svg>',
    radius:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>',
    greed:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12c2.4-3.4 5.8-4.6 9-2.8L18 6v12l-5-3.2C9.8 16.6 6.4 15.4 4 12Z"/></svg>'
  };
  els.metaList.innerHTML = list.map(u=>{
    const lvl = levels[u.id]||0;
    const maxed = lvl >= u.max;
    const cost = Math.round(u.base*Math.pow(1.32,lvl));
    const pips = Array.from({length:u.max},(_,i)=>'<i class="'+(i<lvl?'on':'')+'"></i>').join('');
    return '<div class="meta-item">'
      + '<div class="mi-icon">'+(icons[u.id]||'')+'</div>'
      + '<div class="mi-body"><div class="mi-name">'+u.name+' <span>УР. '+lvl+'/'+u.max+'</span></div>'
      + '<div class="mi-desc">'+u.desc+'</div><div class="meta-pips">'+pips+'</div></div>'
      + '<button class="meta-buy" data-up="'+u.id+'" '+(maxed||state.fish<cost?'disabled':'')+'>'
      + (maxed?'МАКС':'<span>'+cost+'</span><small>РЫБА</small>')+'</button></div>';
  }).join('');
  els.metaList.querySelectorAll('[data-up]').forEach(btn=>{
    btn.addEventListener('click', ()=>buyMeta(btn.dataset.up));
  });
}
function buyMeta(id){
  if(state.modal !== 'meta') return;
  const list = metaTab === 'ice' ? ICE_UP : SEAL_UP;
  const levels = metaTab === 'ice' ? state.meta.ice : state.meta.seal;
  const u = list.find(x=>x.id===id);
  if(!u) return;
  const lvl = levels[id]||0;
  if(lvl >= u.max) return;
  const cost = Math.round(u.base*Math.pow(1.32,lvl));
  if(state.fish < cost){ showToast('Не хватает рыбы'); return; }
  state.fish -= cost;
  levels[id] = lvl+1;
  if(id==='hp'){
    state.maxIntegrity = iceMax();
    state.integrity = Math.min(state.maxIntegrity, state.integrity + 30);
  }
  showToast(u.name + ' · уровень ' + (lvl+1));
  sfx('upgrade');
  renderMeta(); refreshHud(true);
}

function refreshAllCards(){
  document.querySelectorAll('.build-card').forEach(card=>{
    const kind = card.dataset.kind, id = card.dataset.id;
    const spec = kind==='turret'?TURRET_BY[id]:TRAP_BY[id];
    card.classList.toggle('selected', !!(state.selectedBuild && state.selectedBuild.kind===kind && state.selectedBuild.id===id));
    card.classList.toggle('poor', state.fish < spec.cost);
  });
}
function setBuildTab(tab){
  document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('active', b.dataset.tab===tab));
  els.turretCards.classList.toggle('hidden', tab!=='turret');
  els.trapCards.classList.toggle('hidden', tab!=='trap');
}
function buildCards(){
  const fishSvg = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M2.6 12c2.7-3.8 6.6-5.7 10.4-3.8L17.4 5v14l-4.4-3.2C9.2 17.7 5.3 15.8 2.6 12Z"/></svg>';
  els.turretCards.innerHTML = TURRETS.map(t=>
    '<button class="build-card" data-kind="turret" data-id="'+t.id+'" aria-label="'+t.name+'">'
    + '<canvas width="84" height="84"></canvas>'
    + '<span class="bc-name">'+t.name+'</span>'
    + '<span class="bc-cost">'+fishSvg+t.cost+'</span></button>'
  ).join('');
  els.trapCards.innerHTML = TRAPS.map(t=>
    '<button class="build-card" data-kind="trap" data-id="'+t.id+'" aria-label="'+t.name+'">'
    + '<canvas width="84" height="84"></canvas>'
    + '<span class="bc-name">'+t.name+'</span>'
    + '<span class="bc-cost">'+fishSvg+t.cost+'</span></button>'
  ).join('');
  document.querySelectorAll('.build-card').forEach(card=>{
    card.addEventListener('click', ()=>selectBuild(card.dataset.kind, card.dataset.id));
    const c = card.querySelector('canvas');
    const kind = card.dataset.kind, id = card.dataset.id;
    const iconItem = {id, level:1, angle:-0.55, recoil:0, x:0, y:0};
    drawItemIcon(c, kind, iconItem);
  });
  refreshAllCards();
}

function drawItemIcon(canvasEl, kind, item){
  const g = canvasEl.getContext('2d');
  const w = canvasEl.width, h = canvasEl.height;
  g.setTransform(1,0,0,1,0,0);
  g.clearRect(0,0,w,h);
  g.save();
  g.translate(w/2,h/2);
  const k = Math.min(w,h)/56;
  g.scale(k,k);
  if(kind==='turret') drawTurretSprite(g, item, -0.5, true);
  else drawTrapSprite(g, item, true);
  g.restore();
}

function refreshHud(force){
  const max = Math.max(1, state.maxIntegrity);
  const pct = clamp(Math.round(state.integrity/max*100),0,100);
  setText(els.waveNum, Math.max(1,state.wave));
  setText(els.bestNum, state.best);
  setText(els.icePct, pct+'%');
  setText(els.fishNum, Math.floor(state.fish));
  if(force || hudCache.pct !== pct){
    hudCache.pct = pct;
    els.iceFill.style.width = pct+'%';
    els.iceFill.classList.toggle('low', pct < 35);
  }
  if(state.phase === 'build'){
    els.rushBtn.classList.add('show');
    setText(els.rushTime, Math.max(0,Math.ceil(state.buildTimer))+'с');
  } else {
    els.rushBtn.classList.remove('show');
  }
  const cd = Math.max(0,state.roarCd);
  if(cd > 0){
    els.roar.disabled = true;
    els.roarCool.style.height = Math.min(100, cd/roarCooldown()*100)+'%';
    setText(els.roarCoolTxt, Math.ceil(cd));
  } else {
    els.roar.disabled = false;
    els.roarCool.style.height = '0%';
    setText(els.roarCoolTxt, '');
  }
  if(!els.tp.classList.contains('hidden')) refreshItemPanel();
  if(!els.metaModal.classList.contains('hidden')) refreshMetaAffordability();
  refreshAllCards();
}
function refreshMetaAffordability(){
  const list = metaTab === 'ice' ? ICE_UP : SEAL_UP;
  const levels = metaTab === 'ice' ? state.meta.ice : state.meta.seal;
  els.metaList.querySelectorAll('[data-up]').forEach(btn=>{
    const id = btn.dataset.up, u = list.find(x=>x.id===id);
    if(!u) return;
    const lvl = levels[id]||0;
    const maxed = lvl>=u.max;
    const cost = Math.round(u.base*Math.pow(1.32,lvl));
    btn.disabled = maxed || state.fish<cost;
  });
}

function handleTap(sx,sy){
  if(state.phase !== 'wave' && state.phase !== 'build') return;
  if(state.paused || state.modal) return;
  const w = toWorld(sx,sy);
  const pickR = 32/viewScale;
  for(const t of state.turrets){
    if(Math.hypot(t.x-w.x,t.y-w.y) < pickR){ openItem('turret',t); return; }
  }
  for(const tr of state.traps){
    const spec = TRAP_BY[tr.id];
    if(Math.hypot(tr.x-w.x,tr.y-w.y) < Math.max(pickR,spec.radius*0.75)){ openItem('trap',tr); return; }
  }
  for(let i=0;i<PADS.length;i++){
    const p = PADS[i];
    if(Math.hypot(p.x-w.x,p.y-w.y) < pickR){
      if(state.turrets.some(t=>t.pad===i)){ return; }
      if(state.selectedBuild && state.selectedBuild.kind==='turret'){ tryBuildTurret(i); }
      else if(state.selectedBuild && state.selectedBuild.kind==='trap'){ showToast('Для ловушки тапните по воде вокруг льдины'); }
      else { showToast('Выберите турель внизу и тапните этот пад'); }
      return;
    }
  }
  if(state.selectedBuild && state.selectedBuild.kind==='trap'){ placeTrap(w.x,w.y); return; }
  if(state.selectedItem){
    els.tp.classList.add('hidden');
    state.selectedItem = null;
    state.selectedItemKind = null;
  }
}

function togglePause(){
  if(state.phase === 'menu' || state.phase === 'over' || state.modal) return;
  state.paused = !state.paused;
  els.pause.classList.toggle('hidden', !state.paused);
  if(state.paused){
    setText(els.pauseWave, state.wave);
    setText(els.pauseFish, Math.floor(state.fish));
    setText(els.pauseIce, Math.round(state.integrity/state.maxIntegrity*100)+'%');
    els.tp.classList.add('hidden');
    render(visualTime);
    stopLoop();
  } else {
    startLoop();
  }
  sfx('tap');
}

function setupJoystick(){
  const stick = els.stick, knob = els.knob;
  let activeId = null;
  function setFromEvent(e){
    const r = stick.getBoundingClientRect();
    const cxx = r.left + r.width/2, cyy = r.top + r.height/2;
    let dx = e.clientX-cxx, dy = e.clientY-cyy;
    const max = r.width*0.36;
    const len = Math.hypot(dx,dy);
    if(len > max){ dx = dx/len*max; dy = dy/len*max; }
    knob.style.transform = 'translate('+dx+'px,'+dy+'px)';
    input.joy.x = dx/max;
    input.joy.y = dy/max;
  }
  function reset(){
    activeId = null;
    knob.style.transform = 'translate(0,0)';
    input.joy.x = 0; input.joy.y = 0;
  }
  stick.addEventListener('pointerdown', e=>{
    activeId = e.pointerId;
    stick.setPointerCapture(e.pointerId);
    setFromEvent(e);
    e.preventDefault();
  });
  stick.addEventListener('pointermove', e=>{
    if(e.pointerId === activeId) setFromEvent(e);
  });
  stick.addEventListener('pointerup', e=>{ if(e.pointerId===activeId) reset(); });
  stick.addEventListener('pointercancel', e=>{ if(e.pointerId===activeId) reset(); });
  stick.addEventListener('lostpointercapture', reset);
}

function setupInput(){
  setupJoystick();
  canvas.addEventListener('pointerdown', e=>{
    if(e.pointerType === 'mouse' && e.button !== 0) return;
    tapInfo = {x:e.clientX,y:e.clientY,moved:false,id:e.pointerId};
  });
  canvas.addEventListener('pointermove', e=>{
    if(e.pointerType === 'mouse') state.pointer = toWorld(e.clientX,e.clientY);
    if(tapInfo && Math.hypot(e.clientX-tapInfo.x,e.clientY-tapInfo.y) > 12) tapInfo.moved = true;
  });
  canvas.addEventListener('pointerup', e=>{
    if(tapInfo && !tapInfo.moved && e.pointerId===tapInfo.id) handleTap(e.clientX,e.clientY);
    tapInfo = null;
  });
  canvas.addEventListener('pointercancel', ()=>{ tapInfo = null; });
  canvas.addEventListener('pointerleave', ()=>{ if(state.pointer) state.pointer = null; });

  window.addEventListener('keydown', e=>{
    const k = e.key.toLowerCase();
    if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright',' '].includes(k)) e.preventDefault();
    input.keys.add(k);
    if(k === ' ') useRoar();
    if(k === 'p' || k === 'escape') togglePause();
  });
  window.addEventListener('keyup', e=>{ input.keys.delete(e.key.toLowerCase()); });
  window.addEventListener('blur', ()=>{ input.keys.clear(); input.joy.x=0; input.joy.y=0; });

  els.roar.addEventListener('click', useRoar);
  els.pauseBtn.addEventListener('click', togglePause);
  els.resumeBtn.addEventListener('click', togglePause);
  els.restartBtn.addEventListener('click', ()=>{ if(state.paused){ state.paused=false; els.pause.classList.add('hidden'); } startGame(); });
  els.againBtn.addEventListener('click', startGame);
  els.playBtn.addEventListener('click', startGame);
  els.soundBtn.addEventListener('click', toggleSound);
  els.soundStart.addEventListener('click', toggleSound);
  els.soundPause.addEventListener('click', toggleSound);
  els.tiltStart.addEventListener('click', toggleTilt);
  els.tiltPause.addEventListener('click', toggleTilt);
  els.rushBtn.addEventListener('click', ()=>{ if(state.phase==='build') startWave(); });
  els.tpClose.addEventListener('click', ()=>{ els.tp.classList.add('hidden'); state.selectedItem=null; state.selectedItemKind=null; });
  els.tpUpgrade.addEventListener('click', upgradeItem);
  els.tpSell.addEventListener('click', sellItem);
  els.metaClose.addEventListener('click', closeMeta);
  els.metaIceBtn.addEventListener('click', ()=>openMeta('ice'));
  els.metaSealBtn.addEventListener('click', ()=>openMeta('seal'));
  els.pauseMetaBtn.addEventListener('click', ()=>{ els.pause.classList.add('hidden'); state.paused=false; openMeta('ice'); });
  els.metaModal.addEventListener('click', e=>{ if(e.target===els.metaModal) closeMeta(); });
  document.querySelectorAll('.tab').forEach(b=>b.addEventListener('click', ()=>setBuildTab(b.dataset.tab)));
  document.querySelectorAll('.meta-tab').forEach(b=>b.addEventListener('click', ()=>{ metaTab=b.dataset.meta; renderMeta(); }));

  document.addEventListener('visibilitychange', ()=>{
    if(document.hidden && (state.phase==='wave'||state.phase==='build') && !state.paused){
      state.paused = true;
      els.pause.classList.remove('hidden');
    }
  });
}

function initGame(){
  resize();
  setupDockVar();
  buildCards();
  drawLogoSeal();
  refreshSoundButtons();
  refreshTiltButtons();
  setText(els.bestNum, state.best);
  setText(els.bestStart, state.best);
  refreshHud(true);
  setupInput();
}
