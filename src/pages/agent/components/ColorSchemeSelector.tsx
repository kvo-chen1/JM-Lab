import React from 'react';
import { motion } from 'framer-motion';
import { Check, Palette } from 'lucide-react';
import { useAgentStore } from '../hooks/useAgentStore';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';

interface ColorOption {
  id: string;
  name: string;
  color: string;
  description: string;
  emoji?: string;
}

interface ColorSchemeSelectorProps {
  title?: string;
  options: ColorOption[];
  onSelect?: (option: ColorOption) => void;
  selectedId?: string;
}

// 预定义的配色方案
export const PRESET_COLOR_SCHEMES: ColorOption[] = [
  {
    id: 'warm-orange',
    name: '暖橙色',
    color: '#F9A623',
    description: '阳光小面包，活力温暖',
    emoji: '🍞'
  },
  {
    id: 'cream-white',
    name: '奶油白',
    color: '#FFF8E7',
    description: '云朵棉花糖，纯净柔软',
    emoji: '☁️'
  },
  {
    id: 'soft-pink',
    name: '淡粉色',
    color: '#FFB6C1',
    description: '春日桃花瓣，甜美梦幻',
    emoji: '🌸'
  },
  {
    id: 'mint-green',
    name: '薄荷绿',
    color: '#98FB98',
    description: '清新自然，生机勃勃',
    emoji: '🌿'
  },
  {
    id: 'sky-blue',
    name: '天空蓝',
    color: '#87CEEB',
    description: '澄澈明朗，宁静舒适',
    emoji: '☁️'
  },
  {
    id: 'lavender',
    name: '薰衣草紫',
    color: '#E6E6FA',
    description: '浪漫优雅，温柔治愈',
    emoji: '💜'
  }
];

export default function ColorSchemeSelector({
  title = '请选择配色方案',
  options = PRESET_COLOR_SCHEMES,
  onSelect,
  selectedId
}: ColorSchemeSelectorProps) {
  const { isDark } = useTheme();
  const { addMessage } = useAgentStore();

  const handleSelect = (option: ColorOption) => {
    // 发送选择消息
    addMessage({
      role: 'user',
      content: `我选择${option.name}配色方案`,
      type: 'text',
      metadata: {
        selectedColorScheme: option
      }
    });

    toast.success(`已选择${option.name}`);

    // 调用外部回调
    onSelect?.(option);
  };

  return (
    <div className="mt-4 space-y-4">
      {/* 标题 */}
      <div className="flex items-center gap-2">
        <Palette className={`w-4 h-4 ${isDark ? 'text-[#E85D75]' : 'text-[#C02C38]'}`} />
        <h4 className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
          {title}
        </h4>
      </div>

      {/* 配色方案卡片网格 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {options.map((option, index) => {
          const isSelected = selectedId === option.id;

          return (
            <motion.button
              key={option.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSelect(option)}
              className={`
                relative overflow-hidden rounded-xl p-4 text-left transition-all
                ${isSelected
                  ? 'ring-2 ring-[#C02C38] ring-offset-2 ring-offset-transparent'
                  : ''
                }
                ${isDark
                  ? 'bg-[#2A2A3E] hover:bg-[#3A3A4E] border border-[#3A3A4E]'
                  : 'bg-white hover:bg-gray-50 border border-gray-200 shadow-sm'
                }
              `}
            >
              {/* 颜色预览条 */}
              <div
                className="absolute top-0 left-0 right-0 h-1.5"
                style={{ backgroundColor: option.color }}
              />

              {/* 选中标记 */}
              {isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#C02C38] flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}

              {/* 内容 */}
              <div className="pt-3">
                {/* Emoji 和名称 */}
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{option.emoji}</span>
                  <span className={`font-medium text-sm ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                    {option.name}
                  </span>
                </div>

                {/* 描述 */}
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} line-clamp-2`}>
                  {option.description}
                </p>

                {/* 颜色值 */}
                <div className="mt-2 flex items-center gap-1.5">
                  <div
                    className="w-4 h-4 rounded-full border border-gray-200/50"
                    style={{ backgroundColor: option.color }}
                  />
                  <span className={`text-[10px] font-mono ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {option.color}
                  </span>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* 提示文字 */}
      <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
        点击卡片直接选择配色方案
      </p>
    </div>
  );
}

// 从消息内容中解析配色方案
export function parseColorSchemesFromContent(content: string | undefined | null): ColorOption[] | null {
  if (!content || typeof content !== 'string') {
    return null;
  }

  // 匹配常见的配色方案列表格式
  const patterns = [
    // 匹配 "暖橙色 - 阳光小面包，活力温暖" 格式
    /([\u4e00-\u9fa5]+色)\s*[-–—]\s*([^\n]+)/g,
    // 匹配 "1. 暖橙色：阳光小面包" 格式
    /\d+\.\s*([\u4e00-\u9fa5]+色)[：:]\s*([^\n]+)/g,
    // 匹配 "- 暖橙色：阳光小面包" 格式
    /[-•]\s*([\u4e00-\u9fa5]+色)[：:]\s*([^\n]+)/g
  ];

  const schemes: ColorOption[] = [];
  const seen = new Set<string>();

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const name = match[1].trim();
      const description = match[2].trim();

      if (!seen.has(name)) {
        seen.add(name);

        // 根据名称推断颜色值
        const colorMap: Record<string, string> = {
          '暖橙色': '#F9A623',
          '奶油白': '#FFF8E7',
          '淡粉色': '#FFB6C1',
          '薄荷绿': '#98FB98',
          '天空蓝': '#87CEEB',
          '薰衣草紫': '#E6E6FA',
          '红色': '#FF6B6B',
          '蓝色': '#4ECDC4',
          '绿色': '#95E1D3',
          '黄色': '#FFD93D',
          '紫色': '#C7CEEA',
          '粉色': '#FFB6C1',
          '橙色': '#FFA07A',
          '青色': '#7FDBDA',
          '白色': '#F8F9FA',
          '黑色': '#2D3436',
          '灰色': '#B2BEC3',
          '棕色': '#D4A373',
          '金色': '#FFD700',
          '银色': '#C0C0C0'
        };

        const color = colorMap[name] || '#999999';
        const emojiMap: Record<string, string> = {
          '暖橙色': '🍊',
          '奶油白': '🥛',
          '淡粉色': '🌸',
          '薄荷绿': '🌿',
          '天空蓝': '☁️',
          '薰衣草紫': '💜',
          '红色': '❤️',
          '蓝色': '💙',
          '绿色': '💚',
          '黄色': '💛',
          '紫色': '💜',
          '粉色': '🩷',
          '橙色': '🧡',
          '青色': '🩵',
          '白色': '🤍',
          '黑色': '🖤',
          '灰色': '🩶',
          '棕色': '🤎',
          '金色': '✨',
          '银色': '🔘'
        };

        schemes.push({
          id: `color-${schemes.length}`,
          name,
          color,
          description,
          emoji: emojiMap[name] || '🎨'
        });
      }
    }
  }

  return schemes.length > 0 ? schemes : null;
}

// 从消息内容中解析选项列表
export function parseOptionsFromContent(content: string | undefined | null): string[] | null {
  if (!content || typeof content !== 'string') {
    return null;
  }

  const options: string[] = [];
  const seen = new Set<string>();

  // 按行分割并处理
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // 匹配 "1. 造型比例：xxx" 或 "1) 造型比例" 格式
    const numberedMatch = line.match(/^(\d+)[.)]\s*(.+)$/);
    if (numberedMatch) {
      let optionText = numberedMatch[2].trim();

      // 只取第一行内容，遇到 "-" 或 "•" 开头的行就停止
      // 检查下一行是否是列表项
      for (let j = i + 1; j < lines.length; j++) {
        const nextLine = lines[j].trim();
        // 如果遇到新的编号或空行，停止
        if (nextLine.match(/^(\d+)[.)]\s*/) || nextLine === '') {
          break;
        }
        // 如果遇到 "-" 或 "•" 开头的行，停止（不合并）
        if (nextLine.match(/^[-•]\s*/)) {
          break;
        }
        // 如果是普通文本，追加到当前选项（但限制长度）
        if (optionText.length < 100) {
          optionText += ' ' + nextLine;
        }
        i = j; // 更新索引
      }

      // 清理选项文本
      optionText = optionText
        .replace(/^[：:]\s*/, '')  // 移除开头冒号
        .replace(/[：:]\s*$/, '')  // 移除末尾冒号
        .replace(/--/g, '')        // 移除 "--"
        .trim();

      if (optionText.length >= 2 && !seen.has(optionText)) {
        seen.add(optionText);
        options.push(optionText);
      }
    }
  }

  // 如果找到至少2个选项，返回结果
  return options.length >= 2 ? options : null;
}
