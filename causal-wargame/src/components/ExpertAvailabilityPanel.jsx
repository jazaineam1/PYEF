import React,{useEffect,useState}from'react'
import{Clock3,GraduationCap,Minus,Plus,ShieldCheck}from'lucide-react'
import{invoke}from'../lib/api'

export function ExpertAvailabilityPanel({round}){
  const[data,setData]=useState(null);const[busy,setBusy]=useState('');const[err,setErr]=useState('')
  async function refresh(){try{setData(await invoke('expert-market',{},'facilitator'));setErr('')}catch(e){setErr(e.message)}}
  useEffect(()=>{refresh();const i=setInterval(refresh,5000);return()=>clearInterval(i)},[round])
  async function setSlots(help_id,slots){setBusy(help_id);try{setData(await invoke('expert-market',{action:'set',help_id,slots},'facilitator'));setErr('')}catch(e){setErr(e.message)}finally{setBusy('')}}
  return <div className="card expert-admin"><div className="section-title" style={{marginTop:0}}><h3>Disponibilidad real de expertos · ronda {data?.round||round}</h3><p>El Game Master coordina y no se vende. Sólo estos tres expertos aparecen en el mercado cuando tú habilitas cupos.</p></div><div className="expert-admin-grid">{(data?.experts||[]).map(x=>{const p=x.profile||{};const slots=Number(x.slots||0),used=Number(x.used||0);return <div className="expert-admin-card" key={x.help_id}><div className="expert-admin-head"><GraduationCap/><div><b>{p.rank||x.title}</b><small>{p.max_role}</small></div></div><p>{p.scope}</p><div className="expert-price-curve"><span>Curva por demanda</span><b>{(x.price_curve||[]).join(' → ')}</b></div><div className="slot-control"><button className="btn btn-ghost" disabled={busy===x.help_id||slots<=used} onClick={()=>setSlots(x.help_id,Math.max(used,slots-1))}><Minus size={14}/></button><div><strong>{slots}</strong><span>cupos · {used} vendidos</span></div><button className="btn btn-ghost" disabled={busy===x.help_id||slots>=4} onClick={()=>setSlots(x.help_id,slots+1)}><Plus size={14}/></button></div><div className={`availability-status ${slots>used?'on':'off'}`}>{slots>used?<><ShieldCheck size={14}/> Disponible en mercado</>:<><Clock3 size={14}/> Sin disponibilidad libre</>}</div></div>})}</div>{err&&<div className="notice notice-red">Disponibilidad: {err}</div>}</div>
}
