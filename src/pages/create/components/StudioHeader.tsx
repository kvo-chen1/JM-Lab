import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { llmService } from '@/services/llmService';
import { toast } from 'sonner';

interface AIModel {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
}

const aiModels: AIModel[] = [
  {
    id: 'qwen',
    name: '通义千问',
    description: '阿里云大模型',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
      </svg>
    ),
  },
  {
    id: 'kimi',
    name: 'Kimi',
    description: 'Moonshot AI',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
      </svg>
    ),
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    description: '深度求索',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
      </svg>
    ),
  },
];

interface StudioHeaderProps {
  selectedModel?: string;
  onModelChange?: (modelId: string) => void;
  onNewChat?: () => void;
  onShowHistory?: () => void;
  onShowSettings?: () => void;
}

export const StudioHeader: React.FC<StudioHeaderProps> = ({
  selectedModel: propSelectedModel,
  onModelChange,
  onNewChat,
  onShowHistory,
  onShowSettings,
}) => {
  const { isDark } = useTheme();
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [currentModelId, setCurrentModelId] = useState<string>(propSelectedModel || 'qwen');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 同步外部传入的模型ID
  useEffect(() => {
    if (propSelectedModel) {
      setCurrentModelId(propSelectedModel);
    }
  }, [propSelectedModel]);

  // 初始化时从 llmService 获取当前模型
  useEffect(() => {
    const serviceModel = llmService.getCurrentModel();
    if (serviceModel && serviceModel.id !== currentModelId) {
      setCurrentModelId(serviceModel.id);
    }
  }, []);

  // 监听模型切换事件
  useEffect(() => {
    const handleModelChange = (event: CustomEvent) => {
      if (event.detail?.newModelId) {
        setCurrentModelId(event.detail.newModelId);
      }
    };

    window.addEventListener('llm-model-changed', handleModelChange as EventListener);
    return () => {
      window.removeEventListener('llm-model-changed', handleModelChange as EventListener);
    };
  }, []);

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsModelDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const currentModel = aiModels.find((m) => m.id === currentModelId) || aiModels[0];

  const handleModelSelect = (modelId: string) => {
    if (modelId === currentModelId) {
      setIsModelDropdownOpen(false);
      return;
    }

    setCurrentModelId(modelId);
    llmService.setCurrentModel(modelId);
    onModelChange?.(modelId);
    
    const modelName = aiModels.find(m => m.id === modelId)?.name || modelId;
    toast.success(`已切换到 ${modelName}`);
    setIsModelDropdownOpen(false);
  };

  return (
    <div className={`w-full ${isDark ? 'bg-gray-900/80' : 'bg-white/80'} backdrop-blur-sm border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
      <div className="flex items-center justify-between h-14 px-4">
        {/* 左侧：AI助手标识 */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="flex items-center gap-2">
            <h1 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              AI助手
            </h1>
            <span className="flex items-center gap-1 text-xs text-green-500">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              在线
            </span>
          </div>
        </div>

        {/* 中间：新对话和历史 */}
        <div className="hidden sm:flex items-center gap-4">
          <button
            onClick={onNewChat}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              isDark
                ? 'text-gray-300 hover:bg-gray-800 hover:text-white'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            新对话
          </button>
          
          <button
            onClick={onShowHistory}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              isDark
                ? 'text-gray-300 hover:bg-gray-800 hover:text-white'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            历史
          </button>
        </div>

        {/* 右侧：模型选择器 */}
        <div className="flex items-center gap-3">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 border ${
                isModelDropdownOpen
                  ? isDark
                    ? 'bg-gray-800 border-purple-500/50 text-white'
                    : 'bg-white border-purple-300 text-gray-900 shadow-sm'
                  : isDark
                  ? 'bg-gray-800/50 border-gray-700 text-gray-300 hover:border-gray-600'
                  : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className={isDark ? 'text-purple-400' : 'text-purple-600'}>
                {currentModel.icon}
              </span>
              <span>{currentModel.name}</span>
              <svg
                className={`w-3.5 h-3.5 transition-transform duration-200 ${isModelDropdownOpen ? 'rotate-180' : ''} ${
                  isDark ? 'text-gray-500' : 'text-gray-400'
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <AnimatePresence>
              {isModelDropdownOpen && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-10"
                    onClick={() => setIsModelDropdownOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className={`absolute top-full right-0 mt-2 w-52 rounded-xl shadow-xl z-20 overflow-hidden border ${
                      isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className={`px-3 py-2 text-xs font-medium border-b ${
                      isDark ? 'text-gray-400 border-gray-700' : 'text-gray-500 border-gray-100'
                    }`}>
                      选择AI模型
                    </div>
                    {aiModels.map((model) => (
                      <button
                        key={model.id}
                        onClick={() => handleModelSelect(model.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors duration-200 ${
                          currentModelId === model.id
                            ? isDark
                              ? 'bg-purple-500/10 text-purple-400'
                              : 'bg-purple-50 text-purple-600'
                            : isDark
                            ? 'text-gray-300 hover:bg-gray-700'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span className={currentModelId === model.id ? (isDark ? 'text-purple-400' : 'text-purple-600') : (isDark ? 'text-gray-500' : 'text-gray-400')}>
                          {model.icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{model.name}</div>
                          <div className={`text-xs truncate ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            {model.description}
                          </div>
                        </div>
                        {currentModelId === model.id && (
                          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* 帮助按钮 */}
          <button
            onClick={onShowSettings}
            className={`p-2 rounded-lg transition-all duration-200 ${
              isDark
                ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            }`}
            title="设置"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudioHeader;
