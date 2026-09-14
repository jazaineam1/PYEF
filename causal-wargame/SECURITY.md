# Security Model

## Activos sensibles

- ground truth (`p0`, `p1`, efectos por segmento);
- answer keys;
- scoring interno;
- eventos/reveals futuros;
- PIN/token de facilitador;
- tokens temporales de jugador.

## Supuesto de amenaza

Los participantes son técnicos y pueden usar DevTools, repetir requests y leer cualquier JS/JSON enviado al navegador. Por tanto **ocultar con CSS no es seguridad**.

## Controles

- ground truth no se committea en modo secure;
- escenario real se genera con `generate_secure_scenario.py` y se ejecuta en DB;
- browser roles no tienen grants directos sobre `cw_*`;
- RLS habilitado como defensa adicional;
- RPCs son `SECURITY INVOKER` y sólo `service_role` puede ejecutarlos;
- Edge Functions contienen la clave server-side;
- `sb_secret_*` se usa sólo como `apikey`; legacy JWT se envía como Bearer únicamente por compatibilidad;
- tokens de juego se guardan hasheados;
- decisiones bloqueadas no pueden reemplazarse;
- reveal de R1 entrega `p0/p1` únicamente después del cambio de estado;
- `build:secure` escanea que el marcador de ground truth demo no llegue al bundle.

## Configuración Edge Functions

Las funciones tienen `verify_jwt=false` de forma intencional porque V1 no usa Supabase Auth; implementan autorización con tokens opacos propios. Esto exige mantener la validación de token dentro de todos los endpoints excepto `health` y `join-game`.

## Pendiente antes de Internet abierto

V1 está pensado para una cohorte cerrada. Si se publica como servicio abierto, añadir:

- rate limiting por IP/partida;
- CAPTCHA o invitaciones firmadas para `join-game`;
- rotación/expiración administrativa de sesiones;
- limitación de origen cuando el dominio sea estable;
- observabilidad y alertas.
