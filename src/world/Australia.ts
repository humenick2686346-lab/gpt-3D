import * as T from 'three';
import {Batch,toon} from './materials.ts';
import {random} from './layout.ts';

export const australiaPosition={x:54,y:0,z:-33};
export const australiaExtent={radiusX:13.1,radiusZ:11.1,height:10.7,baseDepth:5.7};
const rx=12.4,rz=10.4,ground=.58;
const shoreline=(a:number)=>1+.02*Math.sin(a*5+.4)+.014*Math.cos(a*9);

/** A procedural Sydney harbour miniature; both connecting promenades stay on dry land. */
export function createAustraliaIsland(){
 const group=new T.Group();group.name='Australia · Sydney harbour island';group.position.set(australiaPosition.x,0,australiaPosition.z);
 const batch=new Batch(),rng=random(731052);
 const sandstone=toon('#cab18e'),paving=toon('#ded0ac'),stone=toon('#acaa9a'),grass=toon('#86a578'),leaf=toon('#537d6c'),trunk=toon('#8f7963');
 const iron=toon('#465c60'),roof=toon('#6d8b94'),stripe=toon('#ede3c5'),road=toon('#627274');
 const glass=new T.MeshStandardMaterial({color:'#5c8799',metalness:.28,roughness:.37,emissive:'#9cdaf2',emissiveIntensity:0});
 const windows=new T.MeshStandardMaterial({color:'#cbdad7',roughness:.5,emissive:'#ffe0a1',emissiveIntensity:0});
 const light=new T.MeshStandardMaterial({color:'#ffe1a8',roughness:.6,emissive:'#ffbd68',emissiveIntensity:.1});
 const brass=new T.MeshStandardMaterial({color:'#d4b271',metalness:.35,roughness:.48,emissive:'#efb65c',emissiveIntensity:0});
 const ceramic=new T.MeshStandardMaterial({color:'#f1ead5',roughness:.58,metalness:.04,side:T.DoubleSide});
 ceramic.onBeforeCompile=shader=>{
  shader.vertexShader='varying vec2 vRoofUV;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvRoofUV=uv;');
  shader.fragmentShader='varying vec2 vRoofUV;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   vec2 tile=fract(vRoofUV*vec2(26.,34.));float joint=max(1.-smoothstep(.025,.07,tile.x),1.-smoothstep(.025,.07,tile.y));diffuseColor.rgb*=1.-joint*.055;
  `);
 };ceramic.customProgramCacheKey=()=> 'sydney-ceramic-roof-v1';
 const rib=toon('#e1d4b7');
 const add=(g:T.BufferGeometry,m:T.Material,p=[0,0,0],s=[1,1,1],r=[0,0,0],target=batch)=>{target.add(g,m,p,s,r);g.dispose();};
 const cylinder=(m:T.Material,p:number[],rt:number,rb:number,h:number,n=20,target=batch)=>add(new T.CylinderGeometry(rt,rb,h,n),m,p,[1,1,1],[0,0,0],target);

 const layers=[
  [.53,1,'#b4bca0'],[.16,1.005,'#d0bb96'],[-.37,.99,'#b9a782'],[-.57,.95,'#897e68'],[-1.13,.97,'#b9a887'],[-1.55,.92,'#aa9b7f'],[-1.78,.87,'#7c8274'],[-2.34,.89,'#abac92'],[-2.82,.79,'#929f8a'],[-3.04,.73,'#667e79'],[-3.57,.74,'#93a298'],[-4.03,.59,'#7c928d'],[-4.2,.51,'#546f72'],[-4.68,.48,'#81988c'],[-5.1,.24,'#63847e'],[-5.6,0,'#486c6e']
 ] as const;
 const positions:number[]=[],colors:number[]=[],indices:number[]=[],n=120;
 for(let j=0;j<layers.length;j++)for(let i=0;i<=n;i++){
  const a=i/n*Math.PI*2,[y,r,c]=layers[j],fault=.012*Math.max(0,Math.sin(a*17+j*.09))**8;
  positions.push(Math.cos(a)*rx*shoreline(a)*(r-fault),y+(j===0||j===layers.length-1?0:.04*Math.sin(a*9+j*.23)),Math.sin(a)*rz*shoreline(a)*(r-fault));
  new T.Color(c).multiplyScalar(.97+.04*Math.sin(a*23+j)).toArray(colors,colors.length);
  if(j<layers.length-1&&i<n){const k=j*(n+1)+i;indices.push(k,k+1,k+n+1,k+1,k+n+2,k+n+1);}
 }
 const rockGeo=new T.BufferGeometry();rockGeo.setAttribute('position',new T.Float32BufferAttribute(positions,3));rockGeo.setAttribute('color',new T.Float32BufferAttribute(colors,3));rockGeo.setIndex(indices);rockGeo.computeVertexNormals();
 const rock=new T.Mesh(rockGeo,toon('#ffffff',true));rock.name='Australia · layered coastal sandstone';rock.castShadow=true;rock.receiveShadow=true;group.add(rock);
 const outline=new T.Shape();for(let i=0;i<=120;i++){const a=i/120*Math.PI*2,x=Math.cos(a)*rx*shoreline(a),z=Math.sin(a)*rz*shoreline(a);if(!i)outline.moveTo(x,-z);else outline.lineTo(x,-z);}
 const top=new T.ShapeGeometry(outline);top.rotateX(-Math.PI/2);add(top,grass,[0,.55,0]);
 const plaza=new T.CircleGeometry(1,96);plaza.rotateX(-Math.PI/2);add(plaza,paving,[0,ground,0],[rx*.92,1,rz*.92]);
 batch.box(paving,[-10,.625,0],[4.3,.09,1.8]);batch.box(paving,[-6,.625,7.85],[1.7,.09,2.5]);
 batch.box(stone,[-9,.62,-1.5],[1.5,.07,6.5]);

 // The harbour crescent is bounded by two walkable quays. Its moving highlights
 // and ferry follow the same waterline, leaving the western bridge arrival dry.
 const waterUniforms={time:{value:0},night:{value:0}},waterP:number[]=[],waterUV:number[]=[],waterI:number[]=[];
 const waterAt=(t:number,r:number)=>{const a=.11+t*(Math.PI-.22);return new T.Vector3(Math.cos(a)*rx*r,.625,.2+Math.sin(a)*rz*r);};
 for(let i=0;i<=96;i++)for(let bank=0;bank<2;bank++){
  waterAt(i/96,bank===0?.57:.86).toArray(waterP,waterP.length);waterUV.push(i/96,bank);
  if(i<96&&bank===0){const k=i*2;waterI.push(k,k+1,k+2,k+1,k+3,k+2);}
 }
 const waterGeo=new T.BufferGeometry();waterGeo.setAttribute('position',new T.Float32BufferAttribute(waterP,3));waterGeo.setAttribute('uv',new T.Float32BufferAttribute(waterUV,2));waterGeo.setIndex(waterI);waterGeo.computeVertexNormals();
 const waterMat=new T.ShaderMaterial({uniforms:waterUniforms,side:T.DoubleSide,vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`uniform float time,night;varying vec2 vUv;void main(){float wave=sin(vUv.x*140.-time*2.6+sin(vUv.y*18.+time*.5));float swell=sin(vUv.y*33.+vUv.x*64.-time*1.7);vec3 col=mix(vec3(.07,.36,.46),vec3(.24,.62,.64),vUv.y*.5+.2);col+=pow(max(0.,wave*swell),18.)*vec3(.32,.4,.35);col=mix(col,col*.34+vec3(.015,.06,.09),night*.85);gl_FragColor=vec4(col,1.);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>}`});
 const water=new T.Mesh(waterGeo,waterMat);water.name='Australia · moving Sydney harbour';group.add(water);
 for(const r of [.57,.86])for(let i=0;i<96;i++){const a=waterAt(i/96,r),b=waterAt((i+1)/96,r);a.y=b.y=.72;batch.beam(sandstone,a.toArray(),b.toArray(),.09);}

 // Two auditorium groups of curved ceramic shells rise from a sandstone podium.
 // A tapered vault opens into a real glazed arch; no flat cutout is used.
 const opera=new Batch();
 for(let step=0;step<4;step++)opera.box(sandstone,[2.7,.68+step*.11,.7],[7.8-step*.28,.14,7.9-step*.27]);
 const shellPoint=(u:number,t:number,w:number,len:number,h:number)=>new T.Vector3(u*w*Math.pow(Math.sin(t*Math.PI*.84),.7),h*Math.sin(t*Math.PI*.5)*Math.pow(Math.max(0,1-Math.abs(u)),.72),len*(t-.5)+h*.14*(1-Math.abs(u))*t*t);
 function shell(x:number,z:number,w:number,len:number,h:number){
  const p:number[]=[],uv:number[]=[],ix:number[]=[],nu=28,nt=26;
  for(let i=0;i<=nt;i++)for(let j=0;j<=nu;j++){shellPoint(j/nu*2-1,i/nt,w,len,h).toArray(p,p.length);uv.push(j/nu,i/nt);if(i<nt&&j<nu){const k=i*(nu+1)+j;ix.push(k,k+nu+1,k+1,k+1,k+nu+1,k+nu+2);}}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();add(g,ceramic,[x,1.22,z],[1,1,1],[0,0,0],opera);
  for(const u of [-.82,-.55,-.28,0,.28,.55,.82])for(let i=0;i<20;i++){const a=shellPoint(u,i/20,w,len,h).add(new T.Vector3(x,1.23,z)),b=shellPoint(u,(i+1)/20,w,len,h).add(new T.Vector3(x,1.23,z));opera.beam(rib,a.toArray(),b.toArray(),.016);}
  const face=new T.Shape(),left=shellPoint(-1,1,w,len,h);face.moveTo(left.x,0);
  for(let i=0;i<=28;i++){const v=shellPoint(-1+i/14,1,w,len,h);face.lineTo(v.x,v.y);}face.lineTo(-left.x,0);face.closePath();
  const front=new T.ShapeGeometry(face),faceP=front.getAttribute('position'),halfWidth=-left.x;
  for(let i=0;i<faceP.count;i++)faceP.setZ(i,h*.14*(1-Math.abs(faceP.getX(i)/halfWidth)));front.computeVertexNormals();add(front,glass,[x,1.22,z+len/2+.004],[1,1,1],[0,0,0],opera);
  for(let j=1;j<12;j++){const v=shellPoint(j/6-1,1,w,len,h);opera.beam(iron,[x+v.x,1.22,z+v.z+.015],[x+v.x,1.22+v.y,z+v.z+.015],.018);}
 }
 for(const [x,scale]of [[1.05,1],[4.0,.84]])for(const [z,len,h]of [[-.8,4.7,4.6],[1.2,3.2,3.4],[2.8,2.25,2.35]])shell(x,z,1.38*scale,len*scale,h*scale);
 shell(-.8,3.1,.72,1.5,1.35);shell(5.9,3.1,.72,1.5,1.35);
 for(let i=0;i<6;i++)opera.box(paving,[2.6,.62+i*.065,5.1-i*.16],[6.8-i*.2,.07,.32]);
 const operaGroup=opera.flush('Australia · Sydney Opera House');group.add(operaGroup);

 // Harbour Bridge: twin steel arches, cross-bracing and hangers above an open
 // shipping channel, with four sandstone pylons and a separate road deck.
 const bridge=new Batch(),bx=-4.75,z0=-1.2,z1=7.0,deckY=1.75;
 bridge.box(road,[bx,deckY-.09,(z0+z1)/2],[1.65,.18,z1-z0+.4]);
 for(let i=0;i<19;i++)bridge.box(stripe,[bx,deckY+.008,z0+i*(z1-z0)/18],[.04,.018,.18]);
 const arch=(t:number,side:number,offset=0)=>[bx+side*.84,deckY+.2+3.15*Math.pow(Math.sin(Math.PI*t),.82)+offset,z0+t*(z1-z0)];
 for(let i=0;i<32;i++){
  const a=i/32,b=(i+1)/32;
  for(const side of [-1,1]){bridge.beam(iron,arch(a,side),arch(b,side),.065);bridge.beam(iron,arch(a,side,.32),arch(b,side,.32),.05);bridge.beam(iron,arch(a,side),arch(b,side,.32),.028);
   if(i%2===0)bridge.beam(iron,[bx+side*.84,deckY,z0+a*(z1-z0)],arch(a,side),.021);
   bridge.beam(iron,[bx+side*.9,deckY+.29,z0+a*(z1-z0)],[bx+side*.9,deckY+.29,z0+b*(z1-z0)],.023);
  }
  if(i%4===0)bridge.beam(iron,arch(a,-1,.32),arch(a,1,.32),.035);
 }
 for(const z of [z0,z1])for(const side of [-1,1]){
  bridge.box(sandstone,[bx+side*1.11,1.82,z],[.73,2.5,.95]);bridge.box(stone,[bx+side*1.11,3.13,z],[.85,.15,1.05]);bridge.box(light,[bx+side*1.11,3.24,z],[.36,.05,.5]);
 }
 for(const z of [z0-.75,z1+.75])bridge.box(paving,[bx,1.14,z],[1.65,.9,1.1]);
 const bridgeGroup=bridge.flush('Australia · Sydney Harbour Bridge');group.add(bridgeGroup);

 // Low quays and a compact CBD leave the shell silhouette clear in front.
 let buildings=0;
 function building(x:number,z:number,w:number,d:number,h:number){
  buildings++;batch.box(glass,[x,ground+h/2,z],[w,h,d]);batch.box(roof,[x,ground+h+.08,z],[w+.09,.16,d+.09]);
  for(let y=.45;y<h-.1;y+=.42){batch.box(stone,[x,ground+y,z],[w+.025,.04,d+.025]);for(let c=0;c<3;c++)for(const side of [-1,1])if(rng()>.2)batch.box(windows,[x+(c-1)*w*.28,ground+y-.16,z+side*(d*.5+.012)],[w*.17,.18,.018]);}
  for(const side of [-1,1])batch.box(stone,[x+side*w*.48,ground+h*.5,z],[.06,h,d+.02]);
 }
 for(const b of [[-8,-4.7,1.4,1.6,3.0],[-6.2,-6.8,1.5,1.4,3.8],[-3.9,-7.3,1.4,1.5,4.4],[-1.8,-6.7,1.5,1.6,3.2],[1,-7.1,1.6,1.6,5.3],[3.4,-6.8,1.4,1.6,4.1],[5.8,-5.9,1.5,1.6,4.5],[8.1,-3.6,1.5,1.7,2.9],[9,0,1.4,1.7,2.2]])building(...b as [number,number,number,number,number]);
 batch.box(road,[0,.62,-4.7],[15.4,.045,1.05]);for(let x=-7.2;x<7.3;x+=.65)batch.box(stripe,[x,.65,-4.7],[.31,.018,.035]);
 const tower=new Batch();cylinder(stone,[-.25,.79,-5.2],.55,.7,.35,24,tower);cylinder(iron,[-.25,4.2,-5.2],.11,.22,6.55,12,tower);
 cylinder(brass,[-.25,7.63,-5.2],.72,.57,.45,32,tower);cylinder(glass,[-.25,7.99,-5.2],.62,.68,.28,32,tower);cylinder(brass,[-.25,8.22,-5.2],.4,.65,.16,32,tower);tower.beam(iron,[-.25,8.3,-5.2],[-.25,10.25,-5.2],.025);tower.ball(light,[-.25,10.3,-5.2],[.065,.065,.065]);group.add(tower.flush('Australia · Sydney Tower Eye'));
 function tree(x:number,z:number,h=1.45){batch.beam(trunk,[x,.6,z],[x,h,z],.055);batch.ball(leaf,[x-.12,h+.2,z],[.47,.46,.4]);batch.ball(leaf,[x+.18,h+.38,z+.08],[.34,.4,.32]);}
 function lamp(x:number,z:number){batch.beam(iron,[x,.65,z],[x,1.6,z],.026);batch.ball(light,[x,1.65,z],[.09,.12,.09]);}
 for(let i=0;i<44;i++){const a=i/44*Math.PI*2,x=Math.cos(a)*rx*.95,z=Math.sin(a)*rz*.95;if(x<-10&&Math.abs(z)<1.5||x>-7.2&&x<-4.8&&z>7.4)continue;tree(x,z,1.15+rng()*.3);if(i%3===0)lamp(x*.97,z*.97);}
 for(const [x,z]of [[-8.2,1],[-8,3.1],[-7.3,5],[8.1,3.2],[7.2,5.3],[6.4,6.4]]){tree(x,z);lamp(x+.35,z-.35);}
 for(let i=0;i<5;i++){batch.box(sandstone,[7.7,.72,-1.3+i*.48],[1.8,.16,.33]);}
 group.add(batch.flush('Australia · coastal streets, quays and gardens'));

 const ferry=new Batch(),ferryGreen=toon('#397e72');
 ferry.box(sandstone,[0,.1,0],[1.22,.17,.39]);ferry.box(ferryGreen,[0,.23,0],[1.1,.16,.37]);ferry.box(windows,[0,.38,0],[.8,.19,.32]);ferry.box(stripe,[0,.49,0],[.96,.06,.42]);ferry.box(light,[.54,.26,0],[.05,.06,.2]);
 const boat=ferry.flush('Australia · harbour ferry',false);group.add(boat);
 const wakeGeometry=new T.PlaneGeometry(1.05,.48);wakeGeometry.rotateX(-Math.PI/2);
 const wakeMaterial=new T.ShaderMaterial({uniforms:waterUniforms,transparent:true,depthWrite:false,vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`uniform float time,night;varying vec2 vUv;void main(){float edge=abs(vUv.y-.5);float band=exp(-pow((edge-(.06+(1.-vUv.x)*.3))/.055,2.));float foam=.55+.45*sin(vUv.x*36.+time*3.);float alpha=band*foam*sin(vUv.x*3.14159)*.45;gl_FragColor=vec4(mix(vec3(.8,.96,.92),vec3(.3,.5,.61),night),alpha);
#include <tonemapping_fragment>
#include <colorspace_fragment>}`});
 const wake=new T.Mesh(wakeGeometry,wakeMaterial);wake.name='Australia · ferry wake';wake.position.set(-.85,.02,0);boat.add(wake);
 function update(t:number){waterUniforms.time.value=t;const phase=t*.055,a=1.17+Math.sin(phase)*.42,r=.73+Math.cos(phase)*.085,da=Math.cos(phase)*.42,dr=-Math.sin(phase)*.085;boat.position.set(Math.cos(a)*rx*r,.65,.2+Math.sin(a)*rz*r);boat.rotation.y=-Math.atan2(rz*(Math.sin(a)*dr+Math.cos(a)*r*da),rx*(Math.cos(a)*dr-Math.sin(a)*r*da));boat.position.y+=Math.sin(t*2)*.018;}
 function setNight(n:number){const night=T.MathUtils.clamp(n,0,1);waterUniforms.night.value=night;windows.emissiveIntensity=night*1.45;light.emissiveIntensity=.1+night*2;brass.emissiveIntensity=night*.55;glass.emissiveIntensity=night*.12;}
 setNight(0);update(0);
 return {group,update,setNight,uniforms:waterUniforms,counts:{australiaIslands:1,operaHouse:1,operaShells:8,harbourBridge:1,sydneyTower:1,ferries:1,buildings}};
}
