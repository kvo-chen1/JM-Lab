import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Image, MoreHorizontal, Check } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import type { EventSubmissionType, EventTypeConfig } from '@/types';

interface EventTypeSelectorProps {
  value: EventSubmissionType;
  onChange: (type: EventSubmissionType) => void;
  configs?: EventTypeConfig[];
  disabled?: boolean;
}

const defaultConfigs: Partial<Record<EventSubmissionType, { icon: React.ReactNode; color: string }>> = {
  document: {
    icon: <FileText className="w-6 h-6" />,
    color: 'blue',
  },
  image_description: {
    icon: <Image className="w-6 h-6" />,
    color: 'purple',
  },
  other: {
    icon: <MoreHorizontal className="w-6 h-6" />,
    color: 'gray',
  },
};

const colorClasses: Record<string, { bg: string; border: string; text: string; ring: string }> = {
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-600 dark:text-blue-400',
    ring: 'ring-blue-500',
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    border: 'border-purple-200 dark:border-purple-800',
    text: 'text-purple-600 dark:text-purple-400',
    ring: 'ring-purple-500',
  },
  gray: {
    bg: 'bg-gray-50 dark:bg-gray-800/50',
    border: 'border-gray-200 dark:border-gray-700',
    text: 'text-gray-600 dark:text-gray-400',
    ring: 'ring-gray-500',
  },
};

export default function EventTypeSelector({
  value,
  onChange,
  configs,
  disabled = false,
}: EventTypeSelectorProps) {
  const { isDark } = useTheme();

  const typeList: EventSubmissionType[] = ['document', 'image_description', 'other'];

  const getTypeConfig = (type: EventSubmissionType): EventTypeConfig | undefined => {
    return configs?.find((c) => c.typeCode === type);
  };

  const getTypeLabel = (type: EventSubmissionType): string => {
    const config = getTypeConfig(type);
    if (config) return config.typeName;
    switch (type) {
      case 'document':
        return '文档型活动';
      case 'image_description':
        return '图文型活动';
      case 'other':
        return '其他类型';
      default:
        return type;
    }
  };

  const getTypeDescription = (type: EventSubmissionType): string => {
    const config = getTypeConfig(type);
    if (config) return config.typeDescription || '';
    switch (type) {
      case 'document':
        return '适用于商业计划书、文章、报告等文档类作品';
      case 'image_description':
        return '适用于需要图片配合文字描述的作品';
      case 'other':
        return '适用于其他特殊类型的活动作品';
      default:
        return '';
    }
  };

  const getTypeIcon = (type: EventSubmissionType): React.ReactNode => {
    const config = getTypeConfig(type);
    if (config?.icon) {
      // 根据icon名称返回对应的图标
      switch (config.icon) {
        case 'FileText':
          return <FileText className="w-6 h-6" />;
        case 'Image':
          return <Image className="w-6 h-6" />;
        case 'MoreHorizontal':
          return <MoreHorizontal className="w-6 h-6" />;
        default:
          return defaultConfigs[type]?.icon;
      }
    }
    return defaultConfigs[type]?.icon;
  };

  const getTypeColor = (type: EventSubmissionType): string => {
    return defaultConfigs[type]?.color || 'gray';
  };

  return (
    <div className="space-y-3">
      {typeList.map((type) => {
        const isSelected = value === type;
        const color = getTypeColor(type);
        const colors = colorClasses[color];

        return (
          <motion.button
            key={type}
            onClick={() => !disabled && onChange(type)}
            whileHover={disabled ? {} : { scale: 1.01 }}
            whileTap={disabled ? {} : { scale: 0.99 }}
            className={`
              w-full p-4 rounded-xl border-2 transition-all duration-200 text-left
              ${isSelected ? colors.border : 'border-gray-200 dark:border-gray-700'}
              ${isSelected ? colors.bg : isDark ? 'bg-gray-800 hover:bg-gray-750' : 'bg-white hover:bg-gray-50'}
              ${isSelected ? `ring-2 ${colors.ring} ring-offset-2 dark:ring-offset-gray-900` : ''}
              ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <div className="flex items-start gap-4">
              {/* 图标 */}
              <div
                className={`
                  flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center
                  ${isSelected ? colors.bg : isDark ? 'bg-gray-700' : 'bg-gray-100'}
                  ${isSelected ? colors.text : 'text-gray-500 dark:text-gray-400'}
                `}
              >
                {getTypeIcon(type)}
              </div>

              {/* 内容 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3
                    className={`font-semibold ${
                      isSelected ? colors.text : 'text-gray-900 dark:text-white'
                    }`}
                  >
                    {getTypeLabel(type)}
                  </h3>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className={`flex items-center justify-center w-5 h-5 rounded-full ${colors.bg} ${colors.text}`}
                    >
                      <Check className="w-3 h-3" />
                    </motion.div>
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {getTypeDescription(type)}
                </p>
              </div>

              {/* 选中指示器 */}
              <div
                className={`
                  flex-shrink-0 w-5 h-5 rounded-full border-2 transition-colors
                  ${isSelected ? `${colors.border} ${colors.bg}` : 'border-gray-300 dark:border-gray-600'}
                `}
              >
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`w-full h-full rounded-full ${colors.bg.replace('bg-', 'bg-')}`}
                  >
                    <div className={`w-full h-full rounded-full ${colors.text.replace('text-', 'bg-')}`} />
                  </motion.div>
                )}
              </div>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
