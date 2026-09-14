export const ROLE_ARCHETYPES={
  business:{label:'Líder de Decisión',family:'Decisión',type:'DECISIÓN',emoji:'🦁',accent:'#f6c453',portrait:'./roles/decision-lead.webp',tagline:'Convierte evidencia en una decisión clara.',tool:'Canvas de Decisión',marketAuthority:true,baseContribution:'Siempre puede ordenar el problema: población, intervención, resultado, horizonte y restricción. Resume la evidencia y confirma la decisión del equipo.',powers:[
    {id:'decision_canvas',name:'Canvas de Decisión',unlockRound:1,description:'Define qué queremos cambiar, en quién, con qué intervención y en cuánto tiempo.'},
    {id:'resource_admin',name:'Administración de Recursos',unlockRound:1,description:'Es la única persona que confirma compras del mercado; el equipo completo recomienda qué vale la pena comprar.'}
  ]},
  data:{label:'Líder de Modelos',family:'Modelos',type:'SEÑAL',emoji:'🦉',accent:'#43b7ff',portrait:'./roles/lider-modelos.webp',tagline:'Separa lo que el modelo predice de lo que una intervención cambia.',tool:'Explorador de Modelos',baseContribution:'Desde la ronda 1 puede leer scores, ordenar perfiles y decir qué está prediciendo el modelo. No necesita causalidad avanzada para advertir qué sí y qué no demuestra un score.',powers:[
    {id:'propensity_radar',name:'Radar de Propensión',unlockRound:2,description:'Después de aprender confusión, analiza qué tan probable era recibir el tratamiento dadas variables previas.'},
    {id:'uplift_lens',name:'Lente de Uplift',unlockRound:4,description:'Después de aprender heterogeneidad, compara probabilidad base con cambio incremental por intervención.'}
  ]},
  context:{label:'Analista Causal',family:'Causalidad',type:'CAUSAL',emoji:'🐈‍⬛',accent:'#b56cff',portrait:'./roles/analista-causal.webp',tagline:'Pregunta qué comparación permitiría hablar de causa.',tool:'Laboratorio Causal',baseContribution:'En la ronda 1 no dibuja DAGs: formula la pregunta contrafactual y pregunta qué necesitaríamos observar para comparar el futuro con intervención frente al futuro sin ella.',powers:[
    {id:'dag_vision',name:'Visión DAG',unlockRound:2,description:'Se desbloquea cuando el facilitador explica grafos causales; ordena relaciones entre variables previas, tratamiento y resultado.'},
    {id:'confounder_scan',name:'Escáner de Confusión',unlockRound:2,description:'Busca variables previas que influyen tanto en recibir el tratamiento como en el resultado.'}
  ]},
  integrator:{label:'Líder de Experimentos',family:'Experimentación',type:'EVIDENCIA',emoji:'🐢',accent:'#44dfa8',portrait:'./roles/lider-experimentos.webp',tagline:'Pregunta qué comparación hace creíble la evidencia.',tool:'Laboratorio de Experimentos',baseContribution:'Antes de aprender RCT revisa si tratamiento, comparación, resultado y horizonte están definidos de forma consistente. Su aporte base es la calidad de la comparación.',powers:[
    {id:'rct_shield',name:'Escudo RCT',unlockRound:3,description:'Se desbloquea al explicar randomización; evalúa si la asignación permite una comparación creíble.'},
    {id:'ate_meter',name:'Medidor ATE',unlockRound:3,description:'Calcula e interpreta la diferencia promedio entre tratamiento y control junto con su incertidumbre.'}
  ]},
  risk:{label:'Política y Riesgo',family:'Política',type:'POLÍTICA',emoji:'🦅',accent:'#ff6f75',portrait:'./roles/politica-riesgo.webp',tagline:'Evita que una buena métrica termine en una mala política.',tool:'Simulador de Política',baseContribution:'Desde el inicio puede preguntar por costo, capacidad, posibles daños y consecuencias de una mala decisión.',powers:[
    {id:'risk_shield',name:'Escudo de Riesgo',unlockRound:1,description:'Identifica restricciones, daño potencial y decisiones irreversibles antes de actuar.'},
    {id:'roi_forge',name:'Forja ROI',unlockRound:4,description:'Después de aprender heterogeneidad, combina efecto incremental, volumen, valor, costo y capacidad.'}
  ]}
}

const PHASE_ORDER={lobby:0,briefing:0,lesson:1,round:2,paused:2,closed:3,reveal:4,teaching:5,microcheck:6,finished:7}
export function isPowerUnlocked(power,round,phase='round'){
  const r=Number(round)||1
  if(r>power.unlockRound)return true
  if(r<power.unlockRound)return false
  return (PHASE_ORDER[phase]??0)>=1
}
export function powersForRole(role,round,phase='round'){
  const meta=ROLE_ARCHETYPES[role];if(!meta)return[]
  return meta.powers.map(p=>({...p,unlocked:isPowerUnlocked(p,round,phase),unlocking:Number(round)===p.unlockRound&&phase==='lesson'}))
}
export function roleProgress(role,round,phase='round'){
  const powers=powersForRole(role,round,phase)
  return{unlocked:powers.filter(p=>p.unlocked).length,total:powers.length}
}
