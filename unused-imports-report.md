# 未使用导入检查报告

## 统计概览

| 指标 | 数值 |
|------|------|
| 检查文件总数 | 1226 |
| 发现问题文件数 | 665 |
| 未使用导入总数 | 2804 |
| 问题文件占比 | 54.2% |

## 按目录分布

| 目录 | 未使用导入数 | 涉及文件数 |
|------|-------------|-----------|
| src/pages | 1411 | 235 |
| src/components | 867 | 265 |
| src/services | 366 | 119 |
| src/hooks | 32 | 15 |
| src/utils | 29 | 11 |
| src/lib | 28 | 4 |
| src/contexts | 24 | 5 |
| src/App.tsx | 21 | 1 |
| src/scripts | 7 | 2 |
| src/config | 6 | 1 |
| src/main.tsx | 5 | 1 |
| src/stores | 4 | 2 |
| src/constants | 1 | 1 |
| src/mock | 1 | 1 |
| src/mocks | 1 | 1 |
| src/types | 1 | 1 |

## 高频未使用导入（Top 30）

| 导入名称 | 出现次数 |
|---------|---------|
| `error` | 173 |
| `e` | 87 |
| `AnimatePresence` | 47 |
| `userId` | 40 |
| `Filter` | 33 |
| `index` | 30 |
| `Clock` | 27 |
| `MoreHorizontal` | 27 |
| `Calendar` | 26 |
| `useCallback` | 22 |
| `ChevronRight` | 21 |
| `TrendingUp` | 19 |
| `useEffect` | 19 |
| `AlertCircle` | 18 |
| `isDark` | 17 |
| `ChevronDown` | 17 |
| `toast` | 17 |
| `err` | 16 |
| `useMemo` | 16 |
| `supabase` | 16 |
| `motion` | 15 |
| `node` | 15 |
| `BarChart3` | 14 |
| `useRef` | 13 |
| `Award` | 13 |
| `RefreshCw` | 13 |
| `ExternalLink` | 13 |
| `Eye` | 13 |
| `Sparkles` | 13 |
| `Download` | 12 |

## 问题文件列表（前 50 个）

<details>
<summary>点击查看详细列表</summary>


### src/App.tsx
- 第 1 行: `useRef` - 'useRef' is defined but never used.
- 第 18 行: `motion` - 'motion' is defined but never used.
- 第 21 行: `useNavigationType` - 'useNavigationType' is defined but never used.
- 第 21 行: `Link` - 'Link' is defined but never used.
- 第 26 行: `postsApi` - 'postsApi' is defined but never used.
- 第 27 行: `addPost` - 'addPost' is defined but never used.
- 第 28 行: `Post` - 'Post' is defined but never used.
- 第 102 行: `Studio` - 'Studio' is assigned a value but never used. Allowed unused vars must match /^_/u.
- 第 106 行: `AIWriter` - 'AIWriter' is assigned a value but never used. Allowed unused vars must match /^_/u.
- 第 125 行: `Neo` - 'Neo' is assigned a value but never used. Allowed unused vars must match /^_/u.
- 第 162 行: `CreateLayout` - 'CreateLayout' is assigned a value but never used. Allowed unused vars must match /^_/u.
- 第 750 行: `DashboardSkeleton` - 'DashboardSkeleton' is defined but never used.
- 第 750 行: `ProfileSkeleton` - 'ProfileSkeleton' is defined but never used.
- 第 803 行: `setMembers` - 'setMembers' is assigned a value but never used. Allowed unused vars must match /^_/u.
- 第 804 行: `setPendingContent` - 'setPendingContent' is assigned a value but never used. Allowed unused vars must match /^_/u.
- 第 805 行: `setApprovedContent` - 'setApprovedContent' is assigned a value but never used. Allowed unused vars must match /^_/u.
- 第 806 行: `setRejectedContent` - 'setRejectedContent' is assigned a value but never used. Allowed unused vars must match /^_/u.
- 第 876 行: `isAuthenticated` - 'isAuthenticated' is assigned a value but never used. Allowed unused vars must match /^_/u.
- 第 937 行: `e` - 'e' is defined but never used.
- 第 1043 行: `LazyRightContent` - 'LazyRightContent' is assigned a value but never used. Allowed unused vars must match /^_/u.
- 第 1048 行: `GlobalLoadingSkeleton` - 'GlobalLoadingSkeleton' is assigned a value but never used. Allowed unused vars must match /^_/u.


### src/components/AIActionSuggestions.tsx
- 第 11 行: `Wand2` - 'Wand2' is defined but never used.
- 第 306 行: `error` - 'error' is defined but never used.
- 第 370 行: `error` - 'error' is defined but never used.
- 第 503 行: `error` - 'error' is defined but never used.
- 第 591 行: `error` - 'error' is defined but never used.


### src/components/AICollaborationMessage.tsx
- 第 3 行: `AnimatePresence` - 'AnimatePresence' is defined but never used.
- 第 40 行: `feedbackRating` - 'feedbackRating' is defined but never used. Allowed unused args must match /^_/u.
- 第 41 行: `feedbackComment` - 'feedbackComment' is defined but never used. Allowed unused args must match /^_/u.
- 第 42 行: `isFeedbackVisible` - 'isFeedbackVisible' is defined but never used. Allowed unused args must match /^_/u.
- 第 43 行: `onRating` - 'onRating' is defined but never used. Allowed unused args must match /^_/u.
- 第 44 行: `onFeedbackSubmit` - 'onFeedbackSubmit' is defined but never used. Allowed unused args must match /^_/u.
- 第 45 行: `onFeedbackCommentChange` - 'onFeedbackCommentChange' is defined but never used. Allowed unused args must match /^_/u.
- 第 46 行: `onFeedbackToggle` - 'onFeedbackToggle' is defined but never used. Allowed unused args must match /^_/u.
- 第 143 行: `node` - 'node' is defined but never used. Allowed unused args must match /^_/u.
- 第 181 行: `node` - 'node' is defined but never used. Allowed unused args must match /^_/u.
- 第 182 行: `node` - 'node' is defined but never used. Allowed unused args must match /^_/u.
- 第 183 行: `node` - 'node' is defined but never used. Allowed unused args must match /^_/u.
- 第 184 行: `node` - 'node' is defined but never used. Allowed unused args must match /^_/u.
- 第 185 行: `node` - 'node' is defined but never used. Allowed unused args must match /^_/u.
- 第 186 行: `node` - 'node' is defined but never used. Allowed unused args must match /^_/u.
- 第 187 行: `node` - 'node' is defined but never used. Allowed unused args must match /^_/u.
- 第 188 行: `node` - 'node' is defined but never used. Allowed unused args must match /^_/u.
- 第 189 行: `node` - 'node' is defined but never used. Allowed unused args must match /^_/u.
- 第 190 行: `node` - 'node' is defined but never used. Allowed unused args must match /^_/u.
- 第 191 行: `node` - 'node' is defined but never used. Allowed unused args must match /^_/u.
- 第 192 行: `node` - 'node' is defined but never used. Allowed unused args must match /^_/u.
- 第 193 行: `node` - 'node' is defined but never used. Allowed unused args must match /^_/u.


### src/components/AICollaborationPanel.tsx
- 第 6 行: `ChatMessage` - 'ChatMessage' is defined but never used.
- 第 6 行: `AIResponse` - 'AIResponse' is defined but never used.
- 第 7 行: `Conversation` - 'Conversation' is defined but never used.
- 第 18 行: `VoiceOutputButton` - 'VoiceOutputButton' is defined but never used.
- 第 49 行: `isTyping` - 'isTyping' is assigned a value but never used. Allowed unused vars must match /^_/u.
- 第 60 行: `llmHealth` - 'llmHealth' is assigned a value but never used. Allowed unused vars must match /^_/u.
- 第 2045 行: `formatTime` - 'formatTime' is assigned a value but never used. Allowed unused vars must match /^_/u.


### src/components/AIMessageActions.tsx
- 第 43 行: `index` - 'index' is defined but never used. Allowed unused args must match /^_/u.


### src/components/AIResultManager.tsx
- 第 2 行: `AnimatePresence` - 'AnimatePresence' is defined but never used.


### src/components/AIReview.tsx
- 第 64 行: `theme` - 'theme' is assigned a value but never used. Allowed unused vars must match /^_/u.
- 第 176 行: `suggestion` - 'suggestion' is defined but never used. Allowed unused args must match /^_/u.
- 第 190 行: `COLORS` - 'COLORS' is assigned a value but never used. Allowed unused vars must match /^_/u.


### src/components/AISuggestionBox.tsx
- 第 45 行: `err` - 'err' is defined but never used.


### src/components/AchievementBadge.tsx
- 第 9 行: `isDark` - 'isDark' is assigned a value but never used. Allowed unused vars must match /^_/u.


### src/components/AchievementMuseum/components/AchievementCard.tsx
- 第 3 行: `Star` - 'Star' is defined but never used.


### src/components/AchievementMuseum/components/AchievementDetail.tsx
- 第 8 行: `Trophy` - 'Trophy' is defined but never used.
- 第 10 行: `ChevronRight` - 'ChevronRight' is defined but never used.


### src/components/AchievementMuseum/components/LeftSidebar.tsx
- 第 14 行: `ChevronRight` - 'ChevronRight' is defined but never used.
- 第 15 行: `Trophy` - 'Trophy' is defined but never used.
- 第 20 行: `AchievementRarity` - 'AchievementRarity' is defined but never used.
- 第 21 行: `AchievementCategory` - 'AchievementCategory' is defined but never used.


### src/components/AchievementMuseum/components/MainContent.tsx
- 第 5 行: `Trophy` - 'Trophy' is defined but never used.
- 第 9 行: `ChevronDown` - 'ChevronDown' is defined but never used.
- 第 11 行: `SlidersHorizontal` - 'SlidersHorizontal' is defined but never used.
- 第 20 行: `CreatorLevel` - 'CreatorLevel' is defined but never used.
- 第 42 行: `achievements` - 'achievements' is defined but never used. Allowed unused args must match /^_/u.


### src/components/AchievementMuseum/components/RightSidebar.tsx
- 第 6 行: `Trophy` - 'Trophy' is defined but never used.
- 第 7 行: `Star` - 'Star' is defined but never used.
- 第 9 行: `TrendingUp` - 'TrendingUp' is defined but never used.
- 第 10 行: `Award` - 'Award' is defined but never used.
- 第 13 行: `Medal` - 'Medal' is defined but never used.
- 第 17 行: `Flame` - 'Flame' is defined but never used.
- 第 37 行: `creatorLevels` - 'creatorLevels' is defined but never used. Allowed unused args must match /^_/u.


### src/components/AchievementMuseum/components/StatsPanel.tsx
- 第 7 行: `Clock` - 'Clock' is defined but never used.
- 第 9 行: `Award` - 'Award' is defined but never used.
- 第 10 行: `Star` - 'Star' is defined but never used.


### src/components/AchievementMuseum/hooks/useAchievements.ts
- 第 287 行: `err` - 'err' is defined but never used.


### src/components/ActivityTimeline.tsx
- 第 8 行: `Image` - 'Image' is defined but never used.


### src/components/AdminRoute.tsx
- 第 1 行: `useEffect` - 'useEffect' is defined but never used.
- 第 1 行: `useState` - 'useState' is defined but never used.


### src/components/AdvancedTagFilter.tsx
- 第 2 行: `AnimatePresence` - 'AnimatePresence' is defined but never used.


### src/components/AnalyticsDashboard.tsx
- 第 602 行: `isDark` - 'isDark' is assigned a value but never used. Allowed unused vars must match /^_/u.


### src/components/ChallengeCenter.tsx
- 第 7 行: `LazyImage` - 'LazyImage' is defined but never used.


### src/components/ChatMessageWithMentions.tsx
- 第 11 行: `MentionNotification` - 'MentionNotification' is defined but never used.
- 第 61 行: `handleKeyDown` - 'handleKeyDown' is assigned a value but never used. Allowed unused vars must match /^_/u.


### src/components/Chat/PrivateChatWindow.tsx
- 第 108 行: `e` - 'e' is defined but never used.


### src/components/CollaborativeEditor.tsx
- 第 53 行: `theme` - 'theme' is assigned a value but never used. Allowed unused vars must match /^_/u.
- 第 60 行: `lastTypingTime` - 'lastTypingTime' is assigned a value but never used. Allowed unused vars must match /^_/u.


### src/components/CommandPalette.tsx
- 第 1 行: `useCallback` - 'useCallback' is defined but never used.


### src/components/CommentWithMentions.tsx
- 第 11 行: `mentionService` - 'mentionService' is defined but never used.


### src/components/CommunityApplicationReview.tsx
- 第 7 行: `toast` - 'toast' is defined but never used.
- 第 9 行: `CardHeader` - 'CardHeader' is defined but never used.
- 第 9 行: `CardTitle` - 'CardTitle' is defined but never used.
- 第 23 行: `DropdownMenu` - 'DropdownMenu' is defined but never used.
- 第 24 行: `DropdownMenuContent` - 'DropdownMenuContent' is defined but never used.
- 第 25 行: `DropdownMenuItem` - 'DropdownMenuItem' is defined but never used.
- 第 26 行: `DropdownMenuTrigger` - 'DropdownMenuTrigger' is defined but never used.
- 第 33 行: `MoreVertical` - 'MoreVertical' is defined but never used.


### src/components/CommunityChat.tsx
- 第 47 行: `currentUser` - 'currentUser' is defined but never used. Allowed unused args must match /^_/u.
- 第 110 行: `id` - 'id' is defined but never used. Allowed unused args must match /^_/u.
- 第 134 行: `id` - 'id' is defined but never used. Allowed unused args must match /^_/u.
- 第 134 行: `emoji` - 'emoji' is defined but never used. Allowed unused args must match /^_/u.


### src/components/CommunityInviteDialog.tsx
- 第 62 行: `error` - 'error' is defined but never used.


### src/components/CommunityInviteMessage.tsx
- 第 28 行: `inviterAvatar` - 'inviterAvatar' is defined but never used. Allowed unused args must match /^_/u.
- 第 30 行: `inviteCode` - 'inviteCode' is defined but never used. Allowed unused args must match /^_/u.
- 第 31 行: `inviteLink` - 'inviteLink' is defined but never used. Allowed unused args must match /^_/u.
- 第 48 行: `error` - 'error' is defined but never used.


### src/components/CommunityInviteSettings.tsx
- 第 7 行: `toast` - 'toast' is defined but never used.


### src/components/CommunityManagement.tsx
- 第 12 行: `UserX` - 'UserX' is defined but never used.
- 第 17 行: `Clock` - 'Clock' is defined but never used.
- 第 18 行: `MoreVertical` - 'MoreVertical' is defined but never used.
- 第 19 行: `ChevronDown` - 'ChevronDown' is defined but never used.
- 第 20 行: `ChevronUp` - 'ChevronUp' is defined but never used.
- 第 21 行: `LinkIcon` - 'LinkIcon' is defined but never used.
- 第 23 行: `RefreshCw` - 'RefreshCw' is defined but never used.
- 第 24 行: `Filter` - 'Filter' is defined but never used.
- 第 25 行: `Download` - 'Download' is defined but never used.
- 第 30 行: `EyeOff` - 'EyeOff' is defined but never used.
- 第 35 行: `ImageIcon` - 'ImageIcon' is defined but never used.
- 第 36 行: `Send` - 'Send' is defined but never used.
- 第 37 行: `History` - 'History' is defined but never used.
- 第 44 行: `TrendingUp` - 'TrendingUp' is defined but never used.
- 第 45 行: `TrendingDown` - 'TrendingDown' is defined but never used.
- 第 46 行: `MoreHorizontal` - 'MoreHorizontal' is defined but never used.
- 第 48 行: `LogOut` - 'LogOut' is defined but never used.
- 第 322 行: `loading` - 'loading' is assigned a value but never used. Allowed unused vars must match /^_/u.
- 第 659 行: `result` - 'result' is assigned a value but never used. Allowed unused vars must match /^_/u.


### src/components/Community/Admin/AnalyticsView.tsx
- 第 2 行: `AnimatePresence` - 'AnimatePresence' is defined but never used.
- 第 4 行: `BarChart3` - 'BarChart3' is defined but never used.
- 第 8 行: `Calendar` - 'Calendar' is defined but never used.
- 第 10 行: `Filter` - 'Filter' is defined but never used.
- 第 15 行: `Clock` - 'Clock' is defined but never used.
- 第 18 行: `Share2` - 'Share2' is defined but never used.
- 第 22 行: `LineChart` - 'LineChart' is defined but never used.
- 第 23 行: `Line` - 'Line' is defined but never used.
- 第 33 行: `Legend` - 'Legend' is defined but never used.


### src/components/Community/Admin/CommunityAdminPanel.tsx
- 第 17 行: `XCircle` - 'XCircle' is defined but never used.
- 第 20 行: `ChevronLeft` - 'ChevronLeft' is defined but never used.
- 第 21 行: `BarChart3` - 'BarChart3' is defined but never used.
- 第 110 行: `onAddMember` - 'onAddMember' is defined but never used. Allowed unused args must match /^_/u.
- 第 111 行: `onRemoveMember` - 'onRemoveMember' is defined but never used. Allowed unused args must match /^_/u.
- 第 112 行: `onUpdateMemberRole` - 'onUpdateMemberRole' is defined but never used. Allowed unused args must match /^_/u.
- 第 140 行: `selectedMembers` - 'selectedMembers' is assigned a value but never used. Allowed unused vars must match /^_/u.
- 第 140 行: `setSelectedMembers` - 'setSelectedMembers' is assigned a value but never used. Allowed unused vars must match /^_/u.
- 第 141 行: `isBatchMode` - 'isBatchMode' is assigned a value but never used. Allowed unused vars must match /^_/u.
- 第 141 行: `setIsBatchMode` - 'setIsBatchMode' is assigned a value but never used. Allowed unused vars must match /^_/u.
- 第 145 行: `editingAnnouncementId` - 'editingAnnouncementId' is assigned a value but never used. Allowed unused vars must match /^_/u.
- 第 145 行: `setEditingAnnouncementId` - 'setEditingAnnouncementId' is assigned a value but never used. Allowed unused vars must match /^_/u.
- 第 1064 行: `isLoadingActivities` - 'isLoadingActivities' is assigned a value but never used. Allowed unused vars must match /^_/u.


### src/components/Community/Admin/RightSidebar.tsx
- 第 53 行: `onQuickAction` - 'onQuickAction' is defined but never used. Allowed unused args must match /^_/u.


### src/components/Community/Announcements/AnnouncementsSection.tsx
- 第 5 行: `User` - 'User' is defined but never used.


### src/components/Community/ChatInterface.tsx
- 第 232 行: `e` - 'e' is defined but never used.
- 第 321 行: `e` - 'e' is defined but never used.


### src/components/Community/CommunityInfoSidebar.tsx
- 第 18 行: `ChevronUp` - 'ChevronUp' is defined but never used.
- 第 22 行: `MoreHorizontal` - 'MoreHorizontal' is defined but never used.
- 第 26 行: `CheckCircle2` - 'CheckCircle2' is defined but never used.
- 第 27 行: `Clock` - 'Clock' is defined but never used.
- 第 28 行: `AlertCircle` - 'AlertCircle' is defined but never used.
- 第 272 行: `members` - 'members' is assigned a value but never used. Allowed unused args must match /^_/u.
- 第 276 行: `admins` - 'admins' is assigned a value but never used. Allowed unused args must match /^_/u.
- 第 552 行: `index` - 'index' is defined but never used. Allowed unused args must match /^_/u.
- 第 628 行: `index` - 'index' is defined but never used. Allowed unused args must match /^_/u.
- 第 653 行: `error` - 'error' is defined but never used.


### src/components/Community/CommunityLayout.tsx
- 第 25 行: `search` - 'search' is defined but never used. Allowed unused args must match /^_/u.
- 第 26 行: `setSearch` - 'setSearch' is defined but never used. Allowed unused args must match /^_/u.


### src/components/Community/CommunityNavigation.tsx
- 第 1 行: `useMemo` - 'useMemo' is defined but never used.


### src/components/Community/CommunitySidebar.tsx
- 第 1 行: `useEffect` - 'useEffect' is defined but never used.


### src/components/Community/DesignSystem/CommunityAnimations.tsx
- 第 6 行: `communityAnimations` - 'communityAnimations' is defined but never used.


### src/components/Community/Feed/FeedSection.tsx
- 第 1 行: `useMemo` - 'useMemo' is defined but never used.
- 第 2 行: `AnimatePresence` - 'AnimatePresence' is defined but never used.


### src/components/Community/Feed/PostCard.tsx
- 第 7 行: `FadeIn` - 'FadeIn' is defined but never used.
- 第 500 行: `showShareMenu` - 'showShareMenu' is assigned a value but never used. Allowed unused vars must match /^_/u.
- 第 599 行: `e` - 'e' is defined but never used. Allowed unused args must match /^_/u.
- 第 710 行: `e` - 'e' is defined but never used. Allowed unused args must match /^_/u.


### src/components/Community/FriendRequests.tsx
- 第 4 行: `User` - 'User' is defined but never used.


### src/components/Community/Members/MembersSection.tsx
- 第 47 行: `getRoleIcon` - 'getRoleIcon' is assigned a value but never used. Allowed unused vars must match /^_/u.
- 第 60 行: `getRoleLabel` - 'getRoleLabel' is assigned a value but never used. Allowed unused vars must match /^_/u.


### src/components/Community/Modals/CreateCommunityModal.tsx
- 第 6 行: `FadeIn` - 'FadeIn' is defined but never used.
- 第 7 行: `ScaleIn` - 'ScaleIn' is defined but never used.
- 第 8 行: `StaggerContainer` - 'StaggerContainer' is defined but never used.
- 第 9 行: `StaggerItem` - 'StaggerItem' is defined but never used.
- 第 10 行: `AnimatedButton` - 'AnimatedButton' is defined but never used.
- 第 12 行: `communityColors` - 'communityColors' is defined but never used.
- 第 12 行: `communityShadows` - 'communityShadows' is defined but never used.
- 第 12 行: `communityRadius` - 'communityRadius' is defined but never used.
- 第 134 行: `error` - 'error' is defined but never used.
- 第 151 行: `error` - 'error' is defined but never used.


### src/components/Community/Modals/CreatePostModal.tsx
- 第 6 行: `AnimatePresence` - 'AnimatePresence' is defined but never used.
- 第 10 行: `CommunityMember` - 'CommunityMember' is defined but never used.
- 第 11 行: `toast` - 'toast' is defined but never used.
- 第 51 行: `selectedVideos` - 'selectedVideos' is assigned a value but never used. Allowed unused vars must match /^_/u.
- 第 53 行: `selectedAudios` - 'selectedAudios' is assigned a value but never used. Allowed unused vars must match /^_/u.
- 第 155 行: `handleImageChange` - 'handleImageChange' is assigned a value but never used. Allowed unused vars must match /^_/u.
- 第 178 行: `handleRemoveImage` - 'handleRemoveImage' is assigned a value but never used. Allowed unused vars must match /^_/u.


### src/components/Community/Moderation/ModerationPanel.tsx
- 第 1 行: `useEffect` - 'useEffect' is defined but never used.
- 第 55 行: `communityId` - 'communityId' is defined but never used. Allowed unused args must match /^_/u.
- 第 56 行: `isAdmin` - 'isAdmin' is defined but never used. Allowed unused args must match /^_/u.
- 第 84 行: `getCurrentContent` - 'getCurrentContent' is assigned a value but never used. Allowed unused vars must match /^_/u.


### src/components/Community/Notification/NotificationCenter.tsx
- 第 2 行: `AnimatePresence` - 'AnimatePresence' is defined but never used.


</details>

## 修复建议

### 自动修复
可以运行以下命令自动修复部分未使用导入：

```bash
pnpm exec eslint "src/**/*.{ts,tsx}" --fix
```

### 注意事项
1. **副作用导入**: 某些导入可能有副作用（如 CSS 导入、polyfill），不能简单删除
2. **类型导入**: TypeScript 类型导入可能在编译后消失，但在开发中需要
3. **动态使用**: 某些导入可能在字符串动态调用中使用，静态检查无法识别

## 后续建议

1. 在 CI/CD 流程中加入未使用导入检查
2. 配置 pre-commit 钩子自动检查
3. 定期执行清理保持代码整洁
