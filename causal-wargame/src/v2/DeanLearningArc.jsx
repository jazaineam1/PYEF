import React,{useCallback,useEffect,useState} from 'react';
import './dean-learning.css';

// Public learning narrative has NO answer keys or scoring formulas.
// Teacher controls two reveals; answers and XP are calculated server-side.
export const DEAN_ARC={
 lobby:{
  act:'PRÓLOGO',time:'00–10',icon:'🪞',title:'Los dos futuros',
  question:'El Rector tiene un cupo. Ana tiene PGA 4.6 y Bruno PGA 2.9. ¿Con esos datos a quién ayudarías para lograr el MAYOR cambio de nota?',
  choices:[
   'A Ana: tiene mayor probabilidad de aprobar.',
   'B No sabemos cuál ganaría más: necesitamos comparar futuros bajo intervención.',
   'C A Bruno: su PGA es más bajo, por lo tanto necesariamente se beneficiará más.'
  ],
  evidence:'Dos estudiantes pueden tener diferente probabilidad de aprobar y el mismo beneficio, o beneficios opuestos. Solo conocemos un resultado por persona real. Los dos futuros que conoce el simulador son VERDAD SINTÉTICA, no dos observaciones reales.',
  reveal:'Contrafactual: el resultado alternativo que no observamos. T = intervención; Y = nota final. La predicción de Y no determina el cambio Y(1)−Y(0).',
  trap:'Predicción de nota ≠ efecto incremental de una intervención.',
  teacher:'Pregunta quién recibiría el cupo. Muestra dos tarjetas y explica que todavía no conocemos ningún efecto individual.',
  expected:'El alumno distingue probabilidad prevista y efecto de bienestar.',
  example:'Ana: nota prevista 44/50. Bruno: 30/50. Efecto de bienestar: aún DESCONOCIDO.',
 },
 exams:{
  act:'ACTO 1',time:'10–30',icon:'🎮',title:'La estrategia que gana no siempre causa mejoras',
  question:'Tu sala está obteniendo notas altas y ha usado poco descanso. ¿Qué debería recomendar el Rector para todos?',
  choices:[
   'A Exigir más estudio y menos sueño: el grupo tiene notas altas.',
   'B No universalizar la estrategia: hay autoselección, fatiga no observada y alternativas causales.',
   'C Reproducir la combinación del primer puesto: ganar equivale a descubrir la política óptima.'
  ],
  evidence:'Tu sala decidió sus horas voluntariamente; otras salas tienen arquetipos y dificultades diferentes. El motor acumula fatiga sintética que los alumnos NO observan. Un ranking académico solo compara notas, no determina el efecto de imponer una política.',
  reveal:'El contraste entre equipos es observacional, con selección y mecanismos ocultos. Una intervención requiere tratamiento definido, comparador, resultado y supuestos.',
  trap:'Competir por una nota no identifica el efecto causal de dormir menos.',
  teacher:'Después del juego, compara dos estrategias y evita describir la fatiga sintética como diagnóstico médico. Pregunta qué pasaría si obligáramos a todos a imitar al líder.',
  expected:'Los alumnos cuestionan la generalización desde una competencia sesgada.',
  example:'PGA, dificultad, horas y arquetipos son distintos entre jugadores; la media del equipo NO es un ATE.'
 },
 rector:{
  act:'ACTO 2',time:'30–55',icon:'🏛️',title:'El modelo predice; el Rector se equivoca',
  question:'Tu Random Forest reporta MAE y R² de prueba, posiblemente incluso R² negativo si la sala es pequeña. ¿Qué puedes concluir sobre intervenir en bienestar?',
  choices:[
   'A Reducir bienestar: el coeficiente de asociación alcanza para inferir causalidad.',
   'B Repetir el predictor con más árboles convierte una predicción en causal.',
   'C Predice notas; todavía falta un diseño causal para saber qué pasa al cambiar bienestar.'
  ],
  evidence:'Un predictor aprende E[Y|X], no E[Y|do(B)]. MAE mide error de predicción; R² resume ajuste predictivo. El código de esta misión usa datos disponibles del Rector y separa estudiantes entre entrenamiento y prueba cuando hay muestra suficiente.',
  reveal:'Contrastar una predicción «cambiando B» NO equivale al efecto de intervenir do(B). Sesgo de selección y mecanismos omitidos pueden contaminar esa comparación.',
  trap:'La precisión del modelo no prueba identificación causal.',
  teacher:'Ejecuta el modelo real y explica MAE/R² con unidades. Pregunta qué falta: comparabilidad y una intervención definida.',
  expected:'Separar predicción de efecto causal independientemente de que el R² sea alto, bajo o negativo.',
  example:'Con R²=0,95 o R²=−0,50 no se demuestra cuánto cambia Y por imponer B=4 h. R² negativo significa que en prueba el modelo predijo peor que la media de esa muestra.'
 },
 survey:{
  act:'ACTO 3',time:'55–80',icon:'🕸️',title:'DAG Detective: las flechas importan',
  question:'Quieres el efecto TOTAL de bienestar B sobre nota Y. ¿Qué ajuste elegirías a partir del DAG sintético?',
  choices:[
   'A Controlar estudio, sueño y fatiga posteriores: cuantas más columnas, mejor.',
   'B Considerar ARQUETIPO y PGA como antecedentes, sin ajustar automáticamente estudio, sueño o fatiga posteriores.',
   'C Ignorar el momento de medición y ajustar por toda variable correlacionada con Y.'
  ],
  evidence:'El arquetipo configura PGA, bienestar basal, estudio y sueño basales; por eso es una causa común que PGA sola no controla por completo. Estudio y sueño también responden a cambios de B y son mediadores en el mecanismo del ZIP. Condicionar un mediador puede bloquear parte del efecto total. En otro ejemplo, condicionar un collider puede ABRIR un camino espurio.',
  reveal:'DAG = grafo acíclico dirigido de HIPÓTESIS causales. Antes de estimar, decide qué causas previas cerrar y qué mecanismos no bloquear. Ajustar arquetipo y PGA puede ayudar, pero la falta de solapamiento de bienestar entre perfiles limita la identificación. La fatiga U continúa oculta para el jugador.',
  trap:'Ajustar por todo puede sesgar el efecto total; tampoco podemos ajustar por U si no fue medida.',
  teacher:'Pide tocar confusor, mediador y collider. Este collider es una VIÑETA EXTRA, no una nueva flecha del DGP. Tras las decisiones, explica el efecto total.',
  expected:'Incluir arquetipo y PGA, evitar mediadores posteriores y comprobar positividad sin prometer identificación automática.',
  example:'Grafo principal: arquetipo→{PGA, B, estudio basal, sueño basal}; PGA→{B,Y}; B→estudio/sueño→Y. Viñeta adicional: B→tutorías←dificultad.',
 },
 causal:{
  act:'ACTO 4',time:'80–105',icon:'⚗️',title:'Doctor Strange: ¿a quién ayudar?',
  question:'Un A/B pequeño ofrece una estimación imprecisa; los CATE pueden ser positivos para algunos perfiles y negativos para otros. Con seis cupos, ¿qué política defenderías?',
  choices:[
   'A Atender solo a quienes tienen mayor nota predicha, sin medir impacto.',
   'B Prometer que todos ganarán el ATE exactamente, porque ya se aleatorizó.',
   'C Considerar beneficio incremental por perfiles, incertidumbre, cupos y equidad; validar antes de escalar.'
  ],
  evidence:'Se sorteó T por ESTUDIANTE sintético, no por cada examen: T=1 impone B=4 h; T=0 impone B=0 h. El ATE observado es estimado; el IC refleja incertidumbre. CATE estudia promedios condicionales por perfiles, no futuros individuales observables.',
  reveal:'DML usa modelos auxiliares para T e Y, predicciones fuera de muestra y residuos; no corrige confusión latente sin supuestos. Ninguna familia de estimadores arregla una identificación equivocada.',
  trap:'ATE estimado positivo o negativo puede ser compatible con un IC amplio. CATE negativo no implica abandonar a un perfil: exige evaluar alternativas, no imponer una ayuda supuestamente benéfica.',
  teacher:'Proyecta A/B e IC; muestra X→T y X→Y, residuos y cross-fitting en Pyodide. Compara CATE y sus limitaciones: el benchmark NO contiene IC por perfil; no se pueden prometer beneficios individuales. Señala que 30 alumnos aportan poca potencia para un ATE pequeño.',
  expected:'Distinguir ATE de CATE y decidir una política bajo restricciones.',
  example:'Dos perfiles con la misma nota esperada pueden responder de modo distinto. Toda estimación es sintética.'
 }
};
export const DEAN_CONCEPTS={
 lobby:[
  ['Tratamiento T','Una acción definida. En la Copa: asignar B=4 horas de bienestar frente a B=0 horas.'],
  ['Resultado Y','Nota final de un examen, entre 0 y 50, generada por el simulador.'],
  ['Contrafactual','Resultado alternativo bajo otro tratamiento. En personas reales no vemos ambos futuros de la misma persona.']
 ],
 exams:[
  ['Correlación','Dos variables cambian juntas en los datos observados. No dice qué sucedería al intervenir.'],
  ['Selección','Los alumnos eligen horarios y tienen PGA y arquetipos diferentes; los grupos observados pueden no ser comparables.'],
  ['Fatiga artificial U','Variable generada mediante ecuaciones del juego, no diagnóstico clínico. Puede mediar efectos de bienestar.']
 ],
 rector:[
  ['Pearson r','Mide asociación lineal entre −1 y +1. No son puntos de nota por hora ni demuestra causalidad.'],
  ['Pendiente observacional','Coeficiente en puntos/hora del ajuste estadístico. Cambia al controlar variables y no equivale por sí mismo a do(B).'],
  ['MAE y R²','MAE es error medio absoluto en puntos; R² resume calidad de predicción fuera de muestra, no efecto de una política.']
 ],
 survey:[
  ['DAG','Grafo acíclico dirigido con flechas causales SUPUESTAS por el generador, no aprendidas de correlaciones.'],
  ['Confusor','En este generador, el arquetipo es una causa común del PGA y de las decisiones basales de bienestar, estudio y sueño. PGA sola puede no eliminar su confusión.'],
  ['Mediador','Variable posterior por la que transcurre parte del efecto total. Ajustarla puede quitar ese camino.'],
  ['Collider','Variable causada por dos nodos; condicionarla puede abrir un camino espurio. El ejemplo de tutorías es externo al DGP.']
 ],
 causal:[
  ['A/B aleatorizado','El tratamiento B=0 o B=4 se sortea una vez por estudiante sintético, no por cada examen.'],
  ['ATE e intervalo','ATE es un efecto promedio poblacional. Una diferencia observada con IC amplio no demuestra ausencia ni presencia definitiva de efecto. Las unidades independientes aquí son los 30 alumnos sintéticos.'],
  ['DML','Modelos auxiliares T(X)/Y(X), folds, residuos y estimación. No corrige confusión no observada automáticamente.'],
  ['CATE y política','Efecto promedio condicionado por perfil: orienta decisiones con cupos y equidad, pero no garantiza beneficio individual.']
 ]
};
function DeanConcepts({phase}){
 const items=DEAN_CONCEPTS[phase]||[];
 return <details className="dean-concepts" aria-label="Glosario causal contextual de este acto">
   <summary>📚 Conceptos desbloqueados · {items.length} definiciones útiles</summary>
   <div>{items.map(([name,definition])=><article key={name}><strong>{name}</strong><p>{definition}</p></article>)}</div>
  </details>
}

export const learningLabel=step=>({challenge:'DECIDE',evidence:'NUEVA EVIDENCIA',debrief:'DESCUBRIMIENTO'})[step]||'ESPERANDO';

export function useDeanLearning({token='',gameCode,enabled=true,teacherToken=''}) {
 const [data,setData]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const base=(import.meta.env.VITE_FUNCTIONS_BASE_URL||'').replace(/\/$/,'');
 const load=useCallback(async(signal)=>{
  if(!enabled||!gameCode||!base.startsWith('https://'))return;
  const response=await fetch(base+'/v2-dean-cup',{method:'POST',cache:'no-store',
   headers:{'content-type':'application/json',...(token?{'x-game-token':token}:{})},
   body:JSON.stringify({action:'learning_state',game_code:gameCode}),signal});
  const o=await response.json();if(!response.ok)throw Error(o.error||'No fue posible leer la misión');
  setData(o);setError('');
 },[enabled,gameCode,base,token]);
 useEffect(()=>{
  if(!enabled)return;
  const controller=new AbortController();let live=true;
  async function poll(){try{await load(controller.signal)}catch(e){if(live&&!controller.signal.aborted)setError(e.message)}}
  poll();const id=setInterval(poll,3900);
  return()=>{live=false;clearInterval(id);controller.abort()}
 },[load,enabled]);
 const act=async(payload)=>{
  if(!base.startsWith('https://'))throw Error('Backend HTTPS no configurado');
  setBusy(true);setError('');
  try{
   const res=await fetch(base+'/v2-dean-cup',{method:'POST',
    headers:{'content-type':'application/json',...(token?{'x-game-token':token}:{}),
     ...(teacherToken?{'x-facilitator-token':teacherToken}:{})},
    body:JSON.stringify(payload)});
   const o=await res.json();if(!res.ok)throw Error(o.error||'Acción no confirmada');
   await load();return o;
  }catch(e){setError(e.message);throw e}finally{setBusy(false)}
 };
 return {data,error,busy,act};
}

function DeanLearningMap({phase}){
 const items=[['lobby','Contrafactual'],['exams','Sesgo'],['rector','Correlación'],['survey','DAG'],
  ['causal','A/B · DML · CATE'],['final','Kahoot']];
 return <nav className="dean-learning-map" aria-label="Ruta de enseñanza del juego; el capacitador desbloquea cada acto">
  {items.map(([id,label])=><span key={id} className={id===phase?'active':undefined}>
   {id===phase?'◆ ':'○ '}{label}</span>)}
 </nav>
}
function DeanMissionScene({phase,step}){
 const seen=step!=='challenge';
 return <div className={'dean-quest-scene dean-quest-scene-'+phase} aria-label="Escena del videojuego causal">
  <span className="dean-quest-scene-tag">✦ CENTRO DE MANDO · MODO {seen?'EVIDENCIA':'INCERTIDUMBRE'}</span>
  {phase==='lobby'?<div className="dean-quest-figures">
   <div>🧑🏻‍🎓 <b>ANA</b><strong>PGA 4.6</strong><small>Beneficio: {seen?'no identificado':'???'}</small></div>
   <span className="dean-quest-versus">VS</span>
   <div>👩🏾‍🎓 <b>BRUNO</b><strong>PGA 2.9</strong><small>Beneficio: {seen?'no identificado':'???'}</small></div>
  </div>:
  phase==='exams'?<div className="dean-quest-figures"><div>📚 <b>ESTUDIO</b><strong>¿Cuánto?</strong></div><span className="dean-quest-versus">↔</span><div>😴 <b>DESCANSO</b><strong>¿Qué sacrificas?</strong></div><span className="dean-quest-versus">↔</span><div>🏃 <b>BIENESTAR</b><strong>¿Qué cambia?</strong></div></div>:
  phase==='rector'?<div className="dean-quest-figures"><div>📊 <b>MAE · R²</b><strong>Predicción</strong><small>¿Qué ocurrirá?</small></div><span className="dean-quest-versus">≠</span><div>⚡ <b>do(B)</b><strong>Intervención</strong><small>¿Qué cambiaría?</small></div></div>:
  phase==='survey'?<div className="dean-quest-figures"><div>🔎 <b>H · PGA</b><strong>Antes de B</strong></div><span className="dean-quest-versus">→</span><div>🏃 <b>B</b><strong>Bienestar</strong></div><span className="dean-quest-versus">→</span><div>📈 <b>Y</b><strong>Nota</strong></div></div>:
  <div className="dean-quest-figures"><div>🪞 <b>FUTURO 0</b><strong>B = 0 h</strong></div><span className="dean-quest-versus">VS</span><div>⚡ <b>FUTURO 1</b><strong>B = 4 h</strong></div><div>🎟️ <b>CUPOS</b><strong>20 %</strong></div></div>}
 </div>;
}

const GAME_CLUES={
 lobby:'Una nota prevista no revela cuánto cambiaría con una ayuda.',
 exams:'¡Cuidado! Las mejores notas no prueban la mejor política.',
 rector:'R² mide predicción, no cuánto cambia Y si imponemos B.',
 survey:'Arquetipo y PGA son anteriores; estudio y sueño pueden mediar.',
 causal:'30 alumnos sintéticos: el A/B tiene incertidumbre; CATE varía.'
};
const GAME_TAKEAWAYS={
 lobby:'Predecir NO es medir un efecto.',
 exams:'Ranking ≠ efecto causal.',
 rector:'Correlación y R² ≠ intervención.',
 survey:'Ajusta causas previas, no mediadores.',
 causal:'ATE ≠ CATE. Decide con incertidumbre.'
};
const GAME_CHOICES={
 lobby:['Dar a Ana el cupo','Todavía NO sabemos quién gana más','Dar a Bruno el cupo'],
 exams:['Todos deben dormir menos','No generalizar: hay selección','Copiar al líder'],
 rector:['La asociación basta','Más árboles resuelven causalidad','Predecir NO prueba un efecto'],
 survey:['Controlar todo, incluso mediadores','Arquetipo y PGA; proteger mediadores','Ajustar toda variable correlacionada'],
 causal:['Elegir por nota prevista','Prometer el mismo ATE a todos','Usar CATE, incertidumbre y equidad']
};

export function DeanLearningQuest({learning,phase,onSubmit,busy=false,error=''}) {
 const scene=DEAN_ARC[phase];
 const [choice,setChoice]=useState('');
 useEffect(()=>setChoice(''),[phase,learning?.step]);
 if(!scene||!learning?.available)return null;
 const step=learning.step||'challenge';
 const initial=learning.mine?.initial,revision=learning.mine?.revision;
 const kind=step==='challenge'?'initial':'revision';
 const submitted=kind==='initial'?initial:revision;
 const actionAvailable=step!=='debrief'&&!submitted&&!learning.paused&&
   (kind==='initial'||Boolean(initial));
 const choiceValue=submitted||choice;
 return <section className="dean-quest dean-game-quest" aria-label={'Reto causal '+scene.title}>
  <div className="dean-quest-header">
   <span className="dean-quest-chapter">{scene.icon} {scene.act} · {scene.time} MIN</span>
   <span className="dean-quest-step">◆ {learningLabel(step)} {learning.paused?'· PAUSADO':''}</span>
  </div>
  <h2>{scene.title}</h2>
  <DeanMissionScene phase={phase} step={step}/>
  <p className="dean-quest-question">{scene.question}</p>
  {step!=='challenge'&&<p className="dean-game-clue" role="status">⚡ {GAME_CLUES[phase]}</p>}
  <div className="dean-quest-choices" role="group" aria-label="Tu decisión causal">
   {scene.choices.map((option,i)=>{
    const key=['a','b','c'][i];
    return <button type="button" key={key} disabled={!actionAvailable}
     aria-pressed={choiceValue===key} className={'dean-quest-option '+(choiceValue===key?'is-selected':'')}
     onClick={()=>setChoice(key)}><b>{key.toUpperCase()}</b><span>{GAME_CHOICES[phase][i]}</span></button>;
   })}
  </div>
  {actionAvailable?<button type="button" className="dean-quest-submit" disabled={!choice||busy}
    onClick={()=>onSubmit({action:'learning_submit',phase,kind,choice})}>
    {busy?'Guardando…':kind==='initial'?'⚡ CONFIRMAR DECISIÓN':'🛡️ REVISAR MI DECISIÓN'}
   </button>:<p className="dean-quest-receipt" role="status">
    {submitted?'✓ Decisión guardada.':'⏳ Esperando la siguiente etapa.'}
   </p>}
  {step==='debrief'&&<div className="dean-quest-solution" role="status">
   <strong>🏆 {GAME_TAKEAWAYS[phase]}</strong>
   <small>Respuesta: {learning.correct?.toUpperCase()||'—'} · El docente desbloqueó la explicación.</small>
  </div>}
  <details className="dean-game-learn-more">
   <summary>📚 ¿Por qué? · Aprender causalidad</summary>
   <p>{step==='challenge'?'Primero elige. El juego revelará nueva información cuando avance el docente.':scene.evidence}</p>
   {step==='debrief'&&<p>{scene.reveal} <b>Error frecuente:</b> {scene.trap}</p>}
   {step!=='challenge'&&<DeanLearningMap phase={phase}/>}
   {step==='debrief'&&<DeanConcepts phase={phase}/>}
  </details>
  {error&&<p className="dean-quest-error" role="alert">{error}</p>}
 </section>;
}

export function DeanLearningInstructor({learning,phase,onAction,busy,error}) {
 const scene=DEAN_ARC[phase];
 if(!scene||!learning?.available)return null;
 const step=learning.step;
 const initials=Number(learning.counts?.initial||0),revisions=Number(learning.counts?.revision||0);
 const noEvidence=step==='challenge'?initials===0:step==='evidence'?revisions===0:false;
 const action=learning.paused?'resume':step==='challenge'?(noEvidence?'demo':'evidence'):
  step==='evidence'?(noEvidence?'demo':'debrief'):null;
 const title={resume:'▶ Reanudar',demo:'👀 Demostración · sin puntos',
  evidence:'⚡ Dar pista y abrir revisión',debrief:'🏁 Revelar solución'}[action];
 return <section className="dean-quest-control">
  <div className="dean-quest-chapter">🎓 GUION DOCENTE · {scene.time} MIN · {scene.act}</div>
  <h3>{scene.title}</h3>
  <div className="dean-teacher-brief">
   {phase==='lobby'?'🎯 Pregunta quién gana más con el cupo. No des todavía la respuesta.':
    phase==='exams'?'🎮 Deja jugar. El ranking NO demuestra qué intervención funciona.':
    phase==='rector'?'📊 Muestra la asociación: R² NO demuestra efectos de bienestar.':
    phase==='survey'?'🕸️ Busca arquetipo, PGA y mediadores en el DAG.':
    '⚡ Compara A/B e IC; después decide seis cupos con CATE.'}
  </div>
  <details className="dean-teacher-script">
   <summary>📚 Guion completo y conceptos (opcional)</summary>
   <p><b>Di:</b> {scene.teacher}</p>
   <p><b>Proyecta:</b> {scene.example}</p>
   <p><b>Comprueba:</b> {scene.expected}</p>
   <DeanLearningMap phase={phase}/>
   <DeanConcepts phase={phase}/>
  </details>
  <div className="dean-quest-counts">
   <span>Intuiciones: <b>{learning.counts?.initial||0}/{learning.registered||0}</b></span>
   <span>Revisiones: <b>{learning.counts?.revision||0}/{learning.registered||0}</b></span>
  </div>
  {noEvidence&&<p className="dean-quest-hint">⚠️ Aún no hay evidencias para cerrar este paso. Puedes esperar respuestas o proyectar una demostración SIN puntos.</p>}
  <div className="dean-quest-toolbar">
   {action&&<button type="button" disabled={busy} onClick={()=>onAction(action)}>{busy?'Procesando…':title+' →'}</button>}
   {!learning.paused&&step!=='debrief'&&<button type="button" className="dean-quest-secondary" disabled={busy} onClick={()=>onAction('pause')}>⏸ Pausar</button>}
  </div>
  {step==='debrief'&&learning.distribution&&<div className="dean-quest-misconceptions">
   <strong>Respuestas revisadas después de la evidencia</strong>
   <div>{['a','b','c'].map(k=><span key={k}>{k.toUpperCase()}: {learning.distribution[k]||0} jugadores</span>)}</div>
   <small>Distribución agregada visible solo tras revelar, para explicar los errores frecuentes sin señalar personas.</small>
  </div>}
  {step==='debrief'&&<p className="dean-quest-done">✓ Solución proyectable. Puedes avanzar el acto cuando el grupo esté listo.</p>}
  {error&&<p role="alert" className="dean-quest-error">{error}</p>}
 </section>;
}

export function DeanLearningWall({learning,phase}) {
 const scene=DEAN_ARC[phase];
 if(!learning?.available)return null;
 const scores=learning.rooms||[];
 return <section className="dean-quest-wall" aria-label="Maestría causal de los equipos">
  <header><strong>🧠 MAESTRÍA CAUSAL</strong><span>{scene?learningLabel(learning.step):'CIERRE'}</span></header>
  {scene&&<p>{scene.title}</p>}
  <div className="dean-quest-wall-rooms">
   {scores.map(r=><div key={r.room_no}>
    <span>{['Alpha','Beta','Gamma','Delta','Épsilon'][r.room_no-1]} <small>{r.participants||0} jug.</small></span>
    <strong>{Number(r.participants)>0?(Number(r.learning_points||0)/Number(r.participants)).toFixed(0):'—'}<small> /100</small></strong>
   </div>)}
  </div>
  <small>Promedio de aprendizaje por inscrito · distinto a la nota académica.</small>
  {scene&&<p className="dean-quest-wall-activity">
   {learning.step==='challenge'?'⏳ Decisiones iniciales: ':learning.step==='evidence'?'⚡ Revisiones recibidas: ':'✓ Solución revelada: '}
   {learning.step==='challenge'?learning.counts?.initial||0:learning.counts?.revision||0} / {learning.registered||0}
  </p>}
  {learning.step==='debrief'&&learning.distribution&&<div className="dean-quest-misconceptions">
   <b>Votos tras revisar:</b> A {learning.distribution.a||0} · B {learning.distribution.b||0} · C {learning.distribution.c||0}
  </div>}
  {learning.step==='debrief'&&scene&&<p className="dean-quest-wall-wow">{scene.reveal}</p>}
 </section>
}
