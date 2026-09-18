import{enabledChallenges,V2_CHALLENGE_COUNT}from'./challenge-registry.js'

export const V2_MISSION={
  title:'DOS FUTUROS',
  subtitle:'Aprende a distinguir predicción, comparación y efecto causal tomando decisiones simples.',
  rules:['Decide con lo que sabes','Prueba tu idea con datos','Revisa tu decisión','Habla con tu equipo','Decidan juntos','Descubre qué cambió']
}

export const V2_ROUNDS=Object.fromEntries(enabledChallenges().map((c,i)=>[
  i+1,{
    id:c.id,
    kicker:c.kicker,
    title:c.title,
    case:c.scenario,
    question:c.simpleQuestion,
    individual:c.initialDecision,
    revise:c.revisedDecision,
    team:c.teamDecision,
    concept:c.technicalTerm,
    plainConcept:c.plainConcept,
    advancedTerms:c.advancedTerms,
    takeaway:c.takeaway,
    checkQuestion:c.checkQuestion,
    checkOptions:c.checkOptions,
    evidence:c.labKey,
    wow:c.wow,
    reality:c.takeaway,
    timeMinutes:c.timeMinutes,
    template:c.template,
    profileRound:c.profileRound,
    points:c.points,
    journey:c.journey
  }
]))

export{V2_CHALLENGE_COUNT}

export const RECOMMENDATIONS=[
  ['cancel','Cancelar el mes gratis'],
  ['keep','Mantenerlo como está'],
  ['redesign','Pedir una comparación mejor']
]

export const POLICY_ACTIONS=[
  ['treat','Ofrecer bono'],
  ['avoid','No ofrecerlo'],
  ['observe','Pedir más evidencia']
]

export const statusCopy=status=>({
  lobby:'Esperando participantes',briefing:'Reto listo',lesson:'Preparando reto',round:'Decisión abierta',
  closed:'Decisiones cerradas',reveal:'Reveal',teaching:'Cierre docente',microcheck:'Comprobación',paused:'Pausa',finished:'Experiencia finalizada'
}[status]||status)
