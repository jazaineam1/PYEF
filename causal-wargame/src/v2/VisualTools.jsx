import React,{useState}from'react'
import{PythonEvidenceLab}from'./PythonEvidenceLab'

const num=x=>Number(x||0)
const pp=x=>`${num(x)>0?'+':''}${num(x).toFixed(Math.abs(num(x))<10?1:0)} pp`
const pct=x=>`${Math.round(num(x)*100)}%`

export function ToolFrame({kicker='HERRAMIENTA DE ANÁLISIS',title,question,children,footer}){
  return <section className="v2-tool"><div className="v2-tool-head"><div><div className="v2-kicker">{kicker}</div><h2>{title}</h2></div>{question&&<div className="v2-tool-question">{question}</div>}</div>{children}{footer&&<p className="v2-tool-footer">{footer}</p>}</section>
}

export function MiniShapBars({items=[]}){
  const max=Math.max(1,...items.map(x=>Math.abs(num(x.impact))))
  return <div className="v2-mini-shap">{items.slice(0,4).map(x=>{const v=num(x.impact),w=Math.max(5,Math.abs(v)/max*100);return <div key={x.feature} className="v2-mini-shap-row"><span>{x.feature}</span><div className="v2-mini-shap-track"><i className={v>=0?'pos':'neg'} style={{width:`${w}%`}}/></div><b>{v>0?'+':''}{v}</b></div>})}</div>
}

export function PopulationShapChart({summary=[]}){
  const rows=[...summary].sort((a,b)=>num(b.mean_abs)-num(a.mean_abs))
  const max=Math.max(1,...rows.map(x=>num(x.mean_abs)))
  return <ToolFrame title="Qué está usando el modelo" question="¿Qué variables empujan la predicción?" footer="Esto explica el modelo predictivo. Todavía no responde qué variable causaría un cambio si la intervenimos."><div className="v2-hbars">{rows.map(x=><div className="v2-hbar-row" key={x.feature}><span>{x.feature}</span><div className="v2-hbar-track"><i style={{width:`${num(x.mean_abs)/max*100}%`}}/></div><b>{num(x.mean_abs).toFixed(2)}</b></div>)}</div></ToolFrame>
}

export function ScoreUpliftChart({points=[],selectedId,onSelect}){
  const W=680,H=340,pad={l:58,r:24,t:28,b:48}
  const xs=points.map(p=>num(p.score)),ys=points.map(p=>num(p.uplift_pp))
  const xmin=Math.min(.2,...xs),xmax=Math.max(.95,...xs),ymin=Math.min(-8,...ys),ymax=Math.max(22,...ys)
  const sx=x=>pad.l+(x-xmin)/(xmax-xmin||1)*(W-pad.l-pad.r)
  const sy=y=>H-pad.b-(y-ymin)/(ymax-ymin||1)*(H-pad.t-pad.b)
  return <ToolFrame kicker="REVEAL VISUAL" title="Score predictivo vs efecto incremental" question="¿Los clientes con mayor score son quienes más cambian por la intervención?" footer="Cada punto es un cliente. La línea horizontal marca efecto cero."><svg className="v2-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Score predictivo versus uplift causal"><line className="axis" x1={pad.l} y1={H-pad.b} x2={W-pad.r} y2={H-pad.b}/><line className="axis" x1={pad.l} y1={pad.t} x2={pad.l} y2={H-pad.b}/><line className="zero" x1={pad.l} y1={sy(0)} x2={W-pad.r} y2={sy(0)}/>{[.3,.5,.7,.9].map(t=><g key={t}><line className="tick" x1={sx(t)} y1={H-pad.b} x2={sx(t)} y2={H-pad.b+5}/><text x={sx(t)} y={H-18} textAnchor="middle">{Math.round(t*100)}%</text></g>)}{[ymin,0,10,20].filter((v,i,a)=>v>=ymin&&v<=ymax&&a.indexOf(v)===i).map(t=><g key={t}><line className="tick" x1={pad.l-5} y1={sy(t)} x2={pad.l} y2={sy(t)}/><text x={pad.l-10} y={sy(t)+4} textAnchor="end">{t}</text></g>)}{points.map(p=><g key={p.id} className={selectedId===p.id?'point selected':'point'} onClick={()=>onSelect?.(p.id)}><circle cx={sx(num(p.score))} cy={sy(num(p.uplift_pp))} r={selectedId===p.id?8:6}/><title>{p.id}: score {pct(p.score)} · uplift {pp(p.uplift_pp)}</title></g>)}<text className="axis-label" x={(pad.l+W-pad.r)/2} y={H-2} textAnchor="middle">Score predictivo</text><text className="axis-label" transform={`translate(15 ${(pad.t+H-pad.b)/2}) rotate(-90)`} textAnchor="middle">Efecto incremental (pp)</text></svg></ToolFrame>
}

export function TwoFuturesPanel({customer}){
  if(!customer)return null
  const p0=num(customer.p0),p1=num(customer.p1),u=num(customer.uplift_pp)
  return <ToolFrame kicker="DOS FUTUROS" title={`${customer.id} · ${customer.name||'cliente'}`} question="Para la misma persona sólo observamos uno de estos futuros."><div className="v2-futures"><div><span>Sin intervención · Y(0)</span><div className="v2-future-bar"><i style={{width:`${p0*100}%`}}/></div><b>{pct(p0)}</b></div><div><span>Con intervención · Y(1)</span><div className="v2-future-bar alt"><i style={{width:`${p1*100}%`}}/></div><b>{pct(p1)}</b></div><div className={u>=0?'v2-uplift positive':'v2-uplift negative'}><small>Efecto incremental</small><strong>{pp(u)}</strong></div></div></ToolFrame>
}

export function DagLab({dag}){
  const options=dag?.adjust_options||[]
  const[choice,setChoice]=useState(options[0]?.id||'none')
  const selected=options.find(x=>x.id===choice)||options[0]
  const nodes=dag?.nodes||[]
  const pos={risk:[90,90],treat:[330,70],outcome:[570,90],mediator:[330,230],collider:[570,230]}
  return <ToolFrame title="DAG Lab" question="¿Qué variable debes ajustar para cerrar el camino de confusión sin abrir otro problema?"><div className="v2-dag-wrap"><svg className="v2-dag" viewBox="0 0 660 300">{(dag?.edges||[]).map((e,i)=>{const a=pos[e.from],b=pos[e.to];if(!a||!b)return null;return <g key={i}><line className={e.kind||''} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]}/><polygon points={`${b[0]},${b[1]} ${b[0]-12},${b[1]-6} ${b[0]-12},${b[1]+6}`}/></g>})}{nodes.map(n=>{const p=pos[n.id]||[0,0];return <g key={n.id} className={selected?.highlights?.includes(n.id)?'dag-node active':'dag-node'}><rect x={p[0]-62} y={p[1]-24} width="124" height="48" rx="14"/><text x={p[0]} y={p[1]+5} textAnchor="middle">{n.label}</text></g>})}</svg><div className="v2-dag-options">{options.map(o=><button key={o.id} className={choice===o.id?'selected':''} onClick={()=>setChoice(o.id)}>{o.label}</button>)}</div>{selected&&<div className={selected.good?'v2-alert good':'v2-alert warn'}><b>{selected.good?'Comparación más defendible':'Cuidado'}</b><span>{selected.explanation}</span></div>}</div></ToolFrame>
}

function bins(values=[],count=10){const out=Array.from({length:count},()=>0);for(const raw of values){const v=Math.max(0,Math.min(.999,num(raw)));out[Math.min(count-1,Math.floor(v*count))]++}return out}
export function OverlapChart({treated=[],control=[]}){
  const a=bins(treated),b=bins(control),max=Math.max(1,...a,...b)
  return <ToolFrame title="Overlap / soporte común" question="¿Existen tratados y controles comparables en los mismos perfiles?" footer="Cuando una zona tiene casi sólo tratados o casi sólo controles, el contrafactual depende más de extrapolación."><div className="v2-overlap-legend"><span><i className="treated"/>Tratados</span><span><i className="control"/>Control</span></div><div className="v2-overlap">{a.map((v,i)=><div className="v2-overlap-bin" key={i}><div className="v2-overlap-bars"><i className="treated" style={{height:`${v/max*100}%`}}/><i className="control" style={{height:`${b[i]/max*100}%`}}/></div><small>{(i/10).toFixed(1)}</small></div>)}</div><div className="v2-overlap-axis"><span>0 · casi nunca tratado</span><span>Propensity score</span><span>1 · casi siempre tratado</span></div></ToolFrame>
}

export function RawAdjustedPanel({estimates=[]}){
  const max=Math.max(1,...estimates.map(x=>Math.abs(num(x.value))))
  return <ToolFrame title="La historia cambia al comparar mejor" question="¿La diferencia cruda cuenta la misma historia que los análisis ajustados?"><div className="v2-effect-bars">{estimates.map(x=>{const v=num(x.value);return <div key={x.label}><span>{x.label}</span><div className="v2-effect-track"><i className={v>=0?'pos':'neg'} style={{width:`${Math.abs(v)/max*48}%`,left:v>=0?'50%':`${50-Math.abs(v)/max*48}%`}}/><em/></div><b>{pp(v)}</b></div>})}</div></ToolFrame>
}

export function BalancePanel({rows=[]}){
  return <ToolFrame title="Balance antes y después" question="¿Tratados y controles se parecen en variables previas?"><div className="v2-balance"><div className="head"><b>Variable</b><b>Antes</b><b>Después</b></div>{rows.map(r=><div key={r.name}><span>{r.name}</span><b className={Math.abs(num(r.before))>.1?'bad':'good'}>{num(r.before).toFixed(2)}</b><b className={Math.abs(num(r.after))>.1?'bad':'good'}>{num(r.after).toFixed(2)}</b></div>)}</div><small className="v2-tool-note">Diferencia estandarizada absoluta: valores cercanos a 0 indican mejor balance.</small></ToolFrame>
}

export function PrecisionSimulator({curve=[],threshold=2}){
  const[idx,setIdx]=useState(Math.min(2,Math.max(0,curve.length-1)))
  const row=curve[idx]||{}
  const W=600,H=220,p=34,maxN=Math.max(1,...curve.map(x=>num(x.n))),maxM=Math.max(threshold,...curve.map(x=>num(x.mde_pp)))
  const sx=x=>p+num(x)/maxN*(W-p*2),sy=y=>H-p-num(y)/maxM*(H-p*2)
  const path=curve.map((x,i)=>`${i?'L':'M'} ${sx(x.n)} ${sy(x.mde_pp)}`).join(' ')
  return <ToolFrame title="N vs precisión" question="¿Tu experimento puede detectar un efecto lo bastante pequeño como para importar?"><svg className="v2-chart precision" viewBox={`0 0 ${W} ${H}`}><line className="axis" x1={p} y1={H-p} x2={W-p} y2={H-p}/><line className="axis" x1={p} y1={p} x2={p} y2={H-p}/><line className="threshold" x1={p} y1={sy(threshold)} x2={W-p} y2={sy(threshold)}/><path className="curve" d={path}/>{curve.map((x,i)=><circle className={i===idx?'curve-point selected':'curve-point'} key={x.n} cx={sx(x.n)} cy={sy(x.mde_pp)} r={i===idx?7:5}/>)}</svg><input className="v2-range" type="range" min="0" max={Math.max(0,curve.length-1)} value={idx} onChange={e=>setIdx(Number(e.target.value))}/><div className="v2-metric-grid"><div><span>N total</span><b>{Number(row.n||0).toLocaleString()}</b></div><div><span>MDE</span><b>{pp(row.mde_pp)}</b></div><div><span>IC esperado</span><b>±{num(row.ci_half_pp).toFixed(1)} pp</b></div><div className={num(row.mde_pp)<=threshold?'good':'warn'}><span>Umbral negocio</span><b>{pp(threshold)}</b></div></div><p className="v2-tool-footer">Mover N estrecha la incertidumbre. No cambia si la regla de asignación está sesgada.</p></ToolFrame>
}

export function TreatmentControlCI({result}){
  if(!result)return null
  const t=num(result.treatment_rate),c=num(result.control_rate),ate=num(result.ate_pp),lo=num(result.ci_low),hi=num(result.ci_high)
  return <ToolFrame kicker="RESULTADO EXPERIMENTAL" title="Tratamiento vs control" question="¿El efecto es suficientemente preciso para decidir?"><div className="v2-tc-bars"><div><span>Tratamiento</span><div className="v2-vertical"><i style={{height:`${t}%`}}/></div><b>{t}%</b></div><div><span>Control</span><div className="v2-vertical control"><i style={{height:`${c}%`}}/></div><b>{c}%</b></div></div><div className="v2-ci"><div className="v2-ci-line"><i style={{left:`${Math.max(0,(lo+10)/30*100)}%`,width:`${Math.max(2,(hi-lo)/30*100)}%`}}/><b style={{left:`${Math.max(0,(ate+10)/30*100)}%`}}/></div><div className="v2-ci-labels"><span>-10 pp</span><strong>ATE {pp(ate)} · IC95% [{lo}, {hi}]</strong><span>+20 pp</span></div></div></ToolFrame>
}

export function CateForestPlot({segments=[]}){
  const lo=Math.min(-10,...segments.map(s=>num(s.ci_low))),hi=Math.max(20,...segments.map(s=>num(s.ci_high)))
  const scale=x=>(num(x)-lo)/(hi-lo||1)*100
  return <ToolFrame title="CATE por segmento" question="¿El promedio esconde personas que responden distinto?"><div className="v2-forest">{segments.map(s=><div key={s.id||s.name}><span>{s.name}</span><div className="v2-forest-track"><em style={{left:`${scale(0)}%`}}/><i style={{left:`${scale(s.ci_low)}%`,width:`${Math.max(1,scale(s.ci_high)-scale(s.ci_low))}%`}}/><b style={{left:`${scale(s.effect??s.effect_pp)}%`}}/></div><strong>{pp(s.effect??s.effect_pp)}</strong></div>)}</div><div className="v2-forest-axis"><span>{lo} pp</span><span>0</span><span>+{hi} pp</span></div></ToolFrame>
}

export function EconMLCompare({rows=[]}){
  const models=['t_learner','dr_learner','causal_forest']
  const labels={t_learner:'T-Learner',dr_learner:'DR-Learner',causal_forest:'CausalForestDML'}
  const lo=-8,hi=18,scale=x=>(num(x)-lo)/(hi-lo)*100
  return <ToolFrame title="Comparador de estimadores causales" question="¿Los modelos cuentan una historia parecida o dependen demasiado del estimador?" footer="Estimaciones precomputadas sobre el escenario sintético. El acuerdo entre modelos no reemplaza una estrategia de identificación."><div className="v2-model-legend">{models.map(m=><span key={m} className={m}><i/>{labels[m]}</span>)}</div><div className="v2-model-compare">{rows.map(r=><div key={r.segment}><span>{r.name||r.segment}</span><div className="v2-model-track"><em style={{left:`${scale(0)}%`}}/>{models.map(m=><i key={m} className={m} style={{left:`${scale(r[m])}%`}} title={`${labels[m]}: ${pp(r[m])}`}/>)}</div></div>)}</div></ToolFrame>
}

export function PlaceboPanel({placebo}){
  if(!placebo)return null
  const suspicious=num(placebo.ci_low)>0||num(placebo.ci_high)<0
  return <ToolFrame title="Prueba de falsificación" question="¿Tu pipeline encuentra un efecto donde causalmente no debería existir?"><div className={suspicious?'v2-placebo suspicious':'v2-placebo'}><div><span>Outcome placebo</span><strong>{pp(placebo.effect_pp)}</strong><small>IC95% [{placebo.ci_low}, {placebo.ci_high}]</small></div><p>{placebo.message}</p></div></ToolFrame>
}

export function PolicyMeter({segments=[],choices={},capacity=15000}){
  const treated=segments.filter(s=>choices[s.id]==='treat')
  const used=treated.reduce((a,s)=>a+num(s.audience),0)
  const value=treated.reduce((a,s)=>a+(num(s.effect??s.effect_pp)/100*num(s.audience)*num(s.value??s.value_per_result)-num(s.audience)*num(s.cost??s.unit_cost)),0)
  return <div className="v2-policy-meter"><div><span>Capacidad</span><b>{used.toLocaleString()} / {capacity.toLocaleString()}</b><div className="v2-capacity"><i style={{width:`${Math.min(100,used/capacity*100)}%`}}/></div></div><div><span>Valor incremental estimado</span><b>{Math.round(value).toLocaleString()}</b></div><div><span>Segmentos tratados</span><b>{treated.length}</b></div></div>
}

function EvidenceTabs({items=[]}){
  const[active,setActive]=useState(0)
  if(!items.length)return null
  const item=items[Math.min(active,items.length-1)]
  return <div className="v2-evidence-deck"><div className="v2-evidence-tabs" role="tablist" aria-label="Herramientas de evidencia">{items.map((x,i)=><button type="button" key={x.label} className={active===i?'active':''} onClick={()=>setActive(i)}><b>{i+1}</b><span>{x.label}</span></button>)}</div><div className="v2-evidence-panel">{item.node}</div><div className="v2-evidence-nav"><button type="button" disabled={active===0} onClick={()=>setActive(x=>Math.max(0,x-1))}>← anterior</button><span>{active+1}/{items.length}</span><button type="button" disabled={active===items.length-1} onClick={()=>setActive(x=>Math.min(items.length-1,x+1))}>siguiente →</button></div></div>
}

export function EvidenceLab({round,state,analysis}){
  const tools=analysis?.team_tools
  if(!tools)return null
  const pool=state?.team_pool||[]
  const scoreDistribution=<ToolFrame title="Distribución de scores" question="¿La confianza del modelo es lo mismo que impacto?"><div className="v2-score-rug">{[...pool].sort((a,b)=>num(a.score)-num(b.score)).map(c=><i key={c.id} style={{left:`${num(c.score)*100}%`}} title={`${c.id} · ${pct(c.score)}`}/>)}</div><div className="v2-score-rug-axis"><span>0%</span><span>Score predictivo</span><span>100%</span></div><p className="v2-tool-footer">Todavía no conoces Y(0) y Y(1). No conviertas esta gráfica en una afirmación causal.</p></ToolFrame>
  const visualItems=round===1?[
    {label:'SHAP',node:<PopulationShapChart summary={tools.feature_summary||[]}/>},
    {label:'Scores',node:scoreDistribution}
  ]:round===2?[
    {label:'DAG',node:<DagLab dag={tools.dag}/>},
    {label:'Crudo vs ajustado',node:<RawAdjustedPanel estimates={tools.estimates||[]}/>},
    {label:'Overlap',node:<OverlapChart treated={tools.overlap?.treated||[]} control={tools.overlap?.control||[]}/>},
    {label:'Balance',node:<BalancePanel rows={tools.balance||[]}/>}
  ]:round===3?[
    {label:'N vs precisión',node:<PrecisionSimulator curve={tools.precision_curve||[]} threshold={num(tools.business_threshold_pp||2)}/>}
  ]:[
    {label:'CATE',node:<CateForestPlot segments={state.team_pool||[]}/>},
    {label:'EconML',node:<EconMLCompare rows={tools.econml||[]}/>},
    {label:'Placebo',node:<PlaceboPanel placebo={tools.placebo}/>}
  ]
  const pythonItem={label:'Python',node:<PythonEvidenceLab round={round} state={state} analysis={analysis}/>}
  const items=[...visualItems.slice(0,1),pythonItem,...visualItems.slice(1)]
  return <section className="v2-evidence-lab"><div className="v2-step compact"><b>PASO 2.5 · INVESTIGUEN</b><span>Una herramienta a la vez. Pueden mirar la evidencia o ejecutar Python antes de cambiar su decisión.</span></div><EvidenceTabs items={items}/></section>
}

function Round1RevealTools({state,reveal}){
  const points=reveal?.score_uplift||[]
  const first=points.find(p=>state.team_decision?.payload?.selected?.includes(p.id))?.id||points[0]?.id||''
  const[selected,setSelected]=useState(first)
  const c=points.find(p=>p.id===selected)||points[0]
  return <div className="v2-tools-grid reveal-tools"><ScoreUpliftChart points={points} selectedId={selected} onSelect={setSelected}/><TwoFuturesPanel customer={c}/></div>
}

export function RevealVisuals({round,state,analysis}){
  const reveal=analysis?.reveal_tools
  if(!reveal)return null
  if(round===1)return <Round1RevealTools state={state} reveal={reveal}/>
  if(round===3)return <TreatmentControlCI result={reveal.experiment}/>
  if(round===4)return <div className="v2-tools-grid reveal-tools"><CateForestPlot segments={reveal.segments||[]} /><PlaceboPanel placebo={reveal.placebo}/></div>
  return null
}
