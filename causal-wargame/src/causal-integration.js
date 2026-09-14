const CORE_ROLE_ORDER=['business','data','context','integrator']

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

export function effectiveEvidenceByRole(rows=[]){
  const by=Object.fromEntries(CORE_ROLE_ORDER.map(role=>[role,rows.find(row=>row?.role_code===role)||null]))
  const coveredExperiment=by.data?.evidence?.details?.coverage?.integrator
  if(!by.integrator&&coveredExperiment){
    by.integrator={
      role_code:'integrator',
      player_id:by.data.player_id,
      name:by.data.name,
      finding_code:'covered_by_models',
      evidence:coveredExperiment,
      covered_by:'data'
    }
  }
  return by
}

export const evidenceByRole=effectiveEvidenceByRole

function check(id,label,status,message,roles=[]){return{id,label,status,message,roles}}
const riskTolerance=value=>{const s=clean(value);return s.includes('baja')?1:s.includes('alta')?3:2}
const policyDetails=decision=>decision?.policy?.details||decision?.policy||{}

export function assessWarRoom(rows=[],round=1){
  const by=effectiveEvidenceByRole(rows)
  const checks=[]
  const missing=CORE_ROLE_ORDER.filter(role=>!by[role])
  checks.push(check('coverage','Cobertura de responsabilidades',missing.length?'pending':'ready',missing.length?`Faltan ${missing.length} de las 4 responsabilidades núcleo por compartir evidencia.`:'Las cuatro responsabilidades núcleo están cubiertas.',missing))

  const decision=by.business?.evidence?.details||{}
  const contractFields=['population','treatment','comparator','outcome','horizon','estimand']
  const contractMissing=contractFields.filter(k=>!decision[k])
  const constraintNeedsValue=decision.constraint&&decision.constraint!=='Sin restricción explícita'
  if(by.business){
    checks.push(check('contract','Contrato causal',contractMissing.length?'block':'ready',contractMissing.length?`La pregunta causal aún no cierra: falta ${contractMissing.join(', ')}.`:`Pregunta definida para ${decision.outcome} a ${decision.horizon}.`,['business']))
    if(round>=4){
      const constraintReady=Boolean(decision.constraint)&&(!constraintNeedsValue||decision.constraintValue!=='')
      const suffix=constraintNeedsValue&&decision.constraintValue!==''?` = ${decision.constraintValue}`:''
      checks.push(check('constraint','Restricción de decisión',constraintReady?'ready':'warn',constraintReady?`Restricción declarada: ${decision.constraint}${suffix}.`:'La política final debe declarar la restricción y su valor operativo.',['business']))
    }
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
    const owner=by.integrator.covered_by==='data'?'Modelos cubrió el doble sombrero de Experimentos. ':' '
    checks.push(check('experiment-contract','Experimento ↔ contrato',!complete?'warn':sameOutcome&&sameHorizon?'ready':'block',!complete?`${owner}El diseño experimental aún no fija outcome y horizonte.`:sameOutcome&&sameHorizon?`${owner}El experimento mide el mismo outcome y horizonte definidos por Estrategia.`:`Inconsistencia: Estrategia pide ${decision.outcome} a ${decision.horizon}, pero Experimentos mide ${experiment.outcome} a ${experiment.horizon}.`,['business','integrator']))
    if(experiment.assignment&&experiment.assignment!=='random')checks.push(check('assignment','Regla de asignación','warn','La asignación no es aleatoria; la comparabilidad necesita una defensa adicional.',['integrator','context']))
  }

  if(round>=4&&by.data){
    const model=by.data.evidence?.details||{}
    checks.push(check('effect','Estimación heterogénea',model.estimator?'ready':'warn',model.estimator?`Modelos compartió evidencia con ${model.estimator}.`:'Modelos todavía no fijó qué estimador respalda la priorización.',['data']))
  }

  if(round>=4&&by.business){
    const policy=policyDetails(decision)
    const selected=Array.isArray(policy.selected)?policy.selected:[]
    const feasible=policy.feasible??((policy.used??0)<=(policy.capacity??Infinity)&&(policy.spend??0)<=(policy.budget??Infinity)&&!policy.riskViolation)
    checks.push(check('policy','Política factible',!selected.length?'warn':feasible?'ready':'block',!selected.length?'Estrategia todavía no ha propuesto una política segmentada.':feasible?'La política propuesta respeta sus controles locales.':'La política propuesta viola capacidad, presupuesto o tolerancia de riesgo.',['business']))

    if(decision.constraint&&decision.constraint!=='Sin restricción explícita'&&decision.constraintValue!==''){
      const limit=Number(decision.constraintValue)
      const c=clean(decision.constraint)
      let ok=true,message='La política respeta la restricción fijada por Estrategia.'
      if(c.includes('capacidad')){ok=Number(policy.used||0)<=limit;message=ok?`Uso ${Number(policy.used||0).toLocaleString()} ≤ capacidad acordada ${limit.toLocaleString()}.`:`La política propone ${Number(policy.used||0).toLocaleString()} personas, por encima de la capacidad acordada ${limit.toLocaleString()}.`}
      else if(c.includes('presupuesto')){ok=Number(policy.spend||0)<=limit;message=ok?`Gasto ${Math.round(Number(policy.spend||0)).toLocaleString()} ≤ presupuesto acordado ${Math.round(limit).toLocaleString()}.`:`La política propone gastar ${Math.round(Number(policy.spend||0)).toLocaleString()}, por encima del presupuesto acordado ${Math.round(limit).toLocaleString()}.`}
      else if(c.includes('riesgo')){const allowed=riskTolerance(decision.constraintValue);ok=Number(policy.tolerance||2)<=allowed;message=ok?`La tolerancia aplicada no excede el nivel acordado (${decision.constraintValue}).`:`La política opera con una tolerancia mayor que la acordada (${decision.constraintValue}).`}
      checks.push(check('policy-contract','Política ↔ restricción',ok?'ready':'block',message,['business']))
    }
  }

  const blocks=checks.filter(x=>x.status==='block')
  const warns=checks.filter(x=>x.status==='warn')
  const ready=checks.filter(x=>x.status==='ready')
  const status=blocks.length?'blocked':missing.length||warns.length?'incomplete':'coherent'
  return{status,checks,readyCount:ready.length,totalChecks:checks.length,missingRoles:missing,blockCount:blocks.length,warnCount:warns.length}
}
