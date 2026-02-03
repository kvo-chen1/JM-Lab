import React, { useMemo, useState, useEffect, Suspense, lazy, useCallback } from 'react'
import { useTheme } from '@/hooks/useTheme'
import { motion } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
// 使用更简洁的懒加载方式
const ProductMockupPreview = lazy(() => import('@/components/ProductMockupPreview'))
// 使用默认导入包装命名导出
const CreatePostModal = lazy(() => import('@/components/Community/Modals/CreatePostModal').then(module => ({ default: module.CreatePostModal })))
import postsApi from '@/services/postService'
import exportService, { ExportOptions, ExportFormat } from '@/services/exportService'
import { toast } from 'sonner'
import LazyImage from '@/components/LazyImage'
// 导入API服务
import { apiService } from '@/services/apiService'

export default function WorkDetail() {
  const { isDark } = useTheme()
  const navigate = useNavigate()
  const { id } = useParams()
  const [liked, setLiked] = useState(false)
  const [likes, setLikes] = useState(0)
  const [bookmarked, setBookmarked] = useState(false)
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

  // 从API获取作品详情
  useEffect(() => {
    if (id) {
      const fetchWorkDetails = async () => {
        try {
          // 从API获取作品详情
          const workData = await apiService.getWorkById(id);
          setWork(workData);
          
          if (workData) {
            // 初始化点赞和收藏状态
            const userBookmarks = postsApi.getUserBookmarks();
            const userLikes = postsApi.getUserLikes();
            setBookmarked(userBookmarks.includes(id));
            setLiked(userLikes.includes(id));
            setLikes(workData.likes || 0);
            
            // 获取相关作品
            const relatedWorksData = await apiService.getRelatedWorks(id, 6);
            if (relatedWorksData) {
              setRelated(relatedWorksData);
            }
          }
        } catch (error) {
          console.error('获取作品详情失败:', error);
          toast.error('加载作品详情失败，请稍后重试');
          // 出错时使用空对象
          setWork(null);
        }
      };
      
      fetchWorkDetails();
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

  // 使用useCallback缓存点击事件处理函数，减少不必要的重渲染
  const handleLike = useCallback(async () => {
    if (work) {
      const stringId = work.id.toString()
      
      // 乐观更新：先更新UI状态，立即给用户反馈
      const newLikedState = !liked
      const newLikesCount = newLikedState ? likes + 1 : Math.max(0, likes - 1)
      
      setLiked(newLikedState)
      setLikes(newLikesCount)
      
      // 然后异步发送API请求
      try {
        if (newLikedState) {
          // 调用API点赞
          await apiService.likeWork(stringId)
        } else {
          // 调用API取消点赞
          await apiService.unlikeWork(stringId)
        }
      } catch (error) {
        console.error('点赞操作失败:', error)
        // 出错时回滚状态
        setLiked(liked)
        setLikes(likes)
        toast.error(liked ? '取消点赞失败' : '点赞失败')
      }
    }
  }, [work, liked, likes])

  const handleBookmark = useCallback(async () => {
    if (work) {
      const stringId = work.id.toString()
      
      // 乐观更新：先更新UI状态，立即给用户反馈
      const newBookmarkedState = !bookmarked
      setBookmarked(newBookmarkedState)
      
      // 然后异步发送API请求
      try {
        if (newBookmarkedState) {
          // 调用API收藏
          await apiService.bookmarkWork(stringId)
        } else {
          // 调用API取消收藏
          await apiService.unbookmarkWork(stringId)
        }
      } catch (error) {
        console.error('收藏操作失败:', error)
        // 出错时回滚状态
        setBookmarked(bookmarked)
        toast.error(bookmarked ? '取消收藏失败' : '收藏失败')
      }
    }
  }, [work, bookmarked])

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
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>请返回首页选择其他作品</p>
            <button className="mt-6 px-4 py-2 rounded-lg bg-red-600 text-white" onClick={() => navigate('/')}>返回首页</button>
          </div>
        </main>
      </div>
    )
  }

  return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          {/* 面包屑导航 */}
          <div className="mb-6 flex items-center text-sm">
            <a href="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">首页</a>
            <i className="fas fa-chevron-right text-xs mx-2 opacity-50" />
            <a href="/square" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">津脉广场</a>
            <i className="fas fa-chevron-right text-xs mx-2 opacity-50" />
            <span className="opacity-70">{work.title}</span>
          </div>

          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className={`rounded-xl shadow-lg overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
              {/* 作品主图/视频区域 */}
              <div className="order-1 lg:order-1 lg:col-span-8 relative group">
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
                
                {/* 悬停时的快速操作按钮 */}
                <motion.div 
                  className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 0 }}
                  whileHover={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <button 
                    onClick={handleLike} 
                    className="p-2 rounded-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm text-red-600 hover:bg-white hover:shadow-md transition-all"
                    title={liked ? '取消点赞' : '点赞'}
                  >
                    <i className={`far fa-heart ${liked ? 'fas text-red-600' : ''}`} />
                  </button>
                  <button 
                    onClick={handleBookmark} 
                    className="p-2 rounded-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm text-blue-600 hover:bg-white hover:shadow-md transition-all"
                    title={bookmarked ? '取消收藏' : '收藏'}
                  >
                    <i className={`far fa-bookmark ${bookmarked ? 'fas text-blue-600' : ''}`} />
                  </button>
                  <button 
                    onClick={() => handleShare()}
                    className="p-2 rounded-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm text-teal-600 hover:bg-white hover:shadow-md transition-all"
                    title="分享"
                  >
                    <i className="fas fa-share-alt" />
                  </button>
                </motion.div>
              </div>
              
              {/* 作品信息区域 */}
              <div className="p-6 sm:p-8 order-2 lg:order-2 lg:col-span-4">
                {/* 分类标签 */}
                <div className="mb-4">
                  <span className="px-3 py-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium rounded-full">
                    {work.category}
                  </span>
                </div>
                
                {/* 作品标题 */}
                <h1 className="text-2xl sm:text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
                  {work.title}
                </h1>
                
                {/* 创作者信息 */}
                <div className="flex items-center mb-6 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  <LazyImage 
                    src={work.creatorAvatar} 
                    alt="avatar" 
                    className="w-12 h-12 rounded-full mr-3 object-cover border-2 border-white dark:border-gray-700 shadow-sm" 
                    ratio="square" 
                    fit="cover" 
                  />
                  <div>
                    <div className="font-semibold text-lg">{work.creator}</div>
                    <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm`}>创作者</div>
                  </div>
                </div>
                
                {/* 作品统计 */}
                <div className="flex items-center space-x-6 mb-8 p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                  <div className="flex flex-col items-center">
                    <div className={`text-2xl font-bold ${liked ? 'text-red-500' : (isDark ? 'text-white' : 'text-gray-800')}`}>{likes}</div>
                    <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>点赞</div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{work.comments}</div>
                    <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>评论</div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{work.views}</div>
                    <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>浏览</div>
                  </div>
                </div>
                
                {/* 标签 */}
                <div className="mb-8">
                  <div className="font-semibold mb-3 text-sm uppercase tracking-wider text-gray-500 dark:text-gray-400">标签</div>
                  <div className="flex flex-wrap gap-2">
                    {work.tags.map((t: string, i: number) => (
                      <span key={i} className={`text-sm px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 text-blue-800 dark:text-blue-300 font-medium`}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                
                {/* 操作按钮 */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={handleLike} 
                      className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all hover:shadow-md flex items-center justify-center gap-2
                        ${liked ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white' : 'bg-gradient-to-r from-red-500 to-red-600 text-white'}
                      `}
                    >
                      <i className={`far fa-heart ${liked ? '' : 'fas'}`} />
                      {liked ? '取消点赞' : '点赞'}
                    </button>
                    <button 
                      onClick={handleBookmark} 
                      className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all hover:shadow-md flex items-center justify-center gap-2
                        ${bookmarked ? 'bg-gradient-to-r from-blue-700 to-blue-800 text-white' : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'}
                      `}
                    >
                      <i className={`far fa-bookmark ${bookmarked ? 'fas' : ''}`} />
                      {bookmarked ? '已收藏' : '收藏'}
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3">
                    <button 
                      onClick={() => setIsExportDialogOpen(true)}
                      className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 text-white flex items-center justify-center gap-2 text-sm font-medium transition-all hover:shadow-md"
                    >
                      <i className="fas fa-download"></i>
                      导出作品
                    </button>
                    <button 
                      onClick={() => setShowMockup(true)}
                      className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-pink-500 to-pink-600 text-white flex items-center justify-center gap-2 text-sm font-medium transition-all hover:shadow-md"
                    >
                      <i className="fas fa-tshirt"></i>
                      制作周边
                    </button>
                    <button 
                      onClick={handleBuyLicense}
                      className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all hover:shadow-md flex items-center justify-center gap-2
                        ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}
                      `}
                    >
                      <i className="fas fa-file-contract"></i>
                      商用授权
                    </button>
                    <button 
                      onClick={() => handleShare()}
                      className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-teal-500 to-teal-600 text-white flex items-center justify-center gap-2 text-sm font-medium transition-all hover:shadow-md"
                    >
                      <i className="fas fa-share-alt"></i>
                      分享作品
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.1 }} className="mt-12">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">相关作品</h2>
              <p className={`max-w-2xl mx-auto ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>发现更多类似风格的创意作品，获取灵感启发</p>
            </div>
            {related.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {related.map((w, index) => (
                  <motion.div 
                    key={w.id} 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 * index }}
                    whileHover={{ 
                      scale: 1.03, 
                      y: -5,
                      boxShadow: isDark ? '0 20px 40px -10px rgba(0, 0, 0, 0.5)' : '0 20px 40px -10px rgba(0, 0, 0, 0.15)'
                    }}
                    className={`rounded-xl overflow-hidden cursor-pointer ${isDark ? 'bg-gray-800 ring-1 ring-gray-700' : 'bg-white ring-1 ring-gray-200'} flex flex-col h-full transition-all duration-300`}
                    onClick={() => navigate(`/explore/${w.id}`)}
                  >
                    <div className="relative overflow-hidden group">
                      <LazyImage 
                        src={w.thumbnail} 
                        alt={w.title} 
                        className="w-full h-56 object-cover transition-transform duration-500 group-hover:scale-110"
                        fit="cover"
                      />
                      <div className="absolute top-3 left-3">
                        <span className="px-2.5 py-1 bg-black/60 backdrop-blur-sm text-white text-xs font-medium rounded-full">
                          {w.category}
                        </span>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                        <div className="p-4 w-full">
                          <div className="flex flex-wrap gap-1.5">
                            {w.tags.slice(0, 3).map((tag: string, i: number) => (
                              <span key={i} className="px-2 py-0.5 bg-white/90 text-black text-xs font-medium rounded-full">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 flex flex-col flex-grow">
                      <div className="text-base font-medium line-clamp-2 mb-3">{w.title}</div>
                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex items-center">
                          <LazyImage 
                            src={w.creatorAvatar} 
                            alt={w.creator} 
                            className="w-6 h-6 rounded-full mr-2 object-cover" 
                            ratio="square" 
                            fit="cover" 
                          />
                          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{w.creator}</span>
                        </div>
                        <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          {w.likes} 赞
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className={`p-8 rounded-xl ${isDark ? 'bg-gray-800 ring-1 ring-gray-700' : 'bg-white ring-1 ring-gray-200'} text-center`}>
                <div className="text-5xl mb-4">🎨</div>
                <h3 className="text-xl font-bold mb-2">暂无同类作品</h3>
                <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>探索更多创意作品，发现无限可能</p>
                <button 
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
                  onClick={() => navigate('/explore')}
                >
                  探索作品
                </button>
              </div>
            )}
          </motion.div>
          


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
                      <span className="text-xs">津脉社区</span>
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

          {/* 分享到津脉社区对话框 */}
          {isShareToCommunityOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4">
              <div className={`${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} rounded-xl p-6 w-full max-w-md`}>
                <h2 className="text-xl font-bold mb-4">分享到津脉社区</h2>
                
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
