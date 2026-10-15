// Agenda V2: virtual decision resources, NOT a literal 24-hour day.
// Hours of one exam, one night, and weekly wellness have different units.
// Convert each configurable range into 0-4 game tokens; cap the sum at six.
// The original scorer.py / fatigue.py / DGP equations remain untouched.
export const AGENDA_CAP=6;
export const AGENDA_UNIT_RANGE=4;
export const CANONICAL_RANGES={
 over:[[8,14,11.5],[2,5,3.5],[0,1.5,0.6]],
 balanced:[[4,8,6],[6.5,8.5,7.5],[1.5,3.5,2.5]],
 risk:[[2,5.5,3.5],[4.5,7,6],[1.5,4,2.5]],
 pragmatic:[[0.5,3.5,1.5],[7,9.5,8.5],[3.5,6,4.8]]
};
const KEYS=['study','sleep','wellness'];
const idx={study:0,sleep:1,wellness:2};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const rounded=v=>Math.round(v*1e5)/1e5;
export function agendaCost(values,archetype){
 const ranges=CANONICAL_RANGES[archetype];
 if(!ranges)throw Error('Arquetipo desconocido');
 return rounded(KEYS.reduce((sum,key)=>{
  const [lo,hi]=ranges[idx[key]];
  return sum+AGENDA_UNIT_RANGE*(Number(values[key])-lo)/(hi-lo);
 },0));
}
export function agendaValid(values,archetype){
 const ranges=CANONICAL_RANGES[archetype];
 return !!ranges&&KEYS.every(key=>Number.isFinite(values[key])&&values[key]>=ranges[idx[key]][0]-1e-7&&values[key]<=ranges[idx[key]][1]+1e-7)
  &&agendaCost(values,archetype)<=AGENDA_CAP+1e-5;
}
export function agendaDefault(archetype){
 const ranges=CANONICAL_RANGES[archetype];
 if(!ranges)throw Error('Arquetipo desconocido');
 return Object.fromEntries(KEYS.map((key,i)=>[key,ranges[i][2]]));
}
export function rebalanceAgenda(values,archetype,changed,desired){
 const ranges=CANONICAL_RANGES[archetype];
 if(!ranges||!KEYS.includes(changed))throw Error('Decisión desconocida');
 const next={...values};
 const [lo,hi]=ranges[idx[changed]];
 next[changed]=rounded(clamp(Number(desired),lo,hi));
 const priority=changed==='study'?['sleep','wellness']:changed==='sleep'?['study','wellness']:['study','sleep'];
 for(const donor of priority){
  const donorLo=ranges[idx[donor]][0];
  // 0.5 source hours per step, distinct from the six virtual budget tokens.
  while(agendaCost(next,archetype)>AGENDA_CAP+1e-5&&next[donor]>donorLo+1e-5)
   next[donor]=rounded(Math.max(donorLo,next[donor]-0.5));
 }
 while(agendaCost(next,archetype)>AGENDA_CAP+1e-5&&next[changed]>lo+1e-5)
  next[changed]=rounded(Math.max(lo,next[changed]-0.5));
 if(!agendaValid(next,archetype))throw Error('La agenda no pudo cuadrarse');
 const delta=KEYS.filter(key=>key!==changed&&next[key]<values[key]-1e-5)
  .map(key=>({activity:key,hours:rounded(values[key]-next[key])}));
 return {values:next,sacrificed:delta,used:agendaCost(next,archetype)};
}
