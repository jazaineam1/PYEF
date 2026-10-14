import React,{useState} from 'react'
const content={
 1:{
  title:'No confundas a quien aprobará con quien mejorará',
  ask:'Si alguien tiene 92 % de probabilidad de aprobar, ¿es quien más mejora al recibir apoyo?',
  metaphor:'Un pronóstico del clima no hace que llueva: describir un resultado no es cambiarlo.',
  steps:['Alto pronóstico','¿Y si intervenimos?','Beneficio desconocido'],
  example:'Ejemplo ficticio: Ana tiene 92 % de probabilidad de aprobar; Bruno 62 %. Estos porcentajes solos NO revelan el efecto de apoyarlos.',
  challenge:'¿Un cambio en la predicción demuestra que forzar horas de estudio cambia la nota?',
  choices:['Sí, porque el modelo aprende patrones','No: cambiar X en el predictor no es una intervención identificada'],
  correct:1,
  term:'Predicción ≠ efecto causal',full:'Un predictor estima resultados probables; el efecto causal compara dos posibles resultados bajo acciones alternativas.',
  formula:'Efecto = Y(1) − Y(0), no P(aprobar | X)',
  pitfall:'El contrafactual de una persona real no se observa simultáneamente; los dos futuros mostrados como verdad son solo sintéticos.'
 },
 2:{
  title:'Dos grupos comparables: por qué aleatorizar cambia la discusión',
  ask:'¿Cuánto cambió la nota por ofrecer el plan, y con qué incertidumbre?',
  metaphor:'Sorteamos el apoyo: al azar tratamos de que las causas previas se mezclen equitativamente.',
  steps:['Sorteo A/B','Dos medias','Diferencia + intervalo'],
  example:'Ejemplo independiente: media de control 31,4, media de tratamiento 37,1, diferencia observada +5,7 puntos (no es el dato real del juego).',
  challenge:'¿Todos los estudiantes mejoran exactamente la diferencia de medias?',
  choices:['Sí, el promedio describe cada caso','No, es una estimación del promedio con variación'],
  correct:1,term:'RCT, ATE e IC 95 %',
  full:'RCT: ensayo aleatorizado. ATE: efecto promedio del tratamiento. IC: intervalo que resume la incertidumbre del procedimiento.',
  formula:'ATE = E[Y(1) − Y(0)]',
  pitfall:'Si aleatorizamos una OFERTA con incumplimiento, la diferencia estima directamente ITT, no necesariamente el efecto de recibir el apoyo.'
 },
 3:{
  title:'DAG detective: más controles no siempre significa menos sesgo',
  ask:'¿Debemos controlar horas de estudio medidas después de ofrecer apoyo?',
  metaphor:'Un mapa causal ayuda a decidir qué caminos bloquear; no todas las flechas significan lo mismo.',
  steps:['PGA anterior → apoyo y nota','Apoyo → estudio posterior → nota','Apoyo → tutoría posterior ← dificultad'],
  example:'Mini experimento numérico con Python: efecto total 4,8; controlar un mediador puede reducir la estimación, y controlar un collider puede sesgarla.',
  challenge:'¿Qué harías con un mediador para estimar el efecto TOTAL?',
  choices:['Lo controlo siempre','Evito controlarlo sin razonamiento causal'],
  correct:1,term:'DAG: grafo acíclico dirigido',
  full:'Confusor: causa previa común. Mediador: mecanismo intermedio. Collider: variable con dos flechas que entran.',
  formula:'PGA previo → apoyo → nota; apoyo → mediador → nota',
  pitfall:'El DAG es un supuesto del mecanismo, no una prueba obtenida automáticamente de correlaciones.'
 },
 4:{
  title:'DML: quita lo explicado antes de estimar',
  ask:'¿Cómo aislar una relación de tratamiento y resultado con muchas covariables previas?',
  metaphor:'Como retirar dos capas de ruido: una del apoyo esperado y otra de la nota esperada.',
  steps:['Predecir T a partir de X','Predecir Y a partir de X','Residuos fuera de muestra → efecto'],
  example:'El laboratorio calcula T residual = T − e(X), Y residual = Y − m(X) y su relación, con cross-fitting.',
  challenge:'¿DML arregla una causa importante que nunca observamos?',
  choices:['Sí, porque usa modelos potentes','No: ajusta lo observado bajo supuestos'],
  correct:1,term:'DML: Double Machine Learning',
  full:'Aprendizaje automático doble: modelos auxiliares, score ortogonal y cross-fitting para estimar el efecto bajo supuestos defendibles.',
  formula:'Tᵣ = T − e(X); Yᵣ = Y − m(X); efecto ≈ cov(Tᵣ,Yᵣ)/var(Tᵣ)',
  pitfall:'Sin ignorabilidad condicional, consistencia o soporte común, un DML sofisticado no garantiza lectura causal.'
 },
 5:{
  title:'ATE vs. CATE: un promedio puede ocultar personas diferentes',
  ask:'¿A quién das los cupos cuando el programa ayuda mucho a unos y poco a otros?',
  metaphor:'La temperatura media de un país no describe el clima de cada ciudad.',
  steps:['ATE de toda la población','CATE de cada perfil','Política con capacidad limitada'],
  example:'Ejemplo didáctico: dos grupos tienen beneficios sintéticos +9 y +1, pero comparten el mismo promedio +5.',
  challenge:'¿Elegirías a quienes probablemente tienen mayor nota final?',
  choices:['Sí, porque aprobarán','No, priorizo beneficio incremental, límites y equidad'],
  correct:1,term:'CATE: Conditional Average Treatment Effect',
  full:'Efecto promedio del tratamiento condicionado a X. No equivale necesariamente al efecto individual exacto.',
  formula:'CATE(x) = E[Y(1) − Y(0) | X=x]',
  pitfall:'Una política necesita incertidumbre, protección de grupos y cupos; no solamente ordenar números.'
 },
 6:{
  title:'Batalla de estimadores: primero identificación, luego algoritmo',
  ask:'¿Que un Causal Forest tenga menor RMSE demuestra validez causal universal?',
  metaphor:'El mapa más preciso no arregla que hayamos dibujado la ciudad equivocada.',
  steps:['Mismo experimento académico','T-Learner / DR-Learner / Causal Forest','RMSE de CATE reservado'],
  example:'Los resultados EconML 0.16.0 reales de esta V2 se entrenaron offline sobre 1.500 filas y evaluaron sobre 500.',
  challenge:'¿Podemos declarar ganador universal al bosque causal?',
  choices:['Sí: tiene el menor error en este experimento','No: su ventaja es local al escenario y requiere identificación'],
  correct:1,term:'EconML: Econometric Machine Learning',
  full:'Biblioteca de estimadores; TLearner ajusta modelos por tratamiento, DRLearner utiliza corrección doble, CausalForestDML aprende heterogeneidad.',
  formula:'RMSE(CATE) = √promedio[(CATE estimado − CATE sintético verdadero)²]',
  pitfall:'EconML se ejecutó en CPython fuera de Pyodide; este teléfono interpreta un benchmark real, no ajusta el modelo completo.'
 }
}
export function CausalExplainer({round}){
 const d=content[round]
 const [selected,setSelected]=useState(null)
 const [technical,setTechnical]=useState(false)
 if(!d)return null
 return <section className="v2-concept-lab" aria-label={'Explicación interactiva causal misión '+round}>
  <div className="v2-kicker">DEL ASOMBRO AL CONCEPTO · EXPERIENCIA GUIADA</div>
  <h2>{d.title}</h2>
  <div className="v2-concept-grid">
   <div className="v2-concept-story"><h3>1 · El problema humano</h3><p>{d.ask}</p><blockquote>{d.metaphor}</blockquote>
     <div className="v2-concept-chain">{d.steps.map((step,i)=><React.Fragment key={step}>
        {i>0&&<span aria-hidden="true">→</span>}<strong>{step}</strong>
      </React.Fragment>)}</div>
     <p className="v2-concept-example">Microejemplo sintético: {d.example}</p>
   </div>
   <div className="v2-concept-try"><h3>2 · Decide antes de ver la explicación</h3><p>{d.challenge}</p>
     {d.choices.map((choice,i)=><button key={i} type="button" disabled={selected!==null}
      className={(selected===i?'chosen ':'')+(selected!==null&&i===d.correct?'correct':'')}
      onClick={()=>setSelected(i)}>{i===0?'A':'B'} · {choice}</button>)}
     {selected!==null&&<div role="status" className="v2-concept-feedback">
       <b>{selected===d.correct?'✓ Decisión defendible':'Revisa tu intuición'}</b>
       <p>{d.full}</p><p><strong>WOW / precaución:</strong> {d.pitfall}</p>
       <button type="button" onClick={()=>setSelected(null)}>Probar otra vez</button>
     </div>}
   </div>
  </div>
  <button className="v2-concept-more" type="button" onClick={()=>setTechnical(v=>!v)} aria-expanded={technical}>
   {technical?'Ocultar traducción técnica':'3 · Ahora sí: nombre técnico, glosario y fórmula interpretada'}
  </button>
  {technical&&<div className="v2-concept-definition"><strong>{d.term}</strong><p>{d.full}</p><code>{d.formula}</code><p>Error frecuente: {d.pitfall}</p></div>}
 </section>
}
