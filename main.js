function resetGame() {
    player = {
        x: canvas.width  / 2 - PLAYER_WIDTH  / 2,
        y: canvas.height / 2 - PLAYER_HEIGHT / 2,
        width:  PLAYER_WIDTH,
        height: PLAYER_HEIGHT,
        speed:  PLAYER_BASE_SPEED,
        dx: 0, dy: 0,
        health: PLAYER_MAX_HEALTH,
        maxHealth: PLAYER_MAX_HEALTH,
        level: 1, xp: 0,
        xpForNextLevel: BASE_XP_FOR_NEXT_LEVEL,
        shootSpeedMultiplier: 1,
        damageMultiplier: 1,
        multishotChance: 0,
        currentShootInterval: BASE_SHOOT_INTERVAL,
        currentDamage: BASE_PROJECTILE_DAMAGE,
        animFrame: 0,
        animTimer: 0,
        isEvil: false,
        items: { aoe: 0, pierce: 0, lifesteal: 0, guardian: 0, chain: 0 },
        perkLevels: { speed: 0, damage: 0, shotgun: 0 }
    };
    enemies      = [];
    projectiles  = [];
    drops        = [];
    towers       = [];
    keys         = {};
    currentWave  = 0;
    waveTimer    = 0;
    intermissionTimer  = 3;
    enemySpawnTimer    = 0;
    shootTimer         = 0;
    nearestEnemyForLaser = null;
    availableEnemyTypes  = ['goon'];
    lastTimestamp        = 0;
    deltaTime            = 0;
    lootboxFinalIndex     = 0;
    lootboxHighlightIndex = 0;
    lootboxStepIntervals  = [];
    lootboxStepIndex      = 0;
    lootboxStepTimer      = 0;
    pendingLevelUps      = 0;
    autoAimEnabled       = true;
    aimModeMessageTimer  = 0;
    difficultyFactor     = 1;
    checkpointOutcomes   = [];
    difficultySampleCounter = 0;
    devilDefeated        = false;
    sparks               = [];
    sparkSpawnTimer       = 3;
    devilBoss             = null;
    enemyProjectiles      = [];
    lavaZones             = [];
    setGameState('betweenWaves');
}

function checkStoryBeat() {
    let beat = null;
    for (let i = 0; i < STORY_BEATS.length; i++) {
        if (STORY_BEATS[i].wave == currentWave) { beat = STORY_BEATS[i]; break; }
    }
    if (!beat) return false;

    let text = beat.text;
    if (beat.newEnemy && ENEMY_TYPES[beat.newEnemy]) {
        availableEnemyTypes.push(beat.newEnemy);
        text += ' ' + ENEMY_TYPES[beat.newEnemy].name.toUpperCase() + '! ' + ENEMY_TYPES[beat.newEnemy].description;
    }
    if (beat.isBoss) {
        spawnDevilBoss();
    }

    nextStateAfterPopup = 'playing';
    setGameState('infoPopup');
    if (infoTextP) infoTextP.textContent = text;
    return true;
}

function update() {
    if (aimModeMessageTimer > 0) {
        aimModeMessageTimer -= deltaTime;
        if (aimModeMessageTimer < 0) aimModeMessageTimer = 0;
    }

    if (gameState == 'playing' || gameState == 'betweenWaves') {
        movePlayer();
        checkDropsCollection();
        moveProjectiles();
        updateTowers();
        nearestEnemyForLaser = findNearestEnemy();

        player.animTimer += deltaTime;
        if (player.animTimer >= 0.12) {
            player.animTimer = 0;
            player.animFrame = (player.animFrame + 1) % 4;
        }
    }

    if (gameState == 'playing') {
        moveEnemies();
        updateSparks();
        updateDevilBoss();
        updateEnemyProjectiles();
        enemySpawnTimer -= deltaTime;
        let spawnInterval = Math.max(0.2, 1.5 / (1 + (currentWave - 1) * 0.1));
        spawnInterval = spawnInterval / Math.max(1, availableEnemyTypes.length * 0.8);
        if (enemySpawnTimer <= 0) {
            spawnEnemy();
            enemySpawnTimer = spawnInterval * (0.8 + Math.random() * 0.4);
        }
        shootTimer -= deltaTime;
        if (shootTimer <= 0) {
            if (autoAimEnabled) shoot();
            else shootManual();
        }
        waveTimer -= deltaTime;
        if (waveTimer <= 0) {
            setGameState('betweenWaves');
            intermissionTimer = INTERMISSION_DURATION;
        }
    } else if (gameState == 'betweenWaves') {
        intermissionTimer -= deltaTime;
        if (intermissionTimer <= 0) {
            let prevRegion = getCurrentRegion(currentWave);
            currentWave++;
            if (getCurrentRegion(currentWave).key != prevRegion.key) enemies = [];
            waveTimer = WAVE_DURATION;
            enemySpawnTimer = 0;
            if (!checkStoryBeat()) setGameState('playing');
        }
    } else if (gameState == 'placingTower') {
        if (placingTowerType == 'trap') {
            let seg = getPathSegments()[placingTowerSegmentIndex];
            let horizontal = isSegmentHorizontal(seg);
            let slideSpeed = 220;
            let cx = placingTowerX + 15, cy = placingTowerY + 15;

            if (horizontal) {
                if (keys['ArrowLeft']  || keys['a']) cx -= slideSpeed * deltaTime;
                if (keys['ArrowRight'] || keys['d']) cx += slideSpeed * deltaTime;
            } else {
                if (keys['ArrowUp']   || keys['w']) cy -= slideSpeed * deltaTime;
                if (keys['ArrowDown'] || keys['s']) cy += slideSpeed * deltaTime;
            }

            let snapped = closestPointOnSegment(seg, cx, cy);
            placingTowerX = snapped.x - 15;
            placingTowerY = snapped.y - 15;
        } else {
            let moveSpeed = 180;
            if (keys['ArrowUp']    || keys['w']) placingTowerY -= moveSpeed * deltaTime;
            if (keys['ArrowDown']  || keys['s']) placingTowerY += moveSpeed * deltaTime;
            if (keys['ArrowLeft']  || keys['a']) placingTowerX -= moveSpeed * deltaTime;
            if (keys['ArrowRight'] || keys['d']) placingTowerX += moveSpeed * deltaTime;

            placingTowerX = Math.max(0, Math.min(canvas.width  - 30, placingTowerX));
            placingTowerY = Math.max(0, Math.min(canvas.height - 30, placingTowerY));
        }
    } else if (gameState == 'lootboxSpinning') {
        lootboxStepTimer -= deltaTime;
        if (lootboxStepTimer <= 0) {
            lootboxHighlightIndex = (lootboxHighlightIndex + 1) % LOOTBOX_CATALOG.length;
            lootboxStepIndex++;
            if (lootboxStepIndex >= lootboxStepIntervals.length) {
                revealLootboxReward();
            } else {
                lootboxStepTimer = lootboxStepIntervals[lootboxStepIndex];
            }
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (imagesLoaded) {
        drawRegionBackground();
    } else {
        drawRect(0, 0, canvas.width, canvas.height, '#333');
    }

    if (gameState == 'start') {
        drawStartScreen();
    } else if (gameState == 'gameOver') {
        drawGameOverScreen();
    } else if (gameState == 'lootboxSpinning') {
        drawPath(); drawLavaZones(); drawDrops(); drawTowers();
        for (let i = 0; i < enemies.length;     i++) { if (enemies[i] && enemies[i].type == 'tank') drawEnemy(enemies[i]); }
        for (let i = 0; i < enemies.length;     i++) { if (enemies[i] && enemies[i].type != 'tank') drawEnemy(enemies[i]); }
        for (let i = 0; i < projectiles.length; i++) { if (projectiles[i]) drawProjectile(projectiles[i]); }
        drawSparks();
        drawDevilBoss();
        drawEnemyProjectiles();
        if (player) drawPlayer();
        drawUI();
        drawLootboxGrid();
    } else if (gameState == 'placingTower') {
        drawPath(); drawLavaZones(); drawDrops(); drawTowers();
        for (let i = 0; i < enemies.length;     i++) { if (enemies[i] && enemies[i].type == 'tank') drawEnemy(enemies[i]); }
        for (let i = 0; i < enemies.length;     i++) { if (enemies[i] && enemies[i].type != 'tank') drawEnemy(enemies[i]); }
        for (let i = 0; i < projectiles.length; i++) { if (projectiles[i]) drawProjectile(projectiles[i]); }
        drawSparks();
        drawDevilBoss();
        drawEnemyProjectiles();
        if (player) drawPlayer();
        drawUI();
        drawPlacementMode();
    } else if (gameState) {
        drawPath(); drawLavaZones(); drawDrops(); drawTowers();
        for (let i = 0; i < enemies.length;     i++) { if (enemies[i] && enemies[i].type == 'tank') drawEnemy(enemies[i]); }
        for (let i = 0; i < enemies.length;     i++) { if (enemies[i] && enemies[i].type != 'tank') drawEnemy(enemies[i]); }
        for (let i = 0; i < projectiles.length; i++) { if (projectiles[i]) drawProjectile(projectiles[i]); }
        drawSparks();
        drawDevilBoss();
        drawEnemyProjectiles();
        if (player) drawPlayer();
        drawUI();
    }

    drawAimModeMessage();
}

function gameLoop(timestamp) {
    if (!imagesLoaded || !gameState) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawText("Loading...", canvas.width / 2, canvas.height / 2, 'white', '30px');
        requestAnimationFrame(gameLoop);
        return;
    }

    if (!lastTimestamp) lastTimestamp = timestamp;
    deltaTime = (timestamp - lastTimestamp) / 1000;
    if (deltaTime > 1 / 15) deltaTime = 1 / 15;
    lastTimestamp = timestamp;

    try {
        update();
        draw();
    } catch (e) {
        console.error("Game error:", e);
    }

    requestAnimationFrame(gameLoop);
}

window.addEventListener('keydown', function(e) {
    let wasAlreadyDown = keys[e.key];
    if (gameState == 'playing' || gameState == 'betweenWaves' || gameState == 'placingTower') keys[e.key] = true;

    if (!wasAlreadyDown && gameState == 'placingTower' && placingTowerType == 'trap') {
        let dir = null;
        if (e.key == 'ArrowUp'    || e.key == 'w') dir = 'up';
        else if (e.key == 'ArrowDown'  || e.key == 's') dir = 'down';
        else if (e.key == 'ArrowLeft'  || e.key == 'a') dir = 'left';
        else if (e.key == 'ArrowRight' || e.key == 'd') dir = 'right';
        if (dir) jumpTrapToDirection(dir);
    }

    if (e.code == 'Space' && gameState == 'betweenWaves') {
        intermissionTimer = 0;
        e.preventDefault();
    }
    if (e.code == 'Space' && gameState == 'lootboxSpinning') {
        revealLootboxReward();
        e.preventDefault();
    }
    if (e.code == 'Enter' && gameState == 'placingTower') {
        confirmTowerPlacement();
        e.preventDefault();
    }
    if (e.code == 'Tab' && (gameState == 'playing' || gameState == 'betweenWaves')) {
        autoAimEnabled = !autoAimEnabled;
        aimModeMessageTimer = AIM_MODE_MESSAGE_DURATION;
        e.preventDefault();
    }
});

window.addEventListener('keyup', function(e) {
    keys[e.key] = false;
});

if (playButton) playButton.addEventListener('click', function() {
    if (gameState == 'start') resetGame();
});

if (retryButton) retryButton.addEventListener('click', function() {
    if (gameState == 'gameOver') resetGame();
});

perkButtons.forEach(function(button) {
    button.addEventListener('click', function(e) {
        if (gameState == 'selectingPerk') {
            let perkType = e.target.getAttribute('data-perk');
            if (perkType) applyPerk(perkType);
        }
    });
});

if (infoOkButton) infoOkButton.addEventListener('click', function() {
    if (gameState == 'infoPopup') setGameState(nextStateAfterPopup);
});

if (lootboxOpenButton) lootboxOpenButton.addEventListener('click', function() {
    if (gameState == 'lootboxOpening') openLootbox();
});

if (lootboxOkButton) lootboxOkButton.addEventListener('click', function() {
    if (gameState == 'lootboxRevealing') {
        lootboxOkButton.style.display = 'none';
        if (pendingLevelUps > 0) {
            setGameState('selectingPerk');
        } else if (pendingTowerPlacement) {
            startTowerPlacement(pendingTowerPlacement);
            pendingTowerPlacement = null;
        } else {
            setGameState(nextStateAfterPopup);
        }
    }
});

loadImages();
