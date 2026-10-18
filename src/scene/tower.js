import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Each unit is one metre. The main deck is at 150 m; the antenna ends at 333 m.
export function createTower() {
  const root = new THREE.Group(); root.name = 'Tokyo Tower · 333m';
  const steel = new THREE.MeshStandardMaterial({ color: 0xe65329, metalness: .62, roughness: .39 });
  const white = new THREE.MeshStandardMaterial({ color: 0xe9e4da, metalness: .48, roughness: .43 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x303b40, metalness: .7, roughness: .28 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x273f47, metalness: .72, roughness: .18, emissive: 0xffc77d, emissiveIntensity: .05 });
  const lamps = new THREE.MeshStandardMaterial({ color: 0xffd39d, emissive: 0xffac48, emissiveIntensity: .3, roughness: .4 });
  const concrete = new THREE.MeshStandardMaterial({ color: 0x9b9a8d, roughness: .85 });
  const bins = new Map([[steel, []], [white, []], [dark, []], [glass, []], [lamps, []], [concrete, []]]);
  const unit = new THREE.BoxGeometry(1, 1, 1);
  const up = new THREE.Vector3(0, 1, 0);
  const matrix = new THREE.Matrix4(), quaternion = new THREE.Quaternion();
  function box(material, x, y, z, sx, sy, sz) {
    matrix.compose(new THREE.Vector3(x, y, z), new THREE.Quaternion(), new THREE.Vector3(sx, sy, sz));
    bins.get(material).push(unit.clone().applyMatrix4(matrix));
  }
  function beam(a, b, thickness, material = steel) {
    const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b), direction = end.clone().sub(start);
    quaternion.setFromUnitVectors(up, direction.clone().normalize());
    matrix.compose(start.add(end).multiplyScalar(.5), quaternion, new THREE.Vector3(thickness, direction.length(), thickness));
    bins.get(material).push(unit.clone().applyMatrix4(matrix));
  }
  const levels = [[0, 49], [32, 39], [68, 29], [105, 22], [145, 16], [183, 12.3], [219, 8.5], [250, 5.3], [278, 2.8]];
  for (let tier = 0; tier < levels.length - 1; tier++) {
    const [y0, w0] = levels[tier], [y1, w1] = levels[tier + 1];
    const m = tier === 5 || tier === 7 ? white : steel;
    const thickness = Math.max(.38, 1.65 - y0 * .0045);
    for (const [sx, sz] of [[1,1], [-1,1], [-1,-1], [1,-1]]) {
      beam([sx*w0,y0,sz*w0], [sx*w1,y1,sz*w1], thickness, m);
      // Twin rails make the large lower legs read as engineered steel girders.
      if (tier < 4) beam([sx*(w0-1.4),y0,sz*(w0-1.4)], [sx*(w1-1.1),y1,sz*(w1-1.1)], .65, m);
    }
    const divisions = tier < 4 ? 3 : 2;
    for (let sub = 0; sub < divisions; sub++) {
      const t0 = sub/divisions, t1 = (sub+1)/divisions;
      const ya = THREE.MathUtils.lerp(y0,y1,t0), yb = THREE.MathUtils.lerp(y0,y1,t1);
      const wa = THREE.MathUtils.lerp(w0,w1,t0), wb = THREE.MathUtils.lerp(w0,w1,t1);
      const cornersA = [[-wa,ya,-wa],[wa,ya,-wa],[wa,ya,wa],[-wa,ya,wa]];
      const cornersB = [[-wb,yb,-wb],[wb,yb,-wb],[wb,yb,wb],[-wb,yb,wb]];
      for (let side=0;side<4;side++) {
        const j=(side+1)%4;
        beam(cornersB[side], cornersB[j], thickness*.6, m);
        // Leave the central opening at the foot of each face clear, like the real tower.
        if (!(tier===0 && sub===0)) {
          beam(cornersA[side], cornersB[j], thickness*.39, m);
          beam(cornersA[j], cornersB[side], thickness*.39, m);
        } else {
          const mid=[(cornersB[side][0]+cornersB[j][0])*.5,yb,(cornersB[side][2]+cornersB[j][2])*.5];
          beam(cornersA[side],mid,.75,m); beam(cornersA[j],mid,.75,m);
        }
      }
    }
  }
  // Ground feet, inspection ladders and central service core.
  for (const x of [-49,49]) for (const z of [-49,49]) {
    box(concrete,x,.5,z,9,2,9);
    box(steel,x,2,z,6,1,6);
  }
  box(dark,0,74,0,4,142,4);
  for(let y=16;y<272;y+=2.8) beam([3,y,3],[5,y,3],.12,white);
  beam([3,16,3],[3,273,3],.13,white); beam([5,16,3],[5,273,3],.13,white);
  function deck(y, width, height, upper=false) {
    box(white,0,y-height*.5,0,width+2,1.4,width+2);
    box(steel,0,y+height*.5,0,width+3,1.5,width+3);
    box(dark,0,y,0,width-1,height,width-1);
    const count=upper ? 7 : 17;
    for(let side=0;side<4;side++) for(let i=0;i<count;i++) {
      const a=(i-(count-1)*.5)*(width/count);
      const edge=width*.5;
      const horizontal=side%2===0;
      const x=horizontal?a:(side===1?edge:-edge), z=horizontal?(side===0?edge:-edge):a;
      box(glass,x,y,z,horizontal?width/count*.78:.3,height*.64,horizontal?.3:width/count*.78);
      box(lamps,x,y-height*.31,z,horizontal?width/count*.72:.34,.16,horizontal?.34:width/count*.72);
    }
    // Roof equipment and perimeter railings.
    for(const s of [-1,1]) {
      beam([-width*.5,y+height*.5+2,s*width*.5],[width*.5,y+height*.5+2,s*width*.5],.15,white);
      beam([s*width*.5,y+height*.5+2,-width*.5],[s*width*.5,y+height*.5+2,width*.5],.15,white);
    }
    for(let i=-2;i<=2;i++) box(white,i*3.1,y+height*.5+1.5,0,1.7,1.8,2.4);
  }
  deck(148,44,11); deck(250,17,9,true);
  box(white,0,138,0,39,1.4,39);
  box(steel,0,157,0,32,1.3,32);
  // Red-white antenna mast and four auxiliary antenna rods.
  for(let y=278;y<328;y+=5) {
    const material=Math.floor((y-278)/5)%2===0?white:steel;
    box(material,0,y+2.5,0,Math.max(.55,3.8-(y-278)*.067),5,Math.max(.55,3.8-(y-278)*.067));
  }
  beam([0,328,0],[0,333,0],.28,white);
  for(const s of [-1,1]) { beam([s*3,271,0],[s*3,289,0],.24,white); beam([0,271,s*3],[0,289,s*3],.24,white); }
  const beacon=new THREE.Mesh(new THREE.SphereGeometry(.75,8,6),new THREE.MeshBasicMaterial({color:0xff4936}));
  beacon.position.y=330; root.add(beacon);
  // Small floodlight fittings along the frame; illumination comes from emissive steel.
  for(let tier=1;tier<levels.length-1;tier++) {
    const [y,w]=levels[tier];
    for(const x of [-w,w]) for(const z of [-w,w]) box(lamps,x,y+.5,z,1.5,.45,1.5);
  }
  for(const [mat, geometries] of bins) {
    if(!geometries.length) continue;
    const geometry=mergeGeometries(geometries);
    const mesh=new THREE.Mesh(geometry,mat); mesh.name=`Tower ${mat===steel?'vermilion steel':mat===white?'ivory steel':mat===glass?'observation windows':mat===lamps?'architectural lights':'structure'}`;
    mesh.castShadow=true; mesh.receiveShadow=true; root.add(mesh);
    geometries.forEach(g=>g.dispose());
  }
  unit.dispose();
  // Separate snow caps are toggled with the weather, excluded from the exported architecture.
  const snow = new THREE.Group(); snow.name='Temporary snow';
  for(const [y,w] of [[154.4,47],[255.4,20],[158,34]]) {
    const cap=new THREE.Mesh(new THREE.BoxGeometry(w,.25,w),new THREE.MeshStandardMaterial({color:0xe9f3fa,roughness:.95}));
    cap.position.y=y; snow.add(cap);
  }
  snow.visible=false;
  return { root, snow, setNight(value) {
    steel.emissive.set(0xff6a12); steel.emissiveIntensity=value*.52;
    white.emissive.set(0xffb155); white.emissiveIntensity=value*.36;
    glass.emissiveIntensity=.025+value*.95;
    lamps.emissiveIntensity=.15+value*3.2;
  }};
}
