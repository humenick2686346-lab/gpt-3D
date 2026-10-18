import * as THREE from 'three';
import { terrainHeight, random } from '../core/math.js';

export function createGround() {
  const group=new THREE.Group(); group.name='Meadow and winding footpath';
  const geometry=new THREE.PlaneGeometry(5600,5600,180,180);
  geometry.rotateX(-Math.PI/2);
  const pos=geometry.attributes.position;
  for(let i=0;i<pos.count;i++) pos.setY(i,terrainHeight(pos.getX(i),pos.getZ(i)));
  geometry.computeVertexNormals();
  const material=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.95,metalness:.02});
  const uniforms={snow:{value:0},wet:{value:0}};
  material.onBeforeCompile=shader=>{
    shader.uniforms.snow=uniforms.snow; shader.uniforms.wet=uniforms.wet;
    shader.vertexShader=shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vMeadow;');
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvMeadow=position;');
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
      varying vec3 vMeadow; uniform float snow,wet;
      float hashMeadow(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float noiseMeadow(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hashMeadow(i),hashMeadow(i+vec2(1,0)),f.x),mix(hashMeadow(i+vec2(0,1)),hashMeadow(i+vec2(1,1)),f.x),f.y);}
    `);
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      vec2 p=vMeadow.xz;
      float n=noiseMeadow(p*.018), fine=noiseMeadow(p*.13);
      vec3 grass=mix(vec3(.028,.075,.018),vec3(.10,.19,.038),n);
      float bands=sin(p.x*.019+p.y*.012+noiseMeadow(p*.006)*6.);
      vec3 blossom=mix(vec3(.39,.085,.19),vec3(.22,.12,.38),smoothstep(-.7,.6,bands));
      blossom=mix(blossom,vec3(.58,.34,.052),smoothstep(.7,.95,noiseMeadow(p*.008+34.)));
      grass=mix(grass,blossom,.24+n*.28+fine*.16);
      float path=abs(p.x-(sin(p.y*.0045)*72.+sin(p.y*.011)*14.));
      float footpath=1.-smoothstep(5.,10.,path);
      float plaza=1.-smoothstep(61.,72.,length(p));
      vec3 soil=mix(vec3(.55,.49,.38),vec3(.68,.6,.47),fine);
      grass=mix(grass,soil,max(footpath,plaza));
      grass*=1.-wet*.26;
      grass=mix(grass,vec3(.78,.85,.85),snow*(.3+fine*.5));
      diffuseColor.rgb*=grass;
    `);
  };
  const ground=new THREE.Mesh(geometry,material); ground.receiveShadow=true; group.add(ground);
  const plaza=new THREE.Mesh(new THREE.CylinderGeometry(63,63,.6,80),new THREE.MeshStandardMaterial({color:0xb8aa91,roughness:.91}));
  plaza.position.y=-.65; plaza.receiveShadow=true; group.add(plaza);
  // Low distant hills create a skyline without a texture or outside asset.
  const rand=random(60);
  const hillMat=new THREE.MeshStandardMaterial({color:0x536b5f,roughness:1});
  for(let i=0;i<34;i++) {
    const a=i/34*Math.PI*2, radius=1800+rand()*700;
    const hill=new THREE.Mesh(new THREE.SphereGeometry(1,20,10),hillMat);
    hill.position.set(Math.sin(a)*radius,-30,Math.cos(a)*radius);
    hill.scale.set(230+rand()*350,65+rand()*140,230+rand()*300);
    group.add(hill);
  }
  // Wet, shallow depressions with Fresnel highlights. No fake mirror plane.
  const puddles=new THREE.Group(); puddles.name='Rain puddles';
  const puddleMat=new THREE.MeshPhysicalMaterial({color:0x7d929b,roughness:.12,metalness:.18,clearcoat:1,transparent:true,opacity:.56,depthWrite:false});
  for(let i=0;i<23;i++) {
    const z=(rand()-.5)*900, x=Math.sin(z*.0045)*72+Math.sin(z*.011)*14+(rand()-.5)*7;
    const puddle=new THREE.Mesh(new THREE.CircleGeometry(1,20),puddleMat);
    puddle.rotation.x=-Math.PI/2; puddle.scale.set(1.2+rand()*3,2+rand()*6,1);
    puddle.position.set(x,terrainHeight(x,z)+.04,z); puddles.add(puddle);
  }
  group.add(puddles); puddles.visible=false;
  return {group,setWeather(weather,intensity) {
    uniforms.snow.value=weather==='snow'?intensity:0;
    uniforms.wet.value=weather==='rain'?intensity:0;
    material.roughness=weather==='rain'?.32:.95;
    material.metalness=weather==='rain'?.18:.02;
    puddles.visible=weather==='rain' && intensity>0;
    puddleMat.opacity=.2+intensity*.4;
  }};
}
