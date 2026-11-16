import * as T from 'three';
import {Batch,toon} from './materials.ts';
import {height} from './layout.ts';

export const bridgeDeckWidth=1.42;
export const bridgeAnchors={
 fuji:new T.Vector3(10.7,height(10.7,5)+.11,5),
 shanghai:new T.Vector3(25.3,.68,5),
};
// The U is drawn in plan: both landings face into the gap and the curved
// promenade bows out toward the viewer, leaving the space between islands open.
const plan=[[10.7,5],[12,9.8],[12,14.1],[14.5,17.6],[18,18.8],[21.5,17.6],[24,14.1],[24,9.8],[25.3,5]];
export const bridgePath=new T.CatmullRomCurve3(plan.map(([x,z],i)=>{
 const t=i/(plan.length-1),y=T.MathUtils.lerp(bridgeAnchors.fuji.y,bridgeAnchors.shanghai.y,t)-.83*Math.sin(Math.PI*t);
 return new T.Vector3(x,y,z);
}),false,'centripetal');
export const bridgeExtent={min:[9.6,-1.3,4.2],max:[26.4,3.2,20]} as const;

/** A walkable bamboo U, with rounded slats, double rails, rope knots and lamps. */
export function createBambooBridge(){
 const group=new T.Group();group.name='U-shaped bamboo skybridge · Fuji to Pudong';
 group.userData={kind:'u-bamboo-bridge',deckWidth:bridgeDeckWidth,pathLength:bridgePath.getLength()};
 const deck=new Batch(),structure=new Batch();
 const bamboo=toon('#b7aa68'),fresh=toon('#a7a66d'),gold=toon('#c9b77e');
 const nodes=toon('#8c8e50'),cut=toon('#d9c18a'),rope=toon('#715b43');
 const metal=toon('#69594c');
 const paper=new T.MeshStandardMaterial({color:'#f4d39a',emissive:'#ffba63',emissiveIntensity:.13,roughness:.75});
 const deckLength=bridgePath.getLength(),slatCount=Math.ceil(deckLength/.155),railSegments=Math.ceil(deckLength/.32),postCount=Math.ceil(deckLength/1.12);
 const up=new T.Vector3(0,1,0);
 const frame=(t:number)=>{
  const p=bridgePath.getPointAt(T.MathUtils.clamp(t,0,1)),tangent=bridgePath.getTangentAt(T.MathUtils.clamp(t,0,1));
  const across=new T.Vector3(tangent.z,0,-tangent.x).normalize();
  return {p,tangent,across};
 };
 const at=(t:number,side:number,lift:number)=>{
  const {p,across}=frame(t);return p.addScaledVector(across,side).addScaledVector(up,lift).toArray();
 };
 const beam=(batch:Batch,mat:T.Material,a:number[],b:number[],r:number)=>batch.beam(mat,a,b,r);
 const band=(batch:Batch,p:T.Vector3,axis:T.Vector3,r=.077,len=.045)=>{
  beam(batch,nodes,p.clone().addScaledVector(axis,-len/2).toArray(),p.clone().addScaledVector(axis,len/2).toArray(),r);
 };

 // Individual crosswise culms make a genuinely open, rounded bamboo deck.
 // Slight alternating colour and staggered nodes prevent a uniform wood texture.
 for(let i=0;i<=slatCount;i++){
  const t=i/slatCount,{p,across}=frame(t),a=p.clone().addScaledVector(across,-bridgeDeckWidth/2),b=p.clone().addScaledVector(across,bridgeDeckWidth/2);
  const material=i%7===0?fresh:i%3===0?gold:bamboo;
  beam(deck,material,a.toArray(),b.toArray(),.068);
  for(const s of [-.61,.61,(i%4-1.5)*.12])band(deck,p.clone().addScaledVector(across,s),across);
  beam(deck,cut,a.clone().addScaledVector(across,-.008).toArray(),a.clone().addScaledVector(across,.004).toArray(),.057);
  beam(deck,cut,b.clone().addScaledVector(across,-.004).toArray(),b.clone().addScaledVector(across,.008).toArray(),.057);
 }
 const deckGroup=deck.flush('Bamboo deck · transverse rounded slats and staggered nodes');
 deckGroup.userData={kind:'bamboo-deck',slats:slatCount+1,width:bridgeDeckWidth};
 group.add(deckGroup);

 // The lower laminated bamboo chords carry the walkway around the broad U.
 // A second chord and crossed webs give the bridge a readable structural depth.
 for(let i=0;i<railSegments;i++){
  const a=i/railSegments,b=(i+1)/railSegments;
  for(const side of [-1,1]){
   beam(structure,bamboo,at(a,side*.61,-.18),at(b,side*.61,-.18),.065);
   beam(structure,fresh,at(a,side*.56,-.55),at(b,side*.56,-.55),.045);
   beam(structure,gold,at(a,side*.74,.97),at(b,side*.74,.97),.057);
   beam(structure,bamboo,at(a,side*.74,.45),at(b,side*.74,.45),.037);
  }
 }
 for(let i=0;i<=postCount;i++){
  const t=i/postCount,{p,across,tangent}=frame(t),next=Math.min(1,(i+1)/postCount);
  beam(structure,bamboo,at(t,-.82,-.12),at(t,.82,-.12),.055);
  for(const side of [-1,1]){
   beam(structure,bamboo,at(t,side*.74,-.21),at(t,side*.74,1.05),.055);
   for(const y of [.12,.45,.95])band(structure,p.clone().addScaledVector(across,side*.74).addScaledVector(up,y),up,.066,.043);
   if(i<postCount){
    beam(structure,fresh,at(t,side*.56,-.55),at(next,side*.61,-.18),.027);
    beam(structure,fresh,at(t,side*.61,-.18),at(next,side*.56,-.55),.027);
    // Fine diagonal rope mesh keeps the railing open without a bare drop.
    beam(structure,rope,at(t,side*.74,.12),at(next,side*.74,.82),.012);
    beam(structure,rope,at(t,side*.74,.82),at(next,side*.74,.12),.012);
   }
   // Three wrapped lashings at every joint, plus the two loose crossed ends.
   for(const y of [-.1,.45,.95]){
    for(const dy of [-.028,.028]){
     const center=p.clone().addScaledVector(across,side*.74).addScaledVector(up,y+dy);
     const corners=[[-1,-1],[1,-1],[1,1],[-1,1]];
     for(let c=0;c<4;c++){
      const a=corners[c],b=corners[(c+1)%4];
      beam(structure,rope,center.clone().addScaledVector(across,a[0]*.067).addScaledVector(tangent,a[1]*.067).toArray(),center.clone().addScaledVector(across,b[0]*.067).addScaledVector(tangent,b[1]*.067).toArray(),.01);
     }
    }
   }
  }
 }

 // Longer anchored culms mark both arrivals; they do not create a third island.
 for(const t of [0,1])for(const side of [-1,1]){
  const {p,across}=frame(t),base=p.clone().addScaledVector(across,side*.84);
  beam(structure,bamboo,base.clone().addScaledVector(up,-.6).toArray(),base.clone().addScaledVector(up,1.55).toArray(),.088);
  for(const y of [-.22,.35,.92,1.45])band(structure,base.clone().addScaledVector(up,y),up,.099,.07);
  beam(structure,rope,base.clone().addScaledVector(up,.06).addScaledVector(across,-.11).toArray(),base.clone().addScaledVector(up,.23).addScaledVector(across,.11).toArray(),.025);
 }

 const lampTimes=[.035,.2,.36,.5,.64,.8,.965];
 // Warm paper cylinders hang from little bent bamboo brackets. Every lamp has
// ribs and capped ends, so it reads as an object in daylight as well as at night.
 const cylinder=new T.CylinderGeometry(1,1,1,12),cap=new T.CylinderGeometry(1,1,1,10);
 for(let i=0;i<lampTimes.length;i++)for(const side of [-1,1]){
  const t=lampTimes[i],{p,across}=frame(t),post=p.clone().addScaledVector(across,side*.79),center=p.clone().addScaledVector(across,side*1.01).addScaledVector(up,1.36);
  beam(structure,bamboo,post.clone().addScaledVector(up,.05).toArray(),post.clone().addScaledVector(up,1.95).toArray(),.041);
  beam(structure,bamboo,post.clone().addScaledVector(up,1.9).toArray(),center.clone().setY(p.y+1.77).toArray(),.034);
  beam(structure,rope,center.clone().setY(p.y+1.78).toArray(),center.clone().addScaledVector(up,.25).toArray(),.014);
  structure.add(cylinder,paper,center.toArray(),[.13,.36,.13]);
  for(const y of [-.2,.2])structure.add(cap,metal,center.clone().addScaledVector(up,y).toArray(),[.145,.045,.145]);
  for(let rib=0;rib<6;rib++){
   const a=rib/6*Math.PI*2,offset=new T.Vector3(Math.cos(a)*.134,0,Math.sin(a)*.134);
   beam(structure,cut,center.clone().add(offset).addScaledVector(up,-.18).toArray(),center.clone().add(offset).addScaledVector(up,.18).toArray(),.009);
  }
  beam(structure,rope,center.clone().addScaledVector(up,-.23).toArray(),center.clone().addScaledVector(up,-.39).toArray(),.012);
 }
 cylinder.dispose();cap.dispose();
 group.add(structure.flush('Bamboo structure · double rails, cross bracing, rope lashings and paper lanterns'));
 function setNight(n:number){paper.emissiveIntensity=.13+T.MathUtils.clamp(n,0,1)*2.9;}
 setNight(0);
 return {group,setNight,counts:{deckSlats:slatCount+1,posts:(postCount+1)*2,lanterns:lampTimes.length*2}};
}
