/**
 * SkillTestPage - 简化版
 * 由于 Skill 架构已被移除，此页面现在只展示 Agent-Skill 映射关系
 */

import React, { useState } from 'react';
import type { AgentType } from '../types/agent';
import { SkillDebugger } from '../components/SkillDebugger';
import { AGENT_CAPABILITY_DESCRIPTIONS } from '../config/agentSkillConfig';
import { 
  Sparkles, 
  Palette, 
  PenTool, 
  Type, 
  Video, 
  Search,
  ChevronDown,
  Terminal,
  CheckCircle2
} from 'lucide-react';

// Agent 图标映射
const agentIconMap: Record<Exclude<AgentType, 'system' | 'user'>, React.ReactNode> = {
  director: <Sparkles className="w-5 h-5" />,
  designer: <Palette className="w-5 h-5" />,
  illustrator: <PenTool className="w-5 h-5" />,
  copywriter: <Type className="w-5 h-5" />,
  animator: <Video className="w-5 h-5" />,
  researcher: <Search className="w-5 h-5" />
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

export const SkillTestPage: React.FC = () => {
  // Agent 选择状态
  const [selectedAgent, setSelectedAgent] = useState<Exclude<AgentType, 'system' | 'user'>>('designer');
  const [showAgentSelector, setShowAgentSelector] = useState(false);

  // 可选择的 Agent 列表
  const selectableAgents: Exclude<AgentType, 'system' | 'user'>[] = [
    'director', 'designer', 'illustrator', 'copywriter', 'animator', 'researcher'
  ];

  const currentCapability = AGENT_CAPABILITY_DESCRIPTIONS[selectedAgent];

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* 页面标题 */}
      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Agent-Skill 映射展示</h1>
              <p className="text-sm text-gray-400 mt-1">
                查看每个 Agent 拥有的 Skill 能力
              </p>
            </div>
            <div className="flex items-center gap-4">
              {/* Agent 选择器 */}
              <div className="relative">
                <button
                  onClick={() => setShowAgentSelector(!showAgentSelector)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
                >
                  <span className="text-gray-400">当前 Agent:</span>
                  <span className="flex items-center gap-1.5">
                    <div className={`w-5 h-5 rounded bg-gradient-to-br ${agentColorMap[selectedAgent]} flex items-center justify-center`}>
                      <span className="text-white text-xs">{agentIconMap[selectedAgent]}</span>
                    </div>
                    <span className="text-white font-medium">
                      {currentCapability?.title || selectedAgent}
                    </span>
                  </span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showAgentSelector ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Agent 下拉菜单 */}
                {showAgentSelector && (
                  <div className="absolute top-full right-0 mt-2 w-64 bg-gray-800 rounded-lg border border-gray-700 shadow-xl z-50">
                    {selectableAgents.map((agent) => {
                      const info = AGENT_CAPABILITY_DESCRIPTIONS[agent];
                      const isSelected = agent === selectedAgent;
                      
                      return (
                        <button
                          key={agent}
                          onClick={() => {
                            setSelectedAgent(agent);
                            setShowAgentSelector(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-700 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                            isSelected ? 'bg-gray-700' : ''
                          }`}
                        >
                          <div className={`p-2 rounded-lg ${
                            isSelected ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-700 text-gray-400'
                          }`}>
                            {agentIconMap[agent]}
                          </div>
                          <div>
                            <p className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                              {info?.title}
                            </p>
                            <p className="text-xs text-gray-500">
                              {info?.skills.length} 个 Skill
                            </p>
                          </div>
                          {isSelected && (
                            <CheckCircle2 className="w-4 h-4 text-blue-400 ml-auto" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <a
                href="/agent"
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                返回 Agent →
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 左侧：Agent 信息 */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${agentColorMap[selectedAgent]} flex items-center justify-center shadow-lg`}>
                <span className="text-white text-2xl">{agentIconMap[selectedAgent]}</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{currentCapability?.title}</h2>
                <p className="text-gray-400 text-sm mt-1">{currentCapability?.description}</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Terminal className="w-4 h-4" />
                拥有的 Skill 能力
              </h3>
              
              <div className="grid grid-cols-1 gap-2">
                {currentCapability?.skills.map((skill, index) => (
                  <div
                    key={skill.id}
                    className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg"
                  >
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-600 text-xs text-gray-300">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-200">{skill.name}</p>
                      <p className="text-xs text-gray-500">{skill.id}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 右侧：说明 */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <h3 className="text-lg font-bold text-white mb-4">💡 关于 Agent-Skill 架构</h3>
            
            <div className="space-y-4 text-sm text-gray-300">
              <p>
                <strong className="text-white">Agent（角色）</strong>：代表不同的专业角色，如设计总监、品牌设计师、插画师等。
              </p>
              
              <p>
                <strong className="text-white">Skill（能力）</strong>：代表具体的 AI 能力，如图像生成、文本生成、意图识别等。
              </p>
              
              <p>
                <strong className="text-white">映射关系</strong>：每个 Agent 拥有一组特定的 Skill，例如：
              </p>
              
              <ul className="list-disc list-inside space-y-1 text-gray-400">
                <li>设计总监：意图识别、需求分析、任务编排</li>
                <li>品牌设计师：图像生成、风格推荐、设计分析</li>
                <li>文案策划：文本生成、文案优化、品牌声音</li>
              </ul>

              <div className="mt-6 p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                <p className="text-blue-300">
                  <strong>提示：</strong>在实际的 Agent 页面中，系统会根据用户输入的意图自动匹配最佳的 Agent 和 Skill 来处理请求。
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 底部：所有 Agent 对比 */}
        <div className="mt-6 bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h3 className="text-lg font-bold text-white mb-4">所有 Agent 能力对比</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {selectableAgents.map((agent) => {
              const info = AGENT_CAPABILITY_DESCRIPTIONS[agent];
              const isSelected = agent === selectedAgent;
              
              return (
                <button
                  key={agent}
                  onClick={() => setSelectedAgent(agent)}
                  className={`p-4 rounded-lg border transition-all text-left ${
                    isSelected
                      ? 'border-blue-500 bg-blue-900/20'
                      : 'border-gray-700 bg-gray-700/50 hover:bg-gray-700'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${agentColorMap[agent]} flex items-center justify-center mb-3`}>
                    <span className="text-white">{agentIconMap[agent]}</span>
                  </div>
                  <p className={`text-sm font-medium ${isSelected ? 'text-blue-400' : 'text-gray-200'}`}>
                    {info?.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {info?.skills.length} 个 Skill
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Skill 调试工具 */}
      <SkillDebugger />
    </div>
  );
};

export default SkillTestPage;
