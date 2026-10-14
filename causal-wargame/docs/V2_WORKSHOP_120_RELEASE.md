# DOS FUTUROS CAMPUS V2 · Taller integrado de 120 minutos

## Modo operativo

El usuario entra en `v2-play.html`, el capacitador en `v2-facilitator.html` y el Wall en `v2-wall.html`. **No afecta V1.** La consola docente tiene «Iniciar taller»; el backend crea un registro `cw_v2_workshop` separado y la experiencia del estudiante cambia automáticamente al modo de **cinco escenas decisionales y un Kahoot final**. No requiere completar 17 bloques de Python ni los checkpoints de las seis misiones de profundización, que continúan accesibles cuando el taller no está activo.

El recorrido mantiene 00–10 bienvenida, 10–30 juego, 30–55 trampa ML, 55–80 teoría y DAG, 80–105 solución causal y 105–120 batalla final. Son 36 minutos de guía docente y 84 de interacción incluyendo el Kahoot; una intervención corta por fase, no 30 micro-pasos.

Cada estudiante responde una decisión por escena. Supabase la guarda una sola vez; ni el Wall ni otros alumnos reciben su elección individual. Se muestran participación por equipo y conteos agregados. La revelación de la fase requiere que el facilitador active «Proyectar explicación». Las cifras son sintéticas e identificadas como tales. En fases 2, 3 y 4 el docente puede ejecutar Python real en su navegador como demostración; los alumnos pueden optar por ejecutar el mismo código, sin presión ni puntos por dispositivo. La misión 6 de profundidad incluye el benchmark EconML real ejecutado en CPython fuera de Pyodide.

Al llegar a la fase final, el docente pulsa «Iniciar batalla» y abre ocho preguntas con reloj servidor. Tras la fecha límite o cierre manual puede revelar y explicar sin más pantallas obligatorias. Una respuesta por alumno; el acierto suma 15 puntos por pregunta, máximo 120, separados de la campaña extensa. Wall muestra distribución solo tras el reveal, y el podio recoge resultados y puntos del Kahoot.

## Orden de despliegue seguro

1. Comprobar el CI del PR (unitarias, build seguro y humo de roles).
2. Aplicar migration `202610140003_v2_workshop_kahoot.sql` con Supabase. No reinicia ni modifica una partida existente.
3. Desplegar Edge Function `v2-quiz` con `deno.json` y módulos `_shared`.
4. Fusionar únicamente el PR de V2 y esperar CI + GitHub Pages. Nunca reiniciar `FUTUROS`.
5. Abrir estudiante, facilitador y Wall en navegador, comprobar encabezados móviles, decisiones, proyecto del docente, reloj y podio.

## QA / limitaciones

La prueba SQL previa en `BEGIN/ROLLBACK` recorrió 20 jugadores, 100 decisiones de cinco escenas, 160 respuestas de ocho preguntas, protección de claves correctas antes del reveal y podio de 120 puntos. Se verificó después que las tablas temporales no persistían. **Esto no acredita 20 teléfonos simultáneos en vivo:** hace falta ensayo humano o carga HTTP concurrente. Además, `cw_games.max_humans` tiene actualmente tope estructural de 28 personas; elevarlo a 30 afecta una tabla compartida con V1 y exige evaluación separada, no se alterará silenciosamente.

La clase puede recuperarse si un teléfono se desconecta: voto único en la base y servidor de estado son idempotentes. Python es opcional y el modo práctica local separado no produce puntos falsos. La revelación requiere acción explícita; si no funciona Edge, la experiencia larga previa continúa accesible. La puntuación del taller usa únicamente el Kahoot final; no simula seis rondas de XP para un recorrido que no se ejecutó.

## Certificación adicional: HTTP real con 20 participantes sintéticos

El 14-oct-2026, después de desplegar la migración y `v2-quiz`, se probó una partida QA independiente con **20 sesiones**, **100 decisiones de taller** y **160 respuestas a ocho preguntas**, mediante **324 solicitudes HTTP reales** a Supabase. Todas se aceptaron; el podio mostró 120 puntos y no se reveló la solución antes del cierre. La latencia media de las solicitudes de la prueba fue 531 ms, con máximo aislado 5.842 ms. **0 errores reportados.**

El juego `QA120TEST241014` se borró al terminar y las tablas `cw_v2_quiz_answers` y `cw_v2_workshop_choices` quedaron vacías. `FUTUROS` permaneció en `round` 1 sin ser modificado. Es una prueba de concurrencia de solicitudes, **no sustituye un ensayo de 20 teléfonos físicos y 120 minutos**. La conexión Pyodide individual sigue siendo opcional y debe probarse en el equipamiento real del aula.
