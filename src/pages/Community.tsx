import React, { lazy, Suspense, useMemo, useState, useCallback } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { CommunityLayout } from '@/components/Community/CommunityLayout';
import { CommunitySidebar } from '@/components/Community/CommunitySidebar';
import { CommunityNavigation } from '@/components/Community/CommunityNavigation';
import { CommunityInfoSidebar } from '@/components/Community/CommunityInfoSidebar';
import { FeedSection } from '@/components/Community/Feed/FeedSection';
import { ChatSection } from '@/components/Community/Chat/ChatSection';
import { CreatePostModal } from '@/components/Community/Modals/CreatePostModal';
import { CreateCommunityModal } from '@/components/Community/Modals/CreateCommunityModal';
import { DiscoverySection } from '@/components/Community/Discovery/DiscoverySection';
import { NotificationCenter } from '@/components/Community/Notification/NotificationCenter';
import { useCommunityLogic } from '@/hooks/useCommunityLogic';
import { motion } from 'framer-motion';
import CommunityManagement from '@/components/CommunityManagement';
import { CommunitySkeleton } from '@/components/Community/CommunitySkeleton';
import ErrorBoundary from '@/components/ErrorBoundary';

// Export types used in other files
export type Thread = {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  replies: Array<{ id: string; content: string; createdAt: number }>;
  pinned?: boolean;
  topic?: string;
  upvotes?: number;
  images?: Array<string>;
  communityId: string; // 添加社群ID字段，关联到所属社群
  author?: string; // 作者用户名
  authorAvatar?: string; // 作者头像
  authorId?: string; // 作者ID
};

export type ChatMessage = {
    id?: string;
    user: string;
    text: string;
    avatar: string;
    createdAt?: number;
    pinned?: boolean;
    replyTo?: { id: string; user: string; text: string };
    reactions?: Record<string, string[]>;
    username?: string;
    created_at?: string;
    is_pinned?: boolean;
    // 扩展支持多种内容类型
    type?: 'text' | 'image' | 'file' | 'rich_text' | 'emoji';
    // 图片内容
    images?: Array<{
        url: string;
        thumbnail?: string;
        name?: string;
        size?: number;
        width?: number;
        height?: number;
    }>;
    // 文件内容
    files?: Array<{
        url: string;
        name: string;
        size: number;
        type: string;
        progress?: number;
        status?: 'uploading' | 'success' | 'failed' | 'paused';
    }>;
    // 富文本内容
    richContent?: string;
    // 发送状态
    sendStatus?: 'sending' | 'sent' | 'failed';
    // 重试次数
    retryCount?: number;
};

// Re-export Community type from mock data for compatibility
export type { Community } from '@/mock/communities';

const LoadingFallback = () => <CommunitySkeleton />;

// 页面过渡动画组件
const PageTransition = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.2 }}
  >
    {children}
  </motion.div>
);

// 社区页面主组件，集成通知系统
const CommunityPageWithNotifications = React.memo(function CommunityPageWithNotifications() {
  const { isDark } = useTheme();
  const {
      user,
    activeCommunityId,
    activeChannel,
    mode,
    joinedCommunities,
    allCommunities,
    threads,
    messages,
    selectedTag,
    setSelectedTag,
    tags,
    onSelectCommunity,
    onSelectChannel,
    onCreateCommunity,
    onJoinCommunity,
    onDeleteCommunity,
    submitCreateCommunity,
    onUpvote,
    onToggleFavorite,
    onSendMessage,
    retrySendMessage,
    onAddReaction,
    onReplyToMessage,
    isThreadFavorited,
    onCreateThread,
    submitCreateThread,
    onAddComment,
    onCommentUpvote,
    activeCommunity,
    isCreatePostOpen,
    setIsCreatePostOpen,
    isCreateCommunityOpen,
    setIsCreateCommunityOpen,
    search,
    setSearch,
    unreadNotificationCount,
    checkPermission,
    loading,
  } = useCommunityLogic();

  // 通知系统状态
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  
  // 社区管理面板状态
  const [isManagementPanelOpen, setIsManagementPanelOpen] = useState(false);

  // 使用useMemo优化性能，减少不必要的计算
  const filteredThreads = useMemo(() => {
    // 根据当前模式和频道筛选帖子
    if (mode === 'discovery') {
      if (selectedTag) {
        if (selectedTag.startsWith('category:')) {
          // 处理分类筛选
          const category = selectedTag.replace('category:', '');
          // 根据分类名称匹配对应的话题
          const categoryToTopicsMap: Record<string, string[]> = {
            '设计相关': ['设计', 'UI', 'UX', '插画', '3D', '赛博朋克', '极简', '国潮', '非遗'],
            '艺术文化': ['艺术', '文化', '音乐', '摄影', '写作'],
            '科技数码': ['科技', '数码', 'AI', '编程', '互联网'],
            '生活方式': ['生活', '美食', '旅行', '时尚', '健康'],
            '其他': []
          };
          
          const topicsInCategory = categoryToTopicsMap[category] || [];
          return threads.filter(thread => topicsInCategory.includes(thread.topic || ''));
        } else {
          // 单个话题筛选
          return threads.filter(thread => thread.topic === selectedTag);
        }
      }
    }
    // 在社群模式下，threads已经通过useCommunityLogic中的activeThreads筛选过了
    return threads;
  }, [threads, mode, selectedTag]);
  
  // 使用useCallback缓存事件处理函数，减少不必要的重新渲染
  const handleSearchSubmit = useCallback((query: string) => {
    console.log('Search submitted:', query);
    // 可以在这里添加额外的搜索逻辑
  }, []);
  
  const handleOpenManagement = useCallback(() => {
    setIsManagementPanelOpen(true);
  }, []);

  return (
    <>
    <CommunityLayout
      isDark={isDark}
      sidebar={
        <CommunitySidebar
          isDark={isDark}
          joinedCommunities={joinedCommunities}
          activeCommunityId={activeCommunityId}
          onSelectCommunity={onSelectCommunity}
          onCreateCommunity={onCreateCommunity}
          loading={loading.communities}
        />
      }
      navigation={
        <CommunityNavigation
          isDark={isDark}
          mode={mode}
          communityName={activeCommunity?.name}
          activeChannel={activeChannel}
          onSelectChannel={onSelectChannel}
          selectedTag={selectedTag}
          onSelectTag={setSelectedTag}
          tags={tags}
          search={search}
          setSearch={setSearch}
          onSearchSubmit={handleSearchSubmit}
          onOpenManagement={handleOpenManagement}
          hasManagementPermission={activeCommunity?.creatorId === user?.id || user?.role === 'admin'}
        />
      }
      infoSidebar={
        activeCommunity ? (
            <CommunityInfoSidebar
            isDark={isDark}
            community={activeCommunity}
            onlineCount={activeCommunity?.memberCount || 0} // 使用社群成员数作为在线人数
            isJoined={joinedCommunities.some(c => c.id === activeCommunityId)}
            onJoinCommunity={onJoinCommunity}
            // isAdmin={activeCommunityId ? checkPermission(activeCommunityId, 'manage_community') : false}
            isAdmin={activeCommunityId && typeof checkPermission === 'function' ? checkPermission(activeCommunityId, 'manage_community') : false}
            />
        ) : undefined
      }
      activeCommunity={activeCommunity} // 传递活跃社群信息，用于自定义风格
      search={search}
      setSearch={setSearch}
      user={user} // 传递用户信息，用于通知系统
      unreadNotificationCount={unreadNotificationCount}
    >
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
        <PageTransition>
          {mode === 'discovery' ? (
            activeChannel === 'communities' ? (
              <DiscoverySection 
                  isDark={isDark}
                  communities={allCommunities}
                  joinedIds={joinedCommunities.map(c => c.id)}
                  onJoin={onJoinCommunity}
                  onOpen={onSelectCommunity}
                  userTags={selectedTag ? [selectedTag] : []}
                  search={search}
                  setSearch={setSearch}
              />
            ) : (
            <FeedSection
              isDark={isDark}
              threads={filteredThreads}
              onUpvote={onUpvote}
              onToggleFavorite={onToggleFavorite}
              onAddComment={onAddComment}
              onOpenThread={(id) => console.log('Open thread', id)}
              onViewThread={(id) => console.log('View thread', id)}
              onCreateThread={onCreateThread}
              isThreadFavorited={isThreadFavorited}
              activeCommunity={activeCommunity} // 传递活跃社群信息，用于自定义风格
              user={user} // 传递用户信息，用于显示头像
              loading={loading.threads} // 传递帖子加载状态
            />
            )
          ) : (
             activeChannel === 'chat' ? (
                  <ChatSection
                      isDark={isDark}
                      channelName={activeChannel}
                      messages={messages}
                      onSendMessage={onSendMessage}
                      retrySendMessage={retrySendMessage}
                      onAddReaction={onAddReaction}
                      onReplyToMessage={onReplyToMessage}
                      currentUser={{ name: user?.username || 'Guest' }}
                  />
             ) : (
                 /* Default to Feed for other channels for now, or specific components */
                 <FeedSection
                      isDark={isDark}
                      threads={filteredThreads}
                      onUpvote={onUpvote}
                      onToggleFavorite={onToggleFavorite}
                      onAddComment={onAddComment}
                      onOpenThread={(id) => console.log('Open thread', id)}
                      onViewThread={(id) => console.log('View thread', id)}
                      onCreateThread={onCreateThread}
                      isThreadFavorited={isThreadFavorited}
                      activeCommunity={activeCommunity} // 传递活跃社群信息，用于自定义风格
                      user={user} // 传递用户信息，用于显示头像
                      loading={loading.threads} // 传递帖子加载状态
                 />
             )
          )}
        </PageTransition>
        </Suspense>
      </ErrorBoundary>
    </CommunityLayout>

    

    {/* Modals */}
    <CreatePostModal 
        isOpen={isCreatePostOpen}
        onClose={() => setIsCreatePostOpen(false)}
        onSubmit={submitCreateThread}
        isDark={isDark}
        topics={tags}
        joinedCommunities={joinedCommunities}
        activeCommunityId={activeCommunityId}
    />
    <CreateCommunityModal
        isOpen={isCreateCommunityOpen}
        onClose={() => setIsCreateCommunityOpen(false)}
        onSubmit={submitCreateCommunity}
        isDark={isDark}
    />
    
    {/* 社区管理面板 */}
    {isManagementPanelOpen && activeCommunity && (
      <CommunityManagement
        isOpen={isManagementPanelOpen}
        onClose={() => setIsManagementPanelOpen(false)}
        community={activeCommunity}
        isDark={isDark}
        onDeleteCommunity={() => {
          onDeleteCommunity(activeCommunity.id);
          setIsManagementPanelOpen(false);
        }}
      />
    )}
    </>
  );
});

// 添加displayName便于调试
CommunityPageWithNotifications.displayName = 'CommunityPageWithNotifications';

// 导出社区页面
export default function CommunityPage() {
  return (
    <CommunityPageWithNotifications />
  );
}
