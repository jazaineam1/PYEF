import React from 'react'
import {Check,ChevronRight,FlaskConical,GitBranch,Shield,Target,Users,Zap} from 'lucide-react'
import {verifiedV2EconML} from './econml-v2-data'
import './arcade.css'
import{V2_GAME_ART,artForMission}from'./V2Art'

// Gameplay presentation only. Authoritative decisions, timing and scores remain on the V2 server.
const AVATARS=['🧑🏽‍🎓','👩🏻‍🎓','👨🏾‍🎓','👩🏽‍🚀','🧑🏻‍🔬','👩🏾‍💻','🧑‍🎨','👨🏽‍🔬','👩🏼‍🚀','🧑🏿‍💻','👩🏽‍🏫','👨🏻‍🎓']
export const agentFor=id=>AVATARS[[...String(id||'a')].reduce((a,c)=>a+c.charCodeAt(0),0)%AVATARS.length]
const THREATS={1:['🛰️','LA PREDICCIÓN ENGAÑA','Una puntuación alta no garantiza impacto.'],2:['⚗️','CAMPO EXPERIMENTAL','Diseña una comparación, no adivines el resultado.'],3:['🕸️','LA RED INVISIBLE','Una mala variable puede abrir un sesgo.'],4:['🧠','DESACTIVA EL RUIDO','Separa predicción y efecto.'],5:['🎯','RECURSOS LIMITADOS','No todos recibirán apoyo: prioriza.'],6:['🏆','ARENA DE MODELOS','Los algoritmos compiten; la identificación decide.']}
export function ArenaIntro({round,mode='decision',sub}){
 const [emoji,title,desc]=THREATS[round]||THREATS[1]
 return <div className={'v2-arcade-intro mode-'+mode}>
   <div className="v2-arcade-orbit" aria-hidden="true"><span>{emoji}</span><i/><i/></div><img className="v2-arcade-scene-art" src={artForMission(round)} alt="" loading="lazy" decoding="async" aria-hidden="true"/>
   <div className="v2-arcade-intro-copy"><small>CAMPAÑA · NIVEL {String(round).padStart(2,'0')} / 06</small><strong>{title}</strong><p>{sub||desc}</p></div>
   <div className="v2-arcade-stage-tag"><span className="v2-arcade-led"/> {mode==='boss'?'JEFE FINAL':mode==='reveal'?'RESULTADO REVELADO':'TU TURNO'}</div>
 </div>
}
export function CohortArena({rows=[],selected=[],max=3,onToggle,locked=false}){
 return <div className="v2-arcade-game">
  <div className="v2-arcade-hint"><Target size={17}/><span>Selecciona perfiles. Cada carta muestra <b>predicción de aprobación</b>, no efecto causal.</span><strong>{selected.length}/{max} elegidos</strong></div>
  <div className="v2-arcade-agents">{rows.map((c,i)=>{
    const active=selected.includes(c.id)
    const score=Math.max(0,Math.min(100,Math.round(Number(c.score||0)*100)))
    const pga=Number(c.tenure||0)>10?Number(c.tenure||0)/100:Number(c.tenure||0)
    return <button key={c.id} type="button" aria-pressed={active} disabled={locked} className={'v2-arcade-agent '+(active?'is-selected':'')}
       style={{'--agent-delay':Math.min(i,9)*33+'ms'}} onClick={()=>onToggle?.(c.id)}>
      <span className="v2-arcade-agent-top"><small>{c.id}</small><i>{active?'✓':i+1}</i></span>
      <span className="v2-arcade-avatar" aria-hidden="true">{agentFor(c.id)}</span>
      <b>{c.name}</b><span className="v2-arcade-segment">{c.segment}</span>
      <span className="v2-arcade-gauge"><span style={{width:score+'%'}}/></span>
      <span className="v2-arcade-prob">{score}% <small>prob. de aprobar</small></span>
      <span className="v2-arcade-statline">PGA {Number.isFinite(pga)?pga.toFixed(1):'—'} · {Number(c.usage||0)} h · fatiga {Number(c.bugs||0)}/10</span>
      <span className="v2-arcade-agent-action">{active?'EN TU ESCUADRÓN':'TOCA PARA ELEGIR'}</span>
    </button>
  })}</div>
 </div>
}
const dagNodes=[
 {key:'pga_previo',name:'PGA previo',tag:'HISTORIAL',x:16,y:24},
 {key:'complejidad',name:'Complejidad',tag:'CONTEXTO',x:16,y:75},
 {key:'treatment',name:'Programa de apoyo',tag:'INTERVENCIÓN',x:43,y:48,core:true},
 {key:'horas_estudio_post',name:'Estudio posterior',tag:'TRAYECTORIA',x:69,y:20},
 {key:'tutorias_post',name:'Tutorías posteriores',tag:'TRAYECTORIA',x:69,y:78},
 {key:'outcome',name:'Nota final',tag:'RESULTADO',x:91,y:48,core:true},
]
const dagEdges=[
 ['pga_previo','treatment'],['pga_previo','outcome'],
 ['complejidad','treatment'],['complejidad','outcome'],
 ['treatment','outcome'],['treatment','horas_estudio_post'],
 ['treatment','tutorias_post'],['horas_estudio_post','outcome'],['tutorias_post','outcome'],
 ['complejidad','tutorias_post']
]
const findNode=k=>dagNodes.find(x=>x.key===k)
export function DagArena({selected=[],onToggle,locked=false}){
 return <div className="v2-arcade-game">
  <div className="v2-arcade-hint"><GitBranch size={17}/><span>Activa los nodos que incluirías al estimar el <b>efecto total</b> del apoyo. Prueba tu hipótesis.</span><strong>{selected.length} variables</strong></div>
  <div className="v2-arcade-scroll" role="region" aria-label="Tablero DAG causal interactivo" tabIndex={0}>
   <div className="v2-arcade-dag">
    <svg viewBox="0 0 1000 440" className="v2-arcade-dag-lines" aria-hidden="true" focusable="false">
     <defs><marker id="v2-arcade-arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10z" fill="#6cc5dc"/></marker></defs>
     {dagEdges.map(([a,b])=>{const x=findNode(a),y=findNode(b);return <line key={a+'-'+b} x1={x.x*10} y1={x.y*4.4} x2={y.x*10} y2={y.y*4.4} className={selected.includes(a)||selected.includes(b)?'selected':''} markerEnd="url(#v2-arcade-arrow)"/>})}
    </svg>
    {dagNodes.map(n=><button type="button" key={n.key} disabled={locked||n.core} aria-pressed={!n.core?selected.includes(n.key):undefined}
      className={'v2-arcade-dag-node '+(n.core?'core ':'')+(selected.includes(n.key)?'selected':'')}
      style={{left:n.x+'%',top:n.y+'%'}} onClick={()=>!n.core&&onToggle?.(n.key)}>
      <small>{n.tag}</small><strong>{n.name}</strong><span>{n.core?'● NODO FIJO':selected.includes(n.key)?'✓ AJUSTAR':'＋ SELECCIONAR'}</span>
    </button>)}
   </div>
  </div>
  <div className="v2-arcade-explain"><span className="v2-arcade-beacon"/> Estás diseñando un conjunto de ajuste. El laboratorio pondrá a prueba tu decisión; seleccionar más variables no garantiza menos sesgo.</div>
 </div>
}
const ICONS=['🔭','⚗️','🧭','🧠','⚡','🛡️','🌲']
export function StrategyArena({round,options=[],choice,onChoose,locked=false}){
 const isExperiment=round===2,isDml=round===4
 return <div className="v2-arcade-game">
  <div className="v2-arcade-hint">{isExperiment?<FlaskConical size={18}/>:isDml?<Shield size={18}/>:<Zap size={18}/>}
   <span>{isExperiment?'Ajusta la estrategia de la prueba. Un experimento válido permite comparar dos futuros.':isDml?'Elimina el ruido de las predicciones para aislar el efecto.':'Elige tu estrategia. Los resultados de EconML se revelan al finalizar la misión.'}</span>
   <strong>1 elección</strong>
  </div>
  <div className={'v2-arcade-visual v2-arcade-visual-'+round} aria-hidden="true">
   {isExperiment?<><div className="v2-arcade-test-lane"><b>GRUPO A</b><span>🧑‍🎓 👩‍🎓 🧑‍🎓</span><small>sin apoyo</small></div><div className="v2-arcade-center-orb">A/B</div><div className="v2-arcade-test-lane"><b>GRUPO B</b><span>👩‍🎓 🧑‍🎓 👩‍🎓</span><small>con apoyo</small></div></>
    :isDml?<><div className="v2-arcade-flow-cell">VARIABLES <b>X</b></div><ChevronRight size={23}/><div className="v2-arcade-flow-cell">MODELOS <b>Y / T</b></div><ChevronRight size={23}/><div className="v2-arcade-flow-cell">EFECTO <b>τ</b></div></>
    :<><div className="v2-arcade-fighter">🧑🏽‍🔬<small>Estrategia A</small></div><div className="v2-arcade-versus">VS</div><div className="v2-arcade-fighter">🤖<small>Estrategia B</small></div></>}
  </div>
  <div className="v2-arcade-moves">{options.map(([value,label],i)=><button key={value} type="button" className={'v2-arcade-move '+(choice===value?'selected':'')} aria-pressed={choice===value} disabled={locked} onClick={()=>onChoose?.(value)}>
    <span className="v2-arcade-move-icon" aria-hidden="true">{ICONS[i%ICONS.length]}</span><span className="v2-arcade-move-body"><small>ESTRATEGIA {String(i+1).padStart(2,'0')}</small><strong>{label}</strong></span><span className="v2-arcade-move-tick">{choice===value?'✓':'→'}</span>
   </button>)}</div>
 </div>
}
export function ResourceArena({segments=[],choices={},capacity=15000,onChoose,locked=false}){
 const used=segments.filter(s=>choices[s.id]==='treat').reduce((a,s)=>a+Number(s.audience||0),0)
 const percent=Math.min(100,Math.round(used/Math.max(1,capacity)*100)),over=used>capacity
 return <div className="v2-arcade-game">
  <div className="v2-arcade-resource-hud"><div className="v2-arcade-resource-title"><span>🎯 RECURSOS DEL CAMPUS</span><strong>{used.toLocaleString('es-CO')} / {capacity.toLocaleString('es-CO')} cupos</strong></div>
   <div className={'v2-arcade-resource-track '+(over?'over':'')}><div style={{width:percent+'%'}}/></div>
   <p>{over?'⛔ Has sobrepasado la capacidad. Reasigna recursos antes de confirmar.':'Cada decisión usa capacidad real. Las consecuencias causales se revelarán después.'}</p>
  </div>
  <div className="v2-arcade-resource-grid">{segments.map((s,i)=><article className={'v2-arcade-resource-card '+(choices[s.id]==='treat'?'funded':'')} key={s.id}>
   <div className="v2-arcade-resource-heading"><span aria-hidden="true">{AVATARS[(i+3)%AVATARS.length]}</span><div><strong>{s.name}</strong><small>{Number(s.audience||0).toLocaleString('es-CO')} estudiantes · riesgo {s.risk||'—'}</small></div></div>
   <div className="v2-arcade-action-rail" role="group" aria-label={'Estrategia para '+s.name}>
    {[['treat','⚡','Apoyar'],['observe','🔎','Investigar'],['avoid','⏸️','Esperar']].map(([value,icon,name])=><button type="button" key={value} aria-pressed={(choices[s.id]||'observe')===value}
      disabled={locked} className={(choices[s.id]||'observe')===value?'selected':''} onClick={()=>onChoose?.(s.id,value)}><span aria-hidden="true">{icon}</span>{name}</button>)}
   </div>
  </article>)}</div>
 </div>
}
export function BossArena({round,question,options=[],answer,onChange,result,disabled=false}){
 return <div className="v2-arcade-game">
  <ArenaIntro round={round} mode="boss" sub="Tres portales, una decisión. Identifica la estrategia que sobrevive a la evidencia."/>
  <div className="v2-arcade-boss"><div className="v2-arcade-boss-face" aria-hidden="true"><img src={artForMission(round)} alt="" width="120" height="68" loading="lazy" decoding="async"/><span>⚡</span></div><div><small>GUARDIÁN DEL NIVEL</small><strong>{question||'Elige tu jugada y desbloquea la revisión.'}</strong><span>El servidor valida el resultado. No hay puntos inventados.</span></div></div>
  <div className="v2-arcade-moves">{options.map(([value,label],i)=><button key={value} type="button" disabled={disabled||Boolean(result)} aria-pressed={answer===value}
    className={'v2-arcade-move '+(answer===value?'selected':'')} onClick={()=>onChange?.(value)}>
     <span className="v2-arcade-move-icon" aria-hidden="true">{['🚪','🌀','🛡️','🧪'][i%4]}</span><span className="v2-arcade-move-body"><small>PORTAL {i+1}</small><strong>{label}</strong></span><span className="v2-arcade-move-tick">{answer===value?'✓':'→'}</span>
    </button>)}</div>
 </div>
}
export function TeamArena({roster=[],revision=false,value=0,total=0}){
 return <div className="v2-arcade-game"><div className="v2-arcade-hint"><Users size={18}/><span>Los compañeros activan el siguiente nivel. Tu decisión ya quedó registrada.</span><strong>{value}/{total} listos</strong></div>
 <div className="v2-arcade-squad">{roster.map((p,i)=>{const ready=revision?p.revised:p.submitted;return <div className={'v2-arcade-squad-card '+(ready?'ready':'')} key={p.id||i}><span aria-hidden="true">{agentFor(p.id||p.name)}</span><strong>{p.name}</strong><small>{ready?'✓ LISTO':'◌ EN MISIÓN'}</small></div>})}</div>
 </div>
}
export function RevealArena({round,truth,observed}){
 return <div className="v2-arcade-reveal"><div className="v2-arcade-reveal-medal" aria-hidden="true"><img src={V2_GAME_ART.victory} alt="" width="140" height="79" loading="lazy" decoding="async"/></div>
  <div><small>REVELACIÓN DESBLOQUEADA · NIVEL {round}/6</small><strong>{truth!=null?'Efecto causal verdadero: '+new Intl.NumberFormat('es-CO',{maximumFractionDigits:2}).format(Number(truth))+' puntos':'La evidencia cambia la estrategia'}</strong>
   <p>{truth!=null?'Resultado calculado con los resultados potenciales del simulador sintético.':'El conocimiento ganado en este reto se conserva para tu siguiente decisión.'}</p>
   {observed!=null&&<span>Diferencia observada: {Number(observed).toFixed(2)} puntos · no equivale automáticamente al efecto verdadero</span>}
  </div>
 </div>
}
export function ModelBattleResults(){
 if(!verifiedV2EconML)return <p className="v2-arcade-explain">El artefacto EconML no está verificado; no se muestran métricas inventadas.</p>
 const items=[['T-Learner','t_learner','🧠'],['DR-Learner','dr_learner','🛡️'],['CausalForestDML','causal_forest','🌲']]
 const nums=items.map(x=>Number(verifiedV2EconML.metrics?.[x[1]]?.cate_rmse_points)).filter(Number.isFinite)
 const largest=Math.max(1,...nums)
 return <section className="v2-arcade-model-results"><h3>🏆 Arena EconML · resultados realmente ejecutados</h3><p>Error de CATE sobre 500 observaciones reservadas del escenario sintético. Menor es mejor; no prueba identificación causal.</p>
  {items.map(([name,key,icon])=>{const v=verifiedV2EconML.metrics?.[key]?.cate_rmse_points;if(!Number.isFinite(Number(v)))return null;return <div key={key} className="v2-arcade-model-row"><span>{icon} {name}</span><div className="v2-arcade-model-track"><i style={{width:Math.max(3,Number(v)/largest*100)+'%'}}/></div><strong>{Number(v).toFixed(3)} pts</strong></div>})}
  <small>EconML {verifiedV2EconML.provenance?.econml_version||'0.16.0'} · cálculos fuera del navegador · evidencia trazable</small>
 </section>
}
