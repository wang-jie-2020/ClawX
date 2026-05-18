<!-- Generated: 2026-05-12 | Files scanned: 487 | Token estimate: ~760 -->

# Dependencies Codemap（外部依赖与集成）

## Runtime 平台依赖
- Electron: 应用容器与主进程能力
- OpenClaw: 网关与 agent runtime（本地进程）
- WebSocket (`ws`): 与 gateway 通信
- electron-store: 本地配置/账户持久化
- electron-updater: 更新机制

## AI Provider 集成（内建 provider registry）
来源：`electron/shared/providers/registry.ts`
- anthropic
- openai
- google
- openrouter
- ark
- moonshot
- moonshot-global
- siliconflow
- deepseek
- minimax-portal
- minimax-portal-cn
- modelstudio
- ollama
- custom

## 通道/插件生态
- 渠道配置与启停：`electron/utils/channel-config.ts`
- 插件安装：`electron/utils/plugin-install.ts`
- 涉及渠道：Feishu / WeCom / DingTalk / WhatsApp / WeChat / Telegram / Discord / QQBot 等
- 市场能力：`ClawHubService` + `/api/clawhub/*`

## 观测与运维依赖
- Telemetry: `posthog-node`（`electron/utils/telemetry.ts`）
- Updates: `electron-updater`（`electron/main/updater.ts`）
- Diagnostics: `/api/diagnostics/*`, `/api/app/openclaw-doctor`

## 网络与代理链路
```text
Renderer request
  -> IPC hostapi:fetch
  -> Main proxyAwareFetch
  -> Host API / external HTTP

Gateway communication
  -> IPC gateway:rpc (default)
  -> optional ws/http diagnostics path
```
关键文件：`src/lib/host-api.ts`, `src/lib/api-client.ts`, `electron/main/ipc/host-api-proxy.ts`

## 共享/跨层库
- 类型与 provider schema：`electron/shared/providers/types.ts`
- Provider registry：`electron/shared/providers/registry.ts`
- 语言支持：`shared/language`

## 风险点依赖（运维关注）
- OpenClaw runtime 与版本兼容
- Provider API 协议（openai-completions / openai-responses / anthropic-messages）
- 第三方渠道插件可用性与 schema 兼容
- 更新源可达性（OSS URL 与 channel）

## Key Files
- `package.json`
- `electron/shared/providers/registry.ts`
- `electron/main/updater.ts`
- `electron/utils/telemetry.ts`
- `electron/gateway/manager.ts`
- `electron/gateway/clawhub.ts`