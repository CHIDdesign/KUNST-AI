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
    // OPTIMIZATION: Reduced span count to 800 for stability. Still visually dense.
    const numSpans = 800; 

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
    const ctx = canvas.getContext('2d');

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

    document.addEventListener('mousemove', (e) => {
        // Crosshair update (Hardware accelerated)
        crossX.style.transform = `translate3d(0, ${e.clientY}px, 0)`;
        crossY.style.transform = `translate3d(${e.clientX}px, 0, 0)`;
        
        // Coords update
        coordBox.style.transform = `translate3d(${e.clientX + 20}px, ${e.clientY + 20}px, 0)`;
        coordBox.innerText = `[ SCANNING... X:${e.clientX} Y:${e.clientY} ]`;

        if (!isDrawing) return;
        
        // OPTIMIZATION & DESIGN: Downsample points. 
        // Only record a point if it's far enough from the last.
        // This dramatically improves performance AND naturally creates a smooth, "clay-like" blob.
        const lastPoint = currentPath[currentPath.length - 1];
        const dist = Math.hypot(e.clientX - lastPoint.x, e.clientY - lastPoint.y);
        if (dist > 35) {
            currentPath.push({x: e.clientX, y: e.clientY});
        }
    });

    document.addEventListener('mouseup', (e) => {
        if (!isDrawing) return;
        isDrawing = false;
        
        // Push final point to ensure the shape closes exactly where mouse was released
        currentPath.push({x: e.clientX, y: e.clientY});
        
        if (currentPath.length > 2) {
            shapes.push({
                path: currentPath,
                createdAt: Date.now(),
                lifeTime: 3000, // Reduced to 3 seconds
                fadeTime: 1000  // Fades out over 1 second
            });
        }
        currentPath = [];
    });

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
            ctx.fillStyle = `rgba(255, 255, 255, ${fillAlpha})`;
            ctx.fill();
        }

        // Glowing effect
        ctx.shadowColor = `rgba(255, 255, 255, ${outlineAlpha * 0.8})`;
        ctx.shadowBlur = glowBlur;
        
        ctx.stroke();
        ctx.shadowBlur = 0; // Reset
    }
}

