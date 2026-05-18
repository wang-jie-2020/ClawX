<!-- Generated: 2026-05-12 | Files scanned: 487 | Token estimate: ~900 -->

# Backend Codemap（Electron Main + Host API）

## 请求处理链
```text
HTTP request
  -> setCorsHeaders(origin)
  -> OPTIONS preflight (204)
  -> Bearer token auth (Authorization or ?token=)
  -> requireJsonContentType() for mutating requests
  -> iterate route handlers (core + extension)
  -> 404 fallback / 500 error
```
来源：`electron/api/server.ts`, `electron/api/route-utils.ts`

## Route Map（核心）
- `GET /api/events` -> `handleAppRoutes` -> `HostEventBus.addSseClient` + status snapshot
- `GET /api/gateway/status|health` -> `handleGatewayRoutes` -> `GatewayManager.getStatus/checkHealth`
- `POST /api/gateway/start|stop|restart` -> `handleGatewayRoutes` -> `GatewayManager`
- `POST /api/chat/send-with-media` -> `handleGatewayRoutes` -> `GatewayManager.rpc('chat.send')`
- `GET|PUT /api/settings` -> `handleSettingsRoutes` -> `utils/store.ts`
- `GET|PUT /api/settings/:key` -> `handleSettingsRoutes` -> `getSetting/setSetting`
- `GET|POST /api/provider-accounts` -> `handleProviderRoutes` -> `ProviderService`
- `PUT|DELETE /api/provider-accounts/:id` -> `handleProviderRoutes` -> `ProviderService`
- `GET /api/provider-vendors` -> `handleProviderRoutes` -> `ProviderService.listVendors`
- `GET /api/channels/accounts|targets|configured` -> `handleChannelRoutes` -> channel config/runtime aggregation
- `POST|PUT|DELETE /api/channels/config*` -> `handleChannelRoutes` -> `utils/channel-config.ts`
- `GET|POST /api/cron/jobs` -> `handleCronRoutes` -> `GatewayManager.rpc('cron.*')`
- `PUT|DELETE /api/cron/jobs/:id` -> `handleCronRoutes` -> `GatewayManager.rpc('cron.update/remove')`
- `POST /api/cron/trigger|toggle` -> `handleCronRoutes` -> `GatewayManager.rpc`
- `GET /api/sessions/transcript` -> `handleSessionRoutes` -> transcript file read
- `POST /api/clawhub/search|install|uninstall` -> `handleSkillRoutes` -> `ClawHubService`

## Service -> Store/Repo 映射
```text
providers routes
  -> ProviderService (services/providers/provider-service.ts)
    -> provider-store.ts (account metadata)
    -> secret-store.ts + secure-storage.ts (api key / secret)
    -> provider-migration.ts (schema migration)
    -> provider-runtime-sync.ts (sync runtime)

settings routes
  -> utils/store.ts (electron-store settings)
  -> main/proxy.ts + launch-at-startup.ts (side effects)

channels routes
  -> utils/channel-config.ts (openclaw.json channels/plugins)
  -> utils/plugin-install.ts (plugin bootstrap)
  -> config-first write path + gateway restart/refresh orchestration
  -> optional runtime probe via GatewayManager.rpc('channels.status')

cron routes
  -> GatewayManager.rpc('cron.*')
  -> fallback read ~/.openclaw/cron/cron.json when RPC unavailable
```

## 事件链（Main -> Renderer）
```text
GatewayManager events
  -> HostEventBus.emit('gateway:*')
  -> SSE /api/events or IPC mapped channels
  -> renderer subscribeHostEvent()
  -> gateway/chat/channels stores update UI
```
关键文件：`electron/main/index.ts`, `electron/api/event-bus.ts`, `src/lib/host-events.ts`

## IPC 边界
- `hostapi:fetch`：Renderer -> Main proxy -> Host API（注入 Bearer token）
- `hostapi:token`：Renderer 获取 Host API 会话 token
- `app:request`：兼容旧 IPC 协议（provider/settings/update/cron 等）

关键文件：`electron/main/ipc/host-api-proxy.ts`, `electron/main/ipc-handlers.ts`

## Key Files
- `electron/api/server.ts`（135 行）
- `electron/api/routes/providers.ts`（457 行）
- `electron/api/routes/channels.ts`（1554 行）
- `electron/api/routes/cron.ts`（695 行）
- `electron/services/providers/provider-service.ts`（501 行）