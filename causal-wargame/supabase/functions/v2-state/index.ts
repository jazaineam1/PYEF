import { json, options } from '../_shared/http.ts'
import { rpc } from '../_shared/rpc.ts'

Deno.serve(async req=>{
  const pre=options(req); if(pre)return pre
  try{
    const token=req.headers.get('x-game-token')||''
    if(!token)return json({error:'Falta x-game-token'},401)
    return json(await rpc('cw_v2_state',{p_token:token}))
  }catch(e){return json({error:e.message},401)}
})
