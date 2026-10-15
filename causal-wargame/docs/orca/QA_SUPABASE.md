# Arnés Dean QA contra Supabase

Estos scripts prueban únicamente el backend remoto definido por el usuario. No usan Docker, Supabase local, migraciones ni despliegues.

## Credenciales y preparación

El archivo obligatorio es `C:\Users\nib1l\Documents\diplocopia\_secrets\copa-v3.env`, fuera del repositorio:

```text
CW_BASE_URL=https://.../functions/v1
CW_DEAN_GAME=CW_DEAN_GAME...
CW_DEAN_PIN=...
CW_BOOTSTRAP_SECRET=... # opcional
```

`dean_qa_setup.mjs` inicia sesión y ejecuta `teacher → create`, que es idempotente. Si la partida no existe y está disponible `CW_BOOTSTRAP_SECRET`, crea una partida nueva con un código derivado del prefijo permitido; nunca borra una partida. Las migraciones establecen `cw_dean_tournaments.game_id` como clave primaria, por lo que no se puede crear un segundo torneo en el mismo juego: una nueva corrida limpia requiere una nueva partida.

```powershell
node scripts/dean_qa_setup.mjs
```

El resultado solo contiene el código de ejecución y la versión DGP; no muestra tokens, PIN ni secretos. Para usar el código generado en una corrida, defina `CW_DEAN_RUN_GAME` solo en el entorno del proceso, o actualice el valor externo sin copiar credenciales al repo.

## Corrida

`CW_BASE_URL` no tiene valor predeterminado. El arnés rechaza `FUTUROS`, `FLOWTEST26`, códigos encontrados en scripts/workflows y todo código que no empiece por `CW_DEAN_GAME`. En T0.3b se deben ejecutar únicamente 1 y 5 usuarios:

```powershell
$env:CW_USERS='1'; node scripts/dean_cup_load.mjs
$env:CW_USERS='5'; $env:CW_ROOMS='1,0,1,0,3'; node scripts/dean_cup_load.mjs
```

También acepta 1–30 usuarios para T2.2b, con cinco capacidades de sala de máximo seis (`CW_ROOMS=6,6,6,6,6`). Cada participante completa 15 exámenes con pausas de 2–8 s, consulta `state` cada 2,7–4,0 s y, durante el Kahoot final, consulta `quiz_state` en la misma ruta de la Copa. El docente avanza las fases, valida exportaciones, genera las capas A/B y ejecuta las ocho preguntas con todos los participantes.

Los informes sin secretos se escriben en `artifacts/load/<fecha>.json` y `.md`. Incluyen p50/p95/p99, tasa de errores y cantidad de respuestas 5xx por acción. También se verifican `fair_score`, el rechazo de un séptimo asiento, ausencia de filas para ausentes y que las exportaciones estudiantiles no contengan `U`, `Y0`, `Y1` ni el efecto verdadero.
