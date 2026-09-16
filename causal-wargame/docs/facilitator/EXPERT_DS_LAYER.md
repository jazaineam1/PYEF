# Causal Quest · capa avanzada para científicos de datos

Esta capa **no agrega una quinta ronda** ni extiende el juego más allá de 120 minutos. Su propósito es elevar la exigencia intelectual para participantes que ya conocen ML, validación, regresión y experimentación básica.

## Principio

El participante no debe salir pensando “aprendí tres estimadores nuevos”. Debe salir usando esta secuencia mental:

`pregunta → identificación → soporte → estimación → incertidumbre → refutación → política`

Un resultado numérico no gana autoridad por venir de un modelo sofisticado.

## R2 · overlap en máximo 2 minutos

Después de discutir confusión, muestra el panel de soporte:

- mora baja: 48% llamados / 52% no llamados;
- mora media: 61% / 39%;
- mora alta: 97% / 3%.

Pregunta solamente:

> Si casi todos los clientes de mora alta fueron llamados, ¿de dónde aprendemos qué habría pasado con clientes comparables sin llamada?

Respuesta esperada: la inferencia para ese segmento depende de extrapolación fuerte; conviene restringir la población objetivo o conseguir más evidencia.

No derives propensity scores ni fórmulas de pesos. El objetivo es entender **positividad/overlap como permiso para comparar**.

## R3 · MDE como decisión de negocio, no clase de potencia

El Diseñador muestra un MDE aproximado para N=200, 2.000 y 20.000 y permite declarar un efecto mínimo útil de 2, 5 u 8 pp.

Pregunta:

> Si una campaña sólo paga sus costos a partir de +2 pp, ¿un experimento cuyo MDE aproximado es 5 pp responde la pregunta de negocio?

La respuesta es no necesariamente: puede estar bien aleatorizado y aun ser demasiado impreciso para distinguir un efecto económicamente relevante.

Regla docente:

- más N → más precisión;
- más N **no** → menos sesgo de selección;
- MDE no demuestra causalidad;
- el cálculo mostrado es aproximado y didáctico.

## R3 · interferencia en una frase

No enseñes SUTVA como acrónimo obligatorio. Haz una pregunta concreta:

> Si una llamada a un cliente cambia el comportamiento de otro cliente de su hogar, ¿siguen siendo independientes nuestras unidades?

Si la respuesta es no, explica que el diseño debe reconocer contagio/interferencia; por ejemplo, aleatorizar por hogar o cluster cuando corresponda.

## R4 · stress test antes de política

El Explorador presenta un placebo: un outcome medido antes de la campaña parece mostrar +4.7 pp con el mismo pipeline.

Pregunta:

> La campaña no puede causar un resultado anterior. ¿Qué debe cambiar?

Respuesta esperada: reducir confianza y revisar identificación, datos o pipeline antes de convertir CATE en política.

El propósito no es enseñar una batería completa de refuters. Es instalar el hábito:

> Una estimación causal debe ser desafiada, no sólo optimizada.

## Brújula de identificación · cierre de 2–3 minutos

No expliques cada método. Úsala para transferencia:

| Situación | Estrategia a considerar | Pregunta crítica |
|---|---|---|
| Puedes asignar | RCT | ¿Cómo preservas comparabilidad antes de ver resultados? |
| Observacional + confusores medidos defendibles | Backdoor / ajuste | ¿Qué ajustar y dónde existe overlap? |
| Regla con umbral | RDD | ¿Las unidades cerca del corte son comparables? |
| Cambio de política + comparación | DiD | ¿Es defendible la tendencia paralela? |
| Fuente exógena de asignación | IV | ¿El instrumento cumple exclusión y relevancia? |
| Nada de lo anterior | No prometer causalidad | ¿Qué evidencia o diseño adicional necesitas? |

## Señales de aprendizaje fuerte

Un participante avanzado está aprendiendo si espontáneamente dice cosas como:

- “¿cuál es el estimando?”;
- “eso es asociación, ¿qué identifica el efecto?”;
- “¿hay soporte en ese segmento?”;
- “ese IC es estrecho, pero la asignación sigue sesgada”;
- “tres estimadores pueden compartir el mismo sesgo”;
- “ese placebo me obliga a revisar el pipeline”;
- “el efecto es positivo, pero ¿paga el costo y respeta capacidad?”;
- “con estos datos no prometería causalidad”.

## Qué NO agregar en las dos horas

No conviertas el juego en un catálogo de métodos. DiD, RDD, IV, front-door, synthetic control, DML y otros enfoques pueden aparecer como mapa de salida, no como seis mini-clases adicionales.

Tampoco conviertas MDE, propensity score o sensibilidad en ejercicios algebraicos largos. Las herramientas deben servir a una decisión causal concreta.

## Presupuesto de tiempo

La capa avanzada debe caber dentro del cronograma existente:

- R2 overlap + stress test: 2 min dentro del laboratorio/debrief;
- R3 MDE: 2 min dentro del Diseñador de Experimentos;
- R4 placebo: 2 min dentro del Explorador;
- brújula final: 2–3 min dentro de la síntesis.

Si falta tiempo, recorta mercado o discusión secundaria. No elimines reveal, debrief ni transferencia final.
