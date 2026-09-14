# Simulación QA · un equipo completo

> Este documento usa ejemplos de práctica para ensayar al facilitador. No contiene el ground truth privado de una partida viva.

## Equipo Fisher QA

Cinco personas, un objetivo compartido y cinco especialidades. Los cuatro equipos reales —Fisher, Neyman, Rubin y Pearl— reciben exactamente la misma estructura.

1. **Líder de Decisión · Canvas de Decisión** — define población, intervención, resultado, horizonte y administra la bolsa de recursos.
2. **Líder de Modelos · Explorador de Modelos** — interpreta puntajes predictivos y, cuando corresponda, propensión e impacto incremental.
3. **Analista Causal · Laboratorio de Grafo Causal** — formula el contrafactual desde R1 y usa DAG/confusión sólo después de la explicación de R2.
4. **Líder de Experimentos · Laboratorio de Experimentos** — pregunta por la comparación desde R1 y usa aleatorización/ATE sólo después de la explicación de R3.
5. **Política y Riesgo · Simulador de Política** — vigila daño/desperdicio desde R1 y usa valor económico desde R4.

Todos empiezan además con el mismo poder universal: **Pregunta Crítica** — “¿Qué tendría que ser cierto para que esta evidencia justifique la decisión?”. Nadie miente ni compite dentro del equipo; la información es complementaria.

---

## 0–20 min · Apertura y mini-clase 1

El Game Master presenta misión, reglas, mercado y la obligación de compartir un hallazgo por rol. Después el facilitador docente explica:

- Predicción: `P(Y|X)`.
- Resultados potenciales: `Y(1)` y `Y(0)`.
- Efecto: `Y(1)-Y(0)`.
- Contrafactual: el futuro que no observamos.

Demostración de práctica:

- Perfil A: 90% con intervención, 89% sin → efecto +1 pp.
- Perfil B: 65% con intervención, 35% sin → efecto +30 pp.

Pregunta de control: “Si sólo puedo intervenir uno, ¿cuál cambia más?”

Durante la mini-clase los poderes avanzados futuros aparecen con candado. Al pulsar **Abrir laboratorio**, sólo quedan disponibles las capacidades ya enseñadas.

---

## 20–38 min · Ronda 1

### Trabajo en sala

**Líder de Decisión** usa el Canvas y concluye: “La pregunta no es sólo quién convierte; debemos fijar qué cambio queremos causar y en qué horizonte”.

**Líder de Modelos** interpreta el puntaje predictivo y advierte que un valor alto todavía no es un efecto causal. Su Radar de Propensión sigue bloqueado porque propensión se explica en R2.

**Analista Causal** no usa DAG todavía. Su aporte es formular: “¿Qué habría pasado con estos mismos clientes si no interviniéramos?”.

**Líder de Experimentos** no usa RCT/ATE todavía. Pregunta: “¿Contra qué grupo o condición podríamos comparar la intervención?”.

**Política y Riesgo** usa Escudo de Riesgo: “Podemos gastar capacidad en personas que convertirían de todas formas”.

Cada participante registra una opción cerrada como **hallazgo de su rol**. La meta es llegar a 5/5 antes de bloquear la decisión.

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
- grafo causal (DAG);
- regresión ajustada;
- puntaje de propensión `e(X)=P(T=1|X)`;
- emparejamiento/IPW como ideas para reconstruir comparabilidad con confusores observados;
- por qué una variable posterior al tratamiento puede ser problemática.

Al terminar la explicación se desbloquean **Radar de Propensión**, **Visión de Grafo Causal (DAG)** y **Escáner de Confusión**.

### Herramientas por rol

**Líder de Decisión:** exige decidir qué evidencia falta antes de cancelar.

**Líder de Modelos:** ve gráficamente crudo −12 pp, regresión +3,9 pp e IPW +4,2 pp.

**Analista Causal:** usa el grafo y detecta la variable previa que afecta tratamiento y resultado.

**Líder de Experimentos:** todavía no usa RCT. Evalúa si la comparación observacional es defendible y qué supuestos necesita.

**Política y Riesgo:** cuestiona cancelar una estrategia por una comparación cruda posiblemente sesgada.

### Decisión

El equipo selecciona mediante opciones cerradas:

- recomendación;
- variable problemática;
- razón causal.

La puntuación es automática y determinista.

---

## 66–71 min · Pausa

El facilitador muestra la caja acumulada:

1. Predicción vs causalidad.
2. Contrafactual.
3. Grafo causal.
4. Regresión ajustada.
5. Propensión/IPW.

---

## 71–99 min · Mini-clase y Ronda 3

### Mini-clase

Se explica:

`ATE = Ȳtratamiento − Ȳcontrol`

Ejemplo de práctica: 28% vs 23% = +5 pp.

Se introduce intervalo de confianza y el sentido de potencia/efecto mínimo detectable sin derivación extensa. Después se desbloquean **Escudo de Aleatorización (RCT)** y **Medidor de Efecto Promedio (ATE)**.

### Herramientas

**Líder de Decisión:** fija pago a 30 días como resultado de negocio.

**Líder de Modelos:** recuerda que AUC o puntaje predictivo no crean un grupo control.

**Analista Causal:** comprueba que la asignación no dependa sistemáticamente de una causa previa del resultado.

**Líder de Experimentos:** modifica N/tasas y observa barras Tratamiento/Control, ATE e intervalo aproximado.

**Política y Riesgo:** exige resultado y horizonte relevantes para no optimizar un indicador cómodo.

### Decisión

El equipo elige entre asesor/modelo/azar, resultado y horizonte. Una sola combinación se considera plenamente defendible para este escenario.

---

## 99–120 min · Mini-clase, Ronda 4 y cierre

### Mini-clase

`CATE(x)=E[Y(1)-Y(0)|X=x]`

Se conectan:

- efecto por perfil (CATE);
- impacto incremental (uplift);
- bosques causales;
- meta-modelos;
- valor de política.

Se aclara que modelos modernos estiman heterogeneidad; no eliminan la necesidad de identificación causal. Después se desbloquean **Lente de Impacto Incremental** y **Forja de Valor (ROI)**.

### Herramientas

**Líder de Decisión:** define qué segmentos priorizar bajo capacidad limitada.

**Líder de Modelos:** compara gráficamente probabilidad base con impacto incremental.

**Analista Causal:** recuerda qué supuestos permiten interpretar el efecto por segmento como causal.

**Líder de Experimentos:** resume efecto promedio, efecto por segmento e incertidumbre.

**Política y Riesgo:** modifica efecto/costo/volumen y observa valor bruto, costo y valor neto.

### Decisión

Cada segmento se clasifica exactamente una vez como:

- Intervenir.
- No intervenir.
- Más evidencia.

### Cierre

El Wall muestra ranking final, costo de ayudas y los cinco roles. Mensaje final:

> Un modelo predice el mundo que observa. La inferencia causal intenta estimar qué cambia cuando intervenimos.

El profesor revisa microchecks, pero no modifica manualmente el leaderboard.
