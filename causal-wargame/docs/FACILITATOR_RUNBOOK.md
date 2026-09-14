# Facilitator Runbook

## 24 h antes

- Ejecutar `system-check.html` desde la misma red corporativa si es posible.
- Probar `play`, `facilitator` y `wall`.
- En live: verificar API, seed privado y clave del facilitador.
- Hacer un reset.
- Probar un jugador y un submit por ronda.
- Confirmar que `wall` jamás muestra tarjetas privadas.

## 15 min antes

- Abrir `facilitator.html` en una ventana NO compartida.
- Abrir `wall.html` en una segunda ventana y compartir sólo esa.
- Preparar 4 breakout rooms.
- Pedir entrada de los 20 participantes.
- Verificar 20/20 en el panel.

## Agenda recomendada

- 00–08: briefing y roles.
- 08–23: ronda 1.
- 23–33: reveal + contrafactual.
- 33–48: ronda 2.
- 48–58: reveal + confusión.
- 58–63: pausa.
- 63–79: ronda 3.
- 79–90: randomización + ATE.
- 90–105: ronda 4.
- 105–113: defensa.
- 113–120: leaderboard + cierre.

## Contingencias

**Participante llega tarde:** entra y recibe el siguiente slot libre.  
**Equipo de 4:** una persona puede leer la tarjeta del rol faltante bajo indicación docente.  
**F5:** el token local permite recuperar estado en live; en demo el mismo navegador conserva sesión.  
**Backend lento:** congelar verbalmente la ronda; no usar velocidad como score.  
**Falla total:** usar las tablas y reveals de `TEACHING_NOTE.md` como fallback y registrar decisiones manualmente.

## Errores que arruinan la actividad

- explicar causalidad antes del primer reveal;
- compartir la consola del facilitador;
- puntuar por rapidez;
- usar conversión observada como score causal;
- hacer roles decorativos;
- omitir el debrief;
- dejar que un experto monopolice la respuesta.
