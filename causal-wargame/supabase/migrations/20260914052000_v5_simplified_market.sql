-- V5: mercado reducido y comprensible para una sesión de 2 horas.
-- Todos los equipos acceden al mismo catálogo. Sólo el Líder de Decisión confirma compras.

update public.cw_help_catalog set active=false;

update public.cw_help_catalog
set title='Pista de la ronda',
    description='Una pregunta orientadora breve. No entrega la respuesta.',
    cost=4, rarity='common', min_round=1, max_round=4,
    active=true, stock_per_round=8, price_curve=array[4,4,5,5,6,6,7,8],
    repeatable=false, buyer_role='business', availability_managed=false
where help_id='basic_hint';

insert into public.cw_help_catalog(
  help_id,category,title,description,cost,rarity,min_round,max_round,role_code,result_template,active,
  stock_per_round,price_curve,repeatable,buyer_role,availability_managed,expert_profile
) values (
  'round_tool','tool','Herramienta de la ronda',
  'Abre un análisis adicional exactamente del concepto que ya fue explicado en la ronda.',
  8,'rare',1,4,null,
  jsonb_build_object(
    'r1',jsonb_build_object('title','Comparador de dos futuros · práctica','metrics',jsonb_build_array(jsonb_build_array('Perfil A','90% con · 89% sin'),jsonb_build_array('Perfil B','65% con · 35% sin')),'text','Compara probabilidad base con cambio incremental. Estos datos son de práctica, no del escenario oculto.'),
    'r2',jsonb_build_object('title','Chequeo de comparabilidad · práctica','edges',jsonb_build_array('Mora previa → Llamada','Mora previa → Pago','Llamada → Pago'),'text','La variable previa abre una ruta de confusión; el análisis adicional ayuda a decidir qué comparar o ajustar.'),
    'r3',jsonb_build_object('title','Chequeo experimental · práctica','metrics',jsonb_build_array(jsonb_build_array('Tratamiento','31%'),jsonb_build_array('Control','25%'),jsonb_build_array('Diferencia','+6 pp')),'text','Interpreta magnitud e incertidumbre sólo si la asignación permite una comparación creíble.'),
    'r4',jsonb_build_object('title','Mapa de impacto por segmento · práctica','metrics',jsonb_build_array(jsonb_build_array('Digital','+14 pp'),jsonb_build_array('Tradicional','+2 pp'),jsonb_build_array('Mora alta','−5 pp')),'text','Un promedio positivo puede esconder segmentos con poco valor o daño potencial.')
  ),
  true,4,array[8,10,12,14],false,'business',false,'{}'::jsonb
)
on conflict(help_id) do update set
 category=excluded.category,title=excluded.title,description=excluded.description,cost=excluded.cost,rarity=excluded.rarity,
 min_round=excluded.min_round,max_round=excluded.max_round,result_template=excluded.result_template,active=true,
 stock_per_round=excluded.stock_per_round,price_curve=excluded.price_curve,repeatable=false,buyer_role='business',availability_managed=false,expert_profile='{}'::jsonb;

update public.cw_help_catalog
set title='Contratar Analista Junior',
    description='Hace un cálculo, tabla o chequeo descriptivo rápido. Es barato, pero no decide si el método causal es válido.',
    cost=6, rarity='common', min_round=1, max_round=4, active=true,
    stock_per_round=3, price_curve=array[6,9,13], repeatable=true,
    buyer_role='business', availability_managed=false,
    expert_profile=jsonb_build_object('rank','Analista Junior','scope','Cálculos, tablas y chequeos descriptivos reproducibles.','max_role','Apoyo analítico')
where help_id='junior_analyst';

update public.cw_help_catalog
set title='Contratar Especialista Senior',
    description='Revisa supuestos, método e interpretación. Cuesta más porque orienta decisiones metodológicas, no sólo cálculos.',
    cost=15, rarity='epic', min_round=1, max_round=4, active=true,
    stock_per_round=2, price_curve=array[15,22], repeatable=true,
    buyer_role='business', availability_managed=false,
    expert_profile=jsonb_build_object('rank','Especialista Senior','scope','Supuestos, método, interpretación y control de calidad.','max_role','Revisión metodológica')
where help_id='senior_specialist';

update public.cw_help_catalog
set title='Llamada al Capítulo',
    description='Un facilitador experto disponible entra a la sala durante 90 segundos. Sólo puede orientar con conceptos ya explicados; no entrega la solución.',
    category='expert', cost=22, rarity='legendary', min_round=1, max_round=4, active=true,
    stock_per_round=null, price_curve=array[22,28,35], repeatable=false,
    buyer_role='business', availability_managed=true,
    result_template=jsonb_build_object(
      'r1',jsonb_build_object('title','Llamada al Capítulo','master','Facilitador experto disponible','seconds',90,'text','Puede orientar sobre predicción, contrafactual y definición de la decisión. No puede usar conceptos que aún no se han enseñado.'),
      'r2',jsonb_build_object('title','Llamada al Capítulo','master','Facilitador experto disponible','seconds',90,'text','Puede orientar sobre confusión, DAG, ajuste y propensión al tratamiento, además de lo aprendido en R1.'),
      'r3',jsonb_build_object('title','Llamada al Capítulo','master','Facilitador experto disponible','seconds',90,'text','Puede orientar también sobre randomización, ATE, intervalo de confianza, potencia y diseño experimental.'),
      'r4',jsonb_build_object('title','Llamada al Capítulo','master','Facilitador experto disponible','seconds',90,'text','Puede integrar causalidad, experimentación, uplift, ROI, riesgo y política. Una observación + una pregunta socrática; nunca la respuesta final.')
    ),
    expert_profile=jsonb_build_object('rank','Equipo experto del Chapter','scope','Orientación transversal limitada a los temas ya enseñados.','max_role','Acompañamiento del Chapter')
where help_id='expert_trainer';
