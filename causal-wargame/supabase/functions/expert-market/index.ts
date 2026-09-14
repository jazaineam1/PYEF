import { body, json, options } from '../_shared/http.ts'
import { rpc } from '../_shared/rpc.ts'

Deno.serve(async req => {
  const pre = options(req)
  if (pre) return pre
  try {
    const token = req.headers.get('x-facilitator-token')
    if (!token) return json({ error: 'Token de facilitador obligatorio' }, 401)
    const b = await body(req)
    if (b?.action === 'set') {
      if (!b.help_id) return json({ error: 'help_id obligatorio' }, 400)
      return json(await rpc('cw_set_expert_availability', {
        p_token: token,
        p_help_id: String(b.help_id),
        p_slots: Number(b.slots ?? 0),
      }))
    }
    return json(await rpc('cw_expert_market_state', { p_token: token }))
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 400)
  }
})
