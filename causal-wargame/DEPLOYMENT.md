# Deployment

## 1. Supabase

Crear un proyecto dedicado. No reutilizar bases corporativas ni datasets reales.

Aplicar la migración:

```bash
supabase db push
```

o ejecutar el SQL por la vía aprobada del proyecto.

## 2. Desplegar funciones

Funciones V1:

- health
- join-game
- facilitator-login
- game-state
- submit-decision
- submit-check
- facilitator-transition
- leaderboard

Ejemplo CLI (verificar comandos con `supabase --help` en el momento del despliegue):

```bash
supabase functions deploy health
# repetir para las demás
```

## 3. Generar la partida privada

```bash
python scripts/generate_secure_scenario.py --output scenario-private.sql
```

El comando imprime un código y un PIN fuerte. Ejecutar el SQL y luego eliminar/guardar el archivo fuera del repo.

## 4. Frontend

Crear `.env.secure.local`:

```env
VITE_GAME_MODE=secure
VITE_FUNCTIONS_BASE_URL=https://<project-ref>.supabase.co/functions/v1
```

Construir:

```bash
npm install
npm run check
```

Publicar el contenido de `dist/` en GitHub Pages/Cloudflare Pages/hosting estático aprobado.

## 5. Verificación final

Abrir `/system-check.html` desde un PC corporativo real. Luego ensayar una ronda completa.

## Nota de GitHub Pages

Este proyecto usa `base: './'`, por lo que los assets funcionan bajo subrutas como `/PYEF/causal-wargame/` si se publica el `dist` correspondiente.
