export const TEAM_NAMES = ['Águila', 'Jaguar', 'Cóndor', 'Puma']
export const ROLES = [
  { code: 'business', label: 'Negocio', question: '¿Qué decisión necesitamos tomar?' },
  { code: 'data', label: 'Datos', question: '¿Qué muestran realmente los números?' },
  { code: 'context', label: 'Contexto', question: '¿Por qué estas personas terminaron en este grupo?' },
  { code: 'risk', label: 'Riesgo', question: '¿A quién podríamos perjudicar?' },
  { code: 'integrator', label: 'Integrador', question: '¿Qué decisión puede defender el equipo?' }
]
export const MICROCHECKS = {
  1:{prompt:'Sólo puedes intervenir a una persona. A: 90% con intervención y 89% sin ella. B: 65% con intervención y 35% sin ella. ¿A quién priorizas?',options:['A','B'],concept:'Predicción vs impacto causal'},
  2:{prompt:'Los clientes llamados tenían mayor mora desde antes y la mora también reduce el pago. ¿Qué hace peligrosa la comparación directa?',options:['Los grupos no son comparables desde antes','La muestra es demasiado grande','El modelo tiene demasiadas variables'],concept:'Confusión'},
  3:{prompt:'Tratamiento convierte 31% y control 25% en una asignación aleatoria. ¿Cuál es la diferencia?',options:['6 puntos porcentuales','6%','56 puntos porcentuales'],concept:'ATE'},
  4:{prompt:'El efecto promedio es positivo, pero en mora alta es negativo. ¿Qué decisión es más sensata?',options:['Tratar a todos','Priorizar segmentos con efecto positivo y evitar el segmento negativo','Elegir sólo por score predictivo'],concept:'Heterogeneidad'}
}
export const ROUND_COPY = {
  1:{kicker:'RONDA 1 · ORÁCULO',title:'El modelo sabe quién convertirá',mission:'Tienen presupuesto para intervenir sólo 10 de 24 clientes. Elijan a quiénes.',teaching:{title:'Predicción no es causalidad',body:'Un score alto responde “¿quién probablemente convertirá?”. La pregunta causal es “¿quién cambiará precisamente porque intervengo?”. El futuro que no observamos se llama contrafactual.'}},
  2:{kicker:'RONDA 2 · LA COMPARACIÓN ENGAÑOSA',title:'Las llamadas parecen empeorar el pago',mission:'Llamados pagan menos que no llamados. ¿Cancelarías la estrategia?',teaching:{title:'Una comparación puede ser injusta',body:'Si una característica previa influye tanto en quién recibe la llamada como en la probabilidad de pago, los grupos parten de lugares distintos. A esto lo llamamos confusión.'}},
  3:{kicker:'RONDA 3 · UNA PRUEBA MEJOR',title:'Necesitamos saber si realmente funciona',mission:'Hay 20.000 clientes elegibles. Diseñen cómo comparar intervención y no intervención.',teaching:{title:'El azar construye una comparación más creíble',body:'La randomización evita que el criterio de selección concentre sistemáticamente un tipo de cliente en un grupo. La diferencia de resultados puede interpretarse como un efecto promedio bajo el diseño del experimento.'}},
  4:{kicker:'RONDA 4 · EL PROMEDIO MIENTE',title:'Funciona… pero no para todos',mission:'El efecto promedio es positivo. Sólo pueden intervenir una parte de la población. Decidan dónde actuar, dónde no y dónde pedir más evidencia.',teaching:{title:'El efecto puede cambiar por perfil',body:'Un promedio positivo no significa que todos se beneficien. Cuando estudiamos cómo cambia el efecto por características hablamos de heterogeneidad; CATE es una forma de expresarlo.'}}
}
