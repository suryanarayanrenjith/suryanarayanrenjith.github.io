document.addEventListener("DOMContentLoaded", () => {
    const text = document.querySelector('.animated-text');
    text.classList.add('animate');

    const button = document.querySelector('.center-button');
    button.addEventListener('click', () => {
        window.location.href = '/Links';
    });

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
    const ctx = canvas.getContext('2d');
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
    
    const stars = [];
    const minStars = 250;
    const maxStars = 500;
    const edgeThreshold = 10;
    
    function createStar() {
        const speed = Math.random() * 0.5 + 0.1;
        return {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: Math.random() * 3,
            speed: speed,
            alpha: Math.random(),
            phase: Math.random() * 2 * Math.PI,
            dx: (Math.random() - 0.5) * speed,
            dy: (Math.random() - 0.5) * speed,
            tiltFactor: Math.random() * 0.05 + 0.05,
            trail: []
        };
    }
    
    for (let i = 0; i < minStars; i++) {
        stars.push(createStar());
    }
    
    let mouseX = canvas.width / 2;
    let mouseY = canvas.height / 2;
    const avoidanceRadius = 100;
    
    canvas.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });
    
    let tiltX = 0;
    
    window.addEventListener('deviceorientation', (e) => {
        tiltX = e.gamma;
    });
    
    function deflectStar(star1, star2) {
        const angle = Math.random() * 2 * Math.PI;
        const speed = Math.random() * 0.5 + 0.1;
        star1.dx = Math.cos(angle) * speed;
        star1.dy = Math.sin(angle) * speed;
        star2.dx = -Math.cos(angle) * speed;
        star2.dy = -Math.sin(angle) * speed;
    }
    
    function applyAI(star) {
        const dx = star.x - mouseX;
        const dy = star.y - mouseY;
        const distance = Math.sqrt(dx * dx + dy * dy);
    
        if (distance < avoidanceRadius) {
            const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * Math.PI;
            const speedFactor = (avoidanceRadius - distance) / avoidanceRadius;
            star.dx = Math.cos(angle) * speedFactor * star.speed;
            star.dy = Math.sin(angle) * speedFactor * star.speed;
        } else {
            star.dx += (Math.random() - 0.5) * 0.1;
            star.dy += (Math.random() - 0.5) * 0.1;
        }
    
        star.x += star.dx;
        star.y += star.dy;
    
        star.x += tiltX * star.tiltFactor;
    
        if (star.x < edgeThreshold) star.dx += (edgeThreshold - star.x) / edgeThreshold * 0.05;
        if (star.x > canvas.width - edgeThreshold) star.dx -= (star.x - (canvas.width - edgeThreshold)) / edgeThreshold * 0.05;
        if (star.y < edgeThreshold) star.dy += (edgeThreshold - star.y) / edgeThreshold * 0.05;
        if (star.y > canvas.height - edgeThreshold) star.dy -= (star.y - (canvas.height - edgeThreshold)) / edgeThreshold * 0.05;
    
        if (star.x < 0) star.x = 0;
        if (star.x > canvas.width) star.x = canvas.width;
        if (star.y < 0) star.y = 0;
        if (star.y > canvas.height) star.y = canvas.height;
    
        star.alpha = 0.5 + Math.cos(star.phase) * 0.5;
        star.phase += star.speed * 0.05;
    
        if (star.trail.length > 10) star.trail.shift();
        star.trail.push({ x: star.x, y: star.y, alpha: star.alpha });
    }
    
    function handleCollisions() {
        for (let i = 0; i < stars.length; i++) {
            for (let j = i + 1; j < stars.length; j++) {
                const star1 = stars[i];
                const star2 = stars[j];
                const dx = star1.x - star2.x;
                const dy = star1.y - star2.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
    
                if (distance < (star1.radius + star2.radius)) {
                    deflectStar(star1, star2);
                }
            }
        }
    }
    
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    
        while (stars.length < minStars) {
            stars.push(createStar());
        }
    
        while (stars.length > maxStars) {
            stars.pop();
        }
    
        stars.forEach(star => {
            applyAI(star);
    
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2, false);
            ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
            ctx.fill();
    
            for (let j = 0; j < star.trail.length; j++) {
                const t = star.trail[j];
                const trailAlpha = t.alpha * (1 - j / star.trail.length);
                const trailRadius = star.radius * (1 - j / star.trail.length);
                ctx.beginPath();
                ctx.arc(t.x, t.y, trailRadius, 0, Math.PI * 2, false);
                ctx.fillStyle = `rgba(255, 255, 255, ${trailAlpha})`;
                ctx.fill();
            }
        });
    
        handleCollisions();
        requestAnimationFrame(draw);
    }
    
    draw();    

});                     
