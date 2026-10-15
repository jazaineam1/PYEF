# Estado del coordinador · Copa V3 (actualizado 14-oct ~19:35 COT)

Run `run_1383b10217e0`. Ruta corta (clase vie 16-oct 10:00 COT). Plan: `PLAN_COPA_V3.md` §7.1.

## Enrutamiento de modelos (sustituye §5 por costo, decisión del usuario 14-oct)
- Codex: `--agent codex --model gpt-reserve --effort medium` (nunca heredar: el default era gpt-5.6-sol/ultra).
- Claude: Sonnet `claude-sonnet-5-5` medium para todo; Haiku para V1. **Sin Opus.** T4.1b con Sonnet high.
- Ola 1: T1.1 (HUD) pasa a Codex; T1.2 Sonnet medium; T1.3 y T1.4 Codex.
- Revisión cruzada solo de T1.4 (Sonnet medium). V1 una sola vez antes de G1.
- Tras cada worker-start, enviar la corrección de rama (las specs dicen `copa-v3/<id>`, imposible; usar `jazaineam1/copa-v3-<id>`).

## Tareas
| ID | task | dispatch activo | estado |
|---|---|---|---|
| T0.1 | task_c8aa0fc83771 | ctx_aacf254364ca (Sonnet medium) | en curso |
| T0.2 | task_579f6b91161f | ctx_a76e205cfd42 (gpt-reserve medium) | en curso |
| T0.3b | task_3e4c9baa975f | ctx_4858ea2770bd (gpt-reserve medium) | en curso; necesita `_secrets\copa-v3.env` |
| T1.1–T1.4 | task_9998115204c7, task_e439348ef350, task_ca54d9c64d3e, task_a65e9643079b | — | tras G0 |
| V1 | task_93afa3291703 | — | antes de G1 |
| T2.2b | task_912ff7c39231 | — | tras G1 |
| T4.1b | task_caecb917b4cf | — | tras T2.2b |
| Pospuestas | T2.1 task_d3d4d49c2d41, T2.3 task_a220d5dcaff7, T2.4 task_f33ebb57e440, T3.1 task_90d84453f70c, T3.2 task_3233090dfee2 | — | después de la clase |
| Canceladas | T0.3, T2.2, T4.1, T4.2 | — | sustituidas |

Dispatches detenidos por costo (no reutilizar): ctx_772dcbac3239, ctx_c7359e8a1c8d, ctx_1fd710102e5a.

## Gates pendientes
G0 (tras ola 0) · G1 (diseño) · G3 merge a main jue 19:00–21:30 · G2 ensayo tras merge · congelamiento jue 22:00.
