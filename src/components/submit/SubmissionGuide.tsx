import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Image, MoreHorizontal, Download, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import type { EventSubmissionType, EventSubmissionRequirements, SubmissionTemplate } from '@/types';

interface SubmissionGuideProps {
  eventType: EventSubmissionType;
  requirements?: EventSubmissionRequirements;
  templates?: SubmissionTemplate[];
  showTemplates?: boolean;
}

const typeConfig: Record<EventSubmissionType, { icon: React.ReactNode; title: string; color: string }> = {
  document: {
    icon: <FileText className="w-5 h-5" />,
    title: '文档型作品',
    color: 'blue',
  },
  image_description: {
    icon: <Image className="w-5 h-5" />,
    title: '图文型作品',
    color: 'purple',
  },
  other: {
    icon: <MoreHorizontal className="w-5 h-5" />,
    title: '其他类型作品',
    color: 'gray',
  },
};

const colorClasses: Record<string, { bg: string; border: string; text: string; lightBg: string }> = {
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-600 dark:text-blue-400',
    lightBg: 'bg-blue-100 dark:bg-blue-800/30',
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    border: 'border-purple-200 dark:border-purple-800',
    text: 'text-purple-600 dark:text-purple-400',
    lightBg: 'bg-purple-100 dark:bg-purple-800/30',
  },
  gray: {
    bg: 'bg-gray-50 dark:bg-gray-800/50',
    border: 'border-gray-200 dark:border-gray-700',
    text: 'text-gray-600 dark:text-gray-400',
    lightBg: 'bg-gray-100 dark:bg-gray-700/50',
  },
};

export default function SubmissionGuide({
  eventType,
  requirements,
  templates,
  showTemplates = true,
}: SubmissionGuideProps) {
  const { isDark } = useTheme();
  const config = typeConfig[eventType];
  const colors = colorClasses[config.color];

  // 默认要求配置
  const defaultRequirements: Record<EventSubmissionType, EventSubmissionRequirements> = {
    document: {
      formats: ['pdf', 'doc', 'docx', 'txt', 'md'],
      formatLabels: { pdf: 'PDF文档', doc: 'Word文档', docx: 'Word文档', txt: '文本文件', md: 'Markdown文档' },
      maxSize: 20971520,
      maxSizeLabel: '20MB',
      maxFiles: 5,
      description: '请上传商业计划书、文章、报告等文档类作品',
      uploadGuide: '支持 PDF、Word、文本等格式，单个文件最大20MB，最多上传5个文件',
      templateAvailable: true,
    },
    image_description: {
      formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
      formatLabels: { jpg: 'JPG图片', jpeg: 'JPEG图片', png: 'PNG图片', webp: 'WebP图片', gif: 'GIF动图' },
      maxSize: 10485760,
      maxSizeLabel: '10MB',
      maxFiles: 10,
      description: '请上传图片并添加详细的文字描述',
      uploadGuide: '支持 JPG、PNG、WebP等图片格式，单个文件最大10MB，最多上传10张图片',
      requireDescription: true,
      templateAvailable: true,
    },
    other: {
      formats: ['*'],
      formatLabels: { '*': '所有格式' },
      maxSize: 52428800,
      maxSizeLabel: '50MB',
      maxFiles: 10,
      description: '请按照活动要求上传作品',
      uploadGuide: '支持各种格式，单个文件最大50MB，最多上传10个文件',
      templateAvailable: false,
    },
  };

  const reqs = requirements || defaultRequirements[eventType];

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* 头部信息 */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-4 rounded-xl border ${colors.border} ${colors.bg}`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${colors.lightBg} ${colors.text}`}>
            {config.icon}
          </div>
          <div>
            <h3 className={`font-semibold ${colors.text}`}>{config.title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{reqs.description}</p>
          </div>
        </div>
      </motion.div>

      {/* 上传要求 */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`p-4 rounded-xl border ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-white'}`}
      >
        <h4 className="flex items-center gap-2 font-medium text-gray-900 dark:text-white mb-3">
          <Info className="w-4 h-4 text-gray-400" />
          上传要求
        </h4>

        <div className="space-y-3">
          {/* 文件格式 */}
          <div className="flex items-start gap-3">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
            <div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">支持格式：</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {reqs.formats.map((format) => (
                  <span
                    key={format}
                    className={`px-2 py-0.5 text-xs rounded-full ${colors.lightBg} ${colors.text}`}
                  >
                    {reqs.formatLabels?.[format] || format.toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* 文件大小 */}
          <div className="flex items-start gap-3">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
            <div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">大小限制：</span>
              <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">
                单个文件最大 {reqs.maxSizeLabel || formatFileSize(reqs.maxSize)}
              </span>
            </div>
          </div>

          {/* 文件数量 */}
          <div className="flex items-start gap-3">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
            <div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">数量限制：</span>
              <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">
                最多上传 {reqs.maxFiles} 个文件
              </span>
            </div>
          </div>
        </div>

        {/* 上传指引 */}
        <div className={`mt-4 p-3 rounded-lg ${colors.bg} ${colors.border} border`}>
          <p className={`text-sm ${colors.text}`}>
            <AlertCircle className="w-4 h-4 inline mr-1" />
            {reqs.uploadGuide}
          </p>
        </div>
      </motion.div>

      {/* 模板下载 */}
      {showTemplates && reqs.templateAvailable && templates && templates.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`p-4 rounded-xl border ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-white'}`}
        >
          <h4 className="flex items-center gap-2 font-medium text-gray-900 dark:text-white mb-3">
            <Download className="w-4 h-4 text-gray-400" />
            作品模板
          </h4>
          <div className="space-y-2">
            {templates.map((template) => (
              <a
                key={template.id}
                href={template.downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`
                  flex items-center gap-3 p-3 rounded-lg transition-colors
                  ${isDark ? 'hover:bg-gray-700 bg-gray-750' : 'hover:bg-gray-50 bg-gray-50'}
                `}
              >
                <FileText className={`w-5 h-5 ${colors.text}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {template.name}
                  </p>
                  {template.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {template.description}
                    </p>
                  )}
                </div>
                <Download className="w-4 h-4 text-gray-400" />
              </a>
            ))}
          </div>
        </motion.div>
      )}

      {/* 特别提示 */}
      {eventType === 'image_description' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`p-4 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20`}
        >
          <h4 className="flex items-center gap-2 font-medium text-amber-800 dark:text-amber-300 mb-2">
            <AlertCircle className="w-4 h-4" />
            特别提示
          </h4>
          <ul className="text-sm text-amber-700 dark:text-amber-400 space-y-1 list-disc list-inside">
            <li>每张图片建议添加详细的文字说明</li>
            <li>图片应清晰、美观，能够展示作品特色</li>
            <li>文字描述应简洁明了，突出作品亮点</li>
          </ul>
        </motion.div>
      )}

      {eventType === 'document' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`p-4 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20`}
        >
          <h4 className="flex items-center gap-2 font-medium text-blue-800 dark:text-blue-300 mb-2">
            <Info className="w-4 h-4" />
            文档建议
          </h4>
          <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1 list-disc list-inside">
            <li>建议使用PDF格式以确保格式兼容性</li>
            <li>文档内容应结构清晰、逻辑严谨</li>
            <li>可使用AI写作助手生成和优化文档内容</li>
          </ul>
        </motion.div>
      )}
    </div>
  );
}
