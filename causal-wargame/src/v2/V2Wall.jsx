import React,{useEffect,useRef,useState}from'react'
import{CheckCircle2,Trophy,Sparkles}from'lucide-react'
import{invoke}from'../lib/api'
import{V2_ROUNDS,RECOMMENDATIONS,statusCopy}from'./content'

const jitter=n=>Math.round(n*(.9+Math.random()*.2))
const copShort=n=>new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',notation:'compact',maximumFractionDigits:1}).format(Number(n||0))

function decisionText(round,payload={}){
  if(round===1)return 'Intervenir: '+(payload.selected||[]).join(', ')
  if(round===2)return RECOMMENDATIONS.find(x=>x[0]===payload.recommendation)?.[1]||'—'
  return 'Tratar: '+((payload.treat||[]).join(', ')||'ninguno')+' · Evitar: '+((payload.avoid||[]).join(', ')||'ninguno')
}

function WallValue({teams=[]}){
  const rows=[...teams].filter(t=>Number(t.humans||0)>0||Number(t.rounds_scored||0)>0).sort((a,b)=>Number(b.total_value_cop||0)-Number(a.total_value_cop||0)||Number(a.position||0)-Number(b.position||0))
  if(!rows.some(t=>Number(t.rounds_scored||0)>0))return null
  const max=Math.max(1,...rows.map(t=>Math.abs(Number(t.total_value_cop||0))))
  return <section className="v2-wall-score"><div className="v2-wall-score-title"><Trophy size={24}/><div><b>VALOR INCREMENTAL</b><span>acumulado por equipo</span></div></div><div className="v2-wall-score-rows">{rows.map((t,i)=><div key={t.id} className={i===0?'leader':''}><span>{i+1}</span><strong>{t.name}</strong><div><i style={{width:(Math.abs(Number(t.total_value_cop||0))/max*100)+'%'}}/></div><b>{copShort(t.total_value_cop)}</b>{t.round_value_cop!==null&&t.round_value_cop!==undefined&&<em>{Number(t.round_value_cop)>=0?'+':''}{copShort(t.round_value_cop)}</em>}</div>)}</div></section>
}

function WallDecisions({round,decisions=[]}){
  if(!decisions.length)return null
  return <section className="v2-wall-decisions"><div className="v2-wall-section-title"><b>ASÍ DECIDIERON TODOS</b><span>El ranking usa COP de valor incremental, no puntos.</span></div><div className="v2-wall-decision-grid">{decisions.map(d=><article key={d.team_id}><div><strong>{d.team}</strong><span>{copShort(d.value_cop)}</span></div><p>{decisionText(round,d.payload)}</p></article>)}</div></section>
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

  if(!code)return <main className="v2-shell v2-center"><section className="v2-join-card"><div className="v2-brand">DOS FUTUROS <span>V2 WALL</span></div><h1>¿Qué sesión quieres proyectar?</h1><label>Código<input value={code} onChange={e=>setCode(e.target.value.toUpperCase())} placeholder="DF2-ABC123"/></label></section></main>
  if(err&&!data)return <main className="v2-shell v2-center"><div className="v2-alert error">{err}</div></main>
  if(!data)return <main className="v2-shell v2-center"><div className="v2-loader">Conectando…</div></main>

  const g=data.game,r=V2_ROUNDS[g.round]
  const lobby=['lobby','briefing','lesson'].includes(g.status)
  const reveal=['closed','reveal','teaching','microcheck','finished'].includes(g.status)
  const activeTeams=data.teams.filter(t=>t.humans>0)

  return <main className="v2-wall compact-wall">
    <div className="v2-wall-top"><div><div className="v2-brand">DOS FUTUROS <span>V2</span></div><div className="v2-kicker">{lobby?'ÚNETE DESDE TU TELÉFONO':statusCopy(g.status)}</div></div><div className="v2-wall-code"><span>CÓDIGO DE SESIÓN</span><strong>{g.code}</strong></div></div>

    {lobby?<div className="v2-wall-lobby"><div className="v2-wall-count"><strong>{data.humans}</strong><span>participantes conectados</span></div><div className="v2-wall-teams compact">{data.teams.map(t=>{const members=data.players.filter(p=>p.team_id===t.id);const full=t.humans>=3;return <section className={'v2-wall-team '+(full?'ready':'')} key={t.id}><div className="v2-team-head"><h2>{t.name}</h2>{full&&<CheckCircle2 size={20}/>}</div><div className="v2-wall-member-row">{members.map(p=><span className={(p.online?'':'offline ') + (newIds.has(p.id)?'new':'')} key={p.id}>{p.name}</span>)}{!members.length&&<span className="offline">Esperando…</span>}</div><div className="v2-wall-progress"><i style={{width:Math.min(100,(t.humans/4)*100)+'%'}}/></div><small>{t.humans}/4 {full?'· LISTO':'· entrando'}</small></section>})}</div></div>:
    <div className="v2-wall-stage">
      <div className="v2-wall-phase compact"><div><div className="v2-kicker">MISIÓN {g.round} DE 3</div><h1>{r?.title}</h1></div><p>{r?.case}</p></div>
      <div className="v2-wall-main-grid">
        <section className="v2-wall-team-progress"><div className="v2-wall-section-title"><b>{reveal?'CIERRE DE MISIÓN':'PROGRESO EN VIVO'}</b><span>{reveal?'Ya se pueden comparar decisiones y valor.':'Sin revelar respuestas ni valor económico.'}</span></div><div className="v2-wall-teams compact">{activeTeams.map(t=>{const submitted=t.humans?Math.round((t.submitted/t.humans)*100):0;const revised=t.humans?Math.round((t.revised/t.humans)*100):0;const pctDone=t.decision?100:t.revised?Math.max(55,revised):Math.min(50,submitted/2);return <section className={'v2-wall-team '+(t.decision?'ready':'')} key={t.id}><div className="v2-team-head"><h2>{t.name}</h2>{t.decision&&<CheckCircle2 size={20}/>}</div><div className="v2-wall-team-number">{t.decision?'✓':t.revised>0?`${t.revised}/${t.humans}`:`${t.submitted}/${t.humans}`}</div><small>{t.decision?'POLÍTICA LISTA':t.revised>0?'decisiones revisadas':'decisiones iniciales'}</small><div className="v2-wall-progress"><i style={{width:pctDone+'%'}}/></div></section>})}</div></section>
        <WallValue teams={data.teams}/>
      </div>
      {reveal&&<WallDecisions round={g.round} decisions={data.decisions||[]}/>}
      {g.status==='reveal'&&<section className="v2-wall-wow"><div><Sparkles size={24}/> GIRO WOW</div><strong>{r?.wow}</strong><p>{r?.reality}</p></section>}
    </div>}
  </main>
}
