// Trampa predictiva experiencial de la Copa del Decano (lógica pura, probada con node --test).
// El participante simula do(B) con un Random Forest, anota su recomendación y, en el acto A/B,
// la contrasta con el ATE del experimento. NADA de esto se puntúa, se mide en tiempo ni contiene
// claves de respuesta: son notas personales guardadas solo en el navegador del participante.
import {TRAP_RESULT_PREFIX} from './dean-science-programs.js';

export {TRAP_RESULT_PREFIX};
export const TRAP_MODES=Object.freeze(['rector','survey']);
export const NOTE_MAX_LENGTH=280;
export const SYNTHETIC_LABEL='SINTÉTICO · simulación predictiva sobre datos de un generador artificial; no son personas reales.';

export const RECOMMENDATIONS=Object.freeze([
 {id:'recortar',label:'Recortar o congelar el presupuesto de bienestar',hint:'Lo que sugiere leer solo la importancia o una simulación plana.'},
 {id:'mantener',label:'Mantenerlo igual: este modelo no me alcanza para decidir',hint:'Prudencia sin diseño: aún no sabes qué haría el experimento.'},
 {id:'ampliar',label:'Ampliarlo: el modelo predice mejora',hint:'Lo que sugiere leer una simulación positiva como si fuera efecto.'},
 {id:'experimentar',label:'Pedir un experimento antes de decidir',hint:'Reconoce que la predicción no identifica el efecto de intervenir.'}
]);
const RECOMMENDATION_IDS=new Set(RECOMMENDATIONS.map(r=>r.id));

const finite=v=>typeof v==='number'&&Number.isFinite(v);
const count=v=>Number.isInteger(v)&&v>=0;

// Valida el JSON impreso por el programa Python. Devuelve null ante cualquier campo dudoso.
export function validateTrapResult(raw){
 if(!raw||typeof raw!=='object')return null;
 if(!TRAP_MODES.includes(raw.modo)||!['sala','referencia'].includes(raw.origen))return null;
 for(const key of ['ate_sim','p10','p90','mae','r2','cov_bajo','cov_alto','b_relativa'])if(!finite(raw[key]))return null;
 if(!count(raw.n_estudiantes)||!count(raw.n_filas))return null;
 if(raw.p10>raw.p90)return null;
 return {
  modo:raw.modo,origen:raw.origen,ate_sim:raw.ate_sim,p10:raw.p10,p90:raw.p90,
  mae:raw.mae,r2:raw.r2,cov_bajo:raw.cov_bajo,cov_alto:raw.cov_alto,b_relativa:raw.b_relativa,
  top:typeof raw.top==='string'?raw.top.slice(0,40):'',
  n_estudiantes:raw.n_estudiantes,n_filas:raw.n_filas,
  mediadores_congelados:raw.mediadores_congelados===true
 };
}

// Separa la línea «##RESULT {json}» del texto que ve el participante.
export function extractTrapResult(output){
 const lines=String(output??'').split(/\r?\n/);
 let result=null;
 const visible=[];
 for(const line of lines){
  if(line.startsWith(TRAP_RESULT_PREFIX)){
   try{result=validateTrapResult(JSON.parse(line.slice(TRAP_RESULT_PREFIX.length)))}catch{result=null}
  }else visible.push(line);
 }
 return {text:visible.join('\n').replace(/\n+$/,''),result};
}

const memory=new Map();
export const memoryStorage={getItem:key=>memory.has(key)?memory.get(key):null,setItem:(key,value)=>{memory.set(key,String(value))}};
export function browserStorage(){
 try{const s=globalThis.localStorage;if(!s)return memoryStorage;s.getItem('cw-dean-trap-probe');return s}
 catch{return memoryStorage}
}
export const trapStorageKey=gameCode=>'cw-dean-trap-'+String(gameCode||'FUTUROS').trim().toUpperCase();

export function cleanNote(text){
 return String(text??'').replace(/[\u0000-\u001f\u007f]+/g,' ').replace(/\s+/g,' ').trim().slice(0,NOTE_MAX_LENGTH);
}

export function readTrapNotes(storage,gameCode){
 const empty={rector:{},survey:{}};
 try{
  const parsed=JSON.parse(storage.getItem(trapStorageKey(gameCode))||'null');
  if(!parsed||typeof parsed!=='object')return empty;
  const notes={rector:{},survey:{}};
  for(const mode of TRAP_MODES){
   const entry=parsed[mode];
   if(!entry||typeof entry!=='object')continue;
   const prediction=validateTrapResult(entry.prediction);
   if(prediction&&prediction.modo===mode)notes[mode].prediction=prediction;
   const rec=entry.recommendation;
   if(rec&&RECOMMENDATION_IDS.has(rec.choice))notes[mode].recommendation={choice:rec.choice,note:cleanNote(rec.note)};
  }
  return notes;
 }catch{return empty}
}

function writeTrapNotes(storage,gameCode,notes){
 try{storage.setItem(trapStorageKey(gameCode),JSON.stringify({v:1,...notes}));return true}
 catch{return false}
}

// Cada ejecución sobrescribe la predicción del acto y descarta una recomendación de otra ejecución distinta.
export function saveTrapPrediction(storage,gameCode,result){
 const prediction=validateTrapResult(result);
 if(!prediction)return null;
 const notes=readTrapNotes(storage,gameCode);
 const previous=notes[prediction.modo].prediction;
 const same=previous&&previous.ate_sim===prediction.ate_sim&&previous.origen===prediction.origen;
 notes[prediction.modo]=same?{...notes[prediction.modo],prediction}:{prediction};
 writeTrapNotes(storage,gameCode,notes);
 return notes;
}

export function saveTrapRecommendation(storage,gameCode,mode,{choice,note=''}){
 if(!TRAP_MODES.includes(mode)||!RECOMMENDATION_IDS.has(choice))return null;
 const notes=readTrapNotes(storage,gameCode);
 if(!notes[mode].prediction)return null;
 notes[mode].recommendation={choice,note:cleanNote(note)};
 writeTrapNotes(storage,gameCode,notes);
 return notes;
}

const mean=xs=>xs.reduce((a,b)=>a+b,0)/xs.length;
const sampleVariance=xs=>{const m=mean(xs);return xs.reduce((a,b)=>a+(b-m)**2,0)/(xs.length-1)};

// ATE observado del A/B: se promedia por ESTUDIANTE (unidad aleatorizada) antes de comparar brazos.
export function abEstimate(rows){
 const people=new Map();
 for(const row of rows||[]){
  const id=String(row?.estudiante_id??'').trim();
  const arm=Number(row?.tratamiento),score=Number(row?.nota_final);
  if(!id||![0,1].includes(arm)||!Number.isFinite(score))continue;
  if(!people.has(id))people.set(id,{arm,scores:[]});
  people.get(id).scores.push(score);
 }
 const scoreByArm=arm=>[...people.values()].filter(p=>p.arm===arm).map(p=>mean(p.scores));
 const treated=scoreByArm(1),control=scoreByArm(0);
 if(treated.length<2||control.length<2)return null;
 const diff=mean(treated)-mean(control);
 const se=Math.sqrt(sampleVariance(treated)/treated.length+sampleVariance(control)/control.length);
 return {diff,se,ciLow:diff-1.96*se,ciHigh:diff+1.96*se,treated:treated.length,control:control.length};
}

const signOf=value=>Math.abs(value)<0.05?0:Math.sign(value);

// Contrasta la simulación do(B) del participante con el experimento. Nunca declara «correcta» a la simulación.
export function contrastPrediction(prediction,ab){
 if(!validateTrapResult(prediction)||!ab||![ab.diff,ab.ciLow,ab.ciHigh].every(finite))return null;
 const inside=prediction.ate_sim>=ab.ciLow&&prediction.ate_sim<=ab.ciHigh;
 const width=ab.ciHigh-ab.ciLow;
 const bootstrapOverlapsCI=prediction.p90>=ab.ciLow&&prediction.p10<=ab.ciHigh;
 const sameSign=signOf(prediction.ate_sim)===signOf(ab.diff);
 let verdict;
 if(!inside)verdict='La simulación cae FUERA del IC95 del experimento: el modelo predictivo no recuperó el efecto de intervenir.';
 else if(width>=6)verdict='La simulación cae DENTRO del IC95, pero ese IC es muy amplio (±'+(width/2).toFixed(1)+' pts): no valida el modelo, solo no logra descartarlo.';
 else verdict='La simulación cae dentro del IC95 del experimento. Coincidir una vez no demuestra que el método identifique el efecto: depende de supuestos que el A/B sí garantiza por diseño.';
 return {predicted:prediction.ate_sim,observed:ab.diff,ciLow:ab.ciLow,ciHigh:ab.ciHigh,width,gap:prediction.ate_sim-ab.diff,
  inside,sameSign,bootstrapOverlapsCI,verdict,
  frozenNote:prediction.mediadores_congelados?'Con estudio y sueño fijos, la simulación conserva solo el efecto de B que no pasa por esos mediadores.':'',
  referenceNote:prediction.origen==='referencia'?'Tu simulación usó la REFERENCIA DIDÁCTICA (menos de 4 estudiantes con variación en tu sala), no tus exámenes.':''};
}
