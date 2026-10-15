# DOS FUTUROS V2 · Enseñar causalidad dentro del videojuego (Octubre 2026)

**Solo torneos nuevos con `zip_dgp_2026`.** Sin reescribir el DGP, las notas de V1 ni la partida `FUTUROS`.

## Regla 1: de los datos a una decisión, no de una correlación a una política

El tratamiento del juego canónico es **B=0 vs B=4 horas semanales de bienestar**. Un aumento de horas observado (elegidas voluntariamente) no equivale a asignar esas horas mediante intervención. `r` de Pearson es adimensional; una pendiente de regresión se expresa en puntos/hora; MAE y R² miden predicción; ATE y CATE son otros estimandos.

**Tres fuentes distintas que NUNCA se mezclan como si fueran una sola:**

| Fuente | Contenido visible | Alcance |
|---|---|---|
| **LIVE · Mi sala** | CSV efectivamente descargado desde Supabase, dispersión B–Y, r y regresiones observacionales según columnas disponibles | 1–30 participantes reales; los alumnos del juego son avatares sintéticos, no 30 unidades del A/B |
| **ZIP original, cohorte piloto** | r=−0,468; pendientes cruda −3,258, ajustada previa −0,786, con mediadores −2,788 | **25 alumnos ficticios × 15 exámenes**, referencia externa identificada, no datos de la Copa |
| **A/B ZIP original** | 14 tratados/11 control, diferencia observada −6,460 pt, IC normal aprox. [−14,724; +1,804] | El oráculo de resultados potenciales (+1,799 pt) aparece **solo en el debrief** |
| **A/B LIVE del torneo canónico** | 30 alumnos sintéticos × 15 exámenes, T sorteado POR ALUMNO, GPA por brazo, ATE e IC entre alumnos | No se suman los 450 exámenes como 450 unidades independientes; las notas observadas proceden del generador SQL |
| **Benchmark EconML independiente** | DR-Learner estimado por perfil: Sobreexigido +11,775; Equilibrado −2,431; En riesgo −1,491; Pragmático −0,051 | Entrenado en CPython con 1.200 alumnos sintéticos y test reservado; **no** se ejecuta EconML en el navegador ni en la cohorte de 30 |

## Seis escenas para 120 minutos sin crear decenas de pasos

1. **0–10, «Los dos futuros»:** tratamiento, resultado y contrafactual. Voto inicial sin puntos → evidencia → voto revisado → descubrimiento. Nunca identificar beneficio individual solamente por nota predicha.
2. **10–30, «La Copa»:** quince parciales, PGA, complejidad, selección, decisión de estudio/sueño/bienestar y fatiga sintética oculta. Notas y ranking no estiman efectos de una política.
3. **30–55, «La trampa del Rector»:** el juego descarga automáticamente la evidencia del Rector al ser liberada, dibuja dispersión B/Y real si hay variación, permite comparar `r`, pendiente cruda, pendiente con PGA/Z y regresión con mediadores tras desbloquear encuesta. Primera actividad **verificable**: diagnosticar asociación vs causalidad. Tabla alternativa con cifras del ZIP rotulada. Pyodide ejecuta el predictor real si el alumno pulsa ejecutar.
4. **55–80, «DAG Detective»:** tarjetas para elegir ajustar H/PGA, Z/complejidad, estudio, sueño, fatiga; mapa de rutas; viñeta de collider independiente (B→tutorías←dificultad). Segunda actividad verificable: evitar mediadores posteriores y reconocer collider. **Z es pronóstico, no necesariamente confusor**; U es mediador latente, no confusor automáticamente. El DAG son SUPUESTOS del mecanismo del ZIP.
5. **80–105, «Doctor Strange»:** generar A/B con 30 alumnos sintéticos, comparar la estimación del experimento y su incertidumbre por alumno. En el juego se ordenan folds → modelos T/X,Y/X → residuos → efecto, y se revisan supuestos. Misión de presupuesto: seis cupos en un escenario separado de **30 plazas sintéticas hipotéticas por perfil** y CATE estimado del benchmark (8/8/7/7, sin personas reales): contraste entre eficiencia y equidad. La decisión de seis cupos queda en Supabase; no se afirma beneficio individual garantizado. El laboratorio de Pyodide ejecuta residualización; el panel EconML muestra benchmark precomputado y verificado.
6. **105–120, «Batalla y transferencia»:** ocho preguntas de 30 s con resultados y explicaciones automáticas de 9 s; la octava en Copas nuevas plantea **OTRA intervención** (capacitación laboral asignada por motivación). Esto está explícitamente rotulado como **MISIÓN DE TRANSFERENCIA**, no como cambio silencioso del bienestar B=0/B=4. Podio y puestos de todos los asistentes.

## Puntuación científica real, sin sumar escalas distintas

Se conservan notas académicas 0–50 y Kahoot 0–120, independientes.

**Maestría causal 0–100 = 57 por decisiones revisadas + 43 por práctica científica verificada.**

| Acto | ABC revisado | Misión práctica server-side | Total máximo |
|---|---:|---:|---:|
| Prólogo | 0 | 0 | 0 |
| Copa | 10 | 0 | 10 |
| Rector | 17 | 8 (asociación ≠ intervención) | 25 |
| DAG | 10 | 12 (ajuste válido) + 8 (collider) | 30 |
| A/B y política | 20 | 7 (DML y límite) + 8 (cupo y cautela) | 35 |
| **Total** | **57** | **43** | **100** |

**Seguridad y secuencia:** las opciones correctas de las misiones permanecen en SQL, no en el archivo React. Las misiones solo admiten un envío por jugador, fase exacta y estado `evidence`; si llegan de nuevo devuelven recibo idempotente, no suman más puntos. Las puntuaciones se agregan **solo después de `debrief`**. El docente ve números reales de evidencias, sin mostrar el voto individual en Wall. El reconocimiento por practicar mide una respuesta estructurada y validada por el servidor; **no** garantiza competencia profesional ni el éxito al ejecutar Python, que sigue siendo actividad local y opcional.

**No cerrar con cero evidencias:** el docente no puede liberar pista si nadie registró intuición, ni declarar debrief con cero revisiones. Si la clase debe avanzar, debe pulsar **«Modo demostración · cerrar sin puntos»**; la pantalla dice que fue demostración, no aprendizaje verificado. Se permite avanzar con participantes ausentes sin inventar sus votos.

## Pruebas y límites

- Migración `202610150010`: intentos con RLS, validación de fase, selección, límite de seis cupos y nota calculada solo en SQL.
- Migración `202610150011`: profesor no puede falsificar aprendizaje con 0 votos, opción demostración.
- Migración `202610150012`: fusión del ABC revisado (57) con evidencias (43) para mantener 0–100 sin doble conteo.
- Pruebas SQL ejecutadas con `BEGIN/ROLLBACK`: 1/14/18/30 decisiones DAG idempotentes, nota solo tras debrief; una trayectoria correcta suma 100/100.
- Pruebas de JavaScript, compilación segura y navegador en PR. 30 dispositivos conectados simultáneamente y el ensayo pedagógico real de 120 minutos son tareas separadas, no se certifican solo con fixtures.

### Riesgos aún sujetos a mejora científica

La política de cupos utiliza valores **promedio de benchmark por perfil**, no predicciones individualizadas del A/B corriente: debe tratarse como escenario pedagógico de decisión, no estimación de ganancias reales. El IC normal para pocos estudiantes es aproximado; las cifras exactas de la cohorte ZIP son de una semilla específica, no resultados universalmente reproducibles para otra Copa. Un DAG supuesto no prueba identificación automáticamente, y DML con 30 personas sintéticas no elimina confusión no observada.
