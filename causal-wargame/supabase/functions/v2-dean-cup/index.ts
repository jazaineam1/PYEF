import {body,json,options,cors} from '../_shared/http.ts'
import {rpc} from '../_shared/rpc.ts'
const digest=async(value:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))).map(x=>x.toString(16).padStart(2,'0')).join('')
const csv=(v:unknown)=>{const s=String(v??'');const safe=/^[=+\-@]/.test(s)?"'"+s:s;return '"'+safe.replace(/"/g,'""')+'"'}
Deno.serve(async(req)=>{
 const pre=options(req);if(pre)return pre
 if(req.method!=='POST')return json({error:'Solo POST'},405)
 try{
  const b=await body(req),action=String(b.action||'state'),code=String(b.game_code||'').trim().toUpperCase()
  const student=req.headers.get('x-game-token')||''
  const teacher=req.headers.get('x-facilitator-token')||''
  const hash=student?await digest(student):null
  if(action==='state'){
   if(!code)return json({error:'Código requerido'},400)
   await rpc('cw_dean_tick_v3',{p_game_code:code})
   return json(await rpc('cw_dean_state_v3',{p_code:code,p_hash:hash}))
  }
  if(action==='teacher'){
   if(!teacher)return json({error:'Credencial del docente requerida'},401)
   if(!['create','next'].includes(String(b.command)))return json({error:'Acción no admitida'},400)
   return json(await (b.command==='create'?rpc('cw_dean_create_v3',{p_token:teacher}):rpc('cw_dean_learning_next',{p_token:teacher}) /* wraps cw_dean_teacher_next_v3 with V2 learning gate */))
  }
  // Isolated teaching arc, stored on server; no correct option before debrief.
  // Start a completely new tournament: no mutation or reset of the source game.
  // Only a valid facilitator session for the currently displayed game may create it.
  if(action==='new_cup'){
   if(!teacher)return json({error:'Inicia sesión como facilitador para crear una Copa nueva'},401)
   if(!code)return json({error:'Se necesita el código de la partida actual'},400)
   return json(await rpc('cw_dean_create_fresh_cup',{
    p_facilitator_token:teacher,p_source_code:code
   }))
  }
  if(action==='reset_confirmed'){
   if(!teacher)return json({error:'Autorización del facilitador requerida'},401)
   if(!code||String(b.confirmation_code||'')!==code)
     return json({error:'Para reiniciar escribe el código exacto de la Copa'},400)
   return json(await rpc('cw_dean_reset_confirmed',{p_token:teacher,p_confirmation_code:code}))
  }
  if(action==='learning_state'){
   if(!code)return json({error:'Código requerido'},400)
   return json(await rpc('cw_dean_learning_state',{p_code:code,p_hash:hash}))
  }
  if(action==='learning_submit'){
   if(!student)return json({error:'Credencial de estudiante requerida'},401)
   return json(await rpc('cw_dean_learning_submit',{p_hash:hash,p_phase:String(b.phase||''),
    p_kind:String(b.kind||''),p_choice:String(b.choice||'').toLowerCase()}))
  }
  if(action==='learning_teacher'){
   if(!teacher)return json({error:'Credencial docente requerida'},401)
   const command=String(b.command||'')
   if(!['evidence','debrief','pause','resume'].includes(command))return json({error:'Acción de clase inválida'},400)
   return json(await rpc('cw_dean_learning_teacher',{p_token:teacher,p_action:command}))
  }
  if(action==='quiz_state'){
   if(!code)return json({error:'Código requerido'},400)
   await rpc('cw_dean_quiz_tick_v4',{p_code:code})
   return json(await rpc('cw_dean_quiz_state_v4',{p_code:code,p_hash:hash}))
  }
  if(action==='quiz_submit'){
   if(!student)return json({error:'Sesión de estudiante obligatoria'},401)
   return json(await rpc('cw_dean_quiz_submit',{p_hash:hash,p_question:Number(b.question),p_choice:String(b.choice||'').toLowerCase()}))
  }
  if(action==='quiz_teacher'){
   if(!teacher)return json({error:'Credencial docente obligatoria'},401)
   if(!['start','open','lock','reveal','next','finish'].includes(b.command))return json({error:'Acción inválida'},400)
   return json(await rpc('cw_dean_quiz_teacher_v4',{p_token:teacher,p_action:String(b.command)}))
  }
  if(action==='join'){
   if(!student||student.length<35)return json({error:'Sesión local de estudiante inválida'},401)
   return json(await rpc('cw_dean_join_v3',{p_code:code,p_alias:String(b.alias||''),p_room:Number(b.room),p_token_hash:hash}))
  }
  if(action==='exam'){
   if(!student)return json({error:'Falta sesión de estudiante'},401)
   return json(await rpc('cw_dean_exam_v3',{p_token_hash:hash,p_exam:Number(b.exam),
    p_study:Number(b.study),p_sleep:Number(b.sleep),p_wellness:Number(b.wellness),p_auto:false}))
  }
  if(action==='auto_finish'){
   if(!student)return json({error:'Falta sesión estudiantil'},401)
   return json(await rpc('cw_dean_auto_finish_v3',{p_token_hash:hash}))
  }
  if(action==='teacher_truth'){
   if(!teacher)return json({error:'Autorización docente requerida'},401)
   const data=await rpc('cw_dean_teacher_truth',{p_fac_token:teacher}) as {columns:unknown[],rows:unknown[][]}
   const lines=[data.columns,...data.rows].map(row=>row.map(csv).join(','))
   return new Response('\uFEFF'+lines.join('\r\n')+'\r\n',{headers:{...cors,
    'content-type':'text/csv; charset=utf-8',
    'content-disposition':'attachment; filename="verdad_sintetica_docente.csv"'}})
  }
  if(action==='ab_generate'){
   if(!teacher)return json({error:'Solo el docente puede iniciar un A/B'},401)
   return json(await rpc('cw_dean_ab_generate_v3',{p_fac_token:teacher}))
  }
  if(action==='ab_download'){
   if(!student)return json({error:'Sesión de estudiante requerida'},401)
   const data=await rpc('cw_dean_learning_ab_observed',{p_hash:hash}) /* protected cw_dean_ab_observed_v3 */ as {columns:unknown[],rows:unknown[][]}
   const lines=[data.columns,...data.rows].map(row=>row.map(csv).join(','))
   return new Response('\uFEFF'+lines.join('\r\n')+'\r\n',{headers:{...cors,
      'content-type':'text/csv; charset=utf-8',
      'content-disposition':'attachment; filename="cohorte_ab_test_2026.csv"'}})
  }
  if(action==='ab_truth'){
   if(!teacher)return json({error:'Solo el docente puede ver los contrafactuales'},401)
   const data=await rpc('cw_dean_ab_teacher_v3',{p_fac_token:teacher}) as {columns:unknown[],rows:unknown[][]}
   const lines=[data.columns,...data.rows].map(row=>row.map(csv).join(','))
   return new Response('\uFEFF'+lines.join('\r\n')+'\r\n',{headers:{...cors,
      'content-type':'text/csv; charset=utf-8',
      'content-disposition':'attachment; filename="cohorte_ab_doctor_strange.csv"'}})
  }
  if(action==='export'){
   if(!student)return json({error:'Falta sesión de estudiante'},401)
   const layer=String(b.layer||'')
   if(!['rector','survey'].includes(layer))return json({error:'Capa de datos inválida'},400)
   const data=await rpc('cw_dean_learning_export',{p_hash:hash,p_layer:layer}) /* protected cw_dean_export */ as {columns:unknown[],rows:unknown[][]}
   const lines=[data.columns,...data.rows].map(row=>row.map(csv).join(','))
   const name=layer==='rector'?'sistema_academico_rector.csv':'encuesta_estudiantes_juego.csv'
   return new Response('\uFEFF'+lines.join('\r\n')+'\r\n',{headers:{...cors,
    'content-type':'text/csv; charset=utf-8',
    'content-disposition':'attachment; filename="'+name+'"'}})
  }
  return json({error:'Acción desconocida'},400)
 }catch(e){return json({error:e instanceof Error?e.message:'Error inesperado'},400)}
})
