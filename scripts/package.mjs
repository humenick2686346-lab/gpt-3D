import { readFile, writeFile, mkdir, readdir, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { zipSync, strToU8 } from 'fflate';

const root=process.cwd();
const packages=['three','fflate','vite','vite-plugin-singlefile','@playwright/test'];
let licenses='Tokyo Tower · Sea of Flowers — third-party notices\n\nAll scene assets are generated procedurally. No external model, image, font or audio assets are used.\n\n';
for(const name of packages) {
  const base=path.join(root,'node_modules',name);
  const pkg=JSON.parse(await readFile(path.join(base,'package.json'),'utf8'));
  const names=await readdir(base);
  const licenseName=names.find(n=>/^licen[sc]e(?:\.md|\.txt)?$/i.test(n));
  licenses+=`\n${'='.repeat(70)}\n${name} ${pkg.version} — ${pkg.license}\n${'='.repeat(70)}\n`;
  if(licenseName)licenses+=await readFile(path.join(base,licenseName),'utf8');
  else licenses+=`See https://www.npmjs.com/package/${name} for the upstream package license.\n`;
  licenses+='\n';
}
await mkdir('release',{recursive:true});
await writeFile('release/THIRD_PARTY_LICENSES.txt',licenses);

// Source archive is deliberately independent of the generated release, avoiding recursive archives.
const source={};
const excluded=new Set(['.git','node_modules','dist','dist-offline','release','test-results','downloads']);
async function collect(dir='') {
  for(const entry of await readdir(path.join(root,dir),{withFileTypes:true})) {
    if(excluded.has(entry.name)||entry.name.endsWith('.log'))continue;
    const relative=path.posix.join(dir,entry.name);
    if(entry.isDirectory())await collect(relative);
    else if(entry.isFile())source[relative]=new Uint8Array(await readFile(path.join(root,relative)));
  }
}
await collect();
source['THIRD_PARTY_LICENSES.txt']=strToU8(licenses);
const sourceZip=zipSync(source,{level:9});
await writeFile('release/tokyo-tower-source.zip',sourceZip);
let offline=await readFile('dist-offline/index.html','utf8');
offline=offline.replace('<html lang="zh-CN">','<html lang="zh-CN" data-offline="true">');
if(!offline.includes('data-offline="true"'))throw new Error('Offline marker injection failed');
const embedded=`<script id="project-source" type="application/octet-stream">${Buffer.from(sourceZip).toString('base64')}</script>\n<script id="third-party-licenses" type="text/plain">${licenses.replace(/<\/script/gi,'<\\/script')}</script>`;
offline=offline.replace('</head>',`${embedded}\n</head>`);
await writeFile('dist-offline/index.html',offline);
await writeFile('release/tokyo-tower-offline.html',offline);
const instructions=await readFile('OFFLINE.txt','utf8');
const offlineZip=zipSync({'index.html':strToU8(offline),'README-OFFLINE.txt':strToU8(instructions),'THIRD_PARTY_LICENSES.txt':strToU8(licenses)},{level:9});
await writeFile('release/tokyo-tower-offline.zip',offlineZip);
await copyFile('release/tokyo-tower-offline.html','dist/offline.html');
await copyFile('release/tokyo-tower-source.zip','dist/tokyo-tower-source.zip');
await copyFile('release/tokyo-tower-offline.zip','dist/tokyo-tower-offline.zip');
await copyFile('release/THIRD_PARTY_LICENSES.txt','dist/THIRD_PARTY_LICENSES.txt');
// A complete delivery includes both editable source and the ready-to-open offline app.
const delivery=zipSync({...source,'offline/index.html':strToU8(offline),'offline/README.txt':strToU8(instructions)},{level:9});
await writeFile('release/tokyo-tower-complete.zip',delivery);
console.log(`Packaged ${Object.keys(source).length} source files; offline HTML ${(Buffer.byteLength(offline)/1024).toFixed(0)} KiB; complete ZIP ${(delivery.length/1024).toFixed(0)} KiB.`);
