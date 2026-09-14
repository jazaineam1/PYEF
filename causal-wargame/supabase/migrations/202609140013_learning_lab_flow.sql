alter table public.cw_games drop constraint if exists cw_games_status_check;
alter table public.cw_games add constraint cw_games_status_check check (status in ('lobby','briefing','lesson','round','closed','reveal','teaching','microcheck','paused','finished'));

insert into public.cw_role_cards(round_number,role_code,content) values
(1,'business','La decisión no es “quién convertirá”, sino qué intervención vale la pena aplicar con presupuesto limitado.'),
(1,'data','ORÁCULO estima P(Y|X). Un score alto no contiene por sí solo información sobre Y(1)-Y(0).'),
(1,'context','Para hablar de efecto necesitaríamos una comparación que aproxime qué habría ocurrido sin intervención.'),
(1,'integrator','Un buen diseño debe definir tratamiento, control, outcome y horizonte antes de mirar resultados.'),
(1,'risk','Intervenir a quien iba a convertir igual consume capacidad; una intervención también puede tener efecto negativo.'),
(2,'business','Cancelar una estrategia por 20% vs 35% sólo sería defendible si los grupos fueran comparables desde antes.'),
(2,'data','La mora previa promedio de los llamados es aproximadamente el doble de la de los no llamados.'),
(2,'context','Mora previa ocurre antes, aumenta la probabilidad de llamada y reduce la probabilidad de pago.'),
(2,'integrator','Con confusores observados puedes pensar en regresión ajustada, matching o IPW; ninguna técnica arregla confusión no medida por arte de magia.'),
(2,'risk','Por política, clientes con más de 90 días de mora casi siempre reciben llamada; eso rompe la comparabilidad cruda.'),
(3,'business','El outcome útil es pago a 30 días; un clic inmediato es un proxy insuficiente para esta decisión.'),
(3,'data','Elegir sólo scores altos vuelve a concentrar perfiles diferentes en tratamiento. AUC no sustituye asignación causal.'),
(3,'context','Si el criterio de asignación depende de riesgo previo, tratamiento y control parten de distribuciones diferentes.'),
(3,'integrator','Randomizar entre elegibles permite estimar una diferencia de medias como ATE y cuantificar incertidumbre.'),
(3,'risk','Conserva un grupo control y un horizonte suficiente para detectar daño; no optimices sólo una métrica temprana.'),
(4,'business','Con capacidad limitada, prioriza valor incremental esperado y no la probabilidad base más alta.'),
(4,'data','Jóvenes digitales e Ingreso medio muestran los mayores efectos; Patrimonio alto puede tener alta propensión pero poco uplift.'),
(4,'context','Un CATE sólo merece interpretación causal si la comparación que identifica el efecto es defendible.'),
(4,'integrator','Resume ATE, CATE e incertidumbre; causal forests y meta-learners ayudan con heterogeneidad, no sustituyen identificación.'),
(4,'risk','Mora alta tiene efecto negativo en el simulador: una política que trate a todos puede destruir valor.')
on conflict (round_number,role_code) do update set content=excluded.content;

create or replace function public.cw_facilitator_transition(p_token text,p_action text,p_seconds int default 60)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare gid uuid; g public.cw_games; remaining int; human_count int; bot_result jsonb; bot_decisions int;
begin
  gid:=public.cw_validate_facilitator_token(p_token); if gid is null then raise exception 'Sesión de facilitador inválida'; end if;
  perform public.cw_auto_close_round(gid);
  select * into g from public.cw_games where id=gid for update;
  if p_action='seed_bots' then
    bot_result:=public.cw_seed_rehearsal_bots(gid); return bot_result;
  elsif p_action='bot_decisions' then
    if g.status<>'round' then raise exception 'Los bots sólo pueden decidir durante una ronda abierta'; end if;
    bot_decisions:=public.cw_generate_bot_decisions(gid,g.current_round); return jsonb_build_object('ok',true,'bot_decisions',bot_decisions);
  elsif p_action='lesson' then
    select count(*) into human_count from public.cw_players where game_id=gid and active and not is_bot;
    if human_count=0 then raise exception 'No hay participantes humanos'; end if;
    if g.status not in ('lobby','briefing') then raise exception 'La mini-clase sólo puede comenzar desde briefing/lobby'; end if;
    update public.cw_games set status='lesson',started_at=null,closes_at=null,paused_remaining_seconds=null,public_message='Mini-clase de la ronda '||current_round||' · escucha al capacitador' where id=gid;
  elsif p_action='open' then
    select count(*) into human_count from public.cw_players where game_id=gid and active and not is_bot;
    if human_count=0 then raise exception 'No hay participantes humanos'; end if;
    if g.status<>'lesson' then raise exception 'Primero debes presentar el concepto de la ronda'; end if;
    update public.cw_games set status='round',started_at=now(),closes_at=now()+make_interval(secs=>duration_seconds),paused_remaining_seconds=null,public_message='Laboratorio de la ronda '||current_round||' abierto · trabajen por roles' where id=gid;
    perform public.cw_generate_bot_decisions(gid,g.current_round);
  elsif p_action='close' then
    if g.status not in ('round','paused') then raise exception 'La ronda no está abierta'; end if;
    update public.cw_games set status='closed',closes_at=now(),paused_remaining_seconds=null,public_message='Decisiones cerradas · regresen a sala principal' where id=gid;
  elsif p_action='reveal' then
    if g.status<>'closed' then raise exception 'Primero debes cerrar la ronda'; end if;
    perform public.cw_score_round(gid,g.current_round);
    update public.cw_games set status='reveal',public_message=case when current_round=1 then 'VER EL OTRO FUTURO' else 'Reveal ronda '||current_round end where id=gid;
  elsif p_action='teach' then
    if g.status<>'reveal' then raise exception 'Primero muestra el reveal'; end if;
    update public.cw_games set status='teaching',public_message='Debrief · conecta lo ocurrido con el concepto formal' where id=gid;
  elsif p_action='microcheck' then
    if g.status<>'teaching' then raise exception 'Primero realiza el debrief'; end if;
    update public.cw_games set status='microcheck',public_message='Microcheck individual · no da puntos al equipo' where id=gid;
  elsif p_action='next' then
    if g.status not in ('microcheck','teaching','reveal') then raise exception 'Completa reveal/debrief antes de continuar'; end if;
    if g.current_round>=4 then update public.cw_games set status='finished',closes_at=null,paused_remaining_seconds=null,public_message='Partida finalizada' where id=gid;
    else update public.cw_games set current_round=current_round+1,status='briefing',started_at=null,closes_at=null,paused_remaining_seconds=null,public_message='Ronda '||(current_round+1)||' lista para mini-clase' where id=gid; end if;
  elsif p_action='pause' then
    if g.status<>'round' then raise exception 'Sólo puedes pausar un laboratorio abierto'; end if;
    remaining:=greatest(0,ceil(extract(epoch from (g.closes_at-now())))::int);
    update public.cw_games set status='paused',paused_remaining_seconds=remaining,closes_at=null,public_message='Laboratorio pausado' where id=gid;
  elsif p_action='resume' then
    if g.status<>'paused' then raise exception 'La partida no está pausada'; end if;
    remaining:=greatest(1,coalesce(g.paused_remaining_seconds,g.duration_seconds));
    update public.cw_games set status='round',closes_at=now()+make_interval(secs=>remaining),paused_remaining_seconds=null,public_message='Laboratorio reanudado' where id=gid;
  elsif p_action='add_time' then
    if g.status='paused' then update public.cw_games set paused_remaining_seconds=greatest(1,coalesce(paused_remaining_seconds,duration_seconds))+greatest(1,p_seconds) where id=gid;
    elsif g.status='round' then update public.cw_games set closes_at=greatest(coalesce(closes_at,now()),now())+make_interval(secs=>greatest(1,p_seconds)) where id=gid;
    else raise exception 'Sólo puedes añadir tiempo al laboratorio'; end if;
  elsif p_action='reset' then
    delete from public.cw_microchecks where game_id=gid;
    delete from public.cw_decisions where game_id=gid;
    delete from public.cw_player_sessions where player_id in (select id from public.cw_players where game_id=gid);
    delete from public.cw_players where game_id=gid;
    update public.cw_teams set score_impact=0,score_evidence=0,score_design=0,score_risk=0,score_adaptation=0 where game_id=gid;
    update public.cw_games set status='lobby',current_round=1,started_at=null,closes_at=null,paused_remaining_seconds=null,public_message='Esperando participantes · nueva sesión' where id=gid;
  else raise exception 'Acción no soportada'; end if;
  insert into public.cw_events(game_id,actor,event_type,payload) values(gid,'facilitator','transition',jsonb_build_object('action',p_action,'round',g.current_round));
  return jsonb_build_object('ok',true);
end $$;
