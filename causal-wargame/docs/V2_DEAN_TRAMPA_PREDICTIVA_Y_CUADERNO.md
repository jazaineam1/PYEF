# Copa del Decano · Trampa predictiva experiencial y cuaderno con huecos

**Solo torneos nuevos `zip_dgp_2026`.** No modifica FUTUROS, V1 ni el DGP. Todo es **sintético**; nada describe a personas reales.
Este documento **actualiza el guion docente** de `V2_DEAN_INTERACTIVE_RELEASE.md` (§2, puntos 8 y 10, y la agenda) para los actos Rector, Encuesta y A/B, y documenta el cuaderno `causalidad_copa_decano_scaffold.ipynb`.
Los textos y números de esta nota se contrastaron con el análisis cuantitativo del DGP (sesión simulada de 30 jugadores y A/B exacto de cada Copa); sus valores quedaron como fixtures de prueba en `tests/fixtures/`.

## 1. Qué cambió y por qué

El diagnóstico frente a los specs del curso (`SPECS_CURSO_CAUSALIDAD.md`, §3 «La trampa de decisión en dos etapas») encontró dos brechas:

| Brecha | Antes | Ahora |
|---|---|---|
| **Segunda trampa solo en texto.** El participante nunca *veía* a un modelo flexible dar un mensaje engañoso. | Python imprimía MAE/R² y tres pendientes OLS. | El participante entrena un **Random Forest** con los datos de su sala, ve **importancia por permutación** y **dependencia parcial**, **simula do(B)** (las mismas filas con B=0 h y con B=4 h) con **rango bootstrap por estudiantes**, y **anota su recomendación**. En el acto A/B esa simulación se **contrasta con el ATE del experimento**. |
| **El participante no escribía código.** El Python era un botón con programa fijo y el notebook estaba resuelto. | 13 celdas completas. | Notebook **fill-in-the-blanks** con **24 huecos** y **autocorrectores** (`assert` + tolerancia numérica) en cuatro partes: (a) OLS cruda / con PGA y Z / con mediadores, (b) RF + permutación + simulación do(B), (c) puerta trasera vs mal control con el DAG, (d) A/B por estudiante con IC entre estudiantes. |

**Por qué no SHAP.** El spec menciona SHAP, pero `shap` no corre en Pyodide. El laboratorio usa lo que sí corre con scikit-learn (importancia por permutación y dependencia parcial), que enseñan la misma lección: *utilidad predictiva ≠ efecto de intervenir*. En Colab, quien termine antes puede añadir `pip install shap` y `shap.plots.scatter` como extensión opcional; no es requisito ni se evalúa.

**Qué NO promete este material** (y por qué importa): no afirma que el bosque «recomienda recortar bienestar». Con el DGP actual eso ocurre solo en una parte de las cohortes, y la simulación puede dar positivo, negativo o plano según la sala y el modelo. La lección es que **dos lecturas del mismo modelo se contradicen y ninguna es do(B)**, no que el bosque falle siempre. Tampoco presupone un R² alto: en salas de 6 el R² de prueba puede ser negativo.

## 2. Qué ve el participante (acto por acto)

### Acto Rector · min 30–55 (paso «Analizar Rector»)
1. Abre **🐍 Predicción real…** y pulsa **▶ Ejecutar Python real** (la primera vez, Pyodide tarda 20–60 s en descargar; úsalo para explicar MAE/R²).
2. La salida muestra, en este orden: MAE/R² en prueba (split **por estudiante**), **importancia por permutación**, **simulación do(B)** con rango bootstrap, **dependencia parcial de B**, **cobertura** (qué porcentaje de exámenes tuvo B≤1 h y B≥3 h; fuera de eso el bosque *extrapola*) y dos lecturas del mismo modelo: «por importancia» y «por simulación». Si el R² de prueba es menor que 0,3 (incluido negativo) aparece un **AVISO**: el bosque casi no generaliza y lo que sigue es poco fiable. Con 6 estudiantes o menos aparece un **AVISO SALA PEQUEÑA**.
3. Bajo la salida aparece **📝 ¿Qué le recomiendas al Rector con este modelo?**: cuatro opciones (recortar, mantener, ampliar, pedir un experimento) y una frase opcional. **Es una nota personal: no puntúa, no mide velocidad y no se envía al servidor** (queda en el `localStorage` del navegador, por código de partida).

### Acto Encuesta · min 55–80 (paso «Cruzar encuesta»)
Mismo laboratorio con **estudio (X₁) y sueño (S)** añadidos. El R² puede cambiar poco o mucho (no hay un «salto» garantizado) y el efecto simulado de B cambia porque la simulación **congela los mediadores**: solo conserva la parte del efecto de B que no pasa por estudio y sueño. Se muestran cuatro coeficientes OLS: cruda, con PGA y complejidad, con mediadores y **con PGA, complejidad y ARQUETIPO** (el arquetipo sí está en la encuesta). Si las columnas de la sala son colineales, el coeficiente se muestra como **«no estimable»** en vez de inventar un número. Pueden **anotar de nuevo** su recomendación.

### Acto A/B · min 80–105 (paso «Analizar A/B»)
Aparece **🔮 Tu predicción frente al experimento**: la simulación del bosque (con su rango bootstrap) y el ATE del A/B con su IC95 **entre estudiantes**, sobre una escala común, junto con la recomendación que anotaron. El texto nunca declara «correcto» al bosque: si cae dentro de un IC muy amplio dice que *no valida* el modelo, solo que no logra descartarlo.

### Salas pequeñas y datos de toda la clase
* Cada sala tiene **como máximo 6 personas** (90 filas) y el CSV de un jugador contiene **solo su sala**. En la sesión simulada de 30 jugadores el R² de prueba del bosque varió entre **−2,5 y +0,82** entre salas, y la pendiente cruda de B salió **positiva** en una sala con solo 2 arquetipos. Por eso el resultado de cada sala es inestable: **compararlo entre salas es parte de la lección**.
* Con **menos de 4 estudiantes distintos** (o sin variación de B) el laboratorio **no inventa registros de la sala**: ejecuta una **REFERENCIA DIDÁCTICA INDEPENDIENTE** (30 estudiantes sintéticos con la estructura del DGP y semilla fija) y lo rotula en la primera línea de la salida y en el contraste del A/B.
* Juntar los CSV de todas las salas exigiría un cambio de servidor (la exportación es por sala) y **no está incluido**. Alternativa sin servidor: el docente reúne los CSV de las salas en uno (mismas columnas, `estudiante_id` único con prefijo de sala) y los participantes lo cargan en el **cuaderno** con el nombre de archivo habitual.

## 3. Guion docente actualizado

| Min | Acción del docente | Pregunta socrática | Qué proyectar |
|---|---|---|---|
| 30–35 | Libera el archivo del Rector; que todos pulsen **Analizar Rector → Ejecutar Python real**. Mientras carga Pyodide explica MAE/R² con unidades de nota. | «¿Qué le diríamos al Rector si solo supiéramos predecir?» | `DeanGuidance` del acto |
| 35–45 | Leer la salida en voz alta, en orden: R² (¿hay aviso?) → importancia → simulación → cobertura. | «¿Qué lectura te tienta a **recortar** y cuál a **ampliar**? ¿Por qué el *mismo* modelo puede dar dos mensajes?» | La salida del laboratorio de un voluntario |
| 45–52 | Pedir que **anoten su recomendación** y que **comparen su número con el de otra sala**. | «¿Quién eligió su B? ¿Qué ve el Rector y qué no?» | Dos o tres salas lado a lado |
| 52–55 | Debrief del acto (botón docente). | «Predecir `E[Y|X]` no es `E[Y|do(B)]`.» | Atlas |
| 55–70 | Encuesta: repetir con 5 variables y mirar el coeficiente con arquetipo. | «¿Cambió tu recomendación? ¿Qué se bloqueó al congelar X₁ y S? ¿Qué cambia al añadir el arquetipo?» | DAG v4, mediadores |
| 80–95 | A/B: generar/revisar A/B; **Analizar A/B**. Que cada persona abra su tarjeta de contraste. | «¿Cayó tu simulación dentro del IC95? ¿Qué *no* te dice eso?» | IC del A/B y tarjetas de varios voluntarios |
| 95–105 | Política y cupos (misión existente). | «Con n=30, ¿qué decisión sostienes y con qué incertidumbre?» | CATE con incertidumbre |

### Si ves… di…
Valores de referencia de la **sesión simulada** y del **A/B exacto** (sintéticos); tu sala variará.

| Si en la salida ves | Di |
|---|---|
| R² de prueba bajo o negativo (p. ej. **−2,5** en una sala de 6) y el AVISO | «El bosque predice peor que la media. No leas nada de lo que sigue: con 6 estudiantes esto es ruido.» |
| Importancia de B ≈ 0 (PGA domina) pero simulación con otro signo | «Dos lecturas del mismo bosque se contradicen. Ninguna es do(B).» |
| La simulación **cambia de signo o de tamaño** al añadir X₁ y S | «Congelaste los mediadores: respondiste otra pregunta.» |
| Rango bootstrap amplio que cruza 0, o cobertura baja (p. ej. 25 % con B≤1 h) | «Inestable y extrapolando: no la vendas como evidencia.» |
| Pendiente con PGA y complejidad **negativa** en tu sala (en 400 cohortes simuladas fue negativa el 100 % de las veces) | «Ajustar solo PGA y complejidad no cierra la puerta trasera aquí: el arquetipo decide qué B puede elegir cada quien.» Mira el coeficiente con arquetipo: en la clase simulada pasó de −0,35 a **+1,84**, pero en una sala de 6 es inestable. |
| «No estimable (columnas colineales)» | «Con pocos datos y estrategias constantes el modelo con mediadores ni siquiera existe. No se inventa el número.» |
| A/B del juego: **17 tratados / 13 control, +0,51 con IC95 [−7,63; +8,65]**, Pragmático **7/0** | «Es el mismo experimento en toda Copa (semilla fija). Con 30 estudiantes el IC es enorme: sirve para ver **heterogeneidad** (Sobreexigido ≈ +9,7 frente a −3,5 y −5,4) más que un efecto medio.» |
| Simulación del bosque **dentro** del IC95 del A/B | «No validó el método: con un IC de ±8 pts casi cualquier cosa cabe dentro. El A/B lo garantiza por diseño; la simulación depende de supuestos.» |

El ATE sintético verdadero de esta cohorte (≈ +1,34) es **solo docente**: sale en la consola del facilitador, no en el material del participante.

**Reglas que no cambian:** nada de esto puntúa; la maestría causal 0–100 sigue viniendo **solo** de decisiones registradas en el servidor tras el debrief; las claves de misiones y quiz permanecen en SQL; no hay puntos por velocidad, cantidad de código ni número de ejecuciones.

## 4. Cuaderno con huecos (`public/notebooks/causalidad_copa_decano_scaffold.ipynb`)

**Uso:** subir a Colab los tres CSV descargados del juego (`sistema_academico_rector.csv`, `encuesta_estudiantes_juego.csv`, `cohorte_ab_test_2026.csv`), ejecutar la celda de preparación y reemplazar cada `None  # ⟵ HUECO …` por una expresión. Cada hueco va seguido de `verificar(...)`, que compara contra un cálculo independiente con tolerancia (`TOL = 1e-6`; 0,3 en la permutación porque el barajado es aleatorio) y, si falla, muestra una **pista** sin dar la solución. Si la sala tiene menos de 4 estudiantes, B no varía o sus columnas son colineales, las partes A–C usan la referencia rotulada y el cuaderno dice por qué.

| Parte | Huecos | Kolb | Tiempo sugerido (breakouts) |
|---|---|---|---|
| A · Tres asociaciones OLS | a1–a3 | Observación reflexiva | Bloque 3 (30–55): 10 min |
| B · RF, permutación, do(B) simulado | b1–b7 | Observación reflexiva | Bloque 3: 15 min |
| C · DAG: puerta trasera vs mal control | c1–c5 | Conceptualización abstracta | Bloque 5 (80–105): 10 min |
| D · A/B por estudiante, IC y falsa precisión | d1–d7 | Experimentación activa | Bloque 5: 10 min |
| E · Contraste y recomendación final | e1–e2 | Experimentación activa | Bloque 5: 5 min |

* **Sin puntos ni cronómetro.** El «tablero» final solo lista qué huecos se resolvieron; no se envía a ningún servidor.
* **Los autocorrectores no exigen ningún signo.** Verifican cálculos (valor con tolerancia, estructura del objeto, reglas del DAG: el ajuste debe contener H y **ningún descendiente de B**), nunca «la pendiente debe ser positiva/negativa». Una prueba corre el cuaderno resuelto en salas con pendiente de H,Z negativa y positiva y con la clase completa.
* **El arquetipo es el confusor medido en estos datos.** Una celda dada compara el ajuste con arquetipo; los textos advierten que ajustar solo PGA y complejidad no garantiza cerrar la puerta trasera.
* **Solucionario del docente.** Las soluciones **no** están en `public/` (no se despliegan): viven en `docs/facilitator/notebook_solutions.json`. Para generar el cuaderno resuelto en tu máquina: `node scripts/notebook_solver.mjs cuaderno_resuelto.ipynb`. No lo publiques ni lo subas a `public/`.
* Los autocorrectores usan una ruta de cálculo independiente de la solución (p. ej. `LinearRegression` frente a `coef_b`, Welch `ttest_ind` frente al error estándar manual).
* La referencia didáctica del cuaderno es **la misma** que usa la app; una prueba falla si divergen.

## 5. Pruebas y verificación

* `tests/v2_dean_predictive_trap.test.mjs`: contrato `##RESULT`, validación de datos dudosos, notas locales sin red ni tiempo, contraste con el A/B, y **ejecución real** de los programas con scikit-learn. Valida **tolerancias numéricas contra los valores exactos** del análisis: las cinco salas de la sesión simulada (MAE, R² —incluido −2,534—, pendientes y modelo no estimable de la sala 1), la clase completa (R² 0,644; −2,28 / −0,35 / −1,95; +1,84 con arquetipo) y el A/B de cada Copa (17/13, +0,51, IC95 [−7,63; +8,65], DML 1,51, Pragmático sin controles).
* `tests/v2_dean_notebook_fill_in.test.mjs`: estructura nbformat, 24 huecos con solución y autocorrector, que el cuaderno publicado **no filtra** las soluciones, que falla con pista sin resolver, que **pasa los 24 autocorrectores resuelto** (sala, clase, referencia y sala colineal), que ninguno exige un signo y que rechaza ocho respuestas incorrectas.
* Fixtures sintéticos: `tests/fixtures/` (ver su `README.md`).
* Las pruebas de ejecución necesitan Python 3 con numpy, pandas, scipy, scikit-learn y matplotlib; si faltan se **omiten con aviso** (define `CW_PYTHON` para apuntar a un intérprete). CI instala esa pila fijada para reflejar Pyodide 0.27 (`causal-wargame-ci.yml`).
* Verificado además en **Pyodide 0.27.7 real** (navegador integrado): mismos números que CPython, recomendación guardada, tarjeta de contraste visible.

## 6. Límites honestos y siguiente paso

* La simulación do(B) es una **predicción observacional**. En estos datos el arquetipo determina el PGA y qué B puede elegir cada quien (los soportes de B casi no se solapan entre arquetipos), así que ni el ajuste por PGA y complejidad ni el bosque tienen garantía causal; el efecto medio verdadero es ≈ +1,3 y positivo solo para el Sobreexigido (≈ +10), según el análisis del DGP.
* **El A/B es idéntico en cada Copa** (semilla fija `'2026'`): quien ya jugó conoce la respuesta, y con 30 estudiantes la potencia para ver un ATE > 0 es muy baja. No está en el alcance de esta nota cambiarlo; sí está explícito en el material (texto del cuaderno y tabla «Si ves… di…»).
* Los enunciados de las preguntas ABC del acto Rector (`DeanLearningArc.jsx`) todavía mencionan un R² alto; no se modificaron aquí porque su revisión se atiende por separado.
* Tiempos de Pyodide con 30 dispositivos reales **no están certificados** (el cálculo añade ~10 bootstraps de bosques pequeños); el temporizador separa descarga (90 s) y cálculo (120 s) y el docente puede continuar con la explicación sin puntos falsos.
* Las recomendaciones son locales: el docente **no** puede agregarlas. Persistirlas en el servidor, o exportar los CSV de toda la clase, requeriría una migración nueva (tabla con RLS y RPC) y se propone como mejora aparte, sin puntos ni claves.
