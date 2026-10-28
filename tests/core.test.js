import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {calculateTime,formatTime,TimeController} from '../src/controllers/TimeController.ts';
import {inside,plantable,waterAt,mountainAt,random,buildings,trees,qualityConfig,edge,height,islandRadiusX,islandRadiusZ} from '../src/world/layout.ts';
import {createIsland} from '../src/world/Island.ts';
import {createMountain} from '../src/world/Mountain.ts';
import {createArchitecture} from '../src/world/Architecture.ts';
import {createTokyoTower,towerPosition,towerExtent} from '../src/world/TokyoTower.ts';
import {createWater} from '../src/world/Water.ts';
import {Vegetation} from '../src/world/Vegetation.ts';

test('continuous day cycle, midnight seam, slider endpoints and pause behavior',()=>{
 assert.equal(formatTime(24),'24:00');assert.equal(formatTime(17.25),'17:15');assert.deepEqual(calculateTime(0),calculateTime(24));
 assert.ok(calculateTime(12).daylight>.99);assert.ok(calculateTime(0).night>.99);
 for(let h=0;h<24;h+=.01){const a=calculateTime(h),b=calculateTime(h+.001);for(const key of ['elevation','daylight','night','golden'])assert.ok(Math.abs(a[key]-b[key])<.01);}
 const time=new TimeController();time.hour=23.99;time.playing=true;time.update(1);assert.ok(time.hour<1);time.set(12);assert.equal(time.playing,false);
});
test('expanded island retains a deep rock body and proportionate Fuji',()=>{
 const island=new T.Box3().setFromObject(createIsland()),mountain=new T.Box3().setFromObject(createMountain());
 assert.ok(island.max.x-island.min.x>26&&island.max.x-island.min.x<30);assert.ok(island.max.z-island.min.z>22&&island.max.z-island.min.z<26);assert.ok(island.min.y<-4.5);assert.ok(mountain.max.y<5.9&&mountain.max.y>5.4);assert.ok(mountain.max.x-mountain.min.x>8&&mountain.max.x-mountain.min.x<9.2);
});
test('dense, reproducible planting area respects water, paths and building clearances',()=>{
 const rng=random(77);let land=0,planted=0;for(let i=0;i<20000;i++){const x=(rng()-.5)*islandRadiusX*2,z=(rng()-.5)*islandRadiusZ*2;if(inside(x,z)&&!waterAt(x,z)&&!mountainAt(x,z)){land++;if(plantable(x,z))planted++;}}
 const coverage=planted/land;assert.ok(coverage>.6&&coverage<.92,`plantable share ${coverage}`);
 const a=random(123),b=random(123);for(let i=0;i<100;i++)assert.equal(a(),b());
 for(const building of buildings)assert.ok(!plantable(building.x,building.z));
});
test('real instanced flowers, dense cherry grove and full architectural ensemble',()=>{
 const v=new Vegetation('medium'),architecture=createArchitecture();assert.ok(trees.length>29);assert.equal(v.cherryCount,trees.length);assert.equal(architecture.counts.buildings,9);assert.equal(architecture.counts.bridges,2);assert.equal(architecture.counts.torii,2);
 assert.ok(v.flowers.every(m=>m.isInstancedMesh&&m.geometry.attributes.position.count>100));
 assert.ok(v.count>=qualityConfig.medium.flowers-4);v.setQuality('low');assert.ok(v.count>=6496&&v.count<=6500);v.setQuality('high');assert.equal(v.count,16500);
 let meshes=0;architecture.group.traverse(o=>{if(o.isMesh){meshes++;assert.ok(o.geometry.attributes.position.count>100);}});assert.ok(meshes>=7&&meshes<15);
});

test('expanded rim remains plantable and supports new cherry groves',()=>{
 assert.ok(Math.abs(islandRadiusX/10-4/3)<1e-12);assert.ok(Math.abs(islandRadiusZ/8.6-4/3)<1e-12);
 let outerGarden=0;for(let i=0;i<96;i++){const a=i/96*Math.PI*2,x=Math.cos(a)*islandRadiusX*.84*edge(a),z=Math.sin(a)*islandRadiusZ*.84*edge(a);assert.ok(inside(x,z));assert.ok(Number.isFinite(height(x,z)));if(plantable(x,z))outerGarden++;}
 assert.ok(outerGarden>60,`outer garden samples ${outerGarden}`);
 assert.ok(trees.filter(([x,z])=>Math.hypot(x/10,z/8.6)>1).length>=12);
});

test('Tokyo Tower has a real detailed structure on its separate floating rock base',()=>{
 const tower=createTokyoTower(),bounds=new T.Box3().setFromObject(tower.group),size=bounds.getSize(new T.Vector3());
 assert.ok(bounds.max.y>towerPosition.y+towerExtent.height*.98&&bounds.max.y<towerPosition.y+towerExtent.height*1.02,'tower reaches its declared antenna height');
 assert.ok(bounds.min.y<towerPosition.y-towerExtent.baseDepth*.9,'floating rock base extends beneath the tower');
 assert.ok(size.x>towerExtent.radius*1.6&&size.x<towerExtent.radius*2.2);
 assert.ok(size.z>towerExtent.radius*1.6&&size.z<towerExtent.radius*2.2);
 assert.ok(Math.abs(bounds.getCenter(new T.Vector3()).x-towerPosition.x)<.2);
 assert.ok(Math.abs(bounds.getCenter(new T.Vector3()).z-towerPosition.z)<.2);
 let triangles=0;tower.group.traverse(o=>{if(o.isMesh)triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3*(o.isInstancedMesh?o.count:1);});
 assert.ok(triangles>2000,`detailed tower geometry has ${triangles} triangles`);
});

test('all three stream lips meet their waterfall inlets with continuous waves and flow',()=>{
 const water=createWater(),tolerance=1e-5;water.group.updateMatrixWorld(true);
 const row=(mesh,attribute,extreme)=>{
  const phase=mesh.geometry.getAttribute(attribute),flow=mesh.geometry.getAttribute('flowDirection'),positions=mesh.geometry.getAttribute('position');
  assert.ok(phase&&flow&&positions,`${mesh.name} has inlet attributes`);
  const values=Array.from({length:phase.count},(_,i)=>phase.getY(i)),level=extreme(...values),indices=[];
  for(let i=0;i<phase.count;i++)if(Math.abs(phase.getY(i)-level)<tolerance)indices.push(i);
  const across=new T.Vector3(flow.getY(indices[0]),0,-flow.getX(indices[0]));
  return indices.map(i=>({i,position:new T.Vector3().fromBufferAttribute(positions,i).applyMatrix4(mesh.matrixWorld)})).sort((a,b)=>a.position.dot(across)-b.position.dot(across));
 };
 try{for(let number=1;number<=3;number++){
  const channel=water.group.getObjectByName(`Water channel ${number}`),fall=water.group.getObjectByName(`Waterfall ${number} · continuous curved sheet`);
  assert.ok(channel?.isMesh&&fall?.isMesh,`channel and waterfall ${number} exist`);
  const tail=row(channel,'waterData',Math.max),inlet=row(fall,'uv',Math.min);
  assert.ok(tail.length>=3);assert.equal(tail.length,inlet.length,`waterfall ${number} inlet resolution matches`);
  const sourceWidth=tail.at(-1).position.clone().sub(tail[0].position),inletWidth=inlet.at(-1).position.clone().sub(inlet[0].position);
  assert.ok(sourceWidth.distanceTo(inletWidth)<tolerance,`waterfall ${number} lip width and orientation match`);
  for(let j=0;j<tail.length;j++){
   assert.ok(tail[j].position.distanceTo(inlet[j].position)<tolerance,`waterfall ${number}, inlet vertex ${j} closes in world space and height`);
   for(const [source,target]of [['waterData','fallData'],['flowDirection','flowDirection']])for(const component of ['getX','getY']){
    const upstream=channel.geometry.getAttribute(source)[component](tail[j].i),downstream=fall.geometry.getAttribute(target)[component](inlet[j].i);
    assert.ok(Math.abs(upstream-downstream)<tolerance,`waterfall ${number}, inlet vertex ${j}, ${source}.${component} is continuous`);
   }
  }
 }}finally{water.dispose();}
});
