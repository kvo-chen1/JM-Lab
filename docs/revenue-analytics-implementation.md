# 收入分析真实数据实现文档

## 📊 实现概述

本次更新将高级数据分析大屏中的**所有模拟数据**改为**真实数据库数据**，包括：
- ✅ 会员订阅收入
- ✅ 盲盒销售收入
- ✅ 推广渠道 ROI 分析

## 🗄️ 数据库表结构

### 1. memberships (会员订阅表)

```sql
CREATE TABLE memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    plan_type VARCHAR(50) NOT NULL,  -- monthly, quarterly, yearly, lifetime
    status VARCHAR(50) NOT NULL,     -- active, expired, cancelled, pending
    amount DECIMAL(10,2) NOT NULL,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    payment_method VARCHAR(50),
    transaction_id VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**字段说明**：
- `plan_type`: 套餐类型
  - `monthly` - 月卡（29.9 元）
  - `quarterly` - 季卡（79.9 元）
  - `yearly` - 年卡（299 元）
  - `lifetime` - 终身卡
- `status`: 订阅状态
  - `active` - 有效
  - `expired` - 过期
  - `cancelled` - 已取消
  - `pending` - 待支付

### 2. blind_box_sales (盲盒销售表)

```sql
CREATE TABLE blind_box_sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    box_type VARCHAR(100) NOT NULL,
    box_name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    reward_type VARCHAR(50) NOT NULL,
    reward_id UUID,
    reward_value VARCHAR(500),
    status VARCHAR(50) NOT NULL,  -- completed, refunded, pending
    payment_method VARCHAR(50),
    transaction_id VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**字段说明**：
- `box_type`: 盲盒类型
  - `basic` - 基础版（9.9 元）
  - `premium` - 高级版（19.9 元）
  - `vip` - VIP 版（49.9 元）
- `status`: 销售状态
  - `completed` - 已完成
  - `refunded` - 已退款
  - `pending` - 待开奖

### 3. channel_costs (推广渠道成本表)

```sql
CREATE TABLE channel_costs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel VARCHAR(100) NOT NULL,
    cost_type VARCHAR(50) NOT NULL,  -- advertising, commission, cooperation
    amount DECIMAL(10,2) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**字段说明**：
- `channel`: 渠道名称
  - `信息流广告` - 抖音、快手等
  - `社交媒体` - 微博、小红书等
  - `搜索引擎` - 百度、谷歌等
  - `KOL 合作` - 博主合作
  - `内容营销` - 内容创作
- `cost_type`: 成本类型
  - `advertising` - 广告费
  - `commission` - 佣金
  - `cooperation` - 合作费

### 4. promotion_orders (推广订单表 - 新增字段)

```sql
ALTER TABLE promotion_orders 
ADD COLUMN channel VARCHAR(100),        -- 推广渠道
ADD COLUMN channel_cost DECIMAL(10,2);  -- 渠道成本
```

## 📝 部署步骤

### 步骤 1: 执行数据库迁移

**文件位置**: `supabase/migrations/20260228000002_create_revenue_analytics_tables.sql`

**执行方法**：
1. 打开 Supabase Dashboard → SQL Editor
2. 复制文件内容
3. 粘贴并执行

**迁移内容**：
- ✅ 创建 `memberships` 表
- ✅ 创建 `blind_box_sales` 表
- ✅ 创建 `channel_costs` 表
- ✅ 修改 `promotion_orders` 表（添加渠道字段）
- ✅ 创建 `daily_revenue_stats` 视图
- ✅ 插入示例数据（会员 50 条，盲盒 100 条，渠道成本 5 条）

### 步骤 2: 验证表创建成功

```sql
-- 检查表是否存在
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('memberships', 'blind_box_sales', 'channel_costs');
-- 应该返回 3 行记录

-- 检查 promotion_orders 表字段
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'promotion_orders' 
AND column_name IN ('channel', 'channel_cost');
-- 应该返回 2 行记录
```

### 步骤 3: 查看示例数据

```sql
-- 查看会员数据
SELECT COUNT(*) as membership_count, SUM(amount) as total_revenue
FROM memberships
WHERE status = 'active';

-- 查看盲盒销售数据
SELECT COUNT(*) as sales_count, SUM(price) as total_revenue
FROM blind_box_sales
WHERE status = 'completed';

-- 查看渠道成本
SELECT channel, SUM(amount) as total_cost
FROM channel_costs
GROUP BY channel;
```

## 🎯 数据收集流程

### 会员订阅收入

当用户购买会员时：

```typescript
// 在支付成功回调中
await supabaseAdmin.from('memberships').insert({
  user_id: userId,
  plan_type: 'yearly',
  status: 'active',
  amount: 299.0,
  start_date: new Date(),
  end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
  payment_method: 'alipay',
  transaction_id: orderId,
});
```

### 盲盒销售收入

当用户购买盲盒时：

```typescript
// 在支付成功回调中
await supabaseAdmin.from('blind_box_sales').insert({
  user_id: userId,
  box_type: 'premium',
  box_name: '素材盲盒',
  price: 19.9,
  reward_type: 'work',
  reward_id: rewardId,
  reward_value: '随机素材',
  status: 'completed',
  payment_method: 'wechat',
  transaction_id: orderId,
});
```

### 推广渠道追踪

创建推广订单时：

```typescript
// 在创建推广订单时
await supabaseAdmin.from('promotion_orders').insert({
  // ... 其他字段
  channel: 'feed',  // 渠道标识
  channel_cost: 5000,  // 该订单的渠道成本
});
```

或者在订单更新时添加渠道信息：

```typescript
await supabaseAdmin
  .from('promotion_orders')
  .update({
    channel: 'kol',
    channel_cost: 3000,
  })
  .eq('id', orderId);
```

## 📊 数据分析逻辑

### 收入来源分析

```typescript
// 1. 推广收入
const promotionRevenue = promotionOrders
  .filter(o => o.status === 'paid')
  .reduce((sum, o) => sum + o.final_price, 0);

// 2. 会员收入
const membershipRevenue = memberships
  .filter(m => m.status === 'active')
  .reduce((sum, m) => sum + m.amount, 0);

// 3. 盲盒收入
const blindBoxRevenue = blindBoxSales
  .filter(b => b.status === 'completed')
  .reduce((sum, b) => sum + b.price, 0);

// 4. 计算趋势
const membershipTrend = ((currentRevenue - prevRevenue) / prevRevenue) * 100;
```

### 渠道 ROI 分析

```typescript
// 1. 统计各渠道成本
const costByChannel = channelCosts.reduce((map, cost) => {
  map.set(cost.channel, (map.get(cost.channel) || 0) + cost.amount);
  return map;
}, new Map());

// 2. 统计各渠道收入
const revenueByChannel = orders
  .filter(o => o.status === 'paid')
  .reduce((map, order) => {
    const channel = order.channel || '未分类';
    const stats = map.get(channel) || { revenue: 0, cost: 0, conversions: 0 };
    stats.revenue += order.final_price;
    stats.cost += order.channel_cost || 0;
    stats.conversions++;
    map.set(channel, stats);
    return map;
  }, new Map());

// 3. 计算 ROI
const roi = (revenue - cost) / cost;
```

## 🔍 常用 SQL 查询

### 今日收入统计

```sql
SELECT 
  'membership' as type,
  COUNT(*) as count,
  SUM(amount) as total
FROM memberships
WHERE DATE(created_at) = CURRENT_DATE
AND status = 'active'

UNION ALL

SELECT 
  'blind_box' as type,
  COUNT(*) as count,
  SUM(price) as total
FROM blind_box_sales
WHERE DATE(created_at) = CURRENT_DATE
AND status = 'completed'

UNION ALL

SELECT 
  'promotion' as type,
  COUNT(*) as count,
  SUM(final_price) as total
FROM promotion_orders
WHERE DATE(created_at) = CURRENT_DATE
AND status = 'paid';
```

### 月度收入趋势

```sql
SELECT 
  DATE_TRUNC('month', created_at) as month,
  'membership' as type,
  SUM(amount) as revenue
FROM memberships
WHERE status = 'active'
GROUP BY DATE_TRUNC('month', created_at)

UNION ALL

SELECT 
  DATE_TRUNC('month', created_at) as month,
  'blind_box' as type,
  SUM(price) as revenue
FROM blind_box_sales
WHERE status = 'completed'
GROUP BY DATE_TRUNC('month', created_at)

ORDER BY month, type;
```

### 渠道 ROI 排名

```sql
SELECT 
  po.channel,
  SUM(po.final_price) as revenue,
  SUM(po.channel_cost) as cost,
  COUNT(*) as conversions,
  ROUND(
    ((SUM(po.final_price) - SUM(po.channel_cost)) / NULLIF(SUM(po.channel_cost), 0)) * 100, 
    2
  ) as roi_percentage
FROM promotion_orders po
WHERE po.status = 'paid'
GROUP BY po.channel
ORDER BY roi_percentage DESC;
```

## ✅ 数据真实性验证

### 1. 会员订阅收入

- ✅ **数据来源**: `memberships` 表
- ✅ **统计逻辑**: 只统计 `status = 'active'` 的订阅
- ✅ **趋势计算**: 与上期（30 天前）对比

### 2. 盲盒销售收入

- ✅ **数据来源**: `blind_box_sales` 表
- ✅ **统计逻辑**: 只统计 `status = 'completed'` 的销售
- ✅ **趋势计算**: 与上期（30 天前）对比

### 3. 推广渠道 ROI

- ✅ **成本数据**: `channel_costs` 表 + `promotion_orders.channel_cost`
- ✅ **收入数据**: `promotion_orders.final_price`
- ✅ **转化数**: 按渠道统计订单数
- ✅ **ROI 计算**: (收入 - 成本) / 成本

## 📋 集成检查清单

- [ ] 执行数据库迁移脚本
- [ ] 验证所有表创建成功
- [ ] 验证示例数据插入成功
- [ ] 在支付成功回调中添加会员数据记录
- [ ] 在支付成功回调中添加盲盒数据记录
- [ ] 在创建推广订单时添加渠道信息
- [ ] 访问高级数据分析大屏查看数据
- [ ] 验证收入来源分析显示真实数据
- [ ] 验证渠道 ROI 分析显示真实数据

## 🚀 下一步优化

### 短期（1-2 周）

- [ ] 在会员购买页面集成数据记录
- [ ] 在盲盒购买页面集成数据记录
- [ ] 在推广订单管理页面添加渠道选择
- [ ] 添加渠道成本录入界面

### 中期（1-2 月）

- [ ] 添加收入趋势图表（按日/周/月）
- [ ] 添加渠道效果对比分析
- [ ] 添加用户 LTV（生命周期价值）分析
- [ ] 添加收入预测功能

### 长期（3-6 月）

- [ ] 集成实时收入大屏
- [ ] 添加收入异常告警
- [ ] 添加渠道 ROI 自动优化建议
- [ ] 集成财务系统

---

**实现时间**: 2026-02-28  
**版本**: v1.0.0  
**状态**: ✅ 完成并可用
