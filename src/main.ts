import * as T from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {createIsland} from './world/Island.ts';
import {createMountain} from './world/Mountain.ts';
import {Vegetation} from './world/Vegetation.ts';
import {createArchitecture} from './world/Architecture.ts';
import {createWater} from './world/Water.ts';
import {Environment} from './world/Environment.ts';
import {WeatherSystem} from './world/Weather.ts';
import {uniforms} from './world/materials.ts';
import {qualityConfig,type Quality,type Weather} from './world/layout.ts';
import {CameraController,type View} from './controllers/CameraController.ts';
import {TimeController} from './controllers/TimeController.ts';
import {downloadHTML,downloadOffline,downloadSource} from './controllers/Downloads.ts';
import {createUI} from './ui/UI.ts';
import './style.css';
const ui=createUI();ui.el('reload').onclick=()=>location.reload();
try{start(new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'}));}catch(error){console.error(error);ui.fatal('浏览器无法创建 WebGL 2 场景。请启用硬件加速，并使用最新版 Chrome 或 Edge。');}
function start(renderer:T.WebGLRenderer){
 renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.13;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;
 const canvas=renderer.domElement;canvas.tabIndex=0;canvas.setAttribute('aria-label','樱梦浮岛：鼠标拖动旋转，滚轮缩放，右键平移');ui.el('scene').append(canvas);
 const state={weather:'sun' as Weather,intensity:.65,quality:'medium' as Quality,uiVisible:true};const intensities={rain:.65,snow:.65};
 const scene=new T.Scene(),camera=new T.OrthographicCamera(-20,20,12,-12,.1,350);const env=new Environment(scene),time=new TimeController();
 const island=createIsland(),mountain=createMountain(),vegetation=new Vegetation(state.quality),architecture=createArchitecture(),water=createWater();scene.add(island,mountain,vegetation.group,architecture.group,water.group);
 const weather=new WeatherSystem(scene,state.quality),rig=new CameraController(camera,canvas);
 const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));const bloom=new UnrealBloomPass(new T.Vector2(innerWidth,innerHeight),.18,.45,1.05);composer.addPass(bloom);composer.addPass(new OutputPass());
 let dpr=1,elapsed=0,fps=0,frames=0,frameTime=0,last=performance.now(),lost=false,disposed=false,adaptTime=0,drawCalls=0,triangles=0;
 const cleanups:(()=>void)[]=[];function on(target:EventTarget,type:string,fn:(e:any)=>void){target.addEventListener(type,fn);cleanups.push(()=>target.removeEventListener(type,fn));}
 function resize(){renderer.setPixelRatio(dpr);renderer.setSize(innerWidth,innerHeight);composer.setPixelRatio(dpr);composer.setSize(innerWidth,innerHeight);rig.resize();}
 function setQuality(q:Quality){state.quality=q;const c=qualityConfig[q];vegetation.setQuality(q);weather.setQuality(q);dpr=Math.min(devicePixelRatio,c.dpr);env.sun.shadow.mapSize.set(c.shadow,c.shadow);env.sun.shadow.map?.dispose();env.sun.shadow.map=null;renderer.shadowMap.needsUpdate=true;bloom.enabled=c.bloom;ui.el<HTMLSelectElement>('quality').value=q;resize();}
 function applyTime(){const s=env.apply(time.hour,state.weather,state.intensity);architecture.setNight(s.night);uniforms.wet.value=state.weather==='rain'?state.intensity:0;uniforms.snow.value=state.weather==='snow'?state.intensity*.68:0;ui.time(time.hour);renderer.shadowMap.needsUpdate=true;}
 function selectWeather(mode:Weather){if(state.weather!=='sun')intensities[state.weather]=state.intensity;state.weather=mode;state.intensity=mode==='sun'?.65:intensities[mode];weather.set(mode,state.intensity);ui.weather(mode,state.intensity);applyTime();}
 function togglePlay(){time.playing=!time.playing;ui.play(time.playing);}
 function toggleUI(visible=!state.uiVisible){state.uiVisible=visible;ui.el('interface').inert=!visible;document.body.classList.toggle('ui-hidden',!visible);ui.el('show-ui').hidden=visible;if(!visible)ui.el('show-ui').focus();}
 function setView(view:View){rig.setView(view);ui.el('orbit').setAttribute('aria-pressed','false');document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(b=>{const active=b.dataset.view===view;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});}
 on(window,'resize',resize);on(ui.el('time'),'input',e=>{time.set(Number(e.target.value));ui.play(false);applyTime();});on(ui.el('play'),'click',togglePlay);
 document.querySelectorAll<HTMLButtonElement>('[data-weather]').forEach(b=>on(b,'click',()=>selectWeather(b.dataset.weather as Weather)));
 on(ui.el('intensity'),'input',e=>{state.intensity=Number(e.target.value)/100;weather.set(state.weather,state.intensity);ui.weather(state.weather,state.intensity);applyTime();});
 document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(b=>on(b,'click',()=>setView(b.dataset.view as View)));on(ui.el('reset'),'click',()=>setView('hero'));
 on(ui.el('orbit'),'click',()=>{rig.moving=false;rig.controls.autoRotate=!rig.controls.autoRotate;ui.el('orbit').setAttribute('aria-pressed',String(rig.controls.autoRotate));});
 on(ui.el('quality'),'change',e=>setQuality(e.target.value));on(ui.el('hide-ui'),'click',()=>toggleUI(false));on(ui.el('show-ui'),'click',()=>toggleUI(true));
 on(ui.el('fullscreen'),'click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{ui.toast('浏览器未允许全屏，可使用隐藏界面功能。');}});
 on(document,'fullscreenchange',()=>ui.el('fullscreen').setAttribute('aria-label',document.fullscreenElement?'退出全屏':'切换全屏'));
 const dialog=ui.el<HTMLDialogElement>('downloads');on(ui.el('open-downloads'),'click',()=>dialog.showModal());on(ui.el('close-downloads'),'click',()=>dialog.close());
 for(const[id,fn]of [['download-html',downloadHTML],['download-offline',downloadOffline],['download-source',downloadSource]] as const)on(ui.el(id),'click',async()=>{const b=ui.el<HTMLButtonElement>(id);b.disabled=true;try{await fn();ui.toast('已准备好文件，请查看浏览器下载。');}catch(e){ui.toast((e as Error).message);}finally{b.disabled=false;}});
 on(window,'keydown',e=>{if((e.target as HTMLElement).matches('input,select,textarea')||dialog.open)return;if(e.code==='Space'){e.preventDefault();togglePlay();}if(e.key.toLowerCase()==='h')toggleUI();if(e.key.toLowerCase()==='r')setView('hero');if(e.key==='Escape')toggleUI(true);});
 on(canvas,'webglcontextlost',e=>{e.preventDefault();lost=true;ui.fatal('图形上下文已丢失。请关闭占用显存的标签页后重新加载。');});on(canvas,'webglcontextrestored',()=>location.reload());on(document,'visibilitychange',()=>{last=performance.now();});
 setQuality('medium');applyTime();
 renderer.info.autoReset=false;
 renderer.setAnimationLoop(now=>{if(disposed)return;const wallDelta=(now-last)/1000;const dt=Math.min(wallDelta,2);last=now;if(document.hidden||lost)return;elapsed+=dt;if(time.playing){time.update(dt);applyTime();}rig.update(dt);vegetation.updateLOD(camera.zoom);uniforms.time.value=elapsed;env.update(elapsed);weather.update(elapsed,dpr);water.update(elapsed,env.day,state.weather==='rain'?state.intensity:0,env.horizon);
 renderer.info.reset();if(qualityConfig[state.quality].bloom)composer.render();else renderer.render(scene,camera);drawCalls=renderer.info.render.calls;triangles=renderer.info.render.triangles;frames++;frameTime+=wallDelta;
 if(frameTime>=1){fps=Number((frames/frameTime).toFixed(1));frames=0;frameTime=0;ui.el('performance').textContent=`${fps} FPS · ${Math.round(dpr*100)}% 分辨率`;adaptTime+=1;if(adaptTime>=5){adaptTime=0;const cap=Math.min(devicePixelRatio,qualityConfig[state.quality].dpr);const next=fps<35?Math.max(.65,dpr-.1):fps>57?Math.min(cap,dpr+.05):dpr;if(Math.abs(next-dpr)>.01){dpr=next;renderer.setPixelRatio(dpr);renderer.setSize(innerWidth,innerHeight);composer.setPixelRatio(dpr);composer.setSize(innerWidth,innerHeight);}}}
 });
 requestAnimationFrame(()=>requestAnimationFrame(()=>ui.loaded()));
 const diagnostics={snapshot:()=>({...state,time:time.hour,playing:time.playing,night:env.night,sunIntensity:env.sun.intensity,elapsed,fps,dpr,flowers:vegetation.count,trees:vegetation.cherryCount,...architecture.counts,waterfalls:3,drawCalls,triangles,camera:camera.position.toArray(),target:rig.controls.target.toArray(),zoom:camera.zoom,view:rig.view,orbit:rig.controls.autoRotate,rainVisible:weather.rain.visible,snowVisible:weather.snow.visible,particles:state.weather==='sun'?0:Math.floor(weather.max*state.intensity),snowCover:uniforms.snow.value,wetness:uniforms.wet.value,renderer:renderer.getContext().getParameter(renderer.getContext().RENDERER)}),project:(p:number[])=>new T.Vector3(...p).project(camera).toArray()};
 (window as any).__SAKURA__=diagnostics;
 on(window,'pagehide',e=>{if(e.persisted)return;disposed=true;renderer.setAnimationLoop(null);cleanups.forEach(f=>f());rig.dispose();composer.dispose();bloom.dispose();const geoms=new Set<T.BufferGeometry>(),materials=new Set<T.Material>();scene.traverse(o=>{if(o instanceof T.Mesh||o instanceof T.Points||o instanceof T.LineSegments){geoms.add(o.geometry);if(Array.isArray(o.material))o.material.forEach(m=>materials.add(m));else materials.add(o.material);}});geoms.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());env.sun.shadow.map?.dispose();renderer.dispose();delete(window as any).__SAKURA__;});
}
