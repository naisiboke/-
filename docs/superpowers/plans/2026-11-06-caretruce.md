# CareTruce Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现已确认视觉的 uni-app 客户端闭环，逐步补齐可收费发布能力。

**Architecture:** 客户端展示、领域规则和持久化分离。AI 与交易由独立网关负责；所有未配置的上线能力明确显示状态，不用模拟成功代替。

**Tech Stack:** Vue 3、TypeScript、uni-app、Vitest；服务端 TypeScript，实际基础设施经部署条件确定。

**Spec:** docs/superpowers/specs/2026-11-06-caretruce-design.md

## Global Constraints

- 使用现有隔离 checkout，不创建 worktree。
- 白底、蓝色点缀、留白，每屏一个主要操作，正文至少 17px。
- 不评判个人，不补造事实；核心规则离线可用。
- 模型密钥不得进入客户端；未配置 AI 与支付不得假成功。
- 真实记录不得明文持久化；H5 验证不代表原生安全验证。
- 安装保留 TLS 与校验，使用锁文件，不提交密钥。

## Review Focus

- 空白输入不能生成复盘或丢失已写草稿。
- 存储损坏、迁移和写入失败不能静默清空用户数据。
- 连点、重试与返回不能重复创建记录或重复扣费。
- AI 输出异常、离线和超时保留本地结果与原文。
- 恢复购买不能伪造消耗型额度，日志不能包含家庭记录。

### Task 1: 客户端工程与领域闭环

**Files:** package.json, src/domain/reflection.ts, src/domain/templates.json, tests/reflection.test.ts, src/main.ts, src/App.vue, src/pages.json, src/manifest.json。
**Interfaces:** ReflectionInput 包含 facts、feelings、needs、category、context；reflect(input) 返回 gap、action、templateId；类型与模板由该模块导出。

- [ ] 固定兼容的 uni-app 依赖版本，配置 H5 开发与构建、测试和类型检查。
- [ ] 先写测试：空白事实拒绝；六类情境均给出一条可执行建议；未知类别拒绝；不篡改输入。
- [ ] 运行 Vitest 观察缺失实现失败，再实现规则匹配与六类各三个模板，运行完整测试。
- [ ] 验证 npm run build:h5 与 npm run typecheck；记录原生打包尚未验证的能力。

### Task 2: 草稿与记录安全存储

**Files:** src/storage/records.ts, src/storage/secure-store.ts, tests/records.test.ts。
**Interfaces:** RecordRepository 的 saveDraft、loadDraft、saveRecord、listRecords、updateRecord、deleteRecord；加密存储端口 read/write/remove，异步返回明确错误。

- [ ] 先写并运行失败测试：草稿往返、保存幂等、状态更新、删除单条、损坏数据与写入失败不覆盖旧数据。
- [ ] 验证原生加密数据库与系统密钥存储的候选方案，再实现持久化适配；若环境不支持验证，开发模式只使用内存且明确提示不持久保存，不保存真实记录。
- [ ] 实现版本化序列化与存储错误提示，运行完整测试。

### Task 3: 极简页面与交互

**Files:** src/pages/home/index.vue, src/pages/journal/index.vue, src/pages/result/index.vue, src/pages/history/index.vue, src/pages/settings/index.vue, src/components/\*, src/styles/tokens.scss, tests/journey.test.ts。
**Interfaces:** 页面消费 ReflectionInput、RecordRepository；保存后按 recordId 打开结果；独立草稿状态支撑步骤返回。

- [ ] 为记录完成、返回保留内容、重复点击不重复保存、历史状态切换写失败测试。
- [ ] 实现首页、四步记录、结果、历史与设置；无数据使用真实空状态，不预填用户历史。
- [ ] 实现一次小调整与反馈，AI 未配置入口明确说明不可用。
- [ ] 跑测试、类型检查、H5 构建与浏览器实际交互；检查小屏、键盘、字体放大和安全区域。

### Task 4: AI 网关与确认流程

**Files:** server/src/ai.ts, server/src/quota.ts, server/tests/ai.test.ts, src/services/ai.ts, src/pages/ai/index.vue。
**Interfaces:** POST /v1/reflections 接受经过确认的文本与幂等键，返回经校验的 gap/action 或结构化错误；额度以服务端账本为准。

- [ ] 测试脱敏预览取消不发请求、异常输出不覆盖记录、超时、并发限额与幂等请求只扣一次。
- [ ] 实现服务端安全配置、身份校验、限流、模型适配和输出约束，日志禁止正文与密钥。
- [ ] 完成发送预览、确认、采纳和删除临时结果；用测试提供方验证故障，再以用户配置的真实服务验证成功调用。
- [ ] 未具备模型与部署配置时记录具体阻塞，不宣称 AI 已上线。

### Task 5: 原生支付、导出与发布

**Files:** src/services/purchases.ts, server/src/purchases.ts, src/services/export.ts, src/services/backup.ts, tests/backup.test.ts, docs/release.md, README.md。
**Interfaces:** 服务端验证交易并幂等更新权益；exportRecord 由用户选定字段生成文件；备份包含版本与完整性校验，不含密钥。

- [ ] 先验证篡改交易拒绝、通知重放、额度并发、备份往返与错误密码不破坏现有数据。
- [ ] 实现商店购买与恢复、核心离线权益、PDF/文本预览、加密备份与恢复。
- [ ] 真机检查生物识别、重启、卸载/重装、购买取消和恢复；测试日志脱敏与敏感数据系统备份排除。
- [ ] 完成隐私政策、支持信息、商店说明及审核步骤；未完成真机和交易验收不得称可收费上架。

## 执行与验收

先执行 Task 1–3，作为首个可运行交付；再继续 Task 4–5。完成前运行完整测试、类型检查、生产构建和实际交互验收，报告执行数量与限制。任何外部阻塞不停止可独立完成的工作。
