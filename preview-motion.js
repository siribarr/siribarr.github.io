"use strict";
function bindPreview(video, control, subject) {
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  let visible = false;
  let enabled = !reducedMotion.matches;
  let request = 0;

  function sync() {
    const current = ++request;
    control.textContent = (enabled ? "Pause " : "Play ") + subject;
    if (!enabled || !visible || document.hidden) {
      video.pause();
      return;
    }
    if (!video.hasAttribute("src")) video.src = video.dataset.src;
    video.play().catch(error => {
      if (current !== request || error.name === "AbortError") return;
      enabled = false;
      sync();
    });
  }

  control.hidden = false;
  video.addEventListener("playing", () => video.classList.add("has-frame"));
  control.addEventListener("click", () => { enabled = !enabled; sync(); });
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    }).observe(video);
  } else {
    visible = true;
  }
  reducedMotion.addEventListener("change", () => {
    enabled = !reducedMotion.matches;
    if (!enabled) video.classList.remove("has-frame");
    sync();
  });
  document.addEventListener("visibilitychange", sync);
  sync();
}

if (document.getElementById("studiolo")) bindPreview(document.getElementById("studiolo"), document.getElementById("carousel-motion"), "carousel");
bindPreview(document.getElementById("ears-lights"), document.getElementById("ears-motion"), "lights");
