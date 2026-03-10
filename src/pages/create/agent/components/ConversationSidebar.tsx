import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useConversationStore, autoSaveSession } from '../hooks/useConversationStore';
import { useAgentStore } from '../hooks/useAgentStore';
import {
  Plus,
  MessageSquare,
  Trash2,
  Edit2,
  Check,
  X,
  Clock,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import type { ConversationSession } from '../types/agent';

interface ConversationSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function ConversationSidebar({ isOpen, onToggle }: ConversationSidebarProps) {
  const { isDark } = useTheme();
  const {
    sessions,
    currentSessionId,
    createSession,
    switchSession,
    deleteSession,
    updateSessionTitle,
    saveCurrentSession
  } = useConversationStore();

  const { messages } = useAgentStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(null);

  // 自动保存当前会话
  useEffect(() => {
    const interval = setInterval(() => {
      saveCurrentSession();
    }, 5000); // 每5秒自动保存

    return () => clearInterval(interval);
  }, [saveCurrentSession]);

  // 当消息变化时自动保存
  useEffect(() => {
    autoSaveSession();
  }, [messages.length]);

  // 处理创建新会话
  const handleCreateSession = () => {
    const newId = createSession();
    toast.success('新会话已创建');
  };

  // 处理切换会话
  const handleSwitchSession = (sessionId: string) => {
    if (sessionId === currentSessionId) return;
    switchSession(sessionId);
    toast.success('已切换会话');
  };

  // 处理删除会话
  const handleDeleteSession = (sessionId: string) => {
    deleteSession(sessionId);
    setShowConfirmDelete(null);
    toast.success('会话已删除');
  };

  // 开始编辑标题
  const startEditing = (session: ConversationSession) => {
    setEditingId(session.id);
    setEditTitle(session.title);
  };

  // 保存编辑
  const saveEdit = () => {
    if (editingId && editTitle.trim()) {
      updateSessionTitle(editingId, editTitle.trim());
      setEditingId(null);
      toast.success('标题已更新');
    }
  };

  // 取消编辑
  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
  };

  // 格式化时间
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return '昨天';
    } else if (days < 7) {
      return `${days}天前`;
    } else {
      return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    }
  };

  // 获取会话预览文本
  const getSessionPreview = (session: ConversationSession): string => {
    if (session.description) return session.description;
    const firstUserMessage = session.stateSnapshot.messages.find(m => m.role === 'user');
    if (firstUserMessage) {
      return firstUserMessage.content.slice(0, 50) + (firstUserMessage.content.length > 50 ? '...' : '');
    }
    return '新开始的设计对话';
  };

  return (
    <>
      {/* 侧边栏 */}
      <motion.div
        initial={false}
        animate={{
          width: isOpen ? 280 : 0,
          opacity: isOpen ? 1 : 0
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="flex-shrink-0 h-full overflow-hidden border-r"
        style={{
          borderColor: isDark ? '#374151' : '#e5e7eb'
        }}
      >
        <div className="w-[280px] h-full flex flex-col" style={{
          backgroundColor: isDark ? '#111827' : '#f9fafb'
        }}>
          {/* 头部 */}
          <div className="p-4 border-b" style={{
            borderColor: isDark ? '#374151' : '#e5e7eb'
          }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                会话历史
              </h2>
              <motion.button
                onClick={onToggle}
                className={`p-1.5 rounded-lg transition-colors ${
                  isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-200 text-gray-500'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ChevronLeft className="w-4 h-4" />
              </motion.button>
            </div>

            {/* 新建会话按钮 */}
            <motion.button
              onClick={handleCreateSession}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium transition-all ${
                isDark
                  ? 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-700'
                  : 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 shadow-sm'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus className="w-4 h-4" />
              新建会话
            </motion.button>
          </div>

          {/* 会话列表 */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {sessions.length === 0 ? (
              <div className={`text-center py-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">暂无会话记录</p>
                <p className="text-xs mt-1">点击上方按钮开始新对话</p>
              </div>
            ) : (
              sessions.map((session, index) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`group relative p-3 rounded-xl cursor-pointer transition-all ${
                    currentSessionId === session.id
                      ? isDark
                        ? 'bg-[#C02C38]/20 border border-[#C02C38]/30'
                        : 'bg-[#C02C38]/10 border border-[#C02C38]/20'
                      : isDark
                        ? 'hover:bg-gray-800 border border-transparent'
                        : 'hover:bg-white hover:shadow-sm border border-transparent'
                  }`}
                  onClick={() => handleSwitchSession(session.id)}
                >
                  {/* 会话信息 */}
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      currentSessionId === session.id
                        ? 'bg-[#C02C38] text-white'
                        : isDark
                          ? 'bg-gray-700 text-gray-400'
                          : 'bg-gray-200 text-gray-500'
                    }`}>
                      <MessageSquare className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      {editingId === session.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEdit();
                              if (e.key === 'Escape') cancelEdit();
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className={`flex-1 text-sm px-2 py-1 rounded border outline-none ${
                              isDark
                                ? 'bg-gray-800 border-gray-600 text-white'
                                : 'bg-white border-gray-300 text-gray-900'
                            }`}
                            autoFocus
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              saveEdit();
                            }}
                            className="p-1 rounded hover:bg-green-500/20 text-green-500"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              cancelEdit();
                            }}
                            className="p-1 rounded hover:bg-red-500/20 text-red-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <h3 className={`text-sm font-medium truncate ${
                            currentSessionId === session.id
                              ? isDark ? 'text-white' : 'text-gray-900'
                              : isDark ? 'text-gray-200' : 'text-gray-700'
                          }`}>
                            {session.title}
                          </h3>
                          <p className={`text-xs mt-0.5 line-clamp-2 ${
                            isDark ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            {getSessionPreview(session)}
                          </p>
                        </>
                      )}

                      {/* 时间和消息数 */}
                      <div className={`flex items-center gap-2 mt-2 text-xs ${
                        isDark ? 'text-gray-500' : 'text-gray-400'
                      }`}>
                        <Clock className="w-3 h-3" />
                        <span>{formatTime(session.updatedAt)}</span>
                        <span>·</span>
                        <span>{session.messageCount} 条消息</span>
                      </div>
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  {editingId !== session.id && (
                    <div className={`absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${
                      isDark ? 'bg-gray-800/90' : 'bg-white/90'
                    } rounded-lg p-1`}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditing(session);
                        }}
                        className={`p-1.5 rounded transition-colors ${
                          isDark
                            ? 'hover:bg-gray-700 text-gray-400'
                            : 'hover:bg-gray-100 text-gray-500'
                        }`}
                        title="编辑标题"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowConfirmDelete(session.id);
                        }}
                        className={`p-1.5 rounded transition-colors ${
                          isDark
                            ? 'hover:bg-red-500/20 text-red-400'
                            : 'hover:bg-red-50 text-red-500'
                        }`}
                        title="删除会话"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  {/* 当前会话指示器 */}
                  {currentSessionId === session.id && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#C02C38] rounded-r-full" />
                  )}
                </motion.div>
              ))
            )}
          </div>

          {/* 底部信息 */}
          <div className={`p-3 border-t text-xs text-center ${
            isDark ? 'border-gray-800 text-gray-500' : 'border-gray-200 text-gray-400'
          }`}>
            共 {sessions.length} 个会话
          </div>
        </div>
      </motion.div>

      {/* 展开按钮（当侧边栏关闭时显示） */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onClick={onToggle}
            className={`absolute left-0 top-20 z-10 p-2 rounded-r-xl shadow-lg transition-colors ${
              isDark
                ? 'bg-gray-800 hover:bg-gray-700 text-gray-400'
                : 'bg-white hover:bg-gray-50 text-gray-500'
            }`}
            style={{ borderLeft: 'none' }}
          >
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* 删除确认弹窗 */}
      <AnimatePresence>
        {showConfirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={() => setShowConfirmDelete(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`p-6 rounded-2xl shadow-xl max-w-sm mx-4 ${
                isDark ? 'bg-gray-800' : 'bg-white'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className={`text-lg font-semibold mb-2 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                确认删除
              </h3>
              <p className={`text-sm mb-4 ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}>
                确定要删除这个会话吗？此操作无法撤销。
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmDelete(null)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                    isDark
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  取消
                </button>
                <button
                  onClick={() => showConfirmDelete && handleDeleteSession(showConfirmDelete)}
                  className="flex-1 py-2 rounded-xl text-sm font-medium bg-red-500 hover:bg-red-600 text-white transition-colors"
                >
                  删除
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
