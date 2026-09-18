# V2 · Cómo agregar un nuevo reto

La plataforma V2 separa **contenido** de **pantallas**.

El archivo central es:

`src/v2/challenge-registry.js`

Cada reto describe:

- una pregunta sencilla;
- el contexto;
- qué decide el estudiante antes de ver evidencia;
- qué laboratorio usa;
- qué vuelve a decidir;
- qué decide el equipo;
- qué se revela;
- la idea cotidiana que debe comprender;
- el término técnico que se presenta después;
- términos avanzados opcionales.

## Recorrido estándar

Todos los retos reutilizan el mismo contrato pedagógico:

1. Contexto
2. Decisión inicial
3. Espera al equipo
4. Laboratorio
5. Revisión individual
6. Comparación antes/después
7. Decisión de equipo
8. Reveal
9. Cierre conceptual

El simulador docente consume este mismo contrato.

## Tipos de reto ya soportados

### `cohort-selection`

Selección de un número limitado de cohortes o unidades.

### `recommendation`

Una decisión categórica como cancelar, mantener o pedir mejor evidencia.

### `segment-policy`

Una política por segmentos: intervenir, no intervenir o pedir más evidencia.

Si un nuevo reto usa uno de estos tipos, el frontend puede reutilizar la pantalla actual. Si exige otra interacción, se agrega un nuevo adapter sin reescribir el recorrido completo.

## Laboratorios ya soportados

- `prediction`: predicción vs. cambio causado.
- `comparison`: comparación cruda vs. grupos comparables.
- `experiment`: experimento, efecto por grupo y valor.

El modo **Guiado** usa vocabulario simple. El botón **Profundizar** muestra técnicas opcionales.

## Plantilla para pedir un reto nuevo a ChatGPT

Usa una instrucción como:

> Agrega un reto V2 sobre [tema].
> Contexto: [2–3 frases].
> Pregunta que debe poder responder el estudiante: [pregunta].
> Decisión inicial: [decisión].
> Evidencia nueva: [qué descubre].
> Decisión revisada: [qué vuelve a decidir].
> Reveal: [verdad oculta].
> Idea simple que debe aprender: [frase sin jerga].
> Término técnico posterior: [nombre].
> Tipo de reto: cohort-selection / recommendation / segment-policy.
> Laboratorio: prediction / comparison / experiment.
> Tiempo: [minutos].
> Mantén los términos avanzados fuera del recorrido principal.

La implementación debe:

1. añadir el manifest a `V2_CHALLENGES`;
2. validar el registro;
3. añadir datos/ground truth si el reto los necesita;
4. extender el adapter sólo si el tipo es nuevo;
5. extender backend/migración si aumenta el número de retos en una partida en vivo;
6. añadir pruebas de no filtración antes del reveal.

## Regla de simplicidad

Un término técnico no aparece en la ruta principal hasta que el estudiante haya encontrado el problema que ese término nombra.

Ejemplo:

- primero: “los grupos eran distintos desde antes”;
- después: “esto se llama confusión”;
- opcional: propensity score, IPW, overlap.

El objetivo de la ruta principal es comprensión. La profundidad estadística queda disponible sin bloquear al resto del grupo.
