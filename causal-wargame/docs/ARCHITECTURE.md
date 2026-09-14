# Arquitectura

## Objetivo

Separar cuatro responsabilidades:

1. **Presentación** — navegador.
2. **Motor de juego** — transiciones y autorización.
3. **Event log / estado** — PostgreSQL.
4. **Scoring / ground truth** — server-side.

## Diagrama

```text
PC corporativo · Edge/Chrome
          |
          | HTTPS
          v
Static frontend (GitHub Pages u hosting equivalente)
  /play  /facilitator  /wall  /system-check
          |
          | HTTPS polling (2.5–3 s)
          v
Supabase Edge Functions
          |
          | privileged RPC
          v
PostgreSQL
  cw_games / teams / players / decisions / microchecks / events
          |
          +--> ground truth + answer keys (sin grants de browser)
```

## Por qué polling

Para 20 usuarios la latencia de 2.5–3 s es suficiente y evita hacer WebSocket un requisito de red corporativa. Realtime puede añadirse después; polling sigue siendo fallback.

## Autenticación del MVP

No usa cuentas institucionales. El juego entrega tokens opacos temporales:

- player token: 6 h;
- facilitator token: 8 h.

Sólo se guarda SHA-256 del token en PostgreSQL. El PIN del facilitador se almacena con `crypt(..., gen_salt('bf'))`.

Todas las operaciones del navegador llegan a Edge Functions. Las funciones llaman RPC con clave server-side; el navegador nunca conoce esa clave.

## Fuente de tiempo

`cw_games.closes_at` es la fuente oficial. El navegador sólo representa la diferencia visual.

## Idempotencia

Cada lock de decisión lleva `idempotency_key`. Un retry de la misma operación devuelve el mismo `decision_id`; una decisión diferente después del lock se rechaza.

## Modos

### demo

LocalStorage/BroadcastChannel y ground truth en bundle local. Sólo ensayo.

### secure

Estado y ground truth en servidor. Requerido para participantes técnicos.
