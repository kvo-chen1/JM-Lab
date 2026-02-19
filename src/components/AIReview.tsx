import { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';
import LazyImage from './LazyImage';
import { llmService } from '../services/llmService';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { workService } from '../services/apiService';
import { aiReviewService } from '../services/aiReviewService';
import { AuthContext } from '../contexts/authContext';
import { eventService } from '../services/eventService';

// Review result type definition
interface AIReviewResult {
  overallScore: number;
  culturalFit: {
    score: number;
    details: string[];
  };
  creativity: {
    score: number;
    details: string[];
  };
  aesthetics: {
    score: number;
    details: string[];
  };
  suggestions: string[];
  highlights: string[];
  recommendedCommercialPaths: Array<{
    title: string;
    description: string;
    icon: string;
  }>;
  relatedActivities: Array<{
    title: string;
    deadline: string;
    reward: string;
    image?: string;
  }>;
  similarWorks?: Array<{
    id: string;
    thumbnail: string;
    title: string;
  }>;
  commercialPotential?: {
    score: number;
    analysis: string[];
  };
}

interface AIReviewProps {
  workId: string;
  prompt: string;
  aiExplanation: string;
  selectedResult: number | null;
  generatedResults: Array<{ id: number; thumbnail: string; score: number; video?: string; type?: 'image' | 'video' }>;
  onClose: () => void;
}

const AIReview: React.FC<AIReviewProps> = ({ workId, prompt, aiExplanation, selectedResult, generatedResults, onClose }) => {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [reviewResult, setReviewResult] = useState<AIReviewResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMoreSuggestions, setShowMoreSuggestions] = useState(false);
  const [currentTab, setCurrentTab] = useState<'overall' | 'detail' | 'commercial'>('overall');
  const [loadingWorks, setLoadingWorks] = useState(false);
  const [similarWorks, setSimilarWorks] = useState<Array<{id: string; thumbnail: string; title: string; type?: string; video?: string}>>([]);
  const [isSaving, setIsSaving] = useState(false);
  
  // 加载相似作品数据
  useEffect(() => {
    if (reviewResult?.similarWorks && reviewResult.similarWorks.length > 0) {
      // 直接使用API返回的相似作品信息
      setSimilarWorks(reviewResult.similarWorks);
    }
  }, [reviewResult]);
  
  // 处理作品点击
  const handleWorkClick = (workId: string) => {
    try {
      setLoadingWorks(true);
      // 跳转到作品详情页面
      navigate(`/post/${workId}`);
    } catch (error) {
      console.error('Failed to navigate to work detail:', error);
      toast.error('跳转到作品详情失败，请稍后重试');
    } finally {
      setLoadingWorks(false);
    }
  };
  
  // Generate AI review based on actual creation data
  useEffect(() => {
    setIsLoading(true);
    setError(null);

    const generateReview = async () => {
      try {
        // Prepare creation description based on actual data
        const creationDescription = aiExplanation || prompt || 'This is a design work created on our platform';

        // 从数据库获取真实活动数据
        const [reviewData, eventsData, worksData] = await Promise.all([
          llmService.generateWorkReview(prompt || 'General Design', creationDescription),
          eventService.getPublishedEvents(),
          workService.getWorks().catch(() => []) // 如果获取作品失败，返回空数组
        ]);

        // 将真实活动数据转换为 relatedActivities 格式
        const relatedActivities = eventsData.slice(0, 2).map(event => ({
          title: event.title,
          deadline: event.endDate 
            ? new Date(event.endDate).toLocaleDateString('zh-CN')
            : '长期有效',
          reward: event.rewards || '参与活动获得奖励',
          image: event.imageUrl
        }));

        // 随机选择3个作品作为相似作品
        const randomWorks = [...worksData].sort(() => 0.5 - Math.random()).slice(0, 3);

        const finalReviewResult = {
          ...reviewData,
          relatedActivities, // 使用真实活动数据
          similarWorks: randomWorks.map(work => ({
            id: work.id,
            thumbnail: work.thumbnail || work.thumbnailUrl || '/placeholder-image.jpg',
            title: work.title,
            type: work.type,
            video: work.fileUrl || work.video
          }))
        };

        setReviewResult(finalReviewResult);

        // 保存AI点评记录到数据库
        if (user?.id) {
          setIsSaving(true);
          try {
            const selectedWork = generatedResults.find(r => r.id === selectedResult);
            const workThumbnail = selectedWork?.thumbnail || '';

            await aiReviewService.saveAIReview(user.id, {
              workId,
              prompt: prompt || 'General Design',
              aiExplanation: creationDescription,
              reviewResult: finalReviewResult,
              workThumbnail
            });

            console.log('AI点评记录已保存');
          } catch (saveError) {
            console.error('保存AI点评记录失败:', saveError);
          } finally {
            setIsSaving(false);
          }
        }
      } catch (error) {
        console.error('Failed to generate review:', error);
        setError('生成AI点评失败，请稍后重试。');
      } finally {
        setIsLoading(false);
      }
    };

    generateReview();
  }, [workId, prompt, aiExplanation, selectedResult, generatedResults, t, user?.id]);
  
  const handleApplySuggestion = (suggestion: string) => {
    toast.success(t('review.applySuggestionSuccess'));
  };
  
  const applyAllSuggestions = () => {
    // Apply all suggestions logic
    // In a real implementation, this would apply each suggestion to the creation
    toast.success(t('review.applyAllSuggestionsSuccess'));
  };
  
  const handleApplyCommercialAdvice = () => {
    toast.success(t('review.applyCommercialAdviceSuccess'));
  };
  
  const COLORS = ['#f87171', '#60a5fa', '#34d399'];
  
  // Get rating based on score
  const getRating = (score: number) => {
    if (score >= 90) return { text: t('review.excellent'), color: 'text-green-500' };
    if (score >= 80) return { text: t('review.good'), color: 'text-blue-500' };
    if (score >= 70) return { text: t('review.average'), color: 'text-yellow-500' };
    if (score >= 60) return { text: t('review.pass'), color: 'text-orange-500' };
    return { text: t('review.needImprovement'), color: 'text-red-500' };
  };
  
  if (isLoading) {
    return (
      <div className={`fixed inset-0 z-[70] flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <motion.div 
          className={`p-8 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-xl max-w-md w-full mx-4`}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600 mb-4"></div>
            <p className="text-lg font-medium mb-2">{t('review.loading')}</p>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {t('review.analyzing')}
            </p>
          </div>
        </motion.div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={`fixed inset-0 z-[70] flex items-center justify-center ${isDark ? 'bg-gray-900 bg-opacity-80' : 'bg-gray-50 bg-opacity-80'} backdrop-blur-sm`}>
        <motion.div 
          className={`p-8 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-xl max-w-md w-full mx-4`}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center">
            <div className="inline-block mb-4 text-red-500">
              <i className="fas fa-exclamation-circle text-4xl"></i>
            </div>
            <p className="text-lg font-medium mb-2">{t('review.generationFailed')}</p>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-6`}>
              {error}
            </p>
            <div className="flex justify-center gap-4">
              <button 
                onClick={() => {
                  setIsLoading(true);
                  setError(null);
                  // 重新调用真实API生成点评
                  const generateReview = async () => {
                    try {
                      const creationDescription = aiExplanation || prompt || 'This is a design work created on our platform';
                      const reviewData = await llmService.generateWorkReview(prompt || 'General Design', creationDescription);
                      
                      // 从API获取作品数据，随机选择3个作品作为相似作品
                      try {
                        const worksData = await workService.getWorks();
                        const randomWorks = [...worksData].sort(() => 0.5 - Math.random()).slice(0, 3);
                        
                        setReviewResult({
                            ...reviewData,
                            similarWorks: randomWorks.map(work => ({
                              id: work.id,
                              thumbnail: work.thumbnail || work.thumbnailUrl || '/placeholder-image.jpg',
                              title: work.title,
                              type: work.type,
                              video: work.fileUrl || work.video
                            }))
                          });
                      } catch (worksError) {
                        console.error('获取相似作品失败:', worksError);
                        setReviewResult({
                          ...reviewData,
                          similarWorks: []
                        });
                      }
                    } catch (apiError) {
                      console.error('AI点评生成失败:', apiError);
                      setError('AI点评服务暂时不可用，请稍后重试');
                    } finally {
                      setIsLoading(false);
                    }
                  };
                  
                  generateReview();
                }}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
              >
                {t('review.retry')}
              </button>
              <button 
                onClick={onClose}
                className={`px-4 py-2 rounded-lg ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
              >
                {t('review.close')}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }
  
  if (!reviewResult) {
    return null;
  }
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className={`fixed inset-0 z-[70] flex items-center justify-center ${isDark ? 'bg-gray-900 bg-opacity-80' : 'bg-gray-50 bg-opacity-80'} backdrop-blur-sm`}
    >
      <motion.div 
        className={`rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto mx-4`}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* 点评头部 */}
        <div className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex justify-between items-center`}>
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold">{t('review.aiReview')}</h3>
            {isSaving && (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <i className="fas fa-spinner fa-spin"></i>
                保存中...
              </span>
            )}
          </div>
          <button 
            onClick={onClose}
            className={`p-2 rounded-full ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
            aria-label={t('common.close')}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        {/* 点评标签页 */}
        <div className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex">
            {[
              { id: 'overall', name: t('review.overallRating') },
              { id: 'detail', name: t('review.detailedReview') },
              { id: 'commercial', name: t('review.commercialAdvice') }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id as any)}
                className={`px-6 py-3 transition-colors font-medium text-sm ${
                  currentTab === tab.id 
                    ? 'text-red-600 border-b-2 border-red-600' 
                    : isDark 
                      ? 'text-gray-400 hover:text-white' 
                      : 'text-gray-600 hover:text-black'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>
        </div>
        
        {/* 点评内容 */}
        <div className="p-6">
          {/* 总体评分标签页 */}
          {currentTab === 'overall' && (
            <div>
              <div className="flex flex-col md:flex-row items-center mb-8">
                <div className="flex-shrink-0 mb-6 md:mb-0 md:mr-8">
                  <div className="relative w-32 h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[{ value: reviewResult.overallScore }, { value: 100 - reviewResult.overallScore }]}
                          cx="50%"
                          cy="50%"
                          innerRadius={30}
                          outerRadius={50}
                          startAngle={90}
                          endAngle={-270}
                          paddingAngle={0}
                          dataKey="value"
                        >
                          <Cell fill="#f87171" />
                          <Cell fill={isDark ? '#374151' : '#e5e7eb'} />
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                      <span className="text-3xl font-bold">{reviewResult.overallScore}</span>
                      <span className="text-sm opacity-70">{t('review.totalScore')}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { 
                        title: t('review.culturalFit'), 
                        score: reviewResult.culturalFit.score, 
                        color: 'text-green-500' 
                      },
                      { 
                        title: t('review.creativity'), 
                        score: reviewResult.creativity.score, 
                        color: 'text-blue-500' 
                      },
                      { 
                        title: t('review.aesthetics'), 
                        score: reviewResult.aesthetics.score, 
                        color: 'text-purple-500' 
                      }
                    ].map((item, index) => {
                      const rating = getRating(item.score);
                       
                      return (
                        <div key={index} className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                          <p className="text-sm mb-1">{item.title}</p>
                          <div className="flex items-end">
                            <span className="text-2xl font-bold mr-2">{item.score}</span>
                            <span className={`text-sm ${rating.color}`}>{rating.text}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              
              {/* 亮点总结 */}
              <div className={`p-5 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'} mb-8`}>
                <h4 className="font-medium mb-3">{t('review.workHighlights')}</h4>
                <ul className="space-y-2">
                  {reviewResult.highlights && reviewResult.highlights.length > 0 ? (
                    reviewResult.highlights.map((highlight, index) => (
                      <li key={index} className="flex items-start">
                        <i className="fas fa-star text-yellow-500 mt-1 mr-2 flex-shrink-0"></i>
                        <span className="text-sm">{highlight}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-gray-500 italic">
                      暂无亮点数据
                    </li>
                  )}
                </ul>
              </div>
              
              {/* Recommended Reference Works */}
              <div>
                <h4 className="text-lg font-medium mb-4 flex items-center">
                  <i className="fas fa-lightbulb text-yellow-500 mr-2"></i>
                  {t('review.recommendedWorks')}
                </h4>
                
                {similarWorks.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                    {similarWorks.map((work) => (
                      <motion.div
                        key={work.id}
                        className={`${isDark ? 'bg-gray-700 hover:bg-gray-650 cursor-pointer' : 'bg-gray-50 hover:bg-gray-100 cursor-pointer'} rounded-xl overflow-hidden shadow-sm transition-all duration-300 hover:shadow-lg border ${isDark ? 'border-gray-600' : 'border-gray-200'} relative`}
                        whileHover={{ y: -5, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        onClick={() => handleWorkClick(work.id)}
                      >
                        {/* 加载遮罩 */}
                        {loadingWorks && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10 rounded-xl">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                          </div>
                        )}
                        
                        <div className="relative overflow-hidden group">
                          {work.type === 'video' || work.video ? (
                            <div className="relative w-full h-32">
                              <video
                                src={work.video}
                                poster={work.thumbnail}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                preload="metadata"
                                muted
                              />
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center">
                                  <i className="fas fa-play text-white text-sm"></i>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <LazyImage
                              src={work.thumbnail}
                              alt={work.title}
                              className="w-full h-32 object-cover transition-transform duration-500 group-hover:scale-110"
                              ratio="landscape"
                              fit="cover"
                            />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                            <div className="p-2 w-full">
                              <button
                                className="w-full bg-white/90 text-gray-900 text-xs font-medium py-1 px-2 rounded-full hover:bg-white transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleWorkClick(work.id);
                                }}
                              >
                                查看详情
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="p-3">
                          <p className="text-sm font-medium text-center line-clamp-1 transition-colors group-hover:text-red-600">{work.title}</p>
                          <div className="flex justify-center mt-2 space-x-2">
                            <button 
                              className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                toast.success(`已收藏作品: ${work.title}`);
                              }}
                            >
                              <i className="far fa-heart"></i>
                            </button>
                            <button 
                              className="text-xs text-gray-400 hover:text-blue-500 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                toast.success(`已分享作品: ${work.title}`);
                              }}
                            >
                              <i className="far fa-share-square"></i>
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className={`p-6 rounded-xl text-center ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <i className="fas fa-images text-4xl text-gray-400 mb-3"></i>
                    <p className="text-sm text-gray-500">暂无推荐参考作品</p>
                    <button 
                      className="mt-3 text-sm text-red-600 hover:text-red-700 transition-colors"
                      onClick={async () => {
                        // 重新生成推荐作品
                        try {
                          const worksData = await workService.getWorks();
                          const randomWorks = [...worksData].sort(() => 0.5 - Math.random()).slice(0, 3);
                          setSimilarWorks(randomWorks.map(work => ({
                            id: work.id,
                            thumbnail: work.thumbnail || work.thumbnailUrl || '/placeholder-image.jpg',
                            title: work.title,
                            type: work.type,
                            video: work.fileUrl || work.video
                          })));
                        } catch (error) {
                          console.error('刷新推荐作品失败:', error);
                          toast.error('刷新推荐作品失败，请稍后重试');
                        }
                      }}
                    >
                      刷新推荐
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* 详细点评标签页 */}
          {currentTab === 'detail' && (
            <div className="space-y-6">
              {/* 文化契合度 */}
              <div className={`p-5 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="flex justify-between items-center mb-3">
                  <h5 className="font-medium">文化契合度</h5>
                  <div className={`text-sm ${getRating(reviewResult.culturalFit.score).color}`}>
                    {getRating(reviewResult.culturalFit.score).text}
                  </div>
                </div>
                
                <ul className="space-y-2">
                  {reviewResult.culturalFit.details.map((detail, index) => (
                    <li key={index} className="flex items-start">
                      <i className="fas fa-check-circle text-green-500 mt-1 mr-2 flex-shrink-0"></i>
                      <span className="text-sm">{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* 创意性 */}
              <div className={`p-5 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="flex justify-between items-center mb-3">
                  <h5 className="font-medium">创意性</h5>
                  <div className={`text-sm ${getRating(reviewResult.creativity.score).color}`}>
                    {getRating(reviewResult.creativity.score).text}
                  </div>
                </div>
                
                <ul className="space-y-2">
                  {reviewResult.creativity.details.map((detail, index) => (
                    <li key={index} className="flex items-start">
                      <i className="fas fa-check-circle text-green-500 mt-1 mr-2 flex-shrink-0"></i>
                      <span className="text-sm">{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* 美学表现 */}
              <div className={`p-5 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="flex justify-between items-center mb-3">
                  <h5 className="font-medium">美学表现</h5>
                  <div className={`text-sm ${getRating(reviewResult.aesthetics.score).color}`}>
                    {getRating(reviewResult.aesthetics.score).text}
                  </div>
                </div>
                
                <ul className="space-y-2">
                  {reviewResult.aesthetics.details.map((detail, index) => (
                    <li key={index} className="flex items-start">
                      <i className="fas fa-check-circle text-green-500 mt-1 mr-2 flex-shrink-0"></i>
                      <span className="text-sm">{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Improvement Suggestions */}
              <div className={`p-5 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <h5 className="font-medium mb-3">{t('review.improvementSuggestions')}</h5>
                <ul className="space-y-3">
                  {(showMoreSuggestions ? reviewResult.suggestions : reviewResult.suggestions.slice(0, 2)).map((suggestion, index) => (
                    <li key={index} className="flex items-start">
                      <i className="fas fa-lightbulb text-yellow-500 mt-1 mr-2 flex-shrink-0"></i>
                      <div className="flex-1">
                        <span className="text-sm">{suggestion}</span>
                        <button 
                          onClick={() => handleApplySuggestion(suggestion)}
                          className="ml-2 text-xs text-red-600 hover:text-red-700"
                        >
                          {t('review.applySuggestion')}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
                
                {reviewResult.suggestions.length > 2 && (
                  <button 
                    onClick={() => setShowMoreSuggestions(!showMoreSuggestions)}
                    className="mt-3 text-sm text-red-600 hover:text-red-700 flex items-center"
                  >
                    {showMoreSuggestions ? t('review.collapse') : t('review.viewMoreSuggestions')}<i className={`fas fa-chevron-${showMoreSuggestions ? 'up' : 'down'} ml-1`}></i>
                  </button>
                )}
              </div>
            </div>
          )}
          
          {/* 商业化建议标签页 */}
          {currentTab === 'commercial' && reviewResult.commercialPotential && (
            <div>
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-4">
                  <i className="fas fa-chart-line text-2xl"></i>
                </div>
                <div>
                  <h4 className="text-lg font-bold mb-1">{t('review.commercialPotential')}</h4>
                  <div className="flex items-center">
                    <span className="text-2xl font-bold mr-2">{reviewResult.commercialPotential.score}</span>
                    <span className={`${getRating(reviewResult.commercialPotential.score).color} text-sm`}>
                      {getRating(reviewResult.commercialPotential.score).text}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Commercial Analysis */}
              <div className={`p-5 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'} mb-6`}>
                <h5 className="font-medium mb-3">{t('review.commercialAnalysis')}</h5>
                <ul className="space-y-2">
                  {reviewResult.commercialPotential.analysis.map((item, index) => (
                    <li key={index} className="flex items-start">
                      <i className="fas fa-bullseye text-blue-500 mt-1 mr-2 flex-shrink-0"></i>
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* 推荐的商业化路径 */}
              <div className={`p-5 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'} mb-6`}>
                <h5 className="font-medium mb-3">{t('review.recommendedCommercialPaths')}</h5>
                <div className="space-y-3">
                  {reviewResult.recommendedCommercialPaths && reviewResult.recommendedCommercialPaths.length > 0 ? (
                    reviewResult.recommendedCommercialPaths.map((path, index) => (
                      <div key={index} className="flex items-start p-3 rounded-lg bg-white bg-opacity-10">
                        <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mr-3 flex-shrink-0">
                          <i className={`fas fa-${path.icon}`}></i>
                        </div>
                        <div>
                          <h6 className="font-medium">{path.title}</h6>
                          <p className="text-xs opacity-80">{path.description}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 italic">暂无商业化路径推荐</p>
                  )}
                </div>
              </div>
              
              {/* Recommended Related Activities */}
              <div className="mb-6">
                <h5 className="font-medium mb-3">{t('review.relatedActivities')}</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reviewResult.relatedActivities && reviewResult.relatedActivities.length > 0 ? (
                    reviewResult.relatedActivities.map((activity, index) => (
                      <div key={index} className={`rounded-lg overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <div className="flex">
                          <LazyImage 
                            src={activity.image || `https://source.unsplash.com/random/200x200?sig=${index}`} 
                            alt={activity.title} 
                            className="w-24 h-24 object-cover"
                            ratio="square"
                            fit="cover"
                          />
                          <div className="p-3 flex-1">
                            <h6 className="font-medium mb-1">{activity.title}</h6>
                            <div className="text-xs opacity-80 mb-1">
                              {activity.deadline}
                            </div>
                            <div className="text-xs font-medium text-red-600">
                              {activity.reward}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 italic col-span-2">暂无相关活动推荐</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* 点评底部 */}
        <div className={`p-6 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} flex justify-end space-x-3`}>
          {currentTab === 'commercial' && reviewResult.commercialPotential && (
            <button 
              onClick={handleApplyCommercialAdvice}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            >
              {t('review.applyCommercialAdvice')}
            </button>
          )}
          
          {currentTab === 'detail' && (
            <button 
              onClick={applyAllSuggestions}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
            >
              {t('review.applyAllSuggestions')}
            </button>
          )}
          
          <button 
            onClick={onClose}
            className={`px-4 py-2 rounded-lg ${
              isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
            } transition-colors`}
          >
            {t('review.close')}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AIReview;
