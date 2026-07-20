const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const playButton       = document.getElementById('playButton');
const retryButton      = document.getElementById('retryButton');
const perkSelectionDiv = document.getElementById('perkSelection');
const perkButtons      = document.querySelectorAll('.perkButton');
const infoPopupDiv     = document.getElementById('infoPopup');
const infoTextP        = document.getElementById('infoText');
const infoOkButton     = document.getElementById('infoOkButton');
const lootboxPopupDiv  = document.getElementById('lootboxPopup');
const lootboxTextP     = document.getElementById('lootboxText');
const lootboxOpenButton = document.getElementById('lootboxOpenButton');
const lootboxOkButton  = document.getElementById('lootboxOkButton');

let gameImages = {};
let imagesLoaded = false;
let shootSoundPool = [];
let shootSoundPoolIndex = 0;
let lastShootSoundTime = 0;

let placingTowerType = null;
let placingTowerX = 400;
let placingTowerY = 300;
let placingTowerSegmentIndex = 0;
let pendingTowerPlacement = null;

let gameState;
let nextStateAfterPopup = 'playing';
let lastTimestamp = 0;
let deltaTime = 0;

let player = {};
let enemies = [];
let projectiles = [];
let towers = [];
let drops = [];
let keys = {};

let currentWave = 0;
let waveTimer = 0;
let intermissionTimer = 0;
let enemySpawnTimer = 0;
let shootTimer = 0;
let nearestEnemyForLaser = null;
let availableEnemyTypes = ['goon'];

let lootboxFinalIndex = 0;
let lootboxHighlightIndex = 0;
let lootboxStepIntervals = [];
let lootboxStepIndex = 0;
let lootboxStepTimer = 0;
let pendingLevelUps = 0;

let autoAimEnabled = true;
let aimModeMessageTimer = 0;

let difficultyFactor = 1;
let checkpointOutcomes = [];
let difficultySampleCounter = 0;

let devilDefeated = false;

let regionSceneCache = {};
let sparks = [];
let sparkSpawnTimer = 0;

let devilBoss = null;
let enemyProjectiles = [];
let lavaZones = [];
