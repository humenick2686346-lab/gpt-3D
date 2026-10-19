import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {Batch,mats,toon,colored} from './materials.ts';
import {random,height,plantable,trees,qualityConfig,type Quality} from './layout.ts';
function flowerGeometry(kind:number,detail=false){
 const parts:T.BufferGeometry[]=[];
 const add=(g:T.BufferGeometry,c:string,p:number[],s=[1,1,1],r=[0,0,0])=>{colored(g,c);g.applyMatrix4(new T.Matrix4().compose(new T.Vector3(...p),new T.Quaternion().setFromEuler(new T.Euler(...r)),new T.Vector3(...s)));parts.push(g);};
 const h=kind===1?.37:kind===0?.29:.23;
 add(new T.CylinderGeometry(.008,.012,h,4),'#5c8547',[0,h/2,0]);
 for(const side of [-1,1])add(new T.SphereGeometry(1,5,detail?3:2),'#84ad52',[side*.052,h*.38,0],[.09,.018,.028],[0,0,side*.45]);
 if(kind===1){for(let k=0;k<7;k++)for(let j=0;j<3;j++){const a=j/3*Math.PI*2+k*.8;add(new T.SphereGeometry(1,4,detail?3:2),'#ffffff',[Math.cos(a)*.028,h-.13+k*.028,Math.sin(a)*.028],[.03,.024,.024]);}}
 else {const petals=kind===0?6:kind===2?7:9;for(let i=0;i<petals;i++){const a=i/petals*Math.PI*2;add(new T.SphereGeometry(1,5,detail?3:2),'#ffffff',[Math.cos(a)*(kind===0?.042:.062),h+(kind===0?.018:0),Math.sin(a)*(kind===0?.042:.062)],[kind===0?.036:.072,kind===0?.07:.018,kind===0?.029:.036],[0,-a,kind===0?-.3:0]);}if(kind!==0)add(new T.SphereGeometry(.027,6,3),'#f3c967',[0,h+.018,0]);}
 const merged=mergeGeometries(parts);parts.forEach(g=>g.dispose());merged.computeBoundingSphere();return merged;
}
function blossomGeometry(){
 const p:number[]=[];for(let j=0;j<5;j++){const a=j/5*Math.PI*2;const x=Math.cos(a),z=Math.sin(a),tx=-z*.36,tz=x*.36;p.push(0,0,0,x*.5+tx,.08,z*.5+tz,x,.02,z,0,0,0,x,.02,z,x*.5-tx,.08,z*.5-tz);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.computeVertexNormals();return g;
}
export class Vegetation {
 group=new T.Group();flowers:T.InstancedMesh[]=[];count=0;quality:Quality;cherryCount=trees.length;
 constructor(quality:Quality){this.group.name='Flower carpets and 29 cherry trees';this.quality=quality;this.createTrees();this.createFlowers();this.setQuality(quality);}
 createFlowers(){
  const rng=random(3401),max=qualityConfig.high.flowers,positions:{x:number,z:number,scale:number,kind:number,c:T.Color}[]=[];
  const palette=['#ec79ab','#b79ce4','#f3c864','#f4e7d7','#ea9d6b','#da68a1'];
  let attempts=0;while(positions.length<max&&attempts++<max*8){const x=(rng()-.5)*20,z=(rng()-.5)*17.2;if(!plantable(x,z))continue;const band=Math.floor((x+z*.65+1.2*Math.sin(z*.8)+24)/2.2)%6;const kind=band===1?1:band===2?3:band===3?2:0;positions.push({x,z,kind,scale:.8+rng()*.6,c:new T.Color(palette[band]).multiplyScalar(.85+rng()*.23)});}
  const dummy=new T.Object3D();for(let k=0;k<4;k++){const selected=positions.filter(p=>p.kind===k);const mesh=new T.InstancedMesh(flowerGeometry(k),toon('#ffffff',true,true),selected.length);selected.forEach((p,i)=>{dummy.position.set(p.x,height(p.x,p.z)+.02,p.z);dummy.rotation.set(0,rng()*Math.PI*2,0);dummy.scale.setScalar(p.scale);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);mesh.setColorAt(i,p.c);});mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor!.needsUpdate=true;mesh.receiveShadow=true;mesh.name=['Tulips','Lavender','Cosmos','Golden daisies'][k];mesh.userData.max=selected.length;mesh.userData.simple=mesh.geometry;mesh.userData.detail=flowerGeometry(k,true);mesh.computeBoundingSphere();this.flowers.push(mesh);this.group.add(mesh);}
 }
 createTrees(){
  const b=new Batch(),rng=random(722),dummy=new T.Object3D();const clusterCount=trees.length*35;
  const canopyGeo=new T.SphereGeometry(1,16,10);const canopy=new T.InstancedMesh(canopyGeo,toon('#ffffff'),clusterCount);let ci=0;
  const small=new T.InstancedMesh(blossomGeometry(),toon('#ffffff'),trees.length*190);let si=0;
  for(let index=0;index<trees.length;index++){
   const [x,z]=trees[index],y=height(x,z),h=1.05+rng()*.65,s=.74+rng()*.34;
   b.beam(mats.wood,[x,y,z],[x+.1,y+h,z],.075*s);
   for(let j=0;j<6;j++){const a=j/6*Math.PI*2+.3,xx=x+Math.cos(a)*.65*s,zz=z+Math.sin(a)*.65*s;b.beam(mats.wood,[x+.06,y+h*.65,z],[xx,y+h+.27,zz],.037*s);b.beam(mats.wood,[xx,y+h+.27,zz],[xx+Math.cos(a)*.25,y+h+.48,zz+Math.sin(a)*.25],.018);}
   for(let j=0;j<35;j++){const a=rng()*Math.PI*2,r=Math.sqrt(rng())*.95*s,yy=y+h+.35+(1-r)*.34;dummy.position.set(x+Math.cos(a)*r,yy+(rng()-.5)*.3,z+Math.sin(a)*r);dummy.scale.set(.22+rng()*.17,.085+rng()*.09,.22+rng()*.16);dummy.rotation.set(rng(),rng()*6,rng());dummy.updateMatrix();canopy.setMatrixAt(ci,dummy.matrix);canopy.setColorAt(ci,new T.Color(['#ee94b6','#f9b6ca','#e980ab','#f7c2d2'][Math.floor(rng()*4)]));ci++;}
   for(let j=0;j<190;j++){const a=rng()*Math.PI*2,r=Math.sqrt(rng())*1.02*s,yy=y+h+.43+(1-r)*.35;dummy.position.set(x+Math.cos(a)*r,yy+(rng()-.5)*.3,z+Math.sin(a)*r);dummy.scale.set(.045+rng()*.04,.035,.045+rng()*.04);dummy.updateMatrix();small.setMatrixAt(si,dummy.matrix);small.setColorAt(si,new T.Color(j%4?'#ffc8d8':'#ee8eb2'));si++;}
  }
  canopy.castShadow=true;canopy.receiveShadow=true;canopy.name='Layered cherry blossom crowns';small.name='Cherry blossom clusters';small.receiveShadow=true;this.group.add(b.flush('Cherry trunks and branches'),canopy,small);
 }
 updateLOD(zoom:number){for(const m of this.flowers)m.geometry=zoom>1.65?m.userData.detail:m.userData.simple;}
 setQuality(q:Quality){this.quality=q;this.count=0;const ratio=qualityConfig[q].flowers/qualityConfig.high.flowers;for(const mesh of this.flowers){mesh.count=Math.floor(mesh.userData.max*ratio);this.count+=mesh.count;}}
}
