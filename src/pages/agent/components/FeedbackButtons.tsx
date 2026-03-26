import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { Star } from 'lucide-react';
import AIFeedbackModal from '@/components/Feedback/AIFeedbackModal';

interface FeedbackButtonsProps {
  messageId: string;
  messageContent: string;
  agentType: string;
  userQuery?: string;
  onFeedbackSubmitted?: () => void;
}

export default function FeedbackButtons({
  messageId,
  messageContent,
  agentType,
  userQuery = '',
  onFeedbackSubmitted
}: FeedbackButtonsProps) {
  const { isDark } = useTheme();
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      {/* 反馈按钮 - 简化为单个评分按钮，更低调 */}
      <div className="flex items-center gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowModal(true)}
          className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors opacity-60 hover:opacity-100 ${
            isDark
              ? 'text-gray-500 hover:text-gray-400'
              : 'text-gray-400 hover:text-gray-600'
          }`}
          title="评价此回复"
        >
          <Star className="w-3 h-3" />
          <span className="hidden sm:inline">评价</span>
        </motion.button>
      </div>

      {/* AI反馈弹窗 */}
      <AIFeedbackModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        aiModel="jinmai-agent"
        aiName="津小脉Agent"
        messageId={messageId}
        userQuery={userQuery}
        aiResponse={messageContent}
        onSubmitted={onFeedbackSubmitted}
      />
    </>
  );
}
