import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {calculateTime,formatTime,TimeController} from '../src/controllers/TimeController.ts';
import {inside,plantable,waterAt,mountainAt,random,buildings,trees,qualityConfig,edge,height,islandRadiusX,islandRadiusZ} from '../src/world/layout.ts';
import {createIsland} from '../src/world/Island.ts';
import {createMountain} from '../src/world/Mountain.ts';
import {createArchitecture} from '../src/world/Architecture.ts';
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
