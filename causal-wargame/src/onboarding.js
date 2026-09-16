export const GAME_MISSION={
  title:'Tu equipo debe decidir a quién intervenir y demostrar por qué esa decisión cambiaría el resultado.',
  future1:'Futuro 1 · Intervenimos: ¿qué pasa con el cliente si actuamos?',
  future0:'Futuro 2 · No intervenimos: ¿qué habría pasado con ese mismo cliente sin actuar?',
  objective:'No pueden observar ambos futuros para la misma persona. El reto del equipo es construir evidencia suficiente para decidir qué intervención vale la pena, para quién y bajo qué límites.',
  teamwork:'Sí: debes hablar con tus compañeros. Cada persona ve una parte distinta del problema y ninguna herramienta basta sola.',
  loop:['Escucha la mini-clase','Usa tu herramienta','Comparte un hallazgo','Conecta las cuatro evidencias','Bloqueen una sola decisión de equipo']
}

export const ROLE_ACTIONS={
  business:{can:'Definir la pregunta, fijar la restricción y cerrar la política final.',cannot:'No puede declarar que algo funciona sólo porque un modelo lo sugiera.',deliver:'Pregunta causal + política factible.'},
  data:{can:'Comparar predicción vs efecto, explorar CATE/uplift y revisar overlap.',cannot:'No puede convertir una estimación en causalidad por sí sola.',deliver:'Dónde parece haber efecto y dónde la evidencia es débil.'},
  context:{can:'Construir el DAG y decidir qué variables amenazan o sostienen la comparación.',cannot:'No puede estimar por sí solo cuánto vale el efecto.',deliver:'Qué comparación es defendible y bajo qué supuestos.'},
  integrator:{can:'Diseñar la comparación, asignación, N, outcome, horizonte e incertidumbre.',cannot:'No puede corregir sesgo simplemente aumentando la muestra.',deliver:'Diseño de evidencia + precisión útil para decidir.'}
}
