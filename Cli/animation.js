let scene, camera, renderer;
let gridFloor, gridCeiling;
let dataStreams, dataStreamMeta;
let nodes = [], nodeConnections, nodePairs = [];
let ambientDust;
let scanPlane;
let animationId;
let isWebGLSupported = false;

let time = 0;
let mouseX = 0, mouseY = 0;
let targetCameraX = 0, targetCameraY = 0;

let theme;

function getTheme() {
    const isLight = document.body.classList.contains('light-theme');
    return {
        isLight: isLight,
        primary: isLight ? 0x1a1a1a : 0xffffff,
        accent:  isLight ? 0x3a6ea5 : 0x9be7ff,
        fog:     isLight ? 0xf5f5f5 : 0x05060a
    };
}

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
    theme = getTheme();

    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(theme.fog, 220, 720);

    camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(0, 24, 230);
    camera.lookAt(0, -10, 0);

    renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance'
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    createGridFloor();
    createDataStreams();
    createNodes();
    createAmbientDust();
    createScanPlane();

    document.addEventListener('mousemove', onMouseMove, false);
    window.addEventListener('resize', onWindowResize);

    animate();
}

/* ======== GRID — receding wireframe floor + faint ceiling ======== */
function createGridFloor() {
    const size = 1400;
    const divisions = 70;

    gridFloor = new THREE.GridHelper(size, divisions, theme.primary, theme.primary);
    gridFloor.material.transparent = true;
    gridFloor.material.opacity = theme.isLight ? 0.28 : 0.22;
    gridFloor.material.depthWrite = false;
    gridFloor.position.y = -100;
    scene.add(gridFloor);

    gridCeiling = new THREE.GridHelper(size, divisions, theme.primary, theme.primary);
    gridCeiling.material.transparent = true;
    gridCeiling.material.opacity = theme.isLight ? 0.1 : 0.08;
    gridCeiling.material.depthWrite = false;
    gridCeiling.position.y = 220;
    scene.add(gridCeiling);
}

/* ======== DATA RAIN — vertical streaming line segments ======== */
function createDataStreams() {
    const columns = 42;
    const dropsPerColumn = 16;
    const totalSegments = columns * dropsPerColumn;

    const positions = new Float32Array(totalSegments * 6);
    const colors = new Float32Array(totalSegments * 6);
    dataStreamMeta = [];

    for (let c = 0; c < columns; c++) {
        dataStreamMeta.push({
            x: (Math.random() - 0.5) * 760,
            z: -260 + Math.random() * 420,
            headY: 140 + Math.random() * 220,
            speed: 0.18 + Math.random() * 0.55,
            jitter: Math.random() * Math.PI * 2
        });
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: theme.isLight ? 0.6 : 0.9,
        blending: theme.isLight ? THREE.NormalBlending : THREE.AdditiveBlending,
        depthWrite: false
    });

    dataStreams = new THREE.LineSegments(geo, mat);
    dataStreams.userData = { columns: columns, dropsPerColumn: dropsPerColumn };
    scene.add(dataStreams);
}

function updateDataStreams() {
    if (!dataStreams) return;
    const positions = dataStreams.geometry.attributes.position.array;
    const colors = dataStreams.geometry.attributes.color.array;
    const { columns, dropsPerColumn } = dataStreams.userData;

    const segLen = 4.2;
    const gap = 0.7;
    const r = ((theme.primary >> 16) & 0xff) / 255;
    const g = ((theme.primary >> 8) & 0xff) / 255;
    const b = (theme.primary & 0xff) / 255;
    const ar = ((theme.accent >> 16) & 0xff) / 255;
    const ag = ((theme.accent >> 8) & 0xff) / 255;
    const ab = (theme.accent & 0xff) / 255;

    let off = 0;
    for (let c = 0; c < columns; c++) {
        const m = dataStreamMeta[c];
        m.headY -= m.speed;
        const totalReach = dropsPerColumn * segLen;
        if (m.headY < -160 - totalReach) {
            m.headY = 160 + Math.random() * 220;
            m.x = (Math.random() - 0.5) * 760;
            m.z = -260 + Math.random() * 420;
            m.speed = 0.18 + Math.random() * 0.55;
            m.jitter = Math.random() * Math.PI * 2;
        }

        for (let d = 0; d < dropsPerColumn; d++) {
            const top = m.headY - d * segLen;
            const bot = top - segLen + gap;

            positions[off]     = m.x; positions[off + 1] = top; positions[off + 2] = m.z;
            positions[off + 3] = m.x; positions[off + 4] = bot; positions[off + 5] = m.z;

            const trail = 1 - d / dropsPerColumn;
            const headBoost = d === 0 ? 1.0 : 0.0;
            const baseBright = Math.pow(trail, 1.6);

            const useAccent = headBoost && !theme.isLight;
            const colR = useAccent ? ar : r;
            const colG = useAccent ? ag : g;
            const colB = useAccent ? ab : b;

            colors[off]     = colR * (baseBright + headBoost * 0.4);
            colors[off + 1] = colG * (baseBright + headBoost * 0.4);
            colors[off + 2] = colB * (baseBright + headBoost * 0.4);
            colors[off + 3] = colR * baseBright * 0.55;
            colors[off + 4] = colG * baseBright * 0.55;
            colors[off + 5] = colB * baseBright * 0.55;

            off += 6;
        }
    }

    dataStreams.geometry.attributes.position.needsUpdate = true;
    dataStreams.geometry.attributes.color.needsUpdate = true;
}

/* ======== NODES — wireframe shapes + connecting lines ======== */
function createNodes() {
    const count = 14;
    const geometries = [
        new THREE.OctahedronGeometry(2.2),
        new THREE.BoxGeometry(2.6, 2.6, 2.6),
        new THREE.TetrahedronGeometry(2.8)
    ];

    nodes = [];
    for (let i = 0; i < count; i++) {
        const mat = new THREE.MeshBasicMaterial({
            color: theme.primary,
            transparent: true,
            opacity: theme.isLight ? 0.55 : 0.7,
            wireframe: true
        });
        const node = new THREE.Mesh(geometries[i % geometries.length], mat);
        const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
        const radius = 90 + Math.sin(i * 0.7) * 36;
        node.position.set(
            Math.cos(angle) * radius,
            (Math.sin(i * 0.6) - 0.15) * 70,
            Math.sin(angle) * radius * 0.6 - 30
        );
        node.userData = {
            phase: Math.random() * Math.PI * 2,
            speed: 0.2 + Math.random() * 0.4,
            rotSpeed: 0.005 + Math.random() * 0.013,
            origin: node.position.clone()
        };
        nodes.push(node);
        scene.add(node);
    }

    nodePairs = [];
    const positions = [];
    for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
            const d = nodes[i].position.distanceTo(nodes[j].position);
            if (d < 130 && Math.random() > 0.45) {
                nodePairs.push([i, j]);
                positions.push(
                    nodes[i].position.x, nodes[i].position.y, nodes[i].position.z,
                    nodes[j].position.x, nodes[j].position.y, nodes[j].position.z
                );
            }
        }
    }
    if (positions.length) {
        const cg = new THREE.BufferGeometry();
        cg.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        const cm = new THREE.LineBasicMaterial({
            color: theme.primary,
            transparent: true,
            opacity: theme.isLight ? 0.16 : 0.2,
            blending: theme.isLight ? THREE.NormalBlending : THREE.AdditiveBlending,
            depthWrite: false
        });
        nodeConnections = new THREE.LineSegments(cg, cm);
        scene.add(nodeConnections);
    }
}

function updateNodes() {
    for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const p = n.userData.phase + time * n.userData.speed;
        n.position.x = n.userData.origin.x + Math.sin(p * 0.6) * 5;
        n.position.y = n.userData.origin.y + Math.cos(p) * 3.4;
        n.position.z = n.userData.origin.z + Math.sin(p * 0.4) * 3.2;
        n.rotation.x += n.userData.rotSpeed;
        n.rotation.y += n.userData.rotSpeed * 0.7;
        n.rotation.z += n.userData.rotSpeed * 0.3;
        const s = 0.85 + Math.sin(p * 0.8) * 0.18;
        n.scale.setScalar(s);
        n.material.opacity = (theme.isLight ? 0.4 : 0.55) + Math.sin(p) * 0.18;
    }

    if (nodeConnections && nodePairs.length) {
        const positions = nodeConnections.geometry.attributes.position.array;
        let idx = 0;
        for (let i = 0; i < nodePairs.length; i++) {
            const a = nodes[nodePairs[i][0]];
            const b = nodes[nodePairs[i][1]];
            positions[idx++] = a.position.x; positions[idx++] = a.position.y; positions[idx++] = a.position.z;
            positions[idx++] = b.position.x; positions[idx++] = b.position.y; positions[idx++] = b.position.z;
        }
        nodeConnections.geometry.attributes.position.needsUpdate = true;
        nodeConnections.material.opacity = (theme.isLight ? 0.12 : 0.16) + Math.sin(time * 0.8) * 0.06;
    }
}

/* ======== AMBIENT DUST — slow drifting points ======== */
function createAmbientDust() {
    const count = 90;
    const positions = new Float32Array(count * 3);
    const drift = new Float32Array(count * 3);
    const phases = new Float32Array(count);

    for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        positions[i3]     = (Math.random() - 0.5) * 700;
        positions[i3 + 1] = (Math.random() - 0.5) * 360;
        positions[i3 + 2] = (Math.random() - 0.5) * 380;
        drift[i3]     = (Math.random() - 0.5) * 0.04;
        drift[i3 + 1] = (Math.random() - 0.5) * 0.04;
        drift[i3 + 2] = (Math.random() - 0.5) * 0.02;
        phases[i] = Math.random() * Math.PI * 2;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('drift',    new THREE.BufferAttribute(drift, 3));
    geo.setAttribute('phase',    new THREE.BufferAttribute(phases, 1));

    const mat = new THREE.PointsMaterial({
        size: 1.6,
        color: theme.primary,
        transparent: true,
        opacity: theme.isLight ? 0.55 : 0.5,
        blending: theme.isLight ? THREE.NormalBlending : THREE.AdditiveBlending,
        depthWrite: false
    });

    ambientDust = new THREE.Points(geo, mat);
    scene.add(ambientDust);
}

function updateAmbientDust() {
    if (!ambientDust) return;
    const positions = ambientDust.geometry.attributes.position.array;
    const drift = ambientDust.geometry.attributes.drift.array;
    const phases = ambientDust.geometry.attributes.phase.array;

    for (let i = 0; i < positions.length; i += 3) {
        const idx = i / 3;
        positions[i]     += drift[i];
        positions[i + 1] += drift[i + 1];
        positions[i + 2] += drift[i + 2];
        const phase = phases[idx] + time * 0.5;
        positions[i]     += Math.sin(phase) * 0.012;
        positions[i + 1] += Math.cos(phase * 0.8) * 0.012;

        if (positions[i] >  360) positions[i] = -360;
        if (positions[i] < -360) positions[i] =  360;
        if (positions[i + 1] >  180) positions[i + 1] = -180;
        if (positions[i + 1] < -180) positions[i + 1] =  180;
        if (positions[i + 2] >  200) positions[i + 2] = -200;
        if (positions[i + 2] < -200) positions[i + 2] =  200;
    }

    ambientDust.geometry.attributes.position.needsUpdate = true;
    ambientDust.material.size    = 1.4 + Math.sin(time * 0.9) * 0.3;
    ambientDust.material.opacity = (theme.isLight ? 0.45 : 0.4) + Math.sin(time * 0.7) * 0.12;
}

/* ======== SCAN PLANE — horizontal CRT-style sweep ======== */
function createScanPlane() {
    const geo = new THREE.PlaneGeometry(1400, 8);
    const mat = new THREE.MeshBasicMaterial({
        color: theme.primary,
        transparent: true,
        opacity: theme.isLight ? 0.05 : 0.08,
        side: THREE.DoubleSide,
        blending: theme.isLight ? THREE.NormalBlending : THREE.AdditiveBlending,
        depthWrite: false
    });
    scanPlane = new THREE.Mesh(geo, mat);
    scanPlane.rotation.x = Math.PI / 2;
    scanPlane.position.y = 0;
    scene.add(scanPlane);
}

function updateScanPlane() {
    if (!scanPlane) return;
    const range = 240;
    const t = (time * 14) % (range * 2);
    scanPlane.position.y = -range + t;
    scanPlane.material.opacity = (theme.isLight ? 0.04 : 0.07) + Math.sin(time * 5) * 0.03;
}

/* ======== INTERACTION + LOOP ======== */
function onMouseMove(event) {
    mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    targetCameraX = mouseX * 14;
    targetCameraY = mouseY * 9;
}

function animate() {
    animationId = requestAnimationFrame(animate);
    time += 0.005;

    updateDataStreams();
    updateNodes();
    updateAmbientDust();
    updateScanPlane();

    camera.position.x += (targetCameraX - camera.position.x) * 0.025;
    camera.position.y += (24 + targetCameraY - camera.position.y) * 0.025;
    camera.position.x += Math.sin(time * 0.3) * 0.4;
    camera.position.y += Math.cos(time * 0.2) * 0.25;
    camera.lookAt(0, -10, 0);

    if (gridFloor) gridFloor.material.opacity = (theme.isLight ? 0.24 : 0.18) + Math.sin(time * 0.6) * 0.04;
    if (gridCeiling) gridCeiling.material.opacity = (theme.isLight ? 0.08 : 0.07) + Math.sin(time * 0.6 + 1.5) * 0.02;

    renderer.render(scene, camera);
}

function onWindowResize() {
    if (renderer && camera) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

/* ======== CSS FALLBACK — matrix-style character columns ======== */
function initCSSFallback() {
    const canvas = document.getElementById('background-canvas');
    if (canvas) canvas.style.display = 'none';

    const isLight = document.body.classList.contains('light-theme');
    const charColor    = isLight ? 'rgba(0, 0, 0, 0.65)'  : 'rgba(255, 255, 255, 0.85)';
    const charFade     = isLight ? 'rgba(0, 0, 0, 0.18)'  : 'rgba(255, 255, 255, 0.28)';
    const gridLine     = isLight ? 'rgba(0, 0, 0, 0.08)'  : 'rgba(255, 255, 255, 0.08)';
    const vignette     = isLight ? 'rgba(245,245,245,0.6)' : 'rgba(0,0,0,0.55)';

    const container = document.createElement('div');
    container.id = 'css-cli-bg';
    container.style.cssText = [
        'position:fixed', 'inset:0',
        'pointer-events:none', 'z-index:-1', 'overflow:hidden'
    ].join(';');
    document.body.appendChild(container);

    const grid = document.createElement('div');
    grid.style.cssText = [
        'position:absolute', 'inset:0',
        'background-image:linear-gradient(' + gridLine + ' 1px, transparent 1px),linear-gradient(90deg, ' + gridLine + ' 1px, transparent 1px)',
        'background-size:48px 48px',
        'mask-image:radial-gradient(ellipse at center, rgba(0,0,0,0.55) 0%, transparent 75%)',
        '-webkit-mask-image:radial-gradient(ellipse at center, rgba(0,0,0,0.55) 0%, transparent 75%)'
    ].join(';');
    container.appendChild(grid);

    const rain = document.createElement('div');
    rain.style.cssText = 'position:absolute;inset:0';
    container.appendChild(rain);

    const charset = '01<>/[]{}()$#=*+~|';
    const columnCount = Math.max(14, Math.floor(window.innerWidth / 28));
    for (let i = 0; i < columnCount; i++) {
        const col = document.createElement('div');
        const dur = 6 + Math.random() * 9;
        const delay = Math.random() * 8;
        col.style.cssText = [
            'position:absolute',
            'top:-30%', 'left:' + ((i / columnCount) * 100) + '%',
            'width:18px',
            'font-family:JetBrains Mono, monospace',
            'font-size:13px', 'line-height:1.35',
            'color:' + charColor,
            'text-shadow:0 0 6px ' + charFade,
            'animation:cliRain ' + dur.toFixed(2) + 's linear infinite',
            'animation-delay:-' + delay.toFixed(2) + 's',
            'opacity:' + (0.4 + Math.random() * 0.5)
        ].join(';');
        let txt = '';
        for (let r = 0; r < 22; r++) txt += charset[(Math.random() * charset.length) | 0] + '\n';
        col.textContent = txt;
        rain.appendChild(col);
    }

    const vign = document.createElement('div');
    vign.style.cssText = [
        'position:absolute', 'inset:0',
        'background:radial-gradient(ellipse at center, transparent 35%, ' + vignette + ' 100%)'
    ].join(';');
    container.appendChild(vign);

    const style = document.createElement('style');
    style.textContent = '@keyframes cliRain{from{transform:translateY(0)}to{transform:translateY(160vh)}}';
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
    if (animationId) cancelAnimationFrame(animationId);
    if (renderer) {
        renderer.dispose();
        if (renderer.forceContextLoss) renderer.forceContextLoss();
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
