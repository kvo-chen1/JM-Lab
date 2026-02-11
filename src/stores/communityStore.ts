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
      
      // 检查是否获取到数据，如果没有则使用模拟数据
      if (!newPosts || newPosts.length === 0) {
        console.warn('No posts found, using mock data')
        // 使用模拟数据
        const mockPosts = [
          {
            id: '1',
            title: '欢迎加入津脉社区！',
            content: '这里是天津文化创作者的聚集地，希望大家能在这里分享创意，交流经验，共同成长。',
            user_id: 'user-1',
            author_id: 'user-1',
            created_at: new Date(Date.now() - 86400000).toISOString(),
            updated_at: new Date(Date.now() - 86400000).toISOString(),
            likes_count: 123,
            comments_count: 23,
            shares_count: 12,
            view_count: 567,
            status: 'published',
            featured: true,
            author: {
              id: 'user-1',
              username: '管理员',
              email: 'admin@example.com',
              avatar_url: 'https://neeko-copilot.bytedance.net/api/text2image?prompt=Admin%20avatar%2C%20professional%20portrait&size=512x512',
              full_name: '系统管理员',
              bio: '津脉社区管理员',
              is_verified: true,
              metadata: {},
              created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
              updated_at: new Date(Date.now() - 30 * 86400000).toISOString()
            },
            attachments: [
              {
                url: 'https://neeko-copilot.bytedance.net/api/text2image?prompt=Tianjin%20cultural%20community%20welcome%20banner%2C%20modern%20design%2C%20blue%20and%20white%20colors%2C%20cultural%20elements&size=landscape_16_9'
              }
            ]
          },
          {
            id: '2',
            title: '天津文化元素在设计中的应用',
            content: '大家有什么关于天津文化元素在现代设计中应用的想法吗？欢迎分享你的作品和经验。',
            user_id: 'user-2',
            author_id: 'user-2',
            created_at: new Date(Date.now() - 43200000).toISOString(),
            updated_at: new Date(Date.now() - 43200000).toISOString(),
            likes_count: 45,
            comments_count: 12,
            shares_count: 5,
            view_count: 234,
            status: 'published',
            featured: false,
            author: {
              id: 'user-2',
              username: '设计师小王',
              email: 'designer@example.com',
              avatar_url: 'https://neeko-copilot.bytedance.net/api/text2image?prompt=Designer%20avatar%2C%20creative%20portrait&size=512x512',
              full_name: '王设计师',
              bio: '专注于文化元素在设计中的应用',
              is_verified: false,
              metadata: {},
              created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
              updated_at: new Date(Date.now() - 15 * 86400000).toISOString()
            },
            attachments: [
              {
                url: 'https://neeko-copilot.bytedance.net/api/text2image?prompt=Tianjin%20cultural%20elements%20in%20modern%20design%2C%20creative%20concept%2C%20traditional%20patterns&size=landscape_16_9'
              }
            ]
          },
          {
            id: '3',
            title: '津门故里摄影作品分享',
            content: '最近去了津门故里拍摄了一些照片，感受到了浓厚的天津传统文化氛围。',
            user_id: 'user-3',
            author_id: 'user-3',
            created_at: new Date(Date.now() - 21600000).toISOString(),
            updated_at: new Date(Date.now() - 21600000).toISOString(),
            likes_count: 78,
            comments_count: 18,
            shares_count: 9,
            view_count: 345,
            status: 'published',
            featured: false,
            author: {
              id: 'user-3',
              username: '摄影爱好者',
              email: 'photo@example.com',
              avatar_url: 'https://neeko-copilot.bytedance.net/api/text2image?prompt=Photographer%20avatar%2C%20artistic%20portrait&size=512x512',
              full_name: '张摄影',
              bio: '热爱记录天津的文化与风景',
              is_verified: false,
              metadata: {},
              created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
              updated_at: new Date(Date.now() - 10 * 86400000).toISOString()
            },
            attachments: [
              {
                url: 'https://neeko-copilot.bytedance.net/api/text2image?prompt=Tianjin%20ancient%20city%20photography%2C%20traditional%20architecture%2C%20cultural%20heritage%2C%20atmospheric%20lighting&size=landscape_16_9'
              }
            ]
          }
        ]
        
        set({ 
          posts: mockPosts,
          totalPosts: mockPosts.length,
          currentPage: page,
          hasMore: false,
          loading: false
        })
        
        toast.info('使用模拟数据显示帖子')
      } else {
        // 正常获取到数据
        set({ 
          posts: page === 1 ? newPosts : [...posts, ...newPosts],
          totalPosts: total,
          currentPage: page,
          hasMore: newPosts.length === 20, // 假设每页20条
          loading: false
        })
      }
    } catch (error) {
      console.error('Fetch posts failed, using mock data:', error)
      set({ loading: false })
      
      // API失败时使用模拟数据
      const mockPosts = [
          {
            id: '1',
            title: '欢迎加入津脉社区！',
            content: '这里是天津文化创作者的聚集地，希望大家能在这里分享创意，交流经验，共同成长。',
            user_id: 'user-1',
            author_id: 'user-1',
            created_at: new Date(Date.now() - 86400000).toISOString(),
            updated_at: new Date(Date.now() - 86400000).toISOString(),
            likes_count: 123,
            comments_count: 23,
            shares_count: 12,
            view_count: 567,
            status: 'published',
            featured: true,
            author: {
              id: 'user-1',
              username: '管理员',
              avatar_url: 'https://neeko-copilot.bytedance.net/api/text2image?prompt=Admin%20avatar%2C%20professional%20portrait&size=512x512',
              full_name: '系统管理员',
              bio: '津脉社区管理员',
              created_at: new Date(Date.now() - 30 * 86400000).toISOString()
            },
            attachments: [
              {
                url: 'https://neeko-copilot.bytedance.net/api/text2image?prompt=Tianjin%20cultural%20community%20welcome%20banner%2C%20modern%20design%2C%20blue%20and%20white%20colors%2C%20cultural%20elements&size=landscape_16_9'
              }
            ]
          },
          {
            id: '2',
            title: '天津文化元素在设计中的应用',
            content: '大家有什么关于天津文化元素在现代设计中应用的想法吗？欢迎分享你的作品和经验。',
            user_id: 'user-2',
            author_id: 'user-2',
            created_at: new Date(Date.now() - 43200000).toISOString(),
            updated_at: new Date(Date.now() - 43200000).toISOString(),
            likes_count: 45,
            comments_count: 12,
            shares_count: 5,
            view_count: 234,
            status: 'published',
            featured: false,
            author: {
              id: 'user-2',
              username: '设计师小王',
              avatar_url: 'https://neeko-copilot.bytedance.net/api/text2image?prompt=Designer%20avatar%2C%20creative%20portrait&size=512x512',
              full_name: '王设计师',
              bio: '专注于文化元素在设计中的应用',
              created_at: new Date(Date.now() - 15 * 86400000).toISOString()
            },
            attachments: [
              {
                url: 'https://neeko-copilot.bytedance.net/api/text2image?prompt=Tianjin%20cultural%20elements%20in%20modern%20design%2C%20creative%20concept%2C%20traditional%20patterns&size=landscape_16_9'
              }
            ]
          },
          {
            id: '3',
            title: '津门故里摄影作品分享',
            content: '最近去了津门故里拍摄了一些照片，感受到了浓厚的天津传统文化氛围。',
            user_id: 'user-3',
            author_id: 'user-3',
            created_at: new Date(Date.now() - 21600000).toISOString(),
            updated_at: new Date(Date.now() - 21600000).toISOString(),
            likes_count: 78,
            comments_count: 18,
            shares_count: 9,
            view_count: 345,
            status: 'published',
            featured: false,
            author: {
              id: 'user-3',
              username: '摄影爱好者',
              email: 'photo@example.com',
              avatar_url: 'https://neeko-copilot.bytedance.net/api/text2image?prompt=Photographer%20avatar%2C%20artistic%20portrait&size=512x512',
              full_name: '张摄影',
              bio: '热爱记录天津的文化与风景',
              is_verified: false,
              metadata: {},
              created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
              updated_at: new Date(Date.now() - 10 * 86400000).toISOString()
            },
            attachments: [
              {
                url: 'https://neeko-copilot.bytedance.net/api/text2image?prompt=Tianjin%20ancient%20city%20photography%2C%20traditional%20architecture%2C%20cultural%20heritage%2C%20atmospheric%20lighting&size=landscape_16_9'
              }
            ]
          }
        ]
      
      set({ 
        posts: mockPosts,
        totalPosts: mockPosts.length,
        currentPage: page,
        hasMore: false,
        loading: false
      })
      
      toast.info('使用模拟数据显示帖子')
    }
  },

  setCurrentUser: (user) => set({ currentUser: user }),
  setAuthenticated: (authenticated) => set({ isAuthenticated: authenticated }),

  // 点赞功能 - 乐观更新 + 自动回滚
  toggleLike: async (postId, action) => {
    const { likedPosts, currentUser, posts } = get()
    
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
      if (currentUser) {
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
    const { followingUsers, currentUser } = get()
    
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
      if (currentUser) {
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
        // Fetch full post details（不使用嵌套查询，避免类型不匹配）
        const { data: newPost, error } = await supabase
          .from('posts')
          .select('*')
          .eq('id', payload.new.id)
          .single()
        
        if (!error && newPost) {
           // 获取作者信息
           let author = null;
           if (newPost.user_id) {
             const { data: authorData } = await supabase
               .from('users')
               .select('id, username, avatar_url')
               .eq('id', String(newPost.user_id))
               .single();
             author = authorData;
           }
           
           set({ posts: [{ ...newPost, author } as PostWithAuthor, ...posts] })
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
    const { currentUser, sentFriendRequests } = get()
    
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
      // 实际API调用
      await communityService.sendFriendRequest(currentUser.id, receiverId)
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
    const { currentUser, receivedFriendRequests } = get()
    
    if (!currentUser) return false
    
    // 找到请求
    const request = receivedFriendRequests.find(req => req.id === requestId)
    if (!request) return false
    
    // 乐观更新
    set((state) => ({
      receivedFriendRequests: state.receivedFriendRequests.filter(req => req.id !== requestId)
    }))
    
    try {
      // 实际API调用
      await communityService.acceptFriendRequest(requestId)
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
    const { currentUser, receivedFriendRequests } = get()
    
    if (!currentUser) return false
    
    // 找到请求
    const request = receivedFriendRequests.find(req => req.id === requestId)
    if (!request) return false
    
    // 乐观更新
    set((state) => ({
      receivedFriendRequests: state.receivedFriendRequests.filter(req => req.id !== requestId)
    }))
    
    try {
      // 实际API调用
      await communityService.rejectFriendRequest(requestId)
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
    const { currentUser, friends } = get()
    
    if (!currentUser) return false
    
    // 找到好友
    const friend = friends.find(f => f.id === friendId)
    if (!friend) return false
    
    // 乐观更新
    set((state) => ({
      friends: state.friends.filter(f => f.id !== friendId)
    }))
    
    try {
      // 实际API调用
      await communityService.removeFriend(currentUser.id, friendId)
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
    const { currentUser } = get()
    
    if (!currentUser) return
    
    set({ loading: true })
    try {
      // 实际API调用
      const { data: friends } = await communityService.getFriends(currentUser.id)
      set({ friends: friends || [] })
    } catch (error) {
      console.error('获取好友列表失败:', error)
      toast.error('获取好友列表失败，请重试')
    } finally {
      set({ loading: false })
    }
  },
  
  // 获取好友请求
  fetchFriendRequests: async () => {
    const { currentUser } = get()
    
    if (!currentUser) return
    
    set({ loading: true })
    try {
      // 实际API调用
      const { data: sent } = await communityService.getSentFriendRequests(currentUser.id)
      const { data: received } = await communityService.getReceivedFriendRequests(currentUser.id)
      set({ 
        sentFriendRequests: sent || [], 
        receivedFriendRequests: received || [] 
      })
    } catch (error) {
      console.error('获取好友请求失败:', error)
      toast.error('获取好友请求失败，请重试')
    } finally {
      set({ loading: false })
    }
  },
  
  // 发送消息
  sendMessage: async (receiverId: string, content: string) => {
    const { currentUser, chatMessages, chatSessions } = get()
    
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
      // 实际API调用
      await communityService.sendMessage(currentUser.id, receiverId, content.trim())
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
    const { currentUser } = get()
    
    if (!currentUser) return
    
    set({ chatLoading: true })
    try {
      // 实际API调用
      const { data: messages } = await communityService.getChatMessages(currentUser.id, friendId)
      set({ chatMessages: messages || [] })
    } catch (error) {
      console.error('获取聊天消息失败:', error)
      toast.error('获取聊天消息失败，请重试')
    } finally {
      set({ chatLoading: false })
    }
  },
  
  // 获取聊天会话
  fetchChatSessions: async () => {
    const { currentUser } = get()
    
    if (!currentUser) return
    
    set({ loading: true })
    try {
      // 实际API调用
      const { data: sessions } = await communityService.getChatSessions(currentUser.id)
      set({ chatSessions: sessions || [] })
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
    const { currentUser } = get()
    
    if (!currentUser) return
    
    try {
      // 实际API调用
      await communityService.markMessagesAsRead(currentUser.id, friendId)
    } catch (error) {
      console.error('标记消息已读失败:', error)
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
