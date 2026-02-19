-- 创建AI生成任务表，支持后台生成
-- 用户关闭页面后，生成任务仍会在后台继续执行

-- 创建表（如果不存在）
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

-- 添加表注释
comment on table generation_tasks is 'AI生成任务表，支持后台生成';

-- 创建索引（使用 IF NOT EXISTS）
create index if not exists idx_generation_tasks_user_id on generation_tasks(user_id);
create index if not exists idx_generation_tasks_status on generation_tasks(status);
create index if not exists idx_generation_tasks_user_status on generation_tasks(user_id, status);
create index if not exists idx_generation_tasks_created_at on generation_tasks(created_at desc);

-- 启用RLS
alter table generation_tasks enable row level security;

-- 删除已存在的策略（如果存在）
drop policy if exists "Users can view own generation tasks" on generation_tasks;
drop policy if exists "Users can create own generation tasks" on generation_tasks;
drop policy if exists "Users can update own generation tasks" on generation_tasks;
drop policy if exists "Users can delete own generation tasks" on generation_tasks;

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

-- 删除已存在的触发器（如果存在）
drop trigger if exists trigger_update_generation_tasks_updated_at on generation_tasks;

-- 创建触发器
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
