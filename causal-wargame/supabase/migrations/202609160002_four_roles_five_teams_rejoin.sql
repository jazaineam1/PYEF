-- Causal Quest: five teams x four core roles, with stable participant rejoin.
-- New sessions use: business (Decision + Policy), data, context, integrator.
-- The historical `risk` role remains in the schema only for backward compatibility.

-- 1) Five teams are now valid.
alter table public.cw_teams drop constraint if exists cw_teams_position_check;
alter table public.cw_teams add constraint cw_teams_position_check check(position between 1 and 5);

-- Keep canonical names and add Robins as the fifth team to existing games.
update public.cw_teams set name='Fisher' where position=1;
update public.cw_teams set name='Neyman' where position=2;
update public.cw_teams set name='Rubin' where position=3;
update public.cw_teams set name='Pearl' where position=4;
insert into public.cw_teams(game_id,position,name)
select g.id,5,'Robins'
from public.cw_games g
where not exists(select 1 from public.cw_teams t where t.game_id=g.id and t.position=5);

-- 2) Device-bound identity. It is intentionally separate from sessions:
-- a session token may expire or be cleared while this binding still recovers the same seat.
create table if not exists public.cw_player_identities(
  player_id uuid primary key references public.cw_players(id) on delete cascade,
  game_id uuid not null references public.cw_games(id) on delete cascade,
  client_key_hash bytea not null,
  name_key text not null,
  created_at timestamptz not null default now(),
  unique(game_id,client_key_hash),
  unique(game_id,name_key)
);
alter table public.cw_player_identities enable row level security;
revoke all on table public.cw_player_identities from public,anon,authenticated;
grant all on table public.cw_player_identities to service_role;
create index if not exists cw_player_identities_game_idx on public.cw_player_identities(game_id);

-- 3) New games always create five teams.
create or replace function public.cw_bootstrap_game(p_code text,p_pin text)
returns uuid
language plpgsql
set search_path=public
as $$
declare
  gid uuid;
  names text[]:=array['Fisher','Neyman','Rubin','Pearl','Robins'];
  i int;
begin
  if length(trim(p_code))<4 or length(p_pin)<8 then
    raise exception 'Código mínimo 4 caracteres y PIN mínimo 8 caracteres';
  end if;
  insert into public.cw_games(code,facilitator_pin_hash)
  values(upper(trim(p_code)),extensions.crypt(p_pin,extensions.gen_salt('bf')))
  returning id into gid;
  for i in 1..5 loop
    insert into public.cw_teams(game_id,position,name) values(gid,i,names[i]);
  end loop;
  insert into public.cw_events(game_id,actor,event_type,payload)
  values(gid,'system','game_created',jsonb_build_object('code',upper(trim(p_code)),'teams',5,'core_roles',4));
  return gid;
end $$;

-- 4) Rejoin-aware join.
-- Assignment order is role wave then team: 1..5 Decision+Policy, 6..10 Models,
-- 11..15 Causal, 16..20 Experiments. Therefore 17 humans => 4,4,3,3,3.
create or replace function public.cw_join_game(p_code text,p_display_name text,p_client_key text)
returns jsonb
language plpgsql security invoker set search_path=public
as $$
declare
  g public.cw_games;
  p public.cw_players;
  tid uuid;
  pid uuid;
  assigned_role text;
  tok text;
  c_hash bytea;
  n_humans int;
  normalized_name text;
begin
  select * into g from public.cw_games where code=upper(trim(p_code)) for update;
  if g.id is null then raise exception 'Partida no encontrada'; end if;
  if g.status='finished' then raise exception 'La partida ya terminó'; end if;
  if length(trim(coalesce(p_display_name,'')))<2 then raise exception 'Nombre obligatorio'; end if;
  normalized_name:=lower(regexp_replace(trim(p_display_name),'\s+',' ','g'));
  if length(normalized_name)>80 then raise exception 'El nombre es demasiado largo'; end if;
  if nullif(trim(coalesce(p_client_key,'')),'') is not null then
    c_hash:=extensions.digest(trim(p_client_key),'sha256');
  end if;

  -- Same browser/device: always recover the exact original player, team and role.
  if c_hash is not null then
    select q.* into p
    from public.cw_player_identities i
    join public.cw_players q on q.id=i.player_id
    where i.game_id=g.id and i.client_key_hash=c_hash
    limit 1;
    if p.id is not null then
      update public.cw_players set active=true,last_seen_at=now() where id=p.id;
      tok:=encode(extensions.gen_random_bytes(32),'hex');
      insert into public.cw_player_sessions(player_id,token_hash,expires_at)
      values(p.id,extensions.digest(tok,'sha256'),now()+interval '6 hours');
      insert into public.cw_events(game_id,actor,event_type,payload)
      values(g.id,p.id::text,'player_rejoined',jsonb_build_object('team_id',p.team_id,'role',p.role_code));
      return jsonb_build_object('token',tok,'resumed',true,'player',jsonb_build_object('id',p.id,'team_id',p.team_id,'role_code',p.role_code,'display_name',p.display_name));
    end if;
  end if;

  -- Do not create a second person record with the same visible identity.
  if exists(
    select 1 from public.cw_players q
    where q.game_id=g.id and q.active and not q.is_bot
      and lower(regexp_replace(trim(q.display_name),'\s+',' ','g'))=normalized_name
  ) then
    raise exception 'Ese nombre ya está registrado en esta partida. Si eres la misma persona, vuelve desde el dispositivo original; si son dos personas distintas, usa nombre y apellido.';
  end if;

  -- Once play has started, only known identities may rejoin. This freezes teams/roles mid-game.
  if not (g.status in ('lobby','briefing','lesson') and g.current_round=1) then
    raise exception 'La composición de equipos ya está cerrada. Sólo pueden reingresar participantes ya registrados.';
  end if;

  select count(*) into n_humans
  from public.cw_players q where q.game_id=g.id and q.active and not q.is_bot;
  if n_humans>=20 then raise exception 'La partida alcanzó 20 participantes'; end if;

  -- Pick the first human-free slot in the deterministic 5 x 4 matrix.
  select t.id,v.role_code into tid,assigned_role
  from public.cw_teams t
  cross join (values ('business',1),('data',2),('context',3),('integrator',4)) v(role_code,role_pos)
  where t.game_id=g.id and t.position between 1 and 5
    and not exists(
      select 1 from public.cw_players q
      where q.team_id=t.id and q.role_code=v.role_code and not q.is_bot
    )
  order by v.role_pos,t.position
  limit 1;

  if tid is null then raise exception 'No hay un cupo humano disponible en la matriz de 5 equipos × 4 roles'; end if;

  -- Rehearsal bots never own a human seat. Remove the bot in this exact slot if present.
  delete from public.cw_players q where q.team_id=tid and q.role_code=assigned_role and q.is_bot;

  insert into public.cw_players(game_id,team_id,display_name,role_code,is_bot)
  values(g.id,tid,left(trim(p_display_name),80),assigned_role,false)
  returning id into pid;

  if c_hash is not null then
    insert into public.cw_player_identities(player_id,game_id,client_key_hash,name_key)
    values(pid,g.id,c_hash,normalized_name);
  end if;

  tok:=encode(extensions.gen_random_bytes(32),'hex');
  insert into public.cw_player_sessions(player_id,token_hash,expires_at)
  values(pid,extensions.digest(tok,'sha256'),now()+interval '6 hours');
  insert into public.cw_events(game_id,actor,event_type,payload)
  values(g.id,pid::text,'player_joined',jsonb_build_object('team_id',tid,'role',assigned_role,'human_number',n_humans+1));
  return jsonb_build_object('token',tok,'resumed',false,'player',jsonb_build_object('id',pid,'team_id',tid,'role_code',assigned_role,'display_name',left(trim(p_display_name),80)));
end $$;

-- Legacy/internal callers without a participant key still work, but cannot silently
-- reclaim another person's identity.
create or replace function public.cw_join_game(p_code text,p_display_name text)
returns jsonb language sql security invoker set search_path=public as $$
  select public.cw_join_game(p_code,p_display_name,null::text)
$$;

revoke all on function public.cw_join_game(text,text,text) from public,anon,authenticated;
revoke all on function public.cw_join_game(text,text) from public,anon,authenticated;
grant execute on function public.cw_join_game(text,text,text) to service_role;
grant execute on function public.cw_join_game(text,text) to service_role;

-- 5) Merge the old Policy/Risk asymmetric card into Decision for new four-role sessions.
update public.cw_role_cards b
set content=b.content || E'\n\nResponsabilidad integrada de Política y Riesgo: ' || r.content
from public.cw_role_cards r
where b.round_number=r.round_number
  and b.role_code='business' and r.role_code='risk'
  and b.content not like '%Responsabilidad integrada de Política y Riesgo:%';

-- 6) Facilitator coverage is 4/4, while historical risk contributions remain visible only for audit.
create or replace function public.cw_facilitator_state(p_token text)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare gid uuid; g public.cw_games; teams_json jsonb; events_json jsonb; rank_mode text; total_players int; humans int; bots int; pre_n int; post_n int; pre_avg numeric; post_avg numeric;
begin
  gid:=public.cw_validate_facilitator_token(p_token); if gid is null then raise exception 'Sesión inválida'; end if;
  perform public.cw_auto_close_round(gid); select * into g from public.cw_games where id=gid;
  select count(*),count(*) filter(where not is_bot),count(*) filter(where is_bot) into total_players,humans,bots from public.cw_players where game_id=gid and active;
  rank_mode:=case when g.current_round=1 and g.status='closed' then 'observed' else 'causal' end;
  select count(*) filter(where stage='pre'),count(*) filter(where stage='post'),round(avg(score) filter(where stage='pre'),2),round(avg(score) filter(where stage='post'),2)
    into pre_n,post_n,pre_avg,post_avg from public.cw_transfer_checks where game_id=gid;
  select jsonb_agg(jsonb_build_object(
    'id',t.id,'name',t.name,'help_cost',t.help_cost,
    'online',(select count(*) from public.cw_players p where p.team_id=t.id and p.active and not p.is_bot and p.last_seen_at>now()-interval '90 seconds'),
    'humans',(select count(*) from public.cw_players p where p.team_id=t.id and p.active and not p.is_bot),
    'bots',(select count(*) from public.cw_players p where p.team_id=t.id and p.active and p.is_bot),
    'contributions',(select count(*) from public.cw_role_contributions rc where rc.game_id=gid and rc.team_id=t.id and rc.round_number=g.current_round),
    'core_coverage',(
      select count(*) from (
        select distinct rc.role_code as role
        from public.cw_role_contributions rc
        where rc.game_id=gid and rc.team_id=t.id and rc.round_number=g.current_round
          and rc.role_code in ('business','data','context','integrator')
        union
        select 'integrator'
        where exists(
          select 1 from public.cw_role_contributions rc
          where rc.game_id=gid and rc.team_id=t.id and rc.round_number=g.current_round and rc.role_code='data'
            and jsonb_typeof(rc.evidence#>'{details,coverage,integrator}')='object'
        )
      ) coverage_roles
    ),
    'legacy_risk_contributions',(select count(*) from public.cw_role_contributions rc where rc.game_id=gid and rc.team_id=t.id and rc.round_number=g.current_round and rc.role_code='risk'),
    'locked',exists(select 1 from public.cw_decisions d where d.team_id=t.id and d.round_number=g.current_round),
    'observed_conversion',case when g.current_round=1 and g.status in ('closed','reveal','teaching','microcheck','finished') then (select round(100*avg(c.p1),1) from public.cw_decisions d cross join lateral jsonb_array_elements_text(d.payload->'selected') s(customer_id) join public.cw_ground_truth_customers c on c.customer_id=s.customer_id where d.team_id=t.id and d.round_number=1) end,
    'score',jsonb_build_object('impact',t.score_impact,'evidence',t.score_evidence,'design',t.score_design,'risk',t.score_risk,'adaptation',t.score_adaptation),
    'check_correct',(select count(*) from public.cw_microchecks m join public.cw_players p on p.id=m.player_id where p.team_id=t.id and m.round_number=g.current_round and m.correct)
  ) order by t.position) into teams_json from public.cw_teams t where t.game_id=gid;
  select coalesce(jsonb_agg(jsonb_build_object('at',created_at,'type',event_type,'message',payload) order by created_at desc),'[]'::jsonb) into events_json from (select * from public.cw_events where game_id=gid order by created_at desc limit 80) e;
  return jsonb_build_object('server_time',now(),'game',jsonb_build_object('id',g.id,'code',g.code,'phase',g.status,'round',g.current_round,'closes_at',g.closes_at,'paused_remaining_seconds',g.paused_remaining_seconds,'public_message',g.public_message,'rank_mode',rank_mode,'player_count',total_players,'human_count',humans,'bot_count',bots,'core_target',4,'team_target',5),'teams',coalesce(teams_json,'[]'::jsonb),'transfer',jsonb_build_object('pre_completed',coalesce(pre_n,0),'post_completed',coalesce(post_n,0),'pre_avg',pre_avg,'post_avg',post_avg,'delta',case when pre_avg is null or post_avg is null then null else post_avg-pre_avg end),'audit',events_json);
end $$;

revoke all on function public.cw_facilitator_state(text) from public,anon,authenticated;
grant execute on function public.cw_facilitator_state(text) to service_role;
