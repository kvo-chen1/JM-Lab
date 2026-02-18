# 津脉广场作品分享功能

## 功能概述

本模块实现了"津脉广场"作品私信分享功能，允许用户将其创作的作品通过私信方式分享给平台上的其他用户。

## 核心功能

### 1. 作品选择界面 (WorkSelector)
- 展示用户的所有作品
- 支持按状态筛选（全部/已发布/草稿）
- 支持按标题搜索
- 网格布局展示作品缩略图
- 选中状态可视化反馈

### 2. 用户搜索与选择 (UserSearch)
- 展示好友列表
- 支持按用户名搜索
- 优先显示最近聊天的好友
- 选中状态可视化反馈

### 3. 私信编辑区域 (MessageEditor)
- 多行文本输入
- 字符计数和限制提示
- 支持表情和附件（预留接口）
- Markdown 格式支持提示

### 4. 作品预览 (WorkPreview)
- 紧凑模式和完整模式
- 展示作品缩略图、标题、类型
- 显示浏览量和点赞数

### 5. 发送状态反馈
- 发送中状态显示
- 成功/失败提示
- 自动关闭模态框

### 6. 已读状态提示
- 通过 `work_shares` 表记录已读状态
- 支持标记已读和获取未读数量

### 7. 隐私保护
- 行级安全策略 (RLS) 限制数据访问
- 用户只能查看自己发送或接收的分享
- 草稿作品分享限制

## 组件使用示例

### 基本使用

```tsx
import { WorkShareModal } from '@/components/share';

function MyComponent() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsModalOpen(true)}>
        分享作品
      </button>

      <WorkShareModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
```

### 预选中作品

```tsx
import { WorkShareModal } from '@/components/share';
import type { Work } from '@/types/work';

function WorkDetail({ work }: { work: Work }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsModalOpen(true)}>
        分享给好友
      </button>

      <WorkShareModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        preselectedWork={work}
      />
    </>
  );
}
```

### 在私信中显示分享的作品

```tsx
import { SharedWorkMessage } from '@/components/share/SharedWorkMessage';

function MessageBubble({ message }) {
  // 解析消息中的作品分享
  const isWorkShare = message.content.includes('📎 **分享了作品**');

  if (isWorkShare) {
    // 提取作品信息（实际使用时可能需要更完善的解析逻辑）
    const workId = extractWorkId(message.content);
    const workTitle = extractWorkTitle(message.content);

    return (
      <SharedWorkMessage
        workId={workId}
        workTitle={workTitle}
        workThumbnail={message.workThumbnail}
        workType={message.workType}
        message={message.personalMessage}
        senderName={message.senderName}
      />
    );
  }

  return <div>{message.content}</div>;
}
```

## 数据库表结构

### work_shares 表

```sql
CREATE TABLE work_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    work_id UUID NOT NULL,
    work_title TEXT NOT NULL,
    work_thumbnail TEXT,
    work_type TEXT,
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);
```

## API 服务

### workShareService

```typescript
import {
  sendWorkShareMessage,
  getReceivedWorkShares,
  getSentWorkShares,
  markWorkShareAsRead,
  getUnreadWorkShareCount,
  deleteWorkShare,
} from '@/services/workShareService';

// 发送作品分享
const result = await sendWorkShareMessage({
  senderId: 'user-id',
  receiverId: 'friend-id',
  workId: 'work-id',
  workTitle: '作品标题',
  workThumbnail: 'thumbnail-url',
  workType: 'image',
  message: '附言消息（可选）',
});

// 获取收到的分享
const received = await getReceivedWorkShares('user-id');

// 获取发送的分享
const sent = await getSentWorkShares('user-id');

// 标记已读
await markWorkShareAsRead('share-id', 'user-id');

// 获取未读数量
const count = await getUnreadWorkShareCount('user-id');
```

## 安全考虑

1. **行级安全策略 (RLS)**
   - 用户只能查看自己发送或接收的分享记录
   - 用户只能标记自己接收的分享为已读
   - 用户只能删除自己参与（发送或接收）的分享

2. **数据验证**
   - 验证作品存在且可访问
   - 草稿作品只能由作者分享
   - 验证用户关系（可选）

3. **隐私保护**
   - 分享记录中冗余存储作品标题和缩略图，防止作品删除后信息丢失
   - 私信内容通过现有消息服务发送，继承其安全特性

## 文件结构

```
src/
├── components/share/
│   ├── WorkShareModal.tsx      # 主模态框组件
│   ├── WorkSelector.tsx        # 作品选择组件
│   ├── UserSearch.tsx          # 用户搜索组件
│   ├── WorkPreview.tsx         # 作品预览组件
│   ├── MessageEditor.tsx       # 消息编辑器组件
│   ├── SharedWorkMessage.tsx   # 分享消息展示组件
│   └── index.ts                # 组件导出
├── services/
│   └── workShareService.ts     # 分享服务
├── types/
│   ├── work.ts                 # 作品类型定义
│   └── user.ts                 # 用户类型定义
└── supabase/migrations/
    └── 20240218000001_create_work_shares.sql  # 数据库迁移
```

## 待优化项

1. **表情选择器**：集成表情选择器组件
2. **附件支持**：支持分享时附加文件
3. **批量分享**：支持同时分享给多个好友
4. **分享统计**：添加分享次数、点击率等统计
5. **撤回功能**：支持在一定时间内撤回分享
6. **富文本编辑**：支持更丰富的消息格式
