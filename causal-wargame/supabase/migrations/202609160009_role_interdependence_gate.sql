-- Make role interdependence a server rule, not just UI copy.
-- New four-role sessions: only Decision+Policy can lock, and only after 4/4 effective evidence.
-- Historical sessions that still have an active `risk` participant retain legacy behavior.

-- The human expert mechanic is paused. Keep its rows for reversibility, but do not expose/purchase it.
update public.cw_help_catalog
set active=false
where category='expert' or help_id='expert_trainer';

-- Round-specific private information: every role receives a genuinely different piece.
insert into public.cw_role_cards(round_number,role_code,content) values
(1,'business','PRIVADO · Sólo hay capacidad para 10 llamadas. El objetivo de negocio no es encontrar quién pagará, sino generar pagos que no ocurrirían sin la llamada. Pregunta al equipo qué evidencia permite distinguir ambos casos.'),
(1,'data','PRIVADO · ORÁCULO predice P(pago|X). No fue entrenado para estimar el efecto de llamar. Un score alto puede ser alguien que pagaría igual sin intervención.'),
(1,'context','PRIVADO · Para cada cliente sólo observaremos uno de dos futuros. Sin una comparación creíble no sabemos qué habría ocurrido con esa misma persona sin llamada.'),
(1,'integrator','PRIVADO · En esta ronda no existe todavía un experimento que forme grupos comparables. Seleccionar por score puede servir para priorizar, pero no valida causalidad.'),
(2,'business','PRIVADO · Dirección ve 20% de pago en llamados y 35% en no llamados y propone cancelar. Tu decisión es si esa comparación basta para actuar o si debe rediseñarse.'),
(2,'data','PRIVADO · Comparación cruda: −12 pp. Ajuste por variables previas: +3.9 pp. IPW: +4.2 pp. En mora alta, 97% recibió llamada y sólo 3% quedó sin llamada.'),
(2,'context','PRIVADO · Mora previa ocurre antes, aumenta la probabilidad de llamada y reduce la probabilidad de pago: Llamada ← Mora previa → Pago.'),
(2,'integrator','PRIVADO · Los datos son observacionales. Regresión, matching o IPW pueden ayudar con confusión observada, pero no reparan confusión no medida ni falta extrema de soporte.'),
(3,'business','PRIVADO · Para el negocio importa pago a 30 días. Un efecto menor a aproximadamente +2 pp no cubre el costo operativo. Un clic inmediato no basta para decidir.'),
(3,'data','PRIVADO · Asignar sólo a scores altos concentra perfiles de riesgo distintos en tratamiento y control. AUC alta no corrige ese sesgo de selección.'),
(3,'context','PRIVADO · Si la asignación depende de riesgo previo, tratamiento y control parten de causas distintas del outcome. También debes preguntar si una unidad puede afectar el outcome de otra.'),
(3,'integrator','PRIVADO · Randomizar entre elegibles permite estimar ATE. Aumentar N mejora precisión, no corrige una asignación sesgada. Outcome y horizonte deben fijarse antes de mirar resultados.'),
(4,'business','PRIVADO · Capacidad total: 15.000 clientes. La política debe maximizar valor incremental sin tratar segmentos con daño plausible ni ignorar costo e incertidumbre.'),
(4,'data','PRIVADO · Los estimadores muestran heterogeneidad. Además, un outcome medido antes de la campaña arroja un supuesto efecto de +4.7 pp con el mismo pipeline: es un placebo que la campaña no puede causar.'),
(4,'context','PRIVADO · Un CATE sólo merece interpretación causal si la estrategia de identificación sigue siendo defendible. Mediadores, colliders o confusión residual pueden contaminar la heterogeneidad.'),
(4,'integrator','PRIVADO · La política debe leer CATE junto con IC y precisión. Un segmento cuyo IC cruza 0 no tiene el mismo respaldo que uno claramente positivo; no conviertas una estimación puntual en regla automática.')
on conflict(round_number,role_code) do update set content=excluded.content;

create or replace function public.cw_submit_decision(p_token text,p_round int,p_payload jsonb,p_idempotency text)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare
  p public.cw_players; g public.cw_games; did uuid; existing_key text;
  n_total int; n_distinct int; n_valid int; treated_audience int; capacity_limit int:=15000;
  legacy_topology boolean:=false; evidence_coverage int:=0;
begin
  select * into p from public.cw_validate_player_token(p_token);
  if p.id is null then raise exception 'Sesión inválida'; end if;
  select * into g from public.cw_games where id=p.game_id;
  if g.status<>'round' or g.current_round<>p_round then raise exception 'La ronda no está abierta'; end if;

  select exists(
    select 1 from public.cw_players lp
    where lp.game_id=g.id and lp.active and lp.role_code='risk'
  ) into legacy_topology;

  if not legacy_topology then
    if p.role_code<>'business' then
      raise exception 'Sólo Líder de Decisión y Política puede bloquear la decisión final. Comparte tu evidencia en la Mesa.';
    end if;

    select count(*) into evidence_coverage from (
      select distinct c.role_code as role_code
      from public.cw_role_contributions c
      where c.game_id=g.id and c.team_id=p.team_id and c.round_number=p_round
        and c.role_code in ('business','data','context','integrator')
      union
      select 'integrator'
      where exists(
        select 1 from public.cw_role_contributions c
        where c.game_id=g.id and c.team_id=p.team_id and c.round_number=p_round
          and c.role_code='data'
          and jsonb_typeof(c.evidence#>'{details,coverage,integrator}')='object'
      )
    ) effective_roles;

    if evidence_coverage<4 then
      raise exception 'La decisión requiere 4/4 evidencias en la Mesa. Ahora hay %/4; faltan aportes de especialistas.',evidence_coverage;
    end if;
  end if;

  if p_round=1 then
    if jsonb_array_length(coalesce(p_payload->'selected','[]'::jsonb))<>10 then raise exception 'Debes seleccionar exactamente 10 clientes'; end if;
  elsif p_round=2 then
    if coalesce(p_payload->>'recommendation','') not in ('cancel','keep','redesign') then raise exception 'Recomendación inválida'; end if;
    if coalesce(p_payload->>'confounder','') not in ('edad','mora_previa','nombre') then raise exception 'Variable inválida'; end if;
    if coalesce(p_payload->>'reason_code','') not in ('baseline_difference','model_quality','sample_size','outcome_timing') then raise exception 'Razón inválida'; end if;
  elsif p_round=3 then
    if coalesce(p_payload->>'assignment','') not in ('advisor','model','random') then raise exception 'Asignación inválida'; end if;
    if coalesce(p_payload->>'outcome','') not in ('pago_30d','click') then raise exception 'Debes elegir el resultado'; end if;
    if coalesce(nullif(p_payload->>'horizon','')::int,0) not in (1,30,90) then raise exception 'Debes elegir el horizonte'; end if;
  elsif p_round=4 then
    select count(*),count(distinct v),count(*) filter(where v in ('digital','middle','traditional','wealth','arrears'))
      into n_total,n_distinct,n_valid
    from (
      select jsonb_array_elements_text(coalesce(p_payload->'treat','[]'::jsonb)) v
      union all select jsonb_array_elements_text(coalesce(p_payload->'avoid','[]'::jsonb)) v
      union all select jsonb_array_elements_text(coalesce(p_payload->'observe','[]'::jsonb)) v
    ) x;
    if n_total<>5 or n_distinct<>5 or n_valid<>5 then raise exception 'Debes clasificar exactamente una vez los 5 segmentos'; end if;
    select coalesce(sum(audience),0)::int into treated_audience from public.cw_ground_truth_segments where segment_id in (select jsonb_array_elements_text(coalesce(p_payload->'treat','[]'::jsonb)));
    select coalesce((value->>'capacity')::int,15000) into capacity_limit from public.cw_scenario_parameters where key='round4_policy';
    if treated_audience>capacity_limit then raise exception 'La política supera la capacidad disponible de % clientes',capacity_limit; end if;
  end if;

  select id,idempotency_key into did,existing_key from public.cw_decisions where game_id=g.id and round_number=p_round and team_id=p.team_id;
  if did is not null then
    if existing_key=p_idempotency then return jsonb_build_object('ok',true,'decision_id',did,'idempotent',true); end if;
    raise exception 'La decisión del equipo ya fue bloqueada y no puede modificarse';
  end if;

  insert into public.cw_decisions(game_id,round_number,team_id,submitted_by,payload,idempotency_key)
  values(g.id,p_round,p.team_id,p.id,p_payload,p_idempotency) returning id into did;
  insert into public.cw_events(game_id,actor,event_type,payload)
  values(g.id,p.id::text,'decision_locked',jsonb_build_object('round',p_round,'team_id',p.team_id,'evidence_coverage',evidence_coverage,'decision_owner',p.role_code));
  return jsonb_build_object('ok',true,'decision_id',did,'idempotent',false,'evidence_coverage',case when legacy_topology then null else evidence_coverage end);
end $$;

revoke all on function public.cw_submit_decision(text,int,jsonb,text) from public,anon,authenticated;
grant execute on function public.cw_submit_decision(text,int,jsonb,text) to service_role;
