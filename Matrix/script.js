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

		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;

		const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
		const fontSize = 16;
		const columns = canvas.width / fontSize;
		const drops = Array(Math.floor(columns)).fill(1);

		function draw() {
			ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			ctx.fillStyle = '#0F0';
			ctx.font = `${fontSize}px arial`;
			
			for (let i = 0; i < drops.length; i++) {
				const text = letters.charAt(Math.floor(Math.random() * letters.length));
				const x = i * fontSize;
				const y = drops[i] * fontSize;

				const gradient = ctx.createLinearGradient(x, y - fontSize, x, y);
				gradient.addColorStop(0, 'rgba(0, 255, 0, 1)');
				gradient.addColorStop(1, 'rgba(0, 255, 0, 0)');
				ctx.fillStyle = gradient;

				ctx.fillText(text, x, y);

				if (y > canvas.height && Math.random() > 0.975) {
					drops[i] = 0;
				}

				drops[i]++;
			}
		}

		setInterval(draw, 33);
	}

	typeAnimation();
});
