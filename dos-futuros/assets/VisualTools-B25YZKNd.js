import{_ as e,c as t,h as n,m as r,v as i}from"./api-DpGKNp4c.js";import{t as a}from"./check-DHnJjO-k.js";import{n as o,t as s}from"./rotate-ccw-QD2CwPaz.js";var c={name:`loader-circle`,size:24,node:[[`path`,{d:`M21 12a9 9 0 1 1-6.219-8.56`,key:`13zald`}]],aliases:[`loader-2`]};c.node;var l=n(c),u={name:`terminal`,size:24,node:[[`path`,{d:`M12 19h8`,key:`baeox8`}],[`path`,{d:`m4 17 6-6-6-6`,key:`1yngyt`}]]};u.node;var d=n(u),f=i(e(),1),p=e=>Number(e||0),m=e=>(e||[]).map(e=>({id:String(e.id||``),grupo:String(e.name||e.id||``),segmento:String(e.segment||``),uso:p(e.usage),incidentes:p(e.bugs),descuento:p(e.discount),antiguedad:p(e.tenure),probabilidad_renovacion:p(e.score),tamano_grupo:p(e.cohort_size||1e3)})),h=e=>(e||[]).map(e=>({riesgo_previo:p(e.risk),uso:p(e.usage),antiguedad:p(e.tenure),recibio_mes_gratis:!!e.treated,renovo:p(e.renewed)})),g=e=>(e||[]).map(e=>({segmento:String(e.segment||``),uso:p(e.usage),antiguedad:p(e.tenure),recibio_mes_gratis:!!e.treated,renovo:p(e.renewed)})),_=e=>(e||[]).map(e=>({id:String(e.id||``),segmento:String(e.name||e.id||``),audiencia:p(e.audience),riesgo:String(e.risk||``),valor_renovacion_cop:p(e.value_per_result??e.value),costo_mes_gratis_cop:p(e.unit_cost??e.cost)}));function v(e,t={},n={},r=null){let i=n?.team_tools||{},a=r||(e===1?`prediction`:e===2?`comparison`:`experiment`);return a===`prediction`?{title:`¿Qué te está diciendo realmente el modelo?`,context:{grupos:m(t.team_pool||[]),entrenamiento:(i.ml_training||[]).map(e=>({uso:p(e.usage),incidentes:p(e.bugs),descuento:p(e.discount),antiguedad:p(e.tenure),renovo:p(e.renewed)}))},steps:[{id:`rank`,label:`1 · Ordenar`,question:`¿Quién parece más probable que renueve?`,instruction:`Empieza con algo simple: ordena la probabilidad que ya produjo el modelo.`,guidedCode:`import pandas as pd

df = pd.DataFrame(payload["grupos"])

salida = df[["id","grupo","probabilidad_renovacion"]].copy()
salida["probabilidad_renovacion"] = (100*salida["probabilidad_renovacion"]).round(1)

print(salida.sort_values("probabilidad_renovacion", ascending=False).head(10).to_string(index=False))

print("\\nPregunta:")
print("¿Esta tabla dice quién CAMBIARÁ por recibir el mes gratis?")`,advancedCode:`import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score

train = pd.DataFrame(payload["entrenamiento"])
grupos = pd.DataFrame(payload["grupos"])
features = ["uso","incidentes","descuento","antiguedad"]

X_train, X_test, y_train, y_test = train_test_split(
    train[features], train["renovo"],
    test_size=.30, random_state=42, stratify=train["renovo"]
)

m = LogisticRegression(max_iter=1000).fit(X_train,y_train)
p = m.predict_proba(X_test)[:,1]
print("AUC predictivo:", round(roc_auc_score(y_test,p),3))

m.fit(train[features],train["renovo"])
grupos["p_modelo"] = m.predict_proba(grupos[features])[:,1]
print("\\nTop 10 por modelo reentrenado:")
print(grupos[["id","grupo","p_modelo"]].sort_values("p_modelo",ascending=False).head(10).to_string(index=False))

print("\\nUn AUC alto evalúa predicción. No identifica el efecto del mes gratis.")`},{id:`visual`,label:`2 · Ver`,question:`¿Una probabilidad alta es lo mismo que un gran cambio por intervenir?`,instruction:`Grafica las probabilidades. Fíjate en lo que la gráfica NO contiene.`,guidedCode:`import pandas as pd
import matplotlib.pyplot as plt

df = pd.DataFrame(payload["grupos"]).sort_values("probabilidad_renovacion")

plt.figure(figsize=(8,4))
plt.bar(df["id"],100*df["probabilidad_renovacion"])
plt.ylabel("Probabilidad estimada de renovación (%)")
plt.xlabel("Grupo")
plt.xticks(rotation=60)
plt.tight_layout()

print("La gráfica responde: ¿quién probablemente renovará?")
print("Todavía no responde: ¿quién renovará GRACIAS al mes gratis?")`,advancedCode:`import pandas as pd
import matplotlib.pyplot as plt
from sklearn.linear_model import LogisticRegression

train = pd.DataFrame(payload["entrenamiento"])
df = pd.DataFrame(payload["grupos"])
features = ["uso","incidentes","descuento","antiguedad"]

m = LogisticRegression(max_iter=1000).fit(train[features],train["renovo"])
df["p_modelo"] = m.predict_proba(df[features])[:,1]

fig,ax=plt.subplots(figsize=(8,4))
ax.scatter(df["uso"],100*df["p_modelo"])
ax.set_xlabel("Días activos últimos 30 días")
ax.set_ylabel("Probabilidad estimada de renovación (%)")
fig.tight_layout()

print("El modelo describe P(renovación | características).")
print("No observa dos futuros del mismo grupo.")`}]}:a===`comparison`?{title:`¿La comparación es justa?`,context:{historico:h(i.observational_rows||[])},steps:[{id:`raw`,label:`1 · Comparar`,question:`¿Qué parece decir el histórico si sólo comparamos mes gratis vs. no mes gratis?`,instruction:`Haz la comparación directa. Todavía no la llames “efecto”.`,guidedCode:`import pandas as pd

df = pd.DataFrame(payload["historico"])

tasas = df.groupby("recibio_mes_gratis")["renovo"].mean()*100
print("Sin mes gratis :", round(tasas.loc[False],1), "%")
print("Con mes gratis :", round(tasas.loc[True],1), "%")
print("Diferencia observada:", round(tasas.loc[True]-tasas.loc[False],1), "pp")

print("\\n¿Esto prueba que el mes gratis empeoró la renovación?")`,advancedCode:`import pandas as pd

df = pd.DataFrame(payload["historico"])
crudo = df.groupby("recibio_mes_gratis")["renovo"].mean()

print("Diferencia cruda:", round(100*(crudo.loc[True]-crudo.loc[False]),1), "pp")
print("\\nProbabilidad de recibir mes gratis según riesgo previo:")
print((100*df.groupby("riesgo_previo")["recibio_mes_gratis"].mean()).round(1).to_string())`},{id:`stratify`,label:`2 · Igualar`,question:`¿Qué pasa si comparamos usuarios con un riesgo previo parecido?`,instruction:`Separa por riesgo previo y vuelve a comparar dentro de cada grupo.`,guidedCode:`import pandas as pd

df = pd.DataFrame(payload["historico"])

tabla = (
    df.groupby(["riesgo_previo","recibio_mes_gratis"])["renovo"]
      .mean().mul(100).round(1).unstack()
)

print("Renovación dentro de cada nivel de riesgo (%)")
print(tabla.to_string())

print("\\nLa idea importante:")
print("antes de comparar resultados, pregunta si los grupos ya eran distintos.")`,advancedCode:`import pandas as pd
import numpy as np
from sklearn.linear_model import LogisticRegression

df = pd.DataFrame(payload["historico"])
X = df[["riesgo_previo","uso","antiguedad"]]
T = df["recibio_mes_gratis"].astype(int)
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
print("\\nTérmino avanzado: propensity score + IPW.")
print("La técnica ayuda a construir comparabilidad; no elimina los supuestos.")`},{id:`overlap`,label:`3 · Comprobar`,question:`¿Existen usuarios parecidos en ambos grupos?`,instruction:`En modo guiado mira la distribución del riesgo. El modo avanzado muestra overlap con propensity score.`,guidedCode:`import pandas as pd
import matplotlib.pyplot as plt

df = pd.DataFrame(payload["historico"])

tabla = pd.crosstab(df["riesgo_previo"],df["recibio_mes_gratis"],normalize="index")*100
print("Distribución de mes gratis dentro de cada riesgo (%)")
print(tabla.round(1).to_string())

tabla.plot(kind="bar",figsize=(7,4))
plt.ylabel("% dentro del nivel de riesgo")
plt.xlabel("Riesgo previo")
plt.tight_layout()

print("\\nSi un nivel casi no tiene ambos grupos, la comparación se vuelve más frágil.")`,advancedCode:`import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from sklearn.linear_model import LogisticRegression

df = pd.DataFrame(payload["historico"])
X = df[["riesgo_previo","uso","antiguedad"]]
T = df["recibio_mes_gratis"].astype(int)

m = LogisticRegression(max_iter=1000).fit(X,T)
df["ps"] = np.clip(m.predict_proba(X)[:,1],.01,.99)

plt.figure(figsize=(7,4))
plt.hist(df.loc[T==0,"ps"],bins=18,alpha=.65,label="Sin mes gratis")
plt.hist(df.loc[T==1,"ps"],bins=18,alpha=.65,label="Con mes gratis")
plt.xlabel("Probabilidad estimada de recibir mes gratis")
plt.ylabel("Observaciones")
plt.legend()
plt.tight_layout()

print("Esto se conoce como overlap o soporte común.")`}]}:a===`experiment`?{title:`¿Funciona igual para todos?`,context:{experimento:g(i.experiment_rows||[]),segmentos:_(i.segments||[]),economia:i.economy||t.economy||{}},steps:[{id:`experiment`,label:`1 · Promedio`,question:`En un experimento aleatorizado, ¿cuánto cambió la renovación en promedio?`,instruction:`Compara directamente quienes recibieron el mes gratis y quienes no.`,guidedCode:`import pandas as pd

df = pd.DataFrame(payload["experimento"])
tasas = df.groupby("recibio_mes_gratis")["renovo"].mean()*100

print("Sin mes gratis :", round(tasas.loc[False],1), "%")
print("Con mes gratis :", round(tasas.loc[True],1), "%")
print("Cambio promedio:", round(tasas.loc[True]-tasas.loc[False],1), "pp")`,advancedCode:`import pandas as pd
import numpy as np

df = pd.DataFrame(payload["experimento"])
y1 = df.loc[df["recibio_mes_gratis"],"renovo"].astype(float)
y0 = df.loc[~df["recibio_mes_gratis"],"renovo"].astype(float)

efecto = y1.mean()-y0.mean()
se = np.sqrt(y1.var(ddof=1)/len(y1)+y0.var(ddof=1)/len(y0))
lo,hi = efecto-1.96*se,efecto+1.96*se

print("Efecto promedio:", round(100*efecto,1), "pp")
print("IC 95%: [",round(100*lo,1),",",round(100*hi,1),"] pp")
print("\\nTérmino técnico: ATE e intervalo de confianza.")`},{id:`segments`,label:`2 · Grupos`,question:`¿Ese cambio promedio se repite en todos los segmentos?`,instruction:`Calcula la diferencia dentro de cada segmento.`,guidedCode:`import pandas as pd

df = pd.DataFrame(payload["experimento"])

tabla = (
    df.groupby(["segmento","recibio_mes_gratis"])["renovo"]
      .mean().mul(100).round(1).unstack()
)
tabla["cambio_pp"] = tabla[True]-tabla[False]

print(tabla.sort_values("cambio_pp",ascending=False).to_string())

print("\\nNo todos los segmentos responden igual.")`,advancedCode:`import pandas as pd
from sklearn.ensemble import RandomForestRegressor

df = pd.DataFrame(payload["experimento"])
X = pd.get_dummies(df[["segmento","uso","antiguedad"]],columns=["segmento"],drop_first=False)

m1 = RandomForestRegressor(n_estimators=120,min_samples_leaf=20,random_state=42)
m0 = RandomForestRegressor(n_estimators=120,min_samples_leaf=20,random_state=42)
m1.fit(X[df["recibio_mes_gratis"]],df.loc[df["recibio_mes_gratis"],"renovo"])
m0.fit(X[~df["recibio_mes_gratis"]],df.loc[~df["recibio_mes_gratis"],"renovo"])

df["efecto_estimado"] = m1.predict(X)-m0.predict(X)
print((100*df.groupby("segmento")["efecto_estimado"].mean()).round(1).sort_values(ascending=False).to_string())

print("\\nTérmino avanzado: T-Learner para heterogeneidad del efecto.")`},{id:`money`,label:`3 · Dinero`,question:`¿Qué grupos generan valor después de pagar el mes gratis?`,instruction:`Convierte el cambio observado por segmento a valor incremental.`,guidedCode:`import pandas as pd

df = pd.DataFrame(payload["experimento"])
seg = pd.DataFrame(payload["segmentos"])
eco = payload["economia"]

tabla = (
    df.groupby(["segmento","recibio_mes_gratis"])["renovo"]
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

print("\\nCapacidad:", int(eco["capacity"]), "usuarios")`,advancedCode:`import pandas as pd
from sklearn.ensemble import RandomForestRegressor
import matplotlib.pyplot as plt

df = pd.DataFrame(payload["experimento"])
seg = pd.DataFrame(payload["segmentos"])
eco = payload["economia"]

X = pd.get_dummies(df[["segmento","uso","antiguedad"]],columns=["segmento"],drop_first=False)
m1 = RandomForestRegressor(n_estimators=120,min_samples_leaf=20,random_state=42)
m0 = RandomForestRegressor(n_estimators=120,min_samples_leaf=20,random_state=42)
m1.fit(X[df["recibio_mes_gratis"]],df.loc[df["recibio_mes_gratis"],"renovo"])
m0.fit(X[~df["recibio_mes_gratis"]],df.loc[~df["recibio_mes_gratis"],"renovo"])
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
print("\\nTérminos avanzados: CATE / T-Learner.")`}]}:null}var y=r(),b=2e4;function x({round:e,state:n,analysis:r,labKey:i,labPoints:c=20,onComplete:u,simulation:p=!1}){let m=(0,f.useMemo)(()=>v(e,n,r,i),[e,n,r,i]),[h,g]=(0,f.useState)({}),[_,x]=(0,f.useState)({}),[S,C]=(0,f.useState)({}),[w,T]=(0,f.useState)(`idle`),[E,D]=(0,f.useState)(``),[O,k]=(0,f.useState)(!1),[A,j]=(0,f.useState)(!1),M=(0,f.useRef)(null),N=(0,f.useRef)(null),P=(0,f.useRef)(null);(0,f.useEffect)(()=>{let e={};for(let t of m?.steps||[])e[t.id]=t.guidedCode||t.code||``;g(e),x({}),C({}),D(``),T(`idle`),k(!1),j(!1),clearTimeout(N.current),M.current?.terminate(),M.current=null},[e,m?.title]),(0,f.useEffect)(()=>()=>{clearTimeout(N.current),M.current?.terminate()},[]);function F(){if(M.current)return M.current;let n=new Worker(new URL(``+new URL(`pyodide.worker-D7QpOAeM.js`,import.meta.url).href,``+import.meta.url));return n.onmessage=n=>{let r=n.data||{};if(r.type===`ready`&&(T(`ready`),D(``)),r.type===`result`){clearTimeout(N.current);let n=P.current,i=n?.stepId||r.requestId;if(x(e=>({...e,[i]:{output:r.output||``,image:r.image||null}})),C(e=>({...e,[i]:``})),T(`ready`),D(``),n&&!p){let r=Math.round(performance.now()-n.started);t(`v2-submit`,{action:`learning_event`,round:e,event_type:`python_run`,payload:{step_id:i,code_changed:n.codeChanged,duration_ms:r,mode:`guided`}}).catch(()=>{})}P.current=null}if(r.type===`execution_error`){clearTimeout(N.current);let e=P.current?.stepId||r.requestId;x(t=>{let n={...t};return delete n[e],n}),C(t=>({...t,[e]:[r.output,r.error].filter(Boolean).join(`
`)})),T(`ready`),D(``),P.current=null}r.type===`error`&&(clearTimeout(N.current),T(`error`),D(r.error||`Error ejecutando Python`),P.current=null)},n.onerror=e=>{clearTimeout(N.current),T(`error`),D(e.message||`No fue posible iniciar Python en este navegador.`),P.current=null},M.current=n,n}function I(){T(`loading`),D(``),F().postMessage({type:`init`})}function L(e){let t=F(),n=e.guidedCode||e.code||``,r=h[e.id]??n;T(`running`),D(``),C(t=>({...t,[e.id]:``})),P.current={stepId:e.id,started:performance.now(),codeChanged:r!==n},t.postMessage({type:`run`,requestId:e.id,code:r,context:m?.context||{}}),clearTimeout(N.current),N.current=setTimeout(()=>{t.terminate(),M.current=null,P.current=null,T(`error`),D(`La ejecución superó 20 segundos y fue detenida. Restaura el ejemplo e inténtalo otra vez.`)},b)}async function R(){if(H&&!O){k(!0),D(``);try{if(p){j(!0),await u?.();return}await t(`v2-submit`,{action:`lab_complete`,round:e}),await u?.()}catch(e){D(e.message)}finally{k(!1)}}}if(!m)return null;let z=m.steps||[],B=w===`ready`||w===`running`,V=w===`loading`||w===`running`,H=z.length>0&&z.every(e=>_[e.id]);return(0,y.jsxs)(`section`,{className:`v2-python-lab single-page`,children:[(0,y.jsxs)(`div`,{className:`v2-python-head`,children:[(0,y.jsxs)(`div`,{children:[(0,y.jsx)(`div`,{className:`v2-kicker`,children:`LABORATORIO · TODO EN ESTA PÁGINA`}),(0,y.jsx)(`h2`,{children:m.title})]}),(0,y.jsxs)(`div`,{className:`v2-python-status ${w}`,children:[(0,y.jsx)(d,{size:15}),(0,y.jsx)(`span`,{children:w===`idle`?`Python apagado`:w===`loading`?`Cargando Python`:w===`running`?`Ejecutando`:`Python listo`})]})]}),(0,y.jsx)(`div`,{className:`v2-alert hint`,children:(0,y.jsx)(`span`,{children:`No necesitas memorizar código. Ejecuta cada bloque, mira el resultado y responde la pregunta que lo acompaña.`})}),!B&&(0,y.jsxs)(`button`,{type:`button`,className:`v2-primary wide`,disabled:V,onClick:I,children:[V?(0,y.jsx)(l,{className:`spin`,size:17}):(0,y.jsx)(d,{size:17}),` `,V?`Cargando…`:`Iniciar Python`]}),(0,y.jsx)(`div`,{className:`v2-python-all-steps`,children:z.map((e,t)=>{let n=e.guidedCode||e.code||``,r=_[e.id],i=S[e.id];return(0,y.jsxs)(`article`,{className:`v2-python-step-card ${r?`done`:i?`failed`:``}`,children:[(0,y.jsxs)(`div`,{className:`v2-python-step-title`,children:[(0,y.jsx)(`b`,{children:t+1}),(0,y.jsxs)(`div`,{children:[(0,y.jsx)(`strong`,{children:e.question}),(0,y.jsx)(`span`,{children:e.instruction})]}),r&&(0,y.jsx)(a,{size:18})]}),(0,y.jsxs)(`div`,{className:`v2-python-editor`,children:[(0,y.jsxs)(`div`,{className:`v2-python-editorbar`,children:[(0,y.jsxs)(`span`,{children:[e.id,`.py`]}),(0,y.jsxs)(`button`,{type:`button`,onClick:()=>g(t=>({...t,[e.id]:n})),children:[(0,y.jsx)(s,{size:14}),` Restaurar`]})]}),(0,y.jsx)(`textarea`,{"aria-label":`Código Python: ${e.question}`,value:h[e.id]??n,onChange:t=>g(n=>({...n,[e.id]:t.target.value})),spellCheck:`false`})]}),(0,y.jsxs)(`button`,{type:`button`,className:`v2-secondary`,disabled:!B||V,onClick:()=>L(e),children:[V&&P.current?.stepId===e.id?(0,y.jsx)(l,{className:`spin`,size:16}):(0,y.jsx)(o,{size:16}),` `,r?`Ejecutar de nuevo`:`Ejecutar`]}),i&&(0,y.jsxs)(`div`,{className:`v2-python-output error`,children:[(0,y.jsxs)(`div`,{children:[(0,y.jsx)(d,{size:14}),` error de Python`]}),(0,y.jsx)(`pre`,{children:i}),(0,y.jsx)(`small`,{children:`Este bloque todavía no cuenta como completado. Corrige el código o pulsa “Restaurar” y ejecútalo de nuevo.`})]}),r&&(0,y.jsxs)(`div`,{className:`v2-python-result`,children:[(0,y.jsxs)(`div`,{className:`v2-python-output`,children:[(0,y.jsxs)(`div`,{children:[(0,y.jsx)(d,{size:14}),` resultado`]}),(0,y.jsx)(`pre`,{children:r.output})]}),r.image&&(0,y.jsxs)(`figure`,{className:`v2-python-figure`,children:[(0,y.jsx)(`img`,{src:r.image,alt:`Gráfica producida por el código Python`}),(0,y.jsx)(`figcaption`,{children:`Resultado gráfico.`})]})]})]},e.id)})}),E&&(0,y.jsx)(`div`,{className:`v2-alert error`,children:E}),(0,y.jsx)(`button`,{type:`button`,className:`v2-primary wide`,disabled:!H||O||A,onClick:R,children:A?`Laboratorio completado · +${c} puntos`:O?`Cerrando laboratorio…`:H?`Terminar laboratorio · +${c} puntos`:`Ejecuta todos los bloques para terminar`}),(0,y.jsx)(`small`,{className:`v2-python-footnote`,children:`Las técnicas avanzadas quedan fuera de la ruta principal. El objetivo aquí es entender la idea, no memorizar nombres.`})]})}var S=e=>Number(e||0),C=e=>`${S(e)>0?`+`:``}${S(e).toFixed(+(Math.abs(S(e))<10))} pp`,w=e=>`${Math.round(S(e)*100)}%`,T=e=>new Intl.NumberFormat(`es-CO`,{style:`currency`,currency:`COP`,maximumFractionDigits:0}).format(S(e));function E({kicker:e=`HERRAMIENTA DE ANÁLISIS`,title:t,question:n,children:r,footer:i}){return(0,y.jsxs)(`section`,{className:`v2-tool`,children:[(0,y.jsxs)(`div`,{className:`v2-tool-head`,children:[(0,y.jsxs)(`div`,{children:[(0,y.jsx)(`div`,{className:`v2-kicker`,children:e}),(0,y.jsx)(`h2`,{children:t})]}),n&&(0,y.jsx)(`div`,{className:`v2-tool-question`,children:n})]}),r,i&&(0,y.jsx)(`p`,{className:`v2-tool-footer`,children:i})]})}function D({points:e=[],selectedId:t,onSelect:n}){let r={l:58,r:24,t:28,b:48},i=e.map(e=>S(e.score)),a=e.map(e=>S(e.uplift_pp)),o=Math.min(.2,...i),s=Math.max(.95,...i),c=Math.min(-8,...a),l=Math.max(22,...a),u=e=>r.l+(e-o)/(s-o||1)*(680-r.l-r.r),d=e=>340-r.b-(e-c)/(l-c||1)*(340-r.t-r.b);return(0,y.jsx)(E,{kicker:`REVEAL VISUAL`,title:`Probabilidad de renovar vs cambio por el mes gratis`,question:`¿Los grupos que parecen más seguros son también los que más cambian?`,footer:`Cada punto es un grupo. La línea horizontal significa que el mes gratis no cambió la probabilidad.`,children:(0,y.jsxs)(`svg`,{className:`v2-chart`,viewBox:`0 0 680 340`,role:`img`,"aria-label":`Probabilidad estimada versus cambio por el mes gratis`,children:[(0,y.jsx)(`line`,{className:`axis`,x1:r.l,y1:340-r.b,x2:680-r.r,y2:340-r.b}),(0,y.jsx)(`line`,{className:`axis`,x1:r.l,y1:r.t,x2:r.l,y2:340-r.b}),(0,y.jsx)(`line`,{className:`zero`,x1:r.l,y1:d(0),x2:680-r.r,y2:d(0)}),[.3,.5,.7,.9].map(e=>(0,y.jsxs)(`g`,{children:[(0,y.jsx)(`line`,{className:`tick`,x1:u(e),y1:340-r.b,x2:u(e),y2:340-r.b+5}),(0,y.jsxs)(`text`,{x:u(e),y:322,textAnchor:`middle`,children:[Math.round(e*100),`%`]})]},e)),[c,0,10,20].filter((e,t,n)=>e>=c&&e<=l&&n.indexOf(e)===t).map(e=>(0,y.jsxs)(`g`,{children:[(0,y.jsx)(`line`,{className:`tick`,x1:r.l-5,y1:d(e),x2:r.l,y2:d(e)}),(0,y.jsx)(`text`,{x:r.l-10,y:d(e)+4,textAnchor:`end`,children:e})]},e)),e.map(e=>(0,y.jsxs)(`g`,{className:t===e.id?`point selected`:`point`,onClick:()=>n?.(e.id),children:[(0,y.jsx)(`circle`,{cx:u(S(e.score)),cy:d(S(e.uplift_pp)),r:t===e.id?8:6}),(0,y.jsxs)(`title`,{children:[e.id,`: probabilidad `,w(e.score),` · cambio `,C(e.uplift_pp)]})]},e.id)),(0,y.jsx)(`text`,{className:`axis-label`,x:(r.l+680-r.r)/2,y:338,textAnchor:`middle`,children:`Probabilidad estimada`}),(0,y.jsx)(`text`,{className:`axis-label`,transform:`translate(15 ${(r.t+340-r.b)/2}) rotate(-90)`,textAnchor:`middle`,children:`Cambio por el mes gratis (pp)`})]})})}function O({customer:e}){if(!e)return null;let t=S(e.p0),n=S(e.p1),r=S(e.uplift_pp);return(0,y.jsx)(E,{kicker:`DOS FUTUROS`,title:`${e.id} · ${e.name||`cliente`}`,question:`Comparamos qué pasaría con y sin el mes gratis.`,children:(0,y.jsxs)(`div`,{className:`v2-futures`,children:[(0,y.jsxs)(`div`,{children:[(0,y.jsx)(`span`,{children:`Sin mes gratis`}),(0,y.jsx)(`div`,{className:`v2-future-bar`,children:(0,y.jsx)(`i`,{style:{width:`${t*100}%`}})}),(0,y.jsx)(`b`,{children:w(t)})]}),(0,y.jsxs)(`div`,{children:[(0,y.jsx)(`span`,{children:`Con mes gratis`}),(0,y.jsx)(`div`,{className:`v2-future-bar alt`,children:(0,y.jsx)(`i`,{style:{width:`${n*100}%`}})}),(0,y.jsx)(`b`,{children:w(n)})]}),(0,y.jsxs)(`div`,{className:r>=0?`v2-uplift positive`:`v2-uplift negative`,children:[(0,y.jsx)(`small`,{children:`Cambio`}),(0,y.jsx)(`strong`,{children:C(r)})]})]})})}function k({segments:e=[],choices:t={},capacity:n=15e3}){let r=e.filter(e=>t[e.id]===`treat`),i=r.reduce((e,t)=>e+S(t.audience),0),a=r.length>0&&r.every(e=>e.effect!==void 0||e.effect_pp!==void 0)?r.reduce((e,t)=>e+(S(t.effect??t.effect_pp)/100*S(t.audience)*S(t.value??t.value_per_result)-S(t.audience)*S(t.cost??t.unit_cost)),0):null;return(0,y.jsxs)(`div`,{className:`v2-policy-meter`,children:[(0,y.jsxs)(`div`,{children:[(0,y.jsx)(`span`,{children:`Capacidad`}),(0,y.jsxs)(`b`,{children:[i.toLocaleString(),` / `,n.toLocaleString()]}),(0,y.jsx)(`div`,{className:`v2-capacity`,children:(0,y.jsx)(`i`,{style:{width:`${Math.min(100,i/n*100)}%`}})})]}),(0,y.jsxs)(`div`,{children:[(0,y.jsx)(`span`,{children:`Valor incremental`}),(0,y.jsx)(`b`,{children:a===null?`por estimar`:T(a)})]}),(0,y.jsxs)(`div`,{children:[(0,y.jsx)(`span`,{children:`Segmentos tratados`}),(0,y.jsx)(`b`,{children:r.length})]})]})}function A({round:e,state:t,analysis:n,labKey:r,labPoints:i,onComplete:a,simulation:o=!1}){if(!n?.team_tools)return null;let s=r||(e===1?`prediction`:e===2?`comparison`:`experiment`);return(0,y.jsxs)(`section`,{className:`v2-evidence-lab single-page`,children:[(0,y.jsxs)(`div`,{className:`v2-step compact`,children:[(0,y.jsx)(`b`,{children:`LABORATORIO`}),(0,y.jsx)(`span`,{children:s===`prediction`?`Ordena lo que predice el modelo y fíjate en la pregunta que todavía no puede responder.`:s===`comparison`?`Compara primero los grupos tal como aparecen y luego vuelve a comparar usuarios parecidos.`:`Mide el cambio promedio, compáralo por grupos y conviértelo a una decisión con costo.`})]}),(0,y.jsx)(x,{round:e,state:t,analysis:n,labKey:r,labPoints:i,onComplete:a,simulation:o})]})}function j({state:e,reveal:t}){let n=t?.score_uplift||[],r=n.find(t=>e.team_decision?.payload?.selected?.includes(t.id))?.id||n[0]?.id||``,[i,a]=(0,f.useState)(r),o=n.find(e=>e.id===i)||n[0];return(0,y.jsxs)(`div`,{className:`v2-tools-grid reveal-tools`,children:[(0,y.jsx)(D,{points:n,selectedId:i,onSelect:a}),(0,y.jsx)(O,{customer:o})]})}function M({result:e}){if(!e)return null;let t=S(e.treatment_rate),n=S(e.control_rate),r=S(e.ate_pp);return(0,y.jsxs)(E,{title:`¿Qué pasó en la prueba?`,question:`Como el mes gratis se asignó al azar, esta comparación es mucho más justa.`,children:[(0,y.jsxs)(`div`,{className:`v2-tc-bars`,children:[(0,y.jsxs)(`div`,{children:[(0,y.jsx)(`span`,{children:`Con mes gratis`}),(0,y.jsx)(`div`,{className:`v2-vertical`,children:(0,y.jsx)(`i`,{style:{height:`${t}%`}})}),(0,y.jsxs)(`b`,{children:[t,`%`]})]}),(0,y.jsxs)(`div`,{children:[(0,y.jsx)(`span`,{children:`Sin mes gratis`}),(0,y.jsx)(`div`,{className:`v2-vertical control`,children:(0,y.jsx)(`i`,{style:{height:`${n}%`}})}),(0,y.jsxs)(`b`,{children:[n,`%`]})]})]}),(0,y.jsxs)(`p`,{className:`v2-tool-footer`,children:[`Cambio promedio observado: `,(0,y.jsx)(`b`,{children:C(r)}),`.`]})]})}function N({segments:e=[]}){let t=Math.max(1,...e.map(e=>Math.abs(S(e.effect??e.effect_pp))));return(0,y.jsx)(E,{title:`No todos los grupos cambiaron igual`,question:`¿En cuáles grupos ayudó más el mes gratis?`,children:(0,y.jsx)(`div`,{className:`v2-hbars`,children:e.map(e=>{let n=S(e.effect??e.effect_pp);return(0,y.jsxs)(`div`,{children:[(0,y.jsx)(`span`,{children:e.name}),(0,y.jsx)(`div`,{className:`v2-hbar-track`,children:(0,y.jsx)(`i`,{style:{width:`${Math.min(100,Math.abs(n)/t*100)}%`}})}),(0,y.jsxs)(`b`,{children:[n>0?`+`:``,n,` pp`]})]},e.id||e.name)})})})}function P({round:e,state:t,analysis:n,profileRound:r=e}){let i=n?.reveal_tools;return i?Number(r)===1?(0,y.jsx)(j,{state:t,reveal:i}):Number(r)===3?(0,y.jsxs)(`div`,{className:`v2-tools-grid reveal-tools`,children:[(0,y.jsx)(M,{result:i.experiment}),(0,y.jsx)(N,{segments:i.segments||[]})]}):null:null}export{k as n,P as r,A as t};