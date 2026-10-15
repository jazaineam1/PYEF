# DOS FUTUROS V2 — RESPALDO DOCENTE (SIN SERVIDOR)

**Duración:** 120 minutos. **Personas:** 1 a 30. **Salas:** 5, hasta 6 por sala.
Esta guía permite impartir la capacitación cuando falla el backend o Pyodide.
No registra votos, no simula notas, no actualiza Wall y NO crea puntuaciones falsas.
Reúne las respuestas con manos alzadas o votación manual en Teams.
Si la red regresa, recupera la sesión real con su misma identidad.

## 00–10 — Los dos futuros
**Vota:** Ana tendrá nota prevista 44; Bruno 30. ¿Quién recibirá mayor beneficio si ofrecemos cuatro horas semanales de bienestar?
A. Ana. B. No se sabe con una predicción de notas. C. Bruno.
**Revela después de votar:** B. La nota prevista no identifica Y(1)−Y(0). En la vida real solo observamos uno de los dos resultados potenciales del mismo estudiante.
**Enseña:** T = intervención; Y = resultado; contrafactual = alternativa no observada.

## 10–30 — La Copa y las decisiones
**Vota:** La sala con mayores notas durmió menos. ¿Debe el Rector ordenar menos sueño para todos?
A. Sí. B. No: existe autoselección, complejidad y fatiga oculta. C. Sí, por ser el grupo ganador.
**Revela:** B. Un ranking de notas no es un experimento causal.
**Enseña:** una asociación no responde qué cambiaría si imponemos una política. La fatiga en el juego es sintética.

## 30–55 — La trampa predictiva
**Vota:** Un Random Forest predice notas con gran R² y MAE bajo. ¿Qué demuestra?
A. La causalidad de bienestar. B. Más árboles confirman el efecto. C. Predicción, no efecto de do(B).
**Revela:** C. MAE = error absoluto medio; R² = ajuste predictivo.
**Enseña:** para recomendar una intervención se necesita definir tratamiento, resultado, comparador, identificación y supuestos.

## 55–80 — DAG detective
**Vota:** Buscamos el efecto TOTAL de bienestar B sobre nota Y. ¿Qué harías?
A. Ajustar automáticamente estudio, sueño y fatiga posteriores.
B. Examinar PGA y antecedentes, sin bloquear mediadores postratamiento.
C. Meter todas las columnas al modelo.
**Revela:** B. Confusor previo abre caminos no causales; condicionar un mediador puede eliminar parte del efecto total.
**Viñeta extra de collider:** B → Tutorías ← Dificultad. Condicionar tutorías puede inducir una asociación artificial.
**Enseña:** las flechas son supuestos del mundo causal, no correlaciones descubiertas.

## 80–105 — A/B, DML y CATE
**Vota:** T sorteado por ESTUDIANTE sintético, B=0 frente a B=4; ATE positivo y solo cupos para el 20 %. ¿Qué harías?
A. Elegir mayor nota predicha. B. Prometer igual aumento a todos. C. Comparar CATE, intervalos, cupos y equidad.
**Revela:** C. ATE es efecto medio; CATE es promedio por perfil. En 30 personas sintéticas la precisión por subgrupo puede ser baja.
**Enseña DML:** modelo de T(X), modelo de Y(X), predicciones fuera de muestra, residuos, relación residual. DML NO elimina confusión no observada sin un diseño válido.
**Cálculo manual alternativo:** promediar las 15 notas por estudiante, calcular media de tratamiento y de control; la diferencia es el ATE estimado de este A/B. No considerar 450 exámenes independientes.

## 105–120 — Transferencia y cierre
**Caso NUEVO:** una capacitación laboral aumenta productividad de quienes asisten, pero se ofreció primero a los más motivados.
A. Declarar causalidad por correlación. B. Definir T/Y y controlar el sesgo de selección con diseño válido. C. Usar el algoritmo más sofisticado.
**Revela:** B. Ningún algoritmo reemplaza la identificación.
**Cierre:** primero identifica, luego estima y valida, por último decide.

## Recuperación
- Pyodide lento: proyecta la interpretación y conserva los cálculos como «demostración no ejecutada». Sin Python, la simulación do(B) se explica en la pizarra como dos futuros hipotéticos (B=0 h y B=4 h sobre las mismas filas) y se pide una recomendación a mano alzada; no se inventan cifras ni se reportan puntos.
- Supabase fuera de servicio: usa esta guía y voto manual, NO reportes puntajes como sincronizados.
- Proyector falla: abrir esta guía desde otro dispositivo o imprimir antes de clase.
- Menos de 30 asistentes: todos los grupos pueden quedar desiguales o vacíos; nunca crear bots que parezcan alumnos.
