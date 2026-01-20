import { useState, useContext, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '@/contexts/authContext';
import { toast } from 'sonner';
import CollaborationPanel from '@/components/CollaborationPanel';
import AIReview from '@/components/AIReview';
import ModelSelector from '@/components/ModelSelector';
import { TianjinImage } from '@/components/TianjinStyleComponents';
import { llmService } from '../services/llmService';
import doubao, { createVideoTask, pollVideoTask } from '@/services/doubao'
import { promptTemplates } from '@/data/promptTemplates';
import errorService from '@/services/errorService';
import voiceService from '@/services/voiceService';

// 模拟AI生成结果
const aiGeneratedResults = [
  {
    id: 1,
    thumbnail: 'https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=600&h=400&fit=crop',
    score: 85,
  },
  {
    id: 2,
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=AI%20generated%20traditional%20Chinese%20design%202',
    score: 78,
  },
  {
    id: 3,
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=AI%20generated%20traditional%20Chinese%20design%203',
    score: 92,
  },
  {
    id: 4,
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=AI%20generated%20traditional%20Chinese%20design%204',
    score: 75,
  },
];

// 传统纹样素材
const traditionalPatterns = [
  {
    id: 1,
    name: '云纹',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Traditional%20Chinese%20cloud%20pattern',
    description: '象征吉祥如意，常用于传统服饰和建筑',
  },
  {
    id: 2,
    name: '龙纹',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Traditional%20Chinese%20dragon%20pattern',
    description: '象征权力与尊贵，中国传统文化的重要象征',
  },
  {
    id: 3,
    name: '凤纹',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Traditional%20Chinese%20phoenix%20pattern',
    description: '象征美好与幸福，常与龙纹配合使用',
  },
  {
    id: 4,
    name: '回纹',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Traditional%20Chinese%20key%20pattern',
    description: '寓意吉祥绵延，是传统装饰中常见的纹样',
  },
  {
    id: 5,
    name: '花卉纹',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Traditional%20Chinese%20flower%20pattern',
    description: '象征自然与生机，常见牡丹、莲花等纹样',
  },
  {
    id: 6,
    name: '几何纹',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Traditional%20Chinese%20geometric%20pattern',
    description: '简洁明快，富有节奏感和韵律感',
  },
];

// 创作工具类型
 type ToolType = 'sketch' | 'pattern' | 'filter' | 'trace' | 'remix' | 'layout' | 'mockup' | 'tile';

// 统一创作状态接口
interface CreateState {
  activeTool: ToolType;
  prompt: string;
  generatedResults: typeof aiGeneratedResults;
  selectedResult: number | null;
  isGenerating: boolean;
  showCulturalInfo: boolean;
  currentStep: number;
  isLoading: boolean;
  showCollaborationPanel: boolean;
  showAIReview: boolean;
  showModelSelector: boolean;
  isPrecheckEnabled: boolean;
  precheckResult: {
    status: 'pending' | 'passed' | 'warning' | 'failed';
    issues: { type: string; severity: 'warning' | 'error'; message: string }[];
  } | null;
  aiExplanation: string;
  explainCollapsed: boolean;
  fusionMode: boolean;
  isRegenerating: boolean;
  isEngineGenerating: boolean;
  isPolishing: boolean;
  stylePreset: string;
  generateCount: number;
  favorites: Array<{ id: number; thumbnail: string }>;
  videoGenerating: boolean;
  culturalInfoText: string;
  promptB: string;
  isFusing: boolean;
  lastUpdatedAt: number | null;
  selectedPatternId: number | null;
  filterName: string;
  streamStatus: 'idle' | 'running' | 'paused' | 'completed' | 'error';
  abortController: AbortController | null;
  filterIntensity: number;
  autoGenerate: boolean;
  showQuickActions: boolean;
  showEngineDetails: boolean;
  recentPatterns: number[];
  recentFilters: Array<{ name: string; intensity: number }>;
  generatingPlan: boolean;
  genError: string;
  curationTemplate: string;
  customTemplates: Record<string, string>;
  showTemplateEditor: boolean;
  newTemplateName: string;
  newTemplateGuide: string;
  savedPlans: Array<{ id: string; title: string; query: string; aiText: string; ts: number }>;
}

export default function Create() {
  const { isDark } = useTheme();
  const { isAuthenticated, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  
  // 创作状态
  const [activeTool, setActiveTool] = useState<ToolType>('sketch');
  const [prompt, setPrompt] = useState('');
  const [generatedResults, setGeneratedResults] = useState(aiGeneratedResults);
  const [selectedResult, setSelectedResult] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCulturalInfo, setShowCulturalInfo] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [showCollaborationPanel, setShowCollaborationPanel] = useState(false);
  const [showAIReview, setShowAIReview] = useState(false);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [isPrecheckEnabled, setIsPrecheckEnabled] = useState(true);
  const [precheckResult, setPrecheckResult] = useState<{
    status: 'pending' | 'passed' | 'warning' | 'failed';
    issues: { type: string; severity: 'warning' | 'error'; message: string }[];
  } | null>(null);
  const [aiExplanation, setAiExplanation] = useState('');
  const [explainCollapsed, setExplainCollapsed] = useState(false);
  
  // 新增状态
  const [fusionMode, setFusionMode] = useState<boolean>(false);
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);
  const [isEngineGenerating, setIsEngineGenerating] = useState<boolean>(false);
  const [isPolishing, setIsPolishing] = useState<boolean>(false);
  const [stylePreset, setStylePreset] = useState<string>('');
  const [generateCount, setGenerateCount] = useState<number>(3);
  const [favorites, setFavorites] = useState<Array<{ id: number; thumbnail: string }>>([]);
  const [videoGenerating, setVideoGenerating] = useState<boolean>(false);
  const [culturalInfoText, setCulturalInfoText] = useState<string>('云纹是中国传统装饰纹样中常见的一种，象征着吉祥如意、高升和祥瑞。');
  const [promptB, setPromptB] = useState<string>('');
  const [isFusing, setIsFusing] = useState<boolean>(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const [selectedPatternId, setSelectedPatternId] = useState<number | null>(null);
  const [filterName, setFilterName] = useState<string>('复古胶片');
  const [streamStatus, setStreamStatus] = useState<'idle' | 'running' | 'paused' | 'completed' | 'error'>('idle');
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [filterIntensity, setFilterIntensity] = useState<number>(5);
  const [autoGenerate, setAutoGenerate] = useState<boolean>(false);
  const [showQuickActions, setShowQuickActions] = useState<boolean>(false);
  const [showEngineDetails, setShowEngineDetails] = useState<boolean>(false);
  const [recentPatterns, setRecentPatterns] = useState<number[]>([]);
  const [recentFilters, setRecentFilters] = useState<Array<{ name: string; intensity: number }>>([]);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [genError, setGenError] = useState('');
  const [curationTemplate, setCurationTemplate] = useState<string>('标准');
  const [customTemplates, setCustomTemplates] = useState<Record<string, string>>({});
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateGuide, setNewTemplateGuide] = useState('');
  const [savedPlans, setSavedPlans] = useState<Array<{ id: string; title: string; query: string; aiText: string; ts: number }>>(() => {
    try { return JSON.parse(localStorage.getItem('TOOLS_SAVED_PLANS') || '[]'); } catch { return []; }
  });
  const [modelId, setModelId] = useState<'kimi' | 'doubao' | 'qwen'>(llmService.getCurrentModel().id as any);
  const [aiText, setAiText] = useState('');
  const [aiDirections, setAiDirections] = useState<string[]>([]);
  const [isGeneratingCopy, setIsGeneratingCopy] = useState(false);
  const [audioSrc, setAudioSrc] = useState<string>('');
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  
  // 引用
  const toolRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const quickActionsRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const aiCopyRef = useRef<HTMLDivElement | null>(null);
  const variantsRef = useRef<HTMLDivElement | null>(null);
  
  // 自动保存设置
  const [autosaveEnabled, setAutosaveEnabled] = useState<boolean>(() => {
    try { return JSON.parse(localStorage.getItem('CREATE_AUTOSAVE_ENABLED') || 'true') } catch { return true }
  })
  const [autosaveIntervalSec, setAutosaveIntervalSec] = useState<number>(() => {
    try { return JSON.parse(localStorage.getItem('CREATE_AUTOSAVE_INTERVAL_SEC') || '30') } catch { return 30 }
  })
  
  // 历史快照
  interface CreateSnapshot {
    prompt: string;
    selectedResult: number | null;
    currentStep: number;
    aiExplanation: string;
    scale: number; brightness: number; contrast: number; saturate: number; hueRotate: number; blur: number;
    overlayText: string; overlaySize: number; overlayColor: string;
    updatedAt: number;
  }
  const [snapshots, setSnapshots] = useState<CreateSnapshot[]>(() => {
    try { return JSON.parse(localStorage.getItem('CREATE_HISTORY') || '[]') } catch { return [] }
  })
  
  // 编辑工具状态
  const [activeEditTool, setActiveEditTool] = useState<'resize' | 'filter' | 'color' | 'text' | 'layers' | 'history' | null>(null);
  const [scale, setScale] = useState<number>(1);
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [saturate, setSaturate] = useState<number>(100);
  const [hueRotate, setHueRotate] = useState<number>(0);
  const [blur, setBlur] = useState<number>(0);
  const [overlayText, setOverlayText] = useState<string>('');
  const [overlaySize, setOverlaySize] = useState<number>(20);
  const [overlayColor, setOverlayColor] = useState<string>('#111827');
  const [editToolsCollapsed, setEditToolsCollapsed] = useState<boolean>(false);
  const [history, setHistory] = useState<Array<{ scale: number; brightness: number; contrast: number; saturate: number; hueRotate: number; blur: number; overlayText: string; overlaySize: number; overlayColor: string }>>([]);
  const [redoStack, setRedoStack] = useState<typeof history>([]);
  
  // 模板指南
  const templateGuides: Record<string, string> = {
    '标准': '包含：1) 创作方向，2) 视觉风格，3) 配色建议（可引用传统色），4) 文化元素融合建议，5) 可落地物料清单（海报/包装/IP形象等），语言精炼、结构清晰、可执行',
    '商业合作': '面向品牌联合与商业落地：1) 品牌契合点与受众画像，2) 视觉与物料清单（KV/包装/周边），3) 预算与里程碑（简要），4) 风险与合规注意事项，语气专业',
    '校园活动': '适用于校园传播与比赛组织：1) 主题设计与互动玩法，2) 视觉风格与配色，3) 活动物料清单，4) 宣传渠道与执行建议',
    '文旅宣传': '面向文旅场景：1) 地域文化元素融入策略，2) 视觉风格与配色，3) 物料清单（海报/导览/纪念品），4) 场景落地建议',
    '社媒传播': '适用于社媒运营：1) 内容主题与排期，2) 视觉风格与模板，3) 互动话题与标签，4) KPI与复盘建议'
  };
  
  // 初始化
  useEffect(() => {
    try {
      const saved = localStorage.getItem('TOOLS_CURATION_TEMPLATE');
      if (saved && templateGuides[saved]) setCurationTemplate(saved as any);
      const savedCustom = localStorage.getItem('TOOLS_CURATION_CUSTOM_TEMPLATES');
      if (savedCustom) setCustomTemplates(JSON.parse(savedCustom));
    } catch {}
  }, []);
  
  // 保存模板设置
  useEffect(() => {
    try {
      localStorage.setItem('TOOLS_CURATION_TEMPLATE', curationTemplate);
      localStorage.setItem('TOOLS_CURATION_CUSTOM_TEMPLATES', JSON.stringify(customTemplates));
    } catch {}
  }, [curationTemplate, customTemplates]);
  
  // 监听外部点击关闭快速操作
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (quickActionsRef.current && !quickActionsRef.current.contains(e.target as Node)) {
        setShowQuickActions(false);
      }
    };
    if (showQuickActions) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showQuickActions]);
  
  // 保存历史和设置
  useEffect(() => {
    try {
      localStorage.setItem('CREATE_HISTORY', JSON.stringify(snapshots.slice(0, 20)));
      localStorage.setItem('CREATE_AUTOSAVE_ENABLED', JSON.stringify(autosaveEnabled));
      localStorage.setItem('CREATE_AUTOSAVE_INTERVAL_SEC', JSON.stringify(autosaveIntervalSec));
    } catch {}
  }, [snapshots, autosaveEnabled, autosaveIntervalSec]);
  
  // 从URL参数加载工具和提示词
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const t = params.get('tool');
    if (t && ['sketch','pattern','filter','trace','remix','layout','mockup','tile'].includes(t)) {
      setActiveTool(t as ToolType);
    }
    const p = params.get('prompt');
    if (p) {
      setPrompt(p);
      setSelectedResult(null);
      setCurrentStep(1);
      setAiExplanation('');
    }
  }, [location.search]);
  
  // 加载最近使用的纹样和滤镜
  useEffect(() => {
    try {
      const raw = localStorage.getItem('CREATE_RECENTS');
      if (raw) {
        const obj = JSON.parse(raw);
        if (Array.isArray(obj.patterns)) setRecentPatterns(obj.patterns.slice(0, 5));
        if (Array.isArray(obj.filters)) setRecentFilters(obj.filters.slice(0, 5));
      }
    } catch {}
  }, []);
  
  // 保存草稿
  useEffect(() => {
    try {
      const data = {
        prompt,
        selectedResult,
        currentStep,
        aiExplanation,
        updatedAt: Date.now()
      };
      localStorage.setItem('CREATE_DRAFT', JSON.stringify(data));
    } catch {}
  }, [prompt, selectedResult, currentStep, aiExplanation]);
  
  // 检查登录状态
  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/login');
    } else {
      setTimeout(() => {
        setIsLoading(false);
        try {
          const saved = localStorage.getItem('CREATE_DRAFT');
          if (saved) {
            const d = JSON.parse(saved);
            const params = new URLSearchParams(location.search);
            const qp = params.get('prompt');
            if (!qp && typeof d.prompt === 'string') setPrompt(d.prompt);
            if (typeof d.selectedResult === 'number' || d.selectedResult === null) setSelectedResult(d.selectedResult);
            if (typeof d.currentStep === 'number') setCurrentStep(d.currentStep);
            if (typeof d.aiExplanation === 'string') setAiExplanation(d.aiExplanation);
            if (typeof d.updatedAt === 'number') setLastUpdatedAt(d.updatedAt);
          }
        } catch {}
      }, 800);
    }
  }, [isAuthenticated, user, navigate]);
  
  // 自动生成
  useEffect(() => {
    if (selectedResult) setShowQuickActions(true);
  }, [selectedResult]);
  
  // 生成当前快照对象
  const buildSnapshot = (): CreateSnapshot => ({
    prompt,
    selectedResult,
    currentStep,
    aiExplanation,
    scale, brightness, contrast, saturate, hueRotate, blur,
    overlayText, overlaySize, overlayColor,
    updatedAt: Date.now(),
  });
  
  // 执行保存
  const performSave = useCallback((reason: 'manual' | 'autosave' | 'beforeunload' = 'manual') => {
    try {
      const snap = buildSnapshot();
      localStorage.setItem('CREATE_DRAFT', JSON.stringify(snap));
      setLastUpdatedAt(snap.updatedAt);
      setSnapshots(prev => [snap, ...prev].slice(0, 20));
      if (reason === 'manual') toast.success('已保存到草稿与历史');
    } catch {
      if (reason === 'manual') toast.error('保存失败');
    }
  }, [prompt, selectedResult, currentStep, aiExplanation, scale, brightness, contrast, saturate, hueRotate, blur, overlayText, overlaySize, overlayColor]);
  
  // 自动保存定时器
  useEffect(() => {
    if (!autosaveEnabled) return;
    const ms = Math.max(autosaveIntervalSec, 5) * 1000;
    const timer = setInterval(() => performSave('autosave'), ms);
    return () => clearInterval(timer);
  }, [autosaveEnabled, autosaveIntervalSec, performSave]);
  
  // 页面关闭/刷新前保存
  useEffect(() => {
    const handler = () => { try { performSave('beforeunload') } catch {} };
    window.addEventListener('beforeunload', handler);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') handler() });
    return () => { window.removeEventListener('beforeunload', handler) };
  }, []);
  
  // 历史记录操作
  const pushHistory = () => {
    setHistory((h) => [...h.slice(-19), { scale, brightness, contrast, saturate, hueRotate, blur, overlayText, overlaySize, overlayColor }]);
    setRedoStack([]);
  };
  
  const undo = () => {
    setHistory((h) => {
      if (!h.length) return h;
      const prev = h[h.length - 1];
      setRedoStack((r) => [...r, { scale, brightness, contrast, saturate, hueRotate, blur, overlayText, overlaySize, overlayColor }]);
      setScale(prev.scale);
      setBrightness(prev.brightness);
      setContrast(prev.contrast);
      setSaturate(prev.saturate);
      setHueRotate(prev.hueRotate);
      setBlur(prev.blur);
      setOverlayText(prev.overlayText);
      setOverlaySize(prev.overlaySize);
      setOverlayColor(prev.overlayColor);
      return h.slice(0, -1);
    });
  };
  
  const redo = () => {
    setRedoStack((r) => {
      if (!r.length) return r;
      const next = r[r.length - 1];
      pushHistory();
      setScale(next.scale);
      setBrightness(next.brightness);
      setContrast(next.contrast);
      setSaturate(next.saturate);
      setHueRotate(next.hueRotate);
      setBlur(next.blur);
      setOverlayText(next.overlayText);
      setOverlaySize(next.overlaySize);
      setOverlayColor(next.overlayColor);
      return r.slice(0, -1);
    });
  };
  
  // 模板相关
  const allTemplateGuides = useMemo(() => ({ ...templateGuides, ...customTemplates }), [customTemplates]);
  
  const curationPromptPreview = useMemo(() => {
    const guide = allTemplateGuides[curationTemplate] || templateGuides['标准'];
    const desc = (prompt || '').trim();
    return `请基于以下输入生成一个“${curationTemplate}”风格的国潮与非遗策展方案：${guide}。\n\n创作提示：${desc || '无'}；工具：${activeTool}；风格预设：${stylePreset || '无'}`;
  }, [curationTemplate, allTemplateGuides, prompt, activeTool, stylePreset]);
  
  // 生成策展方案
  const handleGenerateCurationPlan = useCallback(async () => {
    try {
      setGenError('');
      setGeneratingPlan(true);
      const aiText = await llmService.generateResponse(curationPromptPreview);
      const plan = {
        id: `curation-${Date.now()}`,
        title: `策展方案（${curationTemplate}）`,
        query: (prompt || `${activeTool}${stylePreset ? ' · ' + stylePreset : ''}`),
        aiText,
        ts: Date.now(),
      };
      const next = [plan, ...savedPlans].slice(0, 20);
      setSavedPlans(next);
      try { localStorage.setItem('TOOLS_SAVED_PLANS', JSON.stringify(next)); } catch {}
    } catch (e: unknown) {
      setGenError('生成失败：请检查密钥配置或稍后重试');
    } finally {
      setGeneratingPlan(false);
    }
  }, [curationPromptPreview, curationTemplate, prompt, activeTool, stylePreset, savedPlans]);
  
  // 取消生成
  const handleCancelGenerate = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setStreamStatus('idle');
      setIsGenerating(false);
      toast.info('AI生成已取消');
    }
  };
  
  // 生成AI创作说明
  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      toast.error('请输入创作提示');
      return;
    }
    
    setIsGenerating(true);
    setStreamStatus('running');
    setAiExplanation('');
    
    const controller = new AbortController();
    setAbortController(controller);
    
    try {
      const cfg = llmService.getConfig();
      if (cfg.stream) {
        await llmService.directGenerateResponse(prompt, {
          onDelta: (full) => {
            setAiExplanation(full);
          },
          signal: controller.signal
        });
      } else {
        const withStyle = stylePreset ? `${prompt}；风格：${stylePreset}` : prompt;
        const resp = await llmService.directGenerateResponse(withStyle, {
          signal: controller.signal
        });
        setAiExplanation(resp);
      }
      
      setStreamStatus('completed');
      setCurrentStep(2);
      toast.success('AI创作完成！请选择一个方案进行编辑');
      
      setGeneratedResults(aiGeneratedResults);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        setStreamStatus('idle');
      } else {
        setStreamStatus('error');
        toast.error('生成失败，请稍后重试');
      }
    } finally {
      setIsGenerating(false);
      setAbortController(null);
    }
  }, [prompt, stylePreset, aiGeneratedResults]);
  
  // 生成三个变体
  const generateThreeVariants = useCallback(async () => {
    const inputBase = (prompt || '天津文化设计灵感').trim();
    const input = stylePreset ? `${inputBase}；风格：${stylePreset}` : inputBase;
    const currentModel = llmService.getCurrentModel();
    setIsEngineGenerating(true);
    try {
      const r = await llmService.generateImage({ prompt: input, size: '1024x1024', n: Math.min(Math.max(generateCount, 1), 6), response_format: 'url', watermark: true });
      const list = (r as { data?: { data?: Array<{ url?: string; b64_json?: string }> } })?.data?.data || [];
      const urls = list.map((d: { url?: string; b64_json?: string }) => {
        if (d?.url) return d.url;
        if (d?.b64_json) return `data:image/png;base64,${d.b64_json}`;
        return '';
      }).filter((u: string) => !!u);
      
      if (urls.length) {
        const mapped = urls.map((u: string, idx: number) => ({ id: idx + 1, thumbnail: u, score: 80 }));
        setGeneratedResults(mapped);
        setSelectedResult(mapped[0]?.id ?? null);
        setCurrentStep(2);
        toast.success(`${currentModel.name}已生成${urls.length}张方案`);
      } else {
        const fallback = [
          { id: 1, thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Tianjin%20design%20A', score: 80 },
          { id: 2, thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Tianjin%20design%20B', score: 80 },
          { id: 3, thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Tianjin%20design%20C', score: 80 }
        ];
        setGeneratedResults(fallback);
        setSelectedResult(1);
        setCurrentStep(2);
        toast.info(`${currentModel.name}未返回图片，已提供占位图`);
      }
    } catch (e) {
      toast.error(`${currentModel.name}生成失败，已保留现有方案`);
    } finally {
      setIsEngineGenerating(false);
    }
  }, [prompt, stylePreset, generateCount]);
  
  // 应用纹样嵌入
  const applySelectedPatternEmbed = useCallback(() => {
    const base = (prompt || '').trim();
    const pat = traditionalPatterns.find(p => p.id === selectedPatternId);
    const name = pat?.name || '传统纹样';
    const next = `${base}，嵌入${name}纹样元素，强调协调与文化表达`;
    setPrompt(next);
    toast.success('已嵌入纹样到提示词');
    if (selectedPatternId) {
      setRecentPatterns(prev => {
        const nextArr = [selectedPatternId!, ...prev.filter(x => x !== selectedPatternId)].slice(0, 5);
        try { localStorage.setItem('CREATE_RECENTS', JSON.stringify({ patterns: nextArr, filters: recentFilters })); } catch {}
        return nextArr;
      });
    }
    if (autoGenerate) {
        generateThreeVariants();
      }
  }, [prompt, selectedPatternId, recentFilters, autoGenerate, generateThreeVariants]);
  
  // 应用滤镜
  const applyFilterToPrompt = useCallback(() => {
    const base = (prompt || '').trim();
    const next = `${base}；滤镜：${filterName}；强度：${filterIntensity}/10`;
    setPrompt(next);
    toast.success('已应用AI滤镜到提示词');
    setRecentFilters(prev => {
      const key = `${filterName}:${filterIntensity}`;
      const nextArr = [{ name: filterName, intensity: filterIntensity }, ...prev.filter(f => `${f.name}:${f.intensity}` !== key)].slice(0, 5);
      try { localStorage.setItem('CREATE_RECENTS', JSON.stringify({ patterns: recentPatterns, filters: nextArr })); } catch {}
      return nextArr;
    });
    if (autoGenerate) {
        generateThreeVariants();
      }
  }, [prompt, filterName, filterIntensity, recentPatterns, autoGenerate, generateThreeVariants]);
  
  // 润色提示词
  const handlePolishPrompt = useCallback(async () => {
    if (!prompt.trim()) {
      toast.error('请输入创作提示');
      return;
    }
    setIsPolishing(true);
    try {
      const instruction = `请将下面的创作提示优化为更清晰的中文指令，保留原意，突出关键元素（主题、风格、色彩、素材）。用1-3个短句表达，避免礼貌语或解释，只输出优化后的文本：\n\n${prompt}`;
      const result = await llmService.generateResponse(instruction);
      const polished = String(result || '').trim();
      if (polished) {
        setPrompt(polished);
        toast.success('润色完成');
      } else {
        toast.warning('未获得有效润色结果');
      }
    } catch (e) {
      toast.error('润色失败，请稍后重试');
    } finally {
      setIsPolishing(false);
    }
  }, [prompt]);
  
  // 随机灵感
  const handleRandomInspiration = useCallback(() => {
    try {
      const pool = promptTemplates || [];
      if (!pool.length) {
        toast.info('暂未找到模板');
        return;
      }
      const pick = pool[Math.floor(Math.random() * pool.length)];
      setPrompt(pick.text);
      toast.success('已填充随机灵感模板');
    } catch {
      toast.error('随机灵感失败');
    }
  }, []);
  
  // 选择结果
  const handleSelectResult = useCallback((id: number) => {
    setSelectedResult(id);
    setCurrentStep(3);
  }, []);
  
  // 重新生成选中结果
  const regenerateSelected = async () => {
    if (!selectedResult) {
      toast.error('请先在上一步选择一个方案');
      return;
    }
    const input = (prompt || '天津文化设计灵感').trim();
    const currentModel = llmService.getCurrentModel();
    setIsRegenerating(true);
    try {
      const r = await llmService.generateImage({ prompt: input, size: '1024x1024', n: 1, response_format: 'url', watermark: true });
      const list = (r as any)?.data?.data || [];
      const url = list[0]?.url || (list[0]?.b64_json ? `data:image/png;base64,${list[0].b64_json}` : '');
      if (url) {
        setGeneratedResults(prev => prev.map(item => item.id === selectedResult ? { ...item, thumbnail: url } : item));
        toast.success(`${currentModel.name}已重新生成并更新预览`);
      } else {
        toast.info(`${currentModel.name}未返回图片，保持原图不变`);
      }
    } catch (e) {
      toast.error(`${currentModel.name}生成失败，请稍后重试`);
    } finally {
      setIsRegenerating(false);
    }
  };
  
  // 融合生成
  const handleFusionGenerate = useCallback(async () => {
    const a = (prompt || '').trim();
    const b = (promptB || '').trim();
    if (!a || !b) {
      toast.error('请填写两个提示词进行融合');
      return;
    }
    setIsFusing(true);
    try {
      const instruction = `请将以下两个中文提示融合为一个更具创意且结构清晰的中文指令：保留核心主题，强调风格与版式要点；输出2-3句精炼描述，无多余解释：\n\n提示A：${a}\n提示B：${b}`;
      const merged = String(await llmService.generateResponse(instruction) || '').trim();
      const finalPrompt = merged || `${a} 与 ${b} 的融合设计`;
      setPrompt(finalPrompt);
      setFusionMode(true);
      await generateThreeVariants();
      toast.success('融合生成完成，已更新三张方案');
      setCurrentStep(2);
    } catch {
      toast.error('融合生成失败，请稍后重试');
    } finally {
      setIsFusing(false);
    }
  }, [prompt, promptB, generateThreeVariants]);
  
  // 生成变体
  const generateVariantForSelected = async () => {
    if (!selectedResult) {
      toast.error('请先选择一个方案');
      return;
    }
    const base = (prompt || '天津文化设计灵感').trim();
    const currentModel = llmService.getCurrentModel();
    setIsRegenerating(true);
    try {
      const r = await llmService.generateImage({ prompt: `${base} 的创意变体`, size: '1024x1024', n: 1, response_format: 'url', watermark: true });
      const list = (r as any)?.data?.data || [];
      const url = list[0]?.url || (list[0]?.b64_json ? `data:image/png;base64,${list[0].b64_json}` : '');
      if (url) {
        setGeneratedResults(prev => prev.map(item => item.id === selectedResult ? { ...item, thumbnail: url } : item));
        toast.success(`${currentModel.name}已生成变体并更新预览`);
      } else {
        toast.info(`${currentModel.name}未获取到变体图片`);
      }
    } catch {
      toast.error(`${currentModel.name}变体生成失败`);
    } finally {
      setIsRegenerating(false);
    }
  };
  
  // 收藏/取消收藏
  const toggleFavorite = useCallback((id: number) => {
    const item = generatedResults.find(r => r.id === id);
    if (!item) return;
    setFavorites(prev => {
      const exists = prev.some(f => f.id === id);
      if (exists) return prev.filter(f => f.id !== id);
      return [...prev, { id, thumbnail: item.thumbnail }];
    });
  }, [generatedResults]);
  
  // 下载选中图片
  const downloadSelected = useCallback(async () => {
    if (!selectedResult) { toast.error('请先选择一个方案'); return; }
    const url = generatedResults.find(r => r.id === selectedResult)?.thumbnail || '';
    if (!url) { toast.error('未找到图片'); return; }
    try {
      const a = document.createElement('a');
      a.href = url;
      a.download = `design_${selectedResult}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success('已开始下载');
    } catch {
      toast.error('下载失败');
    }
  }, [selectedResult, generatedResults]);
  
  // 复制选中链接
  const copySelectedLink = useCallback(async () => {
    if (!selectedResult) { toast.error('请先选择一个方案'); return; }
    const url = generatedResults.find(r => r.id === selectedResult)?.thumbnail || '';
    try {
      await navigator.clipboard.writeText(url);
      toast.success('已复制图片链接');
    } catch {
      toast.error('复制失败');
    }
  }, [selectedResult, generatedResults]);
  
  // 生成视频
  const generateVideoForSelected = async () => {
    let sel = selectedResult;
    if (!sel) {
      const first = generatedResults[0]?.id;
      if (first) {
        setSelectedResult(first);
        sel = first;
      } else {
        toast.error('请先选择一个方案');
        return;
      }
    }
    const item = generatedResults.find(r => r.id === sel);
    const imgUrl = item?.thumbnail || '';
    if (!imgUrl) { toast.error('未找到图片'); return; }
    if (imgUrl.startsWith('data:')) {
      toast.error('首帧为本地数据，需使用可公网访问的图片URL');
      return;
    }
    const text = `${prompt}  --resolution 720p  --duration 5 --camerafixed false`;
    setVideoGenerating(true);
    try {
      const created = await createVideoTask({ model: 'doubao-seedance-1-0-pro-250528', content: [{ type: 'text', text }, { type: 'image_url', image_url: { url: imgUrl } }] });
      if (!created.ok || !created.data?.id) {
        const code = (created as any)?.error || (created as any)?.data?.error?.code || 'UNKNOWN';
        const msg = (created as any)?.error === 'CONFIG_MISSING' ? '服务端未配置 DOUBAO_API_KEY，请在 .env.local 设置后重启' : `创建视频任务失败：${code}`;
        toast.error(msg);
        return;
      }
      const taskId = created.data.id;
      const polled = await pollVideoTask(taskId, { intervalMs: 10000, timeoutMs: 600000 });
      if (!polled.ok) {
        const code = (polled as any)?.error || (polled as any)?.data?.error?.code || 'UNKNOWN';
        const msg = (polled as any)?.error === 'CONFIG_MISSING' ? '服务端未配置 DOUBAO_API_KEY，请在 .env.local 设置后重启' : `查询视频任务失败：${code}`;
        toast.error(msg);
        return;
      }
      const status = polled.data?.status;
      const url = polled.data?.content?.video_url || '';
      if (status === 'succeeded' && url) {
        setGeneratedResults(arr => arr.map(it => it.id === sel ? { ...it, video: url } as any : it));
        toast.success('视频生成完成');
      } else {
        const code = polled.data?.error?.code || polled.data?.error?.message || polled.data?.status || 'UNKNOWN';
        toast.error(`视频生成失败：${code}`);
        setGeneratedResults(arr => arr.map(it => it.id === sel ? { ...it, video: `视频生成失败：${code}` } as any : it));
      }
    } catch (e: any) {
      errorService.logError(e instanceof Error ? e : 'SERVER_ERROR', { scope: 'generation-video', prompt });
      toast.error('视频生成异常');
      setGeneratedResults(arr => arr.map(it => it.id === sel ? { ...it, video: '视频生成失败' } as any : it));
    } finally {
      setVideoGenerating(false);
    }
  };
  
  // 文化识别
  const analyzeCulturalElements = useCallback(async () => {
    const base = (prompt || '中国传统文化元素').trim();
    try {
      const instruction = `请用中文概括该创作提示涉及的文化元素（最多60字，通俗易懂）：\n\n${base}`;
      const text = String(await llmService.generateResponse(instruction) || '').trim();
      if (text) setCulturalInfoText(text);
      setShowCulturalInfo(true);
      toast.success('文化识别完成');
    } catch {
      setShowCulturalInfo(true);
      toast.error('文化识别失败，已显示默认说明');
    }
  }, [prompt]);
  
  // 优化并朗读
  const optimizeAndRead = async (src?: string) => {
    const base = (src ?? prompt).trim();
    if (!base) { toast.warning('请输入提示词'); return; }
    setIsGeneratingCopy(true);
    setAiText('');
    try {
      llmService.setCurrentModel(modelId);
      const dirs = llmService.generateCreativeDirections(base);
      setAiDirections(dirs);
      const zhPolicy = '请用中文分点回答，去除所有 Markdown 标题或装饰符（如###、####、** 等），每点保持简短清晰。';
      const enLetters = (base.match(/[A-Za-z]/g) || []).length;
      const zhChars = (base.match(/[\u4e00-\u9fa5]/g) || []).length;
      const isEnglish = enLetters > zhChars && enLetters > 0;
      const promptWithPolicy = isEnglish ? base : `${zhPolicy}\n\n${base}`;
      const final = await llmService.directGenerateResponse(promptWithPolicy, { onDelta: (chunk: string) => setAiText((prev) => prev + chunk) });
      setAiText((prev) => final || prev);
      const text = final || aiText || base;
      const r = await voiceService.synthesize(text, { format: 'mp3' });
      setAudioSrc(r.audioUrl);
      setPlayingIndex(null);
    } catch (e: any) {
      toast.error(e?.message || '优化或朗读失败');
    } finally {
      setIsGeneratingCopy(false);
    }
  };
  
  // 朗读脚本
  const speakScript = async (idx: number) => {
    const item = generatedResults[idx];
    if (!item?.id) { toast.warning('暂无脚本可朗读'); return; }
    try {
      const script = `方案${String.fromCharCode(65 + idx)}: ${prompt}`;
      const r = await voiceService.synthesize(script, { format: 'mp3' });
      setAudioSrc(r.audioUrl);
      setPlayingIndex(idx);
    } catch (e: any) {
      toast.error(e?.message || '朗读失败');
    }
  };
  
  // 解析富文本
  const parseSections = (text: string) => {
    const lines = String(text || '').split(/\r?\n/);
    const sections: Array<{ title: string; items: string[] }> = [];
    let current: { title: string; items: string[] } | null = null;
    for (const raw of lines) {
      let line = raw.trim();
      line = line.replace(/^#{1,6}\s*/, '');
      line = line.replace(/^```+\s*/, '');
      line = line.replace(/^>+\s*/, '');
      if (!line) continue;
      const m = line.match(/^(\d+)\)\s*(.+?)：/) || line.match(/^([一二三四五六七八九十]+)\)\s*(.+?)：/);
      if (m) {
        if (current) sections.push(current);
        current = { title: m[2], items: [] };
        continue;
      }
      if (!current) {
        current = { title: '说明', items: [] };
      }
      const bullet = line.replace(/^[-•]\s*/, '');
      current.items.push(bullet);
    }
    if (current) sections.push(current);
    return sections;
  };
  
  // 渲染富文本
  const renderRichText = (text: string) => {
    const getIconForTitle = (t: string) => {
      const s = t || '';
      if (s.includes('诊断')) return 'search';
      if (s.includes('优化')) return 'magic';
      if (s.includes('步骤')) return 'list-check';
      if (s.includes('参考') || s.includes('风格')) return 'book-open';
      return 'pen-nib';
    };
    const sections = parseSections(text);
    if (sections.length === 0) {
      return (
        <pre className={`${isDark ? 'bg-gray-800/80 text-gray-100 ring-1 ring-gray-700' : 'bg-white/80 text-gray-800 ring-1 ring-gray-200'} whitespace-pre-wrap break-words rounded-2xl p-5 leading-relaxed shadow-md backdrop-blur-sm border border-white/40 dark:border-gray-700/40`}>{text}</pre>
      );
    }
    return (
      <div className="grid gap-4 md:gap-6">
        {sections.map((sec, idx) => (
          <div
            key={idx}
            className={`${isDark ? 'bg-gray-900/50 ring-1 ring-gray-700' : 'bg-white/60 ring-1 ring-gray-200'} rounded-2xl p-5 shadow-lg backdrop-blur-sm border border-white/40 dark:border-gray-700/40`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <i className={`fas fa-${getIconForTitle(sec.title)} mr-2 text-blue-600`}></i>
                <div className="font-semibold tracking-wide">{sec.title}</div>
              </div>
            </div>
            <div className="h-px w-full bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-cyan-500 mb-3 opacity-60" />
            <ul className="grid md:grid-cols-2 gap-x-6 gap-y-2">
              {sec.items.map((raw, i) => {
                const it = String(raw || '');
                const isSubHead = /^#{1,6}\s*\d+\)\s*/.test(it) || /^#{1,6}\s*[一二三四五六七八九十]+\)\s*/.test(it);
                const cleanHead = it.replace(/^#{1,6}\s*\d+\)\s*/, '').replace(/^#{1,6}\s*[一二三四五六七八九十]+\)\s*/, '');
                const boldMatch = it.match(/^\*\*(.+?)\*\*：?(.*)$/);
                const hasBold = !!boldMatch;
                const boldLabel = hasBold ? (boldMatch?.[1] || '') : '';
                const boldText = hasBold ? (boldMatch?.[2] || '') : '';
                const colonMatch = !hasBold && !isSubHead ? it.match(/^([^：:]+)[:：]\s*(.+)$/) : null;
                const enumMatch = !hasBold && !isSubHead ? it.match(/^(\d+|[一二三四五六七八九十]+)[\.、]\s*(.+)$/) : null;
                return (
                  <li key={i} className={isSubHead ? 'md:col-span-2 flex items-center py-1' : 'flex items-start py-1'}>
                    {isSubHead ? (
                      <>
                        <i className="fas fa-angle-right mr-2 text-blue-600" />
                        <span className={`${isDark ? 'text-gray-100' : 'text-gray-800'} text-sm font-semibold tracking-wide`}>{cleanHead}</span>
                      </>
                    ) : hasBold ? (
                      <>
                        <span className="mt-1 mr-2 h-1.5 w-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500" />
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 ring-1 ring-blue-200 mr-2 dark:bg-blue-900/20 dark:text-blue-300 dark:ring-blue-800">{boldLabel}</span>
                        <span className={`${isDark ? 'text-gray-200' : 'text-gray-700'} text-sm md:text-base leading-relaxed md:leading-7 break-words max-w-[68ch]`}>{boldText}</span>
                      </>
                    ) : colonMatch ? (
                      <>
                        <span className="mt-1 mr-2 h-1.5 w-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500" />
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 ring-1 ring-blue-200 mr-2 dark:bg-blue-900/20 dark:text-blue-300 dark:ring-blue-800">{colonMatch[1]}</span>
                        <span className={`${isDark ? 'text-gray-200' : 'text-gray-700'} text-sm md:text-base leading-relaxed md:leading-7 break-words max-w-[68ch]`}>{colonMatch[2]}</span>
                      </>
                    ) : enumMatch ? (
                      <>
                        <span className="mt-1 mr-2 h-1.5 w-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500" />
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 ring-1 ring-gray-300 mr-2 dark:bg-gray-700 dark:text-gray-200 dark:ring-gray-600">{enumMatch[1]}</span>
                        <span className={`${isDark ? 'text-gray-200' : 'text-gray-700'} text-sm md:text-base leading-relaxed md:leading-7 break-words max-w-[68ch]`}>{enumMatch[2]}</span>
                      </>
                    ) : (
                      <>
                        <span className="mt-1 mr-2 h-1.5 w-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500" />
                        <span className={`${isDark ? 'text-gray-200' : 'text-gray-700'} text-sm md:text-base leading-relaxed md:leading-7 break-words max-w-[68ch]`}>{it}</span>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    );
  };
  
  // 工具选项
  const toolOptions: Array<{ id: ToolType; name: string; icon: string }> = [
    { id: 'sketch', name: '一键设计', icon: 'magic' },
    { id: 'pattern', name: '纹样嵌入', icon: 'th' },
    { id: 'filter', name: 'AI滤镜', icon: 'filter' },
    { id: 'trace', name: '文化溯源', icon: 'book-open' },
    { id: 'remix', name: '风格重混', icon: 'random' },
    { id: 'layout', name: '版式生成', icon: 'th-large' },
    { id: 'mockup', name: 'Mockup预览', icon: 'box-open' },
    { id: 'tile', name: '图案平铺', icon: 'border-all' }
  ];
  
  // 处理工具选择
  const handleToolSelect = (id: ToolType) => {
    setActiveTool(id);
    const params = new URLSearchParams(location.search);
    params.set('tool', id);
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
  };
  
  // 工具设置面板
  const renderToolSettingsPanel = () => {
    if (activeTool === 'sketch') {
      return (
        <div className="mb-6 p-3 rounded-xl bg-gray-50 border border-gray-200 dark:bg-gray-700 dark:border-gray-600">
          <div className="font-medium mb-2">一键设计</div>
          <div className="text-xs mb-3 text-gray-600 dark:text-gray-300">输入提示后点击生成即可获得方案</div>
          
          {/* 流式输出状态显示 */}
          {isGenerating && (
            <div className="mb-3 flex items-center justify-between text-xs p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
              <span>
                {streamStatus === 'running' && <i className="fas fa-spinner fa-spin mr-1"></i>}
                {streamStatus === 'running' && 'AI正在生成内容...'}
                {streamStatus === 'paused' && 'AI生成已暂停'}
                {streamStatus === 'completed' && 'AI生成完成'}
                {streamStatus === 'error' && 'AI生成出错'}
              </span>
              <button 
                onClick={handleCancelGenerate} 
                className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50"
              >
                取消
              </button>
            </div>
          )}
          
          <button 
            onClick={handleGenerate} 
            disabled={isGenerating || !prompt.trim()} 
            className="w-full text-sm px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 min-h-[44px]"
          >
            {isGenerating ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                生成中...
              </>
            ) : (
              '立即生成'
            )}
          </button>
        </div>
      );
    }
    if (activeTool === 'pattern') {
      return (
        <div className="mb-6 p-3 rounded-xl bg-gray-50 border border-gray-200 dark:bg-gray-700 dark:border-gray-600">
          <div className="font-medium mb-2">纹样嵌入</div>
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-gray-600 dark:text-gray-300">应用后自动生成</span>
            <button onClick={() => setAutoGenerate(v => !v)} className={`${autoGenerate ? 'bg-green-600' : 'bg-gray-400'} text-white px-2 py-0.5 rounded-full`}>{autoGenerate ? '开启' : '关闭'}</button>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {traditionalPatterns.slice(0,6).map(p => (
              <button key={p.id} onClick={() => setSelectedPatternId(p.id)} className={`rounded-lg overflow-hidden border ${selectedPatternId===p.id? 'border-red-500' : 'border-gray-200 dark:border-gray-600'}`}>
                <img src={p.thumbnail} alt={p.name} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
          <button onClick={applySelectedPatternEmbed} disabled={!selectedPatternId} className="w-full text-sm px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50">嵌入到提示词</button>
        </div>
      );
    }
    if (activeTool === 'filter') {
      const options = ['复古胶片','国画质感','霓虹赛博','黑白素描','水彩晕染'];
      return (
        <div className="mb-6 p-3 rounded-xl bg-gray-50 border border-gray-200 dark:bg-gray-700 dark:border-gray-600">
          <div className="font-medium mb-2">AI滤镜</div>
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-gray-600 dark:text-gray-300">应用后自动生成</span>
            <button onClick={() => setAutoGenerate(v => !v)} className={`${autoGenerate ? 'bg-green-600' : 'bg-gray-400'} text-white px-2 py-0.5 rounded-full`}>{autoGenerate ? '开启' : '关闭'}</button>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <select value={filterName} onChange={(e) => setFilterName(e.target.value)} className="text-xs px-2 py-1 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600">
              {options.map(o => (<option key={o} value={o}>{o}</option>))}
            </select>
            <input type="range" min={1} max={10} value={filterIntensity} onChange={(e) => setFilterIntensity(parseInt(e.target.value))} className="flex-1" />
            <span className="text-xs">{filterIntensity}/10</span>
          </div>
          <button onClick={applyFilterToPrompt} className="w-full text-sm px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white">应用到提示词</button>
        </div>
      );
    }
    if (activeTool === 'trace') {
      return (
        <div className="mb-6 p-3 rounded-xl bg-gray-50 border border-gray-200 dark:bg-gray-700 dark:border-gray-600">
          <div className="font-medium mb-2">文化溯源</div>
          <div className="text-xs mb-3 text-gray-600 dark:text-gray-300">生成文化元素说明并在右侧显示</div>
          <button onClick={analyzeCulturalElements} className="w-full text-sm px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white">生成说明</button>
        </div>
      );
    }
    if (activeTool === 'remix') {
      return (
        <div className="mb-6 p-3 rounded-xl bg-gray-50 border border-gray-200 dark:bg-gray-700 dark:border-gray-600">
          <div className="font-medium mb-2">风格重混</div>
          <textarea value={promptB} onChange={(e)=>setPromptB(e.target.value)} placeholder="输入第二提示词" className="w-full p-2 rounded-lg h-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 mb-3"></textarea>
          <button onClick={handleFusionGenerate} disabled={isFusing} className="w-full text-sm px-3 py-2 rounded-lg bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-cyan-600 text-white disabled:opacity-50">混合生成</button>
        </div>
      );
    }
    if (activeTool === 'layout') {
      return (
        <div className="mb-6 p-3 rounded-xl bg-gray-50 border border-gray-200 dark:bg-gray-700 dark:border-gray-600">
          <div className="font-medium mb-2">版式生成</div>
          <button onClick={handleGenerateCurationPlan} disabled={generatingPlan} className="w-full text-sm px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50">生成版式建议</button>
        </div>
      );
    }
    if (activeTool === 'mockup') {
      return (
        <div className="mb-6 p-3 rounded-xl bg-gray-50 border border-gray-200 dark:bg-gray-700 dark:border-gray-600">
          <div className="font-medium mb-2">Mockup预览</div>
          <button onClick={() => toast.info('Mockup预览功能开发中')} className="w-full text-sm px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white">应用预览效果</button>
        </div>
      );
    }
    if (activeTool === 'tile') {
      return (
        <div className="mb-6 p-3 rounded-xl bg-gray-50 border border-gray-200 dark:bg-gray-700 dark:border-gray-600">
          <div className="font-medium mb-2">图案平铺</div>
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-gray-600 dark:text-gray-300">切换后自动生成</span>
            <button onClick={() => setAutoGenerate(v => !v)} className={`${autoGenerate ? 'bg-green-600' : 'bg-gray-400'} text-white px-2 py-0.5 rounded-full`}>{autoGenerate ? '开启' : '关闭'}</button>
          </div>
          <button onClick={() => {
            const base = (prompt || '').trim();
            const next = `${base}，生成可平铺的图案设计，适合作为背景或装饰`;
            setPrompt(next);
            toast.success('已应用平铺风格到提示词');
            if (autoGenerate) {
              generateThreeVariants();
            }
          }} className="w-full text-sm px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white">切换为平铺风格</button>
        </div>
      );
    }
    return null;
  };

  // 渲染创作中心主界面
  return (
    <main className="container mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-8">创作中心</h1>
      
      {/* 加载状态 */}
      {isLoading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-red-500 border-solid"></div>
        </div>
      )}
      
      {!isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：创作工具面板 */}
          <div className="lg:col-span-1 space-y-6">
            {/* 工具选择 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
              <h2 className="text-lg font-semibold mb-4">创作工具</h2>
              <div className="grid grid-cols-4 gap-2">
                {toolOptions.map((tool) => (
                  <button
                    key={tool.id}
                    ref={(el) => (toolRefs.current[toolOptions.indexOf(tool)] = el)}
                    onClick={() => handleToolSelect(tool.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all duration-200 ${activeTool === tool.id ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800' : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600'}`}
                  >
                    <i className={`fas fa-${tool.icon} text-xl mb-1`}></i>
                    <span className="text-xs font-medium">{tool.name}</span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* 提示词输入 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
              <h2 className="text-lg font-semibold mb-4">创作提示</h2>
              <div className="relative group">
                <textarea
                  ref={inputRef}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="输入您的创作提示，例如：'天津传统建筑风格的国潮海报设计'"
                  className={`w-full h-32 px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${isDark ? 'bg-gray-700 text-white border-gray-600 focus:ring-offset-gray-800' : 'bg-gray-50 text-gray-900 border-gray-300 focus:ring-offset-white'}`}
                ></textarea>
                <div className="absolute bottom-3 right-3 flex gap-2">
                  <button
                    onClick={handlePolishPrompt}
                    disabled={isPolishing || !prompt.trim()}
                    className="p-1.5 rounded-lg text-xs transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                    title="AI优化提示词"
                  >
                    <i className="fas fa-magic"></i>
                  </button>
                  <button
                    onClick={() => setPrompt('')}
                    className="p-1.5 rounded-lg text-xs transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                    title="清空"
                  >
                    <i className="fas fa-trash-alt"></i>
                  </button>
                </div>
              </div>
              
              {/* 提示词辅助工具 */}
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={handlePolishPrompt}
                  disabled={isPolishing || !prompt.trim()}
                  className="text-xs px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition-transform hover:scale-105 duration-200"
                >
                  {isPolishing ? '润色中...' : 'AI优化提示词'}
                </button>
                <button
                  onClick={handleRandomInspiration}
                  className="text-xs px-3 py-1.5 rounded-md bg-green-600 hover:bg-green-700 text-white transition-transform hover:scale-105 duration-200"
                >
                  随机灵感
                </button>
                <button
                  onClick={() => {
                    setStylePreset('');
                    generateThreeVariants();
                  }}
                  disabled={isEngineGenerating}
                  className="text-xs px-3 py-1.5 rounded-md bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 transition-transform hover:scale-105 duration-200"
                >
                  {isEngineGenerating ? '生成中...' : '生成3变体'}
                </button>
                <button
                  onClick={() => performSave('manual')}
                  className="text-xs px-3 py-1.5 rounded-md bg-gray-600 hover:bg-gray-700 text-white transition-transform hover:scale-105 duration-200"
                >
                  保存草稿
                </button>
              </div>
              
              {/* 风格预设 */}
              <div className="mt-4">
                <label className="block text-sm font-medium mb-2">风格预设</label>
                <select
                  value={stylePreset}
                  onChange={(e) => setStylePreset(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${isDark ? 'bg-gray-700 text-white border-gray-600 focus:ring-offset-gray-800' : 'bg-gray-50 text-gray-900 border-gray-300 focus:ring-offset-white'}`}
                >
                  <option value="">无预设</option>
                  <option value="国潮风">国潮风</option>
                  <option value="古风">古风</option>
                  <option value="现代简约">现代简约</option>
                  <option value="卡通风格">卡通风格</option>
                  <option value="油画风格">油画风格</option>
                  <option value="水彩风格">水彩风格</option>
                </select>
              </div>
              
              {/* 生成数量 */}
              <div className="mt-4">
                <label className="block text-sm font-medium mb-2">生成数量</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="1"
                    max="6"
                    value={generateCount}
                    onChange={(e) => setGenerateCount(parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium w-8 text-center">{generateCount}</span>
                </div>
              </div>
            </div>
            
            {/* 工具设置 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
              {renderToolSettingsPanel()}
            </div>
            
            {/* 模型选择 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
              <h2 className="text-lg font-semibold mb-4">AI模型</h2>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setModelId('kimi');
                    llmService.setCurrentModel('kimi');
                  }}
                  className={`flex-1 px-4 py-2 rounded-lg transition-all ${modelId === 'kimi' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                >
                  Kimi
                </button>
                <button
                  onClick={() => {
                    setModelId('qwen');
                    llmService.setCurrentModel('qwen');
                  }}
                  className={`flex-1 px-4 py-2 rounded-lg transition-all ${modelId === 'qwen' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                >
                  通义千问
                </button>
                <button
                  onClick={() => {
                    setModelId('doubao');
                    llmService.setCurrentModel('doubao');
                  }}
                  className={`flex-1 px-4 py-2 rounded-lg transition-all ${modelId === 'doubao' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                >
                  豆包
                </button>
              </div>
            </div>
          </div>
          
          {/* 中间：生成结果展示 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 创作步骤 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">创作步骤</h2>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  第 {currentStep} / 3 步
                </div>
              </div>
              
              {/* 步骤指示器 */}
              <div className="flex items-center justify-between mb-6">
                <div className={`flex flex-col items-center ${currentStep >= 1 ? 'text-red-600 dark:text-red-400' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${currentStep >= 1 ? 'bg-red-100 dark:bg-red-900 border-red-500' : 'bg-gray-200 dark:bg-gray-700 border-gray-400'} border-2`}>
                    1
                  </div>
                  <span className="text-xs font-medium">输入提示</span>
                </div>
                <div className={`flex-1 h-1 mx-2 ${currentStep >= 2 ? 'bg-red-500' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
                <div className={`flex flex-col items-center ${currentStep >= 2 ? 'text-red-600 dark:text-red-400' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${currentStep >= 2 ? 'bg-red-100 dark:bg-red-900 border-red-500' : 'bg-gray-200 dark:bg-gray-700 border-gray-400'} border-2`}>
                    2
                  </div>
                  <span className="text-xs font-medium">选择方案</span>
                </div>
                <div className={`flex-1 h-1 mx-2 ${currentStep >= 3 ? 'bg-red-500' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
                <div className={`flex flex-col items-center ${currentStep >= 3 ? 'text-red-600 dark:text-red-400' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${currentStep >= 3 ? 'bg-red-100 dark:bg-red-900 border-red-500' : 'bg-gray-200 dark:bg-gray-700 border-gray-400'} border-2`}>
                    3
                  </div>
                  <span className="text-xs font-medium">编辑发布</span>
                </div>
              </div>
            </div>
            
            {/* AI文案生成 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">AI文案</h2>
                <button
                  onClick={optimizeAndRead}
                  disabled={isGeneratingCopy || !prompt.trim()}
                  className={`text-sm px-3 py-1 rounded-md ${isGeneratingCopy ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                >
                  {isGeneratingCopy ? '生成中...' : '优化并朗读'}
                </button>
              </div>
              
              {/* 创意方向标签 */}
              {aiDirections.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {aiDirections.map((dir, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        const np = (prompt ? `${prompt} ${dir}` : dir);
                        setPrompt(np);
                        inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        optimizeAndRead(np);
                      }}
                      className="text-xs px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                    >
                      {dir}
                    </button>
                  ))}
                </div>
              )}
              
              {/* AI生成的文案 */}
              <div ref={aiCopyRef} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 min-h-24">
                {aiText ? renderRichText(aiText) : <div className="text-gray-500 dark:text-gray-400">点击"优化并朗读"生成AI文案</div>}
              </div>
              
              {/* 文案操作 */}
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={async () => {
                    const base = aiText.trim() ? aiText : prompt.trim();
                    if (!base) { toast.warning('暂无可复制内容'); return; }
                    try {
                      await navigator.clipboard.writeText(base);
                      toast.success('文案已复制');
                    } catch {
                      toast.error('复制失败');
                    }
                  }}
                  className="text-xs px-3 py-1.5 rounded-md bg-gray-600 hover:bg-gray-700 text-white"
                >
                  复制文案
                </button>
                <button
                  onClick={() => {
                    const base = aiText.trim() ? aiText : prompt.trim();
                    if (!base) { toast.warning('暂无可应用内容'); return; }
                    setPrompt(base);
                    inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}
                  className="text-xs px-3 py-1.5 rounded-md bg-gray-600 hover:bg-gray-700 text-white"
                >
                  应用到提示词
                </button>
              </div>
              
              {/* 音频播放 */}
              {audioSrc && (
                <div className="mt-4">
                  <audio controls src={audioSrc} className="w-full"></audio>
                </div>
              )}
            </div>
            
            {/* 生成结果 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">生成结果</h2>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {generatedResults.length} 个方案
                </div>
              </div>
              
              {/* 结果网格 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {generatedResults.map((result) => (
                  <div
                    key={result.id}
                    className={`rounded-xl overflow-hidden border shadow-md transition-all duration-200 ${selectedResult === result.id ? 'border-red-500 shadow-red-100 dark:shadow-red-900/20' : 'border-gray-200 dark:border-gray-700 shadow-gray-100 dark:shadow-gray-800/50'} hover:shadow-lg`}
                  >
                    {/* 结果图片 */}
                    <div className="relative">
                      <TianjinImage
                        src={result.thumbnail}
                        alt={`生成结果 ${result.id}`}
                        className="w-full h-48 object-cover"
                        ratio="landscape"
                      />
                      
                      {/* 收藏按钮 */}
                      <button
                        onClick={() => toggleFavorite(result.id)}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center bg-white/80 dark:bg-gray-800/80 shadow-md hover:bg-white dark:hover:bg-gray-800"
                      >
                        <i className={`fas ${favorites.some(f => f.id === result.id) ? 'fa-heart text-red-500' : 'fa-heart-o text-gray-600 dark:text-gray-400'}`}></i>
                      </button>
                      
                      {/* 评分 */}
                      <div className="absolute bottom-2 left-2 bg-white/80 dark:bg-gray-800/80 px-2 py-1 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300">
                        <i className="fas fa-star text-yellow-500 mr-1"></i>
                        {result.score}
                      </div>
                    </div>
                    
                    {/* 结果操作 */}
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-medium">方案 {String.fromCharCode(65 + generatedResults.indexOf(result))}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {result.video ? (
                            result.video.startsWith('http') ? (
                              <a href={result.video} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                                查看视频
                              </a>
                            ) : (
                              <span>{result.video}</span>
                            )
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedResult(result.id);
                                generateVideoForSelected();
                              }}
                              disabled={videoGenerating}
                              className="text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              {videoGenerating ? '生成中...' : '生成视频'}
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleSelectResult(result.id)}
                          className="flex-1 text-xs px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-700 text-white"
                        >
                          选择方案
                        </button>
                        <button
                          onClick={() => {
                            setSelectedResult(result.id);
                            regenerateSelected();
                          }}
                          disabled={isRegenerating}
                          className="text-xs px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                        >
                          重新生成
                        </button>
                        <button
                          onClick={() => speakScript(generatedResults.indexOf(result))}
                          className="text-xs px-3 py-1.5 rounded-md bg-green-600 hover:bg-green-700 text-white"
                        >
                          朗读脚本
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* 当前步骤操作 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
              <div className="flex justify-between items-center">
                <button
                  onClick={() => {
                    if (currentStep > 1) {
                      setCurrentStep(currentStep - 1);
                    }
                  }}
                  disabled={currentStep === 1}
                  className={`px-4 py-2 rounded-lg transition-all ${currentStep === 1 ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed' : 'bg-gray-600 hover:bg-gray-700 text-white'}`}
                >
                  上一步
                </button>
                
                {currentStep < 3 ? (
                  <button
                    onClick={() => {
                      setCurrentStep(currentStep + 1);
                    }}
                    className="px-6 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-all"
                  >
                    下一步
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      toast.success('作品已发布！');
                      navigate('/dashboard');
                    }}
                    className="px-6 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-all"
                  >
                    发布作品
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
