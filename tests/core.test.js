import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {calculateTime,formatTime,TimeController} from '../src/controllers/TimeController.ts';
import {inside,plantable,waterAt,mountainAt,random,buildings,trees,qualityConfig,edge,height,islandRadiusX,islandRadiusZ} from '../src/world/layout.ts';
import {createIsland} from '../src/world/Island.ts';
import {createMountain} from '../src/world/Mountain.ts';
import {createArchitecture} from '../src/world/Architecture.ts';
import {createShanghaiIsland,shanghaiPosition} from '../src/world/Shanghai.ts';
import {createBambooBridge,bridgePath,bridgeAnchors} from '../src/world/BambooBridge.ts';
import {createWater} from '../src/world/Water.ts';
import {createEgyptIsland,egyptPosition} from '../src/world/Egypt.ts';
import {Vegetation} from '../src/world/Vegetation.ts';
import {createFranceIsland,francePosition} from '../src/world/France.ts';
import {createAustraliaIsland,australiaPosition,australiaExtent} from '../src/world/Australia.ts';
import {createIslandLinks,linkPaths,linkDeckWidth} from '../src/world/IslandLinks.ts';
import {frameScene,framingPoints,viewDirections,targetBounds} from '../src/controllers/CameraController.ts';

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

test('Shanghai island matches Fuji in scale, contains landmarks and joins a U-shaped bamboo bridge',()=>{
 const city=createShanghaiIsland(),bounds=new T.Box3().setFromObject(city.group),size=bounds.getSize(new T.Vector3());
 assert.ok(size.x>25&&size.x<30);assert.ok(size.z>21&&size.z<25);assert.ok(bounds.min.y<-5);assert.ok(bounds.max.y>10);assert.equal(city.counts.orientalPearl,1);assert.equal(city.counts.shanghaiLandmarks,4);
 const bridge=createBambooBridge();assert.ok(bridge.counts.deckSlats>100);assert.ok(bridge.counts.lanterns>0);assert.ok(bridgePath.getPoint(0).distanceTo(bridgeAnchors.fuji)<1e-6);assert.ok(bridgePath.getPoint(1).distanceTo(bridgeAnchors.shanghai)<1e-6);assert.ok(bridgePath.getPoint(.5).z>18);assert.ok(shanghaiPosition.x>30);city.setNight(1);city.update(10);bridge.setNight(1);
});

test('Egypt island has a separate deep sandstone body, real pyramids and an animated oasis',()=>{
 const egypt=createEgyptIsland(),bounds=new T.Box3().setFromObject(egypt.group),size=bounds.getSize(new T.Vector3());
 assert.ok(size.x>24&&size.x<29,`Egypt width ${size.x}`);assert.ok(size.z>20&&size.z<25,`Egypt depth ${size.z}`);
 assert.ok(bounds.min.y<-5&&bounds.max.y>6,`Egypt elevation ${bounds.min.y} to ${bounds.max.y}`);
 assert.ok(bounds.max.z<-islandRadiusZ-4,'Egypt island is clearly separated from the Fuji island');
 assert.ok(Math.abs(bounds.getCenter(new T.Vector3()).x-egyptPosition.x)<1);
 assert.equal(egypt.counts.pyramids,3);assert.equal(egypt.counts.sphinx,1);assert.equal(egypt.counts.oases,1);assert.ok(egypt.counts.palms>=6);
 const rock=egypt.group.getObjectByName('Egypt · layered sandstone cliffs'),oasis=egypt.group.getObjectByName('Egypt · oasis water'),pyramid=egypt.group.getObjectByName('Egypt · Great Pyramid');
 assert.ok(rock?.isMesh&&rock.geometry.attributes.position.count>100,'sandstone cliffs have real geometry');
 assert.ok(oasis?.isMesh&&oasis.geometry.attributes.position.count>20,'oasis has real geometry');
 assert.ok(pyramid,'Great Pyramid is part of the scene');
 const pyramidBounds=new T.Box3().setFromObject(pyramid);assert.ok(pyramidBounds.max.y-pyramidBounds.min.y>4,'pyramid is a three-dimensional structure');
 const waterUniforms=oasis.material.uniforms;assert.ok(waterUniforms?.time&&waterUniforms?.night,'oasis has water animation and light uniforms');
 egypt.update(12);assert.equal(waterUniforms.time.value,12);egypt.setNight(1);assert.equal(waterUniforms.night.value,1);egypt.setNight(0);assert.equal(waterUniforms.night.value,0);
});

test('French island has real Paris landmarks, a passable arch and animated fountain',()=>{
 const france=createFranceIsland(),bounds=new T.Box3().setFromObject(france.group),size=bounds.getSize(new T.Vector3());
 assert.ok(size.x>24&&size.x<28);assert.ok(size.z>20&&size.z<24);assert.ok(bounds.min.y<-5);assert.ok(bounds.max.y>11);
 assert.ok(Math.abs(bounds.getCenter(new T.Vector3()).x-francePosition.x)<1);assert.ok(bounds.max.x<egyptPosition.x-15,'France is separate from Egypt');
 assert.equal(france.counts.eiffelTower,1);assert.equal(france.counts.arcDeTriomphe,1);assert.ok(france.counts.buildings>=8);
 const tower=france.group.getObjectByName('France · Eiffel Tower'),arch=france.group.getObjectByName('France · Arc de Triomphe'),fountain=france.group.getObjectByName('France · fountain water');
 assert.ok(tower&&arch?.isMesh&&fountain?.isMesh);const towerBox=new T.Box3().setFromObject(tower);assert.ok(towerBox.max.y-towerBox.min.y>10);
 france.group.updateMatrixWorld(true);
 const opening=new T.Vector3(0,1,3).applyMatrix4(arch.matrixWorld),pier=new T.Vector3(1.3,1,3).applyMatrix4(arch.matrixWorld),ray=new T.Raycaster(opening,new T.Vector3(0,0,-1),0,6);
 assert.equal(ray.intersectObject(arch).length,0,'the arch opening is physically empty');ray.set(pier,new T.Vector3(0,0,-1));assert.ok(ray.intersectObject(arch).length>0,'the arch has actual supporting piers');
 const lightLevels=()=>{const a=[];france.group.traverse(o=>{if(o.isMesh&&o.material.emissive)a.push(o.material.emissiveIntensity);});return a.reduce((a,b)=>a+b,0);};
 const daylight=lightLevels();france.setNight(1);assert.ok(lightLevels()>daylight+1);assert.equal(fountain.material.uniforms.night.value,1);france.update(21);assert.equal(fountain.material.uniforms.time.value,21);
});

test('all five islands form a connected circuit with continuous bridge decks',()=>{
 const links=createIslandLinks(),edges=[['fuji','shanghai'],...linkPaths.map(l=>[l.from,l.to])],visited=new Set(['fuji']);
 for(let i=0;i<edges.length;i++)for(const[a,b]of edges)if(visited.has(a)||visited.has(b)){visited.add(a);visited.add(b);}
 assert.deepEqual([...visited].sort(),['australia','egypt','france','fuji','shanghai']);assert.equal(new Set(edges.map(e=>e.slice().sort().join(':'))).size,6);
 assert.equal(links.counts.bridges,5);links.group.updateMatrixWorld(true);
 for(const link of linkPaths){
  const mesh=links.group.getObjectByName(`Inter-island bridge · ${link.id} · continuous deck`);assert.ok(mesh?.isMesh);
  const positions=mesh.geometry.getAttribute('position'),endIndex=positions.count-4;
  const center=i=>new T.Vector3().fromBufferAttribute(positions,i).add(new T.Vector3().fromBufferAttribute(positions,i+1)).multiplyScalar(.5);
  assert.ok(center(0).distanceTo(link.start)<1e-5);assert.ok(center(endIndex).distanceTo(link.end)<1e-5);
  const width=new T.Vector3().fromBufferAttribute(positions,0).distanceTo(new T.Vector3().fromBufferAttribute(positions,1));assert.ok(Math.abs(width-linkDeckWidth)<1e-5);
  for(let i=1;i<20;i++){
   const point=link.curve.getPointAt(i/20),ray=new T.Raycaster(point.clone().add(new T.Vector3(0,2,0)),new T.Vector3(0,-1,0),0,3),hits=ray.intersectObject(mesh);
   assert.ok(hits.length>0,`${link.id} deck is walkable at ${i}/20`);assert.ok(Math.abs(hits[0].point.y-point.y)<.04);
  }
 }
});

test('five-island cameras contain the full world on desktop and mobile',()=>{
 for(const [width,height]of [[900,640],[1600,1000],[390,844]])for(const [view,coordinates]of Object.entries(viewDirections)){
  const direction=new T.Vector3(...coordinates),fit=frameScene(direction,width,height),camera=new T.OrthographicCamera(-fit.span*width/height/2,fit.span*width/height/2,fit.span/2,-fit.span/2,.1,650);
  camera.position.copy(direction).add(fit.target);camera.lookAt(fit.target);camera.updateMatrixWorld(true);camera.updateProjectionMatrix();
  for(const axis of ['x','y','z'])assert.ok(fit.target[axis]>=targetBounds[axis][0]&&fit.target[axis]<=targetBounds[axis][1],`${view} fitted target must not be moved by the navigation clamp`);
  for(const point of framingPoints()){
   const projected=point.clone().project(camera);assert.ok(Math.abs(projected.x)<.99&&Math.abs(projected.y)<.99&&Math.abs(projected.z)<1,`${width}x${height} ${view}: clipped ${point.toArray()}`);
  }
 }
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

test('Sydney has curved Opera House shells, an open harbour bridge and a moving ferry',()=>{
 const city=createAustraliaIsland(),box=new T.Box3().setFromObject(city.group),size=box.getSize(new T.Vector3());
 assert.ok(size.x>24&&size.x<27);assert.ok(size.z>20&&size.z<23);assert.ok(box.min.y<-5&&box.max.y>10);
 assert.ok(box.max.x<australiaPosition.x+australiaExtent.radiusX);assert.ok(box.min.x>australiaPosition.x-australiaExtent.radiusX);
 const opera=city.group.getObjectByName('Australia · Sydney Opera House'),bridge=city.group.getObjectByName('Australia · Sydney Harbour Bridge'),tower=city.group.getObjectByName('Australia · Sydney Tower Eye'),water=city.group.getObjectByName('Australia · moving Sydney harbour'),boat=city.group.getObjectByName('Australia · harbour ferry');
 assert.ok(opera&&bridge&&tower&&water?.isMesh&&boat);assert.ok(new T.Box3().setFromObject(opera).getSize(new T.Vector3()).y>5);
 const shells=opera.children.find(o=>o.material.customProgramCacheKey()==='sydney-ceramic-roof-v1'),pos=shells?.geometry.getAttribute('position');
 assert.ok(pos?.count>5000,'shells are tessellated surfaces');for(const n of pos.array)assert.ok(Number.isFinite(n),'shell vertices must be finite');
 city.group.updateMatrixWorld(true);
 // A horizontal ray below the road must cross the shipping channel unhindered.
 const ray=new T.Raycaster(new T.Vector3(australiaPosition.x-7,1.1,australiaPosition.z+5.4),new T.Vector3(1,0,0),0,4.5);
 assert.equal(ray.intersectObject(bridge,true).length,0,'the channel beneath the deck stays open');
 const initial=boat.position.clone();city.update(30);assert.ok(boat.position.distanceTo(initial)>.5);assert.equal(water.material.uniforms.time.value,30);
 const levels=()=>{let n=0;city.group.traverse(o=>{if(o.isMesh&&o.material.emissive)n+=o.material.emissiveIntensity;});return n;};
 for(let t=0;t<115;t+=2){city.update(t);const radius=Math.hypot(boat.position.x/12.4,(boat.position.z-.2)/10.4);assert.ok(radius>.63&&radius<.83,'the ferry stays between both harbour quays');}
 city.update(0);const loopStart=boat.position.clone();city.update(2*Math.PI/.055);assert.ok(Math.hypot(boat.position.x-loopStart.x,boat.position.z-loopStart.z)<1e-6,'the ferry route closes without reversing');
 const day=levels();city.setNight(1);assert.ok(levels()>day+1);assert.equal(water.material.uniforms.night.value,1);
});

test('both Sydney connections have dry land beneath the full width of each landing',()=>{
 const islands={australia:createAustraliaIsland().group,egypt:createEgyptIsland().group,shanghai:createShanghaiIsland().group};
 for(const island of Object.values(islands))island.updateMatrixWorld(true);
 for(const link of linkPaths.filter(l=>l.from==='australia'||l.to==='australia'))for(const [id,t]of [[link.from,0],[link.to,1]]){
  const p=link.curve.getPointAt(t),direction=link.curve.getTangentAt(t),across=new T.Vector3(direction.z,0,-direction.x).normalize();
  for(const offset of [-linkDeckWidth/2,0,linkDeckWidth/2]){
   const start=p.clone().addScaledVector(across,offset).add(new T.Vector3(0,.15,0)),ray=new T.Raycaster(start,new T.Vector3(0,-1,0),0,.4),hits=ray.intersectObject(islands[id],true);
   assert.ok(hits.length>0,`${link.id} ${id} landing ${offset} rests on the island`);assert.ok(!/water|harbour|oasis/i.test(hits[0].object.name),'bridge arrival must be dry');
  }
 }
});
