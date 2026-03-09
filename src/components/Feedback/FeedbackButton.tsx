import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import FeedbackModal from './FeedbackModal';

interface FeedbackButtonProps {
  className?: string;
}

export default function FeedbackButton({ className = '' }: FeedbackButtonProps) {
  const { isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* 反馈按钮 */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-[9999] flex items-center gap-2 px-4 py-3 rounded-full shadow-lg transition-all border-2 border-yellow-400 ${
          isDark
            ? 'bg-[#C02C38] hover:bg-[#E85D75] text-white'
            : 'bg-[#C02C38] hover:bg-[#E85D75] text-white'
        } ${className}`}
      >
        <MessageSquare className="w-5 h-5" />
        <span className="text-sm font-medium">反馈</span>
      </motion.button>

      {/* 反馈弹窗 */}
      <FeedbackModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
