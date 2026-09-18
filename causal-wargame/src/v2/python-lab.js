const n=x=>Number(x||0)

const safeCustomers=rows=>(rows||[]).map(c=>({
  id:String(c.id||''),
  cohorte:String(c.name||c.id||''),
  segmento:String(c.segment||''),
  uso:n(c.usage),
  incidentes:n(c.bugs),
  descuento:n(c.discount),
  antiguedad:n(c.tenure),
  prob_modelo_actual:n(c.score),
  tamano_cohorte:n(c.cohort_size||1000)
}))

const safeObs=rows=>(rows||[]).map(r=>({
  riesgo:n(r.risk),
  uso:n(r.usage),
  antiguedad:n(r.tenure),
  tratado:Boolean(r.treated),
  renovo:n(r.renewed)
}))

const safeExp=rows=>(rows||[]).map(r=>({
  segmento:String(r.segment||''),
  uso:n(r.usage),
  antiguedad:n(r.tenure),
  tratado:Boolean(r.treated),
  renovo:n(r.renewed)
}))

const safeSegments=rows=>(rows||[]).map(s=>({
  id:String(s.id||''),
  segmento:String(s.name||s.id||''),
  audiencia:n(s.audience),
  riesgo:String(s.risk||''),
  valor_renovacion_cop:n(s.value_per_result??s.value),
  costo_intervencion_cop:n(s.unit_cost??s.cost)
}))

export function buildPythonLab(round,state={},analysis={}){
  const tools=analysis?.team_tools||{}
  if(round===1){
    const context={
      entrenamiento:(tools.ml_training||[]).map(r=>({
        uso:n(r.usage),incidentes:n(r.bugs),descuento:n(r.discount),antiguedad:n(r.tenure),renovo:n(r.renewed)
      })),
      cohortes:safeCustomers(state.team_pool||[])
    }
    return{
      title:'Modela primero la predicción',
      context,
      steps:[
        {
          id:'predictive-fit',
          label:'1 · Entrenar',
          question:'¿Qué tan bien predice renovación un modelo que sólo intenta anticipar Y?',
          instruction:'Entrena una regresión logística y evalúa AUC. Esto es ML predictivo, todavía no causal.',
          code:`import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score

df = pd.DataFrame(payload["entrenamiento"])
X = df[["uso","incidentes","descuento","antiguedad"]]
y = df["renovo"]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.30, random_state=42, stratify=y
)

modelo = LogisticRegression(max_iter=1000)
modelo.fit(X_train, y_train)
p = modelo.predict_proba(X_test)[:,1]

print("AUC predictivo:", round(roc_auc_score(y_test, p), 3))
print("\nCoeficientes:")
print(pd.Series(modelo.coef_[0], index=X.columns).round(3).to_string())
print("\nEsto evalúa predicción de renovación, no efecto de intervenir.")`
        },
        {
          id:'predictive-rank',
          label:'2 · Rankear',
          question:'Si el modelo predice bien, ¿a quién pondría arriba del ranking?',
          instruction:'Ajusta el modelo con todo el histórico y predice las 24 cohortes disponibles.',
          code:`import pandas as pd
from sklearn.linear_model import LogisticRegression

train = pd.DataFrame(payload["entrenamiento"])
cohortes = pd.DataFrame(payload["cohortes"])

features = ["uso","incidentes","descuento","antiguedad"]
modelo = LogisticRegression(max_iter=1000).fit(train[features], train["renovo"])
cohortes["p_predicha"] = modelo.predict_proba(cohortes[features])[:,1]

salida = cohortes[["id","cohorte","segmento","p_predicha"]].copy()
salida["p_predicha"] = (100*salida["p_predicha"]).round(1)
print(salida.sort_values("p_predicha",ascending=False).head(12).to_string(index=False))

print("\nPregunta:")
print("¿Qué variable de esta tabla dice cuánto CAMBIARÍA la renovación por intervenir?")`
        },
        {
          id:'predictive-visual',
          label:'3 · Diagnosticar',
          question:'¿Probabilidad alta significa impacto alto?',
          instruction:'Visualiza la probabilidad predictiva. Nota qué información todavía no existe en este dataset.',
          code:`import pandas as pd
import matplotlib.pyplot as plt
from sklearn.linear_model import LogisticRegression

train = pd.DataFrame(payload["entrenamiento"])
cohortes = pd.DataFrame(payload["cohortes"])
features = ["uso","incidentes","descuento","antiguedad"]
m = LogisticRegression(max_iter=1000).fit(train[features],train["renovo"])
cohortes["p"] = m.predict_proba(cohortes[features])[:,1]

cohortes = cohortes.sort_values("p")
plt.figure(figsize=(8,4))
plt.bar(cohortes["id"], cohortes["p"]*100)
plt.ylabel("Probabilidad estimada de renovación (%)")
plt.xlabel("Cohorte")
plt.xticks(rotation=60)
plt.tight_layout()

print("El modelo produce P(Y|X).")
print("No observamos todavía Y(1)-Y(0), por lo que no podemos rankear efecto causal.")`
        }
      ]
    }
  }

  if(round===2){
    const context={observacional:safeObs(tools.observational_rows||[])}
    return{
      title:'Reconstruye la comparación causal',
      context,
      steps:[
        {
          id:'crude',
          label:'1 · Crudo',
          question:'¿Qué concluye una comparación directa entre tratados y no tratados?',
          instruction:'Calcula la diferencia observada y revisa quién recibió tratamiento.',
          code:`import pandas as pd

df = pd.DataFrame(payload["observacional"])
df["tratado"] = df["tratado"].astype(bool)

tasas = df.groupby("tratado")["renovo"].mean()
print("Renovación control :", round(100*tasas.loc[False],1), "%")
print("Renovación tratados:", round(100*tasas.loc[True],1), "%")
print("Diferencia cruda    :", round(100*(tasas.loc[True]-tasas.loc[False]),1), "pp")

print("\nTratamiento por riesgo:")
print((100*df.groupby("riesgo")["tratado"].mean()).round(1).to_string())
print("\nAntes de llamarlo efecto, pregunta por qué cambió tanto la probabilidad de tratamiento según riesgo.")`
        },
        {
          id:'propensity-ipw',
          label:'2 · Ajustar',
          question:'¿Qué ocurre cuando modelamos la asignación y reponderamos observaciones comparables?',
          instruction:'Estima propensity score con regresión logística y un ATE por IPW estabilizado.',
          code:`import pandas as pd
import numpy as np
from sklearn.linear_model import LogisticRegression

df = pd.DataFrame(payload["observacional"])
X = df[["riesgo","uso","antiguedad"]]
T = df["tratado"].astype(int)
Y = df["renovo"].astype(float)

ps_model = LogisticRegression(max_iter=1000).fit(X,T)
ps = np.clip(ps_model.predict_proba(X)[:,1],0.03,0.97)
df["propensity"] = ps

p_t = T.mean()
w1 = T * p_t / ps
w0 = (1-T) * (1-p_t) / (1-ps)

mu1 = (w1*Y).sum()/w1.sum()
mu0 = (w0*Y).sum()/w0.sum()
ate_ipw = mu1-mu0

crudo = Y[T==1].mean()-Y[T==0].mean()
print("Diferencia cruda:", round(100*crudo,1), "pp")
print("ATE IPW         :", round(100*ate_ipw,1), "pp")
print("Propensity min/max:", round(ps.min(),3), "/", round(ps.max(),3))
print("\nEl ajuste cambia la comparación; no convierte automáticamente los supuestos en hechos.")`
        },
        {
          id:'overlap',
          label:'3 · Overlap',
          question:'¿Hay soporte común suficiente para construir contrafactuales?',
          instruction:'Grafica propensity scores de tratados y controles y revisa las zonas con poca superposición.',
          code:`import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from sklearn.linear_model import LogisticRegression

df = pd.DataFrame(payload["observacional"])
X = df[["riesgo","uso","antiguedad"]]
T = df["tratado"].astype(int)
m = LogisticRegression(max_iter=1000).fit(X,T)
df["ps"] = np.clip(m.predict_proba(X)[:,1],0.01,0.99)

plt.figure(figsize=(7,4))
plt.hist(df.loc[T==0,"ps"],bins=18,alpha=.65,label="Control")
plt.hist(df.loc[T==1,"ps"],bins=18,alpha=.65,label="Tratados")
plt.xlabel("Propensity score")
plt.ylabel("Observaciones")
plt.legend()
plt.tight_layout()

print("Soporte control :", round(df.loc[T==0,"ps"].min(),2), "-", round(df.loc[T==0,"ps"].max(),2))
print("Soporte tratados:", round(df.loc[T==1,"ps"].min(),2), "-", round(df.loc[T==1,"ps"].max(),2))
print("\nDonde casi sólo existe un grupo, la estimación depende más de extrapolación.")`
        }
      ]
    }
  }

  if(round===3){
    const context={
      experimento:safeExp(tools.experiment_rows||[]),
      segmentos:safeSegments(tools.segments||[]),
      economia:tools.economy||state.economy||{}
    }
    return{
      title:'Del experimento a una política',
      context,
      steps:[
        {
          id:'ate-ci',
          label:'1 · ATE',
          question:'¿Cuál es el efecto promedio del experimento y cuánta incertidumbre tiene?',
          instruction:'Estima diferencia de medias e intervalo de confianza del experimento aleatorizado.',
          code:`import pandas as pd
import numpy as np
from scipy import stats

df = pd.DataFrame(payload["experimento"])
y1 = df.loc[df["tratado"],"renovo"].astype(float)
y0 = df.loc[~df["tratado"],"renovo"].astype(float)

ate = y1.mean()-y0.mean()
se = np.sqrt(y1.var(ddof=1)/len(y1) + y0.var(ddof=1)/len(y0))
lo, hi = ate-1.96*se, ate+1.96*se

print("Tratamiento:", round(100*y1.mean(),1), "%")
print("Control    :", round(100*y0.mean(),1), "%")
print("ATE        :", round(100*ate,1), "pp")
print("IC 95%     : [", round(100*lo,1), ",", round(100*hi,1), "] pp")
print("p-value    :", round(stats.ttest_ind(y1,y0,equal_var=False).pvalue,4))`
        },
        {
          id:'t-learner',
          label:'2 · CATE',
          question:'¿El efecto promedio esconde respuestas diferentes entre segmentos?',
          instruction:'Entrena un T-Learner real: un modelo para tratados y otro para controles.',
          code:`import pandas as pd
from sklearn.ensemble import RandomForestRegressor

df = pd.DataFrame(payload["experimento"])
X = pd.get_dummies(df[["segmento","uso","antiguedad"]],columns=["segmento"],drop_first=False)

m1 = RandomForestRegressor(n_estimators=120,min_samples_leaf=20,random_state=42)
m0 = RandomForestRegressor(n_estimators=120,min_samples_leaf=20,random_state=42)
m1.fit(X[df["tratado"]],df.loc[df["tratado"],"renovo"])
m0.fit(X[~df["tratado"]],df.loc[~df["tratado"],"renovo"])

df["cate"] = m1.predict(X)-m0.predict(X)
cate = (df.groupby("segmento")["cate"].mean()*100).sort_values(ascending=False)

print("CATE estimado por segmento (pp)")
print(cate.round(1).to_string())
print("\nATE promedio del T-Learner:", round(cate.reindex(df["segmento"]).mean(),1), "pp")`
        },
        {
          id:'policy-value',
          label:'3 · COP',
          question:'¿Qué segmentos generan valor incremental después de considerar costo y capacidad?',
          instruction:'Convierte el CATE estimado en COP. El resultado es una ayuda para decidir, no una regla automática.',
          code:`import pandas as pd
from sklearn.ensemble import RandomForestRegressor
import matplotlib.pyplot as plt

df = pd.DataFrame(payload["experimento"])
seg = pd.DataFrame(payload["segmentos"])
eco = payload["economia"]
X = pd.get_dummies(df[["segmento","uso","antiguedad"]],columns=["segmento"],drop_first=False)

m1 = RandomForestRegressor(n_estimators=120,min_samples_leaf=20,random_state=42)
m0 = RandomForestRegressor(n_estimators=120,min_samples_leaf=20,random_state=42)
m1.fit(X[df["tratado"]],df.loc[df["tratado"],"renovo"])
m0.fit(X[~df["tratado"]],df.loc[~df["tratado"],"renovo"])
df["cate"] = m1.predict(X)-m0.predict(X)
cate = df.groupby("segmento")["cate"].mean()

seg["cate_estimado"] = seg["id"].map(cate)
seg["valor_incremental_cop"] = (
    seg["cate_estimado"]*seg["audiencia"]*eco["renewal_value_cop"]
    - seg["audiencia"]*eco["intervention_cost_cop"]
).round(0)

print(seg[["segmento","audiencia","cate_estimado","valor_incremental_cop"]]
      .sort_values("valor_incremental_cop",ascending=False)
      .to_string(index=False))

plt.figure(figsize=(7,4))
plot = seg.sort_values("valor_incremental_cop")
plt.barh(plot["segmento"],plot["valor_incremental_cop"]/1_000_000)
plt.axvline(0,linewidth=1)
plt.xlabel("Valor incremental estimado (millones COP)")
plt.tight_layout()

print("\nCapacidad total:", int(eco["capacity"]), "clientes")
print("No selecciones sólo por ATE: combina CATE, incertidumbre, valor y capacidad.")`
        }
      ]
    }
  }
  return null
}
