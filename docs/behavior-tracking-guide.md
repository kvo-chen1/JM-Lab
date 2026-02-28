# 行为追踪集成指南

本文档说明如何在关键用户交互点添加行为追踪，以确保数据分析系统收集真实数据。

## 核心概念

### 1. 用户行为追踪 (User Behavior Tracking)
记录用户在平台上的所有交互行为，包括：
- 浏览作品 (view_work)
- 点击作品 (click_work)
- 点赞 (like_work)
- 收藏 (collect_work)
- 分享 (share_work)
- 评论 (comment_work)
- 购买 (purchase_work)
- 查看推广内容 (view_promoted)
- 点击推广内容 (click_promoted)

### 2. 转化事件追踪 (Conversion Event Tracking)
记录用户通过推广产生的转化行为，包括：
- 购买 (purchase)
- 注册 (signup)
- 下载 (download)
- 分享 (share)
- 关注 (follow)

## 使用方法

### 方式一：使用 Hook（推荐）

在 React 组件中使用 `useBehaviorTracker` Hook：

```typescript
import { useBehaviorTracker } from '@/hooks/useBehaviorTracker';

function WorkCard({ work }) {
  const { trackWorkView, trackWorkClick } = useBehaviorTracker();

  // 作品进入视口时追踪曝光
  useEffect(() => {
    trackWorkView(work.id, {
      source: 'recommendation',
      position: 1,
    });
  }, [work.id]);

  // 点击时追踪
  const handleClick = async () => {
    await trackWorkClick(work.id, {
      source: 'recommendation',
    });
    // 其他点击逻辑...
  };

  return (
    <div onClick={handleClick}>
      {/* 作品内容 */}
    </div>
  );
}
```

### 方式二：直接使用服务

在非 React 环境或需要更灵活控制时：

```typescript
import { analyticsTrackingService } from '@/services/analyticsTrackingService';

// 追踪行为
await analyticsTrackingService.trackBehavior({
  action: 'view_work',
  work_id: 'work-123',
  metadata: { duration: 5000 }, // 停留 5 秒
});

// 追踪转化
await analyticsTrackingService.trackConversion({
  promoted_work_id: 'promoted-123',
  conversion_type: 'purchase',
  conversion_value: 199,
  metadata: { order_id: 'order-456' },
});
```

## 关键集成点

### 1. 作品详情页

**文件**: `src/pages/work/WorkDetail.tsx`

```typescript
import { useBehaviorTracker } from '@/hooks/useBehaviorTracker';

function WorkDetail({ workId }) {
  const { trackWorkView, trackLike, trackCollect, trackShare } = useBehaviorTracker();

  useEffect(() => {
    // 页面加载时追踪浏览
    trackWorkView(workId, { page: 'detail' });
    
    // 可选：追踪停留时长
    const startTime = Date.now();
    return () => {
      const duration = Date.now() - startTime;
      analyticsTrackingService.trackBehavior({
        action: 'view_work',
        work_id: workId,
        metadata: { duration },
      });
    };
  }, [workId]);

  const handleLike = async () => {
    await trackLike(workId);
    // 点赞逻辑...
  };

  const handleCollect = async () => {
    await trackCollect(workId);
    // 收藏逻辑...
  };

  const handleShare = async () => {
    await trackShare(workId, { shareTo: 'wechat' });
    // 分享逻辑...
  };

  return (
    // 页面内容
  );
}
```

### 2. 作品列表页

**文件**: `src/pages/work/WorkList.tsx`

```typescript
import { useBehaviorTracker } from '@/hooks/useBehaviorTracker';

function WorkList({ works }) {
  const { trackWorkClick } = useBehaviorTracker();

  const handleWorkClick = async (workId, index) => {
    await trackWorkClick(workId, {
      source: 'list',
      position: index,
    });
    // 导航到详情页...
  };

  return (
    <div>
      {works.map((work, index) => (
        <WorkCard
          key={work.id}
          work={work}
          onClick={() => handleWorkClick(work.id, index)}
        />
      ))}
    </div>
  );
}
```

### 3. 推广作品展示

**文件**: `src/pages/home/PromotedWorkCarousel.tsx`

```typescript
import { useBehaviorTracker } from '@/hooks/useBehaviorTracker';

function PromotedWorkCarousel({ promotedWorks }) {
  const { trackPromotedWorkView, trackPromotedWorkClick } = useBehaviorTracker();

  useEffect(() => {
    // 追踪曝光
    const visibleWork = promotedWorks[currentIndex];
    if (visibleWork) {
      trackPromotedWorkView(visibleWork.id, {
        position: currentIndex,
        carousel: 'home_promoted',
      });
    }
  }, [currentIndex, promotedWorks]);

  const handleClick = async (promotedWork) => {
    await trackPromotedWorkClick(promotedWork.id, {
      position: currentIndex,
    });
    // 导航逻辑...
  };

  return (
    // 轮播内容
  );
}
```

### 4. 支付成功页面

**文件**: `src/pages/payment/PaymentSuccess.tsx`

```typescript
import { useBehaviorTracker } from '@/hooks/useBehaviorTracker';

function PaymentSuccess({ orderId, workId, promotedWorkId, amount }) {
  const { trackPurchase, trackConversion } = useBehaviorTracker();

  useEffect(() => {
    // 追踪购买行为
    trackPurchase(workId, amount, { order_id: orderId });

    // 如果是推广订单，追踪转化事件
    if (promotedWorkId) {
      trackConversion(promotedWorkId, 'purchase', amount, {
        order_id: orderId,
      });
    }
  }, [orderId, workId, promotedWorkId, amount]);

  return (
    // 支付成功页面内容
  );
}
```

### 5. 用户注册成功

**文件**: `src/pages/auth/RegisterSuccess.tsx`

```typescript
import { useBehaviorTracker } from '@/hooks/useBehaviorTracker';

function RegisterSuccess({ invitedBy, fromPromotedWork }) {
  const { trackConversion } = useBehaviorTracker();

  useEffect(() => {
    // 如果是通过推广注册
    if (fromPromotedWork) {
      trackConversion(fromPromotedWork, 'signup', 0, {
        invited_by: invitedBy,
      });
    }
  }, [invitedBy, fromPromotedWork]);

  return (
    // 注册成功页面
  );
}
```

### 6. 创作者中心 - 作品管理

**文件**: `src/pages/creator-center/WorkManagement.tsx`

```typescript
import { useBehaviorTracker } from '@/hooks/useBehaviorTracker';

function WorkManagement() {
  const { trackWorkView, trackWorkClick } = useBehaviorTracker();

  const handleViewWork = async (workId) => {
    await trackWorkView(workId, { source: 'creator_center' });
    // 查看详情逻辑...
  };

  const handleClickWork = async (workId) => {
    await trackWorkClick(workId, { source: 'creator_center' });
    // 编辑逻辑...
  };

  return (
    // 作品管理页面
  );
}
```

## 最佳实践

### 1. 追踪时机

✅ **正确的做法**:
- 组件挂载时追踪曝光
- 用户交互完成后追踪（点击、点赞等）
- 页面卸载前追踪停留时长
- 关键转化节点追踪（支付成功、注册成功）

❌ **错误的做法**:
- 在循环中频繁调用追踪
- 追踪失败时阻塞主流程
- 未等待追踪完成就跳转页面

### 2. 性能优化

```typescript
// 使用防抖减少频繁调用
const debouncedTrackView = useCallback(
  debounce((workId) => {
    trackWorkView(workId);
  }, 1000),
  []
);

// 批量追踪
const trackBatch = async () => {
  await Promise.all([
    trackWorkView(workId1),
    trackWorkView(workId2),
  ]);
};
```

### 3. 错误处理

```typescript
try {
  await trackWorkClick(workId);
} catch (error) {
  console.error('追踪失败:', error);
  // 不要阻塞主流程，继续执行后续逻辑
}
```

### 4. 元数据使用

```typescript
// 提供丰富的上下文信息
await trackWorkClick(workId, {
  source: 'search',           // 来源
  position: 5,                // 位置
  search_query: '风景',       // 搜索词
  filter: 'latest',           // 筛选条件
  page: 2,                    // 页码
});
```

## 数据验证

### 1. 查看实时数据

在管理员后台的"高级数据分析"页面查看：
- 实时数据大屏
- 用户行为漏斗
- 转化漏斗分析

### 2. 查询数据库

```sql
-- 查看最近的行为日志
SELECT * FROM user_behavior_logs 
ORDER BY created_at DESC 
LIMIT 100;

-- 查看转化事件
SELECT * FROM conversion_events 
ORDER BY created_at DESC 
LIMIT 100;

-- 统计今日行为
SELECT action, COUNT(*) 
FROM user_behavior_logs 
WHERE DATE(created_at) = CURRENT_DATE 
GROUP BY action;
```

## 常见问题

### Q: 追踪失败会影响用户体验吗？
A: 不会。所有追踪方法都有错误处理，失败时不会阻塞主流程。

### Q: 需要用户授权吗？
A: 建议在隐私政策中说明数据收集行为，但不需要单独的授权弹窗。

### Q: 数据多久更新一次？
A: 行为日志实时写入数据库，分析页面每 30 秒自动刷新。

### Q: 如何测试追踪是否生效？
A: 
1. 打开浏览器开发者工具
2. 查看 Console 是否有追踪日志
3. 在 Supabase 中查询 `user_behavior_logs` 和 `conversion_events` 表

## 下一步

完成集成后：
1. 运行数据库迁移创建必要的表
2. 在关键页面添加行为追踪
3. 访问管理员后台查看数据分析
4. 根据数据优化产品和运营策略
