const STANDARD_JOURNEY=[
  {id:'brief',label:'Contexto',student:'Entiende una situación cotidiana y una sola pregunta.',evidence:false},
  {id:'initial',label:'Tu decisión',student:'Responde con su intuición antes de abrir datos nuevos.',evidence:false},
  {id:'wait_initial',label:'Equipo',student:'Espera a que todos hayan tomado una primera decisión.',evidence:false},
  {id:'lab',label:'Laboratorio',student:'Ve todo el laboratorio en una sola página y ejecuta el código guiado.',evidence:true},
  {id:'check',label:'Pregunta',student:'Responde una pregunta corta de comprensión y recibe puntaje.',evidence:true},
  {id:'revision',label:'Revisión',student:'Vuelve a decidir después de observar los datos.',evidence:true},
  {id:'wait_revision',label:'Equipo',student:'Espera las revisiones de sus compañeros.',evidence:true},
  {id:'team',label:'Decisión final',student:'El equipo toma una decisión común.',evidence:true},
  {id:'reveal',label:'Resultado',student:'Ve el resultado, el puntaje del equipo y lo que estaba oculto.',evidence:true},
  {id:'debrief',label:'Qué aprendí',student:'Primero explica la idea en palabras simples y luego conoce su nombre técnico.',evidence:true}
]

export const V2_CHALLENGES=[
  {
    id:'prediction-vs-effect',
    order:1,
    enabled:true,
    template:'cohort-selection',
    profileRound:1,
    labKey:'prediction',
    kicker:'RETO 1',
    title:'¿A quién le darías un mes gratis?',
    simpleQuestion:'Una app no puede regalar un mes a todos. ¿A qué grupos se lo darías para lograr más renovaciones?',
    scenario:'Una app cobra una suscripción mensual. Algunos usuarios pueden recibir el próximo mes gratis para que no se vayan. Un modelo ya estima quién probablemente renovará.',
    decisionUnit:'cohort',
    initialDecision:'Elige entre 1 y 3 grupos usando sólo lo que ves.',
    revisedDecision:'Después del laboratorio, vuelve a elegir. Puedes mantener o cambiar tu decisión.',
    teamDecision:'Entre todos, elijan 10 grupos.',
    plainConcept:'Saber quién probablemente renovará no dice quién renovará gracias al mes gratis.',
    technicalTerm:'Predicción vs. efecto causal',
    advancedTerms:['contrafactual','uplift'],
    wow:'Un grupo con alta probabilidad de renovar puede generar poco cambio porque quizá renovaría de todas formas.',
    takeaway:'Para decidir una intervención importa el cambio que produce, no sólo el resultado que predice.',
    checkQuestion:'Si un grupo tiene 90% de probabilidad de renovar, ¿qué puedes concluir?',
    checkOptions:[
      ['a','Que el mes gratis tendrá un efecto grande.'],
      ['b','Que probablemente renovará; todavía no sé cuánto cambia por el mes gratis.'],
      ['c','Que no debería recibir ningún incentivo.']
    ],
    timeMinutes:16,
    journey:STANDARD_JOURNEY
  },
  {
    id:'fair-comparison',
    order:2,
    enabled:true,
    template:'recommendation',
    profileRound:2,
    labKey:'comparison',
    kicker:'RETO 2',
    title:'¿El mes gratis está funcionando?',
    simpleQuestion:'En el histórico, quienes recibieron el mes gratis renovaron menos. ¿Eso prueba que el incentivo empeoró las renovaciones?',
    scenario:'La empresa solía regalar el mes sobre todo a usuarios que parecían estar a punto de irse. Al mirar el histórico, el grupo con incentivo renovó menos.',
    decisionUnit:'recommendation',
    initialDecision:'Decide si cancelarías el incentivo, lo mantendrías o pedirías una comparación mejor.',
    revisedDecision:'Después de comparar usuarios parecidos, revisa tu decisión.',
    teamDecision:'El equipo debe acordar una sola recomendación.',
    plainConcept:'Antes de comparar resultados, revisa si los grupos ya eran diferentes desde antes.',
    technicalTerm:'Confusión y comparabilidad',
    advancedTerms:['propensity score','IPW','overlap'],
    wow:'Una comparación simple puede verse negativa aunque el incentivo realmente ayude.',
    takeaway:'Una diferencia entre dos grupos no siempre es causada por el incentivo.',
    checkQuestion:'Antes de decir que el incentivo causó la diferencia, ¿qué es lo más importante revisar?',
    checkOptions:[
      ['a','Si los grupos eran comparables antes de recibir el incentivo.'],
      ['b','Cuál grupo tiene más filas en la base.'],
      ['c','Si el promedio general es mayor a 50%.']
    ],
    timeMinutes:16,
    journey:STANDARD_JOURNEY
  },
  {
    id:'experiment-to-policy',
    order:3,
    enabled:true,
    template:'segment-policy',
    profileRound:3,
    labKey:'experiment',
    kicker:'RETO 3',
    title:'¿A quién se lo darías ahora?',
    simpleQuestion:'En una prueba aleatoria el mes gratis ayudó en promedio. ¿Eso significa que debemos ofrecérselo a todos los grupos?',
    scenario:'Esta vez el incentivo se asignó al azar. En promedio ayudó, pero la empresa sólo puede cubrir a 15.000 usuarios y algunos grupos responden distinto.',
    decisionUnit:'policy',
    initialDecision:'Para cada grupo, elige ofrecer, no ofrecer o pedir más evidencia.',
    revisedDecision:'Después de comparar el cambio por grupo y el costo, revisa tu política.',
    teamDecision:'Construyan una política para los cinco grupos sin superar 15.000 usuarios.',
    plainConcept:'Que algo funcione en promedio no significa que funcione igual para todos.',
    technicalTerm:'Efecto promedio y heterogeneidad',
    advancedTerms:['ATE','CATE','T-Learner'],
    wow:'Una intervención positiva en promedio puede perder dinero en algunos grupos.',
    takeaway:'Primero pregunta si funciona; después, para quién y a qué costo.',
    checkQuestion:'El incentivo mejora la renovación 6 puntos en promedio. ¿Qué conclusión es correcta?',
    checkOptions:[
      ['a','Que mejora exactamente 6 puntos en todos los grupos.'],
      ['b','Que hay una mejora promedio; todavía falta mirar grupos y costos.'],
      ['c','Que debemos ofrecérselo a todos.']
    ],
    timeMinutes:18,
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
    for(const key of ['title','scenario','simpleQuestion','plainConcept','technicalTerm','template','profileRound','labKey','checkQuestion']){
      if(!c[key])errors.push(`${c.id||'reto'}: falta ${key}`)
    }
    if(![1,2,3].includes(Number(c.profileRound)))errors.push(`${c.id||'reto'}: profileRound debe ser 1, 2 o 3`)
    if(!Array.isArray(c.checkOptions)||c.checkOptions.length<2)errors.push(`${c.id||'reto'}: faltan opciones de la pregunta de cierre`)
    if(!Array.isArray(c.journey)||c.journey.length<8)errors.push(`${c.id||'reto'}: journey incompleto`)
  }
  return errors
}

export const CHALLENGE_TEMPLATE={
  id:'nuevo-reto',
  order:4,
  enabled:false,
  template:'recommendation',
  profileRound:2,
  labKey:'comparison',
  kicker:'RETO 4',
  title:'Pregunta corta del reto',
  simpleQuestion:'La pregunta que el estudiante debe poder responder.',
  scenario:'Contexto de dos frases, con una sola decisión.',
  decisionUnit:'recommendation',
  initialDecision:'Qué decide antes de ver nueva evidencia.',
  revisedDecision:'Qué vuelve a decidir después del laboratorio.',
  teamDecision:'Qué bloquea el equipo.',
  plainConcept:'La idea en lenguaje cotidiano.',
  technicalTerm:'El nombre técnico que se presenta después.',
  advancedTerms:['término opcional'],
  wow:'La intuición que se rompe.',
  takeaway:'Una frase que debería poder repetir el estudiante.',
  checkQuestion:'Pregunta de comprensión que sí otorga puntaje.',
  checkOptions:[['a','Opción A'],['b','Opción B'],['c','Opción C']],
  timeMinutes:15,
  journey:STANDARD_JOURNEY
}
