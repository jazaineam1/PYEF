import React,{useState} from 'react'
import {V2_CHALLENGE_COUNT,V2_ROUNDS,optionsForRound} from './content'
import {SIM_CUSTOMERS,SIM_SEGMENTS,SIM_ECONOMY,SIM_REVEALS} from './simulator-fixtures'
import {ArenaIntro,CohortArena,DagArena,StrategyArena,ResourceArena,RevealArena,ModelBattleResults} from './V2Arcade'

// Independent, honest practice fallback: local state, no authentication and no competitive scoring.
const KEY='campus-v2-arcade-practice-v1'
const blank=()=>({round:1,stage:'choose',answers:{}})
function load(){
 try{const saved=JSON.parse(localStorage.getItem(KEY)||'null');if(saved&&Number.isInteger(saved.round)&&saved.round>=1&&saved.round<=V2_CHALLENGE_COUNT&&['choose','reveal'].includes(saved.stage))return saved}catch{}
 return blank()
}
export default function V2Practice(){
 const[progress,setProgress]=useState(load)
 function update(patch){
  setProgress(old=>{const next={...old,...patch};try{localStorage.setItem(KEY,JSON.stringify(next))}catch{}return next})
 }
 const round=progress.round,template=V2_ROUNDS[round]?.template
 const answer=progress.answers[round]||{},done=progress.stage==='reveal'
 const selected=answer.selected||[]
 const setSelected=id=>update({answers:{...progress.answers,[round]:{...answer,selected:selected.includes(id)?selected.filter(x=>x!==id):[...selected,id]}}})
 const choice=answer.choice||''
 const setChoice=value=>update({answers:{...progress.answers,[round]:{...answer,choice:value}}})
 const policy=answer.choices||Object.fromEntries(SIM_SEGMENTS.map(x=>[x.id,'observe']))
 const setPolicy=(id,value)=>update({answers:{...progress.answers,[round]:{...answer,choices:{...policy,[id]:value}}}})
 const capacity=Number(SIM_ECONOMY.capacity||15000)
 const used=SIM_SEGMENTS.filter(s=>policy[s.id]==='treat').reduce((sum,s)=>sum+Number(s.audience||0),0)
 const canFinish=template==='cohort-selection'?selected.length===3:template==='multi-select'?selected.length>0:template==='segment-policy'?used<=capacity:choice!==''
 const truth=SIM_REVEALS[round]||{}
 const label=['','Selecciona tres estudiantes','Elige la estrategia del experimento','Activa variables en el DAG','Decide cómo aislar el efecto','Reparte los cupos disponibles','Elige el estimador causal'][round]
 return <section className="v2-arcade-practice">
   <div className="v2-arcade-practice-ribbon"><span>🎮 CAMPAÑA LIBRE · SIN BACKEND</span><b>MISIÓN {round} / {V2_CHALLENGE_COUNT}</b></div>
   <div className="v2-alert hint"><span>Modo entrenamiento sin conexión al servidor. Tus elecciones quedan guardadas únicamente en este dispositivo. <b>No se envían evidencias ni se suman puntos al ranking real.</b> Puedes jugar las seis misiones y ver resultados sintéticos de práctica.</span></div>
   <ArenaIntro round={round} mode={done?'reveal':'decision'}/>
   <div className="v2-arcade-practice-question"><small>OBJETIVO DEL NIVEL</small><h2>{V2_ROUNDS[round]?.title}</h2><p>{V2_ROUNDS[round]?.question}</p></div>
   {!done?<>
    <h3 className="v2-arcade-practice-objective">⚡ {label}</h3>
    {template==='cohort-selection'&&<CohortArena rows={SIM_CUSTOMERS.slice(0,12)} selected={selected} max={3} onToggle={setSelected}/>}
    {template==='single-choice'&&<StrategyArena round={round} options={optionsForRound(round)} choice={choice} onChoose={setChoice}/>}
    {template==='multi-select'&&<DagArena selected={selected} onToggle={setSelected}/>}
    {template==='segment-policy'&&<ResourceArena segments={SIM_SEGMENTS} choices={policy} capacity={capacity} onChoose={setPolicy}/>}
    <button type="button" className="v2-primary wide" disabled={!canFinish} onClick={()=>update({stage:'reveal'})}>DESBLOQUEAR RESULTADO DE PRÁCTICA <span aria-hidden="true">⚡</span></button>
   </>:<>
    <RevealArena round={round} truth={truth.true_effect_points} observed={null}/>
    {round===6&&<ModelBattleResults/>}
    <section className="v2-arcade-practice-learn"><small>EL DESAFÍO EXPLICADO</small><strong>{V2_ROUNDS[round]?.wow}</strong><p>{V2_ROUNDS[round]?.takeaway}</p></section>
    {round<V2_CHALLENGE_COUNT?<button type="button" className="v2-primary wide" onClick={()=>update({round:round+1,stage:'choose'})}>SIGUIENTE MISIÓN →</button>:<button type="button" className="v2-primary wide" onClick={()=>{try{localStorage.removeItem(KEY)}catch{}setProgress(blank())}}>🏆 CAMPAÑA COMPLETA · VOLVER A JUGAR</button>}
   </>}
   <div className="v2-arcade-practice-footer"><button className="v2-secondary" type="button" disabled={round===1} onClick={()=>update({round:round-1,stage:'choose'})}>← Volver al nivel anterior</button><button className="v2-secondary" type="button" onClick={()=>{if(window.confirm('¿Reiniciar únicamente tu entrenamiento local? No afecta la partida real.')){try{localStorage.removeItem(KEY)}catch{}setProgress(blank())}}}>↻ Reiniciar entrenamiento</button></div>
 </section>
}
