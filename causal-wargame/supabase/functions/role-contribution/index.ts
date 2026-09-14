import { body, json, options } from '../_shared/http.ts'
import { rpc } from '../_shared/rpc.ts'

Deno.serve(async req=>{
  const pre=options(req);if(pre)return pre
  try{
    const token=req.headers.get('x-game-token')
    if(!token)return json({error:'Token de jugador obligatorio'},401)
    const b=await body(req)
    if(b?.action==='submit'){
      return json(await rpc('cw_submit_role_contribution_v2',{
        p_token:token,
        p_round:Number(b.round),
        p_finding_code:String(b.finding_code||''),
        p_evidence:b.evidence&&typeof b.evidence==='object'?b.evidence:{}
      }))
    }
    return json(await rpc('cw_role_team_state',{p_token:token}))
  }catch(e){
    return json({error:e instanceof Error?e.message:String(e)},400)
  }
})
