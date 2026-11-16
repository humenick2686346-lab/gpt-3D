import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {spawn} from 'node:child_process';
import {access,mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import {framingPoints} from '../src/controllers/CameraController.ts';

await access('dist/index.html');await mkdir('test-results',{recursive:true});
const url='http://127.0.0.1:4173';let server;
try{await fetch(url);}catch{server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4173','--strictPort'],{stdio:'ignore'});}
for(let i=0;i<100;i++){try{if((await fetch(url)).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
const report={started:new Date().toISOString(),checks:[],errors:[],snapshots:{},limitations:['Linux SwiftShader does not establish Windows GPU performance or launcher compatibility.']};
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const composition=framingPoints().map(p=>p.toArray());
function monitor(page){page.setDefaultTimeout(180000);page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});}
const snap=page=>page.evaluate(()=>window.__SAKURA__.snapshot());
async function ready(page){
 await page.waitForFunction(()=>window.__SAKURA__,null,{polling:250,timeout:180000});
 await page.locator('#quality').evaluate(el=>{el.value='low';el.dispatchEvent(new Event('change',{bubbles:true}));});
 await page.locator('#loading').waitFor({state:'detached',timeout:180000});
 const first=await snap(page);await nextFrame(page,first.elapsed);assert.equal(await page.locator('#fatal').isVisible(),false);
}
async function nextFrame(page,elapsed){await page.waitForFunction(t=>window.__SAKURA__.snapshot().elapsed>t+.1,elapsed,{polling:250,timeout:180000});}
async function click(page,selector){const el=page.locator(selector);assert.ok(await el.isVisible());assert.ok(await el.isEnabled());await el.evaluate(e=>e.click());}
async function frameCheck(page){const points=await page.evaluate(p=>p.map(v=>window.__SAKURA__.project(v)),composition);for(const p of points)assert.ok(Math.abs(p[0])<.99&&Math.abs(p[1])<.99&&Math.abs(p[2])<1,`clipped world point ${p}`);}
async function capture(page,file){const client=await page.context().newCDPSession(page);const shot=await client.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false,fromSurface:true});await writeFile(file,Buffer.from(shot.data,'base64'));await client.detach();}
function world(s){assert.equal(s.islands,5);assert.equal(s.interIslandBridges,6);assert.equal(s.australia.operaHouse,1);assert.equal(s.australia.harbourBridge,1);assert.equal(s.australia.sydneyTower,1);assert.equal(s.france.eiffelTower,1);assert.equal(s.france.arcDeTriomphe,1);assert.ok(s.france.buildings>=8);assert.equal(s.egypt.pyramids,3);assert.equal(s.shanghai.orientalPearl,1);assert.ok(s.drawCalls>50);}
async function check(name,fn){console.log('RUN',name);await fn();report.checks.push(name);console.log('PASS',name);}
try{
 const context=await browser.newContext({viewport:{width:1000,height:700},deviceScaleFactor:1});const page=await context.newPage();monitor(page);await page.goto(url,{waitUntil:'domcontentloaded',timeout:180000});await ready(page);
 await check('five islands and connected bridges render without clipping',async()=>{const s=await snap(page);world(s);await frameCheck(page);report.snapshots.day=s;await capture(page,'test-results/five-islands-day.png');});
 await check('harbour, fountain, waterfall, cloud and petals animate while day clock is paused',async()=>{
  const a=await snap(page);assert.equal(a.playing,false);await nextFrame(page,a.elapsed);const b=await snap(page);assert.equal(a.time,b.time);
  for(const key of ['australiaTime','franceTime','waterTime','cloudTime','petalTime'])assert.ok(b[key]>a[key]+.1,`${key} advances`);report.animation={before:a.elapsed,after:b.elapsed,hour:b.time};
 });
 await check('night lighting renders with the same five-island composition',async()=>{
  await page.locator('#time').evaluate(el=>{el.value='22';el.dispatchEvent(new Event('input',{bubbles:true}));});const a=await snap(page);await nextFrame(page,a.elapsed);const s=await snap(page);world(s);assert.ok(s.night>.99);await frameCheck(page);report.snapshots.night=s;await capture(page,'test-results/five-islands-night.png');
 });
 await check('top view exposes the complete bridge circuit',async()=>{
  await page.locator('#time').evaluate(el=>{el.value='10.5';el.dispatchEvent(new Event('input',{bubbles:true}));});await click(page,'[data-view="top"]');await page.waitForFunction(()=>!window.__SAKURA__.snapshot().cameraMoving,null,{polling:250});await nextFrame(page,(await snap(page)).elapsed);await frameCheck(page);await capture(page,'test-results/five-islands-top.png');
 });
 await check('portrait resize and reset fit the five islands',async()=>{
  await page.setViewportSize({width:390,height:844});await click(page,'#reset');await page.waitForFunction(()=>!window.__SAKURA__.snapshot().cameraMoving,null,{polling:250});await nextFrame(page,(await snap(page)).elapsed);await frameCheck(page);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await capture(page,'test-results/five-islands-mobile.png');
 });
 await context.close();
 await check('standalone offline HTML starts without HTTP requests and keeps fountain animation',async()=>{
  const offline=await readFile('release/sakura-dream-offline.html','utf8');assert.ok(offline.includes('data-offline="true"'));assert.ok(!/<script[^>]+src=/i.test(offline));
  report.offlineRuntimeHash=createHash('sha256').update([...offline.matchAll(/<(script|style)(?:\s[^>]*)?>([\s\S]*?)<\/\1>/gi)].filter(m=>!m[0].includes('id="project-source"')&&!m[0].includes('id="third-party-licenses"')).map(m=>m[2]).join('\n')).digest('hex');
  const c=await browser.newContext({offline:true,viewport:{width:500,height:380},deviceScaleFactor:1});let p=await c.newPage();monitor(p);const requests=[];const watch=()=>p.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});watch();
  try{await p.goto(pathToFileURL(path.resolve('release/sakura-dream-offline.html')).href,{waitUntil:'domcontentloaded'});report.offlineLoad='file://';}
  catch(e){if(!e.message.includes('ERR_BLOCKED_BY_ADMINISTRATOR'))throw e;report.limitations.push('Chromium blocks file://; loaded the exact HTML into an offline about:blank context.');await p.close();p=await c.newPage();monitor(p);watch();await p.setContent(offline,{waitUntil:'domcontentloaded'});report.offlineLoad='exact HTML via setContent';}
  await ready(p);const a=await snap(p);world(a);await nextFrame(p,a.elapsed);const b=await snap(p);assert.ok(b.franceTime>a.franceTime);assert.ok(b.australiaTime>a.australiaTime);assert.equal(b.time,a.time);assert.deepEqual(requests,[]);report.snapshots.offline=b;await c.close();
 });
 assert.deepEqual(report.errors,[]);report.success=true;
}catch(error){report.success=false;report.failure=error.stack;console.error(error);process.exitCode=1;}
finally{report.finished=new Date().toISOString();await writeFile('test-results/five-islands-report.json',JSON.stringify(report,null,2));await browser.close();server?.kill();console.log(JSON.stringify({success:report.success,checks:report.checks,errors:report.errors},null,2));}
