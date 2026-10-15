// Programas Python reales (Pyodide + scikit-learn + pandas) del laboratorio de la Copa del Decano.
// Se mantienen en un módulo puro para poder compilarlos y EJECUTARLOS en las pruebas de Node.
// Ninguno contiene claves de respuesta: calculan sobre los CSV de la sala o sobre una
// REFERENCIA DIDÁCTICA INDEPENDIENTE claramente rotulada. Nada aquí puntúa ni mide velocidad.

// Contrato con la interfaz: cada programa imprime UNA línea «##RESULT {json}» que la UI
// extrae (ver dean-predictive-trap.js) para guardar la simulación do(B) del participante.
export const TRAP_RESULT_PREFIX='##RESULT ';

// Preludio compartido por los pasos «rector» y «survey»: carga de la sala (o referencia),
// DGP de la referencia y el análisis Random Forest que SIMULA do(B) sobre las mismas filas.
export const LAB_PRELUDE=String.raw`
import json
import numpy as np, pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.inspection import permutation_importance
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import GroupShuffleSplit

B_BAJO, B_ALTO = 0.0, 4.0
DIFICULTAD = [9.0, 8.5, 8.0, 7.5, 7.0, 6.0, 4.5, 4.0, 3.5, 3.0, 2.5]
# (estudiantes, rango PGA, (min, defecto, max) de estudio, sueño y bienestar) por arquetipo canónico
PERFILES = {
    "Sobreexigido": (8, (3.8, 4.8), (8, 11.5, 14), (2, 3.5, 5), (0, 0.6, 1.5)),
    "Equilibrado": (8, (3.4, 4.3), (4, 6, 8), (6.5, 7.5, 8.5), (1.5, 2.5, 3.5)),
    "En riesgo": (7, (2.0, 3.0), (2, 3.5, 5.5), (4.5, 6, 7), (1.5, 2.5, 4)),
    "Pragmático": (7, (3.0, 3.6), (0.5, 1.5, 3.5), (7, 8.5, 9.5), (3.5, 4.8, 6)),
}
ETIQUETA = {"pga_previo": "PGA previo H", "complejidad": "Complejidad Z", "horas_bienestar_sem": "Bienestar B",
            "horas_estudio": "Estudio X1", "horas_sueno": "Sueño S"}

def nota_dgp(pga, comp, est, sue, bie, ruido):
    # Misma estructura que el simulador de la Copa (fatiga latente U incluida); solo se usa en la referencia.
    bie = np.minimum(bie, 6.0)
    choque = np.where((sue < 4.0) & (est > 8.0), 15.0, 0.0)
    u = np.clip(10.0 + 60.0 / (1.0 + np.exp((sue - 4.0) * 1.2)) + 2.0 * np.maximum(0.0, est - 3.0) + choque
                + 1.5 * np.maximum(0.0, comp - 5.0) - 4.5 * bie + 2.0 * ruido, 0.0, 100.0)
    castigo = 0.15 * np.maximum(0.0, u - 20.0) + 0.12 * np.maximum(0.0, u - 60.0) ** 1.25
    return np.clip(30.0 + 10.0 * (pga - 3.5) - 1.8 * (comp - 5.5) + 2.6 * (est - 4.0) + 0.8 * (sue - 7.5)
                   + 0.5 * bie - castigo + 1.6 * ruido, 0.0, 50.0)

def referencia_didactica():
    # 30 estudiantes SINTÉTICOS × 15 exámenes con semilla fija. No son participantes ni tu sala.
    rng = np.random.default_rng(20261015)
    filas = []
    k = 0
    for arquetipo, (cantidad, (pga_lo, pga_hi), estudio, sueno, bienestar) in PERFILES.items():
        for _ in range(cantidad):
            k += 1
            pga = round(float(rng.uniform(pga_lo, pga_hi)), 1)
            for examen in range(15):
                elige = lambda t: float(np.clip(np.round(rng.triangular(t[0], t[1], t[2]) * 2) / 2, t[0], t[2]))
                est, sue, bie = elige(estudio), elige(sueno), elige(bienestar)
                filas.append(dict(estudiante_id="ref_%02d" % k, examen_nro=examen + 1, arquetipo=arquetipo,
                                  pga_previo=pga, complejidad=DIFICULTAD[examen % 11], horas_estudio=est,
                                  horas_sueno=sue, horas_bienestar_sem=bie, ruido=float(rng.normal())))
    d = pd.DataFrame(filas)
    d["nota_final"] = np.round(nota_dgp(d.pga_previo.to_numpy(), d.complejidad.to_numpy(), d.horas_estudio.to_numpy(),
                                        d.horas_sueno.to_numpy(), d.horas_bienestar_sem.to_numpy(), d.ruido.to_numpy()), 1)
    return d.drop(columns=["ruido"])

def cargar_sala(columnas):
    # Devuelve (datos, origen, texto). Con menos de 4 estudiantes distintos NO se inventan registros de la sala:
    # se usa la referencia, siempre rotulada.
    d = pd.DataFrame(payload.get("rows", []))
    if "estudiante_id" not in d:
        d["estudiante_id"] = ""
    for c in columnas:
        d[c] = pd.to_numeric(d[c], errors="coerce") if c in d else np.nan
    d = d.dropna(subset=columnas).reset_index(drop=True)
    if d.estudiante_id.nunique() >= 4 and len(d) >= 20 and d.horas_bienestar_sem.nunique() > 1:
        return d, "sala", "OBSERVACIONES DE TU SALA (datos sintéticos de la Copa). Split por estudiante, sin fuga entre exámenes."
    return (referencia_didactica(), "referencia",
            "REFERENCIA DIDÁCTICA INDEPENDIENTE: 30 estudiantes sintéticos con la estructura del DGP y semilla fija. "
            "NO es tu sala, NO son datos reales. Tu sala aún no tiene 4 estudiantes con variación suficiente.")

def efecto_sim(modelo, X, ib):
    # do(B) SIMULADO: las MISMAS filas con B=0 y con B=4; el resto de columnas queda como se observó.
    alto, bajo = X.copy(), X.copy()
    alto[:, ib], bajo[:, ib] = B_ALTO, B_BAJO
    return float(np.mean(modelo.predict(alto) - modelo.predict(bajo)))

def barra(valor, escala):
    n = int(round(max(0.0, valor) / max(escala, 1e-9) * 12))
    return "#" * min(n, 12)

def analizar_rf(d, features, etiqueta_modelo):
    X = d[features].to_numpy(dtype=float)
    y = d.nota_final.to_numpy(dtype=float)
    grupos = d.estudiante_id.to_numpy()
    ib = features.index("horas_bienestar_sem")
    a, b = next(GroupShuffleSplit(n_splits=1, test_size=.33, random_state=19).split(X, y, groups=grupos))
    evaluador = RandomForestRegressor(n_estimators=45, min_samples_leaf=3, random_state=13, n_jobs=1).fit(X[a], y[a])
    pred = evaluador.predict(X[b])
    mae, r2 = mean_absolute_error(y[b], pred), r2_score(y[b], pred)
    print(etiqueta_modelo, "· variables:", ", ".join(features))
    print("Muestra:", len(d), "registros de", d.estudiante_id.nunique(), "estudiantes; prueba:", len(b))
    print("MAE de prueba:", round(mae, 2), "puntos")
    print("R² de prueba:", round(r2, 3))
    # Importancia por permutación: cuánto R² se pierde al barajar una columna (en prueba si hay filas suficientes).
    Xi, yi, donde = (X[b], y[b], "prueba") if len(b) >= 30 else (X[a], y[a], "ENTRENAMIENTO (muestra pequeña: optimista)")
    imp = permutation_importance(evaluador, Xi, yi, n_repeats=8, random_state=7, scoring="r2", n_jobs=1)
    orden = np.argsort(-imp.importances_mean)
    print("— IMPORTANCIA POR PERMUTACIÓN (caída de R² al barajar la columna; datos de " + donde + ") —")
    for i in orden:
        print("  %-14s %6.3f %s" % (ETIQUETA[features[i]], imp.importances_mean[i], barra(imp.importances_mean[i], imp.importances_mean.max())))
    print("  Importancia = utilidad PREDICTIVA. No mide el efecto de intervenir esa variable.")
    # Modelo final con todas las filas para simular la intervención.
    final = RandomForestRegressor(n_estimators=45, min_samples_leaf=3, random_state=13, n_jobs=1).fit(X, y)
    ate_sim = efecto_sim(final, X, ib)
    azar = np.random.default_rng(101)
    ids = np.unique(grupos)
    indices = {g: np.where(grupos == g)[0] for g in ids}
    repeticiones = []
    for _ in range(10):
        elegidos = azar.choice(ids, size=len(ids), replace=True)
        idx = np.concatenate([indices[g] for g in elegidos])
        m = RandomForestRegressor(n_estimators=20, min_samples_leaf=3, random_state=int(azar.integers(1_000_000)), n_jobs=1).fit(X[idx], y[idx])
        repeticiones.append(efecto_sim(m, X, ib))
    p10, p90 = (float(v) for v in np.percentile(repeticiones, [10, 90]))
    cuadricula = [0.0, 1.0, 2.0, 3.0, 4.0, 5.0, 6.0]
    pdp = []
    for g in cuadricula:
        Xg = X.copy()
        Xg[:, ib] = g
        pdp.append(float(final.predict(Xg).mean()))
    print("— SIMULACIÓN do(B) CON EL RANDOM FOREST: las mismas filas con B=0 h y con B=4 h —")
    print("Nota prevista media con B=0 h:", round(pdp[0], 2))
    print("Nota prevista media con B=4 h:", round(pdp[4], 2))
    print("EFECTO SIMULADO (B=4 − B=0):", ("%+.2f" % ate_sim), "puntos · rango bootstrap por estudiantes (p10–p90): [%+.2f, %+.2f]" % (p10, p90))
    print("— DEPENDENCIA PARCIAL DE B (nota prevista media si todas las filas tuvieran ese B) —")
    for g, v in zip(cuadricula, pdp):
        print("  B=%d h  %6.2f  (%+.2f frente a B=0)" % (g, v, v - pdp[0]))
    bien = d.horas_bienestar_sem.to_numpy(dtype=float)
    cov_bajo, cov_alto = float((bien <= 1.0).mean()), float((bien >= 3.0).mean())
    print("COBERTURA: solo %.0f %% de los exámenes ocurrieron con B ≤ 1 h y %.0f %% con B ≥ 3 h (rango observado %.1f–%.1f h)." % (100 * cov_bajo, 100 * cov_alto, bien.min(), bien.max()))
    print("Fuera de lo observado, el bosque repite el valor del borde: es EXTRAPOLACIÓN, no evidencia.")
    return dict(ate_sim=ate_sim, p10=p10, p90=p90, mae=float(mae), r2=float(r2), cov_bajo=cov_bajo, cov_alto=cov_alto,
                top=features[int(orden[0])], b_importancia=float(imp.importances_mean[ib]),
                b_relativa=float(max(0.0, imp.importances_mean[ib]) / max(imp.importances_mean.max(), 1e-9)),
                n_estudiantes=int(d.estudiante_id.nunique()), n_filas=int(len(d)))

def lecturas(r):
    # Dos lecturas PREDICTIVAS del mismo modelo. Ninguna es do(B); solo el experimento arbitra.
    recortar_imp = r["b_relativa"] < 0.10
    recortar_sim = round(r["ate_sim"], 2) <= 0.5
    print("LECTURA 1 · IMPORTANCIA: B pesa %.0f %% de la variable líder (%s) → %s" % (
        100 * r["b_relativa"], ETIQUETA[r["top"]],
        "«B casi no ayuda a predecir» → tentación de RECORTAR." if recortar_imp else "«B ayuda a predecir» → tentación de CONSERVAR o AMPLIAR."))
    print("LECTURA 2 · SIMULACIÓN do(B): %+.2f puntos (umbral didáctico ±0.5) → %s" % (
        r["ate_sim"], "«no se ve ganancia» → tentación de RECORTAR." if recortar_sim else "«se ve ganancia» → tentación de AMPLIAR."))
    if recortar_imp != recortar_sim:
        print("Las dos lecturas del MISMO modelo se contradicen: importancia predictiva ≠ efecto de intervenir.")
    else:
        print("Las dos lecturas coinciden, pero eso tampoco las vuelve causales: no hubo asignación aleatoria.")

def emitir(modo, origen, r, mediadores_congelados):
    salida = dict(r, modo=modo, origen=origen, mediadores_congelados=mediadores_congelados)
    print("##RESULT " + json.dumps(salida))
`;

export const PYTHON_PROGRAMS={
 rector:LAB_PRELUDE+String.raw`
d, origen, texto = cargar_sala(["pga_previo", "complejidad", "horas_bienestar_sem", "nota_final"])
print(texto)
r = analizar_rf(d, ["pga_previo", "complejidad", "horas_bienestar_sem"], "ACTO RECTOR · modelo con los datos administrativos")
lecturas(r)
print("POR QUÉ NO ES do(B): (1) cada estudiante ELIGIÓ su B según su perfil, no se asignó al azar;")
print("(2) el Rector no ve estudio, sueño ni fatiga, que dependen de B; (3) arriba se ve cuánto se extrapola.")
print("PREDICCIÓN: nota prevista. No hay T aleatorizado; NO es efecto causal. Anota tu recomendación abajo.")
emitir("rector", origen, r, False)
`,
 survey:LAB_PRELUDE+String.raw`
d, origen, texto = cargar_sala(["pga_previo", "complejidad", "horas_bienestar_sem", "horas_estudio", "horas_sueno", "nota_final"])
print(texto)
print("Datos:", len(d), "exámenes; estudiantes:", d.estudiante_id.nunique())
base = ["pga_previo", "complejidad", "horas_bienestar_sem"]
rector3 = analizar_rf(d, base, "Referencia: modelo del Rector (3 variables)")
print("")
r = analizar_rf(d, base + ["horas_estudio", "horas_sueno"], "ACTO ENCUESTA · modelo con estudio y sueño añadidos")
print("R² pasó de %.3f a %.3f al añadir X1 y S; el efecto simulado de B pasó de %+.2f a %+.2f." % (rector3["r2"], r["r2"], rector3["ate_sim"], r["ate_sim"]))
lecturas(r)
print("MEDIADORES CONGELADOS: al fijar X1 y S en lo observado, la simulación solo conserva la parte del efecto de B que NO pasa por")
print("estudio y sueño (caminos B→X1 y B→S→U→Y). Si B actúa a través de ellos, ese efecto TOTAL puede quedar bloqueado.")
print("Un R² más alto NO vuelve causal la simulación: el bosque solo repite la asociación observada.")
print("— TRES COEFICIENTES OLS (para comparar con la simulación) —")
def pendiente(variables):
    x = np.column_stack([np.ones(len(d)), d[variables].to_numpy(dtype=float)])
    return float(np.linalg.lstsq(x, d.nota_final.to_numpy(dtype=float), rcond=None)[0][1])
crudo = pendiente(["horas_bienestar_sem"])
previo = pendiente(["horas_bienestar_sem", "pga_previo", "complejidad"])
posterior = pendiente(["horas_bienestar_sem", "pga_previo", "complejidad", "horas_estudio", "horas_sueno"])
print("Asociación cruda B→nota:", round(crudo, 2))
print("Asociación con antecedentes:", round(previo, 2))
print("Asociación con mediadores posteriores:", round(posterior, 2))
print("Tres COEFICIENTES OBSERVACIONALES. Ninguno identifica por sí solo do(B).")
print("REGLA DAG: no ajustes automáticamente mediadores si buscas el efecto TOTAL.")
emitir("survey", origen, r, True)
`,
 ab:String.raw`
import numpy as np,pandas as pd
from sklearn.model_selection import KFold
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
d=pd.DataFrame(payload["rows"])
for c in ["tratamiento","nota_final","pga_previo","complejidad"]:
    d[c]=pd.to_numeric(d[c],errors="coerce")
p=d.groupby("estudiante_id",as_index=False).agg(
 tratamiento=("tratamiento","first"),nota=("nota_final","mean"),
 pga=("pga_previo","first"),complejidad=("complejidad","mean"),arquetipo=("arquetipo","first"))
t=p.tratamiento.to_numpy().astype(int)
y=p.nota.to_numpy().astype(float)
treated=y[t==1];control=y[t==0]
print("EXPERIMENTO DEL MISMO DGP DE LA COPA: 30 estudiantes sintéticos × 15 exámenes")
print("T se sorteó por estudiante; la nota es su promedio de 15 exámenes.")
print("Tratamiento B=4 h:",len(treated),"personas; control B=0 h:",len(control),"personas")
if len(treated)<2 or len(control)<2: raise ValueError("Un brazo tiene menos de dos estudiantes.")
ate=treated.mean()-control.mean()
se=np.sqrt(treated.var(ddof=1)/len(treated)+control.var(ddof=1)/len(control))
print("ATE observado:",round(ate,2),"puntos")
print("IC 95% aproximado entre ESTUDIANTES:",round(ate-1.96*se,2),round(ate+1.96*se,2))
print("No se trataron 450 exámenes como 450 observaciones independientes.")
print("— DML: demostración de residualización con cross-fitting —")
X=p[["pga","complejidad"]].to_numpy()
rt=np.zeros(len(p));ry=np.zeros(len(p))
for a,b in KFold(n_splits=3,shuffle=True,random_state=42).split(X):
    mt=RandomForestClassifier(n_estimators=40,min_samples_leaf=3,random_state=15,n_jobs=1)
    my=RandomForestRegressor(n_estimators=40,min_samples_leaf=3,random_state=16,n_jobs=1)
    mt.fit(X[a],t[a]);my.fit(X[a],y[a])
    rt[b]=t[b]-mt.predict_proba(X[b])[:,list(mt.classes_).index(1)]
    ry[b]=y[b]-my.predict(X[b])
coef=float(np.dot(rt,ry)/np.dot(rt,rt))
print("T residual = T observado − modelo T(X) fuera de muestra")
print("Y residual = Y observado − modelo Y(X) fuera de muestra")
print("Coeficiente residualizado:",round(coef,2),"puntos")
print("En un A/B el azar identifica la comparación; DML aquí es ilustración, NO prueba confusión eliminada.")
print("— HETEROGENEIDAD: diferencias descriptivas por arquetipo —")
for profile,g in p.groupby("arquetipo"):
    tt=g[g.tratamiento==1].nota;cc=g[g.tratamiento==0].nota
    if len(tt)>=2 and len(cc)>=2:
        print(profile,":",round(tt.mean()-cc.mean(),2),"(n=",len(tt),"+",len(cc),")")
    else: print(profile,": muestra pequeña; NO estimable con estabilidad")
print("Las diferencias observadas no son efectos individuales verdaderos.")
print("POLÍTICA: comparar beneficios esperados, incertidumbre, cupos y equidad.")
`
};

export const SCIENCE_STEPS={
 rector:{title:'Predicción real: simula do(B) con un Random Forest y descubre su límite',
  origin:'Se usa el CSV de tu sala si hay al menos 4 estudiantes distintos; si no, se ejecuta una referencia didáctica independiente, sintética y rotulada. El bosque predice notas y SIMULA B=0 frente a B=4 sobre las mismas filas.'},
 survey:{title:'Segunda trampa: más variables, mejor R², misma ilusión causal',
  origin:'Cálculos observacionales únicamente con el Rector y la encuesta de tu propia sala (o la referencia rotulada si hay menos de 4 estudiantes). Ningún coeficiente ni simulación se etiqueta como causal.'},
 ab:{title:'Python científico: A/B, incertidumbre, DML y heterogeneidad',
  origin:'Datos observados de 30 personas SINTÉTICAS del DGP canónico, asignadas por estudiante; no son participantes del curso.'}
};
