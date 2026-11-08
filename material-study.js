"use strict";
const notebook = document.getElementById("notebook");
const motionControl = document.getElementById("notebook-motion");
const cover = notebook.querySelector(".cover");
const inside = notebook.querySelector(".inside");
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
let cycleTimer;
let inView = false;
let userPaused = false;
let keyboardFocused = false;
cover.hidden = false;
inside.hidden = false;
function setNotebookOpen(open) {
 notebook.dataset.open = String(open);
 cover.setAttribute("aria-hidden", String(open));
 inside.setAttribute("aria-hidden", String(!open));
}
function canAnimate() {
 return inView && !document.hidden && !userPaused && !keyboardFocused && !reducedMotion.matches && !document.querySelector("dialog[open]");
}
function queueTurn() {
 clearTimeout(cycleTimer);
 if (reducedMotion.matches) { setNotebookOpen(true); return; }
 if (!canAnimate()) return;
 // Includes the 950ms turn: give the open display a considerably longer rest.
 cycleTimer = setTimeout(() => {
  if (!canAnimate()) return;
  setNotebookOpen(notebook.dataset.open !== "true");
  queueTurn();
 }, notebook.dataset.open === "true" ? 6500 : 2500);
}
function updatePauseControl() {
 motionControl.setAttribute("aria-label", userPaused ? "Resume notebook animation" : "Pause notebook animation");
 motionControl.setAttribute("aria-pressed", String(userPaused));
 motionControl.textContent = userPaused ? "Resume animation" : "Pause animation";
}
motionControl.addEventListener("click", () => {
 userPaused = !userPaused;
 updatePauseControl();
 queueTurn();
});
notebook.addEventListener("focusin", () => {
 keyboardFocused = notebook.matches(":focus-visible");
 queueTurn();
});
notebook.addEventListener("focusout", () => { keyboardFocused = false; queueTurn(); });
setNotebookOpen(reducedMotion.matches);
if ("IntersectionObserver" in window) {
 const observer = new IntersectionObserver(entries => {
  inView = entries[0].isIntersecting;
  queueTurn();
 }, { threshold: 0.6 });
 observer.observe(notebook);
} else { inView = true; queueTurn(); }
document.addEventListener("visibilitychange", queueTurn);
for (const dialog of document.querySelectorAll("dialog")) {
 new MutationObserver(queueTurn).observe(dialog, {attributes:true,attributeFilter:["open"]});
}
reducedMotion.addEventListener("change", queueTurn);

// The preview and its control are siblings so the entire picture remains a project link.
const carousel = document.getElementById("studiolo");
const carouselControl = document.getElementById("carousel-motion");
let carouselVisible = false;
let wantsCarousel = !reducedMotion.matches;
let playRequest = 0;

function syncCarousel() {
  const request = ++playRequest;
  carouselControl.textContent = wantsCarousel ? "Pause carousel" : "Play carousel";
  if (!wantsCarousel || !carouselVisible || document.hidden) {
    carousel.pause();
    return;
  }
  if (!carousel.hasAttribute("src")) carousel.src = carousel.dataset.src;
  carousel.play().catch(error => {
    if (request !== playRequest || error.name === "AbortError") return;
    wantsCarousel = false;
    carouselControl.textContent = "Play carousel";
  });
}

carouselControl.hidden = false;
carouselControl.addEventListener("click", () => {
  wantsCarousel = !wantsCarousel;
  syncCarousel();
});
if ("IntersectionObserver" in window) {
  new IntersectionObserver(([entry]) => {
    carouselVisible = entry.isIntersecting;
    syncCarousel();
  }).observe(carousel);
} else {
  carouselVisible = true;
}
reducedMotion.addEventListener("change", () => {
  wantsCarousel = !reducedMotion.matches;
  syncCarousel();
});
document.addEventListener("visibilitychange", syncCarousel);
syncCarousel();
