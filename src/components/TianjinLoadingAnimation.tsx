import { motion } from 'framer-motion';

interface TianjinLoadingAnimationProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export function TianjinLoadingAnimation({ 
  size = 'md', 
  text = '正在加载...' 
}: TianjinLoadingAnimationProps) {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      {/* 天津之眼风格加载动画 */}
      <div className={`relative ${sizeClasses[size]}`}>
        {/* 外圈 - 天津之眼 */}
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-dashed border-[#C0C5CE]/30"
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />
        
        {/* 中圈 - 海河蓝 */}
        <motion.div
          className="absolute inset-2 rounded-full border-4 border-[#1E5F8E]/40"
          animate={{ rotate: -360 }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        />
        
        {/* 内圈 - 历史砖红 */}
        <motion.div
          className="absolute inset-4 rounded-full border-4 border-dotted border-[#A0522D]/50"
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        />
        
        {/* 中心 - 活力金黄 */}
        <motion.div
          className="absolute inset-6 rounded-full bg-gradient-to-br from-[#D4A84B] to-[#E8C878] flex items-center justify-center"
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.8, 1, 0.8]
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <span className="text-white font-bold text-lg">津</span>
        </motion.div>

        {/* 辐条 */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute top-1/2 left-1/2 w-1/2 h-0.5 bg-gradient-to-r from-[#1E5F8E]/30 to-transparent origin-left"
            style={{ transform: `rotate(${i * 45}deg)` }}
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
          />
        ))}
      </div>

      {/* 文字 */}
      <motion.p
        className={`${textSizes[size]} text-gray-600 dark:text-gray-400 font-medium`}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      >
        {text}
      </motion.p>

      {/* 波浪装饰 */}
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-[#1E5F8E]"
            animate={{ 
              y: [0, -8, 0],
              opacity: [0.3, 1, 0.3]
            }}
            transition={{ 
              duration: 1, 
              repeat: Infinity, 
              ease: "easeInOut",
              delay: i * 0.1
            }}
          />
        ))}
      </div>
    </div>
  );
}

// 海河波浪加载条
export function HaiheWaveLoadingBar({ progress = 0 }: { progress?: number }) {
  return (
    <div className="w-full max-w-md mx-auto">
      {/* 波浪背景 */}
      <div className="relative h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-[#1E5F8E] via-[#4A90B8] to-[#1E5F8E]"
          style={{ width: `${progress}%` }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
        
        {/* 波浪动画 */}
        <svg
          className="absolute top-0 left-0 w-full h-full"
          preserveAspectRatio="none"
          viewBox="0 0 100 10"
        >
          <motion.path
            d="M0,5 Q25,0 50,5 T100,5"
            fill="none"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="0.5"
            animate={{
              d: [
                "M0,5 Q25,0 50,5 T100,5",
                "M0,5 Q25,10 50,5 T100,5",
                "M0,5 Q25,0 50,5 T100,5"
              ]
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </svg>
      </div>
      
      {/* 百分比 */}
      <div className="flex justify-between mt-2 text-sm text-gray-600 dark:text-gray-400">
        <span>加载中...</span>
        <span>{Math.round(progress)}%</span>
      </div>
    </div>
  );
}

// 天津特色骨架屏
export function TianjinSkeletonCard() {
  return (
    <div className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      {/* 头部 */}
      <div className="flex items-center gap-3 mb-4">
        <motion.div
          className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1E5F8E]/20 to-[#A0522D]/20"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <div className="flex-1 space-y-2">
          <motion.div
            className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.1 }}
          />
          <motion.div
            className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
          />
        </div>
      </div>
      
      {/* 内容 */}
      <div className="space-y-2">
        <motion.div
          className="h-3 bg-gray-200 dark:bg-gray-700 rounded"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
        />
        <motion.div
          className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
        />
        <motion.div
          className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/6"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
        />
      </div>
      
      {/* 底部装饰线 - 海河波浪风格 */}
      <div className="mt-4 h-1 bg-gradient-to-r from-[#1E5F8E]/30 via-[#A0522D]/30 to-[#D4A84B]/30 rounded-full" />
    </div>
  );
}

// 全屏加载遮罩
export function TianjinFullScreenLoading({ 
  isLoading, 
  text = '正在加载天津主题...' 
}: { 
  isLoading: boolean; 
  text?: string;
}) {
  if (!isLoading) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm z-50 flex items-center justify-center"
    >
      <TianjinLoadingAnimation size="lg" text={text} />
    </motion.div>
  );
}

export default TianjinLoadingAnimation;
