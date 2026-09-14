-- V5.2: fair market. Non-human resources are priced and stocked per team, not globally.
-- Human expert availability remains global because it represents real facilitator capacity.

update public.cw_help_catalog
set price_curve = array[20], cost = 20
where help_id='expert_trainer';

create or replace function public.cw_help_state(p_token text)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare p public.cw_players; g public.cw_games; catalog jsonb; purchases jsonb; cost_used int; budget int;
begin
  select * into p from public.cw_validate_player_token(p_token);
  if p.id is null then raise exception 'Sesión inválida'; end if;
  select * into g from public.cw_games where id=p.game_id;

  with market as (
    select h.*,
      case when h.category='expert' then
        (select count(*)::int from public.cw_help_purchases x
          where x.game_id=g.id and x.round_number=g.current_round and x.help_id=h.help_id)
      else
        (select count(*)::int from public.cw_help_purchases x
          where x.game_id=g.id and x.team_id=p.team_id and x.round_number=g.current_round and x.help_id=h.help_id)
      end as sold_count,
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
  sold_count int; market_stock int; actual_cost int; budget int; rid uuid; out_json jsonb; round_key text; lock_key text;
begin
  select * into p from public.cw_validate_player_token(p_token);
  if p.id is null then raise exception 'Sesión inválida'; end if;
  select * into g from public.cw_games where id=p.game_id for update;
  if g.status<>'round' then raise exception 'Los recursos sólo se compran durante el laboratorio'; end if;

  select * into h from public.cw_help_catalog
  where help_id=p_help_id and active and g.current_round between min_round and max_round;
  if h.help_id is null then raise exception 'Recurso no disponible en esta ronda'; end if;
  if h.buyer_role is not null and p.role_code<>h.buyer_role then
    raise exception 'Sólo el Líder de Decisión administra la bolsa de inversión del equipo';
  end if;

  lock_key := g.id::text||':'||g.current_round::text||':'||h.help_id||case when h.category='expert' then ':global' else ':'||p.team_id::text end;
  perform pg_advisory_xact_lock(hashtextextended(lock_key,0));

  if h.category='expert' then
    select count(*)::int into sold_count from public.cw_help_purchases
      where game_id=g.id and round_number=g.current_round and help_id=h.help_id;
  else
    select count(*)::int into sold_count from public.cw_help_purchases
      where game_id=g.id and team_id=p.team_id and round_number=g.current_round and help_id=h.help_id;
  end if;

  if h.availability_managed then
    select coalesce(a.slots,0) into market_stock from public.cw_expert_availability a
      where a.game_id=g.id and a.round_number=g.current_round and a.help_id=h.help_id;
    market_stock:=coalesce(market_stock,0);
  else
    market_stock:=h.stock_per_round;
  end if;

  if market_stock is not null and sold_count>=market_stock then
    if h.category='expert' then
      raise exception 'No quedan cupos de Llamada al Capítulo en esta ronda';
    else
      raise exception 'El equipo ya agotó este recurso en la ronda';
    end if;
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

grant execute on function public.cw_help_state(text) to service_role;
grant execute on function public.cw_buy_help(text,text) to service_role;
