// Constrain navigation in the web edition without changing the device's layout.
(() => {
  const page = location.pathname.split("/").pop().replace(".html","");
  const inert = selector => document.querySelectorAll(selector).forEach(el => el.inert = true);
  if (page === "bench") {
    inert(".footer");
    window.addEventListener("click", e => {
      if (e.target.closest(".v-invitation .v-close")) {
        e.stopImmediatePropagation();
        parent.postMessage("leave-visit", location.origin);
      }
    },true);
    // The native guide designates the next object after the carousel settles.
    const lockCards = () => document.querySelectorAll(".card").forEach(card => {
      card.inert = !card.classList.contains("v-target");
    });
    lockCards();
    new MutationObserver(lockCards).observe(document.querySelector("#stage"),{
      subtree:true,attributes:true,attributeFilter:["class"]
    });
    for (const event of ["wheel","touchstart","touchmove","touchend","mousedown","mouseup","pointerdown"]) {
      window.addEventListener(event,e => { if (!e.target.closest(".v-guide,.v-hint-tab,.footer-edge")) e.stopImmediatePropagation(); },{capture:true,passive:true});
    }
    window.addEventListener("keydown",e => {
      if (["ArrowLeft","ArrowRight"].includes(e.key)) {e.preventDefault();e.stopImmediatePropagation();}
    },true);
    if (Visit.state.stage === "done") parent.postMessage("visit-finished",location.origin);
  }
  if (page === "matinal") inert("[data-open]:not([data-open=season]),#turn-leaf,#time,#studiolo");
  if (page === "sundae-forecast") inert("#historyButton,.return");
  if (page === "archive") inert(".margin,footer,nav,form,[data-view],#previous,#forward,.home-exit");
  if (page === "ports") inert("#ports-studiolo,#topbar-right,#list-close,#list-filters,#card-close,#card-actions,#card-kiwix-btn");
  if (page === "folio") inert("#new,#arrange,#find,#indexBtn,#search,#clear");
  // Museum and encyclopedia links displayed by the native reader stay in the
  // exhibit; keep navigation inside this sequence.
  window.addEventListener("click",e => {
    const a=e.target.closest("a[href]");
    if (a && (a.origin!==location.origin || !a.hash)) {e.preventDefault();e.stopImmediatePropagation();}
  },true);
})();
