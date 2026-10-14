import { json, options } from '../_shared/http.ts'
import { rpc } from '../_shared/rpc.ts'

Deno.serve(async req=>{
  const pre=options(req); if(pre)return pre
  try{
    const token=req.headers.get('x-game-token')||''
    if(!token)return json({error:'Falta x-game-token'},401)
    const out:any=await rpc('cw_v2_analysis',{p_token:token})
    if(out?.team_tools?.econml){const {econml,...academic}=out.team_tools;out.team_tools=academic}
    // The old analytical RPC has one fixed illustrative effect for all rounds.
    // Normalize its reveal to the same causal DGP used by student and Wall.
    if(out?.reveal_tools&&['reveal','teaching','microcheck','finished'].includes(String(out.status||''))){
      const truth:any=await rpc('cw_v2_academic_truth',{p_round:Number(out.round||0)})
      out.reveal_tools={...out.reveal_tools,...truth}
    }
    return json(out)
  }catch(e){return json({error:e.message},401)}
})
