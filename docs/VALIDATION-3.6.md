# V3.6.0 验证记录

验证日期：2026-11-14。环境为 Linux、Node.js 24、Chromium 与 SwiftShader 软件 WebGL。

- `npm test`：11 项核心测试通过。包含巴黎地标实际几何、凯旋门的可穿过开口、喷泉昼夜和时间变化，四岛桥梁环线的图连通性、桥面连续性及桌面/手机四视角投影；保留富士、浦东、埃及与三处水道/瀑布衔接检查。
- TypeScript 检查和 `npm run build` 通过，生成在线版、自包含 HTML、离线 ZIP、源码与完整交付包。
- `node tests/four-islands.mjs`：6 项集中浏览器检查通过。实际 WebGL 渲染四岛、桥梁、白天与夜景，俯视可以看到完整环线，390 × 844 手机竖屏显示四岛且无页面溢出。所有 JavaScript / Shader 错误均为零。
- 昼夜暂停在 10:30 时，动画时间从 9.5476 秒增加至 13.5644 秒；法国喷泉、瀑布、云层与落樱均继续推进。喷泉水滴采用独立飞行相位，云层拥有柔和边缘与昼夜染色；夜间标题和操作提示已进行视觉检查。
- 独立 HTML 在禁网浏览器上下文中启动，确认四岛和四座跨岛桥加载，喷泉继续运动，HTTP 请求为零。该环境策略阻止 `file://`，因此加载的是完全相同的 HTML 内容；Windows 双击和 PowerShell 启动器未在本环境执行。

原始浏览器报告见 [validation-3.6.json](validation-3.6.json)。可复现的集中检查脚本为 [tests/four-islands.mjs](../tests/four-islands.mjs)，截图写入 `test-results/four-islands-{day,night,top,mobile}.png`。本次未重复全部历史端到端检查；此前记录见 [V3.5](VALIDATION-3.5.md)、[V3.4](VALIDATION-3.4.md) 和 [V3.2](VALIDATION.md)。

本环境的软件 WebGL 帧率约 0.2–0.4 FPS，不代表真实显卡表现；真实 Windows GPU 性能仍需实机测试。
