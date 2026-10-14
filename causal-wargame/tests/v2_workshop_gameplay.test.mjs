import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {WORKSHOP_120,instructorLedMinutes,participatoryMinutes} from '../src/v2/workshop-script.js'
import {WORKSHOP_SCENES} from '../src/v2/workshop-scenes.js'
import {WORKSHOP_PYTHON} from '../src/v2/workshop-python.js'
const read=p=>readFileSync(p,'utf8')
test('five continuous scenes, single 15-minute finale, not six mandatory missions',()=>{
 assert.equal(WORKSHOP_120.length,6)
 assert.equal(WORKSHOP_SCENES.length,5)
 assert.equal(instructorLedMinutes,36)
 assert.equal(participatoryMinutes,84)
 assert.deepEqual(WORKSHOP_120.map(s=>[s.start,s.end]),[[0,10],[10,30],[30,55],[55,80],[80,105],[105,120]])
 for(let i=0;i<5;i++){
  const scene=WORKSHOP_SCENES[i]
  assert.equal(scene.options.length,3)
  for(const [id,title,description] of scene.options){
    assert.ok(['a','b','c'].includes(id))
    assert.ok(title.length>10&&description.length>18)
  }
  assert.ok(scene.reveal.length>65)
 }
})
test('active workshop bypasses all six locked deep-mission checkpoints',()=>{
 const src=read('src/v2/V2Play.jsx')
 assert.match(src,/activeWorkshop\?<WorkshopScenePlayer data=\{finalQuiz\}\/>/)
 assert.match(src,/inFinalBattle\?<QuizPlayer/)
 assert.match(src,/RoundPlay state=\{state\}/)
 assert.match(read('src/v2/V2Facilitator.jsx'),/finalQuiz\?\.agenda\?\.active\?<section/)
 assert.match(read('src/v2/V2Wall.jsx'),/WorkshopSceneWall/)
})
test('one server-verified selection per scene, no write to legacy game decisions',()=>{
 const sql=read('supabase/migrations/202610140003_v2_workshop_kahoot.sql')
 for(const term of ['cw_v2_workshop_choices','primary key(game_id,phase_index,player_id)',
  'cw_validate_player_token','on conflict do nothing',"workshop.cue_index<>0",
  'revoke all on public.cw_v2_workshop_choices','to service_role',
  'cw_v2_workshop_presence','cw_v2_workshop_player'])assert.ok(sql.includes(term),term)
 assert.doesNotMatch(sql,/grant execute on function public\.cw_v2_workshop_vote.* to (anon|authenticated)/i)
 const fn=read('supabase/functions/v2-quiz/index.ts')
 assert.match(fn,/action==='workshop_vote'/)
 assert.match(fn,/p_token:player/)
})
test('real Python demos are optional and output is never fabricated',()=>{
 const ui=read('src/v2/V2WorkshopScene.jsx')
 for(const piece of ['Worker(new URL','./pyodide.worker.js','msg.type===\\'result\\'','workshop_vote','disabled','WorkshopOptionalPython'])assert.ok(ui.includes(piece),piece)
 for(const phase of [2,3,4]){
  assert.ok(WORKSHOP_PYTHON[phase].code.includes('import numpy'))
  assert.ok(WORKSHOP_PYTHON[phase].code.includes('print('))
 }
 assert.match(ui,/sin puntos/)
 assert.match(ui,/No hay examen sorpresa/)
})
test('teacher has optional projection, scene choice reveal hides until teacher opens it',()=>{
 const sql=read('supabase/migrations/202610140003_v2_workshop_kahoot.sql')
 assert.match(sql,/if w\.cue_index=1 then/)
 assert.match(sql,/if workshop\.game_id is null or not workshop\.active/)
 const ui=read('src/v2/V2Quiz.jsx')
 assert.match(ui,/Proyectar explicación \(opcional\)/)
 assert.match(ui,/WorkshopSceneReveal/)
 assert.doesNotMatch(ui,/Siguiente momento|Momento anterior/)
})
