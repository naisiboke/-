# DeepSeek 接入配置

> 当前状态：用户要求先不接入 AI。以下仅保留配置参考，不要求现在填写密钥，也未启用客户端调用。

用户已选择 DeepSeek。服务端使用 OpenAI 兼容接口：

- 完整接口：https://api.deepseek.com/chat/completions
- 初始模型：deepseek-chat；真实可用性、输出质量与费用待有密钥后验证。
- 请求结构：JSON 输出，字段 facts、feelings、needs、gap、action。
- 数据流：用户检查发送预览 → 自有网关鉴权/额度校验 → DeepSeek。

## 云环境安全配置

已保存配置草稿：MODEL_API_URL、MODEL_NAME、NODE_USE_ENV_PROXY。密钥要求名为 DEEPSEEK_API_KEY，注入到服务端 MODEL_API_KEY，仅允许在 api.deepseek.com 的 HTTPS 请求中使用。没有保存密钥值。

在环境设置为该要求填写 DeepSeek 密钥，检查并保存配置，再发布环境。草稿保存不等于当前进程已获得凭证；应用配置后需要重启网关并重新验证。保留已有 HTTPS 代理与 CA，不得关闭 TLS 验证。Node 24 的 NODE_USE_ENV_PROXY=1 使 fetch 使用环境代理。

不要把密钥发在聊天里、写入客户端或放入任何 VITE_ 变量。代理占位值不能复制到本地作为真实密钥使用。

## 本地开发

复制 .env.example 为被 Git 忽略的 .env，在本机安全填写 MODEL_API_KEY，再运行：

```sh
node --env-file=.env server/index.mjs
```

npm run server 使用已注入的进程环境，不会自动读取 .env。生产环境由部署平台安全注入，数据库必须使用持久化私有目录。

## 仍未完成

当前机器没有可用密钥，因此没有进行真实 DeepSeek 调用。客户端 AI 按钮仍明确不可用；必须先完成安装身份/额度授予、付费恢复与网关部署，不能用一个共享客户端令牌临时绕过。DeepSeek 数据处理条款、保留策略和地区适用性需要上线前核查。

后续联调只用虚构记录，先检查 HTTP 与结构化结果，再验证取消、超时退款、去重和额度。只有这些通过后才开放客户端发送。
