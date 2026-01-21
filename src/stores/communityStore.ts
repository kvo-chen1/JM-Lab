import { create } from 'zustand'
import { communityService } from '../services/communityService'
import { getPosts } from '../lib/api'
import { toast } from 'sonner'
import type { PostWithAuthor, UserProfile, CommentWithAuthor } from '../lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface FriendRequest {
  id: string
  sender_id: string
  receiver_id: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  sender?: UserProfile
  receiver?: UserProfile
}

interface ChatMessage {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  created_at: string
  sender?: UserProfile
  receiver?: UserProfile
}

interface ChatSession {
  id: string
  friend: UserProfile
  lastMessage: ChatMessage
  unreadCount: number
  updated_at: string
}

interface CommunityState {
  // 帖子相关
  posts: PostWithAuthor[]
  loading: boolean
  currentPage: number
  totalPosts: number
  hasMore: boolean
  searchTerm: string
  category: string
  sortBy: 'hot' | 'new'
  useMockData: boolean
  
  // 用户相关
  currentUser: UserProfile | null
  isAuthenticated: boolean
  
  // 交互状态
  likedPosts: Set<string>
  followingUsers: Set<string>
  // 兼容字段
  likes: Set<string>
  follows: Set<string>
  
  // 好友相关
  friends: UserProfile[]
  sentFriendRequests: FriendRequest[]
  receivedFriendRequests: FriendRequest[]
  chatSessions: ChatSession[]
  currentChat: ChatSession | null
  chatMessages: ChatMessage[]
  chatLoading: boolean
  
  // 实时订阅
  subscription: RealtimeChannel | null
  chatSubscription: RealtimeChannel | null

  // 方法
  setPosts: (posts: PostWithAuthor[]) => void
  addPosts: (posts: PostWithAuthor[]) => void
  setLoading: (loading: boolean) => void
  setSearchTerm: (term: string) => void
  setCategory: (category: string) => void
  setSortBy: (sort: 'hot' | 'new') => void
  fetchPosts: (page?: number) => Promise<void>
  setCurrentUser: (user: UserProfile | null) => void
  setAuthenticated: (authenticated: boolean) => void
  setUseMockData: (enabled: boolean) => void
  
  // 点赞功能
  toggleLike: (postId: string, action?: 'like' | 'unlike') => Promise<boolean>
  setLikedPosts: (postIds: string[]) => void
  
  // 关注功能
  toggleFollow: (userId: string, action?: 'follow' | 'unfollow') => Promise<boolean>
  setFollowingUsers: (userIds: string[]) => void
  
  // 评论功能
  addComment: (postId: string, comment: CommentWithAuthor) => void
  
  // 分页
  nextPage: () => void
  resetPage: () => void
  
  // 实时功能
  initSubscription: () => void
  unsubscribe: () => void
  
  // 好友功能
  sendFriendRequest: (receiverId: string) => Promise<boolean>
  acceptFriendRequest: (requestId: string) => Promise<boolean>
  rejectFriendRequest: (requestId: string) => Promise<boolean>
  removeFriend: (friendId: string) => Promise<boolean>
  fetchFriends: () => Promise<void>
  fetchFriendRequests: () => Promise<void>
  
  // 私信功能
  sendMessage: (receiverId: string, content: string) => Promise<boolean>
  fetchChatMessages: (friendId: string) => Promise<void>
  fetchChatSessions: () => Promise<void>
  setCurrentChat: (session: ChatSession | null) => void
  markMessagesAsRead: (friendId: string) => Promise<void>
  initChatSubscription: () => void
  unsubscribeFromChat: () => void
}

export const useCommunityStore = create<CommunityState>((set, get) => ({
  // 初始状态
  posts: [],
  loading: false,
  currentPage: 1,
  totalPosts: 0,
  hasMore: true,
  searchTerm: '',
  category: '',
  sortBy: 'new',
  useMockData: (typeof process !== 'undefined' && process.env && process.env.USE_MOCK_DATA !== 'false'),
  currentUser: null,
  isAuthenticated: false,
  likedPosts: new Set(),
  followingUsers: new Set(),
  likes: new Set(),
  follows: new Set(),
  // 好友相关初始状态
  friends: [],
  sentFriendRequests: [],
  receivedFriendRequests: [],
  chatSessions: [],
  currentChat: null,
  chatMessages: [],
  chatLoading: false,
  // 订阅相关
  subscription: null,
  chatSubscription: null,

  // 基本设置方法
  setPosts: (posts) => set({ posts }),
  addPosts: (newPosts) => set((state) => ({
    posts: [...state.posts, ...newPosts]
  })),
  setLoading: (loading) => set({ loading }),
  setSearchTerm: (term) => set({ searchTerm: term }),
  setCategory: (category) => set({ category }),
  setSortBy: (sortBy) => set({ sortBy }),
  
  fetchPosts: async (page = 1) => {
    const { category, sortBy, searchTerm, posts } = get()
    set({ loading: true })
    try {
      const { posts: newPosts, total } = await getPosts(page, 20, category, sortBy, searchTerm)
      
      set({ 
        posts: page === 1 ? newPosts : [...posts, ...newPosts],
        totalPosts: total,
        currentPage: page,
        hasMore: newPosts.length === 20, // 假设每页20条
        loading: false
      })
    } catch (error) {
      console.error('Fetch posts failed:', error)
      set({ loading: false })
      toast.error('获取帖子失败')
    }
  },

  setCurrentUser: (user) => set({ currentUser: user }),
  setAuthenticated: (authenticated) => set({ isAuthenticated: authenticated }),
  setUseMockData: (enabled) => set({ useMockData: enabled }),

  // 点赞功能 - 乐观更新 + 自动回滚
  toggleLike: async (postId, action) => {
    const { likedPosts, currentUser, useMockData, posts } = get()
    
    // 1. 计算新状态
    const isLiked = likedPosts.has(postId)
    const nextAction: 'like' | 'unlike' = action || (isLiked ? 'unlike' : 'like')
    const newLikedPosts = new Set(likedPosts)
    
    if (nextAction === 'unlike') {
      newLikedPosts.delete(postId)
    } else {
      newLikedPosts.add(postId)
    }

    // 2. 保存旧状态用于回滚
    const previousLikedPosts = new Set(likedPosts)
    const previousPosts = [...posts]

    // 3. 乐观更新 UI
    set({ likedPosts: newLikedPosts, likes: newLikedPosts })
    
    set((state) => ({
      posts: state.posts.map(post => 
        post.id === postId
          ? {
              ...post,
              likes_count: nextAction === 'unlike'
                ? (post.likes_count || 1) - 1
                : (post.likes_count || 0) + 1,
              is_liked: nextAction === 'like'
            }
          : post
      )
    }))

    // 4. 执行异步操作
    try {
      if (!useMockData && currentUser) {
        await communityService.toggleLike(postId, currentUser.id, nextAction)
      }
      return true
    } catch (error) {
      // 5. 发生错误，回滚状态
      console.error('Toggle like failed:', error)
      toast.error('操作失败，请重试')
      
      set({ 
        likedPosts: previousLikedPosts, 
        likes: previousLikedPosts,
        posts: previousPosts 
      })
      return false
    }
  },

  setLikedPosts: (postIds) => set({ likedPosts: new Set(postIds) }),

  // 关注功能 - 乐观更新 + 自动回滚
  toggleFollow: async (userId, action) => {
    const { followingUsers, currentUser, useMockData } = get()
    
    // 1. 验证
    if (currentUser && currentUser.id === userId) return false

    // 2. 计算新状态
    const isFollowing = followingUsers.has(userId)
    const nextAction: 'follow' | 'unfollow' = action || (isFollowing ? 'unfollow' : 'follow')
    const newFollowingUsers = new Set(followingUsers)

    if (nextAction === 'unfollow') {
      newFollowingUsers.delete(userId)
    } else {
      newFollowingUsers.add(userId)
    }

    // 3. 保存旧状态
    const previousFollowingUsers = new Set(followingUsers)

    // 4. 乐观更新 UI
    set({ followingUsers: newFollowingUsers, follows: newFollowingUsers })

    // 5. 执行异步操作
    try {
      if (!useMockData && currentUser) {
        await communityService.toggleFollow(currentUser.id, userId, nextAction)
      }
      return true
    } catch (error) {
      // 6. 发生错误，回滚状态
      console.error('Toggle follow failed:', error)
      toast.error('关注失败，请重试')
      
      set({ 
        followingUsers: previousFollowingUsers, 
        follows: previousFollowingUsers 
      })
      return false
    }
  },

  setFollowingUsers: (userIds) => set({ followingUsers: new Set(userIds) }),

  // 评论功能
  addComment: (postId, newComment) => set((state) => ({
    posts: state.posts.map(post => 
      post.id === postId
        ? { ...post, comments_count: (post.comments_count || 0) + 1 }
        : post
    )
  })),

  // 分页
  nextPage: () => set((state) => ({ currentPage: state.currentPage + 1 })),
  resetPage: () => set({ currentPage: 1, posts: [], hasMore: true }),

  // 实时订阅
  initSubscription: () => {
    const { subscription } = get()
    if (subscription) return // Already subscribed

    const sub = communityService.subscribeToPosts(async (payload) => {
      console.log('Realtime post update:', payload)
      const { posts } = get()

      if (payload.eventType === 'INSERT') {
        // Fetch full post details including author
        const { data: newPost, error } = await supabase
          .from('posts')
          .select('*, author:users!user_id(*)')
          .eq('id', payload.new.id)
          .single()
        
        if (!error && newPost) {
           set({ posts: [newPost as PostWithAuthor, ...posts] })
           toast.info('有新帖子发布！')
        }
      } else if (payload.eventType === 'DELETE') {
        set({ posts: posts.filter(p => p.id !== payload.old.id) })
      } else if (payload.eventType === 'UPDATE') {
        set({ 
          posts: posts.map(p => p.id === payload.new.id ? { ...p, ...payload.new } : p) 
        })
      }
    })
    
    set({ subscription: sub })
  },

  unsubscribe: () => {
    const { subscription } = get()
    if (subscription) {
      subscription.unsubscribe()
      set({ subscription: null })
    }
  },

  // 好友功能 - 发送好友请求
  sendFriendRequest: async (receiverId: string) => {
    const { currentUser, useMockData, sentFriendRequests } = get()
    
    if (!currentUser) return false
    if (currentUser.id === receiverId) return false
    
    // 检查是否已经发送过请求
    const hasPendingRequest = sentFriendRequests.some(req => 
      req.receiver_id === receiverId && req.status === 'pending'
    )
    if (hasPendingRequest) return false
    
    // 乐观更新
    const mockRequest: FriendRequest = {
      id: `req_${Date.now()}`,
      sender_id: currentUser.id,
      receiver_id: receiverId,
      status: 'pending',
      created_at: new Date().toISOString()
    }
    
    set((state) => ({
      sentFriendRequests: [...state.sentFriendRequests, mockRequest]
    }))
    
    try {
      if (!useMockData) {
        // 实际API调用
        await communityService.sendFriendRequest(currentUser.id, receiverId)
      }
      return true
    } catch (error) {
      console.error('发送好友请求失败:', error)
      toast.error('发送好友请求失败，请重试')
      // 回滚
      set((state) => ({
        sentFriendRequests: state.sentFriendRequests.filter(req => req.id !== mockRequest.id)
      }))
      return false
    }
  },
  
  // 接受好友请求
  acceptFriendRequest: async (requestId: string) => {
    const { currentUser, useMockData, receivedFriendRequests } = get()
    
    if (!currentUser) return false
    
    // 找到请求
    const request = receivedFriendRequests.find(req => req.id === requestId)
    if (!request) return false
    
    // 乐观更新
    set((state) => ({
      receivedFriendRequests: state.receivedFriendRequests.filter(req => req.id !== requestId)
    }))
    
    try {
      if (!useMockData) {
        // 实际API调用
        await communityService.acceptFriendRequest(requestId)
      }
      return true
    } catch (error) {
      console.error('接受好友请求失败:', error)
      toast.error('接受好友请求失败，请重试')
      // 回滚
      set((state) => ({
        receivedFriendRequests: [...state.receivedFriendRequests, request]
      }))
      return false
    }
  },
  
  // 拒绝好友请求
  rejectFriendRequest: async (requestId: string) => {
    const { currentUser, useMockData, receivedFriendRequests } = get()
    
    if (!currentUser) return false
    
    // 找到请求
    const request = receivedFriendRequests.find(req => req.id === requestId)
    if (!request) return false
    
    // 乐观更新
    set((state) => ({
      receivedFriendRequests: state.receivedFriendRequests.filter(req => req.id !== requestId)
    }))
    
    try {
      if (!useMockData) {
        // 实际API调用
        await communityService.rejectFriendRequest(requestId)
      }
      return true
    } catch (error) {
      console.error('拒绝好友请求失败:', error)
      toast.error('拒绝好友请求失败，请重试')
      // 回滚
      set((state) => ({
        receivedFriendRequests: [...state.receivedFriendRequests, request]
      }))
      return false
    }
  },
  
  // 移除好友
  removeFriend: async (friendId: string) => {
    const { currentUser, useMockData, friends } = get()
    
    if (!currentUser) return false
    
    // 找到好友
    const friend = friends.find(f => f.id === friendId)
    if (!friend) return false
    
    // 乐观更新
    set((state) => ({
      friends: state.friends.filter(f => f.id !== friendId)
    }))
    
    try {
      if (!useMockData) {
        // 实际API调用
        await communityService.removeFriend(currentUser.id, friendId)
      }
      return true
    } catch (error) {
      console.error('移除好友失败:', error)
      toast.error('移除好友失败，请重试')
      // 回滚
      set((state) => ({
        friends: [...state.friends, friend]
      }))
      return false
    }
  },
  
  // 获取好友列表
  fetchFriends: async () => {
    const { currentUser, useMockData } = get()
    
    if (!currentUser) return
    
    set({ loading: true })
    try {
      if (useMockData) {
        // 使用模拟数据
        set({ friends: [] })
      } else {
        // 实际API调用
        const { data: friends } = await communityService.getFriends(currentUser.id)
        set({ friends: friends || [] })
      }
    } catch (error) {
      console.error('获取好友列表失败:', error)
      toast.error('获取好友列表失败，请重试')
    } finally {
      set({ loading: false })
    }
  },
  
  // 获取好友请求
  fetchFriendRequests: async () => {
    const { currentUser, useMockData } = get()
    
    if (!currentUser) return
    
    set({ loading: true })
    try {
      if (useMockData) {
        // 使用模拟数据
        set({ sentFriendRequests: [], receivedFriendRequests: [] })
      } else {
        // 实际API调用
        const { data: sent } = await communityService.getSentFriendRequests(currentUser.id)
        const { data: received } = await communityService.getReceivedFriendRequests(currentUser.id)
        set({ 
          sentFriendRequests: sent || [], 
          receivedFriendRequests: received || [] 
        })
      }
    } catch (error) {
      console.error('获取好友请求失败:', error)
      toast.error('获取好友请求失败，请重试')
    } finally {
      set({ loading: false })
    }
  },
  
  // 发送消息
  sendMessage: async (receiverId: string, content: string) => {
    const { currentUser, useMockData, chatMessages, chatSessions } = get()
    
    if (!currentUser) return false
    if (!content.trim()) return false
    
    // 乐观更新
    const mockMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender_id: currentUser.id,
      receiver_id: receiverId,
      content: content.trim(),
      created_at: new Date().toISOString()
    }
    
    set((state) => ({
      chatMessages: [...state.chatMessages, mockMessage]
    }))
    
    try {
      if (!useMockData) {
        // 实际API调用
        await communityService.sendMessage(currentUser.id, receiverId, content.trim())
      }
      return true
    } catch (error) {
      console.error('发送消息失败:', error)
      toast.error('发送消息失败，请重试')
      // 回滚
      set((state) => ({
        chatMessages: state.chatMessages.filter(msg => msg.id !== mockMessage.id)
      }))
      return false
    }
  },
  
  // 获取聊天消息
  fetchChatMessages: async (friendId: string) => {
    const { currentUser, useMockData } = get()
    
    if (!currentUser) return
    
    set({ chatLoading: true })
    try {
      if (useMockData) {
        // 使用模拟数据
        set({ chatMessages: [] })
      } else {
        // 实际API调用
        const { data: messages } = await communityService.getChatMessages(currentUser.id, friendId)
        set({ chatMessages: messages || [] })
      }
    } catch (error) {
      console.error('获取聊天消息失败:', error)
      toast.error('获取聊天消息失败，请重试')
    } finally {
      set({ chatLoading: false })
    }
  },
  
  // 获取聊天会话
  fetchChatSessions: async () => {
    const { currentUser, useMockData } = get()
    
    if (!currentUser) return
    
    set({ loading: true })
    try {
      if (useMockData) {
        // 使用模拟数据
        set({ chatSessions: [] })
      } else {
        // 实际API调用
        const { data: sessions } = await communityService.getChatSessions(currentUser.id)
        set({ chatSessions: sessions || [] })
      }
    } catch (error) {
      console.error('获取聊天会话失败:', error)
      toast.error('获取聊天会话失败，请重试')
    } finally {
      set({ loading: false })
    }
  },
  
  // 设置当前聊天
  setCurrentChat: (session: ChatSession | null) => set({ currentChat: session }),
  
  // 标记消息为已读
  markMessagesAsRead: async (friendId: string) => {
    const { currentUser, useMockData } = get()
    
    if (!currentUser) return false
    
    try {
      if (!useMockData) {
        // 实际API调用
        await communityService.markMessagesAsRead(currentUser.id, friendId)
      }
      return true
    } catch (error) {
      console.error('标记消息已读失败:', error)
      return false
    }
  },
  
  // 初始化聊天实时订阅
  initChatSubscription: () => {
    const { chatSubscription } = get()
    if (chatSubscription) return // Already subscribed

    // 这里可以添加聊天实时订阅逻辑
    const sub = supabase.channel('chat-changes')
      // 可以根据需要添加实时订阅
    
    set({ chatSubscription: sub })
  },
  
  // 取消聊天订阅
  unsubscribeFromChat: () => {
    const { chatSubscription } = get()
    if (chatSubscription) {
      chatSubscription.unsubscribe()
      set({ chatSubscription: null })
    }
  }
}))

// 计算属性选择器
export const usePostStats = () => {
  const { posts } = useCommunityStore()
  return {
    totalPosts: posts.length,
    totalLikes: posts.reduce((sum, post) => sum + (post.likes_count || 0), 0),
    totalComments: posts.reduce((sum, post) => sum + (post.comments_count || 0), 0)
  }
}

// 当前用户信息选择器
export const useCurrentUser = () => {
  const { currentUser, isAuthenticated } = useCommunityStore()
  return { currentUser, isAuthenticated }
}

// 点赞状态选择器
export const useLikeStatus = (postId: string) => {
  const { likedPosts, toggleLike } = useCommunityStore()
  return {
    isLiked: likedPosts.has(postId),
    toggleLike: () => toggleLike(postId)
  }
}

// 关注状态选择器
export const useFollowStatus = (userId: string) => {
  const { followingUsers, toggleFollow } = useCommunityStore()
  return {
    isFollowing: followingUsers.has(userId),
    toggleFollow: () => toggleFollow(userId)
  }
}
