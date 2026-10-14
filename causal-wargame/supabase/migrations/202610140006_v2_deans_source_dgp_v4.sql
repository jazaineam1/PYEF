-- CUP V2: optional canonically specified DGP v4, strictly versioned.
-- Original source: chapter-causalidad-master.zip:
-- config/simulation_parameters.toml and core/{fatigue,scorer,ab_experiment}.py
-- Previous tournaments retain legacy_v1 and old game semantics.
alter table public.cw_dean_tournaments
 add column if not exists dgp_version text not null default 'legacy_v1'
 check (dgp_version in ('legacy_v1','source_v4'));
alter table public.cw_dean_tournaments alter column dgp_version set default 'source_v4';
alter table public.cw_dean_tournaments
 add column if not exists dgp_seed integer not null default 2026;

create or replace function public.cw_dean_source_catalog(p_exam integer)
returns jsonb language sql immutable set search_path=public as $f$
 select case ((p_exam-1)%11)
 when 0 then jsonb_build_object('name','Cálculo Multivariable','z',9.0)
 when 1 then jsonb_build_object('name','Física Mecánica y Ondas','z',8.5)
 when 2 then jsonb_build_object('name','Econometría Aplicada','z',8.0)
 when 3 then jsonb_build_object('name','Estructuras de Datos y Algoritmos','z',7.5)
 when 4 then jsonb_build_object('name','Estadística y Probabilidad','z',7.0)
 when 5 then jsonb_build_object('name','Bases de Datos Relacionales','z',6.0)
 when 6 then jsonb_build_object('name','Metodología de la Investigación','z',4.5)
 when 7 then jsonb_build_object('name','Fundamentos de Gestión y Finanzas','z',4.0)
 when 8 then jsonb_build_object('name','Innovación y Emprendimiento','z',3.5)
 when 9 then jsonb_build_object('name','Comunicación Oral y Escrita','z',3.0)
 else jsonb_build_object('name','Ética Profesional y Ciudadanía','z',2.5) end;
$f$;

-- Deterministic Box-Muller standard normal based on tournament+player+exam.
-- Numeric noise is stochastic in distribution but differs from numpy PCG64's bitstream.
create or replace function public.cw_dean_source_noise(p_game uuid,p_player uuid,p_exam integer,p_seed integer,p_kind text)
returns double precision language sql immutable set search_path=public as $f$
 select sqrt(-2.0*ln((get_byte(d,0)+0.5)/256.0))*
 cos(2.0*pi()*(get_byte(d,1)+0.5)/256.0)
 from (select extensions.digest(p_seed::text||':'||p_game::text||':'||p_player::text||':'||p_exam::text||':'||p_kind,'sha256') d) z;
$f$;

-- Matches the exact structural coefficients, logistic curve, all-nighter shock
-- and clipping behaviour from CognitiveFatigueModel.calculate_fatigue.
create or replace function public.cw_dean_source_fatigue(
 p_study double precision,p_sleep double precision,p_wellness double precision,
 p_complexity double precision,p_noise double precision default 0)
returns double precision language sql immutable set search_path=public as $f$
 select least(100.0,greatest(0.0,
 10.0+60.0/(1+exp((p_sleep-4.0)*1.2))
 +2.0*greatest(0.0,p_study-3.0)
 +case when p_sleep<4.0 and p_study>8.0 then 15.0 else 0.0 end
 +1.5*greatest(0.0,p_complexity-5.0)
 -4.5*least(p_wellness,6.0)
 +p_noise));
$f$;

-- Matches CausalExamScorer.calculate_score, Y in [0,50], Colombian grading.
create or replace function public.cw_dean_source_grade(
 p_pga double precision,p_complexity double precision,p_study double precision,
 p_sleep double precision,p_wellness double precision,p_fatigue double precision,
 p_noise double precision default 0)
returns numeric language sql immutable set search_path=public as $f$
 select round(least(50.0,greatest(0.0,
 30.0+10.0*(p_pga-3.5)-1.8*(p_complexity-5.5)
 +2.6*(p_study-4.0)+0.8*(p_sleep-7.5)
 +0.5*least(p_wellness,6.0)
 -0.15*greatest(0.0,p_fatigue-20.0)
 -0.12*power(greatest(0.0,p_fatigue-60.0),1.25)
 +p_noise))::numeric,1);
$f$;

create or replace function public.cw_dean_source_state(p_code text,p_hash text default null)
returns jsonb language plpgsql security invoker set search_path=public as $f$
declare version text;
begin
 select coalesce(t.dgp_version,'legacy_v1') into version from public.cw_games g
 left join public.cw_dean_tournaments t on t.game_id=g.id where g.code=upper(btrim(p_code));
 return public.cw_dean_state(p_code,p_hash) || jsonb_build_object('dgp_version',coalesce(version,'legacy_v1'));
end $f$;

-- Adjust risk PGA distribution from prototype [2,3.2] to canonical TOML [2,3.0],
-- keeping all existing participants untouched.
create or replace function public.cw_dean_source_join(
 p_code text,p_alias text,p_room integer,p_token_hash text)
returns jsonb language plpgsql security invoker set search_path=public as $f$
declare state jsonb; gid uuid; v text;
begin
 state:=public.cw_dean_join(p_code,p_alias,p_room,p_token_hash);
 select g.id,t.dgp_version into gid,v from public.cw_games g
 join public.cw_dean_tournaments t on t.game_id=g.id where g.code=upper(btrim(p_code));
 if v='source_v4' then
  update public.cw_dean_players set pga_prior=round((2.0+(pga_prior-2.0)/1.2)::numeric,1)
  where game_id=gid and token_hash=p_token_hash and archetype='risk'
  and pga_prior>3.0;
 end if;
 return public.cw_dean_source_state(p_code,p_token_hash);
end $f$;

create or replace function public.cw_dean_source_exam(
 p_token_hash text,p_exam integer,p_study numeric,p_sleep numeric,p_wellness numeric,
 p_auto boolean default false)
returns jsonb language plpgsql security invoker set search_path=public as $f$
declare
 p public.cw_dean_players;g public.cw_dean_tournaments;r public.cw_dean_exam_records;
 previous integer;limits numeric[];catalog jsonb;z double precision;noise double precision;
 fatigue double precision;grade numeric;min_s numeric;max_s numeric;min_sleep numeric;
 max_sleep numeric;min_w numeric;max_w numeric;
begin
 select * into p from public.cw_dean_players where token_hash=p_token_hash for update;
 if p.id is null then raise exception 'Sesión inválida';end if;
 select * into g from public.cw_dean_tournaments where game_id=p.game_id;
 if g.dgp_version<>'source_v4' then
  return public.cw_dean_exam(p_token_hash,p_exam,p_study,p_sleep,p_wellness,p_auto);
 end if;
 if g.phase<>'exams' then raise exception 'Exámenes cerrados';end if;
 if p_exam not between 1 and 15 then raise exception 'Examen inválido';end if;
 select * into r from public.cw_dean_exam_records where player_id=p.id and exam_no=p_exam;
 if r.player_id is not null then
  return jsonb_build_object('submitted',true,'already_submitted',true,'exam_no',p_exam,
     'score',r.exam_score,'subject',r.subject_name,'completed',
     (select count(*) from public.cw_dean_exam_records where player_id=p.id));
 end if;
 select coalesce(max(exam_no),0) into previous from public.cw_dean_exam_records where player_id=p.id;
 if p_exam<>previous+1 then raise exception 'Ronda fuera de secuencia';end if;
 -- UI slider ranges per SPECS_JUEGO_UX_UI.md; DGP structural parameters from TOML.
 case p.archetype
 when 'over' then min_s:=5;max_s:=14;min_sleep:=1;max_sleep:=5;min_w:=0;max_w:=1.5;
 when 'balanced' then min_s:=2;max_s:=9;min_sleep:=6;max_sleep:=9;min_w:=1;max_w:=6;
 when 'risk' then min_s:=2;max_s:=9;min_sleep:=4;max_sleep:=7.5;min_w:=0;max_w:=4;
 else min_s:=0;max_s:=5;min_sleep:=6.5;max_sleep:=10;min_w:=0;max_w:=6;
 end case;
 if p_study is null or p_sleep is null or p_wellness is null or
 p_study<min_s or p_study>max_s or p_sleep<min_sleep or p_sleep>max_sleep
 or p_wellness<min_w or p_wellness>max_w then
  raise exception 'Fuera del rango de estrategia correspondiente al perfil';end if;
 catalog:=public.cw_dean_source_catalog(p_exam);
 z:=(catalog->>'z')::double precision;
 noise:=public.cw_dean_source_noise(p.game_id,p.id,p_exam,g.dgp_seed,'exam');
 fatigue:=public.cw_dean_source_fatigue(p_study::float8,p_sleep::float8,p_wellness::float8,z,2*noise);
 grade:=public.cw_dean_source_grade(p.pga_prior::float8,z,p_study::float8,
  p_sleep::float8,p_wellness::float8,fatigue,1.6*noise);
 insert into public.cw_dean_exam_records(game_id,player_id,exam_no,subject_name,complexity,
 study_hours,sleep_hours,wellness_hours,hidden_fatigue,exam_score,auto_simulated)
 values(p.game_id,p.id,p_exam,catalog->>'name',z,p_study,p_sleep,p_wellness,
 round(fatigue::numeric,2),grade,coalesce(p_auto,false));
 return jsonb_build_object('submitted',true,'already_submitted',false,'exam_no',p_exam,
 'score',grade,'subject',catalog->>'name','completed',p_exam);
end $f$;

create or replace function public.cw_dean_source_auto_finish(p_hash text)
returns jsonb language plpgsql security invoker set search_path=public as $f$
declare p public.cw_dean_players;g public.cw_dean_tournaments;start_exam int;i int;r jsonb;
begin
 select * into p from public.cw_dean_players where token_hash=p_hash for update;
 if p.id is null then raise exception 'Sesión inválida';end if;
 select * into g from public.cw_dean_tournaments where game_id=p.game_id;
 if g.dgp_version<>'source_v4' then return public.cw_dean_auto_finish(p_hash);end if;
 select coalesce(max(exam_no),0)+1 into start_exam from public.cw_dean_exam_records where player_id=p.id;
 for i in start_exam..15 loop
  case p.archetype
  when 'over' then r:=public.cw_dean_source_exam(p_hash,i,10,3.5,1,true);
  when 'balanced' then r:=public.cw_dean_source_exam(p_hash,i,6,7.5,3.5,true);
  when 'risk' then r:=public.cw_dean_source_exam(p_hash,i,5,5.5,1,true);
  else r:=public.cw_dean_source_exam(p_hash,i,2,8.5,2.5,true);
  end case;
 end loop;
 return jsonb_build_object('completed',15,'auto_generated_from',start_exam,
 'note','La estrategia rápida está marcada en el dataset docente');
end $f$;

revoke all on function public.cw_dean_source_catalog(integer) from public,anon,authenticated;
revoke all on function public.cw_dean_source_noise(uuid,uuid,integer,integer,text) from public,anon,authenticated;
revoke all on function public.cw_dean_source_fatigue(double precision,double precision,double precision,double precision,double precision) from public,anon,authenticated;
revoke all on function public.cw_dean_source_grade(double precision,double precision,double precision,double precision,double precision,double precision,double precision) from public,anon,authenticated;
revoke all on function public.cw_dean_source_state(text,text) from public,anon,authenticated;
revoke all on function public.cw_dean_source_join(text,text,integer,text) from public,anon,authenticated;
revoke all on function public.cw_dean_source_exam(text,integer,numeric,numeric,numeric,boolean) from public,anon,authenticated;
revoke all on function public.cw_dean_source_auto_finish(text) from public,anon,authenticated;
grant execute on function public.cw_dean_source_catalog(integer) to service_role;
grant execute on function public.cw_dean_source_noise(uuid,uuid,integer,integer,text) to service_role;
grant execute on function public.cw_dean_source_fatigue(double precision,double precision,double precision,double precision,double precision) to service_role;
grant execute on function public.cw_dean_source_grade(double precision,double precision,double precision,double precision,double precision,double precision,double precision) to service_role;
grant execute on function public.cw_dean_source_state(text,text) to service_role;
grant execute on function public.cw_dean_source_join(text,text,integer,text) to service_role;
grant execute on function public.cw_dean_source_exam(text,integer,numeric,numeric,numeric,boolean) to service_role;
grant execute on function public.cw_dean_source_auto_finish(text) to service_role;
