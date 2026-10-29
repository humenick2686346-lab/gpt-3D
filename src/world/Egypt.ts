import * as T from 'three';
import {Batch,toon} from './materials.ts';
import {random} from './layout.ts';

export const egyptPosition={x:18,y:0,z:-34};
export const egyptExtent={radiusX:13,radiusZ:10.8,height:7.4,baseDepth:5.7};
const rx=12.35,rz=10.25;
const edge=(a:number)=>1+.026*Math.sin(5*a+.4)+.015*Math.cos(9*a-.2);

/** An original, walkable miniature of the Egyptian desert, floating among the clouds. */
export function createEgyptIsland(){
 const group=new T.Group();group.name='Egypt · floating desert and pyramids';group.position.set(egyptPosition.x,egyptPosition.y,egyptPosition.z);
 const batch=new Batch(),rng=random(192305);
 const sand=toon('#e7bd7a'),sandlight=toon('#f0cc91'),dune=toon('#dca866'),pyramid=toon('#d6af76'),pyramidLight=toon('#e9c996'),seams=toon('#b98e5b');
 const stone=toon('#cfaa76'),stoneLight=toon('#e3c493'),darkStone=toon('#9e724b'),gold=toon('#d7a950'),blue=toon('#446b81'),trunk=toon('#9c724b'),frond=toon('#6b8951'),frondLight=toon('#8da262');
 const flame=new T.MeshStandardMaterial({color:'#ffd486',emissive:'#ff9f36',emissiveIntensity:.2,roughness:.7});
 const add=(g:T.BufferGeometry,m:T.Material,p=[0,0,0],s=[1,1,1],r=[0,0,0])=>{batch.add(g,m,p,s,r);g.dispose();};
 const cylinder=(m:T.Material,x:number,y:number,z:number,top:number,bottom:number,h:number,seg=12)=>add(new T.CylinderGeometry(top,bottom,h,seg),m,[x,y,z]);

 // Horizontal sedimentary shelves with undercut edges and irregular fault lines.
 const layers=[
  {y:.53,r:1,c:'#e6bd83'},{y:.16,r:1.005,c:'#d5aa73'},{y:-.22,r:.99,c:'#c59461'},
  {y:-.43,r:.965,c:'#a67852'},{y:-.91,r:.98,c:'#cf9d68'},{y:-1.38,r:.925,c:'#ba885b'},
  {y:-1.57,r:.89,c:'#986d4e'},{y:-2.14,r:.9,c:'#c09164'},{y:-2.65,r:.82,c:'#ab7955'},
  {y:-2.86,r:.755,c:'#8d654d'},{y:-3.38,r:.76,c:'#b88761'},{y:-3.91,r:.62,c:'#a17458'},
  {y:-4.12,r:.55,c:'#805c49'},{y:-4.58,r:.53,c:'#a87859'},{y:-5.08,r:.27,c:'#895f4e'},
  {y:-5.48,r:.035,c:'#715345'},{y:-5.56,r:0,c:'#715345'}
 ];
 const p:number[]=[],c:number[]=[],index:number[]=[],n=128;
 for(let j=0;j<layers.length;j++)for(let i=0;i<=n;i++){
  const a=i/n*Math.PI*2,l=layers[j],crack=.016*Math.max(0,Math.sin(a*13+j*.08))**10;
  const r=l.r-crack,wobble=j===0||j===layers.length-1?0:.045*Math.sin(a*7+j*.5)+.022*Math.sin(a*21);
  p.push(Math.cos(a)*rx*edge(a)*r,l.y+wobble,Math.sin(a)*rz*edge(a)*r);
  new T.Color(l.c).multiplyScalar(.96+.055*Math.sin(a*17+j*.55)-crack*4).toArray(c,c.length);
  if(j<layers.length-1&&i<n){const k=j*(n+1)+i;index.push(k,k+1,k+n+1,k+1,k+n+2,k+n+1);}
 }
 const cliffGeo=new T.BufferGeometry();cliffGeo.setAttribute('position',new T.Float32BufferAttribute(p,3));cliffGeo.setAttribute('color',new T.Float32BufferAttribute(c,3));cliffGeo.setIndex(index);cliffGeo.computeVertexNormals();
 const cliffs=new T.Mesh(cliffGeo,toon('#ffffff',true));cliffs.name='Egypt · layered sandstone cliffs';cliffs.castShadow=true;cliffs.receiveShadow=true;group.add(cliffs);
 const boulder=new T.DodecahedronGeometry(1,0),boulderMaterial=toon('#c29a70');
 for(let row=0;row<4;row++)for(let i=0;i<18-row*3;i++){
  const a=(i+.25*row)/(18-row*3)*Math.PI*2,f=[.982,.91,.77,.53][row];
  batch.add(boulder,boulderMaterial,[Math.cos(a)*rx*edge(a)*f,[-.8,-2,-3.2,-4.5][row],Math.sin(a)*rz*edge(a)*f],[.75+rng()*.85,.18+rng()*.18,.3+rng()*.24],[0,Math.PI/2-a,.06]);
 }boulder.dispose();
 // Broad gently sculpted sand bed with pale ridges at the island margins.
 const outline=new T.Shape();for(let i=0;i<=128;i++){const a=i/128*Math.PI*2,x=Math.cos(a)*rx*edge(a),z=Math.sin(a)*rz*edge(a);if(!i)outline.moveTo(x,-z);else outline.lineTo(x,-z);}const ground=new T.ShapeGeometry(outline);ground.rotateX(-Math.PI/2);add(ground,sand,[0,.55,0]);
 for(const [x,z,sx,sz] of [[-9,-4.8,2.5,.9],[-8.3,7,2.3,.8],[8.8,-5.5,2.5,1.1],[9.2,5.2,2,.8],[0,-8.5,3,.65]]){
  batch.ball(sandlight,[x,.54,z],[sx,.22,sz]);batch.beam(dune,[x-sx*.6,.68,z],[x+sx*.35,.68,z-.2],.025);
 }

 // True four-sided pyramids with stone courses traced onto the sloping faces.
 function makePyramid(x:number,z:number,width:number,h:number,material:T.Material){
  batch.box(stone,[x,.58,z],[width+.2,.13,width+.2]);
  if(width>7){const monument=new T.Mesh(new T.ConeGeometry(width/Math.SQRT2,h,4,1),material);monument.name='Egypt · Great Pyramid';monument.position.set(x,.65+h/2,z);monument.rotation.y=Math.PI/4;monument.castShadow=true;monument.receiveShadow=true;group.add(monument);}else add(new T.ConeGeometry(width/Math.SQRT2,h,4,1),material,[x,.65+h/2,z],[1,1,1],[0,Math.PI/4,0]);
  for(let j=1;j<14;j++){
   const q=j/14,half=(width/2)*(1-q)+.012,y=.65+h*q;
   for(const side of [-1,1]){
    batch.beam(seams,[x-half,y,z+side*half],[x+half,y,z+side*half],.012);
    batch.beam(seams,[x+side*half,y,z-half],[x+side*half,y,z+half],.012);
   }
  }
  // Inset entrance faces the foreground, with a lintel and threshold.
  batch.box(darkStone,[x,.96,z+width/2+.016],[width*.11,.62,.035]);batch.box(stoneLight,[x,1.29,z+width/2+.035],[width*.16,.08,.07]);
 }
 makePyramid(-3.15,-2.85,7.35,6.55,pyramidLight);
 makePyramid(3.2,-3.8,5.15,4.7,pyramid);
 makePyramid(7.55,-3.6,3.1,2.95,pyramidLight);

 // A reclining sphinx guards the processional way. The distinct face, striped
 // headdress, lion body and extended paws are all real miniature geometry.
 const sx=-3.0,sz=3.7;
 batch.box(stone,[sx,.86,sz-.15],[2.15,.45,2.9]);
 batch.box(stoneLight,[sx,1.22,sz-.4],[1.85,.8,2]);
 batch.ball(stone,[sx,1.45,sz+.25],[.83,.73,.74]);
 batch.box(stoneLight,[sx,2.15,sz+.38],[.76,1.02,.63]);
 batch.box(stoneLight,[sx,1.92,sz+.78],[.51,.53,.28]);
 batch.box(darkStone,[sx-.16,2.28,sz+.71],[.08,.06,.02]);batch.box(darkStone,[sx+.16,2.28,sz+.71],[.08,.06,.02]);
 batch.box(stone,[sx,1.78,sz+.83],[.16,.32,.18]);
 batch.box(blue,[sx,2.63,sz+.32],[1.1,.2,.9]);batch.box(gold,[sx,2.75,sz+.32],[.84,.08,.68]);
 for(const side of [-1,1]){
  batch.box(blue,[sx+side*.52,2.03,sz+.38],[.2,1.0,.75]);
  for(let i=0;i<5;i++)batch.box(gold,[sx+side*.53,1.65+i*.2,sz+.77],[.21,.055,.035]);
  batch.box(stoneLight,[sx+side*.65,1.05,sz+1.15],[.45,.4,1.9]);
  batch.ball(stone,[sx+side*.65,.95,sz+2.05],[.24,.2,.32]);
 }
 // Temple courtyard, truncated pillars, lintels and a paired gateway.
 const tx=4.5,tz=3.0;
 batch.box(stone,[tx,.66,tz],[5.4,.22,5.2]);batch.box(sandlight,[tx,.79,tz],[4.9,.1,4.7]);
 for(let row=0;row<3;row++)for(const side of [-1,1]){
  const x=tx+side*1.7,z=tz-1.6+row*1.55,height=row===2&&side===1?1.25:2.05;
  cylinder(stone,x,.94,z,.36,.4,.3);cylinder(stoneLight,x,1.08+height/2,z,.22,.27,height);cylinder(stone,x,1.11+height,z,.38,.31,.22);
  for(let h=0;h<3;h++)cylinder(seams,x,1.32+h*.25,z,.275,.275,.03,12);
 }
 batch.box(stone,[tx,3.24,tz-1.6],[3.95,.32,.65]);batch.box(stone,[tx,3.24,tz-.05],[3.95,.32,.65]);
 for(const side of [-1,1]){
  batch.box(stone,[tx+side*2.12,1.55,tz+2.1],[.85,1.9,.7]);
  add(new T.ConeGeometry(.52,.7,4),gold,[tx+side*2.12,2.85,tz+2.1],[1,1,1],[0,Math.PI/4,0]);
  batch.box(blue,[tx+side*2.12,2.34,tz+2.47],[.62,.12,.035]);
 }
 batch.box(stoneLight,[tx,2.55,tz+2.1],[4.8,.3,.7]);
 // Two obelisks and flickering lamps outline a processional route.
 for(const side of [-1,1]){
  const x=side*1.05,z=6.4;
  batch.box(stone,[x,.7,z],[.8,.25,.8]);add(new T.CylinderGeometry(.17,.35,2.45,4),stoneLight,[x,2.0,z],[1,1,1],[0,Math.PI/4,0]);
  add(new T.ConeGeometry(.24,.36,4),gold,[x,3.4,z],[1,1,1],[0,Math.PI/4,0]);
  cylinder(darkStone,x+side*.85,.88,z,.24,.18,.55);batch.ball(flame,[x+side*.85,1.28,z],[.16,.27,.16]);
 }
 for(let i=0;i<8;i++)batch.box(stoneLight,[0,.59,2.0+i*.8],[1.3,.06,.58]);

 // Oasis water is an animated shader, so it continues to ripple while the
 // day/night clock is paused. A sandy bank and palms complete the silhouette.
 const oasisX=-7.5,oasisZ=3.5;
 const waterUniforms={time:{value:0},night:{value:0}};
 batch.ball(dune,[oasisX,.56,oasisZ],[2.45,.1,1.8]);
 const oval=new T.CircleGeometry(1,64);oval.rotateX(-Math.PI/2);
 const waterMat=new T.ShaderMaterial({uniforms:waterUniforms,side:T.DoubleSide,vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`uniform float time,night;varying vec2 vUv;void main(){float a=sin(vUv.x*45.+sin(vUv.y*18.-time*.8)*2.-time*1.5);float b=sin(vUv.y*37.+time*.9);float s=pow(max(0.,a*b),14.);vec3 col=mix(vec3(.12,.43,.45),vec3(.28,.67,.60),.5+.12*a);col+=s*vec3(.23,.22,.16);col=mix(col,col*.38+vec3(.02,.08,.1),night*.8);gl_FragColor=vec4(col,1.);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>}`});
 const oasis=new T.Mesh(oval,waterMat);oasis.name='Egypt · oasis water';oasis.position.set(oasisX,.685,oasisZ);oasis.scale.set(2.12,1,1.44);group.add(oasis);
 const leafGeometry=(x:number,y:number,z:number,a:number,length:number)=>{
  const pos:number[]=[],idx:number[]=[];const dir=new T.Vector3(Math.cos(a),0,Math.sin(a)),cross=new T.Vector3(-dir.z,0,dir.x);
  for(let i=0;i<=6;i++){const t=i/6,w=.24*Math.sin(Math.PI*t),center=new T.Vector3(x,y,z).addScaledVector(dir,length*t);center.y+=.45*Math.sin(Math.PI*t)-.47*t*t;for(const sign of [-1,1])pos.push(center.x+cross.x*w*sign,center.y,center.z+cross.z*w*sign);if(i<6){const k=i*2;idx.push(k,k+1,k+2,k+1,k+3,k+2);}}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();return g;
 };
 const palms=[[-10,1],[-9.8,4.5],[-8.8,6.2],[-6.5,6.3],[-5.8,5.0],[-7.0,1.2],[8.7,3.2],[8.6,-.1]];
 for(const [x,z] of palms){
  const h=2.05+rng()*.48;for(let i=0;i<5;i++){
   const t=i/5,t2=(i+1)/5;batch.beam(trunk,[x+.15*t*t,.6+h*t,z],[x+.15*t2*t2,.6+h*t2,z],.16-.05*t);
   cylinder(seams,x+.15*t*t,.63+h*t,z,.15-.05*t,.15-.05*t,.04,9);
  }
  const y=.6+h;for(let j=0;j<9;j++){const a=j/9*Math.PI*2+rng()*.12;const leaf=leafGeometry(x+.15,y,z,a,1.25+rng()*.45);batch.add(leaf,j%2?frond:frondLight);leaf.dispose();}
  batch.ball(stone,[x+.15,y-.03,z],[.22,.18,.22]);
 }
 const decorations=batch.flush('Egypt · desert monuments, palms and temple');group.add(decorations);
 function setNight(n:number){const value=T.MathUtils.clamp(n,0,1);flame.emissiveIntensity=.2+value*2.2;waterUniforms.night.value=value;}
 function update(t:number){waterUniforms.time.value=t;}
 setNight(0);update(0);
 return {group,setNight,update,counts:{egyptIslands:1,pyramids:3,sphinx:1,oases:1,palms:palms.length,temples:1}};
}
