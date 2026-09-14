import { body, json, options } from '../_shared/http.ts'
import { rpc } from '../_shared/rpc.ts'

Deno.serve(async req=>{
  const pre=options(req); if(pre)return pre
  try{
    const supplied=req.headers.get('x-bootstrap-secret')??''
    if(!supplied) return json({error:'Falta la clave maestra de creación'},403)
    const b=await body(req)
    const code=String(b.game_code||'').trim().toUpperCase()
    const pin=String(b.pin||'')
    if(!/^[A-Z0-9-]{4,20}$/.test(code)) return json({error:'Código inválido: usa 4–20 letras, números o guiones'},400)
    if(pin.length<8) return json({error:'El PIN del facilitador debe tener al menos 8 caracteres'},400)
    const game_id=await rpc('cw_bootstrap_game_authorized',{p_admin_secret:supplied,p_code:code,p_pin:pin})
    return json({ok:true,game_id,game_code:code})
  }catch(e){ return json({error:e instanceof Error?e.message:String(e)},400) }
})
