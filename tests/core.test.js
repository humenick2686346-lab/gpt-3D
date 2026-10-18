import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { calculateTime } from '../src/systems/time.js';
import { random, formatTime, terrainHeight } from '../src/core/math.js';
import { createTower } from '../src/scene/tower.js';

test('solar cycle is continuous at midnight; noon and midnight have opposite lighting',()=>{
  assert.deepEqual(calculateTime(0),calculateTime(24));
  assert.ok(calculateTime(12).daylight>.99);
  assert.ok(calculateTime(0).night>.99);
  for(let h=0;h<24;h+=.01){
    const a=calculateTime(h),b=calculateTime(h+.01);
    assert.ok(Math.abs(a.daylight-b.daylight)<.03);
    assert.ok(Math.abs(a.night-b.night)<.03);
  }
});
test('time formatting preserves the 24:00 endpoint',()=>{
  assert.equal(formatTime(24),'24:00');assert.equal(formatTime(0),'00:00');assert.equal(formatTime(17.25),'17:15');
});
test('procedural random distribution is reproducible and terrain stays flat under the tower',()=>{
  const a=random(3),b=random(3);for(let i=0;i<100;i++)assert.equal(a(),b());
  assert.equal(terrainHeight(0,0),-.8);assert.equal(terrainHeight(49,0),-.8);
});
test('tower is real metre-scale geometry with exportable steel and observation windows',()=>{
  const tower=createTower();
  const bounds=new THREE.Box3().setFromObject(tower.root);
  assert.ok(Math.abs(bounds.max.y-333)<.01);
  assert.ok(bounds.min.x<-45&&bounds.max.z>45);
  assert.ok(tower.root.children.some(m=>m.name.includes('windows')));
  assert.ok(tower.root.children.length<12,'repeated beams must be merged');
  const steel=tower.root.children.find(m=>m.name.includes('vermilion'));
  assert.ok(steel.geometry.attributes.position.count>1000);
  tower.setNight(1);assert.ok(steel.material.emissiveIntensity>.4);
  tower.setNight(0);assert.equal(steel.material.emissiveIntensity,0);
});
