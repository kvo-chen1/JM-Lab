import React, { useMemo, useState, useEffect, Suspense, lazy } from 'react'
import { useTheme } from '@/hooks/useTheme'
import { motion } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
// 使用更简洁的懒加载方式
const ARPreview = lazy(() => import('@/components/SimplifiedARPreview'))
const ProductMockupPreview = lazy(() => import('@/components/ProductMockupPreview'))
// 使用默认导入包装命名导出
const CreatePostModal = lazy(() => import('@/components/Community/Modals/CreatePostModal').then(module => ({ default: module.CreatePostModal })))
import postsApi from '@/services/postService'
import exportService, { ExportOptions, ExportFormat } from '@/services/exportService'
import { toast } from 'sonner'
import type { SimplifiedARPreviewConfig as ARPreviewConfig } from '@/components/SimplifiedARPreview'
import LazyImage from '@/components/LazyImage'
// 导入mock数据
import { mockWorks } from '@/mock/works'

// 自定义错误边界组件 - 使用类组件实现，确保能正确捕获所有错误
class ARPreviewErrorBoundary extends React.Component<
  { children: React.ReactNode; onRetry: () => void },
  { hasError: boolean; error: Error | null; errorInfo: React.ErrorInfo | null }
> {
  constructor(props: { children: React.ReactNode; onRetry: () => void }) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  // 捕获渲染过程中的错误
  static getDerivedStateFromError(error: Error): { hasError: boolean; error: Error | null } {
    // 更新状态，下次渲染时显示错误界面
    return { hasError: true, error };
  }

  // 捕获组件生命周期中的错误
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 记录错误信息
    console.error('AR Preview Error:', error);
    console.error('Error Info:', errorInfo);
    // 更新状态
    this.setState({ error, errorInfo });
  }

  // 重置错误状态
  resetError = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    this.props.onRetry();
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
          <div className="text-white text-center p-6 bg-red-900 bg-opacity-70 rounded-lg max-w-md">
            <div className="text-5xl mb-4">⚠️</div>
            <h3 className="text-2xl font-bold mb-3">AR预览加载失败</h3>
            <p className="mb-4">
              {this.state.error ? this.state.error.message : '请检查网络连接或稍后重试'}
            </p>
            <div className="flex justify-center gap-3">
              <button 
                onClick={this.resetError} 
                className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition-colors font-medium"
              >
                重试
              </button>
            </div>
            {import.meta.env.MODE === 'development' && this.state.errorInfo && (
              <div className="mt-4 text-left text-sm text-gray-300 overflow-auto max-h-40">
                <p className="font-medium mb-1">错误详情：</p>
                <pre className="whitespace-pre-wrap">{this.state.errorInfo.componentStack}</pre>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function WorkDetail() {
  const { isDark } = useTheme()
  const navigate = useNavigate()
  const { id } = useParams()
  const [liked, setLiked] = useState(false)
  const [likes, setLikes] = useState(0)
  const [bookmarked, setBookmarked] = useState(false)
  const [isARPreviewOpen, setIsARPreviewOpen] = useState(false)
  const [arRetryCount, setArRetryCount] = useState(0) // 用于处理AR预览重试
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [isShareToCommunityOpen, setIsShareToCommunityOpen] = useState(false)
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'png',
    resolution: 'medium',
    quality: 0.8,
    includeMetadata: true,
    includeComments: false,
    includeCulturalElements: false,
    includeColorScheme: false,
    includeToolsUsed: false
  })
  const [work, setWork] = useState<any>(null)
  const [related, setRelated] = useState<any[]>([])
  const [showMockup, setShowMockup] = useState(false)
  const [shareSuccess, setShareSuccess] = useState(false)
  const [communityTopics, setCommunityTopics] = useState<string[]>(['国潮', '非遗', '极简', '赛博朋克', '传统文化', '数字艺术', '工艺创新'])

  // 从统一数据源获取作品详情
  useEffect(() => {
    if (id) {
      // 使用mockWorks数据而不是从localStorage获取
      const foundWork = mockWorks.find(post => post.id === parseInt(id))
      setWork(foundWork)
      
      if (foundWork) {
        // 初始化点赞和收藏状态
        const userBookmarks = postsApi.getUserBookmarks()
        const userLikes = postsApi.getUserLikes()
        setBookmarked(userBookmarks.includes(id))
        setLiked(userLikes.includes(id))
        setLikes(foundWork.likes)
        
        // 获取相关作品
        const relatedWorks = mockWorks.filter(post => 
          post.category === foundWork.category && post.id !== parseInt(id)
        ).slice(0, 6)
        setRelated(relatedWorks)
      }
    }
  }, [id])

  // 确保在访问work属性之前work已经存在
  if (!work) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <main className="max-w-7xl mx-auto p-0 py-6">
          <div className="text-center py-20">
            <div className="text-5xl text-gray-400 mb-4"><i className="far fa-image" /></div>
            <h2 className="text-xl font-semibold mb-2">未找到作品</h2>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>请返回探索页选择其他作品</p>
            <button className="mt-6 px-4 py-2 rounded-lg bg-red-600 text-white" onClick={() => navigate('/explore')}>返回探索</button>
          </div>
        </main>
      </div>
    );
  }

  const handleLike = () => {
    if (work) {
      const stringId = work.id.toString()
      if (!liked) {
        // 调用postService方法，但忽略返回结果，因为localStorage中可能没有对应数据
        postsApi.likePost(stringId)
        setLikes(likes + 1)
      } else {
        postsApi.unlikePost(stringId)
        setLikes(Math.max(0, likes - 1))
      }
      setLiked(!liked)
    }
  }

  const handleBookmark = () => {
    if (work) {
      const stringId = work.id.toString()
      if (!bookmarked) {
        postsApi.bookmarkPost(stringId)
      } else {
        postsApi.unbookmarkPost(stringId)
      }
      setBookmarked(!bookmarked)
    }
  }

  const handleBuyLicense = () => {
    toast.success('已跳转至授权购买页面')
    // 实际项目中跳转到支付/授权页面
    // navigate(`/license/buy/${work.id}`)
  }

  // 处理分享功能
  const handleShare = () => {
    setIsShareDialogOpen(true)
  }

  // 分享到具体平台
  const shareToPlatform = (platform: string) => {
    const shareUrl = `${window.location.origin}/explore/${work.id}`
    const shareTitle = work.title
    const shareDesc = `${work.title} - 来自津脉智坊的精彩作品`
    const shareImage = work.thumbnail
    
    let shareLink = ''
    
    switch (platform) {
      case 'weixin':
        // 微信分享通常需要专门的SDK，这里只是示例
        toast.info('请使用微信扫一扫分享')
        break
      case 'weibo':
        shareLink = `https://service.weibo.com/share/share.php?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareTitle)}&pic=${encodeURIComponent(shareImage)}`
        window.open(shareLink, '_blank')
        break
      case 'qq':
        shareLink = `https://connect.qq.com/widget/shareqq/index.html?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareTitle)}&pics=${encodeURIComponent(shareImage)}&summary=${encodeURIComponent(shareDesc)}`
        window.open(shareLink, '_blank')
        break
      case 'copy':
        navigator.clipboard.writeText(shareUrl)
          .then(() => {
            setShareSuccess(true)
            setTimeout(() => {
              setShareSuccess(false)
              setIsShareDialogOpen(false)
            }, 2000)
          })
          .catch(() => {
            toast.error('复制链接失败，请手动复制')
          })
        break
      case 'community':
        // 打开分享到社群的模态框
        setIsShareDialogOpen(false)
        setIsShareToCommunityOpen(true)
        break
      default:
        break
    }
  }

  // 分享到社群
  const handleShareToCommunity = (data: { title: string; content: string; topic: string; communityIds: string[] }) => {
    // 使用社群服务创建帖子
    import('@/services/communityService').then(({ createPost }) => {
      createPost({
        title: data.title,
        content: data.content,
        topic: data.topic,
        communityIds: data.communityIds,
        workId: work.id.toString()
      })
    })
    setIsShareToCommunityOpen(false)
  }

  // 处理导出功能
  const handleExport = () => {
    if (!work) return

    // 将Work转换为ExportableWork类型
    const exportableWork = {
      id: work.id.toString(),
      title: work.title,
      description: work.title,
      images: [work.thumbnail],
      category: work.category,
      tags: work.tags,
      culturalElements: work.tags.filter((tag: string) => ['国潮', '传统', '非遗', '民俗', '文化'].some(keyword => tag.includes(keyword))),
      colorScheme: [],
      toolsUsed: [],
      date: new Date().toISOString(),
      author: work.creator,
      likes: work.likes,
      views: work.views,
      comments: []
    }

    exportService.exportWork(exportableWork, exportOptions)
    setIsExportDialogOpen(false)
  }

  // 处理导出选项变更
  const handleExportOptionChange = (key: keyof ExportOptions, value: any) => {
    setExportOptions(prev => ({ ...prev, [key]: value }))
  }

  if (!work) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <main className="max-w-7xl mx-auto p-0 py-0">
          <div className="text-center py-20">
            <div className="text-5xl text-gray-400 mb-4"><i className="far fa-image" /></div>
            <h2 className="text-xl font-semibold mb-2">未找到作品</h2>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>请返回探索页选择其他作品</p>
            <button className="mt-6 px-4 py-2 rounded-lg bg-red-600 text-white" onClick={() => navigate('/explore')}>返回探索</button>
          </div>
        </main>
      </div>
    )
  }

  return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="mb-6 flex items-center text-sm">
            <a href="/explore" className="hover:text-red-600 transition-colors">探索作品</a>
            <i className="fas fa-chevron-right text-xs mx-2 opacity-50" /> 
            <span className="opacity-70">{work.title}</span>
          </div>

          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className={`rounded-xl shadow-lg overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-0">
              <div className="p-6 sm:p-8 order-2 lg:order-1 lg:col-span-1">
                <div className="flex items-center justify-between mb-4">
                  <h1 className="text-xl sm:text-2xl font-bold">{work.title}</h1>
                  <span className={`text-sm px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>{work.category}</span>
                </div>
                <div className="flex items-center mb-6">
                  <LazyImage 
                    src={work.creatorAvatar} 
                    alt="avatar" 
                    className="w-10 h-10 rounded-full mr-3 object-cover" 
                    ratio="square" 
                    fit="cover" 
                  />
                  <div>
                    <div className="font-medium">{work.creator}</div>
                    <div className={`${isDark ? 'text-gray-400' : 'text-gray-500'} text-sm`}>创作者</div>
                  </div>
                </div>
                <div className="flex items-center space-x-6 mb-6">
                  <div className="flex items-center"><i className={`far fa-heart mr-2 ${liked ? 'text-red-500' : ''}`} /><span className="text-base">{likes}</span></div>
                  <div className="flex items-center"><i className="far fa-comment mr-2" /><span className="text-base">{work.comments}</span></div>
                  <div className="flex items-center"><i className="far fa-eye mr-2" /><span className="text-base">{work.views}</span></div>
                </div>
                <div className="mb-6">
                  <div className="font-semibold mb-2">标签</div>
                  <div className="flex flex-wrap gap-2">
                    {work.tags.map((t: string, i: number) => (
                      <span key={i} className={`text-sm px-2 py-1 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>{t}</span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button 
                    onClick={handleLike} 
                    className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium transition-all hover:shadow-md"
                  >
                    {liked ? '取消点赞' : '点赞'}
                  </button>
                  <button 
                    onClick={handleBookmark} 
                    className={`px-4 py-2 rounded-lg ${bookmarked ? 'bg-blue-700 text-white' : 'bg-blue-600 text-white'} text-sm font-medium transition-all hover:shadow-md`}
                  >
                    {bookmarked ? '已收藏' : '收藏'}
                  </button>
                  <button 
                    onClick={() => setIsARPreviewOpen(true)}
                    className="px-4 py-2 rounded-lg bg-green-600 text-white flex items-center gap-2 text-sm font-medium transition-all hover:shadow-md"
                  >
                    <i className="fas fa-camera"></i>
                    AR预览
                  </button>
                  <button 
                    onClick={() => setIsExportDialogOpen(true)}
                    className="px-4 py-2 rounded-lg bg-purple-600 text-white flex items-center gap-2 text-sm font-medium transition-all hover:shadow-md"
                  >
                    <i className="fas fa-download"></i>
                    导出作品
                  </button>
                  <button 
                    onClick={() => setShowMockup(true)}
                    className="px-4 py-2 rounded-lg bg-pink-600 text-white flex items-center gap-2 text-sm font-medium transition-all hover:shadow-md"
                  >
                    <i className="fas fa-tshirt"></i>
                    制作周边
                  </button>
                  <button 
                    onClick={handleBuyLicense}
                    className={`px-4 py-2 rounded-lg ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} text-sm font-medium transition-all hover:shadow-md`}
                    title="购买商用授权"
                  >
                    <i className="fas fa-file-contract mr-1"></i>
                    商用授权
                  </button>
                  <button 
                    onClick={() => handleShare()}
                    className="px-4 py-2 rounded-lg bg-teal-600 text-white flex items-center gap-2 text-sm font-medium transition-all hover:shadow-md"
                    title="分享作品"
                  >
                    <i className="fas fa-share-alt"></i>
                    分享
                  </button>
                </div>
              </div>
              <div className="order-1 lg:order-2 lg:col-span-3">
                {/* 中文注释：如果存在视频地址，展示视频播放器；否则展示图片 */}
                {work.videoUrl ? (
                  <video
                    src={work.videoUrl}
                    poster={work.thumbnail}
                    controls
                    className="w-full h-full min-h-[400px] sm:min-h-[500px] lg:min-h-[600px] object-cover"
                  />
                ) : (
                  <LazyImage 
                    src={work.thumbnail} 
                    alt={work.title} 
                    className="w-full h-full min-h-[400px] sm:min-h-[500px] lg:min-h-[600px] object-cover"
                    fit="cover"
                    priority={true}
                  />
                )}
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.1 }} className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">相关作品</h2>
              <button className={`px-3 py-1.5 rounded-lg text-sm ${isDark ? 'bg-gray-800' : 'bg-white'} shadow`} onClick={() => navigate('/explore')}>返回探索</button>
            </div>
            {related.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {related.map((w) => (
                  <motion.div key={w.id} whileHover={{ scale: 1.02 }} className={`rounded-xl overflow-hidden cursor-pointer ${isDark ? 'bg-gray-800 ring-1 ring-gray-700' : 'bg-white ring-1 ring-gray-200'} flex flex-col h-full`} onClick={() => navigate(`/explore/${w.id}`)}>
                    <LazyImage 
                      src={w.thumbnail} 
                      alt={w.title} 
                      className="w-full h-48 object-cover" 
                      fit="cover"
                    />
                    <div className="p-4 flex flex-col flex-grow">
                      <div className="text-base font-medium line-clamp-2 mb-2">{w.title}</div>
                      <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-auto`}>{w.creator}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow`}>暂无同类作品</div>
            )}
          </motion.div>
          
          {/* AR预览组件 - 添加错误边界和重试机制 */}
          {isARPreviewOpen && (
            <ARPreviewErrorBoundary onRetry={() => setArRetryCount(prev => prev + 1)}>
              <Suspense fallback={
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
                  <div className="text-white text-center">
                    <div className="animate-spin w-12 h-12 border-4 border-t-transparent border-white rounded-full mx-auto mb-3"></div>
                    <p>正在加载AR预览...</p>
                    <p className="text-sm opacity-80 mt-2">请稍候...</p>
                  </div>
                </div>
              }>
                <ARPreview
                  config={{
                    // 使用作品的实际图片URL
                    imageUrl: work.thumbnail,
                    // 所有作品都使用2D模式，避免3D模型加载失败
                    type: '2d',
                    scale: 5.0,
                    rotation: { x: 0, y: 0, z: 0 },
                    position: { x: 0, y: 0, z: 0 }
                  }}
                  onClose={() => setIsARPreviewOpen(false)}
                />
              </Suspense>
            </ARPreviewErrorBoundary>
          )}

          {/* 周边定制预览弹窗 */}
          {showMockup && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4" onClick={() => setShowMockup(false)}>
              <div className="w-full max-w-md" onClick={e => e.stopPropagation()}>
                <Suspense fallback={<div className="text-white text-center">加载预览中...</div>}>
                  <ProductMockupPreview imageUrl={work.thumbnail} onCustomize={() => setShowMockup(false)} />
                </Suspense>
                <button 
                  className="mt-4 mx-auto block text-white text-sm opacity-80 hover:opacity-100"
                  onClick={() => setShowMockup(false)}
                >
                  关闭预览
                </button>
              </div>
            </div>
          )}

          {/* 导出选项对话框 */}
          {isExportDialogOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
              <div className={`${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} rounded-xl p-6 w-full max-w-md`}>
                <h2 className="text-xl font-bold mb-4">导出作品</h2>
                
                <div className="space-y-4">
                  {/* 导出格式选择 */}
                  <div>
                    <label className="block text-sm font-medium mb-2">导出格式</label>
                    <select 
                      value={exportOptions.format} 
                      onChange={(e) => handleExportOptionChange('format', e.target.value as ExportFormat)}
                      className={`w-full p-2 rounded-lg ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'} border`}
                    >
                      <option value="png">PNG</option>
                      <option value="jpg">JPG</option>
                      <option value="svg">SVG</option>
                      <option value="pdf">PDF</option>
                      <option value="json">JSON</option>
                      <option value="markdown">Markdown</option>
                      <option value="text">纯文本</option>
                    </select>
                  </div>

                  {/* 分辨率选择 */}
                  <div>
                    <label className="block text-sm font-medium mb-2">分辨率</label>
                    <select 
                      value={exportOptions.resolution}
                      onChange={(e) => handleExportOptionChange('resolution', e.target.value as 'low' | 'medium' | 'high')}
                      className={`w-full p-2 rounded-lg ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'} border`}
                    >
                      <option value="low">低</option>
                      <option value="medium">中</option>
                      <option value="high">高</option>
                    </select>
                  </div>

                  {/* 质量选择 */}
                  {(exportOptions.format === 'jpg' || exportOptions.format === 'png') && (
                    <div>
                      <label className="block text-sm font-medium mb-2">质量: {Math.round((exportOptions.quality || 0.8) * 100)}%</label>
                      <input 
                        type="range" 
                        min="0.1" 
                        max="1" 
                        step="0.1"
                        value={exportOptions.quality}
                        onChange={(e) => handleExportOptionChange('quality', parseFloat(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  )}

                  {/* 包含元数据 */}
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      id="includeMetadata"
                      checked={exportOptions.includeMetadata}
                      onChange={(e) => handleExportOptionChange('includeMetadata', e.target.checked)}
                      className={`mr-2 ${isDark ? 'text-purple-500' : 'text-purple-600'}`}
                    />
                    <label htmlFor="includeMetadata" className="text-sm">包含元数据</label>
                  </div>

                  {/* 包含文化元素 */}
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      id="includeCulturalElements"
                      checked={exportOptions.includeCulturalElements}
                      onChange={(e) => handleExportOptionChange('includeCulturalElements', e.target.checked)}
                      className={`mr-2 ${isDark ? 'text-purple-500' : 'text-purple-600'}`}
                    />
                    <label htmlFor="includeCulturalElements" className="text-sm">包含文化元素</label>
                  </div>
                </div>

                {/* 按钮组 */}
                <div className="flex justify-end space-x-3 mt-6">
                  <button 
                    onClick={() => setIsExportDialogOpen(false)}
                    className={`px-4 py-2 rounded-lg ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} transition-colors`}
                  >
                    取消
                  </button>
                  <button 
                    onClick={handleExport}
                    className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-colors"
                  >
                    导出
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 分享对话框 */}
          {isShareDialogOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4">
              <div className={`${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} rounded-xl p-6 w-full max-w-md`}>
                <h2 className="text-xl font-bold mb-4">分享作品</h2>
                
                <div className="space-y-4">
                  {/* 分享链接预览 */}
                  <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-700">
                    <p className="text-sm opacity-70 mb-1">分享链接</p>
                    <p className="text-sm font-medium break-all">{window.location.origin}/explore/{work.id}</p>
                  </div>
                  
                  {/* 分享平台选择 */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                    <button 
                      onClick={() => shareToPlatform('weixin')}
                      className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all hover:shadow-md ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
                    >
                      <i className="fab fa-weixin text-2xl text-green-500 mb-1"></i>
                      <span className="text-xs">微信</span>
                    </button>
                    <button 
                      onClick={() => shareToPlatform('weibo')}
                      className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all hover:shadow-md ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
                    >
                      <i className="fab fa-weibo text-2xl text-red-500 mb-1"></i>
                      <span className="text-xs">微博</span>
                    </button>
                    <button 
                      onClick={() => shareToPlatform('qq')}
                      className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all hover:shadow-md ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
                    >
                      <i className="fab fa-qq text-2xl text-blue-500 mb-1"></i>
                      <span className="text-xs">QQ</span>
                    </button>
                    <button 
                      onClick={() => shareToPlatform('community')}
                      className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all hover:shadow-md ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
                    >
                      <i className="fas fa-users text-2xl text-orange-500 mb-1"></i>
                      <span className="text-xs">创作者社群</span>
                    </button>
                    <button 
                      onClick={() => shareToPlatform('copy')}
                      className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all hover:shadow-md ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
                    >
                      {shareSuccess ? (
                        <>
                          <i className="fas fa-check-circle text-2xl text-green-500 mb-1"></i>
                          <span className="text-xs">已复制</span>
                        </>
                      ) : (
                        <>
                          <i className="fas fa-link text-2xl text-purple-500 mb-1"></i>
                          <span className="text-xs">复制链接</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* 按钮组 */}
                <div className="flex justify-end mt-6">
                  <button 
                    onClick={() => setIsShareDialogOpen(false)}
                    className={`px-4 py-2 rounded-lg ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} transition-colors`}
                  >
                    关闭
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 分享到创作者社群对话框 */}
          {isShareToCommunityOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4">
              <div className={`${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} rounded-xl p-6 w-full max-w-md`}>
                <h2 className="text-xl font-bold mb-4">分享到创作者社群</h2>
                
                <Suspense fallback={
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  </div>
                }>
                  <CreatePostModal
                    isOpen={isShareToCommunityOpen}
                    onClose={() => setIsShareToCommunityOpen(false)}
                    onSubmit={handleShareToCommunity}
                    isDark={isDark}
                    topics={communityTopics}
                  />
                </Suspense>
              </div>
            </div>
          )}
        </main>
      </div>
  )
}
