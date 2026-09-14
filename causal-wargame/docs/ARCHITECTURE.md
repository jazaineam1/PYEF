# Arquitectura del MVP

## Superficies

- `play.html`: participante.
- `facilitator.html`: control privado.
- `wall.html`: proyección pública.
- `system-check.html`: preflight.

## Live

```text
PC corporativo / Edge-Chrome
          |
        HTTPS
          v
GitHub Pages (frontend estático)
          |
        HTTPS polling 3 s
          v
Supabase Edge Function: causal-api
          |
          v
PostgreSQL
  - estado de juego
  - equipos / jugadores
  - decisiones / checks
  - score
  - ground truth (sin acceso directo)
```

## Por qué polling

Para 20 participantes, 3 s es suficiente y tolera mejor redes corporativas que una dependencia obligatoria de WebSockets. Realtime puede añadirse después.

## Modelo de seguridad

El browser conoce URL y game code, pero no secretos. Jugadores obtienen token aleatorio tras join; sólo se guarda su hash. El facilitador autentica cada acción privilegiada con `x-facilitator-key`, secreto configurado en la Edge Function. La base no concede acceso directo a roles de cliente.

## Demo

DemoStore usa `localStorage` + `BroadcastChannel`; es útil para ensayo multi-pestaña, no para dispositivos distintos.
