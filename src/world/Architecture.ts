import * as T from 'three';
import {Batch,mats,lamp} from './materials.ts';
import {buildings,height,streamX,pathX} from './layout.ts';
function roof(b:Batch,y:number,w:number,d:number){
 const p:number[]=[],idx:number[]=[],nx=16,nz=20;
 const profile=(x:number,z:number)=>y+.58*Math.pow(1-Math.abs(z)/(d*.5),1.25)+.15*Math.pow(Math.abs(z)/(d*.5),6)+.11*Math.pow(Math.abs(x)/(w*.5),6);
 for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){const x=(i/nx-.5)*w,z=(j/nz-.5)*d;p.push(x,profile(x,z),z);}
 for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i;idx.push(a,a+nx+1,a+1,a+1,a+nx+1,a+nx+2);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(idx);g.computeVertexNormals();b.add(g,mats.roof);g.dispose();
 // Continuous ridge, upturned eaves and closely spaced raised tile seams.
 b.beam(mats.gold,[-w*.53,y+.7,0],[w*.53,y+.7,0],.035);
 for(const side of [-1,1])for(let i=0;i<16;i++){const x=-w*.5+i*w/16,xx=x+w/16;b.beam(mats.gold,[x,profile(x,side*d*.5),side*d*.5],[xx,profile(xx,side*d*.5),side*d*.5],.027);}
 for(let x=-w*.5;x<=w*.51;x+=.17)for(const side of [-1,1])for(let j=0;j<6;j++){const z=side*d*.5*j/6,z2=side*d*.5*(j+1)/6;b.beam(mats.roof,[x,profile(x,z)+.018,z],[x,profile(x,z2)+.018,z2],.018);}
 for(const side of [-1,1])b.beam(mats.gold,[side*w*.48,y+.64,0],[side*w*.58,y+.84,0],.04);
}
function house(kind:string){
 const b=new Batch(),stories=kind==='pagoda'?3:kind==='shrine'?2:1;
 b.box(mats.stone,[0,.08,0],[2.18,.16,1.75]);b.box(mats.wood,[0,.24,0],[2.12,.16,1.7]);
 for(let j=0;j<3;j++)b.box(mats.stone,[0,.055+j*.065,1.04-j*.12],[1.1,.11,.32]);
 for(let level=0;level<stories;level++){
  const s=1-level*.2,y=.34+level*1.12,h=kind==='pavilion'?.75:.82;
  if(kind!=='pavilion'){b.box(mats.white,[0,y+h*.5,0],[1.65*s,h,1.22*s]);b.box(mats.red,[0,y+h-.04,0],[1.84*s,.1,1.4*s]);}
  for(const x of [-.85,.85])for(const z of [-.66,.66]){b.box(mats.red,[x*s,y+h*.5,z*s],[.105,h+.06,.105]);b.box(mats.gold,[x*s,y+.07,z*s],[.15,.09,.15]);}
  for(const side of [-1,1]){
   b.box(mats.wood,[0,y+.36,side*.623*s],[1.25*s,.52,.025]);
   for(let j=0;j<5;j++){b.box(lamp,[(j-2)*.23*s,y+.4,side*.642*s],[.18*s,.34,.025]);}
   for(let j=0;j<6;j++)b.box(mats.red,[(j-2.5)*.23*s,y+.4,side*.666*s],[.026,.42,.027]);
   for(const yy of [.26,.43,.58])b.box(mats.red,[0,y+yy,side*.67*s],[1.3*s,.025,.03]);
  }
  roof(b,y+h,2.6*s,2.05*s);
  if(level>0){b.box(mats.red,[0,y-.03,0],[2.1*s,.13,1.7*s]);for(let i=-4;i<=4;i++)b.box(mats.red,[i*.21*s,y+.15,.78*s],[.035,.32,.035]);b.box(mats.gold,[0,y+.3,.78*s],[1.8*s,.04,.04]);}
 }
 // Timber veranda and its fine vertical balustrade.
 for(let i=-6;i<=6;i++)b.box(mats.wood,[i*.15,.35,.79],[.025,.26,.03]);b.box(mats.gold,[0,.49,.79],[1.94,.04,.045]);
 for(const x of [-.85,.85]){b.beam(mats.wood,[x,.93,.88],[x,.75,.88],.013);b.add(new T.CylinderGeometry(.1,.1,.18,12),lamp,[x,.65,.88]);b.box(mats.roof,[x,.77,.88],[.22,.025,.22]);}
 return b.flush('Original Japanese '+kind);
}
function absorb(batch:Batch,group:T.Group){group.updateMatrixWorld(true);group.traverse(o=>{if(o instanceof T.Mesh){const g=o.geometry.clone().applyMatrix4(o.matrixWorld);batch.add(g,o.material as T.Material);g.dispose();o.geometry.dispose();}});}
export function createArchitecture(){
 const batch=new Batch();
 for(const b of buildings){const g=house(b.kind);g.position.set(b.x,height(b.x,b.z),b.z);g.rotation.y=b.rot;g.scale.setScalar(b.s);absorb(batch,g);}
 function torii(x:number,z:number,scale:number,rotation=0){const b=new Batch();for(const side of [-1,1]){b.beam(mats.red,[side*.68,0,0],[side*.65,1.6,0],.085);b.box(mats.stone,[side*.68,.08,0],[.25,.16,.25]);b.box(mats.gold,[side*.65,1.3,0],[.2,.08,.17]);}b.box(mats.red,[0,1.25,0],[1.9,.11,.15]);b.box(mats.red,[0,1.6,0],[2.15,.17,.23]);b.beam(mats.roof,[-1.15,1.74,0],[0,1.67,0],.09);b.beam(mats.roof,[0,1.67,0],[1.15,1.74,0],.09);b.box(mats.gold,[0,1.44,.14],[.18,.25,.035]);const g=b.flush('Torii');g.position.set(x,height(x,z),z);g.rotation.y=rotation;g.scale.setScalar(scale);absorb(batch,g);}
 torii(-4.15,.9,.85,.18);torii(1.55,1.05,.75,Math.PI*.5);
 function bridge(x:number,z:number,rot:number){const b=new Batch(),half=1.25;for(let i=0;i<22;i++){const u=-half+i*half*2/21,y=.2+.38*(1-(u/half)**2);b.box(mats.wood,[u,y,0],[.115,.09,.82]);for(const side of [-1,1]){if(i%3===0)b.box(mats.red,[u,y+.24,side*.44],[.055,.55,.055]);if(i>0){const prev=u-half*2/21,py=.2+.38*(1-(prev/half)**2);b.beam(mats.red,[prev,py+.5,side*.44],[u,y+.5,side*.44],.035);b.beam(mats.gold,[prev,py+.22,side*.44],[u,y+.22,side*.44],.018);}}}const g=b.flush('Arched timber bridge');g.position.set(x,.55,z);g.rotation.y=rot;absorb(batch,g);}
 bridge(streamX(1),1,0);bridge(1.95,-.95,.35);
 // A lakeside viewing deck and wooden rails along the upper terrace.
 for(let i=0;i<17;i++)batch.box(mats.wood,[4.6+i*.085,.65,-2.1],[.075,.09,1.2]);
 for(let i=0;i<15;i++){const x=-7.5+i*.24,z=-.65,y=height(x,z);batch.box(mats.wood,[x,y+.22,z],[.04,.44,.04]);if(i<14)batch.beam(mats.gold,[x,y+.43,z],[x+.24,height(x+.24,z)+.43,z],.027);}
 // Stone lanterns punctuate paths, with emissive paper cores controlled by time.
 for(let i=0;i<15;i++){const z=-3+i*.67,x=pathX(z)+(i%2?-.61:.61);if(z<-1.5&&x>-.6)continue;const y=height(x,z);batch.box(mats.stone,[x,y+.12,z],[.26,.2,.26]);batch.box(mats.stone,[x,y+.32,z],[.09,.26,.09]);batch.box(lamp,[x,y+.51,z],[.16,.18,.16]);batch.box(mats.stone,[x,y+.62,z],[.3,.06,.3]);batch.add(new T.ConeGeometry(.19,.12,4),mats.roof,[x,y+.71,z],[1,1,1],[0,Math.PI/4,0]);}
 const group=batch.flush('9 buildings · 2 torii · 2 bridges · lanterns');
 return {group,counts:{buildings:buildings.length,largeBuildings:3,smallBuildings:6,bridges:2,torii:2},setNight(n:number){lamp.emissiveIntensity=.16+n*2.8;}};
}
