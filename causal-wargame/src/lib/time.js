export function formatRemaining(closesAt) {
  if (!closesAt) return '--:--'
  const s = Math.max(0, Math.ceil((closesAt - Date.now()) / 1000))
  const m = Math.floor(s / 60)
  return `${String(m).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`
}
