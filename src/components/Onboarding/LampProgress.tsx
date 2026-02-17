import React from 'react';
import { motion } from 'framer-motion';

interface LampProgressProps {
  currentStep: number;
  totalSteps: number;
  accentColor: string;
  isDark: boolean;
  steps: { id: string; title: string; icon: string }[];
}

export const LampProgress: React.FC<LampProgressProps> = ({
  currentStep,
  totalSteps,
  accentColor,
  isDark,
  steps
}) => {
  // 只显示主要步骤（不包括欢迎和完成页面）
  const displaySteps = steps.slice(1, -1);
  const displayTotal = displaySteps.length;
  const displayCurrent = Math.max(0, Math.min(currentStep - 1, displayTotal - 1));

  return (
    <div className="fixed left-6 top-1/2 -translate-y-1/2 z-[10001] pointer-events-auto">
      <div className="flex flex-col items-center gap-3">
        {/* 标题 */}
        <div className={`mb-2 text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          探索进度
        </div>

        {/* 灯串容器 */}
        <div className="relative">
          {/* 连接线 */}
          <div 
            className="absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2"
            style={{
              background: isDark 
                ? 'linear-gradient(to bottom, #374151 0%, #374151 100%)' 
                : 'linear-gradient(to bottom, #e5e7eb 0%, #e5e7eb 100%)'
            }}
          />
          
          {/* 已点亮的连接线 */}
          <motion.div 
            className="absolute left-1/2 top-0 w-0.5 -translate-x-1/2"
            style={{
              background: `linear-gradient(to bottom, ${accentColor} 0%, ${accentColor}80 100%)`,
              boxShadow: `0 0 10px ${accentColor}50`
            }}
            initial={{ height: '0%' }}
            animate={{ height: `${(displayCurrent / (displayTotal - 1)) * 100}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />

          {/* 灯泡列表 */}
          <div className="relative flex flex-col gap-4">
            {displaySteps.map((step, index) => {
              const isLit = index <= displayCurrent;
              const isCurrent = index === displayCurrent;
              
              return (
                <motion.div
                  key={step.id}
                  className="relative flex items-center gap-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  {/* 灯泡 */}
                  <motion.div
                    className="relative w-10 h-10 rounded-full flex items-center justify-center cursor-pointer"
                    style={{
                      background: isLit 
                        ? `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}dd 100%)`
                        : isDark ? '#374151' : '#e5e7eb',
                      boxShadow: isLit 
                        ? `0 0 20px ${accentColor}60, 0 0 40px ${accentColor}30, inset 0 0 10px rgba(255,255,255,0.3)`
                        : 'none'
                    }}
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.95 }}
                    animate={isCurrent ? {
                      boxShadow: [
                        `0 0 20px ${accentColor}60, 0 0 40px ${accentColor}30`,
                        `0 0 30px ${accentColor}80, 0 0 60px ${accentColor}50`,
                        `0 0 20px ${accentColor}60, 0 0 40px ${accentColor}30`
                      ]
                    } : {}}
                    transition={isCurrent ? {
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut'
                    } : {}}
                  >
                    {/* 灯泡内部光晕 */}
                    {isLit && (
                      <div 
                        className="absolute inset-1 rounded-full"
                        style={{
                          background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8) 0%, transparent 60%)`
                        }}
                      />
                    )}
                    
                    {/* 步骤序号 */}
                    <span className={`relative z-10 text-sm font-bold ${
                      isLit ? 'text-white' : isDark ? 'text-gray-500' : 'text-gray-400'
                    }`}>
                      {index + 1}
                    </span>

                    {/* 当前步骤的脉冲效果 */}
                    {isCurrent && (
                      <motion.div
                        className="absolute inset-0 rounded-full"
                        style={{ backgroundColor: accentColor }}
                        initial={{ scale: 1, opacity: 0.6 }}
                        animate={{ scale: 2, opacity: 0 }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                    )}
                  </motion.div>

                  {/* 步骤标题 - 悬停显示 */}
                  <motion.div
                    className={`absolute left-12 whitespace-nowrap px-3 py-1.5 rounded-lg text-sm font-medium ${
                      isDark ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-700'
                    } shadow-lg border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
                    initial={{ opacity: 0, x: -10, pointerEvents: 'none' }}
                    whileHover={{ opacity: 1, x: 0, pointerEvents: 'auto' }}
                    style={{
                      opacity: isCurrent || isLit ? 1 : 0,
                      x: isCurrent || isLit ? 0 : -10
                    }}
                  >
                    {step.title}
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* 完成度百分比 */}
        <div className="mt-4 text-center">
          <motion.div 
            className="text-2xl font-bold"
            style={{ color: accentColor }}
            key={displayCurrent}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
          >
            {Math.round(((displayCurrent + 1) / displayTotal) * 100)}%
          </motion.div>
          <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            已完成
          </div>
        </div>
      </div>
    </div>
  );
};

export default LampProgress;
