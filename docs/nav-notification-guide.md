# 后台管理系统导航通知功能使用文档

## 概述

本文档描述了后台管理系统中左侧导航栏的新请求通知功能的实现和使用方法。该功能可以在导航项旁边显示小红点或数字标记，提醒管理员有待处理的新请求。

## 功能特性

- **实时通知检测**: 自动轮询和实时订阅数据库变化
- **视觉提示**: 支持数字标记和小红点两种形式
- **状态管理**: 未读/已读状态自动切换
- **持久化存储**: 通知状态保存在 localStorage 中
- **动画效果**: 平滑的过渡动画和脉冲效果
- **响应式设计**: 适配不同屏幕尺寸

## 核心组件

### 1. NavNotificationBadge 组件

通知标记UI组件，用于显示数字或小红点。

**文件位置**: `src/components/NavNotificationBadge.tsx`

**Props 接口**:

```typescript
interface NavNotificationBadgeProps {
  count?: number;           // 显示的数字，不传入则显示小红点
  showDot?: boolean;        // 是否显示小红点
  pulse?: boolean;          // 是否显示脉冲动画
  size?: 'sm' | 'md' | 'lg'; // 尺寸
  variant?: 'default' | 'error' | 'warning' | 'success'; // 颜色变体
  maxCount?: number;        // 最大显示数字，超过显示为 maxCount+
  className?: string;       // 自定义类名
  onClick?: (e: React.MouseEvent) => void; // 点击事件
}
```

**使用示例**:

```tsx
import NavNotificationBadge from '@/components/NavNotificationBadge';

// 显示数字标记
<NavNotificationBadge count={5} />

// 显示小红点
<NavNotificationBadge showDot={true} />

// 自定义样式
<NavNotificationBadge 
  count={100} 
  size="lg" 
  variant="error"
  maxCount={99}
/>
```

### 2. useNavNotifications Hook

通知状态管理Hook，提供完整的通知状态管理和数据获取功能。

**文件位置**: `src/hooks/useNavNotifications.ts`

**返回值**:

```typescript
interface UseNavNotificationsReturn {
  notifications: NavNotificationsMap;    // 所有导航项的通知状态
  markAsViewed: (navItem: NavItemType) => void;  // 标记单个为已查看
  markAllAsViewed: () => void;           // 标记全部为已查看
  refreshNotifications: () => Promise<void>; // 手动刷新通知
  isLoading: boolean;                    // 加载状态
  lastUpdated: Date | null;              // 最后更新时间
  totalUnreadCount: number;              // 总未读数
}
```

**支持的导航项类型**:

```typescript
type NavItemType = 
  | 'feedback'           // 反馈管理
  | 'eventAudit'         // 活动审核
  | 'contentAudit'       // 内容审核
  | 'userAudit'          // 用户审计
  | 'orders'             // 订单管理
  | 'permissions'        // 权限管理
  | 'productManagement'  // 商品管理
  | 'notificationManagement' // 消息通知
  | 'communities'        // 社群管理
  | 'campaigns'          // 活动管理
  | 'users'              // 用户管理
  | 'creators';          // 创作者管理
```

**使用示例**:

```tsx
import { useNavNotifications } from '@/hooks/useNavNotifications';

function MyComponent() {
  const {
    notifications,
    markAsViewed,
    markAllAsViewed,
    refreshNotifications,
    isLoading,
    totalUnreadCount,
  } = useNavNotifications();

  // 获取反馈管理的通知数量
  const feedbackCount = notifications.feedback.count;
  const hasNewFeedback = notifications.feedback.hasNew;

  // 标记为已查看
  const handleViewFeedback = () => {
    markAsViewed('feedback');
  };

  return (
    <div>
      <span>待处理反馈: {feedbackCount}</span>
      <button onClick={handleViewFeedback}>查看反馈</button>
      <button onClick={markAllAsViewed}>全部标记为已读</button>
      <button onClick={refreshNotifications} disabled={isLoading}>
        刷新
      </button>
    </div>
  );
}
```

### 3. AdminSidebar 组件

增强版管理后台侧边栏组件，集成通知功能。

**文件位置**: `src/components/admin/AdminSidebar.tsx`

**Props 接口**:

```typescript
interface AdminSidebarProps {
  isDark: boolean;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  user?: {
    username?: string;
    avatar?: string;
  } | null;
  onLogout?: () => void;
  notifications?: NavNotificationsMap;
  onMarkAsViewed?: (navItem: NavItemType) => void;
  totalUnreadCount?: number;
}
```

**使用示例**:

```tsx
import AdminSidebar from '@/components/admin/AdminSidebar';
import { useNavNotifications } from '@/hooks/useNavNotifications';

function AdminPage() {
  const {
    notifications,
    markAsViewed,
    totalUnreadCount,
  } = useNavNotifications();

  const [activeTab, setActiveTab] = useState('dashboard');

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  return (
    <AdminSidebar
      isDark={false}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      notifications={notifications}
      onMarkAsViewed={markAsViewed}
      totalUnreadCount={totalUnreadCount}
    />
  );
}
```

## 集成指南

### 在 Admin.tsx 中集成

系统已经在 `Admin.tsx` 中完成了集成，主要步骤如下：

1. **导入依赖**:

```tsx
import AdminSidebar from '@/components/admin/AdminSidebar';
import { useNavNotifications, type NavItemType } from '@/hooks/useNavNotifications';
```

2. **使用 Hook**:

```tsx
const {
  notifications,
  markAsViewed,
  markAllAsViewed,
  refreshNotifications,
  isLoading: notificationsLoading,
  totalUnreadCount,
} = useNavNotifications();
```

3. **处理标签切换**:

```tsx
const handleTabChange = (tabId: string) => {
  if (notifications[tabId as NavItemType]?.count > 0) {
    markAsViewed(tabId as NavItemType);
  }
  setActiveTab(tabId as TabType);
};
```

4. **渲染侧边栏**:

```tsx
<AdminSidebar
  isDark={isDark}
  activeTab={activeTab}
  onTabChange={handleTabChange}
  user={user}
  onLogout={handleLogout}
  notifications={notifications}
  onMarkAsViewed={markAsViewed}
  totalUnreadCount={totalUnreadCount}
/>
```

## 数据源配置

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

## 实时更新机制

系统使用两种机制确保通知的实时性：

1. **轮询机制**: 每30秒自动刷新一次数据
2. **Supabase 实时订阅**: 监听数据库变化事件

```typescript
// 轮询
setInterval(() => {
  fetchNotificationCounts();
}, 30000);

// 实时订阅
supabase
  .channel('feedback_changes')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'user_feedback' }, callback)
  .subscribe();
```

## 状态持久化

通知状态自动保存到 localStorage，键名为 `admin_nav_notifications`。页面刷新后会自动恢复之前的状态。

## 动画效果

### NavNotificationBadge 动画

- **出现动画**: scale 从 0 到 1，opacity 从 0 到 1
- **数字变化动画**: scale 过渡效果
- **脉冲动画**: 小红点的呼吸效果

### AdminSidebar 动画

- **导航项进入动画**: 从左侧滑入，依次延迟
- **活跃指示器**: 使用 Framer Motion 的 layoutId 实现平滑过渡
- **Logo 指示器**: 当有未读通知时显示脉冲动画

## 响应式设计

侧边栏在不同屏幕尺寸下的表现：

- **桌面端 (≥1024px)**: 固定宽度 256px，始终显示
- **平板端 (768px - 1023px)**: 可折叠，默认收起
- **移动端 (<768px)**: 使用抽屉式菜单

## 测试

### 运行测试

```bash
# 运行所有测试
npm test

# 运行特定测试文件
npm test NavNotificationBadge.test.tsx
npm test useNavNotifications.test.ts
npm test AdminSidebar.test.tsx
```

### 测试覆盖

- **NavNotificationBadge**: 渲染、尺寸、变体、点击事件、动画
- **useNavNotifications**: 状态管理、localStorage、数据获取
- **AdminSidebar**: 渲染、交互、样式、通知集成

## 常见问题

### Q: 如何添加新的导航项通知？

A: 在 `useNavNotifications.ts` 中：

1. 添加新的 `NavItemType`
2. 在 `fetchNotificationCounts` 中添加数据获取逻辑
3. 添加 Supabase 实时订阅

### Q: 如何修改轮询间隔？

A: 修改 `useNavNotifications.ts` 中的 `setInterval` 时间：

```typescript
pollingRef.current = setInterval(() => {
  fetchNotificationCounts();
}, 60000); // 改为 60 秒
```

### Q: 如何自定义通知标记样式？

A: 使用 `NavNotificationBadge` 的 `className` prop：

```tsx
<NavNotificationBadge 
  count={5} 
  className="custom-badge-class"
/>
```

### Q: 通知不更新怎么办？

A: 检查以下几点：

1. Supabase 连接是否正常
2. 数据库表名和字段名是否正确
3. 实时订阅是否成功建立
4. 浏览器控制台是否有错误信息

## 更新日志

### v1.0.0

- 初始版本发布
- 实现基础通知标记功能
- 支持 7 个导航项的通知检测
- 集成到 Admin.tsx

## 相关文件

- `src/components/NavNotificationBadge.tsx` - 通知标记组件
- `src/hooks/useNavNotifications.ts` - 通知状态管理 Hook
- `src/components/admin/AdminSidebar.tsx` - 增强版侧边栏
- `src/pages/admin/Admin.tsx` - 管理后台主页面
- `src/components/__tests__/NavNotificationBadge.test.tsx` - 组件测试
- `src/hooks/__tests__/useNavNotifications.test.ts` - Hook 测试
- `src/components/admin/__tests__/AdminSidebar.test.tsx` - 侧边栏测试
