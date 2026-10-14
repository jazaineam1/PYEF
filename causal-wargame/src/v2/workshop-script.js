// CAMPUS V2 ONLY. Six long scenes, NOT 30 micro-moments.
// The teacher can optionally project ONE explanation per scene. No forced learner steps.
export const WORKSHOP_120=[
  {
    "id": "welcome",
    "title": "Bienvenida y reto",
    "start": 0,
    "end": 10,
    "teacherMinutes": 4,
    "challenges": [
      1
    ],
    "teacher": "Presenta un estudiante y sus dos futuros: con apoyo Y(1) y sin apoyo Y(0). En la realidad solo conocemos uno. No empieces con fórmulas; primero planteamos a quién ayudar.",
    "activity": "El alumnado toma una primera decisión sencilla desde su móvil. La pregunta aún no tiene respuesta revelada.",
    "demo": "Dos trayectorias, una visible y otra oculta. La pantalla NO muestra la verdad causal antes de que decidan.",
    "wow": "Una nota prevista no equivale a beneficio de intervenir.",
    "checkpoint": "¿Podemos observar los dos futuros de una persona real al mismo tiempo? No.",
    "essential": "Una decisión inicial, sin Python obligatorio",
    "optional": "Laboratorio completo de predicción",
    "minutes": 10,
    "participantMinutes": 6,
    "student": "El alumnado toma una primera decisión sencilla desde su móvil. La pregunta aún no tiene respuesta revelada."
  },
  {
    "id": "game",
    "title": "Fase 1 · El juego",
    "start": 10,
    "end": 30,
    "teacherMinutes": 5,
    "challenges": [
      1
    ],
    "teacher": "Tras dejar jugar al equipo, revela que una persona con 92 % de probabilidad de aprobar podría beneficiarse menos que otra de mayor riesgo. Explica efecto incremental y qué significa contrafactual, no confundir la predicción con intervención.",
    "activity": "Un recorrido sin interrupciones: selección personal, discusión de escuadrón y una oportunidad de revisar al descubrir el WOW.",
    "demo": "Tarjetas con probabilidad de aprobar y diferencia Y(1)−Y(0) solo después de elegir; sello VERDAD SINTÉTICA.",
    "wow": "¡El predictor acertaba, pero nuestra intervención podría beneficiar a otra persona!",
    "checkpoint": "¿Ayudaríamos necesariamente a quien tiene la mayor probabilidad de aprobar? No.",
    "essential": "Un reto de decisión individual y grupal, con una revelación",
    "optional": "Explicaciones técnicas adicionales de S-Learner",
    "minutes": 20,
    "participantMinutes": 15,
    "student": "Un recorrido sin interrupciones: selección personal, discusión de escuadrón y una oportunidad de revisar al descubrir el WOW."
  },
  {
    "id": "ml-trap",
    "title": "Fase 2 · La trampa ML",
    "start": 30,
    "end": 55,
    "teacherMinutes": 7,
    "challenges": [
      1,
      3
    ],
    "teacher": "Demuestra un predictor con MAE bajo y R² alto. Explica MAE como error promedio en puntos y R² como ajuste, no efecto. Luego introduce confusión: PGA previo puede influir tanto en recibir apoyo como en la nota.",
    "activity": "Un reto prolongado: ejecutar un bloque Pyodide preparado, explorar un pronóstico hipotético y responder una decisión cerrada.",
    "demo": "MAE y R² frente al diagrama PGA previo → apoyo y PGA previo → nota; rotular toda manipulación predictiva como escenario hipotético.",
    "wow": "Un R² espectacular no descubre qué habría ocurrido si ofrecimos apoyo.",
    "checkpoint": "¿Cambiar una variable en el modelo prueba el efecto de intervenir? No.",
    "essential": "Un bloque Python auténtico con métricas y conclusión",
    "optional": "Los bloques complementarios se dejan como profundización",
    "minutes": 25,
    "participantMinutes": 18,
    "student": "Un reto prolongado: ejecutar un bloque Pyodide preparado, explorar un pronóstico hipotético y responder una decisión cerrada."
  },
  {
    "id": "dag",
    "title": "Fase 3 · Teoría y DAG",
    "start": 55,
    "end": 80,
    "teacherMinutes": 11,
    "challenges": [
      3
    ],
    "teacher": "Esta es la pausa principal de enseñanza. Explica T=oferta de apoyo, Y=nota final, X=variables previas. Confusor: causa común; mediador: paso posterior en el mecanismo; collider: efecto común de dos causas. Demuestra con números por qué controlar todo puede sesgar.",
    "activity": "Un solo juego de DAG por equipos: seleccionar variables de ajuste y observar cómo cambia la estimación. No ir a otra pantalla hasta cerrar la intuición.",
    "demo": "Grafo con flechas coloreadas que distinguen confusor previo, mediador posterior y collider, acompañado de números simulados y una revelación.",
    "wow": "Controlar todas las variables puede ser peor que seleccionar las adecuadas.",
    "checkpoint": "¿Ajustamos sin pensar horas de estudio medidas DESPUÉS del apoyo? No.",
    "essential": "Un DAG interactivo y una demostración numérica de sesgo",
    "optional": "El resto de variantes de DAG se ofrecen opcionalmente",
    "minutes": 25,
    "participantMinutes": 14,
    "student": "Un solo juego de DAG por equipos: seleccionar variables de ajuste y observar cómo cambia la estimación. No ir a otra pantalla hasta cerrar la intuición."
  },
  {
    "id": "solution",
    "title": "Fase 4 · Solución causal",
    "start": 80,
    "end": 105,
    "teacherMinutes": 7,
    "challenges": [
      2,
      4,
      5,
      6
    ],
    "teacher": "Encadena sin nuevos niveles: experimento A/B, comparación de medias e incertidumbre; luego dos modelos auxiliares de DML y residuos fuera de muestra; por último ATE promedio versus CATE por perfil. EconML se presenta como resultados reales entrenados fuera del teléfono, no como tarea pesada.",
    "activity": "Un desafío de recursos con tres herramientas incrustadas: A/B, una demostración DML y CATE para decidir cupos por beneficio incremental, incertidumbre y equidad.",
    "demo": "Un tablero con intervalo de confianza de A/B, animación de residuos DML y gráfico de heterogeneidad con cupos limitados.",
    "wow": "Un apoyo puede beneficiar en promedio, pero no igual a todos.",
    "checkpoint": "¿Priorizar por aprobar más o por beneficio causal e incertidumbre? Por el efecto incremental defendible.",
    "essential": "Un A/B de Python, demo DML y decisión con capacidad",
    "optional": "Entrenamiento EconML y los demás bloques avanzados después del taller",
    "minutes": 25,
    "participantMinutes": 18,
    "student": "Un desafío de recursos con tres herramientas incrustadas: A/B, una demostración DML y CATE para decidir cupos por beneficio incremental, incertidumbre y equidad."
  },
  {
    "id": "kahoot",
    "title": "Gran final · Kahoot",
    "start": 105,
    "end": 120,
    "teacherMinutes": 2,
    "challenges": [
      1,
      2,
      3,
      4,
      5,
      6
    ],
    "teacher": "En ocho preguntas, deja votar primero y da una frase de explicación causal tras revelar. Evita clases extensas entre las preguntas. Reserva el final para el podio y reconectar las respuestas con la decisión del inicio.",
    "activity": "Juegan ocho preguntas A/B/C/D con reloj del servidor, distribuciones visibles solo tras cierre y podio. No deben avanzar por seis pasos técnicos por pregunta.",
    "demo": "Pregunta grande, tiempo, respuestas recibidas, barra de distribución tras revelación y podio separado del puntaje de las misiones.",
    "wow": "Ya no solo predicen: argumentan decisiones causales frente a casos nuevos.",
    "checkpoint": "¿Podemos explicar por qué predicción, identificación, estimación y decisión son distintas?",
    "essential": "Ocho preguntas sincronizadas y un podio",
    "optional": "Un cuestionario de práctica ampliado fuera de clase",
    "minutes": 15,
    "participantMinutes": 13,
    "student": "Juegan ocho preguntas A/B/C/D con reloj del servidor, distribuciones visibles solo tras cierre y podio. No deben avanzar por seis pasos técnicos por pregunta."
  }
]
export const totalWorkshopMinutes=WORKSHOP_120.reduce((n,s)=>n+s.minutes,0)
export const WORKSHOP_PHASES=WORKSHOP_120.map(s=>s.id)
export const instructorLedMinutes=WORKSHOP_120.reduce((n,s)=>n+s.teacherMinutes,0)
export const participatoryMinutes=totalWorkshopMinutes-instructorLedMinutes
export function getWorkshopCue(agenda){
  const stage=WORKSHOP_120[Number(agenda?.phase_index||0)]
  if(!stage||Number(agenda?.cue_index||0)!==1)return null
  return {mode:'teacher',start:stage.start,end:stage.end,title:stage.title,teacher:stage.teacher,visual:stage.demo,checkpoint:stage.checkpoint}
}
