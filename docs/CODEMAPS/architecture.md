<!-- Generated: 2026-05-12 | Files scanned: 487 | Token estimate: ~780 -->

# 架构总览（ClawX）

## 系统形态
- 单仓库 Electron 桌面应用（非多包 monorepo）。
- 运行时由 4 层组成：
  1) Renderer（React + Vite）
  2) Electron Main
  3) Host API（本地 HTTP，127.0.0.1）
  4) OpenClaw Gateway（本地子进程，WS/HTTP）

## 高层架构图
```text
┌──────────────────────────────────────────────────────────────────┐
│                            User/UI                               │
└──────────────┬───────────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────────┐
│ Renderer (React 19 + HashRouter + Zustand)                      │
│ src/main.tsx -> src/App.tsx -> pages/*                          │
│  - hostApiFetch() / subscribeHostEvent() / gateway:rpc          │
└──────────────┬───────────────────────────────────────────────────┘
               │ IPC (hostapi:fetch, hostapi:token, app:request)
               ▼
┌──────────────────────────────────────────────────────────────────┐
│ Electron Main                                                    │
│ electron/main/index.ts                                           │
│  - BrowserWindow / Tray / Menu / Lifecycle                      │
│  - registerIpcHandlers()                                         │
│  - startHostApiServer()                                          │
│  - GatewayManager lifecycle                                      │
└──────────────┬───────────────────────────────────────────────────┘
               │ local HTTP (/api/*)
               ▼
┌──────────────────────────────────────────────────────────────────┐
│ Host API Server (electron/api/server.ts)                         │
│  - CORS + Bearer token + JSON content-type gate                 │
│  - route modules (settings/providers/channels/cron/...)         │
│  - HostEventBus -> SSE (/api/events)                            │
└──────────────┬───────────────────────────────────────────────────┘
               │ RPC (ws/http)
               ▼
┌──────────────────────────────────────────────────────────────────┐
│ OpenClaw Gateway Process                                          │
│ electron/gateway/manager.ts                                      │
│  - chat/session/cron/channel runtime                              │
│  - dispatch events to main -> renderer                            │
└──────────────┬───────────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────────┐
│ External Providers / Channel Plugins / Marketplace               │
│ Anthropic/OpenAI/Google/OpenRouter/...                           │
│ Feishu/WeCom/DingTalk/WhatsApp/WeChat plugins                    │
└──────────────────────────────────────────────────────────────────┘
```

## 关键边界
- UI 不直接访问 Gateway HTTP；统一走 `src/lib/host-api.ts` + `src/lib/api-client.ts`。
- Main 负责网络与进程控制（Gateway、更新、代理、OAuth、插件安装）。
- Host API 对外只暴露本机接口，并要求会话级 token。
- 数据持久化以文件/`electron-store` 为主，无关系型数据库。

## 核心流程图

### 1) Chat 请求主路径
```text
ChatInput -> useChatStore.sendMessage()
  -> text: useGatewayStore.rpc('chat.send', ...)
  -> media: hostApiFetch('/api/chat/send-with-media') [or IPC chat:sendWithMedia]
  -> Main GatewayManager.rpc('chat.send', ...)
  -> OpenClaw Gateway
  -> gateway events (status/notification/chat-message)
  -> HostEventBus / IPC
  -> useGatewayStore.handleGatewayNotification()
  -> useChatStore.handleChatEvent() -> UI render
```

### 2) 设置变更路径
```text
Settings Page -> useSettingsStore.setX()
  -> hostApiFetch('/api/settings/...', PUT)
  -> Host API route (settings.ts)
  -> utils/store.ts (electron-store)
  -> (if proxy/startup key) apply side-effects in main
```

### 3) Provider 账户路径
```text
Providers UI -> /api/provider-accounts
  -> handleProviderRoutes()
  -> ProviderService
  -> provider-store + secret-store + secure-storage
  -> provider-runtime-sync (sync to Gateway runtime)
```

## 关键入口文件
- `electron/main/index.ts`（652 行）
- `electron/api/server.ts`（135 行）
- `electron/main/ipc-handlers.ts`
- `src/main.tsx`
- `src/App.tsx`（213 行）

## Mermaid 图（可直接渲染）

### 1) 端到端流程图（Chat 主路径）
```mermaid
flowchart TD
    U[用户在 ChatInput 输入消息]
    S1[Renderer: useChatStore.sendMessage]
    D{消息类型}
    R1[文本: useGatewayStore.rpc chat.send]
    R2[多媒体: hostApiFetch /api/chat/send-with-media]
    I1[IPC: gateway:rpc 或 hostapi:fetch]
    M1[Electron Main]
    H1[Host API Server 路由]
    G1[GatewayManager.rpc chat.send]
    G2[OpenClaw Gateway Runtime]
    E1[Gateway 事件: status/notification/chat-message]
    B1[HostEventBus / IPC / SSE]
    S2[useGatewayStore.handleGatewayNotification]
    S3[useChatStore.handleChatEvent]
    UI[UI 刷新: ChatMessage / ExecutionGraphCard]

    U --> S1 --> D
    D -->|文本| R1 --> I1 --> M1 --> G1 --> G2
    D -->|多媒体| R2 --> I1 --> M1 --> H1 --> G1 --> G2
    G2 --> E1 --> B1 --> S2 --> S3 --> UI
```

### 2) 系统架构图（分层与依赖）
```mermaid
flowchart LR
    subgraph R[Renderer Layer React + Zustand]
        APP[src/main.tsx -> App.tsx]
        PAGES[Chat / Models / Agents / Channels / Skills / Cron / Settings]
        API[hostApiFetch + api-client + host-events]
    end

    subgraph EM[Electron Main Layer]
        MAIN[electron/main/index.ts]
        IPC[IPC Handlers\nhostapi:fetch / hostapi:token / app:request]
        GM[GatewayManager]
        BUS[HostEventBus]
    end

    subgraph HA[Host API Layer]
        SERVER[electron/api/server.ts]
        ROUTES[settings / providers / channels / cron / sessions / clawhub]
        AUTH[CORS + Bearer Token + JSON Gate]
    end

    subgraph GW[OpenClaw Gateway Process]
        RUNTIME[chat/session/cron/channel runtime]
    end

    subgraph ST[Storage and Config]
        ES[electron-store JSON]
        OC[~/.openclaw/openclaw.json]
        SEC[providerSecrets + secure-storage]
        SES[session jsonl + cron.json fallback]
    end

    subgraph EXT[External Integrations]
        LLM[Anthropic / OpenAI / Google / OpenRouter / ...]
        CH[Feishu / WeCom / DingTalk / WhatsApp / WeChat / ...]
        HUB[Marketplace / ClawHub]
    end

    APP --> PAGES --> API
    API --> IPC
    IPC --> MAIN
    MAIN --> SERVER
    SERVER --> ROUTES
    ROUTES --> ES
    ROUTES --> OC
    ROUTES --> SEC
    ROUTES --> SES
    MAIN --> GM --> RUNTIME
    RUNTIME --> LLM
    RUNTIME --> CH
    ROUTES --> HUB
    GM --> BUS --> API
```