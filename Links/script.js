document.addEventListener("DOMContentLoaded", () => {

    const footerText = document.getElementById('footer-text');
    const currentYear = new Date().getFullYear();
    
    footerText.textContent = `© ${currentYear} Suryanarayan Renjith. All rights reserved.`;
    
    function changeTextWithDelay(newText) {
        footerText.style.opacity = '0';
        setTimeout(() => {
            footerText.textContent = newText;
            footerText.style.opacity = '1';
        }, 300);
    }
    
    footerText.addEventListener('mouseover', () => {
        changeTextWithDelay('Music Credits: Suryanarayan Renjith');
    });
    
    footerText.addEventListener('mouseout', () => {
        changeTextWithDelay(`© ${currentYear} Suryanarayan Renjith. All rights reserved.`);
    });
    
    footerText.style.transition = 'opacity 0.3s ease';
    });
        const canvas = document.getElementById('3dCanvas');
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const gridSize = 200;
        let angleX = 0;
        let angleY = 0;
        let speedX = 0.01;
        let speedY = 0.02;

        function project3D(x, y, z) {
            const scale = 300 / (300 + z);
            const x2D = x * scale + canvas.width / 2;
            const y2D = y * scale + canvas.height / 2;
            return [x2D, y2D];
        }

        function drawGrid() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;

            const cosX = Math.cos(angleX);
            const sinX = Math.sin(angleX);
            const cosY = Math.cos(angleY);
            const sinY = Math.sin(angleY);

            const depth = 500;

            for (let x = -canvas.width / 2; x < canvas.width / 2; x += gridSize) {
                for (let y = -canvas.height / 2; y < canvas.height / 2; y += gridSize) {
                    let vertices = [
                        { x: x, y: y, z: 0 },
                        { x: x + gridSize, y: y, z: 0 },
                        { x: x + gridSize, y: y + gridSize, z: 0 },
                        { x: x, y: y + gridSize, z: 0 },
                        { x: x, y: y, z: depth },
                        { x: x + gridSize, y: y, z: depth },
                        { x: x + gridSize, y: y + gridSize, z: depth },
                        { x: x, y: y + gridSize, z: depth }
                    ];

                    for (let i = 0; i < vertices.length; i++) {
                        let v = vertices[i];
                        let x = v.x;
                        let y = v.y;
                        let z = v.z;

                        let xz = x * cosY - z * sinY;
                        z = x * sinY + z * cosY;
                        x = xz;

                        let yz = y * cosX - z * sinX;
                        z = y * sinX + z * cosX;
                        y = yz;

                        vertices[i] = { x, y, z };
                    }

                    const projected = vertices.map(v => project3D(v.x, v.y, v.z));

                    ctx.beginPath();
                    for (let i = 0; i < 4; i++) {
                        ctx.moveTo(projected[i][0], projected[i][1]);
                        ctx.lineTo(projected[(i + 1) % 4][0], projected[(i + 1) % 4][1]);

                        ctx.moveTo(projected[i + 4][0], projected[i + 4][1]);
                        ctx.lineTo(projected[(i + 1) % 4 + 4][0], projected[(i + 1) % 4 + 4][1]);

                        ctx.moveTo(projected[i][0], projected[i][1]);
                        ctx.lineTo(projected[i + 4][0], projected[i + 4][1]);
                    }
                    ctx.stroke();
                }
            }

            angleX += speedX;
            angleY += speedY;

            if (angleX > 2 * Math.PI) angleX -= 2 * Math.PI;
            if (angleY > 2 * Math.PI) angleY -= 2 * Math.PI;

            speedX += (Math.random() - 0.5) * 0.002;
            speedY += (Math.random() - 0.5) * 0.002;

            speedX = Math.max(0.005, Math.min(speedX, 0.05));
            speedY = Math.max(0.005, Math.min(speedY, 0.05));

            requestAnimationFrame(drawGrid);
        }

        drawGrid();

const profilePic = document.getElementById('profilePic');
const socialLinks = document.getElementById('socialLinks');
const tooltip = document.getElementById('tooltip');
const clickPrompt = document.getElementById('clickPrompt');
const linksContainer = document.querySelector('.profile-container');

const verifiedKey = 'verifiedUser';

function isBotOrCurl(userAgentString) {
    return /curl|bot|spider|crawler|wget|Mediapartners-Google/i.test(userAgentString);
}

function setBotFlag() {
    localStorage.setItem("isBot", "true");
}

function isBotDetected() {
    return localStorage.getItem("isBot") === "true";
}

function hideForBot() {
    const linksHeading = document.getElementById('links');
    const pfp = document.getElementById('profilePic');
    const socialLinks = document.getElementById('socialLinks');

    if (linksHeading) {
        linksHeading.style.display = 'none';
    }

    if (pfp) {
        pfp.style.display = 'none';
    }

    if (socialLinks) {
        socialLinks.style.display = 'none';
    }
}

if (localStorage.getItem(verifiedKey)) {
    console.log("User Verified.");
} else {
    if (isBotOrCurl(navigator.userAgent)) {
        setBotFlag();
        hideForBot();
        console.log("Bot Detected!");
    }

    window.onload = function() {
        if (isBotDetected()) {
            hideForBot();
            console.log("User Banned!");
        }
    };
}

profilePic.addEventListener('click', function() {
    if (!isBotDetected()) {
        if (socialLinks.style.display === 'flex') {
            socialLinks.style.display = 'none';
            document.querySelector('.profile-container').classList.add('show-tooltip');
        } else {
            socialLinks.style.display = 'flex';
            document.querySelector('.profile-container').classList.remove('show-tooltip');
        }
        clickPrompt.style.display = 'none';
        localStorage.setItem('promptHidden', 'true');
    }
});

if (localStorage.getItem('promptHidden') === 'true') {
    clickPrompt.style.display = 'none';
    }

profilePic.addEventListener('mouseenter', function() {
    if (socialLinks.style.display !== 'flex' && !isBotDetected()) {
        tooltip.style.display = 'block';
    }
});

profilePic.addEventListener('mouseleave', function() {
    tooltip.style.display = 'none';
});

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

canvas.addEventListener('dblclick', function() {
    const popup = document.createElement('div');
    popup.innerText = 'Secret Link Unlocked! Redirecting...';
    popup.style.position = 'fixed';
    popup.style.top = '8px';
    popup.style.left = '50%';
    popup.style.transform = 'translateX(-50%)';
    popup.style.backgroundColor = '#000';
    popup.style.color = '#fff';
    popup.style.padding = '10px';
    popup.style.borderRadius = '5px';
    popup.style.opacity = '0';
    popup.style.transition = 'opacity 0.5s';
    popup.style.maxWidth = '90%';
    popup.style.textAlign = 'center';
    document.body.appendChild(popup);

    popup.offsetHeight;

    popup.style.opacity = '1';

    setTimeout(function() {
        document.body.removeChild(popup);
        window.location.href = "/Matrix";
    }, 1000);
});
