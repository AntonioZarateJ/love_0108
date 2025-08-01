
// === CONFIGURACIÓN INICIAL Y UTILIDADES ===
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

function hexToRgb(hex) {
    const bigint = parseInt(hex.slice(1), 16);
    return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}

function rgbToHex(r, g, b) {
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function interpolateColor(color1, color2, factor) {
    const [r1, g1, b1] = hexToRgb(color1);
    const [r2, g2, b2] = hexToRgb(color2);
    return rgbToHex(
        Math.round(r1 + factor * (r2 - r1)),
        Math.round(g1 + factor * (g2 - g1)),
        Math.round(b1 + factor * (b2 - b1))
    );
}

const stars = [], shootingStars = [], fallingElements = [];

const phrases = [ "Te adoro 🥰", "Mi cielo ☁️💗", "Mi todo 💞", "Eres mi paz 🌿", "Mi niña hermosa 🥹", "Mi reina 👑", "Eres mi alegría 😊", "Mi compañera de vida 🫶", "Mi ternura 🐻", "Eres mi destino ✨", "Mi pedacito de cielo 🌤️", "Mi razón de sonreír 😄", "Eres mi mundo 🌎", "Mi amor bonito 💕", "Mi tesoro 💎", "Eres lo mejor que me pasó 🌟", "Mi refugio 💞", "Mi suerte bonita 🍀", "Eres lo que siempre soñé 😍", "Mi sol en los días grises 🌤️", "Mi amor eterno ♾️", "Mi mitad perfecta 🧩", "Eres mi lugar seguro 🏡", "Mi dulzura 🍬", "Mi corazón feliz 💓", "Mi persona favorita 🥰", "Mi motor de vida 🔥💖", "Eres todo lo que quiero 💫", "Mi regalo del cielo ☁️", "Mi razón para seguir ❤️", "Mi abrazo favorito 🤗", "Mi angelito 😇", "Mi inspiración diaria ✍️", "Mi sueño hecho realidad 🌠", "Mi parte favorita del día ❤️", "Eres mi amor sin medida 🫶", "Mi niña del alma 💖", "Mi hogar con ojos 👀", "Mi mirada favorita 👁️", "Eres todo para mí 💘" ];

const images = ['https://png.pngtree.com/png-vector/20220619/ourmid/pngtree-sparkling-star-vector-icon-glitter-star-shape-png-image_5228522.png'];
const heartImages = Array.from({length: 12}, (_, i) => `img/photo${i+1}.jpg`);

const preloadedHearts = heartImages.map(src => { const img = new Image(); img.src = src; return img; });
const preloadedIcons = images.map(src => { const img = new Image(); img.src = src; return img; });

const textColorsCycle = ['#FFD700', '#FFA500', '#ADFF2F', '#00FFFF', '#FF69B4', '#FFFFFF', '#9932CC'];
let currentColorIndex = 0, nextColorIndex = 1, transitionProgress = 0, transitionSpeed = 0.005;

let cameraX = 0, cameraY = 0, zoomLevel = 1, focalLength = 300;
let isDragging = false, lastMouseX = 0, lastMouseY = 0;

// === RENDIMIENTO MEJORADO CON DETECCIÓN DE PESTAÑA ===
let isTabActive = true;
document.addEventListener('visibilitychange', () => {
    isTabActive = !document.hidden;
});

// === REDIMENSIONAR Y GENERAR ESTRELLAS ===
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    stars.length = 0;
    for (let i = 0; i < 300; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: Math.random() * 1.5 + 0.5,
            alpha: Math.random(),
            delta: (Math.random() * 0.02) + 0.005
        });
    }
}

function drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "#0a0a23");
    gradient.addColorStop(1, "#0c0004ff");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawStars() {
    stars.forEach(star => {
        star.alpha += star.delta;
        if (star.alpha <= 0 || star.alpha >= 1) star.delta *= -1;
        ctx.save();
        ctx.globalAlpha = star.alpha;
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });
}

// === ELEMENTOS CAÍDOS (FRASES E IMÁGENES) ===
function createFallingElement() {
    const MAX_FALLING_ELEMENTS = 50;
    if (fallingElements.length >= MAX_FALLING_ELEMENTS) return;

    const rand = Math.random();
    const type = rand < 0.6 ? 'phrase' : rand < 0.8 ? 'image' : 'heart';

    const minZ = focalLength * 1.5;
    const maxZ = focalLength * 5;
    const initialZ = minZ + Math.random() * (maxZ - minZ);
    const worldPlaneWidth = (canvas.width / focalLength) * maxZ;
    const worldPlaneHeight = (canvas.height / focalLength) * maxZ;
    const spawnRangeX = worldPlaneWidth * 1.1;
    const spawnRangeY = worldPlaneHeight * 1.1;

    const initialX = ((Math.random() + Math.random() - 1) * 0.5) * spawnRangeX;
    const initialY = ((Math.random() + Math.random() - 1) * 0.5) * spawnRangeY;

    let content, baseSize;
    if (type === 'phrase') {
        content = phrases[Math.floor(Math.random() * phrases.length)];
        baseSize = 30;
    } else if (type === 'heart') {
        content = preloadedHearts[Math.floor(Math.random() * preloadedHearts.length)];
        baseSize = 90;
    } else {
        content = preloadedIcons[Math.floor(Math.random() * preloadedIcons.length)];
        baseSize = 60;
    }

    fallingElements.push({ type, content, x: initialX, y: initialY, z: initialZ, baseSize, speedZ: Math.random() * 5 + 2 });
}

function drawFallingElements() {
    const currentTextColor = interpolateColor(textColorsCycle[currentColorIndex], textColorsCycle[nextColorIndex], transitionProgress);
    for (let i = fallingElements.length - 1; i >= 0; i--) {
        const el = fallingElements[i];
        el.z -= el.speedZ * zoomLevel;
        if (el.z <= 0) {
            fallingElements.splice(i, 1);
            createFallingElement();
            continue;
        }

        const perspectiveScale = focalLength / el.z;
        const size = el.baseSize * perspectiveScale * zoomLevel;
        const opacity = Math.max(0, Math.min(1, perspectiveScale));
        const displayX = (el.x - cameraX) * perspectiveScale + canvas.width / 2;
        const displayY = (el.y - cameraY) * perspectiveScale + canvas.height / 2;

        ctx.save();
        ctx.globalAlpha = opacity;

        if (el.type === 'phrase') {
            ctx.fillStyle = currentTextColor;
            ctx.font = `${size}px 'Indie Flower', cursive`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(el.content, displayX, displayY);
        } else if (el.content.complete && el.content.naturalHeight !== 0) {
            ctx.drawImage(el.content, displayX - size / 2, displayY - size / 2, size, size);
        }

        ctx.restore();
        if ((displayX + size / 2 < 0 || displayX - size / 2 > canvas.width || displayY + size / 2 < 0 || displayY - size / 2 > canvas.height) && el.z > focalLength) {
            fallingElements.splice(i, 1);
            createFallingElement();
        }
    }
}

function createShootingStar() {
    const startX = Math.random() * canvas.width;
    const startY = Math.random() * canvas.height / 2;
    shootingStars.push({
        x: startX,
        y: startY,
        length: Math.random() * 300 + 100,
        speed: Math.random() * 10 + 6,
        angle: Math.PI / 4,
        opacity: 1
    });
}

function drawShootingStars() {
    for (let i = shootingStars.length - 1; i >= 0; i--) {
        const s = shootingStars[i];
        const endX = s.x - Math.cos(s.angle) * s.length;
        const endY = s.y - Math.sin(s.angle) * s.length;
        const gradient = ctx.createLinearGradient(s.x, s.y, endX, endY);
        gradient.addColorStop(0, `rgba(255, 255, 255, ${s.opacity})`);
        gradient.addColorStop(1, `rgba(255, 255, 255, 0)`);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        s.x += Math.cos(s.angle) * s.speed;
        s.y += Math.sin(s.angle) * s.speed;
        s.opacity -= 0.01;
        if (s.opacity <= 0) shootingStars.splice(i, 1);
    }
}

// === ANIMACIÓN PRINCIPAL ===
function animate() {
    requestAnimationFrame(animate);
    if (!isTabActive) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    drawStars();
    drawShootingStars();
    drawFallingElements();
    transitionProgress += transitionSpeed;
    if (transitionProgress >= 1) {
        transitionProgress = 0;
        currentColorIndex = nextColorIndex;
        nextColorIndex = (nextColorIndex + 1) % textColorsCycle.length;
    }
}

// === INTERACCIÓN Y CONFIGURACIÓN INICIAL ===
canvas.addEventListener('mousedown', e => {
    isDragging = true;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    canvas.style.cursor = 'grabbing';
});
canvas.addEventListener('mousemove', e => {
    if (!isDragging) return;
    cameraX -= (e.clientX - lastMouseX) / zoomLevel;
    cameraY -= (e.clientY - lastMouseY) / zoomLevel;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
});
canvas.addEventListener('mouseup', () => isDragging = false);
canvas.addEventListener('mouseleave', () => isDragging = false);

window.addEventListener('resize', resizeCanvas);

resizeCanvas();
animate();
setInterval(createShootingStar, 500);
for (let i = 0; i < 40; i++) createFallingElement();
setInterval(createFallingElement, 300);
