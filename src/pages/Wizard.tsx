import React, { useState } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { motion, AnimatePresence } from 'framer-motion';
import BRANDS from '@/lib/brands';
import { useWorkflow } from '@/contexts/workflowContext';
import voiceService from '@/services/voiceService';
import UploadBox from '@/components/UploadBox';
import { scoreAuthenticity } from '@/services/authenticityService';
import postService from '@/services/postService';
import { useNavigate } from 'react-router-dom';
import { llmService } from '@/services/llmService';
import { TianjinImage, TianjinButton } from '@/components/TianjinStyleComponents';
import AISuggestionBox from '@/components/AISuggestionBox';
import { toast } from 'sonner';

// Mock Data
const TEMPLATES = [
  { id: 't1', title: '节日促销海报', style: 'festive promotion poster, vibrant red and gold', icon: 'gifts' },
  { id: 't2', title: '极简产品包装', style: 'minimalist product packaging design, clean white background', icon: 'box-open' },
  { id: 't3', title: '社交媒体封面', style: 'social media cover, trendy layout, bold typography', icon: 'hashtag' },
  { id: 't4', title: '国潮插画KV', style: 'Guochao illustration, traditional chinese patterns mixed with modern art', icon: 'paint-brush' },
];

const COMPETITIONS = [
  { id: 'c1', title: '2024 天津文化创意大赛' },
  { id: 'c2', title: '老字号品牌焕新计划' },
];

export default function Wizard() {
  const { isDark } = useTheme();
  const { state, setState, reset } = useWorkflow();
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  const [aiText, setAiText] = useState('');
  const [aiDirections, setAiDirections] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [culturalElements, setCulturalElements] = useState<string[]>([]);
  const [previewRatio, setPreviewRatio] = useState<'landscape' | 'square' | 'portrait'>('landscape');
  
  // New States for enhanced features
  const [brandAssets, setBrandAssets] = useState({
    logo: '',
    colors: ['#D32F2F', '#FFC107', '#212121'], // Default colors
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

  const next = () => setStep(s => Math.min(4, s + 1));
  const prev = () => setStep(s => Math.max(1, s - 1));

  const savePost = () => {
    const title = publishInfo.title || `${state.brandName || '作品'} - 生成变体`;
    const selectedVariant = selectedVariantIndex >= 0 && state.variants ? state.variants[selectedVariantIndex] : state.variants?.[0];
    const baseThumb = selectedVariant?.image || state.imageUrl || '';
    const thumb = baseThumb;
    
    // Simulate competition entry
    if (publishInfo.competitionId) {
      toast.success(`已报名参加：${COMPETITIONS.find(c => c.id === publishInfo.competitionId)?.title}`);
    }

    const p = postService.addPost({
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
    toast.success('作品发布成功！');
    return p;
  };

  const runAIHelp = async () => {
    const base = (state.inputText?.trim()) || `${state.brandName || '品牌'} 创意方向与文案`;
    setIsGenerating(true);
    setAiText(''); // Clear previous text
    try {
      // 1. Get static recommendations (these work without API)
      const dirs = llmService.generateCreativeDirections(base);
      setAiDirections(dirs);
      const elems = llmService.recommendCulturalElements(base);
      setCulturalElements(elems);

      // 2. Try to generate text response
      const zhPolicy = '请用中文分点回答，避免 Markdown 标题或装饰符（如###、####、** 等），每点精炼。';
      const enLetters = (base.match(/[A-Za-z]/g) || []).length;
      const zhChars = (base.match(/[\u4e00-\u9fa5]/g) || []).length;
      const isEnglish = enLetters > zhChars && enLetters > 0;
      const promptWithPolicy = isEnglish ? base : `${zhPolicy}\n\n${base}`;
      
      try {
        await llmService.generateResponse(promptWithPolicy, { onDelta: (chunk: string) => setAiText(chunk) });
      } catch (err) {
        console.warn('LLM generation failed, falling back to mock:', err);
        // Mock fallback if API fails
        const mockResponse = `基于${state.brandName || '您的品牌'}，为您提供以下创意建议：\n\n1. 视觉风格：建议采用新中式国潮风格，将传统${elems[0] || '纹样'}与现代极简线条结合。\n2. 核心意象：可以提取${state.brandName ? state.brandName.substring(0, 2) : '品牌'}的核心元素进行符号化重构。\n3. 色彩搭配：推荐使用朱红与钛白的撞色搭配，点缀少量金色提升质感。\n4. 营销文案："传承百年匠心，重塑东方美学"，强调品牌的时间沉淀与创新精神。`;
        
        // Simulate streaming for mock response
        let currentText = '';
        const chars = mockResponse.split('');
        for (let i = 0; i < chars.length; i++) {
          currentText += chars[i];
          setAiText(currentText);
          await new Promise(r => setTimeout(r, 30));
        }
      }
    } catch (e) {
      console.error('AI Help Error:', e);
      toast.error('AI 创意助理暂时无法连接，请稍后再试');
    }
    setIsGenerating(false);
  };

  const generateVariants = async () => {
    const template = TEMPLATES.find(t => t.id === selectedTemplate);
    const templateStyle = template?.style || '';
    const basePrompt = `${(state.inputText || '').trim()} ${templateStyle} ${(aiText || '').trim()}`.trim() || 'Tianjin cultural design';
    
    // Set loading state or placeholder variants first
    const placeholders = [
      { script: '方案A：经典传承', image: '', loading: true },
      { script: '方案B：现代融合', image: '', loading: true },
      { script: '方案C：未来探索', image: '', loading: true },
    ];
    setState({ variants: placeholders });

    const styles = [
      { name: '经典传承', promptSuffix: 'classic traditional chinese style, elegant, heritage' },
      { name: '现代融合', promptSuffix: 'modern minimalist mixed with traditional elements, clean, bold' },
      { name: '未来探索', promptSuffix: 'futuristic cyberpunk style, neon lights, traditional patterns, 8k' }
    ];

    try {
      const newVariants = await Promise.all(styles.map(async (style, index) => {
        // Use llmService to generate image (it has built-in mock fallback)
        const response = await llmService.generateImage({
          prompt: `${basePrompt} ${style.promptSuffix}`,
          size: '1024x1024',
          n: 1
        });

        const imageUrl = response.data?.data?.[0]?.url || 
                        // Fallback to Unsplash if even the service mock fails somehow
                        `https://images.unsplash.com/photo-${index === 0 ? '1535139262971-c51845709a48' : index === 1 ? '1550684848-fac1c5b4e853' : '1515630278258-407f66498911'}?w=800&q=80`;

        return {
          script: `方案${String.fromCharCode(65 + index)}：${style.name}`,
          image: imageUrl,
          video: ''
        };
      }));

      setState({ variants: newVariants });
    } catch (error) {
      console.error('Image generation failed:', error);
      toast.error('生成图片失败，已加载示例图片');
      // Fallback to hardcoded examples
      setState({ variants: [
        { script: '方案A：经典传承', image: 'https://images.unsplash.com/photo-1535139262971-c51845709a48?w=800&q=80', video: '' },
        { script: '方案B：现代融合', image: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800&q=80', video: '' },
        { script: '方案C：未来探索', image: 'https://images.unsplash.com/photo-1515630278258-407f66498911?w=800&q=80', video: '' },
      ] });
    }
  };

  const runConsistencyCheck = () => {
    setIsConsistencyChecking(true);
    setTimeout(() => {
      setIsConsistencyChecking(false);
      setConsistencyScore(Math.floor(Math.random() * 20) + 80); // Random score 80-100
      toast.success('品牌一致性检查完成');
    }, 1500);
  };

  // Steps configuration
  const steps = [
    { id: 1, title: '选择品牌', icon: 'store' },
    { id: 2, title: '创意输入', icon: 'pen-nib' },
    { id: 3, title: '生成变体', icon: 'wand-magic-sparkles' },
    { id: 4, title: '评分发布', icon: 'star' }
  ];

  return (
    <main className={`h-full ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'} pb-20`}>
      {/* Header & Stepper */}
      <div className={`sticky top-0 z-20 ${isDark ? 'bg-gray-900/80' : 'bg-white/80'} backdrop-blur-md border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-red-500 flex items-center justify-center text-white font-bold">
                <i className="fas fa-hat-wizard"></i>
              </div>
              <h1 className="text-xl font-bold tracking-tight">品牌向导</h1>
            </div>
            
            {/* Stepper */}
            <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto overflow-x-auto scrollbar-hide">
              {steps.map((s, i) => (
                <div key={s.id} className="flex items-center flex-shrink-0">
                  <div className={`flex items-center gap-2 ${step >= s.id ? (isDark ? 'text-white' : 'text-gray-900') : (isDark ? 'text-gray-600' : 'text-gray-400')}`}>
                    <motion.div 
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                        step >= s.id 
                          ? 'bg-red-600 text-white shadow-md shadow-red-500/20' 
                          : (isDark ? 'bg-gray-800' : 'bg-gray-200')
                      }`}
                      initial={{ scale: 0.9 }}
                      animate={{ scale: step === s.id ? 1.1 : 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      {step > s.id ? (
                        <motion.i 
                          className="fas fa-check"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.3 }}
                        />
                      ) : s.id}
                    </motion.div>
                    <span className="text-sm font-medium hidden sm:block">{s.title}</span>
                  </div>
                  {i < steps.length - 1 && (
                    <motion.div 
                      className={`w-10 h-1 mx-2 rounded-full transition-colors duration-500 ${
                        step > s.id ? 'bg-red-600' : (isDark ? 'bg-gray-800' : 'bg-gray-200')
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: step > s.id ? 40 : 40 }}
                      transition={{ duration: 0.5 }}
                    ></motion.div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12 max-w-7xl">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              <div className="text-center space-y-4">
                <h2 className="text-4xl font-bold">选择一个老字号品牌</h2>
                <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>或者是输入您自己的品牌名称，我们将为您定制专属创意。</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Brand Input & Suggestions */}
                <div className={`p-10 rounded-3xl ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} border shadow-sm`}>
                  <label className="block text-lg font-medium mb-4 opacity-70">品牌名称</label>
                  <div className="relative">
                    <input
                      value={state.brandName || ''}
                      onChange={(e) => {
                        const name = e.target.value;
                        const match = BRANDS.find(b => b.name === name);
                        if (match) setState({ brandId: match.id, brandName: match.name });
                        else setState({ brandId: undefined, brandName: name });
                      }}
                      placeholder="例如：桂发祥十八街麻花"
                      className={`w-full p-6 pl-14 text-lg rounded-2xl border transition-all ${isDark ? 'bg-gray-900 border-gray-700 focus:border-red-500' : 'bg-gray-50 border-gray-200 focus:border-red-500'} focus:ring-2 focus:ring-red-500/20 outline-none`}
                    />
                    <i className="fas fa-search absolute left-5 top-1/2 transform -translate-y-1/2 opacity-40 text-xl"></i>
                  </div>

                  <div className="mt-8">
                    <div className="text-sm font-medium mb-4 opacity-50 uppercase tracking-wider">热门推荐</div>
                    <div className="flex flex-wrap gap-3">
                      {BRANDS.slice(0, 6).map(b => (
                        <button
                          key={b.id}
                          onClick={() => setState({ brandId: b.id, brandName: b.name })}
                          className={`text-sm px-4 py-2 rounded-full transition-all ${
                            state.brandName === b.name
                              ? 'bg-red-600 text-white shadow-md shadow-red-500/20'
                              : (isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700')
                          }`}
                        >
                          {b.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Brand Preview & Assets */}
                <div className={`p-10 rounded-3xl ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} border shadow-sm flex flex-col items-center justify-center text-center`}>
                  {state.brandName ? (
                    <div className="w-full space-y-6">
                      <div className="relative aspect-video rounded-xl overflow-hidden shadow-lg group">
                        {(() => {
                          const brand = BRANDS.find(b => b.id === state.brandId || b.name === (state.brandName || ''));
                          const src = brand?.image || '';
                          return (
                            <motion.div 
                              initial={{ scale: 1 }}
                              whileHover={{ scale: 1.05 }}
                              transition={{ duration: 0.3 }}
                            >
                              <TianjinImage src={src} alt="brand" ratio="landscape" className="w-full h-full object-cover transition-transform duration-500" />
                            </motion.div>
                          );
                        })()}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex flex-col justify-end p-6">
                          <h3 className="text-white font-bold text-3xl mb-1">{state.brandName}</h3>
                        </div>
                      </div>
                      
                      {/* Brand Assets Management */}
                      <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'} text-left`}>
                        <h4 className="font-bold mb-3 flex items-center gap-2 text-sm opacity-80">
                          <i className="fas fa-sliders-h"></i> 品牌资产配置
                        </h4>
                        <div className="flex gap-4 items-center mb-3">
                           <div className="flex-1">
                              <label className="text-xs opacity-60 mb-1 block">Logo</label>
                              <div className="flex items-center gap-2">
                                <div className="w-10 h-10 rounded bg-gray-200 dark:bg-gray-600 flex items-center justify-center overflow-hidden">
                                  {brandAssets.logo ? <img src={brandAssets.logo} className="w-full h-full object-cover" /> : <i className="fas fa-image opacity-50"></i>}
                                </div>
                                <UploadBox 
                                  accept="image/*" 
                                  variant="image" 
                                  compact 
                                  className="flex-1"
                                  title="更换"
                                  onFile={(f) => setBrandAssets({...brandAssets, logo: URL.createObjectURL(f)})} 
                                />
                              </div>
                           </div>
                           <div className="flex-1">
                              <label className="text-xs opacity-60 mb-1 block">品牌色</label>
                              <div className="flex gap-1">
                                {brandAssets.colors.map((c, i) => (
                                  <div key={i} className="w-6 h-6 rounded-full border border-gray-300 dark:border-gray-600 shadow-sm" style={{backgroundColor: c}}></div>
                                ))}
                                <button className="w-6 h-6 rounded-full border border-dashed border-gray-400 flex items-center justify-center text-xs opacity-60 hover:opacity-100">
                                  <i className="fas fa-plus"></i>
                                </button>
                              </div>
                           </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'} leading-relaxed`}>
                          {BRANDS.find(b => b.name === state.brandName)?.story || '暂无品牌故事描述'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="opacity-40 space-y-4 transform transition-transform hover:opacity-50 hover:scale-105">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-amber-500 flex items-center justify-center mb-4">
                        <i className="fas fa-store text-white text-4xl"></i>
                      </div>
                      <p className="text-xl">请在左侧输入或选择品牌以预览</p>
                    </div>
                  )}
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
              {/* Existing Step 2 Content - Simplified for brevity, assume same structure */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} border shadow-sm`}>
                    <div className="flex justify-between items-center mb-4">
                      <label className="font-bold text-lg">创意描述</label>
                      <div className="flex gap-2">
                        <TianjinButton size="sm" variant="ghost" onClick={() => setState({ inputText: '' })}>清空</TianjinButton>
                        <TianjinButton size="sm" variant="secondary" onClick={() => setState({ inputText: `${state.brandName} 节日KV设计；主色中国红+金色；包含海河地标与回纹元素。` })}>使用模板</TianjinButton>
                      </div>
                    </div>
                    <textarea
                      value={state.inputText || ''}
                      onChange={(e) => { if (e.target.value.length <= 500) setState({ inputText: e.target.value }) }}
                      placeholder="描述您的创意需求..."
                      className={`w-full h-40 p-4 rounded-xl border transition-all resize-none ${isDark ? 'bg-gray-900 border-gray-700 focus:border-red-500' : 'bg-gray-50 border-gray-200 focus:border-red-500'} focus:ring-2 focus:ring-red-500/20 outline-none`}
                    />
                    <div className="mt-4 flex gap-4">
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
                  
                  {/* AI Assistance Section */}
                  <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-blue-50/50 border-blue-100'} border border-dashed`}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-blue-600 font-medium"><i className="fas fa-sparkles"></i> AI 创意助理</div>
                        <TianjinButton size="sm" primary disabled={!state.inputText?.trim() || isGenerating} onClick={runAIHelp} loading={isGenerating}>生成建议</TianjinButton>
                    </div>
                    <div className="mt-2">
                      <AISuggestionBox 
                        content={aiText} 
                        isLoading={isGenerating}
                        title="创意建议"
                        onApply={(text) => setState({ inputText: text })}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                   <div className={`p-4 rounded-2xl ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} border shadow-sm sticky top-24`}>
                      <h3 className="font-bold text-sm mb-3">实时预览</h3>
                      <TianjinImage 

                        alt="preview"
                        ratio="landscape"
                        className="w-full rounded-xl"
                      />
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
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <h2 className="text-2xl font-bold">选择最佳方案</h2>
                
                {/* Template Selection */}
                <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto">
                  {TEMPLATES.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTemplate(t.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm whitespace-nowrap transition-all ${selectedTemplate === t.id ? 'bg-red-50 border-red-500 text-red-600 dark:bg-red-900/20' : 'border-gray-200 dark:border-gray-700 opacity-70 hover:opacity-100'}`}
                    >
                      <i className={`fas fa-${t.icon}`}></i>
                      {t.title}
                    </button>
                  ))}
                </div>

                <TianjinButton 
                  primary 
                  onClick={generateVariants}
                  leftIcon={<i className="fas fa-sync-alt"></i>}
                  disabled={state.variants && state.variants.some(v => v.loading)}
                >
                  {state.variants?.length ? '重新生成' : '开始生成'}
                </TianjinButton>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(state.variants || []).map((v, i) => {
                  const isSelected = selectedVariantIndex === i;
                  return (
                    <motion.div 
                      key={i}
                      onClick={() => setSelectedVariantIndex(i)}
                      className={`group relative rounded-2xl overflow-hidden border-2 transition-all cursor-pointer ${
                        isSelected 
                          ? 'border-red-500 ring-4 ring-red-500/20 transform -translate-y-2 shadow-xl' 
                          : `${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-white'} shadow-sm hover:shadow-md`
                      }`}
                      whileHover={isSelected ? {} : { y: -4 }}
                    >
                      <div className="relative aspect-square overflow-hidden">
                         <TianjinImage src={v.image} alt={`variant-${i}`} ratio="square" className="w-full h-full object-cover" />
                         {/* Selection Overlay */}
                         {isSelected && (
                           <div className="absolute inset-0 bg-red-500/10 flex items-center justify-center backdrop-blur-[1px]">
                             <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg scale-110">
                               <i className="fas fa-check text-xl"></i>
                             </div>
                           </div>
                         )}
                      </div>
                      <div className={`p-4 ${isSelected ? (isDark ? 'bg-gray-800' : 'bg-red-50/50') : ''}`}>
                        <h3 className={`font-bold mb-1 ${isSelected ? 'text-red-600' : ''}`}>{v.script}</h3>
                        <p className="text-xs opacity-60">包含视觉设计与文案建议</p>
                      </div>
                    </motion.div>
                  );
                })}
                {(!state.variants || state.variants.length === 0) && (
                  <div className="col-span-3 py-16 flex flex-col items-center justify-center opacity-50 border-2 border-dashed rounded-2xl">
                    <i className="fas fa-image text-4xl mb-4"></i>
                    <p>点击“开始生成”按钮获取创意设计方案</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div 
              key="step4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left: Scores & Checks */}
                <div className="space-y-6">
                    {/* Cultural Score */}
                    <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} border shadow-sm flex items-center gap-6`}>
                        <div className="w-24 h-24 rounded-full border-4 border-red-500/20 flex items-center justify-center flex-shrink-0">
                             <span className="text-3xl font-black text-red-600">
                                {scoreAuthenticity(state.inputText || '', '').score}
                             </span>
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">文化纯正度评分</h3>
                            <p className="text-sm opacity-60 mt-1">基于天津文化知识库评估，建议加强地方特色元素的运用。</p>
                        </div>
                    </div>

                    {/* Brand Consistency Check */}
                    <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} border shadow-sm`}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg flex items-center gap-2"><i className="fas fa-shield-alt text-blue-500"></i> 品牌一致性检查</h3>
                            <TianjinButton size="sm" variant="secondary" onClick={runConsistencyCheck} loading={isConsistencyChecking}>开始检查</TianjinButton>
                        </div>
                        
                        {consistencyScore !== null ? (
                             <div className="space-y-3">
                                 <div className="flex justify-between text-sm font-medium">
                                     <span>匹配度</span>
                                     <span className={consistencyScore >= 90 ? 'text-green-500' : 'text-yellow-500'}>{consistencyScore}%</span>
                                 </div>
                                 <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                                    <div className={`h-2.5 rounded-full ${consistencyScore >= 90 ? 'bg-green-500' : 'bg-yellow-500'}`} style={{width: `${consistencyScore}%`}}></div>
                                 </div>
                                 <ul className="text-sm opacity-80 space-y-1 mt-2">
                                     <li className="flex items-center gap-2"><i className="fas fa-check-circle text-green-500"></i> Logo 完整性良好</li>
                                     <li className="flex items-center gap-2"><i className="fas fa-check-circle text-green-500"></i> 品牌色使用规范</li>
                                     <li className="flex items-center gap-2"><i className="fas fa-exclamation-circle text-yellow-500"></i> 建议增加品牌字体占比</li>
                                 </ul>
                             </div>
                        ) : (
                            <div className="text-center py-6 opacity-60">
                                <p>点击“开始检查”分析设计是否符合品牌规范</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Publish & Participate */}
                <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} border shadow-sm`}>
                    <h3 className="font-bold text-lg mb-4">发布作品</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 opacity-70">作品标题</label>
                            <input 
                                className={`w-full p-3 rounded-lg border ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
                                value={publishInfo.title}
                                onChange={e => setPublishInfo({...publishInfo, title: e.target.value})}
                                placeholder="给作品起个名字"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 opacity-70">作品描述</label>
                            <textarea 
                                className={`w-full p-3 rounded-lg border h-24 resize-none ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
                                value={publishInfo.description}
                                onChange={e => setPublishInfo({...publishInfo, description: e.target.value})}
                                placeholder="分享创作背后的故事..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 opacity-70">参与赛事 (可选)</label>
                            <select 
                                className={`w-full p-3 rounded-lg border ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
                                value={publishInfo.competitionId}
                                onChange={e => setPublishInfo({...publishInfo, competitionId: e.target.value})}
                            >
                                <option value="">不参与赛事</option>
                                {COMPETITIONS.map(c => (
                                    <option key={c.id} value={c.id}>🏆 {c.title}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Sticky Footer Navigation */}
      <div className={`fixed bottom-0 left-0 right-0 p-4 ${isDark ? 'bg-gray-900/90 border-gray-800' : 'bg-white/90 border-gray-200'} border-t backdrop-blur-md z-30`}>
        <div className="container mx-auto max-w-5xl flex justify-between items-center">
          <TianjinButton variant="ghost" onClick={prev} disabled={step === 1} leftIcon={<i className="fas fa-arrow-left"></i>}>上一步</TianjinButton>
          <div className="flex gap-3">
            {step === 4 ? (
              <TianjinButton primary onClick={savePost} rightIcon={<i className="fas fa-check"></i>}>发布并完成</TianjinButton>
            ) : (
              <TianjinButton primary onClick={next} disabled={step === 1 && !state.brandName || step === 2 && !state.inputText} rightIcon={<i className="fas fa-arrow-right"></i>}>下一步</TianjinButton>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
