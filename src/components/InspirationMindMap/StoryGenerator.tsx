import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  BookOpen,
  Sparkles,
  Clock,
  Lightbulb,
  Share2,
  Download,
  Copy,
  Check,
  RefreshCw,
  Quote,
  TrendingUp,
  Users,
  Award,
} from 'lucide-react';
import { CreationStory, CreationMindMap } from './types';

interface StoryGeneratorProps {
  mindMap: CreationMindMap | null;
  story: CreationStory | null;
  isOpen: boolean;
  isGenerating: boolean;
  onClose: () => void;
  onGenerate: () => void;
}

export const StoryGenerator: React.FC<StoryGeneratorProps> = ({
  mindMap,
  story,
  isOpen,
  isGenerating,
  onClose,
  onGenerate,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'story' | 'stats' | 'timeline'>('story');

  if (!isOpen) return null;

  const handleCopy = () => {
    if (story?.fullStory) {
      navigator.clipboard.writeText(story.fullStory);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleExport = () => {
    if (!story) return;
    
    const exportData = {
      ...story,
      mindMapTitle: mindMap?.title,
      exportTime: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `创作故事_${mindMap?.title || '未命名'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatDuration = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) {
      return `${hours}小时${minutes}分钟`;
    }
    return `${minutes}分钟`;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 头部 */}
          <div className="bg-gradient-to-r from-[#D4A574] via-[#E8C9A0] to-[#D4A574] px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-xl">创作故事</h3>
                  <p className="text-white/80 text-sm">
                    {mindMap?.title || '未命名脉络'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* 标签页 */}
          <div className="flex border-b border-gray-200">
            {[
              { id: 'story', label: '故事', icon: BookOpen },
              { id: 'stats', label: '统计', icon: TrendingUp },
              { id: 'timeline', label: '时间线', icon: Clock },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                disabled={!story && tab.id !== 'story'}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-[#D4A574] border-b-2 border-[#D4A574] bg-[#D4A574]/5'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* 内容区域 */}
          <div className="p-6 overflow-y-auto max-h-[50vh]">
            {!story ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-[#D4A574]/20 to-[#E8C9A0]/20 rounded-full flex items-center justify-center">
                  <Sparkles className="w-10 h-10 text-[#D4A574]" />
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-2">
                  生成你的创作故事
                </h4>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  AI将分析你的创作脉络，生成一段独特的创作故事，记录你的灵感旅程
                </p>
                <button
                  onClick={onGenerate}
                  disabled={isGenerating}
                  className="flex items-center gap-2 px-6 py-3 bg-[#D4A574] hover:bg-[#C49464] text-white rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-70 mx-auto"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      正在生成故事...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      生成创作故事
                    </>
                  )}
                </button>
              </div>
            ) : (
              <>
                {activeTab === 'story' && (
                  <div className="space-y-6">
                    {/* 故事标题 */}
                    <div className="text-center">
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {story.title}
                      </h2>
                      <p className="text-gray-500">{story.subtitle}</p>
                    </div>

                    {/* 故事内容 */}
                    <div className="prose prose-amber max-w-none">
                      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-200">
                        <Quote className="w-8 h-8 text-[#D4A574]/40 mb-4" />
                        <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                          {story.fullStory}
                        </p>
                      </div>
                    </div>

                    {/* 关键转折点 */}
                    {story.keyTurningPoints?.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <Lightbulb className="w-5 h-5 text-amber-500" />
                          关键灵感时刻
                        </h4>
                        <div className="space-y-3">
                          {story.keyTurningPoints.map((point, index) => (
                            <div
                              key={index}
                              className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg"
                            >
                              <span className="flex-shrink-0 w-6 h-6 bg-[#D4A574] text-white rounded-full flex items-center justify-center text-sm font-medium">
                                {index + 1}
                              </span>
                              <div>
                                <p className="text-gray-800">{point.description}</p>
                                <p className="text-sm text-gray-500 mt-1">
                                  {new Date(point.timestamp).toLocaleString('zh-CN')}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 文化元素 */}
                    {story.cultureElements?.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <Award className="w-5 h-5 text-red-500" />
                          融入的天津文化元素
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {story.cultureElements.map((element, index) => (
                            <span
                              key={index}
                              className="px-3 py-1.5 bg-red-50 text-red-700 rounded-full text-sm border border-red-200"
                            >
                              {element}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'stats' && (
                  <div className="space-y-6">
                    {/* 统计卡片 */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                        <div className="flex items-center gap-2 text-blue-700 mb-2">
                          <Clock className="w-5 h-5" />
                          <span className="font-medium">创作时长</span>
                        </div>
                        <p className="text-2xl font-bold text-blue-900">
                          {formatDuration(story.stats?.totalDuration || 0)}
                        </p>
                      </div>
                      
                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                        <div className="flex items-center gap-2 text-purple-700 mb-2">
                          <Lightbulb className="w-5 h-5" />
                          <span className="font-medium">灵感节点</span>
                        </div>
                        <p className="text-2xl font-bold text-purple-900">
                          {story.stats?.inspirationCount || 0}个
                        </p>
                      </div>
                      
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                        <div className="flex items-center gap-2 text-green-700 mb-2">
                          <Sparkles className="w-5 h-5" />
                          <span className="font-medium">AI协作次数</span>
                        </div>
                        <p className="text-2xl font-bold text-green-900">
                          {story.stats?.aiInteractionCount || 0}次
                        </p>
                      </div>
                      
                      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
                        <div className="flex items-center gap-2 text-amber-700 mb-2">
                          <RefreshCw className="w-5 h-5" />
                          <span className="font-medium">迭代版本</span>
                        </div>
                        <p className="text-2xl font-bold text-amber-900">
                          {story.stats?.iterationCount || 0}版
                        </p>
                      </div>
                    </div>

                    {/* 参与人员 */}
                    {story.participants?.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <Users className="w-5 h-5 text-blue-500" />
                          创作参与者
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {story.participants.map((participant, index) => (
                            <span
                              key={index}
                              className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm border border-blue-200"
                            >
                              {participant}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 创作主题 */}
                    {story.themes?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">创作主题</h4>
                      <div className="flex flex-wrap gap-2">
                        {story.themes.map((theme, index) => (
                          <span
                            key={index}
                            className="px-3 py-1.5 bg-[#D4A574]/20 text-[#8B6914] rounded-full text-sm"
                          >
                            {theme}
                          </span>
                        ))}
                      </div>
                    </div>
                    )}
                  </div>
                )}

                {activeTab === 'timeline' && story.timeline?.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900">创作时间线</h4>
                    <div className="relative">
                      {/* 时间线 */}
                      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#D4A574] to-[#E8C9A0]" />

                      <div className="space-y-6">
                        {story.timeline.map((event, index) => (
                          <div key={index} className="relative pl-12">
                            {/* 时间点 */}
                            <div className="absolute left-2 top-1 w-4 h-4 bg-[#D4A574] rounded-full border-2 border-white shadow" />
                            
                            {/* 内容 */}
                            <div className="bg-gray-50 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-900">
                                  {event.phase}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(event.timestamp).toLocaleString('zh-CN')}
                                </span>
                              </div>
                              <p className="text-gray-700 text-sm">{event.description}</p>
                              {event.nodeIds?.length > 0 && (
                                <p className="text-xs text-gray-500 mt-2">
                                  涉及节点: {event.nodeIds.length}个
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* 底部操作栏 */}
          {story && (
            <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-2">
                <button
                  onClick={onGenerate}
                  disabled={isGenerating}
                  className="flex items-center gap-2 px-4 py-2 text-[#D4A574] hover:bg-[#D4A574]/10 rounded-lg transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                  重新生成
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-green-500" />
                      已复制
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      复制
                    </>
                  )}
                </button>
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  导出
                </button>
                <button
                  className="flex items-center gap-2 px-4 py-2 bg-[#D4A574] hover:bg-[#C49464] text-white rounded-lg transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  分享
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default StoryGenerator;
