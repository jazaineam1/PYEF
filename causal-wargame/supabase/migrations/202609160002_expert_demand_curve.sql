-- V7.1: one simple expert product for the two-hour workshop.
-- Human attention is genuinely scarce, so only this resource uses global demand pricing.
-- The Game Master is never a market item. The three expert facilitators share these slots.

update public.cw_help_catalog
set cost = 20,
    price_curve = array[20,26,34],
    availability_managed = true,
    description = 'Un facilitador experto disponible entra a la sala durante 90 segundos. Los tres cupos de la ronda se encarecen con la demanda; sólo puede orientar con conceptos ya explicados y no entrega la solución.'
where help_id = 'expert_trainer';

do $$
begin
  if not exists (
    select 1
    from public.cw_help_catalog
    where help_id = 'expert_trainer'
      and cost = 20
      and price_curve = array[20,26,34]
      and availability_managed = true
  ) then
    raise exception 'expert_trainer demand curve was not configured';
  end if;
end $$;
