function spawnDevilBoss() {
    let maxHealth = DEVIL_BASE_HEALTH * (1 + (currentWave - 1) * DEVIL_HP_WAVE_GROWTH) * difficultyFactor;
    devilBoss = {
        x: canvas.width / 2 - DEVIL_WIDTH / 2,
        y: 80,
        width: DEVIL_WIDTH,
        height: DEVIL_HEIGHT,
        maxHealth: maxHealth,
        currentHealth: maxHealth,
        speed: DEVIL_SPEED,
        strafeDir: Math.random() < 0.5 ? 1 : -1,
        shootTimer: 2,
        lavaTimer: 4,
        wingPhase: 0
    };
}

function updateDevilBoss() {
    if (!devilBoss || gameState != 'playing' || !player) return;

    let pcx = player.x + player.width / 2, pcy = player.y + player.height / 2;
    let bcx = devilBoss.x + devilBoss.width / 2, bcy = devilBoss.y + devilBoss.height / 2;
    let dx = pcx - bcx, dy = pcy - bcy;
    let dist = Math.hypot(dx, dy) || 1;
    let moveX = 0, moveY = 0;

    if (dist < DEVIL_KITE_MIN_DIST) {
        moveX = -dx / dist; moveY = -dy / dist;
    } else if (dist > DEVIL_KITE_MAX_DIST) {
        moveX = dx / dist; moveY = dy / dist;
    } else {
        moveX = (-dy / dist) * devilBoss.strafeDir;
        moveY = (dx / dist) * devilBoss.strafeDir;
    }

    devilBoss.x += moveX * devilBoss.speed * deltaTime;
    devilBoss.y += moveY * devilBoss.speed * deltaTime;
    devilBoss.x = Math.max(0, Math.min(canvas.width - devilBoss.width, devilBoss.x));
    devilBoss.y = Math.max(0, Math.min(canvas.height - devilBoss.height, devilBoss.y));

    devilBoss.wingPhase += deltaTime * 6;

    devilBoss.shootTimer -= deltaTime;
    if (devilBoss.shootTimer <= 0) {
        shootDevilProjectile();
        devilBoss.shootTimer = DEVIL_SHOOT_INTERVAL_MIN + Math.random() * (DEVIL_SHOOT_INTERVAL_MAX - DEVIL_SHOOT_INTERVAL_MIN);
    }

    devilBoss.lavaTimer -= deltaTime;
    if (devilBoss.lavaTimer <= 0) {
        triggerLavaAttack();
        devilBoss.lavaTimer = DEVIL_LAVA_INTERVAL_MIN + Math.random() * (DEVIL_LAVA_INTERVAL_MAX - DEVIL_LAVA_INTERVAL_MIN);
    }

    updateLavaZones();
}

function shootDevilProjectile() {
    let bcx = devilBoss.x + devilBoss.width / 2, bcy = devilBoss.y + devilBoss.height / 2;
    let pcx = player.x + player.width / 2, pcy = player.y + player.height / 2;
    let angle = Math.atan2(pcy - bcy, pcx - bcx);
    enemyProjectiles.push({
        x: bcx - 6, y: bcy - 6, width: 12, height: 12,
        vx: Math.cos(angle) * DEVIL_PROJECTILE_SPEED,
        vy: Math.sin(angle) * DEVIL_PROJECTILE_SPEED
    });
}

function updateEnemyProjectiles() {
    if (!player) return;
    for (let i = enemyProjectiles.length - 1; i >= 0; i--) {
        let p = enemyProjectiles[i];
        p.x += p.vx * deltaTime;
        p.y += p.vy * deltaTime;

        if (p.x < -20 || p.x > canvas.width + 20 || p.y < -20 || p.y > canvas.height + 20) {
            enemyProjectiles.splice(i, 1);
            continue;
        }

        if (p.x < player.x + player.width && p.x + p.width > player.x &&
            p.y < player.y + player.height && p.y + p.height > player.y) {
            enemyProjectiles.splice(i, 1);
            player.health--;
            if (player.health <= 0) setGameState('gameOver');
        }
    }
}

function drawEnemyProjectiles() {
    for (let i = 0; i < enemyProjectiles.length; i++) {
        let p = enemyProjectiles[i];
        ctx.save();
        ctx.shadowColor = '#FF6A00';
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#FF3300';
        ctx.beginPath();
        ctx.arc(p.x + p.width / 2, p.y + p.height / 2, p.width / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

function triggerLavaAttack() {
    let count = DEVIL_LAVA_COUNT_MIN + Math.floor(Math.random() * (DEVIL_LAVA_COUNT_MAX - DEVIL_LAVA_COUNT_MIN + 1));
    let pcx = player.x + player.width / 2, pcy = player.y + player.height / 2;
    for (let i = 0; i < count; i++) {
        let angle = Math.random() * Math.PI * 2;
        let dist = 30 + Math.random() * 140;
        lavaZones.push({
            x: Math.max(DEVIL_LAVA_RADIUS, Math.min(canvas.width - DEVIL_LAVA_RADIUS, pcx + Math.cos(angle) * dist)),
            y: Math.max(DEVIL_LAVA_RADIUS, Math.min(canvas.height - DEVIL_LAVA_RADIUS, pcy + Math.sin(angle) * dist)),
            radius: DEVIL_LAVA_RADIUS,
            state: 'telegraph',
            timer: DEVIL_LAVA_TELEGRAPH_TIME,
            damageTimer: DEVIL_LAVA_DAMAGE_INTERVAL
        });
    }
}

function updateLavaZones() {
    if (!player) return;
    let pcx = player.x + player.width / 2, pcy = player.y + player.height / 2;
    for (let i = lavaZones.length - 1; i >= 0; i--) {
        let z = lavaZones[i];
        z.timer -= deltaTime;

        if (z.state == 'telegraph') {
            if (z.timer <= 0) { z.state = 'active'; z.timer = DEVIL_LAVA_ACTIVE_TIME; }
        } else {
            if (distanceSq(pcx, pcy, z.x, z.y) < z.radius * z.radius) {
                z.damageTimer -= deltaTime;
                if (z.damageTimer <= 0) {
                    player.health--;
                    z.damageTimer = DEVIL_LAVA_DAMAGE_INTERVAL;
                    if (player.health <= 0) setGameState('gameOver');
                }
            }
            if (z.timer <= 0) lavaZones.splice(i, 1);
        }
    }
}

function drawLavaZones() {
    for (let i = 0; i < lavaZones.length; i++) {
        let z = lavaZones[i];
        if (z.state == 'telegraph') {
            let pulse = 0.4 + 0.3 * Math.sin(performance.now() / 120);
            ctx.strokeStyle = 'rgba(255, 80, 0, ' + pulse + ')';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(z.x, z.y, z.radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.lineWidth = 1;
        } else {
            ctx.save();
            ctx.shadowColor = '#FF4500';
            ctx.shadowBlur = 15;
            let grad = ctx.createRadialGradient(z.x, z.y, z.radius * 0.2, z.x, z.y, z.radius);
            grad.addColorStop(0, '#FFD54F');
            grad.addColorStop(0.6, '#FF6A00');
            grad.addColorStop(1, 'rgba(139, 0, 0, 0.85)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(z.x, z.y, z.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }
}

function damageDevilBoss(amount) {
    if (!devilBoss) return;
    devilBoss.currentHealth -= amount;
    if (devilBoss.currentHealth <= 0) {
        devilBoss = null;
        lavaZones = [];
        enemyProjectiles = [];
        if (!devilDefeated) {
            devilDefeated = true;
            nextStateAfterPopup = 'playing';
            setGameState('infoPopup');
            if (infoTextP) infoTextP.textContent = 'Du hast den Teufel bezwungen! Doch aus der Tiefe strömen weiter Teufelchen nach — kämpfe weiter!';
        }
    }
}

function drawDevilBoss() {
    if (!devilBoss) return;
    let w = devilBoss.width, h = devilBoss.height;
    let flap = Math.sin(devilBoss.wingPhase) * 0.5;

    ctx.save();
    ctx.translate(devilBoss.x + w / 2, devilBoss.y + h / 2);

    ctx.fillStyle = '#3B0A0A';
    ctx.save();
    ctx.rotate(flap * 0.3);
    ctx.beginPath();
    ctx.moveTo(-w * 0.15, -h * 0.1);
    ctx.quadraticCurveTo(-w * 0.75, -h * 0.5 - flap * 20, -w * 0.85, h * 0.05);
    ctx.quadraticCurveTo(-w * 0.5, -h * 0.05, -w * 0.15, h * 0.15);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.rotate(-flap * 0.3);
    ctx.beginPath();
    ctx.moveTo(w * 0.15, -h * 0.1);
    ctx.quadraticCurveTo(w * 0.75, -h * 0.5 - flap * 20, w * 0.85, h * 0.05);
    ctx.quadraticCurveTo(w * 0.5, -h * 0.05, w * 0.15, h * 0.15);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = '#7A0C0C';
    ctx.beginPath();
    ctx.moveTo(0, -h * 0.15);
    ctx.quadraticCurveTo(w * 0.32, -h * 0.05, w * 0.22, h * 0.35);
    ctx.quadraticCurveTo(w * 0.12, h * 0.5, 0, h * 0.5);
    ctx.quadraticCurveTo(-w * 0.12, h * 0.5, -w * 0.22, h * 0.35);
    ctx.quadraticCurveTo(-w * 0.32, -h * 0.05, 0, -h * 0.15);
    ctx.fill();

    ctx.fillStyle = '#8B0000';
    ctx.beginPath();
    ctx.arc(0, -h * 0.32, w * 0.22, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.moveTo(-w * 0.16, -h * 0.44); ctx.lineTo(-w * 0.3, -h * 0.62); ctx.lineTo(-w * 0.06, -h * 0.46);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(w * 0.16, -h * 0.44); ctx.lineTo(w * 0.3, -h * 0.62); ctx.lineTo(w * 0.06, -h * 0.46);
    ctx.closePath();
    ctx.fill();

    ctx.save();
    ctx.shadowColor = '#FFEE58';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#FFEE58';
    ctx.beginPath(); ctx.arc(-w * 0.08, -h * 0.33, w * 0.04, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(w * 0.08, -h * 0.33, w * 0.04, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    ctx.restore();
}
