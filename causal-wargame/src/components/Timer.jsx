import { useEffect, useMemo, useState } from 'react'

function renderRemaining(closesAt,now){
  if(!closesAt)return '--:--'
  const s=Math.max(0,Math.ceil((closesAt-now)/1000))
  const m=Math.floor(s/60)
  return `${String(m).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`
}

export function Timer({closesAt,serverNow}){
  const offset=useMemo(()=>serverNow?new Date(serverNow).getTime()-Date.now():0,[serverNow])
  const[now,setNow]=useState(()=>Date.now()+offset)
  useEffect(()=>{
    const tick=()=>setNow(Date.now()+offset)
    tick();const i=setInterval(tick,500);return()=>clearInterval(i)
  },[offset])
  const secs=closesAt?Math.max(0,(closesAt-now)/1000):9999
  return <div className={`timer ${secs<60?'danger':secs<180?'warn':''}`}>{renderRemaining(closesAt,now)}</div>
}
