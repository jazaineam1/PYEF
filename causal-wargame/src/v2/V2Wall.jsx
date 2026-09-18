import React,{useEffect,useRef,useState}from'react'
import{CheckCircle2,Medal,Sparkles,Trophy}from'lucide-react'
import{invoke}from'../lib/api'
import{V2_ROUNDS,V2_CHALLENGE_COUNT,RECOMMENDATIONS,statusCopy}from'./content'

const jitter=n=>Math.round(n*(.9+Math.random()*.2))
const copShort=n=>new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',notation:'compact',maximumFractionDigits:1}).format(Number(n||0))

function decisionText(round,payload={}){
  const template=V2_ROUNDS[round]?.template
  if(template==='cohort-selection')return 'Mes gratis: '+(payload.selected||[]).join(', ')
  if(template==='recommendation')return RECOMMENDATIONS.find(x=>x[0]===payload.recommendation)?.[1]||'—'
  return 'Ofrecer: '+((payload.treat||[]).join(', ')||'ninguno')+' · No ofrecer: '+((payload.avoid||[]).join(', ')||'ninguno')
}

function TopThree({rows=[],show=true}){
  const top=rows.slice(0,3)
  if(!show)return <section className="v2-wall-top3 waiting"><div className="v2-wall-section-title"><b><Trophy size={22}/> TOP 3</b><span>Se activa al cerrar la primera pregunta puntuable.</span></div><div className="v2-top3-wait">Todavía no hay ranking. Primero entiende el laboratorio.</div></section>
  return <section className="v2-wall-top3"><div className="v2-wall-section-title"><b><Trophy size={22}/> TOP 3</b><span>Puntaje individual acumulado</span></div><div className="v2-podium">{[1,0,2].map(index=>{const x=top[index];if(!x)return <div className="empty" key={index}/>;const rank=x.rank||index+1;return <article className={'rank-'+rank} key={x.player_id}><Medal size={rank===1?30:24}/><strong>{rank}°</strong><h2>{x.name}</h2><span>{x.team}</span><b>{x.points} pts</b><small>+{x.round_points||0} en este reto</small></article>})}</div></section>
}

function CheckpointBoard({data,activeTeams}){
  const c=data.checkpoint||{}
  const humans=Math.max(1,Number(c.humans||data.humans||0))
  const teams=Math.max(1,activeTeams.length)
  const rows=[
    ['Decisión inicial',Number(c.initial||0),humans,'sin puntos'],
    ['Laboratorio',Number(c.lab||0),humans,'+20 pts'],
    ['Pregunta de cierre',Number(c.check||0),humans,'hasta +30 pts'],
    ['Revisión',Number(c.revision||0),humans,'+20 pts'],
    ['Decisión de equipo',Number(c.teams_locked||0),teams,'hasta +30 pts al revelar']
  ]
  let current='Decisión inicial'
  for(const row of rows){if(row[1]<row[2]){current=row[0];break}else current='Esperando resultado'}
  if(['closed','reveal','teaching','microcheck','finished'].includes(data.game.status))current='Resultado'

  return <section className="v2-wall-checkpoints"><div className="v2-wall-section-title"><b>AHORA · {current.toUpperCase()}</b><span>El puntaje aparece cuando cada actividad se cierra.</span></div><div className="v2-wall-checkpoint-grid">{rows.map(([label,value,total,points])=><article className={value>=total?'done':''} key={label}><div><strong>{label}</strong><span>{points}</span></div><b>{value}/{total}</b><div className="v2-wall-progress"><i style={{width:Math.min(100,value/Math.max(1,total)*100)+'%'}}/></div></article>)}</div></section>
}

function WallValue({teams=[]}){
  const rows=[...teams].filter(t=>Number(t.humans||0)>0||Number(t.rounds_scored||0)>0).sort((a,b)=>Number(b.total_value_cop||0)-Number(a.total_value_cop||0)||Number(a.position||0)-Number(b.position||0))
  if(!rows.some(t=>Number(t.rounds_scored||0)>0))return null
  return <section className="v2-wall-score secondary"><div className="v2-wall-section-title"><b>VALOR DEL EQUIPO</b><span>Se muestra sólo después del resultado.</span></div><div className="v2-wall-score-rows">{rows.map((t,i)=><div key={t.id}><span>{i+1}</span><strong>{t.name}</strong><div/><b>{copShort(t.total_value_cop)}</b>{t.round_value_cop!==null&&t.round_value_cop!==undefined&&<em>{Number(t.round_value_cop)>=0?'+':''}{copShort(t.round_value_cop)}</em>}</div>)}</div></section>
}

function WallDecisions({round,decisions=[]}){
  if(!decisions.length)return null
  return <section className="v2-wall-decisions"><div className="v2-wall-section-title"><b>DECISIONES FINALES</b><span>Ahora sí se muestran las políticas de los equipos.</span></div><div className="v2-wall-decision-grid">{decisions.map(d=><article key={d.team_id}><div><strong>{d.team}</strong><span>{copShort(d.value_cop)}</span></div><p>{decisionText(round,d.payload)}</p></article>)}</div></section>
}

export default function V2Wall(){
  const params=new URLSearchParams(location.search)
  const[code,setCode]=useState((params.get('game')||'').toUpperCase())
  const[data,setData]=useState(null),[err,setErr]=useState('')
  const[newIds,setNewIds]=useState(new Set()),seen=useRef(new Set())

  async function refresh(){
    if(!code)return
    try{
      const x=await invoke('v2-wall-state',{game_code:code})
      const current=new Set((x.players||[]).map(p=>p.id))
      const fresh=[...current].filter(id=>!seen.current.has(id))
      if(fresh.length){setNewIds(new Set(fresh));setTimeout(()=>setNewIds(new Set()),1200)}
      seen.current=current;setData(x);setErr('')
    }catch(e){setErr(e.message)}
  }

  useEffect(()=>{if(!code)return;let stop=false,t;const loop=async()=>{await refresh();if(!stop)t=setTimeout(loop,jitter(1500))};loop();return()=>{stop=true;clearTimeout(t)}},[code])

  if(!code)return <main className="v2-shell v2-center"><section className="v2-join-card"><div className="v2-brand">DOS FUTUROS <span>WALL</span></div><h1>¿Qué sesión quieres proyectar?</h1><label>Código<input value={code} onChange={e=>setCode(e.target.value.toUpperCase())} placeholder="DF2-ABC123"/></label></section></main>
  if(err&&!data)return <main className="v2-shell v2-center"><div className="v2-alert error">{err}</div></main>
  if(!data)return <main className="v2-shell v2-center"><div className="v2-loader">Conectando…</div></main>

  const g=data.game,r=V2_ROUNDS[g.round]
  const lobby=['lobby','briefing','lesson'].includes(g.status)
  const reveal=['closed','reveal','teaching','microcheck','finished'].includes(g.status)
  const activeTeams=(data.teams||[]).filter(t=>t.humans>0)

  return <main className="v2-wall compact-wall">
    <div className="v2-wall-top"><div><div className="v2-brand">DOS FUTUROS <span>WALL</span></div><div className="v2-kicker">{lobby?'ÚNETE DESDE TU TELÉFONO':statusCopy(g.status)}</div></div><div className="v2-wall-code"><span>CÓDIGO</span><strong>{g.code}</strong></div></div>

    {lobby?<div className="v2-wall-lobby"><div className="v2-wall-count"><strong>{data.humans}</strong><span>participantes conectados</span></div><div className="v2-wall-teams compact">{data.teams.map(t=>{const members=data.players.filter(p=>p.team_id===t.id);const full=t.humans>=3;return <section className={'v2-wall-team '+(full?'ready':'')} key={t.id}><div className="v2-team-head"><h2>{t.name}</h2>{full&&<CheckCircle2 size={20}/>}</div><div className="v2-wall-member-row">{members.map(p=><span className={(p.online?'':'offline ') + (newIds.has(p.id)?'new':'')} key={p.id}>{p.name}</span>)}{!members.length&&<span className="offline">Esperando…</span>}</div><div className="v2-wall-progress"><i style={{width:Math.min(100,(t.humans/4)*100)+'%'}}/></div><small>{t.humans}/4 {full?'· LISTO':'· entrando'}</small></section>})}</div></div>:
    <div className="v2-wall-stage">
      <div className="v2-wall-phase compact"><div><div className="v2-kicker">RETO {g.round} DE {g.max_round||V2_CHALLENGE_COUNT}</div><h1>{r?.title}</h1></div><div><p>{r?.case}</p><strong className="v2-wall-question">{r?.question}</strong></div></div>

      <div className="v2-wall-primary-grid">
        <TopThree rows={data.top3||[]} show={g.round>1||(Number(data.checkpoint?.humans||0)>0&&Number(data.checkpoint?.check||0)>=Number(data.checkpoint?.humans||0))}/>
        <CheckpointBoard data={data} activeTeams={activeTeams}/>
      </div>

      {reveal&&<><WallValue teams={data.teams}/><WallDecisions round={g.round} decisions={data.decisions||[]}/></>}
      {g.status==='reveal'&&<section className="v2-wall-wow"><div><Sparkles size={24}/> IDEA CLAVE</div><strong>{r?.wow}</strong><p>{r?.reality}</p></section>}
    </div>}
  </main>
}
