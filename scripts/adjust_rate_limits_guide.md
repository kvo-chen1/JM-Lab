# 调整 Supabase Rate Limits 指南

降低 API 请求频率限制，减少出口流量使用。

## 操作步骤

### 1. 打开 Supabase 控制台
- 访问 https://supabase.com/dashboard
- 选择你的项目

### 2. 进入 Rate Limits 设置
- 点击左侧菜单 "Authentication"（认证）
- 选择 "Rate Limits"（速率限制）

### 3. 调整以下限制（建议值）

| 设置项 | 当前值 | 建议值 | 说明 |
|--------|--------|--------|------|
| **Rate limit for sending emails** | 60 emails/h | 30 emails/h | 降低邮件发送频率 |
| **Rate limit for sending SMS messages** | 30 sms/h | 15 sms/h | 降低短信发送频率 |
| **Rate limit for token refreshes** | 150 requests/5 min | 75 requests/5 min | 降低令牌刷新频率 |
| **Rate limit for token verifications** | 30 requests/5 min | 15 requests/5 min | 降低令牌验证频率 |
| **Rate limit for anonymous users** | 50 requests/h | 25 requests/h | 降低匿名用户请求频率 |
| **Rate limit for sign-ups and sign-ins** | 30 requests/5 min | 15 requests/5 min | 降低注册登录频率 |
| **Rate limit for Web3 sign-ups and sign-ins** | 30 requests/5 min | 15 requests/5 min | 降低 Web3 认证频率 |

### 4. 保存设置
- 点击 "Save changes"（保存更改）

## 预期效果

- 减少 API 请求次数
- 降低 Supabase 出口流量使用
- 减少服务器负载

## 注意事项

1. **不要设置过低** - 避免影响正常用户使用
2. **监控用户反馈** - 如果用户报告登录/注册困难，适当提高限制
3. **根据实际需求调整** - 如果平台用户量大，可以适当提高限制

## 替代方案

如果降低 Rate Limits 后影响用户体验：

1. **实施缓存策略** - 已在前端实现
2. **使用 CDN** - 缓存静态资源
3. **升级 Supabase 计划** - 获得更多出口流量配额
