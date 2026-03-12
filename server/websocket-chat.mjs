/**
 * WebSocket 聊天服务器
 * 支持实时消息广播、用户身份验证、会话管理
 */

import { verifyToken } from './jwt.mjs';
import { getDB } from './database.mjs';

// 存储连接的客户端
const clients = new Map();

// 存储用户会话
const userSessions = new Map();

// 获取 WebSocket 客户端信息
export function getClientInfo(ws) {
  return clients.get(ws);
}

// 广播消息给所有连接的客户端
export function broadcast(message, excludeWs = null) {
  const messageStr = JSON.stringify(message);
  clients.forEach((clientInfo, ws) => {
    if (ws !== excludeWs && ws.readyState === 1) { // WebSocket.OPEN = 1
      ws.send(messageStr);
    }
  });
}

// 发送消息给特定用户
export function sendToUser(userId, message) {
  const messageStr = JSON.stringify(message);
  let sent = false;
  
  clients.forEach((clientInfo, ws) => {
    if (clientInfo.userId === userId && ws.readyState === 1) {
      ws.send(messageStr);
      sent = true;
    }
  });
  
  return sent;
}

// 发送消息给多个用户
export function sendToUsers(userIds, message) {
  const messageStr = JSON.stringify(message);
  const userIdSet = new Set(userIds);
  
  clients.forEach((clientInfo, ws) => {
    if (userIdSet.has(clientInfo.userId) && ws.readyState === 1) {
      ws.send(messageStr);
    }
  });
}

// 处理 WebSocket 连接
export async function handleWebSocketConnection(ws, req) {
  console.log('[WebSocket] 新客户端连接');
  
  // 初始化客户端信息
  const clientInfo = {
    ws,
    userId: null,
    username: null,
    isAuthenticated: false,
    connectedAt: new Date(),
    lastPing: Date.now()
  };
  
  clients.set(ws, clientInfo);
  
  // 发送欢迎消息
  ws.send(JSON.stringify({
    type: 'welcome',
    payload: {
      message: '已连接到聊天服务器',
      timestamp: Date.now()
    }
  }));
  
  // 广播用户上线通知（匿名用户不广播）
  broadcast({
    type: 'user:online',
    payload: {
      userCount: clients.size,
      timestamp: Date.now()
    }
  }, ws);
  
  // 处理消息
  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());
      await handleMessage(ws, clientInfo, message);
    } catch (error) {
      console.error('[WebSocket] 消息处理错误:', error);
      ws.send(JSON.stringify({
        type: 'error',
        payload: { message: '消息格式错误' }
      }));
    }
  });
  
  // 处理关闭
  ws.on('close', () => {
    console.log('[WebSocket] 客户端断开连接');
    handleDisconnect(ws, clientInfo);
  });
  
  // 处理错误
  ws.on('error', (error) => {
    console.error('[WebSocket] 连接错误:', error);
  });
}

// 处理收到的消息
async function handleMessage(ws, clientInfo, message) {
  const { type, payload } = message;
  
  switch (type) {
    case 'ping':
      // 心跳检测
      clientInfo.lastPing = Date.now();
      ws.send(JSON.stringify({
        type: 'pong',
        payload: { timestamp: Date.now() }
      }));
      break;
      
    case 'auth':
      // 用户认证
      await handleAuth(ws, clientInfo, payload);
      break;
      
    case 'chat:message':
      // 处理聊天消息
      await handleChatMessage(ws, clientInfo, payload);
      break;
      
    case 'chat:typing':
      // 处理正在输入状态
      handleTypingStatus(ws, clientInfo, payload);
      break;
      
    case 'chat:read':
      // 处理已读回执
      await handleReadReceipt(ws, clientInfo, payload);
      break;
      
    case 'chat:history':
      // 获取历史消息
      await handleGetHistory(ws, clientInfo, payload);
      break;
      
    default:
      ws.send(JSON.stringify({
        type: 'error',
        payload: { message: `未知的消息类型: ${type}` }
      }));
  }
}

// 处理用户认证
async function handleAuth(ws, clientInfo, payload) {
  const { token } = payload;
  
  try {
    const decoded = verifyToken(token);
    
    if (!decoded) {
      ws.send(JSON.stringify({
        type: 'auth:error',
        payload: { message: '无效的令牌' }
      }));
      return;
    }
    
    // 获取用户信息
    const db = await getDB();
    const { rows } = await db.query(
      'SELECT id, username, avatar_url FROM users WHERE id = $1',
      [decoded.userId || decoded.sub]
    );
    
    if (rows.length === 0) {
      ws.send(JSON.stringify({
        type: 'auth:error',
        payload: { message: '用户不存在' }
      }));
      return;
    }
    
    const user = rows[0];
    
    // 更新客户端信息
    clientInfo.userId = user.id;
    clientInfo.username = user.username;
    clientInfo.isAuthenticated = true;
    
    // 存储用户会话
    if (!userSessions.has(user.id)) {
      userSessions.set(user.id, new Set());
    }
    userSessions.get(user.id).add(ws);
    
    // 发送认证成功消息
    ws.send(JSON.stringify({
      type: 'auth:success',
      payload: {
        userId: user.id,
        username: user.username,
        avatarUrl: user.avatar_url
      }
    }));
    
    // 广播用户上线通知
    broadcast({
      type: 'user:joined',
      payload: {
        userId: user.id,
        username: user.username,
        timestamp: Date.now()
      }
    }, ws);
    
    console.log(`[WebSocket] 用户认证成功: ${user.username} (${user.id})`);
    
  } catch (error) {
    console.error('[WebSocket] 认证错误:', error);
    ws.send(JSON.stringify({
      type: 'auth:error',
      payload: { message: '认证失败' }
    }));
  }
}

// 处理聊天消息
async function handleChatMessage(ws, clientInfo, payload) {
  const { content, receiverId, messageType = 'text' } = payload;
  
  // 检查是否已认证
  if (!clientInfo.isAuthenticated) {
    ws.send(JSON.stringify({
      type: 'chat:error',
      payload: { message: '请先登录' }
    }));
    return;
  }
  
  // 验证消息内容
  if (!content || content.trim().length === 0) {
    ws.send(JSON.stringify({
      type: 'chat:error',
      payload: { message: '消息内容不能为空' }
    }));
    return;
  }
  
  try {
    const db = await getDB();
    
    // 保存消息到数据库
    const { rows } = await db.query(
      `INSERT INTO direct_messages (sender_id, receiver_id, content, is_read, created_at) 
       VALUES ($1, $2, $3, false, NOW()) 
       RETURNING *`,
      [clientInfo.userId, receiverId, content.trim()]
    );
    
    const message = rows[0];
    
    // 构造消息对象
    const messageData = {
      type: 'chat:message',
      payload: {
        id: message.id,
        senderId: clientInfo.userId,
        senderName: clientInfo.username,
        receiverId: receiverId,
        content: message.content,
        messageType: messageType,
        createdAt: message.created_at,
        timestamp: Date.now()
      }
    };
    
    // 发送给发送者（确认消息已发送）
    ws.send(JSON.stringify({
      type: 'chat:sent',
      payload: {
        messageId: message.id,
        tempId: payload.tempId, // 临时ID，用于前端匹配
        timestamp: Date.now()
      }
    }));
    
    // 发送给接收者（如果在线）
    const sent = sendToUser(receiverId, messageData);
    
    // 如果接收者不在线，可以在这里添加离线消息通知逻辑
    if (!sent) {
      console.log(`[WebSocket] 用户 ${receiverId} 不在线，消息已保存到数据库`);
    }
    
  } catch (error) {
    console.error('[WebSocket] 发送消息错误:', error);
    ws.send(JSON.stringify({
      type: 'chat:error',
      payload: { message: '发送消息失败' }
    }));
  }
}

// 处理正在输入状态
function handleTypingStatus(ws, clientInfo, payload) {
  if (!clientInfo.isAuthenticated) return;
  
  const { receiverId, isTyping } = payload;
  
  // 发送给接收者
  sendToUser(receiverId, {
    type: 'chat:typing',
    payload: {
      userId: clientInfo.userId,
      username: clientInfo.username,
      isTyping: isTyping,
      timestamp: Date.now()
    }
  });
}

// 处理已读回执
async function handleReadReceipt(ws, clientInfo, payload) {
  if (!clientInfo.isAuthenticated) return;
  
  const { senderId } = payload;
  
  try {
    const db = await getDB();
    
    // 更新数据库中的已读状态
    await db.query(
      `UPDATE direct_messages 
       SET is_read = true 
       WHERE sender_id = $1 AND receiver_id = $2 AND is_read = false`,
      [senderId, clientInfo.userId]
    );
    
    // 通知发送者消息已读
    sendToUser(senderId, {
      type: 'chat:read',
      payload: {
        readerId: clientInfo.userId,
        readerName: clientInfo.username,
        timestamp: Date.now()
      }
    });
    
  } catch (error) {
    console.error('[WebSocket] 已读回执错误:', error);
  }
}

// 获取历史消息
async function handleGetHistory(ws, clientInfo, payload) {
  if (!clientInfo.isAuthenticated) {
    ws.send(JSON.stringify({
      type: 'chat:error',
      payload: { message: '请先登录' }
    }));
    return;
  }
  
  const { friendId, limit = 50, offset = 0 } = payload;
  
  try {
    const db = await getDB();
    
    const { rows } = await db.query(
      `SELECT dm.*, 
              sender.username as sender_name, 
              sender.avatar_url as sender_avatar
       FROM direct_messages dm
       JOIN users sender ON dm.sender_id = sender.id
       WHERE (dm.sender_id = $1 AND dm.receiver_id = $2) 
          OR (dm.sender_id = $2 AND dm.receiver_id = $1)
       ORDER BY dm.created_at DESC
       LIMIT $3 OFFSET $4`,
      [clientInfo.userId, friendId, limit, offset]
    );
    
    ws.send(JSON.stringify({
      type: 'chat:history',
      payload: {
        messages: rows.reverse(), // 按时间正序返回
        friendId: friendId,
        hasMore: rows.length === limit
      }
    }));
    
  } catch (error) {
    console.error('[WebSocket] 获取历史消息错误:', error);
    ws.send(JSON.stringify({
      type: 'chat:error',
      payload: { message: '获取历史消息失败' }
    }));
  }
}

// 处理断开连接
function handleDisconnect(ws, clientInfo) {
  // 从客户端列表中移除
  clients.delete(ws);
  
  // 从用户会话中移除
  if (clientInfo.userId && userSessions.has(clientInfo.userId)) {
    userSessions.get(clientInfo.userId).delete(ws);
    
    // 如果用户没有更多连接，删除会话记录
    if (userSessions.get(clientInfo.userId).size === 0) {
      userSessions.delete(clientInfo.userId);
      
      // 广播用户离线通知
      broadcast({
        type: 'user:left',
        payload: {
          userId: clientInfo.userId,
          username: clientInfo.username,
          timestamp: Date.now()
        }
      });
    }
  }
  
  // 广播在线用户数量更新
  broadcast({
    type: 'user:online',
    payload: {
      userCount: clients.size,
      timestamp: Date.now()
    }
  });
  
  console.log(`[WebSocket] 客户端断开连接，当前在线: ${clients.size} 人`);
}

// 获取在线用户列表
export function getOnlineUsers() {
  const users = [];
  clients.forEach((clientInfo) => {
    if (clientInfo.isAuthenticated && !users.find(u => u.userId === clientInfo.userId)) {
      users.push({
        userId: clientInfo.userId,
        username: clientInfo.username
      });
    }
  });
  return users;
}

// 定期清理不活跃的连接（每 30 秒）
setInterval(() => {
  const now = Date.now();
  const timeout = 60000; // 60 秒无响应视为超时
  
  clients.forEach((clientInfo, ws) => {
    if (now - clientInfo.lastPing > timeout) {
      console.log('[WebSocket] 关闭不活跃的连接');
      ws.close();
    }
  });
}, 30000);

console.log('[WebSocket Chat] 模块已加载');
