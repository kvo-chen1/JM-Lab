import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { getFeedbackLearning, FeedbackType as NewFeedbackType } from '../services/feedbackLearning';
import { ThumbsUp, ThumbsDown, MessageSquare, X, Send } from 'lucide-react';
import { toast } from 'sonner';

interface FeedbackButtonsProps {
  messageId: string;
  messageContent: string;
  agentType: string;
  onFeedbackSubmitted?: () => void;
}

export default function FeedbackButtons({
  messageId,
  messageContent,
  agentType,
  onFeedbackSubmitted
}: FeedbackButtonsProps) {
  const { isDark } = useTheme();
  const [feedbackType, setFeedbackType] = useState<NewFeedbackType | null>(null);
  const [comment, setComment] = useState('');
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const feedbackService = getFeedbackLearning();

  // 获取用户ID和会话ID
  const getUserId = () => {
    let userId = localStorage.getItem('agent-user-id');
    if (!userId) {
      userId = `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('agent-user-id', userId);
    }
    return userId;
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
  const submitFeedback = async () => {
    if (!feedbackType) return;

    setIsSubmitting(true);
    try {
      await feedbackService.collectFeedback(
        getUserId(),
        getSessionId(),
        messageId,
        feedbackType,
        {
          comment: comment.trim() || undefined
        },
        {
          userInput: '',
          agentResponse: messageContent
        }
      );

      toast.success('感谢您的反馈！我们会持续改进。');
      setShowCommentBox(false);
      setComment('');
      
      if (onFeedbackSubmitted) {
        onFeedbackSubmitted();
      }
    } catch (error) {
      console.error('[FeedbackButtons] Failed to submit feedback:', error);
      toast.error('反馈提交失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 处理点赞
  const handleLike = () => {
    setFeedbackType(NewFeedbackType.THUMB_UP);
    setShowCommentBox(true);
  };

  // 处理点踩
  const handleDislike = () => {
    setFeedbackType(NewFeedbackType.THUMB_DOWN);
    setShowCommentBox(true);
  };

  return (
    <div className="flex flex-col gap-2">
      {/* 反馈按钮 */}
      <div className="flex items-center gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleLike}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors ${
            feedbackType === NewFeedbackType.THUMB_UP
              ? 'bg-green-500/20 text-green-500'
              : isDark
                ? 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
        >
          <ThumbsUp className="w-3 h-3" />
          <span>有帮助</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleDislike}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors ${
            feedbackType === NewFeedbackType.THUMB_DOWN
              ? 'bg-red-500/20 text-red-500'
              : isDark
                ? 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
        >
          <ThumbsDown className="w-3 h-3" />
          <span>需改进</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setFeedbackType(NewFeedbackType.COMMENT);
            setShowCommentBox(true);
          }}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors ${
            feedbackType === NewFeedbackType.COMMENT
              ? 'bg-blue-500/20 text-blue-500'
              : isDark
                ? 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
        >
          <MessageSquare className="w-3 h-3" />
          <span>评论</span>
        </motion.button>
      </div>

      {/* 评论输入框 */}
      <AnimatePresence>
        {showCommentBox && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`p-3 rounded-lg ${
              isDark ? 'bg-gray-800' : 'bg-gray-50'
            }`}
          >
            <div className="flex items-start gap-2">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={
                  feedbackType === NewFeedbackType.THUMB_UP
                    ? '有什么地方让您满意？（可选）'
                    : feedbackType === NewFeedbackType.THUMB_DOWN
                      ? '请告诉我们需要改进的地方...'
                      : '请输入您的评论...'
                }
                className={`flex-1 bg-transparent border-none outline-none resize-none text-sm ${
                  isDark
                    ? 'text-gray-200 placeholder-gray-500'
                    : 'text-gray-700 placeholder-gray-400'
                }`}
                rows={2}
              />
              <div className="flex flex-col gap-1">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={submitFeedback}
                  disabled={isSubmitting}
                  className={`p-1.5 rounded-lg transition-colors ${
                    isSubmitting
                      ? 'opacity-50 cursor-not-allowed'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  <Send className="w-3 h-3" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setShowCommentBox(false);
                    setComment('');
                    setFeedbackType(null);
                  }}
                  className={`p-1.5 rounded-lg transition-colors ${
                    isDark
                      ? 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                      : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                  }`}
                >
                  <X className="w-3 h-3" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
