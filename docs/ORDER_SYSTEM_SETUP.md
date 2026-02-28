# 商单系统部署指南

## 一、数据库迁移

### 1. 执行迁移

数据库迁移文件已经创建，按顺序执行：

```bash
# 方法 1：使用 Supabase CLI 推送所有迁移
npx supabase db push

# 方法 2：在 Supabase Studio 中手动执行
# 打开 https://app.supabase.com/project/YOUR_PROJECT/sql/editor
# 依次执行以下文件：
# 1. 20260228000000_create_order_audits_tables.sql
# 2. 20260228000001_create_order_execution_tables.sql
```

### 2. 验证表创建

执行以下 SQL 验证表是否正确创建：

```sql
-- 检查表是否存在
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('order_audits', 'order_executions', 'product_links', 'order_execution_clicks', 'order_execution_daily_stats');

-- 应该返回 5 行
```

## 二、前端集成

### 1. 在发布作品时添加商单链接

找到发布作品组件（如 `PublishToSquareModal.tsx` 或 `CreateWorkForm.tsx`），添加：

```tsx
import ProductLinkSelector from '@/components/ProductLinkSelector';

// 在组件状态中
const [productLinks, setProductLinks] = useState([]);

// 在表单中添加组件
<div className="mb-6">
  <label className="block text-sm font-bold mb-2">商单链接（可选）</label>
  <ProductLinkSelector
    isDark={isDark}
    onLinksChange={setProductLinks}
  />
</div>

// 提交时保存链接
const handleSubmit = async () => {
  // 发布作品...
  const work = await publishWork({...});
  
  // 保存商单链接
  if (productLinks.length > 0 && work.id) {
    for (const link of productLinks) {
      await orderExecutionService.addWorkProductLink({
        work_id: work.id,
        ...link,
      });
    }
  }
};
```

### 2. 在作品详情页显示商单链接

在作品详情组件中添加：

```tsx
import { WorkProductLinks } from '@/components/WorkProductLinks';

// 在作品信息下方
<div className="mt-8">
  <WorkProductLinks
    workId={work.id}
    isDark={isDark}
    onLinkClick={(link) => {
      // 可选：记录点击或打开悬浮窗
      console.log('点击了商单:', link);
    }}
  />
</div>
```

## 三、访问页面

### 创作者端

| 页面 | 路径 | 说明 |
|------|------|------|
| 商单中心 | `/order-center` | 查看我的商单执行情况和收益 |
| 商单广场 | `/order-square` | 浏览可接的商单 |
| 发布商单 | `/publish-order` | 品牌方发布商单 |

### 管理端

| 页面 | 路径 | 说明 |
|------|------|------|
| 商单审核 | `/admin?tab=orderAudit` | 审核品牌方发布的商单 |
| 执行监控 | `/admin?tab=brandOrderExecution` | 查看商单执行数据 |

## 四、完整流程测试

### 测试步骤

1. **品牌方发布商单**
   ```
   访问 /publish-order
   → 填写商单信息
   → 提交（状态：pending）
   ```

2. **管理员审核**
   ```
   访问 /admin?tab=orderAudit
   → 选择待审核商单
   → 点击"通过"
   → 商单状态变为 approved
   ```

3. **商单在广场展示**
   ```
   访问 /order-square
   → 可以看到已审核通过的商单
   ```

4. **创作者接单并发布作品**
   ```
   → 在商单广场接单
   → 发布作品时添加商单链接
   → 使用 ProductLinkSelector 组件
   ```

5. **用户查看作品并点击**
   ```
   访问作品详情页
   → 看到商单卡片
   → 点击购买链接
   → 系统记录点击
   ```

6. **查看数据**
   ```
   创作者：/order-center 查看收益
   品牌方：/admin?tab=brandOrderExecution 查看执行数据
   ```

## 五、API 使用示例

### 发布商单

```typescript
import * as orderAuditService from '@/services/orderAuditService';

const orderId = await orderAuditService.submitOrderForAudit({
  order_id: `order_${Date.now()}`,
  user_id: user.id,
  title: '设计海报',
  brand_name: '我的品牌',
  type: 'design',
  description: '需要设计一张海报...',
  requirements: ['原创', '可商用'],
  budget_min: 1000,
  budget_max: 3000,
  deadline: '2026-03-31',
  duration: '7 天',
  location: '远程',
  max_applicants: 10,
  difficulty: 'medium',
  tags: ['设计', '海报'],
  attachments: [],
});
```

### 添加商单链接到作品

```typescript
import * as orderExecutionService from '@/services/orderExecutionService';

const linkId = await orderExecutionService.addWorkProductLink({
  work_id: workId,
  order_id: orderId, // 可选，如果关联商单
  product_name: '防晒衣',
  product_url: 'https://example.com/product/123',
  product_image: 'https://example.com/image.jpg',
  price: 99.99,
  commission_rate: 10, // 10% 佣金
});
```

### 获取作品的商单链接

```typescript
const links = await orderExecutionService.getWorkProductLinks(workId);
console.log(links); // ProductLink[]
```

### 获取创作者的商单执行数据

```typescript
const stats = await orderExecutionService.getOrderExecutionStats(userId);
console.log(stats);
// {
//   totalOrders: 5,
//   activeOrders: 3,
//   totalClicks: 120,
//   totalConversions: 15,
//   totalEarnings: 450.50
// }
```

## 六、数据库表结构

### order_audits - 商单审核表
存储品牌方发布的商单，等待管理员审核

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| order_id | TEXT | 业务订单 ID |
| user_id | UUID | 发布者 ID |
| title | TEXT | 商单标题 |
| brand_name | TEXT | 品牌名称 |
| type | TEXT | 商单类型 |
| status | TEXT | pending/approved/rejected |
| budget_min | DECIMAL | 最低预算 |
| budget_max | DECIMAL | 最高预算 |

### order_executions - 商单执行表
创作者接单后创建，追踪执行情况

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| order_id | UUID | 关联的商单 ID |
| user_id | UUID | 创作者 ID |
| work_id | UUID | 关联的作品 ID |
| product_name | TEXT | 产品名称 |
| product_url | TEXT | 产品链接 |
| commission_rate | DECIMAL | 佣金比例（%） |
| click_count | INTEGER | 点击数 |
| conversion_count | INTEGER | 转化数 |
| total_earnings | DECIMAL | 总收益 |

### product_links - 产品链接表
作品关联的商单链接

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| work_id | UUID | 作品 ID |
| product_name | TEXT | 产品名称 |
| product_url | TEXT | 链接 URL |
| price | DECIMAL | 价格 |
| click_count | INTEGER | 点击数 |

### order_execution_clicks - 点击记录表
详细的点击和转化记录

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| execution_id | UUID | 执行 ID |
| user_id | UUID | 点击用户 ID |
| clicked_at | TIMESTAMPTZ | 点击时间 |
| converted | BOOLEAN | 是否转化 |
| sale_amount | DECIMAL | 成交金额 |

### order_execution_daily_stats - 每日统计表
按天聚合的统计数据

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| execution_id | UUID | 执行 ID |
| date | DATE | 日期 |
| clicks | INTEGER | 点击数 |
| conversions | INTEGER | 转化数 |
| sales | DECIMAL | 销售额 |
| earnings | DECIMAL | 收益 |

## 七、安全策略（RLS）

### order_audits
- ✅ 任何人可查看已通过的商单
- ✅ 发布者管理自己的商单
- ✅ 管理员审核所有商单

### order_executions
- ✅ 创作者查看自己的执行
- ✅ 品牌方查看自己品牌的执行
- ✅ 创作者创建/更新自己的执行

### product_links
- ✅ 任何人查看链接
- ✅ 作品作者添加链接到自己作品

### order_execution_clicks
- ✅ 任何人创建点击记录
- ✅ 执行所有者查看记录

## 八、常见问题

### Q: 迁移失败怎么办？
A: 检查是否按顺序执行迁移文件（0000 在 0001 之前）

### Q: 看不到商单链接组件？
A: 确保已导入 `ProductLinkSelector` 和 `WorkProductLinks` 组件

### Q: 点击不记录？
A: 检查 RLS 策略是否正确，确保用户已登录

### Q: 如何测试完整流程？
A: 按照"完整流程测试"章节逐步操作

## 九、后续优化

1. **点击防作弊**
   - 添加 IP 限制
   - 同一用户每日点击限制

2. **自动结算**
   - 对接支付系统
   - 定期自动发放佣金

3. **数据导出**
   - CSV/Excel 导出
   - 数据可视化报表

4. **性能优化**
   - 添加缓存层
   - 使用物化视图

## 十、技术支持

如有问题，请检查：
1. 数据库迁移是否成功
2. 前端组件是否正确导入
3. 用户权限是否正确配置
4. 浏览器控制台是否有错误
