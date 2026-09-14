-- V5: simplify the market for a 120-minute chapter and add pre-session readiness checks.

update public.cw_help_catalog set active=false;

update public.cw_help_catalog set
  active=true,title='Pista de la ronda',description='Una pregunta orientadora, breve y determinista. No entrega la respuesta.',
  category='hint',cost=4,rarity='common',min_round=1,max_round=4,stock_per_round=4,
  price_curve=array[4,5,6,8],repeatable=false,buyer_role='business',availability_managed=false
where help_id='basic_hint';

insert into public.cw_help_catalog(help_id,category,title,description,cost,rarity,min_round,max_round,role_code,result_template,active,stock_per_round,price_curve,repeatable,buyer_role,availability_managed,expert_profile)
values('round_tool','tool','Herramienta de la ronda','Activa un análisis adicional alineado exactamente con el concepto ya enseñado.',8,'rare',1,4,null,
  jsonb_build_object(
    'r1',jsonb_build_object('title','Comparador de dos futuros','text','Compara probabilidad esperada con cambio incremental en dos perfiles de práctica. No revela los clientes reales.','metrics',jsonb_build_array(jsonb_build_array('Perfil A','90% base · +1 pp'),jsonb_build_array('Perfil B','65% base · +30 pp'))),
    'r2',jsonb_build_object('title','Chequeo de comparabilidad','text','Mora previa presenta el mayor desequilibrio entre llamados y no llamados. Revisa si es una causa previa de tratamiento y pago.','metrics',jsonb_build_array(jsonb_build_array('Mora previa','desequilibrio alto'),jsonb_build_array('Edad','desequilibrio bajo'))),
    'r3',jsonb_build_object('title','Chequeo de experimento','text','Con mayor N disminuye la incertidumbre; define resultado y horizonte antes de mirar el efecto.','metrics',jsonb_build_array(jsonb_build_array('Tratamiento','31%'),jsonb_build_array('Control','25%'),jsonb_build_array('ATE','+6 pp'))),
    'r4',jsonb_build_object('title','Mapa de efecto por segmento','text','El promedio esconde heterogeneidad: prioriza efecto incremental y revisa valor y daño.','metrics',jsonb_build_array(jsonb_build_array('Jóvenes digitales','+15 pp'),jsonb_build_array('Ingreso medio','+10 pp'),jsonb_build_array('Mora alta','−5 pp')))
  ),true,4,array[8,10,12,15],false,'business',false,'{}'::jsonb)
on conflict(help_id) do update set category=excluded.category,title=excluded.title,description=excluded.description,cost=excluded.cost,rarity=excluded.rarity,min_round=excluded.min_round,max_round=excluded.max_round,result_template=excluded.result_template,active=true,stock_per_round=excluded.stock_per_round,price_curve=excluded.price_curve,repeatable=false,buyer_role='business',availability_managed=false,expert_profile='{}'::jsonb;

update public.cw_help_catalog set
  active=true,title='Analista Junior',description='Hace el cálculo o tabla básica para que el equipo pueda concentrarse en interpretar.',
  category='talent',cost=6,rarity='common',min_round=1,max_round=4,stock_per_round=3,price_curve=array[6,9,13],repeatable=true,buyer_role='business',availability_managed=false,
  expert_profile=jsonb_build_object('rank','Analista Junior','scope','Cálculos, tablas y chequeos básicos. No recomienda la decisión final.','max_role','Analista')
where help_id='junior_analyst';

update public.cw_help_catalog set
  active=true,title='Especialista Senior',description='Revisa supuestos y señala el principal riesgo metodológico sin entregar la respuesta final.',
  category='talent',cost=14,rarity='epic',min_round=1,max_round=4,stock_per_round=2,price_curve=array[14,20],repeatable=true,buyer_role='business',availability_managed=false,
  expert_profile=jsonb_build_object('rank','Especialista Senior','scope','Supuestos, método e interpretación. Orienta; no resuelve por el equipo.','max_role','Especialista Senior')
where help_id='senior_specialist';

update public.cw_help_catalog set
  active=true,title='Llamada al Capítulo',description='Consulta de 90 segundos con uno de los tres facilitadores expertos disponibles. Sólo responde sobre conceptos ya enseñados.',
  category='expert',cost=20,rarity='legendary',min_round=1,max_round=4,stock_per_round=null,price_curve=array[20,28,38],repeatable=false,buyer_role='business',availability_managed=true,
  result_template=jsonb_build_object('default',jsonb_build_object('title','Llamada al Capítulo','text','Un facilitador experto se unirá por 90 segundos. Puede hacer una observación y una pregunta socrática; no puede entregar la respuesta final.','master','Equipo experto del capítulo','seconds',90)),
  expert_profile=jsonb_build_object('rank','Experto/a del capítulo','scope','Puede orientar causalidad, experimentación y decisión sólo hasta el contenido ya enseñado en la ronda.','max_role','Facilitador experto')
where help_id='expert_trainer';

create table if not exists public.cw_readiness_checks(
  id uuid primary key default extensions.gen_random_uuid(),
  game_id uuid not null references public.cw_games(id) on delete cascade,
  participant_key text not null,
  display_name text not null,
  os text,
  browser text,
  device text,
  viewport text,
  backend_ms integer,
  overall text not null check(overall in ('pass','warn','fail')),
  checks jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(game_id,participant_key)
);
alter table public.cw_readiness_checks enable row level security;

create or replace function public.cw_submit_readiness(p_game_code text,p_display_name text,p_payload jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
declare gid uuid; k text; stat text; rid uuid;
begin
  select id into gid from public.cw_games where upper(code)=upper(trim(p_game_code)) limit 1;
  if gid is null then raise exception 'Código de partida inválido'; end if;
  if length(trim(coalesce(p_display_name,'')))<2 then raise exception 'Escribe tu nombre'; end if;
  k:=lower(trim(p_display_name));
  stat:=coalesce(p_payload->>'overall','fail');
  if stat not in ('pass','warn','fail') then stat:='fail'; end if;
  insert into public.cw_readiness_checks(game_id,participant_key,display_name,os,browser,device,viewport,backend_ms,overall,checks)
  values(gid,k,trim(p_display_name),p_payload->>'os',p_payload->>'browser',p_payload->>'device',p_payload->>'viewport',nullif(p_payload->>'backend_ms','')::int,stat,coalesce(p_payload->'checks','{}'::jsonb))
  on conflict(game_id,participant_key) do update set display_name=excluded.display_name,os=excluded.os,browser=excluded.browser,device=excluded.device,viewport=excluded.viewport,backend_ms=excluded.backend_ms,overall=excluded.overall,checks=excluded.checks,updated_at=now()
  returning id into rid;
  return jsonb_build_object('ok',true,'id',rid,'overall',stat);
end $$;

create or replace function public.cw_readiness_report(p_facilitator_token text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare gid uuid; gcode text;
begin
  gid:=public.cw_validate_facilitator_token(p_facilitator_token);
  if gid is null then raise exception 'Sesión de facilitador inválida'; end if;
  select code into gcode from public.cw_games where id=gid;
  return jsonb_build_object(
    'game_code',gcode,'expected',20,
    'total',(select count(*) from public.cw_readiness_checks where game_id=gid),
    'pass',(select count(*) from public.cw_readiness_checks where game_id=gid and overall='pass'),
    'warn',(select count(*) from public.cw_readiness_checks where game_id=gid and overall='warn'),
    'fail',(select count(*) from public.cw_readiness_checks where game_id=gid and overall='fail'),
    'rows',coalesce((select jsonb_agg(jsonb_build_object('name',display_name,'os',os,'browser',browser,'device',device,'viewport',viewport,'backend_ms',backend_ms,'overall',overall,'updated_at',updated_at) order by case overall when 'fail' then 1 when 'warn' then 2 else 3 end,display_name) from public.cw_readiness_checks where game_id=gid),'[]'::jsonb)
  );
end $$;
