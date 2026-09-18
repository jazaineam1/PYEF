# V2 · Cómo agregar un nuevo reto

La plataforma V2 separa **contenido**, **tipo de decisión**, **laboratorio** y **puntaje**.

El archivo principal de autoría es:

`src/v2/challenge-registry.js`

Cada reto debe poder explicarse sin jerga en menos de un minuto y debe describir:

- una situación cotidiana;
- una sola pregunta;
- un `profileRound` reutilizable para backend/datos (1, 2 o 3);
- qué decide el estudiante antes de ver evidencia;
- qué laboratorio usa;
- una pregunta corta de cierre;
- qué vuelve a decidir;
- qué decide el equipo;
- qué se revela;
- la idea cotidiana que debe comprender;
- el nombre técnico que se presenta sólo al final.

## Recorrido estándar

La interfaz del estudiante usa **una página por fase**. No hay pestañas.

1. Contexto
2. Decisión inicial
3. Espera al equipo
4. Laboratorio — todos los bloques visibles en una página
5. Pregunta de cierre puntuable
6. Revisión individual
7. Espera al equipo
8. Decisión final del equipo
9. Resultado
10. Qué aprendí

El simulador docente consume este mismo contrato y permite recorrer a cada estudiante de principio a fin.

## Puntaje estándar

Cada reto suma 100 puntos:

- laboratorio terminado: **20**
- pregunta de comprensión: **30**
- revisión individual: **20**
- decisión del equipo: **hasta 30**

La primera decisión es diagnóstica y no da puntos. El puntaje del equipo permanece oculto hasta el reveal.

El Wall muestra el **Top 3 individual** y el progreso de cada checkpoint. El valor económico del equipo es un resultado secundario que aparece después del reveal.

Las respuestas correctas no se incluyen en el bundle del navegador. Se configuran en `cw_v2_challenge_runtime`.

## Perfiles reutilizables de backend

Los datos y la lógica de evaluación no dependen ya del número del reto. Cada manifest declara un `profileRound`:

- `1`: predicción y selección de cohortes;
- `2`: comparación histórica;
- `3`: experimento y política por segmentos.

Por ejemplo, un **Reto 4** puede reutilizar `profileRound: 2` y `labKey: "comparison"`. El backend lo trata como una nueva ronda, pero reutiliza el perfil de datos y evaluación de comparación.

El número máximo de retos se obtiene de las filas habilitadas de `cw_v2_challenge_runtime`; ya no está fijado a tres. La tabla permite hasta 12 rondas.

## Tipos de reto soportados

### `cohort-selection`
Seleccionar un número limitado de grupos.

### `recommendation`
Elegir una recomendación categórica.

### `segment-policy`
Definir una acción para cada grupo bajo una restricción de capacidad.

Si un reto usa uno de estos tipos, se reutiliza la interfaz actual. Un tipo de interacción completamente nuevo requiere un adapter nuevo, no reescribir el recorrido.

## Laboratorios soportados

- `prediction`: qué predice un modelo vs. qué cambia por una acción.
- `comparison`: comparación simple vs. grupos comparables.
- `experiment`: prueba aleatoria, cambio por grupo y valor.

La ruta principal usa sólo código guiado y vocabulario sencillo. Las técnicas avanzadas pueden mantenerse como material de autoría o extensión, pero no aparecen como pestañas en la experiencia normal.

## Plantilla para pedir un reto nuevo a ChatGPT

Puedes pedirlo así:

> Agrega un reto V2 sobre [tema].
> Contexto cotidiano: [máximo 2 frases].
> Pregunta única: [pregunta].
> Decisión inicial: [decisión].
> Laboratorio: [qué deben observar o calcular].
> Pregunta de cierre: [pregunta de selección múltiple].
> Opciones: [A/B/C].
> Respuesta correcta: [sólo para backend, no para el frontend].
> Decisión revisada: [qué vuelven a decidir].
> Decisión de equipo: [qué bloquean].
> Reveal: [verdad oculta].
> Idea simple: [frase sin jerga].
> Nombre técnico posterior: [nombre].
> Tipo: cohort-selection / recommendation / segment-policy.
> Perfil backend: 1 / 2 / 3.
> Laboratorio: prediction / comparison / experiment.
> Tiempo: [minutos].

La implementación debe:

1. agregar el manifest a `V2_CHALLENGES`, incluyendo `profileRound`;
2. registrar el mismo reto en `cw_v2_challenge_runtime` con `round_number`, `challenge_key`, `profile_round`, `template`, `lab_key`, respuesta correcta y puntajes;
3. añadir datos o ground truth si el reto los necesita;
4. reutilizar un template existente cuando sea posible;
5. añadir un adapter sólo si la interacción es nueva;
6. probar que el ground truth no se filtra antes del reveal;
7. probar que el Wall y el Top 3 reciben el nuevo checkpoint;
8. comprobar que el simulador puede recorrerlo. Si no se crea una ruta específica, puede reutilizar la ruta determinística del `profileRound`.

## Regla de simplicidad

Un término técnico aparece **después** de que la persona entendió el problema que ese término nombra.

Ejemplo:

- primero: “los grupos ya eran distintos antes”;
- después: “esto se llama confusión”.

El objetivo principal es que la persona pueda explicar la idea con sus palabras. El nombre técnico sirve para conectar esa intuición con el lenguaje profesional.


## Ejemplo: agregar un Reto 4 reutilizando el perfil de comparación

En el registro del frontend:

```js
{
  id: 'nuevo-reto-comparacion',
  order: 4,
  enabled: true,
  template: 'recommendation',
  profileRound: 2,
  labKey: 'comparison',
  // ...copy pedagógico...
}
```

En runtime:

```sql
insert into public.cw_v2_challenge_runtime(
  round_number, challenge_key, correct_answer,
  lab_points, check_points, revision_points, team_points,
  enabled, profile_round, template, lab_key
) values (
  4, 'nuevo-reto-comparacion', 'a',
  20, 30, 20, 30,
  true, 2, 'recommendation', 'comparison'
);
```

Con eso, Player, Wall, Facilitator, puntaje, flujo de fases y backend pueden avanzar a la ronda 4 sin cambiar el motor base. Sólo hace falta código nuevo si la interacción o el tipo de datos deja de pertenecer a los tres perfiles existentes.
