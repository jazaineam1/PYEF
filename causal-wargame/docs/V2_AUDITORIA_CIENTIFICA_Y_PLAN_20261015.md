# Auditoría científica y plan de mejoras · DOS FUTUROS CAMPUS V2
**15 de octubre de 2026 · Fuente de evaluación:** `INFORME.md` aportado por el usuario. Se contrastaron las afirmaciones con SQL, React, Python y el benchmark verificable en `main`. Las cifras Monte Carlo del informe son resultados de SU análisis; solo las pruebas descritas al final se repiten aquí.

## Decisiones científicas: qué sí cambiar y qué no

| Prioridad | Hallazgo | Decisión | Justificación |
|---|---|---|---|
| P0 | El DAG omite arquetipo aunque causa PGA, bienestar, hábitos basales | CORREGIDO: representar A aguas arriba en grafo, encuesta y rúbrica | Ajustar solo PGA puede dejar confusión por tipo; positividad entre perfiles es escasa |
| P0 | La política premiaba asignar bienestar a grupo con CATE estimado negativo | CORREGIDO: no bonificar la asignación perjudicial y explicitar alternativa de apoyo no evaluada | Equidad es una restricción ética, no una licencia para atribuir beneficios inexistentes |
| P0 | Todas las Copas reproducían el mismo A/B de 17/13 y 7/0 | CORREGIDO: semilla por `game_id`, 4 tratados por arquetipo, 30 alumnos sintéticos | Evita celdas vacías y permite distintas muestras; no fabrica significación |
| P0 | La narrativa prometía R² alto o ATE estimado positivo | CORREGIDO: R² de prueba puede ser negativo, IC amplio y ATE estimado puede cambiar de signo | Correlación, predicción y causalidad no dependen de un número atractivo |
| P0 | Nuevo puntaje cambia la historia de Copas ya jugadas | PREVENIDO: versión `20261015_v2` estampada solo por el servidor en intentos NUEVOS | Intentos antiguos siguen su rúbrica previa; las notas del ZIP permanecen intactas |
| P1 | El ranking combina arquetipo/PGA con decisiones | PROYECTADO: índice complementario de ganancia sobre baseline y distribución equilibrada por sala | Alterar un ranking existente sin calibración produciría ganadores retroactivos distintos |
| P1 | Deslizadores independientes favorecen llevar todo al máximo | POSPUESTO hasta DGP `zip_dgp_2027` o mecánica de presupuesto explícitamente versionada | Un límite de horas cambia la dinámica de decisiones. Un límite 24 h puede no crear ningún intercambio real: los máximos suman <24 h |
| P1 | 30 alumnos del A/B tienen poca potencia para un ATE pequeño | SE CONSERVA N=30 como enseñanza de incertidumbre y CATE; estratificación mejora cobertura, no promete potencia | Aumentar a 120 solo para conseguir p pequeño sesgaría la lección |
| P1 | CSV de auto-completado tiene poca variación | PROYECTADO: rotular o filtrar en análisis exploratorios; requerirá cambios compatibles en datos y notebooks | Nunca contaminar el coeficiente causal sin alertar que son estrategias automáticas |
| P1 | Solapamiento casi inexistente entre bienestar de arquetipos | ADVERTENCIA EXPLÍCITA de positividad en el juego y guía | Recalibrar rangos alteraría los datos canónicos y el estimando |
| P2 | Textos de resultados del ZIP prometían R² 0,45, ATE +5 y que bienestar salva a En riesgo | RECTIFICAR los documentos de especificación, no alterar la ecuación | Son expectativas de diseño, no resultados garantizados |
| P2 | `ab_stats.py` del ZIP trata exámenes como observaciones independientes | NO TOCAR el ZIP ajeno sin fuente versionada; la V2 actual ya calcula SE por estudiante | Debe repararse en el código fuente original antes de reutilizar sus p-valores |
| P2 | Ruido compartido de U e Y / penalización de fatiga | DOCUMENTAR; no reinterpretar como errores a corregir retroactivamente | Son ecuaciones del generador original: cambiarlas exige nueva versión científica |

## Cómo quedó la versión científica del juego

1. **Rector**: el R² y el MAE se calculan realmente. R² bajo o negativo también se explica. Los coeficientes de bienestar son descriptivos, no efectos de `do(B)`.
2. **DAG Detective**: el arquetipo es raíz común de PGA, bienestar habitual, estudio y sueño basales. Los estudiantes eligen **arquetipo + PGA** y no bloquean mediadores posteriores. La viñeta de collider continúa separada del DGP. Se advierte que ajustar no arregla falta de solapamiento.
3. **A/B**: la aleatorización es por alumno sintético, 30 alumnos × 15 parciales, cuatro tratados por cada tipo; el control incluye 4/4/3/3 por perfil. Semilla reproducible por Copa. Una vez generado, el A/B es **inmutable e idempotente**, sin cambiar A/B anteriores. El IC es por alumno, no por cada fila.
4. **DML**: el orden de folds, modelos, residuos y efecto se mantiene; NO elimina confusión no observada. Resultados de EconML son benchmark separado con origen identificado.
5. **Política de seis cupos**: el benchmark de DR-Learner da CATE negativo a En riesgo. Los usuarios pueden explorar asignaciones pero **no obtienen bono de equidad por imponer B=4** a alguien que se estima que podría perjudicar. Se puede plantear investigar OTRO apoyo, sin adjudicarle un beneficio desconocido. El benchmark **carece de IC de CATE por perfil**.
6. **Puntos**: maestría causal 0–100 (57 ABC y 43 actividades) y Kahoot 0–120, rendimiento 0–50. La rúbrica v2 se asigna por el servidor y solo puntúa tras debrief. Las evidencias registradas antes del cambio quedan con su cálculo original.
7. **V1/FUTUROS**: no se editan ni se recalculan. No se cambian los parámetros de `settings.py`, `scorer.py`, fatiga ni los A/B ya registrados.

## Limitaciones y siguiente iteración

Antes de prometer un juego «justo» en cuanto a notas y estrategias, falta diseñar un **DGP v4 versionado** (o un juego de recursos separado) que tenga intercambio de tiempo real y viabilidad académica para todos los arquetipos. Deberá probarse con optimización de estrategias, Monte Carlo por perfil, sensibilidad del ATE/CATE, equilibrio de salas, restricciones de presupuesto y aceptación por docentes; sin modificar el DGP 2026.

Una prueba de 30 estudiantes sintéticos **no es** una prueba de 30 navegadores concurrentes. La certificación de producción todavía requiere 30 dispositivos/sesiones reales, reconexión, exposición pedagógica completa de 120 minutos y accesibilidad móvil.

## Matriz de aceptación

- **SQL seguridad:** `cw_dean_mission_score` anterior devuelve la rúbrica anterior para respuestas sin sello; nuevos DAG de solo PGA no suman 12 puntos; DAG de PGA+arquetipo válido suma 12, collider correcto suma 8.
- **SQL política:** asignar un cupo a En riesgo solo puntúa reflexión sobre incertidumbre (hasta 2), nunca 6 de decisión; escoger 6 Sobreexigidos + cautela es 8/8.
- **SQL A/B:** transacciones `BEGIN/ROLLBACK` con dos Copas distintas, 30 alumnos/copa y 450 parciales, cada arquetipo con ≥3 por brazo y **4 tratados**, semilla reproducible en misma Copa e independiente entre Copas.
- **JS / React:** unidad sobre DAG, texto de R² e incertidumbre, alineación de política; navegador a 1366 × 768 y 390 × 844 sin scroll de documento, navegación y decisiones válidas, sin JS runtime errors.
- **CI / Pages:** compilación segura, pruebas unitarias y smoke visual en GitHub Actions; fusionar SOLO cuando estén aprobadas y confirmar Pages `success`.
- **Persistencia:** ninguna Copa real se borra, y las pruebas de SQL operan con ROLLBACK.

**Alcance de este PR:** correcciones P0 y documentación/avisos P1. Los cambios de diseño que requieren otro DGP quedan explícitamente **pendientes**, no se marcan como superados.
