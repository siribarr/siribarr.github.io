(() => {
'use strict';
// Movement may be interrupted by the next command. Keep the animation flag for
// idle visitors, but do not discard navigation while the cards are moving.
// Keep object layout fixed. Only the compositor moves/scales cards between seats.
applySlot=function(el,s){
 const scale=s.w/SLOTS.center.w;
 el.style.left='0px';el.style.top='0px';
 el.style.width=SLOTS.center.w+'px';el.style.height=SLOTS.center.h+'px';
 el.style.opacity=s.op;el.style.zIndex=s.z;el.style.pointerEvents=s.op===0?'none':'auto';
 el.style.transform=`translate3d(${s.x-SLOTS.center.w/2}px,${CY-SLOTS.center.h/2}px,0) rotate(${s.tilt}deg) scale(${scale})`;
};
for(const card of cards)card.style.transition='none';
positionAll(active);
requestAnimationFrame(()=>requestAnimationFrame(()=>{for(const card of cards)card.style.transition='';}));
let carouselSettleTimer;
setActive=function(idx){
 if(idx===active){openCard(idx);return;}
 clearTimeout(carouselSettleTimer);
 animating=true;active=idx;positionAll(idx);
 carouselSettleTimer=setTimeout(()=>{animating=false;},300);
};
const button=document.getElementById('keyhole-btn'),menu=document.getElementById('dropup');
new MutationObserver(()=>button.setAttribute('aria-expanded',String(menu.classList.contains('open')))).observe(menu,{attributes:true,attributeFilter:['class']});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu.classList.contains('open')){menu.classList.remove('open');button.focus();}});
// Mouse gets a wide landing area and a grace period; touch stays open until
// an outside tap. A menu or keyboard focus always takes priority over hiding.
const shell=document.querySelector('.shell'),footer=document.querySelector('.footer');
const edge=document.createElement('div');edge.className='footer-edge';edge.setAttribute('aria-hidden','true');shell.append(edge);
let hovering=false,touchOpen=false,keyboardInput=false,hideTimer;
const keyboardInside=()=>keyboardInput&&footer.contains(document.activeElement);
function updateFooter(){
 clearTimeout(hideTimer);
 if(hovering||touchOpen||keyboardInside()||menu.classList.contains('open')){
  footer.classList.add('is-revealed');
 }else if(footer.classList.contains('is-revealed')){
  hideTimer=setTimeout(()=>footer.classList.remove('is-revealed'),2000);
 }
}
shell.addEventListener('pointermove',e=>{
 if(e.pointerType!=='mouse'&&e.pointerType!=='pen')return;
 const bounds=shell.getBoundingClientRect();
 const next=footer.contains(e.target)||(e.clientY>=bounds.bottom-40&&e.clientY<=bounds.bottom);
 if(next!==hovering){hovering=next;updateFooter();}
});
shell.addEventListener('pointerleave',()=>{hovering=false;updateFooter();});
document.addEventListener('pointerdown',e=>{
 keyboardInput=false;
 if(e.target===edge){
  if(e.pointerType==='touch'){touchOpen=true;edge.setPointerCapture(e.pointerId);}
  else hovering=true;
 }else if(footer.contains(e.target)){
  if(e.pointerType==='touch')touchOpen=true;
 }else{
  touchOpen=false;hovering=false;menu.classList.remove('open');
  if(footer.contains(document.activeElement))document.activeElement.blur();
  // A deliberate outside tap dismisses; merely moving away gets two seconds.
  clearTimeout(hideTimer);footer.classList.remove('is-revealed');return;
 }
 updateFooter();
},true);
// The first touch only summons the bar, even when it slides under that finger.
edge.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();});
document.addEventListener('keydown',e=>{
 if(e.key==='Tab')keyboardInput=true;
 if(e.key==='Escape'){
  const wasOpen=menu.classList.contains('open');menu.classList.remove('open');
  touchOpen=false;
  if(wasOpen){keyboardInput=true;button.focus();}
  updateFooter();
 }
},true);
footer.addEventListener('focusin',e=>{
 if(e.target.matches(':focus-visible'))keyboardInput=true;
 updateFooter();
});
footer.addEventListener('focusout',()=>queueMicrotask(updateFooter));
new MutationObserver(updateFooter).observe(menu,{attributes:true,attributeFilter:['class']});
shell.classList.add('auto-footer');
const delivery=document.getElementById('signal-ticker'),label=document.getElementById('signal-ticker-text');
const key='halyx.studiolo.signal-seen.v1';
let items=[],seen=null,ready=false,pending=false,received=null;
const receiptKey='halyx.studiolo.signal-received.v1';
try{const saved=JSON.parse(VisitStorage.getItem(receiptKey));if(Array.isArray(saved)&&saved.every(id=>typeof id==='string'))received=new Set(saved);}catch{}
try{const saved=JSON.parse(VisitStorage.getItem(key));if(Array.isArray(saved)&&saved.every(id=>typeof id==='string'))seen=new Set(saved);}catch{}
const identity=item=>item.url||[item.source,item.headline,item.date||''].join('|');
function render(){
 const count=seen===null?items.length:items.filter(item=>!seen.has(identity(item))).length;
 const text=count?`${count}${seen===null?'':' new'} telegram${count===1?'':'s'}`:'Signal';
 label.textContent=text;delivery.setAttribute('aria-label',`Open Signal${count?' — '+text:''}`);delivery.classList.toggle('has-delivery',count>0);
}
delivery.addEventListener('click',()=>{
 if(ready){seen??=new Set();items.forEach(item=>seen.add(identity(item)));try{VisitStorage.setItem(key,JSON.stringify([...seen]));}catch{}render();}
 openSignalRepository();
});
async function refresh(){
 if(pending||document.hidden)return;pending=true;const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
 try{
  const response=await fetch('/signal/data',{signal:controller.signal});if(!response.ok)return;
  const data=await response.json();if(!Array.isArray(data.items))return;
  const unique=new Map();data.items.filter(item=>item&&typeof item.headline==='string'&&item.headline.trim()).forEach(item=>unique.set(identity(item),item));
  const ids=[...unique.keys()],added=received!==null&&ids.some(id=>!received.has(id));
  received=new Set(ids);try{VisitStorage.setItem(receiptKey,JSON.stringify(ids));}catch{}
  items=[...unique.values()];ready=true;render();delivery.dataset.ready='true';
  if(added){window.studioloTelegramArrival=true;window.dispatchEvent(new CustomEvent('studiolo:telegram-arrival'));}
 }catch{/* Preserve the last successful delivery state when Signal is unavailable. */}
 finally{clearTimeout(timer);pending=false;}
}
window.addEventListener('pageshow',e=>{if(e.persisted)refresh();});refresh();setInterval(refresh,60000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
// Unchanged archival photograph; only its display is masked. See SOURCES.md.
const layer=document.createElement('div');layer.className='book-corners';layer.setAttribute('aria-hidden','true');
const outline='M117 407 L125 101 Q141 95 151 100 L158 115 L178 122 L194 108 Q203 102 202 116 L201 138 L211 141 L204 151 L190 162 L207 173 L212 172 L205 184 L198 196 L210 197 L210 204 L202 208 L193 222 L207 226 L199 239 L189 253 L201 253 L193 270 L184 282 Q174 291 181 295 Q189 300 197 289 L212 266 L221 252 L225 260 L230 239 Q235 230 242 232 L248 241 L250 232 L261 231 L272 219 L279 217 L282 223 L295 218 L302 219 L306 217 L319 217 L317 229 L310 235 L309 243 L298 248 L306 253 L303 261 L295 266 L291 272 L282 278 L278 287 L267 292 L260 297 L242 305 L230 309 Q217 311 214 320 Q209 332 222 338 L239 337 L254 328 L262 329 L263 336 L276 327 L282 325 Q288 327 287 337 L294 340 L307 337 L318 328 L322 335 L332 332 L337 334 L339 343 L351 340 L362 338 L359 350 L378 352 L396 360 L380 373 L374 379 L388 389 L392 389 L394 406 Z M148 331 a8 8 0 1 0 16 0 a8 8 0 1 0 -16 0 M176 329 a8 8 0 1 0 16 0 a8 8 0 1 0 -16 0 M151 357 a10 10 0 1 0 20 0 a10 10 0 1 0 -20 0 M181 355 a10 10 0 1 0 20 0 a10 10 0 1 0 -20 0';
for(const position of ['tl','tr','bl','br']){
 const piece=document.createElementNS('http://www.w3.org/2000/svg','svg');piece.setAttribute('viewBox','112 94 290 320');piece.setAttribute('class','book-corner corner-'+position);
 piece.innerHTML=`<defs><clipPath id="book-corner-${position}"><path clip-rule="evenodd" d="${outline}"/></clipPath></defs><image href="assets/studiolo/v1/rijks-corner-reference.jpg" width="512" height="513" clip-path="url(#book-corner-${position})"/>`;layer.append(piece);
}
document.querySelector('.shell').append(layer);
const readableName=card=>{
 const source=[...card.querySelectorAll('.card-name')].find(el=>getComputedStyle(el).display!=='none');
 const name=(source?.textContent||card.getAttribute('aria-label')||'').trim();
 return name===name.toUpperCase()?name.toLowerCase().replace(/\b\w+/g,(word,index)=>index&&['of','at','the'].includes(word)?word:word[0].toUpperCase()+word.slice(1)):name;
};
// Fixed, slight misalignment, as if each strip was applied by hand.
const labelTilts=[-1.3,.9,-.8,1.1,-1.4,.7,-1,1.2,.6,-.8,1.4,-.7];
for(const [index,card] of cards.entries()){
 const label=document.createElement('div');label.className='desktop-label';label.textContent=readableName(card);label.style.setProperty('--label-tilt',labelTilts[index]+'deg');card.append(label);
 card.setAttribute('aria-label',label.textContent);
}
// A day/night face change updates its label without an independent entrance effect.
new MutationObserver(()=>{const card=document.getElementById('c5');card.querySelector('.desktop-label').textContent=readableName(card);card.setAttribute('aria-label',readableName(card));}).observe(document.getElementById('c5'),{attributes:true,attributeFilter:['class']});
// Suppress only the click produced by the drag itself, not the next deliberate click.
for(const eventName of ['mouseup','touchend'])document.addEventListener(eventName,()=>setTimeout(()=>{didDrag=false;},0));
// Keep labels close to the visible object, not an empty contain-fit margin.
const lowerEdges=new WeakMap();
function lowerAlphaEdge(image){
 const cached=lowerEdges.get(image);if(cached?.src===image.currentSrc)return cached.edge;
 let edge=1;
 try{
  const c=document.createElement('canvas');c.width=128;c.height=Math.max(1,Math.min(256,Math.round(128*image.naturalHeight/image.naturalWidth)));
  const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0,c.width,c.height);const data=ctx.getImageData(0,0,c.width,c.height).data;
  for(let i=data.length-1;i>=3;i-=4)if(data[i]>=32){edge=(Math.floor((i-3)/4/c.width)+1)/c.height;break;}
 }catch{}
 lowerEdges.set(image,{src:image.currentSrc,edge});return edge;
}
function placeLabels(){
 for(const card of cards){
  const label=card.querySelector('.desktop-label'),height=card.clientHeight;
  let bottom=height;
  const coins=[...card.querySelectorAll('.mint-tray-coin')];
  const face=card.querySelector('.card-face');
  if(coins.length)bottom=Math.min(height,Math.max(...coins.map(coin=>coin.offsetTop+coin.offsetHeight)));
  else if(face&&['transparent','rgba(0, 0, 0, 0)'].includes(getComputedStyle(face).backgroundColor)){
   const image=[...face.querySelectorAll('img')].find(el=>el.naturalWidth&&Number(getComputedStyle(el).opacity)>0);
   if(image&&getComputedStyle(image).objectFit==='contain'){
    const paintedHeight=image.naturalHeight*Math.min(image.clientWidth/image.naturalWidth,image.clientHeight/image.naturalHeight);
    bottom=Math.min(height,(image.clientHeight-paintedHeight)/2+paintedHeight*lowerAlphaEdge(image));
   }
  }
  label.style.top=(bottom+7)+'px';
 }
}
let labelFrame;
function scheduleLabels(){if(!labelFrame)labelFrame=requestAnimationFrame(()=>{labelFrame=null;placeLabels();});}
const labelSizes=new ResizeObserver(scheduleLabels);cards.forEach(card=>labelSizes.observe(card));
document.getElementById('stage').addEventListener('load',scheduleLabels,true);
new MutationObserver(scheduleLabels).observe(document.getElementById('mint-tray')||document.getElementById('c6'),{childList:true,subtree:true});
document.fonts.ready.then(scheduleLabels);scheduleLabels();

})();
