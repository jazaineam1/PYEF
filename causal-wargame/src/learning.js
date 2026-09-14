import './learning.css'

export const LESSONS={
1:{minutes:10,title:'De predecir a intervenir',objective:'Distinguir probabilidad de resultado de efecto causal.',formula:'E[Y(1) − Y(0)]',methods:['Modelo predictivo P(Y|X)','Resultados potenciales Y(1), Y(0)','Contrafactual'],teacher:[
'Empieza con una pregunta: “Si sé quién va a pagar, ¿ya sé a quién debo llamar?”',
'Muestra dos clientes: uno con 90%→89% y otro con 65%→35%. El primero predice mejor; el segundo cambia más.',
'Introduce Y(1) como el resultado con intervención y Y(0) como el resultado sin intervención.',
'Recalca: en datos reales nunca observamos los dos futuros de la misma persona; el juego puede mostrarlos sólo porque es sintético.'
],demo:'Compara probabilidad y efecto incremental en dos clientes de ejemplo.',check:'¿Una AUC alta demuestra que intervenir con el modelo causa más conversiones? No.'},
2:{minutes:10,title:'Asociación no es comparación causal',objective:'Reconocer confusión y conocer herramientas para ajustar diferencias previas.',formula:'Y = β₀ + β₁T + β₂X + ε',methods:['Grafo causal (DAG)','Regresión ajustada','Puntaje de propensión e(X)=P(T=1|X)','Ponderación por probabilidad inversa (IPW)'],teacher:[
'Parte del dato incómodo: llamados 20%, no llamados 35%. Pregunta si cancelarían.',
'Dibuja Mora previa → Llamada y Mora previa → Pago. La mora existe antes del tratamiento.',
'Explica regresión ajustada como comparar personas similares en X, sin derivar álgebra.',
'Explica puntaje de propensión como probabilidad de recibir tratamiento dadas características previas; emparejamiento e IPW intentan reconstruir comparabilidad.',
'Advierte: no se ajusta automáticamente por todo; una variable posterior al tratamiento puede distorsionar el efecto.'
],demo:'En datos de práctica: crudo −12 pp; ajustado +3,9 pp; IPW +4,2 pp.',check:'¿Qué debe existir antes de la llamada para ser un confusor razonable? Una característica previa que afecte tratamiento y resultado.'},
3:{minutes:10,title:'Diseñar evidencia antes de mirar el resultado',objective:'Entender por qué asignar al azar crea una comparación creíble y cómo leer un efecto promedio.',formula:'ATE = Ȳtratamiento − Ȳcontrol',methods:['Experimento aleatorio (RCT)','Asignación aleatoria','Efecto promedio (ATE)','Intervalo de confianza','Potencia y efecto mínimo detectable (MDE) · conceptual'],teacher:[
'Pregunta quién debe decidir el tratamiento: asesor, modelo o azar.',
'Explica que el azar rompe sistemáticamente el vínculo entre características previas y asignación.',
'Define resultado y horizonte antes de ejecutar. Un clic a 1 día no sustituye pago a 30 días.',
'Calcula una diferencia de medias y un intervalo de confianza sencillo.',
'Menciona potencia y MDE sólo como respuesta a “¿tenemos muestra suficiente para detectar algo relevante?”'
],demo:'Ejemplo de práctica: 28% vs 23% → +5 pp; interpretar magnitud e incertidumbre.',check:'¿Por qué la asignación aleatoria ayuda? Porque, en expectativa, hace comparables los grupos antes del tratamiento.'},
4:{minutes:10,title:'Del efecto promedio a la política',objective:'Pasar del efecto promedio a heterogeneidad, impacto incremental y decisión segmentada.',formula:'CATE(x)=E[Y(1)−Y(0) | X=x]',methods:['Efecto por perfil (CATE)','Impacto incremental (uplift)','Bosques causales · mapa conceptual','Meta-modelos (meta-learners) · mapa de herramientas','Valor de política'],teacher:[
'Muestra que un ATE +6 pp puede esconder +15 pp en un segmento y −5 pp en otro.',
'Distingue nuevamente probabilidad base de impacto incremental: alta probabilidad base no implica gran cambio por tratamiento.',
'Explica que bosques causales y meta-modelos estiman heterogeneidad; no convierten mágicamente datos observacionales en causalidad sin supuestos.',
'Conecta CATE con costo, capacidad y riesgo: la salida final es una política, no sólo un estimador.'
],demo:'Compara dos segmentos: 93→92 (+1 pp) frente a 57→43 (+14 pp).',check:'¿Un efecto promedio positivo justifica tratar a todos? No.'}
}

export const ROLE_TOOLS={
business:{label:'Líder de Decisión',tool:'Canvas de Decisión',purpose:'Traducir el problema de negocio a una pregunta causal bien definida.',color:'var(--gold)'},
data:{label:'Líder de Modelos',tool:'Explorador de Modelos',purpose:'Separar puntaje predictivo, asociación y efecto incremental.',color:'var(--blue)'},
context:{label:'Analista Causal',tool:'Laboratorio de Grafo Causal',purpose:'Representar relaciones causales sólo después de que el concepto fue enseñado.',color:'var(--cyan)'},
integrator:{label:'Líder de Experimentos',tool:'Laboratorio de Experimentos',purpose:'Diseñar una comparación, calcular diferencias e interpretar incertidumbre.',color:'var(--violet)'},
risk:{label:'Política y Riesgo',tool:'Simulador de Política',purpose:'Convertir efectos en valor, capacidad y riesgo para decidir dónde actuar.',color:'var(--green)'}
}

export const ROLE_TASKS={
1:{business:'Define población, intervención, resultado y horizonte antes de escoger clientes.',data:'Interpreta el puntaje predictivo y explica qué sí predice y qué todavía no demuestra.',context:'Formula el contrafactual y pregunta qué tendría que ser comparable; aún no necesitas un DAG.',integrator:'Pregunta contra qué grupo compararías la intervención; aleatorización y ATE se enseñarán después.',risk:'Activa tu Escudo de Riesgo: detecta desperdicio, daño posible o una decisión demasiado agresiva.'},
2:{business:'Decide qué evidencia necesitas antes de cancelar una estrategia.',data:'Ahora sí usa el Radar de Propensión para pensar comparabilidad y revisa el ejemplo ajustado.',context:'Ahora sí usa Visión de Grafo Causal y Escáner de Confusión para encontrar una variable previa problemática.',integrator:'Ayuda a juzgar si la comparación observacional sería defendible; el experimento formal llega en la siguiente ronda.',risk:'Evita una decisión irreversible basada sólo en tasas crudas.'},
3:{business:'Fija resultado e horizonte antes del experimento.',data:'Distingue desempeño predictivo de evidencia experimental.',context:'Comprueba que la asignación no dependa sistemáticamente de una causa previa del resultado.',integrator:'Activa Escudo de Aleatorización y Medidor de Efecto Promedio: diseña la comparación y lee magnitud e incertidumbre.',risk:'Asegura un control comparable y un resultado relevante, no sólo un indicador cómodo.'},
4:{business:'Convierte efectos en una política con capacidad limitada.',data:'Activa Lente de Impacto Incremental y compara probabilidad base con cambio por intervención.',context:'Recuerda que heterogeneidad sólo es causal si el efecto está identificado.',integrator:'Resume efecto promedio, efecto por segmento e incertidumbre para que el equipo no sobrerreaccione.',risk:'Activa Forja de Valor junto con Escudo de Riesgo para combinar efecto, costo, capacidad y posible daño.'}
}

export const TOOL_PRACTICE={
model:{
1:[{name:'Cliente A',propensity:90,p0:89,p1:90},{name:'Cliente B',propensity:65,p0:35,p1:65}],
2:{crude:-12,regression:3.9,ipw:4.2},
4:[{name:'Perfil Premium',propensity:93,uplift:1},{name:'Perfil Medio',propensity:57,uplift:14}]
},
dag:{nodes:['Mora previa','Llamada','Pago'],edges:['Mora previa → Llamada','Mora previa → Pago','Llamada → Pago']},
experiment:{n:2000,treatmentRate:28,controlRate:23},
policy:{audience:10000,effectPP:10,value:120,cost:8}
}
