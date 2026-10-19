import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {calculateTime,formatTime,TimeController} from '../src/controllers/TimeController.ts';
import {inside,plantable,waterAt,mountainAt,random,buildings,trees,qualityConfig} from '../src/world/layout.ts';
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
test('compact closed rock body, proportionate Fuji and substantial underside',()=>{
 const island=new T.Box3().setFromObject(createIsland()),mountain=new T.Box3().setFromObject(createMountain());
 assert.ok(island.max.x-island.min.x<22);assert.ok(island.max.z-island.min.z<20);assert.ok(island.min.y<-4.5);assert.ok(mountain.max.y<6);assert.ok(mountain.max.y>4);
});
test('dense, reproducible planting area respects water, paths and building clearances',()=>{
 const rng=random(77);let land=0,planted=0;for(let i=0;i<20000;i++){const x=(rng()-.5)*20,z=(rng()-.5)*18;if(inside(x,z)&&!waterAt(x,z)&&!mountainAt(x,z)){land++;if(plantable(x,z))planted++;}}
 const coverage=planted/land;assert.ok(coverage>.6&&coverage<.82,`plantable share ${coverage}`);
 const a=random(123),b=random(123);for(let i=0;i<100;i++)assert.equal(a(),b());
 for(const building of buildings)assert.ok(!plantable(building.x,building.z));
});
test('real instanced flowers, dense cherry grove and full architectural ensemble',()=>{
 const v=new Vegetation('medium'),architecture=createArchitecture();assert.equal(trees.length,29);assert.equal(architecture.counts.buildings,9);assert.equal(architecture.counts.bridges,2);assert.equal(architecture.counts.torii,2);
 assert.ok(v.flowers.every(m=>m.isInstancedMesh&&m.geometry.attributes.position.count>100));
 assert.ok(v.count>=qualityConfig.medium.flowers-4);v.setQuality('low');assert.ok(v.count>=6496&&v.count<=6500);v.setQuality('high');assert.equal(v.count,16500);
 let meshes=0;architecture.group.traverse(o=>{if(o.isMesh){meshes++;assert.ok(o.geometry.attributes.position.count>100);}});assert.ok(meshes>=7&&meshes<15);
});
