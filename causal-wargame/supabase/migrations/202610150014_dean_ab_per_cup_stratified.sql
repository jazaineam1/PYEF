-- Preserve existing DGP coefficients and historic AB datasets.
-- New canonical Copas: game-specific reproducible seed and within-archetype
-- randomization; four treated in each of 8/8/7/7 profiles. No empty cells.
create table if not exists public.cw_dean_ab_protocol(
 game_id uuid primary key references public.cw_dean_tournaments(game_id) on delete cascade,
 protocol text not null,
 seed_note text not null,
 created_at timestamptz not null default clock_timestamp()
);
alter table public.cw_dean_ab_protocol enable row level security;
revoke all on public.cw_dean_ab_protocol from public,anon,authenticated;
grant select,insert on public.cw_dean_ab_protocol to service_role;
create or replace function public.cw_dean_ab_generate_v3(p_fac_token text)
returns jsonb language plpgsql security invoker set search_path=public as $f$
declare gid uuid;phase text;ver text;
 i integer;j integer;arch text;pga numeric;treated integer;
 min_h numeric;max_h numeric;min_s numeric;max_s numeric;base_h numeric;base_s numeric;base_b numeric;
 h0 numeric;h1 numeric;s0 numeric;s1 numeric;d numeric;
 seed text;subj jsonb;noise_h double precision;noise_s double precision;
 r0 jsonb;r1 jsonb;existing int;
begin
 select public.cw_validate_facilitator_token(p_fac_token) into gid;
 if gid is null then raise exception 'Docente inválido';end if;
 select t.phase,t.dgp_version into phase,ver from public.cw_dean_tournaments t where game_id=gid for update;
 if ver is distinct from 'zip_dgp_2026' then raise exception 'Experimento disponible solo para torneos con el DGP canónico';end if;
 if phase not in ('causal','final','finished') then raise exception 'Activa antes la fase causal';end if;
 select count(*) into existing from public.cw_dean_ab_v3 where game_id=gid;
 if existing>0 then return public.cw_dean_ab_summary_v3(gid);end if;
 for i in 1..30 loop
  arch:=(array['over','balanced','risk','pragmatic'])[((i-1)%4)+1];
  case arch
   when 'over' then min_h:=8;max_h:=14;min_s:=2;max_s:=5;
     base_h:=11.5;base_s:=3.5;base_b:=0.6;
   when 'balanced' then min_h:=4;max_h:=8;min_s:=6.5;max_s:=8.5;
     base_h:=6;base_s:=7.5;base_b:=2.5;
   when 'risk' then min_h:=2;max_h:=5.5;min_s:=4.5;max_s:=7;
     base_h:=3.5;base_s:=6;base_b:=2.5;
   else min_h:=0.5;max_h:=3.5;min_s:=7;max_s:=9.5;
     base_h:=1.5;base_s:=8.5;base_b:=4.8;
  end case;
  seed:='2026:ab:'||gid::text||':student:'||i;
  pga:=round((case arch
    when 'over' then 3.8+public.cw_dean_uniform_v3(seed||':pga')*1.0
    when 'balanced' then 3.4+public.cw_dean_uniform_v3(seed||':pga')*0.9
    when 'risk' then 2.0+public.cw_dean_uniform_v3(seed||':pga')*1.0
    else 3.0+public.cw_dean_uniform_v3(seed||':pga')*0.6 end)::numeric,2);
  -- Stratified pseudo-random assignment, four treated per archetype.
   treated:=case when (
      select count(*) from generate_series(1,30) as c(student_index)
      where (c.student_index-1)%4=(i-1)%4
       and public.cw_dean_uniform_v3(gid::text||':ab:arm:'||c.student_index)
          <=public.cw_dean_uniform_v3(gid::text||':ab:arm:'||i)
    )<=4 then 1 else 0 end;
  for j in 1..15 loop
   -- Match Python ABExperimentSimulator: subjects[(s_idx + round_num) % len(subjects)]
   subj:=public.cw_dean_subject_v3(1+((i+j-1)%11));
   d:=(subj->>'complexity')::numeric;
   seed:='2026:ab:'||gid::text||':student:'||i||':exam:'||j;
   noise_h:=0.5*public.cw_dean_normal_v3(seed||':study');
   noise_s:=0.4*public.cw_dean_normal_v3(seed||':sleep');
   h0:=round(least(max_h,greatest(min_h,(base_h+0.3*(d-5.5)-0.7*(0-base_b)+noise_h)))::numeric,1);
   h1:=round(least(max_h,greatest(min_h,(base_h+0.3*(d-5.5)-0.7*(4-base_b)+noise_h)))::numeric,1);
   s0:=round(least(max_s,greatest(min_s,(base_s-0.25*(h0-base_h)+0.2*(0-base_b)+noise_s)))::numeric,1);
   s1:=round(least(max_s,greatest(min_s,(base_s-0.25*(h1-base_h)+0.2*(4-base_b)+noise_s)))::numeric,1);
   r0:=public.cw_dean_score_v3(pga,d,h0,s0,0,seed||':outcome');
   r1:=public.cw_dean_score_v3(pga,d,h1,s1,4,seed||':outcome');
   insert into public.cw_dean_ab_v3(game_id,student_no,exam_no,archetype,pga_prior,
      subject_name,complexity,treatment,wellness_hours,study_hours,sleep_hours,
      observed_score,y0_score,y1_score,u0_fatigue,u1_fatigue)
   values(gid,i,j,arch,pga,subj->>'name',d,treated,case when treated=1 then 4 else 0 end,
      case when treated=1 then h1 else h0 end,
      case when treated=1 then s1 else s0 end,
      case when treated=1 then (r1->>'nota_final')::numeric else (r0->>'nota_final')::numeric end,
      (r0->>'nota_final')::numeric,(r1->>'nota_final')::numeric,
      (r0->>'fatiga_latente')::numeric,(r1->>'fatiga_latente')::numeric);
  end loop;
 end loop;
 insert into public.cw_dean_ab_protocol(game_id,protocol,seed_note)
  values(gid,'stratified_four_treated_per_archetype','2026:ab:'||gid::text)
  on conflict(game_id) do nothing;
  return public.cw_dean_ab_summary_v3(gid);
end $f$;


