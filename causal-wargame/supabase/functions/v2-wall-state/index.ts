import { body, json, options } from '../_shared/http.ts'
import { rpc } from '../_shared/rpc.ts'

Deno.serve(async req=>{
  const pre=options(req); if(pre)return pre
  try{
    const b=await body(req)
    const game=String(b?.game_code||'').trim().toUpperCase()
    if(!game)return json({error:'Código de partida obligatorio'},400)
    const out:any=await rpc('cw_v2_wall_state',{p_game_code:game})
    const score:any=await rpc('cw_v2_wall_score_state',{p_game_code:game})
    const status=String(out?.game?.status||'')
    const academic_truth=['reveal','teaching','microcheck','finished'].includes(status)
      ? await rpc('cw_v2_academic_truth',{p_round:Number(out?.game?.round||0)}) : null
    return json({...out,...score,academic_truth})
  }catch(e){return json({error:e.message},404)}
})
