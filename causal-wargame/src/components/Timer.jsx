import { useEffect, useState } from 'react'
import { formatRemaining } from '../lib/time'
export function Timer({closesAt}){
  const [text,setText]=useState(()=>formatRemaining(closesAt))
  useEffect(()=>{const f=()=>setText(formatRemaining(closesAt));f();const i=setInterval(f,500);return()=>clearInterval(i)},[closesAt])
  const secs = closesAt ? Math.max(0,(closesAt-Date.now())/1000) : 9999
  return <div className={`timer ${secs<60?'danger':secs<180?'warn':''}`}>{text}</div>
}
