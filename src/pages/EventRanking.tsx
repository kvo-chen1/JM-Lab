import { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { AuthContext } from '@/contexts/authContext';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import {
  Trophy,
  Medal,
  Award,
  Crown,
  Star,
  User,
  Calendar,
  Users,
  Target,
  TrendingUp,
  Share2,
  ArrowLeft
} from 'lucide-react';

// 排名数据接口
interface RankingItem {
  submission_id: string;
  rank: number;
  title: string;
  creator_id: string;
  creator_name: string;
  creator_avatar?: string;
  avg_score: number;
  score_count: number;
  judge_count: number;
  submitted_at: string;
}

// 活动信息接口
interface EventInfo {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  type: string;
  location?: string;
  participants_count: number;
}

export default function EventRanking() {
  const { isDark } = useTheme();
  const { isAuthenticated, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const { eventId } = useParams<{ eventId: string }>();

  const [rankingData, setRankingData] = useState<RankingItem[]>([]);
  const [eventInfo, setEventInfo] = useState<EventInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserRank, setCurrentUserRank] = useState<RankingItem | null>(null);

  // 处理返回按钮 - 返回到之前的页面
  const handleGoBack = () => {
    // 如果有历史记录，返回上一页
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      // 如果没有历史记录，默认返回到活动列表
      navigate('/activities');
    }
  };

  // 检查登录状态并加载数据
  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/login');
      return;
    }

    if (!eventId) {
      toast.error('活动ID不存在');
      navigate('/activities');
      return;
    }

    loadRankingData();
  }, [isAuthenticated, user, navigate, eventId]);

  // 加载排名数据
  const loadRankingData = async () => {
    if (!eventId) return;

    setIsLoading(true);
    try {
      // 并行加载排名数据和活动信息
      const [rankingResult, eventResult] = await Promise.all([
        supabase.rpc('get_final_ranking', {
          p_event_id: eventId
        }),
        supabase
          .from('events')
          .select('id, title, description, start_time, end_time, type, location, participants_count')
          .eq('id', eventId)
          .single()
      ]);

      if (rankingResult.error) {
        console.error('RPC Error:', rankingResult.error);
        if (rankingResult.error.message?.includes('Could not find the function')) {
          toast.error('数据库函数未找到，请确保已在 Supabase 控制台执行 SQL 迁移文件');
          return;
        }
        throw rankingResult.error;
      }

      if (rankingResult.data?.success) {
        const data = rankingResult.data.ranking_data as RankingItem[];
        setRankingData(data);

        // 查找当前用户的排名
        const userRank = data.find((item) => item.creator_id === user?.id);
        setCurrentUserRank(userRank || null);
      } else {
        toast.error(rankingResult.data?.error || '最终排名尚未发布');
        navigate('/activities');
        return;
      }

      if (eventResult.data) {
        setEventInfo(eventResult.data);
      }
    } catch (error: any) {
      console.error('加载排名数据失败:', error);
      toast.error(error.message || '加载排名数据失败');
      navigate('/activities');
    } finally {
      setIsLoading(false);
    }
  };

  // 获取排名图标
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6" />;
      case 2:
        return <Medal className="w-6 h-6" />;
      case 3:
        return <Award className="w-6 h-6" />;
      default:
        return null;
    }
  };

  // 获取排名样式
  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white shadow-lg shadow-yellow-500/30';
      case 2:
        return 'bg-gradient-to-r from-gray-300 to-gray-400 text-white shadow-lg shadow-gray-400/30';
      case 3:
        return 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-orange-500/30';
      default:
        return isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600';
    }
  };

  // 获取排名卡片样式
  const getRankCardStyle = (rank: number, isCurrentUser: boolean) => {
    if (isCurrentUser) {
      return isDark
        ? 'bg-red-500/10 border-2 border-red-500/50 shadow-lg shadow-red-500/20'
        : 'bg-red-50 border-2 border-red-300 shadow-lg shadow-red-200/50';
    }
    if (rank <= 3) {
      return isDark
        ? 'bg-yellow-500/10 border border-yellow-500/30'
        : 'bg-yellow-50 border border-yellow-200';
    }
    return isDark ? 'bg-gray-800/50 border border-gray-700' : 'bg-white border border-gray-200';
  };

  // 格式化分数
  const formatScore = (score: number) => score.toFixed(1);

  // 计算统计数据
  const stats = {
    totalParticipants: rankingData.length,
    avgScore: rankingData.length > 0
      ? rankingData.reduce((sum, item) => sum + item.avg_score, 0) / rankingData.length
      : 0,
    maxScore: rankingData.length > 0 ? Math.max(...rankingData.map(item => item.avg_score)) : 0,
    topScoreGap: rankingData.length >= 2 ? rankingData[0].avg_score - rankingData[1].avg_score : 0
  };

  // 分享排名
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${eventInfo?.title} - 最终排名`,
        text: `查看${eventInfo?.title}的最终排名结果`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('链接已复制到剪贴板');
    }
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 头部骨架 */}
          <div className="animate-pulse mb-8">
            <div className={`h-8 w-32 rounded mb-4 ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`} />
            <div className={`h-12 w-96 rounded ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`} />
          </div>
          {/* 统计卡片骨架 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={`h-32 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'}`} />
            ))}
          </div>
          {/* 排名列表骨架 */}
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className={`h-24 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'}`} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* 移动端顶部导航 */}
      <div className="md:hidden sticky top-0 z-50 px-4 py-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={handleGoBack}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-300"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">返回</span>
        </motion.button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        {/* PC端返回按钮 */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={handleGoBack}
          className="hidden md:flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          返回
        </motion.button>

        {/* 页面标题 - 移动端紧凑 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 md:mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg shadow-yellow-500/30">
              <Trophy className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <h1 className={`text-xl md:text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                最终排名
              </h1>
              <p className={`text-sm md:text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {eventInfo?.title}
              </p>
            </div>
          </div>
        </motion.div>

        {/* 活动信息卡片 - 移动端简化 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`rounded-xl md:rounded-2xl p-4 md:p-6 mb-4 md:mb-8 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border shadow-sm`}
        >
          <div className="flex flex-wrap items-center gap-3 md:gap-6 text-xs md:text-sm">
            <div className="flex items-center gap-1.5 md:gap-2">
              <Calendar className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
              <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>
                {eventInfo?.start_time && new Date(eventInfo.start_time).toLocaleDateString('zh-CN')}
              </span>
            </div>
            <div className="flex items-center gap-1.5 md:gap-2">
              <Users className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
              <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>
                {eventInfo?.participants_count || 0} 人参与
              </span>
            </div>
            <div className="flex items-center gap-1.5 md:gap-2">
              <Trophy className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
              <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>
                {rankingData.length} 个作品排名
              </span>
            </div>
            <div className="flex-1" />
            <button
              onClick={handleShare}
              className={`flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm transition-colors ${
                isDark
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
              }`}
            >
              <Share2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="hidden md:inline">分享排名</span>
              <span className="md:hidden">分享</span>
            </button>
          </div>
        </motion.div>

        {/* 当前用户排名提示 - 移动端紧凑 */}
        {currentUserRank && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
            className={`rounded-xl md:rounded-2xl p-4 md:p-6 mb-4 md:mb-8 ${
              isDark
                ? 'bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/30'
                : 'bg-gradient-to-r from-red-50 to-pink-50 border border-red-200'
            }`}
          >
            <div className="flex items-center gap-3 md:gap-4">
              <div className={`w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex items-center justify-center text-lg md:text-2xl font-bold ${getRankStyle(currentUserRank.rank)}`}>
                {getRankIcon(currentUserRank.rank) || currentUserRank.rank}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs md:text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  您的排名
                </p>
                <h3 className={`text-lg md:text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  第 {currentUserRank.rank} 名
                </h3>
                <p className={`text-xs md:text-sm truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {currentUserRank.title}
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 justify-end">
                  <Star className="w-4 h-4 md:w-5 md:h-5 text-yellow-500 fill-yellow-500" />
                  <span className={`text-xl md:text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {formatScore(currentUserRank.avg_score)}
                  </span>
                </div>
                <p className={`text-xs md:text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {currentUserRank.judge_count} 人评分
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* 统计概览 - 响应式2x2网格 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-8"
        >
          <div className={`p-4 md:p-6 rounded-xl md:rounded-2xl ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border shadow-sm`}>
            <div className="flex items-center gap-1.5 md:gap-2 mb-1.5 md:mb-2">
              <Target className="w-4 h-4 md:w-5 md:h-5 text-blue-500" />
              <span className={`text-xs md:text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>平均分</span>
            </div>
            <div className={`text-xl md:text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {formatScore(stats.avgScore)}
            </div>
          </div>

          <div className={`p-4 md:p-6 rounded-xl md:rounded-2xl ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border shadow-sm`}>
            <div className="flex items-center gap-1.5 md:gap-2 mb-1.5 md:mb-2">
              <Trophy className="w-4 h-4 md:w-5 md:h-5 text-yellow-500" />
              <span className={`text-xs md:text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>最高分</span>
            </div>
            <div className={`text-xl md:text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {formatScore(stats.maxScore)}
            </div>
          </div>

          <div className={`p-4 md:p-6 rounded-xl md:rounded-2xl ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border shadow-sm`}>
            <div className="flex items-center gap-1.5 md:gap-2 mb-1.5 md:mb-2">
              <Users className="w-4 h-4 md:w-5 md:h-5 text-purple-500" />
              <span className={`text-xs md:text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>参与作品</span>
            </div>
            <div className={`text-xl md:text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {stats.totalParticipants}
            </div>
          </div>

          <div className={`p-4 md:p-6 rounded-xl md:rounded-2xl ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border shadow-sm`}>
            <div className="flex items-center gap-1.5 md:gap-2 mb-1.5 md:mb-2">
              <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-emerald-500" />
              <span className={`text-xs md:text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>冠亚军分差</span>
            </div>
            <div className={`text-xl md:text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {formatScore(stats.topScoreGap)}
            </div>
          </div>
        </motion.div>

        {/* TOP 3 展示 */}
        {rankingData.length >= 3 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mb-8"
          >
            <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              🏆 前三名
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 第二名 */}
              {rankingData[1] && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border shadow-sm`}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-r from-gray-300 to-gray-400 flex items-center justify-center mb-4 shadow-lg">
                      <Medal className="w-10 h-10 text-white" />
                    </div>
                    <div className="text-3xl font-bold text-gray-400 mb-2">2</div>
                    {rankingData[1].creator_avatar ? (
                      <img
                        src={rankingData[1].creator_avatar}
                        alt={rankingData[1].creator_name}
                        className="w-16 h-16 rounded-full object-cover mb-3 border-4 border-gray-200 dark:border-gray-700"
                      />
                    ) : (
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 border-4 ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-200 border-gray-100'}`}>
                        <User className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    <h3 className={`font-bold text-lg mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {rankingData[1].creator_name}
                    </h3>
                    <p className={`text-sm mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {rankingData[1].title}
                    </p>
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                      <span className="text-2xl font-bold text-yellow-500">
                        {formatScore(rankingData[1].avg_score)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* 第一名 */}
              {rankingData[0] && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className={`p-6 rounded-2xl ${isDark ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-yellow-50 border-yellow-200'} border shadow-lg transform md:-translate-y-4`}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 flex items-center justify-center mb-4 shadow-lg shadow-yellow-500/30">
                      <Crown className="w-12 h-12 text-white" />
                    </div>
                    <div className="text-4xl font-bold text-yellow-500 mb-2">1</div>
                    {rankingData[0].creator_avatar ? (
                      <img
                        src={rankingData[0].creator_avatar}
                        alt={rankingData[0].creator_name}
                        className="w-20 h-20 rounded-full object-cover mb-3 border-4 border-yellow-400 shadow-lg"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full flex items-center justify-center mb-3 border-4 border-yellow-400 bg-yellow-100">
                        <User className="w-10 h-10 text-yellow-600" />
                      </div>
                    )}
                    <h3 className={`font-bold text-xl mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {rankingData[0].creator_name}
                    </h3>
                    <p className={`text-sm mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {rankingData[0].title}
                    </p>
                    <div className="flex items-center gap-1">
                      <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                      <span className="text-3xl font-bold text-yellow-500">
                        {formatScore(rankingData[0].avg_score)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* 第三名 */}
              {rankingData[2] && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border shadow-sm`}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 flex items-center justify-center mb-4 shadow-lg">
                      <Award className="w-10 h-10 text-white" />
                    </div>
                    <div className="text-3xl font-bold text-amber-600 mb-2">3</div>
                    {rankingData[2].creator_avatar ? (
                      <img
                        src={rankingData[2].creator_avatar}
                        alt={rankingData[2].creator_name}
                        className="w-16 h-16 rounded-full object-cover mb-3 border-4 border-amber-200 dark:border-amber-900"
                      />
                    ) : (
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 border-4 ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-amber-100 border-amber-200'}`}>
                        <User className="w-8 h-8 text-amber-600" />
                      </div>
                    )}
                    <h3 className={`font-bold text-lg mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {rankingData[2].creator_name}
                    </h3>
                    <p className={`text-sm mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {rankingData[2].title}
                    </p>
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                      <span className="text-2xl font-bold text-yellow-500">
                        {formatScore(rankingData[2].avg_score)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {/* 完整排名列表 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            📊 完整排名
          </h2>
          <div className="space-y-3">
            {rankingData.map((item, index) => {
              const isCurrentUser = item.creator_id === user?.id;
              return (
                <motion.div
                  key={item.submission_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.03 }}
                  className={`flex items-center gap-4 p-4 rounded-2xl transition-all hover:shadow-md ${getRankCardStyle(item.rank, isCurrentUser)}`}
                >
                  {/* 排名 */}
                  <div
                    className={`w-14 h-14 rounded-xl flex items-center justify-center font-bold text-lg ${getRankStyle(item.rank)}`}
                  >
                    {getRankIcon(item.rank) || item.rank}
                  </div>

                  {/* 头像 */}
                  {item.creator_avatar ? (
                    <img
                      src={item.creator_avatar}
                      alt={item.creator_name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-gray-700 shadow-sm"
                    />
                  ) : (
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-700 shadow-sm ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>
                      <User className="w-6 h-6 text-gray-400" />
                    </div>
                  )}

                  {/* 信息 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className={`font-semibold text-lg truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {item.title}
                      </h4>
                      {isCurrentUser && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-500 text-white font-medium">
                          我的作品
                        </span>
                      )}
                    </div>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {item.creator_name}
                    </p>
                  </div>

                  {/* 分数 */}
                  <div className="text-right">
                    <div className="flex items-center gap-1 justify-end">
                      <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                      <span className={`font-bold text-xl ${item.rank <= 3 ? 'text-yellow-500' : isDark ? 'text-white' : 'text-gray-900'}`}>
                        {formatScore(item.avg_score)}
                      </span>
                    </div>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {item.judge_count} 人评分
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* 底部提示 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className={`mt-12 text-center py-8 rounded-2xl ${isDark ? 'bg-gray-800/50' : 'bg-gray-100'}`}
        >
          <Trophy className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-yellow-500/50' : 'text-yellow-400'}`} />
          <p className={`text-lg font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            恭喜所有获奖者！
          </p>
          <p className={`text-sm mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            感谢大家的参与和支持
          </p>
        </motion.div>
      </div>
    </div>
  );
}
