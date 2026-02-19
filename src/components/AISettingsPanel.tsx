import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { 
  Sparkles, 
  Briefcase, 
  Palette, 
  Laugh, 
  Zap,
  Sun,
  Moon,
  Monitor,
  MessageSquare,
  Type,
  ScrollText,
  Check,
  X
} from 'lucide-react';
import { AssistantPersonality, AssistantTheme } from '@/services/llmService';

interface AISettingsPanelProps {
  personality: AssistantPersonality;
  theme: AssistantTheme;
  showPresetQuestions: boolean;
  enableTypingEffect: boolean;
  autoScroll: boolean;
  onSettingChange: (key: string, value: any) => void;
  onClose?: () => void;
}

// 性格配置
const personalityConfig: Record<AssistantPersonality, {
  label: string;
  icon: React.ReactNode;
  description: string;
  color: string;
  gradient: string;
}> = {
  friendly: {
    label: '友好',
    icon: <Sparkles className="w-5 h-5" />,
    description: '温暖亲切，像朋友一样交流',
    color: 'from-amber-400 to-orange-500',
    gradient: 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20'
  },
  professional: {
    label: '专业',
    icon: <Briefcase className="w-5 h-5" />,
    description: '严谨准确，提供深度分析',
    color: 'from-blue-400 to-indigo-500',
    gradient: 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20'
  },
  creative: {
    label: '创意',
    icon: <Palette className="w-5 h-5" />,
    description: '富有想象力，激发灵感',
    color: 'from-purple-400 to-pink-500',
    gradient: 'bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20'
  },
  humorous: {
    label: '幽默',
    icon: <Laugh className="w-5 h-5" />,
    description: '轻松有趣，愉快交流',
    color: 'from-green-400 to-emerald-500',
    gradient: 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20'
  },
  concise: {
    label: '简洁',
    icon: <Zap className="w-5 h-5" />,
    description: '直击要点，高效沟通',
    color: 'from-gray-400 to-slate-500',
    gradient: 'bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-800/50 dark:to-slate-800/50'
  }
};

// 主题配置
const themeConfig: Record<AssistantTheme, {
  label: string;
  icon: React.ReactNode;
  description: string;
}> = {
  light: {
    label: '浅色',
    icon: <Sun className="w-5 h-5" />,
    description: '明亮清晰'
  },
  dark: {
    label: '深色',
    icon: <Moon className="w-5 h-5" />,
    description: '护眼舒适'
  },
  auto: {
    label: '自动',
    icon: <Monitor className="w-5 h-5" />,
    description: '跟随系统'
  }
};

export const AISettingsPanel: React.FC<AISettingsPanelProps> = ({
  personality,
  theme,
  showPresetQuestions,
  enableTypingEffect,
  autoScroll,
  onSettingChange,
  onClose
}) => {
  const { isDark } = useTheme();

  return (
    <div className="space-y-6">
      {/* 标题 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            isDark 
              ? 'bg-gradient-to-br from-indigo-500 to-purple-600' 
              : 'bg-gradient-to-br from-indigo-400 to-purple-500'
          }`}>
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              AI 助手设置
            </h3>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              自定义您的专属AI助手
            </p>
          </div>
        </div>
        
        {/* 关闭按钮 */}
        {onClose && (
          <motion.button
            onClick={onClose}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className={`p-2 rounded-lg transition-colors ${
              isDark 
                ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
            title="关闭设置"
          >
            <X className="w-5 h-5" />
          </motion.button>
        )}
      </div>

      {/* 助手性格选择 */}
      <div>
        <label className={`block text-sm font-semibold mb-3 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
          助手性格
        </label>
        <div className="grid grid-cols-1 gap-2">
          {(Object.keys(personalityConfig) as AssistantPersonality[]).map((persona) => {
            const config = personalityConfig[persona];
            const isSelected = personality === persona;
            
            return (
              <motion.button
                key={persona}
                onClick={() => onSettingChange('personality', persona)}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className={`relative p-4 rounded-xl border-2 transition-all duration-300 text-left group ${
                  isSelected
                    ? `border-transparent ${config.gradient} shadow-lg`
                    : isDark
                      ? 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                {/* 选中指示器 */}
                {isSelected && (
                  <motion.div
                    layoutId="personality-indicator"
                    className={`absolute inset-0 rounded-xl bg-gradient-to-r ${config.color} opacity-10`}
                  />
                )}
                
                <div className="relative flex items-center gap-3">
                  {/* 图标 */}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                    isSelected
                      ? `bg-gradient-to-br ${config.color} text-white shadow-md`
                      : isDark
                        ? 'bg-gray-700 text-gray-400 group-hover:text-gray-300'
                        : 'bg-gray-100 text-gray-500 group-hover:text-gray-600'
                  }`}>
                    {config.icon}
                  </div>
                  
                  {/* 文字内容 */}
                  <div className="flex-1">
                    <div className={`font-semibold transition-colors ${
                      isSelected
                        ? isDark ? 'text-white' : 'text-gray-900'
                        : isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {config.label}
                    </div>
                    <div className={`text-xs transition-colors ${
                      isSelected
                        ? isDark ? 'text-gray-300' : 'text-gray-600'
                        : isDark ? 'text-gray-500' : 'text-gray-500'
                    }`}>
                      {config.description}
                    </div>
                  </div>
                  
                  {/* 选中标记 */}
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        `bg-gradient-to-br ${config.color}`
                      }`}
                    >
                      <Check className="w-3.5 h-3.5 text-white" />
                    </motion.div>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* 主题选择 */}
      <div>
        <label className={`block text-sm font-semibold mb-3 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
          界面主题
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(themeConfig) as AssistantTheme[]).map((themeOption) => {
            const config = themeConfig[themeOption];
            const isSelected = theme === themeOption;
            
            return (
              <motion.button
                key={themeOption}
                onClick={() => onSettingChange('theme', themeOption)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`relative p-3 rounded-xl border-2 transition-all duration-300 ${
                  isSelected
                    ? isDark
                      ? 'border-indigo-500 bg-indigo-500/10'
                      : 'border-indigo-500 bg-indigo-50'
                    : isDark
                      ? 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md'
                      : isDark
                        ? 'bg-gray-700 text-gray-400'
                        : 'bg-gray-100 text-gray-500'
                  }`}>
                    {config.icon}
                  </div>
                  <div className={`text-xs font-medium ${
                    isSelected
                      ? isDark ? 'text-indigo-300' : 'text-indigo-700'
                      : isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {config.label}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* 功能开关 */}
      <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
        <label className={`block text-sm font-semibold mb-3 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
          功能设置
        </label>
        
        <div className="space-y-3">
          {/* 显示预设问题 */}
          <ToggleSwitch
            icon={<MessageSquare className="w-4 h-4" />}
            label="显示预设问题"
            description="对话开始时显示快捷问题"
            checked={showPresetQuestions}
            onChange={(checked) => onSettingChange('showPresetQuestions', checked)}
          />
          
          {/* 启用打字效果 */}
          <ToggleSwitch
            icon={<Type className="w-4 h-4" />}
            label="启用打字效果"
            description="模拟真实打字动画"
            checked={enableTypingEffect}
            onChange={(checked) => onSettingChange('enableTypingEffect', checked)}
          />
          
          {/* 自动滚动 */}
          <ToggleSwitch
            icon={<ScrollText className="w-4 h-4" />}
            label="自动滚动"
            description="新消息自动滚动到底部"
            checked={autoScroll}
            onChange={(checked) => onSettingChange('autoScroll', checked)}
          />
        </div>
      </div>
    </div>
  );
};

// 开关组件
interface ToggleSwitchProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  icon,
  label,
  description,
  checked,
  onChange
}) => {
  const { isDark } = useTheme();

  return (
    <label className="flex items-center justify-between cursor-pointer group">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
          isDark 
            ? 'bg-gray-700 text-gray-400 group-hover:text-gray-300' 
            : 'bg-white text-gray-500 group-hover:text-gray-600'
        }`}>
          {icon}
        </div>
        <div>
          <div className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
            {label}
          </div>
          <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
            {description}
          </div>
        </div>
      </div>
      
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
          checked
            ? 'bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30'
            : isDark
              ? 'bg-gray-700'
              : 'bg-gray-300'
        }`}
      >
        <motion.div
          initial={false}
          animate={{
            x: checked ? 24 : 2,
            scale: checked ? 1.1 : 1
          }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-md"
        />
      </button>
    </label>
  );
};

export default AISettingsPanel;
