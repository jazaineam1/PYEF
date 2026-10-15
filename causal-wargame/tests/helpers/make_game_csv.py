"""Escribe CSV con el MISMO formato que descarga el juego (BOM, CRLF, campos entrecomillados).

Uso: python make_game_csv.py <carpeta_salida> <modo>

Modos de sala (a partir de la sesión simulada de 30 jugadores en tests/fixtures):
  sala:N   los 6 jugadores de la sala N (1–5), como el CSV real que descarga cada jugador
  clase    los 30 jugadores juntos (lo que ocurriría si se juntaran los CSV de todas las salas)
  n:K      K jugadores repartidos entre arquetipos (para probar salas de 2–5 estudiantes)
  ninguna  solo el A/B

El A/B es SIEMPRE el exacto que ve cada Copa (semilla fija '2026': 17 tratados / 13 control,
Pragmático 7/0, diferencia +0,51, IC95 [−7,63; +8,65]). Todo es sintético; no hay datos de personas.
"""
import csv, sys
from pathlib import Path

AQUI = Path(__file__).resolve().parent.parent / "fixtures"
carpeta, modo = Path(sys.argv[1]), sys.argv[2]

def leer(nombre):
    with open(AQUI / nombre, encoding="utf-8", newline="") as f:
        return list(csv.DictReader(f))

def escribir(nombre, columnas, filas):
    with open(carpeta / nombre, "w", encoding="utf-8", newline="") as f:
        f.write("﻿")
        w = csv.writer(f, quoting=csv.QUOTE_ALL, lineterminator="\r\n")
        w.writerow(columnas)
        w.writerows([[fila[c] for c in columnas] for fila in filas])

rector, encuesta = leer("copa_sesion_capa1_rector.csv"), leer("copa_sesion_capa2_encuesta.csv")
if modo.startswith("sala:"):
    elegidos = {r["estudiante_id"] for r in rector if r["sala"] == modo.split(":")[1]}
elif modo == "clase":
    elegidos = {r["estudiante_id"] for r in rector}
elif modo.startswith("n:"):
    por_arquetipo = {}
    for r in encuesta:
        por_arquetipo.setdefault(r["arquetipo"], [])
        if r["estudiante_id"] not in por_arquetipo[r["arquetipo"]]:
            por_arquetipo[r["arquetipo"]].append(r["estudiante_id"])
    elegidos, ronda, k = [], 0, int(modo.split(":")[1])
    while len(elegidos) < k:
        for a in sorted(por_arquetipo):
            if ronda < len(por_arquetipo[a]) and len(elegidos) < k:
                elegidos.append(por_arquetipo[a][ronda])
        ronda += 1
    elegidos = set(elegidos)
else:
    elegidos = set()

if elegidos:
    escribir("sistema_academico_rector.csv",
             ["estudiante_id", "examen_nro", "asignatura", "complejidad", "pga_previo", "horas_bienestar_sem", "nota_final"],
             [r for r in rector if r["estudiante_id"] in elegidos])
    escribir("encuesta_estudiantes_juego.csv", ["estudiante_id", "examen_nro", "arquetipo", "horas_estudio", "horas_sueno"],
             [r for r in encuesta if r["estudiante_id"] in elegidos])
ab = leer("copa_ab_observado_semilla_2026.csv")
escribir("cohorte_ab_test_2026.csv", list(ab[0].keys()), ab)
print("CSV escritos en", carpeta)
