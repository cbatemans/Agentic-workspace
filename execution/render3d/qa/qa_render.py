"""QA de renders: tamano, imagen en blanco, y reparto aproximado de color de marca St~Germain.
Uso: python3 qa_render.py img1.png img2.png ...
El reparto es aproximado: clasifica cada pixel por el color de marca mas cercano (umbral) y NO excluye suelo ni cielo.
"""
import sys, numpy as np
from PIL import Image
BRAND={"verde Boulevard":(181,242,203),"navy Midnight":(2,24,54),"blanco/eggshell":(245,243,237),"oro Soleil":(170,139,76)}
for f in sys.argv[1:]:
    im=Image.open(f).convert("RGB"); a=np.asarray(im).astype(float)
    ok=[]; 
    if a.std()<8: ok.append("AVISO imagen casi uniforme (posible render fallido)")
    if im.width<640: ok.append("AVISO resolucion baja")
    names=list(BRAND); cols=np.array([BRAND[n] for n in names],float)
    d=((a.reshape(-1,1,3)-cols[None])**2).sum(2); idx=d.argmin(1); dm=np.sqrt(d.min(1))
    near=dm<70
    tot=near.sum() or 1
    share={n:100*(idx[near]==i).sum()/tot for i,n in enumerate(names)}
    print(f, im.size, "pixeles cercanos a la paleta: %.0f%%"%(100*near.mean()))
    print("  reparto aprox. dentro de lo cercano:", ", ".join("%s %.0f%%"%(n,v) for n,v in share.items()))
    for m in ok: print("  "+m)
