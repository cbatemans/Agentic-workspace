#version 300 es
precision highp float; precision highp int;
uniform vec2 u_res; uniform vec3 u_cp; uniform vec3 u_ct; uniform float u_fov;
uniform int u_scene; uniform float u_night; uniform vec2 u_jit; uniform float u_seed;
uniform sampler2D u_bird; uniform sampler2D u_birdC; uniform sampler2D u_plaque;
uniform float u_bar; // aspect h/w del colibri
uniform int u_focus; uniform int u_dbg; // 0 barra, 1 grifo
out vec4 fragColor;
#define PI 3.14159265
// materiales
#define M_FLOOR 0.
#define M_MINT 1.
#define M_GOLD 2.
#define M_NAVY 3.
#define M_WHITE 4.
#define M_MARBLE 5.
#define M_BOTTLE 7.
#define M_PLAQUE 8.
#define M_GREEN 10.
#define M_IVORY 11.
#define M_GLOW 12.
#define M_NAVYIN 13.
#define M_GLASS 14.
float gGlow=1e5;
float smin(float a,float b,float k){float h=max(k-abs(a-b),0.)/k;return min(a,b)-h*h*k*0.25;}
float smax(float a,float b,float k){return -smin(-a,-b,k);}
vec2 U(vec2 a,vec2 b){return a.x<b.x?a:b;}
float sdBox(vec3 p,vec3 b){vec3 q=abs(p)-b;return length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.);}
float sdRBox(vec3 p,vec3 b,float r){vec3 q=abs(p)-b+r;return length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.)-r;}
float sdCylY(vec3 p,float r,float h){vec2 d=vec2(length(p.xz)-r,abs(p.y)-h);return min(max(d.x,d.y),0.)+length(max(d,0.));}
float sdCylZ(vec3 p,float r,float h){vec2 d=vec2(length(p.xy)-r,abs(p.z)-h);return min(max(d.x,d.y),0.)+length(max(d,0.));}
float sdCap(vec3 p,vec3 a,vec3 b,float r){vec3 pa=p-a,ba=b-a;float h=clamp(dot(pa,ba)/dot(ba,ba),0.,1.);return length(pa-ba*h)-r;}
float sdTorusXZ(vec3 p,float R,float r){vec2 q=vec2(length(p.xz)-R,p.y);return length(q)-r;}
float extr(float d2,float z,float hz,float r){vec2 w=vec2(d2+r,abs(z)-hz+r);return min(max(w.x,w.y),0.)+length(max(w,0.))-r;}
float sprite(sampler2D t,vec2 q,float wcm,float ar){
  vec2 uv=vec2(q.x/wcm+0.5,0.5-q.y/(wcm*ar));
  float d=textureLod(t,clamp(uv,0.,1.),0.).r*wcm;
  vec2 o=(abs(uv-0.5)-0.5)*vec2(wcm,wcm*ar);
  return d+length(max(o,0.));
}
float flower2(vec2 q,float R){
  float d=1e5;
  for(int i=0;i<5;i++){float a=PI/2.+float(i)*2.*PI/5.;vec2 c=vec2(cos(a),sin(a))*R*0.56;d=smin(d,length(q-c)-R*0.44,R*0.14);}
  return d;
}
// flor de saúco 3D con volumen: petalos abombados, contorno navy, estambres navy con punto, centro verde. cara +z
vec2 flower3(vec3 p,float R,float th,float st,float glowIt){
  float dd=1e5;
  for(int i=0;i<5;i++){float a=PI/2.+float(i)*2.*PI/5.; vec3 c=vec3(cos(a),sin(a),0.)*R*0.56;
    vec3 e=(p-c)/vec3(R*0.46,R*0.46,th*0.85); dd=smin(dd,(length(e)-1.)*R*0.40,R*0.045);}
  vec3 e0=p/vec3(R*0.30,R*0.30,th*1.0); dd=smin(dd,(length(e0)-1.)*R*0.28,R*0.05);
  dd=max(dd,-p.z-0.01);
  vec2 r=vec2(dd,glowIt>0.5?M_GLOW:M_WHITE);
  float d2=flower2(p.xy,R)-R*0.065;
  r=U(r,vec2(extr(d2,p.z-th*0.12,th*0.12,0.12),M_NAVY));
  r=U(r,vec2(length(p-vec3(0.,0.,th*0.98))-R*0.115,M_GREEN));
  if(st>0.5){
    for(int i=0;i<5;i++){float a=PI/2.+PI/5.+float(i)*2.*PI/5.;vec2 dir=vec2(cos(a),sin(a));
      vec3 a0=vec3(dir*R*0.30,th*0.40), b0=vec3(dir*R*1.17,th*0.28);
      float sr=(st>1.5)?R*0.055:R*0.032;
      r=U(r,vec2(sdCap(p,a0,b0,sr),M_NAVY));
      r=U(r,vec2(length(p-b0)-sr*2.4,M_NAVY));}
  }
  if(glowIt>0.5) gGlow=min(gGlow,dd);
  return r;
}
vec2 bird3(vec3 p,float w,float th,bool chunky,float glowIt){
  float d2=chunky?sprite(u_birdC,p.xy,w,u_bar):sprite(u_bird,p.xy,w,u_bar);
  float d=extr(d2,p.z,th*0.5,min(th*0.4,w*0.05));
  if(glowIt>0.5) gGlow=min(gGlow,d);
  return vec2(d,glowIt>0.5?M_GLOW:M_WHITE);
}
float stad(vec3 p,float L2,float R){return length(vec2(max(abs(p.x)-L2,0.),p.z))-R;}
float fluteS(vec3 p){
  float L2=115.,R=35.;
  float s;
  if(abs(p.x)<=L2) s=p.x;
  else { float th=atan(abs(p.x)-L2,p.z); s=sign(p.x)*(L2+R*th); }
  return s;
}
// mostrador oval acanalado
vec2 counter(vec3 p){
  float ds=stad(p,115.,35.);
  float s=fluteS(p);
  float fl=-0.55*(0.5+0.5*cos(6.2832*s/5.0));
  float body=max(ds+fl,abs(p.y-54.)-46.);
  vec2 r=vec2(body,M_MINT);
  float band=max(ds-0.25,abs(p.y-97.5)-1.2); r=U(r,vec2(band,M_GOLD));
  float top=max(ds-2.,abs(p.y-102.)-2.); top=max(top,-(abs(p.y-102.)-2.)); r=U(r,vec2(top,M_MARBLE));
  float topgold=max(ds-2.1,abs(p.y-100.2)-0.5); r=U(r,vec2(topgold,M_GOLD));
  float plinth=max(ds+3.,abs(p.y-4.)-4.); r=U(r,vec2(plinth,M_NAVY));
  float plgold=max(ds+2.8,abs(p.y-8.4)-0.5); r=U(r,vec2(plgold,M_GOLD));
  return r;
}
// torre doble de grifos, origen en la encimera
vec2 taps(vec3 p){
  vec3 q=p-vec3(0.,102.,6.);
  vec2 r=vec2(1e5,0.);
  // bandeja de goteo estrecha con rejilla
  r=U(r,vec2(sdRBox(q-vec3(0.,0.8,9.),vec3(17.,0.8,6.),0.6),M_GOLD));
  r=U(r,vec2(sdRBox(q-vec3(0.,1.9,9.),vec3(15.,0.25,4.5),0.2),M_NAVY));
  // base comun
  r=U(r,vec2(sdRBox(q-vec3(0.,2.2,0.),vec3(17.,2.2,5.),1.5),M_GOLD));
  for(int i=0;i<2;i++){float x=(i==0?-9.:9.);
    vec3 c=q-vec3(x,0.,0.);
    // columna cilindrica con base acampanada y anillos
    float rad=3.0+2.2*exp(-max(c.y-4.,0.)*0.35);
    float col=sdCylY(c-vec3(0.,20.,0.),rad,18.);
    r=U(r,vec2(col,M_GOLD));
    r=U(r,vec2(sdCylY(c-vec3(0.,23.,0.),3.4,0.5),M_GOLD));
    // cabeza del grifo (collar grueso)
    r=U(r,vec2(sdCylY(c-vec3(0.,37.5,0.),3.9,2.0),M_GOLD));
    // caño frontal robusto
    r=U(r,vec2(sdCap(c,vec3(0.,11.,2.),vec3(0.,11.,9.),2.0),M_GOLD));
    r=U(r,vec2(sdCap(c,vec3(0.,11.,9.),vec3(0.,7.5,9.),2.0),M_GOLD));
    // cuello de palanca (grueso, 3.6 cm)
    r=U(r,vec2(sdCap(c,vec3(0.,39.,0.),vec3(0.,44.,-0.6),2.6),M_GOLD));
    r=U(r,vec2(length(c-vec3(0.,44.,-0.6))-3.0,M_GOLD));
  }
  float tl=0.12; mat2 R=mat2(cos(tl),sin(tl),-sin(tl),cos(tl));
  // palanca colibri (izq), pieza blanca maciza, asida desde la base
  {vec3 h=q-vec3(-9.,48.5,-0.6); h.yz=R*h.yz; r=U(r,bird3(h,13.,8.0,true,0.));}
  // palanca flor (der)
  {vec3 h=q-vec3(9.,50.,-0.6); h.yz=R*h.yz; r=U(r,flower3(h,5.8,4.6,2.,0.));}
  return r;
}
// ---------- elementos comunes de la barra trasera
float bottles(vec3 p,float y0,float z0,float x0,float x1){
  float cx=clamp(floor((p.x-x0)/8.5+0.5),0.,floor((x1-x0)/8.5));
  vec3 q=p-vec3(x0+cx*8.5,y0+11.,z0);
  float body=sdCylY(q,3.0,10.5); body=smin(body,sdCylY(q-vec3(0,11.,0),1.2,5.),1.5);
  return body;
}
vec2 backbar(vec3 p){
  vec3 q=p-vec3(0.,50.,-100.);
  float fl=-0.5*(0.5+0.5*cos(6.2832*p.x/5.0));
  float b=sdRBox(q,vec3(168.,46.,22.),3.)+fl*step(0.,-q.z+22.-1.);
  vec2 r=vec2(b,M_MINT);
  r=U(r,vec2(sdRBox(p-vec3(0.,102.,-100.),vec3(170.,2.,24.),1.),M_MARBLE));
  r=U(r,vec2(sdRBox(p-vec3(0.,4.,-100.),vec3(165.,4.,19.),1.),M_NAVY));
  r=U(r,vec2(max(sdRBox(q-vec3(0.,47.5,0.),vec3(168.8,1.0,22.8),0.5),-1.),M_GOLD));
  return r;
}
// ---------- RONDA 4
float sdArch2(vec2 p,float w,float y0,float yb){
  float d1=length(p-vec2(0.,y0))-w;
  float d2=max(abs(p.x)-w,max(p.y-y0,yb-p.y));
  return min(d1,d2);
}
float flutedPanel(vec3 p,float zf,float hw,float h){
  float fl=-0.5*(0.5+0.5*cos(6.2832*p.x/5.0));
  return sdBox(p-vec3(0.,h*0.5,zf-6.),vec3(hw,h*0.5,6.))+fl*step(0.,p.z-(zf-1.));
}
float bottleRing(vec3 p,float y0,float R0,float n){
  float r=length(p.xz); float a=atan(p.x,p.z); float sec=6.2832/n;
  float a2=mod(a+sec*0.5,sec)-sec*0.5;
  vec3 q=vec3(r*sin(a2),p.y-(y0+11.),r*cos(a2)-R0);
  float body=sdCylY(q,3.0,10.5); body=smin(body,sdCylY(q-vec3(0,11.,0),1.2,5.),1.5);
  return body;
}
vec3 toFascia(vec3 p,float a,float R,float yc){
  vec3 o=vec3(R*sin(a),yc,R*cos(a)); vec3 d=p-o; float ca=cos(a),sa=sin(a);
  return vec3(ca*d.x-sa*d.z,d.y,sa*d.x+ca*d.z);
}
vec2 ringCounter(vec3 p){
  float r=length(p.xz); float ang=atan(p.x,p.z);
  float fl=-0.55*(0.5+0.5*cos(6.2832*(ang*160.)/5.0));
  float body=max(max(r-160.+fl,100.-r),abs(p.y-54.)-46.);
  vec2 R=vec2(body,M_MINT);
  R=U(R,vec2(max(max(r-160.4,100.-r),abs(p.y-97.5)-1.2),M_GOLD));
  R=U(R,vec2(max(max(r-162.,98.-r),abs(p.y-102.)-2.),M_MARBLE));
  R=U(R,vec2(max(max(r-162.1,98.-r),abs(p.y-100.2)-0.5),M_GOLD));
  R=U(R,vec2(max(max(r-157.,100.-r),abs(p.y-4.)-4.),M_NAVY));
  R=U(R,vec2(max(max(r-160.45,100.-r),abs(p.y-76.)-4.),M_NAVY));
  R=U(R,vec2(max(max(r-157.3,100.-r),abs(p.y-8.4)-0.5),M_GOLD));
  return R;
}
// C1 isla circular con back bar central (torre vitrina) y corona
vec2 sceneC1(vec3 p){
  vec2 r=vec2(1e5,0.);
  float rr=length(p.xz); float ang=atan(p.x,p.z);
  // base de la torre (menta acanalado)
  float flc=-0.5*(0.5+0.5*cos(6.2832*(ang*50.)/5.0));
  r=U(r,vec2(max(rr-50.+flc,abs(p.y-52.)-52.),M_MINT));
  r=U(r,vec2(sdCylY(p-vec3(0.,104.5,0.),53.,1.8),M_MARBLE));
  r=U(r,vec2(sdCylY(p-vec3(0.,102.5,0.),53.5,0.5),M_GOLD));
  // vitrina abierta: 3 baldas de cristal, botellas en anillo, 8 montantes dorados
  for(int k=0;k<2;k++){float sy=146.+float(k)*40.;
    r=U(r,vec2(sdCylY(p-vec3(0.,sy,0.),49.,0.6),M_GLASS));
    r=U(r,vec2(bottleRing(p,sy+0.6,38.,10.),M_BOTTLE));}
  for(int i=0;i<8;i++){float a=float(i)*0.7854; r=U(r,vec2(sdCap(p,vec3(sin(a)*50.,105.,cos(a)*50.),vec3(sin(a)*50.,229.,cos(a)*50.),1.1),M_GOLD));}
  // corona baja y fina: fascia menta acanalada, bordes dorados, intrados blanco luminoso, cupula muy baja
  float flo=-0.55*(0.5+0.5*cos(6.2832*(ang*175.)/5.0));
  r=U(r,vec2(max(rr-175.+flo,abs(p.y-250.)-16.),M_MINT));
  r=U(r,vec2(max(rr-175.7,abs(p.y-234.6)-1.0),M_GOLD));
  r=U(r,vec2(max(rr-175.7,abs(p.y-265.4)-1.0),M_GOLD));
  r=U(r,vec2(max(rr-171.,abs(p.y-233.6)-0.6),M_GLOW));
  vec3 e=(p-vec3(0.,266.,0.))/vec3(175.,13.,175.);
  r=U(r,vec2(max((length(e)-1.)*13.,266.-p.y),M_MINT));
  // remate dorado de la torre
  r=U(r,vec2(sdCylY(p-vec3(0.,228.,0.),54.,2.5),M_GOLD));
  // logo curvo en la fascia
  float sh=max(max(abs(rr-176.0)-0.7,abs(ang*176.)-64.),abs(p.y-250.)-16.);
  sh=max(sh,-(rr-175.));
  r=U(r,vec2(sh,M_PLAQUE));
  // colibri y flor juntos, simetricos (el colibri siempre mira a la derecha, hacia la flor)
  r=U(r,bird3(toFascia(p,0.60,175.,250.),30.,3.8,true,1.));
  r=U(r,flower3(toFascia(p,0.92,175.,250.),14.,4.0,1.,1.));
  r=U(r,bird3(toFascia(p,-0.98,175.,250.),30.,3.8,true,1.));
  r=U(r,flower3(toFascia(p,-0.66,175.,250.),14.,4.0,1.,1.));
  return r;
}
// C2 arcos con toldo de arcadas
vec2 sceneC2(vec3 p){
  vec2 r=vec2(1e5,0.);
  float zf=-120.;
  r=U(r,vec2(flutedPanel(p,zf,170.,300.),M_MINT));
  r=U(r,vec2(sdBox(p-vec3(0.,14.,zf+0.4),vec3(170.,14.,1.8)),M_NAVY));
  r=U(r,vec2(sdBox(p-vec3(0.,29.,zf+0.8),vec3(170.,0.7,2.0)),M_GOLD));
  // arco central (navy) con colibri; flores agrupadas sobre el panel menta
  float dA=sdArch2(vec2(p.x,p.y),64.,150.,34.);
  r=U(r,vec2(extr(dA,p.z-(zf+1.),1.0,0.3),M_NAVYIN));
  r=U(r,vec2(extr(abs(dA+1.5)-1.7,p.z-(zf+1.5),1.8,0.6),M_GOLD));
  r=U(r,bird3(p-vec3(-4.,172.,zf+3.),50.,4.4,true,1.));
  r=U(r,flower3(p-vec3(92.,178.,zf+1.),17.,4.2,1.,1.));
  r=U(r,flower3(p-vec3(104.,146.,zf+1.),9.5,3.4,1.,1.));
  r=U(r,flower3(p-vec3(76.,214.,zf+1.),8.,3.2,1.,1.));
  // nichos laterales con producto (interior marfil)
  for(int i=0;i<2;i++){
    float cx=(i==0)?-132.:132.;
    float dn=sdArch2(vec2(p.x-cx,p.y),22.,156.,60.);
    r=U(r,vec2(extr(dn,p.z-(zf+1.),1.0,0.3),M_IVORY));
    r=U(r,vec2(extr(abs(dn+1.)-1.2,p.z-(zf+1.5),1.5,0.5),M_GOLD));
    for(int k=0;k<3;k++){float sy=86.+float(k)*32.;
      r=U(r,vec2(sdBox(p-vec3(cx,sy,zf+8.),vec3(20.,0.6,8.)),M_GLASS));
      r=U(r,vec2(bottles(p,sy+0.6,zf+8.,cx-8.5,cx+8.5),M_BOTTLE));}
  }
  // toldo: losa blanca en voladizo + faldon menta acanalado con arcadas y remates dorados
  r=U(r,vec2(sdRBox(p-vec3(0.,262.,-22.),vec3(173.,3.,98.),1.5),M_WHITE));
  float val=sdBox(p-vec3(0.,242.,75.5),vec3(173.,20.,1.5))+(-0.4*(0.5+0.5*cos(6.2832*p.x/5.0)))*step(0.,p.z-75.4);
  float dc=1e5;
  for(int i=0;i<4;i++){float cx=(i<2)?-1.:1.; cx*=(i%2==0)?103.:149.; dc=min(dc,sdArch2(vec2(p.x-cx,p.y),20.,229.,200.));}
  r=U(r,vec2(val,M_MINT));
  r=U(r,vec2(extr(dc+0.6,p.z-76.9,0.5,0.1),M_IVORY));
  r=U(r,vec2(extr(abs(dc)-0.9,p.z-76.9,0.8,0.2),M_GOLD));
  r=U(r,vec2(sdBox(p-vec3(0.,262.,75.8),vec3(173.,0.9,2.1)),M_GOLD));
  r=U(r,vec2(sdBox(p-vec3(0.,222.,75.8),vec3(173.,0.9,2.1)),M_GOLD));
  r=U(r,vec2(sdBox(p-vec3(0.,226.,76.2),vec3(173.,2.5,1.2)),M_NAVY));
  // logo en el faldon (centro macizo)
  r=U(r,vec2(sdBox(p-vec3(0.,242.,77.4),vec3(76.,19.,0.7)),M_PLAQUE));
  return r;
}
// C3 aro fino con back bar
vec2 sceneC3(vec3 p){
  vec2 r=vec2(1e5,0.);
  float zf=-120.;
  r=U(r,vec2(flutedPanel(p,zf,150.,300.),M_MINT));
  r=U(r,vec2(sdBox(p-vec3(0.,14.,zf+0.4),vec3(150.,14.,1.8)),M_NAVY));
  r=U(r,vec2(sdBox(p-vec3(0.,29.,zf+0.8),vec3(150.,0.7,2.0)),M_GOLD));
  // back bar bajo (menta acanalado, marmol)
  float fb=-0.5*(0.5+0.5*cos(6.2832*p.x/5.0));
  r=U(r,vec2(sdBox(p-vec3(0.,48.,-108.),vec3(140.,48.,12.))+fb*step(0.,p.z+97.),M_NAVY));
  r=U(r,vec2(sdBox(p-vec3(0.,98.,-108.),vec3(142.,2.,13.)),M_MARBLE));
  r=U(r,vec2(sdBox(p-vec3(0.,95.8,-108.),vec3(141.,0.7,12.8)),M_GOLD));
  r=U(r,vec2(sdBox(p-vec3(0.,3.,-108.),vec3(138.,3.,11.)),M_GOLD));
  vec3 C=vec3(0.,200.,zf); vec3 q=p-C;
  r=U(r,vec2(extr(length(q.xy)-82.,q.z-1.,1.0,0.3),M_NAVYIN));
  r=U(r,vec2(length(vec2(abs(length(q.xy)-84.),q.z-7.))-1.9,M_GOLD));
  for(int i=0;i<4;i++){float an=0.785+float(i)*1.5708; vec2 d=vec2(cos(an),sin(an))*84.;
    r=U(r,vec2(sdCap(q,vec3(d,1.),vec3(d,7.),1.4),M_GOLD));}
  // logo (placa menta sobre el disco)
  r=U(r,vec2(sdRBox(p-vec3(0.,208.,zf+3.),vec3(62.,15.5,0.8),1.5),M_PLAQUE));
  // balda con producto sobre el disco
  r=U(r,vec2(sdBox(p-vec3(0.,150.,zf+9.),vec3(40.,1.0,8.)),M_GOLD));
  for(int i=-1;i<=1;i+=2){r=U(r,vec2(sdBox(p-vec3(float(i)*30.,144.,zf+6.),vec3(1.2,6.,5.)),M_GOLD));}
  r=U(r,vec2(bottles(p,151.,zf+9.,-17.,17.),M_BOTTLE));
  // flores sobre el aro (fondo menta) en dos grupos y colibri dentro del disco
  for(int i=0;i<3;i++){
    float an[3]; float sz[3]; an[0]=0.82; sz[0]=20.; an[1]=1.24; sz[1]=11.; an[2]=0.40; sz[2]=9.;
    vec3 c=vec3(cos(an[i])*90.,sin(an[i])*90.,8.);
    r=U(r,flower3(q-c,sz[i],4.0,1.,1.));
  }
  r=U(r,bird3(p-vec3(-26.,244.,zf+3.),50.,4.2,true,1.));
  return r;
}
vec2 map(vec3 p){
  vec2 r=vec2(p.y,M_FLOOR);
  gGlow=1e5;
  if(u_focus==1){
    // escena de grifo: encimera recortada
    r=U(r,counter(p)); r=U(r,taps(p)); return r;
  }
  // volumen envolvente de la barra
  vec2 c=(u_scene==1)?ringCounter(p):counter(p);
  r=U(r,c);
  r=U(r,(u_scene==1)?taps(p-vec3(0.,0.,122.)):taps(p));
  if(u_scene==1) r=U(r,sceneC1(p));
  else if(u_scene==2) r=U(r,sceneC2(p));
  else r=U(r,sceneC3(p));
  return r;
}
vec3 normalAt(vec3 p){
  const vec2 k=vec2(1.,-1.); float e=0.12;
  return normalize(k.xyy*map(p+k.xyy*e).x+k.yyx*map(p+k.yyx*e).x+k.yxy*map(p+k.yxy*e).x+k.xxx*map(p+k.xxx*e).x);
}
float softShadow(vec3 ro,vec3 rd,float tmax,float k){
  float res=1.;float t=0.6;
  for(int i=0;i<48;i++){float h=map(ro+rd*t).x; res=min(res,k*h/t); t+=clamp(h,0.6,10.); if(res<0.002||t>tmax)break;}
  return clamp(res,0.,1.);
}
float calcAO(vec3 p,vec3 n){
  float occ=0.,sca=1.;
  for(int i=0;i<5;i++){float h=0.5+float(i)*float(i)*1.6; float d=map(p+n*h).x; occ+=(h-d)*sca; sca*=0.7;}
  return clamp(1.-0.018*occ,0.,1.);
}
vec3 env(vec3 rd){
  float t=clamp(rd.y*0.5+0.5,0.,1.);
  vec3 day=mix(vec3(0.80,0.74,0.64),vec3(0.42,0.58,0.80),smoothstep(0.5,1.,t));
  day+=vec3(1.0,0.95,0.85)*2.5*pow(max(dot(rd,normalize(vec3(-0.5,0.8,0.6))),0.),24.);
  vec3 night=mix(vec3(0.018,0.026,0.05),vec3(0.03,0.05,0.10),smoothstep(0.4,1.,t));
  night+=vec3(1.0,0.7,0.35)*0.25*pow(max(dot(rd,normalize(vec3(0.,0.3,1.))),0.),6.);
  return mix(day,night,u_night);
}
void matProps(float id,vec3 p,vec3 n,out vec3 alb,out float rough,out float metal,out vec3 emi,out float refl){
  emi=vec3(0.);refl=0.;metal=0.;rough=0.5;alb=vec3(0.8);
  if(id<0.5){ // suelo: piedra clara con juntas
    vec2 g=p.xz/60.; vec2 f=abs(fract(g)-0.5); float joint=smoothstep(0.495,0.5,max(f.x,f.y));
    alb=mix(vec3(0.80,0.76,0.69),vec3(0.62,0.58,0.52),joint); rough=0.35; refl=0.18;
    alb=mix(alb,vec3(0.05,0.065,0.1),u_night*0.85);
  }
  else if(id<1.5){alb=vec3(0.71,0.95,0.80);rough=0.55;}
  else if(id<2.5){alb=vec3(0.68,0.55,0.32);rough=0.75;metal=1.;refl=0.30;}
  else if(id<3.5){alb=vec3(0.008,0.04,0.11);rough=0.4;refl=0.025;}
  else if(id<4.5){alb=vec3(0.93,0.92,0.88);rough=0.55;refl=0.02;}
  else if(id<5.5){alb=vec3(0.92,0.91,0.88);rough=0.12;refl=0.15;}
  else if(id<7.5){alb=vec3(0.86,0.90,0.66);rough=0.08;refl=0.3;emi=vec3(0.9,0.8,0.4)*0.10*u_night;}
  else if(id<8.5){ // placa
    vec3 c=vec3(0.);
    alb=vec3(0.01,0.05,0.13); rough=0.35;
  }
  else if(id<10.5){alb=vec3(0.50,0.90,0.66);rough=0.4;emi=vec3(0.4,0.9,0.55)*0.35*u_night;}
  else if(id<11.5){alb=vec3(0.95,0.93,0.86);rough=0.5;}
  else if(id<12.5){alb=vec3(0.96,0.94,0.9);rough=0.3;emi=vec3(1.0,0.78,0.42)*1.4*u_night;refl=0.05;}
  else if(id<13.5){alb=vec3(0.02,0.06,0.15);rough=0.5;}
  else {alb=vec3(0.6,0.8,0.9);rough=0.05;refl=0.5;}
}
vec3 shade(vec3 ro,vec3 rd,float t,float id,int depth){
  vec3 p=ro+rd*t; vec3 n=normalAt(p);
  vec3 alb,emi; float rough,metal,refl;
  matProps(id,p,n,alb,rough,metal,emi,refl);
  alb=pow(alb,vec3(2.2));
  if(abs(id-M_PLAQUE)<0.5){
    vec2 uv; bool ok=true;
    if(u_scene==1){ float an=atan(p.x,p.z); uv=vec2(0.5+an*176./128.,0.5-(p.y-250.)/32.); ok=dot(n,normalize(vec3(p.x,0.,p.z)))>0.6; }
    else { vec3 cen=(u_scene==2)?vec3(0.,242.,0.):vec3(0.,208.,0.); vec2 hw=(u_scene==2)?vec2(76.,19.):vec2(62.,15.5);
      uv=vec2((p.x-cen.x)/(2.*hw.x)+0.5,0.5-(p.y-cen.y)/(2.*hw.y)); ok=n.z>0.6; }
    if(ok){ vec4 tc=textureLod(u_plaque,uv,1.0); alb=pow(tc.rgb,vec3(2.2)); }
  }
  if(u_dbg==1) return alb;
  if(u_dbg==2) return n*0.5+0.5;
  vec3 L=normalize(vec3(-0.5,0.78,0.62));
  float sh=softShadow(p+n*0.4,L,400.,14.);
  float ao=calcAO(p,n);
  float dif=max(dot(n,L),0.);
  vec3 V=-rd; vec3 H=normalize(L+V);
  float spec=pow(max(dot(n,H),0.),mix(8.,160.,1.-rough))*(1.-rough)*3.;
  vec3 sunC=mix(vec3(1.0,0.92,0.80)*3.4,vec3(0.45,0.55,0.9)*0.35,u_night);
  vec3 sky=pow(env(n),vec3(2.2))*0.75*mix(1.,1.2,u_night);
  vec3 amb=sky*mix(ao,1.,0.45)*1.35;
  vec3 col=alb*(amb+sunC*dif*sh);
  vec3 F0=mix(vec3(0.04),alb,metal);
  col+=F0*spec*sunC*sh;
  // luces cálidas de noche
  if(u_night>0.01){
    vec3 lp[4]; vec3 lc[4]; float lr[4];
    lp[0]=vec3(0.,215.,40.); lc[0]=vec3(1.0,0.72,0.38)*1.7; lr[0]=170.;
    lp[1]=(u_scene==2)?vec3(10.,176.,-100.):vec3(90.,205.,20.); lc[1]=vec3(1.0,0.72,0.38)*1.3; lr[1]=130.;
    lp[2]=vec3(0.,6.,52.); lc[2]=vec3(1.0,0.66,0.3)*1.2; lr[2]=120.;
    lp[3]=vec3(0.,150.,-60.); lc[3]=vec3(1.0,0.7,0.35)*0.9; lr[3]=220.;
    for(int i=0;i<4;i++){
      vec3 d=lp[i]-p; float dist=length(d); vec3 ld=d/dist;
      float att=1./(1.+pow(dist/lr[i],2.)*3.); att*=smoothstep(lr[i]*3.,lr[i]*0.5,dist);
      float nl=max(dot(n,ld),0.)*0.8+0.2;
      vec3 hh=normalize(ld+V);
      float sp=pow(max(dot(n,hh),0.),mix(8.,120.,1.-rough))*(1.-rough)*2.;
      col+=(alb*nl+F0*sp)*lc[i]*att*ao*u_night;
    }
  }
  // reflejo (1 rebote) en metales y suelo
  if(refl>0.01 && depth==0){
    vec3 rdv=reflect(rd,n);
    vec3 rc=env(rdv);
    // marcha corta
    float tt=1.; float hit=-1.; float hid=0.;
    vec3 o=p+n*0.6;
    for(int i=0;i<64;i++){vec2 m=map(o+rdv*tt); if(m.x<0.04*tt*0.1+0.03){hit=tt;hid=m.y;break;} tt+=m.x*0.95; if(tt>700.)break;}
    if(hit>0.){
      vec3 pp=o+rdv*hit; vec3 nn=normalAt(pp);
      vec3 a2,e2;float r2,m2,rf2;
      matProps(hid,pp,nn,a2,r2,m2,e2,rf2); a2=pow(a2,vec3(2.2));
      float dl=max(dot(nn,L),0.);
      vec3 c2=a2*(env(nn)*0.7+sunC*dl*0.7)+e2;
      if(u_night>0.01){ c2+=a2*vec3(1.0,0.72,0.38)*0.5*u_night; }
      rc=c2;
    }
    float fr=pow(1.-max(dot(n,V),0.),4.);
    float k=(metal>0.5)?refl:(refl*(0.25+0.75*fr));
    col=mix(col,rc*(metal>0.5?alb:vec3(1.)),clamp(k,0.,1.));
  }
  col+=alb*0.13*(1.-u_night)*(1.-metal);
  col+=emi;
  return col;
}
vec3 render(vec2 fc){
  vec2 uv=(fc+u_jit-0.5*u_res)/u_res.y;
  vec3 fw=normalize(u_ct-u_cp); vec3 rt=normalize(cross(fw,vec3(0.,1.,0.))); vec3 up=cross(rt,fw);
  float fl=0.5/tan(radians(u_fov)*0.5);
  vec3 rd=normalize(uv.x*rt+uv.y*up+fl*fw);
  vec3 ro=u_cp;
  float t=0.5; float id=-1.; float glowAcc=0.; 
  for(int i=0;i<220;i++){
    vec3 p=ro+rd*t; vec2 m=map(p);
    if(u_night>0.01){ glowAcc+=exp(-gGlow*0.11)*min(m.x,6.)*0.0035; }
    if(m.x<0.00025*t+0.006){id=m.y;break;}
    t+=m.x*0.9; if(t>2500.)break;
  }
  vec3 col;
  if(id<0.){
    col=env(rd);
    // piso al horizonte
    col=mix(col,env(vec3(rd.x,0.15,rd.z)),0.);
  } else {
    col=shade(ro,rd,t,id,0);
    // niebla suave hacia el fondo
    float fog=1.-exp(-t*0.00011);
    col=mix(col,env(rd),clamp(fog*0.8,0.,1.));
  }
  col+=vec3(1.0,0.74,0.4)*glowAcc*u_night*1.1;
  return col;
}
void main(){
  vec3 c=render(gl_FragCoord.xy);
  // tono
  c*=0.66; c=(c*(2.51*c+0.03))/(c*(2.43*c+0.59)+0.14); c=clamp(c,0.,1.);
  c=pow(c,vec3(1./2.2));
  // viñeta
  vec2 q=gl_FragCoord.xy/u_res; c*=0.55+0.45*pow(16.*q.x*q.y*(1.-q.x)*(1.-q.y),0.14);
  // dither
  float n=fract(sin(dot(gl_FragCoord.xy+u_seed,vec2(12.9898,78.233)))*43758.5453);
  c+=(n-0.5)/255.;
  fragColor=vec4(c,1.);
}
