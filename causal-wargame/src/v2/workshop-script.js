// An immutable teaching itinerary: 6 scenes = 120 minutes, six missions reused as contents.
export const WORKSHOP_120=[
 {id:'welcome',title:'Bienvenida y reto',start:0,end:10,minutes:10,challenges:[1],teacher:'Presenta dos futuros del mismo estudiante, invita a tomar una primera decisión sin mostrar el efecto verdadero.',student:'Elige a quién apoyar',wow:'La predicción no equivale a beneficio causal'},
 {id:'game',title:'Fase 1 · El juego',start:10,end:30,minutes:20,challenges:[1],teacher:'Abre la decisión inicial sobre perfiles académicos, facilita diálogo en equipo y revela contrafactuales solo al cierre.',student:'Decisión individual → colectiva → revisión',wow:'Mayor probabilidad de aprobar no implica mayor uplift'},
 {id:'ml-trap',title:'Fase 2 · La trampa ML',start:30,end:55,minutes:25,challenges:[1,3],teacher:'Ejecuta MAE y R²; cambia las horas de estudio como predicción hipotética, introduce confusión observacional.',student:'Predicción y diferencia cruda',wow:'Un predictor excelente no es identificación'},
 {id:'dag',title:'Fase 3 · Teoría y DAG',start:55,end:80,minutes:25,challenges:[3],teacher:'Explica T/Y/X, contrafactual, confusor, mediador y collider; el grupo elige un conjunto de ajuste.',student:'Construye y prueba el DAG',wow:'Ajustar todas las variables puede sesgar'},
 {id:'solution',title:'Fase 4 · Solución causal',start:80,end:105,minutes:25,challenges:[2,4,5,6],teacher:'Ocho minutos para A/B/ATE, diez para DML y siete para CATE; EconML es demostración opcional, no otro bloque obligatorio.',student:'Estima, interpreta y decide bajo cupos',wow:'El ATE no es el efecto individual'},
 {id:'kahoot',title:'Gran final · Kahoot',start:105,end:120,minutes:15,challenges:[1,2,3,4,5,6],teacher:'Ocho preguntas: abre, cierra, revela, explica, presenta Top 3 y podio. El reloj y los puntos son del servidor.',student:'Responde A/B/C/D sincronizadamente',wow:'Demuestra transferencia a nuevos casos'}
]
export const totalWorkshopMinutes=WORKSHOP_120.reduce((n,s)=>n+s.minutes,0)
export const WORKSHOP_PHASES=WORKSHOP_120.map(x=>x.id)

// Guided segments are facilitated pauses inside phases, NOT independent missions.
export const WORKSHOP_GUIDE={
  "welcome": [
    {
      "start": 0,
      "end": 2,
      "minutes": 2,
      "mode": "teacher",
      "title": "Presentación del misterio",
      "teacher": "Comiencen con dos historias de estudiantes. Pregunta: «¿A quién ofrecerías el único cupo de apoyo?». No mencionen todavía ATE ni CATE.",
      "visual": "Proyectar dos perfiles y un cupo; la nota prevista NO revela tratamiento.",
      "checkpoint": "Cada persona entiende que hará decisiones antes de estudiar modelos."
    },
    {
      "start": 2,
      "end": 5,
      "minutes": 3,
      "mode": "student",
      "title": "Primera elección, sin respuestas correctas",
      "teacher": "Pide seleccionar A o B en el móvil. Cuenta las elecciones, sin decir cuál tiene más beneficio causal.",
      "visual": "Votación de entrada; mostrar solo conteo de votos.",
      "checkpoint": "Elección inicial registrada sin revelar contrafactual."
    },
    {
      "start": 5,
      "end": 8,
      "minutes": 3,
      "mode": "teacher",
      "title": "Explicación: los dos futuros",
      "teacher": "Dibuja un mismo estudiante: futuro sin apoyo Y(0), futuro con apoyo Y(1). En la realidad vemos uno; en el simulador conocemos ambos por construcción. No confundas con datos reales.",
      "visual": "Animación dos líneas temporales, una visible y otra punteada.",
      "checkpoint": "Que distingan pronóstico de efecto individual potencial."
    },
    {
      "start": 8,
      "end": 10,
      "minutes": 2,
      "mode": "student",
      "title": "Reglas y prueba de interfaz",
      "teacher": "Explica brevemente que se premia revisar decisiones, no acertar en la primera intuición. Comprueba que todos puedan usar los botones y vean su equipo.",
      "visual": "Progreso 120 min; identidad y equipos.",
      "checkpoint": "Preparados para el primer reto."
    }
  ],
  "game": [
    {
      "start": 10,
      "end": 13,
      "minutes": 3,
      "mode": "teacher",
      "title": "Explicación del caso académico",
      "teacher": "Presenta universidad ficticia y variables previas: PGA, estudio, sueño y fatiga. Distingue nota futura del apoyo que decidiremos ofrecer. Las probabilidades son predicciones, no ganancias.",
      "visual": "Tarjetas de perfiles con unidades y capacidad limitada.",
      "checkpoint": "Saben qué significa la intervención y el resultado."
    },
    {
      "start": 13,
      "end": 19,
      "minutes": 6,
      "mode": "student",
      "title": "Juego: decidir a quién apoyar",
      "teacher": "Elige perfiles primero de modo individual; luego permite comparar decisiones. No des el efecto verdadero, deja que el desacuerdo genere curiosidad.",
      "visual": "Botones grandes y conteos agregados.",
      "checkpoint": "Elecciones individuales sin revelar respuestas."
    },
    {
      "start": 19,
      "end": 23,
      "minutes": 4,
      "mode": "student",
      "title": "Decisión en equipo",
      "teacher": "Pide que cada equipo elija a quién apoyaría y por qué, usando criterios cerrados: riesgo de suspender, nota prevista, beneficio esperado no observado.",
      "visual": "Tablero de cupos y equipos que bloquearon decisión.",
      "checkpoint": "Postura colectiva defendida."
    },
    {
      "start": 23,
      "end": 27,
      "minutes": 4,
      "mode": "teacher",
      "title": "WOW: diferencia entre predecir e intervenir",
      "teacher": "Revela solo los resultados potenciales del simulador, dejando claro que no son observaciones reales de la misma persona. Compara ordenación por nota prevista versus efecto incremental. Define contrafactual en lenguaje llano.",
      "visual": "Dos futuros y flechas para cada persona; etiqueta VERDAD SINTÉTICA.",
      "checkpoint": "El grupo descubre por qué cambió la elección."
    },
    {
      "start": 27,
      "end": 30,
      "minutes": 3,
      "mode": "student",
      "title": "Revisión y transferencia",
      "teacher": "Permite revisar la decisión y votar qué información faltaba. Pregunta: «¿Podemos elegir por el 92 % de aprobación?». Cierra con la diferencia entre predecir y causar.",
      "visual": "Antes/después de elección y microrespuesta cerrada.",
      "checkpoint": "Decisión revisada y puente a ML."
    }
  ],
  "ml-trap": [
    {
      "start": 30,
      "end": 34,
      "minutes": 4,
      "mode": "teacher",
      "title": "Explicación: el predictor no identifica efectos",
      "teacher": "Define MAE como error medio en puntos de nota y R² como ajuste predictivo. Entrenar con pasado y evaluar sobre datos no vistos no simula un experimento. Prohíbe usar variables posteriores al resultado.",
      "visual": "Dos columnas MAE y R²; diagrama predicción frente a intervención.",
      "checkpoint": "Pueden interpretar métricas sin inferir causalidad."
    },
    {
      "start": 34,
      "end": 40,
      "minutes": 6,
      "mode": "student",
      "title": "Minilaboratorio: ejecutar una predicción",
      "teacher": "Solo el bloque Python esencial; precarga Pyodide en lobby. Mostrar MAE y R² reales, no exigir los otros bloques en este momento.",
      "visual": "Worker, valores numéricos y gráfico con etiquetas.",
      "checkpoint": "Salida numérica visible; error de entorno no se acredita."
    },
    {
      "start": 40,
      "end": 46,
      "minutes": 6,
      "mode": "teacher",
      "title": "Explicación: confusión y selección",
      "teacher": "Muestra que quienes estudiaron más ya tenían diferencias previas en GPA, complejidad y fatiga. Define confusor: causa común de asignación y nota. Contrasta grupos parecidos versus grupos sesgados.",
      "visual": "Pares emparejados visualmente; flechas PGA→apoyo y PGA→nota.",
      "checkpoint": "Comprenden por qué un modelo muy preciso puede dar la recomendación equivocada."
    },
    {
      "start": 46,
      "end": 51,
      "minutes": 5,
      "mode": "student",
      "title": "Juega: mueve una variable",
      "teacher": "Deslizador de estudio cambia la PREDICCIÓN, con sello «escenario hipotético». Pregunta si eso prueba que intervenir cambie la nota: respuesta no.",
      "visual": "Slider y advertencia persistente «NO es efecto causal».",
      "checkpoint": "Distinguen asociación y acción."
    },
    {
      "start": 51,
      "end": 53,
      "minutes": 2,
      "mode": "teacher",
      "title": "Explicación puente: diseño antes que algoritmo",
      "teacher": "Explica que necesitamos tratamiento definido, comparabilidad y posiblemente aleatorización. Anticipa que el DAG será el mapa para seleccionar ajustes.",
      "visual": "Escena predictor → pregunta causal → diseño.",
      "checkpoint": "Tienen una pregunta para llevar a teoría."
    },
    {
      "start": 53,
      "end": 55,
      "minutes": 2,
      "mode": "student",
      "title": "Microverificación guiada",
      "teacher": "Voto cerrado de 20 segundos: «¿Qué nos falta para afirmar causalidad?». Muestra opción correcta y razón en 60 segundos.",
      "visual": "Barra de votos y feedback.",
      "checkpoint": "Despejado el error predictivo."
    }
  ],
  "dag": [
    {
      "start": 55,
      "end": 61,
      "minutes": 6,
      "mode": "teacher",
      "title": "Explicación: T, Y, X y contrafactual",
      "teacher": "Define T=ofrecer apoyo, Y=nota posterior, X=variables previas. Define efecto TOTAL y la limitación del contrafactual. Dibuja PGA previo → apoyo → nota, con ruta por PGA previo.",
      "visual": "DAG inicial de tres nodos con flechas animadas.",
      "checkpoint": "Identifican tratamiento, resultado y covariables."
    },
    {
      "start": 61,
      "end": 67,
      "minutes": 6,
      "mode": "student",
      "title": "DAG detective: bloquear confusión",
      "teacher": "Los equipos tocan variables PREtratamiento. Comparan estimación sin ajuste y con ajuste adecuado. Discuten la ruta backdoor en un caso sencillo.",
      "visual": "Puzzle DAG táctil con ruta de confusión encendida.",
      "checkpoint": "Ajuste previo elegido y primer estimado."
    },
    {
      "start": 67,
      "end": 74,
      "minutes": 7,
      "mode": "teacher",
      "title": "Explicación fuerte: mediador y collider",
      "teacher": "Define mediador mediante apoyo → estudio posterior → nota. Define collider mediante apoyo → tutorías posteriores ← dificultad. Mostrar numéricamente cómo ajustar cada uno puede sesgar el efecto TOTAL; son preguntas distintas del control previo.",
      "visual": "Tres DAG lado a lado y experimentos numéricos Python.",
      "checkpoint": "Pueden explicar por qué «controlar todo» es incorrecto."
    },
    {
      "start": 74,
      "end": 78,
      "minutes": 4,
      "mode": "student",
      "title": "Decisión de equipo: qué controlar",
      "teacher": "Eligen la combinación que cierra confusión sin ajustar indiscriminadamente postratamiento. Cada respuesta debe indicar razón entre cuatro opciones cerradas.",
      "visual": "Selección de controles con rutas resaltadas.",
      "checkpoint": "Razón causal vinculada a la decisión."
    },
    {
      "start": 78,
      "end": 80,
      "minutes": 2,
      "mode": "teacher",
      "title": "Síntesis docente de identificación",
      "teacher": "Explica que ninguna técnica estadística corrige mágicamente un DAG equivocado o un confusor que no medimos. Distingue diseño observacional del ensayo aleatorio.",
      "visual": "DAG correcto e incorrecto; concepto de identificación.",
      "checkpoint": "Puente hacia A/B y DML."
    }
  ],
  "solution": [
    {
      "start": 80,
      "end": 85,
      "minutes": 5,
      "mode": "teacher",
      "title": "Explicación: RCT, ATE e incertidumbre",
      "teacher": "Sorteo de apoyo define T aleatorio. Efecto promedio ATE compara medias de resultados potenciales; la diferencia tratada-control estima el efecto de asignación. Explica error estándar e IC 95 %, sin interpretarlo como probabilidad posterior.",
      "visual": "Dos grupos con distribución de notas, barras ATE e IC.",
      "checkpoint": "Pueden interpretar estimación más incertidumbre."
    },
    {
      "start": 85,
      "end": 89,
      "minutes": 4,
      "mode": "student",
      "title": "Demostración A/B breve",
      "teacher": "Ejecutar un bloque común de diferencia de medias, incertidumbre e IC. Si Python se demora, proyectar resultado ya verificado y señalar explícitamente que no se ejecutó en ese dispositivo.",
      "visual": "Experimento sintético 2.000 filas; ATE real y estimado.",
      "checkpoint": "Salida confiable etiquetada."
    },
    {
      "start": 89,
      "end": 94,
      "minutes": 5,
      "mode": "teacher",
      "title": "Explicación: cómo funciona DML",
      "teacher": "Primero modelo de T|X, después de Y|X; luego residuos fuera de muestra y relación residual, con cross-fitting. Distingue ajuste ML de identificación causal y menciona positividad y confusión no observada.",
      "visual": "Animación de 4 pasos con dos modelos auxiliares y residuos.",
      "checkpoint": "Saben explicar para qué sirve DML y qué no garantiza."
    },
    {
      "start": 94,
      "end": 99,
      "minutes": 5,
      "mode": "student",
      "title": "Demostración Python DML",
      "teacher": "Ejecuta un bloque corto de DML con cross-fitting y compara estimación ajustada con comparación cruda. No exigir entrenamiento pesado por cada alumno.",
      "visual": "Dos residuos y parámetro estimado; Python real.",
      "checkpoint": "Efecto ajustado e interpretación breve."
    },
    {
      "start": 99,
      "end": 102,
      "minutes": 3,
      "mode": "teacher",
      "title": "Explicación: ATE versus CATE",
      "teacher": "Un beneficio promedio positivo no implica mismo efecto para todos. Define CATE, muestra heterogeneidad y enseña que EconML se ejecutó fuera del navegador; no es requisito entrenarlo en clase.",
      "visual": "Gráfico de efectos por perfil y contraste de modelos verificables.",
      "checkpoint": "Justifican decisiones bajo cupos."
    },
    {
      "start": 102,
      "end": 105,
      "minutes": 3,
      "mode": "student",
      "title": "Política de apoyo con cupos",
      "teacher": "Equipo decide a qué perfiles apoyar combinando CATE, incertidumbre y equidad. No debe ordenar por probabilidad de aprobar.",
      "visual": "Simulador con cupos y beneficios esperados.",
      "checkpoint": "Decisión final antes del desafío."
    }
  ],
  "kahoot": [
    {
      "start": 105,
      "end": 106,
      "minutes": 1,
      "mode": "teacher",
      "title": "Reglas y arranque de gran final",
      "teacher": "Explica ocho preguntas cerradas, 15 puntos por correcta y marcador separado /120. Cada pregunta tiene temporizador del servidor; la respuesta correcta no aparece antes del cierre.",
      "visual": "Cuenta regresiva de batalla y opciones A/B/C/D.",
      "checkpoint": "Móviles y Wall preparados."
    },
    {
      "start": 106,
      "end": 116,
      "minutes": 10,
      "mode": "student",
      "title": "Batalla de ocho preguntas",
      "teacher": "Con ritmo de unos 75 segundos por pregunta: ~20 s de voto, ~25 s de explicación docente, ~25 s de transición/reveal. El facilitador controla apertura y revelación sin seis clics obligatorios.",
      "visual": "Pregunta grande, votos agregados, barras tras revelar y miniexplicación.",
      "checkpoint": "8 respuestas; explicación de errores conceptuales."
    },
    {
      "start": 116,
      "end": 118,
      "minutes": 2,
      "mode": "student",
      "title": "Podio y debrief colectivo",
      "teacher": "Muestra Top 3, mejor equipo, progresos y puntos /600 separados de /120. Celebra razonamiento y aprendizaje, no solo rapidez.",
      "visual": "Podio animado y símbolos visibles sin depender del color.",
      "checkpoint": "Reconocimiento de aprendizajes."
    },
    {
      "start": 118,
      "end": 120,
      "minutes": 2,
      "mode": "teacher",
      "title": "Cierre del capacitador y transferencia",
      "teacher": "Resume: predictor ≠ causalidad; el diseño identifica; ATE oculta heterogeneidad; estimador no sustituye supuestos. Propón un caso nuevo, opciones cerradas, y recomendación a futuro.",
      "visual": "Mapa de conceptos conectado a la decisión inicial.",
      "checkpoint": "Transferencia final lograda."
    }
  ]
}
export const instructorLedMinutes=Object.values(WORKSHOP_GUIDE).flat().filter(x=>x.mode==='teacher').reduce((n,x)=>n+x.minutes,0)
export const participatoryMinutes=120-instructorLedMinutes

export function getWorkshopCue(agenda){
 const phase=WORKSHOP_120[Number(agenda?.phase_index||0)]
 return WORKSHOP_GUIDE[phase?.id]?.[Number(agenda?.cue_index||0)]||null
}
