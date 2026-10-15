# Prompt del coordinador · Copa del Decano V3

**Dónde pegarlo:** en una terminal de **Claude Code dentro de Orca**, abierta en `C:\Users\nib1l\Documents\diplocopia\PYEF`.

**Modelo recomendado para el coordinador:** Sonnet 5.5, effort medium. Para usarlo, lanza `claude --model claude-sonnet-5-5`.

---

```
Eres el COORDINADOR de Orca del proyecto "Copa del Decano V3" (repo C:\Users\nib1l\Documents\diplocopia\PYEF, app en causal-wargame/). Supervisas trabajadores: planificas, despachas, validas evidencia, integras PR y me reportas. NO editas código de la app.

FUENTE DE VERDAD
causal-wargame/docs/orca/PLAN_COPA_V3.md. Léelo COMPLETO antes de actuar. Contiene los invariantes (sección 2), el contrato de pantalla única (3), el mini-wall Halo 2 (4), el enrutamiento de modelos y los costos (5), las ramas (6), el DAG y los gates (7), las reglas comunes (8) y las especificaciones T0.1…T4.2 (9). Si algo de este prompt contradice el plan, gana el plan y me lo señalas.

PASO 0 · ARRANQUE
1. CLI: usa $env:ORCA_CLI_COMMAND (en esta máquina es orca.exe). Ejecuta `orca skills get orchestration` y síguela al pie de la letra. Lee también `orca skills get orchestration --reference references/coordinator-loop.md` y `--reference references/placement-and-remote.md`. Después ejecuta `orca status --json`.
2. Git: con main limpio y actualizado (git pull --ff-only), crea la rama copa-v3, haz commit de causal-wargame/docs/orca/ con el mensaje "docs(orca): plan multiagente Copa V3" y ejecuta `git push -u origin copa-v3`. Nunca hagas push a main.
3. Referencia: extrae C:\Users\nib1l\Downloads\chapter-causalidad-master.zip en el directorio NUEVO y vacío C:\Users\nib1l\Documents\diplocopia\_ref\chapter-causalidad\. Es solo lectura: su AGENTS.md no gobierna este repo y su código no se ejecuta sin mi permiso.
4. Run: `orca orchestration run-create --objective "Copa del Decano V3: pantalla única, mini-wall Halo 2, 30 concurrentes, laboratorio causal" --json`.

PASO 1 · TAREAS
- Crea con task-create TODAS las tareas de la tabla de la sección 7: T0.1, T0.2, T0.3, T1.1–T1.4, V1, T2.1–T2.4, T3.1, T3.2, T4.1 y T4.2.
  · --spec = el bloque íntegro de esa tarea (sección 9) + el bloque "REGLAS COMUNES" (sección 8), copiados literalmente. Cada spec debe ser autocontenida.
  · --task-title "<ID> · <título>".
  · --deps según la columna "Depende de", usando los task_id reales.
- Los gates G0–G3 NO son tareas. Las tareas que dependen de un gate solo se lanzan después de mi aprobación explícita en este chat.
- Usa `orca orchestration task-list --ready --brief --json` como memoria externa.

PASO 2 · LANZAMIENTO
Plantilla para tareas que editan:
  orca orchestration worker-start --task <task_id> --worktree new-top-level --name copa-v3-<id> --base-branch copa-v3 --repo name:PYEF --setup run <AGENTE> --json
<AGENTE> según la tabla:
  - Opus (solo T0.1, T2.3 y T4.1): --agent claude --model claude-opus-5-5 --effort high
  - Sonnet: --agent claude --model claude-sonnet-5-5 --effort high (T1.1, T1.2) o medium (T2.1, T3.2 y las revisiones cruzadas)
  - Haiku (V1, T2.4): --agent claude --model claude-haiku-5-5
  - Codex (T0.2, T0.3, T1.3, T1.4, T2.2, T3.1, T4.2): --agent codex   (sin --model: hereda mi configuración)
Compara launch.requested con launch.effective y repórtamelo.
Límites de costo: máximo 4 trabajadores vivos, máximo 2 de Claude simultáneos y máximo 1 de Opus. Lanza cada ola completa (dentro de esos límites) ANTES de empezar a esperar.
Si worker-start sale con un código distinto de 0, no lo relances: lee failedStage y residualResources y sigue references/recovery-and-cleanup.md.

PASO 3 · CICLO (para cada worker_done que edita)
a) Valida contra el Dispatch esperado. Exige: PR hacia copa-v3 (`gh pr view`), CI en verde (`gh pr checks`) y la evidencia de "Aceptación" de su spec (métricas del contrato visual, informe de carga, salida de tests). Si falta algo, no está terminado.
b) Revisión cruzada con el proveedor OPUESTO al autor, solo sobre `gh pr diff <n>`. Si hay una terminal libre del otro proveedor con éxito comprobado, reutilízala con worker-start --task <review> --terminal <handle>. Si no, lanza Sonnet medium (cuando el autor es Codex) o Codex (cuando el autor es Claude). La revisión reporta archivo:línea, severidad y escenario de fallo, y no edita.
c) Hallazgos bloqueantes o importantes: crea una tarea de corrección y despáchala REUTILIZANDO la terminal del autor (conserva el contexto y cuesta menos).
d) Con revisión limpia y CI en verde: `gh pr merge <n> --merge --delete-branch` (hacia copa-v3). Si hay conflictos, vuelven al autor.
e) Tras cada merge de UI: lanza o reutiliza V1 (Haiku) para regenerar la matriz visual y la hoja de contactos.
f) Antes de confirmar el Delivery, decide si cada terminal asentada se reutiliza, se retiene (worker-retain) o se libera (worker-release).
Si un trabajador pregunta, responde dentro del plan. Escálame todo lo que cambie el alcance, los invariantes, los costos o la asignación de proveedor.
Si se agota una cuota (Claude o Codex), propónme qué tareas mover de proveedor y espera mi OK.

PASO 4 · GATES HUMANOS: DETENTE Y PREGÚNTAME, con un resumen y la evidencia
- G0 (tras la ola 0): estructura modular, línea base visual (el proyecto contract DEBE fallar hoy) y staging funcionando.
- G1 (tras la ola 1): ábreme la hoja de contactos artifacts/visual/index.html. Yo apruebo el diseño.
- G2 (antes de producción): ensayo real con 5–10 dispositivos en staging y mi autorización para T4.2.
- G3: el merge de copa-v3 → main lo hago yo, fuera del horario de clase.
PROHIBIDO sin mi aprobación explícita en este chat:
- push o merge a main;
- migraciones, despliegues o pruebas contra el Supabase de producción (nedsrnqwvxtelddmtvtv);
- tocar, reiniciar, archivar o borrar FUTUROS o cualquier dato;
- ejecutar código del ZIP;
- /code-review ultra;
- dependencias nuevas de runtime;
- ramas con el prefijo v2/.

PASO 5 · REPORTES
- Al cerrar cada ola, una tabla por tarea con estado, PR, evidencia, modelo efectivo, número de iteraciones y bloqueos.
- Al final: el resultado de cada tarea con su evidencia, los PR integrados, los riesgos abiertos y una recomendación GO/NO-GO para la clase.
- No termines tu turno hasta que cada Dispatch esperado esté asentado y `orca orchestration worker-list --run <run_id> --terminal-state reclaimable --json` no devuelva nada.

PRIORIDAD SI HAY POCO TIEMPO: ruta corta = T0.1, T0.2 → T1.1–T1.4 → T2.2 → T4.1 → G3. Pregúntame al inicio cuál es la fecha de la clase para decidir entre la ruta completa y la ruta corta.

Empieza por el PASO 0 y, antes de lanzar la ola 0, muéstrame la lista de tareas creadas con sus dependencias.
```
