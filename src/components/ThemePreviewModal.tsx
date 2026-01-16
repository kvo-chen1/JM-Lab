import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Theme, themeConfig } from '@/config/themeConfig';

interface ThemePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTheme: (theme: Theme) => void;
  currentTheme: Theme;
}

const ThemePreviewModal: React.FC<ThemePreviewModalProps> = ({
  isOpen,
  onClose,
  onSelectTheme,
  currentTheme
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // 点击模态框外部关闭
  const handleClickOutside = (event: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
      onClose();
    }
  };

  // 点击ESC键关闭
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden'; // 防止背景滚动
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // 主题预览卡片组件
  const ThemeCard = ({ themeValue, label, icon }: { themeValue: Theme; label: string; icon: string }) => {
    // 为每个主题定义明确的样式
    const themeStyles = {
      light: {
        bg: '#ffffff',
        text: '#111827',
        textSecondary: '#6b7280',
        cardBg: '#f9fafb',
        primary: '#dc2626',
        secondary: '#7c3aed'
      },
      dark: {
        bg: '#0f172a',
        text: '#f1f5f9',
        textSecondary: '#94a3b8',
        cardBg: '#1e293b',
        primary: '#f87171',
        secondary: '#a78bfa'
      },
      pink: {
        bg: '#fff5f7',
        text: '#831843',
        textSecondary: '#db2777',
        cardBg: '#ffffff',
        primary: '#ec4899',
        secondary: '#f472b6'
      },
      blue: {
        bg: '#f0f9ff',
        text: '#0c4a6e',
        textSecondary: '#0369a1',
        cardBg: '#e0f2fe',
        primary: '#0ea5e9',
        secondary: '#3b82f6'
      },
      green: {
        bg: '#f0fdf4',
        text: '#15803d',
        textSecondary: '#16a34a',
        cardBg: '#dcfce7',
        primary: '#22c55e',
        secondary: '#10b981'
      },
      auto: {
        bg: '#f3f4f6',
        text: '#111827',
        textSecondary: '#6b7280',
        cardBg: '#ffffff',
        primary: '#dc2626',
        secondary: '#7c3aed'
      }
    };

    const currentStyle = themeStyles[themeValue];

    return (
      <motion.div
        key={themeValue}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
        className="relative cursor-pointer rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-2xl"
        style={{
          backgroundColor: currentStyle.bg,
          color: currentStyle.text
        }}
        onClick={() => onSelectTheme(themeValue)}
      >
        {/* 主题预览内容 */}
        <div 
          className="p-6 min-h-[200px] flex flex-col justify-between relative overflow-hidden"
          style={{
            backgroundColor: currentStyle.bg
          }}
        >
          {/* 主题背景效果 */}
          <div className="absolute inset-0 opacity-30">
            <div 
              className="absolute top-0 left-0 w-full h-full bg-gradient-to-br"
              style={{
                backgroundImage: `linear-gradient(135deg, ${currentStyle.primary}20, ${currentStyle.secondary}20)`
              }}
            ></div>
            {themeValue === 'auto' && (
              <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-black opacity-50 rounded-bl-full"></div>
            )}
          </div>

          {/* 主题标题和图标 */}
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <i className={`${icon} text-3xl`} style={{ color: currentStyle.text }}></i>
              <h3 className="text-xl font-bold" style={{ color: currentStyle.text }}>{label}</h3>
            </div>
            
            {/* 主题预览内容 */}
            <div className="space-y-3">
              {/* 预览卡片 */}
              <div 
                className="p-3 rounded-lg" 
                style={{ 
                  backgroundColor: currentStyle.cardBg,
                  borderRadius: '0.75rem'
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium" style={{ color: currentStyle.text }}>预览标题</span>
                  <span className="text-xs" style={{ color: currentStyle.textSecondary }}>示例文本</span>
                </div>
                <div 
                  className="w-full rounded-full h-2" 
                  style={{ 
                    backgroundColor: `${currentStyle.textSecondary}30`,
                    borderRadius: '9999px'
                  }}
                >
                  <div 
                    className="h-2 rounded-full w-3/4" 
                    style={{ 
                      backgroundColor: currentStyle.primary,
                      borderRadius: '9999px'
                    }}
                  ></div>
                </div>
              </div>
              
              {/* 预览按钮组 */}
              <div className="flex gap-2">
                <button 
                  className="px-3 py-1 rounded-lg text-sm text-white" 
                  style={{ 
                    backgroundColor: currentStyle.primary,
                    borderRadius: '0.5rem'
                  }}
                >主按钮</button>
                <button 
                  className="px-3 py-1 rounded-lg text-sm" 
                  style={{ 
                    backgroundColor: currentStyle.secondary,
                    color: '#ffffff',
                    borderRadius: '0.5rem'
                  }}
                >次按钮</button>
              </div>
            </div>
          </div>
          
          {/* 选择指示器 */}
          <div className="relative z-10 mt-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: currentTheme === themeValue ? 1 : 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="absolute -bottom-2 -right-2 bg-white border-2 rounded-full p-1"
              style={{ borderColor: currentStyle.primary }}
            >
              <i className="fas fa-check" style={{ color: currentStyle.primary }}></i>
            </motion.div>
          </div>
        </div>
        
        {/* 主题标签 */}
        <div 
          className="px-4 py-2 text-center text-sm font-medium"
          style={{ 
            backgroundColor: `${currentStyle.textSecondary}10`,
            color: currentStyle.text
          }}
        >
          {label}
        </div>
      </motion.div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={handleClickOutside}
        >
          <motion.div
            ref={modalRef}
            initial={{ y: 50, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 50, opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4, type: 'spring', stiffness: 300, damping: 20 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto"
          >
            {/* 模态框头部 */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold">选择主题</h2>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <i className="fas fa-times text-lg"></i>
              </motion.button>
            </div>

            {/* 模态框内容 */}
            <div className="p-6">
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                预览并选择您喜欢的主题，点击卡片即可应用
              </p>

              {/* 主题预览网格 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {themeConfig.map(({ value, label, icon }) => (
                  <ThemeCard
                    key={value}
                    themeValue={value}
                    label={label}
                    icon={icon}
                  />
                ))}
              </div>
            </div>

            {/* 模态框底部 */}
            <div className="flex justify-end gap-4 p-6 border-t border-gray-200 dark:border-gray-700">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onClose}
                className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                取消
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onSelectTheme(currentTheme)}
                className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                应用当前主题
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ThemePreviewModal;
