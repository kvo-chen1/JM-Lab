# 后台管理系统导航通知功能

## 功能概述

为后台管理系统左侧导航栏添加了新请求通知功能，当系统中有新的待处理请求时，会在对应导航项旁显示视觉提示（小红点或数字标记）。

## 实现文件清单

### 核心组件

| 文件路径 | 说明 |
|---------|------|
| `src/components/NavNotificationBadge.tsx` | 通知标记UI组件，支持数字标记和小红点 |
| `src/hooks/useNavNotifications.ts` | 通知状态管理Hook，提供数据获取和状态管理 |
| `src/components/admin/AdminSidebar.tsx` | 增强版侧边栏组件，集成通知功能 |

### 测试文件

| 文件路径 | 说明 |
|---------|------|
| `src/components/__tests__/NavNotificationBadge.test.tsx` | 通知标记组件单元测试 |
| `src/hooks/__tests__/useNavNotifications.test.ts` | 通知Hook单元测试 |
| `src/components/admin/__tests__/AdminSidebar.test.tsx` | 侧边栏组件单元测试 |

### 文档

| 文件路径 | 说明 |
|---------|------|
| `docs/nav-notification-guide.md` | 详细使用文档 |

### 修改的文件

| 文件路径 | 修改内容 |
|---------|---------|
| `src/pages/admin/Admin.tsx` | 集成新的 AdminSidebar 和 useNavNotifications |

## 功能特性

1. **实时通知检测**
   - 每30秒自动轮询数据
   - Supabase 实时订阅数据库变化

2. **视觉提示**
   - 数字标记：显示具体待处理数量
   - 小红点：简单的新消息提示
   - 脉冲动画：吸引注意力的呼吸效果

3. **状态管理**
   - 未读/已读状态自动切换
   - 点击导航项后自动清除通知标记
   - localStorage 持久化存储

4. **响应式设计**
   - 适配桌面端、平板端和移动端
   - 暗色/亮色主题支持

5. **动画效果**
   - 导航项进入动画
   - 活跃指示器平滑过渡
   - 通知标记出现/消失动画

## 快速开始

### 基本使用

```tsx
import { useNavNotifications } from '@/hooks/useNavNotifications';

function MyComponent() {
  const { notifications, markAsViewed, totalUnreadCount } = useNavNotifications();

  // 获取反馈管理的通知数量
  const feedbackCount = notifications.feedback.count;

  return (
    <div>
      <span>待处理反馈: {feedbackCount}</span>
      <button onClick={() => markAsViewed('feedback')}>
        标记为已读
      </button>
    </div>
  );
}
```

### 支持的导航项

- `feedback` - 反馈管理
- `eventAudit` - 活动审核
- `contentAudit` - 内容审核
- `userAudit` - 用户审计
- `orders` - 订单管理
- `communities` - 社群管理
- `users` - 用户管理

## 数据源

通知数据从以下数据库表获取：

| 导航项 | 数据表 | 查询条件 |
|--------|--------|----------|
| feedback | user_feedback | status = 'pending' |
| eventAudit | events | status = 'pending' |
| contentAudit | content_moderation | status = 'pending' |
| userAudit | user_audit_logs | status = 'pending_review' |
| orders | orders | status IN ('pending', 'processing') |
| communities | community_join_requests | status = 'pending' |
| users | profiles | verification_status = 'pending' |

## 运行测试

```bash
# 运行所有测试
npm test

# 运行特定测试
npm test NavNotificationBadge.test.tsx
npm test useNavNotifications.test.ts
npm test AdminSidebar.test.tsx
```

## 详细文档

请参阅 `docs/nav-notification-guide.md` 获取完整的使用文档。
