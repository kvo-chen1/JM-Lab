import { useTheme } from '@/hooks/useTheme'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// FAQ类别类型
type FAQCategory = 'basic' | 'auth' | 'creation' | 'community' | 'membership' | 'security' | 'technical'

// FAQ项目类型
interface FAQItem {
  id: string
  question: string
  answer: string
  category: FAQCategory
}

export default function Help() {
  const { isDark } = useTheme()
  const [activeCategory, setActiveCategory] = useState<FAQCategory | 'all'>('all')
  const [expandedIds, setExpandedIds] = useState<string[]>([])

  // 完整的FAQ列表
  const faqs: FAQItem[] = [
    {
      id: 'faq-1',
      question: '如何开始使用 AI 创作工具？',
      answer: '登录后进入“AI 创作工具”页面，选择模型与参数，按照向导完成创作流程。你可以选择不同的创作模板，或者从头开始创建自己的作品。系统会提供实时预览功能，帮助你调整创作效果。',
      category: 'basic'
    },
    {
      id: 'faq-2',
      question: '生成的内容是否可以商用？',
      answer: '请确保素材与品牌授权合规。平台不自动提供第三方授权，需由用户自行确认与取得。对于商业用途，建议你在使用前咨询专业的法律意见，确保你的使用符合相关法律法规。',
      category: 'basic'
    },
    {
      id: 'faq-3',
      question: '账号安全如何保障？',
      answer: '请勿泄露登录信息，启用强密码，并避免在公共设备保存登录状态。平台采用了多种安全措施，包括密码加密存储、HTTPS传输、登录验证等，保障你的账号安全。你还可以在设置中启用双因素认证，进一步增强账号安全性。',
      category: 'security'
    },
    {
      id: 'faq-4',
      question: '遇到问题如何反馈？',
      answer: '可通过页面右下角的反馈按钮提交问题，我们的客服团队会在24小时内回复。你也可以通过邮件联系平台支持：support@jinmaizhifang.com，或在工作时间拨打客服电话：400-123-4567。',
      category: 'basic'
    },
    {
      id: 'faq-5',
      question: '如何注册和登录账号？',
      answer: '你可以通过邮箱或手机号注册账号，也可以使用微信、支付宝等第三方账号快捷登录。注册完成后，系统会发送验证邮件或短信，验证通过后即可登录。',
      category: 'auth'
    },
    {
      id: 'faq-6',
      question: '忘记密码怎么办？',
      answer: '在登录页面点击“忘记密码”链接，按照提示输入注册邮箱或手机号，系统会发送密码重置链接或验证码。通过链接或验证码即可重置密码。',
      category: 'auth'
    },
    {
      id: 'faq-7',
      question: '如何修改个人信息？',
      answer: '登录后进入“个人中心”页面，点击“编辑资料”按钮即可修改个人信息，包括用户名、头像、邮箱、手机号等。修改完成后，系统会保存你的更改。',
      category: 'auth'
    },
    {
      id: 'faq-8',
      question: '如何使用AI创作功能？',
      answer: '进入“AI创作工具”页面，选择创作类型（图片、视频、文字等），输入创作提示词，调整参数设置，点击“生成”按钮即可生成内容。你可以对生成的内容进行编辑和调整，直到满意为止。',
      category: 'creation'
    },
    {
      id: 'faq-9',
      question: '如何保存和管理我的作品？',
      answer: '创作完成后，点击“保存”按钮即可将作品保存到“我的作品”页面。在该页面，你可以查看、编辑、删除、分享你的作品，还可以将作品分类管理。',
      category: 'creation'
    },
    {
      id: 'faq-10',
      question: '如何分享我的作品？',
      answer: '在作品详情页面，点击“分享”按钮，选择分享方式（微信、微博、QQ等）或复制分享链接，即可将作品分享给他人。你也可以设置作品的可见范围，控制谁可以查看你的作品。',
      category: 'community'
    },
    {
      id: 'faq-11',
      question: '如何加入社区讨论？',
      answer: '进入“社区”页面，浏览社区动态，点击帖子即可参与讨论。你可以点赞、评论、分享帖子，也可以创建自己的帖子，与其他用户交流创作经验和想法。',
      category: 'community'
    },
    {
      id: 'faq-12',
      question: '如何关注其他用户？',
      answer: '在用户个人主页或社区动态中，点击用户头像或用户名进入用户详情页面，点击“关注”按钮即可关注该用户。关注后，你可以在“关注”页面查看该用户的最新动态。',
      category: 'community'
    },
    {
      id: 'faq-13',
      question: '会员有哪些权益？',
      answer: '会员可以享受无限AI生成次数、高级AI模型访问、高清作品导出、优先处理队列、专属模板库、去除水印等权益。不同等级的会员享受不同的权益，你可以在“会员中心”页面查看详细的会员权益说明。',
      category: 'membership'
    },
    {
      id: 'faq-14',
      question: '如何升级会员？',
      answer: '进入“会员中心”页面，选择你想要升级的会员等级，点击“立即升级”按钮，按照提示完成支付即可。支付成功后，你的会员等级会立即升级，享受相应的会员权益。',
      category: 'membership'
    },
    {
      id: 'faq-15',
      question: '会员到期后怎么办？',
      answer: '会员到期后，你的会员权益会自动失效，系统会将你的会员等级恢复为免费会员。你可以在会员到期前续费，继续享受会员权益。系统会在会员到期前发送提醒通知，确保你不会错过续费时机。',
      category: 'membership'
    },
    {
      id: 'faq-16',
      question: '如何处理创作过程中的技术问题？',
      answer: '如果在创作过程中遇到技术问题，你可以尝试刷新页面、清除浏览器缓存、更换浏览器等方式解决。如果问题依然存在，请通过反馈渠道提交问题，我们的技术团队会尽快协助你解决。',
      category: 'technical'
    },
    {
      id: 'faq-17',
      question: '如何优化AI生成效果？',
      answer: '要优化AI生成效果，你可以尝试以下方法：1）提供更详细的提示词，明确描述你想要的效果；2）调整生成参数，如风格、细节程度等；3）使用参考图片或风格参考；4）尝试不同的AI模型。',
      category: 'technical'
    },
    {
      id: 'faq-18',
      question: '如何处理生成内容中的版权问题？',
      answer: '平台生成的内容可能包含受版权保护的元素，建议你在使用前检查内容的版权状态。对于商业用途，建议你使用平台提供的授权素材，或自行获取版权授权。如果发现生成内容存在版权问题，请立即停止使用，并联系平台客服。',
      category: 'security'
    }
  ]

  // 分类过滤
  const filteredFAQs = activeCategory === 'all' 
    ? faqs 
    : faqs.filter(faq => faq.category === activeCategory)

  // 切换FAQ展开状态
  const toggleFAQ = (id: string) => {
    setExpandedIds((prev: string[]) => {
      if (prev.includes(id)) {
        return prev.filter((expandedId: string) => expandedId !== id)
      } else {
        return [...prev, id]
      }
    })
  }

  // FAQ类别选项
  const categoryOptions = [
    { value: 'all' as const, label: '全部' },
    { value: 'basic' as const, label: '基础使用' },
    { value: 'auth' as const, label: '账号管理' },
    { value: 'creation' as const, label: 'AI创作' },
    { value: 'community' as const, label: '社区互动' },
    { value: 'membership' as const, label: '会员权益' },
    { value: 'security' as const, label: '安全与隐私' },
    { value: 'technical' as const, label: '技术支持' }
  ]

  return (
    <main className="container mx-auto px-4 py-8">
      {/* 帮助中心首页结构 */}
      <h1 className="text-2xl font-bold mb-3">帮助中心</h1>
      <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mb-8 text-sm`}>
        常见问题与使用指南，帮助你快速上手并高效创作。
      </p>

      {/* 搜索框 */}
      <div className="mb-8">
        <input
          type="text"
          placeholder="搜索问题或关键词..."
          className={`w-full px-4 py-3 rounded-lg border ${isDark
            ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}
            focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200`}
        />
      </div>

      {/* 分类筛选 */}
      <div className="flex flex-wrap gap-2 mb-8 overflow-x-auto pb-2">
        {categoryOptions.map(option => (
          <button
            key={option.value}
            onClick={() => setActiveCategory(option.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${activeCategory === option.value
              ? isDark 
                ? 'bg-blue-600 text-white' 
                : 'bg-blue-500 text-white'
              : isDark 
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* FAQ列表 */}
      <section className={`rounded-2xl p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md ring-1 ${isDark ? 'ring-gray-700' : 'ring-gray-200'}`}>
        <ul className="space-y-4">
          {filteredFAQs.length === 0 ? (
            <div className={`text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              <i className="fas fa-search text-4xl mb-3"></i>
              <p>未找到匹配的问题</p>
              <button
                onClick={() => {
                  setActiveCategory('all')
                  setExpandedIds([])
                }}
                className={`mt-4 text-sm ${isDark ? 'text-blue-400' : 'text-blue-600'} hover:underline`}
              >
                查看所有问题
              </button>
            </div>
          ) : (
            filteredFAQs.map((item) => {
              const isExpanded = expandedIds.includes(item.id)
              return (
                <li 
                  key={item.id}
                  className={`rounded-lg ${isDark ? 'bg-gray-900' : 'bg-gray-50'} overflow-hidden`}
                >
                  <button
                    onClick={() => toggleFAQ(item.id)}
                    className={`w-full px-4 py-4 text-left flex justify-between items-center focus:outline-none transition-all duration-200 ${isExpanded ? (isDark ? 'bg-gray-800' : 'bg-gray-100') : ''}`}
                  >
                    <h2 className="font-medium text-lg text-left">{item.question}</h2>
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                      className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
                    >
                      <i className="fas fa-chevron-down"></i>
                    </motion.div>
                  </button>
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className={`px-4 pb-4 ${isDark ? 'text-gray-300' : 'text-gray-700'} text-sm`}>
                          {item.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </li>
              )
            })
          )}
        </ul>
      </section>

      {/* 联系方式与支持通道 */}
      <section className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 在线反馈 */}
        <div className={`rounded-2xl p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md ring-1 ${isDark ? 'ring-gray-700' : 'ring-gray-200'} text-center`}>
          <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-4 ${isDark ? 'bg-blue-900' : 'bg-blue-100'}`}>
            <i className={`fas fa-comment-dots text-xl ${isDark ? 'text-blue-300' : 'text-blue-600'}`}></i>
          </div>
          <h2 className="font-medium text-base mb-2">在线反馈</h2>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm mb-4`}>
            提交你的问题或建议，我们会尽快回复
          </p>
          <button
            onClick={() => {
              // 触发反馈表单显示
              const feedbackButton = document.querySelector('[title="用户反馈"]') as HTMLElement
              feedbackButton?.click()
            }}
            className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${isDark
              ? 'bg-blue-600 hover:bg-blue-500'
              : 'bg-blue-500 hover:bg-blue-600'}
              text-white`}
          >
            <i className="fas fa-paper-plane"></i>
            提交反馈
          </button>
        </div>

        {/* 邮件支持 */}
        <div className={`rounded-2xl p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md ring-1 ${isDark ? 'ring-gray-700' : 'ring-gray-200'} text-center`}>
          <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-4 ${isDark ? 'bg-green-900' : 'bg-green-100'}`}>
            <i className={`fas fa-envelope text-xl ${isDark ? 'text-green-300' : 'text-green-600'}`}></i>
          </div>
          <h2 className="font-medium text-base mb-2">邮件支持</h2>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm mb-4`}>
            发送邮件到我们的支持邮箱
          </p>
          <a
            href="mailto:support@jinmaizhifang.com"
            className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${isDark
              ? 'bg-green-600 hover:bg-green-500'
              : 'bg-green-500 hover:bg-green-600'}
              text-white`}
          >
            <i className="fas fa-envelope"></i>
            发送邮件
          </a>
        </div>

        {/* 电话支持 */}
        <div className={`rounded-2xl p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md ring-1 ${isDark ? 'ring-gray-700' : 'ring-gray-200'} text-center`}>
          <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-4 ${isDark ? 'bg-purple-900' : 'bg-purple-100'}`}>
            <i className={`fas fa-phone text-xl ${isDark ? 'text-purple-300' : 'text-purple-600'}`}></i>
          </div>
          <h2 className="font-medium text-base mb-2">电话支持</h2>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm mb-4`}>
            工作日 9:00-18:00 提供电话支持
          </p>
          <a
            href="tel:400-123-4567"
            className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${isDark
              ? 'bg-purple-600 hover:bg-purple-500'
              : 'bg-purple-500 hover:bg-purple-600'}
              text-white`}
          >
            <i className="fas fa-phone"></i>
            400-123-4567
          </a>
        </div>
      </section>
    </main>
  )
}