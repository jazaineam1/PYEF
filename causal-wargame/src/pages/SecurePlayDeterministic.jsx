import React,{useEffect,useState}from'react'
import{Check,Lock,Sparkles}from'lucide-react'
import{Layout}from'../components/Layout'
import{Timer}from'../components/Timer'
import{Leaderboard}from'../components/Leaderboard'
import{invoke,savePlayerToken,savePlayerGameCode,getPlayerToken,clearPlayerSession}from'../lib/api'
import{MICROCHECKS,ROLES,ROUND_COPY}from'../content'

function Join({onJoined}){
  const[code,setCode]=useState('FUTUROS26');const[name,setName]=useState('');const[busy,setBusy]=useState(false);const[err,setErr]=useState('')
  async function go(){setBusy(true);setErr('');try{const r=await invoke('join-game',{game_code:code,display_name:name});savePlayerToken(r.token);savePlayerGameCode(code);onJoined()}catch(e){setErr(e.message)}finally{setBusy(false)}}
  return <Layout subtitle="Participante"><div className="grid grid-2"><div className="card card-accent"><div className="eyebrow">ENTRAR A LA PARTIDA</div><h2>Tu misión está por comenzar</h2><p>Tu equipo y rol se asignan automáticamente. Desde la ronda 2 cada rol recibe una pieza distinta de información.</p><div className="form-row"><label>Código de partida</label><input className="input" autoCapitalize="characters" value={code} onChange={e=>setCode(e.target.value.toUpperCase())}/></div><div className="form-row"><label>Nombre visible</label><input className="input" value={name} onChange={e=>setName(e.target.value)}/></div>{err&&<div className="notice notice-red">{err}</div>}<button className="btn btn-primary" disabled={busy||code.length<4||name.trim().length<2} onClick={go}>{busy?'Entrando…':'Entrar'}</button></div><div className="card"><h3>Roles cooperativos</h3><p><b>No hay traidores ni roles buenos/malos.</b> Todos quieren que el equipo gane. La diferencia es que cada persona recibe una pista distinta y deben compartirlas antes de bloquear una decisión.</p></div></div></Layout>
}

function useRemoteState(onInvalid){
  const[state,setState]=useState(null);const[error,setError]=useState('')
  async function refresh(){try{setState(await invoke('game-state'));setError('')}catch(e){const msg=e.message||'';if(/inválida|expirada/i.test(msg)){clearPlayerSession();onInvalid?.();return}setError(msg)}}
  useEffect(()=>{refresh();const i=setInterval(refresh,3000);return()=>clearInterval(i)},[])
  return{state,error,refresh}
}

function keyFor(round,team){const k=`df-idem-${round}-${team}`;let v=sessionStorage.getItem(k);if(!v){v=crypto.randomUUID();sessionStorage.setItem(k,v)}return v}
function roleLabel(code){return ROLES.find(r=>r.code===code)?.label||code}

function RoleIntel({state}){
  if(!state.role_card||state.game.round===1)return null
  return <div className="card role-card" style={{marginBottom:14}}><div className="label">TU PISTA PRIVADA · {roleLabel(state.player.role_code)}</div><p className="intel">{state.role_card}</p><div className="notice" style={{marginTop:10}}>Compártela con tu equipo. Nadie tiene toda la información por sí solo.</div></div>
}

function Round1({state,onSubmit}){
  const existing=state.decision?.selected||[];const[selected,setSelected]=useState(existing);useEffect(()=>setSelected(existing),[JSON.stringify(existing)]);const customers=state.customers||[]
  const toggle=id=>setSelected(v=>v.includes(id)?v.filter(x=>x!==id):v.length<10?[...v,id]:v)
  return <><div className="notice notice-gold">ORÁCULO estima probabilidad de conversión. <b>Elige exactamente 10 clientes.</b> Nada aquí muestra todavía cuánto cambia cada cliente por la intervención.</div><div className="customer-grid" style={{marginTop:14}}>{customers.map(c=><button type="button" className={`customer ${selected.includes(c.id)?'selected':''}`} key={c.id} onClick={()=>!state.locked&&toggle(c.id)}><div className="check">{selected.includes(c.id)&&<Check size={14}/>}</div><h4>{c.name}</h4><div className="seg">{c.segment}</div><div className="score-badge">{Math.round(Number(c.score)*100)}% <small>score</small></div></button>)}</div><div className="section-title"><p>{selected.length}/10 seleccionados</p><button className="btn btn-primary" disabled={state.locked||selected.length!==10} onClick={()=>onSubmit({selected})}><Lock size={16}/> {state.locked?'Decisión bloqueada':'Bloquear decisión'}</button></div></>
}

const REASONS=[
  ['baseline_difference','Los grupos ya eran distintos antes de la llamada.'],
  ['model_quality','El problema principal es que el modelo predictivo podría tener bajo desempeño.'],
  ['sample_size','El problema principal es que hay demasiados clientes para comparar.'],
  ['outcome_timing','El problema principal es que el pago ocurre después de la llamada.']
]
function Round2({state,onSubmit}){
  const existing=state.decision||{};const[d,setD]=useState({recommendation:existing.recommendation||'',confounder:existing.confounder||'',reason_code:existing.reason_code||''})
  return <><RoleIntel state={state}/><div className="grid grid-2"><div className="card"><div className="metric"><span>Clientes llamados</span><strong>20%</strong><small>pagan a 30 días</small></div><div className="metric" style={{marginTop:16}}><span>No llamados</span><strong>35%</strong><small>pagan a 30 días</small></div></div><div className="card"><h3>1. ¿Qué recomiendan?</h3>{[['cancel','Cancelar'],['keep','Mantener tal cual'],['redesign','Rediseñar antes de concluir']].map(([v,l])=><label className="choice" key={v}><input type="radio" disabled={state.locked} checked={d.recommendation===v} onChange={()=>setD({...d,recommendation:v})}/>{l}</label>)}</div></div><div className="grid grid-2" style={{marginTop:14}}><div className="card"><h3>2. ¿Qué variable hace peligrosa la comparación?</h3><select className="select" disabled={state.locked} value={d.confounder} onChange={e=>setD({...d,confounder:e.target.value})}><option value="">Selecciona…</option><option value="edad">Edad</option><option value="mora_previa">Mora previa</option><option value="nombre">Nombre</option></select></div><div className="card"><h3>3. ¿Por qué puede engañar?</h3>{REASONS.map(([v,l])=><label className="choice" key={v}><input type="radio" disabled={state.locked} checked={d.reason_code===v} onChange={()=>setD({...d,reason_code:v})}/>{l}</label>)}</div></div><div className="section-title"><span/><button className="btn btn-primary" disabled={state.locked||!d.recommendation||!d.confounder||!d.reason_code} onClick={()=>onSubmit(d)}>{state.locked?'Decisión bloqueada':'Bloquear decisión del equipo'}</button></div></>
}

function Round3({state,onSubmit}){
  const existing=state.decision&&Object.keys(state.decision).length?state.decision:null;const[d,setD]=useState(existing||{assignment:'',outcome:'pago_30d',horizon:30})
  return <><RoleIntel state={state}/><div className="grid grid-3">{[['advisor','El asesor decide','Usar criterio humano.'],['model','ORÁCULO decide','Tratar scores más altos.'],['random','Asignar al azar','Dividir elegibles entre intervención y control.']].map(([v,t,p])=><button className={`card ${d.assignment===v?'card-accent':''}`} key={v} disabled={state.locked} onClick={()=>setD({...d,assignment:v})}><h3>{t}</h3><p>{p}</p></button>)}<div className="card" style={{gridColumn:'1/-1'}}><div className="grid grid-2"><div className="form-row"><label>Outcome</label><select className="select" disabled={state.locked} value={d.outcome} onChange={e=>setD({...d,outcome:e.target.value})}><option value="pago_30d">Pago a 30 días</option><option value="click">Click inmediato</option></select></div><div className="form-row"><label>Horizonte</label><select className="select" disabled={state.locked} value={d.horizon} onChange={e=>setD({...d,horizon:Number(e.target.value)})}><option value="1">1 día</option><option value="30">30 días</option><option value="90">90 días</option></select></div></div><button className="btn btn-primary" disabled={state.locked||!d.assignment} onClick={()=>onSubmit(d)}>{state.locked?'Diseño bloqueado':'Bloquear diseño'}</button></div></div></>
}

function Round4({state,onSubmit}){
  const segments=state.segments||[];const initial=()=>{if(state.decision&&Object.keys(state.decision).length){const a={};(state.decision.treat||[]).forEach(x=>a[x]='treat');(state.decision.avoid||[]).forEach(x=>a[x]='avoid');(state.decision.observe||[]).forEach(x=>a[x]='observe');return a}return Object.fromEntries(segments.map(s=>[s.id,'observe']))};const[actions,setActions]=useState(initial)
  useEffect(()=>{if(segments.length&&!Object.keys(actions).length)setActions(Object.fromEntries(segments.map(s=>[s.id,'observe'])))},[segments.length])
  function send(){onSubmit({treat:segments.filter(s=>actions[s.id]==='treat').map(s=>s.id),avoid:segments.filter(s=>actions[s.id]==='avoid').map(s=>s.id),observe:segments.filter(s=>actions[s.id]==='observe').map(s=>s.id)})}
  return <><RoleIntel state={state}/><div className="card"><div className="notice notice-gold" style={{marginBottom:12}}>Cada segmento debe quedar exactamente una vez en: <b>Intervenir</b>, <b>No intervenir</b> o <b>Más evidencia</b>.</div>{segments.map(s=><div className="team-status" style={{gridTemplateColumns:'1.6fr .6fr 1.4fr'}} key={s.id}><div><b>{s.name}</b></div><div style={{color:Number(s.effect)<0?'var(--red)':Number(s.effect)>5?'var(--green)':'var(--muted)',fontWeight:900}}>{Number(s.effect)>0?'+':''}{s.effect} pp</div><div><select className="select" disabled={state.locked} value={actions[s.id]||'observe'} onChange={e=>setActions({...actions,[s.id]:e.target.value})}><option value="treat">Intervenir</option><option value="avoid">No intervenir</option><option value="observe">Más evidencia</option></select></div></div>)}</div><div className="section-title"><span/><button className="btn btn-primary" disabled={state.locked||segments.length!==5} onClick={send}>{state.locked?'Política bloqueada':'Bloquear política'}</button></div></>
}

function Reveal({state}){
  const r=state.game.round
  if(r===1){const rows=state.reveal_payload||[];const observed=rows.length?Math.round(100*rows.reduce((a,c)=>a+Number(c.p1),0)/rows.length):0;const impact=rows.length?Math.round(100*rows.reduce((a,c)=>a+Number(c.effect),0)):0;const best=[...rows].sort((a,b)=>Number(b.effect)-Number(a.effect))[0];return <><div className="reveal-stage"><div className="eyebrow">LO QUE OBSERVABAS</div><div className="giant">{observed}%</div><p>conversión esperada entre seleccionados.</p><div className="notice notice-gold" style={{maxWidth:760,margin:'24px auto'}}>En datos reales no vemos simultáneamente ambos futuros de una persona. El simulador puede mostrarlos porque los datos son sintéticos y conoce cómo fueron generados.</div><div className="giant" style={{color:'var(--cyan)'}}>+{impact}</div><p>impacto incremental acumulado esperado.</p></div>{best&&<div className="split-future"><div className="future"><div className="eyebrow">INTERVENIMOS</div><h3>{best.name}</h3><strong>{Math.round(Number(best.p1)*100)}%</strong></div><div className="vs">VS</div><div className="future"><div className="eyebrow">NO INTERVENIMOS</div><h3>{best.name}</h3><strong>{Math.round(Number(best.p0)*100)}%</strong></div></div>}</>}
  if(r===2)return <div className="reveal-stage"><div className="eyebrow">ASOCIACIÓN OBSERVADA</div><div className="giant" style={{color:'var(--red)'}}>{state.result?.naive_effect_pp??'−15'} pp</div><p>parecía que llamar empeoraba.</p><div style={{height:20}}/><div className="eyebrow">VERDAD DEL SIMULADOR</div><div className="giant" style={{color:'var(--green)'}}>+{state.result?.causal_effect_pp??5} pp</div><p>la selección estaba escondiendo el efecto.</p></div>
  if(r===3)return <div className="reveal-stage"><div className="split-future"><div className="future"><h3>Intervención</h3><strong>{state.result?.treatment??31}%</strong></div><div className="vs">−</div><div className="future"><h3>Control</h3><strong>{state.result?.control??25}%</strong></div></div><div className="giant" style={{marginTop:24,color:'var(--cyan)'}}>+{state.result?.ate_pp??6} pp</div><p>Efecto promedio de la comparación aleatoria.</p></div>
  return <div className="reveal-stage"><div className="eyebrow">EL PROMEDIO NO ES TODOS</div><div className="giant">+6 pp</div><p>La política final debe considerar a quién ayuda, a quién casi no mueve y a quién perjudica.</p></div>
}

function Microcheck({state,refresh}){
  const q=MICROCHECKS[state.game.round];const[ans,setAns]=useState('');const[done,setDone]=useState(null)
  async function send(){const r=await invoke('submit-check',{round:state.game.round,answer:ans});setDone(r.correct);await refresh()}
  return <div className="card card-accent"><div className="eyebrow">MICROCHECK INDIVIDUAL · NO CAMBIA EL LEADERBOARD</div><h2>{q.prompt}</h2>{q.options.map(o=><label className="choice" key={o}><input type="radio" checked={ans===o} onChange={()=>setAns(o)}/>{o}</label>)}{done!==null?<div className={`notice ${done?'notice-green':'notice-red'}`} style={{marginTop:14}}>{done?'Correcto.':'Revísalo en el debrief; el objetivo es aprender, no ganar puntos.'}</div>:<button className="btn btn-primary" style={{marginTop:14}} disabled={!ans} onClick={send}>Enviar</button>}</div>
}

function Game({onInvalid}){
  const{state,error,refresh}=useRemoteState(onInvalid);const[busy,setBusy]=useState(false)
  if(error&&!state)return <Layout subtitle="Participante"><div className="notice notice-red">{error}. Reintentando automáticamente…</div></Layout>
  if(!state)return <Layout subtitle="Participante"><div className="card">Conectando con la partida…</div></Layout>
  const copy=ROUND_COPY[state.game.round];const team=state.teams.find(t=>t.id===state.player.team_id)
  async function submit(payload){setBusy(true);try{await invoke('submit-decision',{round:state.game.round,payload,idempotency_key:keyFor(state.game.round,state.player.team_id)});await refresh()}catch(e){alert(e.message)}finally{setBusy(false)}}
  const waitText=state.game.round===1?'Esperando al facilitador.':'Esperando al facilitador. Desde esta ronda cada rol tiene una pista privada; compartan las cinco antes de decidir.'
  return <Layout subtitle="Participante" actions={<><span className="pill">Equipo <strong>{team?.name}</strong></span><span className="pill">Rol <strong>{roleLabel(state.player.role_code)}</strong></span></>}><div className="round-header"><div><div className="eyebrow">{copy.kicker}</div><h2>{copy.title}</h2><div className="mission">{copy.mission}</div></div><Timer closesAt={state.game.closes_at?new Date(state.game.closes_at).getTime():null}/></div>{error&&<div className="notice notice-red" style={{marginBottom:12}}>Reconectando: {error}</div>}{['lobby','briefing'].includes(state.game.phase)?<div className="card card-accent"><h2>Esperando</h2><p>{waitText}</p></div>:state.game.phase==='round'?<>{state.game.round===1&&<Round1 state={state} onSubmit={submit}/>} {state.game.round===2&&<Round2 state={state} onSubmit={submit}/>} {state.game.round===3&&<Round3 state={state} onSubmit={submit}/>} {state.game.round===4&&<Round4 state={state} onSubmit={submit}/>}</>:state.game.phase==='closed'?<div className="card"><h2>Decisiones cerradas</h2><p>Preparando revelación…</p></div>:state.game.phase==='reveal'?<><Reveal state={state}/><div className="card"><Leaderboard state={state}/></div></>:state.game.phase==='teaching'?<div className="card card-accent"><div className="eyebrow">CONCEPTO DESBLOQUEADO</div><h2>{copy.teaching.title}</h2><p style={{fontSize:20}}>{copy.teaching.body}</p></div>:state.game.phase==='microcheck'?<Microcheck state={state} refresh={refresh}/>:state.game.phase==='finished'?<><div className="reveal-stage"><Sparkles size={40}/><div className="giant">¿A quién podemos cambiar?</div><p>ORÁCULO predecía. El equipo aprendió a pensar causalmente.</p></div><div className="card"><Leaderboard state={state}/></div></>:<div className="card">Partida pausada.</div>}{busy&&<div className="pill" style={{position:'fixed',right:20,bottom:20}}>Guardando en servidor…</div>}</Layout>
}

export default function SecurePlayDeterministic(){
  const[token,setToken]=useState(()=>getPlayerToken())
  function invalid(){clearPlayerSession();setToken('')}
  return token?<Game onInvalid={invalid}/>:<Join onJoined={()=>setToken(getPlayerToken())}/>
}
