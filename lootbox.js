function checkDropsCollection() {
    if (gameState != 'playing' && gameState != 'betweenWaves') return;
    if (!player) return;
    for (let i = drops.length - 1; i >= 0; i--) {
        let d = drops[i];
        if (player.x < d.x + d.width  && player.x + player.width  > d.x &&
            player.y < d.y + d.height && player.y + player.height > d.y) {
            drops.splice(i, 1);
            triggerLootbox();
            break;
        }
    }
}

function triggerLootbox() {
    lootboxFinalIndex = Math.floor(Math.random() * LOOTBOX_CATALOG.length);
    nextStateAfterPopup = gameState;
    setGameState('lootboxOpening');
    if (lootboxTextP)     lootboxTextP.textContent = "Eine Segenstruhe wurde gefunden!";
    if (lootboxOpenButton) lootboxOpenButton.style.display = 'inline-block';
    if (lootboxOkButton)   lootboxOkButton.style.display = 'none';
    if (lootboxPopupDiv)   lootboxPopupDiv.style.display = 'block';
}

function openLootbox() {
    if (lootboxOpenButton) lootboxOpenButton.style.display = 'none';
    if (lootboxTextP)      lootboxTextP.textContent = "Sie öffnet sich...";

    let catalogLength = LOOTBOX_CATALOG.length;
    let laps = 2;
    let offset = (lootboxFinalIndex - 0 + catalogLength) % catalogLength;
    let totalSteps = laps * catalogLength + offset;
    if (totalSteps < catalogLength) totalSteps += catalogLength;

    let weights = [];
    let weightSum = 0;
    for (let i = 0; i < totalSteps; i++) {
        let w = (i + 1) * (i + 1);
        weights.push(w);
        weightSum += w;
    }
    lootboxStepIntervals = weights.map(function(w) { return (w / weightSum) * LOOTBOX_SELECT_DURATION; });
    lootboxHighlightIndex = 0;
    lootboxStepIndex = 0;
    lootboxStepTimer = lootboxStepIntervals[0];

    setGameState('lootboxSpinning');
}

function revealLootboxReward() {
    pendingLevelUps = 0;
    let rewardText = "";
    let reward = LOOTBOX_CATALOG[lootboxFinalIndex];
    lootboxHighlightIndex = lootboxFinalIndex;

    if (!reward) {
        rewardText = "Fehler beim Öffnen der Segenstruhe!";
    } else if (reward.category == 'tower') {
        rewardText = "Du erhältst: " + TOWER_TYPES[reward.key].name + "! Platziere ihn!";
        pendingTowerPlacement = reward.key;
    } else if (reward.category == 'item') {
        player.items[reward.key]++;
        if (reward.key == 'guardian') {
            player.maxHealth += 2;
            player.health = player.maxHealth;
        }
        rewardText = "Du erhältst: " + ITEM_TYPES[reward.key].name + "! " + ITEM_TYPES[reward.key].description;
    } else {
        rewardText = "Unbekannte Belohnung!?";
    }

    if (lootboxTextP)    lootboxTextP.textContent = rewardText;
    if (lootboxOkButton) lootboxOkButton.style.display = 'inline-block';
    setGameState('lootboxRevealing');
}

function gainXP(amount) {
    if (gameState == 'gameOver' || !player) return;
    player.xp += Math.round(amount);
    while (player.xp >= player.xpForNextLevel) {
        if (gameState != 'selectingPerk') levelUp();
        else break;
    }
}

function levelUp() {
    if (gameState == 'gameOver' || !player) return;
    nextStateAfterPopup = gameState;
    pendingLevelUps = 1;
    setGameState('selectingPerk');
}

function applyPerk(perkType) {
    if (!player || gameState != 'selectingPerk') return;

    if (perkType == 'speed') {
        player.shootSpeedMultiplier *= 1.2;
        player.currentShootInterval = BASE_SHOOT_INTERVAL / player.shootSpeedMultiplier;
    } else if (perkType == 'damage') {
        player.damageMultiplier *= 1.25;
        player.currentDamage = BASE_PROJECTILE_DAMAGE * player.damageMultiplier;
    } else if (perkType == 'shotgun') {
        player.multishotChance += MULTISHOT_CHANCE_PER_PERK;
    }
    player.perkLevels[perkType]++;

    player.level++;
    player.xp = 0;
    player.xpForNextLevel = Math.floor(BASE_XP_FOR_NEXT_LEVEL * Math.pow(XP_LEVEL_GROWTH, player.level - 1));
    pendingLevelUps--;

    if (pendingLevelUps > 0) {
        setGameState('selectingPerk');
    } else {
        if (player.xp >= player.xpForNextLevel && gameState != 'gameOver') levelUp();
        else setGameState(nextStateAfterPopup);
    }
}
