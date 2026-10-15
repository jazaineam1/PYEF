import React from 'react';

// Original vector mascot: a lively arcade robot; no third-party assets or fonts.
export default function DeanArcadeMascot({mood='legend'}){
 const wins=['legend','epic','solid'].includes(mood);
 const mouth=wins?'M92 119 Q110 138 128 119':'M92 125 Q110 117 128 125';
 const eyebrow=wins?'M86 93 L99 88 M121 88 L134 93':'M86 88 L100 94 M120 94 L134 88';
 return <div className={'dean-arcade-mascot mascot-'+mood} aria-hidden="true">
  <div className="arcade-mascot-aura"/>
  <svg viewBox="0 0 220 220" width="220" height="220" xmlns="http://www.w3.org/2000/svg">
   <defs>
    <linearGradient id="mascotSuit" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#8ce8ff"/><stop offset=".6" stopColor="#337ac2"/><stop offset="1" stopColor="#393b91"/></linearGradient>
    <linearGradient id="mascotVisor" x1="0" x2="1"><stop offset="0" stopColor="#112349"/><stop offset="1" stopColor="#162c59"/></linearGradient>
    <linearGradient id="mascotGold" x1="0" x2=".7" y1="0" y2="1"><stop stopColor="#ffefaa"/><stop offset="1" stopColor="#f9a445"/></linearGradient>
   </defs>
   <ellipse cx="110" cy="201" rx="75" ry="9" fill="#051c43" opacity=".6"/>
   <path d="M88 171 L82 190 Q76 202 94 200 L110 190 L128 200 Q144 202 138 190 L132 171" fill="#305ca6" stroke="#092858" strokeWidth="5" strokeLinejoin="round"/>
   <path d="M71 143 L45 150 L35 134 Q18 126 19 146 L29 166 Q34 172 46 170 L77 163" fill="url(#mascotSuit)" stroke="#15366d" strokeWidth="5"/>
   <path d="M149 143 L176 135 L183 118 Q190 108 201 122 Q209 136 193 143 L180 162 L149 164" fill="url(#mascotSuit)" stroke="#15366d" strokeWidth="5"/>
   <rect x="70" y="130" width="80" height="51" rx="23" fill="url(#mascotSuit)" stroke="#14366c" strokeWidth="6"/>
   <path d="M92 156 Q110 163 128 156" fill="none" stroke="#d4faff" strokeWidth="5" strokeLinecap="round"/>
   <rect x="50" y="44" width="120" height="101" rx="32" fill="url(#mascotSuit)" stroke="#102957" strokeWidth="7"/>
   <path d="M59 99 Q59 64 83 59" stroke="#c8f6ff" strokeWidth="9" strokeLinecap="round" opacity=".75" fill="none"/>
   <rect x="65" y="73" width="90" height="63" rx="24" fill="url(#mascotVisor)" stroke="#d9f7ff" strokeWidth="3"/>
   <path d={eyebrow} stroke="#7bf4e6" strokeWidth="3" strokeLinecap="round"/>
   <ellipse cx="92" cy="104" rx="8" ry="12" fill={wins?'#ffda63':'#8fe6ff'}/>
   <ellipse cx="128" cy="104" rx="8" ry="12" fill={wins?'#ffda63':'#8fe6ff'}/>
   <path d={mouth} fill="none" stroke="#8ef0dd" strokeWidth="5" strokeLinecap="round"/>
   <path d="M109 46 L109 30" stroke="#c7efff" strokeWidth="6" strokeLinecap="round"/>
   <circle cx="109" cy="23" r="11" fill="url(#mascotGold)" stroke="#b87d34" strokeWidth="3"/>
   <path d="M72 49 L87 43 M132 43 L147 49" stroke="#edfcff" opacity=".9" strokeWidth="4" strokeLinecap="round"/>
   <circle cx="79" cy="164" r="5" fill="#ffe29d"/>
   <circle cx="142" cy="164" r="5" fill="#ffe29d"/>
   <path d="M67 132 L73 143 M147 143 L153 132" stroke="#102957" strokeWidth="5"/>
   <path d="M41 49 L46 36 L51 49 L64 54 L51 59 L46 72 L41 59 L28 54Z" fill="#ffeab4" opacity={wins?1:.45}/>
   <path d="M170 56 L175 44 L180 56 L192 61 L180 66 L175 79 L170 66 L158 61Z" fill="#8efde4" opacity={wins?1:.45}/>
  </svg>
  <div className="dean-arcade-mascot-base"/>
 </div>;
}
