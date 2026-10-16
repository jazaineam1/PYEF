import React from 'react';
import './dean-arcade.css';

export const LOBBY_ANIMALS=['🦊','🐯','🐼','🦁','🐸','🐵','🐨','🐰','🦉','🐧','🦄','🐙'];
export const lobbyAvatar=n=>LOBBY_ANIMALS[Math.abs(Number(n)||0)%LOBBY_ANIMALS.length];
const rooms=['ALPHA','BETA','GAMMA','DELTA','ÉPSILON'];
export const lobbyCounts=players=>({
 total:(players||[]).length,ready:(players||[]).filter(p=>p.ready===true).length
});

export default function DeanArcadeLobby({players=[],phase='lobby',room=null,compact=false,
 ownReady=false,readyBusy=false,onReady=null,examCount=6,roomCount=5}){
 const isWaiting=phase==='lobby';
 const list=room==null?players:players.filter(p=>Number(p.room_no)===Number(room));
 const {total,ready}=lobbyCounts(players);
 return <section className={'dean-arcade-lobby '+(compact?'is-compact':'')} aria-label="Jugadores y salas">
  <div className="dean-lobby-heading">
   <span>🎮 SALA DE ESPERA</span>
   <strong>{isWaiting?ready+' / '+total+' LISTOS':total+' JUGADORES EN COPA'}</strong>
  </div>
  {room!=null&&isWaiting&&onReady&&<button type="button"
   className={'dean-lobby-ready-button '+(ownReady?'is-ready':'')} disabled={readyBusy}
   onClick={()=>onReady(!ownReady)}>
   {readyBusy?'⏳ ACTUALIZANDO…':ownReady?'✅ ¡ESTOY LISTO! · CAMBIAR':'🙌 ESTOY LISTO PARA JUGAR'}
  </button>}
  {isWaiting&&room!=null&&<p className="dean-lobby-hint">Marca listo y espera a que el docente abra los {examCount} exámenes.</p>}
  {list.length===0&&<p className="dean-lobby-hint">Aún no se ha unido nadie a esta sala.</p>}
  <div className="dean-lobby-room-grid">
   {(room!=null?[Number(room)]:Array.from({length:roomCount},(_,i)=>i+1)).map(roomNo=>{
    const members=list.filter(p=>Number(p.room_no)===roomNo);
    return <div className="dean-lobby-room" key={roomNo}>
     <div className="dean-lobby-room-title"><b>SALA {roomNo} · {rooms[roomNo-1]}</b><small>{members.length}/6</small></div>
     {members.length?<div className="dean-lobby-members">{members.map((p,i)=>
      <div className="dean-lobby-member" key={roomNo+'-'+i+'-'+p.alias}>
       <span className="dean-lobby-avatar" aria-hidden="true">{lobbyAvatar(p.avatar_no)}</span>
       <strong title={p.alias}>{p.alias}</strong>
       <span className={'dean-lobby-ready-pill '+(p.ready?'is-ready':'')}>{isWaiting?(p.ready?'✅ LISTO':'⏳ ESPERA'):'🎮 EN JUEGO'}</span>
      </div>)}</div>:<small className="dean-lobby-empty">Esperando jugadores…</small>}
    </div>
   })}
  </div>
  {room==null&&isWaiting&&<div className="dean-lobby-footer" role="status">
   <span>{total}/{roomCount*6} inscritos</span><b>{ready} preparados</b><span>{total-ready} pendientes</span>
  </div>}
 </section>;
}
