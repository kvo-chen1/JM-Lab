/**
 * 画布空状态引导组件
 * 当脉络中没有节点时显示，引导用户创建第一个节点
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  Lightbulb,
  Sparkles,
  BookOpen,
  ArrowRight,
  Palette,
} from 'lucide-react';

interface EmptyStateGuideProps {
  onAddNode: (category: 'inspiration' | 'culture' | 'ai_generate') => void;
  onOpenBrandPanel: () => void;
}

const quickStartTemplates = [
  {
    id: 'inspiration',
    title: '从灵感开始',
    description: '记录你的创作灵感',
    icon: Lightbulb,
    color: 'from-amber-400 to-orange-500',
    bgColor: 'bg-amber-50',
    category: 'inspiration' as const,
  },
  {
    id: 'culture',
    title: '天津文化',
    description: '融入天津老字号元素',
    icon: BookOpen,
    color: 'from-red-400 to-rose-500',
    bgColor: 'bg-red-50',
    category: 'culture' as const,
  },
  {
    id: 'ai',
    title: 'AI 辅助创作',
    description: '让AI帮你生成内容',
    icon: Sparkles,
    color: 'from-purple-400 to-violet-500',
    bgColor: 'bg-purple-50',
    category: 'ai_generate' as const,
  },
];

const tianjinQuotes = [
 '灵感如海河之水，源源不断',
  '创作如泥人张之手，栩栩如生',
  '想象如风筝魏之翼，自由翱翔',
];

export const EmptyStateGuide: React.FC<EmptyStateGuideProps> = ({
  onAddNode,
  onOpenBrandPanel,
}) => {
  const randomQuote = tianjinQuotes[Math.floor(Math.random() * tianjinQuotes.length)];

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-br from-amber-200/20 to-orange-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-purple-200/20 to-pink-200/20 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 text-center max-w-2xl mx-auto px-6"
      >
        {/* 主图标 */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="mb-6"
        >
          <div className="relative inline-block">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-[#D4A574] to-[#E8C9A0] rounded-2xl flex items-center justify-center shadow-xl shadow-amber-200/50">
              <Palette className="w-12 h-12 text-white" />
            </div>
            {/* 装饰圆点 */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="absolute -inset-4"
            >
              <div className="absolute top-0 left-1/2 w-2 h-2 bg-amber-400 rounded-full" />
              <div className="absolute bottom-0 left-1/2 w-2 h-2 bg-orange-400 rounded-full" />
              <div className="absolute left-0 top-1/2 w-2 h-2 bg-purple-400 rounded-full" />
              <div className="absolute right-0 top-1/2 w-2 h-2 bg-pink-400 rounded-full" />
            </motion.div>
          </div>
        </motion.div>

        {/* 标题 */}
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-bold text-gray-900 mb-2"
        >
          开始你的创作脉络
        </motion.h2>

        {/* 天津风引言 */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-amber-600/80 text-sm mb-8 italic"
        >
          "{randomQuote}"
        </motion.p>

        {/* 快速开始模板 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-3 gap-4 mb-8"
        >
          {quickStartTemplates.map((template, index) => (
            <motion.button
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onAddNode(template.category)}
              className={`
                group relative p-5 rounded-2xl border-2 border-transparent
                bg-white/80 backdrop-blur-sm shadow-lg
                hover:shadow-xl transition-all duration-300
                hover:border-amber-200
              `}
            >
              {/* 图标背景 */}
              <div className={`
                w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br ${template.color}
                flex items-center justify-center shadow-md
                group-hover:scale-110 transition-transform duration-300
              `}>
                <template.icon className="w-6 h-6 text-white" />
              </div>

              {/* 文字内容 */}
              <h3 className="font-semibold text-gray-900 text-sm mb-1">
                {template.title}
              </h3>
              <p className="text-xs text-gray-500">
                {template.description}
              </p>

              {/* 悬停指示器 */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-500/0 to-orange-500/0 group-hover:from-amber-500/5 group-hover:to-orange-500/5 transition-all duration-300" />
            </motion.button>
          ))}
        </motion.div>

        {/* 天津灵感入口 */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={onOpenBrandPanel}
          className="
            inline-flex items-center gap-2 px-6 py-3
            bg-gradient-to-r from-red-500 to-rose-500
            text-white rounded-xl font-medium
            shadow-lg shadow-red-200 hover:shadow-xl
            transition-all duration-300
          "
        >
          <BookOpen className="w-5 h-5" />
          <span>探索天津老字号灵感</span>
          <ArrowRight className="w-4 h-4" />
        </motion.button>

        {/* 提示文字 */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-6 text-xs text-gray-400"
        >
          点击上方卡片创建第一个节点，或从天津文化元素中获取灵感
        </motion.p>
      </motion.div>
    </div>
  );
};

export default EmptyStateGuide;
