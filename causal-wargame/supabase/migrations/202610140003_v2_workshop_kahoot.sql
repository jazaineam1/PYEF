-- CAMPUS V2 ONLY. 120-minute workshop agenda and synchronized causal battle.
-- These tables are deliberately isolated from V1 and existing checkpoints.
create table if not exists public.cw_v2_workshop (
 game_id uuid primary key references public.cw_games(id) on delete cascade,
 phase_index integer not null default 0 check (phase_index between 0 and 5),
 cue_index integer not null default 0 check (cue_index between 0 and 1),
 active boolean not null default false,
 paused boolean not null default false,
 remaining_seconds integer,
 started_at timestamptz,
 deadline_at timestamptz,
 version integer not null default 0
);
create table if not exists public.cw_v2_quiz_sessions (
 game_id uuid primary key references public.cw_games(id) on delete cascade,
 phase text not null default 'idle' check (phase in ('idle','question_preview','question_open','question_locked','results','explanation','leaderboard','paused','final_podium','finished')),
 prior_phase text,
 current_question integer not null default 0 check (current_question between 0 and 8),
 deadline_at timestamptz,
 remaining_seconds integer,
 started_at timestamptz,
 finished_at timestamptz,
 version integer not null default 0
);
create table if not exists public.cw_v2_quiz_questions (
 question_no integer primary key check (question_no between 1 and 8),
 question text not null,
 options jsonb not null,
 correct_choice text not null check (correct_choice in ('a','b','c','d')),
 explanation text not null,
 concept text not null,
 seconds integer not null default 20 check (seconds between 15 and 25),
 points integer not null default 15 check (points=15)
);
create table if not exists public.cw_v2_quiz_answers (
 game_id uuid not null references public.cw_games(id) on delete cascade,
 question_no integer not null references public.cw_v2_quiz_questions(question_no),
 player_id uuid not null references public.cw_players(id) on delete cascade,
 choice text not null check(choice in ('a','b','c','d')),
 received_at timestamptz not null default clock_timestamp(),
 primary key (game_id,question_no,player_id)
);
create index if not exists cw_v2_quiz_answers_player_idx on public.cw_v2_quiz_answers(game_id,player_id);
alter table public.cw_v2_workshop enable row level security;
alter table public.cw_v2_quiz_sessions enable row level security;
alter table public.cw_v2_quiz_questions enable row level security;
alter table public.cw_v2_quiz_answers enable row level security;
revoke all on public.cw_v2_workshop,public.cw_v2_quiz_sessions,public.cw_v2_quiz_questions,public.cw_v2_quiz_answers from public,anon,authenticated;
grant select,insert,update,delete on public.cw_v2_workshop,public.cw_v2_quiz_sessions,public.cw_v2_quiz_questions,public.cw_v2_quiz_answers to service_role;
insert into public.cw_v2_quiz_questions(question_no,question,options,correct_choice,explanation,concept,seconds,points) values
(1,'Un predictor logra R² = 0,95. ¿Demuestra que ofrecer apoyo académico mejora la nota?',
 '{"a":"Sí, porque predice muy bien","b":"No, predicción no demuestra causalidad","c":"Sí, si usamos Random Forest","d":"Solo si tenemos muchos datos"}','b',
 'El R² mide ajuste predictivo. No identifica qué habría ocurrido con y sin apoyo.','Predicción frente a causalidad',20,15),
(2,'El plan académico se asignó aleatoriamente. ¿Cómo estimamos el efecto promedio?',
 '{"a":"Promedio tratado menos control, acompañado de incertidumbre","b":"Comparando las notas de quienes más estudiaron","c":"Con el R² más alto","d":"Ajustando todas las variables posteriores"}','a',
 'En un A/B correctamente aleatorizado, la diferencia de medias estima el efecto de asignación; hay incertidumbre muestral.','A/B y ATE',20,15),
(3,'Dos equipos estiman efectos distintos con muestras aleatorias del mismo experimento. ¿Por qué?',
 '{"a":"Uno necesariamente programó mal","b":"El experimento ya no es causal","c":"Existe variabilidad muestral","d":"Cada persona recibe el mismo efecto"}','c',
 'La aleatorización mejora la comparabilidad, pero no elimina la variación entre muestras ni el error de estimación.','Incertidumbre',20,15),
(4,'El PGA anterior influye en recibir apoyo y en la nota posterior. ¿Qué papel desempeña?',
 '{"a":"Mediador posterior","b":"Variable instrumental automáticamente","c":"Resultado final","d":"Posible confusor pretratamiento"}','d',
 'Un confusor previo puede abrir un camino no causal entre tratamiento y resultado; el DAG guía el ajuste.','Confusión y DAG',20,15),
(5,'Las horas de estudio se midieron después de recibir apoyo. ¿Debemos ajustarlas sin pensar?',
 '{"a":"No: pueden mediar parte del efecto total","b":"Sí: agregar controles siempre mejora causalidad","c":"Sí: eliminan toda la confusión","d":"No: porque no podemos medir horas"}','a',
 'Ajustar un mediador posterior puede bloquear parte del efecto total. Un collider puede introducir sesgo al condicionarlo.','Mediadores y colliders',20,15),
(6,'¿Qué hace Double Machine Learning en el ejemplo del taller?',
 '{"a":"Entrena dos modelos causales y promedia efectos","b":"Usa modelos auxiliares para T e Y, residuos y cross-fitting","c":"Busca la nota mejor predicha y la llama efecto","d":"Corrige confusión no observada automáticamente"}','b',
 'DML estima componentes de T e Y a partir de X, calcula residuos fuera de muestra y estima el parámetro bajo supuestos identificadores.','DML',25,15),
(7,'Un ATE de +5 puntos significa que cada estudiante sube exactamente 5 puntos?',
 '{"a":"Sí: es una ley individual","b":"Sí: si el modelo es complejo","c":"No: puede existir heterogeneidad del efecto (CATE)","d":"No: ATE solo mide predicción"}','c',
 'ATE resume un promedio. CATE puede variar por perfil; el efecto individual no suele observarse directamente.','ATE frente a CATE',20,15),
(8,'Solo existen cupos para 20 % de estudiantes. ¿Qué priorizamos?',
 '{"a":"A quienes tienen el R² individual más alto","b":"A quienes ya tienen mayor nota","c":"Al modelo con nombre más avanzado","d":"Beneficio causal esperado, incertidumbre, equidad y cupos"}','d',
 'Una política defendible combina efecto incremental, incertidumbre y restricciones; ningún algoritmo reemplaza la identificación.','Decisiones bajo capacidad',25,15)
on conflict (question_no) do nothing;

create or replace function public.cw_v2_quiz_wall(p_game_code text)
returns jsonb language plpgsql security invoker set search_path=public as $f$
declare
 gid uuid; q public.cw_v2_quiz_sessions; w public.cw_v2_workshop;
 task public.cw_v2_quiz_questions; effective text; shown integer:=0;
 answer_count integer:=0; audience integer:=0; detail jsonb:=null;
 ranking jsonb:='[]'::jsonb; team_rank jsonb:='[]'::jsonb; tallies jsonb:=null;
begin
 select id into gid from public.cw_games where code=upper(trim(p_game_code)) limit 1;
 if gid is null then raise exception 'Partida inexistente'; end if;
 select * into q from public.cw_v2_quiz_sessions where game_id=gid;
 select * into w from public.cw_v2_workshop where game_id=gid;
 select count(*) into audience from public.cw_players where game_id=gid and active and not is_bot;
 if q.game_id is null then return jsonb_build_object('quiz',jsonb_build_object('phase','idle','current_question',0,'total_questions',8),
   'agenda',jsonb_build_object('phase_index',coalesce(w.phase_index,0),'cue_index',coalesce(w.cue_index,0),'active',coalesce(w.active,false),'paused',coalesce(w.paused,false),'deadline_at',w.deadline_at,'remaining_seconds',w.remaining_seconds,'server_now',clock_timestamp()),
   'participants',audience,'leaderboard','[]'::jsonb,'team_leaderboard','[]'::jsonb,'server_now',clock_timestamp()); end if;
 effective:=q.phase;
 if q.phase='question_open' and q.deadline_at<=clock_timestamp() then effective:='question_locked'; end if;
 if q.phase='paused' then effective:='paused'; end if;
 if effective in ('results','explanation','leaderboard','final_podium','finished') then
   shown:=q.current_question;
 else
   shown:=greatest(0,q.current_question-1);
 end if;
 if q.current_question>0 then
   select * into task from public.cw_v2_quiz_questions where question_no=q.current_question;
   select count(*) into answer_count from public.cw_v2_quiz_answers where game_id=gid and question_no=q.current_question;
   if effective in ('question_preview','question_open','question_locked','paused') then
     detail:=jsonb_build_object('number',task.question_no,'question',task.question,
       'options',task.options,'seconds',task.seconds,'concept',task.concept);
   else
     detail:=jsonb_build_object('number',task.question_no,'question',task.question,
       'options',task.options,'seconds',task.seconds,'concept',task.concept,
       'correct_choice',task.correct_choice,'explanation',task.explanation);
     select jsonb_build_object('a',count(*) filter(where choice='a'),'b',count(*) filter(where choice='b'),
       'c',count(*) filter(where choice='c'),'d',count(*) filter(where choice='d'))
     into tallies from public.cw_v2_quiz_answers where game_id=gid and question_no=q.current_question;
   end if;
 end if;
 select coalesce(jsonb_agg(to_jsonb(t) order by t.points desc,t.name),'[]'::jsonb) into ranking
 from (
   select p.id player_id,p.display_name name,coalesce(tm.name,'Equipo') team,
     coalesce(sum(case when a.choice=x.correct_choice then x.points else 0 end),0)::integer points
   from public.cw_players p left join public.cw_teams tm on tm.id=p.team_id
     left join public.cw_v2_quiz_answers a on a.player_id=p.id and a.game_id=gid and a.question_no<=shown
     left join public.cw_v2_quiz_questions x on x.question_no=a.question_no
   where p.game_id=gid and p.active and not p.is_bot
   group by p.id,p.display_name,tm.name order by points desc,p.display_name limit 40
 ) t;
 select coalesce(jsonb_agg(to_jsonb(t) order by t.points desc,t.team),'[]'::jsonb) into team_rank
 from (select team,sum(points)::int points from jsonb_to_recordset(ranking) as r(player_id uuid,name text,team text,points int)
       group by team order by points desc,team) t;
 return jsonb_build_object('quiz',jsonb_build_object('phase',effective,'stored_phase',q.phase,
    'current_question',q.current_question,'total_questions',8,'deadline_at',q.deadline_at,
    'remaining_seconds',q.remaining_seconds,'question',detail,'answer_count',answer_count,
    'tallies',tallies,'points_per_correct',15,'max_score',120,'version',q.version),
    'agenda',jsonb_build_object('phase_index',coalesce(w.phase_index,0),'cue_index',coalesce(w.cue_index,0),'active',coalesce(w.active,false),
      'paused',coalesce(w.paused,false),'deadline_at',w.deadline_at,'remaining_seconds',w.remaining_seconds,'version',w.version),
    'participants',audience,'leaderboard',ranking,'team_leaderboard',team_rank,'server_now',clock_timestamp());
end $f$;

create or replace function public.cw_v2_quiz_player(p_token text)
returns jsonb language plpgsql security invoker set search_path=public as $f$
declare p public.cw_players; code text; out jsonb; own jsonb; points int:=0; phase text; question_no int;
begin
 select * into p from public.cw_validate_player_token(p_token);
 if p.id is null then raise exception 'Sesión inválida'; end if;
 select g.code into code from public.cw_games g where id=p.game_id;
 out:=public.cw_v2_quiz_wall(code);
 question_no:=(out->'quiz'->>'current_question')::int;
 phase:=out->'quiz'->>'phase';
 select jsonb_build_object('choice',choice,'received_at',received_at)
 into own from public.cw_v2_quiz_answers a where a.game_id=p.game_id and a.player_id=p.id and a.question_no=question_no;
 select coalesce(sum(q.points),0) into points from public.cw_v2_quiz_answers a
 join public.cw_v2_quiz_questions q on q.question_no=a.question_no and q.correct_choice=a.choice
 where a.game_id=p.game_id and a.player_id=p.id
 and a.question_no<= (case when phase in ('results','explanation','leaderboard','final_podium','finished') then question_no else greatest(0,question_no-1) end);
 return out || jsonb_build_object('mine',jsonb_build_object('answer',own,'points',points,'player_id',p.id));
end $f$;

create or replace function public.cw_v2_quiz_submit(p_token text,p_question integer,p_choice text)
returns jsonb language plpgsql security invoker set search_path=public as $f$
declare p public.cw_players; q public.cw_v2_quiz_sessions; existing text; submitted timestamptz;
begin
 select * into p from public.cw_validate_player_token(p_token);
 if p.id is null or p.is_bot then raise exception 'Participante inválido'; end if;
 select * into q from public.cw_v2_quiz_sessions where game_id=p.game_id for update;
 if q.game_id is null or q.phase<>'question_open' or q.current_question<>p_question
    or q.deadline_at is null or clock_timestamp()>=q.deadline_at then
   raise exception 'Pregunta cerrada o fuera de plazo'; end if;
 if p_choice not in ('a','b','c','d') then raise exception 'Respuesta no válida'; end if;
 insert into public.cw_v2_quiz_answers(game_id,question_no,player_id,choice)
 values(p.game_id,p_question,p.id,p_choice) on conflict do nothing;
 select a.choice,a.received_at into existing,submitted from public.cw_v2_quiz_answers a
 where a.game_id=p.game_id and a.question_no=p_question and a.player_id=p.id;
 if existing is distinct from p_choice then raise exception 'La respuesta ya quedó bloqueada'; end if;
 return jsonb_build_object('accepted',true,'question',p_question,'choice',existing,'received_at',submitted,
   'message','Respuesta registrada por el servidor; ya no es editable.');
end $f$;

create or replace function public.cw_v2_quiz_teacher(p_token text,p_action text,p_seconds integer default 20)
returns jsonb language plpgsql security invoker set search_path=public as $f$
declare gid uuid; q public.cw_v2_quiz_sessions; w public.cw_v2_workshop; target int;
begin
 select public.cw_validate_facilitator_token(p_token) into gid;
 if gid is null then raise exception 'Facilitador sin autorización'; end if;
 if p_action like 'agenda_%' then
  insert into public.cw_v2_workshop(game_id) values(gid) on conflict do nothing;
  select * into w from public.cw_v2_workshop where game_id=gid for update;
  if p_action='agenda_start' then
    update public.cw_v2_workshop set active=true,paused=false,phase_index=0,cue_index=0,started_at=clock_timestamp(),
      deadline_at=clock_timestamp()+interval '10 minutes',remaining_seconds=null,version=version+1 where game_id=gid;
  elsif p_action in ('agenda_next','agenda_prev') then
    target:=least(5,greatest(0,w.phase_index+case when p_action='agenda_next' then 1 else -1 end));
    update public.cw_v2_workshop set active=true,paused=false,phase_index=target,cue_index=0,deadline_at=clock_timestamp()
      + make_interval(mins=>case target when 0 then 10 when 1 then 20 when 5 then 15 else 25 end),
      remaining_seconds=null,version=version+1 where game_id=gid;
  elsif p_action in ('agenda_cue_next','agenda_cue_prev') and w.active and not w.paused then
    update public.cw_v2_workshop set cue_index=least(1,greatest(0,w.cue_index+case when p_action='agenda_cue_next' then 1 else -1 end)),
      version=version+1 where game_id=gid;
  elsif p_action='agenda_pause' and w.active and not w.paused then
    update public.cw_v2_workshop set paused=true,remaining_seconds=greatest(0,extract(epoch from (w.deadline_at-clock_timestamp()))::int),
      deadline_at=null,version=version+1 where game_id=gid;
  elsif p_action='agenda_resume' and w.paused then
    update public.cw_v2_workshop set paused=false,deadline_at=clock_timestamp()+make_interval(secs=>coalesce(w.remaining_seconds,60)),
      remaining_seconds=null,version=version+1 where game_id=gid;
  else
    raise exception 'Transición de agenda no permitida';
  end if;
 else
  insert into public.cw_v2_quiz_sessions(game_id) values(gid) on conflict do nothing;
  select * into q from public.cw_v2_quiz_sessions where game_id=gid for update;
  if p_action='start' and q.phase='idle' then
    -- The collective final is reserved for the last 15 minutes when a 120-min workshop is active.
    if exists (select 1 from public.cw_v2_workshop where game_id=gid and active=true and phase_index<>5) then
      raise exception 'La batalla final se desbloquea en la última fase del taller';
    end if;
    update public.cw_v2_quiz_sessions set phase='question_preview',current_question=1,started_at=clock_timestamp(),version=version+1 where game_id=gid;
  elsif p_action='open' and q.phase='question_preview' then
    select seconds into target from public.cw_v2_quiz_questions where question_no=q.current_question;
    update public.cw_v2_quiz_sessions set phase='question_open',deadline_at=clock_timestamp()+make_interval(secs=>target),
       remaining_seconds=null,version=version+1 where game_id=gid;
  elsif p_action='lock' and q.phase='question_open' then
    update public.cw_v2_quiz_sessions set phase='question_locked',deadline_at=null,version=version+1 where game_id=gid;
  elsif p_action='reveal_explain' and (q.phase='question_locked' or (q.phase='question_open' and q.deadline_at<=clock_timestamp())) then
    update public.cw_v2_quiz_sessions set phase='explanation',deadline_at=null,version=version+1 where game_id=gid;
  elsif p_action='reveal' and (q.phase='question_locked' or (q.phase='question_open' and q.deadline_at<=clock_timestamp())) then
    update public.cw_v2_quiz_sessions set phase='results',deadline_at=null,version=version+1 where game_id=gid;
  elsif p_action='explain' and q.phase='results' then
    update public.cw_v2_quiz_sessions set phase='explanation',version=version+1 where game_id=gid;
  elsif p_action='rank' and q.phase='explanation' then
    update public.cw_v2_quiz_sessions set phase='leaderboard',version=version+1 where game_id=gid;
  elsif p_action='next_fast' and q.phase in ('explanation','leaderboard') then
    update public.cw_v2_quiz_sessions set phase=case when q.current_question=8 then 'final_podium' else 'question_preview' end,
      current_question=least(8,q.current_question+1),deadline_at=null,version=version+1 where game_id=gid;
  elsif p_action='next' and q.phase='leaderboard' then
    update public.cw_v2_quiz_sessions set phase=case when q.current_question=8 then 'final_podium' else 'question_preview' end,
      current_question=least(8,q.current_question+1),deadline_at=null,version=version+1 where game_id=gid;
  elsif p_action='finish' and q.phase='final_podium' then
    update public.cw_v2_quiz_sessions set phase='finished',finished_at=clock_timestamp(),version=version+1 where game_id=gid;
  elsif p_action='pause' and q.phase in ('question_preview','question_open','results','explanation','leaderboard') then
    update public.cw_v2_quiz_sessions set phase='paused',prior_phase=q.phase,
      remaining_seconds=case when q.phase='question_open' then greatest(0,extract(epoch from (q.deadline_at-clock_timestamp()))::int) else null end,
      deadline_at=null,version=version+1 where game_id=gid;
  elsif p_action='resume' and q.phase='paused' then
    update public.cw_v2_quiz_sessions set phase=q.prior_phase,
      deadline_at=case when q.prior_phase='question_open' then clock_timestamp()+make_interval(secs=>coalesce(q.remaining_seconds,0)) else null end,
      remaining_seconds=null,prior_phase=null,version=version+1 where game_id=gid;
  elsif p_action='reset_quiz' then
    delete from public.cw_v2_quiz_answers where game_id=gid;
    update public.cw_v2_quiz_sessions set phase='idle',prior_phase=null,current_question=0,
      deadline_at=null,remaining_seconds=null,started_at=null,finished_at=null,version=version+1 where game_id=gid;
  else
    raise exception 'Transición Kahoot no permitida desde fase % con acción %',q.phase,p_action;
  end if;
 end if;
 return public.cw_v2_quiz_wall((select code from public.cw_games where id=gid));
end $f$;
revoke all on function public.cw_v2_quiz_wall(text) from public,anon,authenticated;
revoke all on function public.cw_v2_quiz_player(text) from public,anon,authenticated;
revoke all on function public.cw_v2_quiz_submit(text,integer,text) from public,anon,authenticated;
revoke all on function public.cw_v2_quiz_teacher(text,text,integer) from public,anon,authenticated;
grant execute on function public.cw_v2_quiz_wall(text) to service_role;
grant execute on function public.cw_v2_quiz_player(text) to service_role;
grant execute on function public.cw_v2_quiz_submit(text,integer,text) to service_role;
grant execute on function public.cw_v2_quiz_teacher(text,text,integer) to service_role;


-- A participant makes one choice per workshop scene. The five continuous
-- scenes do NOT depend on the six mandatory checkpoints of the deep game.
create table if not exists public.cw_v2_workshop_choices (
 game_id uuid not null references public.cw_games(id) on delete cascade,
 phase_index integer not null check(phase_index between 0 and 4),
 player_id uuid not null references public.cw_players(id) on delete cascade,
 choice text not null check(choice in ('a','b','c','d')),
 submitted_at timestamptz not null default clock_timestamp(),
 primary key(game_id,phase_index,player_id)
);
create index if not exists cw_v2_workshop_choices_player on public.cw_v2_workshop_choices(game_id,player_id);
alter table public.cw_v2_workshop_choices enable row level security;
revoke all on public.cw_v2_workshop_choices from public,anon,authenticated;
grant select,insert,update,delete on public.cw_v2_workshop_choices to service_role;

create or replace function public.cw_v2_workshop_vote(p_token text,p_phase integer,p_choice text)
returns jsonb language plpgsql security invoker set search_path=public as $f$
declare
 player public.cw_players; workshop public.cw_v2_workshop; previously text; stamp timestamptz;
begin
 select * into player from public.cw_validate_player_token(p_token);
 if player.id is null or player.is_bot then raise exception 'Sesión de estudiante inválida'; end if;
 select * into workshop from public.cw_v2_workshop where game_id=player.game_id for update;
 if workshop.game_id is null or not workshop.active or workshop.paused
 or workshop.phase_index<>p_phase or workshop.cue_index<>0 or p_phase>=5 then
   raise exception 'Esta escena ya no está recibiendo decisiones'; end if;
 if p_choice not in ('a','b','c','d') then raise exception 'Elección fuera de las alternativas permitidas'; end if;
 insert into public.cw_v2_workshop_choices(game_id,phase_index,player_id,choice)
 values(player.game_id,p_phase,player.id,p_choice) on conflict do nothing;
 select choice,submitted_at into previously,stamp from public.cw_v2_workshop_choices
 where game_id=player.game_id and phase_index=p_phase and player_id=player.id;
 if previously is distinct from p_choice then
   raise exception 'La decisión quedó bloqueada; no se puede cambiar después de enviarla';
 end if;
 return jsonb_build_object('accepted',true,'phase_index',p_phase,'choice',previously,
     'received_at',stamp,'message','Decisión guardada para esta escena del taller');
end $f$;

create or replace function public.cw_v2_workshop_presence(p_game_code text)
returns jsonb language plpgsql security invoker set search_path=public as $f$
declare
 gid uuid; w public.cw_v2_workshop; audience integer:=0; count_submitted integer:=0;
 by_team jsonb:='[]'::jsonb; distribution jsonb:=null;
begin
 select id into gid from public.cw_games where code=upper(trim(p_game_code));
 if gid is null then raise exception 'Partida inexistente'; end if;
 select * into w from public.cw_v2_workshop where game_id=gid;
 if w.game_id is null or not w.active then
   return jsonb_build_object('active',false,'received',0,'by_team','[]'::jsonb);
 end if;
 select count(*) into audience from public.cw_players where game_id=gid and active and not is_bot;
 select count(*) into count_submitted from public.cw_v2_workshop_choices c
 join public.cw_players p on p.id=c.player_id
 where c.game_id=gid and c.phase_index=w.phase_index and p.active and not p.is_bot;
 select coalesce(jsonb_agg(to_jsonb(t) order by t.team),'[]'::jsonb) into by_team
 from (select coalesce(tm.name,'Equipo') team,count(*)::int submitted
    from public.cw_v2_workshop_choices c
    join public.cw_players p on p.id=c.player_id
    left join public.cw_teams tm on tm.id=p.team_id
    where c.game_id=gid and c.phase_index=w.phase_index and p.active and not p.is_bot
    group by tm.name) t;
 -- Tallies and the pedagogical preferred choice are hidden until teacher
 -- explicitly projects the explanation (cue=1) or moves to another phase.
 if w.cue_index=1 then
  select jsonb_build_object('a',count(*) filter(where choice='a'),
    'b',count(*) filter(where choice='b'),
    'c',count(*) filter(where choice='c'),
    'd',count(*) filter(where choice='d')) into distribution
  from public.cw_v2_workshop_choices where game_id=gid and phase_index=w.phase_index;
 end if;
 return jsonb_build_object('active',true,'received',count_submitted,'participants',audience,
   'by_team',by_team,'distribution',distribution,'revealed',w.cue_index=1);
end $f$;

create or replace function public.cw_v2_workshop_player(p_token text)
returns jsonb language plpgsql security invoker set search_path=public as $f$
declare p public.cw_players; w public.cw_v2_workshop; own text;
begin
 select * into p from public.cw_validate_player_token(p_token);
 if p.id is null then raise exception 'Sesión inválida'; end if;
 select * into w from public.cw_v2_workshop where game_id=p.game_id;
 if w.game_id is null or not w.active then
   return jsonb_build_object('active',false); end if;
 select choice into own from public.cw_v2_workshop_choices
 where game_id=p.game_id and player_id=p.id and phase_index=w.phase_index;
 return jsonb_build_object('active',true,'phase_index',w.phase_index,
   'my_choice',own,'teaching',w.cue_index=1,'paused',w.paused,
   'received',(select count(*) from public.cw_v2_workshop_choices where game_id=p.game_id and phase_index=w.phase_index),
   'participants',(select count(*) from public.cw_players where game_id=p.game_id and active and not is_bot));
end $f$;

revoke all on function public.cw_v2_workshop_vote(text,integer,text) from public,anon,authenticated;
revoke all on function public.cw_v2_workshop_presence(text) from public,anon,authenticated;
revoke all on function public.cw_v2_workshop_player(text) from public,anon,authenticated;
grant execute on function public.cw_v2_workshop_vote(text,integer,text) to service_role;
grant execute on function public.cw_v2_workshop_presence(text) to service_role;
grant execute on function public.cw_v2_workshop_player(text) to service_role;
