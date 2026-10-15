import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,writeFileSync,rmSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {LAB_PRELUDE} from '../src/v2/dean-science-programs.js';
import {NOTEBOOK_PATH,SOLUTIONS_PATH,findBlanks,loadNotebook,loadSolutions,notebookScript,solveNotebook} from '../scripts/notebook_solver.mjs';
import {findPython,runPython} from './helpers/python-env.mjs';

const nb=loadNotebook(),solutions=loadSolutions();
const codeOf=notebook=>notebook.cells.filter(c=>c.cell_type==='code').map(c=>c.source.join('')).join('\n');
const python=findPython();
const needStack=python.stack?{}:{skip:'Sin Python 3 con numpy/pandas/scipy/scikit-learn/matplotlib (define CW_PYTHON); la ejecución del cuaderno se omite.'};
const needPython=python.cmd?{}:{skip:'Sin Python 3 disponible.'};
const EXPECTED=['a1','a2','a3','b1','b2','b3','b4','b5','b6','b7','c1','c2','c3','c4','c5','d1','d2','d3','d4','d5','d6','d7','e1','e2'];

test('el cuaderno es nbformat 4 válido, con ids únicos y sin salidas guardadas',()=>{
 assert.equal(nb.nbformat,4);
 assert.ok(nb.nbformat_minor>=5);
 const ids=nb.cells.map(c=>c.id);
 assert.ok(ids.every(Boolean)&&new Set(ids).size===ids.length,'cada celda necesita un id único (nbformat 4.5)');
 for(const c of nb.cells){
  assert.ok(Array.isArray(c.source),'source es lista de líneas');
  if(c.cell_type==='code'){assert.deepEqual(c.outputs,[]);assert.equal(c.execution_count,null)}
 }
 assert.ok(nb.cells.length>=15);
 assert.match(nb.metadata.colab.name,/huecos/i);
});

test('conserva las huellas que exigen los contratos previos del curso',()=>{
 const code=codeOf(nb);
 for(const s of ['GroupShuffleSplit','RandomForestRegressor','pga_previo','tratamiento','ddof=1'])assert.ok(code.includes(s),s);
 for(const s of ['sistema_academico_rector.csv','encuesta_estudiantes_juego.csv','cohorte_ab_test_2026.csv'])assert.ok(code.includes(s),s);
 assert.ok(code.includes('validate="one_to_one"'),'el cruce usa ambos identificadores');
});

test('hay 24 huecos autocorregidos en las cuatro partes pedidas y cada uno tiene solución y verificación',()=>{
 const blanks=findBlanks(nb);
 assert.deepEqual(blanks.map(b=>b.id),EXPECTED);
 assert.deepEqual(Object.keys(solutions).sort(),[...EXPECTED].sort());
 const code=codeOf(nb);
 for(const id of EXPECTED)assert.ok(code.includes('verificar("'+id+'"'),'falta el autocorrector de '+id);
 // (a) OLS, (b) Random Forest + permutación + do(B), (c) puerta trasera vs mal control, (d) A/B por estudiante.
 for(const s of ['np.polyfit','coef_b','permutation_importance','GroupShuffleSplit','horas_bienestar_sem=','descendientes(',
  'bootstrap_coef','por_estudiante','ttest_ind','ddof=1','se_ingenuo'])assert.ok(code.includes(s),s);
 assert.ok(code.includes('TOL = 1e-6')&&code.includes('np.allclose'),'verificación numérica con tolerancia');
 assert.ok(code.includes('assert valor is not None')&&code.includes('assert condicion(valor)'),'son asserts reales');
});

test('el cuaderno publicado NO entrega las soluciones (viven en docs/facilitator)',()=>{
 assert.ok(NOTEBOOK_PATH.startsWith('public/')&&SOLUTIONS_PATH.startsWith('docs/'));
 const code=codeOf(nb);
 for(const [id,solution] of Object.entries(solutions)){
  if(solution.length<18)continue;
  assert.ok(!code.includes(solution),'la solución de '+id+' aparece literal en el cuaderno publicado');
 }
 // Cada hueco publicado sigue en None.
 for(const blank of findBlanks(nb))assert.match(blank.text,/=\s*None\s+#/);
 // Resolver el cuaderno elimina todos los huecos y no toca nada más.
 const solved=solveNotebook(nb,solutions);
 assert.equal(findBlanks(solved).length,0);
 assert.equal(solved.cells.length,nb.cells.length);
 assert.equal(JSON.stringify(nb).includes('⟵ HUECO a1'),true);
 // Este repositorio nunca publica el cuaderno resuelto.
 assert.ok(!existsSync('public/notebooks/causalidad_copa_decano_solucion.ipynb'));
});

test('la referencia didáctica del cuaderno es la misma que usa la app (sin deriva)',()=>{
 const normalize=text=>text.replace(/\r/g,'').split('\n').map(l=>l.trimEnd()).filter(l=>l.trim()&&!l.trim().startsWith('#')).join('\n');
 const fromPrelude=LAB_PRELUDE.slice(LAB_PRELUDE.indexOf('DIFICULTAD = ['),LAB_PRELUDE.indexOf('def cargar_sala')).replace(/ETIQUETA = \{[\s\S]*?\}\n/,'');
 const setup=codeOf(nb);
 const fromNotebook=setup.slice(setup.indexOf('DIFICULTAD = ['),setup.indexOf('# --- Carga de datos ---'));
 assert.equal(normalize(fromNotebook),normalize(fromPrelude));
});

test('el cuaderno compila como Python (con y sin huecos resueltos)',needPython,()=>{
 for(const [label,notebook] of [['con huecos',nb],['resuelto',solveNotebook(nb,solutions)]]){
  const out=runPython(python.cmd,['-c','import sys; compile(sys.stdin.read(), "<cuaderno>", "exec")'],{input:notebookScript(notebook)});
  assert.equal(out.status,0,label+':\n'+out.stderr);
 }
});

function inGameFolder(students,scriptText,fn){
 const dir=mkdtempSync(join(tmpdir(),'cw-nb-'));
 try{
  writeFileSync(join(dir,'prelude.py'),LAB_PRELUDE,'utf8');
  const made=runPython(python.cmd,[join(process.cwd(),'tests/helpers/make_game_csv.py'),dir,join(dir,'prelude.py'),String(students)]);
  assert.equal(made.status,0,made.stderr);
  writeFileSync(join(dir,'cuaderno.py'),scriptText,'utf8');
  return fn(runPython(python.cmd,['cuaderno.py'],{cwd:dir}));
 }finally{rmSync(dir,{recursive:true,force:true})}
}

test('sin resolver, el primer autocorrector falla con una pista y no con un error críptico',needStack,()=>{
 const out=inGameFolder(8,notebookScript(nb),r=>r);
 assert.notEqual(out.status,0);
 assert.match(out.stderr,/AssertionError: ❌ a1: completa el hueco/);
});

test('resuelto, los 24 autocorrectores pasan con datos en formato del juego y el tablero queda completo',needStack,()=>{
 const out=inGameFolder(8,notebookScript(solveNotebook(nb,solutions)),r=>r);
 assert.equal(out.status,0,out.stderr);
 assert.match(out.stdout,/Origen de los datos de las partes A–C: TU SALA/);
 assert.match(out.stdout,/Huecos resueltos: 24 de 24/);
 for(const id of EXPECTED)assert.ok(out.stdout.includes('✅ '+id),id);
 assert.ok(!out.stdout.includes('⬜'));
 assert.match(out.stdout,/Efecto simulado do\(B=4\) − do\(B=0\): [+-]\d/);
 assert.match(out.stdout,/Error ingenuo [\d.]+ < error correcto [\d.]+/);
});

test('con menos de 4 estudiantes el cuaderno usa la referencia didáctica rotulada y sigue funcionando',needStack,()=>{
 const out=inGameFolder(3,notebookScript(solveNotebook(nb,solutions)),r=>r);
 assert.equal(out.status,0,out.stderr);
 assert.match(out.stdout,/Origen de los datos de las partes A–C: REFERENCIA DIDÁCTICA INDEPENDIENTE · 30 estudiantes sintéticos · NO es tu sala/);
 assert.match(out.stdout,/Huecos resueltos: 24 de 24/);
});

test('respuestas incorrectas se rechazan con el identificador del hueco y una pista',needStack,()=>{
 const wrong=[
  ['a2',solutions.a3,/a2: tu valor/],                                    // incluye mediadores como "antecedentes"
  ['b5','X.assign(horas_bienestar_sem=3.0)',/b5: tu valor/],             // intervención equivocada
  ['b6','(bosque_final.predict(X_bajo) - bosque_final.predict(X_alto)).mean()',/b6: tu valor/],
  ['c2','["pga_previo", "horas_estudio"]',/c2: Debe incluir la causa previa/],   // ajusta un mediador
  ['d1','ab.groupby("estudiante_id", as_index=False).nota_final.mean()',/d1:/],   // pierde el brazo de tratamiento
  ['d5','np.sqrt(tratados.var(ddof=0) / len(tratados) + controles.var(ddof=0) / len(controles))',/d5: tu valor/],
  ['d7','se',/d7: /],                                                      // el error correcto no es el ingenuo
  ['e2','"seguro"',/e2: Elige una de las cuatro opciones/]
 ];
 for(const [id,expression,pattern] of wrong){
  const mutated=solveNotebook(nb,{...solutions,[id]:expression});
  const out=inGameFolder(8,notebookScript(mutated),r=>r);
  assert.notEqual(out.status,0,id+' debería fallar con la respuesta incorrecta');
  assert.match(out.stderr,/AssertionError: ❌/,id);
  assert.match(out.stderr,pattern,id+'\n'+out.stderr.slice(-600));
 }
});
