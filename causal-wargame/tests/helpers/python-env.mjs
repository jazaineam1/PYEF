// Descubre un intérprete de Python 3 para las pruebas del laboratorio científico.
// Orden: CW_PYTHON (para desarrollo local), python3, python, py. La ejecución numérica exige
// numpy, pandas, scipy, scikit-learn y matplotlib; sin ellos esas pruebas se omiten con un aviso
// claro y las pruebas estructurales (sintaxis, contratos, huecos) siguen ejecutándose.
import {spawnSync} from 'node:child_process';

const CANDIDATES=[process.env.CW_PYTHON,'python3','python','py'].filter(Boolean);
const probe=(cmd,code)=>spawnSync(cmd,['-I','-c',code],{encoding:'utf8',timeout:60000});
let cached;

export function findPython(){
 if(cached!==undefined)return cached;
 let syntaxOnly=null;
 for(const cmd of CANDIDATES){
  const base=probe(cmd,'import sys; assert sys.version_info[0]==3');
  if(base.status!==0)continue;
  syntaxOnly??=cmd;
  const stack=probe(cmd,'import numpy, pandas, scipy, sklearn, matplotlib');
  if(stack.status===0){cached={cmd,stack:true};return cached}
 }
 cached={cmd:syntaxOnly,stack:false};
 return cached;
}

// Ejecuta código Python con la pila científica; env.MPLBACKEND=Agg evita ventanas.
export function runPython(cmd,args,options={}){
 return spawnSync(cmd,args,{encoding:'utf8',timeout:240000,maxBuffer:32*1024*1024,
  ...options,env:{...process.env,MPLBACKEND:'Agg',PYTHONIOENCODING:'utf-8',PYTHONWARNINGS:'ignore',...(options.env||{})}});
}
