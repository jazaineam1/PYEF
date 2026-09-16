export const COMMON_POWER={name:'Pregunta Crítica',why:'¿Qué tendría que ser cierto para que esta evidencia justifique la decisión?'}

export const ROLE_ARCHETYPES={
  business:{core:true,label:'Líder de Decisión',family:'Decisión',type:'DECISIÓN',emoji:'🦁',accent:'#f6c453',tagline:'Define la pregunta que todo el equipo debe responder.',tool:'Constructor de Pregunta Causal',mission:'Define población, intervención, comparador, resultado, horizonte, estimando y restricción. Integra las demás evidencias antes de cerrar la decisión.',marketAuthority:true,powers:[{name:'Mapa de Decisión',unlockRound:1,why:'Ordena la pregunta antes de analizar.'},{name:'Administración de Recursos',unlockRound:1,why:'Gestiona la bolsa común y confirma compras del equipo.'}]},
  data:{core:true,label:'Líder de Modelos',family:'Modelos',type:'SEÑAL',emoji:'🦉',accent:'#43b7ff',tagline:'Separa predicción de oportunidad de intervención.',tool:'Explorador de Uplift y CATE',mission:'Interpreta predicción y efecto incremental. Si falta Experimentos en un equipo incompleto, puede cubrir temporalmente esa responsabilidad mediante doble sombrero.',powers:[{name:'Radar de Propensión',unlockRound:2,why:'Analiza la probabilidad de recibir tratamiento dadas características previas.'},{name:'Lente de Impacto Incremental',unlockRound:4,why:'Compara probabilidad base con cuánto cambia el resultado por la intervención.'}]},
  context:{core:true,label:'Analista Causal',family:'Causalidad',type:'CAUSAL',emoji:'🐈‍⬛',accent:'#b56cff',tagline:'Busca qué hace válida o engañosa una comparación.',tool:'Laboratorio de Grafo Causal',mission:'Formula el contrafactual y, desde R2, representa la estructura causal para decidir qué ajustar y qué no.',powers:[{name:'Visión de Grafo Causal',unlockRound:2,why:'Representa relaciones causales después de aprender qué es un DAG.'},{name:'Escáner de Confusión',unlockRound:2,why:'Busca variables previas que afectan tratamiento y resultado.'}]},
  integrator:{core:true,label:'Líder de Experimentos',family:'Experimentación',type:'EVIDENCIA',emoji:'🐢',accent:'#44dfa8',tagline:'Diseña comparaciones que soporten una conclusión.',tool:'Diseñador de Experimentos',mission:'Define asignación, outcome, horizonte e incertidumbre. En equipos incompletos, esta responsabilidad puede ser cubierta por Modelos sin desaparecer del tablero.',powers:[{name:'Escudo de Aleatorización',unlockRound:3,why:'Usa asignación aleatoria cuando el diseño lo permite.'},{name:'Medidor de Efecto Promedio',unlockRound:3,why:'Interpreta magnitud e incertidumbre del efecto promedio.'}]},
  risk:{core:true,label:'Política y Riesgo',family:'Política',type:'POLÍTICA',emoji:'🦅',accent:'#ff6f75',tagline:'Convierte efecto en una política factible y segura.',tool:'Simulador de Política',mission:'Combina efecto, incertidumbre, valor, costo, capacidad y riesgo para proponer dónde intervenir, dónde no y dónde pedir más evidencia.',powers:[{name:'Escudo de Riesgo',unlockRound:1,why:'Frena decisiones con daño, desperdicio o irreversibilidad innecesaria.'},{name:'Forja de Valor',unlockRound:4,why:'Convierte efecto, volumen, costo y capacidad en una política defendible.'}]}
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
