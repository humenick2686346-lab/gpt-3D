# V3.3.0 验证记录

验证日期：2026-10-28。环境为云端 Linux、Chromium 和 SwiftShader 软件 WebGL。

- `npm test`：7 项核心测试通过。新增检查东京塔的实际三维几何、独立岩台和高度；三条上游水道与瀑布入口的顶点、宽度、流向和波形参数逐点一致，容差为 1e-5。
- TypeScript 检查及 `npm run build` 通过，生成在线版、独立 HTML、离线包和源码包。
- 使用真实 WebGL 场景检查英雄及侧视画面：岛、富士山、东京塔和水幕均可见，未发现 JavaScript、Shader 或控制台错误。图片记录在 `test-results/current-hero.png` 和 `test-results/current-waterfall-side.png`。
- 在昼夜时间暂停的状态下，等待实际新帧后，水动画时间从约 4.06 秒推进到 10.08 秒；时间滑块始终为 10:30，浏览器错误列表为空。原始数据见 [validation-3.3.json](validation-3.3.json)。
- 根据实际相机取景计算，桌面 1600 × 1000 与手机 390 × 844 的英雄、正面、俯视、侧面视角均能容纳东京塔及岩台。

软件 WebGL 画面帧率很低，不能代表真实 Windows 独立显卡性能。Windows 双击和 PowerShell 启动器未在本环境实测。上一版完整浏览器和离线往返检查见 [V3.2 验证记录](VALIDATION.md)。
