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

    window.animateContentIn = function() {
        const content = document.getElementById('content');
        if (!content) return;
        const hyper = isHyperModeEnabled();

        const headings = content.querySelectorAll('h1, h2, h3, .animated-text');
        const paragraphs = content.querySelectorAll('p, .tagline');
        const buttons = content.querySelectorAll('.center-button, button, a[class]:not(.link-card)');
        const listItems = content.querySelectorAll('li:not(.link-card)');
        const linkCards = content.querySelectorAll('.link-card');
        const visuals = content.querySelectorAll('img, svg');
        const dividers = content.querySelectorAll('hr, .divider');

        const allEls = [headings, paragraphs, buttons, listItems, linkCards, visuals, dividers];
        allEls.forEach(group => {
            if (group.length) gsap.set(group, { opacity: 0 });
        });

        const tl = gsap.timeline({ delay: hyper ? 0 : 0.05 });

        if (headings.length) {
            tl.fromTo(headings,
                {
                    opacity: 0,
                    y: hyper ? 82 : 40,
                    x: hyper ? (index => (index % 2 === 0 ? -18 : 18)) : 0,
                    scale: hyper ? 0.72 : 1,
                    clipPath: hyper ? 'inset(0 0 120% 0)' : 'inset(0 0 100% 0)',
                    filter: hyper ? 'blur(12px)' : 'blur(0px)'
                },
                {
                    opacity: 1,
                    y: 0,
                    x: 0,
                    scale: 1,
                    clipPath: 'inset(0 0 0% 0)',
                    filter: 'blur(0px)',
                    duration: hyper ? 0.28 : 0.8,
                    ease: hyper ? 'steps(3)' : 'power3.out',
                    stagger: hyper ? 0.045 : 0.12
                },
                0
            );
            if (hyper) {
                tl.to(headings, {
                    x: 'random(-10,10)',
                    y: 'random(-5,5)',
                    duration: 0.055,
                    ease: 'steps(2)',
                    stagger: 0.02,
                    yoyo: true,
                    repeat: 2
                }, 0.08);
            }
        }
        if (paragraphs.length) {
            tl.fromTo(paragraphs,
                { opacity: 0, y: hyper ? 48 : 25, filter: hyper ? 'blur(8px)' : 'blur(0px)' },
                {
                    opacity: 1,
                    y: 0,
                    filter: 'blur(0px)',
                    duration: hyper ? 0.25 : 0.6,
                    ease: hyper ? 'steps(2)' : 'power2.out',
                    stagger: hyper ? 0.035 : 0.08
                },
                0.12
            );
            if (hyper) {
                tl.to(paragraphs, {
                    x: 'random(-6,6)',
                    duration: 0.05,
                    ease: 'steps(2)',
                    yoyo: true,
                    repeat: 1,
                    stagger: 0.02
                }, 0.14);
            }
        }
        if (buttons.length) {
            tl.fromTo(buttons,
                { opacity: 0, y: hyper ? 34 : 20, scale: hyper ? 0.84 : 0.92 },
                {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    duration: hyper ? 0.24 : 0.6,
                    ease: hyper ? 'steps(2)' : 'back.out(1.4)',
                    stagger: hyper ? 0.05 : 0.1
                },
                0.2
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
            const dirMult = (direction === 'down' || direction === 'right') ? 1 : -1;

            gsap.to(content, {
                opacity: 0,
                scale: hyper ? 0.7 : 0.92,
                y: isVertical ? dirMult * (hyper ? 180 : 60) : 0,
                x: !isVertical ? dirMult * (hyper ? 220 : 80) : 0,
                rotationY: !isVertical ? dirMult * (hyper ? -14 : -4) : 0,
                rotationX: isVertical ? dirMult * (hyper ? 10 : 3) : 0,
                filter: hyper ? 'blur(22px)' : 'blur(8px)',
                duration: hyper ? 0.34 : 0.45,
                ease: hyper ? 'steps(3)' : 'power3.in',
                onComplete: resolve
            });
        });
    };

    window.gsapTransitionIn = function(content, direction) {
        const hyper = isHyperModeEnabled();
        const isVertical = direction === 'up' || direction === 'down';
        const dirMult = (direction === 'down' || direction === 'right') ? 1 : -1;

        window.animateContentIn();

        gsap.set(content, {
            opacity: 0,
            scale: hyper ? 0.68 : 0.88,
            y: isVertical ? dirMult * (hyper ? 176 : 80) : 0,
            x: !isVertical ? dirMult * (hyper ? 186 : 100) : 0,
            rotationY: !isVertical ? dirMult * (hyper ? 14 : 5) : 0,
            rotationX: isVertical ? dirMult * (hyper ? -10 : -4) : 0,
            filter: hyper ? 'blur(20px)' : 'blur(10px)'
        });

        gsap.to(content, {
            opacity: 1,
            scale: 1,
            y: 0,
            x: 0,
            rotationY: 0,
            rotationX: 0,
            filter: 'blur(0px)',
            duration: hyper ? 0.36 : 0.7,
            ease: hyper ? 'steps(3)' : 'power3.out',
            onComplete: () => {
                gsap.set(content, { clearProps: 'all' });
            }
        });
    };

    window.gsapFadeSwap = function(content, directionHint) {
        return new Promise(resolve => {
            const hyper = isHyperModeEnabled();
            gsap.to(content, {
                opacity: 0,
                scale: hyper ? 0.84 : 0.96,
                y: hyper ? -42 : -15,
                filter: hyper ? 'blur(12px)' : 'blur(4px)',
                duration: hyper ? 0.22 : 0.25,
                ease: hyper ? 'steps(2)' : 'power2.in',
                onComplete: resolve
            });
        });
    };

    window.gsapFadeIn = function(content) {
        const hyper = isHyperModeEnabled();
        window.animateContentIn();

        gsap.fromTo(content,
            {
                opacity: 0,
                scale: hyper ? 0.8 : 0.96,
                y: hyper ? 65 : 15,
                filter: hyper ? 'blur(14px)' : 'blur(4px)'
            },
            {
                opacity: 1,
                scale: 1,
                y: 0,
                filter: 'blur(0px)',
                duration: hyper ? 0.32 : 0.45,
                ease: hyper ? 'steps(3)' : 'power2.out',
                onComplete: () => {
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
    const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance'
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));

    let starfieldEnabled = !(window.__starfieldState && window.__starfieldState.enabled === false);
    let starfieldFrozen = !!(window.__starfieldFreezeState && window.__starfieldFreezeState.frozen === true);
    canvas.style.opacity = starfieldEnabled ? '1' : '0';

    window.addEventListener('starfieldToggle', (event) => {
        starfieldEnabled = !!(event.detail && event.detail.enabled);
        canvas.style.opacity = starfieldEnabled ? '1' : '0';
        if (!starfieldEnabled) {
            renderer.clear();
        }
    });

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

    const pointLight = new THREE.PointLight(0xffffff, 1, 1000);
    pointLight.position.set(0, 0, 500);
    scene.add(pointLight);

    const STAR_DENSITY = 0.0016;
    const MIN_STARS = 1700;
    const MAX_STARS = 5600;
    const FIELD_DEPTH = 2400;
    const FIELD_PADDING = 1.2;
    let starCount = 0;

    const stars = new THREE.BufferGeometry();
    let starVertices = new Float32Array(0);
    let starSpeeds = new Float32Array(0);
    let starTwinkles = new Float32Array(0);

    function getFieldBounds() {
        const halfDepth = FIELD_DEPTH * 0.5;
        const fovRad = THREE.MathUtils.degToRad(camera.fov);
        const halfHeight = Math.tan(fovRad * 0.5) * halfDepth * FIELD_PADDING;
        const halfWidth = halfHeight * camera.aspect * FIELD_PADDING;
        return { halfWidth, halfHeight, halfDepth };
    }

    function getDynamicStarCount() {
        const area = window.innerWidth * window.innerHeight;
        const motionBoost = isMotionFxEnabled() ? 1.12 : 1;
        return Math.min(MAX_STARS, Math.max(MIN_STARS, Math.floor(area * STAR_DENSITY * motionBoost)));
    }

    function respawnStar(index, bounds, forceBackPlane = false) {
        const i = index * 3;
        starVertices[i] = camera.position.x + (Math.random() * 2 - 1) * bounds.halfWidth;
        starVertices[i + 1] = camera.position.y + (Math.random() * 2 - 1) * bounds.halfHeight;
        starVertices[i + 2] = forceBackPlane
            ? camera.position.z - bounds.halfDepth - Math.random() * 80
            : camera.position.z + (Math.random() * 2 - 1) * bounds.halfDepth;

        starSpeeds[index] = 0.55 + Math.random() * 1.65;
        starTwinkles[index] = Math.random() * Math.PI * 2;
    }

    function rebuildStarfield() {
        starCount = getDynamicStarCount();
        starVertices = new Float32Array(starCount * 3);
        starSpeeds = new Float32Array(starCount);
        starTwinkles = new Float32Array(starCount);

        const bounds = getFieldBounds();
        for (let i = 0; i < starCount; i++) {
            respawnStar(i, bounds);
        }

        const positionAttr = new THREE.BufferAttribute(starVertices, 3);
        positionAttr.setUsage(THREE.DynamicDrawUsage);
        stars.setAttribute('position', positionAttr);
    }

    rebuildStarfield();

    const starMaterialWhite = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 1.8,
        transparent: true,
        opacity: 0.78,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true
    });

    const starFieldWhite = new THREE.Points(stars, starMaterialWhite);
    starFieldWhite.frustumCulled = false;
    scene.add(starFieldWhite);

    camera.position.z = 1000;

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
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        rebuildStarfield();
    });

    let mouseX = 0, mouseY = 0;
    let targetMouseX = 0, targetMouseY = 0;
    let velocityX = 0, velocityY = 0;
    const acceleration = 0.0028;

    let shockwaveTime = 0;
    let blackHoleEffect = false;

    let warpBurstIntensity = 0;
    const shockwaveScaleTarget = new THREE.Vector3(1, 1, 1);

    function triggerWarpBurst() {
        warpBurstIntensity = isMotionFxEnabled() ? 1.85 : 1.0;
        const decay = () => {
            warpBurstIntensity *= isMotionFxEnabled() ? 0.91 : 0.94;
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

    function applyWarpSpeed(frameScale, nowSeconds) {
        const bounds = getFieldBounds();
        const minX = camera.position.x - bounds.halfWidth;
        const maxX = camera.position.x + bounds.halfWidth;
        const minY = camera.position.y - bounds.halfHeight;
        const maxY = camera.position.y + bounds.halfHeight;
        const nearZ = camera.position.z + bounds.halfDepth;

        const burstMultiplier = 1 + warpBurstIntensity * (isMotionFxEnabled() ? 14 : 9);
        const zStepScale = (isMotionFxEnabled() ? 22 : 16) * frameScale;
        const sway = (isMotionFxEnabled() ? 0.2 : 0.12) * frameScale;

        for (let i = 0; i < starVertices.length; i += 3) {
            const starIndex = i / 3;
            starVertices[i + 2] += starSpeeds[starIndex] * zStepScale * burstMultiplier;
            starVertices[i] += Math.sin(nowSeconds * 0.7 + starTwinkles[starIndex]) * sway;
            starVertices[i + 1] += Math.cos(nowSeconds * 0.6 + starTwinkles[starIndex] * 0.75) * sway;

            if (
                starVertices[i + 2] > nearZ ||
                starVertices[i] < minX || starVertices[i] > maxX ||
                starVertices[i + 1] < minY || starVertices[i + 1] > maxY
            ) {
                respawnStar(starIndex, bounds, true);
            }
        }

        stars.attributes.position.needsUpdate = true;
    }

    function applyDynamicStarScaling() {
        const baseSize = isMotionFxEnabled() ? 2.1 : 1.8;
        const burstSize = warpBurstIntensity * (isMotionFxEnabled() ? 3.6 : 2.4);
        starMaterialWhite.size = baseSize + burstSize;
    }

    function applyShockwaveEffect() {
        if (shockwaveTime > 0) {
            const amplitude = isMotionFxEnabled() ? 0.045 : 0.028;
            const pulse = 1 + Math.sin(shockwaveTime * 14) * amplitude;
            shockwaveScaleTarget.set(pulse, pulse, 1);
            shockwaveTime -= isMotionFxEnabled() ? 0.03 : 0.022;
        } else {
            shockwaveScaleTarget.set(1, 1, 1);
        }

        starFieldWhite.scale.lerp(shockwaveScaleTarget, 0.2);
    }

    function applyBlackHoleEffect(frameScale) {
        if (!blackHoleEffect) return;

        const centerX = camera.position.x;
        const centerY = camera.position.y;
        const pullRadiusSq = 220000;
        const pullStrength = 0.0025 * frameScale;

        for (let i = 0; i < starVertices.length; i += 3) {
            const dx = starVertices[i] - centerX;
            const dy = starVertices[i + 1] - centerY;
            const distSq = dx * dx + dy * dy;
            if (distSq < pullRadiusSq) {
                const influence = 1 - distSq / pullRadiusSq;
                const pull = pullStrength * influence;
                starVertices[i] -= dx * pull;
                starVertices[i + 1] -= dy * pull;
            }
        }

        stars.attributes.position.needsUpdate = true;
    }

    function applyTwinkleEffect(nowSeconds) {
        const wave = Math.sin(nowSeconds * 2.1) * 0.5 + Math.cos(nowSeconds * 0.9 + 1.6) * 0.5;
        const baseOpacity = isMotionFxEnabled() ? 0.84 : 0.76;
        const burstGlow = warpBurstIntensity * (isMotionFxEnabled() ? 0.16 : 0.1);
        starMaterialWhite.opacity = THREE.MathUtils.clamp(baseOpacity + wave * 0.07 + burstGlow, 0.55, 0.98);
    }

    function animateStars(nowSeconds) {
        const driftX = Math.sin(nowSeconds * 0.3) * 0.001;
        const driftY = Math.cos(nowSeconds * 0.25) * 0.001;

        starFieldWhite.rotation.x += 0.00045 + driftX;
        starFieldWhite.rotation.y += 0.00065 + driftY;
        starFieldWhite.position.z = Math.sin(nowSeconds * 0.5) * 0.5;
    }

    function applyMouseAcceleration() {
        velocityX += (targetMouseX - mouseX) * acceleration;
        velocityY += (targetMouseY - mouseY) * acceleration;

        velocityX *= 0.9;
        velocityY *= 0.9;

        mouseX += velocityX;
        mouseY += velocityY;

        const targetTiltX = THREE.MathUtils.degToRad(mouseY * 8);
        const targetTiltY = THREE.MathUtils.degToRad(-mouseX * 8);
        camera.rotation.x += (targetTiltX - camera.rotation.x) * 0.015;
        camera.rotation.y += (targetTiltY - camera.rotation.y) * 0.015;

        pointLight.position.x += (mouseX * 95 - pointLight.position.x) * 0.08;
        pointLight.position.y += (mouseY * 95 - pointLight.position.y) * 0.08;
        pointLight.position.z = camera.position.z + 500;
    }

function switchCameraPosition() {
    if (starfieldFrozen) return;

    const motionFxBoost = isMotionFxEnabled() ? 1.85 : 1;
    const randomX = (Math.random() - 0.5) * 800 * motionFxBoost;
    const randomY = (Math.random() - 0.5) * 600 * motionFxBoost;
    const randomZ = Math.random() * (isMotionFxEnabled() ? 1050 : 800) + 200;

    const randomRotationX = (Math.random() - 0.5) * (Math.PI / 8) * motionFxBoost;
    const randomRotationY = (Math.random() - 0.5) * (Math.PI / 8) * motionFxBoost;

    const zoomInFOV = Math.random() * (isMotionFxEnabled() ? 24 : 15) + (isMotionFxEnabled() ? 46 : 55);
    const originalFOV = camera.fov;

    triggerWarpBurst();

    shockwaveTime = isMotionFxEnabled() ? 1.7 : 1.0;

    const tl = gsap.timeline();

    tl.to(camera, {
        fov: zoomInFOV,
        duration: isMotionFxEnabled() ? 0.4 : 0.6,
        ease: "power3.in",
        onUpdate: () => camera.updateProjectionMatrix()
    });

    tl.to(camera.position, {
        x: randomX,
        y: randomY,
        z: randomZ,
        duration: isMotionFxEnabled() ? 1.05 : 1.8,
        ease: "power3.inOut",
        onUpdate: () => {
            const micro = isMotionFxEnabled() ? 1.4 : 1;
            camera.position.x += Math.sin(performance.now() * 0.002) * 0.5 * micro;
            camera.position.y += Math.cos(performance.now() * 0.0015) * 0.3 * micro;
        }
    }, 0);

    tl.to(camera.rotation, {
        x: randomRotationX,
        y: randomRotationY,
        duration: isMotionFxEnabled() ? 1.05 : 1.8,
        ease: "power3.inOut",
        onUpdate: () => {
            camera.rotation.x += Math.sin(performance.now() * 0.001) * 0.002;
            camera.rotation.y += Math.cos(performance.now() * 0.001) * 0.002;
        }
    }, 0);

    tl.to(starFieldWhite.rotation, {
        z: starFieldWhite.rotation.z + (Math.random() - 0.5) * (isMotionFxEnabled() ? 0.75 : 0.3),
        duration: isMotionFxEnabled() ? 0.75 : 1.5,
        ease: "power2.inOut"
    }, 0);

    tl.to(camera, {
        fov: originalFOV,
        duration: isMotionFxEnabled() ? 0.55 : 1.2,
        ease: "elastic.out(1, 0.6)",
        onUpdate: () => camera.updateProjectionMatrix()
    }, isMotionFxEnabled() ? "-=0.4" : "-=1.0");
}

    window.addEventListener('sectionChanged', () => {
        if (starfieldEnabled && !starfieldFrozen) {
            switchCameraPosition();
            if (isMotionFxEnabled()) {
                setTimeout(() => {
                    if (starfieldEnabled && !starfieldFrozen) {
                        switchCameraPosition();
                    }
                }, 140);
            }
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

    let lastFrameTime = performance.now();
    function render(now = performance.now()) {
        const nowSeconds = now * 0.001;
        const frameScale = Math.min(2.5, (now - lastFrameTime) / 16.6667);
        lastFrameTime = now;

        if (!starfieldEnabled) {
            renderer.clear();
            requestAnimationFrame(render);
            return;
        }

        if (!starfieldFrozen) {
            applyWarpSpeed(frameScale, nowSeconds);
            applyMouseAcceleration();
            applyDynamicStarScaling();
            applyShockwaveEffect();
            applyBlackHoleEffect(frameScale);
            applyTwinkleEffect(nowSeconds);
            animateStars(nowSeconds);
            if (isMotionFxEnabled()) {
                const pulse = Math.sin(nowSeconds * 17);
                camera.position.x += pulse * 0.05;
                camera.position.y += Math.cos(nowSeconds * 15) * 0.03;
            }
        }

        renderer.render(scene, camera);
        requestAnimationFrame(render);
    }

    setupMouseControl();
    if (!starfieldFrozen) {
        switchCameraPosition();
    }
    render(lastFrameTime);

    }

});
