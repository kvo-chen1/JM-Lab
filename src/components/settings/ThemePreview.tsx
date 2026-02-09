import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { Sun, Moon, Monitor, Sparkles } from 'lucide-react';
import { themeConfig, Theme } from '@/config/themeConfig';

interface ThemePreviewProps {
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
}

const themeIcons: Record<string, React.ElementType> = {
  light: Sun,
  dark: Moon,
  auto: Monitor,
  system: Monitor,
  pink: Sparkles,
  blue: Sparkles,
  green: Sparkles,
};

export function ThemePreview({ currentTheme, onThemeChange }: ThemePreviewProps) {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
          主题预览
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          点击切换不同主题风格
        </p>
      </div>

      {/* 主题卡片网格 */}
      <div className="grid grid-cols-2 gap-3">
        {themeConfig.map((theme) => {
          const Icon = themeIcons[theme.value] || Sun;
          const isActive = currentTheme === theme.value;

          return (
            <motion.button
              key={theme.value}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onThemeChange(theme.value)}
              className={clsx(
                'relative p-4 rounded-xl border-2 transition-all duration-200',
                'flex flex-col items-center gap-2',
                isActive
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              )}
            >
              {/* 选中指示器 */}
              {isActive && (
                <motion.div
                  layoutId="themeIndicator"
                  className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center"
                >
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
              )}

              <div
                className={clsx(
                  'w-10 h-10 rounded-lg flex items-center justify-center',
                  isActive
                    ? 'bg-blue-100 dark:bg-blue-800/30 text-blue-600 dark:text-blue-400'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                )}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className={clsx(
                'text-xs font-medium',
                isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
              )}>
                {theme.label}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* 预览卡片 */}
      <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="bg-gray-100 dark:bg-gray-800 px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-400">
          预览效果
        </div>
        <div className="p-4 bg-white dark:bg-[#1a1a1a]">
          <div className="space-y-3">
            {/* 模拟内容 */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600" />
              <div className="flex-1">
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-20" />
                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded w-32 mt-1.5" />
              </div>
            </div>
            <div className="h-16 bg-gray-50 dark:bg-gray-800/50 rounded-lg" />
            <div className="flex gap-2">
              <div className="h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex-1" />
              <div className="h-6 bg-gray-100 dark:bg-gray-800 rounded-full flex-1" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ThemePreview;
