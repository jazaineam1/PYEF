-- Human experts are governed by explicit facilitator availability, not a hard-coded round gate.
update public.cw_help_catalog
set min_round=1,max_round=4
where help_id in ('expert_causal','expert_ml','expert_policy');
