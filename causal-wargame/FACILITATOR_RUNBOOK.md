# Causal Quest · Runbook del facilitador · 120 min

## 24 h antes

1. Crear una **partida nueva con código aleatorio** desde `facilitator.html`. No reutilizar un código público permanente.
2. Enviar a los 20 participantes el enlace de prueba previa generado por el panel **Preparación de participantes**; ese enlace ya lleva el código de la sesión.
3. Pedir que registren el resultado con su nombre.
4. Revisar el panel hasta llegar idealmente a `20/20` y contactar a quien aparezca como **No apto**.
5. Probar `play.html`, `facilitator.html` y `wall.html` desde un equipo similar al corporativo.
6. Ejecutar el gate de carga sostenida de 20 usuarios durante 15 min.
7. Guardar código/PIN fuera del chat general hasta el envío a participantes.
8. Confirmar que `scenario-private.sql` NO está publicado.
9. Congelar cambios de código 24–48 h antes del evento salvo corrección crítica.

### Mensaje para enviar un día antes

> Hola. Mañana tendremos **Causal Quest**. Antes de la sesión realiza una prueba técnica de menos de 3 minutos usando el enlace que te enviamos. Usa el mismo computador con el que participarás mañana. Recomendamos portátil o computador, no celular. En Windows usa Chrome o Edge actualizado; en macOS puedes usar Chrome, Edge o Safari actualizado. Si obtienes **No apto**, envía una captura hoy para poder ayudarte antes del chapter.

## 15 min antes

- Abrir videollamada y cuatro salas de trabajo: **Fisher, Neyman, Rubin y Pearl**.
- Compartir **sólo `wall.html`** en sala principal.
- Mantener `facilitator.html` en una ventana no compartida.
- Confirmar 20/20 participantes o activar plan de ausencia.
- Explicar que todos los equipos tienen la misma composición de 5 roles, el mismo poder universal inicial y la misma bolsa de recursos.
- Explicar mercado en **máximo 60 segundos**: pista, herramienta de ronda, Junior, Senior y Llamada al Capítulo. Las ayudas no humanas son iguales por equipo; sólo la llamada humana tiene cupos globales.

## Regla pedagógica de los poderes

Todos los participantes empiezan con el mismo poder universal: **Pregunta Crítica** — “¿Qué tendría que ser cierto para que esta evidencia justifique la decisión?”. El rol se conoce desde el inicio, pero una herramienta avanzada **no se usa antes de ser enseñada**.

- R1: se activan **Mapa de Decisión**, **Administración de Recursos** y **Escudo de Riesgo**. Líder de Modelos interpreta el puntaje sin llamarlo causal; Analista Causal formula el contrafactual; Líder de Experimentos pregunta cuál sería la comparación justa.
- R2: después de explicar confusión y grafo causal se activan **Radar de Propensión**, **Visión de Grafo Causal (DAG)** y **Escáner de Confusión**. Propensity/matching/IPW se mencionan sólo como panorama, no como tres objetivos de aprendizaje.
- R3: después de explicar experimento y efecto promedio se activan **Escudo de Aleatorización (RCT)** y **Medidor de Efecto Promedio (ATE)**. Potencia/MDE quedan como extensión opcional.
- R4: después de explicar heterogeneidad se activan **Lente de Impacto Incremental** y **Forja de Valor**. Bosques causales/meta-modelos son referencias opcionales, no contenido obligatorio.

Los roles cuyos poderes avanzados aún están bloqueados siguen ayudando con una **misión permanente en lenguaje no técnico**. Nadie queda sin tarea. Primero se enseña el concepto; después aparece el poder que lo representa.

## Cronograma recomendado · 120 min reales

El cierre conceptual final es **intocable**. Si una ronda se atrasa, reduce discusión del mercado o usa `+60 s` una sola vez; no elimines el debrief.

| Min | Acción |
|---:|---|
| 0–6 | Apertura + medición inicial de 4 preguntas. Roles y mercado en 60 s. |
| 6–15 | Mini-clase R1: predicción, intervención y contrafactual. |
| 15–24 | Laboratorio R1 en salas. |
| 24–30 | Reveal + debrief + microcheck R1. |
| 30–39 | Mini-clase R2: confusión, DAG y comparabilidad. |
| 39–48 | Laboratorio R2. |
| 48–54 | Reveal + debrief + microcheck R2. |
| 54–59 | Pausa. |
| 59–68 | Mini-clase R3: aleatorización, ATE e incertidumbre. |
| 68–77 | Laboratorio R3. |
| 77–83 | Reveal + debrief + microcheck R3. |
| 83–92 | Mini-clase R4: heterogeneidad, incertidumbre, costo, capacidad y riesgo. |
| 92–101 | Laboratorio R4. |
| 101–107 | Reveal + debrief R4. |
| 107–112 | Evaluación final de transferencia: 4 casos nuevos. |
| 112–120 | Síntesis, cambio pre→post, ranking final y 4 preguntas causales que deben llevarse. |

### Las 4 preguntas de cierre que deben recordar

1. **¿Qué intervención estoy evaluando y qué resultado quiero cambiar?**
2. **¿Qué habría ocurrido sin intervenir y por qué mi comparación es creíble?**
3. **¿La evidencia identifica un efecto o sólo una asociación/predicción?**
4. **¿El efecto es suficientemente cierto, valioso y seguro para convertirlo en política?**

## Secuencia por ronda

`PRESENTAR CONCEPTO → ABRIR LABORATORIO → COMPARTIR HALLAZGOS → CERRAR → REVELAR → CIERRE DOCENTE → MICROCHECK → SIGUIENTE`

No se puede abrir laboratorio desde briefing sin pasar por la mini-clase.

## Los 5 roles y cómo ayudan desde el inicio

- **Líder de Decisión:** usa **Causal Decision Canvas** para cerrar población, intervención, comparador, outcome, horizonte, estimando y restricción. Si declara capacidad, presupuesto o tolerancia de riesgo debe fijar también su valor operativo; esa cifra será contrastada después con la política del equipo.
- **Líder de Modelos:** en R1 interpreta probabilidad/puntaje y deja claro qué NO demuestra. En R2 ayuda a diagnosticar selección/comparabilidad y en R4 usa **Uplift / CATE Explorer** para separar probabilidad base de impacto incremental y comparar T-Learner, DR-Learner y CausalForestDML sin confundir acuerdo entre estimadores con identificación.
- **Analista Causal:** en R1 formula el contrafactual y pregunta qué tendría que ser comparable. Desde R2 usa **DAG Lab**; debe pulsar **Diagnosticar estructura** antes de compartir una conclusión causal.
- **Líder de Experimentos:** en R1 y R2 pregunta “¿contra qué grupo estamos comparando?”. Desde R3 usa **Experiment Designer** para cambiar asignación y N; una asignación por modelo/asesor produce una diferencia observada, no se rotula como ATE causal. Outcome y horizonte deben coincidir con el contrato del Líder de Decisión.
- **Política y Riesgo:** desde R1 busca desperdicio, daño o decisiones irreversibles. En R4 usa **Policy Simulator** para asignar incluso una fracción de cada segmento y combinar efecto, intervalo, valor, costo, capacidad, presupuesto y riesgo.

Cada participante debe llegar a la decisión del equipo con **un hallazgo estructurado de una frase**. El rol aporta evidencia; no tiene poder de veto ni voto ponderado. En la consola docente se muestra `Hallazgos x/5` por equipo para saber a qué sala entrar.

## Regla de coherencia del war room

`5/5` hallazgos **no significa automáticamente que la decisión esté bien defendida**. La mesa de evidencia calcula además chequeos deterministas de coherencia entre las piezas compartidas.

El panel puede marcar, entre otros casos:

- **contrato causal incompleto**;
- **DAG todavía no diagnosticado**;
- **outcome u horizonte del experimento distintos de los acordados por Decisión**;
- **asignación no aleatoria que requiere una defensa adicional**;
- **política localmente inviable por capacidad, presupuesto o riesgo**;
- **política que viola la restricción operativa fijada por el Líder de Decisión**, aunque el Líder de Riesgo haya escrito controles locales más permisivos.

Un estado rojo es una **contradicción conceptual que el equipo debe discutir**, no una excusa para que el software tome la decisión. El facilitador debe preguntar primero: “¿qué dos piezas no están contando la misma historia?”. Si el tiempo es corto, corrige la incompatibilidad en el debrief en lugar de explicar más teoría.

La prioridad de lectura es:

`PREGUNTA → IDENTIFICACIÓN → ESTIMACIÓN → DISEÑO/INCERTIDUMBRE → POLÍTICA`

El panel muestra primero el bloqueo principal y deja el resto de chequeos en un detalle desplegable para no convertir la interfaz en una lista de alertas.

## Llamada al Capítulo

El Game Master dirige y **no está a la venta**. Los otros tres facilitadores forman una **bolsa transversal de expertos**. Todos deben dominar una base común de los tres bloques: causalidad, experimentación y decisión. Luego cada uno puede tener una fortaleza distinta.

En cada ronda el Game Master define de 0 a 3 atenciones disponibles según capacidad real. La llamada dura 90 s. El experto puede hacer:

- una observación sobre el problema;
- una pregunta socrática;
- una aclaración sobre **conceptos ya enseñados hasta esa ronda**.

No puede explicar un tema futuro, decir cuál opción seleccionar ni revelar información privada del simulador.

## Mercado justo

- Cada equipo tiene la misma bolsa, catálogo, precios base e inventario de ayudas no humanas.
- Lo que compra Fisher **no** encarece ni agota lo que puede comprar Neyman, Rubin o Pearl.
- Dentro de un equipo sí puede subir el precio de un segundo/tercer Junior para representar uso creciente de recursos.
- Sólo **Llamada al Capítulo** tiene cupos globales porque consume tiempo de una persona real.
- El mercado es opcional; seguir sin ayuda es una estrategia válida.

## Si falta una persona

El equipo puede funcionar con 4. El Game Master entrega oralmente la misión permanente del rol faltante; no desbloquea automáticamente sus herramientas.

## Si falla backend

- Pausar si la consola responde.
- Si no responde en 2–3 min, pasar al fallback docente: proyectar resultados/tablas preparados y recoger decisiones por chat o Forms.
- No inventar resultados en vivo.
