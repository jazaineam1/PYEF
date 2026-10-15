import React,{useEffect,useState} from 'react';
import './dean-quiz-arena.css';

const LETTERS=['a','b','c','d'];
const ROOM_NAMES=['Alpha','Beta','Gamma','Delta','Épsilon'];
const WIN_MEDALS=['🥇','🥈','🥉'];

function Podium({players=[],role='student',mine=null,participants=0,myPosition=null,myPoints=0}){
 const hasWinner=players.some(p=>Number(p.points)>0);
 const champions=hasWinner?players.filter(p=>p.position===1):[];
 const winner=champions.length===1?champions[0]?.alias:champions.slice(0,3).map(p=>p.alias).join(' · ')+(champions.length>3?' y '+(champions.length-3)+' más':'');
 const top=hasWinner?players.filter(p=>Number(p.position)<=3):[];
 return <div className="dean-final-ceremony" role="region" aria-label="Ceremonia final de premiación">
   <div className="dean-confetti" aria-hidden="true">{Array.from({length:30},(_,i)=><i key={i} style={{'--c':i%5,'--x':(i*37+9)%100+'%','--delay':(i%9)*-.58+'s','--duration':3.5+(i%7)*.42+'s'}}/>)}</div>
   <header className="dean-final-hero">
    <span className="dean-final-crown" aria-hidden="true">🏆</span>
    <div><small>LA COPA DEL DECANO · GRAN FINAL</small>
    <h2>{champions.length>1?'¡FELICIDADES, CAMPEONES!':champions.length===1?'¡FELICIDADES AL CAMPEÓN!':players.length?'¡FELICIDADES POR COMPLETAR LA COPA!':'GRAN FINAL · SIN PARTICIPANTES'}</h2>
    {champions.length>0?<p>Un aplauso para <strong>{winner}</strong>{champions.length===1?', primer lugar de la batalla causal.':' — comparten el primer lugar.'}</p>:players.length>0?<p>Todos terminaron con cero aciertos. La premiación reconoce su participación sin inventar un campeón.</p>:null}
    </div>
    <span className="dean-final-stars" aria-hidden="true">✦ ✧ ✦</span>
   </header>
   <div className="dean-final-podium" aria-label="Podio de ganadores">
    {top.length?top.slice(0,3).map((p,i)=><article key={p.alias+'-'+i} className={'dean-final-medalist dean-final-rank-'+p.position}>
     <div className="dean-final-medal">{WIN_MEDALS[Math.min(2,Math.max(0,Number(p.position)-1))]}</div>
     <strong>{p.alias}</strong><small>Sala {ROOM_NAMES[Number(p.room_no)-1]||p.room_no}</small>
     <b>{p.points} <small>/ 120 puntos</small></b>
     <div className="dean-final-stand">PUESTO #{p.position}</div>
    </article> ):<p>{players.length?'Todos participaron; no hay un campeón por aciertos.':'Esperando el resultado.'}</p>}
   </div>
   {role==='student'&&<div className="dean-my-place" role="status">
    <b>{myPosition===1?'🏆 ¡GANASTE LA COPA!':myPosition&&myPosition<=3?'🎉 ¡LLEGASTE AL PODIO!':'🎓 ¡TERMINASTE LA BATALLA CAUSAL!'}</b>
    <span>{myPosition?'Puesto #'+myPosition+' de '+participants:'Sin posición registrada'} · {Number(myPoints||0)} / 120 puntos</span>
    <small>Gracias por jugar. Predicción no es causalidad: identifica, estima, valida y decide.</small>
   </div>}
   {role!=='student'?<div className="dean-final-all">
    <h3>🎖️ Clasificación completa · {players.length} participantes</h3>
    <div className="dean-final-roster" role="list" aria-label="Posición final de todos los jugadores">
     {players.map((p,i)=><div role="listitem" className={'dean-final-player '+(p.position===1?'winner':'')} key={p.alias+'-'+i}>
      <b>#{p.position}</b><span title={p.alias}>{p.alias}</span><small>{ROOM_NAMES[Number(p.room_no)-1]||'Sala '+p.room_no}</small>
      <strong>{p.points}/120</strong></div>)}
    </div>
   </div>:<details className="dean-final-personal-list"><summary>Ver clasificación de todos los participantes</summary>
    <div className="dean-final-roster">{players.map((p,i)=><div className="dean-final-player" key={p.alias+'-'+i}>
      <b>#{p.position}</b><span>{p.alias}</span><strong>{p.points}/120</strong></div>)}</div>
   </details>}
 </div>;
}

function VoteBars({counts={},correct,chosen,participants=0}){
 const total=LETTERS.reduce((a,ch)=>a+Number(counts?.[ch]||0),0);
 const max=Math.max(1,...LETTERS.map(ch=>Number(counts?.[ch]||0)));
 return <div className="dean-votes" aria-label="Frecuencia de votos por alternativa">
  <header><strong>📊 Votos de todos los jugadores</strong><small>{total} de {participants} participantes</small></header>
  <div className="dean-vote-chart">
   {LETTERS.map((ch,i)=>{
    const count=Number(counts?.[ch]||0);
    const width=Math.round(100*count/max);
    const type=ch===correct?'correct':ch===chosen?'wrong':'neutral';
    return <div className={'dean-vote-row is-'+type} key={ch}>
      <b>{ch.toUpperCase()}</b>
      <div className="dean-vote-track"><i style={{width:width+'%','--index':i}}/></div>
      <strong>{count}</strong>
     </div>;
   })}
  </div>
 </div>;
}

export default function DeanQuizArena({role='student',token='',teacher='',gameCode,call,onCloseTournament,closedTournament=false}){
 const [data,setData]=useState(null);
 const [error,setError]=useState('');
 const [busy,setBusy]=useState(false);
 const [selected,setSelected]=useState({question:0,choice:''});
 const [clockNow,setClockNow]=useState(Date.now());
 const [offset,setOffset]=useState(0);
 useEffect(()=>{
  let disposed=false,timeout=null;
  async function poll(){
   try{
    const sentAt=Date.now();
    const value=await call('quiz_state',{game_code:gameCode},token);
    const receivedAt=Date.now();
    if(!disposed){
     setData(value);setOffset(Date.parse(value.server_now||new Date().toISOString())-(sentAt+receivedAt)/2);
     setError('');
    }
   }catch(e){if(!disposed)setError(e.message)}
   if(!disposed)timeout=setTimeout(poll,1050);
  }
  poll();return()=>{disposed=true;clearTimeout(timeout)};
 },[call,token,gameCode]);
 useEffect(()=>{let t=setInterval(()=>setClockNow(Date.now()),130);return()=>clearInterval(t)},[]);
 const phase=data?.phase||'idle';
 const automatic=Boolean(data?.auto_mode);
 const isOpen=phase==='open';
 const reveal=phase==='reveal';
 const completed=['podium','finished'].includes(phase);
 const q=data?.question;
 const remaining=Math.max(0,Math.ceil((Date.parse(data?.deadline_at||'')-clockNow-offset)/1000))||0;
 const revealRemaining=Math.max(0,Math.ceil((Date.parse(data?.reveal_until||'')-clockNow-offset)/1000))||0;
 const mine=data?.mine||(selected.question===data?.question_no?selected.choice:'');
 const locked=Boolean(mine)||busy||remaining===0;
 const canVote=role==='student'&&isOpen&&!locked;
 const ranked=Array.isArray(data?.leaderboard)?data.leaderboard:[];
 const participantCount=Number(data?.participants??ranked.length??0);
 const commands=automatic?
  {idle:['start','▶ INICIAR LA FINAL · 30 S × 8'],
   open:['lock','⏩ Cerrar pregunta ahora'],
   reveal:['next','⏭ Pasar a la siguiente ahora'],
   podium:['finish','✓ Terminar ceremonia']}:
  {idle:['start','Iniciar batalla'],preview:['open','Abrir respuestas'],
   open:['lock','Cerrar respuestas'],locked:['reveal','Revelar resultado'],
   reveal:['next','Siguiente pregunta'],podium:['finish','Terminar batalla']};
 async function teacherAction(cmd){
  setBusy(true);setError('');
  try{setData(await call('quiz_teacher',{game_code:gameCode,command:cmd},'',teacher))}
  catch(e){setError(e.message)}finally{setBusy(false)}
 }
 async function vote(ch){
  if(!canVote)return;
  setSelected({question:data.question_no,choice:ch});setBusy(true);setError('');
  try{
   await call('quiz_submit',{question:data.question_no,choice:ch,game_code:gameCode},token);
   setData(await call('quiz_state',{game_code:gameCode},token));
  }catch(e){setSelected({question:data.question_no,choice:''});setError(e.message)}finally{setBusy(false)}
 }
 const colorFor=ch=>reveal?(ch===q?.correct?'is-correct':ch===mine?'is-incorrect':'is-dim'):ch===mine?'is-selected':'';
 const clockLabel=isOpen?remaining+' s':reveal?'RESULTADOS · '+revealRemaining+' s':phase==='preview'?'PREPARA TU RESPUESTA':phase==='locked'?'RESPUESTAS CERRADAS':'EN ESPERA';
 const questionHeader=phase==='idle'?'La batalla está lista':'Pregunta '+(data?.question_no||1)+' de 8';
 return <section className={'dean-quiz-arena'+(completed?' is-ceremony':'')+(reveal?' is-reveal':'')} aria-label="Gran final de la Copa del Decano">
  {!completed?<><header className="dean-quiz-heading">
   <span>🏆 BATALLA FINAL · 8 RETOS · 120 PUNTOS</span>
   <strong>{questionHeader}</strong>
   <div className={'dean-quiz-clock'+(isOpen&&remaining<=10?' is-urgent':'')} role="timer">
    <b>{isOpen?'⏱️':reveal?'📊':'🎮'}</b>
    <span>{clockLabel}</span>
   </div>
  </header>
  {q?<div className="dean-quiz-game">
    <p className="dean-quiz-prompt">{q.text}</p>
    <div className="dean-quiz-choice-grid" role="group" aria-label="Opciones de la pregunta">
     {LETTERS.map((ch,i)=><button type="button" key={ch}
       className={'dean-quiz-choice '+colorFor(ch)}
       aria-pressed={mine===ch}
       disabled={!canVote}
       onClick={()=>vote(ch)}>
       <b className="dean-quiz-choice-glyph">{['▲','◆','●','■'][i]}</b>
       <span><strong>{ch.toUpperCase()}</strong> {q.options?.[ch]}</span>
       {reveal&&ch===q.correct&&<em>✓ CORRECTA</em>}
       {reveal&&ch===mine&&ch!==q.correct&&<em>✕ TU RESPUESTA</em>}
      </button>)}
    </div>
    {reveal?<div className="dean-quiz-results" role="region" aria-label="Resultados y explicación de la pregunta">
      <VoteBars counts={data?.counts} correct={q.correct} chosen={role==='student'?mine:''} participants={participantCount}/>
      <div className="dean-quiz-teaching"><strong>💡 {q.correct?.toUpperCase()} · {q.options?.[q.correct]}</strong>
       <p>{q.explanation}</p></div>
     </div>:<div className="dean-quiz-await">
      {role==='student'&&mine?<span>🟡 Respuesta {mine.toUpperCase()} registrada. Todavía no se revela si acertaste.</span>:
       isOpen?<span>Elige tu respuesta antes de que termine el tiempo.</span>:
       <span>{automatic?'El facilitador abre la batalla y el servidor sincroniza los 30 segundos.':'El facilitador abrirá las respuestas.'}</span>}
     </div>}
    </div>:<div className="dean-quiz-waiting"><strong>🎮 ¡PREPÁRATE PARA LA BATALLA CAUSAL!</strong><p>8 preguntas, 30 segundos para responder cada una. Nadie conoce la opción correcta hasta que se cierre.</p></div>}
    <footer className="dean-quiz-status">
      <span>{data?.received||0} / {participantCount} respuestas</span>
      {role==='student'&&<strong>⭐ {data?.my_points||0}/120 pts</strong>}
      {automatic&&<small>{reveal?'Siguiente pregunta automática':'Reloj único del servidor'}</small>}
      {role==='teacher'&&commands[phase]&&<button type="button" disabled={busy}
        className={'dean-quiz-teacher-command'+(phase==='idle'?' is-primary':'')}
        onClick={()=>teacherAction(commands[phase][0])}>{busy?'Procesando…':commands[phase][1]}</button>}
    </footer>
   </>:<Podium players={ranked} role={role} mine={data?.mine} participants={participantCount}
        myPosition={data?.my_position} myPoints={data?.my_points}/>}
  {completed&&role==='teacher'&&phase==='podium'&&<button type="button" className="dean-final-dismiss"
    disabled={busy} onClick={()=>teacherAction('finish')}>✓ Finalizar ceremonia (conservando el podio)</button>}
  {completed&&role==='teacher'&&phase==='finished'&&!closedTournament&&onCloseTournament&&
   <button type="button" className="dean-final-dismiss" disabled={busy}
    onClick={onCloseTournament}>✓ Registrar cierre de la Copa en el servidor</button>}
  {completed&&role==='teacher'&&phase==='finished'&&closedTournament&&
   <p className="dean-final-closed" role="status">✓ Copa terminada. Los resultados y todas las posiciones quedaron guardados.</p>}
  {error&&<div className="dean-quiz-error" role="alert">⚠️ {error}</div>}
 </section>;
}
