const display = document.querySelector(".display");
const frame = display.querySelector("iframe");
const restart = document.querySelector(".restart");
function fit() {
  frame.style.transform = "scale(" + display.clientWidth / 800 + ")";
}
fit();
new ResizeObserver(fit).observe(display);
window.addEventListener("message", e => {
  if (e.origin !== location.origin || e.source !== frame.contentWindow) return;
  if (e.data === "leave-visit") location.href = "../halyx.html#short-visit";
  if (e.data === "visit-finished") {
    restart.hidden = false;
    restart.focus();
  }
});
restart.addEventListener("click", () => {
  restart.hidden = true;
  frame.src = "native/bench.html?start";
});
