import { body, json, options } from '../_shared/http.ts'
import { rpc } from '../_shared/rpc.ts'

Deno.serve(async req=>{
  const pre=options(req); if(pre)return pre
  try{
    const token=req.headers.get('x-facilitator-token')||''
    if(!token)return json({error:'Falta x-facilitator-token'},401)
    const b=await body(req)

    if(b?.action==='state'){
      const out:any=await rpc('cw_v2_facilitator_state',{p_token:token})
      const code=String(out?.game?.code||'')
      const score=code?await rpc('cw_v2_wall_score_state',{p_game_code:code}):{}
      return json({...out,...score})
    }

    const action=String(b?.action||'')
    if(action==='reset') await rpc('cw_v2_reset_checkpoint_scores',{p_token:token})
    const out=await rpc('cw_v2_facilitator_action',{
      p_token:token,p_action:action,p_seconds:Number(b?.seconds||60)
    })
    if(action==='reveal') await rpc('cw_v2_reveal_team_points',{p_token:token})
    return json(out)
  }catch(e){return json({error:e.message},400)}
})
