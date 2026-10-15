// Fictional academic-life storytelling. Actual scores and hours are server records.
// This never predicts a human being's grades or estimates causal interventions.
export const LIFE_SCENES=[
 {title:'El primer gran parcial',story:'Arranca un semestre exigente. Solo tienes 14 horas para repartir entre preparación, sueño y bienestar. ¿Qué priorizas?'},
 {title:'La semana se aprieta',story:'Hay entregas en varias materias. La tentación es estudiar más; tu descanso también ocupa horas.'},
 {title:'El día de las decisiones difíciles',story:'Tus compañeros llevan otras estrategias. No puedes copiar sus horas: tu arquetipo tiene sus propios límites.'},
 {title:'La acumulación del semestre',story:'Después de varias evaluaciones, ¿te conviene buscar cada punto posible o una rutina que puedas repetir?'},
 {title:'La recta final',story:'Queda poco margen para remontar. Recuerda que una nota aislada no define qué tan buena es tu rutina.'},
 {title:'Tu última semana',story:'La Copa termina hoy. ¿La forma en que organizaste tu tiempo te serviría para todo un semestre?'}
];
export const lifeScene=exam=>LIFE_SCENES[Math.max(0,(Number(exam)||1)-1)%LIFE_SCENES.length];

export function decisionConsequence(hours,score,previous=null){
 const h=hours||{},sleep=Number(h.sleep),wellness=Number(h.wellness),study=Number(h.study);
 if(!Number.isFinite(sleep)||!Number.isFinite(wellness)||!Number.isFinite(study))return null;
 const observations=[
  sleep<7?'Dormiste menos de 7 h: esta rutina puede ser difícil de sostener.':
  sleep>=8?'Reservaste al menos 8 h para dormir.':'Guardaste algo de tiempo para descansar.',
  wellness<1?'Dejaste casi sin espacio al bienestar.':
  wellness>=2?'Protegiste dos horas o más de bienestar.':'Reservaste algo de bienestar.',
  study>=5?'Apostaste fuerte por estudiar.':'Elegiste una preparación más contenida.'
 ];
 const grade=Number(score),last=previous==null?null:Number(previous);
 const variation=last==null||!Number.isFinite(last)||!Number.isFinite(grade)?'':
  ' Frente al examen anterior, tu nota '+(grade>last+.05?'subió '+(grade-last).toFixed(1):grade<last-.05?'bajó '+(last-grade).toFixed(1):'se mantuvo')+' puntos.';
 return observations.join(' ')+variation+
  ' Es lo observado en el simulador, no una prueba de causa y efecto.';
}

export function lifeProfile(summary){
 if(!summary||Number(summary.exams)<6)return {emoji:'🎒',title:'Tu historia está en marcha',text:'Completa los seis exámenes para descubrir tu temporada.'};
 if(Number(summary.simulated_exams)>0)return {emoji:'🤖',title:'Temporada automática',text:'Hay decisiones generadas por el sistema. Tus notas se conservan, pero no compites por el podio de mejores decisiones manuales.'};
 const grade=Number(summary.avg_grade),sleep=Number(summary.avg_sleep),well=Number(summary.avg_wellness);
 if(grade>=40&&sleep>=7&&well>=1.5)return {emoji:'🌟',title:'Estudiante brillante y equilibrado',text:'En esta partida combinaste notas altas con tiempo para descansar y cuidarte. Esa es la estrategia que tu historia simulada destaca.'};
 if(grade>=40)return {emoji:'⚡',title:'Rendimiento a toda velocidad',text:'En esta partida sacaste muy buenas notas, pero dejaste menos espacio para recuperar energía. ¿Te gustaría mantener esa agenda varios meses?'};
 if(grade>=32&&sleep>=7&&well>=1)return {emoji:'🌱',title:'Estratega de largo aliento',text:'Tus resultados fueron sólidos y defendiste espacios para dormir y vivir. Puedes intentar mejorar sin perder ese equilibrio.'};
 if(grade>=32)return {emoji:'🎯',title:'Competidor en construcción',text:'Lograste resultados útiles, pero tu rutina todavía exige decisiones difíciles. Prueba otra distribución y compara la temporada.'};
 return {emoji:'🧩',title:'El semestre que te enseñó a elegir',text:'En esta partida aún hay margen de mejora. Cambiar la distribución de horas puede generar otros resultados dentro del simulador.'};
}
export function podiumEligible(rec){return Array.isArray(rec?.top3)?rec.top3:[]}
