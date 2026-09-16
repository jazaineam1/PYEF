import './learning.css'

export const LESSONS={
1:{minutes:9,title:'De predecir a intervenir',objective:'Distinguir probabilidad de resultado de efecto causal.',formula:'E[Y(1) − Y(0)]',methods:['Predicción P(Y|X)','Resultados potenciales Y(1), Y(0)','Contrafactual'],teacher:[
'Empieza con una pregunta: “Si sé quién va a pagar, ¿ya sé a quién debo llamar?”',
'Muestra dos clientes: uno con 90%→89% y otro con 65%→35%. El primero predice mejor; el segundo cambia más.',
'Introduce Y(1) como resultado con intervención y Y(0) como resultado sin intervención.',
'Recalca: en datos reales no vemos los dos futuros de la misma persona; el juego puede mostrarlos porque es sintético.'
],demo:'Compara probabilidad y cambio incremental en dos clientes de práctica.',check:'¿Una AUC alta demuestra que intervenir causa más conversiones? No.'},
2:{minutes:9,title:'Asociación no es comparación causal',objective:'Reconocer confusión y entender la idea de comparar personas comparables.',formula:'T ← X → Y',methods:['Grafo causal (DAG)','Confusor','Ajuste por variables previas'],teacher:[
'Parte del dato incómodo: llamados 20%, no llamados 35%. Pregunta si cancelarían.',
'Dibuja Mora previa → Llamada y Mora previa → Pago. La mora existe antes del tratamiento y abre una comparación injusta.',
'Explica ajuste como comparar grupos similares en características previas relevantes; no derives fórmulas.',
'Advierte: ajustar por todo no es causalidad. Una variable posterior al tratamiento puede distorsionar el efecto.',
'Sólo como panorama: puntaje de propensión, emparejamiento e IPW son herramientas para buscar comparabilidad; no son el objetivo de esta ronda.'
],demo:'Muestra comparación cruda −12 pp y una comparación ajustada cercana a +4 pp. La pregunta es por qué cambia, no memorizar el método.',check:'¿Qué hace a una variable un confusor razonable? Existe antes y se relaciona con tratamiento y resultado.'},
3:{minutes:9,title:'Diseñar evidencia antes de mirar el resultado',objective:'Entender por qué asignar al azar crea una comparación creíble y cómo leer un efecto promedio.',formula:'ATE = Ȳtratamiento − Ȳcontrol',methods:['Asignación aleatoria (RCT)','Efecto promedio (ATE)','Intervalo de confianza'],teacher:[
'Pregunta quién debe decidir el tratamiento: asesor, modelo o azar.',
'Explica que el azar rompe sistemáticamente el vínculo entre características previas y asignación.',
'Define resultado y horizonte antes de ejecutar. Un clic a 1 día no sustituye pago a 30 días.',
'Calcula una diferencia de medias y usa el intervalo de confianza para hablar de incertidumbre.',
'Potencia y efecto mínimo detectable (MDE) quedan como extensión opcional si alguien pregunta por tamaño de muestra.'
],demo:'Ejemplo de práctica: 28% vs 23% → +5 pp; interpreta magnitud e incertidumbre.',check:'¿Por qué ayuda la asignación aleatoria? Porque, en expectativa, hace comparables los grupos antes del tratamiento.'},
4:{minutes:9,title:'Del efecto promedio a la política',objective:'Tomar una decisión segmentada usando efecto, incertidumbre, costo, capacidad y riesgo.',formula:'CATE(x)=E[Y(1)−Y(0) | X=x]',methods:['Efecto por perfil (CATE)','Impacto incremental','Valor + costo + capacidad + riesgo'],teacher:[
'Muestra que un ATE +6 pp puede esconder efectos muy distintos por segmento.',
'Distingue probabilidad base de impacto incremental: convertir mucho no implica cambiar mucho por intervenir.',
'Introduce la incertidumbre: un intervalo que cruza 0 no da la misma evidencia que uno completamente positivo.',
'Conecta efecto con costo, capacidad y posible daño. La salida final es una política, no un estimador.',
'Bosques causales y meta-modelos se mencionan sólo como ejemplos modernos para estimar heterogeneidad.'
],demo:'Compara segmentos con efecto positivo claro, incierto y negativo bajo una capacidad limitada.',check:'¿Un efecto promedio positivo justifica tratar a todos? No.'}
}

export const ROLE_TOOLS={
business:{label:'Líder de Decisión',tool:'Constructor de Pregunta Causal',purpose:'Definir población, intervención, comparador, resultado, horizonte, estimando y restricción antes de integrar la evidencia del equipo.',color:'var(--gold)'},
data:{label:'Líder de Modelos',tool:'Explorador de Impacto (Uplift/CATE)',purpose:'Separar puntaje predictivo, asociación y efecto incremental; en equipos incompletos puede cubrir temporalmente Experimentos.',color:'var(--blue)'},
context:{label:'Analista Causal',tool:'Laboratorio de Grafo Causal',purpose:'Construir y diagnosticar hipótesis causales: confusores, mediadores y colisionadores.',color:'var(--cyan)'},
integrator:{label:'Líder de Experimentos',tool:'Diseñador de Experimentos',purpose:'Diseñar una comparación e interpretar magnitud, balance e incertidumbre.',color:'var(--violet)'},
risk:{label:'Política y Riesgo',tool:'Simulador de Política',purpose:'Convertir efecto e incertidumbre en una política bajo costo, capacidad, daño y tolerancia de riesgo.',color:'var(--green)'}
}

export const ROLE_TASKS={
1:{business:'Define población, intervención, comparador, resultado y horizonte. Tu salida es la pregunta que los otros cuatro especialistas deben poder responder.',data:'Interpreta el puntaje predictivo y explica qué sí predice y qué todavía no demuestra.',context:'Formula el contrafactual y pregunta qué tendría que ser comparable; aún no necesitas un grafo causal.',integrator:'Pregunta contra qué grupo compararías la intervención; la aleatorización se enseñará después.',risk:'Evalúa desperdicio, posible daño y reversibilidad. Tu evidencia debe decir qué riesgo de decisión existe aun antes de estimar efectos.'},
2:{business:'Mantén fijo el contrato causal y decide qué evidencia necesitas antes de cancelar o mantener la estrategia.',data:'Compara la asociación cruda con resultados ajustados; no confundas coincidencia entre métodos con identificación.',context:'Usa el Laboratorio de Grafo Causal para encontrar una variable previa problemática y defender qué ajustar.',integrator:'Juzga si la comparación observacional sería defendible y qué diseño mejoraría la evidencia; el experimento formal llega en la siguiente ronda.',risk:'Cuantifica el costo de equivocarse al cancelar o continuar y favorece acciones reversibles cuando la evidencia es débil.'},
3:{business:'Fija resultado, horizonte y restricción antes del experimento; no aceptes un resultado sustituto sólo porque sea rápido.',data:'Distingue desempeño predictivo de evidencia experimental. Si falta Experimentos, cubre esa responsabilidad con el módulo de doble sombrero.',context:'Comprueba que la asignación no dependa sistemáticamente de una causa previa del resultado y razona sobre mediadores.',integrator:'Usa el Diseñador de Experimentos: cambia asignación y N, interpreta efecto, balance e intervalo.',risk:'Evalúa si el resultado, el horizonte y la regla de despliegue podrían causar daño o desperdicio aunque el experimento sea válido.'},
4:{business:'Integra las cinco piezas y confirma que la política propuesta responde exactamente a la pregunta y respeta la restricción acordada.',data:'Usa el Explorador de Impacto: separa probabilidad base de cambio por intervención y compara estimadores sin tratarlos como magia.',context:'Usa el grafo causal para recordar que la heterogeneidad sólo es causal si el efecto está identificado; evita mediadores y colisionadores problemáticos.',integrator:'Resume efecto e incertidumbre para que el equipo no sobrerreaccione a una estimación puntual.',risk:'Usa el Simulador de Política: asigna capacidad y presupuesto, controla riesgo y decide dónde intervenir, dónde no y dónde pedir más evidencia.'}
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
