import React, { useState } from 'react';
import { useTheme } from '@/hooks/useTheme';
import type { ChatSession } from '../types';
import { Plus, Trash2, Edit2, Check, X, MessageSquare, Clock, MoreHorizontal, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatHistoryProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSwitchSession: (sessionId: string) => void;
  onCreateSession: () => void;
  onDeleteSession: (sessionId: string) => void;
  onRenameSession: (sessionId: string, newTitle: string) => void;
  formatTime: (timestamp: number) => string;
}

export const ChatHistory: React.FC<ChatHistoryProps> = ({
  sessions,
  currentSessionId,
  onSwitchSession,
  onCreateSession,
  onDeleteSession,
  onRenameSession,
  formatTime,
}) => {
  const { isDark } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(true); // 默认折叠
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [showMenuId, setShowMenuId] = useState<string | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  
  // 自动折叠定时器
  const collapseTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  
  // 鼠标移入时取消定时器，保持展开
  const handleMouseEnter = () => {
    setIsHovering(true);
    if (collapseTimerRef.current) {
      clearTimeout(collapseTimerRef.current);
      collapseTimerRef.current = null;
    }
  };
  
  // 鼠标移出时启动定时器，2 秒后自动折叠
  const handleMouseLeave = () => {
    setIsHovering(false);
    collapseTimerRef.current = setTimeout(() => {
      setIsCollapsed(true);
    }, 2000);
  };
  
  // 清理定时器
  React.useEffect(() => {
    return () => {
      if (collapseTimerRef.current) {
        clearTimeout(collapseTimerRef.current);
      }
    };
  }, []);

  const handleStartEdit = (session: ChatSession) => {
    setEditingId(session.id);
    setEditTitle(session.title);
    setShowMenuId(null);
  };

  const handleSaveEdit = () => {
    if (editingId && editTitle.trim()) {
      onRenameSession(editingId, editTitle.trim());
    }
    setEditingId(null);
    setEditTitle('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
  };

  const handleDelete = (sessionId: string) => {
    onDeleteSession(sessionId);
    setShowMenuId(null);
  };
  
  // 切换会话后自动折叠
  const handleSwitchSession = (sessionId: string) => {
    onSwitchSession(sessionId);
    // 延迟折叠，让用户看到切换效果
    setTimeout(() => {
      setIsCollapsed(true);
    }, 300);
  };
  
  // 创建会话后自动折叠
  const handleCreateSession = () => {
    onCreateSession();
    setTimeout(() => {
      setIsCollapsed(true);
    }, 300);
  };

  return (
    <div 
      className={`border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Header */}
      <motion.div 
        className={`flex items-center justify-between px-4 py-3 cursor-pointer ${
          isDark ? 'bg-[#0f1410]' : 'bg-white'
        }`}
        onClick={() => setIsCollapsed(!isCollapsed)}
        whileHover={{ backgroundColor: isDark ? '#1a1f1a' : '#f9fafb' }}
      >
        <div className="flex items-center gap-2">
          <MessageSquare className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
          <span className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
            历史会话
          </span>
          <span className={`text-xs px-1.5 py-0.5 rounded-full ${
            isDark ? 'bg-gray-800 text-gray-500' : 'bg-gray-100 text-gray-500'
          }`}>
            {sessions.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCreateSession();
            }}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors ${
              isDark 
                ? 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30' 
                : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
            }`}
          >
            <Plus className="w-3 h-3" />
            新建
          </button>
          <motion.div
            animate={{ rotate: isCollapsed ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
          </motion.div>
        </div>
      </motion.div>

      {/* Session List */}
      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className={`max-h-[200px] overflow-y-auto ${
              isDark ? 'bg-[#0f1410]' : 'bg-gray-50'
            }`}>
        {sessions.length === 0 ? (
          <div className={`px-4 py-6 text-center text-sm ${
            isDark ? 'text-gray-500' : 'text-gray-400'
          }`}>
            暂无历史会话
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                  session.id === currentSessionId
                    ? isDark 
                      ? 'bg-purple-500/20 border border-purple-500/30' 
                      : 'bg-purple-100 border border-purple-200'
                    : isDark
                      ? 'hover:bg-gray-800/50 border border-transparent'
                      : 'hover:bg-white border border-transparent'
                }`}
                onClick={() => handleSwitchSession(session.id)}
              >
                {/* Icon */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                  session.id === currentSessionId
                    ? 'bg-purple-500 text-white'
                    : isDark
                      ? 'bg-gray-800 text-gray-400'
                      : 'bg-gray-200 text-gray-500'
                }`}>
                  <MessageSquare className="w-4 h-4" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {editingId === session.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit();
                          if (e.key === 'Escape') handleCancelEdit();
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className={`flex-1 px-2 py-1 text-sm rounded border outline-none ${
                          isDark 
                            ? 'bg-gray-800 border-gray-700 text-gray-200' 
                            : 'bg-white border-gray-300 text-gray-700'
                        }`}
                        autoFocus
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSaveEdit();
                        }}
                        className="p-1 rounded text-green-500 hover:bg-green-500/10"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancelEdit();
                        }}
                        className="p-1 rounded text-red-500 hover:bg-red-500/10"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className={`text-sm font-medium truncate ${
                        session.id === currentSessionId
                          ? isDark ? 'text-purple-300' : 'text-purple-700'
                          : isDark ? 'text-gray-200' : 'text-gray-700'
                      }`}>
                        {session.title}
                      </div>
                      <div className={`flex items-center gap-2 text-xs ${
                        isDark ? 'text-gray-500' : 'text-gray-400'
                      }`}>
                        <Clock className="w-3 h-3" />
                        <span>{formatTime(session.updatedAt)}</span>
                        <span>·</span>
                        <span>{session.messageCount} 条消息</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Actions */}
                {editingId !== session.id && (
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenuId(showMenuId === session.id ? null : session.id);
                      }}
                      className={`p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity ${
                        isDark 
                          ? 'hover:bg-gray-700 text-gray-400' 
                          : 'hover:bg-gray-200 text-gray-500'
                      }`}
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>

                    {/* Dropdown Menu */}
                    {showMenuId === session.id && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setShowMenuId(null)}
                        />
                        <div className={`absolute right-0 top-full mt-1 py-1 rounded-lg shadow-lg border z-20 min-w-[120px] ${
                          isDark 
                            ? 'bg-gray-800 border-gray-700' 
                            : 'bg-white border-gray-200'
                        }`}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartEdit(session);
                            }}
                            className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                              isDark 
                                ? 'text-gray-300 hover:bg-gray-700' 
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            重命名
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(session.id);
                            }}
                            className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                              isDark 
                                ? 'text-red-400 hover:bg-red-500/10' 
                                : 'text-red-500 hover:bg-red-50'
                            }`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            删除
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatHistory;
