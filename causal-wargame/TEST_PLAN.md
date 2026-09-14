# Test Plan

## Unitarios incluidos

`node --test tests/*.test.mjs`

Verifican:

- 24 clientes/5 segmentos;
- ranking predictivo deliberadamente distinto del ranking causal;
- segmento de mora con efecto negativo;
- 4 answer keys.

## Build security gate

`npm run build:secure` ejecuta `assert_secure_bundle.mjs` y falla si el marcador del ground truth demo aparece en `dist/`.

## E2E manual obligatorio

1. Crear partida.
2. Entrar 20 participantes.
3. R1: cada equipo selecciona 10.
4. Cerrar: wall muestra ranking por conversión.
5. Reveal: wall cambia a causal; participante recibe p0/p1 sólo ahora.
6. F5: conserva sesión y decisión.
7. Intentar segundo lock distinto: debe fallar.
8. Microcheck: sólo una respuesta por jugador.
9. R2: cada rol ve sólo su tarjeta.
10. R3/R4: scoring correcto.
11. Final: leaderboard consistente entre wall y facilitator.

## Seguridad manual

- request directo a `facilitator-transition` sin token → rechazo;
- game-state con token inventado → rechazo;
- browser no puede consultar tablas cw_* directamente;
- `scenario-private.sql` ausente del repo;
- inspeccionar Network antes de R1 reveal: no debe existir `p0`, `p1` ni `effect`.

## Carga

Objetivo previo a clase: 50 navegadores simulados o pestañas realizando `game-state` cada 3 s + 20 submissions casi simultáneos.

Criterios:

- 0 decisiones perdidas;
- 0 score duplicado;
- p95 razonable para interacción (<2 s ideal; investigar >3 s);
- ningún reveal anticipado.

## Go / No-Go

NO ejecutar sesión real si falla:

- join;
- game-state;
- submit;
- F5/reconexión;
- facilitator transition;
- wall;
- reveal gate;
- secure bundle scan.
