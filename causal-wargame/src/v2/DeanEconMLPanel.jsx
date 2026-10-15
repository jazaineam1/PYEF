import React from 'react';
import benchmark from './econml-dean-verified.json' with {type:'json'};

export default function DeanEconMLPanel(){
 const valid=benchmark?.status==='verified' && benchmark?.provenance?.dgp==='zip_dgp_2026' &&
   Array.isArray(benchmark.segments)&&benchmark.segments.length===4&&
   ['t_learner','dr_learner','causal_forest'].every(k=>Number.isFinite(benchmark.metrics?.[k]?.cate_rmse_points));
 return <details className="dean-science" aria-label="Comparación de estimadores EconML">
  <summary>🌲 Comparar estimadores causales EconML <span>{valid?'BENCHMARK REAL · PRECOMPUTADO':'ENTRENAMIENTO PENDIENTE'}</span></summary>
  <div className="dean-science-body">
   {valid?<><p>Estos modelos se entrenaron en CPython/EconML, con datos sintéticos del mismo generador ESTRUCTURAL de la Copa; no se ejecutaron en el navegador. Los ruidos NumPy no son idénticos al generador determinista SQL. Las métricas provienen de un conjunto reservado de estudiantes.</p>
    <div className="dean-econml-compare">
     {['t_learner','dr_learner','causal_forest'].map(k=><div key={k}>
      <b>{({t_learner:'T-Learner',dr_learner:'DR-Learner',causal_forest:'Causal Forest DML'})[k]}</b>
      <strong>RMSE de CATE: {benchmark.metrics[k].cate_rmse_points} pts</strong>
      <small>Error medio frente a efectos potenciales del DGP sintético (holdout)</small>
     </div>)}
    </div>
    <p>Heterogeneidad condicionada: {benchmark.segments.map(s=>s.segment+': '+s.causal_forest).join(' · ')}. Son efectos medios estimados por perfil, NO efectos individuales observados.</p>
    <small>Origen: {benchmark.provenance.source}; semilla {benchmark.provenance.seed}; estudiantes de prueba {benchmark.provenance.holdout_students}; SHA256 {benchmark.provenance.data_sha256}.</small>
   </>:<p>El entrenamiento reproducible de la Copa todavía no está verificado. No se muestran números ficticios ni resultados de otra simulación como si fueran de esta partida. Continúa con el A/B y el cálculo DML de Pyodide, ambos independientes del benchmark.</p>}
   <p><b>Regla científica:</b> ningún algoritmo identifica efectos sin un diseño válido, comparabilidad y supuestos. El menor RMSE sintético no prueba validez externa.</p>
  </div>
 </details>
}
