# Directiva: Medición estandarizada de activaciones (plantilla + tracker)

## Objetivo
Mantener el sistema que mide todas las activaciones con el mismo formato: una plantilla Excel por activación (en Brand Activators, un archivo por marca y periodo), un Tracker Excel que las junta y un prompt de Copilot para resumir los comentarios cualitativos de las agencias.

## Qué necesita
- Marcas: Martini, Bacardí, Patrón, Grey Goose, St-Germain, Bombay, Dewar's, Santa Teresa, Otros.
- Reglas fijas:
  - Todo en español y en euros.
  - Año fiscal de abril a marzo (H1 = abril-septiembre, H2 = octubre-marzo).
  - Usar siempre "Flagship" (nunca "Brand Embassy") y "Adaptar" (no "Reactivar").
  - Las marcas de decisión y de éxito son manuales.
  - El uplift se calcula fuera y se escribe a mano.
- Hay que trabajar con Excel 365 y Copilot corporativo.
- Los scripts de generación (build.py, tracker.py, ba.py, make_all.py) se escriben en la sesión. Si hay que rehacerlos, se pide a Carlos el último Excel que él haya editado, para no pisar sus textos.

## Pasos
1. **Plantilla de activación.** Pestañas: Instrucciones, 1 Descripción, 2 Clientes, 3 Ejecución, 4 M&E, 5 Flagships. Hay tres pestañas ocultas: Datos_Tracker, Catálogo y Listas. Antes de regenerar, se conservan los textos que Carlos haya reescrito en Instrucciones.
2. **Ejecución.**
   - Los KPIs son: Contactos, L2L (sampling de producto a consumidores), Asistentes, Drinks vendidos, Drinks de regalo, Descuentos, Regalos (merchandising), Incentivo tapas, Botellas vendidas, Posts/contenido, Nuevos listados en carta, Personal formado y Otro.
   - La columna L ("Coste de la línea", solo flagships) es visible y la rellena la agencia. En el resto de activaciones se dejan en blanco las columnas L a P (borrar solo M a P, que son de control).
3. **Reglas de cálculo para el Tracker.**
   - Personas = Contactos; si no hay, Asistentes.
   - L2L = L2L; si no hay, Drinks de regalo.
   - Drinks = solo Drinks vendidos.
   - El coste por contacto solo se calcula si la base son Contactos.
   - Cada línea realizada cuenta en el trimestre fiscal de su fecha.
   - El A&P por área y trimestre es una estimación (reparto proporcional al % de activaciones) y se etiqueta "estimado".
4. **M&E.**
   - Los colores de "% vs objetivo" son: verde si llega al 95 %, ámbar desde el 80 %, rojo por debajo. En A&P y coste se invierten.
   - Los campos manuales son "¿Activación exitosa?" (Sí/No), Decisión y Resumen de comentarios cualitativos de la agencia (resumido con Copilot).
   - El periodo fiscal sale automático.
5. **Pestaña 5 Flagships (solo control para los AM).**
   - Una fila por cliente. Calcula sola la ciudad, el área, el "Nº activaciones realizadas" y el "Coste total activaciones (€)" (suma de la columna L).
   - Se rellenan a mano Visibility, Otros costes con su concepto y Presupuesto.
   - Calcula la inversión total y el % consumido (ámbar desde el 90 %, rojo por encima del 100 %). Marca los clientes duplicados y admite hasta 50.
   - No alimenta el Tracker, que solo lleva costes y KPIs de las activaciones.
   - En 4 M&E, si el tipo es Flagship, aparece el bloque "Inversión Flagship": A&P de las activaciones + visibility + otros costes = inversión total. Visibility y otros costes se suman solo ahí: no entran en el A&P gastado total, ni en los costes por drink, contacto o activación, ni en el Tracker.
6. **Tracker.**
   - Pestañas: Resumen, Tracker, Datos, DatosArea, DatosTrim y Cómo se alimenta.
   - Se alimenta con Power Query desde una carpeta con los archivos. Cada archivo tiene que estar guardado al menos una vez en Excel de escritorio.
   - Usa "Nº proyectos" y "% activaciones exitosas".
7. **Brand Activators.** Un archivo por marca y periodo, nombrado "Brand Activators · Marca · H1 FY27". Los presupuestos de H1 están fijados para Dewar's, Martini, St-Germain y Patrón.
8. **Entrega y revisión.** Se recalculan los archivos y se comprueba que no hay errores de fórmula. Después se envían y se actualiza la guía en Claude Docs.

## Resultado esperado
Una plantilla, un Tracker y los archivos de Brand Activators sin errores de fórmula, y una guía actualizada con los cambios.

## Si algo falla
- El código de Power Query no se ha probado en el Excel de Carlos. Si falla al actualizar, se pide a Carlos el mensaje de error y se corrige.
- Si faltan datos de una marca, se avisa y no se inventa.
- No se cambia ninguna regla de arriba sin preguntar a Carlos.
