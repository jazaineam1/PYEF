import { body, json, options } from '../_shared/http.ts'
import { rpc } from '../_shared/rpc.ts'

Deno.serve(async req=>{
  const pre=options(req); if(pre)return pre
  try{
    const token=req.headers.get('x-facilitator-token')||''
    if(!token)return json({error:'Falta x-facilitator-token'},401)
    const b=await body(req)
    if(b?.action==='state') return json(await rpc('cw_v2_facilitator_state',{p_token:token}))
    return json(await rpc('cw_v2_facilitator_action',{p_token:token,p_action:String(b?.action||''),p_seconds:Number(b?.seconds||60)}))
  }catch(e){return json({error:e.message},400)}
})
