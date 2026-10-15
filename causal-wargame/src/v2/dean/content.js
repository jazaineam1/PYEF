export const bannerContent={
  brand:'DOS FUTUROS · CAMPUS V2',
  title:'🏆 LA COPA DEL DECANO',
  defaultPhase:'PREPARACIÓN',
  footnote:'5 SALAS · HASTA 30 PARTICIPANTES · 15 EXÁMENES'
}

export const labContent={
  ariaLabel:'Laboratorio causal con datos de la Copa',
  kicker:'🔬 DEL TORNEO A LA EVIDENCIA · ZIP CANÓNICO',
  titles:{rector:'La trampa del Rector',survey:'La trampa del modelo multivariable',causal:'De correlación a experimento A/B'},
  intros:{
    rector:'El archivo administrativo solo ve historial, dificultad, bienestar y nota. ¿Podemos recomendar quitar bienestar viendo una pendiente?',
    survey:'Ahora aparecen horas de estudio y sueño: pueden mediar el efecto del bienestar. Ajustar por todo indiscriminadamente no es una solución causal.',
    causal:'Se intervienen 0 frente a 4 horas de bienestar, con asignación aleatoria por estudiante y resultados potenciales sintéticos.'
  },
  dagLabel:'DAG: historial previo influye en bienestar y nota; bienestar afecta estudio, sueño, fatiga y nota',
  dagNodes:['H · PGA previo','B · Bienestar','X₁ · Estudio','S · Sueño','U · Fatiga oculta','Y · Nota final'],
  dagNote:'Rutas adicionales: H→Y, Z→X₁, Z→Y, B→S, B→U y B→Y. X₁/S/U son descendientes mediadores; el DAG contiene más flechas que este esquema lineal.'
}

export const deanGuides={
  "lobby": {
    "time": "00–10",
    "teacher": "Presenta la misión. Cada sala de Teams tendrá seis carnés; no expliques fórmulas antes de que decidan.",
    "student": "Conoce tu arquetipo y forma tu equipo. Recuerda que los resultados son sintéticos.",
    "visual": "Hasta cinco salas y máximo seis personas por sala; si faltan participantes, la Copa continúa."
  },
  "exams": {
    "time": "10–30",
    "teacher": "Dales una ronda continua de juego. Mira el ranking sin interrumpir cada examen. Si alguien se retrasa, permite la simulación opcional y etiquetada.",
    "student": "Elige horas de estudio, sueño y bienestar en 15 exámenes; descubre que hay factores que no observas.",
    "visual": "Notas individuales, arquetipos ficticios, ruido y fatiga latente. Son registros observacionales de un generador artificial."
  },
  "rector": {
    "time": "30–55",
    "teacher": "Libera el archivo del Rector. Explica MAE y R² mediante sus notas; pide hallar asociaciones, pero no atribuir causalidad.",
    "student": "Descarga los exámenes disponibles de tu sala, aunque hayan asistido pocos estudiantes. Intenta anticipar notas y decide qué variables faltan.",
    "visual": "El CSV del Rector omite deliberadamente horas de estudio, sueño, arquetipo y fatiga."
  },
  "survey": {
    "time": "55–80",
    "teacher": "Revela la encuesta y únela por estudiante_id y examen_nro. Proyecta un DAG: confusores previos, mediadores posteriores y posibles colliders.",
    "student": "Cruza encuesta y Rector; identifica qué hábitos se relacionan con el resultado y cuáles son previos.",
    "visual": "Aparecen estudio, sueño y arquetipo; todavía faltan resiliencia y fatiga. Una correlación no prueba una flecha causal."
  },
  "causal": {
    "time": "80–105",
    "teacher": "Revela la fatiga oculta solo al docente. Explica que este torneo NO fue un ensayo aleatorizado; contrasta un A/B sintético independiente con estimadores DML y CATE.",
    "student": "Reconoce el factor oculto. Decide qué evidencia adicional sería necesaria para recomendar intervenciones.",
    "visual": "La verdad del generador puede auditarse, pero no prueba causalidad en datos académicos reales. DML y EconML necesitan supuestos."
  },
  "final": {
    "time": "105–120",
    "teacher": "Conduce ocho preguntas sincronizadas y explica brevemente los errores conceptuales después de cada revelación. Cierra con un podio.",
    "student": "Responde ocho preguntas A/B/C/D, participa en la revelación y observa el podio.",
    "visual": "Temporizador en servidor, respuestas bloqueadas y marcador separado /120."
  },
  "finished": {
    "time": "120",
    "teacher": "Conserva los datos y el podio sin reiniciar la partida hasta que decidas archivarla.",
    "student": "Repasa lo aprendido en esta simulación sintética.",
    "visual": "Una buena predicción o un algoritmo complejo no sustituyen un buen diseño causal."
  }
}
