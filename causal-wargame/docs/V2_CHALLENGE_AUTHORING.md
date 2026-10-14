# V2 · Cómo agregar una misión causal

DOS FUTUROS · CAMPUS separa tres responsabilidades que no deben volver a acoplarse:

1. **perfil de datos**: qué mundo sintético usa;
2. **template de interacción**: qué decide el estudiante;
3. **laboratorio**: qué análisis Python ejecuta.

El manifiesto vive en:

`src/v2/challenge-registry.js`

La ruta estándar del estudiante es:

**contexto → decisión inicial → laboratorio → pregunta → revisión → equipo → reveal → concepto técnico**

La primera decisión es diagnóstica. Los nombres técnicos aparecen después de experimentar el problema.

## Campos obligatorios

Cada misión define:

- `id`, `order`, `enabled`;
- `template`;
- `profileRound`;
- `labKey`;
- `points`;
- `title`, `scenario`, `simpleQuestion`;
- `initialDecision`, `revisedDecision`, `teamDecision`;
- `plainConcept`;
- `technicalTerm`;
- `advancedTerms`;
- `wow`;
- `takeaway`;
- `checkQuestion`, `checkOptions`;
- `glossary`;
- `timeMinutes`;
- `journey`.

## Regla de acrónimos

Toda sigla mostrada al estudiante debe incluir:

1. sigla;
2. nombre completo;
3. traducción cuando corresponda;
4. definición humana de una frase.

Ejemplo:

**ATE**  
**Average Treatment Effect · Efecto Promedio del Tratamiento**  
Cambio promedio causado por la intervención frente a no intervenir.

No se acepta un término en `advancedTerms` si se convierte en requisito de comprensión sin aparecer definido en `glossary`.

## Templates actuales

### `cohort-selection`
Seleccionar perfiles académicos.

Uso actual: misión 1.

### `single-choice`
Elegir una estrategia o estimador.

Uso actual: misiones 2, 4 y 6.

### `multi-select`
Seleccionar variables.

Uso actual: misión 3 de DAG.

### `segment-policy`
Asignar una política a perfiles con capacidad limitada.

Uso actual: misión 5.

## Tres perfiles de datos reutilizables

### `profileRound: 1` · predictivo

Datos de estudiantes/perfiles para mostrar:

- variables académicas;
- resultado;
- capacidad predictiva.

No revela ground truth causal durante el laboratorio.

### `profileRound: 2` · observacional

Datos donde recibir apoyo depende de covariables previas.

Se reutiliza para:

- DAG;
- ajuste;
- Double Machine Learning.

### `profileRound: 3` · experimento

Datos de tratamiento/control con heterogeneidad conocida en el mundo sintético.

Se reutiliza para:

- A/B y ATE;
- CATE;
- T-Learner;
- model battle;
- benchmarks Causal Forest/EconML.

Un reto nuevo NO necesita un perfil nuevo sólo porque usa un laboratorio distinto.

## Laboratorios actuales

- `prediction`
- `ab-test`
- `dag`
- `dml`
- `heterogeneity`
- `model-battle`

`python-lab.js` construye el contenido ejecutable.

Pyodide permite ejecutar dentro del navegador:

- pandas;
- NumPy;
- SciPy;
- scikit-learn;
- Matplotlib.

EconML no se ejecuta directamente en esta versión del navegador. Si una misión usa EconML, se debe:

1. enseñar primero el estimador;
2. ejecutar un equivalente compatible cuando sea razonable;
3. mostrar resultados EconML precomputados como benchmark claramente etiquetado.

## Puntaje

Por defecto:

- decisión inicial: 0;
- laboratorio: +20;
- pregunta: hasta +30;
- revisión: +20;
- equipo: hasta +30.

Total: 100 por misión.

El backend es autoridad de puntaje y respuesta correcta.

## Wall

El Wall prioriza:

1. Top 3 individual;
2. checkpoint actual;
3. progreso;
4. puntos recientes.

El impacto de equipo se muestra aparte y sólo después del reveal.

Nunca mezclar:

- puntos de aprendizaje;
- impacto académico.

## Las seis misiones actuales

1. Predicción vs. intervención.
2. Experimento A/B, ATE e incertidumbre.
3. DAG y conjunto de ajuste.
4. Double Machine Learning.
5. CATE y heterogeneidad.
6. S/T/DR-Learner, Causal Forest y EconML.

## Ejemplo de una misión nueva

Si quieres una misión 7 sobre overlap:

- `template: "single-choice"`;
- `profileRound: 2`;
- `labKey: "overlap"`;
- añade el builder `overlap` a `python-lab.js`;
- agrega la fila de `cw_v2_challenge_runtime`;
- conserva el mismo journey.

No crees `Reto7.jsx`.

## Criterio para crear código nuevo

Sólo es necesario cuando cambia una de estas capacidades:

- nuevo tipo de interacción;
- nuevo laboratorio;
- nuevo perfil de datos que no puede expresarse con los existentes.

Un contexto narrativo nuevo no es razón suficiente para duplicar componentes.

## Prompt recomendado para una nueva misión

> Agrega una misión V2 sobre [concepto causal].  
> Pregunta humana: [pregunta].  
> Error intuitivo esperado: [error].  
> Efecto WOW: [sorpresa].  
> Template: [cohort-selection / single-choice / multi-select / segment-policy].  
> Perfil de datos: [1 / 2 / 3].  
> LabKey: [existente o nuevo].  
> Decisión inicial: [acción].  
> Evidencia Python: [bloques].  
> Pregunta de comprensión: [A/B/C].  
> Respuesta correcta: [sólo backend].  
> Decisión revisada: [acción].  
> Decisión de equipo: [acción].  
> Plain concept: [sin jerga].  
> Technical term: [nombre].  
> Glossary: [sigla, nombre completo, definición humana].  
> Tiempo: [minutos].

## Regla pedagógica final

Si el estudiante todavía no tiene una pregunta para la cual el término técnico sea útil, el término aparece demasiado pronto.

Primero:

> "Los grupos ya eran diferentes antes."

Después:

> "Eso es confusión."

Primero:

> "El promedio oculta que algunos perfiles cambian mucho más."

Después:

> "Eso es heterogeneidad; ahora podemos hablar de CATE."
