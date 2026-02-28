# 数据分析系统部署指南

## 概述

本次更新实现了完整的数据分析系统，包括：
- ✅ 用户行为追踪服务
- ✅ 转化事件追踪
- ✅ 实时数据分析
- ✅ 推广效果深度分析
- ✅ 高级数据可视化大屏

## 部署步骤

### 步骤 1: 运行数据库迁移

**重要**: 首先需要在 Supabase 数据库中创建必要的表结构。

#### 方法一：使用 Supabase Dashboard

1. 登录 Supabase Dashboard
2. 进入项目 → SQL Editor
3. 复制 `supabase/migrations/20260228000000_create_analytics_tables.sql` 文件内容
4. 点击 "Run" 执行

#### 方法二：使用 Supabase CLI

```bash
# 安装 Supabase CLI（如果尚未安装）
npm install -g supabase

# 登录
supabase login

# 链接到项目
supabase link --project-ref YOUR_PROJECT_REF

# 应用迁移
supabase db push
```

#### 方法三：手动执行 SQL

1. 打开文件：`supabase/migrations/20260228000000_create_analytics_tables.sql`
2. 复制全部内容
3. 在 Supabase Dashboard 的 SQL Editor 中粘贴并执行

### 步骤 2: 验证数据库表创建

执行以下 SQL 验证表是否创建成功：

```sql
-- 检查表是否存在
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_behavior_logs', 'conversion_events');

-- 应该返回 2 行记录
```

### 步骤 3: 测试数据追踪服务

创建一个测试脚本来验证追踪服务：

```typescript
// 在浏览器控制台执行
import { analyticsTrackingService } from './src/services/analyticsTrackingService';

// 测试行为追踪
await analyticsTrackingService.trackBehavior({
  action: 'view_work',
  work_id: 'test-work-id',
  metadata: { test: true },
});

// 测试转化追踪
await analyticsTrackingService.trackConversion({
  promoted_work_id: 'test-promoted-id',
  conversion_type: 'purchase',
  conversion_value: 100,
  metadata: { test: true },
});

console.log('追踪测试完成');
```

### 步骤 4: 访问数据分析页面

1. 启动应用：
   ```bash
   npm run dev
   ```

2. 登录管理员账号

3. 访问以下页面：
   - **推广效果深度分析**: 后台管理 → 推广订单实施 → 点击"分析"按钮
   - **高级数据分析大屏**: 后台管理 → 推广订单实施 → 点击"数据大屏"按钮
   - 或直接访问：
     - `/admin?tab=promotionAnalytics`
     - `/admin?tab=advancedAnalytics`

## 集成行为追踪

### 快速集成示例

在关键用户交互点添加行为追踪：

#### 1. 作品详情页

```typescript
// src/pages/work/WorkDetail.tsx
import { useBehaviorTracker } from '@/hooks/useBehaviorTracker';

function WorkDetail({ workId }) {
  const { trackWorkView, trackLike } = useBehaviorTracker();

  useEffect(() => {
    trackWorkView(workId);
  }, [workId]);

  const handleLike = async () => {
    await trackLike(workId);
    // ... 其他点赞逻辑
  };

  return (/* ... */);
}
```

#### 2. 支付成功页

```typescript
// src/pages/payment/PaymentSuccess.tsx
import { useBehaviorTracker } from '@/hooks/useBehaviorTracker';

function PaymentSuccess({ orderId, workId, promotedWorkId, amount }) {
  const { trackPurchase, trackConversion } = useBehaviorTracker();

  useEffect(() => {
    trackPurchase(workId, amount, { order_id: orderId });
    
    if (promotedWorkId) {
      trackConversion(promotedWorkId, 'purchase', amount, {
        order_id: orderId,
      });
    }
  }, [orderId, workId, promotedWorkId, amount]);

  return (/* ... */);
}
```

详细集成指南请参考：`docs/behavior-tracking-guide.md`

## 文件清单

### 新增文件

```
d:\git-repo\
├── supabase\migrations\20260228000000_create_analytics_tables.sql  (数据库迁移)
├── src\services\analyticsTrackingService.ts                        (追踪服务)
├── src\hooks\useBehaviorTracker.ts                                 (追踪 Hook)
├── src\pages\admin\AdvancedAnalytics.tsx                           (高级分析大屏)
├── src\pages\admin\PromotionAnalytics.tsx                          (推广效果分析)
└── docs\
    ├── behavior-tracking-guide.md                                  (集成指南)
    └── analytics-deployment-guide.md                               (本文件)
```

### 修改文件

```
├── src\pages\admin\Admin.tsx                                       (添加路由)
└── src\pages\admin\PromotionOrderImplementation.tsx                (添加导航按钮)
```

## 数据库表结构

### user_behavior_logs (用户行为日志表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| user_id | UUID | 用户 ID |
| action | TEXT | 行为类型 |
| work_id | UUID | 作品 ID（可选） |
| promoted_work_id | UUID | 推广作品 ID（可选） |
| metadata | JSONB | 元数据 |
| created_at | TIMESTAMPTZ | 创建时间 |

**行为类型**:
- `view_work` - 浏览作品
- `click_work` - 点击作品
- `like_work` - 点赞
- `collect_work` - 收藏
- `share_work` - 分享
- `comment_work` - 评论
- `purchase_work` - 购买
- `view_promoted` - 查看推广
- `click_promoted` - 点击推广

### conversion_events (转化事件表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| user_id | UUID | 用户 ID |
| promoted_work_id | UUID | 推广作品 ID |
| conversion_type | TEXT | 转化类型 |
| conversion_value | DECIMAL | 转化价值 |
| metadata | JSONB | 元数据 |
| created_at | TIMESTAMPTZ | 创建时间 |

**转化类型**:
- `purchase` - 购买
- `signup` - 注册
- `download` - 下载
- `share` - 分享
- `follow` - 关注

## 功能特性

### 1. 实时数据大屏 (AdvancedAnalytics.tsx)

- ✅ 实时活跃用户数（5 分钟内）
- ✅ 每分钟浏览量
- ✅ 新增用户/作品/订单
- ✅ 实时收入
- ✅ 用户行为转化漏斗
- ✅ 留存率 Cohort 分析
- ✅ 收入来源分析
- ✅ 渠道 ROI 分析
- ✅ 热点话题预测
- ✅ 用户画像分析
- ✅ 全屏展示模式
- ✅ 自动刷新（30 秒）

### 2. 推广效果深度分析 (PromotionAnalytics.tsx)

- ✅ 核心指标（曝光、点击、转化、ROI）
- ✅ 推广趋势分析
- ✅ 转化漏斗（6 层）
- ✅ 24 小时时段分析
- ✅ 智能洞察与建议
- ✅ 人群包分析
- ✅ 套餐表现对比

### 3. 数据追踪服务 (analyticsTrackingService.ts)

- ✅ 用户行为追踪
- ✅ 转化事件追踪
- ✅ 时段统计分析
- ✅ 留存率计算
- ✅ 用户画像分析
- ✅ 转化漏斗生成
- ✅ 热点话题预测

## 数据验证

### 查询实时数据

```sql
-- 查看最近 10 条行为日志
SELECT * FROM user_behavior_logs 
ORDER BY created_at DESC 
LIMIT 10;

-- 查看最近 10 条转化事件
SELECT * FROM conversion_events 
ORDER BY created_at DESC 
LIMIT 10;

-- 今日行为统计
SELECT action, COUNT(*) as count
FROM user_behavior_logs 
WHERE DATE(created_at) = CURRENT_DATE 
GROUP BY action
ORDER BY count DESC;

-- 今日转化统计
SELECT conversion_type, COUNT(*) as count, SUM(conversion_value) as total_value
FROM conversion_events 
WHERE DATE(created_at) = CURRENT_DATE 
GROUP BY conversion_type;
```

### 查看分析页面

访问管理员后台，查看以下页面确认数据展示正常：

1. **推广效果深度分析**
   - URL: `/admin?tab=promotionAnalytics`
   - 检查核心指标、趋势图、转化漏斗等

2. **高级数据分析大屏**
   - URL: `/admin?tab=advancedAnalytics`
   - 检查实时数据、留存率、用户画像等

## 性能优化建议

### 1. 数据库索引

迁移脚本已自动创建以下索引：

```sql
-- user_behavior_logs 表索引
CREATE INDEX idx_user_behavior_logs_user_id ON user_behavior_logs(user_id);
CREATE INDEX idx_user_behavior_logs_action ON user_behavior_logs(action);
CREATE INDEX idx_user_behavior_logs_created_at ON user_behavior_logs(created_at);
CREATE INDEX idx_user_behavior_logs_user_created ON user_behavior_logs(user_id, created_at);

-- conversion_events 表索引
CREATE INDEX idx_conversion_events_user_id ON conversion_events(user_id);
CREATE INDEX idx_conversion_events_promoted_work_id ON conversion_events(promoted_work_id);
CREATE INDEX idx_conversion_events_created_at ON conversion_events(created_at);
```

### 2. 数据清理策略

建议定期清理旧数据（可选）：

```sql
-- 清理 90 天前的行为日志（谨慎执行）
DELETE FROM user_behavior_logs 
WHERE created_at < NOW() - INTERVAL '90 days';

-- 清理 1 年前的转化事件（谨慎执行）
DELETE FROM conversion_events 
WHERE created_at < NOW() - INTERVAL '1 year';
```

### 3. 前端性能

- ✅ 使用防抖减少频繁调用
- ✅ 批量追踪多个事件
- ✅ 错误不阻塞主流程
- ✅ 自动刷新间隔 30 秒

## 常见问题

### Q1: 迁移失败怎么办？

**A**: 检查以下几点：
1. 确认有权限执行 CREATE TABLE 操作
2. 检查是否有同名的表已存在
3. 查看错误日志，根据具体错误修复

### Q2: 追踪数据不显示？

**A**: 
1. 检查浏览器控制台是否有错误
2. 确认用户已登录（追踪需要用户 ID）
3. 查询数据库表确认数据是否写入
4. 刷新分析页面（数据每 30 秒自动刷新）

### Q3: 如何禁用追踪？

**A**: 在测试环境可以临时禁用追踪：

```typescript
// 在环境配置文件中添加
VITE_DISABLE_ANALYTICS=true

// 在服务中检查
if (import.meta.env.VITE_DISABLE_ANALYTICS) {
  return; // 跳过追踪
}
```

### Q4: 数据准确性如何保证？

**A**: 
1. 使用数据库事务确保数据一致性
2. 追踪失败不影响主流程
3. 定期核对数据库统计数据
4. 设置数据异常告警

## 下一步计划

1. **完善追踪覆盖**
   - [ ] 在所有作品展示页面添加曝光追踪
   - [ ] 在所有交互按钮添加点击追踪
   - [ ] 在所有支付成功页添加转化追踪

2. **数据分析增强**
   - [ ] 添加 A/B 测试分析
   - [ ] 添加用户路径分析
   - [ ] 添加流失预警

3. **性能优化**
   - [ ] 实现数据聚合定时任务
   - [ ] 添加数据缓存层
   - [ ] 优化大数据量查询

## 技术支持

如有问题，请查看：
- 详细集成指南：`docs/behavior-tracking-guide.md`
- 服务源码：`src/services/analyticsTrackingService.ts`
- Hook 源码：`src/hooks/useBehaviorTracker.ts`

---

**部署完成时间**: 2026-02-28
**版本**: v1.0.0
**状态**: ✅ 就绪
