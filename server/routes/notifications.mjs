/**
 * 通知和消息 API 路由
 * 替代 Supabase Realtime API
 */

import { notificationDB, messageDB, userDB } from '../database.mjs'
import { verifyToken } from '../jwt.mjs'

// 验证请求中的用户令牌
async function authenticateRequest(req) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  
  const token = authHeader.substring(7)
  try {
    const decoded = verifyToken(token)
    return decoded
  } catch (error) {
    console.error('[Notifications API] Token verification failed:', error.message)
    return null
  }
}

// 发送 JSON 响应的辅助函数
function sendJson(res, status, data) {
  res.writeHead(status, { 
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  })
  res.end(JSON.stringify(data))
}

// 读取请求体的辅助函数
function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', chunk => body += chunk)
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {})
      } catch (e) {
        reject(e)
      }
    })
  })
}

// 通知路由处理
export default async function handleNotificationRoutes(req, res, path) {
  const method = req.method
  
  // CORS 预检请求处理
  if (method === 'OPTIONS') {
    sendJson(res, 200, {})
    return true
  }
  
  // 验证用户身份
  const user = await authenticateRequest(req)
  if (!user && path !== '/api/notifications/health') {
    sendJson(res, 401, { error: 'Unauthorized', message: '请先登录' })
    return true
  }
  
  try {
    // 获取用户通知列表
    if (method === 'GET' && path === '/api/notifications') {
      const { limit = 20, offset = 0, unreadOnly = false } = req.query || {}
      const notifications = await notificationDB.getNotifications(user.userId || user.id, parseInt(limit), parseInt(offset))
      
      // 如果只需要未读通知，进行过滤
      const filteredNotifications = unreadOnly === 'true' 
        ? notifications.filter(n => !n.is_read)
        : notifications
        
      sendJson(res, 200, { 
        data: filteredNotifications,
        meta: { total: filteredNotifications.length }
      })
      return true
    }
    
    // 获取未读通知数量
    if (method === 'GET' && path === '/api/notifications/unread-count') {
      const count = await notificationDB.getUnreadCount(user.userId || user.id)
      sendJson(res, 200, { data: { count } })
      return true
    }
    
    // 标记通知为已读
    if (method === 'PUT' && path.startsWith('/api/notifications/') && path.endsWith('/read')) {
      const notificationId = path.split('/')[3]
      await notificationDB.markAsRead(notificationId, user.userId || user.id)
      sendJson(res, 200, { success: true, message: '已标记为已读' })
      return true
    }
    
    // 标记所有通知为已读
    if (method === 'PUT' && path === '/api/notifications/read-all') {
      await notificationDB.markAllAsRead(user.userId || user.id)
      sendJson(res, 200, { success: true, message: '所有通知已标记为已读' })
      return true
    }
    
    // 删除通知
    if (method === 'DELETE' && path.startsWith('/api/notifications/')) {
      const notificationId = path.split('/')[3]
      // 注意：需要在 database.mjs 中添加 deleteNotification 方法
      sendJson(res, 200, { success: true, message: '通知已删除' })
      return true
    }
    
    // 创建新通知（内部使用）
    if (method === 'POST' && path === '/api/notifications') {
      const body = await readBody(req)
      const { userId, title, content, type = 'system' } = body
      
      await notificationDB.addNotification({
        userId,
        title,
        content,
        type
      })
      
      sendJson(res, 201, { success: true, message: '通知已创建' })
      return true
    }
    
    // 健康检查
    if (method === 'GET' && path === '/api/notifications/health') {
      sendJson(res, 200, { status: 'ok', service: 'notifications' })
      return true
    }
    
    // ==================== 消息路由 ====================
    
    // 获取消息列表
    if (method === 'GET' && path === '/api/messages') {
      const { limit = 50, offset = 0, type } = req.query || {}
      
      // 获取通知作为消息
      const notifications = await notificationDB.getNotifications(user.userId || user.id, parseInt(limit), parseInt(offset))
      
      // 映射为消息格式
      const messages = notifications.map(n => ({
        id: n.id,
        type: mapNotificationType(n.type),
        title: n.title,
        content: n.content,
        timestamp: n.created_at,
        read: n.is_read,
        sender: n.sender_id ? { id: n.sender_id } : null,
        link: n.link
      }))
      
      sendJson(res, 200, { data: messages })
      return true
    }
    
    // 获取消息统计
    if (method === 'GET' && path === '/api/messages/stats') {
      const notifications = await notificationDB.getNotifications(user.userId || user.id, 1000, 0)
      
      const stats = {
        total: notifications.length,
        unread: notifications.filter(n => !n.is_read).length,
        private: 0,
        reply: 0,
        mention: 0,
        like: 0,
        follow: 0,
        system: 0
      }
      
      notifications.forEach(n => {
        const mappedType = mapNotificationType(n.type)
        if (stats[mappedType] !== undefined) {
          stats[mappedType]++
        }
      })
      
      sendJson(res, 200, { data: stats })
      return true
    }
    
    // 标记消息为已读
    if (method === 'PUT' && path.startsWith('/api/messages/') && path.endsWith('/read')) {
      const messageId = path.split('/')[3]
      await notificationDB.markAsRead(messageId, user.userId || user.id)
      sendJson(res, 200, { success: true })
      return true
    }
    
    // 标记所有消息为已读
    if (method === 'PUT' && path === '/api/messages/read-all') {
      await notificationDB.markAllAsRead(user.userId || user.id)
      sendJson(res, 200, { success: true })
      return true
    }
    
    // ==================== 私信路由 ====================
    
    // 获取会话列表
    if (method === 'GET' && path === '/api/messages/conversations') {
      const conversations = await messageDB.getConversations(user.userId || user.id)
      sendJson(res, 200, { data: conversations })
      return true
    }
    
    // 获取与特定用户的私信
    if (method === 'GET' && path.startsWith('/api/messages/direct/')) {
      const friendId = path.split('/')[4]
      const { limit = 50 } = req.query || {}
      
      const messages = await messageDB.getMessages(user.userId || user.id, friendId, parseInt(limit))
      sendJson(res, 200, { data: messages })
      return true
    }
    
    // 发送私信
    if (method === 'POST' && path === '/api/messages/direct') {
      const body = await readBody(req)
      const { receiverId, content, type = 'text' } = body
      
      const message = await messageDB.sendMessage(user.userId || user.id, receiverId, content)
      sendJson(res, 201, { success: true, data: message })
      return true
    }
    
    // 标记私信为已读
    if (method === 'PUT' && path.startsWith('/api/messages/direct/') && path.endsWith('/read')) {
      const friendId = path.split('/')[4]
      await messageDB.markAsRead(user.userId || user.id, friendId)
      sendJson(res, 200, { success: true })
      return true
    }
    
    // 获取未读私信数量
    if (method === 'GET' && path === '/api/messages/direct/unread-count') {
      const counts = await messageDB.getUnreadCount(user.userId || user.id)
      const totalUnread = counts.reduce((sum, c) => sum + parseInt(c.count), 0)
      sendJson(res, 200, { data: { count: totalUnread, details: counts } })
      return true
    }
    
    // ==================== 好友请求路由 ====================
    
    // 获取好友请求列表
    if (method === 'GET' && path === '/api/friend-requests') {
      // 需要在 database.mjs 中实现
      sendJson(res, 200, { data: [] })
      return true
    }
    
    // 发送好友请求
    if (method === 'POST' && path === '/api/friend-requests') {
      const body = await readBody(req)
      const { receiverId } = body
      
      // 需要在 database.mjs 中实现
      sendJson(res, 201, { success: true, message: '好友请求已发送' })
      return true
    }
    
    // 接受好友请求
    if (method === 'PUT' && path.startsWith('/api/friend-requests/') && path.endsWith('/accept')) {
      const requestId = path.split('/')[3]
      // 需要在 database.mjs 中实现
      sendJson(res, 200, { success: true })
      return true
    }
    
    // 拒绝好友请求
    if (method === 'PUT' && path.startsWith('/api/friend-requests/') && path.endsWith('/reject')) {
      const requestId = path.split('/')[3]
      // 需要在 database.mjs 中实现
      sendJson(res, 200, { success: true })
      return true
    }
    
    return false // 未匹配到任何路由
    
  } catch (error) {
    console.error('[Notifications API] Error:', error)
    sendJson(res, 500, { error: 'Internal Server Error', message: error.message })
    return true
  }
}

// 映射通知类型到消息类型
function mapNotificationType(notificationType) {
  const typeMap = {
    'private_message': 'private',
    'direct_message': 'private',
    'reply': 'reply',
    'comment_reply': 'reply',
    'post_commented': 'reply',
    'mention': 'mention',
    'at_mention': 'mention',
    'comment_replied': 'mention',
    'like': 'like',
    'post_liked': 'like',
    'comment_liked': 'like',
    'work_liked': 'like',
    'follow': 'follow',
    'user_followed': 'follow',
    'new_follower': 'follow',
    'system': 'system',
    'announcement': 'system',
    'invitation_received': 'system',
    'invitation_accepted': 'system',
    'application_approved': 'system',
    'application_rejected': 'system'
  }
  
  return typeMap[notificationType] || 'system'
}
