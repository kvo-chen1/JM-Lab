import { motion } from 'framer-motion';

interface Step {
  id: number;
  title: string;
  icon: string;
  desc: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
  isDark: boolean;
}

export default function StepIndicator({ steps, currentStep, isDark }: StepIndicatorProps) {
  return (
    <div className="w-full">
      {/* 桌面端步骤指示器 */}
      <div className="hidden md:flex items-center justify-center gap-2">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          const isPending = currentStep < step.id;

          return (
            <div key={step.id} className="flex items-center">
              {/* 步骤节点 */}
              <motion.div
                className="relative flex flex-col items-center"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                {/* 步骤圆圈 */}
                <motion.div
                  className={`
                    relative w-14 h-14 rounded-2xl flex items-center justify-center
                    transition-all duration-500 ease-out
                    ${isCompleted
                      ? 'bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/30'
                      : isCurrent
                        ? 'bg-gradient-to-br from-red-500 to-orange-500 shadow-xl shadow-red-500/40'
                        : isDark
                          ? 'bg-gray-800 border border-gray-700'
                          : 'bg-white border border-gray-200 shadow-md'
                    }
                  `}
                  animate={isCurrent ? {
                    scale: [1, 1.05, 1],
                    boxShadow: [
                      '0 10px 25px -5px rgba(239, 68, 68, 0.4)',
                      '0 20px 35px -5px rgba(239, 68, 68, 0.5)',
                      '0 10px 25px -5px rgba(239, 68, 68, 0.4)'
                    ]
                  } : {}}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  whileHover={{ scale: isPending ? 1.05 : 1 }}
                >
                  {/* 图标 */}
                  {isCompleted ? (
                    <motion.i
                      className="fas fa-check text-white text-lg"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                    />
                  ) : (
                    <i className={`fas ${step.icon} ${isCurrent ? 'text-white' : isDark ? 'text-gray-500' : 'text-gray-400'} text-lg`} />
                  )}

                  {/* 当前步骤的脉冲光环 */}
                  {isCurrent && (
                    <>
                      <motion.div
                        className="absolute inset-0 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500"
                        initial={{ scale: 1, opacity: 0.5 }}
                        animate={{ scale: 1.4, opacity: 0 }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
                      />
                      <motion.div
                        className="absolute inset-0 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500"
                        initial={{ scale: 1, opacity: 0.5 }}
                        animate={{ scale: 1.4, opacity: 0 }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut', delay: 0.5 }}
                      />
                    </>
                  )}
                </motion.div>

                {/* 步骤标题和描述 */}
                <div className="mt-3 text-center">
                  <motion.p
                    className={`
                      text-sm font-semibold transition-colors duration-300
                      ${isCompleted || isCurrent
                        ? 'text-gray-900 dark:text-white'
                        : isDark ? 'text-gray-500' : 'text-gray-400'
                      }
                    `}
                    animate={isCurrent ? { y: [0, -2, 0] } : {}}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    {step.title}
                  </motion.p>
                  <p className={`
                    text-xs mt-1 transition-all duration-300 max-w-[100px]
                    ${isCurrent
                      ? 'text-red-500 dark:text-red-400 opacity-100'
                      : isCompleted
                        ? 'text-emerald-500 dark:text-emerald-400 opacity-100'
                        : 'opacity-0'
                    }
                  `}>
                    {step.desc}
                  </p>
                </div>

                {/* 步骤编号徽章 */}
                <div className={`
                  absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs font-bold
                  flex items-center justify-center
                  ${isCompleted
                    ? 'bg-emerald-500 text-white'
                    : isCurrent
                      ? 'bg-white text-red-500 shadow-md'
                      : isDark
                        ? 'bg-gray-700 text-gray-400'
                        : 'bg-gray-200 text-gray-500'
                  }
                `}>
                  {step.id}
                </div>
              </motion.div>

              {/* 连接线 */}
              {index < steps.length - 1 && (
                <div className="relative w-24 mx-4">
                  {/* 背景线 */}
                  <div className={`
                    absolute inset-0 h-1 rounded-full
                    ${isDark ? 'bg-gray-800' : 'bg-gray-200'}
                  `} />

                  {/* 进度线 */}
                  <motion.div
                    className="absolute inset-0 h-1 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500"
                    initial={{ width: '0%' }}
                    animate={{ width: isCompleted ? '100%' : '0%' }}
                    transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
                  />

                  {/* 当前进度指示 */}
                  {isCurrent && (
                    <motion.div
                      className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-red-500 shadow-lg shadow-red-500/50"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 移动端步骤指示器 */}
      <div className="md:hidden">
        <div className={`
          flex items-center justify-between p-4 rounded-2xl
          ${isDark ? 'bg-gray-800/80 border border-gray-700' : 'bg-white border border-gray-200 shadow-lg'}
        `}>
          {/* 当前步骤信息 */}
          <div className="flex items-center gap-3">
            <motion.div
              className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white shadow-lg"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <i className={`fas ${steps[currentStep - 1]?.icon || 'fa-circle'} text-lg`} />
            </motion.div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">步骤 {currentStep} / {steps.length}</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {steps[currentStep - 1]?.title || ''}
              </p>
            </div>
          </div>

          {/* 进度百分比 */}
          <div className="text-right">
            <p className="text-2xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
              {Math.round((currentStep / steps.length) * 100)}%
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">已完成</p>
          </div>
        </div>

        {/* 进度条 */}
        <div className="mt-3 relative h-2 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
          <motion.div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-500 via-orange-500 to-amber-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(currentStep / steps.length) * 100}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
          {/* 闪光效果 */}
          <motion.div
            className="absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          />
        </div>

        {/* 步骤点指示器 */}
        <div className="flex justify-center gap-2 mt-4">
          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              className={`
                w-2.5 h-2.5 rounded-full transition-all duration-300
                ${index + 1 < currentStep
                  ? 'bg-emerald-500 w-6'
                  : index + 1 === currentStep
                    ? 'bg-red-500 w-6'
                    : isDark ? 'bg-gray-700' : 'bg-gray-300'
                }
              `}
              whileHover={{ scale: 1.2 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
