import React,{useEffect,useState} from 'react'
import{functionsBaseUrl,getFacilitatorGameCode,getPlayerGameCode}from'../lib/api'

/**
 * Read-only V2 release switch: any existing tournament becomes the default
 * workshop without touching V1 or the legacy game state. Leave the legacy
 * route accessible using ?mode=legacy as an emergency fallback.
 */
export default function DeanModeGate({role,children}){
 const [checking,setChecking]=useState(true)
 useEffect(()=>{
  const params=new URLSearchParams(window.location.search)
  if(params.get('mode')==='legacy'||!functionsBaseUrl){
   setChecking(false);return
  }
  const game=(params.get('game')||(role==='teacher'?getFacilitatorGameCode():getPlayerGameCode())||'FUTUROS').trim().toUpperCase()
  let stopped=false,poll,controller
  const target=role==='teacher'?'dean-teacher.html':role==='wall'?'dean-wall.html':'dean-play.html'
  const endpoint=functionsBaseUrl.replace(/\/$/,'')+'/v2-dean-cup'
  async function check(){
   controller?.abort()
   controller=new AbortController()
   const abort=setTimeout(()=>controller?.abort(),7000)
   try{
    const response=await fetch(endpoint,{method:'POST',headers:{'content-type':'application/json'},
     body:JSON.stringify({action:'state',game_code:game}),signal:controller.signal,cache:'no-store'})
    if(response.ok){
     const state=await response.json()
     if(!stopped&&state?.available===true){
      const url='./'+target+'?game='+encodeURIComponent(game)
      window.location.replace(url)
      return
     }
    }
   }catch{/* Keep the old V2 available during temporary backend outages */}
   finally{clearTimeout(abort)}
   if(!stopped){setChecking(false);poll=setTimeout(check,7000)}
  }
  check()
  return()=>{stopped=true;clearTimeout(poll);controller?.abort()}
 },[role])
 if(checking)return <main role="status" style={{minHeight:'100vh',background:'#10253d',color:'#e9faf5',
  fontFamily:'system-ui',display:'grid',placeContent:'center',textAlign:'center',padding:24}}>
   <div style={{fontSize:48}}>🏆</div><h1>Preparando DOS FUTUROS CAMPUS V2</h1>
   <p>Comprobando si ya comenzó la Copa del Decano…</p>
  </main>
 return children
}
