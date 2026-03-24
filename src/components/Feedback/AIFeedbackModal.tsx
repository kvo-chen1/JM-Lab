import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { X, Star, Send } from 'lucide-react';
import { toast } from 'sonner';
import { aiFeedbackService, AIFeedbackType } from '@/services/aiFeedbackService';

interface AIFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  aiModel: string;           // AI类型标识，如 'jinmai-agent', 'jinmai-skill', 'jinmai-floating', 'creation-assistant'
  aiName: string;            // AI显示名称，如 '津小脉Agent', 'AI创意助手'
  messageId: string;
  userQuery: string;
  aiResponse: string;
  onSubmitted?: () => void;
}

const FEEDBACK_TYPE_OPTIONS: { value: AIFeedbackType; label: string }[] = [
  { value: 'helpfulness', label: '有用性' },
  { value: 'quality', label: '内容质量' },
  { value: 'accuracy', label: '准确性' },
  { value: 'satisfaction', label: '满意度' },
  { value: 'other', label: '其他' },
];

const RATING_LABELS: Record<number, string> = {
  1: '非常不满意',
  2: '不满意',
  3: '一般',
  4: '满意',
  5: '非常满意',
};

export default function AIFeedbackModal({
  isOpen,
  onClose,
  aiModel,
  aiName,
  messageId,
  userQuery,
  aiResponse,
  onSubmitted
}: AIFeedbackModalProps) {
  const { isDark } = useTheme();
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [feedbackType, setFeedbackType] = useState<AIFeedbackType>('helpfulness');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 获取用户ID和会话ID
  // 注意：user_id 在数据库中是 UUID 类型，如果不是有效 UUID，应设为 null
  const getUserId = () => {
    const userId = localStorage.getItem('agent-user-id');
    // 检查是否是有效的 UUID 格式
    if (userId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
      return userId;
    }
    // 如果不是有效 UUID，返回 null（数据库允许 null）
    return null;
  };

  const getSessionId = () => {
    let sessionId = sessionStorage.getItem('agent-session-id');
    if (!sessionId) {
      sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('agent-session-id', sessionId);
    }
    return sessionId;
  };

  // 提交反馈
  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('请选择评分');
      return;
    }

    setIsSubmitting(true);
    try {
      await aiFeedbackService.submitFeedback({
        userId: getUserId(),
        userName: '匿名用户',
        sessionId: getSessionId(),
        messageId: messageId,
        rating: rating as 1 | 2 | 3 | 4 | 5,
        feedbackType: feedbackType,
        comment: comment.trim() || undefined,
        aiModel: aiModel,
        aiResponse: aiResponse,
        userQuery: userQuery,
      });

      toast.success('感谢您的反馈！我们会持续改进。');
      
      // 重置表单
      setRating(0);
      setComment('');
      setFeedbackType('helpfulness');
      
      onClose();
      
      if (onSubmitted) {
        onSubmitted();
      }
    } catch (error) {
      console.error('[AIFeedbackModal] Failed to submit feedback:', error);
      toast.error('反馈提交失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 处理关闭
  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={e => e.stopPropagation()}
          className={`w-full max-w-md rounded-2xl overflow-hidden shadow-2xl ${
            isDark ? 'bg-gray-900' : 'bg-white'
          }`}
        >
          {/* 头部 */}
          <div className={`flex items-center justify-between p-4 border-b ${
            isDark ? 'border-gray-800' : 'border-gray-200'
          }`}>
            <div className="flex items-center gap-2">
              <span className="text-lg">💬</span>
              <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                AI回复反馈
              </h2>
            </div>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className={`p-2 rounded-lg transition-colors ${
                isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 内容区域 */}
          <div className="p-5 space-y-5">
            {/* AI名称显示 */}
            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              正在评价: <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{aiName}</span>
            </div>

            {/* 评分 */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                评分 <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-8 h-8 transition-colors ${
                        star <= (hoverRating || rating)
                          ? 'text-yellow-400 fill-yellow-400'
                          : isDark ? 'text-gray-600' : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
                <span className={`ml-2 text-sm font-medium ${
                  rating > 0 
                    ? isDark ? 'text-yellow-400' : 'text-yellow-600'
                    : isDark ? 'text-gray-500' : 'text-gray-400'
                }`}>
                  {rating > 0 ? RATING_LABELS[rating] : '请选择评分'}
                </span>
              </div>
            </div>

            {/* 反馈类型 */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                反馈类型
              </label>
              <select
                value={feedbackType}
                onChange={(e) => setFeedbackType(e.target.value as AIFeedbackType)}
                className={`w-full px-3 py-2 rounded-lg border text-sm ${
                  isDark
                    ? 'bg-gray-800 border-gray-700 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              >
                {FEEDBACK_TYPE_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 详细反馈 */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                详细反馈 <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>(可选)</span>
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="请告诉我们更多细节，帮助我们改进..."
                rows={3}
                className={`w-full px-3 py-2 rounded-lg border text-sm resize-none ${
                  isDark
                    ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
            </div>
          </div>

          {/* 底部按钮 */}
          <div className={`p-4 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'} flex gap-3`}>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className={`flex-1 py-2.5 rounded-lg font-medium transition-colors ${
                isDark
                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || rating === 0}
              className={`flex-1 py-2.5 rounded-lg font-medium text-white transition-all flex items-center justify-center gap-2 ${
                isSubmitting || rating === 0
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:shadow-lg hover:shadow-blue-500/25'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  提交中...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  提交反馈
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
