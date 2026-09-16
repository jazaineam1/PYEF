import React,{useEffect,useMemo,useState}from'react'
import{CheckCircle2,Send,Users}from'lucide-react'
import{invoke}from'../lib/api'
import{ROLE_FINDINGS,findingLabel}from'../role-findings'
import{CORE_ROLE_CODES,ROLE_ARCHETYPES}from'../codex'
import{assessWarRoom,effectiveEvidenceByRole}from'../causal-integration'
import{teamMode}from'../team-roles'
import{ExperimentCoverageTool}from'./AdaptiveCoverageTools'

const jitter=base=>Math.round(base*(.82+Math.random()*.36))
const compactEvidence=e=>{if(!e||typeof e!=='object')return{};const out={};for(const k of['summary','assumption','decision','details'])if(e[k]!==undefined)out[k]=e[k];return out}
const DEPENDENCIES={
  business:{needs:['data','context','integrator'],text:'Tu cierre necesita estimación, identificación e incertidumbre. Define el contrato y en R4 conviértelo, junto con costo/capacidad/riesgo, en una política factible.'},
  data:{needs:['business','context'],text:'Necesitas una pregunta causal definida y una identificación defendible antes de interpretar CATE/uplift como evidencia para decidir.'},
  context:{needs:['business'],text:'Necesitas tratamiento, comparador y outcome claros para defender qué caminos deben bloquearse y qué variables no deben ajustarse.'},
  integrator:{needs:['business','data'],text:'Necesitas outcome/horizonte definidos y saber qué heterogeneidad interesa antes de diseñar la comparación y su precisión.'},
  risk:{needs:['business','data','context','integrator'],text:'Rol legado de sesiones antiguas; las partidas nuevas integran esta función dentro de Decisión y Política.'}
}
const CHECK_ICON={ready:'✓',warn:'⚠',pending:'…',block:'✕'}
const CHECK_CLASS={ready:'notice-green',warn:'notice-gold',pending:'notice-gold',block:'notice-red'}
export function TeamContribution({state,evidence}){
  const role=state.player.role_code,round=state.game.round
  const mode=teamMode(state.team_roster||[])
  const options=ROLE_FINDINGS?.[round]?.[role]||[]
  const[selected,setSelected]=useState('');const[data,setData]=useState(null);const[busy,setBusy]=useState(false);const[err,setErr]=useState('')
  const[experimentCoverage,setExperimentCoverage]=useState(null)
  useEffect(()=>{setExperimentCoverage(null)},[role,round])
  async function refresh(){try{setData(await invoke('role-contribution',{action:'state'}));setErr('')}catch(e){setErr(e.message)}}
  useEffect(()=>{let stop=false,t;const loop=async()=>{await refresh();if(!stop)t=setTimeout(loop,jitter(5500))};loop();return()=>{stop=true;clearTimeout(t)}},[round])
  const directRows=data?.rows||[]
  const effective=useMemo(()=>effectiveEvidenceByRole(directRows),[directRows])
  const own=useMemo(()=>directRows.find(x=>x.player_id===state.player.id),[directRows,state.player.id])
  useEffect(()=>{if(own?.finding_code)setSelected(own.finding_code)},[own?.finding_code])
  const submissionEvidence=useMemo(()=>{
    const base=compactEvidence(evidence),details={...(base.details||{})};let summary=base.summary||'',assumption=base.assumption||'',decision=base.decision||''
    if(role==='data'&&mode.fallbackExperiment&&experimentCoverage){details.coverage={...(details.coverage||{}),integrator:compactEvidence(experimentCoverage)};summary=`${summary}${summary?' · ':''}Doble sombrero Experimentos: ${experimentCoverage.summary||'evidencia preparada'}`;decision=`${decision}${decision?' · ':''}${experimentCoverage.decision||''}`}
    return{summary,assumption,decision,details}
  },[evidence,experimentCoverage,role,mode.fallbackExperiment])
  async function submit(){if(!selected)return;setBusy(true);try{await invoke('role-contribution',{action:'submit',round,finding_code:selected,evidence:submissionEvidence});await refresh()}catch(e){setErr(e.message)}finally{setBusy(false)}}
  const coreRows=CORE_ROLE_CODES.map(code=>({code,meta:ROLE_ARCHETYPES[code],hit:effective[code]}))
  const doneCore=coreRows.filter(x=>x.hit).length
  const dep=DEPENDENCIES[role]||{needs:[],text:''}
  const dependencyRows=dep.needs.map(code=>({code,meta:ROLE_ARCHETYPES[code],hit:effective[code]}))
  const integration=useMemo(()=>assessWarRoom(directRows,round),[directRows,round])
  const integrationCopy=integration.status==='coherent'?'Coherencia causal defendible':integration.status==='blocked'?'Hay contradicciones que resolver':'Integración todavía incompleta'
  const firstBlock=integration.checks.find(x=>x.status==='block')
  return <div className="team-contribution"><div className="section-title" style={{marginTop:0}}><div><div className="eyebrow">MESA DE EVIDENCIA · 🦁 🦉 🐈‍⬛ 🐢</div><h3>Cuatro especialistas · una sola decisión</h3></div><div className="contribution-count"><Users size={16}/><b>{doneCore}/4</b></div></div><p className="muted-copy">Cada herramienta produce una pieza distinta. Ninguna basta por sí sola: contrato/política, identificación, estimación y experimento deben contar la misma historia antes de bloquear la decisión.</p>{mode.kind!=='unknown'&&<div className={`notice ${mode.size<4?'notice-gold':'notice-green'}`}><b>{mode.label}</b>{mode.fallbackExperiment&&<><br/>🦉 Modelos cubre temporalmente 🐢 Experimentos con un módulo separado. La responsabilidad sigue existiendo y genera evidencia propia.</>}</div>}{dependencyRows.length>0&&<div className="evidence-dependencies"><div><b>{ROLE_ARCHETYPES[role]?.emoji} Tu evidencia depende de otras piezas</b><span>{dep.text}</span></div><div className="dependency-chips">{dependencyRows.map(({code,meta,hit})=><span key={code} className={hit?'ready':'waiting'} title={meta.label}>{meta.emoji} {hit?'lista':'pendiente'}</span>)}</div></div>}{evidence?.summary&&<div className="evidence-preview"><b>{ROLE_ARCHETYPES[role]?.emoji} Tu evidencia actual</b><span>{evidence.summary}</span><small><strong>Supuesto:</strong> {evidence.assumption}</small><small><strong>Qué permite decidir:</strong> {evidence.decision}</small></div>}{role==='data'&&mode.fallbackExperiment&&<div className="tool-card" style={{margin:'16px 0',borderColor:ROLE_ARCHETYPES.integrator.accent}}><div className="tool-head"><div><div className="eyebrow">DOBLE SOMBRERO · 🐢 EXPERIMENTOS</div><h3>Diseñador de Experimentos</h3><p>Esta herramienta aparece porque el equipo no tiene un Líder de Experimentos dedicado. Debes producir esa evidencia por separado.</p></div></div><ExperimentCoverageTool round={round} onEvidence={setExperimentCoverage}/></div>}<div className="finding-options">{options.map(([code,label])=><label className={`finding-choice ${selected===code?'selected':''}`} key={code}><input type="radio" name={`finding-${role}-${round}`} checked={selected===code} onChange={()=>setSelected(code)}/><span>{label}</span></label>)}</div><button className="btn btn-primary" disabled={busy||!selected} onClick={submit}><Send size={15}/>{own?'Actualizar evidencia compartida':'Compartir con el equipo'}</button>{err&&<div className="notice notice-red">{err}</div>}<div className="evidence-war-room">{coreRows.map(({code,meta,hit})=><article className={`evidence-specialist-card ${hit?'done':'pending'} ${code===role||hit?.covered_by===role?'current':''}`} key={code} style={{'--role-accent':meta.accent}}><header><span className="evidence-role-emoji" aria-hidden="true">{meta.emoji}</span><div><small>{hit?.covered_by==='data'?'DOBLE SOMBRERO':hit?'EVIDENCIA LISTA':'PENDIENTE'}</small><b>{meta.label}</b></div>{hit&&<CheckCircle2 size={18}/>}</header><div className="evidence-specialist-body"><p className="finding-main">{hit?.covered_by==='data'?'🦉 Modelos cubre esta responsabilidad porque el equipo no tiene Experimentos dedicado.':hit?findingLabel(round,code,hit.finding_code):'Esta especialidad todavía no ha compartido su pieza de evidencia.'}</p>{hit?.evidence?.summary&&<div className="evidence-piece"><b>Evidencia</b><span>{hit.evidence.summary}</span></div>}{hit?.evidence?.assumption&&<div className="evidence-piece"><b>Supuesto</b><span>{hit.evidence.assumption}</span></div>}{hit?.evidence?.decision&&<div className="evidence-piece"><b>Aporta a la decisión</b><span>{hit.evidence.decision}</span></div>}</div></article>)}</div><div className="evidence-flow-caption"><span>🦁 Define</span><i>→</i><span>🐈‍⬛ Identifica</span><i>→</i><span>🦉 Estima</span><i>→</i><span>🐢 Contrasta</span><i>→</i><span>🦁 Diseña política e integra</span></div><div className={`notice ${integration.status==='coherent'?'notice-green':integration.status==='blocked'?'notice-red':'notice-gold'}`}><b>{integrationCopy}</b><br/>{integration.readyCount}/{integration.totalChecks} chequeos listos · {integration.blockCount} bloqueos · {integration.warnCount} advertencias.</div>{firstBlock&&<div className="notice notice-red"><b>Primer bloqueo a resolver: {firstBlock.label}</b><br/>{firstBlock.message}</div>}<details><summary>Ver todos los chequeos de coherencia</summary>{integration.checks.map(item=><div className={`notice ${CHECK_CLASS[item.status]||'notice-gold'}`} key={item.id}><b>{CHECK_ICON[item.status]} {item.label}</b><br/>{item.message}</div>)}</details><div className={`notice ${doneCore>=4?'notice-green':'notice-gold'}`}>{doneCore>=4?'4/4 especialidades cubiertas. Ahora verifiquen coherencia: evidencia completa no significa automáticamente evidencia válida.':'La sesión no se bloquea por una ausencia: con tres personas, Modelos cubre Experimentos mediante un módulo separado; con menos de tres, el facilitador debe reequilibrar equipos.'}</div></div>
}
