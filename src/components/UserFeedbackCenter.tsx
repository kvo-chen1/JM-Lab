import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import { feedbackService, FEEDBACK_TYPE_CONFIG, FEEDBACK_STATUS_CONFIG, type Feedback } from '@/services/feedbackService';
import { useNotifications } from '@/contexts/NotificationContext';
import {
  MessageSquare,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronRight,
  Bell,
  X
} from 'lucide-react';

interface UserFeedbackCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UserFeedbackCenter({ isOpen, onClose }: UserFeedbackCenterProps) {
  const { isDark } = useTheme();
  const { notifications, markAsRead } = useNotifications();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [activeTab, setActiveTab] = useState<'feedbacks' | 'notifications'>('feedbacks');
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);

  // 从 localStorage 加载用户的反馈
  useEffect(() => {
    if (isOpen) {
      const stored = localStorage.getItem('user_feedbacks_local');
      if (stored) {
        try {
          const data = JSON.parse(stored);
          setFeedbacks(data);
        } catch (e) {
          console.error('解析反馈数据失败:', e);
        }
      }
    }
  }, [isOpen]);

  // 过滤反馈相关的通知
  const feedbackNotifications = notifications.filter(
    n => n.type === 'feedback_resolved' || n.type === 'feedback_replied'
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'processing':
        return <Clock className="w-5 h-5 text-blue-500" />;
      case 'pending':
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className={`w-full max-w-2xl max-h-[80vh] rounded-2xl shadow-2xl overflow-hidden ${
            isDark ? 'bg-gray-900' : 'bg-white'
          }`}
          onClick={e => e.stopPropagation()}
        >
          {/* 头部 */}
          <div className={`flex items-center justify-between p-4 border-b ${
            isDark ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              我的反馈
            </h2>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 标签页 */}
          <div className={`flex border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <button
              onClick={() => setActiveTab('feedbacks')}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors relative ${
                activeTab === 'feedbacks'
                  ? isDark
                    ? 'text-blue-400'
                    : 'text-blue-600'
                  : isDark
                  ? 'text-gray-400 hover:text-gray-300'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <MessageSquare className="w-4 h-4" />
                我的反馈
                {feedbacks.length > 0 && (
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {feedbacks.length}
                  </span>
                )}
              </div>
              {activeTab === 'feedbacks' && (
                <motion.div
                  layoutId="activeTab"
                  className={`absolute bottom-0 left-0 right-0 h-0.5 ${
                    isDark ? 'bg-blue-400' : 'bg-blue-600'
                  }`}
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors relative ${
                activeTab === 'notifications'
                  ? isDark
                    ? 'text-blue-400'
                    : 'text-blue-600'
                  : isDark
                  ? 'text-gray-400 hover:text-gray-300'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Bell className="w-4 h-4" />
                通知
                {feedbackNotifications.length > 0 && (
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    isDark ? 'bg-red-900/50 text-red-400' : 'bg-red-100 text-red-600'
                  }`}>
                    {feedbackNotifications.length}
                  </span>
                )}
              </div>
              {activeTab === 'notifications' && (
                <motion.div
                  layoutId="activeTab"
                  className={`absolute bottom-0 left-0 right-0 h-0.5 ${
                    isDark ? 'bg-blue-400' : 'bg-blue-600'
                  }`}
                />
              )}
            </button>
          </div>

          {/* 内容区域 */}
          <div className="overflow-y-auto max-h-[60vh]">
            {activeTab === 'feedbacks' ? (
              <div className="p-4 space-y-3">
                {feedbacks.length === 0 ? (
                  <div className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>暂无反馈记录</p>
                    <p className="text-sm mt-1">您提交的反馈将显示在这里</p>
                  </div>
                ) : (
                  feedbacks.map((feedback, index) => (
                    <motion.div
                      key={feedback.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => setSelectedFeedback(feedback)}
                      className={`p-4 rounded-xl cursor-pointer transition-all ${
                        isDark
                          ? 'bg-gray-800 hover:bg-gray-750'
                          : 'bg-gray-50 hover:bg-gray-100'
                      } ${selectedFeedback?.id === feedback.id ? (isDark ? 'ring-2 ring-blue-500' : 'ring-2 ring-blue-500') : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          {getStatusIcon(feedback.status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className="px-2 py-0.5 text-xs rounded-full"
                              style={{
                                backgroundColor: FEEDBACK_TYPE_CONFIG[feedback.type].color + '20',
                                color: FEEDBACK_TYPE_CONFIG[feedback.type].color
                              }}
                            >
                              {FEEDBACK_TYPE_CONFIG[feedback.type].label}
                            </span>
                            <span
                              className="px-2 py-0.5 text-xs rounded-full"
                              style={{
                                backgroundColor: FEEDBACK_STATUS_CONFIG[feedback.status].bgColor,
                                color: FEEDBACK_STATUS_CONFIG[feedback.status].color
                              }}
                            >
                              {FEEDBACK_STATUS_CONFIG[feedback.status].label}
                            </span>
                            {feedback.is_notified && (
                              <span className={`px-2 py-0.5 text-xs rounded-full ${
                                isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-600'
                              }`}>
                                已通知
                              </span>
                            )}
                          </div>
                          <h3 className={`font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {feedback.title || '无标题'}
                          </h3>
                          <p className={`text-sm mt-1 line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {feedback.content}
                          </p>
                          <div className={`flex items-center gap-4 mt-2 text-xs ${
                            isDark ? 'text-gray-500' : 'text-gray-400'
                          }`}>
                            <span>{new Date(feedback.created_at).toLocaleString()}</span>
                            {feedback.responded_at && (
                              <span className={isDark ? 'text-green-400' : 'text-green-600'}>
                                已回复
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className={`w-5 h-5 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                      </div>

                      {/* 回复内容 */}
                      {feedback.response_content && (
                        <div className={`mt-3 p-3 rounded-lg ${
                          isDark ? 'bg-gray-700/50' : 'bg-white'
                        }`}>
                          <div className={`text-xs mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            管理员回复：
                          </div>
                          <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            {feedback.response_content}
                          </p>
                        </div>
                      )}
                    </motion.div>
                  ))
                )}
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {feedbackNotifications.length === 0 ? (
                  <div className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>暂无通知</p>
                    <p className="text-sm mt-1">当您的反馈得到回复时，将收到通知</p>
                  </div>
                ) : (
                  feedbackNotifications.map((notification, index) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => markAsRead(notification.id)}
                      className={`p-4 rounded-xl cursor-pointer transition-all ${
                        notification.status === 'unread'
                          ? isDark
                            ? 'bg-blue-900/20 border border-blue-800'
                            : 'bg-blue-50 border border-blue-200'
                          : isDark
                          ? 'bg-gray-800'
                          : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-1 ${
                          notification.status === 'unread'
                            ? 'text-blue-500'
                            : isDark
                            ? 'text-gray-500'
                            : 'text-gray-400'
                        }`}>
                          {notification.status === 'unread' ? (
                            <AlertCircle className="w-5 h-5" />
                          ) : (
                            <CheckCircle className="w-5 h-5" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className={`font-medium ${
                            notification.status === 'unread'
                              ? isDark
                                ? 'text-white'
                                : 'text-gray-900'
                              : isDark
                              ? 'text-gray-300'
                              : 'text-gray-600'
                          }`}>
                            {notification.title}
                          </h4>
                          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {notification.content}
                          </p>
                          <div className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            {notification.createdAt.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
