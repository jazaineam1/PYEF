-- V5.2: every paid help item must stay inside concepts already taught in the current round.

update public.cw_help_catalog
set result_template = jsonb_build_object(
  'r1',jsonb_build_object('title','Analista Junior · ranking descriptivo','text','Los clientes con puntaje más alto dominan la conversión esperada; este cálculo todavía no identifica impacto causal.'),
  'r2',jsonb_build_object('title','Analista Junior · tabla descriptiva','text','La diferencia cruda es −15 pp. Falta revisar comparabilidad.','metrics',jsonb_build_array(jsonb_build_array('Llamados','20% pagan'),jsonb_build_array('No llamados','35% pagan'))),
  'r3',jsonb_build_object('title','Analista Junior · diferencia de medias','text','El cálculo es correcto si la asignación permite interpretación causal.','metrics',jsonb_build_array(jsonb_build_array('Tratamiento','31%'),jsonb_build_array('Control','25%'),jsonb_build_array('Diferencia','+6 pp'))),
  'r4',jsonb_build_object('title','Analista Junior · tabla por segmento','text','Ordena segmentos por efecto estimado; aún falta costo, riesgo y capacidad para decidir.')
)
where help_id='junior_analyst';

update public.cw_help_catalog
set result_template = jsonb_build_object(
  'r1',jsonb_build_object('title','Revisión del Especialista','text','Un puntaje alto ayuda a predecir, pero no demuestra impacto. Asegura que el equipo tenga clara la intervención, el resultado y el contrafactual.'),
  'r2',jsonb_build_object('title','Revisión del Especialista','text','La comparación cruda no es defendible si los grupos ya eran distintos. Revisa confusores previos y si existen perfiles razonablemente comparables; no controles consecuencias de la llamada.'),
  'r3',jsonb_build_object('title','Revisión del Especialista','text','Asigna al azar entre elegibles, define resultado y horizonte antes de mirar datos y reporta magnitud junto con incertidumbre.'),
  'r4',jsonb_build_object('title','Revisión del Especialista','text','Convierte el efecto por segmento en política sólo después de incorporar capacidad, costo, riesgo y evidencia suficiente.')
)
where help_id='senior_specialist';

update public.cw_help_catalog
set result_template = jsonb_build_object(
  'r1',jsonb_build_object('title','Llamada al Capítulo','text','Puede orientar sobre predicción, intervención, contrafactual y definición de la decisión. No puede usar conceptos que aún no se han enseñado.','master','Facilitador experto disponible','seconds',90),
  'r2',jsonb_build_object('title','Llamada al Capítulo','text','Puede orientar sobre confusión, grafo causal, ajuste y propensión al tratamiento, además de lo aprendido en R1.','master','Facilitador experto disponible','seconds',90),
  'r3',jsonb_build_object('title','Llamada al Capítulo','text','Puede orientar también sobre aleatorización, efecto promedio (ATE), intervalo de confianza, potencia y diseño experimental.','master','Facilitador experto disponible','seconds',90),
  'r4',jsonb_build_object('title','Llamada al Capítulo','text','Puede integrar causalidad, experimentación, impacto incremental, valor, riesgo y política. Una observación + una pregunta socrática; nunca la respuesta final.','master','Facilitador experto disponible','seconds',90)
)
where help_id='expert_trainer';

update public.cw_help_catalog
set result_template = jsonb_build_object(
  'r1',jsonb_build_object('title','Comparador de dos futuros · práctica','text','Compara probabilidad estimada con cambio incremental. Estos datos son de práctica, no del escenario oculto.','metrics',jsonb_build_array(jsonb_build_array('Perfil A','90% con · 89% sin'),jsonb_build_array('Perfil B','65% con · 35% sin'))),
  'r2',jsonb_build_object('title','Chequeo de comparabilidad · práctica','text','La variable previa abre una ruta de confusión; el análisis adicional ayuda a decidir qué comparar o ajustar.','edges',jsonb_build_array('Mora previa → Llamada','Mora previa → Pago','Llamada → Pago')),
  'r3',jsonb_build_object('title','Chequeo experimental · práctica','text','Interpreta magnitud e incertidumbre sólo si la asignación permite una comparación creíble.','metrics',jsonb_build_array(jsonb_build_array('Tratamiento','31%'),jsonb_build_array('Control','25%'),jsonb_build_array('Diferencia','+6 pp'))),
  'r4',jsonb_build_object('title','Mapa de impacto por segmento · práctica','text','Un promedio positivo puede esconder segmentos con poco valor o daño potencial.','metrics',jsonb_build_array(jsonb_build_array('Digital','+14 pp'),jsonb_build_array('Tradicional','+2 pp'),jsonb_build_array('Mora alta','−5 pp')))
)
where help_id='round_tool';
