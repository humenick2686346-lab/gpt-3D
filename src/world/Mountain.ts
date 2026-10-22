import * as T from 'three';
import {toon} from './materials.ts';

export function createMountain(){
 const group=new T.Group();
 group.name='Fuji · layered volcanic rock, broad snow crown and crater';
 group.position.set(-.6,.45,-5.65);
 const segments=192,levels=96,summit=5.16,rimRadius=.48;
 const positions:number[]=[],colors:number[]=[],indices:number[]=[];
 const stone=new T.Color('#687c92'),ridgeStone=new T.Color('#a0aaa9');
 const basalt=new T.Color('#535e70'),warmStone=new T.Color('#9c968b');
 const oldSnow=new T.Color('#becfdf'),freshSnow=new T.Color('#f3f8fb');
 const color=new T.Color(),snowColor=new T.Color();
 const smooth=(a:number,b:number,v:number)=>{const t=T.MathUtils.clamp((v-a)/(b-a),0,1);return t*t*(3-2*t);};
 const layers=[.065,.13,.215,.31,.425,.51];
 function profile(a:number,t:number){
  const angle=a+.043*Math.sin(a*3+t*2.8)+.024*Math.cos(a*5-t*3.1);
  const main=.8*Math.sin(angle*8+.7)+.44*Math.sin(angle*15-.8)+.23*Math.sin(angle*27+1.1);
  const envelope=Math.sin(Math.PI*t)**.7;
  const ridge=(main*.078+Math.sin(angle*5-.4)*.027)*envelope;
  const erosion=Math.sin(angle*43+t*7)*.013*envelope;
  // Irregular lava beds form shallow ledges in the actual silhouette. Their
  // height varies around the mountain, avoiding perfectly concentric rings.
  const bed=t+.009*Math.sin(a*4+.5)+.004*Math.sin(a*11-t*2);
  let ledge=0;
  for(const layer of layers)ledge+=.065*Math.exp(-(((bed-layer)/.009)**2))*(1-.5*t)*(.7+.3*Math.sin(a*7+layer*21));
  const skirt=(1-smooth(.015,.22,t))*(.09+.07*Math.sin(a*9+.8)+.035*Math.sin(a*17));
  const radius=(rimRadius+3.6*Math.pow(1-t,1.48))*(1+ridge+erosion)+ledge+skirt;
  const rim=.05*Math.sin(a*5+.4)+.025*Math.cos(a*9);
  return {
   x:Math.cos(a)*radius+.12*Math.sin(t*2.4),
   y:t*summit+rim*(.2+.8*t)-.08*(1-t),
   z:Math.sin(a)*radius*.87+.09*t*t,
   main,angle,bed,
  };
 }
 for(let j=0;j<=levels;j++)for(let i=0;i<=segments;i++){
  const t=j/levels,a=i/segments*Math.PI*2,p=profile(a,t);
  positions.push(p.x,p.y,p.z);
  // Snow follows sheltered gullies while broad exposed spurs reveal basalt.
  const gully=Math.max(0,-Math.sin(p.angle*8+.7));
  const tongue=Math.pow(Math.max(0,Math.sin(p.angle*17+1.4)),8);
  const snowline=.71-.1*gully-.057*tongue+.025*Math.sin(a*5-.8);
  const snow=smooth(snowline-.017,snowline+.017,t);
  const crest=T.MathUtils.clamp(.44+p.main*.3,0,1);
  color.copy(stone).lerp(ridgeStone,crest*.66+.11*t);
  // Mineral bands and dark seams follow the same warped beds as the geometry.
  // Broad warm layers separate visually from the cooler eroded channels.
  const mineral=.5+.5*Math.sin(p.bed*78.+Math.sin(a*3)*.35);
  color.lerp(warmStone,(1-smooth(.3,.62,t))*mineral*.32);
  let seam=0;
  for(const layer of layers)seam=Math.max(seam,Math.exp(-(((p.bed-layer+.011)/.007)**2)));
  color.lerp(basalt,seam*.36*(1-snow));
  color.lerp(basalt,(1-crest)*.19*(1-snow));
  snowColor.copy(oldSnow).lerp(freshSnow,smooth(.59,.91,t)*.8+crest*.2);
  color.lerp(snowColor,snow);
  const scree=Math.sin(a*53+t*49)*Math.sin(a*29-t*67)*.035*(1-snow);
  color.multiplyScalar(.95+crest*.09+scree);
  color.toArray(colors,colors.length);
 }
 for(let j=0;j<levels;j++)for(let i=0;i<segments;i++){
  const a=j*(segments+1)+i,b=a+segments+1;
  indices.push(a,b,a+1,b,b+1,a+1);
 }
 // The wider summit retains Fuji's truncated volcanic profile and a real
 // recessed inner wall, readable from close and overhead camera presets.
 const craterRings=8;
 for(let j=1;j<=craterRings;j++)for(let i=0;i<=segments;i++){
  const a=i/segments*Math.PI*2,t=j/craterRings,r=rimRadius*(1-t);
  const rim=.05*Math.sin(a*5+.4)+.025*Math.cos(a*9),depth=.37*smooth(0,.86,t);
  positions.push(Math.cos(a)*r+.12*Math.sin(2.4),summit+rim*(1-t)-depth,Math.sin(a)*r*.87+.09);
  color.copy(oldSnow).lerp(freshSnow,(1-t)*.76).multiplyScalar(1-t*.12);
  color.toArray(colors,colors.length);
 }
 for(let j=levels;j<levels+craterRings;j++)for(let i=0;i<segments;i++){
  const a=j*(segments+1)+i,b=a+segments+1;
  indices.push(a,b,a+1,b,b+1,a+1);
 }
 const craterEnd=positions.length/3;
 // Angular outcrops emerge from the flared rocky apron. They are merged into
 // the mountain's geometry, preserving one draw call for the whole massif.
 for(let i=0;i<28;i++){
  const a=i/28*Math.PI*2+.045*Math.sin(i*7),r=3.62+.24*Math.sin(i*13);
  const rock=new T.DodecahedronGeometry(1,0);
  const scaleX=.26+.11*(.5+.5*Math.sin(i*11));
  rock.scale(scaleX,.26+.2*(.5+.5*Math.cos(i*9)),.22+.1*(.5+.5*Math.sin(i*5)));
  rock.rotateY(a+.7*Math.sin(i*4));rock.rotateZ(.22*Math.sin(i*3));
  rock.translate(Math.cos(a)*r,.12+.1*Math.cos(i*7),Math.sin(a)*r*.87);
  const vertices=rock.getAttribute('position'),base=positions.length/3;
  for(let k=0;k<vertices.count;k++){
   positions.push(vertices.getX(k),vertices.getY(k),vertices.getZ(k));
   color.copy(basalt).lerp(warmStone,.33+.17*Math.sin(i*5+Math.floor(k/3)*1.7));
   color.toArray(colors,colors.length);indices.push(base+k);
  }
  rock.dispose();
 }
 const geometry=new T.BufferGeometry();
 geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));
 geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));
 geometry.setIndex(indices);geometry.computeVertexNormals();
 const normals=geometry.getAttribute('normal'),normal=new T.Vector3(),otherNormal=new T.Vector3();
 for(let j=0;j<=levels+craterRings;j++){
  const a=j*(segments+1),b=a+segments;
  normal.fromBufferAttribute(normals,a).add(otherNormal.fromBufferAttribute(normals,b)).normalize();
  normals.setXYZ(a,normal.x,normal.y,normal.z);normals.setXYZ(b,normal.x,normal.y,normal.z);
 }
 for(let i=(levels+craterRings)*(segments+1);i<craterEnd;i++)normals.setXYZ(i,0,1,0);
 geometry.computeBoundingSphere();geometry.computeBoundingBox();
 const mesh=new T.Mesh(geometry,toon('#ffffff',true));
 mesh.name='Stratified volcanic massif, rocky apron and recessed snow crown';
 mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);
 return group;
}
