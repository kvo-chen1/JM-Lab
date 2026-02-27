import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { motion, AnimatePresence } from 'framer-motion';
import BRANDS from '@/lib/brands';
import { useWorkflow } from '@/contexts/workflowContext';
import voiceService from '@/services/voiceService';
import UploadBox from '@/components/UploadBox';
import { scoreAuthenticity } from '@/services/authenticityService';
import { contentScoringService } from '@/services/contentScoringService';
import postService from '@/services/postService';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { llmService } from '@/services/llmService';
import { aiGenerationSaveService } from '@/services/aiGenerationSaveService';
import { TianjinImage, TianjinButton, YangliuqingCard } from '@/components/TianjinStyleComponents';
import AISuggestionBox from '@/components/AISuggestionBox';
import { toast } from 'sonner';
import { ExternalLink, AlertCircle } from 'lucide-react';
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";

import { 
  TEMPLATES, 
  COMPETITIONS, 
  CREATIVE_TEMPLATES, 
  BRAND_FONTS,
  EXTENDED_TEMPLATES
} from '@/constants/creativeData';
import { StepIndicator, BrandCard3D, TemplateGallery, RadarChart } from '@/components/wizard';
import { brandService } from '@/services/brandService';
import { eventService as supabaseEventService } from '@/services/eventService';
import { eventParticipationService } from '@/services/eventParticipationService';
import { eventSubmissionService } from '@/services/eventSubmissionService';
import { useEventService } from '@/hooks/useEventService';
import { supabase } from '@/lib/supabase';
import { uploadBase64Image, generateFilePath } from '@/services/supabaseStorageService';
import { userStateService } from '@/services/userStateService';
import { brandConsistencyService, BrandConsistencyResult } from '@/services/brandConsistencyService';
import { brandCheckShareService } from '@/services/brandCheckShareService';
import ShareSelector from '@/components/ShareSelector';

// Load persisted step from localStorage
const loadPersistedStep = (): number => {
  if (typeof localStorage === 'undefined') return 1;
  try {
    const saved = localStorage.getItem('workflow_current_step');
    return saved ? parseInt(saved, 10) || 1 : 1;
  } catch (e) {
    return 1;
  }
};

export default function Wizard() {
  const { isDark } = useTheme();
  const { state, setState, reset, saveToDrafts, loadFromDraft, isDirty, lastSavedAt } = useWorkflow();
  const [step, setStep] = useState(loadPersistedStep());
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isSaving, setIsSaving] = useState(false);
  const [aiText, setAiText] = useState('');
  const [aiDirections, setAiDirections] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [culturalElements, setCulturalElements] = useState<string[]>([]);
  const [previewRatio, setPreviewRatio] = useState<'landscape' | 'square' | 'portrait'>('landscape');
  
  // 草稿恢复提示状态
  const [showDraftRestorePrompt, setShowDraftRestorePrompt] = useState(false);
  const [restoredDraftInfo, setRestoredDraftInfo] = useState<{from: 'url' | 'local' | null, draftId?: string}>({ from: null });
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'food' | 'craft' | 'daily' | 'tianjin'>('all');
  
  // New States for enhanced features
  const [brandAssets, setBrandAssets] = useState({
    logo: '',
    colors: ['#D32F2F', '#FFC107', '#212121'],
    font: 'SimSun',
  });
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [selectedVariantIndex, setSelectedVariantIndex] = useState<number>(-1);
  const [publishInfo, setPublishInfo] = useState({
    title: '',
    description: '',
    competitionId: '',
    tags: '',
  });
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [isImportingToCreate, setIsImportingToCreate] = useState(false);
  const [isConsistencyChecking, setIsConsistencyChecking] = useState(false);
  const [consistencyScore, setConsistencyScore] = useState<number | null>(null);
  const [consistencyDetails, setConsistencyDetails] = useState<{item: string; status: 'pass' | 'warn' | 'fail'; message: string}[]>([]);
  const [consistencySuggestions, setConsistencySuggestions] = useState<string[]>([]);
  const [culturalScore, setCulturalScore] = useState<number>(0);
  const [isGeneratingVariants, setIsGeneratingVariants] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [newColor, setNewColor] = useState('#000000');
  const [events, setEvents] = useState<Array<{
    id: string;
    title: string;
    desc: string;
    deadline: string;
    organizer: string;
    prize: string;
    status: 'ongoing' | 'upcoming' | 'ended';
    category: string;
  }>>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  
  // 确认报名对话框状态
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<typeof events[0] | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  
  // 使用 API 获取活动数据
  const { getEvents } = useEventService();
  
  // 模板详情弹窗状态
  const [selectedTemplateDetail, setSelectedTemplateDetail] = useState<typeof CREATIVE_TEMPLATES[0] | null>(null);
  
  // 分享弹窗状态
  const [showShareSelector, setShowShareSelector] = useState(false);
  const [shareData, setShareData] = useState<{
    type: 'work' | 'activity' | 'post';
    id: string;
    title: string;
    description?: string;
    thumbnail?: string;
    videoUrl?: string;
    url: string;
    author?: {
      name: string;
      avatar?: string;
    };
  } | null>(null);
  const [shareUserInfo, setShareUserInfo] = useState<{
    userId: string;
    userName: string;
    userAvatar?: string;
  } | null>(null);

  // Load events from API (使用与津脉活动页面相同的数据源)
  useEffect(() => {
    const loadEvents = async () => {
      setIsLoadingEvents(true);
      try {
        const apiEvents = await getEvents();
        // 转换 API 返回的数据格式以匹配组件需要
        // 只显示已发布且正在进行中的活动
        const formattedEvents = apiEvents
          .filter(event => {
            // 只显示已发布的活动
            if (event.status !== 'published') return false;
            
            // 只显示正在进行中的活动（未结束）
            const now = Date.now();
            const endTime = event.endTime ? new Date(event.endTime).getTime() : 0;
            return now <= endTime;
          })
          .map(event => ({
            id: event.id,
            title: event.title,
            desc: event.description || '',
            deadline: event.endTime ? event.endTime.split('T')[0] : '',
            organizer: event.organizer?.name || '津脉平台',
            prize: '丰厚奖品', // API 返回的数据中没有 prize 字段，使用默认值
            status: (() => {
              const now = Date.now();
              const endTime = event.endTime ? new Date(event.endTime).getTime() : 0;
              const startTime = event.startTime ? new Date(event.startTime).getTime() : 0;
              if (now > endTime) return 'ended' as const;
              if (now < startTime) return 'upcoming' as const;
              return 'ongoing' as const;
            })(),
            category: event.category || '创意活动'
          }));
        setEvents(formattedEvents.length > 0 ? formattedEvents : COMPETITIONS);
      } catch (error) {
        console.error('Failed to load events:', error);
        setEvents(COMPETITIONS);
      } finally {
        setIsLoadingEvents(false);
      }
    };
    loadEvents();
  }, [getEvents]);

  // 自动计算文化纯正度评分
  useEffect(() => {
    const scores = contentScoringService.calculateScores(state.inputText || '');
    setCulturalScore(scores.authenticity_score);
    setCulturalElements(scores.cultural_elements);
  }, [state.inputText]);

  const next = () => {
    const newStep = Math.min(6, step + 1);
    setStep(newStep);
    // Persist step to localStorage
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('workflow_current_step', String(newStep));
      } catch (e) {
        console.error('Failed to persist step:', e);
      }
    }
  };

  const prev = () => {
    const newStep = Math.max(1, step - 1);
    setStep(newStep);
    // Persist step to localStorage
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('workflow_current_step', String(newStep));
      } catch (e) {
        console.error('Failed to persist step:', e);
      }
    }
  };

  // Persist step whenever it changes
  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('workflow_current_step', String(step));
      } catch (e) {
        console.error('Failed to persist step:', e);
      }
    }
    
    // 保存工作流进度到数据库
    userStateService.saveWorkflowProgress(
      'brand-creation',
      step,
      6,
      {
        brandName: state.brandName,
        inputText: state.inputText,
        selectedTemplate: state.selectedTemplate,
        selectedCompetition: state.selectedCompetition,
        variants: state.variants?.length || 0
      },
      step === 6
    ).catch(err => {
      console.error('[Wizard] Failed to save workflow progress:', err);
    });
  }, [step, state]);

  // Load draft from URL parameter or restore from localStorage
  useEffect(() => {
    const draftId = searchParams.get('draft');
    if (draftId) {
      loadFromDraft(draftId).then(success => {
        if (success) {
          setRestoredDraftInfo({ from: 'url', draftId });
          setShowDraftRestorePrompt(true);
          // Restore step from draft
          const loadedStep = state.currentStep || 1;
          setStep(loadedStep);
        } else {
          toast.error('加载草稿失败');
        }
      });
    } else {
      // 检查是否有本地持久化的状态
      const hasPersistedState = state.brandName || state.variants?.length || state.inputText;
      if (hasPersistedState && !searchParams.get('new')) {
        setRestoredDraftInfo({ from: 'local' });
        setShowDraftRestorePrompt(true);
      }
    }
  }, [searchParams]);

  // Restore step from persisted state when component mounts
  useEffect(() => {
    // Check if there's persisted state and restore step accordingly
    const hasPersistedState = state.brandName || state.variants?.length || state.inputText;
    if (hasPersistedState) {
      // Restore step from persisted state if available
      const persistedStep = state.currentStep || loadPersistedStep();
      setStep(persistedStep);

      // 如果有变体数据但没有选中的变体，默认选择第一个
      if (state.variants?.length && selectedVariantIndex < 0) {
        setSelectedVariantIndex(0);
      }
    }
  }, [state.brandName, state.variants, state.inputText, state.currentStep, selectedVariantIndex]);

  // 放弃草稿，重新开始
  const handleDiscardDraft = () => {
    reset();
    setStep(1);
    setShowDraftRestorePrompt(false);
    // 清除URL中的draft参数
    if (searchParams.get('draft')) {
      navigate('/wizard?new=true', { replace: true });
    }
    toast.info('已重新开始，之前的草稿仍可在草稿箱中找到');
  };

  // 继续编辑草稿
  const handleContinueDraft = () => {
    setShowDraftRestorePrompt(false);
    toast.success(`已恢复${restoredDraftInfo.from === 'url' ? '草稿' : '上次编辑状态'}，继续创作吧！`);
  };

  // Handle manual save to drafts
  const handleSaveToDrafts = async () => {
    if (!state.brandName) {
      toast.error('请先选择品牌');
      return;
    }
    
    setIsSaving(true);
    try {
      const draft = await saveToDrafts(step);
      if (draft) {
        toast.success('已保存到草稿箱');
      } else {
        toast.error('保存失败');
      }
    } catch (error) {
      toast.error('保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  // Format last saved time
  const formatLastSaved = () => {
    if (!lastSavedAt) return '';
    const date = new Date(lastSavedAt);
    return `上次保存: ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
  };

  // Filter brands based on search and category
  const filteredBrands = useMemo(() => {
    let brands = BRANDS;
    if (selectedCategory !== 'all') {
      const categoryMap: Record<string, string[]> = {
        food: ['guifaxiang', 'erduoyan', 'guorenzhang', 'goubuli', 'longshunyu', 'hongshunde', 'daoxiangcun', 'quanjude', 'liubiju', 'wangzhihe', 'guangzhoujiujia', 'lianxianglou', 'xinghualou', 'qiaojiashan', 'guanshengyuan', 'dezhoupaji'],
        craft: ['nirenzhang', 'zhangxiaoqian', 'wangmazi', 'hudiepai', 'ruifuxiang', 'qianxiangyi'],
        daily: ['laomeihua', 'seagullwatch', 'huili', 'feiyue', 'shanghaiwatch', 'fenghuangbike', 'yongjiubike', 'yingxiong', 'zhonghuapencil', 'yongshengpen', 'hengdeli', 'pechoin'],
        tianjin: BRANDS.filter(b => b.id.startsWith('tianjin') || ['guifaxiang', 'erduoyan', 'guorenzhang', 'nirenzhang', 'goubuli', 'laomeihua', 'seagullwatch', 'qianxiangyi', 'longshunyu', 'hongshunde'].includes(b.id)).map(b => b.id),
      };
      brands = brands.filter(b => categoryMap[selectedCategory]?.includes(b.id));
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      brands = brands.filter(b => 
        b.name.toLowerCase().includes(query) || 
        b.story.toLowerCase().includes(query)
      );
    }
    return brands;
  }, [searchQuery, selectedCategory]);

  // 获取当前选中的变体图片
  const selectedVariantImage = useMemo(() => {
    if (selectedVariantIndex >= 0 && state.variants && state.variants[selectedVariantIndex]) {
      return state.variants[selectedVariantIndex].image;
    }
    return state.imageUrl || '';
  }, [selectedVariantIndex, state.variants, state.imageUrl]);

  // AI分析图片并自动填写信息
  const analyzeImageWithAI = async () => {
    const imageUrl = selectedVariantImage;
    if (!imageUrl) {
      toast.error('请先生成或选择图片');
      return;
    }

    setIsAnalyzingImage(true);
    toast.info('AI正在分析图片内容...');

    try {
      // 将图片转换为 base64
      const base64Image = await imageUrlToBase64(imageUrl);
      if (!base64Image) {
        throw new Error('无法读取图片内容');
      }

      // 调用千问API分析图片
      const analysisResult = await analyzeImageWithQwen(base64Image);
      
      if (analysisResult) {
        // 更新表单
        setPublishInfo(prev => ({
          ...prev,
          title: analysisResult.title || prev.title,
          description: analysisResult.description || prev.description,
          tags: analysisResult.tags || prev.tags,
        }));
        
        toast.success('AI分析完成，已自动填写信息！');
      }
    } catch (error: any) {
      console.error('AI分析失败:', error);
      toast.error(`AI分析失败: ${error.message}`);
    } finally {
      setIsAnalyzingImage(false);
    }
  };

  // 调用千问API分析图片
  const analyzeImageWithQwen = async (base64Image: string): Promise<{title: string; description: string; tags: string} | null> => {
    try {
      const prompt = `请分析这张设计图片，并提供以下信息（用JSON格式返回）：
{
  "title": "作品标题，简洁有创意，20字以内",
  "description": "作品描述，包含设计理念、创意灵感、视觉元素等，100-200字",
  "tags": "标签，用逗号分隔，包含风格、主题、元素等关键词，如：国潮,端午,绿色,传统文化,包装设计"
}

要求：
1. 根据图片内容准确描述
2. 标题要吸引人
3. 描述要专业且有感染力
4. 标签要准确反映图片特点
5. 只返回JSON格式，不要有其他文字`;

      // 构建消息，包含图片（千问VL格式）
      const messages = [
        {
          role: 'system',
          content: '你是一个专业的设计师助手，擅长分析设计作品并提供专业的描述。'
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: base64Image } }
          ]
        }
      ];

      // 直接调用千问API（支持多模态）
      const response = await fetch('/api/qwen/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'qwen-vl-max',
          messages,
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API请求失败: ${response.status}`);
      }

      const data = await response.json();
      const responseData = data.ok ? data.data : data;
      const finalData = responseData.data || responseData;
      const aiResponse = finalData.output?.text || finalData.choices?.[0]?.message?.content || '';

      // 解析JSON响应
      try {
        // 尝试提取JSON
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const result = JSON.parse(jsonMatch[0]);
          return {
            title: result.title || '',
            description: result.description || '',
            tags: result.tags || '',
          };
        }
      } catch (parseError) {
        console.error('解析AI响应失败:', parseError);
        // 如果JSON解析失败，尝试手动提取
        const lines: string[] = aiResponse.split('\n').filter((line: string) => line.trim());
        const title = lines.find((l: string) => l.includes('标题') || l.includes('title'))?.split(/[:：]/)[1]?.trim() || '';
        const description = lines.find((l: string) => l.includes('描述') || l.includes('description'))?.split(/[:：]/)[1]?.trim() || '';
        const tags = lines.find((l: string) => l.includes('标签') || l.includes('tags'))?.split(/[:：]/)[1]?.trim() || '';
        
        if (title || description || tags) {
          return { title, description, tags };
        }
      }

      return null;
    } catch (error: any) {
      console.error('调用千问API失败:', error);
      throw error;
    }
  };

  // 将外部图片 URL 转换为 Base64
  const imageUrlToBase64 = async (url: string): Promise<string | null> => {
    try {
      // 优先使用后端代理下载图片（解决CORS问题）
      console.log('[Wizard] Downloading image via proxy:', url.substring(0, 100));
      const proxyResponse = await fetch('/api/image/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl: url }),
      });

      if (proxyResponse.ok) {
        const result = await proxyResponse.json();
        if (result.code === 0 && result.data?.base64) {
          console.log('[Wizard] Image downloaded via proxy, size:', (result.data.size / 1024).toFixed(2), 'KB');
          return result.data.base64;
        }
      }

      // 如果代理失败，尝试直接获取（可能适用于同源图片）
      console.warn('[Wizard] Proxy download failed, trying direct fetch...');
      const response = await fetch(url, {
        mode: 'cors',
        cache: 'no-cache',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }

      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('[Wizard] Failed to convert image to base64:', error);
      return null;
    }
  };

  // 上传图片到 Supabase Storage
  const uploadImageToStorage = async (imageUrl: string): Promise<string | null> => {
    if (!imageUrl) return null;
    
    // 如果已经是 Supabase Storage 的 URL，直接返回
    if (imageUrl.includes('supabase.co') || imageUrl.includes('supabase.in')) {
      return imageUrl;
    }
    
    setIsUploadingImage(true);
    toast.info('正在上传图片到存储...');
    
    try {
      // 获取当前用户ID
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || JSON.parse(localStorage.getItem('user') || '{}')?.id;
      
      if (!userId) {
        toast.error('请先登录后再上传图片');
        return imageUrl;
      }
      
      // 将图片 URL 转换为 Base64
      const base64Image = await imageUrlToBase64(imageUrl);
      if (!base64Image) {
        // 如果转换失败，返回原始 URL
        console.warn('[Wizard] Failed to convert image to base64, using original URL');
        toast.info('图片转换失败，将使用原始链接发布');
        return imageUrl;
      }
      
      // 生成文件路径
      const fileName = `wizard-${Date.now()}.png`;
      const filePath = `${userId}/${fileName}`;
      
      // 上传到 Supabase Storage
      const { url, error } = await uploadBase64Image(base64Image, filePath);
      
      if (error) {
        console.error('[Wizard] Failed to upload image:', error);
        // 检查是否是 RLS 策略错误
        if (error.includes('row-level security') || error.includes('violates row-level security')) {
          toast.info('存储权限限制，将使用原始链接发布');
        } else {
          toast.info('图片上传失败，将使用原始链接发布');
        }
        return imageUrl;
      }
      
      toast.success('图片上传成功！');
      return url;
    } catch (error: any) {
      console.error('[Wizard] Upload error:', error);
      // 检查是否是 RLS 策略错误
      if (error.message?.includes('row-level security') || error.message?.includes('violates row-level security')) {
        toast.info('存储权限限制，将使用原始链接发布');
      } else {
        toast.info('图片上传失败，将使用原始链接发布');
      }
      return imageUrl;
    } finally {
      setIsUploadingImage(false);
    }
  };

  // 准备发布 - 上传图片并显示预览
  const preparePublish = async () => {
    const selectedVariant = selectedVariantIndex >= 0 && state.variants ? state.variants[selectedVariantIndex] : state.variants?.[0];
    const imageUrl = selectedVariant?.image || state.imageUrl || '';
    
    if (!imageUrl) {
      toast.error('请先生成或上传图片');
      return;
    }
    
    // 上传图片到存储
    const uploadedUrl = await uploadImageToStorage(imageUrl);
    if (uploadedUrl) {
      setUploadedImageUrl(uploadedUrl);
      setShowImagePreview(true);
    }
  };

  const savePost = async () => {
    const title = publishInfo.title || `${state.brandName || '作品'} - 生成变体`;
    const thumb = uploadedImageUrl || (() => {
      const selectedVariant = selectedVariantIndex >= 0 && state.variants ? state.variants[selectedVariantIndex] : state.variants?.[0];
      return selectedVariant?.image || state.imageUrl || '';
    })();

    try {
      // 0. 先保存到草稿箱（自动保存创作记录）
      const draft = await saveToDrafts(6);
      if (draft) {
        console.log('[savePost] 已自动保存到草稿箱:', draft.id);
      }

      // 1. 首先创建作品
      const post = await postService.addPost({
        title,
        thumbnail: thumb,
        category: 'design',
        tags: publishInfo.tags.split(',').filter(Boolean),
        description: publishInfo.description,
        creativeDirection: selectedTemplate,
        culturalElements: culturalElements,
        colorScheme: brandAssets.colors,
        toolsUsed: ['Wizard', 'AI']
      });

      // 2. 如果选择了比赛，提交作品到比赛
      if (publishInfo.competitionId && post?.id) {
        await submitToCompetition(post.id, title, thumb);
      }

      // 3. 发布成功后，不重置状态，让用户可以继续查看或重新创作
      setShowImagePreview(false);
      
      toast.success(
        <div className="flex flex-col gap-2 min-w-[280px]">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-emerald-700">作品发布成功</span>
            </div>
            <button
              onClick={() => navigate('/square')}
              className="text-xs px-2.5 py-1 rounded-full bg-gradient-to-r from-[#C02C38] to-[#D64545] text-white hover:shadow-md hover:scale-105 transition-all duration-200 flex items-center gap-1 font-medium whitespace-nowrap"
            >
              <ExternalLink className="w-3 h-3" />
              去广场查看
            </button>
          </div>
          <div className="text-xs text-gray-500">
            创作记录已自动保存到草稿箱
          </div>
        </div>,
        {
          duration: 5000,
          className: 'bg-emerald-50 border-emerald-200 !py-2 !px-3'
        }
      );
    } catch (error: any) {
      console.error('发布作品失败:', error);
      toast.error(error.message || '发布作品失败，请重试');
    }
  };

  // 提交作品到比赛
  const submitToCompetition = async (workId: string, title: string, thumbnail: string) => {
    const eventId = publishInfo.competitionId;
    if (!eventId) return;

    try {
      // 获取当前用户ID
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;

      if (!userId) {
        // 尝试从 localStorage 获取用户ID
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const userData = JSON.parse(userStr);
          if (userData?.id) {
            console.log('[submitToCompetition] Using user ID from localStorage:', userData.id);
          } else {
            toast.error('请先登录后再参加比赛');
            return;
          }
        } else {
          toast.error('请先登录后再参加比赛');
          return;
        }
      }

      const effectiveUserId = user?.id || JSON.parse(localStorage.getItem('user') || '{}')?.id;

      // 检查用户是否已报名该活动
      const { isParticipated, participationId: existingParticipationId } = 
        await eventParticipationService.checkParticipation(eventId, effectiveUserId);

      let participationId = existingParticipationId;

      // 如果未报名，先报名
      if (!isParticipated) {
        toast.info('正在为您报名活动...');
        const registerResult = await eventParticipationService.registerForEvent(eventId, effectiveUserId);
        if (!registerResult.success) {
          toast.error(`报名失败: ${registerResult.error}`);
          return;
        }
        participationId = registerResult.participationId;
        toast.success('报名成功！');
      }

      if (!participationId) {
        toast.error('无法获取参与记录ID');
        return;
      }

      // 提交作品到比赛
      toast.info('正在提交作品到比赛...');
      
      // 构建提交文件数据
      const submissionFiles = [{
        id: workId,
        name: `${title}.png`,
        url: thumbnail,
        type: 'image/png',
        size: 0,
        thumbnailUrl: thumbnail
      }];

      const submissionResult = await eventSubmissionService.submitWork(
        eventId,
        effectiveUserId,
        participationId,
        {
          title: title,
          description: publishInfo.description || `${state.brandName || '品牌'} 创意设计方案`,
          files: submissionFiles,
          metadata: {
            workId: workId,
            brandName: state.brandName,
            creativeDirection: selectedTemplate,
            culturalElements: culturalElements,
            colorScheme: brandAssets.colors,
            toolsUsed: ['Wizard', 'AI']
          }
        }
      );

      if (submissionResult.success) {
        const eventTitle = events.find(e => e.id === eventId)?.title || '比赛';
        toast.success(`作品已成功提交到「${eventTitle}」！`);
      } else {
        toast.error(`提交失败: ${submissionResult.error}`);
      }
    } catch (error: any) {
      console.error('提交到比赛失败:', error);
      toast.error(`提交到比赛失败: ${error.message}`);
    }
  };

  const runAIHelp = async () => {
    const userInput = (state.inputText?.trim()) || '';
    
    // 输入验证：检查输入是否足够完整
    if (userInput.length < 4) {
      toast.error('请输入更详细的描述（至少4个字），以便AI为您提供更好的创意建议');
      return;
    }
    
    // 构建增强的提示词
    const brandName = state.brandName || '品牌';
    const base = userInput || `${brandName} 创意方向与文案`;
    
    setIsGenerating(true);
    setAiText('');
    
    // 创建中止控制器用于超时处理
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15秒超时
    
    try {
      const dirs = llmService.generateCreativeDirections(base);
      setAiDirections(dirs);
      const elems = llmService.recommendCulturalElements(base);
      setCulturalElements(elems);

      // 构建结构化的AI提示词 - 简化版以提高响应速度
      const structuredPrompt = `请为"${brandName}"品牌创作提供创意建议：${base}

请简洁回答以下4点（每点2-3句话）：
1. 视觉风格建议
2. 核心创意概念  
3. 色彩与元素推荐
4. 2-3条文案参考

要求：结合传统文化与现代设计，突出品牌特色，用中文分点回答。`;
      
      try {
        console.log('[Wizard] Starting AI help generation...');
        // 使用 directGenerateResponse 绕过任务队列，直接调用API
        await llmService.directGenerateResponse(structuredPrompt, { 
          onDelta: (chunk: string) => setAiText(prev => prev + chunk),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        console.log('[Wizard] AI help generation completed');
      } catch (err) {
        clearTimeout(timeoutId);
        console.warn('LLM generation failed, falling back to mock:', err);
        
        // 使用模拟数据作为后备
        const mockResponse = `基于"${base}"，为您提供以下创意建议：

1. 视觉风格：建议采用新中式国潮风格，将传统${elems[0] || '纹样'}与现代极简线条结合，营造既有文化底蕴又具现代感的视觉效果。

2. 核心意象：可以提取${brandName !== '品牌' ? brandName.substring(0, 2) : '传统'}元素进行符号化重构，创造独特的品牌视觉符号。

3. 色彩搭配：推荐使用朱红与钛白的撞色搭配，点缀少量金色提升质感，体现东方美学的典雅与精致。

4. 文案方向：
   - "传承百年匠心，重塑东方美学"
   - "让传统活在当下，让文化走向世界"
   - "古韵新声，品味非凡"`;
        
        // 快速显示模拟响应（减少打字效果延迟）
        setAiText(mockResponse);
      }
    } catch (e) {
      clearTimeout(timeoutId);
      console.error('AI Help Error:', e);
      toast.error('AI 创意助理暂时无法连接，请稍后再试');
    }
    setIsGenerating(false);
  };

  const generateVariants = async () => {
    const template = TEMPLATES.find(t => t.id === selectedTemplate);
    const templateStyle = template?.style || '';
    const templateTitle = template?.title || '';

    // 构建基础prompt：创意描述 + 设计模板风格
    const basePrompt = `${(state.inputText || '').trim()} ${templateStyle}`.trim() || 'Tianjin cultural design';

    setIsGeneratingVariants(true);
    setGenerationProgress(0);

    // 根据设计模板类型生成不同的变体风格
    const getVariantStyles = (designTemplateTitle: string) => {
      switch (designTemplateTitle) {
        case '节日促销海报':
          return [
            { name: '喜庆红金', promptSuffix: 'festive red and gold color scheme, celebration atmosphere, promotional poster style, vibrant, eye-catching' },
            { name: '传统纹样', promptSuffix: 'traditional chinese patterns, paper-cut art style, folk art, cultural heritage' },
            { name: '现代节庆', promptSuffix: 'modern festival design, clean layout, bold typography, contemporary celebration style' }
          ];
        case '极简产品包装':
          return [
            { name: '纯净留白', promptSuffix: 'minimalist white space, clean background, elegant simplicity, premium packaging' },
            { name: '材质质感', promptSuffix: 'texture focus, natural materials, tactile quality, sophisticated packaging' },
            { name: '几何极简', promptSuffix: 'geometric minimalism, bold shapes, monochrome palette, modern packaging' }
          ];
        case '社交媒体封面':
          return [
            { name: '潮流 bold', promptSuffix: 'trendy bold design, vibrant colors, social media optimized, high engagement' },
            { name: '信息图表', promptSuffix: 'infographic style, data visualization, informative layout, professional' },
            { name: '品牌展示', promptSuffix: 'brand showcase, logo prominent, brand identity, corporate style' }
          ];
        case '国潮插画KV':
          return [
            { name: '工笔精细', promptSuffix: 'gongbi style, fine brushwork, detailed illustration, traditional chinese painting' },
            { name: '水墨写意', promptSuffix: 'ink wash painting, xieyi style, expressive brushstrokes, artistic' },
            { name: '新国潮风', promptSuffix: 'neo-chinese style, modern illustration, cultural fusion, trendy guochao' }
          ];
        default:
          return [
            { name: '经典传承', promptSuffix: 'classic traditional chinese style, elegant, heritage' },
            { name: '现代融合', promptSuffix: 'modern minimalist mixed with traditional elements, clean, bold' },
            { name: '未来探索', promptSuffix: 'futuristic cyberpunk style, neon lights, traditional patterns, 8k' }
          ];
      }
    };

    const styles = getVariantStyles(templateTitle);

    const placeholders = styles.map((style, index) => ({
      script: `方案${String.fromCharCode(65 + index)}：${style.name}`,
      image: '',
      loading: true
    }));
    setState({ variants: placeholders });

    try {
      const newVariants = await Promise.all(styles.map(async (style, index) => {
        setGenerationProgress((index + 1) * 30);
        console.log(`[Wizard] Generating image for ${templateTitle} - ${style.name}, prompt: ${basePrompt} ${style.promptSuffix}`);

        const response = await llmService.generateImage({
          prompt: `${basePrompt} ${style.promptSuffix}`,
          size: '1024x1024',
          n: 1
        });

        console.log(`[Wizard] Image generation response for ${style.name}:`, response);

        // 检查响应是否成功
        let imageUrl: string;
        if (response.ok && response.data?.data?.[0]?.url) {
          imageUrl = response.data.data[0].url;
          console.log(`[Wizard] Successfully got image URL for ${style.name}:`, imageUrl);
        } else {
          console.warn(`[Wizard] Failed to get image URL for ${style.name}, using fallback`);
          imageUrl = `https://images.unsplash.com/photo-${index === 0 ? '1535139262971-c51845709a48' : index === 1 ? '1550684848-fac1c5b4e853' : '1515630278258-407f66498911'}?w=800&q=80`;
        }

        return {
          script: `方案${String.fromCharCode(65 + index)}：${style.name}`,
          image: imageUrl,
          video: ''
        };
      }));

      setState({ variants: newVariants });
      setGenerationProgress(100);
      toast.success('创意方案生成完成！');
      
      // 保存所有生成的方案到数据库
      for (const variant of newVariants) {
        if (variant.image && !variant.image.includes('unsplash.com')) {
          await aiGenerationSaveService.saveImageGeneration(
            `${basePrompt} ${variant.script}`,
            variant.image,
            {
              source: 'wizard',
              metadata: {
                template: templateTitle,
                style: variant.script,
                size: '1024x1024'
              }
            }
          );
        }
      }
    } catch (error) {
      console.error('[Wizard] Image generation failed:', error);
      toast.error('生成图片失败，已加载示例图片');
      setState({ variants: [
        { script: '方案A：经典传承', image: 'https://images.unsplash.com/photo-1535139262971-c51845709a48?w=800&q=80', video: '' },
        { script: '方案B：现代融合', image: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800&q=80', video: '' },
        { script: '方案C：未来探索', image: 'https://images.unsplash.com/photo-1515630278258-407f66498911?w=800&q=80', video: '' },
      ] });
    } finally {
      setIsGeneratingVariants(false);
    }
  };

  const runConsistencyCheck = async () => {
    setIsConsistencyChecking(true);
    
    try {
      // 获取当前选中的变体图像
      const selectedVariant = selectedVariantIndex >= 0 && state.variants 
        ? state.variants[selectedVariantIndex] 
        : null;
      const imageUrl = selectedVariant?.image || uploadedImageUrl || '';
      
      // 并行执行品牌一致性检测和文化评分计算
      const [brandResult, culturalScores] = await Promise.all([
        brandConsistencyService.checkConsistency({
          brandAssets: {
            logo: brandAssets.logo,
            colors: brandAssets.colors,
            font: brandAssets.font
          },
          imageUrl: imageUrl || undefined,
          textContent: state.inputText || undefined
        }),
        Promise.resolve(contentScoringService.calculateScores(state.inputText || ''))
      ]);
      
      // 更新品牌一致性状态
      setConsistencyScore(brandResult.overallScore);
      setConsistencyDetails(brandResult.items.map(item => ({
        item: item.item,
        status: item.status,
        message: item.message
      })));
      setConsistencySuggestions(brandResult.suggestions);
      
      // 更新文化纯正度评分状态
      setCulturalScore(culturalScores.authenticity_score);
      setCulturalElements(culturalScores.cultural_elements);
      
      // 显示成功提示
      const totalScore = Math.round((brandResult.overallScore + culturalScores.authenticity_score) / 2);
      if (totalScore >= 80) {
        toast.success(`检查完成！品牌一致性: ${brandResult.overallScore}分，文化纯正度: ${culturalScores.authenticity_score}分`);
      } else if (totalScore >= 60) {
        toast.success(`检查完成！品牌一致性: ${brandResult.overallScore}分，文化纯正度: ${culturalScores.authenticity_score}分，还有提升空间`);
      } else {
        toast.warning(`检查完成！品牌一致性: ${brandResult.overallScore}分，文化纯正度: ${culturalScores.authenticity_score}分，建议优化`);
      }
    } catch (error) {
      console.error('检查失败:', error);
      toast.error('检查失败，请稍后重试');
      
      // 使用默认数据作为回退
      setConsistencyScore(75);
      setConsistencyDetails([
        { item: 'Logo 完整性', status: 'warn', message: '检测服务暂时不可用' },
        { item: '品牌色使用', status: 'warn', message: '检测服务暂时不可用' },
        { item: '字体规范', status: 'warn', message: '检测服务暂时不可用' },
        { item: '文化元素', status: 'warn', message: '检测服务暂时不可用' },
      ]);
    } finally {
      setIsConsistencyChecking(false);
    }
  };

  const applyTemplate = (templateId: string) => {
    const template = CREATIVE_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      let content: string;

      // 如果有详细描述，使用详细版本
      if (template.detailDescription) {
        const dd = template.detailDescription;
        content = `【${template.name}模板】

设计理念：
${dd.designPhilosophy}

核心功能：
${dd.coreFeatures.map((f, i) => `${i + 1}. ${f}`).join('\n')}

适用场景：
${dd.applicableScenarios.map((s, i) => `${i + 1}. ${s}`).join('\n')}

视觉风格：
${dd.visualStyle}

使用方法：
${dd.usageSteps.map((step, i) => `${i + 1}. ${step}`).join('\n')}

预期效果：
${dd.expectedEffect}

---
基于以上信息，为${state.brandName || '品牌'}设计${template.name}风格的创意方案。`;
      } else {
        // 否则使用简短内容
        content = template.content.replace('${brand}', state.brandName || '品牌');
      }

      setState({ inputText: content });
      toast.success(`已应用「${template.name}」模板（详细版）`);
    }
  };

  // 应用设计模板（步骤3）
  const applyDesignTemplate = (templateId: string) => {
    const template = TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);

      // 如果有详细描述，追加到创意描述中
      if (template.detailDescription) {
        const dd = template.detailDescription;
        const designContent = `

【设计模板：${template.title}】

设计理念：
${dd.designPhilosophy}

核心功能：
${dd.coreFeatures.map((f, i) => `${i + 1}. ${f}`).join('\n')}

适用场景：
${dd.applicableScenarios.map((s, i) => `${i + 1}. ${s}`).join('\n')}

视觉风格：
${dd.visualStyle}

使用方法：
${dd.usageSteps.map((step, i) => `${i + 1}. ${step}`).join('\n')}

预期效果：
${dd.expectedEffect}

---
设计要求：采用${template.title}风格，${template.style}`;

        // 追加到现有创意描述
        const currentText = state.inputText || '';
        const newText = currentText + designContent;
        setState({ inputText: newText });
        toast.success(`已选择「${template.title}」设计模板并加载详细描述`);
      } else {
        toast.success(`已选择「${template.title}」设计模板`);
      }
    }
  };

  const addColor = () => {
    if (brandAssets.colors.length < 6) {
      setBrandAssets({...brandAssets, colors: [...brandAssets.colors, newColor]});
      setShowColorPicker(false);
    } else {
      toast.error('最多添加6个品牌色');
    }
  };

  const removeColor = (index: number) => {
    if (brandAssets.colors.length > 1) {
      setBrandAssets({...brandAssets, colors: brandAssets.colors.filter((_, i) => i !== index)});
    }
  };

  // Steps configuration
  const steps = [
    { id: 1, title: '查看历史', icon: 'fa-history', desc: '查看之前生成的内容' },
    { id: 2, title: '选择品牌', icon: 'fa-store', desc: '选择或输入品牌名称' },
    { id: 3, title: '创意输入', icon: 'fa-pen-nib', desc: '描述您的创意需求' },
    { id: 4, title: '生成变体', icon: 'fa-wand-magic-sparkles', desc: 'AI生成多种方案' },
    { id: 5, title: '方案选择', icon: 'fa-check-circle', desc: '选择并优化最终方案' },
    { id: 6, title: '评分发布', icon: 'fa-star', desc: '评估并发布作品' }
  ];

  // Record brand usage when brand is selected
  useEffect(() => {
    if (state.brandId && state.brandName) {
      const brand = BRANDS.find(b => b.id === state.brandId);
      if (brand) {
        brandService.recordBrandUsage(brand.id, brand.name, brand.image);
      }
    }
  }, [state.brandId, state.brandName]);

  const selectedBrand = useMemo(() => {
    return BRANDS.find(b => b.id === state.brandId || b.name === state.brandName);
  }, [state.brandId, state.brandName]);

  return (
    <main className={`min-h-screen ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'} pb-24`}>
      {/* 草稿恢复提示弹窗 */}
      <AnimatePresence>
        {showDraftRestorePrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}
            >
              {/* 头部 */}
              <div className={`p-6 ${isDark ? 'bg-gradient-to-br from-blue-900/30 to-purple-900/30' : 'bg-gradient-to-br from-blue-50 to-purple-50'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
                    <i className="fas fa-history text-xl"></i>
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {restoredDraftInfo.from === 'url' ? '发现未完成的草稿' : '恢复上次编辑状态'}
                    </h3>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {restoredDraftInfo.from === 'url' 
                        ? '您有之前保存的草稿，是否继续编辑？' 
                        : '检测到您上次未完成的创作，是否继续？'}
                    </p>
                  </div>
                </div>
              </div>

              {/* 内容 */}
              <div className="p-6 space-y-4">
                {/* 草稿信息 */}
                <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-red-500 flex items-center justify-center text-white">
                      <i className="fas fa-store"></i>
                    </div>
                    <div>
                      <div className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {state.brandName || '未命名品牌'}
                      </div>
                      <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        当前步骤: {step}/6 · {steps[step-1]?.title}
                      </div>
                    </div>
                  </div>

                  {/* 进度条 */}
                  <div className="mt-3">
                    <div className={`h-2 rounded-full ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                        style={{ width: `${(step / 6) * 100}%` }}
                      />
                    </div>
                    <div className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      完成进度: {Math.round((step / 6) * 100)}%
                    </div>
                  </div>

                  {/* 最后保存时间 */}
                  {lastSavedAt && (
                    <div className={`mt-3 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} flex items-center gap-1`}>
                      <i className="fas fa-clock"></i>
                      最后保存: {new Date(lastSavedAt).toLocaleString('zh-CN', { 
                        month: 'short', 
                        day: 'numeric', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  )}
                </div>

                {/* 提示信息 */}
                <div className={`p-3 rounded-lg text-xs ${isDark ? 'bg-amber-900/20 text-amber-300 border border-amber-800' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                  <i className="fas fa-info-circle mr-1"></i>
                  {restoredDraftInfo.from === 'url' 
                    ? '放弃草稿后，您仍可在草稿箱中找到它' 
                    : '放弃后当前进度将被保存为草稿，您可以随时从草稿箱恢复'}
                </div>

                {/* 按钮组 */}
                <div className="flex gap-3">
                  <TianjinButton
                    variant="secondary"
                    fullWidth
                    onClick={handleDiscardDraft}
                    leftIcon={<i className="fas fa-trash-alt"></i>}
                  >
                    放弃草稿
                  </TianjinButton>
                  <TianjinButton
                    primary
                    fullWidth
                    onClick={handleContinueDraft}
                    leftIcon={<i className="fas fa-play"></i>}
                  >
                    继续编辑
                  </TianjinButton>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header & Stepper */}
      <div className={`sticky top-0 z-20 ${isDark ? 'bg-gray-900/80' : 'bg-white/80'} backdrop-blur-md border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <motion.div
                className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 flex items-center justify-center text-white shadow-xl shadow-orange-500/30 ring-4 ring-white/20 dark:ring-gray-800/30"
                whileHover={{ scale: 1.05, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <i className="fas fa-hat-wizard text-xl"></i>
              </motion.div>
              <div className="flex flex-col justify-center pt-2">
                <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent leading-none">
                  品牌向导
                </h1>
                <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'} flex items-center gap-2 mt-1.5`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-amber-400 to-red-500 flex-shrink-0"></span>
                  AI驱动的品牌创意生成工具
                </p>
              </div>
            </div>
            
            {/* Stepper */}
            <StepIndicator steps={steps} currentStep={step} isDark={isDark} />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-8 max-w-7xl">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
              className="space-y-10"
            >
              {/* Header - 优化后的标题区域 */}
              <div className="text-center space-y-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1, duration: 0.5 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-200 dark:border-blue-800 mb-4"
                >
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">步骤 1/5</span>
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.5 }}
                  className="text-4xl sm:text-5xl font-bold tracking-tight"
                >
                  <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-600 dark:from-white dark:via-gray-200 dark:to-gray-400 bg-clip-text text-transparent">
                    查看历史创作
                  </span>
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className={`text-lg max-w-2xl mx-auto leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
                >
                  查看您之前生成的图片、模板和文字文案，或开始新的创作
                </motion.p>
              </div>

              {/* History Content */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.5 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-8"
              >
                {/* Left: Previous Generations */}
                <div className="space-y-6">
                  <h3 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    <i className="fas fa-images text-purple-500"></i>
                    之前生成的图片
                  </h3>
                  {state.variants && state.variants.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4">
                      {state.variants.map((variant, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.1 }}
                          className={`relative rounded-xl overflow-hidden border-2 ${
                            selectedVariantIndex === index
                              ? 'border-purple-500 ring-2 ring-purple-500/30'
                              : isDark ? 'border-gray-700' : 'border-gray-200'
                          } cursor-pointer group`}
                          onClick={() => {
                            setSelectedVariantIndex(index);
                            setState({ imageUrl: variant.image });
                          }}
                        >
                          <img
                            src={variant.image}
                            alt={`历史生成-${index}`}
                            className="w-full aspect-square object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="absolute bottom-3 left-3 right-3">
                              <p className="text-white text-sm font-medium truncate">{variant.script}</p>
                            </div>
                          </div>
                          {selectedVariantIndex === index && (
                            <div className="absolute top-2 right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                              <i className="fas fa-check text-white text-xs"></i>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  ) : state.imageUrl ? (
                    <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}>
                      <img
                        src={state.imageUrl}
                        alt="当前图片"
                        className="w-full rounded-xl object-cover"
                      />
                      <p className={`mt-4 text-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        当前创作的图片
                      </p>
                    </div>
                  ) : (
                    <div className={`p-8 rounded-2xl ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'} border-2 border-dashed text-center`}>
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center mx-auto mb-4">
                        <i className="fas fa-image text-white text-2xl"></i>
                      </div>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        暂无生成的图片
                      </p>
                      <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        开始创作后将在此显示
                      </p>
                    </div>
                  )}
                </div>

                {/* Right: Templates & Text */}
                <div className="space-y-6">
                  {/* Selected Template */}
                  <div>
                    <h3 className={`text-xl font-bold flex items-center gap-2 mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      <i className="fas fa-palette text-amber-500"></i>
                      使用的模板
                    </h3>
                    {selectedTemplate ? (
                      <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}>
                        {(() => {
                          const template = [...TEMPLATES, ...EXTENDED_TEMPLATES].find(t => t.id === selectedTemplate);
                          return template ? (
                            <div className="flex items-center gap-4">
                              <img
                                src={template.thumbnail}
                                alt={template.name}
                                className="w-20 h-20 rounded-lg object-cover"
                              />
                              <div>
                                <h4 className="font-semibold">{template.name}</h4>
                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{template.desc}</p>
                              </div>
                            </div>
                          ) : null;
                        })()}
                      </div>
                    ) : (
                      <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'} text-center`}>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>尚未选择模板</p>
                      </div>
                    )}
                  </div>

                  {/* Input Text */}
                  <div>
                    <h3 className={`text-xl font-bold flex items-center gap-2 mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      <i className="fas fa-file-alt text-green-500"></i>
                      文字文案
                    </h3>
                    {state.inputText ? (
                      <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}>
                        <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'} line-clamp-6`}>
                          {state.inputText}
                        </p>
                      </div>
                    ) : (
                      <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'} text-center`}>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>尚未输入创意描述</p>
                      </div>
                    )}
                  </div>

                  {/* Brand Info */}
                  {state.brandName && (
                    <div>
                      <h3 className={`text-xl font-bold flex items-center gap-2 mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        <i className="fas fa-store text-red-500"></i>
                        当前品牌
                      </h3>
                      <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border flex items-center gap-4`}>
                        {selectedBrand && (
                          <img
                            src={selectedBrand.image}
                            alt={selectedBrand.name}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                        )}
                        <div>
                          <h4 className="font-semibold">{state.brandName}</h4>
                          {selectedBrand && (
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} line-clamp-2`}>
                              {selectedBrand.story}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
              className="space-y-10"
            >
              {/* Header - 优化后的标题区域 */}
              <div className="text-center space-y-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1, duration: 0.5 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-red-500/10 to-amber-500/10 border border-red-200 dark:border-red-800 mb-4"
                >
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                  <span className="text-sm font-medium text-red-600 dark:text-red-400">步骤 2/5</span>
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.5 }}
                  className="text-4xl sm:text-5xl font-bold tracking-tight"
                >
                  <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-600 dark:from-white dark:via-gray-200 dark:to-gray-400 bg-clip-text text-transparent">
                    选择品牌
                  </span>
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className={`text-lg max-w-2xl mx-auto leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
                >
                  从经典老字号中选择，或输入您的品牌名称，开启创意之旅
                </motion.p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-10">
                {/* Left: Brand Selection */}
                <div className="lg:col-span-3 space-y-6">
                  {/* Search & Filter - 优化后的搜索筛选区域 */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25, duration: 0.5 }}
                    className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-200'} border shadow-lg shadow-black/5`}
                  >
                    {/* Category Filter - 优化后的分类筛选 */}
                    <div className="flex gap-2 mb-5 overflow-x-auto pb-2 scrollbar-hide">
                      {[
                        { id: 'all', name: '全部品牌', icon: 'fa-th-large' },
                        { id: 'tianjin', name: '天津老字号', icon: 'fa-landmark' },
                        { id: 'food', name: '美食', icon: 'fa-utensils' },
                        { id: 'craft', name: '工艺', icon: 'fa-hammer' },
                        { id: 'daily', name: '日用', icon: 'fa-shopping-bag' },
                      ].map((cat, index) => (
                        <motion.button
                          key={cat.id}
                          onClick={() => setSelectedCategory(cat.id as any)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 + index * 0.05, duration: 0.3 }}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm whitespace-nowrap transition-all duration-300 ${
                            selectedCategory === cat.id
                              ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/25'
                              : (isDark ? 'bg-gray-700/80 hover:bg-gray-600 text-gray-300 border border-gray-600' : 'bg-gray-50 hover:bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:shadow-md')
                          }`}
                        >
                          <i className={`fas ${cat.icon} ${selectedCategory === cat.id ? 'text-white' : 'text-gray-400'}`}></i>
                          {cat.name}
                        </motion.button>
                      ))}
                    </div>

                    {/* Search Input - 优化后的搜索框 */}
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <i className="fas fa-search text-gray-400 group-focus-within:text-red-500 transition-colors"></i>
                      </div>
                      <input
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setShowSuggestions(e.target.value.length > 0);
                        }}
                        onFocus={() => setShowSuggestions(searchQuery.length > 0)}
                        placeholder="搜索品牌名称..."
                        className={`w-full p-4 pl-12 pr-12 text-base rounded-xl border-2 transition-all duration-300 ${isDark ? 'bg-gray-900/50 border-gray-700 focus:border-red-500 focus:bg-gray-900' : 'bg-gray-50 border-gray-200 focus:border-red-500 focus:bg-white'} focus:ring-4 focus:ring-red-500/10 outline-none`}
                      />
                      {searchQuery ? (
                        <button
                          onClick={() => { setSearchQuery(''); setShowSuggestions(false); }}
                          className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            <i className="fas fa-times text-xs"></i>
                          </div>
                        </button>
                      ) : (
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs font-sans font-medium text-gray-400 bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                            <span className="text-xs">⌘</span>K
                          </kbd>
                        </div>
                      )}
                    </div>

                    {/* Search Suggestions - 优化后的搜索建议 */}
                    <AnimatePresence>
                      {showSuggestions && searchQuery && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.98 }}
                          transition={{ duration: 0.2 }}
                          className={`mt-3 p-2 rounded-xl ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'} border shadow-xl max-h-60 overflow-y-auto custom-scrollbar`}
                        >
                          {filteredBrands.slice(0, 6).map((b, index) => (
                            <motion.button
                              key={b.id}
                              onClick={() => {
                                setState({ brandId: b.id, brandName: b.name });
                                setSearchQuery(b.name);
                                setShowSuggestions(false);
                              }}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.03 }}
                              className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center gap-3 group ${
                                isDark ? 'hover:bg-gray-600' : 'hover:bg-red-50'
                              }`}
                            >
                              <div className="relative">
                                <img src={b.image} alt={b.name} className="w-12 h-12 rounded-xl object-cover shadow-md group-hover:shadow-lg transition-shadow" />
                                <div className="absolute inset-0 rounded-xl ring-2 ring-white/50 dark:ring-black/20"></div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">{b.name}</div>
                                <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} truncate max-w-[200px] mt-0.5`}>{b.story}</div>
                              </div>
                              <i className="fas fa-chevron-right text-gray-300 group-hover:text-red-400 transition-colors"></i>
                            </motion.button>
                          ))}
                          {filteredBrands.length === 0 && (
                            <div className="px-4 py-6 text-center">
                              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-600 flex items-center justify-center mx-auto mb-3">
                                <i className="fas fa-search text-gray-400"></i>
                              </div>
                              <p className="text-sm text-gray-500 dark:text-gray-400">未找到匹配的品牌</p>
                              <p className="text-xs text-gray-400 mt-1">将使用自定义品牌名称</p>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* Brand Cards Grid - 优化后的品牌卡片网格 */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35, duration: 0.5 }}
                  >
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-3">
                        <h3 className="font-bold text-xl">
                          {searchQuery ? '搜索结果' : '热门品牌'}
                        </h3>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                          {filteredBrands.length}
                        </span>
                      </div>
                      {!searchQuery && (
                        <button className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium flex items-center gap-1 transition-colors">
                          查看全部
                          <i className="fas fa-arrow-right text-xs"></i>
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[900px] overflow-y-auto custom-scrollbar pr-1">
                      {filteredBrands.map((b, index) => (
                        <motion.button
                          key={b.id}
                          onClick={() => setState({ brandId: b.id, brandName: b.name })}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4 + index * 0.03, duration: 0.4 }}
                          whileHover={{ y: -6, scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`group relative p-4 rounded-2xl border-2 text-left transition-all duration-300 overflow-hidden ${
                            state.brandName === b.name
                              ? 'border-red-500 bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-900/30 dark:to-red-800/20 shadow-xl shadow-red-500/15'
                              : (isDark ? 'border-gray-700/50 bg-gray-800/80 hover:border-gray-600 hover:bg-gray-800' : 'border-gray-200 bg-white hover:border-red-200 hover:shadow-xl hover:shadow-black/5')
                          }`}
                        >
                          {/* 选中状态的发光效果 */}
                          {state.brandName === b.name && (
                            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent pointer-events-none"></div>
                          )}

                          <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-3 shadow-md group-hover:shadow-lg transition-shadow duration-300">
                            <TianjinImage src={b.image} alt={b.name} ratio="landscape" className="w-full h-full" />

                            {/* 选中状态的覆盖层 */}
                            {state.brandName === b.name && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="absolute inset-0 bg-gradient-to-t from-red-600/60 via-red-500/20 to-transparent flex items-center justify-center"
                              >
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                  className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg"
                                >
                                  <i className="fas fa-check text-red-600 text-lg"></i>
                                </motion.div>
                              </motion.div>
                            )}

                            {/* 悬停时的渐变遮罩 */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          </div>

                          <h4 className={`font-bold text-sm truncate transition-colors ${state.brandName === b.name ? 'text-red-700 dark:text-red-400' : 'group-hover:text-red-600 dark:group-hover:text-red-400'}`}>
                            {b.name}
                          </h4>
                          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} line-clamp-2 mt-1.5 leading-relaxed`}>
                            {b.story}
                          </p>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                </div>

                {/* Right: Brand Preview & Assets - 优化后的品牌预览区域 */}
                <div className="lg:col-span-2">
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className={`sticky top-32 p-6 rounded-2xl ${isDark ? 'bg-gray-800/90 border-gray-700' : 'bg-white border-gray-200'} border shadow-xl shadow-black/5`}
                  >
                    {selectedBrand ? (
                      <div className="space-y-6">
                        {/* Brand Header - 优化后的品牌头部 */}
                        <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl shadow-black/20 group">
                          <TianjinImage src={selectedBrand.image} alt={selectedBrand.name} ratio="landscape" className="w-full h-full" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col justify-end p-5">
                            <motion.h3
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="text-white font-bold text-2xl tracking-tight"
                            >
                              {selectedBrand.name}
                            </motion.h3>
                            <p className="text-white/70 text-sm mt-1 flex items-center gap-2">
                              <i className="fas fa-check-circle text-green-400"></i>
                              已选择品牌
                            </p>
                          </div>
                          {/* 装饰性边框 */}
                          <div className="absolute inset-0 rounded-2xl ring-2 ring-white/20 pointer-events-none"></div>
                        </div>

                        {/* Brand Story - 优化后的品牌故事 */}
                        <div className="p-4 rounded-xl bg-gradient-to-br from-gray-50 to-white dark:from-gray-700/50 dark:to-gray-800/50 border border-gray-100 dark:border-gray-700">
                          <h4 className="font-bold mb-3 flex items-center gap-2 text-sm">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                              <i className="fas fa-book-open text-white text-sm"></i>
                            </div>
                            品牌故事
                          </h4>
                          <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'} leading-relaxed`}>
                            {selectedBrand.story}
                          </p>
                        </div>

                        {/* Brand Assets Management - 优化后的品牌资产配置 */}
                        <div className={`p-5 rounded-xl ${isDark ? 'bg-gray-700/30 border-gray-600' : 'bg-gradient-to-br from-blue-50/50 to-indigo-50/30 border-blue-100'} border`}>
                          <h4 className="font-bold mb-5 flex items-center gap-2 text-sm">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                              <i className="fas fa-sliders-h text-white text-sm"></i>
                            </div>
                            品牌资产配置
                          </h4>
                          
                          {/* Logo Upload - 优化后的Logo上传 */}
                          <div className="mb-5">
                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3 block uppercase tracking-wider">品牌 Logo</label>
                            <div className="flex items-center gap-4">
                              <div className="relative">
                                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center overflow-hidden border-2 transition-all duration-300 ${
                                  brandAssets.logo
                                    ? 'border-transparent shadow-lg'
                                    : 'border-dashed border-gray-300 dark:border-gray-500 bg-gray-100 dark:bg-gray-600'
                                }`}>
                                  {brandAssets.logo ? (
                                    <img src={brandAssets.logo} className="w-full h-full object-cover" alt="Logo" />
                                  ) : (
                                    <i className="fas fa-image text-gray-400 text-2xl"></i>
                                  )}
                                </div>
                                {brandAssets.logo && (
                                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-md">
                                    <i className="fas fa-check text-white text-xs"></i>
                                  </div>
                                )}
                              </div>
                              <div className="flex-1">
                                <UploadBox
                                  accept="image/*"
                                  variant="image"
                                  compact
                                  className="flex-1"
                                  title={brandAssets.logo ? '更换 Logo' : '上传 Logo'}
                                  onFile={(f) => setBrandAssets({...brandAssets, logo: URL.createObjectURL(f)})}
                                />
                                <p className="text-xs text-gray-400 mt-2">支持 PNG, JPG, SVG 格式</p>
                              </div>
                            </div>
                          </div>

                          {/* Brand Colors - 优化后的品牌色选择 */}
                          <div className="mb-5">
                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3 block uppercase tracking-wider">品牌色</label>
                            <div className="flex flex-wrap gap-3 items-center">
                              {brandAssets.colors.map((c, i) => (
                                <motion.div key={i} className="relative group" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                                  <div
                                    className="w-12 h-12 rounded-xl border-2 border-white dark:border-gray-700 shadow-md cursor-pointer transition-shadow group-hover:shadow-lg"
                                    style={{backgroundColor: c}}
                                    title={c}
                                  />
                                  <button
                                    onClick={() => removeColor(i)}
                                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center shadow-md hover:bg-red-600"
                                  >
                                    <i className="fas fa-times text-[10px]"></i>
                                  </button>
                                </motion.div>
                              ))}
                              {brandAssets.colors.length < 6 && (
                                <motion.button
                                  onClick={() => setShowColorPicker(!showColorPicker)}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  className="w-12 h-12 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-300"
                                >
                                  <i className="fas fa-plus"></i>
                                </motion.button>
                              )}
                            </div>
                            
                            {/* Color Picker - 优化后的颜色选择器 */}
                            <AnimatePresence>
                              {showColorPicker && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0, y: -10 }}
                                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                                  exit={{ opacity: 0, height: 0, y: -10 }}
                                  className="mt-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="relative">
                                      <input
                                        type="color"
                                        value={newColor}
                                        onChange={(e) => setNewColor(e.target.value)}
                                        className="w-12 h-12 rounded-xl cursor-pointer border-2 border-gray-200 dark:border-gray-600"
                                      />
                                      <div className="absolute inset-0 rounded-xl ring-2 ring-white dark:ring-gray-700 pointer-events-none"></div>
                                    </div>
                                    <input
                                      type="text"
                                      value={newColor}
                                      onChange={(e) => setNewColor(e.target.value)}
                                      className={`flex-1 px-4 py-3 rounded-xl text-sm font-mono ${isDark ? 'bg-gray-900 border-gray-600' : 'bg-white border-gray-200'} border-2 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all`}
                                      placeholder="#000000"
                                    />
                                    <TianjinButton size="sm" primary onClick={addColor} className="px-4">
                                      <i className="fas fa-plus mr-1"></i>
                                      添加
                                    </TianjinButton>
                                    <button
                                      onClick={() => setShowColorPicker(false)}
                                      className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                                    >
                                      <i className="fas fa-times"></i>
                                    </button>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                          {/* Brand Font - 优化后的品牌字体选择 */}
                          <div>
                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3 block uppercase tracking-wider">品牌字体</label>
                            <div className="relative">
                              <select
                                value={brandAssets.font}
                                onChange={(e) => setBrandAssets({...brandAssets, font: e.target.value})}
                                className={`w-full px-4 py-3 pr-10 rounded-xl text-sm appearance-none cursor-pointer transition-all ${isDark ? 'bg-gray-900 border-gray-600 hover:border-gray-500' : 'bg-white border-gray-200 hover:border-gray-300'} border-2 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none`}
                              >
                                {BRAND_FONTS.map(f => (
                                  <option key={f.id} value={f.id}>{f.name} - {f.desc}</option>
                                ))}
                              </select>
                              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <i className="fas fa-chevron-down text-gray-400 text-xs"></i>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Quick Actions - 优化后的操作按钮 */}
                        <div className="flex gap-3 pt-2">
                          <TianjinButton
                            variant="secondary"
                            fullWidth
                            onClick={() => setState({ brandId: undefined, brandName: '' })}
                            className="py-3"
                          >
                            <i className="fas fa-undo mr-2"></i>
                            重新选择
                          </TianjinButton>
                          <TianjinButton
                            primary
                            fullWidth
                            onClick={next}
                            rightIcon={<i className="fas fa-arrow-right"></i>}
                            className="py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                          >
                            确认选择
                          </TianjinButton>
                        </div>
                      </div>
                    ) : (
                      /* Empty State - 优化后的空状态 */
                      <div className="text-center py-16">
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.5 }}
                          className="relative inline-block mb-8"
                        >
                          <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-red-400 via-red-500 to-amber-500 flex items-center justify-center mx-auto shadow-2xl shadow-red-500/30">
                            <i className="fas fa-store text-white text-5xl"></i>
                          </div>
                          <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-lg">
                            <i className="fas fa-plus text-red-500"></i>
                          </div>
                        </motion.div>
                        <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">开始您的创意之旅</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto leading-relaxed">
                          从左侧选择一个老字号品牌，或搜索您自己的品牌，我们将为您量身定制专属创意方案
                        </p>
                        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400">
                          <i className="fas fa-lightbulb text-amber-500"></i>
                          <span>提示：选择品牌后可以自定义Logo和品牌色</span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
              className="space-y-8"
            >
              {/* Header - 优化后的步骤3标题 */}
              <div className="text-center space-y-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1, duration: 0.5 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-200 dark:border-amber-800 mb-4"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                  <span className="text-sm font-medium text-amber-600 dark:text-amber-400">步骤 3/5</span>
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.5 }}
                  className="text-4xl sm:text-5xl font-bold tracking-tight"
                >
                  <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-600 dark:from-white dark:via-gray-200 dark:to-gray-400 bg-clip-text text-transparent">
                    创意输入
                  </span>
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className={`text-lg max-w-2xl mx-auto leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
                >
                  描述您的创意需求，AI将为您提供专业的创意建议
                </motion.p>
              </div>

              {/* Creative Templates - 优化后的创意模板 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.5 }}
              >
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-bold text-xl flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-lg shadow-amber-500/25">
                      <i className="fas fa-lightbulb text-white"></i>
                    </div>
                    创意模板
                  </h3>
                  <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    快速开始您的创作
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {CREATIVE_TEMPLATES.map(t => (
                    <motion.div
                      key={t.id}
                      className={`p-4 rounded-xl border text-left transition-all relative group ${
                        isDark
                          ? 'border-gray-700 bg-gray-800 hover:border-gray-600'
                          : 'border-gray-200 bg-white hover:border-red-300 hover:shadow-md'
                      }`}
                      whileHover={{ y: -2 }}
                    >
                      {/* 详情按钮 */}
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedTemplateDetail(t); }}
                        className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${
                          isDark ? 'bg-gray-700 text-gray-400 hover:bg-gray-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                        title="查看详情"
                      >
                        <i className="fas fa-info text-xs"></i>
                      </button>
                      
                      <motion.button
                        onClick={() => applyTemplate(t.id)}
                        className="w-full text-left"
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className={`w-10 h-10 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-red-50'} flex items-center justify-center mb-3`}>
                          <i className={`fas ${t.icon} ${isDark ? 'text-red-400' : 'text-red-600'}`}></i>
                        </div>
                        <h4 className="font-bold text-sm">{t.name}</h4>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-1 line-clamp-2`}>{t.desc}</p>
                      </motion.button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  {/* Creative Input */}
                  <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} border shadow-sm`}>
                    <div className="flex justify-between items-center mb-4">
                      <label className="font-bold text-lg flex items-center gap-2">
                        <i className="fas fa-pen-fancy text-blue-500"></i> 创意描述
                      </label>
                      <div className="flex gap-2">
                        <TianjinButton size="sm" variant="ghost" onClick={() => setState({ inputText: '' })}>
                          <i className="fas fa-trash-alt"></i>
                        </TianjinButton>
                      </div>
                    </div>
                    <textarea
                      value={state.inputText || ''}
                      onChange={(e) => { if (e.target.value.length <= 500) setState({ inputText: e.target.value }) }}
                      placeholder="描述您的创意需求，例如：为桂发祥十八街麻花设计春节促销海报，主色调为红色和金色，体现传统年味..."
                      className={`w-full h-40 p-4 rounded-xl border transition-all resize-none ${isDark ? 'bg-gray-900 border-gray-700 focus:border-red-500' : 'bg-gray-50 border-gray-200 focus:border-red-500'} focus:ring-2 focus:ring-red-500/20 outline-none`}
                    />
                    <div className="flex justify-between items-center mt-2">
                      <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        {(state.inputText || '').length}/500 字
                      </span>
                      <div className="flex gap-2">
                        <UploadBox
                          accept="image/*"
                          variant="image"
                          title="参考图"
                          compact
                          onFile={(file) => { const url = URL.createObjectURL(file); setState({ imageUrl: url }) }}
                        />
                        <UploadBox
                          accept="audio/*"
                          variant="audio"
                          title="语音输入"
                          compact
                          onFile={async (file) => { const t = await voiceService.transcribeAudio(file); setState({ inputText: t }) }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* AI Assistance Section */}
                  <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-gradient-to-br from-blue-50/80 to-indigo-50/50 border-blue-100'} border border-dashed`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'} flex items-center justify-center`}>
                          <i className={`fas fa-sparkles ${isDark ? 'text-blue-400' : 'text-blue-600'}`}></i>
                        </div>
                        <div>
                          <span className={`font-bold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>AI 创意助理</span>
                          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>基于您的描述生成创意建议</p>
                        </div>
                      </div>
                      <TianjinButton 
                        size="sm" 
                        primary 
                        disabled={!state.inputText?.trim() || isGenerating} 
                        onClick={runAIHelp} 
                        loading={isGenerating}
                        leftIcon={<i className="fas fa-magic"></i>}
                      >
                        {aiText ? '重新生成' : '生成建议'}
                      </TianjinButton>
                    </div>
                    <AISuggestionBox 
                      content={aiText} 
                      isLoading={isGenerating}
                      title="创意建议"
                      onApply={(text) => setState({ inputText: text })}
                    />
                  </div>

                  {/* Cultural Elements */}
                  {culturalElements.length > 0 && (
                    <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} border`}>
                      <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
                        <i className="fas fa-landmark text-amber-500"></i> 推荐文化元素
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {culturalElements.map((elem, i) => (
                          <span 
                            key={i}
                            className={`px-3 py-1 rounded-full text-sm ${isDark ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-50 text-amber-700'} border border-amber-200`}
                          >
                            {elem}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Preview Panel */}
                <div className="space-y-4">
                  <div className={`p-4 rounded-2xl ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} border shadow-sm sticky top-24`}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-sm">实时预览</h3>
                      <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                        {(['landscape', 'square', 'portrait'] as const).map(r => (
                          <button
                            key={r}
                            onClick={() => setPreviewRatio(r)}
                            className={`px-2 py-1 rounded text-xs transition-all ${
                              previewRatio === r 
                                ? 'bg-white dark:bg-gray-600 shadow-sm' 
                                : 'opacity-50 hover:opacity-100'
                            }`}
                          >
                            <i className={`fas fa-${r === 'landscape' ? 'image' : r === 'square' ? 'square' : 'portrait'}`}></i>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className={`relative rounded-xl overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
                      style={{ aspectRatio: previewRatio === 'landscape' ? '16/9' : previewRatio === 'square' ? '1/1' : '9/16' }}
                    >
                      {state.imageUrl || brandAssets.logo ? (
                        <div className="w-full h-full relative">
                          {/* 背景层 - 参考图或品牌图 */}
                          {state.imageUrl ? (
                            <img src={state.imageUrl} alt="参考图" className="w-full h-full object-cover" />
                          ) : selectedBrand ? (
                            <img src={selectedBrand.image} alt={selectedBrand.name} className="w-full h-full object-cover opacity-30" />
                          ) : null}
                          
                          {/* 品牌Logo叠加层 */}
                          {brandAssets.logo && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <motion.div 
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="relative"
                                style={{
                                  filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.3))'
                                }}
                              >
                                <img 
                                  src={brandAssets.logo} 
                                  alt="品牌Logo" 
                                  className="max-w-[40%] max-h-[40%] object-contain"
                                  style={{ 
                                    minWidth: '80px',
                                    minHeight: '80px'
                                  }}
                                />
                              </motion.div>
                            </div>
                          )}
                          
                          {/* 品牌色边框效果 */}
                          {brandAssets.colors.length > 0 && (
                            <div 
                              className="absolute inset-0 pointer-events-none"
                              style={{
                                boxShadow: `inset 0 0 0 4px ${brandAssets.colors[0]}40, inset 0 0 30px ${brandAssets.colors[0]}20`
                              }}
                            />
                          )}
                          
                          {/* 预览标签 */}
                          <div className="absolute top-3 left-3 flex gap-2">
                            {brandAssets.logo && (
                              <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${isDark ? 'bg-black/50 text-white' : 'bg-white/80 text-gray-700'} backdrop-blur-sm`}>
                                <i className="fas fa-cube mr-1"></i>Logo
                              </span>
                            )}
                            {state.imageUrl && (
                              <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${isDark ? 'bg-black/50 text-white' : 'bg-white/80 text-gray-700'} backdrop-blur-sm`}>
                                <i className="fas fa-image mr-1"></i>参考图
                              </span>
                            )}
                          </div>
                        </div>
                      ) : selectedBrand ? (
                        <div className="w-full h-full relative">
                          <img src={selectedBrand.image} alt={selectedBrand.name} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end justify-center pb-6">
                            <span className="text-white text-sm font-medium">
                              <i className="fas fa-store mr-2"></i>
                              {selectedBrand.name}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center opacity-40">
                          <i className="fas fa-image text-4xl mb-2"></i>
                          <p className="text-xs">预览区域</p>
                          <p className="text-[10px] mt-1">上传Logo或参考图查看效果</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Brand Info Summary - 增强版 */}
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                      {/* 品牌信息 */}
                      <div className="flex items-center gap-3">
                        {selectedBrand && (
                          <>
                            <img src={selectedBrand.image} alt={selectedBrand.name} className="w-10 h-10 rounded-lg object-cover" />
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-sm truncate">{selectedBrand.name}</div>
                              <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>已选择品牌</div>
                            </div>
                          </>
                        )}
                      </div>
                      
                      {/* 品牌色预览 */}
                      {brandAssets.colors.length > 0 && (
                        <div className="flex items-center gap-2">
                          <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>品牌色:</span>
                          <div className="flex gap-1">
                            {brandAssets.colors.slice(0, 5).map((color, idx) => (
                              <div
                                key={idx}
                                className="w-5 h-5 rounded-full border-2 border-white dark:border-gray-600 shadow-sm"
                                style={{ backgroundColor: color }}
                                title={color}
                              />
                            ))}
                            {brandAssets.colors.length > 5 && (
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] ${isDark ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>
                                +{brandAssets.colors.length - 5}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Logo状态 */}
                      <div className="flex items-center gap-2">
                        <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Logo:</span>
                        {brandAssets.logo ? (
                          <span className="text-xs text-green-500 flex items-center gap-1">
                            <i className="fas fa-check-circle"></i>
                            已上传
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <i className="fas fa-circle text-[6px]"></i>
                            未上传
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Header */}
              <div className="text-center space-y-4 mb-8">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1, duration: 0.5 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-200 dark:border-purple-800 mb-4"
                >
                  <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
                  <span className="text-sm font-medium text-purple-600 dark:text-purple-400">步骤 4/5</span>
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.5 }}
                  className="text-4xl sm:text-5xl font-bold tracking-tight"
                >
                  <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-600 dark:from-white dark:via-gray-200 dark:to-gray-400 bg-clip-text text-transparent">
                    生成变体
                  </span>
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className={`text-lg max-w-2xl mx-auto leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
                >
                  选择设计模板，AI将为您生成多种创意方案
                </motion.p>
              </div>

              {/* Template Selection */}
              <div>
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <i className="fas fa-layer-group text-purple-500"></i> 选择设计模板
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {TEMPLATES.map(t => (
                    <motion.div
                      key={t.id}
                      className={`relative p-4 rounded-xl border-2 text-left transition-all overflow-hidden group ${
                        selectedTemplate === t.id
                          ? 'border-red-500 bg-red-50 dark:bg-red-900/20 shadow-lg shadow-red-500/10'
                          : (isDark ? 'border-gray-700 bg-gray-800 hover:border-gray-600' : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md')
                      }`}
                      whileHover={{ y: -2 }}
                    >
                      {/* 详情按钮 */}
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedTemplateDetail({...t, name: t.title, content: t.style} as any); }}
                        className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 ${
                          isDark ? 'bg-gray-700 text-gray-400 hover:bg-gray-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                        title="查看详情"
                      >
                        <i className="fas fa-info text-xs"></i>
                      </button>
                      
                      <motion.button
                        onClick={() => applyDesignTemplate(t.id)}
                        className="w-full text-left"
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className={`w-12 h-12 rounded-xl ${selectedTemplate === t.id ? 'bg-red-100 dark:bg-red-800' : isDark ? 'bg-gray-700' : 'bg-gray-100'} flex items-center justify-center mb-3`}>
                          <i className={`fas fa-${t.icon} ${selectedTemplate === t.id ? 'text-red-600 dark:text-red-400' : isDark ? 'text-gray-400' : 'text-gray-600'} text-xl`}></i>
                        </div>
                        <h4 className={`font-bold text-sm ${selectedTemplate === t.id ? 'text-red-600 dark:text-red-400' : ''}`}>{t.title}</h4>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-1 line-clamp-2`}>{t.desc}</p>
                        {selectedTemplate === t.id && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center text-white text-xs">
                            <i className="fas fa-check"></i>
                          </div>
                        )}
                      </motion.button>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <div className="flex justify-center">
                <TianjinButton 
                  primary 
                  size="lg"
                  onClick={generateVariants}
                  disabled={!selectedTemplate || isGeneratingVariants}
                  loading={isGeneratingVariants}
                  leftIcon={<i className="fas fa-wand-magic-sparkles"></i>}
                  className="px-8"
                >
                  {isGeneratingVariants ? `生成中 ${generationProgress}%` : state.variants?.length ? '重新生成方案' : '开始生成创意方案'}
                </TianjinButton>
              </div>

              {/* Generation Progress */}
              {isGeneratingVariants && (
                <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} border`}>
                  <div className="flex items-center justify-center gap-4">
                    <div className="w-12 h-12 border-4 border-red-500/30 border-t-red-500 rounded-full animate-spin"></div>
                    <div>
                      <h4 className="font-bold">正在生成创意方案</h4>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>AI正在根据您的描述创作多种风格方案...</p>
                    </div>
                  </div>
                  <div className="mt-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-red-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${generationProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Variants Grid */}
              {state.variants && state.variants.length > 0 && !isGeneratingVariants && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg">生成的创意方案</h3>
                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      已选择: {selectedVariantIndex >= 0 ? `方案${String.fromCharCode(65 + selectedVariantIndex)}` : '未选择'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {state.variants.map((v, i) => {
                      const isSelected = selectedVariantIndex === i;
                      return (
                        <motion.div 
                          key={i}
                          onClick={() => setSelectedVariantIndex(i)}
                          className={`group relative rounded-2xl overflow-hidden border-2 transition-all cursor-pointer ${
                            isSelected 
                              ? 'border-red-500 ring-4 ring-red-500/20 shadow-xl' 
                              : `${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'} shadow-sm hover:shadow-md`
                          }`}
                          whileHover={isSelected ? {} : { y: -4 }}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                        >
                          <div className="relative aspect-square overflow-hidden">
                            <TianjinImage src={v.image} alt={`variant-${i}`} ratio="square" className="w-full h-full object-cover" />
                            {isSelected && (
                              <div className="absolute inset-0 bg-red-500/10 flex items-center justify-center backdrop-blur-[1px]">
                                <div className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg">
                                  <i className="fas fa-check text-2xl"></i>
                                </div>
                              </div>
                            )}
                            <div className="absolute top-3 left-3">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${isDark ? 'bg-gray-800/80' : 'bg-white/80'} backdrop-blur-sm`}>
                                方案{String.fromCharCode(65 + i)}
                              </span>
                            </div>
                          </div>
                          <div className={`p-4 ${isSelected ? (isDark ? 'bg-red-900/20' : 'bg-red-50') : ''}`}>
                            <h3 className={`font-bold mb-1 ${isSelected ? 'text-red-600 dark:text-red-400' : ''}`}>{v.script}</h3>
                            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>包含视觉设计与文案建议</p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {(!state.variants || state.variants.length === 0) && !isGeneratingVariants && (
                <div className={`py-16 flex flex-col items-center justify-center ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'} border-2 border-dashed rounded-2xl`}>
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4">
                    <i className="fas fa-wand-magic-sparkles text-white text-3xl"></i>
                  </div>
                  <h3 className="text-lg font-bold mb-2">开始生成创意方案</h3>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} text-center max-w-md`}>
                    选择上方的设计模板，点击生成按钮，AI将为您创作多种风格的创意方案
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {step === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Header */}
              <div className="text-center space-y-4 mb-8">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1, duration: 0.5 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-teal-500/10 to-cyan-500/10 border border-teal-200 dark:border-teal-800 mb-4"
                >
                  <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
                  <span className="text-sm font-medium text-teal-600 dark:text-teal-400">步骤 5/6</span>
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.5 }}
                  className="text-4xl sm:text-5xl font-bold tracking-tight"
                >
                  <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-600 dark:from-white dark:via-gray-200 dark:to-gray-400 bg-clip-text text-transparent">
                    方案选择
                  </span>
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className={`text-lg max-w-2xl mx-auto leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
                >
                  从生成的方案中选择最满意的，进行最终优化
                </motion.p>
              </div>

              {/* Selected Variant Display */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left: Selected Image */}
                <div className="space-y-6">
                  <h3 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    <i className="fas fa-image text-teal-500"></i>
                    选中的方案
                  </h3>
                  {selectedVariantIndex >= 0 && state.variants && state.variants[selectedVariantIndex] ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border shadow-lg`}
                    >
                      <div className="relative aspect-square rounded-xl overflow-hidden mb-4">
                        <img
                          src={state.variants[selectedVariantIndex].image}
                          alt="选中的方案"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-3 left-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${isDark ? 'bg-teal-500/20 text-teal-300' : 'bg-teal-50 text-teal-700'}`}>
                            方案{String.fromCharCode(65 + selectedVariantIndex)}
                          </span>
                        </div>
                      </div>
                      <h4 className="font-bold text-lg mb-2">{state.variants[selectedVariantIndex].script}</h4>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        此方案将作为最终发布版本
                      </p>
                    </motion.div>
                  ) : state.imageUrl ? (
                    <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}>
                      <img
                        src={state.imageUrl}
                        alt="当前图片"
                        className="w-full rounded-xl object-cover"
                      />
                    </div>
                  ) : (
                    <div className={`p-8 rounded-2xl ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'} border-2 border-dashed text-center`}>
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center mx-auto mb-4">
                        <i className="fas fa-image text-white text-2xl"></i>
                      </div>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        请先在步骤4生成方案
                      </p>
                    </div>
                  )}
                </div>

                {/* Right: All Variants for Selection */}
                <div className="space-y-6">
                  <h3 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    <i className="fas fa-th-large text-purple-500"></i>
                    所有生成的方案
                  </h3>
                  {state.variants && state.variants.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4">
                      {state.variants.map((variant, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`relative rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                            selectedVariantIndex === index
                              ? 'border-teal-500 ring-2 ring-teal-500/30'
                              : isDark ? 'border-gray-700 hover:border-gray-600' : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => {
                            setSelectedVariantIndex(index);
                            setState({ imageUrl: variant.image });
                          }}
                        >
                          <img
                            src={variant.image}
                            alt={`方案-${index}`}
                            className="w-full aspect-square object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent">
                            <div className="absolute bottom-2 left-2 right-2">
                              <p className="text-white text-xs font-medium truncate">{variant.script}</p>
                            </div>
                          </div>
                          <div className="absolute top-2 left-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isDark ? 'bg-gray-800/80 text-white' : 'bg-white/80 text-gray-900'}`}>
                              方案{String.fromCharCode(65 + index)}
                            </span>
                          </div>
                          {selectedVariantIndex === index && (
                            <div className="absolute top-2 right-2 w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center">
                              <i className="fas fa-check text-white text-xs"></i>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className={`p-8 rounded-2xl ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'} border-2 border-dashed text-center`}>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        暂无生成的方案
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Creative Description */}
              {state.inputText && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200'} border`}
                >
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <i className="fas fa-pen-nib text-blue-500"></i>
                    创意描述
                  </h3>
                  <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-white'} border ${isDark ? 'border-gray-600' : 'border-gray-200'} max-h-[500px] overflow-y-auto custom-scrollbar`}>
                    <p className={`text-sm leading-relaxed whitespace-pre-wrap ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      {state.inputText}
                    </p>
                  </div>
                  <div className="mt-4 flex items-center gap-4 text-xs">
                    <span className={`flex items-center gap-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      <i className="fas fa-font text-blue-400"></i>
                      {(state.inputText || '').length} 字
                    </span>
                    {selectedBrand && (
                      <span className={`flex items-center gap-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        <i className="fas fa-store text-amber-400"></i>
                        {selectedBrand.name}
                      </span>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Optimization Suggestions */}
              {state.variants && state.variants.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-200'} border`}
                >
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <i className="fas fa-lightbulb text-yellow-500"></i>
                    优化建议
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-white'} border ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                      <i className="fas fa-palette text-pink-500 mb-2"></i>
                      <h4 className="font-semibold text-sm mb-1">色彩搭配</h4>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>确保品牌色彩与设计风格协调统一</p>
                    </div>
                    <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-white'} border ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                      <i className="fas fa-font text-blue-500 mb-2"></i>
                      <h4 className="font-semibold text-sm mb-1">字体选择</h4>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>选择与品牌调性匹配的字体风格</p>
                    </div>
                    <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-white'} border ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                      <i className="fas fa-balance-scale text-green-500 mb-2"></i>
                      <h4 className="font-semibold text-sm mb-1">构图平衡</h4>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>检查视觉元素的空间分布是否均衡</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {step === 6 && (
            <motion.div
              key="step6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Header */}
              <div className="text-center space-y-4 mb-8">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1, duration: 0.5 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-200 dark:border-amber-800 mb-4"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                  <span className="text-sm font-medium text-amber-600 dark:text-amber-400">步骤 6/6</span>
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.5 }}
                  className="text-4xl sm:text-5xl font-bold tracking-tight"
                >
                  <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-600 dark:from-white dark:via-gray-200 dark:to-gray-400 bg-clip-text text-transparent">
                    评分发布
                  </span>
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className={`text-lg max-w-2xl mx-auto leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
                >
                  评估您的作品并发布到社区
                </motion.p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Scores & Checks */}
                <div className="space-y-6">
                  {/* Cultural Score */}
                  <YangliuqingCard>
                    <div className="flex items-center gap-6">
                      <div className="relative w-24 h-24 flex-shrink-0">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                          <path
                            className={isDark ? 'text-gray-700' : 'text-gray-200'}
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                          />
                          {(() => {
                            const scoreColor = culturalScore >= 80 ? 'text-green-500' : culturalScore >= 60 ? 'text-yellow-500' : 'text-red-500';
                            return (
                              <path
                                className={scoreColor}
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeDasharray={`${culturalScore}, 100`}
                              />
                            );
                          })()}
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          {(() => {
                            const scoreTextColor = culturalScore >= 80 ? 'text-green-600' : culturalScore >= 60 ? 'text-yellow-600' : 'text-red-600';
                            return (
                              <span className={`text-2xl font-black ${scoreTextColor}`}>
                                {culturalScore}
                              </span>
                            );
                          })()}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg flex items-center gap-2">
                          <i className="fas fa-landmark text-amber-500"></i> 文化纯正度评分
                        </h3>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                          基于天津文化知识库评估，您的设计展现了良好的文化传承意识
                        </p>
                        <div className="flex gap-2 mt-3">
                          {(() => {
                            const defaultTags = ['传统元素', '地方特色', '文化内涵'];
                            const displayTags = culturalElements.length > 0 ? culturalElements.slice(0, 3) : defaultTags;
                            return displayTags.map(tag => (
                              <span key={tag} className={`px-2 py-1 rounded-full text-xs ${isDark ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-50 text-amber-700'}`}>
                                {tag}
                              </span>
                            ));
                          })()}
                        </div>
                      </div>
                    </div>
                  </YangliuqingCard>

                  {/* Brand Consistency Check */}
                  <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} border shadow-sm`}>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-lg flex items-center gap-2">
                        <i className="fas fa-shield-alt text-blue-500"></i> 品牌一致性检查
                      </h3>
                      <TianjinButton 
                        size="sm" 
                        variant="secondary" 
                        onClick={runConsistencyCheck} 
                        loading={isConsistencyChecking}
                        leftIcon={<i className="fas fa-sync-alt"></i>}
                      >
                        {consistencyScore !== null ? '重新检查' : '开始检查'}
                      </TianjinButton>
                    </div>
                    
                    {consistencyScore !== null ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <div className="flex justify-between text-sm font-medium mb-1">
                              <span>品牌匹配度</span>
                              <span className={consistencyScore >= 90 ? 'text-green-500' : consistencyScore >= 70 ? 'text-yellow-500' : 'text-red-500'}>
                                {consistencyScore}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                              <div 
                                className={`h-3 rounded-full transition-all duration-500 ${
                                  consistencyScore >= 90 ? 'bg-green-500' : consistencyScore >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                                }`} 
                                style={{width: `${consistencyScore}%`}}
                              ></div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          {consistencyDetails.map((detail, i) => (
                            <div key={i} className={`flex items-center gap-3 p-3 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                              <i className={`fas fa-${detail.status === 'pass' ? 'check-circle text-green-500' : detail.status === 'warn' ? 'exclamation-circle text-yellow-500' : 'times-circle text-red-500'}`}></i>
                              <div className="flex-1">
                                <div className="font-medium text-sm">{detail.item}</div>
                                <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{detail.message}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* 改进建议 */}
                        {consistencySuggestions.length > 0 && (
                          <div className={`mt-4 p-4 rounded-lg ${isDark ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'}`}>
                            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                              <i className="fas fa-lightbulb text-yellow-500"></i>
                              改进建议
                            </h4>
                            <ul className="space-y-1">
                              {consistencySuggestions.slice(0, 3).map((suggestion, index) => (
                                <li key={index} className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'} flex items-start gap-2`}>
                                  <span className="text-blue-500 mt-0.5">•</span>
                                  {suggestion}
                                </li>
                              ))}
                            </ul>
                            {consistencySuggestions.length > 3 && (
                              <p className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                还有 {consistencySuggestions.length - 3} 条建议...
                              </p>
                            )}
                          </div>
                        )}
                        
                        {/* 分享按钮 */}
                        <div className="mt-4 flex gap-2">
                          <TianjinButton
                            size="sm"
                            variant="secondary"
                            onClick={async () => {
                              const shareData = {
                                brandName: state.brandName || '我的设计',
                                culturalScore,
                                consistencyScore: consistencyScore || 0,
                                consistencyDetails,
                                culturalElements,
                                suggestions: consistencySuggestions,
                                imageUrl: selectedVariantIndex >= 0 && state.variants 
                                  ? state.variants[selectedVariantIndex]?.image 
                                  : undefined
                              };
                              
                              // 生成分享内容
                              const shareContent = brandCheckShareService.generateShareText(shareData);
                              
                              // 复制到剪贴板
                              const copied = await brandCheckShareService.copyToClipboard(shareContent.content);
                              if (copied) {
                                toast.success('分享内容已复制到剪贴板！');
                              } else {
                                toast.error('复制失败，请手动复制');
                              }
                            }}
                            leftIcon={<i className="fas fa-copy"></i>}
                          >
                            复制分享
                          </TianjinButton>
                          
                          <TianjinButton
                            size="sm"
                            variant="primary"
                            onClick={() => {
                              const shareData = {
                                brandName: state.brandName || '我的设计',
                                culturalScore,
                                consistencyScore: consistencyScore || 0,
                                consistencyDetails,
                                culturalElements,
                                suggestions: consistencySuggestions,
                                imageUrl: selectedVariantIndex >= 0 && state.variants 
                                  ? state.variants[selectedVariantIndex]?.image 
                                  : undefined
                              };
                              
                              // 生成社群帖子数据
                              const postData = brandCheckShareService.generateCommunityPost(shareData);
                              
                              // 存储到 localStorage，供社群页面读取
                              localStorage.setItem('pending_share_post', JSON.stringify(postData));
                              
                              // 打开社群页面
                              window.open('/community?action=create_post', '_blank');
                              
                              toast.success('正在打开社群发布页面...');
                            }}
                            leftIcon={<i className="fas fa-share-alt"></i>}
                          >
                            分享到社群
                          </TianjinButton>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
                          <i className="fas fa-shield-alt text-2xl opacity-40"></i>
                        </div>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          点击"开始检查"分析设计是否符合品牌规范
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Selected Variant Preview */}
                  {selectedVariantIndex >= 0 && state.variants && (
                    <div className={`p-4 rounded-2xl ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} border`}>
                      <h4 className="font-bold text-sm mb-3">已选方案预览</h4>
                      <div className="relative rounded-xl overflow-hidden mb-4">
                        <TianjinImage 
                          src={state.variants[selectedVariantIndex].image} 
                          alt="Selected" 
                          ratio="square" 
                          className="w-full"
                        />
                        <div className="absolute top-3 left-3">
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-600 text-white">
                            {state.variants[selectedVariantIndex].script}
                          </span>
                        </div>
                      </div>
                      
                      {/* 创意描述展示 */}
                      {state.inputText && (
                        <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'} border ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                          <h5 className="text-xs font-bold mb-2 flex items-center gap-1.5 text-gray-500">
                            <i className="fas fa-file-alt"></i>
                            创意描述
                          </h5>
                          <div 
                            id="creative-desc-content"
                            className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'} line-clamp-6 whitespace-pre-wrap transition-all duration-300`}
                          >
                            {state.inputText}
                          </div>
                          {state.inputText.length > 300 && (
                            <button 
                              onClick={() => {
                                const el = document.getElementById('creative-desc-content');
                                if (el) {
                                  el.classList.toggle('line-clamp-6');
                                }
                              }}
                              className="text-xs text-red-500 hover:text-red-600 mt-2 font-medium cursor-pointer"
                            >
                              展开/收起
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Right: Publish Form */}
                <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} border shadow-sm`}>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <i className="fas fa-upload text-green-500"></i> 发布作品
                    </h3>
                    <div className="flex items-center gap-2">
                      {/* 导入到创作中心按钮 */}
                      <TianjinButton
                        size="sm"
                        variant="secondary"
                        onClick={async () => {
                          const imageUrl = selectedVariantImage;
                          if (!imageUrl) {
                            toast.error('请先生成或选择图片');
                            return;
                          }
                          
                          setIsImportingToCreate(true);
                          toast.loading('正在导入到创作中心...', { id: 'import-to-create' });
                          
                          try {
                            // 准备导入的数据
                            const importData = {
                              title: publishInfo.title || state.brandName || '',
                              description: publishInfo.description || state.inputText || '',
                              tags: publishInfo.tags ? publishInfo.tags.split(',').map(t => t.trim()) : culturalElements,
                              imageUrl: imageUrl,
                              brandAssets,
                              culturalElements,
                              culturalScore,
                              timestamp: Date.now()
                            };
                            
                            // 将数据存储到 localStorage，供创作中心读取
                            localStorage.setItem('wizard_to_create', JSON.stringify(importData));
                            console.log('[Wizard] 数据已存储到 localStorage:', importData);
                            
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
                            setIsImportingToCreate(false);
                          }
                        }}
                        loading={isImportingToCreate}
                        disabled={!selectedVariantImage || isImportingToCreate}
                        leftIcon={<i className="fas fa-wand-magic-sparkles"></i>}
                        className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border-0"
                      >
                        {isImportingToCreate ? '导入中...' : '导入到创作中心'}
                      </TianjinButton>
                      
                      <TianjinButton
                        size="sm"
                        variant="secondary"
                        onClick={analyzeImageWithAI}
                        loading={isAnalyzingImage}
                        disabled={!selectedVariantImage}
                        leftIcon={<i className="fas fa-magic"></i>}
                        ariaLabel={selectedVariantImage ? 'AI自动识别图片内容并填写信息' : '请先生成或选择图片'}
                      >
                        {isAnalyzingImage ? '分析中...' : 'AI自动填写'}
                      </TianjinButton>
                    </div>
                  </div>
                  
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        <i className="fas fa-heading text-gray-400 mr-1"></i> 作品标题
                      </label>
                      <input 
                        className={`w-full p-3 rounded-xl border transition-all ${isDark ? 'bg-gray-900 border-gray-700 focus:border-red-500' : 'bg-gray-50 border-gray-200 focus:border-red-500'} focus:ring-2 focus:ring-red-500/20 outline-none`}
                        value={publishInfo.title}
                        onChange={e => setPublishInfo({...publishInfo, title: e.target.value})}
                        placeholder={`${state.brandName || '作品'}创意设计方案`}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        <i className="fas fa-align-left text-gray-400 mr-1"></i> 作品描述
                      </label>
                      <textarea 
                        className={`w-full p-3 rounded-xl border h-28 resize-none transition-all ${isDark ? 'bg-gray-900 border-gray-700 focus:border-red-500' : 'bg-gray-50 border-gray-200 focus:border-red-500'} focus:ring-2 focus:ring-red-500/20 outline-none`}
                        value={publishInfo.description}
                        onChange={e => setPublishInfo({...publishInfo, description: e.target.value})}
                        placeholder="分享创作背后的故事、设计灵感、文化元素运用..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        <i className="fas fa-tags text-gray-400 mr-1"></i> 标签
                      </label>
                      <input 
                        className={`w-full p-3 rounded-xl border transition-all ${isDark ? 'bg-gray-900 border-gray-700 focus:border-red-500' : 'bg-gray-50 border-gray-200 focus:border-red-500'} focus:ring-2 focus:ring-red-500/20 outline-none`}
                        value={publishInfo.tags}
                        onChange={e => setPublishInfo({...publishInfo, tags: e.target.value})}
                        placeholder="国潮, 老字号, 品牌设计（用逗号分隔）"
                      />
                    </div>

                    {/* 分享到社群选项 */}
                    {consistencyScore !== null && (
                      <div className={`p-4 rounded-xl border ${isDark ? 'bg-blue-900/10 border-blue-800' : 'bg-blue-50 border-blue-200'}`}>
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="text-sm font-medium flex items-center gap-2">
                              <i className="fas fa-share-alt text-blue-500"></i>
                              同时分享到社群
                            </h4>
                            <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              将设计评估结果分享到社群，与创作者交流
                            </p>
                          </div>
                          <TianjinButton
                            size="sm"
                            variant="secondary"
                            onClick={async () => {
                              const avgScore = Math.round((culturalScore + (consistencyScore || 0)) / 2);
                              const currentImage = selectedVariantIndex >= 0 && state.variants 
                                ? state.variants[selectedVariantIndex]?.image 
                                : undefined;
                              
                              // 获取当前用户信息
                              const { data: { user } } = await supabase.auth.getUser();
                              
                              setShareData({
                                type: 'work',
                                id: `brand-check-${Date.now()}`,
                                title: `【品牌设计评估】${state.brandName || '我的设计'}获得了${avgScore}分！`,
                                description: `文化纯正度: ${culturalScore}分 · 品牌一致性: ${consistencyScore}分`,
                                thumbnail: currentImage,
                                url: `${window.location.origin}/wizard`,
                                author: {
                                  name: user?.user_metadata?.username || user?.email?.split('@')[0] || '创作者',
                                  avatar: user?.user_metadata?.avatar_url
                                }
                              });
                              
                              setShareUserInfo({
                                userId: user?.id || '',
                                userName: user?.user_metadata?.username || user?.email?.split('@')[0] || '创作者',
                                userAvatar: user?.user_metadata?.avatar_url
                              });
                              
                              setShowShareSelector(true);
                            }}
                            leftIcon={<i className="fas fa-external-link-alt"></i>}
                          >
                            去分享
                          </TianjinButton>
                        </div>
                        
                        {/* 预览卡片 */}
                        <div className={`mt-3 p-3 rounded-lg ${isDark ? 'bg-gray-800/50' : 'bg-white/50'} border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                          <p className={`text-xs mb-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>预览</p>
                          <div className="flex gap-3">
                            {/* 图片预览 */}
                            {selectedVariantIndex >= 0 && state.variants && state.variants[selectedVariantIndex]?.image && (
                              <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                                <img 
                                  src={state.variants[selectedVariantIndex].image} 
                                  alt="作品预览"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            {/* 文字预览 */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                【品牌设计评估】{state.brandName || '我的设计'}获得了{Math.round((culturalScore + (consistencyScore || 0)) / 2)}分！
                              </p>
                              <div className="mt-2 flex flex-wrap gap-2">
                                <span className={`text-xs px-2 py-0.5 rounded-full ${culturalScore >= 80 ? 'bg-green-100 text-green-700' : culturalScore >= 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                  文化{culturalScore}分
                                </span>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${(consistencyScore || 0) >= 80 ? 'bg-green-100 text-green-700' : (consistencyScore || 0) >= 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                  品牌{consistencyScore}分
                                </span>
                                {culturalElements.slice(0, 2).map((el, idx) => (
                                  <span key={idx} className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                                    {el}
                                  </span>
                                ))}
                              </div>
                              <p className={`text-xs mt-2 line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                {(() => {
                                  const passedCount = consistencyDetails.filter(d => d.status === 'pass').length;
                                  const warnCount = consistencyDetails.filter(d => d.status === 'warn').length;
                                  return `检查完成：${passedCount}项通过${warnCount > 0 ? `，${warnCount}项需优化` : ''} · ${consistencySuggestions.length}条改进建议`;
                                })()}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-3 flex gap-4 text-xs">
                          <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                            <i className="fas fa-landmark mr-1 text-amber-500"></i>
                            文化纯正度: {culturalScore}分
                          </span>
                          <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                            <i className="fas fa-shield-alt mr-1 text-blue-500"></i>
                            品牌一致性: {consistencyScore}分
                          </span>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        <i className="fas fa-trophy text-gray-400 mr-1"></i> 参与赛事
                        {isLoadingEvents && <span className="ml-2 text-xs text-gray-400">加载中...</span>}
                      </label>
                      <div className="space-y-2 max-h-[400px] overflow-y-auto">
                        {events.length === 0 && !isLoadingEvents ? (
                          <div className={`p-4 rounded-xl text-center ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                            暂无进行中的活动
                          </div>
                        ) : (
                          events.map(c => (
                            <button
                              key={c.id}
                              onClick={() => {
                                // 弹出确认对话框
                                setSelectedEvent(c);
                                setShowConfirmDialog(true);
                              }}
                              className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                                publishInfo.competitionId === c.id
                                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                                  : (isDark ? 'border-gray-700 hover:border-gray-600' : 'border-gray-200 hover:border-gray-300')
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3 flex-1">
                                  <div className={`w-10 h-10 rounded-lg ${publishInfo.competitionId === c.id ? 'bg-red-100 dark:bg-red-800' : isDark ? 'bg-gray-700' : 'bg-gray-100'} flex items-center justify-center flex-shrink-0`}>
                                    <i className={`fas fa-trophy ${publishInfo.competitionId === c.id ? 'text-red-600 dark:text-red-400' : 'text-gray-400'}`}></i>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-bold text-sm">{c.title}</span>
                                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                                        c.status === 'ongoing' 
                                          ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                                          : c.status === 'upcoming'
                                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                                          : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                                      }`}>
                                        {c.status === 'ongoing' ? '进行中' : c.status === 'upcoming' ? '即将开始' : '已结束'}
                                      </span>
                                      <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                                        {c.category}
                                      </span>
                                    </div>
                                    <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-1 line-clamp-2`}>{c.desc}</div>
                                    <div className="flex items-center gap-4 mt-2 text-xs">
                                      <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                                        <i className="fas fa-building mr-1"></i> {c.organizer}
                                      </span>
                                      <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                                        <i className="fas fa-award mr-1"></i> {c.prize}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                {publishInfo.competitionId === c.id && (
                                  <i className="fas fa-check-circle text-red-500 text-xl flex-shrink-0 ml-2"></i>
                                )}
                              </div>
                              <div className={`mt-2 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                <i className="fas fa-clock mr-1"></i> 截止日期: {c.deadline}
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Sticky Footer Navigation */}
      <div className={`fixed bottom-0 left-0 right-0 p-4 ${isDark ? 'bg-gray-900/95 border-gray-800' : 'bg-white/95 border-gray-200'} border-t backdrop-blur-md z-30`}>
        <div className="container mx-auto max-w-5xl flex justify-between items-center">
          <div className="flex items-center gap-2">
            <TianjinButton 
              variant="ghost" 
              onClick={prev} 
              disabled={step === 1} 
              leftIcon={<i className="fas fa-arrow-left"></i>}
            >
              上一步
            </TianjinButton>
            
            {/* Save to Drafts Button */}
            {state.brandName && (
              <TianjinButton
                variant="secondary"
                size="sm"
                onClick={handleSaveToDrafts}
                loading={isSaving}
                leftIcon={<i className="fas fa-save"></i>}
              >
                保存草稿
              </TianjinButton>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            {/* Auto-save Status - 增强版 */}
            {state.brandName && (
              <motion.span 
                className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs ${
                  isDirty 
                    ? (isDark ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30' : 'bg-yellow-50 text-yellow-700 border border-yellow-200')
                    : lastSavedAt
                      ? (isDark ? 'bg-green-500/10 text-green-400 border border-green-500/30' : 'bg-green-50 text-green-700 border border-green-200')
                      : (isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500')
                }`}
                animate={isDirty ? { scale: [1, 1.02, 1] } : {}}
                transition={isDirty ? { repeat: Infinity, duration: 2 } : {}}
              >
                {isDirty ? (
                  <>
                    <motion.i 
                      className="fas fa-circle text-yellow-500 text-[6px]"
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    />
                    <span>有未保存更改</span>
                    <span className="text-[10px] opacity-70">(自动保存中...)</span>
                  </>
                ) : lastSavedAt ? (
                  <>
                    <i className="fas fa-check-circle text-green-500 text-[10px]"></i>
                    <span>{formatLastSaved()}</span>
                  </>
                ) : (
                  <>
                    <i className="fas fa-info-circle text-[10px]"></i>
                    <span>草稿将自动保存</span>
                  </>
                )}
              </motion.span>
            )}
            
            {/* Step Info */}
            <span className={`hidden sm:block text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              步骤 {step}/6: {steps[step-1].title}
            </span>

            {step === 6 ? (
              <div className="flex items-center gap-2">
                {/* 重新创作按钮 */}
                <TianjinButton
                  variant="secondary"
                  onClick={async () => {
                    // 先保存当前进度到草稿箱
                    await saveToDrafts(6);
                    
                    // 清空所有状态
                    reset();
                    setPublishInfo({
                      title: '',
                      description: '',
                      competitionId: '',
                      tags: '',
                    });
                    setBrandAssets({
                      logo: '',
                      colors: ['#D32F2F', '#FFC107', '#212121'],
                      font: 'SimSun',
                    });
                    setSelectedTemplate('');
                    setSelectedVariantIndex(-1);
                    setUploadedImageUrl('');
                    setShowImagePreview(false);
                    setCulturalElements([]);
                    setCulturalScore(0);
                    setConsistencyScore(null);
                    setConsistencyDetails([]);
                    setConsistencySuggestions([]);
                    
                    // 重置到第二步（选择或输入品牌名称）
                    setStep(2);
                    
                    toast.success('已重新开始创作', {
                      description: '之前的内容已保存到草稿箱，请从品牌名称开始'
                    });
                  }}
                  leftIcon={<i className="fas fa-redo"></i>}
                >
                  重新创作
                </TianjinButton>
                
                <TianjinButton
                  primary
                  onClick={preparePublish}
                  rightIcon={<i className="fas fa-paper-plane"></i>}
                  disabled={!publishInfo.title || isUploadingImage}
                  loading={isUploadingImage}
                >
                  {isUploadingImage ? '上传图片中...' : '发布到广场'}
                </TianjinButton>
              </div>
            ) : (
              <TianjinButton
                primary
                onClick={next}
                disabled={(step === 2 && !state.brandName) || (step === 3 && !state.inputText) || (step === 5 && selectedVariantIndex < 0)}
                rightIcon={<i className="fas fa-arrow-right"></i>}
              >
                下一步
              </TianjinButton>
            )}
          </div>
        </div>
      </div>

      {/* 模板详情弹窗 */}
      <AnimatePresence>
        {selectedTemplateDetail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedTemplateDetail(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={`relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl shadow-2xl ${
                isDark ? 'bg-gray-800' : 'bg-white'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* 弹窗头部 */}
              <div className={`sticky top-0 z-10 flex items-center justify-between p-6 border-b ${
                isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
              }`}>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-red-50'} flex items-center justify-center`}>
                    <i className={`fas ${selectedTemplateDetail.icon} text-xl ${isDark ? 'text-red-400' : 'text-red-600'}`}></i>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{selectedTemplateDetail.name}</h3>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{selectedTemplateDetail.desc}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTemplateDetail(null)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                    isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                  }`}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>

              {/* 弹窗内容 */}
              <div className="p-6 space-y-6">
                {selectedTemplateDetail.detailDescription ? (
                  <>
                    {/* 设计理念 */}
                    <div>
                      <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                        <i className="fas fa-lightbulb text-yellow-500"></i>
                        设计理念
                      </h4>
                      <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        {selectedTemplateDetail.detailDescription.designPhilosophy}
                      </p>
                    </div>

                    {/* 核心功能 */}
                    <div>
                      <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                        <i className="fas fa-star text-amber-500"></i>
                        核心功能
                      </h4>
                      <ul className="space-y-2">
                        {selectedTemplateDetail.detailDescription.coreFeatures.map((feature, idx) => (
                          <li key={idx} className={`flex items-start gap-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                            <i className="fas fa-check-circle text-green-500 mt-0.5 flex-shrink-0"></i>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* 适用场景 */}
                    <div>
                      <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                        <i className="fas fa-map-marker-alt text-red-500"></i>
                        适用场景
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedTemplateDetail.detailDescription.applicableScenarios.map((scenario, idx) => (
                          <span
                            key={idx}
                            className={`px-3 py-1.5 rounded-full text-xs ${
                              isDark
                                ? 'bg-gray-700 text-gray-300 border border-gray-600'
                                : 'bg-gray-100 text-gray-600 border border-gray-200'
                            }`}
                          >
                            {scenario}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* 视觉风格 */}
                    <div>
                      <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                        <i className="fas fa-palette text-purple-500"></i>
                        视觉风格
                      </h4>
                      <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        {selectedTemplateDetail.detailDescription.visualStyle}
                      </p>
                    </div>

                    {/* 使用方法 */}
                    <div>
                      <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                        <i className="fas fa-list-ol text-blue-500"></i>
                        使用方法
                      </h4>
                      <ol className="space-y-2">
                        {selectedTemplateDetail.detailDescription.usageSteps.map((step, idx) => (
                          <li key={idx} className={`flex items-start gap-3 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                              isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                            }`}>
                              {idx + 1}
                            </span>
                            <span className="pt-0.5">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>

                    {/* 预期效果 */}
                    <div>
                      <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                        <i className="fas fa-chart-line text-green-500"></i>
                        预期效果
                      </h4>
                      <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        {selectedTemplateDetail.detailDescription.expectedEffect}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    <i className="fas fa-info-circle text-4xl mb-3 opacity-50"></i>
                    <p>该模板暂无详细描述</p>
                  </div>
                )}
              </div>

              {/* 弹窗底部 */}
              <div className={`sticky bottom-0 p-4 border-t ${
                isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
              }`}>
                <div className="flex justify-end gap-3">
                  <TianjinButton
                    variant="ghost"
                    onClick={() => setSelectedTemplateDetail(null)}
                  >
                    关闭
                  </TianjinButton>
                  <TianjinButton
                    primary
                    onClick={() => {
                      applyTemplate(selectedTemplateDetail.id);
                      setSelectedTemplateDetail(null);
                    }}
                    leftIcon={<i className="fas fa-magic"></i>}
                  >
                    使用此模板
                  </TianjinButton>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 图片预览和确认模态框 */}
      <AnimatePresence>
        {showImagePreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowImagePreview(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={`relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl ${
                isDark ? 'bg-gray-800' : 'bg-white'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* 弹窗头部 */}
              <div className={`sticky top-0 z-10 flex items-center justify-between p-6 border-b ${
                isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${isDark ? 'bg-red-900/30' : 'bg-red-50'} flex items-center justify-center`}>
                    <i className={`fas fa-image text-lg ${isDark ? 'text-red-400' : 'text-red-600'}`}></i>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">确认发布作品</h3>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>请确认图片和作品信息</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowImagePreview(false)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                    isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                  }`}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>

              {/* 弹窗内容 */}
              <div className="p-6 space-y-6">
                {/* 图片预览 */}
                <div className={`rounded-xl overflow-hidden border-2 ${
                  isDark ? 'border-gray-700' : 'border-gray-200'
                }`}>
                  <div className={`aspect-video bg-gray-100 dark:bg-gray-900 flex items-center justify-center relative`}>
                    {uploadedImageUrl ? (
                      <img
                        src={uploadedImageUrl}
                        alt="作品预览"
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x450?text=图片加载失败';
                        }}
                      />
                    ) : (
                      <div className="text-center">
                        <i className="fas fa-image text-4xl text-gray-300 mb-2"></i>
                        <p className="text-gray-400">图片加载中...</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 作品信息 */}
                <div className={`space-y-4 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                  <div>
                    <h4 className="font-semibold mb-1 flex items-center gap-2">
                      <i className="fas fa-heading text-red-500"></i>
                      作品标题
                    </h4>
                    <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      {publishInfo.title || `${state.brandName || '作品'} - 生成变体`}
                    </p>
                  </div>

                  {publishInfo.description && (
                    <div>
                      <h4 className="font-semibold mb-1 flex items-center gap-2">
                        <i className="fas fa-align-left text-blue-500"></i>
                        作品描述
                      </h4>
                      <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'} line-clamp-3`}>
                        {publishInfo.description}
                      </p>
                    </div>
                  )}

                  {publishInfo.tags && (
                    <div>
                      <h4 className="font-semibold mb-1 flex items-center gap-2">
                        <i className="fas fa-tags text-green-500"></i>
                        标签
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {publishInfo.tags.split(',').filter(Boolean).map((tag, idx) => (
                          <span
                            key={idx}
                            className={`px-2 py-1 rounded-full text-xs ${
                              isDark
                                ? 'bg-gray-700 text-gray-300'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {publishInfo.competitionId && (
                    <div>
                      <h4 className="font-semibold mb-1 flex items-center gap-2">
                        <i className="fas fa-trophy text-amber-500"></i>
                        参与活动
                      </h4>
                      <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        {events.find(e => e.id === publishInfo.competitionId)?.title || '已选择活动'}
                      </p>
                    </div>
                  )}
                </div>

                {/* 提示信息 */}
                <div className={`p-4 rounded-lg ${isDark ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-100'}`}>
                  <div className="flex items-start gap-3">
                    <i className="fas fa-info-circle text-blue-500 mt-0.5"></i>
                    <div className="text-sm">
                      <p className={`font-medium ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                        图片已保存到存储
                      </p>
                      <p className={`mt-1 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                        图片已上传到 Supabase Storage，确保在广场中正常显示。点击"确认发布"将作品发布到广场。
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 弹窗底部 */}
              <div className={`sticky bottom-0 p-4 border-t ${
                isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
              }`}>
                <div className="flex justify-end gap-3">
                  <TianjinButton
                    variant="ghost"
                    onClick={() => setShowImagePreview(false)}
                  >
                    取消
                  </TianjinButton>
                  <TianjinButton
                    primary
                    onClick={savePost}
                    leftIcon={<i className="fas fa-check"></i>}
                  >
                    确认发布
                  </TianjinButton>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 确认报名参赛对话框 */}
      <Modal
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        title={
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            确认报名参赛
          </div>
        }
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={isRegistering}
              className={isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : ''}
            >
              取消
            </Button>
            <Button
              onClick={async () => {
                if (!selectedEvent) return;
                
                setIsRegistering(true);
                try {
                  // 获取当前用户ID
                  const { data: { user } } = await supabase.auth.getUser();
                  const userId = user?.id || JSON.parse(localStorage.getItem('user') || '{}')?.id;
                  
                  if (!userId) {
                    toast.error('请先登录后再报名参赛');
                    navigate('/login');
                    return;
                  }

                  // 检查用户是否已报名
                  const { isParticipated } = await eventParticipationService.checkParticipation(selectedEvent.id, userId);
                  
                  if (isParticipated) {
                    toast.info('您已经报名参加了该活动');
                  } else {
                    // 报名参赛
                    const registerResult = await eventParticipationService.registerForEvent(selectedEvent.id, userId);
                    if (!registerResult.success) {
                      toast.error(`报名失败: ${registerResult.error}`);
                      setIsRegistering(false);
                      return;
                    }
                    toast.success('报名成功！');
                  }

                  // 保存选中的活动ID
                  setPublishInfo({...publishInfo, competitionId: selectedEvent.id});
                  
                  // 关闭对话框
                  setShowConfirmDialog(false);
                  
                  // 准备作品提交页面的数据
                  // 获取选中的变体图片或主图片
                  const selectedVariantImage = selectedVariantIndex >= 0 && state.variants 
                    ? state.variants[selectedVariantIndex]?.image 
                    : null;
                  const mainImage = selectedVariantImage || state.imageUrl || uploadedImageUrl || '';
                  
                  // 获取所有生成的变体图片
                  const allImages = state.variants 
                    ? state.variants.map((v, index) => ({
                        url: v.image,
                        script: v.script,
                        isSelected: index === selectedVariantIndex
                      }))
                    : [];
                  
                  const workData = {
                    title: state.brandName || publishInfo.title || '',
                    description: state.inputText || publishInfo.description || '',
                    brandAssets,
                    selectedTemplate,
                    culturalElements,
                    culturalScore,
                    consistencyScore,
                    // 图片相关数据
                    mainImage,
                    allImages,
                    selectedVariantIndex
                  };
                  
                  // 将数据存储到 localStorage，供作品提交页面使用
                  localStorage.setItem('wizard_work_data', JSON.stringify(workData));
                  
                  // 跳转到作品提交页面
                  navigate(`/events/${selectedEvent.id}/submit`);
                  
                } catch (error: any) {
                  console.error('报名参赛失败:', error);
                  toast.error(`报名参赛失败: ${error.message}`);
                } finally {
                  setIsRegistering(false);
                }
              }}
              disabled={isRegistering}
              className="bg-gradient-to-r from-[#C02C38] to-[#D64545] hover:from-[#A82530] hover:to-[#C03A3A] text-white"
            >
              {isRegistering ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  报名中...
                </>
              ) : (
                <>
                  <i className="fas fa-check mr-2"></i>
                  确认报名并提交作品
                </>
              )}
            </Button>
          </div>
        }
      >
        <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
          您选择参加「{selectedEvent?.title}」，确认要报名参赛吗？
        </p>
        
        <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'} my-4`}>
          <h4 className="font-medium mb-2">活动信息</h4>
          <ul className="text-sm space-y-1 text-gray-500">
            <li>活动名称: {selectedEvent?.title}</li>
            <li>截止日期: {selectedEvent?.deadline}</li>
            <li>主办方: {selectedEvent?.organizer}</li>
          </ul>
        </div>
      </Modal>

      {/* 分享选择弹窗 */}
      {shareData && shareUserInfo && (
        <ShareSelector
          isOpen={showShareSelector}
          onClose={() => {
            setShowShareSelector(false);
            setShareData(null);
            setShareUserInfo(null);
          }}
          shareData={shareData}
          userId={shareUserInfo.userId}
          userName={shareUserInfo.userName}
          userAvatar={shareUserInfo.userAvatar}
        />
      )}
    </main>
  );
}
