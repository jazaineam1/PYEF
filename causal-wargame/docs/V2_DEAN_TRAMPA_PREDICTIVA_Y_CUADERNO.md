# Copa del Decano · Trampa predictiva experiencial y cuaderno con huecos

**Solo torneos nuevos `zip_dgp_2026`.** No modifica FUTUROS, V1 ni el DGP. Todo es **sintético**; nada describe a personas reales.
Este documento **actualiza el guion docente** de `V2_DEAN_INTERACTIVE_RELEASE.md` (§2, puntos 8 y 10, y la agenda) para los actos Rector, Encuesta y A/B, y documenta el cuaderno `causalidad_copa_decano_scaffold.ipynb`.

## 1. Qué cambió y por qué

El diagnóstico frente a los specs del curso (`SPECS_CURSO_CAUSALIDAD.md`, §3 «La trampa de decisión en dos etapas») encontró dos brechas:

| Brecha | Antes | Ahora |
|---|---|---|
| **Segunda trampa solo en texto.** El participante nunca *veía* a un modelo flexible recomendar mal. | Python imprimía MAE/R² y tres pendientes OLS. | El participante entrena un **Random Forest** con los datos de su sala, ve **importancia por permutación** y **dependencia parcial**, **simula do(B)** (las mismas filas con B=0 h y con B=4 h), con **rango bootstrap por estudiantes**, y **anota su recomendación**. En el acto A/B esa simulación se **contrasta con el ATE del experimento**. |
| **El participante no escribía código.** El Python era un botón con programa fijo y el notebook estaba resuelto. | 13 celdas completas. | Notebook **fill-in-the-blanks** con **24 huecos** y **autocorrectores** (`assert` + tolerancia numérica) en cuatro partes: (a) OLS cruda / con PGA y Z / con mediadores, (b) RF + permutación + simulación do(B), (c) puerta trasera vs mal control con el DAG, (d) A/B por estudiante con IC entre estudiantes. |

**Por qué no SHAP.** El spec menciona SHAP, pero `shap` no corre en Pyodide. El laboratorio usa lo que sí corre con scikit-learn (importancia por permutación y dependencia parcial), que enseñan la misma lección: *utilidad predictiva ≠ efecto de intervenir*. En Colab, quien termine antes puede añadir `pip install shap` y `shap.plots.scatter` como extensión opcional; no es requisito ni se evalúa.

## 2. Qué ve el participante (acto por acto)

### Acto Rector · min 30–55 (paso «Analizar Rector»)
1. Abre **🐍 Predicción real…** y pulsa **▶ Ejecutar Python real** (la primera vez, Pyodide tarda 20–60 s en descargar; úsalo para explicar MAE/R²).
2. La salida muestra, en este orden: MAE/R² en prueba (split **por estudiante**), **importancia por permutación**, **simulación do(B)** con rango bootstrap, **dependencia parcial de B**, **cobertura** (qué porcentaje de exámenes tuvo B≤1 h y B≥3 h; fuera de eso el bosque *extrapola*) y dos lecturas del mismo modelo: «por importancia» y «por simulación».
3. Bajo la salida aparece **📝 ¿Qué le recomiendas al Rector con este modelo?**: cuatro opciones (recortar, mantener, ampliar, pedir un experimento) y una frase opcional. **Es una nota personal: no puntúa, no mide velocidad y no se envía al servidor** (queda en el `localStorage` del navegador, por código de partida).

### Acto Encuesta · min 55–80 (paso «Cruzar encuesta»)
Mismo laboratorio con **estudio (X₁) y sueño (S)** añadidos. Verán que el **R² no mejora la validez causal** y que el efecto simulado de B cambia, porque la simulación **congela los mediadores**: solo conserva la parte del efecto de B que no pasa por estudio y sueño. Siguen visibles las tres pendientes OLS y la regla del DAG. Pueden **anotar de nuevo** su recomendación.

### Acto A/B · min 80–105 (paso «Analizar A/B»)
Aparece **🔮 Tu predicción frente al experimento**: la simulación del bosque (con su rango bootstrap) y el ATE del A/B con su IC95 **entre estudiantes**, sobre una escala común, junto con la recomendación que anotaron. El texto nunca declara «correcto» al bosque: si cae dentro de un IC muy amplio dice que *no valida* el modelo, solo que no logra descartarlo.

### Salas pequeñas
Con **menos de 4 estudiantes distintos** (o sin variación de B) el laboratorio **no inventa registros de la sala**: ejecuta una **REFERENCIA DIDÁCTICA INDEPENDIENTE** (30 estudiantes sintéticos con la estructura del DGP y semilla fija) y lo rotula en la primera línea de la salida y en el contraste del A/B. Con 4 o 5 estudiantes sí usa la sala, pero el rango bootstrap será enorme: esa inestabilidad **es** parte de la lección.

## 3. Guion docente actualizado

| Min | Acción del docente | Pregunta socrática | Qué proyectar |
|---|---|---|---|
| 30–35 | Libera el archivo del Rector; que todos pulsen **Analizar Rector → Ejecutar Python real**. Mientras carga Pyodide explica MAE/R² con unidades de nota. | «¿Qué le diríamos al Rector si solo supiéramos predecir?» | `DeanGuidance` del acto |
| 35–45 | Leer la salida en voz alta, en orden: R² → importancia → simulación → cobertura. | «¿Qué lectura te tienta a **recortar** y cuál a **ampliar**? ¿Por qué el *mismo* modelo da dos mensajes?» | La salida del laboratorio de un voluntario |
| 45–52 | Pedir que **anoten su recomendación** antes del debrief. | «¿Quién eligió su B? ¿Qué ve el Rector y qué no?» | Opciones de recomendación |
| 52–55 | Debrief del acto (botón docente). | «Predecir `E[Y|X]` no es `E[Y|do(B)]`.» | Atlas |
| 55–70 | Encuesta: repetir con 5 variables. | «El R² subió: ¿cambió tu recomendación? ¿Qué se bloqueó al congelar X₁ y S?» | DAG v4, mediadores |
| 80–95 | A/B: generar/revisar A/B; **Analizar A/B**. Que cada persona abra su tarjeta de contraste. | «¿Cayó tu simulación dentro del IC95? ¿Qué *no* te dice eso?» | IC del A/B y tarjetas de varios voluntarios |
| 95–105 | Política y cupos (misión existente). | «Con n=30, ¿qué decisión sostienes y con qué incertidumbre?» | CATE con incertidumbre |

### Si ves… di…
Los números varían por sala; estos son **ejemplos de ensayo local con datos sintéticos**.

| Si en la salida ves | Di |
|---|---|
| Importancia de B ≈ 0 pero simulación **positiva** (p. ej. +1,4 pts) | «Dos lecturas del mismo bosque se contradicen. Ninguna es do(B).» |
| Con X₁ y S la simulación **se encoge** (p. ej. +0,5 pts) y el R² no empeora | «Más ajuste predictivo, menos efecto total: congelaste los mediadores.» |
| Rango bootstrap amplio y cruza 0 | «La simulación es inestable con pocos estudiantes; no la vendas como evidencia.» |
| Cobertura baja (p. ej. 25 % con B≤1 h) | «Estamos extrapolando fuera de lo observado (positividad).» |
| A/B con IC95 muy amplio (p. ej. −2,2 [−10,7; +6,4]) | «30 estudiantes dan un IC ancho; el punto puede incluso tener el signo contrario al efecto verdadero. Ningún método gana por coincidir una vez.» |
| Simulación **dentro** del IC95 | «No validó el método: el A/B lo garantiza por diseño, la simulación depende de supuestos.» |

**Reglas que no cambian:** nada de esto puntúa; la maestría causal 0–100 sigue viniendo **solo** de decisiones registradas en el servidor tras el debrief; las claves de misiones y quiz permanecen en SQL; no hay puntos por velocidad, cantidad de código ni número de ejecuciones. La verdad sintética del A/B se descarga solo desde la consola docente.

## 4. Cuaderno con huecos (`public/notebooks/causalidad_copa_decano_scaffold.ipynb`)

**Uso:** subir a Colab los tres CSV descargados del juego (`sistema_academico_rector.csv`, `encuesta_estudiantes_juego.csv`, `cohorte_ab_test_2026.csv`), ejecutar la celda de preparación y reemplazar cada `None  # ⟵ HUECO …` por una expresión. Cada hueco va seguido de `verificar(...)`, que compara contra un cálculo independiente con tolerancia (`TOL = 1e-6`; 0,3 en la permutación porque el barajado es aleatorio) y, si falla, muestra una **pista** sin dar la solución. Si la sala tiene menos de 4 estudiantes, las partes A–C usan la referencia rotulada.

| Parte | Huecos | Kolb | Tiempo sugerido (breakouts) |
|---|---|---|---|
| A · Tres asociaciones OLS | a1–a3 | Observación reflexiva | Bloque 3 (30–55): 10 min |
| B · RF, permutación, do(B) simulado | b1–b7 | Observación reflexiva | Bloque 3: 15 min |
| C · DAG: puerta trasera vs mal control | c1–c5 | Conceptualización abstracta | Bloque 5 (80–105): 10 min |
| D · A/B por estudiante, IC y falsa precisión | d1–d7 | Experimentación activa | Bloque 5: 10 min |
| E · Contraste y recomendación final | e1–e2 | Experimentación activa | Bloque 5: 5 min |

* **Sin puntos ni cronómetro.** El «tablero» final solo lista qué huecos se resolvieron; no se envía a ningún servidor.
* **Solucionario del docente.** Las soluciones **no** están en `public/` (no se despliegan): viven en `docs/facilitator/notebook_solutions.json`. Para generar el cuaderno resuelto en tu máquina: `node scripts/notebook_solver.mjs cuaderno_resuelto.ipynb`. No lo publiques ni lo subas a `public/`.
* Los autocorrectores usan una ruta de cálculo independiente de la solución (p. ej. `LinearRegression` frente a `coef_b`, Welch `ttest_ind` frente al error estándar manual) y comprueban reglas del DAG (el ajuste debe contener H y **ningún descendiente de B**).
* La referencia didáctica del cuaderno es **la misma** que usa la app; una prueba falla si divergen.

## 5. Pruebas y verificación

* `tests/v2_dean_predictive_trap.test.mjs`: contrato `##RESULT`, validación de datos dudosos, notas locales, contraste con el A/B (ATE por estudiante calculado a mano), ausencia de red/tiempo en el módulo de notas, y **ejecución real** de los programas con scikit-learn sobre CSV en el formato del juego (sala de 8, de 4, de 2–3 → referencia, sin filas → referencia, determinismo, A/B).
* `tests/v2_dean_notebook_fill_in.test.mjs`: estructura nbformat, 24 huecos con solución y autocorrector, que el cuaderno publicado **no filtra** las soluciones, que falla con pista sin resolver, que **pasa los 24 autocorrectores resuelto**, que rechaza ocho respuestas incorrectas y que sigue funcionando con referencia.
* Las pruebas de ejecución necesitan Python 3 con numpy, pandas, scipy, scikit-learn y matplotlib; si faltan se **omiten con aviso** (define `CW_PYTHON` para apuntar a un intérprete). CI instala esa pila fijada para reflejar Pyodide 0.27 (`causal-wargame-ci.yml`).
* Verificado además en **Pyodide 0.27.7 real** (navegador integrado): mismos números que CPython (+1,41 / +0,50 pts en la sala de ensayo de 8 estudiantes), recomendación guardada, tarjeta de contraste visible.

## 6. Límites honestos y siguiente paso

* La simulación do(B) es una **predicción observacional**; en este DGP, ajustar por H y Z puede acercarla al efecto total (y a veces lo hace), pero solo bajo supuestos que el A/B garantiza por diseño. El material evita presentar el resultado como «el bosque falla siempre».
* Tiempos de Pyodide con 30 dispositivos reales **no están certificados** (el cálculo añade ~10 bootstraps de bosques pequeños); si un equipo es lento, el temporizador separa descarga (90 s) y cálculo (120 s) y el docente puede continuar con la explicación sin puntos falsos.
* Las recomendaciones son locales: el docente **no** puede agregarlas. Persistirlas en el servidor para proyectar «qué recomendó la sala» requeriría una migración nueva (tabla con RLS y RPC), y se propone como mejora aparte, sin puntos ni claves.
