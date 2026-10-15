import React,{useEffect,useMemo,useRef,useState} from 'react';
import{createRoot}from'react-dom/client';
import './dean-correlation.css';

// Pyodide is loaded only after an explicit click; the user's CSV stays in this browser.
// No server-side analysis, no unreviewed package installation, no local or browser data exfiltration.
const PYODIDE_URL='https://cdn.jsdelivr.net/pyodide/v0.28.3/full/pyodide.mjs';
const PYODIDE_INDEX='https://cdn.jsdelivr.net/pyodide/v0.28.3/full/';
const FACTORS=[
 {key:'horas_bienestar_jornada',x:'horas_bienestar_jornada',y:'nota_final',name:'🏃 Bienestar frente a la nota'},
 {key:'horas_estudio_jornada',x:'horas_estudio_jornada',y:'nota_final',name:'📚 Estudio frente a la nota'},
 {key:'horas_sueno_jornada',x:'horas_sueno_jornada',y:'nota_final',name:'😴 Sueño frente a la nota'},
 {key:'sacrificio_estudio_bienestar',x:'horas_estudio_jornada',y:'horas_bienestar_jornada',name:'⚖️ Sacrificio: estudio frente a bienestar'}
];
const NOTEBOOK='./notebooks/copa_decano_6_examenes_correlaciones.ipynb';
const COLAB='https://colab.research.google.com/github/jazaineam1/PYEF/blob/main/causal-wargame/public/notebooks/copa_decano_6_examenes_correlaciones.ipynb';

const PYTHON=String.raw`
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
def metrics(records,col,outcome='nota_final'):
    x=[r[col] for r in records];y=[r[outcome] for r in records]
    r=pearson(x,y)
    rho=pearson(rank(x),rank(y))
    return {'r':r,'rho':rho,'n':len(records)}
if 'selected_y' not in globals(): selected_y='nota_final'
factors={key:metrics(rows,key) for key in ['horas_bienestar_jornada','horas_estudio_jornada','horas_sueno_jornada']}
factors['sacrificio_estudio_bienestar']=metrics(rows,'horas_estudio_jornada','horas_bienestar_jornada')
by_student=collections.defaultdict(list)
for r in rows:by_student[(r['sala'],r['estudiante_id'])].append(r)
cx=[];cy=[]
for observations in by_student.values():
    if len(observations)<2: continue
    avg_x=statistics.mean(o[selected_var] for o in observations)
    avg_y=statistics.mean(o[selected_y] for o in observations)
    cx.extend(o[selected_var]-avg_x for o in observations)
    cy.extend(o[selected_y]-avg_y for o in observations)
within=pearson(cx,cy)
by_profile={}
for profile in ['over','balanced','risk','pragmatic']:
    sub=[r for r in rows if r['arquetipo']==profile]
    by_profile[profile]=metrics(sub,selected_var,selected_y)
x=[r[selected_var] for r in rows];y=[r[selected_y] for r in rows]
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
        'points':[{'x':r[selected_var],'y':r[selected_y],'profile':r['arquetipo']} for r in rows]}
json.dumps(result,ensure_ascii=False,allow_nan=False)
`;

const showR=v=>v==null?'No calculable':Number(v).toFixed(3);
function correlationReading(r){
 if(r==null||!Number.isFinite(r))return 'No calculable: faltan puntos o variación.';
 const direction=r>0?'positiva':r<0?'negativa':'sin dirección';
 const absolute=Math.abs(r);
 const strength=absolute<.1?'prácticamente nula':absolute<.3?'débil':absolute<.7?'moderada':'fuerte';
 return 'Asociación lineal '+direction+', '+strength+'; r²='+Number(r*r).toFixed(2)+'. No expresa un efecto causal.';
}
function Scatter({points=[],line=null,factor,outcome='Nota final',yMax=50}) {
 const xvalues=points.map(p=>p.x),min=Math.min(...xvalues),max=Math.max(...xvalues);
 const xmin=Math.floor(Math.min(0,min)*2)/2,xmax=Math.ceil(Math.max(max,xmin+1)*2)/2;
 const xfn=x=>56+(x-xmin)/(xmax-xmin)*656;
 const yfn=y=>277-y/yMax*252;
 const colors={over:'#fcb764',balanced:'#56dcca',risk:'#f98da6',pragmatic:'#a0b7ff'};
 return <svg className="corr-plot" viewBox="0 0 750 330" role="img" aria-label={'Diagrama de dispersión: '+factor+' y '+outcome}>
  <rect x="56" y="25" width="656" height="252" rx="9" fill="#0c1c38"/>
  {Array.from({length:6},(_,i)=>Number((i*yMax/5).toFixed(1))).map(v=><g key={v}><line x1="56" x2="712" y1={yfn(v)} y2={yfn(v)} stroke="#3f5a75" strokeDasharray="3 5"/><text x="45" y={yfn(v)+4} fontSize="12" fill="#c7d8eb" textAnchor="end">{v}</text></g>)}
  {[0,1,2,3,4].map(i=>{let t=xmin+(xmax-xmin)*i/4;return <text key={i} x={xfn(t)} y="298" fontSize="12" textAnchor="middle" fill="#c7d8eb">{t.toFixed(1)}</text>})}
  {points.map((p,i)=><circle key={i} cx={xfn(p.x)} cy={yfn(p.y)} r="4" fill={colors[p.profile]||'#65ddda'} fillOpacity=".62" stroke="#061023" strokeWidth=".5"><title>{p.profile+" · "+p.x+" horas · "+outcome+" "+p.y.toFixed(1)}</title></circle>)}
  {line&&<line x1={xfn(xmin)} x2={xfn(xmax)} y1={yfn(Math.max(0,Math.min(yMax,line.intercept+line.slope*xmin)))} y2={yfn(Math.max(0,Math.min(yMax,line.intercept+line.slope*xmax)))} stroke="#ffdb7c" strokeWidth="3" strokeDasharray="8 5"/>}
  <text x="385" y="321" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#d0eafd">{factor} (horas)</text>
  <text transform="translate(14 151) rotate(-90)" textAnchor="middle" fontSize="13" fill="#d0eafd">{outcome}</text>
 </svg>;
}

// The analysis lives in the player/teacher scene, not in a fourth public game view.
export function CopaCorrelation({loadCsv=null,onContinue=null,embedded=false}){
 const [csvText,setCsvText]=useState('');
 const [fileName,setFileName]=useState('');
 const [factor,setFactor]=useState('horas_bienestar_jornada');
 const [profile,setProfile]=useState('todos');
 const [onlyManual,setOnlyManual]=useState(false);
 const [busy,setBusy]=useState(false);
 const [status,setStatus]=useState('');
 const [data,setData]=useState(null);
 const [refreshIndex,setRefreshIndex]=useState(0);
 const instance=useRef(null);
 const runtimePromise=useRef(null);
 async function fetchWholeCup(){
  if(!loadCsv)return;
  setBusy(true);setStatus('Consultando los exámenes reales de todas las salas…');
  try{
   const blob=await loadCsv();
   const csv=await blob.text();
   if(csv.length<40)throw Error('La Copa todavía no tiene registros analizables.');
   setCsvText(csv);
   setRefreshIndex(i=>i+1);
   setFileName('CSV completo de la Copa · Datos observados del servidor');
   setStatus('Datos recibidos. Ejecutando Python WebAssembly…');
  }catch(e){setBusy(false);setData(null);setStatus('No pudimos obtener el CSV: '+(e?.message||String(e)));}
 }
 useEffect(()=>{if(loadCsv)void fetchWholeCup();},[]);
 useEffect(()=>{if(embedded&&csvText)void analyse();},[csvText,factor,profile,onlyManual,refreshIndex]);
 async function pick(e){
  const f=e.target.files?.[0];if(!f)return;
  if(f.size>2_000_000){setStatus('Este archivo supera 2 MB. Usa el CSV de la Copa.');return}
  setCsvText(await f.text());setFileName(f.name);setData(null);setStatus('Archivo listo. Pulsa «Analizar con Python».');
 }
 async function analyse(){
  if(!csvText)return;
  setBusy(true);setStatus('Cargando Python en tu navegador…');
  try{
   if(!runtimePromise.current){
    runtimePromise.current=import(/* @vite-ignore */ PYODIDE_URL).then(module=>module.loadPyodide({indexURL:PYODIDE_INDEX}));
   }
   const runtime=await runtimePromise.current;
   instance.current=runtime;
   setStatus('Python está calculando las correlaciones…');
   runtime.globals.set('csv_input',csvText);
   runtime.globals.set('selected_var',FACTORS.find(f=>f.key===factor)?.x||factor);
   runtime.globals.set('selected_y',FACTORS.find(f=>f.key===factor)?.y||'nota_final');
   runtime.globals.set('selected_archetype',profile);
   runtime.globals.set('only_manual',onlyManual);
   const result=await runtime.runPythonAsync(PYTHON);
   setData(JSON.parse(result));setStatus('✅ Análisis terminado · Python/Pyodide · los datos no salen de tu navegador.');
  }catch(e){setData(null);setStatus('No fue posible analizar el archivo: '+(e?.message||String(e)));}
  finally{setBusy(false)}
 }
 const selectedFactor=FACTORS.find(f=>f.key===factor)||FACTORS[0];
 const factorLabel=selectedFactor.name;
 const detail=useMemo(()=>data?.factors?.[factor]||null,[data,factor]);
 return <div className={'corr-page'+(embedded?' corr-embedded':'')}>
  <header className="corr-top"><div><span>🏆 COPA DEL DECANO · ANÁLISIS DENTRO DEL JUEGO</span><h1>📉 ¿Correlación negativa?</h1><p>Python WebAssembly calcula la relación sobre los parciales reales de todas las salas. El signo se obtiene de los datos; no está predeterminado.</p></div>
   {embedded&&onContinue&&<button type="button" className="corr-ghost" onClick={onContinue}>🏛️ Ir a decisión →</button>}</header>
  <main className="corr-grid">
   <section className="corr-panel">
    <div className="corr-step">01 · DATOS</div>
    <h2>{embedded?'Datos generados por los participantes':'Importar datos de la Copa'}</h2>
    <p>{embedded?'Se obtiene automáticamente el CSV del servidor: todas las salas y los exámenes registrados hasta ahora, sin descargas ni cargas manuales.':'Selecciona un CSV de la Copa.'}</p>
    {embedded?<button type="button" className="corr-refresh" disabled={busy} onClick={fetchWholeCup}>🔄 ACTUALIZAR DATOS DE TODAS LAS SALAS</button>:
      <label className="corr-upload">📂 ELEGIR CSV<input type="file" accept=".csv,text/csv" onChange={pick}/></label>}
    {fileName&&<small className="corr-muted">Archivo: {fileName}</small>}
    <div className="corr-step">02 · EXPLORAR</div>
    <label className="corr-field">Relación a analizar
     <select value={factor} onChange={e=>{setFactor(e.target.value);setData(null)}}>{FACTORS.map(f=><option key={f.key} value={f.key}>{f.name}</option>)}</select>
    </label>
    <label className="corr-field">Arquetipo
     <select value={profile} onChange={e=>{setProfile(e.target.value);setData(null)}}>
      <option value="todos">Todos</option><option value="over">Sobreexigido</option>
      <option value="balanced">Equilibrado</option><option value="risk">En riesgo</option>
      <option value="pragmatic">Pragmático</option>
     </select></label>
    <label className="corr-check"><input type="checkbox" checked={onlyManual} onChange={e=>{setOnlyManual(e.target.checked);setData(null)}}/> Solo decisiones humanas (excluir los simulados)</label>
    {!embedded&&<button className="corr-button" type="button" disabled={busy||!csvText} onClick={analyse}>{busy?'⏳ CALCULANDO…':'🐍 ANALIZAR CON PYTHON'}</button>}
    <p className="corr-status" role="status">{status||'Carga un CSV para empezar.'}</p>
    {!embedded&&<><div className="corr-step">03 · CONCLUSIONES</div>
    <p>Los cálculos se ejecutan dentro del navegador con Python.</p></>}
   </section>
   <section className="corr-results" aria-live="polite">
    {!data?<div className="corr-empty"><span aria-hidden="true">🔬</span><h2>Tu laboratorio está listo</h2><p>La gráfica y las correlaciones aparecerán aquí tras analizar el CSV.</p></div>:<>
     <div className="corr-result-head"><h2>Relaciones observadas</h2><small>{data.n} parciales analizados · {data.n_students} estudiantes · {data.n_rooms} salas en el archivo · {data.n_simulated} registros simulados en el original</small></div>
     <p className={'corr-reading'+(detail?.r<0?' corr-negative':'')} role="status">{detail?.r<0?'📉 CORRELACIÓN NEGATIVA OBSERVADA · ':detail?.r>=0?'📈 NO SE OBSERVA CORRELACIÓN NEGATIVA · ':''}{correlationReading(detail?.r)}</p><div className="corr-stat-grid"><div><small>Pearson r</small><strong>{showR(detail?.r)}</strong><span>Relación lineal</span></div><div><small>Spearman ρ</small><strong>{showR(detail?.rho)}</strong><span>Relación por rangos</span></div><div><small>Pearson dentro del alumno</small><strong>{showR(data.r_within)}</strong><span>{data.n_within} exámenes con repetición</span></div></div>
     <Scatter points={data.points} line={data.linear} factor={selectedFactor.x==='horas_estudio_jornada'?'Horas de estudio':selectedFactor.x==='horas_sueno_jornada'?'Horas de sueño':'Horas de bienestar'} outcome={selectedFactor.y==='nota_final'?'Nota final / 50':'Horas de bienestar'} yMax={selectedFactor.y==='nota_final'?50:4}/>
     {selectedFactor.y!=='nota_final'&&<p className="corr-reading">Esta gráfica muestra el sacrificio entre actividades: más estudio puede implicar menos horas de bienestar por el límite de 14 horas. Es una relación observada, no un efecto sobre las notas.</p>}
     <div className="corr-legend"><span>🟠 Sobreexigido</span><span>🟢 Equilibrado</span><span>🔴 En riesgo</span><span>🔵 Pragmático</span></div>
     <h3>Comparación por arquetipo</h3>
     <table><thead><tr><th>Perfil</th><th>Exámenes</th><th>Pearson r</th><th>Spearman ρ</th></tr></thead>
      <tbody>{Object.entries(data.profiles).map(([name,item])=><tr key={name}><td>{{over:'Sobreexigido',balanced:'Equilibrado',risk:'En riesgo',pragmatic:'Pragmático'}[name]||name}</td><td>{item.n}</td><td>{showR(item.r)}</td><td>{showR(item.rho)}</td></tr>)}</tbody></table>
     <div className="corr-conclusion"><strong>🏛️ La decisión del Rector</strong><p>Una asociación, sea positiva o negativa, <b>no permite concluir</b> que quitar los beneficios de bienestar elevará la nota. Los arquetipos, el PGA previo, la complejidad de los exámenes y las decisiones de cada estudiante pueden influir. Cada participante aporta hasta seis notas, no seis personas independientes.</p>
      {embedded&&onContinue&&<button type="button" className="corr-button corr-decision" onClick={onContinue}>🏛️ DECIDIR COMO RECTOR →</button>}</div>
    </>}
   </section>
  </main>
 </div>;
}
// Preserve old bookmarked URL without linking or publishing an extra game resource.
if(location.pathname.endsWith('/dean-correlacion.html')){
 createRoot(document.getElementById('root')).render(<CopaCorrelation/>);
}
