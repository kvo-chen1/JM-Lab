import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { llmService } from '@/services/llmService';
import { brandConsistencyService, BrandConsistencyResult } from '@/services/brandConsistencyService';
import { contentScoringService } from '@/services/contentScoringService';

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

  // 从品牌向导导入的数据
  const [wizardData, setWizardData] = useState<any>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);

  // 品牌检查状态
  const [brandCheckResult, setBrandCheckResult] = useState<BrandConsistencyResult | null>(null);
  const [culturalScore, setCulturalScore] = useState<number>(0);
  const [isCheckingBrand, setIsCheckingBrand] = useState(false);
  const [showBrandCheckPanel, setShowBrandCheckPanel] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // 带文件的草稿保存 Hook
  const {
    lastSavedAt,
    isSaving,
    isUploading,
    saveWithData,
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

  // 防止重复执行的 ref
  const hasRestoredDraftRef = useRef(false);

  // 加载活动信息和用户参与状态
  useEffect(() => {
    // 如果缺少必要参数，不执行加载
    if (!id || !user?.id) {
      return;
    }

    // 如果已经恢复过草稿，不再执行
    if (hasRestoredDraftRef.current) {
      return;
    }

    const fetchEventAndParticipation = async () => {
      if (hasRestoredDraftRef.current) return;
      hasRestoredDraftRef.current = true;

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

        // 检查是否有从品牌向导导入的数据
        const wizardWorkData = localStorage.getItem('wizard_work_data');
        if (wizardWorkData) {
          try {
            const parsedData = JSON.parse(wizardWorkData);
            setWizardData(parsedData);
            console.log('[SubmitWork] 从品牌向导导入的数据:', parsedData);
            
            // 自动填充表单数据
            setFormData(prev => ({
              ...prev,
              title: parsedData.title || prev.title,
              description: parsedData.description || prev.description,
              tags: parsedData.culturalElements || []
            }));
            
            // 自动上传品牌向导生成的图片
            if (parsedData.mainImage || (parsedData.allImages && parsedData.allImages.length > 0)) {
              console.log('[SubmitWork] 开始自动上传品牌向导图片...');
              
              // 获取所有需要上传的图片URL（去重）
              const imageUrls: string[] = [];
              
              // 添加主图片
              if (parsedData.mainImage && !imageUrls.includes(parsedData.mainImage)) {
                imageUrls.push(parsedData.mainImage);
              }
              
              // 添加所有变体图片
              if (parsedData.allImages && Array.isArray(parsedData.allImages)) {
                parsedData.allImages.forEach((img: any) => {
                  if (img.url && !imageUrls.includes(img.url)) {
                    imageUrls.push(img.url);
                  }
                });
              }
              
              console.log('[SubmitWork] 需要上传的图片URLs:', imageUrls);
              
              // 上传所有图片
              if (imageUrls.length > 0) {
                // 显示上传提示
                toast.loading(`正在上传 ${imageUrls.length} 张图片...`, {
                  id: 'upload-wizard-images',
                  duration: 10000
                });
                
                // 并行上传所有图片
                const uploadPromises = imageUrls.map(async (imageUrl, index) => {
                  try {
                    // 如果是 Supabase 存储的图片，直接使用
                    if (imageUrl.includes('supabase.co') || imageUrl.includes('supabase.in')) {
                      console.log(`[SubmitWork] 图片 ${index + 1} 已在存储中，直接使用`);
                      return {
                        url: imageUrl,
                        type: 'image' as const,
                        name: `wizard-image-${index + 1}.jpg`
                      };
                    }
                    
                    // 如果是 base64 图片，转换为 File 对象
                    if (imageUrl.startsWith('data:')) {
                      const response = await fetch(imageUrl);
                      const blob = await response.blob();
                      const file = new File([blob], `wizard-image-${index + 1}.jpg`, { type: 'image/jpeg' });
                      return {
                        file,
                        url: imageUrl,
                        type: 'image' as const,
                        name: file.name
                      };
                    }
                    
                    // 如果是网络图片URL，下载并转换为 File
                    const response = await fetch(imageUrl);
                    if (!response.ok) {
                      console.error(`[SubmitWork] 下载图片 ${index + 1} 失败:`, response.status);
                      return null;
                    }
                    const blob = await response.blob();
                    const file = new File([blob], `wizard-image-${index + 1}.jpg`, { type: blob.type || 'image/jpeg' });
                    return {
                      file,
                      url: imageUrl,
                      type: 'image' as const,
                      name: file.name
                    };
                  } catch (error) {
                    console.error(`[SubmitWork] 处理图片 ${index + 1} 失败:`, error);
                    return null;
                  }
                });
                
                const uploadedFiles = (await Promise.all(uploadPromises)).filter(Boolean);
                console.log('[SubmitWork] 成功处理的图片:', uploadedFiles);
                
                if (uploadedFiles.length > 0) {
                  // 更新表单数据，添加图片文件
                  setFormData(prev => ({
                    ...prev,
                    files: [...prev.files, ...uploadedFiles.map(f => f!.file || f!.url)]
                  }));
                  
                  toast.success(`成功导入 ${uploadedFiles.length} 张图片`, {
                    id: 'upload-wizard-images',
                    description: '品牌向导生成的图片已自动添加到作品中'
                  });
                } else {
                  toast.error('图片导入失败', {
                    id: 'upload-wizard-images',
                    description: '无法处理品牌向导的图片，请手动上传'
                  });
                }
              }
            }
            
            toast.success('已从品牌向导导入创作数据', {
              description: '图片和文本内容已自动填充，您可以继续编辑',
              duration: 5000
            });
            
            // 清除 localStorage 中的数据，避免重复导入
            localStorage.removeItem('wizard_work_data');
          } catch (e) {
            console.error('[SubmitWork] 解析品牌向导数据失败:', e);
            toast.error('导入数据失败', {
              description: '无法解析品牌向导的数据'
            });
          }
        }

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
          console.log('[SubmitWork] 开始恢复草稿...');
          const draft = await loadDraft();
          console.log('[SubmitWork] 加载的草稿数据:', draft);
          
          if (draft) {
            console.log('[SubmitWork] 草稿 formData:', draft.formData);
            console.log('[SubmitWork] 草稿 files:', draft.files);
            
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
          } else {
            console.log('[SubmitWork] 没有可恢复的草稿');
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

  // 页面加载完成后，当表单数据准备好时自动执行品牌检查
  const hasAutoCheckedRef = useRef(false);
  useEffect(() => {
    // 只在页面加载完成且没有检查过的情况下执行
    if (loading || hasAutoCheckedRef.current) return;

    // 检查是否有图片数据（从品牌向导导入或草稿恢复）
    if (formData.files.length > 0) {
      hasAutoCheckedRef.current = true;
      console.log('[SubmitWork] 页面加载完成，自动执行品牌检查...');

      // 延迟执行，确保所有状态都已更新
      const timer = setTimeout(() => {
        performBrandCheck(formData);
      }, 800);

      return () => clearTimeout(timer);
    }
  }, [loading, formData.files.length]);

  // 执行品牌一致性检查
  const performBrandCheck = useCallback(async (data: FormData) => {
    if (data.files.length === 0) {
      toast.error('请先上传作品图片');
      return false;
    }

    setIsCheckingBrand(true);
    toast.loading('正在进行品牌一致性检查...', { id: 'brand-check' });

    try {
      // 获取第一张图片的URL（如果是File对象，需要先生成预览URL）
      const firstFile = data.files[0];
      let imageUrl: string;
      
      if (typeof firstFile === 'string') {
        imageUrl = firstFile;
      } else {
        // 创建临时URL用于检查
        imageUrl = URL.createObjectURL(firstFile);
      }

      // 从品牌向导数据中获取品牌资产
      const brandAssets = wizardData?.brandAssets || {
        colors: ['#D32F2F', '#FFC107', '#212121'],
        font: 'SimSun'
      };

      // 并行执行品牌一致性检查和文化评分
      const [brandResult, culturalResult] = await Promise.all([
        brandConsistencyService.checkConsistency({
          brandAssets,
          imageUrl,
          textContent: data.description
        }),
        contentScoringService.analyzeAuthenticity(data.description, imageUrl)
      ]);

      setBrandCheckResult(brandResult);
      setCulturalScore(culturalResult.authenticity_score);
      setShowBrandCheckPanel(true);

      // 清理临时URL
      if (typeof firstFile !== 'string') {
        URL.revokeObjectURL(imageUrl);
      }

      const totalScore = Math.round((brandResult.overallScore + culturalResult.authenticity_score) / 2);
      
      if (totalScore >= 80) {
        toast.success(`品牌检查完成！综合评分: ${totalScore}分`, {
          id: 'brand-check',
          description: '品牌一致性和文化纯正度表现优秀'
        });
      } else if (totalScore >= 60) {
        toast.success(`品牌检查完成！综合评分: ${totalScore}分`, {
          id: 'brand-check',
          description: '整体良好，还有提升空间'
        });
      } else {
        toast.warning(`品牌检查完成！综合评分: ${totalScore}分`, {
          id: 'brand-check',
          description: '建议根据改进建议优化作品'
        });
      }

      return true;
    } catch (error) {
      console.error('品牌检查失败:', error);
      toast.error('品牌检查失败', {
        id: 'brand-check',
        description: '请稍后重试或继续提交'
      });
      return false;
    } finally {
      setIsCheckingBrand(false);
    }
  }, [wizardData]);

  // 处理导入到创作中心
  const handleImportToCreate = useCallback(async () => {
    if (formData.files.length === 0) {
      toast.error('请先上传作品图片');
      return;
    }

    setIsImporting(true);
    toast.loading('正在导入到创作中心...', { id: 'import-to-create' });

    try {
      // 准备导入的数据
      const importData = {
        title: formData.title,
        description: formData.description,
        tags: formData.tags,
        files: formData.files,
        timestamp: Date.now()
      };

      // 将数据存储到 localStorage，供创作中心读取
      localStorage.setItem('submitWork_to_create', JSON.stringify(importData));
      console.log('[SubmitWork] 作品数据已存储到 localStorage:', importData);

      toast.success('数据已准备好', {
        id: 'import-to-create',
        description: '正在跳转到创作中心...'
      });

      // 跳转到创作中心
      navigate('/create');
    } catch (error: any) {
      console.error('导入到创作中心失败:', error);
      toast.error('导入失败', {
        id: 'import-to-create',
        description: error.message || '请稍后重试'
      });
    } finally {
      setIsImporting(false);
    }
  }, [formData, navigate]);

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

    // 如果还没有进行品牌检查，先执行检查
    if (!brandCheckResult && data.files.length > 0) {
      const checkPassed = await performBrandCheck(data);
      if (!checkPassed) {
        return;
      }
      // 检查完成后不立即提交，让用户查看结果
      toast.info('请查看品牌检查结果，确认后继续提交', {
        duration: 5000
      });
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
            tags: data.tags,
            brandCheck: brandCheckResult ? {
              consistencyScore: brandCheckResult.overallScore,
              culturalScore: culturalScore,
              details: brandCheckResult.items,
              suggestions: brandCheckResult.suggestions
            } : undefined
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

        // 跳转到活动作品列表页
        navigate(`/events/${id}/works`);
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
    console.log('[SubmitWork] 保存草稿，participationId:', participationId, 'user:', user?.id);
    
    if (!id || !user?.id) {
      toast.error('无法保存草稿：用户未登录');
      return;
    }

    try {
      // 先更新 formData 状态
      setFormData(data);
      
      // 保存到本地（带文件）
      console.log('[SubmitWork] 调用 saveWithData...');
      await saveWithData(data, data.files);
      console.log('[SubmitWork] saveWithData 完成');
      
      // 如果有 participationId，保存到服务器
      if (participationId) {
        console.log('[SubmitWork] 保存到服务器...');
        await eventSubmissionService.createDraft(id, user.id, participationId, {
          title: data.title,
          description: data.description,
          files: [],
          metadata: { tags: data.tags }
        });
        console.log('[SubmitWork] 服务器保存完成');
      } else {
        console.log('[SubmitWork] 跳过服务器保存，没有 participationId');
      }

      toast.success('草稿已保存');
    } catch (err: any) {
      console.error('[SubmitWork] 保存草稿失败:', err);
      toast.error('保存草稿失败: ' + (err.message || '未知错误'));
      throw err;
    }
  }, [id, user?.id, participationId, saveWithData]);

  // 跟踪是否有未保存的更改
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // 当表单数据变化时，标记为有未保存的更改
  useEffect(() => {
    if (formData.title || formData.description || formData.files.length > 0) {
      setHasUnsavedChanges(true);
    }
  }, [formData]);

  // 处理返回
  const handleBack = useCallback(() => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm('你有未保存的内容，确定要离开吗？');
      if (!confirmed) return;
    }
    navigate(-1);
  }, [navigate, hasUnsavedChanges]);

  // 保存草稿成功后，重置未保存标记
  const handleSaveDraftWithReset = useCallback(async (data: FormData) => {
    await handleSaveDraft(data);
    setHasUnsavedChanges(false);
  }, [handleSaveDraft]);

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

  // 处理AI优化描述
  const handleOptimizeDescription = useCallback(async (): Promise<string> => {
    if (!formData.description.trim()) {
      toast.error('请先输入描述内容');
      return '';
    }

    setIsOptimizing(true);
    try {
      const result = await llmService.optimizeWorkDescription(
        formData.title,
        formData.description,
        wizardData?.brandAssets?.brandName,
        wizardData?.culturalElements || formData.tags
      );

      if (result.success && result.optimized) {
        toast.success('描述已优化', {
          description: 'AI已根据您的内容生成更专业的描述'
        });
        return result.optimized;
      } else {
        toast.error('优化失败', {
          description: result.error || '请稍后重试'
        });
        return '';
      }
    } catch (error: any) {
      console.error('AI优化失败:', error);
      toast.error('优化失败', {
        description: error.message || '请稍后重试'
      });
      return '';
    } finally {
      setIsOptimizing(false);
    }
  }, [formData.description, formData.title, formData.tags, wizardData]);

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
              onSaveDraft={handleSaveDraftWithReset}
              onChange={(data) => setFormData(data)}
              isSubmitting={submitting}
              isSaving={isSaving}
              isUploading={isUploading}
              uploadProgress={uploadProgress}
              onOptimizeDescription={handleOptimizeDescription}
              isOptimizing={isOptimizing}
              wizardData={wizardData}
              onImportToCreate={handleImportToCreate}
              isImporting={isImporting}
            />
          </div>

          {/* 右栏 - 预览和检查 */}
          <div className="lg:col-span-3 space-y-6">
            {/* 品牌检查结果面板 */}
            {showBrandCheckPanel && brandCheckResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-xl border p-4 ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'} shadow-sm`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    <i className="fas fa-shield-alt text-blue-500 mr-2"></i>
                    品牌检查结果
                  </h3>
                  <button
                    onClick={() => setShowBrandCheckPanel(false)}
                    className={`p-1 rounded hover:bg-gray-100 ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'text-gray-500'}`}
                  >
                    <i className="fas fa-times text-xs"></i>
                  </button>
                </div>

                {/* 综合评分 */}
                <div className="flex items-center justify-center mb-4">
                  <div className="relative">
                    <svg className="w-24 h-24 transform -rotate-90">
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        stroke={isDark ? '#374151' : '#e5e7eb'}
                        strokeWidth="8"
                        fill="none"
                      />
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        stroke={(() => {
                          const totalScore = Math.round((brandCheckResult.overallScore + culturalScore) / 2);
                          return totalScore >= 80 ? '#22c55e' : totalScore >= 60 ? '#eab308' : '#ef4444';
                        })()}
                        strokeWidth="8"
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={`${Math.round((brandCheckResult.overallScore + culturalScore) / 2) * 2.51}, 251`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className={`text-2xl font-bold ${(() => {
                        const totalScore = Math.round((brandCheckResult.overallScore + culturalScore) / 2);
                        return totalScore >= 80 ? 'text-green-500' : totalScore >= 60 ? 'text-yellow-500' : 'text-red-500';
                      })()}`}>
                        {Math.round((brandCheckResult.overallScore + culturalScore) / 2)}
                      </span>
                      <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>综合分</span>
                    </div>
                  </div>
                </div>

                {/* 分项得分 */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      <i className="fas fa-shield-alt text-blue-500 mr-1"></i>
                      品牌一致性
                    </span>
                    <span className={`text-sm font-medium ${brandCheckResult.overallScore >= 80 ? 'text-green-500' : brandCheckResult.overallScore >= 60 ? 'text-yellow-500' : 'text-red-500'}`}>
                      {brandCheckResult.overallScore}分
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                    <div
                      className={`h-2 rounded-full ${brandCheckResult.overallScore >= 80 ? 'bg-green-500' : brandCheckResult.overallScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${brandCheckResult.overallScore}%` }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      <i className="fas fa-landmark text-amber-500 mr-1"></i>
                      文化纯正度
                    </span>
                    <span className={`text-sm font-medium ${culturalScore >= 80 ? 'text-green-500' : culturalScore >= 60 ? 'text-yellow-500' : 'text-red-500'}`}>
                      {culturalScore}分
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                    <div
                      className={`h-2 rounded-full ${culturalScore >= 80 ? 'bg-green-500' : culturalScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${culturalScore}%` }}
                    ></div>
                  </div>
                </div>

                {/* 检查详情 */}
                <div className="space-y-2 mb-4">
                  {brandCheckResult.items.map((item, index) => (
                    <div
                      key={index}
                      className={`flex items-start gap-2 p-2 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}
                    >
                      <span className={`mt-0.5 ${item.status === 'pass' ? 'text-green-500' : item.status === 'warn' ? 'text-yellow-500' : 'text-red-500'}`}>
                        <i className={`fas ${item.status === 'pass' ? 'fa-check-circle' : item.status === 'warn' ? 'fa-exclamation-circle' : 'fa-times-circle'}`}></i>
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                          {item.item}
                        </p>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {item.message}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 改进建议 */}
                {brandCheckResult.suggestions.length > 0 && (
                  <div className={`p-3 rounded-lg ${isDark ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'}`}>
                    <h4 className={`text-sm font-medium mb-2 ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                      <i className="fas fa-lightbulb mr-1"></i>
                      改进建议
                    </h4>
                    <ul className="space-y-1">
                      {brandCheckResult.suggestions.slice(0, 3).map((suggestion, index) => (
                        <li key={index} className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'} flex items-start gap-1`}>
                          <span className="text-blue-500 mt-0.5">•</span>
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 重新检查按钮 */}
                <button
                  onClick={() => performBrandCheck(formData)}
                  disabled={isCheckingBrand}
                  className={`w-full mt-4 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                    isCheckingBrand
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : isDark
                        ? 'bg-gray-700 hover:bg-gray-600 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {isCheckingBrand ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      检查中...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-redo mr-2"></i>
                      重新检查
                    </>
                  )}
                </button>
              </motion.div>
            )}

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
