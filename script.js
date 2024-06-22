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
    const numStars = 200;

    for (let i = 0; i < numStars; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: Math.random() * 3,
            speed: Math.random() * 0.5 + 0.1,
            alpha: Math.random(),
            phase: Math.random() * 2 * Math.PI,
            dx: (Math.random() - 0.5) * 0.5,
            dy: (Math.random() - 0.5) * 0.5,
            trail: []
        });
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        stars.forEach(star => {
            star.alpha = 0.5 + Math.cos(star.phase) * 0.5;
            star.phase += star.speed * 0.05;

            star.x += star.dx;
            star.y += star.dy;

            if (star.x < 0 || star.x > canvas.width) star.dx = -star.dx;
            if (star.y < 0 || star.y > canvas.height) star.dy = -star.dy;

            if (star.trail.length > 10) star.trail.shift();
            star.trail.push({ x: star.x, y: star.y, alpha: star.alpha });

            ctx.beginPath();
            ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2, false);
            ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
            ctx.fill();

            for (let i = 0; i < star.trail.length; i++) {
                const t = star.trail[i];
                ctx.beginPath();
                ctx.arc(t.x, t.y, star.radius / 2, 0, Math.PI * 2, false);
                ctx.fillStyle = `rgba(255, 255, 255, ${t.alpha * (1 - i / star.trail.length)})`;
                ctx.fill();
            }
        });

        requestAnimationFrame(draw);
    }

    draw();
});
