/**
 * 海报布局选择组件
 * 在 Agent 对话中展示海报布局选项
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Check, Grid3X3, LayoutTemplate, Film, BookOpen } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { posterLayouts, type PosterLayout } from '@/config/posterLayouts';

interface PosterLayoutSelectorProps {
  selectedLayoutId?: string;
  onSelect: (layout: PosterLayout) => void;
}

const layoutIcons: Record<string, React.ReactNode> = {
  classic: <Grid3X3 className="w-5 h-5" />,
  magazine: <LayoutTemplate className="w-5 h-5" />,
  cinematic: <Film className="w-5 h-5" />,
  brandbook: <BookOpen className="w-5 h-5" />,
};

export default function PosterLayoutSelector({ selectedLayoutId, onSelect }: PosterLayoutSelectorProps) {
  const { isDark } = useTheme();

  return (
    <div className="space-y-3">
      <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
        请选择一个海报布局风格：
      </p>
      <div className="grid grid-cols-2 gap-3">
        {posterLayouts.map((layout) => (
          <motion.button
            key={layout.id}
            onClick={() => onSelect(layout)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`p-4 rounded-xl text-left transition-all duration-300 ${
              selectedLayoutId === layout.id
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                : isDark
                  ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700'
                  : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${
                selectedLayoutId === layout.id
                  ? 'bg-white/20'
                  : isDark
                    ? 'bg-gray-700'
                    : 'bg-gray-100'
              }`}>
                {layoutIcons[layout.id] || <Grid3X3 className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm">{layout.name}</div>
                <div className={`text-xs mt-1 line-clamp-2 ${
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
    </div>
  );
}
