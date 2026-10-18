# 时光花海 · v1.0.0 下载

本目录为实际生成的交付快照。GitHub 中打开文件后，使用文件右上方的下载按钮保存；或下载整个仓库 ZIP 后解压。

- `tokyo-tower-complete.zip`：完整源码、锁文件、说明、许可证和 `offline/index.html`。
- `tokyo-tower-offline.zip`：独立 HTML、离线说明与第三方许可证，解压即可保存体验。
- `tokyo-tower-offline.html`：单文件离线网页，无运行时网络依赖。
- `tokyo-tower-333m.glb`：浏览器中真实导出的东京塔几何与材质，1 单位约 1 米，塔顶 333 米。GLB 不含花海、天气、天空、UI 或动态光照。
- `THIRD_PARTY_LICENSES.txt`、`LICENSE.txt`：第三方依赖和本项目许可证。

需要支持 WebGL 2 的 Chrome、Edge、Firefox 等浏览器。普通浏览器可双击离线 HTML；本项目的云端 Chromium 管理策略禁止 file://，因此已通过禁网加载单文件验证其自包含运行，真实 Windows 双击仍需设备确认。也可以使用本地 HTTP 服务运行，详见仓库根目录 README。

这些文件为固定版本快照。后续开发请在项目根目录运行 `npm ci`、`npm run build`，新的交付文件在 `release/`；不要把固定版本快照误认为后续修改的自动同步输出。
