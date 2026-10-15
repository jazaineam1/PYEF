// Versioned arcade mechanics. A fictional 14-hour preparation-day budget.
// This differs from the historical weekly-wellness model.
export const ARCADE_PROTOCOL='real_hours_10_v1';
export const ARCADE_EXAMS=10;
export const ARCADE_CAP=14;
export const ARCADE_STEP=.5;
export const ARCADE_RANGES=Object.freeze({study:[0,8,4],sleep:[5.5,9,8],wellness:[0,4,2]});
const KEYS=['study','sleep','wellness'];
const round=v=>Math.round(v*2)/2;
export function arcadeCost(values){return KEYS.reduce((sum,k)=>sum+Number(values[k]),0)}
export function arcadeDefault(){return Object.fromEntries(KEYS.map(k=>[k,ARCADE_RANGES[k][2]]))}
export function arcadeValid(v){
 return !!v&&KEYS.every(k=>Number.isFinite(v[k])&&v[k]>=ARCADE_RANGES[k][0]&&v[k]<=ARCADE_RANGES[k][1]&&
  Math.abs(v[k]*2-Math.round(v[k]*2))<1e-7)&&arcadeCost(v)<=ARCADE_CAP+1e-7;
}
export function rebalanceArcade(values,changed,desired){
 if(!KEYS.includes(changed))throw Error('Control de horas desconocido');
 const next={...values},[lo,hi]=ARCADE_RANGES[changed];
 next[changed]=Math.max(lo,Math.min(hi,round(desired)));
 const donors=changed==='study'?['wellness','sleep']:changed==='sleep'?['study','wellness']:['study','sleep'];
 for(const donor of donors){
  while(arcadeCost(next)>ARCADE_CAP+1e-7&&next[donor]>ARCADE_RANGES[donor][0])next[donor]=round(next[donor]-.5);
 }
 while(arcadeCost(next)>ARCADE_CAP+1e-7&&next[changed]>lo)next[changed]=round(next[changed]-.5);
 if(!arcadeValid(next))throw Error('No hay horas suficientes');
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
// Stable variety across ten exams, never chosen at random and never altering grades.
const arcadeCheers={
 legend:['¡ERES UNA MÁQUINA!','¡MONIQUILLO, QUÉ NIVEL!','¡MODO LEYENDA!','¡UNA BESTIA!'],
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
