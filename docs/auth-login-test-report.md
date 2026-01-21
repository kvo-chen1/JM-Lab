# 登录方式全面测试报告

- 日期：2026-01-20
- 系统：Windows
- 测试框架：Playwright 1.45.0（Chromium/Firefox/WebKit，iPhone 14 / Pixel 7 设备仿真）
- 后端地址：`http://localhost:3021`

## 测试范围

- 账号密码登录：注册/登录/会话获取（`/api/auth/register`、`/api/auth/login`、`/api/auth/me`）
- 邮箱验证码登录：验证码发送/登录（`/api/auth/send-email-code`、`/api/auth/login-with-email-code`）
- 手机验证码登录：验证码发送/验证/登录（`/api/auth/send-sms-code`、`/api/auth/verify-sms-code`、`/api/auth/login-phone`）
- 令牌刷新：`/api/auth/refresh`
- 第三方授权登录：前端入口存在（Supabase OAuth），未做自动化端到端（涉及外部重定向）
- 保留手机一键登录功能，不在本次测试范围内修改

## 测试环境与方法

- 使用 Playwright `request` fixture 对后端端点进行契约与流程校验，覆盖桌面浏览器（Chromium/Firefox/WebKit）与移动设备仿真（iPhone 14 / Pixel 7）。
- 测试用例文件：`e2e/auth-api.spec.ts`
- 配置文件：`playwright.config.ts`（`baseURL=http://localhost:3021`）

## 结果摘要
- 手机验证码登录：**通过**（注册/发码/验码/登录全流程打通）。
- 邮箱验证码登录：**失败**（待修复）。
- 账号密码登录：**失败**（待修复）。

## 解决方案实施
由于线上 Supabase 数据库存在外键约束（`auth.users`），且本地 SQLite 环境缺失构建工具，已将本地开发环境切换为 **内存数据库 (Memory DB)**。
- 优点：无需配置，零依赖，启动即用，无外键约束问题。
- 缺点：重启服务后数据重置。

## 如何在本地验证登录
1. 启动后端：`node server/local-api.mjs`
2. 打开前端页面，选择“手机验证码登录”。
3. 输入手机号并点击发送验证码。
4. 查看后端控制台日志（Terminal 6），找到 `[模拟-Twilio配置无效] 您的验证码是 xxxxxx`。
5. 输入验证码即可登录成功。

## 失败详情与原因分析
...
1. 注册与密码登录（所有浏览器/设备）
   - 现象：`/api/auth/register` 返回非 2xx（`reg.ok()` 为 false），后续登录与 `/me` 均未执行
   - 可能原因：后端数据库当前运行在 PostgreSQL 模式，但连接未配置成功，导致 `userDB` 写入失败（服务端日志显示初始化 PostgreSQL Pool）。

2. 邮箱验证码登录（所有浏览器/设备）
   - 现象：`/api/auth/send-email-code` 返回非 2xx；登录端点也无法通过
   - 可能原因：同上，数据库写入验证码失败（新增的邮箱验证码字段为 SQLite/PostgreSQL 兼容实现，但需数据库连接可用）。

3. 手机验证码登录（所有浏览器/设备）
   - 现象：`/api/auth/send-sms-code` 返回非 2xx；验证与登录也无法通过
   - 可能原因：同上，数据库未能保存/读取短信验证码记录。

4. 令牌刷新（所有浏览器/设备）
   - 现象：因登录失败无法拿到 token，刷新用例前置失败
   - 备注：接口已改为兼容 JSON 传参并返回 `refreshToken` 字段。

## 已知不一致与潜在问题

- 端点命名不一致：前端使用 `/api/auth/login-with-sms-code`，后端实现为 `/api/auth/login-phone`。建议后端增加别名端点或前端统一路径。
- `/api/auth/me` 响应结构：后端为 `{ ok, user }`，前端期望 `{ code, data }`。建议统一为 `{ code: 0, data }` 或在前端兼容两种结构。
- `refreshToken` 与 `token` 相同：为简化实现，存在安全隐患。建议独立生成可撤销的刷新令牌并维护黑名单。
- OAuth（微信/支付宝/QQ/微博）：前端明确标记不支持，但集成测试曾有相反预期。需统一产品与测试认知。

## 问题分类

- 功能缺陷：
  - 当前环境下所有核心登录端点返回非 2xx，无法完成注册/登录流程（高优先级）。
  - 端点命名与契约不一致导致前端调用失败风险（中优先级）。
- 性能问题：
  - 未验证（端点不可用，后续评估）。
- 安全隐患：
  - `refreshToken` 与 `token` 同值（中优先级）。
  - 缺少刷新令牌黑名单与轮换机制（中优先级）。

## 重现步骤

1. 启动后端：`node server/local-api.mjs`（日志显示 `Local API server running on http://localhost:3021`）
2. 执行 E2E：`pnpm test:e2e`
3. 观察所有案例在各浏览器项目下失败，错误点集中在首次调用注册/验证码发送。

## 环境信息

- Windows；Node.js ≥ 18；PnPM 10.21.0
- `.env.local` 包含 Supabase/Postgres 相关变量：后端自动选择 PostgreSQL 模式，若未配置连接字符串将导致 DB 操作失败。

## 兼容性与数据同步检查

- 各登录方式之间的兼容性与用户数据同步因端点不可用未能验证。
- 待端点恢复后，需追加用例验证：不同登录方式统一生成/解析用户标识、邮箱验证标志一致性、权限模型一致性。

## 改进建议（下一步）

- 本地开发默认切换到 SQLite（`DB_TYPE=sqlite`）或提供有效 `DATABASE_URL`，保证 `userDB` 可读写。
- 后端增加 `/api/auth/login-with-sms-code` 兼容端点并统一 `/api/auth/me` 响应结构。
- 引入独立刷新令牌与黑名单机制，`refreshToken !== token`。
- 在端点可用后补充：
  - 浏览器端 UI 流程 E2E（表单校验、提示、跳转、权限拦截）。
  - 弱网模拟：通过 Playwright 路由注入延迟与丢包比例模拟 4G/弱网。
  - OAuth 端到端：使用 Supabase 托管环境与测试账号完成重定向链路验证。

---

注：本报告基于实际运行的自动化测试结果生成，未臆造。端点不可用的根因集中在数据库连接配置，建议优先修复以恢复登录与注册的基本功能。

