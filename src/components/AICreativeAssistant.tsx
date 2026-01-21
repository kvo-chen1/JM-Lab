import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import aiCreativeAssistantService, { CreativeSuggestion, CreativeDirection } from '@/services/aiCreativeAssistantService';

interface AICreativeAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  currentPrompt?: string;
}

const AICreativeAssistant: React.FC<AICreativeAssistantProps> = ({ isOpen, onClose, currentPrompt = '' }) => {
  const { isDark } = useTheme();
  const [suggestions, setSuggestions] = useState<CreativeSuggestion[]>([]);
  const [creativeDirections, setCreativeDirections] = useState<CreativeDirection[]>([]);
  const [selectedDirection, setSelectedDirection] = useState<string>('');
  const [creativePlan, setCreativePlan] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'suggestions' | 'directions' | 'plan'>('suggestions');
  const [promptInput, setPromptInput] = useState(currentPrompt);

  // 加载创意方向
  useEffect(() => {
    if (isOpen) {
      const directions = aiCreativeAssistantService.getCreativeDirections();
      setCreativeDirections(directions);
      setSelectedDirection(directions[0]?.id || '');
      setPromptInput(currentPrompt);
    }
  }, [isOpen, currentPrompt]);

  // 生成创意建议
  const generateSuggestions = () => {
    if (!promptInput.trim()) {
      toast.error('请输入创作提示');
      return;
    }

    setIsGenerating(true);
    try {
      const newSuggestions = aiCreativeAssistantService.generateCreativeSuggestions(promptInput, 5);
      setSuggestions(newSuggestions);
      toast.success('已生成创意建议');
    } catch (error) {
      toast.error('生成创意建议失败，请稍后重试');
      console.error('Failed to generate suggestions:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // 生成创意方案
  const generateCreativePlan = async () => {
    if (!promptInput.trim()) {
      toast.error('请输入创作提示');
      return;
    }

    if (!selectedDirection) {
      toast.error('请选择创意方向');
      return;
    }

    setIsGenerating(true);
    try {
      const plan = await aiCreativeAssistantService.generateCreativePlan(promptInput, selectedDirection);
      setCreativePlan(plan);
      toast.success('已生成创意方案');
    } catch (error) {
      toast.error('生成创意方案失败，请稍后重试');
      console.error('Failed to generate creative plan:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // 应用创意建议
  const applySuggestion = (suggestion: CreativeSuggestion) => {
    // 应用创意建议的逻辑：将建议内容添加到创作提示中
    const updatedPrompt = `${promptInput} ${suggestion.content}`;
    setPromptInput(updatedPrompt);
    toast.success(`已应用创意建议：${suggestion.content}`);
    // 自动切换到创意方案标签页，方便用户生成方案
    setActiveTab('plan');
    // 自动滚动到生成方案按钮位置
    setTimeout(() => {
      const button = document.querySelector('.generate-plan-button');
      if (button) {
        button.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 300);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      transition={{ duration: 0.3 }}
      className={`fixed top-0 right-0 w-full max-w-md h-full ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-2xl z-50 flex flex-col`}
    >
      {/* 面板头部 */}
      <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white flex justify-between items-center shadow-lg relative overflow-hidden`}>
        {/* 装饰性背景元素 */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-[-50%] left-[-50%] w-40 h-40 rounded-full bg-white blur-2xl"></div>
          <div className="absolute bottom-[-50%] right-[-50%] w-40 h-40 rounded-full bg-white blur-2xl"></div>
        </div>
        <div className="flex items-center gap-3 relative">
          <div className={`w-9 h-9 rounded-full bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-sm flex items-center justify-center shadow-md border border-white/20 hover:shadow-xl transition-all duration-300 hover:scale-105`}>
            <i className="fas fa-robot text-white text-lg animate-pulse-slow"></i>
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight">津小脉</h3>
        </div>
        <button
          onClick={onClose}
          className={`p-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-110 hover:shadow-lg text-white`}
          aria-label="关闭"
        >
          <i className="fas fa-times"></i>
        </button>
      </div>

      {/* 标签页导航 */}
      <div className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex">
          {[
            { id: 'suggestions', name: '创意建议' },
            { id: 'directions', name: '创意方向' },
            { id: 'plan', name: '创意方案' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 transition-colors font-medium text-sm ${activeTab === tab.id ? 'text-red-600 border-b-2 border-red-600' : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}
            >
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      {/* 面板内容 */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* 创作提示输入 */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">创作提示</label>
          <textarea
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            placeholder="输入你的创作提示，AI将为你生成创意建议"
            className={`w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 border' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 border'}`}
            rows={3}
          />
        </div>

        {/* 创意建议标签页 */}
        {activeTab === 'suggestions' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-base font-medium">创意建议</h4>
              <button
                onClick={generateSuggestions}
                disabled={isGenerating || !promptInput.trim()}
                className={`px-4 py-2 rounded-lg transition-colors font-medium text-sm ${isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isGenerating ? (
                  <><i className="fas fa-spinner fa-spin mr-2"></i>生成中...</>
                ) : (
                  <><i className="fas fa-lightbulb mr-2"></i>生成建议</>
                )}
              </button>
            </div>

            {suggestions.length > 0 ? (
              <div className="space-y-3">
                {suggestions.map((suggestion) => (
                  <motion.div
                    key={suggestion.id}
                    className={`p-3 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'} border ${isDark ? 'border-gray-600' : 'border-gray-200'}`}
                    whileHover={{ y: -2 }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>
                        {suggestion.type === 'theme' && '主题'}
                        {suggestion.type === 'style' && '风格'}
                        {suggestion.type === 'color' && '色彩'}
                        {suggestion.type === 'element' && '元素'}
                        {suggestion.type === 'layout' && '布局'}
                        {suggestion.type === 'concept' && '概念'}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full bg-green-500 text-white`}>
                        相关性 {suggestion.relevance}%
                      </span>
                    </div>
                    <h5 className="font-medium mb-1">{suggestion.content}</h5>
                    <p className={`text-xs mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {suggestion.description}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {suggestion.tags.map((tag, index) => (
                        <span
                          key={index}
                          className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <button
                      onClick={() => applySuggestion(suggestion)}
                      className={`w-full px-3 py-1.5 rounded-lg text-sm transition-colors ${isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
                    >
                      应用建议
                    </button>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                <i className="fas fa-lightbulb text-4xl mb-4"></i>
                <h3 className="text-lg font-medium mb-2">暂无创意建议</h3>
                <p>点击生成建议按钮，AI将为你提供创意灵感</p>
              </div>
            )}
          </div>
        )}

        {/* 创意方向标签页 */}
        {activeTab === 'directions' && (
          <div>
            <h4 className="text-base font-medium mb-4">创意方向</h4>
            <div className="space-y-3">
              {creativeDirections.map((direction) => (
                <motion.div
                  key={direction.id}
                  className={`p-3 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'} border ${isDark ? 'border-gray-600' : 'border-gray-200'} cursor-pointer`}
                  whileHover={{ y: -2 }}
                  onClick={() => setSelectedDirection(direction.id)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h5 className="font-medium">{direction.name}</h5>
                    <input
                      type="radio"
                      name="direction"
                      checked={selectedDirection === direction.id}
                      onChange={() => setSelectedDirection(direction.id)}
                      className="text-red-600"
                    />
                  </div>
                  <p className={`text-xs mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {direction.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {direction.tags.map((tag, index) => (
                      <span
                        key={index}
                        className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="text-xs">
                    <p className="font-medium mb-1">示例：</p>
                    <ul className={`list-disc list-inside space-y-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {direction.examples.slice(0, 2).map((example, index) => (
                        <li key={index}>{example}</li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* 创意方案标签页 */}
        {activeTab === 'plan' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-base font-medium">创意方案</h4>
              <button
                onClick={generateCreativePlan}
                disabled={isGenerating || !promptInput.trim() || !selectedDirection}
                className={`px-4 py-2 rounded-lg transition-colors font-medium text-sm ${isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white disabled:opacity-50 disabled:cursor-not-allowed generate-plan-button`}
              >
                {isGenerating ? (
                  <><i className="fas fa-spinner fa-spin mr-2"></i>生成中...</>
                ) : (
                  <><i className="fas fa-magic mr-2"></i>生成方案</>
                )}
              </button>
            </div>

            {creativePlan ? (
              <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'} border ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                <pre className={`whitespace-pre-wrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {creativePlan}
                </pre>
              </div>
            ) : (
              <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                <i className="fas fa-file-alt text-4xl mb-4"></i>
                <h3 className="text-lg font-medium mb-2">暂无创意方案</h3>
                <p>选择创意方向并点击生成方案按钮，AI将为你生成完整的创意方案</p>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AICreativeAssistant;