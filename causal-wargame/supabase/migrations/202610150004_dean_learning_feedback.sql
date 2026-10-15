-- Aggregate learning misconceptions only after the teacher reveals debrief.
create or replace function public.cw_dean_learning_state(p_code text,p_hash text default null)
returns jsonb language plpgsql security invoker set search_path=public as $f$
declare gid uuid; current_phase text; current_step text; stopped boolean;
 result jsonb; own jsonb:=null; own_pid uuid; correct text; cohorts jsonb; room_scores jsonb; answers jsonb;
begin
 select g.id,t.phase into gid,current_phase
 from public.cw_games g join public.cw_dean_tournaments t on t.game_id=g.id
 where g.code=upper(btrim(p_code));
 if gid is null then return jsonb_build_object('available',false); end if;
 -- Critical isolation: this read must never create new data in a legacy/historical tournament.
 if (select t.dgp_version from public.cw_dean_tournaments t where t.game_id=gid)
    is distinct from 'zip_dgp_2026' then
   return jsonb_build_object('available',false);
 end if;
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
 select jsonb_build_object(
  'a',count(*) filter(where choice='a'),
  'b',count(*) filter(where choice='b'),
  'c',count(*) filter(where choice='c')
 ) into answers from public.cw_dean_learning_choices
 where game_id=gid and phase=current_phase and kind='revision';
 correct:=case when current_step='debrief' then public.cw_dean_learning_key(current_phase) else null end;
 result:=jsonb_build_object('available',true,'phase',current_phase,
  'step',current_step,'paused',coalesce(stopped,false),'counts',cohorts,
  'rooms',room_scores,'mine',own,'correct',correct,
  'distribution',case when current_step='debrief' then answers else null end,
  'registered',(select count(*) from public.cw_dean_players where game_id=gid),
  'server_now',clock_timestamp());
 return result;
end $f$;
revoke all on function public.cw_dean_learning_state(text,text) from public,anon,authenticated;
grant execute on function public.cw_dean_learning_state(text,text) to service_role;
