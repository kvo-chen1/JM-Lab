/**
 * StatsPanel 组件
 * 显示执行统计信息
 */

import React from 'react';
import type { SkillCategory } from '../../types/skill';
import { SkillCategoryNames } from '../../types/skill';

interface StatsPanelProps {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  categoryStats: Record<SkillCategory, number>;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({
  totalExecutions,
  successfulExecutions,
  failedExecutions,
  averageExecutionTime,
  categoryStats,
}) => {
  const successRate = totalExecutions > 0
    ? (successfulExecutions / totalExecutions * 100).toFixed(1)
    : '0.0';

  // 在组件内部定义，避免模块级别的循环依赖
  const getCategoryColor = (category: SkillCategory) => {
    const colors: Record<SkillCategory, string> = {
      [SkillCategory.CREATION]: '#4A90E2',
      [SkillCategory.ANALYSIS]: '#F5A623',
      [SkillCategory.COGNITION]: '#7ED321',
      [SkillCategory.ORCHESTRATION]: '#BD10E0',
      [SkillCategory.ENHANCEMENT]: '#50E3C2',
    };
    return colors[category];
  };

  return (
    <div className="h-full flex flex-col">
      {/* 标题 */}
      <div className="px-4 py-3 border-b border-gray-700">
        <h2 className="text-lg font-semibold text-white">执行统计</h2>
        <p className="text-sm text-gray-400 mt-1">本次会话的统计信息</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 总体统计 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-gray-800 rounded-lg">
            <p className="text-xs text-gray-400">总执行次数</p>
            <p className="text-2xl font-bold text-white mt-1">{totalExecutions}</p>
          </div>
          <div className="p-3 bg-gray-800 rounded-lg">
            <p className="text-xs text-gray-400">成功率</p>
            <p className="text-2xl font-bold text-green-400 mt-1">{successRate}%</p>
          </div>
          <div className="p-3 bg-gray-800 rounded-lg">
            <p className="text-xs text-gray-400">成功次数</p>
            <p className="text-2xl font-bold text-green-400 mt-1">{successfulExecutions}</p>
          </div>
          <div className="p-3 bg-gray-800 rounded-lg">
            <p className="text-xs text-gray-400">失败次数</p>
            <p className="text-2xl font-bold text-red-400 mt-1">{failedExecutions}</p>
          </div>
        </div>

        {/* 平均执行时间 */}
        <div className="p-3 bg-gray-800 rounded-lg">
          <p className="text-xs text-gray-400">平均执行时间</p>
          <div className="flex items-baseline gap-1 mt-1">
            <p className="text-2xl font-bold text-blue-400">
              {averageExecutionTime.toFixed(0)}
            </p>
            <p className="text-sm text-gray-400">ms</p>
          </div>
        </div>

        {/* 分类统计 */}
        <div>
          <h3 className="text-sm font-medium text-gray-300 mb-3">分类统计</h3>
          <div className="space-y-2">
            {Object.entries(categoryStats).map(([category, count]) => {
              const cat = category as SkillCategory;
              const percentage = totalExecutions > 0
                ? (count / totalExecutions * 100).toFixed(1)
                : '0.0';

              return (
                <div key={category} className="p-3 bg-gray-800 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: getCategoryColor(cat) }}
                      />
                      <span className="text-sm text-gray-300">
                        {SkillCategoryNames[cat]}
                      </span>
                    </div>
                    <span className="text-sm text-gray-400">{count} 次</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: getCategoryColor(cat),
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{percentage}%</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* 状态说明 */}
        <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
          <h3 className="text-sm font-medium text-gray-300 mb-2">状态说明</h3>
          <div className="space-y-1 text-xs text-gray-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400" />
              <span>成功 - Skill 正常执行完成</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-400" />
              <span>失败 - 执行过程中发生错误</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsPanel;
