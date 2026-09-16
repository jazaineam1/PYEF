import{CORE_ROLE_CODES,ROLE_ARCHETYPES}from'./codex.js'

export function rosterRoles(roster=[]){return new Set((roster||[]).map(x=>x?.role_code).filter(Boolean))}
export function hasTeamRole(roster=[],role){return rosterRoles(roster).has(role)}
export function dataCoversExperiments(roster=[]){const roles=rosterRoles(roster);return roles.has('data')&&!roles.has('integrator')}

export function teamMode(roster=[]){
  const n=(roster||[]).filter(x=>!x?.is_bot).length||((roster||[]).length)
  const fallback=dataCoversExperiments(roster)
  if(n<=0)return{size:0,kind:'unknown',label:'Composición pendiente',fallbackExperiment:false,coreTarget:4}
  if(n===3&&fallback)return{size:n,kind:'three',label:'Equipo de 3 · Modelos cubre también Experimentos',fallbackExperiment:true,coreTarget:4}
  if(n===4)return{size:n,kind:'four',label:'Equipo de 4 · cobertura ideal 4/4',fallbackExperiment:false,coreTarget:4}
  if(n>4)return{size:n,kind:'legacy-extra',label:`Equipo de ${n} · hay participantes de una arquitectura anterior; el objetivo actual sigue siendo 4/4`,fallbackExperiment:fallback,coreTarget:4}
  return{size:n,kind:'partial',label:`Equipo de ${n} · composición incompleta`,fallbackExperiment:fallback,coreTarget:4}
}

export function coreResponsibilityStatus(roster=[]){
  const roles=rosterRoles(roster)
  return CORE_ROLE_CODES.map(code=>({
    code,
    label:ROLE_ARCHETYPES[code]?.label||code,
    covered:roles.has(code)||(code==='integrator'&&dataCoversExperiments(roster)),
    coveredBy:roles.has(code)?code:(code==='integrator'&&dataCoversExperiments(roster)?'data':null)
  }))
}
