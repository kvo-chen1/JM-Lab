# 数据分析系统部署检查清单

## 📋 部署前检查

### 环境准备

- [ ] Node.js 已安装 (v16+)
- [ ] npm 或 pnpm 已安装
- [ ] Supabase 账号已注册
- [ ] 项目可以正常运行 (`npm run dev`)
- [ ] 管理员账号已创建

### 数据库迁移

- [ ] 打开 Supabase Dashboard
- [ ] 进入 SQL Editor
- [ ] 复制 `supabase/migrations/20260228000000_create_analytics_tables.sql` 内容
- [ ] 执行 SQL 迁移
- [ ] 验证迁移成功（无错误）
- [ ] 检查表是否创建成功

```sql
-- 执行此 SQL 验证
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_behavior_logs', 'conversion_events');
-- 应该返回 2 行记录
```

### 代码检查

- [ ] `src/services/analyticsTrackingService.ts` 存在
- [ ] `src/hooks/useBehaviorTracker.ts` 存在
- [ ] `src/pages/admin/AdvancedAnalytics.tsx` 存在
- [ ] `src/pages/admin/PromotionAnalytics.tsx` 存在
- [ ] `src/pages/admin/Admin.tsx` 已更新路由
- [ ] 运行 `npm run dev` 无编译错误

---

## 🚀 部署步骤

### 步骤 1: 数据库迁移 (⭐ 必须)

**执行位置**: Supabase Dashboard → SQL Editor

**SQL 文件**: `supabase/migrations/20260228000000_create_analytics_tables.sql`

**验证方法**:
```sql
-- 检查表结构
\d user_behavior_logs
\d conversion_events

-- 检查索引
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename IN ('user_behavior_logs', 'conversion_events');
```

**预期结果**:
- ✅ 2 个表创建成功
- ✅ 9 个索引创建成功
- ✅ RLS 策略启用
- ✅ 权限配置正确

---

### 步骤 2: 启动应用

```bash
# 开发环境
npm run dev

# 生产环境
npm run build
npm run preview
```

**验证**:
- [ ] 应用启动成功
- [ ] 无 TypeScript 错误
- [ ] 无控制台警告

---

### 步骤 3: 测试数据追踪服务

**方法 1: 浏览器控制台测试**

打开浏览器 Console，执行：

```typescript
import { analyticsTrackingService } from './src/services/analyticsTrackingService';

// 测试行为追踪
await analyticsTrackingService.trackBehavior({
  action: 'view_work',
  work_id: 'test-work-123',
  metadata: { test: true },
});

console.log('✅ 追踪测试完成');
```

**方法 2: 使用测试脚本**

```bash
# 在浏览器中打开
# src/services/__tests__/analyticsTrackingService.test.ts
```

**验证**:
- [ ] 无错误抛出
- [ ] Console 显示成功日志
- [ ] Supabase 表中出现测试数据

---

### 步骤 4: 访问分析页面

**访问 URL**:

1. **高级数据分析大屏**
   ```
   http://localhost:5173/admin?tab=advancedAnalytics
   ```

2. **推广效果深度分析**
   ```
   http://localhost:5173/admin?tab=promotionAnalytics
   ```

**验证**:
- [ ] 页面加载成功
- [ ] 无 404 错误
- [ ] 图表正常渲染
- [ ] 数据正常显示（即使为 0）

---

### 步骤 5: 集成行为追踪（可选但推荐）

**关键页面**:

1. **作品详情页** (`src/pages/work/WorkDetail.tsx`)
   ```typescript
   - [ ] 添加浏览追踪
   - [ ] 添加点赞追踪
   - [ ] 添加收藏追踪
   - [ ] 添加分享追踪
   ```

2. **作品列表页** (`src/pages/work/WorkList.tsx`)
   ```typescript
   - [ ] 添加点击追踪
   ```

3. **支付成功页** (`src/pages/payment/PaymentSuccess.tsx`)
   ```typescript
   - [ ] 添加购买追踪
   - [ ] 添加转化追踪（如果是推广订单）
   ```

4. **推广作品展示**
   ```typescript
   - [ ] 添加曝光追踪
   - [ ] 添加点击追踪
   ```

**验证**:
- [ ] 执行交互后，数据库中有新记录
- [ ] Console 无错误
- [ ] 分析页面数据更新

---

## ✅ 功能验证清单

### 基础功能验证

- [ ] 数据库表 `user_behavior_logs` 存在
- [ ] 数据库表 `conversion_events` 存在
- [ ] 追踪服务可以正常调用
- [ ] 数据可以成功写入数据库

### 高级数据分析大屏验证

- [ ] 实时数据卡片显示（6 个指标）
- [ ] 用户行为漏斗图表显示
- [ ] 留存率 Cohort 图表显示
- [ ] 收入来源分析图表显示
- [ ] 渠道 ROI 表格显示
- [ ] 热点话题列表显示
- [ ] 用户画像图表显示
- [ ] 全屏模式可以正常切换
- [ ] 自动刷新正常工作（30 秒）

### 推广效果分析验证

- [ ] 核心指标卡片显示（8 个指标）
- [ ] 推广趋势图表显示
- [ ] 转化漏斗图表显示
- [ ] 时段分析图表显示
- [ ] 智能洞察显示
- [ ] 人群包表格显示
- [ ] 套餐表现图表显示

---

## 🔍 数据验证 SQL

### 验证行为日志

```sql
-- 查看最新 10 条行为日志
SELECT 
  id,
  user_id,
  action,
  work_id,
  promoted_work_id,
  metadata,
  created_at
FROM user_behavior_logs 
ORDER BY created_at DESC 
LIMIT 10;

-- 统计今日各行为数量
SELECT 
  action, 
  COUNT(*) as count,
  COUNT(DISTINCT user_id) as unique_users
FROM user_behavior_logs 
WHERE DATE(created_at) = CURRENT_DATE 
GROUP BY action
ORDER BY count DESC;
```

### 验证转化事件

```sql
-- 查看最新 10 条转化事件
SELECT 
  id,
  user_id,
  promoted_work_id,
  conversion_type,
  conversion_value,
  metadata,
  created_at
FROM conversion_events 
ORDER BY created_at DESC 
LIMIT 10;

-- 统计今日转化数据
SELECT 
  conversion_type, 
  COUNT(*) as count, 
  SUM(conversion_value) as total_value,
  COUNT(DISTINCT user_id) as unique_users
FROM conversion_events 
WHERE DATE(created_at) = CURRENT_DATE 
GROUP BY conversion_type
ORDER BY count DESC;
```

### 验证留存率计算

```sql
-- 查看本月新增用户
SELECT 
  DATE_TRUNC('day', created_at) as date,
  COUNT(*) as new_users
FROM users
WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date;

-- 查看用户最后登录时间分布
SELECT 
  CASE 
    WHEN last_login IS NULL THEN '从未登录'
    WHEN last_login > NOW() - INTERVAL '1 day' THEN '今日'
    WHEN last_login > NOW() - INTERVAL '7 days' THEN '近 7 天'
    WHEN last_login > NOW() - INTERVAL '30 days' THEN '近 30 天'
    ELSE '30 天前'
  END as last_active,
  COUNT(*) as user_count
FROM users
GROUP BY last_active;
```

---

## 🐛 故障排查

### 问题 1: 表创建失败

**错误**: `relation already exists`

**解决**:
```sql
-- 删除旧表重新创建（谨慎操作！）
DROP TABLE IF EXISTS conversion_events CASCADE;
DROP TABLE IF EXISTS user_behavior_logs CASCADE;

-- 重新执行迁移 SQL
```

### 问题 2: 追踪服务调用失败

**错误**: `permission denied for table`

**解决**:
1. 检查用户是否已登录
2. 验证 RLS 策略是否正确
3. 尝试在 Supabase 中禁用 RLS 测试：
   ```sql
   ALTER TABLE user_behavior_logs DISABLE ROW LEVEL SECURITY;
   ALTER TABLE conversion_events DISABLE ROW LEVEL SECURITY;
   ```

### 问题 3: 分析页面显示空白

**可能原因**:
- 路由配置错误
- 组件导入失败
- 数据为空

**解决**:
1. 检查浏览器 Console 错误
2. 验证路由参数正确：`?tab=advancedAnalytics`
3. 检查组件是否正确导入
4. 查看网络请求是否成功

### 问题 4: 数据不更新

**可能原因**:
- 追踪未正确集成
- 数据库写入失败
- 缓存问题

**解决**:
1. 检查追踪代码是否正确
2. 查看 Supabase 日志
3. 清除浏览器缓存
4. 手动刷新页面（Ctrl+F5）

---

## 📊 性能检查

### 数据库性能

```sql
-- 检查索引使用情况
EXPLAIN ANALYZE
SELECT * FROM user_behavior_logs
WHERE user_id = 'xxx'
AND created_at > NOW() - INTERVAL '7 days';

-- 检查表大小
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE tablename IN ('user_behavior_logs', 'conversion_events');
```

**预期**:
- ✅ 查询使用索引扫描
- ✅ 查询时间 < 100ms
- ✅ 表大小合理

### 前端性能

**检查项**:
- [ ] 页面加载时间 < 3 秒
- [ ] 图表渲染流畅
- [ ] 自动刷新不卡顿
- [ ] 内存使用合理

**工具**:
- Chrome DevTools Performance
- Lighthouse
- React DevTools Profiler

---

## 📝 部署完成确认

### 最终检查

- [ ] 数据库迁移执行成功
- [ ] 所有表创建成功
- [ ] 追踪服务测试通过
- [ ] 分析页面可以访问
- [ ] 数据正常显示
- [ ] 无控制台错误
- [ ] 性能指标正常

### 文档确认

- [ ] 已阅读 `docs/behavior-tracking-guide.md`
- [ ] 已阅读 `docs/analytics-deployment-guide.md`
- [ ] 已阅读 `docs/ANALYTICS_QUICK_REFERENCE.md`
- [ ] 了解如何集成行为追踪

### 下一步计划

- [ ] 在作品详情页添加追踪
- [ ] 在支付成功页添加追踪
- [ ] 在推广展示位添加追踪
- [ ] 定期查看分析数据
- [ ] 根据数据优化产品

---

## 🎉 部署成功！

如果以上所有检查项都通过，恭喜！

**数据分析系统已成功部署并可以使用。**

### 访问入口

- **管理员后台**: `http://localhost:5173/admin`
- **高级数据大屏**: `http://localhost:5173/admin?tab=advancedAnalytics`
- **推广效果分析**: `http://localhost:5173/admin?tab=promotionAnalytics`

### 技术支持

如有问题，请查阅：
1. `docs/behavior-tracking-guide.md` - 集成指南
2. `docs/analytics-deployment-guide.md` - 部署指南
3. `docs/analytics-implementation-summary.md` - 实现总结
4. `docs/ANALYTICS_QUICK_REFERENCE.md` - 快速参考

---

**部署日期**: ________________  
**部署人员**: ________________  
**验证人员**: ________________  
**状态**: ☐ 进行中 ☐ 已完成 ☐ 有问题
