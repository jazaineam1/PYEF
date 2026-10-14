import React from 'react'
import {verifiedV2EconML} from './econml-v2-data.js'

const modelNames={t_learner:'T-Learner',dr_learner:'DR-Learner',causal_forest:'CausalForestDML'}
const fmt=x=>Number(x).toLocaleString('es-CO',{minimumFractionDigits:2,maximumFractionDigits:2})
export default function EconMLV2Panel(){
  const report=verifiedV2EconML
  if(!report)return <section className="v2-tool" aria-live="polite"><div className="v2-kicker">ECONML V2</div><h2>Benchmark no disponible todavía</h2><p>Solo se muestran métricas producidas por un entrenamiento real y verificado.</p></section>
  const models=Object.keys(modelNames)
  const maxError=Math.max(1,...models.map(k=>report.metrics[k].cate_rmse_points))
  return <section className="v2-tool v2-econml-report" aria-label="Resultados EconML reales de CAMPUS V2">
    <div className="v2-kicker">ENTRENADO Y EVALUADO · ECONML REAL · SOLO V2</div>
    <h2>¿Qué estimador recupera mejor el efecto causal por perfil?</h2>
    <p>TLearner, DRLearner y CausalForestDML se ajustaron en Python 3.11 sobre el experimento académico sintético. Aquí exploramos sus estimaciones reservadas.</p>
    <div className="v2-econml-meta">
      <span>EconML {report.provenance.econml_version}</span>
      <span>{report.provenance.train_rows} entrenamiento</span>
      <span>{report.provenance.holdout_rows} validación</span>
      <span>Semilla {report.provenance.seed}</span>
    </div>
    <div className="v2-econml-scroll">
      <table className="v2-econml-table">
        <thead><tr><th>Perfil académico</th>{models.map(k=><th key={k}>{modelNames[k]}</th>)}</tr></thead>
        <tbody>{report.segments.map(s=><tr key={s.segment}><th>{s.name}</th>{models.map(k=><td key={k}>{fmt(s[k])} pt</td>)}</tr>)}</tbody>
      </table>
    </div>
    <div className="v2-econml-metrics">{models.map(k=>{
      const score=report.metrics[k].cate_rmse_points
      return <article className={k===report.best_holdout_rmse?'winner':''} key={k}>
        <span>{modelNames[k]} · Error CATE (RMSE)</span>
        <strong>{fmt(score)} puntos</strong>
        <div className="v2-econml-track"><i style={{width:(100*score/maxError)+'%'}}/></div>
      </article>
    })}</div>
    <p className="v2-econml-note">Menor error en este holdout: <b>{modelNames[report.best_holdout_rmse]}</b>. Los valores son estimaciones: un algoritmo no reemplaza aleatorización, controles adecuados ni validación. EconML no se está ejecutando en el navegador.</p>
  </section>
}
