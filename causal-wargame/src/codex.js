export const COMMON_POWER={name:'Pregunta Crítica',why:'¿Qué tendría que ser cierto para que esta evidencia justifique la decisión?'}

export const ROLE_ARCHETYPES={
  business:{label:'Líder de Decisión',family:'Decisión',type:'DECISIÓN',emoji:'🦁',accent:'#f6c453',tagline:'Convierte evidencia en una decisión clara.',tool:'Mapa de Decisión',mission:'Mantén al equipo enfocado en población, intervención, resultado y horizonte.',marketAuthority:true,powers:[{name:'Mapa de Decisión',unlockRound:1,why:'Ordena la pregunta antes de analizar.'},{name:'Administración de Recursos',unlockRound:1,why:'Gestiona la bolsa común y confirma compras del equipo.'}]},
  data:{label:'Líder de Modelos',family:'Modelos',type:'SEÑAL',emoji:'🦉',accent:'#43b7ff',tagline:'Separa predicción de oportunidad de intervención.',tool:'Explorador de Modelos',mission:'En R1 interpreta el puntaje predictivo y dice qué NO demuestra. Las herramientas causales del rol aparecen sólo después de ser enseñadas.',powers:[{name:'Radar de Propensión',unlockRound:2,why:'Analiza la probabilidad de recibir el tratamiento dadas características previas; ayuda a diagnosticar comparabilidad.'},{name:'Lente de Impacto Incremental',unlockRound:4,why:'Compara probabilidad base con cuánto cambia el resultado por la intervención.'}]},
  context:{label:'Analista Causal',family:'Causalidad',type:'CAUSAL',emoji:'🐈‍⬛',accent:'#b56cff',tagline:'Busca qué hace válida o engañosa una comparación.',tool:'Laboratorio de Grafo Causal',mission:'En R1 formula el contrafactual. Desde R2, después de aprender grafo causal y confusión, representa la estructura causal.',powers:[{name:'Visión de Grafo Causal',unlockRound:2,why:'Representa relaciones causales después de aprender qué es un DAG.'},{name:'Escáner de Confusión',unlockRound:2,why:'Busca variables previas que afectan tratamiento y resultado.'}]},
  integrator:{label:'Líder de Experimentos',family:'Experimentación',type:'EVIDENCIA',emoji:'🐢',accent:'#44dfa8',tagline:'Diseña comparaciones que soporten una conclusión.',tool:'Laboratorio de Experimentos',mission:'Antes de R3 revisa qué comparación sería justa. Aleatorización y efecto promedio aparecen sólo después de enseñarlos.',powers:[{name:'Escudo de Aleatorización',unlockRound:3,why:'Usa asignación aleatoria cuando el diseño lo permite.'},{name:'Medidor de Efecto Promedio',unlockRound:3,why:'Interpreta magnitud e incertidumbre del efecto promedio.'}]},
  risk:{label:'Política y Riesgo',family:'Política',type:'POLÍTICA',emoji:'🦅',accent:'#ff6f75',tagline:'Evita convertir un efecto en una mala política.',tool:'Simulador de Política',mission:'Desde R1 revisa costo, capacidad y daño. La herramienta de valor aparece cuando ya se enseñó heterogeneidad.',powers:[{name:'Escudo de Riesgo',unlockRound:1,why:'Frena decisiones con daño o desperdicio evidente.'},{name:'Forja de Valor',unlockRound:4,why:'Convierte efecto, volumen y costo en valor de política.'}]}
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
