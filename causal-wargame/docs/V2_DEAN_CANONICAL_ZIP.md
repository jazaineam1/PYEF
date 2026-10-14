# Copa del Decano V2 · Implementación basada en `chapter-causalidad-master.zip`

## Fuente de verdad
- `config/simulation_parameters.toml`: parámetros numéricos vigentes para **partidas nuevas**, código Python `core/fatigue.py` y `core/scorer.py`.
- `docs/SPECS_CURSO_CAUSALIDAD.md`: educación por capas, papel del DAG, dos trampas y sesión de 120 minutos.
- `docs/SPECS_JUEGO_UX_UI.md`: 5 salas, 30 plazas de capacidad, arquetipos, deslizadores, Wall y exportaciones.
- `docs/SPECS_SIMULACION_AB_TESTING.md`: intervención aleatorizada **T=1: B=4 h; T=0: B=0 h**, trade-offs en sueño/estudio, dos potenciales y mismos errores.
- `notebooks/01_analisis_capa_1_rector.ipynb`: referencia entregada en el ZIP; en GitHub Pages se añade un *scaffold* nuevo, no se hace pasar por copia literal.

## Decisiones de implementación explícitas
1. **No sobrescribir `FUTUROS`:** ya contiene 15 exámenes calculados por `legacy_v1`; la migración añade `dgp_version` y solo torneos nuevos reciben `zip_dgp_2026`. Las sesiones históricas y V1 conservan su fórmula.
2. **Números del ZIP:** fatiga U 0–100; nota 0–50; descanso óptimo 7,5 h; sueño penalizado por sigmoide, shock de trasnocho, estrés de complejidad y amortiguación de bienestar. Los deslizadores canónicos se toman del TOML aunque algunos rangos abreviados del wireframe UX difieran.
3. **15 exámenes y 11 asignaturas distintas:** `domain/subjects.py` define 11; el orquestador original los reutiliza en ciclos. El simulador hace lo mismo, no inventa cuatro asignaturas.
4. **Reproducibilidad:** PostgreSQL usa Box–Muller determinista a partir de hashes para ruido de examen y fatiga, **el mismo error compartido** bajo ambos mundos; replica pesos y relaciones estructurales, aunque no es bit-a-bit idéntico a NumPy `default_rng`. El experimento usa semilla `2026` y se ejecuta una sola vez por torneo.
5. **A/B independiente del juego:** muestra sintética de 30 personas × 15 exámenes, 450 observaciones. El experimento no se presenta como asignación aleatoria de decisiones de los asistentes; T se asigna por estudiante. Los intervalos de incertidumbre se calculan a nivel de **estudiante**, no con 450 exámenes como si fueran 450 unidades independientes.
6. **Tres capas:** Rector y encuesta permanecen limitados a la sala, con `examen_nro` en Rector como llave extra de unión. `U`, Y(0), Y(1) y el efecto verdadero del A/B solo son exportables por facilitador después de la fase causal.
7. **Asistencia flexible:** capacidad 30, sin mínimo; no se crean participantes ficticios por ausencias. El A/B usa cohorte sintética distinta del grupo real.
8. **Hosting:** Vite/React compilado en GitHub Pages; Supabase guarda datos, calcula notas y protege credenciales.
9. **EconML previo:** el benchmark preexistente procede de **otra simulación**; no debe etiquetarse como estimación de la nueva Copa. Este cambio prioriza la simulación, A/B y la evaluación reservada. Entrenar EconML con el nuevo DGP es un desarrollo posterior separado.

## Flujo de 120 minutos
- 00–10: bienvenida, carné y dos futuros.
- 10–30: Copa, 15 parciales acelerables; ranking por equipo.
- 30–55: Rector, modelo predictivo y sesgo por omisión.
- 55–80: encuesta y DAG, confusor vs mediador.
- 80–105: A/B, IC por estudiante, DML como explicación, ATE/CATE.
- 105–120: ocho preguntas sincronizadas y podio.

**Nota científica:** el ZIP es un simulador pedagógico, no una relación fisiológica clínica validada. El método enseña identificación, no promete que el signo de la pendiente administrativa sea negativo en cualquier cohorte aleatoria.

## QA exigida
CI de unitarias + build; ejecución SQL en `BEGIN/ROLLBACK` sobre un nuevo torneo, 15 exámenes canónicos y 450 potenciales A/B; RLS y ausencia de fugas; prueba HTTP independiente a 30 participantes cuando se necesite carga real; experiencia móvil y recuperación sin conexión; preservar `FUTUROS`.