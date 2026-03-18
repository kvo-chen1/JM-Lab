import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { JinXiaoMai, JinXiaoMaiExpression } from '@/components/jinmai';
import { JinXiaoMaiShowcase } from '@/components/jinmai/JinXiaoMaiShowcase';

const expressions: { key: JinXiaoMaiExpression; label: string; desc: string }[] = [
  { key: 'smile', label: '微笑', desc: '欢迎、默认状态' },
  { key: 'happy', label: '开心', desc: '创作成功、收到赞赏' },
  { key: 'thinking', label: '思考', desc: '优化建议、分析问题' },
  { key: 'surprised', label: '惊讶', desc: '发现新功能、收到礼物' },
  { key: 'cheer', label: '加油', desc: '鼓励用户、任务进行中' },
];

const modes = [
  { key: 'default', label: '默认模式', emoji: '✨' },
  { key: 'creation', label: '创作模式', emoji: '🎨' },
  { key: 'ipIncubation', label: 'IP孵化模式', emoji: '🌟' },
  { key: 'mall', label: '商城模式', emoji: '🎁' },
  { key: 'community', label: '社区模式', emoji: '💬' },
];

const festivals = [
  { key: null, label: '默认', emoji: '🌊' },
  { key: 'spring', label: '春节', emoji: '🧧' },
  { key: 'lantern', label: '元宵', emoji: '🏮' },
  { key: 'dragonBoat', label: '端午', emoji: '🐉' },
];

export default function IPCharacterShowcase() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-teal-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>返回</span>
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            <span className="bg-gradient-to-r from-blue-600 via-teal-500 to-cyan-600 bg-clip-text text-transparent">
              津小脉
            </span>
            {' '}IP形象
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            传承津门文化，智启创意未来
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            津脉智坊平台官方吉祥物
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-teal-500"></span>
              基础形象
            </h2>
            <div className="flex flex-col items-center justify-center py-12 bg-gradient-to-br from-blue-50 to-teal-50 dark:from-gray-700 dark:to-gray-600 rounded-2xl">
              <JinXiaoMai expression="smile" size="xl" animate={true} />
              <div className="mt-6 text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">津小脉</p>
                <p className="text-gray-500 dark:text-gray-400">JinXiaoMai</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-500"></span>
              形象故事
            </h2>
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-gray-700 dark:to-gray-600 rounded-2xl p-6">
              <div className="prose dark:prose-invert max-w-none">
                <blockquote className="text-lg italic text-gray-700 dark:text-gray-300 border-l-4 border-amber-500 pl-4 mb-4">
                  在海河之畔，千年文化汇聚成一滴晶莹的水珠。
                  这颗水珠吸收了天津卫的天地灵气，
                  化身为津脉精灵——津小脉。
                </blockquote>
                <p className="text-gray-600 dark:text-gray-400">
                  她承载着津门故里的文化记忆，也拥有连接未来的智慧力量。
                  每当创作者灵感枯竭时，津小脉便会化作流光，将创意的火花重新点燃。
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl mb-12"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"></span>
            五种表情
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {expressions.map((exp, index) => (
              <motion.div
                key={exp.key}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                className="flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl hover:shadow-lg transition-shadow"
              >
                <JinXiaoMai expression={exp.key} size="lg" animate={false} />
                <p className="mt-3 font-semibold text-gray-900 dark:text-white">{exp.label}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">{exp.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl mb-12"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500"></span>
            功能模式
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {modes.map((mode, index) => (
              <motion.div
                key={mode.key}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + index * 0.05 }}
                className="flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl hover:shadow-lg transition-shadow"
              >
                <JinXiaoMai expression="smile" mode={mode.key as any} size="md" animate={false} />
                <p className="mt-3 text-2xl">{mode.emoji}</p>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">{mode.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl mb-12"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-gradient-to-r from-amber-500 to-red-500"></span>
            节日限定
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {festivals.map((festival, index) => (
              <motion.div
                key={festival.key || 'default'}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + index * 0.05 }}
                className="flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl hover:shadow-lg transition-shadow"
              >
                <JinXiaoMai expression="happy" festival={festival.key as any} size="md" animate={false} />
                <p className="mt-3 text-2xl">{festival.emoji}</p>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">{festival.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl mb-12"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-500"></span>
            尺寸规格
          </h2>
          <div className="flex items-end justify-center gap-8 py-8 bg-gray-50 dark:bg-gray-700 rounded-2xl">
            {['sm', 'md', 'lg', 'xl'].map((size, index) => (
              <motion.div
                key={size}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.05 }}
                className="flex flex-col items-center"
              >
                <JinXiaoMai expression="smile" size={size as any} animate={false} />
                <p className="mt-2 text-sm font-medium text-gray-600 dark:text-gray-400 capitalize">{size}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-gradient-to-r from-blue-600 via-teal-600 to-cyan-600 rounded-3xl p-8 text-white mb-12"
        >
          <h2 className="text-2xl font-bold mb-6">应用场景</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: '🏠', title: '首页欢迎', desc: '用户首次访问时展示' },
              { icon: '🎨', title: 'AI创作助手', desc: '创作过程中的引导' },
              { icon: '📦', title: 'IP孵化进度', desc: '配合5阶段展示' },
              { icon: '🛒', title: '商品详情页', desc: '商城装饰元素' },
              { icon: '💬', title: '社区互动', desc: '聊天提示和引导' },
              { icon: '📱', title: '空状态', desc: 'Loading加载动画' },
              { icon: '🎁', title: '红包封面', desc: '节日营销物料' },
              { icon: '✨', title: '表情包', desc: '聊天使用' },
            ].map((scene, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 + index * 0.03 }}
                className="flex flex-col items-center p-4 bg-white/10 rounded-xl backdrop-blur-sm hover:bg-white/20 transition-colors"
              >
                <span className="text-3xl mb-2">{scene.icon}</span>
                <p className="font-semibold text-center">{scene.title}</p>
                <p className="text-xs text-white/70 text-center">{scene.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"></span>
            色彩规范
          </h2>
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
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 + index * 0.03 }}
                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl"
              >
                <div
                  className="w-12 h-12 rounded-lg shadow-inner flex-shrink-0"
                  style={{ backgroundColor: color.color }}
                />
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">{color.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{color.usage}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="mt-12 text-center text-gray-500 dark:text-gray-400 text-sm"
        >
          <p>津脉智坊 · 津小脉 IP形象设计</p>
          <p className="mt-1">传承津门文化，智启创意未来</p>
        </motion.div>
      </div>
    </div>
  );
}
