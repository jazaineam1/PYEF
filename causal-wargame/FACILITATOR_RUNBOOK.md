# Causal Quest · Runbook del facilitador · 120 min

## Principio operativo

El juego tiene **4 equipos** y **5 especialidades analíticas núcleo**. La configuración objetivo es 20 participantes: cinco personas por equipo.

1. 🦁 **Líder de Decisión** — define la pregunta causal que el equipo debe responder.
2. 🦉 **Líder de Modelos** — separa predicción de efecto incremental.
3. 🐈‍⬛ **Analista Causal** — defiende identificación, ajuste y estructura.
4. 🐢 **Líder de Experimentos** — diseña comparación e incertidumbre.
5. 🦅 **Política y Riesgo** — convierte evidencia en una política bajo costo, capacidad y riesgo.

Todos empiezan con el mismo poder base, **Pregunta Crítica**. Ningún equipo recibe mejores poderes iniciales que otro.

### Composición según asistencia

| Personas en el equipo | Funcionamiento |
|---:|---|
| 3 | Puede continuar como contingencia. 🦉 Modelos cubre también 🐢 Experimentos; otras especialidades ausentes quedan visibles como evidencia faltante. |
| 4 | Una especialidad puede quedar sin dueño. La sesión no se bloquea, pero la mesa muestra la pieza ausente. |
| 5 | Configuración objetivo: una persona por cada especialidad. |

La consola docente muestra **Cobertura 0–5**. No otorgues crédito automático por una ausencia. La plataforma distingue entre una persona y una responsabilidad realmente cubierta.

## 24 h antes

1. Crear una **partida nueva con código aleatorio** desde `facilitator.html`; no reutilizar un código público permanente.
2. Enviar la prueba técnica a los participantes confirmados.
3. Pedir que registren el resultado con su nombre y el mismo equipo que usarán en la sesión.
4. Revisar Windows/macOS, navegador y cualquier resultado **No apto**.
5. Probar `play.html`, `facilitator.html` y `wall.html` desde un equipo similar al corporativo.
6. Ejecutar el gate de carga sostenida previsto para 20 usuarios; antes del evento usar la variante de 15 minutos.
7. Guardar código/PIN fuera del chat general hasta el envío a participantes.
8. Confirmar que la verdad privada del simulador no está publicada.
9. Congelar cambios de código 24–48 h antes del evento salvo corrección crítica.

### Mensaje para enviar un día antes

> Hola. Mañana tendremos **Causal Quest**. Antes de la sesión realiza una prueba técnica de menos de 3 minutos usando el enlace enviado. Usa el mismo computador con el que participarás. Recomendamos portátil o computador, no celular. Si obtienes **No apto**, envía una captura hoy para poder ayudarte antes de la sesión.

## 15 min antes

- Abrir videollamada y cuatro salas: **Fisher, Neyman, Rubin y Pearl**.
- Compartir sólo `wall.html` en sala principal.
- Mantener `facilitator.html` en una ventana no compartida.
- Confirmar la distribución de los cinco especialistas por equipo.
- Explicar en una frase: “Cada herramienta produce una pieza que los otros necesitan; 5/5 evidencias no significa automáticamente causalidad correcta”.
- Explicar el mercado en máximo 60 segundos.

## Regla pedagógica de los poderes

Una herramienta técnica no se usa antes de que su concepto haya sido presentado.

- **R1:** pregunta causal, predicción vs intervención, contrafactual y revisión inicial de riesgo.
- **R2:** confusión, grafo causal y comparabilidad. Puntaje de propensión/IPW sólo como extensión o panorama.
- **R3:** asignación, tratamiento/control, ATE e incertidumbre. Potencia/MDE sólo si hay tiempo.
- **R4:** CATE/heterogeneidad y política bajo incertidumbre, costo, capacidad y daño.

## Cronograma recomendado · 120 min

| Min | Acción |
|---:|---|
| 0–6 | Apertura + medición inicial. Explica los 5 especialistas y la regla “una pieza no basta”. |
| 6–15 | Mini-clase R1: predicción, intervención y contrafactual. |
| 15–24 | Laboratorio R1 en salas. |
| 24–30 | Revelación + discusión + microcheck R1. |
| 30–39 | Mini-clase R2: confusión, grafo causal y comparabilidad. |
| 39–48 | Laboratorio R2. |
| 48–54 | Revelación + discusión + microcheck R2. |
| 54–59 | Pausa. |
| 59–68 | Mini-clase R3: aleatorización, efecto e incertidumbre. |
| 68–77 | Laboratorio R3. |
| 77–83 | Revelación + discusión + microcheck R3. |
| 83–92 | Mini-clase R4: heterogeneidad, incertidumbre, costo, capacidad y riesgo. |
| 92–101 | Laboratorio R4. |
| 101–107 | Revelación + discusión R4. |
| 107–112 | Evaluación final de transferencia: 4 casos nuevos. |
| 112–120 | Síntesis, cambio pre→post, ranking final y preguntas de cierre. |

El cierre conceptual final es intocable. Si una ronda se atrasa, recorta mercado, discusión secundaria o extensiones técnicas; **no elimines la discusión posterior a la revelación**.

## Las cinco preguntas que deben recordar

1. **¿Qué intervención, comparador, población y resultado estamos evaluando?**
2. **¿Qué habría ocurrido sin intervenir y por qué la comparación es defendible?**
3. **¿Estamos viendo predicción/asociación o un efecto identificado?**
4. **¿Qué tan precisa es la evidencia y qué diseño la sostiene?**
5. **¿Dónde conviene intervenir una vez incluidos costo, capacidad, incertidumbre y riesgo?**

## Secuencia por ronda

`PRESENTAR CONCEPTO → EXPLORAR HERRAMIENTA → PRODUCIR EVIDENCIA → COMPARTIR → INTEGRAR → BLOQUEAR → REVELAR → DISCUTIR`

No abras laboratorio desde briefing sin pasar por la mini-clase.

## Cómo dirigir cada especialidad

### 🦁 Líder de Decisión · Constructor de Pregunta Causal

Debe cerrar población, intervención, comparador, resultado, horizonte, estimando y restricción. **No opera el Simulador de Política.** En R4 recibe la propuesta de 🦅 Política y Riesgo y verifica que realmente responda el contrato inicial.

Pregunta docente útil: “¿Qué parte de la pregunta cambiaría si cambia la política recomendada?”.

### 🦉 Líder de Modelos · Explorador de Impacto (Uplift/CATE)

R1 separa puntaje predictivo de cambio incremental. R2 compara una asociación cruda con evidencia ajustada sin vender IPW/regresión como magia. R4 explora 24 perfiles con resultados precomputados fuera de la clase de **T-Learner, DR-Learner y bosque causal (CausalForestDML)**.

Pregunta docente útil: “Si tres estimadores coinciden, ¿qué supuesto causal sigue sin estar probado?”.

### 🐈‍⬛ Analista Causal · Laboratorio de Grafo Causal

R1 formula contrafactual. Desde R2 construye y diagnostica grafos causales. Debe identificar rutas de puerta trasera, mediadores y colisionadores y defender qué ajustar y qué no.

Pregunta docente útil: “¿Esa variable ocurre antes o después del tratamiento y qué camino abre o cierra?”.

### 🐢 Líder de Experimentos · Diseñador de Experimentos

Desde R3 manipula asignación, N, resultado y horizonte; observa tratamiento/control, efecto o diferencia observada, IC95% y balance. Debe descubrir que más N estrecha incertidumbre, pero **no arregla sesgo de selección**.

Pregunta docente útil: “¿Qué cambia si duplicamos N y qué no cambia?”.

### 🦅 Política y Riesgo · Simulador de Política

En R1–R3 audita desperdicio, daño y reversibilidad. En R4 manipula capacidad, presupuesto, tolerancia de riesgo y asignación por segmento usando efecto por perfil (CATE) e IC95%. La herramienta calcula factibilidad y valor esperado, pero no decide automáticamente.

Pregunta docente útil: “¿La política de mayor valor esperado sigue siendo la política correcta bajo la restricción acordada?”.

## Regla de coherencia de la mesa de decisión

`5/5` especialidades cubiertas **no significa que la decisión esté bien defendida**. La mesa ejecuta chequeos deterministas entre las piezas.

Puede marcar:

- contrato causal incompleto;
- grafo causal todavía no diagnosticado;
- estimador heterogéneo sin identificación defendible;
- resultado/horizonte del experimento distintos de los acordados por Decisión;
- asignación no aleatoria que exige defensa adicional;
- política inviable por capacidad, presupuesto o tolerancia de riesgo;
- política que viola la restricción fijada por Líder de Decisión.

Ante un estado rojo pregunta: **“¿qué dos piezas no están contando la misma historia?”**.

Orden de lectura:

`PREGUNTA → IDENTIFICACIÓN → ESTIMACIÓN → DISEÑO/INCERTIDUMBRE → POLÍTICA → DECISIÓN`

## Cómo leer la consola docente

- **Cobertura 5/5:** las cinco especialidades produjeron evidencia; aún debes revisar coherencia.
- **Cobertura 4/5:** hay una pieza ausente; entra a la sala y pregunta qué no puede afirmarse sin ella.
- **Doble sombrero Modelos→Experimentos:** sólo cuenta Experimentos cuando se completa su módulo separado.
- **Bloqueo rojo:** existe una contradicción conceptual u operativa que conviene resolver antes de explicar la respuesta.

Nunca compares equipos por cantidad de texto ni por velocidad.

## Llamada al Capítulo

El Game Master dirige y **no está a la venta**. Los otros facilitadores forman una bolsa transversal de expertos que conocen causalidad, experimentación y decisión. La llamada dura 90 s.

El experto puede:

- hacer una observación;
- hacer una pregunta socrática;
- aclarar conceptos ya enseñados.

No puede explicar un tema futuro, decir cuál opción seleccionar ni revelar información privada del simulador.

La disponibilidad se configura por ronda. Con tres cupos habilitados, el precio global por demanda es **20 → 26 → 34** créditos para la primera, segunda y tercera llamada de esa ronda. La cuarta solicitud se rechaza porque ya no queda atención humana disponible.

## Mercado justo

- Cada equipo tiene la misma bolsa, catálogo y precios base.
- Pistas, herramientas, Junior y Senior se contabilizan **por equipo**: lo que compra Fisher no los encarece ni los agota para Neyman, Rubin o Pearl.
- Sólo **Llamada al Capítulo** tiene cupos y precio por demanda globales porque consume disponibilidad humana real.
- 🦁 Líder de Decisión es quien confirma la compra, pero la elección del recurso se discute con el equipo.
- El mercado es opcional; seguir sin ayuda es una estrategia válida.

## Si alguien falta o se desconecta

No bloquees la sesión esperando 5/5. Mantén visible la evidencia faltante.

- Si falta 🐢 Experimentos, 🦉 Modelos puede cubrir su módulo separado cuando corresponda.
- Si falta otra especialidad, el equipo continúa con la limitación explícita; el facilitador puede hacer una pregunta de respaldo, pero no inventa evidencia ni reasigna puntos.
- Si quedan sólo 2 personas, redistribuye apoyo humano antes de la siguiente ronda; no pretendas que una persona opere tres instrumentos simultáneamente.

## Si falla backend

- Pausar si la consola responde.
- Si no responde, usar el respaldo docente: proyectar resultados/tablas preparados y recoger decisiones por chat o Forms.
- Mantener las cinco preguntas conceptuales aunque la interfaz falle.
- No inventar resultados en vivo.
