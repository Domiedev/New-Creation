function drawSwordIcon(s, color) {
    ctx.fillStyle = color;
    ctx.strokeStyle = '#3a2a00';
    ctx.lineWidth = Math.max(1, s * 0.03);

    ctx.beginPath();
    ctx.moveTo(0, -s * 0.5);
    ctx.lineTo(s * 0.09, -s * 0.1);
    ctx.lineTo(-s * 0.09, -s * 0.1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillRect(-s * 0.05, -s * 0.12, s * 0.1, s * 0.42);
    ctx.strokeRect(-s * 0.05, -s * 0.12, s * 0.1, s * 0.42);

    ctx.fillStyle = '#3a2a00';
    ctx.fillRect(-s * 0.22, s * 0.16, s * 0.44, s * 0.07);
    ctx.beginPath();
    ctx.arc(0, s * 0.34, s * 0.07, 0, Math.PI * 2);
    ctx.fill();
}

function drawThornIcon(s, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(1.5, s * 0.06);
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.28, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = color;
    let spikes = 8;
    for (let i = 0; i < spikes; i++) {
        let angle = (i / spikes) * Math.PI * 2;
        let innerR = s * 0.28;
        let outerR = s * 0.48;
        let baseAngle1 = angle - 0.12;
        let baseAngle2 = angle + 0.12;
        ctx.beginPath();
        ctx.moveTo(Math.cos(baseAngle1) * innerR, Math.sin(baseAngle1) * innerR);
        ctx.lineTo(Math.cos(angle) * outerR, Math.sin(angle) * outerR);
        ctx.lineTo(Math.cos(baseAngle2) * innerR, Math.sin(baseAngle2) * innerR);
        ctx.closePath();
        ctx.fill();
    }
}

function drawFlameIcon(s, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.5);
    ctx.quadraticCurveTo(s * 0.32, -s * 0.05, s * 0.16, s * 0.22);
    ctx.quadraticCurveTo(s * 0.1, s * 0.4, 0, s * 0.5);
    ctx.quadraticCurveTo(-s * 0.1, s * 0.4, -s * 0.16, s * 0.22);
    ctx.quadraticCurveTo(-s * 0.32, -s * 0.05, 0, -s * 0.5);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = 'rgba(255,255,180,0.85)';
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.16);
    ctx.quadraticCurveTo(s * 0.1, s * 0.05, 0, s * 0.28);
    ctx.quadraticCurveTo(-s * 0.1, s * 0.05, 0, -s * 0.16);
    ctx.closePath();
    ctx.fill();
}

function drawReticleIcon(s, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(1.5, s * 0.06);
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.36, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.1, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, -s * 0.5); ctx.lineTo(0, -s * 0.36);
    ctx.moveTo(0, s * 0.5);  ctx.lineTo(0, s * 0.36);
    ctx.moveTo(-s * 0.5, 0); ctx.lineTo(-s * 0.36, 0);
    ctx.moveTo(s * 0.5, 0);  ctx.lineTo(s * 0.36, 0);
    ctx.stroke();
}

function drawChevronsIcon(s, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(1.5, s * 0.09);
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
        let x = -s * 0.32 + i * s * 0.32;
        ctx.beginPath();
        ctx.moveTo(x - s * 0.12, -s * 0.22);
        ctx.lineTo(x + s * 0.12, 0);
        ctx.lineTo(x - s * 0.12, s * 0.22);
        ctx.stroke();
    }
    ctx.lineCap = 'butt';
}

function drawHeartIcon(s, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, s * 0.34);
    ctx.bezierCurveTo(-s * 0.5, -s * 0.05, -s * 0.22, -s * 0.46, 0, -s * 0.12);
    ctx.bezierCurveTo(s * 0.22, -s * 0.46, s * 0.5, -s * 0.05, 0, s * 0.34);
    ctx.closePath();
    ctx.fill();
}

function drawShieldIcon(s, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.48);
    ctx.quadraticCurveTo(s * 0.4, -s * 0.4, s * 0.38, -s * 0.1);
    ctx.quadraticCurveTo(s * 0.36, s * 0.3, 0, s * 0.5);
    ctx.quadraticCurveTo(-s * 0.36, s * 0.3, -s * 0.38, -s * 0.1);
    ctx.quadraticCurveTo(-s * 0.4, -s * 0.4, 0, -s * 0.48);
    ctx.closePath();
    ctx.fill();
}

function drawBoltIcon(s, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(s * 0.12, -s * 0.5);
    ctx.lineTo(-s * 0.22, s * 0.05);
    ctx.lineTo(0, s * 0.05);
    ctx.lineTo(-s * 0.12, s * 0.5);
    ctx.lineTo(s * 0.28, -s * 0.12);
    ctx.lineTo(s * 0.04, -s * 0.12);
    ctx.closePath();
    ctx.fill();
}

const ICON_DRAWERS = {
    sniper:    { fn: drawSwordIcon,    color: '#FFD700' },
    trap:      { fn: drawThornIcon,    color: '#8B4513' },
    incense:   { fn: drawFlameIcon,    color: '#FF6A00' },
    aoe:       { fn: drawReticleIcon,  color: '#4488FF' },
    pierce:    { fn: drawChevronsIcon, color: '#4488FF' },
    lifesteal: { fn: drawHeartIcon,    color: '#4488FF' },
    guardian:  { fn: drawShieldIcon,   color: '#4488FF' },
    chain:     { fn: drawBoltIcon,     color: '#4488FF' }
};

function drawIcon(key, cx, cy, size) {
    let entry = ICON_DRAWERS[key];
    if (!entry) return;
    ctx.save();
    ctx.translate(cx, cy);
    entry.fn(size, entry.color);
    ctx.restore();
}
