<!-- Generated: 2026-05-12 | Files scanned: 487 | Token estimate: ~860 -->

# Frontend Codemap（Renderer）

## 入口与路由树
- Entry: `src/main.tsx` -> `HashRouter` -> `App`
- Route root: `src/App.tsx`

```text
/setup/*          -> Setup
/                 -> Chat
/models           -> Models
/agents           -> Agents
/channels         -> Channels
/skills           -> Skills
/cron             -> Cron
/settings/*       -> Settings
(+ extension routes from rendererExtensionRegistry)
```

## 组件层次
```text
App
└─ MainLayout
   ├─ TitleBar
   ├─ Sidebar
   │  ├─ nav items (models/agents/channels/skills/cron/settings)
   │  └─ session list + session actions
   └─ <Outlet>
      ├─ Chat
      │  ├─ ChatToolbar
      │  ├─ ChatMessage list
      │  ├─ ExecutionGraphCard
      │  └─ ChatInput
      ├─ Models
      ├─ Agents
      ├─ Channels
      ├─ Skills
      ├─ Cron
      └─ Settings
```

## 状态管理（Zustand）
- `useSettingsStore`：主题/语言/启动/代理/更新/UI 状态；`init()` 读取 `/api/settings`。
- `useGatewayStore`：Gateway 状态与事件中枢；`init()` 拉取 `/api/gateway/status`，订阅 `gateway:*`。
- `useChatStore`：会话、消息、流式事件、tool 状态、历史恢复。
- `useProviderStore`：provider accounts/vendors/default account snapshot。
- `useChannelsStore`：频道配置、连接状态、自动重连。
- 其他：`agents.ts`, `skills.ts`, `cron.ts`, `update.ts`。

## 前端数据流

### 1) Host API 调用流
```text
Component/Store
  -> hostApiFetch(path)
  -> invokeIpc('hostapi:fetch')
  -> main ipc host-api proxy
  -> http://127.0.0.1:<host-api-port>/api/*
  -> JSON response -> store update
```

### 2) Gateway 事件流
```text
main HostEventBus emit
  -> renderer subscribeHostEvent('gateway:*')
  -> useGatewayStore handlers
  -> useChatStore/useChannelsStore side updates
  -> reactive UI refresh
```

### 3) Chat 发送流
```text
ChatInput
  -> useChatStore.sendMessage()
  -> text: useGatewayStore.rpc('chat.send', ...)
  -> media: hostApiFetch('/api/chat/send-with-media') [or IPC chat:sendWithMedia]
  -> Gateway runtime
  -> streaming events -> chat store
  -> ChatMessage / ExecutionGraphCard render
```

## 关键文件
- `src/App.tsx`（213 行）
- `src/components/layout/Sidebar.tsx`（420 行）
- `src/pages/Chat/index.tsx`（826 行）
- `src/stores/chat.ts`（2379 行）
- `src/stores/gateway.ts`（443 行）
- `src/lib/host-api.ts`, `src/lib/api-client.ts`, `src/lib/host-events.ts`

## 约束
- Renderer 不直接请求 Gateway HTTP；统一经 Main proxy。
- 默认 transport 策略是 IPC 优先（`gateway:rpc` 默认走 IPC）。