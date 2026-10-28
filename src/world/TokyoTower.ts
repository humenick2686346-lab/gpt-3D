import * as T from 'three';
import {Batch,toon} from './materials.ts';

export const towerPosition={x:17.1,y:.35,z:-.8};
export const towerExtent={radius:1.9,height:7.4,baseDepth:2.6};

/** A compact Tokyo Tower on its own rocky terrace beside the sakura island. */
export function createTokyoTower(){
 const group=new T.Group();group.name='Tokyo Tower · four-legged red and white lattice';
 group.position.set(towerPosition.x,towerPosition.y,towerPosition.z);
 const batch=new Batch();
 const red=toon('#d8553b'),white=toon('#f2ebdf'),steel=toon('#667581');
 const stone=toon('#c5c0ad'),dark=toon('#4d5760');
 red.emissive.set('#f66529');white.emissive.set('#ffd19b');
 const windows=new T.MeshStandardMaterial({color:'#415c69',metalness:.35,roughness:.32,emissive:'#ffd397',emissiveIntensity:.05});
 const lights=new T.MeshStandardMaterial({color:'#ffe7bb',emissive:'#ffc778',emissiveIntensity:.3,roughness:.5});
 const beacon=new T.MeshBasicMaterial({color:'#f87a54',toneMapped:false});
 const add=(geometry:T.BufferGeometry,material:T.Material,p=[0,0,0],s=[1,1,1],r=[0,0,0])=>{batch.add(geometry,material,p,s,r);geometry.dispose();};

 // The small terrace has its own closed, layered rock body and never overlaps
 // the main island's trees, buildings, river or east waterfall.
 const rockPositions:number[]=[],rockColors:number[]=[],rockIndices:number[]=[],rockSegments=64;
 const strata=[{y:-.03,r:1.79,c:'#b9a58f'},{y:-.42,r:1.8,c:'#a69b95'},{y:-1.4,r:1.36,c:'#7d8792'},{y:-2.35,r:.46,c:'#647482'},{y:-towerExtent.baseDepth,r:0,c:'#596b78'}];
 const rockColor=new T.Color();
 for(let j=0;j<strata.length;j++)for(let i=0;i<=rockSegments;i++){
  const a=i/rockSegments*Math.PI*2,layer=strata[j];
  const irregular=1+.027*Math.sin(a*5+.4)+.022*Math.cos(a*9+j*.3);
  rockPositions.push(Math.cos(a)*layer.r*irregular,layer.y+(j===0||j===strata.length-1?0:.065*Math.sin(a*7+j)),Math.sin(a)*layer.r*irregular);
  rockColor.set(layer.c).multiplyScalar(.95+.055*Math.sin(a*13+j*2));rockColor.toArray(rockColors,rockColors.length);
  if(j<strata.length-1&&i<rockSegments){const k=j*(rockSegments+1)+i;rockIndices.push(k,k+1,k+rockSegments+1,k+1,k+rockSegments+2,k+rockSegments+1);}
 }
 const rockGeometry=new T.BufferGeometry();rockGeometry.setAttribute('position',new T.Float32BufferAttribute(rockPositions,3));rockGeometry.setAttribute('color',new T.Float32BufferAttribute(rockColors,3));rockGeometry.setIndex(rockIndices);rockGeometry.computeVertexNormals();
 const rock=new T.Mesh(rockGeometry,toon('#ffffff',true));rock.name='Tokyo Tower · floating stone terrace';rock.castShadow=true;rock.receiveShadow=true;group.add(rock);
 add(new T.CylinderGeometry(1.81,1.77,.13,64),stone,[0,.025,0]);
 add(new T.CylinderGeometry(1.68,1.7,.045,64),dark,[0,.11,0]);
 add(new T.CylinderGeometry(1.65,1.65,.045,64),stone,[0,.15,0]);
 // Thin radial paving seams retain a readable pedestrian scale around the feet.
 for(let i=0;i<32;i++){const a=i/32*Math.PI*2;batch.beam(dark,[Math.cos(a)*1.46,.176,Math.sin(a)*1.46],[Math.cos(a)*1.65,.176,Math.sin(a)*1.65],.009);}

 const levels=[{y:.28,w:1.2},{y:1.18,w:.96},{y:2.15,w:.67},{y:2.9,w:.49},{y:3.15,w:.44},{y:3.65,w:.36},{y:4.05,w:.32},{y:4.6,w:.26},{y:5.05,w:.205},{y:5.6,w:.15},{y:5.95,w:.095}];
 const corners=[[-1,-1],[1,-1],[1,1],[-1,1]];
 const paint=(y:number)=>y<3.65?red:y<4.05?white:y<4.6?red:y<5.05?white:y<5.6?red:white;
 const point=(corner:number,level:{y:number,w:number},offset=0)=>[corners[corner][0]*(level.w+offset),level.y,corners[corner][1]*(level.w+offset)];
 for(let corner=0;corner<4;corner++){
  const [sx,sz]=corners[corner];
  batch.box(stone,[sx*1.2,.225,sz*1.2],[.24,.11,.24]);
  batch.box(steel,[sx*1.2,.29,sz*1.2],[.19,.025,.19]);
  for(let j=0;j<levels.length-1;j++){
   const lower=levels[j],upper=levels[j+1],material=paint((lower.y+upper.y)*.5);
   const radius=j<2?.06:j<5?.042:.024;
   batch.beam(material,point(corner,lower),point(corner,upper),radius);
   // A second chord on each lower leg gives the splayed feet actual depth.
   if(j<3)batch.beam(material,point(corner,lower,-.13),point(corner,upper,-.09),radius*.64);
  }
 }
 // Each face receives horizontal girts and staggered diagonal cross-bracing.
 // The lower bay stays open beneath the four curved entrance arches.
 for(let j=1;j<levels.length;j++){
  const level=levels[j],material=paint(level.y-.005);
  for(let face=0;face<4;face++)batch.beam(material,point(face,level),point((face+1)%4,level),j<5?.027:.016);
 }
 for(let j=1;j<levels.length-1;j++)for(let face=0;face<4;face++){
  const lower=levels[j],upper=levels[j+1],next=(face+1)%4,material=paint((lower.y+upper.y)*.5),radius=j<4?.023:.014;
  batch.beam(material,point(face,lower),point(next,upper),radius);
  batch.beam(material,point(next,lower),point(face,upper),radius);
  if(j<4){
   const middle={y:(lower.y+upper.y)*.5,w:(lower.w+upper.w)*.5};
   batch.beam(material,point(face,middle),point(next,middle),.014);
  }
 }
 for(let face=0;face<4;face++){
  const a=corners[face],b=corners[(face+1)%4];
  for(let i=0;i<14;i++){
   const u=i/14,v=(i+1)/14;
   const at=(t:number)=>[(a[0]+(b[0]-a[0])*t)*1.16,.55+1.02*Math.sin(t*Math.PI)**.82,(a[1]+(b[1]-a[1])*t)*1.16];
   batch.beam(red,at(u),at(v),.045);
  }
 }
 // The lift core is narrow enough to preserve the open lattice silhouette.
 batch.box(steel,[0,2.93,0],[.12,5.22,.12]);
 for(let y=.6;y<5.45;y+=.22){batch.box(white,[0,y,.069],[.07,.026,.018]);}

 function deck(y:number,width:number,height:number,panes:number){
  batch.box(red,[0,y-height*.5-.035,0],[width+.1,.07,width+.1]);
  batch.box(white,[0,y,0],[width,height,width]);
  batch.box(red,[0,y+height*.5+.045,0],[width+.17,.075,width+.17]);
  for(let face=0;face<4;face++){
   const axis=face%2===0?'x':'z',side=face<2?1:-1;
   for(let i=0;i<panes;i++){
    const u=(i-(panes-1)*.5)*(width*.86/panes),position=axis==='x'?[side*(width*.5+.006),y,u]:[u,y,side*(width*.5+.006)];
    const size=axis==='x'?[.018,height*.66,width*.7/panes]:[width*.7/panes,height*.66,.018];
    batch.box(windows,position,size);
   }
   const a=axis==='x'?[side*(width*.5+.045),y+height*.5+.095,-width*.45]:[-width*.45,y+height*.5+.095,side*(width*.5+.045)];
   const b=axis==='x'?[side*(width*.5+.045),y+height*.5+.095,width*.45]:[width*.45,y+height*.5+.095,side*(width*.5+.045)];
   batch.beam(white,a,b,.014);
  }
  add(new T.CylinderGeometry(width*.47,width*.76,.12,4),red,[0,y+height*.5+.14,0],[1,1,1],[0,Math.PI/4,0]);
 }
 deck(3.31,1.34,.32,7);
 deck(5.47,.76,.25,5);
 // Alternating antenna sections, service rings and a tiny red aviation beacon.
 const mast=[5.95,6.16,6.39,6.62,6.85,7.08,7.34];
 for(let i=0;i<mast.length-1;i++){
  const lower=mast[i],upper=mast[i+1],r=.065-(lower-5.95)*.026;
  add(new T.CylinderGeometry(Math.max(.023,r-.008),r,upper-lower,10),i%2?white:red,[0,(lower+upper)*.5,0]);
  add(new T.TorusGeometry(r+.025,.008,5,16),i%2?white:red,[0,lower,0],[1,1,1],[Math.PI/2,0,0]);
 }
 for(const y of [6.11,6.58])for(const angle of [0,Math.PI/2]){
  batch.beam(white,[-Math.cos(angle)*.13,y,-Math.sin(angle)*.13],[Math.cos(angle)*.13,y,Math.sin(angle)*.13],.012);
 }
 add(new T.SphereGeometry(.04,10,7),beacon,[0,towerExtent.height-.04,0]);
 // Downlights sit at cardinal points, away from the diagonal concrete footings.
 for(let i=0;i<4;i++){
  const a=i/4*Math.PI*2,x=Math.cos(a)*1.5,z=Math.sin(a)*1.5;
  batch.box(dark,[x,.245,z],[.12,.12,.12]);
  batch.box(lights,[x,.313,z],[.085,.025,.085]);
  const c=corners[i];batch.box(lights,[c[0]*.64,3.55,c[1]*.64],[.055,.025,.055]);
 }
 const tower=batch.flush('Tokyo Tower · painted steel, observation decks and antenna');group.add(tower);
 function setNight(n:number){
  const night=T.MathUtils.clamp(n,0,1);
  red.emissiveIntensity=night*.55;white.emissiveIntensity=night*.35;
  windows.emissiveIntensity=.05+night*1.6;lights.emissiveIntensity=.3+night*2.2;
  beacon.color.set(night>.1?'#ff744c':'#d74c3a');
 }
 setNight(0);
 return {group,setNight};
}
