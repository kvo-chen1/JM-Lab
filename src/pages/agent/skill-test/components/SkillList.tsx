/**
 * SkillList 组件
 * 显示所有已注册的 Skill，支持分类筛选
 */

import React from 'react';
import type { ISkill, SkillCategory } from '../../types/skill';
import { SkillCategoryNames } from '../../types/skill';

interface SkillListProps {
  skills: ISkill[];
  selectedSkill: ISkill | null;
  onSelectSkill: (skill: ISkill) => void;
  selectedCategory: SkillCategory | 'all';
  onSelectCategory: (category: SkillCategory | 'all') => void;
  skillStats: Map<string, { totalExecutions: number; successfulExecutions: number }>;
}

const categories: Array<{ value: SkillCategory | 'all'; label: string }> = [
  { value: 'all', label: '全部' },
  { value: SkillCategory.CREATION, label: '创作' },
  { value: SkillCategory.ANALYSIS, label: '分析' },
  { value: SkillCategory.COGNITION, label: '认知' },
  { value: SkillCategory.ORCHESTRATION, label: '编排' },
  { value: SkillCategory.ENHANCEMENT, label: '增强' },
];

export const SkillList: React.FC<SkillListProps> = ({
  skills,
  selectedSkill,
  onSelectSkill,
  selectedCategory,
  onSelectCategory,
  skillStats,
}) => {
  const filteredSkills = selectedCategory === 'all'
    ? skills
    : skills.filter(skill => skill.category === selectedCategory);

  const getCategoryColor = (category: SkillCategory) => {
    const colors: Record<SkillCategory, string> = {
      [SkillCategory.CREATION]: '#4A90E2',
      [SkillCategory.ANALYSIS]: '#F5A623',
      [SkillCategory.COGNITION]: '#7ED321',
      [SkillCategory.ORCHESTRATION]: '#BD10E0',
      [SkillCategory.ENHANCEMENT]: '#50E3C2',
    };
    return colors[category] || '#999';
  };

  return (
    <div className="h-full flex flex-col">
      {/* 标题 */}
      <div className="px-4 py-3 border-b border-gray-700">
        <h2 className="text-lg font-semibold text-white">Skill 列表</h2>
        <p className="text-sm text-gray-400 mt-1">共 {skills.length} 个 Skill</p>
      </div>

      {/* 分类筛选 */}
      <div className="px-4 py-3 border-b border-gray-700">
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <button
              key={cat.value}
              onClick={() => onSelectCategory(cat.value)}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                selectedCategory === cat.value
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Skill 列表 */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {filteredSkills.map(skill => {
            const stats = skillStats.get(skill.id);
            const isSelected = selectedSkill?.id === skill.id;

            return (
              <div
                key={skill.id}
                onClick={() => onSelectSkill(skill)}
                className={`p-3 rounded-lg cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-blue-500/20 border border-blue-500'
                    : 'bg-gray-800 border border-gray-700 hover:border-gray-600'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: getCategoryColor(skill.category) }}
                      />
                      <h3 className="text-sm font-medium text-white">{skill.name}</h3>
                    </div>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                      {skill.description}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span
                        className="text-xs px-2 py-0.5 rounded"
                        style={{
                          backgroundColor: `${getCategoryColor(skill.category)}20`,
                          color: getCategoryColor(skill.category),
                        }}
                      >
                        {SkillCategoryNames[skill.category]}
                      </span>
                      <span className="text-xs text-gray-500">
                        ID: {skill.id}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 统计信息 */}
                {stats && stats.totalExecutions > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-700/50 flex items-center gap-4 text-xs text-gray-400">
                    <span>执行: {stats.totalExecutions}</span>
                    <span className="text-green-400">
                      成功: {stats.successfulExecutions}
                    </span>
                    <span className="text-red-400">
                      失败: {stats.totalExecutions - stats.successfulExecutions}
                    </span>
                  </div>
                )}

                {/* 能力列表 */}
                {skill.capabilities.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {skill.capabilities.slice(0, 3).map(cap => (
                      <span
                        key={cap.id}
                        className="text-xs px-2 py-0.5 bg-gray-700 rounded text-gray-300"
                      >
                        {cap.name}
                      </span>
                    ))}
                    {skill.capabilities.length > 3 && (
                      <span className="text-xs px-2 py-0.5 bg-gray-700 rounded text-gray-300">
                        +{skill.capabilities.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filteredSkills.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>暂无 Skill</p>
            <p className="text-sm mt-1">请检查筛选条件</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SkillList;
