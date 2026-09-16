# Experto IA del Juego · extensión opcional aislada

## Decisión de producto

El Experto IA **no forma parte del mercado base de la sesión de 120 minutos**. El mercado principal se mantiene en cinco recursos comprensibles. Esta extensión sólo debe activarse mediante una bandera de configuración después de validar el flujo humano con 20 participantes.

Su objetivo sería ofrecer una ayuda opcional que responda **únicamente sobre la partida actual y los conceptos ya desbloqueados**. No decide por el equipo, no revela información futura y no sustituye a los expertos humanos.

## Principio de aislamiento

La función que llame al modelo debe construir un paquete de contexto explícito, pequeño y permitido. El modelo **no recibe** acceso al repositorio, GitHub, Supabase como herramienta, navegación web, archivos, secretos, variables de entorno, SQL libre ni llamadas a funciones externas.

Contexto permitido por consulta:

- identificador interno de sesión anonimizado;
- ronda y fase actual;
- rol del jugador;
- misión pública de la ronda;
- conceptos pedagógicos desbloqueados hasta esa ronda;
- estado público del equipo;
- recursos que ese equipo ya compró;
- pregunta del participante.

Contexto prohibido:

- verdad del simulador de rondas futuras;
- respuestas correctas antes de la revelación;
- decisiones de otros equipos no publicadas;
- tokens, claves o secretos;
- contenido del repositorio;
- tablas internas que no estén en la lista permitida;
- datos personales de participantes.

## Desbloqueo por ronda

### Ronda 1 · Predicción vs causalidad

Puede explicar: probabilidad de recibir una intervención, resultado, intervención, contrafactual, impacto incremental y la diferencia entre “quién probablemente lo hará” y “quién cambia si intervengo”.

No puede adelantar la solución de confusión de R2, el diseño exacto de R3 ni la política de R4.

### Ronda 2 · Confusión e identificación

Se añaden: grafo causal (DAG), confusor, mediador, colisionador, variables previas al tratamiento, solapamiento/positividad y comparación cruda vs ajustada.

### Ronda 3 · Experimentación

Se añaden: experimento aleatorio (RCT), efecto promedio (ATE), intención de tratar (ITT), balance, potencia, efecto mínimo detectable (MDE), horizonte, diferencia de medias e incertidumbre.

### Ronda 4 · Heterogeneidad y política

Se añaden: efecto por perfil (CATE), impacto incremental por segmento, costo, capacidad, riesgo, equidad y reglas de tratamiento.

## Comportamiento

El Experto IA debe ser socrático. Prioridad de respuesta:

1. aclarar la pregunta;
2. nombrar el concepto permitido relevante;
3. hacer una pregunta guía;
4. ofrecer, como máximo, un mini-ejemplo distinto al caso activo;
5. nunca entregar la combinación exacta que resuelve la misión activa.

Si le preguntan por algo fuera del juego debe responder: `Sólo puedo ayudarte con Causal Quest y con los conceptos desbloqueados en esta ronda.`

Si le piden revelar una respuesta bloqueada: `Ese contenido todavía forma parte de la decisión de tu equipo. Puedo darte una pista conceptual, no la solución.`

## Límites sugeridos

- 2 consultas por equipo y ronda;
- pregunta máxima de 500 caracteres;
- respuesta máxima de 180 palabras;
- tiempo máximo de respuesta de 8 s;
- una sola llamada al modelo por pregunta;
- sin conversación abierta infinita: cada respuesta usa un resumen corto de las consultas previas del equipo;
- costo de mercado independiente y configurable;
- límite global de gasto de API por partida.

## Arquitectura propuesta

`Jugador → función ai-game-expert → constructor de contexto permitido → API del modelo → validador → Jugador`

El constructor de contexto obtiene exclusivamente datos de una RPC dedicada como `cw_ai_game_context(token)`. El modelo nunca recibe credenciales de base de datos.

El validador rechaza o sustituye respuestas que:

- mencionen secretos o infraestructura;
- pretendan haber leído el repositorio;
- revelen información no desbloqueada;
- excedan longitud;
- respondan fuera de la temática.

## Auditoría mínima

Guardar únicamente:

- game_id;
- team_id;
- ronda;
- categoría de la pregunta;
- fecha/hora;
- tokens/costo técnico;
- resultado `answered/refused/error`.

El texto completo de pregunta y respuesta debería evitarse o tener una retención corta según la política interna.

## Criterios antes de activarlo

1. Flujo humano de 20 participantes validado y estable.
2. Proveedor/modelo elegido y clave guardada sólo como secreto del servidor.
3. Presupuesto máximo por partida definido.
4. Pruebas de fuga de información futura y de instrucciones fuera del juego.
5. Prueba de latencia y fallback cuando la API del modelo no responde.
6. La UI debe poder ocultarlo por completo sin afectar el mercado ni la puntuación.

## Estado actual

**Diseñado, no activo y no visible en el mercado base.** No existe una llamada a un proveedor externo desde la partida. Esta separación es intencional para proteger la experiencia de 120 minutos y evitar introducir costo, latencia y una nueva fuente de respuestas antes de validar la dinámica principal.
