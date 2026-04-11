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

            // rAF-throttle mousemove so we issue at most one gsap tween per frame.
            let pendingX = 0, pendingY = 0;
            let frameScheduled = false;
            const flushMagnetic = () => {
                frameScheduled = false;
                gsap.to(btn, {
                    x: pendingX * 0.3,
                    y: pendingY * 0.3,
                    duration: 0.4,
                    ease: "power2.out"
                });
            };

            btn.addEventListener('mousemove', (e) => {
                const rect = btn.getBoundingClientRect();
                pendingX = e.clientX - rect.left - rect.width / 2;
                pendingY = e.clientY - rect.top - rect.height / 2;
                if (!frameScheduled) {
                    frameScheduled = true;
                    requestAnimationFrame(flushMagnetic);
                }
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

    const playedTitleHoverFxKeys = new Set();

    function getTitleHoverFxKey(content, sourceText) {
        let sectionKey = 'global';

        try {
            const storedSection = sessionStorage.getItem('lastSection');
            if (storedSection) sectionKey = storedSection.toLowerCase();
        } catch (error) {
            // Ignore storage access issues in privacy-restricted contexts.
        }

        const normalizedText = String(sourceText || '')
            .replace(/\s+/g, ' ')
            .trim()
            .toLowerCase();

        return `${sectionKey}::${normalizedText || 'title'}`;
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
            const hoverFxKey = getTitleHoverFxKey(content, sourceText);

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
                if (title.dataset.hoverFxPlayed === 'true' || playedTitleHoverFxKeys.has(hoverFxKey)) {
                    return;
                }

                title.dataset.hoverFxPlayed = 'true';
                title.dataset.hoverFxAnimating = 'true';
                playedTitleHoverFxKeys.add(hoverFxKey);

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
                        delay: anime.stagger(10, { from: 'center' }),
                        complete: () => {
                            title.dataset.hoverFxAnimating = 'false';
                        }
                    }, '-=70');
            };

            const resetHoverFx = () => {
                if (title.dataset.hoverFxAnimating === 'true') {
                    return;
                }
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

    /**
     * Animates the currently-mounted #content subtree in via GSAP timelines.
     * Called by gsapTransitionIn / gsapFadeIn after new section HTML is injected.
     * Public API: invoked from index.html inline scripts after fetchSection().
     */
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

    /**
     * Directional exit transition for #content — a layered GSAP timeline that
     * decouples blur, translate, rotate, scale and opacity into distinct stages
     * so the motion reads as a composed "push-off" rather than a flat tween.
     *
     * CRITICAL: we always clearProps on the inline transform at the end. The
     * next step in the pipeline often injects a skeleton into #content, and
     * because body is display:flex (centered), a left-over scale/rotate would
     * cause the skeleton container to collapse to an unexpected width.
     *
     * @param {HTMLElement} content - the container being transitioned out
     * @param {'up'|'down'|'left'|'right'} direction - travel direction
     * @returns {Promise<void>} resolves once the tween completes or interrupts
     */
    window.gsapTransitionOut = function(content, direction) {
        return new Promise(resolve => {
            const hyper = isHyperModeEnabled();
            const isVertical = direction === 'up' || direction === 'down';
            const dirMult = (direction === 'down' || direction === 'right') ? -1 : 1;
            let finished = false;
            const finish = () => {
                if (finished) return;
                finished = true;
                // Strip the inline transform/filter so downstream code (e.g.
                // skeleton injection) renders into a clean container. Opacity
                // is preserved at the tween's final value so content stays
                // hidden until transitionIn takes over.
                gsap.set(content, {
                    clearProps: 'transform,rotationX,rotationY,rotationZ,rotate,scale,scaleX,scaleY,x,y,filter'
                });
                resolve();
            };

            gsap.killTweensOf(content);

            if (hyper) {
                // Chunky stepped exit for hyper mode — one stage, stepped ease.
                gsap.to(content, {
                    opacity: 0,
                    scale: 0.62,
                    y: isVertical ? dirMult * 240 : 0,
                    x: !isVertical ? dirMult * 300 : 0,
                    rotationY: !isVertical ? dirMult * -20 : 0,
                    rotationX: isVertical ? dirMult * 14 : 0,
                    filter: 'blur(30px)',
                    duration: 0.26,
                    ease: 'steps(4)',
                    force3D: true,
                    overwrite: 'auto',
                    onComplete: finish,
                    onInterrupt: finish
                });
                return;
            }

            // Normal mode: two-stage timeline.
            //  S1 — small pre-compress (scale 1 → 0.985, mild blur) signals
            //       that motion is imminent (100ms)
            //  S2 — main push: translate + rotate + scale + fade + deep blur
            const tl = gsap.timeline({
                defaults: { force3D: true, overwrite: 'auto' },
                onComplete: finish,
                onInterrupt: finish
            });

            tl.to(content, {
                scale: 0.985,
                filter: 'blur(3px)',
                duration: 0.12,
                ease: 'power1.in'
            }, 0);

            tl.to(content, {
                opacity: 0,
                scale: 0.9,
                y: isVertical ? dirMult * 75 : 0,
                x: !isVertical ? dirMult * 95 : 0,
                rotationY: !isVertical ? dirMult * -6 : 0,
                rotationX: isVertical ? dirMult * 4 : 0,
                filter: 'blur(12px)',
                duration: 0.42,
                ease: 'expo.in'
            }, 0.08);
        });
    };

    /**
     * Directional entrance transition for #content. Uses a three-stage
     * timeline so position, scale and blur settle on slightly different
     * curves — feels less rigid than a single tween. Also kicks off
     * animateContentIn() so the inner subtree animates alongside.
     *
     * @param {HTMLElement} content
     * @param {'up'|'down'|'left'|'right'} direction
     */
    window.gsapTransitionIn = function(content, direction) {
        const hyper = isHyperModeEnabled();
        const isVertical = direction === 'up' || direction === 'down';
        const dirMult = (direction === 'down' || direction === 'right') ? 1 : -1;

        gsap.killTweensOf(content);

        // Starting state — opposite side of the exit direction.
        gsap.set(content, {
            opacity: 0,
            scale: hyper ? 0.6 : 0.9,
            y: isVertical ? dirMult * (hyper ? 228 : 90) : 0,
            x: !isVertical ? dirMult * (hyper ? 260 : 110) : 0,
            rotationY: !isVertical ? dirMult * (hyper ? 20 : 6) : 0,
            rotationX: isVertical ? dirMult * (hyper ? -14 : -5) : 0,
            filter: hyper ? 'blur(28px)' : 'blur(14px)',
            force3D: true
        });

        window.animateContentIn();

        const cleanup = () => gsap.set(content, { clearProps: 'all' });

        if (hyper) {
            gsap.to(content, {
                opacity: 1,
                scale: 1,
                y: 0,
                x: 0,
                rotationY: 0,
                rotationX: 0,
                filter: 'blur(0px)',
                duration: 0.28,
                ease: 'steps(4)',
                force3D: true,
                overwrite: 'auto',
                onComplete: cleanup,
                onInterrupt: cleanup
            });
            return;
        }

        // Three overlapping tweens so translate, scale and blur resolve on
        // different curves — reads as motion with depth.
        const tl = gsap.timeline({
            defaults: { force3D: true, overwrite: 'auto' },
            onComplete: cleanup,
            onInterrupt: cleanup
        });

        // S1: translate + rotate settle fastest (snap into place)
        tl.to(content, {
            y: 0,
            x: 0,
            rotationX: 0,
            rotationY: 0,
            opacity: 1,
            duration: 0.62,
            ease: 'expo.out'
        }, 0);

        // S2: scale eases out slightly slower for a breathing feel
        tl.to(content, {
            scale: 1,
            duration: 0.72,
            ease: 'expo.out'
        }, 0.02);

        // S3: blur clears last, so the content sharpens after it lands
        tl.to(content, {
            filter: 'blur(0px)',
            duration: 0.55,
            ease: 'power2.out'
        }, 0.14);
    };

    /**
     * Quick non-directional fade-out used when swapping cached sections or
     * swapping skeleton → real content on the slow-fetch path.
     * @param {HTMLElement} content
     * @param {string} [directionHint] - optional direction hint (unused)
     * @returns {Promise<void>}
     */
    window.gsapFadeSwap = function(content, directionHint) {
        return new Promise(resolve => {
            const hyper = isHyperModeEnabled();
            let finished = false;
            const finish = () => {
                if (finished) return;
                finished = true;
                // Same width-collapse defense as gsapTransitionOut: clear
                // transforms before innerHTML swap.
                gsap.set(content, {
                    clearProps: 'transform,rotationX,rotationY,rotationZ,rotate,scale,scaleX,scaleY,x,y,filter'
                });
                resolve();
            };
            gsap.killTweensOf(content);
            gsap.to(content, {
                opacity: 0,
                scale: hyper ? 0.76 : 0.965,
                y: hyper ? -70 : -12,
                filter: hyper ? 'blur(16px)' : 'blur(5px)',
                duration: hyper ? 0.16 : 0.24,
                ease: hyper ? 'steps(2)' : 'power2.in',
                force3D: true,
                overwrite: 'auto',
                onComplete: finish,
                onInterrupt: finish
            });
        });
    };

    /**
     * Quick non-directional fade-in counterpart to gsapFadeSwap. Also runs
     * the inner-element animation via animateContentIn().
     * @param {HTMLElement} content
     */
    window.gsapFadeIn = function(content) {
        const hyper = isHyperModeEnabled();

        gsap.killTweensOf(content);
        const cleanup = () => gsap.set(content, { clearProps: 'all' });

        gsap.fromTo(content,
            {
                opacity: 0,
                scale: hyper ? 0.72 : 0.965,
                y: hyper ? 95 : 14,
                filter: hyper ? 'blur(18px)' : 'blur(5px)'
            },
            {
                opacity: 1,
                scale: 1,
                y: 0,
                filter: 'blur(0px)',
                duration: hyper ? 0.24 : 0.48,
                ease: hyper ? 'steps(4)' : 'expo.out',
                force3D: true,
                overwrite: 'auto',
                onStart: () => {
                    window.animateContentIn();
                },
                onComplete: cleanup,
                onInterrupt: cleanup
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

    /**
     * Plays the header + menu-bar entrance animation. Called on initial
     * page load and when returning from the matrix overlay.
     */
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

    const starDensity = 0.0046;
    const starBounds = { x: 1500, y: 1200, z: 1500 };
    let starCount = Math.floor(window.innerWidth * window.innerHeight * starDensity);


    const stars = new THREE.BufferGeometry();
    let starVertices = new Float32Array(starCount * 3);
    let starSpeeds = new Float32Array(starCount);
    let starTwinkles = new Float32Array(starCount);

    // Halton quasi-random sequence — far more uniform 3D coverage than
    // uncorrelated Math.random(), which leaves visible clumps and voids.
    function halton(index, base) {
        let result = 0;
        let f = 1 / base;
        let i = index;
        while (i > 0) {
            result += f * (i % base);
            i = Math.floor(i / base);
            f /= base;
        }
        return result;
    }

    // Square star sprites — PointsMaterial without a `map` renders flat square
    // point sprites which is the look we want here.

    function generateStars() {
        // Randomized offset per regeneration so the pattern isn't identical
        // across resizes, while each axis still gets low-discrepancy coverage.
        const haltonOffset = Math.floor(Math.random() * 4096);
        for (let s = 0; s < starCount; s++) {
            const i = s * 3;
            const idx = s + 1 + haltonOffset;
            const h2 = halton(idx, 2);
            const h3 = halton(idx, 3);
            const h5 = halton(idx, 5);
            // Micro-jitter hides any residual regularity of the sequence.
            const jx = (Math.random() - 0.5) * 0.012;
            const jy = (Math.random() - 0.5) * 0.012;
            const jz = (Math.random() - 0.5) * 0.012;
            starVertices[i]     = (h2 - 0.5 + jx) * starBounds.x * 2;
            starVertices[i + 1] = (h3 - 0.5 + jy) * starBounds.y * 2;
            starVertices[i + 2] = (h5 - 0.5 + jz) * starBounds.z * 2;
            starSpeeds[s] = Math.random() * 0.1 + 0.02;
            starTwinkles[s] = Math.random() * 0.5 + 0.5;
        }
        stars.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    }

    generateStars();

    const starMaterialWhite = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 4,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
    });

    const starFieldWhite = new THREE.Points(stars, starMaterialWhite);
    scene.add(starFieldWhite);

    // Hero stars — a sparse, brighter layer that gives the starfield real
    // depth. Uses the same circular texture but with a larger base size and
    // an independent slow pulse. Positioned using a different Halton offset
    // so the bright stars never align with the main-field pattern.
    const HERO_STAR_COUNT = 60;
    const heroStars = new THREE.BufferGeometry();
    const heroVertices = new Float32Array(HERO_STAR_COUNT * 3);
    const heroPhases = new Float32Array(HERO_STAR_COUNT);
    const heroOffset = 73;
    for (let i = 0; i < HERO_STAR_COUNT; i++) {
        const idx = i + 1 + heroOffset;
        heroVertices[i * 3]     = (halton(idx, 2) - 0.5) * starBounds.x * 1.7;
        heroVertices[i * 3 + 1] = (halton(idx, 3) - 0.5) * starBounds.y * 1.7;
        heroVertices[i * 3 + 2] = (halton(idx, 5) - 0.5) * starBounds.z * 1.7;
        heroPhases[i] = Math.random() * Math.PI * 2;
    }
    heroStars.setAttribute('position', new THREE.Float32BufferAttribute(heroVertices, 3));
    const heroMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 13,
        transparent: true,
        opacity: 1.0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
    });
    const heroField = new THREE.Points(heroStars, heroMaterial);
    scene.add(heroField);

    camera.position.z = 1000;

    window.addEventListener('starfieldFreeze', (event) => {
        starfieldFrozen = !!(event.detail && event.detail.frozen);
        if (starfieldFrozen) {
            gsap.killTweensOf(camera);
            gsap.killTweensOf(camera.position);
            gsap.killTweensOf(camera.rotation);
            gsap.killTweensOf(pointLight.position);
            gsap.killTweensOf(starFieldWhite.rotation);
            gsap.killTweensOf(heroField.rotation);
        }
    });

    window.addEventListener('themeChanged', (e) => {
        if (e.detail && e.detail.light) {
            starMaterialWhite.color.setHex(0x222222);
            starMaterialWhite.blending = THREE.NormalBlending;
            heroMaterial.color.setHex(0x1a1a1a);
            heroMaterial.blending = THREE.NormalBlending;
            pointLight.color.setHex(0x222222);
        } else {
            starMaterialWhite.color.setHex(0xffffff);
            starMaterialWhite.blending = THREE.AdditiveBlending;
            heroMaterial.color.setHex(0xffffff);
            heroMaterial.blending = THREE.AdditiveBlending;
            pointLight.color.setHex(0xffffff);
        }
        starMaterialWhite.needsUpdate = true;
        heroMaterial.needsUpdate = true;
    });

    let resizeTimeout = null;
    window.addEventListener('resize', () => {
        // Update renderer/camera immediately so the canvas never stretches,
        // but debounce the expensive star buffer reallocation.
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        if (resizeTimeout) clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            resizeTimeout = null;
            starCount = Math.floor(window.innerWidth * window.innerHeight * starDensity);
            starVertices = new Float32Array(starCount * 3);
            starSpeeds = new Float32Array(starCount);
            starTwinkles = new Float32Array(starCount);
            generateStars();
        }, 180);
    });

    let mouseX = 0, mouseY = 0;
    let targetMouseX = 0, targetMouseY = 0;
    let velocityX = 0, velocityY = 0;
    const acceleration = 0.002;

    let shockwaveTime = 0;

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

    // applyDynamicStarScaling removed: it used the last-star-Z as a proxy for
    // global camera depth which was both fragile and overridden by the
    // twinkle pass below. Warp-burst size boost is folded into twinkle now.

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

    // Valid opacity range (was being clamped at 1.0 by THREE after bad math).
    // Keep stars bright with a modest twinkle wobble on top.
    const burstBoost = warpBurstIntensity * 3;
    starMaterialWhite.opacity = Math.max(0.55, Math.min(1.0, 0.85 + twinkleIntensity * 0.18));
    starMaterialWhite.size = 3.6 + twinkleIntensity * 2.4 + burstBoost;

    // Hero stars pulse on a slower, deeper curve — draws the eye without
    // competing with the field's high-frequency twinkle.
    const heroPulse = Math.sin(time * 0.9) * 0.5 + 0.5;
    const heroFlicker = Math.sin(time * 3.1 + 1.7) * 0.15;
    heroMaterial.size = 11 + heroPulse * 4 + heroFlicker + burstBoost * 1.5;
    heroMaterial.opacity = Math.max(0.7, Math.min(1.0, 0.82 + heroPulse * 0.18));
}

    function applyHyperModeStarGlow() {
        const targetGlow = isHyperModeEnabled() ? 1 : 0;
        hyperGlowLevel += (targetGlow - hyperGlowLevel) * 0.12;

        starMaterialWhite.size = Math.min(9, starMaterialWhite.size + hyperGlowLevel * 1.8);
        starMaterialWhite.opacity = Math.min(1.0, starMaterialWhite.opacity + hyperGlowLevel * 0.1);
        heroMaterial.size = Math.min(22, heroMaterial.size + hyperGlowLevel * 4);
        heroMaterial.opacity = Math.min(1.0, heroMaterial.opacity + hyperGlowLevel * 0.1);

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

        // Hero layer drifts slightly slower for a parallax depth cue.
        heroField.rotation.x += 0.00032 + driftX * 0.7;
        heroField.rotation.y += 0.00045 + driftY * 0.7;
    }

    let lastMouseTweenTime = 0;
    const mouseTweenThrottle = 50;

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

        const now = performance.now();
        if (now - lastMouseTweenTime > mouseTweenThrottle) {
            lastMouseTweenTime = now;
            gsap.to(camera.rotation, {
                x: THREE.MathUtils.degToRad(mouseTiltX),
                y: THREE.MathUtils.degToRad(mouseTiltY),
                duration: 0.5,
                ease: "power2.out",
                overwrite: "auto"
            });

            gsap.to(pointLight.position, {
                x: mouseX * 100,
                y: mouseY * 100,
                duration: 0.5,
                ease: "power2.out",
                overwrite: "auto"
            });
        }
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

        return { x: bx, y: by, confidence, visibleRatio };
    }

// Tracks the direction of the most recent switch so we can prevent the
// camera from immediately reversing into a back-and-forth yo-yo motion.
let lastSwitchDir = { x: 0, y: 0 };
// Bias the orbital rotation handedness once per session so successive
// tangential deflections tend to curve consistently rather than flip-flop.
let orbitalHandedness = Math.random() < 0.5 ? 1 : -1;

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

    // --- Anti-reversal: rotate the proposed direction so it never points
    //     sharply back along the previous travel vector. Instead of flipping
    //     180°, we deflect it to the perpendicular (orbital-style sweep),
    //     which eliminates the back-and-forth yo-yo feel between switches.
    let dirX = smartDir.x;
    let dirY = smartDir.y;
    const prevLen = Math.hypot(lastSwitchDir.x, lastSwitchDir.y);
    if (prevLen > 0.001) {
        const px = lastSwitchDir.x / prevLen;
        const py = lastSwitchDir.y / prevLen;
        const dot = dirX * px + dirY * py;
        // Anything with dot < MIN_FORWARD_DOT is treated as a reversal.
        const MIN_FORWARD_DOT = -0.1;
        if (dot < MIN_FORWARD_DOT) {
            // Two perpendiculars to the previous direction.
            const perpX = -py * orbitalHandedness;
            const perpY =  px * orbitalHandedness;
            // Blend: mostly tangential, with a small forward component so
            // the camera still drifts rather than orbits rigidly.
            const tangentialWeight = 0.78;
            const forwardWeight = 0.22;
            dirX = perpX * tangentialWeight + px * forwardWeight;
            dirY = perpY * tangentialWeight + py * forwardWeight;
            const nlen = Math.hypot(dirX, dirY) || 1;
            dirX /= nlen;
            dirY /= nlen;
            // Occasionally flip handedness so we don't orbit in one direction forever.
            if (Math.random() < 0.18) orbitalHandedness = -orbitalHandedness;
        }
    }

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
    // The pull is applied PERPENDICULAR to the travel direction so it deflects the
    // path inward along a curve rather than subtracting a reverse vector (which
    // used to produce the back-and-forth snap when combined with a near-opposite smartDir).
    const centerPullStrength = profile.centerPullBase + (1 - visibilityGuard) * profile.centerPullGuardScale;
    const rawPullX = Math.sign(camera.position.x) * Math.max(0, Math.abs(camera.position.x) - profile.centerPullThresholdX) * centerPullStrength;
    const rawPullY = Math.sign(camera.position.y) * Math.max(0, Math.abs(camera.position.y) - profile.centerPullThresholdY) * centerPullStrength;
    // Project the raw pull onto the plane perpendicular to (dirX, dirY) so it
    // curves the trajectory instead of reversing it.
    const forwardComponent = rawPullX * dirX + rawPullY * dirY;
    const perpPullX = rawPullX - forwardComponent * dirX;
    const perpPullY = rawPullY - forwardComponent * dirY;

    const targetX = camera.position.x
        + dirX * directionalTravel
        + randomScatterX
        - perpPullX;
    const targetY = camera.position.y
        + dirY * directionalTravel
        + randomScatterY
        - perpPullY;

    const maxX = profile.maxXBase + smartDir.confidence * profile.maxXBoost;
    const maxY = profile.maxYBase + smartDir.confidence * profile.maxYBoost;
    const randomX = THREE.MathUtils.clamp(targetX, -maxX, maxX);
    const randomY = THREE.MathUtils.clamp(targetY, -maxY, maxY);
    const randomZ = THREE.MathUtils.clamp(
        profile.zBase + (Math.random() - 0.5) * profile.zJitter + smartDir.confidence * profile.zBoost,
        profile.zMin,
        profile.zMax
    );

    // Record the direction we actually committed to (from previous position to target,
    // normalized) so the next switch can honor it. Fall back to (dirX, dirY) when the
    // delta is tiny (e.g., clamped against the envelope on both axes).
    const committedDX = randomX - camera.position.x;
    const committedDY = randomY - camera.position.y;
    const committedLen = Math.hypot(committedDX, committedDY);
    if (committedLen > 1) {
        lastSwitchDir.x = committedDX / committedLen;
        lastSwitchDir.y = committedDY / committedLen;
    } else {
        lastSwitchDir.x = dirX;
        lastSwitchDir.y = dirY;
    }

    const rotationBias = smartDir.confidence * (Math.PI / profile.rotationBiasDiv);
    const randomRotationX = (Math.random() - 0.5) * Math.PI / profile.rotationRandDiv - dirY * rotationBias;
    const randomRotationY = (Math.random() - 0.5) * Math.PI / profile.rotationRandDiv + dirX * rotationBias;

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

    const rollZ = (Math.random() - 0.5) * profile.starRollRange;
    tl.to(starFieldWhite.rotation, {
        z: starFieldWhite.rotation.z + rollZ,
        duration: profile.starRollDuration,
        ease: profile.starRollEase
    }, 0);
    // Keep the hero layer in lockstep on roll so the depth parallax holds.
    tl.to(heroField.rotation, {
        z: heroField.rotation.z + rollZ * 0.85,
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
        if (['Digit5', 'Digit6', 'Digit7', 'Digit8'].includes(event.code)) {
            event.preventDefault();
            switchCameraPosition();
        }
    }
});

    function render() {
        if (!starfieldFrozen) {
            applyWarpSpeed();
            applyMouseAcceleration();
            applyShockwaveEffect();
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
