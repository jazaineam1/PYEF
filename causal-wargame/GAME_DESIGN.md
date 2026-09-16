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

## Cuatro especialidades; número de equipos adaptativo

La unidad conceptual del juego es el **equipo de cuatro responsabilidades**, no una cantidad fija de equipos:

- 🦁 **Líder de Decisión y Política** — fija población, intervención, comparador, resultado, horizonte, estimando y restricción; administra recursos y en R4 convierte la evidencia en una política factible bajo costo, capacidad y riesgo.
- 🦉 **Líder de Modelos** — separa predicción de efecto incremental, revisa overlap y explora heterogeneidad con Uplift/CATE.
- 🐈‍⬛ **Analista Causal** — usa el DAG para razonar sobre confusión, mediadores, colliders e identificación.
- 🐢 **Líder de Experimentos** — diseña la comparación, asignación, outcome, horizonte, incertidumbre y precisión útil.

**Política y Riesgo no es un quinto rol.** Esa responsabilidad está fusionada con Decisión para evitar que una experiencia de dos horas se fragmente en cinco minijuegos. El código conserva el identificador histórico `risk` únicamente para leer sesiones antiguas sin romperlas; no se asigna a participantes nuevos.

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

## Topología de asistencia

El sistema intenta mantener equipos de **3–4 personas**. El número de equipos es:

`ceil(asistentes / 4)`

con un máximo soportado de **7 equipos / 28 humanos**.

| Asistentes | Equipos | Distribución |
|---:|---:|---|
| 15 | 4 | 4–4–4–3 |
| 16 | 4 | 4–4–4–4 |
| **17** | **5** | **4–4–3–3–3** |
| 18 | 5 | 4–4–4–3–3 |
| 19 | 5 | 4–4–4–4–3 |
| 20 | 5 | 4–4–4–4–4 |
| 21 | 6 | 4–4–4–3–3–3 |
| 24 | 6 | 4–4–4–4–4–4 |
| 25 | 7 | 4–4–4–4–3–3–3 |
| **28** | **7** | **4–4–4–4–4–4–4** |

Los nombres canónicos disponibles son **Fisher, Neyman, Rubin, Pearl, Robins, Imbens y Rosenbaum**. Sólo los primeros `team_target` aparecen en participante, consola y wall.

### Asignación por olas de rol

Mientras la lista está abierta, los humanos se reordenan determinísticamente por llegada y se asignan por olas:

1. 🦁 Decisión y Política a todos los equipos activos;
2. 🦉 Modelos;
3. 🐈‍⬛ Causalidad;
4. 🐢 Experimentos.

Esto produce una propiedad pedagógica útil: un equipo de tres siempre conserva 🦁+🦉+🐈‍⬛ y sólo carece de 🐢. En ese caso 🦉 Modelos activa un **módulo separado de doble sombrero** para producir evidencia experimental explícita. No se inventa un participante ni se marca evidencia automáticamente.

La topología es **provisional durante lobby/briefing**. En la primera acción `lesson`, el servidor hace un último rebalanceo y pone `roster_locked=true`. Después de ese punto no se redistribuyen personas en caliente.

Con menos de tres integrantes en algún equipo, la app advierte al facilitador. Los bots son sólo para ensayo técnico y no deben usarse para fingir colaboración humana.

## Seguridad de ingreso y reingreso

La identidad del participante y el token de sesión son conceptos distintos:

- el navegador conserva una clave aleatoria de participante;
- el token puede expirar o borrarse sin perder esa identidad;
- mientras el roster está abierto, la misma identidad recupera el mismo `player_id`, aunque equipo/rol puedan haber cambiado por el rebalanceo global;
- una vez congelada la lista, la misma identidad recupera exactamente `player_id`, `team_id` y `role_code`;
- introducir el mismo nombre desde otra identidad se rechaza para evitar duplicados accidentales;
- se recomienda usar nombre y apellido si dos personas tienen nombres iguales;
- después de congelar la lista sólo reingresan identidades ya registradas;
- máximo: **28 humanos**.

El logout borra el token de sesión, **no** la clave local de identidad.

### Ausencias antes de iniciar

La consola puede retirar participantes que lleven un umbral de tiempo sin `last_seen_at` reciente y volver a ejecutar el balance. Esta acción sólo existe antes del cierre de lista. El facilitador debe confirmarla porque una pestaña suspendida puede parecer temporalmente offline.

### Ausencias durante la partida

No se reestructura el equipo automáticamente después del freeze. La ausencia se hace visible y se espera reingreso. Si falta Experimentos en un equipo de tres, Modelos puede cubrir su módulo explícito; otras ausencias no generan evidencia automática.

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

## Mercado

Las ayudas no humanas son **inventario por equipo**. Por eso pasar de 4 a 7 equipos no reduce el stock ni encarece Junior/Senior para los demás. La única escasez global es la **Llamada al Capítulo**, porque representa capacidad humana real del equipo facilitador.

## Scoring de equipo · determinista

El profesor no asigna puntos competitivos manuales.

- **Impacto causal: 35**.
- **Evidencia: 25**.
- **Diseño: 20**.
- **Riesgo: 10**.
- **Adaptación: 10**.

Máximo: **100 puntos**, antes del costo de ayudas cuando aplique. Las dimensiones de scoring no equivalen al número de roles; Política/Riesgo sigue siendo una dimensión de calidad aunque esté dentro del rol 🦁.

La cobertura, número de personas y microchecks no añaden puntos automáticamente. El tamaño del equipo tampoco se usa como bonificación o penalización competitiva.

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

El pretest está ligado al `player_id`, no al asiento, por lo que un rebalanceo previo al freeze no borra la medición individual.

## Uso de IA

Regla: **“IA puede asesorar; IA no es evidencia.”** El experto IA continúa siendo opcional y no es necesario para el núcleo pedagógico.

## Qué NO puntuar

No puntuar clics, tiempo de pestaña, velocidad, cantidad de texto, recargas, composición del equipo ni apreciación subjetiva del profesor.
