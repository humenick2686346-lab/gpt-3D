import * as T from 'three';
import {Batch,toon} from './materials.ts';
import {random} from './layout.ts';

export const shanghaiPosition={x:36,y:0,z:0};
export const shanghaiExtent={radiusX:13.55,radiusZ:11.7,height:12.1,baseDepth:5.65};
const radiusX=13.1,radiusZ=11.25,ground=.58;
const shore=(a:number)=>1+.018*Math.sin(a*5+.3)+.014*Math.cos(a*9);

/** A self-contained, model-free Pudong miniature, with an open western bridge landing. */
export function createShanghaiIsland(){
 const group=new T.Group();group.name='Shanghai Pudong · Oriental Pearl floating city';group.position.set(shanghaiPosition.x,shanghaiPosition.y,shanghaiPosition.z);
 const batch=new Batch(),rng=random(202611),animated=new T.Group();animated.name='Shanghai · moving boulevard traffic';
 const concrete=toon('#d4cbb9'),paving=toon('#d9d0b8'),edgeStone=toon('#b6c4bb'),road=toon('#51636b'),roadLine=toon('#d7ccb0');
 const lawn=toon('#85a675'),leaves=toon('#557e65'),trunk=toon('#806756'),metal=toon('#c6d9d8'),pearl=toon('#b83f73'),pearlTrim=toon('#ed8eb0');
 const glass=new T.MeshStandardMaterial({color:'#739eae',metalness:.38,roughness:.32});
 const darkGlass=new T.MeshStandardMaterial({color:'#3e7184',metalness:.43,roughness:.29});
 const pearlGlass=new T.MeshStandardMaterial({color:'#b34479',metalness:.42,roughness:.26,emissive:'#e548a4',emissiveIntensity:0});
 const warmWindows=new T.MeshStandardMaterial({color:'#c4c5a9',roughness:.45,emissive:'#ffce8a',emissiveIntensity:0});
 const coolWindows=new T.MeshStandardMaterial({color:'#b0d3dc',roughness:.4,emissive:'#79e8ef',emissiveIntensity:0});
 const gold=new T.MeshStandardMaterial({color:'#d9ba82',metalness:.33,roughness:.43,emissive:'#ffb96a',emissiveIntensity:0});
 const lights=new T.MeshStandardMaterial({color:'#ffdfab',roughness:.45,emissive:'#ffbd73',emissiveIntensity:.15});
 const magenta=new T.MeshStandardMaterial({color:'#e59abb',roughness:.4,emissive:'#ff69b0',emissiveIntensity:0});
 const silver=toon('#95b5bd'),roof=toon('#7e989e');
 const add=(g:T.BufferGeometry,m:T.Material,p=[0,0,0],s=[1,1,1],r=[0,0,0])=>{batch.add(g,m,p,s,r);g.dispose();};
 const cylinder=(m:T.Material,x:number,y:number,z:number,top:number,bottom:number,h:number,seg=24)=>add(new T.CylinderGeometry(top,bottom,h,seg),m,[x,y,z]);
 const ring=(m:T.Material,x:number,y:number,z:number,r:number,t:number)=>add(new T.TorusGeometry(r,t,6,40),m,[x,y,z],[1,1,1],[Math.PI/2,0,0]);

 // Alternating ledges, inset mineral seams and broad broken stones give this
 // island the same geological weight as the garden island across the bridge.
 const layers=[
  {y:.54,r:1,c:'#b2bfa5'},{y:.18,r:1.009,c:'#c4bba7'},{y:-.42,r:1.002,c:'#b3aa9b'},
  {y:-.62,r:.971,c:'#7e8d89'},{y:-1.2,r:.986,c:'#b4b0a5'},{y:-1.58,r:.925,c:'#9ba69f'},
  {y:-1.76,r:.879,c:'#697f83'},{y:-2.38,r:.897,c:'#96a4a1'},{y:-2.8,r:.8,c:'#83989b'},
  {y:-3.03,r:.738,c:'#557580'},{y:-3.5,r:.749,c:'#80999d'},{y:-3.95,r:.612,c:'#658792'},
  {y:-4.1,r:.52,c:'#486d7b'},{y:-4.57,r:.53,c:'#74939c'},{y:-5.12,r:.26,c:'#567d8f'},
  {y:-5.5,r:.04,c:'#426c81'},{y:-5.6,r:0,c:'#426c81'}
 ];
 const rp:number[]=[],rc:number[]=[],ri:number[]=[],segments=128;
 for(let j=0;j<layers.length;j++)for(let i=0;i<=segments;i++){
  const a=i/segments*Math.PI*2,l=layers[j],fault=.014*Math.max(0,Math.sin(a*13+j*.06))**10;
  const r=l.r-fault*(j>0?1:0),wobble=j===0||j===layers.length-1?0:.047*Math.sin(a*7+j*.1)+.025*Math.sin(a*21);
  rp.push(Math.cos(a)*radiusX*shore(a)*r,l.y+wobble,Math.sin(a)*radiusZ*shore(a)*r);
  new T.Color(l.c).multiplyScalar(.95+.06*Math.sin(a*19+j*.5)-fault*5).toArray(rc,rc.length);
  if(j<layers.length-1&&i<segments){const k=j*(segments+1)+i;ri.push(k,k+1,k+segments+1,k+1,k+segments+2,k+segments+1);}
 }
 const rg=new T.BufferGeometry();rg.setAttribute('position',new T.Float32BufferAttribute(rp,3));rg.setAttribute('color',new T.Float32BufferAttribute(rc,3));rg.setIndex(ri);rg.computeVertexNormals();
 const rockMat=toon('#ffffff',true),rock=new T.Mesh(rg,rockMat);rock.name='Shanghai · deep layered stone island';rock.castShadow=true;rock.receiveShadow=true;group.add(rock);
 const boulder=new T.DodecahedronGeometry(1,0),stoneRock=toon('#9eaca7');
 for(let row=0;row<4;row++)for(let i=0;i<18-row*3;i++){
  const a=(i+.23*row)/(18-row*3)*Math.PI*2,f=[.987,.91,.77,.53][row];
  batch.add(boulder,stoneRock,[Math.cos(a)*radiusX*shore(a)*f,[-.98,-2.18,-3.3,-4.5][row],Math.sin(a)*radiusZ*shore(a)*f],[.7+rng()*.8,.2+rng()*.28,.35+rng()*.3],[0,Math.PI/2-a,.08]);
 }boulder.dispose();
 // A planar oval keeps streets and plaza floors exactly connected to the landing.
 const outline=new T.Shape();for(let i=0;i<=128;i++){const a=i/128*Math.PI*2,x=Math.cos(a)*radiusX*shore(a),z=Math.sin(a)*radiusZ*shore(a);if(i===0)outline.moveTo(x,-z);else outline.lineTo(x,-z);}
 const top=new T.ShapeGeometry(outline,1);top.rotateX(-Math.PI/2);add(top,lawn,[0,.55,0]);
 const plaza=new T.Shape();for(let i=0;i<=96;i++){const a=i/96*Math.PI*2,x=Math.cos(a)*radiusX*.92,z=Math.sin(a)*radiusZ*.92;if(i===0)plaza.moveTo(x,-z);else plaza.lineTo(x,-z);}const pg=new T.ShapeGeometry(plaza);pg.rotateX(-Math.PI/2);add(pg,paving,[0,ground,0]);
 // Western access apron ends flush with the bamboo bridge's broad landing.
 batch.box(paving,[-10.25,.605,5],[3,.05,1.7]);
 for(let x=-11.55;x<-6.2;x+=.33)batch.box(edgeStone,[x,.64,5],[.28,.045,1.25]);

 // A crescent of Huangpu water curves around the front of the city. The curved
 // quay leaves the connecting path and both bank promenades physically dry.
 const riverPoints:number[]=[],riverUV:number[]=[],riverIndex:number[]=[],riverSegments=96;
 function riverPoint(t:number,bank:number){const a=.12+t*(Math.PI-.24),r=bank===0?.69:.86;return new T.Vector3(Math.cos(a)*radiusX*r,.615,Math.sin(a)*radiusZ*r+.35);}
 for(let i=0;i<=riverSegments;i++)for(let bank=0;bank<2;bank++){const p=riverPoint(i/riverSegments,bank);p.toArray(riverPoints,riverPoints.length);riverUV.push(i/riverSegments,bank);if(i<riverSegments&&bank===0){const k=i*2;riverIndex.push(k,k+1,k+2,k+1,k+3,k+2);}}
 const riverGeometry=new T.BufferGeometry();riverGeometry.setAttribute('position',new T.Float32BufferAttribute(riverPoints,3));riverGeometry.setAttribute('uv',new T.Float32BufferAttribute(riverUV,2));riverGeometry.setIndex(riverIndex);riverGeometry.computeVertexNormals();
 const waterUniforms={time:{value:0},night:{value:0}};
 const riverMaterial=new T.ShaderMaterial({uniforms:waterUniforms,side:T.DoubleSide,vertexShader:`varying vec2 vUv;varying vec3 vWorld;void main(){vUv=uv;vec4 p=modelMatrix*vec4(position,1.);vWorld=p.xyz;gl_Position=projectionMatrix*viewMatrix*p;}`,fragmentShader:`uniform float time,night;varying vec2 vUv;varying vec3 vWorld;void main(){float ripple=sin(vWorld.x*8.+vWorld.z*5.-time*2.3)*.5+.5;float current=sin(vUv.x*110.-time*3.+sin(vUv.y*15.))*sin(vUv.y*29.+time*.8);float seam=pow(1.-abs(vUv.y-.5)*2.,.3);vec3 col=mix(vec3(.19,.48,.49),vec3(.33,.65,.65),ripple*.13+seam*.5);col+=vec3(.12,.18,.15)*pow(max(0.,current),12.);col=mix(col,col*.32+vec3(.03,.1,.15),night*.83);float shimmer=pow(max(0.,sin(vUv.x*61.+sin(vUv.y*28.-time*1.4))),18.);col+=night*shimmer*vec3(.16,.12,.16)*(1.-vUv.y)*.7;gl_FragColor=vec4(col,1.);#include <tonemapping_fragment>\n#include <colorspace_fragment>}`.replace(';#include',';\n#include')});
 const river=new T.Mesh(riverGeometry,riverMaterial);river.name='Shanghai · flowing Huangpu crescent';group.add(river);
 for(let bank=0;bank<2;bank++)for(let i=0;i<riverSegments;i++){
  const a=riverPoint(i/riverSegments,bank),b=riverPoint((i+1)/riverSegments,bank);a.y=b.y=.7;batch.beam(edgeStone,a.toArray(),b.toArray(),.12);
  if(i%3===0){const p=riverPoint((i+.5)/riverSegments,bank);p.y=.98;batch.beam(silver,[p.x,.72,p.z],p.toArray(),.025);}
  if(bank===0){a.y=b.y=1.05;batch.beam(silver,a.toArray(),b.toArray(),.022);}
 }

 // City blocks frame the landmark plaza. Real window strips are batched by
 // colour, so hundreds of lit floors remain only two material draw calls.
 let buildings=0;
 function block(x:number,z:number,w:number,d:number,h:number,variant=0){
  buildings++;const y=ground+h/2,m=variant%3===0?darkGlass:glass;
  batch.box(concrete,[x,ground+.13,z],[w+.2,.26,d+.2]);batch.box(m,[x,y+.2,z],[w,h,d]);
  batch.box(roof,[x,ground+h+.23,z],[w+.07,.08,d+.07]);
  batch.box(silver,[x,ground+h+.36,z],[w*.35,.18,d*.32]);
  for(let floor=.6;floor<h-.14;floor+=.36){
   const wy=ground+.2+floor;
   batch.box(silver,[x,wy,z],[w+.025,.025,d+.025]);
   for(let column=0;column<Math.max(2,Math.floor(w/.28));column++){
    const u=(column+.5)/Math.max(2,Math.floor(w/.28))-.5;
    for(const side of [-1,1])if(rng()>.27)batch.box((column+variant)%3?warmWindows:coolWindows,[x+u*w*.88,wy-.13,z+side*(d*.5+.012)],[.12,.16,.02]);
   }
   for(let column=0;column<Math.max(2,Math.floor(d/.3));column++){
    const u=(column+.5)/Math.max(2,Math.floor(d/.3))-.5;
    for(const side of [-1,1])if(rng()>.3)batch.box((column+variant)%3?warmWindows:coolWindows,[x+side*(w*.5+.012),wy-.13,z+u*d*.88],[.02,.16,.13]);
   }
  }
  for(const sx of [-1,1])for(const sz of [-1,1])batch.box(silver,[x+sx*w*.5,y+.2,z+sz*d*.5],[.045,h,.045]);
  if(variant%2===0)batch.box(gold,[x,ground+h+.33,z],[w*.85,.055,d*.85]);
 }
 const blocks=[[-8.8,-2.8,1.45,1.7,3.2],[-7,-6,1.55,1.6,3.6],[-4.5,-7,1.6,1.6,4.2],[-2,-7.2,1.55,1.55,3.4],[.7,-7.5,1.5,1.6,4.6],[3.4,-7.2,1.55,1.6,3.7],[6,-6.1,1.65,1.6,4.5],[8.5,-4.8,1.4,1.65,3.7],[9.4,-1.4,1.45,1.7,3.1],[8.9,1.6,1.4,1.55,2.4],[-8.4,.2,1.45,1.45,2.2],[-7.9,2.65,1.3,1.15,1.4],[6.5,2.3,1.5,1.5,2.7]];
 blocks.forEach((b,i)=>block(...b as [number,number,number,number,number],i));

 // Oriental Pearl: three great concrete legs, a cluster of structural columns,
 // two ruby observation spheres, three small companion spheres and the mast.
 const pearlGroup=new T.Group();pearlGroup.name='Shanghai landmark · Oriental Pearl Tower';group.add(pearlGroup);
 const px=-3.1,pz=1.65;
 cylinder(concrete,px,.74,pz,2.3,2.45,.25,48);cylinder(edgeStone,px,.9,pz,2.1,2.2,.1,48);
 ring(gold,px,.97,pz,1.9,.027);
 for(let i=0;i<3;i++){
  const a=i/3*Math.PI*2+.45,c=Math.cos(a),s=Math.sin(a);
  cylinder(concrete,px+c*1.72,.83,pz+s*1.72,.35,.4,.4,16);
  batch.beam(concrete,[px+c*1.72,.98,pz+s*1.72],[px+c*.42,3.25,pz+s*.42],.18);
  batch.beam(metal,[px+c*.35,2.6,pz+s*.35],[px+c*.35,8.1,pz+s*.35],.115);
  batch.beam(magenta,[px+c*.39,3.8,pz+s*.39],[px+c*.39,7.65,pz+s*.39],.028);
  add(new T.SphereGeometry(.41,20,12),pearlGlass,[px+c*.89,2.1,pz+s*.89],[1,.9,1]);ring(pearlTrim,px+c*.89,2.1,pz+s*.89,.41,.035);
 }
 function pearlSphere(y:number,r:number){
  add(new T.SphereGeometry(r,40,24),pearlGlass,[px,y,pz],[1,.92,1]);
  for(const fraction of [-.59,-.32,0,.32,.59]){const rr=r*Math.sqrt(1-fraction*fraction);ring(fraction===0?pearlTrim:metal,px,y+fraction*r*.92,pz,rr+.012,fraction===0?.055:.018);}
  // Curved meridians make the glistening spheres read as faceted architecture.
  for(let i=0;i<16;i++)for(let k=0;k<10;k++){
   const a=i/16*Math.PI*2,b=-1.25+k/10*2.5,c=-1.25+(k+1)/10*2.5;
   const at=(v:number)=>[px+Math.cos(a)*Math.cos(v)*(r+.015),y+Math.sin(v)*r*.92,pz+Math.sin(a)*Math.cos(v)*(r+.015)];
   batch.beam(i%4===0?pearlTrim:metal,at(b),at(c),i%4===0?.021:.012);
  }
  ring(magenta,px,y-r*.14,pz,r*1.006,.023);
 }
 pearlSphere(3.7,1.28);pearlSphere(8.12,.94);
 cylinder(metal,px,6.02,pz,.23,.26,3.4,20);cylinder(metal,px,9.38,pz,.105,.17,1.55,16);
 add(new T.SphereGeometry(.31,20,14),pearlGlass,[px,10.15,pz],[1,.88,1]);ring(pearlTrim,px,10.15,pz,.31,.025);
 cylinder(metal,px,10.92,pz,.029,.075,1.25,12);cylinder(pearlTrim,px,11.64,pz,.015,.025,.28,8);
 add(new T.SphereGeometry(.04,8,6),lights,[px,11.8,pz]);
 // A low museum entrance and the circular landscaped visitor plaza.
 cylinder(darkGlass,px,1.12,pz,.92,1.08,.4,32);cylinder(concrete,px,1.34,pz,1.05,1.05,.055,32);
 for(let i=0;i<24;i++){const a=i/24*Math.PI*2;batch.box(gold,[px+Math.cos(a)*2.15,.92,pz+Math.sin(a)*2.15],[.1,.015,.2],[0,-a,0]);}

 // Shanghai Tower's elliptical glass skin twists by 105 degrees as it tapers.
 const tx=3.45,tz=-2.75,th=10.8,twistRows=46,twistSegments=36,tp:number[]=[],ti:number[]=[],tu:number[]=[];
 function towerPoint(t:number,a:number){const r=.99*(1-.31*t),angle=a+t*1.83;return new T.Vector3(tx+Math.cos(angle)*r,ground+.25+t*th,tz+Math.sin(angle)*r*.82);}
 for(let j=0;j<=twistRows;j++)for(let i=0;i<=twistSegments;i++){
  const p=towerPoint(j/twistRows,i/twistSegments*Math.PI*2);p.toArray(tp,tp.length);tu.push(i/twistSegments,j/twistRows);
  if(j<twistRows&&i<twistSegments){const k=j*(twistSegments+1)+i;ti.push(k,k+1,k+twistSegments+1,k+1,k+twistSegments+2,k+twistSegments+1);}
 }
 const tg=new T.BufferGeometry();tg.setAttribute('position',new T.Float32BufferAttribute(tp,3));tg.setAttribute('uv',new T.Float32BufferAttribute(tu,2));tg.setIndex(ti);tg.computeVertexNormals();
 const tower=new T.Mesh(tg,glass);tower.name='Shanghai landmark · twisting Shanghai Tower';tower.castShadow=true;tower.receiveShadow=true;group.add(tower);buildings++;
 cylinder(concrete,tx,.76,tz,1.3,1.35,.35,40);
 for(let j=1;j<=twistRows;j++)for(let i=0;i<twistSegments;i++){
  const a=towerPoint(j/twistRows,i/twistSegments*Math.PI*2),b=towerPoint(j/twistRows,(i+1)/twistSegments*Math.PI*2);
  batch.beam(j%5===0?coolWindows:silver,a.toArray(),b.toArray(),j%5===0?.021:.012);
 }
 for(let i=0;i<8;i++)for(let j=0;j<twistRows;j++){const a=towerPoint(j/twistRows,i/8*Math.PI*2),b=towerPoint((j+1)/twistRows,i/8*Math.PI*2);batch.beam(i%2?metal:coolWindows,a.toArray(),b.toArray(),.022);}
 cylinder(roof,tx,ground+.25+th,tz,.68,.68,.06,32);cylinder(coolWindows,tx,ground+.3+th,tz,.59,.59,.09,32);

 // World Financial Center has an actual open trapezoidal sky aperture. Four
 // solid pieces frame it; no texture or painted black rectangle stands in for it.
 const fx=6.25,fz=-2.65,fh=8.65,fw=1.55,fd=.83;
 block(fx,fz,fw,fd,fh-1.35,2);buildings--; // the aperture and crown belong to this one building
 const frameBottom=ground+.2+fh-1.35,frameTop=ground+.2+fh;
 for(const side of [-1,1]){
  batch.beam(darkGlass,[fx+side*.63,frameBottom,fz],[fx+side*.48,frameTop,fz],.21);
  batch.box(glass,[fx+side*.69,frameBottom+.39,fz],[.22,.78,fd]);
  batch.beam(silver,[fx+side*.77,frameBottom-.12,fz+fd*.5+.02],[fx+side*.53,frameTop+.12,fz+fd*.5+.02],.04);
 }
 batch.box(glass,[fx,frameTop,fz],[1.21,.22,fd]);batch.box(coolWindows,[fx,frameTop+.12,fz],[1.24,.04,fd+.03]);buildings++;
 const swfcMarker=new T.Object3D();swfcMarker.name='Shanghai landmark · World Financial Center sky aperture';swfcMarker.position.set(fx,frameTop-.55,fz);group.add(swfcMarker);

 // Jin Mao's pagoda-like stack is deliberately separated from the blue towers.
 const jx=.43,jz=-3.45;let jy=ground+.2;buildings++;
 for(let i=0;i<9;i++){
  const w=1.5-i*.112,h=i<4?.7:.51;
  batch.box(glass,[jx,jy+h/2,jz],[w,h,w]);batch.box(metal,[jx,jy+h,jz],[w+.12,.075,w+.12]);
  for(let k=0;k<3;k++)for(const side of [-1,1]){
   batch.box(warmWindows,[jx+side*(w/2+.015),jy+.15+k*.16,jz],[.022,.04,w*.86]);
   batch.box(warmWindows,[jx,jy+.15+k*.16,jz+side*(w/2+.015)],[w*.86,.04,.022]);
  }jy+=h;
 }
 add(new T.CylinderGeometry(.03,.46,.82,8),metal,[jx,jy+.42,jz]);batch.beam(metal,[jx,jy+.75,jz],[jx,jy+1.35,jz],.023);
 const jinmaoMarker=new T.Object3D();jinmaoMarker.name='Shanghai landmark · stepped Jin Mao Tower';jinmaoMarker.position.set(jx,jy,jz);group.add(jinmaoMarker);

 // A curving boulevard, crosswalks, street trees and lit shopfronts make the
 // architecture part of a lived-in city instead of an isolated skyline display.
 const avenueZ=-.7;
 batch.box(road,[.8,.62,avenueZ],[18.4,.06,1.2]);batch.box(road,[-6.1,.622,-3.3],[1.05,.055,9.2]);batch.box(road,[7.65,.622,-3.2],[.9,.055,8.1]);
 for(let x=-8.1;x<9.5;x+=.68)batch.box(roadLine,[x,.656,avenueZ],[.35,.012,.037]);
 for(const cx of [-6.1,7.65])for(let i=0;i<5;i++)batch.box(roadLine,[cx-.38+i*.18,.66,.15],[.085,.015,.48]);
 for(let z=-7.4;z<.3;z+=.62)batch.box(roadLine,[-6.1,.658,z],[.036,.012,.3]);
 for(let i=0;i<6;i++){
  const x=-1.1+i*1.08,z=2.8;
  batch.box(concrete,[x,.92,z],[.85,.6,.8]);batch.box(darkGlass,[x,.91,z+.411],[.69,.35,.018]);batch.box(i%2?pearlTrim:gold,[x,1.25,z+.48],[.94,.09,.28]);
  batch.box(lights,[x,1.15,z+.424],[.64,.075,.02]);batch.box(roof,[x,1.28,z],[.92,.06,.9]);buildings++;
 }
 function tree(x:number,z:number,size=1){
  cylinder(concrete,x,.68,z,.28,.31,.13,12);batch.beam(trunk,[x,.73,z],[x,1.35*size+.12,z],.045*size);
  add(new T.IcosahedronGeometry(.4,1),leaves,[x,1.55*size,z],[size,1.12*size,size]);
 }
 function lamp(x:number,z:number,h=1.12){batch.beam(silver,[x,.67,z],[x,.67+h,z],.025);batch.beam(silver,[x,.67+h,z],[x+.19,.67+h,z],.021);batch.box(lights,[x+.15,.65+h,z],[.2,.06,.12]);}
 for(let i=0;i<42;i++){
  const a=i/42*Math.PI*2,x=Math.cos(a)*radiusX*.95,z=Math.sin(a)*radiusZ*.95;
  // Keep the west-front bridge arrival and paved approach unobstructed.
  if(x<-9&&z>3&&z<6.7)continue;
  tree(x,z,.65+rng()*.25);if(i%2===0)lamp(x*.97,z*.97,.9);
 }
 for(let x=-8;x<9;x+=1.6){if(Math.abs(x+6.1)>.8&&Math.abs(x-7.65)>.7){tree(x,.25,.65);lamp(x,-1.45,.95);}}
 for(let i=0;i<16;i++){
  const t=(i+.5)/16,p=riverPoint(t,1);const outward=new T.Vector2(p.x,p.z).normalize();const x=p.x+outward.x*.46,z=p.z+outward.y*.46;
  if(i%2===0)tree(x,z,.6);else lamp(x,z,.85);
  const inner=riverPoint(t,0);batch.box(gold,[inner.x*.96,.73,inner.z*.96],[.42,.09,.15],[0,Math.atan2(inner.x,inner.z),0]);
 }
 // Riverside pavilion and miniature excursion boat.
 cylinder(concrete,2.8,.72,5.5,.85,.9,.2,24);for(let i=0;i<6;i++){const a=i/6*Math.PI*2;batch.beam(metal,[2.8+Math.cos(a)*.65,.8,5.5+Math.sin(a)*.65],[2.8+Math.cos(a)*.65,1.65,5.5+Math.sin(a)*.65],.035);}
 add(new T.ConeGeometry(.94,.35,6),gold,[2.8,1.82,5.5]);
 const boat=new T.Group();boat.name='Shanghai · river excursion boat';const boatBatch=new Batch();boatBatch.box(concrete,[0,.11,0],[1.05,.18,.35]);boatBatch.box(metal,[0,.28,0],[.72,.18,.3]);boatBatch.box(darkGlass,[0,.28,.157],[.58,.1,.015]);boatBatch.box(lights,[0,.39,0],[.79,.035,.34]);boat.add(boatBatch.flush('Riverboat'));boat.position.set(1,.65,8.8);group.add(boat);
 // Lightweight traffic animation reuses a few tiny meshes, with light intensity
 // controlled by the same day-night signal as the skyline windows.
 const carMaterials=[pearlTrim,gold,metal];const cars:T.Group[]=[];
 for(let i=0;i<6;i++){
  const car=new T.Group(),cb=new Batch();cb.box(carMaterials[i%3],[0,0,0],[.42,.13,.22]);cb.box(darkGlass,[-.025,.1,0],[.21,.1,.19]);cb.box(lights,[.22,.005,0],[.018,.045,.18]);car.add(cb.flush('Boulevard car',false));animated.add(car);cars.push(car);
 }
 group.add(batch.flush('Shanghai · towers, illuminated streets, parks and riverfront'),animated);
 const counts={shanghaiIslands:1,orientalPearl:1,shanghaiBuildings:buildings+1,shanghaiLandmarks:4};
 function setNight(n:number){const night=T.MathUtils.clamp(n,0,1);warmWindows.emissiveIntensity=night*1.75;coolWindows.emissiveIntensity=night*1.65;lights.emissiveIntensity=.1+night*2.1;gold.emissiveIntensity=night*.65;magenta.emissiveIntensity=night*1.7;pearlGlass.emissiveIntensity=night*.3;waterUniforms.night.value=night;}
 function update(elapsed:number){waterUniforms.time.value=elapsed;cars.forEach((car,i)=>{const lane=i%2===0?1:-1;car.position.set(((elapsed*.42+i*3.07)%17.2)-8,.82,avenueZ+lane*.29);car.rotation.y=lane===1?0:Math.PI;if(lane<0)car.position.x=-car.position.x+.5;});boat.position.x=Math.sin(elapsed*.045)*3;boat.rotation.y=Math.cos(elapsed*.045)>.0?0:Math.PI;}
 setNight(0);update(0);
 return {group,setNight,update,counts};
}
