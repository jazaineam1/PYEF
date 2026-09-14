# Causal Quest · Runbook del facilitador · 120 min

## Principio operativo

El juego tiene **4 equipos** y **4 responsabilidades causales núcleo**. No necesita exactamente 20 personas para funcionar.

1. 🦁 **Estrategia y Política** — abre la pregunta y cierra la política.
2. 🦉 **Modelos** — separa predicción de efecto incremental.
3. 🐈‍⬛ **Causalidad** — defiende identificación, ajuste y estructura.
4. 🐢 **Experimentos** — diseña comparación e incertidumbre.

Una quinta persona es 🦅 **Copiloto de Estrategia**: apoyo opcional, nunca quinta evidencia obligatoria.

### Composición según asistencia

| Personas en el equipo | Estrategia |
|---:|---|
| 3 | 🦁 Estrategia + 🦉 Modelos + 🐈‍⬛ Causalidad. **Modelos toma también el sombrero 🐢 Experimentos.** |
| 4 | Configuración ideal: una persona por responsabilidad núcleo. |
| 5 | Cuatro responsabilidades + 🦅 copiloto opcional. |

La consola docente muestra **Cobertura 0–4**, no personas 0–5. En un equipo de 3 la responsabilidad de Experimentos sólo cuenta cuando Modelos realiza y comparte la evidencia experimental secundaria. No otorgues crédito por ausencia; otórgalo por trabajo realmente cubierto.

Con 12 participantes pueden operar cuatro equipos de 3. Con 16, cuatro equipos de 4. Entre 17 y 20, los participantes adicionales entran como copilotos. No rearmes equipos sólo para igualar tamaños si ya existe una composición funcional.

## 24 h antes

1. Crear una **partida nueva con código aleatorio** desde `facilitator.html`. No reutilizar un código público permanente.
2. Enviar el enlace de prueba previa a los participantes confirmados.
3. Pedir que registren el resultado con su nombre.
4. Revisar el panel de preparación y contactar a quien aparezca como **No apto**.
5. Probar `play.html`, `facilitator.html` y `wall.html` desde un equipo similar al corporativo.
6. Ejecutar el gate de carga sostenida previsto para el tamaño real de la sesión.
7. Guardar código/PIN fuera del chat general hasta el envío a participantes.
8. Confirmar que `scenario-private.sql` NO está publicado.
9. Congelar cambios de código 24–48 h antes del evento salvo corrección crítica.

### Mensaje para enviar un día antes

> Hola. Mañana tendremos **Causal Quest**. Antes de la sesión realiza una prueba técnica de menos de 3 minutos usando el enlace enviado. Usa el mismo computador con el que participarás. Recomendamos portátil o computador, no celular. Si obtienes **No apto**, envía una captura hoy para poder ayudarte antes de la sesión.

## 15 min antes

- Abrir videollamada y cuatro salas: **Fisher, Neyman, Rubin y Pearl**.
- Compartir sólo `wall.html` en sala principal.
- Mantener `facilitator.html` en una ventana no compartida.
- Mirar el número real de asistentes antes de explicar responsabilidades.
- Explicar: “Tenemos cuatro responsabilidades. Si un equipo queda con tres personas, Modelos cubrirá también Experimentos; si tiene cinco, la quinta persona será copiloto”.
- Explicar el mercado en máximo 60 segundos.

## Regla pedagógica de los poderes

Todos empiezan con **Pregunta Crítica**: “¿Qué tendría que ser cierto para que esta evidencia justifique la decisión?”. Una herramienta avanzada no se usa antes de ser enseñada.

- **R1:** contrato de decisión, predicción vs intervención, contrafactual y revisión inicial de riesgo.
- **R2:** confusión, DAG y comparabilidad.
- **R3:** asignación, RCT, ATE e incertidumbre. En equipos de tres, aquí 🦉 Modelos activa su segundo sombrero 🐢 Experimentos.
- **R4:** CATE/heterogeneidad y política bajo costo, capacidad y daño. 🦁 Estrategia utiliza también Policy Simulator.

## Cronograma recomendado · 120 min

| Min | Acción |
|---:|---|
| 0–6 | Apertura + medición inicial. Explica las 4 responsabilidades y la regla de equipos de 3/4/5. |
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
| 112–120 | Síntesis, cambio pre→post, ranking final y preguntas de cierre. |

El cierre conceptual final es intocable. Si una ronda se atrasa, reduce discusión del mercado o usa `+60 s`; no elimines el debrief.

## Las cuatro preguntas que deben recordar

1. **¿Qué intervención estoy evaluando y qué resultado quiero cambiar?**
2. **¿Qué habría ocurrido sin intervenir y por qué mi comparación es creíble?**
3. **¿La evidencia identifica un efecto o sólo una asociación/predicción?**
4. **¿El efecto es suficientemente cierto, valioso y seguro para convertirlo en política?**

## Secuencia por ronda

`PRESENTAR CONCEPTO → ABRIR LABORATORIO → COMPARTIR EVIDENCIAS → CERRAR → REVELAR → CIERRE DOCENTE → MICROCHECK → SIGUIENTE`

No se puede abrir laboratorio desde briefing sin pasar por la mini-clase.

## Cómo dirigir cada responsabilidad

### 🦁 Estrategia y Política

Al inicio fija población, intervención, comparador, outcome, horizonte, estimando y restricción. En R4 vuelve sobre ese contrato y usa Policy Simulator. Debe poder explicar por qué la política final respeta lo que el equipo dijo que era importante al comienzo.

### 🦉 Modelos

Distingue score de efecto. En R4 explora CATE. Si el equipo tiene tres personas, la plataforma le muestra además el módulo de Experimentos. Debe producir **dos piezas distinguibles**: qué estima Modelos y qué sostiene el diseño experimental.

### 🐈‍⬛ Causalidad

Formula contrafactual en R1 y usa DAG desde R2. Su función no es “dibujar bonito”: debe decir qué estructura hace defendible o engañosa la comparación y qué no conviene ajustar.

### 🐢 Experimentos

Pregunta por comparador desde el inicio y usa Experiment Designer desde R3. Si no existe una persona dedicada, la responsabilidad pasa a Modelos; no desaparece.

### 🦅 Copiloto de Estrategia

Sólo aparece cuando hay una quinta persona. Ayuda a desafiar costo, daño, capacidad y reversibilidad. **No tiene voto extra, poder de veto ni una quinta casilla necesaria para 4/4.**

## Regla de coherencia del war room

`4/4` responsabilidades cubiertas **no significa automáticamente que la decisión esté bien defendida**. La mesa calcula además chequeos deterministas entre las piezas compartidas.

Puede marcar, entre otros casos:

- contrato causal incompleto;
- DAG todavía no diagnosticado;
- outcome u horizonte del experimento distintos de los acordados por Estrategia;
- asignación no aleatoria que requiere una defensa adicional;
- política localmente inviable por capacidad, presupuesto o riesgo;
- política que viola la restricción operativa fijada por Estrategia.

Ante un estado rojo pregunta primero: **“¿qué dos piezas no están contando la misma historia?”**. La prioridad de lectura es:

`PREGUNTA → IDENTIFICACIÓN → ESTIMACIÓN → DISEÑO/INCERTIDUMBRE → POLÍTICA`

## Cómo leer la consola docente

- **Cobertura 4/4:** las cuatro responsabilidades produjeron evidencia. No significa automáticamente que la decisión sea correcta.
- **Cobertura 3/4 en un equipo de tres:** normalmente Modelos aún no ha compartido la evidencia de Experimentos; entra a esa sala y pregunta por el doble sombrero.
- **Bloqueo rojo en coherencia:** pide al equipo que encuentre la contradicción antes de explicar la respuesta.
- **+ copiloto:** existe apoyo extra, pero no cambia el denominador.

Nunca compares equipos por cantidad de integrantes o cantidad de texto.

## Llamada al Capítulo

El Game Master dirige y **no está a la venta**. Los otros facilitadores forman una bolsa transversal de expertos. La llamada dura 90 s. El experto puede:

- hacer una observación sobre el problema;
- hacer una pregunta socrática;
- aclarar conceptos ya enseñados.

No puede explicar un tema futuro, decir cuál opción seleccionar ni revelar información privada del simulador.

## Mercado justo

- Cada equipo tiene la misma bolsa, catálogo y precios base.
- Lo que compra Fisher no encarece ni agota lo que puede comprar Neyman, Rubin o Pearl.
- Sólo **Llamada al Capítulo** tiene cupos globales porque consume tiempo real de una persona.
- El mercado es opcional; seguir sin ayuda es una estrategia válida.

## Si alguien falta o se desconecta

### Antes de iniciar

No inventes un sustituto humano. Deja que la asignación automática produzca equipos de 3/4/5. Explica la regla de doble sombrero.

### Durante una ronda

Si desaparece 🐢 Experimentos y el equipo queda con tres responsabilidades humanas, indica a 🦉 Modelos que cubra el módulo experimental disponible. Si desaparece otro rol, el facilitador puede usar el fallback oral temporal, pero evita cambiar roles a mitad de una decisión salvo que la ausencia sea definitiva.

### Si quedan sólo 2 personas en un equipo

Eso ya no es la configuración objetivo. Redistribuye apoyo humano antes de continuar la siguiente ronda; no pretendas que una persona cubra tres instrumentos simultáneamente.

## Si falla backend

- Pausar si la consola responde.
- Si no responde, usar el fallback docente: proyectar resultados/tablas preparados y recoger decisiones por chat o Forms.
- Mantener las cuatro responsabilidades conceptuales aunque la interfaz falle.
- No inventar resultados en vivo.
