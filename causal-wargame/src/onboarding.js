export const GAME_MISSION={
  title:'Tu equipo asesora una decisión real: ¿a quién vale la pena intervenir para cambiar el resultado?',
  future1:'Futuro 1 · Intervenimos: ¿qué pasa con el cliente si actuamos?',
  future0:'Futuro 2 · No intervenimos: ¿qué habría pasado con ese mismo cliente sin actuar?',
  objective:'Sólo observamos uno de esos futuros por persona. El reto es combinar cuatro piezas de evidencia para decidir qué intervención causa valor, para quién y bajo qué límites.',
  teamwork:'Sí: tienes que hablar con tus compañeros. Cada rol recibe información y una herramienta distinta; ninguna persona puede cerrar la decisión sola.',
  loop:['Escucha el concepto común','Lee tu información privada','Usa sólo tu herramienta','Comparte tu evidencia con el equipo','Contrasta lo que dicen los otros roles','🦁 bloquea una única decisión cuando estén las 4 piezas']
}

export const ROLE_ACTIONS={
  business:{can:'Definir la pregunta, fijar la restricción y convertir las evidencias en la decisión/política final.',cannot:'No puede inventar identificación, efecto ni precisión: debe esperar las evidencias de los otros roles.',deliver:'Pregunta causal + decisión/política factible.'},
  data:{can:'Comparar predicción vs efecto, explorar CATE/uplift, overlap y stress tests.',cannot:'No puede declarar causalidad ni política final sólo porque un estimador produzca un número.',deliver:'Estimación: dónde parece haber efecto y dónde el modelo no merece confianza.'},
  context:{can:'Construir el DAG y decidir qué variables sostienen o amenazan la comparación.',cannot:'No puede estimar magnitud ni precisión del efecto con el DAG.',deliver:'Identificación: qué comparación es causalmente defendible y bajo qué supuestos.'},
  integrator:{can:'Diseñar la comparación, asignación, N, outcome, horizonte e interpretar IC/MDE.',cannot:'No puede definir solo la política de negocio ni arreglar sesgo aumentando N.',deliver:'Contraste: diseño de evidencia + incertidumbre/precisión útil.'}
}

export const TRANSFER_CHECKS={
pre:[
 ['q1','Un modelo predice con 92% de precisión quién pagará. ¿Eso identifica automáticamente a quién cambiará una llamada?',[['a','Sí, porque predice muy bien.'],['b','No. Predicción y efecto de intervenir son preguntas distintas.'],['c','Sí, si la muestra es grande.']]],
 ['q2','Los clientes llamados tenían más mora desde antes y también pagan menos. ¿Qué debes revisar primero?',[['a','Sólo el AUC del modelo.'],['b','El color del canal.'],['c','Si la mora previa afecta tanto recibir llamada como pagar.']]],
 ['q3','Puedes asignar una campaña entre clientes elegibles. ¿Qué diseño ayuda más a crear grupos comparables?',[['a','Que el asesor elija.'],['b','Asignación aleatoria.'],['c','Sólo tratar los scores más altos.']]],
 ['q4','El efecto promedio es +6 pp, pero algunos perfiles casi no cambian y otros empeoran. ¿Qué sigue?',[['a','Tratar a todos.'],['b','Ignorar segmentos.'],['c','Evaluar heterogeneidad, incertidumbre, costo y riesgo.']]]
],
post:[
 ['q1','Un banco encuentra clientes con altísimo riesgo de fuga. ¿Son necesariamente quienes más se benefician de una llamada de retención?',[['a','Sí, riesgo alto implica efecto alto.'],['b','No. Necesitamos estimar el cambio incremental causado por llamar.'],['c','Sí, si el modelo está calibrado.']]],
 ['q2','Quienes reciben asesoría financiera ahorran más, pero eran usuarios más activos desde antes. ¿Qué impide concluir causalidad directamente?',[['a','Que el resultado sea dinero.'],['b','Que haya muchos usuarios.'],['c','Los grupos pueden diferir antes de la asesoría por una causa relacionada con el ahorro.']]],
 ['q3','Quieres saber si un recordatorio aumenta aportes voluntarios. Si puedes experimentar, ¿qué comparación es más defendible?',[['a','Recordatorio sólo a quienes más aportan.'],['b','Asignar elegibles al azar a recordatorio/control y definir resultado/horizonte antes.'],['c','Comparar este mes con el anterior sin control.']]],
 ['q4','Una política tiene ATE positivo, pero un segmento tiene IC que cruza cero y otro efecto negativo. ¿Qué decisión es más defendible?',[['a','Tratar a todos porque el promedio es positivo.'],['b','Tratar sólo al segmento más grande.'],['c','Priorizar efectos positivos creíbles, pedir más evidencia donde hay incertidumbre y evitar daño.']]]
]}
