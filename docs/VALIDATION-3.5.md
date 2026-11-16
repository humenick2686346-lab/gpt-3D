# V3.5.0 验证记录

验证环境：Linux、Chromium 和 SwiftShader 软件 WebGL，2026-10-29。

- `npm test`：8 项核心测试通过，覆盖埃及岛的实际沙岩底座、金字塔、岛屿间距以及绿洲的时间和昼夜变化；保留富士与浦东岛、U 型竹桥和三条瀑布的衔接检查。
- TypeScript 检查与 `npm run build` 通过，生成在线版、独立 HTML、离线 ZIP 和源码包。
- 检查 1600 × 1000 桌面与 390 × 844 手机的四个视角投影，三岛与竹桥均在相机的画面及深度范围内。
- 在 900 × 600 Chromium 中实际渲染三岛，确认三座金字塔和狮身人面像已加载，浏览器 JavaScript 与 Shader 错误为零。调整桌面镜头以减少底部相机栏对竹桥的遮挡。
- 实际 Windows 双击、PowerShell 启动器及真实显卡性能尚未实测；云端软件 WebGL 的速度不能代表真实 GPU。

此前验证记录见 [V3.4](VALIDATION-3.4.md)、[V3.3](VALIDATION-3.3.md) 和 [V3.2](VALIDATION.md)。
