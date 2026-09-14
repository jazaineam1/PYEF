export function ObservedLeaderboard({teams=[]}) {
  const rows=[...teams].filter(t=>Number.isFinite(Number(t.observed_conversion))).sort((a,b)=>Number(b.observed_conversion)-Number(a.observed_conversion))
  if(!rows.length) return <div className="notice">Aún no hay suficientes decisiones cerradas para calcular el ranking observado.</div>
  const max=Math.max(...rows.map(r=>Number(r.observed_conversion)),1)
  return <div>{rows.map((r,i)=><div className="leader-row" key={r.id}>
    <div className="rank">{i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1}</div>
    <div className="leader-name">{r.name}</div>
    <div className="bar"><span style={{width:`${Math.max(4,100*Number(r.observed_conversion)/max)}%`}}/></div>
    <div className="leader-score">{Number(r.observed_conversion).toFixed(1)}%</div>
  </div>)}</div>
}
