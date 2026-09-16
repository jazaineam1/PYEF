export const COMMON_POWER={name:'Pregunta Crítica',why:'¿Qué tendría que ser cierto para que esta evidencia justifique la decisión?'}

export const ROLE_ARCHETYPES={
  business:{core:true,label:'Líder de Decisión y Política',family:'Decisión y Política',type:'DECISIÓN',emoji:'🦁',accent:'#f6c453',tagline:'Define la pregunta y convierte la evidencia en una política factible.',tool:'Constructor de Pregunta + Simulador de Política',mission:'Define población, intervención, comparador, resultado, horizonte, estimando y restricción. En R4 integra efecto, incertidumbre, costo, capacidad y riesgo para cerrar la política.',marketAuthority:true,powers:[{name:'Contrato y Recursos',unlockRound:1,why:'Define la pregunta causal y administra la bolsa común del equipo.'},{name:'Forja de Política',unlockRound:4,why:'Convierte evidencia causal y restricciones en una regla de acción defendible.'}]},
  data:{core:true,label:'Líder de Modelos',family:'Modelos',type:'SEÑAL',emoji:'🦉',accent:'#43b7ff',tagline:'Separa predicción de oportunidad de intervención.',tool:'Explorador de Uplift y CATE',mission:'Interpreta predicción y efecto incremental. Si falta Experimentos en un equipo de tres, cubre temporalmente esa responsabilidad mediante un módulo separado.',powers:[{name:'Radar de Propensión',unlockRound:2,why:'Analiza la probabilidad de recibir tratamiento dadas características previas.'},{name:'Lente de Impacto Incremental',unlockRound:4,why:'Compara probabilidad base con cuánto cambia el resultado por la intervención.'}]},
  context:{core:true,label:'Analista Causal',family:'Causalidad',type:'CAUSAL',emoji:'🐈‍⬛',accent:'#b56cff',tagline:'Busca qué hace válida o engañosa una comparación.',tool:'Laboratorio de Grafo Causal',mission:'Formula el contrafactual y, desde R2, representa la estructura causal para decidir qué ajustar y qué no.',powers:[{name:'Visión de Grafo Causal',unlockRound:2,why:'Representa relaciones causales después de aprender qué es un DAG.'},{name:'Escáner de Confusión',unlockRound:2,why:'Busca variables previas que afectan tratamiento y resultado.'}]},
  integrator:{core:true,label:'Líder de Experimentos',family:'Experimentación',type:'EVIDENCIA',emoji:'🐢',accent:'#44dfa8',tagline:'Diseña comparaciones que soporten una conclusión.',tool:'Diseñador de Experimentos',mission:'Define asignación, outcome, horizonte e incertidumbre. En equipos de tres, esta responsabilidad puede ser cubierta por Modelos sin desaparecer del tablero.',powers:[{name:'Escudo de Aleatorización',unlockRound:3,why:'Usa asignación aleatoria cuando el diseño lo permite.'},{name:'Medidor de Efecto Promedio',unlockRound:3,why:'Interpreta magnitud e incertidumbre del efecto promedio.'}]},
  risk:{core:false,legacy:true,label:'Política y Riesgo · legado',family:'Política',type:'LEGADO',emoji:'🦅',accent:'#ff6f75',tagline:'Compatibilidad con sesiones antiguas de cinco roles.',tool:'Simulador de Política',mission:'Rol conservado sólo para no romper sesiones históricas. Las partidas nuevas integran esta responsabilidad dentro de Decisión y Política.',powers:[]}
}

export const CORE_ROLE_CODES=Object.entries(ROLE_ARCHETYPES).filter(([,meta])=>meta.core).map(([code])=>code)
export const isCoreRole=role=>CORE_ROLE_CODES.includes(role)

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
