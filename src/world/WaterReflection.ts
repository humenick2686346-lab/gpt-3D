import * as T from 'three';
import type {Quality} from './layout.ts';

/** One shared horizontal reflection for every lake/stream surface. */
export class WaterReflection {
 readonly target=new T.WebGLRenderTarget(384,384,{type:T.HalfFloatType,depthBuffer:true});
 readonly matrix=new T.Matrix4();
 readonly clip=new T.Plane(new T.Vector3(0,1,0),-.55);
 private last=-Infinity;
 private framesSinceCapture=2;
 private quality:Quality='medium';
 private camera:T.Camera|null=null;
 captures=0;
 constructor(){this.target.texture.name='Sakura water · shared planar reflection';}
 setQuality(q:Quality){this.quality=q;const size=q==='high'?512:q==='medium'?384:128;this.target.setSize(size,size);this.last=-Infinity;this.framesSinceCapture=2;}
 capture(renderer:T.WebGLRenderer,scene:T.Scene,camera:T.Camera,water:T.Group,time:number,excluded:T.Object3D[]=[]){
  this.framesSinceCapture++;
  if(this.quality==='low'||this.framesSinceCapture<2||time-this.last<(this.quality==='high'?.08:.16))return;
  this.last=time;this.framesSinceCapture=0;
  // Clone the actual camera type: orthographic projection must stay orthographic.
  if(!this.camera||this.camera.type!==camera.type)this.camera=camera.clone();
  const mirror=this.camera;
  const position=new T.Vector3().setFromMatrixPosition(camera.matrixWorld);
  const direction=camera.getWorldDirection(new T.Vector3());
  position.y=1.14-position.y;direction.y=-direction.y;
  mirror.position.copy(position);mirror.up.copy(camera.up);mirror.up.y*=-1;
  mirror.lookAt(position.clone().add(direction));
  mirror.projectionMatrix.copy(camera.projectionMatrix);mirror.projectionMatrixInverse.copy(camera.projectionMatrixInverse);mirror.updateMatrixWorld(true);
  this.matrix.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1).multiply(mirror.projectionMatrix).multiply(mirror.matrixWorldInverse);
  const previous=renderer.getRenderTarget(),clipping=renderer.clippingPlanes,auto=renderer.shadowMap.autoUpdate,needs=renderer.shadowMap.needsUpdate,xr=renderer.xr.enabled,visible=water.visible;
  const previousVisibility=excluded.map(object=>object.visible);
  try{
   excluded.forEach(object=>object.visible=false);water.visible=false;renderer.xr.enabled=false;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=false;
   renderer.clippingPlanes=[this.clip];renderer.setRenderTarget(this.target);renderer.clear();renderer.render(scene,mirror);this.captures++;
  }finally{
   excluded.forEach((object,index)=>object.visible=previousVisibility[index]);water.visible=visible;renderer.xr.enabled=xr;renderer.shadowMap.autoUpdate=auto;renderer.shadowMap.needsUpdate=needs;renderer.clippingPlanes=clipping;renderer.setRenderTarget(previous);
  }
 }
 dispose(){this.target.dispose();}
}
