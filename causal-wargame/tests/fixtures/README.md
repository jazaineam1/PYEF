# Fixtures sintéticos de la Copa del Decano

Todo es **sintético**; no hay datos de personas. Proceden del análisis cuantitativo del DGP (`analisis-copa-decano`, sin versionar) y se copian aquí **solo para las pruebas**:

| Archivo | Qué es |
|---|---|
| `copa_ab_observado_semilla_2026.csv` | El A/B que ve **cada** Copa (el SQL usa la semilla fija `'2026'`, reproducido con MD5 → uniforme y Box–Muller idénticos a `cw_dean_uniform_v3/normal_v3`): 30 estudiantes × 15 exámenes. Valores esperados: **17 tratados / 13 control**, Pragmático **7/0**, diferencia **+0,51**, IC95 **[−7,63; +8,65]**. |
| `copa_sesion_capa1_rector.csv`, `copa_sesion_capa2_encuesta.csv` | Sesión simulada de 30 jugadores en 5 salas de 6 (estrategias estilizadas, **supuesto del análisis**, no humanos). La columna `sala` solo existe aquí: el CSV real de cada jugador trae únicamente su sala. |

Valores de referencia del análisis (salas de 6, RF de 45 árboles, `GroupShuffleSplit(.33)`): sala 2 → R² de prueba **−2,534**, sala 4 → **0,818**; sala 1 solo tiene 2 arquetipos (pendiente cruda **+2,30**) y su modelo con mediadores **no es estimable**; clase completa → R² **0,644**, pendientes −2,28 / −0,35 / −1,95 y **+1,84** al añadir dummies de arquetipo.
