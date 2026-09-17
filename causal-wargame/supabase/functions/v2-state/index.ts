import { json, options } from '../_shared/http.ts'
import { rpc } from '../_shared/rpc.ts'

Deno.serve(async req=>{
  const pre=options(req); if(pre)return pre
  try{
    const token=req.headers.get('x-game-token')||''
    if(!token)return json({error:'Falta x-game-token'},401)
    const out:any=await rpc('cw_v2_state',{p_token:token})
    const status=String(out?.game?.status||'')
    const reveal=new Set(['reveal','teaching','microcheck','finished'])
    if(out?.team_decision&&!reveal.has(status)) out.team_decision={...out.team_decision,result:null}
    return json(out)
  }catch(e){return json({error:e.message},401)}
})
