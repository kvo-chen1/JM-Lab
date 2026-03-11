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
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import type { ConversationSession } from '../types/agent';
import { fadeInUp, staggerContainer, listItem, cardHover } from '../styles/animations';
import { colors, shadows, radius, transitions } from '../styles/theme';

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
    }, 5000);

    return () => clearInterval(interval);
  }, [saveCurrentSession]);

  // 当消息变化时自动保存
  useEffect(() => {
    autoSaveSession();
  }, [messages.length]);

  // 处理创建新会话
  const handleCreateSession = () => {
    const newId = createSession();
    toast.success('新会话已创建', {
      icon: <Sparkles className="w-4 h-4 text-[#C02C38]" />
    });
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

  // 主题样式
  const themeStyles = {
    sidebar: isDark 
      ? 'bg-[#0A0A0F] border-r border-white/[0.06]' 
      : 'bg-[#FAFAFA] border-r border-black/[0.06]',
    header: isDark 
      ? 'bg-gradient-to-b from-[#15151A] to-[#0A0A0F] border-b border-white/[0.06]' 
      : 'bg-gradient-to-b from-white to-[#FAFAFA] border-b border-black/[0.06]',
    title: isDark ? 'text-white' : 'text-gray-900',
    newButton: isDark 
      ? 'bg-[#1E1E28] hover:bg-[#252532] text-white border border-white/[0.08] shadow-lg shadow-black/20' 
      : 'bg-white hover:bg-gray-50 text-gray-900 border border-black/[0.06] shadow-lg shadow-black/5',
    sessionItem: {
      default: isDark 
        ? 'bg-transparent hover:bg-[#1E1E28] border border-transparent' 
        : 'bg-transparent hover:bg-white border border-transparent',
      active: isDark 
        ? 'bg-[#C02C38]/10 border-[#C02C38]/30 shadow-lg shadow-[#C02C38]/5' 
        : 'bg-[#C02C38]/5 border-[#C02C38]/20 shadow-lg shadow-[#C02C38]/5',
    },
    icon: {
      default: isDark ? 'bg-[#1E1E28] text-gray-400' : 'bg-gray-100 text-gray-500',
      active: 'bg-gradient-to-br from-[#C02C38] to-[#E85D75] text-white shadow-lg shadow-[#C02C38]/30',
    },
    text: {
      primary: isDark ? 'text-white' : 'text-gray-900',
      secondary: isDark ? 'text-gray-400' : 'text-gray-500',
      tertiary: isDark ? 'text-gray-500' : 'text-gray-400',
    },
    actions: isDark ? 'bg-[#15151A]/95 backdrop-blur-sm' : 'bg-white/95 backdrop-blur-sm',
    empty: isDark ? 'text-gray-600' : 'text-gray-400',
    footer: isDark 
      ? 'border-t border-white/[0.06] text-gray-500 bg-[#0A0A0F]' 
      : 'border-t border-black/[0.06] text-gray-400 bg-[#FAFAFA]',
  };

  return (
    <>
      {/* 侧边栏 */}
      <motion.div
        initial={false}
        animate={{
          width: isOpen ? 300 : 0,
          opacity: isOpen ? 1 : 0
        }}
        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
        className={`flex-shrink-0 h-full overflow-hidden ${themeStyles.sidebar}`}
      >
        <div className="w-[300px] h-full flex flex-col">
          {/* 头部 */}
          <div className={`p-5 ${themeStyles.header}`}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#C02C38] to-[#E85D75] flex items-center justify-center shadow-lg shadow-[#C02C38]/30">
                  <MessageSquare className="w-4 h-4 text-white" />
                </div>
                <h2 className={`font-semibold text-lg ${themeStyles.title}`}>
                  会话历史
                </h2>
              </div>
              <motion.button
                onClick={onToggle}
                className={`p-2 rounded-xl transition-all ${
                  isDark 
                    ? 'hover:bg-white/[0.06] text-gray-400 hover:text-white' 
                    : 'hover:bg-black/[0.04] text-gray-500 hover:text-gray-700'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ChevronLeft className="w-5 h-5" />
              </motion.button>
            </div>

            {/* 新建会话按钮 */}
            <motion.button
              onClick={handleCreateSession}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${themeStyles.newButton}`}
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#C02C38] to-[#E85D75] flex items-center justify-center">
                <Plus className="w-4 h-4 text-white" />
              </div>
              <span>新建会话</span>
            </motion.button>
          </div>

          {/* 会话列表 */}
          <motion.div 
            className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {sessions.length === 0 ? (
              <motion.div 
                variants={fadeInUp}
                className={`text-center py-12 ${themeStyles.empty}`}
              >
                <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${
                  isDark ? 'bg-[#1E1E28]' : 'bg-gray-100'
                }`}>
                  <MessageSquare className="w-8 h-8 opacity-40" />
                </div>
                <p className="text-sm font-medium">暂无会话记录</p>
                <p className="text-xs mt-2 opacity-70">点击上方按钮开始新对话</p>
              </motion.div>
            ) : (
              sessions.map((session) => (
                <motion.div
                  key={session.id}
                  variants={listItem}
                  className={`group relative p-3.5 rounded-xl cursor-pointer transition-all duration-250 ${
                    currentSessionId === session.id
                      ? themeStyles.sessionItem.active
                      : themeStyles.sessionItem.default
                  }`}
                  onClick={() => handleSwitchSession(session.id)}
                  whileHover={{ scale: 1.01, y: -1 }}
                  whileTap={{ scale: 0.99 }}
                >
                  {/* 当前会话指示器 */}
                  {currentSessionId === session.id && (
                    <motion.div 
                      layoutId="activeIndicator"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 bg-gradient-to-b from-[#C02C38] to-[#E85D75] rounded-r-full shadow-lg shadow-[#C02C38]/50"
                    />
                  )}

                  {/* 会话信息 */}
                  <div className="flex items-start gap-3">
                    <motion.div 
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-250 ${
                        currentSessionId === session.id
                          ? themeStyles.icon.active
                          : themeStyles.icon.default
                      }`}
                      whileHover={{ rotate: 5 }}
                    >
                      <MessageSquare className="w-5 h-5" />
                    </motion.div>

                    <div className="flex-1 min-w-0">
                      {editingId === session.id ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEdit();
                              if (e.key === 'Escape') cancelEdit();
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className={`flex-1 text-sm px-3 py-1.5 rounded-lg border outline-none transition-all ${
                              isDark
                                ? 'bg-[#0A0A0F] border-white/[0.1] text-white focus:border-[#C02C38]/50 focus:ring-2 focus:ring-[#C02C38]/20'
                                : 'bg-white border-black/[0.08] text-gray-900 focus:border-[#C02C38]/50 focus:ring-2 focus:ring-[#C02C38]/20'
                            }`}
                            autoFocus
                          />
                          <motion.button
                            onClick={(e) => {
                              e.stopPropagation();
                              saveEdit();
                            }}
                            className="p-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-500 transition-colors"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Check className="w-4 h-4" />
                          </motion.button>
                          <motion.button
                            onClick={(e) => {
                              e.stopPropagation();
                              cancelEdit();
                            }}
                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <X className="w-4 h-4" />
                          </motion.button>
                        </div>
                      ) : (
                        <>
                          <h3 className={`text-sm font-semibold truncate transition-colors ${
                            currentSessionId === session.id
                              ? themeStyles.text.primary
                              : themeStyles.text.primary
                          }`}>
                            {session.title}
                          </h3>
                          <p className={`text-xs mt-1 line-clamp-2 leading-relaxed ${themeStyles.text.secondary}`}>
                            {getSessionPreview(session)}
                          </p>
                        </>
                      )}

                      {/* 时间和消息数 */}
                      <div className={`flex items-center gap-2 mt-2.5 text-xs ${themeStyles.text.tertiary}`}>
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formatTime(session.updatedAt)}</span>
                        <span className="opacity-50">·</span>
                        <span className="px-1.5 py-0.5 rounded-full bg-[#C02C38]/10 text-[#C02C38] text-[10px] font-medium">
                          {session.messageCount}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  {editingId !== session.id && (
                    <motion.div 
                      className={`absolute top-2 right-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all duration-200 ${themeStyles.actions} rounded-xl p-1 shadow-lg`}
                      initial={false}
                    >
                      <motion.button
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditing(session);
                        }}
                        className={`p-2 rounded-lg transition-all ${
                          isDark
                            ? 'hover:bg-white/[0.06] text-gray-400 hover:text-white'
                            : 'hover:bg-black/[0.04] text-gray-500 hover:text-gray-700'
                        }`}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        title="编辑标题"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </motion.button>
                      <motion.button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowConfirmDelete(session.id);
                        }}
                        className={`p-2 rounded-lg transition-all ${
                          isDark
                            ? 'hover:bg-red-500/10 text-gray-400 hover:text-red-400'
                            : 'hover:bg-red-50 text-gray-500 hover:text-red-500'
                        }`}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        title="删除会话"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </motion.button>
                    </motion.div>
                  )}
                </motion.div>
              ))
            )}
          </motion.div>

          {/* 底部信息 */}
          <div className={`p-4 text-xs text-center font-medium ${themeStyles.footer}`}>
            <span className="px-3 py-1.5 rounded-full bg-[#C02C38]/10 text-[#C02C38]">
              共 {sessions.length} 个会话
            </span>
          </div>
        </div>
      </motion.div>

      {/* 展开按钮（当侧边栏关闭时显示） */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ opacity: 0, x: -20, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -20, scale: 0.9 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            onClick={onToggle}
            className={`absolute left-4 top-24 z-10 p-3 rounded-2xl shadow-xl transition-all ${
              isDark
                ? 'bg-[#1E1E28] hover:bg-[#252532] text-gray-400 hover:text-white border border-white/[0.06]'
                : 'bg-white hover:bg-gray-50 text-gray-500 hover:text-gray-700 border border-black/[0.06]'
            }`}
          >
            <ChevronRight className="w-5 h-5" />
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowConfirmDelete(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className={`p-6 rounded-2xl shadow-2xl max-w-sm mx-4 ${
                isDark 
                  ? 'bg-[#15151A] border border-white/[0.06]' 
                  : 'bg-white border border-black/[0.06]'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`w-12 h-12 mx-auto mb-4 rounded-2xl flex items-center justify-center ${
                isDark ? 'bg-red-500/10' : 'bg-red-50'
              }`}>
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <h3 className={`text-lg font-semibold mb-2 text-center ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                确认删除
              </h3>
              <p className={`text-sm mb-6 text-center ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}>
                确定要删除这个会话吗？此操作无法撤销。
              </p>
              <div className="flex gap-3">
                <motion.button
                  onClick={() => setShowConfirmDelete(null)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isDark
                      ? 'bg-[#1E1E28] hover:bg-[#252532] text-gray-200 border border-white/[0.06]'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  取消
                </motion.button>
                <motion.button
                  onClick={() => showConfirmDelete && handleDeleteSession(showConfirmDelete)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg shadow-red-500/30 transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  删除
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
