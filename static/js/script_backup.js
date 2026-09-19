// Custom Cursor
const cursor = document.querySelector('.cursor');
const follower = document.querySelector('.cursor-follower');

document.addEventListener('mousemove', (e) => {
    // Hardware accelerated instant follow for main cursor
    cursor.style.transform = `translate3d(calc(${e.clientX}px - 50%), calc(${e.clientY}px - 50%), 0)`;
    
    // Brutalist snappy follow for outline
    setTimeout(() => {
        follower.style.transform = `translate3d(calc(${e.clientX}px - 50%), calc(${e.clientY}px - 50%), 0)`;
    }, 40);
});

// Interactive elements hover effect for cursor
const interactives = document.querySelectorAll('a, button');
interactives.forEach(el => {
    el.addEventListener('mouseenter', () => {
        follower.style.width = '80px';
        follower.style.height = '80px';
        follower.style.backgroundColor = 'var(--point-color)';
        follower.style.borderColor = 'var(--point-color)';
        follower.style.mixBlendMode = 'difference';
    });
    el.addEventListener('mouseleave', () => {
        follower.style.width = '40px';
        follower.style.height = '40px';
        follower.style.backgroundColor = 'transparent';
        follower.style.borderColor = 'var(--text-muted)';
        follower.style.mixBlendMode = 'normal';
    });
});

// Text Logo Generation for Index
const textContainer = document.getElementById('text-logo-mask');

if (textContainer) {
    // SVG Mask for KUNST Glasses logo + "KUNST" text, accurately traced
    const svgMask = `data:image/svg+xml;utf8,%3Csvg width='240' height='150' viewBox='0 0 240 150' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M 0 0 H 240 V 80 H 140 V 15 H 100 V 80 H 0 Z M 15 15 H 85 V 65 H 15 Z M 155 15 H 225 V 65 H 155 Z' fill='black' fill-rule='evenodd'/%3E%3Cpath d='M 30 100 V 140 M 54 100 L 30 122 M 40 111 L 54 140 M 69 100 V 128 A 12 12 0 0 0 93 128 V 100 M 108 140 V 100 L 132 140 V 100 M 171 105 C 171 97, 147 97, 147 109 C 147 121, 171 115, 171 127 C 171 139, 147 139, 147 131 M 186 100 H 210 M 198 100 V 140' stroke='black' stroke-width='2.5' fill='none' stroke-linecap='square' /%3E%3C/svg%3E`;

    textContainer.style.webkitMaskImage = `url("${svgMask}")`;
    textContainer.style.maskImage = `url("${svgMask}")`;

    const words = [
        "MONALISA", "PICASSO", "CUBISM", "RENAISSANCE", "DADA", "POP ART", "WARHOL", 
        "BAROQUE", "IMPRESSIONISM", "MONET", "MATISSE", "BAUHAUS", "MINIMALISM", 
        "MONDRIAN", "SEURAT", "GOGH", "RODIN", "DALI", "VELAZQUEZ", "KUNST", 
        "ART CRITIC", "CURATOR", "SURREALISM", "KLIMT", "REMBRANDT", "EXPRESSIONISM", 
        "VERMEER", "CEZANNE", "MICHELANGELO", "GOYA", "REALISM", "COURBET", "GUERNICA",
        "DA VINCI", "BOTTICELLI", "DE STIJL", "POLLOCK", "ROTHKO", "KAHLO", "MUNCH"
    ];

    let spans = [];
    // Dynamically calculate span count based on screen area to prevent cutoff on large screens
    const containerArea = window.innerWidth * window.innerHeight;
    // An average span takes roughly 1500px^2 of space. Add a 1.5x multiplier for dense packing.
    const numSpans = Math.min(3000, Math.ceil(containerArea / 1000)); 

    // Create a document fragment to batch DOM insertions
    const fragment = document.createDocumentFragment();

    for(let i=0; i<numSpans; i++) {
        let span = document.createElement('span');
        span.innerText = words[Math.floor(Math.random() * words.length)];
        applyRandomStyle(span);
        fragment.appendChild(span);
        spans.push(span);
    }
    textContainer.appendChild(fragment);

    function applyRandomStyle(span) {
        const weights = [100, 400, 700, 900];
        const colors = ['var(--text-main)', 'var(--text-muted)', 'var(--point-color)', '#333333'];
        // Slightly larger to compensate for fewer spans while maintaining density
        const sizes = ['0.5rem', '0.6rem', '0.8rem', '1rem', '1.2rem']; 
        
        span.style.fontWeight = weights[Math.floor(Math.random() * weights.length)];
        span.style.color = colors[Math.floor(Math.random() * colors.length)];
        span.style.fontSize = sizes[Math.floor(Math.random() * sizes.length)];
    }

    // OPTIMIZATION: requestAnimationFrame instead of setInterval
    let lastTime = 0;
    const updateInterval = 80; // Choppy brutalist framerate (~12fps) for effect & performance

    function scrambleLoop(time) {
        if (time - lastTime > updateInterval) {
            lastTime = time;
            // Update a controlled number of elements per frame
            for(let i=0; i<15; i++) {
                let span = spans[Math.floor(Math.random() * spans.length)];
                span.innerText = words[Math.floor(Math.random() * words.length)];
                applyRandomStyle(span);
            }
        }
        requestAnimationFrame(scrambleLoop);
    }
    requestAnimationFrame(scrambleLoop);
} // End of if (textContainer)

// --- AR Crosshair & Drawing Interaction ---
// Create elements
    const crossX = document.createElement('div');
    crossX.className = 'crosshair-x';
    const crossY = document.createElement('div');
    crossY.className = 'crosshair-y';
    const coordBox = document.createElement('div');
    coordBox.className = 'coord-tracker';
    
    document.body.appendChild(crossX);
    document.body.appendChild(crossY);
    document.body.appendChild(coordBox);

    // Canvas for drawing
    const canvas = document.createElement('canvas');
    canvas.id = 'ar-canvas';
    document.body.appendChild(canvas);
    let currentActiveArtwork = null;

    document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('ar-canvas');
    if (!canvas) return; // Only run on index page
    const ctx = canvas.getContext('2d');
    const crossX = document.querySelector('.crosshair-x');
    const crossY = document.querySelector('.crosshair-y');
    const coordBox = document.querySelector('.coord-tracker');

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    let isDrawing = false;
    let currentPath = [];
    let shapes = [];

    document.addEventListener('mousedown', (e) => {
        // Prevent drawing when clicking on interactive elements
        if(e.target.closest('a') || e.target.closest('button')) return;
        isDrawing = true;
        currentPath = [{x: e.clientX, y: e.clientY}];
    });

    document.addEventListener('touchstart', (e) => {
        if(e.target.closest('a') || e.target.closest('button')) return;
        isDrawing = true;
        const touch = e.touches[0];
        currentPath = [{x: touch.clientX, y: touch.clientY}];
    });

    document.addEventListener('mousemove', (e) => {
        // Crosshair update (Hardware accelerated)
        crossX.style.transform = `translate3d(0, ${e.clientY}px, 0)`;
        crossY.style.transform = `translate3d(${e.clientX}px, 0, 0)`;
        
        // Coords update
        coordBox.style.transform = `translate3d(${e.clientX + 20}px, ${e.clientY + 20}px, 0)`;
        coordBox.innerText = `[ SCANNING... X:${e.clientX} Y:${e.clientY} ]`;

        if (!isDrawing) return;
        
        const lastPoint = currentPath[currentPath.length - 1];
        const dist = Math.hypot(e.clientX - lastPoint.x, e.clientY - lastPoint.y);
        if (dist > 35) {
            currentPath.push({x: e.clientX, y: e.clientY});
        }
    });

    document.addEventListener('touchmove', (e) => {
        if (!isDrawing) return;
        // Prevent rubber-banding / scrolling on mobile while drawing
        if (e.cancelable) e.preventDefault(); 
        
        const touch = e.touches[0];
        const lastPoint = currentPath[currentPath.length - 1];
        const dist = Math.hypot(touch.clientX - lastPoint.x, touch.clientY - lastPoint.y);
        if (dist > 35) {
            currentPath.push({x: touch.clientX, y: touch.clientY});
        }
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
        // Touchend doesn't have clientX in touches, use changedTouches if needed, but last recorded point is fine enough for touch.
        if (e.changedTouches.length > 0) {
            const touch = e.changedTouches[0];
            currentPath.push({x: touch.clientX, y: touch.clientY});
        }
        saveShape();
    });

    function saveShape() {
        if (currentPath.length > 2) {
            const pathCopy = [...currentPath];
            // Check if this path overlaps any artwork
            if (!checkArtworkOverlap(pathCopy)) {
                shapes.push({
                    path: pathCopy,
                    createdAt: Date.now(),
                    lifeTime: 2000,
                    fadeTime: 1000
                });
            }
        }
        currentPath = [];
    }

    function checkArtworkOverlap(path) {
        if(path.length < 3) return false;
        const pathMinX = Math.min(...path.map(p => p.x));
        const pathMaxX = Math.max(...path.map(p => p.x));
        const pathMinY = Math.min(...path.map(p => p.y));
        const pathMaxY = Math.max(...path.map(p => p.y));
        
        let activated = false;
        
        document.querySelectorAll('.artwork-container').forEach(container => {
            const rect = container.getBoundingClientRect();
            const artArea = rect.width * rect.height;
            
            // Simple overlap rect
            const overlapMinX = Math.max(pathMinX, rect.left);
            const overlapMaxX = Math.min(pathMaxX, rect.right);
            const overlapMinY = Math.max(pathMinY, rect.top);
            const overlapMaxY = Math.min(pathMaxY, rect.bottom);
            
            if (overlapMaxX > overlapMinX && overlapMaxY > overlapMinY) {
                const overlapArea = (overlapMaxX - overlapMinX) * (overlapMaxY - overlapMinY);
                if (overlapArea > (artArea * 0.35)) { // If covers > 35% of the bounding box
                    activateArtwork(container);
                    activated = true;
                }
            }
        });
        return activated;
    }

    function activateArtwork(container) {
        document.querySelectorAll('.artwork-container').forEach(c => c.classList.remove('active'));
        container.classList.add('active');
        // Clear all current shapes to "morph" into the SVG outline
        shapes = [];
    }

    // Render Loop for Canvas
    function renderCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const now = Date.now();
        
        // Draw saved shapes
        for (let i = shapes.length - 1; i >= 0; i--) {
            const shape = shapes[i];
            const age = now - shape.createdAt;
            
            if (age > shape.lifeTime + shape.fadeTime) {
                shapes.splice(i, 1);
                continue;
            }
            
            let alpha = 1;
            if (age > shape.lifeTime) {
                alpha = 1 - ((age - shape.lifeTime) / shape.fadeTime);
            }
            drawPath(shape.path, true, alpha, age); // Auto-closed with age
        }
        
        // Draw current path
        if (isDrawing && currentPath.length > 0) {
            drawPath(currentPath, false, 1, 0); // Open while drawing
        }
        
        requestAnimationFrame(renderCanvas);
    }
    requestAnimationFrame(renderCanvas);

    function drawPath(points, isClosed, alpha, age) {
        if (points.length < 2) return;
        
        ctx.beginPath();
        
        if (isClosed && points.length > 2) {
            // Seamless closed loop for perfect clay-like blob (no sharp corners)
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
            // Open path while actively drawing
            ctx.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length - 1; i++) {
                const xc = (points[i].x + points[i + 1].x) / 2;
                const yc = (points[i].y + points[i + 1].y) / 2;
                ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
            }
            if (points.length > 1) {
                ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
            }
        }
        
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 3;
        
        let outlineAlpha = alpha;
        let fillAlpha = 0.06 * alpha; // Base 6% translucency
        let glowBlur = 10;

        // Scanning Pulse Effect (Twice over the first 2 seconds)
        if (isClosed && age < 2000) {
            const scanPulse = Math.abs(Math.sin((age / 1000) * Math.PI));
            fillAlpha += scanPulse * 0.06 * alpha; // Peaks exactly at 0.12 (12%)
            glowBlur += scanPulse * 15; // Extra glow on pulse
        }

        ctx.strokeStyle = `rgba(244, 244, 244, ${outlineAlpha})`;
        
        // Fill closed shapes
        if (isClosed) {
            ctx.fillStyle = `rgba(244, 244, 244, ${fillAlpha})`;
            ctx.fill();
        }

        // Glowing effect
        ctx.shadowColor = `rgba(244, 244, 244, ${outlineAlpha * 0.8})`;
        ctx.shadowBlur = glowBlur;
        
        ctx.stroke();
        ctx.shadowBlur = 0; // Reset
    }

// --- Artwork Popup Logic ---
document.addEventListener('DOMContentLoaded', () => {
    const popup = document.getElementById('artwork-popup');
    if (!popup) return;
    
    const infoCard = popup.querySelector('.info-card');
    const closeBtn = document.getElementById('popup-close');
    
    document.querySelectorAll('.artwork-container').forEach(container => {
        container.addEventListener('click', (e) => {
            if(!container.classList.contains('active')) return;
            
            const isMobile = window.innerWidth <= 768;
            
            if(!isMobile) {
                const rect = container.getBoundingClientRect();
                infoCard.style.position = 'absolute';
                infoCard.style.top = `${rect.top + (rect.height / 2)}px`;
                infoCard.style.transform = 'translateY(-50%) scale(1)';
                infoCard.style.margin = '0';
                
                if(rect.left < window.innerWidth / 2) {
                    // Artwork is on the left, popup on the right (20px gap)
                    infoCard.style.left = `${rect.right + 30}px`;
                } else {
                    // Artwork is on the right, popup on the left
                    infoCard.style.left = `${rect.left - 330 - 30}px`; // 330 is card width
                }
            } else {
                infoCard.style.position = 'fixed';
                infoCard.style.top = '50%';
                infoCard.style.left = '50%';
                infoCard.style.margin = '0';
                infoCard.style.transform = 'translate(-50%, -50%) scale(1)';
            }
            
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
                    facts: ["레오나르도 다빈치", "16세기 초", "유화", "루브르 박물관"],
                    summary: "신비로운 미소와 스푸마토 기법으로 유명한 르네상스의 대표작입니다.",
                    questions: [
                        "모나리자의 <span class='kw'>미소</span>가 독특한 이유는 뭐야?",
                        "배경에 사용된 <span class='kw'>공기 원근법</span>이 뭐야?"
                    ]
                }
            };

            const data = artworkData[container.dataset.name] || artworkData.statue;

            // Populate basic data
            document.getElementById('popup-image').src = container.querySelector('img').src;
            document.getElementById('popup-title').innerText = data.title;
            
            const factsHtml = data.facts.map(fact => `<span>${fact}</span>`).join('');
            document.getElementById('popup-facts').innerHTML = factsHtml;
            
            document.getElementById('popup-summary').innerText = data.summary;
            
            const questionsHtml = data.questions.map(q => `<button class="chip">${q}</button>`).join('');
            document.getElementById('popup-questions').innerHTML = questionsHtml;
            
            container.classList.add('selected');
            popup.classList.add('show');
        });
    });

    closeBtn.addEventListener('click', () => {
        popup.classList.remove('show');
        if (infoCard.style.transform.includes('translateY')) {
            infoCard.style.transform = 'translateY(-50%) scale(0.9)';
        } else if (infoCard.style.transform.includes('translate')) {
            infoCard.style.transform = 'translate(-50%, -50%) scale(0.9)';
        } else {
            infoCard.style.transform = 'scale(0.9)';
        }
        
        if (currentActiveArtwork) {
            currentActiveArtwork.classList.remove('active', 'selected');
            currentActiveArtwork = null;
        }
    });
});
