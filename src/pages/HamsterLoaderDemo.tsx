import { useState } from 'react';
import { HamsterWheelLoader } from '@/components/ui';
import { motion } from 'framer-motion';

export default function HamsterLoaderDemo() {
  const [showFullScreen, setShowFullScreen] = useState(false);
  const [loadingText, setLoadingText] = useState('加载中...');

  const demoTexts = [
    '加载中...',
    '努力奔跑中...',
    '马上就好...',
    '正在获取数据...',
    '仓鼠正在努力工作...',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-6xl mx-auto">
        {/* 标题 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-4">
            🐹 仓鼠跑轮加载动画
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            一个可爱的仓鼠在轮子里奔跑的加载动画组件
          </p>
        </motion.div>

        {/* 尺寸展示 */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-8"
        >
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6">
            📏 不同尺寸
          </h2>
          <div className="flex flex-wrap items-end justify-center gap-12">
            <div className="flex flex-col items-center gap-2">
              <HamsterWheelLoader size="small" />
              <span className="text-sm text-gray-500">small</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <HamsterWheelLoader size="medium" />
              <span className="text-sm text-gray-500">medium (默认)</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <HamsterWheelLoader size="large" />
              <span className="text-sm text-gray-500">large</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <HamsterWheelLoader size="xlarge" />
              <span className="text-sm text-gray-500">xlarge</span>
            </div>
          </div>
        </motion.section>

        {/* 文字变体 */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-8"
        >
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6">
            💬 自定义文字
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
              <HamsterWheelLoader size="medium" text="正在加载..." />
            </div>
            <div className="flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
              <HamsterWheelLoader size="medium" text="努力奔跑中..." />
            </div>
            <div className="flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
              <HamsterWheelLoader size="medium" text="马上就好！" />
            </div>
          </div>
        </motion.section>

        {/* 全屏演示 */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-8"
        >
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6">
            🖥️ 全屏加载演示
          </h2>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {demoTexts.map((text) => (
                <button
                  key={text}
                  onClick={() => setLoadingText(text)}
                  className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                    loadingText === text
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {text}
                </button>
              ))}
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setShowFullScreen(true)}
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-medium hover:from-orange-600 hover:to-amber-600 transition-all transform hover:scale-105 shadow-lg"
              >
                预览全屏加载效果
              </button>
            </div>
          </div>
        </motion.section>

        {/* 使用场景示例 */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-8"
        >
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6">
            🎯 使用场景
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 卡片加载 */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-6">
              <h3 className="font-medium text-gray-800 dark:text-white mb-4">卡片加载</h3>
              <div className="h-32 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <HamsterWheelLoader size="small" text="获取数据中..." />
              </div>
            </div>

            {/* 按钮加载 */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-6">
              <h3 className="font-medium text-gray-800 dark:text-white mb-4">按钮加载</h3>
              <div className="h-32 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-center gap-4">
                <button className="px-6 py-3 bg-orange-500 text-white rounded-lg flex items-center gap-2 opacity-70 cursor-not-allowed">
                  <HamsterWheelLoader size="small" />
                  提交中...
                </button>
              </div>
            </div>
          </div>
        </motion.section>

        {/* 代码示例 */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gray-900 rounded-2xl shadow-lg p-8"
        >
          <h2 className="text-2xl font-semibold text-white mb-6">
            📝 代码示例
          </h2>
          <pre className="text-sm text-gray-300 overflow-x-auto">
{`import { HamsterWheelLoader } from '@/components/ui';

// 基础用法
<HamsterWheelLoader />

// 指定尺寸
<HamsterWheelLoader size="large" />

// 带文字
<HamsterWheelLoader text="正在加载..." />

// 全屏加载
<HamsterWheelLoader 
  fullScreen 
  overlay 
  text="加载中..." 
/>`}
          </pre>
        </motion.section>
      </div>

      {/* 全屏加载遮罩 */}
      {showFullScreen && (
        <HamsterWheelLoader
          fullScreen
          overlay
          text={loadingText}
        />
      )}

      {/* 关闭全屏按钮（当全屏显示时） */}
      {showFullScreen && (
        <button
          onClick={() => setShowFullScreen(false)}
          className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-[80] px-6 py-3 bg-white text-gray-800 rounded-full shadow-lg hover:bg-gray-100 transition-colors"
        >
          关闭演示
        </button>
      )}
    </div>
  );
}
