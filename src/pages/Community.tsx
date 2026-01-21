import React, { lazy, Suspense, useMemo } from 'react';
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
import { useCommunityLogic, CREATOR_COMMUNITY_ID } from '@/hooks/useCommunityLogic';
import { motion } from 'framer-motion';

const CreatorSection = lazy(() => import('@/components/Community/Creator/CreatorSection'));

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

const LoadingFallback = () => (
  <div className="flex items-center justify-center h-full w-full min-h-[500px]">
    <div className="w-10 h-10 border-4 border-t-blue-500 border-gray-300 rounded-full animate-spin"></div>
  </div>
);

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

export default function CommunityPage() {
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
      setIsCreateCommunityOpen
    } = useCommunityLogic();

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
        />
      }
      infoSidebar={
        activeCommunity && activeCommunityId !== CREATOR_COMMUNITY_ID ? (
            <CommunityInfoSidebar
            isDark={isDark}
            community={activeCommunity}
            onlineCount={12} // Mock
            isJoined={joinedCommunities.some(c => c.id === activeCommunityId)}
            onJoinCommunity={onJoinCommunity}
            />
        ) : undefined
      }
      activeCommunity={activeCommunity} // 传递活跃社群信息，用于自定义风格
    >
      <Suspense fallback={<LoadingFallback />}>
        <PageTransition>
          {activeCommunityId === CREATOR_COMMUNITY_ID ? (
             <CreatorSection currentUser={user} />
          ) : mode === 'discovery' ? (
            activeChannel === 'communities' ? (
              <DiscoverySection 
                  isDark={isDark}
                  communities={allCommunities}
                  joinedIds={joinedCommunities.map(c => c.id)}
                  onJoin={onJoinCommunity}
                  onOpen={onSelectCommunity}
                  userTags={selectedTag ? [selectedTag] : []}
              />
            ) : (
            <FeedSection
              isDark={isDark}
              threads={filteredThreads}
              onUpvote={onUpvote}
              onToggleFavorite={onToggleFavorite}
              onAddComment={onAddComment}
              onOpenThread={(id) => console.log('Open thread', id)}
              onCreateThread={onCreateThread}
              isThreadFavorited={isThreadFavorited}
              activeCommunity={activeCommunity} // 传递活跃社群信息，用于自定义风格
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
                      onCreateThread={onCreateThread}
                      isThreadFavorited={isThreadFavorited}
                      activeCommunity={activeCommunity} // 传递活跃社群信息，用于自定义风格
                 />
             )
          )}
        </PageTransition>
      </Suspense>
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
    </>
  );
}
