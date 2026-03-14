import { useState, useContext, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { AuthContext } from '@/contexts/authContext';
import { useEventService } from '@/hooks/useEventService';
import { eventParticipationService } from '@/services/eventParticipationService';
import { eventSubmissionService } from '@/services/eventSubmissionService';
import { useDraftWithFiles } from '@/hooks/useDraftWithFiles';
import { toast } from 'sonner';
import {
  ChevronLeft,
  Upload,
  X,
  Image as ImageIcon,
  Video,
  FileAudio,
  FileText,
  AlertCircle,
  Loader2,
  Trash2,
  Sparkles,
  Save,
  Send,
  Plus,
} from 'lucide-react';

// 品牌色彩
const brandColors = {
  primary: '#E53935',
  primaryLight: '#FF6F60',
  primaryDark: '#AB000D',
};

// 表单数据类型
interface FormData {
  title: string;
  description: string;
  tags: string[];
  files: File[];
}

export default function MobileSubmitWork() {
  const { id: eventId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { getEvent } = useEventService();
  const { user, isAuthenticated } = useContext(AuthContext);

  // 状态
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [participationId, setParticipationId] = useState<string | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 表单数据
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    tags: [],
    files: [],
  });

  // 当前输入的标签
  const [currentTag, setCurrentTag] = useState('');

  // 草稿保存 Hook
  const {
    lastSavedAt,
    isSaving,
    isUploading,
    saveWithData,
    clearDraft,
    loadDraft,
    uploadProgress,
  } = useDraftWithFiles<{
    title: string;
    description: string;
    tags: string[];
  }>({
    key: `event_submission_${eventId}`,
    formData: {
      title: formData.title,
      description: formData.description,
      tags: formData.tags,
    },
    files: formData.files,
    interval: 30000,
    enabled: !!eventId && !submitting && isAuthenticated,
    userId: user?.id,
  });

  // 加载活动信息和参与状态
  useEffect(() => {
    if (!eventId || !user?.id) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        // 并行获取活动信息和参与状态
        const [eventData, participationStatus] = await Promise.all([
          getEvent(eventId),
          eventParticipationService.checkParticipation(eventId, user.id),
        ]);

        setEvent(eventData);

        // 检查用户是否已报名
        if (!participationStatus.isParticipated) {
          toast.error('请先报名参加活动');
          navigate(`/events/${eventId}`);
          return;
        }

        setParticipationId(participationStatus.participationId || null);

        // 尝试恢复草稿
        const draft = await loadDraft();
        if (draft && draft.formData) {
          setFormData({
            title: draft.formData.title || '',
            description: draft.formData.description || '',
            tags: draft.formData.tags || [],
            files: draft.files || [],
          });
          toast.success('已恢复上次编辑的草稿');
        }
      } catch (error) {
        console.error('加载数据失败:', error);
        toast.error('加载数据失败');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [eventId, user?.id, getEvent, navigate, loadDraft]);

  // 监听表单变化
  useEffect(() => {
    if (formData.title || formData.description || formData.files.length > 0) {
      setHasUnsavedChanges(true);
    }
  }, [formData]);

  // 处理文件选择
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files);
    const totalFiles = formData.files.length + newFiles.length;

    if (totalFiles > 10) {
      toast.error('最多只能上传10个文件');
      return;
    }

    // 验证文件类型和大小
    const validFiles = newFiles.filter((file) => {
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        toast.error(`文件 ${file.name} 超过50MB限制`);
        return false;
      }
      return true;
    });

    setFormData((prev) => ({
      ...prev,
      files: [...prev.files, ...validFiles],
    }));
  };

  // 移除文件
  const handleRemoveFile = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index),
    }));
  };

  // 添加标签
  const handleAddTag = () => {
    if (!currentTag.trim()) return;
    if (formData.tags.includes(currentTag.trim())) {
      toast.error('标签已存在');
      return;
    }
    if (formData.tags.length >= 5) {
      toast.error('最多只能添加5个标签');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      tags: [...prev.tags, currentTag.trim()],
    }));
    setCurrentTag('');
  };

  // 移除标签
  const handleRemoveTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };

  // 保存草稿
  const handleSaveDraft = async () => {
    if (!eventId || !user?.id) {
      toast.error('无法保存草稿');
      return;
    }

    try {
      await saveWithData(formData, formData.files);
      if (participationId) {
        await eventSubmissionService.createDraft(eventId, user.id, participationId, {
          title: formData.title,
          description: formData.description,
          files: [],
          metadata: { tags: formData.tags },
        });
      }
      setHasUnsavedChanges(false);
      toast.success('草稿已保存');
    } catch (error) {
      toast.error('保存草稿失败');
    }
  };

  // 提交作品
  const handleSubmit = async () => {
    if (!eventId || !user?.id || !participationId) {
      toast.error('无法提交作品');
      return;
    }

    // 验证表单
    if (!formData.title.trim()) {
      toast.error('请输入作品标题');
      return;
    }
    if (!formData.description.trim()) {
      toast.error('请输入作品描述');
      return;
    }
    if (formData.files.length === 0) {
      toast.error('请至少上传一个文件');
      return;
    }

    setSubmitting(true);
    try {
      // 上传文件
      const uploadedFiles = [];
      for (const file of formData.files) {
        const uploadResult = await eventSubmissionService.uploadFile(file, eventId, user.id);
        if (uploadResult.success && uploadResult.fileData) {
          uploadedFiles.push(uploadResult.fileData);
        } else {
          throw new Error(uploadResult.error || `上传文件 "${file.name}" 失败`);
        }
      }

      // 提交作品
      const result = await eventSubmissionService.submitWork(
        eventId,
        user.id,
        participationId,
        {
          title: formData.title,
          description: formData.description,
          files: uploadedFiles,
          metadata: {
            tags: formData.tags,
          },
        }
      );

      if (result.success) {
        await clearDraft();
        toast.success('作品提交成功！');
        navigate(`/events/${eventId}/works`);
      } else {
        throw new Error(result.error || '提交失败');
      }
    } catch (error: any) {
      toast.error(error.message || '提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  // 处理返回
  const handleBack = () => {
    if (hasUnsavedChanges) {
      setShowExitConfirm(true);
    } else {
      navigate(-1);
    }
  };

  // 获取文件预览
  const getFilePreview = (file: File) => {
    if (file.type.startsWith('image/')) {
      return URL.createObjectURL(file);
    }
    return null;
  };

  // 获取文件图标
  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return ImageIcon;
    if (file.type.startsWith('video/')) return Video;
    if (file.type.startsWith('audio/')) return FileAudio;
    return FileText;
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} pb-24`}>
      {/* 顶部导航栏 */}
      <header className={`sticky top-0 z-40 backdrop-blur-xl border-b ${
        isDark ? 'bg-gray-900/95 border-gray-800' : 'bg-white/95 border-gray-200'
      }`}>
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleBack}
              className={`flex items-center justify-center w-12 h-12 rounded-xl ${
                isDark ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              <ChevronLeft className="w-8 h-8" strokeWidth={2.5} />
            </motion.button>
            <h1 className={`text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              提交作品
            </h1>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleSaveDraft}
              disabled={isSaving}
              className={`flex items-center justify-center w-11 h-11 rounded-xl ${
                isDark ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700'
              } ${isSaving ? 'opacity-50' : ''}`}
            >
              {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
            </motion.button>
          </div>
        </div>
        {/* 保存状态提示 */}
        {lastSavedAt && (
          <div className={`px-4 py-1 text-center text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            上次保存: {lastSavedAt.toLocaleTimeString('zh-CN')}
          </div>
        )}
      </header>

      {/* 活动信息 */}
      {event && (
        <div className="px-4 pt-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl p-4 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}
          >
            <div className="flex items-center gap-3">
              {event.media && event.media.length > 0 ? (
                <img
                  src={event.media[0].url}
                  alt={event.title}
                  className="w-16 h-16 rounded-xl object-cover"
                />
              ) : (
                <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${
                  isDark ? 'bg-gray-700' : 'bg-gray-100'
                }`}>
                  <Sparkles className="w-8 h-8 text-gray-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className={`text-xs mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>参与活动</p>
                <h2 className={`font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {event.title}
                </h2>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* 表单内容 */}
      <div className="px-4 py-4 space-y-4">
        {/* 作品标题 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            作品标题 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="给你的作品起个名字"
            className={`w-full px-4 py-3 rounded-xl text-sm ${
              isDark
                ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
            } border focus:outline-none focus:ring-2 focus:ring-red-500/20`}
          />
        </motion.div>

        {/* 作品描述 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            作品描述 <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="介绍一下你的作品..."
            rows={4}
            className={`w-full px-4 py-3 rounded-xl text-sm resize-none ${
              isDark
                ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
            } border focus:outline-none focus:ring-2 focus:ring-red-500/20`}
          />
        </motion.div>

        {/* 标签 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            标签 <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>(最多5个)</span>
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {formData.tags.map((tag) => (
              <span
                key={tag}
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs ${
                  isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={currentTag}
              onChange={(e) => setCurrentTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              placeholder="添加标签"
              className={`flex-1 px-4 py-2 rounded-xl text-sm ${
                isDark
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                  : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
              } border focus:outline-none focus:ring-2 focus:ring-red-500/20`}
            />
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleAddTag}
              disabled={!currentTag.trim() || formData.tags.length >= 5}
              className={`px-4 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-50`}
              style={{ backgroundColor: brandColors.primary }}
            >
              <Plus className="w-5 h-5" />
            </motion.button>
          </div>
        </motion.div>

        {/* 文件上传 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            上传文件 <span className="text-red-500">*</span>
            <span className={`text-xs ml-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              (最多10个, 单个不超过50MB)
            </span>
          </label>

          {/* 上传按钮 */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            multiple
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
            className="hidden"
          />
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => fileInputRef.current?.click()}
            disabled={formData.files.length >= 10}
            className={`w-full py-8 rounded-xl border-2 border-dashed flex flex-col items-center gap-2 transition-colors ${
              isDark
                ? 'border-gray-700 text-gray-400 hover:border-gray-600'
                : 'border-gray-300 text-gray-500 hover:border-gray-400'
            } ${formData.files.length >= 10 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Upload className="w-8 h-8" />
            <span className="text-sm">点击或拖拽上传文件</span>
            <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              支持图片、视频、音频、文档
            </span>
          </motion.button>

          {/* 文件列表 */}
          {formData.files.length > 0 && (
            <div className="mt-4 space-y-2">
              {formData.files.map((file, index) => {
                const preview = getFilePreview(file);
                const FileIcon = getFileIcon(file);
                return (
                  <div
                    key={index}
                    className={`flex items-center gap-3 p-3 rounded-xl ${
                      isDark ? 'bg-gray-800' : 'bg-white'
                    } border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
                  >
                    {preview ? (
                      <img
                        src={preview}
                        alt={file.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        isDark ? 'bg-gray-700' : 'bg-gray-100'
                      }`}>
                        <FileIcon className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm truncate ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {file.name}
                      </p>
                      <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveFile(index)}
                      className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* 底部提交栏 */}
      <div className={`fixed bottom-0 left-0 right-0 p-4 z-40 ${
        isDark ? 'bg-gray-900/95 border-gray-800' : 'bg-white/95 border-gray-200'
      } backdrop-blur-xl border-t`}>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-3.5 rounded-xl text-white font-medium flex items-center justify-center gap-2 disabled:opacity-70"
          style={{ backgroundColor: brandColors.primary }}
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
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

      {/* 退出确认弹窗 */}
      <AnimatePresence>
        {showExitConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowExitConfirm(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`fixed inset-0 m-auto w-[85%] max-w-sm h-fit rounded-2xl z-50 ${
                isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
              } border p-6`}
            >
              <div className="text-center">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  isDark ? 'bg-amber-500/20' : 'bg-amber-100'
                }`}>
                  <AlertCircle className="w-7 h-7 text-amber-500" />
                </div>
                <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  确定要离开吗？
                </h3>
                <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  你有未保存的内容，离开后将丢失已编辑的内容
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowExitConfirm(false)}
                    className={`flex-1 py-3 rounded-xl text-sm font-medium ${
                      isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    继续编辑
                  </button>
                  <button
                    onClick={() => navigate(-1)}
                    className="flex-1 py-3 rounded-xl text-sm font-medium text-white"
                    style={{ backgroundColor: brandColors.primary }}
                  >
                    确认离开
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
