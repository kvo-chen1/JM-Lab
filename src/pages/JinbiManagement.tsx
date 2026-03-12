import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Coins,
  ArrowLeft,
  Wallet,
  TrendingUp,
  TrendingDown,
  History,
  Package,
  Sparkles,
  ChevronRight,
  Clock,
  Gift,
  CheckCircle2,
  AlertCircle,
  Zap,
  RefreshCw,
  Filter,
  ChevronDown,
  ChevronUp,
  CreditCard,
  X,
  Loader2,
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useJinbi, SERVICE_TYPES } from '@/hooks/useJinbi';
import { JinbiRecord, JinbiRecordType, JinbiPackage, jinbiService } from '@/services/jinbiService';
import JinbiBalance from '@/components/jinbi/JinbiBalance';
import { AuthContext } from '@/contexts/authContext';
import { toast } from 'sonner';

const JinbiManagement: React.FC = () => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const {
    balance,
    records,
    packages,
    monthlyStats,
    loading,
    pagination,
    refreshRecords,
    refreshPackages,
    refreshBalance,
  } = useJinbi();

  const [activeTab, setActiveTab] = useState<'overview' | 'records' | 'recharge'>('overview');
  const [filterType, setFilterType] = useState<JinbiRecordType | 'all'>('all');
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null);

  // 充值相关状态
  const [selectedPackage, setSelectedPackage] = useState<JinbiPackage | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'wechat' | 'alipay'>('wechat');
  const [isProcessing, setIsProcessing] = useState(false);

  const availableBalance = balance?.availableBalance || 0;

  // 处理充值
  const handleRecharge = async (pkg: JinbiPackage) => {
    if (!user) {
      toast.error('请先登录');
      return;
    }

    setSelectedPackage(pkg);
    setShowPaymentModal(true);
  };

  // 确认支付
  const handleConfirmPayment = async () => {
    if (!selectedPackage || !user) return;

    setIsProcessing(true);

    try {
      // 调用充值API
      const response = await fetch('/api/jinbi/recharge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          packageId: selectedPackage.id,
          amount: selectedPackage.price,
          jinbiAmount: selectedPackage.jinbiAmount + selectedPackage.bonusJinbi,
          paymentMethod,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('充值成功！');
        setShowPaymentModal(false);
        setSelectedPackage(null);
        // 刷新余额
        refreshBalance();
        refreshRecords();
      } else {
        toast.error(result.error || '充值失败');
      }
    } catch (error) {
      console.error('充值失败:', error);
      toast.error('充值失败，请稍后重试');
    } finally {
      setIsProcessing(false);
    }
  };

  // 过滤记录
  const filteredRecords = filterType === 'all'
    ? records
    : records.filter((record) => record.type === filterType);

  // 获取记录类型标签
  const getRecordTypeLabel = (type: JinbiRecordType) => {
    const labels: Record<JinbiRecordType, { text: string; color: string }> = {
      grant: { text: '发放', color: 'text-emerald-500' },
      earn: { text: '赚取', color: 'text-blue-500' },
      spend: { text: '消费', color: 'text-rose-500' },
      purchase: { text: '购买', color: 'text-purple-500' },
      refund: { text: '退款', color: 'text-amber-500' },
      expire: { text: '过期', color: 'text-gray-500' },
    };
    return labels[type] || { text: type, color: 'text-gray-500' };
  };

  // 获取记录图标
  const getRecordIcon = (type: JinbiRecordType) => {
    switch (type) {
      case 'grant':
        return <Gift className="w-4 h-4" />;
      case 'earn':
        return <TrendingUp className="w-4 h-4" />;
      case 'spend':
        return <TrendingDown className="w-4 h-4" />;
      case 'purchase':
        return <Wallet className="w-4 h-4" />;
      case 'refund':
        return <RefreshCw className="w-4 h-4" />;
      case 'expire':
        return <Clock className="w-4 h-4" />;
      default:
        return <Coins className="w-4 h-4" />;
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-950' : 'bg-gray-50'}`}>
      {/* 顶部导航 */}
      <div className={`sticky top-0 z-40 ${isDark ? 'bg-slate-900/80' : 'bg-white/80'} backdrop-blur-md border-b ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(-1)}
                className={`p-2 rounded-lg ${isDark ? 'hover:bg-slate-800' : 'hover:bg-gray-100'}`}
              >
                <ArrowLeft className="w-5 h-5" />
              </motion.button>
              <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                津币管理
              </h1>
            </div>
            <JinbiBalance compact onClick={() => setActiveTab('recharge')} />
          </div>
        </div>
      </div>

      {/* 标签导航 */}
      <div className={`border-b ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-6">
            {[
              { id: 'overview', label: '总览', icon: Wallet },
              { id: 'records', label: '收支记录', icon: History },
              { id: 'recharge', label: '充值', icon: Package },
            ].map((tab) => (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  flex items-center gap-2 py-4 text-sm font-medium border-b-2 transition-colors
                  ${activeTab === tab.id
                    ? `border-amber-500 ${isDark ? 'text-amber-400' : 'text-amber-600'}`
                    : `border-transparent ${isDark ? 'text-slate-400 hover:text-slate-300' : 'text-gray-500 hover:text-gray-700'}`
                  }
                `}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {/* 总览标签 */}
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* 余额卡片 */}
              <JinbiBalance showDetails />

              {/* 快捷入口 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: Package, label: '充值津币', action: () => setActiveTab('recharge'), color: 'amber' },
                  { icon: History, label: '查看记录', action: () => setActiveTab('records'), color: 'blue' },
                  { icon: Sparkles, label: '升级会员', action: () => navigate('/membership'), color: 'purple' },
                  { icon: Gift, label: '每日签到', action: () => navigate('/points'), color: 'emerald' },
                ].map((item, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={item.action}
                    className={`
                      p-4 rounded-xl border text-left transition-all
                      ${isDark
                        ? `bg-slate-900/50 border-slate-800 hover:border-${item.color}-500/50`
                        : `bg-white border-gray-200 hover:border-${item.color}-300`
                      }
                    `}
                  >
                    <div className={`
                      w-10 h-10 rounded-lg flex items-center justify-center mb-3
                      ${isDark ? `bg-${item.color}-500/20` : `bg-${item.color}-100`}
                    `}>
                      <item.icon className={`w-5 h-5 text-${item.color}-500`} />
                    </div>
                    <p className={`font-medium ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>{item.label}</p>
                  </motion.button>
                ))}
              </div>

              {/* 最近记录 */}
              <div className={`
                rounded-2xl border overflow-hidden
                ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-gray-200'}
              `}>
                <div className="p-5 border-b border-gray-200 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <h3 className={`font-semibold ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>
                      最近收支
                    </h3>
                    <button
                      onClick={() => setActiveTab('records')}
                      className={`text-sm flex items-center gap-1 ${isDark ? 'text-amber-400 hover:text-amber-300' : 'text-amber-600 hover:text-amber-700'}`}
                    >
                      查看全部
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-slate-800">
                  {records.slice(0, 5).map((record) => (
                    <div key={record.id} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`
                          w-10 h-10 rounded-lg flex items-center justify-center
                          ${isDark ? 'bg-slate-800' : 'bg-gray-100'}
                        `}>
                          {getRecordIcon(record.type)}
                        </div>
                        <div>
                          <p className={`font-medium ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>
                            {record.description}
                          </p>
                          <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                            {new Date(record.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span className={`font-bold ${record.amount > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {record.amount > 0 ? '+' : ''}{record.amount}
                      </span>
                    </div>
                  ))}
                  {records.length === 0 && (
                    <div className="p-8 text-center">
                      <Coins className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-slate-600' : 'text-gray-300'}`} />
                      <p className={isDark ? 'text-slate-500' : 'text-gray-500'}>暂无记录</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* 记录标签 */}
          {activeTab === 'records' && (
            <motion.div
              key="records"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* 过滤器 */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                <Filter className="w-4 h-4 text-gray-400" />
                {[
                  { value: 'all', label: '全部' },
                  { value: 'grant', label: '发放' },
                  { value: 'earn', label: '赚取' },
                  { value: 'spend', label: '消费' },
                  { value: 'purchase', label: '购买' },
                ].map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => setFilterType(filter.value as any)}
                    className={`
                      px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors
                      ${filterType === filter.value
                        ? 'bg-amber-500 text-white'
                        : isDark
                          ? 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }
                    `}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              {/* 记录列表 */}
              <div className={`
                rounded-2xl border overflow-hidden
                ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-gray-200'}
              `}>
                <div className="divide-y divide-gray-200 dark:divide-slate-800">
                  {filteredRecords.map((record) => {
                    const typeInfo = getRecordTypeLabel(record.type);
                    const isExpanded = expandedRecord === record.id;

                    return (
                      <motion.div
                        key={record.id}
                        layout
                        className="p-4"
                      >
                        <div
                          className="flex items-center justify-between cursor-pointer"
                          onClick={() => setExpandedRecord(isExpanded ? null : record.id)}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`
                              w-10 h-10 rounded-lg flex items-center justify-center
                              ${isDark ? 'bg-slate-800' : 'bg-gray-100'}
                            `}>
                              {getRecordIcon(record.type)}
                            </div>
                            <div>
                              <p className={`font-medium ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>
                                {record.description}
                              </p>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs ${typeInfo.color}`}>{typeInfo.text}</span>
                                <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                                  {new Date(record.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`font-bold ${(record?.amount || 0) > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                              {(record?.amount || 0) > 0 ? '+' : ''}{(record?.amount || 0).toLocaleString()}
                            </span>
                            {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                          </div>
                        </div>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="mt-3 pt-3 border-t border-gray-200 dark:border-slate-800"
                            >
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className={isDark ? 'text-slate-500' : 'text-gray-500'}>变动后余额</p>
                                  <p className={`font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                                    {(record?.balanceAfter || 0).toLocaleString()} 津币
                                  </p>
                                </div>
                                {record.source && (
                                  <div>
                                    <p className={isDark ? 'text-slate-500' : 'text-gray-500'}>来源</p>
                                    <p className={`font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                                      {record.source}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}

                  {filteredRecords.length === 0 && (
                    <div className="p-8 text-center">
                      <History className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-slate-600' : 'text-gray-300'}`} />
                      <p className={isDark ? 'text-slate-500' : 'text-gray-500'}>暂无记录</p>
                    </div>
                  )}
                </div>
              </div>

              {/* 分页 */}
              {pagination.records.total > pagination.records.limit && (
                <div className="flex justify-center gap-2">
                  {Array.from({ length: Math.ceil(pagination.records.total / pagination.records.limit) }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => refreshRecords(i + 1)}
                      className={`
                        w-8 h-8 rounded-lg text-sm
                        ${pagination.records.page === i + 1
                          ? 'bg-amber-500 text-white'
                          : isDark
                            ? 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }
                      `}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* 充值标签 */}
          {activeTab === 'recharge' && (
            <motion.div
              key="recharge"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* 充值套餐 */}
              <div>
                <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>
                  选择充值套餐
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {packages.map((pkg, index) => (
                    <motion.div
                      key={pkg.id}
                      whileHover={{ scale: 1.02, y: -4 }}
                      whileTap={{ scale: 0.98 }}
                      className={`
                        relative p-5 rounded-2xl border-2 cursor-pointer transition-all
                        ${index === 1
                          ? isDark
                            ? 'border-amber-500/50 bg-gradient-to-br from-amber-500/10 to-yellow-600/10'
                            : 'border-amber-400 bg-gradient-to-br from-amber-50 to-yellow-50'
                          : isDark
                            ? 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }
                      `}
                    >
                      {index === 1 && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-500 text-white">
                            推荐
                          </span>
                        </div>
                      )}

                      <div className="text-center mb-4">
                        <h4 className={`font-semibold ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>
                          {pkg.name}
                        </h4>
                        <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                          {pkg.description}
                        </p>
                      </div>

                      <div className="text-center mb-4">
                        <div className="flex items-center justify-center gap-1">
                          <Coins className="w-5 h-5 text-amber-500" />
                          <span className={`text-3xl font-bold ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                            {(pkg?.jinbiAmount || 0).toLocaleString()}
                          </span>
                        </div>
                        {(pkg?.bonusJinbi || 0) > 0 && (
                          <p className={`text-sm mt-1 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                            +{(pkg?.bonusJinbi || 0).toLocaleString()} 赠送
                          </p>
                        )}
                      </div>

                      <div className="text-center">
                        <p className={`text-2xl font-bold ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>
                          ¥{pkg.price}
                        </p>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                          {((pkg.price / (pkg.jinbiAmount + pkg.bonusJinbi)) * 100).toFixed(2)}元/100津币
                        </p>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleRecharge(pkg)}
                        className={`
                          w-full mt-4 py-2.5 rounded-xl font-medium
                          ${index === 1
                            ? 'bg-amber-500 text-white hover:bg-amber-600'
                            : isDark
                              ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }
                          transition-colors
                        `}
                      >
                        立即充值
                      </motion.button>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* 充值说明 */}
              <div className={`
                rounded-2xl p-5 border
                ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-gray-200'}
              `}>
                <h4 className={`font-semibold mb-3 ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>
                  充值说明
                </h4>
                <ul className={`space-y-2 text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    充值后津币立即到账
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    购买的津币永久有效，不会过期
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    支持微信支付、支付宝等多种支付方式
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    津币一经充值，不支持退款
                  </li>
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 支付弹窗 */}
      <AnimatePresence>
        {showPaymentModal && selectedPackage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => !isProcessing && setShowPaymentModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`
                w-full max-w-md rounded-2xl p-6 shadow-2xl
                ${isDark ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-gray-200'}
              `}
              onClick={e => e.stopPropagation()}
            >
              {/* 弹窗头部 */}
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  确认充值
                </h3>
                <button
                  onClick={() => !isProcessing && setShowPaymentModal(false)}
                  className={`p-2 rounded-lg ${isDark ? 'hover:bg-slate-800' : 'hover:bg-gray-100'}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 套餐信息 */}
              <div className={`
                rounded-xl p-4 mb-6
                ${isDark ? 'bg-slate-800/50' : 'bg-gray-50'}
              `}>
                <div className="flex items-center justify-between mb-2">
                  <span className={isDark ? 'text-slate-400' : 'text-gray-500'}>套餐</span>
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {selectedPackage.name}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className={isDark ? 'text-slate-400' : 'text-gray-500'}>津币数量</span>
                  <span className="font-medium text-amber-500">
                    {(selectedPackage?.jinbiAmount || 0).toLocaleString()}
                    {(selectedPackage?.bonusJinbi || 0) > 0 && (
                      <span className="text-sm text-emerald-500 ml-1">
                        +{(selectedPackage?.bonusJinbi || 0).toLocaleString()} 赠送
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-dashed border-gray-300 dark:border-slate-700">
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>支付金额</span>
                  <span className="text-2xl font-bold text-amber-500">¥{selectedPackage.price}</span>
                </div>
              </div>

              {/* 支付方式 */}
              <div className="mb-6">
                <label className={`block text-sm font-medium mb-3 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                  选择支付方式
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPaymentMethod('wechat')}
                    className={`
                      flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all
                      ${paymentMethod === 'wechat'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10'
                        : isDark
                          ? 'border-slate-700 hover:border-slate-600'
                          : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <svg className="w-5 h-5 text-emerald-500" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178A1.17 1.17 0 014.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178 1.17 1.17 0 01-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 01.598.082l1.584.926a.272.272 0 00.14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 01-.023-.156.49.49 0 01.201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89c-.135-.01-.27-.027-.407-.03zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.969-.982z" />
                    </svg>
                    <span className="font-medium">微信支付</span>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('alipay')}
                    className={`
                      flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all
                      ${paymentMethod === 'alipay'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10'
                        : isDark
                          ? 'border-slate-700 hover:border-slate-600'
                          : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <svg className="w-5 h-5 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M5.5 2.5h13a3 3 0 013 3v13a3 3 0 01-3 3h-13a3 3 0 01-3-3v-13a3 3 0 013-3zm12.35 4.75a.65.65 0 00-.65-.65h-2.6a.65.65 0 00-.65.65v.6h3.9v-.6zm-4.55 2.6c-.36.13-.75.2-1.15.2-1.6 0-2.9-1.1-2.9-2.45 0-1.35 1.3-2.45 2.9-2.45.4 0 .79.07 1.15.2a3.78 3.78 0 00-1.15-.2c-1.6 0-2.9 1.1-2.9 2.45 0 1.35 1.3 2.45 2.9 2.45.4 0 .79-.07 1.15-.2zm-3.25 1.3h4.55v.65h-1.3v3.9h-.65v-3.9h-2.6v-.65zm-2.6 0h.65v4.55h-.65v-4.55zm-1.3 0h.65v4.55h-.65v-4.55zm5.85 4.55h-.65v-1.95h.65v1.95zm-2.6 0h-.65v-1.95h.65v-1.95z" />
                    </svg>
                    <span className="font-medium">支付宝</span>
                  </button>
                </div>
              </div>

              {/* 支付按钮 */}
              <button
                onClick={handleConfirmPayment}
                disabled={isProcessing}
                className={`
                  w-full py-3 rounded-xl font-medium text-white
                  ${isProcessing
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-amber-500 hover:bg-amber-600 active:scale-95'
                  }
                  transition-all flex items-center justify-center gap-2
                `}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    处理中...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    确认支付 ¥{selectedPackage.price}
                  </>
                )}
              </button>

              {/* 提示信息 */}
              <p className={`text-xs text-center mt-4 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                点击确认支付即表示您同意充值服务条款
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default JinbiManagement;
