import * as T from 'three';
import {Batch,mats,toon} from './materials.ts';
import {edge,height,random,inside,pathX,waterAt,streamX,islandRadiusX,islandRadiusZ,gardenPathRadius,streamEndZ,eastOutletX,westSpring,westStreamAt} from './layout.ts';
export function createIsland(){
 const group=new T.Group();group.name='Island · expanded cherry gardens';const rand=random(31),batch=new Batch();
 const seg=160,rings=48,p:number[]=[],indices:number[]=[],colors:number[]=[];
 const meadow=new T.Color('#91b46b'),sage=new T.Color('#b0bc7c'),fern=new T.Color('#759a61');
 for(let j=0;j<=rings;j++)for(let i=0;i<=seg;i++){const a=i/seg*Math.PI*2,r=j/rings;const x=Math.cos(a)*islandRadiusX*r*edge(a),z=Math.sin(a)*islandRadiusZ*r*edge(a);p.push(x,waterAt(x,z)?-.12:height(x,z),z);const variation=.5+.5*Math.sin(x*.55+Math.cos(z*.7))*Math.cos(z*.65);const c=meadow.clone().lerp(fern,variation*.4).lerp(sage,Math.max(0,r-.7)*1.6);c.toArray(colors,colors.length);}
 for(let j=0;j<rings;j++)for(let i=0;i<seg;i++){const a=j*(seg+1)+i,b=a+seg+1;indices.push(a,a+1,b,b,a+1,b+1);}
 const top=new T.BufferGeometry();top.setAttribute('position',new T.Float32BufferAttribute(p,3));top.setAttribute('color',new T.Float32BufferAttribute(colors,3));top.setIndex(indices);top.computeVertexNormals();const turf=new T.Mesh(top,toon('#ffffff',true));turf.receiveShadow=true;group.add(turf);
 // Broad rock shelves step inward beneath the soil. Recessed seams and coherent
 // vertical faults split the strata into massed stone, rather than a fringe of spikes.
 const rp:number[]=[],ri:number[]=[],rc:number[]=[];const n=160;
 const strata=[
  {f:1,y:0,c:'#a7a888'},{f:1.006,y:-.24,c:'#c2b29b'},
  {f:.997,y:-.65,c:'#ac9e8d'},{f:.957,y:-.76,c:'#797c75'},
  {f:.976,y:-1.24,c:'#aaa195'},{f:.936,y:-1.58,c:'#93938c'},
  {f:.872,y:-1.7,c:'#636f75'},{f:.891,y:-2.28,c:'#929a9b'},
  {f:.822,y:-2.7,c:'#7d8b92'},{f:.747,y:-2.84,c:'#526b78'},
  {f:.765,y:-3.38,c:'#7d8b95'},{f:.631,y:-3.88,c:'#637d8b'},
  {f:.535,y:-4.02,c:'#456574'},{f:.543,y:-4.48,c:'#69828d'},
  {f:.319,y:-4.97,c:'#536f80'},{f:.234,y:-5.08,c:'#3f6074'},
  {f:.061,y:-5.42,c:'#547386'},{f:.012,y:-5.47,c:'#405e73'}
 ];
 const levels=strata.length,faultAngles=[.18,.79,1.37,1.91,2.42,2.94,3.26,3.81,4.34,4.83,5.51,5.93],mossTint=new T.Color('#74895f');
 for(let j=0;j<levels;j++)for(let i=0;i<=n;i++){
  const a=(i===n?0:i/n*Math.PI*2),layer=strata[j];let fault=0;
  for(let k=0;k<faultAngles.length;k++){const d=Math.atan2(Math.sin(a-faultAngles[k]-.018*Math.sin(j*.4+k)),Math.cos(a-faultAngles[k]-.018*Math.sin(j*.4+k)));fault=Math.max(fault,Math.exp(-d*d/.0014));}
  const fracture=j===0?0:fault*.015;
  const f=layer.f-fracture+(j===0?0:.006*Math.sin(a*17+j*.4));
  const x=Math.cos(a)*islandRadiusX*edge(a)*f,z=Math.sin(a)*islandRadiusZ*edge(a)*f;
  const undulation=.09*Math.sin(a*3+.2)+.055*Math.cos(a*7+j*.08)+.04*Math.sin(a*19+j*.3);
  const y=j===0?(waterAt(x,z)?.44:height(x,z)-.03):layer.y+undulation;rp.push(x,y,z);
  const c=new T.Color(layer.c).multiplyScalar((.96+.055*Math.sin(a*23+j*.6))*(1-fault*(j===0?.05:.26)));
  if(j<3)c.lerp(mossTint,(j===0?.4:j===1?.21:.09)*(.65+.35*Math.sin(a*5+.7)));
  c.toArray(rc,rc.length);
 }
 for(let j=0;j<levels-1;j++)for(let i=0;i<n;i++){const a=j*(n+1)+i,b=a+n+1;ri.push(a,a+1,b,b,a+1,b+1);}
 const bottom=rp.length/3;rp.push(0,-5.5,0);new T.Color('#405e73').toArray(rc,rc.length);for(let i=0;i<n;i++)ri.push((levels-1)*(n+1)+i,(levels-1)*(n+1)+i+1,bottom);
 const rg=new T.BufferGeometry();rg.setAttribute('position',new T.Float32BufferAttribute(rp,3));rg.setAttribute('color',new T.Float32BufferAttribute(rc,3));rg.setIndex(ri);rg.computeVertexNormals();const rm=toon('#ffffff',true);const rocks=new T.Mesh(rg,rm);rocks.castShadow=true;rocks.receiveShadow=true;group.add(rocks);
 const shard=new T.ConeGeometry(1,1,5),clump=new T.SphereGeometry(1,8,5),rockPiece=new T.DodecahedronGeometry(1,0),rockRand=random(3107);
 const rockVertices=rockPiece.attributes.position;
 for(let i=0;i<rockVertices.count;i++){const x=rockVertices.getX(i),y=rockVertices.getY(i),z=rockVertices.getZ(i),warp=1+.105*Math.sin(x*7+y*9+z*11);rockVertices.setXYZ(i,x*warp,y*(.93+.08*Math.cos(x*5+z*4)),z*warp);}
 rockPiece.computeVertexNormals();
 const blocks=[{y:-.96,f:.985,count:19},{y:-2.02,f:.91,count:17},{y:-3.14,f:.78,count:13},{y:-4.27,f:.56,count:9}];
 for(let layer=0;layer<blocks.length;layer++)for(let i=0;i<blocks[layer].count;i++){
  const row=blocks[layer],a=(i+.23*layer+rockRand()*.27)/row.count*Math.PI*2,f=row.f+(rockRand()-.5)*.025,x=Math.cos(a)*islandRadiusX*edge(a)*f,z=Math.sin(a)*islandRadiusZ*edge(a)*f;
  const g=rockPiece.clone(),colorValues:number[]=[],base=new T.Color(['#b2a697','#9b9e99','#8b969c','#6f8794'][layer]);
  for(let k=0;k<g.attributes.position.count;k++){const py=g.attributes.position.getY(k);base.clone().multiplyScalar(.84+.18*(py*.5+.5)).toArray(colorValues,colorValues.length);}
  g.setAttribute('color',new T.Float32BufferAttribute(colorValues,3));
  batch.add(g,rm,[x,row.y+(rockRand()-.5)*.2,z],[.7+rockRand()*1.05,.23+rockRand()*.37,.36+rockRand()*.35],[(rockRand()-.5)*.17,Math.PI/2-a,(rockRand()-.5)*.13]);g.dispose();
 }
 // A few isolated broken fragments retain the floating-island silhouette.
 for(let i=0;i<9;i++){const a=i/9*Math.PI*2+.3,f=.68+rockRand()*.09,x=Math.cos(a)*islandRadiusX*f,z=Math.sin(a)*islandRadiusZ*f;batch.add(shard,mats.rock,[x,-3.1-rockRand()*.4,z],[.25+rockRand()*.22,.5+rockRand()*.7,.3+rockRand()*.2],[Math.PI,.4+a,.14]);}
 for(let i=0;i<48;i++){const a=i/48*Math.PI*2,r=.94+rand()*.025,x=Math.cos(a)*islandRadiusX*r,z=Math.sin(a)*islandRadiusZ*r;if(!waterAt(x,z))batch.add(clump,mats.moss,[x,height(x,z)-.04,z],[.5,.15,.45]);}
 // Overhanging moss, hanging ivy and blossom vines break up the cliff silhouette.
 for(let i=0;i<125;i++){const a=rand()*Math.PI*2,x=Math.cos(a)*islandRadiusX*edge(a),z=Math.sin(a)*islandRadiusZ*edge(a),h=height(x,z),length=.4+rand()*1.7;if(waterAt(x,z))continue;batch.beam(mats.moss,[x,h,z],[x*.99,h-length,z*.99],.018);for(let k=0;k<6;k++){const y=h-k*length/6;batch.add(clump,k%4===0?mats.pink:mats.leaf,[x+Math.sin(k)*.09,y,z],[.13,.08,.12]);}}
 // Low meadow mounds and weathered rim stones give the new garden a planted edge.
 for(let i=0;i<180;i++){const a=rand()*Math.PI*2,r=.91+rand()*.06,x=Math.cos(a)*islandRadiusX*r*edge(a),z=Math.sin(a)*islandRadiusZ*r*edge(a);if(waterAt(x,z))continue;batch.add(clump,i%5===0?mats.stone:i%3===0?mats.leaf:mats.moss,[x,height(x,z)+.025,z],[.16+rand()*.32,.08+rand()*.1,.14+rand()*.24],[0,a,0]);}
 // Raised slate pavers follow both flower paths; individual stones retain visible gaps.
 const stones=(x:number,z:number,rot:number)=>{if(!inside(x,z,.1)||waterAt(x,z))return;batch.box(mats.stone,[x,height(x,z)+.065,z],[.7,.09,.27],[0,rot,0]);};
 for(let z=-3.6;z<islandRadiusZ*.94;z+=.32)stones(pathX(z),z,Math.atan(.945*Math.cos(z*.63)));
 for(let x=-islandRadiusX*.86;x<islandRadiusX*.86;x+=.34)stones(x,.8+Math.sin(x*.55)*.6,Math.PI/2-Math.atan(.33*Math.cos(x*.55)));
 for(let a=.08;a<Math.PI-.08;a+=.035){const x=Math.cos(a)*islandRadiusX*gardenPathRadius,z=Math.sin(a)*islandRadiusZ*gardenPathRadius;stones(x,z,Math.atan2(-Math.sin(a)*islandRadiusX,Math.cos(a)*islandRadiusZ));}
 // Stone riverbanks provide readable separation between flower carpet and moving water.
 for(let z=-1.6;z<streamEndZ-.2;z+=.31)for(const side of [-1,1]){const x=streamX(z)+side*.57;if(inside(x,z,.015))batch.add(clump,mats.stone,[x,.55,z],[.15,.12,.2]);}
 for(let x=5.8;x<eastOutletX-.2;x+=.3)for(const z of [-3.86,-2.94])batch.add(clump,mats.stone,[x,.56,z],[.18,.12,.13]);
 for(let i=0;i<90;i++){const a=i/90*Math.PI*2;const x=2+Math.cos(a)*3.74,z=-2.8+Math.sin(a)*2.08;if(!inside(x,z,.08))continue;batch.ball(mats.stone,[x,.59,z],[.16,.13,.16]);}
 for(let i=0;i<36;i++){const a=i/36*Math.PI*2,x=westSpring.x+Math.cos(a)*1.38,z=westSpring.z+Math.sin(a)*.75;if(!inside(x,z,.035)||westStreamAt(x,z))continue;batch.add(clump,mats.stone,[x,.56,z],[.13,.1,.13]);}
 shard.dispose();clump.dispose();rockPiece.dispose();
 group.add(batch.flush('Cliffs, hanging gardens and slate paths'));
 return group;
}
