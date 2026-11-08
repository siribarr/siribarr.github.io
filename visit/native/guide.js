/* Small guidance additions on the real application copies. */
(()=>{'use strict';
 const V=window.Visit;if(!V)return;const S=V.state;const path=('/'+location.pathname.split('/').pop()).replace(/\.html$/,'');
 const el=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text)e.textContent=text;return e;};
 const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
 let box=null,boxObserver=null,target=null,steering=0,moving=false,topics=[],lastCue='',preview=false,fadeTimer=null,guideBeetle=null;
 const reminder=el('button','v-hint-tab','Hint?');reminder.type='button';reminder.hidden=true;reminder.setAttribute('aria-label','Show the visit hint');document.body.append(reminder);
 function clear(){guideBeetle?.remove();guideBeetle=null;clearTimeout(fadeTimer);reminder.hidden=true;boxObserver?.disconnect();boxObserver=null;box?.remove();box=null;target?.classList.remove('v-target','v-bounce');target=null;}
 function scheduleFade(){
  clearTimeout(fadeTimer);const current=box;
  if(!current||(!target&&!current.classList.contains('v-narration'))||current.querySelector('.v-actions'))return;
  fadeTimer=setTimeout(()=>{
   if(box!==current||current.contains(document.activeElement)||(!current.classList.contains('v-beetle-message')&&current.matches(':hover')))return;
   current.classList.add('v-dozing');current.inert=true;guideBeetle?.classList.add('v-beetle-leaving');
   Object.assign(reminder.style,{left:current.style.left,top:current.style.top});reminder.hidden=false;
  },current.classList.contains('v-beetle-message')?6800:6000);
 }
 reminder.onclick=event=>{if(!box)return;if(box.dataset.recallText)box.querySelector('p').textContent=box.dataset.recallText;box.classList.remove('v-dozing');box.inert=false;if(box.classList.contains('v-beetle-message'))beetleArrival(box);reminder.hidden=true;if(event.detail===0){box.tabIndex=-1;box.focus({preventScroll:true});}scheduleFade();};
 // Short beetle appearances explain only the operation currently happening.
 function beetleArrival(message){
  guideBeetle?.remove();
  if(!document.getElementById('visit-beetle-ink')){
   const ink=document.createElementNS('http://www.w3.org/2000/svg','svg');ink.setAttribute('aria-hidden','true');ink.style.cssText='position:absolute;width:0;height:0;overflow:hidden';
   ink.innerHTML='<defs><filter id="visit-beetle-ink" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 -1 -1 -1 0 2"/></filter></defs>';document.body.append(ink);
  }
  guideBeetle=el('div','v-guide-beetle');guideBeetle.setAttribute('aria-hidden','true');const image=el('img');image.src='assets/studiolo/life/durer-stag-beetle.jpg';image.alt='';guideBeetle.append(image);document.body.append(guideBeetle);
  message.classList.remove('v-beetle-message');void message.offsetWidth;message.classList.add('v-beetle-message');positionBeetle(message);
 }
 function positionBeetle(message){if(!guideBeetle)return;const r=message.getBoundingClientRect(),below=message.classList.contains('v-beetle-below')||message.classList.contains('v-folio-speech');guideBeetle.style.left=(below?r.left+10:Math.max(2,r.left-76))+'px';guideBeetle.style.top=(below?r.bottom+3:r.top+5)+'px';}
 function beetleSays(text,options){const b=hint(text,options);b.classList.add('v-narration');scheduleFade();return b;}
 function cue(at){clear();if(at){target=at;at.classList.add('v-target','v-bounce');}}
 function button(label,action,primary=false){const b=el('button',primary?'v-primary':'',label);b.type='button';b.onclick=action;return b;}
 function hint(text,{x=200,y=9,w=400,point=false,at=null,parent=document.body,close=true,recallText=null,onRequest=false}={}){
  clear();box=el('section','v-guide'+(point?' v-arrow':''));box.setAttribute('aria-label','Beetle guidance');box.setAttribute('role','region');Object.assign(box.style,{left:x+'px',top:y+'px',width:w+'px'});box.append(el('p','',text));if(recallText)box.dataset.recallText=recallText;if(x<76)box.classList.add('v-beetle-below');if(w<=174)box.classList.add('v-compact-speech');
  if(close){const b=button('×',()=>{clearTimeout(fadeTimer);box.classList.add('v-dozing');box.inert=true;guideBeetle?.classList.add('v-beetle-leaving');Object.assign(reminder.style,{left:box.style.left,top:box.style.top});reminder.hidden=false;});b.className='v-close';b.setAttribute('aria-label','Hide hint');box.append(b);}parent.append(box);if(onRequest){box.classList.add('v-beetle-message','v-dozing');box.inert=true;}else beetleArrival(box);
  const current=box;boxObserver=new ResizeObserver(()=>{current.style.top=Math.max(8,Math.min(y,innerHeight-(current.classList.contains('v-beetle-below')?126:path!=='/bench'&&x<180?40:12)-current.offsetHeight))+'px';if(current===box)positionBeetle(current);});boxObserver.observe(current);
  if(at){target=at;target.classList.add('v-target','v-bounce');if(!onRequest)scheduleFade();}
  if(onRequest){Object.assign(reminder.style,{left:box.style.left,top:box.style.top});reminder.hidden=false;}
  current.addEventListener('pointerenter',()=>{if(!current.classList.contains('v-beetle-message'))clearTimeout(fadeTimer);});current.addEventListener('pointerleave',scheduleFade);current.addEventListener('focusin',()=>clearTimeout(fadeTimer));current.addEventListener('focusout',scheduleFade);return box;
 }
 function actions(node,items){clearTimeout(fadeTimer);const a=el('div','v-actions');items.forEach(([label,fn,primary])=>a.append(button(label,fn,primary)));node.append(a);return a;}
 function label(){return S.stage==='discovery'&&V.route()==='/ports'?'Ports of Call':V.names[S.stage]||'your visit';}
 const resume=el('button','v-resume');resume.type='button';resume.hidden=true;document.body.append(resume);
 function showResume(){resume.textContent=path==='/bench'?'Hint?':'Continue visit: '+label();resume.setAttribute('aria-label','Continue visit: '+label());resume.hidden=['done','intro'].includes(S.stage);}
 function pause(){if(['intro','done'].includes(S.stage)){V.update({invitationDismissed:true});clear();return;}steering++;moving=false;document.querySelectorAll('.v-pin-ring,.v-target,.v-bounce').forEach(e=>e.classList.remove('v-pin-ring','v-target','v-bounce'));V.update({paused:true});clear();showResume();if(path==='/bench')breadcrumb();}
 resume.onclick=()=>{V.update({paused:false});resume.hidden=true;if(path==='/bench')guideCarousel();else location.href='bench.html';};
 function next(stage,patch={}){V.update({stage,paused:false,...patch});clear();location.href='bench.html';}
 function beginVisit(){V.begin();guideCarousel();}
 function intro(){
  if(S.invitationDismissed)return;
  const b=hint('Oh, hello! Nobody ever throws anything away around here.\nMind the odds and ends. They’ve been getting into the computer again.',{x:244,y:9,w:340,close:false});
  b.classList.add('v-invitation');actions(b,[['Show me',beginVisit,true]]);
  const dismiss=button('×',()=>{V.update({invitationDismissed:true});clear();});dismiss.className='v-close';dismiss.setAttribute('aria-label','Dismiss invitation');b.append(dismiss);
 }

 function markCard(card){
  target=card;card.classList.add('v-target','v-bounce');card.tabIndex=0;card.setAttribute('role','link');card.setAttribute('aria-label','Open '+label());
  card.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();location.href=V.destination(card.dataset.url);}};
 }
 function breadcrumb(){
  if(['intro','done'].includes(S.stage))return;
  const card=window.VisitCarousel?.cards.find(c=>new URL(c.dataset.url,location.origin).pathname===V.route());if(card)markCard(card);
 }
 async function guideCarousel(){
  if(S.paused){showResume();breadcrumb();return;}if(S.stage==='intro')return intro();if(S.stage==='done')return;
  const c=window.VisitCarousel;if(!c)return;clear();resume.hidden=true;
  const wanted=c.cards.findIndex(card=>new URL(card.dataset.url,location.origin).pathname===V.route());if(wanted<0)return;
  const ticket=++steering;moving=true;const n=c.cards.length;let steps=((wanted-c.active)%n+n)%n;if(steps>n/2)steps-=n;const dir=Math.sign(steps),count=Math.abs(steps);
  for(let i=0;i<count;i++){if(ticket!==steering||S.paused)return;c.center((c.active+dir+n)%n);await new Promise(r=>setTimeout(r,reduce?0:Math.max(160,850/Math.max(1,count))));}
  await new Promise(r=>setTimeout(r,reduce?0:250));if(ticket!==steering||S.paused)return;
  moving=false;const card=c.cards[wanted],firstSundae=S.stage==='sundae'&&S.seed&&!S.order;
  if(firstSundae){hint('I know what to do with this!\nFollow me!',{x:250,y:9,w:300,at:card});}
  else if(S.stage==='matinal'){hint('Tap the Matinal. Let’s have a look!',{x:250,y:9,w:300,at:card,onRequest:true});}
  else cue(card);
  if(S.stage==='folio'&&S.note){const note=S.notes.find(n=>n.filename===S.note);if(note){card.querySelector('.v-note-peek')?.remove();const slip=el('div','v-note-peek');if(note.image){const img=el('img');img.src=note.image;img.alt='';slip.append(img);}else slip.textContent=note.body.slice(0,95);card.prepend(slip);}}
  markCard(card);
 }
 function visitControls(exit=false){
  const b=hint(exit?'All done? I’ll put these bits away.':'Fresh eyes? I’ll put these bits away.',{x:235,y:28,w:330});
  actions(b,[[exit?'Return to everyday Halyx':'Start fresh',()=>{V.reset();if(exit)window.top.location.href='../../halyx.html#short-visit';else location.href='bench.html';},true],['Keep exploring',()=>{clear();guideCarousel();}]]);
 }
 function setupCarousel(){
  const menu=document.getElementById('dropup');if(menu){const b=button(['intro','done'].includes(S.stage)?'A short visit':'Continue visit',()=>{menu.classList.remove('open');if(['intro','done'].includes(S.stage))beginVisit();else{V.update({paused:false});guideCarousel();}});b.className='v-menu';menu.prepend(b);for(const [label,exit] of [['New visitor',false],['End visitor mode',true]]){const control=button(label,()=>{menu.classList.remove('open');visitControls(exit);});control.className='v-menu';menu.append(control);}}

  let start=null;document.addEventListener('pointerdown',e=>{if(e.target.closest('.v-guide,.v-resume,button'))return;start=[e.clientX,e.clientY];},{capture:true});
  document.addEventListener('pointermove',e=>{if(start&&Math.abs(e.clientX-start[0])>28){pause();start=null;}},{passive:true});document.addEventListener('pointerup',()=>start=null);
  document.addEventListener('touchstart',e=>{if(!e.target.closest('.v-guide,.v-resume')){start=[e.touches[0].clientX,e.touches[0].clientY];}},{passive:true});
  document.addEventListener('touchmove',e=>{if(start&&Math.abs(e.touches[0].clientX-start[0])>28){pause();start=null;}},{passive:true});
  document.addEventListener('click',e=>{const card=e.target.closest('.card');if(card&&new URL(card.dataset.url,location.origin).pathname!==V.route())pause();},{capture:true});
  document.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)&&!e.target.closest('input,textarea'))pause();});guideCarousel();
 }
 async function seasonPicker(detail){
  if(S.paused||S.stage!=='matinal'||detail.kind!=='season')return;
  const container=document.getElementById('reader-content');if(!container||container.querySelector('.v-season'))return;clear();
  const group=el('section','v-season');const foods=el('div','v-foods');group.append(foods);container.querySelector('.image-reading>div').append(group);
  let market;try{const r=await fetch('/sundae_market.json');if(!r.ok)throw new Error();market=await r.json();}catch{hint('The ingredient list did not load. Close this card and try again.',{x:240,y:10,w:340});return;}
  if(!group.isConnected)return;const now=new Date(Edition.clock);const parts=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:market.timezone,month:'numeric',day:'numeric'}).formatToParts(now).map(p=>[p.type,p.value]));const offer=market.periods[parts.month+'-'+(Number(parts.day)<16?'early':'late')].produce;
  const overlap=detail.foods.filter(f=>offer.includes(f)&&Edition.fruits.includes(f));let chosen=overlap.includes(S.seed)?S.seed:null;
  const take=button(chosen?'Take '+chosen+' along':'Choose an ingredient',()=>{if(!chosen)return;group.classList.add('v-fly');V.update({seed:chosen,selections:[chosen]});setTimeout(()=>next('sundae'),reduce?0:350);},true);take.disabled=!chosen;
  overlap.forEach(food=>{const b=button(food,()=>{chosen=food;foods.classList.remove('v-target');take.classList.add('v-target','v-bounce');V.update({seed:food});for(const child of foods.children)child.setAttribute('aria-pressed',String(child===b));take.disabled=false;take.textContent='Take '+food+' along';});b.className='v-food';b.setAttribute('aria-pressed',String(chosen===food));foods.append(b);});
  if(!overlap.length){hint('A different basket today. We can choose on the next page.',{x:240,y:10,w:340});take.disabled=false;take.textContent='See the sundae menu';take.onclick=()=>next('sundae',{seed:null,selections:[]});}
  group.append(take);if(chosen)take.classList.add('v-target','v-bounce');else foods.classList.add('v-target');
 }
 function setupMatinal(){
  if(S.paused||S.stage!=='matinal')return;const season=document.querySelector('[data-open=season]');beetleSays('Weather, news… ooh, what’s in season?',{x:246,y:307,w:278,at:season,recallText:'Tap the basket. Let’s see what’s tucked inside!'});
  document.addEventListener('visit-season',e=>seasonPicker(e.detail));
  document.getElementById('reader').addEventListener('close',()=>{if(!S.paused&&S.stage==='matinal')cue(season);});
  document.addEventListener('click',e=>{const other=e.target.closest('[data-open]');if((other&&other.dataset.open!=='season')||e.target.closest('#turn-leaf'))pause();},{capture:true});
 }
 function availableTopics(){if(!S.order)return[];return [S.order.primary,S.order.companion].map(food=>topics.find(t=>t.id===food)).filter(Boolean);}
 function follow(t){next('discovery',{topic:t.id,topicRoute:t.route,topicSlug:t.slug||null});}
 function weatherConnection(){connections(false,'tonga');}
 function connections(all=false,preferred=null){
  if(S.paused||!S.order)return;lastCue='connection';const matches=availableTopics();const primary=(preferred==='tonga'?topics.find(t=>t.id==='tonga'):matches.find(t=>t.id===preferred))||matches[0]||topics.find(t=>t.id==='tonga');
  const b=hint(primary.connection,{x:84,y:all?162:214,w:174});
  actions(b,[[primary.id==='tonga'?'Follow the weather':'Follow '+primary.id,()=>follow(primary),true],...(matches.length<2||all?[]:[['Other connections',()=>connections(true)]]),...(primary.id==='tonga'&&matches.length?[['Back',()=>connections(true)]]:[])]);
  if(all){const extra=el('div','v-actions');for(const t of matches.filter(t=>t.id!==primary.id))extra.append(button('Follow '+t.id,()=>connections(false,t.id)));b.append(extra);}
 }
 function sundaeAside(order,phase){
  if(!order)return null;
  if(phase==='extra')return 'Ooh, one more trick!\nWhat will it pick?';
  const temp=order.weather?.current_temp_f,base=order.resolved?.base;
  if(!Number.isFinite(temp)||!['custard','sweet cream','buttermilk','sherbet','sorbet','granita'].includes(base))return null;
  return Math.round(temp)+' degrees.\n'+base[0].toUpperCase()+base.slice(1)+', please!';
 }
 function setupSundae(){
  if(S.paused||S.stage!=='sundae')return;const explained=new Set();
  let conditionsLoaded=false,handoffRestored=false;
  function restoreHandoff(){
   if(handoffRestored||!conditionsLoaded)return;
   if(S.order){frozenOrder=structuredClone(S.order);orderFrozen=true;selected=[S.order.primary,S.order.companion];marketContext=structuredClone(S.order.market);produce=marketContext.produce.slice();conditions=weatherView(S.order.weather,S.order.time.hour);renderProduce();showOrder(frozenOrder,true);connections();}
   else if(!orderFrozen){if(!produce.length)return;selected=S.selections.filter(food=>produce.includes(food));renderProduce();}
   handoffRestored=true;
  }
  loadConditions().then(()=>{conditionsLoaded=true;restoreHandoff();});
  setInterval(()=>{
   if(S.paused||S.stage!=='sundae')return;
   // Do not publish the native page's empty startup selection over the handoff.
   // A failed market read keeps the handoff pending until a native retry succeeds.
   restoreHandoff();if(!handoffRestored)return;
   if(resolving||savingOrder){
    if(lastCue!=='working'){clear();lastCue='working';}
    if(resolving){const phase=document.getElementById('causalLine').classList.contains('device-choice')?'extra':document.querySelector('.reel[data-key="base"].settled')?'base':null;
     if(phase&&!explained.has(phase)){explained.add(phase);const words=sundaeAside(frozenOrder,phase);if(words)beetleSays(words,{x:80,y:275,w:166});}
    }else if(box)clear();return;
   }
   if(lastCue==='working'){clear();lastCue='';}
   if(S.order){if(lastCue!=='connection')connections();return;}
   if(orderFrozen)return;const key=selected.join('|')+'|'+weatherCurrent;if(lastCue===key)return;lastCue=key;V.update({selections:selected.slice()});
   if(!weatherCurrent){clear();return;}
   cue(document.getElementById(selected.length===2?'churn':'produceList'));
  },250);
  document.addEventListener('visit-new-order',()=>{clear();lastCue='';explained.clear();});document.getElementById('historyButton').addEventListener('click',pause);
 }
 function topic(){return topics.find(t=>t.id===S.topic);}
 function confirmKeep(kind){
  const t=topic();if(!t||!S.order)return;preview=true;const isImage=kind==='image',isPlace=kind==='place';const title=isImage?t.imageTitle:isPlace?t.placeName:t.title;
  const kept=isImage?t.credit:isPlace?t.placeNote:t.passage;
  const b=hint('A little souvenir! Anything to add?',{x:188,y:30,w:424});b.classList.add('v-kept-preview');b.append(el('h2','',title));if(isImage){const img=el('img','v-preview-image');img.src=t.image;img.alt=t.imageTitle;b.append(img);}b.append(el('p','',kept));
  const pair=S.order.primary+' and '+S.order.companion;
  const relation=t.id==='tonga'?'The weather helped make my '+pair+' sundae. The Tonga Room makes its own.':'My '+pair+' sundae led me to '+(t.id==='persimmon'?'the paper behind a printed pattern.':t.id==='pomegranate'?'a fruit branch that fills a room.':t.id==='pear'?'music for four hands.':'an orchard of heirloom apples.');
  b.append(el('small','v-route-memory',relation));b.append(el('small','',isImage?'Image: '+t.imageSourceName:t.sourceName));
  const field=el('label','v-personal-label','A line of your own, if you like');const thought=el('input','v-personal-line');thought.type='text';thought.maxLength=120;thought.value=S.thoughts?.[t.id]||'';thought.placeholder='Something to remember…';thought.addEventListener('input',()=>V.update({thoughts:{...S.thoughts,[t.id]:thought.value}}));field.append(thought);b.append(field);
  const store=()=>{
   try{const filename=S.note||'visitor-'+crypto.randomUUID()+'.txt';const record={filename,title,body:(thought.value.trim()?thought.value.trim()+'\n\n':'')+kept+'\n\n'+relation,date:new Date().toLocaleDateString('en-US'),tags:['visit'],source:isImage?t.imageSourceName:t.sourceName,source_url:isImage?t.imageSource:t.source,...(isImage?{image:t.image}:{}),topic:t.id,kind,personalLine:thought.value.trim(),discovery:isImage?t.passage:kept,journey:{seed:S.seed,primary:S.order.primary,companion:S.order.companion,name:S.order.name,temperature:S.order.weather?.current_temp_f,base:S.order.resolved?.base}};
    const notes=S.notes.filter(n=>n.filename!==filename).concat(record);V.update({notes,note:filename,folioBoardSeen:false,pinArrival:true});if(!V.state.notes.some(n=>n.filename===filename))throw new Error();b.classList.add('v-fly');setTimeout(()=>next('folio'),reduce?0:400);
   }catch{b.querySelector('.v-error')?.remove();b.append(el('p','v-error','This browser could not keep the note. Try again; your choice is still here.'));}
  };
  actions(b,[['Keep in Folio',store,true],['Back',()=>{preview=false;path==='/ports'?placeEncounter():archiveEncounter();}]]);
 }
 function archiveEncounter(){
  const t=topic();if(!t||S.paused||S.stage!=='discovery')return;
  if(location.hash!=='#article/'+t.slug)return;const article=document.querySelector('.article');if(!article)return;
  if(!article.classList.contains('v-article')){
   article.classList.add('v-article');article.querySelector('.source').textContent=t.readingCredit||'A short reading';
   const figure=el('figure','v-article-picture'),img=el('img');img.src=t.image;img.alt=t.imageTitle;figure.append(img,el('figcaption','',t.credit));article.querySelector('.article-header').after(figure);
   const end=article.querySelector('.endnote');end.replaceChildren();const a=el('a','',t.sourceName);a.href=t.source;a.target='_blank';a.rel='noopener';end.append(a);for(const source of t.sources||[]){const link=el('a','',source.title);link.href=source.url;link.target='_blank';link.rel='noopener';end.append(document.createTextNode(' / '),link);}if(t.id==='persimmon'){const a2=el('a','','Illustrated stencil: The Met');a2.href=t.imageSource;a2.target='_blank';a2.rel='noopener';end.append(document.createTextNode(' / '),a2);}
  }
  if(preview)return;
  const b=hint(t.recognition,{x:8,y:115,w:130});b.classList.add('v-archive-speech');actions(b,[['Keep the image',()=>confirmKeep('image'),true],['Keep the passage',()=>confirmKeep('passage')]]);
 }
 function setupArchive(){if(S.paused||S.stage!=='discovery')return;
  let ready=false;new MutationObserver(()=>{if(!ready&&document.querySelector('.article')){ready=true;archiveEncounter();}}).observe(document.getElementById('reading'),{childList:true});archiveEncounter();
  window.addEventListener('hashchange',()=>{if(location.hash!=='#article/'+topic()?.slug)pause();});
 }
 function placeEncounter(){
  const t=topic();if(S.paused||S.stage!=='discovery'||t?.route!=='/ports')return;preview=false;const b=hint(t.keepCue,{x:8,y:90,w:164});actions(b,[['Keep this place',()=>confirmKeep('place'),true],['Keep this detail',()=>confirmKeep('passage')]]);
 }
 function setupPorts(){
  const t=topic();if(S.paused||S.stage!=='discovery'||t?.route!=='/ports')return;
  const ready=()=>{const p=window.VisitPorts;if(!p)return;const pin=p.pins().find(p=>p.id===t.pin);if(!pin){hint('That place is unavailable. You can still explore the map.');return;}p.openRegion(t.region);p.map.setView([pin.lat,pin.lng],14,{animate:false});p.map.on('dragstart',pause);
   const marker=p.markers()[t.pin]?.getElement();if(marker){marker.setAttribute('aria-label',t.placeName);}
   const row=Array.from(document.querySelectorAll('.list-item')).find(e=>e.textContent===t.placeName);row?.scrollIntoView({block:'center'});row?.classList.add('v-target');
   beetleSays(t.placeName+'! That’s the one. Tap its name or its pin.',{x:144,y:26,w:230,at:marker});
  };
  document.addEventListener('visit-ports-ready',ready);if(window.VisitPorts)ready();
  document.addEventListener('visit-place-open',e=>{if(e.detail.id===t.pin){document.querySelectorAll('.v-pin-ring,.list-item.v-target').forEach(e=>e.classList.remove('v-pin-ring','v-target'));setTimeout(placeEncounter,70);}else pause();});
 }
 function journeyLabel(note){
  const j=note.journey,card=el('div','v-journey');
  const picture=el('img','v-sundae-mark');picture.src='art/visit-sundae.svg';picture.alt='Sundae Forecast illustration';
  const words=el('div','v-journey-words');words.append(el('strong','',j.name||'Your sundae'),el('span','',j.primary+' + '+j.companion));
  if(Number.isFinite(j.temperature)&&j.base)words.append(el('small','',Math.round(j.temperature)+'°F chose '+j.base+'.'));
  card.append(picture,words);return card;
 }
 function setupFolio(){
  let endingShown=false,landing=false;const home=document.getElementById('studiolo'),overlay=document.getElementById('overlay');
  function boardEnding(){
   if(S.paused||S.stage!=='folio'||endingShown||landing||!overlay.hidden)return;
   endingShown=true;V.update({folioBoardSeen:true});
   if(!S.folioClosingSeen){
    V.update({folioClosingSeen:true});const b=hint('There! That one’s yours.\nI’ll keep a leg on it.',{x:8,y:54,w:136,at:home});b.classList.add('v-folio-speech');positionBeetle(b);scheduleFade();
   }else cue(home);
  }
  home.addEventListener('click',()=>{if(S.stage==='folio'&&!S.paused){V.update({stage:'done',paused:false,pinArrival:false});clear();}},{capture:true});
  const decorate=()=>{
   for(const slip of document.querySelectorAll('.slip')){
    const note=fragments.find(n=>n.filename===slip.dataset.id),button=slip.querySelector('.read-slip');if(!note||!button)continue;
    if(note.image&&!button.querySelector('.v-saved-image')){const img=el('img','v-saved-image');img.src=note.image;img.alt=note.title;button.prepend(img);}
    if(note.journey&&!button.querySelector('.v-journey')){
     slip.classList.add('v-visit-pin');button.prepend(journeyLabel(note));
     const body=button.querySelector('p');body.textContent=note.personalLine||note.discovery||note.body;body.hidden=false;
     const pin=el('span','v-pin-head');pin.setAttribute('aria-hidden','true');slip.append(pin);
    }
    if(note.filename===S.note&&S.pinArrival&&!S.paused&&S.stage==='folio'&&overlay.hidden){
     landing=true;V.update({pinArrival:false,folioBoardSeen:true});slip.classList.add('v-pinning');
     document.getElementById('status').textContent='Your fragment is pinned.';
     setTimeout(()=>{slip.classList.remove('v-pinning');landing=false;boardEnding();},reduce?0:1100);
    }
   }
   const panel=document.querySelector('.panel');if(panel){const title=panel.querySelector('h2');const note=fragments.find(n=>n.title===title?.textContent);panel.classList.toggle('v-guest-note',!!note);if(note?.image&&!panel.querySelector('.v-saved-image')){const img=el('img','v-saved-image');img.src=note.image;img.alt=note.title;title.after(img);}}
   if(!S.paused&&S.stage==='folio'){
    if(overlay.hidden&&document.querySelector('.slip'))boardEnding();
    else if(!overlay.hidden&&endingShown){clear();endingShown=false;}
   }
  };
  new MutationObserver(decorate).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});decorate();
 }

 (async()=>{
  try{const r=await fetch('/content.json');topics=await r.json();}catch{hint('The visit’s connections did not load. Reload to try again.',{x:190,y:10,w:420});return;}
  if(path!=='/bench'&&path!==V.route()&&!['intro','done'].includes(S.stage)){V.update({paused:true});}
  if(S.paused)showResume();
  if(path==='/bench')setupCarousel();else if(path==='/matinal')setupMatinal();else if(path==='/sundae-forecast')setupSundae();else if(path==='/archive')setupArchive();else if(path==='/ports')setupPorts();else if(path==='/folio')setupFolio();
 })();
})();
