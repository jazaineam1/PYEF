# V2 · Cómo agregar un nuevo reto

V2 está separada en cuatro piezas reutilizables:

1. **contenido** del reto;
2. **tipo de decisión**;
3. **perfil de datos/laboratorio**;
4. **puntaje y reveal**.

El archivo principal de autoría es:

`src/v2/challenge-registry.js`

La ruta del estudiante no cambia cuando agregas un reto:

**contexto → decisión → laboratorio → pregunta → revisión → equipo → resultado → aprendizaje**

La interfaz del estudiante usa **una sola página por fase**. No hay pestañas.

## Contrato de un reto

Cada reto del registro define:

- `id` y `order`;
- `template`: cómo decide el estudiante;
- `profileRound`: qué familia de datos/ground truth reutiliza;
- `labKey`: qué laboratorio Python usa;
- `points`: puntos por laboratorio, pregunta, revisión y equipo;
- contexto y pregunta sencilla;
- decisión inicial y revisada;
- pregunta de comprensión;
- decisión de equipo;
- reveal;
- idea simple y nombre técnico posterior.

### Templates disponibles

- `cohort-selection`: seleccionar grupos/cohortes.
- `recommendation`: elegir una recomendación categórica.
- `segment-policy`: asignar una acción a grupos bajo una capacidad.

### Perfiles reutilizables

Actualmente existen tres perfiles de backend:

- `profileRound: 1` → predicción vs. cambio causado.
- `profileRound: 2` → comparación histórica y comparabilidad.
- `profileRound: 3` → experimento, cambio por grupos y valor.

Un reto nuevo puede reutilizar cualquiera de esos perfiles sin duplicar datos ni reescribir las funciones del juego.

## Puntaje

El puntaje es configurable por reto. El valor inicial es:

- laboratorio: **20**
- pregunta: **30**
- revisión: **20**
- decisión de equipo: **hasta 30**

La primera decisión es diagnóstica y no da puntos.

El backend es la autoridad del puntaje. La tabla `cw_v2_challenge_runtime` guarda:

- número de reto;
- `challenge_key`;
- respuesta correcta;
- puntos;
- `profile_round`;
- `template`;
- `lab_key`;
- bloques de laboratorio requeridos.

El laboratorio sólo puede cerrarse cuando el estudiante ha ejecutado todos los bloques requeridos. La pregunta puntuable sólo se puede contestar una vez.

El Wall muestra:

- **Top 3 individual**;
- progreso de cada checkpoint;
- últimos puntos obtenidos;
- y, después del reveal, el valor económico de las decisiones de equipo.

## Agregar un reto que reutiliza algo existente

Ejemplo: quieres un cuarto reto con el mismo tipo de comparación del reto 2.

1. Copia `CHALLENGE_TEMPLATE`.
2. Define `order: 4`.
3. Usa `template: "recommendation"`.
4. Usa `profileRound: 2`.
5. Usa `labKey: "comparison"`.
6. Escribe el nuevo contexto, opciones y pregunta de comprensión.
7. Agrega una fila de runtime para el reto 4 con `profile_round = 2`.
8. Define la respuesta correcta únicamente en backend.
9. Añade pruebas del nuevo manifest.

El motor V2 admite hasta **12 retos** configurados. El conteo de retos es dinámico.

## Cuándo sí hace falta código nuevo

Hace falta un adapter nuevo únicamente cuando:

- la interacción no cabe en los tres templates actuales;
- necesitas un tipo de laboratorio diferente;
- necesitas un nuevo dataset/ground truth y no puedes reutilizar uno de los tres perfiles.

En ese caso se extiende una pieza específica; no se reescribe el recorrido completo.

## Plantilla para pedir un reto nuevo a ChatGPT

> Agrega un reto V2 sobre [tema].  
> Contexto cotidiano: [máximo 2 frases].  
> Pregunta única: [pregunta].  
> Decisión inicial: [decisión].  
> Template: cohort-selection / recommendation / segment-policy.  
> Perfil reutilizable: 1 / 2 / 3.  
> Laboratorio: prediction / comparison / experiment.  
> Pregunta de cierre: [selección múltiple].  
> Opciones: [A/B/C].  
> Respuesta correcta: [sólo backend].  
> Decisión revisada: [qué vuelve a decidir].  
> Decisión de equipo: [qué bloquea].  
> Reveal: [qué estaba oculto].  
> Idea simple: [frase sin jerga].  
> Nombre técnico posterior: [nombre].  
> Puntaje: [lab/check/revision/team].  
> Tiempo: [minutos].

## Regla pedagógica

Un término técnico aparece **después** de que la persona ya entendió el problema.

Primero:

> “Los grupos ya eran diferentes desde antes.”

Después:

> “Esto se llama confusión.”

La ruta principal evalúa comprensión. La profundidad estadística no debe bloquear a quien está aprendiendo el concepto por primera vez.
