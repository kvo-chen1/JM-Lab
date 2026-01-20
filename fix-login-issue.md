## 问题分析

1. **直接登录的原因**：
   - 社交媒体登录按钮（谷歌、GitHub等）点击后直接调用 `quickLogin` 函数
   - 在 `quickLogin` 函数中，对于 Supabase 支持的提供商，调用 `signInWithOAuth` 后**直接返回 `true`**，而不管登录是否真正成功
   - 前端接收到 `true` 后，显示"登录成功"并跳转到首页
   - 但实际上 OAuth 登录流程还未完成，`isAuthenticated` 状态仍为 `false`，导致无法进入平台

2. **关键问题**：
   - `quickLogin` 函数返回值逻辑错误
   - OAuth 登录是异步流程，函数应该等待登录完成或让 Supabase 的 `onAuthStateChange` 来处理
   - 没有正确处理 OAuth 重定向后的状态同步

## 修复方案

1. **修复 `quickLogin` 函数**：移除直接返回 `true` 的逻辑
2. **确保 OAuth 状态正确同步**：依赖 `onAuthStateChange` 处理登录状态
3. **修复开发环境下的登录状态检查**：确保重定向后能正确恢复 session

让我实施这些修复：

### 1. 修复 `quickLogin` 函数

首先，修复 `quickLogin` 函数的返回逻辑，不要直接返回 `true`：
