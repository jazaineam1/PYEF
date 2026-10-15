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
{id:'h',name:'H · PGA anterior',detail:'Antecedente parcial',x:20,y:24,group:'pre'},
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
 pre:{label:'1 · Causa común de origen',copy:'El arquetipo configura PGA anterior, bienestar, estudio y sueño basales. Es una causa común que el DAG anterior omitía. Ajustar solo PGA no basta; Z puede ser pronóstica sin necesariamente causar la asignación de bienestar.'},
 mediator:{label:'2 · Mediadores',copy:'El bienestar modifica el tiempo disponible para estudiar y el descanso; ambos pueden afectar la fatiga y la nota. Para el efecto TOTAL no basta con controlar todos los descendientes de B.'},
 latent:{label:'3 · La variable invisible',copy:'La fatiga U combina privación de sueño sigmoidal, carga de estudio, trasnocho, complejidad y amortiguación del bienestar. U no se entrega en los archivos del alumno.'}
}
export default function DeanCausalAtlas({phase,teachingStep='challenge'}){
 const meta=scopes[phase], [lens,setLens]=useState(phase==='rector'?'pre':phase==='survey'?'mediator':'latent');
 const [adjust,setAdjust]=useState([]);const visible=teachingStep!=='challenge';
 useEffect(()=>setAdjust([]),[phase]);
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
   {phase==='survey'&&<div className="dean-dag-mission" aria-label="Detective causal: conjunto de ajuste">
    <strong>🎮 Elige qué variables AJUSTARÍAS para el efecto TOTAL de B sobre Y</strong>
    <div className="dean-dag-toggles">{[['archetype','A · Arquetipo de origen'],['h','H · PGA previo'],['z','Z · Complejidad'],['study','X₁ · Estudio posterior'],['sleep','S · Sueño posterior']].map(([id,label])=><button type="button" key={id} aria-pressed={adjust.includes(id)} onClick={()=>setAdjust(previous=>previous.includes(id)?previous.filter(x=>x!==id):[...previous,id])}>{adjust.includes(id)?'✓ ': '+ '}{label}</button>)}</div>
    <small>Seleccionadas: {adjust.length?adjust.map(x=>({archetype:'arquetipo',h:'PGA',z:'complejidad',study:'estudio',sleep:'sueño'})[x]).join(', '):'ninguna'}. Las flechas son supuestos de este simulador.</small>
    {visible&&<p className="dean-dag-feedback">{adjust.includes('study')||adjust.includes('sleep')?'⚠️ Elegiste variables posteriores a B. Si buscas el efecto TOTAL, podrías bloquear mecanismos mediadores.':adjust.includes('archetype')&&adjust.includes('h')?'🧭 Arquetipo y PGA considerados. Aún debes comprobar solapamiento y supuestos: el ajuste no identifica automáticamente el efecto.':'⚠️ El arquetipo es una causa común previa. Ajustar PGA solamente no resuelve todo el sesgo.'}</p>}
   </div>}
   {visible&&<div className="dean-atlas-lenses" aria-label="Selecciona qué mecanismo destacar">
    {Object.entries(lenses).map(([k,v])=><button type="button" key={k} aria-pressed={lens===k} className={lens===k?'selected':''} onClick={()=>setLens(k)}>{v.label}</button>)}
   </div>}
   <div className="dean-atlas-scroll"><svg viewBox="0 0 1090 405" role="img" aria-label="Grafo del generador: el arquetipo A causa los niveles basales de PGA H, bienestar B, estudio X y sueño S; también existen los mecanismos mediadores posteriores de B hacia nota Y.">
    <defs><marker id="atlas-tip" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto"><path d="M0 0 L8 4.5 L0 9" fill="none" stroke="#99e9d8" strokeWidth="1.5"/></marker></defs>
    <path d="M165 168 Q182 70 190 52" fill="none" stroke="#f6d686" strokeWidth="2" markerEnd="url(#atlas-tip)"/>
    <path d="M165 168 Q310 55 468 53" fill="none" stroke="#f6d686" strokeWidth="2" markerEnd="url(#atlas-tip)"/>
    <path d="M165 207 Q300 193 468 190" fill="none" stroke="#f6d686" strokeWidth="2" markerEnd="url(#atlas-tip)"/>
    <path d="M165 218 Q320 320 468 321" fill="none" stroke="#f6d686" strokeWidth="2" markerEnd="url(#atlas-tip)"/>
    <rect x="9" y="152" width="154" height="83" rx="12" fill="#6d493c" stroke="#f6d686" strokeWidth="2"/>
    <text x="20" y="178" fontSize="16" fill="#fff" fontWeight="800">A · Arquetipo</text>
    <text x="20" y="201" fontSize="12" fill="#fff3d3">Origen común</text>
    <text x="20" y="218" fontSize="11" fill="#fff3d3">Disponible en encuesta</text>
    <g transform="translate(170 0)">
    {edges.map(([path,group],i)=><path key={i} d={path} fill="none" stroke={lens===group?'#f6db89':'#8fbbb9'} strokeWidth={lens===group?3:1.5} opacity={lens===group?1:.6} markerEnd="url(#atlas-tip)"/>)}
    {nodes.map(n=><g key={n.id} transform={'translate('+n.x+' '+n.y+')'}>
      <rect width="166" height="58" rx="11" stroke={n.group===lens?'#ffe6a2':'#a7d6d3'} strokeWidth={n.group===lens?3:1.7} fill={n.group==='latent'?'#574255':n.group==='outcome'?'#195647':'#173b55'}/>
      <text x="12" y="25" fontSize="16" fill="#fff" fontWeight="700">{n.name}</text>
      <text x="12" y="44" fontSize="12" fill="#e0f2f4">{visible?n.detail:'Explora la relación'}</text>
    </g>)}
    </g>
   </svg></div>{visible&&<p className="dean-atlas-explanation"><strong>{lenses[lens].label}:</strong> {lenses[lens].copy}</p>}
   <small>Arquetipo es causa común previa según el generador. Aunque ajustes arquetipo y PGA, el solapamiento de B entre perfiles es limitado. Las flechas son supuestos científicos, no resultados del Random Forest.</small>
  </div>}
  {phase==='causal'&&<div className="dean-atlas-two-worlds">
   <article><span>🪞 FUTURO 0</span><strong>do(B = 0 h)</strong><small>Bienestar del grupo control</small></article>
   <b aria-label="Frente a">VS.</b>
   <article><span>⚡ FUTURO 1</span><strong>do(B = 4 h)</strong><small>Programa institucional de bienestar</small></article>
   <p>ATE = media de Y(1)−Y(0). CATE = efecto promedio condicionado a características previas. En el alumno real solo se observaría uno de los dos resultados.</p>
  </div>}
  <p className="dean-atlas-mystery">{meta.mystery}</p>
  {teachingStep==='debrief'&&<div className="dean-atlas-wow">⚡ <strong>Descubrimiento causal:</strong> {meta.reveal}</div>}
  <small>La simulación no aporta evidencia clínica ni experimental sobre estudiantes reales. El arquetipo representa condiciones basales del generador: sí determina PGA, bienestar, estudio y sueño iniciales. No es una propiedad biológica.</small>
 </section>
}
