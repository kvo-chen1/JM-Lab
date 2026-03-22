import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useAgentStore } from '../hooks/useAgentStore';
import { AGENT_CONFIG, AgentType } from '../types/agent';

interface ThinkingProcessCardProps {
  agentType: AgentType;
  designType: string;
  isOpen?: boolean;
  onToggle?: () => void;
}

// Agent 头像组件
function AgentAvatar({ role, size = 'sm' }: { role: string; size?: 'xs' | 'sm' | 'md' }) {
  const config = AGENT_CONFIG[role as keyof typeof AGENT_CONFIG];
  if (!config) return null;

  const sizeClasses = {
    xs: 'w-5 h-5 text-[10px]',
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm'
  };

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br ${config.color} flex items-center justify-center flex-shrink-0`}>
      <span className="text-white font-bold">{config.avatar}</span>
    </div>
  );
}

// 获取设计类型对应的问题列表
function getQuestionsByDesignType(designType: string): Array<{ label: string; question: string }> {
  const questionMap: Record<string, Array<{ label: string; question: string }>> = {
    'ip-character': [
      { label: '角色名称', question: '您想给角色起什么名字？' },
      { label: '外貌', question: '角色是男性还是女性？有什么独特的外貌特征，比如发色、瞳色、服装风格等？' },
      { label: '职业/身份', question: '角色是做什么的？有什么特殊的身份背景？' },
      { label: '性格', question: '角色是活泼开朗、沉稳内敛，还是其他？有什么鲜明的性格特点？' },
      { label: '角色小传', question: '您对角色的背景故事有什么初步的想法吗？' }
    ],
    'brand-design': [
      { label: '品牌名称', question: '您的品牌叫什么名字？' },
      { label: '行业领域', question: '品牌属于什么行业？主要产品/服务是什么？' },
      { label: '品牌调性', question: '希望品牌给人什么样的感觉？（高端/亲民/年轻/传统等）' },
      { label: '目标受众', question: '主要面向什么样的消费群体？' },
      { label: '竞品参考', question: '有没有喜欢的品牌风格作为参考？' }
    ],
    'poster': [
      { label: '海报主题', question: '海报的核心主题或宣传点是什么？' },
      { label: '使用场景', question: '海报将在哪里使用？（线上/线下/社交媒体等）' },
      { label: '尺寸要求', question: '需要什么尺寸和格式？' },
      { label: '文案内容', question: '海报上需要展示什么文字内容？' },
      { label: '视觉风格', question: '希望什么样的视觉风格？（简约/华丽/复古/现代等）' }
    ],
    'packaging': [
      { label: '产品类型', question: '是什么类型的产品需要包装？' },
      { label: '目标市场', question: '产品主要面向哪个市场或消费群体？' },
      { label: '材质偏好', question: '对包装材质有什么要求或偏好吗？' },
      { label: '品牌元素', question: '需要融入哪些品牌元素？（Logo/品牌色/标语等）' },
      { label: '货架效果', question: '希望在货架上呈现什么样的视觉效果？' }
    ],
    'animation': [
      { label: '动画用途', question: '动画将用于什么场景？（宣传片/广告/社交媒体等）' },
      { label: '风格类型', question: '需要什么风格的动画？（2D/3D/MG动画/手绘等）' },
      { label: '时长要求', question: '动画的时长要求是多少？' },
      { label: '分辨率', question: '需要什么分辨率？（1080p/4K等）' },
      { label: '内容脚本', question: '有具体的动画内容或脚本吗？' }
    ],
    'illustration': [
      { label: '插画主题', question: '插画的主题或核心内容是什么？' },
      { label: '使用场景', question: '插画将用于什么地方？（书籍/海报/产品包装等）' },
      { label: '风格偏好', question: '喜欢什么样的绘画风格？（水彩/油画/扁平/手绘等）' },
      { label: '色彩要求', question: '对色彩有什么特殊要求或偏好吗？' },
      { label: '尺寸格式', question: '需要什么尺寸和文件格式？' }
    ]
  };

  return questionMap[designType] || questionMap['ip-character'];
}

// 获取设计类型的中文名称
function getDesignTypeName(designType: string): string {
  const nameMap: Record<string, string> = {
    'ip-character': 'IP形象设计',
    'brand-design': '品牌设计',
    'poster': '海报设计',
    'packaging': '包装设计',
    'animation': '动画制作',
    'illustration': '插画创作'
  };
  return nameMap[designType] || '设计';
}

export default function ThinkingProcessCard({ 
  agentType, 
  designType,
  isOpen: controlledIsOpen,
  onToggle: controlledOnToggle
}: ThinkingProcessCardProps) {
  const { isDark } = useAgentStore();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  
  // 支持受控和非受控模式
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const onToggle = controlledOnToggle || (() => setInternalIsOpen(!internalIsOpen));
  
  const questions = getQuestionsByDesignType(designType);
  const designName = getDesignTypeName(designType);
  const agentConfig = AGENT_CONFIG[agentType as keyof typeof AGENT_CONFIG];

  return (
    <div className={`rounded-xl overflow-hidden ${
      isDark 
        ? 'bg-[#252536] border border-[#3A3A4E]' 
        : 'bg-white border border-gray-200'
    }`}>
      {/* 头部 - 可点击展开/收起 */}
      <button 
        onClick={onToggle}
        className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
          isDark 
            ? 'hover:bg-[#2A2A3E] text-gray-200' 
            : 'hover:bg-gray-50 text-gray-700'
        }`}
      >
        <AgentAvatar role={agentType} size="xs" />
        <span className="font-medium">展示思考过程</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="ml-auto"
        >
          <ChevronDown className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
        </motion.div>
      </button>
      
      {/* 展开内容 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className={`px-5 pb-5 space-y-5 text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              {/* 开场白 */}
              <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>
                您好！为了更好地为您进行{designName}，我需要您提供更多相关信息。
                {agentConfig ? `作为${agentConfig.name}，我会根据您提供的信息为您打造专业的设计方案。` : ''}
                请您告诉我以下内容：
              </p>
              
              {/* 问题列表 */}
              <div className="space-y-4">
                {questions.map((item, index) => (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex gap-3 items-start"
                  >
                    <strong className={`flex-shrink-0 w-20 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                      {item.label}
                    </strong>
                    <span className="text-gray-400">|</span>
                    <span className={`flex-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      {item.question}
                    </span>
                  </motion.div>
                ))}
              </div>
              
              {/* 结尾 */}
              <p className={`pt-4 border-t text-xs ${isDark ? 'border-[#3A3A4E] text-gray-400' : 'border-gray-200 text-gray-500'}`}>
                提供的信息越详细，我越能为您打造满意的设计作品。
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
