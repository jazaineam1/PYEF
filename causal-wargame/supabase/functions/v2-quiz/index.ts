import {body,json,options} from '../_shared/http.ts'
import {rpc} from '../_shared/rpc.ts'
Deno.serve(async req=>{
 const pre=options(req);if(pre)return pre
 try{
  if(req.method!=='POST')return json({error:'Solo POST'},405)
  const b=await body(req),action=String(b.action||'state')
  const fac=req.headers.get('x-facilitator-token')||''
  const player=req.headers.get('x-game-token')||''
  if(action==='wall'){
    const code=String(b.game_code||'').trim().toUpperCase()
    if(!code)return json({error:'Código obligatorio'},400)
    return json(await rpc('cw_v2_quiz_wall',{p_game_code:code}))
  }
  if(action==='student'){
    if(!player)return json({error:'Falta sesión de participante'},401)
    return json(await rpc('cw_v2_quiz_player',{p_token:player}))
  }
  if(action==='submit'){
    if(!player)return json({error:'Falta sesión de participante'},401)
    return json(await rpc('cw_v2_quiz_submit',{p_token:player,p_question:Number(b.question),p_choice:String(b.choice||'').toLowerCase()}))
  }
  if(action==='teacher'){
    if(!fac)return json({error:'Falta sesión del facilitador'},401)
    return json(await rpc('cw_v2_quiz_teacher',{p_token:fac,p_action:String(b.command||'state'),p_seconds:Number(b.seconds||20)}))
  }
  return json({error:'Acción inválida'},400)
 }catch(e){return json({error:e instanceof Error?e.message:'Error inesperado'},400)}
})
