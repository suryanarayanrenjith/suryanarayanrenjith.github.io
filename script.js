import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.168.0/three.module.js';

document.addEventListener("DOMContentLoaded", () => {
    const text = document.querySelector('.animated-text');
    if (text) text.classList.add('animate');

    const footerText = document.getElementById('footer-text');
    const currentYear = new Date().getFullYear();

    footerText.textContent = `© ${currentYear} Suryanarayan Renjith. All rights reserved.`;

    function changeTextWithGSAP(newText) {
        gsap.to(footerText, {
            duration: 0.3,
            opacity: 0,
            y: -4,
            ease: "power2.out",
            onComplete: function() {
                footerText.textContent = newText;
                gsap.fromTo(footerText,
                    { opacity: 0, y: 4 },
                    { duration: 0.3, opacity: 1, y: 0, ease: "power2.out" }
                );
            }
        });
    }

    footerText.addEventListener('mouseover', function() {
        changeTextWithGSAP('Music Credits: Suryanarayan Renjith.');
    });

    footerText.addEventListener('mouseout', function() {
        changeTextWithGSAP(`© ${currentYear} Suryanarayan Renjith. All rights reserved.`);
    });

    function initMagneticButtons() {
        const magneticEls = document.querySelectorAll('.center-button, .help-button');
        magneticEls.forEach(btn => {
            if (btn.dataset.magnetic) return;
            btn.dataset.magnetic = 'true';
            btn.addEventListener('mousemove', (e) => {
                const rect = btn.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                gsap.to(btn, {
                    x: x * 0.3,
                    y: y * 0.3,
                    duration: 0.4,
                    ease: "power2.out"
                });
            });
            btn.addEventListener('mouseleave', () => {
                gsap.to(btn, {
                    x: 0,
                    y: 0,
                    duration: 0.6,
                    ease: "elastic.out(1, 0.4)"
                });
            });
        });
    }

    function isHyperModeEnabled() {
        return document.body.classList.contains('experimental-hyper-mode');
    }

    function isMotionFxEnabled() {
        return document.body.classList.contains('experimental-motion-fx');
    }

    function initSectionTitleHoverFx(content) {
        if (!content || typeof Letterize === 'undefined' || typeof anime === 'undefined') return;

        const titleTargets = Array.from(content.querySelectorAll('.animated-text'));
        if (!titleTargets.length) {
            const fallbackTitle = content.querySelector('h1');
            if (fallbackTitle) titleTargets.push(fallbackTitle);
        }

        titleTargets.forEach(title => {
            if (title.dataset.letterHoverBound === 'true') return;

            if (!title.dataset.letterSourceText) {
                title.dataset.letterSourceText = title.textContent || '';
            }
            const sourceText = title.dataset.letterSourceText || '';

            let chars = Array.from(title.querySelectorAll('.char'));
            if (!chars.length) {
                try {
                    const letterized = new Letterize({ targets: title });
                    chars = Array.from(letterized.listAll || []);
                    title.dataset.letterized = 'true';
                } catch (error) {
                    return;
                }
            }

            if (!chars.length) return;

            const isSpaceChar = (char) => {
                const raw = char.textContent || '';
                return raw === ' ' || raw === '\u00A0' || raw.trim() === '';
            };

            const gapAfterIndexes = new Set();
            let nonSpaceCursor = -1;
            for (const ch of sourceText) {
                if (/\s/.test(ch)) {
                    if (nonSpaceCursor >= 0) gapAfterIndexes.add(nonSpaceCursor);
                } else {
                    nonSpaceCursor += 1;
                }
            }

            const hasExplicitSpaceChars = chars.some(isSpaceChar);

            const animatedChars = [];

            chars.forEach(char => {
                char.style.display = 'inline-block';
                char.style.willChange = 'transform, filter, text-shadow, opacity';
                char.style.marginRight = '0';

                if (isSpaceChar(char)) {
                    // Keep a stable visual gap between words after Letterize splitting.
                    char.textContent = '\u00A0';
                    char.style.width = '0.42em';
                    char.style.willChange = 'auto';
                } else {
                    char.style.width = 'auto';
                    if (!hasExplicitSpaceChars && gapAfterIndexes.has(animatedChars.length)) {
                        // Some Letterize outputs drop space chars entirely; restore word gaps here.
                        char.style.marginRight = '0.38em';
                    }
                    animatedChars.push(char);
                }
            });

            if (!animatedChars.length) return;

            const playHoverFx = () => {
                const hyper = isHyperModeEnabled();
                const offsetY = hyper ? 18 : 10;
                const driftX = hyper ? 10 : 4;
                const glowShadow = hyper
                    ? '0 0 28px rgba(255,255,255,0.5)'
                    : '0 0 14px rgba(255,255,255,0.28)';
                const blurPeak = hyper ? 'blur(1.05px)' : 'blur(0.45px)';
                const rippleY = hyper ? 13 : 3;
                const rippleX = hyper ? 7 : 1.5;
                const rippleRot = hyper ? 6 : 1.2;
                const rippleDuration = hyper ? 185 : 230;
                const rippleStagger = hyper ? 6 : 10;

                anime.remove(animatedChars);
                anime.timeline({ loop: false })
                    .add({
                        targets: animatedChars,
                        translateY: (el, i) => (i % 2 === 0 ? -offsetY : offsetY * 0.6),
                        translateX: () => anime.random(-driftX, driftX),
                        rotateZ: () => anime.random(-9, 9),
                        textShadow: [
                            '0 0 0 rgba(255,255,255,0)',
                            glowShadow
                        ],
                        filter: ['blur(0px)', blurPeak],
                        duration: hyper ? 220 : 260,
                        easing: 'easeOutExpo',
                        delay: anime.stagger(14, { from: 'center' })
                    })
                    .add({
                        targets: animatedChars,
                        translateY: (el, i) => Math.sin((i + 1) * 0.65) * rippleY,
                        translateX: (el, i) => Math.cos((i + 1) * 0.5) * rippleX,
                        rotateZ: (el, i) => Math.sin((i + 1) * 0.7) * rippleRot,
                        duration: rippleDuration,
                        easing: 'easeInOutSine',
                        delay: anime.stagger(rippleStagger)
                    }, '-=110')
                    .add({
                        targets: animatedChars,
                        translateX: 0,
                        translateY: 0,
                        rotateZ: 0,
                        filter: 'blur(0px)',
                        textShadow: '0 0 0 rgba(255,255,255,0)',
                        duration: hyper ? 560 : 620,
                        easing: 'easeOutElastic(1, 0.65)',
                        delay: anime.stagger(10, { from: 'center' })
                    }, '-=70');
            };

            const resetHoverFx = () => {
                anime.remove(animatedChars);
                anime({
                    targets: animatedChars,
                    translateX: 0,
                    translateY: 0,
                    rotateZ: 0,
                    filter: 'blur(0px)',
                    textShadow: '0 0 0 rgba(255,255,255,0)',
                    duration: 240,
                    easing: 'easeOutQuad'
                });
            };

            title.addEventListener('mouseenter', playHoverFx);
            title.addEventListener('focusin', playHoverFx);
            title.addEventListener('mouseleave', resetHoverFx);
            title.addEventListener('focusout', resetHoverFx);

            title.dataset.letterHoverBound = 'true';
        });
    }

    window.animateContentIn = function() {
        const content = document.getElementById('content');
        if (!content) return;
        const hyper = isHyperModeEnabled();

        const canAnimateText = (el) => !hyper || !el.closest('.link-card');

        const headings = Array.from(content.querySelectorAll('h1, h2, h3, .animated-text')).filter(canAnimateText);
        const paragraphs = Array.from(content.querySelectorAll('p, .tagline')).filter(canAnimateText);
        const buttons = Array.from(content.querySelectorAll('.center-button, button, a[class]:not(.link-card)')).filter(canAnimateText);
        const listItems = Array.from(content.querySelectorAll('li:not(.link-card)')).filter(canAnimateText);
        const linkCards = Array.from(content.querySelectorAll('.link-card'));
        const visuals = Array.from(content.querySelectorAll('img, svg'));
        const dividers = Array.from(content.querySelectorAll('hr, .divider'));

        const allEls = [headings, paragraphs, buttons, listItems, linkCards, visuals, dividers];
        const animatedTargets = allEls.flat();

        const resetAnimatedTextState = () => {
            if (!animatedTargets.length) return;
            gsap.set(animatedTargets, { opacity: 1 });
            gsap.set(animatedTargets, { clearProps: 'transform,filter,clipPath' });
        };

        if (animatedTargets.length) {
            gsap.killTweensOf(animatedTargets);
            gsap.set(animatedTargets, { clearProps: 'transform,filter,clipPath,opacity' });
        }

        allEls.forEach(group => {
            if (group.length) gsap.set(group, { opacity: 0 });
        });

        const tl = gsap.timeline({
            delay: hyper ? 0 : 0.05,
            defaults: { overwrite: 'auto' },
            onComplete: resetAnimatedTextState,
            onInterrupt: resetAnimatedTextState
        });

        if (headings.length) {
            tl.fromTo(headings,
                {
                    opacity: 0,
                    y: hyper ? 0 : 40,
                    x: 0,
                    scale: hyper ? 1 : 1,
                    clipPath: hyper ? 'inset(0 0 0% 0)' : 'inset(0 0 100% 0)',
                    filter: hyper ? 'blur(15px)' : 'blur(0px)'
                },
                {
                    opacity: 1,
                    y: 0,
                    x: 0,
                    scale: 1,
                    clipPath: 'inset(0 0 0% 0)',
                    filter: 'blur(0px)',
                    duration: hyper ? 0.2 : 0.8,
                    ease: hyper ? 'steps(4)' : 'power3.out',
                    stagger: hyper ? 0.03 : 0.12
                },
                0
            );
        }
        if (paragraphs.length) {
            tl.fromTo(paragraphs,
                { opacity: 0, y: hyper ? 0 : 25, filter: hyper ? 'blur(10px)' : 'blur(0px)' },
                {
                    opacity: 1,
                    y: 0,
                    filter: 'blur(0px)',
                    duration: hyper ? 0.18 : 0.6,
                    ease: hyper ? 'steps(2)' : 'power2.out',
                    stagger: hyper ? 0.025 : 0.08
                },
                0.09
            );
        }
        if (buttons.length) {
            tl.fromTo(buttons,
                { opacity: 0, y: hyper ? 46 : 20, scale: hyper ? 0.78 : 0.92 },
                {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    duration: hyper ? 0.18 : 0.6,
                    ease: hyper ? 'steps(2)' : 'back.out(1.4)',
                    stagger: hyper ? 0.03 : 0.1
                },
                0.14
            );
        }
        if (listItems.length) {
            tl.fromTo(listItems,
                { opacity: 0, x: -20 },
                { opacity: 1, x: 0, duration: 0.5, ease: 'power2.out', stagger: 0.06 },
                0.15
            );
        }
        if (visuals.length) {
            tl.fromTo(visuals,
                { opacity: 0, scale: 0.8 },
                { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.7)', stagger: 0.05 },
                0.25
            );
        }
        if (dividers.length) {
            tl.fromTo(dividers,
                { scaleX: 0, transformOrigin: 'left center' },
                { scaleX: 1, duration: 0.8, ease: 'power3.inOut', stagger: 0.1 },
                0.3
            );
        }

        if (linkCards.length && typeof anime === 'undefined') {
            tl.fromTo(linkCards,
                { opacity: 0, y: 20, scale: 0.95 },
                { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'back.out(1.4)', stagger: 0.08 },
                0.2
            );
        }

        initMagneticButtons();

        if (!hyper && typeof Letterize !== 'undefined' && typeof anime !== 'undefined') {
            headings.forEach(heading => {
                if (heading.dataset.letterized) return;
                if (!heading.dataset.letterSourceText) {
                    heading.dataset.letterSourceText = heading.textContent || '';
                }
                heading.dataset.letterized = 'true';
                try {
                    const letterized = new Letterize({ targets: heading });
                    anime.timeline({ loop: false }).add({
                        targets: letterized.listAll,
                        opacity: [0, 1],
                        translateY: [8, 0],
                        easing: 'easeOutExpo',
                        duration: 600,
                        delay: anime.stagger(20, { from: 'center' })
                    });
                } catch (e) {
                    // Skip letterized animation for complex heading markup.
                }
            });
        }

        if (typeof anime !== 'undefined') {
            if (linkCards.length) {
                anime({
                    targets: linkCards,
                    translateY: [20, 0],
                    opacity: [0, 1],
                    scale: [0.95, 1],
                    easing: 'easeOutExpo',
                    duration: 700,
                    delay: anime.stagger(80, { start: 200 })
                });
            }


        initSectionTitleHoverFx(content);
            linkCards.forEach(card => {
                if (card.dataset.animeHover) return;
                card.dataset.animeHover = 'true';

                card.addEventListener('mouseenter', () => {
                    const hyper = isHyperModeEnabled();
                    anime.remove(card);
                    anime({
                        targets: card,
                        scale: hyper ? 1.05 : 1.03,
                        translateY: hyper ? -6 : -3,
                        boxShadow: hyper
                            ? '0 14px 36px rgba(255,255,255,0.14)'
                            : '0 8px 30px rgba(255,255,255,0.08)',
                        easing: 'easeOutExpo',
                        duration: hyper ? 320 : 260
                    });
                });

                card.addEventListener('mouseleave', () => {
                    anime.remove(card);
                    anime({
                        targets: card,
                        scale: 1,
                        translateY: 0,
                        boxShadow: '0 2px 8px rgba(255,255,255,0)',
                        easing: 'easeOutExpo',
                        duration: 320
                    });
                });
            });
        }
    };

    window.gsapTransitionOut = function(content, direction) {
        return new Promise(resolve => {
            const hyper = isHyperModeEnabled();
            const isVertical = direction === 'up' || direction === 'down';
            const dirMult = (direction === 'down' || direction === 'right') ? -1 : 1;
            let finished = false;
            const finish = () => {
                if (finished) return;
                finished = true;
                resolve();
            };

            gsap.to(content, {
                opacity: 0,
                scale: hyper ? 0.62 : 0.92,
                y: isVertical ? dirMult * (hyper ? 240 : 60) : 0,
                x: !isVertical ? dirMult * (hyper ? 300 : 80) : 0,
                rotationY: !isVertical ? dirMult * (hyper ? -20 : -4) : 0,
                rotationX: isVertical ? dirMult * (hyper ? 14 : 3) : 0,
                filter: hyper ? 'blur(30px)' : 'blur(8px)',
                duration: hyper ? 0.26 : 0.45,
                ease: hyper ? 'steps(4)' : 'power3.in',
                force3D: true,
                overwrite: 'auto',
                onComplete: finish,
                onInterrupt: finish
            });
        });
    };

    window.gsapTransitionIn = function(content, direction) {
        const hyper = isHyperModeEnabled();
        const isVertical = direction === 'up' || direction === 'down';
        const dirMult = (direction === 'down' || direction === 'right') ? 1 : -1;

        gsap.set(content, {
            opacity: 0,
            scale: hyper ? 0.6 : 0.88,
            y: isVertical ? dirMult * (hyper ? 228 : 80) : 0,
            x: !isVertical ? dirMult * (hyper ? 260 : 100) : 0,
            rotationY: !isVertical ? dirMult * (hyper ? 20 : 5) : 0,
            rotationX: isVertical ? dirMult * (hyper ? -14 : -4) : 0,
            filter: hyper ? 'blur(28px)' : 'blur(10px)',
            force3D: true
        });

        window.animateContentIn();

        gsap.to(content, {
            opacity: 1,
            scale: 1,
            y: 0,
            x: 0,
            rotationY: 0,
            rotationX: 0,
            filter: 'blur(0px)',
            duration: hyper ? 0.28 : 0.7,
            ease: hyper ? 'steps(4)' : 'power3.out',
            force3D: true,
            overwrite: 'auto',
            onComplete: () => {
                gsap.set(content, { clearProps: 'all' });
            },
            onInterrupt: () => {
                gsap.set(content, { clearProps: 'all' });
            }
        });
    };

    window.gsapFadeSwap = function(content, directionHint) {
        return new Promise(resolve => {
            const hyper = isHyperModeEnabled();
            let finished = false;
            const finish = () => {
                if (finished) return;
                finished = true;
                resolve();
            };
            gsap.to(content, {
                opacity: 0,
                scale: hyper ? 0.76 : 0.96,
                y: hyper ? -70 : -15,
                filter: hyper ? 'blur(16px)' : 'blur(4px)',
                duration: hyper ? 0.16 : 0.25,
                ease: hyper ? 'steps(2)' : 'power2.in',
                force3D: true,
                overwrite: 'auto',
                onComplete: finish,
                onInterrupt: finish
            });
        });
    };

    window.gsapFadeIn = function(content) {
        const hyper = isHyperModeEnabled();

        gsap.fromTo(content,
            {
                opacity: 0,
                scale: hyper ? 0.72 : 0.96,
                y: hyper ? 95 : 15,
                filter: hyper ? 'blur(18px)' : 'blur(4px)'
            },
            {
                opacity: 1,
                scale: 1,
                y: 0,
                filter: 'blur(0px)',
                duration: hyper ? 0.24 : 0.45,
                ease: hyper ? 'steps(4)' : 'power2.out',
                force3D: true,
                overwrite: 'auto',
                onStart: () => {
                    window.animateContentIn();
                },
                onComplete: () => {
                    gsap.set(content, { clearProps: 'all' });
                },
                onInterrupt: () => {
                    gsap.set(content, { clearProps: 'all' });
                }
            }
        );
    };

    initMagneticButtons();

    const navLinks = document.querySelectorAll('.menu-bar > ul > li > a');
    navLinks.forEach(link => {
        link.addEventListener('mouseenter', () => {
            if (typeof anime !== 'undefined') {
                anime.remove(link);
                anime({
                    targets: link,
                    translateY: -3,
                    letterSpacing: '2px',
                    easing: 'easeOutExpo',
                    duration: 300
                });
            } else {
                gsap.to(link, { y: -2, duration: 0.3, ease: "power2.out" });
            }
        });
        link.addEventListener('mouseleave', () => {
            if (typeof anime !== 'undefined') {
                anime.remove(link);
                anime({
                    targets: link,
                    translateY: 0,
                    letterSpacing: '0px',
                    easing: 'easeOutExpo',
                    duration: 300
                });
            } else {
                gsap.to(link, { y: 0, duration: 0.3, ease: "power2.out" });
            }
        });
    });

    if (footerText) {
        gsap.fromTo(footerText,
            { y: 20, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.6, ease: "power2.out", delay: 1 }
        );
    }

    window.gsapHeaderEntrance = function() {
        const header = document.querySelector('header');
        const menuBar = document.querySelector('.menu-bar');
        const menuItems = document.querySelectorAll('.menu-bar > ul > li');

        if (!header) return;

        if (menuBar) {
            menuBar.classList.remove('animate-menu-bar');
            menuItems.forEach(item => item.classList.remove('animate-menu-item'));
        }

        const tl = gsap.timeline();
        tl.fromTo(header,
            { y: -40, opacity: 0, scale: 0.95 },
            { y: 0, opacity: 1, scale: 1, duration: 0.9, ease: "power3.out" }
        );

        if (menuBar) {
            tl.fromTo(menuBar,
                { opacity: 0, y: -10 },
                { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" },
                0.15
            );
        }

        if (menuItems.length) {
            tl.fromTo(menuItems,
                { opacity: 0, y: 12, scale: 0.9 },
                { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: "back.out(1.5)", stagger: 0.1 },
                0.25
            );
        }
    };

    const helpBtn = document.querySelector('.help-button');
    if (helpBtn) {
        if (typeof anime !== 'undefined') {
            anime({
                targets: helpBtn,
                scale: [0, 1],
                opacity: [0, 1],
                easing: 'easeOutElastic(1, 0.5)',
                duration: 800,
                delay: 1200
            });
        } else {
            gsap.fromTo(helpBtn,
                { scale: 0, opacity: 0 },
                { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(2)", delay: 1.2 }
            );
        }
    }

    const progressBarDiv = document.querySelector('.progress-bar div');
    if (progressBarDiv) {
        window.addEventListener('sectionChanged', () => {
            gsap.fromTo(progressBarDiv,
                { boxShadow: '0 0 12px rgba(255,255,255,0.5)' },
                { boxShadow: '0 0 0px rgba(255,255,255,0)', duration: 1, ease: "power2.out" }
            );
        });
    }

    if (typeof anime !== 'undefined') {
        window.addEventListener('sectionChanged', () => {
            const indicator = document.getElementById('sectionIndicator');
            if (indicator) {
                anime({
                    targets: indicator,
                    scale: [1, 1.15, 1],
                    easing: 'easeOutElastic(1, 0.5)',
                    duration: 600
                });
            }

            const divider = document.querySelector('.section-indicator-divider');
            if (divider) {
                anime({
                    targets: divider,
                    scaleX: [1, 1.5, 1],
                    easing: 'easeOutExpo',
                    duration: 500
                });
            }
        });
    }

    function isWebGLAvailable() {
        try {
            const canvas = document.createElement('canvas');
            return !!(window.WebGLRenderingContext && (
                canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
            ));
        } catch (e) {
            return false;
        }
    }

    if (isWebGLAvailable()) {
    const canvas = document.getElementById('animationCanvas');
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    let starfieldFrozen = !!(window.__starfieldFreezeState && window.__starfieldFreezeState.frozen === true);
    let hyperGlowLevel = isHyperModeEnabled() ? 1 : 0;

    const pointLight = new THREE.PointLight(0xffffff, 1, 1000);
    pointLight.position.set(0, 0, 500);
    scene.add(pointLight);

    const starDensity = 0.0032;
    const starBounds = { x: 1500, y: 1200, z: 1500 };
    let starCount = Math.floor(window.innerWidth * window.innerHeight * starDensity);


    const stars = new THREE.BufferGeometry();
    let starVertices = new Float32Array(starCount * 3);
    let starSpeeds = new Float32Array(starCount);
    let starTwinkles = new Float32Array(starCount);

    function generateStars() {
        for (let i = 0; i < starCount * 3; i += 3) {
            starVertices[i] = (Math.random() - 0.5) * starBounds.x * 2;
            starVertices[i + 1] = (Math.random() - 0.5) * starBounds.y * 2;
            starVertices[i + 2] = (Math.random() - 0.5) * starBounds.z * 2;
            starSpeeds[i / 3] = Math.random() * 0.1 + 0.02;
            starTwinkles[i / 3] = Math.random() * 0.5 + 0.5;
        }
        stars.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    }

    generateStars();

    const starMaterialWhite = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 2,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    });

    const starFieldWhite = new THREE.Points(stars, starMaterialWhite);
    scene.add(starFieldWhite);

    camera.position.z = 1000;

    window.addEventListener('starfieldFreeze', (event) => {
        starfieldFrozen = !!(event.detail && event.detail.frozen);
        if (starfieldFrozen) {
            gsap.killTweensOf(camera);
            gsap.killTweensOf(camera.position);
            gsap.killTweensOf(camera.rotation);
            gsap.killTweensOf(pointLight.position);
            gsap.killTweensOf(starFieldWhite.rotation);
        }
    });

    window.addEventListener('themeChanged', (e) => {
        if (e.detail && e.detail.light) {
            starMaterialWhite.color.setHex(0x222222);
            starMaterialWhite.blending = THREE.NormalBlending;
            pointLight.color.setHex(0x222222);
        } else {
            starMaterialWhite.color.setHex(0xffffff);
            starMaterialWhite.blending = THREE.AdditiveBlending;
            pointLight.color.setHex(0xffffff);
        }
        starMaterialWhite.needsUpdate = true;
    });

    window.addEventListener('resize', () => {
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        starCount = Math.floor(window.innerWidth * window.innerHeight * starDensity);
        starVertices = new Float32Array(starCount * 3);
        starSpeeds = new Float32Array(starCount);
        starTwinkles = new Float32Array(starCount);
        generateStars();
    });

    let mouseX = 0, mouseY = 0;
    let targetMouseX = 0, targetMouseY = 0;
    let velocityX = 0, velocityY = 0;
    const mouseRotationEasing = 0.1;
    const acceleration = 0.002;

    let alpha = 0, beta = 0, gamma = 0;
    let targetRotationX = 0, targetRotationY = 0;
    const rotationEasing = 0.05;

    let shockwaveTime = 0;
    let blackHoleEffect = false;

    let warpBurstIntensity = 0;

    function triggerWarpBurst() {
        warpBurstIntensity = 1.0;
        const decay = () => {
            warpBurstIntensity *= 0.94;
            if (warpBurstIntensity < 0.01) {
                warpBurstIntensity = 0;
                return;
            }
            requestAnimationFrame(decay);
        };
        requestAnimationFrame(decay);
    }

    function setupMouseControl() {
        window.addEventListener('mousemove', (event) => {
            targetMouseX = (event.clientX / window.innerWidth) * 2 - 1;
            targetMouseY = -(event.clientY / window.innerHeight) * 2 + 1;
        });
    }

    function applyWarpSpeed() {
        const burstMultiplier = 1 + warpBurstIntensity * 40;
        for (let i = 0; i < starVertices.length; i += 3) {
            starVertices[i + 2] += starSpeeds[i / 3] * 20 * burstMultiplier;

            if (starVertices[i + 2] > starBounds.z) {
                starVertices[i + 2] = -starBounds.z;
            }
        }
        stars.attributes.position.needsUpdate = true;
    }

    function applyDynamicStarScaling() {
        const positions = stars.attributes.position.array;
        const lastZ = positions[positions.length - 1];
        const burstSize = warpBurstIntensity * 3;
        starMaterialWhite.size = Math.max(1, 10 / (lastZ / 100 + 1)) + burstSize;
    }

    function applyShockwaveEffect() {
        if (shockwaveTime > 0) {
            for (let i = 0; i < starVertices.length; i += 3) {
                const x = starVertices[i], y = starVertices[i + 1];
                const distSq = x * x + y * y;
                if (distSq < 250000) {
                    const dist = Math.sqrt(distSq);
                    const wave = Math.sin(shockwaveTime * 10 + dist * 0.05) * 5;
                    starVertices[i] += wave;
                    starVertices[i + 1] += wave;
                }
            }
            shockwaveTime -= 0.02;
            stars.attributes.position.needsUpdate = true;
        }
    }

    function applyBlackHoleEffect() {
        if (blackHoleEffect) {
            for (let i = 0; i < starVertices.length; i += 3) {
                const x = starVertices[i], y = starVertices[i + 1], z = starVertices[i + 2];
                const distSq = x * x + y * y + z * z;
                if (distSq < 90000) {
                    const distance = Math.sqrt(distSq);
                    const pull = (300 - distance) * 0.01;
                    starVertices[i] -= x * pull;
                    starVertices[i + 1] -= y * pull;
                }
            }
            stars.attributes.position.needsUpdate = true;
        }
    }

function applyTwinkleEffect() {
    const time = performance.now() * 0.001;

    const baseSineWave = Math.sin(time * 5 + 0.75 * 20);
    const baseCosineWave = Math.cos(time * 2.5 + 0.75 * 10);
    const flicker = Math.sin(time * 8 + 0.75 * 40) * 0.3;
    const noise = (Math.random() - 0.5) * 0.15;
    const slowBreath = Math.sin(time * 0.3 + 0.75 * 5) * 0.2 + 0.8;
    const layeredEffect = Math.sin(time * 1.2 + Math.sin(time * 0.7) * 2 + 0.75 * 25) * 0.4 + 0.6;
    const depthEffect = Math.sin(time * 0.2 + 0.75 * 50) * 0.3 + 0.7;

    const twinkleIntensity =
        (baseSineWave * 0.3 + baseCosineWave * 0.3 + flicker * 0.2 + noise * 0.1)
        * slowBreath * layeredEffect * depthEffect;

    starMaterialWhite.opacity = 3.0 + twinkleIntensity * 0.8;
    starMaterialWhite.size = 2.0 + twinkleIntensity * 4.0;
}

    function applyHyperModeStarGlow() {
        const targetGlow = isHyperModeEnabled() ? 1 : 0;
        hyperGlowLevel += (targetGlow - hyperGlowLevel) * 0.12;

        starMaterialWhite.size = Math.min(7, starMaterialWhite.size + hyperGlowLevel * 1.4);
        starMaterialWhite.opacity = Math.min(4.8, starMaterialWhite.opacity + hyperGlowLevel * 0.65);

        const targetIntensity = 1 + hyperGlowLevel * 0.85;
        const targetDistance = 1000 + hyperGlowLevel * 280;
        pointLight.intensity += (targetIntensity - pointLight.intensity) * 0.12;
        pointLight.distance += (targetDistance - pointLight.distance) * 0.12;
    }

    function animateStars() {
        const time = performance.now() * 0.001;

        const driftX = Math.sin(time * 0.3) * 0.001;
        const driftY = Math.cos(time * 0.25) * 0.001;

        starFieldWhite.rotation.x += 0.0005 + driftX;
        starFieldWhite.rotation.y += 0.0007 + driftY;

        starFieldWhite.position.z += Math.sin(time * 0.5) * 0.05;
    }

    function applyMouseAcceleration() {
        const maxTiltX = 15;
        const maxTiltY = 15;

        velocityX += (targetMouseX - mouseX) * acceleration;
        velocityY += (targetMouseY - mouseY) * acceleration;

        velocityX *= 0.95;
        velocityY *= 0.95;

        mouseX += velocityX;
        mouseY += velocityY;

        const mouseTiltX = mouseY * maxTiltX;
        const mouseTiltY = -mouseX * maxTiltY;

        gsap.to(camera.rotation, {
            x: THREE.MathUtils.degToRad(mouseTiltX),
            y: THREE.MathUtils.degToRad(mouseTiltY),
            duration: 0.5,
            ease: "power2.out"
        });

        gsap.to(pointLight.position, {
            x: mouseX * 100,
            y: mouseY * 100,
            duration: 0.5,
            ease: "power2.out"
        });
    }

    const densityProbe = new THREE.Vector3();
    const densityGridCols = 4;
    const densityGridRows = 3;

    function getDensityAwareVelocityDirection() {
        const posAttr = stars.getAttribute('position');
        if (!posAttr || !posAttr.array || posAttr.array.length < 3) {
            const angle = Math.random() * Math.PI * 2;
            return { x: Math.cos(angle), y: Math.sin(angle), confidence: 0, visibleRatio: 0.6 };
        }

        camera.updateMatrixWorld(true);
        starFieldWhite.updateMatrixWorld(true);

        const positions = posAttr.array;
        const bins = new Float32Array(densityGridCols * densityGridRows);
        const starTotal = positions.length / 3;
        const maxSamples = 1600;
        const stride = Math.max(1, Math.ceil(starTotal / maxSamples));
        let visibleCount = 0;
        let sampledCount = 0;

        for (let starIdx = 0; starIdx < starTotal; starIdx += stride) {
            sampledCount += 1;
            const i = starIdx * 3;
            densityProbe
                .set(positions[i], positions[i + 1], positions[i + 2])
                .applyMatrix4(starFieldWhite.matrixWorld)
                .project(camera);

            const nx = densityProbe.x;
            const ny = densityProbe.y;
            const nz = densityProbe.z;

            if (!Number.isFinite(nx) || !Number.isFinite(ny) || !Number.isFinite(nz)) continue;
            if (nz < -1 || nz > 1 || nx < -1.1 || nx > 1.1 || ny < -1.1 || ny > 1.1) continue;

            const x01 = (nx + 1) * 0.5;
            const y01 = (1 - ny) * 0.5;

            const col = Math.min(densityGridCols - 1, Math.max(0, Math.floor(x01 * densityGridCols)));
            const row = Math.min(densityGridRows - 1, Math.max(0, Math.floor(y01 * densityGridRows)));

            bins[row * densityGridCols + col] += 1;
            visibleCount += 1;
        }

        const randomAngle = Math.random() * Math.PI * 2;
        const randomDir = { x: Math.cos(randomAngle), y: Math.sin(randomAngle) };
        const visibleRatio = visibleCount / Math.max(1, sampledCount);

        if (visibleCount < 25) {
            return { x: randomDir.x, y: randomDir.y, confidence: 0, visibleRatio };
        }

        let maxVal = -Infinity;
        let minVal = Infinity;
        let maxIdx = 0;

        for (let i = 0; i < bins.length; i++) {
            const v = bins[i];
            if (v > maxVal) {
                maxVal = v;
                maxIdx = i;
            }
            if (v < minVal) minVal = v;
        }

        const avg = visibleCount / bins.length;
        const dominance = (maxVal - avg) / Math.max(avg, 1);
        const spread = (maxVal - minVal) / Math.max(maxVal, 1);
        let confidence = THREE.MathUtils.clamp(dominance * 0.42 + spread * 1.05, 0, 1);
        if (maxVal - minVal <= 0.35) confidence *= 0.18;

        const col = maxIdx % densityGridCols;
        const row = Math.floor(maxIdx / densityGridCols);
        let tx = ((col + 0.5) / densityGridCols - 0.5) * 2;
        let ty = (0.5 - (row + 0.5) / densityGridRows) * 2;

        const tLen = Math.hypot(tx, ty);
        if (tLen < 0.08) {
            return { x: randomDir.x, y: randomDir.y, confidence: 0, visibleRatio };
        }

        tx /= tLen;
        ty /= tLen;

        const randomWeight = THREE.MathUtils.clamp(0.84 - confidence * 0.76, 0.08, 0.84);
        let bx = tx * (1 - randomWeight) + randomDir.x * randomWeight;
        let by = ty * (1 - randomWeight) + randomDir.y * randomWeight;

        const blendedLen = Math.hypot(bx, by) || 1;
        bx /= blendedLen;
        by /= blendedLen;

        window.__densitySteerDebug = {
            confidence,
            visibleRatio,
            maxVal,
            minVal,
            bestBin: { col, row },
            target: { x: tx, y: ty },
            blended: { x: bx, y: by }
        };

        return { x: bx, y: by, confidence, visibleRatio };
    }

function switchCameraPosition() {
    if (starfieldFrozen) return;

    const hyper = isHyperModeEnabled();
    const profile = hyper
        ? {
            travelBase: 430,
            travelBoost: 720,
            scatterXConfident: 420,
            scatterXLoose: 560,
            scatterYConfident: 320,
            scatterYLoose: 430,
            centerPullBase: 0.045,
            centerPullGuardScale: 0.04,
            centerPullThresholdX: 390,
            centerPullThresholdY: 300,
            maxXBase: 980,
            maxXBoost: 320,
            maxYBase: 730,
            maxYBoost: 260,
            zBase: 960,
            zJitter: 700,
            zBoost: 260,
            zMin: 680,
            zMax: 1620,
            rotationBiasDiv: 13,
            rotationRandDiv: 4.9,
            zoomMin: 40,
            zoomRange: 30,
            zoomDuration: 0.52,
            zoomEase: "power3.in",
            moveDuration: 1.45,
            moveEase: "power4.inOut",
            positionWobbleX: 0.3,
            positionWobbleY: 0.2,
            rotationDuration: 1.45,
            rotationEase: "power4.inOut",
            rotationWobble: 0.0022,
            starRollRange: 0.74,
            starRollDuration: 1.28,
            starRollEase: "power3.inOut",
            returnDuration: 0.95,
            returnEase: "power4.out",
            returnOverlap: "-=0.82"
        }
        : {
            travelBase: 370,
            travelBoost: 610,
            scatterXConfident: 340,
            scatterXLoose: 480,
            scatterYConfident: 260,
            scatterYLoose: 360,
            centerPullBase: 0.05,
            centerPullGuardScale: 0.05,
            centerPullThresholdX: 330,
            centerPullThresholdY: 250,
            maxXBase: 930,
            maxXBoost: 280,
            maxYBase: 680,
            maxYBoost: 220,
            zBase: 940,
            zJitter: 580,
            zBoost: 190,
            zMin: 660,
            zMax: 1500,
            rotationBiasDiv: 15,
            rotationRandDiv: 6.4,
            zoomMin: 46,
            zoomRange: 20,
            zoomDuration: 0.72,
            zoomEase: "power3.inOut",
            moveDuration: 2.1,
            moveEase: "power2.inOut",
            positionWobbleX: 0.17,
            positionWobbleY: 0.11,
            rotationDuration: 2.1,
            rotationEase: "power2.inOut",
            rotationWobble: 0.0013,
            starRollRange: 0.48,
            starRollDuration: 1.9,
            starRollEase: "power2.inOut",
            returnDuration: 1.32,
            returnEase: "power3.out",
            returnOverlap: "-=1.02"
        };

    const smartDir = getDensityAwareVelocityDirection();
    const visibilityGuard = THREE.MathUtils.clamp((smartDir.visibleRatio - 0.2) / 0.5, 0.6, 1);
    const directionInfluence = THREE.MathUtils.clamp(0.22 + smartDir.confidence * 0.78, 0.22, 1);
    const directionalTravel = (profile.travelBase + smartDir.confidence * profile.travelBoost)
        * visibilityGuard
        * (0.8 + directionInfluence * 0.35);
    const scatterDamp = 1.06 - directionInfluence * 0.56;
    const randomScatterX = (Math.random() - 0.5)
        * (smartDir.confidence > 0.3 ? profile.scatterXConfident : profile.scatterXLoose)
        * scatterDamp;
    const randomScatterY = (Math.random() - 0.5)
        * (smartDir.confidence > 0.3 ? profile.scatterYConfident : profile.scatterYLoose)
        * scatterDamp;

    // Only pull back when we are near the outer safe envelope, so movement doesn't feel like snapping home.
    const centerPullStrength = profile.centerPullBase + (1 - visibilityGuard) * profile.centerPullGuardScale;
    const centerPullX = Math.sign(camera.position.x) * Math.max(0, Math.abs(camera.position.x) - profile.centerPullThresholdX) * centerPullStrength;
    const centerPullY = Math.sign(camera.position.y) * Math.max(0, Math.abs(camera.position.y) - profile.centerPullThresholdY) * centerPullStrength;
    const targetX = camera.position.x
        + smartDir.x * directionalTravel
        + randomScatterX
        - centerPullX;
    const targetY = camera.position.y
        + smartDir.y * directionalTravel
        + randomScatterY
        - centerPullY;

    const maxX = profile.maxXBase + smartDir.confidence * profile.maxXBoost;
    const maxY = profile.maxYBase + smartDir.confidence * profile.maxYBoost;
    const randomX = THREE.MathUtils.clamp(targetX, -maxX, maxX);
    const randomY = THREE.MathUtils.clamp(targetY, -maxY, maxY);
    const randomZ = THREE.MathUtils.clamp(
        profile.zBase + (Math.random() - 0.5) * profile.zJitter + smartDir.confidence * profile.zBoost,
        profile.zMin,
        profile.zMax
    );

    const rotationBias = smartDir.confidence * (Math.PI / profile.rotationBiasDiv);
    const randomRotationX = (Math.random() - 0.5) * Math.PI / profile.rotationRandDiv - smartDir.y * rotationBias;
    const randomRotationY = (Math.random() - 0.5) * Math.PI / profile.rotationRandDiv + smartDir.x * rotationBias;

    const zoomInFOV = Math.random() * profile.zoomRange + profile.zoomMin;
    const originalFOV = camera.fov;

    triggerWarpBurst();

    shockwaveTime = 1.0;

    const tl = gsap.timeline();

    tl.to(camera, {
        fov: zoomInFOV,
        duration: profile.zoomDuration,
        ease: profile.zoomEase,
        onUpdate: () => camera.updateProjectionMatrix()
    });

    tl.to(camera.position, {
        x: randomX,
        y: randomY,
        z: randomZ,
        duration: profile.moveDuration,
        ease: profile.moveEase,
        onUpdate: () => {
            camera.position.x += Math.sin(performance.now() * 0.002) * profile.positionWobbleX;
            camera.position.y += Math.cos(performance.now() * 0.0015) * profile.positionWobbleY;
        }
    }, 0);

    tl.to(camera.rotation, {
        x: randomRotationX,
        y: randomRotationY,
        duration: profile.rotationDuration,
        ease: profile.rotationEase,
        onUpdate: () => {
            camera.rotation.x += Math.sin(performance.now() * 0.001) * profile.rotationWobble;
            camera.rotation.y += Math.cos(performance.now() * 0.001) * profile.rotationWobble;
        }
    }, 0);

    tl.to(starFieldWhite.rotation, {
        z: starFieldWhite.rotation.z + (Math.random() - 0.5) * profile.starRollRange,
        duration: profile.starRollDuration,
        ease: profile.starRollEase
    }, 0);

    tl.to(camera, {
        fov: originalFOV,
        duration: profile.returnDuration,
        ease: profile.returnEase,
        onUpdate: () => camera.updateProjectionMatrix()
    }, profile.returnOverlap);
}

    window.addEventListener('sectionChanged', () => {
        if (!starfieldFrozen) {
            switchCameraPosition();
        }
    });

document.addEventListener('keydown', (event) => {
    if (starfieldFrozen) return;
    if (event.ctrlKey && event.shiftKey) {
        switch (event.code) {
            case 'Digit5':
                event.preventDefault();
                switchCameraPosition();
                break;

            case 'Digit6':
                event.preventDefault();
                switchCameraPosition();
                break;

            case 'Digit7':
                event.preventDefault();
                switchCameraPosition();
                break;

            case 'Digit8':
                event.preventDefault();
                switchCameraPosition();
                break;

            default:
                return;
        }
    }
});

    function render() {
        if (!starfieldFrozen) {
            applyWarpSpeed();
            applyMouseAcceleration();
            applyDynamicStarScaling();
            applyShockwaveEffect();
            applyBlackHoleEffect();
            applyTwinkleEffect();
            applyHyperModeStarGlow();
            animateStars();
        }

        renderer.render(scene, camera);
        requestAnimationFrame(render);
    }

    setupMouseControl();
    if (!starfieldFrozen) {
        switchCameraPosition();
    }
    render();

    }

});
