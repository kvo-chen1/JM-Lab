import React, { lazy, Suspense } from 'react';
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
import { useCommunityLogic } from '@/hooks/useCommunityLogic';

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
export type { Community } from '@/data/mockCommunities';

const LoadingFallback = () => (
  <div className="flex items-center justify-center h-full w-full">
    <div className="w-8 h-8 border-4 border-t-blue-500 border-gray-300 rounded-full animate-spin"></div>
  </div>
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
    activeCommunity,
    isCreatePostOpen,
    setIsCreatePostOpen,
    isCreateCommunityOpen,
    setIsCreateCommunityOpen
  } = useCommunityLogic();

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
        activeCommunity ? (
            <CommunityInfoSidebar
            isDark={isDark}
            community={activeCommunity}
            onlineCount={12} // Mock
            />
        ) : undefined
      }
    >
      <Suspense fallback={<LoadingFallback />}>
        {mode === 'discovery' ? (
          activeChannel === 'communities' ? (
            <DiscoverySection 
                isDark={isDark}
                communities={allCommunities}
                joinedIds={joinedCommunities.map(c => c.id)}
                onJoin={onJoinCommunity}
                onOpen={(c) => onSelectCommunity(c.id)} // Or maybe show details modal first
                userTags={selectedTag ? [selectedTag] : []} // 使用当前选中的标签作为用户兴趣标签
            />
          ) : (
          <FeedSection
            isDark={isDark}
            threads={threads}
            onUpvote={onUpvote}
            onToggleFavorite={onToggleFavorite}
            onOpenThread={(id) => console.log('Open thread', id)}
            onCreateThread={onCreateThread}
            isThreadFavorited={isThreadFavorited}
          />
          )
        ) : (
           activeChannel === 'general' || activeChannel === 'chat' ? (
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
                    threads={threads}
                    onUpvote={onUpvote}
                    onToggleFavorite={onToggleFavorite}
                    onOpenThread={(id) => console.log('Open thread', id)}
                    onCreateThread={onCreateThread}
                    isThreadFavorited={isThreadFavorited}
               />
           )
        )}
      </Suspense>
    </CommunityLayout>

    {/* Modals */}
    <CreatePostModal 
        isOpen={isCreatePostOpen}
        onClose={() => setIsCreatePostOpen(false)}
        onSubmit={submitCreateThread}
        isDark={isDark}
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
