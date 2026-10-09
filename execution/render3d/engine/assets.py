import numpy as np, base64, io
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from scipy import ndimage as ndi
import os
HERE=os.path.dirname(os.path.abspath(__file__))
A=os.path.join(HERE,"assets")+os.sep
def sdf_from_mask(mask,pad=48,size=512):
    m=np.pad(mask,pad)
    d=ndi.distance_transform_edt(~m)-ndi.distance_transform_edt(m)
    h,w=d.shape
    s=size/w
    d=ndi.zoom(d,s,order=1)*1.0
    d=d/size   # normalizado por el ancho de textura
    return d.astype(np.float16)
def bird_masks():
    im=Image.open(A+"bird_white.png").convert("RGBA"); a=np.array(im)[...,3]
    bb=Image.fromarray(a).point(lambda v:255 if v>20 else 0).getbbox(); a=a[bb[1]:bb[3],bb[0]:bb[2]]
    fine=a>128
    # version maciza: engrosada y suavizada para manilla resistente
    g=ndi.gaussian_filter(fine.astype(float),sigma=a.shape[1]*0.035)
    chunky=g>0.30
    # rellenar huecos
    chunky=ndi.binary_fill_holes(chunky)
    return fine,chunky
def b64(arr): return base64.b64encode(arr.tobytes()).decode()
def plaque2_png(w=2048,h=512,out=None):
    """Placa St~Germain Spritz Bar: logo oficial (adjunto del cliente) + BAR en Poppins Bold, navy sobre Boulevard Green."""
    import numpy as np
    U=A+"logo_stg_spritz_cliente.png"
    im=Image.open(U).convert("RGB"); a=np.array(im).astype(int)
    navy=(a.sum(2)<250)
    mint=(181,242,203)
    r1=np.where(navy[:180].sum(1)>0)[0]; r2=np.where(navy[196:].sum(1)>0)[0]+196
    c1=np.where(navy[:180].sum(0)>0)[0]; c2=np.where(navy[196:].sum(0)>0)[0]
    line1=im.crop((c1.min(),r1.min(),c1.max()+1,r1.max()+1))
    line2=im.crop((c2.min(),r2.min(),c2.max()+1,r2.max()+1))
    cap=line2.height
    f=ImageFont.truetype("/usr/share/fonts/truetype/google-fonts/Poppins-Bold.ttf",100)
    tmp=ImageDraw.Draw(Image.new("RGB",(10,10)))
    bb=tmp.textbbox((0,0),"BAR",font=f); fs=int(100*cap/(bb[3]-bb[1]))
    f=ImageFont.truetype("/usr/share/fonts/truetype/google-fonts/Poppins-Bold.ttf",fs)
    bb=tmp.textbbox((0,0),"BAR",font=f)
    gap=int(cap*0.6); bw=bb[2]-bb[0]
    l2=Image.new("RGB",(line2.width+gap+bw,cap),mint); l2.paste(line2,(0,0))
    ImageDraw.Draw(l2).text((line2.width+gap-bb[0],-bb[1]),"BAR",font=f,fill=(2,24,54))
    sp=int(cap*0.45)
    W=max(line1.width,l2.width); H=line1.height+sp+l2.height
    lg=Image.new("RGB",(W,H),mint)
    lg.paste(line1,((W-line1.width)//2,0)); lg.paste(l2,((W-l2.width)//2,line1.height+sp))
    s=min(h*0.74/H,w*0.80/W); lw,lh=int(W*s),int(H*s)
    lg=lg.resize((lw,lh),Image.LANCZOS)
    img=Image.new("RGB",(w,h),mint); img.paste(lg,((w-lw)//2,(h-lh)//2))
    if out: img.save(out)
    buf=io.BytesIO(); img.convert("RGBA").save(buf,"PNG"); return base64.b64encode(buf.getvalue()).decode()
