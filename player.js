function drawPlayer() {
    if (!imagesLoaded || !player) return;

    let pcx = player.x + player.width / 2;
    let pcy = player.y + player.height / 2;

    if (autoAimEnabled) {
        ctx.save();
        ctx.strokeStyle = player.isEvil ? 'rgba(255, 60, 60, 0.6)' : 'rgba(255, 220, 80, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(pcx, pcy, PLAYER_SHOOT_RADIUS, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        if (nearestEnemyForLaser) {
            ctx.strokeStyle = 'rgba(255, 50, 50, 0.85)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(pcx, pcy);
            ctx.lineTo(nearestEnemyForLaser.x + nearestEnemyForLaser.width / 2, nearestEnemyForLaser.y + nearestEnemyForLaser.height / 2);
            ctx.stroke();
            ctx.lineWidth = 1;
        }
    }

    let sheet = gameImages.angel;
    if (sheet && sheet.naturalWidth > 0) {
        let startFrame = player.isEvil ? 0 : 4;
        let frame = startFrame + player.animFrame;
        ctx.drawImage(sheet, frame * 64, 0, 64, 64, player.x, player.y, player.width, player.height);
    } else {
        drawRect(player.x, player.y, player.width, player.height, 'blue');
    }
}

function updatePlayerMovement() {
    let ix = 0;
    let iy = 0;
    if (keys['w'] || (autoAimEnabled && keys['ArrowUp']))    iy = -1;
    if (keys['s'] || (autoAimEnabled && keys['ArrowDown']))  iy =  1;
    if (keys['a'] || (autoAimEnabled && keys['ArrowLeft']))  ix = -1;
    if (keys['d'] || (autoAimEnabled && keys['ArrowRight'])) ix =  1;

    let mx = ix;
    let my = iy;
    if (ix != 0 && iy != 0) {
        mx = ix / Math.sqrt(2);
        my = iy / Math.sqrt(2);
    }
    player.dx = mx * player.speed;
    player.dy = my * player.speed;
}

function movePlayer() {
    if (!player) return;
    updatePlayerMovement();
    player.x += player.dx * deltaTime;
    player.y += player.dy * deltaTime;
    if (player.x < 0) player.x = 0;
    if (player.x > canvas.width  - player.width)  player.x = canvas.width  - player.width;
    if (player.y < 0) player.y = 0;
    if (player.y > canvas.height - player.height) player.y = canvas.height - player.height;
}

function findNearestEnemy() {
    nearestEnemyForLaser = null;
    if (enemies.length == 0 || !player) return null;
    let nearest = null;
    let minDist = Infinity;
    let pcx = player.x + player.width / 2;
    let pcy = player.y + player.height / 2;
    let radiusSq = PLAYER_SHOOT_RADIUS * PLAYER_SHOOT_RADIUS;
    for (let i = 0; i < enemies.length; i++) {
        let e = enemies[i];
        let d = distanceSq(pcx, pcy, e.x + e.width / 2, e.y + e.height / 2);
        if (d < radiusSq && d < minDist) {
            minDist = d;
            nearest = e;
        }
    }
    nearestEnemyForLaser = nearest;
    player.isEvil = nearest != null;
    return nearest;
}

function findHighestHealthEnemy() {
    let target = null;
    let maxHp = -1;
    for (let i = 0; i < enemies.length; i++) {
        if (enemies[i].currentHealth > maxHp) {
            maxHp = enemies[i].currentHealth;
            target = enemies[i];
        }
    }
    return target;
}

function rollShotCount() {
    let extra = Math.floor(player.multishotChance);
    let remainder = player.multishotChance - extra;
    if (Math.random() < remainder) extra++;
    return 1 + extra;
}

function getDamageMultiplier(x, y) {
    let stacks = player.items.aoe;
    if (stacks <= 0 || !player) return 1;
    let pcx = player.x + player.width / 2;
    let pcy = player.y + player.height / 2;
    let radius = PLAYER_SHOOT_RADIUS / 2;
    if (distanceSq(pcx, pcy, x, y) <= radius * radius) return 1 + stacks;
    return 1;
}

function fireProjectiles(baseAngle) {
    let pcx = player.x + player.width / 2;
    let pcy = player.y + player.height / 2;
    let shotCount = rollShotCount();
    let spread = shotCount > 1 ? Math.PI / 12 : 0;
    let speed = 400;

    for (let i = 0; i < shotCount; i++) {
        let angle = baseAngle;
        if (shotCount > 1) {
            angle += spread * (i - (shotCount - 1) / 2);
        }
        projectiles.push({
            x: pcx - 2.5, y: pcy - 2.5,
            width: 5, height: 5,
            color: 'black',
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            damage: player.currentDamage,
            piercesLeft: player.items.pierce,
            hitEnemies: []
        });
    }
    shootTimer = player.currentShootInterval;
    playShootSound();
}

function shoot() {
    if (gameState != 'playing' || enemies.length == 0 || !player) return;
    let target = findNearestEnemy();
    if (!target) return;

    let pcx = player.x + player.width / 2;
    let pcy = player.y + player.height / 2;
    let tx  = target.x + target.width  / 2;
    let ty  = target.y + target.height / 2;
    let baseAngle = Math.atan2(ty - pcy, tx - pcx);
    fireProjectiles(baseAngle);
}

function shootManual() {
    if (gameState != 'playing' || !player) return;
    let ix = 0, iy = 0;
    if (keys['ArrowUp'])    iy = -1;
    if (keys['ArrowDown'])  iy =  1;
    if (keys['ArrowLeft'])  ix = -1;
    if (keys['ArrowRight']) ix =  1;
    if (ix == 0 && iy == 0) return;

    let baseAngle = Math.atan2(iy, ix);
    fireProjectiles(baseAngle);
}
