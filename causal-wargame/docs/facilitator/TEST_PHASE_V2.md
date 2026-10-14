# Fase de prueba V2 · DOS FUTUROS CAMPUS

## Objetivo

La V2 académica sólo está lista si demuestra simultáneamente:

1. seis misiones configuradas y navegables;
2. Python embebido ejecutable en los seis laboratorios;
3. ningún acrónimo obligatorio sin nombre completo y definición humana;
4. respuestas correctas y ground truth protegidos server-side;
5. puntaje de aprendizaje separado de impacto académico;
6. reveal oculto hasta acción del facilitador;
7. recarga y reconexión sin pérdida de identidad;
8. Wall, participante y facilitador sincronizados.

## Gate A · Build y seguridad

**PASS si:**
- tests unitarios pasan;
- build demo pasa;
- build secure pasa;
- ninguna respuesta correcta se publica en frontend;
- team score permanece oculto antes del reveal;
- el contrato público del estudiante no contiene copy legacy de bono/renovación;
- p0/p1 u otro ground truth individual no aparece antes del reveal.

## Gate B · Arquitectura modular

Debe existir:
- 6 misiones habilitadas;
- sólo 3 perfiles de datos reutilizables;
- template separado de profileRound;
- labKey separado de template.

Misiones:
1. prediction / cohort-selection / profile 1;
2. ab-test / single-choice / profile 3;
3. dag / multi-select / profile 2;
4. dml / single-choice / profile 2;
5. heterogeneity / segment-policy / profile 3;
6. model-battle / single-choice / profile 3.

**FAIL** si agregar un laboratorio obliga a crear una nueva aplicación o un componente RetoN aislado.

## Gate C · Python

### Prediction
- Random Forest predictivo;
- MAE;
- R²;
- no confundir predicción con efecto.

### A/B
- ATE;
- variación muestral;
- IC 95%.

### DAG
- comparación cruda;
- confusor;
- mediador;
- collider.

### DML
- nuisance models;
- cross-fitting;
- residual T;
- residual Y;
- efecto residual.

### Heterogeneity
- ATE;
- CATE;
- T-Learner.

### Model battle
- S-Learner;
- T-Learner;
- DR-Learner;
- comparación con referencia Causal Forest/EconML.

**PASS si:** todos los bloques compilan y una excepción Python no marca el bloque como completado.

**Regla:** EconML no debe fingirse como ejecución Pyodide. Debe etiquetarse como benchmark precomputado.

## Gate D · Contrato pedagógico

Por misión:
1. decisión inicial = 0 puntos;
2. laboratorio = +20;
3. pregunta = hasta +30;
4. revisión = +20;
5. equipo = hasta +30;
6. reveal = expone resultado y concepto.

Total: 100 puntos por misión; 600 máximo.

**PASS si:** el estudiante ve primero el problema y sólo después el nombre técnico.

## Gate E · Acrónimos

Toda sigla visible debe tener:
- sigla;
- nombre completo;
- traducción si aplica;
- definición humana.

Verificar como mínimo:
MAE, R², A/B, RCT, ATE, IC, DAG, DML, T, Y, X, CATE, S-Learner, T-Learner, DR-Learner, EconML y overlap.

## Gate F · Wall

Durante misión:
- Top 3;
- fase;
- inicial X/N;
- lab X/N;
- check X/N;
- revisión X/N;
- equipo X/N;
- puntos recientes.

Tras reveal:
- decisión final de cada equipo;
- WOW;
- impacto académico cuando aplique.

**FAIL** si el Wall vuelve a mostrar COP como métrica principal.

## Gate G · Recorrido live smoke

El script scripts/v2_simple_flow_smoke.mjs debe recorrer:
- 4 humanos QA;
- 6 misiones;
- todos los bloques Python registrados;
- checks correctos;
- revisiones;
- decisiones de equipo;
- 6 reveals;
- final finished;
- reset al terminar.

## Gate H · Recuperación

Durante una misión:
- F5;
- cerrar/abrir pestaña;
- perder red temporalmente;
- pausar;
- recargar;
- reanudar.

**PASS si:** identidad, equipo, misión, puntos y decisiones permanecen consistentes.

## Gate I · Prueba pedagógica humana

Después de la sesión, una persona debe poder responder sin mirar:
1. ¿qué diferencia predicción de causalidad?
2. ¿qué significa ATE?
3. ¿por qué la aleatorización ayuda?
4. ¿para qué sirve un DAG?
5. ¿qué es confusor, mediador y collider?
6. ¿qué hace DML de forma intuitiva?
7. ¿qué diferencia ATE de CATE?
8. ¿por qué no existe un estimador universalmente ganador?

## Go / No-Go

**GO** sólo si:
- CI verde;
- migración aplicada;
- Edge Functions actualizadas;
- live smoke verde;
- Pages publicado;
- prueba manual Facilitador + Participante + Wall + Python completada.

**NO-GO** si:
- aparece ground truth antes de reveal;
- Python falla y aun así concede puntos;
- alguna sigla obligatoria carece de definición;
- DML se presenta sólo como API;
- EconML se muestra como ejecutado cuando fue precomputado;
- Wall mezcla puntos con impacto;
- el backend sólo soporta 3 misiones.
