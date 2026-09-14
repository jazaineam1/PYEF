# Causal Quest · Runbook del facilitador · 120 min

## 24 h antes

1. Enviar a los 20 participantes el enlace `system-check.html`.
2. Pedir que registren el resultado con su nombre y código de partida.
3. Revisar en `facilitator.html` el panel **Preparación de participantes** hasta llegar idealmente a `20/20`.
4. Contactar antes de la sesión a quien aparezca como **No apto**.
5. Probar `play.html`, `facilitator.html` y `wall.html` desde un equipo similar al corporativo.
6. Confirmar acceso al frontend y Edge Functions.
7. Guardar código/PIN fuera del chat general.
8. Confirmar que `scenario-private.sql` NO está publicado.

### Mensaje para enviar un día antes

> Hola. Mañana tendremos **Causal Quest**. Antes de la sesión realiza una prueba técnica de menos de 3 minutos en:  
> `https://jazaineam1.github.io/PYEF/dos-futuros/system-check.html`  
> Usa el mismo computador con el que participarás mañana, escribe tu nombre y registra el resultado. Recomendamos portátil o computador, no celular. En Windows usa Chrome o Edge actualizado; en macOS puedes usar Chrome, Edge o Safari actualizado. Si obtienes **No apto**, envía una captura hoy para poder ayudarte antes del chapter.

## 15 min antes

- Abrir videollamada y cuatro salas de trabajo: **Fisher, Neyman, Rubin y Pearl**.
- Compartir **sólo `wall.html`** en sala principal.
- Mantener `facilitator.html` en una ventana no compartida.
- Confirmar 20/20 participantes o activar plan de ausencia.
- Explicar que todos los equipos tienen la misma composición de 5 roles, el mismo poder universal inicial y la misma bolsa de recursos.
- Explicar mercado en máximo 2 min: pista, herramienta de ronda, Junior, Senior y Llamada al Capítulo.

## Regla pedagógica de los poderes

Todos los participantes empiezan con el mismo poder universal: **Pregunta Crítica** — “¿Qué tendría que ser cierto para que esta evidencia justifique la decisión?”. El rol se conoce desde el inicio, pero una herramienta avanzada **no se usa antes de ser enseñada**.

- R1: se activan Canvas de Decisión, Administración de Recursos, Radar de Propensión y Escudo de Riesgo. El Analista Causal y el Líder de Experimentos aportan con preguntas de comparabilidad y diseño, sin usar aún DAG/RCT.
- R2: después de explicar DAG y confusión se activan **Visión DAG + Escáner de Confusión**.
- R3: después de explicar experimento y ATE se activan **Escudo RCT + Medidor ATE**.
- R4: después de explicar heterogeneidad se activan **Lente de Uplift + Forja ROI**.

Los roles cuyos poderes avanzados aún están bloqueados siguen ayudando con una **misión permanente en lenguaje no técnico**. Nadie queda sin tarea. La lógica es deliberada: primero se enseña el concepto, luego aparece el poder que lo representa.

## Cronograma recomendado

| Min | Acción |
|---:|---|
| 0–10 | Apertura: misión, equipos, roles, mercado y regla de puntuación. |
| 10–20 | Mini-clase R1: predicción, intervención y contrafactual. |
| 20–32 | Laboratorio R1 en salas. |
| 32–38 | Cierre, ranking observado, reveal causal y microcheck. |
| 38–48 | Mini-clase R2: confusión, DAG, regresión ajustada y propensión. |
| 48–60 | Laboratorio R2. |
| 60–66 | Reveal, debrief y microcheck. |
| 66–71 | Pausa. |
| 71–81 | Mini-clase R3: aleatorización, ATE, IC y potencia conceptual. |
| 81–93 | Laboratorio R3. |
| 93–99 | Reveal, debrief y microcheck. |
| 99–108 | Mini-clase R4: CATE, uplift, valor y riesgo. |
| 108–116 | Laboratorio R4. |
| 116–120 | Reveal final, ranking, aprendizajes y cierre. |

## Secuencia por ronda

`PRESENTAR CONCEPTO → ABRIR LABORATORIO → COMPARTIR 5 HALLAZGOS → CERRAR → REVELAR → CIERRE DOCENTE → MICROCHECK → SIGUIENTE`

No se puede abrir laboratorio desde briefing sin pasar por la mini-clase.

## Los 5 roles y cómo ayudan desde el inicio

- **Líder de Decisión:** encuadra población, intervención, resultado y horizonte. Administra la bolsa y es el único que confirma compras.
- **Líder de Modelos:** en R1 interpreta probabilidad/puntaje; más adelante compara esa probabilidad con efecto incremental. No debe llamar “efecto” a una predicción.
- **Analista Causal:** en R1 pregunta qué tendría que ser comparable para afirmar causalidad. Desde R2 usa DAG y confusión porque ya fueron enseñados.
- **Líder de Experimentos:** en R1 y R2 pregunta “¿contra qué grupo estamos comparando?”. Desde R3 usa RCT y ATE porque ya fueron enseñados.
- **Política y Riesgo:** desde R1 busca desperdicio, daño o decisiones irreversibles. En R4 suma ROI y heterogeneidad.

Cada participante debe llegar a la decisión del equipo con **un hallazgo estructurado de una frase**. El rol aporta evidencia; no tiene poder de veto ni voto ponderado.

## Llamada al Capítulo

El Game Master dirige y **no está a la venta**. Los otros tres facilitadores forman una **bolsa transversal de expertos**. No son “experto de DAG”, “experto de ML” o “experto de política” separados en el mercado: la llamada representa al equipo del chapter y debe ser atendida por la persona disponible que domine la duda planteada.

En cada ronda el Game Master define de 0 a 3 atenciones disponibles según capacidad real. La llamada dura 90 s. El experto puede hacer:

- una observación sobre el problema;
- una pregunta socrática;
- una aclaración sobre **conceptos ya enseñados hasta esa ronda**.

No puede explicar un tema futuro, decir cuál opción seleccionar ni revelar información privada del simulador. Por ejemplo, en R1 puede hablar de predicción, intervención y contrafactual, pero todavía no debe resolver la ronda usando DAG, IPW, RCT o CATE.

## Si falta una persona

El equipo puede funcionar con 4. El Game Master entrega oralmente la misión permanente del rol faltante; no desbloquea automáticamente sus herramientas.

## Si falla backend

- Pausar si la consola responde.
- Si no responde en 2–3 min, pasar al fallback docente: proyectar resultados/tablas preparados y recoger decisiones por chat o Forms.
- No inventar resultados en vivo.
