import React,{useMemo,useState}from'react'
import{CheckCircle2,Eye,RotateCcw,Users,Sparkles,Trophy}from'lucide-react'
import{V2_MISSION,V2_ROUNDS}from'./content'
import{EvidenceLab,RevealVisuals}from'./VisualTools'

const PLAYERS=['Ana','Luis','Camila','Juan']
const ECONOMY={renewal_value_cop:200000,intervention_cost_cop:8000,cohort_size:1000,capacity:15000}
const copShort=n=>new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',notation:'compact',maximumFractionDigits:1}).format(Number(n||0))

const customers=Array.from({length:24},(_,i)=>{
  const n=i+1,score=Math.min(.93,.34+((n*11)%56)/100)
  return{id:`S${String(n).padStart(2,'0')}`,name:`Cohorte demo ${String(n).padStart(2,'0')}`,segment:['Digital','Mixto','Tradicional','Premium'][n%4],score,usage:20+((n*13)%76),bugs:(n*3)%8,discount:(n*7)%31,tenure:6+((n*5)%48),cohort_size:1000,shap:[{feature:'Uso',impact:((n*3)%8)-2},{feature:'Incidentes',impact:((n*5)%7)-2},{feature:'Descuento',impact:2-((n*4)%6)}]}
})

const segments=[
  {id:'digital',name:'Digitales',audience:7000,risk:'Bajo',value:200000,cost:8000},
  {id:'middle',name:'Ingreso medio',audience:8000,risk:'Medio',value:200000,cost:8000},
  {id:'traditional',name:'Tradicionales',audience:5000,risk:'Medio',value:200000,cost:8000},
  {id:'wealth',name:'Patrimonio alto',audience:2500,risk:'Bajo',value:200000,cost:8000},
  {id:'arrears',name:'Mora alta',audience:4000,risk:'Alto',value:200000,cost:8000}
]

const trueSegments=[
  {...segments[0],effect_pp:13.5,ci_low:9,ci_high:18,incremental_value_cop:133000000},
  {...segments[1],effect_pp:9,ci_low:5,ci_high:13,incremental_value_cop:80000000},
  {...segments[2],effect_pp:3,ci_low:-2,ci_high:8,incremental_value_cop:-10000000},
  {...segments[3],effect_pp:1,ci_low:-3,ci_high:4,incremental_value_cop:-15000000},
  {...segments[4],effect_pp:-5,ci_low:-9,ci_high:-1,incremental_value_cop:-72000000}
]

const mlTraining=Array.from({length:300},(_,k)=>{
  const i=k+1,usage=10+((i*37)%86),bugs=(i*7)%9,discount=(i*11)%31,tenure=3+((i*13)%60)
  const z=-3.4+.045*usage-.16*bugs+.035*discount+.025*tenure
  const p=1/(1+Math.exp(-z)),u=((i*97+31)%991)/991
  return{usage,bugs,discount,tenure,renewed:u<p?1:0}
})

const observational=Array.from({length:800},(_,k)=>{
  const i=k+1,risk=1+((i*7)%4),usage=15+((i*19)%80),tenure=4+((i*23)%55)
  const tp=[0,.18,.35,.72,.90][risk],treated=((i*37+17)%997)/997<tp
  const p0=Math.max(.08,Math.min(.82,.68-.12*risk+.0015*usage+.001*tenure))
  const y=((i*101+53)%991)/991<Math.min(.95,p0+(treated?.10:0))
  return{risk,usage,tenure,treated,renewed:y?1:0}
})

const experiment=Array.from({length:900},(_,k)=>{
  const i=k+1,z=(i%100)/100
  let segment,effect,pbase
  if(z<.28){segment='digital';effect=.135;pbase=.38}
  else if(z<.58){segment='middle';effect=.09;pbase=.43}
  else if(z<.76){segment='traditional';effect=.03;pbase=.49}
  else if(z<.85){segment='wealth';effect=.01;pbase=.62}
  else{segment='arrears';effect=-.05;pbase=.25}
  const usage=15+((i*17)%80),tenure=4+((i*23)%55)
  const p0=Math.max(.05,Math.min(.9,pbase+.0007*(usage-50)+.0005*(tenure-25)))
  const treated=((i*43+11)%997)/997<.5
  const y=((i*137+71)%991)/991<Math.min(.95,Math.max(.02,p0+(treated?effect:0)))
  return{segment,usage,tenure,treated,renewed:y?1:0}
})

const SIM_ANALYSIS={
  1:{team_tools:{feature_summary:[{feature:'Uso',mean_abs:2.6},{feature:'Incidentes reportados',mean_abs:1.7},{feature:'Descuento',mean_abs:1.2}],ml_training:mlTraining},reveal_tools:{score_uplift:customers.map((c,i)=>{const uplift=[.14,.04,.20,-.05,.09,.02,.12,.01][i%8],p0=Math.min(.76,.25+((i*7)%40)/100);return{...c,p0,p1:Math.max(.02,Math.min(.96,p0+uplift)),uplift_pp:uplift*100,incremental_value_cop:(uplift*200000-8000)*1000}})}},
  2:{team_tools:{observational_rows:observational,dag:{nodes:[{id:'risk',label:'Riesgo previo'},{id:'treat',label:'Intervención'},{id:'outcome',label:'Renovación'},{id:'mediator',label:'Uso posterior'},{id:'collider',label:'Ticket resuelto'}],edges:[{from:'risk',to:'treat',kind:'confounding'},{from:'risk',to:'outcome',kind:'confounding'},{from:'treat',to:'outcome',kind:'causal'},{from:'treat',to:'mediator',kind:'causal'},{from:'mediator',to:'outcome',kind:'causal'},{from:'treat',to:'collider',kind:'warning'},{from:'risk',to:'collider',kind:'warning'}],adjust_options:[{id:'none',label:'No ajustar',good:false,highlights:[],explanation:'El backdoor permanece abierto.'},{id:'risk',label:'Ajustar por riesgo previo',good:true,highlights:['risk'],explanation:'Cierra el principal camino de confusión.'},{id:'mediator',label:'Ajustar por uso posterior',good:false,highlights:['mediator'],explanation:'Es posterior al tratamiento.'},{id:'collider',label:'Ajustar por ticket resuelto',good:false,highlights:['collider'],explanation:'Puede abrir una asociación espuria.'}]}}},
  3:{team_tools:{experiment_rows:experiment,segments:segments.map(s=>({id:s.id,name:s.name,audience:s.audience,risk:s.risk,value_per_result:200000,unit_cost:8000})),economy:ECONOMY,precision_curve:[{n:200,mde_pp:12.2,ci_half_pp:8.6},{n:500,mde_pp:7.7,ci_half_pp:5.5},{n:1000,mde_pp:5.5,ci_half_pp:3.9},{n:2000,mde_pp:3.9,ci_half_pp:2.8},{n:5000,mde_pp:2.5,ci_half_pp:1.8}],econml:[{segment:'digital',name:'Digitales',t_learner:12.8,dr_learner:13.4,causal_forest:13.7},{segment:'middle',name:'Ingreso medio',t_learner:8.4,dr_learner:9.1,causal_forest:9.5},{segment:'traditional',name:'Tradicionales',t_learner:2.1,dr_learner:3.2,causal_forest:4.0},{segment:'wealth',name:'Patrimonio alto',t_learner:.5,dr_learner:1.2,causal_forest:1.5},{segment:'arrears',name:'Mora alta',t_learner:-4.2,dr_learner:-5.1,causal_forest:-5.6}],placebo:{effect_pp:4.7,ci_low:1.5,ci_high:7.9,message:'Un outcome previo no debería responder a una intervención futura.'}},reveal_tools:{experiment:{treatment_rate:49,control_rate:43,ate_pp:6},segments:trueSegments,placebo:{effect_pp:4.7,ci_low:1.5,ci_high:7.9,message:'Ejemplo docente: la señal placebo obliga a discutir robustez.'}}}
}

function Packet({round,player}){
  const rows=round===3?segments.filter((_,i)=>i%4===player):customers.filter((_,i)=>i%4===player)
  return <div className={round===3?'v2-segments':'v2-grid customers'}>{rows.map(c=>round===3?<article key={c.id}><div><h3>{c.name}</h3><small>{c.audience.toLocaleString()} clientes</small></div><div><b>{copShort(c.value)}</b><small>valor renovación</small></div></article>:<article className="v2-customer" key={c.id}><div className="v2-card-top"><span>{c.id}</span></div><h3>{c.name}</h3>{round===1&&<><div className="v2-score">{Math.round(c.score*100)}%</div><small>prob. estimada</small></>}{round===2&&<div className="v2-history"><span>Riesgo previo <b>{1+(Number(c.id.slice(1))%4)}/4</b></span><span>{Number(c.id.slice(1))%3?'Intervenido':'No intervenido'}</span></div>}</article>)}</div>
}

export default function V2Simulator(){
  const[round,setRound]=useState(1),[player,setPlayer]=useState(0)
  const[submitted,setSubmitted]=useState([false,false,false,false])
  const[revised,setRevised]=useState([false,false,false,false])
  const[teamLocked,setTeamLocked]=useState(false),[reveal,setReveal]=useState(false)
  const r=V2_ROUNDS[round],all=submitted.every(Boolean),allRevised=revised.every(Boolean)
  const teamPool=round===3?segments:customers
  const state=useMemo(()=>({team_pool:teamPool,economy:ECONOMY,team_decision:{payload:{selected:customers.slice(0,10).map(c=>c.id)}}}),[round])
  function setR(x){setRound(x);setPlayer(0);setSubmitted([false,false,false,false]);setRevised([false,false,false,false]);setTeamLocked(false);setReveal(false)}
  function reset(){setSubmitted([false,false,false,false]);setRevised([false,false,false,false]);setTeamLocked(false);setReveal(false)}

  return <main className="v2-shell"><div className="v2-fac"><div className="v2-wall-top"><div><div className="v2-brand">DOS FUTUROS <span>V2 SIMULADOR</span></div><div className="v2-kicker">ENSAYO DOCENTE · SIN BACKEND</div></div><button className="v2-secondary" onClick={reset}><RotateCcw size={15}/> Reiniciar misión</button></div>
    <section className="v2-panel" style={{marginTop:18}}><div className="v2-alert hint">Los datos de este simulador son ilustrativos y deliberadamente distintos de la partida en vivo.</div><h2>{V2_MISSION.title}</h2><p>{V2_MISSION.subtitle}</p><div className="v2-rule-row">{V2_MISSION.rules.map((x,i)=><div key={x}><b>{i+1}</b><span>{x}</span></div>)}</div></section>
    <div className="v2-sim-tabs">{[1,2,3].map(x=><button key={x} className={round===x?'active':''} onClick={()=>setR(x)}>Misión {x}</button>)}</div>
    <section className="v2-mission"><div className="v2-kicker">{r.kicker}</div><h1>{r.title}</h1><p>{r.case}</p></section>
    <div className="v2-fac-grid">
      <section className="v2-panel"><div className="v2-step"><b>1 · DECISIONES INDIVIDUALES</b><span>Primero deciden sin el laboratorio.</span></div><div className="v2-sim-tabs">{PLAYERS.map((name,i)=><button key={name} className={player===i?'active':''} onClick={()=>setPlayer(i)}>{submitted[i]?'✓ ':''}{name}</button>)}</div><h2>{PLAYERS[player]}</h2><p>{r.individual}</p><Packet round={round} player={player}/><button className="v2-primary wide" disabled={submitted[player]} onClick={()=>setSubmitted(s=>s.map((v,i)=>i===player?true:v))}>{submitted[player]?'Inicial enviada':'Simular decisión inicial'}</button></section>

      <section className="v2-panel"><div className="v2-step"><b>2 · EVIDENCIA Y REVISIÓN</b><span>Python sólo aparece cuando todos enviaron la primera decisión.</span></div><div className="v2-team-roster">{PLAYERS.map((name,i)=><div className={submitted[i]?'ready':'waiting'} key={name}><span>{submitted[i]?'✓':'…'}</span>{name}</div>)}</div>{!all?<div className="v2-alert">Laboratorio bloqueado hasta completar 4/4 decisiones iniciales.</div>:<><EvidenceLab round={round} state={state} analysis={SIM_ANALYSIS[round]}/><div className="v2-sim-tabs">{PLAYERS.map((name,i)=><button key={name} className={revised[i]?'active':''} onClick={()=>setRevised(s=>s.map((v,j)=>j===i?true:v))}>{revised[i]?'✓ ':''}{name}</button>)}</div><p>{r.revise}</p>{!allRevised&&<div className="v2-alert"><Users size={18}/><span>{revised.filter(Boolean).length}/4 decisiones revisadas.</span></div>}</>}

        {allRevised&&<button className="v2-primary wide" disabled={teamLocked} onClick={()=>setTeamLocked(true)}>{teamLocked?'Política registrada':'Simular política final del equipo'}</button>}
        {teamLocked&&<button className="v2-secondary" style={{width:'100%',justifyContent:'center'}} onClick={()=>setReveal(true)}><Eye size={16}/> Mostrar reveal</button>}
        {reveal&&<><section className="v2-scoreboard-mini"><div className="v2-scoreboard-title"><Trophy size={18}/><b>VALOR</b><span>ejemplo en COP</span></div><div className="v2-scoreboard-rows">{[['Fisher',213000000],['Neyman',168000000],['Rubin',121000000],['Pearl',87000000]].map((x,i)=><div key={x[0]}><span className="rank">{i+1}</span><strong>{x[0]}</strong><div className="v2-scorebar"><i style={{width:(x[1]/213000000*100)+'%'}}/></div><b>{copShort(x[1])}</b></div>)}</div></section><section className="v2-wow"><div className="v2-wow-badge"><Sparkles size={16}/> GIRO WOW</div><strong>{r.wow}</strong><p>{r.reality}</p></section><RevealVisuals round={round} state={state} analysis={SIM_ANALYSIS[round]}/><div className="v2-teach"><div className="v2-kicker">CONCEPTO QUE APARECE DESPUÉS DE DECIDIR</div><h2>{r.concept}</h2><p>{r.takeaway}</p>{round===1&&<div className="v2-alert"><CheckCircle2 size={18}/><span>La predicción puede ser buena y la decisión de intervención seguir siendo mala si no estimamos el cambio causado.</span></div>}</div></>}
      </section>
    </div>
  </div></main>
}
