import test from 'node:test';
import assert from 'node:assert/strict';
import{readFileSync}from'node:fs';
const read=p=>readFileSync(p,'utf8');
test('Python correlation lab is a separate Pages route, not a stage of gameplay',()=>{
 const vite=read('vite.config.js');
 const page=read('dean-correlacion.html');
 const game=read('src/v2/dean-cup.jsx');
 const final=read('src/v2/DeanRectorFinal.jsx');
 assert.match(vite,/deanCorrelation:'dean-correlacion.html'/);
 assert.match(page,/src\/v2\/dean-correlation.jsx/);
 assert.match(game,/LABORATORIO PYODIDE/);
 assert.match(final,/dean-correlacion.html/);
 assert.doesNotMatch(game.slice(game.indexOf('if(arcade)return <section'),game.indexOf('return <section className="dean-exam">')),/Pyodide|Pearson|Spearman/);
});
test('Python computes real Pearson, Spearman, within-person correlations and never asserts a causal effect',()=>{
 const src=read('src/v2/dean-correlation.jsx');
 for(const token of ['loadPyodide','runPythonAsync','csv.DictReader','def pearson','def rank','selected_archetype',
   'only_manual','by_student','r_within','arquetipo','pga_previo','complejidad','nota_final']){
   assert.ok(src.includes(token),token);
 }
 assert.match(src,/Una asociación, sea positiva o negativa/);
 assert.match(src,/no permite concluir/);
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
 assert.match(read('src/v2/DeanRectorFinal.jsx'),/ANALIZAR CORRELACIONES CON PYTHON/);
});
