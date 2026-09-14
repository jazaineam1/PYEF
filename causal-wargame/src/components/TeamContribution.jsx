import React,{useEffect,useMemo,useState}from'react'
import{CheckCircle2,Send,Users}from'lucide-react'
import{invoke}from'../lib/api'
import{ROLE_FINDINGS,findingLabel}from'../role-findings'
import{ROLE_ARCHETYPES}from'../codex'

const jitter=base=>Math.round(base*(.82+Math.random()*.36))
const compactEvidence=e=>{if(!e||typeof e!=='object')return{};const out={};for(const k of['summary','assumption','decision','details'])if(e[k]!==undefined)out[k]=e[k];return out}
const DEPENDENCIES={
  business:{needs:['data','context','integrator','risk'],text:'Integra efecto, identificación, incertidumbre y restricciones antes de cerrar la decisión.'},
  data:{needs:['business','context'],text:'Necesitas una pregunta causal definida y supuestos de identificación antes de interpretar CATE/uplift como evidencia para decidir.'},
  context:{needs:['business'],text:'Necesitas tratamiento, comparador y outcome claros para defender qué caminos deben bloquearse y qué variables no deben ajustarse.'},
  integrator:{needs:['business','data'],text:'Necesitas outcome/horizonte definidos y saber qué heterogeneidad interesa antes de diseñar la comparación y su precisión.'},
  risk:{needs:['data','context','integrator'],text:'Necesitas magnitud del efecto, validez causal e incertidumbre antes de convertir una estimación en política.'}
}
export function TeamContribution({state,evidence}){
  const role=state.player.role_code,round=state.game.round
  const options=ROLE_FINDINGS?.[round]?.[role]||[]
  const[selected,setSelected]=useState('');const[data,setData]=useState(null);const[busy,setBusy]=useState(false);const[err,setErr]=useState('')
  async function refresh(){try{setData(await invoke('role-contribution',{action:'state'}));setErr('')}catch(e){setErr(e.message)}}
  useEffect(()=>{let stop=false,t;const loop=async()=>{await refresh();if(!stop)t=setTimeout(loop,jitter(5500))};loop();return()=>{stop=true;clearTimeout(t)}},[round])
  const own=useMemo(()=>data?.rows?.find(x=>x.player_id===state.player.id),[data,state.player.id])
  useEffect(()=>{if(own?.finding_code)setSelected(own.finding_code)},[own?.finding_code])
  async function submit(){if(!selected)return;setBusy(true);try{await invoke('role-contribution',{action:'submit',round,finding_code:selected,evidence:compactEvidence(evidence)});await refresh()}catch(e){setErr(e.message)}finally{setBusy(false)}}
  const rows=Object.entries(ROLE_ARCHETYPES).map(([code,meta])=>{const hit=data?.rows?.find(x=>x.role_code===code);return{code,meta,hit}})
  const done=data?.count||0
  const dep=DEPENDENCIES[role]||{needs:[],text:''}
  const dependencyRows=dep.needs.map(code=>({code,meta:ROLE_ARCHETYPES[code],hit:data?.rows?.find(x=>x.role_code===code)}))
  return <div className="team-contribution"><div className="section-title" style={{marginTop:0}}><div><div className="eyebrow">MESA DE EVIDENCIA · 🦁 🦉 🐈‍⬛ 🐢 🦅</div><h3>Cinco especialistas · una sola decisión</h3></div><div className="contribution-count"><Users size={16}/><b>{done}/5</b></div></div><p className="muted-copy">Cada instrumento responde una pregunta distinta. Ninguna tarjeta, por sí sola, basta para justificar la decisión causal del equipo.</p>{dependencyRows.length>0&&<div className="evidence-dependencies"><div><b>{ROLE_ARCHETYPES[role]?.emoji} Tu evidencia depende de otras piezas</b><span>{dep.text}</span></div><div className="dependency-chips">{dependencyRows.map(({code,meta,hit})=><span key={code} className={hit?'ready':'waiting'} title={meta.label}>{meta.emoji} {hit?'lista':'pendiente'}</span>)}</div></div>}{evidence?.summary&&<div className="evidence-preview"><b>{ROLE_ARCHETYPES[role]?.emoji} Tu evidencia actual</b><span>{evidence.summary}</span><small><strong>Supuesto:</strong> {evidence.assumption}</small><small><strong>Qué permite decidir:</strong> {evidence.decision}</small></div>}<div className="finding-options">{options.map(([code,label])=><label className={`finding-choice ${selected===code?'selected':''}`} key={code}><input type="radio" name={`finding-${role}-${round}`} checked={selected===code} onChange={()=>setSelected(code)}/><span>{label}</span></label>)}</div><button className="btn btn-primary" disabled={busy||!selected} onClick={submit}><Send size={15}/>{own?'Actualizar evidencia compartida':'Compartir con el equipo'}</button>{err&&<div className="notice notice-red">{err}</div>}<div className="evidence-war-room">{rows.map(({code,meta,hit})=><article className={`evidence-specialist-card ${hit?'done':'pending'} ${code===role?'current':''}`} key={code} style={{'--role-accent':meta.accent}}><header><span className="evidence-role-emoji" aria-hidden="true">{meta.emoji}</span><div><small>{hit?'EVIDENCIA LISTA':'PENDIENTE'}</small><b>{meta.label}</b></div>{hit&&<CheckCircle2 size={18}/>}</header><div className="evidence-specialist-body"><p className="finding-main">{hit?findingLabel(round,code,hit.finding_code):'Este especialista todavía no ha compartido su pieza de evidencia.'}</p>{hit?.evidence?.summary&&<div className="evidence-piece"><b>Evidencia</b><span>{hit.evidence.summary}</span></div>}{hit?.evidence?.assumption&&<div className="evidence-piece"><b>Supuesto</b><span>{hit.evidence.assumption}</span></div>}{hit?.evidence?.decision&&<div className="evidence-piece"><b>Aporta a la decisión</b><span>{hit.evidence.decision}</span></div>}</div></article>)}</div><div className="evidence-flow-caption"><span>🦁 Define</span><i>→</i><span>🦉 Estima</span><i>→</i><span>🐈‍⬛ Identifica</span><i>→</i><span>🐢 Contrasta</span><i>→</i><span>🦅 Decide política</span></div><div className={`notice ${done>=5?'notice-green':'notice-gold'}`}>{done>=5?'5/5 especialidades dejaron evidencia. Integren ahora las cinco perspectivas antes de bloquear la decisión.':'No es obligatorio esperar 5/5 si alguien tiene un problema técnico. La meta pedagógica es que la decisión no dependa de un solo instrumento.'}</div></div>
}
