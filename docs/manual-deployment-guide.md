# AI后台生成功能手动手动部署指南

由于 Supabase CLI 下载较慢，这里提供手动部署步骤，直接在 Supabase Dashboard 中操作。

## 你的 Supabase 项目信息

- **项目 URL**: https://pptqdicaaewtnaiflfcs.supabase.co
- **项目 ID**: pptqdicaaewtnaiflfcs

---

## 步骤 1: 执行数据库迁移

### 1.1 打开 Supabase Dashboard
访问: https://supabase.com/dashboard/project/pptqdicaaewtnaiflfcs/sql

### 1.2 创建 generation_tasks 表

在 SQL Editor 中执行以下 SQL：

```sql
-- 创建AI生成任务表，支持后台生成
-- 用户关闭页面后，生成任务仍会在后台继续执行

create table if not exists generation_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null check (type in ('image', 'video')),
  status text not null check (status in ('pending', 'processing', 'completed', 'failed', 'cancelled')) default 'pending',
  params jsonb not null default '{}',
  progress integer default 0 check (progress >= 0 and progress <= 100),
  result jsonb,
  error text,
  error_type text check (error_type in ('content_policy', 'timeout', 'auth', 'general', 'network')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  started_at timestamp with time zone,
  completed_at timestamp with time zone
);

-- 创建索引
comment on table generation_tasks is 'AI生成任务表，支持后台生成';
create index idx_generation_tasks_user_id on generation_tasks(user_id);
create index idx_generation_tasks_status on generation_tasks(status);
create index idx_generation_tasks_user_status on generation_tasks(user_id, status);
create index idx_generation_tasks_created_at on generation_tasks(created_at desc);

-- 启用RLS
alter table generation_tasks enable row level security;

-- 创建RLS策略
-- 用户只能查看自己的任务
create policy "Users can view own generation tasks"
  on generation_tasks for select
  using (auth.uid() = user_id);

-- 用户只能创建自己的任务
create policy "Users can create own generation tasks"
  on generation_tasks for insert
  with check (auth.uid() = user_id);

-- 用户只能更新自己的任务（主要用于取消任务）
create policy "Users can update own generation tasks"
  on generation_tasks for update
  using (auth.uid() = user_id);

-- 用户只能删除自己的任务
create policy "Users can delete own generation tasks"
  on generation_tasks for delete
  using (auth.uid() = user_id);

-- 创建更新触发器，自动更新 updated_at
create or replace function update_generation_tasks_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trigger_update_generation_tasks_updated_at
  before update on generation_tasks
  for each row
  execute function update_generation_tasks_updated_at();

-- 创建函数：获取用户的活跃任务（未完成且最近创建的）
create or replace function get_user_active_generation_tasks(p_user_id uuid)
returns setof generation_tasks as $$
begin
  return query
  select *
  from generation_tasks
  where user_id = p_user_id
    and status in ('pending', 'processing')
  order by created_at desc;
end;
$$ language plpgsql security definer;

-- 创建函数：获取用户的最近生成历史
create or replace function get_user_generation_history(
  p_user_id uuid,
  p_limit integer default 50,
  p_offset integer default 0
)
returns setof generation_tasks as $$
begin
  return query
  select *
  from generation_tasks
  where user_id = p_user_id
    and status in ('completed', 'failed', 'cancelled')
  order by created_at desc
  limit p_limit
  offset p_offset;
end;
$$ language plpgsql security definer;

-- 创建函数：清理旧的生成任务（保留最近90天的）
create or replace function cleanup_old_generation_tasks()
returns void as $$
begin
  delete from generation_tasks
  where created_at < now() - interval '90 days'
    and status in ('completed', 'failed', 'cancelled');
end;
$$ language plpgsql security definer;
```

点击 "Run" 执行 SQL。

---

## 步骤 2: 部署 Edge Function

### 2.1 打开 Edge Functions 页面
访问: https://supabase.com/dashboard/project/pptqdicaaewtnaiflfcs/functions

### 2.2 创建新 Function

点击 "Create a new function"

- **Function name**: `generate-image`
- **Region**: 选择离你最近的区域（如 Singapore）

### 2.3 粘贴代码

将以下代码粘贴到编辑器中：

```typescript
// Supabase Edge Function: 后台图片生成
// 用户关闭页面后，此函数会继续执行生成任务

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

// CORS 头
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// 千问 API 配置
const QWEN_API_KEY = Deno.env.get('QWEN_API_KEY') || ''
const QWEN_BASE_URL = 'https://dashscope.aliyuncs.com/api/v1'

interface GenerationParams {
  prompt: string
  size?: string
  n?: number
  model?: string
  quality?: string
  style?: string
}

// 处理 CORS 预检请求
function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  return null
}

// 验证请求
async function validateRequest(req: Request): Promise<{ userId: string; taskId: string } | Response> {
  const authHeader = req.headers.get('authorization')
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: 'Missing authorization header' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_ANON_KEY') || '',
      {
        global: { headers: { Authorization: authHeader } }
      }
    )

    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body = await req.json().catch(() => ({}))
    const taskId = body.taskId

    if (!taskId) {
      return new Response(
        JSON.stringify({ error: 'Missing taskId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return { userId: user.id, taskId }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Invalid request' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

// 调用千问 API 生成图片
async function callQwenImageGeneration(params: GenerationParams): Promise<any> {
  const response = await fetch(`${QWEN_BASE_URL}/services/aigc/text2image/image-synthesis`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${QWEN_API_KEY}`,
      'X-DashScope-Async': 'enable'
    },
    body: JSON.stringify({
      model: params.model || 'wanx2.1-t2i-turbo',
      input: {
        prompt: params.prompt
      },
      parameters: {
        size: params.size || '1024x1024',
        n: params.n || 1,
        style: params.style || '<auto>',
        quality: params.quality || 'standard'
      }
    })
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || `API request failed: ${response.status}`)
  }

  return await response.json()
}

// 轮询检查任务状态
async function pollTaskStatus(taskId: string): Promise<any> {
  const maxAttempts = 60
  const interval = 5000

  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(`${QWEN_BASE_URL}/tasks/${taskId}`, {
      headers: {
        'Authorization': `Bearer ${QWEN_API_KEY}`
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to check task status: ${response.status}`)
    }

    const result = await response.json()

    if (result.output?.task_status === 'SUCCEEDED') {
      return result.output.results
    } else if (result.output?.task_status === 'FAILED') {
      throw new Error(result.output?.message || 'Task failed')
    }

    await new Promise(resolve => setTimeout(resolve, interval))
  }

  throw new Error('Task polling timeout')
}

// 主处理函数
Deno.serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const validation = await validateRequest(req)
  if (validation instanceof Response) return validation

  const { userId, taskId } = validation

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  )

  try {
    const { data: task, error: taskError } = await supabase
      .from('generation_tasks')
      .select('*')
      .eq('id', taskId)
      .eq('user_id', userId)
      .single()

    if (taskError || !task) {
      return new Response(
        JSON.stringify({ error: 'Task not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (task.status !== 'pending') {
      return new Response(
        JSON.stringify({ error: 'Task is not in pending status', status: task.status }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    await supabase
      .from('generation_tasks')
      .update({
        status: 'processing',
        progress: 10,
        started_at: new Date().toISOString()
      })
      .eq('id', taskId)

    const submitResult = await callQwenImageGeneration(task.params)
    const qwenTaskId = submitResult.output?.task_id

    if (!qwenTaskId) {
      throw new Error('Failed to get task ID from Qwen API')
    }

    await supabase
      .from('generation_tasks')
      .update({ progress: 30 })
      .eq('id', taskId)

    const results = await pollTaskStatus(qwenTaskId)

    await supabase
      .from('generation_tasks')
      .update({
        status: 'completed',
        progress: 100,
        result: {
          urls: results.map((r: any) => r.url),
          revisedPrompt: results[0]?.revised_prompt || task.params.prompt
        },
        completed_at: new Date().toISOString()
      })
      .eq('id', taskId)

    return new Response(
      JSON.stringify({
        success: true,
        taskId,
        status: 'completed',
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Generation failed:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    let errorType = 'general'

    if (errorMessage.includes('content') || errorMessage.includes('policy')) {
      errorType = 'content_policy'
    } else if (errorMessage.includes('timeout')) {
      errorType = 'timeout'
    } else if (errorMessage.includes('auth') || errorMessage.includes('key')) {
      errorType = 'auth'
    } else if (errorMessage.includes('network')) {
      errorType = 'network'
    }

    await supabase
      .from('generation_tasks')
      .update({
        status: 'failed',
        error: errorMessage,
        error_type: errorType,
        completed_at: new Date().toISOString()
      })
      .eq('id', taskId)

    return new Response(
      JSON.stringify({
        success: false,
        taskId,
        status: 'failed',
        error: errorMessage,
        errorType
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

点击 "Deploy" 部署 Function。

---

## 步骤 3: 设置 Secrets

### 3.1 打开 Secrets 页面
访问: https://supabase.com/dashboard/project/pptqdicaaewtnaiflfcs/settings/functions

### 3.2 添加 Secrets

点击 "Add new secret"

- **Name**: `QWEN_API_KEY`
- **Value**: `sk-ae34935503374436a0f9fa2d713e7073`

点击 "Save" 保存。

---

## 步骤 4: 验证部署

### 4.1 测试 Edge Function

在 Dashboard 中打开 Function 详情页，点击 "Invoke" 标签，测试 Function 是否正常工作。

### 4.2 前端测试

1. 打开你的应用
2. 发起一个图片生成请求
3. 关闭浏览器标签页
4. 重新打开应用
5. 应该能看到之前的生成任务并继续跟踪进度

---

## 故障排查

### 数据库表未创建
- 检查 SQL 执行是否有错误
- 在 Table Editor 中查看是否出现 `generation_tasks` 表

### Edge Function 部署失败
- 检查代码是否有语法错误
- 查看 Function Logs 获取详细错误信息

### API Key 无效
- 确认 Secrets 中 `QWEN_API_KEY` 的值正确
- 检查千问 API Key 是否有效

---

## 完成！

部署完成后，你的应用就支持后台生成功能了。用户可以在发起生成请求后关闭页面，生成任务会在后台继续执行。
