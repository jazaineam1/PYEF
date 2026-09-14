const url = Deno.env.get('SUPABASE_URL') ?? ''
// New projects should prefer sb_secret_*. Legacy SERVICE_ROLE_KEY remains a hosted fallback.
const key = Deno.env.get('SUPABASE_SECRET_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

export async function rpc(name: string, args: Record<string, unknown>) {
  if (!url || !key) throw new Error('SUPABASE_URL y una clave server-side no están disponibles')
  const headers: Record<string,string> = { 'content-type': 'application/json', apikey: key }
  // Legacy service_role keys are JWTs; new sb_secret_* keys must NOT be sent as Bearer tokens.
  if (key.startsWith('eyJ')) headers.Authorization = `Bearer ${key}`
  const r = await fetch(`${url}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(args),
  })
  const text = await r.text()
  let data: unknown = null
  try { data = text ? JSON.parse(text) : null } catch { data = text }
  if (!r.ok) {
    const msg = typeof data === 'object' && data && 'message' in data ? String((data as any).message) : `RPC ${name} HTTP ${r.status}`
    throw new Error(msg)
  }
  return data
}
