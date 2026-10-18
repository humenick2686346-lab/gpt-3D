import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { clamp, terrainHeight } from '../core/math.js';

export const views={
  panorama:{position:[380,155,510],target:[0,130,0]},
  low:{position:[190,5,265],target:[0,155,0]},
  close:{position:[130,143,170],target:[0,167,0]},
};
export class CameraRig {
  constructor(camera,canvas) {
    this.camera=camera;
    this.controls=new OrbitControls(camera,canvas);
    Object.assign(this.controls,{enableDamping:true,dampingFactor:.065,minDistance:100,maxDistance:1400,maxPolarAngle:Math.PI*.62,minPolarAngle:.08,zoomSpeed:.75,panSpeed:.65});
    this.controls.target.fromArray(views.panorama.target);
    camera.position.fromArray(views.panorama.position);this.controls.update();
    this.controls.addEventListener('start',()=>{this.transition=null;});
  }
  setView(name) {
    const view=views[name]||views.panorama;
    this.transition={from:this.camera.position.clone(),to:new THREE.Vector3(...view.position),fromTarget:this.controls.target.clone(),toTarget:new THREE.Vector3(...view.target),progress:0};
    this.currentView=name;
  }
  update(dt) {
    if(this.transition) {
      const t=this.transition;t.progress=Math.min(1,t.progress+dt/1.4);
      const ease=t.progress*t.progress*(3-2*t.progress);
      this.camera.position.lerpVectors(t.from,t.to,ease);
      this.controls.target.lerpVectors(t.fromTarget,t.toTarget,ease);
      if(t.progress===1)this.transition=null;
    }
    this.controls.target.x=clamp(this.controls.target.x,-240,240);
    this.controls.target.z=clamp(this.controls.target.z,-240,240);
    this.controls.target.y=clamp(this.controls.target.y,20,290);
    this.controls.update();
    const p=this.camera.position;
    const floor=terrainHeight(p.x,p.z)+3;
    if(p.y<floor){p.y=floor;this.camera.lookAt(this.controls.target);}
    // Keep the camera outside the structural envelope, including while panning.
    if(p.y<334) {
      const radius=Math.max(8,72*(1-p.y/355));
      const distance=Math.hypot(p.x,p.z);
      if(distance<radius){const f=radius/Math.max(distance,.01);p.x=distance<.01?radius:p.x*f;p.z*=f;this.camera.lookAt(this.controls.target);}
    }
  }
  dispose(){this.controls.dispose();}
}
