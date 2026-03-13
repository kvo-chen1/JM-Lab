import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { AlertTriangle, X } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
}: DeleteConfirmModalProps) {
  const { isDark } = useTheme();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50"
            onClick={onCancel}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`relative w-full max-w-sm mx-4 rounded-2xl shadow-xl ${
              isDark ? 'bg-gray-800' : 'bg-white'
            }`}
          >
            <div className="p-6">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${
                isDark ? 'bg-red-500/20' : 'bg-red-100'
              }`}>
                <AlertTriangle className={`w-6 h-6 ${
                  isDark ? 'text-red-400' : 'text-red-600'
                }`} />
              </div>

              <h3 className={`text-lg font-semibold text-center mb-2 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                {title}
              </h3>
              <p className={`text-sm text-center mb-6 ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {message}
              </p>

              <div className="flex gap-3">
                <button
                  onClick={onCancel}
                  className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors ${
                    isDark
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  取消
                </button>
                <button
                  onClick={onConfirm}
                  className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors bg-red-600 hover:bg-red-700 text-white`}
                >
                  确认删除
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
