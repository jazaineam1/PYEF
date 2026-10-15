# Game-first V2 · Sacrificios por tiempo y batalla del Rector (2026-10-15)

## Experiencia del jugador

**La Copa tiene que jugarse**. El acto del Rector presenta un personaje que quiere ordenar el recorte de bienestar y tres decisiones de política breves. La consecuencia causal se revela al cerrar el acto. Las definiciones, CSV, Pyodide y DAG no son páginas obligatorias de lectura: están en un desplegable separado «Misión extra» y siguen siendo evaluables por Supabase.

**Exámenes:** los tres deslizadores siguen representando sus respectivas unidades originales:
- Estudio: horas de preparación de ese parcial.
- Sueño: horas la noche anterior.
- Bienestar: horas durante la semana.

Es científicamente incorrecto sumarlos como si todos fueran horas diarias. Por eso cada elección sobre su rango disponible gasta **fichas de agenda V1**, una divisa virtual explícita y NO un nuevo parámetro del DGP. Cada actividad consume cuatro fichas si se mueve del mínimo al máximo y el estudiante dispone de **seis fichas**. Con tres máximos gastaría 12 y el servidor lo rechazaría. Aumentar estudio automáticamente puede reducir horas de sueño y después bienestar hasta caber en el límite; al aumentar descanso se sacrifica estudio primero, al aumentar bienestar se sacrifica estudio primero. El jugador ve el sacrificio inmediatamente, con animación y fichas iluminadas. Puede intentar otras combinaciones y evaluar efectos sobre su nota.

**Ejemplo equilibrado:** rangos estudio 4–8 h, sueño 6,5–8,5 h, bienestar 1,5–3,5 h. Valores predeterminados: 6 h, 7,5 h, 2,5 h = seis fichas. Subir estudio a 6,5 h obliga a bajar sueño a 7 h (o ajustar después bienestar). No se elige todo al máximo.

**Cuidado con la causalidad:** esta mecánica cambia el espacio de acciones permitido a los jugadores (recurso escaso); no cambia los coeficientes del mecanismo de notas de `cw_dean_score_v3` ni permite inferir directamente ATE de un ranking. La intervención aleatorizada B=0/B=4 del A/B continúa siendo un experimento sintético APARTE: no está sujeta al presupuesto de agenda de las decisiones voluntarias del juego.

## Versiones y conservación

La tabla `cw_dean_agenda_rules` da el protocolo solo a las Copas canónicas **nuevas**, mediante trigger. Las Copas históricas con exámenes o V1 no adquieren restricciones retroactivas. El juego actual `COPA-7BD494B411E4` estaba en `rector` con **45 exámenes** al verificar: NO fue convertido silenciosamente. El docente puede crear **Nueva Copa** sin borrar los resultados anteriores para ensayar el sacrificio de tiempo.

El servidor rechaza cualquier `cw_dean_exam_v3` de torneo con protocolo activo si sobrepasa seis fichas. La auto-simulación predeterminada utiliza horarios dentro de presupuesto para cada perfil. La UI recibe `agenda_enabled` del servidor y solo presenta la regla donde está realmente activa.

## Diseño de la escena del Rector

- **Antes de decidir:** personaje rector, una predicción y el efecto real bloqueado. Un problema corto: «El Rector quiere recortar bienestar por un gráfico. ¿Qué orden firmas?»
- **Opciones:** recortar; comprar más árboles de RF; exigir un A/B antes de decidir.
- **Después de decidir:** recibo breve. La siguiente pista/revisión se controla desde el panel docente como antes.
- **Tras revelación:** animación corta que identifica la trampa predictiva. El razonamiento completo está disponible opcionalmente; se mantiene la rúbrica original ABC, las misiones validadas, el Wall y el historial.
- **Una sola caja extra:** «Misión extra (+8 / +20 / +15 XP)» con reto científico verificable y un segundo desplegable opcional para datos, DAG, Python. No dejar simultáneamente abiertas cuatro clases de teoría.

## Criterios de verificación

- SQL transaccional con ROLLBACK: rechazar 3 máximos, aceptar opciones factibles, un examen repetido idempotente, 15 exámenes automáticos válidos, V1 inalterada.
- Unit tests: todas las configuraciones predeterminadas caben; subir estudio, sueño o bienestar sacrifica otra opción para los 4 arquetipos.
- Playwright: escritorio 1366×768 y móvil 390×844, deslizadores accesibles, validación de tradeoff en la carga enviada, HUD de seis fichas, boss del Rector, misión extra accesible, controles docentes y Wall sin scroll global.
- CI build:secure y pruebas de regresión de 14,18,30 asistentes. Las pruebas de carga real con 30 dispositivos simultáneos son una certificación separada y NO se implican por pasar fixtures.
