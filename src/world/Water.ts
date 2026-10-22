import * as T from 'three';
import {lake,streamX,streamEndZ,eastOutletX,westFall,westSpring,type Quality} from './layout.ts';
import {WaterReflection} from './WaterReflection.ts';
export function createWater(){
 const group=new T.Group();group.name='Reflective lake, flowing streams and three waterfalls';
 const reflection=new WaterReflection();
 const uniforms={time:{value:0},day:{value:1},rain:{value:0},sky:{value:new T.Color('#c4e7ee')},sunDirection:{value:new T.Vector3(-.6,.8,-.3)},sunColor:{value:new T.Color('#fff1d6')},reflectionMap:{value:reflection.target.texture},reflectionMatrix:{value:reflection.matrix},reflecting:{value:1},fallLips:{value:[new T.Vector2(streamX(streamEndZ),streamEndZ),new T.Vector2(eastOutletX,-3.4),new T.Vector2(westFall.x,westFall.z)]}};
 const material=new T.ShaderMaterial({name:'Flowing water · Fresnel, caustics and reflected scenery',side:T.DoubleSide,uniforms,
 vertexShader:`uniform float time,rain;uniform mat4 reflectionMatrix;attribute vec3 waterData;attribute vec2 flowDirection;varying vec2 vFlow;varying vec3 vWorld;varying vec3 vWater;varying vec4 vMirror;
 void main(){vec3 p=position;float bank=smoothstep(0.,.18,waterData.x);float wave=sin(p.x*2.8+p.z*1.9-time*1.1)*.009+sin(p.x*5.1-p.z*3.7+time*.8)*.005;p.y+=wave*bank*(1.+rain*.7);vec4 world=modelMatrix*vec4(p,1.);vWorld=world.xyz;vWater=waterData;vFlow=flowDirection;vMirror=reflectionMatrix*world;gl_Position=projectionMatrix*viewMatrix*world;}`,
 fragmentShader:`uniform float time,day,rain,reflecting;uniform vec3 sky,sunDirection,sunColor;uniform vec2 fallLips[3];uniform sampler2D reflectionMap;varying vec3 vWorld,vWater;varying vec2 vFlow;varying vec4 vMirror;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 void main(){
  vec2 p=vWorld.xz;float flow=time*(.32+vWater.z*.5);vec2 q=p-vFlow*flow;
  vec2 slope=vec2(cos(p.x*2.8+p.y*1.9-time*1.1)*.025+cos(p.x*5.1-p.y*3.7+time*.8)*.025,cos(p.x*2.8+p.y*1.9-time*1.1)*.017-cos(p.x*5.1-p.y*3.7+time*.8)*.019);
  slope+=vec2(sin(q.y*19.+p.x*7.),cos(q.x*16.-q.y*11.))*.018;
  vec2 cell=floor(p*2.4);float seed=hash(cell);vec2 drop=(fract(p*2.4)-vec2(.2+.6*seed,.2+.6*hash(cell+7.)))/2.4;float age=fract(time*.85+seed*5.);float radius=length(drop);float ringDistance=(radius-age*.32)*90.;float ring=exp(-ringDistance*ringDistance)*(1.-age)*smoothstep(.02,.1,age)*rain;
  slope+=normalize(drop+vec2(.001))*ring*.055;
  vec3 normal=normalize(vec3(-slope.x,1.,-slope.y));vec3 viewDirection=normalize(vec3(viewMatrix[0][2],viewMatrix[1][2],viewMatrix[2][2]));float fresnel=.035+.965*pow(1.-max(dot(viewDirection,normal),0.),5.);
  float bank=1.-smoothstep(.015,.45,vWater.x);vec3 deep=mix(vec3(.012,.045,.085),vec3(.023,.24,.255),day);vec3 shallow=mix(vec3(.025,.095,.13),vec3(.15,.48,.36),day);vec3 color=mix(deep,shallow,bank*.72);
  float caustic=pow(max(0.,1.-abs(sin(q.x*7.+sin(q.y*5.2))*.65+sin(q.y*8.-q.x*2.)*.35)),18.);color+=vec3(.18,.38,.24)*caustic*.17*day*(.35+bank);
  vec2 uv=vMirror.xy/vMirror.w+normal.xz*.055;vec3 reflected=texture2D(reflectionMap,clamp(uv,vec2(.002),vec2(.998))).rgb;reflected=mix(sky*.6,reflected,reflecting);
  color=mix(color,reflected,clamp(.15+fresnel*.65,0.,.8));
  vec3 halfVector=normalize(normalize(sunDirection)+viewDirection);float spec=pow(max(dot(normal,halfVector),0.),160.);color+=sunColor*spec*day*.42;
  float current=pow(max(0.,sin(vWater.y*16.-time*3.2+sin(p.x*10.)*.5)),22.);float foam=(1.-smoothstep(.015,.08,vWater.x))*(.3+.7*current);color+=vec3(.55,.72,.65)*foam*(.15+day*.26);color+=sky*ring*.2;float lipFoam=0.;for(int i=0;i<3;i++){float d=length(p-fallLips[i]);lipFoam+=exp(-d*d*8.);}float froth=pow(.5+.5*sin(p.x*31.+p.y*19.-time*5.5+sin(p.y*13.-time*3.)),3.);color=mix(color,sky*.8,lipFoam*(.25+froth*.35));
  gl_FragColor=vec4(color,1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
 }`});
 const lakeGeom=new T.PlaneGeometry(2,2,80,60);lakeGeom.rotateX(-Math.PI/2);const a=lakeGeom.attributes.position,waterData:number[]=[];
 for(let i=0;i<a.count;i++){const x=a.getX(i),z=a.getZ(i),dx=x*3.68*Math.sqrt(1-z*z*.5),dz=z*2.03*Math.sqrt(1-x*x*.5);a.setXYZ(i,2+dx,.57,-2.8+dz);waterData.push((1-Math.hypot(dx/3.68,dz/2.03))*1.7,dz,0);}
 lakeGeom.setAttribute('waterData',new T.Float32BufferAttribute(waterData,3));lakeGeom.setAttribute('flowDirection',new T.Float32BufferAttribute(Array.from({length:a.count},()=>[0,1]).flat(),2));lakeGeom.computeVertexNormals();group.add(new T.Mesh(lakeGeom,material));
 function ribbon(points:T.Vector3[],width:number){const p:number[]=[],data:number[]=[],directions:number[]=[],idx:number[]=[],cols=8;points.forEach((v,i)=>{const tangent=points[Math.min(i+1,points.length-1)].clone().sub(points[Math.max(0,i-1)]).normalize();for(let j=0;j<=cols;j++){const u=j/cols-.5;p.push(v.x+tangent.z*u*width,v.y,v.z-tangent.x*u*width);data.push((.5-Math.abs(u))*width,i*.12,1);directions.push(tangent.x,tangent.z);if(i<points.length-1&&j<cols){const k=i*(cols+1)+j;idx.push(k,k+1,k+cols+1,k+1,k+cols+2,k+cols+1);}}});const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('waterData',new T.Float32BufferAttribute(data,3));g.setAttribute('flowDirection',new T.Float32BufferAttribute(directions,2));g.setIndex(idx);g.computeVertexNormals();return g;}
 // Start the channels at the lake boundary, avoiding coplanar overlapping sheets.
 let streamStart=-2;while(lake(streamX(streamStart),streamStart)<.998)streamStart+=.005;
 let eastStart=4.9;while(lake(eastStart,-3.4)<.998)eastStart+=.005;
 const points=Array.from({length:140},(_,i)=>{const z=streamStart+i/139*(streamEndZ-streamStart);return new T.Vector3(streamX(z),.57,z);});group.add(new T.Mesh(ribbon(points,1.04),material));
 const east=Array.from({length:85},(_,i)=>new T.Vector3(eastStart+i/84*(eastOutletX-eastStart),.57,-3.4));group.add(new T.Mesh(ribbon(east,.78),material));
 const spring=Array.from({length:24},(_,i)=>new T.Vector3(T.MathUtils.lerp(westSpring.x,westFall.x,i/23),.57,T.MathUtils.lerp(westSpring.z,westFall.z,i/23)));group.add(new T.Mesh(ribbon(spring,.64),material));
 const pool=new T.CircleGeometry(1,64,0,Math.PI*2);pool.rotateX(-Math.PI/2);const poolData:number[]=[];const poolPositions=pool.attributes.position;for(let i=0;i<poolPositions.count;i++){const x=poolPositions.getX(i),z=poolPositions.getZ(i);poolPositions.setXYZ(i,westSpring.x+x*1.35,.57,westSpring.z+z*.72);poolData.push((1-Math.hypot(x,z))*.65,z,0);}pool.setAttribute('waterData',new T.Float32BufferAttribute(poolData,3));pool.setAttribute('flowDirection',new T.Float32BufferAttribute(Array.from({length:poolPositions.count},()=>[-.85,.53]).flat(),2));group.add(new T.Mesh(pool,material));
 const fallMaterial=new T.ShaderMaterial({name:'Waterfalls · layered falling sheets',side:T.DoubleSide,transparent:true,depthWrite:false,uniforms,
 vertexShader:`uniform float time;varying vec2 vUv;varying vec3 vWorld;
 void main(){vUv=uv;vec3 p=position;float t=uv.y;float anchor=smoothstep(0.,.12,t);float pulse=sin(t*18.-time*5.4+uv.x*12.);float spread=t*t;
 p.x+=(sin(t*10.-time*3.2+uv.x*8.)*.038+pulse*.018)*(1.+spread*1.4)*anchor;
 p.z+=(cos(t*13.-time*4.+uv.x*11.)*.034+sin(t*31.-time*8.)*.012)*anchor;
 p.y+=pulse*.055*sin(t*3.14159);
 vWorld=(modelMatrix*vec4(p,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(vWorld,1.);}`,
 fragmentShader:`uniform float time,day;uniform vec3 sky,sunDirection;varying vec2 vUv;varying vec3 vWorld;
 float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);float a=fract(sin(dot(i,vec2(127.1,311.7)))*43758.5453),b=fract(sin(dot(i+vec2(1.,0.),vec2(127.1,311.7)))*43758.5453),c=fract(sin(dot(i+vec2(0.,1.),vec2(127.1,311.7)))*43758.5453),d=fract(sin(dot(i+1.,vec2(127.1,311.7)))*43758.5453);return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);}
 void main(){float t=vUv.y;float falling=t*11.-time*3.5;
 float broad=noise(vec2(vUv.x*7.+sin(t*7.-time*2.)*.25,falling));
 float fine=noise(vec2(vUv.x*31.,falling*3.2));float rivulet=pow(.5+.5*sin(vUv.x*59.+broad*3.),3.);
 float pulse=smoothstep(.55,.9,noise(vec2(vUv.x*15.,falling*2.3)));
 float foam=(1.-smoothstep(0.,.16,t))*.6+smoothstep(.64,1.,t)*(.3+fine*.5);
 vec3 normal=normalize(cross(dFdx(vWorld),dFdy(vWorld)));float light=.78+.22*abs(dot(normal,normalize(sunDirection)));
 vec3 clear=mix(vec3(.018,.08,.12),vec3(.055,.32,.36),day),white=mix(vec3(.17,.25,.38),vec3(.76,.92,.91),day);
 vec3 color=mix(clear,white,clamp(.28+broad*.35+rivulet*.17+pulse*.12+foam*.4,0.,1.))*light;
 color=mix(color,sky*.8,pulse*.11);float edges=smoothstep(0.,.07,vUv.x)*smoothstep(0.,.07,1.-vUv.x);
 float breakup=1.-smoothstep(.72,1.,t)*smoothstep(.35,.68,fine)*.68;
 float alpha=(.44+broad*.2+rivulet*.13+foam*.2)*edges*breakup*(1.-smoothstep(.9,1.,t)*.8);
 gl_FragColor=vec4(color,alpha);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`});
 const falls=[{x:streamX(streamEndZ),z:streamEndZ,w:.92,dx:.2,dz:.85},{x:eastOutletX,z:-3.4,w:.78,dx:.85,dz:0},{...westFall,w:.72,dx:-.55,dz:.65}];
 for(const f of falls){
  for(let layer=0;layer<2;layer++){const p:number[]=[],uv:number[]=[],idx:number[]=[];for(let j=0;j<=56;j++)for(let i=0;i<=12;i++){const t=j/56,u=i/12-.5,n=Math.hypot(f.dx,f.dz),spread=1+t*t*.36,arc=1-Math.exp(-t*5);p.push(f.x+u*f.w*spread*f.dz/n+f.dx*arc+layer*.025,.59-t*6.5,f.z-u*f.w*spread*f.dx/n+f.dz*arc+layer*.035);uv.push(i/12,t);if(j<56&&i<12){const k=j*13+i;idx.push(k,k+1,k+13,k+1,k+14,k+13);}}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();group.add(new T.Mesh(g,fallMaterial));}
 }
 // Separate accelerating droplets peel away from the sheets; their paths
 // widen below the cliff, so the water visibly breaks into falling spray.
 const dropPositions:number[]=[],dropDirections:number[]=[],dropSeeds:number[]=[];
 for(let i=0;i<480;i++){const f=falls[i%3],n=Math.hypot(f.dx,f.dz),u=(Math.sin(i*127.1)*.5)*f.w;dropPositions.push(f.x+u*f.dz/n,.59,f.z-u*f.dx/n);dropDirections.push(f.dx,f.dz);dropSeeds.push((Math.sin(i*78.233)*43758.5453)%1+1);}
 const dg=new T.BufferGeometry();dg.setAttribute('position',new T.Float32BufferAttribute(dropPositions,3));dg.setAttribute('direction',new T.Float32BufferAttribute(dropDirections,2));dg.setAttribute('seed',new T.Float32BufferAttribute(dropSeeds,1));
 const dm=new T.ShaderMaterial({name:'Accelerating waterfall spray',transparent:true,depthWrite:false,uniforms,
 vertexShader:`uniform float time;attribute vec2 direction;attribute float seed;varying float vAlpha;
 void main(){float s=fract(seed);float age=fract(s+time*(.42+s*.22));float flight=age*age;vec3 p=position;float arc=1.-exp(-age*5.);float spray=flight*flight;
 p.x+=direction.x*arc+sin(seed*137.)*spray*.7;p.z+=direction.y*arc+cos(seed*93.)*spray*.7;p.y-=flight*6.9;
 vAlpha=sin(age*3.14159)*(.3+s*.4);gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);gl_PointSize=1.5+s*2.5;}`,
 fragmentShader:`uniform float day;varying float vAlpha;void main(){vec2 p=gl_PointCoord-.5;float alpha=1.-smoothstep(.1,.5,length(p*vec2(1.6,1.)));gl_FragColor=vec4(mix(vec3(.2,.3,.45),vec3(.82,.96,.98),day),alpha*vAlpha);}`});
 const drops=new T.Points(dg,dm);drops.name='Falling droplets and splash';drops.frustumCulled=false;group.add(drops);
 // Soft spray follows each fall, with droplets both at the lip and below the island.
 const mistPos=new Float32Array(360*3),seeds=new Float32Array(360);for(let i=0;i<360;i++){const f=falls[i%3],seed=i/360;mistPos.set([f.x+f.dx+Math.sin(i*17)*.5,-5.5+Math.sin(i)*.3,f.z+f.dz+Math.cos(i*13)*.5],i*3);seeds[i]=seed;}
 const mg=new T.BufferGeometry();mg.setAttribute('position',new T.BufferAttribute(mistPos,3));mg.setAttribute('seed',new T.BufferAttribute(seeds,1));
 const mm=new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms,vertexShader:`uniform float time;attribute float seed;varying float vA;void main(){float age=fract(seed+time*.11);vec3 p=position;p.y+=age*.9;p.x+=sin(time*.4+seed*70.)*age*.6;p.z+=cos(seed*82.)*age*.4;vA=.16*sin(age*3.14159);vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=18.+age*24.;}`,fragmentShader:`uniform float day;varying float vA;void main(){float a=1.-smoothstep(.05,.5,length(gl_PointCoord-.5));gl_FragColor=vec4(vec3(.74,.9,.94)*(.3+day*.7),a*vA);}`});group.add(new T.Points(mg,mm));
 return {group,uniforms,reflection,falls,
  setQuality(q:Quality){reflection.setQuality(q);uniforms.reflecting.value=q==='low'?0:1;},
  capture(renderer:T.WebGLRenderer,scene:T.Scene,camera:T.Camera,excluded:T.Object3D[]=[]){reflection.capture(renderer,scene,camera,group,uniforms.time.value,excluded);},
  update(t:number,day:number,rain:number,sky:T.Color,sunDirection?:T.Vector3,sunColor?:T.Color){uniforms.time.value=t;uniforms.day.value=day;uniforms.rain.value=rain;uniforms.sky.value.copy(sky);if(sunDirection)uniforms.sunDirection.value.copy(sunDirection).normalize();if(sunColor)uniforms.sunColor.value.copy(sunColor);},
  dispose(){reflection.dispose();}
 };
}
