export const ROLE_ARCHETYPES={
  business:{label:'Decision Lead',family:'Estrategia',emoji:'🦁',accent:'#f6c453',tagline:'Convierte evidencia en decisiones.',tool:'Decision Canvas'},
  data:{label:'Model Lead',family:'Predicción',emoji:'🦉',accent:'#43b7ff',tagline:'Distingue score, propensity y uplift.',tool:'Model Explorer'},
  context:{label:'Causal Analyst',family:'Causalidad',emoji:'🐈‍⬛',accent:'#b56cff',tagline:'Busca la estructura detrás de la correlación.',tool:'DAG Lab'},
  integrator:{label:'Experiment Lead',family:'Experimentación',emoji:'🐢',accent:'#44dfa8',tagline:'Diseña comparaciones confiables.',tool:'Experiment Lab'},
  risk:{label:'Policy & Risk Lead',family:'Política',emoji:'🦅',accent:'#ff6f75',tagline:'Convierte efectos en políticas responsables.',tool:'Policy Simulator'}
}

const ROOTS={
  business:['Decision Canvas','Scope Pulse','PICO Compass','Outcome Lock','Horizon Map','Value Compass','Trade-off Lens','Capacity Planner','Priority Forge','Decision Memo'],
  data:['Propensity Radar','Calibration Eye','Feature Signal','Baseline Map','Uplift Scan','Segment Lens','Prediction Audit','Model Contrast','Score Decomposer','Opportunity Rank'],
  context:['DAG Vision','Confounder Scan','Backdoor Check','Temporal Guard','Mediator Lens','Collider Alert','Overlap Sense','Assumption Map','Bias Detector','Counterfactual Trace'],
  integrator:['RCT Shield','ATE Meter','Power Test','MDE Gauge','Balance Check','Randomization Forge','ITT Guard','Outcome Timer','Experiment Audit','Evidence Meter'],
  risk:['ROI Forge','Risk Shield','Policy Matrix','Capacity Guard','Harm Detector','CATE Compass','Value Net','Fairness Lens','Scale Planner','Decision Frontier']
}
const TIERS=['I','II','III']
export const CAUSAL_CODEX=(()=>{let id=1;const out=[];for(const[role,roots]of Object.entries(ROOTS)){for(const root of roots){for(let tier=0;tier<3;tier++)out.push({id:id++,role,name:`${root} ${TIERS[tier]}`,tier:tier+1,family:ROLE_ARCHETYPES[role].family})}}out.push({id:151,role:'legendary',name:'Counterfactual Mastery',tier:4,family:'Maestría'});return out})()

export function unlockedCodex(round,role,phase='round'){
  const own=CAUSAL_CODEX.filter(x=>x.role===role)
  const n=Math.min(own.length,3+Math.max(0,Number(round)-1)*3+(['reveal','teaching','microcheck','finished'].includes(phase)?1:0))
  const unlocked=own.slice(0,n)
  if(phase==='finished')unlocked.push(CAUSAL_CODEX[150])
  return unlocked
}

export function newestCapability(round,role){
  const own=CAUSAL_CODEX.filter(x=>x.role===role)
  return own[Math.min(own.length-1,Math.max(0,(Number(round)-1)*3+2))]
}
