import { icon, towerIcon } from './icons.js';
import { formatTime } from '../core/math.js';

export function createInterface() {
  document.querySelector('#app').innerHTML=`
    <main class="experience" aria-label="东京塔互动花海">
      <div id="scene" aria-label="可旋转、缩放的三维东京塔场景"></div>
      <div class="vignette" aria-hidden="true"></div>
      <header class="site-header interface">
        <a class="brand" href="#" aria-label="Tokyo Tower 时光花海首页">${towerIcon}<span><strong>TOKYO TOWER</strong><span class="brand-sub">時 光 花 海 <i>SEA OF FLOWERS</i></span></span></a>
        <div class="header-center"><span class="live-dot"></span> A MOMENT, IN FULL BLOOM</div>
        <div class="header-actions"><button class="icon-button" id="audio" aria-label="开启环境音" aria-pressed="false" title="环境音 · 默认静音">${icon('mute')}</button><span class="header-divider"></span><button id="hide-ui" class="text-button" title="隐藏界面 · H">${icon('hide')}<span>沉浸模式</span></button></div>
      </header>
      <section class="intro interface">
        <div class="eyebrow"><span></span> 東京、日本 <i>35°39′30″ N · 139°44′43″ E</i></div>
        <h1>在花海之间，<br>与东京相遇<span>。</span></h1>
        <p>让时间慢下来。<br>把这一刻，留给风、花与东京塔。</p>
        <div class="intro-bottom"><span>333<span class="unit">m</span></span><span class="stat-label">一座塔，无数个瞬间<br><i>YOUR OWN LITTLE ESCAPE</i></span></div>
      </section>
      <aside class="weather-panel glass interface" aria-label="天气控制">
        <div class="panel-heading"><span>此刻的天空</span><span class="micro">WEATHER</span></div>
        <div class="weather-tabs" role="group" aria-label="选择天气">
          <button data-weather="sun" class="weather-button active" aria-pressed="true">${icon('sun')}<span>晴天</span></button>
          <button data-weather="rain" class="weather-button" aria-pressed="false">${icon('rain')}<span>下雨</span></button>
          <button data-weather="snow" class="weather-button" aria-pressed="false">${icon('snow')}<span>下雪</span></button>
        </div>
        <div class="weather-detail"><label for="intensity" id="intensity-label">风的轻语</label><output id="intensity-value">65%</output></div>
        <input id="intensity" class="range weather-range" type="range" min="0" max="100" value="65" aria-label="天气强度" disabled>
        <div class="weather-caption" id="weather-caption">晴空之下，每一朵花都在呼吸。</div>
        <div class="quality-row"><label for="quality">渲染画质</label><select id="quality" aria-label="画质预设"><option value="low">低 · 轻盈</option><option value="medium" selected>中 · 均衡</option><option value="high">高 · 细腻</option></select></div>
      </aside>
      <div class="scene-note interface"><span class="live-dot"></span><span id="scene-period">GOLDEN HOUR</span><span class="note-line"></span><span id="scene-weather">微风拂过花海</span></div>
      <section class="bottom-controls interface" aria-label="场景控制">
        <div class="toolbar">
          <div class="camera-controls glass" role="group" aria-label="预设视角"><span class="toolbar-label">视角</span><button data-view="panorama" class="active" aria-pressed="true">全景</button><button data-view="low" aria-pressed="false">仰视</button><button data-view="close" aria-pressed="false">近景</button><span class="toolbar-divider"></span><button class="icon-button" id="reset" aria-label="恢复默认视角" title="复位视角 · R">${icon('reset')}</button></div>
          <div class="toolbar-right"><span class="interaction-hint">拖动旋转 <i>·</i> 滚轮缩放 <i>·</i> 右键平移</span><button class="icon-button glass" id="fullscreen" aria-label="切换全屏" title="全屏">${icon('fullscreen')}</button><button id="open-downloads" class="download-button glass">${icon('download')}<span>收藏这一刻</span></button></div>
        </div>
        <div class="time-panel glass">
          <div class="time-meta"><div><span class="micro">MAKE TIME YOURS</span><div class="time-heading"><output id="time-output" for="time">17:15</output><span id="time-label">日暮 · 金色时分</span></div></div><button id="play" class="play-button" aria-label="自动播放昼夜" aria-pressed="false">${icon('play')}<span>让时光流动</span></button></div>
          <div class="timeline-wrap"><input id="time" class="range time-range" type="range" min="0" max="24" step="0.01" value="17.25" aria-label="一天中的时间" aria-valuetext="17:15"><div class="timeline-ticks" aria-hidden="true"><span>00:00</span><span>04:00</span><span>08:00</span><span>12:00</span><span>16:00</span><span>20:00</span><span>24:00</span></div></div>
        </div>
        <footer><span>A LITTLE WORLD, A LITTLE WONDER.</span><span id="performance">实时 3D · 程序化风景</span><span>TOKYO TOWER <i>×</i> SEA OF FLOWERS</span></footer>
      </section>
      <button id="show-ui" class="restore-ui glass icon-button" aria-label="显示控制界面" title="显示界面 · H" hidden>${icon('eye')}</button>
      <div id="toast" class="toast glass" role="status" aria-live="polite"></div>
      <div id="loading" class="loading"><div class="loading-mark">${towerIcon}</div><span>正在种下一片花海</span><small>PREPARING YOUR LITTLE ESCAPE</small></div>
      <dialog id="downloads" class="download-dialog glass" aria-labelledby="download-title">
        <div class="dialog-heading"><span class="micro">TAKE A LITTLE TOKYO WITH YOU</span><button class="icon-button" id="close-downloads" aria-label="关闭下载窗口">${icon('close')}</button></div>
        <h2 id="download-title">把这片风景，带走。</h2><p>所有风景都由代码生长，无需外部素材。</p>
        <button class="download-option" id="download-offline">${icon('download')}<span><strong>离线体验包</strong><small>独立 HTML + 使用说明 · 解压后双击打开</small></span>${icon('arrow')}</button>
        <button class="download-option" id="download-model">${icon('cube')}<span><strong>东京塔 3D 模型</strong><small>GLB 格式 · 钢架、平台、窗户与材质</small></span>${icon('arrow')}</button>
        <button class="download-option" id="download-source">${icon('code')}<span><strong>完整项目源代码</strong><small>Vite + Three.js · 可修改、可部署</small></span>${icon('arrow')}</button>
        <div class="download-footnote">GLB 仅包含塔身几何与材质；花海、动态光照、天气和交互界面保留在网页中。</div>
      </dialog>
      <div id="fatal" class="fatal glass" role="alert" hidden><h2>这片风景暂时无法展开</h2><p id="fatal-message"></p><button id="reload">重新加载</button></div>
    </main>`;
  let toastTimer;
  const el=id=>document.getElementById(id);
  const period=hour=>hour<5?['深夜 · 星月相伴','UNDER THE STARS']:hour<7?['黎明 · 第一缕光','FIRST LIGHT']:hour<11?['清晨 · 花海初醒','MORNING BLOOM']:hour<15?['正午 · 晴光漫漫','SUNLIT HOURS']:hour<18?['日暮 · 金色时分','GOLDEN HOUR']:hour<20?['薄暮 · 天色温柔','TWILIGHT GLOW']:['夜晚 · 万家灯火','TOKYO AFTER DARK'];
  return {
    el,
    setTime(hour) {
      el('time').value=hour;el('time-output').textContent=formatTime(hour);
      el('time').setAttribute('aria-valuetext',formatTime(hour));el('time').style.setProperty('--progress',`${hour/24*100}%`);
      const [label,en]=period(hour%24);el('time-label').textContent=label;el('scene-period').textContent=en;
    },
    setPlay(playing){el('play').innerHTML=icon(playing?'pause':'play')+`<span>${playing?'暂停这一刻':'让时光流动'}</span>`;el('play').setAttribute('aria-pressed',playing);el('play').setAttribute('aria-label',playing?'暂停昼夜播放':'自动播放昼夜');},
    setWeather(mode) {
      document.querySelectorAll('[data-weather]').forEach(b=>{const active=b.dataset.weather===mode;b.classList.toggle('active',active);b.setAttribute('aria-pressed',active);});
      el('intensity').disabled=mode==='sun';
      el('intensity-label').textContent={sun:'风的轻语',rain:'雨量',snow:'雪量'}[mode];
      el('weather-caption').textContent={sun:'晴空之下，每一朵花都在呼吸。',rain:'听，雨落在花瓣与塔尖。',snow:'一场轻雪，把东京写成了诗。'}[mode];
      el('scene-weather').textContent={sun:'微风拂过花海',rain:'雨落东京',snow:'初雪与花'}[mode];
    },
    toast(message){clearTimeout(toastTimer);el('toast').textContent=message;el('toast').classList.add('visible');toastTimer=setTimeout(()=>el('toast').classList.remove('visible'),3600);},
    fatal(message){const loading=el('loading');if(loading)loading.hidden=true;el('fatal-message').textContent=message;el('fatal').hidden=false;},
    loaded(){el('loading').classList.add('loaded');setTimeout(()=>el('loading').remove(),700);},
  };
}
