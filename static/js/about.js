// Reveal on scroll: native IntersectionObserver flips .in, CSS does the motion (see `.js .reveal` in about.css)
const revealer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        revealer.unobserve(entry.target);
    });
}, { rootMargin: '0px 0px -12% 0px' });
document.querySelectorAll('.reveal, .feature-figure').forEach(el => revealer.observe(el));

// Hero spotlight follows the pointer
const hero = document.querySelector('.hero-section');
hero.addEventListener('pointermove', (e) => {
    const r = hero.getBoundingClientRect();
    hero.style.setProperty('--mx', `${e.clientX - r.left}px`);
    hero.style.setProperty('--my', `${e.clientY - r.top}px`);
});

// GSAP: only the pinned horizontal reel of Core Algorithms. Without it (CDN blocked) or on
// narrow screens the cards stay the plain CSS grid, so nothing below is needed to read the page.
document.addEventListener("DOMContentLoaded", () => {
    if (typeof gsap === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);
    document.documentElement.classList.add('has-gsap');

    const modelsWrap = document.getElementById("models-wrap");
    const modelsTrack = document.getElementById("models-track");
    const modelsIndex = document.getElementById("models-index");
    const specCards = gsap.utils.toArray('.spec-card');

    gsap.matchMedia().add("(min-width: 1025px)", () => {
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: modelsWrap,
                start: "center center",
                end: () => `+=${specCards.length * window.innerWidth * 0.4}`,
                pin: true,
                scrub: 1,
                snap: {
                    snapTo: 1 / (specCards.length - 1),
                    duration: { min: 0.2, max: 0.8 },
                    delay: 0.1,
                    ease: "power2.inOut"
                },
                invalidateOnRefresh: true,
            }
        });

        tl.to(modelsTrack, {
            x: () => -(specCards[specCards.length - 1].offsetLeft - specCards[0].offsetLeft),
            ease: "none"
        }, 0);

        const spotlight = () => {
            const cardIndex = Math.round(tl.progress() * (specCards.length - 1));
            specCards.forEach((c, i) => c.classList.toggle('active', i === cardIndex));
            modelsIndex.textContent = String(cardIndex + 1).padStart(2, '0');
        };
        tl.eventCallback("onUpdate", spotlight);
        spotlight();

        return () => {
            gsap.set(modelsTrack, { clearProps: "all" });
            specCards.forEach(c => c.classList.remove('active'));
        };
    });
});
