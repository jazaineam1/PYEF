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

function csvFile(path){
 const [head,...lines]=readFileSync(path,'utf8').replace(/^﻿/,'').trim().split(/\r?\n/);
 const cols=head.split(',');
 return lines.map(l=>Object.fromEntries(l.split(',').map((v,i)=>[cols[i],v])));
}
const near=(actual,expected,tol,label)=>assert.ok(Math.abs(actual-expected)<=tol,label+': esperado '+expected+' ± '+tol+', obtenido '+actual);

test('el A/B exacto de cada Copa (semilla fija 2026): 17/13, +0,51 con IC95 [−7,63; +8,65] y Pragmático sin controles',()=>{
 const rows=csvFile('tests/fixtures/copa_ab_observado_semilla_2026.csv');
 assert.equal(rows.length,450);
 const ab=abEstimate(rows);
 assert.equal(ab.treated,17);assert.equal(ab.control,13);
 near(ab.diff,0.51,0.006,'ATE observado');
 near(ab.se,4.15,0.006,'error estándar entre estudiantes');
 near(ab.ciLow,-7.63,0.011,'IC95 inferior');near(ab.ciHigh,8.65,0.011,'IC95 superior');
 // Pragmático: 7 tratados y 0 controles (no estimable); la celda vacía existe en cada Copa.
 const arms={};
 for(const key of new Set(rows.map(r=>[r.estudiante_id,r.tratamiento,r.arquetipo].join('|')))){
  const [,t,a]=key.split('|');arms[a]??={0:0,1:0};arms[a][t]++;
 }
 assert.deepEqual(arms.Pragmatico,{0:0,1:7});
 // Con un IC tan amplio, una simulación positiva cae dentro y el texto no la presenta como validada.
 const contrast=contrastPrediction(sample({ate_sim:1.41,p10:-8.7,p90:2.5}),ab);
 assert.equal(contrast.inside,true);assert.equal(contrast.sameSign,true);
 near(contrast.width,16.28,0.03,'ancho del IC');
 assert.match(contrast.verdict,/muy amplio/);assert.match(contrast.verdict,/no valida el modelo/);
 // El ATE verdadero (+1,34) es solo docente: los módulos del participante no lo contienen.
 assert.ok(!/1[.,]34/.test(read('src/v2/dean-predictive-trap.js')+read('src/v2/DeanPredictiveTrap.jsx')));
});

function withGameCsv(mode,fn){
 const dir=mkdtempSync(join(tmpdir(),'cw-lab-'));
 try{
  for(const [name,code] of Object.entries(PYTHON_PROGRAMS))writeFileSync(join(dir,name+'.py'),code,'utf8');
  const made=runPython(python.cmd,['tests/helpers/make_game_csv.py',dir,mode]);
  assert.equal(made.status,0,made.stderr);
  const run=(program,layer=program)=>{
   const out=runPython(python.cmd,['tests/helpers/run_lab_program.py',join(dir,program+'.py'),layer,dir]);
   assert.equal(out.status,0,program+' falló:\n'+out.stderr+out.stdout);
   return extractTrapResult(out.stdout);
  };
  return fn(run);
 }finally{rmSync(dir,{recursive:true,force:true})}
}
const firstNumber=(text,pattern)=>Number(pattern.exec(text)?.[1]);

// Valores del análisis cuantitativo del DGP sobre la sesión simulada de 30 jugadores (salas de 6, RF de 45 árboles,
// GroupShuffleSplit .33): MAE y R² de prueba del modelo del Rector; pendientes cruda / con H,Z / con mediadores.
const ROOMS={
 1:{mae:2.91,r2:0.469,slopes:[2.30,1.52,null],arq:2},
 2:{mae:8.21,r2:-2.534,slopes:[-3.27,-0.66,-1.53],arq:3},
 3:{mae:8.77,r2:0.403,slopes:[-2.04,0.57,-0.59],arq:4},
 4:{mae:1.76,r2:0.818,slopes:[-2.33,-2.92,-0.80],arq:3},
 5:{mae:4.54,r2:0.381,slopes:[-3.86,-1.86,-2.99],arq:4}
};
const slopesOf=text=>[
 firstNumber(text,/Asociación cruda B→nota: (-?[\d.]+)/),
 firstNumber(text,/Asociación con antecedentes \(PGA y complejidad\): (-?[\d.]+)/),
 /Asociación con mediadores posteriores: no estimable/.test(text)?null:firstNumber(text,/Asociación con mediadores posteriores: (-?[\d.]+)/)];

test('las cinco salas de la sesión simulada reproducen MAE, R² y pendientes del análisis (incluso R² negativo y modelo no estimable)',needStack,()=>{
 for(const [room,expected] of Object.entries(ROOMS))withGameCsv('sala:'+room,run=>{
  const survey=run('survey');
  assert.equal(survey.result.origen,'sala','sala '+room);
  assert.equal(survey.result.n_estudiantes,6);assert.equal(survey.result.n_filas,90);
  // El primer bloque del programa es el modelo de 3 variables = el del acto Rector.
  near(firstNumber(survey.text,/MAE de prueba: (-?[\d.]+) puntos/),expected.mae,0.011,'sala '+room+' MAE');
  near(firstNumber(survey.text,/R² de prueba: (-?[\d.]+)/),expected.r2,0.0011,'sala '+room+' R²');
  expected.slopes.forEach((value,i)=>{
   const got=slopesOf(survey.text)[i];
   if(value===null)assert.equal(got,null,'sala '+room+': debe ser no estimable');
   else near(got,value,0.011,'sala '+room+' pendiente '+i);
  });
  assert.ok(survey.text.includes('Arquetipos presentes en la muestra: '+expected.arq),'sala '+room+' arquetipos');
  assert.ok(survey.text.includes('AVISO SALA PEQUEÑA'),'sala '+room+': debe avisar que 6 jugadores es poco');
  assert.ok(survey.text.includes('Asociación con antecedentes + ARQUETIPO'));
  // El rango bootstrap siempre se publica y es coherente.
  assert.ok(Number.isFinite(survey.result.p10)&&survey.result.p10<=survey.result.p90);
 });
});

test('ningún enunciado supone un R² alto: R² bajo o negativo muestra un aviso y la sala colineal no inventa pendientes',needStack,()=>{
 withGameCsv('sala:2',run=>{
  const rector=run('rector');
  near(rector.result.r2,-2.534,0.0011,'R² de la sala 2');
  assert.ok(rector.text.includes('AVISO: R² de prueba bajo o negativo'));
  assert.ok(rector.text.includes('AVISO SALA PEQUEÑA'));
  assert.ok(!/R² alto/i.test(rector.text),'el texto no puede dar por hecho un R² alto');
  assert.ok(rector.result.r2<0&&rector.result.origen==='sala');
 });
 withGameCsv('sala:1',run=>{
  const survey=run('survey');
  assert.ok(survey.text.includes('no estimable (columnas colineales en tu sala)'));
  assert.ok(survey.result&&survey.result.mediadores_congelados===true,'el bosque sí corre aunque el OLS no sea estimable');
  assert.ok(!/R² alto/i.test(survey.text));
 });
 const joined=PYTHON_PROGRAMS.rector+PYTHON_PROGRAMS.survey+LAB_PRELUDE+read('src/v2/dean-cup.jsx')+read('src/v2/DeanPredictiveTrap.jsx');
 assert.ok(!/R² (alto|elevado)|el R² sube|un R² más alto/i.test(joined.replace(/No (des por hecho|asumas) un R² alto/gi,'')),'texto que presupone un R² alto');
});

test('con la clase completa (30 jugadores) el bosque es estable y reproduce el análisis; el arquetipo cambia la pendiente',needStack,()=>{
 withGameCsv('clase',run=>{
  const survey=run('survey');
  assert.equal(survey.result.n_estudiantes,30);
  near(firstNumber(survey.text,/MAE de prueba: (-?[\d.]+) puntos/),3.97,0.011,'MAE clase');
  near(firstNumber(survey.text,/R² de prueba: (-?[\d.]+)/),0.644,0.0011,'R² clase');
  const [raw,pre,post]=slopesOf(survey.text);
  near(raw,-2.28,0.011,'cruda');near(pre,-0.35,0.011,'con H,Z');near(post,-1.95,0.011,'con mediadores');
  near(firstNumber(survey.text,/ARQUETIPO \(está en la encuesta\): (-?[\d.]+)/),1.84,0.011,'con arquetipo');
  assert.ok(!survey.text.includes('AVISO SALA PEQUEÑA'));
  const rector=run('rector');
  assert.equal(rector.result.top,'pga_previo','el historial domina la importancia predictiva');
  assert.ok(rector.result.b_relativa<0.25);
  assert.equal(rector.result.mediadores_congelados,false);
  assert.deepEqual(run('rector').result,rector.result,'misma sala, misma simulación (semillas fijas)');
 });
});

test('salas con menos de 4 estudiantes usan la referencia didáctica rotulada, nunca registros inventados de la sala',needStack,()=>{
 for(const mode of ['n:2','n:3'])withGameCsv(mode,run=>{
  const rector=run('rector');
  assert.equal(rector.result.origen,'referencia',mode);
  assert.equal(rector.result.n_estudiantes,30);
  assert.ok(rector.text.startsWith('REFERENCIA DIDÁCTICA INDEPENDIENTE'));
  assert.ok(rector.text.includes('NO es tu sala'));
  assert.equal(run('survey').result.origen,'referencia');
  assert.ok(!rector.text.includes('AVISO SALA PEQUEÑA'),'la referencia tiene 30 estudiantes');
 });
 // Sin ninguna fila (CSV vacío) tampoco falla: usa la referencia.
 withGameCsv('ninguna',run=>{assert.equal(run('rector','vacio').result.origen,'referencia')});
 // Con exactamente 4 estudiantes ya usa la sala, con su aviso y un rango bootstrap que muestra la inestabilidad.
 withGameCsv('n:4',run=>{
  const rector=run('rector');
  assert.equal(rector.result.origen,'sala');assert.equal(rector.result.n_estudiantes,4);
  assert.ok(rector.text.includes('AVISO SALA PEQUEÑA'));
  assert.ok(rector.result.p10<=rector.result.p90);
 });
});

test('el laboratorio A/B reproduce el experimento exacto de cada Copa: 17/13, +0,51 [−7,63; +8,65], DML 1,51 y Pragmático no estimable',needStack,()=>{
 withGameCsv('ninguna',run=>{
  const ab=run('ab');
  assert.equal(ab.result,null);
  for(const line of ['30 estudiantes sintéticos × 15 exámenes','Tratamiento B=4 h: 17 personas; control B=0 h: 13 personas',
   'No se trataron 450 exámenes','HETEROGENEIDAD','POLÍTICA','Pragmatico : muestra pequeña; NO estimable con estabilidad'])assert.ok(ab.text.includes(line),line);
  near(firstNumber(ab.text,/ATE observado: (-?[\d.]+) puntos/),0.51,0.006,'ATE');
  const ci=/IC 95% aproximado entre ESTUDIANTES: (-?[\d.]+) (-?[\d.]+)/.exec(ab.text);
  near(Number(ci[1]),-7.63,0.011,'IC inferior');near(Number(ci[2]),8.65,0.011,'IC superior');
  near(firstNumber(ab.text,/Coeficiente residualizado: (-?[\d.]+) puntos/),1.51,0.011,'DML ilustrativo');
  near(firstNumber(ab.text,/Sobreexigido : (-?[\d.]+) \(n= 5 \+ 3/),9.72,0.011,'Sobreexigido');
  near(firstNumber(ab.text,/Equilibrado : (-?[\d.]+) \(n= 3 \+ 5/),-3.53,0.011,'Equilibrado');
  near(firstNumber(ab.text,/En Riesgo : (-?[\d.]+) \(n= 2 \+ 5/),-5.39,0.011,'En Riesgo');
 });
});
