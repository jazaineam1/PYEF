# Smoke tests mínimos

1. Abrir `system-check.html`: todos los checks esenciales OK.
2. Reset desde facilitador.
3. Abrir 5 pestañas de `play`, ingresar 5 nombres: deben quedar en Cóndor con 5 roles distintos.
4. Abrir ronda 1; seleccionar exactamente 10 clientes; bloquear.
5. Reveal: aparece impacto y ranking causal.
6. Teach y microcheck: registrar respuesta.
7. Siguiente: ronda 2 y tarjeta privada según rol.
8. Repetir hasta ronda 4.
9. F5 durante ronda: estado debe persistir.
10. Abrir wall: no debe mostrar intel privado.
11. Modo live: intento de `admin` sin clave debe devolver 403.
12. Modo live: intento de submit fuera de fase `round` debe devolver 409.
