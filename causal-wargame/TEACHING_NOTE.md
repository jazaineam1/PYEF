# Teaching Note

## Conocimientos mínimos del facilitador

Debe explicar sin fórmulas complejas:

1. **Predicción vs causalidad:** “quién probablemente hará algo” vs “quién cambia porque intervengo”.
2. **Tratamiento:** acción/intervención.
3. **Outcome:** resultado que importa.
4. **Contrafactual:** qué habría pasado sin la acción.
5. **Problema fundamental:** para una misma persona real sólo observamos un futuro.
6. **Confusión:** una característica previa influye tanto en tratamiento como outcome.
7. **Randomización:** ayuda a construir grupos comparables.
8. **ATE:** diferencia promedio entre intervención y control; comunicar en puntos porcentuales cuando corresponde.
9. **Heterogeneidad/CATE:** el efecto puede cambiar entre perfiles.

No necesita dominar IV, RDD, DiD, do-calculus, TMLE o Double ML para facilitar V1.

## R1 · debrief (5 min)

Pregunte antes de explicar:

- ¿Por qué eligieron esos clientes?
- ¿El score decía quién cambiaría por la intervención?
- ¿Qué les sorprendió del segundo ranking?

Explique:

> En la simulación podemos ver dos futuros porque los datos son sintéticos. En la vida real no vemos a la misma persona tratada y no tratada al mismo tiempo. Ésa es la dificultad causal.

Introduzca después `Y(1)`, `Y(0)` y contrafactual.

**Error frecuente:** decir que el simulador “descubre” el contrafactual real. Corrija inmediatamente: aquí lo conoce porque fue generado.

## R2 · debrief (7 min)

Preguntas:

- ¿Los dos grupos partían del mismo lugar?
- ¿Por qué la mora previa cambia la interpretación?
- ¿Meter más columnas siempre soluciona causalidad?

Definición simple:

> Una variable de confusión ayuda a explicar tanto quién recibe la intervención como el resultado.

Opcional: dibuje `Mora previa → Llamada`, `Mora previa → Pago`, `Llamada → Pago` y nombre el gráfico como DAG sólo al final.

## R3 · debrief (8 min)

Preguntas:

- ¿Quién decidió el tratamiento?
- ¿Qué cambia al usar azar?
- 31% vs 25%: ¿cuántos puntos porcentuales son?

Explique ATE sólo después del cálculo.

No diga “randomización garantiza que todo sea idéntico”; diga que evita selección sistemática y permite comparabilidad en expectativa.

## R4 · debrief (7 min)

Preguntas:

- Si el promedio es +6 pp, ¿por qué no tratar a todos?
- ¿Cuál segmento evitarían?
- ¿Qué harían con un segmento de efecto pequeño/incierto?

Introduzca heterogeneidad y CATE.

## Cierre de 3 minutos

En pantalla/pizarra:

> ORÁCULO PREDIJO QUIÉN LO HARÍA.  
> USTEDES DESCUBRIERON A QUIÉN PODÍAN CAMBIAR.

Pida que completen verbalmente:

> “Antes de afirmar que algo causó un resultado, preguntaría…”
