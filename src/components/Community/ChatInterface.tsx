// 聊天界面组件
import React, { useState, useEffect } from 'react'
import { useCommunityStore } from '../../stores/communityStore'
import { MessageCircle, Send, Search, User, X, ArrowLeft } from 'lucide-react'
import LazyImage from '../LazyImage'
import type { UserProfile } from '../../lib/supabase'

interface ChatInterfaceProps {
  isOpen: boolean
  onClose: () => void
  initialFriendId?: string
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  isOpen, 
  onClose, 
  initialFriendId 
}) => {
  const [messageInput, setMessageInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  
  // 从状态管理获取数据和方法
  const {
    chatSessions,
    currentChat,
    chatMessages,
    chatLoading,
    currentUser,
    sendMessage,
    fetchChatMessages,
    fetchChatSessions,
    setCurrentChat,
    markMessagesAsRead
  } = useCommunityStore()
  
  // 初始化聊天会话和消息
  useEffect(() => {
    if (isOpen) {
      fetchChatSessions()
      
      if (initialFriendId) {
        // 查找并设置初始聊天会话
        const initialSession = chatSessions.find(session => 
          session.lastMessage.sender_id === initialFriendId || 
          session.lastMessage.receiver_id === initialFriendId
        )
        
        if (initialSession) {
          setCurrentChat(initialSession)
          fetchChatMessages(initialFriendId)
          markMessagesAsRead(initialFriendId)
        }
      }
    }
  }, [isOpen, initialFriendId])
  
  // 当当前聊天会话变化时，获取聊天消息
  useEffect(() => {
    if (currentChat) {
      const friendId = currentChat.lastMessage.sender_id === currentUser?.id 
        ? currentChat.lastMessage.receiver_id 
        : currentChat.lastMessage.sender_id
      fetchChatMessages(friendId)
      markMessagesAsRead(friendId)
    }
  }, [currentChat])
  
  // 发送消息
  const handleSendMessage = async () => {
    if (!messageInput.trim() || !currentChat || !currentUser) return
    
    const friendId = currentChat.lastMessage.sender_id === currentUser.id 
      ? currentChat.lastMessage.receiver_id 
      : currentChat.lastMessage.sender_id
    
    await sendMessage(friendId, messageInput.trim())
    setMessageInput('')
  }
  
  // 处理键盘事件
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }
  
  // 选择聊天会话
  const selectChatSession = (session: any) => {
    setCurrentChat(session)
  }
  
  // 获取聊天对象信息
  const getChatPartner = (session: any): UserProfile => {
    return session.lastMessage.sender_id === currentUser?.id 
      ? session.lastMessage.receiver 
      : session.lastMessage.sender
  }
  
  // 过滤聊天会话
  const filteredSessions = chatSessions.filter(session => {
    if (!searchTerm.trim()) return true
    
    const partner = getChatPartner(session)
    return partner.username.toLowerCase().includes(searchTerm.toLowerCase())
  })
  
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex flex-col lg:flex-row">
      {/* 聊天会话列表 */}
      <div className="w-full lg:w-80 bg-white border-r border-gray-200 flex-shrink-0">
        {/* 聊天标题栏 */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <MessageCircle className="w-5 h-5 text-primary-500" />
            <h2 className="text-lg font-semibold text-gray-900">私信</h2>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        {/* 搜索框 */}
        <div className="p-3 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索好友..."
              className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {/* 会话列表 */}
        <div className="flex-1 overflow-y-auto">
          {filteredSessions.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <User className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>暂无聊天记录</p>
              <p className="text-sm mt-1">与好友开始聊天吧</p>
            </div>
          ) : (
            filteredSessions.map((session) => {
              const partner = getChatPartner(session)
              const isActive = currentChat?.lastMessage.id === session.lastMessage.id
              
              return (
                <div
                  key={session.lastMessage.id}
                  className={`flex items-center p-4 cursor-pointer transition-colors ${isActive 
                    ? 'bg-primary-50 border-l-4 border-primary-500' 
                    : 'hover:bg-gray-50'}`}
                  onClick={() => selectChatSession(session)}
                >
                  {/* 好友头像 */}
                  <div className="relative mr-3 flex-shrink-0">
                    <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden">
                      <LazyImage
                        src={partner.avatar_url || 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=默认用户头像，简洁现代风格&image_size=square'}
                        alt={partner.username}
                        className="w-full h-full object-cover"
                        placeholder="blur"
                      />
                    </div>
                    {/* 未读消息指示器 */}
                    {session.unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                        {session.unreadCount}
                      </div>
                    )}
                  </div>
                  
                  {/* 会话信息 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-sm text-gray-900 truncate">
                        {partner.username}
                      </h3>
                      <span className="text-xs text-gray-400">
                        {new Date(session.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      {session.lastMessage.content}
                    </p>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
      
      {/* 聊天消息区域 */}
      <div className="flex-1 bg-gray-50 flex flex-col">
        {/* 聊天头部 */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 bg-white">
          {/* 移动端返回按钮 */}
          <button
            className="lg:hidden p-2 mr-2 rounded-full hover:bg-gray-100 transition-colors"
            onClick={() => setCurrentChat(null)}
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          
          {currentChat ? (
            <>
              <div className="flex items-center">
                <div className="mr-3 flex-shrink-0">
                  <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden">
                    <LazyImage
                      src={getChatPartner(currentChat).avatar_url || 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=默认用户头像，简洁现代风格&image_size=square'}
                      alt={getChatPartner(currentChat).username}
                      className="w-full h-full object-cover"
                      placeholder="blur"
                    />
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-gray-900">
                    {getChatPartner(currentChat).username}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {getChatPartner(currentChat).is_verified ? '已认证' : '在线'}
                  </p>
                </div>
              </div>
              
              {/* 关闭按钮 */}
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </>
          ) : (
            <div className="flex-1 text-center">
              <p className="text-gray-500">选择一个聊天会话开始聊天</p>
            </div>
          )}
        </div>
        
        {/* 消息区域 */}
        <div className="flex-1 overflow-y-auto p-4">
          {currentChat ? (
            chatLoading ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
              </div>
            ) : chatMessages.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">暂无消息</p>
                <p className="text-sm mt-1">开始与{getChatPartner(currentChat).username}聊天吧</p>
              </div>
            ) : (
              <div className="space-y-4">
                {chatMessages.map((message) => {
                  const isCurrentUser = message.sender_id === currentUser?.id
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] p-3 rounded-lg ${isCurrentUser 
                          ? 'bg-primary-500 text-white rounded-br-none' 
                          : 'bg-white text-gray-900 rounded-bl-none border border-gray-200'}`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className="text-xs mt-1 opacity-75 text-right">
                          {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          ) : (
            <div className="flex justify-center items-center h-full">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">开始新的对话</p>
                <p className="text-gray-400 text-sm mt-2">从左侧选择一个好友开始聊天</p>
              </div>
            </div>
          )}
        </div>
        
        {/* 消息输入框 */}
        {currentChat && (
          <div className="p-4 border-t border-gray-200 bg-white">
            <div className="flex items-center space-x-3">
              <textarea
                className="flex-1 p-3 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none max-h-32"
                placeholder="输入消息..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={handleKeyPress}
                rows={1}
              />
              <button
                onClick={handleSendMessage}
                disabled={!messageInput.trim()}
                className={`p-3 rounded-full transition-all duration-200 ${!messageInput.trim() 
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                  : 'bg-primary-500 text-white hover:bg-primary-600'}`}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ChatInterface
