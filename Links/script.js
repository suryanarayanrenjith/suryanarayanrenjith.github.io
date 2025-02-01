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

(function () {
        function isWebGLAvailable() {
          try {
            var testCanvas = document.createElement("canvas");
            return !!(window.WebGLRenderingContext &&
              (testCanvas.getContext("webgl") || testCanvas.getContext("experimental-webgl")));
          } catch (e) {
            return false;
          }
        }
      
        function runFallbackAnimation() {
          let canvas = document.getElementById("3dCanvas");
          if (!canvas) {
            canvas = document.createElement("canvas");
            canvas.id = "3dCanvas";
            document.body.appendChild(canvas);
          }
          const ctx = canvas.getContext("2d");
          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight;
      
          const gridSize = 200;
          let angleX = 0, angleY = 0;
          let speedX = 0.01, speedY = 0.02;
      
          function project3D(x, y, z) {
            const scale = 300 / (300 + z);
            const x2D = x * scale + canvas.width / 2;
            const y2D = y * scale + canvas.height / 2;
            return [x2D, y2D];
          }
      
          function drawGrid() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#000000";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = "#ffffff";
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
                  let vx = v.x, vy = v.y, vz = v.z;
                  let xz = vx * cosY - vz * sinY;
                  vz = vx * sinY + vz * cosY;
                  vx = xz;
                  let yz = vy * cosX - vz * sinX;
                  vz = vy * sinX + vz * cosX;
                  vy = yz;
                  vertices[i] = { x: vx, y: vy, z: vz };
                }
      
                const projected = vertices.map(v => project3D(v.x, v.y, v.z));
      
                ctx.beginPath();
                for (let i = 0; i < 4; i++) {
                  ctx.moveTo(projected[i][0], projected[i][1]);
                  ctx.lineTo(projected[(i + 1) % 4][0], projected[(i + 1) % 4][1]);
                  ctx.moveTo(projected[i + 4][0], projected[i + 4][1]);
                  ctx.lineTo(projected[((i + 1) % 4) + 4][0], projected[((i + 1) % 4) + 4][1]);
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
        }
      
        function runWebGLAnimation() {
          function loadP5(callback) {
            if (window.p5) {
              callback();
            } else {
              const script = document.createElement("script");
              script.src = "https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.11.2/p5.min.js";
              script.onload = callback;
              document.head.appendChild(script);
            }
          }
      
          loadP5(() => {
            let webglContainer = document.getElementById("webglContainer");
            if (!webglContainer) {
              webglContainer = document.createElement("div");
              webglContainer.id = "webglContainer";
              document.body.appendChild(webglContainer);
            }
      
            new p5(function (p) {
              let gridSize = 200;
              let depth = 500;
              let angleX = 0, angleY = 0;
              let speedX = 0.01, speedY = 0.02;
              let colorModeIndex = 0;
      
              let mouseInfluenceX = 0, mouseInfluenceY = 0;
      
              p.setup = function () {
                p.createCanvas(window.innerWidth, window.innerHeight, p.WEBGL);
                const storedColorMode = localStorage.getItem("colorModeIndex");
                if (storedColorMode !== null) {
                  colorModeIndex = parseInt(storedColorMode, 10);
                }
                p.stroke(255);
                p.noFill();
                p.pixelDensity(1);
                p.disableFriendlyErrors = true;
      
                p.canvas.addEventListener("webglcontextlost", function (e) {
                  e.preventDefault();
                  p.noLoop();
                  p.canvas.remove();
                  if (document.getElementById("webglContainer"))
                    document.getElementById("webglContainer").remove();
                  runFallbackAnimation();
                });
              };
      
              p.draw = function () {
                let t = p.millis() / 1000;
                p.background(0);
                p.ambientLight(50);
                p.pointLight(255, 255, 255,
                  p.mouseX - window.innerWidth / 2,
                  p.mouseY - window.innerHeight / 2,
                  200
                );
      
                angleX += speedX;
                angleY += speedY;
                speedX += (p.random() - 0.5) * 0.002;
                speedY += (p.random() - 0.5) * 0.002;
                speedX = p.constrain(speedX, 0.005, 0.05);
                speedY = p.constrain(speedY, 0.005, 0.05);
      
                let targetInfluenceX = p.map(p.mouseX, 0, window.innerWidth, -0.02, 0.02);
                let targetInfluenceY = p.map(p.mouseY, 0, window.innerHeight, -0.02, 0.02);
                mouseInfluenceX = p.lerp(mouseInfluenceX, targetInfluenceX, 0.05);
                mouseInfluenceY = p.lerp(mouseInfluenceY, targetInfluenceY, 0.05);
                speedY += mouseInfluenceX;
                speedX += mouseInfluenceY;
      
                let scaleFactor = 1 + 0.05 * p.sin(t * 0.5);
      
                p.push();
                p.scale(scaleFactor);
                p.translate(0, 0, 50 * p.sin(t * 0.3));
                p.rotateX(angleX);
                p.rotateY(angleY);
      
                let cellsX = Math.ceil(window.innerWidth / gridSize) + 2;
                let cellsY = Math.ceil(window.innerHeight / gridSize) + 2;
                let halfCellsX = Math.floor(cellsX / 2);
                let halfCellsY = Math.floor(cellsY / 2);
      
                for (let i = -halfCellsX; i <= halfCellsX; i++) {
                  for (let j = -halfCellsY; j <= halfCellsY; j++) {
                    let posX = i * gridSize;
                    let posY = j * gridSize;
      
                    if (colorModeIndex === 0) {
                        p.stroke(255);
                      } else if (colorModeIndex === 1) {
                        let col = p.map(posX, -window.innerWidth, window.innerWidth, 100, 255);
                        p.stroke(col, 100, 255 - col);
                      } else if (colorModeIndex === 2) {
                        let r = p.map(p.sin(t + posX * 0.01), -1, 1, 100, 255);
                        let g = p.map(p.cos(t + posY * 0.01), -1, 1, 100, 255);
                        let b = p.map(p.sin(t + (posX + posY) * 0.005), -1, 1, 100, 255);
                        p.stroke(r, g, b);
                      } else if (colorModeIndex === 3) {
                        let neon = p.map(p.sin(t * 2 + posX * 0.01), -1, 1, 180, 255);
                        p.stroke(neon, 50, 255);
                      } else if (colorModeIndex === 4) {
                        let heat = p.map(p.sin(t * 2 + posX * 0.02), -1, 1, 150, 255);
                        p.stroke(255, heat, 50);
                      } else if (colorModeIndex === 5) {
                        let galacticR = p.map(p.sin(t * 1.5 + posX * 0.02), -1, 1, 150, 255);
                        let galacticB = p.map(p.cos(t * 2 + posY * 0.02), -1, 1, 50, 255);
                        p.stroke(galacticR, 50, galacticB);
                      } else if (colorModeIndex === 6) {
                        let solarR = p.map(p.sin(t * 2 + posX * 0.01), -1, 1, 180, 255);
                        let solarG = p.map(p.cos(t * 2.5 + posY * 0.02), -1, 1, 80, 180);
                        p.stroke(solarR, solarG, 30);
                      } else if (colorModeIndex === 7) {
                        let aurora = p.map(p.cos(t * 2 + posY * 0.01), -1, 1, 100, 255);
                        p.stroke(50, aurora, 200);
                      } else if (colorModeIndex === 8) {
                        let infrared = p.map(p.sin(t * 1.2 + posX * 0.02), -1, 1, 50, 255);
                        p.stroke(255, 0, infrared);
                      } else if (colorModeIndex === 9) {
                        let mystic = p.map(p.cos(t * 1.5 + posY * 0.015), -1, 1, 100, 255);
                        p.stroke(mystic, 50, 255);
                      }                                                                 
      
                    let v0 = p.createVector(posX, posY, 0);
                    let v1 = p.createVector(posX + gridSize, posY, 0);
                    let v2 = p.createVector(posX + gridSize, posY + gridSize, 0);
                    let v3 = p.createVector(posX, posY + gridSize, 0);
                    let v4 = p.createVector(posX, posY, -depth);
                    let v5 = p.createVector(posX + gridSize, posY, -depth);
                    let v6 = p.createVector(posX + gridSize, posY + gridSize, -depth);
                    let v7 = p.createVector(posX, posY + gridSize, -depth);
      
                      p.beginShape();
                      p.vertex(v0.x, v0.y, v0.z);
                      p.vertex(v1.x, v1.y, v1.z);
                      p.vertex(v2.x, v2.y, v2.z);
                      p.vertex(v3.x, v3.y, v3.z);
                      p.endShape(p.CLOSE);
                      p.beginShape();
                      p.vertex(v4.x, v4.y, v4.z);
                      p.vertex(v5.x, v5.y, v5.z);
                      p.vertex(v6.x, v6.y, v6.z);
                      p.vertex(v7.x, v7.y, v7.z);
                      p.endShape(p.CLOSE);
                      p.beginShape();
                      p.vertex(v0.x, v0.y, v0.z);
                      p.vertex(v3.x, v3.y, v3.z);
                      p.vertex(v7.x, v7.y, v7.z);
                      p.vertex(v4.x, v4.y, v4.z);
                      p.endShape(p.CLOSE);
                      p.beginShape();
                      p.vertex(v1.x, v1.y, v1.z);
                      p.vertex(v2.x, v2.y, v2.z);
                      p.vertex(v6.x, v6.y, v6.z);
                      p.vertex(v5.x, v5.y, v5.z);
                      p.endShape(p.CLOSE);
                      p.beginShape();
                      p.vertex(v0.x, v0.y, v0.z);
                      p.vertex(v1.x, v1.y, v1.z);
                      p.vertex(v5.x, v5.y, v5.z);
                      p.vertex(v4.x, v4.y, v4.z);
                      p.endShape(p.CLOSE);
                      p.beginShape();
                      p.vertex(v3.x, v3.y, v3.z);
                      p.vertex(v2.x, v2.y, v2.z);
                      p.vertex(v6.x, v6.y, v6.z);
                      p.vertex(v7.x, v7.y, v7.z);
                      p.endShape(p.CLOSE);
      
                    let centerFront = p.createVector((v0.x + v1.x + v2.x + v3.x) / 4,
                                                     (v0.y + v1.y + v2.y + v3.y) / 4,
                                                     (v0.z + v1.z + v2.z + v3.z) / 4);
                    let midF0 = p.createVector((v0.x + v1.x) / 2, (v0.y + v1.y) / 2, (v0.z + v1.z) / 2);
                    let midF1 = p.createVector((v1.x + v2.x) / 2, (v1.y + v2.y) / 2, (v1.z + v2.z) / 2);
                    let midF2 = p.createVector((v2.x + v3.x) / 2, (v2.y + v3.y) / 2, (v2.z + v3.z) / 2);
                    let midF3 = p.createVector((v3.x + v0.x) / 2, (v3.y + v0.y) / 2, (v3.z + v0.z) / 2);
                    let centerBack = p.createVector((v4.x + v5.x + v6.x + v7.x) / 4,
                                                    (v4.y + v5.y + v6.y + v7.y) / 4,
                                                    (v4.z + v5.z + v6.z + v7.z) / 4);
                    let midB0 = p.createVector((v4.x + v5.x) / 2, (v4.y + v5.y) / 2, (v4.z + v5.z) / 2);
                    let midB1 = p.createVector((v5.x + v6.x) / 2, (v5.y + v6.y) / 2, (v5.z + v6.z) / 2);
                    let midB2 = p.createVector((v6.x + v7.x) / 2, (v6.y + v7.y) / 2, (v6.z + v7.z) / 2);
                    let midB3 = p.createVector((v7.x + v4.x) / 2, (v7.y + v4.y) / 2, (v7.z + v4.z) / 2);
                    p.push();
                    p.strokeWeight(1);
                    p.line(centerFront.x, centerFront.y, centerFront.z, midF0.x, midF0.y, midF0.z);
                    p.line(centerFront.x, centerFront.y, centerFront.z, midF1.x, midF1.y, midF1.z);
                    p.line(centerFront.x, centerFront.y, centerFront.z, midF2.x, midF2.y, midF2.z);
                    p.line(centerFront.x, centerFront.y, centerFront.z, midF3.x, midF3.y, midF3.z);
                    p.ellipse(centerFront.x, centerFront.y, 4, 4);
                    p.line(centerBack.x, centerBack.y, centerBack.z, midB0.x, midB0.y, midB0.z);
                    p.line(centerBack.x, centerBack.y, centerBack.z, midB1.x, midB1.y, midB1.z);
                    p.line(centerBack.x, centerBack.y, centerBack.z, midB2.x, midB2.y, midB2.z);
                    p.line(centerBack.x, centerBack.y, centerBack.z, midB3.x, midB3.y, midB3.z);
                    p.ellipse(centerBack.x, centerBack.y, 4, 4);
                    p.pop();
                  }
                }
                p.pop();
              };
      
              p.windowResized = function () {
                p.resizeCanvas(window.innerWidth, window.innerHeight);
              };
      
              p.keyPressed = function () {
                if (p.key === 'c' || p.key === 'C') {
                  colorModeIndex = (colorModeIndex + 1) % 10;
                  localStorage.setItem("colorModeIndex", colorModeIndex);
                }
              };
            }, webglContainer);
          });
        }
      
        if (isWebGLAvailable()) {
          try {
            runWebGLAnimation();
          } catch (e) {
            console.error("Error running WebGL animation, switching to fallback.", e);
            runFallbackAnimation();
          }
        } else {
          console.warn("WebGL not available; using fallback animation.");
          runFallbackAnimation();
        }
      
        window.addEventListener("webglcontextlost", function (e) {
          console.warn("Global: WebGL context lost; switching to fallback.");
          runFallbackAnimation();
        });
      })();

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
            let captchaString = generateCaptchaString(6);
            let regenerateAttempts = 0;
            let verificationAttempts = 0;

                while (verificationAttempts < 3) {
                    const userInput = prompt(
                    `Please enter the following code to verify you're human: ${captchaString}\n` +
                    `Or type 'R' to regenerate the code (${3 - regenerateAttempts} regenerate attempts left)`
                );

                if (userInput === captchaString) {
                alert("Verified.");
                localStorage.setItem(verifiedKey, 'true');
                clearBotFlag();
                return;
                } else if (userInput && userInput.toUpperCase() === 'R' && regenerateAttempts < 3) {
                regenerateAttempts += 1;
                captchaString = generateCaptchaString(6);
                alert(`New code: ${captchaString}`);
                } else {
                verificationAttempts += 1;
                alert(`Incorrect attempt ${verificationAttempts}/3.`);
                }
            }

        alert("Verification failed.");
        hideForBot();
        window.location.href = '/404';
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
