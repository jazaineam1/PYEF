# DOS FUTUROS CAMPUS V2 — implementación de la Copa Causal (14–30 asistentes, admisión 1–30)
**Ruta:** `/dos-futuros/dean-play.html` · `dean-wall.html` · `dean-teacher.html`
**Alcance:** exclusivamente torneos nuevos `zip_dgp_2026` · **No modifica V1 ni FUTUROS**.
**Guion actualizado de los actos Rector, Encuesta y A/B (trampa predictiva con Random Forest, contraste con el A/B y cuaderno con huecos):** ver [V2_DEAN_TRAMPA_PREDICTIVA_Y_CUADERNO.md](V2_DEAN_TRAMPA_PREDICTIVA_Y_CUADERNO.md).
**PR de implementación:** #51. Estas instrucciones son un checklist de operación y aceptación: los controles e interacciones no sustituyen la certificación real de 120 minutos y 30 dispositivos.

## 1. Qué significa «aprender jugando»
- Una historia única: la universidad quiere mejorar el rendimiento académico. La intervención causal del DGP es imponer **0 frente a 4 horas semanales de bienestar**, no un plan de tutoría de definición ambigua.
- Cada acto: **intuitivo (0 puntos) → docente revela evidencia → revisión → debrief y puntos de aprendizaje**. No introducir MAE/R², DAG, DML o CATE sin contexto.
- Dos clasificaciones separadas: **promedio académico 0–50** y **maestría causal 0–100** (10 torneo, 25 Rector, 30 DAG, 35 A/B; prólogo es diagnóstico 0). El Kahoot final conserva su ranking individual 0–120 independiente. No mezclar puntuaciones.
- Nunca se premia velocidad de clic, cantidad de código ni completar exámenes falsos. Las simulaciones automáticas conservan sus marcas `auto_simulated` y **no** dan puntos de aprendizaje por ellas.
- Se usan escenas ilustradas ya existentes con analogías y contrastes gráficos. No etiquetar la fatiga sintética como un diagnóstico humano.
- El Wall muestra participación agregada, nunca el voto individual ni la solución antes del debrief. El teacher presenta los errores comunes tras revelar.

## 2. Operación docente exacta
1. Usar un **código NUEVO de torneo** con el PIN del facilitador. No usar `FUTUROS` para probar el nuevo generador; contiene notas históricas.
2. Abrir el panel `dean-teacher.html?game=<NUEVO_CODIGO>`; iniciar sesión y **Crear torneo V2**. Verificar `DGP canónico · 2026`.
3. Proyectar `dean-wall.html?game=<NUEVO_CODIGO>` en otra pestaña o dispositivo. Compartir `dean-play.html?game=<NUEVO_CODIGO>` con asistentes.
4. Dejar ingresar a las personas por nombre y sala. Cinco salas como máximo, seis por sala. **No hay asistencia mínima**. La app recomienda la sala menos ocupada; los participantes pueden unirse a otra con cupo.
5. En el PRÓLOGO seleccionar una primera respuesta sin puntaje, explicar los dos futuros, pulsar «Mostrar pista y abrir revisión», permitir cambiar el razonamiento, después «Cerrar revisión y revelar solución».
6. Solo tras el debrief, usar el botón grande del docente para el acto siguiente. El servidor **rechaza el salto de fase** en torneos canónicos sin debrief, no solo la UI.
7. Repetir **una decisión inicial, una evidencia, una revisión y un cierre** por acto. La fase de exámenes permite que cada persona complete hasta 15 parciales o use simulación opcional marcada, no son 15 lecciones de causalidad.
8. El acto Rector habilita los CSV únicamente después de liberar evidencia. Cada participante ejecuta Python real en el navegador: entrena un **Random Forest**, mira MAE/R², la **importancia por permutación** y **simula do(B)** (mismas filas con B=0 h y B=4 h, con rango bootstrap por estudiantes), y **anota su recomendación** (nota local; no puntúa). En salas con menos de 4 estudiantes el laboratorio usa una **referencia didáctica independiente claramente etiquetada**, no inventa registros del equipo. En el acto Encuesta se repite con estudio y sueño: sube el R² pero la simulación congela los mediadores.
9. El acto DAG presenta un ajuste seleccionable de variables, diferencia antecedentes y mediadores, añade una viñeta de collider y explica por qué una asociación no demuestra una flecha causal.
10. En el acto A/B el docente pulsa **Generar/revisar A/B**; ese experimento usa siempre 30 estudiantes SINTÉTICOS independientes de los asistentes. El laboratorio ejecuta Python para ATE, IC95, residualización DML con tres folds, diferencia entre ATE/CATE, cupos e incertidumbre, y la tarjeta **«Tu predicción frente al experimento»** contrasta la simulación do(B) del Random Forest de cada participante con el ATE y su IC95 entre estudiantes.
11. EconML: T-Learner, DR-Learner y Causal Forest solo si el JSON publicado consta como **verified** (entrenamiento real en CPython, holdout de 300 estudiantes y SHA256). No se afirma ejecución en Pyodide. El benchmark no es idéntico bit a bit a PostgreSQL.
12. Fase final: 8 preguntas tipo Kahoot, control del docente para abrir, cerrar, revelar y continuar. Respuestas únicas por alumno, nunca se revela la clave antes del servidor y hay podio 0–120.
13. Dejar dos minutos de transferencia: caso de capacitación laboral seleccionado, intervención no aleatoria y recomendación de cómo evaluar efecto. Terminar con **Identifica → estima → valida → decide**.

## 3. Agenda 120 minutos

| Minutos | Acto | Explicación docente | Actividad del participante | Prueba de aprendizaje |
|---|---|---|---|---|
| 00–10 | Dos futuros | Contrafactual, T/Y | Una apuesta inicial y su revisión | Diferencia predicción/efecto |
| 10–30 | Copa | Fatiga sintética, autoselección | 15 exámenes por persona; estrategia individual y reflexión | No universalizar al equipo ganador |
| 30–55 | Rector | Predicción MAE/R² vs causalidad | Python RandomForest, importancia por permutación, simulación do(B) y recomendación anotada | Ni el R² (sea cual sea) ni una simulación predictiva identifican `do(B)` |
| 55–80 | DAG detective | Pretratamiento, mediador, collider, efecto total | Ajuste seleccionable y decisión revisada | Evitar ajuste indiscriminado |
| 80–105 | Dos futuros | A/B, ATE, IC, DML, CATE y política | Laboratorio Python, contraste de su simulación con el A/B, incertidumbre y cupos | Priorizar beneficio incremental con límites |
| 105–120 | Batalla final | Corregir conceptos y transferir | Ocho respuestas cerradas y podio | Aplicar conceptos en caso diferente |

Nota: la única fuente de verdad de las notas es Supabase y el DGP canónico ZIP. El benchmark EconML se genera separadamente y se rotula. El aprendizaje es verificable con decisiones persistidas; las evidencias de ejecución Python son locales y no se puntúan sin verificación servidor.

## 4. Asistencia flexible y denominadores
- **1, 14, 18 o 30 personas; sin mínimo por equipo ni torneo**, cinco salas máximo seis. Ejemplos sugeridos: 14 → 3–3–3–3–2; 18 → 4–4–4–3–3; 30 → 6–6–6–6–6. Las personas pueden quedar desigualmente repartidas.
- Progreso académico de sala: `exámenes completados / (15 × inscritos reales)`, no `/90` fijo.
- Competencia académica: `suma de notas obtenidas / (15 × inscritos reales)` (exámenes faltantes cuentan cero provisionalmente).
- Maestría causal: `suma puntos por revisiones correctas/inscritos reales`, sin favorecer equipos grandes y con indicador de tamaño.
- Salas vacías aparecen disponibles, no compiten. El primer voto no suma puntos.
- Kahoot: `recibidas/inscritos reales`. A/B: cohorte constante de 30 estudiantes *sintéticos*, independiente de inscritos, con aleatorización a nivel alumno; no inventar alumnos para el ranking real.

## 5. Diseño seguro y prevención de fuga de respuesta
- `cw_dean_learning_stages` y `cw_dean_learning_choices` exclusivos de V2; RLS y permisos solo `service_role`.
- `cw_dean_learning_key` guarda respuestas en SQL **nunca enviadas al frontend antes de debrief**.
- `cw_dean_learning_submit` obliga opción A/B/C, fase vigente, identidad hash, una respuesta `(player_id, phase,kind)` y revisión posterior a intuición.
- `cw_dean_learning_teacher` comprueba token docente para liberar pista, revelar respuesta y pausar/reanudar.
- `cw_dean_learning_next` impide saltar explicación; versión legacy mantiene su secuencia original.
- `cw_dean_learning_export` y `cw_dean_learning_ab_observed` impiden descargar evidencia prematuramente.
- `cw_dean_learning_state` publica 5 salas agregadas, conteos de participación y respuestas correctas solo tras debrief, nunca identidad ni tokens ni fatiga oculta.
- Supabase SQL / Edge continúa versionado, no se modifica `FUTUROS` ni V1.

## 6. Plan de QA y criterios de aprobación

| Área | Prueba concreta | Estado del protocolo |
|---|---|---|
| Aislamiento | Leer `cw_dean_learning_state('FUTUROS')` devuelve no disponible sin escrituras | Comprobado en Supabase |
| SQL 1/14/18/30 | Inserción, voto idempotente, revisión, conteos por sala, `BEGIN/ROLLBACK` | Comprobado en Supabase |
| Protección de evidencia | CSV Rector rechaza blind vote y permite en evidence | Comprobado en Supabase |
| Viewports | 14/18/30 × tres roles × 1366×768, 1920×1080, 390×844 | Script Playwright / Actions |
| Puntuación | Primer voto 0, revisiones 10+25+30+35, denominador real | Contratos SQL y tests |
| Pyodide | Carga efectiva NumPy/pandas/sklearn, predicción, A/B/DML, tiempos en equipos reales | Pendiente ensayo dispositivos |
| EconML | Entrenamiento y holdout CPython, procedencia, error vs verdad del simulador | Workflow independiente |
| 30 usuarios | 30 entradas HTTP concurrentes, diez reingresos, 240 votos y polling Wall | **No certificado** |
| Fallos | Python lento, Supabase fuera, pérdida de red o proyector; no otorgar puntos falsos | Guion autónomo + ensayo pendiente |
| Capacitación | Piloto de 120 min con personas reales, evidencia de aprendizaje y ritmo | **No certificado** |

## 7. Plan de contingencia
- **Python falla:** la respuesta de estudiante puede continuar; docente interpreta la demostración, no registra `python_result_verified` ni asigna puntajes inventados.
- **Supabase falla:** descargar previamente `/dos-futuros/dean-emergency.md`, proyectar decisiones de cada uno de los seis bloques y usar votación manual (sin fingir que Wall está vivo).
- **Internet del participante falla:** recuperar token/identidad al reconectar; no aceptar respuestas tardías de Kahoot como si llegaran a tiempo.
- **Menos de 30 inscritos:** no detener ningún acto; salas vacías no aparecen en podio.
- **EconML no se entrena:** mostrar pendiente, NO números externos disfrazados. El A/B y DML pedagógico no dependen del benchmark.

## 8. Qué NO está afirmado como certificado
Las pruebas geométricas de Chromium utilizan respuestas simuladas del backend; **no equivalen** a 30 teléfonos conectados al mismo tiempo. Las transacciones SQL verifican consistencia pero **no acreditan carga HTTP concurrente**. La demostración DML de Pyodide no equivale a EconML completo ni resuelve confusión latente. La puntuación causal evalúa revisión correcta, no demuestra aprendizaje a largo plazo. El ensayo docente y la medición de transferencia requieren participantes humanos.

## 9. Entregables técnicos
- `src/v2/DeanLearningArc.jsx`, `dean-learning.css` — cinco actos y maestros de revelación;
- `src/v2/DeanSciencePython.jsx`, `dean-science.css` — Python real con datos y etiquetas de procedencia;
- `src/v2/DeanEconMLPanel.jsx`, `scripts/precompute_econml_dean.py`, `src/v2/econml-dean-verified.json` — benchmark real cuando verificado;
- migraciones `202610150001`…`004` — aprendizaje/puntuación/revelación/gate/feedback;
- `supabase/functions/v2-dean-cup/index.ts` — acciones autoritativas;
- `scripts/dean_visual_smoke.mjs`, `tests/v2_dean_learning_arc.test.mjs` — QA;
- `public/dean-emergency.md` — respaldo imprimible y manual;
- ruta inicial `dean-cup.jsx` y tres roles, V1 intacta.


## Final competitiva automática (implementación V4)
- **Un solo clic:** «Iniciar batalla» en el facilitador. Inicia de inmediato la pregunta 1.
- **30 segundos exactos por pregunta**, medidos en el servidor Supabase; el cliente muestra cuenta regresiva ajustada a `server_now`.
- Al vencer el plazo, la API `quiz_state` llama al reloj `cw_dean_quiz_tick_v4`; pasa de `open` a `reveal`, bloquea votos tardíos sin clic del docente y revela la clave junto con sus 4 barras A/B/C/D. Todos reciben la misma fase.
- La explicación de la respuesta correcta se muestra **9 segundos** antes de abrir automáticamente la pregunta siguiente. Después de la 8.ª aparece el podio.
- Los botones del docente «Cerrar ahora» y «Pasar a la siguiente ahora» son controles de contingencia; no son obligatorios.
- Los colores de las respuestas reflejan **estados**, no evaluación anticipada: neutro = opción disponible; **amarillo = elegida**; en reveal **verde = correcta** y **rojo = elegida incorrecta**. Antes del reveal jamás se muestra la solución.
- **Facilitador / Wall:** pantalla completa de ceremonia, animación de podio y confeti, campeón(es) felicitados y clasificación de **todos** los inscritos, de 1 a 30. **Jugador:** su puesto y puntaje individual, podio de mejores jugadores y clasificación general desplegable. Empates comparten puesto competitivo.
- En escritorio a 1366×768 y 1920×1080, los 30 nombres deben caber en la vista final. En teléfonos el listado interno puede desplazarse, pero nunca todo el documento.
- **Nada de datos artificiales en el ranking:** puestos y puntos provienen de `cw_dean_quiz_answers` y `cw_v2_quiz_questions`, con `rank()`; preguntas no respondidas valen cero, el total máximo es 120.
- `FUTUROS` y `legacy_v1` preservan la lógica manual anterior; solo `zip_dgp_2026` utiliza el reloj automático.
- Efectos respetan `prefers-reduced-motion` y no bloquean el teclado ni el botón docente.
- **Límite operacional:** `cw_dean_quiz_tick_v4` se ejecuta con el polling del jugador, Wall o facilitador; si todos están desconectados, la transición se resuelve al siguiente acceso, sin notificaciones en segundo plano.


## Actualización de benchmark EconML verificada (2026-10-15)
El workflow `dean-cup-canonical-econml-training` entrenó efectivamente TLearner, DRLearner y CausalForestDML con EconML 0.16.0 y datos del generador estructural sintético `zip_dgp_2026`. Hay 1200 estudiantes sintéticos, 900 para entrenamiento y 300 para holdout; tratamiento asignado a nivel estudiante, B=0 vs B=4. El archivo `src/v2/econml-dean-verified.json` conserva métricas y SHA256 de datos. Estos resultados NO son ejecuciones en el navegador, NO son notas de participantes y NO son idénticos bit a bit al ruido Box-Muller de SQL. Las comparaciones aparecen en la final causal solo si el archivo indica `verified`.


## Crear una COPA NUEVA desde un torneo terminado (no borrar la anterior)

1. Abre `dean-teacher.html?game=FUTUROS` o el código de tu Copa actual; entra con su PIN docente si la sesión venció.
2. En el **encabezado**, pulsa **«＋ Nueva Copa»**. Se puede hacer desde `finished`, `final` o cualquier fase; NO hay que pulsar «Reiniciar».
3. Confirma **«Sí, crear Copa nueva»**. El backend verifica el token docente y el código de origen, crea un código aleatorio `COPA-XXXXXXXXXXXX`, una sesión docente nueva y un torneo `zip_dgp_2026` en lobby.
4. El panel del docente cambia a la Copa nueva automáticamente y actualiza el parámetro `?game=`. Su código aparece arriba y los enlaces **Estudiantes** y **Wall** llevan a esa Copa, no a la vieja.
5. Comparte el nuevo enlace de jugador y proyecta el nuevo Wall. Pueden entrar de 1 a 30 asistentes en cinco salas de máximo seis. Una persona nunca se traslada automáticamente desde el torneo antiguo; debe registrarse de nuevo.
6. La Copa anterior, incluidos `FUTUROS`, el podio y sus resultados, NO se modifican. El nuevo torneo reutiliza **el mismo PIN docente**, sin descargarlo ni comunicarlo a alumnos.
7. **«↻ Reiniciar»** es otra función: solo existe para la Copa canónica nueva, exige código exacto y casilla de consentimiento, y SÍ elimina sus estudiantes y puntuaciones. Ambos controles viven dentro del encabezado, sin botón fijo al borde de pantalla.
8. Compatibilidad importante: `cw_games.max_humans` continúa con límite heredado de 28 para V1; **la Copa canónica permite 30 jugadores** usando la tabla independiente `cw_dean_players`. No cambiar las restricciones de V1.

La prueba transaccional `BEGIN/ROLLBACK` confirmó la creación desde una Copa histórica finalizada y las 30 inscripciones (6 en cada una de cinco salas), sin dejar partidas de prueba persistidas.
