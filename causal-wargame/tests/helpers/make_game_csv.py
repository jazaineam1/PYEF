"""Genera CSV con el MISMO formato que descarga el juego (BOM, CRLF, campos entrecomillados).

Uso: python make_game_csv.py <carpeta> <prelude.py> <estudiantes_sala> [semilla_ab]

* <estudiantes_sala> = 0 omite los CSV de sala (rector/encuesta) y solo escribe el A/B.
* La sala se extrae de la referencia didáctica (misma estructura del DGP), repartida entre arquetipos.
* El A/B replica la lógica de cw_dean_ab_generate_v3: 30 estudiantes sintéticos, T sorteado por
  estudiante y mediadores que responden a B. No reproduce el PRNG de PostgreSQL (solo su estructura).
Todo es sintético; no hay datos de personas.
"""
import csv, sys
from pathlib import Path
import numpy as np, pandas as pd

carpeta, prelude, n_sala = Path(sys.argv[1]), Path(sys.argv[2]), int(sys.argv[3])
semilla_ab = int(sys.argv[4]) if len(sys.argv) > 4 else 2026
espacio = {}
exec(compile(prelude.read_text(encoding="utf8"), str(prelude), "exec"), espacio)

def escribir(nombre, columnas, filas):
    with open(carpeta / nombre, "w", encoding="utf-8", newline="") as f:
        f.write("﻿")
        w = csv.writer(f, quoting=csv.QUOTE_ALL, lineterminator="\r\n")
        w.writerow(columnas)
        w.writerows(filas)

ASIGNATURAS = ["Cálculo Multivariable", "Física Mecánica y Ondas", "Econometría Aplicada", "Estructuras de Datos y Algoritmos",
               "Estadística y Probabilidad", "Bases de Datos Relacionales", "Metodología de la Investigación",
               "Fundamentos de Gestión y Finanzas", "Innovación y Emprendimiento", "Comunicación Oral y Escrita",
               "Ética Profesional y Ciudadanía"]

if n_sala > 0:
    ref = espacio["referencia_didactica"]()
    por_arquetipo = {a: sorted(g.estudiante_id.unique()) for a, g in ref.groupby("arquetipo")}
    elegidos, ronda = [], 0
    while len(elegidos) < n_sala:
        for a in sorted(por_arquetipo):
            if ronda < len(por_arquetipo[a]) and len(elegidos) < n_sala:
                elegidos.append(por_arquetipo[a][ronda])
        ronda += 1
    sala = ref[ref.estudiante_id.isin(elegidos)].sort_values(["estudiante_id", "examen_nro"])
    escribir("sistema_academico_rector.csv",
             ["estudiante_id", "examen_nro", "asignatura", "complejidad", "pga_previo", "horas_bienestar_sem", "nota_final"],
             [[r.estudiante_id, r.examen_nro, ASIGNATURAS[(r.examen_nro - 1) % 11], r.complejidad, r.pga_previo, r.horas_bienestar_sem, r.nota_final]
              for r in sala.itertuples()])
    escribir("encuesta_estudiantes_juego.csv",
             ["estudiante_id", "examen_nro", "arquetipo", "horas_estudio", "horas_sueno"],
             [[r.estudiante_id, r.examen_nro, r.arquetipo, r.horas_estudio, r.horas_sueno] for r in sala.itertuples()])

# --- experimento A/B ---
rng = np.random.default_rng(semilla_ab)
nota = espacio["nota_dgp"]
BASE = {"Sobreexigido": (8, 14, 2, 5, 11.5, 3.5, 0.6), "Equilibrado": (4, 8, 6.5, 8.5, 6, 7.5, 2.5),
        "En riesgo": (2, 5.5, 4.5, 7, 3.5, 6, 2.5), "Pragmático": (0.5, 3.5, 7, 9.5, 1.5, 8.5, 4.8)}
RANGO_PGA = {"Sobreexigido": (3.8, 4.8), "Equilibrado": (3.4, 4.3), "En riesgo": (2.0, 3.0), "Pragmático": (3.0, 3.6)}
orden = ["Sobreexigido", "Equilibrado", "En riesgo", "Pragmático"]
filas = []
for i in range(1, 31):
    arq = orden[(i - 1) % 4]
    min_h, max_h, min_s, max_s, base_h, base_s, base_b = BASE[arq]
    pga = round(float(rng.uniform(*RANGO_PGA[arq])), 2)
    tratado = int(rng.random() < 0.5)
    b = 4.0 if tratado else 0.0
    for j in range(1, 16):
        examen = 1 + ((i + j - 1) % 11)
        comp = espacio["DIFICULTAD"][examen - 1]
        h = float(np.clip(round(base_h + 0.3 * (comp - 5.5) - 0.7 * (b - base_b) + 0.5 * rng.normal(), 1), min_h, max_h))
        s = float(np.clip(round(base_s - 0.25 * (h - base_h) + 0.2 * (b - base_b) + 0.4 * rng.normal(), 1), min_s, max_s))
        y = float(np.round(nota(np.array([pga]), np.array([comp]), np.array([h]), np.array([s]), np.array([b]), np.array([rng.normal()]))[0], 1))
        filas.append([f"ab_{i:02d}", j, arq, pga, ASIGNATURAS[examen - 1], comp, tratado, b, h, s, y])
escribir("cohorte_ab_test_2026.csv",
         ["estudiante_id", "examen_nro", "arquetipo", "pga_previo", "asignatura", "complejidad", "tratamiento",
          "horas_bienestar_sem", "horas_estudio", "horas_sueno", "nota_final"], filas)
print("CSV escritos en", carpeta)
