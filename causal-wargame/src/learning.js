import './learning.css'

export const LESSONS={
1:{minutes:9,title:'De predecir a intervenir',objective:'Distinguir probabilidad de resultado de efecto causal.',formula:'E[Y(1) − Y(0)]',methods:['Predicción P(Y|X)','Resultados potenciales Y(1), Y(0)','Contrafactual'],teacher:[
'Empieza con una pregunta: “Si sé quién va a pagar, ¿ya sé a quién debo llamar?”',
'Muestra dos clientes: uno con 90%→89% y otro con 65%→35%. El primero predice mejor; el segundo cambia más.',
'Introduce Y(1) como resultado con intervención y Y(0) como resultado sin intervención.',
'Recalca: en datos reales no vemos los dos futuros de la misma persona; el juego puede mostrarlos porque es sintético.'
],demo:'Compara probabilidad y cambio incremental en dos clientes de práctica.',check:'¿Una AUC alta demuestra que intervenir causa más conversiones? No.'},
2:{minutes:9,title:'Asociación no es comparación causal',objective:'Reconocer confusión, solapamiento y la lógica de una comparación defendible.',formula:'T ← X → Y',methods:['Grafo causal (DAG)','Confusor','Positividad / overlap','Ajuste por variables previas'],teacher:[
'Parte del dato incómodo: llamados 20%, no llamados 35%. Pregunta si cancelarían.',
'Dibuja Mora previa → Llamada y Mora previa → Pago. La mora existe antes del tratamiento y abre una comparación injusta.',
'Explica ajuste como comparar grupos similares en características previas relevantes; no derives fórmulas.',
'Introduce overlap con una pregunta operativa: “si casi todos los de mora extrema fueron llamados, ¿de dónde aprenderíamos qué habría pasado sin llamar?”',
'Advierte: ajustar por todo no es causalidad. Una variable posterior al tratamiento puede distorsionar el efecto.',
'Sólo como panorama: puntaje de propensión, emparejamiento e IPW son herramientas para buscar comparabilidad; no son el objetivo de esta ronda.'
],demo:'Muestra comparación cruda −12 pp, ajuste cercano a +4 pp y un segmento con soporte casi inexistente. La pregunta es qué población queda respaldada por los datos.',check:'¿Qué necesitas además de ajustar confusores observados? Comparaciones con soporte suficiente en la población donde quieres inferir.'},
3:{minutes:9,title:'Diseñar evidencia antes de mirar el resultado',objective:'Entender aleatorización, precisión útil y por qué más N no corrige sesgo.',formula:'ATE = Ȳtratamiento − Ȳcontrol',methods:['Asignación aleatoria (RCT)','ATE','IC95%','MDE / potencia'],teacher:[
'Pregunta quién debe decidir el tratamiento: asesor, modelo o azar.',
'Explica que el azar rompe sistemáticamente el vínculo entre características previas y asignación.',
'Define resultado y horizonte antes de ejecutar. Un clic a 1 día no sustituye pago a 30 días.',
'Calcula una diferencia de medias y usa el intervalo de confianza para hablar de incertidumbre.',
'Conecta tamaño de muestra con negocio: si menos de +2 pp no paga la campaña, el diseño debe tener precisión suficiente para detectar algo de ese orden.',
'Menciona una condición adicional sin formalismo: la intervención de una persona no debería cambiar el outcome de otra de forma ignorada; si hay contagio entre clientes/equipos, el diseño debe adaptarse.'
],demo:'Compara N=200, 2.000 y 20.000: observa IC y MDE aproximado. Después cambia la asignación a sesgada para mostrar que N enorme no arregla selección.',check:'¿Qué cambia con más N? La precisión. ¿Qué no arregla? Una comparación sesgada.'},
4:{minutes:9,title:'Del efecto promedio a la política',objective:'Tomar una decisión segmentada y someter la conclusión a un stress test causal.',formula:'CATE(x)=E[Y(1)−Y(0) | X=x]',methods:['CATE','Impacto incremental','Valor + costo + capacidad + riesgo','Refutación / stress test'],teacher:[
'Muestra que un ATE +6 pp puede esconder efectos muy distintos por segmento.',
'Distingue probabilidad base de impacto incremental: convertir mucho no implica cambiar mucho por intervenir.',
'Introduce la incertidumbre: un intervalo que cruza 0 no da la misma evidencia que uno completamente positivo.',
'Conecta efecto con costo, capacidad y posible daño. La salida final es una política, no un estimador.',
'Antes de cerrar, desafía la conclusión: ¿qué pasaría si un outcome placebo también “respondiera”, si aparece confusión no medida o si no hay overlap en el segmento prioritario?',
'Bosques causales y meta-modelos son ejemplos modernos para estimar heterogeneidad; no sustituyen identificación ni robustez.'
],demo:'Compara segmentos positivos, inciertos y negativos; aplica un stress test y decide si desplegar, limitar población o pedir más evidencia.',check:'¿Tres estimadores que coinciden prueban causalidad? No: pueden compartir la misma falla de identificación.'}
}

export const ROLE_TOOLS={
business:{label:'Líder de Decisión y Política',tool:'Constructor de Pregunta + Simulador de Política',purpose:'Definir el contrato causal y, en R4, integrar efecto, incertidumbre, costo, capacidad y riesgo en una política factible.',color:'var(--gold)'},
data:{label:'Líder de Modelos',tool:'Explorador de Impacto (Uplift/CATE)',purpose:'Separar puntaje predictivo, asociación y efecto incremental; revisar soporte y desafiar estimaciones antes de convertirlas en política.',color:'var(--blue)'},
context:{label:'Analista Causal',tool:'Laboratorio de Grafo Causal',purpose:'Construir y diagnosticar hipótesis causales: confusores, mediadores, colisionadores y condiciones de identificación.',color:'var(--cyan)'},
integrator:{label:'Líder de Experimentos',tool:'Diseñador de Experimentos',purpose:'Diseñar una comparación e interpretar magnitud, balance, incertidumbre y precisión útil.',color:'var(--violet)'},
risk:{label:'Política y Riesgo · legado',tool:'Simulador de Política',purpose:'Compatibilidad temporal con sesiones antiguas; en partidas nuevas esta responsabilidad pertenece a Decisión y Política.',color:'var(--green)'}
}

export const ROLE_TASKS={
1:{business:'Define población, intervención, comparador, resultado y horizonte. Tu salida es la pregunta que las otras tres especialidades deben poder responder; además administras los recursos del equipo.',data:'Interpreta el puntaje predictivo y explica qué sí predice y qué todavía no demuestra.',context:'Formula el contrafactual y pregunta qué tendría que ser comparable; aún no necesitas un grafo causal.',integrator:'Pregunta contra qué grupo compararías la intervención; la aleatorización se enseñará después.',risk:'Rol legado: revisa desperdicio, daño y reversibilidad.'},
2:{business:'Mantén fijo el contrato causal y decide qué evidencia necesitas antes de cancelar o mantener la estrategia.',data:'Compara asociación cruda y resultados ajustados; revisa si existe overlap suficiente y no confundas coincidencia entre métodos con identificación.',context:'Usa el Laboratorio de Grafo Causal para encontrar una variable previa problemática y defender qué ajustar y qué no.',integrator:'Juzga si la comparación observacional sería defendible y qué diseño mejoraría la evidencia; el experimento formal llega en la siguiente ronda.',risk:'Rol legado: favorece acciones reversibles cuando la evidencia es débil.'},
3:{business:'Fija resultado, horizonte y restricción antes del experimento; no aceptes un resultado sustituto sólo porque sea rápido.',data:'Distingue desempeño predictivo de evidencia experimental. Si falta Experimentos, cubre esa responsabilidad con el módulo de doble sombrero.',context:'Comprueba que la asignación no dependa sistemáticamente de una causa previa del resultado y pregunta si existe interferencia entre unidades.',integrator:'Usa el Diseñador de Experimentos: cambia asignación y N; interpreta efecto, balance, IC y MDE frente a un efecto mínimo útil.',risk:'Rol legado: revisa daño y desperdicio.'},
4:{business:'Integra las cuatro piezas, conserva el contrato causal y usa el Simulador de Política para decidir dónde intervenir, dónde no y dónde pedir más evidencia sin violar la restricción acordada.',data:'Compara estimadores y ejecuta el stress test: una señal placebo o falta de soporte debe reducir la confianza aunque los modelos coincidan.',context:'Usa el grafo para recordar que la heterogeneidad sólo es causal si el efecto está identificado; evita mediadores y colisionadores problemáticos.',integrator:'Resume efecto, incertidumbre y precisión para que el equipo no sobrerreaccione a una estimación puntual.',risk:'Rol legado: usa el Simulador de Política si esta sesión histórica aún conserva el quinto rol.'}
}

export const IDENTIFICATION_COMPASS=[
{signal:'Puedes asignar la intervención',strategy:'Experimento aleatorio (RCT)',question:'¿Cómo preservas comparabilidad, outcome y horizonte antes de mirar resultados?'},
{signal:'Observacional con confusores medidos defendibles',strategy:'Backdoor / ajuste',question:'¿Qué variables previas bloquean las rutas de confusión y dónde hay overlap?'},
{signal:'Existe una regla con umbral',strategy:'Regresión discontinua (RDD)',question:'¿Las unidades alrededor del corte son comparables y el umbral no se manipula?'},
{signal:'Hay cambio de política y grupo de comparación',strategy:'Diferencias en diferencias (DiD)',question:'¿Es defendible la tendencia paralela antes del cambio?'},
{signal:'Existe una fuente exógena de asignación',strategy:'Variable instrumental (IV)',question:'¿El instrumento afecta el outcome sólo mediante el tratamiento y mueve realmente el tratamiento?'},
{signal:'No hay estrategia defendible',strategy:'No prometer causalidad',question:'¿Qué experimento, dato o supuesto adicional necesitarías?'}
]

export const ROBUSTNESS_CARDS={
2:{title:'Stress test · soporte',prompt:'En mora alta, 97% de los clientes observados recibieron llamada y sólo 3% no. ¿Qué cambia?',options:[['claim','El ajuste valida el efecto para todo mora alta.'],['restrict','La inferencia en ese segmento queda débil: restringir población o pedir más evidencia.'],['ignore','Nada: IPW siempre corrige falta de soporte.']],correct:'restrict'},
4:{title:'Stress test · placebo',prompt:'Un outcome registrado antes de la campaña muestra un “efecto” de +4.7 pp con el mismo pipeline. La campaña no puede causarlo. ¿Qué haces?',options:[['deploy','Desplegar: tres estimadores modernos coinciden.'],['review','Reducir confianza y revisar identificación/pipeline antes de política.'],['average','Ignorar el placebo si el ATE principal sigue positivo.']],correct:'review'}
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
