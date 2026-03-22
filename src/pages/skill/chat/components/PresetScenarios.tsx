import React from 'react';
import { Image, FileText, Palette, Lightbulb } from 'lucide-react';
import type { PresetScenario } from '../types';

interface PresetScenariosProps {
  onSelect: (message: string) => void;
}

// 为每个场景提供多个自然语言变体，随机选择
const scenarioVariants: Record<string, string[]> = {
  'logo-design': [
    '我想设计一个品牌Logo，能帮我设计一套完整的品牌周边吗？',
    '需要为我的品牌设计Logo和周边产品，请帮我构思一下',
    '正在筹备品牌视觉，想要设计Logo和相关周边，有什么建议？',
    '想做一个有辨识度的品牌Logo，顺便设计一些周边应用',
  ],
  'brand-copy': [
    '能为我的品牌写一段有感染力的宣传文案吗？',
    '需要一段简洁有力的品牌文案，突出我们的核心价值',
    '想为品牌打造独特的宣传语，帮我写一段文案吧',
    '品牌需要更新宣传文案，要能打动目标客户的那种',
  ],
  'color-scheme': [
    '推荐一套适合科技公司的品牌配色方案吧',
    '正在确定品牌色彩，有什么好的配色建议吗？',
    '想要一套专业又现代的配色方案，适合科技行业的',
    '帮我推荐一套能体现科技感的品牌配色',
  ],
  'creative-idea': [
    '帮我想一些创新的营销活动点子，要有创意',
    '需要一些新颖的营销创意，能吸引用户参与的',
    '想策划一场有话题性的营销活动，有什么好点子？',
    '帮我 brainstorm 一些能引爆社交媒体的营销创意',
  ],
};

// 获取随机消息
const getRandomMessage = (scenarioId: string): string => {
  const variants = scenarioVariants[scenarioId];
  if (variants && variants.length > 0) {
    return variants[Math.floor(Math.random() * variants.length)];
  }
  return '';
};

const scenarios: PresetScenario[] = [
  {
    id: 'logo-design',
    name: 'Logo设计',
    description: '设计品牌Logo及周边',
    message: '', // 动态获取
    icon: 'image',
  },
  {
    id: 'brand-copy',
    name: '品牌文案',
    description: '生成品牌宣传文案',
    message: '', // 动态获取
    icon: 'text',
  },
  {
    id: 'color-scheme',
    name: '配色方案',
    description: '推荐品牌配色',
    message: '', // 动态获取
    icon: 'palette',
  },
  {
    id: 'creative-idea',
    name: '创意构思',
    description: '头脑风暴创意',
    message: '', // 动态获取
    icon: 'lightbulb',
  },
];

const iconMap = {
  image: Image,
  text: FileText,
  palette: Palette,
  lightbulb: Lightbulb,
};

export const PresetScenarios: React.FC<PresetScenariosProps> = ({ onSelect }) => {
  const handleSelect = (scenarioId: string) => {
    const message = getRandomMessage(scenarioId);
    if (message) {
      onSelect(message);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-2 p-3">
      {scenarios.map((scenario) => {
        const Icon = iconMap[scenario.icon as keyof typeof iconMap];
        return (
          <button
            key={scenario.id}
            onClick={() => handleSelect(scenario.id)}
            className="flex items-center gap-2 p-2.5 bg-white rounded-lg border border-gray-200 hover:border-blue-400 hover:shadow-sm transition-all text-left group"
          >
            <div className="flex-shrink-0 w-7 h-7 rounded-md bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Icon className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-medium text-gray-800 group-hover:text-blue-600 transition-colors truncate">
                {scenario.name}
              </h3>
              <p className="text-[10px] text-gray-500 truncate">{scenario.description}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default PresetScenarios;
