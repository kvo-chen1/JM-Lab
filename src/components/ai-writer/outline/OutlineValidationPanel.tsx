import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import type { OutlineValidationResult } from './types';
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Shield,
  FileCheck,
} from 'lucide-react';

interface OutlineValidationPanelProps {
  validationResult: OutlineValidationResult;
}

export const OutlineValidationPanel: React.FC<OutlineValidationPanelProps> = ({
  validationResult,
}) => {
  const { isDark } = useTheme();
  const { isValid, errors, warnings } = validationResult;

  return (
    <div className={`min-h-full ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-4xl mx-auto p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl border shadow-sm overflow-hidden ${
            isDark
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white border-gray-200'
          }`}
        >
          <div
            className={`px-8 py-6 border-b ${
              isDark
                ? 'border-gray-700 bg-gray-800/50'
                : 'border-gray-200 bg-gray-50/50'
            }`}
          >
            <div className="flex items-center gap-4">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                  isValid
                    ? isDark
                      ? 'bg-green-500/20'
                      : 'bg-green-100'
                    : isDark
                    ? 'bg-red-500/20'
                    : 'bg-red-100'
                }`}
              >
                {isValid ? (
                  <Shield className="w-7 h-7 text-green-600" />
                ) : (
                  <XCircle className="w-7 h-7 text-red-600" />
                )}
              </div>
              <div>
                <h1
                  className={`text-2xl font-bold ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {isValid ? '验证通过' : '验证失败'}
                </h1>
                <p
                  className={`text-sm ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}
                >
                  {isValid
                    ? '大纲结构完整，可以生成文档'
                    : `发现 ${errors.length} 个错误，请修复后再生成`}
                </p>
              </div>
            </div>
          </div>

          <div className="p-8">
            {errors.length > 0 && (
              <div className="mb-8">
                <h2
                  className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
                    isDark ? 'text-red-400' : 'text-red-600'
                  }`}
                >
                  <XCircle className="w-5 h-5" />
                  错误 ({errors.length})
                </h2>
                <div className="space-y-3">
                  {errors.map((error, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-4 rounded-xl border ${
                        isDark
                          ? 'bg-red-500/10 border-red-500/20'
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <XCircle
                          className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                            isDark ? 'text-red-400' : 'text-red-500'
                          }`}
                        />
                        <div>
                          <p
                            className={`font-medium ${
                              isDark ? 'text-red-300' : 'text-red-700'
                            }`}
                          >
                            {error.message}
                          </p>
                          <p
                            className={`text-sm mt-1 ${
                              isDark ? 'text-red-400/70' : 'text-red-600/70'
                            }`}
                          >
                            章节 ID: {error.sectionId} | 字段: {error.field}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {warnings.length > 0 && (
              <div className={errors.length > 0 ? 'mt-8' : ''}>
                <h2
                  className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
                    isDark ? 'text-amber-400' : 'text-amber-600'
                  }`}
                >
                  <AlertTriangle className="w-5 h-5" />
                  警告与建议 ({warnings.length})
                </h2>
                <div className="space-y-3">
                  {warnings.map((warning, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-4 rounded-xl border ${
                        isDark
                          ? 'bg-amber-500/10 border-amber-500/20'
                          : 'bg-amber-50 border-amber-200'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <AlertTriangle
                          className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                            isDark ? 'text-amber-400' : 'text-amber-500'
                          }`}
                        />
                        <p
                          className={`${
                            isDark ? 'text-amber-300' : 'text-amber-700'
                          }`}
                        >
                          {warning}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {errors.length === 0 && warnings.length === 0 && (
              <div className="text-center py-12">
                <div
                  className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
                    isDark ? 'bg-green-500/20' : 'bg-green-100'
                  }`}
                >
                  <FileCheck className="w-10 h-10 text-green-600" />
                </div>
                <h3
                  className={`text-xl font-semibold mb-2 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  验证通过！
                </h3>
                <p
                  className={`${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}
                >
                  大纲结构完整，符合商业计划书规范
                </p>
                <div className={`mt-6 p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                  <h4 className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    验证详情
                  </h4>
                  <ul className={`text-sm space-y-1 text-left ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      所有章节名称有效
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      层级结构合理
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      包含执行摘要/概述章节
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      包含结论/总结章节
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      章节命名规范
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          <div
            className={`px-8 py-4 border-t ${
              isDark
                ? 'border-gray-700 bg-gray-800/50'
                : 'border-gray-200 bg-gray-50/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      errors.length > 0
                        ? 'bg-red-500'
                        : warnings.length > 0
                        ? 'bg-amber-500'
                        : 'bg-green-500'
                    }`}
                  />
                  <span
                    className={`text-sm ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  >
                    {errors.length > 0
                      ? '需要修复错误'
                      : warnings.length > 0
                      ? '建议优化'
                      : '验证通过'}
                  </span>
                </div>
              </div>
              <div
                className={`text-sm ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}
              >
                共 {errors.length} 个错误，{warnings.length} 个警告
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default OutlineValidationPanel;
