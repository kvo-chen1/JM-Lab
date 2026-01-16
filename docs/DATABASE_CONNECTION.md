# 数据库连接模块说明文档

本文档详细介绍了项目中的数据库连接模块 (`server/database.mjs`)，特别是针对 Supabase (PostgreSQL) 的连接管理、连接池配置、监控以及故障排查指南。

## 1. 概述

项目使用统一的数据库管理模块，支持 SQLite、MongoDB、PostgreSQL (Supabase/Neon) 等多种数据库类型。

**核心功能：**
*   **统一接口**：通过 `getDB()` 获取数据库实例，无需关心底层实现。
*   **连接池管理**：针对 PostgreSQL 实现高效的连接池 (Connection Pooling)，支持自动重连。
*   **健康检查**：提供 `getDBStatus()` 实时监控连接状态。
*   **错误处理**：内置重试机制和错误日志记录。
*   **自动 Schema 迁移**：应用启动时自动检查并更新数据库表结构。

## 2. 配置指南

数据库连接主要通过环境变量进行配置。请确保项目根目录下存在 `.env` 或 `.env.local` 文件。

### Supabase / PostgreSQL 配置

| 环境变量 | 描述 | 示例/默认值 |
| :--- | :--- | :--- |
| `DB_TYPE` | 显式指定数据库类型 (可选) | `supabase` 或 `postgresql` |
| `SUPABASE_URL` | Supabase 项目 URL | `https://xyz.supabase.co` |
| `POSTGRES_URL` | 完整的 PostgreSQL 连接字符串 | `postgres://user:pass@host:5432/db` |
| `POSTGRES_MAX_POOL_SIZE` | 连接池最大连接数 | `20` |
| `POSTGRES_IDLE_TIMEOUT` | 空闲连接超时时间 (毫秒) | `30000` (30秒) |
| `POSTGRES_CONNECTION_TIMEOUT` | 建立连接超时时间 (毫秒) | `10000` (10秒) |

> **注意**：如果同时存在 `SUPABASE_URL` 和 `POSTGRES_URL`，系统会自动识别为 Supabase 模式并进行相应优化（如 SSL 配置）。

### 其他数据库配置 (参考)

*   `SQLITE`: 默认模式，无需额外配置，数据存储在 `data/` 目录。
*   `MONGODB_URI`: MongoDB 连接字符串。

## 3. 使用方法

### 获取数据库实例

```javascript
import { getDB } from './server/database.mjs';

async function performQuery() {
  const db = await getDB();
  
  // 对于 PostgreSQL / Supabase
  const result = await db.query('SELECT * FROM users WHERE id = $1', [1]);
  console.log(result.rows);
}
```

### 检查连接状态

```javascript
import { getDBStatus } from './server/database.mjs';

async function checkHealth() {
  const status = await getDBStatus();
  console.log(status);
  /* 输出示例:
  {
    currentDbType: 'supabase',
    status: {
      postgresql: {
        connected: true,
        poolStatus: { totalCount: 5, idleCount: 4, waitingCount: 0 }
      }
    },
    ...
  }
  */
}
```

## 4. 连接池与性能优化

模块内置了 `pg-pool` 进行连接管理：

1.  **连接复用**：避免频繁建立/断开 TCP 连接，显著降低延迟。
2.  **自动清理**：空闲超过 `POSTGRES_IDLE_TIMEOUT` 的连接会被自动释放。
3.  **SSL 优化**：针对 Supabase 环境，自动处理 SSL 证书验证 (`rejectUnauthorized: false`)，解决 "self-signed certificate" 问题。
4.  **并发控制**：通过 `POSTGRES_MAX_POOL_SIZE` 限制最大并发数，防止数据库过载。

## 5. 故障排查

### 常见错误

**1. `self-signed certificate in certificate chain`**
*   **原因**：Supabase 的数据库连接池通常使用自签名证书。
*   **解决**：模块已自动处理。如果仍出现，请检查 `POSTGRES_URL` 是否包含 `sslmode=require`，模块会尝试自动移除它以应用自定义 SSL 配置。

**2. `connection timeout`**
*   **原因**：网络不通或防火墙限制。
*   **解决**：
    *   检查 `POSTGRES_HOST` (端口 5432/6543) 是否可达。
    *   增加 `POSTGRES_CONNECTION_TIMEOUT` 值。

**3. `duplicate key value violates unique constraint`**
*   **原因**：并发写入或 Schema 初始化时的竞争条件。
*   **解决**：通常发生在应用启动时的表结构创建阶段，模块已捕获并忽略此类非致命错误。

### 运行测试

使用内置的测试脚本验证连接：

```bash
# 运行连接测试
node tests/db-connection.test.js
```

## 6. 数据初始化与迁移

### 初始化数据 (Seeding)
项目包含一个数据填充脚本，用于在开发环境中快速创建测试数据（用户、分类、帖子等）。

```bash
# 填充测试数据
node scripts/seed-db.js
```

**功能说明：**
*   自动检测并创建测试用户（集成 Supabase Auth）。
*   生成基础分类 (Categories) 和标签 (Tags)。
*   创建示例帖子、评论和点赞数据。
*   解决 `public.users` 与 `auth.users` 的外键约束问题。

### Schema 迁移
如果在开发过程中修改了表结构（例如将 `user_id` 从 Integer 改为 UUID），可以使用迁移脚本重置相关表：

```bash
# 重置并更新 Schema (注意：会清空 posts 等业务表数据)
node scripts/migrate-schema.js
```

## 7. 开发建议

*   **本地开发**：推荐使用 `.env.local` 存储敏感信息，不要提交到版本控制。
*   **生产环境**：确保环境变量正确注入，建议根据服务器规格调整连接池大小。
*   **Schema 变更**：虽然模块支持简单的 `CREATE TABLE IF NOT EXISTS`，但对于复杂的 Schema 变更，建议使用专门的 Migration 工具 (如 Supabase CLI 或 Prisma)。

