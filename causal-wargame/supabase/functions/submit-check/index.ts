import { body, json, options } from '../_shared/http.ts';import { rpc } from '../_shared/rpc.ts'
Deno.serve(async req=>{const pre=options(req);if(pre)return pre;try{const token=req.headers.get('x-game-token')||'';const b=await body(req);return json(await rpc('cw_submit_check',{p_token:token,p_round:b.round,p_answer:b.answer}))}catch(e){return json({error:e.message},400)}})
