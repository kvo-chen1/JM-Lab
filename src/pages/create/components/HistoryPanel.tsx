import { useEffect, useState, useContext } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCreateStore } from '@/pages/create/hooks/useCreateStore';
import { useTheme } from '@/hooks/useTheme';
import { aiReviewService } from '@/services/aiReviewService';
import { aiGenerationSaveService } from '@/services/aiGenerationSaveService';
import { AuthContext } from '@/contexts/authContext';
import { toast } from 'sonner';

export default function HistoryPanel({ onClose }: { onClose: () => void }) {
  const { isDark } = useTheme();
  const { user } = useContext(AuthContext);
  const generatedResults = useCreateStore((state) => state.generatedResults);
  const setGeneratedResults = useCreateStore((state) => state.setGeneratedResults);
  const setSelectedResult = useCreateStore((state) => state.setSelectedResult);
  const setPrompt = useCreateStore((state) => state.setPrompt);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [aiReviews, setAiReviews] = useState<Array<{
    id: string;
    workId: string;
    prompt: string;
    overallScore: number;
    culturalFitScore: number;
    creativityScore: number;
    aestheticsScore: number;
    commercialPotentialScore?: number;
    highlights: string[];
    workThumbnail?: string;
    createdAt: string;
  }>>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [activeTab, setActiveTab] = useState<'aiReviews' | 'drafts' | 'history'>('aiReviews');
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    console.log('[HistoryPanel] Component mounted');
    // Load drafts from localStorage
    try {
      const savedDrafts = JSON.parse(localStorage.getItem('CREATE_DRAFTS') || '[]');
      console.log('[HistoryPanel] Loaded drafts:', savedDrafts.length);
      setDrafts(savedDrafts);
    } catch (e) {
      console.error('[HistoryPanel] Failed to load drafts:', e);
      setDrafts([]);
    }
  }, []);

  // 加载历史记录 - 优先从数据库加载，同时合并本地记录
  useEffect(() => {
    const loadHistory = async () => {
      setIsLoadingHistory(true);
      try {
        // 1. 先从 localStorage 加载本地历史
        const savedHistoryRaw = localStorage.getItem('CREATE_HISTORY');
        console.log('[HistoryPanel] Raw history from localStorage:', savedHistoryRaw);
        const localHistory = JSON.parse(savedHistoryRaw || '[]');
        console.log('[HistoryPanel] Local history:', localHistory.length, 'items');

        // 2. 如果用户已登录，从数据库加载历史记录
        let dbHistory: any[] = [];
        if (user?.id) {
          console.log('[HistoryPanel] Loading history from database for user:', user.id);
          try {
            const dbRecords = await aiGenerationSaveService.getUserGenerations(user.id, { limit: 50 });
            console.log('[HistoryPanel] Loaded from database:', dbRecords.length, 'records');
            
            // 转换数据库记录为历史记录格式
            dbHistory = dbRecords.map(record => ({
              id: `db-${record.id}`,
              timestamp: record.createdAt ? new Date(record.createdAt).getTime() : Date.now(),
              thumbnail: record.thumbnailUrl || record.resultUrl,
              video: record.type === 'video' ? record.resultUrl : null,
              type: record.type,
              prompt: record.prompt,
              stylePreset: record.metadata?.stylePreset || '',
              source: 'database'
            }));
          } catch (dbError) {
            console.error('[HistoryPanel] Failed to load from database:', dbError);
          }
        }

        // 3. 合并本地和数据库历史记录（去重）
        const allHistory = [...localHistory, ...dbHistory];
        
        // 去重：根据缩略图 URL 去重
        const seenThumbnails = new Set<string>();
        const uniqueHistory = allHistory.filter((item: any) => {
          const thumbnail = item.thumbnail || item.video;
          if (!thumbnail || seenThumbnails.has(thumbnail)) {
            return false;
          }
          seenThumbnails.add(thumbnail);
          return true;
        });

        // 按时间戳排序（最新的在前）
        uniqueHistory.sort((a: any, b: any) => (b.timestamp || 0) - (a.timestamp || 0));

        // 限制数量
        const finalHistory = uniqueHistory.slice(0, 50);

        console.log('[HistoryPanel] Final history:', finalHistory.length, 'items (', localHistory.length, 'local +', dbHistory.length, 'db,', allHistory.length - uniqueHistory.length, 'duplicates removed)');
        setHistory(finalHistory);
      } catch (e) {
        console.error('[HistoryPanel] Failed to load history:', e);
        setHistory([]);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadHistory();
  }, [user?.id]);

  // 加载AI点评记录
  useEffect(() => {
    const loadAIReviews = async () => {
      if (!user?.id) return;
      
      setIsLoadingReviews(true);
      try {
        const response = await aiReviewService.getUserAIReviews(user.id, 20, 0);
        console.log('[HistoryPanel] Loaded AI reviews:', response.reviews.length);
        setAiReviews(response.reviews);
      } catch (error) {
        console.error('[HistoryPanel] Failed to load AI reviews:', error);
      } finally {
        setIsLoadingReviews(false);
      }
    };

    loadAIReviews();
  }, [user?.id]);





  const handleSelectHistory = async (historyItem: any) => {
    // 检查是否已存在相同的作品
    const isDuplicate = generatedResults.some(
      r => r.thumbnail === historyItem.thumbnail
    );
    if (isDuplicate) {
      toast.info('该作品已在缩略框中');
      return;
    }

    setAddingId(historyItem.id);

    try {
      // 从历史记录中恢复创作并添加到现有数组
      const newResult = {
        id: Date.now(),
        thumbnail: historyItem.thumbnail,
        video: historyItem.video,
        type: historyItem.type || 'image',
        score: historyItem.score || 80,
        prompt: historyItem.prompt || '',
        timestamp: historyItem.timestamp,
      };

      // 添加到现有数组而不是替换
      const updatedResults = [...generatedResults, newResult];
      setGeneratedResults(updatedResults);
      setSelectedResult(newResult.id);

      if (historyItem.prompt) {
        setPrompt(historyItem.prompt);
      }

      toast.success('作品已添加到缩略框');
    } catch (error) {
      toast.error('添加作品失败，请重试');
    } finally {
      setAddingId(null);
    }
  };

  const handleClearHistory = () => {
    if (confirm('确定要清空所有历史记录吗？此操作不可恢复。')) {
      localStorage.removeItem('CREATE_HISTORY');
      setHistory([]);
    }
  };

  // 临时调试：移除 Portal 和 Animation，直接返回最简单的 UI
  return createPortal(
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-end bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={`w-full max-w-md h-full shadow-2xl overflow-hidden flex flex-col ${isDark ? 'bg-gray-900' : 'bg-white'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold">创作记录</h2>
          <button 
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('aiReviews')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'aiReviews' ? (isDark ? 'border-blue-500 text-blue-400' : 'border-blue-600 text-blue-600') : (isDark ? 'border-transparent text-gray-400 hover:text-gray-200' : 'border-transparent text-gray-500 hover:text-gray-700')}`}
          >
            AI点评 ({aiReviews.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'history' ? (isDark ? 'border-blue-500 text-blue-400' : 'border-blue-600 text-blue-600') : (isDark ? 'border-transparent text-gray-400 hover:text-gray-200' : 'border-transparent text-gray-500 hover:text-gray-700')}`}
          >
            历史记录 {isLoadingHistory ? <i className="fas fa-spinner fa-spin ml-1"></i> : `(${history.length})`}
          </button>
          <button
            onClick={() => setActiveTab('drafts')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'drafts' ? (isDark ? 'border-blue-500 text-blue-400' : 'border-blue-600 text-blue-600') : (isDark ? 'border-transparent text-gray-400 hover:text-gray-200' : 'border-transparent text-gray-500 hover:text-gray-700')}`}
          >
            草稿箱 ({drafts.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'aiReviews' ? (
            isLoadingReviews ? (
              <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                <i className="fas fa-spinner fa-spin text-4xl mb-3 opacity-50"></i>
                <p>加载中...</p>
              </div>
            ) : aiReviews.length > 0 ? (
              <div className="space-y-3">
                {aiReviews.map((review) => (
                  <div
                    key={review.id}
                    className={`w-full p-3 rounded-xl border flex gap-3 transition-all ${isDark ? 'bg-gray-800 border-gray-700 hover:border-gray-600' : 'bg-gray-50 border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      {review.workThumbnail ? (
                        <img 
                          src={review.workThumbnail} 
                          alt="" 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=No+Image';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <i className="fas fa-magic text-gray-400 text-2xl"></i>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium line-clamp-1 ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                        {review.prompt || '无提示词'}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-600'}`}>
                          <i className="fas fa-star mr-1"></i>
                          {review.overallScore}分
                        </span>
                        <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {review.highlights && review.highlights.length > 0 && (
                        <p className={`text-xs line-clamp-1 mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {review.highlights[0]}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                <i className="fas fa-magic text-4xl mb-3 opacity-30"></i>
                <p>暂无AI点评记录</p>
                <p className="text-xs mt-1 opacity-60">生成作品后点击AI点评即可保存</p>
              </div>
            )
          ) : activeTab === 'history' ? (
            isLoadingHistory ? (
              <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                <i className="fas fa-spinner fa-spin text-4xl mb-3 opacity-50"></i>
                <p>加载历史记录...</p>
              </div>
            ) : history.length > 0 ? (
              <div className="space-y-3">
                <div className="flex justify-end">
                  <button
                    onClick={handleClearHistory}
                    className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${isDark ? 'text-red-400 hover:bg-red-900/30' : 'text-red-500 hover:bg-red-50'}`}
                  >
                    <i className="fas fa-trash-alt mr-1"></i>清空历史
                  </button>
                </div>
                <AnimatePresence>
                  {history.map((item, index) => (
                    <motion.button
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      onClick={() => handleSelectHistory(item)}
                      disabled={addingId === item.id}
                      className={`w-full p-3 rounded-xl border flex gap-3 transition-all text-left relative overflow-hidden ${
                        isDark 
                          ? 'bg-gray-800 border-gray-700 hover:border-blue-500 hover:bg-gray-750' 
                          : 'bg-gray-50 border-gray-200 hover:border-blue-400 hover:bg-blue-50/50'
                      } ${addingId === item.id ? 'opacity-70 cursor-wait' : ''}`}
                    >
                      {/* 加载遮罩 */}
                      {addingId === item.id && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="absolute inset-0 bg-black/20 dark:bg-black/40 flex items-center justify-center z-20"
                        >
                          <div className="flex flex-col items-center">
                            <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-xs text-blue-500 mt-2 font-medium">添加中...</span>
                          </div>
                        </motion.div>
                      )}

                      {/* 添加成功提示 */}
                      {generatedResults.some(r => r.thumbnail === item.thumbnail) && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center z-10"
                        >
                          <i className="fas fa-check text-xs"></i>
                        </motion.div>
                      )}

                      <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center group">
                        {item.type === 'video' || item.video ? (
                          <>
                            {/* 对于视频，直接显示视频播放器 */}
                            {item.video ? (
                              <video 
                                src={item.video}
                                className="w-full h-full object-cover absolute inset-0 transition-transform duration-300 group-hover:scale-110"
                                preload="metadata"
                                muted
                                playsInline
                                onMouseEnter={(e) => (e.target as HTMLVideoElement).play()}
                                onMouseLeave={(e) => (e.target as HTMLVideoElement).pause()}
                              />
                            ) : item.thumbnail ? (
                              <img 
                                src={item.thumbnail} 
                                alt="" 
                                className="w-full h-full object-cover absolute inset-0 transition-transform duration-300 group-hover:scale-110"
                              />
                            ) : null}
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-10 pointer-events-none">
                              <i className="fas fa-play-circle text-white text-2xl"></i>
                            </div>
                            <div className="absolute bottom-1 right-1 z-10 pointer-events-none">
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/60 text-white">
                                <i className="fas fa-video mr-1"></i>视频
                              </span>
                            </div>
                          </>
                        ) : (
                          <img 
                            src={item.thumbnail || 'https://via.placeholder.com/150?text=No+Image'} 
                            alt="" 
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=No+Image';
                            }}
                          />
                        )}

                        {/* 悬浮提示 */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <span className="text-white text-xs font-medium px-2 py-1 rounded-full bg-blue-500/80">
                            <i className="fas fa-plus mr-1"></i>点击添加
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs line-clamp-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{item.prompt || '无描述'}</p>
                        {item.stylePreset && (
                          <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full ${isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                            {item.stylePreset}
                          </span>
                        )}
                        {(item.type === 'video' || item.video) && (
                          <span className={`inline-block mt-1 ml-1 text-[10px] px-2 py-0.5 rounded-full ${isDark ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-100 text-purple-600'}`}>
                            <i className="fas fa-video mr-1"></i>视频
                          </span>
                        )}
                        {item.score && (
                          <span className={`inline-block mt-1 ml-1 text-[10px] px-2 py-0.5 rounded-full ${isDark ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-600'}`}>
                            <i className="fas fa-star mr-1"></i>{item.score}分
                          </span>
                        )}
                        <div className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          {new Date(item.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                <i className="fas fa-history text-4xl mb-3 opacity-30"></i>
                <p>暂无历史记录</p>
                <p className="text-xs mt-1 opacity-60">
                  {user?.id ? '登录后生成的作品会自动保存到云端' : '登录后可同步历史记录到云端'}
                </p>
              </div>
            )
          ) : (
            drafts.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {drafts.map((draft) => {
                  const firstResult = draft.generatedResults?.[0];
                  const isVideo = firstResult?.type === 'video' || firstResult?.video;
                  
                  return (
                    <button
                      key={draft.id}
                      className="relative aspect-square rounded-xl overflow-hidden group border border-transparent hover:border-blue-500 transition-all bg-gray-100 dark:bg-gray-800"
                    >
                      {firstResult ? (
                        isVideo ? (
                          <>
                            <video 
                              src={firstResult.video || firstResult.thumbnail}
                              className="w-full h-full object-cover"
                              preload="metadata"
                              muted
                              playsInline
                              onMouseEnter={(e) => (e.target as HTMLVideoElement).play()}
                              onMouseLeave={(e) => (e.target as HTMLVideoElement).pause()}
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                              <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                                <i className="fas fa-play text-[#C02C38] text-sm ml-0.5"></i>
                              </div>
                            </div>
                            <div className="absolute bottom-1 right-1 pointer-events-none">
                              <span className="text-[8px] px-1.5 py-0.5 rounded bg-black/60 text-white">
                                <i className="fas fa-video"></i>
                              </span>
                            </div>
                          </>
                        ) : (
                          <img 
                            src={firstResult.thumbnail || 'https://via.placeholder.com/150?text=No+Image'} 
                            alt="" 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=No+Image';
                            }}
                          />
                        )
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                          <i className="fas fa-image text-3xl mb-2"></i>
                          <span className="text-xs">无预览</span>
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                        <h3 className="text-white text-xs font-medium truncate">{draft.name || '未命名'}</h3>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                <i className="fas fa-archive text-4xl mb-3 opacity-30"></i>
                <p>草稿箱空空如也</p>
              </div>
            )
          )}
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}
