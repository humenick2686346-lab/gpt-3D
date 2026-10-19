import * as THREE from 'three';
import { random } from '../core/math.js';

export function createSky() {
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    uniforms: {
      topColor: { value: new THREE.Color(0x7e9fb8) },
      horizonColor: { value: new THREE.Color(0xf1ba9a) },
      sunDirection: { value: new THREE.Vector3(-1,.3,-.4).normalize() },
      daylight: { value: 1 }, night: { value: 0 }, cloudCover: { value: .22 }, time: { value: 0 },
    },
    vertexShader: `varying vec3 vDirection;
      void main(){ vDirection=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `
      varying vec3 vDirection;
      uniform vec3 topColor,horizonColor,sunDirection;
      uniform float daylight,night,cloudCover,time;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
      float fbm(vec2 p){return noise(p)*.5+noise(p*2.03)*.25+noise(p*4.09)*.125+noise(p*8.12)*.0625;}
      void main(){
        vec3 d=normalize(vDirection);
        float height=max(d.y,0.);
        vec3 color=mix(horizonColor,topColor,pow(smoothstep(-.95,.55,d.y),.58));
        float sunDot=max(dot(d,sunDirection),0.);
        color+=vec3(1.,.57,.24)*pow(sunDot,12.)*.23*daylight*(1.-cloudCover);
        color+=vec3(1.,.78,.47)*smoothstep(.99972,.99988,sunDot)*daylight*3.*(1.-cloudCover);
        vec3 moonDirection=normalize(vec3(.65,.55,-.6));
        float moon=max(dot(d,moonDirection),0.);
        color+=vec3(.53,.68,.9)*pow(moon,100.)*night*.15;
        color+=vec3(.83,.9,1.)*smoothstep(.9998,.9999,moon)*night*1.5;
        if(d.y>.025){
          vec2 uv=d.xz/(d.y+.23)*2.2+vec2(time*.002,0.);
          float clouds=smoothstep(.67-cloudCover*.32,.85-cloudCover*.25,fbm(uv*1.7));
          clouds*=smoothstep(.02,.22,d.y)*(1.-smoothstep(.65,1.,d.y));
          vec3 cloudColor=mix(vec3(.13,.19,.28),mix(vec3(.97,.86,.76),vec3(.77,.82,.85),cloudCover),daylight);
          color=mix(color,cloudColor,clouds*.8);
        }
        gl_FragColor=vec4(color,1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(6000, 32, 20), material);
  sky.name='Procedural atmosphere'; sky.renderOrder=-10; sky.frustumCulled=false;
  const rand=random(517);
  const count=1500, positions=new Float32Array(count*3);
  for(let i=0;i<count;i++) {
    const az=rand()*Math.PI*2, y=.05+rand()*.95, r=Math.sqrt(1-y*y);
    positions.set([Math.cos(az)*r*5500,y*5500,Math.sin(az)*r*5500],i*3);
  }
  const geometry=new THREE.BufferGeometry(); geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
  const stars=new THREE.Points(geometry,new THREE.PointsMaterial({color:0xd5e4ff,size:2.6,sizeAttenuation:false,transparent:true,opacity:0,depthWrite:false,fog:false}));
  stars.name='Night stars'; stars.renderOrder=-5;
  return { sky, stars, update(elapsed, night) {
    material.uniforms.time.value=elapsed;
    stars.material.opacity=night*(.7+Math.sin(elapsed*.4)*.08)*(1-material.uniforms.cloudCover.value*.7);
  }};
}
