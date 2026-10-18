import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { pathDistance, random, terrainHeight } from '../core/math.js';

function petalGeometry() {
  const parts=[];
  for(let i=0;i<7;i++) {
    const a=i/7*Math.PI*2;
    const shape=new THREE.Shape();
    shape.moveTo(-.08,0); shape.quadraticCurveTo(-.48,.48,-.24,.86);
    shape.quadraticCurveTo(0,1.04,.24,.86); shape.quadraticCurveTo(.48,.48,.08,0); shape.closePath();
    const petal=new THREE.ShapeGeometry(shape,2);
    petal.rotateX(-Math.PI/2+.17); petal.rotateY(a); petal.translate(0,2.25,0);
    parts.push(petal);
  }
  return mergeGeometries(parts);
}
function tulipGeometry() {
  const points=[new THREE.Vector2(.07,1.95),new THREE.Vector2(.32,2.08),new THREE.Vector2(.45,2.37),new THREE.Vector2(.38,2.67)];
  const g=new THREE.LatheGeometry(points,9);
  const p=g.attributes.position;
  for(let i=0;i<p.count;i++) {
    const x=p.getX(i),z=p.getZ(i),y=p.getY(i);
    if(y>2.6) p.setY(i,y+Math.cos(Math.atan2(z,x)*3)*.13);
  }
  g.computeVertexNormals(); return g;
}
function lavenderGeometry() {
  const parts=[];
  for(let k=0;k<6;k++) for(let j=0;j<3;j++) {
    const a=j*Math.PI*2/3+k*.7;
    const g=new THREE.TetrahedronGeometry(.21*(1-k*.075),0);
    g.scale(.9,.8,.9); g.translate(Math.cos(a)*.14,1.95+k*.15,Math.sin(a)*.14); parts.push(g);
  }
  return mergeGeometries(parts);
}
function leafGeometry() {
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute([
    0,.65,0, .55,.88,.1, .8,1.18,0, 0,.65,0, .8,1.18,0,.36,.93,-.12,
    0,1.18,0,-.38,1.44,.1,-.7,1.65,0,0,1.18,0,-.7,1.65,0,-.36,1.38,-.1,
  ],3));
  geometry.computeVertexNormals(); return geometry;
}

function distantBlossomGeometry() {
  const vertices=[];
  for(let i=0;i<10;i++) {
    const a=i*Math.PI/5,b=(i+1)*Math.PI/5;
    const r=i%2?.28:.8,s=i%2?.8:.28;
    vertices.push(0,.82,0,Math.cos(a)*r,.9+(i%2)*.1,Math.sin(a)*r,Math.cos(b)*s,.9+((i+1)%2)*.1,Math.sin(b)*s);
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.computeVertexNormals();return g;
}

export class FlowerField {
  constructor(scene, quality='medium') {
    this.scene=scene; this.group=new THREE.Group(); this.group.name='Instanced tulips, cosmos and lavender';
    this.time={value:0}; this.wind={value:1}; this.meshes=[];
    this.geometries=[tulipGeometry(),lavenderGeometry(),petalGeometry()];
    this.stemGeo=new THREE.CylinderGeometry(.035,.05,2.2,4,1); this.stemGeo.translate(0,1.1,0);
    this.leafGeo=leafGeometry();
    this.centerGeo=new THREE.SphereGeometry(.14,6,4); this.centerGeo.scale(1,.45,1); this.centerGeo.translate(0,2.3,0);
    this.distantGeo=distantBlossomGeometry();
    this.petals=this.geometries.map(()=>this.windMaterial({color:0xffffff,roughness:.78,side:THREE.DoubleSide}));
    this.stemMat=this.windMaterial({color:0x47683c,roughness:.96});
    this.leafMat=this.windMaterial({color:0x638447,roughness:.9,side:THREE.DoubleSide});
    this.centerMat=this.windMaterial({color:0xe9c45b,roughness:.85});
    this.distantMat=this.windMaterial({color:0xffffff,roughness:.85,side:THREE.DoubleSide},true);
    scene.add(this.group); this.setQuality(quality);
  }
  windMaterial(options,distant=false) {
    const material=new THREE.MeshStandardMaterial(options);
    material.customProgramCacheKey=()=>`flower-wind-${distant?'distance-clusters':'detailed'}`;
    material.onBeforeCompile=shader=>{
      shader.uniforms.windTime=this.time; shader.uniforms.windPower=this.wind;
      shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nuniform float windTime,windPower;');
      shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
        #ifdef USE_INSTANCING
        float phase=instanceMatrix[3].x*.023+instanceMatrix[3].z*.018;
        float bend=pow(max(position.y,0.)/2.8,2.);
        transformed.x+=sin(windTime*1.4+phase)*bend*.23*windPower;
        transformed.z+=cos(windTime*.9+phase*1.3)*bend*.12*windPower;
        float fieldDistance=distance((modelMatrix*instanceMatrix*vec4(0.,0.,0.,1.)).xyz,cameraPosition);
        transformed*=${distant?'smoothstep(110.,240.,fieldDistance)':'(1.-smoothstep(650.,1000.,fieldDistance))'};
        #endif
      `);
    };
    return material;
  }
  setQuality(quality) {
    this.group.clear(); this.meshes.forEach(m=>m.dispose()); this.meshes=[];
    const count={low:6500,medium:15000,high:28000}[quality];
    const rand=random(3332026), species=[[],[],[]];
    const colors=[['#f2a3ad','#ec687b','#f7c6d4','#f5cf64','#f3eee4','#ed9351'],['#8c77bb','#b4a1d4','#7660a3'],['#f4b4cb','#f5e9e3','#e68dad','#d9b2d6','#edca67']];
    const matrix=new THREE.Matrix4(), quat=new THREE.Quaternion(), scale=new THREE.Vector3(), axis=new THREE.Vector3(0,1,0);
    for(let i=0;i<count;i++) {
      let x,z;
      // Combine a wide field with denser patches near the primary camera and footpath.
      if(rand()<.65) {x=rand()*1050-210;z=rand()*1100-160;}
      else {const a=rand()*Math.PI*2,r=100+Math.sqrt(rand())*1550;x=Math.cos(a)*r;z=Math.sin(a)*r;}
      if(Math.hypot(x,z)<73 || pathDistance(x,z)<10) {i--;continue;}
      const band=Math.sin(x*.017+z*.011+Math.sin(z*.004)*2);
      const type=band<-.3?1:band>.4?0:2;
      const height=.65+rand()*.85;
      quat.setFromAxisAngle(axis,rand()*Math.PI*2);
      scale.setScalar(height);
      matrix.compose(new THREE.Vector3(x,terrainHeight(x,z),z),quat,scale);
      const palette=colors[type];
      const c=new THREE.Color(palette[Math.floor(rand()*palette.length)]);
      c.multiplyScalar(.85+rand()*.3);
      species[type].push({matrix:matrix.clone(),color:c});
    }
    for(let type=0;type<3;type++) {
      const placements=species[type];
      const parts=[[this.geometries[type],this.petals[type],true],[this.stemGeo,this.stemMat,false],[this.leafGeo,this.leafMat,false]];
      if(type===2) parts.push([this.centerGeo,this.centerMat,false]);
      for(const [geo,mat,color] of parts) {
        const mesh=new THREE.InstancedMesh(geo,mat,placements.length);
        mesh.name=`${['Tulips','Lavender','Cosmos'][type]} ${color?'blossoms':'foliage'}`;
        placements.forEach((p,i)=>{mesh.setMatrixAt(i,p.matrix);if(color)mesh.setColorAt(i,p.color);});
        mesh.instanceMatrix.needsUpdate=true; if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
        mesh.computeBoundingSphere(); mesh.receiveShadow=true;
        // Field shadows are intentionally omitted; the tower casts the scene's main shadow.
        this.group.add(mesh);this.meshes.push(mesh);
      }
    }
    // Ten-triangle flower clusters replace individual stems at a distance.
    // Their geometric scale fades in with distance as detailed flowers fade out.
    const distantCount={low:18000,medium:40000,high:65000}[quality];
    const distant=new THREE.InstancedMesh(this.distantGeo,this.distantMat,distantCount);
    distant.name='Distance LOD · low-poly blossom clusters';
    for(let i=0;i<distantCount;i++) {
      const x=rand()*1700-550,z=rand()*1800-550;
      if(Math.hypot(x,z)<74||pathDistance(x,z)<11){i--;continue;}
      const band=Math.sin(x*.017+z*.011+Math.sin(z*.004)*2);
      const type=band<-.3?1:band>.4?0:2,palette=colors[type];
      quat.setFromAxisAngle(axis,rand()*Math.PI*2);scale.setScalar(2.1+rand()*2.8);
      matrix.compose(new THREE.Vector3(x,terrainHeight(x,z),z),quat,scale);
      distant.setMatrixAt(i,matrix);distant.setColorAt(i,new THREE.Color(palette[Math.floor(rand()*palette.length)]));
    }
    distant.instanceMatrix.needsUpdate=true;distant.instanceColor.needsUpdate=true;distant.computeBoundingSphere();
    this.group.add(distant);this.meshes.push(distant);this.distantCount=distantCount;
    this.count=count; this.quality=quality;
  }
  update(elapsed,weather) {this.time.value=elapsed;this.wind.value=weather==='rain'?2.1:weather==='snow'?1.2:1;}
  dispose() {
    this.meshes.forEach(m=>m.dispose());
    [...this.geometries,this.stemGeo,this.leafGeo,this.centerGeo,this.distantGeo].forEach(g=>g.dispose());
    [...this.petals,this.stemMat,this.leafMat,this.centerMat,this.distantMat].forEach(m=>m.dispose());
  }
}
