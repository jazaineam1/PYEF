import test from'node:test'
import assert from'node:assert/strict'
import{assessWarRoom,effectiveEvidenceByRole,normalizeHorizon,normalizeOutcome}from'../src/causal-integration.js'

const row=(role,evidence)=>({role_code:role,evidence,player_id:`p-${role}`,name:role})
const contract=(extra={})=>({population:'Clientes elegibles',treatment:'Llamada',comparator:'No llamada',outcome:'Pago completo',horizon:'30 días',estimand:'CATE',constraint:'Capacidad máxima',constraintValue:'4000',...extra})
const policy=(extra={})=>({selected:['A'],used:2000,capacity:4000,spend:10000,budget:40000,tolerance:2,riskViolation:false,feasible:true,...extra})
const robustModel=(extra={})=>({estimator:'drlearner',robustness:{answered:true,passed:true,answer:'review'},...extra})

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
    row('data',{details:{}}),
    row('risk',{details:policy()})
  ]
  const result=assessWarRoom(rows,3)
  assert.equal(result.status,'blocked')
  assert.equal(result.checks.find(x=>x.id==='experiment-contract').status,'block')
})

test('cinco especialidades coherentes producen un war room completo',()=>{
  const rows=[
    row('business',{details:contract()}),
    row('data',{details:robustModel()}),
    row('context',{summary:'Camino bloqueado',details:{diagnosed:true}}),
    row('integrator',{details:{assignment:'random',outcome:'Pago completo',horizon:'30 días',mde:1.7,targetEffect:2}}),
    row('risk',{details:policy()})
  ]
  const result=assessWarRoom(rows,4)
  assert.equal(result.status,'coherent')
  assert.equal(result.blockCount,0)
  assert.deepEqual(result.missingRoles,[])
  assert.equal(result.checks.find(x=>x.id==='robustness').status,'ready')
  assert.equal(result.checks.find(x=>x.id==='precision').status,'ready')
})

test('equipo de tres cubre Experimentos mediante doble sombrero pero no inventa Política y Riesgo',()=>{
  const rows=[
    row('business',{details:contract()}),
    row('context',{summary:'Camino bloqueado',details:{diagnosed:true}}),
    row('data',{details:{coverage:{integrator:{summary:'RCT diseñado',assumption:'Azar',decision:'Medir pago',details:{assignment:'random',outcome:'Pago completo',horizon:'30 días'}}}}})
  ]
  const by=effectiveEvidenceByRole(rows)
  assert.equal(by.integrator.covered_by,'data')
  const result=assessWarRoom(rows,3)
  assert.equal(result.status,'incomplete')
  assert.deepEqual(result.missingRoles,['risk'])
  assert.match(result.checks.find(x=>x.id==='experiment-contract').message,/doble sombrero/i)
})

test('bloquea política de Riesgo que viola la capacidad acordada por Decisión',()=>{
  const rows=[
    row('business',{details:contract()}),
    row('data',{details:robustModel({estimator:'forest'})}),
    row('context',{summary:'Camino bloqueado',details:{diagnosed:true}}),
    row('integrator',{details:{assignment:'random',outcome:'Pago completo',horizon:'30 días',mde:1.7,targetEffect:2}}),
    row('risk',{details:policy({used:5000,capacity:6000})})
  ]
  const result=assessWarRoom(rows,4)
  assert.equal(result.status,'blocked')
  assert.equal(result.checks.find(x=>x.id==='policy-contract').status,'block')
})

test('R4 bloquea convertir CATE en política sin superar el stress test',()=>{
  const rows=[
    row('business',{details:contract()}),
    row('data',{details:{estimator:'forest',robustness:{answered:false,passed:false}}}),
    row('context',{summary:'Camino bloqueado',details:{diagnosed:true}}),
    row('integrator',{details:{assignment:'random',outcome:'Pago completo',horizon:'30 días',mde:1.7,targetEffect:2}}),
    row('risk',{details:policy()})
  ]
  const result=assessWarRoom(rows,4)
  assert.equal(result.status,'blocked')
  assert.equal(result.checks.find(x=>x.id==='robustness').status,'block')
})

test('R2 marca soporte débil hasta que Modelos interpreta correctamente el overlap',()=>{
  const base={overlap:{high:{treated:97,control:3}},robustness:{answered:false,passed:false}}
  const rows=[
    row('business',{details:contract()}),
    row('data',{details:base}),
    row('context',{summary:'Camino bloqueado',details:{diagnosed:true}}),
    row('integrator',{details:{}}),
    row('risk',{details:{}})
  ]
  const first=assessWarRoom(rows,2)
  assert.equal(first.checks.find(x=>x.id==='support').status,'warn')
  rows[1]=row('data',{details:{...base,robustness:{answered:true,passed:true,answer:'restrict'}}})
  const second=assessWarRoom(rows,2)
  assert.equal(second.checks.find(x=>x.id==='support').status,'ready')
})

test('un RCT puede ser causalmente defendible pero demasiado impreciso para el efecto útil',()=>{
  const rows=[
    row('business',{details:contract()}),
    row('data',{details:{}}),
    row('context',{summary:'Camino bloqueado',details:{diagnosed:true}}),
    row('integrator',{details:{assignment:'random',outcome:'Pago completo',horizon:'30 días',mde:5.4,targetEffect:2}}),
    row('risk',{details:{}})
  ]
  const result=assessWarRoom(rows,3)
  assert.equal(result.checks.find(x=>x.id==='precision').status,'warn')
  assert.match(result.checks.find(x=>x.id==='precision').message,/MDE/i)
})
