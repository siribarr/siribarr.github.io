/* Loaded before application code, and only on the isolated preview origin. */
(()=>{'use strict';
 const KEY='visitor-carousel-state-v1';
 const blank=()=>({version:1,collectionVersion:2,pinArrival:false,folioClosingSeen:false,stage:'intro',paused:false,seed:null,selections:[],order:null,orders:[],topic:null,notes:[],note:null});
 let state;try{state=JSON.parse(VisitStorage.getItem(KEY))||blank();}catch{state=blank();}
 const save=()=>{VisitStorage.setItem(KEY,JSON.stringify(state));};
 // Drop older visitors from tabs opened before collection isolation was added.
 if(state.collectionVersion!==2){state.notes=(state.notes||[]).filter(n=>n.filename===state.note);state.hiddenSamples=[];state.collectionVersion=2;save();}
 const reset=()=>{VisitStorage.clear();for(const key of Object.keys(state))delete state[key];Object.assign(state,blank());save();};
 const response=(v,status=200,headers={})=>new Response(JSON.stringify(v),{status,headers:{'Content-Type':'application/json',...headers}});
 const names={matinal:'the Matinal',sundae:'Sundae Forecast',discovery:'the Archive',folio:'the Folio'};
 const route=()=>state.stage==='matinal'?'/matinal':state.stage==='sundae'?'/sundae-forecast':state.stage==='discovery'?(state.topicRoute||(state.topic==='tonga'?'/ports':'/archive')):state.stage==='folio'?'/folio':'/bench';
 const destination=url=>{let u=new URL(url,location.origin);if(u.pathname===route()&&!['intro','done'].includes(state.stage)){state.paused=false;save();if(state.stage==='discovery'&&route()==='/archive')u.hash='article/'+(state.topicSlug||('visit-'+(state.topic==='persimmon'?'katagami':'morris')));if(state.stage==='folio'&&state.note&&!state.folioBoardSeen)u.search='?fragment='+encodeURIComponent(state.note);}else if(u.pathname!=='/bench'&&state.stage!=='intro'&&state.stage!=='done'){state.paused=true;save();}return u.pathname.slice(1)+'.html'+u.search+u.hash;};
 window.Visit={get state(){return state;},save,names,route,destination,
   update(patch){Object.assign(state,patch);save();},
   reset,
   begin(){reset();Object.assign(state,{stage:'matinal',folioBoardSeen:false,hiddenSamples:[],thoughts:{},invitationDismissed:true});save();},
   completedOrder(order){if(state.order?.request_id===order.request_id)return;state.order=order;state.selections=[order.primary,order.companion];save();document.dispatchEvent(new Event('visit-order'));},
   newOrder(){state.order=null;state.topic=null;state.topicRoute=null;state.topicSlug=null;state.selections=[];save();document.dispatchEvent(new Event('visit-new-order'));},
   folioBoards(boards){
    const result=boards.map(b=>({...b,ids:b.ids.slice()})),home=result.find(b=>b.ids.includes(state.note));if(!home||home.ids.length>=3)return result;
    for(const other of result){if(other===home)continue;while(home.ids.length<3&&other.ids.length)home.ids.push(other.ids.shift());if(home.ids.length===3)break;}
    return result.filter(b=>b.ids.length);
   },
   async folio(path,options){const method=(options?.method||'GET').toUpperCase();if(method==='GET'){
    const r=await nativeFetch(new URL('/content.json',location.origin).href);if(!r.ok)throw new Error('Sample fragments unavailable');const topics=await r.json();
    const represented=new Set(state.notes.map(n=>n.topic)),hidden=new Set(state.hiddenSamples||[]);
    const samples=topics.filter(t=>!represented.has(t.id)&&!hidden.has('sample-'+t.id+'.txt')).map(t=>({filename:'sample-'+t.id+'.txt',title:t.route==='/archive'?t.imageTitle:t.title,body:t.passage,date:'Sample',tags:['sample',t.route==='/archive'?'history':'places'],source:t.sourceName,source_url:t.source,topic:t.id,kind:'sample',sample:true,...(t.route==='/archive'?{image:t.image}:{})}));
    return structuredClone([...state.notes.slice().reverse(),...samples]);
   }const data=JSON.parse(options.body);if(path==='/delete'){if(data.file.startsWith('sample-'))state.hiddenSamples=[...new Set([...(state.hiddenSamples||[]),data.file])];state.notes=state.notes.filter(n=>n.filename!==data.file);save();return {ok:true};}const filename='fragment-'+data.request_id+'.txt';if(!state.notes.some(n=>n.filename===filename))state.notes.push({...data,filename,date:new Date().toLocaleDateString(),tags:typeof data.tags==='string'?data.tags.split(/\s+/).filter(Boolean):data.tags||[]});save();return {ok:true,filename,request_id:data.request_id};}
 };
 if(location.search==='?start'){reset();history.replaceState(null,'','bench.html');}
 const nativeFetch=window.fetch.bind(window);
 const emptyDisney=()=>({revision:0,last_request:null,request_hash:null,draft:null,afternoons:[]});
 const emptyPins=()=>({schema:1,revision:0,pins:{},placements:{},requests:{}});
 const keepPatch=patch=>{const next={...state,...patch};VisitStorage.setItem(KEY,JSON.stringify(next));Object.assign(state,patch);};
 window.Visit.pinImage=hash=>state.disneyArt?.[hash]?'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(state.disneyArt[hash]):'';
 let disneyQueue=Promise.resolve();
 async function disneyRequest(path,url,method,options){
   const current=state.disneyland||emptyDisney(),collection=state.disneyPins||emptyPins();
   if(path==='/api/disneyland/state'&&method==='GET')return response(current);
   if(path==='/api/disneyland/pins'&&method==='GET')return response({schema:1,revision:collection.revision,pins:collection.pins,placements:collection.placements});
   const action=path==='/api/disneyland/pin-preview'&&method==='GET'?'preview':method==='PUT'&&path==='/api/disneyland/state'?'state':method==='PUT'&&path==='/api/disneyland/pins'?'pins':null;
   if(!action)return response({error:'Unknown guest operation'},405);
   try{
     const body={action,current,collection,...(action==='preview'?{afternoon:url.searchParams.get('afternoon')}:{change:JSON.parse(options.body)})};
     const r=await nativeFetch(new URL('/visitor/disneyland',location.origin).href,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:options.signal});
     if(!r.ok)return r;
     const data=await r.json();
     if(action==='state')keepPatch({disneyland:data});
     if(action==='pins')keepPatch({disneyPins:data.collection,disneyArt:{...state.disneyArt,...data.art}});
     return response(action==='pins'?data.public:data);
   }catch{return response({error:'This tab could not keep the guest choices. Try again.'},507);}
 }
 window.fetch=async(input,options={})=>{
   const url=new URL(typeof input==='string'?input:input.url,location.href),method=(options.method||(input instanceof Request?input.method:'GET')||'GET').toUpperCase();
   if(['localhost','127.0.0.1'].includes(url.hostname)&&/^500[0-6]$/.test(url.port)){url.hostname=location.hostname;url.port=location.port;}
   if(url.origin!==location.origin)return response({error:'External service is outside this local preview'},403);
   const path=url.pathname;
   if(path.startsWith('/api/disneyland/')){
     // Serialize state updates so a pin computation cannot race a choice save.
     const pending=disneyQueue.then(()=>disneyRequest(path,url,method,options));disneyQueue=pending.catch(()=>{});return pending;
   }
   if(path==='/workshop/notes'){
     if(method==='GET')return response(state.workshopNotes||{content:'',saved:null});
     if(method==='POST')try{const data=JSON.parse(options.body);if(typeof data.content!=='string')return response({error:'Invalid note'},400);const note={content:data.content,saved:new Date().toISOString()};keepPatch({workshopNotes:note});return response({ok:true,...note});}catch{return response({error:'This tab could not keep the note'},507);}
   }
   if(path==='/signal/press'&&method==='POST')try{
     const data=JSON.parse(options.body);if(!/^[0-9a-f]{32}$/.test(data.request_id)||typeof data.excerpt!=='string')return response({error:'Invalid excerpt'},400);
     const filename='signal-'+data.request_id+'.txt',old=state.notes.find(n=>n.filename===filename);
     const note={filename,title:data.title,body:data.excerpt,source:data.source,source_url:data.url,date:data.date,tags:['signal']};
     if(old&&JSON.stringify(old)!==JSON.stringify(note))return response({error:'Excerpt conflict'},409);
     if(!old)keepPatch({notes:[...state.notes,note]});
     return response({ok:true,request_id:data.request_id,file:filename});
   }catch{return response({error:'This tab could not keep the excerpt'},507);}
   // Enrich the native location record in this preview, before Ports renders it.
   if(path==='/workshop/ports'&&method==='GET'){
     const r=await nativeFetch(url.href,options);if(!r.ok)return r;const data=await r.json();
     const details=await nativeFetch(new URL('/content.json',location.origin).href);
     if(details.ok){const topics=await details.json();for(const topic of topics){if(!topic.locationNote)continue;const pin=data.pins?.find(p=>p.id===topic.pin);if(pin)pin.notes=topic.locationNote;}}
     return response(data,r.status,{'ETag':r.headers.get('ETag')||'"visitor-local-pins"'});
   }
   // Preview-only November expansion; preserve the real list's vegetables and every other month.
   if(path==='/workshop/matinal_seasons'&&method==='GET'){
     const r=await nativeFetch(url.href,options);if(!r.ok)return r;const seasons=await r.json();
     const november=seasons['11'];if(november&&Array.isArray(november.produce))november.produce=[...new Set([...november.produce,'apple','pear'])];
     return response(seasons);
   }
   if(path==='/workshop/creamery/keep'&&method==='POST'){
     try{const order=JSON.parse(options.body);if(!order?.request_id)return response({error:'Missing order'},400);const existing=state.orders.find(o=>o.request_id===order.request_id);if(existing&&JSON.stringify(existing)!==JSON.stringify(order))return response({error:'Order conflict'},409);if(!existing)state.orders.push(order);save();return response({ok:true,request_id:order.request_id});}catch{return response({error:'This tab could not keep the order'},507);}
   }
   if(path==='/workshop/creamery/churns'&&method==='GET')return response({orders:state.orders});
   if(path==='/mint/coins'&&method==='GET')return response(state.mintCoins||[]);
   if(path==='/mint/save'&&method==='POST'){
     let coin;try{coin=JSON.parse(options.body);}catch{return response({error:'Invalid coin'},400);}
     if(!coin||!/^\d{4}-\d{2}-\d{2}$/.test(coin.id)||typeof coin.date!=='string'||!coin.date||coin.inputs?.v!==2||coin.appearance?.version!==1)return response({error:'Invalid coin'},400);
     const coins=state.mintCoins||[],existing=coins.find(c=>c.id===coin.id);
     if(existing&&JSON.stringify(existing)!==JSON.stringify(coin))return response({error:'A different coin already exists for this day'},409);
     // Acknowledge only after durable tab storage succeeds; preserve exact retries.
     try{keepPatch({mintCoins:existing?coins:[...coins,coin]});return response({ok:true});}
     catch{return response({error:'This tab could not keep the coin. Try again.'},507);}
   }
   if(path==='/trials/profiles'&&method==='GET')return response({profiles:[]});
   if(method!=='GET'&&method!=='HEAD'&&path!=='/workshop/creamery/choice')return response({error:'This action is unavailable in the local visitor preview; no personal record was changed.'},405);
   return nativeFetch(url.href,options);
 };
 // All original VisitStorage calls in copied pages/scripts become VisitStorage.
 // The preview uses a different origin. Server-side personal writes are also denied.
 window.addEventListener('error',e=>{try{const all=JSON.parse(VisitStorage.getItem('visitor-errors')||'[]');all.push({message:e.message,file:e.filename,line:e.lineno,stack:e.error?.stack});console.error('Preview error:',e.error?.stack||e.message);VisitStorage.setItem('visitor-errors',JSON.stringify(all));}catch{}});
})();
