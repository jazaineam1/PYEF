-- Additive, V2-only causal learning arc. No V1 tables or historical Dean tournament rows are rewritten.
-- Initial intuition is never scored; learning points are awarded only after teacher-led debrief.
create table if not exists public.cw_dean_learning_stages (
 game_id uuid not null references public.cw_dean_tournaments(game_id) on delete cascade,
 phase text not null check(phase in ('lobby','exams','rector','survey','causal')),
 step text not null default 'challenge' check(step in ('challenge','evidence','debrief')),
 paused boolean not null default false,
 updated_at timestamptz not null default clock_timestamp(),
 primary key(game_id,phase)
);
create table if not exists public.cw_dean_learning_choices (
 game_id uuid not null references public.cw_dean_tournaments(game_id) on delete cascade,
 player_id uuid not null references public.cw_dean_players(id) on delete cascade,
 phase text not null check(phase in ('lobby','exams','rector','survey','causal')),
 kind text not null check(kind in ('initial','revision')),
 choice text not null check(choice in ('a','b','c')),
 submitted_at timestamptz not null default clock_timestamp(),
 primary key (player_id, phase, kind)
);
create index if not exists cw_dean_learning_room on public.cw_dean_learning_choices(game_id,phase,kind);
alter table public.cw_dean_learning_stages enable row level security;
alter table public.cw_dean_learning_choices enable row level security;
revoke all on public.cw_dean_learning_stages, public.cw_dean_learning_choices from public,anon,authenticated;
grant select,insert,update,delete on public.cw_dean_learning_stages, public.cw_dean_learning_choices to service_role;

-- Scoring rubric is server-only. Never bundle the solution in player JavaScript.
create or replace function public.cw_dean_learning_key(p_phase text)
returns text language sql immutable security invoker set search_path=public as $f$
 select case p_phase
  when 'lobby' then 'b'    -- prediction is not individual treatment effect
  when 'exams' then 'b'    -- notes cannot identify a population intervention
  when 'rector' then 'c'   -- R2/MAE are predictive, not causal
  when 'survey' then 'b'   -- pre-treatment adjustment, not post-treatment mediator
  when 'causal' then 'c'   -- A/B evidence, uncertainty and heterogeneity govern policy
  else null end
$f$;
create or replace function public.cw_dean_learning_weight(p_phase text)
returns integer language sql immutable security invoker set search_path=public as $f$
 select case p_phase
  when 'lobby' then 0 when 'exams' then 10 when 'rector' then 25
  when 'survey' then 30 when 'causal' then 35 else 0 end
$f$;

-- Snapshot is safe for publicly projected Wall: only aggregated counts/scores, never tokens,
-- private initial choices or correct answers until teacher has finalized the debrief.
create or replace function public.cw_dean_learning_state(p_code text,p_hash text default null)
returns jsonb language plpgsql security invoker set search_path=public as $f$
declare gid uuid; current_phase text; current_step text; stopped boolean;
 result jsonb; own jsonb:=null; own_pid uuid; correct text; cohorts jsonb; room_scores jsonb;
begin
 select g.id,t.phase into gid,current_phase
 from public.cw_games g join public.cw_dean_tournaments t on t.game_id=g.id
 where g.code=upper(btrim(p_code));
 if gid is null then return jsonb_build_object('available',false); end if;
 if current_phase not in ('lobby','exams','rector','survey','causal','final','finished') then
  return jsonb_build_object('available',false); end if;
 if current_phase in ('lobby','exams','rector','survey','causal') then
  insert into public.cw_dean_learning_stages(game_id,phase)
  values(gid,current_phase) on conflict do nothing;
  select step,paused into current_step,stopped from public.cw_dean_learning_stages
  where game_id=gid and phase=current_phase;
 else current_step:='debrief';stopped:=false; end if;
 if p_hash is not null then
  select id into own_pid from public.cw_dean_players where game_id=gid and token_hash=p_hash;
  if own_pid is null then raise exception 'Credencial de estudiante inválida'; end if;
  select jsonb_build_object(
   'initial',(select choice from public.cw_dean_learning_choices
             where player_id=own_pid and phase=current_phase and kind='initial'),
   'revision',(select choice from public.cw_dean_learning_choices
             where player_id=own_pid and phase=current_phase and kind='revision')
  ) into own;
 end if;
 select coalesce(jsonb_agg(to_jsonb(z) order by z.room_no),'[]'::jsonb) into room_scores
 from (
   select r.room_no,
    count(distinct p.id)::int participants,
    coalesce(sum(
      case when d.step='debrief' and c.choice=public.cw_dean_learning_key(c.phase)
       then public.cw_dean_learning_weight(c.phase) else 0 end
    ),0)::int learning_points
   from generate_series(1,5) r(room_no)
   left join public.cw_dean_players p on p.game_id=gid and p.room_no=r.room_no
   left join public.cw_dean_learning_choices c on c.player_id=p.id and c.kind='revision'
   left join public.cw_dean_learning_stages d on d.game_id=gid and d.phase=c.phase
   group by r.room_no
 ) z;
 select jsonb_build_object(
    'initial',count(*) filter(where kind='initial'),
    'revision',count(*) filter(where kind='revision')
  ) into cohorts from public.cw_dean_learning_choices where game_id=gid and phase=current_phase;
 correct:=case when current_step='debrief' then public.cw_dean_learning_key(current_phase) else null end;
 result:=jsonb_build_object('available',true,'phase',current_phase,
  'step',current_step,'paused',coalesce(stopped,false),'counts',cohorts,
  'rooms',room_scores,'mine',own,'correct',correct,
  'registered',(select count(*) from public.cw_dean_players where game_id=gid),
  'server_now',clock_timestamp());
 return result;
end $f$;

-- Idempotent receipts. A reconnect cannot rewrite a first decision or award extra points.
create or replace function public.cw_dean_learning_submit(
 p_hash text,p_phase text,p_kind text,p_choice text)
returns jsonb language plpgsql security invoker set search_path=public as $f$
declare p public.cw_dean_players; actual_phase text; stage_step text; stopped boolean;
 inserted int:=0; saved_choice text;
begin
 select * into p from public.cw_dean_players where token_hash=p_hash for update;
 if p.id is null then raise exception 'Sesión estudiantil inválida';end if;
 select phase into actual_phase from public.cw_dean_tournaments where game_id=p.game_id;
 if actual_phase is distinct from p_phase then raise exception 'Este desafío ya no está activo';end if;
 if p_phase not in ('lobby','exams','rector','survey','causal')
 or p_kind not in ('initial','revision') or p_choice not in ('a','b','c') then
   raise exception 'Decisión no válida';end if;
 insert into public.cw_dean_learning_stages(game_id,phase) values(p.game_id,p_phase) on conflict do nothing;
 select step,paused into stage_step,stopped from public.cw_dean_learning_stages
 where game_id=p.game_id and phase=p_phase for update;
 if stopped then raise exception 'La actividad está pausada por el capacitador';end if;
 select choice into saved_choice from public.cw_dean_learning_choices
 where player_id=p.id and phase=p_phase and kind=p_kind;
 if saved_choice is not null then
  return jsonb_build_object('accepted',true,'already_submitted',true,'choice',saved_choice);end if;
 if (p_kind='initial' and stage_step<>'challenge')
 or (p_kind='revision' and stage_step<>'evidence') then
  raise exception 'La votación no está abierta en esta etapa';end if;
 if p_kind='revision' and not exists(
   select 1 from public.cw_dean_learning_choices
   where player_id=p.id and phase=p_phase and kind='initial'
 ) then raise exception 'Completa primero tu decisión inicial';end if;
 insert into public.cw_dean_learning_choices(game_id,player_id,phase,kind,choice)
 values(p.game_id,p.id,p_phase,p_kind,p_choice) on conflict do nothing;
 get diagnostics inserted=row_count;
 return jsonb_build_object('accepted',inserted=1,'already_submitted',inserted=0,'choice',p_choice);
end $f$;

create or replace function public.cw_dean_learning_teacher(p_token text,p_action text)
returns jsonb language plpgsql security invoker set search_path=public as $f$
declare gid uuid; code text; active_phase text; current_step text; paused_now boolean;
begin
 select public.cw_validate_facilitator_token(p_token) into gid;
 if gid is null then raise exception 'Credencial docente inválida'; end if;
 select g.code,t.phase into code,active_phase from public.cw_games g
 join public.cw_dean_tournaments t on t.game_id=g.id where g.id=gid;
 if active_phase not in ('lobby','exams','rector','survey','causal') then
  raise exception 'El desafío pedagógico no está activo';end if;
 insert into public.cw_dean_learning_stages(game_id,phase)
 values(gid,active_phase) on conflict do nothing;
 select step,paused into current_step,paused_now from public.cw_dean_learning_stages
 where game_id=gid and phase=active_phase for update;
 if p_action='pause' and not paused_now then
  update public.cw_dean_learning_stages set paused=true,updated_at=clock_timestamp()
  where game_id=gid and phase=active_phase;
 elsif p_action='resume' and paused_now then
  update public.cw_dean_learning_stages set paused=false,updated_at=clock_timestamp()
  where game_id=gid and phase=active_phase;
 elsif p_action='evidence' and current_step='challenge' then
  update public.cw_dean_learning_stages set step='evidence',paused=false,updated_at=clock_timestamp()
  where game_id=gid and phase=active_phase;
 elsif p_action='debrief' and current_step='evidence' then
  update public.cw_dean_learning_stages set step='debrief',paused=false,updated_at=clock_timestamp()
  where game_id=gid and phase=active_phase;
 else raise exception 'Transición pedagógica no permitida';end if;
 return public.cw_dean_learning_state(code,null);
end $f$;

revoke all on function public.cw_dean_learning_key(text) from public,anon,authenticated;
revoke all on function public.cw_dean_learning_weight(text) from public,anon,authenticated;
revoke all on function public.cw_dean_learning_state(text,text) from public,anon,authenticated;
revoke all on function public.cw_dean_learning_submit(text,text,text,text) from public,anon,authenticated;
revoke all on function public.cw_dean_learning_teacher(text,text) from public,anon,authenticated;
grant execute on function public.cw_dean_learning_key(text) to service_role;
grant execute on function public.cw_dean_learning_weight(text) to service_role;
grant execute on function public.cw_dean_learning_state(text,text) to service_role;
grant execute on function public.cw_dean_learning_submit(text,text,text,text) to service_role;
grant execute on function public.cw_dean_learning_teacher(text,text) to service_role;
