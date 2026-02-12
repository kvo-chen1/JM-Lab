import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  Circle,
  Sparkles,
  Lightbulb,
  Save,
  Clock,
  FileCheck,
  AlertTriangle,
  Image as ImageIcon,
  Type,
  Tag,
  FileArchive
} from 'lucide-react';
import { format } from 'date-fns';
import { formatFileSize } from '../upload/FileTypeIcon';

interface FormData {
  title: string;
  description: string;
  tags: string[];
  files: File[];
}

interface SubmitSidebarRightProps {
  formData: FormData;
  lastSavedAt?: Date | null;
  isSaving?: boolean;
}

const containerVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

export function SubmitSidebarRight({ formData, lastSavedAt, isSaving }: SubmitSidebarRightProps) {
  // 检查清单项
  const checklist = [
    {
      id: 'title',
      label: '作品标题',
      icon: Type,
      completed: formData.title.trim().length > 0,
      required: true
    },
    {
      id: 'description',
      label: '作品描述',
      icon: FileCheck,
      completed: formData.description.trim().length >= 10,
      required: false
    },
    {
      id: 'files',
      label: '上传文件',
      icon: ImageIcon,
      completed: formData.files.length > 0,
      required: true
    },
    {
      id: 'tags',
      label: '添加标签',
      icon: Tag,
      completed: formData.tags.length > 0,
      required: false
    }
  ];

  const completedCount = checklist.filter(item => item.completed).length;
  const requiredCompleted = checklist.filter(item => item.required && item.completed).length;
  const totalRequired = checklist.filter(item => item.required).length;
  const canSubmit = requiredCompleted === totalRequired;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* 实时预览卡片 */}
      <motion.div
        variants={itemVariants}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
      >
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <h4 className="font-semibold text-gray-900 dark:text-white">作品预览</h4>
          </div>
        </div>

        <div className="p-4">
          {/* 预览卡片 */}
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl overflow-hidden">
            {/* 封面区域 */}
            <div className="aspect-video bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
              {formData.files.length > 0 ? (
                formData.files[0].type.startsWith('image/') ? (
                  <img
                    src={URL.createObjectURL(formData.files[0])}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center">
                    <FileArchive className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <span className="text-sm text-gray-500">{formData.files.length} 个文件</span>
                  </div>
                )
              ) : (
                <div className="text-center">
                  <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <span className="text-sm text-gray-500">暂无封面</span>
                </div>
              )}
            </div>

            {/* 内容区域 */}
            <div className="p-3">
              <h5 className="font-medium text-gray-900 dark:text-white truncate">
                {formData.title || '未命名作品'}
              </h5>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                {formData.description || '暂无描述'}
              </p>

              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {formData.tags.slice(0, 3).map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                  {formData.tags.length > 3 && (
                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 text-xs rounded-full">
                      +{formData.tags.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* 提交检查清单 */}
      <motion.div
        variants={itemVariants}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-emerald-500" />
            <h4 className="font-semibold text-gray-900 dark:text-white">提交检查</h4>
          </div>
          <span className="text-sm text-gray-500">
            {completedCount}/{checklist.length}
          </span>
        </div>

        {/* 进度条 */}
        <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-4">
          <motion.div
            className={`h-full rounded-full ${canSubmit ? 'bg-emerald-500' : 'bg-amber-500'}`}
            initial={{ width: 0 }}
            animate={{ width: `${(completedCount / checklist.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* 检查项 */}
        <ul className="space-y-3">
          {checklist.map((item) => (
            <li key={item.id} className="flex items-center gap-3">
              <div className={`flex-shrink-0 ${item.completed ? 'text-emerald-500' : 'text-gray-300 dark:text-gray-600'}`}>
                {item.completed ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <Circle className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1 flex items-center gap-2">
                <item.icon className={`w-4 h-4 ${item.completed ? 'text-gray-600 dark:text-gray-300' : 'text-gray-400'}`} />
                <span className={`text-sm ${item.completed ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400'}`}>
                  {item.label}
                </span>
                {item.required && (
                  <span className="text-xs text-red-500">*</span>
                )}
              </div>
            </li>
          ))}
        </ul>

        {/* 提交提示 */}
        <AnimatePresence mode="wait">
          {!canSubmit ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800"
            >
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  请完成所有必填项后再提交作品
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800"
            >
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  所有必填项已完成，可以提交作品了！
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* 文件统计 */}
      {formData.files.length > 0 && (
        <motion.div
          variants={itemVariants}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <FileArchive className="w-5 h-5 text-blue-500" />
            <h4 className="font-semibold text-gray-900 dark:text-white">文件统计</h4>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">文件数量</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {formData.files.length} 个
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">总大小</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {formatFileSize(formData.files.reduce((acc, f) => acc + f.size, 0))}
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* 自动保存状态 */}
      <motion.div
        variants={itemVariants}
        className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-4"
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            isSaving
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-500'
              : lastSavedAt
                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
          }`}>
            {isSaving ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Save className="w-4 h-4" />
              </motion.div>
            ) : (
              <Save className="w-4 h-4" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {isSaving ? '正在保存...' : lastSavedAt ? '已自动保存' : '草稿未保存'}
            </p>
            {lastSavedAt && (
              <p className="text-xs text-gray-500">
                {format(lastSavedAt, 'HH:mm:ss')}
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {/* 创作提示 */}
      <motion.div
        variants={itemVariants}
        className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl border border-purple-200 dark:border-purple-800 p-5"
      >
        <div className="flex items-start gap-3">
          <Lightbulb className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
          <div>
            <h5 className="text-sm font-medium text-purple-900 dark:text-purple-100 mb-2">创作小贴士</h5>
            <ul className="space-y-1.5 text-xs text-purple-700 dark:text-purple-300">
              <li>• 使用高清图片展示作品细节</li>
              <li>• 添加详细的创作说明</li>
              <li>• 选择合适的标签增加曝光</li>
              <li>• 确保作品符合活动主题</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default SubmitSidebarRight;
