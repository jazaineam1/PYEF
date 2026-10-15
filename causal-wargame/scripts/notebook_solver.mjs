// Utilidades del cuaderno con huecos de la Copa del Decano.
// Los huecos son líneas «variable = None  # ⟵ HUECO <id>…». Las soluciones viven FUERA de public/
// (docs/facilitator/notebook_solutions.json) para que el cuaderno publicado no las entregue.
//
// Uso docente:  node scripts/notebook_solver.mjs cuaderno_resuelto.ipynb
import {readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

export const NOTEBOOK_PATH='public/notebooks/causalidad_copa_decano_scaffold.ipynb';
export const SOLUTIONS_PATH='docs/facilitator/notebook_solutions.json';
const BLANK=/^(\s*[A-Za-z_]\w*\s*=\s*)None(\s*#\s*⟵ HUECO ([a-z]\d+)\b.*)$/;

const lineOf=(source)=>(Array.isArray(source)?source.join(''):String(source)).split('\n');

export function loadNotebook(path=NOTEBOOK_PATH){return JSON.parse(readFileSync(path,'utf8'))}
export function loadSolutions(path=SOLUTIONS_PATH){return JSON.parse(readFileSync(path,'utf8'))}

// Lista cada hueco con su celda y su línea.
export function findBlanks(nb){
 const blanks=[];
 nb.cells.forEach((cell,cellIndex)=>{
  if(cell.cell_type!=='code')return;
  lineOf(cell.source).forEach((text,line)=>{const m=BLANK.exec(text);if(m)blanks.push({id:m[3],cellIndex,line,text})});
 });
 return blanks;
}

// Devuelve una copia con los huecos rellenos. `solutions` puede omitir ids (quedan en None).
export function solveNotebook(nb,solutions){
 const copy=JSON.parse(JSON.stringify(nb));
 for(const cell of copy.cells){
  if(cell.cell_type!=='code')continue;
  const lines=lineOf(cell.source).map(text=>{
   const m=BLANK.exec(text);
   return m&&Object.hasOwn(solutions,m[3])?m[1]+solutions[m[3]]+m[2]:text;
  });
  cell.source=lines.map((l,i)=>i<lines.length-1?l+'\n':l);
 }
 return copy;
}

// Concatena las celdas de código para ejecutarlas con `python` (los marcadores facilitan leer trazas).
export function notebookScript(nb){
 return nb.cells.map((cell,i)=>cell.cell_type==='code'?'# %% celda '+i+'\n'+lineOf(cell.source).join('\n'):'').filter(Boolean).join('\n\n')+'\n';
}

if(process.argv[1]===fileURLToPath(import.meta.url)){
 const out=process.argv[2];
 if(!out){console.error('Uso: node scripts/notebook_solver.mjs <salida.ipynb>');process.exit(2)}
 writeFileSync(out,JSON.stringify(solveNotebook(loadNotebook(),loadSolutions()),null,1)+'\n','utf8');
 console.log('Cuaderno resuelto escrito en',out,'(solo para docentes; no lo publiques).');
}
