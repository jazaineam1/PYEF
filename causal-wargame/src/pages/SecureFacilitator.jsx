import React,{useEffect,useState}from'react'
import{Bot,Clock3,Eye,GraduationCap,LockKeyhole,Pause,Play,RotateCcw,SkipForward,Users}from'lucide-react'
import{Layout}from'../components/Layout'
import{Leaderboard}from'../components/Leaderboard'
import{bootstrapGame,invoke,saveFacilitatorToken,saveFacilitatorGameCode,getFacilitatorGameCode,getFacilitatorToken}from'../lib/api'
import{ROUND_COPY}from'../content'

function Login({onLogin}){
  const[code,setCode]=useState('FUTUROS26')
  const[pin,setPin]=useState('')
  const[err,setErr]=useState('')
  const[busy,setBusy]=useState(false)
  const[showCreate,setShowCreate]=useState(false)
  const[master,setMaster]=useState('')
  const[created,setCreated]=useState('')
  async function go(){
    setBusy(true);setErr('');setCreated('')
    try{
      const r=await invoke('facilitator-login',{game_code:code,pin},'facilitator')
      saveFacilitatorToken(r.token);saveFacilitatorGameCode(code);onLogin()
    }catch(e){setErr(e.message)}finally{setBusy(false)}
  }
  async function create(){
    setBusy(true);setErr('');setCreated('')
    try{
      await bootstrapGame({game_code:code,pin,bootstrap_secret:master})
      saveFacilitatorGameCode(code)
      setCreated(`Partida ${code.toUpperCase()} creada. Ya puedes entrar con el PIN definido.`)
      setShowCreate(false);setMaster('')
    }catch(e){setErr(e.message)}finally{setBusy(false)}
  }
  return <Layout subtitle="Facilitador"><div className="grid grid-2">
    <div className="card card-accent">
      <div className="eyebrow">CONTROL DOCENTE</div><h2>Entrar a una partida</h2>
      <div className="form-row"><label>Código</label><input className="input" value={code} onChange={e=>setCode(e.target.value.toUpperCase())}/></div>
      <div className="form-row"><label>PIN</label><input className="input" type="password" value={pin} onChange={e=>setPin(e.target.value)} onKeyDown={e=>e.key==='Enter'&&go()}/></div>
      {err&&<div className="notice notice-red">{err}</div>}{created&&<div className="notice notice-green">{created}</div>}
      <button className="btn btn-primary" disabled={busy||code.length<4||pin.length<8} onClick={go}>{busy?'Procesando…':'Entrar'}</button>
    </div>
    <div className="card"><h3>Nueva partida</h3><p>Usa la clave maestra sólo para crear nuevas sesiones. La clave no se almacena en el navegador.</p><button className="btn" onClick={()=>setShowCreate(v=>!v)}>{showCreate?'Cancelar':'Crear partida nueva'}</button>{showCreate&&<div style={{marginTop:14}}><div className="form-row"><label>Clave maestra</label><input className="input" type="password" autoComplete="off" value={master} onChange={e=>setMaster(e.target.value)}/></div><button className="btn btn-primary" disabled={busy||code.length<4||pin.length<8||master.length<12} onClick={create}>Crear {code||'partida'}</button></div>}</div>
  </div></Layout>
}

function useStateRemote(){
  const[state,setState]=useState(null);const[err,setErr]=useState('')
  async function refresh(){try{setState(await invoke('leaderboard',{},'facilitator'));setErr('')}catch(e){setErr(e.message)}}
  useEffect(()=>{let alive=true;const tick=async()=>{if(alive)await refresh()};tick();const i=setInterval(tick,2500);return()=>{alive=false;clearInterval(i)}},[])
  return{state,err,refresh}
}

function Console(){
  const{state,err,refresh}=useStateRemote();const[busy,setBusy]=useState(false);const[info,setInfo]=useState('')
  if(!state)return <Layout subtitle="Facilitador"><div className="card">Conectando… {err}</div></Layout>
  const g=state.game;const copy=ROUND_COPY[g.round]
  const playerCount=Number(g.player_count||0),humanCount=Number(g.human_count||0),botCount=Number(g.bot_count||0)
  async function act(action,seconds=60){
    if(action==='reset'&&!window.confirm('Esto eliminará jugadores, bots, decisiones y puntajes de esta partida. ¿Continuar?'))return
    if(action==='open'&&playerCount<20&&!window.confirm(`Hay ${playerCount}/20 participantes. ¿Quieres abrir la ronda de todos modos?`))return
    setBusy(true);setInfo('')
    try{
      const r=await invoke('facilitator-transition',{action,seconds},'facilitator')
      if(action==='seed_bots')setInfo(`Ensayo preparado: ${r.players??'?'} participantes (${r.humans??0} humano(s), ${r.bots??0} bots).`)
      if(action==='bot_decisions')setInfo(`Bots resueltos: ${r.bot_decisions??0} equipos automáticos.`)
      await refresh()
    }catch(e){alert(e.message)}finally{setBusy(false)}
  }
  const canOpen=['lobby','briefing','closed'].includes(g.phase)&&humanCount>0
  const canClose=['round','paused'].includes(g.phase)
  const canReveal=g.phase==='closed'
  const canTeach=g.phase==='reveal'
  const canCheck=g.phase==='teaching'
  const canNext=['microcheck','teaching','reveal'].includes(g.phase)
  const canTime=['round','paused'].includes(g.phase)
  const canSeed=['lobby','briefing'].includes(g.phase)&&playerCount<20
  return <Layout subtitle="Facilitador" actions={<><span className="pill">Ronda <strong>{g.round}/4</strong></span><a className="btn btn-ghost" href={`wall.html?game=${encodeURIComponent(getFacilitatorGameCode())}`} target="_blank" rel="noreferrer">Abrir wall</a></>}>
    <div className="grid grid-3">
      <div className="card"><div className="metric"><span>Estado</span><strong style={{fontSize:24}}>{g.phase.toUpperCase()}</strong><small>{g.public_message}</small></div></div>
      <div className="card"><div className="metric"><span>Ronda</span><strong>{g.round}</strong><small>{copy.title}</small></div></div>
      <div className="card"><div className="metric"><span>Participantes</span><strong>{playerCount}/20</strong><small>{humanCount} humano(s) · {botCount} bots</small></div></div>
      <div className="card"><div className="metric"><span>Equipos listos</span><strong>{state.teams.filter(t=>t.locked).length}/4</strong><small>decisiones bloqueadas</small></div></div>
    </div>

    {['lobby','briefing'].includes(g.phase)&&<><div className="section-title"><h2>Ensayo individual</h2><p>Prueba las cuatro rondas sin reunir a 20 personas.</p></div><div className="card card-accent">
      <div className="grid grid-2"><div><h3><Bot size={20} style={{verticalAlign:'middle'}}/> Modo ensayo</h3><p>{playerCount===0?'1) Prepara 19 bots. 2) Abre la vista de participante y entra tú con el código. 3) Vuelve aquí y abre la ronda.':'Los bots completan sólo los cupos vacíos. Los equipos sin humanos decidirán automáticamente al abrir cada ronda.'}</p></div><div className="fac-toolbar" style={{alignContent:'center'}}><button className="btn btn-primary" disabled={busy||!canSeed} onClick={()=>act('seed_bots')}><Bot size={16}/> {playerCount===0?'Preparar 19 bots':'Completar con bots'}</button><a className="btn" href="play.html" target="_blank" rel="noreferrer"><Users size={16}/> Abrir participante</a></div></div>
    </div></>}
    {humanCount===0&&<div className="notice notice-red" style={{marginTop:12}}>No puedes abrir la ronda todavía: falta al menos un participante humano. En modo ensayo, entra tú desde “Abrir participante”.</div>}
    {botCount>0&&<div className="notice" style={{marginTop:12}}>Modo ensayo activo: {botCount} bots. Al abrir una ronda, los equipos compuestos sólo por bots bloquean su decisión automáticamente.</div>}
    {info&&<div className="notice notice-green" style={{marginTop:12}}>{info}</div>}

    <div className="section-title"><h2>Control</h2><p>El servidor conserva el estado; recargar esta página no altera la partida.</p></div>
    <div className="card"><div className="fac-toolbar">
      <button className="btn btn-primary" disabled={busy||!canOpen} onClick={()=>act('open')}><Play size={16}/> Abrir ronda</button>
      <button className="btn" disabled={busy||!canClose} onClick={()=>act('close')}><LockKeyhole size={16}/> Cerrar</button>
      <button className="btn" disabled={busy||!canReveal} onClick={()=>act('reveal')}><Eye size={16}/> Reveal</button>
      <button className="btn" disabled={busy||!canTeach} onClick={()=>act('teach')}><GraduationCap size={16}/> Explicar</button>
      <button className="btn" disabled={busy||!canCheck} onClick={()=>act('microcheck')}>Microcheck</button>
      <button className="btn" disabled={busy||!canNext} onClick={()=>act('next')}><SkipForward size={16}/> Siguiente</button>
      <button className="btn" disabled={busy||!canTime} onClick={()=>act('add_time',60)}><Clock3 size={16}/> +60 s</button>
      {g.phase==='paused'?<button className="btn btn-primary" disabled={busy} onClick={()=>act('resume')}><Play size={16}/> Reanudar</button>:<button className="btn" disabled={busy||g.phase!=='round'} onClick={()=>act('pause')}><Pause size={16}/> Pausar</button>}
      {botCount>0&&<button className="btn" disabled={busy||g.phase!=='round'} onClick={()=>act('bot_decisions')}><Bot size={16}/> Resolver bots</button>}
      <button className="btn" disabled={busy||g.phase==='round'} onClick={()=>act('reset')}><RotateCcw size={16}/> Reset sesión</button>
    </div></div>
    {err&&<div className="notice notice-red" style={{marginTop:12}}>Conexión: {err}. La consola reintentará automáticamente.</div>}
    <div className="section-title"><h2>Equipos</h2><p>Online cuenta humanos con actividad en los últimos 90 segundos; los bots se muestran aparte.</p></div>
    <div className="card"><div className="team-status header"><div>Equipo</div><div>Humanos/Bots</div><div>Online</div><div>Locked</div><div>Impacto</div><div>Evid.</div><div>Checks</div></div>{state.teams.map(t=><div className="team-status" key={t.id}><div><b>{t.name}</b></div><div>{t.humans||0}/{t.bots||0}</div><div>{t.online||0}</div><div>{t.locked?'✓':'…'}</div><div>{t.score.impact}</div><div>{t.score.evidence}</div><div>{t.check_correct||0}</div></div>)}</div>
    <div className="grid grid-2" style={{marginTop:16}}><div className="card"><h3>Leaderboard</h3><Leaderboard state={state}/></div><div className="card"><h3>Auditoría reciente</h3><div className="audit">{(state.audit||[]).map((e,i)=><div className="audit-row" key={i}><b>{new Date(e.at).toLocaleTimeString()}</b> · {e.type}</div>)}</div></div></div>
  </Layout>
}

export default function SecureFacilitator(){const[token,setToken]=useState(()=>getFacilitatorToken());return token?<Console/>:<Login onLogin={()=>setToken(getFacilitatorToken())}/>}
