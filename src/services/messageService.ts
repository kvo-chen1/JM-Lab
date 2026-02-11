// 私信服务 - 使用后端 API
import { supabase } from '../lib/supabase'

export interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  is_read: boolean
  created_at: string
}

export interface Conversation {
  userId: string
  username: string
  avatar: string
  lastMessage: string
  lastMessageTime: string
  lastSenderId: string
  isLastMessageRead: boolean
  unreadCount: number
}

export interface FriendRequest {
  id: string
  sender_id: string
  receiver_id: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  updated_at: string
}

export interface SendMessageResult {
  success: boolean
  message?: string
  data?: Message
  waitingForReply?: boolean
}

// 获取 token
function getToken(): string | null {
  return typeof window !== 'undefined' ? localStorage.getItem('token') : null
}

/**
 * 发送私信 - 优先使用后端 API，失败时使用 Supabase 直接发送
 */
export async function sendDirectMessage(
  senderId: string,
  receiverId: string,
  content: string
): Promise<SendMessageResult> {
  try {
    console.log('[sendDirectMessage] 发送消息:', { senderId, receiverId, content })

    // 首先尝试使用后端 API
    const token = getToken()
    if (token) {
      try {
        const response = await fetch('/api/messages/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            friendId: receiverId,
            content: content.trim()
          })
        })

        if (response.ok) {
          const result = await response.json()
          console.log('[sendDirectMessage] API 发送成功:', result.data)
          return {
            success: true,
            data: result.data
          }
        }

        if (response.status === 403) {
          const error = await response.json()
          return {
            success: false,
            message: error.message || '发送失败',
            waitingForReply: error.waitingForReply || false
          }
        }

        // API 失败，降级到 Supabase
        console.warn('[sendDirectMessage] API 失败，使用 Supabase 直接发送')
      } catch (apiError) {
        console.warn('[sendDirectMessage] API 异常，使用 Supabase 直接发送:', apiError)
      }
    }

    // 使用 Supabase 直接发送消息
    const { data, error } = await supabase
      .from('messages')
      .insert({
        sender_id: senderId,
        receiver_id: receiverId,
        content: content.trim(),
        is_read: false,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('[sendDirectMessage] Supabase 发送失败:', error)
      throw new Error(error.message || '发送失败')
    }

    console.log('[sendDirectMessage] Supabase 发送成功:', data)
    return {
      success: true,
      data: {
        id: data.id,
        sender_id: data.sender_id,
        receiver_id: data.receiver_id,
        content: data.content,
        is_read: data.is_read,
        created_at: data.created_at
      }
    }
  } catch (error: any) {
    console.error('[sendDirectMessage] 异常:', error)
    throw error
  }
}

/**
 * 获取与某个用户的私信记录 - 优先使用后端 API，失败时使用 Supabase
 */
export async function getDirectMessages(
  userId: string,
  otherUserId: string,
  limit: number = 50
): Promise<Message[]> {
  try {
    console.log('[getDirectMessages] 获取消息:', { userId, otherUserId })

    // 首先尝试使用后端 API
    const token = getToken()
    if (token) {
      try {
        const response = await fetch(`/api/messages/${otherUserId}?limit=${limit}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const result = await response.json()
          console.log('[getDirectMessages] API 获取成功:', result.data?.length || 0, '条消息')
          return result.data || []
        }

        console.warn('[getDirectMessages] API 失败，使用 Supabase 直接获取')
      } catch (apiError) {
        console.warn('[getDirectMessages] API 异常，使用 Supabase 直接获取:', apiError)
      }
    }

    // 使用 Supabase 直接获取消息
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`)
      .order('created_at', { ascending: true })
      .limit(limit)

    if (error) {
      console.error('[getDirectMessages] Supabase 获取失败:', error)
      return []
    }

    console.log('[getDirectMessages] Supabase 获取成功:', data?.length || 0, '条消息')
    return data || []
  } catch (error) {
    console.error('[getDirectMessages] 异常:', error)
    return []
  }
}

/**
 * 标记消息为已读 - 使用后端 API
 */
export async function markMessagesAsRead(
  userId: string,
  senderId: string
): Promise<boolean> {
  try {
    console.log('[markMessagesAsRead] 标记已读:', { userId, senderId })

    const token = getToken()
    if (!token) {
      return false
    }

    const response = await fetch('/api/messages/read', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        friendId: senderId
      })
    })

    if (!response.ok) {
      console.error('[markMessagesAsRead] 标记失败:', response.status)
      return false
    }

    console.log('[markMessagesAsRead] 标记成功')
    return true
  } catch (error) {
    console.error('[markMessagesAsRead] 异常:', error)
    return false
  }
}

/**
 * 获取私信会话列表 - 使用后端 API
 */
export async function getConversations(): Promise<Conversation[]> {
  try {
    console.log('[getConversations] 获取会话列表')

    const token = getToken()
    if (!token) {
      console.log('[getConversations] 无token')
      return []
    }

    const response = await fetch('/api/messages/conversations', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    console.log('[getConversations] 响应状态:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[getConversations] 获取失败:', response.status, errorText)
      return []
    }

    const result = await response.json()
    console.log('[getConversations] 获取成功:', result.data?.length || 0, '个会话', result)
    return result.data || []
  } catch (error) {
    console.error('[getConversations] 异常:', error)
    return []
  }
}

/**
 * 获取未读消息数 - 使用后端 API
 */
export async function getUnreadMessageCounts(userId: string): Promise<Record<string, number>> {
  try {
    console.log('[getUnreadMessageCounts] 获取未读数:', userId)

    const token = getToken()
    if (!token) {
      return {}
    }

    const response = await fetch('/api/messages/unread', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      console.error('[getUnreadMessageCounts] 获取失败:', response.status)
      return {}
    }

    const result = await response.json()
    console.log('[getUnreadMessageCounts] 未读数:', result.data)
    return result.data || {}
  } catch (error) {
    console.error('[getUnreadMessageCounts] 异常:', error)
    return {}
  }
}

/**
 * 发送好友请求 - 使用 Supabase（好友系统暂时保留）
 */
export async function sendFriendRequest(
  senderId: string,
  receiverId: string
): Promise<FriendRequest | null> {
  try {
    console.log('[sendFriendRequest] 发送好友请求:', { senderId, receiverId })

    // 检查是否已经是好友
    const { data: existingFriend } = await supabase
      .from('friend_requests')
      .select('*')
      .or(`and(sender_id.eq.${senderId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${senderId})`)
      .eq('status', 'accepted')
      .single()

    if (existingFriend) {
      console.log('[sendFriendRequest] 已经是好友')
      throw new Error('ALREADY_FRIENDS')
    }

    // 检查是否已有待处理的请求
    const { data: pendingRequest } = await supabase
      .from('friend_requests')
      .select('*')
      .eq('sender_id', senderId)
      .eq('receiver_id', receiverId)
      .eq('status', 'pending')
      .single()

    if (pendingRequest) {
      console.log('[sendFriendRequest] 已有待处理请求')
      return pendingRequest
    }

    // 创建新的好友请求
    const { data, error } = await supabase
      .from('friend_requests')
      .insert({
        sender_id: senderId,
        receiver_id: receiverId,
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      console.error('[sendFriendRequest] 发送失败:', error)
      throw new Error(error.message)
    }

    console.log('[sendFriendRequest] 发送成功:', data)
    return data
  } catch (error: any) {
    console.error('[sendFriendRequest] 异常:', error)
    throw error
  }
}

/**
 * 接受好友请求
 */
export async function acceptFriendRequest(requestId: string): Promise<boolean> {
  try {
    console.log('[acceptFriendRequest] 接受好友请求:', requestId)

    const { error } = await supabase
      .from('friend_requests')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', requestId)

    if (error) {
      console.error('[acceptFriendRequest] 接受失败:', error)
      return false
    }

    console.log('[acceptFriendRequest] 接受成功')
    return true
  } catch (error) {
    console.error('[acceptFriendRequest] 异常:', error)
    return false
  }
}

/**
 * 拒绝好友请求
 */
export async function rejectFriendRequest(requestId: string): Promise<boolean> {
  try {
    console.log('[rejectFriendRequest] 拒绝好友请求:', requestId)

    const { error } = await supabase
      .from('friend_requests')
      .update({ status: 'rejected', updated_at: new Date().toISOString() })
      .eq('id', requestId)

    if (error) {
      console.error('[rejectFriendRequest] 拒绝失败:', error)
      return false
    }

    console.log('[rejectFriendRequest] 拒绝成功')
    return true
  } catch (error) {
    console.error('[rejectFriendRequest] 异常:', error)
    return false
  }
}

/**
 * 获取好友请求列表
 */
export async function getFriendRequests(userId: string): Promise<FriendRequest[]> {
  try {
    console.log('[getFriendRequests] 获取好友请求:', userId)

    const { data, error } = await supabase
      .from('friend_requests')
      .select('*')
      .eq('receiver_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[getFriendRequests] 获取失败:', error)
      return []
    }

    console.log('[getFriendRequests] 获取成功:', data?.length || 0, '条请求')
    return data || []
  } catch (error) {
    console.error('[getFriendRequests] 异常:', error)
    return []
  }
}

/**
 * 检查是否是好友
 */
export async function checkIsFriend(userId: string, otherUserId: string): Promise<boolean> {
  try {
    console.log('[checkIsFriend] 检查好友关系:', { userId, otherUserId })

    const { data, error } = await supabase
      .from('friend_requests')
      .select('*')
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`)
      .eq('status', 'accepted')
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('[checkIsFriend] 检查失败:', error)
      return false
    }

    const isFriend = !!data
    console.log('[checkIsFriend] 检查结果:', isFriend)
    return isFriend
  } catch (error) {
    console.error('[checkIsFriend] 异常:', error)
    return false
  }
}

/**
 * 删除好友
 */
export async function deleteFriend(userId: string, friendId: string): Promise<boolean> {
  try {
    console.log('[deleteFriend] 删除好友:', { userId, friendId })

    const { error } = await supabase
      .from('friend_requests')
      .delete()
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${userId})`)
      .eq('status', 'accepted')

    if (error) {
      console.error('[deleteFriend] 删除失败:', error)
      return false
    }

    console.log('[deleteFriend] 删除成功')
    return true
  } catch (error) {
    console.error('[deleteFriend] 异常:', error)
    return false
  }
}
