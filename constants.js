const PLAYER_MAX_HEALTH = 20;
const BASE_XP_FOR_NEXT_LEVEL = 300;
const XP_LEVEL_GROWTH = 1.13;
const WAVE_DURATION = 30;
const INTERMISSION_DURATION = 10;
const PLAYER_BASE_SPEED = 200;
const BASE_SHOOT_INTERVAL = 0.6;
const BASE_PROJECTILE_DAMAGE = 30;
const PLAYER_WIDTH = 64;
const PLAYER_HEIGHT = 64;
const PLAYER_SHOOT_RADIUS = 110;
const ENEMY_DROP_CHANCE = 0.02;
const LOOTBOX_SELECT_DURATION = 1.2;

const SHOOT_SOUND_MIN_GAP = 0.05;
const SHOOT_SOUND_POOL_SIZE = 4;

const AIM_MODE_MESSAGE_DURATION = 1.0;

const MULTISHOT_CHANCE_PER_PERK = 0.10;

const CHECKPOINT_PATH_INDEX = 2;
const DIFFICULTY_WINDOW = 20;
const DIFFICULTY_SAMPLE_BATCH = 5;
const DIFFICULTY_MIN = 0.85;
const DIFFICULTY_MAX = 4.0;
const DIFFICULTY_LERP = 0.15;

const SPARK_SPAWN_DISTANCE = 280;
const SPARK_HIT_RADIUS = 20;
const SPARK_VISUAL_RADIUS = 9;
const SPARK_DESPAWN_MARGIN = 140;
const SPARK_SPEED_BASE = 65;
const SPARK_SPEED_PER_WAVE = 0.6;
const SPARK_SPEED_MAX = 110;
const SPARK_TURN_RATE = 1.1;
const SPARK_SPIRAL_SPIN = 0.6;
const SPARK_SPAWN_INTERVAL_MIN = 7;
const SPARK_SPAWN_INTERVAL_MAX = 12;

const ENEMY_HP_WAVE_GROWTH = 0.28;
const ENEMY_SPEED_WAVE_GROWTH = 0.09;
const ENEMY_SPEED_MULT_CAP = 2.2;
const ENEMY_XP_WAVE_GROWTH = 0.15;
const ENEMY_XP_LEVEL_GROWTH = 0.05;

const LEVEL_WAVE_LENGTH = 5;

const REGIONS = [
    { key: 'himmelstor', name: 'Himmelstor', waveStart: 1,  waveEnd: 5,
      sky: ['#2196F3', '#8FD3FF'], silhouetteBack: '#90CAF9', silhouetteFront: '#E3F4FF',
      path: [
          { x: 680, y: 570 }, { x: 680, y: 450 }, { x: 120, y: 450 }, { x: 120, y: 330 },
          { x: 680, y: 330 }, { x: 680, y: 210 }, { x: 120, y: 210 }, { x: 120, y: 90 }, { x: 400, y: 40 }
      ] },
    { key: 'wolken',     name: 'Wolken',     waveStart: 6,  waveEnd: 10,
      sky: ['#EAF6FF', '#FFFFFF'], silhouetteBack: '#F5FBFF', silhouetteFront: '#FFFFFF',
      path: [
          { x: 680, y: 570 }, { x: 680, y: 420 }, { x: 120, y: 420 }, { x: 120, y: 280 },
          { x: 680, y: 280 }, { x: 680, y: 140 }, { x: 400, y: 40 }
      ] },
    { key: 'erde',       name: 'Erde',       waveStart: 11, waveEnd: 15,
      sky: ['#8BC34A', '#DCEDC8'], silhouetteBack: '#689F38', silhouetteFront: '#33691E',
      path: [
          { x: 680, y: 570 }, { x: 680, y: 380 }, { x: 120, y: 380 }, { x: 120, y: 190 }, { x: 400, y: 40 }
      ] },
    { key: 'unterwelt',  name: 'Unterwelt',  waveStart: 16, waveEnd: 20,
      sky: ['#4E342E', '#8D6E63'], silhouetteBack: '#3E2723', silhouetteFront: '#20120F',
      path: [
          { x: 600, y: 570 }, { x: 600, y: 320 }, { x: 200, y: 320 }, { x: 200, y: 40 }
      ] },
    { key: 'hoelle',     name: 'Hölle',      waveStart: 21, waveEnd: Infinity,
      sky: ['#B71C1C', '#FF7043'], silhouetteBack: '#8D2E00', silhouetteFront: '#3E0A00',
      path: [
          { x: 450, y: 570 }, { x: 450, y: 300 }, { x: 300, y: 300 }, { x: 300, y: 40 }
      ] }
];

function getCurrentPath() {
    return getCurrentRegion(currentWave).path;
}

const DEVIL_BOSS_WAVE = 25;

const DEVIL_BASE_HEALTH = 18000;
const DEVIL_HP_WAVE_GROWTH = 0.15;
const DEVIL_WIDTH = 70;
const DEVIL_HEIGHT = 90;
const DEVIL_SPEED = 130;
const DEVIL_KITE_MIN_DIST = 160;
const DEVIL_KITE_MAX_DIST = 320;
const DEVIL_SHOOT_INTERVAL_MIN = 1.4;
const DEVIL_SHOOT_INTERVAL_MAX = 2.4;
const DEVIL_PROJECTILE_SPEED = 260;
const DEVIL_LAVA_INTERVAL_MIN = 6;
const DEVIL_LAVA_INTERVAL_MAX = 9;
const DEVIL_LAVA_COUNT_MIN = 2;
const DEVIL_LAVA_COUNT_MAX = 3;
const DEVIL_LAVA_RADIUS = PLAYER_SHOOT_RADIUS / 2;
const DEVIL_LAVA_TELEGRAPH_TIME = 1.0;
const DEVIL_LAVA_ACTIVE_TIME = 2.5;
const DEVIL_LAVA_DAMAGE_INTERVAL = 0.5;

const STORY_BEATS = [
    {
        wave: 6,
        title: 'Die Wolken',
        text: 'Ihr steigt hinab in die Wolken. Ein neuer Feind zeigt sich:',
        newEnemy: 'sprinter'
    },
    {
        wave: 11,
        title: 'Die Erde',
        text: 'Die Erde liegt unter euch. Aus dem Boden erhebt sich ein neuer Feind:',
        newEnemy: 'tank'
    },
    {
        wave: 16,
        title: 'Die Unterwelt',
        text: 'Die Luft wird dünn und dunkel — ihr betretet die Unterwelt.'
    },
    {
        wave: 21,
        title: 'Die Hölle',
        text: 'Hitze schlägt euch entgegen. Ihr habt die Hölle erreicht.'
    },
    {
        wave: DEVIL_BOSS_WAVE,
        title: 'Der Teufel erhebt sich',
        text: 'Der Teufel selbst steigt aus der Tiefe empor, um euch aufzuhalten!',
        isBoss: true
    }
];

function getCurrentRegion(wave) {
    if (wave < REGIONS[0].waveStart) return REGIONS[0];
    for (let i = 0; i < REGIONS.length; i++) {
        if (wave >= REGIONS[i].waveStart && wave <= REGIONS[i].waveEnd) return REGIONS[i];
    }
    return REGIONS[REGIONS.length - 1];
}

const ENEMY_TYPES = {
    goon:     { name: "Teufelchen", health: 50,  speed: 50,  color: '#FF0000', xp: 50,  width: 28, height: 24,  description: "Kleiner Handlanger des Teufels, schwach allein." },
    tank:     { name: "Dämon",      health: 200, speed: 30,  color: '#8B0000', xp: 150, width: 90, height: 64,  description: "Langsam, aber widerstandsfähig wie die Sünde selbst." },
    sprinter: { name: "Plagegeist", health: 30,  speed: 120, color: '#FFA500', xp: 75,  width: 25, height: 25,  description: "Schnell wie eine Plage, aber zerbrechlich." }
};

const TOWER_TYPES = {
    sniper:  { name: "Erzengel",     color: '#006400', range: 500, cooldown: 0.1, baseDamage: 120, chargeRate: 20, maxCharge: 100, cost: 0 },
    trap:    { name: "Dornenfalle",  color: '#696969', range: 20,  cooldown: 4.0, damage: 15, slowDuration: 3.0, slowFactor: 0.2, activeDuration: 0.5, cost: 0 },
    incense: { name: "Fegefeuer",    color: '#FF6A00', range: 90,  cooldown: 0.5, burnDamagePerSecond: 12, burnDuration: 1.5, vulnerability: 1.3, cost: 0 }
};

const ITEM_TYPES = {
    aoe:       { name: "Richtfeld",     description: "Zone um euch: Gegner darin nehmen mehrfachen Schaden." },
    pierce:    { name: "Splitterpfeile", description: "Projektile durchschlagen zusätzliche Gegner." },
    lifesteal: { name: "Gnadenstoß",    description: "Chance, bei einem Kill ein Leben zurückzugewinnen." },
    guardian:  { name: "Schutzengel",   description: "Erhöht sofort das maximale Leben und heilt voll auf." },
    chain:     { name: "Kettenblitz",   description: "Kills schlagen auf nahe Gegner über." }
};

const LOOTBOX_CATALOG = (function() {
    let catalog = [];
    for (let key in TOWER_TYPES) catalog.push({ category: 'tower', key: key, name: TOWER_TYPES[key].name });
    for (let key in ITEM_TYPES)  catalog.push({ category: 'item',  key: key, name: ITEM_TYPES[key].name });
    return catalog;
})();
