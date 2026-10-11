import { useEffect, useRef } from 'react';
import type { AudioLevels } from '../player/useAudioLevels';
import type { ShaderPresetIndex } from './shaderPresets';

const vertex = `#version 300 es
in vec2 position;
void main(){ gl_Position=vec4(position,0.,1.); }`;

// time = wall clock, phase = music-driven clock (runs faster when the track is loud),
// beat = 1 on a detected kick and decays towards 0.
const fragment = `#version 300 es
precision highp float;
uniform vec2 resolution;
uniform float time;
uniform float phase;
uniform float mode;
uniform float bass;
uniform float mid;
uniform float treble;
uniform float level;
uniform float beat;
out vec4 outColor;

const float TAU=6.28318531;
mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
float hash(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
float noise(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f); return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y); }
float fbm(vec2 p){ float v=0.,a=.5; for(int i=0;i<5;i++){v+=a*noise(p);p=rot(.5)*p*2.02+17.1;a*=.5;} return v; }
float line(float d,float w){return 1.-smoothstep(0.,w,abs(d));}
float glow(float d,float w){return w/(abs(d)+w);}
vec3 palette(float t){ return .5+.5*cos(TAU*(t+vec3(0.,.33,.67))); }
float stars(vec2 frag,float density){ vec2 g=frag/7., cell=floor(g); float h=hash(cell); vec2 o=vec2(h,fract(h*13.7))-.5;
 return smoothstep(.22,0.,length(fract(g)-.5-o*.5))*smoothstep(1.-2.5/density,1.,h)*(.6+.4*sin(time*3.+h*40.)); }

// Every world is a ride towards the same vanishing point: a floor below HOR seen from height CAM,
// scrolled by the music-driven phase so the trip speeds up when the track is loud.
const float HOR=-.04;
const float CAM=.3;

// Depth of the floor under a pixel below the horizon (grows towards the horizon).
float floorZ(float y){ return CAM/max(HOR-y,1e-4); }
// Lines on every n+.5 of v, faded out where they get denser than a pixel.
float aaLines(float v,float w){ float fw=max(fwidth(v),1e-4); return (1.-smoothstep(0.,w,abs(fract(v)-.5)/fw))*smoothstep(.5,.15,fw); }
float haze(vec2 p,float k){ return exp(-abs(p.y-HOR)*k); }

vec3 retroSun(vec3 col,vec2 sp,float rad,vec3 lo,vec3 hi,float t){
 float cut=step(fract(sp.y*18.+t*.35),.45*smoothstep(.05,-.2,sp.y));
 return mix(col,mix(lo,hi,smoothstep(-rad,rad,sp.y)),smoothstep(rad,rad-.006,length(sp))*(1.-cut));
}

// Poles at world x = ±side every gap units, sweeping past. x = pole coverage, y = glow at the pole tops.
vec2 posts(vec2 p,float s,float side,float h,float gap){
 float cov=0., tip=0.;
 for(int i=0;i<7;i++){
  float z=(float(i)+1.-fract(s/gap))*gap;
  float fade=smoothstep(7.*gap,3.5*gap,z);
  float dx=abs(abs(p.x)-side/z), top=HOR+(h-CAM)/z;
  cov=max(cov,smoothstep(.012/z+.001,.006/z,dx)*step(HOR-CAM/z,p.y)*step(p.y,top)*fade);
  tip+=glow(length(vec2(dx,p.y-top)),.006/z+.0008)*fade;
 }
 return vec2(cov,tip);
}

// Particles flying out of the vanishing point c towards the camera (snow, dust, sparks).
float rush(vec2 p,vec2 c,float t,float density,float size){
 float acc=0.;
 for(int i=0;i<4;i++){ float f=float(i);
  float z=fract(f*.25+t);
  vec2 g=(p-c)*mix(16.,1.4,z*z)+f*7.3, id=floor(g);
  float h=hash(id+f*13.);
  vec2 o=(vec2(h,fract(h*9.1))-.5)*.7;
  acc+=smoothstep(size,0.,length(fract(g)-.5-o))*step(1.-density,fract(h*31.7))*smoothstep(0.,.35,z)*smoothstep(1.,.8,z);
 }
 return acc;
}

vec3 skyCruise(vec2 p,float t){
 float y=p.y-HOR, s=phase*1.1;
 vec3 sky=mix(vec3(1.,.64,.6),vec3(.28,.32,.78),smoothstep(0.,.5,y));
 vec2 sp=p-vec2(.13,.1); float rad=.07+bass*.015+beat*.01;
 sky+=vec3(1.,.72,.5)*exp(-length(sp)*6.)*(.45+level*.5+beat*.3);
 sky=mix(sky,vec3(1.,.97,.86),smoothstep(rad,rad-.006,length(sp)));
 float wisps=fbm(vec2(p.x*2.5-time*.03,y*12.));
 sky=mix(sky,vec3(1.,.84,.86),smoothstep(.5,.8,wisps)*smoothstep(.03,.1,y)*smoothstep(.45,.12,y)*.55);
 float z=floorZ(p.y); vec2 w=vec2(p.x*z,z+s);
 float near=smoothstep(12.,3.,z);
 float c=fbm(w*vec2(1.1,.7))+(fbm(w*2.6+4.)-.5)*.35*near;
 float lit=clamp(.5+(c-fbm((w+vec2(.08,.16))*vec2(1.1,.7)))*5.,0.,1.);
 vec3 cloud=mix(vec3(.5,.38,.76),vec3(1.,.9,.88),lit)+vec3(1.,.6,.45)*pow(lit,4.)*.3;
 cloud=mix(vec3(.16,.12,.4),cloud,smoothstep(.4,.58,c));
 cloud+=vec3(1.,.55,.75)*beat*.12*near;
 cloud=mix(cloud,vec3(1.,.8,.76),haze(p,18.));
 vec3 col=mix(sky,cloud,smoothstep(.002,-.002,y));
 return col+vec3(1.,.9,.95)*rush(p,vec2(0.,HOR),s*.2,.12,.05)*(.25+treble*.6);
}

// Sky, distant skyline and the building walls at world x = ±.5 that line the street.
vec3 cityAbove(vec2 p,float s,vec3 skyLo,vec3 skyHi,vec3 neonA,vec3 neonB,float fogK){
 float y=p.y-HOR;
 vec3 col=mix(skyLo,skyHi,smoothstep(0.,.4,y));
 col+=vec3(.9,.9,1.)*stars(gl_FragCoord.xy,70.)*smoothstep(.12,.3,y)*.4;
 float tx=p.x*20., tower=(.02+hash(vec2(floor(tx),3.))*.07)*smoothstep(.7,.1,abs(p.x));
 tower*=step(.12,fract(tx))*step(fract(tx),.92);
 vec2 wg=vec2(p.x*150.,y*110.);
 float farLit=step(.7,hash(floor(wg)))*step(.4,fract(wg.x))*step(.4,fract(wg.y));
 vec3 skyline=mix(mix(skyLo*.55,skyHi,.3),mix(neonA,neonB,hash(floor(wg)+.5))*.7,farLit*.8);
 col=mix(col,skyline,smoothstep(tower+.002,tower-.002,y)*step(0.,y));
 col+=mix(neonA,neonB,.5)*glow(y-tower,.004)*step(0.,y)*step(.01,tower)*.15;
 float zw=.5/max(abs(p.x),1e-3), yw=y*zw, zz=zw+s, side=sign(p.x);
 float blk=floor(zz/1.6), bf=fract(zz/1.6), bh=hash(vec2(blk,side));
 float wall=step(yw,.15+bh*.85)*step(.05,bf)*step(-CAM,yw);
 vec2 g=vec2(zz*5.,yw*8.), f=fract(g);
 float pane=step(.2,f.x)*step(f.x,.8)*step(.25,f.y)*step(f.y,.75)*step(.5,hash(floor(g)+side*17.));
 pane=mix(pane,.22,smoothstep(3.,8.,zw))*step(-.2,yw);
 vec3 wc=vec3(.035,.025,.06)+mix(vec3(1.,.72,.42),neonB,step(.8,fract(bh*13.)))*pane*(.55+mid*.5);
 float shop=glow(yw+.2,.012)*(.6+beat*.8);
 wc+=mix(neonA,neonB,step(.5,fract(bh*7.)))*shop;
 float sign_=step(.45,fract(bh*3.1))*smoothstep(.025,.0,abs(bf-.3))*step(-.12,yw)*step(yw,.35);
 wc+=mix(neonB,neonA,step(.5,fract(bh*5.)))*sign_*(1.4+beat*1.2);
 wc=mix(wc,skyLo*.8+mix(neonA,neonB,.5)*.08,max(1.-exp(-zw*fogK),smoothstep(5.,12.,zw)));
 return mix(col,wc,wall);
}

vec3 city(vec2 p,float t,vec3 skyLo,vec3 skyHi,vec3 neonA,vec3 neonB,float fogK,float wet){
 float s=phase*1.5;
 vec3 col=cityAbove(p,s,skyLo,skyHi,neonA,neonB,fogK);
 float zg=floorZ(p.y), xw=p.x*zg, zw=.5/max(abs(p.x),1e-3);
 float near=smoothstep(14.,4.,zg);
 vec3 road=vec3(.02,.016,.03);
 road=mix(road,vec3(.05,.045,.07),step(.4,abs(xw)));
 road+=vec3(.9,.85,.7)*step(abs(xw),.01)*step(.55,fract((zg+s)*.6))*near*smoothstep(1.,2.2,zg);
 road+=neonA*smoothstep(.012,0.,abs(abs(xw)-.4))*near*(.4+beat*.6);
 float rip=(noise(vec2(xw*6.,(zg+s)*2.))-.5)*.012*near;
 vec3 refl=cityAbove(vec2(p.x+rip,2.*HOR-p.y),s,skyLo,skyHi,neonA,neonB,fogK);
 road+=refl*wet*(.35+.4*near);
 road=mix(road,skyLo*.7,haze(p,18.));
 return mix(col,road,step(p.y,HOR)*step(zg,zw));
}

vec3 rainStreaks(vec2 p){
 float acc=0.;
 for(int i=0;i<2;i++){ float f=float(i);
  vec2 q=vec2((p.x+p.y*.12)*(110.+f*60.),p.y);
  float h=hash(vec2(floor(q.x),f));
  float y=fract(q.y*(1.4+h)+time*(2.2+h*1.6)+h*10.);
  acc+=step(.72,h)*smoothstep(.45,.1,abs(fract(q.x)-.5))*smoothstep(0.,.03,y)*smoothstep(.22,.05,y)*(1.-f*.4);
 }
 return vec3(.6,.8,1.)*acc;
}

vec3 snowDrift(vec2 p,float t){
 float y=p.y-HOR, s=phase*1.1;
 vec3 sky=mix(vec3(.78,.7,.86),vec3(.1,.17,.38),smoothstep(0.,.45,y));
 sky+=vec3(.9,.95,1.)*stars(gl_FragCoord.xy,90.)*smoothstep(.15,.35,y)*.5;
 vec2 mp=p-vec2(-.17,.2);
 sky+=vec3(.6,.7,1.)*exp(-length(mp)*9.)*.35;
 sky=mix(sky,vec3(.95,.97,1.),smoothstep(.05,.044,length(mp)));
 float farRidge=HOR+.02+fbm(vec2(p.x*5.+3.,2.))*.08;
 sky=mix(sky,vec3(.55,.58,.8),smoothstep(farRidge+.003,farRidge-.003,p.y));
 float ridge=HOR+.01+fbm(vec2(p.x*3.,5.))*.12*(.75+mid*.6);
 float slope=fbm(vec2(p.x*9.,p.y*6.));
 vec3 mount=mix(vec3(.12,.15,.32),vec3(.85,.9,1.),smoothstep(ridge-.035,ridge-.01,p.y)*smoothstep(.4,.6,slope)*.9);
 sky=mix(sky,mount,smoothstep(ridge+.003,ridge-.003,p.y));
 float z=floorZ(p.y); vec2 w=vec2(p.x*z,z+s);
 float near=smoothstep(10.,2.,z);
 float drift=fbm(w*vec2(.9,.5)), lee=fbm((w+vec2(.1,.15))*vec2(.9,.5));
 vec3 snow=mix(vec3(.18,.24,.5),vec3(.66,.72,.92),clamp(.62+(drift-lee)*3.*near,0.,1.));
 snow*=1.-smoothstep(.035,.012,abs(abs(w.x)-.16))*near*.35;
 snow+=vec3(.8,.9,1.)*step(.994,hash(floor(gl_FragCoord.xy/2.)+floor(s*6.)))*near*(.4+treble);
 snow=mix(snow,vec3(.6,.56,.78),haze(p,24.));
 vec3 col=mix(sky,snow,smoothstep(.002,-.002,y));
 vec2 po=posts(p,s,.55,.13,1.5);
 col=mix(col,vec3(.14,.12,.22),po.x);
 col+=vec3(1.,.35,.25)*po.y*(.3+beat*.4);
 return col+vec3(1.)*rush(p,vec2(0.,HOR),s*.3,.35,.07)*(.45+treble*.8);
}

vec3 sunnyCoast(vec2 p,float t){
 float y=p.y-HOR, s=phase*1.2;
 vec3 sky=mix(vec3(.78,.92,1.),vec3(.1,.42,.9),smoothstep(0.,.45,y));
 vec2 sp=p-vec2(.2,.25);
 sky+=vec3(1.,.95,.75)*(exp(-length(sp)*5.)*(.5+level*.4)+smoothstep(.05,.044,length(sp)));
 vec2 cp=vec2(p.x*3.-time*.02,y*5.+2.);
 float cl=fbm(cp), under=fbm(cp-vec2(0.,.1));
 sky=mix(sky,mix(vec3(.7,.78,.92),vec3(1.),clamp((cl-under)*6.+.6,0.,1.)),smoothstep(.55,.72,cl)*smoothstep(.03,.12,y));
 float isl=.05*exp(-pow((p.x+.22)*6.,2.))+.022*exp(-pow((p.x-.33)*11.,2.))+(fbm(vec2(p.x*14.,1.))-.5)*.012;
 sky=mix(sky,mix(vec3(.16,.42,.36),vec3(.62,.8,.9),.35),step(p.y,HOR+isl)*step(HOR,p.y));
 float z=floorZ(p.y); vec2 w=vec2(p.x*z,z+s);
 float near=smoothstep(12.,3.,z);
 float swell=.5+.5*sin(w.y*4.+fbm(w*.7)*5.+time);
 vec3 sea=mix(vec3(.08,.62,.72),vec3(.04,.3,.62),smoothstep(1.5,9.,z));
 sea*=.8+.35*swell*near;
 sea+=vec3(1.)*smoothstep(.86,.97,swell)*near*(.35+mid*.5);
 float glint=step(.8,noise(w*vec2(9.,4.)+time*1.5))*exp(-abs(p.x-.2)*(5.+z*.6));
 sea+=vec3(1.,.97,.85)*glint*(.8+treble*1.5);
 sea=mix(sea,vec3(.75,.9,1.),haze(p,22.));
 return mix(sky,sea,smoothstep(.002,-.002,y));
}

vec3 desertRun(vec2 p,float t){
 float y=p.y-HOR, s=phase*1.6;
 vec3 sky=mix(vec3(1.,.48,.26),vec3(.2,.05,.3),smoothstep(-.02,.45,y));
 sky+=vec3(1.,.5,.2)*exp(-length(p-vec2(0.,.08))*5.)*(.2+level*.3);
 sky=retroSun(sky,p-vec2(0.,.08),.17+bass*.02+beat*.015,vec3(1.,.28,.25),vec3(1.,.9,.45),t);
 float mx=p.x*2.4+.35, fm=fract(mx), mh=hash(vec2(floor(mx),9.));
 float mesa=HOR+(.03+mh*.06)*smoothstep(.12,.3,fm)*smoothstep(.88,.7,fm)*step(.3,mh);
 sky=mix(sky,vec3(.26,.06,.16),step(p.y,mesa)*step(HOR,p.y));
 sky+=vec3(1.,.4,.3)*glow(p.y-mesa,.002)*step(HOR+.002,mesa)*.4;
 float z=floorZ(p.y); vec2 w=vec2(p.x*z,z+s);
 float near=smoothstep(14.,3.,z);
 float ripple=.5+.5*sin(w.y*3.+fbm(w*.4)*6.);
 vec3 sand=mix(vec3(.42,.12,.2),vec3(1.,.52,.3),mix(.35,ripple*.7+.15,near));
 float xw=abs(w.x);
 vec3 road=vec3(.08,.03,.1)+vec3(1.,.35,.6)*smoothstep(.02,0.,abs(xw-.38))*near*(.5+beat*.7);
 road+=vec3(1.,.85,.5)*step(xw,.012)*step(.5,fract(w.y*.45))*near*smoothstep(1.,2.2,z);
 vec3 ground=mix(sand,road,step(xw,.42));
 ground=mix(ground,vec3(.8,.3,.32),haze(p,34.)*.85);
 vec3 col=mix(sky,ground,smoothstep(.002,-.002,y));
 vec2 po=posts(p,s,.62,.3,2.);
 col=mix(col,vec3(.1,.02,.08),po.x);
 return col+vec3(1.,.75,.4)*po.y*(.9+beat*.8);
}

vec3 pulseGrid(vec2 p,float t){
 vec3 col=mix(vec3(.3,.03,.22),vec3(.03,.0,.07),smoothstep(-.02,.45,p.y));
 col=retroSun(col,p-vec2(0.,.1),.2+bass*.025+beat*.02,vec3(1.,.15,.55),vec3(1.,.85,.35),t);
 float ridge=HOR+.015+fbm(vec2(p.x*3.5,2.))*.12*(.55+mid*.9);
 float mount=step(HOR,p.y)*smoothstep(ridge+.004,ridge-.004,p.y);
 col=mix(col,vec3(.07,.01,.1),mount);
 col+=vec3(1.,.3,.75)*glow(p.y-ridge,.003)*step(HOR,p.y)*(.3+mid*.6);
 if(p.y<HOR){
  float d=HOR-p.y, depth=.3/(d+.015);
  vec2 g=vec2(p.x*depth,depth+phase*1.4);
  vec2 lw=abs(fract(g)-.5)/fwidth(g);
  float grid=1.-smoothstep(0.,1.4,min(lw.x,lw.y));
  col=mix(vec3(.05,0.,.08),vec3(.15,0.,.15),d*2.)+vec3(1.,.2,.7)*grid*(.35+level*.9)*smoothstep(0.,.08,d);
 }
 col+=vec3(1.,.35,.75)*haze(p,30.)*(.35+beat*.8);
 return col;
}

vec3 hyperspace(vec2 p,float r,float a){
 vec3 col=vec3(.01,.01,.04)+vec3(.35,.3,1.)*exp(-r*5.)*(.4+bass*.8+beat*.6);
 col+=vec3(.9,.4,1.)*fbm(vec2(a*2.,log(r+1e-3)*2.-phase*.8))*exp(-r*3.)*.35;
 float lr=log(r+1e-3), len=.12+beat*.2+level*.12;
 for(int i=0;i<3;i++){ float f=float(i);
  float u=a/TAU*(70.+f*40.)+f*.37, h=hash(vec2(floor(u),f));
  float along=fract(lr*.9-phase*(.7+h*.5)*(1.+f*.2)+h*9.);
  float streak=smoothstep(0.,len,along)*smoothstep(len+.015,len,along)*smoothstep(.14,0.,abs(fract(u)-.5))*step(.5,h);
  col+=mix(vec3(.55,.7,1.),vec3(1.,.75,1.),fract(h*7.))*streak*smoothstep(.02,.2,r)*(.6+treble*1.2);
 }
 col+=vec3(.75,.8,1.)*rush(p,vec2(0.),phase*.35,.3,.06)*(.35+treble*.7);
 col+=vec3(.6,.4,1.)*glow(r-.05-bass*.03-beat*.04,.01)*exp(-r*4.)*.25;
 return col+vec3(.8,.85,1.)*exp(-r*30.)*(1.+beat);
}

// The tunnel mouth is locked to the centre of the orb so the near rings stay concentric with the
// bezel; only the far end sways, which reads as the tunnel gently bending.
vec3 neonTunnel(vec2 p){
 float r0=length(p);
 vec2 sway=vec2(sin(time*.31),cos(time*.23))*.035*(1.+bass*.5);
 vec2 c=p-sway*pow(clamp(1.-r0/.42,0.,1.),2.);
 float rr=max(length(c),1e-3), z=.24/rr;
 float v=z*1.5+phase*2.6;
 float u=atan(c.y,c.x)/TAU*12.+time*.04+z*.035;
 float fade=exp(-z*.09), ring=floor(v);
 vec3 ca=palette(.72+ring*.11+time*.02)*vec3(.8,.7,1.)+vec3(.1,0.,.15);
 vec3 col=vec3(.015,0.,.04)+ca*.05*fade;
 float panel=step(.78,hash(vec2(floor(u),ring*3.+floor(time*1.5))));
 col+=ca*panel*smoothstep(.5,.2,abs(fract(v)-.5))*(.12+treble*.5)*fade;
 col+=ca*(aaLines(v,1.4)*(.75+mid*.9+beat*.8)+glow(fract(v)-.5,.03)*.12)*fade;
 col+=vec3(.55,.35,1.)*aaLines(u,1.2)*fade*.3*smoothstep(.02,.12,rr);
 col+=vec3(.5,.3,1.)*exp(-rr*7.)*(.25+bass*.6);
 return col+vec3(1.,.92,1.)*exp(-rr*22.)*(.7+bass+beat);
}

vec3 auroraSky(vec2 p,float t){
 float y=p.y-HOR;
 vec3 col=mix(vec3(.02,.07,.1),vec3(.004,.012,.03),smoothstep(0.,.45,y));
 col+=vec3(.8,.9,1.)*stars(gl_FragCoord.xy,40.)*(.35+treble*.8)*smoothstep(0.,.05,y);
 for(int i=0;i<3;i++){ float f=float(i), x=p.x*(1.4+f*.5)+f*3.1;
  float base=HOR+.07+f*.07+(fbm(vec2(x*1.2+t*.15,f))-.5)*.2+sin(x*2.+t*.4)*(.03+bass*.06);
  float dy=p.y-base;
  float curtain=exp(-max(dy,0.)*(4.-mid*1.6))*smoothstep(-.03,.02,dy);
  float strands=.5+.5*sin(x*38.+fbm(vec2(x*3.,t*.3))*8.);
  col+=mix(vec3(.2,1.,.55),vec3(.5,.3,1.),clamp(f*.35+dy*1.4,0.,1.))*curtain*(.35+.65*strands)*(.55+mid*.8+beat*.3)*(1.-f*.2);
 }
 return col+vec3(.1,.5,.35)*haze(p,25.)*.25;
}

vec3 auroraSea(vec2 p,float t){
 float z=floorZ(p.y); vec2 w=vec2(p.x*z,z+phase*1.1);
 float near=smoothstep(14.,3.,z);
 float rip=(noise(w*vec2(1.5,3.))-.5)*.03*near;
 vec3 sea=vec3(.004,.016,.03)+auroraSky(vec2(p.x+rip,2.*HOR-p.y+rip*.4),t)*.55;
 sea+=vec3(.3,1.,.7)*aaLines(w.y*1.2+noise(w*.7)*1.5,1.5)*near*(.06+mid*.12);
 sea=mix(sea,vec3(.05,.2,.18),haze(p,40.)*.6);
 return mix(auroraSky(p,t),sea,smoothstep(.002,-.002,p.y-HOR));
}

vec3 scene(vec2 p){
 float r=length(p), a=atan(p.y,p.x);
 float t=phase*.35;
 if(mode<.5) return skyCruise(p,t);
 if(mode<1.5) return city(p,t,vec3(.4,.08,.34),vec3(.04,.01,.1),vec3(1.,.2,.75),vec3(.25,.9,1.),.1,.15);
 if(mode<2.5) return city(p,t,vec3(.1,.18,.3),vec3(.01,.02,.06),vec3(.2,.75,1.),vec3(1.,.3,.6),.2,.7)+rainStreaks(p)*(.35+treble*.8);
 if(mode<3.5) return snowDrift(p,t);
 if(mode<4.5) return sunnyCoast(p,t);
 if(mode<5.5) return desertRun(p,t);
 if(mode<6.5) return pulseGrid(p,t);
 if(mode<7.5) return hyperspace(p,r,a);
 if(mode<8.5) return neonTunnel(p);
 return auroraSea(p,t);
}

// CRT pass: the scene is sampled through a convex (barrel) lens, then gets scanlines,
// an aperture-grille phosphor mask, halation, edge colour fringing and a slow rolling bar.
void main(){
 vec2 p=(gl_FragCoord.xy-.5*resolution)/min(resolution.x,resolution.y);
 float r2=dot(p,p);
 vec2 q=p*(1.+.34*r2+.12*r2*r2)*(.93-beat*.012);
 vec3 col=scene(q);
 float fringe=smoothstep(.06,.24,r2);
 if(fringe>0.) col.r=mix(col.r,scene(q*1.022).r,fringe);
 float lum=dot(col,vec3(.299,.587,.114));
 float lines=.5+.5*cos(q.y*TAU*92.);
 col*=mix(.68+.32*lines,1.,clamp(lum*.6,0.,.6));
 float stripe=mod(gl_FragCoord.x,3.);
 col*=mix(vec3(1.),stripe<1.?vec3(1.08,.9,.9):stripe<2.?vec3(.9,1.08,.9):vec3(.9,.9,1.08),.55);
 col+=col*col*(.35+beat*.3);
 col*=1.+.045*smoothstep(.12,0.,abs(fract(q.y*.35-time*.09)-.5));
 col*=(1.-smoothstep(.22,.62,length(q))*.6)*(.94+level*.3+beat*.1)*(.985+.015*sin(time*57.));
 col+=(hash(gl_FragCoord.xy+time)-.5)/200.;
 outColor=vec4(clamp(pow(max(col,0.),vec3(.9)),0.,1.),1.);
}`;

function compile(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('Shader allocation failed');
  gl.shaderSource(shader, source); gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) || 'Shader compile failed';
    gl.deleteShader(shader); throw new Error(message);
  }
  return shader;
}

// frozen renders a single still frame (re-drawn only on resize or preset change), for reduced motion.
export function ShaderVisual({ preset, levels, active, frozen = false }: { preset: ShaderPresetIndex; levels: AudioLevels; active: boolean; frozen?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const valuesRef = useRef({ preset, levels, active, frozen });
  useEffect(() => { valuesRef.current = { preset, levels, active, frozen }; }, [preset, levels, active, frozen]);
  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas?.getContext('webgl2', { alpha: false, powerPreference: 'high-performance' });
    if (!canvas || !gl) { if (canvas) canvas.dataset.failed = 'true'; return; }
    let program: WebGLProgram | null = null;
    let buffer: WebGLBuffer | null = null;
    try {
      program = gl.createProgram(); if (!program) throw new Error('Program allocation failed');
      const vs = compile(gl, gl.VERTEX_SHADER, vertex), fs = compile(gl, gl.FRAGMENT_SHADER, fragment);
      gl.attachShader(program, vs); gl.attachShader(program, fs); gl.linkProgram(program);
      gl.deleteShader(vs); gl.deleteShader(fs);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || 'Shader link failed');
      buffer = gl.createBuffer(); if (!buffer) throw new Error('Buffer allocation failed');
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,3,-1,-1,3]), gl.STATIC_DRAW);
    } catch (error) { console.error('Nitrowave shader:', error); canvas.dataset.failed = 'true'; if (program) gl.deleteProgram(program); return; }
    const pos = gl.getAttribLocation(program, 'position');
    const uniform = (name: string) => gl.getUniformLocation(program, name);
    const uniforms = {
      resolution: uniform('resolution'), time: uniform('time'), phase: uniform('phase'), mode: uniform('mode'),
      bass: uniform('bass'), mid: uniform('mid'), treble: uniform('treble'), level: uniform('level'), beat: uniform('beat'),
    };
    // Smoothed bands, a slow bass average for kick detection, and the music-driven clock.
    const smooth = { bass: 0, mid: 0, treble: 0, level: 0 };
    let bassAverage = 0, beat = 0, sinceBeat = 1, phase = 0;
    let frame = 0, still = '';
    const start = performance.now();
    let last = start;
    const render = (now: number) => {
      frame = requestAnimationFrame(render);
      const dt = Math.min(0.1, (now - last) / 1000); last = now;
      const { preset: selected, levels: audio, active: visible, frozen: paused } = valuesRef.current;
      for (const key of ['bass', 'mid', 'treble', 'level'] as const) {
        const target = audio[key];
        const rate = target > smooth[key] ? 18 : 5;
        smooth[key] += (target - smooth[key]) * (1 - Math.exp(-rate * dt));
      }
      bassAverage += (audio.bass - bassAverage) * (1 - Math.exp(-1.5 * dt));
      sinceBeat += dt;
      if (audio.bass > bassAverage * 1.3 + 0.06 && sinceBeat > 0.22) { beat = 1; sinceBeat = 0; }
      beat *= Math.exp(-5.5 * dt);
      phase += dt * (0.55 + smooth.level * 1.6 + beat * 0.8);
      if (!visible || document.hidden) return;
      const ratio = Math.min(devicePixelRatio || 1, 1.5);
      const width = Math.max(1, Math.floor(canvas.clientWidth * ratio));
      const height = Math.max(1, Math.floor(canvas.clientHeight * ratio));
      if (paused && still === `${width}x${height}:${selected}`) return;
      still = paused ? `${width}x${height}:${selected}` : '';
      if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; gl.viewport(0,0,width,height); }
      gl.useProgram(program); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.enableVertexAttribArray(pos); gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
      gl.uniform2f(uniforms.resolution, width, height);
      gl.uniform1f(uniforms.time, paused ? 6 : (now - start) / 1000);
      gl.uniform1f(uniforms.phase, paused ? 3.5 : phase);
      gl.uniform1f(uniforms.mode, selected);
      gl.uniform1f(uniforms.bass, smooth.bass);
      gl.uniform1f(uniforms.mid, smooth.mid);
      gl.uniform1f(uniforms.treble, smooth.treble);
      gl.uniform1f(uniforms.level, smooth.level);
      gl.uniform1f(uniforms.beat, beat);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    frame = requestAnimationFrame(render);
    return () => { cancelAnimationFrame(frame); gl.deleteBuffer(buffer); gl.deleteProgram(program); };
  }, []);
  return <canvas ref={canvasRef} className="shader-canvas" data-preset={preset} aria-label="Animated audio reactive shader" />;
}
