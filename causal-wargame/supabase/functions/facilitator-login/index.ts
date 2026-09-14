import { body, json, options } from '../_shared/http.ts';import { rpc } from '../_shared/rpc.ts'
Deno.serve(async req=>{const pre=options(req);if(pre)return pre;try{const b=await body(req);const data=await rpc('cw_facilitator_login',{p_code:b.game_code,p_pin:b.pin});return json(data)}catch(e){return json({error:e.message},401)}})
