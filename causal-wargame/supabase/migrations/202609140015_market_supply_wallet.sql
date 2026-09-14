-- CAUSAL QUEST V4 · scarce market, team investment wallet and human expert availability

alter table public.cw_teams add column if not exists investment_balance int not null default 60;
alter table public.cw_teams drop constraint if exists cw_teams_investment_balance_check;
alter table public.cw_teams add constraint cw_teams_investment_balance_check check (investment_balance between 0 and 120);

alter table public.cw_help_catalog add column if not exists stock_per_round int;
alter table public.cw_help_catalog add column if not exists price_curve int[];
alter table public.cw_help_catalog add column if not exists repeatable boolean not null default false;
alter table public.cw_help_catalog add column if not exists buyer_role text;
alter table public.cw_help_catalog add column if not exists availability_managed boolean not null default false;
alter table public.cw_help_catalog add column if not exists expert_profile jsonb not null default '{}'::jsonb;

alter table public.cw_help_purchases drop constraint if exists cw_help_purchases_game_id_team_id_round_number_help_id_key;

-- One role owns the team's resource portfolio. The other roles can recommend purchases,
-- but the Decision Lead executes them.
update public.cw_help_catalog
set buyer_role='business';

-- Scarce inventory + marginal pricing. Price is determined by global demand in the current game/round.
update public.cw_help_catalog set stock_per_round=8, price_curve=array[4,4,5,5,6,6,7,8], repeatable=false where help_id='basic_hint';
update public.cw_help_catalog set stock_per_round=4, price_curve=array[5,6,8,10], repeatable=false where help_id='balance_check';
update public.cw_help_catalog set stock_per_round=4, price_curve=array[6,7,9,11], repeatable=false where help_id='omitted_check';
update public.cw_help_catalog set stock_per_round=3, price_curve=array[7,9,12], repeatable=false where help_id='confounder_scan';
update public.cw_help_catalog set stock_per_round=4, price_curve=array[8,10,12,15], repeatable=false where help_id='benchmark';
update public.cw_help_catalog set stock_per_round=3, price_curve=array[8,10,13], repeatable=false where help_id='power_check';
update public.cw_help_catalog set stock_per_round=2, price_curve=array[9,13], repeatable=false where help_id='dag_vision';
update public.cw_help_catalog set stock_per_round=3, price_curve=array[9,11,14], repeatable=false where help_id='segment_map';
update public.cw_help_catalog set stock_per_round=3, price_curve=array[10,13,17], repeatable=false where help_id='propensity_radar';
update public.cw_help_catalog set stock_per_round=4, price_curve=array[10,12,14,17], repeatable=false where help_id='case_analog';
update public.cw_help_catalog set stock_per_round=2, price_curve=array[12,18], repeatable=false where help_id='ipw_boost';
update public.cw_help_catalog set stock_per_round=2, price_curve=array[13,18], repeatable=false where help_id='counterfactual_practice';
update public.cw_help_catalog set stock_per_round=2, price_curve=array[14,20], repeatable=false where help_id='uplift_lens';

-- Talent can be hired more than once by a team while the market still has stock.
update public.cw_help_catalog set stock_per_round=3, price_curve=array[6,9,13], repeatable=true,
 expert_profile='{"rank":"Analista Junior","max_role":"Analista Causal Asociado","scope":"Cálculos, tablas, chequeos básicos y documentación reproducible."}'::jsonb
 where help_id='junior_analyst';
update public.cw_help_catalog set stock_per_round=2, price_curve=array[15,22], repeatable=true,
 expert_profile='{"rank":"Especialista Senior","max_role":"Lead de Evidencia Causal","scope":"Supuestos, método, interpretación y revisión de calidad."}'::jsonb
 where help_id='senior_specialist';

-- Game Master coordinates the game; it is not an expert-for-hire.
update public.cw_help_catalog set active=false where help_id in ('expert_game','expert_trainer');

-- The three human subject-matter experts are purchasable only when the facilitator marks
-- actual availability for the current round. The profile describes the game role, not years
-- of real-world experience; real bios/cost calibration remain configurable without code changes.
update public.cw_help_catalog set active=true, availability_managed=true, stock_per_round=null,
 price_curve=array[18,23,29,36], repeatable=false,
 expert_profile='{"rank":"Experto Experimentos & ML","max_role":"Principal Experimentation & ML Scientist","scope":"Predicción vs uplift, diseño experimental, power, MDE, métricas e interpretación de modelos."}'::jsonb
 where help_id='expert_ml';
update public.cw_help_catalog set active=true, availability_managed=true, stock_per_round=null,
 price_curve=array[20,26,33,41], repeatable=false,
 expert_profile='{"rank":"Experto Policy & Risk","max_role":"Principal Decision Policy Strategist","scope":"CATE a política, ROI, capacidad, riesgo, fairness y escalamiento."}'::jsonb
 where help_id='expert_policy';
update public.cw_help_catalog set active=true, availability_managed=true, stock_per_round=null,
 price_curve=array[22,29,37,46], repeatable=false,
 expert_profile='{"rank":"Experto Causal","max_role":"Principal Causal Architect","scope":"Pregunta causal, DAG, confusión, identificación, overlap, estimandos y sensibilidad."}'::jsonb
 where help_id='expert_causal';

create table if not exists public.cw_expert_availability (
  game_id uuid not null references public.cw_games(id) on delete cascade,
  round_number int not null check (round_number between 1 and 4),
  help_id text not null references public.cw_help_catalog(help_id) on delete cascade,
  slots int not null default 0 check (slots between 0 and 4),
  updated_at timestamptz not null default now(),
  primary key(game_id,round_number,help_id)
);

create index if not exists cw_expert_availability_game_round_idx
  on public.cw_expert_availability(game_id,round_number);

create or replace function public.cw_help_state(p_token text)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare p public.cw_players; g public.cw_games; catalog jsonb; purchases jsonb; cost_used int; budget int;
begin
  select * into p from public.cw_validate_player_token(p_token);
  if p.id is null then raise exception 'Sesión inválida'; end if;
  select * into g from public.cw_games where id=p.game_id;

  with market as (
    select h.*,
      (select count(*)::int from public.cw_help_purchases x
        where x.game_id=g.id and x.round_number=g.current_round and x.help_id=h.help_id) as sold_count,
      case when h.availability_managed then
        coalesce((select a.slots from public.cw_expert_availability a
          where a.game_id=g.id and a.round_number=g.current_round and a.help_id=h.help_id),0)
      else h.stock_per_round end as market_stock
    from public.cw_help_catalog h
    where h.active and g.current_round between h.min_round and h.max_round
  ), priced as (
    select m.*,
      case
        when array_length(m.price_curve,1) is null then m.cost
        else m.price_curve[least(m.sold_count+1,array_length(m.price_curve,1))]
      end as next_cost
    from market m
  )
  select coalesce(jsonb_agg(jsonb_build_object(
      'id',q.help_id,'category',q.category,'title',q.title,'description',q.description,
      'rarity',q.rarity,'role_code',q.role_code,'buyer_role',q.buyer_role,'repeatable',q.repeatable,
      'availability_managed',q.availability_managed,'profile',q.expert_profile,
      'sold_count',q.sold_count,'stock',q.market_stock,
      'remaining',case when q.market_stock is null then null else greatest(q.market_stock-q.sold_count,0) end,
      'next_cost',q.next_cost,
      'available',case when q.market_stock is null then true else q.sold_count<q.market_stock end
    ) order by q.category,q.next_cost,q.help_id),'[]'::jsonb)
  into catalog from priced q;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id',x.id,'help_id',x.help_id,'cost',x.cost,'result',x.result,'created_at',x.created_at
  ) order by x.created_at),'[]'::jsonb)
  into purchases
  from public.cw_help_purchases x
  where x.game_id=g.id and x.team_id=p.team_id and x.round_number=g.current_round;

  select help_cost,investment_balance into cost_used,budget from public.cw_teams where id=p.team_id;
  return jsonb_build_object(
    'round',g.current_round,'phase',g.status,'catalog',catalog,'purchases',purchases,
    'help_cost',coalesce(cost_used,0),'investment_balance',coalesce(budget,0),
    'buyer_role','business','can_purchase',p.role_code='business',
    'round_purchase_count',jsonb_array_length(purchases)
  );
end $$;

create or replace function public.cw_buy_help(p_token text,p_help_id text)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare
  p public.cw_players; g public.cw_games; h public.cw_help_catalog;
  sold_count int; market_stock int; actual_cost int; budget int; rid uuid; out_json jsonb; round_key text;
begin
  select * into p from public.cw_validate_player_token(p_token);
  if p.id is null then raise exception 'Sesión inválida'; end if;
  select * into g from public.cw_games where id=p.game_id for update;
  if g.status<>'round' then raise exception 'Los recursos sólo se compran durante el laboratorio'; end if;

  select * into h from public.cw_help_catalog
  where help_id=p_help_id and active and g.current_round between min_round and max_round;
  if h.help_id is null then raise exception 'Recurso no disponible en esta ronda'; end if;
  if h.buyer_role is not null and p.role_code<>h.buyer_role then
    raise exception 'Sólo el Decision Lead administra la bolsa de inversión del equipo';
  end if;

  -- Serialise demand for this exact item so simultaneous teams cannot oversell inventory
  -- or obtain the same marginal price.
  perform pg_advisory_xact_lock(hashtextextended(g.id::text||':'||g.current_round::text||':'||h.help_id,0));

  select count(*)::int into sold_count from public.cw_help_purchases
   where game_id=g.id and round_number=g.current_round and help_id=h.help_id;

  if h.availability_managed then
    select coalesce(a.slots,0) into market_stock from public.cw_expert_availability a
      where a.game_id=g.id and a.round_number=g.current_round and a.help_id=h.help_id;
    market_stock:=coalesce(market_stock,0);
  else
    market_stock:=h.stock_per_round;
  end if;

  if market_stock is not null and sold_count>=market_stock then
    raise exception 'Recurso agotado en el mercado de esta ronda';
  end if;

  if not h.repeatable and exists(
    select 1 from public.cw_help_purchases
    where game_id=g.id and team_id=p.team_id and round_number=g.current_round and help_id=h.help_id
  ) then raise exception 'El equipo ya utilizó este recurso en la ronda'; end if;

  actual_cost:=case
    when array_length(h.price_curve,1) is null then h.cost
    else h.price_curve[least(sold_count+1,array_length(h.price_curve,1))]
  end;

  select investment_balance into budget from public.cw_teams where id=p.team_id for update;
  if budget<actual_cost then raise exception 'Capital de inversión insuficiente'; end if;

  round_key:='r'||g.current_round::text;
  out_json:=coalesce(h.result_template->round_key,h.result_template->'default',jsonb_build_object('title',h.title,'text',h.description));

  insert into public.cw_help_purchases(game_id,team_id,player_id,round_number,help_id,cost,result)
    values(g.id,p.team_id,p.id,g.current_round,h.help_id,actual_cost,out_json) returning id into rid;

  update public.cw_teams
    set help_cost=help_cost+actual_cost, investment_balance=investment_balance-actual_cost
    where id=p.team_id;

  insert into public.cw_events(game_id,actor,event_type,payload)
    values(g.id,p.id::text,case when h.category='expert' then 'expert_request' else 'help_purchased' end,
      jsonb_build_object('team_id',p.team_id,'round',g.current_round,'help_id',h.help_id,'title',h.title,
        'cost',actual_cost,'market_position',sold_count+1,'role_code',p.role_code,'purchase_id',rid,
        'master',out_json->>'master','seconds',out_json->>'seconds','profile',h.expert_profile));

  return jsonb_build_object('ok',true,'purchase_id',rid,'help_id',h.help_id,'cost',actual_cost,
    'market_position',sold_count+1,'result',out_json,
    'team_help_cost',(select help_cost from public.cw_teams where id=p.team_id),
    'investment_balance',(select investment_balance from public.cw_teams where id=p.team_id));
end $$;

create or replace function public.cw_expert_market_state(p_token text)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare gid uuid; g public.cw_games; items jsonb;
begin
  gid:=public.cw_validate_facilitator_token(p_token);
  if gid is null then raise exception 'Sesión inválida'; end if;
  select * into g from public.cw_games where id=gid;

  select coalesce(jsonb_agg(jsonb_build_object(
    'help_id',h.help_id,'title',h.title,'profile',h.expert_profile,'price_curve',h.price_curve,
    'slots',coalesce(a.slots,0),
    'used',(select count(*)::int from public.cw_help_purchases p
      where p.game_id=gid and p.round_number=g.current_round and p.help_id=h.help_id)
  ) order by h.help_id),'[]'::jsonb)
  into items
  from public.cw_help_catalog h
  left join public.cw_expert_availability a
    on a.game_id=gid and a.round_number=g.current_round and a.help_id=h.help_id
  where h.active and h.category='expert' and h.availability_managed;

  return jsonb_build_object('round',g.current_round,'experts',items);
end $$;

create or replace function public.cw_set_expert_availability(p_token text,p_help_id text,p_slots int)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare gid uuid; g public.cw_games; used int;
begin
  gid:=public.cw_validate_facilitator_token(p_token);
  if gid is null then raise exception 'Sesión inválida'; end if;
  if p_slots<0 or p_slots>4 then raise exception 'Disponibilidad debe estar entre 0 y 4 cupos'; end if;
  select * into g from public.cw_games where id=gid;
  if not exists(select 1 from public.cw_help_catalog where help_id=p_help_id and active and category='expert' and availability_managed) then
    raise exception 'Experto no administrable';
  end if;
  select count(*)::int into used from public.cw_help_purchases
    where game_id=gid and round_number=g.current_round and help_id=p_help_id;
  if p_slots<used then raise exception 'No puedes reducir cupos por debajo de las reservas ya vendidas'; end if;
  insert into public.cw_expert_availability(game_id,round_number,help_id,slots,updated_at)
    values(gid,g.current_round,p_help_id,p_slots,now())
  on conflict(game_id,round_number,help_id)
    do update set slots=excluded.slots,updated_at=excluded.updated_at;
  insert into public.cw_events(game_id,actor,event_type,payload)
    values(gid,'facilitator','expert_availability',jsonb_build_object('round',g.current_round,'help_id',p_help_id,'slots',p_slots));
  return public.cw_expert_market_state(p_token);
end $$;

create or replace function public.cw_help_reset_trigger()
returns trigger language plpgsql set search_path=public as $$
begin
  if new.status='lobby' and old.status is distinct from 'lobby' then
    delete from public.cw_help_purchases where game_id=new.id;
    delete from public.cw_expert_availability where game_id=new.id;
    update public.cw_teams set help_cost=0,investment_balance=60 where game_id=new.id;
  end if;
  return new;
end $$;

drop trigger if exists cw_game_reset_help on public.cw_games;
create trigger cw_game_reset_help after update of status on public.cw_games
for each row execute function public.cw_help_reset_trigger();

revoke all on table public.cw_expert_availability from public,anon,authenticated;
revoke all on function public.cw_expert_market_state(text) from public,anon,authenticated;
revoke all on function public.cw_set_expert_availability(text,text,int) from public,anon,authenticated;
grant execute on function public.cw_expert_market_state(text) to service_role;
grant execute on function public.cw_set_expert_availability(text,text,int) to service_role;
grant execute on function public.cw_help_state(text) to service_role;
grant execute on function public.cw_buy_help(text,text) to service_role;
