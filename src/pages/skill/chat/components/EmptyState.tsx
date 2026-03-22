import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { Sparkles, Wand2, Palette, MessageSquare, Image, FileText } from 'lucide-react';

export const EmptyState: React.FC = () => {
  const { isDark } = useTheme();

  const features = [
    { icon: Image, label: '图片生成', color: 'from-purple-500 to-pink-500' },
    { icon: FileText, label: '文案创作', color: 'from-blue-500 to-cyan-500' },
    { icon: Palette, label: '配色方案', color: 'from-green-500 to-emerald-500' },
    { icon: MessageSquare, label: '智能对话', color: 'from-orange-500 to-red-500' },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[500px] px-8">
      {/* 主图标 */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={`relative mb-8`}
      >
        <div className={`w-24 h-24 rounded-3xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30`}>
          <Wand2 className="w-12 h-12 text-white" />
        </div>
        
        {/* 装饰性光晕 */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500 to-pink-500 blur-xl opacity-30 animate-pulse" />
        
        {/* 浮动装饰 */}
        <motion.div
          animate={{ y: [-5, 5, -5] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center shadow-lg"
        >
          <Sparkles className="w-4 h-4 text-white" />
        </motion.div>
      </motion.div>

      {/* 标题 */}
      <motion.h2
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className={`text-2xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}
      >
        开始你的创作之旅
      </motion.h2>

      {/* 描述 */}
      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className={`text-center max-w-md mb-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
      >
        在右侧对话框中描述你的需求，AI Agent 将调用 Skill 技能为你完成创作。
        生成的作品将显示在这里。
      </motion.p>

      {/* 功能特性 */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="grid grid-cols-2 gap-4"
      >
        {features.map((feature, index) => (
          <motion.div
            key={feature.label}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4 + index * 0.1, duration: 0.3 }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl ${
              isDark 
                ? 'bg-gray-800/50 border border-gray-700' 
                : 'bg-white border border-gray-200 shadow-sm'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center`}>
              <feature.icon className="w-5 h-5 text-white" />
            </div>
            <span className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
              {feature.label}
            </span>
          </motion.div>
        ))}
      </motion.div>

      {/* 提示 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className={`mt-8 text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}
      >
        提示：你可以使用空格键+拖拽来平移画布，Ctrl+滚轮来缩放
      </motion.div>
    </div>
  );
};

export default EmptyState;
