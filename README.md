# 照护停火 CareTruce

> 当前交付：可运行的开发版，尚非可收费上架版本。AI 接入按用户要求暂缓，客户端不会发送模型请求；服务端目录仅保留待后续使用的原型。记录暂存在内存，刷新或关闭后会丢失。

uni-app / Vue 3 / TypeScript，iOS 优先的双端照护冲突复盘工具。

## 开发

```sh
npm ci
npm run dev:h5
npm test
npm run typecheck
npm run build:h5
```

使用现有 checkout；云任务已隔离，无需另建 worktree。依赖使用锁文件安装。

## 当前安全边界

开发版记录仅在运行内存中保存，刷新或关闭将丢失；不要输入真实个人或健康信息。原生加密数据库、系统密钥存储与生物识别尚待真机验证。不会用普通浏览器存储冒充加密数据库。

核心复盘在本地运行。AI 和支付在服务未配置前不可用，不会发送记录，也不模拟支付或 AI 成功。

## 原生发行前置条件

需要 macOS / Xcode、Apple 开发者账号和真机；安卓需要确定商店渠道。先验证 uni-app 原生加密、安全存储、支付、PDF 以及备份插件。AppID 和签名不得伪造；当前 manifest 仅供开发。

完整设计与实施计划见 docs/superpowers。

## 进一步验证

`npm run test:e2e` 在已运行的 H5 服务中验证完整操作并生成 artifacts 截图。`npm run server` 启动仅监听本机的 AI 网关；无模型配置时返回明确的未配置状态。网关需要 Node 24。

原生发布与模型部署前置条件、数据边界和未完成事项见 [发布清单](docs/release.md)。

AI 服务已选定 DeepSeek，服务端配置与安全注入方式见 [DeepSeek 接入说明](docs/deepseek.md)。当前尚无密钥，未验证真实调用。
