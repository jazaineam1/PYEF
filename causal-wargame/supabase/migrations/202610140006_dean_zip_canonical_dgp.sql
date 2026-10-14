-- CAMPUS V2 / Copa del Decano: canonical ZIP simulation, isolated by DGP version.
-- Existing FUTUROS exam records are NEVER overwritten or recalculated.
alter table public.cw_dean_tournaments
 add column if not exists dgp_version text not null default 'legacy_v1';
comment on column public.cw_dean_tournaments.dgp_version is
 'legacy_v1 keeps historical records; zip_dgp_2026 corresponds to canonical scorer.py, fatigue.py and simulation_parameters.toml';

-- 11 canonical subjects repeat across the 15 exams, exactly as in the source catalog.
create or replace function public.cw_dean_subject_v3(p_exam integer)
returns jsonb language sql immutable as $f$
 select jsonb_build_object('name',a.names[1+((p_exam-1)%11)],
    'complexity',a.difficulty[1+((p_exam-1)%11)])
 from (select array['Cálculo Multivariable','Física Mecánica y Ondas',
 'Econometría Aplicada','Estructuras de Datos y Algoritmos',
 'Estadística y Probabilidad','Bases de Datos Relacionales',
 'Metodología de la Investigación','Fundamentos de Gestión y Finanzas',
 'Innovación y Emprendimiento','Comunicación Oral y Escrita',
 'Ética Profesional y Ciudadanía']::text[] names,
 array[9.0,8.5,8.0,7.5,7.0,6.0,4.5,4.0,3.5,3.0,2.5]::numeric[] difficulty) a
 where p_exam between 1 and 15
$f$;

-- Deterministic Box-Muller normal: auditability and same error under Y(0)/Y(1).
-- This replicates structural TOML coefficients, not NumPy's PRNG bitstream.
create or replace function public.cw_dean_normal_v3(p_key text)
returns double precision language sql immutable as $f$
 select sqrt(-2.0*ln(greatest(1e-12,((('x'||substr(md5(p_key||':u1'),1,8))::bit(32)::bigint+0.5)/4294967296.0))))
 *cos(2.0*pi()*((('x'||substr(md5(p_key||':u2'),1,8))::bit(32)::bigint+0.5)/4294967296.0))
$f$;

create or replace function public.cw_dean_uniform_v3(p_key text)
returns double precision language sql immutable as $f$
 select ((('x'||substr(md5(p_key),1,8))::bit(32)::bigint+0.5)/4294967296.0)
$f$;

create or replace function public.cw_dean_score_v3(
 p_pga numeric,p_complexity numeric,p_study numeric,p_sleep numeric,
 p_wellness numeric,p_seed text)
returns jsonb language plpgsql immutable as $f$
declare u double precision;y double precision;fatigue_penalty double precision; shock double precision;
begin
 if p_pga not between 0 and 5 or p_complexity not between 1 and 10
 or p_study not between 0 and 14 or p_sleep not between 0 and 10
 or p_wellness not between 0 and 6 then raise exception 'Parámetros del DGP fuera de rango';end if;
 shock:=case when p_sleep<4 and p_study>8 then 15.0 else 0.0 end;
 u:=least(100.0,greatest(0.0,
    10.0 + 60.0/(1.0+exp((p_sleep::double precision-4.0)*1.2))
    +2.0*greatest(0.0,p_study::double precision-3.0)
    +shock+1.5*greatest(0.0,p_complexity::double precision-5.0)
    -4.5*least(p_wellness::double precision,6.0)
    +2.0*public.cw_dean_normal_v3(p_seed||':fatigue')));
 fatigue_penalty:=0.15*greatest(0.0,u-20.0)
    +0.12*power(greatest(0.0,u-60.0),1.25);
 y:=least(50.0,greatest(0.0,
    30.0+10.0*(p_pga::double precision-3.5)
    -1.8*(p_complexity::double precision-5.5)
    +2.6*(p_study::double precision-4.0)
    +0.8*(p_sleep::double precision-7.5)
    +0.5*least(p_wellness::double precision,6.0)
    -fatigue_penalty+1.6*public.cw_dean_normal_v3(p_seed||':exam')));
 return jsonb_build_object('fatiga_latente',round(u::numeric,4),'nota_final',round(y::numeric,1),
    'dgp','zip_dgp_2026');
end $f$;

-- Facilitator can opt in only when creating a NEW tournament; existing games stay legacy.
create or replace function public.cw_dean_create_v3(p_token text)
returns jsonb language plpgsql security invoker set search_path=public as $f$
declare gid uuid;prior text;code text;
begin
 select public.cw_validate_facilitator_token(p_token) into gid;
 if gid is null then raise exception 'Credencial docente inválida';end if;
 select phase into prior from public.cw_dean_tournaments where game_id=gid for update;
 if prior is not null then
   return public.cw_dean_state_v3((select g.code from public.cw_games g where g.id=gid),null);
 end if;
 insert into public.cw_dean_tournaments(game_id,dgp_version)
 values(gid,'zip_dgp_2026');
 select g.code into code from public.cw_games g where g.id=gid;
 return public.cw_dean_state_v3(code,null);
end $f$;

create or replace function public.cw_dean_state_v3(p_code text,p_hash text default null)
returns jsonb language plpgsql security invoker set search_path=public as $f$
declare original jsonb;ver text;gid uuid;
begin
 original:=public.cw_dean_state(p_code,p_hash);
 select t.dgp_version into ver from public.cw_dean_tournaments t join public.cw_games g on g.id=t.game_id
 where g.code=upper(trim(p_code));
 return original||jsonb_build_object('dgp_version',coalesce(ver,'legacy_v1'),
  'canonical_source','chapter-causalidad-master/config/simulation_parameters.toml',
  'dgp_updated_on','2026-10-14');
end $f$;

create or replace function public.cw_dean_join_v3(p_code text,p_alias text,p_room integer,p_token_hash text)
returns jsonb language plpgsql security invoker set search_path=public as $f$
declare prior_id uuid;data jsonb;new_id uuid;new_type text;version_name text;
begin
 select id into prior_id from public.cw_dean_players where token_hash=p_token_hash;
 data:=public.cw_dean_join(p_code,p_alias,p_room,p_token_hash);
 select dgp_version into version_name from public.cw_dean_tournaments t
 join public.cw_games g on g.id=t.game_id where g.code=upper(trim(p_code));
 if prior_id is null and version_name='zip_dgp_2026' then
  select id,archetype into new_id,new_type from public.cw_dean_players
   where token_hash=p_token_hash;
  update public.cw_dean_players set pga_prior=
   round((case new_type when 'over' then 3.8+random()
    when 'balanced' then 3.4+0.9*random()
    when 'risk' then 2.0+1.0*random()
    else 3.0+0.6*random() end)::numeric,1)
   where id=new_id and not exists(select 1 from public.cw_dean_exam_records where player_id=new_id);
 end if;
 return public.cw_dean_state_v3(p_code,p_token_hash);
end $f$;

-- Revision-safe replacement entry; historic tournaments dispatch to original scorer.
create or replace function public.cw_dean_exam_v3(
 p_token_hash text,p_exam integer,p_study numeric,p_sleep numeric,
 p_wellness numeric,p_auto boolean default false)
returns jsonb language plpgsql security invoker set search_path=public as $f$
declare p public.cw_dean_players;version_name text;phase text;exam_subject jsonb;
 previous integer;existing public.cw_dean_exam_records;outcome jsonb;
 b numeric:=p_wellness;h numeric:=p_study;s numeric:=p_sleep;
 lo_h numeric;hi_h numeric;lo_s numeric;hi_s numeric;lo_b numeric;hi_b numeric;
begin
 select * into p from public.cw_dean_players where token_hash=p_token_hash for update;
 if p.id is null then raise exception 'Estudiante inválido';end if;
 select dgp_version,phase into version_name,phase from public.cw_dean_tournaments where game_id=p.game_id;
 if version_name is distinct from 'zip_dgp_2026' then
   return public.cw_dean_exam(p_token_hash,p_exam,p_study,p_sleep,p_wellness,p_auto);
 end if;
 if phase<>'exams' then raise exception 'Fase de exámenes cerrada';end if;
 if p_exam not between 1 and 15 then raise exception 'Examen fuera de rango';end if;
 select * into existing from public.cw_dean_exam_records where player_id=p.id and exam_no=p_exam;
 if existing.player_id is not null then
  return jsonb_build_object('exam_no',p_exam,'score',existing.exam_score,'subject',existing.subject_name,
    'submitted',true,'already_submitted',true,
    'completed',(select count(*) from public.cw_dean_exam_records where player_id=p.id));
 end if;
 select coalesce(max(exam_no),0) into previous from public.cw_dean_exam_records where player_id=p.id;
 if p_exam<>previous+1 then raise exception 'Rinde el siguiente parcial en orden';end if;
 case p.archetype
  when 'over' then lo_h:=8;hi_h:=14;lo_s:=2;hi_s:=5;lo_b:=0;hi_b:=1.5;
  when 'balanced' then lo_h:=4;hi_h:=8;lo_s:=6.5;hi_s:=8.5;lo_b:=1.5;hi_b:=3.5;
  when 'risk' then lo_h:=2;hi_h:=5.5;lo_s:=4.5;hi_s:=7;lo_b:=1.5;hi_b:=4;
  else lo_h:=0.5;hi_h:=3.5;lo_s:=7;hi_s:=9.5;lo_b:=3.5;hi_b:=6;
 end case;
 if h is null or s is null or b is null or h<lo_h or h>hi_h
 or s<lo_s or s>hi_s or b<lo_b or b>hi_b then
   raise exception 'Decisión fuera del rango del perfil canónico';end if;
 exam_subject:=public.cw_dean_subject_v3(p_exam);
 outcome:=public.cw_dean_score_v3(p.pga_prior,(exam_subject->>'complexity')::numeric,
 h,s,b,p.game_id::text||':'||p.id::text||':'||p_exam);
 insert into public.cw_dean_exam_records(
 game_id,player_id,exam_no,subject_name,complexity,study_hours,sleep_hours,wellness_hours,
 hidden_fatigue,exam_score,auto_simulated)
 values(p.game_id,p.id,p_exam,exam_subject->>'name',(exam_subject->>'complexity')::numeric,
 h,s,b,(outcome->>'fatiga_latente')::numeric,(outcome->>'nota_final')::numeric,coalesce(p_auto,false));
 return jsonb_build_object('exam_no',p_exam,'subject',exam_subject->>'name','score',outcome->'nota_final',
 'submitted',true,'already_submitted',false,'completed',p_exam,'dgp','zip_dgp_2026');
end $f$;

create or replace function public.cw_dean_auto_finish_v3(p_token_hash text)
returns jsonb language plpgsql security invoker set search_path=public as $f$
declare p public.cw_dean_players;ver text;next_exam integer;k integer;
 h numeric;s numeric;b numeric;res jsonb;
begin
 select * into p from public.cw_dean_players where token_hash=p_token_hash;
 if p.id is null then raise exception 'Sesión inválida';end if;
 select dgp_version into ver from public.cw_dean_tournaments where game_id=p.game_id;
 if ver is distinct from 'zip_dgp_2026' then return public.cw_dean_auto_finish(p_token_hash);end if;
 select coalesce(max(exam_no),0)+1 into next_exam from public.cw_dean_exam_records where player_id=p.id;
 case p.archetype
 when 'over' then h:=11.5;s:=3.5;b:=0.6;
 when 'balanced' then h:=6;s:=7.5;b:=2.5;
 when 'risk' then h:=3.5;s:=6;b:=2.5;
 else h:=1.5;s:=8.5;b:=4.8;
 end case;
 for k in next_exam..15 loop
   res:=public.cw_dean_exam_v3(p_token_hash,k,h,s,b,true);
 end loop;
 return jsonb_build_object('completed',(select count(*) from public.cw_dean_exam_records where player_id=p.id),
  'auto_generated_from',next_exam,'dgp',ver);
end $f$;

revoke all on function public.cw_dean_subject_v3(integer) from public,anon,authenticated;
revoke all on function public.cw_dean_normal_v3(text) from public,anon,authenticated;
revoke all on function public.cw_dean_uniform_v3(text) from public,anon,authenticated;
revoke all on function public.cw_dean_score_v3(numeric,numeric,numeric,numeric,numeric,text) from public,anon,authenticated;
revoke all on function public.cw_dean_create_v3(text) from public,anon,authenticated;
revoke all on function public.cw_dean_state_v3(text,text) from public,anon,authenticated;
revoke all on function public.cw_dean_join_v3(text,text,integer,text) from public,anon,authenticated;
revoke all on function public.cw_dean_exam_v3(text,integer,numeric,numeric,numeric,boolean) from public,anon,authenticated;
revoke all on function public.cw_dean_auto_finish_v3(text) from public,anon,authenticated;
grant execute on function public.cw_dean_subject_v3(integer) to service_role;
grant execute on function public.cw_dean_normal_v3(text) to service_role;
grant execute on function public.cw_dean_uniform_v3(text) to service_role;
grant execute on function public.cw_dean_score_v3(numeric,numeric,numeric,numeric,numeric,text) to service_role;
grant execute on function public.cw_dean_create_v3(text) to service_role;
grant execute on function public.cw_dean_state_v3(text,text) to service_role;
grant execute on function public.cw_dean_join_v3(text,text,integer,text) to service_role;
grant execute on function public.cw_dean_exam_v3(text,integer,numeric,numeric,numeric,boolean) to service_role;
grant execute on function public.cw_dean_auto_finish_v3(text) to service_role;
