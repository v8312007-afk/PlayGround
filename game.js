(() => {
  'use strict';

  const TAU = Math.PI * 2;
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const rand = (min, max) => min + Math.random() * (max - min);
  const dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
  const smooth = t => t * t * (3 - 2 * t);
  const angleLerp = (a, b, t) => {
    const d = ((b - a + Math.PI) % TAU + TAU) % TAU - Math.PI;
    return a + d * t;
  };
  const formatNumber = n => Math.floor(n).toLocaleString('ru-RU');
  const storageGet = (key, fallback) => {
    try {
      const value = localStorage.getItem(key);
      return value === null ? fallback : value;
    } catch {
      return fallback;
    }
  };
  const storageSet = (key, value) => {
    try {
      localStorage.setItem(key, String(value));
    } catch {}
  };
  const $ = id => document.getElementById(id);

  const canvas = $('game');
  const ctx = canvas.getContext('2d');
  const body = document.body;
  const refs = {
    waveLabel: $('waveLabel'),
    waveSub: $('waveSub'),
    fishCount: $('fishCount'),
    hpText: $('hpText'),
    hpFill: $('hpFill'),
    hpBar: document.querySelector('.integrity-bar'),
    sealFill: $('sealFill'),
    bossWrap: $('bossWrap'),
    bossHpText: $('bossHpText'),
    bossFill: $('bossFill'),
    readyWrap: $('readyWrap'),
    readyBtn: $('readyBtn'),
    toasts: $('toasts'),
    placementBar: $('placementBar'),
    placementName: $('placementName'),
    placementHint: $('placementHint'),
    cancelPlacement: $('cancelPlacement'),
    joystick: $('joystick'),
    joyKnob: $('joyKnob'),
    buildBtn: $('buildBtn'),
    dashBtn: $('dashBtn'),
    snowballBtn: $('snowballBtn'),
    dashCd: $('dashCd'),
    snowballCd: $('snowballCd'),
    pauseBtn: $('pauseBtn'),
    drawer: $('drawer'),
    drawerBackdrop: $('drawerBackdrop'),
    drawerFish: $('drawerFish'),
    drawerTip: $('drawerTip'),
    tabs: $('tabs'),
    cardList: $('cardList'),
    closeDrawer: $('closeDrawer'),
    inspectPanel: $('inspectPanel'),
    inspectIcon: $('inspectIcon'),
    inspectName: $('inspectName'),
    inspectLevel: $('inspectLevel'),
    inspectStats: $('inspectStats'),
    inspectClose: $('inspectClose'),
    upgradeBtn: $('upgradeBtn'),
    upgradeCost: $('upgradeCost'),
    sellBtn: $('sellBtn'),
    sellValue: $('sellValue'),
    menu: $('menu'),
    startBtn: $('startBtn'),
    bestWave: $('bestWave'),
    pauseMenu: $('pauseMenu'),
    resumeBtn: $('resumeBtn'),
    soundBtn: $('soundBtn'),
    tiltBtn: $('tiltBtn'),
    helpBtn: $('helpBtn'),
    helpPanel: $('helpPanel'),
    helpClose: $('helpClose'),
    restartBtn: $('restartBtn'),
    quitBtn: $('quitBtn'),
    gameOver: $('gameOver'),
    overWave: $('overWave'),
    overKills: $('overKills'),
    overBest: $('overBest'),
    againBtn: $('againBtn'),
    toMenuBtn: $('toMenuBtn')
  };

  const TURRETS = [
    { id: 'harpoon', name: 'Гарпун', cost: 55, range: 222, rate: 1.65, damage: 15, color: '#8cecff', projectile: 'bolt', desc: 'Быстрый одиночный выстрел. Дешёвый и надёжный.' },
    { id: 'cannon', name: 'Пушка', cost: 105, range: 232, rate: 0.64, damage: 30, aoe: 60, color: '#ffc46b', projectile: 'shell', desc: 'Ядро с осколочным взрывом по площади.' },
    { id: 'frost', name: 'Ледяной луч', cost: 125, range: 206, rate: 0.95, damage: 9, slow: 0.52, slowTime: 2.4, color: '#8bdfff', projectile: 'beam', desc: 'Замедляет косаток и охлаждает охотников.' },
    { id: 'tesla', name: 'Тесла', cost: 165, range: 202, rate: 0.76, damage: 20, chain: 4, color: '#c7a4ff', projectile: 'chain', desc: 'Молния перескакивает между четырьмя врагами.' },
    { id: 'mortar', name: 'Миномёт', cost: 190, range: 326, rate: 0.42, damage: 45, aoe: 88, color: '#ff9f6e', projectile: 'mortar', desc: 'Дальний навесной залп с большим радиусом.' },
    { id: 'sniper', name: 'Снайпер', cost: 210, range: 445, rate: 0.34, damage: 72, color: '#ffe8a3', projectile: 'sniper', desc: 'Огромная дальность и точный пробивной выстрел.' },
    { id: 'bubble', name: 'Пенный бластер', cost: 175, range: 190, rate: 0.86, damage: 8, aoe: 72, knock: 112, color: '#8fffdd', projectile: 'bubble', desc: 'Разбрасывает косаток от края льдины.' },
    { id: 'flame', name: 'Огнемёт', cost: 200, range: 152, rate: 4.2, damage: 6, burn: 5, color: '#ff8a5b', projectile: 'flame', desc: 'Короткая струя огня поджигает всё в секторе.' },
    { id: 'chakram', name: 'Ледяной бумеранг', cost: 145, range: 248, rate: 1.02, damage: 15, bounces: 4, color: '#a5ffb6', projectile: 'chakram', desc: 'Диск рикошетит по цепочке из четырёх косаток.' },
    { id: 'repair', name: 'Ремонтный тотем', cost: 220, range: 160, rate: 0.85, damage: 0, heal: 2.6, color: '#7dffd1', projectile: 'repair', desc: 'Постоянно латает лёд и усиливает оборону рядом.' },
    { id: 'beacon', name: 'Маяк «Аврора»', cost: 240, range: 224, rate: 0.45, damage: 0, color: '#ffd2fb', projectile: 'beacon', desc: 'Пульс замедляет врагов, а турели рядом стреляют чаще.' }
  ];

  const TRAPS = [
    { id: 'mine', name: 'Ледяная мина', cost: 65, trigger: 62, radius: 118, damage: 118, cooldown: 7, color: '#7fe7ff', desc: 'Взрыв под водой. Отбрасывает и калечит стаю.' },
    { id: 'net', name: 'Сеть', cost: 70, trigger: 102, radius: 132, slow: 0.58, slowTime: 3.8, cooldown: 8, color: '#a9f6ff', desc: 'Запутывает косаток и надолго снижает скорость.' },
    { id: 'decoy', name: 'Приманка', cost: 95, trigger: 260, radius: 275, taunt: 4.5, cooldown: 13, color: '#ffb4a5', desc: 'Рыбный манок уводит косаток от льдины.' },
    { id: 'kelp', name: 'Электро-водоросли', cost: 135, trigger: 158, radius: 164, damage: 34, chain: 4, cooldown: 5, color: '#83ffc1', desc: 'Разряд молний прыгает по мокрым спинам.' },
    { id: 'oil', name: 'Нефтяное пятно', cost: 115, trigger: 112, radius: 138, slow: 0.34, burn: 9, burnTime: 6, cooldown: 10, color: '#d8a9ff', desc: 'Липкая плёнка замедляет и выжигает стаю.' },
    { id: 'harpoonTrap', name: 'Гарпунная ловушка', cost: 105, trigger: 82, radius: 142, damage: 68, cooldown: 7, color: '#ffd48f', desc: 'Подцепляет ближайшую косатку и тянет к себе.' },
    { id: 'bubbleTrap', name: 'Пузырьковая ловушка', cost: 125, trigger: 124, radius: 150, damage: 5, knock: 190, cooldown: 9, color: '#9df7ff', desc: 'Волна пузырей отшвыривает целую группу назад.' }
  ];

  const FLOE_UPGRADES = [
    { id: 'reinforce', name: 'Укрепить лёд', cost: 85, max: 6, color: '#8cecff', desc: '+28 к пределу прочности и мгновенный ремонт.' },
    { id: 'regen', name: 'Морозный сердечник', cost: 105, max: 5, color: '#7dffd1', desc: 'Лёд медленно восстанавливается сам.' },
    { id: 'spikes', name: 'Ледяные шипы', cost: 115, max: 5, color: '#c2f6ff', desc: 'Кусающие лёд косатки получают отпор.' },
    { id: 'watchtower', name: 'Дозорная вышка', cost: 145, max: 4, color: '#ffe8a3', desc: '+7% дальности всем турелям.' },
    { id: 'drones', name: 'Ремонтные дроны', cost: 125, max: 4, color: '#8fffdd', desc: 'Латают +12 прочности после каждой волны.' },
    { id: 'resonance', name: 'Ледяной резонанс', cost: 155, max: 4, color: '#c7a4ff', desc: '+7% скорости стрельбы всем турелям.' },
    { id: 'armor', name: 'Панцирь льда', cost: 175, max: 4, color: '#a9c8ff', desc: 'Снижает урон от укусов на 6% за уровень.' }
  ];

  const SEAL_UPGRADES = [
    { id: 'blubber', name: 'Толстый жир', cost: 90, max: 5, color: '#7dffd1', desc: '+22 к здоровью тюленя и немного лечения.' },
    { id: 'speed', name: 'Быстрые ласты', cost: 95, max: 5, color: '#8cecff', desc: '+7% скорости передвижения.' },
    { id: 'slap', name: 'Мощный удар', cost: 105, max: 5, color: '#ffb4a5', desc: '+8 урона от рывка по охотникам.' },
    { id: 'magnet', name: 'Рыбный магнит', cost: 80, max: 4, color: '#ffd166', desc: '+28 к радиусу сбора рыбы.' },
    { id: 'dashCd', name: 'Холодная кровь', cost: 115, max: 4, color: '#c7a4ff', desc: 'Рывок восстанавливается на 9% быстрее.' },
    { id: 'snowball', name: 'Снежное ядро', cost: 100, max: 5, color: '#e6fdff', desc: '+8 урона снежком и сильнее замедление.' }
  ];

  const audio = (() => {
    let audioCtx = null;
    let master = null;
    let muted = storageGet('floe-muted', '0') === '1';
    let noiseBuffer = null;
    let ambience = null;

    const ensure = () => {
      if (!audioCtx) {
        const AudioCtor = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtor) return null;
        audioCtx = new AudioCtor();
        master = audioCtx.createGain();
        master.gain.value = muted ? 0 : 0.16;
        master.connect(audioCtx.destination);
        noiseBuffer = audioCtx.createBuffer(1, audioCtx.sampleRate, audioCtx.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      }
      if (audioCtx.state === 'suspended') audioCtx.resume();
      return audioCtx;
    };

    const tone = (freq, duration, type = 'sine', volume = 0.25, slide = 0, delay = 0) => {
      const ac = ensure();
      if (!ac) return;
      const start = ac.currentTime + delay;
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, start);
      if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), start + duration);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(volume, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      osc.connect(gain).connect(master);
      osc.start(start);
      osc.stop(start + duration + 0.03);
    };

    const noise = (duration, volume = 0.3, filterFreq = 900, delay = 0) => {
      const ac = ensure();
      if (!ac) return;
      const start = ac.currentTime + delay;
      const source = ac.createBufferSource();
      source.buffer = noiseBuffer;
      const filter = ac.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(filterFreq, start);
      filter.frequency.exponentialRampToValueAtTime(Math.max(80, filterFreq * 0.25), start + duration);
      const gain = ac.createGain();
      gain.gain.setValueAtTime(volume, start);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      source.connect(filter).connect(gain).connect(master);
      source.start(start);
      source.stop(start + duration + 0.02);
    };

    const startAmbience = () => {
      const ac = ensure();
      if (!ac || ambience) return;
      const source = ac.createBufferSource();
      source.buffer = noiseBuffer;
      source.loop = true;
      const filter = ac.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 360;
      const gain = ac.createGain();
      gain.gain.value = 0.035;
      source.connect(filter).connect(gain).connect(master);
      source.start();
      ambience = { source, gain };
    };

    const stopAmbience = () => {
      if (!ambience) return;
      try {
        ambience.gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.4);
        ambience.source.stop(audioCtx.currentTime + 0.5);
      } catch {}
      ambience = null;
    };

    const sfx = name => {
      if (muted) return;
      ensure();
      switch (name) {
        case 'shoot': tone(700, 0.05, 'triangle', 0.07, -260); break;
        case 'cannon': noise(0.18, 0.22, 640); tone(120, 0.16, 'sine', 0.14, -50); break;
        case 'beam': tone(1250, 0.08, 'sine', 0.045, 500); break;
        case 'zap': tone(240, 0.09, 'sawtooth', 0.07, 580); break;
        case 'sniper': noise(0.09, 0.2, 1800); tone(1600, 0.05, 'square', 0.06, -900); break;
        case 'hit': tone(340, 0.035, 'square', 0.035, -100); break;
        case 'kill': tone(280, 0.1, 'triangle', 0.08, 180); tone(420, 0.12, 'sine', 0.06, 220, 0.04); break;
        case 'build': tone(420, 0.09, 'triangle', 0.12, 180); tone(650, 0.12, 'sine', 0.1, 260, 0.08); break;
        case 'upgrade': tone(520, 0.1, 'triangle', 0.1, 220); tone(780, 0.14, 'sine', 0.09, 260, 0.08); tone(1040, 0.18, 'sine', 0.06, 200, 0.16); break;
        case 'collect': tone(880, 0.06, 'sine', 0.07, 220); break;
        case 'dash': noise(0.16, 0.14, 1300); tone(300, 0.12, 'sine', 0.06, 500); break;
        case 'snow': tone(900, 0.08, 'triangle', 0.06, 350); break;
        case 'hurt': noise(0.16, 0.22, 360); tone(120, 0.18, 'sawtooth', 0.08, -50); break;
        case 'wave': tone(196, 0.45, 'sine', 0.1, 20); tone(294, 0.5, 'triangle', 0.06, 10, 0.12); tone(392, 0.6, 'sine', 0.05, 15, 0.24); break;
        case 'clear': tone(392, 0.18, 'triangle', 0.09, 20); tone(523, 0.2, 'triangle', 0.08, 20, 0.1); tone(659, 0.28, 'sine', 0.07, 20, 0.2); break;
        case 'over': tone(180, 0.7, 'sawtooth', 0.1, -100); noise(0.7, 0.3, 500); break;
        case 'deny': tone(150, 0.12, 'square', 0.05, -40); break;
        case 'ready': tone(330, 0.12, 'triangle', 0.06, 120); break;
      }
    };

    const setMuted = value => {
      muted = value;
      storageSet('floe-muted', value ? '1' : '0');
      if (master && audioCtx) master.gain.setTargetAtTime(value ? 0 : 0.16, audioCtx.currentTime, 0.03);
      refs.soundBtn.textContent = value ? 'ЗВУК: ВЫКЛ' : 'ЗВУК: ВКЛ';
    };

    return {
      ensure,
      sfx,
      setMuted,
      startAmbience,
      stopAmbience,
      get muted() { return muted; }
    };
  })();

  const islandSegments = 96;
  const islandRadii = [];
  for (let i = 0; i < islandSegments; i++) {
    const a = (i / islandSegments) * TAU;
    islandRadii.push(268 + Math.sin(a * 3 + 0.7) * 17 + Math.sin(a * 5 + 2.1) * 11 + Math.sin(a * 9 + 1.4) * 7 + Math.sin(a * 13 + 3) * 5);
  }

  const islandRadiusAt = angle => {
    const normalized = ((angle % TAU) + TAU) % TAU;
    const index = (normalized / TAU) * islandSegments;
    const i0 = Math.floor(index) % islandSegments;
    const i1 = (i0 + 1) % islandSegments;
    return lerp(islandRadii[i0], islandRadii[i1], smooth(index - Math.floor(index)));
  };

  const makeIslandPath = pad => {
    const path = new Path2D();
    for (let i = 0; i < islandSegments; i++) {
      const a = (i / islandSegments) * TAU;
      const r = islandRadii[i] - pad;
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      if (i === 0) path.moveTo(x, y);
      else path.lineTo(x, y);
    }
    path.closePath();
    return path;
  };

  const islandPaths = {
    main: makeIslandPath(0),
    inner: makeIslandPath(22),
    rim: makeIslandPath(-7),
    foam: makeIslandPath(-20),
    trapInner: makeIslandPath(18),
    trapOuter: makeIslandPath(-176)
  };

  const isOnIsland = (x, y, pad = 0) => Math.hypot(x, y) <= islandRadiusAt(Math.atan2(y, x)) - pad;

  const clampToIsland = (x, y, pad) => {
    const angle = Math.atan2(y, x);
    const maxR = Math.max(12, islandRadiusAt(angle) - pad);
    const r = Math.hypot(x, y);
    if (r <= maxR) return { x, y };
    const scale = maxR / Math.max(0.001, r);
    return { x: x * scale, y: y * scale };
  };

  const seeded = (() => {
    let seed = 918273;
    return () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };
  })();

  const cracks = [];
  for (let c = 0; c < 15; c++) {
    const points = [];
    let angle = seeded() * TAU;
    let radius = islandRadiusAt(angle) * (0.9 + seeded() * 0.07);
    points.push({ x: Math.cos(angle) * radius, y: Math.sin(angle) * radius });
    const steps = 3 + Math.floor(seeded() * 5);
    for (let i = 0; i < steps; i++) {
      angle += (seeded() - 0.5) * 0.8;
      radius -= 24 + seeded() * 42;
      points.push({ x: Math.cos(angle) * Math.max(20, radius), y: Math.sin(angle) * Math.max(20, radius) });
    }
    cracks.push(points);
  }

  const snowPatches = [];
  for (let i = 0; i < 34; i++) {
    const a = seeded() * TAU;
    const r = Math.sqrt(seeded()) * (islandRadiusAt(a) - 38);
    snowPatches.push({ x: Math.cos(a) * r, y: Math.sin(a) * r, rx: 9 + seeded() * 26, ry: 5 + seeded() * 13, rot: seeded() * TAU, alpha: 0.08 + seeded() * 0.22 });
  }

  const floatChunks = [];
  for (let i = 0; i < 18; i++) {
    const a = seeded() * TAU;
    const r = 390 + seeded() * 260;
    floatChunks.push({ x: Math.cos(a) * r, y: Math.sin(a) * r, size: 8 + seeded() * 24, rot: seeded() * TAU, drift: seeded() * TAU, speed: 0.15 + seeded() * 0.3, alpha: 0.1 + seeded() * 0.18 });
  }

  const stars = [];
  for (let i = 0; i < 80; i++) {
    stars.push({ x: seeded(), y: seeded(), size: 0.5 + seeded() * 1.6, speed: 0.2 + seeded() * 0.6, alpha: 0.15 + seeded() * 0.45 });
  }

  const cam = { x: 0, y: 0, scale: 0.8 };
  let W = 0;
  let H = 0;
  let DPR = 1;
  let backgroundGradient = null;

  const input = { joyX: 0, joyY: 0, keys: new Set(), joyPointer: null, tiltX: 0, tiltY: 0 };
  const tilt = { enabled: false, baseGamma: 0, baseBeta: 0, handler: null };
  const ui = { drawerOpen: false, tab: 'turrets', paused: false, inspecting: null, lastHud: 0, shopKey: '' };

  const makeState = () => ({
    mode: 'menu',
    time: 0,
    fish: 120,
    wave: 0,
    waveActive: false,
    prepTimer: 0,
    spawnQueue: [],
    spawnTimer: 0,
    spawnInterval: 1,
    enemies: [],
    turrets: [],
    traps: [],
    projectiles: [],
    pickups: [],
    particles: [],
    effects: [],
    texts: [],
    kills: 0,
    totalFish: 0,
    nextId: 1,
    shake: 0,
    flash: 0,
    hitFlash: 0,
    floe: { hp: 200, maxHp: 200, regen: 0, spike: 0, rangeMult: 1, rateMult: 1, waveHeal: 0, armor: 1 },
    seal: {
      x: 0, y: 8, hp: 100, maxHp: 100, speed: 176, facing: -Math.PI / 2,
      dashDamage: 18, dashCooldown: 4.2, dashTimer: 0, dashDirX: 0, dashDirY: -1, dashCd: 0,
      snowCooldown: 2.8, snowCd: 0, snowDamage: 22, magnet: 58,
      invuln: 0, hurtTimer: 0, knocked: false, knockTimer: 0, lastHit: -10
    },
    upgrades: {
      floe: { reinforce: 0, regen: 0, spikes: 0, watchtower: 0, drones: 0, resonance: 0, armor: 0 },
      seal: { blubber: 0, speed: 0, slap: 0, magnet: 0, dashCd: 0, snowball: 0 }
    },
    placement: null,
    bossId: 0
  });

  let state = makeState();
  let bestWave = Number(storageGet('floe-best-wave', 0)) || 0;
  refs.bestWave.textContent = bestWave;

  const recomputeDerived = (fullHeal = false) => {
    const f = state.floe;
    const s = state.seal;
    const fu = state.upgrades.floe;
    const su = state.upgrades.seal;
    const oldMax = f.maxHp;
    f.maxHp = 200 + fu.reinforce * 28;
    if (fullHeal) f.hp = f.maxHp;
    f.hp = clamp(f.hp, 0, f.maxHp);
    if (!fullHeal && f.maxHp > oldMax) f.hp = Math.min(f.maxHp, f.hp + (f.maxHp - oldMax));
    f.regen = fu.regen * 0.7;
    f.spike = fu.spikes * 7;
    f.rangeMult = 1 + fu.watchtower * 0.07;
    f.rateMult = 1 + fu.resonance * 0.07;
    f.waveHeal = fu.drones * 12;
    f.armor = 1 - fu.armor * 0.06;
    const oldSealMax = s.maxHp;
    s.maxHp = 100 + su.blubber * 22;
    if (fullHeal) s.hp = s.maxHp;
    s.hp = clamp(s.hp, 0, s.maxHp);
    if (!fullHeal && s.maxHp > oldSealMax) s.hp = Math.min(s.maxHp, s.hp + (s.maxHp - oldSealMax));
    s.speed = 176 * (1 + su.speed * 0.07);
    s.dashDamage = 18 + su.slap * 8;
    s.dashCooldown = Math.max(2.1, 4.2 * (1 - su.dashCd * 0.09));
    s.magnet = 58 + su.magnet * 28;
    s.snowDamage = 22 + su.snowball * 8;
    s.snowCooldown = Math.max(1.5, 2.8 - su.snowball * 0.05);
  };

  recomputeDerived(true);

  const waveNumber = () => state.waveActive ? state.wave : state.wave + 1;

  const showToast = (message, kind = '', duration = 2700) => {
    const el = document.createElement('div');
    el.className = `toast ${kind}`;
    el.textContent = message;
    refs.toasts.appendChild(el);
    while (refs.toasts.children.length > 3) refs.toasts.firstElementChild.remove();
    setTimeout(() => {
      el.classList.add('out');
      setTimeout(() => el.remove(), 320);
    }, duration);
  };

  const spawnBurst = (x, y, color, count, speed, size, life, kind = 'dot') => {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * TAU;
      const v = rand(speed * 0.3, speed);
      state.particles.push({
        x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v,
        color, size: rand(size * 0.5, size), life: rand(life * 0.55, life), maxLife: life,
        gravity: kind === 'chip' ? 30 : 0, drag: 2.8, kind
      });
    }
    if (state.particles.length > 620) state.particles.splice(0, state.particles.length - 620);
  };

  const spawnText = (x, y, text, color, size = 10) => {
    state.texts.push({ x, y, text, color, size, life: 0.9, maxLife: 0.9, vy: -22 });
    if (state.texts.length > 40) state.texts.shift();
  };

  const spawnRing = (x, y, radius, color, life = 0.5, width = 3) => {
    state.effects.push({ kind: 'ring', x, y, radius: 8, maxRadius: radius, color, life, maxLife: life, width });
    if (state.effects.length > 80) state.effects.shift();
  };

  const spawnFish = (x, y, value) => {
    const angle = Math.atan2(y, x);
    const landR = Math.max(30, islandRadiusAt(angle) - rand(34, 110));
    state.pickups.push({ x, y, tx: Math.cos(angle) * landR, ty: Math.sin(angle) * landR, value, age: 0, settled: false, phase: Math.random() * TAU });
  };

  const UI_READY_REFRESH = () => {
    const show = state.mode === 'playing' && !state.waveActive && !ui.drawerOpen && !ui.inspecting && !state.placement;
    refs.readyWrap.classList.toggle('hidden', !show);
  };

  const refreshShopIfOpen = () => {
    if (ui.drawerOpen) renderShop();
  };

  const resetGame = () => {
    state = makeState();
    recomputeDerived(true);
    state.mode = 'playing';
    state.prepTimer = 8;
    state.fish = 120;
    ui.paused = false;
    ui.inspecting = null;
    ui.drawerOpen = false;
    body.classList.remove('drawer-open');
    refs.drawerBackdrop.classList.add('hidden');
    refs.inspectPanel.classList.add('hidden');
    refs.pauseMenu.classList.add('hidden');
    refs.gameOver.classList.add('hidden');
    refs.helpPanel.classList.add('hidden');
    refs.menu.classList.add('hidden');
    refs.placementBar.classList.add('hidden');
    refs.readyWrap.classList.remove('hidden');
    body.classList.add('in-game');
    body.classList.remove('menu');
    refs.bestWave.textContent = bestWave;
    updateHud(true);
    renderShop();
    showToast('Строй турели и собирай рыбу. Волна начнётся через 8 секунд.', 'good', 3600);
    setTimeout(() => {
      if (state.mode === 'playing') showToast('Совет: «Готов» ускоряет волну и даёт +5 рыбы.', '', 3200);
    }, 1900);
    audio.ensure();
    audio.startAmbience();
    audio.sfx('ready');
  };

  const goToMenu = () => {
    state = makeState();
    recomputeDerived(true);
    state.mode = 'menu';
    ui.paused = false;
    ui.drawerOpen = false;
    ui.inspecting = null;
    closeDrawer();
    refs.inspectPanel.classList.add('hidden');
    refs.pauseMenu.classList.add('hidden');
    refs.gameOver.classList.add('hidden');
    refs.helpPanel.classList.add('hidden');
    refs.menu.classList.remove('hidden');
    refs.placementBar.classList.add('hidden');
    refs.readyWrap.classList.add('hidden');
    body.classList.remove('in-game', 'drawer-open');
    body.classList.add('menu');
    refs.bestWave.textContent = bestWave;
    audio.stopAmbience();
  };

  const togglePause = () => {
    if (state.mode !== 'playing') return;
    if (ui.drawerOpen) {
      closeDrawer();
      return;
    }
    if (ui.inspecting) {
      closeInspect();
      return;
    }
    ui.paused = !ui.paused;
    refs.pauseMenu.classList.toggle('hidden', !ui.paused);
    if (!ui.paused) audio.ensure();
  };

  const saveBest = () => {
    if (state.wave > bestWave) {
      bestWave = state.wave;
      storageSet('floe-best-wave', bestWave);
      refs.bestWave.textContent = bestWave;
    }
  };

  const triggerGameOver = () => {
    if (state.mode !== 'playing') return;
    state.mode = 'gameover';
    state.floe.hp = 0;
    state.shake = 18;
    spawnBurst(state.seal.x, state.seal.y, '#bff8ff', 40, 200, 8, 1.2, 'chip');
    spawnRing(0, 0, 260, '#ff7369', 1.2, 6);
    audio.sfx('over');
    saveBest();
    refs.overWave.textContent = state.wave || 1;
    refs.overKills.textContent = state.kills;
    refs.overBest.textContent = bestWave;
    setTimeout(() => {
      if (state.mode === 'gameover') refs.gameOver.classList.remove('hidden');
    }, 650);
  };

  const startWave = (bonus = false) => {
    if (state.mode !== 'playing' || state.waveActive) return;
    if (bonus) {
      state.fish += 5;
      state.totalFish += 5;
    }
    state.wave += 1;
    state.waveActive = true;
    const n = state.wave;
    const count = 4 + Math.floor(n * 1.65);
    const hunters = n >= 3 ? Math.floor((n - 2) / 2) : 0;
    const queue = [];
    for (let i = 0; i < count; i++) queue.push(i < hunters ? 'hunter' : 'orca');
    if (n % 5 === 0) queue.push('boss');
    state.spawnQueue = queue;
    state.spawnTimer = 0.45;
    state.spawnInterval = Math.max(0.36, 1.15 - n * 0.055);
    audio.sfx('wave');
    if (n % 5 === 0) showToast(`Волна ${n}. Гигантская косатка уже здесь!`, 'warn', 3400);
    else if (hunters > 0) showToast(`Волна ${n}. Осторожно: охотники прыгают на лёд!`, 'warn', 3000);
    else showToast(`Волна ${n}. Косатки идут со всех сторон.`, '', 2500);
  };

  const waveCleared = () => {
    state.waveActive = false;
    state.prepTimer = 8;
    const bonus = 45 + state.wave * 10 + state.floe.waveHeal;
    state.fish += bonus;
    state.totalFish += bonus;
    if (state.floe.waveHeal > 0) state.floe.hp = Math.min(state.floe.maxHp, state.floe.hp + state.floe.waveHeal);
    for (const pickup of state.pickups) {
      pickup.settled = true;
      pickup.flying = true;
    }
    audio.sfx('clear');
    showToast(`Волна ${state.wave} отбита. +${bonus} рыбы`, 'good', 3200);
    saveBest();
    refs.readyWrap.classList.remove('hidden');
    refreshShopIfOpen();
  };

  const spawnEnemy = type => {
    const n = state.wave;
    const angle = rand(0, TAU);
    const radius = rand(625, 720);
    const boss = type === 'boss';
    const hunter = type === 'hunter';
    const baseHp = boss ? 620 + n * 135 : hunter ? 38 + n * 10 : 48 + n * 13 + Math.pow(n, 1.42) * 1.5;
    const e = {
      id: state.nextId++, type,
      x: Math.cos(angle) * radius, y: Math.sin(angle) * radius,
      angle: angle + Math.PI, attackAngle: angle,
      radius: boss ? 72 : 42, size: boss ? 2.05 : hunter ? 1.04 : 1,
      hp: baseHp, maxHp: baseHp,
      speed: boss ? 31 : hunter ? 70 + Math.min(n * 1.4, 24) : 48 + Math.min(n * 1.1, 24),
      state: 'swim', attackTimer: rand(0.5, 1.3), attackInterval: boss ? 1.25 : rand(1.35, 1.8),
      damage: boss ? 17 : 3.4 + n * 0.52, biteDamage: 9 + n * 0.75,
      flash: 0, slow: 0, slowTimer: 0, burn: 0, burnTimer: 0, stun: 0,
      taunt: null, leap: 0, leapStart: null, leapEnd: null, z: 0,
      dying: 0, dead: false, boss, hunter, phase: Math.random() * TAU
    };
    state.enemies.push(e);
    if (boss) {
      state.bossId = e.id;
      showToast('Ледяная косатка! Она грызёт лёд особенно больно.', 'warn', 3300);
    }
    return e;
  };

  const findNearestEnemy = (x, y, range, opts = {}) => {
    let best = null;
    let bestD = range;
    for (const e of state.enemies) {
      if (e.dead) continue;
      if (opts.onIslandOnly && e.state !== 'island' && e.state !== 'leap') continue;
      if (opts.waterOnly && (e.state === 'island' || e.state === 'leap')) continue;
      const d = dist(x, y, e.x, e.y);
      if (d < bestD) {
        bestD = d;
        best = e;
      }
    }
    return best;
  };

  const damageEnemy = (enemy, amount, opts = {}) => {
    if (!enemy || enemy.dead) return;
    enemy.hp -= amount;
    enemy.flash = Math.max(enemy.flash, 0.12);
    if (enemy.hp <= 0) {
      killEnemy(enemy, opts);
      return;
    }
    if (opts.showText && amount >= 8) spawnText(enemy.x + rand(-6, 6), enemy.y - 20 * enemy.size, `-${Math.round(amount)}`, opts.color || '#d9fbff', 9);
    if (opts.hitSound) audio.sfx('hit');
  };

  const killEnemy = (enemy, opts = {}) => {
    if (enemy.dead) return;
    enemy.dead = true;
    enemy.dying = 0.5;
    state.kills += 1;
    const fishValue = enemy.boss ? 70 + state.wave * 8 : 7 + Math.floor(state.wave * 0.9);
    spawnFish(enemy.x, enemy.y, fishValue);
    if (enemy.boss) {
      spawnFish(enemy.x + 32, enemy.y - 18, 30 + state.wave * 4);
      spawnFish(enemy.x - 30, enemy.y + 22, 30 + state.wave * 4);
      spawnRing(enemy.x, enemy.y, 160, '#ff8b7e', 0.9, 6);
      state.shake = Math.max(state.shake, 12);
      showToast('Ледяная косатка повержена!', 'good', 3000);
    } else {
      spawnRing(enemy.x, enemy.y, 38, enemy.hunter ? '#ff9b90' : '#9deeff', 0.42, 2);
    }
    spawnBurst(enemy.x, enemy.y, enemy.hunter ? '#ffb1a0' : '#b9f4ff', enemy.boss ? 44 : 18, enemy.boss ? 210 : 120, enemy.boss ? 8 : 4.5, enemy.boss ? 1.1 : 0.65, 'bubble');
    spawnBurst(enemy.x, enemy.y, '#ffffff', 8, 60, 2, 0.8, 'dot');
    audio.sfx('kill');
    if (enemy.id === state.bossId) state.bossId = 0;
    if (state.mode === 'playing' && opts.fishBonus) state.fish += opts.fishBonus;
  };

  const damageFloe = (amount, x, y, source) => {
    if (state.mode !== 'playing') return;
    const actual = amount * state.floe.armor;
    state.floe.hp -= actual;
    state.flash = Math.max(state.flash, 0.35);
    state.hitFlash = 0.25;
    state.shake = Math.max(state.shake, 3.5);
    spawnBurst(x, y, '#d9fbff', 8, 90, 3.5, 0.55, 'chip');
    if (source && state.floe.spike > 0) {
      damageEnemy(source, state.floe.spike, { color: '#bff8ff' });
      spawnBurst(source.x, source.y, '#cfeeff', 5, 70, 2.6, 0.45, 'chip');
    }
    if (state.floe.hp <= 0) {
      state.floe.hp = 0;
      triggerGameOver();
    }
  };

  const damageSeal = (amount, source) => {
    const s = state.seal;
    if (state.mode !== 'playing' || s.knocked || s.invuln > 0) return;
    s.hp -= amount;
    s.lastHit = state.time;
    s.hurtTimer = 0.35;
    s.invuln = 0.35;
    state.shake = Math.max(state.shake, 4);
    state.hitFlash = Math.max(state.hitFlash, 0.18);
    spawnBurst(s.x, s.y, '#ff9f99', 10, 90, 3, 0.55, 'dot');
    audio.sfx('hurt');
    if (source) {
      const a = Math.atan2(s.y - source.y, s.x - source.x);
      s.x += Math.cos(a) * 18;
      s.y += Math.sin(a) * 18;
      const clamped = clampToIsland(s.x, s.y, 22);
      s.x = clamped.x;
      s.y = clamped.y;
    }
    if (s.hp <= 0) {
      s.hp = 0;
      s.knocked = true;
      s.knockTimer = 4.2;
      s.dashTimer = 0;
      const lost = Math.min(state.fish, Math.ceil(state.fish * 0.12));
      state.fish -= lost;
      spawnRing(s.x, s.y, 80, '#ff7369', 0.8, 4);
      spawnBurst(s.x, s.y, '#dffbff', 24, 130, 5, 0.9, 'bubble');
      showToast(`Тюлень оглушён! Потеряно ${lost} рыбы.`, 'warn', 3000);
      audio.sfx('hurt');
    }
  };

  const reviveSeal = () => {
    const s = state.seal;
    s.knocked = false;
    s.knockTimer = 0;
    s.hp = Math.round(s.maxHp * 0.55);
    s.x = 0;
    s.y = 0;
    s.invuln = 3;
    spawnRing(0, 0, 110, '#7dffd1', 0.8, 4);
    spawnBurst(0, 0, '#a7f6ff', 25, 120, 4, 0.8, 'bubble');
    showToast('Тюлень снова в строю. Береги его!', 'good', 2800);
  };

  const fireTurret = (turret, stats, target) => {
    const d = turret.def;
    if (d.projectile === 'beam' || d.projectile === 'sniper') {
      damageEnemy(target, stats.damage, { showText: d.projectile === 'sniper', color: d.color });
      state.effects.push({ kind: 'beam', x1: turret.x, y1: turret.y, x2: target.x, y2: target.y, color: d.color, life: 0.16, maxLife: 0.16, width: d.projectile === 'sniper' ? 3.6 : 2.6 });
      if (d.slow) {
        target.slow = Math.max(target.slow, d.slow);
        target.slowTimer = Math.max(target.slowTimer, d.slowTime);
      }
      audio.sfx(d.projectile === 'sniper' ? 'sniper' : 'beam');
      return;
    }
    if (d.projectile === 'chain') {
      const points = [{ x: turret.x, y: turret.y }];
      let current = target;
      const hit = new Set();
      let damage = stats.damage;
      for (let i = 0; i < d.chain && current; i++) {
        hit.add(current.id);
        points.push({ x: current.x, y: current.y });
        damageEnemy(current, damage, { color: d.color });
        damage *= 0.74;
        current = state.enemies
          .filter(e => !e.dead && !hit.has(e.id) && dist(current.x, current.y, e.x, e.y) < 158)
          .sort((a, b) => dist(current.x, current.y, a.x, a.y) - dist(current.x, current.y, b.x, b.y))[0];
      }
      state.effects.push({ kind: 'chain', points, color: d.color, life: 0.22, maxLife: 0.22 });
      audio.sfx('zap');
      return;
    }
    if (d.projectile === 'flame') {
      const dir = Math.atan2(target.y - turret.y, target.x - turret.x);
      for (const e of state.enemies) {
        if (e.dead) continue;
        const ea = Math.atan2(e.y - turret.y, e.x - turret.x);
        const diff = ((ea - dir + Math.PI) % TAU + TAU) % TAU - Math.PI;
        if (Math.abs(diff) < 0.62 && dist(turret.x, turret.y, e.x, e.y) < stats.range + 20) {
          damageEnemy(e, stats.damage, { color: d.color });
          e.burn = Math.max(e.burn, d.burn * (1 + (turret.level - 1) * 0.18));
          e.burnTimer = Math.max(e.burnTimer, 2.6);
        }
      }
      state.effects.push({ kind: 'flame', x: turret.x, y: turret.y, angle: dir, range: stats.range, color: d.color, life: 0.22, maxLife: 0.22 });
      audio.sfx('shoot');
      return;
    }
    if (d.projectile === 'repair') {
      state.floe.hp = Math.min(state.floe.maxHp, state.floe.hp + d.heal * (1 + (turret.level - 1) * 0.35));
      state.effects.push({ kind: 'heal', x: turret.x, y: turret.y, color: d.color, life: 0.6, maxLife: 0.6 });
      return;
    }
    if (d.projectile === 'beacon') {
      for (const e of state.enemies) {
        if (!e.dead && dist(turret.x, turret.y, e.x, e.y) < stats.range) {
          e.slow = Math.max(e.slow, 0.35);
          e.slowTimer = Math.max(e.slowTimer, 2.4);
        }
      }
      state.effects.push({ kind: 'beacon', x: turret.x, y: turret.y, radius: stats.range, color: d.color, life: 0.8, maxLife: 0.8 });
      audio.sfx('beam');
      return;
    }
    const speed = d.projectile === 'mortar' ? 330 : d.projectile === 'shell' ? 360 : d.projectile === 'bubble' ? 290 : d.projectile === 'chakram' ? 420 : 590;
    state.projectiles.push({
      kind: d.projectile, x: turret.x, y: turret.y, targetId: target.id, tx: target.x, ty: target.y,
      speed, damage: stats.damage, color: d.color, aoe: d.aoe || 0, knock: d.knock || 0,
      slow: d.slow || 0, slowTime: d.slowTime || 0, bounces: d.bounces || 0, hitIds: [target.id],
      life: d.projectile === 'mortar' ? 0.85 : 2.8, maxLife: d.projectile === 'mortar' ? 0.85 : 2.8,
      angle: Math.atan2(target.y - turret.y, target.x - turret.x), spin: Math.random() * TAU,
      startX: turret.x, startY: turret.y
    });
    audio.sfx(d.projectile === 'shell' || d.projectile === 'mortar' ? 'cannon' : d.projectile === 'bubble' ? 'beam' : 'shoot');
  };

  const applyAoe = (x, y, radius, damage, opts = {}) => {
    for (const e of state.enemies) {
      if (e.dead) continue;
      const d = dist(x, y, e.x, e.y);
      if (d <= radius + e.radius * 0.4) {
        const falloff = clamp(1 - (d / (radius + 20)) * 0.45, 0.4, 1);
        damageEnemy(e, damage * falloff, { color: opts.color });
        if (opts.slow) {
          e.slow = Math.max(e.slow, opts.slow);
          e.slowTimer = Math.max(e.slowTimer, opts.slowTime || 2);
        }
        if (opts.burn) {
          e.burn = Math.max(e.burn, opts.burn);
          e.burnTimer = Math.max(e.burnTimer, opts.burnTime || 3);
        }
        if (opts.knock) {
          const a = Math.atan2(e.y - y, e.x - x);
          e.x += Math.cos(a) * opts.knock;
          e.y += Math.sin(a) * opts.knock;
          e.stun = Math.max(e.stun, 0.45);
        }
      }
    }
  };

  const updateProjectiles = dt => {
    for (let i = state.projectiles.length - 1; i >= 0; i--) {
      const p = state.projectiles[i];
      p.life -= dt;
      p.spin += dt * 12;
      if (p.kind === 'mortar') {
        if (p.life <= 0) {
          applyAoe(p.tx, p.ty, p.aoe, p.damage, { color: p.color });
          spawnRing(p.tx, p.ty, p.aoe, p.color, 0.5, 4);
          spawnBurst(p.tx, p.ty, p.color, 24, 140, 5.5, 0.7, 'chip');
          state.shake = Math.max(state.shake, 4);
          audio.sfx('cannon');
          state.projectiles.splice(i, 1);
        }
        continue;
      }
      const target = state.enemies.find(e => e.id === p.targetId && !e.dead);
      if (target) {
        p.tx = target.x;
        p.ty = target.y;
      }
      const dx = p.tx - p.x;
      const dy = p.ty - p.y;
      const d = Math.hypot(dx, dy);
      p.angle = Math.atan2(dy, dx);
      if (d < 13) {
        const hitTarget = target || state.enemies.find(e => !e.dead && dist(e.x, e.y, p.tx, p.ty) < 30);
        if (p.kind === 'chakram' && p.bounces > 0) {
          if (hitTarget) damageEnemy(hitTarget, p.damage, { color: p.color });
          const next = state.enemies
            .filter(e => !e.dead && !p.hitIds.includes(e.id) && dist(p.x, p.y, e.x, e.y) < 190)
            .sort((a, b) => dist(p.x, p.y, a.x, a.y) - dist(p.x, p.y, b.x, b.y))[0];
          if (next) {
            p.hitIds.push(next.id);
            p.targetId = next.id;
            p.tx = next.x;
            p.ty = next.y;
            p.bounces -= 1;
            p.life = Math.max(p.life, 1.4);
            continue;
          }
        } else {
          if (p.aoe > 0) {
            applyAoe(p.tx, p.ty, p.aoe, p.damage, { color: p.color, slow: p.slow, slowTime: p.slowTime, knock: p.knock });
            spawnRing(p.tx, p.ty, p.aoe, p.color, 0.45, 3);
            spawnBurst(p.tx, p.ty, p.color, 14, 110, 4, 0.6, 'bubble');
            if (p.kind === 'shell') audio.sfx('cannon');
          } else if (hitTarget) {
            damageEnemy(hitTarget, p.damage, { color: p.color });
            if (p.slow) {
              hitTarget.slow = Math.max(hitTarget.slow, p.slow);
              hitTarget.slowTimer = Math.max(hitTarget.slowTimer, p.slowTime);
            }
            if (p.knock) {
              const a = Math.atan2(hitTarget.y - p.y, hitTarget.x - p.x);
              hitTarget.x += Math.cos(a) * p.knock;
              hitTarget.y += Math.sin(a) * p.knock;
              hitTarget.stun = Math.max(hitTarget.stun, 0.55);
            }
          }
          spawnBurst(p.tx, p.ty, p.color, 5, 50, 2.2, 0.35, 'dot');
        }
        state.projectiles.splice(i, 1);
        continue;
      }
      if (d > 0) {
        const step = Math.min(d, p.speed * dt);
        p.x += (dx / d) * step;
        p.y += (dy / d) * step;
      }
      if (p.life <= 0) state.projectiles.splice(i, 1);
    }
  };

  const updateTurretStats = () => {
    for (const t of state.turrets) {
      const d = t.def;
      const lv = t.level - 1;
      let rate = d.rate * (1 + lv * 0.1) * state.floe.rateMult;
      let range = d.range * (1 + lv * 0.06) * state.floe.rangeMult;
      const damage = d.damage * (1 + lv * 0.38);
      if (d.projectile !== 'beacon') {
        for (const other of state.turrets) {
          if (other.def.id !== 'beacon') continue;
          const otherRange = other.def.range * (1 + (other.level - 1) * 0.06);
          if (dist(t.x, t.y, other.x, other.y) < otherRange) {
            rate *= 1.15;
            range *= 1.1;
          }
        }
      }
      t.stats = { rate, range, damage };
    }
  };

  const updateTurrets = dt => {
    updateTurretStats();
    for (const t of state.turrets) {
      const stats = t.stats;
      t.cool -= dt;
      t.angle = angleLerp(t.angle, t.aimAngle, Math.min(1, dt * 8));
      if (t.def.projectile === 'repair') {
        if (t.cool <= 0 && state.floe.hp < state.floe.maxHp) {
          t.aimAngle = -Math.PI / 2;
          fireTurret(t, stats, null);
          t.cool = 1 / Math.max(0.1, stats.rate);
        }
        continue;
      }
      if (t.def.projectile === 'beacon') {
        if (t.cool <= 0) {
          fireTurret(t, stats, null);
          t.cool = 1 / Math.max(0.1, stats.rate);
        }
        continue;
      }
      const target = findNearestEnemy(t.x, t.y, stats.range);
      if (target) {
        t.aimAngle = Math.atan2(target.y - t.y, target.x - t.x);
        if (t.cool <= 0) {
          fireTurret(t, stats, target);
          t.cool = 1 / Math.max(0.1, stats.rate);
        }
      } else {
        t.aimAngle += dt * 0.18;
      }
    }
  };

  const updateTraps = dt => {
    for (const trap of state.traps) {
      trap.cool = Math.max(0, trap.cool - dt);
      trap.pulse += dt;
      if (trap.cool > 0) continue;
      const b = state.enemies.find(e => !e.dead && dist(trap.x, trap.y, e.x, e.y) < trap.def.trigger && e.state !== 'island');
      if (!b) continue;
      const d = trap.def;
      if (d.id === 'mine') {
        applyAoe(trap.x, trap.y, d.radius, d.damage, { color: d.color });
        spawnRing(trap.x, trap.y, d.radius, d.color, 0.55, 4);
        spawnBurst(trap.x, trap.y, '#c8fbff', 22, 170, 5, 0.8, 'chip');
        state.shake = Math.max(state.shake, 5);
        audio.sfx('cannon');
      } else if (d.id === 'net') {
        applyAoe(trap.x, trap.y, d.radius, 0, { color: d.color, slow: d.slow, slowTime: d.slowTime });
        spawnRing(trap.x, trap.y, d.radius, d.color, 0.65, 2);
        state.effects.push({ kind: 'net', x: trap.x, y: trap.y, radius: d.radius, color: d.color, life: 1.1, maxLife: 1.1 });
        audio.sfx('beam');
      } else if (d.id === 'decoy') {
        for (const e of state.enemies) {
          if (!e.dead && dist(trap.x, trap.y, e.x, e.y) < d.radius && !e.boss) e.taunt = { x: trap.x, y: trap.y, timer: d.taunt };
        }
        spawnRing(trap.x, trap.y, d.radius, d.color, 0.9, 3);
        state.effects.push({ kind: 'decoyPulse', x: trap.x, y: trap.y, color: d.color, life: 1.2, maxLife: 1.2 });
        audio.sfx('snow');
      } else if (d.id === 'kelp') {
        const hit = new Set();
        let current = b;
        let dmg = d.damage;
        const points = [{ x: trap.x, y: trap.y }];
        for (let i = 0; i < d.chain && current; i++) {
          hit.add(current.id);
          points.push({ x: current.x, y: current.y });
          damageEnemy(current, dmg, { color: d.color });
          dmg *= 0.76;
          const last = points[points.length - 1];
          current = state.enemies
            .filter(e => !e.dead && !hit.has(e.id) && dist(last.x, last.y, e.x, e.y) < 175)
            .sort((a, c) => dist(last.x, last.y, a.x, a.y) - dist(last.x, last.y, c.x, c.y))[0];
        }
        state.effects.push({ kind: 'chain', points, color: d.color, life: 0.28, maxLife: 0.28 });
        audio.sfx('zap');
      } else if (d.id === 'oil') {
        applyAoe(trap.x, trap.y, d.radius, 0, { color: d.color, slow: d.slow, slowTime: 4, burn: d.burn, burnTime: d.burnTime });
        state.effects.push({ kind: 'oil', x: trap.x, y: trap.y, radius: d.radius, color: d.color, life: 3.4, maxLife: 3.4 });
        audio.sfx('beam');
      } else if (d.id === 'harpoonTrap') {
        damageEnemy(b, d.damage, { showText: true, color: d.color });
        const a = Math.atan2(trap.y - b.y, trap.x - b.x);
        b.x += Math.cos(a) * d.radius;
        b.y += Math.sin(a) * d.radius;
        b.stun = Math.max(b.stun, 0.8);
        state.effects.push({ kind: 'beam', x1: trap.x, y1: trap.y, x2: b.x, y2: b.y, color: d.color, life: 0.25, maxLife: 0.25, width: 3 });
        audio.sfx('sniper');
      } else if (d.id === 'bubbleTrap') {
        applyAoe(trap.x, trap.y, d.radius, d.damage, { color: d.color, knock: d.knock });
        spawnRing(trap.x, trap.y, d.radius, d.color, 0.7, 3);
        spawnBurst(trap.x, trap.y, '#c9feff', 20, 130, 5, 0.8, 'bubble');
        audio.sfx('cannon');
      }
      trap.cool = d.cooldown;
    }
  };

  const moveEnemy = (e, tx, ty, dt, speedMult = 1) => {
    const dx = tx - e.x;
    const dy = ty - e.y;
    const d = Math.hypot(dx, dy);
    const slowMult = e.slowTimer > 0 ? 1 - e.slow : 1;
    const speed = e.speed * slowMult * speedMult;
    if (d > 0.001) {
      e.angle = angleLerp(e.angle, Math.atan2(dy, dx), Math.min(1, dt * 5));
      const step = Math.min(d, speed * dt);
      e.x += (dx / d) * step;
      e.y += (dy / d) * step;
    }
    return d;
  };

  const updateEnemies = dt => {
    const seal = state.seal;
    for (const e of state.enemies) {
      if (e.dead) {
        e.dying -= dt;
        continue;
      }
      e.phase += dt;
      e.flash = Math.max(0, e.flash - dt);
      if (e.slowTimer > 0) e.slowTimer -= dt;
      if (e.burnTimer > 0) {
        e.burnTimer -= dt;
        e.hp -= e.burn * dt;
        if (Math.random() < dt * 5) spawnBurst(e.x, e.y, '#ff9a5b', 1, 25, 2, 0.4, 'dot');
        if (e.hp <= 0) {
          killEnemy(e);
          continue;
        }
      }
      if (e.stun > 0) {
        e.stun -= dt;
        continue;
      }
      if (e.taunt) {
        e.taunt.timer -= dt;
        if (e.taunt.timer <= 0) e.taunt = null;
      }
      if (e.state === 'swim') {
        const targetX = e.taunt ? e.taunt.x : Math.cos(e.attackAngle) * (islandRadiusAt(e.attackAngle) + 24);
        const targetY = e.taunt ? e.taunt.y : Math.sin(e.attackAngle) * (islandRadiusAt(e.attackAngle) + 24);
        const d = moveEnemy(e, targetX, targetY, dt);
        if (d < 10) {
          if (e.taunt) {
            e.x = targetX + Math.cos(e.phase * 1.4) * 18;
            e.y = targetY + Math.sin(e.phase * 1.4) * 18;
            e.angle = e.phase * 1.4 + Math.PI / 2;
          } else if (e.hunter) {
            e.state = 'leap';
            e.leap = 0;
            e.leapStart = { x: e.x, y: e.y };
            const landAngle = e.attackAngle + rand(-0.15, 0.15);
            const landR = Math.max(24, islandRadiusAt(landAngle) - rand(72, 115));
            e.leapEnd = { x: Math.cos(landAngle) * landR, y: Math.sin(landAngle) * landR };
          } else {
            e.state = 'chomp';
          }
        }
      } else if (e.state === 'leap') {
        e.leap += dt / 0.7;
        const t = clamp(e.leap, 0, 1);
        e.x = lerp(e.leapStart.x, e.leapEnd.x, smooth(t));
        e.y = lerp(e.leapStart.y, e.leapEnd.y, smooth(t));
        e.z = Math.sin(t * Math.PI) * 52;
        e.angle = Math.atan2(e.leapEnd.y - e.leapStart.y, e.leapEnd.x - e.leapStart.x);
        if (t >= 1) {
          e.state = 'island';
          e.z = 0;
          spawnBurst(e.x, e.y, '#c9fbff', 12, 100, 4, 0.6, 'chip');
          spawnRing(e.x, e.y, 34, '#ff9b90', 0.45, 2);
          state.shake = Math.max(state.shake, 2.5);
        }
      } else if (e.state === 'chomp') {
        const rr = islandRadiusAt(e.attackAngle) + 22;
        e.x = Math.cos(e.attackAngle) * rr;
        e.y = Math.sin(e.attackAngle) * rr;
        e.angle = angleLerp(e.angle, e.attackAngle + Math.PI, Math.min(1, dt * 5));
        e.attackTimer -= dt;
        if (e.attackTimer <= 0) {
          e.attackTimer = e.attackInterval;
          damageFloe(e.damage, e.x, e.y, e);
          spawnRing(e.x, e.y, 26, '#ff8f86', 0.3, 2);
          audio.sfx('hit');
        }
      } else if (e.state === 'island') {
        e.z = Math.max(0, e.z - dt * 50);
        if (seal.knocked) {
          const a = e.phase * 0.5;
          moveEnemy(e, Math.cos(a) * 40, Math.sin(a) * 40, dt, 0.55);
          continue;
        }
        const d = moveEnemy(e, seal.x, seal.y, dt);
        if (d < 48 + e.radius * 0.3) {
          e.attackTimer -= dt;
          if (e.attackTimer <= 0) {
            e.attackTimer = 1.3;
            damageSeal(e.biteDamage, e);
            spawnBurst(seal.x, seal.y, '#ffad9b', 8, 80, 3.4, 0.55, 'dot');
          }
        }
      }
    }

    for (let i = 0; i < state.enemies.length; i++) {
      const a = state.enemies[i];
      if (a.dead) continue;
      for (let j = i + 1; j < state.enemies.length; j++) {
        const b = state.enemies[j];
        if (b.dead || a.state === 'island' || b.state === 'island' || a.state === 'leap' || b.state === 'leap') continue;
        const d = dist(a.x, a.y, b.x, b.y);
        const min = 43 * Math.max(a.size, b.size);
        if (d < min && d > 0.01) {
          const push = (min - d) * 0.15;
          const nx = (a.x - b.x) / d;
          const ny = (a.y - b.y) / d;
          a.x += nx * push;
          a.y += ny * push;
          b.x -= nx * push;
          b.y -= ny * push;
        }
      }
    }

    state.enemies = state.enemies.filter(e => !e.dead || e.dying > 0);
  };

  const updatePickups = dt => {
    const seal = state.seal;
    for (let i = state.pickups.length - 1; i >= 0; i--) {
      const p = state.pickups[i];
      p.age += dt;
      p.phase += dt * 3;
      if (!p.settled) {
        const dx = p.tx - p.x;
        const dy = p.ty - p.y;
        const d = Math.hypot(dx, dy);
        if (d < 8) {
          p.settled = true;
        } else {
          const step = Math.min(d, 290 * dt);
          p.x += (dx / d) * step;
          p.y += (dy / d) * step;
        }
      }
      if (p.settled && p.age > 14) p.flying = true;
      if (p.flying) {
        const dx = seal.x - p.x;
        const dy = seal.y - p.y;
        const d = Math.hypot(dx, dy);
        if (d < 28) {
          state.fish += p.value;
          state.totalFish += p.value;
          spawnText(seal.x, seal.y - 26, `+${p.value}`, '#ffd166', 11);
          spawnBurst(seal.x, seal.y, '#ffd166', 5, 45, 2.4, 0.4, 'dot');
          audio.sfx('collect');
          state.pickups.splice(i, 1);
          continue;
        }
        const step = Math.min(d, 380 * dt);
        p.x += (dx / d) * step;
        p.y += (dy / d) * step;
      } else if (dist(seal.x, seal.y, p.x, p.y) < seal.magnet) {
        state.fish += p.value;
        state.totalFish += p.value;
        spawnText(seal.x, seal.y - 26, `+${p.value}`, '#ffd166', 11);
        spawnBurst(seal.x, seal.y, '#ffd166', 5, 45, 2.4, 0.4, 'dot');
        audio.sfx('collect');
        state.pickups.splice(i, 1);
        continue;
      }
      if (p.age > 42) state.pickups.splice(i, 1);
    }
  };

  const updateParticles = dt => {
    for (let i = state.particles.length - 1; i >= 0; i--) {
      const p = state.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        state.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.gravity * dt;
      const drag = Math.max(0, 1 - p.drag * dt);
      p.vx *= drag;
      p.vy *= drag;
    }
    for (let i = state.effects.length - 1; i >= 0; i--) {
      state.effects[i].life -= dt;
      if (state.effects[i].life <= 0) state.effects.splice(i, 1);
    }
    for (let i = state.texts.length - 1; i >= 0; i--) {
      const text = state.texts[i];
      text.life -= dt;
      text.y += text.vy * dt;
      if (text.life <= 0) state.texts.splice(i, 1);
    }
  };

  const updateSeal = dt => {
    const s = state.seal;
    s.dashCd = Math.max(0, s.dashCd - dt);
    s.snowCd = Math.max(0, s.snowCd - dt);
    s.invuln = Math.max(0, s.invuln - dt);
    s.hurtTimer = Math.max(0, s.hurtTimer - dt);
    if (s.knocked) {
      s.knockTimer -= dt;
      if (s.knockTimer <= 0) reviveSeal();
      return;
    }
    if (s.lastHit > state.time - 6 && s.hp < s.maxHp) s.hp = Math.min(s.maxHp, s.hp + 1.1 * dt);
    let ix = 0;
    let iy = 0;
    if (input.keys.has('KeyA') || input.keys.has('ArrowLeft')) ix -= 1;
    if (input.keys.has('KeyD') || input.keys.has('ArrowRight')) ix += 1;
    if (input.keys.has('KeyW') || input.keys.has('ArrowUp')) iy -= 1;
    if (input.keys.has('KeyS') || input.keys.has('ArrowDown')) iy += 1;
    const joyMag = Math.hypot(input.joyX, input.joyY);
    if (joyMag > 0.08) {
      ix = input.joyX;
      iy = input.joyY;
    } else if (ix === 0 && iy === 0 && tilt.enabled) {
      ix = input.tiltX;
      iy = input.tiltY;
    }
    const mag = Math.hypot(ix, iy);
    if (mag > 1) {
      ix /= mag;
      iy /= mag;
    }
    if (s.dashTimer > 0) {
      s.dashTimer -= dt;
      const dashSpeed = s.speed * 3.8;
      s.x += s.dashDirX * dashSpeed * dt;
      s.y += s.dashDirY * dashSpeed * dt;
      if (Math.random() < 0.8) {
        state.particles.push({
          x: s.x + rand(-12, 12), y: s.y + rand(-12, 12),
          vx: -s.dashDirX * rand(20, 60), vy: -s.dashDirY * rand(20, 60),
          color: '#bff8ff', size: rand(2, 5), life: rand(0.2, 0.45), maxLife: 0.45,
          gravity: 0, drag: 3.5, kind: 'bubble'
        });
      }
    } else if (mag > 0.04) {
      s.x += ix * s.speed * dt;
      s.y += iy * s.speed * dt;
      s.facing = angleLerp(s.facing, Math.atan2(iy, ix), Math.min(1, dt * 12));
    }
    const clamped = clampToIsland(s.x, s.y, 24);
    s.x = clamped.x;
    s.y = clamped.y;
  };

  const update = dt => {
    if (state.mode !== 'playing' || ui.paused || ui.drawerOpen || ui.inspecting) return;
    state.time += dt;
    state.shake = Math.max(0, state.shake - dt * 22);
    state.flash = Math.max(0, state.flash - dt * 2.9);
    state.hitFlash = Math.max(0, state.hitFlash - dt * 3.4);
    if (!state.waveActive) {
      state.prepTimer -= dt;
      if (state.prepTimer <= 0) startWave();
    } else {
      if (state.spawnQueue.length > 0) {
        state.spawnTimer -= dt;
        if (state.spawnTimer <= 0) {
          const type = state.spawnQueue.shift();
          spawnEnemy(type);
          state.spawnTimer = state.spawnInterval;
        }
      }
      if (state.spawnQueue.length === 0 && state.enemies.length === 0) waveCleared();
    }
    if (state.floe.regen > 0) state.floe.hp = Math.min(state.floe.maxHp, state.floe.hp + state.floe.regen * dt);
    updateSeal(dt);
    updateEnemies(dt);
    updateTurrets(dt);
    updateTraps(dt);
    updateProjectiles(dt);
    updatePickups(dt);
    updateParticles(dt);
    if (state.seal.knocked && Math.random() < dt * 5) {
      state.particles.push({
        x: state.seal.x + rand(-16, 16), y: state.seal.y + rand(-12, 12),
        vx: rand(-10, 10), vy: rand(-25, -8), color: '#c9fbff', size: rand(1.5, 3),
        life: rand(0.5, 1), maxLife: 1, gravity: 0, drag: 1, kind: 'bubble'
      });
    }
    const now = performance.now();
    if (now - ui.lastHud > 80) {
      updateHud();
      ui.lastHud = now;
    }
    if (ui.drawerOpen) {
      const key = `${state.fish}|${ui.tab}|${state.wave}|${JSON.stringify(state.upgrades)}`;
      if (key !== ui.shopKey) {
        ui.shopKey = key;
        renderShop();
      }
    }
  };

  const tryDash = () => {
    const s = state.seal;
    if (state.mode !== 'playing' || ui.paused || ui.drawerOpen || ui.inspecting || s.knocked) return;
    if (s.dashCd > 0) return;
    let ix = 0;
    let iy = 0;
    if (input.keys.has('KeyA') || input.keys.has('ArrowLeft')) ix -= 1;
    if (input.keys.has('KeyD') || input.keys.has('ArrowRight')) ix += 1;
    if (input.keys.has('KeyW') || input.keys.has('ArrowUp')) iy -= 1;
    if (input.keys.has('KeyS') || input.keys.has('ArrowDown')) iy += 1;
    if (Math.hypot(input.joyX, input.joyY) > 0.08) {
      ix = input.joyX;
      iy = input.joyY;
    } else if (ix === 0 && iy === 0 && tilt.enabled) {
      ix = input.tiltX;
      iy = input.tiltY;
    }
    if (ix === 0 && iy === 0) {
      ix = Math.cos(s.facing);
      iy = Math.sin(s.facing);
    }
    const m = Math.hypot(ix, iy) || 1;
    s.dashDirX = ix / m;
    s.dashDirY = iy / m;
    s.dashTimer = 0.19;
    s.dashCd = s.dashCooldown;
    s.invuln = Math.max(s.invuln, 0.55);
    s.facing = Math.atan2(s.dashDirY, s.dashDirX);
    for (const e of state.enemies) {
      if (e.dead) continue;
      if (dist(s.x, s.y, e.x, e.y) < 68 + e.radius * 0.4) {
        damageEnemy(e, s.dashDamage, { showText: true, color: '#bff8ff' });
        const a = Math.atan2(e.y - s.y, e.x - s.x);
        e.x += Math.cos(a) * 34;
        e.y += Math.sin(a) * 34;
        e.stun = Math.max(e.stun, 0.6);
        spawnBurst(e.x, e.y, '#c9fbff', 8, 100, 3.5, 0.5, 'chip');
      }
    }
    spawnRing(s.x, s.y, 70, '#8cecff', 0.4, 3);
    audio.sfx('dash');
  };

  const trySnowball = () => {
    const s = state.seal;
    if (state.mode !== 'playing' || ui.paused || ui.drawerOpen || ui.inspecting || s.knocked) return;
    if (s.snowCd > 0) return;
    const target = state.enemies.filter(e => !e.dead).sort((a, b) => dist(s.x, s.y, a.x, a.y) - dist(s.x, s.y, b.x, b.y))[0];
    if (!target || dist(s.x, s.y, target.x, target.y) > 490) {
      showToast('Нет цели в радиусе снежка.', '', 1200);
      return;
    }
    s.snowCd = s.snowCooldown;
    s.facing = Math.atan2(target.y - s.y, target.x - s.x);
    state.projectiles.push({
      kind: 'snowball', x: s.x, y: s.y, targetId: target.id, tx: target.x, ty: target.y,
      speed: 510, damage: s.snowDamage, color: '#e8feff', aoe: 0, knock: 0,
      slow: 0.48, slowTime: 2.5, bounces: 0, hitIds: [target.id],
      life: 2.3, maxLife: 2.3, angle: s.facing, spin: 0, startX: s.x, startY: s.y
    });
    spawnBurst(s.x + Math.cos(s.facing) * 30, s.y + Math.sin(s.facing) * 30, '#dffbff', 8, 75, 3, 0.4, 'dot');
    audio.sfx('snow');
  };

  const setPlacement = (kind, id) => {
    const def = kind === 'turret' ? TURRETS.find(t => t.id === id) : TRAPS.find(t => t.id === id);
    if (!def) return;
    closeDrawer();
    closeInspect();
    state.placement = { kind, id, def };
    refs.placementName.textContent = def.name;
    refs.placementHint.textContent = kind === 'turret' ? 'Коснись льда, чтобы поставить' : 'Коснись воды у кромки льда';
    refs.placementBar.classList.remove('hidden');
    refs.readyWrap.classList.add('hidden');
    showToast(kind === 'turret' ? `${def.name}: выбери место на льду.` : `${def.name}: выбери воду у края льдины.`, '', 2200);
  };

  const cancelPlacement = () => {
    state.placement = null;
    refs.placementBar.classList.add('hidden');
    updateHud(true);
  };

  const tryPlace = (x, y) => {
    if (!state.placement) return;
    const placement = state.placement;
    const def = placement.def;
    if (state.fish < def.cost) {
      showToast('Не хватает рыбы.', 'warn', 1600);
      audio.sfx('deny');
      return;
    }
    if (placement.kind === 'turret') {
      if (!isOnIsland(x, y, 38)) {
        showToast('Турель можно ставить только на лёд.', 'warn', 1600);
        audio.sfx('deny');
        return;
      }
      if (state.turrets.some(t => dist(t.x, t.y, x, y) < 44)) {
        showToast('Слишком близко к другой турели.', 'warn', 1600);
        audio.sfx('deny');
        return;
      }
      if (dist(state.seal.x, state.seal.y, x, y) < 26) {
        showToast('Тюлень не даст поставить турель на себя.', 'warn', 1500);
        audio.sfx('deny');
        return;
      }
      state.fish -= def.cost;
      state.turrets.push({
        id: state.nextId++, def, x, y, level: 1,
        angle: -Math.PI / 2, aimAngle: -Math.PI / 2, cool: 0, invested: def.cost,
        stats: { rate: def.rate, range: def.range, damage: def.damage }
      });
      spawnRing(x, y, 34, def.color, 0.45, 3);
      spawnBurst(x, y, '#dffbff', 12, 85, 3.5, 0.5, 'chip');
    } else {
      const r = Math.hypot(x, y);
      const a = Math.atan2(y, x);
      const boundary = islandRadiusAt(a);
      if (r < boundary + 12 || r > boundary + 186) {
        showToast('Ловушку ставят в прибрежную воду.', 'warn', 1800);
        audio.sfx('deny');
        return;
      }
      if (state.traps.some(t => dist(t.x, t.y, x, y) < 54)) {
        showToast('Здесь уже есть ловушка.', 'warn', 1600);
        audio.sfx('deny');
        return;
      }
      state.fish -= def.cost;
      state.traps.push({ id: state.nextId++, def, x, y, cool: 0, pulse: Math.random() * TAU, invested: def.cost });
      spawnRing(x, y, 30, def.color, 0.5, 2);
      spawnBurst(x, y, def.color, 12, 85, 3, 0.5, 'bubble');
    }
    audio.sfx('build');
    state.placement = null;
    refs.placementBar.classList.add('hidden');
    UI_READY_REFRESH();
    refreshShopIfOpen();
    updateHud(true);
  };

  const turretUpgradeCost = turret => Math.round(turret.def.cost * (0.72 + 0.48 * (turret.level - 1)));

  const upgradeTurret = turret => {
    if (!turret || turret.level >= 5) return;
    const cost = turretUpgradeCost(turret);
    if (state.fish < cost) {
      showToast('Не хватает рыбы на улучшение.', 'warn', 1600);
      audio.sfx('deny');
      return;
    }
    state.fish -= cost;
    turret.level += 1;
    turret.invested += cost;
    spawnRing(turret.x, turret.y, 44, turret.def.color, 0.5, 3);
    spawnBurst(turret.x, turret.y, '#dffbff', 12, 90, 3, 0.5, 'dot');
    audio.sfx('upgrade');
    showToast(`${turret.def.name} улучшен до ${turret.level} уровня.`, 'good', 2000);
    updateInspect();
    refreshShopIfOpen();
    updateHud(true);
  };

  const sellTurret = turret => {
    if (!turret) return;
    state.fish += Math.floor(turret.invested * 0.55);
    state.turrets = state.turrets.filter(t => t !== turret);
    spawnBurst(turret.x, turret.y, turret.def.color, 16, 80, 3, 0.6, 'chip');
    audio.sfx('collect');
    closeInspect();
    refreshShopIfOpen();
    updateHud(true);
  };

  const buyUpgrade = (kind, id) => {
    const list = kind === 'floe' ? FLOE_UPGRADES : SEAL_UPGRADES;
    const def = list.find(d => d.id === id);
    if (!def) return;
    const bag = kind === 'floe' ? state.upgrades.floe : state.upgrades.seal;
    const level = bag[id] || 0;
    if (level >= def.max) {
      showToast('Максимальный уровень.', '', 1500);
      return;
    }
    const cost = Math.round(def.cost * Math.pow(1.42, level));
    if (state.fish < cost) {
      showToast('Не хватает рыбы.', 'warn', 1600);
      audio.sfx('deny');
      return;
    }
    state.fish -= cost;
    bag[id] = level + 1;
    recomputeDerived(false);
    if (id === 'reinforce') state.floe.hp = Math.min(state.floe.maxHp, state.floe.hp + 28);
    if (id === 'blubber') state.seal.hp = Math.min(state.seal.maxHp, state.seal.hp + 22);
    const px = kind === 'floe' ? 0 : state.seal.x;
    const py = kind === 'floe' ? 0 : state.seal.y;
    spawnRing(px, py, kind === 'floe' ? 90 : 48, def.color, 0.6, 3);
    spawnBurst(px, py, def.color, 14, 90, 3, 0.6, 'dot');
    audio.sfx('upgrade');
    showToast(`${def.name}: уровень ${level + 1}.`, 'good', 1700);
    ui.shopKey = '';
    renderShop();
    updateHud(true);
  };

  const openDrawer = (tab = ui.tab) => {
    if (state.mode !== 'playing') return;
    closeInspect();
    cancelPlacement();
    ui.drawerOpen = true;
    ui.tab = tab;
    body.classList.add('drawer-open');
    refs.drawerBackdrop.classList.remove('hidden');
    refs.readyWrap.classList.add('hidden');
    renderShop();
    audio.sfx('ready');
  };

  const closeDrawer = () => {
    ui.drawerOpen = false;
    body.classList.remove('drawer-open');
    refs.drawerBackdrop.classList.add('hidden');
    UI_READY_REFRESH();
    updateHud(true);
  };

  const fishSvg = () => '<svg viewBox="0 0 32 24" aria-hidden="true"><path d="M3 12c4-6 10-8 16-5 4 2 7 4 10 5-3 2-6 4-10 5-6 3-12 1-16-5Z"/><path d="M3 12 0 6v12l3-6Z"/><circle cx="22" cy="10" r="1.3"/></svg>';

  const makeCard = (def, type, cost, level, max) => {
    const card = document.createElement('button');
    card.className = 'card';
    card.style.setProperty('--accent', def.color);
    const affordable = state.fish >= cost;
    const maxed = max > 0 && level >= max;
    if (!affordable && !maxed) card.classList.add('locked');
    const icon = document.createElement('div');
    icon.className = 'card-icon';
    const iconCanvas = document.createElement('canvas');
    iconCanvas.width = 116;
    iconCanvas.height = 116;
    paintIcon(iconCanvas, type, def);
    icon.appendChild(iconCanvas);
    const name = document.createElement('div');
    name.className = 'card-name';
    const title = document.createElement('span');
    title.textContent = def.name;
    name.appendChild(title);
    if (type === 'upgrade') {
      const levelTag = document.createElement('span');
      levelTag.className = 'card-level';
      levelTag.textContent = maxed ? 'МАКС' : `${level}/${max}`;
      name.appendChild(levelTag);
    }
    const desc = document.createElement('div');
    desc.className = 'card-desc';
    desc.textContent = def.desc;
    const bottom = document.createElement('div');
    bottom.className = 'card-bottom';
    if (maxed) {
      const tag = document.createElement('span');
      tag.className = 'card-tag';
      tag.textContent = 'ПОЛНОСТЬЮ УЛУЧШЕНО';
      bottom.appendChild(tag);
    } else if (type === 'upgrade') {
      const pips = document.createElement('div');
      pips.className = 'pips';
      for (let i = 0; i < max; i++) {
        const pip = document.createElement('i');
        if (i < level) pip.classList.add('on');
        pips.appendChild(pip);
      }
      bottom.appendChild(pips);
      const costEl = document.createElement('span');
      costEl.className = `card-cost ${state.fish < cost ? 'poor' : ''}`;
      costEl.innerHTML = `${fishSvg()}${formatNumber(cost)}`;
      bottom.appendChild(costEl);
    } else {
      const costEl = document.createElement('span');
      costEl.className = `card-cost ${state.fish < cost ? 'poor' : ''}`;
      costEl.innerHTML = `${fishSvg()}${formatNumber(cost)}`;
      bottom.appendChild(costEl);
      const tag = document.createElement('span');
      tag.className = 'card-tag';
      tag.textContent = type === 'turret' ? 'ТУРЕЛЬ' : 'ЛОВУШКА';
      bottom.appendChild(tag);
    }
    card.append(icon, name, desc, bottom);
    return card;
  };

  const renderShop = () => {
    const tabs = refs.tabs.querySelectorAll('.tab');
    tabs.forEach(tab => tab.classList.toggle('active', tab.dataset.tab === ui.tab));
    refs.drawerFish.textContent = formatNumber(state.fish);
    refs.drawerTip.textContent = ui.tab === 'turrets'
      ? 'Турели атакуют автоматически. Выбери карточку, затем коснись льда.'
      : ui.tab === 'traps'
        ? 'Ловушки ставятся в воду у кромки льда. Они срабатывают сами.'
        : ui.tab === 'floe'
          ? 'Улучшения действуют на всю льдину и все турели. Покупай сразу.'
          : 'Улучшения тюленя. Рывок и снежок помогут пережить охотников.';
    refs.cardList.innerHTML = '';
    if (ui.tab === 'turrets') {
      for (const def of TURRETS) {
        const card = makeCard(def, 'turret', def.cost, 0, 0);
        card.addEventListener('click', () => {
          if (state.fish < def.cost) {
            showToast('Не хватает рыбы.', 'warn', 1500);
            audio.sfx('deny');
            return;
          }
          setPlacement('turret', def.id);
        });
        refs.cardList.appendChild(card);
      }
    } else if (ui.tab === 'traps') {
      for (const def of TRAPS) {
        const card = makeCard(def, 'trap', def.cost, 0, 0);
        card.addEventListener('click', () => {
          if (state.fish < def.cost) {
            showToast('Не хватает рыбы.', 'warn', 1500);
            audio.sfx('deny');
            return;
          }
          setPlacement('trap', def.id);
        });
        refs.cardList.appendChild(card);
      }
    } else {
      const list = ui.tab === 'floe' ? FLOE_UPGRADES : SEAL_UPGRADES;
      const bag = ui.tab === 'floe' ? state.upgrades.floe : state.upgrades.seal;
      for (const def of list) {
        const level = bag[def.id] || 0;
        const maxed = level >= def.max;
        const cost = Math.round(def.cost * Math.pow(1.42, level));
        const card = makeCard(def, 'upgrade', cost, level, def.max);
        if (maxed) card.classList.add('maxed');
        card.addEventListener('click', () => buyUpgrade(ui.tab, def.id));
        refs.cardList.appendChild(card);
      }
    }
    ui.shopKey = `${state.fish}|${ui.tab}|${state.wave}|${JSON.stringify(state.upgrades)}`;
  };

  const paintIcon = (iconCanvas, type, def) => {
    const c = iconCanvas.getContext('2d');
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, iconCanvas.width, iconCanvas.height);
    c.translate(iconCanvas.width / 2, iconCanvas.height / 2);
    if (type === 'turret') {
      c.scale(1.55, 1.55);
      drawTurretBody(c, { def, angle: -Math.PI / 2, level: 1 }, 0, true);
    } else if (type === 'trap') {
      c.scale(1.55, 1.55);
      drawTrapBody(c, { def, pulse: 0.8, cool: 0 }, 0, true);
    } else {
      c.scale(1.35, 1.35);
      drawUpgradeIcon(c, def.id, def.color, 30);
    }
  };

  const updateInspect = () => {
    const turret = ui.inspecting;
    if (!turret) return;
    const stats = turret.stats || { range: turret.def.range, rate: turret.def.rate, damage: turret.def.damage };
    refs.inspectName.textContent = turret.def.name;
    refs.inspectLevel.textContent = `УР. ${turret.level}`;
    const levelMult = 1 + (turret.level - 1) * 0.38;
    if (turret.def.projectile === 'repair') {
      refs.inspectStats.innerHTML = `<span>Ремонт: <b>${(turret.def.heal * (1 + (turret.level - 1) * 0.35)).toFixed(1)}/с</b></span><span>Дальность ауры: <b>${Math.round(stats.range)}</b></span>`;
    } else if (turret.def.projectile === 'beacon') {
      refs.inspectStats.innerHTML = `<span>Замедление: <b>35%</b></span><span>Ускорение турелей: <b>+15%</b></span><span>Радиус: <b>${Math.round(stats.range)}</b></span>`;
    } else {
      refs.inspectStats.innerHTML = `<span>Урон: <b>${Math.round(turret.def.damage * levelMult)}</b></span><span>Дальность: <b>${Math.round(stats.range)}</b></span><span>Скорость: <b>${stats.rate.toFixed(2)}/с</b></span>`;
    }
    const maxed = turret.level >= 5;
    const cost = turretUpgradeCost(turret);
    refs.upgradeBtn.disabled = maxed || state.fish < cost;
    refs.upgradeCost.textContent = maxed ? 'МАКС' : formatNumber(cost);
    refs.sellValue.textContent = formatNumber(Math.floor(turret.invested * 0.55));
    const iconCanvas = document.createElement('canvas');
    iconCanvas.width = 116;
    iconCanvas.height = 116;
    paintIcon(iconCanvas, 'turret', turret.def);
    refs.inspectIcon.innerHTML = '';
    refs.inspectIcon.appendChild(iconCanvas);
  };

  const openInspect = turret => {
    ui.inspecting = turret;
    cancelPlacement();
    refs.inspectPanel.classList.remove('hidden');
    updateInspect();
    refs.readyWrap.classList.add('hidden');
  };

  const closeInspect = () => {
    ui.inspecting = null;
    refs.inspectPanel.classList.add('hidden');
    UI_READY_REFRESH();
  };

  const updateHud = force => {
    const now = performance.now();
    if (!force && now - ui.lastHud < 70) return;
    const f = state.floe;
    const s = state.seal;
    refs.fishCount.textContent = formatNumber(state.fish);
    refs.hpText.textContent = `${Math.ceil(f.hp)} / ${Math.round(f.maxHp)}`;
    refs.hpFill.style.width = `${clamp((f.hp / f.maxHp) * 100, 0, 100)}%`;
    refs.hpBar.classList.toggle('danger', f.hp / f.maxHp < 0.32);
    refs.sealFill.style.width = `${clamp((s.hp / s.maxHp) * 100, 0, 100)}%`;
    refs.waveLabel.textContent = state.mode === 'menu' ? 'ВОЛНА 1' : `ВОЛНА ${waveNumber()}`;
    if (state.mode === 'menu') refs.waveSub.textContent = '';
    else if (!state.waveActive) refs.waveSub.textContent = `через ${Math.max(0, Math.ceil(state.prepTimer))} с`;
    else if (state.spawnQueue.length > 0) refs.waveSub.textContent = `косаток: ${state.enemies.length + state.spawnQueue.length}`;
    else refs.waveSub.textContent = `косаток: ${state.enemies.length}`;
    const dashRatio = s.dashCd / Math.max(0.01, s.dashCooldown);
    refs.dashCd.style.setProperty('--cd', `${clamp(dashRatio, 0, 1) * 360}deg`);
    refs.dashBtn.classList.toggle('ready', s.dashCd <= 0.001 && !s.knocked);
    refs.dashBtn.classList.toggle('disabled', s.knocked);
    const snowRatio = s.snowCd / Math.max(0.01, s.snowCooldown);
    refs.snowballCd.style.setProperty('--cd', `${clamp(snowRatio, 0, 1) * 360}deg`);
    refs.snowballBtn.classList.toggle('ready', s.snowCd <= 0.001 && !s.knocked);
    refs.snowballBtn.classList.toggle('disabled', s.knocked);
    const boss = state.bossId ? state.enemies.find(e => e.id === state.bossId && !e.dead) : null;
    if (boss) {
      refs.bossWrap.classList.remove('hidden');
      refs.bossHpText.textContent = `${Math.ceil(boss.hp)} / ${Math.round(boss.maxHp)}`;
      refs.bossFill.style.width = `${clamp((boss.hp / boss.maxHp) * 100, 0, 100)}%`;
    } else refs.bossWrap.classList.add('hidden');
    refs.drawerFish.textContent = formatNumber(state.fish);
    UI_READY_REFRESH();
  };

  const resize = () => {
    W = window.innerWidth;
    H = window.innerHeight;
    DPR = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    cam.scale = clamp(Math.min(W / 780, H / 940), 0.36, 1.2);
    cam.x = W / 2;
    cam.y = H * 0.455;
    const bg = ctx.createRadialGradient(W * 0.5, H * 0.46, 30, W * 0.5, H * 0.46, Math.max(W, H) * 0.8);
    bg.addColorStop(0, '#0a3545');
    bg.addColorStop(0.42, '#072431');
    bg.addColorStop(1, '#03131c');
    backgroundGradient = bg;
  };

  const worldToScreen = (x, y) => ({ x: cam.x + x * cam.scale, y: cam.y + y * cam.scale });
  const screenToWorld = (x, y) => ({ x: (x - cam.x) / cam.scale, y: (y - cam.y) / cam.scale });

  const drawBackground = t => {
    ctx.fillStyle = backgroundGradient;
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const aurora1 = ctx.createLinearGradient(0, 0, W, H * 0.58);
    aurora1.addColorStop(0, 'rgba(25, 91, 117, 0)');
    aurora1.addColorStop(0.35, 'rgba(45, 219, 191, 0.04)');
    aurora1.addColorStop(0.6, 'rgba(153, 94, 255, 0.03)');
    aurora1.addColorStop(1, 'rgba(25, 91, 117, 0)');
    ctx.fillStyle = aurora1;
    ctx.fillRect(0, 0, W, H * 0.65);
    const glowX = W * 0.52 + Math.sin(t * 0.08) * W * 0.14;
    const glowY = H * 0.18 + Math.cos(t * 0.05) * H * 0.03;
    const aurora2 = ctx.createRadialGradient(glowX, glowY, 0, glowX, glowY, Math.max(W, H) * 0.42);
    aurora2.addColorStop(0, 'rgba(100, 255, 215, 0.09)');
    aurora2.addColorStop(0.45, 'rgba(82, 193, 255, 0.035)');
    aurora2.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = aurora2;
    ctx.fillRect(0, 0, W, H * 0.7);
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = 'rgba(118, 219, 236, 0.035)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 11; i++) {
      const y = ((t * 7 + i * 137) % (H + 240)) - 120;
      ctx.beginPath();
      for (let x = -40; x <= W + 40; x += 30) {
        const yy = y + Math.sin(x * 0.008 + t * 0.34 + i * 0.7) * (7 + (i % 3) * 4);
        if (x === -40) ctx.moveTo(x, yy);
        else ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(157, 240, 255, 0.05)';
    for (let i = 0; i < 7; i++) {
      const y = ((t * 4 + i * 211 + 88) % (H + 200)) - 100;
      ctx.beginPath();
      for (let x = -40; x <= W + 40; x += 40) {
        const yy = y + Math.sin(x * 0.012 - t * 0.21 + i) * 12;
        if (x === -40) ctx.moveTo(x, yy);
        else ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }
    ctx.restore();

    const halo = ctx.createRadialGradient(cam.x, cam.y, 20, cam.x, cam.y, 460 * cam.scale);
    halo.addColorStop(0, 'rgba(75, 198, 224, 0.11)');
    halo.addColorStop(0.6, 'rgba(36, 117, 146, 0.045)');
    halo.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, W, H);

    for (const s of stars) {
      const y = (s.y * H + t * s.speed * 4) % H;
      ctx.globalAlpha = s.alpha * (0.55 + Math.sin(t * s.speed + s.x * 10) * 0.45);
      ctx.fillStyle = '#ccf9ff';
      ctx.fillRect(s.x * W, y, s.size, s.size);
    }
    ctx.globalAlpha = 1;
  };

  const drawFloatChunks = t => {
    for (const c of floatChunks) {
      const x = c.x + Math.sin(t * c.speed + c.drift) * 10;
      const y = c.y + Math.cos(t * c.speed * 0.7 + c.drift) * 8;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(c.rot + Math.sin(t * 0.1 + c.drift) * 0.08);
      ctx.globalAlpha = c.alpha * 2.2;
      ctx.fillStyle = 'rgba(0, 8, 13, 0.45)';
      ctx.beginPath();
      ctx.ellipse(2, 7, c.size * 1.05, c.size * 0.5, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = 'rgba(194, 242, 251, 0.42)';
      ctx.beginPath();
      ctx.moveTo(-c.size, 0);
      ctx.lineTo(-c.size * 0.4, -c.size * 0.55);
      ctx.lineTo(c.size * 0.5, -c.size * 0.32);
      ctx.lineTo(c.size, c.size * 0.12);
      ctx.lineTo(c.size * 0.15, c.size * 0.42);
      ctx.lineTo(-c.size * 0.72, c.size * 0.3);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(230, 253, 255, 0.3)';
      ctx.lineWidth = 0.8;
      ctx.stroke();
      ctx.restore();
    }
  };

  const drawIsland = t => {
    const damage = 1 - state.floe.hp / state.floe.maxHp;
    ctx.save();
    ctx.translate(0, 17);
    ctx.fillStyle = 'rgba(0, 8, 13, 0.16)';
    ctx.fill(islandPaths.foam);
    ctx.translate(0, 5);
    ctx.fillStyle = 'rgba(0, 8, 13, 0.15)';
    ctx.fill(islandPaths.rim);
    ctx.restore();

    ctx.save();
    ctx.fillStyle = 'rgba(168, 239, 252, 0.09)';
    ctx.fill(islandPaths.foam);
    ctx.strokeStyle = 'rgba(165, 243, 255, 0.22)';
    ctx.lineWidth = 5;
    ctx.stroke(islandPaths.foam);
    ctx.restore();

    const baseGradient = ctx.createRadialGradient(-60, -90, 18, 0, 0, 320);
    baseGradient.addColorStop(0, '#e7fbff');
    baseGradient.addColorStop(0.28, '#c6eff7');
    baseGradient.addColorStop(0.7, '#79c9dc');
    baseGradient.addColorStop(1, '#3d93ab');
    ctx.fillStyle = baseGradient;
    ctx.fill(islandPaths.main);

    ctx.save();
    ctx.clip(islandPaths.main);
    for (const patch of snowPatches) {
      ctx.save();
      ctx.translate(patch.x + Math.sin(t * 0.1 + patch.rot) * 1.2, patch.y);
      ctx.rotate(patch.rot);
      ctx.globalAlpha = patch.alpha;
      ctx.fillStyle = '#f4feff';
      ctx.beginPath();
      ctx.ellipse(0, 0, patch.rx, patch.ry, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    ctx.strokeStyle = `rgba(20, 77, 97, ${0.12 + damage * 0.27})`;
    ctx.lineCap = 'round';
    for (let i = 0; i < cracks.length; i++) {
      if (i > 7 && damage < (i - 7) / 8) continue;
      const points = cracks[i];
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let j = 1; j < points.length; j++) ctx.lineTo(points[j].x, points[j].y);
      ctx.lineWidth = 1 + (i % 3) * 0.7 + damage * 1.2;
      ctx.stroke();
    }
    const shine = ctx.createLinearGradient(-200, -220, 200, 200);
    shine.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
    shine.addColorStop(0.45, 'rgba(255, 255, 255, 0.03)');
    shine.addColorStop(1, 'rgba(10, 66, 85, 0.1)');
    ctx.fillStyle = shine;
    ctx.fillRect(-330, -330, 660, 660);
    if (damage > 0.45) {
      ctx.fillStyle = `rgba(10, 45, 64, ${(damage - 0.45) * 0.18})`;
      ctx.fillRect(-330, -330, 660, 660);
    }
    ctx.restore();

    ctx.strokeStyle = 'rgba(223, 253, 255, 0.62)';
    ctx.lineWidth = 2.2;
    ctx.stroke(islandPaths.main);
    ctx.strokeStyle = 'rgba(159, 242, 255, 0.18)';
    ctx.lineWidth = 8;
    ctx.stroke(islandPaths.rim);

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.strokeStyle = `rgba(125, 255, 210, ${0.08 + Math.sin(t * 1.3) * 0.02})`;
    ctx.lineWidth = 1.4;
    ctx.setLineDash([2, 13]);
    ctx.stroke(islandPaths.inner);
    ctx.restore();

    if (state.flash > 0) {
      ctx.save();
      ctx.globalAlpha = state.flash * 0.32;
      ctx.fillStyle = '#c8fbff';
      ctx.fill(islandPaths.main);
      ctx.restore();
    }
  };

  const drawPlacementZone = t => {
    if (!state.placement) return;
    ctx.save();
    if (state.placement.kind === 'turret') {
      ctx.fillStyle = 'rgba(111, 239, 255, 0.055)';
      ctx.fill(islandPaths.main);
      ctx.strokeStyle = 'rgba(150, 246, 255, 0.65)';
      ctx.lineWidth = 2;
      ctx.setLineDash([9, 12]);
      ctx.lineDashOffset = -t * 22;
      ctx.stroke(islandPaths.rim);
    } else {
      const zone = new Path2D();
      zone.addPath(islandPaths.trapOuter);
      zone.addPath(islandPaths.trapInner);
      ctx.fillStyle = 'rgba(121, 255, 216, 0.065)';
      ctx.fill(zone, 'evenodd');
      ctx.strokeStyle = 'rgba(145, 255, 226, 0.32)';
      ctx.lineWidth = 1.4;
      ctx.setLineDash([6, 11]);
      ctx.lineDashOffset = -t * 18;
      ctx.stroke(islandPaths.trapOuter);
      ctx.strokeStyle = 'rgba(145, 255, 226, 0.22)';
      ctx.stroke(islandPaths.trapInner);
    }
    ctx.restore();
  };

  const drawTurretBody = (c, turret, time, icon = false) => {
    const def = turret.def;
    const level = turret.level || 1;
    c.save();
    if (!icon) {
      c.translate(0, 9);
      c.fillStyle = 'rgba(0, 8, 13, 0.32)';
      c.beginPath();
      c.ellipse(0, 0, 24, 11, 0, 0, TAU);
      c.fill();
      c.translate(0, -9);
    }
    const glow = c.createRadialGradient(0, 0, 1, 0, 0, 26);
    glow.addColorStop(0, def.color + '55');
    glow.addColorStop(1, def.color + '00');
    c.fillStyle = glow;
    c.beginPath();
    c.arc(0, 0, 29, 0, TAU);
    c.fill();
    c.fillStyle = '#dffaff';
    c.strokeStyle = def.color;
    c.lineWidth = 1.2;
    c.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU + Math.PI / 8;
      const x = Math.cos(a) * 18;
      const y = Math.sin(a) * 18;
      if (i === 0) c.moveTo(x, y);
      else c.lineTo(x, y);
    }
    c.closePath();
    c.fill();
    c.stroke();
    c.fillStyle = 'rgba(24, 85, 105, 0.85)';
    c.beginPath();
    c.arc(0, 0, 13, 0, TAU);
    c.fill();
    c.strokeStyle = def.color + 'aa';
    c.lineWidth = 1;
    c.stroke();
    c.save();
    c.rotate(turret.angle || 0);
    if (def.id === 'harpoon') {
      c.fillStyle = '#2a6072';
      c.fillRect(-3, -4, 21, 8);
      c.strokeStyle = def.color;
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(-7, -9);
      c.quadraticCurveTo(2, 0, -7, 9);
      c.stroke();
      c.strokeStyle = '#e7fdff';
      c.lineWidth = 1.4;
      c.beginPath();
      c.moveTo(13, 0);
      c.lineTo(26, 0);
      c.stroke();
      c.fillStyle = def.color;
      c.beginPath();
      c.moveTo(28, 0);
      c.lineTo(21, -4);
      c.lineTo(21, 4);
      c.closePath();
      c.fill();
    } else if (def.id === 'cannon') {
      c.fillStyle = '#5d828c';
      c.beginPath();
      c.arc(0, 0, 10, 0, TAU);
      c.fill();
      c.fillStyle = '#243f48';
      c.fillRect(-2, -5, 24, 10);
      c.strokeStyle = def.color;
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(12, -5);
      c.lineTo(12, 5);
      c.stroke();
      c.fillStyle = def.color;
      c.fillRect(22, -6, 4, 12);
    } else if (def.id === 'frost') {
      c.fillStyle = '#2c7486';
      c.beginPath();
      c.arc(0, 0, 9, 0, TAU);
      c.fill();
      c.strokeStyle = '#dffbff';
      c.fillStyle = def.color;
      c.beginPath();
      c.moveTo(0, -4);
      c.lineTo(8, -8);
      c.lineTo(22, 0);
      c.lineTo(8, 8);
      c.lineTo(0, 4);
      c.closePath();
      c.fill();
      c.stroke();
      c.fillStyle = '#ffffff';
      c.beginPath();
      c.moveTo(10, -3);
      c.lineTo(16, 0);
      c.lineTo(10, 3);
      c.closePath();
      c.fill();
    } else if (def.id === 'tesla') {
      c.fillStyle = '#473268';
      c.beginPath();
      c.arc(0, 0, 10, 0, TAU);
      c.fill();
      c.strokeStyle = def.color;
      c.lineWidth = 2.2;
      for (let r = 4; r <= 12; r += 4) {
        c.beginPath();
        c.arc(0, 0, r, 0, TAU);
        c.stroke();
      }
      c.strokeStyle = '#f3eaff';
      c.lineWidth = 1.2;
      c.beginPath();
      c.moveTo(-4, 0);
      c.lineTo(0, -9);
      c.lineTo(3, -1);
      c.lineTo(8, -7);
      c.stroke();
    } else if (def.id === 'mortar') {
      c.fillStyle = '#5a4037';
      c.beginPath();
      c.arc(0, 0, 11, 0, TAU);
      c.fill();
      c.fillStyle = '#2d2524';
      c.save();
      c.rotate(-0.35);
      c.fillRect(1, -6, 18, 12);
      c.restore();
      c.strokeStyle = def.color;
      c.lineWidth = 2;
      c.beginPath();
      c.arc(0, 0, 14, -0.9, 1.4);
      c.stroke();
    } else if (def.id === 'sniper') {
      c.fillStyle = '#334f55';
      c.beginPath();
      c.arc(0, 0, 9, 0, TAU);
      c.fill();
      c.fillStyle = '#1b343c';
      c.fillRect(-1, -2.5, 32, 5);
      c.strokeStyle = def.color;
      c.lineWidth = 1.5;
      c.beginPath();
      c.moveTo(31, 0);
      c.lineTo(37, 0);
      c.stroke();
      c.fillStyle = def.color;
      c.beginPath();
      c.arc(3, -7, 3, 0, TAU);
      c.fill();
    } else if (def.id === 'bubble') {
      c.fillStyle = '#1e5962';
      c.beginPath();
      c.arc(0, 0, 10, 0, TAU);
      c.fill();
      c.fillStyle = 'rgba(226, 255, 255, 0.8)';
      for (let i = 0; i < 3; i++) {
        c.beginPath();
        c.arc(9 + i * 6, (i - 1) * 4, 3.5 - i * 0.5, 0, TAU);
        c.fill();
      }
      c.strokeStyle = def.color;
      c.lineWidth = 2;
      c.beginPath();
      c.arc(0, 0, 13, 0, TAU);
      c.stroke();
    } else if (def.id === 'flame') {
      c.fillStyle = '#5b3932';
      c.fillRect(-7, -8, 10, 16);
      c.fillStyle = '#2e2727';
      c.fillRect(2, -3.5, 18, 7);
      c.fillStyle = def.color;
      c.beginPath();
      c.arc(-26, 0, 3.5, 0, TAU);
      c.fill();
      c.strokeStyle = '#ffd66b';
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(19, -4);
      c.quadraticCurveTo(24, 0, 19, 4);
      c.stroke();
    } else if (def.id === 'chakram') {
      c.strokeStyle = def.color;
      c.lineWidth = 2;
      c.beginPath();
      c.arc(7, 0, 10, 0, TAU);
      c.stroke();
      c.strokeStyle = '#eafff0';
      c.lineWidth = 1.4;
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * TAU + (turret.angle || 0) * 2;
        c.beginPath();
        c.moveTo(7 + Math.cos(a) * 8, Math.sin(a) * 8);
        c.lineTo(7 + Math.cos(a) * 15, Math.sin(a) * 15);
        c.stroke();
      }
      c.fillStyle = def.color;
      c.beginPath();
      c.arc(7, 0, 4, 0, TAU);
      c.fill();
    } else if (def.id === 'repair') {
      c.fillStyle = '#235c4d';
      c.fillRect(-4, -20, 8, 24);
      c.fillStyle = def.color;
      c.beginPath();
      c.arc(0, -22, 6, 0, TAU);
      c.fill();
      c.strokeStyle = '#dffdf0';
      c.lineWidth = 1.4;
      c.beginPath();
      c.moveTo(-9, -12);
      c.lineTo(9, -12);
      c.stroke();
      c.fillStyle = 'rgba(125, 255, 209, 0.28)';
      c.beginPath();
      c.arc(0, 0, 24 + Math.sin(time * 2) * 2, 0, TAU);
      c.fill();
    } else if (def.id === 'beacon') {
      c.fillStyle = '#4d3356';
      c.fillRect(-4, -4, 8, 20);
      c.strokeStyle = def.color;
      c.lineWidth = 1.5;
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(-8, -12);
      c.lineTo(0, -22);
      c.lineTo(8, -12);
      c.closePath();
      c.stroke();
      c.fillStyle = def.color;
      c.beginPath();
      c.arc(0, -13, 4, 0, TAU);
      c.fill();
      c.strokeStyle = def.color + '88';
      c.lineWidth = 1;
      c.beginPath();
      c.arc(0, -13, 9 + Math.sin(time * 2) * 2, 0, TAU);
      c.stroke();
    }
    c.restore();
    if (!icon && level > 1) {
      c.fillStyle = def.color;
      for (let i = 0; i < level - 1; i++) {
        c.beginPath();
        c.arc(-8 + i * 5, 20, 1.7, 0, TAU);
        c.fill();
      }
    }
    c.restore();
  };

  const drawTrapBody = (c, trap, time, icon = false) => {
    const def = trap.def;
    c.save();
    if (!icon) {
      c.translate(0, 6);
      c.fillStyle = 'rgba(0, 8, 13, 0.26)';
      c.beginPath();
      c.ellipse(0, 0, 22, 9, 0, 0, TAU);
      c.fill();
      c.translate(0, -6);
    }
    c.strokeStyle = def.color + '88';
    c.lineWidth = 1.2;
    c.fillStyle = 'rgba(7, 48, 61, 0.4)';
    c.beginPath();
    c.arc(0, 0, 18, 0, TAU);
    c.fill();
    c.stroke();
    c.strokeStyle = def.color + '33';
    c.setLineDash([3, 5]);
    c.beginPath();
    c.arc(0, 0, 23 + Math.sin(time * 2 + trap.pulse) * 2, 0, TAU);
    c.stroke();
    c.setLineDash([]);
    if (def.id === 'mine') {
      c.fillStyle = '#173c4b';
      c.beginPath();
      c.arc(0, 0, 10, 0, TAU);
      c.fill();
      c.strokeStyle = def.color;
      c.lineWidth = 1.5;
      c.stroke();
      c.strokeStyle = '#9df7ff';
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TAU;
        c.beginPath();
        c.moveTo(Math.cos(a) * 8, Math.sin(a) * 8);
        c.lineTo(Math.cos(a) * 14, Math.sin(a) * 14);
        c.stroke();
      }
      c.fillStyle = '#ff7369';
      c.beginPath();
      c.arc(0, 0, 3 + Math.sin(time * 5) * 1.2, 0, TAU);
      c.fill();
    } else if (def.id === 'net') {
      c.strokeStyle = def.color;
      c.lineWidth = 1.1;
      for (let i = -14; i <= 14; i += 7) {
        c.beginPath();
        c.moveTo(i, -14);
        c.lineTo(i, 14);
        c.stroke();
        c.beginPath();
        c.moveTo(-14, i);
        c.lineTo(14, i);
        c.stroke();
      }
      c.strokeStyle = '#e9feff';
      c.lineWidth = 1.5;
      c.beginPath();
      c.arc(0, 0, 16, 0, TAU);
      c.stroke();
    } else if (def.id === 'decoy') {
      c.fillStyle = '#ff9c8d';
      c.beginPath();
      c.ellipse(0, 0, 11, 6, 0.2, 0, TAU);
      c.fill();
      c.beginPath();
      c.moveTo(-10, -1);
      c.lineTo(-17, -7);
      c.lineTo(-16, 5);
      c.closePath();
      c.fill();
      c.fillStyle = '#fff3ef';
      c.beginPath();
      c.arc(6, -2, 1.5, 0, TAU);
      c.fill();
      c.strokeStyle = '#ffd2c8';
      c.lineWidth = 1.3;
      c.beginPath();
      c.moveTo(0, -7);
      c.lineTo(0, -16);
      c.stroke();
      c.fillStyle = '#ffd2c8';
      c.beginPath();
      c.arc(0, -17, 2.5, 0, TAU);
      c.fill();
      c.globalAlpha = 0.22;
      c.fillStyle = def.color;
      c.beginPath();
      c.arc(0, 0, 20 + Math.sin(time * 2) * 3, 0, TAU);
      c.fill();
    } else if (def.id === 'kelp') {
      c.strokeStyle = def.color;
      c.lineWidth = 2.2;
      c.lineCap = 'round';
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * TAU;
        c.beginPath();
        c.moveTo(0, 0);
        c.quadraticCurveTo(Math.cos(a) * 9, Math.sin(a) * 9, Math.cos(a + Math.sin(time * 3 + i) * 0.2) * (17 + i % 2 * 4), Math.sin(a + Math.sin(time * 3 + i) * 0.2) * (17 + i % 2 * 4));
        c.stroke();
      }
      c.fillStyle = '#caffdf';
      c.beginPath();
      c.arc(0, 0, 2.6, 0, TAU);
      c.fill();
    } else if (def.id === 'oil') {
      c.fillStyle = 'rgba(34, 20, 50, 0.8)';
      c.beginPath();
      c.ellipse(0, 0, 17, 12, 0.4, 0, TAU);
      c.fill();
      c.strokeStyle = def.color;
      c.lineWidth = 1.4;
      c.beginPath();
      c.ellipse(0, 0, 17, 12, 0.4, 0, TAU);
      c.stroke();
      c.strokeStyle = '#ffcf9a';
      c.lineWidth = 1;
      c.beginPath();
      c.arc(-4, 1, 6, Math.PI * 0.2, Math.PI * 1.2);
      c.stroke();
    } else if (def.id === 'harpoonTrap') {
      c.strokeStyle = def.color;
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(-12, 10);
      c.lineTo(12, -10);
      c.stroke();
      c.fillStyle = def.color;
      c.beginPath();
      c.moveTo(16, -14);
      c.lineTo(8, -12);
      c.lineTo(12, -6);
      c.closePath();
      c.fill();
      c.strokeStyle = '#fff7dd';
      c.lineWidth = 1.2;
      c.beginPath();
      c.moveTo(-12, 10);
      c.quadraticCurveTo(0, 20, 12, -8);
      c.stroke();
    } else if (def.id === 'bubbleTrap') {
      c.strokeStyle = def.color;
      c.lineWidth = 1.2;
      for (let i = 0; i < 5; i++) {
        const a = i * 1.9;
        const r = 3 + (i % 3) * 2;
        c.beginPath();
        c.arc(Math.cos(a) * (4 + i * 2.4), Math.sin(a) * (4 + i * 2.4), r + Math.sin(time * 3 + i) * 0.5, 0, TAU);
        c.stroke();
      }
    }
    if (!icon && trap.cool > 0) {
      c.strokeStyle = 'rgba(255, 255, 255, 0.18)';
      c.lineWidth = 2;
      c.beginPath();
      c.arc(0, 0, 20, -Math.PI / 2, -Math.PI / 2 + TAU * (1 - trap.cool / def.cooldown));
      c.stroke();
    }
    c.restore();
  };

  const drawUpgradeIcon = (c, id, color, size) => {
    c.save();
    c.strokeStyle = color;
    c.fillStyle = color;
    c.lineWidth = 2;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.shadowColor = color;
    c.shadowBlur = 9;
    const s = size;
    if (id === 'reinforce' || id === 'armor') {
      c.beginPath();
      c.moveTo(0, -s * 0.55);
      c.lineTo(s * 0.48, -s * 0.3);
      c.lineTo(s * 0.38, s * 0.28);
      c.lineTo(0, s * 0.6);
      c.lineTo(-s * 0.38, s * 0.28);
      c.lineTo(-s * 0.48, -s * 0.3);
      c.closePath();
      c.globalAlpha = 0.28;
      c.fill();
      c.globalAlpha = 1;
      c.stroke();
      if (id === 'reinforce') {
        c.beginPath();
        c.moveTo(-s * 0.16, 0);
        c.lineTo(s * 0.16, 0);
        c.moveTo(0, -s * 0.16);
        c.lineTo(0, s * 0.16);
        c.stroke();
      } else {
        c.beginPath();
        c.arc(0, 0, s * 0.22, 0.4, Math.PI * 1.9);
        c.stroke();
      }
    } else if (id === 'regen') {
      c.beginPath();
      c.arc(0, 0, s * 0.38, 0.5, Math.PI * 2.2);
      c.stroke();
      c.beginPath();
      c.moveTo(-s * 0.44, s * 0.02);
      c.lineTo(-s * 0.3, -s * 0.25);
      c.lineTo(-s * 0.58, -s * 0.18);
      c.stroke();
      c.beginPath();
      c.moveTo(0, -s * 0.16);
      c.lineTo(0, s * 0.18);
      c.moveTo(-s * 0.17, s * 0.01);
      c.lineTo(s * 0.17, s * 0.01);
      c.stroke();
    } else if (id === 'spikes') {
      c.beginPath();
      for (let i = 0; i < 7; i++) {
        const a = -Math.PI / 2 + (i / 7) * TAU;
        c.moveTo(Math.cos(a - 0.12) * s * 0.24, Math.sin(a - 0.12) * s * 0.24);
        c.lineTo(Math.cos(a) * s * 0.56, Math.sin(a) * s * 0.56);
        c.lineTo(Math.cos(a + 0.12) * s * 0.24, Math.sin(a + 0.12) * s * 0.24);
      }
      c.stroke();
    } else if (id === 'watchtower') {
      c.beginPath();
      c.moveTo(0, s * 0.48);
      c.lineTo(0, -s * 0.05);
      c.stroke();
      c.beginPath();
      c.arc(0, -s * 0.17, s * 0.22, Math.PI, TAU);
      c.stroke();
      c.beginPath();
      c.arc(0, -s * 0.02, s * 0.12, Math.PI, TAU);
      c.stroke();
      c.fillStyle = color;
      c.beginPath();
      c.arc(0, -s * 0.36, s * 0.07, 0, TAU);
      c.fill();
    } else if (id === 'drones') {
      c.beginPath();
      c.arc(0, 0, s * 0.19, 0, TAU);
      c.stroke();
      c.beginPath();
      c.moveTo(-s * 0.44, -s * 0.26);
      c.lineTo(-s * 0.15, -s * 0.1);
      c.moveTo(s * 0.44, -s * 0.26);
      c.lineTo(s * 0.15, -s * 0.1);
      c.moveTo(-s * 0.44, s * 0.26);
      c.lineTo(-s * 0.15, s * 0.1);
      c.moveTo(s * 0.44, s * 0.26);
      c.lineTo(s * 0.15, s * 0.1);
      c.stroke();
      c.beginPath();
      c.arc(-s * 0.46, -s * 0.28, s * 0.1, 0, TAU);
      c.arc(s * 0.46, -s * 0.28, s * 0.1, 0, TAU);
      c.arc(-s * 0.46, s * 0.28, s * 0.1, 0, TAU);
      c.arc(s * 0.46, s * 0.28, s * 0.1, 0, TAU);
      c.stroke();
    } else if (id === 'resonance' || id === 'beacon') {
      for (let i = 1; i <= 3; i++) {
        c.globalAlpha = 1 - i * 0.2;
        c.beginPath();
        c.arc(0, 0, s * (0.16 + i * 0.14), 0, TAU);
        c.stroke();
      }
      c.globalAlpha = 1;
      c.beginPath();
      c.arc(0, 0, s * 0.1, 0, TAU);
      c.fill();
    } else if (id === 'blubber') {
      c.beginPath();
      c.moveTo(0, s * 0.46);
      c.bezierCurveTo(-s * 0.62, s * 0.02, -s * 0.34, -s * 0.44, 0, -s * 0.16);
      c.bezierCurveTo(s * 0.34, -s * 0.44, s * 0.62, s * 0.02, 0, s * 0.46);
      c.globalAlpha = 0.25;
      c.fill();
      c.globalAlpha = 1;
      c.stroke();
    } else if (id === 'speed') {
      c.beginPath();
      c.moveTo(-s * 0.4, -s * 0.34);
      c.lineTo(-s * 0.05, 0);
      c.lineTo(-s * 0.4, s * 0.34);
      c.moveTo(s * 0.02, -s * 0.34);
      c.lineTo(s * 0.37, 0);
      c.lineTo(s * 0.02, s * 0.34);
      c.stroke();
    } else if (id === 'slap') {
      c.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * TAU;
        const r = i % 2 === 0 ? s * 0.52 : s * 0.2;
        if (i === 0) c.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else c.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      c.closePath();
      c.globalAlpha = 0.25;
      c.fill();
      c.globalAlpha = 1;
      c.stroke();
    } else if (id === 'magnet') {
      c.lineWidth = s * 0.15;
      c.beginPath();
      c.arc(0, -s * 0.02, s * 0.32, 0, Math.PI);
      c.stroke();
      c.beginPath();
      c.moveTo(-s * 0.32, -s * 0.02);
      c.lineTo(-s * 0.32, -s * 0.38);
      c.moveTo(s * 0.32, -s * 0.02);
      c.lineTo(s * 0.32, -s * 0.38);
      c.stroke();
      c.fillStyle = color;
      c.fillRect(-s * 0.39, -s * 0.5, s * 0.14, s * 0.16);
      c.fillRect(s * 0.25, -s * 0.5, s * 0.14, s * 0.16);
    } else if (id === 'dashCd') {
      c.beginPath();
      c.arc(0, 0, s * 0.4, -Math.PI * 0.7, Math.PI * 1.2);
      c.stroke();
      c.beginPath();
      c.moveTo(s * 0.46, -s * 0.2);
      c.lineTo(s * 0.36, -s * 0.48);
      c.lineTo(s * 0.18, -s * 0.26);
      c.stroke();
      c.beginPath();
      c.moveTo(0, -s * 0.16);
      c.lineTo(0, s * 0.06);
      c.lineTo(s * 0.16, s * 0.16);
      c.stroke();
    } else if (id === 'snowball') {
      c.beginPath();
      c.arc(0, 0, s * 0.3, 0, TAU);
      c.globalAlpha = 0.2;
      c.fill();
      c.globalAlpha = 1;
      c.stroke();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * TAU;
        c.beginPath();
        c.moveTo(Math.cos(a) * s * 0.3, Math.sin(a) * s * 0.3);
        c.lineTo(Math.cos(a) * s * 0.52, Math.sin(a) * s * 0.52);
        c.stroke();
      }
    } else {
      c.beginPath();
      c.arc(0, 0, s * 0.38, 0, TAU);
      c.stroke();
    }
    c.restore();
  };

  const drawSeal = t => {
    const s = state.seal;
    const bob = Math.sin(t * 4) * 1.5;
    const flicker = s.invuln > 0 && Math.floor(t * 20) % 2 === 0;
    ctx.save();
    ctx.translate(s.x, s.y + 15);
    ctx.fillStyle = 'rgba(0, 8, 13, 0.3)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 29, 11, 0, 0, TAU);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(s.x, s.y + bob);
    ctx.globalAlpha = flicker ? 0.55 : 1;
    if (s.knocked) {
      ctx.rotate(Math.sin(t * 8) * 0.18);
      ctx.translate(0, 10);
    }
    ctx.rotate(s.facing);
    ctx.strokeStyle = 'rgba(140, 236, 255, 0.5)';
    ctx.lineWidth = 1.4;
    ctx.setLineDash([5, 8]);
    ctx.beginPath();
    ctx.arc(0, 0, 33, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = s.hurtTimer > 0 ? '#ffd4cd' : '#a9c5d0';
    ctx.strokeStyle = '#dffaff';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(-5, 0, 26, 16, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = s.hurtTimer > 0 ? '#ffe8e2' : '#d7e9ee';
    ctx.beginPath();
    ctx.ellipse(-8, 3, 18, 9, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#8faeb9';
    ctx.beginPath();
    ctx.moveTo(-26, -4);
    ctx.lineTo(-40, -15);
    ctx.lineTo(-35, 0);
    ctx.lineTo(-42, 12);
    ctx.lineTo(-25, 7);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#708e9b';
    ctx.beginPath();
    ctx.ellipse(-9, -14, 11, 4, -0.6, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-9, 14, 11, 4, 0.6, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#e2f3f6';
    ctx.strokeStyle = '#c7e1e8';
    ctx.beginPath();
    ctx.ellipse(17, 0, 15, 11, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ff7369';
    ctx.beginPath();
    ctx.ellipse(8, 0, 7, 8, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#d94c52';
    ctx.beginPath();
    ctx.moveTo(3, -2);
    ctx.lineTo(-14, -10 - Math.sin(t * 5) * 2);
    ctx.lineTo(-11, -1);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#102a33';
    ctx.beginPath();
    ctx.arc(23, -4, 2, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#283d45';
    ctx.beginPath();
    ctx.ellipse(30, 1, 2.8, 2, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(40, 61, 69, 0.65)';
    ctx.lineWidth = 0.7;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(30, 2 + i * 1.5);
      ctx.lineTo(40, 2 + i * 5);
      ctx.stroke();
    }
    if (s.dashTimer > 0) {
      ctx.strokeStyle = 'rgba(191, 248, 255, 0.5)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(-35 - i * 9, -4 + i * 4);
        ctx.lineTo(-58 - i * 9, -4 + i * 4);
        ctx.stroke();
      }
    }
    ctx.restore();

    if (s.knocked) {
      ctx.save();
      ctx.translate(s.x, s.y - 30);
      ctx.fillStyle = '#ffd166';
      for (let i = 0; i < 4; i++) {
        const a = t * 3 + (i / 4) * TAU;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * 12, Math.sin(a) * 5, 1.5, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }
  };

  const drawOrca = (e, t) => {
    const size = e.size;
    const scale = size;
    ctx.save();
    ctx.translate(e.x, e.y + 11 * size);
    ctx.fillStyle = 'rgba(0, 8, 13, 0.3)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 34 * size, 14 * size, 0, 0, TAU);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(e.x, e.y - (e.z || 0));
    ctx.rotate(e.angle);
    ctx.scale(scale, scale);
    if (e.dead) ctx.globalAlpha = clamp(e.dying / 0.5, 0, 1);
    if (e.state === 'swim' || e.state === 'chomp') {
      ctx.strokeStyle = 'rgba(177, 242, 255, 0.2)';
      ctx.lineWidth = 1.8;
      for (let i = 0; i < 2; i++) {
        ctx.beginPath();
        ctx.arc(-25 - i * 7, 0, 12 + i * 7 + Math.sin(t * 2 + e.phase) * 2, -1.25, 1.25);
        ctx.stroke();
      }
    }
    if (e.flash > 0) {
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 18;
    }
    ctx.fillStyle = e.flash > 0 ? '#7a9aa3' : '#121f27';
    ctx.strokeStyle = e.hunter ? '#ff8a7a' : 'rgba(147, 229, 244, 0.45)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(0, 0, 31, 15, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = e.flash > 0 ? '#dffbff' : '#eefcff';
    ctx.beginPath();
    ctx.ellipse(12, 5, 12, 4, 0.12, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-29, -2);
    ctx.lineTo(-43, -15);
    ctx.lineTo(-35, 1);
    ctx.lineTo(-44, 15);
    ctx.lineTo(-26, 8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#0d171d';
    ctx.beginPath();
    ctx.moveTo(-6, -5);
    ctx.quadraticCurveTo(-2, -27, 12, -8);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = e.hunter ? '#ff7369' : '#6f929e';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#eefcff';
    ctx.beginPath();
    ctx.ellipse(15, -7, 7, 3.2, -0.3, 0, TAU);
    ctx.fill();
    ctx.fillStyle = e.hunter ? '#ff5f5f' : '#092028';
    ctx.beginPath();
    ctx.arc(20, -8, 1.7, 0, TAU);
    ctx.fill();
    if (e.hunter) {
      ctx.strokeStyle = 'rgba(255, 99, 99, 0.65)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(17, -12);
      ctx.lineTo(23, -4);
      ctx.moveTo(23, -12);
      ctx.lineTo(17, -4);
      ctx.stroke();
    }
    if (e.boss) {
      ctx.strokeStyle = 'rgba(255, 115, 105, 0.45)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 42, 0, TAU);
      ctx.stroke();
    }
    if (e.state === 'chomp') {
      const lunge = Math.max(0, Math.sin((e.attackInterval - e.attackTimer) * 9));
      ctx.translate(lunge * 8, 0);
    }
    if (e.stun > 0) {
      ctx.fillStyle = '#ffd166';
      for (let i = 0; i < 3; i++) {
        const a = t * 4 + i * 2.1;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * 16, -18 + Math.sin(a) * 4, 1.6, 0, TAU);
        ctx.fill();
      }
    }
    ctx.restore();

    if (!e.dead && e.hp < e.maxHp) {
      const w = 46 * size;
      const x = e.x - w / 2;
      const y = e.y - 30 * size - (e.z || 0);
      ctx.fillStyle = 'rgba(0, 10, 15, 0.7)';
      ctx.fillRect(x, y, w, 4);
      ctx.fillStyle = e.hunter ? '#ff8b7e' : '#8cecff';
      ctx.fillRect(x, y, w * clamp(e.hp / e.maxHp, 0, 1), 4);
    }
    if (e.burnTimer > 0 && Math.random() < 0.25) {
      ctx.fillStyle = 'rgba(255, 154, 91, 0.8)';
      ctx.beginPath();
      ctx.arc(e.x + rand(-12, 12), e.y + rand(-8, 8), rand(1, 3), 0, TAU);
      ctx.fill();
    }
  };

  const drawTrap = (trap, t) => {
    ctx.save();
    ctx.translate(trap.x, trap.y);
    drawTrapBody(ctx, trap, t, false);
    ctx.restore();
  };

  const drawTurrets = t => {
    const sorted = [...state.turrets].sort((a, b) => a.y - b.y);
    for (const turret of sorted) {
      ctx.save();
      ctx.translate(turret.x, turret.y);
      if (ui.inspecting === turret) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 5]);
        ctx.beginPath();
        ctx.arc(0, 0, 27, 0, TAU);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      drawTurretBody(ctx, turret, t, false);
      ctx.restore();
    }
  };

  const drawPickups = t => {
    for (const p of state.pickups) {
      const bob = Math.sin(p.phase) * 3;
      const alpha = p.age > 14 && p.age < 16 ? 0.5 + Math.sin(t * 14) * 0.4 : 1;
      ctx.save();
      ctx.translate(p.x, p.y + bob);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = 'rgba(0, 8, 13, 0.24)';
      ctx.beginPath();
      ctx.ellipse(0, 8, 10, 4, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#ffd166';
      ctx.strokeStyle = '#fff0b7';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(0, 0, 9, 4.5, -0.2, 0, TAU);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-8, 0);
      ctx.lineTo(-15, -5);
      ctx.lineTo(-14, 4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#4e3609';
      ctx.beginPath();
      ctx.arc(5, -1, 1.2, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  };

  const drawProjectiles = t => {
    for (const p of state.projectiles) {
      ctx.save();
      if (p.kind === 'mortar') {
        const t0 = 1 - p.life / p.maxLife;
        const x = lerp(p.startX, p.tx, smooth(t0));
        const y = lerp(p.startY, p.ty, smooth(t0));
        const lift = Math.sin(t0 * Math.PI) * 46;
        ctx.globalAlpha = 0.25;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(x, y, 7, 3, 0, 0, TAU);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.translate(x, y - lift);
        ctx.rotate(p.angle);
        ctx.fillStyle = '#30251f';
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.ellipse(0, 0, 7, 4, 0, 0, TAU);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#ffb36b';
        ctx.beginPath();
        ctx.arc(-5 - Math.random() * 4, 0, 2, 0, TAU);
        ctx.fill();
        ctx.restore();
        continue;
      }
      ctx.translate(p.x, p.y);
      ctx.rotate(p.kind === 'chakram' ? p.spin : p.angle);
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 10;
      if (p.kind === 'shell') {
        ctx.fillStyle = '#332a28';
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.arc(0, 0, 4.4, 0, TAU);
        ctx.fill();
        ctx.stroke();
      } else if (p.kind === 'bubble') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, 5 + Math.sin(t * 10) * 1, 0, TAU);
        ctx.stroke();
      } else if (p.kind === 'chakram') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1.7;
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, TAU);
        ctx.stroke();
        for (let i = 0; i < 4; i++) {
          const a = (i / 4) * TAU;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * 4, Math.sin(a) * 4);
          ctx.lineTo(Math.cos(a) * 10, Math.sin(a) * 10);
          ctx.stroke();
        }
      } else if (p.kind === 'snowball') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(0, 0, 4.2, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = 'rgba(140, 236, 255, 0.8)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 4; i++) {
          const a = (i / 4) * TAU;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * 4, Math.sin(a) * 4);
          ctx.lineTo(Math.cos(a) * 7, Math.sin(a) * 7);
          ctx.stroke();
        }
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, 6, 2, 0, 0, TAU);
        ctx.fill();
        ctx.globalAlpha = 0.35;
        ctx.fillRect(-16, -1, 12, 2);
      }
      ctx.restore();
    }
  };

  const drawEffects = t => {
    for (const e of state.effects) {
      const alpha = clamp(e.life / e.maxLife, 0, 1);
      ctx.save();
      ctx.globalAlpha = alpha;
      if (e.kind === 'ring') {
        const progress = 1 - e.life / e.maxLife;
        ctx.strokeStyle = e.color;
        ctx.lineWidth = e.width * (1 - progress * 0.5);
        ctx.beginPath();
        ctx.arc(e.x, e.y, lerp(e.radius, e.maxRadius, smooth(progress)), 0, TAU);
        ctx.stroke();
      } else if (e.kind === 'beam') {
        ctx.strokeStyle = e.color;
        ctx.lineWidth = e.width || 2;
        ctx.shadowColor = e.color;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(e.x1, e.y1);
        ctx.lineTo(e.x2, e.y2);
        ctx.stroke();
      } else if (e.kind === 'chain') {
        ctx.strokeStyle = e.color;
        ctx.lineWidth = 1.8;
        ctx.shadowColor = e.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        for (let i = 0; i < e.points.length - 1; i++) {
          const a = e.points[i];
          const b = e.points[i + 1];
          ctx.moveTo(a.x, a.y);
          const mx = (a.x + b.x) / 2 + rand(-8, 8);
          const my = (a.y + b.y) / 2 + rand(-8, 8);
          ctx.lineTo(mx, my);
          ctx.lineTo(b.x, b.y);
        }
        ctx.stroke();
      } else if (e.kind === 'flame') {
        ctx.translate(e.x, e.y);
        ctx.rotate(e.angle);
        const grad = ctx.createLinearGradient(0, 0, e.range, 0);
        grad.addColorStop(0, e.color);
        grad.addColorStop(0.5, 'rgba(255, 170, 62, 0.7)');
        grad.addColorStop(1, 'rgba(255, 80, 40, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(8, -8);
        ctx.quadraticCurveTo(e.range * 0.55, -32, e.range, 0);
        ctx.quadraticCurveTo(e.range * 0.55, 32, 8, 8);
        ctx.closePath();
        ctx.fill();
      } else if (e.kind === 'beacon') {
        const progress = 1 - e.life / e.maxLife;
        ctx.strokeStyle = e.color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = alpha * 0.7;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius * smooth(progress), 0, TAU);
        ctx.stroke();
      } else if (e.kind === 'net') {
        ctx.strokeStyle = e.color;
        ctx.lineWidth = 1;
        ctx.globalAlpha = alpha * 0.6;
        for (let i = -6; i <= 6; i++) {
          ctx.beginPath();
          ctx.moveTo(e.x - e.radius, e.y + i * e.radius / 6);
          ctx.lineTo(e.x + e.radius, e.y + i * e.radius / 6);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(e.x + i * e.radius / 6, e.y - e.radius);
          ctx.lineTo(e.x + i * e.radius / 6, e.y + e.radius);
          ctx.stroke();
        }
      } else if (e.kind === 'oil') {
        ctx.fillStyle = 'rgba(52, 31, 72, 0.25)';
        ctx.beginPath();
        ctx.ellipse(e.x, e.y, e.radius, e.radius * 0.62, 0.2, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = e.color;
        ctx.lineWidth = 1;
        ctx.globalAlpha = alpha * 0.4;
        ctx.stroke();
      } else if (e.kind === 'decoyPulse') {
        ctx.strokeStyle = e.color;
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
          const progress = 1 - e.life / e.maxLife;
          ctx.globalAlpha = alpha * (1 - i * 0.25);
          ctx.beginPath();
          ctx.arc(e.x, e.y, 20 + i * 14 + progress * 24, 0, TAU);
          ctx.stroke();
        }
      } else if (e.kind === 'heal') {
        ctx.fillStyle = e.color;
        ctx.globalAlpha = alpha * 0.5;
        for (let i = 0; i < 4; i++) {
          const a = t * 2 + i * 1.57;
          ctx.beginPath();
          ctx.arc(e.x + Math.cos(a) * 16, e.y - (1 - alpha) * 30 + Math.sin(a) * 8, 2, 0, TAU);
          ctx.fill();
        }
      }
      ctx.restore();
    }

    for (const p of state.particles) {
      const alpha = clamp(p.life / p.maxLife, 0, 1);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      if (p.kind === 'bubble') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, TAU);
        ctx.stroke();
      } else if (p.kind === 'chip') {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.life * 8);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.65);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }

    for (const text of state.texts) {
      const alpha = clamp(text.life / text.maxLife, 0, 1);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = text.color;
      ctx.font = `900 ${text.size}px "Trebuchet MS", sans-serif`;
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
      ctx.shadowBlur = 4;
      ctx.fillText(text.text, text.x, text.y);
      ctx.restore();
    }
  };

  const drawWarnings = () => {
    const marginX = 28;
    const marginTop = 125;
    const marginBottom = 145;
    let count = 0;
    for (const e of state.enemies) {
      if (e.dead) continue;
      const p = worldToScreen(e.x, e.y);
      if (p.x > -10 && p.x < W + 10 && p.y > marginTop && p.y < H - marginBottom) continue;
      if (count++ > 10) break;
      const x = clamp(p.x, marginX, W - marginX);
      const y = clamp(p.y, marginTop, H - marginBottom);
      const a = Math.atan2(p.y - y, p.x - x);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(a);
      ctx.globalAlpha = 0.75;
      ctx.fillStyle = e.boss ? '#ff5f5f' : e.hunter ? '#ff9b90' : '#8cecff';
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(7, 0);
      ctx.lineTo(-4, -5);
      ctx.lineTo(-2, 0);
      ctx.lineTo(-4, 5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  };

  const drawSnow = t => {
    ctx.save();
    for (let i = 0; i < 55; i++) {
      const seed = i * 37.17;
      const x = (seed * 13.7 + t * (5 + i % 6)) % (W + 60) - 30;
      const y = (seed * 29.3 + t * (11 + i % 4)) % (H + 40) - 20;
      const size = 0.6 + (i % 5) * 0.4;
      ctx.globalAlpha = 0.08 + (i % 4) * 0.03;
      ctx.fillStyle = '#e9fdff';
      ctx.beginPath();
      ctx.arc(x + Math.sin(t * 0.8 + i) * 12, y, size, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
    if (state.hitFlash > 0) {
      ctx.save();
      ctx.globalAlpha = state.hitFlash * 0.22;
      ctx.fillStyle = state.seal.hurtTimer > 0 ? '#ff5f5f' : '#c8fbff';
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
  };

  const drawWorld = t => {
    drawFloatChunks(t);
    for (const trap of state.traps) drawTrap(trap, t);
    drawIsland(t);
    drawPlacementZone(t);
    drawPickups(t);
    drawTurrets(t);
    drawSeal(t);
    const sorted = [...state.enemies].sort((a, b) => a.y - b.y);
    for (const e of sorted) drawOrca(e, t);
    drawProjectiles(t);
    drawEffects(t);
  };

  const render = t => {
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, W, H);
    drawBackground(t);
    const shakeX = state.shake ? rand(-state.shake, state.shake) : 0;
    const shakeY = state.shake ? rand(-state.shake, state.shake) : 0;
    ctx.save();
    ctx.translate(cam.x + shakeX, cam.y + shakeY);
    ctx.scale(cam.scale, cam.scale);
    drawWorld(t);
    ctx.restore();
    drawWarnings();
    drawSnow(t);
  };

  const cursor = { x: 0, y: 0, active: false };

  const drawGhost = t => {
    if (!state.placement || !cursor.active) return;
    const p = state.placement;
    const { x, y } = cursor;
    let valid = false;
    if (p.kind === 'turret') {
      valid = isOnIsland(x, y, 38) && !state.turrets.some(tu => dist(tu.x, tu.y, x, y) < 44) && dist(state.seal.x, state.seal.y, x, y) >= 26;
    } else {
      const r = Math.hypot(x, y);
      const a = Math.atan2(y, x);
      const boundary = islandRadiusAt(a);
      valid = r >= boundary + 12 && r <= boundary + 186 && !state.traps.some(tr => dist(tr.x, tr.y, x, y) < 54);
    }
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.translate(x, y);
    ctx.strokeStyle = valid ? '#7dffd2' : '#ff7369';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(0, 0, p.kind === 'turret' ? 26 : 22, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);
    if (p.kind === 'turret') drawTurretBody(ctx, { def: p.def, angle: -Math.PI / 2, level: 1 }, t, true);
    else drawTrapBody(ctx, { def: p.def, pulse: 0.8, cool: 0 }, t, true);
    ctx.restore();
  };

  const renderFrame = t => {
    if (window.__floeNoRender) return;
    const pr = window.__prof || {};
    const p0 = performance.now();
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, W, H);
    drawBackground(t);
    const p1 = performance.now();
    const shakeX = state.shake ? rand(-state.shake, state.shake) : 0;
    const shakeY = state.shake ? rand(-state.shake, state.shake) : 0;
    ctx.save();
    ctx.translate(cam.x + shakeX, cam.y + shakeY);
    ctx.scale(cam.scale, cam.scale);
    drawWorld(t);
    drawGhost(t);
    ctx.restore();
    const p2 = performance.now();
    drawWarnings();
    const p3 = performance.now();
    drawSnow(t);
    const p4 = performance.now();
    pr.bg = p1 - p0;
    pr.world = p2 - p1;
    pr.warn = p3 - p2;
    pr.snow = p4 - p3;
    pr.total = p4 - p0;
    window.__prof = pr;
  };

  const updateJoystick = e => {
    const rect = refs.joystick.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = e.clientX - cx;
    let dy = e.clientY - cy;
    const radius = rect.width * 0.32;
    const mag = Math.hypot(dx, dy);
    if (mag > radius) {
      dx = (dx / mag) * radius;
      dy = (dy / mag) * radius;
    }
    const max = rect.width * 0.32 || 1;
    input.joyX = clamp(dx / max, -1, 1);
    input.joyY = clamp(dy / max, -1, 1);
    refs.joyKnob.style.transform = `translate(${dx}px, ${dy}px)`;
    refs.joystick.classList.add('active');
  };

  const startJoystick = e => {
    if (state.mode !== 'playing' || ui.paused || ui.drawerOpen) return;
    e.preventDefault();
    input.joyPointer = e.pointerId;
    refs.joystick.setPointerCapture(e.pointerId);
    updateJoystick(e);
  };

  const moveJoystick = e => {
    if (input.joyPointer !== e.pointerId) return;
    e.preventDefault();
    updateJoystick(e);
  };

  const endJoystick = e => {
    if (input.joyPointer !== e.pointerId) return;
    input.joyPointer = null;
    input.joyX = 0;
    input.joyY = 0;
    refs.joyKnob.style.transform = 'translate(0px, 0px)';
    refs.joystick.classList.remove('active');
  };

  const onTilt = e => {
    if (!tilt.enabled) return;
    const gamma = e.gamma || 0;
    const beta = e.beta || 0;
    if (!tilt.calibrated) {
      tilt.baseGamma = gamma;
      tilt.baseBeta = beta;
      tilt.calibrated = true;
      return;
    }
    const orientation = ((screen.orientation && screen.orientation.angle) || window.orientation || 0) * Math.PI / 180;
    const dx = gamma - tilt.baseGamma;
    const dy = beta - tilt.baseBeta;
    const rx = dx * Math.cos(orientation) - dy * Math.sin(orientation);
    const ry = dx * Math.sin(orientation) + dy * Math.cos(orientation);
    const dead = 2.4;
    const range = 16;
    input.tiltX = Math.abs(rx) < dead ? 0 : clamp((rx - Math.sign(rx) * dead) / range, -1, 1);
    input.tiltY = Math.abs(ry) < dead ? 0 : clamp((ry - Math.sign(ry) * dead) / range, -1, 1);
  };

  const toggleTilt = async () => {
    if (tilt.enabled) {
      tilt.enabled = false;
      tilt.calibrated = false;
      input.tiltX = 0;
      input.tiltY = 0;
      window.removeEventListener('deviceorientation', onTilt);
      refs.tiltBtn.textContent = 'НАКЛОН: ВЫКЛ';
      showToast('Наклон отключён.', '', 1700);
      return;
    }
    if (!('DeviceOrientationEvent' in window)) {
      showToast('Датчик наклона недоступен на этом устройстве.', 'warn', 2200);
      return;
    }
    try {
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        const permission = await DeviceOrientationEvent.requestPermission();
        if (permission !== 'granted') {
          showToast('Доступ к датчику не выдан.', 'warn', 2200);
          return;
        }
      }
      tilt.calibrated = false;
      tilt.enabled = true;
      window.addEventListener('deviceorientation', onTilt);
      refs.tiltBtn.textContent = 'НАКЛОН: ВКЛ';
      showToast('Наклон включён. Держи телефон как сейчас.', 'good', 2600);
    } catch {
      showToast('Не удалось включить наклон.', 'warn', 2200);
    }
  };

  const onCanvasPointer = e => {
    if (state.mode !== 'playing' || ui.paused || ui.drawerOpen || ui.inspecting) return;
    const world = screenToWorld(e.clientX, e.clientY);
    cursor.x = world.x;
    cursor.y = world.y;
    cursor.active = true;
    if (state.placement) {
      tryPlace(world.x, world.y);
      return;
    }
    const turret = state.turrets.find(t => dist(t.x, t.y, world.x, world.y) < 27);
    if (turret) openInspect(turret);
  };

  const onCanvasMove = e => {
    if (state.mode !== 'playing') return;
    const world = screenToWorld(e.clientX, e.clientY);
    cursor.x = world.x;
    cursor.y = world.y;
    cursor.active = true;
  };

  const init = () => {
    resize();
    refs.soundBtn.textContent = audio.muted ? 'ЗВУК: ВЫКЛ' : 'ЗВУК: ВКЛ';
    refs.tiltBtn.textContent = 'НАКЛОН: ВЫКЛ';
    updateHud(true);
    renderShop();
    window.addEventListener('resize', resize);
    window.addEventListener('orientationchange', () => setTimeout(resize, 180));
    window.addEventListener('keydown', e => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
      input.keys.add(e.code);
      if (e.repeat) return;
      if (e.code === 'Space') tryDash();
      else if (e.code === 'KeyF') trySnowball();
      else if (e.code === 'KeyB') {
        if (ui.drawerOpen) closeDrawer();
        else if (state.mode === 'playing' && !ui.paused) openDrawer();
      } else if (e.code === 'Escape') {
        if (state.placement) cancelPlacement();
        else if (ui.drawerOpen) closeDrawer();
        else if (ui.inspecting) closeInspect();
        else togglePause();
      } else if (e.code === 'KeyP') togglePause();
    });
    window.addEventListener('keyup', e => input.keys.delete(e.code));
    window.addEventListener('blur', () => {
      input.keys.clear();
      input.joyX = 0;
      input.joyY = 0;
      refs.joyKnob.style.transform = 'translate(0px, 0px)';
      input.joyPointer = null;
      refs.joystick.classList.remove('active');
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && state.mode === 'playing' && !ui.paused) {
        ui.paused = true;
        refs.pauseMenu.classList.remove('hidden');
      }
    });
    canvas.addEventListener('pointerdown', onCanvasPointer);
    canvas.addEventListener('pointermove', onCanvasMove);
    canvas.addEventListener('contextmenu', e => e.preventDefault());
    refs.joystick.addEventListener('pointerdown', startJoystick);
    refs.joystick.addEventListener('pointermove', moveJoystick);
    refs.joystick.addEventListener('pointerup', endJoystick);
    refs.joystick.addEventListener('pointercancel', endJoystick);
    refs.startBtn.addEventListener('click', resetGame);
    refs.againBtn.addEventListener('click', resetGame);
    refs.toMenuBtn.addEventListener('click', goToMenu);
    refs.quitBtn.addEventListener('click', goToMenu);
    refs.restartBtn.addEventListener('click', resetGame);
    refs.pauseBtn.addEventListener('click', togglePause);
    refs.resumeBtn.addEventListener('click', togglePause);
    refs.soundBtn.addEventListener('click', () => audio.setMuted(!audio.muted));
    refs.tiltBtn.addEventListener('click', toggleTilt);
    refs.helpBtn.addEventListener('click', () => refs.helpPanel.classList.remove('hidden'));
    refs.helpClose.addEventListener('click', () => refs.helpPanel.classList.add('hidden'));
    refs.readyBtn.addEventListener('click', () => startWave(true));
    refs.cancelPlacement.addEventListener('click', cancelPlacement);
    refs.dashBtn.addEventListener('click', tryDash);
    refs.snowballBtn.addEventListener('click', trySnowball);
    refs.buildBtn.addEventListener('click', () => {
      if (state.mode !== 'playing' || ui.paused) return;
      if (ui.drawerOpen) closeDrawer();
      else openDrawer();
    });
    refs.closeDrawer.addEventListener('click', closeDrawer);
    refs.drawerBackdrop.addEventListener('click', closeDrawer);
    refs.tabs.addEventListener('click', e => {
      const tab = e.target.closest('.tab');
      if (!tab) return;
      ui.tab = tab.dataset.tab;
      renderShop();
    });
    refs.inspectClose.addEventListener('click', closeInspect);
    refs.upgradeBtn.addEventListener('click', () => upgradeTurret(ui.inspecting));
    refs.sellBtn.addEventListener('click', () => sellTurret(ui.inspecting));
    requestAnimationFrame(frame);
  };

  let lastFrame = performance.now();
  const frame = now => {
    const dt = Math.min(0.033, (now - lastFrame) / 1000);
    lastFrame = now;
    if (state.mode === 'playing') update(dt);
    renderFrame(now / 1000);
    requestAnimationFrame(frame);
  };

  window.__floe = {
    getState: () => state,
    getUi: () => ui,
    getCamera: () => cam,
    startWave,
    resetGame
  };

  init();
})();
