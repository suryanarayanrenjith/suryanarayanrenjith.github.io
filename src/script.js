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

    const copyrightText = `© ${currentYear} Suryanarayan Renjith. All rights reserved.`;
    function isAudioPlaybackAvailable() {
        return window.__audioPlaybackAvailable !== false;
    }
    footerText.addEventListener('mouseover', function() {
        if (!isAudioPlaybackAvailable()) return;
        changeTextWithGSAP('Music Credits: Suryanarayan Renjith.');
    });

    footerText.addEventListener('mouseout', function() {
        changeTextWithGSAP(copyrightText);
    });

    window.addEventListener('audioPlaybackUnavailable', function () {
        if (footerText.textContent.indexOf('Music Credits') !== -1) {
            changeTextWithGSAP(copyrightText);
        }
    });

    function initMagneticButtons() {
        const magneticEls = document.querySelectorAll('.center-button, .help-button');
        magneticEls.forEach(btn => {
            if (btn.dataset.magnetic) return;
            btn.dataset.magnetic = 'true';

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

    function getSectionTitleTargets(content) {
        if (!content) return [];

        const explicitTitles = Array.from(content.querySelectorAll('.animated-text'));
        if (explicitTitles.length) return explicitTitles;

        const fallbackTitle = content.querySelector('h1');
        return fallbackTitle ? [fallbackTitle] : [];
    }

    function getTitleGenerationText(title) {
        const storedText = title.dataset.titleGenerationSource;
        const currentText = title.textContent || '';
        return (storedText || currentText).replace(/\s+/g, ' ').trim();
    }

    function getTitleGenerationProfile() {
        const width = window.innerWidth || document.documentElement.clientWidth || 1024;
        const coarsePointer = window.matchMedia &&
            window.matchMedia('(pointer: coarse)').matches;
        const hyper = isHyperModeEnabled();

        if (width <= 480) {
            return {
                firstDelay: hyper ? 70 : 115,
                minDelay: hyper ? 10 : 24,
                maxDelay: hyper ? 38 : 68,
                wordPauseMin: hyper ? 8 : 24,
                wordPauseMax: hyper ? 38 : 72,
                punctuationPauseMin: hyper ? 35 : 80,
                punctuationPauseMax: hyper ? 90 : 145,
                microPauseChance: hyper ? 0.08 : 0.12,
                burstChance: hyper ? 0.54 : 0.34,
                maxChunk: hyper ? 3 : 2,
                stepDuration: hyper ? 14 : 20,
                perCharDuration: hyper ? 5 : 8,
                finalHold: hyper ? 180 : 340,
                cursorNudge: false,
                textPulse: false,
                finalDrift: '0.04em'
            };
        }

        if (width <= 1024 || coarsePointer) {
            return {
                firstDelay: hyper ? 60 : 105,
                minDelay: hyper ? 9 : 18,
                maxDelay: hyper ? 34 : 62,
                wordPauseMin: hyper ? 8 : 20,
                wordPauseMax: hyper ? 35 : 66,
                punctuationPauseMin: hyper ? 32 : 72,
                punctuationPauseMax: hyper ? 82 : 130,
                microPauseChance: hyper ? 0.1 : 0.16,
                burstChance: hyper ? 0.58 : 0.42,
                maxChunk: hyper ? 4 : 3,
                stepDuration: hyper ? 12 : 18,
                perCharDuration: hyper ? 4 : 7,
                finalHold: hyper ? 190 : 380,
                cursorNudge: true,
                textPulse: false,
                finalDrift: '0.055em'
            };
        }

        return {
            firstDelay: hyper ? 50 : 95,
            minDelay: hyper ? 8 : 14,
            maxDelay: hyper ? 30 : 58,
            wordPauseMin: hyper ? 7 : 18,
            wordPauseMax: hyper ? 28 : 64,
            punctuationPauseMin: hyper ? 28 : 68,
            punctuationPauseMax: hyper ? 76 : 126,
            microPauseChance: hyper ? 0.12 : 0.2,
            burstChance: hyper ? 0.64 : 0.48,
            maxChunk: hyper ? 5 : 4,
            stepDuration: hyper ? 10 : 16,
            perCharDuration: hyper ? 4 : 6,
            finalHold: hyper ? 200 : 430,
            cursorNudge: true,
            textPulse: true,
            finalDrift: '0.07em'
        };
    }

    function randomBetween(min, max) {
        return min + Math.random() * (max - min);
    }

    function getTitleChunkLength(chars, index, profile) {
        if (/\s/.test(chars[index] || '')) return 1;

        let boundary = index;
        while (
            boundary < chars.length &&
            !/\s/.test(chars[boundary]) &&
            !/[.,!?;:()[\]{}]/.test(chars[boundary])
        ) {
            boundary += 1;
        }

        const remainingInWord = Math.max(1, boundary - index);
        const remaining = chars.length - index;
        const maxChunk = Math.min(profile.maxChunk, remainingInWord, remaining);
        const roll = Math.random();

        if (roll < profile.burstChance) return Math.max(1, maxChunk);
        if (roll < profile.burstChance + 0.32) return Math.min(2, maxChunk);
        return 1;
    }

    function getTitleStepDelay(chars, nextIndex, profile) {
        const previous = chars[nextIndex - 1] || '';
        const next = chars[nextIndex] || '';
        let delay = randomBetween(profile.minDelay, profile.maxDelay);

        if (/\s/.test(previous) || /\s/.test(next)) {
            delay += randomBetween(profile.wordPauseMin, profile.wordPauseMax);
        }
        if (/[.,!?;:]/.test(previous)) {
            delay += randomBetween(profile.punctuationPauseMin, profile.punctuationPauseMax);
        }
        if (Math.random() < profile.microPauseChance) {
            delay += randomBetween(36, 118);
        }
        if (nextIndex >= chars.length - 2) {
            delay += randomBetween(18, 58);
        }

        return delay;
    }

    function cleanupTitleGeneration(title, sourceText) {
        const fx = title.__titleGenerationFx;
        if (!fx) return;

        if (fx.stream) fx.stream.pause();
        if (fx.cursorBlink) fx.cursorBlink.pause();
        if (typeof anime !== 'undefined') {
            anime.remove(fx.state);
            anime.remove(fx.cursor);
        }
        if (typeof gsap !== 'undefined') {
            gsap.killTweensOf([fx.textEl, fx.cursor]);
        }
        if (fx.cursor) fx.cursor.remove();
        title.classList.remove('is-generating-title', 'is-generation-complete');
        title.textContent = sourceText || title.dataset.titleGenerationSource || title.textContent || '';
        title.style.minHeight = '';
        delete title.__titleGenerationFx;
    }

    function initSectionTitleGenerationFx(content) {
        if (!content || typeof anime === 'undefined') return;

        const reduceMotion = window.matchMedia &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const titleTargets = getSectionTitleTargets(content);
        const profile = getTitleGenerationProfile();

        titleTargets.forEach((title, titleIndex) => {
            const sourceText = getTitleGenerationText(title);
            if (!sourceText) return;

            title.dataset.titleGenerationSource = sourceText;
            title.setAttribute('aria-label', sourceText);
            cleanupTitleGeneration(title, sourceText);

            if (reduceMotion) {
                title.textContent = sourceText;
                return;
            }

            const measuredHeight = title.getBoundingClientRect().height;
            if (measuredHeight > 0) {
                title.style.minHeight = `${Math.ceil(measuredHeight)}px`;
            }

            const chars = Array.from(sourceText);
            const state = { progress: 0 };
            const textEl = document.createElement('span');
            const cursor = document.createElement('span');
            textEl.className = 'title-generation-text';
            textEl.setAttribute('aria-hidden', 'true');
            cursor.className = 'title-generation-cursor';
            cursor.setAttribute('aria-hidden', 'true');

            title.__titleGenerationFx = {
                state,
                textEl,
                cursor,
                cursorBlink: null,
                stream: null,
                index: 0,
                lastRendered: -1
            };
            anime.remove(title);
            title.classList.add('is-generating-title');
            title.textContent = '';
            title.append(textEl, cursor);

            const fx = title.__titleGenerationFx;
            const render = (visibleCount) => {
                const count = Math.max(0, Math.min(chars.length, visibleCount));
                if (count === fx.lastRendered) return;
                fx.lastRendered = count;
                textEl.textContent = chars.slice(0, count).join('');
            };

            if (typeof gsap !== 'undefined') {
                gsap.fromTo(cursor,
                    { scaleY: 0.35 },
                    { scaleY: 1, duration: 0.24, ease: 'power2.out', overwrite: 'auto' }
                );
            }

            const cursorBlink = anime({
                targets: cursor,
                opacity: [0.95, 0.48],
                duration: 620,
                easing: 'easeInOutSine',
                direction: 'alternate',
                loop: true
            });
            fx.cursorBlink = cursorBlink;

            const finish = () => {
                render(chars.length);
                title.classList.add('is-generation-complete');
                cursorBlink.pause();

                if (typeof gsap !== 'undefined') {
                    gsap.fromTo(textEl,
                        { filter: 'brightness(1.22)' },
                        { filter: 'brightness(1)', duration: 0.36, ease: 'power2.out', overwrite: 'auto' }
                    );
                }

                anime.remove(cursor);
                anime.timeline({
                    complete: () => {
                        cursor.remove();
                        title.classList.remove('is-generating-title', 'is-generation-complete');
                        title.textContent = sourceText;
                        title.style.minHeight = '';
                        delete title.__titleGenerationFx;
                    }
                })
                    .add({
                        targets: cursor,
                        opacity: [0.95, 1],
                        scaleX: [1, 1.34],
                        scaleY: [1, 0.82],
                        duration: 150,
                        easing: 'easeOutQuad'
                    })
                    .add({
                        targets: cursor,
                        opacity: 0,
                        scaleX: 0.42,
                        scaleY: 0.3,
                        translateX: profile.finalDrift,
                        duration: 360,
                        delay: profile.finalHold,
                        easing: 'easeOutExpo'
                    });
            };

            const pulse = (chunkLength) => {
                if (typeof gsap === 'undefined') return;

                if (profile.cursorNudge) {
                    gsap.fromTo(cursor,
                        { x: Math.min(5, 1.4 + chunkLength * 0.9) },
                        { x: 0, duration: 0.18, ease: 'power3.out', overwrite: 'auto' }
                    );
                }
                if (profile.textPulse && Math.random() < 0.58) {
                    gsap.fromTo(textEl,
                        { filter: 'brightness(1.2)' },
                        { filter: 'brightness(1)', duration: 0.2, ease: 'power2.out', overwrite: 'auto' }
                    );
                }
            };

            const streamNext = (delay) => {
                if (!title.__titleGenerationFx) return;
                if (fx.index >= chars.length) {
                    finish();
                    return;
                }

                const startIndex = fx.index;
                const chunkLength = getTitleChunkLength(chars, startIndex, profile);
                const nextIndex = Math.min(chars.length, startIndex + chunkLength);

                fx.stream = anime({
                    targets: state,
                    progress: nextIndex,
                    duration: profile.stepDuration + chunkLength * profile.perCharDuration,
                    delay,
                    easing: 'easeOutQuad',
                    update: () => {
                        render(Math.floor(state.progress));
                    },
                    complete: () => {
                        fx.index = nextIndex;
                        state.progress = nextIndex;
                        render(nextIndex);
                        pulse(chunkLength);
                        streamNext(getTitleStepDelay(chars, nextIndex, profile));
                    }
                });
            };

            streamNext(profile.firstDelay + titleIndex * 110);
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

        if (typeof anime !== 'undefined') {
            initSectionTitleGenerationFx(content);

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
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 4500);
    const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    let starfieldFrozen = !!(window.__starfieldFreezeState && window.__starfieldFreezeState.frozen === true);
    let hyperGlowLevel = isHyperModeEnabled() ? 1 : 0;

    const pointLight = new THREE.PointLight(0xffffff, 1, 1000);
    pointLight.position.set(0, 0, 500);
    scene.add(camera);
    camera.add(pointLight);

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

    const starDensity = 0.0072;
    const FOV_DEG = 75;
    const BOUNDS_MARGIN = 1.18;

    function computeShellBounds(depthZ) {
        const aspect = Math.max(1, window.innerWidth / Math.max(1, window.innerHeight));
        const tanV = Math.tan(THREE.MathUtils.degToRad(FOV_DEG / 2));
        const tanH = tanV * aspect;
        return {
            x: depthZ * tanH * BOUNDS_MARGIN,
            y: depthZ * tanV * BOUNDS_MARGIN,
            z: depthZ
        };
    }

    const SHELL_PROFILES = {
        near: { depthZ: 700,  countShare: 0.25, baseSize: 2.0, twinkleAmp: 1.4, hyperBoost: 1.0, haltonOffset: 113, bright: 0.78 },
        main: { depthZ: 1300, countShare: 0.55, baseSize: 3.6, twinkleAmp: 2.4, hyperBoost: 1.8, haltonOffset: 0,   bright: 1.00 },
        far:  { depthZ: 2400, countShare: 0.20, baseSize: 1.6, twinkleAmp: 0.6, hyperBoost: 0.8, haltonOffset: 947, bright: 0.62 },
        hero: { depthZ: 1900, countShare: 0,    baseSize: 13,  twinkleAmp: 0,   hyperBoost: 4.0, haltonOffset: 73,  bright: 1.00, fixedCount: 60 }
    };

    function computeShellCounts() {
        const total = Math.floor(window.innerWidth * window.innerHeight * starDensity);
        return {
            near: Math.max(80,  Math.floor(total * SHELL_PROFILES.near.countShare)),
            main: Math.max(160, Math.floor(total * SHELL_PROFILES.main.countShare)),
            far:  Math.max(80,  Math.floor(total * SHELL_PROFILES.far.countShare)),
            hero: SHELL_PROFILES.hero.fixedCount
        };
    }

    function fillShellVertices(shell) {
        const v = shell.vertices;
        const s = shell.speeds;
        const bx = shell.bounds.x;
        const by = shell.bounds.y;
        const bz = shell.bounds.z;
        const baseOffset = Math.floor(Math.random() * 4096) + shell.profile.haltonOffset;
        for (let n = 0; n < shell.count; n++) {
            const i = n * 3;
            const idx = n + 1 + baseOffset;
            const h2 = halton(idx, 2);
            const h3 = halton(idx, 3);
            const h5 = halton(idx, 5);
            const jx = (Math.random() - 0.5) * 0.012;
            const jy = (Math.random() - 0.5) * 0.012;
            const jz = (Math.random() - 0.5) * 0.012;
            v[i]     = (h2 - 0.5 + jx) * bx * 2;
            v[i + 1] = (h3 - 0.5 + jy) * by * 2;
            v[i + 2] = (h5 - 0.5 + jz) * bz * 2;
            s[n] = Math.random() * 0.1 + 0.02;
        }
        shell.geometry.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
    }

    function createStarShell(name) {
        const profile = SHELL_PROFILES[name];
        const counts = computeShellCounts();
        const count = counts[name];

        const shell = {
            name,
            profile,
            count,
            bounds: computeShellBounds(profile.depthZ),
            geometry: new THREE.BufferGeometry(),
            vertices: new Float32Array(count * 3),
            speeds: new Float32Array(count)
        };

        fillShellVertices(shell);

        shell.material = new THREE.PointsMaterial({
            color: 0xffffff,
            size: profile.baseSize,
            transparent: true,
            opacity: 0.95 * profile.bright,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            sizeAttenuation: true
        });

        shell.points = new THREE.Points(shell.geometry, shell.material);
        scene.add(shell.points);
        return shell;
    }

    function regenerateShell(shell) {
        const counts = computeShellCounts();
        const newCount = counts[shell.name];
        shell.bounds = computeShellBounds(shell.profile.depthZ);
        if (newCount !== shell.count) {
            shell.count = newCount;
            shell.vertices = new Float32Array(newCount * 3);
            shell.speeds = new Float32Array(newCount);
        }
        fillShellVertices(shell);
    }

    const nearShell = createStarShell('near');
    const mainShell = createStarShell('main');
    const farShell  = createStarShell('far');
    const heroShell = createStarShell('hero');
    const fieldShells = [nearShell, mainShell, farShell];
    const allShells   = [nearShell, mainShell, farShell, heroShell];

    camera.position.z = 1000;

    window.addEventListener('starfieldFreeze', (event) => {
        starfieldFrozen = !!(event.detail && event.detail.frozen);
        if (starfieldFrozen) {
            gsap.killTweensOf(camera);
            gsap.killTweensOf(camera.position);
            gsap.killTweensOf(camera.rotation);
            gsap.killTweensOf(pointLight.position);
            for (const shell of allShells) {
                gsap.killTweensOf(shell.points.rotation);
            }
        }
    });

    window.addEventListener('themeChanged', (e) => {
        const light = !!(e.detail && e.detail.light);
        for (const shell of allShells) {
            const darkColor = shell.name === 'hero' ? 0x1a1a1a : 0x222222;
            shell.material.color.setHex(light ? darkColor : 0xffffff);
            shell.material.blending = light ? THREE.NormalBlending : THREE.AdditiveBlending;
            shell.material.needsUpdate = true;
        }
        pointLight.color.setHex(light ? 0x222222 : 0xffffff);
    });

    let resizeTimeout = null;
    window.addEventListener('resize', () => {
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        if (resizeTimeout) clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            resizeTimeout = null;
            for (const shell of allShells) regenerateShell(shell);
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

    // ── Camera input control ──────────────────────────────────────────
    // Desktops: cursor parallax (mousemove).
    // Phones / tablets: device-orientation parallax (gyroscope). The mouse
    // path is intentionally NOT attached on touch devices so finger drags
    // don't fight the gyro reading.
    //
    // iOS 13+ requires DeviceOrientationEvent.requestPermission() to be
    // called from a user gesture (Apple privacy rule). Android Chrome /
    // Firefox / Samsung Internet have no permission step. On any device
    // without a gyro the listener simply never fires and the camera stays
    // centered — graceful fallback.
    function isTouchDevice() {
        return (
            ('ontouchstart' in window) ||
            (typeof navigator.maxTouchPoints === 'number' && navigator.maxTouchPoints > 0) ||
            window.matchMedia('(pointer: coarse)').matches
        );
    }

    function setupMouseControl() {
        window.addEventListener('mousemove', (event) => {
            targetMouseX = (event.clientX / window.innerWidth) * 2 - 1;
            targetMouseY = -(event.clientY / window.innerHeight) * 2 + 1;
        }, { passive: true });
    }

    function setupGyroControl() {
        // How many degrees of phone tilt map to the full ±1 range.
        // 22° is comfortable for phones held one-handed.
        const TILT_RANGE_DEG = 22;
        let baseBeta = null;
        let baseGamma = null;
        let attached = false;

        function currentScreenAngle() {
            if (screen.orientation && typeof screen.orientation.angle === 'number') {
                return screen.orientation.angle;
            }
            if (typeof window.orientation === 'number') {
                return window.orientation;
            }
            return 0;
        }

        function recalibrate() {
            baseBeta = null;
            baseGamma = null;
        }

        function handleOrientation(event) {
            const beta = event.beta;    // front-back tilt, deg
            const gamma = event.gamma;  // left-right tilt, deg
            if (beta === null || gamma === null) return;

            // First reading establishes the user's natural holding posture
            // as the neutral / "centered" point — feels much better than
            // forcing them to hold the phone perfectly flat.
            if (baseBeta === null) {
                baseBeta = beta;
                baseGamma = gamma;
                return;
            }

            const dBeta = beta - baseBeta;
            const dGamma = gamma - baseGamma;

            let dx, dy;
            switch (currentScreenAngle()) {
                case 90:
                    dx = -dBeta;
                    dy = dGamma;
                    break;
                case 180:
                    dx = -dGamma;
                    dy = -dBeta;
                    break;
                case 270:
                case -90:
                    dx = dBeta;
                    dy = -dGamma;
                    break;
                case 0:
                default:
                    dx = dGamma;
                    dy = dBeta;
                    break;
            }

            // Normalise to [-1, 1]. The Y axis is inverted so tilting the
            // top of the phone TOWARD the user makes the camera look UP,
            // matching the existing mouse-Y semantics.
            const nx = Math.max(-1, Math.min(1, dx / TILT_RANGE_DEG));
            const ny = Math.max(-1, Math.min(1, -dy / TILT_RANGE_DEG));

            targetMouseX = nx;
            targetMouseY = ny;
        }

        function attach() {
            if (attached) return;
            attached = true;
            // 'deviceorientation' is the broad-compat event; iOS / Android both fire it.
            window.addEventListener('deviceorientation', handleOrientation, true);
        }

        function requestAndAttach() {
            const Cls = window.DeviceOrientationEvent;
            if (Cls && typeof Cls.requestPermission === 'function') {
                // iOS 13+ — must be called from a user-gesture handler.
                Cls.requestPermission()
                    .then((state) => { if (state === 'granted') attach(); })
                    .catch(() => { /* user denied or API failed — silent fallback */ });
            } else {
                // Android, desktops with sensors, older iOS — no prompt.
                attach();
            }
        }

        // If the DeviceOrientationEvent API isn't here at all (very old
        // browsers / locked-down WebViews), skip wiring entirely.
        if (typeof window.DeviceOrientationEvent === 'undefined') return;

        const needsPermission =
            typeof window.DeviceOrientationEvent.requestPermission === 'function';

        if (needsPermission) {
            // Attach a one-shot tap/touch listener so the FIRST user
            // gesture anywhere on the page triggers the iOS prompt.
            const trigger = () => {
                document.removeEventListener('touchend', trigger);
                document.removeEventListener('click', trigger);
                requestAndAttach();
            };
            document.addEventListener('touchend', trigger, { once: true, passive: true });
            document.addEventListener('click', trigger, { once: true });
        } else {
            requestAndAttach();
        }

        // Re-establish the neutral pose when the user rotates the device,
        // otherwise a portrait→landscape flip would dump the camera into
        // a maxed-out tilt until they physically returned to baseline.
        if (screen.orientation && typeof screen.orientation.addEventListener === 'function') {
            screen.orientation.addEventListener('change', recalibrate);
        } else {
            window.addEventListener('orientationchange', recalibrate);
        }
    }

    function setupCameraInputControl() {
        if (isTouchDevice()) {
            setupGyroControl();
        } else {
            setupMouseControl();
        }
    }

    const _cameraLocal = new THREE.Vector3();
    function wrapShellAroundCamera(shell) {
        _cameraLocal.copy(camera.position);
        shell.points.updateMatrixWorld();
        shell.points.worldToLocal(_cameraLocal);
        const v = shell.vertices;
        const bx = shell.bounds.x;
        const by = shell.bounds.y;
        const bz = shell.bounds.z;
        const spanX = bx * 2;
        const spanY = by * 2;
        const spanZ = bz * 2;
        const cx = _cameraLocal.x;
        const cy = _cameraLocal.y;
        const cz = _cameraLocal.z;
        const jx = bx * 0.04;
        const jy = by * 0.04;
        const jz = bz * 0.04;

        for (let i = 0; i < v.length; i += 3) {
            let rx = v[i] - cx;
            let ry = v[i + 1] - cy;
            let rz = v[i + 2] - cz;

            if (rx > bx || rx < -bx) {
                rx = ((rx + bx) % spanX + spanX) % spanX - bx;
                v[i] = cx + rx;
                v[i + 1] += (Math.random() - 0.5) * jy;
                v[i + 2] += (Math.random() - 0.5) * jz;
            }
            if (ry > by || ry < -by) {
                ry = ((ry + by) % spanY + spanY) % spanY - by;
                v[i + 1] = cy + ry;
                v[i] += (Math.random() - 0.5) * jx;
                v[i + 2] += (Math.random() - 0.5) * jz;
            }
            if (rz > bz || rz < -bz) {
                rz = ((rz + bz) % spanZ + spanZ) % spanZ - bz;
                v[i + 2] = cz + rz;
                v[i] += (Math.random() - 0.5) * jx;
                v[i + 1] += (Math.random() - 0.5) * jy;
            }
        }
        shell.geometry.attributes.position.needsUpdate = true;
    }

    function advanceWarp() {
        const burstMultiplier = 1 + warpBurstIntensity * 40;
        const step = 20 * burstMultiplier;
        for (const shell of allShells) {
            const v = shell.vertices;
            const s = shell.speeds;
            for (let i = 0; i < v.length; i += 3) {
                v[i + 2] += s[i / 3] * step;
            }
        }
    }

    function updateShells() {
        advanceWarp();
        for (const shell of allShells) {
            wrapShellAroundCamera(shell);
        }
    }

    function applyShockwaveEffect() {
        if (shockwaveTime <= 0) return;
        _cameraLocal.copy(camera.position);
        mainShell.points.updateMatrixWorld();
        mainShell.points.worldToLocal(_cameraLocal);
        const v = mainShell.vertices;
        const cx = _cameraLocal.x, cy = _cameraLocal.y;
        for (let i = 0; i < v.length; i += 3) {
            const dx = v[i] - cx;
            const dy = v[i + 1] - cy;
            const distSq = dx * dx + dy * dy;
            if (distSq < 250000) {
                const dist = Math.sqrt(distSq);
                const wave = Math.sin(shockwaveTime * 10 + dist * 0.05) * 5;
                v[i] += wave;
                v[i + 1] += wave;
            }
        }
        shockwaveTime -= 0.02;
        mainShell.geometry.attributes.position.needsUpdate = true;
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

        const burstBoost = warpBurstIntensity * 3;

        for (const shell of fieldShells) {
            const amp = shell.profile.twinkleAmp;
            shell.material.size = shell.profile.baseSize + twinkleIntensity * amp + burstBoost * (amp / 2.4);
            shell.material.opacity = Math.max(
                0.55 * shell.profile.bright,
                Math.min(1.0, 0.85 * shell.profile.bright + twinkleIntensity * 0.18)
            );
        }

        const heroPulse = Math.sin(time * 0.9) * 0.5 + 0.5;
        const heroFlicker = Math.sin(time * 3.1 + 1.7) * 0.15;
        heroShell.material.size = 11 + heroPulse * 4 + heroFlicker + burstBoost * 1.5;
        heroShell.material.opacity = Math.max(0.7, Math.min(1.0, 0.82 + heroPulse * 0.18));
    }

    function applyHyperModeStarGlow() {
        const targetGlow = isHyperModeEnabled() ? 1 : 0;
        hyperGlowLevel += (targetGlow - hyperGlowLevel) * 0.12;

        for (const shell of fieldShells) {
            const cap = shell.profile.baseSize + 5 + shell.profile.hyperBoost * 1.4;
            shell.material.size = Math.min(cap, shell.material.size + hyperGlowLevel * shell.profile.hyperBoost);
            shell.material.opacity = Math.min(1.0, shell.material.opacity + hyperGlowLevel * 0.1);
        }
        heroShell.material.size = Math.min(22, heroShell.material.size + hyperGlowLevel * heroShell.profile.hyperBoost);
        heroShell.material.opacity = Math.min(1.0, heroShell.material.opacity + hyperGlowLevel * 0.1);

        const targetIntensity = 1 + hyperGlowLevel * 0.85;
        const targetDistance = 1000 + hyperGlowLevel * 280;
        pointLight.intensity += (targetIntensity - pointLight.intensity) * 0.12;
        pointLight.distance += (targetDistance - pointLight.distance) * 0.12;
    }

    function animateStars() {
        const time = performance.now() * 0.001;

        const driftX = Math.sin(time * 0.3) * 0.001;
        const driftY = Math.cos(time * 0.25) * 0.001;

        nearShell.points.rotation.x += 0.00075 + driftX * 1.4;
        nearShell.points.rotation.y += 0.00105 + driftY * 1.4;

        mainShell.points.rotation.x += 0.0005 + driftX;
        mainShell.points.rotation.y += 0.0007 + driftY;

        farShell.points.rotation.x += 0.00018 + driftX * 0.35;
        farShell.points.rotation.y += 0.00026 + driftY * 0.35;

        heroShell.points.rotation.x += 0.00032 + driftX * 0.7;
        heroShell.points.rotation.y += 0.00045 + driftY * 0.7;
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
        const posAttr = mainShell.geometry.getAttribute('position');
        if (!posAttr || !posAttr.array || posAttr.array.length < 3) {
            const angle = Math.random() * Math.PI * 2;
            return { x: Math.cos(angle), y: Math.sin(angle), confidence: 0 };
        }

        camera.updateMatrixWorld(true);
        mainShell.points.updateMatrixWorld(true);

        const positions = posAttr.array;
        const bins = new Float32Array(densityGridCols * densityGridRows);
        const starTotal = positions.length / 3;
        const maxSamples = 1600;
        const stride = Math.max(1, Math.ceil(starTotal / maxSamples));
        let visibleCount = 0;

        for (let starIdx = 0; starIdx < starTotal; starIdx += stride) {
            const i = starIdx * 3;
            densityProbe
                .set(positions[i], positions[i + 1], positions[i + 2])
                .applyMatrix4(mainShell.points.matrixWorld)
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

        if (visibleCount < 25) {
            return { x: randomDir.x, y: randomDir.y, confidence: 0 };
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
            return { x: randomDir.x, y: randomDir.y, confidence: 0 };
        }

        tx /= tLen;
        ty /= tLen;

        const randomWeight = THREE.MathUtils.clamp(0.84 - confidence * 0.76, 0.08, 0.84);
        let bx = tx * (1 - randomWeight) + randomDir.x * randomWeight;
        let by = ty * (1 - randomWeight) + randomDir.y * randomWeight;

        const blendedLen = Math.hypot(bx, by) || 1;
        bx /= blendedLen;
        by /= blendedLen;

        return { x: bx, y: by, confidence };
    }

let orbitalHandedness = Math.random() < 0.5 ? 1 : -1;

function switchCameraPosition() {
    if (starfieldFrozen) return;

    const hyper = isHyperModeEnabled();
    const profile = hyper
        ? {
            travelBase: 430,
            travelBoost: 720,
            scatterX: 480,
            scatterY: 360,
            zBase: 960,
            zJitter: 700,
            zBoost: 260,
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
            returnOverlap: "-=0.82",
            orbitalBiasDeg: 18
        }
        : {
            travelBase: 370,
            travelBoost: 610,
            scatterX: 410,
            scatterY: 310,
            zBase: 940,
            zJitter: 580,
            zBoost: 190,
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
            returnOverlap: "-=1.02",
            orbitalBiasDeg: 14
        };

    const smartDir = getDensityAwareVelocityDirection();

    const biasRad = THREE.MathUtils.degToRad(profile.orbitalBiasDeg) * orbitalHandedness;
    const cosB = Math.cos(biasRad);
    const sinB = Math.sin(biasRad);
    const dirX = smartDir.x * cosB - smartDir.y * sinB;
    const dirY = smartDir.x * sinB + smartDir.y * cosB;
    if (Math.random() < 0.22) orbitalHandedness = -orbitalHandedness;

    const directionalTravel = profile.travelBase + smartDir.confidence * profile.travelBoost;
    const randomScatterX = (Math.random() - 0.5) * profile.scatterX;
    const randomScatterY = (Math.random() - 0.5) * profile.scatterY;

    // No clamps — the toroidal field follows the camera, so any target is valid.
    const targetX = camera.position.x + dirX * directionalTravel + randomScatterX;
    const targetY = camera.position.y + dirY * directionalTravel + randomScatterY;
    const targetZ = profile.zBase + (Math.random() - 0.5) * profile.zJitter + smartDir.confidence * profile.zBoost;

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
        x: targetX,
        y: targetY,
        z: targetZ,
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
    tl.to(nearShell.points.rotation, { z: nearShell.points.rotation.z + rollZ * 1.15, duration: profile.starRollDuration, ease: profile.starRollEase }, 0);
    tl.to(mainShell.points.rotation, { z: mainShell.points.rotation.z + rollZ,        duration: profile.starRollDuration, ease: profile.starRollEase }, 0);
    tl.to(farShell.points.rotation,  { z: farShell.points.rotation.z  + rollZ * 0.55, duration: profile.starRollDuration, ease: profile.starRollEase }, 0);
    tl.to(heroShell.points.rotation, { z: heroShell.points.rotation.z + rollZ * 0.85, duration: profile.starRollDuration, ease: profile.starRollEase }, 0);

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
            applyMouseAcceleration();
            animateStars();
            updateShells();
            applyShockwaveEffect();
            applyTwinkleEffect();
            applyHyperModeStarGlow();
        }

        renderer.render(scene, camera);
        requestAnimationFrame(render);
    }

    setupCameraInputControl();
    if (!starfieldFrozen) {
        switchCameraPosition();
    }
    render();

    }

});
