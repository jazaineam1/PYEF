import test from'node:test'
import assert from'node:assert/strict'
import{assessWarRoom,effectiveEvidenceByRole,normalizeHorizon,normalizeOutcome}from'../src/causal-integration.js'

const row=(role,evidence)=>({role_code:role,evidence,player_id:`p-${role}`,name:role})
const contract=(extra={})=>({population:'Clientes elegibles',treatment:'Llamada',comparator:'No llamada',outcome:'Pago completo',horizon:'30 días',estimand:'CATE',constraint:'Capacidad máxima',constraintValue:'4000',...extra})

test('normaliza outcomes y horizontes equivalentes',()=>{
  assert.equal(normalizeOutcome('Pago completo'),'pago')
  assert.equal(normalizeOutcome('pago'),'pago')
  assert.equal(normalizeHorizon('30 días'),'30d')
  assert.equal(normalizeHorizon('30d'),'30d')
})

test('bloquea inconsistencias entre contrato y experimento',()=>{
  const rows=[
    row('business',{details:contract()}),
    row('context',{summary:'Camino bloqueado',details:{diagnosed:true}}),
    row('integrator',{details:{assignment:'random',outcome:'clic',horizon:'1 día'}}),
    row('data',{details:{}})
  ]
  const result=assessWarRoom(rows,3)
  assert.equal(result.status,'blocked')
  assert.equal(result.checks.find(x=>x.id==='experiment-contract').status,'block')
})

test('cuatro responsabilidades bastan: copiloto no es obligatorio',()=>{
  const rows=[
    row('business',{details:contract({policy:{details:{selected:['A'],used:2000,capacity:4000,spend:10000,budget:40000,tolerance:2,riskViolation:false,feasible:true}}})}),
    row('data',{details:{estimator:'drlearner'}}),
    row('context',{summary:'Camino bloqueado',details:{diagnosed:true}}),
    row('integrator',{details:{assignment:'random',outcome:'Pago completo',horizon:'30 días'}})
  ]
  const result=assessWarRoom(rows,4)
  assert.equal(result.status,'coherent')
  assert.equal(result.blockCount,0)
  assert.deepEqual(result.missingRoles,[])
})

test('equipo de tres cubre Experimentos mediante doble sombrero de Modelos',()=>{
  const rows=[
    row('business',{details:contract()}),
    row('context',{summary:'Camino bloqueado',details:{diagnosed:true}}),
    row('data',{details:{coverage:{integrator:{summary:'RCT diseñado',assumption:'Azar',decision:'Medir pago',details:{assignment:'random',outcome:'Pago completo',horizon:'30 días'}}}}})
  ]
  const by=effectiveEvidenceByRole(rows)
  assert.equal(by.integrator.covered_by,'data')
  const result=assessWarRoom(rows,3)
  assert.equal(result.status,'coherent')
  assert.deepEqual(result.missingRoles,[])
  assert.match(result.checks.find(x=>x.id==='experiment-contract').message,/doble sombrero/i)
})

test('bloquea política que viola la capacidad acordada por Estrategia',()=>{
  const rows=[
    row('business',{details:contract({policy:{details:{selected:['A'],used:5000,capacity:6000,spend:10000,budget:40000,tolerance:2,riskViolation:false,feasible:true}}})}),
    row('data',{details:{estimator:'forest'}}),
    row('context',{summary:'Camino bloqueado',details:{diagnosed:true}}),
    row('integrator',{details:{assignment:'random',outcome:'Pago completo',horizon:'30 días'}})
  ]
  const result=assessWarRoom(rows,4)
  assert.equal(result.status,'blocked')
  assert.equal(result.checks.find(x=>x.id==='policy-contract').status,'block')
})
