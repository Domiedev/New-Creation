function getImpFrame(dir, frame) {
    if (dir == 'right') {
        if (frame <= 5) return { sx: frame * 32, sy: 64 };
        return { sx: 0, sy: 96 };
    }
    if (dir == 'left') {
        if (frame <= 4) return { sx: (frame + 1) * 32, sy: 96 };
        return { sx: (frame - 5) * 32, sy: 128 };
    }
    if (dir == 'up') return { sx: frame * 32, sy: 32 };
    return { sx: frame * 32, sy: 0 };
}

function drawEnemy(enemy) {
    ctx.save();
    ctx.translate(enemy.x, enemy.y);

    if (enemy.type == 'goon' && imagesLoaded && gameImages.imp && gameImages.imp.naturalWidth > 0) {
        let f = getImpFrame(enemy.moveDir, enemy.animFrame);
        ctx.drawImage(gameImages.imp, f.sx, f.sy, 32, 32, 0, 0, enemy.width, enemy.height);
    } else if (enemy.type == 'tank' && imagesLoaded && gameImages.tank && gameImages.tank.naturalWidth > 0) {
        ctx.drawImage(gameImages.tank, 0, 0, 90, 64, 0, -20, enemy.width, enemy.height);
    } else {
        drawRect(0, 0, enemy.width, enemy.height, enemy.color);
    }

    ctx.restore();

    let barX = enemy.x;
    let barY = enemy.y - 7;
    let healthPct = Math.max(0, enemy.currentHealth / enemy.maxHealth);
    drawRect(barX, barY, enemy.width, 5, '#555');
    drawRect(barX, barY, enemy.width * healthPct, 5, 'lime');

    ctx.lineWidth = 2;
    if (enemy.statusEffects.burning.duration > 0) {
        ctx.strokeStyle = 'orange';
        ctx.strokeRect(enemy.x - 1, enemy.y - 1, enemy.width + 2, enemy.height + 2);
    }
    if (enemy.statusEffects.slowed.duration > 0) {
        ctx.fillStyle = 'rgba(0, 0, 255, 0.2)';
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    }
    ctx.lineWidth = 1;
}

function spawnEnemy(forcedType) {
    let typeKey = forcedType || getRandomElement(availableEnemyTypes);
    let typeConfig = ENEMY_TYPES[typeKey];
    let hpMult = 1 + (currentWave - 1) * ENEMY_HP_WAVE_GROWTH;
    let speedMult = Math.min(ENEMY_SPEED_MULT_CAP, (1 + (currentWave - 1) * ENEMY_SPEED_WAVE_GROWTH) * difficultyFactor);
    let hp  = typeConfig.health * hpMult * difficultyFactor;
    let spd = typeConfig.speed * speedMult;
    let xp  = Math.ceil(typeConfig.xp * (1 + (currentWave - 1) * ENEMY_XP_WAVE_GROWTH) * (1 + (player.level - 1) * ENEMY_XP_LEVEL_GROWTH) * difficultyFactor);
    let path = getCurrentPath();

    enemies.push({
        type: typeKey,
        x: path[0].x - typeConfig.width  / 2,
        y: path[0].y - typeConfig.height / 2,
        width:  typeConfig.width,
        height: typeConfig.height,
        speed: spd, baseSpeed: spd,
        maxHealth: hp, currentHealth: hp,
        color: typeConfig.color,
        pathIndex: 0,
        value: xp,
        animFrame: 0, animTimer: 0,
        moveDir: 'right',
        reachedCheckpoint: false,
        checkpointRecorded: false,
        statusEffects: {
            burning: { duration: 0, damageInterval: 0.5, damageTimer: 0, damageAmount: 0 },
            slowed:  { duration: 0, speedMultiplier: 1 }
        }
    });
}

function recordCheckpointOutcome(success) {
    checkpointOutcomes.push(success);
    if (checkpointOutcomes.length > DIFFICULTY_WINDOW) checkpointOutcomes.shift();
    difficultySampleCounter++;

    if (difficultySampleCounter >= DIFFICULTY_SAMPLE_BATCH && checkpointOutcomes.length > 0) {
        difficultySampleCounter = 0;
        let successRate = 0;
        for (let i = 0; i < checkpointOutcomes.length; i++) {
            if (checkpointOutcomes[i]) successRate++;
        }
        successRate /= checkpointOutcomes.length;

        let targetFactor = DIFFICULTY_MAX - successRate * (DIFFICULTY_MAX - DIFFICULTY_MIN);
        difficultyFactor += (targetFactor - difficultyFactor) * DIFFICULTY_LERP;
        difficultyFactor = Math.max(DIFFICULTY_MIN, Math.min(DIFFICULTY_MAX, difficultyFactor));
    }
}

function updateEnemyStatusEffects(enemy) {
    let died = false;
    let burn = enemy.statusEffects.burning;
    if (burn.duration > 0) {
        burn.duration   -= deltaTime;
        burn.damageTimer -= deltaTime;
        if (burn.damageTimer <= 0) {
            let dmg = burn.damageAmount * getDamageMultiplier(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
            enemy.currentHealth -= dmg;
            burn.damageTimer = burn.damageInterval;
            if (enemy.currentHealth <= 0) died = true;
        }
        if (burn.duration < 0) burn.duration = 0;
    }

    let slow = enemy.statusEffects.slowed;
    if (slow.duration > 0) {
        slow.duration -= deltaTime;
        enemy.speed = enemy.baseSpeed * slow.speedMultiplier;
        if (slow.duration <= 0) {
            slow.duration = 0;
            enemy.speed = enemy.baseSpeed;
        }
    } else {
        enemy.speed = enemy.baseSpeed;
    }
    return died;
}

function moveEnemies() {
    if (gameState != 'playing') return;
    let path = getCurrentPath();
    for (let i = enemies.length - 1; i >= 0; i--) {
        if (!enemies[i]) continue;
        let enemy = enemies[i];

        if (updateEnemyStatusEffects(enemy)) {
            let idx = enemies.indexOf(enemy);
            if (idx > -1) handleEnemyDefeat(enemy, idx);
            continue;
        }

        if (!enemies.includes(enemy)) continue;

        let target = path[enemy.pathIndex];
        let dx = target.x - (enemy.x + enemy.width  / 2);
        let dy = target.y - (enemy.y + enemy.height / 2);
        let dist = Math.sqrt(dx * dx + dy * dy);
        let moveAmt = enemy.speed * deltaTime;

        if (dist < moveAmt || dist == 0) {
            enemy.x = target.x - enemy.width  / 2;
            enemy.y = target.y - enemy.height / 2;
            enemy.pathIndex++;
            if (!enemy.checkpointRecorded && enemy.pathIndex > CHECKPOINT_PATH_INDEX) {
                enemy.checkpointRecorded = true;
                recordCheckpointOutcome(true);
            }
            if (enemy.pathIndex >= path.length) {
                player.health--;
                enemies.splice(i, 1);
                if (player.health <= 0) setGameState('gameOver');
            }
        } else {
            enemy.x += (dx / dist) * moveAmt;
            enemy.y += (dy / dist) * moveAmt;

            if (Math.abs(dx) > Math.abs(dy)) {
                enemy.moveDir = dx > 0 ? 'right' : 'left';
            } else {
                enemy.moveDir = dy > 0 ? 'front' : 'up';
            }

            let maxFrame = (enemy.moveDir == 'right' || enemy.moveDir == 'left') ? 7 : 6;
            enemy.animTimer += deltaTime;
            if (enemy.animTimer >= 0.1) {
                enemy.animTimer = 0;
                enemy.animFrame = (enemy.animFrame + 1) % maxFrame;
            }
        }
    }
}

function handleEnemyDefeat(enemy, index) {
    if (!enemies[index] || enemies[index] != enemy) {
        index = enemies.indexOf(enemy);
        if (index == -1) return;
    }
    if (!enemy.checkpointRecorded) {
        enemy.checkpointRecorded = true;
        recordCheckpointOutcome(false);
    }
    gainXP(enemy.value);
    if (Math.random() < ENEMY_DROP_CHANCE) {
        drops.push({
            x: enemy.x + enemy.width  / 2 - 5,
            y: enemy.y + enemy.height / 2 - 5,
            width: 10, height: 10
        });
    }
    if (nearestEnemyForLaser == enemy) nearestEnemyForLaser = null;
    enemies.splice(index, 1);

    if (player && player.items) {
        if (player.items.lifesteal > 0 && Math.random() < player.items.lifesteal * 0.08) {
            player.health = Math.min(player.maxHealth, player.health + 1);
        }
        if (player.items.chain > 0) {
            let chainDamage = player.items.chain * 0.3 * player.currentDamage;
            let deathX = enemy.x + enemy.width / 2;
            let deathY = enemy.y + enemy.height / 2;
            for (let i = enemies.length - 1; i >= 0; i--) {
                let other = enemies[i];
                if (!other) continue;
                if (distanceSq(deathX, deathY, other.x + other.width / 2, other.y + other.height / 2) <= 4900) {
                    other.currentHealth -= chainDamage;
                    if (other.currentHealth <= 0) handleEnemyDefeat(other, i);
                }
            }
        }
    }
}
