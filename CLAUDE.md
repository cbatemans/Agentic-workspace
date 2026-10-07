# Instrucciones del workspace

Soy Carlos y trabajo desde el móvil, sin conocimientos de programación. Explícame todo en lenguaje sencillo y entrégame los pasos completos de una sola vez. Pídeme confirmación antes de cualquier cambio que borre o reemplace contenido que ya existe (por ejemplo, quitar una entrada, reescribir un archivo entero o cambiar el sentido de una directiva), y dime exactamente qué se perdería. Añadir una entrada nueva que yo ya he aprobado no necesita un segundo aviso.

## Al empezar cada sesión
1. Si estás leyendo esto, ya has cargado este archivo. Si aún no has leído learnings.md en esta sesión, léelo. No vuelvas a leer lo que ya tienes.
2. Cuando te diga qué tarea quiero hacer, mira si existe una directiva que encaje en directives/. Si existe, léela antes de empezar. Si dudas entre varias, dime cuál usarías.
3. Si no existe directiva para la tarea, hazla con normalidad, sin inventar una, y al terminar pregúntame en una línea si quiero crear una.
4. No leas nada más a menos que haga falta. Hacerme preguntas a mí no cuenta como leer de más.

## Cómo trabajar con el repositorio
- Todo se lee y se escribe con el conector de GitHub de Composio, en el repositorio cbatemans/Agentic-workspace, rama main.
- Si no puedes leer CLAUDE.md o learnings.md, dímelo en una línea con el motivo probable (por ejemplo, conexión caducada) y pregúntame si seguimos sin ellos o si te pego yo el contenido. No inventes lo que ponen.
- Antes de modificar un archivo, léelo entero en ese momento (con su identificador de versión) y conserva todo lo que ya tenía. Al guardar, usa un mensaje de commit corto que diga qué cambió.
- Después de guardar, dime en una línea qué archivo cambiaste y qué añadiste o quitaste. Si algo sale mal, explícame en pasos sencillos cómo volver a la versión anterior desde el historial de GitHub.

## Arquitectura de 3 capas
- Directivas (directives/): instrucciones en Markdown que dicen qué hacer, con entradas, herramientas, salidas y casos extremos.
- Orquestación (tú): lees la directiva, decides, llamas a los scripts en orden, manejas errores y me pides aclaraciones.
- Ejecución (execution/): scripts de Python deterministas. Úsalos solo cuando una tarea se repite y necesita precisión. Revisa primero si ya existe uno antes de crear otro. Si no puedes ejecutarlo y probarlo desde esta sesión, dímelo antes de escribirlo.

## Reglas de trabajo
- Si un script falla: lee el error, corrige el script, pruébalo y actualiza la directiva. Si la prueba gasta créditos de pago, pregúntame antes. Si no puedes probarlo aquí, dímelo en lugar de dar el arreglo por bueno.
- No crees ni sobrescribas directivas sin preguntarme, salvo que te lo pida explícitamente.
- Una directiva nueva lleva estas partes: objetivo, qué necesita, pasos, resultado esperado y qué hacer si algo falla. Enséñame el borrador antes de guardarla.
- Los archivos temporales van en .tmp/ y nunca se suben.
- Las claves de API NUNCA se guardan en el repositorio ni en la sesión web. Si un script las necesita, dímelo y decidiremos cómo manejarlas.
- Ten en cuenta que en la sesión web el acceso a internet desde los scripts está restringido. Si un script necesita una API externa, avísame antes de escribirlo.

## Aprendizajes
Cuando surja algo no trivial (límite de una API, error que se repite, decisión que tomamos juntos, suposición que resultó falsa), propónmelo en una línea y espera mi respuesta. Si digo que sí, añádelo a learnings.md con la fecha de hoy (si no puedes confirmarla, pregúntamela) y guarda el cambio siguiendo las reglas de "Cómo trabajar con el repositorio". No registres detalles de una sola tarea, cosas que ya estén en una directiva, claves, datos personales ni nombres de terceros. Registra solo hechos comprobados, no suposiciones.
