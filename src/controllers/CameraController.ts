import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {height,edge,trees} from '../world/layout.ts';
export type View='hero'|'front'|'top'|'side';
export class CameraController{
 controls:OrbitControls;view:View='hero';moving=false;from=new T.Vector3();to=new T.Vector3();startTarget=new T.Vector3();endTarget=new T.Vector3();progress=0;span=20;startSpan=20;endSpan=20;
 readonly views={hero:[17,15,29],front:[0,12,34],top:[.01,37,.01],side:[35,7,.01]};
 constructor(public camera:T.OrthographicCamera,canvas:HTMLCanvasElement){this.controls=new OrbitControls(camera,canvas);this.controls.enableDamping=true;this.controls.dampingFactor=.07;this.controls.minPolarAngle=.015;this.controls.maxPolarAngle=Math.PI*.49;this.controls.minZoom=.65;this.controls.maxZoom=3.6;this.controls.autoRotateSpeed=.28;this.controls.screenSpacePanning=true;this.controls.addEventListener('start',()=>{this.moving=false;});this.setView('hero',true);}
 fit(position:T.Vector3){
  const cam=this.camera.clone();cam.position.copy(position);cam.lookAt(0,0,0);cam.updateMatrixWorld(true);let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
  const points:T.Vector3[]=[];for(let i=0;i<96;i++){const a=i/96*Math.PI*2;for(const [r,y]of [[1,0],[.9,-2],[.5,-4.5]]){const x=Math.cos(a)*10*edge(a)*r,z=Math.sin(a)*8.6*edge(a)*r;points.push(new T.Vector3(x,y===0?height(x,z):y,z));}}for(const[x,z]of trees)points.push(new T.Vector3(x,height(x,z)+2.4,z));points.push(new T.Vector3(-.6,4.6,-5.65),new T.Vector3(-5.7,4.9,-2.4),new T.Vector3(2.8,-5.9,8.5));
  for(const p of points){p.applyMatrix4(cam.matrixWorldInverse);minX=Math.min(minX,p.x);maxX=Math.max(maxX,p.x);minY=Math.min(minY,p.y);maxY=Math.max(maxY,p.y);}
  const aspect=innerWidth/innerHeight,span=Math.max((maxX-minX)/(aspect*.83),(maxY-minY)/.88);const up=new T.Vector3(0,1,0).applyQuaternion(cam.quaternion);const target=up.multiplyScalar((minY+maxY)*.5-span*.005);return {span,target};
 }
 setView(view:View,instant=false){this.view=view;this.controls.autoRotate=false;this.camera.zoom=1;const pos=new T.Vector3(...this.views[view]);const fitted=this.fit(pos);this.from.copy(this.camera.position);this.to.copy(pos).add(fitted.target);this.startTarget.copy(this.controls.target);this.endTarget.copy(fitted.target);this.startSpan=this.span;this.endSpan=fitted.span;this.progress=0;this.moving=!instant;if(instant){this.camera.position.copy(this.to);this.controls.target.copy(fitted.target);this.span=fitted.span;this.resize(false);this.controls.update();}}
 resize(refit=true){if(refit){const f=this.fit(this.camera.position.clone().sub(this.controls.target));this.span=f.span;this.endSpan=f.span;}const aspect=innerWidth/innerHeight;this.camera.left=-this.span*aspect/2;this.camera.right=this.span*aspect/2;this.camera.top=this.span/2;this.camera.bottom=-this.span/2;this.camera.updateProjectionMatrix();}
 update(delta:number){if(this.moving){this.progress=Math.min(1,this.progress+delta*1.2);const t=this.progress*this.progress*(3-2*this.progress);this.camera.position.lerpVectors(this.from,this.to,t);this.controls.target.lerpVectors(this.startTarget,this.endTarget,t);this.span=T.MathUtils.lerp(this.startSpan,this.endSpan,t);this.resize(false);if(this.progress>=1)this.moving=false;}this.controls.target.x=T.MathUtils.clamp(this.controls.target.x,-4,4);this.controls.target.z=T.MathUtils.clamp(this.controls.target.z,-4,4);this.controls.target.y=T.MathUtils.clamp(this.controls.target.y,-3,4);this.controls.update(Math.min(delta,.1));}
 dispose(){this.controls.dispose();}
}
