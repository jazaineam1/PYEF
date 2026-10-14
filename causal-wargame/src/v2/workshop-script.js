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
