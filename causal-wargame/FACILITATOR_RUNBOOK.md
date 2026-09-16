# Causal Quest · Runbook del facilitador · 120 min

## Principio operativo

El juego usa **4 especialidades núcleo por equipo** y adapta el **número de equipos** a la asistencia. El objetivo no es sostener una cantidad fija de salas: es mantener equipos de **3–4 personas** sin inventar un quinto rol.

1. 🦁 **Líder de Decisión y Política** — define el contrato causal, administra recursos y en R4 integra evidencia, costo, capacidad y riesgo en una política.
2. 🦉 **Líder de Modelos** — separa predicción de efecto incremental, revisa soporte y explora CATE/uplift.
3. 🐈‍⬛ **Analista Causal** — defiende identificación, ajuste y estructura causal.
4. 🐢 **Líder de Experimentos** — diseña comparación, incertidumbre y precisión útil.

Política/Riesgo **no es un quinto rol**. Está fusionado con 🦁. El identificador histórico `risk` sólo existe para compatibilidad con sesiones antiguas.

## Asistencia adaptativa

Mientras la lista está abierta, equipo y rol son **provisionales**. Cada nueva llegada puede provocar un rebalanceo. Al iniciar la primera mini-clase el servidor realiza un último rebalanceo y **congela la lista**; desde ese momento sólo se permiten reingresos conocidos.

La regla es `equipos = ceil(humanos / 4)`, con un máximo operativo de 7 equipos / 28 humanos. En el rango habitual:

| Humanos | Equipos | Distribución final |
|---:|---:|---|
| 15 | 4 | 4–4–4–3 |
| **16** | **4** | **4–4–4–4** |
| **17** | **5** | **4–4–3–3–3** |
| 18 | 5 | 4–4–4–3–3 |
| 19 | 5 | 4–4–4–4–3 |
| 20 | 5 | 4–4–4–4–4 |
| 21 | 6 | 4–4–4–3–3–3 |
| 24 | 6 | 4–4–4–4–4–4 |
| 25 | 7 | 4–4–4–4–3–3–3 |
| **28** | **7** | **4–4–4–4–4–4–4** |

La asignación se hace por **olas de rol**. Primero se distribuye 🦁 a todos los equipos activos, luego 🦉, después 🐈‍⬛ y por último 🐢. Por eso, cuando un grupo queda con tres personas, la única especialidad ausente es Experimentos.

Con tres personas, 🦉 Modelos cubre temporalmente 🐢 Experimentos mediante un módulo separado que produce evidencia propia. La Mesa puede llegar a 4/4 sin fingir una persona adicional.

Con menos de tres integrantes en algún equipo, la consola lo advierte. No uses bots para “rellenar” aprendizaje humano; reestructura la dinámica o fusiona grupos antes de comenzar.

### Qué hacer justo antes de congelar la lista

1. Comprueba `humanos` y `online` en la consola.
2. Si alguien entró y se fue, puedes usar **Retirar ausentes >3 min** antes de iniciar.
3. Usa **Recalcular equipos ahora** si quieres ver explícitamente la distribución actual.
4. Informa al grupo que equipo/rol todavía puede cambiar mientras la lista está abierta.
5. Pulsa **Presentar concepto y poderes** sólo cuando la asistencia esté razonablemente estabilizada. Ese paso congela composición y roles.

## Seguridad de ingreso

- El navegador conserva una clave aleatoria de identidad independiente del token de sesión.
- Mientras la lista está abierta, volver desde el mismo navegador recupera el mismo `player_id`; el equipo/rol puede haber cambiado si el sistema rebalanceó la clase.
- Después de congelar la lista, cerrar/reabrir o volver a entrar desde ese navegador recupera **exactamente el mismo jugador, equipo y rol**.
- El logout borra el token, no la identidad local.
- El mismo nombre desde otro dispositivo se rechaza para impedir un segundo asiento accidental. Si hay homónimos, usa nombre y apellido.
- Una vez congelada la lista, no entran jugadores nuevos: sólo reingresan participantes ya registrados.
- Máximo soportado: **28 humanos**.
- Un bot de ensayo nunca debe desplazar a un humano real.

## 24 h antes

1. Crear una partida nueva con código aleatorio.
2. Enviar la prueba técnica.
3. Pedir que cada persona use el mismo computador de la sesión.
4. Revisar resultados **No apto**.
5. Probar `play.html`, `facilitator.html` y `wall.html`.
6. Ejecutar el gate de carga sostenida. Para capacidad máxima usa `CW_USERS=28`.
7. No publicar el PIN ni la verdad privada del simulador.
8. Congelar cambios no críticos 24–48 h antes.

## 15 min antes

- No abras un número fijo de salas hasta conocer la asistencia. La consola indica cuántos equipos activos necesita la sesión.
- Nombres disponibles hasta 7 salas: **Fisher, Neyman, Rubin, Pearl, Robins, Imbens y Rosenbaum**.
- Compartir sólo `wall.html`.
- Mantener `facilitator.html` privado.
- Revisar el plan automático de asistencia en la consola.
- Explicar: “son cuatro instrumentos; 4/4 evidencia no garantiza causalidad correcta”.
- Explicar el mercado en máximo 60 s.

## Cronograma · 120 min

| Min | Acción |
|---:|---|
| 0–6 | Apertura + pretest + explicar 4 especialidades. |
| 6–15 | Mini-clase R1. |
| 15–24 | Laboratorio R1. |
| 24–30 | Reveal + discusión + microcheck. |
| 30–39 | Mini-clase R2. |
| 39–48 | Laboratorio R2. |
| 48–54 | Reveal + discusión + microcheck. |
| 54–59 | Pausa. |
| 59–68 | Mini-clase R3. |
| 68–77 | Laboratorio R3. |
| 77–83 | Reveal + discusión + microcheck. |
| 83–92 | Mini-clase R4. |
| 92–101 | Laboratorio R4. |
| 101–107 | Reveal + discusión. |
| 107–112 | Post transferencia. |
| 112–120 | Síntesis + ranking + cierre. |

Si falta tiempo, recorta mercado o extensiones. No elimines reveal/debrief ni transferencia final.

## Cómo dirigir cada rol

### 🦁 Decisión y Política

R1–R3 fija población, tratamiento, comparador, outcome, horizonte, estimando y restricción. En R4 conserva ese contrato y abre el Simulador de Política para integrar CATE, IC, valor, costo, capacidad y riesgo.

Pregunta: **“¿La política sigue respondiendo exactamente la pregunta que definiste al principio?”**

### 🦉 Modelos

Separa score de uplift, revisa overlap y en R4 compara T-Learner, DR-Learner y CausalForestDML. Debe ejecutar el stress test placebo.

Pregunta: **“Si tres estimadores coinciden, ¿qué supuesto causal sigue sin estar demostrado?”**

### 🐈‍⬛ Causalidad

Formula contrafactual y desde R2 usa DAG para confusores, mediadores y colliders.

Pregunta: **“¿Esa variable ocurre antes o después del tratamiento y qué ruta abre o cierra?”**

### 🐢 Experimentos

Desde R3 manipula asignación, N, outcome y horizonte; interpreta efecto, IC, balance y MDE.

Pregunta: **“¿Qué mejora con más N y qué sesgo no desaparece?”**

## Mesa de Evidencia

La lectura es:

`🦁 pregunta → 🐈‍⬛ identificación → 🦉 estimación → 🐢 contraste → 🦁 política e integración`

Cobertura **4/4** no garantiza coherencia. El motor puede bloquear por contrato incompleto, DAG no diagnosticado, resultado/horizonte inconsistentes, asignación sesgada, precisión insuficiente, placebo fallido o política incompatible con la restricción.

## Mercado

- Todos los equipos reciben la misma bolsa y catálogo, independientemente de si hay 4, 5, 6 o 7 equipos.
- Pistas/Junior/Senior son inventario **por equipo**: otro equipo no los encarece ni los agota.
- Sólo Llamada al Capítulo depende de disponibilidad humana global.
- 🦁 confirma la compra; todo el equipo puede recomendar.

## Si alguien se desconecta

No crees otro participante. Pídele volver con el **mismo navegador/dispositivo** y el mismo código.

- Antes del cierre de lista: recupera su identidad, pero el equipo/rol mostrado puede cambiar por rebalanceo.
- Después del cierre de lista: recupera exactamente equipo y rol.
- Si intenta duplicarse desde otro dispositivo con el mismo nombre, el servidor rechaza el segundo asiento.

Si una persona no regresa **antes de iniciar**, retírala desde la consola y rebalancea. Si se desconecta **durante la partida**, no cambies la topología en caliente; espera el reingreso o trabaja con la ausencia explícita. Si un equipo queda de tres y falta Experimentos, usa el doble sombrero Modelos→Experimentos. Si quedan dos, intervén pedagógicamente; no finjas evidencia automática.

## Ensayo con bots

`Completar ensayo con bots` es sólo un modo técnico. Al activarlo:

- completa la matriz de la sesión;
- congela la lista de ensayo;
- impide que una llegada humana tardía reescriba silenciosamente los puestos;
- permite probar flujo, wall, mercado y decisiones automáticas.

Para volver a una clase humana real, usa **Reset** y permite que los humanos entren de nuevo.

## Si falla backend

Pausa. Si no recupera, usa resultados/tablas de respaldo y recoge decisiones por chat/Forms. Mantén la secuencia conceptual y no inventes resultados en vivo.
