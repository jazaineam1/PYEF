export const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-game-token, x-facilitator-token',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
}

export function json(data: unknown, status=200) {
  return new Response(JSON.stringify(data), { status, headers: { ...cors, 'content-type': 'application/json; charset=utf-8' } })
}

export async function body(req: Request) {
  try { return await req.json() } catch { return {} }
}

export function options(req: Request) {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  return null
}
