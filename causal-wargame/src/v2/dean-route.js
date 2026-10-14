// CUP V2 safe-entry router. The prior V2 stays available via ?legacy=1.
// A live Dean Cup is an explicit facilitator action, never an automatic reset.
export const legacyOverride=()=>new URLSearchParams(location.search).get('legacy')==='1'
const targets={student:'dean-play.html',teacher:'dean-teacher.html',wall:'dean-wall.html'}
export function requestedCode(role){
 const q=new URLSearchParams(location.search).get('game')
 if(q)return q.trim().toUpperCase()
 const k=role==='teacher'?'df_facilitator_game_code':'df_game_code'
 try{return (sessionStorage.getItem(k)||localStorage.getItem(k)||'').trim().toUpperCase()}catch{return ''}
}
export async function shouldRouteToCup(role){
 if(legacyOverride()||!targets[role])return false
 const game=requestedCode(role)
 if(!game)return false
 const base=String(import.meta.env.VITE_FUNCTIONS_BASE_URL||'').replace(/\/$/,'')
 if(!base.startsWith('https://'))return false
 const controller=new AbortController()
 const timeout=setTimeout(()=>controller.abort(),3500)
 try{
   const response=await fetch(base+'/v2-dean-cup',{
     method:'POST',headers:{'content-type':'application/json'},
     body:JSON.stringify({action:'state',game_code:game}),cache:'no-store',signal:controller.signal
   })
   if(!response.ok)return false
   const state=await response.json()
   return state?.available===true
 }catch{return false}
 finally{clearTimeout(timeout)}
}
export function deanHref(role){
 const url=new URL(targets[role],location.href)
 const game=requestedCode(role)
 if(game)url.searchParams.set('game',game)
 return url.href
}
export async function mountV2(role){
 if(await shouldRouteToCup(role)){
  location.replace(deanHref(role))
  return
 }
 // Fail-safe: retain the old functioning experience if no tournament exists,
 // the backend is unavailable, or a lecturer deliberately requests ?legacy=1.
 const React=(await import('react')).default
 const {createRoot}=await import('react-dom/client')
 await Promise.all([import('./styles.css'),import('./academic.css')])
 const module=await (role==='student'?import('./V2Play.jsx'):role==='teacher'?import('./V2Facilitator.jsx'):import('./V2Wall.jsx'))
 createRoot(document.getElementById('root')).render(React.createElement(module.default))
}
