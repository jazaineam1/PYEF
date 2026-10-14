-- V2 ONLY: isolated dean's cup, 30 students = 5 rooms x 6, 15 exams.
-- Facilitator identity is re-used from cw_games; dean students NEVER write cw_players.
create table if not exists public.cw_dean_tournaments(
 game_id uuid primary key references public.cw_games(id) on delete cascade,
 phase text not null default 'lobby' check(phase in ('lobby','exams','rector','survey','causal','final','finished')),
 created_at timestamptz not null default now(),
 revision integer not null default 0
);
create table if not exists public.cw_dean_players(
 id uuid primary key default gen_random_uuid(),
 game_id uuid not null references public.cw_dean_tournaments(game_id) on delete cascade,
 room_no integer not null check(room_no between 1 and 5),
 alias text not null check(length(alias) between 2 and 30),
 archetype text not null check(archetype in ('over','balanced','risk','pragmatic')),
 pga_prior numeric(3,1) not null check(pga_prior between 0 and 5),
 latent_resilience numeric not null,
 token_hash text not null unique check(length(token_hash)=64),
 joined_at timestamptz not null default clock_timestamp()
);
create unique index if not exists cw_dean_alias_ci on public.cw_dean_players(game_id,lower(alias));
create index if not exists cw_dean_room on public.cw_dean_players(game_id,room_no);
create table if not exists public.cw_dean_exam_records(
 game_id uuid not null references public.cw_dean_tournaments(game_id) on delete cascade,
 player_id uuid not null references public.cw_dean_players(id) on delete cascade,
 exam_no integer not null check(exam_no between 1 and 15),
 subject_name text not null,
 complexity numeric(4,2) not null,
 study_hours numeric(4,1) not null,
 sleep_hours numeric(4,1) not null,
 wellness_hours numeric(4,1) not null,
 hidden_fatigue numeric(5,2) not null,
 exam_score numeric(4,1) not null check(exam_score between 0 and 50),
 auto_simulated boolean not null default false,
 created_at timestamptz not null default clock_timestamp(),
 primary key(player_id,exam_no)
);
create index if not exists cw_dean_exam_game on public.cw_dean_exam_records(game_id,exam_no);
create table if not exists public.cw_dean_quiz_sessions(
 game_id uuid primary key references public.cw_dean_tournaments(game_id) on delete cascade,
 question_no integer not null default 0 check(question_no between 0 and 8),
 phase text not null default 'idle' check(phase in ('idle','preview','open','locked','reveal','podium','finished')),
 deadline_at timestamptz,
 version integer not null default 0
);
create table if not exists public.cw_dean_quiz_answers(
 game_id uuid not null references public.cw_dean_tournaments(game_id) on delete cascade,
 player_id uuid not null references public.cw_dean_players(id) on delete cascade,
 question_no integer not null references public.cw_v2_quiz_questions(question_no),
 choice text not null check(choice in ('a','b','c','d')),
 received_at timestamptz not null default clock_timestamp(),
 primary key(player_id,question_no)
);
create index if not exists cw_dean_quiz_ranking on public.cw_dean_quiz_answers(game_id,question_no);
alter table public.cw_dean_tournaments enable row level security;
alter table public.cw_dean_players enable row level security;
alter table public.cw_dean_exam_records enable row level security;
alter table public.cw_dean_quiz_sessions enable row level security;
alter table public.cw_dean_quiz_answers enable row level security;
revoke all on public.cw_dean_tournaments,public.cw_dean_players,public.cw_dean_exam_records,public.cw_dean_quiz_sessions,public.cw_dean_quiz_answers from public,anon,authenticated;
grant select,insert,update,delete on public.cw_dean_tournaments,public.cw_dean_players,public.cw_dean_exam_records,public.cw_dean_quiz_sessions,public.cw_dean_quiz_answers to service_role;

create or replace function public.cw_dean_teacher(p_token text,p_command text)
returns jsonb language plpgsql security invoker set search_path=public as $f$
declare gid uuid;current_phase text;code text;next_phase text;
begin
 select public.cw_validate_facilitator_token(p_token) into gid;
 if gid is null then raise exception 'Sesión docente no válida'; end if;
 select g.code into code from public.cw_games g where g.id=gid;
 if p_command='create' then
  insert into public.cw_dean_tournaments(game_id) values(gid) on conflict do nothing;
 else
  select phase into current_phase from public.cw_dean_tournaments where game_id=gid for update;
  if current_phase is null then raise exception 'Inicia primero la Copa del Decano';end if;
  next_phase:=case current_phase
    when 'lobby' then 'exams' when 'exams' then 'rector'
    when 'rector' then 'survey' when 'survey' then 'causal'
    when 'causal' then 'final' when 'final' then 'finished' else null end;
  if current_phase='final' and (select phase from public.cw_dean_quiz_sessions where game_id=gid) is distinct from 'finished' then
    raise exception 'Termina primero el Kahoot de 30 participantes';
  end if;
  if p_command<>'next' or next_phase is null then raise exception 'Transición docente no permitida';end if;
  update public.cw_dean_tournaments set phase=next_phase,revision=revision+1 where game_id=gid;
 end if;
 return public.cw_dean_state(code,null);
end $f$;

create or replace function public.cw_dean_join(p_code text,p_alias text,p_room integer,p_token_hash text)
returns jsonb language plpgsql security invoker set search_path=public as $f$
declare gid uuid;phase text;occupied int;pid uuid;archetype text;pga numeric;latent numeric;
begin
 if p_room not between 1 and 5 or length(btrim(p_alias)) not between 2 and 30
 or p_alias !~ '^[[:alnum:] _.-]+$' or p_token_hash !~ '^[a-f0-9]{64}$' then
  raise exception 'Alias, sala o credencial inválida';end if;
 select g.id into gid from public.cw_games g where g.code=upper(btrim(p_code));
 if gid is null then raise exception 'Partida no encontrada'; end if;
 select t.phase into phase from public.cw_dean_tournaments t where t.game_id=gid for update;
 if phase is null then raise exception 'El docente aún no ha creado la Copa';end if;
 select p.id into pid from public.cw_dean_players p where p.game_id=gid and p.token_hash=p_token_hash;
 if pid is not null then return public.cw_dean_state(upper(btrim(p_code)),p_token_hash);end if;
 if phase not in ('lobby','exams') then raise exception 'El registro está cerrado';end if;
 select count(*) into occupied from public.cw_dean_players p where p.game_id=gid and p.room_no=p_room;
 if occupied>=6 then raise exception 'La sala ya tiene seis estudiantes';end if;
 select s.archetype into archetype from (
 select v.archetype,count(p.id) n from (values ('over'),('balanced'),('risk'),('pragmatic')) v(archetype)
 left join public.cw_dean_players p on p.game_id=gid and p.archetype=v.archetype
 group by v.archetype order by n asc,random() limit 1
 ) s;
 pga:=round((case archetype when 'over' then 3.8+random() when 'balanced' then 3.4+0.9*random()
 when 'risk' then 2.0+1.2*random() else 3.0+0.6*random() end)::numeric,1);
 latent:=round((-0.55+1.1*random())::numeric,3);
 insert into public.cw_dean_players(game_id,room_no,alias,archetype,pga_prior,latent_resilience,token_hash)
 values(gid,p_room,btrim(p_alias),archetype,pga,latent,p_token_hash) returning id into pid;
 return public.cw_dean_state(upper(btrim(p_code)),p_token_hash);
end $f$;

create or replace function public.cw_dean_exam(p_token_hash text,p_exam integer,p_study numeric,p_sleep numeric,p_wellness numeric,p_auto boolean default false)
returns jsonb language plpgsql security invoker set search_path=public as $f$
declare
 p public.cw_dean_players;phase text;prev_no int;prev_fatigue numeric:=0;
 names text[]:=array['Introducción a la Estadística','Cálculo Diferencial','Historia Social','Álgebra Lineal','Química','Escritura Académica','Cálculo Multivariable','Física I','Métodos de Investigación','Economía','Programación','Probabilidad','Ética Profesional','Modelos de Datos','Proyecto Integrador'];
 difficulty numeric[]:=array[1.15,1.55,1.05,1.45,1.70,0.95,2.05,1.85,1.20,1.50,1.75,1.95,0.90,1.65,2.10];
 min_study numeric;max_study numeric;min_sleep numeric;max_sleep numeric;min_well numeric;max_well numeric;
 f numeric;note numeric;eps numeric;subject text;d numeric;row public.cw_dean_exam_records;
begin
 select * into p from public.cw_dean_players where token_hash=p_token_hash for update;
 if p.id is null then raise exception 'Sesión estudiantil inválida';end if;
 select t.phase into phase from public.cw_dean_tournaments t where t.game_id=p.game_id;
 if phase<>'exams' then raise exception 'La fase de exámenes está cerrada';end if;
 if p_exam not between 1 and 15 then raise exception 'Examen inválido';end if;
 select * into row from public.cw_dean_exam_records where player_id=p.id and exam_no=p_exam;
 if row.player_id is not null then
  return jsonb_build_object('exam_no',row.exam_no,'subject',row.subject_name,'score',row.exam_score,
   'submitted',true,'already_submitted',true,'completed',(select count(*) from public.cw_dean_exam_records where player_id=p.id));
 end if;
 select coalesce(max(exam_no),0) into prev_no from public.cw_dean_exam_records where player_id=p.id;
 if p_exam<>prev_no+1 then raise exception 'Solo se puede rendir el siguiente examen';end if;
 select hidden_fatigue into prev_fatigue from public.cw_dean_exam_records where player_id=p.id and exam_no=prev_no;
 prev_fatigue:=coalesce(prev_fatigue,0);
 min_study:=case p.archetype when 'over' then 5 when 'pragmatic' then 0 else 2 end;
 max_study:=case p.archetype when 'over' then 14 when 'pragmatic' then 5 else 9 end;
 min_sleep:=case p.archetype when 'over' then 1 when 'balanced' then 6 when 'risk' then 4 else 6.5 end;
 max_sleep:=case p.archetype when 'over' then 5 when 'balanced' then 9 when 'risk' then 7.5 else 10 end;
 min_well:=case p.archetype when 'balanced' then 1 else 0 end;
 max_well:=case p.archetype when 'over' then 3 when 'balanced' then 6 when 'risk' then 4 else 5 end;
 if p_study is null or p_sleep is null or p_wellness is null or
 p_study<min_study or p_study>max_study or
 p_sleep<min_sleep or p_sleep>max_sleep or
 p_wellness<min_well or p_wellness>max_well then
  raise exception 'Valores fuera de los rangos del arquetipo';end if;
 subject:=names[p_exam];d:=difficulty[p_exam];
 f:=round(least(12,greatest(0,0.55*prev_fatigue+
  0.36*greatest(0,p_study-7)+0.85*greatest(0,7-p_sleep)
  -0.40*p_wellness+0.35*d+p.latent_resilience))::numeric,2);
 eps:=((random()+random()+random()+random())-2)*2.5;
 note:=round(least(50,greatest(0,
  10*p.pga_prior+3.8*ln(1+p_study)-4.2*d-0.9*power(p_sleep-8,2)
  +1.2*sqrt(p_wellness)-0.8*f+eps))::numeric,1);
 insert into public.cw_dean_exam_records(game_id,player_id,exam_no,subject_name,complexity,
  study_hours,sleep_hours,wellness_hours,hidden_fatigue,exam_score,auto_simulated)
 values(p.game_id,p.id,p_exam,subject,d,p_study,p_sleep,p_wellness,f,note,coalesce(p_auto,false));
 return jsonb_build_object('exam_no',p_exam,'subject',subject,'score',note,'submitted',true,
 'already_submitted',false,'completed',p_exam);
end $f$;

create or replace function public.cw_dean_state(p_code text,p_token_hash text default null)
returns jsonb language plpgsql security invoker set search_path=public as $f$
declare gid uuid;phase text;groups jsonb;own jsonb:=null;quiz_state jsonb:=null;pid uuid;
begin
 select g.id into gid from public.cw_games g where g.code=upper(btrim(p_code));
 if gid is null then raise exception 'Partida inexistente';end if;
 select t.phase into phase from public.cw_dean_tournaments t where t.game_id=gid;
 if phase is null then return jsonb_build_object('available',false);end if;
 select coalesce(jsonb_agg(to_jsonb(r) order by r.room_no),'[]'::jsonb) into groups
 from (select n.room_no,coalesce(count(distinct p.id),0)::integer as members,
  count(e.exam_no)::integer as exams_completed,
  round(avg(e.exam_score)::numeric,1) as average_score,
  (count(e.exam_no)=90) as is_complete
 from generate_series(1,5) n(room_no) left join public.cw_dean_players p
 on p.room_no=n.room_no and p.game_id=gid
 left join public.cw_dean_exam_records e on e.player_id=p.id and e.game_id=gid
 group by n.room_no) r;
 if p_token_hash is not null then
  select p.id into pid from public.cw_dean_players p where p.game_id=gid and p.token_hash=p_token_hash;
  if pid is null then raise exception 'Sesión inválida';end if;
  select jsonb_build_object('id',p.id,'room',p.room_no,'alias',p.alias,'archetype',p.archetype,
  'pga',p.pga_prior,'completed',count(e.exam_no),
  'latest_score',max(e.exam_score) filter(where e.exam_no=(select max(exam_no) from public.cw_dean_exam_records where player_id=p.id)))
  into own from public.cw_dean_players p left join public.cw_dean_exam_records e on e.player_id=p.id
  where p.id=pid group by p.id;
 end if;
 return jsonb_build_object('available',true,'game_code',upper(btrim(p_code)),'phase',phase,
  'max_players',30,'group_size',6,'exam_count',15,'groups',groups,'mine',own);
end $f$;

create or replace function public.cw_dean_export(p_token_hash text,p_layer text)
returns jsonb language plpgsql security invoker set search_path=public as $f$
declare p public.cw_dean_players;stage text;rows jsonb;
begin
 select * into p from public.cw_dean_players where token_hash=p_token_hash;
 if p.id is null then raise exception 'Sesión inválida';end if;
 select phase into stage from public.cw_dean_tournaments where game_id=p.game_id;
 if p_layer='rector' and stage not in ('rector','survey','causal','final','finished') then
  raise exception 'El rector aún no ha publicado el archivo';end if;
 if p_layer='survey' and stage not in ('survey','causal','final','finished') then
  raise exception 'La encuesta aún está oculta';end if;
 if p_layer not in ('rector','survey') then raise exception 'Capa inválida';end if;
 if p_layer='rector' then
  select coalesce(jsonb_agg(jsonb_build_array(q.alias,e.exam_no,e.subject_name,e.complexity,
    q.pga_prior,e.wellness_hours,e.exam_score) order by q.alias,e.exam_no),'[]'::jsonb)
  into rows from public.cw_dean_exam_records e join public.cw_dean_players q on q.id=e.player_id
  where e.game_id=p.game_id and q.room_no=p.room_no;
  return jsonb_build_object('columns',jsonb_build_array('estudiante_id','examen_nro','asignatura','complejidad','pga_previo','horas_bienestar_sem','nota_final'),'rows',rows);
 else
  select coalesce(jsonb_agg(jsonb_build_array(q.alias,e.exam_no,q.archetype,e.study_hours,e.sleep_hours)
    order by q.alias,e.exam_no),'[]'::jsonb)
  into rows from public.cw_dean_exam_records e join public.cw_dean_players q on q.id=e.player_id
  where e.game_id=p.game_id and q.room_no=p.room_no;
  return jsonb_build_object('columns',jsonb_build_array('estudiante_id','examen_nro','arquetipo','horas_estudio','horas_sueno'),'rows',rows);
 end if;
end $f$;

revoke all on function public.cw_dean_teacher(text,text) from public,anon,authenticated;
revoke all on function public.cw_dean_join(text,text,integer,text) from public,anon,authenticated;
revoke all on function public.cw_dean_exam(text,integer,numeric,numeric,numeric,boolean) from public,anon,authenticated;
revoke all on function public.cw_dean_state(text,text) from public,anon,authenticated;
revoke all on function public.cw_dean_export(text,text) from public,anon,authenticated;
grant execute on function public.cw_dean_teacher(text,text) to service_role;
grant execute on function public.cw_dean_join(text,text,integer,text) to service_role;
grant execute on function public.cw_dean_exam(text,integer,numeric,numeric,numeric,boolean) to service_role;
grant execute on function public.cw_dean_state(text,text) to service_role;
grant execute on function public.cw_dean_export(text,text) to service_role;

-- Final Kahoot isolated from legacy cw_players (maximum 28).
create or replace function public.cw_dean_quiz_teacher(p_token text,p_action text)
returns jsonb language plpgsql security invoker set search_path=public as $f$
declare gid uuid; old public.cw_dean_quiz_sessions; secs integer;
begin
 select public.cw_validate_facilitator_token(p_token) into gid;
 if gid is null or (select phase from public.cw_dean_tournaments where game_id=gid)<>'final' then
 raise exception 'Final docente no autorizada';end if;
 insert into public.cw_dean_quiz_sessions(game_id) values(gid) on conflict do nothing;
 select * into old from public.cw_dean_quiz_sessions where game_id=gid for update;
 if p_action='start' and old.phase='idle' then
   update public.cw_dean_quiz_sessions set question_no=1,phase='preview',version=version+1 where game_id=gid;
 elsif p_action='open' and old.phase='preview' then
   select seconds into secs from public.cw_v2_quiz_questions where question_no=old.question_no;
   update public.cw_dean_quiz_sessions set phase='open',deadline_at=clock_timestamp()+make_interval(secs=>secs),version=version+1 where game_id=gid;
 elsif p_action='lock' and old.phase='open' then
   update public.cw_dean_quiz_sessions set phase='locked',deadline_at=null,version=version+1 where game_id=gid;
 elsif p_action='reveal' and (old.phase='locked' or (old.phase='open' and old.deadline_at<=clock_timestamp())) then
   update public.cw_dean_quiz_sessions set phase='reveal',deadline_at=null,version=version+1 where game_id=gid;
 elsif p_action='next' and old.phase='reveal' then
   update public.cw_dean_quiz_sessions set phase=case when old.question_no=8 then 'podium' else 'preview' end,
   question_no=least(8,old.question_no+1),deadline_at=null,version=version+1 where game_id=gid;
 elsif p_action='finish' and old.phase='podium' then
   update public.cw_dean_quiz_sessions set phase='finished',version=version+1 where game_id=gid;
 else raise exception 'Transición inválida % → %',old.phase,p_action; end if;
 return public.cw_dean_quiz_state((select code from public.cw_games where id=gid),null);
end $f$;
create or replace function public.cw_dean_quiz_submit(p_hash text,p_question integer,p_choice text)
returns jsonb language plpgsql security invoker set search_path=public as $f$
declare p public.cw_dean_players;s public.cw_dean_quiz_sessions;old_choice text;
begin
 select * into p from public.cw_dean_players where token_hash=p_hash;
 if p.id is null then raise exception 'Sesión inválida';end if;
 select * into s from public.cw_dean_quiz_sessions where game_id=p.game_id for update;
 if s.phase<>'open' or s.deadline_at<=clock_timestamp() or s.question_no<>p_question
 or p_choice not in ('a','b','c','d') then raise exception 'Pregunta cerrada';end if;
 insert into public.cw_dean_quiz_answers(game_id,player_id,question_no,choice)
 values(p.game_id,p.id,p_question,p_choice) on conflict do nothing;
 select choice into old_choice from public.cw_dean_quiz_answers where player_id=p.id and question_no=p_question;
 if old_choice is distinct from p_choice then raise exception 'Respuesta ya bloqueada';end if;
 return jsonb_build_object('accepted',true,'choice',old_choice);
end $f$;
create or replace function public.cw_dean_quiz_state(p_code text,p_hash text default null)
returns jsonb language plpgsql security invoker set search_path=public as $f$
declare gid uuid;s public.cw_dean_quiz_sessions;task public.cw_v2_quiz_questions;
 effective text;shown integer;answered int;detail jsonb:=null;counts jsonb:=null;
 rank jsonb:='[]'::jsonb;mine text:=null;mine_points integer:=null;pid uuid;
begin
 select id into gid from public.cw_games where code=upper(btrim(p_code));
 if gid is null then raise exception 'Partida desconocida';end if;
 select * into s from public.cw_dean_quiz_sessions where game_id=gid;
 if s.game_id is null then return jsonb_build_object('phase','idle','question_no',0,'server_now',clock_timestamp());end if;
 effective:=case when s.phase='open' and s.deadline_at<=clock_timestamp() then 'locked' else s.phase end;
 shown:=case when effective in ('reveal','podium','finished') then s.question_no else greatest(0,s.question_no-1) end;
 if s.question_no>0 then
 select * into task from public.cw_v2_quiz_questions where question_no=s.question_no;
 detail:=jsonb_build_object('text',task.question,'options',task.options,'concept',task.concept);
 if effective in ('reveal','podium','finished') then
 detail:=detail||jsonb_build_object('correct',task.correct_choice,'explanation',task.explanation);
 select jsonb_build_object('a',count(*) filter(where choice='a'),'b',count(*) filter(where choice='b'),
  'c',count(*) filter(where choice='c'),'d',count(*) filter(where choice='d')) into counts
 from public.cw_dean_quiz_answers where game_id=gid and question_no=s.question_no;
 end if;
 end if;
 select count(*) into answered from public.cw_dean_quiz_answers where game_id=gid and question_no=s.question_no;
 select coalesce(jsonb_agg(to_jsonb(t) order by t.points desc,t.alias),'[]'::jsonb) into rank from (
 select p.alias,p.room_no,coalesce(sum(case when a.choice=q.correct_choice then 15 else 0 end),0)::int points
 from public.cw_dean_players p
 left join public.cw_dean_quiz_answers a on a.player_id=p.id and a.question_no<=shown
 left join public.cw_v2_quiz_questions q on q.question_no=a.question_no
 where p.game_id=gid group by p.id order by points desc,p.alias limit 30
 ) t;
 if p_hash is not null then
 select id into pid from public.cw_dean_players where game_id=gid and token_hash=p_hash;
 if pid is null then raise exception 'Sesión inválida';end if;
 select choice into mine from public.cw_dean_quiz_answers where player_id=pid and question_no=s.question_no;
 select coalesce(sum(q.points),0) into mine_points from public.cw_dean_quiz_answers a
 join public.cw_v2_quiz_questions q on q.question_no=a.question_no and q.correct_choice=a.choice
 where a.player_id=pid and a.question_no<=shown;
 end if;
 return jsonb_build_object('phase',effective,'question_no',s.question_no,'question',detail,
 'deadline_at',s.deadline_at,'server_now',clock_timestamp(),'received',answered,
 'counts',counts,'leaderboard',rank,'mine',mine,'my_points',mine_points);
end $f$;
revoke all on function public.cw_dean_quiz_teacher(text,text) from public,anon,authenticated;
revoke all on function public.cw_dean_quiz_submit(text,integer,text) from public,anon,authenticated;
revoke all on function public.cw_dean_quiz_state(text,text) from public,anon,authenticated;
grant execute on function public.cw_dean_quiz_teacher(text,text) to service_role;
grant execute on function public.cw_dean_quiz_submit(text,integer,text) to service_role;
grant execute on function public.cw_dean_quiz_state(text,text) to service_role;


-- Teacher-only synthetic truth, never exposed in either student dataset.
create or replace function public.cw_dean_teacher_truth(p_fac_token text)
returns jsonb language plpgsql security invoker set search_path=public as $f$
declare gid uuid;phase text;rows jsonb;
begin
 select public.cw_validate_facilitator_token(p_fac_token) into gid;
 if gid is null then raise exception 'Sesión docente inválida';end if;
 select t.phase into phase from public.cw_dean_tournaments t where game_id=gid;
 if phase not in ('causal','final','finished') then raise exception 'La verdad sintética aún no está revelada';end if;
 select coalesce(jsonb_agg(jsonb_build_array(p.room_no,p.alias,e.exam_no,e.subject_name,
 e.study_hours,e.sleep_hours,e.wellness_hours,e.hidden_fatigue,e.exam_score,e.auto_simulated)
 order by p.room_no,p.alias,e.exam_no),'[]'::jsonb)
 into rows from public.cw_dean_exam_records e join public.cw_dean_players p on p.id=e.player_id
 where e.game_id=gid;
 return jsonb_build_object('columns',jsonb_build_array('sala','estudiante_id','examen_nro','asignatura',
 'horas_estudio','horas_sueno','horas_bienestar_sem','fatiga_oculta','nota_final','simulada_automaticamente'),'rows',rows);
end $f$;
-- Optional rapid completion with server-calculated marks and visible provenance.
create or replace function public.cw_dean_auto_finish(p_token_hash text)
returns jsonb language plpgsql security invoker set search_path=public as $f$
declare p public.cw_dean_players;k integer;next_exam integer;r jsonb;
begin
 select * into p from public.cw_dean_players where token_hash=p_token_hash for update;
 if p.id is null then raise exception 'Sesión inválida';end if;
 select coalesce(max(exam_no),0)+1 into next_exam from public.cw_dean_exam_records where player_id=p.id;
 for k in next_exam..15 loop
  case p.archetype
   when 'over' then r:=public.cw_dean_exam(p_token_hash,k,10,3.5,1,true);
   when 'balanced' then r:=public.cw_dean_exam(p_token_hash,k,6,7.5,3.5,true);
   when 'risk' then r:=public.cw_dean_exam(p_token_hash,k,5,5.5,1,true);
   else r:=public.cw_dean_exam(p_token_hash,k,2,8.5,2.5,true);
  end case;
 end loop;
 return jsonb_build_object('completed',15,'auto_generated_from',next_exam,
 'note','Exámenes restantes simulados con estrategia predeterminada, marcados en datos docentes');
end $f$;
revoke all on function public.cw_dean_teacher_truth(text) from public,anon,authenticated;
revoke all on function public.cw_dean_auto_finish(text) from public,anon,authenticated;
grant execute on function public.cw_dean_teacher_truth(text) to service_role;
grant execute on function public.cw_dean_auto_finish(text) to service_role;
