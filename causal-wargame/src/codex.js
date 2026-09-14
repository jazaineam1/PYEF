export const COMMON_POWER={name:'Pregunta Crítica',why:'¿Qué tendría que ser cierto para que esta evidencia justifique la decisión?'}

export const ROLE_ARCHETYPES={
  business:{core:true,label:'Estrategia y Política',family:'Decisión y política',type:'ESTRATEGIA',emoji:'🦁',accent:'#f6c453',tagline:'Abre la pregunta y cierra la política.',tool:'Decision & Policy Studio',mission:'Define población, intervención, comparador, resultado, horizonte y restricción; al final convierte la evidencia en una política factible.',marketAuthority:true,powers:[{name:'Mapa de Decisión',unlockRound:1,why:'Ordena la pregunta antes de analizar.'},{name:'Administración de Recursos',unlockRound:1,why:'Gestiona la bolsa común y confirma compras del equipo.'},{name:'Escudo de Riesgo',unlockRound:1,why:'Frena decisiones con daño o desperdicio evidente.'},{name:'Forja de Valor',unlockRound:4,why:'Convierte efecto, volumen, costo y capacidad en política.'}]},
  data:{core:true,label:'Líder de Modelos',family:'Modelos',type:'SEÑAL',emoji:'🦉',accent:'#43b7ff',tagline:'Separa predicción de oportunidad de intervención.',tool:'Explorador de Modelos',mission:'Interpreta predicción y efecto incremental. Si el equipo queda en tres personas, asume además el sombrero de Experimentos cuando esa responsabilidad no tenga dueño.',powers:[{name:'Radar de Propensión',unlockRound:2,why:'Analiza la probabilidad de recibir el tratamiento dadas características previas; ayuda a diagnosticar comparabilidad.'},{name:'Lente de Impacto Incremental',unlockRound:4,why:'Compara probabilidad base con cuánto cambia el resultado por la intervención.'}]},
  context:{core:true,label:'Analista Causal',family:'Causalidad',type:'CAUSAL',emoji:'🐈‍⬛',accent:'#b56cff',tagline:'Busca qué hace válida o engañosa una comparación.',tool:'Laboratorio de Grafo Causal',mission:'Formula el contrafactual y, desde R2, representa la estructura causal para decidir qué ajustar y qué no.',powers:[{name:'Visión de Grafo Causal',unlockRound:2,why:'Representa relaciones causales después de aprender qué es un DAG.'},{name:'Escáner de Confusión',unlockRound:2,why:'Busca variables previas que afectan tratamiento y resultado.'}]},
  integrator:{core:true,label:'Líder de Experimentos',family:'Experimentación',type:'EVIDENCIA',emoji:'🐢',accent:'#44dfa8',tagline:'Diseña comparaciones que soporten una conclusión.',tool:'Laboratorio de Experimentos',mission:'Define asignación, outcome, horizonte e incertidumbre. En equipos de tres esta responsabilidad pasa automáticamente a Modelos.',powers:[{name:'Escudo de Aleatorización',unlockRound:3,why:'Usa asignación aleatoria cuando el diseño lo permite.'},{name:'Medidor de Efecto Promedio',unlockRound:3,why:'Interpreta magnitud e incertidumbre del efecto promedio.'}]},
  risk:{core:false,label:'Copiloto de Estrategia',family:'Apoyo',type:'COPILOTO',emoji:'🦅',accent:'#ff6f75',tagline:'Refuerza estrategia y política cuando hay una quinta persona.',tool:'Mesa de apoyo',mission:'No añade una quinta especialidad obligatoria. Ayuda a Estrategia y Política a revisar costo, capacidad, daño, reversibilidad y coherencia antes de bloquear la decisión.',powers:[{name:'Escudo de Riesgo',unlockRound:1,why:'Apoya la revisión de daño y desperdicio.'},{name:'Forja de Valor',unlockRound:4,why:'Ayuda a contrastar valor, capacidad y costo antes de cerrar política.'}]}
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
