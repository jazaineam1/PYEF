import{_ as e,c as t,h as n,m as r,v as i}from"./api-DpGKNp4c.js";import{n as a,t as o}from"./rotate-ccw-QD2CwPaz.js";var s={name:`code-xml`,size:24,node:[[`path`,{d:`m18 16 4-4-4-4`,key:`1inbqp`}],[`path`,{d:`m6 8-4 4 4 4`,key:`15zrgr`}],[`path`,{d:`m14.5 4-5 16`,key:`e7oirm`}]],aliases:[`code-2`]};s.node;var c=n(s),l={name:`loader-circle`,size:24,node:[[`path`,{d:`M21 12a9 9 0 1 1-6.219-8.56`,key:`13zald`}]],aliases:[`loader-2`]};l.node;var u=n(l),d={name:`route`,size:24,node:[[`circle`,{cx:`6`,cy:`19`,r:`3`,key:`1kj8tv`}],[`path`,{d:`M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15`,key:`1d8sl`}],[`circle`,{cx:`18`,cy:`5`,r:`3`,key:`gq8acd`}]]};d.node;var f=n(d),p={name:`terminal`,size:24,node:[[`path`,{d:`M12 19h8`,key:`baeox8`}],[`path`,{d:`m4 17 6-6-6-6`,key:`1yngyt`}]]};p.node;var m=n(p),h=i(e(),1),g=e=>Number(e||0),_=e=>(e||[]).map(e=>({id:String(e.id||``),cohorte:String(e.name||e.id||``),segmento:String(e.segment||``),uso:g(e.usage),incidentes:g(e.bugs),descuento:g(e.discount),antiguedad:g(e.tenure),probabilidad_renovacion:g(e.score),tamano_cohorte:g(e.cohort_size||1e3)})),v=e=>(e||[]).map(e=>({riesgo_previo:g(e.risk),uso:g(e.usage),antiguedad:g(e.tenure),recibio_bono:!!e.treated,renovo:g(e.renewed)})),y=e=>(e||[]).map(e=>({segmento:String(e.segment||``),uso:g(e.usage),antiguedad:g(e.tenure),recibio_bono:!!e.treated,renovo:g(e.renewed)})),b=e=>(e||[]).map(e=>({id:String(e.id||``),segmento:String(e.name||e.id||``),audiencia:g(e.audience),riesgo:String(e.risk||``),valor_renovacion_cop:g(e.value_per_result??e.value),costo_bono_cop:g(e.unit_cost??e.cost)}));function x(e,t={},n={}){let r=n?.team_tools||{};return e===1?{title:`¿Qué te está diciendo realmente el modelo?`,context:{cohortes:_(t.team_pool||[]),entrenamiento:(r.ml_training||[]).map(e=>({uso:g(e.usage),incidentes:g(e.bugs),descuento:g(e.discount),antiguedad:g(e.tenure),renovo:g(e.renewed)}))},steps:[{id:`rank`,label:`1 · Ordenar`,question:`¿Quién parece más probable que renueve?`,instruction:`Empieza con algo simple: ordena la probabilidad que ya produjo el modelo.`,guidedCode:`import pandas as pd

df = pd.DataFrame(payload["cohortes"])

salida = df[["id","cohorte","probabilidad_renovacion"]].copy()
salida["probabilidad_renovacion"] = (100*salida["probabilidad_renovacion"]).round(1)

print(salida.sort_values("probabilidad_renovacion", ascending=False).head(10).to_string(index=False))

print("
Pregunta:")
print("¿Esta tabla dice quién CAMBIARÁ por recibir el bono?")`,advancedCode:`import pandas as pd
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
print("
Top 10 por modelo reentrenado:")
print(cohortes[["id","cohorte","p_modelo"]].sort_values("p_modelo",ascending=False).head(10).to_string(index=False))

print("
Un AUC alto evalúa predicción. No identifica el efecto del bono.")`},{id:`visual`,label:`2 · Ver`,question:`¿Una probabilidad alta es lo mismo que un gran cambio por intervenir?`,instruction:`Grafica las probabilidades. Fíjate en lo que la gráfica NO contiene.`,guidedCode:`import pandas as pd
import matplotlib.pyplot as plt

df = pd.DataFrame(payload["cohortes"]).sort_values("probabilidad_renovacion")

plt.figure(figsize=(8,4))
plt.bar(df["id"],100*df["probabilidad_renovacion"])
plt.ylabel("Probabilidad estimada de renovación (%)")
plt.xlabel("Cohorte")
plt.xticks(rotation=60)
plt.tight_layout()

print("La gráfica responde: ¿quién probablemente renovará?")
print("Todavía no responde: ¿quién renovará GRACIAS al bono?")`,advancedCode:`import pandas as pd
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
print("No observa dos futuros de la misma cohorte.")`}]}:e===2?{title:`¿La comparación es justa?`,context:{historico:v(r.observational_rows||[])},steps:[{id:`raw`,label:`1 · Comparar`,question:`¿Qué parece decir el histórico si sólo comparamos bono vs. no bono?`,instruction:`Haz la comparación directa. Todavía no la llames “efecto”.`,guidedCode:`import pandas as pd

df = pd.DataFrame(payload["historico"])

tasas = df.groupby("recibio_bono")["renovo"].mean()*100
print("Sin bono :", round(tasas.loc[False],1), "%")
print("Con bono :", round(tasas.loc[True],1), "%")
print("Diferencia observada:", round(tasas.loc[True]-tasas.loc[False],1), "pp")

print("
¿Esto prueba que el bono empeoró la renovación?")`,advancedCode:`import pandas as pd

df = pd.DataFrame(payload["historico"])
crudo = df.groupby("recibio_bono")["renovo"].mean()

print("Diferencia cruda:", round(100*(crudo.loc[True]-crudo.loc[False]),1), "pp")
print("
Probabilidad de recibir bono según riesgo previo:")
print((100*df.groupby("riesgo_previo")["recibio_bono"].mean()).round(1).to_string())`},{id:`stratify`,label:`2 · Igualar`,question:`¿Qué pasa si comparamos clientes con un riesgo previo parecido?`,instruction:`Separa por riesgo previo y vuelve a comparar dentro de cada grupo.`,guidedCode:`import pandas as pd

df = pd.DataFrame(payload["historico"])

tabla = (
    df.groupby(["riesgo_previo","recibio_bono"])["renovo"]
      .mean().mul(100).round(1).unstack()
)

print("Renovación dentro de cada nivel de riesgo (%)")
print(tabla.to_string())

print("
La idea importante:")
print("antes de comparar resultados, pregunta si los grupos ya eran distintos.")`,advancedCode:`import pandas as pd
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
print("
Término avanzado: propensity score + IPW.")
print("La técnica ayuda a construir comparabilidad; no elimina los supuestos.")`},{id:`overlap`,label:`3 · Comprobar`,question:`¿Existen clientes parecidos en ambos grupos?`,instruction:`En modo guiado mira la distribución del riesgo. El modo avanzado muestra overlap con propensity score.`,guidedCode:`import pandas as pd
import matplotlib.pyplot as plt

df = pd.DataFrame(payload["historico"])

tabla = pd.crosstab(df["riesgo_previo"],df["recibio_bono"],normalize="index")*100
print("Distribución de bono dentro de cada riesgo (%)")
print(tabla.round(1).to_string())

tabla.plot(kind="bar",figsize=(7,4))
plt.ylabel("% dentro del nivel de riesgo")
plt.xlabel("Riesgo previo")
plt.tight_layout()

print("
Si un nivel casi no tiene ambos grupos, la comparación se vuelve más frágil.")`,advancedCode:`import pandas as pd
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

print("Esto se conoce como overlap o soporte común.")`}]}:e===3?{title:`¿Funciona igual para todos?`,context:{experimento:y(r.experiment_rows||[]),segmentos:b(r.segments||[]),economia:r.economy||t.economy||{}},steps:[{id:`experiment`,label:`1 · Promedio`,question:`En un experimento aleatorizado, ¿cuánto cambió la renovación en promedio?`,instruction:`Compara directamente tratamiento y control.`,guidedCode:`import pandas as pd

df = pd.DataFrame(payload["experimento"])
tasas = df.groupby("recibio_bono")["renovo"].mean()*100

print("Sin bono :", round(tasas.loc[False],1), "%")
print("Con bono :", round(tasas.loc[True],1), "%")
print("Cambio promedio:", round(tasas.loc[True]-tasas.loc[False],1), "pp")`,advancedCode:`import pandas as pd
import numpy as np

df = pd.DataFrame(payload["experimento"])
y1 = df.loc[df["recibio_bono"],"renovo"].astype(float)
y0 = df.loc[~df["recibio_bono"],"renovo"].astype(float)

efecto = y1.mean()-y0.mean()
se = np.sqrt(y1.var(ddof=1)/len(y1)+y0.var(ddof=1)/len(y0))
lo,hi = efecto-1.96*se,efecto+1.96*se

print("Efecto promedio:", round(100*efecto,1), "pp")
print("IC 95%: [",round(100*lo,1),",",round(100*hi,1),"] pp")
print("
Término técnico: ATE e intervalo de confianza.")`},{id:`segments`,label:`2 · Grupos`,question:`¿Ese cambio promedio se repite en todos los segmentos?`,instruction:`Calcula la diferencia dentro de cada segmento.`,guidedCode:`import pandas as pd

df = pd.DataFrame(payload["experimento"])

tabla = (
    df.groupby(["segmento","recibio_bono"])["renovo"]
      .mean().mul(100).round(1).unstack()
)
tabla["cambio_pp"] = tabla[True]-tabla[False]

print(tabla.sort_values("cambio_pp",ascending=False).to_string())

print("
No todos los segmentos responden igual.")`,advancedCode:`import pandas as pd
from sklearn.ensemble import RandomForestRegressor

df = pd.DataFrame(payload["experimento"])
X = pd.get_dummies(df[["segmento","uso","antiguedad"]],columns=["segmento"],drop_first=False)

m1 = RandomForestRegressor(n_estimators=120,min_samples_leaf=20,random_state=42)
m0 = RandomForestRegressor(n_estimators=120,min_samples_leaf=20,random_state=42)
m1.fit(X[df["recibio_bono"]],df.loc[df["recibio_bono"],"renovo"])
m0.fit(X[~df["recibio_bono"]],df.loc[~df["recibio_bono"],"renovo"])

df["efecto_estimado"] = m1.predict(X)-m0.predict(X)
print((100*df.groupby("segmento")["efecto_estimado"].mean()).round(1).sort_values(ascending=False).to_string())

print("
Término avanzado: T-Learner para heterogeneidad del efecto.")`},{id:`money`,label:`3 · Dinero`,question:`¿Qué grupos generan valor después de pagar el bono?`,instruction:`Convierte el cambio observado por segmento a valor incremental.`,guidedCode:`import pandas as pd

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

print("
Capacidad:", int(eco["capacity"]), "clientes")`,advancedCode:`import pandas as pd
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
print("
Términos avanzados: CATE / T-Learner.")`}]}:null}var S=r(),C=2e4;function w({round:e,state:n,analysis:r}){let i=(0,h.useMemo)(()=>x(e,n,r),[e,n,r]),[s,l]=(0,h.useState)(0),[d,p]=(0,h.useState)({}),[g,_]=(0,h.useState)({}),[v,y]=(0,h.useState)(`idle`),[b,w]=(0,h.useState)(``),[T,E]=(0,h.useState)(`guided`),D=(0,h.useRef)(null),O=(0,h.useRef)(null),k=(0,h.useRef)(null);(0,h.useEffect)(()=>{let e={};for(let t of i?.steps||[])e[`guided:${t.id}`]=t.guidedCode||t.code||``,e[`advanced:${t.id}`]=t.advancedCode||t.guidedCode||t.code||``;p(e),_({}),l(0),w(``),y(`idle`),E(`guided`),clearTimeout(O.current),D.current?.terminate(),D.current=null},[e,i?.title]),(0,h.useEffect)(()=>()=>{clearTimeout(O.current),D.current?.terminate()},[]);function A(){if(D.current)return D.current;let n=new Worker(new URL(``+new URL(`pyodide.worker-D750vdn0.js`,import.meta.url).href,``+import.meta.url));return n.onmessage=n=>{let r=n.data||{};if(r.type===`ready`&&(y(`ready`),w(``)),r.type===`result`){clearTimeout(O.current);let n=k.current,i=n?.stepId||r.requestId;if(_(e=>({...e,[i]:{output:r.output||``,image:r.image||null}})),y(`ready`),w(``),n){let r=Math.round(performance.now()-n.started);t(`v2-submit`,{action:`learning_event`,round:e,event_type:`python_run`,payload:{step_id:i,code_changed:n.codeChanged,duration_ms:r,mode:T}}).catch(()=>{})}k.current=null}r.type===`error`&&(clearTimeout(O.current),y(`error`),w(r.error||`Error ejecutando Python`),k.current=null)},n.onerror=e=>{clearTimeout(O.current),y(`error`),w(e.message||`No fue posible iniciar Python en este navegador.`),k.current=null},D.current=n,n}function j(){y(`loading`),w(``),A().postMessage({type:`init`})}function M(e){let t=A(),n=`${T}:${e.id}`,r=T===`advanced`?e.advancedCode||e.guidedCode||e.code:e.guidedCode||e.code,a=d[n]??r;y(`running`),w(``),k.current={stepId:e.id,started:performance.now(),codeChanged:a!==r},t.postMessage({type:`run`,requestId:e.id,code:a,context:i?.context||{}}),clearTimeout(O.current),O.current=setTimeout(()=>{t.terminate(),D.current=null,k.current=null,y(`error`),w(`La ejecución superó 20 segundos y fue detenida. Simplifica el código o restaura el paso guiado.`)},C)}if(!i)return null;let N=i.steps||[],P=N[Math.min(s,N.length-1)];if(!P)return null;let F=v===`ready`||v===`running`,I=v===`loading`||v===`running`,L=g[P.id];return(0,S.jsxs)(`section`,{className:`v2-python-lab`,children:[(0,S.jsxs)(`div`,{className:`v2-python-head`,children:[(0,S.jsxs)(`div`,{children:[(0,S.jsx)(`div`,{className:`v2-kicker`,children:`LABORATORIO PYTHON · MODELAMIENTO REAL`}),(0,S.jsx)(`h2`,{children:i.title})]}),(0,S.jsxs)(`div`,{className:`v2-python-status ${v}`,children:[(0,S.jsx)(m,{size:15}),(0,S.jsx)(`span`,{children:v===`idle`?`apagado`:v===`loading`?`cargando stack científico`:v===`running`?`ejecutando`:`Python listo`})]})]}),(0,S.jsxs)(`div`,{className:`v2-python-modes`,children:[(0,S.jsxs)(`button`,{type:`button`,className:T===`guided`?`active`:``,onClick:()=>E(`guided`),children:[(0,S.jsx)(f,{size:14}),` Guiado`]}),(0,S.jsxs)(`button`,{type:`button`,className:T===`advanced`?`active`:``,onClick:()=>E(`advanced`),children:[(0,S.jsx)(c,{size:14}),` Profundizar`]}),(0,S.jsx)(`span`,{children:T===`guided`?`Código corto para entender la idea.`:`Opcional: aquí aparecen técnicas y términos más avanzados.`})]}),(0,S.jsx)(`div`,{className:`v2-python-step-tabs`,children:N.map((e,t)=>(0,S.jsxs)(`button`,{type:`button`,className:t===s?`active`:``,onClick:()=>l(t),children:[e.label,g[e.id]?` ✓`:``]},e.id))}),(0,S.jsxs)(`div`,{className:`v2-python-prompt`,children:[(0,S.jsx)(`strong`,{children:P.question}),(0,S.jsx)(`span`,{children:P.instruction})]}),(0,S.jsxs)(`div`,{className:`v2-python-editor`,children:[(0,S.jsxs)(`div`,{className:`v2-python-editorbar`,children:[(0,S.jsxs)(`span`,{children:[T===`guided`?`guiado`:`avanzado`,` · `,P.id,`.py`]}),(0,S.jsxs)(`button`,{type:`button`,onClick:()=>{let e=`${T}:${P.id}`,t=T===`advanced`?P.advancedCode||P.guidedCode||P.code:P.guidedCode||P.code;p(n=>({...n,[e]:t}))},children:[(0,S.jsx)(o,{size:14}),` Restaurar`]})]}),(0,S.jsx)(`textarea`,{"aria-label":`Código Python editable`,value:d[`${T}:${P.id}`]??(T===`advanced`?P.advancedCode||P.guidedCode||P.code:P.guidedCode||P.code),onChange:e=>{let t=`${T}:${P.id}`;p(n=>({...n,[t]:e.target.value}))},spellCheck:`false`})]}),(0,S.jsxs)(`div`,{className:`v2-python-actions`,children:[!F&&(0,S.jsxs)(`button`,{type:`button`,className:`v2-primary`,disabled:I,onClick:j,children:[I?(0,S.jsx)(u,{className:`spin`,size:17}):(0,S.jsx)(m,{size:17}),` `,I?`Cargando motor…`:`Iniciar Python`]}),F&&(0,S.jsxs)(`button`,{type:`button`,className:`v2-primary`,disabled:I,onClick:()=>M(P),children:[I?(0,S.jsx)(u,{className:`spin`,size:17}):(0,S.jsx)(a,{size:17}),` `,I?`Ejecutando…`:`Ejecutar este paso`]}),(0,S.jsx)(`small`,{children:`Python corre dentro del navegador. El modo guiado usa sólo lo necesario; “Profundizar” muestra técnicas opcionales. La respuesta oculta del reto no llega antes del reveal.`})]}),b&&(0,S.jsx)(`div`,{className:`v2-alert error`,children:b}),L&&(0,S.jsxs)(`div`,{className:`v2-python-result`,children:[(0,S.jsxs)(`div`,{className:`v2-python-output`,children:[(0,S.jsxs)(`div`,{children:[(0,S.jsx)(m,{size:14}),` salida Python`]}),(0,S.jsx)(`pre`,{children:L.output})]}),L.image&&(0,S.jsxs)(`figure`,{className:`v2-python-figure`,children:[(0,S.jsx)(`img`,{src:L.image,alt:`Gráfica producida por el código Python`}),(0,S.jsx)(`figcaption`,{children:`Salida gráfica generada en el navegador.`})]})]})]})}var T=e=>Number(e||0),E=e=>`${T(e)>0?`+`:``}${T(e).toFixed(+(Math.abs(T(e))<10))} pp`,D=e=>`${Math.round(T(e)*100)}%`,O=e=>new Intl.NumberFormat(`es-CO`,{style:`currency`,currency:`COP`,maximumFractionDigits:0}).format(T(e)),k=e=>({Uso:`Días activos · últimos 30 días`,"Bugs reportados":`Incidentes app · últimos 30 días`,Descuento:`Descuento vigente`,Antigüedad:`Antigüedad del cliente`})[e]||e;function A({kicker:e=`HERRAMIENTA DE ANÁLISIS`,title:t,question:n,children:r,footer:i}){return(0,S.jsxs)(`section`,{className:`v2-tool`,children:[(0,S.jsxs)(`div`,{className:`v2-tool-head`,children:[(0,S.jsxs)(`div`,{children:[(0,S.jsx)(`div`,{className:`v2-kicker`,children:e}),(0,S.jsx)(`h2`,{children:t})]}),n&&(0,S.jsx)(`div`,{className:`v2-tool-question`,children:n})]}),r,i&&(0,S.jsx)(`p`,{className:`v2-tool-footer`,children:i})]})}function j({items:e=[]}){let t=Math.max(1,...e.map(e=>Math.abs(T(e.impact))));return(0,S.jsx)(`div`,{className:`v2-mini-shap`,children:e.slice(0,4).map(e=>{let n=T(e.impact),r=Math.max(5,Math.abs(n)/t*100);return(0,S.jsxs)(`div`,{className:`v2-mini-shap-row`,children:[(0,S.jsx)(`span`,{children:k(e.feature)}),(0,S.jsx)(`div`,{className:`v2-mini-shap-track`,children:(0,S.jsx)(`i`,{className:n>=0?`pos`:`neg`,style:{width:`${r}%`}})}),(0,S.jsxs)(`b`,{children:[n>0?`+`:``,n]})]},e.feature)})})}function M({summary:e=[]}){let t=[...e].sort((e,t)=>T(t.mean_abs)-T(e.mean_abs)),n=Math.max(1,...t.map(e=>T(e.mean_abs)));return(0,S.jsx)(A,{title:`Qué está usando el modelo`,question:`¿Qué variables empujan la predicción?`,footer:`SHAP explica qué usa el modelo para predecir. No identifica por sí solo qué ocurriría al intervenir.`,children:(0,S.jsx)(`div`,{className:`v2-hbars`,children:t.map(e=>(0,S.jsxs)(`div`,{className:`v2-hbar-row`,children:[(0,S.jsx)(`span`,{children:k(e.feature)}),(0,S.jsx)(`div`,{className:`v2-hbar-track`,children:(0,S.jsx)(`i`,{style:{width:`${T(e.mean_abs)/n*100}%`}})}),(0,S.jsx)(`b`,{children:T(e.mean_abs).toFixed(2)})]},e.feature))})})}function N({points:e=[],selectedId:t,onSelect:n}){let r={l:58,r:24,t:28,b:48},i=e.map(e=>T(e.score)),a=e.map(e=>T(e.uplift_pp)),o=Math.min(.2,...i),s=Math.max(.95,...i),c=Math.min(-8,...a),l=Math.max(22,...a),u=e=>r.l+(e-o)/(s-o||1)*(680-r.l-r.r),d=e=>340-r.b-(e-c)/(l-c||1)*(340-r.t-r.b);return(0,S.jsx)(A,{kicker:`REVEAL VISUAL`,title:`Probabilidad estimada vs efecto incremental`,question:`¿Las cohortes con mayor probabilidad predicha son las que más cambian por la intervención?`,footer:`Cada punto es un cliente. La línea horizontal marca efecto cero.`,children:(0,S.jsxs)(`svg`,{className:`v2-chart`,viewBox:`0 0 680 340`,role:`img`,"aria-label":`Probabilidad estimada versus uplift causal`,children:[(0,S.jsx)(`line`,{className:`axis`,x1:r.l,y1:340-r.b,x2:680-r.r,y2:340-r.b}),(0,S.jsx)(`line`,{className:`axis`,x1:r.l,y1:r.t,x2:r.l,y2:340-r.b}),(0,S.jsx)(`line`,{className:`zero`,x1:r.l,y1:d(0),x2:680-r.r,y2:d(0)}),[.3,.5,.7,.9].map(e=>(0,S.jsxs)(`g`,{children:[(0,S.jsx)(`line`,{className:`tick`,x1:u(e),y1:340-r.b,x2:u(e),y2:340-r.b+5}),(0,S.jsxs)(`text`,{x:u(e),y:322,textAnchor:`middle`,children:[Math.round(e*100),`%`]})]},e)),[c,0,10,20].filter((e,t,n)=>e>=c&&e<=l&&n.indexOf(e)===t).map(e=>(0,S.jsxs)(`g`,{children:[(0,S.jsx)(`line`,{className:`tick`,x1:r.l-5,y1:d(e),x2:r.l,y2:d(e)}),(0,S.jsx)(`text`,{x:r.l-10,y:d(e)+4,textAnchor:`end`,children:e})]},e)),e.map(e=>(0,S.jsxs)(`g`,{className:t===e.id?`point selected`:`point`,onClick:()=>n?.(e.id),children:[(0,S.jsx)(`circle`,{cx:u(T(e.score)),cy:d(T(e.uplift_pp)),r:t===e.id?8:6}),(0,S.jsxs)(`title`,{children:[e.id,`: score `,D(e.score),` · uplift `,E(e.uplift_pp)]})]},e.id)),(0,S.jsx)(`text`,{className:`axis-label`,x:(r.l+680-r.r)/2,y:338,textAnchor:`middle`,children:`Probabilidad estimada`}),(0,S.jsx)(`text`,{className:`axis-label`,transform:`translate(15 ${(r.t+340-r.b)/2}) rotate(-90)`,textAnchor:`middle`,children:`Efecto incremental (pp)`})]})})}function P({customer:e}){if(!e)return null;let t=T(e.p0),n=T(e.p1),r=T(e.uplift_pp);return(0,S.jsx)(A,{kicker:`DOS FUTUROS`,title:`${e.id} · ${e.name||`cliente`}`,question:`Para la misma persona sólo observamos uno de estos futuros.`,children:(0,S.jsxs)(`div`,{className:`v2-futures`,children:[(0,S.jsxs)(`div`,{children:[(0,S.jsx)(`span`,{children:`Sin intervención · Y(0)`}),(0,S.jsx)(`div`,{className:`v2-future-bar`,children:(0,S.jsx)(`i`,{style:{width:`${t*100}%`}})}),(0,S.jsx)(`b`,{children:D(t)})]}),(0,S.jsxs)(`div`,{children:[(0,S.jsx)(`span`,{children:`Con intervención · Y(1)`}),(0,S.jsx)(`div`,{className:`v2-future-bar alt`,children:(0,S.jsx)(`i`,{style:{width:`${n*100}%`}})}),(0,S.jsx)(`b`,{children:D(n)})]}),(0,S.jsxs)(`div`,{className:r>=0?`v2-uplift positive`:`v2-uplift negative`,children:[(0,S.jsx)(`small`,{children:`Efecto incremental`}),(0,S.jsx)(`strong`,{children:E(r)})]})]})})}function F({dag:e}){let t=e?.adjust_options||[],[n,r]=(0,h.useState)(t[0]?.id||`none`),i=t.find(e=>e.id===n)||t[0],a=e?.nodes||[],o={risk:[90,90],treat:[330,70],outcome:[570,90],mediator:[330,230],collider:[570,230]};return(0,S.jsx)(A,{title:`DAG Lab`,question:`¿Qué variable debes ajustar para cerrar el camino de confusión sin abrir otro problema?`,children:(0,S.jsxs)(`div`,{className:`v2-dag-wrap`,children:[(0,S.jsxs)(`svg`,{className:`v2-dag`,viewBox:`0 0 660 300`,children:[(e?.edges||[]).map((e,t)=>{let n=o[e.from],r=o[e.to];return!n||!r?null:(0,S.jsxs)(`g`,{children:[(0,S.jsx)(`line`,{className:e.kind||``,x1:n[0],y1:n[1],x2:r[0],y2:r[1]}),(0,S.jsx)(`polygon`,{points:`${r[0]},${r[1]} ${r[0]-12},${r[1]-6} ${r[0]-12},${r[1]+6}`})]},t)}),a.map(e=>{let t=o[e.id]||[0,0];return(0,S.jsxs)(`g`,{className:i?.highlights?.includes(e.id)?`dag-node active`:`dag-node`,children:[(0,S.jsx)(`rect`,{x:t[0]-62,y:t[1]-24,width:`124`,height:`48`,rx:`14`}),(0,S.jsx)(`text`,{x:t[0],y:t[1]+5,textAnchor:`middle`,children:e.label})]},e.id)})]}),(0,S.jsx)(`div`,{className:`v2-dag-options`,children:t.map(e=>(0,S.jsx)(`button`,{className:n===e.id?`selected`:``,onClick:()=>r(e.id),children:e.label},e.id))}),i&&(0,S.jsxs)(`div`,{className:i.good?`v2-alert good`:`v2-alert warn`,children:[(0,S.jsx)(`b`,{children:i.good?`Comparación más defendible`:`Cuidado`}),(0,S.jsx)(`span`,{children:i.explanation})]})]})})}function I({curve:e=[],threshold:t=2}){let[n,r]=(0,h.useState)(Math.min(2,Math.max(0,e.length-1))),i=e[n]||{},a=Math.max(1,...e.map(e=>T(e.n))),o=Math.max(t,...e.map(e=>T(e.mde_pp))),s=e=>34+T(e)/a*532,c=e=>186-T(e)/o*152,l=e.map((e,t)=>`${t?`L`:`M`} ${s(e.n)} ${c(e.mde_pp)}`).join(` `);return(0,S.jsxs)(A,{title:`N vs precisión`,question:`¿Tu experimento puede detectar un efecto lo bastante pequeño como para importar?`,children:[(0,S.jsxs)(`svg`,{className:`v2-chart precision`,viewBox:`0 0 600 220`,children:[(0,S.jsx)(`line`,{className:`axis`,x1:34,y1:186,x2:566,y2:186}),(0,S.jsx)(`line`,{className:`axis`,x1:34,y1:34,x2:34,y2:186}),(0,S.jsx)(`line`,{className:`threshold`,x1:34,y1:c(t),x2:566,y2:c(t)}),(0,S.jsx)(`path`,{className:`curve`,d:l}),e.map((e,t)=>(0,S.jsx)(`circle`,{className:t===n?`curve-point selected`:`curve-point`,cx:s(e.n),cy:c(e.mde_pp),r:t===n?7:5},e.n))]}),(0,S.jsx)(`input`,{className:`v2-range`,type:`range`,min:`0`,max:Math.max(0,e.length-1),value:n,onChange:e=>r(Number(e.target.value))}),(0,S.jsxs)(`div`,{className:`v2-metric-grid`,children:[(0,S.jsxs)(`div`,{children:[(0,S.jsx)(`span`,{children:`N total`}),(0,S.jsx)(`b`,{children:Number(i.n||0).toLocaleString()})]}),(0,S.jsxs)(`div`,{children:[(0,S.jsx)(`span`,{children:`MDE`}),(0,S.jsx)(`b`,{children:E(i.mde_pp)})]}),(0,S.jsxs)(`div`,{children:[(0,S.jsx)(`span`,{children:`IC esperado`}),(0,S.jsxs)(`b`,{children:[`±`,T(i.ci_half_pp).toFixed(1),` pp`]})]}),(0,S.jsxs)(`div`,{className:T(i.mde_pp)<=t?`good`:`warn`,children:[(0,S.jsx)(`span`,{children:`Umbral negocio`}),(0,S.jsx)(`b`,{children:E(t)})]})]}),(0,S.jsx)(`p`,{className:`v2-tool-footer`,children:`Mover N estrecha la incertidumbre. No cambia si la regla de asignación está sesgada.`})]})}function L({result:e}){if(!e)return null;let t=T(e.treatment_rate),n=T(e.control_rate),r=T(e.ate_pp),i=T(e.ci_low),a=T(e.ci_high);return(0,S.jsxs)(A,{kicker:`RESULTADO EXPERIMENTAL`,title:`Tratamiento vs control`,question:`¿El efecto es suficientemente preciso para decidir?`,children:[(0,S.jsxs)(`div`,{className:`v2-tc-bars`,children:[(0,S.jsxs)(`div`,{children:[(0,S.jsx)(`span`,{children:`Tratamiento`}),(0,S.jsx)(`div`,{className:`v2-vertical`,children:(0,S.jsx)(`i`,{style:{height:`${t}%`}})}),(0,S.jsxs)(`b`,{children:[t,`%`]})]}),(0,S.jsxs)(`div`,{children:[(0,S.jsx)(`span`,{children:`Control`}),(0,S.jsx)(`div`,{className:`v2-vertical control`,children:(0,S.jsx)(`i`,{style:{height:`${n}%`}})}),(0,S.jsxs)(`b`,{children:[n,`%`]})]})]}),(0,S.jsxs)(`div`,{className:`v2-ci`,children:[(0,S.jsxs)(`div`,{className:`v2-ci-line`,children:[(0,S.jsx)(`i`,{style:{left:`${Math.max(0,(i+10)/30*100)}%`,width:`${Math.max(2,(a-i)/30*100)}%`}}),(0,S.jsx)(`b`,{style:{left:`${Math.max(0,(r+10)/30*100)}%`}})]}),(0,S.jsxs)(`div`,{className:`v2-ci-labels`,children:[(0,S.jsx)(`span`,{children:`-10 pp`}),(0,S.jsxs)(`strong`,{children:[`ATE `,E(r),` · IC95% [`,i,`, `,a,`]`]}),(0,S.jsx)(`span`,{children:`+20 pp`})]})]})]})}function R({segments:e=[]}){let t=Math.min(-10,...e.map(e=>T(e.ci_low))),n=Math.max(20,...e.map(e=>T(e.ci_high))),r=e=>(T(e)-t)/(n-t||1)*100;return(0,S.jsxs)(A,{title:`CATE por segmento`,question:`¿El promedio esconde personas que responden distinto?`,children:[(0,S.jsx)(`div`,{className:`v2-forest`,children:e.map(e=>(0,S.jsxs)(`div`,{children:[(0,S.jsx)(`span`,{children:e.name}),(0,S.jsxs)(`div`,{className:`v2-forest-track`,children:[(0,S.jsx)(`em`,{style:{left:`${r(0)}%`}}),(0,S.jsx)(`i`,{style:{left:`${r(e.ci_low)}%`,width:`${Math.max(1,r(e.ci_high)-r(e.ci_low))}%`}}),(0,S.jsx)(`b`,{style:{left:`${r(e.effect??e.effect_pp)}%`}})]}),(0,S.jsx)(`strong`,{children:E(e.effect??e.effect_pp)})]},e.id||e.name))}),(0,S.jsxs)(`div`,{className:`v2-forest-axis`,children:[(0,S.jsxs)(`span`,{children:[t,` pp`]}),(0,S.jsx)(`span`,{children:`0`}),(0,S.jsxs)(`span`,{children:[`+`,n,` pp`]})]})]})}function z({rows:e=[]}){let t=[`t_learner`,`dr_learner`,`causal_forest`],n={t_learner:`T-Learner`,dr_learner:`DR-Learner`,causal_forest:`CausalForestDML`},r=e=>(T(e)- -8)/26*100;return(0,S.jsxs)(A,{title:`Comparador de estimadores causales`,question:`¿Los modelos cuentan una historia parecida o dependen demasiado del estimador?`,footer:`Estimaciones precomputadas sobre el escenario sintético. El acuerdo entre modelos no reemplaza una estrategia de identificación.`,children:[(0,S.jsx)(`div`,{className:`v2-model-legend`,children:t.map(e=>(0,S.jsxs)(`span`,{className:e,children:[(0,S.jsx)(`i`,{}),n[e]]},e))}),(0,S.jsx)(`div`,{className:`v2-model-compare`,children:e.map(e=>(0,S.jsxs)(`div`,{children:[(0,S.jsx)(`span`,{children:e.name||e.segment}),(0,S.jsxs)(`div`,{className:`v2-model-track`,children:[(0,S.jsx)(`em`,{style:{left:`${r(0)}%`}}),t.map(t=>(0,S.jsx)(`i`,{className:t,style:{left:`${r(e[t])}%`},title:`${n[t]}: ${E(e[t])}`},t))]})]},e.segment))})]})}function B({placebo:e}){if(!e)return null;let t=T(e.ci_low)>0||T(e.ci_high)<0;return(0,S.jsx)(A,{title:`Prueba de falsificación`,question:`¿Tu pipeline encuentra un efecto donde causalmente no debería existir?`,children:(0,S.jsxs)(`div`,{className:t?`v2-placebo suspicious`:`v2-placebo`,children:[(0,S.jsxs)(`div`,{children:[(0,S.jsx)(`span`,{children:`Outcome placebo`}),(0,S.jsx)(`strong`,{children:E(e.effect_pp)}),(0,S.jsxs)(`small`,{children:[`IC95% [`,e.ci_low,`, `,e.ci_high,`]`]})]}),(0,S.jsx)(`p`,{children:e.message})]})})}function V({segments:e=[],choices:t={},capacity:n=15e3}){let r=e.filter(e=>t[e.id]===`treat`),i=r.reduce((e,t)=>e+T(t.audience),0),a=r.length>0&&r.every(e=>e.effect!==void 0||e.effect_pp!==void 0)?r.reduce((e,t)=>e+(T(t.effect??t.effect_pp)/100*T(t.audience)*T(t.value??t.value_per_result)-T(t.audience)*T(t.cost??t.unit_cost)),0):null;return(0,S.jsxs)(`div`,{className:`v2-policy-meter`,children:[(0,S.jsxs)(`div`,{children:[(0,S.jsx)(`span`,{children:`Capacidad`}),(0,S.jsxs)(`b`,{children:[i.toLocaleString(),` / `,n.toLocaleString()]}),(0,S.jsx)(`div`,{className:`v2-capacity`,children:(0,S.jsx)(`i`,{style:{width:`${Math.min(100,i/n*100)}%`}})})]}),(0,S.jsxs)(`div`,{children:[(0,S.jsx)(`span`,{children:`Valor incremental`}),(0,S.jsx)(`b`,{children:a===null?`por estimar`:O(a)})]}),(0,S.jsxs)(`div`,{children:[(0,S.jsx)(`span`,{children:`Segmentos tratados`}),(0,S.jsx)(`b`,{children:r.length})]})]})}function H({items:e=[]}){let[t,n]=(0,h.useState)(0);if(!e.length)return null;let r=e[Math.min(t,e.length-1)];return(0,S.jsxs)(`div`,{className:`v2-evidence-deck`,children:[(0,S.jsx)(`div`,{className:`v2-evidence-tabs`,role:`tablist`,"aria-label":`Herramientas de evidencia`,children:e.map((e,r)=>(0,S.jsxs)(`button`,{type:`button`,className:t===r?`active`:``,onClick:()=>n(r),children:[(0,S.jsx)(`b`,{children:r+1}),(0,S.jsx)(`span`,{children:e.label})]},e.label))}),(0,S.jsx)(`div`,{className:`v2-evidence-panel`,children:r.node}),(0,S.jsxs)(`div`,{className:`v2-evidence-nav`,children:[(0,S.jsx)(`button`,{type:`button`,disabled:t===0,onClick:()=>n(e=>Math.max(0,e-1)),children:`← anterior`}),(0,S.jsxs)(`span`,{children:[t+1,`/`,e.length]}),(0,S.jsx)(`button`,{type:`button`,disabled:t===e.length-1,onClick:()=>n(t=>Math.min(e.length-1,t+1)),children:`siguiente →`})]})]})}function U({round:e,state:t,analysis:n}){let r=n?.team_tools;if(!r)return null;let i=t?.team_pool||[],a=(0,S.jsxs)(A,{title:`Distribución de probabilidades`,question:`¿La confianza predictiva es lo mismo que impacto causal?`,children:[(0,S.jsx)(`div`,{className:`v2-score-rug`,children:[...i].sort((e,t)=>T(e.score)-T(t.score)).map(e=>(0,S.jsx)(`i`,{style:{left:`${T(e.score)*100}%`},title:`${e.id} · ${D(e.score)}`},e.id))}),(0,S.jsxs)(`div`,{className:`v2-score-rug-axis`,children:[(0,S.jsx)(`span`,{children:`0%`}),(0,S.jsx)(`span`,{children:`Probabilidad estimada de renovación`}),(0,S.jsx)(`span`,{children:`100%`})]}),(0,S.jsx)(`p`,{className:`v2-tool-footer`,children:`Todavía no conoces Y(0) y Y(1). Esta distribución es predictiva, no causal.`})]}),o=T(r.economy?.renewal_value_cop)>0?100*T(r.economy?.intervention_cost_cop)/T(r.economy?.renewal_value_cop):4,s=e===1?[{label:`SHAP`,node:(0,S.jsx)(M,{summary:r.feature_summary||[]})},{label:`Probabilidades`,node:a}]:e===2?[{label:`DAG`,node:(0,S.jsx)(F,{dag:r.dag})}]:[{label:`Precisión`,node:(0,S.jsx)(I,{curve:r.precision_curve||[],threshold:o})},{label:`Modelos causales`,node:(0,S.jsx)(z,{rows:r.econml||[]})},{label:`Placebo`,node:(0,S.jsx)(B,{placebo:r.placebo})}],c={label:`Python`,node:(0,S.jsx)(w,{round:e,state:t,analysis:n})},l=[...s.slice(0,1),c,...s.slice(1)];return(0,S.jsxs)(`section`,{className:`v2-evidence-lab`,children:[(0,S.jsxs)(`div`,{className:`v2-step compact`,children:[(0,S.jsx)(`b`,{children:`PASO 2 · INVESTIGUEN`}),(0,S.jsx)(`span`,{children:`La evidencia visual orienta; Python permite modelar y cuantificar antes de revisar su decisión.`})]}),(0,S.jsx)(H,{items:l})]})}function W({state:e,reveal:t}){let n=t?.score_uplift||[],r=n.find(t=>e.team_decision?.payload?.selected?.includes(t.id))?.id||n[0]?.id||``,[i,a]=(0,h.useState)(r),o=n.find(e=>e.id===i)||n[0];return(0,S.jsxs)(`div`,{className:`v2-tools-grid reveal-tools`,children:[(0,S.jsx)(N,{points:n,selectedId:i,onSelect:a}),(0,S.jsx)(P,{customer:o})]})}function G({round:e,state:t,analysis:n}){let r=n?.reveal_tools;return r?e===1?(0,S.jsx)(W,{state:t,reveal:r}):e===3?(0,S.jsxs)(`div`,{className:`v2-tools-grid reveal-tools`,children:[(0,S.jsx)(L,{result:r.experiment}),(0,S.jsx)(R,{segments:r.segments||[]}),(0,S.jsx)(B,{placebo:r.placebo})]}):null:null}export{G as i,j as n,V as r,U as t};