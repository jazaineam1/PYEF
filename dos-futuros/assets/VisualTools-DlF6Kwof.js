import{r as e}from"./modulepreload-polyfill-DHZR_UKa.js";import{t}from"./react-R8TFQQWi.js";import{c as n,m as r}from"./api-BTrnDMQi.js";import{t as i}from"./check-DH71eEr0.js";import{n as a,t as o}from"./rotate-ccw-MbRMD-22.js";import{t as s}from"./jsx-runtime-COg3ANyx.js";import{n as c,t as l}from"./EconMLV2Panel-Aksq8sYC.js";var u={name:`loader-circle`,size:24,node:[[`path`,{d:`M21 12a9 9 0 1 1-6.219-8.56`,key:`13zald`}]],aliases:[`loader-2`]};u.node;var d=r(u),f={name:`terminal`,size:24,node:[[`path`,{d:`M12 19h8`,key:`baeox8`}],[`path`,{d:`m4 17 6-6-6-6`,key:`1yngyt`}]]};f.node;var p=r(f),m=e(t(),1),h=e=>Number(e||0),g=(e,t,n)=>Math.max(t,Math.min(n,e)),_=e=>{let t=h(e);return t>10?t/100:t},v=(e,t=0)=>Number.isFinite(Number(e?.grade))?Number(e.grade):Number.isFinite(Number(e?.nota_final))?Number(e.nota_final):g(20+4.2*_(e?.tenure??e?.pga_previo)+.7*h(e?.usage??e?.horas_estudio)-.8*h(e?.bugs??e?.fatiga)+.25*h(e?.discount??e?.horas_sueno)+(h(e?.renewed??e?.aprobo)?5:-2)+(t*17%7-3),0,50),y=e=>(e||[]).map((e,t)=>({id:String(e.id||``),estudiante:String(e.name||e.id||``),arquetipo:String(e.segment||``),horas_estudio:h(e.study_hours??e.usage),fatiga:h(e.fatigue??e.bugs),horas_sueno:h(e.sleep_hours??e.discount),pga_previo:_(e.pga_prev??e.tenure),probabilidad_aprobar:h(e.score),tamano_grupo:h(e.cohort_size||100),nota_final:v(e,t)})),b=e=>(e||[]).map((e,t)=>({pga_previo:_(e.pga_prev??e.tenure),horas_estudio:h(e.study_hours??e.usage),horas_sueno:h(e.sleep_hours??e.sleep??6),fatiga:h(e.fatigue??e.risk??e.bugs),complejidad:h(e.complexity??e.risk??5),recibio_apoyo:!!e.treated,aprobo:h(e.passed??e.renewed),nota_final:v(e,t),arquetipo:String(e.segment||e.archetype||`General`)})),x=e=>(e||[]).map(e=>({id:String(e.id||``),arquetipo:String(e.name||e.id||``),estudiantes:h(e.audience),nivel_riesgo:String(e.risk||``),efecto_pp:h(e.effect_pp??e.effect),ci_low:h(e.ci_low),ci_high:h(e.ci_high)}));function S(e,t={},n={},r=null){let i=n?.team_tools||{},a=r||`prediction`;return a===`prediction`?{title:`Un predictor puede ser excelente y responder la pregunta equivocada`,context:{perfiles:y(t.team_pool||t.packet||[]),entrenamiento:b(i.ml_training||[])},steps:[{id:`fit`,label:`1 · Predecir`,question:`¿Qué tan bien podemos predecir la nota final?`,instruction:`Entrena un modelo predictivo y mira MAE y R². Todavía no hablamos de causalidad.`,guidedCode:`import pandas as pd
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
print("Para eso necesitamos imaginar dos futuros: con apoyo y sin apoyo.")`}]}:a===`ab-test`?{title:`A/B: mismo efecto verdadero, estimaciones distintas`,context:{experimento:b(i.experiment_rows||[])},steps:[{id:`ate`,label:`1 · Comparar`,question:`¿Cuánto cambió la nota en tratamiento vs. control?`,instruction:`Como la asignación fue aleatoria, la diferencia de medias tiene interpretación causal bajo el diseño.`,guidedCode:`import pandas as pd

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
print("\\nUn IC resume la incertidumbre de la estimación; no significa que todos cambien dentro de ese rango.")`}]}:a===`dag`?{title:`DAG Detective: controlar más no siempre es mejor`,context:{historico:b(i.observational_rows||[]),dag:i.dag||{}},steps:[{id:`raw`,label:`1 · Sospechar`,question:`¿Qué dice la comparación cruda en datos observacionales?`,instruction:`Compara primero apoyo vs. no apoyo sin ajustar. No la llames todavía “efecto”.`,guidedCode:`import pandas as pd

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
print("Este miniexperimento NO estima efectos en el histórico observacional.")`}]}:a===`dml`?{title:`Double Machine Learning construido paso a paso`,context:{historico:b(i.observational_rows||[])},steps:[{id:`nuisance`,label:`1 · Explicar T y Y`,question:`¿Qué parte del tratamiento y de la nota puede explicar X?`,instruction:`Entrena dos modelos auxiliares: uno para T y otro para Y.`,guidedCode:`import pandas as pd
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
print("WOW: buen R² predictivo no garantiza una buena estimación causal.")`}]}:a===`heterogeneity`?{title:`ATE no es CATE: el promedio puede esconder a quién ayudar`,context:{experimento:b(i.experiment_rows||[]),segmentos:x(i.segments||[])},steps:[{id:`ate`,label:`1 · Promedio`,question:`¿Cuál es el efecto promedio del apoyo?`,instruction:`Calcula primero ATE como diferencia de medias del experimento.`,guidedCode:`import pandas as pd

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
print("un modelo aprende el futuro tratado y otro el futuro control.")`}]}:a===`model-battle`?{title:`Boss final: comparar estimadores sin olvidar identificación`,context:{experimento:b(i.experiment_rows||[]),comparador:c?.segments||[],procedencia:c?.provenance||null,metricas:c?.metrics||null,campeon:c?.best_holdout_rmse||null},steps:[{id:`s-vs-t`,label:`1 · S vs T`,question:`¿Cómo cambian las estimaciones con dos estrategias de meta-learning?`,instruction:`Compara S-Learner y T-Learner usando el mismo Random Forest base.`,guidedCode:`import pandas as pd
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
print("Este Python analiza el output verificado; EconML se entreno fuera de Pyodide.")`}]}:null}var C=s(),w=45e3,T=null,E=!1,D=!1,O=null;function k(){return T||(T=new Worker(new URL(``+new URL(`pyodide.worker-D7QpOAeM.js`,import.meta.url).href,``+import.meta.url)),T.onmessage=e=>{e.data?.type===`ready`&&(E=!0,D=!1),O?.(e)},T.onerror=e=>{E=!1,D=!1,O?.({data:{type:`error`,error:e.message||`Python no disponible`}})},T)}function A(){T?.terminate(),T=null,E=!1,D=!1}function j(){if(!(E||D)){D=!0;try{k().postMessage({type:`init`})}catch{D=!1}}}function M({round:e,state:t,analysis:r,labKey:s,labPoints:c=20,onComplete:l,simulation:u=!1}){let f=(0,m.useMemo)(()=>S(e,t,r,s),[e,t,r,s]),[h,g]=(0,m.useState)({}),[_,v]=(0,m.useState)({}),[y,b]=(0,m.useState)({}),[x,T]=(0,m.useState)(`idle`),[j,M]=(0,m.useState)(``),[N,P]=(0,m.useState)(!1),[F,I]=(0,m.useState)(!1),L=(0,m.useRef)(null),R=(0,m.useRef)(null),z=(0,m.useRef)(null),B=(0,m.useRef)(null);(0,m.useEffect)(()=>{let e={};for(let t of f?.steps||[])e[t.id]=t.guidedCode||t.code||``;g(e),v({}),b({}),M(``),T(`idle`),P(!1),I(!1),clearTimeout(R.current)},[e,f?.title]),(0,m.useEffect)(()=>()=>{clearTimeout(R.current),O===B.current&&(O=null)},[]);function V(){if(L.current)return L.current;let t=k();return O=B.current=async t=>{let r=t.data||{};if(r.type===`ready`&&(T(`ready`),M(``)),r.type===`result`){clearTimeout(R.current);let t=z.current;if(!t||t.stepId!==r.requestId)return;let i=t.stepId;try{if(!u){let r=Math.round(performance.now()-t.started);await n(`v2-submit`,{action:`learning_event`,round:e,event_type:`python_run`,payload:{step_id:i,code_changed:t.codeChanged,duration_ms:r,mode:`guided`}})}v(e=>({...e,[i]:{output:r.output||``,image:r.image||null}})),b(e=>({...e,[i]:``})),T(`ready`),M(``)}catch(e){v(e=>{let t={...e};return delete t[i],t}),b(t=>({...t,[i]:`Python terminó, pero el servidor no confirmó la evidencia: `+e.message})),T(`ready`)}finally{z.current=null}}if(r.type===`execution_error`){clearTimeout(R.current);let e=z.current?.stepId||r.requestId;v(t=>{let n={...t};return delete n[e],n}),b(t=>({...t,[e]:[r.output,r.error].filter(Boolean).join(`
`)})),T(`ready`),M(``),z.current=null}r.type===`error`&&(clearTimeout(R.current),T(`error`),M(r.error||`Error ejecutando Python`),z.current=null)},L.current=t,E&&(T(`ready`),M(``)),t}function H(){T(`loading`),M(``);let e=V();E?T(`ready`):D||(D=!0,e.postMessage({type:`init`}))}function U(e){let t=V(),n=e.guidedCode||e.code||``,r=h[e.id]??n;T(`running`),M(``),b(t=>({...t,[e.id]:``})),v(t=>{let n={...t};return delete n[e.id],n}),z.current={stepId:e.id,started:performance.now(),codeChanged:r!==n},t.postMessage({type:`run`,requestId:e.id,code:r,context:f?.context||{}}),clearTimeout(R.current),R.current=setTimeout(()=>{A(),L.current=null,z.current=null,T(`error`),M(`La ejecución superó 45 segundos y fue detenida. Restaura el ejemplo e inténtalo otra vez.`)},w)}async function W(){if(J&&!N){P(!0),M(``);try{if(u){I(!0),await l?.();return}await n(`v2-submit`,{action:`lab_complete`,round:e}),await l?.()}catch(e){M(e.message)}finally{P(!1)}}}if(!f)return null;let G=f.steps||[],K=x===`ready`||x===`running`,q=x===`loading`||x===`running`,J=G.length>0&&G.every(e=>_[e.id]);return(0,C.jsxs)(`section`,{className:`v2-python-lab single-page`,children:[(0,C.jsxs)(`div`,{className:`v2-python-head`,children:[(0,C.jsxs)(`div`,{children:[(0,C.jsx)(`div`,{className:`v2-kicker`,children:`LABORATORIO · TODO EN ESTA PÁGINA`}),(0,C.jsx)(`h2`,{children:f.title})]}),(0,C.jsxs)(`div`,{className:`v2-python-status ${x}`,children:[(0,C.jsx)(p,{size:15}),(0,C.jsx)(`span`,{children:x===`idle`?`Python apagado`:x===`loading`?`Cargando Python`:x===`running`?`Ejecutando`:`Python listo`})]})]}),(0,C.jsx)(`div`,{className:`v2-alert hint`,children:(0,C.jsx)(`span`,{children:`No necesitas memorizar código. Ejecuta cada bloque, mira el resultado y responde la pregunta que lo acompaña.`})}),!K&&(0,C.jsxs)(`button`,{type:`button`,className:`v2-primary wide`,disabled:q,onClick:H,children:[q?(0,C.jsx)(d,{className:`spin`,size:17}):(0,C.jsx)(p,{size:17}),` `,q?`Cargando…`:`Iniciar Python`]}),(0,C.jsx)(`div`,{className:`v2-python-all-steps`,children:G.map((e,t)=>{let n=e.guidedCode||e.code||``,r=_[e.id],s=y[e.id];return(0,C.jsxs)(`article`,{className:`v2-python-step-card ${r?`done`:s?`failed`:``}`,children:[(0,C.jsxs)(`div`,{className:`v2-python-step-title`,children:[(0,C.jsx)(`b`,{children:t+1}),(0,C.jsxs)(`div`,{children:[(0,C.jsx)(`strong`,{children:e.question}),(0,C.jsx)(`span`,{children:e.instruction})]}),r&&(0,C.jsx)(i,{size:18})]}),(0,C.jsxs)(`div`,{className:`v2-python-editor`,children:[(0,C.jsxs)(`div`,{className:`v2-python-editorbar`,children:[(0,C.jsxs)(`span`,{children:[e.id,`.py`]}),(0,C.jsxs)(`button`,{type:`button`,onClick:()=>g(t=>({...t,[e.id]:n})),children:[(0,C.jsx)(o,{size:14}),` Restaurar`]})]}),(0,C.jsx)(`textarea`,{"aria-label":`Código Python: ${e.question}`,value:h[e.id]??n,onChange:t=>{g(n=>({...n,[e.id]:t.target.value})),v(t=>{let n={...t};return delete n[e.id],n})},spellCheck:`false`})]}),(0,C.jsxs)(`button`,{type:`button`,className:`v2-secondary`,disabled:!K||q,onClick:()=>U(e),children:[q&&z.current?.stepId===e.id?(0,C.jsx)(d,{className:`spin`,size:16}):(0,C.jsx)(a,{size:16}),` `,r?`Ejecutar de nuevo`:`Ejecutar`]}),s&&(0,C.jsxs)(`div`,{className:`v2-python-output error`,children:[(0,C.jsxs)(`div`,{children:[(0,C.jsx)(p,{size:14}),` error de Python`]}),(0,C.jsx)(`pre`,{children:s}),(0,C.jsx)(`small`,{children:`Este bloque todavía no cuenta como completado. Corrige el código o pulsa “Restaurar” y ejecútalo de nuevo.`})]}),r&&(0,C.jsxs)(`div`,{className:`v2-python-result`,children:[(0,C.jsxs)(`div`,{className:`v2-python-output`,children:[(0,C.jsxs)(`div`,{children:[(0,C.jsx)(p,{size:14}),` resultado`]}),(0,C.jsx)(`pre`,{children:r.output})]}),r.image&&(0,C.jsxs)(`figure`,{className:`v2-python-figure`,children:[(0,C.jsx)(`img`,{src:r.image,alt:`Gráfica producida por el código Python`}),(0,C.jsx)(`figcaption`,{children:`Resultado gráfico.`})]})]})]},e.id)})}),j&&(0,C.jsx)(`div`,{className:`v2-alert error`,children:j}),(0,C.jsx)(`button`,{type:`button`,className:`v2-primary wide`,disabled:!J||N||F,onClick:W,children:F?`Laboratorio completado · +${c} puntos`:N?`Cerrando laboratorio…`:J?`Terminar laboratorio · +${c} puntos`:`Ejecuta todos los bloques para terminar`}),(0,C.jsx)(`small`,{className:`v2-python-footnote`,children:`Las técnicas avanzadas quedan fuera de la ruta principal. El objetivo aquí es entender la idea, no memorizar nombres.`})]})}function N({kicker:e=`HERRAMIENTA DE ANÁLISIS`,title:t,question:n,children:r,footer:i}){return(0,C.jsxs)(`section`,{className:`v2-tool`,children:[(0,C.jsxs)(`div`,{className:`v2-tool-head`,children:[(0,C.jsxs)(`div`,{children:[(0,C.jsx)(`div`,{className:`v2-kicker`,children:e}),(0,C.jsx)(`h2`,{children:t})]}),n&&(0,C.jsx)(`div`,{className:`v2-tool-question`,children:n})]}),r,i&&(0,C.jsx)(`p`,{className:`v2-tool-footer`,children:i})]})}function P({dag:e}){let t=e?.adjust_options||[],[n,r]=(0,m.useState)(t[0]?.id||`none`),i=t.find(e=>e.id===n)||t[0],a=e?.nodes||[],o={risk:[90,90],treat:[330,70],outcome:[570,90],mediator:[330,230],collider:[570,230]};return(0,C.jsx)(N,{title:`DAG Lab`,question:`¿Qué variable debes ajustar para cerrar el camino de confusión sin abrir otro problema?`,children:(0,C.jsxs)(`div`,{className:`v2-dag-wrap`,children:[(0,C.jsxs)(`svg`,{className:`v2-dag`,viewBox:`0 0 660 300`,children:[(e?.edges||[]).map((e,t)=>{let n=o[e.from],r=o[e.to];return!n||!r?null:(0,C.jsxs)(`g`,{children:[(0,C.jsx)(`line`,{className:e.kind||``,x1:n[0],y1:n[1],x2:r[0],y2:r[1]}),(0,C.jsx)(`polygon`,{points:`${r[0]},${r[1]} ${r[0]-12},${r[1]-6} ${r[0]-12},${r[1]+6}`})]},t)}),a.map(e=>{let t=o[e.id]||[0,0];return(0,C.jsxs)(`g`,{className:i?.highlights?.includes(e.id)?`dag-node active`:`dag-node`,children:[(0,C.jsx)(`rect`,{x:t[0]-62,y:t[1]-24,width:`124`,height:`48`,rx:`14`}),(0,C.jsx)(`text`,{x:t[0],y:t[1]+5,textAnchor:`middle`,children:e.label})]},e.id)})]}),(0,C.jsx)(`div`,{className:`v2-dag-options`,children:t.map(e=>(0,C.jsx)(`button`,{className:n===e.id?`selected`:``,onClick:()=>r(e.id),children:e.label},e.id))}),i&&(0,C.jsxs)(`div`,{className:i.good?`v2-alert good`:`v2-alert warn`,children:[(0,C.jsx)(`b`,{children:i.good?`Comparación más defendible`:`Cuidado`}),(0,C.jsx)(`span`,{children:i.explanation})]})]})})}function F({round:e,state:t,analysis:n,labKey:r,labPoints:i,onComplete:a,simulation:o=!1}){let s=n?.team_tools;if(!s)return null;let c=r||(e===1?`prediction`:e===2?`comparison`:`experiment`),u={prediction:`Entrena un buen predictor y descubre qué pregunta causal todavía no puede responder.`,"ab-test":`Aleatoriza, estima ATE y observa cómo cambia la estimación entre muestras.`,dag:`Usa el DAG para distinguir confusores, mediadores y colliders antes de ajustar.`,dml:`Construye Double Machine Learning paso a paso: modelos auxiliares, residuos y efecto.`,heterogeneity:`Pasa del ATE al CATE y estima para quién funciona mejor la intervención.`,"model-battle":`Compara S/T/DR de Pyodide contra los tres estimadores EconML reales evaluados fuera de muestra.`}[c]||`Ejecuta el análisis causal y conecta cada resultado con la decisión.`;return(0,C.jsxs)(`section`,{className:`v2-evidence-lab single-page`,children:[(0,C.jsxs)(`div`,{className:`v2-step compact`,children:[(0,C.jsx)(`b`,{children:`LABORATORIO`}),(0,C.jsx)(`span`,{children:u})]}),c===`dag`&&s?.dag&&(0,C.jsx)(P,{dag:s.dag}),c===`model-battle`&&(0,C.jsx)(l,{}),(0,C.jsx)(M,{round:e,state:t,analysis:n,labKey:r,labPoints:i,onComplete:a,simulation:o})]})}export{j as n,F as t};