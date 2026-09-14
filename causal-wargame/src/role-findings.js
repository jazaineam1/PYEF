export const ROLE_FINDINGS={
1:{
 business:[['scope_clear','La decisión debe fijar población, intervención, resultado y horizonte.'],['scope_missing','Todavía falta definir con precisión qué cambio queremos causar.']],
 data:[['prob_not_effect','Un score alto predice conversión, pero no demuestra efecto de la intervención.'],['incremental_priority','Debemos priorizar cambio incremental, no sólo probabilidad alta.']],
 context:[['counterfactual_missing','La pregunta clave es qué habría pasado con esos mismos clientes sin intervenir.'],['comparison_needed','Necesitamos una comparación creíble para hablar de causa.']],
 integrator:[['need_control','Hace falta un grupo o condición de comparación.'],['design_before_result','El diseño debe definirse antes de mirar el resultado.']],
 risk:[['waste_risk','Podemos gastar presupuesto en personas que convertirían de todas formas.'],['harm_check','Antes de escalar, debemos revisar posible daño o desperdicio.']]
},
2:{
 business:[['redesign_first','No cancelaría ni escalaría: primero rediseñaría la comparación.'],['evidence_before_action','La diferencia cruda no alcanza para una decisión irreversible.']],
 data:[['adjust_changes_story','El resultado crudo cambia al ajustar por diferencias previas.'],['raw_not_enough','La tasa observada sola no identifica el efecto.']],
 context:[['prior_mora_confounder','Mora previa es una causa previa plausible de llamada y pago.'],['dag_warns_bias','El DAG muestra una ruta de confusión que debemos bloquear o ajustar.']],
 integrator:[['observational_limits','Sin asignación aleatoria necesitamos supuestos y ajuste explícitos.'],['comparison_not_random','Tratados y no tratados no fueron formados con la misma regla.']],
 risk:[['dont_cancel_raw','Cancelar sólo por −15 pp crudos sería una decisión riesgosa.'],['reversible_first','Primero escogería una acción reversible mientras mejora la evidencia.']]
},
3:{
 business:[['outcome_horizon_fixed','Resultado y horizonte deben quedar definidos antes del experimento.'],['decision_metric','La métrica debe corresponder a la decisión de negocio, no al indicador más fácil.']],
 data:[['prediction_not_design','AUC y score no reemplazan la evidencia experimental.'],['model_supports_not_proves','El modelo puede segmentar, pero el experimento identifica el efecto.']],
 context:[['random_breaks_selection','La asignación aleatoria rompe el vínculo sistemático entre perfil y tratamiento.'],['pre_treatment_balance','Debemos revisar que las características previas queden balanceadas.']],
 integrator:[['random_assignment','Asignaría al azar entre elegibles y estimaría la diferencia promedio.'],['ate_with_uncertainty','Reportaría ATE junto con intervalo de confianza.']],
 risk:[['relevant_outcome','No aceptaría un proxy rápido si la decisión depende de pago real.'],['control_protects','El grupo control evita atribuir al tratamiento cambios que habrían ocurrido igual.']]
},
4:{
 business:[['policy_not_everyone','Una política debe decidir quién tratar, no sólo reportar un promedio.'],['capacity_matters','La capacidad limitada obliga a priorizar segmentos.']],
 data:[['uplift_over_score','La Lente de Uplift prioriza efecto incremental, no probabilidad base.'],['heterogeneous_effects','Hay perfiles con efectos muy distintos aunque su score sea parecido.']],
 context:[['identified_before_cate','Sólo interpretaré CATE causal si el efecto está identificado.'],['heterogeneity_needs_structure','La heterogeneidad no corrige por sí sola un diseño sesgado.']],
 integrator:[['ate_and_cate','Resumiría ATE, CATE e incertidumbre antes de decidir.'],['segment_evidence','Compararía evidencia por segmento y evitaría sobreinterpretar grupos pequeños.']],
 risk:[['avoid_negative','Evitaría segmentos con efecto o valor neto negativo.'],['roi_plus_harm','ROI positivo no basta: también revisaría capacidad, riesgo y daño.']]
}}

export function findingLabel(round,role,code){return ROLE_FINDINGS?.[round]?.[role]?.find(x=>x[0]===code)?.[1]||code}
