// These hashes select entire portfolio pages. Open each one at its masthead.
if (document.querySelector('#main')) {
  function revealMasthead() {
    requestAnimationFrame(() => window.scrollTo({top: 0, behavior: 'instant'}));
  }
  window.addEventListener('pageshow', revealMasthead);
  window.addEventListener('hashchange', revealMasthead);
}
