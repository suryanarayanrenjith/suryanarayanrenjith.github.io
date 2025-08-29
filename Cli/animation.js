let scene, camera, renderer, geometricElements, connections, waveGeometry;
let animationId;
let isWebGLSupported = false;

let time = 0;
let mouseX = 0, mouseY = 0;
let targetCameraX = 0, targetCameraY = 0;

let elements = [];
let elementConnections = [];

function checkWebGLSupport() {
    try {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        return !!(context && context.getExtension);
    } catch (e) {
        return false;
    }
}

function initThreeJS() {
    const canvas = document.getElementById('background-canvas');
    
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    
    renderer = new THREE.WebGLRenderer({ 
        canvas: canvas, 
        alpha: true, 
        antialias: true,
        powerPreference: "high-performance"
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0.0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    createGeometricElements();
    
    createWaveGeometry();
    
    createAmbientOrbs();
    
    camera.position.set(0, 0, 150);
    camera.lookAt(0, 0, 0);
    
    document.addEventListener('mousemove', onMouseMove, false);
    
    animate();
    
    window.addEventListener('resize', onWindowResize);
}

function createGeometricElements() {
    const elementCount = 30;
    const geometries = [
        new THREE.BoxGeometry(2, 2, 2),
        new THREE.OctahedronGeometry(1.5),
        new THREE.TetrahedronGeometry(2)
    ];
    
    elements = [];
    const elementMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.4,
        wireframe: true
    });
    
    for (let i = 0; i < elementCount; i++) {
        const geometry = geometries[i % geometries.length];
        const element = new THREE.Mesh(geometry, elementMaterial.clone());
        
        const angle = (i / elementCount) * Math.PI * 2;
        const radius = 80 + Math.sin(i * 0.3) * 30;
        const height = Math.sin(i * 0.7) * 40;
        
        element.position.x = radius * Math.cos(angle);
        element.position.y = height;
        element.position.z = radius * Math.sin(angle);
        
        element.userData.originalPosition = element.position.clone();
        element.userData.originalRotation = element.rotation.clone();
        element.userData.phase = Math.random() * Math.PI * 2;
        element.userData.speed = 0.3 + Math.random() * 0.4;
        element.userData.rotationSpeed = 0.01 + Math.random() * 0.02;
        
        elements.push(element);
        scene.add(element);
    }
    
    const connectionPositions = [];
    elementConnections = [];
    
    for (let i = 0; i < elements.length; i++) {
        const nextIndex = (i + 1) % elements.length;
        if (Math.random() > 0.6) {
            elementConnections.push({ from: i, to: nextIndex });
            
            connectionPositions.push(
                elements[i].position.x, elements[i].position.y, elements[i].position.z,
                elements[nextIndex].position.x, elements[nextIndex].position.y, elements[nextIndex].position.z
            );
        }
    }
    
    if (connectionPositions.length > 0) {
        const connectionGeometry = new THREE.BufferGeometry();
        connectionGeometry.setAttribute('position', new THREE.Float32BufferAttribute(connectionPositions, 3));
        
        const connectionMaterial = new THREE.LineBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.1,
            blending: THREE.AdditiveBlending
        });
        
        connections = new THREE.LineSegments(connectionGeometry, connectionMaterial);
        scene.add(connections);
    }
}

function createWaveGeometry() {
    const geometry = new THREE.PlaneGeometry(400, 250, 60, 40);
    const material = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.03,
        wireframe: true,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending
    });
    
    waveGeometry = new THREE.Mesh(geometry, material);
    waveGeometry.position.z = -120;
    waveGeometry.rotation.x = Math.PI * 0.2;
    
    const positions = geometry.attributes.position.array;
    waveGeometry.userData.originalPositions = new Float32Array(positions);
    
    scene.add(waveGeometry);
}

function createAmbientOrbs() {
    const orbCount = 60;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(orbCount * 3);
    const velocities = new Float32Array(orbCount * 3);
    const phases = new Float32Array(orbCount);
    
    for (let i = 0; i < orbCount; i++) {
        const i3 = i * 3;
        
        positions[i3] = (Math.random() - 0.5) * 400;
        positions[i3 + 1] = (Math.random() - 0.5) * 300;
        positions[i3 + 2] = (Math.random() - 0.5) * 200;
        
        velocities[i3] = (Math.random() - 0.5) * 0.05;
        velocities[i3 + 1] = (Math.random() - 0.5) * 0.05;
        velocities[i3 + 2] = (Math.random() - 0.5) * 0.02;
        
        phases[i] = Math.random() * Math.PI * 2;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    geometry.setAttribute('phase', new THREE.BufferAttribute(phases, 1));
    
    const material = new THREE.PointsMaterial({
        size: 2,
        color: 0xffffff,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
    });
    
    geometricElements = new THREE.Points(geometry, material);
    scene.add(geometricElements);
}

function onMouseMove(event) {
    mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    
    targetCameraX = mouseX * 10;
    targetCameraY = mouseY * 10;
}

function animate() {
    animationId = requestAnimationFrame(animate);
    time += 0.005;
    
    updateGeometricElements();
    
    updateWaveGeometry();
    
    updateAmbientOrbs();
    
    camera.position.x += (targetCameraX - camera.position.x) * 0.02;
    camera.position.y += (targetCameraY - camera.position.y) * 0.02;
    
    camera.position.x += Math.sin(time * 0.3) * 0.5;
    camera.position.y += Math.cos(time * 0.2) * 0.3;
    
    camera.lookAt(0, 0, 0);
    
    renderer.render(scene, camera);
}

function updateGeometricElements() {
    elements.forEach((element, index) => {
        const original = element.userData.originalPosition;
        const originalRotation = element.userData.originalRotation;
        const phase = element.userData.phase + time * element.userData.speed;
        
        const float = Math.sin(phase) * 5;
        const drift = Math.sin(phase * 0.3) * 3;
        
        element.position.x = original.x + Math.sin(phase * 0.5) * 8;
        element.position.y = original.y + float;
        element.position.z = original.z + drift;
        
        element.rotation.x = originalRotation.x + time * element.userData.rotationSpeed;
        element.rotation.y = originalRotation.y + time * element.userData.rotationSpeed * 0.7;
        element.rotation.z = originalRotation.z + time * element.userData.rotationSpeed * 0.3;
        
        const scale = 0.8 + Math.sin(phase * 0.8) * 0.2;
        element.scale.setScalar(scale);
        
        element.material.opacity = 0.2 + Math.sin(phase * 0.6) * 0.2;
    });
    
    if (connections) {
        const positions = connections.geometry.attributes.position.array;
        let posIndex = 0;
        
        elementConnections.forEach(connection => {
            const fromElement = elements[connection.from];
            const toElement = elements[connection.to];
            
            positions[posIndex++] = fromElement.position.x;
            positions[posIndex++] = fromElement.position.y;
            positions[posIndex++] = fromElement.position.z;
            
            positions[posIndex++] = toElement.position.x;
            positions[posIndex++] = toElement.position.y;
            positions[posIndex++] = toElement.position.z;
        });
        
        connections.geometry.attributes.position.needsUpdate = true;
        
        connections.material.opacity = 0.05 + Math.sin(time * 1.5) * 0.05;
    }
}

function updateWaveGeometry() {
    if (waveGeometry && waveGeometry.userData.originalPositions) {
        const positions = waveGeometry.geometry.attributes.position.array;
        const original = waveGeometry.userData.originalPositions;
        
        for (let i = 0; i < positions.length; i += 3) {
            const x = original[i];
            const y = original[i + 1];
            
            const wave1 = Math.sin(x * 0.01 + time) * 12;
            const wave2 = Math.cos(y * 0.015 + time * 0.8) * 8;
            const ripple = Math.sin(Math.sqrt(x*x + y*y) * 0.02 + time * 1.2) * 6;
            
            positions[i + 2] = original[i + 2] + wave1 + wave2 + ripple;
        }
        
        waveGeometry.geometry.attributes.position.needsUpdate = true;
        
        waveGeometry.rotation.z += 0.0005;
        waveGeometry.material.opacity = 0.02 + Math.sin(time * 0.7) * 0.01;
    }
}

function updateAmbientOrbs() {
    if (geometricElements) {
        const positions = geometricElements.geometry.attributes.position.array;
        const velocities = geometricElements.geometry.attributes.velocity.array;
        const phases = geometricElements.geometry.attributes.phase.array;
        
        for (let i = 0; i < positions.length; i += 3) {
            const index = i / 3;
            
            positions[i] += velocities[i];
            positions[i + 1] += velocities[i + 1];
            positions[i + 2] += velocities[i + 2];
            
            const phase = phases[index] + time * 0.5;
            positions[i] += Math.sin(phase) * 0.01;
            positions[i + 1] += Math.cos(phase * 0.8) * 0.01;
            
            if (positions[i] > 200) positions[i] = -200;
            if (positions[i] < -200) positions[i] = 200;
            if (positions[i + 1] > 150) positions[i + 1] = -150;
            if (positions[i + 1] < -150) positions[i + 1] = 150;
            if (positions[i + 2] > 100) positions[i + 2] = -100;
            if (positions[i + 2] < -100) positions[i + 2] = 100;
        }
        
        geometricElements.geometry.attributes.position.needsUpdate = true;
        
        geometricElements.material.size = 1.5 + Math.sin(time) * 0.3;
        geometricElements.material.opacity = 0.4 + Math.sin(time * 0.8) * 0.2;
    }
}

function onWindowResize() {
    if (renderer && camera) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

function initCSSFallback() {
    const canvas = document.getElementById('background-canvas');
    canvas.style.display = 'none';
    
    const container = document.createElement('div');
    container.id = 'css-geometric-animation';
    container.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: -1;
        overflow: hidden;
    `;
    
    document.body.appendChild(container);
    
    
    const elementCount = 15;
    for (let i = 0; i < elementCount; i++) {
        const element = document.createElement('div');
        const size = 6 + Math.random() * 8;
        element.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            background: rgba(255, 255, 255, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.5);
            left: ${20 + Math.random() * 60}%;
            top: ${20 + Math.random() * 60}%;
            animation: geometricFloat ${4 + Math.random() * 6}s ease-in-out infinite;
            animation-delay: ${Math.random() * 3}s;
        `;
        
        if (Math.random() > 0.6) {
            element.style.transform = 'rotate(45deg)';
        } else if (Math.random() > 0.3) {
            element.style.borderRadius = '0';
        } else {
            element.style.borderRadius = '50%';
        }
        
        container.appendChild(element);
    }
    
    const style = document.createElement('style');
    style.textContent = `
        @keyframes geometricFloat {
            0%, 100% {
                transform: translateY(0px) rotate(0deg) scale(1);
                opacity: 0.3;
            }
            33% {
                transform: translateY(-15px) rotate(120deg) scale(1.2);
                opacity: 0.7;
            }
            66% {
                transform: translateY(8px) rotate(240deg) scale(0.9);
                opacity: 0.5;
            }
        }
        
        #css-geometric-animation::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: 
                radial-gradient(circle at 25% 25%, rgba(255,255,255,0.015) 0%, transparent 60%),
                radial-gradient(circle at 75% 75%, rgba(255,255,255,0.015) 0%, transparent 60%);
            animation: geometricFlow 12s ease-in-out infinite;
        }
        
        @keyframes geometricFlow {
            0%, 100% { opacity: 0.4; transform: scale(1) rotate(0deg); }
            50% { opacity: 0.7; transform: scale(1.03) rotate(2deg); }
        }
    `;
    
    document.head.appendChild(style);
}

function initAnimation() {
    isWebGLSupported = checkWebGLSupport();
    
    if (isWebGLSupported) {
        try {
            initThreeJS();
        } catch (error) {
            initCSSFallback();
        }
    } else {
        initCSSFallback();
    }
}

function cleanupAnimation() {
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    if (renderer) {
        renderer.dispose();
    }
    document.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('resize', onWindowResize);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAnimation);
} else {
    initAnimation();
}

window.addEventListener('beforeunload', cleanupAnimation);
