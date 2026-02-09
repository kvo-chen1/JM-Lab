import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/hooks/useTheme';
import { motion } from 'framer-motion';

// 原始AIWriter页面已被重构为AIWriterV2
// 此文件保留用于兼容性，自动重定向到新版本
export default function AIWriter() {
  const { isDark } = useTheme();
  const navigate = useNavigate();

  // 自动重定向到新版本
  React.useEffect(() => {
    navigate('/create/ai-writer', { replace: true });
  }, [navigate]);

  return (
    <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
          <svg className="w-8 h-8 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
        <p className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
          正在加载新版AI智作文案...
        </p>
      </motion.div>
    </div>
  );
}
