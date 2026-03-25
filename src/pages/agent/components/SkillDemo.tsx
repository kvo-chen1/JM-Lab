/**
 * Agent 能力展示组件
 * 展示各个 Agent 的能力范围
 */

import React from 'react';
import { AgentCapabilities } from '../config/agentSkillConfig';

export const SkillDemo: React.FC = () => {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Agent 能力展示</h1>

      <div className="space-y-4">
        {AgentCapabilities.map((agent) => (
          <div key={agent.agentType} className="p-4 bg-gray-800 rounded-lg border border-gray-700">
            <h2 className="text-lg font-semibold text-white mb-2">{agent.agentName}</h2>
            <p className="text-sm text-gray-400 mb-3">{agent.description}</p>

            <div className="mb-3">
              <h3 className="text-xs font-medium text-gray-500 mb-2">擅长领域</h3>
              <div className="flex flex-wrap gap-2">
                {agent.capabilities.map((cap) => (
                  <span
                    key={cap.id}
                    className="px-2 py-1 text-xs bg-blue-500/20 text-blue-400 rounded"
                  >
                    {cap.name}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-medium text-gray-500 mb-2">关键词</h3>
              <div className="flex flex-wrap gap-1">
                {agent.keywords.map((kw, idx) => (
                  <span
                    key={idx}
                    className="text-xs text-gray-500"
                  >
                    {kw}{idx < agent.keywords.length - 1 ? '、' : ''}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SkillDemo;
