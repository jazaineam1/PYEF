-- V2 Canonical AB experiment: 30 * 15 potential-outcome pairs with paired noises.
-- No changes to existing exams; treatment is randomized at synthetic-student level.
create table if not exists public.cw_dean_ab_v3(
 game_id uuid not null references public.cw_dean_tournaments(game_id) on delete cascade,
 student_no integer not null check(student_no between 1 and 30),
 exam_no integer not null check(exam_no between 1 and 15),
 archetype text not null,
 pga_prior numeric not null,
 subject_name text not null,complexity numeric not null,
 treatment integer not null check(treatment in (0,1)),
 wellness_hours numeric not null,
 study_hours numeric not null,sleep_hours numeric not null,
 observed_score numeric not null,
 y0_score numeric not null,y1_score numeric not null,
 u0_fatigue numeric not null,u1_fatigue numeric not null,
 primary key(game_id,student_no,exam_no)
);
alter table public.cw_dean_ab_v3 enable row level security;
revoke all on public.cw_dean_ab_v3 from public,anon,authenticated;
grant select,insert,update,delete on public.cw_dean_ab_v3 to service_role;

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
  seed:='2026:ab:student:'||i;
  pga:=round((case arch
    when 'over' then 3.8+public.cw_dean_uniform_v3(seed||':pga')*1.0
    when 'balanced' then 3.4+public.cw_dean_uniform_v3(seed||':pga')*0.9
    when 'risk' then 2.0+public.cw_dean_uniform_v3(seed||':pga')*1.0
    else 3.0+public.cw_dean_uniform_v3(seed||':pga')*0.6 end)::numeric,2);
  treated:=case when public.cw_dean_uniform_v3(seed||':T')<0.5 then 1 else 0 end;
  for j in 1..15 loop
   -- Match Python ABExperimentSimulator: subjects[(s_idx + round_num) % len(subjects)]
   subj:=public.cw_dean_subject_v3(1+((i+j-1)%11));
   d:=(subj->>'complexity')::numeric;
   seed:='2026:ab:student:'||i||':exam:'||j;
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
 return public.cw_dean_ab_summary_v3(gid);
end $f$;

create or replace function public.cw_dean_ab_summary_v3(p_gid uuid)
returns jsonb language plpgsql security invoker set search_path=public as $f$
declare samples int;students int;observed_t numeric;observed_c numeric;true_ate numeric;
 treated_students int;control_students int;standard_error numeric;z numeric;
begin
 select count(*),count(distinct student_no),
  avg(observed_score) filter(where treatment=1),
  avg(observed_score) filter(where treatment=0),
  avg(y1_score-y0_score),count(distinct student_no) filter(where treatment=1),
  count(distinct student_no) filter(where treatment=0)
 into samples,students,observed_t,observed_c,true_ate,treated_students,control_students
 from public.cw_dean_ab_v3 where game_id=p_gid;
 if treated_students>1 and control_students>1 then
   select sqrt(coalesce(var_samp(avg_score) filter(where treatment=1),0)/treated_students
    +coalesce(var_samp(avg_score) filter(where treatment=0),0)/control_students)
   into standard_error from (
      select student_no,max(treatment) treatment,avg(observed_score) avg_score
      from public.cw_dean_ab_v3 where game_id=p_gid group by student_no
   ) t;
 end if;
 return jsonb_build_object('observations',samples,'students',students,'treated_students',treated_students,
  'control_students',control_students,'treated_mean',round(observed_t,3),
  'control_mean',round(observed_c,3),
  'observed_ate',round(observed_t-observed_c,3),
  'se_student_cluster',round(standard_error,3),
  'ci95_low',round(observed_t-observed_c-1.96*standard_error,3),
  'ci95_high',round(observed_t-observed_c+1.96*standard_error,3),
  'true_ate',round(true_ate,3),'truth_source','synthetic_potential_outcomes',
  'assignment_level','student','replications',15);
end $f$;

-- Data-layer contract for notebook consumers. Potential outcomes withheld from students.
create or replace function public.cw_dean_ab_observed_v3(p_hash text)
returns jsonb language plpgsql security invoker set search_path=public as $f$
declare p public.cw_dean_players;phase text;data jsonb;summary jsonb;
begin
 select * into p from public.cw_dean_players where token_hash=p_hash;
 if p.id is null then raise exception 'Sesión inválida';end if;
 select t.phase into phase from public.cw_dean_tournaments t where t.game_id=p.game_id;
 if phase not in ('causal','final','finished') then raise exception 'Todavía no se libera el experimento A/B';end if;
 select coalesce(jsonb_agg(jsonb_build_array('ab_'||lpad(student_no::text,2,'0'),exam_no,
   archetype,pga_prior,subject_name,complexity,treatment,wellness_hours,study_hours,sleep_hours,observed_score)
   order by student_no,exam_no),'[]'::jsonb) into data
 from public.cw_dean_ab_v3 where game_id=p.game_id;
 return jsonb_build_object('columns',jsonb_build_array('estudiante_id','examen_nro','arquetipo',
 'pga_previo','asignatura','complejidad','tratamiento','horas_bienestar_sem',
 'horas_estudio','horas_sueno','nota_final'),'rows',data,
 'note','30 synthetic students; independent AB not drawn from live game decisions');
end $f$;

create or replace function public.cw_dean_ab_teacher_v3(p_fac_token text)
returns jsonb language plpgsql security invoker set search_path=public as $f$
declare gid uuid;phase text;data jsonb;
begin
 select public.cw_validate_facilitator_token(p_fac_token) into gid;
 if gid is null then raise exception 'Docente inválido';end if;
 select t.phase into phase from public.cw_dean_tournaments t where t.game_id=gid;
 if phase not in ('causal','final','finished') then raise exception 'Todavía no está revelada la verdad A/B';end if;
 select coalesce(jsonb_agg(jsonb_build_array('ab_'||lpad(student_no::text,2,'0'),exam_no,treatment,
 y0_score,y1_score,y1_score-y0_score,u0_fatigue,u1_fatigue)
 order by student_no,exam_no),'[]'::jsonb) into data
 from public.cw_dean_ab_v3 where game_id=gid;
 return jsonb_build_object('columns',jsonb_build_array('estudiante_id','examen_nro','tratamiento',
 'y0','y1','efecto_causal_sintetico','fatiga_u0','fatiga_u1'),
 'rows',data,'summary',public.cw_dean_ab_summary_v3(gid));
end $f$;

revoke all on public.cw_dean_ab_v3 from public,anon,authenticated;
revoke all on function public.cw_dean_ab_generate_v3(text) from public,anon,authenticated;
revoke all on function public.cw_dean_ab_summary_v3(uuid) from public,anon,authenticated;
revoke all on function public.cw_dean_ab_observed_v3(text) from public,anon,authenticated;
revoke all on function public.cw_dean_ab_teacher_v3(text) from public,anon,authenticated;
grant execute on function public.cw_dean_ab_generate_v3(text) to service_role;
grant execute on function public.cw_dean_ab_summary_v3(uuid) to service_role;
grant execute on function public.cw_dean_ab_observed_v3(text) to service_role;
grant execute on function public.cw_dean_ab_teacher_v3(text) to service_role;
