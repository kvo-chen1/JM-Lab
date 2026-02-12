import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Send, Save, Type, FileText, Hash, Upload, AlertCircle } from 'lucide-react';
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
  isSubmitting?: boolean;
  isSaving?: boolean;
}

const MAX_TITLE_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 2000;

export function WorkSubmitForm({
  initialData,
  onSubmit,
  onSaveDraft,
  isSubmitting = false,
  isSaving = false
}: WorkSubmitFormProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [files, setFiles] = useState<File[]>(initialData?.files || []);
  const [errors, setErrors] = useState<Record<string, string>>({});

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
      toast.success('草稿已保存');
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
          <span className={`text-xs ${description.length > MAX_DESCRIPTION_LENGTH ? 'text-red-500' : 'text-gray-400'}`}>
            {description.length}/{MAX_DESCRIPTION_LENGTH}
          </span>
        </div>

        <textarea
          value={description}
          onChange={(e) => {
            if (e.target.value.length <= MAX_DESCRIPTION_LENGTH) {
              setDescription(e.target.value);
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
          onTagsChange={setTags}
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
          }}
          maxFiles={10}
          maxFileSize={100}
          isUploading={isSubmitting}
        />

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
                  <span>提交作品</span>
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
