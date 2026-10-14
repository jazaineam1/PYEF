import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {WORKSHOP_120,totalWorkshopMinutes} from '../src/v2/workshop-script.js'
const read=p=>readFileSync(p,'utf8')
test('workshop has five teaching phases and a separate 15min final, not six independent lectures',()=>{
 assert.equal(totalWorkshopMinutes,120)
 assert.deepEqual(WORKSHOP_120.map(s=>[s.start,s.end]),[[0,10],[10,30],[30,55],[55,80],[80,105],[105,120]])
 assert.deepEqual(WORKSHOP_120[4].challenges,[2,4,5,6])
 assert.equal(WORKSHOP_120[5].id,'kahoot')
})
test('quiz server uses teacher token, one vote, deadline and locked transitions',()=>{
 const sql=read('supabase/migrations/202610140003_v2_workshop_kahoot.sql')
 for(const x of ['primary key (game_id,question_no,player_id)','clock_timestamp()>=q.deadline_at','for update','cw_validate_facilitator_token','cw_validate_player_token','current_question=8','question_open','question_locked','final_podium','correct_choice','security invoker','enable row level security','to service_role'])assert.ok(sql.includes(x),x)
 assert.equal((sql.match(/^\([1-8],'/gm)||[]).length,8)
 assert.match(sql,/create or replace function public.cw_v2_quiz_submit/)
 assert.doesNotMatch(sql,/grant execute on function public\.cw_v2_quiz_.* to anon/i)
})
test('before reveal the response excludes correct answer, distribution and explanation',()=>{
 const sql=read('supabase/migrations/202610140003_v2_workshop_kahoot.sql')
 const w=sql.slice(sql.indexOf("if effective in ('question_preview'"),sql.indexOf('select coalesce(jsonb_agg(to_jsonb(t)'))
 assert.ok(w.indexOf("'correct_choice'")>w.indexOf("else"),'Reveal fields only after else branch')
 assert.match(w,/tallies/)
})
test('separate score /120, student, facilitator and Wall must all participate',()=>{
 const ui=read('src/v2/V2Quiz.jsx')
 for(const x of ['export function QuizPlayer','export function QuizWall','export function QuizTeacher','export function WorkshopDirector','useV2Quiz','points','/120','deadline_at'])assert.ok(ui.includes(x),x)
 assert.match(read('src/v2/V2Play.jsx'),/QuizPlayer/)
 assert.match(read('src/v2/V2Wall.jsx'),/QuizWall/)
 assert.match(read('src/v2/V2Facilitator.jsx'),/QuizTeacher/)
})
test('causal seven-layer explanations in V2 contain all six topics',()=>{
 const t=read('src/v2/CausalExplainer.jsx')
 for(const n of [1,2,3,4,5,6])assert.ok(t.includes(' '+n+':{'),'Microlección '+n)
 for(const x of ['Contrafactual','confusor','DML','ATE','CATE','EconML'])assert.match(t,new RegExp(x,'i'))
})

test('six uninterrupted acts without thirty teacher clicks',async()=>{
 const {instructorLedMinutes,participatoryMinutes,getWorkshopCue}=await import('../src/v2/workshop-script.js')
 assert.equal(instructorLedMinutes,36)
 assert.equal(participatoryMinutes,84)
 assert.equal(WORKSHOP_120.length,6)
 assert.equal(WORKSHOP_120.reduce((n,s)=>n+s.teacherMinutes+s.participantMinutes,0),120)
 for(const s of WORKSHOP_120)for(const field of ['teacher','activity','demo','wow','checkpoint','essential'])assert.ok(s[field]?.length>20,s.id+': '+field)
 assert.equal(getWorkshopCue({phase_index:3,cue_index:0}),null)
 assert.equal(getWorkshopCue({phase_index:3,cue_index:1}).mode,'teacher')
 const sql=read('supabase/migrations/202610140003_v2_workshop_kahoot.sql')
 assert.match(sql,/cue_index between 0 and 1/)
 assert.match(sql,/next_fast/)
 const ui=read('src/v2/V2Quiz.jsx')
 assert.match(ui,/Proyectar explicación \(opcional\)/)
 assert.match(ui,/Volver al juego/)
 assert.doesNotMatch(ui,/Siguiente momento|Momento anterior|v2-workshop-cues/)
})
