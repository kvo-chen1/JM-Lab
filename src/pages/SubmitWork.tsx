import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { AlertCircle, RefreshCw } from 'lucide-react';

// 组件导入
import { SubmitHeader } from '@/components/submit/SubmitHeader';
import { SubmitSidebarLeft } from '@/components/submit/SubmitSidebarLeft';
import { SubmitSidebarRight } from '@/components/submit/SubmitSidebarRight';
import { WorkSubmitForm } from '@/components/submit/WorkSubmitForm';
import { AIAssistantPanel } from '@/components/submit/AIAssistantPanel';

// Hooks 导入
import { useEventService } from '@/hooks/useEventService';
import { useDraftWithFiles } from '@/hooks/useDraftWithFiles';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';

// 服务导入
import { eventSubmissionService } from '@/services/eventSubmissionService';
import { eventParticipationService } from '@/services/eventParticipationService';

// 类型定义
import type { Event } from '@/types';

interface ExtendedEvent extends Event {
  coverImage?: string;
  currentParticipants?: number;
  submissionRequirements?: string[];
  rules?: string[];
  prizes?: string[];
}

interface FormData {
  title: string;
  description: string;
  tags: string[];
  files: File[];
}

export default function SubmitWork() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { getEvent } = useEventService();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  // 状态管理
  const [event, setEvent] = useState<ExtendedEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [participationId, setParticipationId] = useState<string | null>(null);


  // 表单数据
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    tags: [],
    files: []
  });

  // 带文件的草稿保存 Hook
  const {
    lastSavedAt,
    isSaving,
    isUploading,
    saveNow,
    clearDraft,
    hasDraft,
    loadDraft,
    uploadProgress
  } = useDraftWithFiles<FormData>({
    key: `event_submission_${id}`,
    formData: {
      title: formData.title,
      description: formData.description,
      tags: formData.tags
    },
    files: formData.files,
    interval: 30000,
    enabled: !!id && !submitting && isAuthenticated,
    userId: user?.id
  });

  // 检查用户认证状态
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast.error('请先登录', {
        description: '提交作品需要先登录账号'
      });
      navigate('/login', { state: { from: `/events/${id}/submit` } });
    }
  }, [authLoading, isAuthenticated, navigate, id]);

  // 验证活动ID
  useEffect(() => {
    if (!id) {
      setError('活动ID无效');
      setLoading(false);
    }
  }, [id]);

  // 加载活动信息和用户参与状态
  useEffect(() => {
    // 如果缺少必要参数，不执行加载
    if (!id || !user?.id) {
      return;
    }

    const fetchEventAndParticipation = async () => {
      try {
        setLoading(true);
        setError(null);

        // 并行获取活动详情和用户参与状态
        const [eventData, participationStatus] = await Promise.all([
          getEvent(id),
          eventParticipationService.checkParticipation(id, user.id)
        ]);

        setEvent(eventData as unknown as ExtendedEvent);

        // 检查用户是否已报名
        if (!participationStatus.isParticipated) {
          toast.error('请先报名参加活动', {
            description: '提交作品前需要先报名参加活动'
          });
          navigate(`/events/${id}`);
          return;
        }

        // 检查参与状态是否允许提交
        if (participationStatus.status === 'cancelled') {
          toast.error('无法提交作品', {
            description: '您的报名已被取消'
          });
          navigate(`/events/${id}`);
          return;
        }

        setParticipationId(participationStatus.participationId || null);
        console.log('[SubmitWork] participationStatus:', participationStatus);

        // 如果用户已经提交过作品，加载已提交的作品数据
        if (participationStatus.status === 'submitted' && participationStatus.participationId) {
          console.log('[SubmitWork] 用户已提交作品，尝试加载...');
          try {
            const submission = await eventSubmissionService.getSubmissionByParticipation(
              participationStatus.participationId
            );
            console.log('[SubmitWork] 加载的提交作品:', submission);
            if (submission) {
              // 注意：已提交作品的文件无法恢复为 File 对象，需要用户重新上传
              // 这里只加载文本内容
              setFormData({
                title: submission.title || '',
                description: submission.description || '',
                tags: submission.tags || [],
                files: [] // 文件需要重新上传
              });
              
              // 如果有文件，显示提示
              if (submission.files && submission.files.length > 0) {
                toast.success('已加载您提交的作品', {
                  description: `文本内容已恢复，${submission.files.length} 个文件需要重新上传`,
                  duration: 5000
                });
              } else {
                toast.success('已加载您提交的作品', {
                  description: '您可以继续编辑并重新提交',
                  duration: 3000
                });
              }
            } else {
              console.log('[SubmitWork] 未找到提交作品，尝试恢复草稿');
              // 尝试恢复草稿
              await restoreDraft();
            }
          } catch (err) {
            console.error('[SubmitWork] 加载已提交作品失败:', err);
            // 尝试恢复草稿
            await restoreDraft();
          }
        } else {
          console.log('[SubmitWork] 用户未提交作品，尝试恢复草稿');
          // 尝试恢复草稿（包括文件）
          await restoreDraft();
        }

        async function restoreDraft() {
          const draft = await loadDraft();
          if (draft) {
            setFormData(prev => ({
              ...prev,
              title: draft.formData.title || '',
              description: draft.formData.description || '',
              tags: draft.formData.tags || [],
              files: draft.files || [] // 从云端恢复文件
            }));

            // 检查文件恢复情况
            const restoredFilesCount = draft.files?.length || 0;
            const originalFilesCount = draft.formData.files?.length || 0;

            if (restoredFilesCount > 0) {
              toast.success('已恢复上次编辑的草稿', {
                description: `文本内容和 ${restoredFilesCount} 个文件已恢复`,
                duration: 5000
              });
            } else if (originalFilesCount > 0) {
              toast.warning('草稿部分恢复', {
                description: '文本内容已恢复，但文件恢复失败，请重新上传',
                duration: 5000
              });
            } else {
              toast.success('已恢复上次编辑的草稿', {
                description: '你可以继续编辑或提交作品',
                duration: 3000
              });
            }
          }
        }
      } catch (err: any) {
        console.error('加载活动信息失败:', err);
        setError(err.message || '无法加载活动信息');
        toast.error('无法加载活动信息');
      } finally {
        setLoading(false);
      }
    };

    fetchEventAndParticipation();
  }, [id, getEvent, user?.id, navigate, loadDraft]);

  // 处理表单提交
  const handleSubmit = useCallback(async (data: FormData) => {
    if (!id || !user?.id) {
      toast.error('用户未登录');
      return;
    }

    if (!participationId) {
      toast.error('请先报名参加活动');
      navigate(`/events/${id}`);
      return;
    }

    setSubmitting(true);

    try {
      // 上传文件到 Supabase Storage
      const uploadedFiles = [];
      for (const file of data.files) {
        const uploadResult = await eventSubmissionService.uploadFile(
          file,
          id,
          user.id
        );

        if (uploadResult.success && uploadResult.fileData) {
          uploadedFiles.push(uploadResult.fileData);
        } else {
          throw new Error(uploadResult.error || `上传文件 "${file.name}" 失败`);
        }
      }

      // 提交作品到数据库
      const result = await eventSubmissionService.submitWork(
        id,
        user.id,
        participationId,
        {
          title: data.title,
          description: data.description,
          files: uploadedFiles,
          metadata: {
            tags: data.tags
          }
        }
      );

      if (result.success) {
        // 清除草稿
        await clearDraft();

        toast.success('作品提交成功！', {
          description: '你的作品已成功提交，等待审核',
          duration: 5000
        });

        // 跳转到活动详情页
        navigate(`/events/${id}`);
      } else {
        throw new Error(result.error || '提交失败');
      }
    } catch (err: any) {
      console.error('提交作品失败:', err);
      toast.error('提交失败', {
        description: err.message || '请稍后重试'
      });
    } finally {
      setSubmitting(false);
    }
  }, [id, user?.id, participationId, navigate, clearDraft]);

  // 处理保存草稿
  const handleSaveDraft = useCallback(async (data: FormData) => {
    if (!id || !user?.id || !participationId) {
      toast.error('无法保存草稿');
      return;
    }

    try {
      // 保存到服务器（只保存文本数据，不保存文件）
      await eventSubmissionService.createDraft(id, user.id, participationId, {
        title: data.title,
        description: data.description,
        files: [],
        metadata: { tags: data.tags }
      });

      // 触发本地保存
      await saveNow();

      toast.success('草稿已保存');
    } catch (err: any) {
      console.error('保存草稿失败:', err);
      toast.error('保存草稿失败');
      throw err;
    }
  }, [id, user?.id, participationId, saveNow]);

  // 处理返回
  const handleBack = useCallback(() => {
    if (formData.title || formData.description || formData.files.length > 0) {
      const confirmed = window.confirm('你有未保存的内容，确定要离开吗？');
      if (!confirmed) return;
    }
    navigate(-1);
  }, [navigate, formData]);

  // 重试加载
  const handleRetry = useCallback(() => {
    setLoading(true);
    setError(null);
    window.location.reload();
  }, []);

  // 处理AI建议应用 - 必须在所有条件渲染之前定义
  const handleAISuggestionApply = useCallback((field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    toast.success('已应用AI建议');
  }, []);

  // 加载中状态
  if (loading || authLoading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
            加载中...
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {authLoading ? '正在验证登录状态...' : '正在获取活动信息...'}
          </p>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center p-4`}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`max-w-md w-full ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-xl p-8 text-center`}
        >
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
            加载失败
          </h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={handleRetry}
              className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              重试
            </button>
            <button
              onClick={() => navigate('/events')}
              className="px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-colors"
            >
              返回活动列表
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50/50'}`}>
      {/* 顶部导航 */}
      <SubmitHeader
        onBack={handleBack}
        lastSavedAt={lastSavedAt}
        isSaving={isSaving}
        isSubmitting={submitting}
      />

      {/* 主内容区 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 左栏 - 活动信息 */}
          <div className="lg:col-span-3 space-y-6">
            <SubmitSidebarLeft event={event} />
          </div>

          {/* 中栏 - 表单 */}
          <div className="lg:col-span-6">
            <WorkSubmitForm
              initialData={formData}
              onSubmit={handleSubmit}
              onSaveDraft={handleSaveDraft}
              onChange={(data) => setFormData(data)}
              isSubmitting={submitting}
              isSaving={isSaving}
              isUploading={isUploading}
              uploadProgress={uploadProgress}
            />
          </div>

          {/* 右栏 - 预览和检查 */}
          <div className="lg:col-span-3 space-y-6">
            <SubmitSidebarRight
              formData={formData}
              lastSavedAt={lastSavedAt}
              isSaving={isSaving}
            />
          </div>
        </div>
      </main>

      {/* AI创作助手 */}
      <AIAssistantPanel
        formData={formData}
        eventTitle={event?.title}
        onSuggestionApply={handleAISuggestionApply}
      />
    </div>
  );
}
