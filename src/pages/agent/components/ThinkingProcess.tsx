import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { ChevronDown, Sparkles } from 'lucide-react';

interface ThinkingProcessProps {
  thinking: string;
}

export default function ThinkingProcess({ thinking }: ThinkingProcessProps) {
  const { isDark } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`mt-3 rounded-xl overflow-hidden ${
      isDark ? 'bg-gray-800/50' : 'bg-gray-50'
    }`}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors ${
          isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-100'
        }`}
      >
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
            isDark ? 'bg-yellow-500/20' : 'bg-yellow-100'
          }`}>
            <Sparkles className="w-3 h-3 text-yellow-500" />
          </div>
          <span className={`text-xs font-medium ${isDark ? 'text-yellow-500' : 'text-yellow-600'}`}>
            展示思考过程
          </span>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
        </motion.div>
      </button>

      {/* Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className={`px-3 pb-3 pt-1 text-xs leading-relaxed ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {thinking.split('\n').map((line, index) => {
                // 处理高亮标记
                const isHighlight = line.includes('：') || line.startsWith('•');
                return (
                  <p 
                    key={index} 
                    className={`mb-1 last:mb-0 ${
                      isHighlight ? (isDark ? 'text-gray-300' : 'text-gray-700') : ''
                    }`}
                  >
                    {line}
                  </p>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
