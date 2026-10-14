import React,{useEffect,useState} from 'react'
import './dean-causal-atlas.css'

// Illustrates DAG v4 from the uploaded SPECS_CURSO_CAUSALIDAD.md.
// Assumptions are explicit; correlations, SHAP and R² do NOT identify effects.
const scopes={
 rector:{stamp:'30–55 MIN · LA ILUSIÓN DEL RECTOR',title:'🏛️ ¿Debemos recortar el bienestar?',lead:'El Rector observa historial previo, complejidad, bienestar y nota. No ve aún el esfuerzo ni el descanso del estudiante.',mystery:'Dos alumnos con la misma nota pueden haber empleado hábitos muy diferentes. Una correlación no equivale a do(B).',reveal:'La historia está incompleta: faltan variables que relacionan decisiones, recursos, fatiga y rendimiento.'},
 survey:{stamp:'55–80 MIN · DESBLOQUEA LA ENCUESTA',title:'🧩 El grafo revela el mecanismo',lead:'Añade horas de estudio y sueño a los datos del Rector. El modelo puede predecir mejor sin demostrar el efecto de una intervención.',mystery:'¿Dónde ajustarías? Las flechas, no la importancia del predictor, indican por qué un control puede bloquear parte del efecto total.',reveal:'Estudio y sueño pueden ser mediadores de B; fatiga U permanece oculta. No debemos condicionar indiscriminadamente todos los nodos.'},
 causal:{stamp:'80–105 MIN · DOS FUTUROS',title:'⚡ Doctor Strange: intervenir no es predecir',lead:'En el experimento A/B se sortea T una vez por estudiante. B=0 y B=4 modifican estudio, sueño, fatiga y nota mediante el DGP.',mystery:'En el mundo sintético ambos potenciales comparten perturbaciones. En la realidad solo observamos el resultado correspondiente al tratamiento asignado.',reveal:'El estimador de diferencia de medias responde una pregunta distinta del R². La incertidumbre debe calcularse por estudiante, no por fila de examen.'}
}
const nodes=[
{id:'h',name:'H · PGA anterior',detail:'Confusor previo',x:20,y:24,group:'pre'},
{id:'z',name:'Z · Complejidad',detail:'Pretratamiento',x:20,y:297,group:'pre'},
{id:'b',name:'B · Bienestar',detail:'Intervención',x:298,y:24,group:'treatment'},
{id:'study',name:'X₁ · Estudio',detail:'Mediador',x:298,y:160,group:'mediator'},
{id:'sleep',name:'S · Sueño',detail:'Mediador',x:298,y:295,group:'mediator'},
{id:'u',name:'U · Fatiga',detail:'Latente',x:581,y:160,group:'latent'},
{id:'y',name:'Y · Nota',detail:'Resultado',x:747,y:298,group:'outcome'}
]
const edges=[
['M186 55 L298 55','pre'],['M186 77 Q422 100 747 323','pre'],['M186 85 L298 188','pre'],
['M186 325 L298 188','pre'],['M186 322 Q401 298 581 192','pre'],['M186 347 L747 330','pre'],
['M380 82 L380 160','mediator'],['M448 72 Q540 120 410 295','mediator'],['M464 56 Q540 60 581 184','latent'],
['M464 63 Q710 70 747 315','outcome'],['M379 218 L379 295','mediator'],
['M464 192 L581 192','latent'],['M464 213 L747 331','outcome'],
['M464 323 L581 208','latent'],['M464 334 L747 334','outcome'],['M661 217 L747 323','outcome']
]
const lenses={
 pre:{label:'1 · Confusores previos',copy:'H es una causa basal de selección y rendimiento. Z influye en el esfuerzo necesario y en la nota. Hay que justificar el conjunto de ajuste por sus flechas.'},
 mediator:{label:'2 · Mediadores',copy:'El bienestar modifica el tiempo disponible para estudiar y el descanso; ambos pueden afectar la fatiga y la nota. Para el efecto TOTAL no basta con controlar todos los descendientes de B.'},
 latent:{label:'3 · La variable invisible',copy:'La fatiga U combina privación de sueño sigmoidal, carga de estudio, trasnocho, complejidad y amortiguación del bienestar. U no se entrega en los archivos del alumno.'}
}
export default function DeanCausalAtlas({phase}){
 const meta=scopes[phase], [lens,setLens]=useState(phase==='rector'?'pre':phase==='survey'?'mediator':'latent')
 useEffect(()=>setLens(phase==='rector'?'pre':phase==='survey'?'mediator':'latent'),[phase])
 if(!meta)return null
 return <section className="dean-atlas" aria-label="Mapa causal interactivo de la Copa del Decano">
  <div className="dean-atlas-eyebrow">{meta.stamp}</div><h2>{meta.title}</h2>
  <p className="dean-atlas-lead">{meta.lead}</p>
  {phase==='rector'&&<div className="dean-atlas-layers">
   <div><b>CAPA 1 · RECTOR</b><span>PGA previo · Complejidad · Bienestar · Nota</span></div>
   <div className="locked"><b>CAPA 2 · ENCUESTA</b><span>Estudio · Sueño · Arquetipo — se desbloquea después</span></div>
   <div className="locked"><b>CAPA 3 · VERDAD SINTÉTICA</b><span>Fatiga U — exclusiva del facilitador</span></div>
  </div>}
  {(phase==='survey'||phase==='causal')&&<div className="dean-atlas-dag">
   <h3>Mapa causal · DAG v4</h3>
   <div className="dean-atlas-lenses" aria-label="Selecciona qué mecanismo destacar">
    {Object.entries(lenses).map(([k,v])=><button type="button" key={k} aria-pressed={lens===k} className={lens===k?'selected':''} onClick={()=>setLens(k)}>{v.label}</button>)}
   </div>
   <div className="dean-atlas-scroll"><svg viewBox="0 0 920 405" role="img" aria-label="Grafo causal: H influye en B, estudio y nota; Z influye en estudio, fatiga y nota; B influye en estudio, sueño, fatiga y nota; estudio influye en sueño, fatiga y nota; sueño influye en fatiga y nota; fatiga influye en nota">
    <defs><marker id="atlas-tip" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto"><path d="M0 0 L8 4.5 L0 9" fill="none" stroke="#99e9d8" strokeWidth="1.5"/></marker></defs>
    {edges.map(([path,group],i)=><path key={i} d={path} fill="none" stroke={lens===group?'#f6db89':'#8fbbb9'} strokeWidth={lens===group?3:1.5} opacity={lens===group?1:.6} markerEnd="url(#atlas-tip)"/>)}
    {nodes.map(n=><g key={n.id} transform={'translate('+n.x+' '+n.y+')'}>
      <rect width="166" height="58" rx="11" stroke={n.group===lens?'#ffe6a2':'#a7d6d3'} strokeWidth={n.group===lens?3:1.7} fill={n.group==='latent'?'#574255':n.group==='outcome'?'#195647':'#173b55'}/>
      <text x="12" y="25" fontSize="16" fill="#fff" fontWeight="700">{n.name}</text>
      <text x="12" y="44" fontSize="12" fill="#e0f2f4">{n.detail}</text>
    </g>)}
   </svg></div><p className="dean-atlas-explanation"><strong>{lenses[lens].label}:</strong> {lenses[lens].copy}</p>
   <small>Las flechas son relaciones asumidas en el simulador del ZIP, no relaciones demostradas por el análisis predictivo.</small>
  </div>}
  {phase==='causal'&&<div className="dean-atlas-two-worlds">
   <article><span>🪞 FUTURO 0</span><strong>do(B = 0 h)</strong><small>Bienestar del grupo control</small></article>
   <b aria-label="Frente a">VS.</b>
   <article><span>⚡ FUTURO 1</span><strong>do(B = 4 h)</strong><small>Programa institucional de bienestar</small></article>
   <p>ATE = media de Y(1)−Y(0). CATE = efecto promedio condicionado a características previas. En el alumno real solo se observaría uno de los dos resultados.</p>
  </div>}
  <p className="dean-atlas-mystery">{meta.mystery}</p>
  <div className="dean-atlas-wow">⚡ <strong>Descubrimiento causal:</strong> {meta.reveal}</div>
  <small>La simulación no aporta evidencia clínica ni experimental sobre estudiantes reales. El arquetipo es una persona de juego, no una causa primitiva del DAG.</small>
 </section>
}
