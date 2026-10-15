// Versioned arcade mechanics. A fictional 14-hour preparation-day budget.
// This differs from the historical weekly-wellness model.
export const ARCADE_PROTOCOL='real_hours_6_v1';
export const ARCADE_EXAMS=6;
export const arcadeExamCount=mode=>mode==='real_hours_10_v1'?10:mode==='real_hours_6_v1'?6:ARCADE_EXAMS;
export const ARCADE_CAP=14;
export const ARCADE_STEP=.5;
export const ARCADE_RANGES=Object.freeze({study:[0,8,4],sleep:[5.5,9,8],wellness:[0,4,2]});
// 6-exam archetypes have different feasible ranges AND different starting strategies.
// We keep the old shared ranges for any already-running 10-exam Cups.
export const ARCADE_ARCHETYPES=Object.freeze({
 over:{label:'Sobreexigido',study:[2,8,6],sleep:[6,8,6.5],wellness:[0,3,1.5]},
 balanced:{label:'Equilibrado',study:[1,6,4],sleep:[7,9,8],wellness:[0,4,2]},
 risk:{label:'En riesgo',study:[0,5,3],sleep:[6,8.5,7],wellness:[0,4,2]},
 pragmatic:{label:'Pragmático',study:[0,5,3],sleep:[7,9,8],wellness:[1,4,3]}
});
export const arcadeRanges=(archetype,mode='real_hours_10_v1')=>
 mode==='real_hours_6_v1'?(ARCADE_ARCHETYPES[archetype]||ARCADE_ARCHETYPES.balanced):ARCADE_RANGES;
const KEYS=['study','sleep','wellness'];
const round=v=>Math.round(v*2)/2;
export function arcadeCost(values){return KEYS.reduce((sum,k)=>sum+Number(values[k]),0)}
export function arcadeDefault(archetype,mode){const limits=arcadeRanges(archetype,mode);return Object.fromEntries(KEYS.map(k=>[k,limits[k][2]]))}
export function arcadeValid(v,archetype,mode){
 const limits=arcadeRanges(archetype,mode);
 return !!v&&KEYS.every(k=>Number.isFinite(v[k])&&v[k]>=limits[k][0]&&v[k]<=limits[k][1]&&
  Math.abs(v[k]*2-Math.round(v[k]*2))<1e-7)&&arcadeCost(v)<=ARCADE_CAP+1e-7;
}
export function rebalanceArcade(values,changed,desired,archetype,mode){
 const limits=arcadeRanges(archetype,mode);
 if(!KEYS.includes(changed))throw Error('Control de horas desconocido');
 const next={...values},[lo,hi]=limits[changed];
 next[changed]=Math.max(lo,Math.min(hi,round(desired)));
 const donors=changed==='study'?['wellness','sleep']:changed==='sleep'?['study','wellness']:['study','sleep'];
 for(const donor of donors){
  while(arcadeCost(next)>ARCADE_CAP+1e-7&&next[donor]>limits[donor][0])next[donor]=round(next[donor]-.5);
 }
 while(arcadeCost(next)>ARCADE_CAP+1e-7&&next[changed]>lo)next[changed]=round(next[changed]-.5);
 if(!arcadeValid(next,archetype,mode))throw Error('No hay horas suficientes');
 return {values:next,sacrificed:donors.filter(k=>next[k]<values[k]).map(k=>({activity:k,hours:round(values[k]-next[k])})),used:arcadeCost(next)};
}
export function arcadeTier(score){
 if(!Number.isFinite(score))return {id:'normal',emoji:'🎯',label:'EXAMEN LISTO',line:'Siguiente ronda'};
 if(score>=46)return {id:'legend',emoji:'🏆',label:'¡ERES UNA MÁQUINA!',line:'¡Rompiste ese parcial!'};
 if(score>=41)return {id:'epic',emoji:'🔥',label:'¡QUÉ ÁSPERO!',line:'Estás intratable'};
 if(score>=33)return {id:'solid',emoji:'⚡',label:'¡VAMOS FINO!',line:'Buenísima jugada'};
 if(score>=25)return {id:'recover',emoji:'🛡️',label:'¡SE DEFENDIÓ!',line:'Tienes otra oportunidad'};
 return {id:'retry',emoji:'💫',label:'¡TOCA REMONTAR!',line:'La siguiente puede cambiarlo todo'};
}
// Stable variety across rounds, never chosen at random and never altering grades.
const arcadeCheers={
 legend:['¡ERES UNA MÁQUINA!','¡MONICAQUILLO, QUÉ NIVEL!','¡MODO LEYENDA!','¡UNA BESTIA!'],
 epic:['¡QUÉ ÁSPERO!','¡HOMBRECILLO, QUÉ JUGADA!','¡ESTÁS INTRATABLE!','¡MUY ÁSPERO!'],
 solid:['¡JUGADÓN!','¡VAS VOLANDO!','¡ESA ES LA ACTITUD!','¡BIEN JUGADO!'],
 recover:['¡TE DEFENDISTE!','¡SIGUES EN LA PELEA!','¡VAMOS POR MÁS!'],
 retry:['¡SE VIENE LA REMONTADA!','¡NO TE RINDAS!','¡OTRO ROUND, OTRA OPORTUNIDAD!']
};
export function arcadeCheer(score,exam){
 const tier=arcadeTier(score);
 const phrases=arcadeCheers[tier.id]||[tier.label];
 const index=Math.max(0,Math.floor(Number(exam)||1)-1)%phrases.length;
 return {...tier,label:phrases[index],stars:score>=46?3:score>=41?2:score>=33?1:0,
  tag:score>=46?'PERFECTO':score>=41?'EXCELENTE':score>=33?'GRAN JUGADA':score>=25?'SIGUES EN JUEGO':'A REMONTAR'};
}
export function arcadeStreak(scores){
 let streak=0;for(let i=scores.length-1;i>=0;i--){if(Number(scores[i])>=40)streak++;else break}return streak;
}
export function arcadeTitle(avg){
 if(avg>=46)return 'LEYENDA';if(avg>=41)return 'MÁQUINA';if(avg>=36)return 'ÁSPERO';if(avg>=30)return 'SÓLIDO';return 'CONTENDIENTE';
}
