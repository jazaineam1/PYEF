# Experto IA del Juego · propuesta aislada

## Objetivo

Agregar una ayuda opcional comprable desde el Mercado de Recursos. El modelo responde **sólo sobre la partida actual y los conceptos ya desbloqueados**. No decide por el equipo, no revela ground truth futuro y no sustituye a los tres expertos humanos.

## Principio de aislamiento

La función que llama al modelo debe construir un paquete de contexto explícito y pequeño. El modelo **no recibe** acceso al repositorio, GitHub, Supabase como herramienta, navegación web, archivos, secretos, variables de entorno, SQL libre ni function calling.

Contexto permitido por consulta:

- código interno de sesión anonimizado;
- ronda y fase actual;
- rol del jugador;
- misión pública de la ronda;
- conceptos pedagógicos desbloqueados hasta esa ronda;
- estado público del equipo;
- recursos que ese equipo ya compró;
- pregunta del participante.

Contexto prohibido:

- ground truth de rondas futuras;
- respuestas correctas antes del reveal;
- decisiones de otros equipos no publicadas;
- tokens, claves o secretos;
- contenido del repositorio;
- tablas internas que no estén en la allowlist del contexto;
- datos personales de participantes.

## Desbloqueo por ronda

### Ronda 1 · Predicción vs causalidad

Puede explicar: propensity, outcome, intervención, contrafactual, uplift, diferencia entre “quién lo hará” y “quién cambia si intervengo”.

No puede explicar todavía la solución de confounding de R2, el diseño exacto de R3 ni la política óptima de R4.

### Ronda 2 · Confusión e identificación

Se añaden: DAG, confounder, mediator, collider, variables pretratamiento, overlap/positivity y comparación cruda vs ajustada.

### Ronda 3 · Experimentación

Se añaden: RCT, ATE, ITT, balance, power, MDE, horizonte, diferencia de medias e incertidumbre.

### Ronda 4 · Heterogeneidad y política

Se añaden: CATE, uplift por segmento, costo, capacidad, riesgo, fairness y reglas de tratamiento.

## Comportamiento

El Experto IA debe ser socrático. Prioridad de respuesta:

1. aclarar la pregunta;
2. nombrar el concepto permitido relevante;
3. hacer una pregunta guía;
4. ofrecer, como máximo, un mini-ejemplo distinto al caso activo;
5. nunca entregar la combinación exacta que gana la misión activa.

Si le preguntan por algo fuera del juego debe responder: `Sólo puedo ayudarte con Causal Quest y con los conceptos desbloqueados en esta ronda.`

Si le piden revelar una respuesta bloqueada: `Ese contenido todavía forma parte de la decisión de tu equipo. Puedo darte una pista conceptual, no la solución.`

## Límites sugeridos

- 2 consultas por equipo y ronda;
- pregunta máxima de 500 caracteres;
- respuesta máxima de 180 palabras;
- timeout de 8 s;
- una sola llamada al modelo por pregunta;
- sin conversación abierta infinita: cada respuesta usa un resumen corto de las consultas previas del equipo;
- costo del mercado independiente y configurable;
- límite global por partida para controlar gasto de API.

## Arquitectura

`Jugador → Edge Function ai-game-expert → Context Builder allowlist → API del modelo → Validator → Jugador`

El `Context Builder` obtiene exclusivamente datos de funciones RPC dedicadas como `cw_ai_game_context(token)`. El modelo nunca recibe credenciales de base de datos.

El `Validator` rechaza o sustituye respuestas que:

- mencionen secretos o infraestructura;
- pretendan haber leído el repositorio;
- revelen ground truth no desbloqueado;
- excedan longitud;
- respondan fuera de la temática.

## Auditoría

Guardar únicamente:

- game_id;
- team_id;
- round;
- categoría de la pregunta;
- timestamp;
- tokens/costo técnico;
- resultado `answered/refused/error`.

El texto completo de la pregunta/respuesta puede evitarse o tener retención corta según la política interna.

## Estado de implementación

La V4 muestra la tarjeta **Experto IA del Juego · bloqueado** en el mercado para comunicar la posibilidad, pero no llama todavía a ningún proveedor externo. Activarlo requiere elegir proveedor/modelo, guardar su clave sólo en secretos server-side y definir el presupuesto máximo por partida.
