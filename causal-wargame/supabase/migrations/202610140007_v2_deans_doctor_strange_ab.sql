-- CUP V2 only: counterfactual A/B based on supplied ABExperimentSimulator.
-- Treatment T randomized at STUDENT level; B0=0, B1=4.
-- Potential outcome disturbances shared across both worlds.
create table if not exists public.cw_dean_source_ab_records(
 game_id uuid not null references public.cw_dean_tournaments(game_id) on delete cascade,
 player_id uuid not null references public.cw_dean_players(id) on delete cascade,
 exam_no integer not null check(exam_no between 1 and 15),
 subject_name text not null,
 archetype text not null,
 pga_prior numeric(3,1) not null,
 complexity numeric(4,1) not null,
 treatment integer not null check(treatment in (0,1)),
 wellness_observed numeric(3,1) not null,
 study_observed numeric(4,1) not null,
 sleep_observed numeric(4,1) not null,
 y_observed numeric(4,1) not null,
 study_0 numeric(4,1) not null,
 study_1 numeric(4,1) not null,
 sleep_0 numeric(4,1) not null,
 sleep_1 numeric(4,1) not null,
 fatigue_0 numeric(5,2) not null,
 fatigue_1 numeric(5,2) not null,
 y0 numeric(4,1) not null,
 y1 numeric(4,1) not null,
 tau numeric(5,1) not null,
 created_at timestamptz not null default clock_timestamp(),
 primary key(player_id,exam_no)
);
create index if not exists cw_dean_source_ab_game_idx on public.cw_dean_source_ab_records(game_id,exam_no);
alter table public.cw_dean_source_ab_records enable row level security;
revoke all on public.cw_dean_source_ab_records from public,anon,authenticated;
grant select,insert,update,delete on public.cw_dean_source_ab_records to service_role;

-- Default source AB world parameters from source config TOML.
create or replace function public.cw_dean_source_ab_potential(
 p_game uuid,p_player uuid,p_exam integer,p_seed integer,p_archetype text,
 p_pga double precision,p_wellness double precision)
returns jsonb language plpgsql immutable set search_path=public as $f$
declare
 catalog jsonb;z double precision;bs double precision;bw double precision;ss double precision;
 lo_s double precision;hi_s double precision;lo_sleep double precision;hi_sleep double precision;
 study double precision;sleep double precision;fatigue double precision;score numeric;noise double precision;
begin
 if p_exam not between 1 and 15 then raise exception 'Examen fuera de rango';end if;
 catalog:=public.cw_dean_source_catalog(p_exam);z:=(catalog->>'z')::float8;
 case p_archetype
 when 'over' then bs:=11.5;ss:=3.5;bw:=0.6;lo_s:=8;hi_s:=14;lo_sleep:=2;hi_sleep:=5;
 when 'balanced' then bs:=6;ss:=7.5;bw:=2.5;lo_s:=4;hi_s:=8;lo_sleep:=6.5;hi_sleep:=8.5;
 when 'risk' then bs:=3.5;ss:=6;bw:=2.5;lo_s:=2;hi_s:=5.5;lo_sleep:=4.5;hi_sleep:=7;
 when 'pragmatic' then bs:=1.5;ss:=8.5;bw:=4.8;lo_s:=0.5;hi_s:=3.5;lo_sleep:=7;hi_sleep:=9.5;
 else raise exception 'Arquetipo desconocido';
 end case;
 -- Cross-world disturbances for X1,S are frozen, following Doctor Strange.
 study:=round(least(hi_s,greatest(lo_s,bs+0.3*(z-5.5)-0.7*(p_wellness-bw)
 +0.5*public.cw_dean_source_noise(p_game,p_player,p_exam,p_seed,'study')))::numeric,1);
 sleep:=round(least(hi_sleep,greatest(lo_sleep,ss-0.25*(study-bs)+0.2*(p_wellness-bw)
 +0.4*public.cw_dean_source_noise(p_game,p_player,p_exam,p_seed,'sleep')))::numeric,1);
 noise:=public.cw_dean_source_noise(p_game,p_player,p_exam,p_seed,'ab');
 fatigue:=public.cw_dean_source_fatigue(study,sleep,p_wellness,z,2*noise);
 score:=public.cw_dean_source_grade(p_pga,z,study,sleep,p_wellness,fatigue,1.6*noise);
 return jsonb_build_object('study',study,'sleep',sleep,'fatigue',round(fatigue::numeric,2),
 'score',score,'complexity',z,'subject',catalog->>'name');
end $f$;

create or replace function public.cw_dean_source_ab_generate(p_fac_token text)
returns jsonb language plpgsql security invoker set search_path=public as $f$
declare gid uuid;g public.cw_dean_tournaments;p public.cw_dean_players;world0 jsonb;world1 jsonb;
 i integer;t integer;complete_count integer;players integer;
begin
 select public.cw_validate_facilitator_token(p_fac_token) into gid;
 if gid is null then raise exception 'Docente sin autorización';end if;
 select * into g from public.cw_dean_tournaments where game_id=gid for update;
 if g.dgp_version<>'source_v4' then raise exception 'Experimento solo en nueva Copa DGP v4';end if;
 if g.phase not in ('causal','final','finished') then raise exception 'Debes llegar a la fase causal';end if;
 select count(*) into players from public.cw_dean_players where game_id=gid;
 if players=0 then raise exception 'Sin participantes';end if;
 select count(*) into complete_count from public.cw_dean_players p where p.game_id=gid and
 (select count(*) from public.cw_dean_exam_records e where e.player_id=p.id)=15;
 if complete_count<>players then
   raise exception 'Faltan % estudiantes por completar el semestre',players-complete_count;
 end if;
 for p in select * from public.cw_dean_players where game_id=gid order by joined_at,id loop
  t:=case when public.cw_dean_source_noise(gid,p.id,0,g.dgp_seed,'treatment')<0 then 1 else 0 end;
  for i in 1..15 loop
   world0:=public.cw_dean_source_ab_potential(gid,p.id,i,g.dgp_seed,p.archetype,p.pga_prior::float8,0);
   world1:=public.cw_dean_source_ab_potential(gid,p.id,i,g.dgp_seed,p.archetype,p.pga_prior::float8,4);
   insert into public.cw_dean_source_ab_records(game_id,player_id,exam_no,subject_name,
    archetype,pga_prior,complexity,treatment,wellness_observed,study_observed,sleep_observed,
    y_observed,study_0,study_1,sleep_0,sleep_1,fatigue_0,fatigue_1,y0,y1,tau)
   values(gid,p.id,i,world0->>'subject',p.archetype,p.pga_prior,(world0->>'complexity')::numeric,
   t,case when t=1 then 4 else 0 end,
   case when t=1 then (world1->>'study')::numeric else (world0->>'study')::numeric end,
   case when t=1 then (world1->>'sleep')::numeric else (world0->>'sleep')::numeric end,
   case when t=1 then (world1->>'score')::numeric else (world0->>'score')::numeric end,
   (world0->>'study')::numeric,(world1->>'study')::numeric,
   (world0->>'sleep')::numeric,(world1->>'sleep')::numeric,
   (world0->>'fatigue')::numeric,(world1->>'fatigue')::numeric,
   (world0->>'score')::numeric,(world1->>'score')::numeric,
   (world1->>'score')::numeric-(world0->>'score')::numeric)
   on conflict(player_id,exam_no) do nothing;
  end loop;
 end loop;
 return public.cw_dean_source_ab_truth(p_fac_token);
end $f$;

create or replace function public.cw_dean_source_ab_truth(p_fac_token text)
returns jsonb language plpgsql security invoker set search_path=public as $f$
declare gid uuid;ate numeric;observed numeric;by_archetype jsonb;cnt int;
begin
 select public.cw_validate_facilitator_token(p_fac_token) into gid;
 if gid is null then raise exception 'Credencial docente inválida';end if;
 if (select phase from public.cw_dean_tournaments where game_id=gid) not in ('causal','final','finished') then
   raise exception 'Verdad sintética oculta durante la captura de datos';end if;
 select count(*),round(avg(tau),3) into cnt,ate from public.cw_dean_source_ab_records where game_id=gid;
 select round(avg(t.y_observed) filter(where t.treatment=1)-
     avg(t.y_observed) filter(where t.treatment=0),3) into observed
 from public.cw_dean_source_ab_records t where game_id=gid;
 select coalesce(jsonb_agg(to_jsonb(t) order by t.archetype),'[]'::jsonb) into by_archetype from
 (select archetype,count(*)::int exams,round(avg(tau),3) true_cate
 from public.cw_dean_source_ab_records where game_id=gid group by archetype) t;
 return jsonb_build_object('observations',cnt,'true_ate',ate,'observed_diff',observed,
 'cate_by_archetype',by_archetype,'intervention','do(B=4) vs do(B=0)',
 'truth','Synthetic counterfactuals, not simultaneous real outcomes');
end $f$;

create or replace function public.cw_dean_source_ab_student(p_hash text)
returns jsonb language plpgsql security invoker set search_path=public as $f$
declare p public.cw_dean_players;ph text;cnt int;n_t int;n_c int;diff numeric;
begin
 select * into p from public.cw_dean_players where token_hash=p_hash;
 if p.id is null then raise exception 'Sesión inválida';end if;
 select phase into ph from public.cw_dean_tournaments where game_id=p.game_id;
 if ph not in ('causal','final','finished') then raise exception 'Experimento no revelado';end if;
 select count(*),count(*) filter(where treatment=1),count(*) filter(where treatment=0),
 round(avg(y_observed) filter(where treatment=1)-avg(y_observed) filter(where treatment=0),3)
 into cnt,n_t,n_c,diff from public.cw_dean_source_ab_records where game_id=p.game_id;
 return jsonb_build_object('observations',cnt,'treated_exams',n_t,'control_exams',n_c,
 'observed_difference',diff,'intervention','do(B=4) vs do(B=0)',
 'note','La diferencia observada no es la verdad contrafactual individual.');
end $f$;

create or replace function public.cw_dean_source_ab_student_export(p_hash text)
returns jsonb language plpgsql security invoker set search_path=public as $f$
declare p public.cw_dean_players;phase text;dataset jsonb;
begin
 select * into p from public.cw_dean_players where token_hash=p_hash;
 if p.id is null then raise exception 'Sesión inválida';end if;
 select t.phase into phase from public.cw_dean_tournaments t where t.game_id=p.game_id;
 if phase not in ('causal','final','finished') then raise exception 'A/B aún no publicado';end if;
 select coalesce(jsonb_agg(jsonb_build_array(e.exam_no,e.subject_name,e.pga_prior,e.complexity,
 e.archetype,e.treatment,e.wellness_observed,e.study_observed,e.sleep_observed,e.y_observed)
 order by e.player_id,e.exam_no),'[]'::jsonb) into dataset
 from public.cw_dean_source_ab_records e where e.game_id=p.game_id;
 return jsonb_build_object('columns',jsonb_build_array('examen_nro','asignatura','pga_previo',
 'complejidad','arquetipo','tratamiento','horas_bienestar_sem','horas_estudio',
 'horas_sueno','nota_final'),'rows',dataset);
end $f$;

revoke all on public.cw_dean_source_ab_records from public,anon,authenticated;
revoke all on function public.cw_dean_source_ab_potential(uuid,uuid,integer,integer,text,double precision,double precision) from public,anon,authenticated;
revoke all on function public.cw_dean_source_ab_generate(text) from public,anon,authenticated;
revoke all on function public.cw_dean_source_ab_truth(text) from public,anon,authenticated;
revoke all on function public.cw_dean_source_ab_student(text) from public,anon,authenticated;
revoke all on function public.cw_dean_source_ab_student_export(text) from public,anon,authenticated;
grant execute on function public.cw_dean_source_ab_potential(uuid,uuid,integer,integer,text,double precision,double precision) to service_role;
grant execute on function public.cw_dean_source_ab_generate(text) to service_role;
grant execute on function public.cw_dean_source_ab_truth(text) to service_role;
grant execute on function public.cw_dean_source_ab_student(text) to service_role;
grant execute on function public.cw_dean_source_ab_student_export(text) to service_role;
