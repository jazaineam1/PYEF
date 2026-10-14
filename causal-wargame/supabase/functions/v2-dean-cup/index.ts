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
   return json(await rpc('cw_dean_state',{p_code:code,p_token_hash:hash}))
  }
  if(action==='teacher'){
   if(!teacher)return json({error:'Credencial del docente requerida'},401)
   if(!['create','next'].includes(String(b.command)))return json({error:'Acción no admitida'},400)
   return json(await rpc('cw_dean_teacher',{p_token:teacher,p_command:b.command}))
  }
  if(action==='join'){
   if(!student||student.length<35)return json({error:'Sesión local de estudiante inválida'},401)
   return json(await rpc('cw_dean_join',{p_code:code,p_alias:String(b.alias||''),p_room:Number(b.room),p_token_hash:hash}))
  }
  if(action==='exam'){
   if(!student)return json({error:'Falta sesión de estudiante'},401)
   return json(await rpc('cw_dean_exam',{p_token_hash:hash,p_exam:Number(b.exam),
    p_study:Number(b.study),p_sleep:Number(b.sleep),p_wellness:Number(b.wellness),p_auto:!!b.auto}))
  }
  if(action==='export'){
   if(!student)return json({error:'Falta sesión de estudiante'},401)
   const layer=String(b.layer||'')
   if(!['rector','survey'].includes(layer))return json({error:'Capa de datos inválida'},400)
   const data=await rpc('cw_dean_export',{p_token_hash:hash,p_layer:layer}) as {columns:unknown[],rows:unknown[][]}
   const lines=[data.columns,...data.rows].map(row=>row.map(csv).join(','))
   const name=layer==='rector'?'sistema_academico_rector.csv':'encuesta_estudiantes_juego.csv'
   return new Response('\uFEFF'+lines.join('\r\n')+'\r\n',{headers:{...cors,
    'content-type':'text/csv; charset=utf-8',
    'content-disposition':'attachment; filename="'+name+'"'}})
  }
  return json({error:'Acción desconocida'},400)
 }catch(e){return json({error:e instanceof Error?e.message:'Error inesperado'},400)}
})
