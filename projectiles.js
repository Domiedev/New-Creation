function drawProjectile(p) {
    if (p.isSniperBolt) {
        ctx.save();
        ctx.fillStyle = '#00BFFF';
        ctx.shadowColor = '#00BFFF';
        ctx.shadowBlur = 10;
        ctx.fillRect(p.x, p.y, p.width, p.height);
        ctx.restore();
    } else {
        drawRect(p.x, p.y, p.width, p.height, p.color);
    }
}

function moveProjectiles() {
    if (gameState != 'playing' && gameState != 'betweenWaves') return;
    for (let i = projectiles.length - 1; i >= 0; i--) {
        let p = projectiles[i];
        p.x += p.vx * deltaTime;
        p.y += p.vy * deltaTime;

        if (p.x < -p.width || p.x > canvas.width || p.y < -p.height || p.y > canvas.height) {
            projectiles.splice(i, 1);
            continue;
        }

        let hitSomething = false;

        for (let j = enemies.length - 1; j >= 0; j--) {
            if (!enemies[j]) continue;
            let e = enemies[j];
            if (p.hitEnemies && p.hitEnemies.indexOf(e) != -1) continue;
            if (p.x < e.x + e.width && p.x + p.width > e.x && p.y < e.y + e.height && p.y + p.height > e.y) {
                let dmg = p.damage;
                if (e.statusEffects.burning.duration > 0) dmg *= TOWER_TYPES.incense.vulnerability;
                dmg *= getDamageMultiplier(e.x + e.width / 2, e.y + e.height / 2);
                e.currentHealth -= dmg;
                if (p.hitEnemies) p.hitEnemies.push(e);
                if (e.currentHealth <= 0) handleEnemyDefeat(e, j);

                if (p.piercesLeft > 0) {
                    p.piercesLeft--;
                } else {
                    projectiles.splice(i, 1);
                }
                hitSomething = true;
                break;
            }
        }

        if (hitSomething) continue;

        for (let k = sparks.length - 1; k >= 0; k--) {
            let s = sparks[k];
            let rr = (SPARK_VISUAL_RADIUS + 3) * (SPARK_VISUAL_RADIUS + 3);
            if (distanceSq(p.x + p.width / 2, p.y + p.height / 2, s.x, s.y) < rr) {
                sparks.splice(k, 1);
                if (p.piercesLeft > 0) {
                    p.piercesLeft--;
                } else {
                    projectiles.splice(i, 1);
                }
                hitSomething = true;
                break;
            }
        }

        if (hitSomething) continue;

        if (devilBoss && p.x < devilBoss.x + devilBoss.width && p.x + p.width > devilBoss.x &&
            p.y < devilBoss.y + devilBoss.height && p.y + p.height > devilBoss.y) {
            damageDevilBoss(p.damage);
            if (p.piercesLeft > 0) {
                p.piercesLeft--;
            } else {
                projectiles.splice(i, 1);
            }
        }
    }
}
