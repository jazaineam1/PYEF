# Política de calidad: comprobar antes de publicar

Estas instrucciones se aplican a todo asistente/agente que edite este repositorio. **GitHub Actions no debe usarse como depurador por ensayo y error.**

## Puerta obligatoria de prepublicación

1. Leer el README, las reglas locales y los workflows del repositorio; identificar el alcance exacto y los riesgos de la tarea.
2. Hacer los cambios en espacio de trabajo local o aislado. Revisar diff y ejecutar `git diff --check`, `git status --short`; no incluir secretos, datos privados ni archivos generados.
3. **ANTES DE PUSH** ejecutar los validadores correspondientes: sintaxis de Python/JS/TS/HTML/JSON, pruebas existentes, build y pruebas visuales (móvil/escritorio) cuando afecte interfaces. Para notebooks, validar JSON y recorrer su ejecución cuando sea viable. Reproducir localmente los checks de GitHub Actions que no requieran secretos ni servicios externos.
4. Si falla algo, detenerse, leer el error exacto, corregir y repetir la prueba **antes de publicar**. No encadenar commits o pushes para “ver si CI pasa”. No eliminar/desactivar tests ni falsificar resultados; distinguir mocks de integraciones reales.
5. Si el entorno no permite una prueba esencial, decir exactamente qué falta. No declarar verificación completada. Para cambios importantes usar rama + PR, no `main` como banco de pruebas.
6. Publicar únicamente tras comprobar lo disponible, en el menor número de commits cohesivos. Tras publicar comprobar CI y funcionamiento real; si falla CI, analizar logs y reproducir el fallo fuera de GitHub antes de otro push.

## Entrega

Informar archivos editados, comandos realmente ejecutados, resultados, limitaciones, comprobaciones de publicación y enlace. Respetar las instrucciones existentes del proyecto que sean más estrictas.

## Cuidado específico PYEF
No alterar V1 al trabajar V2. Para cambios en `causal-wargame/`, revisar `package.json`, ejecutar `npm run check` desde ese directorio con dependencias instaladas y probar la experiencia de usuario antes del push. No lanzar pruebas que afecten servicios reales sin autorización.
