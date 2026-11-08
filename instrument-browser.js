const picker = document.querySelector(".instrument-selector");
const choices = [...picker.querySelectorAll("a")];
const samples = [...document.querySelectorAll(".instrument-samples > section")];

function showInstrument(hash) {
  const chosen = choices.find(link => link.hash === hash);
  if (!chosen) return;
  for (const link of choices) {
    if (link === chosen) link.setAttribute("aria-current", "true");
    else link.removeAttribute("aria-current");
  }
  for (const sample of samples) sample.hidden = "#" + sample.id !== hash;
}

function restoreInstrument() {
  const known = choices.some(link => link.hash === location.hash);
  showInstrument(known ? location.hash : choices[0].hash);
}

picker.addEventListener("click", event => {
  const link = event.target.closest("a");
  if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  if (location.hash !== link.hash) history.pushState(null, "", link.hash);
  showInstrument(link.hash);
});
window.addEventListener("popstate", restoreInstrument);
window.addEventListener("hashchange", restoreInstrument);
restoreInstrument();
