# 数据分析系统 - 快速参考卡片

## 🚀 快速开始（3 步）

### 步骤 1: 创建数据库表

```sql
-- 复制并执行此 SQL 到 Supabase SQL Editor
-- 文件位置：supabase/migrations/20260228000000_create_analytics_tables.sql
```

### 步骤 2: 添加行为追踪

```typescript
// 在组件中
import { useBehaviorTracker } from '@/hooks/useBehaviorTracker';

const { trackWorkView, trackWorkClick } = useBehaviorTracker();

// 使用时
await trackWorkView(workId);
await trackWorkClick(workId);
```

### 步骤 3: 查看分析数据

访问：
- **高级数据大屏**: `http://localhost:5173/admin?tab=advancedAnalytics`
- **推广分析**: `http://localhost:5173/admin?tab=promotionAnalytics`

---

## 📊 核心 API 速查

### 行为追踪

```typescript
// 浏览作品
trackWorkView(workId, { source: 'recommendation', duration: 5000 })

// 点击作品
trackWorkClick(workId, { source: 'search', position: 3 })

// 点赞
trackLike(workId)

// 收藏
trackCollect(workId)

// 分享
trackShare(workId, { shareTo: 'wechat' })

// 购买
trackPurchase(workId, amount, { order_id: 'xxx' })

// 推广曝光
trackPromotedWorkView(promotedWorkId)

// 推广点击
trackPromotedWorkClick(promotedWorkId)
```

### 转化追踪

```typescript
// 购买转化
trackConversion(promotedWorkId, 'purchase', 199, { order_id: 'xxx' })

// 注册转化
trackConversion(promotedWorkId, 'signup', 0)

// 下载转化
trackConversion(promotedWorkId, 'download')

// 分享转化
trackConversion(promotedWorkId, 'share')

// 关注转化
trackConversion(promotedWorkId, 'follow')
```

### 数据查询

```typescript
// 转化漏斗
const funnel = await analyticsTrackingService.getConversionFunnel()

// 留存率
const retention = await analyticsTrackingService.getRetentionRate(6)

// 用户画像
const demo = await analyticsTrackingService.getUserDemographics()

// 热点话题
const topics = await analyticsTrackingService.getHotTopics(10)

// 时段统计
const hourly = await analyticsTrackingService.getAggregateHourlyStats()
```

---

## 📁 关键文件位置

```
src/
├── services/
│   └── analyticsTrackingService.ts    # 核心追踪服务 ⭐
├── hooks/
│   └── useBehaviorTracker.ts          # React Hook ⭐
└── pages/admin/
    ├── AdvancedAnalytics.tsx          # 高级数据大屏
    └── PromotionAnalytics.tsx         # 推广效果分析

supabase/migrations/
└── 20260228000000_create_analytics_tables.sql  # 数据库迁移 ⭐

docs/
├── behavior-tracking-guide.md         # 集成指南 📖
├── analytics-deployment-guide.md      # 部署指南 📖
└── analytics-implementation-summary.md # 实现总结 📖
```

---

## 🎯 关键集成点

### 1. 作品详情页
```typescript
useEffect(() => {
  trackWorkView(workId);
}, [workId]);
```

### 2. 作品列表
```typescript
const handleClick = async (workId) => {
  await trackWorkClick(workId);
  navigate(`/work/${workId}`);
};
```

### 3. 支付成功页
```typescript
useEffect(() => {
  trackPurchase(workId, amount);
  if (promotedWorkId) {
    trackConversion(promotedWorkId, 'purchase', amount);
  }
}, [orderId, workId, promotedWorkId, amount]);
```

### 4. 推广作品展示
```typescript
useEffect(() => {
  trackPromotedWorkView(promotedWork.id);
}, [promotedWork.id]);
```

---

## 🔍 数据库表结构速查

### user_behavior_logs

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| user_id | UUID | 用户 ID |
| action | TEXT | 行为类型 (9 种) |
| work_id | UUID | 作品 ID |
| promoted_work_id | UUID | 推广作品 ID |
| metadata | JSONB | 元数据 |
| created_at | TIMESTAMP | 创建时间 |

**行为类型**: `view_work`, `click_work`, `like_work`, `collect_work`, `share_work`, `comment_work`, `purchase_work`, `view_promoted`, `click_promoted`

### conversion_events

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| user_id | UUID | 用户 ID |
| promoted_work_id | UUID | 推广作品 ID |
| conversion_type | TEXT | 转化类型 (5 种) |
| conversion_value | DECIMAL | 转化价值 |
| metadata | JSONB | 元数据 |
| created_at | TIMESTAMP | 创建时间 |

**转化类型**: `purchase`, `signup`, `download`, `share`, `follow`

---

## 📈 分析指标说明

### 用户行为漏斗

```
注册用户 (100%)
    ↓
创作用户 (创作率 = 创作用户/总用户)
    ↓
发布用户 (发布率 = 发布用户/总用户)
    ↓
互动用户 (互动率 = 互动用户/总用户)
```

### 留存率

- **次日留存**: 第 2 天还登录的用户比例
- **7 日留存**: 第 7 天还登录的用户比例
- **14 日留存**: 第 14 天还登录的用户比例
- **30 日留存**: 第 30 天还登录的用户比例

### 热点话题算法

```
热度分数 = 作品数×0.4 + 浏览量/100×0.4 + 近期作品数×0.2

趋势判断:
- growth_rate > 10%  → rising 📈
- growth_rate < -10% → falling 📉
- 其他 → stable ➡️
```

---

## 🛠️ 常用 SQL 查询

### 查看最新行为日志

```sql
SELECT * FROM user_behavior_logs 
ORDER BY created_at DESC 
LIMIT 20;
```

### 查看转化事件

```sql
SELECT * FROM conversion_events 
ORDER BY created_at DESC 
LIMIT 20;
```

### 今日行为统计

```sql
SELECT action, COUNT(*) as count
FROM user_behavior_logs 
WHERE DATE(created_at) = CURRENT_DATE 
GROUP BY action
ORDER BY count DESC;
```

### 今日转化统计

```sql
SELECT 
  conversion_type, 
  COUNT(*) as count, 
  SUM(conversion_value) as total_value
FROM conversion_events 
WHERE DATE(created_at) = CURRENT_DATE 
GROUP BY conversion_type;
```

### 热门话题 TOP10

```sql
SELECT 
  tags,
  COUNT(*) as work_count,
  SUM(view_count) as total_views
FROM works
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY tags
ORDER BY work_count DESC
LIMIT 10;
```

---

## ⚠️ 常见问题速查

### Q: 追踪失败怎么办？
**A**: 追踪有错误处理，不会阻塞主流程。检查：
1. 用户是否已登录
2. 数据库表是否已创建
3. 控制台错误日志

### Q: 如何验证追踪生效？
**A**: 
1. 打开浏览器 Console
2. 执行追踪操作
3. 查看 Supabase 表中是否有新记录

### Q: 数据多久更新？
**A**: 
- 行为日志：实时写入
- 分析页面：每 30 秒自动刷新
- 留存率：基于 last_login 实时计算

### Q: 如何禁用追踪？
**A**: 添加环境变量
```bash
VITE_DISABLE_ANALYTICS=true
```

---

## 📚 详细文档

- **集成指南**: `docs/behavior-tracking-guide.md` (15 页)
- **部署指南**: `docs/analytics-deployment-guide.md` (12 页)
- **实现总结**: `docs/analytics-implementation-summary.md` (20 页)

---

## 🎯 下一步行动清单

- [ ] 执行数据库迁移 SQL
- [ ] 验证表创建成功
- [ ] 在作品详情页添加追踪
- [ ] 在支付成功页添加追踪
- [ ] 访问高级数据大屏查看数据
- [ ] 访问推广效果分析页面
- [ ] 阅读完整集成指南

---

**版本**: v1.0.0  
**更新时间**: 2026-02-28  
**状态**: ✅ 就绪可用
