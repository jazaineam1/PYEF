# Copa del Decano V3 · Plan multiagente para Orca

> Fuente de verdad del coordinador y de los trabajadores. Rama de integración: `copa-v3`.
> Verificado contra `main` @ `06b5e9e` (14-oct-2026). App: `causal-wargame/`.

## 0. Objetivo y definición de "listo"

Convertir la Copa del Decano en la mejor actividad de 120 minutos para enseñar causalidad: un videojuego que se juega en **una sola pantalla**, con marcador competitivo en vivo, que **escala a 30 personas** sin fallos y cuyo laboratorio científico usa **el mismo DGP** que generó los datos del juego.

"Listo para clase" significa que se cumplen todas estas condiciones:

1. El contrato de pantalla única (sección 3) pasa en las 3 pantallas, 7 fases y 6 viewports.
2. El mini-wall estilo Halo 2 (sección 4) está visible para el jugador y el docente.
3. Hay una prueba de carga extremo a extremo con 30 sesiones concurrentes y umbrales cumplidos contra el Supabase del usuario, en una partida de QA dedicada (sección 2, invariante 2).
4. Se hizo un ensayo real con 5–10 dispositivos, incluida la reconexión.
5. La revisión científica y pedagógica cerró sin hallazgos bloqueantes.
6. La revisión de release dio *go*, y `FUTUROS` y V1 permanecen intactos.

## 1. Verificación de la auditoría externa

**Confirmado en el código:**
- `src/v2/dean-cup.jsx` contiene las 3 pantallas en un solo archivo de 302 líneas densas. Su layout apila todo verticalmente: `.dean-page{min-height:100vh}` y `main{display:grid;gap:20px}`, así que el scroll global está garantizado.
- En la consola docente, el botón de avanzar de fase queda **al final** de la página, después del atlas, el ranking, el Kahoot y el laboratorio. El control principal exige scroll.
- En el Wall, el banner, el ranking de 5 salas y el atlas SVG (920×405) superan los 1080 px de alto.
- No hay mini-wall. La única clasificación es `Board`, un listado completo.
- `FUTUROS` es `legacy_v1`. Las partidas nuevas reciben `zip_dgp_2026`, como explica `docs/V2_DEAN_CANONICAL_ZIP.md`.
- El EconML existente proviene de otro DGP. No existe EconML entrenado con el DGP de la Copa.

**Hallazgos nuevos que la auditoría no menciona:**
1. **El docente pierde su guion en las 3 fases clave.** En `Teacher`, `DeanCausalAtlas` **reemplaza** a `DeanGuidance role="teacher"` en las fases `rector`, `survey` y `causal` con `zip_dgp_2026`. Por eso el texto de "qué decir y qué proyectar" desaparece justo en los minutos 30–105.
2. **Las "regresiones visuales" no renderizan nada.** `tests/v2_layout_visual_regression.test.mjs` y similares aplican regex sobre el código fuente. No hay navegador, capturas ni medición de overflow, así que nada impide hoy volver a romper el layout.
3. **Ocho tests leen `src/v2/dean-cup.jsx` con regex.** Cualquier refactor debe redirigirlos sin debilitarlos.
4. **Carga.** Cada cliente consulta `state` cada 2,7–4,0 s, y **cada consulta ejecuta `cw_dean_tick_v3`**, que es una escritura, antes de leer. En la fase final el jugador también consulta `quiz_state` cada 1,45–2,05 s, lo que suma unas 27 solicitudes/s con 30 personas. Además, `scripts/sustained_load.mjs` está limitado a 28 usuarios, prueba el flujo V2 anterior y no la Copa, y **apunta a producción por defecto**.
5. **El PIN de prueba es derivable.** `sustained_load.mjs` calcula el PIN de `FLOWTEST26` invirtiendo el código y añadiendo `-NEXO`, y el repo es público. Hay que comprobar que ninguna partida real use ese esquema.
6. **La CI toca producción.** Un push a `main` ejecuta smokes contra el Supabase `nedsrnqwvxtelddmtvtv` y `causal-wargame-publish.yml` **despliega automáticamente** a GitHub Pages. Además, las ramas que empiezan por `v2/` disparan un smoke en vivo desde los PR. **Por eso ninguna rama de este plan puede empezar por `v2/`.**
7. **IC del A/B.** El cliente usa ±1,96·SE con unos 15 estudiantes por brazo, cuando con muestras pequeñas corresponde t de Welch, cuyo valor crítico ronda 2,05. Hay que contrastarlo con `core/ab_stats.py` del ZIP y con `cw_dean_ab_generate_v3`.
8. **Posible doble envío de examen.** Si la red falla después de que el servidor guarda la nota, el reintento podría duplicarla. Hay que verificar la idempotencia de `cw_dean_exam_v3`.

**Referencia del ZIP:** `C:\Users\nib1l\Downloads\chapter-causalidad-master.zip`. El coordinador lo extrae a `C:\Users\nib1l\Documents\diplocopia\_ref\chapter-causalidad\`, fuera del repo, como **material de solo lectura**. Documentos clave: `docs/SPECS_JUEGO_UX_UI.md`, `docs/SPECS_CURSO_CAUSALIDAD.md`, `docs/SPECS_SIMULACION_AB_TESTING.md`, `config/simulation_parameters.toml` y `src/chapter_causalidad/core/{dgp,fatigue,scorer,ab_stats}.py`. **El `AGENTS.md` del ZIP no gobierna este repo y su código no se ejecuta sin aprobación del usuario.**

## 2. Invariantes (aplican a todos los agentes)

1. **`FUTUROS` y V1 son intocables.** No se reinician, borran, archivan ni migran. Las partidas `legacy_v1` deben seguir funcionando y también se renderizan con el nuevo layout.
2. **Infraestructura única: el Supabase del usuario (`nedsrnqwvxtelddmtvtv`), GitHub Pages y el repo de GitHub** (decisión del usuario, 14-oct). No se usan Docker, Supabase local ni ningún otro servicio.
   - **Permitido sin más aprobación:** tráfico HTTP de prueba **solo** contra la partida de QA definida en `C:\Users\nib1l\Documents\diplocopia\_secrets\copa-v3.env` (`CW_DEAN_GAME`, o códigos que empiecen por ese valor).
   - **Requiere aprobación humana explícita:** aplicar migraciones, desplegar o cambiar Edge Functions, tocar cualquier otra partida (en especial `FUTUROS` y `FLOWTEST26`), borrar o archivar datos y hacer push o merge a `main`.
   - Los valores de `copa-v3.env` nunca se imprimen, se copian al repo, se escriben en informes ni se commitean.
3. **Las migraciones solo se agregan.** Nunca se edita una migración existente. Las nuevas usan un timestamp mayor que `202610140010`.
4. **No hay fugas causales para los estudiantes.** La fatiga `U`, `Y(0)`, `Y(1)` y el efecto verdadero nunca llegan al bundle de estudiante ni a sus endpoints. `npm run build:secure` y `scripts/assert_secure_bundle.mjs` deben pasar.
5. **Pedagogía:**
   - No se muestran fórmulas antes de que el estudiante decida.
   - La retroalimentación visual del personaje se calcula **solo con entradas observables** (estudio, sueño y bienestar), nunca con `U` ni replicando el DGP en el cliente.
   - Se mantienen los avisos de "datos sintéticos".
6. **Dependencias.** No se agregan dependencias de runtime. La única dependencia de desarrollo nueva permitida es `@playwright/test` (T0.2), con versión exacta, igual que el resto de `package.json`.
7. **No tocar `dos-futuros/`.** Lo genera la CI de publicación.
8. **Ramas y PR.** Cada tarea usa la rama que Orca crea para su worktree (`jazaineam1/copa-v3-<id>`) y su PR apunta a `copa-v3`. `copa-v3/<id>` es imposible porque ya existe la rama `copa-v3`. Nunca se usa el prefijo `v2/`.
9. **Calidad.** `npm run check` debe pasar dentro de `causal-wargame/`. Cuando exista el arnés visual, `npm run test:visual` debe pasar en las pantallas que toca la tarea.
10. **Estilo.** React funcional, textos de interfaz en español, iconos de `lucide-react` o emoji. Los archivos nuevos pueden estar formateados de forma legible.

## 3. Contrato de pantalla única (medible)

**Atributos que deben exponer todas las pantallas** (los crea T0.1 y los mide T0.2):
- `data-dean-zone="hud|stage|actions|drawer"`: zonas del shell.
- `data-dean-cta="primary"`: acción principal de la fase. Hay exactamente una visible por fase.
- `data-dean-scroll="allowed"`: único lugar donde se permite scroll interno.
- `data-testid` en `DeanHud`, `Board`, `Exam`, `CupQuiz`, `DeanCausalLab`, `DeanCausalAtlas`, `DeanGuidance` y `TeacherTimeline`.

**Viewports:**

| Clase | Tamaños | Pantallas |
|---|---|---|
| Proyector / escritorio | 1280×720, 1366×768, 1920×1080 | Jugador, Docente, Wall |
| Tableta | 768×1024 | Jugador, Docente |
| Móvil | 390×844, 360×740 | Jugador |

**Criterios por captura** (el arnés guarda las métricas en un JSON):
- **Escritorio y tableta:**
  - `documentElement.scrollHeight ≤ innerHeight + 1` y `scrollWidth ≤ innerWidth + 1`.
  - El CTA principal está completamente dentro del viewport.
  - Ningún elemento con texto recorta contenido (`scrollHeight > clientHeight + 1`), salvo dentro de `data-dean-scroll="allowed"`.
- **Móvil:**
  - No hay scroll horizontal.
  - HUD y barra de acciones son fijos y visibles.
  - El `stage` puede desplazarse internamente, pero el CTA es visible sin desplazar.
- **Wall:**
  - En 1280×720, el texto es de al menos 18 px y las puntuaciones de al menos 32 px.
  - En 1920×1080, las puntuaciones son de al menos 48 px.

**Estados de fixture** (backend simulado, sin red):
- Fases: `lobby` (sin unirse y unido), `exams` (examen 1, 8, 15 completados, reloj agotado), `rector`, `survey`, `causal`, `final` (quiz idle/preview/open/locked/reveal/podium) y `finished`.
- Cada fase se prueba con `legacy_v1` y `zip_dgp_2026`.
- Asistencia: 0, 1, 17 y 30 personas, con salas vacías.

## 4. Mini-wall estilo Halo 2 (`DeanHud`)

- **Posición.** Esquina superior derecha, entre 260 y 320 px de ancho, en la zona `hud`. En móvil colapsa a una píldora con la posición y puntuación propias; al tocarla, se despliega.
- **Filas.** Hasta 5 salas ordenadas igual que `Board`: `fair_score` descendente, luego cobertura y luego número de sala. Cada fila muestra la posición, un chip de color de equipo (5 tokens de color definidos en T0.1) con el nombre (Alpha…Épsilon), la puntuación con cifras tabulares y una minibarra de progreso.
- **Estado.** Muestra "PROVISIONAL" hasta que la sala termina. Las salas vacías no aparecen en filas; se resumen como "N salas vacías".
- **Equipo propio.** Se resalta con contorno y la etiqueta "TÚ"; el líder lleva corona.
- **Cambios de posición.** Una flecha ↑↓ con delta durante 4 s y una animación breve de reordenamiento. Con `prefers-reduced-motion` no hay animación.
- **Accesibilidad.** `aria-live="polite"`, que anuncia cambios de posición del equipo propio como máximo cada 15 s. El color nunca es la única señal.
- **Datos.** Reutiliza el estado de `useBoard`; **no añade otra consulta periódica**.

## 5. Enrutamiento de modelos y control de costos

| Rol | Agente / modelo | Por qué | Consumo relativo |
|---|---|---|---|
| Coordinador | Claude Sonnet 5.5 (`claude-sonnet-5-5`), effort medium | Enruta, valida evidencia, integra PR. No edita código. | Medio (sesión larga) |
| Arquitectura (T0.1), ciencia (T2.3), release (T4.1) | Claude Opus 5.5 (`claude-opus-5-5`), effort high | Son decisiones que condicionan todo, requieren razonamiento causal fino y revisión de seguridad. Solo 3 tareas. | Alto, puntual |
| UI de juego (HUD, Jugador, sensación de juego, integración del laboratorio) | Claude Sonnet 5.5, effort medium/high | Mejor relación calidad/costo en React, CSS y diseño de interacción. | Medio |
| Wall, Docente, arnés visual, staging/carga, Python/EconML | Codex (modelo por defecto de tu configuración) | Tareas con criterios verificables por terminal y métricas. Usa una **cuota separada** de la de Claude. | Cuota Codex |
| Matriz visual, hoja de contactos, auditoría de accesibilidad y textos | Claude Haiku 5.5 (`claude-haiku-5-5`) | Trabajo mecánico y repetitivo. | Bajo |
| Revisión cruzada de PR | El proveedor **opuesto** al autor | Cada proveedor detecta errores distintos. Se revisa solo el diff. | Bajo-medio |

**Reglas de costo:**
1. **Concurrencia.** Máximo 4 trabajadores vivos, máximo 2 de Claude simultáneos y máximo 1 de Opus.
2. **Opus** se usa solo en T0.1, T2.3 y T4.1. Las revisiones cruzadas usan Sonnet medium o Codex.
3. **Revisiones** sobre `gh pr diff <n>`, no sobre el repo completo.
4. **Correcciones** de un PR: se reutiliza la terminal del autor (`worker-start --task <fix> --terminal <handle>`), que conserva el contexto. No se lanza un agente nuevo.
5. **Las tareas de UI no necesitan backend.** Trabajan contra los fixtures del arnés.
6. **Topes por tarea.** Si el mismo criterio de aceptación falla 2 veces seguidas, el trabajador escala con `ask` en vez de insistir.
7. **Sin `/code-review ultra`.** Es de pago y solo se usa si el usuario lo decide para el release.
8. **Si se agota una cuota,** el coordinador **propone** mover tareas Sonnet↔Codex y espera aprobación.
9. **Modelos.** Codex se lanza sin `--model`, así hereda tu configuración; para fijarlo, añade `--model <id>` en `worker-start`. El coordinador compara `launch.requested` con `launch.effective` y lo reporta.

## 6. Ramas, worktrees e integración

- **Integración.** `copa-v3` sale de `main` actualizado. Cada tarea que edita trabaja en un worktree propio, creado con `--worktree new-top-level --base-branch copa-v3`, en la rama que Orca le asigna (`jazaineam1/copa-v3-<id>`), y abre un PR con `gh pr create --base copa-v3`.
- **CI en los PR.** Corre tests unitarios y ambos builds, sin smokes en vivo, siempre que la rama no empiece por `v2/`. T0.2 añade además el job visual.
- **Merge a `copa-v3`.** Lo hace el coordinador con `gh pr merge <n> --merge --delete-branch` cuando se cumplen tres condiciones: CI verde, revisión cruzada sin hallazgos bloqueantes y evidencia de aceptación adjunta. Si hay conflictos, vuelven al autor.
- **Merge `copa-v3` → `main`.** Lo hace **solo el usuario** (gate G3) y **fuera del horario de clase**, porque despliega a Pages y ejecuta smokes contra producción.

## 7. DAG de tareas y gates

| ID | Tarea | Agente | Depende de | Ola |
|---|---|---|---|---|
| T0.1 | Modularizar la Copa + `DeanShell` + tokens + contrato `data-dean-*` | Claude Opus · high | — | 0 |
| T0.2 | Arnés visual Playwright + backend simulado + métricas + job de CI | Codex | — | 0 |
| T0.3 | Staging local de Supabase + `dean_cup_load.mjs` (solo local) | Codex | — | 0 |
| **G0** | **Humano:** aprobar estructura, línea base visual (debe fallar) y staging | Usuario | T0.* | — |
| T1.1 | Mini-wall `DeanHud` estilo Halo 2 | Claude Sonnet · high | T0.1, T0.2 | 1 |
| T1.2 | Jugador en pantalla única | Claude Sonnet · high | T0.1, T0.2 | 1 |
| T1.3 | Wall 16:9 en pantalla única | Codex | T0.1, T0.2 | 1 |
| T1.4 | Consola docente compacta + guion siempre visible | Codex | T0.1, T0.2 | 1 |
| V1 | Matriz visual + hoja de contactos (se repite tras cada merge de UI) | Claude Haiku | merges de la ola 1 | 1 |
| **G1** | **Humano:** aprobación visual con la hoja de contactos | Usuario | T1.*, V1 | — |
| T2.1 | Sensación de videojuego en el examen y el marcador | Claude Sonnet · medium | G1 | 2 |
| T2.2 | 30 concurrentes, resiliencia, idempotencia y polling | Codex | G1, T0.3 | 2 |
| T2.3 | Revisión científica y pedagógica de los 120 min | Claude Opus · high | G1 | 2 |
| T3.1 | Laboratorio Python + EconML con el DGP de la Copa | Codex | G1 | 2 |
| T2.4 | Auditoría de accesibilidad y textos (solo informe) | Claude Haiku | T2.1 | 3 |
| T3.2 | Integrar EconML de la Copa en la fase causal | Claude Sonnet · medium | T3.1, T2.1 | 3 |
| **G2** | **Humano:** ensayo real con 5–10 dispositivos en staging y autorización de producción | Usuario | T2.*, T3.* | — |
| T4.1 | Revisión de release: código, seguridad, docs y runbook (go/no-go) | Claude Opus · high | todo lo anterior | 4 |
| T4.2 | Carga de 30 en producción con código dedicado | Codex | T4.1 + aprobación G2 | 4 |
| **G3** | **Humano:** merge `copa-v3` → `main` fuera de horario | Usuario | T4.* | — |

**Ruta corta, si la clase es inminente:** T0.1 → T0.2 → T1.1–T1.4 → T2.2 → T4.1 → G3. Con eso se cumplen todos los P0. T2.1, T2.3, T3.x y T2.4 quedan para la siguiente iteración.

### 7.1 Ruta activa: corta (clase el viernes 16-oct-2026, 10:00–12:00 COT)

Decidida el 14-oct. El usuario prohibió Docker: toda prueba usa su Supabase, GitHub Pages y GitHub.

- **Activas:** T0.1, T0.2, T0.3b → **G0** → T1.1–T1.4 (+ revisiones cruzadas y V1) → **G1** → T2.2b + T4.1b → **G2/G3**.
- **Sustituidas:** T0.3 → T0.3b, T2.2 → T2.2b, T4.1 → T4.1b. T4.2 queda absorbida por T2.2b (la carga ya se hace contra el Supabase real).
- **Pospuestas para después de la clase:** T2.1, T2.3, T2.4, T3.1, T3.2 y una revisión de release posterior.

**Calendario (hora de Colombia):**

| Cuándo | Qué |
|---|---|
| Mié 14, noche | Ola 0: T0.1, T0.2, T0.3b |
| Jue 15, hasta 08:00 | **G0** |
| Jue 15, 08:00–13:00 | Ola 1 + revisiones cruzadas + V1 |
| Jue 15, ~13:00 | **G1** (aprobación del diseño) |
| Jue 15, 13:00–19:00 | T2.2b (la corrida de 30 termina **antes de las 20:00**) + T4.1b |
| Jue 15, 19:00–21:30 | **G3** merge a `main` → Pages; ensayo **G2** con 5–10 dispositivos sobre Pages en la partida de QA; si es NO-GO, `git revert` del merge |
| Jue 15, 22:00 | **Congelamiento:** nada más entra a `main` |
| Vie 16, 10:00–12:00 | Clase. Solo lectura y monitoreo |

No existe un Pages de staging, así que el ensayo real (G2) ocurre **después** del merge (G3), con la reversión como red de seguridad.

## 8. Reglas comunes para trabajadores (se copian dentro de cada `--spec`)

```
REGLAS COMUNES
- Antes de empezar, lee las secciones 1–4 de causal-wargame/docs/orca/PLAN_COPA_V3.md (en tu worktree).
- Trabaja en la rama que Orca creó para tu worktree (jazaineam1/copa-v3-<id>); no crees copa-v3/<id>, choca con la rama copa-v3. Nunca uses el prefijo v2/.
- Edita SOLO las rutas listadas en "Propiedad". Si necesitas cambiar otra, usa el comando ask del preámbulo.
- Invariantes: no tocar FUTUROS, V1 ni dos-futuros/; sin Docker ni Supabase local; en el Supabase del usuario (nedsrnqwvxtelddmtvtv) solo el tráfico de prueba contra la partida de QA cuando tu spec lo pida (invariante 2), nunca migraciones ni despliegues; los valores de _secrets\copa-v3.env nunca se imprimen ni se commitean; migraciones solo nuevas; sin fugas de U/Y0/Y1/efecto verdadero; sin dependencias nuevas de runtime.
- Verifica en causal-wargame/: npm run check (y npm run test:visual cuando exista). Adjunta la salida relevante.
- Abre un PR: gh pr create --base copa-v3, con descripción Qué/Por qué/Evidencia (métricas o capturas)/Riesgos.
- Si el mismo criterio de aceptación falla 2 veces, usa ask y no sigas iterando.
- Termina con worker_done (--outcome succeeded|failed), --files-modified y --report-path si escribiste un informe en causal-wargame/docs/orca/reports/.
```

## 9. Especificaciones de tareas

### T0.1 · Modularizar la Copa y crear el shell de pantalla única
- **Agente:** Claude Opus 5.5 · high.
- **Objetivo:** `src/v2/dean-cup.jsx`, `src/v2/dean-cup.css`, `src/v2/DeanCausalAtlas.jsx`, `src/v2/dean-causal-atlas.css` y los tests que los leen (`tests/v2_dean_*.test.mjs`).
- **Cambio:**
  - Dividir el archivo en `src/v2/dean/`:
    - `api.js` (`call`, `endpoint`, `hexToken`) y `useBoard.js`.
    - `constants.js` (nombres, iconos, perfiles, límites, asignaturas).
    - `content.js` (todo el texto de las fases: `deanGuides`, textos del laboratorio y del banner).
    - Componentes: `Board.jsx`, `Exam.jsx`, `CupQuiz.jsx`, `CausalLab.jsx`, `Guidance.jsx`, `Shell.jsx`.
    - Pantallas: `player/Player.jsx`, `wall/Wall.jsx` y `teacher/Teacher.jsx`.
    - Un stub en `hud/DeanHud.jsx` que T1.1 sustituirá.
    - `src/v2/dean-cup.jsx` queda como punto de entrada, porque lo cargan los 3 HTML.
  - CSS:
    - `dean/tokens.css`: paleta actual, **5 colores de equipo**, escala tipográfica con `clamp()` y espaciado.
    - `dean/shell.css`: rejilla `100dvh` con las zonas `hud`, `stage`, `actions` y `drawer`.
    - Un CSS por componente.
  - Envolver las 3 pantallas en `DeanShell` y aplicar los atributos del contrato de la sección 3. El contenido **sigue apilado dentro de `stage`**, con `data-dean-scroll="allowed"` de forma provisional.
- **Restricciones:**
  - Sin cambios funcionales ni de textos.
  - `dean-route.js` y los HTML no cambian.
  - Los tests que leían `dean-cup.jsx` pasan a usar un helper `tests/helpers/dean-sources.mjs` que concatena las fuentes de `src/v2/dean/**`. **Ninguna aserción se debilita ni se elimina.**
- **Propiedad:** las rutas listadas, `src/v2/dean/**` y `tests/helpers/**`.
- **Aceptación:**
  - `npm run check` en verde.
  - `git diff --stat` coherente con un refactor.
  - Una tabla en el PR con cada responsabilidad antigua y su archivo nuevo.
  - Una captura manual de cada pantalla, sin diferencias visuales relevantes, salvo el shell.

### T0.2 · Arnés visual con backend simulado
- **Agente:** Codex.
- **Objetivo:** `causal-wargame/tests/visual/**`, `causal-wargame/playwright.config.*`, `package.json` (script y devDependency) y `.github/workflows/causal-wargame-visual.yml`.
- **Cambio:**
  - **Dependencia y script.** Añadir `@playwright/test` con versión exacta y el script `test:visual`.
  - **Servidor.** Levantar Vite con `VITE_FUNCTIONS_BASE_URL=https://mock.dean.test/functions/v1`, porque `call()` exige `https://`.
  - **Backend simulado.** Interceptar `**/v2-dean-cup` y `**/facilitator-login` con `page.route` y devolver fixtures por acción.
  - **Fixtures.** Deducir su forma **de las funciones SQL** `cw_dean_state_v3`, `cw_dean_quiz_state`, etc. en `supabase/migrations/2026101400*_*.sql`, sin inventarla, y cubrir los estados de la sección 3.
  - **Capturas.** Guardar `artifacts/visual/<viewport>/<rol>-<fase>-<variante>.png` y `metrics.json` para cada captura (overflow vertical y horizontal, CTA visible, elementos recortados, tamaño mínimo de fuente).
  - **Hoja de contactos.** Generar `artifacts/visual/index.html`.
  - **Dos proyectos de Playwright:**
    - `report`: siempre en verde; solo produce artefactos.
    - `contract`: aplica la sección 3 y **debe fallar hoy** (línea base).
  - **Job de CI** en PR que ejecute `report`, suba los artefactos y no bloquee hasta G1.
  - `artifacts/` queda en `.gitignore`.
- **Restricciones:**
  - No modificar `src/`.
  - Localizadores por rol o texto mientras T0.1 no exponga `data-dean-*`. Si los dos ya están en `copa-v3`, usar `data-dean-*`.
- **Propiedad:** rutas listadas y `.gitignore`.
- **Aceptación:**
  - `npm run test:visual -- --project=report` genera la matriz completa.
  - `--project=contract` falla con un informe legible por pantalla, fase y viewport.
  - Captura de la hoja de contactos en el PR.

### T0.3 · Staging local y prueba de carga de la Copa
> **Sustituida por T0.3b el 14-oct** (el usuario prohibió Docker y Supabase local). Se conserva como historial.

- **Agente:** Codex.
- **Objetivo:** `causal-wargame/scripts/dean_cup_load.mjs`, `causal-wargame/scripts/staging/**` y `causal-wargame/docs/orca/STAGING.md`.
- **Cambio:**
  - **Supabase local.** Levantarlo con `npx supabase start` (Docker), aplicando todas las migraciones, y servir las funciones con `npx supabase functions serve`.
  - **Seed de staging.** Crear una partida V2 de prueba con un PIN **aleatorio** leído de `.env.staging.local`, que debe estar en `.gitignore`.
  - **`dean_cup_load.mjs`:**
    - Variables: `CW_BASE_URL` obligatoria, **sin valor por defecto de producción**, además de `CW_DEAN_GAME` y `CW_DEAN_PIN`.
    - **Se niega a ejecutarse** si el host es `nedsrnqwvxtelddmtvtv` y no se define `CW_ALLOW_PROD=YES_I_APPROVED`, y siempre si `game=FUTUROS`.
    - Escenarios de asistencia: 0, 1, 5, 12, 17, 29 y 30 personas, y una distribución desigual (6/6/6/6/6 y 1/0/5/6/2).
    - Cada usuario se une, rinde 15 exámenes con 2–8 s de espera entre ellos y consulta el estado al ritmo real.
    - El docente avanza las fases. Se prueban las exportaciones por capa y el Kahoot de 8 preguntas con 30 respuestas.
  - **Métricas:** p50, p95 y p99 por acción, tasa de errores y número de respuestas 5xx.
  - **Invariantes que comprueba:**
    - `fair_score = suma/(15·inscritos)`.
    - Se rechaza un séptimo asiento.
    - No hay filas para ausentes.
    - Los CSV de estudiante no incluyen `U`, `Y0`, `Y1` ni el efecto verdadero.
  - **Informe:** `artifacts/load/<fecha>.json` y `.md`.
- **Restricciones:**
  - **Solo local.** No modificar `sustained_load.mjs`.
  - Si Docker o Supabase local fallan, usar `ask` con opciones; por ejemplo, un proyecto Supabase de staging que cree el usuario.
- **Propiedad:** rutas listadas.
- **Aceptación:** una corrida local con 30 usuarios documentada, con umbrales provisionales: p95 `state` < 800 ms, p95 `exam` < 1200 ms, errores < 0,5 % y 0 respuestas 5xx. El informe va en el PR.

### T1.1 · Mini-wall `DeanHud` estilo Halo 2
- **Agente:** Claude Sonnet 5.5 · high.
- **Objetivo:** `src/v2/dean/hud/**`.
- **Cambio:** implementar la sección 4 completa sustituyendo el stub, más tests unitarios del orden, el resaltado del equipo propio y la limitación de anuncios `aria-live`.
- **Restricciones:** sin consultas nuevas; los datos llegan por props desde `useBoard`.
- **Propiedad:** `src/v2/dean/hud/**` y `tests/v3_dean_hud.test.mjs`.
- **Aceptación:** capturas del arnés del HUD en 1366×768 y 390×844 con 1, 17 y 30 personas y cambio de posición; `npm run check` en verde.

### T1.2 · Jugador en pantalla única
- **Agente:** Claude Sonnet 5.5 · high.
- **Objetivo:** `src/v2/dean/player/**` y el CSS asociado. Leer `docs/SPECS_JUEGO_UX_UI.md` del ZIP.
- **Cambio:**
  - **HUD:** carné compacto a la izquierda (icono, alias, sala, chip de arquetipo) y `DeanHud` a la derecha.
  - **Stage:** una escena por fase.
    - `exams`: tarjeta de asignatura, 3 deslizadores en una fila en escritorio, reloj y resultado.
    - `rector`, `survey` y `causal`: atlas y laboratorio lado a lado en escritorio, con pestañas en móvil.
    - `final`: el quiz ocupa el stage.
  - **Barra de acciones fija:** el CTA de la fase como acción primaria ("ENTRAR A LA COPA", "RENDIR EXAMEN") y "Simular restantes" como secundaria con confirmación.
  - **Drawer "Evidencia":** cuaderno, descargas CSV y clasificación completa.
- **Restricciones:** mismos flujos, mismas llamadas y mismos textos (el contenido vive en `content.js`). `legacy_v1` incluido.
- **Propiedad:** `src/v2/dean/player/**`.
- **Aceptación:** el proyecto `contract` del arnés pasa para el **rol jugador** en todas sus fases y viewports. Adjuntar las métricas.

### T1.3 · Wall 16:9 en pantalla única
- **Agente:** Codex.
- **Objetivo:** `src/v2/dean/wall/**`.
- **Cambio:**
  - Banner delgado.
  - A la izquierda (unos 60 %), 5 tarjetas de equipo con puntuación grande, progreso e inscritos; las salas vacías aparecen atenuadas.
  - A la derecha (unos 40 %), el panel de la fase: guía, atlas o quiz.
  - En `final`, el quiz ocupa el área principal y el ranking pasa a una franja.
- **Restricciones:** cumplir la legibilidad mínima de la sección 3 y no usar texto que dependa de pasar el cursor por encima.
- **Propiedad:** `src/v2/dean/wall/**`.
- **Aceptación:** `contract` pasa para el **rol Wall** en 1280×720, 1366×768 y 1920×1080 en todas las fases.

### T1.4 · Consola docente compacta y guion siempre visible
- **Agente:** Codex.
- **Objetivo:** `src/v2/dean/teacher/**`.
- **Cambio:**
  - **Línea de tiempo** (`TeacherTimeline`) con las 7 fases y sus minutos, la fase actual resaltada y el **CTA de avance siempre visible**. Antes de avanzar, una confirmación explica qué cambia para los estudiantes.
  - **Guion docente siempre visible, incluso con el atlas.** Esto corrige el hallazgo 1 de la sección 1.
  - **Pestañas:** Guion · DAG · Datos y A/B · Kahoot · Exportaciones docentes.
  - **`DeanHud`** y un resumen de asistencia.
  - **Confirmación** antes de exportar la fatiga oculta o los contrafactuales.
- **Restricciones:** mismas llamadas y permisos; `sessionStorage` y el alcance del token sin cambios, para que el test de alcance siga pasando.
- **Propiedad:** `src/v2/dean/teacher/**`.
- **Aceptación:** `contract` pasa para el **rol docente** en 1366×768, 1920×1080, 1280×720 y 768×1024.

### V1 · Matriz visual y hoja de contactos (tarea recurrente)
- **Agente:** Claude Haiku 5.5.
- **Objetivo:** el estado actual de `copa-v3`, sin editar `src/`.
- **Cambio:**
  - Ejecutar `npm run test:visual` con los proyectos `report` y `contract`.
  - Publicar `artifacts/visual/index.html`.
  - Resumir en `docs/orca/reports/V1-<n>.md` qué celdas del contrato fallan y a qué tarea corresponden.
- **Propiedad:** solo `docs/orca/reports/**`.
- **Aceptación:** el informe y la ruta de la hoja de contactos.

### T2.1 · Sensación de videojuego
- **Agente:** Claude Sonnet 5.5 · medium.
- **Objetivo:** `src/v2/dean/player/**`, `src/v2/dean/hud/**` (solo animaciones de eventos) y `src/v2/dean/feedback-content.js`.
- **Cambio:**
  - **Escena del examen:** tarjeta de asignatura con ilustración o emoji, ciclo día/noche según el sueño y personaje con 3 estados calculados **solo a partir de las entradas**.
  - **Nota:** revelada con conteo animado y niveles cualitativos.
  - **Semestre:** mapa de 15 nodos con progreso y rachas.
  - **Equipo:** avisos cuando cambia su posición, a través de eventos del HUD.
  - **Sonido:** desactivado por defecto, con interruptor.
- **Restricciones:**
  - Invariante 5: no mostrar `U`, ninguna fórmula ni la puntuación esperada antes de enviar.
  - Solo CSS y React, sin bibliotecas de animación.
  - Respetar `prefers-reduced-motion`.
  - **No editar `content.js`**, que es propiedad de T2.3.
- **Propiedad:** rutas listadas.
- **Aceptación:**
  - El proyecto `contract` sigue en verde.
  - Un vídeo o GIF corto (o una secuencia de capturas) en el PR.
  - Un test que verifique que el estado del personaje depende solo de estudio, sueño y bienestar.

### T2.2 · Concurrencia, resiliencia y polling
> **Sustituida por T2.2b el 14-oct.** Se conserva como historial.

- **Agente:** Codex.
- **Objetivo:** `scripts/dean_cup_load.mjs`, `src/v2/dean/api.js`, `src/v2/dean/useBoard.js`, `src/v2/dean/CupQuiz.jsx` (solo el polling), `supabase/functions/v2-dean-cup/**` y migraciones **nuevas**.
- **Cambio:**
  - **Medir primero.** Ejecutar la carga de 30 personas en staging.
  - **Verificar** la idempotencia de `cw_dean_exam_v3` ante reintentos y doble clic. Si no es idempotente, añadir una migración que lo garantice.
  - **Reconexión,** probada con Playwright contra staging: recargar a mitad de examen debe reanudar el mismo examen; tras 30 s sin red, el estado se recupera sin duplicados.
  - **Optimizar** solo si se superan los umbrales o si `tick` genera escrituras excesivas:
    - limitar `cw_dean_tick_v3` en el servidor por partida;
    - pausar el polling con `document.hidden`;
    - usar retroceso progresivo ante errores;
    - eliminar el doble polling en la fase `final`.
  - Distinguir errores 4xx de 5xx en la función Edge.
- **Restricciones:** solo staging. Comparar antes y después con números. Compatible con `legacy_v1`.
- **Propiedad:** rutas listadas.
- **Aceptación:** informe de carga con 30 personas que cumpla los umbrales de T0.3, pruebas de reconexión e idempotencia en verde y tabla de antes y después.

### T2.3 · Revisión científica y pedagógica de los 120 minutos
- **Agente:** Claude Opus 5.5 · high.
- **Objetivo:** todo el flujo de la Copa, `content.js`, `DeanCausalAtlas.jsx`, las preguntas del Kahoot (en las migraciones SQL), el cuaderno scaffold, `docs/V2_DEAN_*.md` y las especificaciones del ZIP.
- **Cambio:**
  - **Coherencia del DAG v4.** Revisar las afirmaciones sobre confusores (H y Z), mediadores (X₁ y S), la variable latente U y la mención de "posibles colliders". Si el DAG no tiene colliders, corregir el texto.
  - **A/B:** aleatorización por estudiante; IC con t de Welch en lugar de 1,96; consistencia entre `ABFromObserved`, `cw_dean_ab_generate_v3` y `ab_stats.py`; usar "ATE estimado" en lugar de "ATE observado".
  - **Rector:** el guion menciona MAE y R², pero ninguna herramienta los calcula. Añadirlos al laboratorio o al cuaderno, o retirar la afirmación.
  - **Kahoot:** comprobar que las 8 respuestas y sus explicaciones son correctas.
  - **Continuidad del guion** docente minuto a minuto.
  - **Entregables:** informe en `docs/orca/reports/T2.3_ciencia.md`, que clasifique cada hallazgo como bloqueante, importante o menor e indique a qué tarea se asigna, y edición directa **solo** de los textos de `content.js` y de los documentos.
- **Restricciones:** los cambios de código o SQL **no** se hacen aquí; se listan para T2.2, T3.1 o T3.2. Las preguntas del Kahoot se corrigen en una **migración nueva** que redacta T2.2 o T3.1.
- **Propiedad:** `src/v2/dean/content.js`, `docs/**` y `docs/orca/reports/**`.
- **Aceptación:** el informe sin hallazgos bloqueantes abiertos, o con cada uno asignado.

### T2.4 · Auditoría de accesibilidad y textos (solo informe)
- **Agente:** Claude Haiku 5.5.
- **Objetivo:** las 3 pantallas en el arnés.
- **Cambio:**
  - Calcular el contraste de los tokens según WCAG AA.
  - Revisar el orden de foco y el foco visible.
  - Comprobar que `aria-live` no resulta ruidoso.
  - Verificar que ninguna etiqueta es solo un emoji.
  - Revisar la consistencia del español: tú/usted, tildes y terminología causal uniforme.
- **Restricciones:** **sin ediciones**. Las correcciones se enrutan a su dueño.
- **Propiedad:** `docs/orca/reports/T2.4_a11y.md`.
- **Aceptación:** el informe con la ruta del archivo afectado y la corrección propuesta para cada hallazgo.

### T3.1 · Laboratorio Python + EconML con el DGP de la Copa
- **Agente:** Codex.
- **Objetivo:** `scripts/dean_dgp.py`, `scripts/precompute_econml_dean.py`, `requirements-dean.txt`, `public/notebooks/causalidad_copa_decano_scaffold.ipynb`, `src/data/econml-dean.json` y `.github/workflows/causal-wargame-econml-dean.yml`.
- **Cambio:**
  - **Portar a Python el DGP de SQL** de las migraciones `202610140006` y `202610140007`, incluido el Box–Muller determinista por hash. **El SQL es la verdad de la Copa.** El objetivo es paridad exacta con el SQL, comprobada con un test de paridad sobre semillas fijas.
  - **Calcular sobre la cohorte A/B (450 filas):**
    - diferencia de medias con IC por estudiante (t de Welch);
    - `LinearDML`;
    - `CausalForestDML`, con su CATE por arquetipo.
  - **Calcular sobre una cohorte observacional sintética:** estimación ingenua, ajuste por el conjunto de ajuste correcto y verdad.
  - **Salida:** `econml-dean.json` con metadatos (`dgp_version`, semilla, n, estimador, IC). **La verdad no va en este JSON**; se queda en el endpoint docente o en un archivo exclusivo del docente.
  - **Cuaderno:** debe correr de principio a fin en Colab con los CSV del juego y cubrir:
    - Rector: Random Forest, R², MAE y la trampa de la pendiente;
    - encuesta y conjunto de ajuste;
    - A/B;
    - DML.
- **Restricciones:**
  - Python se ejecuta con `-I`, con dependencias de versión fija.
  - **No ejecutar código del ZIP sin aprobación.** Leerlo sí está permitido; si se necesita comparar contra la implementación del ZIP, pedirlo con `ask`.
  - El workflow solo se lanza con `workflow_dispatch`.
- **Propiedad:** rutas listadas.
- **Aceptación:**
  - El test de paridad pasa.
  - `jupyter nbconvert --execute` del cuaderno funciona con CSV de ejemplo.
  - `assert_secure_bundle` sigue pasando, sin la verdad en el bundle.

### T3.2 · Integrar EconML de la Copa en la fase causal
- **Agente:** Claude Sonnet 5.5 · medium.
- **Objetivo:** `src/v2/dean/CausalLab.jsx` y las pestañas "Datos y A/B" del docente y del Wall.
- **Cambio:**
  - Mostrar la comparación ingenua frente a ajustada frente a DML/CATE de `econml-dean.json`, etiquetada como "estimaciones precomputadas con el mismo DGP de la Copa".
  - La verdad solo aparece para el docente, obtenida por su endpoint.
  - Retirar o etiquetar como "otra simulación" el uso de `econml-precomputed.json` en la Copa.
- **Restricciones:** el proyecto `contract` sigue en verde y el bundle de estudiante sigue sin la verdad.
- **Propiedad:** rutas listadas.
- **Aceptación:** capturas de la fase causal en los 3 roles y `npm run check` en verde.

### T4.1 · Revisión de release (go/no-go)
> **Sustituida por T4.1b en la ruta corta (14-oct).** Una revisión completa se hará después de la clase.

- **Agente:** Claude Opus 5.5 · high.
- **Objetivo:** el diff completo `main...copa-v3`.
- **Cambio:**
  - **Revisión de código** con `/code-review high` sobre el diff.
  - **Revisión de seguridad:**
    - alcance de tokens;
    - CSV injection;
    - datos exclusivos del docente;
    - bundle seguro;
    - que **ninguna migración nueva modifique filas de `FUTUROS`**, buscando `UPDATE` y `DELETE`;
    - el esquema de PIN derivable (hallazgo 5);
    - los nombres de las ramas de CI.
  - **Documentación:** actualizar `FACILITATOR_RUNBOOK.md` con el guion V3 de 120 minutos y capturas, `CHANGELOG.md` y `docs/V2_DEAN_*`.
  - **Checklist del día de clase:** URL, código, PIN, plan B sin red y respaldo de V2.
- **Restricciones:** los hallazgos de código se enrutan a su dueño. Las ediciones directas se limitan a la documentación.
- **Propiedad:** `docs/**`, `FACILITATOR_RUNBOOK.md`, `CHANGELOG.md` y `docs/orca/reports/T4.1_release.md`.
- **Aceptación:** un informe con un veredicto **GO** o **NO-GO**, la lista de bloqueantes y el checklist.

### T4.2 · Carga en producción (solo con aprobación de G2)
> **Absorbida por T2.2b el 14-oct:** sin staging aparte, la carga de 30 ya se ejecuta contra el Supabase real.

- **Agente:** Codex.
- **Objetivo:** producción, **solo** después de que el usuario lo apruebe explícitamente en el chat del coordinador.
- **Cambio:**
  - Ejecutar `dean_cup_load.mjs` con 30 personas contra una partida **nueva y dedicada** (por ejemplo, `ENSAYO1410`, con un PIN aleatorio).
  - Medir con los mismos umbrales que en staging.
  - Dejar los datos como están. Archivarlos o borrarlos requiere otra aprobación.
- **Restricciones:** nunca `FUTUROS`; sin migraciones ni despliegues dentro de esta tarea.
- **Propiedad:** solo `docs/orca/reports/T4.2_prod_load.md`.
- **Aceptación:** el informe con los números y una comparación con staging.

### T0.3b · Arnés de carga HTTP contra el Supabase del usuario (partida de QA)
- **Agente:** Codex.
- **Sustituye a:** T0.3. El usuario prohibió Docker y Supabase local: todo se prueba contra su Supabase.
- **Objetivo:** `causal-wargame/scripts/dean_cup_load.mjs`, `causal-wargame/scripts/dean_qa_setup.mjs` y `causal-wargame/docs/orca/QA_SUPABASE.md`.
- **Cambio:**
  - **Credenciales.** Leerlas de `C:\Users\nib1l\Documents\diplocopia\_secrets\copa-v3.env`, fuera del repo: `CW_BASE_URL`, `CW_DEAN_GAME`, `CW_DEAN_PIN` y, opcionalmente, `CW_BOOTSTRAP_SECRET`. Si falta el archivo o algún valor, usar `ask` y esperar. Nunca inventar valores ni reutilizar los de los scripts existentes.
  - **`dean_qa_setup.mjs` (idempotente):**
    - Si hay `CW_BOOTSTRAP_SECRET` y la partida no existe, crearla con `create-game`.
    - Iniciar sesión como facilitador y crear la Copa (`teacher` → `create`).
    - Investigar en las migraciones cómo obtener un torneo nuevo para cada corrida sin borrar datos (cada torneo admite como máximo 30 plazas). Si hace falta una partida nueva por corrida, solo se permiten códigos que empiecen por `CW_DEAN_GAME`. Si la única vía es borrar datos, usar `ask`.
  - **`dean_cup_load.mjs`:**
    - `CW_BASE_URL` es obligatoria y no tiene valor por defecto.
    - **Se niega a ejecutarse** contra `FUTUROS`, `FLOWTEST26`, cualquier código usado en `scripts/` o `.github/workflows/`, o cualquier código que no empiece por `CW_DEAN_GAME`.
    - Usuarios configurables de 1 a 30, con distribución por salas configurable (por ejemplo 6/6/6/6/6 y 1/0/5/6/2).
    - Cada usuario se une, rinde 15 exámenes con 2–8 s de espera entre ellos y consulta `state` al ritmo real (2,7–4,0 s; en la fase `final`, también `quiz_state` cada 1,45–2,05 s).
    - El docente avanza las fases. Se prueban las exportaciones por capa y el Kahoot con respuestas de todos.
    - **Métricas:** p50, p95 y p99 por acción, tasa de errores y número de respuestas 5xx.
    - **Invariantes que comprueba:** `fair_score = suma/(15·inscritos)`; se rechaza un séptimo asiento; no hay filas para ausentes; los CSV de estudiante no incluyen `U`, `Y0`, `Y1` ni el efecto verdadero.
    - **Informe:** `artifacts/load/<fecha>.json` y `.md`, **sin valores secretos**.
- **Restricciones:**
  - Solo la partida de QA. Sin migraciones ni despliegues.
  - No modificar `sustained_load.mjs` ni los smokes existentes.
  - **En esta tarea, como máximo 5 usuarios simultáneos.** La corrida de 30 corresponde a T2.2b.
- **Propiedad:** las rutas listadas y `.gitignore`, si hace falta para `artifacts/`.
- **Aceptación:**
  - Corridas reales con 1 y 5 usuarios en la partida de QA, con el informe en el PR y sin secretos.
  - `node --check` de ambos scripts y `npm run check` en verde.

### T2.2b · 30 concurrentes, reconexión y polling (Supabase del usuario)
- **Agente:** Codex.
- **Sustituye a:** T2.2 y absorbe T4.2.
- **Objetivo:** `scripts/dean_cup_load.mjs`, `src/v2/dean/api.js`, `src/v2/dean/useBoard.js`, `src/v2/dean/CupQuiz.jsx` (solo el polling), `src/v2/dean/player/**` (solo el envío del examen) y migraciones **nuevas**, que solo se redactan.
- **Cambio:**
  - **Medir primero.** Correr 30 usuarios en la partida de QA, con 6/6/6/6/6 y con una distribución desigual, dos veces cada una.
  - **Idempotencia.** Verificar en SQL (`cw_dean_exam_v3`) y en la práctica qué pasa con un doble clic y con un reintento tras un error de red.
    - La corrección preferida va en el cliente: bloquear el envío mientras está en curso y reintentar solo si el servidor confirma que no se guardó.
    - Si hace falta una migración, redactarla con su test y **escalar con `ask`**. No se aplica.
  - **Reconexión.** Probarla con Playwright, usando la build local `vite --mode secure` contra la partida de QA:
    - recargar a mitad de examen reanuda el mismo examen;
    - tras 30 s sin red, el estado se recupera sin duplicados.
  - **Optimizar el cliente** si fallan los umbrales o el `tick` escribe en exceso:
    - pausar el polling con `document.hidden`;
    - usar retroceso progresivo ante errores;
    - eliminar el doble polling de la fase `final`.
  - **Cambios de servidor** (throttle de `cw_dean_tick_v3`, distinguir 4xx de 5xx en la Edge Function): solo se redactan y se escalan. En la ruta corta no se despliegan.
  - Comparar antes y después con números.
- **Restricciones:**
  - Solo la partida de QA.
  - **La corrida de 30 debe terminar antes del jueves 15-oct a las 20:00 COT.**
  - No se aplica ninguna migración ni se despliega nada.
  - Compatible con `legacy_v1`.
- **Propiedad:** las rutas listadas.
- **Aceptación:**
  - Informe de la corrida de 30 con p95 `state` < 800 ms, p95 `exam` < 1200 ms, errores < 0,5 % y 0 respuestas 5xx.
  - Pruebas de reconexión e idempotencia en verde.
  - Tabla de antes y después.

### T4.1b · Revisión de release para la clase del viernes (GO/NO-GO)
- **Agente:** Claude Opus 5.5 · high.
- **Sustituye a:** T4.1 en la ruta corta.
- **Objetivo:** el diff `main...copa-v3` cuando la ola 1 y T2.2b estén integradas.
- **Cambio:**
  - **Revisión de código** con `/code-review high` sobre el diff.
  - **Seguridad:**
    - alcance de tokens;
    - CSV injection;
    - datos exclusivos del docente;
    - bundle seguro (`assert_secure_bundle`);
    - que ninguna migración nueva modifique `FUTUROS`;
    - **que ningún valor de `copa-v3.env` aparezca en el repo, en los informes ni en los artefactos**;
    - el esquema de PIN derivable (hallazgo 5): informe y recomendación, sin cambiar PIN en vivo.
  - **Pedagogía mínima para la clase:** el guion docente es visible en las 7 fases y ningún texto anticipa `U` antes de la fase causal.
  - **Documentación:** `FACILITATOR_RUNBOOK.md` con el guion de la Copa V3 y capturas, y `CHANGELOG.md`.
  - **Checklist del viernes:**
    - URL y código de la partida real, y PIN (sin escribir su valor);
    - el Wall en el proyector, a 1280×720 y a 1920×1080;
    - el plan B: revertir `main` o usar la V2 anterior;
    - quién hace qué durante la clase;
    - el horario de congelamiento.
  - **Plan de reversión:** el comando exacto `git revert -m 1 <merge>` y el tiempo estimado de publicación en Pages.
- **Restricciones:** los hallazgos de código se enrutan a su dueño. Las ediciones directas se limitan a la documentación.
- **Propiedad:** `docs/**`, `FACILITATOR_RUNBOOK.md`, `CHANGELOG.md` y `docs/orca/reports/T4.1b_release.md`.
- **Aceptación:** un informe con veredicto GO/NO-GO, la lista de bloqueantes, el checklist y el plan de reversión.

## 10. Requisitos previos (usuario)

- **Herramientas.** Orca 1.4.225 (en ejecución), Claude Code y Codex con sesión iniciada y `gh` autenticado como `jazaineam1`. Todo verificado.
- **Sin Docker** (decisión del usuario del 14-oct). La única infraestructura es el Supabase del usuario, GitHub Pages y GitHub.
- **Credenciales de QA** en `C:\Users\nib1l\Documents\diplocopia\_secrets\copa-v3.env`, fuera del repo y de los worktrees. **Nunca se commitean ni se imprimen.**
- **ZIP** en `C:\Users\nib1l\Downloads\chapter-causalidad-master.zip` (presente).
- **Fecha de la clase,** para decidir entre la ruta completa y la ruta corta.

## 11. Riesgos principales y mitigación

| Riesgo | Mitigación |
|---|---|
| Se agota la cuota de Claude a mitad de una ola | Límite de 2 agentes de Claude simultáneos, Opus solo en 3 tareas, Codex absorbe la UI de Wall y Docente, y reasignación con aprobación |
| Conflictos de merge en la UI | T0.1 separa la propiedad por carpeta, y el shell y los tokens se congelan después de G0 |
| El diseño "pasa las métricas" pero no gusta | G1 con revisión humana de la hoja de contactos y la referencia `SPECS_JUEGO_UX_UI.md` |
| Afectar a la clase en producción | Merge a `main` y acciones de producción solo en G2 y G3, fuera de horario |
| Carga sobre el Supabase real a menos de 24 h de la clase | Solo en la partida de QA; la corrida de 30 termina antes del jueves a las 20:00; sin migraciones ni despliegues; congelamiento desde el jueves a las 22:00 |
| Datos causales filtrados a los estudiantes | Invariante 4, `assert_secure_bundle`, comprobación en T0.3 y T4.1 |
| Pedagogía incorrecta | T2.3 con Opus contrastado con las especificaciones del ZIP |
