import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
export const uniforms={time:{value:0},snow:{value:0},wet:{value:0}};
const ramp=new T.DataTexture(new Uint8Array([112,158,205,242]),4,1,T.RedFormat);ramp.minFilter=T.LinearFilter;ramp.magFilter=T.LinearFilter;ramp.needsUpdate=true;
export function toon(color:T.ColorRepresentation,vertexColors=false,wind=false){
 const m=new T.MeshToonMaterial({color,gradientMap:ramp,vertexColors});
 m.onBeforeCompile=s=>{
  Object.assign(s.uniforms,uniforms);
  s.vertexShader='uniform float time; varying vec3 vWorld; varying vec3 vNormalW;\n'+s.vertexShader;
  s.vertexShader=s.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>\n${wind?`vec3 origin=vec3(0.);\n#ifdef USE_INSTANCING\n origin=instanceMatrix[3].xyz;\n#endif\ntransformed.x+=sin(time*1.7+origin.x*1.3+origin.z*.8)*pow(max(position.y,0.),1.5)*.14; transformed.z+=cos(time*1.2+origin.z)*max(position.y,0.)*.055;`:''}`);
  if(wind)s.vertexShader=s.vertexShader.replace('#include <color_vertex>',`#include <color_vertex>\n#if defined(USE_COLOR) && defined(USE_INSTANCING_COLOR)\nif((color.g>color.r*1.1&&color.r<.6)||(color.b<.2&&color.r>.5))vColor.rgb=color;\n#endif`);
  s.vertexShader=s.vertexShader.replace('#include <worldpos_vertex>',`#include <worldpos_vertex>\nvec4 wp=vec4(transformed,1.);\n#ifdef USE_INSTANCING\nwp=instanceMatrix*wp;\n#endif\nvWorld=(modelMatrix*wp).xyz;vNormalW=normalize(mat3(modelMatrix)*objectNormal);`);
  s.fragmentShader='uniform float snow,wet;varying vec3 vWorld;varying vec3 vNormalW;\n'+s.fragmentShader;
  s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>\nfloat grain=sin(vWorld.x*27.+sin(vWorld.z*15.))*sin(vWorld.z*33.+vWorld.y*18.);diffuseColor.rgb*=.97+grain*.03;diffuseColor.rgb*=1.-wet*.16;float cap=smoothstep(.48,.85,vNormalW.y)*snow*(.76+.24*sin(vWorld.x*4.+vWorld.z*2.));diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.88,.94,1.),cap);`);
 };
 m.customProgramCacheKey=()=>`sakura-toon-${wind}`;
 return m;
}
export const mats={grass:toon('#80ac55'),rock:toon('#8c8d8b'),earth:toon('#c3a18a'),moss:toon('#577b65'),wood:toon('#714d46'),red:toon('#ba3a40'),roof:toon('#354d60'),gold:toon('#deb473'),stone:toon('#c7c5b4'),pink:toon('#efa4bd'),leaf:toon('#689a50'),snow:toon('#edf5f3'),mountain:toon('#829fb2'),white:toon('#f6dfbd'),dark:toon('#443d48')};
export const lamp=new T.MeshStandardMaterial({color:'#ffe0a0',emissive:'#ffc06a',emissiveIntensity:.4,roughness:.7});
export class Batch{
 buckets=new Map<T.Material,T.BufferGeometry[]>();
 add(g:T.BufferGeometry,m:T.Material,p=[0,0,0],s=[1,1,1],r=[0,0,0]){
  const geom=g.clone();if(!geom.attributes.uv)geom.setAttribute('uv',new T.BufferAttribute(new Float32Array(geom.attributes.position.count*2),2));const matrix=new T.Matrix4().compose(new T.Vector3(...p),new T.Quaternion().setFromEuler(new T.Euler(...r)),new T.Vector3(...s));geom.applyMatrix4(matrix);
  const list=this.buckets.get(m)||[];list.push(geom);this.buckets.set(m,list);
 }
 box(m:T.Material,p:number[],s:number[],r=[0,0,0]){this.add(box,m,p,s,r);}
 ball(m:T.Material,p:number[],s:number[]){this.add(sphere,m,p,s);}
 beam(m:T.Material,a:number[],b:number[],radius=.05){const av=new T.Vector3(...a),bv=new T.Vector3(...b),d=bv.clone().sub(av);const g=cylinder.clone();g.applyMatrix4(new T.Matrix4().compose(av.add(bv).multiplyScalar(.5),new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),d.clone().normalize()),new T.Vector3(radius,d.length(),radius)));const list=this.buckets.get(m)||[];list.push(g);this.buckets.set(m,list);}
 flush(name:string,shadow=true){const group=new T.Group();group.name=name;for(const[m,list]of this.buckets){const merged=mergeGeometries(list,false);if(!merged)throw new Error('Geometry merge failed: '+name);merged.computeBoundingSphere();const mesh=new T.Mesh(merged,m);mesh.castShadow=shadow;mesh.receiveShadow=true;group.add(mesh);list.forEach(g=>g.dispose());}this.buckets.clear();return group;}
}
const box=new T.BoxGeometry(),sphere=new T.SphereGeometry(1,16,10),cylinder=new T.CylinderGeometry(1,1,1,7);
export function colored(g:T.BufferGeometry,color:T.ColorRepresentation){const c=new T.Color(color);const a=new Float32Array(g.attributes.position.count*3);for(let i=0;i<a.length;i+=3)c.toArray(a,i);g.setAttribute('color',new T.BufferAttribute(a,3));return g;}
