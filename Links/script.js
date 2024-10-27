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
        const isBotKey = 'isBot';
    
        function isBotOrCurl(userAgentString) {
            return /curl|bot|spider|crawler|wget|Mediapartners-Google/i.test(userAgentString);
        }
    
        function setBotFlag() {
            localStorage.setItem(isBotKey, 'true');
        }
    
        function clearBotFlag() {
            localStorage.removeItem(isBotKey);
        }
    
        function isBotDetected() {
            return localStorage.getItem(isBotKey) === "true";
        }
    
        function hideForBot() {
            const elementsToHide = [document.getElementById('links'), profilePic, socialLinks];
            elementsToHide.forEach(element => {
                if (element) {
                    element.style.display = 'none';
                }
            });
        }
    
        function showCaptcha() {
            const captchaString = generateCaptchaString(6);
            const userInput = prompt(`Please enter the following code to verify you're human: ${captchaString}`);
            
            if (userInput === captchaString) {
                alert("Verification successful. You may proceed.");
                localStorage.setItem(verifiedKey, 'true');
                clearBotFlag();
            } else {
                alert("Verification failed. You will be blocked.");
                hideForBot();
                window.location.href = '/404';
            }
        }
    
        function generateCaptchaString(length) {
            const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            let result = '';
            for (let i = 0; i < length; i++) {
                result += characters.charAt(Math.floor(Math.random() * characters.length));
            }
            return result;
        }
    
        if (localStorage.getItem(verifiedKey)) {
            console.log("User already verified. Skipping all checks.");
        } else {
            if (isBotOrCurl(navigator.userAgent)) {
                setBotFlag();
                showCaptcha();
            }
    
            window.onload = function() {
                if (isBotDetected()) {
                    hideForBot();
                    console.log("User Banned!");
                }
            };
        }
    
        if (profilePic && socialLinks && clickPrompt && linksContainer) {
            profilePic.addEventListener('click', function () {
                if (!isBotDetected()) {
                    if (window.getComputedStyle(socialLinks).display === 'flex') {
                        socialLinks.style.display = 'none';
                        linksContainer.classList.add('show-tooltip');
                    } else {
                        socialLinks.style.display = 'flex';
                        linksContainer.classList.remove('show-tooltip');
                    }
                    clickPrompt.style.display = 'none';
                    localStorage.setItem('promptHidden', 'true');
                }
            });
    
            profilePic.addEventListener('mouseenter', function() {
                if (window.getComputedStyle(socialLinks).display !== 'flex' && !isBotDetected()) {
                    tooltip.style.display = 'block';
                }
            });
    
            profilePic.addEventListener('mouseleave', function() {
                tooltip.style.display = 'none';
            });
        }
    
        if (localStorage.getItem('promptHidden') === 'true' && clickPrompt) {
            clickPrompt.style.display = 'none';
        }

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
