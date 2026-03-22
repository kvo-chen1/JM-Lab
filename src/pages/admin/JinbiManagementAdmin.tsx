import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Coins,
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
  RefreshCw,
  Filter,
  ChevronDown,
  ChevronUp,
  CreditCard,
  X,
  Loader2,
  Search,
  Users,
  Eye,
  ArrowLeft,
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { jinbiService, JinbiRecordType, JinbiPackage, JinbiBalance, JinbiRecord } from '@/services/jinbiService';
import { adminService } from '@/services/adminService';
import { toast } from 'sonner';

// 用户津币信息类型
interface UserJinbiInfo {
  id: string;
  username: string;
  email?: string;
  avatar?: string;
  balance: JinbiBalance | null;
  monthlyStats: {
    earned: number;
    spent: number;
    netChange: number;
  };
}

const JinbiManagementAdmin: React.FC = () => {
  const { isDark } = useTheme();
  const navigate = useNavigate();

  // 主标签页状态
  const [activeTab, setActiveTab] = useState<'users' | 'detail'>('users');

  // 用户列表状态
  const [users, setUsers] = useState<UserJinbiInfo[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [userTotal, setUserTotal] = useState(0);
  const [usersLoading, setUsersLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // 用户详情状态
  const [selectedUser, setSelectedUser] = useState<UserJinbiInfo | null>(null);
  const [detailTab, setDetailTab] = useState<'overview' | 'records' | 'recharge'>('overview');
  const [balance, setBalance] = useState<JinbiBalance | null>(null);
  const [records, setRecords] = useState<JinbiRecord[]>([]);
  const [packages, setPackages] = useState<JinbiPackage[]>([]);
  const [monthlyStats, setMonthlyStats] = useState({ earned: 0, spent: 0, netChange: 0 });
  const [detailLoading, setDetailLoading] = useState(false);
  const [filterType, setFilterType] = useState<JinbiRecordType | 'all'>('all');
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null);
  const [recordsPage, setRecordsPage] = useState(1);
  const [recordsTotal, setRecordsTotal] = useState(0);
  const RECORDS_LIMIT = 20;

  // 充值相关状态
  const [selectedPackage, setSelectedPackage] = useState<JinbiPackage | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'wechat' | 'alipay'>('wechat');
  const [isProcessing, setIsProcessing] = useState(false);

  // 获取用户列表
  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      // 获取用户列表
      const result = await adminService.getUsers({
        page: userPage,
        limit: 10,
        search: userSearch,
      });

      // 获取每个用户的津币数据
      const usersWithJinbi = await Promise.all(
        result.users.map(async (user) => {
          const [balance, monthlyStats] = await Promise.all([
            jinbiService.getBalance(user.id),
            jinbiService.getMonthlyStats(user.id),
          ]);

          return {
            id: user.id,
            username: user.username || '未命名用户',
            email: user.email,
            avatar: user.avatar_url || user.avatar,
            balance,
            monthlyStats,
          };
        })
      );

      setUsers(usersWithJinbi);
      setUserTotal(result.total);
    } catch (error) {
      console.error('获取用户列表失败:', error);
      toast.error('获取用户列表失败');
    } finally {
      setUsersLoading(false);
    }
  }, [userPage, userSearch]);

  // 获取用户详情数据
  const fetchUserDetail = useCallback(async (userId: string) => {
    setDetailLoading(true);
    try {
      const [balanceData, recordsData, packagesData, monthlyStatsData] = await Promise.all([
        jinbiService.getBalance(userId),
        jinbiService.getRecords(userId, { page: recordsPage, limit: RECORDS_LIMIT }),
        jinbiService.getPackages(),
        jinbiService.getMonthlyStats(userId),
      ]);

      setBalance(balanceData);
      setRecords(recordsData.records);
      setRecordsTotal(recordsData.total);
      setPackages(packagesData);
      setMonthlyStats(monthlyStatsData);

      // 更新选中用户信息
      const user = users.find(u => u.id === userId);
      if (user) {
        setSelectedUser({
          ...user,
          balance: balanceData,
          monthlyStats: monthlyStatsData,
        });
      }
    } catch (error) {
      console.error('获取用户详情失败:', error);
      toast.error('获取用户详情失败');
    } finally {
      setDetailLoading(false);
    }
  }, [users, recordsPage]);

  // 初始加载用户列表
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // 加载选中用户详情
  useEffect(() => {
    if (selectedUserId && activeTab === 'detail') {
      fetchUserDetail(selectedUserId);
    }
  }, [selectedUserId, activeTab, fetchUserDetail]);

  // 处理查看用户详情
  const handleViewUser = (userId: string) => {
    setSelectedUserId(userId);
    setActiveTab('detail');
    setDetailTab('overview');
  };

  // 处理返回用户列表
  const handleBackToList = () => {
    setActiveTab('users');
    setSelectedUserId(null);
    setSelectedUser(null);
  };

  // 处理充值
  const handleRecharge = async (pkg: JinbiPackage) => {
    if (!selectedUserId) {
      toast.error('请先选择用户');
      return;
    }

    setSelectedPackage(pkg);
    setShowPaymentModal(true);
  };

  // 确认发放津币
  const handleConfirmGrant = async () => {
    if (!selectedPackage || !selectedUserId) return;

    setIsProcessing(true);

    try {
      // 使用 grantJinbi 直接发放津币
      const result = await jinbiService.grantJinbi(
        selectedUserId,
        selectedPackage.jinbiAmount + selectedPackage.bonusJinbi,
        'admin_grant',
        `管理员发放：${selectedPackage.name}`,
        {
          relatedType: 'grant',
        }
      );

      if (result.success) {
        toast.success('津币发放成功！');
        setShowPaymentModal(false);
        setSelectedPackage(null);
        // 刷新用户数据
        jinbiService.clearCache();
        fetchUserDetail(selectedUserId);
        // 刷新用户列表
        fetchUsers();
      } else {
        toast.error(result.error || '发放失败');
      }
    } catch (error) {
      console.error('发放失败:', error);
      toast.error('发放失败，请稍后重试');
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

  const availableBalance = balance?.availableBalance || 0;

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* 页面标题 */}
      <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b`}>
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {activeTab === 'detail' && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleBackToList}
                  className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                >
                  <ArrowLeft className="w-5 h-5" />
                </motion.button>
              )}
              <div>
                <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {activeTab === 'users' ? '津币管理' : (selectedUser?.username || '用户详情')}
                </h1>
                <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {activeTab === 'users' ? '管理所有用户的津币数据' : '查看和管理用户津币'}
                </p>
              </div>
            </div>
            {activeTab === 'detail' && selectedUser && (
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-amber-50'}`}>
                <Coins className="w-5 h-5 text-amber-500" />
                <span className={`font-bold ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                  {availableBalance.toLocaleString()} 津币
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 标签导航 */}
        <div className="px-6">
          <div className="flex gap-6">
            {activeTab === 'users' ? (
              <motion.button
                className={`flex items-center gap-2 py-4 text-sm font-medium border-b-2 border-red-600 ${isDark ? 'text-red-500' : 'text-red-600'}`}
              >
                <Users className="w-4 h-4" />
                用户列表
              </motion.button>
            ) : (
              <>
                <motion.button
                  onClick={() => setDetailTab('overview')}
                  className={`
                    flex items-center gap-2 py-4 text-sm font-medium border-b-2 transition-colors
                    ${detailTab === 'overview'
                      ? `border-red-600 ${isDark ? 'text-red-500' : 'text-red-600'}`
                      : `border-transparent ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`
                    }
                  `}
                >
                  <Wallet className="w-4 h-4" />
                  总览
                </motion.button>
                <motion.button
                  onClick={() => setDetailTab('records')}
                  className={`
                    flex items-center gap-2 py-4 text-sm font-medium border-b-2 transition-colors
                    ${detailTab === 'records'
                      ? `border-red-600 ${isDark ? 'text-red-500' : 'text-red-600'}`
                      : `border-transparent ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`
                    }
                  `}
                >
                  <History className="w-4 h-4" />
                  收支记录
                </motion.button>
                <motion.button
                  onClick={() => setDetailTab('recharge')}
                  className={`
                    flex items-center gap-2 py-4 text-sm font-medium border-b-2 transition-colors
                    ${detailTab === 'recharge'
                      ? `border-red-600 ${isDark ? 'text-red-500' : 'text-red-600'}`
                      : `border-transparent ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`
                    }
                  `}
                >
                  <Package className="w-4 h-4" />
                  充值
                </motion.button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {/* 用户列表标签 */}
          {activeTab === 'users' && (
            <motion.div
              key="users"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* 搜索栏 */}
              <div className={`
                rounded-xl border p-4
                ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
              `}>
                <div className="flex items-center gap-4">
                  <div className={`flex-1 flex items-center gap-2 px-4 py-2 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <Search className="w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="搜索用户名或邮箱..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
                      className={`flex-1 bg-transparent border-none outline-none text-sm ${isDark ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'}`}
                    />
                  </div>
                  <button
                    onClick={fetchUsers}
                    disabled={usersLoading}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    {usersLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    搜索
                  </button>
                </div>
              </div>

              {/* 用户列表表格 */}
              <div className={`
                rounded-xl border overflow-hidden
                ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
              `}>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className={`${isDark ? 'bg-gray-700/50' : 'bg-gray-50'} border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                        <th className={`px-4 py-3 text-left text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>用户</th>
                        <th className={`px-4 py-3 text-left text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>邮箱</th>
                        <th className={`px-4 py-3 text-right text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>余额</th>
                        <th className={`px-4 py-3 text-right text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>本月收入</th>
                        <th className={`px-4 py-3 text-right text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>本月支出</th>
                        <th className={`px-4 py-3 text-center text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>操作</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
                      {users.map((user) => (
                        <tr key={user.id} className={`${isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'} transition-colors`}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <img
                                src={user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user.id}
                                alt={user.username}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                              <span className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                                {user.username}
                              </span>
                            </div>
                          </td>
                          <td className={`px-4 py-3 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {user.email || '-'}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={`font-bold ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                              {(user.balance?.availableBalance || 0).toLocaleString()}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-emerald-500">
                              +{user.monthlyStats.earned.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-rose-500">
                              -{user.monthlyStats.spent.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => handleViewUser(user.id)}
                              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors flex items-center gap-1 mx-auto"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              查看
                            </button>
                          </td>
                        </tr>
                      ))}
                      {users.length === 0 && !usersLoading && (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center">
                            <Users className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
                            <p className={isDark ? 'text-gray-500' : 'text-gray-500'}>暂无用户数据</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* 分页 */}
                {userTotal > 10 && (
                  <div className={`px-4 py-3 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      共 {userTotal} 条记录
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setUserPage(p => Math.max(1, p - 1))}
                        disabled={userPage === 1}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                          userPage === 1
                            ? 'opacity-50 cursor-not-allowed'
                            : isDark
                              ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                      >
                        上一页
                      </button>
                      <span className={`px-3 py-1.5 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        第 {userPage} 页
                      </span>
                      <button
                        onClick={() => setUserPage(p => p + 1)}
                        disabled={userPage * 10 >= userTotal}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                          userPage * 10 >= userTotal
                            ? 'opacity-50 cursor-not-allowed'
                            : isDark
                              ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                      >
                        下一页
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* 用户详情 - 总览 */}
          {activeTab === 'detail' && detailTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* 余额统计卡片 */}
              <div className={`
                rounded-xl border p-6
                ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
              `}>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-amber-500/20' : 'bg-amber-100'}`}>
                      <Wallet className="w-6 h-6 text-amber-500" />
                    </div>
                    <div>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>津币余额</p>
                      <p className={`text-3xl font-bold ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                        {availableBalance.toLocaleString()} <span className="text-lg">津币</span>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setDetailTab('recharge')}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors"
                  >
                    充值
                  </button>
                </div>

                {/* 本月统计 */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                      <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>本月收入</span>
                    </div>
                    <p className="text-lg font-bold text-emerald-500">+{monthlyStats.earned.toLocaleString()}</p>
                  </div>
                  <div className="text-center border-x border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <TrendingDown className="w-4 h-4 text-rose-500" />
                      <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>本月支出</span>
                    </div>
                    <p className="text-lg font-bold text-rose-500">-{monthlyStats.spent.toLocaleString()}</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Coins className="w-4 h-4 text-amber-500" />
                      <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>净变化</span>
                    </div>
                    <p className={`text-lg font-bold ${monthlyStats.netChange >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {monthlyStats.netChange >= 0 ? '+' : ''}{monthlyStats.netChange.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* 快捷入口 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: Package, label: '充值津币', action: () => setDetailTab('recharge'), color: 'amber' },
                  { icon: History, label: '查看记录', action: () => setDetailTab('records'), color: 'blue' },
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
                        ? `bg-gray-800 border-gray-700 hover:border-${item.color}-500/50`
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
                    <p className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{item.label}</p>
                  </motion.button>
                ))}
              </div>

              {/* 最近记录 */}
              <div className={`
                rounded-xl border overflow-hidden
                ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
              `}>
                <div className={`p-5 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className="flex items-center justify-between">
                    <h3 className={`font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                      最近收支
                    </h3>
                    <button
                      onClick={() => setDetailTab('records')}
                      className={`text-sm flex items-center gap-1 ${isDark ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700'}`}
                    >
                      查看全部
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
                  {records.slice(0, 5).map((record) => (
                    <div key={record.id} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`
                          w-10 h-10 rounded-lg flex items-center justify-center
                          ${isDark ? 'bg-gray-700' : 'bg-gray-100'}
                        `}>
                          {getRecordIcon(record.type)}
                        </div>
                        <div>
                          <p className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                            {record.description}
                          </p>
                          <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                            {new Date(record.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span className={`font-bold ${record.amount > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {record.amount > 0 ? '+' : ''}{record.amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                  {records.length === 0 && (
                    <div className="p-8 text-center">
                      <Coins className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
                      <p className={isDark ? 'text-gray-500' : 'text-gray-500'}>暂无记录</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* 用户详情 - 记录标签 */}
          {activeTab === 'detail' && detailTab === 'records' && (
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
                        ? 'bg-red-600 text-white'
                        : isDark
                          ? 'bg-gray-700 text-gray-400 hover:bg-gray-600'
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
                rounded-xl border overflow-hidden
                ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
              `}>
                <div className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
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
                              ${isDark ? 'bg-gray-700' : 'bg-gray-100'}
                            `}>
                              {getRecordIcon(record.type)}
                            </div>
                            <div>
                              <p className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                                {record.description}
                              </p>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs ${typeInfo.color}`}>{typeInfo.text}</span>
                                <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
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
                              className={`mt-3 pt-3 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
                            >
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className={isDark ? 'text-gray-500' : 'text-gray-500'}>变动后余额</p>
                                  <p className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {(record?.balanceAfter || 0).toLocaleString()} 津币
                                  </p>
                                </div>
                                {record.source && (
                                  <div>
                                    <p className={isDark ? 'text-gray-500' : 'text-gray-500'}>来源</p>
                                    <p className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
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
                      <History className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
                      <p className={isDark ? 'text-gray-500' : 'text-gray-500'}>暂无记录</p>
                    </div>
                  )}
                </div>
              </div>

              {/* 分页 */}
              {recordsTotal > RECORDS_LIMIT && (
                <div className="flex justify-center gap-2">
                  {Array.from({ length: Math.ceil(recordsTotal / RECORDS_LIMIT) }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setRecordsPage(i + 1)}
                      className={`
                        w-8 h-8 rounded-lg text-sm
                        ${recordsPage === i + 1
                          ? 'bg-red-600 text-white'
                          : isDark
                            ? 'bg-gray-700 text-gray-400 hover:bg-gray-600'
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

          {/* 用户详情 - 充值标签 */}
          {activeTab === 'detail' && detailTab === 'recharge' && (
            <motion.div
              key="recharge"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* 充值套餐 */}
              <div>
                <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                  选择充值套餐
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {packages.map((pkg, index) => (
                    <motion.div
                      key={pkg.id}
                      whileHover={{ scale: 1.02, y: -4 }}
                      whileTap={{ scale: 0.98 }}
                      className={`
                        relative p-5 rounded-xl border-2 cursor-pointer transition-all
                        ${index === 1
                          ? isDark
                            ? 'border-amber-500/50 bg-gradient-to-br from-amber-500/10 to-yellow-600/10'
                            : 'border-amber-400 bg-gradient-to-br from-amber-50 to-yellow-50'
                          : isDark
                            ? 'border-gray-700 bg-gray-800 hover:border-gray-600'
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
                        <h4 className={`font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                          {pkg.name}
                        </h4>
                        <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
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
                        <p className={`text-2xl font-bold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                          ¥{pkg.price}
                        </p>
                        <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
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
                              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }
                          transition-colors
                        `}
                      >
                        立即发放
                      </motion.button>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* 充值说明 */}
              <div className={`
                rounded-xl p-5 border
                ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
              `}>
                <h4 className={`font-semibold mb-3 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                  充值说明
                </h4>
                <ul className={`space-y-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
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
        {showPaymentModal && selectedPackage && selectedUser && (
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
                w-full max-w-md rounded-xl p-6 shadow-2xl
                ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}
              `}
              onClick={e => e.stopPropagation()}
            >
              {/* 弹窗头部 */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    确认发放津币
                  </h3>
                  <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    用户：{selectedUser.username}
                  </p>
                </div>
                <button
                  onClick={() => !isProcessing && setShowPaymentModal(false)}
                  className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 套餐信息 */}
              <div className={`
                rounded-xl p-4 mb-6
                ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}
              `}>
                <div className="flex items-center justify-between mb-2">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>套餐</span>
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {selectedPackage.name}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>津币数量</span>
                  <span className="font-medium text-amber-500">
                    {(selectedPackage?.jinbiAmount || 0).toLocaleString()}
                    {(selectedPackage?.bonusJinbi || 0) > 0 && (
                      <span className="text-sm text-emerald-500 ml-1">
                        +{(selectedPackage?.bonusJinbi || 0).toLocaleString()} 赠送
                      </span>
                    )}
                  </span>
                </div>
                <div className={`flex items-center justify-between pt-2 border-t border-dashed ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>发放方式</span>
                  <span className="font-medium text-emerald-500">管理员直接发放</span>
                </div>
              </div>

              {/* 发放按钮 */}
              <button
                onClick={handleConfirmGrant}
                disabled={isProcessing}
                className={`
                  w-full py-3 rounded-xl font-medium text-white
                  ${isProcessing
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-emerald-500 hover:bg-emerald-600 active:scale-95'
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
                    <Gift className="w-5 h-5" />
                    确认发放 {(selectedPackage?.jinbiAmount || 0) + (selectedPackage?.bonusJinbi || 0)} 津币
                  </>
                )}
              </button>

              {/* 提示信息 */}
              <p className={`text-xs text-center mt-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                点击确认发放将直接为用户添加津币，无需支付
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default JinbiManagementAdmin;
