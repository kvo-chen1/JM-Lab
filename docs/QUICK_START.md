# 商单系统快速部署指南

## 一、执行数据库迁移

### 方法 1：使用 Supabase CLI（推荐）

```bash
# 在项目根目录执行
npx supabase db push
```

### 方法 2：在 Supabase Studio 手动执行

1. 打开 Supabase Studio SQL 编辑器
2. 依次执行以下文件内容：

**第一步：创建商单审核表**
```sql
-- 文件：20260228000000_create_order_audits_tables.sql
-- 复制文件内容到 SQL 编辑器并执行
```

**第二步：创建商单执行表**
```sql
-- 文件：20260228000001_create_order_execution_tables.sql
-- 复制文件内容到 SQL 编辑器并执行
```

## 二、验证表创建

执行以下 SQL 验证：

```sql
-- 检查表是否存在
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'order_audits', 
  'order_executions', 
  'product_links', 
  'order_execution_clicks', 
  'order_execution_daily_stats'
);

-- 应该返回 5 行
```

## 三、前端使用

### 1. 在发布作品时添加商单链接

```tsx
import ProductLinkSelector from '@/components/ProductLinkSelector';

// 在表单中
<ProductLinkSelector
  isDark={isDark}
  onLinksChange={(links) => {
    // 保存 links 数据
  }}
/>
```

### 2. 在作品详情页显示

```tsx
import { WorkProductLinks } from '@/components/WorkProductLinks';

<WorkProductLinks workId={work.id} isDark={isDark} />
```

## 四、访问页面

- **商单中心**：`/order-center`
- **商单广场**：`/order-square`
- **发布商单**：`/publish-order`
- **商单审核**：`/admin?tab=orderAudit`
- **执行监控**：`/admin?tab=brandOrderExecution`

## 五、数据库表说明

### order_audits
商单审核表 - 品牌方发布商单，管理员审核

### order_executions
商单执行表 - 创作者接单后的执行追踪

### product_links
产品链接表 - 作品关联的商单链接

### order_execution_clicks
点击记录表 - 详细的点击和转化记录

### order_execution_daily_stats
每日统计表 - 按天聚合的统计数据

## 六、常见问题

### Q: 迁移失败？
A: 确保按顺序执行（0000 → 0001）

### Q: 提示 username 字段不存在？
A: 已修复，使用简化版迁移脚本

### Q: 如何测试？
A: 参考 docs/ORDER_SYSTEM_SETUP.md 的完整流程测试章节
