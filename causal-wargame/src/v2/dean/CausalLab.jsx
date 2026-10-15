import React,{useState} from 'react';
import{call}from'./api.js';
import{labContent}from'./content.js';
import'./causal-lab.css';

const csvRows=text=>{
 const lines=String(text||'').replace(/^﻿/,'').trim().split(/\r?\n/).filter(Boolean);
 const records=lines.map(line=>line.replace(/^"|"$/g,'').split('","').map(value=>value.replace(/""/g,'"')));
 const header=records.shift()||[];
 return records.map(values=>Object.fromEntries(header.map((h,i)=>[h,values[i]])));
};
const mean=xs=>xs.reduce((a,b)=>a+b,0)/Math.max(1,xs.length);
const variance=xs=>xs.length>1?xs.reduce((a,b)=>a+(b-mean(xs))**2,0)/(xs.length-1):NaN;
const slope=(rows,x,y)=>{
 const valid=rows.map(r=>[Number(r[x]),Number(r[y])]).filter(pair=>pair.every(Number.isFinite));
 if(valid.length<3)return null;
 const mx=mean(valid.map(v=>v[0])),my=mean(valid.map(v=>v[1]));
 const den=valid.reduce((n,v)=>n+(v[0]-mx)**2,0);
 return den>1e-6?valid.reduce((n,v)=>n+(v[0]-mx)*(v[1]-my),0)/den:null
};
function ABFromObserved({rows}){
 const groups=new Map();
 for(const row of rows){
  const id=row.estudiante_id,treated=Number(row.tratamiento);
  if(!groups.has(id))groups.set(id,{treated,points:[]});
  groups.get(id).points.push(Number(row.nota_final));
 }
 const entries=[...groups.values()].map(g=>({...g,score:mean(g.points)}));
 const t=entries.filter(x=>x.treated===1).map(x=>x.score),c=entries.filter(x=>x.treated===0).map(x=>x.score);
 if(t.length<2||c.length<2)return <p>No hay suficientes estudiantes por brazo para calcular el intervalo.</p>;
 const diff=mean(t)-mean(c),se=Math.sqrt(variance(t)/t.length+variance(c)/c.length);
 return <div className="dean-lab-stats"><strong>Diferencia observada: {diff.toFixed(2)} puntos</strong>
  <p>IC 95 % aproximado: [{(diff-1.96*se).toFixed(2)}, {(diff+1.96*se).toFixed(2)}]. Unidad de aleatorización: estudiante, no examen.</p>
  <small>{t.length} estudiantes tratados (4 h) y {c.length} controles (0 h), 15 exámenes por estudiante. Esta diferencia es una estimación; no equivale al efecto individual observado.</small>
 </div>
}
export default function DeanCausalLab({phase,token,version}){
 const [rows,setRows]=useState(null),[layer,setLayer]=useState(''),[error,setError]=useState(''),[loading,setLoading]=useState(false);
 if(version!=='zip_dgp_2026'||!['rector','survey','causal','final','finished'].includes(phase))return null;
 async function calculate(type){
  setLoading(true);setError('');try{
   let records;
   if(type==='ab'){
     const blob=await call('ab_download',{},token);
     records=csvRows(await blob.text());
   }else if(type==='survey'){
     const [rector,survey]=await Promise.all([call('export',{layer:'rector'},token),call('export',{layer:'survey'},token)]);
     const h=csvRows(await rector.text()),sur=csvRows(await survey.text());
     const m=new Map(sur.map(x=>[x.estudiante_id+'|'+x.examen_nro,x]));
     records=h.map(x=>({...x,...m.get(x.estudiante_id+'|'+x.examen_nro)}));
   }else{
     const blob=await call('export',{layer:'rector'},token);
     records=csvRows(await blob.text());
   }
   setRows(records);setLayer(type);
  }catch(e){setError(e.message)}finally{setLoading(false)}
 }
 const[dagH,dagB,dagX,dagS,dagU,dagY]=labContent.dagNodes;
 return <section className="dean-lab" data-testid="dean-causal-lab" aria-label={labContent.ariaLabel}>
  <div className="dean-kicker">{labContent.kicker}</div>
  <h2>{phase==='rector'||phase==='survey'?labContent.titles[phase]:labContent.titles.causal}</h2>
  <p>{phase==='rector'||phase==='survey'?labContent.intros[phase]:labContent.intros.causal}</p>
  <div className="dean-lab-controls">
   <button type="button" disabled={loading} onClick={()=>calculate('rector')}>1 · Analizar Rector</button>
   {phase!=='rector'&&<button type="button" disabled={loading} onClick={()=>calculate('survey')}>2 · Cruzar encuesta</button>}
   {['causal','final','finished'].includes(phase)&&<button type="button" disabled={loading} onClick={()=>calculate('ab')}>3 · Analizar A/B</button>}
  </div>
  {rows&&<div className="dean-lab-stats">
    <b>{rows.length} registros reales del simulador ({layer==='ab'?'experimento A/B':'sala actual'})</b>
    {layer==='ab'?<ABFromObserved rows={rows}/>:<>
      <p>Pendiente simple bienestar → nota: <strong>{slope(rows,'horas_bienestar_sem','nota_final')==null?'No estimable con la variación disponible':slope(rows,'horas_bienestar_sem','nota_final').toFixed(2)+' puntos por hora'}</strong></p>
      {layer==='survey'&&<p>Pendiente simple estudio → nota: <strong>{slope(rows,'horas_estudio','nota_final')==null?'No estimable':slope(rows,'horas_estudio','nota_final').toFixed(2)+' puntos por hora'}</strong></p>}
      <p>¡Ojo! Una pendiente de asociación no identifica por sí sola el efecto de una intervención. El historial y los mediadores importan.</p>
    </>}
  </div>}
  {phase!=='rector'&&<div className="dean-lab-dag" role="img" aria-label={labContent.dagLabel}>
   <span>{dagH}</span><b>→</b><span>{dagB}</span><b>→</b><span>{dagX}</span><b>→</b><span>{dagS}</span><b>→</b><span>{dagU}</span><b>→</b><span>{dagY}</span>
   <small>{labContent.dagNote}</small>
  </div>}
  {error&&<p className="dean-error" role="alert">{error}</p>}
 </section>
}
