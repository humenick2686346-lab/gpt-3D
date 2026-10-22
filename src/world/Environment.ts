import * as T from 'three';
import {createSky} from '../scene/sky.js';
import {Batch,toon} from './materials.ts';
import {calculateTime} from '../controllers/TimeController.ts';
import {random,islandRadiusX,islandRadiusZ,type Weather} from './layout.ts';
export class Environment{
 sky=createSky();sun=new T.DirectionalLight('#fff0d6',2.5);moon=new T.DirectionalLight('#9ab4f1',.3);ambient=new T.HemisphereLight('#d1edfa','#826f8b',2);clouds:T.Group[]=[];horizon=new T.Color();night=0;day=1;
 constructor(public scene:T.Scene){
  this.sky.sky.scale.setScalar(.025);this.sky.stars.scale.setScalar(.025);scene.add(this.sky.sky,this.sky.stars);this.sun.position.set(-12,19,8);this.sun.castShadow=true;Object.assign(this.sun.shadow.camera,{left:-19,right:19,top:19,bottom:-19,near:.5,far:65});this.sun.shadow.bias=-.00025;this.sun.shadow.normalBias=.035;this.sun.shadow.mapSize.set(2048,2048);this.moon.position.set(12,16,-10);scene.add(this.sun,this.sun.target,this.moon,this.ambient);scene.fog=new T.FogExp2('#b6dfe5',.004);
  const cloudMat=new T.MeshBasicMaterial({color:'#e7f4f6',transparent:true,opacity:.42,depthWrite:false});const rand=random(601);for(let j=0;j<7;j++){const b=new Batch();for(let i=0;i<10;i++)b.ball(cloudMat,[(rand()-.5)*6,(rand()-.5)*1.3,(rand()-.5)*3],[1.1+rand()*1.3,.7+rand()*.7,1+rand()]);const g=b.flush('Drifting cloud bank',false);const a=j/7*Math.PI*2;g.position.set(Math.cos(a)*(islandRadiusX+5),-5.5+(j%2)*1.8,Math.sin(a)*(islandRadiusZ+4));g.userData.base=g.position.clone();scene.add(g);this.clouds.push(g);}
 }
 apply(hour:number,weather:Weather,intensity:number){const s=calculateTime(hour);this.night=s.night;this.day=s.daylight;const cover=weather==='sun'?0:.25+intensity*.65;
  const top=new T.Color('#111e46').lerp(new T.Color('#79c6df'),s.daylight).lerp(new T.Color('#9299cc'),s.golden*.5);this.horizon.set('#364365').lerp(new T.Color('#ddf0ec'),s.daylight).lerp(new T.Color('#ffd5b2'),s.golden*.8);const gray=new T.Color('#202d49').lerp(new T.Color(weather==='snow'?'#c9d9e7':'#859eae'),s.daylight);top.lerp(gray,cover*.75);this.horizon.lerp(gray,cover*.65);
  const u=this.sky.sky.material.uniforms;u.topColor.value.copy(top);u.horizonColor.value.copy(this.horizon);u.sunDirection.value.set(-Math.cos(s.angle),s.elevation,-.4).normalize();u.daylight.value=s.daylight;u.night.value=s.night;u.cloudCover.value=.22+cover*.65;
  this.sun.position.set(-Math.cos(s.angle)*22,s.elevation*26,-8);this.sun.color.set('#fff1d6').lerp(new T.Color('#ffac7d'),s.golden);this.sun.intensity=s.daylight*(2.6-cover*1.7);this.ambient.color.copy(top).lerp(new T.Color('#e7e9f4'),.6);this.ambient.intensity=.85+s.daylight*(1.65-cover*.35);this.ambient.groundColor.set(weather==='snow'?'#8798ad':'#8d7d89');this.moon.intensity=s.night*.6;this.scene.fog!.color.copy(this.horizon);(this.scene.fog as T.FogExp2).density=.003+cover*.006;return s;
 }
 update(t:number){this.sky.update(t,this.night);this.clouds.forEach((g,i)=>{g.position.x=g.userData.base.x+Math.sin(t*.025+i)*.7;g.position.z=g.userData.base.z+Math.cos(t*.02+i)*.4;});}
}
