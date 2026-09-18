const n=x=>Number(x||0)

const safeCustomers=rows=>(rows||[]).map(c=>({
  id:String(c.id||''),
  cohorte:String(c.name||c.id||''),
  segmento:String(c.segment||''),
  uso:n(c.usage),
  incidentes:n(c.bugs),
  descuento:n(c.discount),
  antiguedad:n(c.tenure),
  probabilidad_renovacion:n(c.score),
  tamano_cohorte:n(c.cohort_size||1000)
}))

const safeObs=rows=>(rows||[]).map(r=>({
  riesgo_previo:n(r.risk),
  uso:n(r.usage),
  antiguedad:n(r.tenure),
  recibio_bono:Boolean(r.treated),
  renovo:n(r.renewed)
}))

const safeExp=rows=>(rows||[]).map(r=>({
  segmento:String(r.segment||''),
  uso:n(r.usage),
  antiguedad:n(r.tenure),
  recibio_bono:Boolean(r.treated),
  renovo:n(r.renewed)
}))

const safeSegments=rows=>(rows||[]).map(s=>({
  id:String(s.id||''),
  segmento:String(s.name||s.id||''),
  audiencia:n(s.audience),
  riesgo:String(s.risk||''),
  valor_renovacion_cop:n(s.value_per_result??s.value),
  costo_bono_cop:n(s.unit_cost??s.cost)
}))

export function buildPythonLab(round,state={},analysis={}){
  const tools=analysis?.team_tools||{}

  if(round===1){
    const context={
      cohortes:safeCustomers(state.team_pool||[]),
      entrenamiento:(tools.ml_training||[]).map(r=>({
        uso:n(r.usage),incidentes:n(r.bugs),descuento:n(r.discount),antiguedad:n(r.tenure),renovo:n(r.renewed)
      }))
    }
    return{
      title:'¿Qué te está diciendo realmente el modelo?',
      context,
      steps:[
        {
          id:'rank',
          label:'1 · Ordenar',
          question:'¿Quién parece más probable que renueve?',
          instruction:'Empieza con algo simple: ordena la probabilidad que ya produjo el modelo.',
          guidedCode:`import pandas as pd

df = pd.DataFrame(payload["cohortes"])

salida = df[["id","cohorte","probabilidad_renovacion"]].copy()
salida["probabilidad_renovacion"] = (100*salida["probabilidad_renovacion"]).round(1)

print(salida.sort_values("probabilidad_renovacion", ascending=False).head(10).to_string(index=False))

print("\nPregunta:")
print("¿Esta tabla dice quién CAMBIARÁ por recibir el bono?")`,
          advancedCode:`import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score

train = pd.DataFrame(payload["entrenamiento"])
cohortes = pd.DataFrame(payload["cohortes"])
features = ["uso","incidentes","descuento","antiguedad"]

X_train, X_test, y_train, y_test = train_test_split(
    train[features], train["renovo"],
    test_size=.30, random_state=42, stratify=train["renovo"]
)

m = LogisticRegression(max_iter=1000).fit(X_train,y_train)
p = m.predict_proba(X_test)[:,1]
print("AUC predictivo:", round(roc_auc_score(y_test,p),3))

m.fit(train[features],train["renovo"])
cohortes["p_modelo"] = m.predict_proba(cohortes[features])[:,1]
print("\nTop 10 por modelo reentrenado:")
print(cohortes[["id","cohorte","p_modelo"]].sort_values("p_modelo",ascending=False).head(10).to_string(index=False))

print("\nUn AUC alto evalúa predicción. No identifica el efecto del bono.")`
        },
        {
          id:'visual',
          label:'2 · Ver',
          question:'¿Una probabilidad alta es lo mismo que un gran cambio por intervenir?',
          instruction:'Grafica las probabilidades. Fíjate en lo que la gráfica NO contiene.',
          guidedCode:`import pandas as pd
import matplotlib.pyplot as plt

df = pd.DataFrame(payload["cohortes"]).sort_values("probabilidad_renovacion")

plt.figure(figsize=(8,4))
plt.bar(df["id"],100*df["probabilidad_renovacion"])
plt.ylabel("Probabilidad estimada de renovación (%)")
plt.xlabel("Cohorte")
plt.xticks(rotation=60)
plt.tight_layout()

print("La gráfica responde: ¿quién probablemente renovará?")
print("Todavía no responde: ¿quién renovará GRACIAS al bono?")`,
          advancedCode:`import pandas as pd
import matplotlib.pyplot as plt
from sklearn.linear_model import LogisticRegression

train = pd.DataFrame(payload["entrenamiento"])
df = pd.DataFrame(payload["cohortes"])
features = ["uso","incidentes","descuento","antiguedad"]

m = LogisticRegression(max_iter=1000).fit(train[features],train["renovo"])
df["p_modelo"] = m.predict_proba(df[features])[:,1]

fig,ax=plt.subplots(figsize=(8,4))
ax.scatter(df["uso"],100*df["p_modelo"])
ax.set_xlabel("Días activos últimos 30 días")
ax.set_ylabel("Probabilidad estimada de renovación (%)")
fig.tight_layout()

print("El modelo describe P(renovación | características).")
print("No observa dos futuros de la misma cohorte.")`
        }
      ]
    }
  }

  if(round===2){
    const context={historico:safeObs(tools.observational_rows||[])}
    return{
      title:'¿La comparación es justa?',
      context,
      steps:[
        {
          id:'raw',
          label:'1 · Comparar',
          question:'¿Qué parece decir el histórico si sólo comparamos bono vs. no bono?',
          instruction:'Haz la comparación directa. Todavía no la llames “efecto”.',
          guidedCode:`import pandas as pd

df = pd.DataFrame(payload["historico"])

tasas = df.groupby("recibio_bono")["renovo"].mean()*100
print("Sin bono :", round(tasas.loc[False],1), "%")
print("Con bono :", round(tasas.loc[True],1), "%")
print("Diferencia observada:", round(tasas.loc[True]-tasas.loc[False],1), "pp")

print("\n¿Esto prueba que el bono empeoró la renovación?")`,
          advancedCode:`import pandas as pd

df = pd.DataFrame(payload["historico"])
crudo = df.groupby("recibio_bono")["renovo"].mean()

print("Diferencia cruda:", round(100*(crudo.loc[True]-crudo.loc[False]),1), "pp")
print("\nProbabilidad de recibir bono según riesgo previo:")
print((100*df.groupby("riesgo_previo")["recibio_bono"].mean()).round(1).to_string())`
        },
        {
          id:'stratify',
          label:'2 · Igualar',
          question:'¿Qué pasa si comparamos clientes con un riesgo previo parecido?',
          instruction:'Separa por riesgo previo y vuelve a comparar dentro de cada grupo.',
          guidedCode:`import pandas as pd

df = pd.DataFrame(payload["historico"])

tabla = (
    df.groupby(["riesgo_previo","recibio_bono"])["renovo"]
      .mean().mul(100).round(1).unstack()
)

print("Renovación dentro de cada nivel de riesgo (%)")
print(tabla.to_string())

print("\nLa idea importante:")
print("antes de comparar resultados, pregunta si los grupos ya eran distintos.")`,
          advancedCode:`import pandas as pd
import numpy as np
from sklearn.linear_model import LogisticRegression

df = pd.DataFrame(payload["historico"])
X = df[["riesgo_previo","uso","antiguedad"]]
T = df["recibio_bono"].astype(int)
Y = df["renovo"].astype(float)

m = LogisticRegression(max_iter=1000).fit(X,T)
ps = np.clip(m.predict_proba(X)[:,1],.03,.97)

p_t = T.mean()
w1 = T*p_t/ps
w0 = (1-T)*(1-p_t)/(1-ps)
mu1 = (w1*Y).sum()/w1.sum()
mu0 = (w0*Y).sum()/w0.sum()

print("Estimación ajustada:", round(100*(mu1-mu0),1), "pp")
print("Propensity score min/max:", round(ps.min(),2), "/", round(ps.max(),2))
print("\nTérmino avanzado: propensity score + IPW.")
print("La técnica ayuda a construir comparabilidad; no elimina los supuestos.")`
        },
        {
          id:'overlap',
          label:'3 · Comprobar',
          question:'¿Existen clientes parecidos en ambos grupos?',
          instruction:'En modo guiado mira la distribución del riesgo. El modo avanzado muestra overlap con propensity score.',
          guidedCode:`import pandas as pd
import matplotlib.pyplot as plt

df = pd.DataFrame(payload["historico"])

tabla = pd.crosstab(df["riesgo_previo"],df["recibio_bono"],normalize="index")*100
print("Distribución de bono dentro de cada riesgo (%)")
print(tabla.round(1).to_string())

tabla.plot(kind="bar",figsize=(7,4))
plt.ylabel("% dentro del nivel de riesgo")
plt.xlabel("Riesgo previo")
plt.tight_layout()

print("\nSi un nivel casi no tiene ambos grupos, la comparación se vuelve más frágil.")`,
          advancedCode:`import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from sklearn.linear_model import LogisticRegression

df = pd.DataFrame(payload["historico"])
X = df[["riesgo_previo","uso","antiguedad"]]
T = df["recibio_bono"].astype(int)

m = LogisticRegression(max_iter=1000).fit(X,T)
df["ps"] = np.clip(m.predict_proba(X)[:,1],.01,.99)

plt.figure(figsize=(7,4))
plt.hist(df.loc[T==0,"ps"],bins=18,alpha=.65,label="Sin bono")
plt.hist(df.loc[T==1,"ps"],bins=18,alpha=.65,label="Con bono")
plt.xlabel("Probabilidad estimada de recibir bono")
plt.ylabel("Observaciones")
plt.legend()
plt.tight_layout()

print("Esto se conoce como overlap o soporte común.")`
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
      title:'¿Funciona igual para todos?',
      context,
      steps:[
        {
          id:'experiment',
          label:'1 · Promedio',
          question:'En un experimento aleatorizado, ¿cuánto cambió la renovación en promedio?',
          instruction:'Compara directamente tratamiento y control.',
          guidedCode:`import pandas as pd

df = pd.DataFrame(payload["experimento"])
tasas = df.groupby("recibio_bono")["renovo"].mean()*100

print("Sin bono :", round(tasas.loc[False],1), "%")
print("Con bono :", round(tasas.loc[True],1), "%")
print("Cambio promedio:", round(tasas.loc[True]-tasas.loc[False],1), "pp")`,
          advancedCode:`import pandas as pd
import numpy as np

df = pd.DataFrame(payload["experimento"])
y1 = df.loc[df["recibio_bono"],"renovo"].astype(float)
y0 = df.loc[~df["recibio_bono"],"renovo"].astype(float)

efecto = y1.mean()-y0.mean()
se = np.sqrt(y1.var(ddof=1)/len(y1)+y0.var(ddof=1)/len(y0))
lo,hi = efecto-1.96*se,efecto+1.96*se

print("Efecto promedio:", round(100*efecto,1), "pp")
print("IC 95%: [",round(100*lo,1),",",round(100*hi,1),"] pp")
print("\nTérmino técnico: ATE e intervalo de confianza.")`
        },
        {
          id:'segments',
          label:'2 · Grupos',
          question:'¿Ese cambio promedio se repite en todos los segmentos?',
          instruction:'Calcula la diferencia dentro de cada segmento.',
          guidedCode:`import pandas as pd

df = pd.DataFrame(payload["experimento"])

tabla = (
    df.groupby(["segmento","recibio_bono"])["renovo"]
      .mean().mul(100).round(1).unstack()
)
tabla["cambio_pp"] = tabla[True]-tabla[False]

print(tabla.sort_values("cambio_pp",ascending=False).to_string())

print("\nNo todos los segmentos responden igual.")`,
          advancedCode:`import pandas as pd
from sklearn.ensemble import RandomForestRegressor

df = pd.DataFrame(payload["experimento"])
X = pd.get_dummies(df[["segmento","uso","antiguedad"]],columns=["segmento"],drop_first=False)

m1 = RandomForestRegressor(n_estimators=120,min_samples_leaf=20,random_state=42)
m0 = RandomForestRegressor(n_estimators=120,min_samples_leaf=20,random_state=42)
m1.fit(X[df["recibio_bono"]],df.loc[df["recibio_bono"],"renovo"])
m0.fit(X[~df["recibio_bono"]],df.loc[~df["recibio_bono"],"renovo"])

df["efecto_estimado"] = m1.predict(X)-m0.predict(X)
print((100*df.groupby("segmento")["efecto_estimado"].mean()).round(1).sort_values(ascending=False).to_string())

print("\nTérmino avanzado: T-Learner para heterogeneidad del efecto.")`
        },
        {
          id:'money',
          label:'3 · Dinero',
          question:'¿Qué grupos generan valor después de pagar el bono?',
          instruction:'Convierte el cambio observado por segmento a valor incremental.',
          guidedCode:`import pandas as pd

df = pd.DataFrame(payload["experimento"])
seg = pd.DataFrame(payload["segmentos"])
eco = payload["economia"]

tabla = (
    df.groupby(["segmento","recibio_bono"])["renovo"]
      .mean().unstack()
)
tabla["efecto"] = tabla[True]-tabla[False]

seg["efecto_estimado"] = seg["id"].map(tabla["efecto"])
seg["valor_incremental_cop"] = (
    seg["efecto_estimado"]*seg["audiencia"]*eco["renewal_value_cop"]
    - seg["audiencia"]*eco["intervention_cost_cop"]
).round(0)

print(seg[["segmento","audiencia","efecto_estimado","valor_incremental_cop"]]
      .sort_values("valor_incremental_cop",ascending=False)
      .to_string(index=False))

print("\nCapacidad:", int(eco["capacity"]), "clientes")`,
          advancedCode:`import pandas as pd
from sklearn.ensemble import RandomForestRegressor
import matplotlib.pyplot as plt

df = pd.DataFrame(payload["experimento"])
seg = pd.DataFrame(payload["segmentos"])
eco = payload["economia"]

X = pd.get_dummies(df[["segmento","uso","antiguedad"]],columns=["segmento"],drop_first=False)
m1 = RandomForestRegressor(n_estimators=120,min_samples_leaf=20,random_state=42)
m0 = RandomForestRegressor(n_estimators=120,min_samples_leaf=20,random_state=42)
m1.fit(X[df["recibio_bono"]],df.loc[df["recibio_bono"],"renovo"])
m0.fit(X[~df["recibio_bono"]],df.loc[~df["recibio_bono"],"renovo"])
df["efecto"] = m1.predict(X)-m0.predict(X)
cate = df.groupby("segmento")["efecto"].mean()

seg["efecto"] = seg["id"].map(cate)
seg["valor_incremental_cop"] = (
    seg["efecto"]*seg["audiencia"]*eco["renewal_value_cop"]
    - seg["audiencia"]*eco["intervention_cost_cop"]
).round(0)

plot=seg.sort_values("valor_incremental_cop")
plt.figure(figsize=(7,4))
plt.barh(plot["segmento"],plot["valor_incremental_cop"]/1_000_000)
plt.axvline(0,linewidth=1)
plt.xlabel("Valor incremental estimado (millones COP)")
plt.tight_layout()

print(plot[["segmento","efecto","valor_incremental_cop"]].to_string(index=False))
print("\nTérminos avanzados: CATE / T-Learner.")`
        }
      ]
    }
  }

  return null
}
