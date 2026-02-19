# AI后台生成功能部署说明

## 功能概述

AI后台生成功能允许用户在发起图片/视频生成请求后关闭页面，生成任务会在服务器后台继续执行。当用户再次打开页面时，可以查看生成进度或获取生成结果。

## 架构变更

### 1. 数据持久化
- **之前**: 生成任务存储在浏览器内存中，页面关闭即丢失
- **之后**: 生成任务持久化到 Supabase 数据库，支持跨会话恢复

### 2. 后台执行
- **之前**: 前端直接调用 AI API，需要保持页面打开
- **之后**: 前端创建任务 → Edge Function 后台执行 → 数据库状态更新 → 前端轮询获取结果

## 部署步骤

### 步骤 1: 执行数据库迁移

```bash
# 使用 Supabase CLI 执行迁移
supabase db push

# 或者直接在 Supabase Dashboard 的 SQL Editor 中执行
# 文件: supabase/migrations/20260219000004_create_generation_tasks.sql
```

### 步骤 2: 部署 Edge Function

```bash
# 确保已安装 Supabase CLI
npm install -g supabase

# 登录 Supabase
supabase login

# 链接项目
supabase link --project-ref <your-project-ref>

# 部署 Edge Function
supabase functions deploy generate-image

# 设置环境变量
supabase secrets set QWEN_API_KEY=<your-qwen-api-key>
```

### 步骤 3: 配置环境变量

确保前端项目有以下环境变量：

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 步骤 4: 验证部署

1. 打开应用并登录
2. 发起一个图片生成请求
3. 关闭浏览器标签页
4. 重新打开应用
5. 应该能看到之前的生成任务并继续跟踪进度

## 数据库表结构

### generation_tasks 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| user_id | uuid | 用户ID，外键关联 auth.users |
| type | text | 生成类型: 'image' \| 'video' |
| status | text | 状态: 'pending' \| 'processing' \| 'completed' \| 'failed' \| 'cancelled' |
| params | jsonb | 生成参数 |
| progress | integer | 进度 0-100 |
| result | jsonb | 生成结果，包含图片/视频URL |
| error | text | 错误信息 |
| error_type | text | 错误类型 |
| created_at | timestamptz | 创建时间 |
| updated_at | timestamptz | 更新时间 |
| started_at | timestamptz | 开始处理时间 |
| completed_at | timestamptz | 完成时间 |

## API 说明

### 前端服务 API

```typescript
// 生成图片（自动后台执行）
const task = await aiGenerationService.generateImage({
  prompt: '一只可爱的猫咪',
  size: '1024x1024',
  style: 'auto'
});

// 监听任务状态
const unsubscribe = aiGenerationService.addTaskListener((task) => {
  console.log('任务状态:', task.status, '进度:', task.progress);
});

// 获取所有进行中的任务
const activeTasks = aiGenerationService.getAllTasks();

// 取消任务
await aiGenerationService.cancelTask(taskId);

// 删除任务
await aiGenerationService.deleteTask(taskId);
```

### Edge Function API

```http
POST /functions/v1/generate-image
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "taskId": "uuid-of-the-task"
}
```

## 工作流程

```
用户发起生成请求
    ↓
前端创建数据库记录 (status=pending)
    ↓
前端调用 Edge Function
    ↓
Edge Function 更新状态 (status=processing)
    ↓
Edge Function 调用千问 API
    ↓
Edge Function 轮询生成结果
    ↓
Edge Function 更新数据库 (status=completed/failed)
    ↓
前端轮询检测到状态变化
    ↓
通知用户生成完成
```

## 用户关闭页面后的恢复流程

```
用户重新打开页面
    ↓
aiGenerationService 初始化
    ↓
查询数据库中的活跃任务
    ↓
恢复任务到内存
    ↓
启动轮询
    ↓
用户看到进行中的任务
```

## 注意事项

1. **Edge Function 超时**: Supabase Edge Function 默认超时时间为 60 秒，但千问图片生成可能需要 30-60 秒。如果需要更长的执行时间，可以考虑：
   - 使用 Supabase Background Tasks (即将推出)
   - 使用外部队列服务（如 Inngest、Bull Queue）

2. **错误处理**: Edge Function 会自动处理各种错误情况，包括：
   - API 认证失败
   - 内容审核不通过
   - 生成超时
   - 网络错误

3. **安全性**: 
   - 用户只能访问自己的生成任务（通过 RLS 策略）
   - Edge Function 使用 Service Role Key 访问数据库
   - 千问 API Key 存储在 Supabase Secrets 中

4. **清理策略**: 
   - 已完成的任务保留 90 天
   - 可以定期运行 `cleanup_old_generation_tasks()` 函数清理

## 故障排查

### 任务状态不更新
- 检查 Edge Function 日志: `supabase functions logs generate-image`
- 确认 QWEN_API_KEY 已正确设置
- 检查数据库连接

### 页面恢复后任务丢失
- 确认用户已登录
- 检查 `restoreActiveTasks()` 是否执行
- 查看浏览器控制台是否有错误

### Edge Function 调用失败
- 检查网络连接
- 确认 access_token 有效
- 查看 Supabase Functions 日志

## 后续优化建议

1. **WebSocket 实时更新**: 使用 Supabase Realtime 替代轮询
2. **批量生成**: 支持一次提交多个生成任务
3. **生成队列**: 限制并发生成数量，避免 API 限流
4. **进度细化**: 更详细的进度反馈（如"正在排队"、"正在生成"等）
