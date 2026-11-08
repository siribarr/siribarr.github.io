(function(){
'use strict';
const N=480;
const ART='/public_domain_art/mint/v1/';
function surface(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
function photo(url){return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(Error('The source photograph did not load.'));im.src=url;});}
let grainReady;
function getGrain(){return grainReady||(grainReady=photo(ART+'sun.jpg').then(im=>{
 const c=surface(70,70),ctx=c.getContext('2d');ctx.drawImage(im,450,120,70,70,0,0,70,70);
 const p=ctx.getImageData(0,0,70,70).data, grain=new Float32Array(4900);let mean=0;
 for(let i=0;i<grain.length;i++){grain[i]=(p[i*4]+p[i*4+1]+p[i*4+2])/3;mean+=grain[i];}
 mean/=grain.length;for(let i=0;i<grain.length;i++)grain[i]=(grain[i]-mean)/90;
 return grain;
}).catch(e=>{grainReady=null;throw e;}));}
function reliefSVG(svg){
 const doc=new DOMParser().parseFromString(svg,'image/svg+xml'),root=doc.documentElement;
 root.setAttribute('xmlns','http://www.w3.org/2000/svg');root.setAttribute('width',N);root.setAttribute('height',N);
 const fields=[...root.querySelectorAll('circle')].filter(el=>+el.getAttribute('r')>=109&&el.hasAttribute('fill')&&el.getAttribute('fill')!=='none');fields.forEach(el=>el.remove());
 for(const el of root.querySelectorAll('[fill],[stroke]')){
  for(const attr of ['fill','stroke']){
   const v=el.getAttribute(attr);if(!v||v==='none')continue;
   if(v.startsWith('url(')){el.remove();break;}
   const rgba=v.match(/rgba\([^,]+,[^,]+,[^,]+,([^)]+)\)/);
   el.setAttribute(attr,rgba?'rgba(255,255,255,'+rgba[1]+')':'white');
  }
 }
 return new XMLSerializer().serializeToString(root);
}
function patinaSVG(svg,d){
 const doc=new DOMParser().parseFromString(svg,'image/svg+xml'),root=doc.documentElement;
 root.setAttribute('xmlns','http://www.w3.org/2000/svg');root.setAttribute('width',N);root.setAttribute('height',N);
 const ink=MintMetalDieV1.EMO[d.emo]||'#c9a24b',deep=MintMetalDieV1.lerpHex(ink,'#1a0c04',.38);
 for(const el of root.querySelectorAll('[fill],[stroke]')){
  if(el.closest('defs'))continue;
  for(const attr of ['fill','stroke'])if(el.hasAttribute(attr)){const v=el.getAttribute(attr);el.setAttribute(attr,v===ink||v===deep?'white':'none');}
 }
 return new XMLSerializer().serializeToString(root);
}
async function rasterImage(svg){const url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));try{return await photo(url);}finally{URL.revokeObjectURL(url);}}
async function render(canvas,c,motif){
 const out=canvas.getContext('2d'), d=c.appearance.die,svg=MintMetalDieV1.strike(d,230);
 const selected=c.appearance.seed%10000;
 const [im,tintImage,grain,sourcePhoto]=await Promise.all([rasterImage(reliefSVG(svg)),rasterImage(patinaSVG(svg,d)),getGrain(),photo(ART+motif.id+'.jpg')]);
 const h=surface(N,N),ctx=h.getContext('2d');ctx.filter='blur(1.1px)';ctx.drawImage(im,0,0);const pixels=ctx.getImageData(0,0,N,N).data;
 const tintCanvas=surface(N,N),tintCtx=tintCanvas.getContext('2d');tintCtx.filter='blur(1.4px)';tintCtx.drawImage(tintImage,0,0);const tint=tintCtx.getImageData(0,0,N,N).data;
 const emotion=MintMetalDieV1.EMO[d.emo]||'#c9a24b',tintRGB=[1,3,5].map(i=>parseInt(emotion.slice(i,i+2),16));
 const height=new Float32Array(N*N),radius=226,cx=N/2,cy=N/2;
 const offset=selected*13;
 const gr=(x,y)=>grain[((y+offset)%70)*70+((x+offset*2)%70)];
 for(let y=0;y<N;y++)for(let x=0;x<N;x++){
  const i=y*N+x,dist=Math.hypot(x-cx,y-cy),edge=radius-dist;
  // Soft rounded relief, shallow field, irregular rim from the same source grain.
  height[i]=pixels[i*4+3]/255*3.4+gr(x,y)*.24+Math.max(0,Math.min(1,edge/7))*3;
 }
 const result=out.createImageData(N,N),a=result.data;
 // Preserve mood's cool-to-warm distinction as a restrained metal alloy tint.
 const cool=[136,143,139],warm=[184,130,73],base=cool.map((v,i)=>v+(warm[i]-v)*d.mood);
 for(let y=1;y<N-1;y++)for(let x=1;x<N-1;x++){
  const i=y*N+x,dx=x-cx,dy=y-cy,dist=Math.hypot(dx,dy),edge=radius-dist;
  const coverage=Math.max(0,Math.min(1,edge+gr(x,y)*.48));if(!coverage)continue;
  let nx=-(height[i+1]-height[i-1])*1.35,ny=-(height[i+N]-height[i-N])*1.35,nz=1;
  const norm=Math.hypot(nx,ny,nz);nx/=norm;ny/=norm;nz/=norm;
  const diffuse=Math.max(0,nx*-.44+ny*-.58+nz*.69);
  const shine=Math.pow(Math.max(0,nx*-.24+ny*-.32+nz*.92),16)*.17;
  const emboss=pixels[i*4+3]/255;
  const grainValue=gr(x,y),tarnish=Math.sin(x*.031+selected)*Math.cos(y*.019-selected)*.035;
  const light=.40+diffuse*.68+shine+grainValue*.11+tarnish;
  for(let k=0;k<3;k++){
   const patina=tint[i*4+3]/255*.48,metal=base[k]*(1-patina)+tintRGB[k]*patina;
   a[i*4+k]=Math.max(0,Math.min(255,metal*light+(emboss*.025)*metal));
  }
  a[i*4+3]=coverage*255;
 }

 // Preserve a readable source medal rather than pretending its photographed
 // brightness is a physical height map. Tone the center into the current alloy.
 const inset=surface(N,N),ic=inset.getContext('2d'),size=332;
 ic.drawImage(sourcePhoto,...motif.crop,(N-size)/2,(N-size)/2,size,size);
 const ip=ic.getImageData(0,0,N,N).data;let mean=0,count=0;
 for(let y=85;y<395;y++)for(let x=85;x<395;x++){if(Math.hypot(x-240,y-240)>145)continue;const j=(y*N+x)*4;mean+=ip[j]*.299+ip[j+1]*.587+ip[j+2]*.114;count++;}mean/=count;
 for(let y=1;y<N-1;y++)for(let x=1;x<N-1;x++){
  const i=y*N+x,r=Math.hypot(x-240,y-240);if(r>179)continue;
  // Clear the diagram's center and soften the photographic join inside the rim.
  const transition=Math.max(0,Math.min(1,(179-r)/9));
  const metalLight=.94+gr(x,y)*.10;
  for(let k=0;k<3;k++)a[i*4+k]=a[i*4+k]*(1-transition)+base[k]*metalLight*transition;
  if(r<164){
   const alpha=Math.max(0,Math.min(1,(164-r)/5));
   const lum=(ip[i*4]*.299+ip[i*4+1]*.587+ip[i*4+2]*.114)/mean;
   const tone=Math.max(.28,Math.min(1.65,.35+lum*.63));
   for(let k=0;k<3;k++)a[i*4+k]=a[i*4+k]*(1-alpha)+Math.min(255,base[k]*tone)*alpha;
  }
 }
 out.putImageData(result,0,0);
 // The dated issue mark is a proposed new detail, independent of source lettering.
 out.save();out.font='14px Georgia';out.textAlign='center';
 out.fillStyle='rgba(34,28,20,.75)';out.fillText(c.appearance.issue,240,421);
 out.restore();
};


const MOTIFS={"sun": {"id": "sun", "label": "Sun above the sea", "crop": [75, 72, 850, 850], "source": "https://www.nga.gov/artworks/103361-radiant-sun-among-clouds-above-sea-reverse"}, "rosebush": {"id": "rosebush", "label": "Rosebush", "crop": [64, 74, 870, 870], "source": "https://www.nga.gov/artworks/126821-rosebush-growing-out-rocky-terrain-reverse"}, "pegasus": {"id": "pegasus", "label": "Pegasus", "crop": [75, 75, 850, 850], "source": "https://www.nga.gov/artworks/73901-pegasus-reverse"}, "urania": {"id": "urania", "label": "Urania", "crop": [50, 50, 900, 900], "source": "https://www.nga.gov/artworks/44504-urania-holding-globe-and-lyre-reverse"}, "orpheus": {"id": "orpheus", "label": "Orpheus", "crop": [50, 50, 900, 900], "source": "https://www.nga.gov/artworks/44567-orpheus-lyre-and-long-scroll-reverse"}, "sphere": {"id": "sphere", "label": "Earth, sea and sky", "crop": [50, 50, 900, 900], "source": "https://www.nga.gov/artworks/44356-sphere-representing-earth-sea-and-sky-reverse"}, "elephant": {"id": "elephant", "label": "Elephant", "crop": [50, 50, 900, 900], "source": "https://www.nga.gov/artworks/1319-malatesta-elephant-meadow-reverse"}, "ship": {"id": "ship", "label": "Ship and city", "crop": [50, 50, 900, 900], "source": "https://www.nga.gov/artworks/103332-ship-and-fortified-city-reverse"}, "lion": {"id": "lion", "label": "Lion", "crop": [50, 50, 900, 900], "source": "https://www.nga.gov/artworks/45063-lion-reverse"}, "singing-lion": {"id": "singing-lion", "label": "Lion and music", "crop": [50, 50, 900, 900], "source": "https://www.nga.gov/artworks/44335-lion-being-taught-cupid-sing-reverse"}, "fortress": {"id": "fortress", "label": "Fortress and tree", "crop": [50, 50, 900, 900], "source": "https://www.nga.gov/artworks/44611-fortress-tall-tree-reverse"}, "palm": {"id": "palm", "label": "Palm tree", "crop": [50, 50, 900, 900], "source": "https://www.nga.gov/artworks/44451-figure-palm-tree-reverse"}, "apollo": {"id": "apollo", "label": "Apollo and lyre", "crop": [50, 50, 900, 900], "source": "https://www.nga.gov/artworks/45116-apollo-holding-bow-and-lyre-reverse"}, "erato": {"id": "erato", "label": "Cupid and Erato", "crop": [50, 50, 900, 900], "source": "https://www.nga.gov/artworks/162056-cupid-and-erato-reverse"}, "aesculapius": {"id": "aesculapius", "label": "Aesculapius and Urania", "crop": [50, 50, 900, 900], "source": "https://www.nga.gov/artworks/44527-aesculapius-and-urania-reverse"}, "calliope": {"id": "calliope", "label": "Calliope", "crop": [50, 50, 900, 900], "source": "https://www.nga.gov/artworks/70395-muse-calliope-reverse"}, "fortune": {"id": "fortune", "label": "Seated Fortune", "crop": [50, 50, 900, 900], "source": "https://www.nga.gov/artworks/44801-seated-figure-fortune-reverse"}, "companions": {"id": "companions", "label": "Virtue and Fortune", "crop": [50, 50, 900, 900], "source": "https://www.nga.gov/artworks/44595-virtue-and-fortune-reverse"}, "minerva": {"id": "minerva", "label": "Minerva and tree", "crop": [50, 50, 900, 900], "source": "https://www.nga.gov/artworks/123255-minerva-encouraging-state-reverse"}, "allegory": {"id": "allegory", "label": "Two winged figures", "crop": [50, 50, 900, 900], "source": "https://www.nga.gov/artworks/44077-allegorical-scene-reverse"}};
const POOLS={"food": ["rosebush", "sun", "palm"], "good coffee": ["rosebush", "sun", "palm"], "cooking": ["rosebush", "sun", "palm"], "a treat": ["rosebush", "sun", "palm"], "conversation": ["companions", "erato", "allegory"], "a phone call": ["companions", "erato", "allegory"], "quiet": ["fortune", "rosebush", "palm"], "solitude": ["fortune", "rosebush", "palm"], "rest": ["fortune", "rosebush", "palm"], "physical comfort": ["fortune", "rosebush", "palm"], "nothing stands out": ["fortune", "rosebush", "palm"], "movement": ["pegasus", "elephant", "ship"], "exercise": ["pegasus", "elephant", "ship"], "a walk": ["pegasus", "elephant", "ship"], "making something": ["apollo", "calliope", "pegasus"], "creating": ["apollo", "calliope", "pegasus"], "being outside": ["sun", "rosebush", "palm", "sphere"], "a view": ["sun", "rosebush", "palm", "sphere"], "sunlight": ["sun", "rosebush", "palm", "sphere"], "music": ["orpheus", "apollo", "singing-lion", "calliope"], "laughter": ["singing-lion", "elephant", "pegasus"], "unexpected moment": ["fortune", "pegasus", "sphere"], "being surprised": ["fortune", "pegasus", "sphere"], "discovery": ["urania", "sphere", "calliope", "minerva"], "learning something": ["urania", "sphere", "calliope", "minerva"], "reading": ["urania", "sphere", "calliope", "minerva"], "helping someone": ["companions", "aesculapius", "allegory"], "being helped": ["companions", "aesculapius", "allegory"], "animals": ["elephant", "lion", "pegasus"], "shopping": ["fortune", "rosebush", "ship"], "getting something done": ["fortress", "ship", "minerva"]};

const cache=new Map(),mounts=new WeakMap();let queue=Promise.resolve();
function stable(value){
 if(Array.isArray(value))return '['+value.map(stable).join(',')+']';
 if(value&&typeof value==='object')return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+stable(value[k])).join(',')+'}';
 return JSON.stringify(value);
}
function hash(text){let h=2166136261;for(const ch of text)h=Math.imul(h^ch.charCodeAt(0),16777619)>>>0;return h;}
function assign(record,history=[]){
 if(record.appearance)return record.appearance;
 const seed=hash(record.id+'|'+stable(record.inputs));
 const pool=POOLS[record.inputs.best]||['sun','rosebush','fortune'];
 const recent=history.filter(c=>c.id<record.id&&c.appearance?.version===1).sort((a,b)=>b.id.localeCompare(a.id)).slice(0,7);
 const newest=recent[0]?.appearance.motif;
 const candidates=pool.filter(id=>id!==newest||pool.length===1);
 const score=id=>recent.filter(c=>c.appearance.motif===id).length;
 candidates.sort((a,b)=>score(a)-score(b)||hash(seed+'|'+a)-hash(seed+'|'+b)||a.localeCompare(b));
 return {version:1,motif:candidates[0],seed,issue:record.id,die:MintMetalDieV1.toRender(record)};
}
function describe(record){
 if(!record.appearance)return null;
 const a=record.appearance;
 if(a.version!==1||!MOTIFS[a.motif]||!a.die||!Number.isFinite(a.seed)||!/^\d{4}-\d{2}-\d{2}$/.test(a.issue))throw Error('This coin needs a different renderer.');
 return MOTIFS[a.motif];
}
function image(record){
 const motif=describe(record);
 if(!motif)return Promise.resolve('data:image/svg+xml;charset=utf-8,'+encodeURIComponent(MintCoin.strike(MintCoin.toRender(record),480)));
 const key=stable(record.appearance);
 if(cache.has(key)){const found=cache.get(key);cache.delete(key);cache.set(key,found);return found;}
 // One computed surface at a time; yield between coins to keep touch responsive.
 const result=queue.catch(()=>{}).then(()=>new Promise(resolve=>setTimeout(resolve,0))).then(async()=>{
  const canvas=surface(N,N);await render(canvas,record,motif);return canvas.toDataURL('image/png');
 });
 queue=result;cache.set(key,result);
 if(cache.size>48)cache.delete(cache.keys().next().value);
 result.catch(()=>cache.delete(key));return result;
}
async function mount(el,record,px){
 const token={};mounts.set(el,token);
 if(!record.appearance){el.innerHTML=MintCoin.strike(MintCoin.toRender(record),px);return;}
 const url=await image(record);if(mounts.get(el)!==token)return;
 const im=new Image();im.width=px;im.height=px;im.alt='Coin for '+record.date;
 im.src=url;await im.decode();if(mounts.get(el)===token)el.replaceChildren(im);
}
window.MintMetal={assign,image,mount,describe,motifs:MOTIFS,pools:POOLS,version:1};

})();
