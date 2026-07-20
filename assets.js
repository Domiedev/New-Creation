function loadImages() {
    let imageSources = {
        angel: 'angel.png',
        imp:   'Goon1.png',
        tank:  'tank.png'
    };

    let totalImages = Object.keys(imageSources).length;
    let loadedCount = 0;
    let failed = false;

    for (let key in imageSources) {
        let img = new Image();
        img.onload = function() {
            gameImages[key] = img;
            loadedCount++;
            if (loadedCount >= totalImages && !failed) {
                imagesLoaded = true;
                setGameState('start');
                requestAnimationFrame(gameLoop);
            }
        };
        img.onerror = function() {
            failed = true;
            alert("Could not load image: " + imageSources[key]);
        };
        img.src = imageSources[key];
    }

    shootSoundPool = [];
    for (let i = 0; i < SHOOT_SOUND_POOL_SIZE; i++) {
        let snd = new Audio('shoot.mp3');
        snd.volume = 0.4;
        shootSoundPool.push(snd);
    }
    shootSoundPoolIndex = 0;
}

function playShootSound() {
    let now = performance.now() / 1000;
    if (now - lastShootSoundTime < SHOOT_SOUND_MIN_GAP) return;
    lastShootSoundTime = now;
    if (shootSoundPool.length == 0) return;
    let snd = shootSoundPool[shootSoundPoolIndex];
    shootSoundPoolIndex = (shootSoundPoolIndex + 1) % shootSoundPool.length;
    snd.currentTime = 0;
    let playResult = snd.play();
    if (playResult && playResult.catch) playResult.catch(function() {});
}
