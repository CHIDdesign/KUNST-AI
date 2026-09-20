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

    const spans = [];

    // Top up until the text overflows the box, on load and on every resize,
    // so the whole logo stays filled whatever size the window was when the page loaded
    function fillLogo() {
        while (textContainer.scrollHeight <= textContainer.clientHeight * 1.1 && spans.length < 8000) {
            const fragment = document.createDocumentFragment();
            for (let i = 0; i < 200; i++) {
                const span = document.createElement('span');
                span.innerText = words[Math.floor(Math.random() * words.length)];
                applyRandomStyle(span);
                fragment.appendChild(span);
                spans.push(span);
            }
            textContainer.appendChild(fragment);
        }
    }
    fillLogo();
    window.addEventListener('resize', fillLogo);

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
