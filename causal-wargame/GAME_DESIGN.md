# Game Design · DOS FUTUROS

## Resultado de aprendizaje

Al salir, el participante debe poder preguntar espontáneamente:

1. ¿Qué estamos cambiando?
2. ¿Qué resultado queremos cambiar?
3. ¿Qué habría pasado sin intervenir?
4. ¿Por qué la comparación es justa?
5. ¿Funciona igual para todos?

La terminología formal se introduce **después** de vivir cada concepto.

## Equipos y roles

4 equipos de 5. Roles:

- **Negocio** — objetivo, presupuesto y decisión.
- **Datos** — probabilidades, tasas y números.
- **Contexto** — por qué alguien acabó tratado/no tratado.
- **Riesgo** — daño, restricciones y segmentos adversos.
- **Integrador** — consolida la decisión del equipo.

### Qué son los roles y qué NO son

Los roles usan **información asimétrica cooperativa**. Todos los integrantes quieren exactamente lo mismo: que su equipo tome la mejor decisión causal. No hay traidor, mentiroso ni rol con objetivo secreto contrario.

Por eso no funciona como *Hombre Lobo*: comparte con ese tipo de juego que cada persona conoce información diferente, pero aquí no hay engaño social. Se parece más a un equipo de crisis o escape room cooperativo: cada rol tiene una pieza del rompecabezas y la decisión correcta exige compartirlas.

- R1 es deliberadamente común: todos caen primero en la trampa predictiva.
- R2, R3 y R4 entregan una pista privada distinta a cada rol.
- La decisión final siempre es una respuesta estructurada del equipo.
- Las pistas privadas no se puntúan por texto: sólo ayudan a llegar a la decisión objetiva correcta.

## Rondas

### R1 · ORÁCULO

Elige 10 de 24 clientes utilizando score predictivo. Primero se muestra el **ranking observado**. Luego se abre “VER EL OTRO FUTURO” y se recalcula por impacto incremental.

Aprendizaje: predicción ≠ efecto causal; contrafactual; `Y(1)-Y(0)`.

### R2 · La comparación engañosa

Llamados pagan 20%, no llamados 35%. La información distribuida revela que los llamados tenían mayor mora desde antes.

La respuesta del equipo es completamente estructurada:

1. cancelar / mantener / rediseñar;
2. seleccionar la variable problemática;
3. seleccionar por qué la comparación engaña.

No hay texto libre competitivo.

Aprendizaje: comparación injusta y confusión.

### R3 · Una prueba mejor

20.000 elegibles; escoger asesor, modelo o asignación aleatoria. Outcome y horizonte también se puntúan de forma cerrada.

Aprendizaje: randomización, tratamiento/control y ATE.

### R4 · El promedio miente

ATE positivo, pero efectos por segmento heterogéneos y un segmento con daño esperado. Cada uno de los cinco segmentos debe clasificarse exactamente una vez en intervenir / no intervenir / más evidencia.

Aprendizaje: heterogeneidad, CATE y política de intervención.

## Scoring de equipo · 100% determinista

El profesor nunca asigna puntos competitivos manuales.

- **Impacto causal: 35** — valor incremental esperado de los 10 clientes seleccionados en R1, calculado contra el ground truth sintético.
- **Evidencia: 25** — R2: 8 puntos por rediseñar, 8 por identificar mora previa, 9 por reconocer que los grupos ya eran distintos antes.
- **Diseño: 20** — R3: 12 por asignación aleatoria, 4 por outcome de pago a 30 días, 4 por horizonte ≥30 días.
- **Riesgo: 10** — R4: 10 por no intervenir el segmento de mora alta.
- **Adaptación: 10** — R4: 3 por priorizar jóvenes digitales, 3 por ingreso medio, 1 por dejar tradicional en más evidencia, 1 por dejar patrimonio alto en más evidencia y 2 por evitar mora alta.

Máximo exacto: **100 puntos**.

Los microchecks individuales son diagnósticos de aprendizaje y **no modifican el leaderboard**.

### Empates

Si dos equipos terminan con el mismo total, se comparan en este orden:

1. Impacto causal.
2. Evidencia.
3. Diseño.
4. Riesgo.
5. Adaptación.

Si siguen idénticos, se declara empate técnico. No se usa velocidad de respuesta como desempate.

## Evaluación individual

El MVP registra un microcheck individual por ronda. Para evaluación formal se recomienda separarla del ganador del juego:

- resultado del equipo;
- cuatro microchecks individuales;
- debrief oral no competitivo;
- exit ticket diagnóstico.

La defensa oral y el exit ticket **no deciden quién gana**.

## Uso de IA

Permitido. Regla visible: **“IA puede asesorar; IA no es evidencia.”**

La resistencia a delegación proviene de:

- información fragmentada por rol;
- eventos liberados en vivo;
- decisiones irreversibles;
- ground truth server-side;
- microchecks individuales.

## Qué NO puntuar

No usar como aprendizaje ni como desempate:

- clics;
- tiempo de pestaña;
- velocidad de respuesta;
- cantidad de texto;
- número de recargas;
- apreciación subjetiva del profesor.
