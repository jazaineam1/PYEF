# DOS FUTUROS CAMPUS V2 · Adaptación de `chapter-causalidad-master.zip`

## Origen y precedencia

Este cambio toma sus **ecuaciones** de `src/chapter_causalidad/core/fatigue.py`, `scorer.py`, `ab_experiment.py` y las constantes de `config/simulation_parameters.toml` en el ZIP entregado por el capacitador (fecha 2026-10-14). Las pantallas y fases siguen la estructura pedagógica de `SPECS_CURSO_CAUSALIDAD.md` y `SPECS_JUEGO_UX_UI.md`.

- **DGP v4 (nuevo):** usa la fatiga logística con umbral de trasnocho, amplificación por complejidad y buffer de bienestar; la nota usa PGA ajustado, complejidad, estudio, sueño, efecto directo de bienestar, penalidad no lineal y ruido. Valores numéricos copiados del TOML.
- **DGP legacy_v1 (existente):** permanece tal como estaba para las partidas ya creadas, incluido `FUTUROS`. La migración agrega `dgp_version` con `legacy_v1` para registros existentes y establece `source_v4` como defecto para **partidas nuevas**.
- **Ruido:** la distribución normal del backend usa un Box–Muller determinista basado en `seed=2026`, identificador de partida, estudiante y examen. Reproduce la **estructura, parámetros y semilla declarada**, pero **NO la secuencia de bits exacta** que generaría NumPy PCG64 en el repositorio Python. La verdad sintética se conserva en base de datos.
- **Asignaturas:** once materias del catálogo del ZIP, rotadas para cubrir 15 parciales; complejidad no se revela en el momento de decidir.
- **Arquetipos:** son personajes de UX y segmentación, no causas primitivas del DAG. El PGA en riesgo se acota a `[2,3]` en nuevos estudiantes. Los sliders del juego siguen los rangos de `SPECS_JUEGO_UX_UI.md`, que no son idénticos a los rangos de generación de cohorte del TOML; el A/B sí aplica los valores basales y rangos del TOML.
- **Capas de evidencia:** Capa 1 (Rector), Capa 2 (encuesta), Capa 3 (verdad solo docente). El archivo de Rector mantiene la columna de examen como **extensión técnica** para poder enlazar sin ambigüedad las capas 1 y 2.
- **A/B Doctor Strange:** dos mundos `do(B=0)` y `do(B=4)`, con ruido compartido y tratamiento asignado **una vez por estudiante**. Alumnos solo descargan el brazo observado y un resumen agregado; docente recibe ATE verdadero y CATE por arquetipo sintéticos.
- **Laboratorio:** `public/notebooks/Copa_Decano_DGP_v4_30.ipynb` aplica OLS agrupado, Random Forest con separación por estudiante, DAG, A/B con intervalo por unidad aleatorizada y DML opcional.

## Integración docente de 120 minutos

La Copa es la EXPERIENCIA concreta (10–30 min); Rector (30–55) crea conflicto cognitivo, Encuesta y DAG (55–80) permiten conceptualización, A/B/DML (80–105) hacen validación y el Kahoot (105–120) cierra. No se obliga a 30 micro-momentos ni a ejecutar 17 bloques Python. El código muestra las explicaciones junto a la evidencia cuando cada fase queda disponible.

## Certificación pendiente antes de la publicación

1. Las 28 pruebas Python originales ya pasaron en el ZIP sin modificaciones.
2. Ejecutar migraciones nuevas dentro de `BEGIN/ROLLBACK` en Supabase y contrastar escenarios con resultados del modelo Python; estimación en 30 estudiantes y 450 pares sin filtraciones.
3. CI `npm run check` y compilación segura de Pages, revisión móvil / Wall.
4. Deploy seguro: SQL, función `v2-dean-cup` y finalmente GitHub Pages.
5. Probar nueva partida QA y 30 conexiones reales; **no activar el DGP v4 en `FUTUROS`**, que tiene un torneo anterior activo.
6. Diferenciar EconML real de V2 anterior: sus benchmarks son de otro DGP y no se reutilizarán como si fueran resultados entrenados sobre esta Copa.