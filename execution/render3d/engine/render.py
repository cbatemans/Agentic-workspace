import sys, json, base64, io, time, os, tempfile, numpy as np
HERE=os.path.dirname(os.path.abspath(__file__))
from playwright.sync_api import sync_playwright
from PIL import Image
from assets import *
def build_html(W,H):
    fine,chunky=bird_masks()
    sf=sdf_from_mask(fine); sc=sdf_from_mask(chunky)
    ar=fine.shape[0]/fine.shape[1]
    pq=plaque2_png()
    # asegurar misma resolución cuadrada de textura (ancho 512 px + padding escalado)
    shader=open(os.path.join(HERE,"shader.frag")).read()
    html="""<!doctype html><body style="margin:0"><canvas id=c width=%d height=%d></canvas><script>
const W=%d,H=%d;
const cv=document.getElementById('c');
const gl=cv.getContext('webgl2',{preserveDrawingBuffer:true,antialias:false});
function sh(t,s){const o=gl.createShader(t);gl.shaderSource(o,s);gl.compileShader(o);if(!gl.getShaderParameter(o,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(o));return o}
const vs=`#version 300 es
in vec2 a;void main(){gl_Position=vec4(a,0.,1.);}`;
const fs=%s;
const pr=gl.createProgram();gl.attachShader(pr,sh(gl.VERTEX_SHADER,vs));gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,fs));gl.linkProgram(pr);
if(!gl.getProgramParameter(pr,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(pr));
gl.useProgram(pr);
const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
const al=gl.getAttribLocation(pr,'a');gl.enableVertexAttribArray(al);gl.vertexAttribPointer(al,2,gl.FLOAT,false,0,0);
function b64u16(s){const bin=atob(s);const u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return new Uint16Array(u.buffer)}
function tex16(unit,w,h,b64){const t=gl.createTexture();gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,t);
 gl.texImage2D(gl.TEXTURE_2D,0,gl.R16F,w,h,0,gl.RED,gl.HALF_FLOAT,b64u16(b64));
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);}
tex16(0,%d,%d,"%s");tex16(1,%d,%d,"%s");
window.loadPlaque=()=>new Promise(res=>{const im=new Image();im.onload=()=>{const t=gl.createTexture();gl.activeTexture(gl.TEXTURE2);gl.bindTexture(gl.TEXTURE_2D,t);
 gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,im);gl.generateMipmap(gl.TEXTURE_2D);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);res(1)};im.src="data:image/png;base64,%s"});
const U=n=>gl.getUniformLocation(pr,n);
gl.uniform1i(U('u_bird'),0);gl.uniform1i(U('u_birdC'),1);gl.uniform1i(U('u_plaque'),2);gl.uniform1f(U('u_bar'),%f);
gl.viewport(0,0,W,H);
let acc=null;
window.pass=(cfg,k)=>{
 gl.uniform2f(U('u_res'),W,H);gl.uniform3f(U('u_cp'),...cfg.cp);gl.uniform3f(U('u_ct'),...cfg.ct);gl.uniform1f(U('u_fov'),cfg.fov);
 gl.uniform1i(U('u_scene'),cfg.scene);gl.uniform1f(U('u_night'),cfg.night);gl.uniform1i(U('u_focus'),cfg.focus||0);gl.uniform1i(U('u_dbg'),cfg.dbg||0);
 const jx=((k*0.7548776662)%%1)-0.5,jy=((k*0.5698402909)%%1)-0.5;gl.uniform2f(U('u_jit'),jx,jy);gl.uniform1f(U('u_seed'),k*7.13);
 gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
 const px=new Uint8Array(W*H*4);gl.readPixels(0,0,W,H,gl.RGBA,gl.UNSIGNED_BYTE,px);
 if(!acc)acc=new Float32Array(W*H*4);for(let i=0;i<px.length;i++)acc[i]+=px[i];return k;
};
window.result=(n)=>{const c2=document.createElement('canvas');c2.width=W;c2.height=H;const x=c2.getContext('2d');const id=x.createImageData(W,H);
 for(let y=0;y<H;y++)for(let xx=0;xx<W;xx++){const s=((H-1-y)*W+xx)*4,d=(y*W+xx)*4;id.data[d]=acc[s]/n;id.data[d+1]=acc[s+1]/n;id.data[d+2]=acc[s+2]/n;id.data[d+3]=255}
 x.putImageData(id,0,0);acc=null;return c2.toDataURL('image/png');};
</script>"""%(W,H,W,H,json.dumps(shader),sf.shape[1],sf.shape[0],b64(sf),sc.shape[1],sc.shape[0],b64(sc),pq,ar)
    return html
def render(cfg,out,W=1400,H=900,passes=6):
    html=build_html(W,H)
    PAGE=os.path.join(tempfile.gettempdir(),"_render3d_page.html"); open(PAGE,"w").write(html)
    with sync_playwright() as p:
        b=p.chromium.launch(args=["--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"])
        pg=b.new_page(viewport={"width":W,"height":H}); pg.set_default_timeout(900000)
        pg.on("console",lambda m:print("console:",m.text[:300]))
        pg.on("pageerror",lambda e:print("pageerror:",str(e)[:1200]))
        pg.goto("file://"+PAGE)
        pg.evaluate("loadPlaque()")
        t0=time.time()
        for k in range(passes):
            pg.evaluate("([c,k])=>pass(c,k)",[cfg,k]); print("pass",k,round(time.time()-t0,1),flush=True)
        url=pg.evaluate("n=>result(n)",passes); b.close()
    Image.open(io.BytesIO(base64.b64decode(url.split(",")[1]))).save(out)
if __name__=="__main__":
    scene=int(sys.argv[1]); night=float(sys.argv[2]); view=sys.argv[3]; out=sys.argv[4]
    W=int(sys.argv[5]) if len(sys.argv)>5 else 700; H=int(sys.argv[6]) if len(sys.argv)>6 else 450; passes=int(sys.argv[7]) if len(sys.argv)>7 else 1
    cams={"tq":dict(cp=[-330,165,520],ct=[0,130,-20],fov=36),"front":dict(cp=[0,150,640],ct=[0,128,-20],fov=36),
          "tap":dict(cp=[-40,170,120],ct=[0,135,10],fov=30),"tapside":dict(cp=[130,150,60],ct=[0,135,10],fov=30)}
    cfg=dict(cams[view]); cfg.update(scene=scene,night=night,focus=1 if view.startswith("tap") else 0)
    render(cfg,out,W,H,passes)
