import './learning.css'

export const LESSONS={
1:{minutes:10,title:'De predecir a intervenir',objective:'Distinguir probabilidad de resultado de efecto causal.',formula:'E[Y(1) − Y(0)]',methods:['Modelo predictivo P(Y|X)','Resultados potenciales Y(1), Y(0)','Contrafactual'],teacher:[
'Pregunta: “Si sé quién va a pagar, ¿ya sé a quién debo llamar?”',
'Muestra dos clientes: uno 90%→89% y otro 65%→35%. El primero predice mejor; el segundo cambia más.',
'Introduce Y(1) como resultado con intervención y Y(0) como resultado sin intervención.',
'Explica que en datos reales nunca observamos los dos futuros de la misma persona; el juego puede mostrarlos sólo porque es sintético.',
'Antes de abrir el laboratorio, explica que algunos poderes avanzados seguirán bloqueados hasta que el grupo aprenda el concepto correspondiente.'
],demo:'Compara score predictivo y efecto incremental en dos clientes de ejemplo.',check:'¿Una AUC alta demuestra que intervenir con el modelo causa más conversiones? No.'},
2:{minutes:10,title:'Asociación no es comparación causal',objective:'Reconocer confusión y conocer herramientas para ajustar diferencias previas.',formula:'Y = β₀ + β₁T + β₂X + ε',methods:['DAG / grafo causal','Regresión ajustada','Propensión al tratamiento e(X)=P(T=1|X)','Ponderación IPW'],teacher:[
'Parte del dato incómodo: llamados 20%, no llamados 35%. Pregunta si cancelarían.',
'Dibuja Mora previa → Llamada y Mora previa → Pago. La mora existe antes del tratamiento.',
'Explica regresión ajustada como comparar personas similares en variables previas.',
'Explica propensión al tratamiento como probabilidad de recibir tratamiento dadas características previas; matching/IPW intentan reconstruir comparabilidad.',
'Advierte: una variable posterior al tratamiento no se controla automáticamente.',
'Al terminar, anuncia el desbloqueo de Visión DAG, Escáner de Confusión y Radar de Propensión.'
],demo:'Datos de práctica: comparación cruda −12 pp; ajustada +3,9 pp; IPW +4,2 pp.',check:'¿Qué debe existir antes de la llamada para ser un confusor razonable? Una característica previa que afecte tratamiento y resultado.'},
3:{minutes:10,title:'Diseñar evidencia antes de mirar el resultado',objective:'Entender por qué randomizar crea una comparación creíble y cómo leer un efecto promedio.',formula:'ATE = Ȳtratamiento − Ȳcontrol',methods:['Prueba A/B / RCT','Randomización','ATE','Intervalo de confianza','Potencia y MDE (conceptual)'],teacher:[
'Pregunta quién debe decidir el tratamiento: asesor, modelo o azar.',
'Explica que el azar rompe sistemáticamente el vínculo entre características previas y asignación.',
'Define resultado y horizonte antes de ejecutar. Un clic a 1 día no sustituye pago a 30 días.',
'Calcula una diferencia de medias y un intervalo de confianza sencillo.',
'Menciona potencia/MDE sólo como respuesta a “¿tenemos muestra suficiente para detectar algo relevante?”',
'Al terminar, anuncia el desbloqueo de Escudo RCT y Medidor ATE.'
],demo:'Ejemplo de práctica: 28% vs 23% → +5 pp; interpretar magnitud e incertidumbre.',check:'¿Por qué la randomización ayuda? Porque, en expectativa, hace comparables los grupos antes del tratamiento.'},
4:{minutes:10,title:'Del efecto promedio a la política',objective:'Pasar de ATE a heterogeneidad, uplift y decisión segmentada.',formula:'CATE(x)=E[Y(1)−Y(0) | X=x]',methods:['CATE','Uplift','Bosques causales (conceptual)','Meta-learners (mapa)','Valor de política'],teacher:[
'Muestra que un ATE +6 pp puede esconder +15 pp en un segmento y −5 pp en otro.',
'Distingue probabilidad base de uplift: alta probabilidad base no implica gran cambio por tratamiento.',
'Explica que bosques causales/meta-learners estiman heterogeneidad; no vuelven causal cualquier dato observacional sin supuestos.',
'Conecta CATE con costo, capacidad y riesgo: la salida final es una política, no sólo un estimador.',
'Al terminar, anuncia el desbloqueo de Lente de Uplift y Forja ROI.'
],demo:'Compara dos segmentos: 93→92 (+1 pp) frente a 57→43 (+14 pp).',check:'¿Un ATE positivo justifica tratar a todos? No.'}
}

export const ROLE_TOOLS={
business:{label:'Líder de Decisión',tool:'Canvas de Decisión',purpose:'Traducir el problema de negocio a una decisión causal clara.',color:'var(--gold)'},
data:{label:'Líder de Modelos',tool:'Explorador de Modelos',purpose:'Separar score predictivo, propensión al tratamiento y efecto incremental.',color:'var(--blue)'},
context:{label:'Analista Causal',tool:'Laboratorio Causal',purpose:'Formular la comparación causal y, desde la ronda 2, usar DAG y confusión.',color:'var(--cyan)'},
integrator:{label:'Líder de Experimentos',tool:'Laboratorio de Experimentos',purpose:'Evaluar la calidad de la comparación y, desde la ronda 3, diseñar RCT e interpretar ATE.',color:'var(--violet)'},
risk:{label:'Política y Riesgo',tool:'Simulador de Política',purpose:'Revisar daño, costo y capacidad; en la ronda 4 convertir efecto en valor.',color:'var(--green)'}
}

export const ROLE_TASKS={
1:{business:'Escribe en una frase: población, intervención, resultado y horizonte. Luego resume la decisión del equipo.',data:'Ordena los clientes por score y advierte al equipo que un score alto todavía no demuestra impacto.',context:'Formula la pregunta contrafactual: “¿qué habría pasado con este cliente si NO lo intervengo?”. No uses DAG todavía.',integrator:'Comprueba que todos estén hablando del mismo resultado y horizonte. Pregunta qué grupo permitiría una comparación justa.',risk:'Señala al menos un costo, restricción o posible daño de intervenir sin evidencia causal.'},
2:{business:'Define qué evidencia sería suficiente para rediseñar la estrategia antes de cancelarla.',data:'Usa el Radar de Propensión para detectar que la asignación al tratamiento dependía de perfiles previos.',context:'Usa Visión DAG y Escáner de Confusión para encontrar la variable previa que afecta tratamiento y pago.',integrator:'Revisa si la comparación observacional es defendible y qué diseño podría mejorarla; todavía no necesitas calcular un RCT.',risk:'Explica qué riesgo tiene cancelar o escalar una estrategia basándose sólo en la tasa cruda.'},
3:{business:'Fija resultado, horizonte y criterio de éxito antes de abrir el experimento.',data:'Aclara que AUC o score no sustituyen la asignación experimental.',context:'Comprueba que no se ajuste por variables posteriores al tratamiento y que la pregunta causal sea la misma.',integrator:'Usa Escudo RCT y Medidor ATE para evaluar asignación, diferencia de medias e incertidumbre.',risk:'Verifica que el resultado medido sea relevante para negocio y que el experimento no introduzca daño innecesario.'},
4:{business:'Integra los cinco hallazgos y convierte los efectos por segmento en una política con capacidad limitada.',data:'Usa Lente de Uplift para comparar probabilidad base con cambio incremental.',context:'Revisa que la heterogeneidad se interprete sólo donde el efecto está identificado.',integrator:'Resume ATE/CATE e incertidumbre; advierte qué segmentos necesitan más evidencia.',risk:'Usa Forja ROI y Escudo de Riesgo para decidir dónde intervenir, dónde no y dónde pedir más evidencia.'}
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
