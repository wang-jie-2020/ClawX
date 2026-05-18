<!-- Generated: 2026-05-12 | Files scanned: 487 | Token estimate: ~700 -->

# Data Codemap（存储与配置）

## 数据存储模型
- 无传统数据库（无 ORM / SQL migration 目录）。
- 主存储：`electron-store`（JSON 文件）。
- 业务配置：`~/.openclaw/openclaw.json` 与相关 runtime 文件。
- 凭据：provider secret 存在 ClawX provider store（并兼容 legacy key 字段）。

## 主要“表/集合”映射

### A) settings store（`name: settings`）
文件：`electron/utils/store.ts`
- theme/language/startMinimized/launchAtStartup/telemetryEnabled
- gatewayAutoStart/gatewayPort/gatewayToken/proxy*
- updateChannel/autoCheckUpdate/autoDownloadUpdate/skippedVersions
- sidebarCollapsed/devModeUnlocked
- selectedBundles/enabledSkills/disabledSkills

### B) clawx-providers store（`name: clawx-providers`）
文件：`electron/services/providers/store-instance.ts`
- schemaVersion
- providers（legacy）
- providerAccounts（current）
- apiKeys（legacy compatibility）
- providerSecrets（current secret map）
- defaultProvider / defaultProviderAccountId

## “迁移历史”
文件：`electron/services/providers/provider-migration.ts`
- v0 -> v1：`providers` -> `providerAccounts`
- v1 -> v2：清空 legacy `providers`，避免重复与幽灵账户
- 当前 schema: `2`

## 关键数据路径

### Provider 配置与密钥
```text
ProviderService
  -> provider-store.ts (metadata)
  -> secret-store.ts (ProviderSecret)
  -> secure-storage.ts (legacy compatibility)
```

### 渠道配置
```text
channel-config.ts
  -> ~/.openclaw/openclaw.json
  -> channels + plugins.entries + allowlist
```

### Session / Cron 历史
- Session transcript: `~/.openclaw/agents/.../sessions/*.jsonl`（由 sessions route 读取）
- Cron fallback: `~/.openclaw/cron/cron.json`（RPC 不可用时）

## 数据流图（Provider）
```text
UI /api/provider-accounts
  -> provider routes
  -> ProviderService
  -> providerAccounts + providerSecrets
  -> provider-runtime-sync -> OpenClaw runtime config/auth
```

## 数据流图（Channel）
```text
UI /api/channels/config*
  -> channel routes
  -> channel-config.ts
  -> openclaw.json (channels/plugins)
  -> Gateway restart/refresh on demand
```

## 关键文件
- `electron/utils/store.ts`
- `electron/services/providers/store-instance.ts`
- `electron/services/providers/provider-store.ts`
- `electron/services/providers/provider-migration.ts`
- `electron/services/secrets/secret-store.ts`
- `electron/utils/channel-config.ts`（1632 行）
- `electron/utils/openclaw-auth.ts`
- `electron/utils/secure-storage.ts`