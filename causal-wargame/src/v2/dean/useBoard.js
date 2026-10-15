import{useEffect,useState}from'react';
import{call,code}from'./api.js';
export function useBoard(token='',enabled=true,gameCode=code){
 const [value,setValue]=useState(null),[error,setError]=useState('');
 useEffect(()=>{
  if(!enabled)return;
  let dead=false,t;
  async function poll(){try{const s=await call('state',{game_code:gameCode},token);if(!dead){setValue({...s,_receivedAt:Date.now()});setError('')}}catch(e){if(!dead)setError(e.message)}
  if(!dead)t=setTimeout(poll,2700+Math.random()*1300)}
  poll();return()=>{dead=true;clearTimeout(t)}
 },[token,enabled,gameCode]);
 return{value,error,setValue};
}
