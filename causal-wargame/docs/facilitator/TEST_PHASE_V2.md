# Fase de prueba V2 · DOS FUTUROS

## Objetivo

No basta con verificar que la web cargue. La V2 debe demostrar simultáneamente:

1. que el capacitador no puede saltarse la mini-clase;
2. que cada rol recibe una herramienta útil y una pieza distinta de información;
3. que las decisiones siguen siendo deterministas;
4. que reveal/debrief/microcheck funcionan en orden;
5. que recarga/red corporativa no destruyen el estado;
6. que 20 participantes y tráfico concurrente siguen siendo soportados.

---

## Gate A · Build y seguridad

**PASS si:**

- `npm run test` pasa;
- build demo pasa;
- build secure pasa;
- marcador de ground truth demo no aparece en `dist` secure;
- `scenario-private.sql` no está versionado;
- play/facilitator/wall importan las variantes Learning en build secure.

**FAIL si:** cualquier `p0/p1` privado del escenario vivo queda disponible antes del reveal.

---

## Gate B · Estado pedagógico

Partida limpia en `lobby`.

1. Intentar `open` directamente → **debe fallar**.
2. `lesson` → estado `lesson`.
3. participante ve mini-clase y nombre de herramienta.
4. `open` → estado `round`.
5. cerrar → `closed`.
6. reveal → `reveal`.
7. debrief → `teaching`.
8. microcheck → `microcheck`.
9. next → `briefing` de la siguiente ronda.

Repetir 4 veces.

**PASS si:** no existe camino normal `briefing → round` sin `lesson`.

---

## Gate C · Roles y herramientas

Crear un equipo QA de cinco personas y comprobar:

| Rol | Herramienta | Evidencia mínima |
|---|---|---|
| Decision Lead | Decision Canvas | población + tratamiento + outcome + horizonte |
| Model Lead | Model Explorer | distingue propensity de uplift |
| Causal Analyst | DAG Lab | identifica variable previa que afecta T/Y |
| Experiment Lead | Experiment Lab | calcula diferencia e IC aproximado |
| Policy & Risk Lead | Policy Simulator | calcula outcomes incrementales y valor neto |

**PASS si:** cada rol puede producir un hallazgo distinto y útil para la decisión.

**FAIL si:** una herramienta sólo repite texto que ya ve todo el equipo.

---

## Gate D · Decisiones deterministas

### R1

- exactamente 10 clientes;
- sin duplicados;
- score por impacto usa ground truth server-side.

### R2

- recomendación cerrada;
- confusor cerrado;
- razón cerrada;
- sin textarea puntuable.

### R3

- asignación cerrada;
- outcome cerrado;
- horizonte cerrado.

### R4

- cinco segmentos exactamente una vez entre tratar/no tratar/más evidencia.

**PASS si:** dos ejecuciones con las mismas decisiones producen el mismo score.

---

## Gate E · Irreversibilidad e idempotencia

1. enviar una decisión;
2. repetir exactamente el mismo request con el mismo `idempotency_key` → debe ser idempotente;
3. enviar otra decisión con otra llave → debe fallar;
4. recargar navegador → decisión sigue bloqueada.

---

## Gate F · Recuperación

Durante una ronda:

- F5;
- cerrar/abrir pestaña;
- perder red 20–30 s;
- pausar y recargar;
- +60 s;
- reanudar.

**PASS si:** identidad, rol, equipo, ronda y decisión bloqueada se recuperan desde servidor.

---

## Gate G · Carga

### Escenario real

20 jugadores + facilitador + wall.

### Burst

50 requests alternando health/leaderboard.

Objetivo operativo:

- 0 decisiones perdidas;
- 0 duplicados;
- 0 leaks;
- p95 < 5 s desde runner remoto;
- UI continúa funcional durante polling.

---

## Gate H · Prueba pedagógica con 5 humanos

Después de cada mini-clase, pedir a cada rol una frase de salida:

- Decision: “La decisión que estamos soportando es…”
- Model: “El score no responde…”
- Causal: “La relación que puede sesgar es…”
- Experiment: “La comparación defendible sería…”
- Policy: “La intervención vale/no vale cuando…”

No puntuar la calidad de la redacción. Sólo verificar si la herramienta produjo el concepto esperado.

---

## Gate I · Cronometría

Objetivo de ensayo de 120 min:

- 0–12: apertura + lección 1;
- 12–27: lab 1 + reveal;
- 27–48: lección/lab 2;
- 48–58: pausa/recap;
- 58–82: lección/lab 3;
- 82–105: lección/lab 4;
- 105–116: reto integrador;
- 116–120: cierre.

Si un equipo termina una decisión en 3 minutos, el tiempo restante se usa para comparar hallazgos de herramientas, no para esperar en silencio.

---

## Automatización

`scripts/learning_flow_smoke.mjs` debe recorrer:

- 1 humano QA;
- 19 bots;
- 4 mini-clases;
- 4 laboratorios;
- 4 decisiones humanas;
- 4 reveals;
- 4 debriefs;
- 4 microchecks;
- final `finished`;
- reset de limpieza.

Este script es el gate de CI de la V2.

---

## Go / No-Go

**GO** sólo si pasan A–G y un ensayo humano pasa H sin confusión operativa.

**NO-GO** si ocurre cualquiera:

- se puede abrir laboratorio sin mini-clase;
- un rol no tiene herramienta funcional;
- el textarea vuelve a afectar score;
- un segundo submit cambia la decisión;
- reveal expone información antes de cerrar;
- F5 pierde sesión;
- scoring cambia entre ejecuciones idénticas.
