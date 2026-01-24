import React, { useState } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { motion, AnimatePresence } from 'framer-motion';
import BRANDS from '@/lib/brands';
import { useWorkflow } from '@/contexts/workflowContext.tsx';
import voiceService from '@/services/voiceService';
import UploadBox from '@/components/UploadBox';
import { scoreAuthenticity } from '@/services/authenticityService';
import postService from '@/services/postService';
import { useNavigate } from 'react-router-dom';
import { llmService } from '@/services/llmService';
import { TianjinImage, TianjinButton } from '@/components/TianjinStyleComponents';
import { toast } from 'sonner';

export default function Wizard() {
  const { isDark } = useTheme();
  const { state, setState, reset } = useWorkflow();
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  const [aiText, setAiText] = useState('');
  const [aiDirections, setAiDirections] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [ttsUrl, setTtsUrl] = useState('');
  const [culturalElements, setCulturalElements] = useState<string[]>([]);
  const [previewRatio, setPreviewRatio] = useState<'landscape' | 'square' | 'portrait'>('landscape');

  const next = () => setStep(s => Math.min(4, s + 1));
  const prev = () => setStep(s => Math.max(1, s - 1));

  const savePost = () => {
    const title = `${state.brandName || '作品'} - 生成变体`;
    const baseThumb = state.variants?.[0]?.image || state.imageUrl || '';
    const thumb = baseThumb || `https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(title)}&image_size=1024x1024`;
    const p = postService.addPost({
      title,
      thumbnail: thumb,
      category: 'design',
      tags: [],
      description: '',
      creativeDirection: '',
      culturalElements: [],
      colorScheme: [],
      toolsUsed: []
    });
    reset();
    navigate('/square');
    return p;
  };

  const runAIHelp = async () => {
    const base = (state.inputText?.trim()) || `${state.brandName || '品牌'} 创意方向与文案`;
    setIsGenerating(true);
    try {
      const dirs = llmService.generateCreativeDirections(base);
      setAiDirections(dirs);
      const elems = llmService.recommendCulturalElements(base);
      setCulturalElements(elems);
      const zhPolicy = '请用中文分点回答，避免 Markdown 标题或装饰符（如###、####、** 等），每点精炼。';
      const enLetters = (base.match(/[A-Za-z]/g) || []).length;
      const zhChars = (base.match(/[\u4e00-\u9fa5]/g) || []).length;
      const isEnglish = enLetters > zhChars && enLetters > 0;
      const promptWithPolicy = isEnglish ? base : `${zhPolicy}\n\n${base}`;
      await llmService.generateResponse(promptWithPolicy, { onDelta: (chunk: string) => setAiText(chunk) });
    } catch {}
    setIsGenerating(false);
  };

  const applyAITextToInput = () => {
    if (aiText.trim()) setState({ inputText: aiText });
  };

  // Steps configuration
  const steps = [
    { id: 1, title: '选择品牌', icon: 'store' },
    { id: 2, title: '创意输入', icon: 'pen-nib' },
    { id: 3, title: '生成变体', icon: 'wand-magic-sparkles' },
    { id: 4, title: '文化评分', icon: 'star' }
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

                {/* Brand Preview */}
                <div className={`p-10 rounded-3xl ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} border shadow-sm flex flex-col items-center justify-center text-center`}>
                  {state.brandName ? (
                    <div className="w-full space-y-6">
                      <div className="relative aspect-video rounded-xl overflow-hidden shadow-lg group">
                        {(() => {
                          const brand = BRANDS.find(b => b.id === state.brandId || b.name === (state.brandName || ''));
                          const src = brand?.image || `https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(`Tianjin ${state.brandName || 'brand'} product shot, cultural style`)}&image_size=1920x1080`;
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
                          <div className="flex flex-wrap gap-2 mb-3">
                            <span className="px-3 py-1 rounded-full bg-red-600 text-white text-xs font-medium shadow-md">天津老字号</span>
                            <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-medium">文化传承</span>
                          </div>
                          <h3 className="text-white font-bold text-3xl mb-1">{state.brandName}</h3>
                          <p className="text-white/80 text-sm">{BRANDS.find(b => b.name === state.brandName)?.established || '历史悠久'}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'} leading-relaxed`}>
                          {BRANDS.find(b => b.name === state.brandName)?.story || '暂无品牌故事描述'}
                        </p>
                        
                        {/* Brand Tags */}
                        <div className="flex flex-wrap gap-2 justify-center">
                          {BRANDS.find(b => b.name === state.brandName)?.tags?.slice(0, 4).map((tag, i) => (
                            <span key={i} className={`px-3 py-1 rounded-full text-xs font-medium ${
                              isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                            }`}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="opacity-40 space-y-4 transform transition-transform hover:opacity-50 hover:scale-105">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-amber-500 flex items-center justify-center mb-4">
                        <i className="fas fa-store text-white text-4xl"></i>
                      </div>
                      <p className="text-xl">请在左侧输入或选择品牌以预览</p>
                      <p className="text-sm opacity-60">选择一个品牌开始您的创意之旅</p>
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
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Input & Controls */}
                <div className="lg:col-span-2 space-y-6">
                  <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} border shadow-sm`}>
                    <div className="flex justify-between items-center mb-4">
                      <label className="font-bold text-lg">创意描述</label>
                      <div className="flex gap-2">
                        <TianjinButton size="sm" variant="ghost" onClick={() => setState({ inputText: '' })}>清空</TianjinButton>
                        <TianjinButton size="sm" variant="secondary" onClick={() => setState({ inputText: `${state.brandName} 节日KV设计；主色中国红+金色；包含海河地标与回纹元素。` })}>使用模板</TianjinButton>
                      </div>
                    </div>
                    
                    <div className="relative">
                      <textarea
                        value={state.inputText || ''}
                        onChange={(e) => { if (e.target.value.length <= 500) setState({ inputText: e.target.value }) }}
                        placeholder="描述您的创意需求，例如：为桂发祥设计一款中秋礼盒，结合天津之眼元素，风格要国潮且喜庆..."
                        className={`w-full h-40 p-4 rounded-xl border transition-all resize-none ${isDark ? 'bg-gray-900 border-gray-700 focus:border-red-500' : 'bg-gray-50 border-gray-200 focus:border-red-500'} focus:ring-2 focus:ring-red-500/20 outline-none`}
                      />
                      <div className="absolute bottom-4 right-4 text-xs opacity-50">
                        {(state.inputText || '').length}/500
                      </div>
                    </div>

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

                  {/* AI Assistance */}
                  <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-blue-50/50 border-blue-100'} border border-dashed`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2 text-blue-600 font-medium">
                        <i className="fas fa-sparkles"></i> AI 创意助理
                      </div>
                      <div className="flex gap-2">
                        <TianjinButton 
                          size="sm" 
                          primary 
                          disabled={!state.inputText?.trim() || isGenerating}
                          onClick={runAIHelp}
                          loading={isGenerating}
                        >
                          生成建议
                        </TianjinButton>
                        <TianjinButton 
                          size="sm" 
                          variant="secondary" 
                          disabled={!state.brandName}
                          onClick={() => setState({ inputText: `${state.brandName} 品牌推广创意，结合天津文化元素，现代设计风格` })}
                        >
                          快速模板
                        </TianjinButton>
                      </div>
                    </div>
                    
                    {aiText ? (
                      <div className="space-y-4">
                        {/* AI Generated Text */}
                        <div className="space-y-3">
                          <div className={`text-sm p-4 rounded-xl ${isDark ? 'bg-gray-900' : 'bg-white'} whitespace-pre-wrap leading-relaxed`}>
                            {aiText}
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            <TianjinButton size="sm" variant="secondary" onClick={applyAITextToInput}>应用到输入</TianjinButton>
                            <TianjinButton size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(aiText); toast.success('已复制'); }}>复制</TianjinButton>
                            <TianjinButton size="sm" variant="ghost" onClick={() => setAiText('')}>清空</TianjinButton>
                          </div>
                        </div>
                        
                        {/* Creative Directions */}
                        {aiDirections.length > 0 && (
                          <div className="space-y-2">
                            <div className="text-sm font-medium text-blue-600">创意方向建议</div>
                            <div className="flex flex-wrap gap-2">
                              {aiDirections.map((dir, i) => (
                                <button
                                  key={i}
                                  onClick={() => setState({ inputText: `${state.inputText || ''} ${dir}` })}
                                  className={`text-xs px-3 py-1.5 rounded-full ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-blue-100 hover:bg-blue-200 text-blue-700'}`}
                                >
                                  {dir}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Cultural Elements */}
                        {culturalElements.length > 0 && (
                          <div className="space-y-2">
                            <div className="text-sm font-medium text-blue-600">文化元素推荐</div>
                            <div className="flex flex-wrap gap-2">
                              {culturalElements.map((elem, i) => (
                                <button
                                  key={i}
                                  onClick={() => setState({ inputText: `${state.inputText || ''} ${elem}` })}
                                  className={`text-xs px-3 py-1.5 rounded-full ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-amber-100 hover:bg-amber-200 text-amber-700'}`}
                                >
                                  {elem}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm opacity-60">输入创意描述后，点击生成建议获取 AI 优化文案。</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-white/70'} border ${isDark ? 'border-gray-600' : 'border-blue-100'}`}>
                            <div className="flex items-center gap-2 mb-1">
                              <i className="fas fa-lightbulb text-yellow-500 text-sm"></i>
                              <span className="text-xs font-medium">创意方向</span>
                            </div>
                            <p className="text-xs opacity-70">基于品牌特性生成创意方向建议</p>
                          </div>
                          <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-white/70'} border ${isDark ? 'border-gray-600' : 'border-blue-100'}`}>
                            <div className="flex items-center gap-2 mb-1">
                              <i className="fas fa-landmark text-red-500 text-sm"></i>
                              <span className="text-xs font-medium">文化元素</span>
                            </div>
                            <p className="text-xs opacity-70">推荐结合天津文化特色元素</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Real-time Preview */}
                <div className="space-y-4">
                  <div className={`p-4 rounded-2xl ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} border shadow-sm sticky top-24`}>
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-bold text-sm">实时预览</h3>
                      <div className="flex gap-1 bg-gray-100 dark:bg-gray-900 p-1 rounded-lg">
                        {(['landscape', 'square', 'portrait'] as const).map(r => (
                          <button
                            key={r}
                            onClick={() => setPreviewRatio(r)}
                            className={`p-1.5 rounded-md text-xs transition-all ${previewRatio === r ? 'bg-white dark:bg-gray-700 shadow text-blue-600' : 'text-gray-400'}`}
                          >
                            <i className={`fas fa-${r === 'landscape' ? 'image' : r === 'square' ? 'square' : 'mobile-alt'}`}></i>
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="relative rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-900">
                      <TianjinImage 
                        src={`https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(`${state.brandName} ${state.inputText}`)}&image_size=${previewRatio === 'landscape' ? '1920x1080' : previewRatio === 'square' ? '1024x1024' : '1080x1920'}`}
                        alt="preview"
                        ratio={previewRatio}
                        className="w-full"
                      />
                      {/* Tags Overlay */}
                      <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                        {state.brandName && <span className="px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-sm text-white text-[10px]">{state.brandName}</span>}
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
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">选择最佳方案</h2>
                <TianjinButton 
                  primary 
                  onClick={() => {
                    const base = `${(state.inputText || '').trim()} ${(aiText || '').trim()}`.trim() || 'Tianjin cultural design';
                    setState({ variants: [
                      { script: '方案A：经典传承', image: `https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(base + ' classic style')}&image_size=1024x1024`, video: '视频占位A' },
                      { script: '方案B：现代融合', image: `https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(base + ' modern fusion')}&image_size=1024x1024`, video: '视频占位B' },
                      { script: '方案C：未来探索', image: `https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(base + ' futuristic')}&image_size=1024x1024`, video: '视频占位C' },
                    ] });
                  }}
                  leftIcon={<i className="fas fa-sync-alt"></i>}
                >
                  重新生成
                </TianjinButton>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(state.variants || []).map((v, i) => (
                  <motion.div 
                    key={i} 
                    className={`group relative rounded-2xl overflow-hidden border ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-white'} shadow-sm hover:shadow-xl transition-all cursor-pointer`}
                    whileHover={{ y: -8 }}
                  >
                    <div className="relative aspect-square overflow-hidden">
                      <motion.div
                        initial={{ scale: 1 }}
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.4 }}
                      >
                        <TianjinImage src={v.image} alt={`variant-${i}`} ratio="square" className="w-full h-full object-cover" />
                      </motion.div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                        <div className="space-y-2">
                          <h4 className="text-white font-bold text-sm">{v.script}</h4>
                          <p className="text-white/80 text-xs">点击选择此创意方案</p>
                        </div>
                      </div>
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <motion.button 
                          className="bg-red-600 text-white px-5 py-2 rounded-full font-medium shadow-lg shadow-red-600/30"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          选择此方案
                        </motion.button>
                      </div>
                    </div>
                    <div className="p-4 space-y-3">
                      <div>
                        <h3 className="font-bold mb-1">{v.script}</h3>
                        <p className="text-xs opacity-60">包含视觉设计与文案建议</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {i === 0 ? '经典风格' : i === 1 ? '现代融合' : '未来感'}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                        }`}>
                          AI 生成
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
                {(!state.variants || state.variants.length === 0) && (
                  <div className="col-span-3 py-16 flex flex-col items-center justify-center opacity-50 border-2 border-dashed rounded-2xl transition-all hover:opacity-70">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-amber-500 flex items-center justify-center mb-6">
                      <i className="fas fa-image text-white text-3xl"></i>
                    </div>
                    <h3 className="text-lg font-medium mb-2">暂无设计方案</h3>
                    <p className="text-sm opacity-60 mb-4">点击“重新生成”按钮获取创意设计方案</p>
                    <TianjinButton 
                      size="sm" 
                      primary
                      onClick={() => {
                        const base = `${(state.inputText || '').trim()} ${(aiText || '').trim()}`.trim() || 'Tianjin cultural design';
                        setState({ variants: [
                          { script: '方案A：经典传承', image: `https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(base + ' classic style')}&image_size=1024x1024`, video: '视频占位A' },
                          { script: '方案B：现代融合', image: `https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(base + ' modern fusion')}&image_size=1024x1024`, video: '视频占位B' },
                          { script: '方案C：未来探索', image: `https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(base + ' futuristic')}&image_size=1024x1024`, video: '视频占位C' },
                        ] });
                      }}
                    >
                      立即生成
                    </TianjinButton>
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
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Score Card */}
                <div className={`lg:col-span-1 p-8 rounded-3xl ${isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-100'} border shadow-xl flex flex-col items-center justify-center text-center relative overflow-hidden`}>
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 via-amber-500 to-blue-500"></div>
                  <div className="w-32 h-32 rounded-full border-8 border-red-500/20 flex items-center justify-center mb-6 relative">
                    <span className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-amber-600">
                      {scoreAuthenticity(state.inputText || '', (BRANDS.find(b => b.id === state.brandId || b.name === (state.brandName || '')) || BRANDS[0]).story).score}
                    </span>
                    <div className="absolute -bottom-2 px-3 py-1 bg-red-600 text-white text-xs rounded-full font-bold">
                      文化纯正度
                    </div>
                  </div>
                  <p className="opacity-60 text-sm">基于天津文化知识库评估</p>
                </div>

                {/* Analysis */}
                <div className="lg:col-span-2 space-y-6">
                  <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} border shadow-sm`}>
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                      <i className="fas fa-clipboard-check text-green-500"></i> 评估报告
                    </h3>
                    <div className="space-y-3">
                      {scoreAuthenticity(state.inputText || '', (BRANDS.find(b => b.id === state.brandId || b.name === (state.brandName || '')) || BRANDS[0]).story).feedback.map((f, i) => (
                        <div key={i} className="flex gap-3 items-start">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                            <span className="text-xs font-bold">{i + 1}</span>
                          </div>
                          <p className="text-sm opacity-80 leading-relaxed">{f}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className={`flex-1 p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} border border-dashed border-gray-300 dark:border-gray-700`}>
                      <div className="text-xs opacity-50 mb-1">知识库匹配</div>
                      <div className="font-bold">{(BRANDS.find(b => b.id === state.brandId || b.name === (state.brandName || '')) || BRANDS[0]).name}</div>
                    </div>
                    <div className={`flex-1 p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} border border-dashed border-gray-300 dark:border-gray-700`}>
                      <div className="text-xs opacity-50 mb-1">输入字数</div>
                      <div className="font-bold">{(state.inputText || '').length} 字</div>
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
          <TianjinButton 
            variant="ghost" 
            onClick={prev} 
            disabled={step === 1}
            leftIcon={<i className="fas fa-arrow-left"></i>}
          >
            上一步
          </TianjinButton>
          
          <div className="flex gap-3">
            {step === 4 ? (
              <>
                <TianjinButton 
                  variant="secondary"
                  onClick={() => {
                    const prompt = state.inputText || '';
                    const url = `/create?prompt=${encodeURIComponent(prompt)}&from=wizard`;
                    navigate(url);
                  }}
                >
                  导入创作中心
                </TianjinButton>
                <TianjinButton 
                  primary 
                  onClick={savePost}
                  rightIcon={<i className="fas fa-check"></i>}
                >
                  发布到广场
                </TianjinButton>
              </>
            ) : (
              <TianjinButton 
                primary 
                onClick={next}
                disabled={step === 1 && !state.brandName || step === 2 && !state.inputText}
                rightIcon={<i className="fas fa-arrow-right"></i>}
              >
                下一步
              </TianjinButton>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
