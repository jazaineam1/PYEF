import{r as e}from"./modulepreload-polyfill-DHZR_UKa.js";import{t}from"./react-R8TFQQWi.js";import{t as n}from"./client-1PSGE5X5.js";import{t as r}from"./jsx-runtime-COg3ANyx.js";import{t as i}from"./preload-helper-HclGiUj8.js";var a=e(t(),1),o=n(),s=r(),c=`https://cdn.jsdelivr.net/pyodide/v0.28.3/full/pyodide.mjs`,l=[{key:`horas_bienestar_jornada`,name:`🏃 Bienestar`},{key:`horas_estudio_jornada`,name:`📚 Estudio`},{key:`horas_sueno_jornada`,name:`😴 Sueño`}],u=`./notebooks/copa_decano_6_examenes_correlaciones.ipynb`,d=`https://colab.research.google.com/github/jazaineam1/PYEF/blob/main/causal-wargame/public/notebooks/copa_decano_6_examenes_correlaciones.ipynb`,f=String.raw`
import csv,io,json,math,statistics,collections

required={'estudiante_id','sala','examen_nro','arquetipo','pga_previo','complejidad',
          'horas_estudio_jornada','horas_sueno_jornada','horas_bienestar_jornada','nota_final','auto_simulado'}
reader=csv.DictReader(io.StringIO(csv_input.lstrip('\ufeff')))
if not reader.fieldnames or required-set(reader.fieldnames):
    raise ValueError('CSV inválido. Descarga TODOS LOS DATOS desde la Copa del Decano (faltan columnas).')
rows=[]
for item in reader:
    try:
        obs={k:item[k] for k in ['estudiante_id','arquetipo']}
        obs['sala']=int(item['sala'])
        obs['examen_nro']=int(item['examen_nro'])
        for k in ['pga_previo','complejidad','horas_estudio_jornada','horas_sueno_jornada','horas_bienestar_jornada','nota_final']:
            obs[k]=float(item[k])
        obs['auto_simulado']=item['auto_simulado'].strip().lower() in ('true','t','1','si','sí')
        if not all(math.isfinite(obs[k]) for k in ['pga_previo','complejidad','horas_estudio_jornada','horas_sueno_jornada','horas_bienestar_jornada','nota_final']):
            continue
        if not 0<=obs['nota_final']<=50:
            continue
        rows.append(obs)
    except (ValueError,TypeError,KeyError):
        continue
if not rows:
    raise ValueError('El CSV no tiene exámenes válidos para analizar.')
if len(rows)>3000:
    raise ValueError('El CSV es demasiado grande para la Copa (máximo 3000 registros).')
total=len(rows)
people={(r['sala'],r['estudiante_id']) for r in rows}
raw=list(rows)
if only_manual:
    rows=[r for r in rows if not r['auto_simulado']]
if selected_archetype!='todos':
    rows=[r for r in rows if r['arquetipo']==selected_archetype]
if not rows:
    raise ValueError('No hay registros para el filtro seleccionado.')
def pearson(xs,ys):
    if len(xs)<3: return None
    xm=sum(xs)/len(xs);ym=sum(ys)/len(ys)
    xx=sum((x-xm)**2 for x in xs);yy=sum((y-ym)**2 for y in ys)
    if xx<=1e-12 or yy<=1e-12:return None
    return sum((x-xm)*(y-ym) for x,y in zip(xs,ys))/math.sqrt(xx*yy)
def rank(values):
    ix=sorted(range(len(values)),key=lambda i:values[i])
    ans=[0.0]*len(values);i=0
    while i<len(ix):
        j=i+1
        while j<len(ix) and values[ix[j]]==values[ix[i]]:j+=1
        v=(i+j+1)/2
        for z in range(i,j):ans[ix[z]]=v
        i=j
    return ans
def metrics(records,col):
    x=[r[col] for r in records];y=[r['nota_final'] for r in records]
    r=pearson(x,y)
    rho=pearson(rank(x),rank(y))
    return {'r':r,'rho':rho,'n':len(records)}
factors={key:metrics(rows,key) for key in ['horas_bienestar_jornada','horas_estudio_jornada','horas_sueno_jornada']}
by_student=collections.defaultdict(list)
for r in rows:by_student[(r['sala'],r['estudiante_id'])].append(r)
cx=[];cy=[]
for observations in by_student.values():
    if len(observations)<2: continue
    avg_x=statistics.mean(o[selected_var] for o in observations)
    avg_y=statistics.mean(o['nota_final'] for o in observations)
    cx.extend(o[selected_var]-avg_x for o in observations)
    cy.extend(o['nota_final']-avg_y for o in observations)
within=pearson(cx,cy)
by_profile={}
for profile in ['over','balanced','risk','pragmatic']:
    sub=[r for r in rows if r['arquetipo']==profile]
    by_profile[profile]=metrics(sub,selected_var)
x=[r[selected_var] for r in rows];y=[r['nota_final'] for r in rows]
linear=None
if len(rows)>=3 and len(set(x))>1:
    xm=sum(x)/len(x);ym=sum(y)/len(y);den=sum((v-xm)**2 for v in x)
    slope=sum((v-xm)*(z-ym) for v,z in zip(x,y))/den
    linear={'slope':slope,'intercept':ym-slope*xm}
result={'n':len(rows),'n_total':total,'n_students':len(by_student),'n_students_total':len(people),
        'n_rooms':len({r['sala'] for r in raw}),
        'n_simulated':sum(r['auto_simulado'] for r in raw),
        'factors':factors,'r_within':within,'n_within':len(cx),
        'profiles':by_profile,'linear':linear,
        'points':[{'x':r[selected_var],'y':r['nota_final'],'profile':r['arquetipo']} for r in rows]}
json.dumps(result,ensure_ascii=False,allow_nan=False)
`,p=e=>e==null?`No calculable`:Number(e).toFixed(3);function m(e){if(e==null||!Number.isFinite(e))return`No calculable: faltan puntos o variación.`;let t=e>0?`positiva`:e<0?`negativa`:`sin dirección`,n=Math.abs(e),r=n<.1?`prácticamente nula`:n<.3?`débil`:n<.7?`moderada`:`fuerte`;return`Asociación lineal `+t+`, `+r+`; r²=`+Number(e*e).toFixed(2)+`. No expresa un efecto causal.`}function h({points:e=[],line:t=null,factor:n}){let r=e.map(e=>e.x),i=Math.min(...r),a=Math.max(...r),o=Math.floor(Math.min(0,i)*2)/2,c=Math.ceil(Math.max(a,o+1)*2)/2,l=e=>56+(e-o)/(c-o)*656,u=e=>277-e/50*252,d={over:`#fcb764`,balanced:`#56dcca`,risk:`#f98da6`,pragmatic:`#a0b7ff`};return(0,s.jsxs)(`svg`,{className:`corr-plot`,viewBox:`0 0 750 330`,role:`img`,"aria-label":`Diagrama de dispersión: `+n+` y nota final`,children:[(0,s.jsx)(`rect`,{x:`56`,y:`25`,width:`656`,height:`252`,rx:`9`,fill:`#0c1c38`}),[0,10,20,30,40,50].map(e=>(0,s.jsxs)(`g`,{children:[(0,s.jsx)(`line`,{x1:`56`,x2:`712`,y1:u(e),y2:u(e),stroke:`#3f5a75`,strokeDasharray:`3 5`}),(0,s.jsx)(`text`,{x:`45`,y:u(e)+4,fontSize:`12`,fill:`#c7d8eb`,textAnchor:`end`,children:e})]},e)),[0,1,2,3,4].map(e=>{let t=o+(c-o)*e/4;return(0,s.jsx)(`text`,{x:l(t),y:`298`,fontSize:`12`,textAnchor:`middle`,fill:`#c7d8eb`,children:t.toFixed(1)},e)}),e.map((e,t)=>(0,s.jsx)(`circle`,{cx:l(e.x),cy:u(e.y),r:`4`,fill:d[e.profile]||`#65ddda`,fillOpacity:`.62`,stroke:`#061023`,strokeWidth:`.5`,children:(0,s.jsx)(`title`,{children:e.profile+` · `+e.x+` horas · nota `+e.y.toFixed(1)})},t)),t&&(0,s.jsx)(`line`,{x1:l(o),x2:l(c),y1:u(Math.max(0,Math.min(50,t.intercept+t.slope*o))),y2:u(Math.max(0,Math.min(50,t.intercept+t.slope*c))),stroke:`#ffdb7c`,strokeWidth:`3`,strokeDasharray:`8 5`}),(0,s.jsxs)(`text`,{x:`385`,y:`321`,textAnchor:`middle`,fontSize:`13`,fontWeight:`bold`,fill:`#d0eafd`,children:[n,` (horas)`]}),(0,s.jsx)(`text`,{transform:`translate(14 151) rotate(-90)`,textAnchor:`middle`,fontSize:`13`,fill:`#d0eafd`,children:`Nota / 50`})]})}function g(){let[e,t]=(0,a.useState)(``),[n,r]=(0,a.useState)(``),[o,g]=(0,a.useState)(`horas_bienestar_jornada`),[_,v]=(0,a.useState)(`todos`),[y,b]=(0,a.useState)(!1),[x,S]=(0,a.useState)(!1),[C,w]=(0,a.useState)(``),[T,E]=(0,a.useState)(null),D=(0,a.useRef)(null);async function O(e){let n=e.target.files?.[0];n&&(n.size>2e6?w(`Este archivo supera 2 MB. Usa el CSV de la Copa.`):(t(await n.text()),r(n.name),E(null),w(`Archivo listo. Pulsa «Analizar con Python».`)))}async function k(){if(e){S(!0),w(`Cargando Python en tu navegador…`);try{if(!D.current){let e=await i(()=>import(c),[],import.meta.url);D.current=await e.loadPyodide()}w(`Python está calculando las correlaciones…`);let t=D.current;t.globals.set(`csv_input`,e),t.globals.set(`selected_var`,o),t.globals.set(`selected_archetype`,_),t.globals.set(`only_manual`,y);let n=await t.runPythonAsync(f);E(JSON.parse(n)),w(`✅ Análisis terminado · Python/Pyodide · los datos no salen de tu navegador.`)}catch(e){E(null),w(`No fue posible analizar el archivo: `+(e?.message||String(e)))}finally{S(!1)}}}let A=l.find(e=>e.key===o)?.name||o,j=(0,a.useMemo)(()=>T?.factors?.[o]||null,[T,o]);return(0,s.jsxs)(`div`,{className:`corr-page`,children:[(0,s.jsxs)(`header`,{className:`corr-top`,children:[(0,s.jsxs)(`div`,{children:[(0,s.jsx)(`span`,{children:`🏆 COPA DEL DECANO · LABORATORIO EXTERNO`}),(0,s.jsx)(`h1`,{children:`¿Correlación o efecto del bienestar?`}),(0,s.jsx)(`p`,{children:`Importa el CSV de todas las salas y deja que Python calcule las relaciones.`})]}),(0,s.jsx)(`a`,{href:`./dean-play.html`,className:`corr-ghost`,children:`← Volver al juego`})]}),(0,s.jsxs)(`main`,{className:`corr-grid`,children:[(0,s.jsxs)(`section`,{className:`corr-panel`,children:[(0,s.jsx)(`div`,{className:`corr-step`,children:`01 · DATOS`}),(0,s.jsx)(`h2`,{children:`Sube los datos de la Copa`}),(0,s.jsxs)(`p`,{children:[`Al finalizar los seis exámenes, descarga `,(0,s.jsx)(`strong`,{children:`TODOS LOS DATOS DE LAS 5 SALAS`}),`. El archivo se analiza localmente.`]}),(0,s.jsxs)(`label`,{className:`corr-upload`,children:[`📂 ELEGIR CSV`,(0,s.jsx)(`input`,{type:`file`,accept:`.csv,text/csv`,onChange:O})]}),n&&(0,s.jsxs)(`small`,{className:`corr-muted`,children:[`Archivo: `,n]}),(0,s.jsx)(`div`,{className:`corr-step`,children:`02 · EXPLORAR`}),(0,s.jsxs)(`label`,{className:`corr-field`,children:[`Relación a analizar`,(0,s.jsx)(`select`,{value:o,onChange:e=>{g(e.target.value),E(null)},children:l.map(e=>(0,s.jsxs)(`option`,{value:e.key,children:[e.name,` vs. Nota final`]},e.key))})]}),(0,s.jsxs)(`label`,{className:`corr-field`,children:[`Arquetipo`,(0,s.jsxs)(`select`,{value:_,onChange:e=>{v(e.target.value),E(null)},children:[(0,s.jsx)(`option`,{value:`todos`,children:`Todos`}),(0,s.jsx)(`option`,{value:`over`,children:`Sobreexigido`}),(0,s.jsx)(`option`,{value:`balanced`,children:`Equilibrado`}),(0,s.jsx)(`option`,{value:`risk`,children:`En riesgo`}),(0,s.jsx)(`option`,{value:`pragmatic`,children:`Pragmático`})]})]}),(0,s.jsxs)(`label`,{className:`corr-check`,children:[(0,s.jsx)(`input`,{type:`checkbox`,checked:y,onChange:e=>{b(e.target.checked),E(null)}}),` Solo decisiones humanas (excluir los simulados)`]}),(0,s.jsx)(`button`,{className:`corr-button`,type:`button`,disabled:x||!e,onClick:k,children:x?`⏳ CALCULANDO…`:`🐍 ANALIZAR CON PYTHON`}),(0,s.jsx)(`p`,{className:`corr-status`,role:`status`,children:C||`Carga un CSV para empezar.`}),(0,s.jsx)(`div`,{className:`corr-step`,children:`03 · NOTA GUIADA`}),(0,s.jsx)(`p`,{children:`¿Prefieres Colab? El notebook hace la revisión completa: calidad, Pearson, Spearman, arquetipos, comparaciones individuales y ajuste exploratorio.`}),(0,s.jsx)(`a`,{className:`corr-notebook`,href:d,target:`_blank`,rel:`noreferrer`,children:`📓 Abrir notebook en Google Colab ↗`}),(0,s.jsx)(`a`,{className:`corr-muted`,href:u,download:!0,children:`⬇ Descargar notebook (.ipynb)`})]}),(0,s.jsx)(`section`,{className:`corr-results`,"aria-live":`polite`,children:T?(0,s.jsxs)(s.Fragment,{children:[(0,s.jsxs)(`div`,{className:`corr-result-head`,children:[(0,s.jsx)(`h2`,{children:`Relaciones observadas`}),(0,s.jsxs)(`small`,{children:[T.n,` parciales analizados · `,T.n_students,` estudiantes · `,T.n_rooms,` salas en el archivo · `,T.n_simulated,` registros simulados en el original`]})]}),(0,s.jsx)(`p`,{className:`corr-reading`,role:`status`,children:m(j?.r)}),(0,s.jsxs)(`div`,{className:`corr-stat-grid`,children:[(0,s.jsxs)(`div`,{children:[(0,s.jsx)(`small`,{children:`Pearson r`}),(0,s.jsx)(`strong`,{children:p(j?.r)}),(0,s.jsx)(`span`,{children:`Relación lineal`})]}),(0,s.jsxs)(`div`,{children:[(0,s.jsx)(`small`,{children:`Spearman ρ`}),(0,s.jsx)(`strong`,{children:p(j?.rho)}),(0,s.jsx)(`span`,{children:`Relación por rangos`})]}),(0,s.jsxs)(`div`,{children:[(0,s.jsx)(`small`,{children:`Pearson dentro del alumno`}),(0,s.jsx)(`strong`,{children:p(T.r_within)}),(0,s.jsxs)(`span`,{children:[T.n_within,` exámenes con repetición`]})]})]}),(0,s.jsx)(h,{points:T.points,line:T.linear,factor:A}),(0,s.jsxs)(`div`,{className:`corr-legend`,children:[(0,s.jsx)(`span`,{children:`🟠 Sobreexigido`}),(0,s.jsx)(`span`,{children:`🟢 Equilibrado`}),(0,s.jsx)(`span`,{children:`🔴 En riesgo`}),(0,s.jsx)(`span`,{children:`🔵 Pragmático`})]}),(0,s.jsx)(`h3`,{children:`Comparación por arquetipo`}),(0,s.jsxs)(`table`,{children:[(0,s.jsx)(`thead`,{children:(0,s.jsxs)(`tr`,{children:[(0,s.jsx)(`th`,{children:`Perfil`}),(0,s.jsx)(`th`,{children:`Exámenes`}),(0,s.jsx)(`th`,{children:`Pearson r`}),(0,s.jsx)(`th`,{children:`Spearman ρ`})]})}),(0,s.jsx)(`tbody`,{children:Object.entries(T.profiles).map(([e,t])=>(0,s.jsxs)(`tr`,{children:[(0,s.jsx)(`td`,{children:{over:`Sobreexigido`,balanced:`Equilibrado`,risk:`En riesgo`,pragmatic:`Pragmático`}[e]||e}),(0,s.jsx)(`td`,{children:t.n}),(0,s.jsx)(`td`,{children:p(t.r)}),(0,s.jsx)(`td`,{children:p(t.rho)})]},e))})]}),(0,s.jsxs)(`div`,{className:`corr-conclusion`,children:[(0,s.jsx)(`strong`,{children:`🏛️ La decisión del Rector`}),(0,s.jsxs)(`p`,{children:[`Una asociación, sea positiva o negativa, `,(0,s.jsx)(`b`,{children:`no permite concluir`}),` que quitar los beneficios de bienestar elevará la nota. Los arquetipos, el PGA previo, la complejidad de los exámenes y las decisiones de cada estudiante pueden influir. Cada participante aporta hasta seis notas, no seis personas independientes.`]})]})]}):(0,s.jsxs)(`div`,{className:`corr-empty`,children:[(0,s.jsx)(`span`,{"aria-hidden":`true`,children:`🔬`}),(0,s.jsx)(`h2`,{children:`Tu laboratorio está listo`}),(0,s.jsx)(`p`,{children:`La gráfica y las correlaciones aparecerán aquí tras analizar el CSV.`})]})})]})]})}(0,o.createRoot)(document.getElementById(`root`)).render((0,s.jsx)(g,{}));