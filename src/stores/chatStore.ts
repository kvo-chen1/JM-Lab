import { create } from 'zustand'
import { chatService, type MessageOptions } from '../services/chatService'
import type { MessageWithSender } from '../lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'

interface ChatState {
  messages: MessageWithSender[]
  isLoading: boolean
  error: string | null
  activeChannelId: string
  subscription: RealtimeChannel | null
  crossPageSubscription: RealtimeChannel | null

  // Actions
  setMessages: (messages: MessageWithSender[]) => void
  addMessage: (message: MessageWithSender) => void
  updateMessageStatus: (messageId: string, status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed') => void
  deleteMessage: (messageId: string) => void
  setActiveChannel: (channelId: string) => void
  
  fetchMessages: (channelId: string) => Promise<void>
  sendMessage: (senderId: string, content: string, options?: MessageOptions) => Promise<MessageWithSender>
  sendCrossPageMessage: (senderId: string, content: string, targetPage: 'square' | 'community', options?: MessageOptions) => Promise<MessageWithSender>
  subscribeToChannel: (channelId: string) => void
  subscribeToCrossPageMessages: () => void
  unsubscribe: () => void
  unsubscribeCrossPage: () => void
  resendFailedMessages: () => Promise<void>
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isLoading: false,
  error: null,
  activeChannelId: 'global', // Default channel
  subscription: null,
  crossPageSubscription: null,

  setMessages: (messages) => set({ messages }),
  
  addMessage: (message) => set((state) => {
    // 避免重复添加 (特别是乐观更新和实时订阅可能冲突时)
    if (state.messages.some(m => m.id === message.id)) {
      return state
    }
    return { messages: [...state.messages, message] }
  }),

  updateMessageStatus: (messageId, status) => set((state) => {
    return {
      messages: state.messages.map(msg => 
        msg.id === messageId ? { ...msg, status } : msg
      )
    }
  }),

  deleteMessage: (messageId) => set((state) => {
    return {
      messages: state.messages.filter(msg => msg.id !== messageId)
    }
  }),

  setActiveChannel: (channelId) => set({ activeChannelId: channelId }),

  fetchMessages: async (channelId) => {
    set({ isLoading: true, error: null })
    try {
      const messages = await chatService.getMessages(channelId)
      set({ messages, isLoading: false })
    } catch (error) {
      console.error('Failed to fetch messages:', error)
      set({ error: 'Failed to load messages', isLoading: false })
    }
  },

  sendMessage: async (senderId, content, options = {}) => {
    const { activeChannelId, addMessage, updateMessageStatus } = get()
    
    // 使用乐观更新，立即添加消息到状态
    const tempId = `temp-${Date.now()}`
    const optimisticMessage: MessageWithSender = {
      id: tempId,
      sender_id: senderId,
      channel_id: options.channelId || activeChannelId,
      community_id: null,
      receiver_id: null,
      content: content,
      status: 'sending',
      type: options.type || 'text',
      metadata: {
        ...options.metadata,
        sourcePage: options.metadata?.sourcePage || 'unknown',
        timestamp: Date.now()
      },
      retry_count: 0,
      is_read: false,
      delivered_at: null,
      read_at: null,
      created_at: new Date().toISOString(),
      sender: {
        id: senderId,
        username: 'You', // 临时用户名，会被实际数据替换
        email: '',
        avatar_url: undefined,
        bio: undefined,
        is_verified: false,
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }
    
    addMessage(optimisticMessage)
    
    try {
      // 发送消息到服务器
      const newMessage = await chatService.sendMessage(senderId, content, {
        ...options,
        channelId: options.channelId || activeChannelId
      })
      
      // 更新消息状态为已发送
      updateMessageStatus(tempId, 'sent')
      
      // 模拟消息送达（实际应该由接收方确认）
      setTimeout(() => {
        updateMessageStatus(newMessage.id, 'delivered')
      }, 1000)
      
      // 用服务器返回的实际消息替换临时消息
      set((state) => ({
        messages: state.messages.map(msg => 
          msg.id === tempId ? {
            ...newMessage,
            status: 'sent'
          } : msg
        )
      }))
      
      return newMessage
    } catch (error) {
      console.error('Failed to send message:', error)
      // 更新消息状态为发送失败
      updateMessageStatus(tempId, 'failed')
      // 缓存失败的消息
      chatService.cacheMessage(optimisticMessage)
      throw error
    }
  },

  sendCrossPageMessage: async (senderId, content, targetPage, options = {}) => {
    const { addMessage, updateMessageStatus } = get()
    
    // 使用乐观更新
    const tempId = `temp-cross-${Date.now()}`
    const optimisticMessage: MessageWithSender = {
      id: tempId,
      sender_id: senderId,
      channel_id: `cross:${targetPage}:${Date.now()}`,
      community_id: null,
      receiver_id: null,
      content: content,
      status: 'sending',
      type: options.type || 'text',
      metadata: {
        ...options.metadata,
        targetPage,
        crossPage: true,
        sourcePage: options.metadata?.sourcePage || 'unknown',
        timestamp: Date.now()
      },
      retry_count: 0,
      is_read: false,
      delivered_at: null,
      read_at: null,
      created_at: new Date().toISOString(),
      sender: {
        id: senderId,
        username: 'You',
        email: '',
        avatar_url: undefined,
        bio: undefined,
        is_verified: false,
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }

    addMessage(optimisticMessage)

    try {
      // 发送跨页面消息
      const newMessage = await chatService.sendCrossPageMessage(senderId, content, targetPage, options)
      
      // 更新消息状态
      updateMessageStatus(tempId, 'sent')
      
      // 模拟消息送达
      setTimeout(() => {
        updateMessageStatus(newMessage.id, 'delivered')
      }, 1000)
      
      // 用实际消息替换临时消息
      set((state) => ({
        messages: state.messages.map(msg => 
          msg.id === tempId ? {
            ...newMessage,
            status: 'sent'
          } : msg
        )
      }))
      
      return newMessage
    } catch (error) {
      console.error('Failed to send cross-page message:', error)
      updateMessageStatus(tempId, 'failed')
      chatService.cacheMessage(optimisticMessage)
      throw error
    }
  },

  subscribeToChannel: (channelId) => {
    const { subscription, addMessage, updateMessageStatus } = get()
    
    // 如果已经订阅了同一个频道，不做操作
    if (subscription) {
      subscription.unsubscribe()
    }

    const newSubscription = chatService.subscribeToMessages(channelId, (message) => {
      // 检查是否是已存在的消息（可能是状态更新）
      const existingMessage = get().messages.find(m => m.id === message.id)
      if (existingMessage) {
        // 如果是状态更新，更新现有消息
        updateMessageStatus(message.id, message.status as any)
      } else {
        // 否则添加新消息
        addMessage(message)
      }
    })

    set({ subscription: newSubscription })
  },

  subscribeToCrossPageMessages: () => {
    const { crossPageSubscription, addMessage, updateMessageStatus } = get()
    
    // 如果已经订阅了跨页面消息，不做操作
    if (crossPageSubscription) {
      crossPageSubscription.unsubscribe()
    }

    const newSubscription = chatService.subscribeToCrossPageMessages((message) => {
      // 检查是否是已存在的消息
      const existingMessage = get().messages.find(m => m.id === message.id)
      if (existingMessage) {
        // 如果是状态更新，更新现有消息
        updateMessageStatus(message.id, message.status as any)
      } else {
        // 否则添加新消息
        addMessage(message)
      }
    })

    set({ crossPageSubscription: newSubscription })
  },

  unsubscribe: () => {
    const { subscription } = get()
    if (subscription) {
      subscription.unsubscribe()
      set({ subscription: null })
    }
  },

  unsubscribeCrossPage: () => {
    const { crossPageSubscription } = get()
    if (crossPageSubscription) {
      crossPageSubscription.unsubscribe()
      set({ crossPageSubscription: null })
    }
  },

  resendFailedMessages: async () => {
    try {
      await chatService.resendFailedMessages()
      // 重新获取消息列表，确保状态同步
      const { activeChannelId } = get()
      if (activeChannelId) {
        await get().fetchMessages(activeChannelId)
      }
    } catch (error) {
      console.error('Failed to resend messages:', error)
    }
  }
}))
