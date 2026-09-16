import ECONML_PRECOMPUTED from'./data/econml-precomputed.json'

export const ESTIMATORS={
  tlearner:{label:'T-Learner',short:'Dos modelos de resultado: uno por tratamiento.'},
  drlearner:{label:'DR-Learner',short:'Combina modelos de resultado y propensión para una señal doblemente robusta.'},
  forest:{label:'CausalForestDML',short:'Bosque causal para explorar heterogeneidad del efecto condicional.'}
}

export const UPLIFT_CLIENTS=ECONML_PRECOMPUTED.clients
export const ECONML_PROVENANCE=ECONML_PRECOMPUTED.provenance

export const DAG_SCENARIOS={
2:{title:'Confusión antes del tratamiento',nodes:['Mora previa','Llamada','Pago'],expected:[['Mora previa','Llamada'],['Mora previa','Pago'],['Llamada','Pago']],danger:'backdoor',adjust:'Mora previa',prompt:'Construye una hipótesis causal que explique por qué los llamados pueden pagar menos aun si la llamada ayuda.'},
3:{title:'Mediador posterior al tratamiento',nodes:['Llamada','Satisfacción','Pago'],expected:[['Llamada','Satisfacción'],['Satisfacción','Pago'],['Llamada','Pago']],danger:'mediator',adjust:'Satisfacción',prompt:'Representa una vía por la que la llamada puede cambiar el pago a través de satisfacción.'},
4:{title:'Collider: ajustar por todo puede abrir sesgo',nodes:['Llamada','Uso app','Motivación','Pago'],expected:[['Llamada','Uso app'],['Motivación','Uso app'],['Motivación','Pago'],['Llamada','Pago']],danger:'collider',adjust:'Uso app',prompt:'Explora qué ocurre si condicionas una variable causada por dos factores distintos.'}
}

export const DECISION_OPTIONS={
  population:['Clientes elegibles','Clientes con mora 1–30 días','Sólo clientes tratados históricamente'],
  treatment:['Llamada personalizada','Mensaje digital','Sin intervención'],
  comparator:['No llamada','Otra intervención','Sin comparador'],
  outcome:['Pago completo','Pago parcial','Clic inmediato'],
  horizon:['1 día','30 días','90 días'],
  estimand:['ATE','ATT','CATE','Valor de política'],
  constraint:['Capacidad máxima','Presupuesto máximo','Riesgo de daño','Sin restricción explícita']
}

export const EXPERIMENT_BASE={treatmentRate:31.2,controlRate:25.4,eligible:20000}

export const TOOL_GUIDE={
 business:{question:'¿Qué pregunta causal exacta debe responder el equipo?',assumption:'Población, intervención, comparador, resultado, horizonte, estimando y restricción deben referirse al mismo problema.',decision:'Entrega el contrato causal y, al final, verifica que la recomendación de Política y Riesgo responda ese contrato.'},
 data:{question:'¿Quién probablemente tendrá Y y quién cambia por T?',assumption:'Un estimador de CATE sólo es causal bajo una estrategia de identificación defendible.',decision:'Entrega perfiles con mayor cambio incremental, no sólo mayor score; si falta Experimentos, cubre también diseño e incertidumbre.'},
 context:{question:'¿Qué estructura causal hace válida o sesgada la comparación?',assumption:'Temporalidad y estructura importan; ajustar por todo puede introducir sesgo.',decision:'Entrega un conjunto de ajuste defendible y una advertencia sobre variables que no deben controlarse.'},
 integrator:{question:'¿Qué diseño permite identificar y medir el efecto con precisión útil?',assumption:'La asignación y el análisis deben definirse antes de mirar el resultado.',decision:'Entrega diseño, efecto estimado e incertidumbre.'},
 risk:{question:'¿Dónde conviene intervenir una vez considerado efecto, incertidumbre, costo, capacidad y riesgo?',assumption:'La política sólo es defendible si la estimación causal previa también lo es y respeta las restricciones acordadas.',decision:'Entrega una política segmentada factible: intervenir, no intervenir o pedir más evidencia.'}
}
