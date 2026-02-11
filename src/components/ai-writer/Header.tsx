import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';

interface AIModel {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
}

const aiModels: AIModel[] = [
  {
    id: 'tongyi',
    name: '通义千问',
    description: '阿里云大模型',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
      </svg>
    ),
  },
  {
    id: 'kimi',
    name: 'Kimi',
    description: 'Moonshot AI',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
      </svg>
    ),
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    description: '深度求索',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
      </svg>
    ),
  },
];

interface HeaderProps {
  selectedModel?: string;
  onModelChange?: (modelId: string) => void;
  onHistoryClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  selectedModel = 'tongyi',
  onModelChange,
  onHistoryClick,
}) => {
  const { isDark } = useTheme();
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);

  const currentModel = aiModels.find((m) => m.id === selectedModel) || aiModels[0];

  return (
    <div className="px-6">
      <div className="flex items-center justify-between h-16">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h1 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              AI 智作文案
            </h1>
          </div>
        </div>

        {/* AI模型选择器 */}
        <div className="hidden sm:flex items-center gap-2">
          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>AI模型：</span>
          <div className="relative">
            <button
              onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isDark
                  ? 'bg-gray-800 hover:bg-gray-700 text-gray-200'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              <span className="text-blue-500">{currentModel.icon}</span>
              <span>{currentModel.name}</span>
              <svg
                className={`w-4 h-4 transition-transform duration-200 ${isModelDropdownOpen ? 'rotate-180' : ''}`}
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
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className={`absolute top-full left-0 mt-2 w-48 rounded-xl shadow-xl z-20 overflow-hidden ${
                      isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                    }`}
                  >
                    {aiModels.map((model) => (
                      <button
                        key={model.id}
                        onClick={() => {
                          onModelChange?.(model.id);
                          setIsModelDropdownOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors duration-200 ${
                          selectedModel === model.id
                            ? isDark
                              ? 'bg-blue-500/10 text-blue-400'
                              : 'bg-blue-50 text-blue-600'
                            : isDark
                            ? 'text-gray-300 hover:bg-gray-700'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span className={selectedModel === model.id ? 'text-blue-500' : 'text-gray-400'}>
                          {model.icon}
                        </span>
                        <div>
                          <div className="text-sm font-medium">{model.name}</div>
                          <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            {model.description}
                          </div>
                        </div>
                        {selectedModel === model.id && (
                          <svg className="w-4 h-4 ml-auto text-blue-500" fill="currentColor" viewBox="0 0 20 20">
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
        </div>

        {/* 历史记录按钮 */}
        <button
          onClick={onHistoryClick}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
            isDark
              ? 'text-gray-300 hover:bg-gray-800'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="hidden sm:inline">历史记录</span>
        </button>
      </div>
    </div>
  );
};

export default Header;
