# 品牌方商单管理页面 - 组件使用示例

## 快速开始

### 1. 引入设计令牌

在项目的入口文件（如 `index.tsx` 或 `App.tsx`）中引入设计令牌：

```tsx
import '@/styles/design-tokens.css';
```

### 2. 使用组件

```tsx
import { StatsCard } from '@/components/stats';
import { StatusBadge, EmptyState } from '@/components/ui';
import { Package, Clock, CheckCircle, XCircle, Flag } from 'lucide-react';
```

---

## StatsCard 统计卡片

### 基础用法

```tsx
<StatsCard
  title="全部商单"
  value={128}
  icon={Package}
  variant="primary"
/>
```

### 带趋势数据

```tsx
<StatsCard
  title="已通过"
  value={86}
  icon={CheckCircle}
  variant="success"
  trend={8}
  trendLabel="较上月"
/>
```

### 可点击筛选

```tsx
const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

<StatsCard
  title="审核中"
  value={12}
  icon={Clock}
  variant="warning"
  isSelected={selectedStatus === 'pending'}
  onClick={() => setSelectedStatus('pending')}
/>
```

### 加载状态

```tsx
<StatsCard
  title="全部商单"
  value={0}
  icon={Package}
  variant="primary"
  isLoading={true}
/>
```

### 完整示例：统计卡片组

```tsx
import { useState } from 'react';
import { StatsCard } from '@/components/stats';
import { Package, Clock, CheckCircle, XCircle, Flag } from 'lucide-react';

const statsData = [
  { title: '全部商单', value: 128, icon: Package, variant: 'primary' as const, trend: 12 },
  { title: '审核中', value: 12, icon: Clock, variant: 'warning' as const, trend: 3 },
  { title: '已通过', value: 86, icon: CheckCircle, variant: 'success' as const, trend: 8 },
  { title: '已驳回', value: 8, icon: XCircle, variant: 'error' as const, trend: -2 },
  { title: '已结束', value: 22, icon: Flag, variant: 'neutral' as const, trend: 0 },
];

export function StatsCardGroup() {
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '16px'
    }}>
      {statsData.map((stat, index) => (
        <StatsCard
          key={stat.title}
          title={stat.title}
          value={stat.value}
          icon={stat.icon}
          variant={stat.variant}
          trend={stat.trend}
          trendLabel="较上月"
          isSelected={selectedStatus === stat.title}
          onClick={() => setSelectedStatus(
            selectedStatus === stat.title ? null : stat.title
          )}
        />
      ))}
    </div>
  );
}
```

---

## StatusBadge 状态标签

### 基础用法

```tsx
<StatusBadge variant="pending" />    {/* 显示：审核中 */}
<StatusBadge variant="approved" />   {/* 显示：已通过 */}
<StatusBadge variant="rejected" />   {/* 显示：已驳回 */}
<StatusBadge variant="active" />     {/* 显示：进行中 */}
<StatusBadge variant="closed" />     {/* 显示：已结束 */}
```

### 自定义文本

```tsx
<StatusBadge variant="pending">待审核</StatusBadge>
<StatusBadge variant="approved">审核通过</StatusBadge>
```

### 尺寸变体

```tsx
<StatusBadge variant="pending" size="sm" />
<StatusBadge variant="pending" size="md" />  {/* 默认 */}
<StatusBadge variant="pending" size="lg" />
```

### 带动画

```tsx
<StatusBadge variant="approved" animated />
```

### 表格中使用

```tsx
import { StatusBadge, StatusVariant } from '@/components/ui';

// 状态映射
const statusMap: Record<string, StatusVariant> = {
  'pending': 'pending',
  'approved': 'approved',
  'rejected': 'rejected',
  'active': 'active',
  'closed': 'closed',
};

function OrderTable({ orders }) {
  return (
    <table>
      <tbody>
        {orders.map(order => (
          <tr key={order.id}>
            <td>{order.name}</td>
            <td>
              <StatusBadge 
                variant={statusMap[order.status]} 
                size="sm"
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

---

## EmptyState 空状态

### 基础用法

```tsx
<EmptyState
  title="暂无商单"
  description="您还没有发布任何商单，点击下方按钮开始"
/>
```

### 带操作按钮

```tsx
<EmptyState
  title="暂无商单"
  description="您还没有发布任何商单，点击下方按钮开始"
  primaryAction={{
    label: '发布商单',
    onClick: () => navigate('/publish-order'),
    icon: Plus,
  }}
/>
```

### 双操作按钮

```tsx
<EmptyState
  title="搜索无结果"
  description="未找到符合条件的商单，请尝试其他关键词"
  primaryAction={{
    label: '清除筛选',
    onClick: handleClearFilters,
  }}
  secondaryAction={{
    label: '查看全部',
    onClick: () => navigate('/orders'),
  }}
/>
```

### 自定义图标

```tsx
import { SearchX } from 'lucide-react';

<EmptyState
  title="未找到结果"
  description="请尝试调整搜索关键词或筛选条件"
  icon={SearchX}
  size="md"
/>
```

### 尺寸变体

```tsx
// 小尺寸 - 适合卡片内
<EmptyState
  title="暂无数据"
  size="sm"
/>

// 中尺寸 - 默认，适合页面主体
<EmptyState
  title="暂无商单"
  description="开始创建您的第一个商单"
  size="md"
/>

// 大尺寸 - 适合全屏展示
<EmptyState
  title="欢迎使用"
  description="这是您管理品牌商单的中心"
  primaryAction={{ label: '开始使用', onClick: handleStart }}
  size="lg"
/>
```

### 自定义插图

```tsx
<EmptyState
  title="功能即将上线"
  description="我们正在努力开发中，敬请期待"
  illustration={
    <img 
      src="/images/coming-soon.svg" 
      alt="Coming soon"
      style={{ width: 200, height: 200 }}
    />
  }
/>
```

---

## 完整页面示例

```tsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { StatsCard } from '@/components/stats';
import { StatusBadge, EmptyState } from '@/components/ui';
import { 
  Package, Clock, CheckCircle, XCircle, Flag, 
  Plus, Search, Filter 
} from 'lucide-react';
import './BrandOrderManagement.css';

// 统计数据
const statsData = [
  { id: 'all', title: '全部商单', value: 128, icon: Package, variant: 'primary' as const, trend: 12 },
  { id: 'pending', title: '审核中', value: 12, icon: Clock, variant: 'warning' as const, trend: 3 },
  { id: 'approved', title: '已通过', value: 86, icon: CheckCircle, variant: 'success' as const, trend: 8 },
  { id: 'rejected', title: '已驳回', value: 8, icon: XCircle, variant: 'error' as const, trend: -2 },
  { id: 'closed', title: '已结束', value: 22, icon: Flag, variant: 'neutral' as const, trend: 0 },
];

export function BrandOrderManagementPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // 模拟数据加载
    setTimeout(() => {
      setOrders([]); // 空数据演示
      setLoading(false);
    }, 1500);
  }, []);

  const handlePublishOrder = () => {
    // 跳转到发布页面
    window.location.href = '/publish-order';
  };

  return (
    <div className="brand-order-page">
      {/* 页面头部 */}
      <header className="page-header">
        <div className="page-header__content">
          <div>
            <h1 className="page-header__title">品牌方商单管理</h1>
            <p className="page-header__subtitle">
              管理您的品牌合作商单，跟踪进度和效果
            </p>
          </div>
          <button 
            className="btn-primary"
            onClick={handlePublishOrder}
          >
            <Plus size={18} />
            发布商单
          </button>
        </div>
      </header>

      {/* 统计卡片 */}
      <section className="stats-section">
        <div className="stats-grid">
          {statsData.map((stat) => (
            <StatsCard
              key={stat.id}
              title={stat.title}
              value={loading ? 0 : stat.value}
              icon={stat.icon}
              variant={stat.variant}
              trend={stat.trend}
              trendLabel="较上月"
              isSelected={selectedFilter === stat.id}
              isLoading={loading}
              onClick={() => setSelectedFilter(
                selectedFilter === stat.id ? null : stat.id
              )}
            />
          ))}
        </div>
      </section>

      {/* 筛选栏 */}
      <section className="filter-section">
        <div className="filter-bar">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="搜索商单名称或品牌..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="btn-secondary">
            <Filter size={18} />
            筛选
          </button>
        </div>
      </section>

      {/* 内容区域 */}
      <section className="content-section">
        {loading ? (
          // 骨架屏加载中
          <div className="skeleton-list">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="skeleton-row" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          // 空状态
          <EmptyState
            title="暂无商单"
            description="您还没有发布任何商单，点击下方按钮开始创建"
            primaryAction={{
              label: '发布第一个商单',
              onClick: handlePublishOrder,
              icon: Plus,
            }}
            size="lg"
          />
        ) : (
          // 数据表格
          <div className="orders-table">
            {/* 表格内容 */}
          </div>
        )}
      </section>
    </div>
  );
}
```

---

## 样式文件示例

```css
/* BrandOrderManagement.css */

.brand-order-page {
  padding: var(--space-6);
  max-width: var(--container-max-width);
  margin: 0 auto;
}

/* 页面头部 */
.page-header {
  margin-bottom: var(--space-6);
}

.page-header__content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-4);
}

.page-header__title {
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  color: var(--color-text-primary);
  margin: 0 0 var(--space-2) 0;
}

.page-header__subtitle {
  font-size: var(--text-base);
  color: var(--color-text-secondary);
  margin: 0;
}

/* 按钮 */
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: 10px 20px;
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  color: white;
  background: var(--gradient-primary);
  border: none;
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
  box-shadow: var(--shadow-primary);
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: 10px 16px;
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  color: var(--color-text-secondary);
  background: white;
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
}

.btn-secondary:hover {
  background: var(--color-bg-secondary);
  border-color: var(--color-border-hover);
}

/* 统计区域 */
.stats-section {
  margin-bottom: var(--space-6);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-4);
}

/* 筛选栏 */
.filter-section {
  margin-bottom: var(--space-6);
}

.filter-bar {
  display: flex;
  gap: var(--space-3);
  align-items: center;
}

.search-box {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex: 1;
  max-width: 400px;
  padding: 10px 16px;
  background: white;
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-lg);
  transition: all var(--duration-fast) var(--ease-out);
}

.search-box:focus-within {
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.search-box input {
  flex: 1;
  border: none;
  background: none;
  outline: none;
  font-size: var(--text-base);
  color: var(--color-text-primary);
}

.search-box input::placeholder {
  color: var(--color-text-tertiary);
}

/* 内容区域 */
.content-section {
  min-height: 400px;
}

/* 骨架屏 */
.skeleton-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.skeleton-row {
  height: 64px;
  background: linear-gradient(90deg, var(--color-gray-100) 25%, var(--color-gray-50) 50%, var(--color-gray-100) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius-lg);
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

/* 响应式 */
@media (max-width: 768px) {
  .brand-order-page {
    padding: var(--space-4);
  }
  
  .page-header__content {
    flex-direction: column;
    align-items: stretch;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .filter-bar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-box {
    max-width: none;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
```

---

## 注意事项

1. **确保引入设计令牌**：在使用组件前，必须先引入 `design-tokens.css`

2. **图标库**：组件使用 `lucide-react` 图标库，请确保已安装：
   ```bash
   npm install lucide-react
   ```

3. **动画库**：组件使用 `framer-motion` 实现动画，请确保已安装：
   ```bash
   npm install framer-motion
   ```

4. **TypeScript 类型**：组件提供了完整的 TypeScript 类型定义，IDE 会提供自动补全

5. **可访问性**：组件已内置 ARIA 属性，确保屏幕阅读器可以正确识别

6. **暗色模式**：组件支持暗色模式，通过设置 `data-theme="dark"` 启用
