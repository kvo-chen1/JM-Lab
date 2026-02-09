import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { Check, Circle } from 'lucide-react';

export interface Step {
  id: string;
  name: string;
  description?: string;
  icon?: React.ReactNode;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: string;
  onStepChange?: (stepId: string) => void;
  orientation?: 'vertical' | 'horizontal';
  className?: string;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  steps,
  currentStep,
  onStepChange,
  orientation = 'vertical',
  className = ''
}) => {
  const { isDark } = useTheme();
  const currentIndex = steps.findIndex(s => s.id === currentStep);

  const getStepStatus = (index: number) => {
    if (index < currentIndex) return 'completed';
    if (index === currentIndex) return 'active';
    return 'pending';
  };

  const getStepStyles = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          dot: 'bg-primary-500 border-primary-500',
          text: 'text-primary-600 dark:text-primary-400',
          line: 'bg-primary-500'
        };
      case 'active':
        return {
          dot: `bg-white dark:bg-gray-800 border-primary-500 ring-4 ring-primary-100 dark:ring-primary-900/30`,
          text: 'text-primary-600 dark:text-primary-400 font-semibold',
          line: isDark ? 'bg-gray-700' : 'bg-gray-200'
        };
      default:
        return {
          dot: isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300',
          text: isDark ? 'text-gray-500' : 'text-gray-400',
          line: isDark ? 'bg-gray-700' : 'bg-gray-200'
        };
    }
  };

  if (orientation === 'horizontal') {
    return (
      <div className={`w-full ${className}`}>
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const status = getStepStatus(index);
            const styles = getStepStyles(status);
            const isClickable = onStepChange && (status === 'completed' || status === 'active');

            return (
              <React.Fragment key={step.id}>
                <motion.button
                  onClick={() => isClickable && onStepChange(step.id)}
                  disabled={!isClickable}
                  className={`flex flex-col items-center ${isClickable ? 'cursor-pointer' : 'cursor-default'}`}
                  whileHover={isClickable ? { scale: 1.05 } : {}}
                  whileTap={isClickable ? { scale: 0.95 } : {}}
                >
                  <motion.div
                    className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${styles.dot}`}
                    initial={false}
                    animate={status === 'active' ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    {status === 'completed' ? (
                      <Check className="w-5 h-5 text-white" />
                    ) : status === 'active' ? (
                      <div className="w-3 h-3 rounded-full bg-primary-500" />
                    ) : (
                      <Circle className="w-4 h-4 text-gray-400" />
                    )}
                  </motion.div>
                  <span className={`mt-2 text-sm ${styles.text}`}>
                    {step.name}
                  </span>
                </motion.button>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-4 ${styles.line}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Vertical line */}
      <div className={`absolute left-5 top-4 bottom-4 w-0.5 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />

      <div className="space-y-6 relative">
        {steps.map((step, index) => {
          const status = getStepStatus(index);
          const styles = getStepStyles(status);
          const isClickable = onStepChange && (status === 'completed' || status === 'active');

          return (
            <motion.button
              key={step.id}
              onClick={() => isClickable && onStepChange(step.id)}
              disabled={!isClickable}
              className={`flex items-center w-full text-left ${isClickable ? 'cursor-pointer' : 'cursor-default'}`}
              whileHover={isClickable ? { x: 4 } : {}}
              transition={{ duration: 0.2 }}
            >
              <motion.div
                className={`relative z-10 w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${styles.dot}`}
                initial={false}
                animate={status === 'active' ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                {status === 'completed' ? (
                  <Check className="w-5 h-5 text-white" />
                ) : status === 'active' ? (
                  <div className="w-3 h-3 rounded-full bg-primary-500" />
                ) : (
                  <span className={`text-sm font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {index + 1}
                  </span>
                )}
              </motion.div>
              <div className="ml-4 flex-1">
                <span className={`block text-sm transition-colors duration-200 ${styles.text}`}>
                  {step.name}
                </span>
                {step.description && status === 'active' && (
                  <motion.span
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className={`block text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}
                  >
                    {step.description}
                  </motion.span>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default StepIndicator;
