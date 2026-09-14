const ROLE_ORDER=['business','data','context','integrator','risk']

const clean=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase()

export function normalizeOutcome(value){
  const s=clean(value)
  if(!s)return''
  if(s.includes('clic'))return'clic'
  if(s.includes('pago'))return'pago'
  if(s.includes('mora'))return'mora'
  return s
}

export function normalizeHorizon(value){
  const s=clean(value)
  const n=Number((s.match(/\d+/)||[])[0])
  return Number.isFinite(n)&&n>0?`${n}d`:s
}

export function evidenceByRole(rows=[]){
  return Object.fromEntries(ROLE_ORDER.map(role=>[role,rows.find(row=>row?.role_code===role)||null]))
}

function check(id,label,status,message,roles=[]){return{id,label,status,message,roles}}

export function assessWarRoom(rows=[],round=1){
  const by=evidenceByRole(rows)
  const checks=[]
  const present=ROLE_ORDER.filter(role=>by[role])
  const missing=ROLE_ORDER.filter(role=>!by[role])
  checks.push(check('coverage','Cobertura de especialidades',missing.length?'pending':'ready',missing.length?`Faltan ${missing.length} especialidades por compartir evidencia.`:'Las cinco especialidades ya aportaron evidencia.',missing))

  const decision=by.business?.evidence?.details||{}
  const contractFields=['population','treatment','comparator','outcome','horizon','estimand']
  const contractMissing=contractFields.filter(k=>!decision[k])
  if(by.business){
    checks.push(check('contract','Contrato causal',contractMissing.length?'block':'ready',contractMissing.length?`La pregunta causal aún no cierra: falta ${contractMissing.join(', ')}.`:`Pregunta definida para ${decision.outcome} a ${decision.horizon}.`,['business']))
    if(round>=4)checks.push(check('constraint','Restricción de decisión',decision.constraint?'ready':'warn',decision.constraint?`Restricción declarada: ${decision.constraint}.`:'La política final aún no declara capacidad, presupuesto o riesgo como restricción explícita.',['business','risk']))
  }

  if(round>=2&&by.context){
    const details=by.context.evidence?.details||{}
    const diagnosed=details.diagnosed??!clean(by.context.evidence?.summary).includes('aun no diagnosticado')
    checks.push(check('identification','Identificación causal',diagnosed?'ready':'block',diagnosed?'El DAG produjo un diagnóstico explícito de identificación.':'El DAG todavía no ha sido diagnosticado; no interpretes un estimador como causal.',['context','data']))
  }

  if(round>=3&&by.integrator&&by.business){
    const experiment=by.integrator.evidence?.details||{}
    const sameOutcome=!experiment.outcome||!decision.outcome||normalizeOutcome(experiment.outcome)===normalizeOutcome(decision.outcome)
    const sameHorizon=!experiment.horizon||!decision.horizon||normalizeHorizon(experiment.horizon)===normalizeHorizon(decision.horizon)
    const complete=Boolean(experiment.outcome&&experiment.horizon)
    checks.push(check('experiment-contract','Experimento ↔ contrato',!complete?'warn':sameOutcome&&sameHorizon?'ready':'block',!complete?'El diseño experimental aún no fija outcome y horizonte.':sameOutcome&&sameHorizon?'El experimento mide el mismo outcome y horizonte definidos por Decisión.':`Inconsistencia: Decisión pide ${decision.outcome} a ${decision.horizon}, pero Experimentos mide ${experiment.outcome} a ${experiment.horizon}.`,['business','integrator']))
    if(experiment.assignment&&experiment.assignment!=='random')checks.push(check('assignment','Regla de asignación','warn','La asignación no es aleatoria; la comparabilidad necesita una defensa adicional.',['integrator','context']))
  }

  if(round>=4&&by.data){
    const model=by.data.evidence?.details||{}
    checks.push(check('effect','Estimación heterogénea',model.estimator?'ready':'warn',model.estimator?`Modelos compartió evidencia con ${model.estimator}.`:'Modelos todavía no fijó qué estimador respalda la priorización.',['data']))
  }

  if(round>=4&&by.risk){
    const policy=by.risk.evidence?.details||{}
    const selected=Array.isArray(policy.selected)?policy.selected:[]
    const feasible=policy.feasible??((policy.used??0)<=(policy.capacity??Infinity)&&(policy.spend??0)<=(policy.budget??Infinity)&&!policy.riskViolation)
    checks.push(check('policy','Política factible',!selected.length?'warn':feasible?'ready':'block',!selected.length?'Riesgo aún no ha propuesto una política segmentada.':feasible?'La política propuesta respeta las restricciones declaradas.':'La política propuesta viola capacidad, presupuesto o tolerancia de riesgo.',['risk']))
  }

  const blocks=checks.filter(x=>x.status==='block')
  const warns=checks.filter(x=>x.status==='warn')
  const ready=checks.filter(x=>x.status==='ready')
  const status=blocks.length?'blocked':missing.length||warns.length?'incomplete':'coherent'
  return{status,checks,readyCount:ready.length,totalChecks:checks.length,missingRoles:missing,blockCount:blocks.length,warnCount:warns.length}
}
