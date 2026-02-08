import { supabase } from '../lib/supabase'
import { supabaseAdmin } from '../lib/supabaseClient'
import type { MessageWithSender, UserProfile } from '../lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'

export interface MessageOptions {
  type?: 'text' | 'image' | 'file' | 'rich_text' | 'emoji'
  metadata?: Record<string, any>
  channelId?: string
  communityId?: string
}

export interface BatchMessageOptions {
  type?: 'text' | 'image' | 'file' | 'rich_text' | 'emoji'
  metadata?: Record<string, any>
  channelId?: string
  communityId?: string
}

export interface MessageBatchItem {
  content: string
  options?: BatchMessageOptions
}

export const chatService = {
  // 用户缓存，减少重复查询
  userCache: {} as Record<string, UserProfile>,
  
  // 缓存过期时间（毫秒）
  CACHE_EXPIRY: 5 * 60 * 1000, // 5分钟
  
  // 获取指定频道的消息历史
  async getMessages(channelId: string, limit = 50): Promise<MessageWithSender[]> {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:users!sender_id (*)
      `)
      .eq('channel_id', channelId)
      .order('created_at', { ascending: true })
      .limit(limit)

    if (error) {
      console.error('Error fetching messages:', error)
      throw error
    }

    // 缓存用户信息
    data.forEach((msg: any) => {
      if (msg.sender) {
        this.userCache[msg.sender.id] = msg.sender
      }
    })

    return data as MessageWithSender[]
  },
  
  // 批量发送消息
  async batchSendMessages(senderId: string, messages: MessageBatchItem[]): Promise<MessageWithSender[]> {
    const results: MessageWithSender[] = []
    
    // 批量处理消息，减少网络请求
    for (const item of messages) {
      try {
        const message = await this.sendMessage(senderId, item.content, item.options)
        results.push(message)
      } catch (error) {
        console.error('Error sending message in batch:', error)
        // 继续处理其他消息，不影响整体批量操作
      }
    }
    
    return results
  },
  
  // 获取用户信息（带缓存）
  async getUserInfo(userId: string): Promise<UserProfile> {
    // 检查缓存
    if (this.userCache[userId]) {
      return this.userCache[userId]
    }
    
    // 从数据库获取
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (userError) {
      console.error('Error fetching user details:', userError)
      // 返回占位符用户信息
      const placeholderUser: UserProfile = {
        id: userId,
        username: 'Unknown',
        email: '',
        avatar_url: null,
        bio: null,
        is_verified: false,
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      return placeholderUser
    }
    
    // 缓存用户信息
    this.userCache[userId] = userData as UserProfile
    
    // 设置缓存过期
    setTimeout(() => {
      delete this.userCache[userId]
    }, this.CACHE_EXPIRY)
    
    return userData as UserProfile
  },

  // 发送消息
  async sendMessage(senderId: string, content: string, options: MessageOptions = {}): Promise<MessageWithSender> {
    const { type = 'text', metadata = {}, channelId = 'global', communityId } = options

    // 1. 插入消息（使用 supabaseAdmin 绕过 RLS）
    const { data: messageData, error: messageError } = await supabaseAdmin
      .from('messages')
      .insert({
        channel_id: channelId,
        sender_id: senderId,
        content: content,
        type: type,
        metadata: metadata,
        status: 'sent',
        community_id: communityId,
        role: 'user'
      })
      .select()
      .single()

    if (messageError) {
      console.error('Error sending message:', messageError)
      throw messageError
    }

    // 2. 获取发送者信息（为了完整的 MessageWithSender）
    const userData = await this.getUserInfo(senderId)

    return {
      ...messageData,
      sender: userData
    }
  },

  // 订阅实时消息
  subscribeToMessages(channelId: string, onMessage: (message: MessageWithSender) => void): RealtimeChannel {
    return supabase
      .channel(`chat:${channelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${channelId}`
        },
        async (payload) => {
          // 当收到新消息时，我们需要获取发送者的详细信息
          const newMessage = payload.new as any
          
          // 使用缓存的 getUserInfo 方法
          const userData = await this.getUserInfo(newMessage.sender_id)

          const messageWithSender: MessageWithSender = {
            ...newMessage,
            sender: userData
          }

          onMessage(messageWithSender)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${channelId}`
        },
        async (payload) => {
          // 当消息状态更新时，也需要获取发送者的详细信息
          const updatedMessage = payload.new as any
          
          // 使用缓存的 getUserInfo 方法
          const userData = await this.getUserInfo(updatedMessage.sender_id)

          const messageWithSender: MessageWithSender = {
            ...updatedMessage,
            sender: userData
          }

          onMessage(messageWithSender)
        }
      )
      .subscribe()
  },

  // 更新消息状态
  async updateMessageStatus(messageId: string, status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed'): Promise<void> {
    const updateData: any = { status }
    
    // 根据状态更新相应的时间字段
    if (status === 'delivered') {
      updateData.delivered_at = new Date().toISOString()
    } else if (status === 'read') {
      updateData.read_at = new Date().toISOString()
    }
    
    const { error } = await supabase
      .from('messages')
      .update(updateData)
      .eq('id', messageId)
      
    if (error) {
      console.error('Error updating message status:', error)
      throw error
    }
  },

  // 发送跨页面消息
  async sendCrossPageMessage(senderId: string, content: string, targetPage: 'square' | 'community', options: MessageOptions = {}): Promise<MessageWithSender> {
    const channelId = `cross:${targetPage}:${Date.now()}`
    
    return this.sendMessage(senderId, content, {
      ...options,
      channelId,
      metadata: {
        ...options.metadata,
        targetPage,
        crossPage: true
      }
    })
  },

  // 订阅跨页面消息
  subscribeToCrossPageMessages(onMessage: (message: MessageWithSender) => void): RealtimeChannel {
    return supabase
      .channel('cross:page')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `channel_id.like.cross:%`
        },
        async (payload) => {
          const newMessage = payload.new as any
          
          // 使用缓存的 getUserInfo 方法
          const userData = await this.getUserInfo(newMessage.sender_id)

          const messageWithSender: MessageWithSender = {
            ...newMessage,
            sender: userData
          }

          onMessage(messageWithSender)
        }
      )
      .subscribe()
  },

  // 缓存消息到本地存储（处理循环引用）
  cacheMessage(message: Partial<MessageWithSender>): void {
    try {
      // 创建一个安全的消息对象，只包含必要字段，避免循环引用
      const safeMessage = {
        id: message.id,
        sender_id: message.sender_id,
        channel_id: message.channel_id,
        content: message.content,
        type: message.type,
        status: message.status,
        created_at: message.created_at,
        metadata: message.metadata,
        cachedAt: new Date().toISOString()
      }
      
      const cachedMessages = JSON.parse(localStorage.getItem('cached_messages') || '[]')
      cachedMessages.push(safeMessage)
      
      // 限制缓存消息数量
      if (cachedMessages.length > 50) {
        cachedMessages.splice(0, cachedMessages.length - 50)
      }
      
      localStorage.setItem('cached_messages', JSON.stringify(cachedMessages))
    } catch (error) {
      console.error('Error caching message:', error)
    }
  },

  // 获取本地缓存的消息
  getCachedMessages(): Partial<MessageWithSender>[] {
    try {
      return JSON.parse(localStorage.getItem('cached_messages') || '[]')
    } catch (error) {
      console.error('Error getting cached messages:', error)
      return []
    }
  },

  // 清除本地缓存的消息
  clearCachedMessages(): void {
    try {
      localStorage.removeItem('cached_messages')
    } catch (error) {
      console.error('Error clearing cached messages:', error)
    }
  },

  // 重发失败的消息
  async resendFailedMessages(): Promise<void> {
    const cachedMessages = this.getCachedMessages()
    const failedMessages = cachedMessages.filter(msg => msg.status === 'failed')
    
    for (const message of failedMessages) {
      try {
        if (message.sender_id && message.content) {
          await this.sendMessage(message.sender_id, message.content, {
            channelId: message.channel_id,
            type: message.type as any,
            metadata: message.metadata
          })
          
          // 重发成功后从缓存中移除
          const updatedCachedMessages = cachedMessages.filter(msg => msg.id !== message.id)
          localStorage.setItem('cached_messages', JSON.stringify(updatedCachedMessages))
        }
      } catch (error) {
        console.error('Error resending message:', error)
        // 更新重试次数
        if (message.retry_count) {
          message.retry_count += 1
        } else {
          message.retry_count = 1
        }
      }
    }
  }
}
