import React,{useEffect,useRef,useState} from 'react';
import './dean-science.css';

const PYTHON_PROGRAMS={
 rector:`
import numpy as np, pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import GroupShuffleSplit, train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
d=pd.DataFrame(payload["rows"])
for c in ["pga_previo","complejidad","horas_bienestar_sem","nota_final"]:
    if c in d: d[c]=pd.to_numeric(d[c],errors="coerce")
n=d["estudiante_id"].nunique() if "estudiante_id" in d else 0
if n>=4 and len(d)>=20:
    d=d.dropna(subset=["pga_previo","complejidad","horas_bienestar_sem","nota_final"])
    splitter=GroupShuffleSplit(n_splits=1,test_size=.33,random_state=19)
    a,b=next(splitter.split(d,groups=d.estudiante_id))
    origin="OBSERVACIONES DE TU SALA. Split por estudiante (sin fuga entre exámenes)."
else:
    rng=np.random.default_rng(20261015)
    n=420
    pga=rng.uniform(2,4.9,n)
    complexity=rng.uniform(1,8,n)
    well=rng.uniform(0,5,n)
    d=pd.DataFrame({"pga_previo":pga,"complejidad":complexity,"horas_bienestar_sem":well,
     "nota_final":np.clip(9*pga-1.8*complexity+.2*well+rng.normal(0,2.5,n),0,50)})
    a,b=train_test_split(np.arange(n),test_size=.3,random_state=19)
    origin="REFERENCIA DIDÁCTICA INDEPENDIENTE, NO datos reales ni el DGP exacto de la Copa."
X=d[["pga_previo","complejidad","horas_bienestar_sem"]].to_numpy()
y=d.nota_final.to_numpy()
forest=RandomForestRegressor(n_estimators=45,min_samples_leaf=3,random_state=13,n_jobs=1)
forest.fit(X[a],y[a])
pred=forest.predict(X[b])
print(origin)
print("Muestra:",len(d),"registros; prueba:",len(b))
print("MAE de prueba:",round(mean_absolute_error(y[b],pred),2),"puntos")
print("R² de prueba:",round(r2_score(y[b],pred),3))
print("PREDICCIÓN: nota prevista. No hay T aleatorizado; NO es efecto causal.")
`,
 survey:`
import numpy as np,pandas as pd
d=pd.DataFrame(payload["rows"])
for c in ["pga_previo","complejidad","horas_bienestar_sem","horas_estudio","horas_sueno","nota_final"]:
    d[c]=pd.to_numeric(d[c],errors="coerce")
d=d.dropna(subset=["pga_previo","complejidad","horas_bienestar_sem","horas_estudio","horas_sueno","nota_final"])
print("Datos de tu sala:",len(d),"exámenes; estudiantes:",d.estudiante_id.nunique())
if len(d)>4 and d.horas_bienestar_sem.std()>0:
    def slope(features):
        x=np.column_stack([np.ones(len(d)),d[features].to_numpy()])
        return np.linalg.lstsq(x,d.nota_final.to_numpy(),rcond=None)[0][1]
    raw=slope(["horas_bienestar_sem"])
    pre=slope(["horas_bienestar_sem","pga_previo","complejidad"])
    post=slope(["horas_bienestar_sem","pga_previo","complejidad","horas_estudio","horas_sueno"])
    print("Asociación cruda B→nota:",round(raw,2))
    print("Asociación con antecedentes:",round(pre,2))
    print("Asociación con mediadores posteriores:",round(post,2))
    print("Tres COEFICIENTES OBSERVACIONALES. Ninguno identifica por sí solo do(B).")
else:
    print("Variación insuficiente para ajustar en tu sala. No se inventan estimaciones.")
print("REGLA DAG: no ajustes automáticamente mediadores si buscas el efecto TOTAL.")
`,
 ab:`
import numpy as np,pandas as pd
from sklearn.model_selection import KFold
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
d=pd.DataFrame(payload["rows"])
for c in ["tratamiento","nota_final","pga_previo","complejidad"]:
    d[c]=pd.to_numeric(d[c],errors="coerce")
p=d.groupby("estudiante_id",as_index=False).agg(
 tratamiento=("tratamiento","first"),nota=("nota_final","mean"),
 pga=("pga_previo","first"),complejidad=("complejidad","mean"),arquetipo=("arquetipo","first"))
t=p.tratamiento.to_numpy().astype(int)
y=p.nota.to_numpy().astype(float)
treated=y[t==1];control=y[t==0]
print("EXPERIMENTO DEL MISMO DGP DE LA COPA: 30 estudiantes sintéticos × 15 exámenes")
print("T se sorteó por estudiante; la nota es su promedio de 15 exámenes.")
print("Tratamiento B=4 h:",len(treated),"personas; control B=0 h:",len(control),"personas")
if len(treated)<2 or len(control)<2: raise ValueError("Un brazo tiene menos de dos estudiantes.")
ate=treated.mean()-control.mean()
se=np.sqrt(treated.var(ddof=1)/len(treated)+control.var(ddof=1)/len(control))
print("ATE observado:",round(ate,2),"puntos")
print("IC 95% aproximado entre ESTUDIANTES:",round(ate-1.96*se,2),round(ate+1.96*se,2))
print("No se trataron 450 exámenes como 450 observaciones independientes.")
print("— DML: demostración de residualización con cross-fitting —")
X=p[["pga","complejidad"]].to_numpy()
rt=np.zeros(len(p));ry=np.zeros(len(p))
for a,b in KFold(n_splits=3,shuffle=True,random_state=42).split(X):
    mt=RandomForestClassifier(n_estimators=40,min_samples_leaf=3,random_state=15,n_jobs=1)
    my=RandomForestRegressor(n_estimators=40,min_samples_leaf=3,random_state=16,n_jobs=1)
    mt.fit(X[a],t[a]);my.fit(X[a],y[a])
    rt[b]=t[b]-mt.predict_proba(X[b])[:,list(mt.classes_).index(1)]
    ry[b]=y[b]-my.predict(X[b])
coef=float(np.dot(rt,ry)/np.dot(rt,rt))
print("T residual = T observado − modelo T(X) fuera de muestra")
print("Y residual = Y observado − modelo Y(X) fuera de muestra")
print("Coeficiente residualizado:",round(coef,2),"puntos")
print("En un A/B el azar identifica la comparación; DML aquí es ilustración, NO prueba confusión eliminada.")
print("— HETEROGENEIDAD: diferencias descriptivas por arquetipo —")
for profile,g in p.groupby("arquetipo"):
    tt=g[g.tratamiento==1].nota;cc=g[g.tratamiento==0].nota
    if len(tt)>=2 and len(cc)>=2:
        print(profile,":",round(tt.mean()-cc.mean(),2),"(n=",len(tt),"+",len(cc),")")
    else: print(profile,": muestra pequeña; NO estimable con estabilidad")
print("Las diferencias observadas no son efectos individuales verdaderos.")
print("POLÍTICA: comparar beneficios esperados, incertidumbre, cupos y equidad.")
`
};
export const SCIENCE_STEPS={
 rector:{title:'Predicción real: qué puede y qué NO puede concluir el Rector',
  origin:'Se usa el CSV de tu sala si hay suficientes estudiantes distintos; con muestras pequeñas se ejecuta una referencia didáctica independiente y rotulada.'},
 survey:{title:'Tres asociaciones: ¿controlar por todo cambia la pregunta?',
  origin:'Cálculos observacionales únicamente con el Rector y la encuesta de tu propia sala. Ningún coeficiente se etiqueta como causal.'},
 ab:{title:'Python científico: A/B, incertidumbre, DML y heterogeneidad',
  origin:'Datos observados de 30 personas SINTÉTICAS del DGP canónico, asignadas por estudiante; no son participantes del curso.'}
};

export default function DeanSciencePython({mode='rector',rows=[]}) {
 const [status,setStatus]=useState('idle'),[output,setOutput]=useState(''),[error,setError]=useState('');
 const worker=useRef(null),timer=useRef(null),active=useRef(0);
 useEffect(()=>{setStatus('idle');setOutput('');setError('');active.current++;
  clearTimeout(timer.current);worker.current?.terminate();worker.current=null;
  return()=>{active.current++;clearTimeout(timer.current);worker.current?.terminate();worker.current=null}
 },[mode,rows]);
 const cfg=SCIENCE_STEPS[mode];
 if(!cfg||!rows.length)return null;
 function execute(){
  setError('');setOutput('');setStatus('loading');
  clearTimeout(timer.current);worker.current?.terminate();
  const id=++active.current;
  const w=new Worker(new URL('./pyodide.worker.js',import.meta.url));
  worker.current=w;
  timer.current=setTimeout(()=>{if(id===active.current){w.terminate();worker.current=null;
   setStatus('failed');setError('Python tardó demasiado. Puedes continuar con la explicación del docente sin puntos falsos.')}
  },90000);
  w.onmessage=e=>{if(id!==active.current)return;const m=e.data||{};
   if(m.type==='ready'){
    setStatus('running');w.postMessage({type:'run',requestId:'dean-science-'+id,context:{rows},code:PYTHON_PROGRAMS[mode]});
   }else if(m.type==='result'||m.type==='error'||m.type==='execution_error'){
    clearTimeout(timer.current);
    if(m.type==='result'){setStatus('done');setOutput(m.output||'Ejecución sin salida');}
    else{setStatus('failed');setError(m.error||'Error en la ejecución Python.');}
    w.terminate();worker.current=null;
   }
  };
  w.onerror=e=>{if(id===active.current){clearTimeout(timer.current);setStatus('failed');setError(e.message||'Error del motor Python');w.terminate();worker.current=null}};
  w.postMessage({type:'init'});
 }
 return <details className="dean-science" aria-label="Laboratorio científico real de la Copa">
  <summary>🐍 {cfg.title} <span>{status==='done'?'✓ EJECUTADO':'ABRIR LABORATORIO'}</span></summary>
  <div className="dean-science-body"><p>{cfg.origin}</p>
   {mode==='ab'&&<div className="dean-science-dml" aria-label="Cómo funciona DML">
    <div><b>① X → T</b><small>Modelo auxiliar del tratamiento</small></div>
    <div><b>② X → Y</b><small>Modelo auxiliar del resultado</small></div>
    <div><b>③ Residuos</b><small>T−T esperado · Y−Y esperado</small></div>
    <div><b>④ Efecto</b><small>Relacionar residuos fuera de muestra</small></div>
   </div>}
   <button type="button" onClick={execute} disabled={status==='loading'||status==='running'}>
    {status==='loading'?'Preparando Pyodide…':status==='running'?'Ejecutando cálculos…':status==='done'?'↻ Repetir Python real':'▶ Ejecutar Python real'}
   </button>
   {output&&<pre role="status" className="dean-science-output">{output}</pre>}
   {error&&<p role="alert" className="dean-science-error">{error}</p>}
   <small>Python 3 en Pyodide, scikit-learn y pandas ejecutados en tu dispositivo. El código no entrena EconML; ninguna salida se presenta como un efecto individual observado.</small>
  </div>
 </details>;
}
