import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCommunityLogic } from '../useCommunityLogic';
const CREATOR_COMMUNITY_ID = 'creator-community';
import { AuthProvider } from '@/contexts/authContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import '@testing-library/jest-dom';

// Mock dependencies
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
  },
}));

jest.mock('@/services/apiService', () => ({
  apiService: {
    upvoteThread: jest.fn().mockResolvedValue({ success: true }),
    unfavoriteThread: jest.fn().mockResolvedValue({ success: true }),
    favoriteThread: jest.fn().mockResolvedValue({ success: true }),
    addComment: jest.fn().mockResolvedValue({ 
      id: 'comment-1',
      content: 'Test comment',
      created_at: new Date().toISOString()
    }),
    upvoteComment: jest.fn().mockResolvedValue({ success: true }),
    createThread: jest.fn().mockResolvedValue({ 
      id: 'thread-1',
      title: 'Test thread',
      content: 'Test content',
      communityId: CREATOR_COMMUNITY_ID,
      authorId: 'user-1',
      createdAt: Date.now()
    }),
  },
  communityService: {
    getCommunity: jest.fn().mockResolvedValue({
      id: CREATOR_COMMUNITY_ID,
      name: '津脉社区',
      description: '天津文化创作者的专属社区',
      memberCount: 12345,
      topic: '文化创作',
      avatar: 'https://example.com/avatar.png',
      isActive: true,
      isSpecial: true,
      theme: {
        primaryColor: '#1E40AF',
        secondaryColor: '#3B82F6',
        backgroundColor: '#F3F4F6',
        textColor: '#1F2937'
      },
      layoutType: 'standard',
      enabledModules: {
        posts: true,
        chat: true,
        members: true,
        announcements: true
      }
    }),
    getCommunities: jest.fn().mockResolvedValue([
      {
        id: CREATOR_COMMUNITY_ID,
        name: '津脉社区',
        description: '天津文化创作者的专属社区',
        memberCount: 12345,
        topic: '文化创作',
        avatar: 'https://example.com/avatar.png',
        isActive: true,
        isSpecial: true,
        theme: {
          primaryColor: '#1E40AF',
          secondaryColor: '#3B82F6',
          backgroundColor: '#F3F4F6',
          textColor: '#1F2937'
        },
        layoutType: 'standard',
        enabledModules: {
          posts: true,
          chat: true,
          members: true,
          announcements: true
        }
      },
      {
        id: 'community-1',
        name: '设计爱好者',
        description: '分享设计技巧，交流创作经验',
        memberCount: 5678,
        topic: '设计',
        avatar: 'https://example.com/design-avatar.png',
        isActive: true,
        isSpecial: false,
        theme: {
          primaryColor: '#7E22CE',
          secondaryColor: '#A855F7',
          backgroundColor: '#F9FAFB',
          textColor: '#1F2937'
        },
        layoutType: 'standard',
        enabledModules: {
          posts: true,
          chat: true,
          members: true,
          announcements: true
        }
      }
    ]),
    joinCommunity: jest.fn().mockResolvedValue({ success: true }),
    leaveCommunity: jest.fn().mockResolvedValue({ success: true }),
    createCommunity: jest.fn().mockResolvedValue({
      id: 'new-community',
      name: '新社群',
      description: '新创建的社群',
      memberCount: 1,
      topic: '测试',
      avatar: 'https://example.com/new-community.png',
      isActive: true,
      isSpecial: false,
      theme: {
        primaryColor: '#1E40AF',
        secondaryColor: '#3B82F6',
        backgroundColor: '#F3F4F6',
        textColor: '#1F2937'
      },
      layoutType: 'standard',
      enabledModules: {
        posts: true,
        chat: true,
        members: true,
        announcements: true
      }
    })
  },
}));

jest.mock('@/services/websocketService', () => ({
  websocketService: {
    connect: jest.fn(),
    disconnect: jest.fn(),
    on: jest.fn(),
  },
}));

jest.mock('@/services/recommendationService', () => ({
  __esModule: true,
  default: {
    recordUserAction: jest.fn(),
    getRecommendations: jest.fn().mockReturnValue([]),
  },
}));

jest.mock('@/stores/chatStore', () => ({
  useChatStore: jest.fn().mockReturnValue({
    messages: [],
    sendMessage: jest.fn().mockResolvedValue({ success: true }),
    setActiveChannel: jest.fn(),
    subscribeToChannel: jest.fn(),
    fetchMessages: jest.fn().mockResolvedValue([]),
  }),
}));

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    },
    removeItem: (key: string) => {
      delete store[key];
    },
  };
})();

Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

// Test wrapper component
const TestWrapper = function({ children }: { children: React.ReactNode }) {
  return React.createElement(
    AuthProvider,
    null,
    React.createElement(
      NotificationProvider,
      null,
      children
    )
  );
};

describe('useCommunityLogic', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Reset all mocks
    jest.clearAllMocks();
    
    // Set default auth state
    localStorage.setItem('token', 'mock-token');
    localStorage.setItem('user', JSON.stringify({
      id: 'user-1',
      username: 'testuser',
      email: 'test@example.com',
      avatar: 'https://example.com/user-avatar.png',
    }));
  });

  test('should initialize with default state', async () => {
    const { result } = renderHook(() => useCommunityLogic(), {
      wrapper: TestWrapper,
    });

    await waitFor(() => {
      expect(result.current.activeCommunityId).toBeNull();
      expect(result.current.activeChannel).toBe('communities');
      expect(result.current.mode).toBe('discovery');
      expect(result.current.joinedCommunities).toEqual([]);
      expect(result.current.threads).toEqual([]);
      expect(result.current.selectedTag).toBe('国潮');
      expect(result.current.favoritedThreads).toEqual([]);
      expect(result.current.search).toBe('');
      expect(result.current.allCommunities).toEqual([]);
    });
  });

  test('should load communities data', async () => {
    const { result } = renderHook(() => useCommunityLogic(), {
      wrapper: TestWrapper,
    });

    await waitFor(() => {
      expect(result.current.allCommunities.length).toBeGreaterThan(0);
    });
  });

  test('should handle upvote thread', async () => {
    const { result } = renderHook(() => useCommunityLogic(), {
      wrapper: TestWrapper,
    });

    // Initialize threads
    act(() => {
      result.current.setThreads([
        {
          id: 'thread-1',
          title: 'Test thread',
          content: 'Test content',
          communityId: CREATOR_COMMUNITY_ID,
          authorId: 'user-2',
          author: 'otheruser',
          createdAt: Date.now(),
          upvotes: 5,
          replies: [],
        },
      ]);
    });

    // Upvote thread
    await act(async () => {
      await result.current.onUpvote('thread-1');
    });

    // Check if thread was upvoted
    expect(result.current.threads[0].upvotes).toBe(6);
  });

  test('should handle toggle favorite thread', async () => {
    const { result } = renderHook(() => useCommunityLogic(), {
      wrapper: TestWrapper,
    });

    // Toggle favorite
    await act(async () => {
      await result.current.onToggleFavorite('thread-1');
    });

    // Check if thread was favorited
    expect(result.current.favoritedThreads).toContain('thread-1');

    // Toggle unfavorite
    await act(async () => {
      await result.current.onToggleFavorite('thread-1');
    });

    // Check if thread was unfavorited
    expect(result.current.favoritedThreads).not.toContain('thread-1');
  });

  test('should handle add comment', async () => {
    const { result } = renderHook(() => useCommunityLogic(), {
      wrapper: TestWrapper,
    });

    // Initialize threads
    act(() => {
      result.current.setThreads([
        {
          id: 'thread-1',
          title: 'Test thread',
          content: 'Test content',
          communityId: CREATOR_COMMUNITY_ID,
          authorId: 'user-2',
          author: 'otheruser',
          createdAt: Date.now(),
          upvotes: 5,
          replies: [],
        },
      ]);
    });

    // Add comment
    await act(async () => {
      await result.current.onAddComment('thread-1', 'Test comment');
    });

    // Check if comment was added
    expect(result.current.threads[0].comments).toBeDefined();
    expect(result.current.threads[0].comments?.length).toBe(1);
  });

  test('should handle join community', async () => {
    const { result } = renderHook(() => useCommunityLogic(), {
      wrapper: TestWrapper,
    });

    // Wait for communities to load
    await waitFor(() => {
      expect(result.current.allCommunities.length).toBeGreaterThan(0);
    });

    // Join community
    await act(async () => {
      await result.current.onJoinCommunity('community-1');
    });

    // Check if community was joined
    expect(result.current.joinedCommunities.length).toBeGreaterThan(0);
    expect(result.current.joinedCommunities.some(c => c.id === 'community-1')).toBe(true);
  });

  test('should handle create thread', async () => {
    const { result } = renderHook(() => useCommunityLogic(), {
      wrapper: TestWrapper,
    });

    // Set active community
    act(() => {
      result.current.onSelectCommunity(CREATOR_COMMUNITY_ID);
    });

    // Create thread
    await act(async () => {
      await result.current.submitCreateThread({
        title: 'Test thread',
        content: 'Test content',
        topic: '测试',
        contentType: 'text',
      });
    });

    // Check if thread was created
    expect(result.current.threads.length).toBeGreaterThan(0);
  });

  test('should check permission', async () => {
    const { result } = renderHook(() => useCommunityLogic(), {
      wrapper: TestWrapper,
    });

    // Check if user has permission to create post
    const canCreatePost = result.current.checkPermission(CREATOR_COMMUNITY_ID, 'create_post');
    expect(canCreatePost).toBe(true);

    // Check if user has permission to manage posts (should be false for non-admin)
    const canManagePosts = result.current.checkPermission(CREATOR_COMMUNITY_ID, 'manage_posts');
    expect(canManagePosts).toBe(false);
  });

  test('should moderate content', async () => {
    const { result } = renderHook(() => useCommunityLogic(), {
      wrapper: TestWrapper,
    });

    // Test content moderation
    const approvedResult = result.current.contentModeration({ text: 'This is a test message' });
    expect(approvedResult.approved).toBe(true);

    // Test content with sensitive words
    const rejectedResult = result.current.contentModeration({ text: 'This is a 违规 message' });
    expect(rejectedResult.approved).toBe(false);
    expect(rejectedResult.reason).toBe('消息包含敏感词');
  });

  test('should get recommended posts', async () => {
    const { result } = renderHook(() => useCommunityLogic(), {
      wrapper: TestWrapper,
    });

    // Initialize threads
    act(() => {
      result.current.setThreads([
        {
          id: 'thread-1',
          title: 'Test thread 1',
          content: 'Test content 1',
          communityId: CREATOR_COMMUNITY_ID,
          authorId: 'user-2',
          author: 'otheruser',
          createdAt: Date.now(),
          upvotes: 10,
          replies: [],
        },
        {
          id: 'thread-2',
          title: 'Test thread 2',
          content: 'Test content 2',
          communityId: CREATOR_COMMUNITY_ID,
          authorId: 'user-2',
          author: 'otheruser',
          createdAt: Date.now(),
          upvotes: 5,
          replies: [],
        },
      ]);
    });

    // Get recommended posts
    const recommendedPosts = result.current.getRecommendedPosts(CREATOR_COMMUNITY_ID, 1);
    expect(recommendedPosts.length).toBe(1);
    expect(recommendedPosts[0]?.id).toBe('thread-1'); // Should return the post with more upvotes
  });
});
