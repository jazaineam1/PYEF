import{_ as e,c as t,h as n,m as r,v as i}from"./api-CrsMZN55.js";import{t as a}from"./check-BotQSGoB.js";import{n as o,t as s}from"./rotate-ccw-BHpOyulI.js";var c={name:`loader-circle`,size:24,node:[[`path`,{d:`M21 12a9 9 0 1 1-6.219-8.56`,key:`13zald`}]],aliases:[`loader-2`]};c.node;var l=n(c),u={name:`terminal`,size:24,node:[[`path`,{d:`M12 19h8`,key:`baeox8`}],[`path`,{d:`m4 17 6-6-6-6`,key:`1yngyt`}]]};u.node;var d=n(u),f=i(e(),1),p={best_holdout_rmse:`causal_forest`,metrics:{causal_forest:{ate_error_points:.0919,cate_rmse_points:.3396},dr_learner:{ate_error_points:.0221,cate_rmse_points:.7579},t_learner:{ate_error_points:.0038,cate_rmse_points:1.2927}},note:`El menor error del holdout sintetico no prueba identificacion causal externa.`,provenance:{data_sha256:`2dbe8a142048b55587874d8e21477ace033ef2efdf93566de9e738f46e12ce2e`,dataset:`campus-academic-experiment-v2`,description:`Entrenamiento efectivo sobre datos academicos sinteticos de CAMPUS V2; sin datos personales.`,econml_version:`0.16.0`,engine:`EconML`,execution:`CPython GitHub Actions (no Pyodide)`,generator_sql:`202610140001_v2_academic_causal_curriculum.sql`,holdout_rows:500,methods:[`TLearner`,`DRLearner`,`CausalForestDML`],n:2e3,numpy_version:`1.26.4`,seed:20261014,sklearn_version:`1.5.2`,source:`causal-wargame/scripts/precompute_econml_v2.py`,train_rows:1500},schema_version:1,segments:[{causal_forest:-1.518,dr_learner:-1.729,n_holdout:70,name:`Sin señal clara`,segment:`arrears`,t_learner:-1.095},{causal_forest:10.372,dr_learner:10.467,n_holdout:140,name:`Alta fatiga`,segment:`digital`,t_learner:10.458},{causal_forest:7.785,dr_learner:7.791,n_holdout:150,name:`Equilibrado`,segment:`middle`,t_learner:7.717},{causal_forest:3.21,dr_learner:3.075,n_holdout:90,name:`Sueño insuficiente`,segment:`traditional`,t_learner:2.375},{causal_forest:1.808,dr_learner:1.362,n_holdout:50,name:`Sobreexigido`,segment:`wealth`,t_learner:1.799}],status:`verified`},m=[`t_learner`,`dr_learner`,`causal_forest`],h=e=>typeof e==`number`&&Number.isFinite(e),g=p.schema_version===1&&p.status===`verified`&&p.provenance?.engine===`EconML`&&p.provenance?.dataset===`campus-academic-experiment-v2`&&p.provenance?.n===2e3&&p.provenance?.train_rows===1500&&p.provenance?.holdout_rows===500&&p.provenance?.data_sha256===`2dbe8a142048b55587874d8e21477ace033ef2efdf93566de9e738f46e12ce2e`&&Array.isArray(p.segments)&&p.segments.length===5&&p.segments.every(e=>m.every(t=>h(e[t])))&&m.every(e=>h(p.metrics?.[e]?.cate_rmse_points))?p:null,_=e=>Number(e||0),v=(e,t,n)=>Math.max(t,Math.min(n,e)),y=e=>{let t=_(e);return t>10?t/100:t},b=(e,t=0)=>Number.isFinite(Number(e?.grade))?Number(e.grade):Number.isFinite(Number(e?.nota_final))?Number(e.nota_final):v(20+4.2*y(e?.tenure??e?.pga_previo)+.7*_(e?.usage??e?.horas_estudio)-.8*_(e?.bugs??e?.fatiga)+.25*_(e?.discount??e?.horas_sueno)+(_(e?.renewed??e?.aprobo)?5:-2)+(t*17%7-3),0,50),x=e=>(e||[]).map((e,t)=>({id:String(e.id||``),estudiante:String(e.name||e.id||``),arquetipo:String(e.segment||``),horas_estudio:_(e.study_hours??e.usage),fatiga:_(e.fatigue??e.bugs),horas_sueno:_(e.sleep_hours??e.discount),pga_previo:y(e.pga_prev??e.tenure),probabilidad_aprobar:_(e.score),tamano_grupo:_(e.cohort_size||100),nota_final:b(e,t)})),S=e=>(e||[]).map((e,t)=>({pga_previo:y(e.pga_prev??e.tenure),horas_estudio:_(e.study_hours??e.usage),horas_sueno:_(e.sleep_hours??e.sleep??6),fatiga:_(e.fatigue??e.risk??e.bugs),complejidad:_(e.complexity??e.risk??5),recibio_apoyo:!!e.treated,aprobo:_(e.passed??e.renewed),nota_final:b(e,t),arquetipo:String(e.segment||e.archetype||`General`)})),C=e=>(e||[]).map(e=>({id:String(e.id||``),arquetipo:String(e.name||e.id||``),estudiantes:_(e.audience),nivel_riesgo:String(e.risk||``),efecto_pp:_(e.effect_pp??e.effect),ci_low:_(e.ci_low),ci_high:_(e.ci_high)}));function w(e,t={},n={},r=null){let i=n?.team_tools||{},a=r||`prediction`;return a===`prediction`?{title:`Un predictor puede ser excelente y responder la pregunta equivocada`,context:{perfiles:x(t.team_pool||t.packet||[]),entrenamiento:S(i.ml_training||[])},steps:[{id:`fit`,label:`1 · Predecir`,question:`¿Qué tan bien podemos predecir la nota final?`,instruction:`Entrena un modelo predictivo y mira MAE y R². Todavía no hablamos de causalidad.`,guidedCode:`import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score

df = pd.DataFrame(payload["entrenamiento"])
features = ["pga_previo","horas_estudio","horas_sueno","fatiga","complejidad"]

X_train,X_test,y_train,y_test = train_test_split(
    df[features],df["nota_final"],test_size=.30,random_state=42
)
m = RandomForestRegressor(n_estimators=70,min_samples_leaf=5,random_state=42)
m.fit(X_train,y_train)
pred = m.predict(X_test)

print("MAE — Error Absoluto Medio:", round(mean_absolute_error(y_test,pred),2),"puntos")
print("R² — coeficiente de determinación:", round(r2_score(y_test,pred),3))
print("\\nInterpretación:")
print("MAE dice cuántos puntos se equivoca el predictor, en promedio.")
print("R² mide capacidad predictiva. Ninguna de las dos métricas prueba causalidad.")`},{id:`rank`,label:`2 · Priorizar`,question:`¿Un estudiante con alta probabilidad de aprobar es quien más cambiará con apoyo?`,instruction:`Ordena perfiles por probabilidad de aprobar y observa qué información falta.`,guidedCode:`import pandas as pd

df = pd.DataFrame(payload["perfiles"]).copy()
df["prob_aprobar_pct"] = (100*df["probabilidad_aprobar"]).round(1)

print(df[["id","estudiante","arquetipo","prob_aprobar_pct"]]
      .sort_values("prob_aprobar_pct",ascending=False)
      .head(12).to_string(index=False))

print("\\nWOW:")
print("Esta tabla responde: ¿quién probablemente aprobará?")
print("NO responde: ¿quién aprobaría GRACIAS al apoyo?")
print("Para eso necesitamos imaginar dos futuros: con apoyo y sin apoyo.")`}]}:a===`ab-test`?{title:`A/B: mismo efecto verdadero, estimaciones distintas`,context:{experimento:S(i.experiment_rows||[])},steps:[{id:`ate`,label:`1 · Comparar`,question:`¿Cuánto cambió la nota en tratamiento vs. control?`,instruction:`Como la asignación fue aleatoria, la diferencia de medias tiene interpretación causal bajo el diseño.`,guidedCode:`import pandas as pd

df = pd.DataFrame(payload["experimento"])
medias = df.groupby("recibio_apoyo")["nota_final"].mean()
ate = medias.loc[True]-medias.loc[False]

print("Control — sin apoyo:", round(medias.loc[False],2))
print("Tratamiento — con apoyo:", round(medias.loc[True],2))
print("ATE — Average Treatment Effect / Efecto Promedio del Tratamiento:", round(ate,2),"puntos")
print("\\nATE significa: cuánto cambió la nota, EN PROMEDIO, por recibir la intervención.")`},{id:`uncertainty`,label:`2 · Repetir`,question:`¿Por qué distintos equipos pueden obtener efectos distintos?`,instruction:`Repite el análisis en submuestras aleatorias. El mundo causal es el mismo; la muestra cambia.`,guidedCode:`import pandas as pd
import numpy as np

df = pd.DataFrame(payload["experimento"])
rng = np.random.default_rng(42)

for k in range(1,6):
    sample = df.iloc[rng.choice(len(df),size=min(180,len(df)),replace=False)]
    m = sample.groupby("recibio_apoyo")["nota_final"].mean()
    print(f"Equipo virtual {k}: efecto observado = {m.loc[True]-m.loc[False]:.2f} puntos")

print("\\nWOW: estimar no es conocer exactamente. Hay azar muestral.")`},{id:`ci`,label:`3 · Incertidumbre`,question:`¿Cómo expresamos la incertidumbre del ATE?`,instruction:`Calcula un intervalo de confianza aproximado para la diferencia de medias.`,guidedCode:`import pandas as pd
import numpy as np

df = pd.DataFrame(payload["experimento"])
y1 = df.loc[df["recibio_apoyo"],"nota_final"].astype(float)
y0 = df.loc[~df["recibio_apoyo"],"nota_final"].astype(float)

ate = y1.mean()-y0.mean()
se = np.sqrt(y1.var(ddof=1)/len(y1)+y0.var(ddof=1)/len(y0))
lo,hi = ate-1.96*se,ate+1.96*se

print("ATE:", round(ate,2),"puntos")
print("IC 95% — Intervalo de Confianza 95%: [",round(lo,2),",",round(hi,2),"]")
print("\\nUn IC resume la incertidumbre de la estimación; no significa que todos cambien dentro de ese rango.")`}]}:a===`dag`?{title:`DAG Detective: controlar más no siempre es mejor`,context:{historico:S(i.observational_rows||[]),dag:i.dag||{}},steps:[{id:`raw`,label:`1 · Sospechar`,question:`¿Qué dice la comparación cruda en datos observacionales?`,instruction:`Compara primero apoyo vs. no apoyo sin ajustar. No la llames todavía “efecto”.`,guidedCode:`import pandas as pd

df = pd.DataFrame(payload["historico"])
m = df.groupby("recibio_apoyo")["nota_final"].mean()

print("Sin apoyo:", round(m.loc[False],2))
print("Con apoyo:", round(m.loc[True],2))
print("Diferencia observada:", round(m.loc[True]-m.loc[False],2),"puntos")
print("\\nPregunta: ¿los dos grupos eran comparables ANTES de recibir apoyo?")`},{id:`confounder`,label:`2 · Bloquear`,question:`¿Qué cambia si comparamos estudiantes con historial previo parecido?`,instruction:`Estratifica por PGA previo aproximado y vuelve a comparar.`,guidedCode:`import pandas as pd

df = pd.DataFrame(payload["historico"]).copy()
df["pga_grupo"] = pd.cut(df["pga_previo"],bins=[0,3.0,3.5,4.0,5.0],labels=["<3.0","3.0–3.5","3.5–4.0",">=4.0"])

tabla = df.groupby(["pga_grupo","recibio_apoyo"],observed=True)["nota_final"].mean().unstack()
tabla["diferencia"] = tabla.get(True)-tabla.get(False)
print(tabla.round(2).to_string())

print("\\nConfusor: una causa previa relacionada con recibir apoyo y con la nota.")
print("DAG — Directed Acyclic Graph: mapa de hipótesis sobre qué causa qué.")`},{id:`bad-control`,label:`3 · Evitar trampas`,question:`¿Por qué no debemos controlar automáticamente variables posteriores?`,instruction:`Construye dos variables posteriores para visualizar mediador y collider como trampas de ajuste.`,guidedCode:`import numpy as np
# Experimento didáctico independiente con el mecanismo causal conocido.
rng=np.random.default_rng(2036)
n=2500
t=rng.binomial(1,.5,n)
u=rng.normal(size=n)
m=1.2*t+rng.normal(size=n)
y=3.0*t+1.5*m+u+rng.normal(size=n) # efecto total 4.8
c=1.3*t+u+rng.normal(size=n)
def theta(x):
    return np.linalg.lstsq(x,y,rcond=None)[0][1]
print("Efecto total verdadero:",4.8)
print("Sin ajustar (tratamiento aleatorio):",round(theta(np.column_stack([np.ones(n),t])),2))
print("Ajustando mediador:",round(theta(np.column_stack([np.ones(n),t,m])),2))
print("Ajustando collider:",round(theta(np.column_stack([np.ones(n),t,c])),2))
print("WOW: más controles pueden sesgar el efecto total.")
print("Este miniexperimento NO estima efectos en el histórico observacional.")`}]}:a===`dml`?{title:`Double Machine Learning construido paso a paso`,context:{historico:S(i.observational_rows||[])},steps:[{id:`nuisance`,label:`1 · Explicar T y Y`,question:`¿Qué parte del tratamiento y de la nota puede explicar X?`,instruction:`Entrena dos modelos auxiliares: uno para T y otro para Y.`,guidedCode:`import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import cross_val_predict, KFold

df = pd.DataFrame(payload["historico"]).copy()
X = df[["pga_previo","horas_estudio","horas_sueno","fatiga","complejidad"]]
T = df["recibio_apoyo"].astype(float)
Y = df["nota_final"].astype(float)

cv = KFold(n_splits=4,shuffle=True,random_state=42)
mt = RandomForestRegressor(n_estimators=35,max_depth=9,min_samples_leaf=15,random_state=42)
my = RandomForestRegressor(n_estimators=35,max_depth=9,min_samples_leaf=15,random_state=7)

t_hat = np.clip(cross_val_predict(mt,X,T,cv=cv),.02,.98)
y_hat = cross_val_predict(my,X,Y,cv=cv)

print("Modelo auxiliar T: estima quién tendería a recibir apoyo según X.")
print("Modelo auxiliar Y: estima qué nota esperaríamos según X.")
print("Nuisance models = modelos auxiliares; NO son el efecto causal final.")`},{id:`residuals`,label:`2 · Residualizar`,question:`¿Qué queda después de quitar la parte explicada por X?`,instruction:`Calcula tratamiento residual y resultado residual.`,guidedCode:`import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import cross_val_predict, KFold

df = pd.DataFrame(payload["historico"]).copy()
X = df[["pga_previo","horas_estudio","horas_sueno","fatiga","complejidad"]]
T = df["recibio_apoyo"].astype(float)
Y = df["nota_final"].astype(float)
cv = KFold(n_splits=4,shuffle=True,random_state=42)

t_hat = np.clip(cross_val_predict(RandomForestRegressor(n_estimators=35,max_depth=9,min_samples_leaf=15,random_state=42),X,T,cv=cv),.02,.98)
y_hat = cross_val_predict(RandomForestRegressor(n_estimators=35,max_depth=9,min_samples_leaf=15,random_state=7),X,Y,cv=cv)

t_res = T-t_hat
y_res = Y-y_hat

print("T residual = tratamiento observado - tratamiento esperado")
print("Y residual = nota observada - nota esperada")
print("Correlación entre residuos:", round(np.corrcoef(t_res,y_res)[0,1],3))`},{id:`effect`,label:`3 · Estimar`,question:`¿Qué efecto queda al relacionar los residuos?`,instruction:`Estima una pendiente residual y compárala con la diferencia cruda.`,guidedCode:`import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import cross_val_predict, KFold

df = pd.DataFrame(payload["historico"]).copy()
X = df[["pga_previo","horas_estudio","horas_sueno","fatiga","complejidad"]]
T = df["recibio_apoyo"].astype(float)
Y = df["nota_final"].astype(float)
cv = KFold(n_splits=4,shuffle=True,random_state=42)

t_hat = np.clip(cross_val_predict(RandomForestRegressor(n_estimators=35,max_depth=9,min_samples_leaf=15,random_state=42),X,T,cv=cv),.02,.98)
y_hat = cross_val_predict(RandomForestRegressor(n_estimators=35,max_depth=9,min_samples_leaf=15,random_state=7),X,Y,cv=cv)
t_res,y_res = T-t_hat,Y-y_hat

theta = float((t_res*y_res).sum()/(t_res*t_res).sum())
psi=t_res*(y_res-theta*t_res)
se=float(np.sqrt(np.mean(psi**2)/len(df))/np.mean(t_res**2))
print("IC 95 % aproximado (iid):",round(theta-1.96*se,2),"a",round(theta+1.96*se,2))
crudo = Y[T==1].mean()-Y[T==0].mean()

print("Diferencia cruda:", round(crudo,2),"puntos")
print("DML — Double Machine Learning:", round(theta,2),"puntos")
print("\\nDML = Double Machine Learning / Aprendizaje Automático Doble.")
print("Usa ML para ajustar T y Y; luego estima el efecto en la variación residual.")
print("WOW: buen R² predictivo no garantiza una buena estimación causal.")`}]}:a===`heterogeneity`?{title:`ATE no es CATE: el promedio puede esconder a quién ayudar`,context:{experimento:S(i.experiment_rows||[]),segmentos:C(i.segments||[])},steps:[{id:`ate`,label:`1 · Promedio`,question:`¿Cuál es el efecto promedio del apoyo?`,instruction:`Calcula primero ATE como diferencia de medias del experimento.`,guidedCode:`import pandas as pd

df = pd.DataFrame(payload["experimento"])
m = df.groupby("recibio_apoyo")["nota_final"].mean()
ate = m.loc[True]-m.loc[False]

print("ATE — Average Treatment Effect / Efecto Promedio del Tratamiento:", round(ate,2),"puntos")
print("ATE responde: ¿funciona EN PROMEDIO?")`},{id:`cate`,label:`2 · Perfiles`,question:`¿El mismo efecto aparece en todos los arquetipos?`,instruction:`Calcula diferencias dentro de cada arquetipo.`,guidedCode:`import pandas as pd

df = pd.DataFrame(payload["experimento"])
tabla = df.groupby(["arquetipo","recibio_apoyo"])["nota_final"].mean().unstack()
tabla["efecto"] = tabla[True]-tabla[False]

print(tabla.sort_values("efecto",ascending=False).round(2).to_string())
print("\\nCATE — Conditional Average Treatment Effect:")
print("efecto promedio para personas con determinadas características.")
print("ATE pregunta ¿funciona?; CATE pregunta ¿para quién funciona?")`},{id:`tlearner`,label:`3 · T-Learner`,question:`¿Podemos estimar efectos individuales con dos modelos?`,instruction:`Entrena un modelo en tratados y otro en controles; resta sus predicciones.`,guidedCode:`import pandas as pd
from sklearn.ensemble import RandomForestRegressor

df = pd.DataFrame(payload["experimento"])
X = pd.get_dummies(df[["arquetipo","pga_previo","horas_estudio","fatiga","complejidad"]],columns=["arquetipo"],drop_first=False)
T = df["recibio_apoyo"]
Y = df["nota_final"]

m1 = RandomForestRegressor(n_estimators=70,min_samples_leaf=15,random_state=1).fit(X[T],Y[T])
m0 = RandomForestRegressor(n_estimators=70,min_samples_leaf=15,random_state=2).fit(X[~T],Y[~T])

df["cate_tlearner"] = m1.predict(X)-m0.predict(X)
print(df.groupby("arquetipo")["cate_tlearner"].mean().sort_values(ascending=False).round(2).to_string())
print("\\nT-Learner — Two Learners / Dos aprendices:")
print("un modelo aprende el futuro tratado y otro el futuro control.")`}]}:a===`model-battle`?{title:`Boss final: comparar estimadores sin olvidar identificación`,context:{experimento:S(i.experiment_rows||[]),comparador:g?.segments||[],procedencia:g?.provenance||null,metricas:g?.metrics||null,campeon:g?.best_holdout_rmse||null},steps:[{id:`s-vs-t`,label:`1 · S vs T`,question:`¿Cómo cambian las estimaciones con dos estrategias de meta-learning?`,instruction:`Compara S-Learner y T-Learner usando el mismo Random Forest base.`,guidedCode:`import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor

df = pd.DataFrame(payload["experimento"])
base = pd.get_dummies(df[["arquetipo","pga_previo","horas_estudio","fatiga","complejidad"]],columns=["arquetipo"],drop_first=False)
T = df["recibio_apoyo"].astype(int)
Y = df["nota_final"]

# S-Learner: un solo modelo incluye tratamiento
Xs = base.copy(); Xs["tratamiento"] = T
s = RandomForestRegressor(n_estimators=65,min_samples_leaf=15,random_state=10).fit(Xs,Y)
x1=base.copy();x1["tratamiento"]=1
x0=base.copy();x0["tratamiento"]=0
tau_s=s.predict(x1)-s.predict(x0)

# T-Learner: dos modelos
m1=RandomForestRegressor(n_estimators=65,min_samples_leaf=15,random_state=11).fit(base[T==1],Y[T==1])
m0=RandomForestRegressor(n_estimators=65,min_samples_leaf=15,random_state=12).fit(base[T==0],Y[T==0])
tau_t=m1.predict(base)-m0.predict(base)

print("S-Learner — Single Learner: un modelo para ambos futuros.")
print("T-Learner — Two Learners: un modelo tratado y otro control.")
print("\\nEfecto medio S:",round(float(np.mean(tau_s)),2))
print("Efecto medio T:",round(float(np.mean(tau_t)),2))`},{id:`dr`,label:`2 · DR-Learner`,question:`¿Qué significa “doblemente robusto” en términos prácticos?`,instruction:`Construye un pseudo-outcome DR simplificado y aprende heterogeneidad sobre él.`,guidedCode:`import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import StratifiedKFold,train_test_split
df=pd.DataFrame(payload["experimento"])
X=pd.get_dummies(df[["arquetipo","pga_previo","horas_estudio","fatiga","complejidad"]],columns=["arquetipo"])
T=df["recibio_apoyo"].astype(int).to_numpy()
Y=df["nota_final"].astype(float).to_numpy()
train,hold=train_test_split(np.arange(len(df)),test_size=.25,random_state=2026,stratify=T)
xt,tt,yt=X.iloc[train],T[train],Y[train]
p=np.zeros(len(train));mu1=np.zeros(len(train));mu0=np.zeros(len(train))
cv=StratifiedKFold(n_splits=4,shuffle=True,random_state=2026)
for fit,val in cv.split(xt,tt):
    a,b=xt.iloc[fit],xt.iloc[val];tf,yf=tt[fit],yt[fit]
    ps=LogisticRegression(max_iter=1000).fit(a,tf)
    m1=RandomForestRegressor(n_estimators=35,max_depth=9,min_samples_leaf=12,random_state=4).fit(a[tf==1],yf[tf==1])
    m0=RandomForestRegressor(n_estimators=35,max_depth=9,min_samples_leaf=12,random_state=5).fit(a[tf==0],yf[tf==0])
    p[val]=ps.predict_proba(b)[:,1];mu1[val],mu0[val]=m1.predict(b),m0.predict(b)
p=np.clip(p,.05,.95)
pseudo=(mu1-mu0)+tt*(yt-mu1)/p-(1-tt)*(yt-mu0)/(1-p)
dr=RandomForestRegressor(n_estimators=45,max_depth=9,min_samples_leaf=20,random_state=9).fit(xt,pseudo)
tau=dr.predict(X.iloc[hold])
print("DR-Learner didáctico: auxiliares fuera de muestra (4 folds).")
print("CATE medio proyectado sobre perfiles reservados:",round(float(tau.mean()),2),"puntos")
print("La reserva no demuestra exactitud de CATE; requiere validación adicional.")`},{id:`econml`,label:`3 · EconML / Causal Forest`,question:`¿Un estimador más sofisticado gana automáticamente?`,instruction:`Compara resultados EconML verificados y mide RMSE de CATE en perfiles reservados.`,guidedCode:`import pandas as pd
p=payload.get("procedencia")
if not p or p.get("engine")!="EconML":
    raise RuntimeError("Benchmark V2 no verificado: no se acredita evidencia ficticia.")
assert p["dataset"]=="campus-academic-experiment-v2"
rows=pd.DataFrame(payload["comparador"])
cols=["name","n_holdout","t_learner","dr_learner","causal_forest"]
assert len(rows)==5 and all(x in rows for x in cols)
print("ECONML REAL: TLearner, DRLearner y CausalForestDML entrenados en GitHub Actions.")
print("Entrenamiento:",p["train_rows"],"evaluacion:",p["holdout_rows"])
print("EconML",p["econml_version"],"semilla",p["seed"],"SHA",p["data_sha256"][:12])
print("CATE estimado por segmento, en puntos:")
print(rows[cols].to_string(index=False))
metrics=pd.DataFrame(payload["metricas"]).T
print("RMSE CATE reservado, menor es mejor:")
print(metrics[["cate_rmse_points","ate_error_points"]].round(3).to_string())
print("Menor error del CATE:",payload["campeon"])
print("El efecto causal requiere identificacion correcta, no solo un algoritmo.")
print("Este Python analiza el output verificado; EconML se entreno fuera de Pyodide.")`}]}:null}var T=r(),E=45e3,D=null,O=!1,k=!1,A=null;function j(){return D||(D=new Worker(new URL(``+new URL(`pyodide.worker-D7QpOAeM.js`,import.meta.url).href,``+import.meta.url)),D.onmessage=e=>{e.data?.type===`ready`&&(O=!0,k=!1),A?.(e)},D.onerror=e=>{O=!1,k=!1,A?.({data:{type:`error`,error:e.message||`Python no disponible`}})},D)}function M(){D?.terminate(),D=null,O=!1,k=!1}function N(){if(!(O||k)){k=!0;try{j().postMessage({type:`init`})}catch{k=!1}}}function P({round:e,state:n,analysis:r,labKey:i,labPoints:c=20,onComplete:u,simulation:p=!1}){let m=(0,f.useMemo)(()=>w(e,n,r,i),[e,n,r,i]),[h,g]=(0,f.useState)({}),[_,v]=(0,f.useState)({}),[y,b]=(0,f.useState)({}),[x,S]=(0,f.useState)(`idle`),[C,D]=(0,f.useState)(``),[N,P]=(0,f.useState)(!1),[F,I]=(0,f.useState)(!1),L=(0,f.useRef)(null),R=(0,f.useRef)(null),z=(0,f.useRef)(null),B=(0,f.useRef)(null);(0,f.useEffect)(()=>{let e={};for(let t of m?.steps||[])e[t.id]=t.guidedCode||t.code||``;g(e),v({}),b({}),D(``),S(`idle`),P(!1),I(!1),clearTimeout(R.current)},[e,m?.title]),(0,f.useEffect)(()=>()=>{clearTimeout(R.current),A===B.current&&(A=null)},[]);function V(){if(L.current)return L.current;let n=j();return A=B.current=async n=>{let r=n.data||{};if(r.type===`ready`&&(S(`ready`),D(``)),r.type===`result`){clearTimeout(R.current);let n=z.current;if(!n||n.stepId!==r.requestId)return;let i=n.stepId;try{if(!p){let r=Math.round(performance.now()-n.started);await t(`v2-submit`,{action:`learning_event`,round:e,event_type:`python_run`,payload:{step_id:i,code_changed:n.codeChanged,duration_ms:r,mode:`guided`}})}v(e=>({...e,[i]:{output:r.output||``,image:r.image||null}})),b(e=>({...e,[i]:``})),S(`ready`),D(``)}catch(e){v(e=>{let t={...e};return delete t[i],t}),b(t=>({...t,[i]:`Python terminó, pero el servidor no confirmó la evidencia: `+e.message})),S(`ready`)}finally{z.current=null}}if(r.type===`execution_error`){clearTimeout(R.current);let e=z.current?.stepId||r.requestId;v(t=>{let n={...t};return delete n[e],n}),b(t=>({...t,[e]:[r.output,r.error].filter(Boolean).join(`
`)})),S(`ready`),D(``),z.current=null}r.type===`error`&&(clearTimeout(R.current),S(`error`),D(r.error||`Error ejecutando Python`),z.current=null)},L.current=n,O&&(S(`ready`),D(``)),n}function H(){S(`loading`),D(``);let e=V();O?S(`ready`):k||(k=!0,e.postMessage({type:`init`}))}function U(e){let t=V(),n=e.guidedCode||e.code||``,r=h[e.id]??n;S(`running`),D(``),b(t=>({...t,[e.id]:``})),v(t=>{let n={...t};return delete n[e.id],n}),z.current={stepId:e.id,started:performance.now(),codeChanged:r!==n},t.postMessage({type:`run`,requestId:e.id,code:r,context:m?.context||{}}),clearTimeout(R.current),R.current=setTimeout(()=>{M(),L.current=null,z.current=null,S(`error`),D(`La ejecución superó 45 segundos y fue detenida. Restaura el ejemplo e inténtalo otra vez.`)},E)}async function W(){if(J&&!N){P(!0),D(``);try{if(p){I(!0),await u?.();return}await t(`v2-submit`,{action:`lab_complete`,round:e}),await u?.()}catch(e){D(e.message)}finally{P(!1)}}}if(!m)return null;let G=m.steps||[],K=x===`ready`||x===`running`,q=x===`loading`||x===`running`,J=G.length>0&&G.every(e=>_[e.id]);return(0,T.jsxs)(`section`,{className:`v2-python-lab single-page`,children:[(0,T.jsxs)(`div`,{className:`v2-python-head`,children:[(0,T.jsxs)(`div`,{children:[(0,T.jsx)(`div`,{className:`v2-kicker`,children:`LABORATORIO · TODO EN ESTA PÁGINA`}),(0,T.jsx)(`h2`,{children:m.title})]}),(0,T.jsxs)(`div`,{className:`v2-python-status ${x}`,children:[(0,T.jsx)(d,{size:15}),(0,T.jsx)(`span`,{children:x===`idle`?`Python apagado`:x===`loading`?`Cargando Python`:x===`running`?`Ejecutando`:`Python listo`})]})]}),(0,T.jsx)(`div`,{className:`v2-alert hint`,children:(0,T.jsx)(`span`,{children:`No necesitas memorizar código. Ejecuta cada bloque, mira el resultado y responde la pregunta que lo acompaña.`})}),!K&&(0,T.jsxs)(`button`,{type:`button`,className:`v2-primary wide`,disabled:q,onClick:H,children:[q?(0,T.jsx)(l,{className:`spin`,size:17}):(0,T.jsx)(d,{size:17}),` `,q?`Cargando…`:`Iniciar Python`]}),(0,T.jsx)(`div`,{className:`v2-python-all-steps`,children:G.map((e,t)=>{let n=e.guidedCode||e.code||``,r=_[e.id],i=y[e.id];return(0,T.jsxs)(`article`,{className:`v2-python-step-card ${r?`done`:i?`failed`:``}`,children:[(0,T.jsxs)(`div`,{className:`v2-python-step-title`,children:[(0,T.jsx)(`b`,{children:t+1}),(0,T.jsxs)(`div`,{children:[(0,T.jsx)(`strong`,{children:e.question}),(0,T.jsx)(`span`,{children:e.instruction})]}),r&&(0,T.jsx)(a,{size:18})]}),(0,T.jsxs)(`div`,{className:`v2-python-editor`,children:[(0,T.jsxs)(`div`,{className:`v2-python-editorbar`,children:[(0,T.jsxs)(`span`,{children:[e.id,`.py`]}),(0,T.jsxs)(`button`,{type:`button`,onClick:()=>g(t=>({...t,[e.id]:n})),children:[(0,T.jsx)(s,{size:14}),` Restaurar`]})]}),(0,T.jsx)(`textarea`,{"aria-label":`Código Python: ${e.question}`,value:h[e.id]??n,onChange:t=>{g(n=>({...n,[e.id]:t.target.value})),v(t=>{let n={...t};return delete n[e.id],n})},spellCheck:`false`})]}),(0,T.jsxs)(`button`,{type:`button`,className:`v2-secondary`,disabled:!K||q,onClick:()=>U(e),children:[q&&z.current?.stepId===e.id?(0,T.jsx)(l,{className:`spin`,size:16}):(0,T.jsx)(o,{size:16}),` `,r?`Ejecutar de nuevo`:`Ejecutar`]}),i&&(0,T.jsxs)(`div`,{className:`v2-python-output error`,children:[(0,T.jsxs)(`div`,{children:[(0,T.jsx)(d,{size:14}),` error de Python`]}),(0,T.jsx)(`pre`,{children:i}),(0,T.jsx)(`small`,{children:`Este bloque todavía no cuenta como completado. Corrige el código o pulsa “Restaurar” y ejecútalo de nuevo.`})]}),r&&(0,T.jsxs)(`div`,{className:`v2-python-result`,children:[(0,T.jsxs)(`div`,{className:`v2-python-output`,children:[(0,T.jsxs)(`div`,{children:[(0,T.jsx)(d,{size:14}),` resultado`]}),(0,T.jsx)(`pre`,{children:r.output})]}),r.image&&(0,T.jsxs)(`figure`,{className:`v2-python-figure`,children:[(0,T.jsx)(`img`,{src:r.image,alt:`Gráfica producida por el código Python`}),(0,T.jsx)(`figcaption`,{children:`Resultado gráfico.`})]})]})]},e.id)})}),C&&(0,T.jsx)(`div`,{className:`v2-alert error`,children:C}),(0,T.jsx)(`button`,{type:`button`,className:`v2-primary wide`,disabled:!J||N||F,onClick:W,children:F?`Laboratorio completado · +${c} puntos`:N?`Cerrando laboratorio…`:J?`Terminar laboratorio · +${c} puntos`:`Ejecuta todos los bloques para terminar`}),(0,T.jsx)(`small`,{className:`v2-python-footnote`,children:`Las técnicas avanzadas quedan fuera de la ruta principal. El objetivo aquí es entender la idea, no memorizar nombres.`})]})}var F={t_learner:`T-Learner`,dr_learner:`DR-Learner`,causal_forest:`CausalForestDML`},I=e=>Number(e).toLocaleString(`es-CO`,{minimumFractionDigits:2,maximumFractionDigits:2});function L(){let e=g;if(!e)return(0,T.jsxs)(`section`,{className:`v2-tool`,"aria-live":`polite`,children:[(0,T.jsx)(`div`,{className:`v2-kicker`,children:`ECONML V2`}),(0,T.jsx)(`h2`,{children:`Benchmark no disponible todavía`}),(0,T.jsx)(`p`,{children:`Solo se muestran métricas producidas por un entrenamiento real y verificado.`})]});let t=Object.keys(F),n=Math.max(1,...t.map(t=>e.metrics[t].cate_rmse_points));return(0,T.jsxs)(`section`,{className:`v2-tool v2-econml-report`,"aria-label":`Resultados EconML reales de CAMPUS V2`,children:[(0,T.jsx)(`div`,{className:`v2-kicker`,children:`ENTRENADO Y EVALUADO · ECONML REAL · SOLO V2`}),(0,T.jsx)(`h2`,{children:`¿Qué estimador recupera mejor el efecto causal por perfil?`}),(0,T.jsx)(`p`,{children:`TLearner, DRLearner y CausalForestDML se ajustaron en Python 3.11 sobre el experimento académico sintético. Aquí exploramos sus estimaciones reservadas.`}),(0,T.jsxs)(`div`,{className:`v2-econml-meta`,children:[(0,T.jsxs)(`span`,{children:[`EconML `,e.provenance.econml_version]}),(0,T.jsxs)(`span`,{children:[e.provenance.train_rows,` entrenamiento`]}),(0,T.jsxs)(`span`,{children:[e.provenance.holdout_rows,` validación`]}),(0,T.jsxs)(`span`,{children:[`Semilla `,e.provenance.seed]})]}),(0,T.jsx)(`div`,{className:`v2-econml-scroll`,children:(0,T.jsxs)(`table`,{className:`v2-econml-table`,children:[(0,T.jsx)(`thead`,{children:(0,T.jsxs)(`tr`,{children:[(0,T.jsx)(`th`,{children:`Perfil académico`}),t.map(e=>(0,T.jsx)(`th`,{children:F[e]},e))]})}),(0,T.jsx)(`tbody`,{children:e.segments.map(e=>(0,T.jsxs)(`tr`,{children:[(0,T.jsx)(`th`,{children:e.name}),t.map(t=>(0,T.jsxs)(`td`,{children:[I(e[t]),` pt`]},t))]},e.segment))})]})}),(0,T.jsx)(`div`,{className:`v2-econml-metrics`,children:t.map(t=>{let r=e.metrics[t].cate_rmse_points;return(0,T.jsxs)(`article`,{className:t===e.best_holdout_rmse?`winner`:``,children:[(0,T.jsxs)(`span`,{children:[F[t],` · Error CATE (RMSE)`]}),(0,T.jsxs)(`strong`,{children:[I(r),` puntos`]}),(0,T.jsx)(`div`,{className:`v2-econml-track`,children:(0,T.jsx)(`i`,{style:{width:100*r/n+`%`}})})]},t)})}),(0,T.jsxs)(`p`,{className:`v2-econml-note`,children:[`Menor error en este holdout: `,(0,T.jsx)(`b`,{children:F[e.best_holdout_rmse]}),`. Los valores son estimaciones: un algoritmo no reemplaza aleatorización, controles adecuados ni validación. EconML no se está ejecutando en el navegador.`]})]})}var R=e=>Number(e||0);function z({kicker:e=`HERRAMIENTA DE ANÁLISIS`,title:t,question:n,children:r,footer:i}){return(0,T.jsxs)(`section`,{className:`v2-tool`,children:[(0,T.jsxs)(`div`,{className:`v2-tool-head`,children:[(0,T.jsxs)(`div`,{children:[(0,T.jsx)(`div`,{className:`v2-kicker`,children:e}),(0,T.jsx)(`h2`,{children:t})]}),n&&(0,T.jsx)(`div`,{className:`v2-tool-question`,children:n})]}),r,i&&(0,T.jsx)(`p`,{className:`v2-tool-footer`,children:i})]})}function B({dag:e}){let t=e?.adjust_options||[],[n,r]=(0,f.useState)(t[0]?.id||`none`),i=t.find(e=>e.id===n)||t[0],a=e?.nodes||[],o={risk:[90,90],treat:[330,70],outcome:[570,90],mediator:[330,230],collider:[570,230]};return(0,T.jsx)(z,{title:`DAG Lab`,question:`¿Qué variable debes ajustar para cerrar el camino de confusión sin abrir otro problema?`,children:(0,T.jsxs)(`div`,{className:`v2-dag-wrap`,children:[(0,T.jsxs)(`svg`,{className:`v2-dag`,viewBox:`0 0 660 300`,children:[(e?.edges||[]).map((e,t)=>{let n=o[e.from],r=o[e.to];return!n||!r?null:(0,T.jsxs)(`g`,{children:[(0,T.jsx)(`line`,{className:e.kind||``,x1:n[0],y1:n[1],x2:r[0],y2:r[1]}),(0,T.jsx)(`polygon`,{points:`${r[0]},${r[1]} ${r[0]-12},${r[1]-6} ${r[0]-12},${r[1]+6}`})]},t)}),a.map(e=>{let t=o[e.id]||[0,0];return(0,T.jsxs)(`g`,{className:i?.highlights?.includes(e.id)?`dag-node active`:`dag-node`,children:[(0,T.jsx)(`rect`,{x:t[0]-62,y:t[1]-24,width:`124`,height:`48`,rx:`14`}),(0,T.jsx)(`text`,{x:t[0],y:t[1]+5,textAnchor:`middle`,children:e.label})]},e.id)})]}),(0,T.jsx)(`div`,{className:`v2-dag-options`,children:t.map(e=>(0,T.jsx)(`button`,{className:n===e.id?`selected`:``,onClick:()=>r(e.id),children:e.label},e.id))}),i&&(0,T.jsxs)(`div`,{className:i.good?`v2-alert good`:`v2-alert warn`,children:[(0,T.jsx)(`b`,{children:i.good?`Comparación más defendible`:`Cuidado`}),(0,T.jsx)(`span`,{children:i.explanation})]})]})})}function V({segments:e=[],choices:t={},capacity:n=15e3}){let r=e.filter(e=>t[e.id]===`treat`),i=r.reduce((e,t)=>e+R(t.audience),0),a=r.length>0&&r.every(e=>e.effect!==void 0||e.effect_pp!==void 0)?r.reduce((e,t)=>e+(R(t.effect??t.effect_pp)/100*R(t.audience)*R(t.value??t.value_per_result)-R(t.audience)*R(t.cost??t.unit_cost)),0):null;return(0,T.jsxs)(`div`,{className:`v2-policy-meter`,children:[(0,T.jsxs)(`div`,{children:[(0,T.jsx)(`span`,{children:`Capacidad`}),(0,T.jsxs)(`b`,{children:[i.toLocaleString(),` / `,n.toLocaleString()]}),(0,T.jsx)(`div`,{className:`v2-capacity`,children:(0,T.jsx)(`i`,{style:{width:`${Math.min(100,i/n*100)}%`}})})]}),(0,T.jsxs)(`div`,{children:[(0,T.jsx)(`span`,{children:`Impacto académico estimado`}),(0,T.jsx)(`b`,{children:a===null?`por estimar`:a.toFixed(1)})]}),(0,T.jsxs)(`div`,{children:[(0,T.jsx)(`span`,{children:`Perfiles priorizados`}),(0,T.jsx)(`b`,{children:r.length})]})]})}function H({round:e,state:t,analysis:n,labKey:r,labPoints:i,onComplete:a,simulation:o=!1}){let s=n?.team_tools;if(!s)return null;let c=r||(e===1?`prediction`:e===2?`comparison`:`experiment`),l={prediction:`Entrena un buen predictor y descubre qué pregunta causal todavía no puede responder.`,"ab-test":`Aleatoriza, estima ATE y observa cómo cambia la estimación entre muestras.`,dag:`Usa el DAG para distinguir confusores, mediadores y colliders antes de ajustar.`,dml:`Construye Double Machine Learning paso a paso: modelos auxiliares, residuos y efecto.`,heterogeneity:`Pasa del ATE al CATE y estima para quién funciona mejor la intervención.`,"model-battle":`Compara S/T/DR de Pyodide contra los tres estimadores EconML reales evaluados fuera de muestra.`}[c]||`Ejecuta el análisis causal y conecta cada resultado con la decisión.`;return(0,T.jsxs)(`section`,{className:`v2-evidence-lab single-page`,children:[(0,T.jsxs)(`div`,{className:`v2-step compact`,children:[(0,T.jsx)(`b`,{children:`LABORATORIO`}),(0,T.jsx)(`span`,{children:l})]}),c===`dag`&&s?.dag&&(0,T.jsx)(B,{dag:s.dag}),c===`model-battle`&&(0,T.jsx)(L,{}),(0,T.jsx)(P,{round:e,state:t,analysis:n,labKey:r,labPoints:i,onComplete:a,simulation:o})]})}export{V as n,N as r,H as t};