import { body, json, options } from '../_shared/http.ts'
import { rpc } from '../_shared/rpc.ts'

Deno.serve(async req=>{
  const pre=options(req); if(pre)return pre
  try{
    const token=req.headers.get('x-game-token')||''
    if(!token)return json({error:'Falta x-game-token'},401)
    const b=await body(req)

    if(b?.action==='individual'){
      return json(await rpc('cw_v2_submit_individual',{
        p_token:token,p_round:Number(b.round),p_payload:b.payload||{}
      }))
    }

    if(b?.action==='revision'){
      return json(await rpc('cw_v2_submit_revision',{
        p_token:token,p_round:Number(b.round),p_payload:b.payload||{}
      }))
    }

    if(b?.action==='learning_event'){
      return json(await rpc('cw_v2_log_learning_event',{
        p_token:token,
        p_round:Number(b.round),
        p_event_type:String(b.event_type||''),
        p_payload:b.payload||{}
      }))
    }

    if(b?.action==='team'){
      const out:any=await rpc('cw_v2_submit_team_decision',{
        p_token:token,p_round:Number(b.round),p_payload:b.payload||{}
      })
      return json({ok:true,decision_id:out?.decision_id||null})
    }

    return json({error:'Acción V2 inválida'},400)
  }catch(e){return json({error:e.message},400)}
})
