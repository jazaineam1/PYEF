-- CAUSAL QUEST V4.1 · atomic basket checkout
create or replace function public.cw_buy_help_batch(p_token text,p_items jsonb)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare
  item jsonb; q int; i int; r jsonb; results jsonb:='[]'::jsonb; total_cost int:=0; units int:=0;
begin
  if jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items)=0 then
    raise exception 'La cesta está vacía';
  end if;
  if jsonb_array_length(p_items)>8 then raise exception 'Máximo 8 líneas por compra'; end if;

  for item in select value from jsonb_array_elements(p_items)
  loop
    q:=coalesce((item->>'qty')::int,1);
    if q<1 or q>4 then raise exception 'Cantidad inválida'; end if;
    units:=units+q;
    if units>10 then raise exception 'Máximo 10 unidades por compra'; end if;
    for i in 1..q loop
      r:=public.cw_buy_help(p_token,item->>'help_id');
      results:=results||jsonb_build_array(r);
      total_cost:=total_cost+coalesce((r->>'cost')::int,0);
    end loop;
  end loop;

  return jsonb_build_object(
    'ok',true,'units',units,'total_cost',total_cost,'results',results,
    'state',public.cw_help_state(p_token)
  );
end $$;

revoke all on function public.cw_buy_help_batch(text,jsonb) from public,anon,authenticated;
grant execute on function public.cw_buy_help_batch(text,jsonb) to service_role;
