export const ROLE_ARCHETYPES={
  business:{label:'Líder de Decisión',family:'Decisión',type:'DECISIÓN',emoji:'🦁',accent:'#f6c453',tagline:'Convierte evidencia en una decisión clara.',tool:'Canvas de Decisión',mission:'Mantén al equipo enfocado en población, intervención, resultado y horizonte.',marketAuthority:true,powers:[{name:'Canvas de Decisión',unlockRound:1,why:'Ordena la pregunta antes de analizar.'},{name:'Administración de Recursos',unlockRound:1,why:'Gestiona la bolsa común y confirma compras del equipo.'}]},
  data:{label:'Líder de Modelos',family:'Modelos',type:'SEÑAL',emoji:'🦉',accent:'#43b7ff',tagline:'Separa predicción de oportunidad de intervención.',tool:'Explorador de Modelos',mission:'Di siempre qué afirma el modelo y qué NO permite concluir.',powers:[{name:'Radar de Propensión',unlockRound:1,why:'Lee quién probablemente tendrá el resultado.'},{name:'Lente de Uplift',unlockRound:4,why:'Compara probabilidad base con cambio incremental.'}]},
  context:{label:'Analista Causal',family:'Causalidad',type:'CAUSAL',emoji:'🐈‍⬛',accent:'#b56cff',tagline:'Busca qué hace válida o engañosa una comparación.',tool:'Laboratorio DAG',mission:'Antes de usar un método, pregunta qué tendría que ser comparable para hablar de causa.',powers:[{name:'Visión DAG',unlockRound:2,why:'Representa relaciones causales después de aprender DAG.'},{name:'Escáner de Confusión',unlockRound:2,why:'Busca variables previas que afectan tratamiento y resultado.'}]},
  integrator:{label:'Líder de Experimentos',family:'Experimentación',type:'EVIDENCIA',emoji:'🐢',accent:'#44dfa8',tagline:'Diseña comparaciones que soporten una conclusión.',tool:'Laboratorio de Experimentos',mission:'Pregunta qué comparación permitiría atribuir un cambio a la intervención.',powers:[{name:'Escudo RCT',unlockRound:3,why:'Usa asignación aleatoria cuando el diseño lo permite.'},{name:'Medidor ATE',unlockRound:3,why:'Interpreta magnitud e incertidumbre del efecto promedio.'}]},
  risk:{label:'Política y Riesgo',family:'Política',type:'POLÍTICA',emoji:'🦅',accent:'#ff6f75',tagline:'Evita convertir un efecto en una mala política.',tool:'Simulador de Política',mission:'Pregunta siempre por costo, capacidad, daño y quién puede salir perjudicado.',powers:[{name:'Escudo de Riesgo',unlockRound:1,why:'Frena decisiones con daño o desperdicio evidente.'},{name:'Forja ROI',unlockRound:4,why:'Convierte efecto, volumen y costo en valor de política.'}]}
}

export function powersForRole(role,round,phase='round'){
  const meta=ROLE_ARCHETYPES[role];if(!meta)return[]
  const r=Number(round)||1
  return meta.powers.map(p=>{const taught=r>p.unlockRound||(r===p.unlockRound&&phase!=='lesson'&&phase!=='briefing'&&phase!=='lobby');return{...p,unlocked:r>p.unlockRound||taught,unlocking:r===p.unlockRound&&!taught}})
}

export function roleProgress(role,round){
  const meta=ROLE_ARCHETYPES[role];if(!meta)return{unlocked:0,total:0}
  const r=Number(round)||1
  return{unlocked:meta.powers.filter(p=>p.unlockRound<=r).length,total:meta.powers.length}
}
