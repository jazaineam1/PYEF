-- Internal helper functions. SECURITY INVOKER keeps the caller privileges. These RPCs are executable only by service_role through Edge Functions.
create or replace function public.cw_validate_player_token(p_token text)
returns public.cw_players
language sql security invoker set search_path=public
as $$
  select p.* from public.cw_player_sessions s join public.cw_players p on p.id=s.player_id
  where s.token_hash=extensions.digest(p_token,'sha256') and s.expires_at>now() and p.active=true
  limit 1;
$$;

create or replace function public.cw_validate_facilitator_token(p_token text)
returns uuid
language sql security invoker set search_path=public
as $$
  select game_id from public.cw_facilitator_sessions
  where token_hash=extensions.digest(p_token,'sha256') and expires_at>now()
  limit 1;
$$;

create or replace function public.cw_bootstrap_game(p_code text, p_pin text)
returns uuid
language plpgsql security invoker set search_path=public
as $$
declare gid uuid; names text[] := array['Águila','Jaguar','Cóndor','Puma']; i int;
begin
  if length(trim(p_code)) < 4 or length(p_pin) < 8 then raise exception 'Código mínimo 4 caracteres y PIN mínimo 8 caracteres'; end if;
  insert into public.cw_games(code,facilitator_pin_hash) values(upper(trim(p_code)),extensions.crypt(p_pin,extensions.gen_salt('bf'))) returning id into gid;
  for i in 1..4 loop insert into public.cw_teams(game_id,position,name) values(gid,i,names[i]); end loop;
  insert into public.cw_events(game_id,actor,event_type,payload) values(gid,'system','game_created',jsonb_build_object('code',upper(trim(p_code))));
  return gid;
end $$;

create or replace function public.cw_join_game(p_code text, p_display_name text)
returns jsonb
language plpgsql security invoker set search_path=public
as $$
declare g public.cw_games; n int; team_pos int; role_pos int; roles text[]:=array['business','data','context','risk','integrator']; tid uuid; pid uuid; tok text;
begin
  select * into g from public.cw_games where code=upper(trim(p_code)) for update;
  if g.id is null then raise exception 'Partida no encontrada'; end if;
  if g.status='finished' then raise exception 'La partida ya terminó'; end if;
  if trim(coalesce(p_display_name,''))='' then raise exception 'Nombre obligatorio'; end if;
  select count(*) into n from public.cw_players where game_id=g.id and active=true;
  if n>=20 then raise exception 'La partida alcanzó 20 participantes'; end if;
  team_pos := mod(n,4)+1; role_pos := mod(floor(n/4.0)::int,5)+1;
  select id into tid from public.cw_teams where game_id=g.id and position=team_pos;
  insert into public.cw_players(game_id,team_id,display_name,role_code) values(g.id,tid,left(trim(p_display_name),80),roles[role_pos]) returning id into pid;
  tok := encode(extensions.gen_random_bytes(32),'hex');
  insert into public.cw_player_sessions(player_id,token_hash,expires_at) values(pid,extensions.digest(tok,'sha256'),now()+interval '6 hours');
  insert into public.cw_events(game_id,actor,event_type,payload) values(g.id,pid::text,'player_joined',jsonb_build_object('team_id',tid,'role',roles[role_pos]));
  return jsonb_build_object('token',tok,'player',jsonb_build_object('id',pid,'team_id',tid,'role_code',roles[role_pos],'display_name',p_display_name));
end $$;

create or replace function public.cw_facilitator_login(p_code text, p_pin text)
returns jsonb
language plpgsql security invoker set search_path=public
as $$
declare g public.cw_games; tok text;
begin
  select * into g from public.cw_games where code=upper(trim(p_code));
  if g.id is null or extensions.crypt(p_pin,g.facilitator_pin_hash)<>g.facilitator_pin_hash then raise exception 'Código o PIN inválido'; end if;
  tok := encode(extensions.gen_random_bytes(32),'hex');
  insert into public.cw_facilitator_sessions(game_id,token_hash,expires_at) values(g.id,extensions.digest(tok,'sha256'),now()+interval '8 hours');
  return jsonb_build_object('token',tok,'game_id',g.id);
end $$;

create or replace function public.cw_public_customers()
returns jsonb language sql security invoker set search_path=public as $$
  select jsonb_agg(jsonb_build_object('id',customer_id,'name',name,'segment',segment,'score',predictive_score,'cost',cost) order by predictive_score desc)
  from public.cw_ground_truth_customers;
$$;

create or replace function public.cw_game_state(p_token text)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare p public.cw_players; g public.cw_games; card text; teams_json jsonb; locked boolean; d jsonb; result_json jsonb; customers jsonb;
begin
  select * into p from public.cw_validate_player_token(p_token);
  if p.id is null then raise exception 'Sesión inválida o expirada'; end if;
  update public.cw_players set last_seen_at=now() where id=p.id;
  select * into g from public.cw_games where id=p.game_id;
  select content into card from public.cw_role_cards where round_number=g.current_round and role_code=p.role_code;
  select jsonb_agg(jsonb_build_object('id',t.id,'name',t.name,'score',jsonb_build_object('impact',t.score_impact,'evidence',t.score_evidence,'design',t.score_design,'risk',t.score_risk,'adaptation',t.score_adaptation),'locked',exists(select 1 from public.cw_decisions x where x.team_id=t.id and x.round_number=g.current_round))) into teams_json from public.cw_teams t where t.game_id=g.id;
  select payload,result,true into d,result_json,locked from public.cw_decisions where game_id=g.id and team_id=p.team_id and round_number=g.current_round;
  if g.current_round=1 then select public.cw_public_customers() into customers; end if;
  return jsonb_build_object(
    'game',jsonb_build_object('id',g.id,'code',g.code,'title',g.title,'phase',g.status,'round',g.current_round,'closes_at',g.closes_at,'public_message',g.public_message),
    'player',jsonb_build_object('id',p.id,'team_id',p.team_id,'display_name',p.display_name,'role_code',p.role_code),
    'role_card',card,'teams',coalesce(teams_json,'[]'::jsonb),'decision',d,'result',result_json,'locked',coalesce(locked,false),'customers',customers
  );
end $$;