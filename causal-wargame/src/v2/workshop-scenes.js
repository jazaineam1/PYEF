// CAMPUS V2 ONLY. Decisions are actions in a single immersive story, not five independent tests.
export const WORKSHOP_SCENES=[
  {
    "title": "La primera apuesta",
    "badge": "NUEVA INVESTIGACIÓN",
    "ask": "Hay un cupo para apoyo académico. ¿Cuál es tu primera estrategia?",
    "options": [
      [
        "a",
        "🎓 Priorizar a Ana",
        "92 % de probabilidad de aprobar"
      ],
      [
        "b",
        "🧭 Priorizar a Bruno",
        "62 % de probabilidad de aprobar"
      ],
      [
        "c",
        "🔍 Pedir evidencia",
        "El pronóstico no dice cuánto ayudará la intervención"
      ]
    ],
    "reveal": "No podemos identificar al beneficiario causal solamente con probabilidades de aprobar: no conocemos Y(1)−Y(0).",
    "detail": "En una persona real nunca observamos simultáneamente sus dos futuros. En un mundo sintético podemos simularlos; no es evidencia individual observada."
  },
  {
    "title": "Operación: rescate de cupos",
    "badge": "CONSTRUYE TU ESCUADRÓN",
    "ask": "Tu equipo revisa su elección. ¿Qué argumento defenderías?",
    "options": [
      [
        "a",
        "📈 Predicción de éxito",
        "La nota esperada basta para asignar el cupo"
      ],
      [
        "b",
        "⚡ Beneficio incremental",
        "Importa cuánto cambia la nota por el apoyo"
      ],
      [
        "c",
        "🏅 Premiamos mejores notas",
        "Se ayuda primero a quien tiene mayor promedio"
      ]
    ],
    "reveal": "Un predictor excelente puede elegir mal a los beneficiarios. Ejemplo sintético: Ana Y(0)=37,Y(1)=38 (+1); Bruno Y(0)=24,Y(1)=33 (+9).",
    "detail": "El programa requiere identificar el efecto incremental. Los dos futuros del ejemplo son sintéticos, no resultados observados en una persona."
  },
  {
    "title": "La trampa del oráculo ML",
    "badge": "HACK PREDICTIVO",
    "ask": "Tu oráculo logra R² alto para predecir notas. ¿Qué haces?",
    "options": [
      [
        "a",
        "🚀 Desplegar predictor",
        "El mayor R² demuestra que el programa mejora notas"
      ],
      [
        "b",
        "🛑 Pedir identificación",
        "Predecir con precisión no identifica efectos"
      ],
      [
        "c",
        "📦 Controlar todo",
        "Todas las variables posteriores resolverán el problema"
      ]
    ],
    "reveal": "MAE y R² cuantifican predicción, no intervención. Un confusor previo puede afectar asignación y resultado.",
    "detail": "La demostración Python genera notas muy predecibles aunque el apoyo tenga efecto simulado exactamente cero."
  },
  {
    "title": "El laboratorio del grafo prohibido",
    "badge": "DAG DETECTIVE",
    "ask": "Para estimar el efecto TOTAL del apoyo, ¿qué variable priorizas ajustar?",
    "options": [
      [
        "a",
        "🗺️ PGA previo",
        "Medido antes del tratamiento: posible causa común"
      ],
      [
        "b",
        "🧪 Estudio posterior",
        "Puede mediar parte del efecto total"
      ],
      [
        "c",
        "🧲 Tutoría posterior",
        "Puede ser collider de apoyo y dificultad"
      ]
    ],
    "reveal": "Ajustar un confusor previo puede ayudar. Ajustar mediador bloquea efecto total; condicionar collider puede introducir asociación espuria.",
    "detail": "PGA previo→apoyo y nota; apoyo→estudio posterior→nota; apoyo→tutoría posterior←dificultad."
  },
  {
    "title": "El consejo decide los cupos",
    "badge": "BOSS FINAL DE ESTRATEGIA",
    "ask": "El A/B mostró beneficio promedio positivo, pero hay cupos limitados. ¿Cómo distribuyes apoyo?",
    "options": [
      [
        "a",
        "📉 Riesgo previsto",
        "Elegir siempre a quien probablemente pierde"
      ],
      [
        "b",
        "⚖️ Beneficio e incertidumbre",
        "Usar CATE, equidad y capacidad"
      ],
      [
        "c",
        "🤖 Complejidad del modelo",
        "Preferir la librería más avanzada sin discutir supuestos"
      ]
    ],
    "reveal": "ATE promedia, CATE describe heterogeneidad. Una política responsable combina beneficio incremental, incertidumbre, equidad y cupos.",
    "detail": "DML usa modelos auxiliares y residuos fuera de muestra. EconML real se entrenó fuera del navegador; un RMSE menor no prueba identificación universal."
  }
]
