import React,{useMemo,useState}from'react'
import{ROLE_ARCHETYPES}from'../codex'
import{RoleLab}from'./RoleLab'

const ROLES=['business','data','context','integrator','risk']
const SEGMENTS=[
  {id:'s1',name:'Alta oportunidad',audience:5200,effect:9.4,ci_low:5.1,ci_high:13.7,value_per_result:85,unit_cost:2,risk:'Bajo'},
  {id:'s2',name:'Reactivables',audience:4100,effect:6.2,ci_low:2.0,ci_high:10.4,value_per_result:78,unit_cost:2,risk:'Medio'},
  {id:'s3',name:'Inciertos',audience:3600,effect:1.3,ci_low:-2.5,ci_high:5.1,value_per_result:74,unit_cost:2,risk:'Medio'},
  {id:'s4',name:'Posible daño',audience:2900,effect:-4.1,ci_low:-7.8,ci_high:-0.4,value_per_result:82,unit_cost:2,risk:'Alto'},
  {id:'s5',name:'Nicho de alto impacto',audience:1400,effect:12.8,ci_low:4.3,ci_high:21.3,value_per_result:92,unit_cost:3,risk:'Bajo'}
]

export function RoleInspector(){
  const[role,setRole]=useState('business')
  const[round,setRound]=useState(1)
  const state=useMemo(()=>({
    player:{id:'facilitator-preview',team_id:'preview',role_code:role,display_name:'Vista docente'},
    game:{round,status:'round',phase:'round'},
    teams:[],
    segments:SEGMENTS,
    policy:{capacity:9000},
    role_card:null,
    locked:false
  }),[role,round])
  return <div className="role-inspector">
    <div className="notice notice-green"><b>Sandbox docente.</b> Cambia de rol y de ronda libremente. Esta vista usa las mismas herramientas del participante, pero desactiva compartir evidencia, mercado y cualquier escritura al backend.</div>
    <div className="card" style={{marginTop:12}}>
      <div className="eyebrow">ELIGE QUÉ QUIERES PROBAR</div>
      <div className="fac-toolbar" style={{marginTop:10}}>{ROLES.map(code=>{const m=ROLE_ARCHETYPES[code];return <button type="button" key={code} className={`btn ${role===code?'btn-primary':''}`} onClick={()=>setRole(code)}>{m.emoji} {m.label}</button>})}</div>
      <div className="fac-toolbar" style={{marginTop:12}}>{[1,2,3,4].map(r=><button type="button" key={r} className={`btn ${round===r?'btn-primary':''}`} onClick={()=>setRound(r)}>Ronda {r}</button>)}</div>
      <p style={{marginTop:12,marginBottom:0}}>Estás inspeccionando <b>{ROLE_ARCHETYPES[role].emoji} {ROLE_ARCHETYPES[role].label}</b> en <b>Ronda {round}</b>. Los cinco roles son especialidades núcleo y producen piezas de evidencia diferentes.</p>
    </div>
    <div style={{marginTop:14}}><RoleLab key={`${role}-${round}`} state={state} preview/></div>
  </div>
}
