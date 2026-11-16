# V3.7.0 验证记录

验证日期：2026-11-16。环境为 Linux、Node.js 24、Chromium 与 SwiftShader 软件 WebGL。

- `npm test`：13 项核心测试通过。新增悉尼歌剧院曲面几何、海港大桥桥下开口、渡轮闭合航线与海湾范围、昼夜灯光检查；两条新跨岛桥在两端中心及桥面边缘均有干燥地面承接。五岛图连通、六座跨岛桥和桌面/手机四视角投影检查通过。
- TypeScript 检查和 `npm run build` 通过，生成在线版、自包含 HTML、离线 ZIP、源码与完整交付包。
- `node tests/islands.mjs`：6 项集中浏览器检查通过，覆盖五岛全景、动态海湾与既有动画、夜景、俯视桥梁网络、390 × 844 手机竖屏和断网 HTML。JavaScript / Shader 错误均为零。
- 昼夜暂停在 10:30 时，动画时间从 9.3839 秒增加至 13.4006 秒；悉尼海湾、法国喷泉、瀑布、云层与落樱继续推进。另以真实 WebGL 单独渲染悉尼岛近景，检查八片层叠曲壳、海港大桥、悉尼塔、分层岩体和渡轮尾流，无控制台错误。
- 独立 HTML 在禁网浏览器上下文中启动，确认五岛、六座跨岛桥和悉尼地标加载，海湾与喷泉持续运动，HTTP 请求为零。云环境策略禁止 `file://`，因此在禁网 `about:blank` 中加载完全相同的 HTML；Windows 双击和 PowerShell 启动器未在本环境执行。
- 补入本记录、报告与预览图后重新打包，并对比嵌入脚本/CSS 的 SHA-256，确认最终离线包的运行代码与浏览器验证版本一致。源码 ZIP 包含澳大利亚模块、更新后的桥梁/镜头以及验证资料。

原始报告见 [validation-3.7.json](validation-3.7.json)，复现脚本为 [tests/islands.mjs](../tests/islands.mjs)。截图保存在 `test-results/five-islands-{day,night,top,mobile}.png` 与 `test-results/sydney-closeup.png`；已提交的预览为 [五岛全景](preview.webp) 和 [悉尼近景](australia.webp)。本次没有重复全部历史端到端检查；此前记录见 [V3.6](VALIDATION-3.6.md)、[V3.5](VALIDATION-3.5.md) 和 [V3.4](VALIDATION-3.4.md)。

本次快照的软件 WebGL 帧率约 0.3 FPS，不代表真实显卡表现；真实 Windows GPU 性能仍需实机测试。
