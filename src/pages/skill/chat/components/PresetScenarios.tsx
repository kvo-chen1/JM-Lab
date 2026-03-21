import React from 'react';
import { Image, FileText, Palette, Lightbulb } from 'lucide-react';
import type { PresetScenario } from '../types';

interface PresetScenariosProps {
  onSelect: (message: string) => void;
}

const scenarios: PresetScenario[] = [
  {
    id: 'logo-design',
    name: 'Logo设计',
    description: '设计一个品牌Logo',
    message: '基于我们的Logo设计一套品牌周边',
    icon: 'image',
  },
  {
    id: 'brand-copy',
    name: '品牌文案',
    description: '生成品牌宣传文案',
    message: '为我的品牌写一段宣传文案，要求简洁有力，突出品牌价值',
    icon: 'text',
  },
  {
    id: 'color-scheme',
    name: '配色方案',
    description: '推荐品牌配色',
    message: '推荐一套适合科技公司的品牌配色方案',
    icon: 'palette',
  },
  {
    id: 'creative-idea',
    name: '创意构思',
    description: '头脑风暴创意',
    message: '帮我想一些创新的营销活动点子',
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
  return (
    <div className="grid grid-cols-2 gap-3 p-4">
      {scenarios.map((scenario) => {
        const Icon = iconMap[scenario.icon as keyof typeof iconMap];
        return (
          <button
            key={scenario.id}
            onClick={() => onSelect(scenario.message)}
            className="flex items-start gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all text-left group"
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-medium text-gray-800 group-hover:text-blue-600 transition-colors">
                {scenario.name}
              </h3>
              <p className="text-xs text-gray-500 mt-1">{scenario.description}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default PresetScenarios;
