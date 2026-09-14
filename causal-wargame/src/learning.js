import './learning.css'

export const LESSONS={
1:{minutes:10,title:'De predecir a intervenir',objective:'Distinguir probabilidad de resultado de efecto causal.',formula:'E[Y(1) − Y(0)]',methods:['Modelo predictivo P(Y|X)','Potential outcomes Y(1), Y(0)','Contrafactual'],teacher:[
'Empieza con una pregunta: “Si sé quién va a pagar, ¿ya sé a quién debo llamar?”',
'Muestra dos clientes: uno con 90%→89% y otro con 65%→35%. El primero predice mejor; el segundo cambia más.',
'Introduce Y(1) como el resultado con intervención y Y(0) como el resultado sin intervención.',
'Recalca: en datos reales nunca observamos los dos futuros de la misma persona; el juego puede mostrarlos sólo porque es sintético.'
],demo:'Compara propensión y efecto incremental en dos clientes de ejemplo.',check:'¿Una AUC alta demuestra que intervenir con el modelo causa más conversiones? No.'},
2:{minutes:10,title:'Asociación no es comparación causal',objective:'Reconocer confusión y conocer herramientas para ajustar diferencias previas.',formula:'Y = β₀ + β₁T + β₂X + ε',methods:['DAG / grafo causal','Regresión ajustada','Propensity score e(X)=P(T=1|X)','IPW / ponderación'],teacher:[
'Parte del dato incómodo: llamados 20%, no llamados 35%. Pregunta si cancelarían.',
'Dibuja Mora previa → Llamada y Mora previa → Pago. La mora existe antes del tratamiento.',
'Explica regresión ajustada como comparar personas similares en X, sin derivar álgebra.',
'Explica propensity score como probabilidad de recibir tratamiento dadas características previas; matching/IPW intentan reconstruir comparabilidad.',
'Advierte: no se ajusta automáticamente por todo; una variable posterior al tratamiento puede distorsionar el efecto.'
],demo:'En un dataset de práctica: crudo −12 pp; ajustado +3.9 pp; IPW +4.2 pp.',check:'¿Qué debe existir antes de la llamada para ser un confusor razonable? Una característica previa que afecte tratamiento y outcome.'},
3:{minutes:10,title:'Diseñar evidencia antes de mirar el resultado',objective:'Entender por qué randomizar crea una comparación creíble y cómo leer un ATE.',formula:'ATE = Ȳtratamiento − Ȳcontrol',methods:['A/B test / RCT','Randomización','ATE','Intervalo de confianza','Power y MDE (conceptual)'],teacher:[
'Pregunta quién debe decidir el tratamiento: asesor, modelo o azar.',
'Explica que el azar rompe sistemáticamente el vínculo entre características previas y asignación.',
'Define outcome y horizonte antes de ejecutar. Un clic a 1 día no sustituye pago a 30 días.',
'Calcula una diferencia de medias y un intervalo de confianza sencillo.',
'Menciona power/MDE sólo como respuesta a “¿tenemos muestra suficiente para detectar algo relevante?”'
],demo:'Ejemplo de práctica: 28% vs 23% → +5 pp; interpretar magnitud e incertidumbre.',check:'¿Por qué la randomización ayuda? Porque, en expectativa, hace comparables los grupos antes del tratamiento.'},
4:{minutes:10,title:'Del efecto promedio a la política',objective:'Pasar de ATE a heterogeneidad, uplift y decisión segmentada.',formula:'CATE(x)=E[Y(1)−Y(0) | X=x]',methods:['CATE','Uplift','Causal forests (conceptual)','Meta-learners / EconML (mapa de herramientas)','Policy value'],teacher:[
'Muestra que un ATE +6 pp puede esconder +15 pp en un segmento y −5 pp en otro.',
'Distingue nuevamente propensity de uplift: alta probabilidad base no implica gran cambio por tratamiento.',
'Explica que causal forests/meta-learners estiman heterogeneidad; no convierten mágicamente datos observacionales en causalidad sin supuestos.',
'Conecta CATE con costo, capacidad y riesgo: la salida final es una política, no sólo un estimador.'
],demo:'Compara dos segmentos: 93→92 (+1 pp) frente a 57→43 (+14 pp).',check:'¿Un ATE positivo justifica tratar a todos? No.'}
}

export const ROLE_TOOLS={
business:{label:'Decision Lead',tool:'Decision Canvas',purpose:'Traducir el problema de negocio a una pregunta causal bien definida.',color:'var(--gold)'},
data:{label:'Model Lead',tool:'Model Explorer',purpose:'Separar score predictivo, asociación y efecto incremental.',color:'var(--blue)'},
context:{label:'Causal Analyst',tool:'DAG Lab',purpose:'Representar qué causa tratamiento/outcome y detectar comparaciones peligrosas.',color:'var(--cyan)'},
integrator:{label:'Experiment Lead',tool:'Experiment Lab',purpose:'Diseñar una comparación, calcular diferencias e interpretar incertidumbre.',color:'var(--violet)'},
risk:{label:'Policy & Risk Lead',tool:'Policy Simulator',purpose:'Convertir efectos en valor, capacidad y riesgo para decidir dónde actuar.',color:'var(--green)'}
}

export const ROLE_TASKS={
1:{business:'Define población, intervención, outcome y horizonte antes de escoger clientes.',data:'Usa el ejemplo de práctica para distinguir propensión de impacto.',context:'Pregunta qué necesitarías observar para construir el “otro futuro”.',integrator:'Piensa qué comparación permitiría medir cambio incremental.',risk:'Busca clientes donde intervenir pueda aportar poco o incluso perjudicar.'},
2:{business:'Decide qué evidencia necesitarías antes de cancelar una estrategia.',data:'Compara asociación cruda con métodos ajustados en el ejemplo de práctica.',context:'Usa el DAG para decidir qué variable previa abre una ruta de confusión.',integrator:'Decide qué diseño/estimador sería defendible con datos observacionales.',risk:'Evita una decisión irreversible basada sólo en tasas crudas.'},
3:{business:'Fija outcome e horizonte antes del experimento.',data:'Distingue performance del modelo de evidencia del experimento.',context:'Comprueba que la asignación no dependa de un confusor previo.',integrator:'Usa Experiment Lab para comparar diseños y calcular una diferencia con IC.',risk:'Asegura un control comparable y un outcome relevante, no sólo un proxy cómodo.'},
4:{business:'Convierte efectos en una política con capacidad limitada.',data:'Compara propensity y uplift por perfil.',context:'Recuerda que heterogeneidad sólo es causal si el efecto está identificado.',integrator:'Resume ATE/CATE e incertidumbre para el equipo.',risk:'Usa Policy Simulator para evitar segmentos con valor neto o efecto adverso.'}
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
