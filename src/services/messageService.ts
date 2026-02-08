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

export interface FriendRequest {
  id: string
  sender_id: string
  receiver_id: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
}

// 获取 token
function getToken(): string | null {
  return typeof window !== 'undefined' ? localStorage.getItem('token') : null
}

/**
 * 发送私信 - 使用后端 API
 */
export async function sendDirectMessage(
  senderId: string,
  receiverId: string,
  content: string
): Promise<Message | null> {
  try {
    console.log('[sendDirectMessage] 发送消息:', { senderId, receiverId, content })

    const token = getToken()
    if (!token) {
      throw new Error('请先登录')
    }

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

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || '发送失败')
    }

    const result = await response.json()
    console.log('[sendDirectMessage] 发送成功:', result.data)
    return result.data
  } catch (error: any) {
    console.error('[sendDirectMessage] 异常:', error)
    throw error
  }
}

/**
 * 获取与某个用户的私信记录 - 使用后端 API
 */
export async function getDirectMessages(
  userId: string,
  otherUserId: string,
  limit: number = 50
): Promise<Message[]> {
  try {
    console.log('[getDirectMessages] 获取消息:', { userId, otherUserId })

    const token = getToken()
    if (!token) {
      return []
    }

    const response = await fetch(`/api/messages/${otherUserId}?limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      console.error('[getDirectMessages] 获取失败:', response.status)
      return []
    }

    const result = await response.json()
    console.log('[getDirectMessages] 获取成功:', result.data?.length || 0, '条消息')
    return result.data || []
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

    const response = await fetch(`/api/messages/${senderId}/read`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
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
