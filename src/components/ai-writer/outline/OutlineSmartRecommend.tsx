import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { Lightbulb, Plus, X, ChevronRight, BookOpen, Target, Users, TrendingUp, FileText } from 'lucide-react';
import type { OutlineSection } from './types';

interface Recommendation {
  id: string;
  type: 'chapter' | 'subsection' | 'content' | 'improvement';
  title: string;
  description: string;
  reason: string;
  icon: React.ReactNode;
  priority: 'high' | 'medium' | 'low';
}

interface OutlineSmartRecommendProps {
  sections: OutlineSection[];
  onApplyRecommendation: (recommendation: Recommendation) => void;
  onClose: () => void;
}

export const OutlineSmartRecommend: React.FC<OutlineSmartRecommendProps> = ({
  sections,
  onApplyRecommendation,
  onClose,
}) => {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'all' | 'structure' | 'content' | 'improvement'>('all');
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const recommendations = useMemo<Recommendation[]>(() => {
    const recs: Recommendation[] = [];
    const flatSections = flattenSections(sections);
    
    // 结构建议
    if (sections.length < 3) {
      recs.push({
        id: 'rec-structure-1',
        type: 'chapter',
        title: '添加执行摘要',
        description: '在商业文档开头添加执行摘要，帮助读者快速了解核心内容',
        reason: '大多数商业文档都需要执行摘要',
        icon: <FileText className="w-4 h-4" />,
        priority: 'high',
      });
    }

    // 检查是否有结论章节
    const hasConclusion = flatSections.some(s => 
      s.name.toLowerCase().includes('结论') || 
      s.name.toLowerCase().includes('总结') ||
      s.name.toLowerCase().includes('结语')
    );
    if (!hasConclusion && sections.length > 5) {
      recs.push({
        id: 'rec-structure-2',
        type: 'chapter',
        title: '添加结论章节',
        description: '在文档末尾添加结论或总结章节，概括核心观点',
        reason: '长文档通常需要结论来总结要点',
        icon: <Target className="w-4 h-4" />,
        priority: 'high',
      });
    }

    // 内容建议
    const hasAnalysis = flatSections.some(s => 
      s.name.toLowerCase().includes('分析') || 
      s.name.toLowerCase().includes('研究')
    );
    if (!hasAnalysis && sections.length > 3) {
      recs.push({
        id: 'rec-content-1',
        type: 'content',
        title: '添加分析章节',
        description: '考虑添加市场分析、竞争分析或数据分析章节',
        reason: '分析章节可以增强文档的说服力',
        icon: <TrendingUp className="w-4 h-4" />,
        priority: 'medium',
      });
    }

    // 改进建议
    const sectionsWithoutDesc = flatSections.filter(s => !s.description || s.description.length < 10);
    if (sectionsWithoutDesc.length > 0) {
      recs.push({
        id: 'rec-improve-1',
        type: 'improvement',
        title: '完善章节描述',
        description: `有 ${sectionsWithoutDesc.length} 个章节缺少详细描述，建议补充`,
        reason: '详细的描述有助于AI理解章节内容',
        icon: <BookOpen className="w-4 h-4" />,
        priority: 'medium',
      });
    }

    // 层级建议
    const maxLevel = Math.max(...flatSections.map(s => s.level), 1);
    if (maxLevel < 2 && sections.length > 5) {
      recs.push({
        id: 'rec-structure-3',
        type: 'structure',
        title: '添加子章节',
        description: '考虑为主要章节添加子章节，细化内容结构',
        reason: '多级结构可以更好地组织复杂内容',
        icon: <Users className="w-4 h-4" />,
        priority: 'low',
      });
    }

    return recs;
  }, [sections]);

  const filteredRecommendations = useMemo(() => {
    let filtered = recommendations.filter(r => !dismissedIds.has(r.id));
    if (activeTab !== 'all') {
      filtered = filtered.filter(r => r.type === activeTab || (activeTab === 'improvement' && r.type === 'improvement'));
    }
    return filtered;
  }, [recommendations, dismissedIds, activeTab]);

  const handleDismiss = (id: string) => {
    setDismissedIds(prev => new Set([...prev, id]));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return isDark ? 'text-red-400 bg-red-400/10' : 'text-red-600 bg-red-50';
      case 'medium':
        return isDark ? 'text-amber-400 bg-amber-400/10' : 'text-amber-600 bg-amber-50';
      case 'low':
        return isDark ? 'text-blue-400 bg-blue-400/10' : 'text-blue-600 bg-blue-50';
      default:
        return isDark ? 'text-gray-400 bg-gray-400/10' : 'text-gray-600 bg-gray-50';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'chapter':
        return '章节建议';
      case 'subsection':
        return '子章节';
      case 'content':
        return '内容建议';
      case 'improvement':
        return '改进建议';
      default:
        return '建议';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className={`rounded-xl border ${
        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      } overflow-hidden`}
    >
      <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${isDark ? 'bg-purple-500/20' : 'bg-purple-100'}`}>
              <Lightbulb className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                智能推荐
              </h3>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                基于当前大纲结构，为您推荐优化建议
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${
              isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex gap-2 mt-4">
          {(['all', 'structure', 'content', 'improvement'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === tab
                  ? isDark
                    ? 'bg-purple-500/20 text-purple-400'
                    : 'bg-purple-100 text-purple-700'
                  : isDark
                  ? 'text-gray-400 hover:bg-gray-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab === 'all' && '全部'}
              {tab === 'structure' && '结构'}
              {tab === 'content' && '内容'}
              {tab === 'improvement' && '改进'}
            </button>
          ))}
        </div>
      </div>

      <div className="max-h-80 overflow-auto">
        {filteredRecommendations.length === 0 ? (
          <div className="p-8 text-center">
            <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
              isDark ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
              <Lightbulb className={`w-8 h-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
            </div>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              暂无推荐建议
            </p>
            <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              继续完善大纲，我们会为您提供更多建议
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            <AnimatePresence>
              {filteredRecommendations.map((rec) => (
                <motion.div
                  key={rec.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className={`p-3 rounded-lg border ${
                    isDark
                      ? 'bg-gray-700/50 border-gray-600 hover:border-purple-500/50'
                      : 'bg-gray-50 border-gray-200 hover:border-purple-300'
                  } transition-colors group`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-600' : 'bg-white'}`}>
                      {rec.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(rec.priority)}`}>
                          {rec.priority === 'high' ? '高优先级' : rec.priority === 'medium' ? '中优先级' : '低优先级'}
                        </span>
                        <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          {getTypeLabel(rec.type)}
                        </span>
                      </div>
                      <h4 className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {rec.title}
                      </h4>
                      <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {rec.description}
                      </p>
                      <p className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        💡 {rec.reason}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => onApplyRecommendation(rec)}
                      className={`flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        isDark
                          ? 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
                          : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                      }`}
                    >
                      <Plus className="w-3 h-3" />
                      应用建议
                    </button>
                    <button
                      onClick={() => handleDismiss(rec.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                        isDark
                          ? 'text-gray-400 hover:bg-gray-600'
                          : 'text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      忽略
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {filteredRecommendations.length > 0 && (
        <div className={`p-3 border-t ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
          <button
            onClick={() => {
              filteredRecommendations.forEach(rec => onApplyRecommendation(rec));
            }}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isDark
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-purple-600 text-white hover:bg-purple-700'
            }`}
          >
            <Plus className="w-4 h-4" />
            应用全部建议 ({filteredRecommendations.length})
          </button>
        </div>
      )}
    </motion.div>
  );
};

// 辅助函数
function flattenSections(sections: OutlineSection[]): OutlineSection[] {
  const result: OutlineSection[] = [];
  const flatten = (items: OutlineSection[]) => {
    items.forEach((item) => {
      result.push(item);
      if (item.children) {
        flatten(item.children);
      }
    });
  };
  flatten(sections);
  return result;
}

export default OutlineSmartRecommend;
