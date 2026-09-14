# Simulación QA · un equipo completo

> Este documento usa ejemplos de práctica para ensayar al capacitador. No contiene el ground truth privado de una partida viva.

## Equipo Águila QA

Cinco personas, un objetivo compartido y cinco especialidades:

1. **Decision Lead · Decision Canvas** — define población, intervención, outcome, horizonte y la pregunta causal.
2. **Model Lead · Model Explorer** — diferencia propensity, predicción y efecto incremental.
3. **Causal Analyst · DAG Lab** — dibuja relaciones causales y detecta confusores.
4. **Experiment Lead · Experiment Lab** — diseña comparaciones y calcula diferencia/IC.
5. **Policy & Risk Lead · Policy Simulator** — traduce efecto a valor, costo, capacidad y riesgo.

Nadie miente ni compite dentro del equipo. La información es complementaria.

---

## 0–12 min · Apertura y mini-clase 1

El capacitador comparte `wall.html` y explica:

- Predicción: `P(Y|X)`.
- Potential outcomes: `Y(1)` y `Y(0)`.
- Efecto: `Y(1)-Y(0)`.
- En datos reales no observamos ambos futuros de la misma persona.

Demostración de práctica:

- Perfil A: 90% con intervención, 89% sin → efecto +1 pp.
- Perfil B: 65% con intervención, 35% sin → efecto +30 pp.

Pregunta de control: “Si sólo puedo intervenir uno, ¿cuál cambia más?”

El capacitador pulsa **Presentar concepto** y después **Abrir laboratorio**.

---

## 12–27 min · Ronda 1

### Trabajo en sala

**Decision Lead** usa Decision Canvas y concluye: “La pregunta no es quién convierte; es quién cambia por la intervención en 30 días”.

**Model Lead** abre Model Explorer y muestra que propensity y uplift pueden ordenar clientes de manera distinta.

**Causal Analyst** explica qué información faltaría para observar el contrafactual en datos reales.

**Experiment Lead** propone que una comparación causal futura necesitará tratamiento/control y outcome predefinido.

**Policy & Risk Lead** calcula que intervenir perfiles con efecto casi cero consume capacidad sin generar valor.

### Decisión del equipo

Seleccionan 10 clientes y bloquean.

### Reveal

Primero se muestra ranking por conversión. Después **VER EL OTRO FUTURO** cambia el criterio a impacto incremental.

### Debrief

El capacitador formaliza:

- predicción ≠ efecto causal;
- contrafactual;
- treatment effect;
- por qué un modelo predictivo excelente puede ser una mala política de targeting.

Microcheck individual. No da puntos competitivos.

---

## 27–48 min · Mini-clase y Ronda 2

### Mini-clase

Caso de práctica: tratados 22%, no tratados 34%.

Se dibuja:

`Riesgo previo → Tratamiento`

`Riesgo previo → Outcome`

`Tratamiento → Outcome`

El capacitador explica:

- confusión;
- regresión ajustada;
- propensity score `e(X)=P(T=1|X)`;
- matching/IPW como formas de reconstruir comparabilidad con confusores observados;
- por qué ajustar variables post-tratamiento puede ser problemático.

### Herramientas por rol

**Decision Lead:** exige decidir si los grupos son comparables antes de cancelar.

**Model Lead:** ejemplo de práctica: crudo −12 pp, regresión +3.9 pp, IPW +4.2 pp.

**Causal Analyst:** en DAG Lab identifica la variable previa que afecta tratamiento y outcome.

**Experiment Lead:** advierte que un estimador observacional necesita supuestos explícitos.

**Policy & Risk Lead:** muestra costo de cancelar una estrategia eficaz por una comparación sesgada.

### Decisión

El equipo selecciona mediante opciones cerradas:

- recomendación;
- variable problemática;
- razón causal.

El scoring es automático y determinista.

### Reveal/debrief

Se compara asociación observada frente al efecto del simulador y se conecta con regresión/IPW.

---

## 48–58 min · Pausa

El capacitador muestra la caja de herramientas acumulada:

1. Predicción vs causalidad.
2. Contrafactual.
3. DAG.
4. Regresión ajustada.
5. Propensity/IPW.

---

## 58–82 min · Mini-clase y Ronda 3

### Mini-clase

El profesor explica:

`ATE = Ȳtratamiento − Ȳcontrol`

Ejemplo de práctica: 28% vs 23% = +5 pp.

Se introduce intervalo de confianza y el sentido de power/MDE sin derivación extensa.

### Herramientas

**Decision Lead:** fija pago a 30 días como outcome de negocio.

**Model Lead:** recuerda que AUC no crea un grupo control.

**Causal Analyst:** comprueba que asignación no dependa del riesgo previo.

**Experiment Lead:** usa Experiment Lab; modifica N/tasas y observa el IC.

**Policy & Risk Lead:** exige control y horizonte adecuados para detectar daño.

### Decisión

El equipo elige entre asesor/modelo/azar, outcome y horizonte. Una sola combinación se considera plenamente defendible para este escenario.

### Reveal/debrief

Se muestra tratamiento, control, ATE e interpretación del IC.

---

## 82–105 min · Mini-clase y Ronda 4

### Mini-clase

`CATE(x)=E[Y(1)-Y(0)|X=x]`

El profesor conecta:

- CATE;
- uplift;
- causal forests;
- meta-learners / EconML;
- policy value.

Aclaración: modelos modernos estiman heterogeneidad; no eliminan la necesidad de identificación causal.

### Herramientas

**Decision Lead:** define qué segmentos priorizar bajo capacidad limitada.

**Model Lead:** muestra propensity alta con uplift bajo frente a propensity moderada con uplift alto.

**Causal Analyst:** recuerda qué supuestos permiten interpretar CATE causalmente.

**Experiment Lead:** resume ATE/CATE e incertidumbre.

**Policy & Risk Lead:** prueba distintos efectos/costos en Policy Simulator y detecta cuándo un efecto positivo no genera valor neto.

### Decisión

Cada segmento se clasifica exactamente una vez como:

- Intervenir.
- No intervenir.
- Más evidencia.

---

## 105–116 min · Reto integrador

El capacitador plantea un caso nuevo de práctica y muestra la `Causal Toolbox`:

| Situación | Herramienta sugerida |
|---|---|
| Podemos randomizar | RCT / A-B |
| Confusores observados | Regresión, matching, IPW |
| Cambio de política temporal | Difference-in-Differences |
| Regla por umbral | Regression Discontinuity |
| Instrumento válido | IV |
| Efectos heterogéneos | CATE / uplift / causal forest |
| Muchos controles + ML | Doubly robust / Double ML |

El equipo debe identificar tratamiento, outcome, estimando y diseño. Esta parte es de transferencia, no de memorización.

---

## 116–120 min · Cierre

Mensaje final:

> Un modelo predice el mundo que observa. La inferencia causal intenta estimar qué cambia cuando intervenimos.

El profesor revisa los microchecks y no modifica manualmente el leaderboard.
