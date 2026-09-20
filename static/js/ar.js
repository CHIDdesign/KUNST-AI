// --- AR Crosshair, outline drawing & artwork popup: index page only ---
// Loaded by index.html alone. On the scrolling about page the full-screen canvas
// and the non-passive touchmove handler fight swipe-to-scroll on mobile.
const crossX = document.createElement('div');
crossX.className = 'crosshair-x';
const crossY = document.createElement('div');
crossY.className = 'crosshair-y';
const coordBox = document.createElement('div');
coordBox.className = 'coord-tracker';
const canvas = document.createElement('canvas');
canvas.id = 'ar-canvas';
document.body.append(crossX, crossY, coordBox, canvas);
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function resamplePath(path, numPoints) {
    if (path.length < 2) return path;
    let totalLen = 0;
    const lengths = [0];
    for (let i = 1; i < path.length; i++) {
        const d = Math.hypot(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y);
        totalLen += d;
        lengths.push(totalLen);
    }
    const dClose = Math.hypot(path[0].x - path[path.length - 1].x, path[0].y - path[path.length - 1].y);
    totalLen += dClose;
    lengths.push(totalLen);
    const closedPath = [...path, path[0]];

    const newPath = [];
    for (let i = 0; i < numPoints; i++) {
        const targetLen = (i / numPoints) * totalLen;
        let j = 1;
        while (j < lengths.length && lengths[j] < targetLen) {
            j++;
        }
        if (j >= lengths.length) {
            newPath.push({...closedPath[closedPath.length - 1]});
            continue;
        }
        const segmentLen = lengths[j] - lengths[j - 1];
        if (segmentLen === 0) {
            newPath.push({...closedPath[j]});
        } else {
            const t = (targetLen - lengths[j - 1]) / segmentLen;
            newPath.push({
                x: closedPath[j - 1].x + (closedPath[j].x - closedPath[j - 1].x) * t,
                y: closedPath[j - 1].y + (closedPath[j].y - closedPath[j - 1].y) * t
            });
        }
    }
    return newPath;
}

const N = 300; // points per outline: drawn loops and traced contours share it so one can slide onto the other
const BLINK = 450, MORPH = 900;
const WHITE = [244, 244, 244], ORANGE = [255, 115, 0];
const lerp = (a, b, t) => a + (b - a) * t;
const area = pts => pts.reduce((s, p, i) => s + p.x * pts[(i + 1) % pts.length].y - pts[(i + 1) % pts.length].x * p.y, 0);

// Silhouette of an artwork from its SVG's alpha: outer contour + interior samples, in 0..1 image coords
function traceArtwork(img) {
    const PAD = 4, w = 200, h = Math.round(w * img.naturalHeight / img.naturalWidth);
    const W = w + PAD * 2, H = h + PAD * 2;
    const g = Object.assign(document.createElement('canvas'), { width: W, height: H }).getContext('2d', { willReadFrequently: true });
    g.drawImage(img, PAD, PAD, w, h);
    let alpha = null;
    // ponytail: file:// taints the canvas, so opened from disk the silhouette falls back to the image box; served over http it is exact
    try { alpha = g.getImageData(0, 0, W, H).data; } catch (e) {}
    const solid = (x, y) => x >= 0 && y >= 0 && x < W && y < H &&
        (alpha ? alpha[(y * W + x) * 4 + 3] > 0 : x >= PAD && y >= PAD && x < PAD + w && y < PAD + h);
    const norm = p => ({ x: (p.x - PAD) / w, y: (p.y - PAD) / h });

    const inside = [];
    for (let y = 0; y < H; y += 4) for (let x = 0; x < W; x += 4) if (solid(x, y)) inside.push(norm({ x, y }));

    // Grow the silhouette a few px so the line wraps the art instead of sitting on its edge
    if (alpha) {
        for (let a = 0; a < 8; a++) g.drawImage(img, PAD + 3 * Math.cos(a * Math.PI / 4), PAD + 3 * Math.sin(a * Math.PI / 4), w, h);
        alpha = g.getImageData(0, 0, W, H).data;
    }

    // Moore-neighbour trace of the outer boundary, clockwise from the top-left-most pixel
    const D = [[-1, 0], [-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1]];
    let i = 0;
    while (!solid(i % W, Math.floor(i / W))) i++;
    const sx = i % W, sy = Math.floor(i / W);
    let x = sx, y = sy, b = 0; // b: direction of the empty pixel we came from
    const outline = [];
    do {
        outline.push({ x, y });
        for (let k = 1; k <= 8; k++) {
            const [dx, dy] = D[(b + k) % 8];
            if (solid(x + dx, y + dy)) {
                const [ex, ey] = D[(b + k - 1) % 8];
                x += dx; y += dy;
                b = D.findIndex(([px, py]) => px === ex - dx && py === ey - dy);
                break;
            }
        }
    } while ((x !== sx || y !== sy || b !== 0) && outline.length < W * H);

    return { outline: resamplePath(outline, N).map(norm), inside };
}

// 0..1 image coords -> screen coords, through the container's rotation (it rotates about its centre)
function toScreen(container, pts) {
    const r = container.getBoundingClientRect();
    const m = new DOMMatrix(getComputedStyle(container).transform);
    const w = container.offsetWidth, h = container.offsetHeight;
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    return pts.map(p => {
        const x = (p.x - 0.5) * w, y = (p.y - 0.5) * h;
        return { x: cx + m.a * x + m.c * y, y: cy + m.b * x + m.d * y };
    });
}

const artworks = [...document.querySelectorAll('.artwork-container')];
artworks.forEach(container => {
    const img = container.querySelector('.artwork-img');
    const trace = () => { container.art = traceArtwork(img); };
    if (img.complete) trace(); else img.addEventListener('load', trace);
});

let isDrawing = false;
let justDrew = false; // a finished loop must not also count as a click on the artwork under it
let currentPath = [];
let shapes = [];

function startDrawing(e, x, y) {
    // No drawing from links/buttons or while the popup is open
    if (e.target.closest('a, button, .popup-overlay')) return;
    isDrawing = true;
    justDrew = false;
    currentPath = [{x, y}];
}

function extendDrawing(x, y) {
    const lastPoint = currentPath[currentPath.length - 1];
    if (Math.hypot(x - lastPoint.x, y - lastPoint.y) > 35) currentPath.push({x, y});
}

document.addEventListener('mousedown', (e) => startDrawing(e, e.clientX, e.clientY));
document.addEventListener('touchstart', (e) => startDrawing(e, e.touches[0].clientX, e.touches[0].clientY));

document.addEventListener('mousemove', (e) => {
    // Crosshair update (Hardware accelerated)
    crossX.style.transform = `translate3d(0, ${e.clientY}px, 0)`;
    crossY.style.transform = `translate3d(${e.clientX}px, 0, 0)`;

    // Coords update
    coordBox.style.transform = `translate3d(${e.clientX + 20}px, ${e.clientY + 20}px, 0)`;
    coordBox.innerText = `[ SCANNING... X:${e.clientX} Y:${e.clientY} ]`;

    if (isDrawing) extendDrawing(e.clientX, e.clientY);
});

document.addEventListener('touchmove', (e) => {
    if (!isDrawing) return;
    // Prevent rubber-banding / scrolling on mobile while drawing
    if (e.cancelable) e.preventDefault();
    extendDrawing(e.touches[0].clientX, e.touches[0].clientY);
}, { passive: false });

document.addEventListener('mouseup', (e) => {
    if (!isDrawing) return;
    isDrawing = false;
    currentPath.push({x: e.clientX, y: e.clientY});
    saveShape();
});

document.addEventListener('touchend', (e) => {
    if (!isDrawing) return;
    isDrawing = false;
    if (e.changedTouches.length > 0) {
        currentPath.push({x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY});
    }
    saveShape();
});

function saveShape() {
    if (currentPath.length > 2) {
        justDrew = true;
        const path = resamplePath(currentPath, N);
        const loop = new Path2D();
        path.forEach(p => loop.lineTo(p.x, p.y));
        // An artwork is recognised once at least half of its silhouette sits inside the loop
        const hit = artworks.find(c => c.art &&
            toScreen(c, c.art.inside).filter(p => ctx.isPointInPath(loop, p.x, p.y)).length >= c.art.inside.length / 2);
        if (hit) {
            activateArtwork(hit, path);
        } else {
            shapes.push({ path: currentPath, createdAt: Date.now(), lifeTime: 2000, fadeTime: 1000 });
        }
    }
    currentPath = [];
}

function activateArtwork(container, path) {
    // Only one recognised artwork at a time: its outline replaces the previous one
    artworks.forEach(c => c.classList.remove('active', 'selected'));
    shapes = shapes.filter(s => !s.container);

    // Same winding + start from the drawn point nearest the contour's first point, so the line slides over without twisting
    const to = toScreen(container, container.art.outline);
    if (Math.sign(area(path)) !== Math.sign(area(to))) path.reverse();
    let k = 0;
    path.forEach((p, i) => {
        if (Math.hypot(p.x - to[0].x, p.y - to[0].y) < Math.hypot(path[k].x - to[0].x, path[k].y - to[0].y)) k = i;
    });
    shapes.push({ container, from: path.slice(k).concat(path.slice(0, k)), createdAt: Date.now(), hot: 0 });
}

// Render Loop for Canvas
function renderCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const now = Date.now();
    const pulse = 0.3 + 0.7 * (Math.sin(now * 0.01) + 1) / 2; // scanning pulse for free drawings

    shapes = shapes.filter(s => s.container || now - s.createdAt < s.lifeTime + s.fadeTime);
    for (const s of shapes) {
        const age = now - s.createdAt;
        if (s.container) {
            // One recognition blink, then the drawn line slides onto the artwork's contour and stays there
            const to = toScreen(s.container, s.container.art.outline);
            const t = Math.min(1, Math.max(0, (age - BLINK) / MORPH));
            const e = t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;
            const blink = age < BLINK ? Math.sin(Math.PI * age / BLINK) : 0;
            if (t === 1) s.container.classList.add('active');

            // Crossfade white -> orange while hovered or while its popup is open
            const c = s.container;
            const hot = c.classList.contains('active') && (c.classList.contains('selected') || c.matches(':hover')) ? 1 : 0;
            s.hot += (hot - s.hot) * 0.15;
            const rgb = WHITE.map((v, i) => Math.round(lerp(v, ORANGE[i], s.hot))).join(',');

            const pts = s.from.map((p, i) => ({ x: lerp(p.x, to[i].x, e), y: lerp(p.y, to[i].y, e) }));
            drawPath(pts, true, `rgba(${rgb},${0.85 + 0.15 * blink})`, `rgba(${rgb},${0.08 + 0.06 * s.hot + 0.22 * blink})`, 3 + 3 * blink);
        } else {
            const a = (age > s.lifeTime ? 1 - (age - s.lifeTime) / s.fadeTime : 1) * pulse;
            drawPath(s.path, true, `rgba(244,244,244,${a})`, `rgba(244,244,244,${0.06 * a})`, 3);
        }
    }

    if (isDrawing && currentPath.length > 0) {
        drawPath(currentPath, false, `rgba(244,244,244,${pulse})`, null, 3); // Open while drawing
    }

    requestAnimationFrame(renderCanvas);
}
requestAnimationFrame(renderCanvas);

function drawPath(points, isClosed, stroke, fill, width) {
    if (points.length < 2) return;

    ctx.beginPath();

    if (isClosed && points.length > 2) {
        const startXc = (points[points.length - 1].x + points[0].x) / 2;
        const startYc = (points[points.length - 1].y + points[0].y) / 2;
        ctx.moveTo(startXc, startYc);

        for (let i = 0; i < points.length; i++) {
            const nextPoint = points[(i + 1) % points.length];
            const xc = (points[i].x + nextPoint.x) / 2;
            const yc = (points[i].y + nextPoint.y) / 2;
            ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
        }
        ctx.closePath();
    } else {
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length - 1; i++) {
            const xc = (points[i].x + points[i + 1].x) / 2;
            const yc = (points[i].y + points[i + 1].y) / 2;
            ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
        }
        ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
    }

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = width;
    if (fill) {
        ctx.fillStyle = fill;
        ctx.fill();
    }
    ctx.strokeStyle = stroke;
    ctx.stroke();
}

// --- Artwork Popup Logic ---
const artworkData = {
    statue: {
        title: "금동반가사유상",
        facts: ["미상", "삼국시대 6세기 후반", "국보 제78호", "금동", "국립중앙박물관"],
        summary: "일월식관을 쓰고 유려한 옷자락을 두른 사유의 보살상입니다.",
        questions: [
            "이 보살상은 어떤 <span class='kw'>자세</span>를 하고 있어?",
            "보살이 머리에 쓴 <span class='kw'>관</span>에는 무엇이 장식되어 있어?"
        ]
    },
    monalisa: {
        title: "모나리자",
        facts: ["레오나르도 다 빈치", "16세기 초(1503~1519년)", "포플러 패널에 유화", "루브르 박물관"],
        summary: "신비로운 미소를 머금고 있는 르네상스 시대의 대표적인 여성 초상화입니다.",
        questions: [
            "이 인물은 어떤 <span class='kw'>표정</span>을 짓고 있어?",
            "인물 뒤로 펼쳐진 <span class='kw'>배경</span>은 어떻게 묘사되어 있어?"
        ]
    }
};

const popup = document.getElementById('artwork-popup');
if (popup) {
    const infoCard = popup.querySelector('.info-card');

    artworks.forEach(container => {
        container.addEventListener('click', () => {
            if (!container.classList.contains('active') || justDrew) return;

            const data = artworkData[container.dataset.name];
            const photo = document.getElementById('popup-image');
            photo.src = `assets/main/${container.dataset.name}.jpg`; // photo sits next to the line-art svg, same name
            photo.alt = data.title;
            document.getElementById('popup-title').innerText = data.title;
            document.getElementById('popup-facts').innerHTML = data.facts.map(fact => `<span>${fact}</span>`).join('');
            document.getElementById('popup-summary').innerText = data.summary;
            document.getElementById('popup-questions').innerHTML = data.questions.map(q => `<button class="chip" type="button">${q}</button>`).join('');

            infoCard.dataset.art = container.dataset.name; // CSS widens the fuller card

            // Desktop: beside the artwork, on the side facing the page centre, kept inside the viewport.
            // Mobile (<=768px): CSS centres the card.
            if (window.innerWidth > 768) {
                const r = container.getBoundingClientRect();
                const cw = infoCard.offsetWidth;
                const left = r.left < window.innerWidth / 2 ? r.right + 30 : r.left - cw - 30;
                infoCard.style.left = `${Math.min(Math.max(16, left), window.innerWidth - cw - 16)}px`;
            } else {
                infoCard.style.left = '';
            }

            container.classList.add('selected'); // keeps it orange until the popup closes
            popup.classList.add('show');

            // Unfold from the card design: the card grows in, then its lines rise one by one
            infoCard.animate([{ opacity: 0, transform: 'scale(0.3)', filter: 'blur(10px)' }, { opacity: 1, offset: 0.5, filter: 'blur(0px)' }, { opacity: 1, transform: 'scale(1)' }],
                             { duration: 520, easing: 'cubic-bezier(0.22, 1.15, 0.36, 1)', fill: 'backwards' });
            [...infoCard.querySelectorAll('.card-body > *, .ask-head, .ask-hint, .chip')].forEach((el, i) =>
                el.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }],
                           { duration: 420, delay: 160 + i * 45, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'backwards' }));
        });
    });

    document.getElementById('popup-close').addEventListener('click', () => {
        popup.classList.remove('show');
        // Closing also clears the artwork's outline and glass button
        artworks.forEach(c => c.classList.remove('active', 'selected'));
        shapes = shapes.filter(s => !s.container);
    });
}
