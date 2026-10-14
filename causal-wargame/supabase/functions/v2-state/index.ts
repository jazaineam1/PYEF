import { json, options } from '../_shared/http.ts'
import { rpc } from '../_shared/rpc.ts'

Deno.serve(async req=>{
  const pre=options(req); if(pre)return pre
  try{
    const token=req.headers.get('x-game-token')||''
    if(!token)return json({error:'Falta x-game-token'},401)
    const out:any=await rpc('cw_v2_state',{p_token:token})
    const score:any=await rpc('cw_v2_player_score_state',{p_token:token})
    const status=String(out?.game?.status||'')
    const revealStatuses=new Set(['reveal','teaching','microcheck','finished'])

    // Team score and synthetic impact are private until facilitator reveal.
    if(out?.team_decision&&!revealStatuses.has(status)){
      out.team_decision={...out.team_decision,result:null}
    }

    // Do not forward legacy retention/bonus copy from the reusable data profile.
    // The public learner contract is academic and exposes only the academic reveal.
    out.reveal=revealStatuses.has(status)
      ? {title:'Resultado causal académico',...(await rpc('cw_v2_academic_truth',{p_round:Number(out?.game?.round||0)}))}
      : null

    return json({...out,progress:score})
  }catch(e){return json({error:e.message},401)}
})
