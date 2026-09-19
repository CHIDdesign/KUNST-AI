// GSAP Animations for KUNST About Page
document.addEventListener("DOMContentLoaded", () => {
    if (typeof gsap === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);

    // 1. FADE IN (Hero & Overview)
    const fadeSections = gsap.utils.toArray('.hero-section, .overview-section, .pillar-card, .feature-row');
    fadeSections.forEach((sec) => {
        gsap.from(sec, {
            y: 50,
            opacity: 0,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: {
                trigger: sec,
                start: "top 85%",
            }
        });
    });

    // 2. HORIZONTAL PAN & HIGHLIGHT (Core Algorithms)
    const modelsWrap = document.getElementById("models-wrap");
    const modelsTrack = document.getElementById("models-track");
    const specCards = gsap.utils.toArray('.spec-card');

    if (modelsWrap && modelsTrack && specCards.length > 0) {
        let mm = gsap.matchMedia();

        mm.add("(min-width: 1025px)", () => {
            const totalScroll = specCards.length * window.innerWidth * 0.4;
            
            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: modelsWrap,
                    start: "center center",
                    end: () => `+=${totalScroll}`,
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
                x: () => {
                    const firstCard = specCards[0];
                    const lastCard = specCards[specCards.length - 1];
                    return -(lastCard.offsetLeft - firstCard.offsetLeft);
                },
                ease: "none"
            }, 0);

            tl.eventCallback("onUpdate", function() {
                const progress = this.progress();
                let cardIndex = Math.round(progress * (specCards.length - 1));
                cardIndex = Math.max(0, Math.min(specCards.length - 1, cardIndex));
                
                specCards.forEach((c, i) => {
                    if (i === cardIndex) {
                        c.classList.add('active');
                    } else {
                        c.classList.remove('active');
                    }
                });
            });

            return () => {
                specCards.forEach(c => c.classList.remove('active'));
            };
        });

        mm.add("(max-width: 1024px)", () => {
            gsap.set(modelsTrack, { clearProps: "all" });
            specCards.forEach((c) => {
                gsap.set(c, { clearProps: "all" });
                c.classList.add('active');
            });
            
            return () => {
                specCards.forEach(c => c.classList.remove('active'));
            };
        });
    }

});
