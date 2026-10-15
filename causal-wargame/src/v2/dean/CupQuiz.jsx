import React,{useEffect,useState} from 'react';
import{call,code}from'./api.js';
import'./cup-quiz.css';

export default function CupQuiz({role='student',token='',teacher='',gameCode=code}) {
 const [data,setData]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[seconds,setSeconds]=useState(0),[receipt,setReceipt]=useState('');
 useEffect(()=>{let cancel=false,t;
 async function fetchState(){try{const value=await call('quiz_state',{game_code:gameCode},token);if(!cancel){setData(value);setError('')}}catch(e){if(!cancel)setError(e.message)}
 if(!cancel)t=setTimeout(fetchState,1450+Math.random()*600)}
 fetchState();return()=>{cancel=true;clearTimeout(t)}},[role,token,gameCode]);
 useEffect(()=>{const id=setInterval(()=>setSeconds(data?.deadline_at?Math.max(0,Math.ceil((Date.parse(data.deadline_at)-Date.now())/1000)):0),250);return()=>clearInterval(id)},[data?.deadline_at]);
 const commands={idle:['start','Iniciar batalla'],preview:['open','Abrir respuestas'],open:['lock','Cerrar respuestas'],locked:['reveal','Revelar y explicar'],reveal:['next',data?.question_no===8?'Mostrar podio':'Siguiente pregunta'],podium:['finish','Terminar batalla']};
 const action=async(command)=>{setBusy(true);setError('');try{setData(await call('quiz_teacher',{command,game_code:gameCode},'',teacher))}catch(e){setError(e.message)}finally{setBusy(false)}};
 const answer=async(choice)=>{if(data?.mine||busy)return;setBusy(true);setError('');try{const r=await call('quiz_submit',{question:data.question_no,choice},token);setReceipt(r.choice);setData(await call('quiz_state',{game_code:gameCode},token))}catch(e){setError(e.message)}finally{setBusy(false)}};
 useEffect(()=>setReceipt(''),[data?.question_no]);
 const q=data?.question,phase=data?.phase||'idle',revealed=['reveal','podium','finished'].includes(phase);
 return <section className="dean-quiz" data-testid="dean-cup-quiz" aria-label="Gran final Kahoot">
  <div className="dean-kicker">🏆 GRAN FINAL · BATALLA CAUSAL · 8 PREGUNTAS · 120 PUNTOS</div>
  <h2>{phase==='idle'?'La batalla está preparada':phase==='podium'||phase==='finished'?'🏆 Podio final':'Pregunta '+data.question_no+' / 8'}</h2>
  {q&&phase!=='podium'&&phase!=='finished'&&<><p className="dean-quiz-question">{q.text}</p><p className="dean-quiz-timer" role="timer">{phase==='open'?seconds+' s':phase==='preview'?'PREPARA TU RESPUESTA':phase==='reveal'?'RESULTADOS':'TIEMPO CERRADO'}</p>
    <div className="dean-quiz-options">{['a','b','c','d'].map(ch=><button key={ch} type="button" className={(data?.mine||receipt)===ch?'chosen':''} disabled={role!=='student'||phase!=='open'||Boolean(data?.mine)||busy} onClick={()=>answer(ch)}><b>{ch.toUpperCase()}</b> {q.options[ch]}</button>)}</div>
    {role==='student'&&(data?.mine||receipt)&&<p className="dean-quiz-receipt">✓ Respuesta bloqueada: {(data.mine||receipt).toUpperCase()}</p>}
    {revealed&&<div className="dean-quiz-explanation"><h3>Correcta: {q.correct?.toUpperCase()} · {q.options[q.correct]}</h3><p>{q.explanation}</p><div className="dean-quiz-bars">{['a','b','c','d'].map(ch=><span key={ch}>{ch.toUpperCase()}: {data.counts?.[ch]||0} votos</span>)}</div></div>}
  </>}
  <div className="dean-quiz-toolbar"><strong>{data?.received||0} / {data?.participants||0} respuestas</strong>{role==='student'&&<strong>{data?.my_points||0} / 120 puntos</strong>}
  {role==='teacher'&&commands[phase]&&<button className="dean-big" data-dean-cta="primary" disabled={busy} onClick={()=>action(commands[phase][0])}>{commands[phase][1]}</button>}</div>
  {['podium','finished'].includes(phase)&&<div className="dean-quiz-podium">{(data?.leaderboard||[]).slice(0,3).map((p,i)=><article key={i}><b>{['🥇','🥈','🥉'][i]}</b><strong>{p.alias}</strong><span>Sala {p.room_no}</span><strong>{p.points} / 120</strong></article>)}</div>}
  {error&&<p role="alert" className="dean-error">{error}</p>}
 </section>
}
