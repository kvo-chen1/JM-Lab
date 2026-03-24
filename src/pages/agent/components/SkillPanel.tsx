/**
 * Skill 展示面板
 * 显示当前 Agent 拥有的 Skill 能力
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { AgentType } from '../types/agent';
import { AGENT_CAPABILITY_DESCRIPTIONS } from '../config/agentSkillConfig';
import { 
  Sparkles, 
  Palette, 
  PenTool, 
  Type, 
  Video, 
  Search,
  Brain,
  Image,
  MessageSquare,
  Wand2
} from 'lucide-react';

interface SkillPanelProps {
  agentType: AgentType;
  isExpanded?: boolean;
  onToggle?: () => void;
}

// Skill 图标映射
const skillIconMap: Record<string, React.ReactNode> = {
  'intent-recognition': <Brain className="w-4 h-4" />,
  'image-generation': <Image className="w-4 h-4" />,
  'text-generation': <Type className="w-4 h-4" />,
  'video-generation': <Video className="w-4 h-4" />,
  'requirement-analysis': <Search className="w-4 h-4" />,
  'requirement-collection': <MessageSquare className="w-4 h-4" />,
  'style-recommendation': <Palette className="w-4 h-4" />,
  'design-analysis': <PenTool className="w-4 h-4" />,
  'brand-design': <Sparkles className="w-4 h-4" />,
  'packaging-design': <PenTool className="w-4 h-4" />,
  'illustration-style': <Palette className="w-4 h-4" />,
  'character-design': <Wand2 className="w-4 h-4" />,
  'hand-drawn-style': <PenTool className="w-4 h-4" />,
  'concept-art': <Image className="w-4 h-4" />,
  'copy-optimization': <Type className="w-4 h-4" />,
  'brand-voice': <MessageSquare className="w-4 h-4" />,
  'slogan-creation': <Sparkles className="w-4 h-4" />,
  'story-writing': <Type className="w-4 h-4" />,
  'animation-design': <Video className="w-4 h-4" />,
  'motion-graphics': <Video className="w-4 h-4" />,
  'short-film': <Video className="w-4 h-4" />,
  'gif-creation': <Video className="w-4 h-4" />,
  'market-research': <Search className="w-4 h-4" />,
  'competitor-analysis': <Search className="w-4 h-4" />,
  'trend-analysis': <Search className="w-4 h-4" />,
  'data-analysis': <Brain className="w-4 h-4" />,
  'report-generation': <Type className="w-4 h-4" />,
  'task-orchestration': <Brain className="w-4 h-4" />,
  'delegation-decision': <MessageSquare className="w-4 h-4" />,
  'conversation-management': <MessageSquare className="w-4 h-4" />
};

// Agent 颜色映射
const agentColorMap: Record<string, string> = {
  director: 'from-amber-500 to-orange-600',
  designer: 'from-cyan-500 to-blue-600',
  illustrator: 'from-pink-500 to-rose-600',
  copywriter: 'from-emerald-500 to-teal-600',
  animator: 'from-violet-500 to-purple-600',
  researcher: 'from-slate-500 to-gray-600'
};

export const SkillPanel: React.FC<SkillPanelProps> = ({ 
  agentType, 
  isExpanded = false,
  onToggle 
}) => {
  const { isDark } = useTheme();
  
  // 获取当前 Agent 的能力描述
  const capabilityInfo = agentType !== 'system' && agentType !== 'user' 
    ? AGENT_CAPABILITY_DESCRIPTIONS[agentType]
    : null;
  
  if (!capabilityInfo) {
    return null;
  }

  const { title, description, skills } = capabilityInfo;
  const agentColor = agentColorMap[agentType] || 'from-gray-500 to-gray-600';

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-lg border overflow-hidden ${
        isDark 
          ? 'bg-gray-800/50 border-gray-700' 
          : 'bg-white/50 border-gray-200'
      }`}
    >
      {/* 头部 - 可点击展开/收起 */}
      <div 
        onClick={onToggle}
        className={`px-3 py-2 flex items-center justify-between cursor-pointer hover:bg-opacity-80 transition-colors ${
          isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'
        }`}
      >
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-md bg-gradient-to-br ${agentColor} flex items-center justify-center`}>
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <h4 className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
              {title}
            </h4>
            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              {description.slice(0, 30)}...
            </p>
          </div>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <svg 
            className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </motion.div>
      </div>

      {/* 展开的 Skill 列表 */}
      <motion.div
        initial={false}
        animate={{ 
          height: isExpanded ? 'auto' : 0,
          opacity: isExpanded ? 1 : 0
        }}
        transition={{ duration: 0.2 }}
        className="overflow-hidden"
      >
        <div className={`px-3 py-2 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            可用能力：
          </p>
          <div className="flex flex-wrap gap-1.5">
            {skills.map((skill) => (
              <motion.div
                key={skill.id}
                whileHover={{ scale: 1.05 }}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs ${
                  isDark 
                    ? 'bg-gray-700 text-gray-300' 
                    : 'bg-gray-100 text-gray-700'
                }`}
                title={skill.description}
              >
                <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                  {skillIconMap[skill.id] || <Sparkles className="w-3 h-3" />}
                </span>
                <span>{skill.name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* 收起状态的 Skill 预览 */}
      {!isExpanded && (
        <div className={`px-3 py-1.5 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center gap-1 overflow-hidden">
            <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>能力：</span>
            <div className="flex gap-1">
              {skills.slice(0, 4).map((skill) => (
                <span 
                  key={skill.id}
                  className={`text-xs px-1.5 py-0.5 rounded ${
                    isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {skill.name}
                </span>
              ))}
              {skills.length > 4 && (
                <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  +{skills.length - 4}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default SkillPanel;
