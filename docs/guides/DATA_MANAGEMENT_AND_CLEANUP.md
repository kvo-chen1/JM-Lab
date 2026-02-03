# 数据管理与清理规范 (Data Management & Cleanup Guide)

## 1. 数据识别标准 (Data Identification Standards)

为确保生产环境数据的真实性和完整性，我们需要明确区分真实用户数据与测试/模拟数据。

### 1.1 测试/模拟数据特征
- **用户账号**:
  - 邮箱包含 `test`, `repro`, `mock`, `example` 等关键词。
  - 邮箱域名为 `@example.com`, `@test.com`。
  - 用户元数据 (`user_metadata`) 中包含 `is_mock: true` 标记。
  - 用户名包含 `测试`, `Test User` 等明显测试标识。
- **内容数据**:
  - 关联到上述测试账号的所有帖子、评论、社群、消息等。
  - 内容中包含 `Lorem ipsum`, `测试内容`, `Auto-generated` 等占位符。

### 1.2 真实用户数据特征
- 使用真实有效的邮箱域名（非 example.com）。
- 拥有正常的用户行为轨迹（非脚本批量生成）。
- 通过正常的注册流程创建（Supabase Auth）。

## 2. 数据清理流程 (Data Cleanup Process)

### 2.1 自动化清理工具
我们提供了自动化脚本来清理测试数据，位于 `scripts/utils/cleanup-test-data.cjs`。

**运行方式**:
```bash
node scripts/utils/cleanup-test-data.cjs
```

**脚本逻辑**:
1. 连接 Supabase Admin API。
2. 扫描 `auth.users` 表中的所有用户。
3. 根据上述识别标准筛选测试用户。
4. 调用 `deleteUser` 删除用户。
5. 依赖数据库的 `ON DELETE CASCADE` 外键约束，自动级联删除 `public` schema 中的所有相关数据（个人资料、帖子、社群等）。

### 2.2 数据库级联删除机制
为确保数据一致性，数据库表结构已配置级联删除：
- `public.users` -> 引用 `auth.users` (ON DELETE CASCADE)
- `public.posts` -> 引用 `public.users` (ON DELETE CASCADE)
- `public.communities` -> 引用 `public.users` (ON DELETE CASCADE)
- 其他所有关联表均已配置相应约束。

这意味着只要从 Auth 层删除了用户，所有相关业务数据会被彻底清除，不会残留孤儿数据。

## 3. 数据质量监控与防污染 (Monitoring & Prevention)

### 3.1 环境变量控制
在生产环境中，必须严格禁用模拟数据生成功能。
检查 `.env` 或 `.env.production` 文件：
```properties
USE_MOCK_DATA=false
```

### 3.2 持续监控
- **定期审计**: 每周运行一次清理脚本的扫描模式（可修改脚本仅打印不删除），检查是否有异常增量。
- **注册拦截**: 在 `authContext.tsx` 或 Supabase Edge Functions 中，可以增加逻辑拦截 `@example.com` 等测试域名的注册（开发环境除外）。

### 3.3 开发规范
- **本地开发**: 开发人员应连接本地 Supabase 实例或独立的开发项目，严禁连接生产数据库进行破坏性测试。
- **测试账号**: 如需在生产环境测试，必须使用特定的白名单账号，测试完成后立即清理。
- **数据隔离**: 严禁将本地 SQLite 数据 (`server/db.mjs`) 导入生产环境。

## 4. 紧急回滚与备份
在执行大规模清理前，建议通过 Supabase Dashboard 进行数据库备份。
如果误删数据，请在 Supabase Dashboard 的 "Database" -> "Backups" 中进行 Point-in-Time Recovery (PITR)。
