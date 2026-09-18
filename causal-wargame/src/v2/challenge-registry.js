const STANDARD_JOURNEY=[
  {id:'brief',label:'Contexto',student:'Entiende la situación y la decisión que tendrá que tomar.',evidence:false},
  {id:'initial',label:'Decisión inicial',student:'Decide con la información disponible, antes de ver la evidencia nueva.',evidence:false},
  {id:'wait_initial',label:'Espera al equipo',student:'Ve el progreso de sus compañeros; no ve sus respuestas todavía.',evidence:false},
  {id:'lab',label:'Laboratorio',student:'Ejecuta Python o consulta evidencia para poner a prueba su primera intuición.',evidence:true},
  {id:'revision',label:'Revisión',student:'Vuelve a decidir y puede mantener o cambiar su respuesta.',evidence:true},
  {id:'compare',label:'Comparar',student:'Ve cómo cambiaron las respuestas de su equipo después del análisis.',evidence:true},
  {id:'team',label:'Decisión de equipo',student:'Discute y bloquea una única política del equipo.',evidence:true},
  {id:'reveal',label:'Reveal',student:'Descubre lo que estaba oculto y el impacto económico.',evidence:true},
  {id:'debrief',label:'Cierre',student:'Nombra el concepto con palabras simples y lo conecta con el término técnico.',evidence:true}
]

export const V2_CHALLENGES=[
  {
    id:'prediction-vs-effect',
    order:1,
    enabled:true,
    template:'cohort-selection',
    labKey:'prediction',
    kicker:'RETO 1 · PREDECIR NO ES CAMBIAR',
    title:'¿A quién le ofrecerías el bono?',
    simpleQuestion:'¿A quién le darías el bono si quieres lograr renovaciones adicionales?',
    scenario:'Una plataforma de suscripción puede ofrecer un bono de renovación a una parte de sus clientes. Ya existe un modelo que predice quién probablemente renovará.',
    decisionUnit:'cohort',
    initialDecision:'Elige entre 1 y 3 cohortes de tu muestra.',
    revisedDecision:'Después del laboratorio, vuelve a elegir entre 1 y 3 cohortes. Puedes cambiar o mantener tu decisión.',
    teamDecision:'El equipo debe seleccionar exactamente 10 cohortes.',
    plainConcept:'Predecir quién renovará no es lo mismo que saber quién renovará gracias al bono.',
    technicalTerm:'Predicción vs. efecto causal',
    advancedTerms:['contrafactual','uplift','Y(1)-Y(0)'],
    wow:'Una cohorte con alta probabilidad de renovar puede generar poco valor porque habría renovado de todas formas.',
    takeaway:'La decisión correcta necesita comparar dos futuros: con bono y sin bono.',
    timeMinutes:18,
    journey:STANDARD_JOURNEY
  },
  {
    id:'fair-comparison',
    order:2,
    enabled:true,
    template:'recommendation',
    labKey:'comparison',
    kicker:'RETO 2 · UNA COMPARACIÓN PUEDE ENGAÑAR',
    title:'¿El bono está funcionando?',
    simpleQuestion:'Si quienes recibieron el bono renovaron menos, ¿significa que el bono empeoró las renovaciones?',
    scenario:'Históricamente el bono se ofrecía más a clientes con alto riesgo de cancelar. Los datos muestran menor renovación entre quienes recibieron el bono.',
    decisionUnit:'recommendation',
    initialDecision:'Recomienda cancelar, mantener o pedir una comparación mejor.',
    revisedDecision:'Después de mirar grupos comparables, revisa tu recomendación.',
    teamDecision:'El equipo debe acordar una sola recomendación.',
    plainConcept:'Antes de comparar resultados, pregunta si los grupos ya eran diferentes desde antes.',
    technicalTerm:'Confusión y comparabilidad',
    advancedTerms:['propensity score','IPW','overlap','backdoor'],
    wow:'La comparación cruda puede ser negativa aunque el bono tenga un efecto positivo.',
    takeaway:'Una diferencia observada no siempre es un efecto. Primero hay que construir una comparación justa.',
    timeMinutes:18,
    journey:STANDARD_JOURNEY
  },
  {
    id:'experiment-to-policy',
    order:3,
    enabled:true,
    template:'segment-policy',
    labKey:'experiment',
    kicker:'RETO 3 · FUNCIONA, PERO NO PARA TODOS',
    title:'¿Dónde pondrías el presupuesto?',
    simpleQuestion:'Si el bono funciona en promedio, ¿deberíamos ofrecerlo a todos?',
    scenario:'Ahora existe un experimento aleatorizado. El bono mejora la renovación en promedio, pero el efecto cambia entre segmentos y sólo hay capacidad para 15.000 clientes.',
    decisionUnit:'policy',
    initialDecision:'Para tus segmentos, propón tratar, evitar o pedir más evidencia.',
    revisedDecision:'Después de comparar el efecto por grupos y convertirlo a dinero, revisa tu política.',
    teamDecision:'El equipo construye una política para los cinco segmentos sin superar la capacidad.',
    plainConcept:'Un efecto promedio positivo no significa que la intervención ayude a todas las personas por igual.',
    technicalTerm:'Efecto promedio y heterogeneidad',
    advancedTerms:['ATE','CATE','T-Learner','intervalo de confianza'],
    wow:'Una campaña positiva en promedio puede destruir valor en algunos segmentos.',
    takeaway:'Primero pregunta si funciona; después, para quién y a qué costo.',
    timeMinutes:19,
    journey:STANDARD_JOURNEY
  }
]

export const enabledChallenges=()=>V2_CHALLENGES.filter(x=>x.enabled).sort((a,b)=>a.order-b.order)
export const getChallengeByRound=round=>enabledChallenges()[Number(round)-1]||null
export const getChallengeById=id=>V2_CHALLENGES.find(x=>x.id===id)||null
export const V2_CHALLENGE_COUNT=enabledChallenges().length

export function validateChallengeRegistry(challenges=V2_CHALLENGES){
  const errors=[]
  const ids=new Set()
  for(const c of challenges){
    if(!c.id)errors.push('Cada reto necesita id.')
    if(ids.has(c.id))errors.push(`ID duplicado: ${c.id}`)
    ids.add(c.id)
    for(const key of ['title','scenario','simpleQuestion','plainConcept','technicalTerm','template','labKey']){
      if(!c[key])errors.push(`${c.id||'reto'}: falta ${key}`)
    }
    if(!Array.isArray(c.journey)||c.journey.length<6)errors.push(`${c.id||'reto'}: journey incompleto`)
  }
  return errors
}

export const CHALLENGE_TEMPLATE={
  id:'nuevo-reto',
  order:4,
  enabled:false,
  template:'recommendation',
  labKey:'comparison',
  kicker:'RETO 4 · ...',
  title:'Pregunta sencilla del reto',
  simpleQuestion:'La pregunta que el estudiante debe poder responder al final.',
  scenario:'Contexto de 2 o 3 frases. Una sola decisión.',
  decisionUnit:'recommendation',
  initialDecision:'Qué decide antes de ver nueva evidencia.',
  revisedDecision:'Qué vuelve a decidir después del laboratorio.',
  teamDecision:'Qué bloquea el equipo.',
  plainConcept:'La idea en lenguaje cotidiano.',
  technicalTerm:'El nombre técnico que se presenta después.',
  advancedTerms:['término opcional 1'],
  wow:'La intuición que se rompe.',
  takeaway:'Una frase que debería poder repetir el estudiante.',
  timeMinutes:15,
  journey:STANDARD_JOURNEY
}
