import React, { useState, useEffect, useCallback, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { AuthContext } from '@/contexts/authContext';
import { useSupabasePoints } from '@/hooks/useSupabasePoints';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import LuckyWheel from '@/components/prize/LuckyWheel';
import { 
  Coins, 
  Gift, 
  History, 
  Trophy, 
  Sparkles, 
  Info, 
  TrendingUp, 
  Clock,
  X,
  Medal
} from 'lucide-react';

interface WheelSegment {
  id: string;
  name: string;
  productName: string; // 商品名称
  points: number; // 商品价值（积分）
  probability: number;
  color: string;
  textColor: string;
  imageUrl?: string; // 商品图片
}

interface SpinRecord {
  id: string;
  segmentName: string;
  productName: string;
  points: number;
  date: string;
  cost: number;
}

const DEFAULT_SEGMENTS: WheelSegment[] = [
  { id: '1', name: '谢谢参与', productName: '谢谢参与', points: 0, probability: 0.15, color: '#EF4444', textColor: '#FFFFFF' },
  { id: '2', name: '虚拟红包', productName: '虚拟红包', points: 10, probability: 0.20, color: '#F97316', textColor: '#FFFFFF', imageUrl: '/images/红包.svg' },
  { id: '3', name: '创室贴纸包', productName: '创室贴纸包', points: 50, probability: 0.18, color: '#EAB308', textColor: '#FFFFFF', imageUrl: '/images/贴纸包.svg' },
  { id: '4', name: 'AI 创作工具包', productName: 'AI 创作工具包', points: 100, probability: 0.12, color: '#22C55E', textColor: '#FFFFFF', imageUrl: '/images/AI 工具包.svg' },
  { id: '5', name: '谢谢参与', productName: '谢谢参与', points: 0, probability: 0.15, color: '#3B82F6', textColor: '#FFFFFF' },
  { id: '6', name: '专属成就徽章', productName: '专属成就徽章', points: 500, probability: 0.05, color: '#A855F7', textColor: '#FFFFFF', imageUrl: '/images/徽章.svg' },
  { id: '7', name: '数字壁纸', productName: '数字壁纸', points: 20, probability: 0.12, color: '#EC4899', textColor: '#FFFFFF', imageUrl: '/images/数字壁纸.svg' },
  { id: '8', name: '￥10 红包', productName: '￥10 红包', points: 1000, probability: 0.03, color: '#DC2626', textColor: '#FFFFFF', imageUrl: '/images/红包.svg' },
];

const SPIN_COST = 50;

const PointsLottery: React.FC = () => {
  const { isDark } = useTheme();
  const { user } = useContext(AuthContext);
  const { balance, refreshBalance } = useSupabasePoints();
  const currentPoints = balance?.balance || 0;
  
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinRecords, setSpinRecords] = useState<SpinRecord[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('lottery_records');
    if (stored) {
      try {
        const records = JSON.parse(stored);
        setSpinRecords(records.slice(0, 50));
      } catch (e) {
        console.error('加载抽奖记录失败:', e);
      }
    }
  }, []);

  const saveRecord = useCallback((record: SpinRecord) => {
    const updated = [record, ...spinRecords].slice(0, 50);
    setSpinRecords(updated);
    localStorage.setItem('lottery_records', JSON.stringify(updated));
  }, [spinRecords]);

  const handleSpin = useCallback(async (segment: WheelSegment) => {
    if (!user) {
      toast.error('请先登录');
      setIsSpinning(false);
      return;
    }

    try {
      // 扣除积分
      const spendResult = await supabase.rpc('spend_points', {
        p_user_id: user.id,
        p_points: SPIN_COST,
        p_source: '大转盘抽奖',
        p_description: `抽奖消耗`,
      });

      if (spendResult.error) {
        throw new Error(spendResult.error.message || '扣除积分失败，积分可能不足');
      }

      // 如果中奖，创建兑换记录
      if (segment.points > 0 && segment.productName !== '谢谢参与') {
        // 插入兑换记录（状态为已完成）
        const { error: exchangeError } = await supabase
          .from('exchange_records')
          .insert({
            product_id: segment.id,
            product_name: segment.productName,
            product_category: 'virtual',
            points: segment.points,
            quantity: 1,
            user_id: user.id,
            status: 'completed',
            product_image: segment.imageUrl,
          });

        if (exchangeError) {
          console.error('创建兑换记录失败:', exchangeError);
        } else {
          // 兑换成功，给用户发送通知
          toast.success(
            <div className="flex flex-col gap-1">
              <div className="font-bold flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                恭喜获得 {segment.productName}！
              </div>
              <div className="text-sm">价值 {segment.points} 积分</div>
            </div>
          );
          return; // 成功则直接返回，不显示下面的通用成功提示
        }
      }

      // 保存记录
      saveRecord({
        id: `spin-${Date.now()}`,
        segmentName: segment.name,
        productName: segment.productName,
        points: segment.points,
        date: new Date().toISOString(),
        cost: SPIN_COST,
      });

      await refreshBalance();

      // 通用成功消息（没中奖时）
      if (segment.points === 0) {
        toast.info('很遗憾，谢谢参与！下次好运~');
      }
    } catch (error: any) {
      console.error('抽奖失败:', error);
      toast.error(error.message || '抽奖失败，请稍后重试');
    } finally {
      setIsSpinning(false);
    }
  }, [user, saveRecord, refreshBalance]);

  const startSpin = async (segment: WheelSegment) => {
    setIsSpinning(true);
  };

  const totalSpent = spinRecords.reduce((sum, record) => sum + record.cost, 0);
  const totalWon = spinRecords.reduce((sum, record) => sum + record.points, 0);
  const netProfit = totalWon - totalSpent;

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900 text-white' : 'bg-gradient-to-br from-purple-50 via-pink-50 to-red-50 text-gray-900'}`}>
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-yellow-500/5 to-red-500/5 rounded-full blur-3xl" />
      </div>

      <main className="relative container mx-auto px-4 py-8">
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 bg-clip-text text-transparent">
                🎡 幸运大转盘
              </h1>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                消耗积分参与抽奖，赢取丰厚奖励
              </p>
            </div>
            <div className="flex items-center gap-3">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className={`flex items-center gap-3 px-6 py-3 rounded-2xl ${
                  isDark ? 'bg-gray-800' : 'bg-white'
                } shadow-lg border-2 border-yellow-500/30`}
              >
                <div className="p-2 rounded-full bg-yellow-500/20">
                  <Coins className="w-6 h-6 text-yellow-500" />
                </div>
                <div>
                  <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>我的积分</div>
                  <div className="text-2xl font-bold text-yellow-500">{currentPoints}</div>
                </div>
              </motion.div>

              <button
                onClick={() => setShowHistoryModal(true)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all ${
                  isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'
                } shadow-lg`}
              >
                <History className="w-5 h-5" />
                <span className="hidden sm:inline">抽奖记录</span>
                {spinRecords.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs bg-red-500 text-white">
                    {spinRecords.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setShowRulesModal(true)}
                className={`p-3 rounded-xl transition-all ${
                  isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'
                } shadow-lg`}
              >
                <Info className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className={`${isDark ? 'bg-gray-800/50' : 'bg-white/70'} backdrop-blur-xl rounded-3xl p-8 shadow-2xl border ${isDark ? 'border-gray-700' : 'border-white/50'}`}
            >
              <div className="flex flex-col items-center">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
                    <Sparkles className="w-6 h-6 text-yellow-500" />
                    试试手气
                  </h2>
                  <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    每次抽奖消耗 <span className="text-red-500 font-bold">{SPIN_COST}</span> 积分
                  </p>
                </div>

                <div className="relative mb-8">
                  <LuckyWheel
                    segments={DEFAULT_SEGMENTS}
                    onSpin={startSpin}
                    currentPoints={currentPoints}
                    spinCost={SPIN_COST}
                    isSpinning={isSpinning}
                    disabled={!user}
                  />
                </div>

                {!user && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center p-4 bg-red-500/10 rounded-xl"
                  >
                    <p className="text-red-500 font-medium">请先登录后参与抽奖</p>
                  </motion.div>
                )}

                {currentPoints < SPIN_COST && user && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center p-4 bg-orange-500/10 rounded-xl"
                  >
                    <p className="text-orange-500 font-medium">积分不足，快去完成任务获取积分吧！</p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>

          <div className="space-y-6">
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className={`${isDark ? 'bg-gray-800/50' : 'bg-white/70'} backdrop-blur-xl rounded-3xl p-6 shadow-xl border ${isDark ? 'border-gray-700' : 'border-white/50'}`}
            >
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                抽奖统计
              </h3>
              
              <div className="space-y-4">
                <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                  <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>抽奖次数</div>
                  <div className="text-2xl font-bold">{spinRecords.length} 次</div>
                </div>
                
                <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                  <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>累计消耗</div>
                  <div className="text-2xl font-bold text-red-500">-{totalSpent} 积分</div>
                </div>
                
                <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                  <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>累计获得</div>
                  <div className="text-2xl font-bold text-green-500">+{totalWon} 积分</div>
                </div>
                
                <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                  <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>净收益</div>
                  <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {netProfit >= 0 ? '+' : ''}{netProfit} 积分
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className={`${isDark ? 'bg-gray-800/50' : 'bg-white/70'} backdrop-blur-xl rounded-3xl p-6 shadow-xl border ${isDark ? 'border-gray-700' : 'border-white/50'}`}
            >
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Medal className="w-5 h-5 text-yellow-500" />
                奖项设置
              </h3>
              
              <div className="space-y-3">
                {DEFAULT_SEGMENTS
                  .filter(s => s.points > 0)
                  .sort((a, b) => b.points - a.points)
                  .map((segment) => (
                    <div
                      key={segment.id}
                      className={`flex items-center justify-between p-3 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: segment.color }}
                        />
                        <div className="flex items-center gap-2">
                          {segment.imageUrl && (
                            <img 
                              src={segment.imageUrl} 
                              alt={segment.productName}
                              className="w-6 h-6 object-contain"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/images/placeholder-image.svg';
                              }}
                            />
                          )}
                          <div>
                            <div className="font-medium">{segment.productName}</div>
                            <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              概率 {(segment.probability * 100).toFixed(0)}%
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-lg font-bold text-yellow-500">
                        {segment.points} 积分
                      </div>
                    </div>
                  ))}
              </div>
            </motion.div>

            {spinRecords.length > 0 && (
              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className={`${isDark ? 'bg-gray-800/50' : 'bg-white/70'} backdrop-blur-xl rounded-3xl p-6 shadow-xl border ${isDark ? 'border-gray-700' : 'border-white/50'}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-500" />
                    最近记录
                  </h3>
                  <button
                    onClick={() => setShowHistoryModal(true)}
                    className="text-sm text-blue-500 hover:underline"
                  >
                    查看全部
                  </button>
                </div>
                
                <div className="space-y-2">
                  {spinRecords.slice(0, 5).map((record) => (
                    <div
                      key={record.id}
                      className={`flex items-center justify-between p-3 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}
                    >
                      <div>
                        <div className="font-medium">{record.productName}</div>
                        <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {new Date(record.date).toLocaleString('zh-CN')}
                        </div>
                      </div>
                      <div className={`font-bold ${record.points > 0 ? 'text-green-500' : 'text-gray-500'}`}>
                        {record.points > 0 ? `+${record.points}` : '-'}{record.cost}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </main>

      <AnimatePresence>
        {showHistoryModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowHistoryModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-3xl max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl`}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-500/20">
                    <History className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">抽奖记录</h2>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      共 {spinRecords.length} 条记录
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-auto p-4">
                {spinRecords.length === 0 ? (
                  <div className="text-center py-12">
                    <Gift className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
                    <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>暂无抽奖记录</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {spinRecords.map((record) => (
                      <div
                        key={record.id}
                        className={`flex items-center justify-between p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            record.points > 0 ? 'bg-green-500/20' : 'bg-gray-500/20'
                          }`}>
                            <Gift className={`w-5 h-5 ${record.points > 0 ? 'text-green-500' : 'text-gray-500'}`} />
                          </div>
                          <div>
                            <div className="font-medium">{record.productName}</div>
                            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              {new Date(record.date).toLocaleString('zh-CN')}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-bold ${record.points > 0 ? 'text-green-500' : 'text-gray-500'}`}>
                            价值 {record.points > 0 ? `${record.points}` : ''}积分
                          </div>
                          <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            消耗 {record.cost} 积分
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showRulesModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowRulesModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-3xl max-w-lg w-full shadow-2xl`}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-purple-500/20">
                    <Info className="w-6 h-6 text-purple-500" />
                  </div>
                  <h2 className="text-xl font-bold">抽奖规则</h2>
                </div>
                <button
                  onClick={() => setShowRulesModal(false)}
                  className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                  <h3 className="font-bold mb-2 flex items-center gap-2">
                    <Coins className="w-4 h-4 text-yellow-500" />
                    参与条件
                  </h3>
                  <ul className={`list-disc list-inside space-y-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    <li>需要登录账户才能参与抽奖</li>
                    <li>每次抽奖消耗 {SPIN_COST} 积分</li>
                    <li>账户积分不足时无法参与</li>
                  </ul>
                </div>

                <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                  <h3 className="font-bold mb-2 flex items-center gap-2">
                    <Gift className="w-4 h-4 text-green-500" />
                    奖项说明
                  </h3>
                  <ul className={`list-disc list-inside space-y-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    <li>￥10 红包：价值 1000 积分（3% 概率）</li>
                    <li>专属成就徽章：价值 500 积分（5% 概率）</li>
                    <li>AI 创作工具包：价值 100 积分（12% 概率）</li>
                    <li>创室贴纸包：价值 50 积分（18% 概率）</li>
                    <li>数字壁纸：价值 20 积分（12% 概率）</li>
                    <li>虚拟红包：价值 10 积分（20% 概率）</li>
                    <li>谢谢参与：无奖励（30% 概率）</li>
                  </ul>
                </div>

                <div className={`p-4 rounded-xl ${isDark ? 'bg-red-500/10' : 'bg-red-50'} border border-red-500/20`}>
                  <h3 className="font-bold mb-2 text-red-500 flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    温馨提示
                  </h3>
                  <ul className={`list-disc list-inside space-y-1 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    <li>抽奖结果随机，请理性参与</li>
                    <li>积分一旦消耗不予退还</li>
                    <li>中奖积分自动发放到账户</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PointsLottery;
