export const V2_MISSION={
  title:'DOS FUTUROS',
  subtitle:'Un buen modelo predice. Tu equipo debe descubrir cuándo una predicción sirve —y cuándo no— para decidir una intervención.',
  rules:['Mira sólo tu parte del caso','Envía tu propuesta individual','Habla con tu equipo','Tomen una única decisión','Descubran qué estaba oculto']
}

export const V2_ROUNDS={
  1:{
    kicker:'RONDA 1 · EL MODELO CONVINCENTE',
    title:'¿A quién intervenirías?',
    case:'Un modelo XGBoost predice renovación con muy buen desempeño. Sólo pueden intervenir a 10 de 24 clientes.',
    individual:'Revisa tus clientes y propone entre 1 y 3 candidatos. Usa lo que usarías normalmente: score, variables y SHAP.',
    team:'Cuando todos hayan enviado, comparen propuestas y seleccionen exactamente 10 clientes.',
    concept:'Predicción ≠ efecto causal · contrafactual',
    takeaway:'SHAP explica por qué el modelo predice. No demuestra qué pasará si cambias una variable ni quién cambiará por la intervención.',
    evidence:'SHAP de población · score vs uplift · panel de dos futuros'
  },
  2:{
    kicker:'RONDA 2 · LA COMPARACIÓN ENGAÑOSA',
    title:'¿Cancelarías la estrategia?',
    case:'Históricamente, los tratados renovaron menos que los no tratados. Cada integrante ve una parte distinta de los clientes.',
    individual:'Con tu muestra, decide: cancelar, mantener o rediseñar la estrategia.',
    team:'Comparen qué tipo de clientes recibió tratamiento y acuerden una recomendación.',
    concept:'Confusión · comparabilidad · overlap',
    takeaway:'Una diferencia observada no es automáticamente un efecto. Pregunta por qué unos fueron tratados y otros no.',
    evidence:'DAG Lab · overlap · crudo vs ajustado · balance'
  },
  3:{
    kicker:'RONDA 3 · HAGAMOS UNA PRUEBA',
    title:'¿Cómo diseñarías la evidencia?',
    case:'Tienen una nueva población elegible. Ahora pueden decidir cómo asignar la intervención y qué outcome medir.',
    individual:'Elige asignación, outcome y horizonte con la evidencia que consideres más defendible.',
    team:'Comparen sus diseños y acuerden uno solo antes de observar resultados.',
    concept:'Randomización · ATE · incertidumbre',
    takeaway:'La aleatorización combate sesgo de selección. Más N reduce incertidumbre; no arregla una comparación sesgada.',
    evidence:'simulador N–MDE · tratamiento/control · ATE + IC'
  },
  4:{
    kicker:'RONDA 4 · FUNCIONA… ¿PERO PARA QUIÉN?',
    title:'Construyan una política',
    case:'El efecto promedio es positivo, pero varía por segmento y la capacidad máxima es 15.000 clientes.',
    individual:'Para tus segmentos, propone: tratar, evitar o pedir más evidencia.',
    team:'Construyan una política para los cinco segmentos sin superar capacidad.',
    concept:'CATE · incertidumbre · robustez · política',
    takeaway:'Un ATE positivo no implica tratar a todos. La política debe combinar efecto, incertidumbre, capacidad y señales de robustez.',
    evidence:'CATE forest · comparador EconML · placebo · simulador de política'
  }
}

export const RECOMMENDATIONS=[
  ['cancel','Cancelar'],['keep','Mantener'],['redesign','Rediseñar antes de escalar']
]
export const ASSIGNMENTS=[['advisor','El asesor decide'],['model','El modelo decide'],['random','Asignación aleatoria']]
export const OUTCOMES=[['click_1d','Clic a 1 día'],['renewal_30d','Renovación a 30 días']]
export const HORIZONS=[1,30,90]
export const POLICY_ACTIONS=[['treat','Tratar'],['avoid','Evitar'],['observe','Más evidencia']]

export const statusCopy=status=>({
  lobby:'Esperando participantes',briefing:'Ronda lista',lesson:'Preparando desafío',round:'Decisión abierta',
  closed:'Decisiones cerradas',reveal:'Reveal',teaching:'Reveal',microcheck:'Reveal',paused:'Pausa',finished:'Partida finalizada'
}[status]||status)
