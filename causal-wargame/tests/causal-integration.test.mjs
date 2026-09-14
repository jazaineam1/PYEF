import test from'node:test'
import assert from'node:assert/strict'
import{assessWarRoom,normalizeHorizon,normalizeOutcome}from'../src/causal-integration.js'

const row=(role,evidence)=>({role_code:role,evidence})

test('normaliza outcomes y horizontes equivalentes',()=>{
  assert.equal(normalizeOutcome('Pago completo'),'pago')
  assert.equal(normalizeOutcome('pago'),'pago')
  assert.equal(normalizeHorizon('30 días'),'30d')
  assert.equal(normalizeHorizon('30d'),'30d')
})

test('bloquea inconsistencias entre contrato y experimento',()=>{
  const rows=[
    row('business',{details:{population:'Clientes elegibles',treatment:'Llamada',comparator:'No llamada',outcome:'Pago completo',horizon:'30 días',estimand:'ATE',constraint:'Capacidad máxima',constraintValue:'4000'}}),
    row('context',{summary:'Camino bloqueado',details:{diagnosed:true}}),
    row('integrator',{details:{assignment:'random',outcome:'clic',horizon:'1 día'}})
  ]
  const result=assessWarRoom(rows,3)
  assert.equal(result.status,'blocked')
  assert.equal(result.checks.find(x=>x.id==='experiment-contract').status,'block')
})

test('bloquea una política que viola la capacidad acordada por Decisión',()=>{
  const rows=[
    row('business',{details:{population:'Clientes elegibles',treatment:'Llamada',comparator:'No llamada',outcome:'Pago completo',horizon:'30 días',estimand:'CATE',constraint:'Capacidad máxima',constraintValue:'4000'}}),
    row('data',{details:{estimator:'drlearner'}}),
    row('context',{summary:'Camino bloqueado',details:{diagnosed:true}}),
    row('integrator',{details:{assignment:'random',outcome:'Pago completo',horizon:'30 días'}}),
    row('risk',{details:{selected:['A'],used:5000,capacity:6000,spend:10000,budget:40000,tolerance:2,riskViolation:false,feasible:true}})
  ]
  const result=assessWarRoom(rows,4)
  assert.equal(result.status,'blocked')
  assert.equal(result.checks.find(x=>x.id==='policy-contract').status,'block')
})

test('marca coherencia cuando las cinco piezas son compatibles',()=>{
  const rows=[
    row('business',{details:{population:'Clientes elegibles',treatment:'Llamada',comparator:'No llamada',outcome:'Pago completo',horizon:'30 días',estimand:'CATE',constraint:'Capacidad máxima',constraintValue:'4000'}}),
    row('data',{details:{estimator:'drlearner'}}),
    row('context',{summary:'Camino bloqueado',details:{diagnosed:true}}),
    row('integrator',{details:{assignment:'random',outcome:'Pago completo',horizon:'30 días'}}),
    row('risk',{details:{selected:['A'],used:2000,capacity:4000,spend:10000,budget:40000,tolerance:2,riskViolation:false,feasible:true}})
  ]
  const result=assessWarRoom(rows,4)
  assert.equal(result.status,'coherent')
  assert.equal(result.blockCount,0)
  assert.equal(result.missingRoles.length,0)
  assert.equal(result.checks.find(x=>x.id==='policy-contract').status,'ready')
})
