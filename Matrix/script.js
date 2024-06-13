document.addEventListener('DOMContentLoaded', () => {
	const animationText = [
		"Connecting to server...",
		"Username: surya",
		"Password: ********",
		"Accessing mainframe...",
		"Loading files...",
		"Access Granted."
	];
	const animationElement = document.getElementById('animation');
	const matrixCanvas = document.getElementById('matrix');
	const preloader = document.getElementById('preloader');

	let i = 0;

	function typeLine(line, callback) {
		let j = 0;
		const span = document.createElement('span');
		span.className = 'typewriter';
		animationElement.appendChild(span);

		function typeCharacter() {
			if (j < line.length) {
				span.innerHTML += line.charAt(j);
				j++;
				setTimeout(typeCharacter, 50);
			} else {
				span.classList.remove('typewriter');
				animationElement.innerHTML += "<br>";
				if (callback) {
					setTimeout(() => {
						showLoadingAnimation(callback);
					}, 500);
				}
			}
		}

		typeCharacter();
	}

	function showLoadingAnimation(callback) {
		const loadingSymbols = ['\\', '|', '/', '-'];
		let k = 0;
		const loadingSpan = document.createElement('span');
		loadingSpan.className = 'typewriter';
		animationElement.appendChild(loadingSpan);

		function animateLoading() {
			if (k < loadingSymbols.length * 2) {
				loadingSpan.innerHTML = loadingSymbols[k % loadingSymbols.length];
				k++;
				setTimeout(animateLoading, 200);
			} else {
				loadingSpan.remove();
				callback();
			}
		}

		animateLoading();
	}

	function typeAnimation() {
		if (i < animationText.length) {
			const line = animationText[i];
			typeLine(line, () => {
				i++;
				typeAnimation();
			});
		} else {
			setTimeout(() => {
				preloader.style.display = 'none';
				matrixCanvas.style.display = 'block';
				startMatrix();
			}, 500);
		}
	}

	function startMatrix() {
		const canvas = document.getElementById('matrix');
		const ctx = canvas.getContext('2d');
		const tiltIntensity = 0.02;
	
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
	
		const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
		const fontSize = 18;
		const columns = Math.ceil(canvas.width / fontSize);
		const drops = [];
	
		for (let i = 0; i < columns; i++) {
			drops[i] = {
				x: i * fontSize,
				y: -Math.random() * canvas.height,
				speed: Math.random() * 4 + 4
			};
		}
	
		function draw() {
			ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			ctx.fillStyle = '#00FF00';
	
			drops.forEach(drop => {
				const text = letters.charAt(Math.floor(Math.random() * letters.length));
				ctx.save();
				ctx.translate(drop.x, drop.y);
				ctx.rotate(drop.angle);
				ctx.fillText(text, 0, 0);
				ctx.restore();
	
				drop.y += drop.speed;
	
				if (drop.y > canvas.height) {
					drop.y = -fontSize;
				}
			});
		}
	
		function tiltCursor(event) {
			const tiltAmount = (event.clientX - canvas.width / 2) * tiltIntensity;
	
			drops.forEach(drop => {
				drop.angle = tiltAmount;
			});
		}
	
		canvas.addEventListener('mousemove', tiltCursor);
	
		setInterval(draw, 33);
	}
	typeAnimation();
});	
