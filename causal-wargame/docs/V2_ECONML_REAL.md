# EconML real CAMPUS V2 solamente

TLearner, DRLearner y CausalForestDML se entrenan realmente en GitHub Actions con EconML 0.16.0, Python 3.11 y experimento académico de 2000 filas.
Se reserva un holdout estratificado de 500 observaciones y se evalúa RMSE de CATE contra la verdad simulada Y1-Y0.
El artefacto src/v2/econml-v2-verified.json incluye modelos, semilla 20261014, versiones, datos, SHA256 y efectos por perfil.
No se usa ningún modelo ni dataset bancario de V1; no se modifican tablas ni partidas de producción.
En V2 el bloque 3 analiza mediante Python local resultados EconML entrenados offline, no vuelve a ajustar EconML en Pyodide.
El menor error del holdout no demuestra validez causal fuera de este mundo experimental.

## Publicación
La compilación de Pages para esta entrega se valida junto con npm run check y las pruebas del motor causal V2.
