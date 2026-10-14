# Copa del Decano V2 — asistencia flexible

**30 es la capacidad máxima, no una asistencia obligatoria.** Se admiten de 0 a 30 inscripciones (0 en lobby y para demostración docente, y 1–30 participantes para juego). Cada sala de las cinco admite 0–6 integrantes y no hay mínimo por equipo ni por torneo.

Progreso por sala = exámenes rendidos ÷ (15 × estudiantes inscritos). Una sala vacía no compite y no aparece como completada. El ranking competitivo normalizado es suma de notas ÷ (15 × inscritos); evita que un equipo con pocos exámenes tenga una media artificialmente alta, sin penalizar vacantes. La media descriptiva de notas rendidas se sigue mostrando. El último examen de cada persona conserva su estado; ninguna ausencia bloquea a los presentes.

El Kahoot indica **respuestas recibidas / inscritos reales**, nunca /30 fijo, y el docente controla las ocho rondas aunque participe solo una persona. CSV del Rector, encuesta y descarga docente devuelven únicamente exámenes existentes, sin inventar personas ausentes ni rellenar hasta 90. La capacitación de 120 min continúa independientemente de la asistencia.

Solo se reemplazan funciones derivadas `cw_dean_state` y `cw_dean_quiz_state` mediante `CREATE OR REPLACE`; no se modifican registros previos, V1 ni la partida `FUTUROS`.

Pruebas requeridas: 0, 1, 5, 12, 17, 29 y 30 personas, con salas vacías y desiguales, avance de fase, conteos y seguridad. 
