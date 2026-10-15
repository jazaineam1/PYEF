# Estado del coordinador · Copa V3 (actualizado 14-oct ~21:05 COT)

Run `run_1383b10217e0`. Ruta corta (clase vie 16-oct 10:00 COT). Plan: `PLAN_COPA_V3.md` §7.1. **G0 aprobado.**
Coordinador actual: Gemini 3.8 Flash (High) en workspace `seabiscuit` (`jazaineam1/seabiscuit`).

## Enrutamiento de modelos y orquestación
- Coordinador: Gemini 3.8 Flash (High), toma control de las tareas y consolidación.
- Codex / Claude: Subagentes y workers puntuales según necesidad.
- Limpieza tras cada merge: liberar dispatch, remover worktree y limpiar ramas fusionadas.

## Integrado en copa-v3 / seabiscuit
- PR #39: T0.2 arnés visual Playwright con backend simulado.
- PR #40: T0.1 Copa modular con DeanShell y contrato data-dean-*.
- PR #43: T0.2-fix contrato visual sin huecos y resumen en la CI.
- PR #45: T1.1 mini-wall DeanHud estilo Halo 2.
- PR #42: T1.4 compactar consola docente y mantener guion visible.
- PR #44: T1.3 Wall 16:9 en pantalla única.
- T1.2: Jugador en pantalla única (Exam portal CTA, panel lateral de evidencia, tabs y responsive 100dvh).

## En curso
| ID | task | estado | responsable |
|---|---|---|---|
| T1.2 Jugador | task_e439348ef350 | Completado y verificado en `seabiscuit` | Gemini 3.8 |
| V1 Matriz visual | task_93afa3291703 | Listo para ejecución | Coordinador |

## En cola
- PR #41 (T0.3b carga, borrador): arnés HTTP de carga contra la partida de QA.
- Gate G1 (aprobación humana del diseño con matriz visual) antes de la ola 2 (T2.2b).
- T2.2b (task_912ff7c39231) tras G1. T4.1b (task_caecb917b4cf) tras T2.2b.
- Pospuestas para después de la clase: T2.1, T2.3, T2.4, T3.1, T3.2. Canceladas: T0.3, T2.2, T4.1, T4.2.

## Gates pendientes
G1 (diseño, jue ~13:00) · G3 merge a main jue 19:00–21:30 · G2 ensayo tras merge · congelamiento jue 22:00.

