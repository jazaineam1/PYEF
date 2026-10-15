# Estado del coordinador · Copa V3 (actualizado 14-oct ~20:20 COT)

Run `run_1383b10217e0`. Ruta corta (clase vie 16-oct 10:00 COT). Plan: `PLAN_COPA_V3.md` §7.1. **G0 aprobado.**

## Enrutamiento de modelos (sustituye §5 por costo, decisión del usuario 14-oct)
- Codex: `--agent codex --model gpt-reserve --effort medium` (nunca heredar; default global ya cambiado a gpt-reserve/medium).
- Claude: Sonnet `claude-sonnet-5-5` medium; Haiku para V1. **Sin Opus.** T4.1b con Sonnet high.
- Revisión cruzada solo de T1.4 (Sonnet medium). V1 una sola vez antes de G1.
- Tras cada worker-start: enviar el mensaje de rama/tests/limpieza/ahorro (las specs antiguas dicen `copa-v3/<id>`, imposible).
- Tras cada merge: `orca worktree rm`, borrar rama local y remota, apagar servidores huérfanos.
- Máximo 4 trabajadores vivos. Sesiones de chat estructuradas no se reutilizan con `--terminal`: liberar y lanzar nuevo.

## Integrado en copa-v3
PR #39 (T0.2 arnés visual), PR #40 (T0.1 modular + DeanShell). Ramas y worktrees borrados.

## En curso
| ID | task | dispatch | agente |
|---|---|---|---|
| T0.2-fix | task_a206842ea767 | ctx_3fcff38f67e6 | Codex gpt-reserve |
| T1.4 Docente | task_a65e9643079b | ctx_7fe92d0e9361 | Codex gpt-reserve |
| T1.2 Jugador | task_e439348ef350 | ctx_93ff5f9426a7 | Sonnet medium |
| REV-0 revisión PR 39/40/41 | task_93313fb18108 | ctx_a79e2aaaaab8 | Codex gpt-reserve (worktree current, solo lectura) |

## En cola
- T1.3 Wall (task_ca54d9c64d3e) y T1.1 HUD (task_9998115204c7), ambos Codex, cuando se liberen T0.2-fix y REV-0.
- PR #41 (T0.3b carga, borrador): faltan corridas reales con 1 y 5 usuarios; esperan `_secrets\copa-v3.env`. Worktree copa-v3-t03b se conserva.
- V1 (task_93afa3291703) antes de G1. T2.2b (task_912ff7c39231) tras G1. T4.1b (task_caecb917b4cf) tras T2.2b.
- Pospuestas para después de la clase: T2.1, T2.3, T2.4, T3.1, T3.2. Canceladas: T0.3, T2.2, T4.1, T4.2.

## Gates pendientes
G1 (diseño, jue ~13:00) · G3 merge a main jue 19:00–21:30 · G2 ensayo tras merge · congelamiento jue 22:00.
