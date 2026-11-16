import * as T from 'three';
import {Batch,toon} from './materials.ts';
import {random} from './layout.ts';

export const francePosition={x:-18,y:0,z:-33};
export const franceExtent={radiusX:13,radiusZ:11,height:11.8,baseDepth:5.7};
const rx=12.4,rz=10.4,ground=.6;
const shore=(a:number)=>1+.018*Math.sin(a*5+.3)+.018*Math.cos(a*9);

/** Paris seen as an original miniature, with two open bridge arrival plazas. */
export function createFranceIsland(){
 const group=new T.Group();group.name='France · Paris gardens and floating city';group.position.set(francePosition.x,francePosition.y,francePosition.z);
 const batch=new Batch(),rng=random(611194);
 const limestone=toon('#e5d5b9'),stone=toon('#c5b69c'),paving=toon('#ded3be'),gravel=toon('#c8b69a'),slate=toon('#4e6370');
 const lawn=toon('#83a86c'),hedge=toon('#4e805c'),leaves=toon('#659465'),trunk=toon('#806550'),red=toon('#b85c60'),blue=toon('#426e91'),cream=toon('#faf0d8');
 const iron=new T.MeshStandardMaterial({color:'#80664b',roughness:.65,metalness:.45,emissive:'#e7a954',emissiveIntensity:0});
 const glass=new T.MeshStandardMaterial({color:'#66818a',roughness:.42,metalness:.2,emissive:'#ffd399',emissiveIntensity:0});
 const lights=new T.MeshStandardMaterial({color:'#ffe0a8',roughness:.5,emissive:'#ffbc66',emissiveIntensity:.1});
 const gold=new T.MeshStandardMaterial({color:'#c8a166',roughness:.55,metalness:.35,emissive:'#ffbf66',emissiveIntensity:0});
 const add=(g:T.BufferGeometry,m:T.Material,p=[0,0,0],s=[1,1,1],r=[0,0,0],b=batch)=>{b.add(g,m,p,s,r);g.dispose();};
 const cyl=(m:T.Material,p:number[],top:number,bottom:number,h:number,seg=16,b=batch)=>add(new T.CylinderGeometry(top,bottom,h,seg),m,p,[1,1,1],[0,0,0],b);
 const ring=(m:T.Material,p:number[],radius:number,tube:number,b=batch)=>add(new T.TorusGeometry(radius,tube,6,48),m,p,[1,1,1],[Math.PI/2,0,0],b);

 const layers=[{y:.55,r:1,c:'#c4c5aa'},{y:.18,r:1.005,c:'#cec3ad'},{y:-.3,r:.99,c:'#b7aa94'},{y:-.52,r:.95,c:'#8e9187'},{y:-1.12,r:.97,c:'#bdb49f'},{y:-1.6,r:.9,c:'#a6a48f'},{y:-1.8,r:.86,c:'#7e887c'},{y:-2.4,r:.88,c:'#a7ab95'},{y:-2.9,r:.77,c:'#969c89'},{y:-3.1,r:.71,c:'#6e817b'},{y:-3.65,r:.72,c:'#98a193'},{y:-4.08,r:.57,c:'#81958b'},{y:-4.3,r:.5,c:'#657d77'},{y:-4.75,r:.46,c:'#8d9987'},{y:-5.18,r:.24,c:'#70847b'},{y:-5.6,r:0,c:'#596f6a'}];
 const positions:number[]=[],colors:number[]=[],indices:number[]=[],n=112;
 for(let j=0;j<layers.length;j++)for(let i=0;i<=n;i++){
  const a=i/n*Math.PI*2,l=layers[j],fracture=.012*Math.max(0,Math.sin(a*17+j*.08))**8,r=l.r-fracture;
  positions.push(Math.cos(a)*rx*shore(a)*r,l.y+(j===0||j===layers.length-1?0:.045*Math.sin(a*11+j*.4)),Math.sin(a)*rz*shore(a)*r);
  new T.Color(l.c).multiplyScalar(.97+.04*Math.sin(a*23)).toArray(colors,colors.length);
  if(j<layers.length-1&&i<n){const k=j*(n+1)+i;indices.push(k,k+1,k+n+1,k+1,k+n+2,k+n+1);}
 }
 const rockGeo=new T.BufferGeometry();rockGeo.setAttribute('position',new T.Float32BufferAttribute(positions,3));rockGeo.setAttribute('color',new T.Float32BufferAttribute(colors,3));rockGeo.setIndex(indices);rockGeo.computeVertexNormals();
 const rock=new T.Mesh(rockGeo,toon('#ffffff',true));rock.name='France · layered limestone island';rock.castShadow=true;rock.receiveShadow=true;group.add(rock);
 const outline=new T.Shape();for(let i=0;i<=112;i++){const a=i/112*Math.PI*2,x=Math.cos(a)*rx*shore(a),z=Math.sin(a)*rz*shore(a);if(i===0)outline.moveTo(x,-z);else outline.lineTo(x,-z);}const top=new T.ShapeGeometry(outline);top.rotateX(-Math.PI/2);add(top,lawn,[0,.56,0]);
 const plaza=new T.CircleGeometry(1,80);plaza.rotateX(-Math.PI/2);add(plaza,paving,[0,ground,0],[rx*.92,1,rz*.92]);
 // The arrival terraces are deliberately empty and linked to the promenade.
 batch.box(paving,[9.8,.625,0],[4.4,.05,1.75]);batch.box(paving,[5.5,.625,7.65],[1.9,.05,2.5]);
 batch.box(gravel,[5.95,.65,3.8],[1.25,.045,7.8]);batch.box(gravel,[6,.65,0],[11.7,.045,1.1]);

 // Eiffel Tower: four tapered lattice legs, open lower arches, two observation
 // decks, a fine upper shaft, and a real antenna. Its silhouette stays hollow.
 const tb=new Batch(),tx=-3.0,tz=-2.2;
 const levels=[{y:.78,r:2.1},{y:2.05,r:1.7},{y:3.6,r:1.12},{y:5.2,r:.76},{y:6.35,r:.58},{y:7.7,r:.42},{y:9.1,r:.24},{y:10.15,r:.1}];
 const corner=(r:number,y:number,sx:number,sz:number)=>[tx+r*sx,y,tz+r*sz];
 for(const sx of [-1,1])for(const sz of [-1,1]){
  tb.box(limestone,[tx+sx*2.1,.69,tz+sz*2.1],[.84,.2,.84]);
  for(let j=0;j<levels.length-1;j++){
   const a=levels[j],b=levels[j+1];tb.beam(iron,corner(a.r,a.y,sx,sz),corner(b.r,b.y,sx,sz),j<2?.075:.045);
  }
 }
 for(let j=0;j<levels.length-1;j++){
  const a=levels[j],b=levels[j+1],steps=j<2?3:2;
  for(let k=0;k<steps;k++){
   const f=k/steps,g=(k+1)/steps,ya=T.MathUtils.lerp(a.y,b.y,f),yb=T.MathUtils.lerp(a.y,b.y,g),ra=T.MathUtils.lerp(a.r,b.r,f),rb=T.MathUtils.lerp(a.r,b.r,g);
   for(const side of [-1,1]){
    if(j>0||k>1){tb.beam(iron,[tx-ra,ya,tz+side*ra],[tx+ra,ya,tz+side*ra],.022);tb.beam(iron,[tx+side*ra,ya,tz-ra],[tx+side*ra,ya,tz+ra],.022);}
    // Lower side trusses follow each leg; the upper lattice spans the shaft.
    const span=j===0?.38:1;
    for(const sign of [-1,1]){
     const xa=sign*ra,xb=sign*rb;
     tb.beam(iron,[tx+xa,ya,tz+side*ra],[tx+xb-sign*rb*span,yb,tz+side*rb],.018);
     tb.beam(iron,[tx+xa-sign*ra*span,ya,tz+side*ra],[tx+xb,yb,tz+side*rb],.018);
     tb.beam(iron,[tx+side*ra,ya,tz+xa],[tx+side*rb,yb,tz+xb-sign*rb*span],.018);
     tb.beam(iron,[tx+side*ra,ya,tz+xa-sign*ra*span],[tx+side*rb,yb,tz+xb],.018);
    }
   }
  }
 }
 for(const side of [-1,1])for(let k=0;k<24;k++){
  const a=k/24*Math.PI,b=(k+1)/24*Math.PI;
  const pa=[1.75*Math.cos(a),1.0+1.7*Math.sin(a)],pb=[1.75*Math.cos(b),1.0+1.7*Math.sin(b)];
  tb.beam(iron,[tx+pa[0],pa[1],tz+side*1.93],[tx+pb[0],pb[1],tz+side*1.93],.063);
  tb.beam(iron,[tx+side*1.93,pa[1],tz+pa[0]],[tx+side*1.93,pb[1],tz+pb[0]],.063);
 }
 for(const [y,width] of [[3.6,2.6],[6.35,1.55],[9.15,.65]]){
  tb.box(iron,[tx,y,tz],[width,.16,width]);tb.box(gold,[tx,y+.09,tz],[width+.08,.035,width+.08]);
  for(const side of [-1,1]){
   tb.beam(iron,[tx-width/2,y+.36,tz+side*width/2],[tx+width/2,y+.36,tz+side*width/2],.024);
   tb.beam(iron,[tx+side*width/2,y+.36,tz-width/2],[tx+side*width/2,y+.36,tz+width/2],.024);
   for(let i=0;i<7;i++){const v=(i/6-.5)*width;tb.beam(iron,[tx+v,y+.08,tz+side*width/2],[tx+v,y+.36,tz+side*width/2],.016);tb.beam(iron,[tx+side*width/2,y+.08,tz+v],[tx+side*width/2,y+.36,tz+v],.016);}
  }
 }
 cyl(iron,[tx,10.38,tz],.1,.18,.65,12,tb);tb.beam(iron,[tx,10.65,tz],[tx,11.5,tz],.027);tb.ball(lights,[tx,11.52,tz],[.07,.07,.07]);
 const tower=tb.flush('France · Eiffel Tower');group.add(tower);

 // A real arch cut through a limestone monument, rather than a painted doorway.
 const ax=5.1,az=-4.0,archShape=new T.Shape();archShape.moveTo(-1.75,0);archShape.lineTo(-1.75,3.45);archShape.lineTo(1.75,3.45);archShape.lineTo(1.75,0);archShape.lineTo(.68,0);archShape.lineTo(.68,1.8);archShape.absarc(0,1.8,.68,0,Math.PI,false);archShape.lineTo(-.68,0);archShape.closePath();
 const archGeo=new T.ExtrudeGeometry(archShape,{depth:1.3,bevelEnabled:false,curveSegments:18});const arch=new T.Mesh(archGeo,limestone);arch.name='France · Arc de Triomphe';arch.position.set(ax,.73,az-.65);arch.castShadow=true;arch.receiveShadow=true;group.add(arch);
 batch.box(stone,[ax,.67,az],[4.1,.18,1.9]);batch.box(stone,[ax,3.49,az],[3.65,.12,1.48]);batch.box(limestone,[ax,4.26,az],[3.85,.16,1.55]);
 for(const side of [-1,1])for(const face of [-1,1]){
  batch.box(stone,[ax+side*1.18,1.58,az+face*.672],[.56,1.2,.055]);batch.ball(limestone,[ax+side*1.18,1.88,az+face*.72],[.17,.36,.075]);
  for(let i=0;i<3;i++)batch.box(gold,[ax+side*1.18,2.68+i*.15,az+face*.68],[.67,.045,.035]);
 }

 // Cream Haussmann facades, blue-grey mansard roofs, dormers, chimneys and
 // striped cafe awnings make the neighbourhood readable at close range.
 let buildings=0;
 function house(x:number,z:number,w:number,d:number,h:number,variant:number){
  buildings++;batch.box(limestone,[x,.7+h/2,z],[w,h,d]);batch.box(stone,[x,.76,z],[w+.1,.22,d+.1]);
  const roofGeo=new T.CylinderGeometry(.72,1,1,4);roofGeo.rotateY(Math.PI/4);batch.add(roofGeo,slate,[x,.7+h+.36,z],[w/Math.SQRT2,.73,d/Math.SQRT2]);roofGeo.dispose();
  batch.box(slate,[x,.7+h+.73,z],[w*.73,.08,d*.73]);batch.box(stone,[x+w*.25,.7+h+.9,z-d*.2],[.18,.42,.2]);
  for(let floor=.55;floor<h-.1;floor+=.57){
   batch.box(stone,[x,.7+floor+.22,z],[w+.07,.07,d+.07]);
   const cols=Math.max(2,Math.floor(w/.44));for(let col=0;col<cols;col++){
    const cx=x+(col/(cols-1)-.5)*(w-.44);
    for(const side of [-1,1]){
     batch.box(glass,[cx,.7+floor,z+side*(d/2+.008)],[.24,.32,.026]);batch.box(stone,[cx,.7+floor-.18,z+side*(d/2+.04)],[.32,.045,.095]);
     batch.beam(iron,[cx-.16,.7+floor-.03,z+side*(d/2+.11)],[cx+.16,.7+floor-.03,z+side*(d/2+.11)],.015);
    }
   }
  }
  for(const side of [-1,1])for(let col=0;col<2;col++){
   const cx=x+(col-.5)*w*.5;batch.box(stone,[cx,.7+h+.28,z+side*d*.41],[.35,.4,.15]);batch.box(glass,[cx,.7+h+.28,z+side*(d*.41+.08)],[.21,.25,.02]);
  }
  const awning=variant%2?red:blue;
  for(let i=0;i<8;i++)batch.box(i%2?cream:awning,[x+(i-3.5)*w/8,1.14,z+d*.5+.26],[w/8,.07,.52],[.18,0,0]);
  for(const side of [-1,1]){cyl(iron,[x+side*w*.28,.83,z+d*.5+.7],.2,.2,.045,12);batch.beam(iron,[x+side*w*.28,.65,z+d*.5+.7],[x+side*w*.28,.81,z+d*.5+.7],.028);}
 }
 const blocks=[[-8.9,-3.8,1.65,1.5,2.45],[-7.3,-6.6,1.85,1.45,2.65],[-4.4,-7.4,1.8,1.5,2.8],[-1.6,-7.6,1.8,1.45,2.4],[1.1,-7.3,1.9,1.45,2.65],[4,-7.2,1.6,1.35,2.35],[8,-4.1,1.6,1.45,2.6],[9.25,-1.55,1.55,1.35,2.2],[-9.1,-.2,1.5,1.35,2.1],[-8.1,3.2,1.5,1.3,1.9]];
 blocks.forEach((a,i)=>house(...a as [number,number,number,number,number],i));
 // French tricolour flags, each made of three pieces of fabric.
 for(const [x,z] of [[ax,az],[-7.3,-6.6]]){
  batch.beam(iron,[x,4.35,z],[x,5.23,z],.018);for(let i=0;i<3;i++)batch.box([blue,cream,red][i],[x+.12+i*.19,5.03,z],[.19,.28,.018]);
 }

 // Formal parterre gardens flank a broad axial walk and lively fountain.
 batch.box(gravel,[-3,.63,4.35],[1.25,.06,8.3]);
 for(const x of [-5.5,-.5])for(const z of [2.35,5.1,7.4]){
  batch.box(lawn,[x,.65,z],[2.55,.08,1.85]);for(const side of [-1,1]){batch.box(hedge,[x+side*1.2,.84,z],[.18,.32,1.85]);batch.box(hedge,[x,.84,z+side*.83],[2.45,.32,.18]);}
  for(let i=0;i<5;i++)batch.ball(i%2?red:cream,[x+(i-2)*.34,.91,z],[.16,.16,.16]);
 }
 const fx=3.2,fz=3.7;
 cyl(stone,[fx,.71,fz],1.65,1.7,.2,48);ring(limestone,[fx,.87,fz],1.57,.12);
 const fountainUniforms={time:{value:0},night:{value:0}};
 const waterGeo=new T.CircleGeometry(1.48,64);waterGeo.rotateX(-Math.PI/2);
 const waterMaterial=new T.ShaderMaterial({uniforms:fountainUniforms,side:T.DoubleSide,vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`uniform float time,night;varying vec2 vUv;void main(){float r=length(vUv-.5);float rip=sin(r*110.-time*4.)*.5+.5;vec3 col=mix(vec3(.17,.42,.48),vec3(.43,.67,.65),rip*.24);col=mix(col,col*.35+vec3(.1,.07,.025),night*.8);gl_FragColor=vec4(col,1.);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>}`});
 const water=new T.Mesh(waterGeo,waterMaterial);water.name='France · fountain water';water.position.set(fx,.81,fz);group.add(water);
 cyl(limestone,[fx,1.13,fz],.16,.3,.62);cyl(limestone,[fx,1.48,fz],.56,.27,.15);cyl(limestone,[fx,1.73,fz],.1,.18,.42);batch.ball(gold,[fx,1.98,fz],[.12,.12,.12]);
 // Each droplet travels up and falls back into the basin on its own flight phase.
 const sprayGeo=new T.BufferGeometry(),dropData:number[]=[];
 for(let i=0;i<240;i++)dropData.push(rng()*Math.PI*2,rng(),.65+rng()*.45);
 sprayGeo.setAttribute('position',new T.Float32BufferAttribute(new Float32Array(240*3),3));
 sprayGeo.setAttribute('dropData',new T.Float32BufferAttribute(dropData,3));
 const sprayMaterial=new T.PointsMaterial({color:'#d1edf0',size:.085,transparent:true,opacity:.78,depthWrite:false});
 sprayMaterial.onBeforeCompile=shader=>{
  shader.uniforms.fountainTime=fountainUniforms.time;
  shader.vertexShader='uniform float fountainTime;attribute vec3 dropData;varying float vDropAge;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`
   float flight=fract(fountainTime*(.7+.22*fract(dropData.x*7.))+dropData.y);vDropAge=flight;
   vec3 transformed=vec3(cos(dropData.x)*dropData.z*flight,1.93+1.25*flight-2.3*flight*flight,sin(dropData.x)*dropData.z*flight);
  `);
  shader.fragmentShader='varying float vDropAge;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   diffuseColor.a*=(1.-smoothstep(.18,.5,length(gl_PointCoord-.5)))*smoothstep(0.,.04,vDropAge)*(1.-smoothstep(.9,1.,vDropAge));
  `);
 };
 sprayMaterial.customProgramCacheKey=()=> 'paris-fountain-droplets-v1';
 const spray=new T.Points(sprayGeo,sprayMaterial);spray.position.set(fx,0,fz);spray.name='France · fountain spray';spray.frustumCulled=false;group.add(spray);

 function tree(x:number,z:number,h:number){batch.beam(trunk,[x,.64,z],[x,h,z],.06);batch.ball(leaves,[x,h+.15,z],[.42,.67,.42]);cyl(stone,[x,.66,z],.37,.37,.1,12);}
 function lamp(x:number,z:number){batch.beam(iron,[x,.67,z],[x,1.75,z],.027);batch.box(iron,[x,1.78,z],[.2,.06,.2]);batch.box(lights,[x,1.91,z],[.14,.21,.14]);add(new T.ConeGeometry(.18,.16,4),iron,[x,2.07,z],[1,1,1],[0,Math.PI/4,0]);}
 for(let i=0;i<42;i++){
  const a=i/42*Math.PI*2,x=Math.cos(a)*rx*.94,z=Math.sin(a)*rz*.94;
  // Two gaps align with the inter-island bridge approaches.
  if(x>10&&Math.abs(z)<1.4||x>4.7&&x<7.3&&z>7)continue;
  tree(x,z,1.3+rng()*.25);if(i%3===0)lamp(x*.94,z*.94);
 }
 for(const x of [-3.9,-2.1])for(const z of [1,3.8,6.5,8.2])lamp(x,z);
 for(const z of [-.8,1.6,4.2,6.7])lamp(6.9,z);
 group.add(batch.flush('France · boulevards, mansard roofs and parterre gardens'));
 function setNight(n:number){const night=T.MathUtils.clamp(n,0,1);iron.emissiveIntensity=night*.18;glass.emissiveIntensity=night*1.7;gold.emissiveIntensity=night*.7;lights.emissiveIntensity=.1+night*2.1;fountainUniforms.night.value=night;sprayMaterial.color.set('#8baac8').lerp(new T.Color('#d1edf0'),1-night);}
 function update(t:number){fountainUniforms.time.value=t;}
 setNight(0);update(0);
 return {group,setNight,update,uniforms:fountainUniforms,counts:{franceIslands:1,eiffelTower:1,arcDeTriomphe:1,fountains:1,buildings}};
}
