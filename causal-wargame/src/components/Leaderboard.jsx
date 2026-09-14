import {RevealDashboard} from './RevealDashboard'
import {ExpertQueue} from './ExpertQueue'
import {ExpertAvailabilityPanel} from './ExpertAvailabilityPanel'
const labels={impact:'Impacto',evidence:'Evidencia',design:'Diseño',risk:'Riesgo',adaptation:'Adaptación'}
const order=['impact','evidence','design','risk','adaptation']
function baseTotal(t){return Object.values(t.score||{}).reduce((a,b)=>a+Number(b||0),0)}
function total(t){return baseTotal(t)-Number(t.help_cost||0)}
function cmp(a,b){if(b.total!==a.total)return b.total-a.total;for(const k of order){const d=Number(b.score?.[k]||0)-Number(a.score?.[k]||0);if(d)return d}const hc=Number(a.help_cost||0)-Number(b.help_cost||0);if(hc)return hc;return 0}
function sameResult(a,b){return a&&b&&a.total===b.total&&Number(a.help_cost||0)===Number(b.help_cost||0)&&order.every(k=>Number(a.score?.[k]||0)===Number(b.score?.[k]||0))}
export function rankedTeams(state){return [...(state?.teams||[])].map(t=>({...t,total:total(t),baseTotal:baseTotal(t)})).sort(cmp)}
export function Leaderboard({state,compact=false}){const rows=rankedTeams(state);const max=Math.max(1,...rows.map(r=>Math.max(0,r.total)));let lastRank=0;return <>{!compact&&state?.player&&state?.game?.phase==='reveal'&&<RevealDashboard state={state}/>}<div>{rows.map((r,i)=>{const rank=i>0&&sameResult(r,rows[i-1])?lastRank:i+1;lastRank=rank;return <div className="leader-row" key={r.id}><div className="rank">{rank===1?'🥇':rank===2?'🥈':rank===3?'🥉':rank}</div><div><div className="leader-name">{r.name}{i>0&&sameResult(r,rows[i-1])?' · empate':''}</div>{!compact&&<div className="score-dims">{Object.entries(r.score||{}).map(([k,v])=><span key={k}>{labels[k]||k} {v}</span>)}{Number(r.help_cost||0)>0&&<span className="leader-penalty">Inversión −{r.help_cost}</span>}</div>}</div><div className="bar"><span style={{width:`${Math.max(3,100*Math.max(0,r.total)/max)}%`}}/></div><div className="leader-score">{r.total}</div></div>})}</div>{!compact&&state?.audit&&<><ExpertAvailabilityPanel round={state?.game?.round}/><ExpertQueue audit={state.audit}/></>}</>}
