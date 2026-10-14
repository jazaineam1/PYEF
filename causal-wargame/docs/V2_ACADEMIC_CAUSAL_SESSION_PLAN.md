# DOS FUTUROS · CAMPUS — Plan docente de 120 minutos

## Propósito

Al terminar la sesión, el estudiante no debe limitarse a repetir que "correlación no implica causalidad". Debe poder recorrer una cadena causal completa:

1. distinguir predicción de intervención;
2. reconocer cuándo un experimento aleatorizado permite estimar un efecto;
3. leer un DAG para decidir qué ajustar;
4. explicar la intuición de Double Machine Learning;
5. distinguir ATE de CATE;
6. comparar familias de estimadores causales sin creer que existe un algoritmo universalmente ganador;
7. traducir el resultado causal a una decisión académica con capacidad limitada.

La sesión usa un único caso: comportamiento académico y desempeño en exámenes.

---

## Caso conductor

La universidad dispone de información longitudinal como:

- estudiante;
- número de examen;
- arquetipo académico;
- PGA previo;
- asignatura;
- complejidad;
- horas de estudio;
- horas de sueño;
- horas de bienestar;
- fatiga;
- nota final.

La pregunta NO es solamente:

> ¿Quién tendrá una nota alta?

La pregunta causal es:

> ¿Qué acción cambiaría la nota de este estudiante frente a lo que habría ocurrido sin esa acción?

La intervención sintética usada en el juego es un **plan de apoyo académico estructurado**: planificación semanal, bloques guiados y acompañamiento.

---

## Regla pedagógica

Cada misión mantiene el mismo patrón:

> intuición → decisión → datos → sorpresa → nueva decisión → explicación → término técnico.

Nunca se presenta una sigla antes de explicar en palabras normales qué problema resuelve.

Cada sigla se muestra siempre en tres niveles:

**ATE**  
**Average Treatment Effect — Efecto Promedio del Tratamiento**  
Cambio promedio causado por la intervención frente a no intervenir.

---

# Agenda minuto a minuto

## 0–8 min · Apertura: los dos futuros

### Objetivo
Instalar el problema contrafactual.

### Docente
Muestra dos estudiantes con perfiles parecidos y pregunta:

> Si sólo puedo ofrecer apoyo a uno, ¿a quién se lo doy?

No hables todavía de ATE, DAG, DML ni CATE.

### Estudiante
Vota individualmente.

### Wall
Muestra distribución de respuestas y Top 3 todavía apagado.

### Reveal
Presenta conceptualmente:

- futuro A: el estudiante recibe apoyo;
- futuro B: el mismo estudiante no recibe apoyo;
- sólo uno de los dos futuros puede observarse realmente.

### Concepto revelado
**Contrafactual**: resultado que habría ocurrido bajo la alternativa que no observamos.

### WOW
La causalidad empieza por una comparación que nunca podemos observar completa para la misma persona.

---

## 8–20 min · Misión 1: La trampa predictiva

### Pregunta
> ¿Predecir una nota es saber cómo mejorarla?

### Decisión inicial
Los estudiantes priorizan perfiles con base en probabilidad estimada de aprobar.

### Laboratorio Python
Entrenan un Random Forest para predecir nota final.

Se muestran dos métricas:

**MAE — Mean Absolute Error — Error Absoluto Medio**  
Cuántos puntos se equivoca la predicción, en promedio.

**R² — Coeficiente de determinación**  
Cuánta variación logra explicar el modelo predictivamente.

### Pregunta de comprensión
> Un estudiante tiene 90% de probabilidad de aprobar. ¿Qué puedes concluir?

Respuesta correcta:

> Probablemente aprobará; todavía no sabemos cuánto cambiaría por recibir apoyo.

### Reveal técnico
**Predicción vs. efecto causal.**

### WOW
Un estudiante con 95% de probabilidad de aprobar puede producir casi cero efecto incremental porque probablemente aprobaría de todas maneras.

### Docente dice
> Un buen modelo puede responder perfectamente la pregunta equivocada.

---

## 20–34 min · Misión 2: Experimento A/B

### Pregunta
> ¿El plan de apoyo realmente mejora la nota?

### Diseño
El apoyo se asigna aleatoriamente.

### Definición
**A/B test — experimento A/B**  
Comparación aleatoria entre una alternativa A y una B.

**RCT — Randomized Controlled Trial — Ensayo Controlado Aleatorizado**  
Experimento donde la intervención se asigna al azar.

### Laboratorio Python
1. diferencia de medias;
2. repetir estimaciones en diferentes muestras;
3. intervalo de confianza aproximado.

### Concepto
**ATE — Average Treatment Effect — Efecto Promedio del Tratamiento**

Interpretación:

> Si ATE = +4.8 puntos, el plan aumentó la nota aproximadamente 4.8 puntos en promedio frente a no ofrecerlo.

### Incertidumbre
**IC — Intervalo de Confianza**

Rango que resume la incertidumbre de la estimación.

### WOW
Cuatro equipos simulan el mismo mundo causal y obtienen +7.1, +4.3, +1.9 y -0.2 puntos por azar muestral.

### Docente pregunta
> ¿Cuál equipo tiene "la verdad"?

Respuesta esperada:

> Ninguno observa exactamente la verdad; todos tienen estimaciones con incertidumbre.

---

## 34–52 min · Misión 3: DAG Detective

### Pregunta
> ¿Qué variables controlarías?

### Contexto
Ahora el apoyo NO fue asignado al azar.

Variables disponibles:

- PGA previo;
- complejidad;
- estudio posterior;
- tutorías posteriores.

### Definición
**DAG — Directed Acyclic Graph — Grafo Acíclico Dirigido**

Mapa de nuestras hipótesis sobre qué variables causan cuáles.

### Puzzle 1: confusor

PGA previo → apoyo  
PGA previo → nota  
apoyo → nota

**Confusor**  
Causa previa relacionada con tratamiento y resultado.

**Backdoor path — camino de puerta trasera**  
Camino no causal que puede crear una asociación entre tratamiento y resultado.

### Puzzle 2: mediador

apoyo → estudio posterior → nota

**Mediador**  
Variable por la que pasa parte del efecto.

Pregunta:

> Si quiero el efecto TOTAL, ¿debo controlar el mediador?

Respuesta:

> No automáticamente.

### Puzzle 3: collider

apoyo → tutorías posteriores ← dificultad

**Collider**  
Variable que recibe flechas de dos causas; condicionarla puede introducir una asociación artificial.

### WOW
> Agregar más variables al modelo puede empeorar la estimación causal.

### Decisión de equipo
Construir el conjunto de ajuste.

Conjunto esperado en el mundo sintético:

- PGA previo;
- complejidad.

Evitar:

- estudio posterior;
- tutorías posteriores.

---

## 52–70 min · Misión 4: Construir Double Machine Learning

### Pregunta
> ¿Cómo ajustamos muchas variables previas sin convertir la causalidad en una caja negra?

### Variables

**T — Treatment — Tratamiento**  
Recibir o no apoyo.

**Y — Outcome — Resultado**  
Nota final.

**X — Covariables**  
Características previas usadas para ajustar.

### Definición
**DML — Double Machine Learning — Aprendizaje Automático Doble**

Usa ML para modelar componentes auxiliares del tratamiento y del resultado; luego estima el efecto sobre la variación residual.

### Laboratorio Python

#### Paso 1
Modelo T:

X → probabilidad/valor esperado de T.

#### Paso 2
Modelo Y:

X → nota esperada.

#### Paso 3
Residualización:

T residual = T observado − T esperado.

Y residual = Y observado − Y esperado.

#### Paso 4
Relacionar residuos.

### Término
**Nuisance models — modelos auxiliares**  
Modelos necesarios para ajustar, pero que no son el efecto causal final.

### Concepto opcional
**Cross-fitting**  
Obtener predicciones fuera de muestra para reducir sobreajuste en los pasos auxiliares.

### WOW
Un modelo con mayor R² predictivo puede producir una estimación causal peor.

### Docente dice
> En DML, machine learning ayuda a ajustar. No reemplaza la pregunta causal ni la identificación.

---

## 70–87 min · Misión 5: ATE no es CATE

### Pregunta
> Si el apoyo funciona en promedio, ¿funciona igual para todos?

### Laboratorio
1. calcular ATE;
2. estimar efecto por arquetipo;
3. construir un T-Learner.

### Definición
**CATE — Conditional Average Treatment Effect — Efecto Promedio Condicional del Tratamiento**

Efecto promedio para personas con determinadas características.

Regla memorable:

> ATE pregunta: ¿funciona en promedio?  
> CATE pregunta: ¿para quién funciona?

### T-Learner
**Two Learners — Dos aprendices**

- modelo para tratados;
- modelo para controles;
- diferencia de predicciones = efecto estimado.

### S-Learner
**Single Learner — Aprendiz único**

Un modelo recibe X y T; se consulta con T=1 y T=0.

### WOW
El promedio puede ser +5 puntos mientras un arquetipo gana +10 y otro casi 0.

### Decisión
Priorizar perfiles con capacidad limitada.

---

## 87–103 min · Misión 6: Batalla de estimadores causales

### Pregunta
> ¿Qué estimador causal usarías?

### Estimadores

#### S-Learner
Un único modelo para ambos futuros.

#### T-Learner
Dos modelos: uno tratado y otro control.

#### DR-Learner
**Doubly Robust Learner — Aprendiz Doblemente Robusto**

Combina modelos del tratamiento y del resultado para construir una estimación más robusta bajo determinados supuestos.

#### Causal Forest
**Bosque causal**

Familia de árboles diseñada para aprender heterogeneidad del efecto.

#### EconML
**Econometric Machine Learning**

Librería de Microsoft con estimadores causales basados en machine learning.

### Nota técnica importante
EconML NO se ejecuta directamente dentro de Pyodide en esta versión porque sus dependencias no son suficientemente fiables en WebAssembly.

En el navegador sí se ejecutan estimadores compatibles con scikit-learn:

- S-Learner;
- T-Learner;
- DR-Learner simplificado.

Los resultados de EconML/Causal Forest se usan como benchmark precomputado para comparación.

### WOW
> Ningún algoritmo sofisticado arregla una estrategia de identificación equivocada.

### Respuesta correcta del boss
No existe un estimador universalmente ganador.

La selección depende de:

- diseño;
- identificación;
- overlap;
- tamaño de muestra;
- heterogeneidad;
- objetivo;
- supuestos.

---

## 103–114 min · Boss battle integrado

Cinco preguntas rápidas en Wall.

### Caso 1
Tratamiento aleatorizado.

Respuesta:
A/B / RCT; ATE por comparación de grupos, con incertidumbre.

### Caso 2
Tratamiento observacional y múltiples causas previas de T y Y.

Respuesta:
DAG primero; después estrategia de ajuste. DML puede ser una opción.

### Caso 3
La intervención tiene ATE positivo pero hay cupos limitados.

Respuesta:
Analizar CATE / heterogeneidad antes de construir política.

### Caso 4
Un predictor de nota tiene R² = 0.95.

Pregunta:
> ¿Eso demuestra causalidad?

Respuesta:
No.

### Caso 5
Una variable se mide después del tratamiento.

Pregunta:
> ¿La controlas automáticamente?

Respuesta:
No; primero identificar si es mediador, collider u otra variable postratamiento.

---

## 114–120 min · Cierre

Wall final:

Predicción  
↓  
Contrafactual  
↓  
Experimento / identificación  
↓  
DAG / ajuste  
↓  
Estimación  
↓  
DML  
↓  
ATE  
↓  
CATE  
↓  
Meta-learners / Causal Forest  
↓  
Política

### Pregunta final
> Antes de abrir una librería causal, ¿qué debes saber?

Respuesta esperada:

> Cuál es el tratamiento, cuál es el resultado, cuál es el contrafactual que quiero aproximar, por qué los grupos son comparables y qué supuestos necesito.

---

# Puntuación

Por misión:

- decisión inicial: 0 puntos;
- laboratorio: +20;
- pregunta de comprensión: hasta +30;
- revisión: +20;
- decisión de equipo: hasta +30.

Máximo por misión: 100.

Máximo total con seis misiones: 600 puntos.

La primera decisión no castiga intuición incorrecta.

---

# Wall

El Wall debe priorizar:

1. Top 3 individual;
2. fase actual;
3. progreso por checkpoint;
4. puntos recientes.

Sólo después del reveal muestra:

- decisión final de cada equipo;
- impacto académico estimado;
- explicación del WOW.

Puntaje de aprendizaje e impacto académico se mantienen separados.

---

# Datos y ética pedagógica

El dataset del juego es sintético aunque imite variables plausibles del entorno académico.

Nunca presentar:

- fatiga;
- arquetipo;
- sueño;
- PGA;
- complejidad

como causas demostradas por sí mismas.

Son variables dentro de un mundo sintético donde conocemos el ground truth y podemos enseñar identificación sin hacer afirmaciones sobre estudiantes reales.

---

# Qué NO debe pasar

- No abrir con fórmulas de DML.
- No presentar EconML antes de explicar el estimador.
- No decir que ATE = efecto individual.
- No controlar automáticamente variables postratamiento.
- No confundir R², MAE o AUC con evidencia causal.
- No presentar Causal Forest como "un Random Forest que ya hace causalidad".
- No usar una lista de 20 acrónimos sin contexto.

---

# Checklist del docente antes de clase

- [ ] Supabase ACTIVE_HEALTHY.
- [ ] Sesión V2 creada.
- [ ] Participante abre.
- [ ] Wall abre y recibe participantes.
- [ ] Facilitador puede iniciar, pausar, revelar y avanzar.
- [ ] Pyodide carga.
- [ ] Los seis laboratorios ejecutan todos sus bloques.
- [ ] El reto DAG permite seleccionar variables.
- [ ] DML produce salida interpretable.
- [ ] CATE/T-Learner produce efecto por perfil.
- [ ] Model battle ejecuta S/T/DR y muestra benchmark EconML.
- [ ] Top 3 se actualiza.
- [ ] Acrónimos tienen nombre completo y definición.
- [ ] No queda texto de clientes, renovación, bono o mes gratis en la ruta principal.
- [ ] Simulador docente recorre Ana/Luis/Camila/Juan en las seis misiones.

---

# Plan de contingencia

## Si Python tarda en cargar
El docente puede explicar el output esperado mientras Pyodide termina; no salta directamente al término técnico.

## Si quedan 90 minutos
Reducir así:

- M1: 10 min
- M2: 12 min
- M3: 15 min
- M4: 17 min
- M5: 13 min
- M6: 13 min
- Boss + cierre: 10 min

## Si quedan 60 minutos
Mantener:

- predicción;
- A/B;
- DAG;
- DML;
- CATE.

Dejar model battle como cierre demostrativo.

---

# Resultado esperado

Al final el estudiante debe poder explicar:

> Un modelo predictivo me ayuda a anticipar una nota. Un análisis causal intenta aproximar qué cambiaría si aplico una intervención. Para defender esa estimación necesito un diseño o una estrategia de identificación, debo decidir qué variables ajustar, puedo usar herramientas como DML para relaciones complejas y, si quiero decidir a quién priorizar, debo estudiar heterogeneidad mediante CATE u otros estimadores.

Ese es el criterio de éxito del taller.
