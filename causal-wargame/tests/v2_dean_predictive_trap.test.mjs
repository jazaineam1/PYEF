import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {PYTHON_PROGRAMS,LAB_PRELUDE,SCIENCE_STEPS,TRAP_RESULT_PREFIX} from '../src/v2/dean-science-programs.js';
import {RECOMMENDATIONS,abEstimate,cleanNote,contrastPrediction,extractTrapResult,readTrapNotes,saveTrapPrediction,
 saveTrapRecommendation,trapStorageKey,validateTrapResult} from '../src/v2/dean-predictive-trap.js';
import {findPython,runPython} from './helpers/python-env.mjs';

const read=p=>readFileSync(p,'utf8');
const python=findPython();
const needStack=python.stack?{}:{skip:'Sin Python 3 con numpy/pandas/scipy/scikit-learn/matplotlib (define CW_PYTHON); la ejecución numérica se omite.'};
const needPython=python.cmd?{}:{skip:'Sin Python 3 disponible.'};

const sample=over=>({modo:'rector',origen:'sala',ate_sim:1.25,p10:-0.5,p90:2.75,mae:3.2,r2:0.84,cov_bajo:0.3,cov_alto:0.4,
 b_relativa:0.02,top:'pga_previo',n_estudiantes:8,n_filas:120,mediadores_congelados:false,...over});
const memoryStorage=(initial={})=>{const m=new Map(Object.entries(initial));return{getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),m}};

test('el resultado de Python se valida y la línea ##RESULT no llega al participante',()=>{
 const output='línea 1\n'+TRAP_RESULT_PREFIX+JSON.stringify(sample())+'\nlínea final\n';
 const {text,result}=extractTrapResult(output);
 assert.equal(text,'línea 1\nlínea final');
 assert.ok(!text.includes('##RESULT'));
 assert.equal(result.ate_sim,1.25);
 assert.equal(result.origen,'sala');
 // Datos dudosos se descartan: nunca se guarda una predicción inventada.
 for(const bad of [{ate_sim:NaN},{p10:3,p90:1},{modo:'ab'},{origen:'otro'},{n_filas:-2},{r2:'0.8'},{ate_sim:undefined}])
  assert.equal(validateTrapResult(sample(bad)),null,JSON.stringify(bad));
 assert.equal(extractTrapResult(TRAP_RESULT_PREFIX+'{"ate_sim": NaN}').result,null);
 assert.equal(extractTrapResult(TRAP_RESULT_PREFIX+'no es json').result,null);
 assert.equal(extractTrapResult(undefined).text,'');
});

test('las notas personales viven solo en el navegador y no aceptan basura',()=>{
 const storage=memoryStorage();
 assert.deepEqual(readTrapNotes(storage,'abc'),{rector:{},survey:{}});
 assert.equal(saveTrapRecommendation(storage,'abc','rector',{choice:'recortar'}),null,'sin predicción no hay recomendación');
 const saved=saveTrapPrediction(storage,'abc',sample());
 assert.equal(saved.rector.prediction.ate_sim,1.25);
 assert.equal(saveTrapPrediction(storage,'abc',{modo:'rector'}),null);
 assert.equal(saveTrapRecommendation(storage,'abc','rector',{choice:'adivinar'}),null,'opción fuera del catálogo');
 assert.equal(saveTrapRecommendation(storage,'abc','otro',{choice:'recortar'}),null);
 const withNote=saveTrapRecommendation(storage,'abc','rector',{choice:'experimentar',note:'  B\u0000   no\nmide   efecto  '+'x'.repeat(400)});
 assert.equal(withNote.rector.recommendation.choice,'experimentar');
 assert.ok(withNote.rector.recommendation.note.length<=280);
 assert.ok(withNote.rector.recommendation.note.startsWith('B no mide efecto'));
 assert.equal(cleanNote('\n\t'),'');
 // La clave es por partida: otra Copa no ve estas notas.
 assert.equal(trapStorageKey(' abc '),'cw-dean-trap-ABC');
 assert.deepEqual(readTrapNotes(storage,'OTRA'),{rector:{},survey:{}});
 // Re-ejecutar con el mismo resultado conserva la recomendación; un resultado distinto la descarta.
 assert.equal(saveTrapPrediction(storage,'abc',sample()).rector.recommendation.choice,'experimentar');
 assert.equal(saveTrapPrediction(storage,'abc',sample({ate_sim:-2})).rector.recommendation,undefined);
 // JSON corrupto o almacenamiento que lanza: estado vacío, sin excepción.
 assert.deepEqual(readTrapNotes(memoryStorage({[trapStorageKey('abc')]:'{roto'}),'abc'),{rector:{},survey:{}});
 assert.deepEqual(readTrapNotes({getItem(){throw new Error('bloqueado')}},'abc'),{rector:{},survey:{}});
 assert.equal(saveTrapPrediction({getItem:()=>null,setItem(){throw new Error('lleno')}},'abc',sample()).rector.prediction.ate_sim,1.25);
 // Un modo no puede guardar la predicción de otro.
 const forged=memoryStorage({[trapStorageKey('abc')]:JSON.stringify({v:1,survey:{prediction:sample({modo:'rector'})}})});
 assert.equal(readTrapNotes(forged,'abc').survey.prediction,undefined);
 assert.deepEqual(RECOMMENDATIONS.map(r=>r.id),['recortar','mantener','ampliar','experimentar']);
});

test('ATE del A/B por estudiante y contraste honesto con la simulación',()=>{
 // 2 tratados (10, 12) y 2 controles (8, 9) con 3 exámenes cada uno: la unidad es el estudiante.
 const rows=[];
 const add=(id,arm,scores)=>scores.forEach(n=>rows.push({estudiante_id:id,tratamiento:String(arm),nota_final:String(n)}));
 add('a',1,[9,10,11]);add('b',1,[11,12,13]);add('c',0,[7,8,9]);add('d',0,[8,9,10]);
 rows.push({estudiante_id:'x',tratamiento:'2',nota_final:'50'},{estudiante_id:'',tratamiento:'1',nota_final:'50'},{estudiante_id:'y',tratamiento:'1',nota_final:'NaN'});
 const ab=abEstimate(rows);
 assert.equal(ab.treated,2);assert.equal(ab.control,2);
 assert.ok(Math.abs(ab.diff-2.5)<1e-12);
 const se=Math.sqrt(2/2+0.5/2);
 assert.ok(Math.abs(ab.se-se)<1e-12);
 assert.ok(Math.abs(ab.ciLow-(2.5-1.96*se))<1e-12&&Math.abs(ab.ciHigh-(2.5+1.96*se))<1e-12);
 assert.equal(abEstimate(rows.slice(0,3)),null,'un brazo con menos de dos estudiantes no tiene intervalo');
 assert.equal(abEstimate(null),null);

 const inside=contrastPrediction(sample({ate_sim:3}),ab);
 assert.equal(inside.inside,true);assert.equal(inside.sameSign,true);
 assert.ok(Math.abs(inside.gap-0.5)<1e-12);
 assert.ok(!/FUERA/.test(inside.verdict));
 const outside=contrastPrediction(sample({ate_sim:-4,p10:-6,p90:-2}),ab);
 assert.equal(outside.inside,false);assert.equal(outside.sameSign,false);
 assert.match(outside.verdict,/FUERA del IC95/);
 // Con un IC muy amplio, caer dentro NO se vende como validación del modelo.
 const wide=contrastPrediction(sample({ate_sim:0}),{diff:-6.5,ciLow:-14.7,ciHigh:1.8,se:4.2,treated:14,control:11});
 assert.equal(wide.inside,true);
 assert.match(wide.verdict,/no valida el modelo/);
 assert.match(contrastPrediction(sample({mediadores_congelados:true}),ab).frozenNote,/mediadores/);
 assert.match(contrastPrediction(sample({origen:'referencia'}),ab).referenceNote,/REFERENCIA DIDÁCTICA/);
 assert.equal(contrastPrediction(null,ab),null);
 assert.equal(contrastPrediction(sample(),null),null);
});

test('los programas Python mantienen el contrato, la procedencia sintética y no puntúan velocidad',()=>{
 assert.deepEqual(Object.keys(PYTHON_PROGRAMS).sort(),['ab','rector','survey']);
 assert.deepEqual(Object.keys(SCIENCE_STEPS).sort(),['ab','rector','survey']);
 for(const mode of ['rector','survey']){
  const code=PYTHON_PROGRAMS[mode];
  for(const needle of ['GroupShuffleSplit','RandomForestRegressor','permutation_importance','B_ALTO','B_BAJO','##RESULT',
   'REFERENCIA DIDÁCTICA INDEPENDIENTE','NO es tu sala','n_jobs=1','estudiante_id','extrapolación'.toUpperCase()])
   assert.ok(code.includes(needle),mode+' · '+needle);
  assert.ok(code.includes('d.estudiante_id.nunique() >= 4'),'umbral de 4 estudiantes para usar la sala');
  assert.ok(!code.includes('print("\n'),'salto de línea crudo dentro de una cadena Python');
 }
 assert.ok(PYTHON_PROGRAMS.survey.includes('MEDIADORES CONGELADOS'));
 assert.ok(PYTHON_PROGRAMS.survey.includes('Asociación cruda B→nota'),'conserva las tres asociaciones OLS');
 assert.ok(PYTHON_PROGRAMS.ab.includes('KFold(n_splits=3'));
 assert.ok(LAB_PRELUDE.includes('No son participantes ni tu sala'));
 assert.ok(!/time\.|datetime|perf_counter/.test(Object.values(PYTHON_PROGRAMS).join('\n')+LAB_PRELUDE),'sin cronómetros ni puntuación por velocidad');
 // El modo A/B no emite resultado de simulación (solo rector y survey guardan notas).
 assert.ok(!PYTHON_PROGRAMS.ab.includes('##RESULT'));
});

test('la interfaz guarda notas solo en local, no usa red ni tiempo y rotula lo sintético',()=>{
 const trapJs=read('src/v2/dean-predictive-trap.js'),trapUi=read('src/v2/DeanPredictiveTrap.jsx');
 const science=read('src/v2/DeanSciencePython.jsx'),cup=read('src/v2/dean-cup.jsx');
 for(const source of [trapJs,trapUi]){
  assert.ok(!/fetch\(|XMLHttpRequest|sendBeacon|call\(|supabase|Date\.now|performance\.now/.test(source),'las notas no salen del navegador ni miden tiempo');
 }
 assert.ok(trapUi.includes('no puntúa')||trapUi.includes('no puntúa, no mide velocidad'));
 assert.ok(trapUi.includes('no se envía al servidor'));
 assert.ok(trapJs.includes('SINTÉTICO'));
 assert.ok(science.includes('extractTrapResult')&&science.includes('TrapRecommendation')&&science.includes("mode!=='ab'"));
 assert.ok(science.includes('gameCode'));
 assert.ok(cup.includes('<DeanPredictiveContrast rows={rows} gameCode={code}'));
 assert.ok(cup.includes('<DeanSciencePython mode={layer} rows={rows} gameCode={code}/>'));
 // El contraste solo aparece con las filas del A/B, nunca antes de que el docente libere la evidencia.
 assert.ok(cup.includes("{rows&&layer==='ab'&&<DeanPredictiveContrast"));
 // FUTUROS y V1 no se tocan: ninguna ruta antigua importa los módulos nuevos.
 for(const old of ['src/v2/V2Play.jsx','src/v2/V2Facilitator.jsx','src/v2/V2Wall.jsx','src/pages/SecurePlayV6.jsx']){
  const src=read(old);
  assert.ok(!src.includes('dean-predictive-trap')&&!src.includes('DeanPredictiveTrap')&&!src.includes('dean-science-programs'),old);
 }
});

test('cada programa Python compila (lo que enviamos al navegador es sintaxis válida)',needPython,()=>{
 for(const [mode,code] of Object.entries(PYTHON_PROGRAMS)){
  const out=runPython(python.cmd,['-c','import sys; compile(sys.stdin.read(), "<laboratorio>", "exec")'],{input:code});
  assert.equal(out.status,0,mode+' tiene sintaxis Python inválida:\n'+out.stderr);
 }
});

function withGameCsv(students,fn){
 const dir=mkdtempSync(join(tmpdir(),'cw-lab-'));
 try{
  writeFileSync(join(dir,'prelude.py'),LAB_PRELUDE,'utf8');
  for(const [mode,code] of Object.entries(PYTHON_PROGRAMS))writeFileSync(join(dir,mode+'.py'),code,'utf8');
  const made=runPython(python.cmd,['tests/helpers/make_game_csv.py',dir,join(dir,'prelude.py'),String(students)]);
  assert.equal(made.status,0,made.stderr);
  const run=(mode,layer=mode)=>{
   const out=runPython(python.cmd,['tests/helpers/run_lab_program.py',join(dir,mode+'.py'),layer,dir]);
   assert.equal(out.status,0,mode+' falló:\n'+out.stderr+out.stdout);
   return extractTrapResult(out.stdout);
  };
  return fn(run);
 }finally{rmSync(dir,{recursive:true,force:true})}
}

test('Random Forest sobre tu sala: split por estudiante, importancia, do(B) simulado y rango bootstrap',needStack,()=>{
 withGameCsv(8,run=>{
  const rector=run('rector');
  assert.ok(rector.result,'el programa debe emitir un resultado válido');
  assert.equal(rector.result.modo,'rector');
  assert.equal(rector.result.origen,'sala');
  assert.equal(rector.result.n_estudiantes,8);
  assert.equal(rector.result.n_filas,120);
  assert.equal(rector.result.mediadores_congelados,false);
  assert.ok(rector.result.p10<=rector.result.p90);
  assert.ok(rector.result.r2>0.5&&rector.result.mae<8,'el bosque debe predecir razonablemente notas sintéticas');
  assert.equal(rector.result.top,'pga_previo','el historial domina la importancia predictiva en este DGP');
  assert.ok(rector.result.b_relativa<0.25,'B pesa poco como predictor aunque la simulación dé otro número');
  for(const line of ['OBSERVACIONES DE TU SALA','IMPORTANCIA POR PERMUTACIÓN','SIMULACIÓN do(B) CON EL RANDOM FOREST',
   'EFECTO SIMULADO (B=4 − B=0)','DEPENDENCIA PARCIAL DE B','COBERTURA','EXTRAPOLACIÓN','LECTURA 1','LECTURA 2','NO es efecto causal'])
   assert.ok(rector.text.includes(line),line);
  assert.ok(!rector.text.includes('##RESULT'));
  // Determinismo: misma sala, misma simulación (semillas fijas).
  assert.deepEqual(run('rector').result,rector.result);

  const survey=run('survey');
  assert.equal(survey.result.modo,'survey');
  assert.equal(survey.result.mediadores_congelados,true);
  assert.equal(survey.result.origen,'sala');
  assert.ok(survey.result.r2>=rector.result.r2-0.05,'con más variables el ajuste no debería empeorar de forma material');
  const raw=Number(/Asociación cruda B→nota: (-?[\d.]+)/.exec(survey.text)[1]);
  assert.ok(raw<0,'la asociación cruda es negativa por la selección de arquetipos: la trampa existe en los datos');
  assert.ok(survey.text.includes('MEDIADORES CONGELADOS'));
 });
});

test('salas con menos de 4 estudiantes usan la referencia didáctica rotulada, nunca registros inventados de la sala',needStack,()=>{
 for(const students of [2,3])withGameCsv(students,run=>{
  const rector=run('rector');
  assert.equal(rector.result.origen,'referencia');
  assert.equal(rector.result.n_estudiantes,30);
  assert.ok(rector.text.startsWith('REFERENCIA DIDÁCTICA INDEPENDIENTE'));
  assert.ok(rector.text.includes('NO es tu sala'));
  assert.equal(run('survey').result.origen,'referencia');
 });
 // Sin ninguna fila (p. ej. CSV vacío) tampoco falla: usa la referencia.
 withGameCsv(0,run=>{
  const empty=run('rector','vacio');
  assert.equal(empty.result.origen,'referencia');
 });
 // Con exactamente 4 estudiantes ya usa la sala (split por estudiante) y el rango bootstrap muestra su inestabilidad.
 withGameCsv(4,run=>{
  const rector=run('rector');
  assert.equal(rector.result.origen,'sala');
  assert.equal(rector.result.n_estudiantes,4);
  assert.ok(rector.result.p10<=rector.result.p90);
  assert.ok(rector.text.includes('Split por estudiante'));
 });
});

test('el laboratorio A/B conserva ATE entre estudiantes, DML con cross-fitting y heterogeneidad',needStack,()=>{
 withGameCsv(0,run=>{
  const ab=run('ab');
  assert.equal(ab.result,null);
  for(const line of ['30 estudiantes sintéticos × 15 exámenes','ATE observado:','IC 95% aproximado entre ESTUDIANTES','No se trataron 450 exámenes',
   'Coeficiente residualizado','HETEROGENEIDAD','POLÍTICA'])assert.ok(ab.text.includes(line),line);
 });
});
