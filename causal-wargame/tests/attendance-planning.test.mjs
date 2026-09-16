import test from'node:test'
import assert from'node:assert/strict'
import{attendancePlan,balancedTeamSizes,recommendedTeamCount,MAX_HUMANS}from'../src/attendance.js'

const cases=new Map([
  [15,[4,4,4,3]],
  [16,[4,4,4,4]],
  [17,[4,4,3,3,3]],
  [18,[4,4,4,3,3]],
  [19,[4,4,4,4,3]],
  [20,[4,4,4,4,4]],
  [21,[4,4,4,3,3,3]],
  [24,[4,4,4,4,4,4]],
  [25,[4,4,4,4,3,3,3]],
  [28,[4,4,4,4,4,4,4]]
])

test('attendance planner keeps four-role teams at three or four people from 15 to 28',()=>{
  for(const[n,expected]of cases){
    const plan=attendancePlan(n)
    assert.deepEqual(plan.sizes,expected,`${n} participants`)
    assert.equal(plan.teams,expected.length)
    assert.equal(plan.preferred,true)
    assert.ok(plan.max<=4)
    assert.ok(plan.min>=3)
  }
})

test('explicit target cases use four, five, six and seven teams as attendance grows',()=>{
  assert.equal(recommendedTeamCount(15),4)
  assert.equal(recommendedTeamCount(16),4)
  assert.equal(recommendedTeamCount(17),5)
  assert.equal(recommendedTeamCount(19),5)
  assert.equal(recommendedTeamCount(21),6)
  assert.equal(recommendedTeamCount(25),7)
  assert.equal(recommendedTeamCount(28),7)
})

test('planner never allocates a fifth person to a team and caps the supported classroom at 28',()=>{
  assert.equal(MAX_HUMANS,28)
  for(let n=1;n<=28;n++)assert.ok(Math.max(...balancedTeamSizes(n))<=4)
  assert.deepEqual(attendancePlan(999).sizes,[4,4,4,4,4,4,4])
})
