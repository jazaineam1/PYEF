import { body, json, options } from '../_shared/http.ts'
import { rpc } from '../_shared/rpc.ts'

Deno.serve(async req=>{
  const pre=options(req); if(pre)return pre
  try{
    const token=req.headers.get('x-game-token')||''
    if(!token)return json({error:'Falta x-game-token'},401)
    const b=await body(req)
    const round=Number(b.round)

    if(b?.action==='individual'){
      return json(await rpc('cw_v2_submit_individual',{
        p_token:token,p_round:round,p_payload:b.payload||{}
      }))
    }

    if(b?.action==='lab_complete'){
      return json(await rpc('cw_v2_complete_lab',{p_token:token,p_round:round}))
    }

    if(b?.action==='check'){
      return json(await rpc('cw_v2_submit_check',{
        p_token:token,p_round:round,p_answer:String(b.answer||'')
      }))
    }

    if(b?.action==='revision'){
      await rpc('cw_v2_assert_ready_for_revision',{p_token:token,p_round:round})
      const out=await rpc('cw_v2_submit_revision',{
        p_token:token,p_round:round,p_payload:b.payload||{}
      })
      await rpc('cw_v2_award_revision_points',{p_token:token,p_round:round})
      return json(out)
    }

    if(b?.action==='learning_event'){
      return json(await rpc('cw_v2_log_learning_event',{
        p_token:token,
        p_round:round,
        p_event_type:String(b.event_type||''),
        p_payload:b.payload||{}
      }))
    }

    if(b?.action==='team'){
      const out:any=await rpc('cw_v2_submit_team_decision',{
        p_token:token,p_round:round,p_payload:b.payload||{}
      })
      await rpc('cw_v2_award_team_points',{p_token:token,p_round:round})
      return json({ok:true,decision_id:out?.decision_id||null})
    }

    return json({error:'Acción V2 inválida'},400)
  }catch(e){return json({error:e.message},400)}
})
