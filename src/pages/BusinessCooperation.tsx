import { useMemo, useState, useEffect } from 'react'
import { useTheme } from '@/hooks/useTheme'
import { motion } from 'framer-motion'
import BRANDS from '@/lib/brands'
import ipService from '@/services/ipService'
import { toast } from 'sonner'
import GradientHero from '@/components/GradientHero'

export default function BusinessCooperation() {
  const { isDark } = useTheme()
  const [brand, setBrand] = useState(BRANDS[0])
  const [brandSearch, setBrandSearch] = useState('') 
  const [chat, setChat] = useState('想怎么创新麻花？') 
  const [contact, setContact] = useState('') 
  const [phone, setPhone] = useState('') 
  const [idea, setIdea] = useState('') 
  const [tips, setTips] = useState<string[]>([]) 
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'negotiating' | 'approved' | 'rejected'>('all')
  const [sortKey, setSortKey] = useState<'recent' | 'old' | 'status'>('recent') 
  const [reloadTick, setReloadTick] = useState(0) 

  useEffect(() => {
    try {
      const raw = localStorage.getItem('BrandGuide.persist')
      if (raw) {
        const saved = JSON.parse(raw)
        const found = BRANDS.find(b => b.id === saved.brandId)
        if (found) setBrand(found)
        if (typeof saved.brandSearch === 'string') setBrandSearch(saved.brandSearch)
        if (typeof saved.chat === 'string') setChat(saved.chat)
        if (typeof saved.contact === 'string') setContact(saved.contact)
        if (typeof saved.phone === 'string') setPhone(saved.phone)
        if (typeof saved.idea === 'string') setIdea(saved.idea)
      }
    } catch {}
  }, [])

  useEffect(() => {
    try {
      const payload = {
        brandId: brand.id,
        brandSearch,
        chat,
        contact,
        phone,
        idea,
        statusFilter,
        sortKey,
      }
      localStorage.setItem('BrandGuide.persist', JSON.stringify(payload))
    } catch {}
  }, [brand.id, brandSearch, chat, contact, phone, idea, statusFilter, sortKey])

  const brandAll = useMemo(() => ipService.getAllPartnerships().filter(p => p.brandName === brand.name), [brand, reloadTick])
  
  const statusCounts = useMemo(() => {
    const counts = { pending: 0, negotiating: 0, approved: 0, rejected: 0 } as Record<'pending'|'negotiating'|'approved'|'rejected', number>
    brandAll.forEach(p => { counts[p.status] = (counts[p.status] || 0) + 1 })
    return counts
  }, [brandAll])

  const partnerships = useMemo(() => {
    let all = brandAll
    if (statusFilter !== 'all') all = all.filter(p => p.status === statusFilter)
    const byRecent = (a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    const byOld = (a: any, b: any) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
    const statusOrder: Record<string, number> = { pending: 0, negotiating: 1, approved: 2, rejected: 3 }
    const byStatus = (a: any, b: any) => statusOrder[a.status] - statusOrder[b.status]
    const sorter = sortKey === 'recent' ? byRecent : sortKey === 'old' ? byOld : byStatus
    return [...all].sort(sorter)
  }, [brandAll, statusFilter, sortKey])

  const formValidation = useMemo(() => {
    const nameOk = contact.trim().length > 0
    const ph = phone.trim()
    const isMobile = /^1[3-9]\d{9}$/.test(ph)
    const isWeChat = ph.length >= 5 && !/\s/.test(ph)
    const phoneOk = isMobile || isWeChat
    const ideaOk = idea.trim().length > 0
    return {
      nameOk,
      phoneOk,
      ideaOk,
      nameMsg: nameOk ? '' : '请输入联系人姓名',
      phoneMsg: phoneOk ? '' : '请输入有效的联系方式（手机或微信）',
      ideaMsg: ideaOk ? '' : `请输入合作想法（基于 ${brand.name} ）`,
    }
  }, [contact, phone, idea, brand.name])

  const canSubmit = formValidation.nameOk && formValidation.phoneOk && formValidation.ideaOk

  const updateStatus = (id: string, status: 'pending' | 'negotiating' | 'approved' | 'rejected') => {
    const ok = ipService.updatePartnershipStatus(id, status)
    if (ok) {
      setReloadTick(t => t + 1)
      toast.success('状态已更新')
    } else {
      toast.error('更新失败')
    }
  }

  const suggest = async () => {
    const base = chat.trim() || `围绕${brand.name}做一次联名升级`
    const items = [
      `${brand.name} × 校园潮流：${base}，推出限定周边礼盒` ,
      `${brand.name} 城市记忆计划：${base}，设计主题海报与KV` ,
      `${brand.name} 数字文创：${base}，发布数字藏品或表情包`
    ]
    setTips(items)
  }

  const apply = () => {
    if (!contact.trim()) { toast.warning('请输入联系人姓名'); return }
    const ph = phone.trim()
    const isMobile = /^1[3-9]\d{9}$/.test(ph)
    const isWeChat = ph.length >= 5 && !/\s/.test(ph)
    if (!isMobile && !isWeChat) { toast.warning('请输入有效的联系方式（手机或微信）'); return }
    if (!idea.trim()) { toast.warning('请输入合作想法'); return }
    ipService.createPartnership({
      brandName: brand.name,
      brandLogo: brand.image,
      description: `${idea}（联系人：${contact}，电话：${phone}）`,
      reward: '待协商',
      status: 'pending',
      ipAssetId: 'ip-001'
    })
    setContact(''); setPhone(''); setIdea('')
    setReloadTick(t => t + 1)
    toast.success('已提交合作申请，我们会尽快联系您')
  }

  return (
      <main className="container mx-auto px-4 py-8 scroll-smooth" aria-label="主要内容">
        <GradientHero 
          title="品牌合作与企业服务"
          subtitle="AI赋能老字号品牌年轻化，连接创意与商业的桥梁"
          theme="blue"
          stats={[
            { label: '入驻品牌', value: '50+' },
            { label: '活跃创作者', value: '10k+' },
            { label: '落地案例', value: '120+' },
            { label: '覆盖城市', value: '天津' }
          ]}
          size="lg"
        />

        {/* 营销价值板块 */}
        <section className="py-12 mb-12">
            <h2 className={`text-3xl font-bold text-center mb-10 ${isDark ? 'text-white' : 'text-gray-900'}`}>为什么选择津脉智坊？</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg hover:shadow-xl transition-shadow border border-gray-100 dark:border-gray-700`}>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 text-blue-600">
                        <i className="fas fa-magic text-2xl"></i>
                    </div>
                    <h3 className="text-xl font-bold mb-3">AI 创意赋能</h3>
                    <p className="text-gray-500 dark:text-gray-400">利用前沿生成式AI技术，快速产出海量国潮设计方案，降低试错成本。</p>
                </div>
                <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg hover:shadow-xl transition-shadow border border-gray-100 dark:border-gray-700`}>
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 text-purple-600">
                        <i className="fas fa-users text-2xl"></i>
                    </div>
                    <h3 className="text-xl font-bold mb-3">Z世代创作者生态</h3>
                    <p className="text-gray-500 dark:text-gray-400">连接万名年轻创作者，通过赛事、众包等形式，为品牌注入新鲜血液。</p>
                </div>
                <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg hover:shadow-xl transition-shadow border border-gray-100 dark:border-gray-700`}>
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4 text-red-600">
                        <i className="fas fa-chart-line text-2xl"></i>
                    </div>
                    <h3 className="text-xl font-bold mb-3">全链路商业转化</h3>
                    <p className="text-gray-500 dark:text-gray-400">从IP设计到实物周边定制（POD），再到数字藏品发行，提供一站式解决方案。</p>
                </div>
            </div>
        </section>

        {/* 合作申请区 */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6" id="cooperation-form">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className={`${isDark ? 'bg-gray-800/80 ring-1 ring-gray-700' : 'bg-white/90 ring-1 ring-gray-200'} rounded-2xl shadow-xl p-6 backdrop-blur lg:sticky lg:top-6`}>
            <h2 className="text-lg font-bold mb-4">第一步：选择意向品牌</h2>
            <label htmlFor="brand-search" className="sr-only">搜索品牌名称</label>
            <input
              value={brandSearch}
              onChange={(e) => setBrandSearch(e.target.value)}
              id="brand-search"
              className={`${isDark ? 'bg-gray-700 text-white focus:ring-offset-gray-800' : 'bg-gray-50 text-gray-900'} w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 mb-2`}
              placeholder="搜索品牌名称"
            />
            <select
              value={brand.id}
              onChange={(e) => setBrand(BRANDS.find(b => b.id === e.target.value) || BRANDS[0])}
              className={`${isDark ? 'bg-gray-700 text-white focus:ring-offset-gray-800' : 'bg-gray-50 text-gray-900'} w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
            >
              {BRANDS.filter(b => b.name.toLowerCase().includes(brandSearch.trim().toLowerCase())).map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            <div className="mt-4">
              <div className="relative group">
                <img src={brand.image} alt={brand.name} className="w-full h-40 object-cover rounded-xl shadow-md group-hover:shadow-lg transition-all" loading="lazy" decoding="async" />
                <div className={`absolute inset-x-0 bottom-0 px-3 py-2 text-xs ${isDark ? 'bg-black/60 text-gray-200' : 'bg-white/70 text-gray-800'} rounded-b-xl backdrop-blur-sm`}>{brand.name}</div>
              </div>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mt-3 text-sm leading-relaxed`}>{brand.story}</p>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.05 }} className={`lg:col-span-2 ${isDark ? 'bg-gray-800/80 ring-1 ring-gray-700' : 'bg-white/90 ring-1 ring-gray-200'} rounded-2xl shadow-xl p-6 backdrop-blur`}>
            <div className="mb-4">
                <h2 className="text-lg font-bold mb-2">第二步：AI 辅助方案构思</h2>
                <p className="text-sm text-gray-500">不知道如何创新？让AI为您提供灵感。</p>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-3">
              {['赛博朋克风','校园潮流联名','数字文创表情包'].map((s, i) => (
                <button key={i} className={`${isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'} text-xs px-3 py-1 rounded-full transition-colors`} onClick={() => setChat(`把${brand.name}做成${s}`)}>{s}</button>
              ))}
            </div>
            <textarea
                value={chat}
                onChange={(e) => setChat(e.target.value)}
                onKeyDown={(e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); suggest() } }}
                className={`${isDark ? 'bg-gray-700 text-white focus:ring-offset-gray-800' : 'bg-gray-50 text-gray-900'} w-full h-24 px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                placeholder="输入您的初步想法，例如：把麻花做成赛博朋克风..."
            />
            <motion.button whileHover={{ scale: 1.03 }} onClick={suggest} className="mt-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-lg shadow font-medium">✨ 生成灵感方案</motion.button>
            
            {tips.length > 0 && (
              <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                <h3 className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-3">AI 推荐方案：</h3>
                <ul className="space-y-2 text-sm">
                {tips.map((t, i) => (
                  <li key={i} className={`${isDark ? 'bg-gray-700' : 'bg-white'} px-4 py-3 rounded-lg flex items-center justify-between hover:shadow-sm transition-all`}>
                    <span className="mr-2 flex-1">{t}</span>
                    <button className="px-3 py-1.5 text-xs rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium whitespace-nowrap" onClick={() => setIdea(t)}>采用此方案</button>
                  </li>
                ))}
                </ul>
              </div>
            )}
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.1 }} className={`${isDark ? 'bg-gray-800/80 ring-1 ring-gray-700' : 'bg-white/90 ring-1 ring-gray-200'} rounded-2xl shadow-xl p-6 backdrop-blur`}>
            <h2 className="text-lg font-bold mb-4">第三步：提交合作意向</h2>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">联系人姓名</label>
                    <input value={contact} onChange={e => setContact(e.target.value)} className={`${isDark ? 'bg-gray-700 text-white focus:ring-offset-gray-800' : 'bg-gray-50 text-gray-900'} w-full px-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500`} placeholder="您的姓名" />
                    {!formValidation.nameOk && contact.length > 0 && (<div className="mt-1 text-xs text-red-600">{formValidation.nameMsg}</div>)}
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">联系方式</label>
                    <input value={phone} onChange={e => setPhone(e.target.value)} className={`${isDark ? 'bg-gray-700 text-white focus:ring-offset-gray-800' : 'bg-gray-50 text-gray-900'} w-full px-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500`} placeholder="手机号或微信号" />
                    {!formValidation.phoneOk && phone.length > 0 && (<div className="mt-1 text-xs text-red-600">{formValidation.phoneMsg}</div>)}
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">合作方案描述</label>
                    <textarea value={idea} onChange={e => setIdea(e.target.value)} className={`${isDark ? 'bg-gray-700 text-white focus:ring-offset-gray-800' : 'bg-gray-50 text-gray-900'} w-full h-32 px-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500`} placeholder={`描述您对 ${brand.name} 的合作想法...`} />
                    {!formValidation.ideaOk && idea.length > 0 && (<div className="mt-1 text-xs text-red-600">{formValidation.ideaMsg}</div>)}
                </div>
                <button onClick={apply} disabled={!canSubmit} className={`w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 rounded-lg shadow-lg font-bold text-lg ${!canSubmit ? 'opacity-50 cursor-not-allowed' : 'hover:from-blue-700 hover:to-purple-700 transform hover:scale-[1.02] transition-all'}`}>立即提交申请</button>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.15 }} className={`lg:col-span-2 ${isDark ? 'bg-gray-800/80 ring-1 ring-gray-700' : 'bg-white/90 ring-1 ring-gray-200'} rounded-2xl shadow-xl p-6 backdrop-blur`}>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">我的申请记录</h2>
                <div className="flex gap-2 text-xs">
                    <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-blue-500 mr-1"></span>待处理</span>
                    <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-green-500 mr-1"></span>已通过</span>
                </div>
            </div>
            
            {partnerships.length === 0 ? (
              <div className="text-center py-12 opacity-70 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-600">
                <i className="fas fa-inbox text-4xl mb-3 text-gray-400"></i>
                <p>暂无申请记录，快去发起您的第一个品牌合作吧！</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={`${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <th className="text-left px-4 py-3 rounded-l-lg">品牌</th>
                      <th className="text-left px-4 py-3">方案摘要</th>
                      <th className="text-left px-4 py-3">状态</th>
                      <th className="text-left px-4 py-3">提交时间</th>
                      <th className="text-left px-4 py-3 rounded-r-lg">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {partnerships.map(p => (
                      <tr key={p.id} className={`${isDark ? 'border-gray-700 hover:bg-gray-800/60' : 'border-gray-100 hover:bg-gray-50'} border-b transition-colors`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <img src={p.brandLogo} alt={p.brandName} className="w-8 h-8 rounded bg-white object-contain p-0.5 border border-gray-200" />
                            <span className="font-medium">{p.brandName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 max-w-xs truncate" title={p.description}>{p.description}</td>
                        <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                p.status === 'approved' ? 'bg-green-100 text-green-700' : 
                                p.status === 'rejected' ? 'bg-red-100 text-red-700' : 
                                'bg-blue-100 text-blue-700'
                            }`}>
                                {p.status === 'pending' ? '审核中' : 
                                 p.status === 'negotiating' ? '洽谈中' : 
                                 p.status === 'approved' ? '已通过' : '已婉拒'}
                            </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500">{new Date(p.updatedAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => updateStatus(p.id, 'negotiating')} className="text-blue-600 hover:text-blue-800 font-medium text-xs mr-2">跟进</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </div>
      </main>
  )
}
