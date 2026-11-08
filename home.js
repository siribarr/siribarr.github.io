const postcard = document.querySelector('#postcard');
function flipPostcard() {
  const flipped = postcard.classList.toggle('flipped');
  postcard.setAttribute('aria-pressed', String(flipped));
  postcard.setAttribute('aria-label', flipped ? 'Turn postcard to its picture side' : 'Turn postcard to its message side');
  postcard.querySelector('.eink-front').setAttribute('aria-hidden', String(flipped));
  postcard.querySelector('.eink-back').setAttribute('aria-hidden', String(!flipped));
  document.querySelector('#turn-card').innerHTML = (flipped ? 'See the picture' : 'Read the message') + ' <span aria-hidden="true">↻</span>';
}
postcard.addEventListener('click', flipPostcard);
document.querySelector('#turn-card').addEventListener('click', flipPostcard);
const contentsLinks = [...document.querySelectorAll('.site-sections nav a, .masthead a[href^="#"]')];
const sections = [...document.querySelectorAll('#main > section')];
const projectLinks = [...document.querySelectorAll('.project-tabs a')];
const projectPanels = [...document.querySelectorAll('.project-panel')];
function showLocation() {
  const hash = window.location.hash.slice(1);
  if (hash === 'project-halyx' || hash === 'things') {
    const destination = hash === 'project-halyx' ? 'halyx.html' : 'material-study.html';
    location.replace(destination + location.search);
    return;
  }
  let sectionId = hash || 'things';
  if (hash === 'traveler' || hash === 'disney-ears') {
    sectionId = 'things';
  } else if (hash === 'reading') sectionId = 'publications';
  if (!sections.some(section => section.id === sectionId)) sectionId = 'things';
  for (const section of sections) {
    section.hidden = section.id !== sectionId;
    if (!section.hidden) section.scrollTop = 0;
  }
  for (const link of contentsLinks) {
    if (link.hash === '#' + sectionId) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
  const selectedProject = hash === 'disney-ears' ? hash : 'traveler';
  for (const panel of projectPanels) panel.hidden = panel.id !== selectedProject;
  for (const link of projectLinks) {
    if (link.hash === '#' + selectedProject) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
  document.title = sectionId === 'things' ? 'Sophie Iribarren' : document.querySelector('#' + sectionId + ' h2').textContent + ' — Sophie Iribarren';
}
function navigate(hash) {
  if (window.location.hash !== hash) history.pushState(null, '', hash);
  showLocation();
  window.scrollTo({top: 0, behavior: 'instant'});
}
// The skip link moves focus within the current section without changing its route.
document.querySelector('.skip').addEventListener('click', event => {
  event.preventDefault();
  document.querySelector('#main').focus();
});
for (const link of contentsLinks.filter(link => link.getAttribute('href').startsWith('#'))) {
  link.addEventListener('click', event => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigate(link.hash);
  });
}
window.addEventListener('hashchange', showLocation);
window.addEventListener('popstate', showLocation);
showLocation();
document.documentElement.classList.add('portfolio');

const tattooDialog = document.querySelector('#tattoo-dialog');
const tattooDetail = tattooDialog.querySelector('.tattoo-detail');
const tattooPieces = [...document.querySelectorAll('.tattoo-piece')];
let activeTattoo = 0;
function selectTattoo(index, announce = true) {
  activeTattoo = (index + tattooPieces.length) % tattooPieces.length;
  tattooPieces.forEach((piece, i) => {
    const position = (i - activeTattoo + tattooPieces.length) % tattooPieces.length;
    piece.dataset.position = position;
    piece.setAttribute('aria-pressed', String(position === 0));
    const description = piece.querySelector('svg').getAttribute('aria-label');
    piece.setAttribute('aria-label', (position === 0 ? 'Next tattoo; currently showing: ' : 'Bring forward: ') + description);
  });
  if (announce) document.querySelector('#tattoo-status').textContent = tattooPieces[activeTattoo].querySelector('svg').getAttribute('aria-label');
}
for (const [index, piece] of tattooPieces.entries()) {
  piece.addEventListener('click', () => selectTattoo(index === activeTattoo ? activeTattoo + 1 : index));
  piece.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    selectTattoo(activeTattoo + (event.key === 'ArrowRight' ? 1 : -1));
    tattooPieces[activeTattoo].focus({preventScroll:true});
  });
}
document.querySelector('#tattoo-next').addEventListener('click', () => selectTattoo(activeTattoo + 1));
document.querySelector('#tattoo-enlarge').addEventListener('click', () => {
  tattooDetail.replaceChildren(tattooPieces[activeTattoo].querySelector('svg').cloneNode(true));
  tattooDialog.showModal();
});
selectTattoo(0, false);
document.querySelector('#close-tattoo').addEventListener('click', () => tattooDialog.close());
tattooDialog.addEventListener('click', event => {
  if (event.target !== tattooDialog) return;
  const bounds = tattooDialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) tattooDialog.close();
});

// Photographed notebook: reversible crops, upright spreads, and short page turns.
const notebookSources = [...document.querySelectorAll('.notebook-source')];
const notebookImage = document.querySelector('#notebook-image');
const artifactDialog = document.querySelector('#artifact-dialog');
const artifactDetail = artifactDialog.querySelector('.artifact-detail');
const pageButton = document.querySelector('#notebook-page');
const reducedBookMotion = matchMedia('(prefers-reduced-motion: reduce)');
const bookLoads = new Map();
const activeBookTurns = new Map();
let notebookIndex = 0;
let requestedNotebookIndex = 0;
let notebookRequest = 0;
let notebookDetailOpen = false;
let photoInstance = 0;
let suppressBookClickUntil = 0;
function clonePhoto(source) {
  const node = source.cloneNode(true);
  const suffix = '-instance-' + (++photoInstance);
  for (const clip of node.querySelectorAll('clipPath[id]')) {
    const old = clip.id; clip.id = old + suffix;
    for (const item of node.querySelectorAll('[clip-path]')) {
      if (item.getAttribute('clip-path') === 'url(#' + old + ')') item.setAttribute('clip-path', 'url(#' + clip.id + ')');
    }
  }
  return node;
}
function notebookPhoto(index) {return clonePhoto(notebookSources[index].content.querySelector('svg'));}
function loadNotebookPhoto(index) {
  const href = notebookSources[index].content.querySelector('image').getAttribute('href');
  if (!bookLoads.has(href)) {
    const image = new Image(); image.src = href;
    const loaded = image.decode().catch(error => {bookLoads.delete(href);throw error;});
    bookLoads.set(href, loaded);
  }
  return bookLoads.get(href);
}
function stopBookTurn(host) {if (activeBookTurns.has(host)) activeBookTurns.get(host)();}
function paperSnapshot(svg) {
  const frame = document.createElement('span'); frame.className = 'book-snapshot';
  frame.append(clonePhoto(svg));return frame;
}
function animateBookTurn(host, oldPhoto, newPhoto, direction, coverChange) {
  stopBookTurn(host);
  if (!oldPhoto || reducedBookMotion.matches) return;
  const overlay = document.createElement('span');
  overlay.className = 'book-turn ' + (direction < 0 ? 'turn-back' : 'turn-forward');
  overlay.setAttribute('aria-hidden', 'true');
  let moving;
  if (coverChange) {
    overlay.classList.add('cover-change');
    moving = document.createElement('span');moving.className = 'turn-cover';moving.append(clonePhoto(oldPhoto));
    overlay.append(moving);
  } else {
    const still = document.createElement('span');still.className = 'book-still';still.append(paperSnapshot(oldPhoto));
    moving = document.createElement('span');moving.className = 'turn-leaf';
    const front = document.createElement('span');front.className = 'leaf-face leaf-front';front.append(paperSnapshot(oldPhoto));
    const back = document.createElement('span');back.className = 'leaf-face leaf-back';back.append(paperSnapshot(newPhoto));
    moving.append(front,back);overlay.append(still,moving);
  }
  host.append(overlay);
  let timer;
  const finish = () => {clearTimeout(timer);overlay.remove();if(activeBookTurns.get(host) === finish) activeBookTurns.delete(host);};
  activeBookTurns.set(host, finish);
  moving.addEventListener('animationend', finish, {once:true});
  timer = setTimeout(finish, 380);
}
const spreadButtons = notebookSources.map((source, i) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.setAttribute('aria-label', 'Open spread: ' + source.dataset.caption);
  button.style.backgroundPositionX = (100 * i / (notebookSources.length - 1)) + '%';
  button.addEventListener('click', () => requestNotebook(i, Math.sign(i - notebookIndex)));
  document.querySelector('.spread-index').append(button);
  return button;
});
function updateBookButtons() {
  spreadButtons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === notebookIndex)));
  const first = notebookIndex === 0;
  const last = notebookIndex === notebookSources.length - 1;
  document.querySelector('#notebook-prev').disabled = first;
  document.querySelector('#detail-prev').disabled = first;
  document.querySelector('#notebook-next').disabled = last;
  document.querySelector('#detail-next').disabled = last;
  pageButton.setAttribute('aria-label', 'Turn the page; journal spread ' + (notebookIndex + 1) + ' of ' + notebookSources.length);
}
function renderNotebook(previousIndex, direction = 1) {
  const oldMain = notebookImage.querySelector(':scope > svg');
  const oldDetail = artifactDetail.querySelector(':scope > svg');
  stopBookTurn(notebookImage);stopBookTurn(artifactDetail);
  const photo = notebookPhoto(notebookIndex);
  notebookImage.replaceChildren(photo);
  document.querySelector('#notebook-caption').textContent = 'Spread ' + (notebookIndex + 1) + ' of ' + notebookSources.length;
  updateBookButtons();
  if (previousIndex !== undefined && previousIndex !== notebookIndex) animateBookTurn(notebookImage, oldMain, photo, direction, false);
  if (notebookDetailOpen) {
    const detailPhoto = notebookPhoto(notebookIndex);
    artifactDetail.replaceChildren(detailPhoto);
    document.querySelector('#artifact-title').textContent = 'Traveler’s journal';
    if (previousIndex !== undefined && previousIndex !== notebookIndex) animateBookTurn(artifactDetail, oldDetail, detailPhoto, direction, false);
  }
  // Decode only neighboring pages, not the whole photo collection.
  for (const next of [notebookIndex-1,notebookIndex+1]) if (next >= 0 && next < notebookSources.length) loadNotebookPhoto(next).catch(() => {});
}
async function requestNotebook(index, direction = 1) {
  index = Math.max(0,Math.min(notebookSources.length-1,index));
  requestedNotebookIndex = index;
  const request = ++notebookRequest;
  pageButton.setAttribute('aria-busy','true');
  try {
    await loadNotebookPhoto(index);
    if(request !== notebookRequest) return;
    document.querySelector('#notebook-error').hidden = true;
    const previous = notebookIndex;notebookIndex = index;
    renderNotebook(previous,direction);
  } catch(error) {
    if(request !== notebookRequest) return;
    requestedNotebookIndex = notebookIndex;
    document.querySelector('#notebook-error').hidden = false;
  } finally {if(request === notebookRequest) pageButton.removeAttribute('aria-busy');}
}
function stepNotebook(step) {
  let next = requestedNotebookIndex + step;
  if(next >= notebookSources.length) next = notebookSources.length - 1;
  requestNotebook(Math.max(0,next),step);
}
document.querySelector('#notebook-prev').addEventListener('click', () => stepNotebook(-1));
document.querySelector('#notebook-next').addEventListener('click', () => stepNotebook(1));
pageButton.addEventListener('click', event => {
  if(performance.now() < suppressBookClickUntil) return;
  const bounds=pageButton.getBoundingClientRect();
  const backwards=event.detail > 0 && notebookIndex > 0 && event.clientX < bounds.left + bounds.width*.45;
  stepNotebook(backwards ? -1 : 1);
});
document.querySelector('#notebook-enlarge').addEventListener('click', () => {
  notebookDetailOpen = true;
  document.querySelector('.notebook-dialog-controls').hidden = false;
  artifactDetail.classList.add('is-notebook');
  renderNotebook();artifactDialog.showModal();
});
document.querySelector('#detail-prev').addEventListener('click', () => stepNotebook(-1));
document.querySelector('#detail-next').addEventListener('click', () => stepNotebook(1));
for (const target of [document.querySelector('.notebook-reader'), artifactDialog]) target.addEventListener('keydown', event => {
  if (target === artifactDialog && !notebookDetailOpen) return;
  if(event.key === 'Home' || event.key === 'End') {event.preventDefault();requestNotebook(event.key === 'Home' ? 0 : notebookSources.length-1,event.key === 'Home' ? -1 : 1);return;}
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {event.preventDefault();stepNotebook(event.key === 'ArrowRight' ? 1 : -1);}
});
for (const target of [pageButton, artifactDetail]) {
  let start;
  target.addEventListener('pointerdown', event => {
    if(target === artifactDetail && !notebookDetailOpen) return;
    if(event.isPrimary && event.button === 0) start={x:event.clientX,y:event.clientY};
  });
  target.addEventListener('pointercancel', () => {start = null;});
  target.addEventListener('pointerup', event => {
    if(!start) return;
    const dx=event.clientX-start.x,dy=event.clientY-start.y;start=null;
    if(Math.abs(dx)>45 && Math.abs(dx)>Math.abs(dy)*1.3) {suppressBookClickUntil=performance.now()+350;stepNotebook(dx < 0 ? 1 : -1);}
  });
}
for (const button of document.querySelectorAll('[data-artifact]')) button.addEventListener('click', () => {
  notebookDetailOpen = false;stopBookTurn(artifactDetail);artifactDetail.classList.remove('is-notebook');
  document.querySelector('.notebook-dialog-controls').hidden = true;
  document.querySelector('#artifact-title').textContent = button.dataset.artifact === 'trophy' ? '16th Annual Brews, Shoes n’ Qs Horseshoe Tournament, 2023' : button.dataset.artifact === 'reading' ? '2025 Summer Reading Challenge' : 'Pub trivia';
  artifactDetail.replaceChildren(clonePhoto(button.querySelector('svg, img')));
  artifactDialog.showModal();
});
document.querySelector('#close-artifact').addEventListener('click', () => artifactDialog.close());
artifactDialog.addEventListener('close', () => {notebookDetailOpen = false;stopBookTurn(artifactDetail);});
artifactDialog.addEventListener('click', event => {
  if (event.target !== artifactDialog) return;
  const b=artifactDialog.getBoundingClientRect();
  if (event.clientX < b.left || event.clientX > b.right || event.clientY < b.top || event.clientY > b.bottom) artifactDialog.close();
});
reducedBookMotion.addEventListener('change', () => {if(reducedBookMotion.matches) for(const stop of [...activeBookTurns.values()]) stop();});
renderNotebook();

// This is a different notebook: the leather cover that actually holds the Sticky.
let companionOpen = false;
const companionToggle = document.querySelector('#companion-toggle');
const companionImage = document.querySelector('#companion-image');
companionToggle.addEventListener('click', () => {
  const old = companionImage.querySelector(':scope > svg');
  stopBookTurn(companionImage);
  companionOpen = !companionOpen;
  const next = clonePhoto(document.querySelector(companionOpen ? '#companion-inside-source' : '#companion-cover-source').content.querySelector('svg'));
  companionImage.replaceChildren(next);
  companionToggle.setAttribute('aria-expanded', String(companionOpen));
  companionToggle.setAttribute('aria-label', companionOpen ? 'Close the leather notebook' : 'Open the leather notebook to see the Sticky inside');
  document.querySelector('#companion-photo-label').textContent = companionOpen ? 'Close notebook ↶' : 'Open the notebook →';
  animateBookTurn(companionImage, old, next, companionOpen ? 1 : -1, true);
});
