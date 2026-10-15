"""Ejecuta un programa del laboratorio Python (dean-science-programs.js) como lo hace pyodide.worker.js.

Uso: python run_lab_program.py <programa.py> <capa> <carpeta_csv>

* capa = rector | survey | ab | vacio. Las filas se leen como cadenas, igual que csvRows() de dean-cup.jsx,
  y la capa «survey» une Rector y encuesta por estudiante_id + examen_nro.
* El programa recibe `payload` y escribe en stdout; así se valida el contrato sin navegador.
"""
import csv, json, sys
from pathlib import Path

programa, capa, carpeta = Path(sys.argv[1]), sys.argv[2], Path(sys.argv[3])

def leer(nombre):
    with open(carpeta / nombre, encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))

if capa == "rector":
    filas = leer("sistema_academico_rector.csv")
elif capa == "survey":
    encuesta = {(r["estudiante_id"], r["examen_nro"]): r for r in leer("encuesta_estudiantes_juego.csv")}
    filas = [{**r, **encuesta.get((r["estudiante_id"], r["examen_nro"]), {})} for r in leer("sistema_academico_rector.csv")]
elif capa == "ab":
    filas = leer("cohorte_ab_test_2026.csv")
else:
    filas = []

payload = {"rows": filas}
exec(compile(programa.read_text(encoding="utf8"), str(programa), "exec"), {"payload": payload, "__name__": "__lab__"})
