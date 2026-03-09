# 积分商城商品状态显示问题修复

## 问题描述

**现象**: 
- 后台数据库显示商品状态为 `active` (已上架)
- 前端页面显示商品状态为 `已下架`

**原因**: 
数据库和前端使用了不同的状态值枚举:
- **数据库** (`points_products` 表): 使用 `active` / `inactive` / `sold_out`
- **前端** (`Product` 类型): 使用 `on_sale` / `off_shelf` / `sold_out`

## 问题分析

### 1. 数据库状态
```sql
-- points_products 表的 status 字段
status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'sold_out'))
```

### 2. 前端类型定义
```typescript
// productService.ts 中的 Product 类型
interface Product {
  status: 'pending' | 'approved' | 'on_sale' | 'off_shelf' | 'sold_out';
  // ...
}

// PointsProduct 类型 (积分商城商品)
interface PointsProduct {
  status: 'active' | 'inactive' | 'sold_out';
  // ...
}
```

### 3. 问题根源
前端积分商城页面 (`PointsMall.tsx`) 使用 `Product` 类型，但实际从数据库获取的是 `PointsProduct` 数据，导致状态不匹配:
- 数据库返回 `status: 'active'` 
- 前端期望 `status: 'on_sale'`
- 前端判断 `product.status !== 'on_sale'` 为 `true`,显示为"已下架"

## 解决方案

在 `productService.ts` 中添加状态映射，在数据往返时自动转换:

### 1. 获取商品时 (数据库 -> 前端)
文件：`src/services/productService.ts` - `getAllProducts()` 函数

```typescript
// 映射字段以兼容前端
return (data || []).map(product => ({
  ...product,
  imageUrl: product.image_url,
  isFeatured: product.is_featured,
  tags: Array.isArray(product.tags) ? product.tags : [],
  // 状态映射：数据库的 active/inactive/sold_out 映射为前端的 on_sale/off_shelf/sold_out
  status: product.status === 'active' ? 'on_sale' : product.status === 'inactive' ? 'off_shelf' : product.status,
}));
```

### 2. 添加商品时 (前端 -> 数据库)
文件：`src/services/productService.ts` - `addProduct()` 函数

```typescript
const dbData = {
  name: productData.name,
  description: productData.description,
  points: productData.points || 0,
  stock: productData.stock || 0,
  category: productData.category || 'physical',
  image_url: productData.imageUrl || productData.image_url,
  tags: productData.tags || [],
  // 状态映射：前端的 on_sale/off_shelf/sold_out 映射为数据库的 active/inactive/sold_out
  status: productData.status === 'on_sale' ? 'active' : productData.status === 'off_shelf' ? 'inactive' : productData.status,
  is_featured: productData.isFeatured || productData.is_featured || false,
  is_limited: productData.is_limited || false,
  limit_per_user: productData.limit_per_user || 0,
  sort_order: productData.sort_order || 0,
};
```

### 3. 更新商品时 (前端 -> 数据库)
文件：`src/services/productService.ts` - `updatePointsProduct()` 函数

```typescript
// 状态映射：前端的 on_sale/off_shelf/sold_out 映射为数据库的 active/inactive/sold_out
if (updates.status !== undefined) {
  dbData.status = updates.status === 'on_sale' ? 'active' : updates.status === 'off_shelf' ? 'inactive' : updates.status;
}
```

## 状态映射关系

| 数据库状态 | 前端状态 | 前端显示 |
|-----------|---------|---------|
| `active`  | `on_sale` | 已上架/可兑换 |
| `inactive` | `off_shelf` | 已下架 |
| `sold_out` | `sold_out` | 已售罄 |

## 验证结果

运行测试脚本 `node test-status-mapping.js` 验证映射逻辑:

```
✅ active -> on_sale: 正确
✅ inactive -> off_shelf: 正确
✅ sold_out -> sold_out: 正确
✅ on_sale -> active: 正确
✅ off_shelf -> inactive: 正确
✅ sold_out -> sold_out: 正确
```

## 数据库连接验证

运行检查脚本 `node check-points-products-status.mjs` 验证:

```
✅ 数据库连接成功
✅ points_products 表存在
✅ 表结构正确
✅ RLS 策略配置正确
✅ 所有 10 个商品状态都是 active (已上架)
```

## 修复后的效果

修复后，前端积分商城页面将正确显示:
- 数据库中 `status='active'` 的商品 → 前端显示"已上架"/"可兑换"
- 数据库中 `status='inactive'` 的商品 → 前端显示"已下架"
- 数据库中 `status='sold_out'` 的商品 → 前端显示"已售罄"

## 相关文件

- `src/services/productService.ts` - 添加状态映射逻辑
- `src/pages/PointsMall.tsx` - 前端页面 (无需修改，自动受益)
- `scripts/create-points-products-table.sql` - 数据库表结构
- `check-points-products-status.mjs` - 数据库状态检查脚本
- `test-status-mapping.js` - 状态映射测试脚本

## 后续建议

1. **统一状态枚举**: 考虑在未来版本中统一数据库和前端的 status 枚举值
2. **类型安全**: 使用 TypeScript 的 discriminated union 类型增强类型安全
3. **API 文档**: 更新 API 文档说明状态映射关系
4. **测试覆盖**: 添加端到端测试确保状态映射正确工作
