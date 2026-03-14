# 帮助中心功能完善文档

## 概述

本文档描述了帮助中心功能的完善内容，包括FAQ反馈系统、工单系统、搜索增强、骨架屏组件和Sentry错误监控。

---

## 1. FAQ反馈系统

### 功能说明
- 用户可以对FAQ进行"有帮助"/"没帮助"的反馈
- 反馈数据持久化到数据库
- 支持未登录用户（使用会话ID）
- 实时统计FAQ浏览量和满意率

### 数据库表

#### faq_feedback 表
```sql
CREATE TABLE faq_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faq_id TEXT NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id TEXT,
    is_helpful BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### faq_views 表
```sql
CREATE TABLE faq_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faq_id TEXT NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 使用方法

```typescript
import { faqService } from '@/services/faqService';

// 提交反馈
await faqService.submitFeedback(faqId, true); // true = 有帮助

// 获取统计
const stats = await faqService.getFAQStats(faqId);
// { faq_id, view_count, helpful_count, not_helpful_count, helpful_rate }

// 批量获取统计
const statsMap = await faqService.getBatchFAQStats([faqId1, faqId2]);
```

---

## 2. 工单系统

### 功能说明
- 集成Supabase后端API
- 支持工单创建、查询、评论
- 工单状态实时更新
- 本地存储降级方案

### 数据库表

#### tickets 表
```sql
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    username TEXT NOT NULL,
    email TEXT,
    type TEXT NOT NULL CHECK (type IN ('bug', 'feature', 'inquiry', 'other')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    screenshot TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    priority TEXT NOT NULL DEFAULT 'medium',
    assigned_to UUID REFERENCES admin_accounts(id),
    resolution TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);
```

#### ticket_comments 表
```sql
CREATE TABLE ticket_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    admin_id UUID REFERENCES admin_accounts(id),
    username TEXT NOT NULL,
    content TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 使用方法

```typescript
import { ticketServiceSupabase } from '@/services/ticketServiceSupabase';

// 创建工单
const ticket = await ticketServiceSupabase.createTicket({
  userId: 'user-id',
  username: '用户名',
  email: 'user@example.com',
  type: 'bug',
  title: '问题标题',
  description: '问题描述',
  priority: 'high'
});

// 获取用户工单
const tickets = await ticketServiceSupabase.getUserTickets(userId);

// 添加评论
await ticketServiceSupabase.addComment(ticketId, '评论内容', '用户名', userId);
```

---

## 3. 搜索增强

### 功能说明
- 自动补全搜索建议
- 搜索历史管理
- 搜索结果高亮显示
- 热门搜索推荐

### 组件使用

```typescript
import { SearchInput } from '@/components/SearchInput';

<SearchInput
  value={searchQuery}
  onChange={setSearchQuery}
  onSearch={handleSearch}
  placeholder="搜索问题或关键词..."
  suggestions={[
    { id: '1', text: '如何注册', type: 'suggestion' },
    { id: '2', text: '忘记密码', type: 'hot', count: 100 }
  ]}
  searchHistory={['历史搜索1', '历史搜索2']}
  onClearHistory={() => {}}
  onSelectSuggestion={(text) => {}}
/>
```

---

## 4. 骨架屏组件

### 功能说明
- 通用骨架屏组件
- FAQ列表骨架屏
- 工单列表骨架屏
- 页面头部骨架屏
- 统计卡片骨架屏

### 组件列表

```typescript
import {
  Skeleton,
  FAQListSkeleton,
  TicketListSkeleton,
  PageHeaderSkeleton,
  StatsCardSkeleton,
  HotFAQListSkeleton,
  ContactCardSkeleton
} from '@/components/Skeleton';

// 通用骨架屏
<Skeleton width={200} height={20} />
<Skeleton width={40} height={40} circle />

// FAQ列表骨架屏
<FAQListSkeleton count={5} />

// 工单列表骨架屏
<TicketListSkeleton count={3} />
```

---

## 5. Sentry错误监控

### 功能说明
- 错误自动收集和上报
- 性能监控
- 用户行为追踪
- 会话重放

### 配置方法

1. 在 `.env` 文件中添加配置：
```
VITE_SENTRY_DSN=https://your-sentry-dsn.ingest.sentry.io/project-id
VITE_APP_VERSION=0.0.8
```

2. 在代码中使用：
```typescript
import { 
  captureException, 
  captureMessage, 
  setUserContext,
  addBreadcrumb 
} from '@/lib/sentry';

// 捕获异常
try {
  // 可能出错的代码
} catch (error) {
  captureException(error, { context: 'additional info' });
}

// 设置用户上下文
setUserContext({
  id: 'user-id',
  email: 'user@example.com',
  username: 'username'
});

// 添加面包屑
addBreadcrumb('用户点击了按钮', 'user-action', 'info');
```

---

## 6. 数据库迁移

### 执行迁移

```bash
# 使用 Supabase CLI 执行迁移
supabase db push

# 或使用 psql 直接执行
psql $DATABASE_URL -f supabase/migrations/20260314000001_add_faq_feedback_system.sql
```

---

## 7. 新页面组件

### HelpEnhanced 页面

增强版帮助中心页面，集成了所有新功能：
- FAQ反馈系统
- 工单系统
- 搜索增强
- 骨架屏加载效果

使用方式：
```typescript
// 在路由中替换原有 Help 页面
import HelpEnhanced from '@/pages/HelpEnhanced';

<Route path="/help" element={<HelpEnhanced />} />
```

---

## 8. 安装依赖

```bash
# 安装 Sentry
npm install @sentry/react

# 其他依赖（如果尚未安装）
npm install framer-motion lucide-react sonner
```

---

## 9. 功能检查清单

- [x] FAQ点赞/点踩数据持久化
- [x] 工单系统后端API集成
- [x] 搜索功能增强（自动补全/高亮）
- [x] 骨架屏加载效果
- [x] Sentry错误监控集成
- [x] 数据库迁移脚本
- [x] 类型定义完善
- [x] 降级方案（本地存储）

---

## 10. 后续优化建议

1. **智能客服集成**
   - 集成AI客服机器人
   - 实现常见问题自动回复

2. **内容管理后台**
   - FAQ内容管理系统
   - 工单管理后台

3. **数据分析**
   - 用户行为分析
   - 帮助中心使用统计

4. **性能优化**
   - FAQ数据缓存
   - 图片懒加载优化

---

*文档版本: 1.0*  
*更新日期: 2026-03-14*
