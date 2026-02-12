import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles, Save, CheckCircle } from 'lucide-react';

interface SubmitHeaderProps {
  onBack: () => void;
  lastSavedAt?: Date | null;
  isSaving?: boolean;
  isSubmitting?: boolean;
}

export function SubmitHeader({ onBack, lastSavedAt, isSaving, isSubmitting }: SubmitHeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* 左侧：返回按钮和标题 */}
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onBack}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors disabled:opacity-50"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline font-medium">返回</span>
            </motion.button>

            <div className="hidden sm:flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">提交作品</h1>
                <p className="text-xs text-gray-500">创建你的精彩作品</p>
              </div>
            </div>
          </div>

          {/* 右侧：保存状态和操作 */}
          <div className="flex items-center gap-4">
            {/* 自动保存状态 */}
            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500">
              {isSaving ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <Save className="w-4 h-4" />
                  </motion.div>
                  <span>正在保存...</span>
                </>
              ) : lastSavedAt ? (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>已自动保存</span>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
}

export default SubmitHeader;
