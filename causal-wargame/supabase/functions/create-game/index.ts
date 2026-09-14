import { body, json, options } from '../_shared/http.ts'
import { rpc } from '../_shared/rpc.ts'

function constantTimeEqual(a:string,b:string){
  const aa=new TextEncoder().encode(a), bb=new TextEncoder().encode(b)
  let diff=aa.length^bb.length
  const n=Math.max(aa.length,bb.length,1)
  for(let i=0;i<n;i++) diff|=(aa[i%Math.max(aa.length,1)]||0)^(bb[i%Math.max(bb.length,1)]||0)
  return diff===0
}

Deno.serve(async req=>{
  const pre=options(req); if(pre)return pre
  try{
    const expected=Deno.env.get('CAUSAL_BOOTSTRAP_SECRET')??''
    const supplied=req.headers.get('x-bootstrap-secret')??''
    if(!expected||!supplied||!constantTimeEqual(expected,supplied)) return json({error:'No autorizado'},403)
    const b=await body(req)
    const code=String(b.game_code||'').trim().toUpperCase()
    const pin=String(b.pin||'')
    if(!/^[A-Z0-9-]{4,20}$/.test(code)) return json({error:'Código inválido: usa 4–20 letras, números o guiones'},400)
    if(pin.length<8) return json({error:'El PIN del facilitador debe tener al menos 8 caracteres'},400)
    const game_id=await rpc('cw_bootstrap_game',{p_code:code,p_pin:pin})
    return json({ok:true,game_id,game_code:code})
  }catch(e){ return json({error:e.message},400) }
})
