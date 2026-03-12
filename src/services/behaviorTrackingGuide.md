# 用户行为追踪使用指南

## 概述

系统现已支持全面的用户行为追踪，包括社交互动、搜索、浏览、创作、活动参与等多种行为类型。

## 行为类型分类

### 1. 脉络创作行为
- `mindmap_create/edit/delete` - 脉络创建/编辑/删除
- `node_create/edit/delete` - 节点创建/编辑/删除
- `ai_suggestion_request/apply` - AI建议请求/应用
- `story_generate` - 故事生成
- `brand_inspiration_use` - 使用天津老字号元素
- `layout_change/theme_change` - 布局/主题切换
- `export/import` - 导出/导入

### 2. 作品行为
- `work_publish/save/share/view/download` - 作品发布/保存/分享/浏览/下载
- `work_like/unlike/favorite/unfavorite` - 作品点赞/取消点赞/收藏/取消收藏

### 3. 社交互动行为
- `post_like/unlike/favorite/unfavorite` - 帖子点赞/取消点赞/收藏/取消收藏
- `post_comment/comment_delete` - 评论/删除评论
- `post_share/view` - 分享/浏览帖子
- `user_follow/unfollow` - 关注/取消关注用户

### 4. 搜索行为
- `search` - 搜索查询
- `search_click_result` - 点击搜索结果
- `search_filter` - 使用搜索筛选

### 5. 浏览行为
- `page_view` - 页面浏览
- `content_scroll` - 内容滚动
- `content_click` - 内容点击

### 6. 创作行为
- `creation_start/complete/abandon` - 创作开始/完成/放弃
- `ai_generation_request/complete` - AI生成请求/完成

### 7. 活动参与行为
- `event_view/participate/submit_work` - 活动浏览/参与/提交作品

### 8. 认证行为
- `user_login/logout/register` - 用户登录/登出/注册
- `profile_update` - 资料更新
- `password_change` - 密码修改

### 9. 签到行为
- `checkin` - 签到
- `checkin_streak` - 连续签到

### 10. 积分行为
- `points_earn` - 积分获取
- `points_redeem` - 积分兑换

### 11. 模板行为
- `template_view/use/favorite/unfavorite` - 模板浏览/使用/收藏/取消收藏

### 12. 游戏/活动行为
- `game_start/complete/score` - 游戏开始/完成/得分

### 13. 聊天行为
- `chat_start` - 开始聊天
- `chat_message_send/receive` - 发送/接收消息

### 14. 通知行为
- `notification_receive/click/dismiss` - 通知接收/点击/关闭

### 15. 分享行为
- `share_copy_link` - 复制链接
- `share_wechat/weibo/qq` - 分享到微信/微博/QQ

### 16. 设置行为
- `settings_update` - 设置更新
- `privacy_update` - 隐私设置更新

### 17. 支付行为
- `payment_start/complete/cancel` - 支付开始/完成/取消

### 18. 会员行为
- `membership_view/upgrade` - 会员浏览/升级

### 19. 收藏夹行为
- `collection_create/delete` - 收藏夹创建/删除
- `collection_item_add/remove` - 添加/移除收藏项

### 20. 反馈行为
- `feedback_submit` - 提交反馈
- `report_submit` - 提交举报
- `help_request` - 请求帮助

## 使用方式

### 1. 使用 Hook（推荐）

```typescript
// 社交行为追踪
import { useSocialBehaviorTracking, usePostBehaviorTracking, useWorkBehaviorTracking } from '@/hooks/useSocialBehaviorTracking';

function PostCard({ post }) {
  const { trackLike, trackFavorite, trackComment, trackShare, trackView } = usePostBehaviorTracking(post.id, post.title);

  const handleLike = async () => {
    await togglePostLike(post.id);
    await trackLike();
  };

  return (
    <div onMouseEnter={() => trackView()}>
      {/* 帖子内容 */}
      <button onClick={handleLike}>点赞</button>
      <button onClick={() => trackFavorite()}>收藏</button>
    </div>
  );
}

// 搜索行为追踪
import { useSearchBehaviorTracking, usePageViewTracking } from '@/hooks/useSearchBehaviorTracking';

function SearchPage() {
  const { trackSearch, trackSearchResultClick } = useSearchBehaviorTracking();
  const { trackPageView } = usePageViewTracking();

  useEffect(() => {
    trackPageView('/search', '搜索页面');
  }, []);

  const handleSearch = async (query) => {
    const results = await search(query);
    await trackSearch(query, results.length);
  };

  return (
    <div>
      {/* 搜索结果 */}
      {results.map((item, index) => (
        <div
          key={item.id}
          onClick={() => trackSearchResultClick(item.type, item.id, item.title, index)}
        >
          {item.title}
        </div>
      ))}
    </div>
  );
}
```

### 2. 直接使用服务函数

```typescript
import { behaviorAnalysisService } from '@/services/behaviorAnalysisService';

// 社交行为
await behaviorAnalysisService.recordSocialBehavior(
  userId,
  'post_like',
  postId,
  postTitle
);

// 作品互动
await behaviorAnalysisService.recordWorkInteraction(
  userId,
  'work_view',
  workId,
  workTitle,
  { viewDuration: 30000 }
);

// 搜索行为
await behaviorAnalysisService.recordSearchBehavior(
  userId,
  query,
  resultCount,
  filters
);

// 页面浏览
await behaviorAnalysisService.recordPageView(
  userId,
  pagePath,
  pageTitle,
  referrer
);

// 创作行为
await behaviorAnalysisService.recordCreationBehavior(
  userId,
  'creation_start',
  'pattern_design'
);

// 活动参与
await behaviorAnalysisService.recordEventParticipation(
  userId,
  'event_participate',
  eventId,
  eventTitle
);

// 用户认证
await behaviorAnalysisService.recordAuthBehavior(
  userId,
  'user_login',
  { ip: 'xxx.xxx.xxx.xxx', device: 'mobile' }
);

// 签到
await behaviorAnalysisService.recordCheckin(
  userId,
  7, // 连续签到天数
  10 // 获得积分
);

// 积分
await behaviorAnalysisService.recordPointsBehavior(
  userId,
  'points_earn',
  100,
  'daily_checkin'
);

// 模板
await behaviorAnalysisService.recordTemplateBehavior(
  userId,
  'template_use',
  templateId,
  templateName
);

// 游戏
await behaviorAnalysisService.recordGameBehavior(
  userId,
  'game_complete',
  gameId,
  gameName,
  85 // 分数
);

// 聊天
await behaviorAnalysisService.recordChatBehavior(
  userId,
  'chat_message_send',
  chatId,
  receiverId
);

// 通知
await behaviorAnalysisService.recordNotificationBehavior(
  userId,
  'notification_click',
  notificationId,
  'comment_reply'
);

// 分享
await behaviorAnalysisService.recordShareBehavior(
  userId,
  'share_wechat',
  contentId,
  'work'
);

// 设置
await behaviorAnalysisService.recordSettingsBehavior(
  userId,
  'settings_update',
  'notification_preferences'
);

// 支付
await behaviorAnalysisService.recordPaymentBehavior(
  userId,
  'payment_complete',
  orderId,
  99.99
);

// 会员
await behaviorAnalysisService.recordMembershipBehavior(
  userId,
  'membership_upgrade',
  'premium'
);

// 收藏夹
await behaviorAnalysisService.recordCollectionBehavior(
  userId,
  'collection_item_add',
  collectionId,
  itemId
);
```

### 3. 在现有服务中集成

已在以下服务中自动集成行为记录：

- `communityInteractionService.ts` - 点赞、收藏自动记录
- `searchService.ts` - 搜索行为自动记录

## 数据存储

所有行为数据存储在 Supabase 的 `user_behavior_logs` 表中：

```sql
CREATE TABLE user_behavior_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  behavior_type VARCHAR(50),
  target_type VARCHAR(50),
  target_id VARCHAR(255),
  target_title TEXT,
  metadata JSONB,
  session_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 注意事项

1. 所有记录函数都是异步的，建议使用 `await` 或 `.catch()` 处理错误
2. 未登录用户的行为不会被记录（`userId` 为 null 时直接返回）
3. 行为记录失败不会影响主业务流程
4. 建议在生产环境中批量处理行为记录以提高性能

## 分析功能

使用 `behaviorAnalysisService.analyzeUserBehavior(userId)` 可以分析用户行为并生成个性化画像。

```typescript
const analysis = await behaviorAnalysisService.analyzeUserBehavior(userId);
// 返回：用户标签、创作风格、偏好、建议等
```
