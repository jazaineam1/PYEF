import { body, json, options } from '../_shared/http.ts'
import { rpc } from '../_shared/rpc.ts'

Deno.serve(async req=>{
  const pre=options(req);if(pre)return pre
  try{
    const token=req.headers.get('x-game-token')
    if(!token)return json({error:'Sesión de jugador obligatoria'},401)
    const b=await body(req)
    if(!Array.isArray(b?.items)||!b.items.length)return json({error:'Cesta vacía'},400)
    return json(await rpc('cw_buy_help_batch',{p_token:token,p_items:b.items}))
  }catch(e){return json({error:e instanceof Error?e.message:String(e)},400)}
})
