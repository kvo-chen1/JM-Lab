import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Save, Type, FileText, Hash, Upload, AlertCircle, Sparkles, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import { MediaUploadZone } from '../upload/MediaUploadZone';
import { TagInput } from './TagInput';

interface WorkSubmitFormProps {
  initialData?: {
    title: string;
    description: string;
    tags: string[];
    files: File[];
  };
  onSubmit: (data: {
    title: string;
    description: string;
    tags: string[];
    files: File[];
  }) => Promise<void>;
  onSaveDraft?: (data: {
    title: string;
    description: string;
    tags: string[];
    files: File[];
  }) => Promise<void>;
  onChange?: (data: {
    title: string;
    description: string;
    tags: string[];
    files: File[];
  }) => void;
  isSubmitting?: boolean;
  isSaving?: boolean;
  isUploading?: boolean;
  uploadProgress?: Record<string, number>;
  // AI优化相关
  onOptimizeDescription?: () => Promise<string>;
  isOptimizing?: boolean;
  wizardData?: any;
  // 导入到创作中心
  onImportToCreate?: () => void;
  isImporting?: boolean;
}

const MAX_TITLE_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 2000;

export function WorkSubmitForm({
  initialData,
  onSubmit,
  onSaveDraft,
  onChange,
  isSubmitting = false,
  isSaving = false,
  isUploading = false,
  uploadProgress = {},
  onOptimizeDescription,
  isOptimizing = false,
  wizardData,
  onImportToCreate,
  isImporting = false
}: WorkSubmitFormProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [files, setFiles] = useState<File[]>(initialData?.files || []);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 监听 initialData 变化，恢复草稿数据（只在初始数据变化时执行一次）
  const hasRestoredRef = useRef(false);
  useEffect(() => {
    if (initialData && !hasRestoredRef.current) {
      console.log('[WorkSubmitForm] 恢复草稿数据:', initialData);
      hasRestoredRef.current = true;
      
      if (initialData.title) setTitle(initialData.title);
      if (initialData.description) setDescription(initialData.description);
      if (initialData.tags && initialData.tags.length > 0) setTags(initialData.tags);
      if (initialData.files && initialData.files.length > 0) setFiles(initialData.files);
      
      // 将恢复的数据同步到父组件
      if (onChange) {
        onChange({
          title: initialData.title || '',
          description: initialData.description || '',
          tags: initialData.tags || [],
          files: initialData.files || []
        });
      }
    }
  }, [initialData]);

  // 同步数据变化到父组件
  const syncData = useCallback(() => {
    if (onChange) {
      onChange({
        title: title.trim(),
        description: description.trim(),
        tags,
        files
      });
    }
  }, [title, description, tags, files, onChange]);

  // 验证表单
  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = '请输入作品标题';
    } else if (title.trim().length < 2) {
      newErrors.title = '标题至少需要 2 个字符';
    }

    if (description.trim() && description.trim().length < 10) {
      newErrors.description = '描述至少需要 10 个字符';
    }

    if (files.length === 0) {
      newErrors.files = '请至少上传一个文件';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [title, description, files]);

  // 处理提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('请检查表单填写是否正确');
      return;
    }

    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        tags,
        files
      });
    } catch (error) {
      console.error('提交失败:', error);
    }
  };

  // 处理保存草稿
  const handleSaveDraft = async () => {
    if (!onSaveDraft) return;

    try {
      await onSaveDraft({
        title: title.trim(),
        description: description.trim(),
        tags,
        files
      });
      // 提示在父组件 SubmitWork 中显示，这里不重复显示
    } catch (error) {
      console.error('保存草稿失败:', error);
      toast.error('保存草稿失败');
    }
  };

  // 表单字段动画
  const fieldVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.3
      }
    })
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* 标题输入 */}
      <motion.div
        custom={0}
        variants={fieldVariants}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
      >
        <div className="flex items-center justify-between mb-3">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
            <Type className="w-4 h-4 text-red-500" />
            作品标题
            <span className="text-red-500">*</span>
          </label>
          <span className={`text-xs ${title.length > MAX_TITLE_LENGTH ? 'text-red-500' : 'text-gray-400'}`}>
            {title.length}/{MAX_TITLE_LENGTH}
          </span>
        </div>

        <input
          type="text"
          value={title}
          onChange={(e) => {
            if (e.target.value.length <= MAX_TITLE_LENGTH) {
              setTitle(e.target.value);
              if (errors.title) {
                setErrors(prev => ({ ...prev, title: '' }));
              }
              // 同步到父组件
              setTimeout(() => syncData(), 0);
            }
          }}
          placeholder="给你的作品起个响亮的名字"
          disabled={isSubmitting}
          className={`
            w-full px-4 py-3 rounded-xl border-2 bg-gray-50 dark:bg-gray-900/50
            text-gray-900 dark:text-white placeholder-gray-400
            transition-all duration-200
            focus:outline-none focus:bg-white dark:focus:bg-gray-800
            disabled:opacity-50 disabled:cursor-not-allowed
            ${errors.title
              ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
              : 'border-gray-200 dark:border-gray-700 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
            }
          `}
        />

        {errors.title && (
          <div className="flex items-center gap-1.5 mt-2 text-red-500 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{errors.title}</span>
          </div>
        )}
      </motion.div>

      {/* 描述输入 */}
      <motion.div
        custom={1}
        variants={fieldVariants}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
      >
        <div className="flex items-center justify-between mb-3">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
            <FileText className="w-4 h-4 text-blue-500" />
            作品描述
          </label>
          <div className="flex items-center gap-3">
            {/* AI优化按钮 */}
            {onOptimizeDescription && (
              <button
                type="button"
                onClick={async () => {
                  if (!description.trim()) {
                    toast.error('请先输入描述内容');
                    return;
                  }
                  try {
                    const optimized = await onOptimizeDescription();
                    if (optimized) {
                      setDescription(optimized);
                      setTimeout(() => syncData(), 0);
                      toast.success('描述已优化');
                    }
                  } catch (error) {
                    toast.error('优化失败，请重试');
                  }
                }}
                disabled={isOptimizing || !description.trim()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isOptimizing ? (
                  <>
                    <i className="fas fa-spinner fa-spin" />
                    优化中...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    AI优化
                  </>
                )}
              </button>
            )}
            <span className={`text-xs ${description.length > MAX_DESCRIPTION_LENGTH ? 'text-red-500' : 'text-gray-400'}`}>
              {description.length}/{MAX_DESCRIPTION_LENGTH}
            </span>
          </div>
        </div>

        <textarea
          value={description}
          onChange={(e) => {
            if (e.target.value.length <= MAX_DESCRIPTION_LENGTH) {
              setDescription(e.target.value);
              // 同步到父组件
              setTimeout(() => syncData(), 0);
              if (errors.description) {
                setErrors(prev => ({ ...prev, description: '' }));
              }
            }
          }}
          placeholder="介绍一下你的创作灵感、设计理念或背后的故事..."
          rows={5}
          disabled={isSubmitting}
          className={`
            w-full px-4 py-3 rounded-xl border-2 bg-gray-50 dark:bg-gray-900/50
            text-gray-900 dark:text-white placeholder-gray-400
            transition-all duration-200 resize-none
            focus:outline-none focus:bg-white dark:focus:bg-gray-800
            disabled:opacity-50 disabled:cursor-not-allowed
            ${errors.description
              ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
              : 'border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
            }
          `}
        />

        {errors.description && (
          <div className="flex items-center gap-1.5 mt-2 text-red-500 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{errors.description}</span>
          </div>
        )}

        <p className="mt-2 text-xs text-gray-500">
          良好的描述可以帮助其他人更好地理解你的作品
        </p>
      </motion.div>

      {/* 标签输入 */}
      <motion.div
        custom={2}
        variants={fieldVariants}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
      >
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white mb-3">
          <Hash className="w-4 h-4 text-purple-500" />
          作品标签
        </label>

        <TagInput
          tags={tags}
          onTagsChange={(newTags) => {
            setTags(newTags);
            // 同步到父组件
            setTimeout(() => syncData(), 0);
          }}
          disabled={isSubmitting}
        />
      </motion.div>

      {/* 文件上传 */}
      <motion.div
        custom={3}
        variants={fieldVariants}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
      >
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white mb-3">
          <Upload className="w-4 h-4 text-emerald-500" />
          上传文件
          <span className="text-red-500">*</span>
        </label>

        <MediaUploadZone
          files={files}
          onFilesChange={(newFiles) => {
            setFiles(newFiles);
            if (errors.files && newFiles.length > 0) {
              setErrors(prev => ({ ...prev, files: '' }));
            }
            // 同步到父组件
            setTimeout(() => syncData(), 0);
          }}
          maxFiles={10}
          maxFileSize={100}
          isUploading={isSubmitting}
        />

        {/* 上传进度指示器 */}
        {isUploading && Object.keys(uploadProgress).length > 0 && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
              正在上传文件到云端...
            </p>
            {Object.entries(uploadProgress).map(([fileName, progress]) => (
              <div key={fileName} className="flex items-center gap-2 mb-2">
                <span className="text-xs text-gray-600 dark:text-gray-400 truncate flex-1">
                  {fileName}
                </span>
                <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-blue-500 rounded-full"
                  />
                </div>
                <span className="text-xs text-gray-500 w-10 text-right">{progress}%</span>
              </div>
            ))}
          </div>
        )}

        {errors.files && (
          <div className="flex items-center gap-1.5 mt-3 text-red-500 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{errors.files}</span>
          </div>
        )}
      </motion.div>

      {/* 底部操作栏 */}
      <motion.div
        custom={4}
        variants={fieldVariants}
        className="sticky bottom-6 z-10"
      >
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {onSaveDraft && (
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSaveDraft}
                disabled={isSubmitting || isSaving}
                className="flex-1 sm:flex-none px-6 py-3 rounded-xl font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full"
                  />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                <span>保存草稿</span>
              </motion.button>
            )}

            {/* 导入到创作中心按钮 */}
            {onImportToCreate && (
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onImportToCreate}
                disabled={isSubmitting || isImporting}
                className="flex-1 sm:flex-none px-6 py-3 rounded-xl font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isImporting ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    />
                    <span>导入中...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5" />
                    <span>导入到创作中心</span>
                  </>
                )}
              </motion.button>
            )}

            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 shadow-lg shadow-red-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                  />
                  <span>提交中...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span className="pt-0.5">提交作品</span>
                </>
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.form>
  );
}

export default WorkSubmitForm;
