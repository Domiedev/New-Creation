function spawnSpark() {
    let pcx = player.x + player.width / 2;
    let pcy = player.y + player.height / 2;
    let angle = Math.random() * Math.PI * 2;
    let sx = pcx + Math.cos(angle) * SPARK_SPAWN_DISTANCE;
    let sy = pcy + Math.sin(angle) * SPARK_SPAWN_DISTANCE;

    let towardPlayer = Math.atan2(pcy - sy, pcx - sx) + (Math.random() - 0.5) * 0.8;
    let speed = Math.min(SPARK_SPEED_MAX, SPARK_SPEED_BASE + (currentWave - 1) * SPARK_SPEED_PER_WAVE);
    let spin = SPARK_SPIRAL_SPIN * (Math.random() < 0.5 ? -1 : 1);

    sparks.push({
        x: sx, y: sy,
        vx: Math.cos(towardPlayer) * speed,
        vy: Math.sin(towardPlayer) * speed,
        speed: speed,
        spin: spin
    });
}

function updateSparks() {
    if (gameState != 'playing' || !player) return;

    sparkSpawnTimer -= deltaTime;
    if (sparkSpawnTimer <= 0) {
        spawnSpark();
        sparkSpawnTimer = SPARK_SPAWN_INTERVAL_MIN + Math.random() * (SPARK_SPAWN_INTERVAL_MAX - SPARK_SPAWN_INTERVAL_MIN);
    }

    let pcx = player.x + player.width / 2;
    let pcy = player.y + player.height / 2;

    for (let i = sparks.length - 1; i >= 0; i--) {
        let s = sparks[i];

        let desired = Math.atan2(pcy - s.y, pcx - s.x);
        let current = Math.atan2(s.vy, s.vx);
        let diff = desired - current;
        while (diff > Math.PI)  diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;

        let maxTurn = SPARK_TURN_RATE * deltaTime;
        let turn = Math.max(-maxTurn, Math.min(maxTurn, diff)) + s.spin * deltaTime;
        let newDir = current + turn;

        s.vx = Math.cos(newDir) * s.speed;
        s.vy = Math.sin(newDir) * s.speed;
        s.x += s.vx * deltaTime;
        s.y += s.vy * deltaTime;

        if (distanceSq(s.x, s.y, pcx, pcy) <= SPARK_HIT_RADIUS * SPARK_HIT_RADIUS) {
            sparks.splice(i, 1);
            player.health--;
            if (player.health <= 0) setGameState('gameOver');
            continue;
        }

        if (s.x < -SPARK_DESPAWN_MARGIN || s.x > canvas.width + SPARK_DESPAWN_MARGIN ||
            s.y < -SPARK_DESPAWN_MARGIN || s.y > canvas.height + SPARK_DESPAWN_MARGIN) {
            sparks.splice(i, 1);
        }
    }
}

function drawSparks() {
    for (let i = 0; i < sparks.length; i++) {
        let s = sparks[i];

        let trailLen = 14;
        let speedLen = Math.max(1, Math.hypot(s.vx, s.vy));
        ctx.strokeStyle = 'rgba(255, 90, 60, 0.5)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x - (s.vx / speedLen) * trailLen, s.y - (s.vy / speedLen) * trailLen);
        ctx.stroke();
        ctx.lineWidth = 1;

        ctx.save();
        ctx.shadowColor = '#FF3030';
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#FF2222';
        ctx.beginPath();
        ctx.arc(s.x, s.y, SPARK_VISUAL_RADIUS, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}
