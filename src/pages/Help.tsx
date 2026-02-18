import { useTheme } from '@/hooks/useTheme'
import { useState, useMemo, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  ChevronDown,
  HelpCircle,
  MessageCircle,
  Mail,
  Phone,
  BookOpen,
  User,
  Sparkles,
  Users,
  Crown,
  Shield,
  Wrench,
  FileText,
  ExternalLink,
  MessageSquare,
  TrendingUp,
  Clock,
  CheckCircle2,
  X,
  Menu,
  ArrowRight,
  Lightbulb,
  Zap
} from 'lucide-react'

// FAQ类别类型
type FAQCategory = 'all' | 'basic' | 'auth' | 'creation' | 'community' | 'membership' | 'security' | 'technical'

// FAQ项目类型
interface FAQItem {
  id: string
  question: string
  answer: string
  category: FAQCategory
  views?: number
  helpful?: number
}

// 分类配置
interface CategoryConfig {
  value: FAQCategory
  label: string
  icon: React.ElementType
  color: string
  description: string
}

// 动画配置
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.05
    }
  }
}

const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 }
}

export default function Help() {
  const { isDark } = useTheme()
  const [activeCategory, setActiveCategory] = useState<FAQCategory>('all')
  const [expandedIds, setExpandedIds] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [showHistory, setShowHistory] = useState(false)

  // 分类配置
  const categories: CategoryConfig[] = [
    { value: 'all', label: '全部', icon: BookOpen, color: 'from-blue-500 to-indigo-600', description: '查看所有常见问题' },
    { value: 'basic', label: '基础使用', icon: HelpCircle, color: 'from-emerald-500 to-teal-600', description: '平台基础功能使用指南' },
    { value: 'auth', label: '账号管理', icon: User, color: 'from-violet-500 to-purple-600', description: '注册、登录、密码管理' },
    { value: 'creation', label: 'AI创作', icon: Sparkles, color: 'from-amber-500 to-orange-600', description: 'AI创作工具使用教程' },
    { value: 'community', label: '社区互动', icon: Users, color: 'from-pink-500 to-rose-600', description: '社区功能与互动指南' },
    { value: 'membership', label: '会员权益', icon: Crown, color: 'from-yellow-500 to-amber-600', description: '会员特权与升级说明' },
    { value: 'security', label: '安全隐私', icon: Shield, color: 'from-cyan-500 to-blue-600', description: '账号安全与隐私保护' },
    { value: 'technical', label: '技术支持', icon: Wrench, color: 'from-slate-500 to-gray-600', description: '技术问题与故障排除' }
  ]

  // 完整的FAQ列表
  const faqs: FAQItem[] = [
    {
      id: 'faq-1',
      question: '如何开始使用 AI 创作工具？',
      answer: '登录后进入"AI 创作工具"页面，选择模型与参数，按照向导完成创作流程。你可以选择不同的创作模板，或者从头开始创建自己的作品。系统会提供实时预览功能，帮助你调整创作效果。首次使用建议查看新手引导教程。',
      category: 'basic',
      views: 12580,
      helpful: 98
    },
    {
      id: 'faq-2',
      question: '生成的内容是否可以商用？',
      answer: '请确保素材与品牌授权合规。平台不自动提供第三方授权，需由用户自行确认与取得。对于商业用途，建议你在使用前咨询专业的法律意见，确保你的使用符合相关法律法规。VIP会员享有商业授权特权。',
      category: 'basic',
      views: 8920,
      helpful: 95
    },
    {
      id: 'faq-3',
      question: '账号安全如何保障？',
      answer: '请勿泄露登录信息，启用强密码，并避免在公共设备保存登录状态。平台采用了多种安全措施，包括密码加密存储、HTTPS传输、登录验证等，保障你的账号安全。你还可以在设置中启用双因素认证，进一步增强账号安全性。',
      category: 'security',
      views: 7650,
      helpful: 97
    },
    {
      id: 'faq-4',
      question: '遇到问题如何反馈？',
      answer: '可通过页面右下角的反馈按钮提交问题，我们的客服团队会在24小时内回复。你也可以通过邮件联系平台支持：support@jinmaizhifang.com，或在工作时间拨打客服电话：400-123-4567。紧急问题建议直接电话联系。',
      category: 'basic',
      views: 6540,
      helpful: 92
    },
    {
      id: 'faq-5',
      question: '如何注册和登录账号？',
      answer: '你可以通过邮箱或手机号注册账号，也可以使用微信、支付宝等第三方账号快捷登录。注册完成后，系统会发送验证邮件或短信，验证通过后即可登录。支持多端同步登录，随时随地访问你的账号。',
      category: 'auth',
      views: 15230,
      helpful: 99
    },
    {
      id: 'faq-6',
      question: '忘记密码怎么办？',
      answer: '在登录页面点击"忘记密码"链接，按照提示输入注册邮箱或手机号，系统会发送密码重置链接或验证码。通过链接或验证码即可重置密码。为了账号安全，建议定期更换密码。',
      category: 'auth',
      views: 9870,
      helpful: 96
    },
    {
      id: 'faq-7',
      question: '如何修改个人信息？',
      answer: '登录后进入"个人中心"页面，点击"编辑资料"按钮即可修改个人信息，包括用户名、头像、邮箱、手机号等。修改完成后，系统会保存你的更改。部分敏感信息修改需要进行身份验证。',
      category: 'auth',
      views: 5430,
      helpful: 94
    },
    {
      id: 'faq-8',
      question: '如何使用AI创作功能？',
      answer: '进入"AI创作工具"页面，选择创作类型（图片、视频、文字等），输入创作提示词，调整参数设置，点击"生成"按钮即可生成内容。你可以对生成的内容进行编辑和调整，直到满意为止。高级会员可使用更多AI模型。',
      category: 'creation',
      views: 18920,
      helpful: 98
    },
    {
      id: 'faq-9',
      question: '如何保存和管理我的作品？',
      answer: '创作完成后，点击"保存"按钮即可将作品保存到"我的作品"页面。在该页面，你可以查看、编辑、删除、分享你的作品，还可以将作品分类管理。支持批量操作和文件夹管理功能。',
      category: 'creation',
      views: 7650,
      helpful: 93
    },
    {
      id: 'faq-10',
      question: '如何分享我的作品？',
      answer: '在作品详情页面，点击"分享"按钮，选择分享方式（微信、微博、QQ等）或复制分享链接，即可将作品分享给他人。你也可以设置作品的可见范围，控制谁可以查看你的作品。支持生成精美分享卡片。',
      category: 'community',
      views: 6780,
      helpful: 91
    },
    {
      id: 'faq-11',
      question: '如何加入社区讨论？',
      answer: '进入"社区"页面，浏览社区动态，点击帖子即可参与讨论。你可以点赞、评论、分享帖子，也可以创建自己的帖子，与其他用户交流创作经验和想法。遵守社区规范，文明交流。',
      category: 'community',
      views: 4320,
      helpful: 89
    },
    {
      id: 'faq-12',
      question: '如何关注其他用户？',
      answer: '在用户个人主页或社区动态中，点击用户头像或用户名进入用户详情页面，点击"关注"按钮即可关注该用户。关注后，你可以在"关注"页面查看该用户的最新动态。支持批量关注和分组管理。',
      category: 'community',
      views: 3890,
      helpful: 88
    },
    {
      id: 'faq-13',
      question: '会员有哪些权益？',
      answer: '会员可以享受无限AI生成次数、高级AI模型访问、高清作品导出、优先处理队列、专属模板库、去除水印等权益。不同等级的会员享受不同的权益，你可以在"会员中心"页面查看详细的会员权益说明。',
      category: 'membership',
      views: 11230,
      helpful: 97
    },
    {
      id: 'faq-14',
      question: '如何升级会员？',
      answer: '进入"会员中心"页面，选择你想要升级的会员等级，点击"立即升级"按钮，按照提示完成支付即可。支付成功后，你的会员等级会立即升级，享受相应的会员权益。支持多种支付方式。',
      category: 'membership',
      views: 8760,
      helpful: 95
    },
    {
      id: 'faq-15',
      question: '会员到期后怎么办？',
      answer: '会员到期后，你的会员权益会自动失效，系统会将你的会员等级恢复为免费会员。你可以在会员到期前续费，继续享受会员权益。系统会在会员到期前发送提醒通知，确保你不会错过续费时机。',
      category: 'membership',
      views: 6540,
      helpful: 94
    },
    {
      id: 'faq-16',
      question: '如何处理创作过程中的技术问题？',
      answer: '如果在创作过程中遇到技术问题，你可以尝试刷新页面、清除浏览器缓存、更换浏览器等方式解决。如果问题依然存在，请通过反馈渠道提交问题，我们的技术团队会尽快协助你解决。',
      category: 'technical',
      views: 5430,
      helpful: 90
    },
    {
      id: 'faq-17',
      question: '如何优化AI生成效果？',
      answer: '要优化AI生成效果，你可以尝试以下方法：1）提供更详细的提示词，明确描述你想要的效果；2）调整生成参数，如风格、细节程度等；3）使用参考图片或风格参考；4）尝试不同的AI模型。',
      category: 'technical',
      views: 7890,
      helpful: 96
    },
    {
      id: 'faq-18',
      question: '如何处理生成内容中的版权问题？',
      answer: '平台生成的内容可能包含受版权保护的元素，建议你在使用前检查内容的版权状态。对于商业用途，建议你使用平台提供的授权素材，或自行获取版权授权。如果发现生成内容存在版权问题，请立即停止使用，并联系平台客服。',
      category: 'security',
      views: 4320,
      helpful: 92
    },
    {
      id: 'faq-19',
      question: '如何使用品牌设计功能？',
      answer: '在"创作中心"选择"品牌设计"，你可以浏览并使用专业的品牌模板，上传和管理你的品牌Logo、配色、字体等资产。系统还提供"品牌一致性检查"工具，帮助你确保设计稿符合品牌规范。',
      category: 'creation',
      views: 5670,
      helpful: 89
    },
    {
      id: 'faq-20',
      question: '如何参加创意比赛？',
      answer: '进入"创作中心"的"赛事评选"页面，查看正在进行的比赛。点击比赛卡片可以查看详情和要求，使用"立即报名"按钮即可提交你的作品参与比赛。获奖作品将获得丰厚奖励和曝光机会。',
      category: 'community',
      views: 3450,
      helpful: 87
    },
    {
      id: 'faq-21',
      question: '作品上传支持哪些格式？',
      answer: '我们支持多种常见的媒体格式，包括图片（JPG, PNG, GIF, WebP）、视频（MP4, MOV, AVI）和文档（PDF, DOC, DOCX）。单个文件大小限制请参考上传页面的具体说明（图片通常50MB，视频500MB）。',
      category: 'technical',
      views: 6780,
      helpful: 94
    }
  ]

  // 搜索和过滤
  const filteredFAQs = useMemo(() => {
    let result = faqs

    // 按分类过滤
    if (activeCategory !== 'all') {
      result = result.filter(faq => faq.category === activeCategory)
    }

    // 按搜索词过滤
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(faq =>
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query)
      )
    }

    return result
  }, [activeCategory, searchQuery, faqs])

  // 热门问题（按浏览量排序）
  const hotFAQs = useMemo(() => {
    return [...faqs].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5)
  }, [faqs])

  // 切换FAQ展开状态
  const toggleFAQ = useCallback((id: string) => {
    setExpandedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(expandedId => expandedId !== id)
      } else {
        return [...prev, id]
      }
    })
  }, [])

  // 展开/收起全部
  const expandAll = useCallback(() => {
    setExpandedIds(filteredFAQs.map(faq => faq.id))
  }, [filteredFAQs])

  const collapseAll = useCallback(() => {
    setExpandedIds([])
  }, [])

  // 搜索处理
  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value)
    if (value.trim() && !searchHistory.includes(value.trim())) {
      setSearchHistory(prev => [value.trim(), ...prev].slice(0, 5))
    }
  }, [searchHistory])

  // 高亮搜索关键词
  const highlightText = useCallback((text: string, query: string) => {
    if (!query.trim()) return text
    const parts = text.split(new RegExp(`(${query})`, 'gi'))
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ?
        <mark key={i} className={`${isDark ? 'bg-yellow-500/30 text-yellow-200' : 'bg-yellow-200 text-yellow-900'} px-1 rounded`}>{part}</mark> :
        part
    )
  }, [isDark])

  // 获取当前分类信息
  const currentCategory = categories.find(c => c.value === activeCategory)

  // 统计信息
  const stats = {
    totalFAQs: faqs.length,
    totalViews: faqs.reduce((sum, faq) => sum + (faq.views || 0), 0),
    avgHelpful: Math.round(faqs.reduce((sum, faq) => sum + (faq.helpful || 0), 0) / faqs.length)
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-950' : 'bg-gray-50'}`}>
      {/* 移动端顶部导航 */}
      <div className={`lg:hidden sticky top-0 z-40 px-4 py-3 ${isDark ? 'bg-slate-900/95 border-b border-slate-800' : 'bg-white/95 border-b border-gray-200'} backdrop-blur-xl`}>
        <div className="flex items-center justify-between">
          <h1 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>帮助中心</h1>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`p-2 rounded-lg ${isDark ? 'hover:bg-slate-800' : 'hover:bg-gray-100'}`}
          >
            <Menu size={20} className={isDark ? 'text-slate-300' : 'text-gray-600'} />
          </button>
        </div>

        {/* 移动端分类菜单 */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-3 pb-2 flex flex-wrap gap-2">
                {categories.map(cat => (
                  <button
                    key={cat.value}
                    onClick={() => {
                      setActiveCategory(cat.value)
                      setIsMobileMenuOpen(false)
                    }}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      activeCategory === cat.value
                        ? isDark
                          ? 'bg-indigo-500 text-white'
                          : 'bg-indigo-600 text-white'
                        : isDark
                          ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <cat.icon size={14} className="inline mr-1" />
                    {cat.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex min-h-screen">
        {/* 左侧边栏 - 分类导航 */}
        <motion.aside
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.25, 0.8, 0.25, 1] }}
          className={`
            w-72 flex-shrink-0 hidden lg:flex flex-col sticky top-0 h-screen overflow-y-auto
            ${isDark ? 'bg-slate-900/80 border-r border-slate-800/50' : 'bg-white/80 border-r border-gray-200/80'}
            backdrop-blur-xl
          `}
        >
          {/* Logo区域 */}
          <div className={`p-6 border-b ${isDark ? 'border-slate-800/50' : 'border-gray-200/50'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg`}>
                <HelpCircle size={20} className="text-white" />
              </div>
              <div>
                <h1 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>帮助中心</h1>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>常见问题与指南</p>
              </div>
            </div>
          </div>

          {/* 分类导航 */}
          <div className="flex-1 p-4">
            <h2 className={`text-xs font-semibold uppercase tracking-wider mb-3 px-2 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
              问题分类
            </h2>
            <nav className="space-y-1">
              {categories.map((cat, index) => (
                <motion.button
                  key={cat.value}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setActiveCategory(cat.value)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 group
                    ${activeCategory === cat.value
                      ? isDark
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      : isDark
                        ? 'text-slate-300 hover:bg-slate-800/50 hover:text-slate-100'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }
                  `}
                >
                  <div className={`
                    w-8 h-8 rounded-lg flex items-center justify-center transition-all
                    ${activeCategory === cat.value
                      ? `bg-gradient-to-br ${cat.color} shadow-lg`
                      : isDark
                        ? 'bg-slate-800 group-hover:bg-slate-700'
                        : 'bg-gray-100 group-hover:bg-gray-200'
                    }
                  `}>
                    <cat.icon size={16} className={activeCategory === cat.value ? 'text-white' : ''} />
                  </div>
                  <div className="flex-1">
                    <span className="font-medium text-sm">{cat.label}</span>
                    <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'} mt-0.5`}>
                      {cat.description}
                    </p>
                  </div>
                  {activeCategory === cat.value && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="w-1.5 h-1.5 rounded-full bg-indigo-500"
                    />
                  )}
                </motion.button>
              ))}
            </nav>

            {/* 统计卡片 */}
            <div className={`mt-6 p-4 rounded-2xl ${isDark ? 'bg-slate-800/50 border border-slate-700/50' : 'bg-gray-50 border border-gray-200'}`}>
              <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                使用统计
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText size={14} className={isDark ? 'text-slate-400' : 'text-gray-500'} />
                    <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>问题总数</span>
                  </div>
                  <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{stats.totalFAQs}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={14} className={isDark ? 'text-slate-400' : 'text-gray-500'} />
                    <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>总浏览量</span>
                  </div>
                  <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{stats.totalViews.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className={isDark ? 'text-slate-400' : 'text-gray-500'} />
                    <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>满意率</span>
                  </div>
                  <span className={`text-sm font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{stats.avgHelpful}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* 底部信息 */}
          <div className={`p-4 border-t ${isDark ? 'border-slate-800/50' : 'border-gray-200/50'}`}>
            <p className={`text-xs text-center ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
              需要帮助？联系我们的客服团队
            </p>
          </div>
        </motion.aside>

        {/* 主内容区 */}
        <main className="flex-1 min-w-0">
          <div className="max-w-4xl mx-auto p-4 lg:p-8">
            {/* 页面头部 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <div className="flex items-center gap-3 mb-4">
                {currentCategory && (
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${currentCategory.color} flex items-center justify-center shadow-lg`}>
                    <currentCategory.icon size={24} className="text-white" />
                  </div>
                )}
                <div>
                  <h1 className={`text-2xl lg:text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {currentCategory?.label || '全部问题'}
                  </h1>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'} mt-1`}>
                    {currentCategory?.description || '浏览所有常见问题与使用指南'}
                  </p>
                </div>
              </div>

              {/* 搜索框 */}
              <div className="relative">
                <div className={`
                  relative flex items-center rounded-2xl overflow-hidden transition-all duration-200
                  ${isDark
                    ? 'bg-slate-800/50 border border-slate-700/50 focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/20'
                    : 'bg-white border border-gray-200 focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100'
                  }
                `}>
                  <Search size={20} className={`absolute left-4 ${isDark ? 'text-slate-400' : 'text-gray-400'}`} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    onFocus={() => setShowHistory(true)}
                    placeholder="搜索问题或关键词..."
                    className={`
                      w-full pl-12 pr-4 py-4 bg-transparent outline-none text-base
                      ${isDark ? 'text-white placeholder-slate-500' : 'text-gray-900 placeholder-gray-400'}
                    `}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className={`absolute right-4 p-1 rounded-full ${isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}
                    >
                      <X size={16} className={isDark ? 'text-slate-400' : 'text-gray-400'} />
                    </button>
                  )}
                </div>

                {/* 搜索历史 */}
                <AnimatePresence>
                  {showHistory && searchHistory.length > 0 && !searchQuery && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={`
                        absolute top-full left-0 right-0 mt-2 p-3 rounded-xl z-20
                        ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'}
                        shadow-xl
                      `}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>搜索历史</span>
                        <button
                          onClick={() => setSearchHistory([])}
                          className={`text-xs ${isDark ? 'text-slate-500 hover:text-slate-300' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                          清除
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {searchHistory.map((term, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              setSearchQuery(term)
                              setShowHistory(false)
                            }}
                            className={`
                              px-3 py-1.5 rounded-lg text-sm transition-colors
                              ${isDark
                                ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }
                            `}
                          >
                            <Clock size={12} className="inline mr-1" />
                            {term}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* 操作栏 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="flex items-center justify-between mb-6"
            >
              <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                共 <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{filteredFAQs.length}</span> 个问题
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={expandAll}
                  className={`
                    px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                    ${isDark
                      ? 'text-slate-300 hover:bg-slate-800'
                      : 'text-gray-600 hover:bg-gray-100'
                    }
                  `}
                >
                  展开全部
                </button>
                <button
                  onClick={collapseAll}
                  className={`
                    px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                    ${isDark
                      ? 'text-slate-300 hover:bg-slate-800'
                      : 'text-gray-600 hover:bg-gray-100'
                    }
                  `}
                >
                  收起全部
                </button>
              </div>
            </motion.div>

            {/* FAQ列表 */}
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="space-y-3"
            >
              <AnimatePresence mode="popLayout">
                {filteredFAQs.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`
                      text-center py-16 rounded-2xl
                      ${isDark ? 'bg-slate-800/50 border border-slate-700/50' : 'bg-white border border-gray-200'}
                    `}
                  >
                    <div className={`
                      w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4
                      ${isDark ? 'bg-slate-800' : 'bg-gray-100'}
                    `}>
                      <Search size={28} className={isDark ? 'text-slate-500' : 'text-gray-400'} />
                    </div>
                    <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      未找到匹配的问题
                    </h3>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'} mb-4`}>
                      尝试使用其他关键词搜索，或浏览其他分类
                    </p>
                    <button
                      onClick={() => {
                        setActiveCategory('all')
                        setSearchQuery('')
                      }}
                      className={`
                        px-4 py-2 rounded-lg text-sm font-medium transition-colors
                        ${isDark
                          ? 'bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30'
                          : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                        }
                      `}
                    >
                      查看所有问题
                    </button>
                  </motion.div>
                ) : (
                  filteredFAQs.map((faq, index) => {
                    const isExpanded = expandedIds.includes(faq.id)
                    const category = categories.find(c => c.value === faq.category)

                    return (
                      <motion.div
                        key={faq.id}
                        layout
                        variants={fadeInUp}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: index * 0.03 }}
                        className={`
                          rounded-2xl border overflow-hidden transition-all duration-300
                          ${isExpanded
                            ? isDark
                              ? 'bg-slate-800/80 border-slate-700 shadow-xl shadow-black/20'
                              : 'bg-white border-gray-200 shadow-lg shadow-gray-200/50'
                            : isDark
                              ? 'bg-slate-900/40 border-slate-800/50 hover:border-slate-700/50'
                              : 'bg-white/70 border-gray-200/70 hover:border-gray-300 hover:bg-white'
                          }
                        `}
                      >
                        <button
                          onClick={() => toggleFAQ(faq.id)}
                          className="w-full flex items-start gap-4 p-5 text-left"
                        >
                          <div className={`
                            w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all
                            ${isExpanded
                              ? `bg-gradient-to-br ${category?.color || 'from-gray-500 to-gray-600'} shadow-lg`
                              : isDark
                                ? 'bg-slate-800'
                                : 'bg-gray-100'
                            }
                          `}>
                            {category ? (
                              <category.icon size={18} className={isExpanded ? 'text-white' : isDark ? 'text-slate-400' : 'text-gray-500'} />
                            ) : (
                              <HelpCircle size={18} className={isExpanded ? 'text-white' : isDark ? 'text-slate-400' : 'text-gray-500'} />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <h3 className={`font-semibold text-base mb-1 ${isDark ? 'text-slate-200' : 'text-gray-900'}`}>
                              {highlightText(faq.question, searchQuery)}
                            </h3>
                            <div className={`flex items-center gap-3 text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                              <span className="flex items-center gap-1">
                                <TrendingUp size={12} />
                                {(faq.views || 0).toLocaleString()} 次浏览
                              </span>
                              {faq.helpful && (
                                <span className="flex items-center gap-1">
                                  <CheckCircle2 size={12} className="text-emerald-500" />
                                  {faq.helpful}% 有帮助
                                </span>
                              )}
                              <span className={`
                                px-2 py-0.5 rounded-full text-xs
                                ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-gray-100 text-gray-500'}
                              `}>
                                {category?.label}
                              </span>
                            </div>
                          </div>

                          <motion.div
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                            className={`
                              w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors
                              ${isExpanded
                                ? isDark
                                  ? 'bg-indigo-500/20'
                                  : 'bg-indigo-100'
                                : isDark
                                  ? 'bg-slate-800'
                                  : 'bg-gray-100'
                              }
                            `}
                          >
                            <ChevronDown
                              size={18}
                              className={isExpanded ? 'text-indigo-500' : isDark ? 'text-slate-500' : 'text-gray-500'}
                            />
                          </motion.div>
                        </button>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25, ease: [0.25, 0.8, 0.25, 1] }}
                              className="overflow-hidden"
                            >
                              <div className={`
                                px-5 pb-5
                                ${isDark ? 'text-slate-400' : 'text-gray-600'}
                              `}>
                                <div className={`
                                  pl-14 pt-2 border-t
                                  ${isDark ? 'border-slate-700/50' : 'border-gray-100'}
                                `}>
                                  <p className="text-sm leading-relaxed">
                                    {highlightText(faq.answer, searchQuery)}
                                  </p>

                                  {/* 反馈按钮 */}
                                  <div className="flex items-center gap-3 mt-4">
                                    <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>这个回答有帮助吗？</span>
                                    <div className="flex items-center gap-2">
                                      <button className={`
                                        px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1
                                        ${isDark
                                          ? 'bg-slate-800 text-slate-400 hover:bg-emerald-500/20 hover:text-emerald-400'
                                          : 'bg-gray-100 text-gray-600 hover:bg-emerald-50 hover:text-emerald-600'
                                        }
                                      `}>
                                        <CheckCircle2 size={12} />
                                        有帮助
                                      </button>
                                      <button className={`
                                        px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1
                                        ${isDark
                                          ? 'bg-slate-800 text-slate-400 hover:bg-red-500/20 hover:text-red-400'
                                          : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600'
                                        }
                                      `}>
                                        <X size={12} />
                                        没帮助
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )
                  })
                )}
              </AnimatePresence>
            </motion.div>

            {/* 快速反馈入口 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={`
                mt-8 p-6 rounded-2xl border
                ${isDark
                  ? 'bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 border-indigo-500/30'
                  : 'bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border-indigo-200'
                }
              `}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`
                    w-12 h-12 rounded-xl flex items-center justify-center
                    ${isDark ? 'bg-indigo-500/20' : 'bg-indigo-100'}
                  `}>
                    <MessageCircle size={24} className="text-indigo-500" />
                  </div>
                  <div>
                    <h3 className={`font-semibold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      没有找到想要的答案？
                    </h3>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                      我们的客服团队随时为您提供帮助
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowFeedbackModal(true)}
                  className={`
                    px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200
                    flex items-center justify-center gap-2 whitespace-nowrap
                    ${isDark
                      ? 'bg-indigo-500 hover:bg-indigo-400 text-white shadow-lg shadow-indigo-500/25'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25'
                    }
                    hover:scale-105 active:scale-95
                  `}
                >
                  <MessageSquare size={18} />
                  提交反馈
                </button>
              </div>
            </motion.div>
          </div>
        </main>

        {/* 右侧边栏 */}
        <motion.aside
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1, ease: [0.25, 0.8, 0.25, 1] }}
          className={`
            w-80 flex-shrink-0 hidden xl:flex flex-col sticky top-0 h-screen overflow-y-auto
            ${isDark ? 'bg-slate-900/50 border-l border-slate-800/50' : 'bg-white/50 border-l border-gray-200/80'}
            backdrop-blur-xl
          `}
        >
          <div className="p-6 space-y-6">
            {/* 联系方式卡片 */}
            <div>
              <h3 className={`text-sm font-semibold uppercase tracking-wider mb-4 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                联系支持
              </h3>
              <div className="space-y-3">
                <a
                  href="#"
                  className={`
                    flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group
                    ${isDark
                      ? 'bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600'
                      : 'bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <div className={`
                    w-10 h-10 rounded-lg flex items-center justify-center transition-colors
                    ${isDark ? 'bg-blue-500/20 group-hover:bg-blue-500/30' : 'bg-blue-100 group-hover:bg-blue-200'}
                  `}>
                    <MessageSquare size={18} className="text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <span className={`font-medium text-sm ${isDark ? 'text-slate-200' : 'text-gray-900'}`}>在线客服</span>
                    <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>平均响应时间 2分钟</p>
                  </div>
                  <ArrowRight size={16} className={`opacity-0 group-hover:opacity-100 transition-opacity ${isDark ? 'text-slate-400' : 'text-gray-400'}`} />
                </a>

                <a
                  href="mailto:support@jinmaizhifang.com"
                  className={`
                    flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group
                    ${isDark
                      ? 'bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600'
                      : 'bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <div className={`
                    w-10 h-10 rounded-lg flex items-center justify-center transition-colors
                    ${isDark ? 'bg-emerald-500/20 group-hover:bg-emerald-500/30' : 'bg-emerald-100 group-hover:bg-emerald-200'}
                  `}>
                    <Mail size={18} className="text-emerald-500" />
                  </div>
                  <div className="flex-1">
                    <span className={`font-medium text-sm ${isDark ? 'text-slate-200' : 'text-gray-900'}`}>邮件支持</span>
                    <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>24小时内回复</p>
                  </div>
                  <ArrowRight size={16} className={`opacity-0 group-hover:opacity-100 transition-opacity ${isDark ? 'text-slate-400' : 'text-gray-400'}`} />
                </a>

                <a
                  href="tel:400-123-4567"
                  className={`
                    flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group
                    ${isDark
                      ? 'bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600'
                      : 'bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <div className={`
                    w-10 h-10 rounded-lg flex items-center justify-center transition-colors
                    ${isDark ? 'bg-purple-500/20 group-hover:bg-purple-500/30' : 'bg-purple-100 group-hover:bg-purple-200'}
                  `}>
                    <Phone size={18} className="text-purple-500" />
                  </div>
                  <div className="flex-1">
                    <span className={`font-medium text-sm ${isDark ? 'text-slate-200' : 'text-gray-900'}`}>电话咨询</span>
                    <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>工作日 9:00-18:00</p>
                  </div>
                  <ArrowRight size={16} className={`opacity-0 group-hover:opacity-100 transition-opacity ${isDark ? 'text-slate-400' : 'text-gray-400'}`} />
                </a>
              </div>
            </div>

            {/* 热门问题 */}
            <div>
              <h3 className={`text-sm font-semibold uppercase tracking-wider mb-4 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                热门问题
              </h3>
              <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-slate-800/30 border-slate-700/50' : 'bg-white border-gray-200'}`}>
                {hotFAQs.map((faq, index) => (
                  <button
                    key={faq.id}
                    onClick={() => {
                      setActiveCategory('all')
                      setExpandedIds([faq.id])
                      document.getElementById(faq.id)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                    }}
                    className={`
                      w-full flex items-center gap-3 p-3 text-left transition-colors
                      ${index !== hotFAQs.length - 1 ? (isDark ? 'border-b border-slate-700/50' : 'border-b border-gray-100') : ''}
                      ${isDark ? 'hover:bg-slate-800/50' : 'hover:bg-gray-50'}
                    `}
                  >
                    <div className={`
                      w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold
                      ${index === 0
                        ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white'
                        : index === 1
                          ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-white'
                          : index === 2
                            ? 'bg-gradient-to-br from-orange-400 to-amber-600 text-white'
                            : isDark ? 'bg-slate-700 text-slate-400' : 'bg-gray-100 text-gray-500'
                      }
                    `}>
                      {index + 1}
                    </div>
                    <span className={`text-sm flex-1 truncate ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                      {faq.question}
                    </span>
                    <TrendingUp size={14} className={isDark ? 'text-slate-500' : 'text-gray-400'} />
                  </button>
                ))}
              </div>
            </div>

            {/* 快速链接 */}
            <div>
              <h3 className={`text-sm font-semibold uppercase tracking-wider mb-4 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                相关文档
              </h3>
              <div className="space-y-2">
                {[
                  { label: '新手指南', icon: BookOpen, desc: '快速上手教程' },
                  { label: '功能介绍', icon: Sparkles, desc: '了解所有功能' },
                  { label: '使用技巧', icon: Lightbulb, desc: '提升创作效率' },
                  { label: '更新日志', icon: Zap, desc: '查看最新更新' }
                ].map((item, index) => (
                  <a
                    key={index}
                    href="#"
                    className={`
                      flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group
                      ${isDark
                        ? 'hover:bg-slate-800/50'
                        : 'hover:bg-gray-50'
                      }
                    `}
                  >
                    <div className={`
                      w-9 h-9 rounded-lg flex items-center justify-center
                      ${isDark ? 'bg-slate-800 group-hover:bg-slate-700' : 'bg-gray-100 group-hover:bg-gray-200'}
                    `}>
                      <item.icon size={16} className={isDark ? 'text-slate-400' : 'text-gray-500'} />
                    </div>
                    <div className="flex-1">
                      <span className={`font-medium text-sm ${isDark ? 'text-slate-200' : 'text-gray-900'}`}>{item.label}</span>
                      <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>{item.desc}</p>
                    </div>
                    <ExternalLink size={14} className={`opacity-0 group-hover:opacity-100 transition-opacity ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
                  </a>
                ))}
              </div>
            </div>

            {/* 服务状态 */}
            <div className={`
              p-4 rounded-2xl border
              ${isDark
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : 'bg-emerald-50 border-emerald-200'
              }
            `}>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <div className="absolute inset-0 w-3 h-3 rounded-full bg-emerald-500 animate-ping opacity-50" />
                </div>
                <div>
                  <span className={`font-medium text-sm ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>所有服务正常运行</span>
                  <p className={`text-xs ${isDark ? 'text-emerald-500/70' : 'text-emerald-600/70'}`}>最后更新：刚刚</p>
                </div>
              </div>
            </div>
          </div>
        </motion.aside>
      </div>

      {/* 反馈模态框 */}
      <AnimatePresence>
        {showFeedbackModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowFeedbackModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className={`
                w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl
                ${isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white border border-gray-200'}
              `}
            >
              <div className={`p-6 border-b ${isDark ? 'border-slate-800' : 'border-gray-100'}`}>
                <div className="flex items-center justify-between">
                  <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>提交反馈</h3>
                  <button
                    onClick={() => setShowFeedbackModal(false)}
                    className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-800' : 'hover:bg-gray-100'}`}
                  >
                    <X size={18} className={isDark ? 'text-slate-400' : 'text-gray-500'} />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                    反馈类型
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['功能建议', '问题反馈', '账号问题', '其他'].map((type, i) => (
                      <button
                        key={i}
                        className={`
                          px-3 py-1.5 rounded-lg text-sm transition-colors
                          ${isDark
                            ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }
                        `}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                    详细描述
                  </label>
                  <textarea
                    rows={4}
                    placeholder="请详细描述您遇到的问题或建议..."
                    className={`
                      w-full px-4 py-3 rounded-xl resize-none outline-none transition-all
                      ${isDark
                        ? 'bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20'
                        : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100'
                      }
                    `}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                    联系邮箱（选填）
                  </label>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    className={`
                      w-full px-4 py-3 rounded-xl outline-none transition-all
                      ${isDark
                        ? 'bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20'
                        : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100'
                      }
                    `}
                  />
                </div>
              </div>
              <div className={`p-6 border-t ${isDark ? 'border-slate-800' : 'border-gray-100'} flex justify-end gap-3`}>
                <button
                  onClick={() => setShowFeedbackModal(false)}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    ${isDark
                      ? 'text-slate-300 hover:bg-slate-800'
                      : 'text-gray-600 hover:bg-gray-100'
                    }
                  `}
                >
                  取消
                </button>
                <button
                  onClick={() => setShowFeedbackModal(false)}
                  className={`
                    px-6 py-2 rounded-lg text-sm font-medium transition-all
                    ${isDark
                      ? 'bg-indigo-500 hover:bg-indigo-400 text-white'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    }
                  `}
                >
                  提交反馈
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 点击外部关闭搜索历史 */}
      {showHistory && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setShowHistory(false)}
        />
      )}
    </div>
  )
}
