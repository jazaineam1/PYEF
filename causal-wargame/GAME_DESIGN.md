# Game Design · CAUSAL QUEST

## Resultado de aprendizaje

Al salir, el participante debe poder preguntar espontáneamente:

1. ¿Qué estamos cambiando?
2. ¿Qué resultado queremos cambiar?
3. ¿Qué habría pasado sin intervenir?
4. ¿Por qué la comparación es defendible?
5. ¿Funciona igual para todos y dónde conviene actuar?

La terminología formal se introduce **después** de vivir cada concepto. La meta no es aprender software: es saber **qué pregunta responde cada instrumento, qué supuesto necesita y qué permite concluir**.

## Equipos y cinco especialidades

El juego usa **4 equipos** y **5 especialidades analíticas núcleo** por equipo:

- 🦁 **Líder de Decisión** — usa el **Constructor de Pregunta Causal** para fijar población, intervención, comparador, resultado, horizonte, estimando y restricción.
- 🦉 **Líder de Modelos** — usa el **Explorador de Uplift y CATE** para separar predicción de efecto incremental y explorar heterogeneidad.
- 🐈‍⬛ **Analista Causal** — usa el **Laboratorio de Grafo Causal** para razonar sobre confusión, mediadores, colliders e identificación.
- 🐢 **Líder de Experimentos** — usa el **Diseñador de Experimentos** para definir comparación, asignación, outcome, horizonte, efecto e incertidumbre.
- 🦅 **Política y Riesgo** — usa el **Simulador de Política** para convertir efecto, incertidumbre, costo, capacidad y riesgo en una regla de acción.

Los cinco comienzan con el mismo poder base: **Pregunta Crítica**. Las herramientas avanzadas sólo se habilitan cuando el concepto correspondiente ya fue explicado.

### Dependencia entre herramientas

No son cinco minijuegos independientes. El flujo esperado es:

`🦁 pregunta → 🐈‍⬛ identificación → 🦉 estimación → 🐢 contraste/incertidumbre → 🦅 política → 🦁 integración final`

Cada instrumento produce una pieza de evidencia con cuatro campos visibles:

1. **Pregunta** — qué intenta responder.
2. **Evidencia** — qué produjo la herramienta.
3. **Supuesto** — qué debe ser cierto para interpretarla.
4. **Decisión** — qué permite concluir y qué no.

La mesa de evidencia muestra cobertura **0–5** y, además, chequea contradicciones entre las piezas. `5/5` significa cobertura, no verdad: una estimación puede existir y aun no ser causal si la identificación es débil.

### Asistencia variable

La configuración objetivo para 20 participantes es **4 equipos × 5 especialistas**.

La sesión no se bloquea si hay ausencias:

- Con **4 personas**, queda visible cuál especialidad no tiene dueño; el equipo puede continuar, pero debe reconocer la evidencia faltante.
- Con **3 personas**, Modelos puede cubrir temporalmente Experimentos mediante un segundo módulo real. Esto no inventa una persona: genera una segunda pieza de evidencia explícita.
- Política y Riesgo ya no es un copiloto decorativo: es una especialidad núcleo y su evidencia cuenta dentro de la cobertura 5/5.

La composición del equipo no cambia el puntaje competitivo. El objetivo es evitar que una ausencia técnica detenga la clase sin fingir que la evidencia faltante existe.

## Información asimétrica cooperativa

Todos los integrantes quieren exactamente lo mismo: que su equipo tome la mejor decisión causal. No hay traidor ni objetivo secreto contrario.

Cada especialidad ve información o controles diferentes. Individualmente ninguna pieza es suficiente. Por ejemplo, en una ronda el Líder de Modelos puede ver una diferencia ajustada, el Analista Causal la estructura que hace defendible o no ese ajuste, Experimentos el balance/incertidumbre, Política y Riesgo el costo de actuar y Decisión la restricción de negocio.

La mecánica correcta es:

`enseño → exploras → produces evidencia → la compartes → integran → deciden → reveal/debrief`

## Rondas

### R1 · ORÁCULO

Elige 10 de 24 clientes utilizando score predictivo. Primero se observa quién parece más probable que convierta. Luego el simulador sintético permite revelar impacto incremental.

Aprendizaje: predicción ≠ efecto causal; contrafactual; `Y(1)-Y(0)`.

### R2 · La comparación engañosa

Llamados pagan 20%, no llamados 35%. La información distribuida revela que los llamados tenían mayor mora desde antes.

El DAG Lab permite formular una hipótesis causal y diagnosticar un backdoor. Modelos ve asociación cruda y una comparación ajustada; el mensaje pedagógico es que **el método no reemplaza la identificación**.

Aprendizaje: confusión, DAG sencillo y comparabilidad. Propensity, matching e IPW son panorama/extensión, no objetivos obligatorios.

### R3 · Una prueba mejor

El equipo debe definir asignación, outcome y horizonte. El Diseñador de Experimentos permite cambiar regla de asignación y N, observar tratamiento/control, efecto/diferencia, IC95% y balance.

Aprendizaje: randomización, tratamiento/control, ATE e incertidumbre. Potencia/MDE quedan como extensión opcional.

### R4 · Del efecto a la política

El Líder de Modelos explora 24 perfiles con resultados **precomputados offline con EconML** (T-Learner, DR-Learner y CausalForestDML). El navegador no entrena modelos en vivo. La coincidencia entre estimadores no se presenta como prueba de identificación causal.

Política y Riesgo recibe CATE, intervalos, tamaño de segmento, valor, costo y riesgo; modifica capacidad, presupuesto, tolerancia y asignación. La herramienta calcula factibilidad y valor esperado, pero no decide por el jugador.

Aprendizaje: heterogeneidad, CATE, incertidumbre y política de intervención.

## Scoring de equipo · determinista

El profesor no asigna puntos competitivos manuales.

- **Impacto causal: 35** — valor incremental esperado de los clientes seleccionados en R1 contra ground truth sintético.
- **Evidencia: 25** — decisión estructurada de R2.
- **Diseño: 20** — calidad del diseño seleccionado en R3.
- **Riesgo: 10** — evitar una política dañina en R4.
- **Adaptación: 10** — priorización segmentada en R4.

Máximo exacto: **100 puntos**, antes del costo de ayudas cuando aplique.

La cobertura de especialidades, el número de personas y los microchecks **no añaden puntos automáticamente**. Las herramientas producen evidencia para decidir; no son una mecánica de “hacer clic para sumar”.

### Empates

Si dos equipos terminan con el mismo total, se comparan en este orden:

1. Impacto causal.
2. Evidencia.
3. Diseño.
4. Riesgo.
5. Adaptación.

Si siguen idénticos, se declara empate técnico. No se usa velocidad de respuesta como desempate.

## Evaluación individual

La evaluación de aprendizaje se mantiene separada del ganador:

- medición inicial de transferencia;
- cuatro microchecks individuales;
- resultado del equipo;
- medición final con contexto diferente;
- debrief oral no competitivo.

Esto permite estimar cambio pre/post sin convertir la evaluación individual en puntos del leaderboard.

## Uso de IA

Regla visible: **“IA puede asesorar; IA no es evidencia.”**

Si se habilita el experto IA en una versión futura, sólo podrá recibir contexto permitido de la ronda/conceptos desbloqueados. No tendrá acceso al repositorio, Supabase, secretos, navegación ni ground truth oculto, y deberá orientar con preguntas/supuestos sin entregar la respuesta final.

## Qué NO puntuar

No usar como aprendizaje ni como desempate:

- clics;
- tiempo de pestaña;
- velocidad de respuesta;
- cantidad de texto;
- número de recargas;
- apreciación subjetiva del profesor;
- cantidad de integrantes del equipo.
