import { useState } from 'react'
import { useTheme } from '@/hooks/useTheme'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useRef } from 'react'

import GradientHero from '../components/GradientHero'
import Footer from '@/components/Footer'
import { TianjinTag, TianjinDivider, TianjinButton } from '@/components/TianjinStyleComponents'
import { llmService } from '@/services/llmService'
import voiceService from '@/services/voiceService'
import { toast } from 'sonner'

export default function Tools() {
  const { isDark } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [query, setQuery] = useState('')
  const [aiDirections, setAiDirections] = useState<string[]>([])
  const [aiText, setAiText] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [culturalElements, setCulturalElements] = useState<string[]>([])
  const [ttsUrl, setTtsUrl] = useState<string>('')
  const [ttsLoading, setTtsLoading] = useState<boolean>(false)
  const [fusionMode, setFusionMode] = useState<boolean>(false)
  const [restored, setRestored] = useState<boolean>(false)
  const abortRef = useRef<AbortController | null>(null)
  const [ttsOpts, setTtsOpts] = useState<{ voice: string; speed: number; pitch: number }>({ voice: 'female', speed: 1, pitch: 0 })
  const [savedPlans, setSavedPlans] = useState<Array<{ id: string; title: string; query: string; aiText: string; ts: number }>>([])
  const [showAudioSettings, setShowAudioSettings] = useState(false)

  const tools = [
    { id: 'sketch', title: '一键国潮设计', description: '自动生成国潮风格设计方案', icon: 'palette', color: 'purple' },
    { id: 'pattern', title: '文化资产嵌入', description: '智能嵌入传统文化元素与纹样', icon: 'gem', color: 'yellow' },
    { id: 'filter', title: 'AI滤镜', description: '增强作品表现力的独特滤镜', icon: 'filter', color: 'blue' },
    { id: 'trace', title: '文化溯源', description: '设计中文化元素来源的提示', icon: 'book', color: 'green' },
  ]
  const toolStats: Record<string, number> = {
    sketch: 1280,
    pattern: 940,
    filter: 1560,
    trace: 820,
  }
  const formatCount = (n: number) => {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
    return String(n)
  }
  const abVariant = new URLSearchParams(location.search).get('ab') || ''
  const displayTools = activeFilters.length === 0 ? tools : tools.filter(t => activeFilters.some(f => t.title.includes(f) || t.description.includes(f)))
  // 中文注释：工具优势与示例提示词（用于“了解详情”展开内容）
  const toolBenefits: Record<string, string[]> = {
    sketch: ['国潮配色智能推荐', '经典构图模板套用', '风格统一与对齐'],
    pattern: ['元素检索与智能嵌入', '纹样冲突检测提示', '一键生成应用位图'],
    filter: ['风格滤镜一键切换', '参数可控与批量应用', '快速预览省时省力'],
    trace: ['元素来源溯源提示', '文化语境辅注与解释', '版权风险友好提醒'],
  }
  
  // 中文注释：增强创作模板库
  const creationTemplates: Record<string, Array<{ id: string; title: string; description: string; prompt: string; category: string }>> = {
    sketch: [
      {
        id: 'sketch-1',
        title: '杨柳青年画包装',
        description: '传统杨柳青年画风格的产品包装设计',
        prompt: '杨柳青年画·包装焕新·国潮风格·红蓝主色·细腻纹理·古典人物形象·喜庆氛围',
        category: '包装设计'
      },
      {
        id: 'sketch-2',
        title: '现代国潮海报',
        description: '融合现代设计元素的国潮风格海报',
        prompt: '现代国潮海报·几何图形·鲜艳色彩·传统文化元素·动态构图·时尚感·年轻人喜爱',
        category: '海报设计'
      },
      {
        id: 'sketch-3',
        title: '传统纹样插画',
        description: '基于传统纹样的插画设计',
        prompt: '传统纹样插画·对称构图·柔和色调·细腻线条·文化底蕴·艺术感',
        category: '插画设计'
      }
    ],
    pattern: [
      {
        id: 'pattern-1',
        title: '回纹与祥云融合',
        description: '将回纹与祥云纹样嵌入现代设计',
        prompt: '将回纹与祥云纹样嵌入现代海报·保留传统比例与间距·和谐配色·文化融合·视觉平衡',
        category: '纹样设计'
      },
      {
        id: 'pattern-2',
        title: '传统服饰纹样',
        description: '适用于服饰设计的传统纹样',
        prompt: '传统服饰纹样·连续图案·适合丝绸面料·优雅配色·古典美感·现代应用',
        category: '服饰设计'
      },
      {
        id: 'pattern-3',
        title: '现代家居纹样',
        description: '适用于家居产品的现代传统纹样',
        prompt: '现代家居纹样·简约设计·柔和色调·几何变形·传统元素·实用性',
        category: '家居设计'
      }
    ],
    filter: [
      {
        id: 'filter-1',
        title: '东方美学滤镜',
        description: '提升作品东方美学质感的滤镜',
        prompt: '为插画应用“东方美学”滤镜·提升色彩层次与光影质感·古典韵味·柔和过渡·艺术氛围',
        category: '图像处理'
      },
      {
        id: 'filter-2',
        title: '国潮复古滤镜',
        description: '营造复古国潮氛围的滤镜',
        prompt: '应用国潮复古滤镜·暖色调·胶片质感·颗粒感·复古氛围·怀旧风格',
        category: '图像处理'
      },
      {
        id: 'filter-3',
        title: '现代简约滤镜',
        description: '适合现代设计的简约滤镜',
        prompt: '应用现代简约滤镜·高对比度·清晰线条·简约配色·专业感·时尚设计',
        category: '图像处理'
      }
    ],
    trace: [
      {
        id: 'trace-1',
        title: '海河文化溯源',
        description: '说明海河主题作品中的文化元素来源',
        prompt: '说明海河主题海报里的文化元素来源，并给出参考链接·历史背景·文化意义·视觉表现·准确性',
        category: '文化研究'
      },
      {
        id: 'trace-2',
        title: '传统工艺溯源',
        description: '追溯传统工艺元素的历史背景',
        prompt: '追溯传统工艺元素的历史背景·工艺特点·文化价值·现代传承·创新应用',
        category: '文化研究'
      },
      {
        id: 'trace-3',
        title: '民俗文化解读',
        description: '解读作品中的民俗文化元素',
        prompt: '解读作品中的民俗文化元素·象征意义·历史渊源·地域特色·文化传承',
        category: '文化研究'
      }
    ]
  }
  
  const samplePrompts: Record<string, string> = {
    sketch: '杨柳青年画·包装焕新·国潮风格·红蓝主色·细腻纹理',
    pattern: '将回纹与祥云纹样嵌入现代海报·保留传统比例与间距',
    filter: '为插画应用“东方美学”滤镜·提升色彩层次与光影质感',
    trace: '说明海河主题海报里的文化元素来源，并给出参考链接',
  }
  // 中文注释：轻量事件埋点（通过浏览器事件分发，后续可被监听器消费）
  const track = (name: string, detail?: any) => { try { window.dispatchEvent(new CustomEvent(name, { detail })) } catch {} }
  // 中文注释：A/B 参数控制（如：cta_outline / details_open）
  const expandAll = abVariant === 'details_open'
  const [expandedTool, setExpandedTool] = useState<string | null>(expandAll ? 'all' : null)

  const generateSuggestions = async () => {
    const base = query.trim() || '天津传统文化 创意工具 推荐'
    setIsGenerating(true)
    try {
      const dirs = llmService.generateCreativeDirections(base)
      setAiDirections(dirs)
      const elems = llmService.recommendCulturalElements(base)
      setCulturalElements(elems)
      abortRef.current?.abort()
      abortRef.current = new AbortController()
      await llmService.generateResponse(base, { onDelta: (chunk: string) => setAiText(chunk), signal: abortRef.current.signal })
      try {
        const payload = { query: base, dirs, elems, ts: Date.now() }
        localStorage.setItem('TOOLS_LAST_RECOMMEND', JSON.stringify(payload))
      } catch {}
    } catch {}
    setIsGenerating(false)
  }

  const toggleFilter = (f: string) => {
    setActiveFilters(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f])
  }

  const clearFilters = () => {
    setActiveFilters([])
  }

  const helperRef = useRef<HTMLDivElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const inspireTriggeredRef = useRef<boolean>(false) // 中文注释：避免在开发模式下重复触发灵感生成
  
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const paramQuery = params.get('query') || ''
    const mode = params.get('mode') || ''
    const from = params.get('from') || ''
    if (paramQuery) {
      setQuery(paramQuery)
    }
    if (from === 'home') {
      helperRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    if (mode === 'inspire' && !inspireTriggeredRef.current) {
      inspireTriggeredRef.current = true
      generateSuggestions()
    }
    if (!restored) {
      try {
        const raw = localStorage.getItem('TOOLS_LAST_RECOMMEND')
        if (raw) {
          const obj = JSON.parse(raw)
          if (obj?.query) setQuery(obj.query)
          if (Array.isArray(obj?.dirs)) setAiDirections(obj.dirs)
          if (Array.isArray(obj?.elems)) setCulturalElements(obj.elems)
        }
        const ttsRaw = localStorage.getItem('TOOLS_TTS_OPTS')
        if (ttsRaw) {
          const o = JSON.parse(ttsRaw)
          if (o && typeof o === 'object') setTtsOpts({ voice: o.voice || 'female', speed: Number(o.speed) || 1, pitch: Number(o.pitch) || 0 })
        }
        const plansRaw = localStorage.getItem('TOOLS_SAVED_PLANS')
        if (plansRaw) {
          const arr = JSON.parse(plansRaw)
          if (Array.isArray(arr)) setSavedPlans(arr)
        }
      } catch {}
      setRestored(true)
    }
  }, [location.search])

  const randomInspiration = () => {
    const subjects = ['杨柳青年画', '景德镇瓷器', '同仁堂品牌', '回纹几何', '海河文化']
    const actions = ['包装焕新', '联名企划', '插画风格', '导视系统', 'KV设计']
    const styles = ['国潮', '极简', '东方美学', '现代主义', '复古潮']
    const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)]
    const q = `${pick(subjects)}·${pick(actions)}·${pick(styles)}`
    setQuery(q)
    generateSuggestions()
  }

  const restoreLast = () => {
    try {
      const raw = localStorage.getItem('TOOLS_LAST_RECOMMEND')
      if (!raw) return
      const obj = JSON.parse(raw)
      if (obj?.query) setQuery(obj.query)
      if (Array.isArray(obj?.dirs)) setAiDirections(obj.dirs)
      if (Array.isArray(obj?.elems)) setCulturalElements(obj.elems)
      toast.success('已恢复上次推荐')
    } catch (e: any) {
      toast.error(e?.message || '恢复失败')
    }
  }

  const sharePlan = async () => {
    const baseText = (query || aiText).trim()
    const url = new URL(window.location.href)
    url.searchParams.set('query', baseText || '创作灵感')
    url.searchParams.set('mode', 'inspire')
    const shareUrl = url.toString()
    try { await navigator.clipboard.writeText(shareUrl); toast.success('分享链接已复制') } catch { toast.info(shareUrl) }
  }

  const saveCurrentPlan = () => {
    const text = (aiText || '').trim()
    const q = (query || '').trim()
    if (!text && !q) { toast.warning('暂无可保存内容'); return }
    const title = text.split('\n')[0] || q || '未命名方案'
    const id = String(Date.now())
    const item = { id, title, query: q, aiText: text, ts: Date.now() }
    const next = [item, ...savedPlans].slice(0, 20)
    setSavedPlans(next)
    try { localStorage.setItem('TOOLS_SAVED_PLANS', JSON.stringify(next)); toast.success('已保存到“我的方案”') } catch {}
  }

  const applyPlanToCreate = (planId: string) => {
    const p = savedPlans.find(x => x.id === planId)
    if (!p) return
    const content = p.aiText || p.query
    const url = `/create?from=tools&prompt=${encodeURIComponent(content)}`
    navigate(url)
  }

  const removePlan = (planId: string) => {
    const next = savedPlans.filter(x => x.id !== planId)
    setSavedPlans(next)
    try { localStorage.setItem('TOOLS_SAVED_PLANS', JSON.stringify(next)) } catch {}
  }

  const clearPlans = () => {
    setSavedPlans([])
    try { localStorage.removeItem('TOOLS_SAVED_PLANS'); toast.success('已清空“我的方案”') } catch {}
  }

  return (
    <>
      <main className="relative container mx-auto px-6 md:px-8 py-8">
        <div className={`pointer-events-none absolute -top-10 -left-10 w-64 h-64 bg-gradient-to-br ${fusionMode ? 'from-indigo-500/20 via-fuchsia-500/20 to-amber-400/20' : 'from-blue-500/20 via-red-500/20 to-yellow-500/20'} blur-3xl rounded-full`}></div>
        <div className={`pointer-events-none absolute -bottom-10 -right-10 w-72 h-72 bg-gradient-to-tr ${fusionMode ? 'from-cyan-500/15 via-indigo-500/15 to-fuchsia-500/15' : 'from-red-500/15 via-yellow-500/15 to-blue-500/15'} blur-3xl rounded-full`}></div>
        {fusionMode && (
          <div
            className="pointer-events-none absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }}
          ></div>
        )}
        
        <GradientHero
          title="创作工具"
          subtitle="面向传统文化创新的低门槛 AI 工具集"
          badgeText="Beta"
          theme={fusionMode ? 'indigo' : 'red'}
          variant={fusionMode ? 'split' : 'center'}
          size={fusionMode ? 'lg' : 'md'}
          pattern={fusionMode}
          backgroundImage="https://picsum.photos/seed/creative/1920/1080"
          stats={[
            { label: '精选', value: '优选' },
            { label: '风格', value: '融合' },
            { label: '效率', value: '提升' },
            { label: '协作', value: '共创' },
          ]}
        />

        {/* AI Assistant Section - Optimized */}
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className={`relative overflow-hidden rounded-3xl border shadow-2xl transition-all mb-12 group ${
                isDark 
                    ? 'bg-gray-900/80 border-gray-800 backdrop-blur-xl' 
                    : 'bg-white/80 border-white/40 backdrop-blur-xl shadow-red-500/5'
            }`}
        >
          {/* Header */}
          <div className={`flex items-center justify-between px-6 py-5 border-b ${
             isDark ? 'border-gray-800' : 'border-gray-100 bg-white/50'
          }`}>
             <div className="flex items-center gap-4">
               <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${
                  fusionMode 
                    ? 'bg-gradient-to-tr from-indigo-500 to-purple-500 text-white' 
                    : 'bg-gradient-to-tr from-[#C02C38] to-[#E60012] text-white'
               }`}>
                 <i className={`fas ${fusionMode ? 'fa-bolt' : 'fa-sparkles'} text-xl`}></i>
               </div>
               <div>
                 <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    AI 创意助手
                 </h2>
                 <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {fusionMode ? '多模态融合引擎已激活' : '智能匹配最佳创作工具与方案'}
                 </p>
               </div>
             </div>

             <div className="flex items-center gap-2">
                <button 
                  onClick={() => setFusionMode(!fusionMode)}
                  className={`p-2 rounded-xl transition-all ${
                     fusionMode 
                       ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' 
                       : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400'
                  }`}
                  title="切换融合模式"
                >
                  <i className="fas fa-random"></i>
                </button>
                <button 
                   onClick={randomInspiration}
                   className={`px-3 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                      isDark 
                        ? 'bg-gray-800 hover:bg-gray-700 text-gray-200' 
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                   }`}
                >
                   <i className="fas fa-dice"></i>
                   <span className="hidden sm:inline">随机灵感</span>
                </button>
                <button 
                   onClick={restoreLast}
                   className={`p-2 rounded-xl transition-all ${
                      isDark 
                        ? 'bg-gray-800 hover:bg-gray-700 text-gray-400' 
                        : 'bg-white hover:bg-gray-50 text-gray-400 border border-gray-200'
                   }`}
                   title="恢复上次记录"
                >
                   <i className="fas fa-history"></i>
                </button>
             </div>
          </div>

          <div 
            ref={helperRef}
            className="p-6 md:p-8"
            onDragOver={(e) => { e.preventDefault() }}
            onDrop={async (e) => { e.preventDefault(); const files = Array.from(e.dataTransfer.files || []); const audio = files.find(f => f.type.startsWith('audio/')); if (!audio) return; try { const t = await voiceService.transcribeAudio(audio as File); setQuery(t); await generateSuggestions() } catch (err: any) { toast.error(err?.message || '语音识别失败') } }}
          >
            {/* Input Area */}
            <div className="relative group mb-6">
                <textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); generateSuggestions() } }}
                    placeholder="描述您的创意需求，例如：'为杨柳青年画设计一个现代国潮风格的咖啡包装'..."
                    className={`w-full p-5 pr-32 rounded-3xl h-36 text-base resize-none transition-all shadow-sm focus:shadow-md outline-none border-2 ${
                        isDark 
                          ? 'bg-gray-900/50 border-gray-700 text-white placeholder-gray-600 focus:border-indigo-500' 
                          : 'bg-white border-gray-100 text-gray-800 placeholder-gray-400 focus:border-red-100'
                    }`}
                />
                
                <div className="absolute bottom-4 right-4 flex items-center gap-2">
                   <button 
                      onClick={() => fileInputRef.current?.click()}
                      className={`p-3 rounded-full transition-all ${
                         isDark 
                           ? 'bg-gray-800 hover:bg-gray-700 text-gray-400' 
                           : 'bg-gray-100 hover:bg-gray-200 text-gray-500'
                      }`}
                      title="语音输入"
                   >
                      <i className="fas fa-microphone"></i>
                   </button>
                   <button 
                      onClick={generateSuggestions}
                      disabled={isGenerating || !query.trim()}
                      className={`px-6 py-3 rounded-full font-bold text-white shadow-lg transition-all flex items-center gap-2 ${
                          isGenerating 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : fusionMode 
                                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-indigo-500/30 hover:scale-105'
                                : 'bg-gradient-to-r from-[#C02C38] to-[#E60012] hover:shadow-red-500/30 hover:scale-105'
                      }`}
                   >
                      {isGenerating ? (
                        <><i className="fas fa-spinner fa-spin"></i> 思考中</>
                      ) : (
                        <><i className="fas fa-magic"></i> 智能推荐</>
                      )}
                   </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; try { const t = await voiceService.transcribeAudio(f); setQuery(t); await generateSuggestions() } catch (err: any) { toast.error(err?.message || '语音识别失败') } }}
                />
            </div>

            {/* Tags / Suggestions */}
            <AnimatePresence>
                {(aiDirections.length > 0 || culturalElements.length > 0) && (
                    <motion.div 
                       initial={{ opacity: 0, height: 0 }}
                       animate={{ opacity: 1, height: 'auto' }}
                       exit={{ opacity: 0, height: 0 }}
                       className="flex flex-wrap gap-2 mb-6"
                    >
                        {aiDirections.map((d, i) => (
                           <button 
                              key={`dir-${i}`} 
                              onClick={() => toggleFilter(d)} 
                              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                                 activeFilters.includes(d)
                                   ? 'bg-red-50 border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'
                                   : isDark 
                                     ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700' 
                                     : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                              }`}
                           >
                             <i className="fas fa-compass mr-1.5 opacity-60"></i>{d}
                           </button>
                        ))}
                        {culturalElements.map((d, i) => (
                           <button 
                              key={`elem-${i}`} 
                              onClick={() => toggleFilter(d)} 
                              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                                 activeFilters.includes(d)
                                   ? 'bg-yellow-50 border-yellow-200 text-yellow-700 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-400'
                                   : isDark 
                                     ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700' 
                                     : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                              }`}
                           >
                             <i className="fas fa-dragon mr-1.5 opacity-60"></i>{d}
                           </button>
                        ))}
                         {activeFilters.length > 0 && (
                            <button onClick={clearFilters} className="px-3 py-1.5 rounded-full text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                               清除筛选
                            </button>
                         )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* AI Result Card */}
            <AnimatePresence mode="wait">
                {aiText ? (
                    <motion.div
                       key="result"
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       exit={{ opacity: 0, y: -10 }}
                       className={`relative rounded-2xl p-6 border ${
                          isDark 
                            ? 'bg-gray-800/50 border-gray-700' 
                            : 'bg-gradient-to-br from-gray-50 to-white border-gray-100'
                       }`}
                    >
                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-red-500 to-transparent rounded-l-2xl opacity-50"></div>
                        
                        <div className="flex items-center gap-2 mb-4">
                           <span className="text-xs font-bold uppercase tracking-wider text-red-500">AI Suggestion</span>
                           <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700"></div>
                        </div>

                        <output 
                           id="ai-output" 
                           role="status" 
                           className={`block whitespace-pre-wrap leading-relaxed text-sm md:text-base ${
                              isDark ? 'text-gray-200' : 'text-gray-800'
                           }`}
                        >
                           {aiText}
                        </output>

                        {/* Action Bar */}
                        <div className="flex flex-wrap items-center justify-between gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                           <div className="flex items-center gap-2">
                              {/* TTS Button with Settings Trigger */}
                              <div className="relative flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                                  <button 
                                     onClick={async () => { if (!aiText.trim()) return; try { setTtsLoading(true); const r = await voiceService.synthesize(aiText, { voice: ttsOpts.voice, speed: ttsOpts.speed, pitch: ttsOpts.pitch, format: 'mp3' }); setTtsUrl(r.audioUrl) } catch (e: any) { toast.error(e?.message || '朗读失败') } finally { setTtsLoading(false) } }}
                                     disabled={ttsLoading}
                                     className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-2 ${
                                        ttsLoading 
                                          ? 'bg-green-100 text-green-700 cursor-wait' 
                                          : 'hover:bg-white dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 shadow-sm'
                                     }`}
                                  >
                                     <i className={`fas ${ttsLoading ? 'fa-circle-notch fa-spin' : 'fa-volume-up'}`}></i>
                                     {ttsLoading ? '生成中' : '朗读'}
                                  </button>
                                  <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1"></div>
                                  <button 
                                     onClick={() => setShowAudioSettings(!showAudioSettings)}
                                     className={`p-1.5 rounded-md text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors ${showAudioSettings ? 'bg-gray-200 dark:bg-gray-600' : ''}`}
                                  >
                                     <i className="fas fa-sliders-h text-xs"></i>
                                  </button>
                              </div>

                              {/* Audio Settings Popover */}
                              <AnimatePresence>
                                 {showAudioSettings && (
                                    <motion.div 
                                       initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                       animate={{ opacity: 1, y: 0, scale: 1 }}
                                       exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                       className={`absolute bottom-full left-0 mb-2 p-4 rounded-xl shadow-xl border w-64 z-10 ${
                                          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                                       }`}
                                    >
                                       <div className="space-y-3">
                                          <div className="flex items-center justify-between text-xs">
                                             <span className="font-medium">语音设置</span>
                                             <button onClick={() => setShowAudioSettings(false)}><i className="fas fa-times"></i></button>
                                          </div>
                                          <div className="space-y-2">
                                             <div className="flex items-center justify-between text-xs">
                                                <span>音色</span>
                                                <select 
                                                   value={ttsOpts.voice} 
                                                   onChange={(e) => setTtsOpts({...ttsOpts, voice: e.target.value})}
                                                   className={`rounded border p-1 ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}
                                                >
                                                   <option value="female">女声 (默认)</option>
                                                   <option value="male">男声</option>
                                                </select>
                                             </div>
                                             <div className="space-y-1">
                                                <div className="flex justify-between text-xs text-gray-500"><span>语速</span><span>{ttsOpts.speed}x</span></div>
                                                <input type="range" min="0.5" max="2" step="0.1" value={ttsOpts.speed} onChange={(e) => setTtsOpts({...ttsOpts, speed: parseFloat(e.target.value)})} className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                                             </div>
                                          </div>
                                       </div>
                                    </motion.div>
                                 )}
                              </AnimatePresence>

                              <button 
                                 onClick={async () => { try { await navigator.clipboard.writeText(aiText); toast.success('建议已复制') } catch { toast.error('复制失败') } }}
                                 className={`p-2 rounded-lg transition-colors text-gray-500 hover:text-gray-900 dark:hover:text-white ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                                 title="复制"
                              >
                                 <i className="far fa-copy"></i>
                              </button>
                              
                              <button 
                                 onClick={saveCurrentPlan}
                                 className={`p-2 rounded-lg transition-colors text-gray-500 hover:text-gray-900 dark:hover:text-white ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                                 title="保存到方案库"
                              >
                                 <i className="far fa-bookmark"></i>
                              </button>
                           </div>

                           <div className="flex gap-3">
                              <button 
                                 onClick={() => setAiText('')} 
                                 className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                                    isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
                                 }`}
                              >
                                 清空
                              </button>
                              <button 
                                 onClick={() => navigate(`/create?from=tools&prompt=${encodeURIComponent(aiText || query)}`)}
                                 className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-lg shadow-blue-500/30 transition-all hover:scale-105"
                              >
                                 应用到创作
                                 <i className="fas fa-arrow-right ml-2 text-xs"></i>
                              </button>
                           </div>
                        </div>
                        {ttsUrl && (<audio controls src={ttsUrl} className="mt-4 w-full h-8 opacity-80 hover:opacity-100 transition-opacity" />)}
                    </motion.div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 opacity-50 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
                       <i className="fas fa-lightbulb text-4xl mb-3 text-gray-300 dark:text-gray-700"></i>
                       <p className="text-sm">输入需求或点击“随机灵感”，AI将为您提供专业建议</p>
                    </div>
                )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* My Plans Section - Integrated nicely */}
        <AnimatePresence>
            {savedPlans.length > 0 && (
                <motion.div 
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   className="mb-12"
                >
                   <div className="flex items-center justify-between mb-4 px-2">
                      <h3 className="font-bold text-lg">我的方案库 ({savedPlans.length})</h3>
                      <button onClick={clearPlans} className="text-xs text-red-500 hover:underline">清空全部</button>
                   </div>
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {savedPlans.map(p => (
                         <div key={p.id} className={`p-4 rounded-2xl border transition-all hover:shadow-md ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                             <div className="flex justify-between items-start mb-2">
                                <h4 className="font-bold text-sm line-clamp-1">{p.title}</h4>
                                <span className="text-[10px] opacity-50">{new Date(p.ts).toLocaleDateString()}</span>
                             </div>
                             <p className="text-xs opacity-60 line-clamp-2 mb-3 h-8">{p.aiText || p.query}</p>
                             <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                                <div className="flex gap-2">
                                   <button onClick={() => removePlan(p.id)} className="text-gray-400 hover:text-red-500 text-xs"><i className="fas fa-trash"></i></button>
                                   <button onClick={async () => { try { await navigator.clipboard.writeText(p.aiText || p.query); toast.success('已复制') } catch {} }} className="text-gray-400 hover:text-blue-500 text-xs"><i className="far fa-copy"></i></button>
                                </div>
                                <button onClick={() => applyPlanToCreate(p.id)} className="text-xs font-medium text-blue-600 hover:underline">应用</button>
                             </div>
                         </div>
                      ))}
                   </div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* 工具列表主标题：PC端适当缩小字号 */}
        <h2 className="text-lg md:text-xl font-semibold mb-6">推荐创作工具</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 will-change-transform">
          {displayTools.map((tool, index) => (
            <motion.div
              key={tool.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 * index }}
              whileHover={{ y: -3, scale: 1.01 }}
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/create?tool=${tool.id}`) } }}
              onClick={() => navigate(`/create?tool=${tool.id}`)}
              aria-label={`${tool.title} 卡片`}
              role="button"
              className="cursor-pointer"
            >
              <div className="rounded-2xl p-[1px] bg-gradient-to-br from-blue-500/25 via-red-500/25 to-yellow-500/25">
                <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-sm backdrop-blur-sm`}> 
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <motion.div 
                        className={`w-9 h-9 rounded-full flex items-center justify-center ${tool.color === 'purple' ? 'bg-purple-100 text-purple-600' : tool.color === 'yellow' ? 'bg-yellow-100 text-yellow-600' : tool.color === 'blue' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}
                        whileHover={{ rotate: 5 }}
                      >
                        <i className={`fas fa-${tool.icon}`}></i>
                      </motion.div>
                      <TianjinTag color={tool.color as any}>{tool.title}</TianjinTag>
                    </div>
                    <span className={`${isDark ? 'text-gray-500' : 'text-gray-400'} text-xs`}>精选工具</span>
                  </div>
                  {/* 工具标题：统一为中等字号，兼顾可读性与层级 */}
                  <h3 id={`tool-${tool.id}-title`} className="text-base md:text-lg font-semibold mb-2">{tool.title}</h3>
                  <p id={`tool-${tool.id}-desc`} className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{tool.description}</p>
                  <div className={`${isDark ? 'text-gray-500' : 'text-gray-500'} text-xs mb-4 flex items-center gap-1`}>
                    <i className="far fa-user"></i>
                    <span>近7天使用 {formatCount(toolStats[tool.id])}+ </span>
                  </div>
                  {/* 中文注释：卡片详情展开区（验证“Prove/证明”与“减少认知负担”的假设） */}
                      {expandedTool === tool.id || expandedTool === 'all' ? (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-4">
                          <ul className={`${isDark ? 'text-gray-300' : 'text-gray-700'} text-sm space-y-1`} aria-label="优势列表">
                            {(toolBenefits[tool.id] || []).map((b, i) => (
                              <li key={i} className="flex items-center"><i className="fas fa-check-circle text-green-500 mr-2"></i>{b}</li>
                            ))}
                          </ul>
                          <div className="mt-2 text-xs opacity-80">示例提示词：{samplePrompts[tool.id]}</div>
                          <div className="mt-2 flex gap-2">
                            <TianjinButton 
                              variant="ghost" 
                              size="sm"
                              onClick={async () => { try { await navigator.clipboard.writeText(samplePrompts[tool.id]); track('tools:copy_prompt', { tool: tool.id }); } catch {} }}
                            >
                              复制示例提示词
                            </TianjinButton>
                            <TianjinButton 
                              variant="secondary" 
                              size="sm"
                              onClick={() => { navigate(`/create?tool=${tool.id}&prompt=${encodeURIComponent(samplePrompts[tool.id])}`); track('tools:apply_prompt', { tool: tool.id }); }}
                            >
                              一键应用到创作
                            </TianjinButton>
                          </div>
                          
                          {/* 中文注释：新增创作模板选择功能 */}
                          <div className="mt-4">
                            <h4 className="font-medium text-sm mb-2">创作模板库</h4>
                            <div className="space-y-2">
                              {creationTemplates[tool.id]?.map((template) => (
                                <div key={template.id} className={`p-2 rounded-lg border ${isDark ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-gray-50'} text-xs`}>
                                  <div className="flex justify-between items-start mb-1">
                                    <div>
                                      <div className="font-medium">{template.title}</div>
                                      <div className="opacity-70">{template.description}</div>
                                      <div className="opacity-60 mt-1">{template.category}</div>
                                    </div>
                                    <div className="flex gap-1">
                                      <TianjinButton 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={async () => { 
                                          try { 
                                            await navigator.clipboard.writeText(template.prompt); 
                                            track('tools:copy_template_prompt', { tool: tool.id, template: template.id }); 
                                            toast.success('模板提示词已复制');
                                          } catch {} 
                                        }}
                                      >
                                        复制
                                      </TianjinButton>
                                      <TianjinButton 
                                        variant="secondary" 
                                        size="sm"
                                        onClick={() => { 
                                          navigate(`/create?tool=${tool.id}&prompt=${encodeURIComponent(template.prompt)}`); 
                                          track('tools:apply_template', { tool: tool.id, template: template.id }); 
                                        }}
                                      >
                                        应用
                                      </TianjinButton>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      ) : null}
                  <motion.div whileHover={{ scale: 1.02 }}>
                    <TianjinButton 
                      onClick={() => { track('tools:cta_click', { tool: tool.id }); navigate(`/create?tool=${tool.id}`) }} 
                      ariaLabel={`立即使用 ${tool.title}`}
                      variant={abVariant === 'cta_outline' ? 'secondary' : 'primary'}
                      rightIcon={<i className="fas fa-arrow-right text-xs"></i>}
                      fullWidth
                    >
                      立即使用
                    </TianjinButton>
                  </motion.div>
                  <div className="mt-2">
                    <TianjinButton 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setExpandedTool(prev => (prev === tool.id ? null : tool.id))}
                      aria-expanded={expandedTool === tool.id || expandedTool === 'all'}
                    >
                      {expandedTool === tool.id || expandedTool === 'all' ? '收起详情' : '了解详情'}
                    </TianjinButton>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        <TianjinDivider />
      </main>
    </>
  )
}
