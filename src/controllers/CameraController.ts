import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {height,edge,trees,islandRadiusX,islandRadiusZ,streamX,streamEndZ,eastOutletX,westFall} from '../world/layout.ts';
import {shanghaiPosition,shanghaiExtent} from '../world/Shanghai.ts';
import {bridgeExtent} from '../world/BambooBridge.ts';
import {egyptPosition,egyptExtent} from '../world/Egypt.ts';
import {francePosition,franceExtent} from '../world/France.ts';
import {linksExtent} from '../world/IslandLinks.ts';
export type View='hero'|'front'|'top'|'side';
export const viewDirections:Record<View,[number,number,number]>={hero:[12,32,54],front:[0,24,70],top:[.01,80,.01],side:[90,22,.02]};
export const targetBounds={x:[-35,55],y:[-30,30],z:[-52,25]};
export function framingPoints(){
 const points:T.Vector3[]=[];
 for(let i=0;i<96;i++){const a=i/96*Math.PI*2;for(const [r,y]of [[1,0],[.9,-2],[.5,-4.5]]){const x=Math.cos(a)*islandRadiusX*edge(a)*r,z=Math.sin(a)*islandRadiusZ*edge(a)*r;points.push(new T.Vector3(x,y===0?height(x,z):y,z));}}
 for(const[x,z]of trees)points.push(new T.Vector3(x,height(x,z)+2.4,z));
 points.push(new T.Vector3(-.6,5.8,-5.65),new T.Vector3(-5.7,4.9,-2.4),new T.Vector3(streamX(streamEndZ)+.2,-6.1,streamEndZ+.85),new T.Vector3(eastOutletX+.85,-6.1,-3.4),new T.Vector3(westFall.x-.55,-6.1,westFall.z+.65));
 for(const [position,extent]of [[shanghaiPosition,shanghaiExtent],[egyptPosition,egyptExtent],[francePosition,franceExtent]] as const){
  for(let i=0;i<96;i++){const a=i/96*Math.PI*2;for(const [scale,y]of [[1,0],[1,-extent.baseDepth],[.55,extent.height]])points.push(new T.Vector3(position.x+Math.cos(a)*extent.radiusX*scale,position.y+y,position.z+Math.sin(a)*extent.radiusZ*scale));}
 }
 for(const bounds of [bridgeExtent,linksExtent])for(const x of [bounds.min[0],bounds.max[0]])for(const z of [bounds.min[2],bounds.max[2]])for(const y of [bounds.min[1],bounds.max[1]])points.push(new T.Vector3(x,y,z));
 return points;
}
/** Fit into the viewport area left clear by the header, weather and camera controls. */
export function frameScene(position:T.Vector3,width:number,viewportHeight:number){
 const cam=new T.OrthographicCamera(-1,1,1,-1,.1,650);cam.position.copy(position);cam.lookAt(0,0,0);cam.updateMatrixWorld(true);
 let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
 for(const point of framingPoints()){const p=point.applyMatrix4(cam.matrixWorldInverse);minX=Math.min(minX,p.x);maxX=Math.max(maxX,p.x);minY=Math.min(minY,p.y);maxY=Math.max(maxY,p.y);}
 const desktop=width>700,aspect=width/viewportHeight;
 const left=desktop?24:18,right=width-(desktop?(width>1200?228:186):18);
 const top=Math.min(viewportHeight*.3,desktop?106:258),bottom=viewportHeight-Math.min(viewportHeight*.28,desktop?174:158);
 const usableX=Math.max(.3,(right-left)/width),usableY=Math.max(.25,(bottom-top)/viewportHeight);
 const span=Math.max((maxX-minX)/(aspect*usableX),(maxY-minY)/usableY)*1.035;
 const screenCenterX=(left+right)/width-1,screenCenterY=1-(top+bottom)/viewportHeight;
 const up=new T.Vector3(0,1,0).applyQuaternion(cam.quaternion),rightVector=new T.Vector3(1,0,0).applyQuaternion(cam.quaternion);
 const target=rightVector.multiplyScalar((minX+maxX)*.5-screenCenterX*span*aspect*.5).add(up.multiplyScalar((minY+maxY)*.5-screenCenterY*span*.5));
 return {span,target};
}
export class CameraController{
 camera:T.OrthographicCamera;controls:OrbitControls;view:View='hero';moving=false;from=new T.Vector3();to=new T.Vector3();startTarget=new T.Vector3();endTarget=new T.Vector3();progress=0;span=20;startSpan=20;endSpan=20;
 readonly views=viewDirections;
 constructor(camera:T.OrthographicCamera,canvas:HTMLCanvasElement){this.camera=camera;this.controls=new OrbitControls(camera,canvas);this.controls.enableDamping=true;this.controls.dampingFactor=.07;this.controls.minPolarAngle=.015;this.controls.maxPolarAngle=Math.PI*.49;this.controls.minZoom=.65;this.controls.maxZoom=7;this.controls.autoRotateSpeed=.28;this.controls.screenSpacePanning=true;this.controls.addEventListener('start',()=>{this.moving=false;});this.setView('hero',true);}
 fit(position:T.Vector3){return frameScene(position,innerWidth,innerHeight);}
 setView(view:View,instant=false){this.view=view;this.controls.autoRotate=false;this.camera.zoom=1;const pos=new T.Vector3(...this.views[view]);const fitted=this.fit(pos);this.from.copy(this.camera.position);this.to.copy(pos).add(fitted.target);this.startTarget.copy(this.controls.target);this.endTarget.copy(fitted.target);this.startSpan=this.span;this.endSpan=fitted.span;this.progress=0;this.moving=!instant;if(instant){this.camera.position.copy(this.to);this.controls.target.copy(fitted.target);this.span=fitted.span;this.resize(false);this.controls.update();}}
 resize(refit=true){if(refit){const direction=this.camera.position.clone().sub(this.controls.target),f=this.fit(direction);this.span=f.span;this.endSpan=f.span;if(!this.moving){this.camera.position.copy(direction).add(f.target);this.controls.target.copy(f.target);this.controls.update();}}const aspect=innerWidth/innerHeight;this.camera.left=-this.span*aspect/2;this.camera.right=this.span*aspect/2;this.camera.top=this.span/2;this.camera.bottom=-this.span/2;this.camera.updateProjectionMatrix();}
 update(delta:number){if(this.moving){this.progress=Math.min(1,this.progress+delta*1.2);const t=this.progress*this.progress*(3-2*this.progress);this.camera.position.lerpVectors(this.from,this.to,t);this.controls.target.lerpVectors(this.startTarget,this.endTarget,t);this.span=T.MathUtils.lerp(this.startSpan,this.endSpan,t);this.resize(false);if(this.progress>=1)this.moving=false;}this.controls.target.x=T.MathUtils.clamp(this.controls.target.x,...targetBounds.x as [number,number]);this.controls.target.z=T.MathUtils.clamp(this.controls.target.z,...targetBounds.z as [number,number]);this.controls.target.y=T.MathUtils.clamp(this.controls.target.y,...targetBounds.y as [number,number]);this.controls.update(Math.min(delta,.1));}
 dispose(){this.controls.dispose();}
}
