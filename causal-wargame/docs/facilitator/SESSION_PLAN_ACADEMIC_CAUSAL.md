# DOS FUTUROS · CAMPUS
## Plan de sesión docente · Inferencia causal con comportamiento académico

**Duración:** 120 minutos  
**Formato:** juego guiado + Python embebido + discusión por equipos + Wall  
**Caso:** desempeño académico y respuesta a un programa de apoyo.

## Resultado de aprendizaje

Al finalizar, el estudiante debe poder pasar por esta cadena:
predicción → pregunta causal → identificación → estimación → heterogeneidad → elección de estimador → decisión.

No basta memorizar siglas. Debe poder responder:
> ¿Qué pregunta causal intento contestar, bajo qué comparación es defendible y qué método usaría?

## Regla pedagógica

**problema → decisión → datos → sorpresa → explicación → nombre técnico → nueva decisión**

Nunca:
**sigla → fórmula → API → copiar código → pregunta**

Toda sigla debe presentarse como:
**SIGLA — nombre completo — definición humana.**

Ejemplo:
**ATE — Average Treatment Effect — Efecto Promedio del Tratamiento:** cuánto cambia, en promedio, el resultado al aplicar la intervención frente a no aplicarla.

---

# Minuto a minuto

## 0–8 min · Apertura — ¿predecir es cambiar?

### Facilitador
1. Proyecta Wall.
2. Comparte el código de sesión.
3. Espera ingreso de participantes.
4. Presenta el caso: historial académico, asignaturas, horas de estudio, sueño, bienestar, fatiga y nota final.
5. Pregunta: “Si puedo predecir perfectamente la nota de mañana, ¿ya sé cómo mejorarla?”

### No explicar todavía
ATE, DAG, DML, CATE, propensity score ni causal forest.

### Evidencia
Wall: participantes y equipos listos.

---

## 8–20 min · MISIÓN 1 — La trampa predictiva

### Pregunta
**¿Predecir una nota es saber cómo mejorarla?**

### 8–10 · Decisión inicial
El estudiante prioriza perfiles usando arquetipo, PGA previo, estudio, fatiga y probabilidad de aprobar.

**Puntos:** 0.

### 10–15 · Python
Bloque 1: Random Forest predictivo, MAE y R².

**MAE — Mean Absolute Error — Error Absoluto Medio:** error promedio de la predicción expresado en puntos.

**R² — coeficiente de determinación:** medida predictiva de cuánto de la variación del resultado explica el modelo. No prueba causalidad.

Bloque 2: ranking por probabilidad de aprobar.

### WOW 1
> El estudiante con 90% de probabilidad de aprobar puede ser quien menos cambie con la intervención.

### Concepto
**Contrafactual:** resultado que habría ocurrido bajo la alternativa que no observamos.

### 15–18 · Pregunta puntuable
Hasta +30.

### 18–20 · Revisión
El estudiante vuelve a priorizar.

### Evidencia docente
Observar si deja de usar “probabilidad” como sinónimo de “impacto”.

---

## 20–34 min · MISIÓN 2 — Experimento A/B

### Pregunta
**¿El programa de apoyo realmente mejora la nota?**

La universidad asigna aleatoriamente:
- A: sin apoyo;
- B: con programa de apoyo.

### 20–22 · Decisión inicial
Escoge qué comparación considera defendible.

### 22–29 · Python

**Bloque 1 — ATE**

**ATE — Average Treatment Effect — Efecto Promedio del Tratamiento:** cambio promedio causado por la intervención frente a no intervenir.

Interpretación correcta:
“ATE = +4.8 puntos” significa que la intervención aumentó aproximadamente 4.8 puntos la nota en promedio frente al control.

No significa que cada estudiante mejoró 4.8 puntos.

**Bloque 2 — variación muestral**

Submuestras del mismo mundo pueden producir efectos observados distintos.

### WOW 2
> El mismo efecto verdadero puede producir estimaciones distintas sólo porque observamos muestras distintas.

**Bloque 3 — IC**

**IC — Intervalo de Confianza:** rango que resume incertidumbre alrededor de la estimación.

### 29–34 · Pregunta, revisión y debrief

**RCT — Randomized Controlled Trial — Ensayo Controlado Aleatorizado:** experimento donde la intervención se asigna al azar.

Mensaje docente:
> La aleatorización es una estrategia de identificación; no es un algoritmo de machine learning.

---

## 34–50 min · MISIÓN 3 — DAG Detective

### Pregunta
**Si la intervención no fue aleatoria, ¿qué variables debo controlar?**

### 34–37 · Decisión inicial
Seleccionan variables como PGA previo, complejidad, estudio posterior y tutorías posteriores.

### 37–46 · Python y mapa causal

**DAG — Directed Acyclic Graph — Grafo Acíclico Dirigido:** mapa de hipótesis sobre qué variables causan cuáles.

**Confusor:** causa previa relacionada con tratamiento y resultado.

**Backdoor path — camino de puerta trasera:** camino no causal que puede crear asociación entre tratamiento y resultado.

**Mediador:** variable por la que pasa parte del efecto de la intervención.

Ejemplo:
apoyo → más estudio posterior → nota.

**Collider:** variable que recibe influencia de dos causas; condicionarla puede crear una asociación artificial.

### WOW 3
> Agregar una variable al modelo puede aumentar, no disminuir, el sesgo causal.

### 46–50 · Pregunta y decisión de equipo
El conjunto de ajuste debe priorizar causas previas relevantes y evitar controlar automáticamente variables posteriores.

Frase de salida:
> No controlo variables porque estén disponibles; las controlo por su papel causal.

---

## 50–68 min · MISIÓN 4 — Construye Double Machine Learning

### Pregunta
**¿Cómo ajustamos muchas covariables complejas sin tratar ML como una máquina causal mágica?**

### 50–53 · Decisión inicial

### 53–64 · Python

Antes del código:

**T — Treatment — Tratamiento:** intervención cuyo efecto queremos estimar.

**Y — Outcome — Resultado:** variable causal de interés; aquí, nota final.

**X — Covariables:** características previas usadas para construir una comparación defendible.

**Bloque 1 — modelos auxiliares**
- modelo de T usando X;
- modelo de Y usando X.

**Nuisance models — modelos auxiliares:** modelos necesarios para el ajuste, pero que no son el efecto causal final.

**Bloque 2 — residualización**
- T residual = tratamiento observado − tratamiento esperado;
- Y residual = nota observada − nota esperada.

**Bloque 3 — efecto**
Relacionar Y residual con T residual.

**DML — Double Machine Learning — Aprendizaje Automático Doble:** método que utiliza ML para ajustar tratamiento y resultado antes de estimar el efecto causal.

**Cross-fitting:** producir predicciones fuera de la muestra usada para entrenar cada modelo, reduciendo sobreajuste en el paso causal.

### WOW 4
> El modelo con mejor R² puede no producir la mejor estimación causal.

Mensaje:
> ML ayuda al ajuste; no reemplaza la identificación.

### 64–68 · Pregunta y revisión

---

## 68–74 min · Recap / micro-pausa

Wall:
- Top 3;
- puntos recientes;
- progreso.

Tres preguntas:
1. ¿Predicción = causalidad?
2. ¿Qué hace especial a la aleatorización?
3. ¿Por qué no controlo todas las variables?

Puente:
> Ya sabemos estimar un efecto. Ahora falta saber si ese efecto es igual para todos.

---

## 74–90 min · MISIÓN 5 — ATE no es CATE

### Pregunta
**¿Para quién funciona mejor la intervención?**

### 74–77 · Decisión inicial
Priorizar arquetipos.

### 77–86 · Python

Bloque 1: ATE global.

Bloque 2: efectos por arquetipo.

**CATE — Conditional Average Treatment Effect — Efecto Promedio Condicional del Tratamiento:** efecto promedio para personas con determinadas características.

Frase clave:
> ATE pregunta “¿funciona en promedio?”; CATE pregunta “¿para quién funciona?”

Bloque 3:

**T-Learner — Two Learners — Dos aprendices:** un modelo aprende el resultado bajo tratamiento y otro bajo control; su diferencia estima el efecto.

### WOW 5
Ejemplo sintético:
- Alta fatiga: +10.4 puntos;
- Equilibrado: +7.8;
- Sueño insuficiente: +3.1;
- Sobreexigido: +1.2;
- sin señal clara: alrededor de cero o negativo.

> Un ATE positivo puede esconder perfiles con muy poco beneficio.

### 86–90 · Política de equipo
Priorizar bajo cupos limitados.

---

## 90–104 min · MISIÓN 6 — Batalla de estimadores

### Pregunta
**¿Qué estimador causal usarías?**

### 90–92 · Decisión inicial

### 92–101 · Python

**S-Learner — Single Learner — Aprendiz único:** un modelo predice Y usando X y T; se comparan predicciones fijando T=1 y T=0.

**T-Learner — Two Learners — Dos aprendices:** un modelo para tratados y otro para controles.

**DR-Learner — Doubly Robust Learner — Aprendiz Doblemente Robusto:** combina modelos del tratamiento y del resultado para construir estimaciones más robustas bajo ciertos supuestos.

**Causal Forest — Bosque Causal:** familia de árboles diseñada para aprender heterogeneidad del efecto.

**EconML — Econometric Machine Learning:** librería de Microsoft que implementa estimadores de inferencia causal usando machine learning.

### Nota técnica
EconML completo no se ejecuta en Pyodide en esta versión porque su pila de dependencias no es suficientemente robusta en WebAssembly.

En DOS FUTUROS:
- S-Learner: ejecutado en navegador;
- T-Learner: ejecutado en navegador;
- DR-Learner pedagógico: ejecutado en navegador;
- Causal Forest / EconML: resultados de referencia precomputados para comparación.

### WOW 6
> Dos modelos pueden predecir casi igual y estimar efectos diferentes.

WOW final:
> Ningún algoritmo sofisticado repara una mala estrategia de identificación.

**Overlap — soporte común:** existencia de perfiles comparables con y sin tratamiento.

### 101–104 · Pregunta final
Respuesta objetivo:
> Depende del diseño, identificación, objetivo, datos, overlap y supuestos.

---

## 104–116 min · Boss battle docente

Cinco casos, máximo 90 segundos por caso:

1. **Tratamiento aleatorio** → ATE + incertidumbre.
2. **Tratamiento observacional dependiente de PGA/complejidad** → primero DAG/identificación; después estimador ajustado.
3. **Interesa para quién funciona** → CATE/heterogeneidad.
4. **Variable medida después del tratamiento** → no controlarla automáticamente; decidir si es mediador/collider.
5. **Sólo hay cupos para 20%** → priorizar por efecto esperado y restricciones, no por P(Y=1) solamente.

---

## 116–120 min · Cierre

Cada estudiante completa:

- Predicción me dice ______.
- Causalidad me pregunta ______.
- DAG me ayuda a ______.
- DML usa ML para ______.
- ATE responde ______.
- CATE responde ______.

Respuestas objetivo:
- predicción → qué probablemente ocurrirá;
- causalidad → qué cambiaría si intervengo;
- DAG → decidir una estrategia de identificación/ajuste;
- DML → ajustar tratamiento y resultado con covariables;
- ATE → si funciona en promedio;
- CATE → para quién funciona.

Cierre:
> **Primero identifica. Después estima. Luego valida. Al final decide.**

---

# Efectos WOW obligatorios

1. Un predictor excelente puede recomendar la intervención equivocada.
2. El mismo experimento produce estimaciones distintas por azar muestral.
3. Agregar variables puede aumentar sesgo causal.
4. Mayor R² no implica mejor estimación causal.
5. ATE positivo no implica beneficio homogéneo.
6. El estimador más sofisticado no repara mala identificación.

---

# Wall

Durante cada misión:
- Top 3 individual;
- fase actual;
- decisión inicial X/N;
- laboratorio X/N;
- pregunta X/N;
- revisión X/N;
- equipo X/N;
- puntos recientes.

Después del reveal:
- decisión final por equipo;
- impacto académico sintético cuando aplique;
- WOW;
- puntos de aprendizaje separados del impacto.

---

# Puntuación

| Componente | Puntos |
|---|---:|
| Decisión inicial | 0 |
| Laboratorio Python | 20 |
| Pregunta de comprensión | 30 |
| Revisión | 20 |
| Decisión de equipo | 30 |
| **Total por misión** | **100** |

Seis misiones: máximo 600 puntos.

---

# Preparación técnica antes de clase

1. Verificar Supabase ACTIVE_HEALTHY.
2. Abrir Facilitador.
3. Abrir Wall en proyector.
4. Probar Participante en otra sesión de navegador.
5. Ejecutar “Iniciar Python” y un bloque.
6. Confirmar carga de NumPy, pandas, SciPy, scikit-learn y Matplotlib.
7. Probar reveal.
8. Reiniciar la sesión antes de admitir estudiantes.
9. Confirmar Wall con 0 participantes.
10. Mantener el simulador docente sólo como contingencia.

---

# Contingencias

### Python tarda
Mientras carga Pyodide, pedir leer la pregunta del bloque. El código ya viene preparado.

### Un navegador falla
Restaurar código y reejecutar. Si persiste, usar el equipo para observar la misma evidencia sin detener la clase.

### Backend cae
Usar el simulador docente sólo como contingencia. No inventar resultados en vivo.

### Falta tiempo
Prioridad:
1. Predicción
2. A/B
3. DAG
4. DML
5. CATE
6. Model battle

Si hay que recortar, reducir la discusión final de modelos; no eliminar DAG o DML.

---

# Criterio de éxito

La sesión no se considera exitosa porque el código corrió o porque conocieron EconML.

Se considera exitosa si pueden defender:
1. cuál es T;
2. cuál es Y;
3. qué X son previas;
4. cuál es el contrafactual;
5. por qué la comparación identifica o no un efecto;
6. qué estimador usarían;
7. qué incertidumbre permanece;
8. cómo convertirían el efecto en una decisión.
