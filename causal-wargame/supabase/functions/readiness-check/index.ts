import { body, json, options } from '../_shared/http.ts'
import { rpc } from '../_shared/rpc.ts'

Deno.serve(async req => {
  const pre = options(req)
  if (pre) return pre
  try {
    const b = await body(req)
    if (b?.action === 'report') {
      const token = req.headers.get('x-facilitator-token')
      if (!token) return json({ error:'Token de facilitador obligatorio' },401)
      return json(await rpc('cw_readiness_report',{p_facilitator_token:token}))
    }
    return json(await rpc('cw_submit_readiness',{
      p_game_code:String(b?.game_code||''),
      p_display_name:String(b?.display_name||''),
      p_payload:b?.payload||{}
    }))
  } catch (e) {
    return json({ error:e instanceof Error?e.message:String(e) },400)
  }
})
