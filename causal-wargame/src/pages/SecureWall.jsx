import React,{useEffect,useState}from'react'
import {Brand} from '../components/Brand'
import {Leaderboard} from '../components/Leaderboard'
import {ObservedLeaderboard} from '../components/ObservedLeaderboard'
import {Timer} from '../components/Timer'
import {invoke} from '../lib/api'
import {ROUND_COPY} from '../content'

export default function SecureWall(){
  const params=new URLSearchParams(location.search); const[code,setCode]=useState(params.get('game')||''); const[state,setState]=useState(null); const[err,setErr]=useState('')
  async function refresh(){if(!code)return;try{setState(await invoke('leaderboard',{game_code:code}));setErr('')}catch(e){setErr(e.message)}}
  useEffect(()=>{if(!code)return;let alive=true;const tick=async()=>{if(alive)await refresh()};tick();const i=setInterval(tick,2500);return()=>{alive=false;clearInterval(i)}},[code])
  if(!code)return <div className="wall"><Brand subtitle="Pantalla compartida"/><div className="card" style={{maxWidth:580,marginTop:50}}><h2>Ingresar código de partida</h2><input className="input" value={code} onChange={e=>setCode(e.target.value.toUpperCase())}/><button className="btn btn-primary" style={{marginTop:12}} onClick={refresh}>Abrir</button></div></div>
  if(!state)return <div className="wall"><Brand subtitle="Pantalla compartida"/><div className="card" style={{marginTop:40}}>Conectando… {err}</div></div>
  const g=state.game; const copy=ROUND_COPY[g.round]; const observed=g.rank_mode==='observed'; const causalReveal=g.round===1&&['reveal','teaching','microcheck'].includes(g.phase)
  return <div className="wall">
    <div className="topbar"><Brand subtitle="Pantalla compartida"/><div style={{display:'flex',gap:8,alignItems:'center'}}><span className="pill">Ronda <strong>{g.round}/4</strong></span><Timer closesAt={g.closes_at?new Date(g.closes_at).getTime():null} serverNow={state.server_time}/></div></div>
    <div className="wall-kicker">{copy.kicker}</div>
    <div className="wall-title">{g.phase==='reveal'&&g.round===1?'VER EL OTRO FUTURO':g.phase==='finished'?'USTEDES DESCUBRIERON A QUIÉN PODÍAN CAMBIAR.':copy.title}</div>
    <div className="wall-message">{g.phase==='round'?copy.mission:observed?'Primer resultado: ranking por conversión esperada. Todavía no sabemos cuánto causó la intervención.':g.phase==='closed'?'Decisiones cerradas. Preparando revelación…':g.phase==='teaching'?copy.teaching.body:g.phase==='microcheck'?'Microcheck individual en cada equipo.':g.phase==='finished'?'ORÁCULO predijo quién lo haría. Ustedes aprendieron a preguntar quién cambia por la intervención.':g.public_message}</div>
    <div className="wall-board"><div className="card">{observed?<><div className="eyebrow">RANKING 1 · CONVERSIÓN OBSERVADA</div><ObservedLeaderboard teams={state.teams}/></>:<><div className="eyebrow">{causalReveal?'RANKING 2 · IMPACTO CAUSAL':'LEADERBOARD'}</div><Leaderboard state={state} compact/></>}</div></div>
    {causalReveal&&<div className="notice notice-gold" style={{maxWidth:900,margin:'16px auto 0'}}>El criterio cambió: ahora gana quien generó <b>más cambio incremental</b>, no quien eligió a quienes ya tenían mayor probabilidad.</div>}
    {err&&<div className="notice notice-red" style={{marginTop:16}}>Reconectando: {err}</div>}
  </div>
}
