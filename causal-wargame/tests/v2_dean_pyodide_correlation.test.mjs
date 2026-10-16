import test from 'node:test';
import assert from 'node:assert/strict';
import{readFileSync}from'node:fs';
const read=p=>readFileSync(p,'utf8');
test('Pyodide is an embedded auto-loading scene in play and teacher, only three published game views',()=>{
 const vite=read('vite.config.js');
 const game=read('src/v2/dean-cup.jsx');
 const final=read('src/v2/DeanRectorFinal.jsx');
 const lab=read('src/v2/dean-correlation.jsx');
 assert.doesNotMatch(vite,/deanCorrelation:/);
 assert.match(vite,/deanPlay:'dean-play.html'/);
 assert.match(vite,/deanTeacher:'dean-teacher.html'/);
 assert.match(vite,/deanWall:'dean-wall.html'/);
 assert.match(game,/onGetCsv=\{\(\)=>call\('game_export'/);
 assert.match(game,/call\('teacher_game_export'/);
 assert.match(game,/CopaCorrelation embedded/);
 assert.match(final,/scene==='correlation'/);
 assert.match(final,/CopaCorrelation embedded loadCsv=\{onGetCsv\}/);
 assert.doesNotMatch(final,/href=".\/dean-correlacion.html"/);
 assert.match(lab,/loadCsv\(\)/);
 assert.match(lab,/blob\.text\(\)/);
 assert.match(lab,/useEffect\(\(\)=>\{if\(embedded&&csvText\)void analyse\(\)/);
 assert.match(lab,/CORRELACIÓN NEGATIVA OBSERVADA/);
});
test('Python computes real Pearson, Spearman, within-person correlations and never asserts a causal effect',()=>{
 const src=read('src/v2/dean-correlation.jsx');
 for(const token of ['loadPyodide','runPythonAsync','csv.DictReader','def pearson','def rank','selected_archetype',
   'only_manual','by_student','r_within','arquetipo','pga_previo','complejidad','nota_final']){
   assert.ok(src.includes(token),token);
 }
 assert.match(src,/El expediente del Rector/);
 assert.match(src,/Toma tu decisión y recibirás la respuesta del Rector/);
 assert.doesNotMatch(src,/simpson/i);
 assert.match(src,/accept=".csv,text\/csv"/);
 assert.match(src,/Scatter points=\{data.points\}/);
});
test('Easy notebook is valid ipynb and includes full analysis for downloaded 5-room 6-exam CSV',()=>{
 const nb=JSON.parse(read('public/notebooks/copa_decano_6_examenes_correlaciones.ipynb'));
 assert.equal(nb.nbformat,4);
 assert.ok(nb.cells.length>=12);
 const txt=nb.cells.flatMap(c=>c.source).join('');
 for(const x of ['files.upload()','horas_bienestar_jornada','horas_estudio_jornada','horas_sueno_jornada',
 'nota_final','pearson','spearman','auto_simulado','arquetipo','pga_previo','np.linalg.lstsq',
 'estudiante_id','sala','examen_nro','6 exámenes','no identifican']){
  assert.ok(txt.includes(x),x);
 }
 assert.match(read('src/v2/DeanRectorFinal.jsx'),/REVISAR CORRELACIONES REALES DE LA COPA/);
});
