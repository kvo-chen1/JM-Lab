/**
 * IP 海报排版选择器组件
 * 在 Agent 对话中展示排版选项
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Check, LayoutTemplate } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { ipPosterService } from '@/services/ipPosterService';
import type { IPPosterLayout } from '@/types/ipPosterLayout';

interface IPPosterSelectorProps {
  selectedLayoutId?: string;
  onSelect: (layout: IPPosterLayout) => void;
}

export default function IPPosterSelector({ selectedLayoutId, onSelect }: IPPosterSelectorProps) {
  const { isDark } = useTheme();
  const layouts = ipPosterService.getRecommendedLayouts();

  return (
    <div className="space-y-3">
      <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
        请选择一个 IP 海报排版布局：
      </p>
      <div className="grid grid-cols-2 gap-3">
        {layouts.map((layout) => (
          <motion.button
            key={layout.id}
            onClick={() => onSelect(layout)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`p-3 rounded-xl text-left transition-all duration-300 ${
              selectedLayoutId === layout.id
                ? 'bg-gradient-to-r from-[#C02C38] to-[#E53E3E] text-white shadow-lg'
                : isDark
                  ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700'
                  : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'
            }`}
          >
            <div className="flex items-start gap-2">
              <div className={`p-2 rounded-lg flex-shrink-0 ${
                selectedLayoutId === layout.id
                  ? 'bg-white/20'
                  : isDark
                    ? 'bg-gray-700'
                    : 'bg-gray-100'
              }`}>
                <LayoutTemplate className={`w-4 h-4 ${
                  selectedLayoutId === layout.id ? 'text-white' : 'text-[#C02C38]'
                }`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-xs truncate">{layout.name}</div>
                <div className={`text-[10px] mt-1 line-clamp-2 ${
                  selectedLayoutId === layout.id
                    ? 'text-white/70'
                    : isDark
                      ? 'text-gray-400'
                      : 'text-gray-500'
                }`}>
                  {layout.description}
                </div>
              </div>
              {selectedLayoutId === layout.id && (
                <Check className="w-4 h-4 text-white flex-shrink-0" />
              )}
            </div>
          </motion.button>
        ))}
      </div>
      <p className={`text-xs text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
        点击查看更多排版布局
      </p>
    </div>
  );
}
