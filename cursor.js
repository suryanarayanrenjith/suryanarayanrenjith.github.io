function isDesktop() {
    return window.innerWidth > 768 && !('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }

  if (isDesktop()) {
    const cursorDot = document.querySelector(".cursor-dot");
    const cursorOutline = document.querySelector(".cursor-dot-outline");

    let mouseX = 0;
    let mouseY = 0;
    let outlineX = 0;
    let outlineY = 0;
    let dotX = 0;
    let dotY = 0;

    document.addEventListener("mousemove", (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    function animateCursor() {
      // Smoothly interpolate outline position to add acceleration effect
      outlineX += (mouseX - outlineX) * 0.15;
      outlineY += (mouseY - outlineY) * 0.15;
      
      // Smoothly interpolate dot position to add a more pronounced lag
      dotX += (mouseX - dotX) * 0.1;
      dotY += (mouseY - dotY) * 0.1;

      cursorOutline.style.left = `${outlineX}px`;
      cursorOutline.style.top = `${outlineY}px`;
      cursorDot.style.left = `${dotX}px`;
      cursorDot.style.top = `${dotY}px`;

      requestAnimationFrame(animateCursor);
    }

    animateCursor();

    const addCursorHoverEffect = () => {
      document.body.classList.add("cursor-hover");
    };

    const removeCursorHoverEffect = () => {
      document.body.classList.remove("cursor-hover");
    };

    document.querySelectorAll("a, button, .hover-target").forEach((el) => {
      el.addEventListener("mouseenter", addCursorHoverEffect);
      el.addEventListener("mouseleave", removeCursorHoverEffect);
    });
  }