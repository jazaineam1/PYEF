// Observational statistics only: never interpret these as do(B) estimands.
const toNum=v=>v===null||v===''||v===undefined?NaN:Number(v);
export function summaries(rows){
 const pairs=(rows||[]).map(r=>({b:toNum(r.horas_bienestar_sem),y:toNum(r.nota_final),
  h:toNum(r.pga_previo),z:toNum(r.complejidad),
  study:toNum(r.horas_estudio),sleep:toNum(r.horas_sueno)}))
 .filter(p=>Number.isFinite(p.b)&&Number.isFinite(p.y));
 if(pairs.length<3)return {n:pairs.length,r:null,raw:null,pre:null,post:null,points:pairs};
 const mean=key=>pairs.reduce((s,r)=>s+r[key],0)/pairs.length;
 const mb=mean('b'),my=mean('y');
 const sbb=pairs.reduce((s,p)=>s+(p.b-mb)**2,0);
 const syy=pairs.reduce((s,p)=>s+(p.y-my)**2,0);
 const sby=pairs.reduce((s,p)=>s+(p.b-mb)*(p.y-my),0);
 return {n:pairs.length,students:new Set((rows||[]).map(r=>r.estudiante_id).filter(Boolean)).size,
  r:sbb>1e-8&&syy>1e-8?sby/Math.sqrt(sbb*syy):null,
  raw:sbb>1e-8?sby/sbb:null,
  pre:olsB(pairs,['b','h','z']),
  post:olsB(pairs,['b','h','z','study','sleep']),
  points:pairs,meanB:mb,meanY:my};
}
function olsB(data,features){
 const valid=data.filter(row=>features.every(f=>Number.isFinite(row[f]))&&Number.isFinite(row.y));
 if(valid.length<=features.length)return null;
 const k=features.length+1, gram=Array.from({length:k},()=>Array(k).fill(0)),
 rhs=Array(k).fill(0);
 for(const row of valid){
  const x=[1,...features.map(f=>row[f])];
  for(let i=0;i<k;i++){rhs[i]+=x[i]*row.y;for(let j=0;j<k;j++)gram[i][j]+=x[i]*x[j]}
 }
 const matrix=gram.map((line,i)=>[...line,rhs[i]]);
 for(let c=0;c<k;c++){
  let best=c;for(let i=c+1;i<k;i++)if(Math.abs(matrix[i][c])>Math.abs(matrix[best][c]))best=i;
  if(Math.abs(matrix[best][c])<1e-8)return null;
  [matrix[c],matrix[best]]=[matrix[best],matrix[c]];
  const pivot=matrix[c][c];
  for(let j=c;j<=k;j++)matrix[c][j]/=pivot;
  for(let i=0;i<k;i++)if(i!==c){const ratio=matrix[i][c];
   for(let j=c;j<=k;j++)matrix[i][j]-=ratio*matrix[c][j]}
 }
 return Number.isFinite(matrix[1][k])?matrix[1][k]:null;
}
export const ZIP_REFERENCE=Object.freeze({
 label:'Referencia externa del ZIP original, cohorte piloto de 25 estudiantes × 15 exámenes',
 n:375,students:25,r:-0.468,raw:-3.258,pre:-0.786,post:-2.788,
 ab:{students:25,treated:14,control:11,estimate:-6.46,ciLow:-14.724,ciHigh:1.804,
 trueATE:1.799,treatedPga:3.304,controlPga:3.899}
});
