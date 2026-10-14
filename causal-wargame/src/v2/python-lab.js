const n=x=>Number(x||0)
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x))
const pga=x=>{const v=n(x);return v>10?v/100:v}
const grade=(r,i=0)=>{
  if(Number.isFinite(Number(r?.grade)))return Number(r.grade)
  if(Number.isFinite(Number(r?.nota_final)))return Number(r.nota_final)
  const base=20+4.2*pga(r?.tenure??r?.pga_previo)+.7*n(r?.usage??r?.horas_estudio)-.8*n(r?.bugs??r?.fatiga)+.25*n(r?.discount??r?.horas_sueno)
  return clamp(base+(n(r?.renewed??r?.aprobo)?5:-2)+((i*17)%7-3),0,50)
}

const safeStudents=rows=>(rows||[]).map((c,i)=>({
  id:String(c.id||''),
  estudiante:String(c.name||c.id||''),
  arquetipo:String(c.segment||''),
  horas_estudio:n(c.study_hours??c.usage),
  fatiga:n(c.fatigue??c.bugs),
  horas_sueno:n(c.sleep_hours??c.discount),
  pga_previo:pga(c.pga_prev??c.tenure),
  probabilidad_aprobar:n(c.score),
  tamano_grupo:n(c.cohort_size||100),
  nota_final:grade(c,i)
}))

const safeRows=rows=>(rows||[]).map((r,i)=>({
  pga_previo:pga(r.pga_prev??r.tenure),
  horas_estudio:n(r.study_hours??r.usage),
  horas_sueno:n(r.sleep_hours??r.sleep??6),
  fatiga:n(r.fatigue??r.risk??r.bugs),
  complejidad:n(r.complexity??r.risk??5),
  recibio_apoyo:Boolean(r.treated),
  aprobo:n(r.passed??r.renewed),
  nota_final:grade(r,i),
  arquetipo:String(r.segment||r.archetype||'General')
}))

const safeSegments=rows=>(rows||[]).map(s=>({
  id:String(s.id||''),
  arquetipo:String(s.name||s.id||''),
  estudiantes:n(s.audience),
  nivel_riesgo:String(s.risk||''),
  efecto_pp:n(s.effect_pp??s.effect),
  ci_low:n(s.ci_low),
  ci_high:n(s.ci_high)
}))

export function buildPythonLab(round,state={},analysis={},labKey=null){
  const tools=analysis?.team_tools||{}
  const profile=labKey||'prediction'

  if(profile==='prediction'){
    const context={
      perfiles:safeStudents(state.team_pool||state.packet||[]),
      entrenamiento:safeRows(tools.ml_training||[])
    }
    return{
      title:'Un predictor puede ser excelente y responder la pregunta equivocada',
      context,
      steps:[
        {
          id:'fit',
          label:'1 · Predecir',
          question:'¿Qué tan bien podemos predecir la nota final?',
          instruction:'Entrena un modelo predictivo y mira MAE y R². Todavía no hablamos de causalidad.',
          guidedCode:`import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score

df = pd.DataFrame(payload["entrenamiento"])
features = ["pga_previo","horas_estudio","horas_sueno","fatiga","complejidad"]

X_train,X_test,y_train,y_test = train_test_split(
    df[features],df["nota_final"],test_size=.30,random_state=42
)
m = RandomForestRegressor(n_estimators=120,min_samples_leaf=5,random_state=42)
m.fit(X_train,y_train)
pred = m.predict(X_test)

print("MAE — Error Absoluto Medio:", round(mean_absolute_error(y_test,pred),2),"puntos")
print("R² — coeficiente de determinación:", round(r2_score(y_test,pred),3))
print("\\nInterpretación:")
print("MAE dice cuántos puntos se equivoca el predictor, en promedio.")
print("R² mide capacidad predictiva. Ninguna de las dos métricas prueba causalidad.")`
        },
        {
          id:'rank',
          label:'2 · Priorizar',
          question:'¿Un estudiante con alta probabilidad de aprobar es quien más cambiará con apoyo?',
          instruction:'Ordena perfiles por probabilidad de aprobar y observa qué información falta.',
          guidedCode:`import pandas as pd

df = pd.DataFrame(payload["perfiles"]).copy()
df["prob_aprobar_pct"] = (100*df["probabilidad_aprobar"]).round(1)

print(df[["id","estudiante","arquetipo","prob_aprobar_pct"]]
      .sort_values("prob_aprobar_pct",ascending=False)
      .head(12).to_string(index=False))

print("\\nWOW:")
print("Esta tabla responde: ¿quién probablemente aprobará?")
print("NO responde: ¿quién aprobaría GRACIAS al apoyo?")
print("Para eso necesitamos imaginar dos futuros: con apoyo y sin apoyo.")`
        }
      ]
    }
  }

  if(profile==='ab-test'){
    const context={experimento:safeRows(tools.experiment_rows||[])}
    return{
      title:'A/B: mismo efecto verdadero, estimaciones distintas',
      context,
      steps:[
        {
          id:'ate',
          label:'1 · Comparar',
          question:'¿Cuánto cambió la nota en tratamiento vs. control?',
          instruction:'Como la asignación fue aleatoria, la diferencia de medias tiene interpretación causal bajo el diseño.',
          guidedCode:`import pandas as pd

df = pd.DataFrame(payload["experimento"])
medias = df.groupby("recibio_apoyo")["nota_final"].mean()
ate = medias.loc[True]-medias.loc[False]

print("Control — sin apoyo:", round(medias.loc[False],2))
print("Tratamiento — con apoyo:", round(medias.loc[True],2))
print("ATE — Average Treatment Effect / Efecto Promedio del Tratamiento:", round(ate,2),"puntos")
print("\\nATE significa: cuánto cambió la nota, EN PROMEDIO, por recibir la intervención.")`
        },
        {
          id:'uncertainty',
          label:'2 · Repetir',
          question:'¿Por qué distintos equipos pueden obtener efectos distintos?',
          instruction:'Repite el análisis en submuestras aleatorias. El mundo causal es el mismo; la muestra cambia.',
          guidedCode:`import pandas as pd
import numpy as np

df = pd.DataFrame(payload["experimento"])
rng = np.random.default_rng(42)

for k in range(1,6):
    sample = df.iloc[rng.choice(len(df),size=min(180,len(df)),replace=False)]
    m = sample.groupby("recibio_apoyo")["nota_final"].mean()
    print(f"Equipo virtual {k}: efecto observado = {m.loc[True]-m.loc[False]:.2f} puntos")

print("\\nWOW: estimar no es conocer exactamente. Hay azar muestral.")`
        },
        {
          id:'ci',
          label:'3 · Incertidumbre',
          question:'¿Cómo expresamos la incertidumbre del ATE?',
          instruction:'Calcula un intervalo de confianza aproximado para la diferencia de medias.',
          guidedCode:`import pandas as pd
import numpy as np

df = pd.DataFrame(payload["experimento"])
y1 = df.loc[df["recibio_apoyo"],"nota_final"].astype(float)
y0 = df.loc[~df["recibio_apoyo"],"nota_final"].astype(float)

ate = y1.mean()-y0.mean()
se = np.sqrt(y1.var(ddof=1)/len(y1)+y0.var(ddof=1)/len(y0))
lo,hi = ate-1.96*se,ate+1.96*se

print("ATE:", round(ate,2),"puntos")
print("IC 95% — Intervalo de Confianza 95%: [",round(lo,2),",",round(hi,2),"]")
print("\\nUn IC resume la incertidumbre de la estimación; no significa que todos cambien dentro de ese rango.")`
        }
      ]
    }
  }

  if(profile==='dag'){
    const context={historico:safeRows(tools.observational_rows||[]),dag:tools.dag||{}}
    return{
      title:'DAG Detective: controlar más no siempre es mejor',
      context,
      steps:[
        {
          id:'raw',
          label:'1 · Sospechar',
          question:'¿Qué dice la comparación cruda en datos observacionales?',
          instruction:'Compara primero apoyo vs. no apoyo sin ajustar. No la llames todavía “efecto”.',
          guidedCode:`import pandas as pd

df = pd.DataFrame(payload["historico"])
m = df.groupby("recibio_apoyo")["nota_final"].mean()

print("Sin apoyo:", round(m.loc[False],2))
print("Con apoyo:", round(m.loc[True],2))
print("Diferencia observada:", round(m.loc[True]-m.loc[False],2),"puntos")
print("\\nPregunta: ¿los dos grupos eran comparables ANTES de recibir apoyo?")`
        },
        {
          id:'confounder',
          label:'2 · Bloquear',
          question:'¿Qué cambia si comparamos estudiantes con historial previo parecido?',
          instruction:'Estratifica por PGA previo aproximado y vuelve a comparar.',
          guidedCode:`import pandas as pd

df = pd.DataFrame(payload["historico"]).copy()
df["pga_grupo"] = pd.cut(df["pga_previo"],bins=[0,3.0,3.5,4.0,5.0],labels=["<3.0","3.0–3.5","3.5–4.0",">=4.0"])

tabla = df.groupby(["pga_grupo","recibio_apoyo"],observed=True)["nota_final"].mean().unstack()
tabla["diferencia"] = tabla.get(True)-tabla.get(False)
print(tabla.round(2).to_string())

print("\\nConfusor: una causa previa relacionada con recibir apoyo y con la nota.")
print("DAG — Directed Acyclic Graph: mapa de hipótesis sobre qué causa qué.")`
        },
        {
          id:'bad-control',
          label:'3 · Evitar trampas',
          question:'¿Por qué no debemos controlar automáticamente variables posteriores?',
          instruction:'Construye dos variables posteriores para visualizar mediador y collider como trampas de ajuste.',
          guidedCode:`import pandas as pd
import numpy as np

df = pd.DataFrame(payload["historico"]).copy()
df["horas_estudio_post"] = df["horas_estudio"] + 1.8*df["recibio_apoyo"].astype(int)
df["tutorias_post"] = ((df["recibio_apoyo"].astype(int) + (df["complejidad"]>=3).astype(int))>=1).astype(int)

print("APOYO → horas_estudio_post → nota")
print("horas_estudio_post es MEDIADOR: parte del mecanismo por el que funciona el apoyo.")
print("\\nAPOYO → tutorias_post ← complejidad")
print("tutorias_post puede actuar como COLLIDER: condicionarlo puede abrir una asociación artificial.")
print("\\nWOW: más columnas no garantizan menos sesgo causal.")`
        }
      ]
    }
  }

  if(profile==='dml'){
    const context={historico:safeRows(tools.observational_rows||[])}
    return{
      title:'Double Machine Learning construido paso a paso',
      context,
      steps:[
        {
          id:'nuisance',
          label:'1 · Explicar T y Y',
          question:'¿Qué parte del tratamiento y de la nota puede explicar X?',
          instruction:'Entrena dos modelos auxiliares: uno para T y otro para Y.',
          guidedCode:`import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import cross_val_predict, KFold

df = pd.DataFrame(payload["historico"]).copy()
X = df[["pga_previo","horas_estudio","horas_sueno","fatiga","complejidad"]]
T = df["recibio_apoyo"].astype(float)
Y = df["nota_final"].astype(float)

cv = KFold(n_splits=5,shuffle=True,random_state=42)
mt = RandomForestRegressor(n_estimators=120,min_samples_leaf=12,random_state=42)
my = RandomForestRegressor(n_estimators=120,min_samples_leaf=12,random_state=7)

t_hat = np.clip(cross_val_predict(mt,X,T,cv=cv),.02,.98)
y_hat = cross_val_predict(my,X,Y,cv=cv)

print("Modelo auxiliar T: estima quién tendería a recibir apoyo según X.")
print("Modelo auxiliar Y: estima qué nota esperaríamos según X.")
print("Nuisance models = modelos auxiliares; NO son el efecto causal final.")`
        },
        {
          id:'residuals',
          label:'2 · Residualizar',
          question:'¿Qué queda después de quitar la parte explicada por X?',
          instruction:'Calcula tratamiento residual y resultado residual.',
          guidedCode:`import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import cross_val_predict, KFold

df = pd.DataFrame(payload["historico"]).copy()
X = df[["pga_previo","horas_estudio","horas_sueno","fatiga","complejidad"]]
T = df["recibio_apoyo"].astype(float)
Y = df["nota_final"].astype(float)
cv = KFold(n_splits=5,shuffle=True,random_state=42)

t_hat = np.clip(cross_val_predict(RandomForestRegressor(n_estimators=120,min_samples_leaf=12,random_state=42),X,T,cv=cv),.02,.98)
y_hat = cross_val_predict(RandomForestRegressor(n_estimators=120,min_samples_leaf=12,random_state=7),X,Y,cv=cv)

t_res = T-t_hat
y_res = Y-y_hat

print("T residual = tratamiento observado - tratamiento esperado")
print("Y residual = nota observada - nota esperada")
print("Correlación entre residuos:", round(np.corrcoef(t_res,y_res)[0,1],3))`
        },
        {
          id:'effect',
          label:'3 · Estimar',
          question:'¿Qué efecto queda al relacionar los residuos?',
          instruction:'Estima una pendiente residual y compárala con la diferencia cruda.',
          guidedCode:`import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import cross_val_predict, KFold

df = pd.DataFrame(payload["historico"]).copy()
X = df[["pga_previo","horas_estudio","horas_sueno","fatiga","complejidad"]]
T = df["recibio_apoyo"].astype(float)
Y = df["nota_final"].astype(float)
cv = KFold(n_splits=5,shuffle=True,random_state=42)

t_hat = np.clip(cross_val_predict(RandomForestRegressor(n_estimators=160,min_samples_leaf=12,random_state=42),X,T,cv=cv),.02,.98)
y_hat = cross_val_predict(RandomForestRegressor(n_estimators=160,min_samples_leaf=12,random_state=7),X,Y,cv=cv)
t_res,y_res = T-t_hat,Y-y_hat

theta = float((t_res*y_res).sum()/(t_res*t_res).sum())
crudo = Y[T==1].mean()-Y[T==0].mean()

print("Diferencia cruda:", round(crudo,2),"puntos")
print("DML — Double Machine Learning:", round(theta,2),"puntos")
print("\\nDML = Double Machine Learning / Aprendizaje Automático Doble.")
print("Usa ML para ajustar T y Y; luego estima el efecto en la variación residual.")
print("WOW: buen R² predictivo no garantiza una buena estimación causal.")`
        }
      ]
    }
  }

  if(profile==='heterogeneity'){
    const context={experimento:safeRows(tools.experiment_rows||[]),segmentos:safeSegments(tools.segments||[])}
    return{
      title:'ATE no es CATE: el promedio puede esconder a quién ayudar',
      context,
      steps:[
        {
          id:'ate',
          label:'1 · Promedio',
          question:'¿Cuál es el efecto promedio del apoyo?',
          instruction:'Calcula primero ATE como diferencia de medias del experimento.',
          guidedCode:`import pandas as pd

df = pd.DataFrame(payload["experimento"])
m = df.groupby("recibio_apoyo")["nota_final"].mean()
ate = m.loc[True]-m.loc[False]

print("ATE — Average Treatment Effect / Efecto Promedio del Tratamiento:", round(ate,2),"puntos")
print("ATE responde: ¿funciona EN PROMEDIO?")`
        },
        {
          id:'cate',
          label:'2 · Perfiles',
          question:'¿El mismo efecto aparece en todos los arquetipos?',
          instruction:'Calcula diferencias dentro de cada arquetipo.',
          guidedCode:`import pandas as pd

df = pd.DataFrame(payload["experimento"])
tabla = df.groupby(["arquetipo","recibio_apoyo"])["nota_final"].mean().unstack()
tabla["efecto"] = tabla[True]-tabla[False]

print(tabla.sort_values("efecto",ascending=False).round(2).to_string())
print("\\nCATE — Conditional Average Treatment Effect:")
print("efecto promedio para personas con determinadas características.")
print("ATE pregunta ¿funciona?; CATE pregunta ¿para quién funciona?")`
        },
        {
          id:'tlearner',
          label:'3 · T-Learner',
          question:'¿Podemos estimar efectos individuales con dos modelos?',
          instruction:'Entrena un modelo en tratados y otro en controles; resta sus predicciones.',
          guidedCode:`import pandas as pd
from sklearn.ensemble import RandomForestRegressor

df = pd.DataFrame(payload["experimento"])
X = pd.get_dummies(df[["arquetipo","pga_previo","horas_estudio","fatiga","complejidad"]],columns=["arquetipo"],drop_first=False)
T = df["recibio_apoyo"]
Y = df["nota_final"]

m1 = RandomForestRegressor(n_estimators=150,min_samples_leaf=15,random_state=1).fit(X[T],Y[T])
m0 = RandomForestRegressor(n_estimators=150,min_samples_leaf=15,random_state=2).fit(X[~T],Y[~T])

df["cate_tlearner"] = m1.predict(X)-m0.predict(X)
print(df.groupby("arquetipo")["cate_tlearner"].mean().sort_values(ascending=False).round(2).to_string())
print("\\nT-Learner — Two Learners / Dos aprendices:")
print("un modelo aprende el futuro tratado y otro el futuro control.")`
        }
      ]
    }
  }

  if(profile==='model-battle'){
    const context={
      experimento:safeRows(tools.experiment_rows||[]),
      comparador:tools.econml||[]
    }
    return{
      title:'Boss final: comparar estimadores sin olvidar identificación',
      context,
      steps:[
        {
          id:'s-vs-t',
          label:'1 · S vs T',
          question:'¿Cómo cambian las estimaciones con dos estrategias de meta-learning?',
          instruction:'Compara S-Learner y T-Learner usando el mismo Random Forest base.',
          guidedCode:`import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor

df = pd.DataFrame(payload["experimento"])
base = pd.get_dummies(df[["arquetipo","pga_previo","horas_estudio","fatiga","complejidad"]],columns=["arquetipo"],drop_first=False)
T = df["recibio_apoyo"].astype(int)
Y = df["nota_final"]

# S-Learner: un solo modelo incluye tratamiento
Xs = base.copy(); Xs["tratamiento"] = T
s = RandomForestRegressor(n_estimators=140,min_samples_leaf=15,random_state=10).fit(Xs,Y)
x1=base.copy();x1["tratamiento"]=1
x0=base.copy();x0["tratamiento"]=0
tau_s=s.predict(x1)-s.predict(x0)

# T-Learner: dos modelos
m1=RandomForestRegressor(n_estimators=140,min_samples_leaf=15,random_state=11).fit(base[T==1],Y[T==1])
m0=RandomForestRegressor(n_estimators=140,min_samples_leaf=15,random_state=12).fit(base[T==0],Y[T==0])
tau_t=m1.predict(base)-m0.predict(base)

print("S-Learner — Single Learner: un modelo para ambos futuros.")
print("T-Learner — Two Learners: un modelo tratado y otro control.")
print("\\nEfecto medio S:",round(float(np.mean(tau_s)),2))
print("Efecto medio T:",round(float(np.mean(tau_t)),2))`
        },
        {
          id:'dr',
          label:'2 · DR-Learner',
          question:'¿Qué significa “doblemente robusto” en términos prácticos?',
          instruction:'Construye un pseudo-outcome DR simplificado y aprende heterogeneidad sobre él.',
          guidedCode:`import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LogisticRegression

df = pd.DataFrame(payload["experimento"])
X = pd.get_dummies(df[["arquetipo","pga_previo","horas_estudio","fatiga","complejidad"]],columns=["arquetipo"],drop_first=False)
T = df["recibio_apoyo"].astype(int).to_numpy()
Y = df["nota_final"].to_numpy()

ps = np.clip(LogisticRegression(max_iter=1000).fit(X,T).predict_proba(X)[:,1],.05,.95)
mu1 = RandomForestRegressor(n_estimators=120,min_samples_leaf=15,random_state=1).fit(X[T==1],Y[T==1]).predict(X)
mu0 = RandomForestRegressor(n_estimators=120,min_samples_leaf=15,random_state=2).fit(X[T==0],Y[T==0]).predict(X)

pseudo = (mu1-mu0) + T*(Y-mu1)/ps - (1-T)*(Y-mu0)/(1-ps)
dr = RandomForestRegressor(n_estimators=120,min_samples_leaf=20,random_state=3).fit(X,pseudo)
tau_dr = dr.predict(X)

print("DR-Learner — Doubly Robust Learner / Aprendiz doblemente robusto.")
print("Efecto medio DR:",round(float(np.mean(tau_dr)),2))
print("La robustez depende de supuestos; no vuelve causal una mala estrategia de identificación.")`
        },
        {
          id:'econml',
          label:'3 · EconML / Causal Forest',
          question:'¿Un estimador más sofisticado gana automáticamente?',
          instruction:'Compara tus estimaciones con resultados de referencia precomputados con estimadores causales especializados.',
          guidedCode:`import pandas as pd

rows = pd.DataFrame(payload["comparador"])
if rows.empty:
    print("No hay comparador precomputado disponible.")
else:
    cols=[c for c in ["name","t_learner","dr_learner","causal_forest"] if c in rows.columns]
    print(rows[cols].to_string(index=False))

print("\\nEconML — Econometric Machine Learning:")
print("librería de Microsoft con estimadores causales basados en ML.")
print("Causal Forest — Bosque causal: árboles diseñados para aprender heterogeneidad del efecto.")
print("\\nIMPORTANTE: EconML no se ejecuta dentro de este navegador porque sus dependencias no son fiables en Pyodide.")
print("Aquí ejecutaste S/T/DR con scikit-learn y comparas contra resultados EconML precomputados.")
print("WOW final: ningún estimador arregla una identificación causal incorrecta.")`
        }
      ]
    }
  }

  return null
}
