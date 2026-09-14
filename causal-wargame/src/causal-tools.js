export const ESTIMATORS={
  tlearner:{label:'T-Learner',short:'Dos modelos de resultado: uno por tratamiento.'},
  drlearner:{label:'DR-Learner',short:'Combina modelos de resultado y propensión para una señal doblemente robusta.'},
  forest:{label:'Forest CATE',short:'Estimador heterogéneo tipo bosque para explorar variación del efecto.'}
}

export const UPLIFT_CLIENTS=[
{id:'C01',name:'Cliente A',segment:'Premium',score:.91,tlearner:.010,drlearner:.006,forest:.004},
{id:'C02',name:'Cliente B',segment:'Digital',score:.66,tlearner:.292,drlearner:.284,forest:.280},
{id:'C03',name:'Cliente C',segment:'Mora alta',score:.72,tlearner:-.042,drlearner:-.018,forest:-.024},
{id:'C04',name:'Cliente D',segment:'Tradicional',score:.84,tlearner:.070,drlearner:.058,forest:.082},
{id:'C05',name:'Cliente E',segment:'Digital',score:.58,tlearner:.162,drlearner:.146,forest:.138},
{id:'C06',name:'Cliente F',segment:'Joven',score:.49,tlearner:.208,drlearner:.224,forest:.214},
{id:'C07',name:'Cliente G',segment:'Premium',score:.77,tlearner:.050,drlearner:.062,forest:.050},
{id:'C08',name:'Cliente H',segment:'Digital',score:.63,tlearner:.202,drlearner:.178,forest:.196},
{id:'C09',name:'Cliente I',segment:'Mora alta',score:.88,tlearner:-.032,drlearner:-.024,forest:-.008},
{id:'C10',name:'Cliente J',segment:'Tradicional',score:.55,tlearner:.110,drlearner:.114,forest:.098},
{id:'C11',name:'Cliente K',segment:'Joven',score:.69,tlearner:.182,drlearner:.182,forest:.164},
{id:'C12',name:'Cliente L',segment:'Premium',score:.81,tlearner:.028,drlearner:.028,forest:.040},
{id:'C13',name:'Cliente M',segment:'Digital',score:.44,tlearner:.240,drlearner:.236,forest:.246},
{id:'C14',name:'Cliente N',segment:'Tradicional',score:.74,tlearner:.092,drlearner:.084,forest:.092},
{id:'C15',name:'Cliente O',segment:'Joven',score:.60,tlearner:.128,drlearner:.152,forest:.128},
{id:'C16',name:'Cliente P',segment:'Premium',score:.93,tlearner:.000,drlearner:-.012,forest:-.006},
{id:'C17',name:'Cliente Q',segment:'Digital',score:.52,tlearner:.222,drlearner:.206,forest:.210},
{id:'C18',name:'Cliente R',segment:'Mora alta',score:.79,tlearner:.048,drlearner:.064,forest:.066},
{id:'C19',name:'Cliente S',segment:'Joven',score:.67,tlearner:.160,drlearner:.172,forest:.172},
{id:'C20',name:'Cliente T',segment:'Tradicional',score:.47,tlearner:.262,drlearner:.238,forest:.238},
{id:'C21',name:'Cliente U',segment:'Premium',score:.86,tlearner:.018,drlearner:.026,forest:.024},
{id:'C22',name:'Cliente V',segment:'Digital',score:.57,tlearner:.130,drlearner:.134,forest:.130},
{id:'C23',name:'Cliente W',segment:'Tradicional',score:.71,tlearner:.102,drlearner:.102,forest:.096},
{id:'C24',name:'Cliente X',segment:'Joven',score:.64,tlearner:.168,drlearner:.168,forest:.192}
]

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
  estimand:['ATE','ATT','CATE','Policy value'],
  constraint:['Capacidad máxima','Presupuesto máximo','Riesgo de daño','Sin restricción explícita']
}

export const EXPERIMENT_BASE={treatmentRate:31.2,controlRate:25.4,eligible:20000}

export const TOOL_GUIDE={
 business:{question:'¿Qué decisión causal está realmente definida?',assumption:'La población, intervención, comparador, outcome y horizonte deben referirse al mismo problema.',decision:'Entrega al equipo una pregunta cerrada, el estimando y la restricción que gobiernan la decisión.'},
 data:{question:'¿Quién probablemente tendrá Y y quién cambia por T?',assumption:'Un estimador de CATE sólo es causal bajo una estrategia de identificación defendible.',decision:'Entrega perfiles con mayor cambio incremental, no sólo mayor score.'},
 context:{question:'¿Qué estructura causal hace válida o sesgada la comparación?',assumption:'Temporalidad y estructura importan; ajustar por todo puede introducir sesgo.',decision:'Entrega un conjunto de ajuste defendible y una advertencia sobre variables que no deben controlarse.'},
 integrator:{question:'¿Qué diseño permite identificar y medir el efecto con precisión útil?',assumption:'La asignación y el análisis deben definirse antes de mirar el resultado.',decision:'Entrega diseño, efecto estimado e incertidumbre.'},
 risk:{question:'¿Dónde conviene actuar dadas capacidad, costo, daño e incertidumbre?',assumption:'Máximo efecto no equivale a mejor política si existen restricciones o daño.',decision:'Entrega una política priorizada, no sólo una tabla de efectos.'}
}
