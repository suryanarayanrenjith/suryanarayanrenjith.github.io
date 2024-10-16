import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.142.0/three.module.js';
document.addEventListener("DOMContentLoaded", () => {
    const text = document.querySelector('.animated-text');
    text.classList.add('animate');

    const footerText = document.getElementById('footer-text');
    const currentYear = new Date().getFullYear();

    footerText.textContent = `© ${currentYear} Suryanarayan Renjith. All rights reserved.`;

    function changeTextWithDelay(newText) {
        setTimeout(function() {
            footerText.style.opacity = '0';
            setTimeout(function() {
            footerText.textContent = newText;
            footerText.style.opacity = '1';
        }, 300);
        }, 100);
    }

    footerText.addEventListener('mouseover', function() {
    changeTextWithDelay('Music Credits: Suryanarayan Renjith');
    });

    footerText.addEventListener('mouseout', function() {
        changeTextWithDelay(`© ${currentYear} Suryanarayan Renjith. All rights reserved.`);
    });

    footerText.style.transition = 'opacity 0.3s ease';
const canvas = document.getElementById('animationCanvas');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

const pointLight = new THREE.PointLight(0xffffff, 1, 1000);
pointLight.position.set(0, 0, 500);
scene.add(pointLight);

const starCount = 1500;
const stars = new THREE.BufferGeometry();
const starVertices = new Float32Array(starCount * 3);

for (let i = 0; i < starCount * 3; i += 3) {
    starVertices[i] = (Math.random() - 0.5) * 2000;
    starVertices[i + 1] = (Math.random() - 0.5) * 2000;
    starVertices[i + 2] = (Math.random() - 0.5) * 2000;
}

stars.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));

const starMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 2,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
});

const starField = new THREE.Points(stars, starMaterial);
scene.add(starField);
camera.position.z = 500;

window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

let mouseX = 0, mouseY = 0;
let targetMouseX = 0, targetMouseY = 0;
let velocityX = 0, velocityY = 0;
const mouseRotationEasing = 0.1;
const acceleration = 0.002;

let alpha = 0, beta = 0, gamma = 0;
let targetRotationX = 0, targetRotationY = 0;
const rotationEasing = 0.05;

let glitchTime = 0;
const glitchDuration = 0.4;

function setupMouseControl() {
    window.addEventListener('mousemove', (event) => {
        targetMouseX = (event.clientX / window.innerWidth) * 2 - 1;
        targetMouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    });
}

function setupGyroscopeControl() {
    window.addEventListener('deviceorientation', (event) => {
        alpha = event.alpha;
        beta = event.beta;
        gamma = event.gamma;
    });
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
    const mouseTiltY = mouseX * maxTiltY;

    camera.rotation.x += (THREE.MathUtils.degToRad(mouseTiltX) - camera.rotation.x) * mouseRotationEasing;
    camera.rotation.y += (THREE.MathUtils.degToRad(mouseTiltY) - camera.rotation.y) * mouseRotationEasing;

    pointLight.position.x += (mouseX * 100 - pointLight.position.x) * 0.05;
    pointLight.position.y += (mouseY * 100 - pointLight.position.y) * 0.05;
}

function applyGyroscopeControl() {
    const maxTiltX = 15;
    const maxTiltY = 15;

    targetRotationX = THREE.MathUtils.degToRad(beta / maxTiltX * Math.PI / 2);
    targetRotationY = THREE.MathUtils.degToRad(gamma / maxTiltY * Math.PI / 2);

    camera.rotation.x += (targetRotationX - camera.rotation.x) * rotationEasing;
    camera.rotation.y += (targetRotationY - camera.rotation.y) * rotationEasing;
}

function applyCentralGlitch() {
    const time = performance.now() * 0.0001;

    for (let i = 0; i < starVertices.length; i += 3) {
        const distanceToCenter = Math.sqrt(starVertices[i] ** 2 + starVertices[i + 1] ** 2);
        const pulse = Math.sin(time * 10 + distanceToCenter * 0.02) * 0.5;

        starVertices[i] += pulse;
        starVertices[i + 1] += pulse;

        if (Math.random() > 0.999) {
            starVertices[i + 2] += (Math.random() - 0.5) * 50;
        }
    }

    stars.attributes.position.needsUpdate = true;
}

function glitchExplosion() {
    const time = performance.now() * 0.0001;

    for (let i = 0; i < starVertices.length; i += 3) {
        const distToCenter = Math.sqrt(starVertices[i] ** 2 + starVertices[i + 1] ** 2);

        if (distToCenter < 200) { 
            const glitchIntensity = Math.sin(time * 10 + distToCenter) * 2.5;
            starVertices[i] += glitchIntensity;
            starVertices[i + 1] += glitchIntensity;
        }
    }
}

function cameraPulse() {
    const pulse = Math.sin(performance.now() * 0.001) * 5;
    camera.position.z = 500 + pulse;
}

function createGlitchEffect() {
    if (Math.random() > 0.995) { 
        glitchTime = glitchDuration;
    }

    if (glitchTime > 0) {
        glitchExplosion();
        glitchTime -= 0.02;
    }
}

function animateStars() {
    starField.rotation.x += 0.001;
    starField.rotation.y += 0.001;
}

function render() {
    applyCentralGlitch();
    createGlitchEffect();    
    applyMouseAcceleration(); 
    applyGyroscopeControl(); 
    animateStars();          
    cameraPulse();       

    renderer.render(scene, camera);
    requestAnimationFrame(render);
}

setupMouseControl();
setupGyroscopeControl();
render();
    
});
