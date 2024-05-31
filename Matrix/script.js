const canvas = document.getElementById('matrix');
		const context = canvas.getContext('2d');

		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;

		const matrix = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890@#$%^&*()*&^%+-/~{[|`]}";
		matrixArray = matrix.split("");

		const font_size = 16;
		const columns = canvas.width/font_size;  
		const drops = [];
		for (let i = 0; i < columns; i++) {
			drops[i] = 1;
		}

		function draw() {
			context.fillStyle = "rgba(0, 0, 0, 0.05)";
			context.fillRect(0, 0, canvas.width, canvas.height);

			context.fillStyle = "#0F0";
			context.font = font_size + "px arial";

			for (let i = 0; i < drops.length; i++) {
				let text = matrixArray[Math.floor(Math.random()*matrixArray.length)];
				context.fillText(text, i*font_size, drops[i]*font_size);

				if (drops[i]*font_size > canvas.height && Math.random() > 0.975)
					drops[i] = 0;

				drops[i]++;
			}
		}

		setInterval(draw, 30);