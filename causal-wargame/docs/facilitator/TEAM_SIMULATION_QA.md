# Simulación QA · equipo de cuatro roles

> Este documento usa ejemplos de práctica para ensayar al facilitador. No contiene el ground truth privado de una partida viva.

## Equipo Fisher QA

La unidad pedagógica es un equipo con **cuatro responsabilidades**, no cinco personas obligatorias.

1. **Líder de Decisión y Política · Constructor de Pregunta + Política** — define población, intervención, comparador, resultado, horizonte, estimando y restricción; administra recursos y cierra la política en R4.
2. **Líder de Modelos · Explorador de Uplift/CATE** — separa predicción, asociación y efecto incremental; revisa soporte y robustez.
3. **Analista Causal · Laboratorio de Grafo Causal** — formula el contrafactual y usa DAG/confusión después de la explicación correspondiente.
4. **Líder de Experimentos · Diseñador de Experimentos** — construye la comparación, interpreta ATE, IC y precisión útil.

Todos empiezan con **Pregunta Crítica** — “¿Qué tendría que ser cierto para que esta evidencia justifique la decisión?”. Nadie miente ni compite dentro del equipo; la información es complementaria.

### Si llegan tres personas al equipo

La distribución adaptativa garantiza que la especialidad ausente sea 🐢 Experimentos. 🦉 Modelos recibe entonces un módulo separado de **doble sombrero**. Debe producir la evidencia experimental explícitamente; el sistema no la regala.

### Topologías a ensayar

| Humanos | Distribución |
|---:|---|
| 15 | 4–4–4–3 |
| 16 | 4–4–4–4 |
| 17 | 4–4–3–3–3 |
| 18 | 4–4–4–3–3 |
| 19 | 4–4–4–4–3 |
| 20 | 4–4–4–4–4 |
| 28 | 4–4–4–4–4–4–4 |

Antes de iniciar, equipo/rol son provisionales. La primera mini-clase congela la lista.

---

## 0–20 min · Apertura y mini-clase 1

El Game Master presenta misión, reglas, mercado y la obligación de compartir una pieza de evidencia por responsabilidad. Después el facilitador explica:

- Predicción: `P(Y|X)`.
- Resultados potenciales: `Y(1)` y `Y(0)`.
- Efecto: `Y(1)-Y(0)`.
- Contrafactual: el futuro que no observamos.

Demostración de práctica:

- Perfil A: 90% con intervención, 89% sin → efecto +1 pp.
- Perfil B: 65% con intervención, 35% sin → efecto +30 pp.

Pregunta de control: “Si sólo puedo intervenir uno, ¿cuál cambia más?”

Durante la mini-clase los poderes futuros aparecen con candado. Al abrir laboratorio sólo quedan disponibles los conceptos ya enseñados.

---

## 20–38 min · Ronda 1

### Trabajo en sala

**Decisión y Política** usa el Constructor y concluye: “La pregunta no es sólo quién convierte; debemos fijar qué cambio queremos causar y en qué horizonte”. También vigila desperdicio y reversibilidad como parte de su responsabilidad integrada.

**Modelos** interpreta el puntaje predictivo y advierte que un valor alto todavía no es un efecto causal.

**Causalidad** no usa DAG todavía. Formula: “¿Qué habría pasado con estos mismos clientes si no interviniéramos?”.

**Experimentos** no usa RCT/ATE todavía. Pregunta: “¿Contra qué grupo o condición podríamos comparar la intervención?”.

Cada responsabilidad registra una opción cerrada como hallazgo. La meta es llegar a **4/4**, pero 4/4 no implica que las piezas sean coherentes.

### Decisión del equipo

Seleccionan 10 clientes y bloquean.

### Revelación

Primero se muestra ranking por conversión. Después **VER EL OTRO FUTURO** cambia el criterio a impacto incremental.

### Cierre docente

- predicción ≠ efecto causal;
- contrafactual;
- por qué un modelo predictivo excelente puede ser una mala política de intervención.

Microcheck individual. No da puntos competitivos.

---

## 38–66 min · Mini-clase y Ronda 2

### Mini-clase

Caso de práctica: tratados 22%, no tratados 34%.

Se dibuja:

`Riesgo previo → Tratamiento`

`Riesgo previo → Resultado`

`Tratamiento → Resultado`

Se explica:

- confusión;
- DAG;
- regresión ajustada;
- puntaje de propensión `e(X)=P(T=1|X)`;
- matching/IPW como panorama para confusores observados;
- overlap/positividad;
- por qué ajustar por mediadores o colliders puede ser problemático.

### Herramientas por rol

**Decisión y Política:** exige decidir qué evidencia falta antes de cancelar o escalar.

**Modelos:** contrasta asociación cruda y estimaciones ajustadas; además inspecciona overlap. Coincidencia entre métodos no se presenta como prueba de identificación.

**Causalidad:** construye el grafo y detecta una causa previa de tratamiento y resultado.

**Experimentos:** todavía no usa un RCT como herramienta principal; evalúa si la comparación observacional es defendible y qué diseño la mejoraría.

### Decisión

El equipo selecciona mediante opciones cerradas:

- recomendación;
- variable problemática;
- razón causal.

La puntuación es automática y determinista.

---

## 66–71 min · Pausa

El facilitador resume:

1. Predicción vs causalidad.
2. Contrafactual.
3. DAG/confusión.
4. Ajuste no reemplaza identificación.
5. Soporte/overlap.

---

## 71–99 min · Mini-clase y Ronda 3

### Mini-clase

Se explica:

`ATE = Ȳtratamiento − Ȳcontrol`

Ejemplo de práctica: 28% vs 23% = +5 pp.

Se introduce intervalo de confianza, potencia y MDE sin derivación extensa.

### Herramientas

**Decisión y Política:** fija outcome, horizonte y restricción antes del experimento.

**Modelos:** recuerda que AUC o score no crean un grupo control. Si el equipo es de tres, abre además el módulo explícito de Experimentos.

**Causalidad:** comprueba que la asignación no dependa sistemáticamente de una causa previa del resultado y plantea interferencia como supuesto operativo.

**Experimentos:** modifica asignación y N; observa tratamiento/control, efecto, IC, balance y MDE.

### Decisión

El equipo elige asignación, resultado y horizonte. Más N puede mejorar precisión, pero **no arregla una asignación sesgada**.

---

## 99–120 min · Mini-clase, Ronda 4 y cierre

### Mini-clase

`CATE(x)=E[Y(1)-Y(0)|X=x]`

Se conectan:

- CATE;
- uplift;
- causal forests;
- meta-learners;
- incertidumbre;
- stress test placebo;
- valor de política.

Se aclara que modelos modernos estiman heterogeneidad; no eliminan la necesidad de identificación causal.

### Herramientas

**Decisión y Política:** conserva el contrato causal y, en la misma responsabilidad, abre el Simulador de Política para asignar capacidad/presupuesto sin exceder riesgo.

**Modelos:** compara T-Learner, DR-Learner y CausalForestDML precomputados con EconML y ejecuta el stress test placebo.

**Causalidad:** recuerda qué estructura permite interpretar heterogeneidad como causal y qué variables no deben condicionarse.

**Experimentos:** resume efecto e incertidumbre para impedir que el equipo sobrerreaccione a una estimación puntual.

### Decisión

Cada segmento se clasifica como:

- Intervenir.
- No intervenir.
- Más evidencia.

La política debe respetar la restricción que 🦁 declaró; el motor de coherencia puede bloquear una propuesta aunque existan 4/4 evidencias.

### Cierre

El Wall muestra ranking final, costo de ayudas y métricas de transferencia. Mensaje final:

> Un modelo predice el mundo que observa. La inferencia causal intenta estimar qué cambia cuando intervenimos.

El profesor revisa microchecks, pero no modifica manualmente el leaderboard.

---

## QA específico de asistencia y reconexión

Antes de usar la sesión con participantes reales, ensaya al menos:

1. **16 usuarios:** cuatro equipos completos.
2. **17 usuarios:** cinco equipos `4–4–3–3–3`; los tres equipos incompletos deben activar Modelos→Experimentos.
3. **19 usuarios:** `4–4–4–4–3`.
4. **28 usuarios:** siete equipos completos y wall/leaderboard sin filas fantasma.
5. Salir y volver desde el mismo navegador: mismo `player_id`; después del freeze, mismo equipo/rol.
6. Mismo nombre desde otra identidad: rechazo explícito.
7. Antes del freeze, retirar un usuario offline y rebalancear.
8. Después del freeze, intentar un usuario nuevo: rechazo; un usuario conocido sí puede reingresar.
