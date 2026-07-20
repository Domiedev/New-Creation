function drawTowers() {
    for (let i = 0; i < towers.length; i++) {
        let tower = towers[i];
        let w = tower.width;
        let h = tower.height;
        ctx.save();
        ctx.translate(tower.x, tower.y);

        drawRect(w * 0.1, h * 0.7, w * 0.8, h * 0.3, '#555');

        if (tower.type == 'trap' && tower.isActive) {
            ctx.save();
            ctx.shadowColor = '#FFD700';
            ctx.shadowBlur = 10;
            drawIcon(tower.type, w / 2, h * 0.42, w * 0.85);
            ctx.restore();
        } else {
            drawIcon(tower.type, w / 2, h * 0.42, w * 0.75);
        }

        if (tower.type == 'sniper') {
            drawText(Math.floor(tower.chargePercent) + '%', w / 2, -10, 'cyan', '12px');
        }

        ctx.restore();

        if (tower.type == 'sniper' && tower.chargePercent >= 80) {
            let target = findHighestHealthEnemy();
            if (target) {
                let opacity = ((tower.chargePercent - 80) / 20) * 0.8;
                let cx = tower.x + tower.width  / 2;
                let cy = tower.y + tower.height / 2;
                let tx = target.x + target.width  / 2;
                let ty = target.y + target.height / 2;
                ctx.strokeStyle = 'rgba(0, 191, 255, ' + opacity + ')';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.lineTo(tx, ty);
                ctx.stroke();
                ctx.lineWidth = 1;
            }
        }
    }
}

function updateTowers() {
    for (let i = 0; i < towers.length; i++) {
        let tower = towers[i];

        if (tower.type == 'sniper') {
            updateSniper(tower);
        } else {
            tower.cooldownTimer = Math.max(0, tower.cooldownTimer - deltaTime);
            if (tower.cooldownTimer <= 0) {
                if (tower.type == 'trap') updateTrap(tower);
                else if (tower.type == 'incense') updateIncense(tower);
            }
            if (tower.type == 'trap' && tower.isActive) {
                tower.activeTimer -= deltaTime;
                if (tower.activeTimer <= 0) tower.isActive = false;
            }
        }
    }
}

function updateSniper(tower) {
    if (tower.chargePercent < 100) {
        tower.chargePercent = Math.min(100, tower.chargePercent + tower.chargeRate * deltaTime);
    }

    if (tower.chargePercent >= 100) {
        let target = findHighestHealthEnemy();
        if (target) {
            let cx = tower.x + tower.width  / 2;
            let cy = tower.y + tower.height / 2;
            let tx = target.x + target.width  / 2;
            let ty = target.y + target.height / 2;
            let angle = Math.atan2(ty - cy, tx - cx);
            projectiles.push({
                x: cx - 4, y: cy - 4,
                width: 8, height: 8,
                color: '#00BFFF',
                vx: Math.cos(angle) * 2000,
                vy: Math.sin(angle) * 2000,
                damage: TOWER_TYPES.sniper.baseDamage,
                isSniperBolt: true
            });
            tower.chargePercent = 0;
        }
    }
}

function updateTrap(tower) {
    let triggered = false;
    let cx = tower.x + tower.width  / 2;
    let cy = tower.y + tower.height / 2;
    for (let i = enemies.length - 1; i >= 0; i--) {
        let e = enemies[i];
        if (distanceSq(cx, cy, e.x + e.width / 2, e.y + e.height / 2) < tower.range * tower.range) {
            triggered = true;
            let dmg = TOWER_TYPES.trap.damage * getDamageMultiplier(e.x + e.width / 2, e.y + e.height / 2);
            e.currentHealth -= dmg;
            e.statusEffects.slowed = { duration: TOWER_TYPES.trap.slowDuration, speedMultiplier: TOWER_TYPES.trap.slowFactor };
            if (e.currentHealth <= 0) handleEnemyDefeat(e, i);
        }
    }
    if (triggered) {
        tower.isActive = true;
        tower.activeTimer = tower.activeDuration;
        tower.cooldownTimer = tower.cooldown;
    }
}

function updateIncense(tower) {
    let cx = tower.x + tower.width  / 2;
    let cy = tower.y + tower.height / 2;
    for (let i = 0; i < enemies.length; i++) {
        let e = enemies[i];
        if (distanceSq(cx, cy, e.x + e.width / 2, e.y + e.height / 2) < tower.range * tower.range) {
            e.statusEffects.burning = {
                duration: TOWER_TYPES.incense.burnDuration,
                damageInterval: 0.5,
                damageTimer: 0.5,
                damageAmount: TOWER_TYPES.incense.burnDamagePerSecond * 0.5
            };
        }
    }
    tower.cooldownTimer = tower.cooldown;
}

function getPathSegments() {
    let path = getCurrentPath();
    let segs = [];
    for (let i = 0; i < path.length - 1; i++) segs.push({ a: path[i], b: path[i + 1] });
    return segs;
}

function closestPointOnSegment(seg, x, y) {
    let ax = seg.a.x, ay = seg.a.y, bx = seg.b.x, by = seg.b.y;
    let dx = bx - ax, dy = by - ay;
    let lenSq = dx * dx + dy * dy;
    let t = lenSq > 0 ? Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / lenSq)) : 0;
    return { x: ax + t * dx, y: ay + t * dy };
}

function isSegmentHorizontal(seg) {
    return Math.abs(seg.a.y - seg.b.y) < Math.abs(seg.a.x - seg.b.x);
}

function findNearestSegmentIndex(x, y) {
    let segments = getPathSegments();
    let bestIndex = 0, bestDist = Infinity;
    for (let i = 0; i < segments.length; i++) {
        let p = closestPointOnSegment(segments[i], x, y);
        let d = distanceSq(x, y, p.x, p.y);
        if (d < bestDist) { bestDist = d; bestIndex = i; }
    }
    return bestIndex;
}

function getSegmentIndexForDirection(dir) {
    let segments = getPathSegments();
    let bestIndex = 0;
    for (let i = 1; i < segments.length; i++) {
        let seg = segments[i];
        let best = segments[bestIndex];
        let midY = (seg.a.y + seg.b.y) / 2, midX = (seg.a.x + seg.b.x) / 2;
        let bestMidY = (best.a.y + best.b.y) / 2, bestMidX = (best.a.x + best.b.x) / 2;
        if (dir == 'up'    && midY < bestMidY) bestIndex = i;
        if (dir == 'down'  && midY > bestMidY) bestIndex = i;
        if (dir == 'left'  && midX < bestMidX) bestIndex = i;
        if (dir == 'right' && midX > bestMidX) bestIndex = i;
    }
    return bestIndex;
}

function jumpTrapToDirection(dir) {
    let segments = getPathSegments();
    let currentSeg = segments[placingTowerSegmentIndex];
    let horizontal = isSegmentHorizontal(currentSeg);
    let isPerpendicular = horizontal ? (dir == 'up' || dir == 'down') : (dir == 'left' || dir == 'right');
    if (!isPerpendicular) return;

    placingTowerSegmentIndex = getSegmentIndexForDirection(dir);
    let snapped = closestPointOnSegment(getPathSegments()[placingTowerSegmentIndex], placingTowerX + 15, placingTowerY + 15);
    placingTowerX = snapped.x - 15;
    placingTowerY = snapped.y - 15;
}

function startTowerPlacement(typeKey) {
    placingTowerType = typeKey;
    placingTowerX = canvas.width  / 2 - 15;
    placingTowerY = canvas.height / 2 - 15;

    if (typeKey == 'trap') {
        placingTowerSegmentIndex = findNearestSegmentIndex(placingTowerX + 15, placingTowerY + 15);
        let snapped = closestPointOnSegment(getPathSegments()[placingTowerSegmentIndex], placingTowerX + 15, placingTowerY + 15);
        placingTowerX = snapped.x - 15;
        placingTowerY = snapped.y - 15;
    }

    setGameState('placingTower');
}

function confirmTowerPlacement() {
    if (!placingTowerType) return;

    let typeKey = placingTowerType;
    let tw = 30, th = 30;

    let newTower = {
        type: typeKey,
        x: placingTowerX, y: placingTowerY,
        width: tw, height: th,
        color: TOWER_TYPES[typeKey].color,
        range: TOWER_TYPES[typeKey].range,
        cooldown: TOWER_TYPES[typeKey].cooldown,
        cooldownTimer: 0
    };

    if (typeKey == 'sniper') {
        newTower.chargeRate    = TOWER_TYPES.sniper.chargeRate;
        newTower.maxCharge     = TOWER_TYPES.sniper.maxCharge;
        newTower.chargePercent = 0;
    } else if (typeKey == 'trap') {
        newTower.damage         = TOWER_TYPES.trap.damage;
        newTower.slowDuration   = TOWER_TYPES.trap.slowDuration;
        newTower.slowFactor     = TOWER_TYPES.trap.slowFactor;
        newTower.activeDuration = TOWER_TYPES.trap.activeDuration;
        newTower.isActive       = false;
        newTower.activeTimer    = 0;
    }

    towers.push(newTower);
    placingTowerType = null;
    setGameState(nextStateAfterPopup);
}
