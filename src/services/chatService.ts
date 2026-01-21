import { supabase } from '../lib/supabase'
import type { MessageWithSender, UserProfile } from '../lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'

export const chatService = {
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

    return data as MessageWithSender[]
  },

  // 发送消息
  async sendMessage(channelId: string, senderId: string, content: string): Promise<MessageWithSender> {
    // 1. 插入消息
    const { data: messageData, error: messageError } = await supabase
      .from('messages')
      .insert({
        channel_id: channelId,
        sender_id: senderId,
        content: content
      })
      .select()
      .single()

    if (messageError) {
      console.error('Error sending message:', messageError)
      throw messageError
    }

    // 2. 获取发送者信息（为了完整的 MessageWithSender）
    // 在实际生产中，前端 store 可能已经有 user profile，可以直接组合，
    // 但为了数据一致性，这里可以选择再查一次，或者让 store 处理组合。
    // 为了简单起见，这里再查一次 users 表
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', senderId)
      .single()

    if (userError) {
      console.error('Error fetching user details for message:', userError)
      // 即使获取用户信息失败，消息也已经发送成功，可以返回一个带有占位符的发送者
      return {
        ...messageData,
        sender: { id: senderId, username: 'Unknown', email: '' } as UserProfile
      }
    }

    return {
      ...messageData,
      sender: userData as UserProfile
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
          
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('id', newMessage.sender_id)
            .single()

          const messageWithSender: MessageWithSender = {
            ...newMessage,
            sender: userData || { id: newMessage.sender_id, username: 'Unknown' }
          }

          onMessage(messageWithSender)
        }
      )
      .subscribe()
  }
}
