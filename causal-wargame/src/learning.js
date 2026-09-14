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
'Sólo como panorama: propensity, matching e IPW son herramientas para buscar comparabilidad; no son el objetivo de esta ronda.'
],demo:'Muestra comparación cruda −12 pp y una comparación ajustada cercana a +4 pp. La pregunta es por qué cambia, no memorizar el método.',check:'¿Qué hace a una variable un confusor razonable? Existe antes y se relaciona con tratamiento y resultado.'},
3:{minutes:9,title:'Diseñar evidencia antes de mirar el resultado',objective:'Entender por qué asignar al azar crea una comparación creíble y cómo leer un efecto promedio.',formula:'ATE = Ȳtratamiento − Ȳcontrol',methods:['Asignación aleatoria (RCT)','Efecto promedio (ATE)','Intervalo de confianza'],teacher:[
'Pregunta quién debe decidir el tratamiento: asesor, modelo o azar.',
'Explica que el azar rompe sistemáticamente el vínculo entre características previas y asignación.',
'Define resultado y horizonte antes de ejecutar. Un clic a 1 día no sustituye pago a 30 días.',
'Calcula una diferencia de medias y usa el intervalo de confianza para hablar de incertidumbre.',
'Potencia y MDE quedan como extensión opcional si alguien pregunta por tamaño de muestra.'
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
business:{label:'Estrategia y Política',tool:'Decision & Policy Studio',purpose:'Abrir el problema con un contrato causal y cerrarlo con una política factible bajo restricciones.',color:'var(--gold)'},
data:{label:'Líder de Modelos',tool:'Uplift / CATE Explorer',purpose:'Separar puntaje predictivo, asociación y efecto incremental; en equipos de tres también cubre Experiment Designer.',color:'var(--blue)'},
context:{label:'Analista Causal',tool:'DAG Lab',purpose:'Construir y diagnosticar hipótesis causales: confusores, mediadores y colliders.',color:'var(--cyan)'},
integrator:{label:'Líder de Experimentos',tool:'Experiment Designer',purpose:'Diseñar una comparación e interpretar magnitud, balance e incertidumbre.',color:'var(--violet)'},
risk:{label:'Copiloto de Estrategia',tool:'Mesa de apoyo',purpose:'Apoyo opcional para revisar costo, capacidad, daño y reversibilidad; no constituye una quinta responsabilidad causal.',color:'var(--green)'}
}

export const ROLE_TASKS={
1:{business:'Define población, intervención, resultado y horizonte; revisa además desperdicio y daño antes de escoger clientes.',data:'Interpreta el puntaje predictivo y explica qué sí predice y qué todavía no demuestra.',context:'Formula el contrafactual y pregunta qué tendría que ser comparable; aún no necesitas un DAG.',integrator:'Pregunta contra qué grupo compararías la intervención; la aleatorización se enseñará después.',risk:'Como copiloto, desafía la decisión: ¿hay desperdicio, daño o una acción demasiado agresiva?'},
2:{business:'Decide qué evidencia necesitas antes de cancelar una estrategia y evita una acción irreversible basada sólo en tasas crudas.',data:'Compara la asociación cruda con resultados ajustados; no confundas coincidencia entre métodos con identificación.',context:'Usa DAG Lab para encontrar una variable previa problemática y defender qué ajustar.',integrator:'Ayuda a juzgar si la comparación observacional sería defendible; el experimento formal llega en la siguiente ronda.',risk:'Como copiloto, busca el costo de equivocarse y propone una acción reversible.'},
3:{business:'Fija resultado, horizonte y restricción antes del experimento; no aceptes un proxy sólo porque sea rápido.',data:'Distingue desempeño predictivo de evidencia experimental. Si tu equipo tiene tres personas, abre también Experiment Designer y cubre esa responsabilidad.',context:'Comprueba que la asignación no dependa sistemáticamente de una causa previa del resultado y razona sobre mediadores.',integrator:'Usa Experiment Designer: cambia asignación y N, interpreta ATE, balance e intervalo.',risk:'Como copiloto, revisa si outcome, control y horizonte realmente protegen la decisión.'},
4:{business:'Cierra el ciclo: fija la restricción y construye una política segmentada que respete capacidad, presupuesto y riesgo.',data:'Usa Uplift / CATE Explorer y separa probabilidad base de cambio por intervención. Si cubres Experimentos, entrega también incertidumbre.',context:'Usa DAG Lab para recordar que heterogeneidad sólo es causal si el efecto está identificado; evita colliders.',integrator:'Resume efecto por segmento e incertidumbre para evitar sobrerreaccionar a una estimación.',risk:'Como copiloto opcional, audita la política final: valor, costo, capacidad, daño y reversibilidad.'}
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
