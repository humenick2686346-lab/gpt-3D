import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { zipSync, strToU8 } from 'fflate';

export function saveFile(data,name,type='application/octet-stream') {
  const blob=data instanceof Blob?data:new Blob([data],{type});
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=name;document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),30000);
}
const offlineReadme=`东京塔 · 时光花海 / Tokyo Tower: Sea of Flowers

解压后双击 index.html，即可离线运行。无需联网、Node.js 或额外素材。
推荐使用最新版 Chrome / Edge / Firefox。浏览器需支持 WebGL 2 和硬件加速。
操作：单指或鼠标左键旋转；滚轮/双指缩放；右键/双指拖动平移。
H 隐藏界面，R 恢复视角，空格播放/暂停，Escape 恢复界面或关闭下载窗口。
时间滑块范围 00:00—24:00；自动播放一轮约 4 分钟。拖动会暂停自动播放。
雨雪量可单独记忆；晴天时强度不可调。环境音默认静音，需点击开启。
画质低/中/高会改变实例花卉、天气粒子、阴影和像素比。

页面内可以再次下载离线包、项目源码以及 .glb 东京塔模型。
GLB 包含塔身钢架、观景平台、窗户、天线和材质，不包含花海、天气、天空、UI 或动态灯光系统。
东京塔采用程序化近似建模，不是建筑测绘或工程数据。
如果未显示场景，请启用浏览器硬件加速；虚拟机和远程桌面可能不提供 WebGL 2。

代码为 MIT 许可。依赖的 Three.js、fflate、Vite 等许可证见 THIRD_PARTY_LICENSES.txt。
全部几何、着色器与音频均程序化生成，无外部模型、贴图、字体或音频下载。
`;

async function getOfflineHTML() {
  if(document.documentElement.dataset.offline==='true') {
    const clone=document.documentElement.cloneNode(true);
    clone.querySelector('#app').innerHTML='';
    return '<!doctype html>\n'+clone.outerHTML;
  }
  const response=await fetch(new URL('offline.html',document.baseURI));
  if(!response.ok)throw new Error('离线文件未生成，请先运行 npm run build，再使用预览服务。');
  const html=await response.text();
  if(!html.includes('data-offline="true"'))throw new Error('离线文件尚未生成，请先运行 npm run build。');
  return html;
}
async function thirdPartyText() {
  const embedded=document.getElementById('third-party-licenses');
  if(embedded)return embedded.textContent;
  const response=await fetch(new URL('THIRD_PARTY_LICENSES.txt',document.baseURI));
  if(!response.ok)throw new Error('许可证文件缺失，请重新构建完整项目。');
  return response.text();
}
export async function downloadOffline() {
  const [html,licenses]=await Promise.all([getOfflineHTML(),thirdPartyText()]);
  const zip=zipSync({'index.html':strToU8(html),'README-OFFLINE.txt':strToU8(offlineReadme),'THIRD_PARTY_LICENSES.txt':strToU8(licenses)},{level:6});
  saveFile(zip,'tokyo-tower-offline.zip','application/zip');
}
export async function downloadSource() {
  const embedded=document.getElementById('project-source');
  if(embedded) {
    const bytes=Uint8Array.from(atob(embedded.textContent.trim()),s=>s.charCodeAt(0));
    saveFile(bytes,'tokyo-tower-source.zip','application/zip');return;
  }
  const response=await fetch(new URL('tokyo-tower-source.zip',document.baseURI));
  if(!response.ok)throw new Error('源码归档尚未生成，请先运行 npm run build。');
  const blob=await response.blob();
  const magic=new Uint8Array(await blob.slice(0,2).arrayBuffer());
  if(magic[0]!==80||magic[1]!==75)throw new Error('源码归档尚未生成，请先运行 npm run build。');
  saveFile(blob,'tokyo-tower-source.zip');
}
export async function downloadModel(tower) {
  const model=tower.root.clone(true);model.name='Tokyo Tower · procedural architectural model (metres)';
  const materials=[];
  model.traverse(object=>{
    if(object.material) {
      object.material=object.material.clone();materials.push(object.material);
      if(object.material.emissive) object.material.emissiveIntensity=object.name.includes('lights')?.3:0;
    }
  });
  try {
    const result=await new GLTFExporter().parseAsync(model,{binary:true,onlyVisible:true});
    saveFile(result,'tokyo-tower-333m.glb','model/gltf-binary');
  } finally { materials.forEach(m=>m.dispose()); }
}

export { offlineReadme };
