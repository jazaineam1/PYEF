-- Strict lock semantics: same idempotency key may retry; a different second decision is rejected.
create or replace function public.cw_submit_decision(p_token text,p_round int,p_payload jsonb,p_idempotency text)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare
  p public.cw_players;
  g public.cw_games;
  did uuid;
  existing_key text;
  n_total int;
  n_distinct int;
  n_valid int;
begin
  select * into p from public.cw_validate_player_token(p_token);
  if p.id is null then raise exception 'Sesión inválida'; end if;
  select * into g from public.cw_games where id=p.game_id;
  if g.status<>'round' or g.current_round<>p_round then raise exception 'La ronda no está abierta'; end if;

  if p_round=1 then
    if jsonb_array_length(coalesce(p_payload->'selected','[]'::jsonb))<>10 then raise exception 'Debes seleccionar exactamente 10 clientes'; end if;
  elsif p_round=2 then
    if coalesce(p_payload->>'recommendation','') not in ('cancel','keep','redesign') then raise exception 'Recomendación inválida'; end if;
    if coalesce(p_payload->>'confounder','') not in ('edad','mora_previa','nombre') then raise exception 'Variable inválida'; end if;
    if coalesce(p_payload->>'reason_code','') not in ('baseline_difference','model_quality','sample_size','outcome_timing') then raise exception 'Razón inválida'; end if;
  elsif p_round=3 then
    if coalesce(p_payload->>'assignment','') not in ('advisor','model','random') then raise exception 'Asignación inválida'; end if;
    if coalesce(p_payload->>'outcome','') not in ('pago_30d','click') then raise exception 'Outcome inválido'; end if;
    if coalesce((p_payload->>'horizon')::int,0) not in (1,30,90) then raise exception 'Horizonte inválido'; end if;
  elsif p_round=4 then
    select count(*),count(distinct v),count(*) filter(where v in ('digital','middle','traditional','wealth','arrears'))
      into n_total,n_distinct,n_valid
    from (
      select jsonb_array_elements_text(coalesce(p_payload->'treat','[]'::jsonb)) v
      union all
      select jsonb_array_elements_text(coalesce(p_payload->'avoid','[]'::jsonb)) v
      union all
      select jsonb_array_elements_text(coalesce(p_payload->'observe','[]'::jsonb)) v
    ) x;
    if n_total<>5 or n_distinct<>5 or n_valid<>5 then raise exception 'Debes clasificar exactamente una vez los 5 segmentos'; end if;
  end if;

  select id,idempotency_key into did,existing_key
  from public.cw_decisions
  where game_id=g.id and round_number=p_round and team_id=p.team_id;

  if did is not null then
    if existing_key=p_idempotency then
      return jsonb_build_object('ok',true,'decision_id',did,'idempotent',true);
    end if;
    raise exception 'La decisión del equipo ya fue bloqueada y no puede modificarse';
  end if;

  insert into public.cw_decisions(game_id,round_number,team_id,submitted_by,payload,idempotency_key)
  values(g.id,p_round,p.team_id,p.id,p_payload,p_idempotency)
  returning id into did;

  insert into public.cw_events(game_id,actor,event_type,payload)
  values(g.id,p.id::text,'decision_locked',jsonb_build_object('round',p_round,'team_id',p.team_id));
  return jsonb_build_object('ok',true,'decision_id',did,'idempotent',false);
end $$;

grant execute on function public.cw_submit_decision(text,int,jsonb,text) to service_role;
