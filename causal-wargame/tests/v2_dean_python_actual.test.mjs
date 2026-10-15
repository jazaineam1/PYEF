import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';

// Executes the exact CPython calculation embedded in the Pyodide browser page.
// Skip only if the host running local npm tests lacks a Python interpreter.
test('Actual Python correlation computes Pearson/Spearman and recognizes repeated students',t=>{
 const version=spawnSync('python3',['--version'],{encoding:'utf8'});
 if(version.status!==0){t.skip('python3 not installed on this local machine');return}
 const js=readFileSync('src/v2/dean-correlation.jsx','utf8');
 const source=js.match(/const PYTHON=String.raw`([\s\S]*?)`;/)?.[1];
 assert.ok(source,'Python source is statically embedded in the browser analysis');
 const cols=['estudiante_id','sala','examen_nro','arquetipo','pga_previo','complejidad',
 'horas_estudio_jornada','horas_sueno_jornada','horas_bienestar_jornada','nota_final','auto_simulado'];
 const rows=[];
 for(let i=0;i<12;i++){
   const p=i%3,well=0.5+(i%4),sleep=8,study=5-well;
   rows.push(['Jugador '+p,p%2+1,i+1,'balanced',3.5,1.2,study,sleep,well,15+well*5,false]);
 }
 const csv=[cols.join(','),...rows.map(x=>x.join(','))].join('\n');
 const prefix=`csv_input=${JSON.stringify(csv)}\nselected_var='horas_bienestar_jornada'\nselected_archetype='todos'\nonly_manual=False\n`;
 const executed=spawnSync('python3',['-c',prefix+source+'\nprint(json.dumps(result,ensure_ascii=False))'],{encoding:'utf8',timeout:10000});
 assert.equal(executed.status,0,executed.stderr);
 const result=JSON.parse(executed.stdout.trim().split('\n').at(-1));
 assert.equal(result.n,12);
 assert.equal(result.n_students,3);
 assert.ok(Math.abs(result.factors.horas_bienestar_jornada.r-1)<1e-8);
 assert.ok(Math.abs(result.factors.horas_bienestar_jornada.rho-1)<1e-8);
 assert.equal(result.n_rooms,2);
 assert.equal(result.n_simulated,0);
 assert.ok(Number.isFinite(result.r_within));
 // A second, real Python execution proves a negative correlation for the
 // observable 14-hour tradeoff; no grade values or coefficients are faked.
 const negativePrefix=prefix.replace("selected_var='horas_bienestar_jornada'",
  "selected_var='horas_estudio_jornada'\nselected_y='horas_bienestar_jornada'");
 const negative=spawnSync('python3',['-c',negativePrefix+source+'\nprint(json.dumps(result,ensure_ascii=False))'],
  {encoding:'utf8',timeout:10000});
 assert.equal(negative.status,0,negative.stderr);
 const actual=JSON.parse(negative.stdout.trim().split('\n').at(-1));
 assert.ok(actual.factors.sacrificio_estudio_bienestar.r<-.99,'study/wellbeing negative r');
 assert.ok(actual.linear.slope<0,'negative regression slope in observed tradeoffs');

});
