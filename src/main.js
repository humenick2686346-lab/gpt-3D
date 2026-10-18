import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createTower } from './scene/tower.js';
import { createSky } from './scene/sky.js';
import { createGround } from './scene/ground.js';
import { FlowerField } from './scene/flowers.js';
import { TimeSystem } from './systems/time.js';
import { WeatherSystem } from './systems/weather.js';
import { CameraRig } from './systems/camera.js';
import { Ambience } from './systems/audio.js';
import { downloadModel, downloadOffline, downloadSource } from './systems/downloads.js';
import { createInterface } from './ui/interface.js';
import { icon } from './ui/icons.js';
import './style.css';

const ui=createInterface();
ui.el('reload').addEventListener('click',()=>location.reload());
let renderer;
try {
  renderer=new THREE.WebGLRenderer({antialias:!matchMedia('(pointer:coarse)').matches,powerPreference:'high-performance',alpha:false});
} catch(error) {
  console.error(error);
  ui.fatal('浏览器无法创建 WebGL 2 场景。请在最新版 Chrome、Edge 或 Firefox 中启用硬件加速后重试。');
}
if(renderer) start(renderer);

function start(renderer) {
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.12;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  // Only the static tower casts shadows. Reuse its map until lighting or quality changes.
  renderer.shadowMap.autoUpdate=false;
  const canvas=renderer.domElement;canvas.tabIndex=0;canvas.setAttribute('aria-label','东京塔三维场景：拖动旋转，滚轮缩放，右键平移');
  ui.el('scene').append(canvas);
  const mobile=matchMedia('(max-width:760px), (pointer:coarse)').matches;
  const state={time:18.25,playing:false,weather:'sun',intensity:.65,quality:mobile?'low':'medium',uiVisible:true};
  const savedIntensities={rain:.65,snow:.65};
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(mobile?53:43,innerWidth/innerHeight,.5,12000);
  const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment();
  const environment=pmrem.fromScene(room,.04);scene.environment=environment.texture;scene.environmentIntensity=.35;
  room.dispose();pmrem.dispose();
  const sky=createSky();scene.add(sky.sky,sky.stars);
  const tower=createTower();scene.add(tower.root,tower.snow);
  const ground=createGround();scene.add(ground.group);
  const flowers=new FlowerField(scene,state.quality);
  const weather=new WeatherSystem(scene,state.quality);
  const time=new TimeSystem(scene,sky.sky,tower,ground);
  const rig=new CameraRig(camera,canvas);
  const audio=new Ambience();
  if(mobile){camera.position.set(430,160,590);rig.controls.target.set(0,140,0);rig.controls.update();}
  let contextLost=false,manualQuality=false,elapsed=0,fps=0,frames=0,frameTime=0,samples=[],disposed=false;
  const disposeListeners=[];
  const on=(target,event,fn,options)=>{target.addEventListener(event,fn,options);disposeListeners.push(()=>target.removeEventListener(event,fn,options));};
  function quality(value,manual=true) {
    state.quality=value;if(manual)manualQuality=true;
    if(flowers.quality!==value) {flowers.setQuality(value);weather.setQuality(value);}
    const config={low:{dpr:1,shadow:0},medium:{dpr:1.5,shadow:1024},high:{dpr:2,shadow:2048}}[value];
    renderer.setPixelRatio(Math.min(devicePixelRatio,config.dpr));
    renderer.shadowMap.enabled=config.shadow>0;time.sun.castShadow=config.shadow>0;
    if(config.shadow>0){time.sun.shadow.mapSize.set(config.shadow,config.shadow);time.sun.shadow.map?.dispose();time.sun.shadow.map=null;}
    renderer.shadowMap.needsUpdate=true;
    ui.el('quality').value=value;
    resize();
  }
  function resize() {
    camera.aspect=innerWidth/innerHeight;
    camera.fov=innerHeight<500&&innerWidth>innerHeight?65:innerWidth<=760?53:innerHeight<900?49:43;
    camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);
  }
  function applyTime(){const s=time.update(state.time,state.weather,state.intensity);scene.environmentIntensity=.13+s.daylight*.28;ui.setTime(state.time);tower.snow.visible=state.weather==='snow'&&state.intensity>0;renderer.shadowMap.needsUpdate=true;}
  function selectWeather(mode) {
    if(state.weather!=='sun')savedIntensities[state.weather]=state.intensity;
    state.weather=mode;state.intensity=mode==='sun'?.65:savedIntensities[mode];
    weather.set(mode,state.intensity);audio.set(mode,state.intensity);ui.setWeather(mode);
    ui.el('intensity').value=state.intensity*100;ui.el('intensity-value').textContent=`${Math.round(state.intensity*100)}%`;applyTime();
  }
  function togglePlay() {state.playing=!state.playing;ui.setPlay(state.playing);}
  function toggleUI(visible=!state.uiVisible) {
    state.uiVisible=visible;document.body.classList.toggle('ui-hidden',!visible);ui.el('show-ui').hidden=visible;
    document.querySelectorAll('.interface').forEach(node=>{node.inert=!visible;});
    if(!visible)ui.el('show-ui').focus();
  }
  function setView(name) {
    rig.setView(name);
    document.querySelectorAll('[data-view]').forEach(b=>{const active=b.dataset.view===name;b.classList.toggle('active',active);b.setAttribute('aria-pressed',active);});
  }
  on(window,'resize',resize);
  on(ui.el('time'),'input',e=>{state.time=Number(e.target.value);state.playing=false;ui.setPlay(false);applyTime();});
  on(ui.el('play'),'click',togglePlay);
  document.querySelectorAll('[data-weather]').forEach(b=>on(b,'click',()=>selectWeather(b.dataset.weather)));
  on(ui.el('intensity'),'input',e=>{
    state.intensity=Number(e.target.value)/100;ui.el('intensity-value').textContent=`${e.target.value}%`;
    weather.set(state.weather,state.intensity);audio.set(state.weather,state.intensity);applyTime();
  });
  document.querySelectorAll('[data-view]').forEach(b=>on(b,'click',()=>setView(b.dataset.view)));
  on(ui.el('reset'),'click',()=>setView('panorama'));
  on(ui.el('quality'),'change',e=>{quality(e.target.value);ui.toast(`已切换${{low:'低',medium:'中',high:'高'}[state.quality]}画质`);});
  on(ui.el('hide-ui'),'click',()=>toggleUI(false));on(ui.el('show-ui'),'click',()=>toggleUI(true));
  on(ui.el('fullscreen'),'click',async()=>{
    try {
      if(document.fullscreenElement)await document.exitFullscreen();
      else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();
      else ui.toast('此浏览器不支持全屏，可使用沉浸模式隐藏界面。');
    }catch {ui.toast('浏览器未允许全屏，可使用沉浸模式。');}
  });
  on(document,'fullscreenchange',()=>ui.el('fullscreen').setAttribute('aria-label',document.fullscreenElement?'退出全屏':'切换全屏'));
  on(ui.el('audio'),'click',async()=>{
    try {
      const enabled=await audio.toggle();ui.el('audio').innerHTML=icon(enabled?'volume':'mute');
      ui.el('audio').setAttribute('aria-pressed',enabled);ui.el('audio').setAttribute('aria-label',enabled?'静音环境音':'开启环境音');
      ui.toast(enabled?'环境音已开启':'已静音');
    }catch(e){ui.toast(e.message);}
  });
  on(ui.el('open-downloads'),'click',()=>ui.el('downloads').showModal());
  on(ui.el('close-downloads'),'click',()=>ui.el('downloads').close());
  on(ui.el('downloads'),'click',e=>{
    const rect=ui.el('downloads').getBoundingClientRect();
    if(e.target===ui.el('downloads')&&(e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom))ui.el('downloads').close();
  });
  for(const [id,fn] of [['download-model',()=>downloadModel(tower)],['download-offline',downloadOffline],['download-source',downloadSource]]) {
    on(ui.el(id),'click',async()=>{
      const button=ui.el(id);button.disabled=true;button.setAttribute('aria-busy','true');ui.toast('正在打包，请稍候…');
      try{await fn();ui.toast('文件已准备好，请查看浏览器下载。');}catch(e){console.error(e);ui.toast(e.message||'下载未完成，请重试。');}
      finally{button.disabled=false;button.removeAttribute('aria-busy');}
    });
  }
  on(window,'keydown',e=>{
    if(e.target.matches('input,select,textarea')||ui.el('downloads').open)return;
    if(e.code==='Space'){e.preventDefault();togglePlay();}
    if(e.key.toLowerCase()==='h')toggleUI();
    if(e.key.toLowerCase()==='r')setView('panorama');
    if(e.key==='Escape')toggleUI(true);
  });
  on(canvas,'webglcontextlost',e=>{e.preventDefault();contextLost=true;ui.fatal('图形上下文已丢失。请关闭占用显存的标签页，然后重新加载。');});
  on(canvas,'webglcontextrestored',()=>location.reload());
  let last=performance.now();
  quality(state.quality,false);applyTime();ui.setWeather('sun');
  const animate=now=>{
    if(disposed)return;
    const wallDelta=(now-last)/1000;
    last=now;
    if(document.hidden||contextLost)return;
    elapsed+=wallDelta;
    if(state.playing){state.time=(state.time+wallDelta*.1)%24;applyTime();}
    rig.update(wallDelta);flowers.update(elapsed,state.weather);sky.update(elapsed,time.state.night);
    weather.update(elapsed,camera,renderer.getPixelRatio());
    renderer.render(scene,camera);
    frames++;frameTime+=wallDelta;
    if(frameTime>=1) {
      fps=Math.round(frames/frameTime);samples.push(fps);if(samples.length>20)samples.shift();frames=0;frameTime=0;
      ui.el('performance').textContent=`${fps} FPS · ${{low:'轻盈',medium:'均衡',high:'细腻'}[state.quality]}`;
      // Only adapt the automatic initial preset; explicit user choices are respected.
      if(!manualQuality&&elapsed>12&&samples.length>=6&&samples.slice(-6).every(f=>f<24)&&state.quality!=='low') {
        quality('low',false);ui.toast('已自动降低画质，让风景更流畅。');
      }
    }
  };
  renderer.setAnimationLoop(animate);
  on(document,'visibilitychange',()=>{last=performance.now();});
  requestAnimationFrame(()=>requestAnimationFrame(()=>ui.loaded()));
  // Read-only diagnostics for reproducible browser validation and performance reporting.
  window.__TOKYO__={snapshot:()=>({...state,fps,elapsed,flowers:flowers.count,rainVisible:weather.rain.visible,snowVisible:weather.snow.visible,particleCount:state.weather==='sun'?0:Math.floor(weather.max*state.intensity),towerHeight:333,sunIntensity:time.sun.intensity,night:time.state.night,camera:camera.position.toArray(),target:rig.controls.target.toArray(),drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,renderer:renderer.getContext().getParameter(renderer.getContext().RENDERER)})};
  on(window,'pagehide',e=>{if(!e.persisted)dispose();});
  function dispose() {
    if(disposed)return;disposed=true;renderer.setAnimationLoop(null);disposeListeners.forEach(fn=>fn());
    rig.dispose();audio.dispose();flowers.dispose();
    const geometries=new Set(),materials=new Set();
    scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material){if(Array.isArray(o.material))o.material.forEach(m=>materials.add(m));else materials.add(o.material);}});
    geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
    time.sun.shadow.map?.dispose();environment.dispose();renderer.dispose();delete window.__TOKYO__;
  }
}
