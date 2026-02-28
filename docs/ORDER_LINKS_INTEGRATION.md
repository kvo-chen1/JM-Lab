# 商单链接集成指南

本指南说明如何将商单链接功能集成到现有的发布作品流程中。

## 一、在发布作品时添加商单链接

### 1. 在 `PublishToSquareModal.tsx` 中集成

找到 `PublishToSquareModal.tsx` 文件，在表单中添加商单链接选择器：

```tsx
// 在文件顶部导入
import ProductLinkSelector from '@/components/ProductLinkSelector';
import type { ProductLinkData } from '@/components/ProductLinkSelector';

// 在组件中添加状态
const [productLinks, setProductLinks] = useState<ProductLinkData[]>([]);

// 在表单中添加组件（在标签选择器之后）
<div className="mb-5">
  <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">
    商单链接
  </label>
  <ProductLinkSelector
    isDark={isDark}
    onLinksChange={setProductLinks}
  />
</div>

// 在提交时保存链接
const handlePublish = async () => {
  try {
    // 发布作品...
    const publishedWork = await postsApi.publishWork({
      title,
      description,
      tags,
      // ...其他参数
    });
    
    // 保存商单链接
    if (productLinks.length > 0 && publishedWork.id) {
      for (const link of productLinks) {
        await orderExecutionService.addWorkProductLink({
          work_id: publishedWork.id,
          ...link,
        });
      }
      toast.success('商单链接添加成功');
    }
  } catch (error) {
    // 错误处理...
  }
};
```

### 2. 在 `CreateWorkForm.tsx` 中集成

如果使用 `CreateWorkForm` 组件发布作品：

```tsx
// 导入组件
import ProductLinkSelector from '@/components/ProductLinkSelector';

// 在表单中添加
<div className="mb-6">
  <h3 className="text-lg font-semibold mb-3">商单链接（可选）</h3>
  <ProductLinkSelector
    isDark={isDark}
    onLinksChange={(links) => {
      // 保存链接数据
      setProductLinks(links);
    }}
  />
</div>
```

## 二、在作品详情页显示商单链接

### 1. 在作品详情页面中集成

找到作品详情页组件（例如 `WorkDetail.tsx` 或类似组件），在合适位置添加：

```tsx
// 导入组件
import { WorkProductLinks } from '@/components/WorkProductLinks';

// 在作品信息下方显示商单链接
<div className="mt-8">
  {/* 作品信息 */}
  <div>
    <h1>{work.title}</h1>
    <p>{work.description}</p>
    {/* ...其他信息 */}
  </div>
  
  {/* 商单链接 */}
  <div className="mt-8">
    <WorkProductLinks
      workId={work.id}
      isDark={isDark}
      onLinkClick={(link) => {
        // 可选：记录点击事件
        console.log('用户点击了商单链接:', link);
        
        // 或者打开悬浮卡片
        setSelectedLink(link);
      }}
    />
  </div>
</div>
```

### 2. 使用悬浮卡片样式（类似 B 站）

如果想使用悬浮卡片效果：

```tsx
import { FloatingProductCard } from '@/components/WorkProductLinks';
import { AnimatePresence } from 'framer-motion';

// 在组件状态中添加
const [selectedLink, setSelectedLink] = useState(null);

// 在 JSX 中添加
<AnimatePresence>
  {selectedLink && (
    <FloatingProductCard
      link={selectedLink}
      isDark={isDark}
      onClose={() => setSelectedLink(null)}
    />
  )}
</AnimatePresence>
```

## 三、完整示例

### 发布作品完整流程

```tsx
import React, { useState } from 'react';
import ProductLinkSelector from '@/components/ProductLinkSelector';
import { WorkProductLinks } from '@/components/WorkProductLinks';
import * as orderExecutionService from '@/services/orderExecutionService';

const PublishWorkWithProductLinks = () => {
  const [productLinks, setProductLinks] = useState([]);
  
  const handlePublish = async () => {
    // 1. 发布作品
    const work = await postsApi.publishWork({
      title: '我的作品',
      description: '作品描述',
      tags: ['标签 1', '标签 2'],
    });
    
    // 2. 保存商单链接
    if (productLinks.length > 0) {
      for (const link of productLinks) {
        await orderExecutionService.addWorkProductLink({
          work_id: work.id,
          ...link,
        });
      }
    }
    
    toast.success('作品和商单链接发布成功！');
  };
  
  return (
    <div>
      {/* 发布表单 */}
      <input placeholder="作品标题" />
      <textarea placeholder="作品描述" />
      
      {/* 商单链接选择器 */}
      <ProductLinkSelector isDark={false} onLinksChange={setProductLinks} />
      
      {/* 发布按钮 */}
      <button onClick={handlePublish}>发布</button>
    </div>
  );
};
```

### 作品详情页完整示例

```tsx
import React from 'react';
import { WorkProductLinks } from '@/components/WorkProductLinks';

const WorkDetailPage = ({ workId }) => {
  const [work, setWork] = useState(null);
  
  return (
    <div>
      {/* 作品信息 */}
      <article>
        <h1>{work?.title}</h1>
        <img src={work?.imageUrl} alt={work?.title} />
        <p>{work?.description}</p>
      </article>
      
      {/* 商单链接展示 */}
      <section className="mt-8">
        <WorkProductLinks workId={workId} isDark={false} />
      </section>
    </div>
  );
};
```

## 四、API 使用说明

### 添加商单链接

```typescript
import * as orderExecutionService from '@/services/orderExecutionService';

// 添加单个链接
const linkId = await orderExecutionService.addWorkProductLink({
  work_id: 'work-uuid',
  order_id: 'order-uuid', // 可选，如果关联商单
  product_name: '产品名称',
  product_url: 'https://example.com/product',
  product_image: 'https://example.com/image.jpg', // 可选
  price: 99.99, // 可选
  commission_rate: 10, // 佣金比例 10%
});
```

### 获取作品的商单链接

```typescript
// 获取作品的所有商单链接
const links = await orderExecutionService.getWorkProductLinks(workId);

// 显示链接信息
links.forEach(link => {
  console.log(link.product_name);
  console.log(link.price);
  console.log(link.commission_rate);
  console.log(link.click_count); // 点击数
  console.log(link.conversion_count); // 转化数
});
```

## 五、注意事项

1. **权限控制**：
   - 只有作品作者可以添加/删除自己作品的商单链接
   - 任何人都可以查看作品的商单链接

2. **数据验证**：
   - 产品名称和链接是必填项
   - URL 必须是有效的 http/https 链接

3. **性能优化**：
   - 商单链接会自动缓存
   - 使用 React Query 等工具可以进一步优化

4. **移动端适配**：
   - 组件已支持响应式布局
   - 悬浮卡片在移动端会自动调整大小

## 六、数据库表结构

相关数据库表：
- `order_executions` - 商单执行记录
- `product_links` - 产品链接
- `order_execution_clicks` - 点击记录
- `order_execution_daily_stats` - 每日统计

运行数据库迁移：
```bash
# 迁移会自动执行，或手动执行
npx supabase db push
```

## 七、后续优化建议

1. **点击追踪**：
   - 实现真实的点击记录 API
   - 添加防作弊机制

2. **数据可视化**：
   - 在商单中心展示更详细的图表
   - 添加转化率分析

3. **自动化**：
   - 自动计算和发放佣金
   - 自动生成日报/周报

4. **用户体验**：
   - 添加更多悬浮卡片样式
   - 支持自定义链接样式
