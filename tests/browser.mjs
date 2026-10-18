import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { unzipSync, strFromU8 } from 'fflate';

await access('dist/index.html');await mkdir('test-results',{recursive:true});
const url='http://127.0.0.1:4173';let server;
try{await fetch(url);}catch{server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4173','--strictPort'],{stdio:'ignore'});}
for(let i=0;i<100;i++){try{if((await fetch(url)).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
let executablePath=process.env.CHROMIUM_PATH;
if(!executablePath){try{await access('/usr/bin/chromium');executablePath='/usr/bin/chromium';}catch{}}
const browser=await chromium.launch({executablePath,headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const report={browser:browser.version(),started:new Date().toISOString(),checks:[],errors:[],performance:[],limitations:['Headless Linux SwiftShader is not a Windows or Android hardware benchmark.']};
function monitor(page){page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});}
const context=await browser.newContext({viewport:{width:1280,height:800},deviceScaleFactor:1,acceptDownloads:true});
const page=await context.newPage();monitor(page);page.setDefaultTimeout(60000);
const snapshot=()=>page.evaluate(()=>window.__TOKYO__.snapshot());
async function range(target,value){await target.evaluate((e,v)=>{e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));},value);}
async function check(name,fn){console.log('RUN ',name);await fn();report.checks.push(name);console.log('PASS',name);}
async function download(page,id,filename){const pending=page.waitForEvent('download');await page.locator(id).click();const d=await pending;const destination=path.resolve('test-results',filename||d.suggestedFilename());await d.saveAs(destination);return destination;}
try {
  await page.goto(url);await page.waitForFunction(()=>window.__TOKYO__);await page.locator('#loading').waitFor({state:'detached'});
  await check('actual WebGL rendering and metre-scale tower',async()=>{
    const s=await snapshot();assert.equal(s.towerHeight,333);assert.ok(s.drawCalls>10);assert.ok(s.triangles>100000);assert.equal(await page.locator('#fatal').isVisible(),false);
  });
  await page.screenshot({path:'test-results/desktop-golden.png'});
  await check('sunlight, night, endpoints and continuous time controls',async()=>{
    await range(page.locator('#time'),12);const noon=await snapshot();assert.ok(noon.sunIntensity>2);
    await range(page.locator('#time'),0);const midnight=await snapshot();assert.ok(midnight.night>.99);assert.ok(midnight.sunIntensity<.1);
    await range(page.locator('#time'),24);assert.equal(await page.locator('#time-output').textContent(),'24:00');
    await range(page.locator('#time'),22);
  });
  await page.screenshot({path:'test-results/desktop-night.png'});
  await check('independent night rain, intensity and snow switching',async()=>{
    await page.locator('[data-weather="rain"]').click();let s=await snapshot();assert.equal(s.time,22);assert.ok(s.rainVisible);assert.ok(!s.snowVisible);
    await range(page.locator('#intensity'),100);assert.equal((await snapshot()).intensity,1);
    await range(page.locator('#intensity'),0);assert.ok(!(await snapshot()).rainVisible);
    await range(page.locator('#intensity'),80);
    await page.screenshot({path:'test-results/desktop-rain.png'});
    await page.locator('[data-weather="snow"]').click();s=await snapshot();assert.ok(s.snowVisible);assert.ok(!s.rainVisible);
    await range(page.locator('#time'),10);assert.ok((await snapshot()).snowVisible);
    await page.screenshot({path:'test-results/desktop-snow.png'});
    await page.locator('[data-weather="rain"]').click();assert.equal((await snapshot()).intensity,.8);
    await page.locator('[data-weather="sun"]').click();assert.ok(await page.locator('#intensity').isDisabled());
  });
  await check('play advances time and slider input pauses playback',async()=>{
    await range(page.locator('#time'),23.99);await page.locator('#play').click();
    await page.waitForFunction(()=>window.__TOKYO__.snapshot().time<1,{timeout:60000});
    assert.equal((await snapshot()).playing,true);
    await range(page.locator('#time'),17.25);assert.equal((await snapshot()).playing,false);
    assert.equal(await page.locator('#time-output').textContent(),'17:15');
  });
  await check('camera presets, reset, mouse orbit and zoom',async()=>{
    await page.locator('#quality').selectOption('low');
    const original=(await snapshot()).camera;
    await page.locator('[data-view="close"]').click();await page.waitForFunction(()=>window.__TOKYO__.snapshot().camera[0]<170);
    assert.notDeepEqual((await snapshot()).camera,original);
    await page.locator('[data-view="low"]').click();await page.waitForFunction(()=>window.__TOKYO__.snapshot().camera[1]<25);
    await page.locator('#reset').click();await page.waitForFunction(()=>Math.abs(window.__TOKYO__.snapshot().camera[0]-380)<1);
    await page.mouse.move(720,350);await page.mouse.down();await page.mouse.move(820,380);await page.mouse.up();
    assert.ok(Math.abs((await snapshot()).camera[0]-380)>5);
    const before=(await snapshot()).camera;
    await page.mouse.wheel(0,-250);await page.waitForTimeout(300);
    assert.notDeepEqual((await snapshot()).camera,before);
    await page.locator('#reset').click();
  });
  await check('all three quality presets change actual instance counts',async()=>{
    for(const [q,n] of [['high',28000],['medium',15000],['low',6500]]) {
      await page.locator('#quality').selectOption(q);assert.equal((await snapshot()).flowers,n);
    }
  });
  await check('immersive UI and opt-in audio controls',async()=>{
    await page.locator('#hide-ui').click();assert.ok(await page.locator('#show-ui').isVisible());
    await page.locator('#show-ui').click();assert.ok(!(await page.locator('#show-ui').isVisible()));
    await page.locator('#audio').click();assert.equal(await page.locator('#audio').getAttribute('aria-pressed'),'true');
    await page.locator('#audio').click();assert.equal(await page.locator('#audio').getAttribute('aria-pressed'),'false');
  });
  await check('fullscreen control enters and exits when supported',async()=>{
    if(await page.evaluate(()=>document.fullscreenEnabled)) {
      await page.locator('#fullscreen').click();assert.ok(await page.evaluate(()=>document.fullscreenElement!==null));
      await page.locator('#fullscreen').click();assert.ok(await page.evaluate(()=>document.fullscreenElement===null));
    } else report.limitations.push('Fullscreen is unavailable in this browser environment.');
  });
  let offlinePath;
  await check('real GLB model export contains geometry and valid binary buffers',async()=>{
    await page.locator('#open-downloads').click();
    const file=await download(page,'#download-model');const data=await readFile(file);
    assert.equal(data.toString('ascii',0,4),'glTF');assert.equal(data.readUInt32LE(4),2);assert.equal(data.readUInt32LE(8),data.length);
    const jsonLength=data.readUInt32LE(12),gltf=JSON.parse(data.toString('utf8',20,20+jsonLength));
    assert.ok(gltf.meshes.length>=6);assert.ok(gltf.materials.length>=5);assert.ok(gltf.buffers[0].byteLength>100000);
    const maxima=gltf.accessors.filter(a=>a.type==='VEC3'&&a.max).map(a=>a.max[1]);assert.ok(maxima.some(y=>Math.abs(y-333)<.01));
  });
  await check('offline ZIP and complete editable source downloads',async()=>{
    const offlineZip=await download(page,'#download-offline');const files=unzipSync(new Uint8Array(await readFile(offlineZip)));
    assert.ok(files['index.html']);assert.ok(strFromU8(files['index.html']).includes('data-offline="true"'));assert.ok(files['THIRD_PARTY_LICENSES.txt']);
    await mkdir('test-results/offline',{recursive:true});offlinePath=path.resolve('test-results/offline/index.html');await writeFile(offlinePath,files['index.html']);
    const source=await download(page,'#download-source');const sourceFiles=unzipSync(new Uint8Array(await readFile(source)));
    for(const file of ['package.json','package-lock.json','src/main.js','src/scene/tower.js','README.md'])assert.ok(sourceFiles[file],file);
    await page.locator('#close-downloads').click();
  });
  await page.waitForTimeout(2500);report.performance.push({viewport:'desktop 1280x800, low quality, SwiftShader',...(await snapshot())});
  await context.close();
  await check('offline file runs with all network access disabled and re-downloads work',async()=>{
    const offlineContext=await browser.newContext({viewport:{width:1000,height:760},offline:true,acceptDownloads:true});
    let p=await offlineContext.newPage();monitor(p);const requests=[];p.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
    try {await p.goto(pathToFileURL(offlinePath).href);}
    catch(error) {
      if(!error.message.includes('ERR_BLOCKED_BY_ADMINISTRATOR'))throw error;
      report.limitations.push('Cloud Chromium enterprise policy blocks file:// navigation; the exact standalone HTML was instead loaded into about:blank with networking disabled. Double-click opening needs validation on an unmanaged browser.');
      await p.close();p=await offlineContext.newPage();monitor(p);
      p.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
      await p.setContent(await readFile(offlinePath,'utf8'),{waitUntil:'load'});
    }
    await p.waitForFunction(()=>window.__TOKYO__);await p.locator('#loading').waitFor({state:'detached'});
    assert.ok((await p.evaluate(()=>window.__TOKYO__.snapshot())).drawCalls>10);assert.deepEqual(requests,[]);
    await p.locator('#open-downloads').click();
    const zip=await download(p,'#download-source','offline-source.zip');assert.ok(unzipSync(new Uint8Array(await readFile(zip)))['src/main.js']);
    const roundtrip=await download(p,'#download-offline','offline-roundtrip.zip');
    const repacked=unzipSync(new Uint8Array(await readFile(roundtrip)));assert.ok(repacked['index.html']);
    await p.close();p=await offlineContext.newPage();monitor(p);
    await p.setContent(strFromU8(repacked['index.html']),{waitUntil:'load'});await p.waitForFunction(()=>window.__TOKYO__);
    assert.ok((await p.evaluate(()=>window.__TOKYO__.snapshot())).drawCalls>10);
    await offlineContext.close();
  });
  await check('mobile layout, real touch orbit and resizing',async()=>{
    const c=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
    const p=await c.newPage();monitor(p);await p.goto(url);await p.waitForFunction(()=>window.__TOKYO__);await p.locator('#loading').waitFor({state:'detached'});
    assert.equal((await p.evaluate(()=>window.__TOKYO__.snapshot())).quality,'low');
    const overflow=await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth);assert.equal(overflow,false);
    const before=await p.evaluate(()=>window.__TOKYO__.snapshot().camera);
    const client=await c.newCDPSession(p);
    await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:65,y:350}]});
    await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:145,y:375}]});
    await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    await p.waitForTimeout(400);assert.notDeepEqual(await p.evaluate(()=>window.__TOKYO__.snapshot().camera),before);
    const beforePinch=await p.evaluate(()=>{const s=window.__TOKYO__.snapshot();return Math.hypot(...s.camera.map((v,i)=>v-s.target[i]));});
    await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:80,y:450},{x:150,y:450}]});
    await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:60,y:450},{x:170,y:450}]});
    await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    const afterPinch=await p.evaluate(()=>{const s=window.__TOKYO__.snapshot();return Math.hypot(...s.camera.map((v,i)=>v-s.target[i]));});
    assert.ok(afterPinch<beforePinch);
    await p.locator('[data-weather="snow"]').tap();assert.ok(await p.evaluate(()=>window.__TOKYO__.snapshot().snowVisible));
    await p.screenshot({path:'test-results/mobile-snow.png'});
    await p.locator('[data-weather="sun"]').tap();await p.locator('#reset').tap();await p.waitForTimeout(1800);
    await p.screenshot({path:'test-results/mobile-golden.png'});
    await p.setViewportSize({width:844,height:390});await p.screenshot({path:'test-results/mobile-landscape.png'});
    await p.setViewportSize({width:390,height:844});await p.waitForTimeout(1500);
    report.performance.push({viewport:'touch emulation 390x844, low quality, SwiftShader',...await p.evaluate(()=>window.__TOKYO__.snapshot())});
    const lossSupported=await p.evaluate(()=>{const gl=document.querySelector('canvas').getContext('webgl2'),loss=gl.getExtension('WEBGL_lose_context');if(!loss)return false;loss.loseContext();return true;});
    if(lossSupported){await p.locator('#fatal').waitFor({state:'visible'});assert.ok((await p.locator('#fatal-message').textContent()).includes('上下文'));}
    await c.close();
  });
  assert.deepEqual(report.errors,[],'No JavaScript or shader errors');
  report.success=true;
} catch(error) {
  report.success=false;report.failure=error.stack;console.error(error);process.exitCode=1;
  try{await page.screenshot({path:'test-results/failure.png'});}catch{}
} finally {
  report.finished=new Date().toISOString();await writeFile('test-results/report.json',JSON.stringify(report,null,2));
  await browser.close();server?.kill();
  console.log(JSON.stringify({success:report.success,checks:report.checks.length,errors:report.errors,performance:report.performance.map(p=>({target:p.viewport,fps:p.fps,drawCalls:p.drawCalls,triangles:p.triangles}))},null,2));
}
