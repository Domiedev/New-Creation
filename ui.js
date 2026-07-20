function setGameState(newState) {
    if (gameState == newState) return;
    gameState = newState;

    if (playButton)       playButton.style.display       = (gameState == 'start')         ? 'inline-block' : 'none';
    if (retryButton)      retryButton.style.display      = (gameState == 'gameOver')      ? 'inline-block' : 'none';
    if (perkSelectionDiv) perkSelectionDiv.style.display = (gameState == 'selectingPerk') ? 'block'        : 'none';
    if (infoPopupDiv)     infoPopupDiv.style.display     = (gameState == 'infoPopup')     ? 'block'        : 'none';
    if (lootboxPopupDiv) {
        let show = (gameState == 'lootboxOpening' || gameState == 'lootboxSpinning' || gameState == 'lootboxRevealing');
        lootboxPopupDiv.style.display = show ? 'block' : 'none';
    }
}

function drawStaircaseTicks(path, color) {
    let tickSpacing = 22;
    let tickHalfLen = 13;
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    for (let i = 0; i < path.length - 1; i++) {
        let a = path[i], b = path[i + 1];
        let dx = b.x - a.x, dy = b.y - a.y;
        let segLen = Math.hypot(dx, dy);
        if (segLen < 1) continue;
        let ux = dx / segLen, uy = dy / segLen;
        let px = -uy, py = ux;
        let steps = Math.floor(segLen / tickSpacing);
        for (let s = 1; s < steps; s++) {
            let t = s * tickSpacing;
            let cx = a.x + ux * t, cy = a.y + uy * t;
            ctx.beginPath();
            ctx.moveTo(cx - px * tickHalfLen, cy - py * tickHalfLen);
            ctx.lineTo(cx + px * tickHalfLen, cy + py * tickHalfLen);
            ctx.stroke();
        }
    }
    ctx.lineWidth = 1;
}

function drawPath() {
    let path = getCurrentPath();
    ctx.strokeStyle = '#C8960C';
    ctx.lineWidth = 22;
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i].x, path[i].y);
    }
    ctx.stroke();
    ctx.lineWidth = 1;

    drawStaircaseTicks(path, '#8B6508');
}

function drawXPBar() {
    let barH = 20;
    let barW = canvas.width * 0.8;
    let barX = canvas.width * 0.1;
    let barY = canvas.height - barH - 10;
    let pct = player.xpForNextLevel > 0 ? Math.max(0, Math.min(1, player.xp / player.xpForNextLevel)) : 0;
    drawRect(barX, barY, barW, barH, '#555');
    drawRect(barX, barY, barW * pct, barH, 'yellow');
    drawText('Level: ' + player.level + ' | XP: ' + player.xp + ' / ' + player.xpForNextLevel, canvas.width / 2, barY + barH / 2, 'black', '14px');
}

function drawDrops() {
    for (let i = 0; i < drops.length; i++) {
        let drop = drops[i];
        ctx.fillStyle = 'aqua';
        ctx.beginPath();
        ctx.moveTo(drop.x + drop.width / 2, drop.y);
        ctx.lineTo(drop.x + drop.width, drop.y + drop.height / 2);
        ctx.lineTo(drop.x + drop.width / 2, drop.y + drop.height);
        ctx.lineTo(drop.x, drop.y + drop.height / 2);
        ctx.closePath();
        ctx.fill();
    }
}

function getWaveLabel(wave) {
    let region = getCurrentRegion(wave);
    if (region.waveEnd == Infinity) return region.name + ' · Welle ' + wave;
    let localWave = wave - region.waveStart + 1;
    return region.name + ' · Welle ' + localWave + '/' + LEVEL_WAVE_LENGTH;
}

function drawUI() {
    if (!player) return;
    drawText('Leben: ' + player.health, 60, 30, 'red', '20px', 'left');
    drawText(getWaveLabel(currentWave), canvas.width - 60, 30, 'blue', '18px', 'right');
    if (gameState == 'playing') {
        drawText('Zeit übrig: ' + Math.ceil(waveTimer) + 's', canvas.width / 2, 30);
    } else if (gameState == 'betweenWaves') {
        drawText('Nächste Welle in: ' + Math.ceil(intermissionTimer) + 's', canvas.width / 2, canvas.height / 2 - 50, 'orange', '30px');
        drawText('Bereite dich vor auf: ' + getWaveLabel(currentWave + 1), canvas.width / 2, canvas.height / 2);
    }
    drawXPBar();
    drawHudSidebar();
    drawDevilBossHealthBar();
}

function drawDevilBossHealthBar() {
    if (!devilBoss) return;
    let barW = canvas.width * 0.6, barH = 16;
    let barX = canvas.width / 2 - barW / 2, barY = 44;
    let pct = Math.max(0, devilBoss.currentHealth / devilBoss.maxHealth);
    drawText('Der Teufel', canvas.width / 2, barY - 10, '#FF3333', '16px');
    drawRect(barX, barY, barW, barH, '#330000');
    drawRect(barX, barY, barW * pct, barH, '#CC1414');
}

const PERK_LABELS = { speed: 'Eifer', damage: 'Zorn', shotgun: 'Segen' };
const PERK_DOT_COLOR = { speed: '#FFD700', damage: '#FF4444', shotgun: '#4488FF' };

function drawHudSidebar() {
    if (!player) return;
    let rows = [];

    for (let key in player.perkLevels) {
        if (player.perkLevels[key] > 0) {
            rows.push({ label: PERK_LABELS[key] + ' Lv.' + player.perkLevels[key], iconKey: null, dotColor: PERK_DOT_COLOR[key] });
        }
    }
    for (let key in ITEM_TYPES) {
        if (player.items[key] > 0) {
            rows.push({ label: ITEM_TYPES[key].name + ' x' + player.items[key], iconKey: key });
        }
    }
    let towerCounts = {};
    for (let i = 0; i < towers.length; i++) {
        towerCounts[towers[i].type] = (towerCounts[towers[i].type] || 0) + 1;
    }
    for (let key in towerCounts) {
        rows.push({ label: TOWER_TYPES[key].name + ' x' + towerCounts[key], iconKey: key });
    }

    if (rows.length == 0) return;

    let x = 10, y = 45, rowH = 22, panelW = 140;
    let panelH = rows.length * rowH + 10;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(x, y, panelW, panelH);
    ctx.restore();

    for (let i = 0; i < rows.length; i++) {
        let row = rows[i];
        let ry = y + 10 + i * rowH + rowH / 2;
        if (row.iconKey) {
            drawIcon(row.iconKey, x + 16, ry, 16);
        } else {
            ctx.fillStyle = row.dotColor;
            ctx.beginPath();
            ctx.arc(x + 16, ry, 6, 0, Math.PI * 2);
            ctx.fill();
        }
        drawText(row.label, x + 30, ry, 'white', '12px', 'left');
    }
}

function drawStartScreen() {
    let cx = canvas.width / 2;
    let ty = canvas.height / 2 - 60;

    ctx.save();
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.font         = "900 74px 'Cinzel', Georgia, serif";
    ctx.shadowColor  = '#B8860B';
    ctx.shadowBlur   = 18;

    let grad = ctx.createLinearGradient(cx - 220, ty - 40, cx + 220, ty + 40);
    grad.addColorStop(0,   '#7B4F00');
    grad.addColorStop(0.3, '#FFD700');
    grad.addColorStop(0.5, '#FFF8A0');
    grad.addColorStop(0.7, '#FFD700');
    grad.addColorStop(1,   '#7B4F00');
    ctx.fillStyle = grad;
    ctx.fillText("NEW CREATION", cx, ty);

    ctx.shadowBlur = 0;
    ctx.restore();

    drawText("Klicke auf 'Play', um zu beginnen!",       cx, canvas.height / 2 + 40, '#000000', '22px');
    drawText("Pfeiltasten oder WASD zum Bewegen",         cx, canvas.height / 2 + 75, '#000000', '16px');
    drawText("Leertaste überspringt die Pause",           cx, canvas.height / 2 + 100, '#000000', '16px');
    drawText("Tab: Manuelle Zielsteuerung an/aus",        cx, canvas.height / 2 + 125, '#000000', '16px');
}

function drawGameOverScreen() {
    drawRect(0, 0, canvas.width, canvas.height, 'rgba(100, 0, 0, 0.8)');
    drawText("GAME OVER", canvas.width / 2, canvas.height / 2 - 40, 'white', '60px');
    drawText('Du hast erreicht: ' + getWaveLabel(currentWave), canvas.width / 2, canvas.height / 2 + 20, 'white', '30px');
}

function drawLootboxGrid() {
    let count       = LOOTBOX_CATALOG.length;
    let gap         = 6;
    let displayWidth = canvas.width * 0.9;
    let displayX     = canvas.width * 0.05;
    let displayY     = canvas.height / 2 - 50;
    let itemHeight   = 100;
    let boxWidth     = (displayWidth - (count - 1) * gap) / count;

    for (let i = 0; i < count; i++) {
        let entry = LOOTBOX_CATALOG[i];
        let boxX = displayX + i * (boxWidth + gap);
        let color = entry.category == 'tower' ? '#DAA520' : '#2255CC';
        drawRect(boxX, displayY, boxWidth, itemHeight, color);
        drawIcon(entry.key, boxX + boxWidth / 2, displayY + itemHeight * 0.38, boxWidth * 0.55);
        drawText(entry.name, boxX + boxWidth / 2, displayY + itemHeight * 0.8, 'white', '11px');

        if (i == lootboxHighlightIndex) {
            ctx.save();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 4;
            ctx.strokeRect(boxX - 2, displayY - 2, boxWidth + 4, itemHeight + 4);
            ctx.restore();
        }
    }

    let highlightBoxX = displayX + lootboxHighlightIndex * (boxWidth + gap) + boxWidth / 2;
    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.moveTo(highlightBoxX - 10, displayY - 10);
    ctx.lineTo(highlightBoxX + 10, displayY - 10);
    ctx.lineTo(highlightBoxX, displayY);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(highlightBoxX - 10, displayY + itemHeight + 10);
    ctx.lineTo(highlightBoxX + 10, displayY + itemHeight + 10);
    ctx.lineTo(highlightBoxX, displayY + itemHeight);
    ctx.closePath();
    ctx.fill();
}

function drawPlacementMode() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (placingTowerType == 'trap') {
        let path = getCurrentPath();
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.9)';
        ctx.lineWidth = 24;
        ctx.beginPath();
        ctx.moveTo(path[0].x, path[0].y);
        for (let i = 1; i < path.length; i++) {
            ctx.lineTo(path[i].x, path[i].y);
        }
        ctx.stroke();
        ctx.lineWidth = 1;
    }

    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.translate(placingTowerX, placingTowerY);
    let w = 30, h = 30;
    drawRect(w * 0.1, h * 0.7, w * 0.8, h * 0.3, '#555');
    drawIcon(placingTowerType, w / 2, h * 0.42, w * 0.75);
    ctx.restore();

    drawText('ENTER zum Platzieren', canvas.width / 2, 30, '#FFD700', '22px');
    if (placingTowerType == 'trap') {
        drawText('Pfeiltasten: entlang des Weges schieben · quer drücken springt zur nächsten Wegseite', canvas.width / 2, 54, '#FFD700', '13px');
    }
}

function generateSilhouette(baseY, bumpHeight, segments, seedStr) {
    let seed = 0;
    for (let i = 0; i < seedStr.length; i++) seed += seedStr.charCodeAt(i) * (i + 1);
    function noise(n) {
        let x = Math.sin(seed + n * 12.9898) * 43758.5453;
        return x - Math.floor(x);
    }
    let points = [];
    for (let i = 0; i <= segments; i++) {
        let x = (canvas.width / segments) * i;
        let y = baseY - noise(i) * bumpHeight - Math.sin(i * 0.8 + seed) * bumpHeight * 0.4;
        points.push({ x: x, y: y });
    }
    return points;
}

function getRegionScene(region) {
    if (regionSceneCache[region.key]) return regionSceneCache[region.key];
    let scene = {
        back:  generateSilhouette(canvas.height * 0.55, 45, 14, region.key + '-back'),
        front: generateSilhouette(canvas.height * 0.74, 60, 10, region.key + '-front')
    };
    regionSceneCache[region.key] = scene;
    return scene;
}

function drawSilhouette(points, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);
    for (let i = 0; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.lineTo(canvas.width, canvas.height);
    ctx.closePath();
    ctx.fill();
}

function drawRegionBackground() {
    let region = getCurrentRegion(currentWave);
    let scene = getRegionScene(region);

    let grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, region.sky[0]);
    grad.addColorStop(1, region.sky[1]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawSilhouette(scene.back, region.silhouetteBack);
    drawSilhouette(scene.front, region.silhouetteFront);
}

function drawAimModeMessage() {
    if (aimModeMessageTimer <= 0) return;
    ctx.save();
    ctx.globalAlpha = Math.min(1, aimModeMessageTimer / 0.25) * 0.7;
    ctx.fillStyle = '#333333';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    let label = autoAimEnabled ? 'Automatische Steuerung aktiviert' : 'Automatische Steuerung deaktiviert';
    let sub = autoAimEnabled ? '' : 'Pfeiltasten zum Zielen';
    drawText(label, canvas.width / 2, canvas.height / 2 - (sub ? 15 : 0), 'white', '26px');
    if (sub) drawText(sub, canvas.width / 2, canvas.height / 2 + 20, '#dddddd', '16px');
}
