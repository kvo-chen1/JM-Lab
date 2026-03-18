import React from 'react';
import { motion } from 'framer-motion';
import { JinXiaoMai, JinXiaoMaiExpression } from './JinXiaoMai';

interface JinXiaoMaiShowcaseProps {
  className?: string;
}

const expressions: { key: JinXiaoMaiExpression; label: string; desc: string }[] = [
  { key: 'smile', label: '微笑', desc: '欢迎、默认状态' },
  { key: 'happy', label: '开心', desc: '创作成功、收到赞赏' },
  { key: 'thinking', label: '思考', desc: '优化建议、分析问题' },
  { key: 'surprised', label: '惊讶', desc: '发现新功能、收到礼物' },
  { key: 'cheer', label: '加油', desc: '鼓励用户、任务进行中' },
];

const modes = [
  { key: 'default', label: '默认模式' },
  { key: 'creation', label: '创作模式' },
  { key: 'ipIncubation', label: 'IP孵化模式' },
  { key: 'mall', label: '商城模式' },
  { key: 'community', label: '社区模式' },
];

const festivals = [
  { key: null, label: '默认' },
  { key: 'spring', label: '春节' },
  { key: 'lantern', label: '元宵' },
  { key: 'dragonBoat', label: '端午' },
];

const sizes = [
  { key: 'sm', label: '小', pixel: '64px' },
  { key: 'md', label: '中', pixel: '96px' },
  { key: 'lg', label: '大', pixel: '128px' },
  { key: 'xl', label: '超大', pixel: '160px' },
];

export function JinXiaoMaiShowcase({ className = '' }: JinXiaoMaiShowcaseProps) {
  const [selectedExpression, setSelectedExpression] = React.useState<JinXiaoMaiExpression>('smile');
  const [selectedMode, setSelectedMode] = React.useState('default');
  const [selectedFestival, setSelectedFestival] = React.useState<any>(null);
  const [selectedSize, setSelectedSize] = React.useState('md');

  return (
    <div className={`max-w-6xl mx-auto p-6 space-y-8 ${className}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          津小脉 IP形象展示
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          传承津门文化，智启创意未来
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg"
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            形象展示
          </h2>
          <div className="flex flex-col items-center justify-center py-12 bg-gradient-to-br from-blue-50 to-teal-50 dark:from-gray-700 dark:to-gray-600 rounded-xl">
            <JinXiaoMai
              expression={selectedExpression}
              mode={selectedMode as any}
              festival={selectedFestival}
              size={selectedSize as any}
              animate={true}
            />
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              津小脉 · {sizes.find(s => s.key === selectedSize)?.label}尺寸
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg space-y-6"
        >
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">表情选择</h3>
            <div className="flex flex-wrap gap-2">
              {expressions.map((exp) => (
                <button
                  key={exp.key}
                  onClick={() => setSelectedExpression(exp.key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedExpression === exp.key
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {exp.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {expressions.find(e => e.key === selectedExpression)?.desc}
            </p>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">功能模式</h3>
            <div className="flex flex-wrap gap-2">
              {modes.map((mode) => (
                <button
                  key={mode.key}
                  onClick={() => setSelectedMode(mode.key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedMode === mode.key
                      ? 'bg-teal-500 text-white shadow-md'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">节日限定</h3>
            <div className="flex flex-wrap gap-2">
              {festivals.map((festival) => (
                <button
                  key={festival.key || 'default'}
                  onClick={() => setSelectedFestival(festival.key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedFestival === festival.key
                      ? 'bg-amber-500 text-white shadow-md'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {festival.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">尺寸选择</h3>
            <div className="flex flex-wrap gap-2">
              {sizes.map((sz) => (
                <button
                  key={sz.key}
                  onClick={() => setSelectedSize(sz.key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedSize === sz.key
                      ? 'bg-purple-500 text-white shadow-md'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {sz.label} ({sz.pixel})
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg"
      >
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">全部表情</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {expressions.map((exp, index) => (
            <motion.div
              key={exp.key}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + index * 0.05 }}
              className="flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-xl"
            >
              <JinXiaoMai expression={exp.key} size="lg" animate={false} />
              <p className="mt-2 font-medium text-gray-900 dark:text-white">{exp.label}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{exp.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gradient-to-r from-blue-500 to-teal-500 rounded-2xl p-6 text-white"
      >
        <h2 className="text-xl font-semibold mb-4">应用场景</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: '🏠', title: '首页欢迎', desc: '用户首次访问' },
            { icon: '🎨', title: 'AI创作', desc: '创作助手' },
            { icon: '📦', title: 'IP孵化', desc: '进度展示' },
            { icon: '🛒', title: '商品详情', desc: '商城装饰' },
            { icon: '💬', title: '社区互动', desc: '聊天提示' },
            { icon: '📱', title: '空状态', desc: 'Loading动画' },
            { icon: '🎁', title: '红包封面', desc: '节日营销' },
            { icon: '✨', title: '表情包', desc: '聊天使用' },
          ].map((scene, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.05 }}
              className="flex flex-col items-center p-4 bg-white/10 rounded-xl backdrop-blur-sm"
            >
              <span className="text-3xl mb-2">{scene.icon}</span>
              <p className="font-medium text-center">{scene.title}</p>
              <p className="text-xs text-white/70 text-center">{scene.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg"
      >
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">色彩规范</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { color: '#4A90D9', name: '海河蓝', usage: '头发、眼睛' },
            { color: '#48C9B0', name: '翡翠绿', usage: '身体渐变' },
            { color: '#76D7C4', name: '流光青', usage: '飘带、粒子' },
            { color: '#F4D03F', name: '星辰金', usage: '点缀、配饰' },
            { color: '#F8F9FA', name: '珍珠白', usage: '高光' },
            { color: '#F5B041', name: '暖阳橙', usage: '脸颊、情绪' },
            { color: '#A569BD', name: '璃光紫', usage: 'AI粒子特效' },
            { color: '#E74C3C', name: '春节红', usage: '节日限定' },
          ].map((color, index) => (
            <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div
                className="w-10 h-10 rounded-lg shadow-inner"
                style={{ backgroundColor: color.color }}
              />
              <div>
                <p className="font-medium text-gray-900 dark:text-white text-sm">{color.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{color.usage}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

export default JinXiaoMaiShowcase;
