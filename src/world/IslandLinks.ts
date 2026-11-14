import * as T from 'three';
import {Batch,toon} from './materials.ts';
import {height} from './layout.ts';

export type IslandId='fuji'|'france'|'egypt'|'shanghai';
export const linkDeckWidth=1.44;
function link(id:string,from:IslandId,to:IslandId,a:number[],b:number[],bow:number){
 const start=new T.Vector3(...a),end=new T.Vector3(...b),side=new T.Vector3(end.z-start.z,0,start.x-end.x).normalize();
 const points=Array.from({length:9},(_,i)=>{
  const t=i/8,p=start.clone().lerp(end,t);p.addScaledVector(side,Math.sin(Math.PI*t)*bow);p.y+=Math.sin(Math.PI*t)*.9;return p;
 });
 return {id,from,to,start,end,curve:new T.CatmullRomCurve3(points,false,'centripetal')};
}
// Landings extend into the dry ground. The original U bridge supplies the
// fourth edge, Fuji–Shanghai, so the four destinations form a walkable loop.
export const linkPaths=[
 link('fuji-france','fuji','france',[-5.1,height(-5.1,-9.8)+.08,-9.8],[-12.5,.65,-24.7],-.7),
 link('france-egypt','france','egypt',[-6.8,.65,-33],[7.5,.63,-35.2],.7),
 link('egypt-shanghai','egypt','shanghai',[24,.63,-26],[30.5,.66,-8.8],.8),
];
const bounds=new T.Box3();for(const link of linkPaths)for(const p of link.curve.getPoints(100))bounds.expandByPoint(p);
bounds.min.add(new T.Vector3(-1.2,-1.8,-1.2));bounds.max.add(new T.Vector3(1.2,2.25,1.2));
export const linksExtent={min:bounds.min.toArray(),max:bounds.max.toArray()};

/** Three continuous arched promenades complete the four-island circuit. */
export function createIslandLinks(){
 const group=new T.Group();group.name='Four islands · connecting garden bridges';
 const structure=new Batch();
 const wood=toon('#b9a080'),stone=toon('#c6bc9f'),paleStone=toon('#ded0ad');
 const iron=toon('#536d70'),gold=toon('#bba66b');
 const light=new T.MeshStandardMaterial({color:'#ffe4aa',emissive:'#ffd18a',emissiveIntensity:.1,roughness:.62});
 let lampCount=0,postCount=0;
 for(const link of linkPaths){
  const curve=link.curve,length=curve.getLength(),segments=Math.ceil(length/.26),up=new T.Vector3(0,1,0);
  const frame=(t:number)=>{
   const p=curve.getPointAt(T.MathUtils.clamp(t,0,1)),tangent=curve.getTangentAt(T.MathUtils.clamp(t,0,1));
   const across=new T.Vector3(tangent.z,0,-tangent.x).normalize();return {p,tangent,across};
  };
  const at=(t:number,side:number,lift:number)=>{const{p,across}=frame(t);return p.addScaledVector(across,side).addScaledVector(up,lift).toArray();};
  // One solid ribbon per deck. Every successive section shares the same
  // vertices; plank seams are only shallow top detailing, never open gaps.
  const pos:number[]=[],uv:number[]=[],indices:number[]=[];
  for(let i=0;i<=segments;i++){
   const t=i/segments,{p,across}=frame(t);
   for(const [sign,y]of [[-1,0],[1,0],[-1,-.16],[1,-.16]]){
    pos.push(p.x+across.x*sign*linkDeckWidth/2,p.y+y,p.z+across.z*sign*linkDeckWidth/2);uv.push(sign*.5+.5,t*length);
   }
   if(i<segments){const k=i*4;indices.push(k,k+4,k+1,k+1,k+4,k+5,k+2,k+3,k+6,k+3,k+7,k+6,k,k+2,k+4,k+2,k+6,k+4,k+1,k+5,k+3,k+3,k+5,k+7);}
  }
  indices.push(0,1,2,1,3,2);const k=segments*4;indices.push(k,k+2,k+1,k+1,k+2,k+3);
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();
  const deck=new T.Mesh(geo,wood);deck.name=`Inter-island bridge · ${link.id} · continuous deck`;deck.castShadow=true;deck.receiveShadow=true;deck.userData={from:link.from,to:link.to,width:linkDeckWidth};group.add(deck);
  for(let i=0;i<segments;i++){
   const t=i/segments,next=(i+1)/segments;
   if(i%2===0)structure.beam(stone,at(t,-.69,.012),at(t,.69,.012),.012);
   for(const side of [-1,1]){
    // Pale edging outlines the walkway and iron rails keep its silhouette light.
    structure.beam(paleStone,at(t,side*.74,-.06),at(next,side*.74,-.06),.085);
    structure.beam(iron,at(t,side*.73,.92),at(next,side*.73,.92),.033);
    structure.beam(gold,at(t,side*.73,.96),at(next,side*.73,.96),.017);
    structure.beam(iron,at(t,side*.73,.24),at(next,side*.73,.24),.022);
    // Two structural arches spring from sockets within the island cliff faces.
    const low=(u:number)=>-.2-1.3*(1-Math.sin(Math.PI*u));
    structure.beam(stone,at(t,side*.52,low(t)),at(next,side*.52,low(next)),.15);
   }
  }
  const posts=Math.ceil(length/.72);
  for(let i=0;i<=posts;i++){
   const t=i/posts,next=Math.min(1,(i+1)/posts);
   for(const side of [-1,1]){
    structure.beam(iron,at(t,side*.73,.04),at(t,side*.73,1.01),.036);
    structure.ball(gold,at(t,side*.73,1.045),[.057,.057,.057]);postCount++;
    if(i<posts){structure.beam(iron,at(t,side*.73,.27),at(next,side*.73,.82),.014);structure.beam(iron,at(t,side*.73,.82),at(next,side*.73,.27),.014);}
    if(i%3===0)structure.beam(paleStone,at(t,side*.52,-.2-1.3*(1-Math.sin(Math.PI*t))),at(t,side*.52,-.16),.05);
   }
  }
  // Matching brass lanterns anchor each bridge at its arrival and central arch.
  for(const t of [.07,.35,.65,.93])for(const side of [-1,1]){
   const {p,across}=frame(t),base=p.clone().addScaledVector(across,side*.87);
   structure.beam(iron,base.toArray(),base.clone().addScaledVector(up,1.56).toArray(),.043);
   structure.ball(gold,base.clone().addScaledVector(up,1.2).toArray(),[.085,.085,.085]);
   structure.box(light,base.clone().addScaledVector(up,1.67).toArray(),[.19,.29,.19]);
   structure.box(iron,base.clone().addScaledVector(up,1.5).toArray(),[.25,.045,.25]);
   structure.box(iron,base.clone().addScaledVector(up,1.84).toArray(),[.27,.06,.27]);
   structure.ball(gold,base.clone().addScaledVector(up,1.9).toArray(),[.04,.06,.04]);lampCount++;
  }
 }
 group.add(structure.flush('Connecting bridges · stone arches, iron balustrades and lanterns'));
 function setNight(n:number){light.emissiveIntensity=.1+T.MathUtils.clamp(n,0,1)*2.1;}
 setNight(0);return {group,setNight,counts:{bridges:linkPaths.length,lamps:lampCount,posts:postCount}};
}
