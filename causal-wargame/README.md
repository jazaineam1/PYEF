# DOS FUTUROS · Causal Decision Simulation

MVP de wargame sincrónico para enseñar causalidad a equipos de datos, IA y tecnología mediante decisiones, consecuencias y debrief. Diseñado para **20 participantes (4 equipos × 5)** en una sesión virtual de **120 minutos** y para funcionar desde **Edge/Chrome corporativo sin instalaciones**.

## La idea en una frase

**ORÁCULO predice quién probablemente hará algo; el juego obliga a descubrir quién cambia porque intervenimos.**

El momento central ocurre al cerrar la ronda 1: primero se publica un ranking por conversión esperada y luego, al abrir **VER EL OTRO FUTURO**, el ranking se recalcula por impacto causal. El simulador conoce ambos futuros sólo porque los datos son sintéticos.

## Dos modos

- **demo**: todo vive en el navegador y sirve para ensayar la facilitación. El ground truth se genera localmente y por eso **no es seguro para una sesión real**.
- **secure**: estado, cartas, decisiones, scoring y ground truth viven en Supabase/PostgreSQL y se exponen únicamente mediante Edge Functions. Éste es el modo para 20 participantes reales.

## Pantallas

- `index.html` — entrada al producto.
- `play.html` — participante.
- `facilitator.html` — consola docente.
- `wall.html` — pantalla compartida en Teams/Meet/Zoom.
- `system-check.html` — preflight del PC y backend.

## Inicio rápido · ensayo local

```bash
npm install
npm run dev:demo
```

Abre varias pestañas:

- `/play.html`
- `/facilitator.html`
- `/wall.html`

El modo demo sincroniza pestañas con `BroadcastChannel`/storage. No representa una sesión multi-PC.

## Verificación

```bash
npm test
npm run build:demo
npm run build:secure
```

`build:secure` falla si detecta el marcador del ground truth demo dentro del bundle seguro.

## Despliegue seguro

1. Crear un proyecto Supabase dedicado.
2. Aplicar, en orden, las migraciones versionadas de `supabase/migrations/`.
3. Desplegar las Edge Functions listadas en `supabase/config.toml`.
4. Generar el escenario **fuera del repositorio**:

```bash
python scripts/generate_secure_scenario.py --output scenario-private.sql
```

5. Ejecutar `scenario-private.sql` en el proyecto Supabase.
6. Configurar `.env.secure.local`:

```env
VITE_GAME_MODE=secure
VITE_FUNCTIONS_BASE_URL=https://<project-ref>.supabase.co/functions/v1
```

7. Construir:

```bash
npm run build:secure
```

Nunca committear `scenario-private.sql`.

## Documentación

- [GAME_DESIGN.md](GAME_DESIGN.md) — mecánica, scoring y aprendizaje.
- [TEACHING_NOTE.md](TEACHING_NOTE.md) — teoría mínima y debrief por ronda.
- [FACILITATOR_RUNBOOK.md](FACILITATOR_RUNBOOK.md) — operación minuto a minuto.
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — arquitectura y modelo de datos.
- [SECURITY.md](SECURITY.md) — modelo de amenazas.
- [TEST_PLAN.md](TEST_PLAN.md) — pruebas técnicas/pedagógicas y go/no-go.
- [DEPLOYMENT.md](DEPLOYMENT.md) — puesta en producción.

## Referentes de diseño

El diseño toma patrones de simulaciones como Harvard Everest (roles, información asimétrica, facilitación y debrief), MIT Beer Game (experiencia antes de formalización) y plataformas de experimentación de Microsoft (separación entre ejecución, event log y análisis). La base causal sigue el enfoque de potential outcomes / contrafactuales de Hernán & Robins y la secuencia modelar-identificar-estimar-refutar popularizada por DoWhy.

## Regla de seguridad fundamental

El navegador de producción **jamás recibe** `p0`, `p1`, answer keys, reglas internas de scoring ni eventos futuros antes del reveal. No basta con ocultarlos con CSS: deben permanecer server-side.
