import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { motion, AnimatePresence } from 'framer-motion';
import BRANDS from '@/lib/brands';
import { useWorkflow } from '@/contexts/workflowContext';
import voiceService from '@/services/voiceService';
import UploadBox from '@/components/UploadBox';
import { scoreAuthenticity } from '@/services/authenticityService';
import postService from '@/services/postService';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { llmService } from '@/services/llmService';
import { TianjinImage, TianjinButton, YangliuqingCard } from '@/components/TianjinStyleComponents';
import AISuggestionBox from '@/components/AISuggestionBox';
import { toast } from 'sonner';
import { ExternalLink } from 'lucide-react';

import { 
  TEMPLATES, 
  COMPETITIONS, 
  CREATIVE_TEMPLATES, 
  BRAND_FONTS,
  EXTENDED_TEMPLATES
} from '@/constants/creativeData';
import { StepIndicator, BrandCard3D, TemplateGallery, RadarChart } from '@/components/wizard';
import { brandService } from '@/services/brandService';
import { eventService } from '@/services/eventService';

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
  const [isConsistencyChecking, setIsConsistencyChecking] = useState(false);
  const [consistencyScore, setConsistencyScore] = useState<number | null>(null);
  const [consistencyDetails, setConsistencyDetails] = useState<{item: string; status: 'pass' | 'warn' | 'fail'; message: string}[]>([]);
  const [isGeneratingVariants, setIsGeneratingVariants] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [newColor, setNewColor] = useState('#000000');
  const [events, setEvents] = useState<ReturnType<typeof eventService.formatEventForDisplay>[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  
  // 模板详情弹窗状态
  const [selectedTemplateDetail, setSelectedTemplateDetail] = useState<typeof CREATIVE_TEMPLATES[0] | null>(null);

  // Load events from database
  useEffect(() => {
    const loadEvents = async () => {
      setIsLoadingEvents(true);
      try {
        const dbEvents = await eventService.getPublishedEvents();
        const formattedEvents = dbEvents.map(eventService.formatEventForDisplay);
        setEvents(formattedEvents.length > 0 ? formattedEvents : COMPETITIONS);
      } catch (error) {
        console.error('Failed to load events:', error);
        setEvents(COMPETITIONS);
      } finally {
        setIsLoadingEvents(false);
      }
    };
    loadEvents();
  }, []);

  const next = () => {
    const newStep = Math.min(4, step + 1);
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
  }, [step]);

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

  const savePost = async () => {
    const title = publishInfo.title || `${state.brandName || '作品'} - 生成变体`;
    const selectedVariant = selectedVariantIndex >= 0 && state.variants ? state.variants[selectedVariantIndex] : state.variants?.[0];
    const baseThumb = selectedVariant?.image || state.imageUrl || '';
    const thumb = baseThumb;

    if (publishInfo.competitionId) {
      toast.success(`已报名参加：${COMPETITIONS.find(c => c.id === publishInfo.competitionId)?.title}`);
    }

    await postService.addPost({
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
    
    reset();
    navigate('/square');
    toast.success(
      <div className="flex items-center justify-between gap-4 min-w-[280px]">
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
      </div>,
      {
        duration: 5000,
        className: 'bg-emerald-50 border-emerald-200 !py-2 !px-3'
      }
    );
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

  const runConsistencyCheck = () => {
    setIsConsistencyChecking(true);
    setTimeout(() => {
      const score = Math.floor(Math.random() * 20) + 80;
      setConsistencyScore(score);
      setConsistencyDetails([
        { item: 'Logo 完整性', status: 'pass', message: 'Logo 清晰可识别，比例恰当' },
        { item: '品牌色使用', status: score >= 90 ? 'pass' : 'warn', message: score >= 90 ? '品牌色使用规范' : '建议增加主色占比' },
        { item: '字体规范', status: score >= 85 ? 'pass' : 'warn', message: score >= 85 ? '字体使用符合规范' : '建议统一字体风格' },
        { item: '文化元素', status: 'pass', message: '文化元素运用得当' },
      ]);
      setIsConsistencyChecking(false);
      toast.success('品牌一致性检查完成');
    }, 1500);
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
    { id: 1, title: '选择品牌', icon: 'store', desc: '选择或输入品牌名称' },
    { id: 2, title: '创意输入', icon: 'pen-nib', desc: '描述您的创意需求' },
    { id: 3, title: '生成变体', icon: 'wand-magic-sparkles', desc: 'AI生成多种方案' },
    { id: 4, title: '评分发布', icon: 'star', desc: '评估并发布作品' }
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
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
                        当前步骤: {step}/4 · {steps[step-1]?.title}
                      </div>
                    </div>
                  </div>
                  
                  {/* 进度条 */}
                  <div className="mt-3">
                    <div className={`h-2 rounded-full ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>
                      <div 
                        className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                        style={{ width: `${(step / 4) * 100}%` }}
                      />
                    </div>
                    <div className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      完成进度: {Math.round((step / 4) * 100)}%
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Header */}
              <div className="text-center space-y-3">
                <h2 className="text-3xl sm:text-4xl font-bold">选择一个老字号品牌</h2>
                <p className={`text-base sm:text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>或者输入您自己的品牌名称，我们将为您定制专属创意方案</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
                {/* Left: Brand Selection */}
                <div className="lg:col-span-3 space-y-6">
                  {/* Search & Filter */}
                  <div className={`p-4 sm:p-6 rounded-2xl ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} border shadow-sm`}>
                    {/* Category Filter */}
                    <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                      {[
                        { id: 'all', name: '全部', icon: 'fa-th-large' },
                        { id: 'tianjin', name: '天津老字号', icon: 'fa-landmark' },
                        { id: 'food', name: '美食', icon: 'fa-utensils' },
                        { id: 'craft', name: '工艺', icon: 'fa-hammer' },
                        { id: 'daily', name: '日用', icon: 'fa-shopping-bag' },
                      ].map(cat => (
                        <button
                          key={cat.id}
                          onClick={() => setSelectedCategory(cat.id as any)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all ${
                            selectedCategory === cat.id
                              ? 'bg-red-600 text-white shadow-md shadow-red-500/20'
                              : (isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700')
                          }`}
                        >
                          <i className={`fas ${cat.icon}`}></i>
                          {cat.name}
                        </button>
                      ))}
                    </div>

                    {/* Search Input */}
                    <div className="relative">
                      <input
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setShowSuggestions(e.target.value.length > 0);
                        }}
                        onFocus={() => setShowSuggestions(searchQuery.length > 0)}
                        placeholder="搜索品牌名称..."
                        className={`w-full p-4 pl-12 text-base rounded-xl border transition-all ${isDark ? 'bg-gray-900 border-gray-700 focus:border-red-500' : 'bg-gray-50 border-gray-200 focus:border-red-500'} focus:ring-2 focus:ring-red-500/20 outline-none`}
                      />
                      <i className="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 opacity-40 text-lg"></i>
                      {searchQuery && (
                        <button 
                          onClick={() => { setSearchQuery(''); setShowSuggestions(false); }}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 opacity-40 hover:opacity-70"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      )}
                    </div>

                    {/* Search Suggestions */}
                    <AnimatePresence>
                      {showSuggestions && searchQuery && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className={`mt-2 p-2 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-100'} max-h-48 overflow-y-auto`}
                        >
                          {filteredBrands.slice(0, 5).map(b => (
                            <button
                              key={b.id}
                              onClick={() => {
                                setState({ brandId: b.id, brandName: b.name });
                                setSearchQuery(b.name);
                                setShowSuggestions(false);
                              }}
                              className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3 ${
                                isDark ? 'hover:bg-gray-600' : 'hover:bg-white'
                              }`}
                            >
                              <img src={b.image} alt={b.name} className="w-10 h-10 rounded-lg object-cover" />
                              <div>
                                <div className="font-medium">{b.name}</div>
                                <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} truncate max-w-[200px]`}>{b.story}</div>
                              </div>
                            </button>
                          ))}
                          {filteredBrands.length === 0 && (
                            <div className="px-4 py-3 text-sm opacity-60">未找到匹配的品牌，将使用自定义品牌</div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Brand Cards Grid */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-lg">
                        {searchQuery ? '搜索结果' : '热门推荐'}
                      </h3>
                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        共 {filteredBrands.length} 个品牌
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[600px] overflow-y-auto">
                      {(searchQuery ? filteredBrands : filteredBrands).map(b => (
                        <motion.button
                          key={b.id}
                          onClick={() => setState({ brandId: b.id, brandName: b.name })}
                          className={`relative p-4 rounded-2xl border-2 text-left transition-all overflow-hidden ${
                            state.brandName === b.name
                              ? 'border-red-500 bg-red-50 dark:bg-red-900/20 shadow-lg shadow-red-500/10'
                              : (isDark ? 'border-gray-700 bg-gray-800 hover:border-gray-600' : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-md')
                          }`}
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-3">
                            <TianjinImage src={b.image} alt={b.name} ratio="landscape" className="w-full h-full" />
                            {state.brandName === b.name && (
                              <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                                <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white">
                                  <i className="fas fa-check"></i>
                                </div>
                              </div>
                            )}
                          </div>
                          <h4 className="font-bold text-sm truncate">{b.name}</h4>
                          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} line-clamp-2 mt-1`}>{b.story}</p>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: Brand Preview & Assets */}
                <div className="lg:col-span-2">
                  <div className={`sticky top-24 p-6 rounded-2xl ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} border shadow-sm`}>
                    {selectedBrand ? (
                      <div className="space-y-6">
                        {/* Brand Header */}
                        <div className="relative aspect-video rounded-xl overflow-hidden shadow-lg">
                          <TianjinImage src={selectedBrand.image} alt={selectedBrand.name} ratio="landscape" className="w-full h-full" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-4">
                            <h3 className="text-white font-bold text-xl">{selectedBrand.name}</h3>
                          </div>
                        </div>

                        {/* Brand Story */}
                        <div>
                          <h4 className="font-bold mb-2 flex items-center gap-2">
                            <i className="fas fa-book-open text-red-500"></i> 品牌故事
                          </h4>
                          <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'} leading-relaxed`}>
                            {selectedBrand.story}
                          </p>
                        </div>

                        {/* Brand Assets Management */}
                        <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                          <h4 className="font-bold mb-4 flex items-center gap-2 text-sm">
                            <i className="fas fa-sliders-h text-blue-500"></i> 品牌资产配置
                          </h4>
                          
                          {/* Logo Upload */}
                          <div className="mb-4">
                            <label className="text-xs opacity-60 mb-2 block">品牌 Logo</label>
                            <div className="flex items-center gap-3">
                              <div className="w-16 h-16 rounded-xl bg-gray-200 dark:bg-gray-600 flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-500">
                                {brandAssets.logo ? (
                                  <img src={brandAssets.logo} className="w-full h-full object-cover" alt="Logo" />
                                ) : (
                                  <i className="fas fa-image opacity-50 text-2xl"></i>
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
                              </div>
                            </div>
                          </div>

                          {/* Brand Colors */}
                          <div className="mb-4">
                            <label className="text-xs opacity-60 mb-2 block">品牌色</label>
                            <div className="flex flex-wrap gap-2 items-center">
                              {brandAssets.colors.map((c, i) => (
                                <div key={i} className="relative group">
                                  <div 
                                    className="w-10 h-10 rounded-xl border-2 border-gray-200 dark:border-gray-600 shadow-sm cursor-pointer transition-transform hover:scale-110"
                                    style={{backgroundColor: c}}
                                    title={c}
                                  />
                                  <button 
                                    onClick={() => removeColor(i)}
                                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                  >
                                    <i className="fas fa-times text-[8px]"></i>
                                  </button>
                                </div>
                              ))}
                              {brandAssets.colors.length < 6 && (
                                <button 
                                  onClick={() => setShowColorPicker(!showColorPicker)}
                                  className="w-10 h-10 rounded-xl border-2 border-dashed border-gray-400 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:border-gray-600 transition-colors"
                                >
                                  <i className="fas fa-plus"></i>
                                </button>
                              )}
                            </div>
                            
                            {/* Color Picker */}
                            <AnimatePresence>
                              {showColorPicker && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="mt-3 flex items-center gap-2"
                                >
                                  <input 
                                    type="color" 
                                    value={newColor}
                                    onChange={(e) => setNewColor(e.target.value)}
                                    className="w-10 h-10 rounded-lg cursor-pointer"
                                  />
                                  <input 
                                    type="text" 
                                    value={newColor}
                                    onChange={(e) => setNewColor(e.target.value)}
                                    className={`flex-1 px-3 py-2 rounded-lg text-sm ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'} border`}
                                  />
                                  <TianjinButton size="sm" onClick={addColor}>添加</TianjinButton>
                                  <button onClick={() => setShowColorPicker(false)} className="px-2 text-gray-400 hover:text-gray-600">
                                    <i className="fas fa-times"></i>
                                  </button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                          {/* Brand Font */}
                          <div>
                            <label className="text-xs opacity-60 mb-2 block">品牌字体</label>
                            <select 
                              value={brandAssets.font}
                              onChange={(e) => setBrandAssets({...brandAssets, font: e.target.value})}
                              className={`w-full px-3 py-2 rounded-lg text-sm ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'} border`}
                            >
                              {BRAND_FONTS.map(f => (
                                <option key={f.id} value={f.id}>{f.name} - {f.desc}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="flex gap-2">
                          <TianjinButton 
                            variant="secondary" 
                            fullWidth
                            onClick={() => setState({ brandId: undefined, brandName: '' })}
                          >
                            重新选择
                          </TianjinButton>
                          <TianjinButton 
                            primary 
                            fullWidth
                            onClick={next}
                            rightIcon={<i className="fas fa-arrow-right"></i>}
                          >
                            确认选择
                          </TianjinButton>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12 opacity-50">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-500 to-amber-500 flex items-center justify-center mx-auto mb-6">
                          <i className="fas fa-store text-white text-4xl"></i>
                        </div>
                        <h3 className="text-lg font-bold mb-2">尚未选择品牌</h3>
                        <p className="text-sm">请在左侧搜索或选择品牌以开始创作</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Creative Templates */}
              <div>
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <i className="fas fa-lightbulb text-yellow-500"></i> 创意模板
                </h3>
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
              </div>

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

          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
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

          {step === 4 && (
            <motion.div 
              key="step4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
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
                          <path
                            className="text-red-500"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeDasharray={`${scoreAuthenticity(state.inputText || '', '').score}, 100`}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-2xl font-black text-red-600">
                            {scoreAuthenticity(state.inputText || '', '').score}
                          </span>
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
                          {['传统元素', '地方特色', '文化内涵'].map(tag => (
                            <span key={tag} className={`px-2 py-1 rounded-full text-xs ${isDark ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-50 text-amber-700'}`}>
                              {tag}
                            </span>
                          ))}
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
                  <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                    <i className="fas fa-upload text-green-500"></i> 发布作品
                  </h3>
                  
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

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        <i className="fas fa-trophy text-gray-400 mr-1"></i> 参与赛事 (可选)
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
                              onClick={() => setPublishInfo({...publishInfo, competitionId: publishInfo.competitionId === c.id ? '' : c.id})}
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
              步骤 {step}/4: {steps[step-1].title}
            </span>
            
            {step === 4 ? (
              <TianjinButton 
                primary 
                onClick={savePost} 
                rightIcon={<i className="fas fa-check"></i>}
                disabled={!publishInfo.title}
              >
                发布并完成
              </TianjinButton>
            ) : (
              <TianjinButton 
                primary 
                onClick={next} 
                disabled={(step === 1 && !state.brandName) || (step === 2 && !state.inputText) || (step === 3 && selectedVariantIndex < 0)} 
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
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
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
    </main>
  );
}
