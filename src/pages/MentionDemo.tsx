/**
 * @提及功能演示页面
 * 展示@提及功能在帖子、评论、聊天三种场景下的使用
 */

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { CreatePostWithMentions } from '@/components/CreatePostWithMentions';
import { CommentListWithMentions } from '@/components/CommentWithMentions';
import { ChatMessageWithMentions } from '@/components/ChatMessageWithMentions';
import { MentionNotificationBadge } from '@/components/MentionNotification';
import { toast } from 'sonner';

// 模拟社群ID
const DEMO_COMMUNITY_ID = 'demo-community-123';
const DEMO_POST_ID = 'demo-post-456';
const DEMO_CHANNEL_ID = 'demo-channel-789';
const CURRENT_USER_ID = 'current-user-id';

// 模拟评论数据
const DEMO_COMMENTS = [
  {
    id: '1',
    content: '这个设计很棒！ @张三 你觉得呢？',
    authorId: 'user1',
    authorName: '李四',
    authorAvatar: '',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    likes: 5,
    isLiked: false,
    replies: [
      {
        id: '2',
        content: '我也觉得不错 @李四 谢谢分享！',
        authorId: 'user2',
        authorName: '张三',
        authorAvatar: '',
        createdAt: new Date(Date.now() - 1800000).toISOString(),
        likes: 2,
        isLiked: true,
        parentId: '1',
      },
    ],
  },
  {
    id: '3',
    content: '学到了很多，感谢@管理员 的分享！',
    authorId: 'user3',
    authorName: '王五',
    authorAvatar: '',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    likes: 8,
    isLiked: false,
  },
];

const MentionDemo: React.FC = () => {
  const [comments, setComments] = useState(DEMO_COMMENTS);

  // 处理帖子提交
  const handlePostSubmit = async (post: { content: string; mentionedUserIds: string[] }) => {
    console.log('Post submitted:', post);
    
    // 模拟API调用
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    toast.success(`帖子发布成功！提及了 ${post.mentionedUserIds.length} 位成员`);
  };

  // 处理评论回复
  const handleReply = async (commentId: string, content: string, mentionedUserIds: string[]) => {
    console.log('Reply submitted:', { commentId, content, mentionedUserIds });
    
    // 模拟API调用
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    // 添加新回复到列表
    const newReply = {
      id: Date.now().toString(),
      content,
      authorId: CURRENT_USER_ID,
      authorName: '我',
      authorAvatar: '',
      createdAt: new Date().toISOString(),
      likes: 0,
      isLiked: false,
      parentId: commentId,
    };

    setComments((prev) =>
      prev.map((comment) =>
        comment.id === commentId
          ? { ...comment, replies: [...(comment.replies || []), newReply] }
          : comment
      )
    );
  };

  // 处理点赞
  const handleLike = async (commentId: string) => {
    console.log('Liked comment:', commentId);
    
    // 模拟API调用
    await new Promise((resolve) => setTimeout(resolve, 300));
    
    setComments((prev) =>
      prev.map((comment) => {
        if (comment.id === commentId) {
          return {
            ...comment,
            likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1,
            isLiked: !comment.isLiked,
          };
        }
        // 检查子回复
        if (comment.replies) {
          return {
            ...comment,
            replies: comment.replies.map((reply) =>
              reply.id === commentId
                ? {
                    ...reply,
                    likes: reply.isLiked ? reply.likes - 1 : reply.likes + 1,
                    isLiked: !reply.isLiked,
                  }
                : reply
            ),
          };
        }
        return comment;
      })
    );
  };

  // 处理删除
  const handleDelete = async (commentId: string) => {
    console.log('Delete comment:', commentId);
    
    // 模拟API调用
    await new Promise((resolve) => setTimeout(resolve, 300));
    
    setComments((prev) =>
      prev.filter((comment) => {
        if (comment.id === commentId) return false;
        if (comment.replies) {
          comment.replies = comment.replies.filter((reply) => reply.id !== commentId);
        }
        return true;
      })
    );
    
    toast.success('评论已删除');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 头部 */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              @提及功能演示
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              体验社群互动中的@提及功能
            </p>
          </div>
          <MentionNotificationBadge />
        </div>
      </header>

      {/* 主内容 */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <Tabs defaultValue="post" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="post">发布帖子</TabsTrigger>
            <TabsTrigger value="comment">评论回复</TabsTrigger>
            <TabsTrigger value="chat">聊天会话</TabsTrigger>
          </TabsList>

          {/* 发布帖子 */}
          <TabsContent value="post" className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                场景一：发布帖子时@提及成员
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                在发布新帖子时，使用 @ 符号可以快速提及社群中的成员。
                被提及的成员将收到系统通知。
              </p>
              <CreatePostWithMentions
                communityId={DEMO_COMMUNITY_ID}
                onSubmit={handlePostSubmit}
              />
            </div>

            {/* 功能说明 */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
              <h3 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
                功能特点
              </h3>
              <ul className="list-disc list-inside text-sm text-blue-800 dark:text-blue-400 space-y-1">
                <li>输入 @ 触发成员选择器</li>
                <li>支持通过用户名、昵称搜索成员</li>
                <li>自动插入 @用户名 格式</li>
                <li>被@成员收到实时通知</li>
              </ul>
            </div>
          </TabsContent>

          {/* 评论回复 */}
          <TabsContent value="comment" className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                场景二：评论回复时@提及成员
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                在回复评论时，可以@提及其他成员参与讨论。
                评论中的@提及会以蓝色高亮显示，并可点击查看用户资料。
              </p>
              
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">
                  评论列表
                </h3>
                <CommentListWithMentions
                  communityId={DEMO_COMMUNITY_ID}
                  postId={DEMO_POST_ID}
                  comments={comments}
                  onReply={handleReply}
                  onLike={handleLike}
                  onDelete={handleDelete}
                />
              </div>
            </div>

            {/* 功能说明 */}
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
              <h3 className="font-medium text-green-900 dark:text-green-300 mb-2">
                功能特点
              </h3>
              <ul className="list-disc list-inside text-sm text-green-800 dark:text-green-400 space-y-1">
                <li>评论内容中的@提及自动高亮显示</li>
                <li>点击@提及可跳转到用户主页</li>
                <li>回复时自动填充 @被回复者</li>
                <li>支持嵌套回复和@提及</li>
              </ul>
            </div>
          </TabsContent>

          {/* 聊天会话 */}
          <TabsContent value="chat" className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                场景三：聊天会话时@提及成员
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                在聊天会话中@提及成员，可以吸引特定成员的注意。
                聊天消息中的@提及会根据发送者显示不同的样式。
              </p>
              
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden h-[500px]">
                <ChatMessageWithMentions
                  communityId={DEMO_COMMUNITY_ID}
                  channelId={DEMO_CHANNEL_ID}
                  currentUserId={CURRENT_USER_ID}
                />
              </div>
            </div>

            {/* 功能说明 */}
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6">
              <h3 className="font-medium text-purple-900 dark:text-purple-300 mb-2">
                功能特点
              </h3>
              <ul className="list-disc list-inside text-sm text-purple-800 dark:text-purple-400 space-y-1">
                <li>聊天消息实时显示@提及</li>
                <li>自己的消息@提及显示为浅色</li>
                <li>他人的消息@提及显示为蓝色高亮</li>
                <li>支持实时通知推送</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>

        {/* 底部说明 */}
        <div className="mt-12 p-6 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
            技术实现说明
          </h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-200 mb-1">前端组件</h4>
              <p>MentionInput、MentionSelector、MentionText 等组件实现@提及的输入、选择和显示功能。</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-200 mb-1">后端服务</h4>
              <p>mentionService 提供成员搜索、@提及创建、通知推送等功能，支持实时订阅。</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-200 mb-1">数据库</h4>
              <p>mentions 表存储@提及关系，支持模糊搜索、权限控制和通知状态管理。</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MentionDemo;
