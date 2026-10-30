(() => {
  'use strict';

  const TAU = Math.PI * 2;
  const FLOE_R = 215;
  const SOCKET_TAP = 36;
  const $ = (sel) => document.querySelector(sel);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const rand = (a, b) => a + Math.random() * (b - a);
  const nowSec = () => performance.now() / 1000;

  const canvas = $('#game');
  const ctx = canvas.getContext('2d');
  let W = 1, H = 1, DPR = 1;
  let scale = 1, camX = 0, camY = 0, floeScreenR = 190;

  const ORCAS = {
    scout: { name: 'Разведчик', hp: 40, speed: 66, damage: 3, radius: 12, reward: 5, attackCd: 1.15, color: '#1b303b', accent: '#d8f4f8' },
    raider: { name: 'Налётчик', hp: 88, speed: 55, damage: 7, radius: 16, reward: 9, attackCd: 1.3, color: '#152833', accent: '#e7fbff' },
    brute: { name: 'Ледокол', hp: 235, speed: 38, damage: 18, radius: 25, reward: 22, attackCd: 1.8, armor: .18, color: '#12232d', accent: '#cfeef5' },
    boss: { name: 'Император глубин', hp: 1900, speed: 25, damage: 48, radius: 46, reward: 140, attackCd: 2.1, armor: .28, boss: true, color: '#0c1d27', accent: '#e9ffff' }
  };

  const TOWERS = [
    { id: 'snow', name: 'Снежкомёт', desc: 'Взрыв по площади', cost: 70, dmg: 20, range: 275, rate: 1.4, behavior: 'splash', splash: 62, color: '#a8e9fb', icon: 'snowball', proj: 'snow', projSpeed: 430, tag: 'ВЗРЫВ' },
    { id: 'harpoon', name: 'Гарпунная', desc: 'Пробивает броню', cost: 95, dmg: 58, range: 380, rate: 2.2, behavior: 'single', pierce: true, color: '#ffd37e', icon: 'harpoon', proj: 'harpoon', projSpeed: 690, tag: 'БРОНЯ' },
    { id: 'shard', name: 'Ледяной шквал', desc: 'Быстрый огонь', cost: 80, dmg: 10, range: 255, rate: .32, behavior: 'single', color: '#91f4ff', icon: 'shard', proj: 'shard', projSpeed: 760, tag: 'СКОРОСТР.' },
    { id: 'frost', name: 'Морозная пушка', desc: 'Замедляет стаю', cost: 110, dmg: 16, range: 270, rate: 1.7, behavior: 'splash', splash: 76, slow: .48, slowDur: 2.8, color: '#8cd5ff', icon: 'frost', proj: 'frost', projSpeed: 390, tag: 'ЗАМЕДЛЕНИЕ' },
    { id: 'tesla', name: 'Громовой тотем', desc: 'Цепная молния', cost: 145, dmg: 28, range: 290, rate: 1.8, behavior: 'chain', chain: 3, chainRange: 150, color: '#d0b4ff', icon: 'tesla', tag: 'ЦЕПЬ x3' },
    { id: 'sonic', name: 'Соник-колокол', desc: 'Оглушает и отбрасывает', cost: 135, dmg: 8, range: 225, rate: 2.6, behavior: 'pulse', stun: 1.45, knock: 38, color: '#ffd88d', icon: 'sonic', tag: 'СТАН' },
    { id: 'tar', name: 'Смоляной котёл', desc: 'Поджигает и липнет', cost: 125, dmg: 8, range: 242, rate: 1.9, behavior: 'splash', splash: 68, burn: 11, burnDur: 3, slow: .28, slowDur: 2.2, color: '#ff9b61', icon: 'tar', proj: 'tar', projSpeed: 360, tag: 'ОГОНЬ' },
    { id: 'spike', name: 'Ледяные колья', desc: 'Шипы у самой кромки', cost: 60, dmg: 32, range: 152, rate: .9, behavior: 'pulse', color: '#b6f6ef', icon: 'spike', tag: 'БЛИЖНИЙ БОЙ' },
    { id: 'beacon', name: 'Маяк сияния', desc: 'Усиливает пушки рядом', cost: 155, range: 232, rate: 2.4, behavior: 'support', buffDmg: .16, buffRate: .18, color: '#8effcf', icon: 'beacon', tag: 'ПОДДЕРЖКА' },
    { id: 'boomerang', name: 'Бумеранг', desc: 'Бьёт три цели', cost: 105, dmg: 14, range: 300, rate: 1.05, behavior: 'multi', targets: 3, color: '#ffc7e6', icon: 'boomerang', proj: 'boomerang', projSpeed: 440, tag: 'МУЛЬТИ' }
  ];

  const TRAPS = [
    { id: 'mine', name: 'Пузырь-мина', desc: 'Взрыв в воде', cost: 55, radius: 72, dmg: 70, charges: 1, cooldown: 0, life: 50, color: '#ffd36e', icon: 'mine', kind: 'mine', splash: 105 },
    { id: 'net', name: 'Стальная сеть', desc: 'Держит стаю', cost: 50, radius: 82, charges: 2, cooldown: 5.5, life: 46, color: '#9fe9ff', icon: 'net', kind: 'net', stun: 2.6 },
    { id: 'oil', name: 'Масляное пятно', desc: 'Замедляет и уязвляет', cost: 70, radius: 88, charges: 0, life: 22, color: '#bf90ff', icon: 'oil', kind: 'oil' },
    { id: 'spikes', name: 'Шипастый лёд', desc: 'Ранящая полоса', cost: 65, radius: 68, charges: 3, cooldown: 2.4, life: 38, dmg: 28, color: '#b9fff1', icon: 'spike', kind: 'spike' },
    { id: 'decoy', name: 'Рыба-приманка', desc: 'Отвлекает и взрывается', cost: 45, radius: 96, charges: 1, life: 9, dmg: 46, color: '#ffce88', icon: 'decoy', kind: 'decoy' },
    { id: 'whirl', name: 'Водоворот', desc: 'Тянет косаток вниз', cost: 95, radius: 108, charges: 0, life: 13, color: '#80c9ff', icon: 'whirl', kind: 'whirl' }
  ];

  const FLOE_UPGRADES = [
    {
      id: 'armor', name: 'Крепкий лёд', desc: '+70 к прочности', icon: 'floe', color: '#93eaff', max: 6,
      level: () => S.floeLvl.armor, cost: (l) => 75 + l * 55,
      apply() {
        S.floeLvl.armor++;
        S.floe.maxHp = 100 + S.floeLvl.armor * 70;
        S.floe.hp = Math.min(S.floe.maxHp, S.floe.hp + 70);
      }
    },
    {
      id: 'regen', name: 'Тёплый источник', desc: '+0.7 льда в секунду', icon: 'heart', color: '#7ff0c8', max: 3,
      level: () => S.floeLvl.regen, cost: (l) => 100 + l * 75,
      apply() { S.floeLvl.regen++; S.floe.regen = S.floeLvl.regen * .7; }
    },
    {
      id: 'repair', name: 'Срочный ремонт', desc: 'Вернуть 45% прочности', icon: 'repair', color: '#ffd27f', max: 99, action: true, now: true,
      cost: () => 38,
      apply() {
        const heal = Math.ceil(S.floe.maxHp * .45);
        S.floe.hp = Math.min(S.floe.maxHp, S.floe.hp + heal);
        addFloater(0, -50, '+' + heal, '#ffd27f', 18);
        sfxUpgrade();
      }
    },
    {
      id: 'expand', name: 'Внутренний круг', desc: 'Открыть 4 гнезда', icon: 'tower', color: '#b8c6ff', max: 1,
      level: () => S.floeLvl.expand, cost: () => 180,
      apply() {
        S.floeLvl.expand = 1;
        for (const socket of S.sockets) if (socket.ring === 'inner') socket.locked = false;
        addRing(0, 0, FLOE_R * .42, FLOE_R * .85, 1.1, '#b8c6ff', 4);
        S.shake = Math.max(S.shake, 5);
      }
    }
  ];

  const SEAL_UPGRADES = [
    {
      id: 'flippers', name: 'Быстрые ласты', desc: '+10% скорости', icon: 'flipper', color: '#a6d9ff', max: 4,
      level: () => S.sealLvl.flippers, cost: (l) => 55 + l * 45,
      apply() { S.sealLvl.flippers++; }
    },
    {
      id: 'roar', name: 'Ледяной голос', desc: '+радиус и урон рёва', icon: 'roar', color: '#ffd27f', max: 4,
      level: () => S.sealLvl.roar, cost: (l) => 70 + l * 55,
      apply() { S.sealLvl.roar++; }
    },
    {
      id: 'magnet', name: 'Рыбное чутьё', desc: '+радиус сбора рыбы', icon: 'magnet', color: '#7ff0c8', max: 3,
      level: () => S.sealLvl.magnet, cost: (l) => 50 + l * 40,
      apply() { S.sealLvl.magnet++; }
    },
    {
      id: 'nose', name: 'Нюх на улов', desc: '+12% рыбы с добычи', icon: 'nose', color: '#ffc3dd', max: 3,
      level: () => S.sealLvl.nose, cost: (l) => 65 + l * 50,
      apply() { S.sealLvl.nose++; }
    }
  ];

  const WAVES = [
    { name: 'Разведка', sub: 'Первые плавники на горизонте', groups: [['scout', 5]] },
    { name: 'Стая', sub: 'Косатки почуяли добычу', groups: [['scout', 8], ['raider', 2]] },
    { name: 'Налёт', sub: 'Они идут плотной группой', groups: [['raider', 6], ['scout', 5]] },
    { name: 'Тяжёлые', sub: 'Ледоколы ломают кромку', groups: [['raider', 5], ['brute', 2]] },
    { name: 'Ледяной клык', sub: 'Вожак стаи вышел на охоту', groups: [['raider', 4], ['scout', 3]], boss: 'brute', bossName: 'Ледяной Клык' },
    { name: 'Полярная ночь', sub: 'В темноте их слишком много', groups: [['scout', 10], ['raider', 6]] },
    { name: 'Молот', sub: 'Тяжёлая волна', groups: [['brute', 4], ['raider', 6]] },
    { name: 'Шторм', sub: 'Море кипит от плавников', groups: [['raider', 10], ['scout', 8]] },
    { name: 'Цепная реакция', sub: 'Не дайте им окружить льдину', groups: [['brute', 5], ['raider', 8]] },
    { name: 'Чёрный плавник', sub: 'Легенда глубин пришла за тобой', groups: [['raider', 8], ['scout', 6]], boss: 'brute', bossName: 'Чёрный Плавник' },
    { name: 'Лавина', sub: 'Отступать некуда', groups: [['brute', 6], ['raider', 10]] },
    { name: 'Хищный прилив', sub: 'Косатки заполнили воду', groups: [['raider', 16], ['scout', 12]] },
    { name: 'Титан', sub: 'Ледоколы впереди, стая за ними', groups: [['brute', 8], ['raider', 12]] },
    { name: 'Последний рубеж', sub: 'Вся стая собралась у острова', groups: [['brute', 10], ['raider', 14]] },
    { name: 'Император глубин', sub: 'Финальная битва за льдину', groups: [['brute', 5], ['raider', 14]], boss: 'boss', bossName: 'Император Глубин' }
  ];

  const ICONS = {
    seal: '<path d="M7 20.5c0-5 4.6-8.5 10-8.5 3.4 0 5.5.8 8 .8L27 15l-1.7 3.4L27 22l-4.5.6c-1.3 3-5.2 4.9-9.5 4.9H8.3C6.5 27.5 5 25.8 5 23.8v-1.9c0-1.4 1-2.4 2.3-2.4.8 0 1.5.5 1.8 1.2"/><path d="M21.6 17.1c1.3 0 2.4 1 2.4 2.3 0 1.3-1.1 2.3-2.4 2.3s-2.4-1-2.4-2.3c0-1.3 1.1-2.3 2.4-2.3Z" fill="currentColor" stroke="none"/><path d="M19.7 19.4h.1M24.2 20.8l3-1.1M24 21.6l2.8.2M12 22.6c1.2-.7 2.4-.7 3.4-.2"/>',
    fish: '<path d="M5 16c4-5.4 11-5.8 16-1.6l4.4-2.8-.8 4.4.8 4.4-4.4-2.8C16 21.8 9 21.4 5 16Z" fill="currentColor" stroke="none"/><path d="M20.5 14.4h.1M10 16.2c2.2 1.2 4.4 1.5 7 1.2" stroke="#153845" stroke-width="1.6" stroke-linecap="round"/>',
    snowball: '<circle cx="16" cy="17.5" r="7.2" fill="currentColor" opacity=".9" stroke="none"/><path d="M8 10.5c1.2-2.2 3.1-3.6 5.5-4.2M22.5 8.3l1-2.3M25 12.2l2.3.4M10.2 17.3c.3-1.5 1.5-2.7 3-3"/><circle cx="20.2" cy="15.2" r="1" fill="#08212d" stroke="none"/>',
    harpoon: '<path d="M5 27 22.6 9.4M18.5 6.4l6.8 1.8 1.8 6.8M8.5 17.5l6 6M14 12l6 6"/><path d="M22.4 9.6 27 8l-4-4-1.6 4.6" fill="currentColor" stroke="none"/>',
    shard: '<path d="m16 3 4.2 8.7L27 16l-6.8 4.3L16 29l-4.2-8.7L5 16l6.8-4.3L16 3Z" fill="currentColor" opacity=".22" stroke="none"/><path d="M16 4.5 19 13l7.5 3-7.5 3-3 8.5-3-8.5L5.5 16l7.5-3 3-8.5ZM16 9v14"/>',
    frost: '<path d="M16 4v24M6.5 9.5l19 13M25.5 9.5l-19 13M11 6.8 16 10l5-3.2M11 25.2 16 22l5 3.2M6.8 14.5 10 16l-3.2 1.5M25.2 14.5 22 16l3.2 1.5"/>',
    tesla: '<path d="M18 3 9 17h6l-2 12 10-15h-6l1-11Z" fill="currentColor" opacity=".85" stroke="none"/><path d="M5 12h3M24 7l2-2M25 21h3M8 23l-2 2"/>',
    sonic: '<path d="M13 5.5c0-1.4 1.1-2.5 2.5-2.5S18 4.1 18 5.5V15l3 2.5c1 .8 1.4 2 1 3.2l-1.6 5H9.6L8 20.7c-.4-1.2 0-2.4 1-3.2l3-2.5V5.5Z" fill="currentColor" opacity=".25" stroke="none"/><path d="M13 5.5c0-1.4 1.1-2.5 2.5-2.5S18 4.1 18 5.5V15l3 2.5c1 .8 1.4 2 1 3.2l-1.6 5H9.6L8 20.7c-.4-1.2 0-2.4 1-3.2l3-2.5V5.5ZM15.5 25.5v2M5 9c-1.4 4.4-1.4 9.6 0 14M27 9c1.4 4.4 1.4 9.6 0 14"/>',
    tar: '<path d="M7 12h18l-1.5 12.5c-.2 1.8-1.8 3.2-3.6 3.2H12.1c-1.8 0-3.4-1.4-3.6-3.2L7 12Z" fill="currentColor" opacity=".22" stroke="none"/><path d="M7 12h18M9.5 17h13M12 21h4M13.2 8.8c0-2 1.3-3.4 2.8-4.8 1.5 1.4 2.8 2.8 2.8 4.8a2.8 2.8 0 1 1-5.6 0Z"/>',
    spike: '<path d="m4 26 4-13 3 9 4-16 4 16 3-9 6 13H4Z" fill="currentColor" opacity=".22" stroke="none"/><path d="m4 26 4-13 3 9 4-16 4 16 3-9 6 13H4ZM3 27.5h26"/>',
    beacon: '<path d="M10 27h12M12 27l-2-16h12l-2 16M10 11a6 6 0 0 1 12 0M16 3v2M6 6l2 2M26 6l-2 2M4 14h2M26 14h-2"/><circle cx="16" cy="17" r="2.8" fill="currentColor" stroke="none"/>',
    boomerang: '<path d="M6 23.5C6 13.8 13.5 6.5 23 6.5l-1.2 5C15.5 11.8 11 16.5 11 23.5H6Z" fill="currentColor" opacity=".28" stroke="none"/><path d="M6 23.5C6 13.8 13.5 6.5 23 6.5l-1.2 5C15.5 11.8 11 16.5 11 23.5M27 8.5c0 9.7-7.5 17-17 17l1.2-5c6.3-.3 10.8-5 10.8-12"/>',
    mine: '<circle cx="16" cy="18" r="7.2" fill="currentColor" opacity=".25" stroke="none"/><circle cx="16" cy="18" r="7.2"/><path d="M16 6.5v4.2M16 25.3v4.2M4.5 18h4.2M23.3 18h4.2M8 10l3 3M21 22l3 3M24 10l-3 3M11 22l-3 3"/><circle cx="16" cy="18" r="2.2" fill="currentColor" stroke="none"/>',
    net: '<path d="M7 7c6 2.5 12 2.5 18 0M7 25c6-2.5 12-2.5 18 0M7 7c-2.5 6-2.5 12 0 18M25 7c2.5 6 2.5 12 0 18M7 7l18 18M25 7 7 25M12 7v18M20 7v18M7 12h18M7 20h18" opacity=".85"/>',
    oil: '<path d="M16 4.5c5.2 6 8.5 10 8.5 14a8.5 8.5 0 1 1-17 0c0-4 3.3-8 8.5-14Z" fill="currentColor" opacity=".22" stroke="none"/><path d="M16 4.5c5.2 6 8.5 10 8.5 14a8.5 8.5 0 1 1-17 0c0-4 3.3-8 8.5-14ZM12 18.5c.4 2.1 1.8 3.4 3.8 3.7"/>',
    decoy: '<path d="M4 17c4.4-5.4 11.4-5.7 16.4-1.5L26 12l-1 5 1 5-5.6-3.5C15.4 22.7 8.4 22.4 4 17Z" fill="currentColor" opacity=".22" stroke="none"/><path d="M4 17c4.4-5.4 11.4-5.7 16.4-1.5L26 12l-1 5 1 5-5.6-3.5C15.4 22.7 8.4 22.4 4 17ZM18 15.2h.1M8 9l1.5 3M24 24l2 2M6 24l2-2"/>',
    whirl: '<path d="M16 16c2.2-2.7 6-1.9 6.6 1.4.7 3.9-3.1 6.5-6.7 5.5-4.9-1.4-6.6-7-3.7-11 3.7-5 11.4-5.1 15.1-.2 4.2 5.5 2.1 13.6-3.6 16.5M8 8c2.2-1.2 4.5-1.8 7-1.8"/>',
    floe: '<path d="M16 3 27 8v9c0 6.2-4.6 10.5-11 13C9.6 27.5 5 23.2 5 17V8l11-5Z" fill="currentColor" opacity=".16" stroke="none"/><path d="M16 3 27 8v9c0 6.2-4.6 10.5-11 13C9.6 27.5 5 23.2 5 17V8l11-5ZM9 16l4-4 4 3 5-4M16 8v14"/>',
    heart: '<path d="M16 27S4.5 20 4.5 12.5A6.5 6.5 0 0 1 16 8.6a6.5 6.5 0 0 1 11.5 3.9C27.5 20 16 27 16 27Z" fill="currentColor" opacity=".2" stroke="none"/><path d="M16 27S4.5 20 4.5 12.5A6.5 6.5 0 0 1 16 8.6a6.5 6.5 0 0 1 11.5 3.9C27.5 20 16 27 16 27Z"/>',
    repair: '<path d="M20.5 4.5a6.5 6.5 0 0 0-6 10.4L5 24.4 7.6 27l9.5-9.5a6.5 6.5 0 0 0 10.4-6l-4.2 4.2-4.7-4.7 4.2-4.2a6.5 6.5 0 0 0-2.3-2.3Z" fill="currentColor" opacity=".16" stroke="none"/><path d="M20.5 4.5a6.5 6.5 0 0 0-6 10.4L5 24.4 7.6 27l9.5-9.5a6.5 6.5 0 0 0 10.4-6l-4.2 4.2-4.7-4.7 4.2-4.2a6.5 6.5 0 0 0-2.3-2.3Z"/>',
    tower: '<path d="M8 27V11l8-5 8 5v16M5 27h22M12 27v-7h8v7M12 11h8M12 15h8"/>',
    flipper: '<path d="M8 24c-2.4-1-3.5-3.8-2.3-6.2C8 13 14.5 8.8 22 7.5c2.2-.4 3.6 1.4 2.8 3.5-2.3 5.8-5 9.4-8.8 12.4-2.4 1.9-5.3 2.2-8 .6Z" fill="currentColor" opacity=".22" stroke="none"/><path d="M8 24c-2.4-1-3.5-3.8-2.3-6.2C8 13 14.5 8.8 22 7.5c2.2-.4 3.6 1.4 2.8 3.5-2.3 5.8-5 9.4-8.8 12.4-2.4 1.9-5.3 2.2-8 .6ZM9 10l4 4M15 7l3 3"/>',
    roar: '<path d="M15 7c0-1.4 1.1-2.5 2.5-2.5S20 5.6 20 7v5.5l3.5 1.2c1.8.6 2.7 2.6 2.1 4.4l-1.5 4.8c-.5 1.6-2 2.7-3.7 2.7h-7c-1.6 0-3-.9-3.6-2.3L7.6 18c-.8-1.8.1-3.9 1.9-4.6L13 12V7Z" fill="currentColor" opacity=".16" stroke="none"/><path d="M15 7c0-1.4 1.1-2.5 2.5-2.5S20 5.6 20 7v5.5l3.5 1.2c1.8.6 2.7 2.6 2.1 4.4l-1.5 4.8c-.5 1.6-2 2.7-3.7 2.7h-7c-1.6 0-3-.9-3.6-2.3L7.6 18c-.8-1.8.1-3.9 1.9-4.6L13 12V7ZM11.2 22.5c-1.7 1.2-2.7 2.8-3 4.8M16 23v6M20.8 22.5c1.7 1.2 2.7 2.8 3 4.8"/>',
    magnet: '<path d="M6 6h7v12a3 3 0 0 0 6 0V6h7v12a10 10 0 0 1-20 0V6Z" fill="currentColor" opacity=".15" stroke="none"/><path d="M6 6h7v12a3 3 0 0 0 6 0V6h7v12a10 10 0 0 1-20 0V6ZM6 11h7M19 11h7"/>',
    nose: '<path d="M5 17c4.4-5.4 11.4-5.7 16.4-1.5L27 12l-1 5 1 5-5.6-3.5C16.4 22.7 9.4 22.4 5 17Z" fill="currentColor" opacity=".18" stroke="none"/><path d="M5 17c4.4-5.4 11.4-5.7 16.4-1.5L27 12l-1 5 1 5-5.6-3.5C16.4 22.7 9.4 22.4 5 17ZM18 15.2h.1M20 8l1.5-2M25 11l2-1M8 26c2-1.5 4-2.5 6-3"/>',
    soundOn: '<path d="M5 12h4l5-4v16l-5-4H5v-8Z" fill="currentColor" opacity=".2" stroke="none"/><path d="M5 12h4l5-4v16l-5-4H5v-8ZM18 11c2 2.8 2 7.2 0 10M21 7.5c4.4 5 4.4 12 0 17"/>',
    soundOff: '<path d="M5 12h4l5-4v16l-5-4H5v-8Z" fill="currentColor" opacity=".2" stroke="none"/><path d="M5 12h4l5-4v16l-5-4H5v-8ZM19 12l6 8M25 12l-6 8"/>',
    tilt: '<rect x="10" y="3" width="12" height="26" rx="3"/><path d="M13 7h6M14 25h4M4 11l3-3M4 21l3 3M28 11l-3-3M28 21l-3 3"/>',
    shield: '<path d="M16 3 27 8v9c0 6.2-4.6 10.5-11 13C9.6 27.5 5 23.2 5 17V8l11-5Z" fill="currentColor" opacity=".16" stroke="none"/><path d="M16 3 27 8v9c0 6.2-4.6 10.5-11 13C9.6 27.5 5 23.2 5 17V8l11-5ZM11 16l3.5 3.5L21.5 12"/>',
    settings: '<circle cx="16" cy="16" r="5"/><path d="M16 3v4M16 25v4M3 16h4M25 16h4M6.8 6.8l2.8 2.8M22.4 22.4l2.8 2.8M25.2 6.8l-2.8 2.8M9.6 22.4l-2.8 2.8"/>',
    wave: '<path d="M3 20c3.2 0 3.8-4 7-4s3.8 4 7 4 3.8-4 7-4 3.8 4 7 4M3 12c3.2 0 3.8-4 7-4s3.8 4 7 4 3.8-4 7-4 3.8 4 7 4"/>'
  };

  function icon(name, extra = '') {
    const body = ICONS[name] || ICONS.seal;
    return `<svg viewBox="0 0 32 32" ${extra} fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
  }

  const S = {
    mode: 'menu', time: 0, visual: 0,
    wave: 0, waveActive: false, prep: 20, spawnQueue: [], spawnTimer: 0, spawned: 0, waveTotal: 0,
    fish: 150, score: 0, best: Number(localStorage.getItem('iceSealBest') || 0),
    floe: { hp: 100, maxHp: 100, regen: 0 },
    floeLvl: { armor: 0, regen: 0, expand: 0 },
    sealLvl: { flippers: 0, roar: 0, magnet: 0, nose: 0 },
    seal: { x: 0, y: 45, vx: 0, vy: 0, face: Math.PI / 2, anim: 0, roarAnim: 0, trail: 0 },
    roarCd: 0,
    sockets: [], towers: [], traps: [], orcas: [], projectiles: [], pickups: [],
    effects: [], particles: [], floaters: [],
    selectedCard: null, selectedSocket: null, selectedTower: null, category: 'towers',
    joy: { active: false, id: null, dx: 0, dy: 0 },
    tilt: { enabled: false, base: null, x: 0, y: 0, awaiting: false, lastEvent: 0 },
    keys: new Set(), shake: 0, damageFlash: 0, built: 0,
    isTouch: false, toastTimer: 0, hudTimer: 0, cardTimer: 0,
    muted: localStorage.getItem('iceSealMuted') === '1',
    modalClose: null, modalReturn: 'menu', lastShotSound: 0, tutorialStep: 0
  };

  const touchQuery = window.matchMedia('(pointer: coarse)');
  S.isTouch = touchQuery.matches || ('ontouchstart' in window && navigator.maxTouchPoints > 0);

  const dom = {};
  [
    'brandMark', 'fishIconHud', 'roarIcon', 'tiltQuickIcon', 'soundIcon', 'waveValue', 'waveState',
    'fishValue', 'iceText', 'iceFill', 'scoreValue', 'waveBanner', 'waveBannerKicker', 'waveBannerTitle',
    'waveBannerSub', 'toast', 'buildHint', 'nextWave', 'nextWaveLabel', 'btnNextWave', 'joystick',
    'joyKnob', 'btnRoar', 'roarCd', 'dock', 'dockTip', 'cards', 'towerPanel', 'tpIcon', 'tpName',
    'tpStats', 'tpUpgrade', 'tpSell', 'tpClose', 'startScreen', 'btnStart', 'btnHow', 'bestStart',
    'modalOverlay', 'modalCard', 'endScreen', 'endKicker', 'endTitle', 'endText', 'endWaves',
    'endScore', 'endBuilt', 'btnAgain', 'btnMenu', 'hud'
  ].forEach((id) => { dom[id] = document.getElementById(id); });

  const FLOE_POINTS = Array.from({ length: 72 }, (_, i) => {
    const a = (i / 72) * TAU;
    const n = Math.sin(a * 3 + .4) * 7 + Math.sin(a * 7 + 1.7) * 4 + Math.sin(a * 11 + .8) * 2.5 + Math.cos(a * 5) * 3;
    return { a, r: FLOE_R + n };
  });

  const CRACKS = [
    [[-.62, -.15], [-.53, -.02], [-.49, .13], [-.38, .24], [-.28, .2]],
    [[.15, -.64], [.06, -.48], [.12, -.31], [.04, -.15], [.09, -.02]],
    [[-.08, .62], [.01, .44], [-.04, .3], [.04, .16], [.0, .04]],
    [[.53, .34], [.38, .27], [.27, .31], [.12, .26], [.0, .3]],
    [[-.64, .3], [-.49, .34], [-.4, .45], [-.24, .47]]
  ];

  const SNOWFLAKES = Array.from({ length: 54 }, () => ({
    x: Math.random(), y: Math.random(), s: rand(.6, 2.1), v: rand(.008, .025), d: rand(.2, 1.6), p: Math.random() * TAU
  }));

  const BG_WAVES = Array.from({ length: 46 }, () => ({
    x: Math.random(), y: Math.random(), len: rand(18, 72), a: rand(.02, .085), sp: rand(.004, .018), p: Math.random() * TAU
  }));

  const FLOAT_ICE = Array.from({ length: 15 }, () => {
    const a = Math.random() * TAU;
    const r = rand(FLOE_R + 85, FLOE_R + 330);
    return { x: Math.cos(a) * r, y: Math.sin(a) * r, s: rand(7, 26), rot: Math.random() * TAU, sp: rand(-.05, .05), a: rand(.12, .34) };
  });

  let audioCtx = null;
  let masterGain = null;
  let noiseBuffer = null;

  function initAudio() {
    if (audioCtx) {
      if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
      return;
    }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      audioCtx = new AC();
      masterGain = audioCtx.createGain();
      masterGain.gain.value = S.muted ? 0 : .14;
      masterGain.connect(audioCtx.destination);
      const len = Math.floor(audioCtx.sampleRate * .6);
      noiseBuffer = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    } catch (e) { audioCtx = null; }
  }

  function setMuted(muted) {
    S.muted = muted;
    localStorage.setItem('iceSealMuted', muted ? '1' : '0');
    if (masterGain) masterGain.gain.setTargetAtTime(muted ? 0 : .14, audioCtx.currentTime, .02);
    updateSoundIcon();
  }

  function tone(freq, dur, type = 'sine', vol = .1, slide = 0) {
    if (S.muted || !audioCtx) return;
    const t = audioCtx.currentTime;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
    g.gain.setValueAtTime(.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(.0002, vol), t + .012);
    g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g);
    g.connect(masterGain);
    o.start(t);
    o.stop(t + dur + .03);
  }

  function noiseBurst(dur = .18, vol = .15, freq = 900, q = 1) {
    if (S.muted || !audioCtx || !noiseBuffer) return;
    const t = audioCtx.currentTime;
    const src = audioCtx.createBufferSource();
    src.buffer = noiseBuffer;
    const f = audioCtx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = freq;
    f.Q.value = q;
    const g = audioCtx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(masterGain);
    src.start(t); src.stop(t + dur + .03);
  }

  function sfxClick() { tone(520, .06, 'sine', .035, -80); }
  function sfxCollect() { tone(760, .1, 'triangle', .06, 280); setTimeout(() => tone(1120, .09, 'sine', .04, 160), 35); }
  function sfxBuild() { tone(210, .16, 'triangle', .08, 80); noiseBurst(.12, .05, 500, .8); }
  function sfxUpgrade() { tone(330, .12, 'triangle', .07, 260); setTimeout(() => tone(520, .16, 'sine', .06, 220), 60); }
  function sfxShoot(kind) {
    const t = nowSec();
    if (t - S.lastShotSound < .035) return;
    S.lastShotSound = t;
    if (kind === 'harpoon') { tone(180, .12, 'square', .035, 120); noiseBurst(.06, .03, 1800, 1.4); }
    else if (kind === 'shard') tone(920, .035, 'triangle', .018, 360);
    else if (kind === 'tesla') { tone(140, .2, 'sawtooth', .035, -40); noiseBurst(.16, .04, 2300, .7); }
    else if (kind === 'sonic') tone(300, .32, 'sine', .06, 120);
    else if (kind === 'tar') tone(120, .18, 'sawtooth', .03, -20);
    else if (kind === 'frost') tone(620, .18, 'sine', .035, 300);
    else if (kind === 'boomerang') tone(440, .12, 'triangle', .03, 230);
    else { tone(250, .1, 'triangle', .028, 100); noiseBurst(.05, .02, 900, 1); }
  }
  function sfxExplode(big) { noiseBurst(big ? .4 : .24, big ? .18 : .1, big ? 240 : 420, .45); tone(big ? 70 : 120, big ? .36 : .2, 'sine', .1, -40); }
  function sfxRoar() {
    tone(110, .65, 'sawtooth', .075, 140);
    tone(220, .5, 'sine', .06, 180);
    noiseBurst(.45, .07, 450, .6);
    setTimeout(() => tone(72, .35, 'sine', .06, -20), 80);
  }
  function sfxWave() { tone(180, .5, 'sine', .07, 70); setTimeout(() => tone(270, .4, 'triangle', .05, 40), 170); setTimeout(() => tone(360, .5, 'sine', .04, 30), 330); }
  function sfxHurt() { tone(80, .4, 'sawtooth', .07, -25); noiseBurst(.3, .09, 300, .7); }
  function updateSoundIcon() { dom.soundIcon.innerHTML = icon(S.muted ? 'soundOff' : 'soundOn'); }

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    DPR = Math.min(window.devicePixelRatio || 1, 2.25);
    canvas.width = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    const cssHud = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hud-h')) || 70;
    const cssDock = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--dock-h')) || 168;
    const hudH = (dom.hud && dom.hud.getBoundingClientRect().height) || cssHud;
    const dockH = (dom.dock && dom.dock.getBoundingClientRect().height) || cssDock;
    const portrait = H > W * 1.02;
    const availH = Math.max(180, H - hudH - dockH);
    let r;
    if (portrait) r = Math.min(W * .405, availH * .43);
    else r = Math.min(W * .255, availH * .5, H * .365);
    floeScreenR = clamp(r, 92, 360);
    scale = floeScreenR / FLOE_R;
    camX = W / 2;
    camY = hudH + availH * .5 - (portrait ? 4 : 2);
    document.body.classList.toggle('touch', S.isTouch);
  }

  const sx = (x) => camX + x * scale;
  const sy = (y) => camY + y * scale;

  function screenToWorld(px, py) {
    return { x: (px - camX) / scale, y: (py - camY) / scale };
  }

  function makeSockets() {
    S.sockets = [];
    for (let i = 0; i < 8; i++) {
      const a = -Math.PI / 2 + i * TAU / 8 + Math.PI / 8;
      S.sockets.push({ x: Math.cos(a) * 166, y: Math.sin(a) * 166, angle: a, ring: 'outer', locked: false, tower: null });
    }
    for (let i = 0; i < 4; i++) {
      const a = -Math.PI / 2 + i * TAU / 4;
      S.sockets.push({ x: Math.cos(a) * 91, y: Math.sin(a) * 91, angle: a, ring: 'inner', locked: !S.floeLvl.expand, tower: null });
    }
  }

  function resetRun() {
    S.wave = 0; S.waveActive = false; S.prep = 20;
    S.spawnQueue = []; S.spawnTimer = 0; S.spawned = 0; S.waveTotal = 0;
    S.fish = 150; S.score = 0;
    S.floe = { hp: 100, maxHp: 100, regen: 0 };
    S.floeLvl = { armor: 0, regen: 0, expand: 0 };
    S.sealLvl = { flippers: 0, roar: 0, magnet: 0, nose: 0 };
    S.seal = { x: 0, y: 45, vx: 0, vy: 0, face: Math.PI / 2, anim: 0, roarAnim: 0, trail: 0 };
    S.roarCd = 0;
    S.towers = []; S.traps = []; S.orcas = []; S.projectiles = [];
    S.pickups = []; S.effects = []; S.particles = []; S.floaters = [];
    S.selectedCard = null; S.selectedSocket = null; S.selectedTower = null;
    S.joy = { active: false, id: null, dx: 0, dy: 0 };
    S.shake = 0; S.damageFlash = 0; S.built = 0; S.tutorialStep = 0;
    S.category = 'towers';
    makeSockets();
    document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t.dataset.cat === 'towers'));
    closeTowerPanel();
    renderCards();
    updateHud(true);
    updateRoarButton();
  }

  function startGame() {
    initAudio();
    resetRun();
    S.mode = 'playing';
    document.body.classList.add('in-game');
    resize();
    dom.startScreen.classList.add('hidden');
    dom.endScreen.classList.add('hidden');
    dom.endScreen.classList.remove('defeat');
    dom.modalOverlay.classList.add('hidden');
    dom.nextWave.classList.remove('hidden');
    dom.waveBanner.classList.remove('show');
    showBanner('ПОДГОТОВКА', 'Ледяная крепость', 'Постройте пушки · соберите рыбу · встретьте стаю');
    showToast('Постройте первую пушку: выберите карту и коснитесь свободного гнезда', '');
    S.tutorialStep = 1;
    sfxWave();
  }

  function goMenu() {
    S.mode = 'menu';
    document.body.classList.remove('in-game');
    dom.endScreen.classList.add('hidden');
    dom.modalOverlay.classList.add('hidden');
    dom.startScreen.classList.remove('hidden');
    dom.nextWave.classList.add('hidden');
    dom.bestStart.textContent = 'Лучший результат: ' + S.best;
    resetMenuScene();
    renderCards();
  }

  function resetMenuScene() {
    S.wave = 0; S.waveActive = false;
    S.orcas = []; S.towers = []; S.traps = []; S.projectiles = [];
    S.pickups = []; S.effects = []; S.particles = []; S.floaters = [];
    S.floe = { hp: 100, maxHp: 100, regen: 0 };
    S.floeLvl = { armor: 0, regen: 0, expand: 0 };
    S.sealLvl = { flippers: 0, roar: 0, magnet: 0, nose: 0 };
    S.seal = { x: -18, y: 55, vx: 0, vy: 0, face: -.25, anim: 0, roarAnim: 0, trail: 0 };
    makeSockets();
    S.selectedCard = null; S.selectedSocket = null;
    closeTowerPanel();
    updateHud(true);
  }

  function categoryList() {
    if (S.category === 'towers') return TOWERS;
    if (S.category === 'traps') return TRAPS;
    if (S.category === 'floe') return FLOE_UPGRADES;
    return SEAL_UPGRADES;
  }

  function currentLevel(def) { return def.level ? def.level() : 0; }

  function cardCost(def) {
    const lvl = currentLevel(def);
    return typeof def.cost === 'function' ? def.cost(lvl) : def.cost;
  }

  function renderCards() {
    const list = categoryList();
    const low = S.fish;
    dom.cards.innerHTML = list.map((def) => {
      const cat = S.category;
      const lvl = currentLevel(def);
      const maxed = def.max ? lvl >= def.max : false;
      const cost = cardCost(def);
      const poor = !maxed && low < cost;
      const selected = S.selectedCard && S.selectedCard.def.id === def.id && S.selectedCard.cat === cat;
      const isAction = cat === 'floe' || cat === 'seal';
      let pips;
      if (isAction) {
        if (def.max && def.max < 20) {
          pips = '<span class="card-pips">' + Array.from({ length: def.max }, (_, i) => `<i class="${i < lvl ? 'on' : ''}"></i>`).join('') + '</span>';
        } else pips = '<span class="card-action">Сейчас</span>';
      } else {
        pips = `<span class="card-lvl">${def.behavior === 'support' ? 'АУРА' : def.kind === 'decoy' ? 'ТАУНТ' : 'ЗАЩИТА'}</span>`;
      }
      const costHtml = maxed ? '<span class="card-action">МАКС</span>' : `<span class="card-cost">${icon('fish')}${cost}</span>`;
      const note = isAction
        ? `<span class="card-note">${maxed ? 'предел' : def.max && def.max < 20 ? 'ур. ' + lvl + ' / ' + def.max : 'мгновенно'}</span>`
        : `<span class="card-note">${def.tag || (def.kind ? 'ЛОВУШКА' : '')}</span>`;
      return `<button class="card ${poor ? 'poor' : ''} ${maxed ? 'maxed' : ''} ${selected ? 'selected' : ''}"
        data-card="${def.id}" data-cat="${cat}" style="--accent:${def.color}" aria-label="${def.name}: ${cost} рыбы">
        <div class="card-top"><span class="card-icon">${icon(def.icon)}</span>${pips}</div>
        <span class="card-name">${def.name}</span>
        <span class="card-desc">${def.desc}</span>
        <span class="card-bottom">${costHtml}${note}</span>
      </button>`;
    }).join('');
  }

  function refreshCardAffordability() {
    const nodes = dom.cards.querySelectorAll('.card');
    for (const node of nodes) {
      const id = node.dataset.card;
      const cat = node.dataset.cat;
      let def;
      if (cat === 'towers') def = TOWERS.find((d) => d.id === id);
      else if (cat === 'traps') def = TRAPS.find((d) => d.id === id);
      else if (cat === 'floe') def = FLOE_UPGRADES.find((d) => d.id === id);
      else def = SEAL_UPGRADES.find((d) => d.id === id);
      if (!def) continue;
      const lvl = currentLevel(def);
      const maxed = def.max ? lvl >= def.max : false;
      node.classList.toggle('poor', !maxed && S.fish < cardCost(def));
      node.classList.toggle('maxed', maxed);
      node.classList.toggle('selected', !!(S.selectedCard && S.selectedCard.def.id === id && S.selectedCard.cat === cat));
    }
  }

  function selectCard(def, cat) {
    sfxClick();
    if (cat === 'floe' || cat === 'seal') { buyUpgrade(def, cat); return; }
    if (S.selectedCard && S.selectedCard.def.id === def.id && S.selectedCard.cat === cat) {
      S.selectedCard = null; S.selectedSocket = null;
      updateBuildHint(); renderCards(); return;
    }
    S.selectedCard = { def, cat };
    closeTowerPanel();
    updateBuildHint();
    renderCards();
    if (cat === 'traps') showToast('Коснитесь воды вокруг льдины, чтобы поставить ловушку', '');
    else if (S.selectedSocket && !S.selectedSocket.tower && !S.selectedSocket.locked) placeTowerAt(S.selectedSocket);
    else showToast('Выберите свободное гнездо на льдине', '');
  }

  function updateBuildHint() {
    if (!S.selectedCard) { dom.buildHint.classList.remove('show'); return; }
    const d = S.selectedCard.def;
    const cost = cardCost(d);
    if (S.selectedCard.cat === 'towers') dom.buildHint.innerHTML = `<b>${d.name}</b> · ${cost} рыбы · коснитесь свободного гнезда`;
    else dom.buildHint.innerHTML = `<b>${d.name}</b> · ${cost} рыбы · коснитесь воды у льдины`;
    dom.buildHint.classList.add('show');
  }

  function buyUpgrade(def, cat) {
    const lvl = currentLevel(def);
    if (def.max && lvl >= def.max) { showToast('Улучшение уже максимальное', 'bad'); return; }
    if (def.id === 'repair' && S.floe.hp >= S.floe.maxHp - .5) { showToast('Лёд и так в порядке', ''); return; }
    const cost = cardCost(def);
    if (S.fish < cost) { showToast('Не хватает рыбы: нужно ' + cost, 'bad'); return; }
    S.fish -= cost;
    def.apply();
    addParticleBurst(sx(0), sy(0), 14, '#9ff3ff', 1.1, 22);
    showToast(cat === 'floe' ? 'Льдина укреплена' : 'Тюлень стал сильнее', 'good');
    sfxUpgrade();
    renderCards();
    updateHud(true);
    if (def.id === 'expand') showToast('Открыты 4 внутренних гнезда', 'good');
  }

  function handleSocket(socket) {
    if (S.selectedCard && S.selectedCard.cat === 'towers') { placeTowerAt(socket); return; }
    if (socket.tower) { S.selectedSocket = socket; openTowerPanel(socket.tower); return; }
    if (socket.locked) { showToast('Внутреннее гнездо закрыто. Улучшите льдину', 'bad'); return; }
    S.selectedSocket = socket;
    showToast('Выберите пушку внизу — она встанет в это гнездо', '');
    sfxClick();
  }

  function placeTowerAt(socket) {
    const card = S.selectedCard;
    if (!card || card.cat !== 'towers') return;
    if (socket.locked) { showToast('Это гнездо ещё закрыто', 'bad'); return; }
    if (socket.tower) { showToast('Здесь уже есть защита', 'bad'); return; }
    const def = card.def;
    const cost = cardCost(def);
    if (S.fish < cost) { showToast('Не хватает рыбы: нужно ' + cost, 'bad'); return; }
    S.fish -= cost;
    const tower = {
      def, socket, x: socket.x, y: socket.y, angle: socket.angle + Math.PI,
      level: 1, cooldown: rand(0, .35), invested: cost, recoil: 0, flash: 0, aura: 0
    };
    socket.tower = tower;
    S.towers.push(tower);
    S.built++;
    addParticleBurst(sx(socket.x), sy(socket.y), 16, def.color, .9, 30);
    addRing(socket.x, socket.y, 8, 48, .55, def.color, 2);
    S.selectedCard = null;
    S.selectedSocket = socket;
    showToast(def.name + ' установлен', 'good');
    sfxBuild();
    renderCards();
    updateBuildHint();
    updateHud(true);
    openTowerPanel(tower);
    if (S.tutorialStep === 1) {
      S.tutorialStep = 2;
      setTimeout(() => {
        if (S.mode === 'playing') showToast('Собирайте рыбу с убитых косаток — она нужна для улучшений', '');
      }, 900);
    }
  }

  function placeTrapAt(world) {
    const card = S.selectedCard;
    if (!card || card.cat !== 'traps') return false;
    const def = card.def;
    const r = Math.hypot(world.x, world.y);
    if (r < FLOE_R + 18) { showToast('Ловушки ставятся в воде, у самой кромки льда', 'bad'); return true; }
    if (r > FLOE_R + 235) { showToast('Слишком далеко: держитесь ближе к льдине', 'bad'); return true; }
    if (S.traps.length >= 8) { showToast('Достигнут предел ловушек', 'bad'); return true; }
    if (S.traps.some((t) => Math.hypot(t.x - world.x, t.y - world.y) < 58)) {
      showToast('Здесь уже стоит ловушка', 'bad'); return true;
    }
    const cost = cardCost(def);
    if (S.fish < cost) { showToast('Не хватает рыбы: нужно ' + cost, 'bad'); return true; }
    S.fish -= cost;
    S.traps.push({
      def, x: world.x, y: world.y, life: def.life, maxLife: def.life,
      charges: def.charges, cooldown: .4, flash: 0, age: 0, triggered: false
    });
    addRing(world.x, world.y, 8, def.radius * .7, .5, def.color, 2);
    addParticleBurst(sx(world.x), sy(world.y), 12, def.color, .7, 26);
    S.selectedCard = null;
    showToast(def.name + ' установлена', 'good');
    sfxBuild();
    updateBuildHint();
    renderCards();
    updateHud(true);
    return true;
  }

  function openTowerPanel(tower) {
    S.selectedTower = tower;
    S.selectedSocket = tower.socket;
    const d = tower.def;
    dom.towerPanel.style.setProperty('--accent', d.color);
    dom.tpIcon.innerHTML = icon(d.icon);
    dom.tpName.textContent = d.name;
    dom.towerPanel.classList.remove('hidden');
    updateTowerPanel();
  }

  function closeTowerPanel() {
    S.selectedTower = null;
    dom.towerPanel.classList.add('hidden');
  }

  function towerDamage(tower) { return tower.def.dmg ? tower.def.dmg * (1 + .43 * (tower.level - 1)) : 0; }
  function towerRange(tower) { return tower.def.range * (1 + .055 * (tower.level - 1)); }
  function towerInterval(tower) { return tower.def.rate * Math.pow(.935, tower.level - 1); }

  function towerDps(tower) {
    if (tower.def.behavior === 'support') return 0;
    let dps = towerDamage(tower) / towerInterval(tower);
    if (tower.def.behavior === 'multi') dps *= tower.def.targets || 1;
    if (tower.def.behavior === 'chain') dps *= tower.def.chain || 1;
    return Math.round(dps);
  }

  function upgradeCost(tower) { return Math.round(tower.def.cost * (.75 + tower.level * .48)); }

  function updateTowerPanel() {
    const t = S.selectedTower;
    if (!t) return;
    const d = t.def;
    const maxed = t.level >= 5;
    let special = '—';
    if (d.behavior === 'splash') special = d.slow ? 'ВЗРЫВ + ЗАМЕДЛЕНИЕ' : d.burn ? 'ВЗРЫВ + ОГОНЬ' : 'ВЗРЫВ';
    else if (d.behavior === 'single') special = d.pierce ? 'БРОНЕБОЙ' : 'ТОЧНЫЙ';
    else if (d.behavior === 'chain') special = 'ЦЕПЬ x' + d.chain;
    else if (d.behavior === 'pulse') special = d.stun ? 'ОГЛУШЕНИЕ' : 'БЛИЖНИЙ БОЙ';
    else if (d.behavior === 'support') special = '+УРОН / +ТЕМП';
    else if (d.behavior === 'multi') special = 'ЦЕЛИ x' + d.targets;
    const dps = towerDps(t);
    const primary = d.behavior === 'support' ? Math.round(towerRange(t)) : dps;
    dom.tpStats.innerHTML = `
      <div class="tp-stat"><span>УРОВЕНЬ</span><b>${t.level} <small>/ 5</small></b></div>
      <div class="tp-stat"><span>${d.behavior === 'support' ? 'РАДИУС' : 'ДПС'}</span><b>${primary}</b></div>
      <div class="tp-stat"><span>ОСОБОЕ</span><b style="font-size:9px;line-height:1.2;padding-top:2px">${special}</b></div>`;
    dom.tpUpgrade.textContent = maxed ? 'МАКС. УРОВЕНЬ' : `УЛУЧШИТЬ · ${upgradeCost(t)}`;
    dom.tpUpgrade.disabled = maxed || S.fish < upgradeCost(t);
    dom.tpSell.textContent = `ПРОДАТЬ · +${Math.floor(t.invested * .6)}`;
  }

  function upgradeSelectedTower() {
    const t = S.selectedTower;
    if (!t) return;
    if (t.level >= 5) { showToast('Пушка уже максимального уровня', ''); return; }
    const cost = upgradeCost(t);
    if (S.fish < cost) { showToast('Не хватает рыбы: нужно ' + cost, 'bad'); return; }
    S.fish -= cost;
    t.level++;
    t.invested += cost;
    addRing(t.x, t.y, 10, 52, .5, t.def.color, 2);
    addParticleBurst(sx(t.x), sy(t.y), 14, t.def.color, .8, 30);
    sfxUpgrade();
    showToast(t.def.name + ' улучшен до ур. ' + t.level, 'good');
    updateTowerPanel();
    updateHud(true);
    renderCards();
  }

  function sellSelectedTower() {
    const t = S.selectedTower;
    if (!t) return;
    const refund = Math.floor(t.invested * .6);
    S.fish += refund;
    t.socket.tower = null;
    S.towers = S.towers.filter((x) => x !== t);
    S.built = Math.max(0, S.built - 1);
    addParticleBurst(sx(t.x), sy(t.y), 18, '#aeefff', .8, 32);
    showToast('Продано. Возвращено ' + refund + ' рыбы', '');
    closeTowerPanel();
    updateHud(true);
    renderCards();
    sfxClick();
  }

  function beginWave(n) {
    if (n > WAVES.length || S.mode !== 'playing') return;
    const conf = WAVES[n - 1];
    S.wave = n;
    S.waveActive = true;
    S.prep = 0;
    S.spawned = 0;
    const group = [];
    for (const [kind, count] of conf.groups) for (let i = 0; i < count; i++) group.push(kind);
    for (let i = group.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      const temp = group[i]; group[i] = group[j]; group[j] = temp;
    }
    if (conf.boss) group.push(conf.boss);
    S.spawnQueue = group;
    S.waveTotal = group.length;
    S.spawnTimer = .25;
    dom.nextWave.classList.add('hidden');
    showBanner(`ВОЛНА ${n} / ${WAVES.length}`, conf.name, conf.sub);
    showToast(conf.boss ? 'Огромный плавник разрезает воду...' : 'Косатки идут!', conf.boss ? 'bad' : '');
    sfxWave();
    updateHud(true);
  }

  function spawnOrca(kind) {
    const base = ORCAS[kind];
    const angle = Math.random() * TAU;
    const halfDiag = Math.hypot(W, H) * .5 / scale;
    const spawnR = Math.max(FLOE_R + 300, halfDiag * .96);
    const hpScale = 1 + (S.wave - 1) * .115;
    const conf = WAVES[S.wave - 1];
    const elite = !!(conf && conf.boss === kind);
    const bossNerf = kind === 'boss' ? .72 : 1;
    const eliteHp = elite ? 1.75 : 1;
    const bossName = elite || base.boss ? (conf && conf.bossName) || base.name : base.name;
    const o = {
      kind, def: base, x: Math.cos(angle) * spawnR, y: Math.sin(angle) * spawnR,
      hp: base.hp * hpScale * bossNerf * eliteHp, maxHp: base.hp * hpScale * bossNerf * eliteHp,
      angle: angle + Math.PI, radius: base.radius * (elite ? 1.16 : 1), speed: base.speed * (1 + S.wave * .009) * (elite ? .92 : 1),
      attackTimer: rand(.4, 1.1), attackPulse: 0, stun: 0, slow: 0, slowAmt: 0,
      vulnerable: 0, burn: 0, burnDps: 0, seed: Math.random() * TAU,
      dead: false, hitFlash: 0, bite: 0, boss: !!base.boss || elite, bossName,
      reward: base.reward * (elite ? 2.4 : 1), damage: base.damage * (elite ? 1.2 : 1), attackCd: base.attackCd, armor: base.armor || 0
    };
    S.orcas.push(o);
    S.spawned++;
    addRing(o.x, o.y, 4, 32, .55, '#b8f7ff', 2);
    addParticleBurst(sx(o.x), sy(o.y), 9, '#bceff7', .6, 18);
  }

  function completeWave() {
    if (!S.waveActive) return;
    S.waveActive = false;
    const bonus = 32 + S.wave * 8;
    S.fish += bonus;
    S.score += bonus * 2;
    showToast(`Волна ${S.wave} отбита! +${bonus} рыбы`, 'good');
    addParticleBurst(sx(0), sy(-20), 26, '#ffd27f', 1.3, 34);
    sfxUpgrade();
    if (S.wave >= WAVES.length) {
      setTimeout(() => { if (S.mode === 'playing') finishGame(true); }, 650);
      return;
    }
    S.prep = 17;
    dom.nextWave.classList.remove('hidden');
    showBanner('ПЕРЕДЫШКА', 'Волна отбита', `Следующая атака через ${Math.round(S.prep)} секунд`);
    updateHud(true);
  }

  function finishGame(victory) {
    if (S.mode === 'ended') return;
    S.mode = 'ended';
    S.waveActive = false;
    dom.nextWave.classList.add('hidden');
    closeTowerPanel();
    if (S.score > S.best) {
      S.best = Math.round(S.score);
      localStorage.setItem('iceSealBest', String(S.best));
    }
    dom.endScreen.classList.toggle('defeat', !victory);
    dom.endKicker.textContent = victory ? 'ОБОРОНА ВЫДЕРЖАНА' : 'ЛЬДИНА РАСКОЛОТА';
    dom.endTitle.textContent = victory ? 'ЛЬДИНА СПАСЕНА' : 'ОБОРОНА ПАЛА';
    dom.endText.textContent = victory
      ? 'Тюлень гордо смотрит на горизонт. Косатки уплывают ни с чем. Северный полюс снова в безопасности.'
      : 'Льдина не выдержала натиска. Но у храброго тюленя всегда есть следующий шанс — соберите больше рыбы и укрепите оборону.';
    dom.endWaves.textContent = victory ? `${WAVES.length} / ${WAVES.length}` : `${Math.max(0, S.wave)} / ${WAVES.length}`;
    dom.endScore.textContent = String(S.score);
    dom.endBuilt.textContent = String(S.built);
    dom.endScreen.classList.remove('hidden');
    if (victory) {
      sfxWave();
      for (let i = 0; i < 4; i++) {
        setTimeout(() => addRing(0, 0, 40, FLOE_R * (1 + i * .15), 1.6, '#ffd27f', 4 - i * .5), i * 160);
      }
    } else sfxHurt();
  }

  function update(dt) {
    S.time += dt;
    const seal = S.seal;
    seal.anim += dt;
    seal.roarAnim = Math.max(0, seal.roarAnim - dt);
    S.roarCd = Math.max(0, S.roarCd - dt);
    S.damageFlash = Math.max(0, S.damageFlash - dt * 1.7);
    S.shake *= Math.pow(.001, dt);

    if (!S.waveActive) {
      if (S.wave < WAVES.length) {
        S.prep -= dt;
        if (S.prep <= 0) beginWave(S.wave + 1);
      }
    } else {
      S.spawnTimer -= dt;
      if (S.spawnTimer <= 0 && S.spawnQueue.length) {
        spawnOrca(S.spawnQueue.shift());
        S.spawnTimer = Math.max(.34, .95 - S.wave * .025);
      }
    }

    updateSealInput(dt);
    updateTowers(dt);
    updateProjectiles(dt);
    updateTraps(dt);
    updateOrcas(dt);
    updateEffects(dt);
    updatePickups(dt);
    updateParticles(dt);
    updateFloaters(dt);

    if (S.floe.regen > 0 && S.floe.hp < S.floe.maxHp) {
      S.floe.hp = Math.min(S.floe.maxHp, S.floe.hp + S.floe.regen * dt);
    }

    S.hudTimer -= dt;
    if (S.hudTimer <= 0) { updateHud(); S.hudTimer = .12; }
    S.cardTimer -= dt;
    if (S.cardTimer <= 0) { refreshCardAffordability(); S.cardTimer = .35; }

    if (S.waveActive && !S.spawnQueue.length && !S.orcas.some((o) => !o.dead)) completeWave();
  }

  function updateSealInput(dt) {
    const seal = S.seal;
    let ix = 0, iy = 0;
    if (S.keys.has('arrowleft') || S.keys.has('a') || S.keys.has('ф')) ix -= 1;
    if (S.keys.has('arrowright') || S.keys.has('d') || S.keys.has('в')) ix += 1;
    if (S.keys.has('arrowup') || S.keys.has('w') || S.keys.has('ц')) iy -= 1;
    if (S.keys.has('arrowdown') || S.keys.has('s') || S.keys.has('ы')) iy += 1;
    if (S.joy.active) { ix += S.joy.dx; iy += S.joy.dy; }
    if (S.tilt.enabled && !S.joy.active && !ix && !iy) { ix += S.tilt.x; iy += S.tilt.y; }
    const mag = Math.hypot(ix, iy);
    if (mag > 1) { ix /= mag; iy /= mag; }
    const speed = 148 * (1 + S.sealLvl.flippers * .1);
    const targetVx = ix * speed, targetVy = iy * speed;
    seal.vx = lerp(seal.vx, targetVx, Math.min(1, dt * 12));
    seal.vy = lerp(seal.vy, targetVy, Math.min(1, dt * 12));
    if (Math.hypot(seal.vx, seal.vy) < 2) { seal.vx = 0; seal.vy = 0; }
    seal.x += seal.vx * dt;
    seal.y += seal.vy * dt;
    const r = Math.hypot(seal.x, seal.y);
    const maxR = FLOE_R - 23;
    if (r > maxR) {
      seal.x = seal.x / r * maxR;
      seal.y = seal.y / r * maxR;
      seal.vx *= .5; seal.vy *= .5;
    }
    const moveMag = Math.hypot(seal.vx, seal.vy);
    if (moveMag > 12) {
      const targetFace = Math.atan2(seal.vy, seal.vx);
      seal.face = angleLerp(seal.face, targetFace, Math.min(1, dt * 7));
      seal.trail -= dt;
      if (seal.trail <= 0) {
        seal.trail = .075;
        addParticle(sx(seal.x - Math.cos(seal.face) * 10), sy(seal.y - Math.sin(seal.face) * 10), rand(-9, 9), rand(-6, 12), rand(.3, .6), rand(1, 2.6), 'rgba(225,252,255,.75)', .8);
      }
    } else if (seal.roarAnim <= 0) {
      seal.face = angleLerp(seal.face, Math.atan2(-seal.y, -seal.x) * .12 + seal.face * .88, dt * .18);
    }
  }

  function angleLerp(a, b, t) {
    const d = ((b - a + Math.PI) % TAU + TAU) % TAU - Math.PI;
    return a + d * t;
  }

  function findTarget(tower, range) {
    let best = null, bestScore = Infinity;
    for (const o of S.orcas) {
      if (o.dead) continue;
      const d = Math.hypot(o.x - tower.x, o.y - tower.y);
      if (d > range + o.radius * .35) continue;
      const score = Math.hypot(o.x, o.y) * 2 + d * .35;
      if (score < bestScore) { bestScore = score; best = o; }
    }
    return best;
  }

  function towerBuff(tower) {
    let dmg = 1, rate = 1;
    for (const b of S.towers) {
      if (b === tower || b.def.behavior !== 'support') continue;
      const range = b.def.range * (1 + .08 * (b.level - 1));
      if (Math.hypot(b.x - tower.x, b.y - tower.y) <= range) {
        dmg += b.def.buffDmg * (1 + .25 * (b.level - 1));
        rate += b.def.buffRate * (1 + .25 * (b.level - 1));
      }
    }
    return { dmg, rate };
  }

  function updateTowers(dt) {
    for (const t of S.towers) {
      t.recoil = Math.max(0, t.recoil - dt * 4);
      t.flash = Math.max(0, t.flash - dt * 5);
      t.aura += dt;
      if (t.def.behavior === 'support') {
        if (t.aura > 2.1) {
          t.aura = 0;
          addRing(t.x, t.y, 8, towerRange(t), .8, t.def.color, 1.4);
        }
        continue;
      }
      t.cooldown -= dt;
      const range = towerRange(t);
      const target = findTarget(t, range);
      if (target) {
        const desired = Math.atan2(target.y - t.y, target.x - t.x);
        t.angle = angleLerp(t.angle, desired, Math.min(1, dt * 9));
        if (t.cooldown <= 0) attackTower(t, target);
      }
    }
  }

  function attackTower(t, target) {
    const d = t.def;
    const buff = towerBuff(t);
    const dmg = towerDamage(t) * buff.dmg;
    const interval = towerInterval(t) / buff.rate;
    t.cooldown = interval;
    t.recoil = 1;
    t.flash = 1;
    const angle = Math.atan2(target.y - t.y, target.x - t.x);
    if (d.behavior === 'chain') {
      chainLightning(t, target, d, dmg, buff);
      sfxShoot('tesla');
      return;
    }
    if (d.behavior === 'pulse') {
      pulseTower(t, d, dmg, buff);
      sfxShoot(d.id === 'sonic' ? 'sonic' : 'spike');
      return;
    }
    if (d.behavior === 'multi') {
      const targets = S.orcas.filter((o) => !o.dead && Math.hypot(o.x - t.x, o.y - t.y) <= towerRange(t))
        .sort((a, b) => Math.hypot(a.x, a.y) - Math.hypot(b.x, b.y))
        .slice(0, d.targets || 1);
      for (const target2 of targets) spawnProjectile(t, target2, dmg, buff);
      sfxShoot('boomerang');
      return;
    }
    spawnProjectile(t, target, dmg, buff);
    sfxShoot(d.proj || 'snow');
    if (d.id === 'snow' || d.id === 'frost' || d.id === 'tar') {
      addParticle(sx(t.x + Math.cos(angle) * 24), sy(t.y + Math.sin(angle) * 24), Math.cos(angle) * rand(10, 30), Math.sin(angle) * rand(10, 30), .3, rand(2, 4), d.color, .6);
    }
  }

  function spawnProjectile(t, target, dmg, buff) {
    const d = t.def;
    S.projectiles.push({
      kind: d.proj, x: t.x + Math.cos(t.angle) * 20, y: t.y + Math.sin(t.angle) * 20,
      target, dmg, speed: d.projSpeed || 420, color: d.color, def: d,
      life: 2.6, spin: 0, trail: [], towerLevel: t.level, buff
    });
  }

  function chainLightning(tower, primary, def, dmg, buff) {
    const hit = [];
    let current = primary;
    let strength = dmg;
    const points = [{ x: tower.x, y: tower.y - 8 }, { x: primary.x, y: primary.y }];
    while (current && hit.length < (def.chain || 1)) {
      hit.push(current);
      damageOrca(current, strength, { color: def.color });
      strength *= .72;
      let next = null, best = Infinity;
      for (const o of S.orcas) {
        if (o.dead || hit.includes(o)) continue;
        const d = Math.hypot(o.x - primary.x, o.y - primary.y);
        if (d < (def.chainRange || 140) && d < best) { best = d; next = o; }
      }
      current = next;
      if (current) points.push({ x: current.x, y: current.y });
    }
    addEffect({ type: 'lightning', points, life: .24, maxLife: .24, color: def.color });
    addParticleBurst(sx(primary.x), sy(primary.y), 8, def.color, .5, 22);
  }

  function pulseTower(tower, def, dmg, buff) {
    const range = towerRange(tower);
    addRing(tower.x, tower.y, 10, range, .55, def.color, def.id === 'sonic' ? 4 : 3);
    for (const o of S.orcas) {
      if (o.dead) continue;
      const d = Math.hypot(o.x - tower.x, o.y - tower.y);
      if (d > range + o.radius) continue;
      damageOrca(o, dmg, { color: def.color });
      if (def.stun) o.stun = Math.max(o.stun, def.stun * (1 + .1 * (tower.level - 1)));
      if (def.knock) {
        const a = Math.atan2(o.y - tower.y, o.x - tower.x);
        const k = def.knock * (1 + .12 * (tower.level - 1));
        o.x += Math.cos(a) * k;
        o.y += Math.sin(a) * k;
      }
    }
    addParticleBurst(sx(tower.x), sy(tower.y), 12, def.color, .6, 24);
  }

  function projectileImpact(p) {
    const d = p.def;
    const target = p.target;
    if (!target || target.dead) return;
    if (p.kind === 'snow' || p.kind === 'frost' || p.kind === 'tar') {
      explodeAt(target.x, target.y, d.splash, p.dmg, d, p.color);
      if (d.slow) applyStatus(target, { slow: d.slow, slowDur: d.slowDur });
      sfxExplode(false);
    } else {
      damageOrca(target, p.dmg, { pierce: d.pierce, color: p.color });
      addParticleBurst(sx(target.x), sy(target.y), 6, p.color, .4, 18);
      if (p.kind === 'boomerang') {
        let extra = 0;
        for (const o of S.orcas) {
          if (o === target || o.dead || extra >= 2) continue;
          if (Math.hypot(o.x - target.x, o.y - target.y) < 64) {
            damageOrca(o, p.dmg * .7, { color: p.color });
            extra++;
          }
        }
      }
    }
  }

  function updateProjectiles(dt) {
    for (const p of S.projectiles) {
      p.life -= dt;
      p.spin += dt * 15;
      if (!p.target || p.target.dead) { p.life = Math.min(p.life, .06); continue; }
      const dx = p.target.x - p.x;
      const dy = p.target.y - p.y;
      const d = Math.hypot(dx, dy);
      if (d < p.target.radius + 7) { projectileImpact(p); p.life = 0; continue; }
      const vx = dx / d * p.speed;
      const vy = dy / d * p.speed;
      p.x += vx * dt;
      p.y += vy * dt;
      p.angle = Math.atan2(vy, vx);
      if (p.kind === 'harpoon' || p.kind === 'shard') {
        p.trail.push({ x: p.x, y: p.y, life: .16 });
        if (p.trail.length > 7) p.trail.shift();
      }
    }
    S.projectiles = S.projectiles.filter((p) => p.life > 0);
  }

  function explodeAt(x, y, radius, dmg, def, color) {
    addEffect({ type: 'explosion', x, y, radius, life: .38, maxLife: .38, color });
    for (const o of S.orcas) {
      if (o.dead) continue;
      const d = Math.hypot(o.x - x, o.y - y);
      if (d <= radius + o.radius * .4) damageOrca(o, dmg * (1 - .2 * (d / radius)), { color });
    }
    addParticleBurst(sx(x), sy(y), 14, color, .8, 34);
  }

  function applyStatus(o, status) {
    if (status.slow) {
      if (status.slow >= o.slowAmt) { o.slowAmt = status.slow; o.slow = Math.max(o.slow, status.slowDur || 2); }
    }
    if (status.stun) o.stun = Math.max(o.stun, status.stun);
    if (status.burn) { o.burn = Math.max(o.burn, status.burnDur || 2); o.burnDps = Math.max(o.burnDps, status.burn); }
    if (status.vulnerable) o.vulnerable = Math.max(o.vulnerable, status.vulnerable);
  }

  function damageOrca(o, amount, opts = {}) {
    if (o.dead) return;
    let dmg = amount;
    if (!opts.pierce) dmg *= 1 - (o.armor || 0);
    if (o.vulnerable > 0) dmg *= 1.32;
    o.hp -= dmg;
    o.hitFlash = .14;
    if (dmg >= 18 || Math.random() < .35) addFloater(o.x + rand(-8, 8), o.y - o.radius - 4, '-' + Math.round(dmg), opts.color || '#d9fbff', 11);
    if (Math.random() < .55) addParticleBurst(sx(o.x), sy(o.y), 3, opts.color || '#bdf4ff', .45, 16);
    if (o.hp <= 0) killOrca(o);
  }

  function killOrca(o) {
    if (o.dead) return;
    o.dead = true;
    S.score += Math.round(o.reward * (o.boss ? 3 : 1));
    addEffect({ type: 'sink', x: o.x, y: o.y, radius: o.radius, life: .8, maxLife: .8, color: '#bdefff' });
    addParticleBurst(sx(o.x), sy(o.y), o.boss ? 34 : 12, '#c9f4fa', o.boss ? 1.4 : .8, 32);
    const drops = Math.min(9, Math.max(1, Math.round(o.reward / 7)));
    for (let i = 0; i < drops; i++) {
      spawnPickup(o.reward / drops, o.x, o.y);
    }
    sfxExplode(o.boss);
    if (o.boss) {
      S.shake = Math.max(S.shake, 14);
      S.floe.hp = Math.min(S.floe.maxHp, S.floe.hp + 14);
      showToast('Вожак повержен! Льдина восстановлена на 14', 'good');
    }
  }

  function updateOrcas(dt) {
    for (const o of S.orcas) {
      if (o.dead) continue;
      o.hitFlash = Math.max(0, o.hitFlash - dt);
      o.attackPulse = Math.max(0, o.attackPulse - dt);
      o.stun = Math.max(0, o.stun - dt);
      o.vulnerable = Math.max(0, o.vulnerable - dt);
      if (o.slow > 0) {
        o.slow -= dt;
        if (o.slow <= 0) o.slowAmt = 0;
      }
      if (o.burn > 0) {
        o.burn -= dt;
        damageOrca(o, o.burnDps * dt, { pierce: true, color: '#ffb05c' });
        if (o.dead) continue;
        if (Math.random() < dt * 8) addParticle(sx(o.x + rand(-8, 8)), sy(o.y + rand(-8, 8)), rand(-3, 3), rand(-18, -4), .35, rand(1.4, 3), '#ffb05c', .2);
      }
      if (o.stun > 0) continue;

      let tx = 0, ty = 0;
      let taunted = false;
      let bestDecoy = null, bestDecoyD = 300;
      for (const trap of S.traps) {
        if (trap.def.kind !== 'decoy' || trap.life <= 0) continue;
        const d = Math.hypot(trap.x - o.x, trap.y - o.y);
        if (d < bestDecoyD) { bestDecoyD = d; bestDecoy = trap; }
      }
      if (bestDecoy) {
        const ang = Math.atan2(bestDecoy.y - o.y, bestDecoy.x - o.x);
        const orbit = Math.sin(S.time * 2 + o.seed) * 46;
        tx = bestDecoy.x + Math.cos(ang + Math.PI / 2) * orbit;
        ty = bestDecoy.y + Math.sin(ang + Math.PI / 2) * orbit;
        taunted = true;
      } else {
        const dc = Math.max(1, Math.hypot(o.x, o.y));
        const edge = FLOE_R + o.radius * .55 + 7;
        if (dc > edge) {
          const a = Math.atan2(-o.y, -o.x) + Math.sin(S.time * 1.2 + o.seed) * .13;
          tx = o.x + Math.cos(a) * 100;
          ty = o.y + Math.sin(a) * 100;
        } else {
          tx = 0; ty = 0;
          o.attackTimer -= dt;
          if (o.attackTimer <= 0) {
            o.attackTimer = o.attackCd;
            o.attackPulse = .35;
            o.bite = 1;
            damageFloe(o);
          }
        }
      }

      if (!taunted) {
        const dc = Math.hypot(o.x, o.y);
        if (dc <= FLOE_R + o.radius * .55 + 7) {
          o.angle = angleLerp(o.angle, Math.atan2(-o.y, -o.x), Math.min(1, dt * 6));
          continue;
        }
      }

      const dx = tx - o.x, dy = ty - o.y;
      const dd = Math.hypot(dx, dy);
      if (dd > 3) {
        const slowFactor = 1 - (o.slow > 0 ? o.slowAmt : 0);
        const speed = o.speed * slowFactor;
        const ang = Math.atan2(dy, dx);
        o.angle = angleLerp(o.angle, ang, Math.min(1, dt * 5));
        o.x += Math.cos(o.angle) * speed * dt;
        o.y += Math.sin(o.angle) * speed * dt;
      }
    }
    S.orcas = S.orcas.filter((o) => !o.dead);
  }

  function damageFloe(o) {
    const angle = Math.atan2(o.y, o.x);
    const dmg = o.damage;
    S.floe.hp -= dmg;
    S.shake = Math.max(S.shake, o.boss ? 11 : 4.5);
    S.damageFlash = Math.min(1, S.damageFlash + .24);
    addSplashAt(FLOE_R * Math.cos(angle), FLOE_R * Math.sin(angle), o.boss ? 28 : 15);
    addParticleBurst(sx(FLOE_R * Math.cos(angle)), sy(FLOE_R * Math.sin(angle)), o.boss ? 18 : 8, '#d9fbff', .8, 30);
    addFloater(FLOE_R * Math.cos(angle), FLOE_R * Math.sin(angle), '-' + dmg, '#ff9b8e', 12);
    sfxHurt();
    if (S.floe.hp <= 0) { S.floe.hp = 0; finishGame(false); }
  }

  function updateTraps(dt) {
    for (const t of S.traps) {
      t.age += dt;
      t.flash = Math.max(0, t.flash - dt * 2.2);
      if (t.def.kind === 'decoy') {
        t.life -= dt;
        if (t.life <= 0) {
          explodeAt(t.x, t.y, t.def.radius + 35, t.def.dmg, t.def, t.def.color);
          t.flash = 1;
          sfxExplode(true);
        }
        continue;
      }
      if (t.def.kind === 'oil' || t.def.kind === 'whirl') {
        t.life -= dt;
        for (const o of S.orcas) {
          if (o.dead) continue;
          const d = Math.hypot(o.x - t.x, o.y - t.y);
          if (d > t.def.radius) continue;
          if (t.def.kind === 'oil') {
            applyStatus(o, { slow: .45, slowDur: .5, vulnerable: .35 });
            damageOrca(o, 2.5 * dt, { pierce: true, color: '#c7a2ff' });
          } else {
            const ang = Math.atan2(t.y - o.y, t.x - o.x);
            o.x += Math.cos(ang) * 52 * dt;
            o.y += Math.sin(ang) * 52 * dt;
            applyStatus(o, { slow: .4, slowDur: .4 });
            damageOrca(o, 8 * dt, { pierce: true, color: '#93d8ff' });
          }
          if (o.dead) continue;
        }
        continue;
      }
      t.life -= dt;
      t.cooldown -= dt;
      if (t.life <= 0) continue;
      if (t.cooldown > 0) continue;
      let target = null, closest = Infinity;
      if (t.def.kind === 'mine' || t.def.kind === 'spike') {
        for (const o of S.orcas) {
          if (o.dead) continue;
          const d = Math.hypot(o.x - t.x, o.y - t.y);
          if (d < t.def.radius && d < closest) { closest = d; target = o; }
        }
      } else if (t.def.kind === 'net') {
        for (const o of S.orcas) {
          if (o.dead) continue;
          if (Math.hypot(o.x - t.x, o.y - t.y) < t.def.radius) { target = o; break; }
        }
      }
      if (!target) continue;
      t.flash = 1;
      if (t.def.kind === 'mine') {
        explodeAt(t.x, t.y, t.def.splash || 100, t.def.dmg, t.def, t.def.color);
        sfxExplode(true);
      } else if (t.def.kind === 'net') {
        for (const o of S.orcas) {
          if (o.dead) continue;
          if (Math.hypot(o.x - t.x, o.y - t.y) < t.def.radius) {
            applyStatus(o, { stun: t.def.stun, slow: .8, slowDur: t.def.stun });
            addRing(o.x, o.y, 8, 34, .5, '#9fe9ff', 2);
          }
        }
        addEffect({ type: 'net', x: t.x, y: t.y, radius: t.def.radius, life: .65, maxLife: .65, color: '#9fe9ff' });
        tone(190, .18, 'square', .035, 90);
      } else if (t.def.kind === 'spike') {
        for (const o of S.orcas) {
          if (o.dead) continue;
          if (Math.hypot(o.x - t.x, o.y - t.y) < t.def.radius) {
            damageOrca(o, t.def.dmg, { color: t.def.color });
            applyStatus(o, { burn: 5, burnDur: 2.4, slow: .3, slowDur: 1.5 });
          }
        }
        addRing(t.x, t.y, 6, t.def.radius, .45, t.def.color, 2);
        tone(720, .1, 'triangle', .035, 200);
      }
      t.charges--;
      t.cooldown = t.def.cooldown || 0;
      if (t.charges <= 0) t.life = Math.min(t.life, .3);
    }
    S.traps = S.traps.filter((t) => t.life > 0);
  }

  function spawnPickup(amount, fromX, fromY) {
    const a = Math.random() * TAU;
    const r = Math.sqrt(Math.random()) * FLOE_R * .72;
    S.pickups.push({
      amount, sx: fromX, sy: fromY, x: fromX, y: fromY,
      tx: Math.cos(a) * r, ty: Math.sin(a) * r, flight: rand(.55, .9), age: 0,
      landed: false, life: 11, bob: Math.random() * TAU, magnet: false
    });
  }

  function updatePickups(dt) {
    const seal = S.seal;
    const magnetRange = 44 + S.sealLvl.magnet * 32;
    for (const p of S.pickups) {
      p.age += dt;
      p.bob += dt * 5;
      if (!p.landed) {
        const t = clamp(p.age / p.flight, 0, 1);
        p.x = lerp(p.sx, p.tx, t);
        p.y = lerp(p.sy, p.ty, t);
        if (t >= 1) { p.landed = true; p.life = 11; }
      } else {
        p.life -= dt;
        const d = Math.hypot(seal.x - p.x, seal.y - p.y);
        if (d < magnetRange) {
          p.magnet = true;
          const pull = 340 + (magnetRange - d) * 5;
          const a = Math.atan2(seal.y - p.y, seal.x - p.x);
          p.x += Math.cos(a) * pull * dt;
          p.y += Math.sin(a) * pull * dt;
        }
        if (d < 22) {
          const gain = Math.max(1, Math.round(p.amount * (1 + S.sealLvl.nose * .12)));
          S.fish += gain;
          S.score += gain;
          p.life = 0;
          addFloater(p.x, p.y - 8, '+' + gain, '#ffd27f', 14);
          addParticleBurst(sx(p.x), sy(p.y), 6, '#ffd27f', .5, 18);
          sfxCollect();
          dom.fishValue.animate([{ transform: 'scale(1.28)' }, { transform: 'scale(1)' }], { duration: 220, easing: 'ease-out' });
        }
      }
    }
    S.pickups = S.pickups.filter((p) => p.life > 0);
  }

  function updateEffects(dt) {
    for (const e of S.effects) {
      e.life -= dt;
      if (e.type === 'sink') {
        e.y += dt * 8;
        e.radius -= dt * 4;
      }
    }
    S.effects = S.effects.filter((e) => e.life > 0);
  }

  function addEffect(e) { S.effects.push(e); }

  function addParticle(x, y, vx, vy, life, size, color, gravity = 0) {
    S.particles.push({ x, y, vx, vy, life, maxLife: life, size, color, gravity });
  }

  function addParticleBurst(x, y, count, color, power = 1, size = 20) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * TAU;
      const sp = rand(12, 90) * power;
      addParticle(x, y, Math.cos(a) * sp, Math.sin(a) * sp, rand(.3, .85), rand(1.2, 3.2) * (size / 24), color, rand(15, 70));
    }
  }

  function addRing(x, y, r0, r1, life, color, width) {
    addEffect({ type: 'ring', x, y, r0, r1, life, maxLife: life, color, width });
  }

  function addSplashAt(x, y, size) {
    addEffect({ type: 'splash', x, y, radius: size, life: .55, maxLife: .55, color: '#d9fbff' });
  }

  function addFloater(x, y, text, color, size) {
    S.floaters.push({ x, y, text, color, size, life: .9, maxLife: .9 });
  }

  function updateParticles(dt) {
    for (const p of S.particles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= Math.pow(.18, dt);
      p.vy *= Math.pow(.18, dt);
      p.vy += p.gravity * dt;
    }
    S.particles = S.particles.filter((p) => p.life > 0);
  }

  function updateFloaters(dt) {
    for (const f of S.floaters) {
      f.life -= dt;
      f.y -= 26 * dt;
    }
    S.floaters = S.floaters.filter((f) => f.life > 0);
  }

  function showToast(text, type = '') {
    dom.toast.textContent = text;
    dom.toast.className = 'toast show ' + type;
    clearTimeout(S.toastTimer);
    S.toastTimer = setTimeout(() => dom.toast.classList.remove('show'), 2600);
  }

  function showBanner(kicker, title, sub) {
    dom.waveBannerKicker.textContent = kicker;
    dom.waveBannerTitle.textContent = title;
    dom.waveBannerSub.textContent = sub;
    dom.waveBanner.classList.add('show');
    clearTimeout(S.waveBannerTimer);
    S.waveBannerTimer = setTimeout(() => dom.waveBanner.classList.remove('show'), 3100);
  }

  function updateHud(force = false) {
    if (!force && S.mode === 'menu') return;
    const shownWave = clamp(S.waveActive ? S.wave : S.wave + 1, 1, WAVES.length);
    dom.waveValue.textContent = shownWave + ' / ' + WAVES.length;
    if (S.waveActive) {
      const left = S.spawnQueue.length + S.orcas.filter((o) => !o.dead).length;
      dom.waveState.textContent = left + ' косаток';
    } else {
      dom.waveState.textContent = S.mode === 'playing' ? 'подготовка ' + Math.max(0, Math.ceil(S.prep)) + 'с' : 'оборона';
    }
    dom.fishValue.textContent = String(Math.floor(S.fish));
    dom.scoreValue.textContent = String(S.score);
    dom.iceText.textContent = Math.ceil(S.floe.hp) + ' / ' + S.floe.maxHp;
    const pct = clamp(S.floe.hp / S.floe.maxHp * 100, 0, 100);
    dom.iceFill.style.width = pct + '%';
    dom.iceFill.classList.toggle('low', pct < 34);
    if (S.mode === 'playing' && !S.waveActive) {
      dom.nextWave.classList.remove('hidden');
      dom.nextWaveLabel.textContent = `Подготовка · ${Math.max(0, Math.ceil(S.prep))}с`;
    } else dom.nextWave.classList.add('hidden');
    if (S.selectedTower) updateTowerPanel();
    updateRoarButton();
  }

  function updateRoarButton() {
    const ready = S.roarCd <= 0;
    dom.btnRoar.classList.toggle('ready', ready && S.mode === 'playing');
    dom.btnRoar.classList.toggle('cooling', !ready);
    if (!ready) {
      const pct = Math.min(100, (S.roarCd / 11) * 100);
      dom.btnRoar.style.setProperty('--cd', pct.toFixed(1) + '%');
      dom.roarCd.textContent = Math.ceil(S.roarCd);
    } else {
      dom.btnRoar.style.setProperty('--cd', '0%');
      dom.roarCd.textContent = '';
    }
  }

  function doRoar() {
    if (S.mode !== 'playing' || S.roarCd > 0) return;
    const seal = S.seal;
    const level = S.sealLvl.roar;
    const radius = 182 * (1 + level * .15);
    const dmg = 9 + level * 7;
    S.roarCd = Math.max(7.2, 11.5 - level * .75);
    seal.roarAnim = .7;
    addRing(seal.x, seal.y, 18, radius, .9, '#ffe1a0', 5);
    addRing(seal.x, seal.y, 10, radius * .68, .6, '#b9f6ff', 3);
    addEffect({ type: 'shockwave', x: seal.x, y: seal.y, radius, life: .5, maxLife: .5, color: '#ffe1a0' });
    S.shake = Math.max(S.shake, 6);
    for (const o of S.orcas) {
      if (o.dead) continue;
      const d = Math.hypot(o.x - seal.x, o.y - seal.y);
      if (d > radius) continue;
      damageOrca(o, dmg, { color: '#ffe1a0' });
      applyStatus(o, { stun: 1.5 + level * .18 });
      const a = Math.atan2(o.y, o.x);
      const push = 36 + level * 7;
      o.x += Math.cos(a) * push;
      o.y += Math.sin(a) * push;
    }
    addFloater(seal.x, seal.y - 30, 'РЁВ!', '#ffe1a0', 18);
    sfxRoar();
    updateRoarButton();
  }

  // ================= Rendering =================

  function render() {
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, W, H);
    drawSea();
    const shake = S.shake;
    const ox = shake ? rand(-shake, shake) : 0;
    const oy = shake ? rand(-shake, shake) : 0;
    ctx.save();
    ctx.translate(camX + ox, camY + oy);
    ctx.scale(scale, scale);
    drawWorld();
    ctx.restore();
    drawParticles();
    drawSnowLayer();
    if (S.damageFlash > 0) {
      const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .2, W / 2, H / 2, Math.max(W, H) * .72);
      g.addColorStop(0, 'rgba(255,60,50,0)');
      g.addColorStop(1, `rgba(255,60,50,${S.damageFlash * .28})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }
  }

  function drawSea() {
    const t = S.visual;
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#041925');
    bg.addColorStop(.45, '#063246');
    bg.addColorStop(1, '#05283b');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    const glow = ctx.createRadialGradient(camX, camY, 30, camX, camY, Math.max(W, H) * .62);
    glow.addColorStop(0, 'rgba(28, 133, 157, .28)');
    glow.addColorStop(.5, 'rgba(12, 77, 101, .12)');
    glow.addColorStop(1, 'rgba(2, 16, 25, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (let band = 0; band < 3; band++) {
      const y = H * (.08 + band * .075) + Math.sin(t * .18 + band) * 18;
      const g = ctx.createLinearGradient(0, y, W, y + H * .1);
      if (band === 0) { g.addColorStop(0, 'rgba(70,255,204,0)'); g.addColorStop(.45, 'rgba(76,248,211,.09)'); g.addColorStop(1, 'rgba(70,255,204,0)'); }
      else if (band === 1) { g.addColorStop(0, 'rgba(75,192,255,0)'); g.addColorStop(.55, 'rgba(82,184,255,.075)'); g.addColorStop(1, 'rgba(75,192,255,0)'); }
      else { g.addColorStop(0, 'rgba(204,102,255,0)'); g.addColorStop(.5, 'rgba(179,102,255,.055)'); g.addColorStop(1, 'rgba(204,102,255,0)'); }
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x <= W; x += 80) {
        const yy = y + Math.sin(x * .004 + t * .28 + band * 1.7) * (24 + band * 8);
        ctx.lineTo(x, yy);
      }
      ctx.lineTo(W, y + H * .09);
      ctx.lineTo(0, y + H * .07);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    for (const w of BG_WAVES) {
      const x = ((w.x + t * w.sp) % 1.15 - .08) * W;
      const y = w.y * H;
      ctx.strokeStyle = `rgba(196,243,255,${w.a * (.6 + .4 * Math.sin(t * .8 + w.p))})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + w.len * .5, y - 4, x + w.len, y);
      ctx.stroke();
    }

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.strokeStyle = 'rgba(159, 239, 252, .06)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      const r = floeScreenR + 30 + i * 44 + Math.sin(t * .35 + i) * 6;
      ctx.beginPath();
      ctx.arc(camX, camY, r, t * .06 + i * .7, t * .06 + i * .7 + Math.PI * 1.25);
      ctx.stroke();
    }
    ctx.restore();
  }

  function floePath() {
    ctx.beginPath();
    FLOE_POINTS.forEach((p, i) => {
      const x = Math.cos(p.a) * p.r;
      const y = Math.sin(p.a) * p.r;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.closePath();
  }

  function drawWorld() {
    const t = S.visual;
    drawFloatingIce(t);
    drawTraps();
    drawOrcas();
    drawFloe(t);
    drawSockets(t);
    drawTowers(t);
    drawPickups(t);
    drawProjectiles();
    drawEffects();
    drawSeal(t);
    drawFloaters();
  }

  function drawFloatingIce(t) {
    for (const f of FLOAT_ICE) {
      const bob = Math.sin(t * .35 + f.rot) * 3;
      ctx.save();
      ctx.translate(f.x, f.y + bob);
      ctx.rotate(f.rot + f.sp * t);
      ctx.fillStyle = `rgba(213, 249, 255, ${f.a * .42})`;
      ctx.strokeStyle = `rgba(225, 253, 255, ${f.a})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = i / 6 * TAU;
        const rr = f.s * (.72 + .28 * Math.sin(i * 2.7 + f.rot));
        const x = Math.cos(a) * rr, y = Math.sin(a) * rr;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawFloe(t) {
    ctx.save();
    ctx.translate(4, 9);
    floePath();
    ctx.fillStyle = 'rgba(0, 10, 17, .32)';
    ctx.filter = 'blur(9px)';
    ctx.fill();
    ctx.filter = 'none';
    ctx.restore();

    ctx.save();
    ctx.translate(0, 4);
    floePath();
    ctx.strokeStyle = 'rgba(160, 234, 248, .18)';
    ctx.lineWidth = 12;
    ctx.stroke();
    ctx.restore();

    floePath();
    const g = ctx.createRadialGradient(-60, -70, 24, 0, 0, FLOE_R);
    g.addColorStop(0, '#eeffff');
    g.addColorStop(.3, '#d6f8ff');
    g.addColorStop(.66, '#b4eaf6');
    g.addColorStop(.87, '#90d9e9');
    g.addColorStop(1, '#70c0d4');
    ctx.fillStyle = g;
    ctx.fill();

    ctx.save();
    floePath();
    ctx.clip();

    ctx.globalAlpha = .34;
    const g2 = ctx.createLinearGradient(-FLOE_R, -FLOE_R, FLOE_R, FLOE_R);
    g2.addColorStop(0, '#ffffff');
    g2.addColorStop(.35, 'rgba(255,255,255,.2)');
    g2.addColorStop(.65, 'rgba(76,177,200,.2)');
    g2.addColorStop(1, 'rgba(31,116,143,.38)');
    ctx.fillStyle = g2;
    ctx.fillRect(-FLOE_R, -FLOE_R, FLOE_R * 2, FLOE_R * 2);

    for (const drift of [{ x: -122, y: -62, r: 82 }, { x: 88, y: 52, r: 66 }, { x: 12, y: -122, r: 44 }, { x: -80, y: 102, r: 38 }]) {
      const dg = ctx.createRadialGradient(drift.x, drift.y, 2, drift.x, drift.y, drift.r);
      dg.addColorStop(0, 'rgba(255,255,255,.8)');
      dg.addColorStop(.7, 'rgba(245,255,255,.25)');
      dg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = dg;
      ctx.beginPath();
      ctx.arc(drift.x, drift.y, drift.r, 0, TAU);
      ctx.fill();
    }

    for (const crack of CRACKS) {
      ctx.beginPath();
      crack.forEach((pt, i) => {
        const x = pt[0] * FLOE_R, y = pt[1] * FLOE_R;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = 'rgba(45, 125, 150, .32)';
      ctx.lineWidth = 2.3;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(239, 255, 255, .38)';
      ctx.lineWidth = .8;
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
    ctx.strokeStyle = 'rgba(242, 255, 255, .8)';
    ctx.lineWidth = 3;
    floePath();
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = .35;
    ctx.strokeStyle = '#f4ffff';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, 0, FLOE_R - 20, 0, TAU);
    ctx.stroke();
    ctx.restore();

    const hpFrac = clamp(S.floe.hp / S.floe.maxHp, 0, 1);
    if (hpFrac < .55) {
      ctx.save();
      ctx.globalAlpha = .1 + (1 - hpFrac) * .3;
      ctx.strokeStyle = '#ff7a70';
      ctx.lineWidth = 2;
      for (let i = 0; i < 5; i++) {
        const a = i * 1.3 + .5;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * FLOE_R * .35, Math.sin(a) * FLOE_R * .35);
        ctx.lineTo(Math.cos(a + .05) * FLOE_R * .7, Math.sin(a + .05) * FLOE_R * .7);
        ctx.lineTo(Math.cos(a - .05) * FLOE_R * .93, Math.sin(a - .05) * FLOE_R * .93);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  function drawSockets(t) {
    const building = S.selectedCard && S.selectedCard.cat === 'towers';
    for (const s of S.sockets) {
      const empty = !s.tower;
      const selected = S.selectedSocket === s;
      ctx.save();
      ctx.translate(s.x, s.y);
      if (s.locked) {
        ctx.fillStyle = 'rgba(23, 83, 101, .28)';
        ctx.strokeStyle = 'rgba(185, 240, 250, .16)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(0, 0, 24, 0, TAU);
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = 'rgba(183, 239, 249, .35)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, -3, 5, Math.PI, 0);
        ctx.stroke();
        ctx.strokeRect(-6, -3, 12, 10);
        ctx.restore();
        continue;
      }
      const pulse = building && empty ? .5 + .5 * Math.sin(t * 4 + s.angle * 2) : 0;
      if (!empty) {
        ctx.fillStyle = 'rgba(5, 42, 57, .35)';
        ctx.beginPath();
        ctx.arc(0, 3, 27, 0, TAU);
        ctx.fill();
        ctx.fillStyle = 'rgba(9, 65, 82, .65)';
        ctx.strokeStyle = selected ? 'rgba(255, 214, 128, .7)' : 'rgba(185, 244, 255, .22)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, 23, 0, TAU);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillStyle = `rgba(16, 77, 93, ${.26 + pulse * .2})`;
        ctx.strokeStyle = building ? `rgba(255, 215, 132, ${.4 + pulse * .45})` : 'rgba(180, 240, 250, .27)';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(0, 0, 22, 0, TAU);
        ctx.fill();
        ctx.stroke();
        ctx.setLineDash([3, 5]);
        ctx.strokeStyle = building ? `rgba(255, 227, 164, ${.35 + pulse * .4})` : 'rgba(189, 243, 252, .16)';
        ctx.beginPath();
        ctx.arc(0, 0, 28, 0, TAU);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = building ? `rgba(255, 230, 170, ${.7 + pulse * .3})` : 'rgba(212, 248, 255, .48)';
        ctx.fillRect(-1.2, -6, 2.4, 12);
        ctx.fillRect(-6, -1.2, 12, 2.4);
      }
      if (selected && empty) {
        ctx.strokeStyle = 'rgba(255, 226, 158, .8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 32 + Math.sin(t * 5) * 2, 0, TAU);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  function drawTowers(t) {
    for (const tower of S.towers) {
      const d = tower.def;
      const selected = S.selectedTower === tower;
      ctx.save();
      ctx.translate(tower.x, tower.y);
      if (selected) {
        ctx.strokeStyle = d.color + 'aa';
        ctx.lineWidth = 1.6;
        ctx.setLineDash([5, 6]);
        ctx.beginPath();
        ctx.arc(0, 0, towerRange(tower), 0, TAU);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      const buff = towerBuff(tower);
      if (buff.rate > 1.02) {
        ctx.strokeStyle = 'rgba(126, 255, 201, .38)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, 27 + Math.sin(t * 3 + tower.x) * 1.5, 0, TAU);
        ctx.stroke();
      }
      ctx.shadowColor = d.color;
      ctx.shadowBlur = 12;
      drawTowerBody(tower, t);
      ctx.shadowBlur = 0;
      ctx.restore();
    }
  }

  function drawTowerBody(tower, t) {
    const d = tower.def;
    const lvl = tower.level;
    const recoil = tower.recoil * 6;
    const flash = tower.flash;
    const accent = d.color;

    ctx.fillStyle = 'rgba(3, 24, 33, .42)';
    ctx.beginPath();
    ctx.ellipse(2, 8, 27, 13, 0, 0, TAU);
    ctx.fill();

    ctx.fillStyle = '#0b3b4e';
    ctx.strokeStyle = 'rgba(194, 247, 255, .4)';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * TAU + Math.PI / 6;
      const x = Math.cos(a) * 23, y = Math.sin(a) * 23;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = 'rgba(126, 219, 236, .3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, 17, 0, TAU);
    ctx.stroke();

    ctx.save();
    ctx.rotate(tower.angle);
    ctx.translate(-recoil, 0);
    if (d.id === 'snow') {
      ctx.fillStyle = '#e8fcff';
      ctx.beginPath();
      ctx.ellipse(-3, 0, 13, 10, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#bceef7';
      ctx.beginPath();
      ctx.ellipse(-7, 4, 8, 5, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(12, 0, 7 + flash * 1.4, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = '#91dce9';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = '#0a2c3b';
      ctx.beginPath();
      ctx.arc(14, -2, 1, 0, TAU);
      ctx.fill();
    } else if (d.id === 'harpoon') {
      ctx.fillStyle = '#153f4f';
      ctx.beginPath();
      ctx.ellipse(-2, 0, 15, 9, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = '#ffd37e';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(-5, -8);
      ctx.quadraticCurveTo(10, -14, 22, 0);
      ctx.quadraticCurveTo(10, 14, -5, 8);
      ctx.stroke();
      ctx.strokeStyle = '#d8f5ff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-9, 0);
      ctx.lineTo(23 + recoil * 1.4, 0);
      ctx.stroke();
      ctx.fillStyle = '#ffd37e';
      ctx.beginPath();
      ctx.moveTo(27 + recoil * 1.4, 0);
      ctx.lineTo(18, -4);
      ctx.lineTo(20, 0);
      ctx.lineTo(18, 4);
      ctx.closePath();
      ctx.fill();
    } else if (d.id === 'shard') {
      ctx.fillStyle = '#134a5f';
      ctx.beginPath();
      ctx.arc(-3, 0, 13, 0, TAU);
      ctx.fill();
      for (let i = -1; i <= 1; i++) {
        ctx.save();
        ctx.rotate(i * .24);
        ctx.fillStyle = i === 0 ? '#e5ffff' : '#8af0ff';
        ctx.beginPath();
        ctx.moveTo(4, -3);
        ctx.lineTo(25 + (i === 0 ? 6 : 0), 0);
        ctx.lineTo(4, 3);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(4, 0, 4 + flash * 2, 0, TAU);
      ctx.fill();
    } else if (d.id === 'frost') {
      ctx.fillStyle = '#175c73';
      ctx.beginPath();
      ctx.arc(-3, 0, 14, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#8fdfff';
      ctx.strokeStyle = '#d9fbff';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.roundRect(1, -7, 19, 14, 5);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ecffff';
      ctx.beginPath();
      ctx.arc(21, 0, 6 + flash * 2, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = '#72d8f1';
      for (let i = 0; i < 6; i++) {
        const a = i / 6 * TAU + t * .7;
        ctx.beginPath();
        ctx.moveTo(21, 0);
        ctx.lineTo(21 + Math.cos(a) * 9, Math.sin(a) * 9);
        ctx.stroke();
      }
    } else if (d.id === 'tesla') {
      ctx.fillStyle = '#2a3058';
      ctx.beginPath();
      ctx.arc(0, 0, 13, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = '#a98cff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, TAU);
      ctx.stroke();
      const orb = 5 + Math.sin(t * 5) * 1.2;
      ctx.fillStyle = '#dfd2ff';
      ctx.beginPath();
      ctx.arc(0, 0, orb, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = 'rgba(224, 208, 255, .8)';
      ctx.lineWidth = 1.2;
      for (let i = 0; i < 3; i++) {
        const a = t * 2 + i * 2.1;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 5, Math.sin(a) * 5);
        ctx.lineTo(Math.cos(a + .5) * 14, Math.sin(a + .5) * 14);
        ctx.lineTo(Math.cos(a + .9) * 9, Math.sin(a + .9) * 9);
        ctx.stroke();
      }
    } else if (d.id === 'sonic') {
      ctx.fillStyle = '#654c25';
      ctx.beginPath();
      ctx.arc(0, 0, 13, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#ffd88d';
      ctx.strokeStyle = '#fff1c4';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-8, -9);
      ctx.quadraticCurveTo(12, -12, 13, 0);
      ctx.quadraticCurveTo(12, 12, -8, 9);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#b8862d';
      ctx.beginPath();
      ctx.arc(0, 9, 4, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = `rgba(255, 226, 153, ${.25 + flash * .5})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(2, 0, 18 + flash * 6, -.8, .8);
      ctx.stroke();
    } else if (d.id === 'tar') {
      ctx.fillStyle = '#3d251c';
      ctx.beginPath();
      ctx.arc(-2, 0, 14, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#1a1110';
      ctx.strokeStyle = '#ff9b61';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.arc(-1, 0, 10, 0, TAU);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ffb05c';
      for (let i = 0; i < 3; i++) {
        const a = t * 1.8 + i * 2.1;
        ctx.beginPath();
        ctx.arc(-1 + Math.cos(a) * 4, Math.sin(a) * 4, 1.8, 0, TAU);
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(255, 154, 75, .75)';
      ctx.beginPath();
      ctx.arc(7, -7, 3 + Math.sin(t * 6) * 1, 0, TAU);
      ctx.fill();
    } else if (d.id === 'spike') {
      ctx.fillStyle = '#1c5c69';
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, TAU);
      ctx.fill();
      for (let i = 0; i < 8; i++) {
        const a = i / 8 * TAU + t * .12;
        const len = 17 + Math.sin(t * 3 + i) * 2 + flash * 6;
        ctx.fillStyle = i % 2 ? '#b9fff1' : '#7bd9d6';
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 6, Math.sin(a) * 6);
        ctx.lineTo(Math.cos(a + .18) * len, Math.sin(a + .18) * len);
        ctx.lineTo(Math.cos(a + .37) * 6, Math.sin(a + .37) * 6);
        ctx.closePath();
        ctx.fill();
      }
    } else if (d.id === 'beacon') {
      ctx.fillStyle = '#174f50';
      ctx.beginPath();
      ctx.arc(0, 0, 13, 0, TAU);
      ctx.fill();
      const glow = .35 + Math.sin(t * 2.4) * .12;
      const cg = ctx.createRadialGradient(0, 0, 2, 0, 0, 28);
      cg.addColorStop(0, 'rgba(158,255,210,.9)');
      cg.addColorStop(.35, `rgba(105,245,188,${glow})`);
      cg.addColorStop(1, 'rgba(105,245,188,0)');
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.arc(0, 0, 28, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#d8ffec';
      ctx.strokeStyle = '#7ff0c8';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, -17);
      ctx.lineTo(7, -6);
      ctx.lineTo(4, 8);
      ctx.lineTo(0, 13);
      ctx.lineTo(-4, 8);
      ctx.lineTo(-7, -6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = 'rgba(142, 255, 207, .55)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 4; i++) {
        const a = -Math.PI / 2 + i * Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 15, Math.sin(a) * 15);
        ctx.lineTo(Math.cos(a) * 21, Math.sin(a) * 21);
        ctx.stroke();
      }
    } else if (d.id === 'boomerang') {
      ctx.fillStyle = '#554052';
      ctx.beginPath();
      ctx.arc(0, 0, 13, 0, TAU);
      ctx.fill();
      const spin = t * 1.4;
      ctx.strokeStyle = '#ffc7e6';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 9, spin, spin + Math.PI * 1.15);
      ctx.stroke();
      ctx.strokeStyle = '#ff9fd3';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(0, 0, 14, -spin, -spin + Math.PI * .9);
      ctx.stroke();
      ctx.fillStyle = '#ffe5f2';
      ctx.beginPath();
      ctx.arc(0, 0, 3, 0, TAU);
      ctx.fill();
    }
    ctx.restore();

    for (let i = 0; i < lvl; i++) {
      const a = -Math.PI / 2 + (i - (lvl - 1) / 2) * .38;
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * 16, Math.sin(a) * 16 + 12, 2.1, 0, TAU);
      ctx.fill();
    }
  }

  function drawOrcas() {
    for (const o of S.orcas) {
      if (o.dead) continue;
      const r = o.radius;
      const bob = Math.sin(S.visual * 2.2 + o.seed) * 2;
      ctx.save();
      ctx.translate(o.x, o.y + bob);
      const bite = o.attackPulse > 0 ? Math.sin((1 - o.attackPulse / .35) * Math.PI) * 7 : 0;
      ctx.rotate(o.angle);
      ctx.translate(bite, 0);
      ctx.fillStyle = 'rgba(0, 12, 20, .26)';
      ctx.beginPath();
      ctx.ellipse(-3, 5, r * 1.75, r * .78, 0, 0, TAU);
      ctx.fill();

      const tailWave = Math.sin(S.visual * 6 + o.seed) * .2;
      ctx.save();
      ctx.translate(-r * 1.35, 0);
      ctx.rotate(tailWave);
      ctx.fillStyle = o.def.color;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-r * .42, -r * .15, -r * .62, -r * .6);
      ctx.quadraticCurveTo(-r * .32, -r * .42, -r * .1, -r * .1);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-r * .42, r * .15, -r * .62, r * .6);
      ctx.quadraticCurveTo(-r * .32, r * .42, -r * .1, r * .1);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = o.hitFlash > 0 ? '#f2ffff' : o.def.color;
      ctx.beginPath();
      ctx.moveTo(r * 1.48, 0);
      ctx.bezierCurveTo(r * 1.05, -r * .72, -r * .5, -r * .82, -r * 1.38, 0);
      ctx.bezierCurveTo(-r * .5, r * .82, r * 1.05, r * .72, r * 1.48, 0);
      ctx.fill();

      ctx.fillStyle = o.kind === 'boss' ? '#dff9ff' : o.def.accent;
      ctx.beginPath();
      ctx.ellipse(r * .48, r * .12, r * .2, r * .12, -.2, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(-r * .1, r * .28, r * .34, r * .14, .08, 0, TAU);
      ctx.fill();

      ctx.fillStyle = 'rgba(230, 252, 255, .9)';
      ctx.beginPath();
      ctx.ellipse(r * .92, -r * .2, r * .22, r * .12, -.2, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#031921';
      ctx.beginPath();
      ctx.arc(r * 1.0, -r * .22, r * .07, 0, TAU);
      ctx.fill();

      ctx.fillStyle = o.def.color;
      ctx.strokeStyle = 'rgba(226, 252, 255, .28)';
      ctx.lineWidth = .8;
      ctx.beginPath();
      ctx.moveTo(r * .12, -r * .4);
      ctx.quadraticCurveTo(-r * .06, -r * 1.02, -r * .45, -r * 1.15);
      ctx.quadraticCurveTo(-r * .32, -r * .48, -r * .45, -r * .2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = 'rgba(216, 249, 255, .38)';
      ctx.lineWidth = Math.max(.8, r * .035);
      ctx.beginPath();
      ctx.moveTo(-r * .8, -r * .1);
      ctx.quadraticCurveTo(-r * .1, -r * .3, r * .45, -r * .16);
      ctx.stroke();
      ctx.restore();

      if (o.hp < o.maxHp || o.boss) {
        const w = Math.max(26, r * 2.2);
        const y = o.y - r - 12;
        ctx.fillStyle = 'rgba(2, 15, 23, .75)';
        ctx.beginPath();
        ctx.roundRect(o.x - w / 2, y, w, o.boss ? 6 : 4, 3);
        ctx.fill();
        const hpw = clamp(o.hp / o.maxHp, 0, 1) * w;
        const hg = ctx.createLinearGradient(o.x - w / 2, 0, o.x + w / 2, 0);
        hg.addColorStop(0, o.boss ? '#ffb45e' : '#5de5f0');
        hg.addColorStop(1, o.boss ? '#ff6a5e' : '#a5fbff');
        ctx.fillStyle = hg;
        ctx.beginPath();
        ctx.roundRect(o.x - w / 2, y, hpw, o.boss ? 6 : 4, 3);
        ctx.fill();
      }

      if (o.boss) {
        ctx.save();
        ctx.textAlign = 'center';
        ctx.font = '700 10px "Trebuchet MS", sans-serif';
        ctx.fillStyle = '#ffe0a0';
        ctx.shadowColor = 'rgba(0,0,0,.8)';
        ctx.shadowBlur = 4;
        ctx.fillText(o.bossName.toUpperCase(), o.x, o.y - r - 20);
        ctx.restore();
      }

      if (o.stun > 0) {
        ctx.strokeStyle = 'rgba(255, 230, 144, .75)';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 3; i++) {
          const a = S.visual * 3 + i * 2.1;
          ctx.beginPath();
          ctx.arc(o.x + Math.cos(a) * 15, o.y - r - 8 + Math.sin(a) * 4, 2.2, 0, TAU);
          ctx.stroke();
        }
      }
      if (o.slow > 0) {
        ctx.strokeStyle = 'rgba(132, 226, 255, .34)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(o.x, o.y, r * 1.5, 0, TAU);
        ctx.stroke();
      }
      if (o.vulnerable > 0) {
        ctx.strokeStyle = 'rgba(195, 145, 255, .38)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(o.x, o.y, r * 1.7, 0, TAU);
        ctx.stroke();
      }
    }
  }

  function drawSeal(t) {
    const seal = S.seal;
    const moving = Math.hypot(seal.vx, seal.vy) > 14;
    const bob = Math.sin(t * (moving ? 10 : 2.5) + seal.anim) * (moving ? 1.6 : .7);
    ctx.save();
    ctx.translate(seal.x, seal.y + bob);
    ctx.fillStyle = 'rgba(0, 22, 31, .34)';
    ctx.beginPath();
    ctx.ellipse(0, 8, 24, 11, 0, 0, TAU);
    ctx.fill();
    ctx.rotate(seal.face);
    const paddle = Math.sin(t * (moving ? 12 : 2.2)) * (moving ? 5 : 1.2);

    ctx.fillStyle = '#7eaab9';
    ctx.beginPath();
    ctx.ellipse(-13, -8, 8, 3.5, -.4, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-13, 8, 8, 3.5, .4, 0, TAU);
    ctx.fill();

    const bodyGrad = ctx.createLinearGradient(-18, -12, 16, 13);
    bodyGrad.addColorStop(0, '#e8fbff');
    bodyGrad.addColorStop(.4, '#b9dce5');
    bodyGrad.addColorStop(1, '#7eaab9');
    ctx.fillStyle = bodyGrad;
    ctx.strokeStyle = 'rgba(240, 255, 255, .7)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(-2, 0, 21, 14, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#a9cdd7';
    ctx.beginPath();
    ctx.ellipse(-19, -7 + paddle * .2, 8, 3.4, -.35 + paddle * .04, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-19, 7 - paddle * .2, 8, 3.4, .35 - paddle * .04, 0, TAU);
    ctx.fill();

    ctx.fillStyle = '#e0f4f8';
    ctx.beginPath();
    ctx.ellipse(14, -1, 11, 10, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(250, 255, 255, .7)';
    ctx.stroke();

    ctx.fillStyle = '#d94f4b';
    ctx.beginPath();
    ctx.ellipse(5, 0, 4, 11, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#ff8b78';
    ctx.beginPath();
    ctx.moveTo(6, 7);
    ctx.lineTo(13, 14);
    ctx.lineTo(5, 12);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#e7f8fb';
    ctx.beginPath();
    ctx.ellipse(19, 0, 5, 6.5, 0, 0, TAU);
    ctx.fill();

    ctx.fillStyle = '#183745';
    ctx.beginPath();
    ctx.arc(17, -5, 1.5, 0, TAU);
    ctx.arc(17, 5, 1.5, 0, TAU);
    ctx.fill();

    ctx.fillStyle = '#0f2a36';
    ctx.beginPath();
    ctx.ellipse(23, 0, 2, 1.4, 0, 0, TAU);
    ctx.fill();
    if (seal.roarAnim > 0) {
      ctx.fillStyle = '#3b1b1b';
      ctx.beginPath();
      ctx.ellipse(22, 0, 3.4, 2.8, 0, 0, TAU);
      ctx.fill();
    }

    ctx.strokeStyle = 'rgba(240, 255, 255, .7)';
    ctx.lineWidth = .7;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(21, i * 1.2);
      ctx.lineTo(31, i * 3.6 - 1);
      ctx.stroke();
    }
    ctx.restore();

    if (S.sealLvl.magnet > 0) {
      ctx.strokeStyle = 'rgba(127, 240, 200, .16)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 6]);
      ctx.beginPath();
      ctx.arc(seal.x, seal.y, 44 + S.sealLvl.magnet * 32, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    if (seal.roarAnim > 0) {
      const p = 1 - seal.roarAnim / .7;
      ctx.strokeStyle = `rgba(255, 227, 155, ${.8 * (1 - p)})`;
      ctx.lineWidth = 3 * (1 - p) + 1;
      ctx.beginPath();
      ctx.arc(seal.x, seal.y, 26 + p * 70, 0, TAU);
      ctx.stroke();
    }
  }

  function drawPickups(t) {
    for (const p of S.pickups) {
      const arc = p.landed ? 0 : Math.sin(clamp(p.age / p.flight, 0, 1) * Math.PI) * 26;
      const bob = p.landed ? Math.sin(p.bob) * 2 : 0;
      ctx.save();
      ctx.translate(p.x, p.y - arc + bob);
      ctx.rotate(p.magnet ? t * 7 : Math.sin(p.bob * .5) * .13);
      ctx.shadowColor = 'rgba(255, 205, 118, .75)';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#ffd27f';
      ctx.strokeStyle = '#fff3c9';
      ctx.lineWidth = .8;
      ctx.beginPath();
      ctx.moveTo(9, 0);
      ctx.quadraticCurveTo(2, -7, -5, -4);
      ctx.lineTo(-11, -7);
      ctx.lineTo(-9, 0);
      ctx.lineTo(-11, 7);
      ctx.lineTo(-5, 4);
      ctx.quadraticCurveTo(2, 7, 9, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#654016';
      ctx.beginPath();
      ctx.arc(4, -1.5, 1, 0, TAU);
      ctx.fill();
      ctx.restore();
      if (!p.landed && arc > 4) {
        ctx.strokeStyle = 'rgba(255, 220, 140, .22)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 6 + arc * .17, 0, TAU);
        ctx.stroke();
      }
    }
  }

  function drawProjectiles() {
    for (const p of S.projectiles) {
      ctx.save();
      if (p.kind === 'harpoon') {
        ctx.strokeStyle = 'rgba(255, 211, 126, .35)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        p.trail.forEach((pt, i) => { if (i === 0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y); });
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(-14, 0);
        ctx.lineTo(9, 0);
        ctx.stroke();
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(13, 0);
        ctx.lineTo(5, -4);
        ctx.lineTo(5, 4);
        ctx.closePath();
        ctx.fill();
      } else if (p.kind === 'shard') {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 9;
        ctx.strokeStyle = 'rgba(145, 244, 255, .32)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        p.trail.forEach((pt, i) => { if (i === 0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y); });
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = '#eaffff';
        ctx.beginPath();
        ctx.moveTo(7, 0);
        ctx.lineTo(0, -3);
        ctx.lineTo(-6, 0);
        ctx.lineTo(0, 3);
        ctx.closePath();
        ctx.fill();
      } else if (p.kind === 'snow') {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#effeff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5.5, 0, TAU);
        ctx.fill();
        ctx.fillStyle = 'rgba(190, 243, 255, .55)';
        ctx.beginPath();
        ctx.arc(p.x - 6, p.y, 2.4, 0, TAU);
        ctx.fill();
      } else if (p.kind === 'frost') {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 11;
        ctx.fillStyle = '#aeeaff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4.2, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = '#e5ffff';
        ctx.lineWidth = 1;
        for (let i = 0; i < 4; i++) {
          const a = p.spin + i * Math.PI / 2;
          ctx.beginPath();
          ctx.moveTo(p.x + Math.cos(a) * 4, p.y + Math.sin(a) * 4);
          ctx.lineTo(p.x + Math.cos(a) * 9, p.y + Math.sin(a) * 9);
          ctx.stroke();
        }
      } else if (p.kind === 'tar') {
        ctx.shadowColor = '#ff9b61';
        ctx.shadowBlur = 9;
        ctx.fillStyle = '#37211d';
        ctx.strokeStyle = '#ffb05c';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5.5, 0, TAU);
        ctx.fill();
        ctx.stroke();
      } else if (p.kind === 'boomerang') {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.spin);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2.7;
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, Math.PI * 1.35);
        ctx.stroke();
        ctx.strokeStyle = '#ffe7f5';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, 10, .2, Math.PI * 1.15);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  function drawTraps() {
    for (const t of S.traps) {
      const d = t.def;
      const pulse = .5 + .5 * Math.sin(S.visual * (d.kind === 'decoy' ? 6 : 2.5) + t.x);
      ctx.save();
      ctx.translate(t.x, t.y);
      if (d.kind === 'oil') {
        const g = ctx.createRadialGradient(0, 0, 2, 0, 0, d.radius);
        g.addColorStop(0, 'rgba(48, 22, 74, .65)');
        g.addColorStop(.6, 'rgba(88, 49, 133, .34)');
        g.addColorStop(1, 'rgba(49, 17, 77, 0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(0, 0, d.radius, d.radius * .68, .25, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = `rgba(191, 144, 255, ${.25 + pulse * .2})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(0, 0, d.radius * .7, d.radius * .45, .25, 0, TAU);
        ctx.stroke();
      } else if (d.kind === 'whirl') {
        ctx.strokeStyle = `rgba(128, 201, 255, ${.3 + pulse * .25})`;
        ctx.lineWidth = 2;
        for (let arm = 0; arm < 3; arm++) {
          ctx.beginPath();
          for (let i = 0; i < 30; i++) {
            const a = arm * TAU / 3 + i * .18 + S.visual * 1.5;
            const r = i * d.radius / 31;
            const x = Math.cos(a) * r, y = Math.sin(a) * r * .72;
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
        ctx.strokeStyle = 'rgba(151, 222, 255, .18)';
        ctx.beginPath();
        ctx.ellipse(0, 0, d.radius, d.radius * .72, 0, 0, TAU);
        ctx.stroke();
      } else if (d.kind === 'decoy') {
        const bob = Math.sin(S.visual * 5) * 3;
        ctx.translate(0, bob);
        ctx.shadowColor = '#ffd27f';
        ctx.shadowBlur = 16 + pulse * 8;
        ctx.fillStyle = '#ffd27f';
        ctx.beginPath();
        ctx.ellipse(0, 0, 14, 7, -.2, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = '#fff1bd';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-12, 0);
        ctx.lineTo(-20, -8);
        ctx.lineTo(-19, 7);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#3c2510';
        ctx.beginPath();
        ctx.arc(7, -2, 1.3, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = `rgba(255, 210, 126, ${.28 + pulse * .3})`;
        ctx.setLineDash([3, 5]);
        ctx.beginPath();
        ctx.arc(0, 0, d.radius * .7, 0, TAU);
        ctx.stroke();
        ctx.setLineDash([]);
      } else {
        const g = ctx.createRadialGradient(0, 0, 3, 0, 0, d.radius);
        g.addColorStop(0, d.color + '55');
        g.addColorStop(1, d.color + '00');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(0, 0, d.radius, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = d.color + '88';
        ctx.lineWidth = 1.3;
        ctx.setLineDash([4, 7]);
        ctx.beginPath();
        ctx.arc(0, 0, d.radius, S.visual * .4, TAU + S.visual * .4);
        ctx.stroke();
        ctx.setLineDash([]);
        if (d.kind === 'mine') {
          ctx.fillStyle = 'rgba(8, 38, 50, .82)';
          ctx.strokeStyle = d.color;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.arc(0, 0, 13 + pulse * 1.6, 0, TAU);
          ctx.fill();
          ctx.stroke();
          for (let i = 0; i < 8; i++) {
            const a = i / 8 * TAU;
            ctx.beginPath();
            ctx.moveTo(Math.cos(a) * 15, Math.sin(a) * 15);
            ctx.lineTo(Math.cos(a) * 21, Math.sin(a) * 21);
            ctx.stroke();
          }
          ctx.fillStyle = d.color;
          ctx.beginPath();
          ctx.arc(0, 0, 3.5 + pulse * 1.5, 0, TAU);
          ctx.fill();
        } else if (d.kind === 'net') {
          ctx.strokeStyle = 'rgba(159, 233, 255, .88)';
          ctx.lineWidth = 1;
          for (let i = -2; i <= 2; i++) {
            ctx.beginPath();
            ctx.moveTo(-19, i * 7);
            ctx.lineTo(19, i * 7);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(i * 9, -19);
            ctx.lineTo(i * 9, 19);
            ctx.stroke();
          }
          ctx.strokeStyle = 'rgba(159, 233, 255, .55)';
          ctx.beginPath();
          ctx.arc(0, 0, 20, 0, TAU);
          ctx.stroke();
        } else if (d.kind === 'spike') {
          ctx.strokeStyle = d.color;
          ctx.lineWidth = 1.6;
          for (let i = 0; i < 4; i++) {
            const a = i / 4 * TAU + S.visual * .2;
            ctx.beginPath();
            ctx.moveTo(Math.cos(a) * 7, Math.sin(a) * 7);
            ctx.lineTo(Math.cos(a + .3) * 16, Math.sin(a + .3) * 16);
            ctx.lineTo(Math.cos(a + .5) * 8, Math.sin(a + .5) * 8);
            ctx.stroke();
          }
        }
        const remain = d.charges > 0 ? t.charges : 0;
        for (let i = 0; i < remain; i++) {
          ctx.fillStyle = d.color;
          ctx.beginPath();
          ctx.arc(-8 + i * 8, 25, 1.8, 0, TAU);
          ctx.fill();
        }
      }
      if (t.flash > 0) {
        ctx.strokeStyle = `rgba(255, 255, 255, ${t.flash * .6})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, d.radius * (1.1 - t.flash * .35), 0, TAU);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  function drawEffects() {
    for (const e of S.effects) {
      const p = 1 - e.life / e.maxLife;
      ctx.save();
      if (e.type === 'ring') {
        const r = lerp(e.r0, e.r1, p);
        ctx.strokeStyle = e.color + Math.round((1 - p) * 255).toString(16).padStart(2, '0');
        ctx.lineWidth = (e.width || 2) * (1 - p * .65);
        ctx.beginPath();
        ctx.arc(e.x, e.y, Math.max(.5, r), 0, TAU);
        ctx.stroke();
      } else if (e.type === 'explosion') {
        const r = e.radius * (.35 + p * .8);
        const g = ctx.createRadialGradient(e.x, e.y, 1, e.x, e.y, r);
        g.addColorStop(0, `rgba(255,255,255,${.7 * (1 - p)})`);
        g.addColorStop(.35, e.color + Math.round((1 - p) * 150).toString(16).padStart(2, '0'));
        g.addColorStop(1, e.color + '00');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(e.x, e.y, r, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = e.color + Math.round((1 - p) * 220).toString(16).padStart(2, '0');
        ctx.lineWidth = 2.5 * (1 - p) + .5;
        ctx.beginPath();
        ctx.arc(e.x, e.y, r, 0, TAU);
        ctx.stroke();
      } else if (e.type === 'lightning') {
        ctx.strokeStyle = e.color;
        ctx.shadowColor = e.color;
        ctx.shadowBlur = 12 * (1 - p);
        ctx.lineWidth = 2.4 * (1 - p) + .6;
        for (let pass = 0; pass < 2; pass++) {
          ctx.beginPath();
          for (let i = 0; i < e.points.length - 1; i++) {
            const a = e.points[i], b = e.points[i + 1];
            ctx.moveTo(a.x, a.y);
            const steps = 5;
            for (let s = 1; s <= steps; s++) {
              const q = s / steps;
              const jitter = s === steps ? 0 : rand(-7, 7);
              ctx.lineTo(lerp(a.x, b.x, q) + jitter, lerp(a.y, b.y, q) + rand(-4, 4));
            }
          }
          ctx.stroke();
        }
      } else if (e.type === 'splash') {
        ctx.strokeStyle = `rgba(210, 248, 255, ${.6 * (1 - p)})`;
        ctx.lineWidth = 2 * (1 - p) + .5;
        ctx.beginPath();
        ctx.ellipse(e.x, e.y, e.radius * (.6 + p * .8), e.radius * .38 * (.6 + p * .8), 0, 0, TAU);
        ctx.stroke();
        ctx.fillStyle = `rgba(197, 244, 255, ${.2 * (1 - p)})`;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius * .55 * (1 - p * .5), 0, TAU);
        ctx.fill();
      } else if (e.type === 'shockwave') {
        ctx.strokeStyle = `rgba(255, 228, 158, ${.8 * (1 - p)})`;
        ctx.lineWidth = 5 * (1 - p) + 1;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius * p, 0, TAU);
        ctx.stroke();
      } else if (e.type === 'net') {
        ctx.strokeStyle = `rgba(159, 233, 255, ${.9 * (1 - p)})`;
        ctx.lineWidth = 1.3;
        for (let i = -3; i <= 3; i++) {
          ctx.beginPath();
          ctx.moveTo(e.x - e.radius, e.y + i * e.radius / 3);
          ctx.lineTo(e.x + e.radius, e.y + i * e.radius / 3);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(e.x + i * e.radius / 3, e.y - e.radius);
          ctx.lineTo(e.x + i * e.radius / 3, e.y + e.radius);
          ctx.stroke();
        }
      } else if (e.type === 'sink') {
        ctx.strokeStyle = `rgba(180, 242, 255, ${.4 * (1 - p)})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(e.x, e.y, Math.max(1, e.radius), 0, TAU);
        ctx.stroke();
        ctx.fillStyle = `rgba(90, 193, 218, ${.13 * (1 - p)})`;
        ctx.beginPath();
        ctx.arc(e.x, e.y, Math.max(1, e.radius), 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  function drawParticles() {
    for (const p of S.particles) {
      const a = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(.2, p.size * a), 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawFloaters() {
    ctx.save();
    ctx.textAlign = 'center';
    for (const f of S.floaters) {
      const a = clamp(f.life / f.maxLife, 0, 1);
      ctx.globalAlpha = a;
      ctx.font = `800 ${f.size}px "Trebuchet MS", sans-serif`;
      ctx.fillStyle = f.color;
      ctx.shadowColor = 'rgba(0,8,12,.8)';
      ctx.shadowBlur = 5;
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.restore();
  }

  function drawSnowLayer() {
    const t = S.visual;
    ctx.save();
    for (const f of SNOWFLAKES) {
      const x = ((f.x + t * f.v * .35) % 1.05) * W + Math.sin(t * .5 + f.p) * 10;
      const y = ((f.y + t * f.v) % 1.05) * H;
      const s = f.s;
      ctx.fillStyle = `rgba(224, 250, 255, ${.11 + s * .07})`;
      ctx.beginPath();
      ctx.arc(x, y, s, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  // ================= Input =================

  function bindJoystick() {
    const joy = dom.joystick;
    const knob = dom.joyKnob;
    let rect = null;
    const start = (e) => {
      e.preventDefault();
      S.joy.active = true;
      S.joy.id = e.pointerId;
      joy.classList.add('active');
      rect = joy.getBoundingClientRect();
      move(e);
    };
    const move = (e) => {
      if (!S.joy.active || e.pointerId !== S.joy.id) return;
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const max = rect.width * .31;
      let dx = e.clientX - cx;
      let dy = e.clientY - cy;
      const d = Math.hypot(dx, dy);
      if (d > max) { dx = dx / d * max; dy = dy / d * max; }
      knob.style.transform = `translate(${dx}px, ${dy}px)`;
      S.joy.dx = clamp(dx / max, -1, 1);
      S.joy.dy = clamp(dy / max, -1, 1);
    };
    const end = (e) => {
      if (e.pointerId !== S.joy.id) return;
      S.joy.active = false;
      S.joy.id = null;
      S.joy.dx = 0; S.joy.dy = 0;
      knob.style.transform = 'translate(0px, 0px)';
      joy.classList.remove('active');
    };
    joy.addEventListener('pointerdown', start);
    joy.addEventListener('pointermove', move);
    joy.addEventListener('pointerup', end);
    joy.addEventListener('pointercancel', end);
    joy.addEventListener('lostpointercapture', end);
    joy.addEventListener('pointerdown', (e) => { try { joy.setPointerCapture(e.pointerId); } catch (err) {} });
  }

  function canvasPointer(e) {
    if (S.mode !== 'playing') return;
    e.preventDefault();
    const world = screenToWorld(e.clientX, e.clientY);
    let nearest = null, nd = Infinity;
    for (const socket of S.sockets) {
      const d = Math.hypot(socket.x - world.x, socket.y - world.y);
      if (d < SOCKET_TAP && d < nd) { nd = d; nearest = socket; }
    }
    if (nearest) { handleSocket(nearest); return; }
    if (S.selectedCard && S.selectedCard.cat === 'traps') {
      placeTrapAt(world);
      return;
    }
    if (S.selectedCard && S.selectedCard.cat === 'towers') {
      const r = Math.hypot(world.x, world.y);
      if (r < FLOE_R) showToast('Пушки ставятся только в гнёзда на льдине', '');
      else showToast('Коснитесь свободного гнезда на льдине', '');
      return;
    }
    if (Math.hypot(world.x, world.y) > FLOE_R + 20) {
      S.selectedSocket = null;
      closeTowerPanel();
      sfxClick();
    }
  }

  function toggleTilt() {
    if (S.tilt.enabled) {
      disableTilt();
      showToast('Наклон отключён', '');
      return;
    }
    enableTilt();
  }

  async function enableTilt() {
    if (!window.DeviceOrientationEvent) {
      showToast('Датчик наклона не поддерживается на этом устройстве', 'bad');
      return;
    }
    try {
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        const result = await DeviceOrientationEvent.requestPermission();
        if (result !== 'granted') {
          showToast('Разрешение на движение не выдано', 'bad');
          if (S.mode === 'paused') openSettings(true);
          return;
        }
      }
      S.tilt.enabled = true;
      S.tilt.base = null;
      S.tilt.awaiting = true;
      S.tilt.lastEvent = performance.now();
      window.addEventListener('deviceorientation', onTilt);
      setTimeout(() => {
        if (!S.tilt.awaiting) return;
        S.tilt.awaiting = false;
        if (S.tilt.enabled) {
          S.tilt.enabled = false;
          showToast('Не удалось получить данные датчика. Используйте джойстик', 'bad');
          if (S.mode === 'paused') openSettings(true);
        }
      }, 2200);
      showToast('Наклон включён. Наклоните устройство, чтобы плыть', 'good');
      updateTiltIcon();
    } catch (err) {
      showToast('Не удалось включить наклон', 'bad');
    }
  }

  function disableTilt() {
    S.tilt.enabled = false;
    S.tilt.x = 0; S.tilt.y = 0;
    window.removeEventListener('deviceorientation', onTilt);
    updateTiltIcon();
  }

  function onTilt(e) {
    if (!S.tilt.enabled) return;
    if (e.beta == null && e.gamma == null) return;
    S.tilt.awaiting = false;
    let x = e.gamma || 0;
    let y = e.beta || 0;
    const angle = (screen.orientation && screen.orientation.angle) || window.orientation || 0;
    if (angle === 90) { const ty = y; y = -x; x = ty; }
    else if (angle === -90 || angle === 270) { const ty = y; y = x; x = -ty; }
    else if (Math.abs(angle) === 180) { x = -x; y = -y; }
    if (!S.tilt.base) {
      S.tilt.base = { x, y };
      S.tilt.lastEvent = performance.now();
      return;
    }
    S.tilt.lastEvent = performance.now();
    const dx = clamp((x - S.tilt.base.x) / 19, -1, 1);
    const dy = clamp((y - S.tilt.base.y) / 19, -1, 1);
    S.tilt.x = Math.abs(dx) < .08 ? 0 : dx;
    S.tilt.y = Math.abs(dy) < .08 ? 0 : dy;
  }

  function updateTiltIcon() {
    dom.tiltQuickIcon.innerHTML = icon('tilt');
    dom.btnTiltQuick.classList.toggle('active', S.tilt.enabled);
  }

  // ================= UI =================

  function updateShopTip() {
    if (S.category === 'towers') dom.dockTip.textContent = 'Выберите пушку, затем гнездо на льдине';
    else if (S.category === 'traps') dom.dockTip.textContent = 'Ловушки ставятся в воде вокруг льдины';
    else if (S.category === 'floe') dom.dockTip.textContent = 'Укрепляйте лёд и открывайте новые гнёзда';
    else dom.dockTip.textContent = 'Прокачивайте тюленя: скорость, рёв и сбор рыбы';
  }

  function openModal(html) {
    dom.modalCard.innerHTML = html;
    dom.modalOverlay.classList.remove('hidden');
  }

  function closeModal() {
    dom.modalOverlay.classList.add('hidden');
    dom.modalCard.innerHTML = '';
    if (S.mode === 'paused') S.mode = 'playing';
  }

  function pauseGame() {
    if (S.mode !== 'playing') return;
    S.mode = 'paused';
    closeTowerPanel();
    openPause();
  }

  function openPause() {
    openModal(`
      <h2>Пауза</h2>
      <p class="modal-sub">Льдина ждёт. Косатки тоже.</p>
      <div class="modal-buttons" style="margin-top:0">
        <button class="btn btn-primary" data-act="resume">ПРОДОЛЖИТЬ</button>
        <button class="btn btn-ghost" data-act="settings">НАСТРОЙКИ</button>
      </div>
      <h3>Оборона</h3>
      <div class="rule"><span class="rule-icon">${icon('tower')}</span><div><b>Пушки и ловушки</b>Стройте защиту, улучшайте её и меняйте комбинации под волну.</div></div>
      <div class="rule"><span class="rule-icon">${icon('seal')}</span><div><b>Тюлень</b>Собирайте рыбу, рёвом отбрасывайте косаток от кромки льда.</div></div>
      <div class="modal-buttons">
        <button class="btn btn-ghost" data-act="help">КАК ИГРАТЬ</button>
        <button class="btn btn-ghost" data-act="restart">ЗАНОВО</button>
        <button class="btn btn-ghost" data-act="menu">В МЕНЮ</button>
      </div>`);
    bindModalActions();
  }

  function openSettings(fromPause = false) {
    const motion = S.tilt.enabled ? 'Датчик активен. Наклоняйте устройство для движения.' : 'Опционально: управление наклоном. На iOS потребуется разрешение.';
    openModal(`
      <h2>Настройки</h2>
      <p class="modal-sub">Звук, наклон и полный экран</p>
      <div class="setting-row">
        <div class="setting-copy"><b>Звук</b><span>Синтезированные эффекты боя</span></div>
        <button class="switch ${S.muted ? '' : 'on'}" data-toggle="sound" aria-label="Звук"></button>
      </div>
      <div class="setting-row">
        <div class="setting-copy"><b>Управление наклоном</b><span>Акселерометр двигает тюленя. Джойстик остаётся основным.</span></div>
        <button class="switch ${S.tilt.enabled ? 'on' : ''}" data-toggle="tilt" aria-label="Наклон"></button>
      </div>
      <div class="motion-state ${S.tilt.enabled ? 'ok' : ''}" id="motionState">${motion}</div>
      <div class="setting-row">
        <div class="setting-copy"><b>Полноэкранный режим</b><span>Больше места для льдины</span></div>
        <button class="btn btn-ghost" data-act="fullscreen" style="padding:8px 12px;font-size:9px">ВКЛ</button>
      </div>
      <div class="setting-row">
        <div class="setting-copy"><b>Калибровка наклона</b><span>Держите устройство удобно и нажмите</span></div>
        <button class="btn btn-ghost" data-act="calibrate" style="padding:8px 12px;font-size:9px">ЦЕНТР</button>
      </div>
      <div class="modal-buttons">
        <button class="btn btn-primary" data-act="closeSettings">ГОТОВО</button>
      </div>`);
    S.modalReturn = fromPause ? 'pause' : (S.mode === 'paused' ? 'pause' : 'menu');
    bindModalActions();
  }

  function openHelp() {
    openModal(`
      <h2>Как играть</h2>
      <p class="modal-sub">Тюлень, льдина и очень настойчивые косатки</p>
      <div class="rule"><span class="rule-icon">${icon('flipper')}</span><div><b>Двигайтесь</b>Джойстик на телефоне, WASD или стрелки на компьютере. Можно включить наклон в настройках.</div></div>
      <div class="rule"><span class="rule-icon">${icon('tower')}</span><div><b>Стройте оборону</b>Выберите пушку в доке и коснитесь свободного гнезда на льдине. Внутренние гнёзда открывает улучшение «Внутренний круг».</div></div>
      <div class="rule"><span class="rule-icon">${icon('fish')}</span><div><b>Собирайте рыбу</b>Косатки роняют рыбу на льдину. Подойдите к ней — чем сильнее «Рыбное чутьё», тем шире радиус сбора.</div></div>
      <div class="rule"><span class="rule-icon">${icon('mine')}</span><div><b>Ставьте ловушки</b>Ловушки размещаются в воде вокруг льдины. Мины, сети, масло, шипы, приманки и водовороты работают по-разному.</div></div>
      <div class="rule"><span class="rule-icon">${icon('roar')}</span><div><b>Используйте рёв</b>Кнопка «Рёв» или ПРОБЕЛ: отбрасывает и оглушает косаток рядом. Перезарядка показана на кнопке.</div></div>
      <div class="rule"><span class="rule-icon">${icon('shield')}</span><div><b>Укрепляйте льдину</b>Прочность, регенерация и ремонт покупаются на вкладке «Льдина». Если лёд треснет — оборона падёт.</div></div>
      <div class="rule"><span class="rule-icon">${icon('wave')}</span><div><b>15 волн</b>Отбивайте волны, собирайте бонусы и готовьтесь к вожакам. Финальная волна — Император Глубин.</div></div>
      <div class="modal-buttons">
        <button class="btn btn-primary" data-act="closeHelp">ПОНЯТНО</button>
      </div>`);
    bindModalActions();
  }

  function bindModalActions() {
    dom.modalCard.querySelectorAll('[data-act]').forEach((b) => {
      b.addEventListener('click', () => {
        const act = b.dataset.act;
        sfxClick();
        if (act === 'resume') { closeModal(); }
        else if (act === 'settings') { openSettings(true); }
        else if (act === 'help') { openHelp(); }
        else if (act === 'restart') { closeModal(); S.mode = 'playing'; startGame(); }
        else if (act === 'menu') { closeModal(); goMenu(); }
        else if (act === 'closeSettings') {
          if (S.modalReturn === 'pause') openPause(); else closeModal();
        } else if (act === 'closeHelp') {
          if (S.mode === 'paused') openPause(); else closeModal();
        } else if (act === 'fullscreen') {
          const root = document.documentElement;
          if (document.fullscreenElement) document.exitFullscreen?.();
          else root.requestFullscreen?.().catch(() => showToast('Полный экран недоступен', 'bad'));
        } else if (act === 'calibrate') {
          S.tilt.base = null;
          showToast('Наклон откалиброван', 'good');
          setTimeout(() => { if (S.mode === 'paused') openSettings(true); }, 500);
        }
      });
    });
    dom.modalCard.querySelectorAll('[data-toggle]').forEach((b) => {
      b.addEventListener('click', () => {
        const k = b.dataset.toggle;
        if (k === 'sound') {
          setMuted(!S.muted);
          b.classList.toggle('on', !S.muted);
          sfxClick();
        } else if (k === 'tilt') {
          if (S.tilt.enabled) { disableTilt(); b.classList.remove('on'); showToast('Наклон отключён', ''); }
          else {
            enableTilt();
            b.classList.add('on');
            const ms = dom.modalCard.querySelector('#motionState');
            if (ms) { ms.textContent = 'Запрашиваем разрешение / данные датчика...'; }
          }
        }
      });
    });
  }

  function bindUI() {
    dom.brandMark.innerHTML = icon('seal');
    dom.fishIconHud.innerHTML = icon('fish');
    dom.roarIcon.innerHTML = icon('roar');
    updateTiltIcon();
    updateSoundIcon();
    dom.bestStart.textContent = 'Лучший результат: ' + S.best;

    dom.btnStart.addEventListener('click', () => { initAudio(); startGame(); });
    dom.btnHow.addEventListener('click', openHelp);
    dom.btnAgain.addEventListener('click', () => startGame());
    dom.btnMenu.addEventListener('click', goMenu);
    dom.btnNextWave.addEventListener('click', () => { if (!S.waveActive) beginWave(S.wave + 1); });
    dom.btnPause.addEventListener('click', pauseGame);
    dom.btnHelp.addEventListener('click', () => { if (S.mode === 'playing') { S.mode = 'paused'; } openHelp(); });
    dom.btnSound.addEventListener('click', () => { initAudio(); setMuted(!S.muted); sfxClick(); });
    dom.btnTiltQuick.addEventListener('click', toggleTilt);
    dom.btnRoar.addEventListener('click', doRoar);
    dom.btnRoar.addEventListener('pointerdown', (e) => { e.preventDefault(); });
    dom.tpClose.addEventListener('click', () => { S.selectedSocket = null; closeTowerPanel(); });
    dom.tpUpgrade.addEventListener('click', upgradeSelectedTower);
    dom.tpSell.addEventListener('click', sellSelectedTower);

    document.querySelectorAll('.tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        S.category = tab.dataset.cat;
        S.selectedCard = null;
        S.selectedSocket = null;
        updateBuildHint();
        closeTowerPanel();
        document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t === tab));
        renderCards();
        updateShopTip();
        sfxClick();
      });
    });

    dom.cards.addEventListener('click', (e) => {
      const node = e.target.closest('.card');
      if (!node) return;
      const cat = node.dataset.cat;
      let def;
      if (cat === 'towers') def = TOWERS.find((d) => d.id === node.dataset.card);
      else if (cat === 'traps') def = TRAPS.find((d) => d.id === node.dataset.card);
      else if (cat === 'floe') def = FLOE_UPGRADES.find((d) => d.id === node.dataset.card);
      else def = SEAL_UPGRADES.find((d) => d.id === node.dataset.card);
      if (def) selectCard(def, cat);
    });

    canvas.addEventListener('pointerdown', canvasPointer);
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    window.addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase();
      if (['arrowleft', 'arrowright', 'arrowup', 'arrowdown', ' '].includes(k)) e.preventDefault();
      if (k === ' ') { if (S.mode === 'playing') doRoar(); return; }
      if (k === 'escape') {
        if (!dom.modalOverlay.classList.contains('hidden')) { closeModal(); return; }
        if (S.mode === 'playing') pauseGame();
        return;
      }
      if (k === 'p') { if (S.mode === 'playing') pauseGame(); return; }
      if (S.mode === 'playing') S.keys.add(k);
    });
    window.addEventListener('keyup', (e) => S.keys.delete(e.key.toLowerCase()));
    window.addEventListener('blur', () => S.keys.clear());

    window.addEventListener('resize', resize);
    window.addEventListener('orientationchange', () => setTimeout(resize, 180));
    if (screen.orientation && screen.orientation.addEventListener) screen.orientation.addEventListener('change', () => setTimeout(resize, 180));
    bindJoystick();
    updateShopTip();
    makeSockets();
    renderCards();
    updateHud(true);
  }

  let lastFrame = performance.now();

  function frame(now) {
    const dt = Math.min(.05, Math.max(0, (now - lastFrame) / 1000));
    lastFrame = now;
    S.visual += dt;
    if (S.mode === 'playing') update(dt);
    else if (S.mode === 'menu') S.seal.anim += dt;
    render();
    requestAnimationFrame(frame);
  }

  const cssHud = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hud-h')) || 72;
  const cssDock = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--dock-h')) || 168;

  resize();
  if (!dom.dock.getBoundingClientRect().height) {
    const portrait = innerHeight > innerWidth * 1.02;
    const availH = Math.max(180, innerHeight - cssHud - cssDock);
    const r = portrait ? Math.min(innerWidth * .405, availH * .43) : Math.min(innerWidth * .255, availH * .5, innerHeight * .365);
    floeScreenR = clamp(r, 92, 360);
    scale = floeScreenR / FLOE_R;
    camX = innerWidth / 2;
    camY = cssHud + availH * .5;
  }
  bindUI();
  resetMenuScene();
  renderCards();
  updateHud(true);
  updateTiltIcon();
  updateSoundIcon();
  requestAnimationFrame(frame);
})();
