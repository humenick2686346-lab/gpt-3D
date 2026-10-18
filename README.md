# 东京塔 · 时光花海

**Tokyo Tower: Sea of Flowers** — 可交互、可离线运行的程序化 3D 网页。约 333 米高的红白东京塔、实例化郁金香 / 薰衣草 / 波斯菊、连续昼夜、晴雨雪、可导出的 GLB 模型。所有美术与环境音均由代码生成，无付费 API、外部模型、贴图、字体或音频资源。

[完整交付 ZIP](downloads/v1.0.0/tokyo-tower-complete.zip) · [离线体验 ZIP](downloads/v1.0.0/tokyo-tower-offline.zip) · [独立 HTML](downloads/v1.0.0/tokyo-tower-offline.html) · [东京塔 GLB](downloads/v1.0.0/tokyo-tower-333m.glb)

## 本地运行

需要 **Node.js 22.12+ 或 24+**，以及支持 WebGL 2 的现代浏览器。

```sh
npm ci
npm run dev
```

打开终端显示的本地地址。开发服务器用于编辑与热更新；要验证全部下载功能，请先构建，再运行预览：

```sh
npm test
npm run build
npm run preview
```

若云环境的默认 npm 缓存目录不可写，使用 `npm ci --cache /tmp/tokyo-npm-cache`。

## 操作

| 控制 | 作用 |
| --- | --- |
| 左键拖动 / 单指拖动 | 平滑环绕旋转 |
| 滚轮 / 双指捏合 | 缩放，有距离限制 |
| 右键拖动 / 双指拖动 | 平移，有场景边界与地面 / 塔体避让 |
| 全景 / 仰视 / 近景 | 平滑切换三个预设视角 |
| 复位 / `R` | 恢复全景视角 |
| 时间进度条 | 任意选择 00:00—24:00；拖动会暂停自动播放 |
| 播放 / 空格 | 约 4 分钟走完 24 小时，循环播放 |
| 晴天 / 下雨 / 下雪 | 互斥天气，与时间独立，立即更新 |
| 天气强度 | 调整雨雪密度与雾；雨量、雪量分别记忆，0% 关闭粒子 |
| 音量按钮 | 开启 / 静音程序化环境声，默认静音 |
| 沉浸模式 / `H` | 隐藏 / 显示 UI，右上角保留恢复按钮 |
| 全屏按钮 | 浏览器全屏；不支持时给出提示，可改用沉浸模式 |
| 收藏这一刻 | 下载离线包、源码 ZIP 或 GLB 模型 |
| `Escape` | 关闭下载窗口；窗口关闭时恢复 UI |

画质低 / 中 / 高分别采用 **6,500 / 15,000 / 28,000** 株精细实例花卉，另有 **18,000 / 40,000 / 65,000** 个远景花簇；天气粒子上限 **1,800 / 4,200 / 7,600**，实际数目乘以强度。低画质禁用阴影，中 / 高为 1024 / 2048 阴影图，像素比上限为 1 / 1.5 / 2。移动设备默认低画质。初始自动画质若持续低于 24 FPS，会降为低画质；用户手动选择后保持选择。

## 下载与离线交付

仓库的 `downloads/v1.0.0/` 目录提供实际生成的版本快照：完整交付 ZIP、独立 HTML、GLB 模型和许可证。无需先构建即可下载保存。它是固定版本的交付文件，`npm run build` 会更新下述 `release/` 产物，不会改写已提交的版本快照。

`npm run build` 实际生成以下文件：

| 文件 | 用途 |
| --- | --- |
| `dist/` | 可部署到静态托管的完整网站，含下载资源 |
| `release/tokyo-tower-complete.zip` | 完整交付：源码、锁文件、说明、许可证、可直接打开的 `offline/index.html` |
| `release/tokyo-tower-source.zip` | 可编辑的项目源代码，依赖由 `npm ci` 安装 |
| `release/tokyo-tower-offline.html` | 自包含单文件，双击即可运行，无网络请求 |
| `release/tokyo-tower-offline.zip` | 独立 HTML、中文离线说明与第三方许可证 |
| `release/THIRD_PARTY_LICENSES.txt` | 第三方依赖许可证 |

离线 HTML 内嵌完整运行代码和源码归档，可在 `file://` 下继续下载源码、离线 ZIP 和 GLB。无需安装 Node.js。浏览器如果限制本地文件的全屏或音频，可用沉浸模式，或执行 `python3 -m http.server 8080 --directory dist` 通过 HTTP 打开网站。

**GLB** 通过 Three.js `GLTFExporter` 在浏览器内真实生成，Y 轴向上，1 单位≈1 米。文件包含合并的红白钢架、塔脚、观景平台、窗户、设备、天线、静态材质。**不包含**花海、天空、雨雪、地形、交互 UI、音频和动态昼夜照明。塔身是参考东京塔轮廓与高度的程序化艺术近似，并非建筑测绘模型。

## 部署到 GitHub Pages

仓库已提供 `.github/workflows/pages.yml`。在 GitHub 仓库 **Settings → Pages → Source** 选择 **GitHub Actions**。代码进入 `main` 后，或在 Actions 手动运行工作流，将测试、构建并发布 `dist`。构建任务另上传 `tokyo-tower-downloads` 制品，包含完整 ZIP 和离线 HTML。通过部署任务实际生成的 HTTPS 地址访问；本文不把尚未执行的部署视为已上线。

Vite 使用 `base: './'`，兼容仓库子路径。其他静态托管平台的构建命令为 `npm ci && npm run build`，输出目录为 `dist`。无需后端或密钥。

## 验证

```sh
npm test              # 连续太阳周期、时间边界、确定性地形 / 随机分布、333m 真实几何
npm run build        # 标准网站 + 单文件离线版 + ZIP 交付
npm run test:browser # 构建后执行，使用本机 Chromium 或 Playwright Chromium
```

浏览器测试会启动预览服务器，检查实际 WebGL 场景、昼夜切换、雨雪与强度、自动播放和手动暂停、相机旋转缩放 / 预设 / 复位、沉浸模式、画质、GLB 内容、ZIP 内容及断网离线版，并保存桌面 / 手机截图和报告至 `test-results/`。无系统 Chromium 时先执行 `npx playwright install chromium`；可通过 `CHROMIUM_PATH` 指定已有浏览器。

云端 Chromium 的管理策略禁止 `file://` 导航。测试会记录该限制，在全禁网的 `about:blank` 中加载原始独立 HTML，验证渲染和离线包再次下载 / 再加载；不禁用管理策略。真实 Windows 浏览器的双击打开仍需实机确认。

性能数字从真实渲染循环采样，当前帧率显示在页脚，诊断可读取 `window.__TOKYO__.snapshot()`。普通电脑目标 60 FPS、移动端目标 30 FPS，但 GPU、屏幕像素与浏览器差异很大，**不保证固定帧率**。软件 WebGL 自动化结果不代表真实 Windows / Android GPU 性能。

本次交付的执行结果、约 1 FPS 的云端软件渲染采样以及未验证范围详见 [验证记录](docs/VALIDATION.md)。

## 文件结构

```text
src/
  main.js                 # 场景装配、状态、事件、渲染循环、资源释放
  style.css               # 响应式玻璃 UI、手机与横屏布局
  core/math.js            # 确定性随机、地形、小径、时间格式
  scene/
    tower.js              # 合并钢梁几何、双层观景台、天线、积雪层
    flowers.js            # 三类实例化花卉与 GLSL 风动
    ground.js             # 起伏地形、小径、远山、湿润与积雪
    sky.js                # 连续天空、太阳 / 月亮、程序云层、星空
  systems/
    time.js               # 24 小时连续光照、雾色、塔灯
    weather.js            # 世界空间雨线、风驱雪粒子
    camera.js             # OrbitControls、相机预设、碰撞边界
    audio.js              # 用户主动开启的程序化环境音
    downloads.js          # GLB、离线 ZIP、源码下载
  ui/
    interface.js          # 语义化界面与状态同步
    icons.js              # 内嵌 SVG 图标
scripts/package.mjs       # 单文件嵌入、许可证与发布包
tests/                    # 核心测试、端到端浏览器测试
downloads/v1.0.0/          # 已生成、可下载的离线网页 / 完整 ZIP / GLB 版本快照
.github/workflows/        # Pages 构建发布
```

## 视觉与技术边界

- 天空、太阳方向、光色、影长、半球环境光、雾色、月光、星空与塔灯随时间连续变化。晴天日出约 05:30、日落约 19:30，为艺术化固定周期，不计算季节天文数据。
- 花海采用实例化而非逐株独立对象；近景有花瓣 / 花杯 / 花穗 / 茎叶几何。远景采用十个三角形的花簇，着色器按距离渐变精细花卉与花簇的几何尺寸，衔接地表色带与雾。按画质降低植被密度，合并塔身重复构件；只有静态塔体投影，缓存阴影图并在时间、天气或画质变化时更新，没有逐株动态阴影。
- 雨天使用真实 3D 雨线，地面粗糙度 / 金属度与浅水洼变化；采用环境反射与清漆高光，**不使用屏幕空间反射或物理水模拟**。雪天为不同速度和尺寸的粒子、冷雾、地面混色及平台雪帽，不是逐帧累积的真实积雪模拟。
- 页面尺寸改变时更新相机与渲染器；图形上下文丢失有明确提示；页面退出释放几何、材质、实例缓冲、音频、阴影与渲染器。
- 自动化验证覆盖桌面和触屏仿真；真实 Windows 电脑、Android / iOS 机型仍需设备实测。WebGL 2 不可用时显示错误提示。

## 许可证

项目源码为 [MIT](LICENSE)。Three.js、fflate 等依赖保留各自许可证，构建生成 `THIRD_PARTY_LICENSES.txt`。无第三方美术素材。项目为独立创意作品，与东京塔运营方无隶属关系。
