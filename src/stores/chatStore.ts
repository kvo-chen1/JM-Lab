import { create } from 'zustand'
import { chatService } from '../services/chatService'
import type { MessageWithSender } from '../lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'

interface ChatState {
  messages: MessageWithSender[]
  isLoading: boolean
  error: string | null
  activeChannelId: string
  subscription: RealtimeChannel | null

  // Actions
  setMessages: (messages: MessageWithSender[]) => void
  addMessage: (message: MessageWithSender) => void
  setActiveChannel: (channelId: string) => void
  
  fetchMessages: (channelId: string) => Promise<void>
  sendMessage: (senderId: string, content: string) => Promise<void>
  subscribeToChannel: (channelId: string) => void
  unsubscribe: () => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isLoading: false,
  error: null,
  activeChannelId: 'global', // Default channel
  subscription: null,

  setMessages: (messages) => set({ messages }),
  
  addMessage: (message) => set((state) => {
    // 避免重复添加 (特别是乐观更新和实时订阅可能冲突时)
    if (state.messages.some(m => m.id === message.id)) {
      return state
    }
    return { messages: [...state.messages, message] }
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

  sendMessage: async (senderId, content) => {
    const { activeChannelId, addMessage } = get()
    try {
      // 乐观更新逻辑可以在这里添加，或者等待服务器响应
      // 目前采用等待响应模式，保证数据一致性
      const newMessage = await chatService.sendMessage(activeChannelId, senderId, content)
      addMessage(newMessage)
    } catch (error) {
      console.error('Failed to send message:', error)
      // 这里可以添加 toast 提示
      throw error
    }
  },

  subscribeToChannel: (channelId) => {
    const { subscription, addMessage } = get()
    
    // 如果已经订阅了同一个频道，不做操作
    // 注意：这里可能需要更严谨的判断，比如检查 subscription.topic
    if (subscription) {
      subscription.unsubscribe()
    }

    const newSubscription = chatService.subscribeToMessages(channelId, (message) => {
      addMessage(message)
    })

    set({ subscription: newSubscription })
  },

  unsubscribe: () => {
    const { subscription } = get()
    if (subscription) {
      subscription.unsubscribe()
      set({ subscription: null })
    }
  }
}))
