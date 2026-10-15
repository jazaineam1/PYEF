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
   const state=await rpc('cw_dean_state_v3',{p_code:code,p_hash:hash}) as Record<string,unknown>
   if(state?.dgp_version==='zip_dgp_2026'){
    const schedule=await rpc('cw_dean_agenda_status',{p_code:code}) as Record<string,unknown>
    return json({...state,agenda_enabled:schedule?.enabled===true,agenda_cap:Number(schedule?.cap||6),game_mode:schedule?.protocol||null})
   }
   return json(state)
  }
  if(action==='teacher'){
   if(!teacher)return json({error:'Credencial del docente requerida'},401)
   if(!['create','next'].includes(String(b.command)))return json({error:'Acción no admitida'},400)
   if(b.command==='create')return json(await rpc('cw_dean_create_v3',{p_token:teacher}))
     if(code){
      const requested=await rpc('cw_dean_agenda_status',{p_code:code}) as Record<string,unknown>
      if(['real_hours_10_v1','real_hours_6_v1'].includes(String(requested?.protocol||'')))
       return json(await rpc('cw_dean_game_start_v3',{p_token:teacher}))
     }
     return json(await rpc('cw_dean_learning_next',{p_token:teacher}))
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
  if(action==='game_finish'){
    if(!teacher)return json({error:'Sesión docente requerida'},401)
    return json(await rpc('cw_dean_game_finish_v3',{p_token:teacher}))
   }
   if(action==='lobby_ready'){
    if(!student)return json({error:'Sesión de jugador requerida'},401)
    return json(await rpc('cw_dean_arcade_ready_v4',{
      p_hash:hash,p_ready:b.ready===true
    }))
   }
   if(action==='policy_submit'){
    if(!student)return json({error:'Sesión de jugador requerida'},401)
    return json(await rpc('cw_dean_arcade_policy_submit_v4',{
      p_hash:hash,p_choice:String(b.choice||'')
    }))
   }
   if(action==='game_export'||action==='teacher_game_export'){
    if(action==='teacher_game_export'&&!teacher)return json({error:'Sesión docente requerida'},401)
    if(action==='game_export'&&!student)return json({error:'Sesión de jugador requerida'},401)
    const data=await (action==='teacher_game_export'
      ?rpc('cw_dean_game_export_facilitator_v4',{p_token:teacher})
      :rpc('cw_dean_game_export_v3',{p_hash:hash})) as {columns:unknown[],rows:unknown[][]}
    const lines=[data.columns,...data.rows].map(row=>row.map(csv).join(','))
    return new Response('\uFEFF'+lines.join('\r\n')+'\r\n',{headers:{...cors,
     'content-type':'text/csv; charset=utf-8',
     'content-disposition':'attachment; filename="copa_decano_datos_observados.csv"'}})
   }
   if(action==='reset_confirmed'){
   if(!teacher)return json({error:'Autorización del facilitador requerida'},401)
   if(!code||String(b.confirmation_code||'')!==code)
     return json({error:'Para reiniciar escribe el código exacto de la Copa'},400)
   return json(await rpc('cw_dean_reset_confirmed',{p_token:teacher,p_confirmation_code:code}))
  }
  if(action==='mission_state'){
   if(!code)return json({error:'Código requerido'},400)
   return json(await rpc('cw_dean_mission_state',{p_code:code,p_hash:hash}))
  }
  if(action==='mission_submit'){
   if(!student)return json({error:'Credencial estudiantil obligatoria'},401)
   return json(await rpc('cw_dean_mission_submit',{
    p_hash:hash,p_mission:String(b.mission||''),p_answer:b.answer||{}
   }))
  }
  if(action==='learning_state'){
   if(!code)return json({error:'Código requerido'},400)
   return json(await rpc('cw_dean_learning_state_v5',{p_code:code,p_hash:hash}))
  }
  if(action==='learning_submit'){
   if(!student)return json({error:'Credencial de estudiante requerida'},401)
   return json(await rpc('cw_dean_learning_submit',{p_hash:hash,p_phase:String(b.phase||''),
    p_kind:String(b.kind||''),p_choice:String(b.choice||'').toLowerCase()}))
  }
  if(action==='learning_teacher'){
   if(!teacher)return json({error:'Credencial docente requerida'},401)
   const command=String(b.command||'')
   if(!['evidence','debrief','pause','resume','demo'].includes(command))return json({error:'Acción de clase inválida'},400)
   return json(await rpc('cw_dean_learning_teacher',{p_token:teacher,p_action:command}))
  }
  if(action==='quiz_state'){
   if(!code)return json({error:'Código requerido'},400)
   await rpc('cw_dean_quiz_tick_v4',{p_code:code})
   const snapshot=await rpc('cw_dean_quiz_state_v4',{p_code:code,p_hash:hash}) as Record<string,unknown>
   // Preserve historical FUTUROS word-for-word. Canonical Copas use ONE intervention:
   // B=0 versus B=4 hours weekly of the institutional wellness programme.
   if(snapshot.auto_mode===true&&snapshot.question&&typeof snapshot.question==='object'){
    const q=snapshot.question as Record<string,unknown>
    const fix=(v:unknown)=>String(v||'').replace(/ofrecer apoyo académico/gi,'ofrecer bienestar B=4 h frente a B=0 h')
     .replace(/con y sin apoyo/gi,'con bienestar B=4 h frente a B=0 h')
     .replace(/plan académico/gi,'programa de bienestar B=4 h frente a B=0 h')
     .replace(/recibir apoyo/gi,'recibir bienestar B=4 h')
     .replace(/después de recibir apoyo/gi,'después de asignar bienestar B=4 h')
    for(const key of ['text','explanation']){
     if(typeof q[key]==='string')q[key]=fix(q[key])
    }
    if(Number(snapshot.question_no)===8){
     // Transfer: a DIFFERENT intervention, explicitly labelled so the main
     // 0h vs 4h wellness story is not silently replaced by academic support.
     q.text='MISIÓN DE TRANSFERENCIA · Una capacitación laboral se ofreció primero a empleados muy motivados. Los asistentes produjeron más. ¿Qué justifica recomendar la capacitación a todos?'
     q.options={
      a:'La correlación observada demuestra el efecto de capacitar.',
      b:'Elegir a los de mayor productividad predicha resuelve la selección.',
      c:'Usar un modelo complejo elimina automáticamente la motivación no medida.',
      d:'Definir T/Y y comparador, examinar selección por motivación y diseñar una comparación causal válida.'
     }
     q.explanation='Este es OTRO tratamiento, distinto de B=4 horas de bienestar. La motivación previa puede explicar selección y resultados. La asociación no identifica por sí misma un efecto causal.'
    }
    snapshot.question=q
   }
   return json(snapshot)
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
