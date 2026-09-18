import test from'node:test'
import assert from'node:assert/strict'
import{spawnSync}from'node:child_process'
import{buildPythonLab}from'../src/v2/python-lab.js'

const fixtures={
  prediction:{
    round:1,
    labKey:'prediction',
    state:{team_pool:[{id:'G01',name:'Grupo 1',segment:'Digital',score:.8,usage:70,bugs:2,discount:10,tenure:20,cohort_size:1000}]},
    analysis:{team_tools:{ml_training:[
      {usage:20,bugs:1,discount:5,tenure:10,renewed:0},
      {usage:80,bugs:2,discount:15,tenure:30,renewed:1}
    ]}}
  },
  comparison:{
    round:2,
    labKey:'comparison',
    state:{team_pool:[]},
    analysis:{team_tools:{observational_rows:[
      {risk:4,usage:20,tenure:10,treated:true,renewed:0},
      {risk:1,usage:50,tenure:20,treated:false,renewed:1}
    ]}}
  },
  experiment:{
    round:3,
    labKey:'experiment',
    state:{team_pool:[],economy:{renewal_value_cop:200000,intervention_cost_cop:8000,capacity:15000}},
    analysis:{team_tools:{
      experiment_rows:[
        {segment:'digital',usage:80,tenure:20,treated:true,renewed:1},
        {segment:'digital',usage:70,tenure:18,treated:false,renewed:0}
      ],
      segments:[{id:'digital',name:'Digitales',audience:7000,risk:'Bajo',value_per_result:200000,unit_cost:8000}],
      economy:{renewal_value_cop:200000,intervention_cost_cop:8000,capacity:15000}
    }}
  }
}

function compilePython(code,label){
  const out=spawnSync('python3',['-c','import sys; compile(sys.stdin.read(), "<embedded-lab>", "exec")'],{
    input:code,encoding:'utf8'
  })
  assert.equal(out.status,0,`${label} has invalid Python syntax:\n${out.stderr}\n--- code ---\n${code}`)
}

for(const [name,fixture] of Object.entries(fixtures)){
  test(`${name} embedded Python is syntactically valid in every step`,()=>{
    const lab=buildPythonLab(fixture.round,fixture.state,fixture.analysis,fixture.labKey)
    assert.ok(lab?.steps?.length>0)
    for(const step of lab.steps){
      compilePython(step.guidedCode,`${name}/${step.id}/guided`)
      if(step.advancedCode)compilePython(step.advancedCode,`${name}/${step.id}/advanced`)
      assert.equal(step.guidedCode.includes('print("\n'),false,'raw newline leaked inside a Python string literal')
    }
  })
}
