# Instrucciones del workspace

Soy Carlos y trabajo desde el móvil, sin conocimientos de programación. Explícame todo en lenguaje sencillo y entrégame los pasos completos de una sola vez. Avísame siempre antes de cualquier cambio que pueda borrar o sobrescribir datos.

## Al empezar cada sesión
1. Lee este archivo y learnings.md.
2. Si voy a hacer una tarea concreta, lee la directiva correspondiente en directives/.
3. No leas nada más a menos que haga falta.

## Arquitectura de 3 capas
- Directivas (directives/): instrucciones en Markdown que dicen qué hacer, con entradas, herramientas, salidas y casos extremos.
- Orquestación (tú): lees la directiva, decides, llamas a los scripts en orden, manejas errores y me pides aclaraciones.
- Ejecución (execution/): scripts de Python deterministas. Reviso primero si ya existe uno antes de crear otro.

La complejidad va en código fijo y tú te concentras en decidir.

## Reglas de trabajo
- Si algo falla: lee el error, corrige el script, pruébalo y actualiza la directiva. Si la prueba gasta créditos de pago, pregúntame antes.
- No crees ni sobrescribas directivas sin preguntarme, salvo que te lo pida explícitamente.
- Los archivos temporales van en .tmp/ y nunca se suben.
- Las claves de API NUNCA se guardan en el repositorio ni en la sesión web. Si un script las necesita, dímelo y decidiremos cómo manejarlas.
- Ten en cuenta que en la sesión web el acceso a internet desde los scripts está restringido. Si un script necesita una API externa, avísame antes de escribirlo.

## Aprendizajes
Cuando surja algo no trivial (límite de una API, error que se repite, decisión que tomamos juntos, suposición que resultó falsa), propónmelo en una línea. Si digo que sí, lo añades a learnings.md y haces commit. No registres detalles de una sola tarea ni cosas que ya estén en una directiva.
