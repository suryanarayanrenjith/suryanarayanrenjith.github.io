import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.168.0/three.module.js';
import { gsap } from 'https://cdn.jsdelivr.net/npm/gsap@3.10.4/index.js';

document.addEventListener("DOMContentLoaded", () => {
    const text = document.querySelector('.animated-text');
    text.classList.add('animate');

    const footerText = document.getElementById('footer-text');
    const currentYear = new Date().getFullYear();

    footerText.textContent = `© ${currentYear} Suryanarayan Renjith. All rights reserved.`;

    function changeTextWithGSAP(newText) {
        gsap.to(footerText, {
            duration: 0.3,
            opacity: 0,
            ease: "power2.out",
            onComplete: function() {
                footerText.textContent = newText;
                gsap.to(footerText, {
                    duration: 0.3,
                    opacity: 1,
                    ease: "power2.in"
                });
            }
        });
    }

    footerText.addEventListener('mouseover', function() {
        changeTextWithGSAP('Music Credits: Suryanarayan Renjith.');
    });

    footerText.addEventListener('mouseout', function() {
        changeTextWithGSAP(`© ${currentYear} Suryanarayan Renjith. All rights reserved.`);
    });

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

    const pointLight = new THREE.PointLight(0xffffff, 1, 1000);
    pointLight.position.set(0, 0, 500);
    scene.add(pointLight);
    
    const starDensity = 0.002;
    let starCount = Math.floor(window.innerWidth * window.innerHeight * starDensity);
    

    const stars = new THREE.BufferGeometry();
    let starVertices = new Float32Array(starCount * 3);
    let starSpeeds = new Float32Array(starCount);
    let starTwinkles = new Float32Array(starCount);
    
    function generateStars() {
        for (let i = 0; i < starCount * 3; i += 3) {
            starVertices[i] = (Math.random() - 0.5) * 2000;
            starVertices[i + 1] = (Math.random() - 0.5) * 2000;
            starVertices[i + 2] = (Math.random() - 0.5) * 2000;
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
    
    function setupMouseControl() {
        window.addEventListener('mousemove', (event) => {
            targetMouseX = (event.clientX / window.innerWidth) * 2 - 1;
            targetMouseY = -(event.clientY / window.innerHeight) * 2 + 1;
        });
    }

    function setupGyroscopeControl(camera) {
        if (window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientation', (event) => {
                const beta = event.beta;
                const gamma = event.gamma;
    
                const normalizedX = gamma / 90;
                const normalizedY = beta / 180;
    
                camera.rotation.x += (normalizedY - camera.rotation.x) * 0.05; 
                camera.rotation.y += (normalizedX - camera.rotation.y) * 0.05;
            });
        } else {
            console.log("DeviceOrientationEvent is not supported on this device.");
        }
    }
    
    function applyWarpSpeed() {
        for (let i = 0; i < starVertices.length; i += 3) {
            starVertices[i + 2] += starSpeeds[i / 3] * 20;
    
            if (starVertices[i + 2] > 1000) {
                starVertices[i + 2] = -1000;
            }
        }
        stars.attributes.position.needsUpdate = true;
    }
    
    function applyDynamicStarScaling() {
        const positions = stars.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
            const z = positions[i + 2];
            starMaterialWhite.size = Math.max(1, 10 / (z / 100 + 1));
        }
    }
    
    function applyShockwaveEffect() {
        if (shockwaveTime > 0) {
            for (let i = 0; i < starVertices.length; i += 3) {
                const dist = Math.sqrt(starVertices[i] ** 2 + starVertices[i + 1] ** 2);
                if (dist < 500) {
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
                const distance = Math.sqrt(starVertices[i] ** 2 + starVertices[i + 1] ** 2 + starVertices[i + 2] ** 2);
                if (distance < 300) {
                    const pull = (300 - distance) * 0.01;
                    starVertices[i] -= starVertices[i] * pull;
                    starVertices[i + 1] -= starVertices[i + 1] * pull;
                }
            }
            stars.attributes.position.needsUpdate = true;
        }
    }
    
    function applyTwinkleEffect() {
        const time = Date.now() * 0.001;

    
        for (let i = 0; i < starTwinkles.length; i++) {
            const sineWave = Math.sin(time * 5 + starTwinkles[i] * 20); 
            const cosineWave = Math.cos(time * 2.5 + starTwinkles[i] * 10);

            const randomFactor = Math.random() * 0.05;

            const twinkleIntensity = (sineWave + cosineWave + randomFactor) * 0.5 + 0.5;

            starMaterialWhite.opacity = 0.6 + twinkleIntensity * 0.4;
            starMaterialWhite.size = 1.5 + twinkleIntensity * 2;
        }
    }
    
    function animateStars() {
        const time = Date.now() * 0.001;
    
        const driftX = Math.sin(time * 0.3) * 0.001;
        const driftY = Math.cos(time * 0.25) * 0.001;
    
        starFieldWhite.rotation.x += 0.0005 + driftX;
        starFieldWhite.rotation.y += 0.0007 + driftY;
    
        starFieldWhite.position.z += Math.sin(time * 0.5) * 0.05;
    
        for (let i = 0; i < starFieldWhite.children.length; i++) {
            const star = starFieldWhite.children[i];
            const distanceFromCenter = star.position.length();
    
            const parallaxFactor = 1 / (distanceFromCenter + 1);
            star.rotation.x += parallaxFactor * 0.001;
            star.rotation.y += parallaxFactor * 0.001;
        }
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

    function switchCameraPosition() {
        const randomX = (Math.random() - 0.5) * 600;
        const randomY = (Math.random() - 0.5) * 600;
        const randomZ = Math.random() * 700 + 400;    
    
        const randomRotationX = (Math.random() - 0.5) * Math.PI / 6;  
        const randomRotationY = (Math.random() - 0.5) * Math.PI / 6;  
    
        const zoomInFOV = Math.random() * 20 + 60;
        const originalFOV = camera.fov;            
    
        const tl = gsap.timeline();
    
        tl.to(camera, {
            fov: zoomInFOV,
            duration: 1.5,
            ease: "power3.inOut",
            onUpdate: () => camera.updateProjectionMatrix()
        });
    
        tl.to(camera.position, {
            x: randomX,
            y: randomY,
            z: randomZ,
            duration: 2,
            ease: "power3.inOut"
        }, 0);
    
        tl.to(camera.rotation, {
            x: randomRotationX,
            y: randomRotationY,
            duration: 2,
            ease: "power3.inOut"
        }, 0);
    
        tl.to(camera.rotation, {
            z: (Math.random() - 0.5) * Math.PI / 10,
            duration: 0.8,
            ease: "elastic.out(1, 0.3)"
        }, "-=0.5");
    
        tl.to(camera, {
            fov: originalFOV,
            duration: 1.2,
            ease: "power2.out",
            onUpdate: () => camera.updateProjectionMatrix()
        }, "-=0.5");
    }
    
    document.querySelectorAll('.menu-bar ul li a').forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            switchCameraPosition();
        });
    });
    

window.addEventListener('wheel', (event) => {
    if (event.deltaY > 0) {
        switchToNextSection('down');
        switchCameraPosition();
    } else {
        switchToNextSection('up');
        switchCameraPosition();
    }
});

document.addEventListener('keydown', (event) => {
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

let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;

window.addEventListener('touchstart', (event) => {
    touchStartX = event.changedTouches[0].screenX;
    touchStartY = event.changedTouches[0].screenY;
});

window.addEventListener('touchend', (event) => {
    touchEndX = event.changedTouches[0].screenX;
    touchEndY = event.changedTouches[0].screenY;
    handleGesture();
});

function handleGesture() {
    const deltaX = touchStartX - touchEndX;
    const deltaY = touchStartY - touchEndY;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 50) {
            switchToNextSection('left');
            switchCameraPosition();
        } else if (deltaX < -50) {
            switchToNextSection('right');
            switchCameraPosition();
        }
    } else {
        if (deltaY > 50) {
            switchToNextSection('down');
            switchCameraPosition();
        } else if (deltaY < -50) {
            switchToNextSection('up');
            switchCameraPosition();
        }
    }
}

    function render() {
        applyWarpSpeed();
        applyMouseAcceleration();        
        applyDynamicStarScaling(); 
        applyShockwaveEffect();   
        applyBlackHoleEffect();   
        applyTwinkleEffect(); 
        animateStars();
    
        renderer.render(scene, camera);
        requestAnimationFrame(render);
    }

    setupMouseControl();
    setupGyroscopeControl(camera);
    switchCameraPosition();
    render();
    
    }
    
});
