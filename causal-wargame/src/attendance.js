export const MAX_HUMANS=28
export const MAX_TEAM_SIZE=4
export const MIN_PREFERRED_TEAM_SIZE=3

export function recommendedTeamCount(humans){
  const n=Math.max(0,Math.min(MAX_HUMANS,Number(humans)||0))
  if(n===0)return 4
  return Math.min(7,Math.max(1,Math.ceil(n/MAX_TEAM_SIZE)))
}

export function balancedTeamSizes(humans,teamCount=recommendedTeamCount(humans)){
  const n=Math.max(0,Math.min(MAX_HUMANS,Number(humans)||0))
  const teams=Math.max(1,Number(teamCount)||1)
  const base=Math.floor(n/teams)
  const extra=n%teams
  return Array.from({length:teams},(_,i)=>base+(i<extra?1:0))
}

export function attendancePlan(humans){
  const n=Math.max(0,Math.min(MAX_HUMANS,Number(humans)||0))
  const teams=recommendedTeamCount(n)
  const sizes=balancedTeamSizes(n,teams)
  const min=sizes.length?Math.min(...sizes):0
  const max=sizes.length?Math.max(...sizes):0
  const preferred=min>=MIN_PREFERRED_TEAM_SIZE&&max<=MAX_TEAM_SIZE
  const full=sizes.filter(x=>x===4).length
  const fallback=sizes.filter(x=>x===3).length
  return{humans:n,teams,sizes,min,max,preferred,full,fallback}
}

export function attendanceSummary(humans){
  const p=attendancePlan(humans)
  if(!p.humans)return'Esperando participantes'
  const distribution=p.sizes.join('–')
  if(p.preferred){
    const fallback=p.fallback?` · ${p.fallback} equipo${p.fallback===1?'':'s'} de 3 usa${p.fallback===1?'':'n'} doble sombrero Modelos → Experimentos`:''
    return`${p.teams} equipo${p.teams===1?'':'s'} · ${distribution}${fallback}`
  }
  return`${p.teams} equipo${p.teams===1?'':'s'} · ${distribution} · composición pequeña: requiere intervención docente`
}
