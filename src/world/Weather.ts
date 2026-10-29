import * as T from 'three';
import {random,qualityConfig,trees,height,inside,waterAt,type Quality,type Weather} from './layout.ts';

const petalBudgets:Record<Quality,number>={low:160,medium:300,high:460};

// A cupped, notched sakura petal. Its silhouette and changing surface normal
// remain visible when the camera is close, rather than becoming a round sprite.
function petalGeometry(){
 const shape=new T.Shape();
 shape.moveTo(0,-.5);
 shape.bezierCurveTo(-.12,-.36,-.4,-.02,-.32,.26);
 shape.bezierCurveTo(-.3,.43,-.17,.54,-.075,.49);
 shape.lineTo(0,.385);
 shape.lineTo(.075,.49);
 shape.bezierCurveTo(.17,.54,.3,.43,.32,.26);
 shape.bezierCurveTo(.4,-.02,.12,-.36,0,-.5);
 const base=new T.ShapeGeometry(shape,10),position=base.attributes.position;
 for(let i=0;i<position.count;i++){
  const x=position.getX(i),y=position.getY(i);
  position.setZ(i,.32*x*x+.13*y*y-.035);
 }
 base.computeVertexNormals();
 const geometry=new T.InstancedBufferGeometry();
 if(base.index)geometry.setIndex(base.index.clone());
 for(const [name,attribute]of Object.entries(base.attributes))geometry.setAttribute(name,attribute.clone());
 base.dispose();
 return geometry;
}

export class WeatherSystem{
 group=new T.Group();rain:T.LineSegments;snow:T.Points;petals:T.Mesh<T.InstancedBufferGeometry,T.MeshStandardMaterial>;
 mode:Weather='sun';intensity=.65;max=1600;petalBudget=300;
 uniforms={time:{value:0},pixelRatio:{value:1},day:{value:1}};
 constructor(scene:T.Scene,q:Quality){
  this.group.name='Rain, snow and windborne sakura petals';
  const rng=random(79),count=qualityConfig.high.particles*3,p=new Float32Array(count*6),seed=new Float32Array(count*2);
  for(let i=0;i<count;i++){
   const x=18+(rng()-.5)*70,y=rng()*23,z=-12+(rng()-.5)*70;
   p.set([x,y,z,x-.075,y+.45,z+.02],i*6);seed[i*2]=seed[i*2+1]=rng();
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(p,3));g.setAttribute('seed',new T.BufferAttribute(seed,1));
  const rainMat=new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:this.uniforms,vertexShader:`uniform float time;attribute float seed;varying float vA;void main(){vec3 p=position;p.y=mod(p.y-time*(9.+seed*3.),23.)-3.;p.x+=sin(time*.2)*.5;vA=.24+seed*.2;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,fragmentShader:`varying float vA;void main(){gl_FragColor=vec4(.68,.84,1.,vA);}`});
  this.rain=new T.LineSegments(g,rainMat);this.rain.frustumCulled=false;
  const sg=new T.BufferGeometry(),sp=new Float32Array(count*3),ss=new Float32Array(count);
  for(let i=0;i<count;i++){sp.set([p[i*6],p[i*6+1],p[i*6+2]],i*3);ss[i]=seed[i*2];}
  sg.setAttribute('position',new T.BufferAttribute(sp,3));sg.setAttribute('seed',new T.BufferAttribute(ss,1));
  const snowMat=new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:this.uniforms,vertexShader:`uniform float time,pixelRatio;attribute float seed;varying float vA;void main(){vec3 p=position;p.y=mod(p.y-time*(.4+seed*.8),23.)-3.;p.x+=sin(time*.5+seed*80.+p.y*.3)*.6;p.z+=cos(time*.35+seed*60.)*.4;vA=.6+seed*.3;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);gl_PointSize=(2.+seed*3.)*pixelRatio;}`,fragmentShader:`varying float vA;void main(){float a=1.-smoothstep(.2,.5,length(gl_PointCoord-.5));gl_FragColor=vec4(.94,.97,1.,a*vA);}`});
  this.snow=new T.Points(sg,snowMat);this.snow.frustumCulled=false;

  const pg=petalGeometry(),petalCount=petalBudgets.high;
  const origins=new Float32Array(petalCount*3),landings=new Float32Array(petalCount*3),petalSeeds=new Float32Array(petalCount),sizes=new Float32Array(petalCount);
  const petalRandom=random(31079);
  for(let i=0;i<petalCount;i++){
   // Interleave tree emitters so all quality settings cover the whole garden.
   const tree=trees[i%trees.length],angle=petalRandom()*Math.PI*2,r=Math.sqrt(petalRandom())*.78;
   const x=tree[0]+Math.cos(angle)*r,z=tree[1]+Math.sin(angle)*r;
   const landingX=x+1.1+petalRandom()*2.3,landingZ=z+.25+(petalRandom()-.5)*1.8;
   const landingY=inside(landingX,landingZ)?(waterAt(landingX,landingZ)?.625:height(landingX,landingZ)+.045):-2.3;
   origins.set([x,height(tree[0],tree[1])+1.8+petalRandom()*.55,z],i*3);
   landings.set([landingX,landingY,landingZ],i*3);
   petalSeeds[i]=petalRandom();sizes[i]=.13+petalRandom()*.12;
  }
  pg.setAttribute('petalOrigin',new T.InstancedBufferAttribute(origins,3));
  pg.setAttribute('petalLanding',new T.InstancedBufferAttribute(landings,3));
  pg.setAttribute('petalSeed',new T.InstancedBufferAttribute(petalSeeds,1));
  pg.setAttribute('petalSize',new T.InstancedBufferAttribute(sizes,1));
  const pm=new T.MeshStandardMaterial({color:'#fff0f5',roughness:.78,metalness:0,side:T.DoubleSide,transparent:true,depthWrite:false});
  pm.onBeforeCompile=shader=>{
   shader.uniforms.petalTime=this.uniforms.time;
   shader.vertexShader=`uniform float petalTime;
    attribute vec3 petalOrigin,petalLanding;
    attribute float petalSeed,petalSize;
    varying float vPetalAge,vPetalSeed;
    varying vec2 vPetalLocal;
    mat3 petalRX(float a){float c=cos(a),s=sin(a);return mat3(1.,0.,0.,0.,c,s,0.,-s,c);}
    mat3 petalRY(float a){float c=cos(a),s=sin(a);return mat3(c,0.,-s,0.,1.,0.,s,0.,c);}
    mat3 petalRZ(float a){float c=cos(a),s=sin(a);return mat3(c,s,0.,-s,c,0.,0.,0.,1.);}
   `+shader.vertexShader;
   shader.vertexShader=shader.vertexShader.replace('#include <beginnormal_vertex>',`
    float petalDuration=9.+petalSeed*7.;
    float petalAge=fract(petalTime/petalDuration+petalSeed);
    float petalSettle=smoothstep(.75,.9,petalAge);
    float petalPhase=petalSeed*6.283185;
    mat3 petalRotation=petalRY(petalPhase+petalAge*3.)
     *petalRX(mix(petalPhase+petalAge*11.,-1.570796,petalSettle))
     *petalRZ(mix(petalPhase+petalAge*17.,petalPhase,petalSettle));
    #include <beginnormal_vertex>
    objectNormal=petalRotation*objectNormal;
   `);
   shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`
    vPetalAge=petalAge;vPetalSeed=petalSeed;vPetalLocal=position.xy;
    float petalTravel=smoothstep(0.,.9,petalAge);
    vec3 petalCenter=mix(petalOrigin,petalLanding,petalTravel);
    float petalAir=sin(petalTravel*3.141593);
    petalCenter.x+=petalAir*(sin(petalAge*12.+petalPhase)*.32+sin(petalTime*.37+petalOrigin.z*.21)*.42);
    petalCenter.z+=petalAir*(cos(petalAge*10.+petalPhase)*.3+sin(petalTime*.28+petalOrigin.x*.19)*.22);
    petalCenter.y+=petalAir*sin(petalAge*15.+petalPhase)*.12;
    vec3 transformed=petalRotation*(position*petalSize)+petalCenter;
   `);
   shader.fragmentShader='varying float vPetalAge,vPetalSeed;varying vec2 vPetalLocal;\n'+shader.fragmentShader;
   shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`
    #include <color_fragment>
    vec3 petalTint=mix(vec3(1.,.48,.65),vec3(1.,.83,.89),vPetalSeed);
    float petalVein=(1.-smoothstep(.005,.025,abs(vPetalLocal.x)))*(1.-smoothstep(.13,.45,vPetalLocal.y));
    diffuseColor.rgb*=petalTint*(1.-petalVein*.13);
    diffuseColor.a*=smoothstep(0.,.055,vPetalAge)*(1.-smoothstep(.9,1.,vPetalAge))*.92;
   `);
  };
  pm.customProgramCacheKey=()=> 'sakura-cupped-wind-petals-v2';
  this.petals=new T.Mesh(pg,pm);this.petals.name='Cupped, tumbling sakura petals';this.petals.frustumCulled=false;
  this.group.add(this.rain,this.snow,this.petals);scene.add(this.group);this.setQuality(q);this.set('sun',.65);
 }
 setQuality(q:Quality){this.max=qualityConfig[q].particles*3;this.petalBudget=petalBudgets[q];this.set(this.mode,this.intensity);}
 set(mode:Weather,intensity:number){
  this.mode=mode;this.intensity=intensity;
  this.rain.visible=mode==='rain'&&intensity>0;this.snow.visible=mode==='snow'&&intensity>0;
  this.rain.geometry.setDrawRange(0,Math.floor(this.max*intensity)*2);this.snow.geometry.setDrawRange(0,Math.floor(this.max*intensity));
  const petalFactor=mode==='rain'?1-intensity*.55:mode==='snow'?1-intensity*.75:1;
  this.petals.geometry.instanceCount=Math.floor(this.petalBudget*petalFactor);
 }
 update(t:number,dpr:number){this.uniforms.time.value=t;this.uniforms.pixelRatio.value=dpr;}
}
