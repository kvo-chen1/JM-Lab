// src/components/ThemePreviewModal.tsx

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { themeConfig } from '@/config/themeConfig';
import { ANIMATION_VARIANTS } from '@/config/animationConfig';

interface ThemePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ThemePreviewModal: React.FC<ThemePreviewModalProps> = ({ isOpen, onClose }) => {
  const { theme, setTheme, previewTheme, resetPreview } = useTheme();
  const [previewing, setPreviewing] = useState<string | null>(null);

  // 处理主题预览
  const handlePreview = (themeValue: string) => {
    setPreviewing(themeValue);
    previewTheme(themeValue as any);
  };

  // 处理主题选择
  const handleSelect = (themeValue: string) => {
    setTheme(themeValue as any);
    setPreviewing(null);
    resetPreview();
    onClose();
  };

  // 处理模态框关闭
  const handleClose = () => {
    if (previewing) {
      resetPreview();
      setPreviewing(null);
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            className="relative w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 shadow-2xl overflow-hidden"
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 20, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 模态框头部 */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                主题预览
              </h3>
              <button
                className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                onClick={handleClose}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* 模态框内容 */}
            <div className="px-6 py-4 space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                选择并预览不同的主题效果，找到最适合你的风格
              </p>

              {/* 主题列表 */}
              <div className="space-y-2">
                {themeConfig.map((themeOption) => {
                  const isSelected = theme === themeOption.value;
                  const isPreviewing = previewing === themeOption.value;

                  return (
                    <motion.div
                      key={themeOption.value}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all duration-200 ${isSelected ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : isPreviewing ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${isSelected || isPreviewing ? 'bg-blue-100 dark:bg-blue-900/50' : 'bg-gray-100 dark:bg-gray-700'}`}>
                          <i className={`${themeOption.icon} ${isSelected || isPreviewing ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}></i>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {themeOption.label}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {themeOption.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          className={`px-3 py-1 text-xs rounded-full transition-colors ${isPreviewing ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                          onClick={() => handlePreview(themeOption.value)}
                        >
                          预览
                        </button>
                        {isSelected && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">
                            当前
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* 模态框底部 */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end space-x-3">
              <button
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                onClick={handleClose}
              >
                取消
              </button>
              <button
                className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                onClick={() => {
                  if (previewing) {
                    handleSelect(previewing);
                  } else {
                    handleClose();
                  }
                }}
              >
                {previewing ? '应用主题' : '关闭'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ThemePreviewModal;