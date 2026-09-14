-- CAUSAL QUEST V3 · strategic help market, hiring and expert calls

alter table public.cw_teams add column if not exists help_cost int not null default 0;
alter table public.cw_teams drop constraint if exists cw_teams_help_cost_check;
alter table public.cw_teams add constraint cw_teams_help_cost_check check (help_cost >= 0 and help_cost <= 200);

create table if not exists public.cw_help_catalog (
  help_id text primary key,
  category text not null check (category in ('hint','tool','talent','expert')),
  title text not null,
  description text not null,
  cost int not null check (cost between 1 and 40),
  rarity text not null default 'common' check (rarity in ('common','rare','epic','legendary')),
  min_round int not null default 1 check (min_round between 1 and 4),
  max_round int not null default 4 check (max_round between 1 and 4),
  role_code text,
  result_template jsonb not null default '{}'::jsonb,
  active boolean not null default true
);

create table if not exists public.cw_help_purchases (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.cw_games(id) on delete cascade,
  team_id uuid not null references public.cw_teams(id) on delete cascade,
  player_id uuid not null references public.cw_players(id) on delete cascade,
  round_number int not null check (round_number between 1 and 4),
  help_id text not null references public.cw_help_catalog(help_id),
  cost int not null,
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(game_id,team_id,round_number,help_id)
);
create index if not exists cw_help_purchases_team_round_idx on public.cw_help_purchases(game_id,team_id,round_number,created_at);

insert into public.cw_help_catalog(help_id,category,title,description,cost,rarity,min_round,max_round,result_template) values
('basic_hint','hint','Pista básica','Una pregunta guía sin entregar la respuesta.',4,'common',1,4,
 '{"r1":{"title":"Pregunta guía","text":"¿Alta probabilidad de convertir significa necesariamente gran cambio por intervenir?"},"r2":{"title":"Pregunta guía","text":"¿Qué variable existía antes de la llamada y puede afectar llamada y pago?"},"r3":{"title":"Pregunta guía","text":"¿Qué regla de asignación hace comparables los grupos en promedio?"},"r4":{"title":"Pregunta guía","text":"¿El promedio positivo garantiza beneficio en todos los segmentos?"}}'),
('balance_check','tool','Balance Check','Compara covariables antes de interpretar tratamiento vs control.',5,'common',2,3,
 '{"r2":{"title":"Balance de covariables","metrics":[["Mora previa","SMD 0.82 · alto"],["Edad","SMD 0.07 · bajo"],["Ingreso","SMD 0.11 · moderado"]],"text":"La principal diferencia previa está en mora."},"r3":{"title":"Balance tras asignación aleatoria","metrics":[["Mora previa","SMD 0.03"],["Edad","SMD 0.02"],["Ingreso","SMD 0.04"]],"text":"No hay desequilibrios grandes visibles."}}'),
('omitted_check','hint','Variable omitida','Revisa si una variable relevante quedó fuera de tu comparación.',6,'rare',2,4,
 '{"r2":{"title":"Chequeo de omisión","text":"Revisa mora previa: ocurre antes de la intervención y está asociada con selección y outcome."},"r3":{"title":"Chequeo de omisión","text":"Define elegibilidad antes de randomizar; no ajustes por variables posteriores al tratamiento."},"r4":{"title":"Chequeo de omisión","text":"Costo y capacidad también importan cuando conviertes CATE en una política."}}'),
('confounder_scan','tool','Confounder Scan','Escanea variables con señales de confusión.',7,'rare',2,2,
 '{"r2":{"title":"Confounder Scan","text":"Mora previa destaca: T ← mora previa → Y. Edad no muestra una señal comparable en este escenario."}}'),
('benchmark','hint','Benchmark causal','Muestra un caso análogo resuelto para orientar el razonamiento.',8,'rare',1,4,
 '{"r1":{"title":"Caso análogo","text":"Cliente A: propensity 92%, uplift +1 pp. Cliente B: propensity 55%, uplift +20 pp. Si el objetivo es impacto incremental, B domina."},"r2":{"title":"Caso análogo","text":"Cuando tratamiento se asigna por riesgo previo, una diferencia cruda mezcla selección y efecto."},"r3":{"title":"Caso análogo","text":"Un RCT con outcome predefinido permite estimar diferencia de medias como efecto promedio."},"r4":{"title":"Caso análogo","text":"Una política óptima puede excluir segmentos con CATE negativo aunque su propensity sea alta."}}'),
('power_check','tool','Power Check','Evalúa si el experimento tiene tamaño razonable para el efecto buscado.',8,'common',3,3,
 '{"r3":{"title":"Power Check","metrics":[["N por grupo","10.000"],["Baseline","25%"],["MDE aprox.","≈ 2 pp"]],"text":"El diseño tiene escala suficiente para detectar un cambio moderado; el efecto esperado de +6 pp sería visible."}}'),
('dag_vision','tool','DAG Vision','Revela relaciones causales clave mediante un grafo simplificado.',9,'rare',2,4,
 '{"r2":{"title":"DAG Vision","edges":["Mora previa → Llamada","Mora previa → Pago","Llamada → Pago"],"text":"La ruta por mora previa confunde la comparación cruda."},"r4":{"title":"DAG Vision","edges":["Intervención → Outcome","Perfil → respuesta al tratamiento"],"text":"La heterogeneidad describe cómo cambia el efecto entre perfiles; no reemplaza identificación."}}'),
('segment_map','tool','Mapa de segmentos','Resume tamaño, propensity y señales de oportunidad por segmento.',9,'rare',1,4,
 '{"r1":{"title":"Mapa de segmentos","metrics":[["Alta propensity","Patrimonio"],["Mayor oportunidad potencial","Digital / Ingreso medio"]],"text":"Propensity y oportunidad incremental no ordenan necesariamente igual."},"r4":{"title":"Mapa de segmentos","metrics":[["Digital","CATE alto"],["Ingreso medio","CATE alto"],["Mora alta","CATE negativo"]],"text":"Priorizar requiere efecto, costo, capacidad y riesgo."}}'),
('propensity_radar','tool','Propensity Radar','Estima probabilidad de tratamiento y detecta zonas de poco solapamiento.',10,'rare',2,2,
 '{"r2":{"title":"Propensity Radar","metrics":[["Mora baja","P(T) 0.18"],["Mora media","P(T) 0.54"],["Mora alta","P(T) 0.91"]],"text":"La asignación depende fuertemente de mora: tratados y no tratados no son directamente comparables."}}'),
('case_analog','hint','Caso análogo','Consulta una mini-historia causal similar.',10,'rare',1,4,
 '{"default":{"title":"Caso análogo","text":"Un resultado observado puede tener el signo opuesto al efecto causal cuando la intervención se dirige precisamente a los casos más difíciles."}}'),
('ipw_boost','tool','IPW Boost','Muestra qué ocurre al ponderar por propensity en el escenario sintético.',12,'epic',2,2,
 '{"r2":{"title":"IPW Boost","metrics":[["Diferencia cruda","−15 pp"],["Regresión ajustada","+4.8 pp"],["IPW","+5.1 pp"]],"text":"Métodos distintos convergen hacia un efecto positivo cuando corrigen el desequilibrio observado."}}'),
('counterfactual_practice','tool','Simulador contrafactual','Abre un perfil de práctica con dos futuros; nunca revela clientes reales de la ronda.',13,'epic',1,1,
 '{"r1":{"title":"Perfil de práctica","metrics":[["Con intervención","63%"],["Sin intervención","38%"],["Uplift","+25 pp"]],"text":"El contrafactual es el resultado que no observamos para la misma unidad en el mundo real."}}'),
('uplift_lens','tool','Uplift Lens','Compara propensity con efecto incremental por perfiles.',14,'epic',4,4,
 '{"r4":{"title":"Uplift Lens","metrics":[["Digital","+16 pp"],["Ingreso medio","+11 pp"],["Tradicional","+2 pp"],["Patrimonio","+1 pp"],["Mora alta","−5 pp"]],"text":"Alta propensity no implica alto efecto de tratamiento."}}'),
('junior_analyst','talent','Contratar Analista Junior','Ejecuta cálculos estructurados, tablas y chequeos básicos rápidamente.',6,'common',1,4,
 '{"r1":{"title":"Junior · ranking descriptivo","text":"Los clientes con score más alto dominan la conversión esperada; este cálculo no identifica impacto causal."},"r2":{"title":"Junior · tabla descriptiva","metrics":[["Llamados","20% pagan"],["No llamados","35% pagan"]],"text":"La diferencia cruda es −15 pp. Falta revisar comparabilidad."},"r3":{"title":"Junior · diferencia de medias","metrics":[["Tratamiento","31%"],["Control","25%"],["Diferencia","+6 pp"]],"text":"Cálculo correcto si la asignación permite interpretación causal."},"r4":{"title":"Junior · tabla CATE","text":"Ordena segmentos por efecto estimado; aún falta costo, riesgo y capacidad para decidir."}}'),
('senior_specialist','talent','Contratar Especialista Senior','Revisa supuestos, método e interpretación de la decisión.',15,'epic',1,4,
 '{"r1":{"title":"Senior Review","text":"No optimices propensity si la decisión requiere efecto incremental. Define tratamiento, outcome y contrafactual."},"r2":{"title":"Senior Review","text":"La comparación cruda no es defendible. Ajusta confusores pretratamiento y revisa overlap; no controles mediadores."},"r3":{"title":"Senior Review","text":"Randomiza entre elegibles, predefine outcome y horizonte, y reporta magnitud + incertidumbre."},"r4":{"title":"Senior Review","text":"Convierte CATE en política sólo después de incorporar capacidad, costo, riesgo y evidencia suficiente."}}'),
('expert_game','expert','Llamar Maestro de Juego','90 segundos para aclarar objetivo, reglas o interpretación de la misión.',12,'rare',1,4,
 '{"default":{"title":"Solicitud enviada","text":"Maestro de Juego solicitado. Prepárense para formular una sola pregunta en 90 segundos.","seconds":90,"master":"Game Master"}}'),
('expert_ml','expert','Llamar Maestro Experimentos & ML','90 segundos de revisión sobre predicción, experimentación o métricas.',18,'epic',1,4,
 '{"default":{"title":"Solicitud enviada","text":"Maestro de Experimentos & ML solicitado. Tendrán 90 segundos de revisión enfocada.","seconds":90,"master":"Experiment & ML Master"}}'),
('expert_policy','expert','Llamar Maestra Policy & Risk','90 segundos para discutir costo, capacidad, riesgo y decisión.',18,'epic',1,4,
 '{"default":{"title":"Solicitud enviada","text":"Maestra de Policy & Risk solicitada. Tendrán 90 segundos de revisión enfocada.","seconds":90,"master":"Policy & Risk Master"}}'),
('expert_causal','expert','Llamar Maestro Causal','90 segundos de revisión sobre DAG, confusión, identificación o supuestos.',20,'epic',2,4,
 '{"default":{"title":"Solicitud enviada","text":"Maestro Causal solicitado. Tendrán 90 segundos y una sola pregunta prioritaria.","seconds":90,"master":"Causal Master"}}'),
('expert_trainer','expert','Llamada especial al Experto Capacitador','Revisión profunda de 120 segundos: una observación y una pregunta socrática.',25,'legendary',2,4,
 '{"default":{"title":"Solicitud prioritaria","text":"Experto Capacitador solicitado. Tendrán 120 segundos: 1 observación + 1 pregunta socrática; no entregará la respuesta final.","seconds":120,"master":"Expert Trainer"}}')
on conflict(help_id) do update set category=excluded.category,title=excluded.title,description=excluded.description,cost=excluded.cost,rarity=excluded.rarity,min_round=excluded.min_round,max_round=excluded.max_round,role_code=excluded.role_code,result_template=excluded.result_template,active=true;

create or replace function public.cw_help_state(p_token text)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare p public.cw_players; g public.cw_games; catalog jsonb; purchases jsonb; cost_used int;
begin
  select * into p from public.cw_validate_player_token(p_token); if p.id is null then raise exception 'Sesión inválida'; end if;
  select * into g from public.cw_games where id=p.game_id;
  select coalesce(jsonb_agg(jsonb_build_object('id',h.help_id,'category',h.category,'title',h.title,'description',h.description,'cost',h.cost,'rarity',h.rarity,'role_code',h.role_code) order by h.cost,h.help_id),'[]'::jsonb)
    into catalog from public.cw_help_catalog h
    where h.active and g.current_round between h.min_round and h.max_round and (h.role_code is null or h.role_code=p.role_code);
  select coalesce(jsonb_agg(jsonb_build_object('id',x.id,'help_id',x.help_id,'cost',x.cost,'result',x.result,'created_at',x.created_at) order by x.created_at),'[]'::jsonb)
    into purchases from public.cw_help_purchases x where x.game_id=g.id and x.team_id=p.team_id and x.round_number=g.current_round;
  select help_cost into cost_used from public.cw_teams where id=p.team_id;
  return jsonb_build_object('round',g.current_round,'phase',g.status,'catalog',catalog,'purchases',purchases,'help_cost',coalesce(cost_used,0),'round_purchase_count',jsonb_array_length(purchases));
end $$;

create or replace function public.cw_buy_help(p_token text,p_help_id text)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare p public.cw_players; g public.cw_games; h public.cw_help_catalog; n int; rid uuid; out_json jsonb; round_key text;
begin
  select * into p from public.cw_validate_player_token(p_token); if p.id is null then raise exception 'Sesión inválida'; end if;
  select * into g from public.cw_games where id=p.game_id for update;
  if g.status<>'round' then raise exception 'Las ayudas sólo se compran durante el laboratorio'; end if;
  select * into h from public.cw_help_catalog where help_id=p_help_id and active and g.current_round between min_round and max_round and (role_code is null or role_code=p.role_code);
  if h.help_id is null then raise exception 'Ayuda no disponible en esta ronda'; end if;
  if exists(select 1 from public.cw_help_purchases where game_id=g.id and team_id=p.team_id and round_number=g.current_round and help_id=h.help_id) then raise exception 'El equipo ya compró esta ayuda en la ronda'; end if;
  select count(*) into n from public.cw_help_purchases where game_id=g.id and team_id=p.team_id and round_number=g.current_round;
  if n>=3 then raise exception 'Máximo 3 ayudas por equipo y ronda'; end if;
  round_key:='r'||g.current_round::text;
  out_json:=coalesce(h.result_template->round_key,h.result_template->'default',jsonb_build_object('title',h.title,'text',h.description));
  insert into public.cw_help_purchases(game_id,team_id,player_id,round_number,help_id,cost,result)
    values(g.id,p.team_id,p.id,g.current_round,h.help_id,h.cost,out_json) returning id into rid;
  update public.cw_teams set help_cost=help_cost+h.cost where id=p.team_id;
  insert into public.cw_events(game_id,actor,event_type,payload)
    values(g.id,p.id::text,case when h.category='expert' then 'expert_request' else 'help_purchased' end,
      jsonb_build_object('team_id',p.team_id,'round',g.current_round,'help_id',h.help_id,'title',h.title,'cost',h.cost,'role_code',p.role_code,'purchase_id',rid,'master',out_json->>'master','seconds',out_json->>'seconds'));
  return jsonb_build_object('ok',true,'purchase_id',rid,'help_id',h.help_id,'cost',h.cost,'result',out_json,
    'team_help_cost',(select help_cost from public.cw_teams where id=p.team_id));
end $$;

-- Player state: expose team help penalty only; actual help results live behind cw_help_state.
create or replace function public.cw_game_state(p_token text)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare p public.cw_players; g public.cw_games; card text; teams_json jsonb; locked boolean:=false; d jsonb; result_json jsonb; customers jsonb; reveal_payload jsonb; segments_json jsonb;
begin
  select * into p from public.cw_validate_player_token(p_token); if p.id is null then raise exception 'Sesión inválida o expirada'; end if;
  perform public.cw_auto_close_round(p.game_id); update public.cw_players set last_seen_at=now() where id=p.id;
  select * into g from public.cw_games where id=p.game_id;
  select content into card from public.cw_role_cards where round_number=g.current_round and role_code=p.role_code;
  select jsonb_agg(jsonb_build_object('id',t.id,'name',t.name,'help_cost',t.help_cost,'score',jsonb_build_object('impact',t.score_impact,'evidence',t.score_evidence,'design',t.score_design,'risk',t.score_risk,'adaptation',t.score_adaptation),'locked',exists(select 1 from public.cw_decisions x where x.team_id=t.id and x.round_number=g.current_round))) into teams_json from public.cw_teams t where t.game_id=g.id;
  select payload,result,true into d,result_json,locked from public.cw_decisions where game_id=g.id and team_id=p.team_id and round_number=g.current_round;
  if g.current_round=1 then
    select public.cw_public_customers() into customers;
    if g.status in ('reveal','teaching','microcheck','finished') and d is not null then
      select jsonb_agg(jsonb_build_object('id',c.customer_id,'name',c.name,'segment',c.segment,'score',c.predictive_score,'p0',c.p0,'p1',c.p1,'effect',c.p1-c.p0) order by c.predictive_score desc)
      into reveal_payload from public.cw_ground_truth_customers c where c.customer_id in (select jsonb_array_elements_text(d->'selected'));
    end if;
  end if;
  if g.current_round=4 then select jsonb_agg(jsonb_build_object('id',segment_id,'name',name,'effect',effect_pp,'risk',risk) order by effect_pp desc) into segments_json from public.cw_ground_truth_segments; end if;
  return jsonb_build_object('server_time',now(),'game',jsonb_build_object('id',g.id,'code',g.code,'title',g.title,'phase',g.status,'round',g.current_round,'closes_at',g.closes_at,'public_message',g.public_message),'player',jsonb_build_object('id',p.id,'team_id',p.team_id,'display_name',p.display_name,'role_code',p.role_code),'role_card',card,'teams',coalesce(teams_json,'[]'::jsonb),'decision',d,'result',result_json,'locked',locked,'customers',customers,'reveal_payload',reveal_payload,'segments',segments_json);
end $$;

create or replace function public.cw_facilitator_state(p_token text)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare gid uuid; g public.cw_games; teams_json jsonb; events_json jsonb; rank_mode text; total_players int; humans int; bots int;
begin
  gid:=public.cw_validate_facilitator_token(p_token); if gid is null then raise exception 'Sesión inválida'; end if;
  perform public.cw_auto_close_round(gid); select * into g from public.cw_games where id=gid;
  select count(*),count(*) filter(where not is_bot),count(*) filter(where is_bot) into total_players,humans,bots from public.cw_players where game_id=gid and active;
  rank_mode:=case when g.current_round=1 and g.status='closed' then 'observed' else 'causal' end;
  select jsonb_agg(jsonb_build_object('id',t.id,'name',t.name,'help_cost',t.help_cost,
    'online',(select count(*) from public.cw_players p where p.team_id=t.id and p.active and not p.is_bot and p.last_seen_at>now()-interval '90 seconds'),
    'humans',(select count(*) from public.cw_players p where p.team_id=t.id and p.active and not p.is_bot),
    'bots',(select count(*) from public.cw_players p where p.team_id=t.id and p.active and p.is_bot),
    'locked',exists(select 1 from public.cw_decisions d where d.team_id=t.id and d.round_number=g.current_round),
    'observed_conversion',case when g.current_round=1 and g.status in ('closed','reveal','teaching','microcheck','finished') then (select round(100*avg(c.p1),1) from public.cw_decisions d cross join lateral jsonb_array_elements_text(d.payload->'selected') s(customer_id) join public.cw_ground_truth_customers c on c.customer_id=s.customer_id where d.team_id=t.id and d.round_number=1) end,
    'score',jsonb_build_object('impact',t.score_impact,'evidence',t.score_evidence,'design',t.score_design,'risk',t.score_risk,'adaptation',t.score_adaptation),
    'check_correct',(select count(*) from public.cw_microchecks m join public.cw_players p on p.id=m.player_id where p.team_id=t.id and m.round_number=g.current_round and m.correct))) into teams_json from public.cw_teams t where t.game_id=gid;
  select coalesce(jsonb_agg(jsonb_build_object('at',created_at,'type',event_type,'message',payload) order by created_at desc),'[]'::jsonb) into events_json from (select * from public.cw_events where game_id=gid order by created_at desc limit 80) e;
  return jsonb_build_object('server_time',now(),'game',jsonb_build_object('id',g.id,'code',g.code,'phase',g.status,'round',g.current_round,'closes_at',g.closes_at,'paused_remaining_seconds',g.paused_remaining_seconds,'public_message',g.public_message,'rank_mode',rank_mode,'player_count',total_players,'human_count',humans,'bot_count',bots),'teams',coalesce(teams_json,'[]'::jsonb),'audit',events_json);
end $$;

create or replace function public.cw_wall_state(p_code text)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare g public.cw_games; teams_json jsonb; rank_mode text;
begin
  select * into g from public.cw_games where code=upper(trim(p_code)); if g.id is null then raise exception 'Partida no encontrada'; end if;
  perform public.cw_auto_close_round(g.id); select * into g from public.cw_games where id=g.id;
  rank_mode:=case when g.current_round=1 and g.status='closed' then 'observed' else 'causal' end;
  select jsonb_agg(jsonb_build_object('id',t.id,'name',t.name,'help_cost',t.help_cost,'observed_conversion',case when g.current_round=1 and g.status in ('closed','reveal','teaching','microcheck','finished') then (select round(100*avg(c.p1),1) from public.cw_decisions d cross join lateral jsonb_array_elements_text(d.payload->'selected') s(customer_id) join public.cw_ground_truth_customers c on c.customer_id=s.customer_id where d.team_id=t.id and d.round_number=1) end,'score',jsonb_build_object('impact',t.score_impact,'evidence',t.score_evidence,'design',t.score_design,'risk',t.score_risk,'adaptation',t.score_adaptation))) into teams_json from public.cw_teams t where t.game_id=g.id;
  return jsonb_build_object('server_time',now(),'game',jsonb_build_object('code',g.code,'phase',g.status,'round',g.current_round,'closes_at',g.closes_at,'public_message',g.public_message,'rank_mode',rank_mode),'teams',coalesce(teams_json,'[]'::jsonb));
end $$;

create or replace function public.cw_help_reset_trigger()
returns trigger language plpgsql set search_path=public as $$
begin
  if new.status='lobby' and old.status is distinct from 'lobby' then
    delete from public.cw_help_purchases where game_id=new.id;
    update public.cw_teams set help_cost=0 where game_id=new.id;
  end if;
  return new;
end $$;
drop trigger if exists cw_game_reset_help on public.cw_games;
create trigger cw_game_reset_help after update of status on public.cw_games for each row execute function public.cw_help_reset_trigger();

revoke all on table public.cw_help_catalog,public.cw_help_purchases from public,anon,authenticated;
revoke all on function public.cw_help_state(text) from public,anon,authenticated;
revoke all on function public.cw_buy_help(text,text) from public,anon,authenticated;
grant execute on function public.cw_help_state(text) to service_role;
grant execute on function public.cw_buy_help(text,text) to service_role;
grant execute on function public.cw_game_state(text) to service_role;
grant execute on function public.cw_facilitator_state(text) to service_role;
grant execute on function public.cw_wall_state(text) to service_role;
