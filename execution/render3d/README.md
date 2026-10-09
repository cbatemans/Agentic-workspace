# Motor de render 3D v1 (SDF en Chromium)

Codigo del motor usado por la skill render-3d-sdf. Solo se usa cuando Carlos pide expresamente un modelo 3D o un render.

Contenido:
- engine/shader.frag, engine/render.py, engine/assets.py
- qa/qa_render.py

NO incluye las imagenes (logo, flor, colibri, botella). Son del cliente y hay que pedirlas a Carlos al empezar un render. Deben ir en engine/assets/ con estos nombres:
- bird_white.png
- botella_stg_700ml_cliente.png
- flor_stg_referencia_cliente.png
- logo_stg_spritz_cliente.png

Uso, dentro de engine/:
python3 render.py <escena 1..3> <noche 0|1> <vista> <salida.png> [ancho alto pasadas]
Vistas: tq, front, tap, tapside.
Requiere Python con numpy, scipy, Pillow y Playwright con Chromium. Fuente Poppins Bold en /usr/share/fonts/truetype/google-fonts/.
