-- DOS FUTUROS V2 · visual causal evidence tools
-- Additive analysis RPC. V1 and the existing V2 decision flow remain unchanged.

create or replace function public.cw_v2_analysis(p_token text)
returns jsonb
language plpgsql
security invoker
set search_path=public
as $$
declare
  p public.cw_players;
  g public.cw_games;
  humans int:=0;
  submitted int:=0;
  all_submitted boolean:=false;
  team_tools jsonb:=null;
  reveal_tools jsonb:=null;
  feature_summary jsonb:='[]'::jsonb;
  segment_rows jsonb:='[]'::jsonb;
begin
  select * into p from public.cw_validate_player_token(p_token);
  if p.id is null then raise exception 'Sesión inválida'; end if;

  select * into g from public.cw_games where id=p.game_id;
  if g.id is null then raise exception 'Partida no encontrada'; end if;

  select count(*) into humans
  from public.cw_players
  where game_id=p.game_id and team_id=p.team_id and active and not is_bot;

  select count(*) into submitted
  from public.cw_v2_individual_submissions
  where game_id=p.game_id and team_id=p.team_id and round_number=g.current_round;

  all_submitted:=humans>0 and submitted>=humans;

  if all_submitted then
    if g.current_round=1 then
      select coalesce(jsonb_agg(jsonb_build_object(
        'feature',feature,
        'mean_abs',mean_abs,
        'mean',mean_value
      ) order by mean_abs desc),'[]'::jsonb)
      into feature_summary
      from (
        select
          e->>'feature' as feature,
          round(avg(abs((e->>'impact')::numeric)),2) as mean_abs,
          round(avg((e->>'impact')::numeric),2) as mean_value
        from public.cw_v2_customers c
        cross join lateral jsonb_array_elements(c.shap) e
        group by e->>'feature'
      ) q;

      team_tools:=jsonb_build_object(
        'feature_summary',feature_summary,
        'guardrail','SHAP explica la predicción del modelo. No identifica el efecto de cambiar una variable.'
      );

    elsif g.current_round=2 then
      team_tools:=jsonb_build_object(
        'dag',jsonb_build_object(
          'nodes',jsonb_build_array(
            jsonb_build_object('id','risk','label','Riesgo previo'),
            jsonb_build_object('id','treat','label','Intervención'),
            jsonb_build_object('id','outcome','label','Renovación'),
            jsonb_build_object('id','mediator','label','Uso posterior'),
            jsonb_build_object('id','collider','label','Ticket resuelto')
          ),
          'edges',jsonb_build_array(
            jsonb_build_object('from','risk','to','treat','kind','confounding'),
            jsonb_build_object('from','risk','to','outcome','kind','confounding'),
            jsonb_build_object('from','treat','to','outcome','kind','causal'),
            jsonb_build_object('from','treat','to','mediator','kind','causal'),
            jsonb_build_object('from','mediator','to','outcome','kind','causal'),
            jsonb_build_object('from','treat','to','collider','kind','warning'),
            jsonb_build_object('from','risk','to','collider','kind','warning')
          ),
          'adjust_options',jsonb_build_array(
            jsonb_build_object('id','none','label','No ajustar','good',false,'highlights',jsonb_build_array(),'explanation','El camino Riesgo previo → Intervención y Riesgo previo → Renovación sigue abierto.'),
            jsonb_build_object('id','risk','label','Ajustar por riesgo previo','good',true,'highlights',jsonb_build_array('risk'),'explanation','Riesgo previo existe antes del tratamiento y amenaza la comparabilidad. Ajustarlo cierra el backdoor principal del escenario.'),
            jsonb_build_object('id','mediator','label','Ajustar por uso posterior','good',false,'highlights',jsonb_build_array('mediator'),'explanation','Uso posterior ocurre después de intervenir. Si buscas el efecto total, controlarlo puede retirar parte del efecto.'),
            jsonb_build_object('id','collider','label','Ajustar por ticket resuelto','good',false,'highlights',jsonb_build_array('collider'),'explanation','Ticket resuelto recibe causas de intervención y riesgo. Condicionar en él puede abrir una asociación espuria.')
          )
        ),
        'estimates',jsonb_build_array(
          jsonb_build_object('label','Diferencia cruda','value',-13),
          jsonb_build_object('label','Ajuste por X','value',3.9),
          jsonb_build_object('label','IPW','value',4.2)
        ),
        'overlap',jsonb_build_object(
          'treated',jsonb_build_array(.31,.39,.45,.51,.56,.61,.65,.69,.72,.75,.78,.81,.84,.87,.89,.91,.93,.95,.96,.97,.98,.82,.76,.68),
          'control',jsonb_build_array(.08,.12,.16,.20,.24,.28,.32,.36,.41,.45,.49,.53,.57,.61,.65,.69,.72,.75,.78,.81,.84,.58,.43,.27)
        ),
        'balance',jsonb_build_array(
          jsonb_build_object('name','Riesgo previo','before',.62,'after',.07),
          jsonb_build_object('name','Antigüedad','before',.28,'after',.05),
          jsonb_build_object('name','Uso histórico','before',.19,'after',.08),
          jsonb_build_object('name','Ingreso','before',.14,'after',.04)
        )
      );

    elsif g.current_round=3 then
      team_tools:=jsonb_build_object(
        'business_threshold_pp',2,
        'precision_curve',jsonb_build_array(
          jsonb_build_object('n',200,'mde_pp',12.2,'ci_half_pp',8.6),
          jsonb_build_object('n',500,'mde_pp',7.7,'ci_half_pp',5.5),
          jsonb_build_object('n',1000,'mde_pp',5.5,'ci_half_pp',3.9),
          jsonb_build_object('n',2000,'mde_pp',3.9,'ci_half_pp',2.8),
          jsonb_build_object('n',5000,'mde_pp',2.5,'ci_half_pp',1.8),
          jsonb_build_object('n',10000,'mde_pp',1.8,'ci_half_pp',1.3),
          jsonb_build_object('n',20000,'mde_pp',1.2,'ci_half_pp',.9)
        ),
        'design_note','La precisión cambia con N. La validez depende de cómo se asigna el tratamiento.'
      );

    elsif g.current_round=4 then
      team_tools:=jsonb_build_object(
        'econml',jsonb_build_array(
          jsonb_build_object('segment','digital','name','Digitales','t_learner',12.8,'dr_learner',13.4,'causal_forest',13.7),
          jsonb_build_object('segment','middle','name','Ingreso medio','t_learner',8.4,'dr_learner',9.1,'causal_forest',9.5),
          jsonb_build_object('segment','traditional','name','Tradicionales','t_learner',2.1,'dr_learner',3.2,'causal_forest',4.0),
          jsonb_build_object('segment','wealth','name','Patrimonio alto','t_learner',.5,'dr_learner',1.2,'causal_forest',1.5),
          jsonb_build_object('segment','arrears','name','Mora alta','t_learner',-4.2,'dr_learner',-5.1,'causal_forest',-5.6)
        ),
        'placebo',jsonb_build_object(
          'effect_pp',4.7,
          'ci_low',1.5,
          'ci_high',7.9,
          'message','El outcome placebo fue medido antes de la campaña. Un efecto distinto de cero cuestiona la historia causal o el pipeline.'
        ),
        'provenance','Estimaciones precomputadas sobre el escenario sintético para comparar T-Learner, DR-Learner y CausalForestDML.'
      );
    end if;
  end if;

  if g.status in ('reveal','teaching','microcheck','finished') then
    if g.current_round=1 then
      select coalesce(jsonb_agg(jsonb_build_object(
        'id',customer_id,
        'name',name,
        'segment',segment,
        'score',predictive_score,
        'p0',p0,
        'p1',p1,
        'uplift_pp',round(((p1-p0)*100)::numeric,1)
      ) order by customer_id),'[]'::jsonb)
      into reveal_tools
      from public.cw_v2_customers;
      reveal_tools:=jsonb_build_object('score_uplift',reveal_tools);

    elsif g.current_round=3 then
      reveal_tools:=jsonb_build_object(
        'experiment',jsonb_build_object(
          'treatment_rate',31,
          'control_rate',25,
          'ate_pp',6,
          'ci_low',2.2,
          'ci_high',9.8
        )
      );

    elsif g.current_round=4 then
      select coalesce(jsonb_agg(jsonb_build_object(
        'id',segment_id,
        'name',name,
        'audience',audience,
        'effect_pp',effect_pp,
        'ci_low',ci_low,
        'ci_high',ci_high,
        'value_per_result',value_per_result,
        'unit_cost',unit_cost,
        'risk',risk
      ) order by segment_id),'[]'::jsonb)
      into segment_rows
      from public.cw_v2_segments;

      reveal_tools:=jsonb_build_object(
        'segments',segment_rows,
        'placebo',jsonb_build_object(
          'effect_pp',4.7,
          'ci_low',1.5,
          'ci_high',7.9,
          'message','La prueba placebo sigue siendo incompatible con una historia causal limpia. La política debe reconocer esa incertidumbre.'
        )
      );
    else
      reveal_tools:=jsonb_build_object();
    end if;
  end if;

  return jsonb_build_object(
    'round',g.current_round,
    'status',g.status,
    'team_ready',all_submitted,
    'team_tools',team_tools,
    'reveal_tools',reveal_tools
  );
end $$;

revoke all on function public.cw_v2_analysis(text) from public,anon,authenticated;
grant execute on function public.cw_v2_analysis(text) to service_role;
