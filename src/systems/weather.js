import * as THREE from 'three';
import { random } from '../core/math.js';

export class WeatherSystem {
  constructor(scene,quality) {
    this.scene=scene; this.mode='sun';this.intensity=.65;
    this.uniforms={time:{value:0},center:{value:new THREE.Vector3()},opacity:{value:.6},isSnow:{value:0},pixelRatio:{value:1}};
    this.setQuality(quality);
  }
  setQuality(quality) {
    for(const obj of [this.rain,this.snow]) if(obj){this.scene.remove(obj);obj.geometry.dispose();obj.material.dispose();}
    const max={low:1800,medium:4200,high:7600}[quality]; this.max=max;
    const rand=random(938), positions=new Float32Array(max*3), rainPositions=new Float32Array(max*6),ends=new Float32Array(max*2);
    for(let i=0;i<max;i++) {
      const x=(rand()-.5)*850,y=rand()*450,z=(rand()-.5)*850;
      positions.set([x,y,z],i*3); rainPositions.set([x,y,z,x,y,z],i*6); ends[i*2+1]=1;
    }
    const rainGeo=new THREE.BufferGeometry();rainGeo.setAttribute('position',new THREE.BufferAttribute(rainPositions,3));rainGeo.setAttribute('end',new THREE.BufferAttribute(ends,1));
    const snowGeo=new THREE.BufferGeometry();snowGeo.setAttribute('position',new THREE.BufferAttribute(positions,3));
    const shared=`uniform float time;uniform vec3 center;varying float vDepth;varying float vAlpha;`;
    const fragment=`uniform float opacity;varying float vDepth;varying float vAlpha;
      void main(){gl_FragColor=vec4(vec3(.78,.87,.96),opacity*vAlpha*exp(-vDepth*.0015));
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      }`;
    const rainMat=new THREE.ShaderMaterial({uniforms:this.uniforms,transparent:true,depthWrite:false,
      vertexShader:`${shared} attribute float end;
        void main(){vec3 p=position;p.y=mod(p.y-time*175.,450.);p.x+=mod(time*13.+position.y*.15,55.)-27.;p+=center;
        p+=vec3(1.1,-6.,.25)*end;vec4 mv=modelViewMatrix*vec4(p,1.);vDepth=-mv.z;vAlpha=.3+.4*fract(position.x*13.7);
        gl_Position=projectionMatrix*mv;}`,fragmentShader:fragment});
    this.rain=new THREE.LineSegments(rainGeo,rainMat);this.rain.name='World-space wind-driven rain';this.rain.frustumCulled=false;
    const snowMat=new THREE.ShaderMaterial({uniforms:this.uniforms,transparent:true,depthWrite:false,
      vertexShader:`${shared} uniform float pixelRatio;
        void main(){vec3 p=position;p.y=mod(p.y-time*(8.+fract(position.x*.172)*7.),450.);
        p.x+=sin(time*.55+position.z)*4.+time*1.8;p.x=mod(p.x+425.,850.)-425.;p.z+=cos(time*.35+position.x)*3.;p+=center;
        vec4 mv=modelViewMatrix*vec4(p,1.);vDepth=-mv.z;vAlpha=.65+fract(position.z*.45)*.35;
        gl_Position=projectionMatrix*mv;gl_PointSize=clamp((650.+fract(position.x*3.17)*1100.)/max(1.,-mv.z),2.2,13.)*pixelRatio;}`,
      fragmentShader:`uniform float opacity;varying float vDepth;varying float vAlpha;
        void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;
        gl_FragColor=vec4(.92,.96,1.,smoothstep(.5,.16,d)*opacity*vAlpha*exp(-vDepth*.0012));
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        }`});
    this.snow=new THREE.Points(snowGeo,snowMat);this.snow.name='Drifting snowflakes';this.snow.frustumCulled=false;
    this.scene.add(this.rain,this.snow);this.set(this.mode,this.intensity);
  }
  set(mode,intensity) {
    this.mode=mode;this.intensity=intensity;
    this.rain.visible=mode==='rain'&&intensity>0;
    this.snow.visible=mode==='snow'&&intensity>0;
    this.rain.geometry.setDrawRange(0,Math.floor(this.max*intensity)*2);
    this.snow.geometry.setDrawRange(0,Math.floor(this.max*intensity));
    this.uniforms.opacity.value=mode==='rain'?.45+intensity*.3:.8;
  }
  update(elapsed,camera,ratio) {
    this.uniforms.time.value=elapsed;this.uniforms.pixelRatio.value=ratio;
    this.uniforms.center.value.set(camera.position.x*.55,-5,camera.position.z*.55);
  }
}
