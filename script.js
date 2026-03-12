import gsap from "gsap";

const SLIDE_WIDTH = 200;
const SLIDE_HEIGHT = 275;
const SLIDE_GAP = 100;
const SLIDE_COUNT = 9;
const DIAGONAL_RANGE = 300;
const WAVE_AMPLITUDE = 60;
const SCROLL_LERP = 0.05;

const slideSources = Array.from(
  { length: SLIDE_COUNT },
  (_, i) => `/img${i + 1}.jpg`,
);

const slideTitles = [
  "Grenade",
  "Plein de fruits",
  "Bol de prunes fraîches",
  "les poires et les cerises",
  "Pomme vert",
  "Des prunes",
  "Mangue",
  "Les fruits rouges",
  "Des prunes 2",
  "Des cerises",
];

const sliderContainer = document.querySelector(".slider");
const titleDisplay = document.getElementById("slide-title");

const trackWidth = SLIDE_COUNT * SLIDE_GAP;
let windowWidth = window.innerWidth;
let windowHeight = window.innerHeight;
let windowCenterX = windowWidth / 2;
let arcBaselineY = windowHeight * 0.5;

slideSources.forEach((src) => {
  const slideEl = document.createElement("div");
  slideEl.classList.add("slide");

  const imgEl = document.createElement("img");
  imgEl.src = src;
  slideEl.appendChild(imgEl);

  sliderContainer.appendChild(slideEl);
});

const slideElements = gsap.utils.toArray(".slide");

function computeSlideTransform(slideIndex, scrollOffset) {
  let wrappedOffsetX =
    (((slideIndex * SLIDE_GAP - scrollOffset) % trackWidth) + trackWidth) %
    trackWidth;
  if (wrappedOffsetX > trackWidth / 2) wrappedOffsetX -= trackWidth;

  const slideCenterX = windowCenterX + wrappedOffsetX;
  const normalizedDist = (slideCenterX - windowCenterX) / (windowWidth * 0.5);
  const absDist = Math.min(Math.abs(normalizedDist), 1);

  const scaleFactor = Math.max(1.2 - absDist * 1, 0.05);
  const scaledWidth = SLIDE_WIDTH * scaleFactor;
  const scaledHeight = SLIDE_HEIGHT * scaleFactor;

  const t = wrappedOffsetX / (trackWidth / 2);
  const diagonalOffsetY = -t * DIAGONAL_RANGE;
  const waveOffsetY = Math.sin(t * Math.PI * 2) * WAVE_AMPLITUDE;

  return {
    x: slideCenterX - scaledWidth / 2,
    y: arcBaselineY - scaledHeight / 2 + diagonalOffsetY + waveOffsetY,
    width: scaledWidth,
    height: scaledHeight,
    zIndex: Math.round((1 - absDist) * 100),
    blur: absDist * 6,
    distanceFromCenter: Math.abs(wrappedOffsetX),
  };
}

let zoomedSlideEl = null;

function layoutSlides(scrollOffset) {
  slideElements.forEach((slideEl, i) => {
    if (slideEl === zoomedSlideEl) return;
    const { x, y, width, height, zIndex, blur } = computeSlideTransform(
      i,
      scrollOffset,
    );
    gsap.set(slideEl, {
      x,
      y,
      width,
      height,
      zIndex,
      filter: `blur(${blur}px)`,
    });
  });
}

function zoomIn(slideEl) {
  zoomedSlideEl = slideEl;
  const zoomWidth = Math.min(windowWidth * 0.75, 520);
  const zoomHeight = zoomWidth * (SLIDE_HEIGHT / SLIDE_WIDTH);
  gsap.to(slideEl, {
    x: windowCenterX - zoomWidth / 2,
    y: windowHeight / 2 - zoomHeight / 2,
    width: zoomWidth,
    height: zoomHeight,
    filter: "blur(0px)",
    zIndex: 200,
    duration: 0.5,
    ease: "power2.inOut",
  });
}

function zoomOut(slideEl) {
  const i = slideElements.indexOf(slideEl);
  const { x, y, width, height, zIndex, blur } = computeSlideTransform(i, scrollCurrent);
  gsap.to(slideEl, {
    x, y, width, height,
    filter: `blur(${blur}px)`,
    zIndex,
    duration: 0.4,
    ease: "power2.inOut",
    onComplete: () => { zoomedSlideEl = null; },
  });
}

slideElements.forEach((slideEl) => {
  slideEl.addEventListener("click", () => {
    if (zoomedSlideEl === slideEl) {
      zoomOut(slideEl);
    } else if (zoomedSlideEl === null && slideEl === slideElements[activeSlideIndex]) {
      zoomIn(slideEl);
    }
  });
});

layoutSlides(0);

let scrollTarget = 0;
let scrollCurrent = 0;

sliderContainer.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    scrollTarget += e.deltaY * 0.5;
  },
  { passive: false },
);

let touchStartX = 0;

sliderContainer.addEventListener("touchstart", (e) => {
  touchStartX = e.touches[0].clientX;
});

sliderContainer.addEventListener(
  "touchmove",
  (e) => {
    e.preventDefault();
    const touchCurrentX = e.touches[0].clientX;
    scrollTarget += (touchStartX - touchCurrentX) * 1.2;
    touchStartX = touchCurrentX;
  },
  { passive: false },
);

let activeSlideIndex = -1;

function syncActiveTitle(scrollOffset) {
  let closestIndex = 0;
  let closestDist = Infinity;

  slideElements.forEach((_, i) => {
    const { distanceFromCenter } = computeSlideTransform(i, scrollOffset);
    if (distanceFromCenter < closestDist) {
      closestDist = distanceFromCenter;
      closestIndex = i;
    }
  });

  if (closestIndex !== activeSlideIndex) {
    activeSlideIndex = closestIndex;
    titleDisplay.textContent = slideTitles[closestIndex];
  }
}

function animate() {
  scrollCurrent += (scrollTarget - scrollCurrent) * SCROLL_LERP;

  layoutSlides(scrollCurrent);
  syncActiveTitle(scrollCurrent);

  requestAnimationFrame(animate);
}

animate();

window.addEventListener("resize", () => {
  windowWidth = window.innerWidth;
  windowHeight = window.innerHeight;
  windowCenterX = windowWidth / 2;
  arcBaselineY = windowHeight * 0.5;
});
