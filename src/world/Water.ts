import * as T from 'three';
import {lake,streamX,streamEndZ,eastOutletX,westFall,westSpring,type Quality} from './layout.ts';
import {WaterReflection} from './WaterReflection.ts';
export function createWater(){
 const group=new T.Group();group.name='Reflective lake, flowing streams and three waterfalls';
 const reflection=new WaterReflection();
 const uniforms={time:{value:0},day:{value:1},rain:{value:0},sky:{value:new T.Color('#c4e7ee')},sunDirection:{value:new T.Vector3(-.6,.8,-.3)},sunColor:{value:new T.Color('#fff1d6')},reflectionMap:{value:reflection.target.texture},reflectionMatrix:{value:reflection.matrix},reflecting:{value:1},fallLips:{value:[new T.Vector2(streamX(streamEndZ),streamEndZ),new T.Vector2(eastOutletX,-3.4),new T.Vector2(westFall.x,westFall.z)]}};
 const surfaceWaveGLSL=`float surfaceWave(vec3 p,float bankDistance){float wave=sin(p.x*2.8+p.z*1.9-time*1.1)*.009+sin(p.x*5.1-p.z*3.7+time*.8)*.005;return wave*smoothstep(0.,.18,bankDistance)*(1.+rain*.7);}`;
 // The inlet and the horizontal water share their wave and color functions, so
 // every waterfall starts at the exact same animated edge as its feeding stream.
 const surfaceColorGLSL=`uniform float time,day,rain,reflecting;uniform vec3 sky,sunDirection,sunColor;uniform vec2 fallLips[3];uniform sampler2D reflectionMap;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 vec3 surfaceColor(vec3 world,vec3 data,vec2 direction,vec4 mirror){
  vec2 p=world.xz;float flow=time*(.32+data.z*.5);vec2 q=p-direction*flow;
  vec2 slope=vec2(cos(p.x*2.8+p.y*1.9-time*1.1)*.025+cos(p.x*5.1-p.y*3.7+time*.8)*.025,cos(p.x*2.8+p.y*1.9-time*1.1)*.017-cos(p.x*5.1-p.y*3.7+time*.8)*.019);
  slope+=vec2(sin(q.y*19.+p.x*7.),cos(q.x*16.-q.y*11.))*.018;
  vec2 cell=floor(p*2.4);float seed=hash(cell);vec2 drop=(fract(p*2.4)-vec2(.2+.6*seed,.2+.6*hash(cell+7.)))/2.4;float age=fract(time*.85+seed*5.);float radius=length(drop);float ringDistance=(radius-age*.32)*90.;float ring=exp(-ringDistance*ringDistance)*(1.-age)*smoothstep(.02,.1,age)*rain;
  slope+=normalize(drop+vec2(.001))*ring*.055;
  vec3 normal=normalize(vec3(-slope.x,1.,-slope.y));vec3 viewDirection=normalize(vec3(viewMatrix[0][2],viewMatrix[1][2],viewMatrix[2][2]));float fresnel=.035+.965*pow(1.-max(dot(viewDirection,normal),0.),5.);
  float bank=1.-smoothstep(.015,.45,data.x);vec3 deep=mix(vec3(.012,.045,.085),vec3(.023,.24,.255),day);vec3 shallow=mix(vec3(.025,.095,.13),vec3(.15,.48,.36),day);vec3 color=mix(deep,shallow,bank*.72);
  float caustic=pow(max(0.,1.-abs(sin(q.x*7.+sin(q.y*5.2))*.65+sin(q.y*8.-q.x*2.)*.35)),18.);color+=vec3(.18,.38,.24)*caustic*.17*day*(.35+bank);
  vec2 uv=mirror.xy/mirror.w+normal.xz*.055;vec3 reflected=texture2D(reflectionMap,clamp(uv,vec2(.002),vec2(.998))).rgb;reflected=mix(sky*.6,reflected,reflecting);
  color=mix(color,reflected,clamp(.15+fresnel*.65,0.,.8));
  vec3 halfVector=normalize(normalize(sunDirection)+viewDirection);float spec=pow(max(dot(normal,halfVector),0.),160.);color+=sunColor*spec*day*.42;
  float current=pow(max(0.,sin(data.y*16.-time*3.2+sin(p.x*10.)*.5)),22.);float foam=(1.-smoothstep(.015,.08,data.x))*(.3+.7*current);color+=vec3(.55,.72,.65)*foam*(.15+day*.26);color+=sky*ring*.2;float lipFoam=0.;for(int i=0;i<3;i++){float d=length(p-fallLips[i]);lipFoam+=exp(-d*d*8.);}float froth=pow(.5+.5*sin(p.x*31.+p.y*19.-time*5.5+sin(p.y*13.-time*3.)),3.);color=mix(color,sky*.8,lipFoam*(.25+froth*.35));
  return color;
 }`;
 const material=new T.ShaderMaterial({name:'Flowing water · Fresnel, caustics and reflected scenery',side:T.DoubleSide,uniforms,
 vertexShader:`uniform float time,rain;uniform mat4 reflectionMatrix;attribute vec3 waterData;attribute vec2 flowDirection;varying vec2 vFlow;varying vec3 vWorld;varying vec3 vWater;varying vec4 vMirror;
 ${surfaceWaveGLSL}
 void main(){vec3 p=position;p.y+=surfaceWave(p,waterData.x);vec4 world=modelMatrix*vec4(p,1.);vWorld=world.xyz;vWater=waterData;vFlow=flowDirection;vMirror=reflectionMatrix*world;gl_Position=projectionMatrix*viewMatrix*world;}`,
 fragmentShader:`${surfaceColorGLSL}
 varying vec3 vWorld,vWater;varying vec2 vFlow;varying vec4 vMirror;
 void main(){gl_FragColor=vec4(surfaceColor(vWorld,vWater,vFlow,vMirror),1.);
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
 const points=Array.from({length:140},(_,i)=>{const z=streamStart+i/139*(streamEndZ-streamStart);return new T.Vector3(streamX(z),.57,z);});const mainChannel=new T.Mesh(ribbon(points,1.04),material);mainChannel.name='Water channel 1';group.add(mainChannel);
 const east=Array.from({length:85},(_,i)=>new T.Vector3(eastStart+i/84*(eastOutletX-eastStart),.57,-3.4));const eastChannel=new T.Mesh(ribbon(east,.78),material);eastChannel.name='Water channel 2';group.add(eastChannel);
 const spring=Array.from({length:24},(_,i)=>new T.Vector3(T.MathUtils.lerp(westSpring.x,westFall.x,i/23),.57,T.MathUtils.lerp(westSpring.z,westFall.z,i/23)));const westChannel=new T.Mesh(ribbon(spring,.64),material);westChannel.name='Water channel 3';group.add(westChannel);
 const pool=new T.CircleGeometry(1,64,0,Math.PI*2);pool.rotateX(-Math.PI/2);const poolData:number[]=[];const poolPositions=pool.attributes.position;for(let i=0;i<poolPositions.count;i++){const x=poolPositions.getX(i),z=poolPositions.getZ(i);poolPositions.setXYZ(i,westSpring.x+x*1.35,.57,westSpring.z+z*.72);poolData.push((1-Math.hypot(x,z))*.65,z,0);}pool.setAttribute('waterData',new T.Float32BufferAttribute(poolData,3));pool.setAttribute('flowDirection',new T.Float32BufferAttribute(Array.from({length:poolPositions.count},()=>[-.85,.53]).flat(),2));group.add(new T.Mesh(pool,material));
 const fallMaterial=new T.ShaderMaterial({name:'Waterfalls · continuous curved and accelerating water',side:T.DoubleSide,transparent:true,depthWrite:false,uniforms,
 vertexShader:`uniform float time,rain;uniform mat4 reflectionMatrix;attribute vec3 fallData;attribute vec2 flowDirection;
 varying vec2 vUv,vFlow;varying vec3 vWorld,vWater;varying vec4 vMirror;varying float vLayer;
 ${surfaceWaveGLSL}
 void main(){vUv=uv;vFlow=flowDirection;vWater=vec3(fallData.xy,1.);vLayer=fallData.z;vec3 p=position;float t=uv.y;
 float anchor=smoothstep(.015,.14,t);float travel=t*8.-time*5.5;
 // No independent offset at the inlet: its vertices and waves match the river.
 p.y+=surfaceWave(position,fallData.x)*(1.-smoothstep(.025,.16,t));
 float ripple=sin(travel*3.8+uv.x*10.)*.019+sin(travel*7.1-uv.x*15.)*.009;
 p+=normal*ripple*anchor*(.55+t*.8);
 vec3 flow=vec3(flowDirection.x,0.,flowDirection.y),across=vec3(flowDirection.y,0.,-flowDirection.x);
 p+=across*sin(travel*2.3+uv.x*11.)*.018*anchor*(.4+t);
 p+=flow*fallData.z*.018*anchor;
 vec4 world=modelMatrix*vec4(p,1.);vWorld=world.xyz;vMirror=reflectionMatrix*world;gl_Position=projectionMatrix*viewMatrix*world;}`,
 fragmentShader:`${surfaceColorGLSL}
 varying vec2 vUv,vFlow;varying vec3 vWorld,vWater;varying vec4 vMirror;varying float vLayer;
 float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);float a=hash(i),b=hash(i+vec2(1.,0.)),c=hash(i+vec2(0.,1.)),d=hash(i+1.);return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);}
 void main(){float t=vUv.y;
 // t is flight time, while the geometry drops as t squared. Advected details
 // therefore accelerate down the curved sheet instead of sliding at a fixed speed.
 float speed=.9+.12*sin(vUv.x*9.+time*.4);float falling=t*8./speed-time*5.5;
 float broad=noise(vec2(vUv.x*7.+sin(t*6.-time*1.5)*.2,falling));
 float fine=noise(vec2(vUv.x*31.,falling*3.2));float rivulet=pow(.5+.5*sin(vUv.x*59.+broad*2.7),3.);
 float pulse=smoothstep(.62,.92,noise(vec2(vUv.x*15.,falling*2.3)));
 float foam=(1.-smoothstep(.02,.21,t))*.32+smoothstep(.68,1.,t)*pulse*.45;
 vec3 normal=normalize(cross(dFdx(vWorld),dFdy(vWorld)));
 vec3 viewDirection=normalize(vec3(viewMatrix[0][2],viewMatrix[1][2],viewMatrix[2][2]));
 float light=.78+.22*abs(dot(normal,normalize(sunDirection))),fresnel=pow(1.-abs(dot(normal,viewDirection)),4.);
 vec3 clear=mix(vec3(.018,.075,.12),vec3(.045,.28,.32),day),white=mix(vec3(.15,.23,.34),vec3(.75,.9,.88),day);
 vec3 color=mix(clear,white,clamp(.18+broad*.27+rivulet*.12+pulse*.16+foam,0.,.92))*light;
 color=mix(color,sky*.85,.06+fresnel*.18);
 vec3 halfVector=normalize(normalize(sunDirection)+viewDirection);color+=sunColor*pow(abs(dot(normal,halfVector)),95.)*day*.18;
 float edges=smoothstep(0.,.045,vUv.x)*smoothstep(0.,.045,1.-vUv.x);
 float breakup=1.-smoothstep(.68,1.,t)*smoothstep(.4,.73,fine)*.6;
 float alpha=(.24+broad*.19+rivulet*.11+pulse*.12+foam*.23)*edges*breakup*(1.-smoothstep(.88,1.,t)*.65);
 float inlet=smoothstep(.025,.16,t);
 if(vLayer<.5){if(t<.16)color=mix(surfaceColor(vWorld,vWater,vFlow,vMirror),color,inlet);alpha=mix(1.,alpha,inlet);}
 else alpha*=smoothstep(.025,.14,t)*.38;
 gl_FragColor=vec4(color,alpha);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`});
 function fallFrom(channel:T.Vector3[],width:number){const last=channel[channel.length-1],direction=last.clone().sub(channel[channel.length-2]).normalize();return {x:last.x,z:last.z,w:width,dx:direction.x*.95,dz:direction.z*.95,phase:(channel.length-1)*.12};}
 const falls=[fallFrom(points,1.04),fallFrom(east,.78),fallFrom(spring,.64)];
 for(let fIndex=0;fIndex<falls.length;fIndex++){
  const f=falls[fIndex],n=Math.hypot(f.dx,f.dz),direction=new T.Vector2(f.dx/n,f.dz/n);
  for(let layer=0;layer<2;layer++){
   const p:number[]=[],uv:number[]=[],data:number[]=[],directions:number[]=[],idx:number[]=[],rows=64,cols=8;
   for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){
    const t=j/rows,u=i/cols-.5,spread=1-.16*Math.sin(t*Math.PI*.85)+.12*t*t*t*t,arc=(1-Math.exp(-t*1.8))/(1-Math.exp(-1.8));
    // A horizontal tangent at the shared lip curls smoothly into a gravity-driven fall.
    p.push(f.x+u*f.w*spread*direction.y+f.dx*arc,.57-t*t*6.5,f.z-u*f.w*spread*direction.x+f.dz*arc);
    uv.push(i/cols,t);data.push((.5-Math.abs(u))*f.w,f.phase,layer);directions.push(direction.x,direction.y);
    if(j<rows&&i<cols){const k=j*(cols+1)+i;idx.push(k,k+1,k+cols+1,k+1,k+cols+2,k+cols+1);}
   }
   const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('fallData',new T.Float32BufferAttribute(data,3));g.setAttribute('flowDirection',new T.Float32BufferAttribute(directions,2));g.setIndex(idx);g.computeVertexNormals();
   const sheet=new T.Mesh(g,fallMaterial);sheet.name=`Waterfall ${fIndex+1} · ${layer?'transparent inner sheet':'continuous curved sheet'}`;group.add(sheet);
  }
 }
 // Separate accelerating droplets peel away from the sheets; their paths
 // widen below the cliff, so the water visibly breaks into falling spray.
 const dropPositions:number[]=[],dropDirections:number[]=[],dropSeeds:number[]=[];
 for(let i=0;i<480;i++){const f=falls[i%3],n=Math.hypot(f.dx,f.dz),u=(Math.sin(i*127.1)*.5)*f.w;dropPositions.push(f.x+u*f.dz/n,.57,f.z-u*f.dx/n);dropDirections.push(f.dx,f.dz);dropSeeds.push((Math.sin(i*78.233)*43758.5453)%1+1);}
 const dg=new T.BufferGeometry();dg.setAttribute('position',new T.Float32BufferAttribute(dropPositions,3));dg.setAttribute('direction',new T.Float32BufferAttribute(dropDirections,2));dg.setAttribute('seed',new T.Float32BufferAttribute(dropSeeds,1));
 const dm=new T.ShaderMaterial({name:'Accelerating waterfall spray',transparent:true,depthWrite:false,uniforms,
 vertexShader:`uniform float time;attribute vec2 direction;attribute float seed;varying float vAlpha;
 void main(){float s=fract(seed);float age=fract(s+time*(.6+s*.2));float flight=age*age;vec3 p=position;float arc=(1.-exp(-age*1.8))/(1.-exp(-1.8));float spray=flight*flight;
 p.x+=direction.x*arc+sin(seed*137.)*spray*.7;p.z+=direction.y*arc+cos(seed*93.)*spray*.7;p.y-=flight*6.5;
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
