const labels={impact:'Impacto',evidence:'Evidencia',design:'Diseño',risk:'Riesgo',adaptation:'Adaptación'}
function total(t){return Object.values(t.score||{}).reduce((a,b)=>a+Number(b||0),0)}
export function rankedTeams(state){return [...(state?.teams||[])].map(t=>({...t,total:total(t)})).sort((a,b)=>b.total-a.total)}
export function Leaderboard({state,compact=false}){
  const rows=rankedTeams(state);const max=Math.max(1,...rows.map(r=>r.total));
  return <div>{rows.map((r,i)=><div className="leader-row" key={r.id}>
    <div className="rank">{i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1}</div>
    <div><div className="leader-name">{r.name}</div>{!compact&&<div className="score-dims">{Object.entries(r.score||{}).map(([k,v])=><span key={k}>{labels[k]||k} {v}</span>)}</div>}</div>
    <div className="bar"><span style={{width:`${Math.max(3,100*r.total/max)}%`}}/></div>
    <div className="leader-score">{r.total}</div>
  </div>)}</div>
}
