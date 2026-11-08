const sectionsMenu = document.querySelector('.site-sections');
const wideLayout = matchMedia('(min-width: 1000px)');
function fitNavigation() {
  sectionsMenu.open = wideLayout.matches || location.hash === '#site-index';
}
fitNavigation();
wideLayout.addEventListener('change', fitNavigation);
sectionsMenu.addEventListener('click', event => {
  const link = event.target.closest('a[href^="#"]');
  if (!link || wideLayout.matches || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  sectionsMenu.open = false;
  const heading = document.querySelector('#main > section:not([hidden]) h2');
  if (heading) {
    heading.tabIndex = -1;
    heading.focus({preventScroll:true});
  }
});
