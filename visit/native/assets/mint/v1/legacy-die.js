/* mint_coin.js — the Deeper Strike, the Mint's ruled coin language (2026-07-08).
   Single source for the Mint's coin — mint.html, bench.html and the plate all draw
   from here. Keep in sync with nothing: this IS the source now.
   Grammar and rendering ruled from:
     02 Projects/Architect Outputs/2026-07-08 — Mint Coin Language Proposals.html
   Mapping tables ruled in:
     02 Projects/Architect Outputs/2026-07-09 — Builder Spec — Mint Full Redesign.md */
'use strict';
window.MintMetalDieV1 = (function(){

const SZ = 220;
let UID = 0;
const lerp = (a,b,t) => a + (b-a)*t;

function lerpHex(c1,c2,t){
  const p=(c,i)=>parseInt(c.slice(i,i+2),16);
  const h=v=>Math.round(v).toString(16).padStart(2,'0');
  return '#'+h(lerp(p(c1,1),p(c2,1),t))+h(lerp(p(c1,3),p(c2,3),t))+h(lerp(p(c1,5),p(c2,5),t));
}
function lum(hex){const p=i=>parseInt(hex.slice(i,i+2),16)/255;return .299*p(1)+.587*p(3)+.114*p(5)}
function beadRing(cx,cy,r,n,fill,br){
  let s='';
  for(let i=0;i<n;i++){const a=i/n*Math.PI*2;
    s+=`<circle cx="${(cx+Math.cos(a)*r).toFixed(1)}" cy="${(cy+Math.sin(a)*r).toFixed(1)}" r="${br}" fill="${fill}"/>`}
  return s;
}
function arcPath(cx,cy,r,a1,a2){
  const P=a=>[cx+Math.cos(a*Math.PI/180)*r,cy+Math.sin(a*Math.PI/180)*r];
  const [x1,y1]=P(a1),[x2,y2]=P(a2);
  const large=((a2-a1+360)%360)>180?1:0;
  return `M${x1.toFixed(1)} ${y1.toFixed(1)} A${r} ${r} 0 ${large} 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`;
}

/* the second ink — the day's word, grouped by tone */
const EMO={light:'#c9a24b',content:'#c9a24b',calm:'#c9a24b',grateful:'#c9a24b',
  hopeful:'#f4e6bf',playful:'#f4e6bf',energized:'#f4e6bf',
  melancholy:'#8a9fb0',tender:'#8a9fb0',lonely:'#8a9fb0',flat:'#8a9fb0',
  restless:'#571722',overwhelmed:'#571722',anxious:'#571722',heavy:'#571722',
  focused:'#6e5c38',irritable:'#6e5c38',distracted:'#6e5c38'};

/* the weather strikes the ring — 12 grid words → 5 ring dies */
const WEATHER_RING={sunny:'sunny','partly cloudy':'overcast',overcast:'overcast',
  foggy:'overcast',drizzly:'overcast',rainy:'overcast',humid:'overcast',
  windy:'windy',stormy:'windy',hot:'hot',cold:'crisp',crisp:'crisp'};

/* the best part raises the halo — 31 cloud words → 7 devices (or none) */
const BEST_HALO={
  'being outside':'outside','a walk':'outside','sunlight':'outside','a view':'outside','animals':'outside',
  'reading':'reading','learning something':'reading','discovery':'reading',
  'making something':'making','creating':'making','cooking':'making',
  'laughter':'laughter','unexpected moment':'laughter','being surprised':'laughter','music':'laughter',
  'rest':'rest','quiet':'rest','solitude':'rest','physical comfort':'rest',
  'food':'rest','good coffee':'rest','a treat':'rest','shopping':'rest',
  'conversation':'conversation','a phone call':'conversation','helping someone':'conversation','being helped':'conversation',
  'getting something done':'done','exercise':'done','movement':'done',
  'nothing stands out':null};

/* company kept → supporters' energy (v2 sittings) */
const COMPANY_ENERGY={own:0,draining:.2,mixed:.4,good:.6,energizing:.85};

/* ── the strike itself — ruled renderer, verbatim from the proposal sheets ── */
function strike(d,px){
  const uid='e'+(UID++);const cx=SZ/2,cy=SZ/2,r=SZ/2;
  const F=lerpHex('#46586b','#e08430',d.mood);
  const dark=lum(F)<=.42;
  const ink=dark?'rgba(248,236,206,.92)':'rgba(24,12,4,.9)';
  const inkO=o=>dark?`rgba(248,236,206,${o})`:`rgba(24,12,4,${o})`;
  const emo=EMO[d.emo]||'#c9a24b';
  const emoDeep=lerpHex(emo,'#1a0c04',.38);
  const w=lerp(2.4,4.0,d.sleep);
  const sr=r*lerp(.27,.38,d.sleep);
  const defs=`<radialGradient id="${uid}s" cx="35%" cy="30%" r="72%">
      <stop offset="0%" stop-color="rgba(255,255,255,.28)"/><stop offset="55%" stop-color="rgba(255,255,255,.05)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,.36)"/></radialGradient>
    <clipPath id="${uid}c"><circle cx="${cx}" cy="${cy}" r="${r-1}"/></clipPath>
    <clipPath id="${uid}gc"><circle cx="${cx}" cy="${cy}" r="${r*.73}"/></clipPath>`;
  let s=`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${F}"/>`;
  /* guilloché — engine-turned rosette lathed into the field */
  let gl='';
  for(let i=0;i<16;i++){const q=i/16*Math.PI*2;
    gl+=`<circle cx="${(cx+Math.cos(q)*r*.22).toFixed(1)}" cy="${(cy+Math.sin(q)*r*.22).toFixed(1)}"
      r="${(r*.50).toFixed(1)}" fill="none" stroke="${inkO(.09)}" stroke-width="1"/>`}
  s+=`<g clip-path="url(#${uid}gc)">${gl}</g>`;
  /* the sash — a day off its rails, stitched edges */
  if(d.planned<.4)s+=`<g transform="rotate(-20,${cx},${cy})">
    <rect x="${-r*.3}" y="${cy-15}" width="${SZ*1.3}" height="30" fill="${emo}" opacity=".45"/>
    <line x1="${-r*.3}" y1="${cy-15}" x2="${SZ*1.2}" y2="${cy-15}" stroke="${ink}" stroke-width="1.7" opacity=".6"/>
    <line x1="${-r*.3}" y1="${cy+15}" x2="${SZ*1.2}" y2="${cy+15}" stroke="${ink}" stroke-width="1.7" opacity=".6"/>
    <line x1="${-r*.3}" y1="${cy-10}" x2="${SZ*1.2}" y2="${cy-10}" stroke="${ink}" stroke-width="1" opacity=".4" stroke-dasharray="5 4"/>
    <line x1="${-r*.3}" y1="${cy+10}" x2="${SZ*1.2}" y2="${cy+10}" stroke="${ink}" stroke-width="1" opacity=".4" stroke-dasharray="5 4"/></g>`;
  s+=`<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${uid}s)" opacity=".55"/>`;
  /* the bevel — light from the upper left */
  s+=`<path d="${arcPath(cx,cy,r*.965,150,335)}" fill="none" stroke="rgba(255,255,255,.30)" stroke-width="2.2"/>`;
  s+=`<path d="${arcPath(cx,cy,r*.965,340,145)}" fill="none" stroke="rgba(10,4,0,.35)" stroke-width="2.2"/>`;
  s+=`<circle cx="${cx}" cy="${cy}" r="${r*.945}" fill="none" stroke="${ink}" stroke-width="2.5"/>`;
  s+=`<circle cx="${cx}" cy="${cy}" r="${r*.90}" fill="none" stroke="${inkO(.35)}" stroke-width="1"/>`;
  /* the ring — weather */
  const RR=r*.83, wr=WEATHER_RING[d.weather]||'overcast';
  if(wr==='sunny')s+=beadRing(cx,cy,RR,34,ink,3.0);
  else if(wr==='crisp'||wr==='windy'){
    for(let i=0;i<44;i++){const q=i/44*Math.PI*2,tilt=wr==='windy'?.10:0;
      s+=`<line x1="${(cx+Math.cos(q-tilt)*(RR-5)).toFixed(1)}" y1="${(cy+Math.sin(q-tilt)*(RR-5)).toFixed(1)}"
        x2="${(cx+Math.cos(q+tilt)*(RR+5)).toFixed(1)}" y2="${(cy+Math.sin(q+tilt)*(RR+5)).toFixed(1)}"
        stroke="${ink}" stroke-width="2.1" stroke-linecap="round"/>`}}
  else if(wr==='hot'){for(let i=0;i<26;i++){const q=i/26*Math.PI*2;
    s+=`<path d="M${(cx+Math.cos(q-.05)*(RR-6)).toFixed(1)} ${(cy+Math.sin(q-.05)*(RR-6)).toFixed(1)}
      L${(cx+Math.cos(q)*(RR+7)).toFixed(1)} ${(cy+Math.sin(q)*(RR+7)).toFixed(1)}
      L${(cx+Math.cos(q+.05)*(RR-6)).toFixed(1)} ${(cy+Math.sin(q+.05)*(RR-6)).toFixed(1)} Z" fill="${ink}"/>`}}
  else{for(let i=0;i<22;i++){const q=i/22*Math.PI*2,q2=(i+.72)/22*Math.PI*2,qm=(q+q2)/2;
      s+=`<path d="M${(cx+Math.cos(q)*RR).toFixed(1)} ${(cy+Math.sin(q)*RR).toFixed(1)}
        Q${(cx+Math.cos(qm)*(RR+9)).toFixed(1)} ${(cy+Math.sin(qm)*(RR+9)).toFixed(1)}
        ${(cx+Math.cos(q2)*RR).toFixed(1)} ${(cy+Math.sin(q2)*RR).toFixed(1)}"
        fill="none" stroke="${ink}" stroke-width="2.3" stroke-linecap="round"/>`}}
  /* the halo — the best part of the day */
  const hr=sr*1.5, best=BEST_HALO[d.best]!==undefined?BEST_HALO[d.best]:d.best;
  if(best==='outside'){for(let i=0;i<8;i++){const q=i/8*Math.PI*2-Math.PI/8;
    const long=i%2===0,l1=hr-4,l2=long?hr+11:hr+6;
    s+=`<line x1="${(cx+Math.cos(q)*l1).toFixed(1)}" y1="${(cy+Math.sin(q)*l1).toFixed(1)}"
      x2="${(cx+Math.cos(q)*l2).toFixed(1)}" y2="${(cy+Math.sin(q)*l2).toFixed(1)}"
      stroke="${ink}" stroke-width="${w*.85}" stroke-linecap="round"/>`;
    if(long)s+=`<circle cx="${(cx+Math.cos(q)*(l2+5)).toFixed(1)}" cy="${(cy+Math.sin(q)*(l2+5)).toFixed(1)}" r="1.9" fill="${ink}"/>`}}
  else if(best==='reading'){const pg=(sgn,ww,k)=>`
    <path d="M${cx+sgn*hr*k} ${cy-hr*.62*k} C${cx+sgn*hr*1.3*k} ${cy-hr*.2*k} ${cx+sgn*hr*1.3*k} ${cy+hr*.2*k} ${cx+sgn*hr*k} ${cy+hr*.62*k}"
      fill="none" stroke="${ink}" stroke-width="${ww}" stroke-linecap="round"/>`;
    s+=pg(-1,w,1)+pg(1,w,1)+pg(-1,w*.45,.82)+pg(1,w*.45,.82);}
  else if(best==='making'){s+=`<rect x="${cx-hr}" y="${cy-hr}" width="${hr*2}" height="${hr*2}"
      fill="none" stroke="${ink}" stroke-width="${w*.85}" transform="rotate(45,${cx},${cy})"/>
    <rect x="${cx-hr*.86}" y="${cy-hr*.86}" width="${hr*1.72}" height="${hr*1.72}"
      fill="none" stroke="${inkO(.4)}" stroke-width="1" transform="rotate(45,${cx},${cy})"/>`;
    [[0,-1],[0,1],[-1,0],[1,0]].forEach(function(dd){
      s+=`<circle cx="${cx+dd[0]*hr*1.414}" cy="${cy+dd[1]*hr*1.414}" r="2.6" fill="${ink}"/>`});}
  else if(best==='laughter'){for(let i=0;i<6;i++){const q=i/6*Math.PI*2-Math.PI/2,x=cx+Math.cos(q)*hr,y=cy+Math.sin(q)*hr;
    s+=i%2===0?`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${w*1.3}" fill="${ink}"/>`
      :`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${w*1.15}" fill="none" stroke="${ink}" stroke-width="1.8"/>`}}
  else if(best==='rest'){s+=`<circle cx="${cx}" cy="${cy}" r="${hr}" fill="none" stroke="${ink}" stroke-width="${w*.55}"/>
    <circle cx="${cx}" cy="${cy}" r="${hr+9}" fill="none" stroke="${ink}" stroke-width="${w*.55}"/>`;
    for(let i=0;i<14;i++){const q=i/14*Math.PI*2;
      s+=`<circle cx="${(cx+Math.cos(q)*(hr+4.5)).toFixed(1)}" cy="${(cy+Math.sin(q)*(hr+4.5)).toFixed(1)}" r="1.1" fill="${inkO(.6)}"/>`}}
  else if(best==='conversation'){const cr=(sgn,ww,k)=>`
    <path d="M${cx+sgn*hr*1.15*k} ${cy-hr*.6*k} Q${cx+sgn*hr*.5*k} ${cy} ${cx+sgn*hr*1.15*k} ${cy+hr*.6*k}"
      fill="none" stroke="${ink}" stroke-width="${ww}" stroke-linecap="round"/>`;
    s+=cr(-1,w,1)+cr(1,w,1)+cr(-1,w*.45,.8)+cr(1,w*.45,.8);}
  else if(best==='done'){for(let k=0;k<3;k++){const y0=cy-hr-4-k*9;
    s+=`<path d="M${cx-15} ${y0} L${cx} ${y0-9} L${cx+15} ${y0}" fill="none" stroke="${ink}" stroke-width="${w*.75}" stroke-linecap="round" stroke-linejoin="round"/>`}
    s+=`<circle cx="${cx-15}" cy="${cy-hr-4}" r="1.9" fill="${ink}"/><circle cx="${cx+15}" cy="${cy-hr-4}" r="1.9" fill="${ink}"/>`}
  /* supporters — company kept: annulets, or faceted stars when the day energized */
  if(d.people){const sx=Math.min(sr*2.15,r*.64);
    const star=x=>{let p='';for(let i=0;i<4;i++){const q=i/4*Math.PI*2-Math.PI/2,q2=(i+.5)/4*Math.PI*2-Math.PI/2;
      p+=`${i?'L':'M'}${(x+Math.cos(q)*9.5).toFixed(1)} ${(cy+Math.sin(q)*9.5).toFixed(1)} L${(x+Math.cos(q2)*3.8).toFixed(1)} ${(cy+Math.sin(q2)*3.8).toFixed(1)} `}
      return`<path d="${p}Z" fill="${emo}" stroke="${ink}" stroke-width="1.5"/><circle cx="${x}" cy="${cy}" r="1.6" fill="${ink}"/>`};
    const ann=x=>`<circle cx="${x}" cy="${cy}" r="5.5" fill="${emo}" stroke="${ink}" stroke-width="1.5"/>
      <circle cx="${x}" cy="${cy}" r="2.2" fill="none" stroke="${ink}" stroke-width="1.3"/>`;
    s+=d.energy>.65?star(cx-sx)+star(cx+sx):ann(cx-sx)+ann(cx+sx);}
  /* seal core — the mind */
  if(d.brain<.35){
    for(let i=3;i>=1;i--)s+=`<circle cx="${cx}" cy="${cy}" r="${(sr*i/3).toFixed(1)}" fill="none" stroke="${ink}"
      stroke-width="${w*.8}"${i===2?' stroke-dasharray="9 6"':''} opacity="${(1-(3-i)*.18).toFixed(2)}"/>`;
    s+=`<circle cx="${cx}" cy="${cy}" r="${w*2}" fill="none" stroke="${emo}" stroke-width="3"/>
      <circle cx="${cx}" cy="${cy}" r="${w*2}" fill="none" stroke="${ink}" stroke-width="1" opacity=".5"/>
      <circle cx="${cx}" cy="${cy}" r="1.6" fill="${ink}"/>`;}
  else if(d.brain<.7){
    for(let i=0;i<12;i++){const q=i/12*Math.PI*2,long=i%2===0,l2=long?sr:sr*.74;
      s+=`<line x1="${(cx+Math.cos(q)*sr*.42).toFixed(1)}" y1="${(cy+Math.sin(q)*sr*.42).toFixed(1)}"
        x2="${(cx+Math.cos(q)*l2).toFixed(1)}" y2="${(cy+Math.sin(q)*l2).toFixed(1)}" stroke="${ink}" stroke-width="${w*.8}" stroke-linecap="round"/>`;
      if(long)s+=`<circle cx="${(cx+Math.cos(q)*(l2+4)).toFixed(1)}" cy="${(cy+Math.sin(q)*(l2+4)).toFixed(1)}" r="1.7" fill="${ink}"/>`}
    s+=`<circle cx="${cx}" cy="${cy}" r="${(sr*.30).toFixed(1)}" fill="${emo}" stroke="${ink}" stroke-width="1.7"/>
      <circle cx="${cx}" cy="${cy}" r="${(sr*.10).toFixed(1)}" fill="${ink}"/>`;}
  else{
    for(let i=0;i<6;i++){const q=i/6*Math.PI*2-Math.PI/2,qL=(i-.5)/6*Math.PI*2-Math.PI/2,qR=(i+.5)/6*Math.PI*2-Math.PI/2;
      const Px=cx+Math.cos(q)*sr,Py=cy+Math.sin(q)*sr;
      const Lx=cx+Math.cos(qL)*sr*.48,Ly=cy+Math.sin(qL)*sr*.48;
      const Rx=cx+Math.cos(qR)*sr*.48,Ry=cy+Math.sin(qR)*sr*.48;
      s+=`<path d="M${cx} ${cy} L${Lx.toFixed(1)} ${Ly.toFixed(1)} L${Px.toFixed(1)} ${Py.toFixed(1)} Z" fill="${emo}"/>
          <path d="M${cx} ${cy} L${Px.toFixed(1)} ${Py.toFixed(1)} L${Rx.toFixed(1)} ${Ry.toFixed(1)} Z" fill="${emoDeep}"/>`}
    let outline='';for(let i=0;i<6;i++){const q=i/6*Math.PI*2-Math.PI/2,q2=(i+.5)/6*Math.PI*2-Math.PI/2;
      outline+=`${i?'L':'M'}${(cx+Math.cos(q)*sr).toFixed(1)} ${(cy+Math.sin(q)*sr).toFixed(1)} L${(cx+Math.cos(q2)*sr*.48).toFixed(1)} ${(cy+Math.sin(q2)*sr*.48).toFixed(1)} `}
    s+=`<path d="${outline}Z" fill="none" stroke="${ink}" stroke-width="2" stroke-linejoin="round"/>`;
    if(d.brain>.85)s+=`<circle cx="${cx}" cy="${cy}" r="${(sr*.20).toFixed(1)}" fill="none" stroke="${ink}" stroke-width="1.7"/>`;
    s+=`<circle cx="${cx}" cy="${cy}" r="1.8" fill="${ink}"/>`;}
  /* mark of work */
  if(d.worked){const ch=dy=>`<path d="M${cx-11} ${cy+r*.58+dy} L${cx} ${cy+r*.645+dy} L${cx+11} ${cy+r*.58+dy}"
      fill="none" stroke="${ink}" stroke-width="${w*.7}" stroke-linecap="round" stroke-linejoin="round"/>`;
    s+=ch(0);if(d.hard>.6)s+=ch(8);}
  const dim=px?` width="${px}" height="${px}"`:'';
  return `<svg${dim} viewBox="0 0 ${SZ} ${SZ}" xmlns="http://www.w3.org/2000/svg">
    <defs>${defs}</defs><g clip-path="url(#${uid}c)">${s}</g>
    <circle cx="${cx}" cy="${cy}" r="${r-1}" fill="none" stroke="rgba(20,10,4,.6)" stroke-width="1.6"/></svg>`;
}

/* ── the blank — unstruck metal, guilloché and bevel only ── */
function blank(px){
  const uid='b'+(UID++);const cx=SZ/2,cy=SZ/2,r=SZ/2;
  let gl='';
  for(let i=0;i<16;i++){const q=i/16*Math.PI*2;
    gl+=`<circle cx="${(cx+Math.cos(q)*r*.22).toFixed(1)}" cy="${(cy+Math.sin(q)*r*.22).toFixed(1)}"
      r="${(r*.50).toFixed(1)}" fill="none" stroke="rgba(24,12,4,.12)" stroke-width="1"/>`}
  const dim=px?` width="${px}" height="${px}"`:'';
  return `<svg${dim} viewBox="0 0 ${SZ} ${SZ}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="${uid}s" cx="35%" cy="30%" r="72%">
        <stop offset="0%" stop-color="rgba(255,255,255,.30)"/><stop offset="55%" stop-color="rgba(255,255,255,.06)"/>
        <stop offset="100%" stop-color="rgba(0,0,0,.38)"/></radialGradient>
      <clipPath id="${uid}c"><circle cx="${cx}" cy="${cy}" r="${r-1}"/></clipPath>
      <clipPath id="${uid}g"><circle cx="${cx}" cy="${cy}" r="${r*.73}"/></clipPath>
    </defs>
    <g clip-path="url(#${uid}c)">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="#9a8a6a"/>
      <g clip-path="url(#${uid}g)">${gl}</g>
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${uid}s)" opacity=".6"/>
      <path d="${arcPath(cx,cy,r*.965,150,335)}" fill="none" stroke="rgba(255,255,255,.32)" stroke-width="2.2"/>
      <path d="${arcPath(cx,cy,r*.965,340,145)}" fill="none" stroke="rgba(10,4,0,.36)" stroke-width="2.2"/>
      <circle cx="${cx}" cy="${cy}" r="${r*.945}" fill="none" stroke="rgba(24,12,4,.55)" stroke-width="2.5"/>
      <circle cx="${cx}" cy="${cy}" r="${r*.90}" fill="none" stroke="rgba(24,12,4,.22)" stroke-width="1"/>
    </g>
    <circle cx="${cx}" cy="${cy}" r="${r-1}" fill="none" stroke="rgba(20,10,4,.6)" stroke-width="1.6"/>
  </svg>`;
}

/* ── the registrar reads any coin in the ledger, old strike or new ──
   v1 sittings (April–July 2026): six-seat sliders stored 0–5, work_hard ran
   very hard → easy. v2 sittings store normalized floats and the company word. */
function toRender(rec){
  const i = rec.inputs || {};
  if(i.v === 2 || rec.v === 2){
    return {
      sleep:i.sleep, mood:i.mood, brain:i.brain, ate:i.ate,
      planned:i.planned, weather:i.weather, outside:!!i.outside,
      people:i.company !== 'own', energy:COMPANY_ENERGY[i.company] ?? 0,
      worked:!!i.worked, hard:i.worked ? (i.work_ease ?? 0) : 0,
      emo:i.emo, best:i.best,
    };
  }
  return {
    sleep:(i.sleep ?? 2)/5, mood:(i.mood ?? 2)/5, brain:(i.brain ?? 2)/5,
    ate:(i.ate_well ?? 2)/5,
    planned:(i.day_planned ?? 2)/5, weather:i.weather, outside:!!i.outside,
    people:!!i.saw_people, energy:(i.interaction ?? 2)/5,
    worked:!!i.worked, hard:i.worked ? 1-(i.work_hard ?? 2)/5 : 0,
    emo:i.emotion, best:i.best_part,
  };
}

return { strike, blank, toRender, EMO, WEATHER_RING, BEST_HALO, COMPANY_ENERGY,
         lerp, lerpHex, lum, SZ };
})();
