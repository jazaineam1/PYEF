# Game Design · CAUSAL QUEST

## Resultado de aprendizaje

Al salir, el participante debe poder preguntar espontáneamente:

1. ¿Qué estamos cambiando?
2. ¿Qué resultado queremos cambiar?
3. ¿Qué habría pasado sin intervenir?
4. ¿Por qué la comparación es defendible y dónde existe soporte?
5. ¿Qué tan precisa es la evidencia?
6. ¿Qué observación o stress test me haría perder confianza?
7. ¿Funciona igual para todos y dónde conviene actuar bajo costo, capacidad y riesgo?

La terminología formal se introduce **después** de vivir cada concepto. La meta no es aprender software: es saber **qué pregunta responde cada instrumento, qué supuesto necesita y qué permite concluir**.

## Cinco equipos y cuatro especialidades núcleo

La configuración objetivo es:

`5 equipos × 4 especialistas = 20 participantes`

Equipos: **Fisher, Neyman, Rubin, Pearl y Robins**.

Las cuatro especialidades son:

- 🦁 **Líder de Decisión y Política** — fija población, intervención, comparador, resultado, horizonte, estimando y restricción; administra recursos y en R4 convierte la evidencia en una política factible bajo costo, capacidad y riesgo.
- 🦉 **Líder de Modelos** — separa predicción de efecto incremental, revisa overlap y explora heterogeneidad con Uplift/CATE.
- 🐈‍⬛ **Analista Causal** — usa el DAG para razonar sobre confusión, mediadores, colliders e identificación.
- 🐢 **Líder de Experimentos** — diseña la comparación, asignación, outcome, horizonte, incertidumbre y precisión útil.

**Política y Riesgo ya no es un quinto rol.** Esa responsabilidad está fusionada con Decisión para evitar que una experiencia de dos horas se fragmente en cinco minijuegos. El código conserva el identificador histórico `risk` únicamente para poder leer sesiones antiguas sin romperlas; no se asigna a participantes nuevos.

Los cuatro comienzan con el mismo poder base: **Pregunta Crítica**.

### Dependencia entre herramientas

No son cuatro minijuegos independientes. El flujo esperado es:

`🦁 define → 🐈‍⬛ identifica → 🦉 estima → 🐢 contrasta → 🦁 diseña política e integra`

Cada instrumento produce:

1. **Pregunta** — qué intenta responder.
2. **Evidencia** — qué produjo la herramienta.
3. **Supuesto** — qué debe ser cierto para interpretarla.
4. **Decisión** — qué permite concluir y qué no.

La Mesa de Evidencia muestra cobertura **0–4**. `4/4` significa cobertura, no verdad: el motor de coherencia puede bloquear el cierre aunque estén las cuatro piezas.

## Asistencia variable

La asignación humana es determinista por olas de rol, no por llegada a un equipo completo:

1. llegadas 1–5 → 🦁, una por equipo;
2. 6–10 → 🦉;
3. 11–15 → 🐈‍⬛;
4. 16–20 → 🐢.

Esto balancea automáticamente el tamaño de grupos:

| Asistentes | Tamaños de los cinco equipos | Operación |
|---:|---|---|
| 20 | 4–4–4–4–4 | Ideal, 4 roles dedicados |
| 19 | 4–4–4–4–3 | 1 equipo usa doble sombrero |
| 18 | 4–4–4–3–3 | 2 equipos usan doble sombrero |
| **17** | **4–4–3–3–3** | **3 equipos usan doble sombrero** |
| 16 | 4–3–3–3–3 | 4 equipos usan doble sombrero |
| 15 | 3–3–3–3–3 | todos usan doble sombrero |

En un equipo de tres, 🦉 Modelos cubre temporalmente 🐢 Experimentos mediante un **módulo separado** que produce evidencia experimental explícita. No se inventa un participante ni se marca evidencia automáticamente.

Por debajo de 15 personas, al menos un equipo tendría menos de tres integrantes. La app lo advierte al facilitador y **no inventa evidencia**. Para una clase real se recomienda reconfigurar la dinámica antes de iniciar; los bots son sólo para ensayo técnico.

## Seguridad de ingreso y reingreso

La identidad del participante y el token de sesión son conceptos distintos:

- el navegador conserva una clave aleatoria de participante;
- cerrar la pestaña, cerrar el navegador o perder/renovar el token no cambia equipo ni rol;
- volver a entrar desde la misma identidad recupera exactamente el mismo `player_id`, `team_id` y `role_code`;
- introducir el mismo nombre desde otra identidad se rechaza para evitar duplicados accidentales;
- se recomienda usar nombre y apellido si dos personas tienen nombres iguales;
- una vez iniciada la partida, la composición se congela: sólo pueden reingresar identidades ya registradas;
- máximo: 20 humanos;
- los bots de ensayo nunca reservan un cupo humano y se eliminan del slot si llega una persona real antes de iniciar.

El logout borra el token de sesión, **no** la clave local de identidad; por eso un participante puede volver sin crear un segundo asiento.

## Información asimétrica cooperativa

Todos buscan la misma decisión. No hay traidor ni objetivo secreto. Cada especialidad tiene información o controles diferentes y ninguna pieza es suficiente por sí sola.

La mecánica es:

`enseño → exploras → produces evidencia → compartes → integran → deciden → reveal/debrief`

## Rondas

### R1 · ORÁCULO

Elige 10 de 24 clientes usando score predictivo; después se revela impacto incremental.

Aprendizaje: predicción ≠ efecto causal; contrafactual; `Y(1)-Y(0)`.

### R2 · La comparación engañosa

Llamados pagan 20%, no llamados 35%; los llamados tenían mayor mora desde antes. El DAG diagnostica backdoor y Modelos contrasta asociación cruda, ajuste y overlap.

Aprendizaje: confusión, identificación, soporte/positividad. Que dos estimadores ajustados coincidan no demuestra causalidad.

### R3 · Una prueba mejor

El equipo define asignación, outcome y horizonte. El Diseñador modifica N y muestra efecto, IC95%, balance y MDE aproximado frente a un efecto mínimo útil.

Aprendizaje: randomización, ATE, incertidumbre, potencia útil y `más N ≠ menos sesgo`.

### R4 · Del efecto a la política

Modelos explora T-Learner, DR-Learner y CausalForestDML precomputados con EconML y ejecuta un stress test placebo. 🦁 integra CATE, intervalos, valor, costo, capacidad y riesgo en el Simulador de Política.

Aprendizaje: heterogeneidad, refutación, incertidumbre y policy learning. Un placebo incompatible bloquea la coherencia aunque los modelos coincidan.

## Scoring de equipo · determinista

El profesor no asigna puntos competitivos manuales.

- **Impacto causal: 35**.
- **Evidencia: 25**.
- **Diseño: 20**.
- **Riesgo: 10**.
- **Adaptación: 10**.

Máximo: **100 puntos**, antes del costo de ayudas cuando aplique. Las dimensiones de scoring no equivalen al número de roles; Política/Riesgo sigue siendo una dimensión de calidad aunque esté dentro del rol 🦁.

La cobertura, número de personas y microchecks no añaden puntos automáticamente.

### Empates

1. Impacto causal.
2. Evidencia.
3. Diseño.
4. Riesgo.
5. Adaptación.

Si continúan idénticos, empate técnico; no se usa velocidad.

## Evaluación individual

- medición inicial de transferencia;
- cuatro microchecks;
- resultado de equipo;
- medición final con contexto distinto;
- debrief oral no competitivo.

## Uso de IA

Regla: **“IA puede asesorar; IA no es evidencia.”** El experto IA continúa siendo opcional y no es necesario para el núcleo pedagógico.

## Qué NO puntuar

No puntuar clics, tiempo de pestaña, velocidad, cantidad de texto, recargas, composición del equipo ni apreciación subjetiva del profesor.
