import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import type { OutlineTemplate, OutlineSection } from './types';
import { FileText, Layers, Clock, Hash } from 'lucide-react';

interface OutlinePreviewProps {
  outline: OutlineTemplate;
}

export const OutlinePreview: React.FC<OutlinePreviewProps> = ({ outline }) => {
  const { isDark } = useTheme();

  const getLevelStyles = (level: number) => {
    const styles = [
      { fontSize: 'text-2xl', fontWeight: 'font-bold', color: 'text-blue-600', marginTop: 'mt-8', marginBottom: 'mb-4' },
      { fontSize: 'text-xl', fontWeight: 'font-semibold', color: 'text-gray-800 dark:text-gray-200', marginTop: 'mt-6', marginBottom: 'mb-3' },
      { fontSize: 'text-lg', fontWeight: 'font-medium', color: 'text-gray-700 dark:text-gray-300', marginTop: 'mt-4', marginBottom: 'mb-2' },
      { fontSize: 'text-base', fontWeight: 'font-medium', color: 'text-gray-600 dark:text-gray-400', marginTop: 'mt-3', marginBottom: 'mb-2' },
      { fontSize: 'text-sm', fontWeight: 'font-medium', color: 'text-gray-500 dark:text-gray-500', marginTop: 'mt-2', marginBottom: 'mb-1' },
      { fontSize: 'text-xs', fontWeight: 'font-medium', color: 'text-gray-400 dark:text-gray-600', marginTop: 'mt-2', marginBottom: 'mb-1' },
    ];
    return styles[level - 1] || styles[5];
  };

  const getLevelNumber = (level: number) => {
    const numbers = ['一', '二', '三', '四', '五', '六'];
    return numbers[level - 1] || level;
  };

  const renderSection = (section: OutlineSection, index: number, parentIndices: number[] = []) => {
    const styles = getLevelStyles(section.level);
    const currentIndices = [...parentIndices, index + 1];
    const numberLabel = currentIndices.join('.');

    return (
      <div key={section.id}>
        <div className={`${styles.marginTop} ${styles.marginBottom}`}>
          <div className="flex items-start gap-3">
            <span
              className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-semibold ${
                section.level === 1
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
              }`}
            >
              {numberLabel}
            </span>
            <div className="flex-1">
              <h3 className={`${styles.fontSize} ${styles.fontWeight} ${styles.color}`}>
                {section.name}
              </h3>
              {section.description && (
                <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {section.description}
                </p>
              )}
            </div>
          </div>
        </div>

        {section.children && section.children.length > 0 && (
          <div className="ml-11">
            {section.children.map((child, childIndex) =>
              renderSection(child, childIndex, currentIndices)
            )}
          </div>
        )}
      </div>
    );
  };

  const totalSections = (sections: OutlineSection[]): number => {
    let count = sections.length;
    sections.forEach(section => {
      if (section.children) {
        count += totalSections(section.children);
      }
    });
    return count;
  };

  const maxDepth = (sections: OutlineSection[], currentDepth = 1): number => {
    let max = currentDepth;
    sections.forEach(section => {
      if (section.children) {
        max = Math.max(max, maxDepth(section.children, currentDepth + 1));
      }
    });
    return max;
  };

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
              isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50/50'
            }`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  isDark ? 'bg-blue-500/20' : 'bg-blue-100'
                }`}
              >
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1
                  className={`text-2xl font-bold ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {outline.name}
                </h1>
                <p
                  className={`text-sm ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}
                >
                  {outline.category}
                </p>
              </div>
            </div>

            <p
              className={`text-base leading-relaxed ${
                isDark ? 'text-gray-300' : 'text-gray-600'
              }`}
            >
              {outline.description}
            </p>

            <div className="flex flex-wrap gap-2 mt-4">
              {outline.tags?.map((tag, index) => (
                <span
                  key={index}
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    isDark
                      ? 'bg-gray-700 text-gray-300'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          <div className="px-8 py-6">
            <div className="mb-6">
              <h2
                className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}
              >
                <Layers className="w-5 h-5 text-blue-600" />
                目录结构
              </h2>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div
                  className={`p-4 rounded-xl ${
                    isDark ? 'bg-gray-700/50' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Hash className="w-4 h-4 text-blue-500" />
                    <span
                      className={`text-2xl font-bold ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}
                    >
                      {totalSections(outline.sections)}
                    </span>
                  </div>
                  <span
                    className={`text-xs ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  >
                    总章节数
                  </span>
                </div>

                <div
                  className={`p-4 rounded-xl ${
                    isDark ? 'bg-gray-700/50' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Layers className="w-4 h-4 text-green-500" />
                    <span
                      className={`text-2xl font-bold ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}
                    >
                      {maxDepth(outline.sections)}
                    </span>
                  </div>
                  <span
                    className={`text-xs ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  >
                    最大层级
                  </span>
                </div>

                <div
                  className={`p-4 rounded-xl ${
                    isDark ? 'bg-gray-700/50' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-amber-500" />
                    <span
                      className={`text-2xl font-bold ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}
                    >
                      {new Date(outline.updatedAt).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                  <span
                    className={`text-xs ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  >
                    最后更新
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {outline.sections.map((section, index) =>
                renderSection(section, index)
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default OutlinePreview;
