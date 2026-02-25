import { useState, useEffect, useContext, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import { AuthContext } from '@/contexts/authContext';
import { brandTaskService, BrandAccount, BrandTransaction } from '@/services/brandTaskService';
import { supabase } from '@/lib/supabase';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Plus,
  History,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  Building2,
  AlertCircle,
  Loader2,
  Filter,
  ChevronLeft,
  ChevronRight,
  Download,
} from 'lucide-react';

// 交易类型配置
const transactionTypeConfig = {
  deposit: { label: '充值', color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-100 dark:bg-emerald-900/30', icon: ArrowDownLeft },
  withdrawal: { label: '提现', color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/30', icon: ArrowUpRight },
  task_budget: { label: '任务预算', color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-100 dark:bg-blue-900/30', icon: Wallet },
  task_reward: { label: '任务奖励', color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-100 dark:bg-purple-900/30', icon: TrendingUp },
  refund: { label: '退款', color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-100 dark:bg-amber-900/30', icon: RefreshCw },
  fee: { label: '手续费', color: 'text-gray-600 dark:text-gray-400', bgColor: 'bg-gray-100 dark:bg-gray-800', icon: DollarSign },
  adjustment: { label: '调整', color: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-100 dark:bg-orange-900/30', icon: AlertCircle },
};

// 交易状态配置
const transactionStatusConfig = {
  pending: { label: '处理中', color: 'text-amber-600', bgColor: 'bg-amber-50 dark:bg-amber-900/20', icon: Clock },
  completed: { label: '已完成', color: 'text-emerald-600', bgColor: 'bg-emerald-50 dark:bg-emerald-900/20', icon: CheckCircle2 },
  failed: { label: '失败', color: 'text-red-600', bgColor: 'bg-red-50 dark:bg-red-900/20', icon: XCircle },
  cancelled: { label: '已取消', color: 'text-gray-600', bgColor: 'bg-gray-50 dark:bg-gray-800', icon: XCircle },
};

export default function FundManagement() {
  console.log('[FundManagement] 组件开始渲染');
  const { isDark } = useTheme();
  const { user, isAuthenticated } = useContext(AuthContext);
  
  const [account, setAccount] = useState<BrandAccount | null>(null);
  const [transactions, setTransactions] = useState<BrandTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'deposit'>('overview');
  const [transactionFilter, setTransactionFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const pageSize = 10;
  
  console.log('[FundManagement] 状态初始化完成:', { isAuthenticated, user: user?.id, isLoading });

  // 加载账户数据
  const loadAccount = useCallback(async () => {
    console.log('[FundManagement] 开始加载账户');
    try {
      // 检查用户是否已登录
      if (!isAuthenticated || !user) {
        console.warn('[FundManagement] 用户未登录，跳过加载账户');
        return;
      }

      console.log('[FundManagement] 调用 getBrandAccount...');
      const accountData = await brandTaskService.getBrandAccount();
      console.log('[FundManagement] 获取账户数据结果:', accountData);
      if (accountData) {
        console.log('[FundManagement] 设置账户数据');
        setAccount(accountData);
      } else {
        // 如果没有账户，创建一个
        console.log('[FundManagement] 账户不存在，准备创建新账户');
        const newAccount = await brandTaskService.createBrandAccount();
        console.log('[FundManagement] 创建账户结果:', newAccount);
        if (newAccount) {
          console.log('[FundManagement] 设置新创建的账户');
          setAccount(newAccount);
        } else {
          console.error('[FundManagement] 创建账户失败，newAccount 为 null');
          toast.error('创建账户失败，请刷新页面重试');
        }
      }
    } catch (error) {
      console.error('[FundManagement] 加载账户失败:', error);
      toast.error('加载账户信息失败');
    }
  }, [isAuthenticated, user]);

  // 加载交易记录
  const loadTransactions = useCallback(async (page: number = 1, type: string = 'all') => {
    console.log('[FundManagement] 开始加载交易记录:', { page, type });
    
    // 检查用户是否已登录
    if (!isAuthenticated || !user) {
      console.warn('[FundManagement] 用户未登录，跳过加载交易记录');
      return;
    }
    
    setIsLoadingTransactions(true);
    try {
      const result = await brandTaskService.getTransactions({
        type: type === 'all' ? undefined : type,
        page,
        limit: pageSize,
      });
      console.log('[FundManagement] 获取交易记录:', result);
      setTransactions(result.transactions);
      setTotalTransactions(result.total);
    } catch (error) {
      console.error('[FundManagement] 加载交易记录失败:', error);
      toast.error('加载交易记录失败');
    } finally {
      setIsLoadingTransactions(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    console.log('[FundManagement] useEffect 触发:', { isAuthenticated, user: user?.id });
    const init = async () => {
      console.log('[FundManagement] 开始初始化');
      
      // 检查 Supabase session 状态
      const { data: { session } } = await supabase.auth.getSession();
      console.log('[FundManagement] Supabase session 状态:', {
        hasSession: !!session,
        userId: session?.user?.id,
        localUserId: user?.id
      });
      
      setIsLoading(true);
      try {
        if (isAuthenticated && user) {
          console.log('[FundManagement] 用户已认证，开始加载数据');
          if (!session) {
            console.error('[FundManagement] 警告: 用户已认证但 Supabase session 不存在，RLS 查询将失败');
            console.error('[FundManagement] 请重新登录以获取 Supabase session');
          }
          await loadAccount();
          await loadTransactions(1, transactionFilter);
        } else {
          console.log('[FundManagement] 用户未认证，跳过数据加载');
        }
      } catch (error) {
        console.error('[FundManagement] 初始化失败:', error);
        toast.error('页面加载失败，请刷新重试');
      } finally {
        console.log('[FundManagement] 初始化完成，设置 isLoading = false');
        setIsLoading(false);
      }
    };
    init();
  }, [loadAccount, loadTransactions, transactionFilter, isAuthenticated, user]);

  // 处理充值
  const handleDeposit = async (amount: number) => {
    try {
      const success = await brandTaskService.deposit(amount, 'bank_transfer', `DEP${Date.now()}`);
      if (success) {
        toast.success('充值申请已提交');
        await loadAccount();
        await loadTransactions(1, transactionFilter);
        setActiveTab('overview');
      } else {
        toast.error('充值失败');
      }
    } catch (error) {
      console.error('充值失败:', error);
      toast.error('充值失败，请重试');
    }
  };

  // 过滤交易记录
  const filteredTransactions = transactions;

  // 计算统计数据
  const totalDeposits = transactions
    .filter(t => t.type === 'deposit' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalSpent = transactions
    .filter(t => (t.type === 'task_budget' || t.type === 'task_reward') && t.status === 'completed')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  console.log('[FundManagement] 渲染检查:', { isLoading, isAuthenticated, user: user?.id, account: account?.id });

  if (isLoading) {
    console.log('[FundManagement] 显示加载状态');
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // 如果用户未登录，显示登录提示
  if (!isAuthenticated || !user) {
    console.log('[FundManagement] 显示登录提示');
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <AlertCircle className="w-12 h-12 text-amber-500" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">请先登录</h3>
        <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
          您需要登录后才能查看资金管理页面。
        </p>
        <button
          onClick={() => window.location.href = '/login'}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors"
        >
          去登录
        </button>
      </div>
    );
  }

  // 如果账户为 null，显示错误信息
  if (!account) {
    console.log('[FundManagement] 显示账户加载失败');
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">加载账户失败</h3>
        <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
          无法加载您的品牌账户信息，请稍后重试。
        </p>
        <button
          onClick={loadAccount}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors"
        >
          重试
        </button>
      </div>
    );
  }

  console.log('[FundManagement] 显示主内容');
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* 页面标题 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">资金管理</h2>
          <p className="text-sm mt-1 text-gray-500 dark:text-gray-400">
            管理您的品牌账户资金和交易记录
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab('deposit')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            充值
          </motion.button>
        </div>
      </div>

      {/* 标签页切换 */}
      <div className={`flex gap-1 p-1 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
        {[
          { id: 'overview', label: '总览', icon: Wallet },
          { id: 'transactions', label: '交易记录', icon: History },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? isDark ? 'bg-gray-700 text-white shadow-sm' : 'bg-white text-gray-900 shadow-sm'
                : isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* 总览标签 */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* 余额卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 总余额 */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={`p-6 rounded-2xl ${isDark ? 'bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/20' : 'bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-100'}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Wallet className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                <span className={`text-sm font-medium ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>总余额</span>
              </div>
              <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                ¥{(account?.total_balance || 0).toLocaleString()}
              </p>
              <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                可用: ¥{(account?.available_balance || 0).toLocaleString()}
              </p>
            </motion.div>

            {/* 累计充值 */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
            >
              <div className="flex items-center gap-2 mb-2">
                <ArrowDownLeft className="w-5 h-5 text-emerald-500" />
                <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>累计充值</span>
              </div>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                ¥{(account?.total_deposited || 0).toLocaleString()}
              </p>
              <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                本月: ¥{totalDeposits.toLocaleString()}
              </p>
            </motion.div>

            {/* 累计支出 */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
            >
              <div className="flex items-center gap-2 mb-2">
                <ArrowUpRight className="w-5 h-5 text-red-500" />
                <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>累计支出</span>
              </div>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                ¥{(account?.total_spent || 0).toLocaleString()}
              </p>
              <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                本月: ¥{totalSpent.toLocaleString()}
              </p>
            </motion.div>
          </div>

          {/* 最近交易 */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className={`rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md overflow-hidden`}
          >
            <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
              <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>最近交易</h3>
              <button
                onClick={() => setActiveTab('transactions')}
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                查看全部
              </button>
            </div>
            
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {transactions.slice(0, 5).map((transaction) => (
                <TransactionItem key={transaction.id} transaction={transaction} isDark={isDark} />
              ))}
              {transactions.length === 0 && (
                <div className="text-center py-8">
                  <History className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                  <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>暂无交易记录</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* 交易记录标签 */}
      {activeTab === 'transactions' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md overflow-hidden`}
        >
          {/* 过滤器 */}
          <div className={`flex items-center gap-4 px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={transactionFilter}
              onChange={(e) => {
                setTransactionFilter(e.target.value);
                setCurrentPage(1);
                loadTransactions(1, e.target.value);
              }}
              className={`px-3 py-1.5 rounded-lg text-sm border ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-200 text-gray-900'
              }`}
            >
              <option value="all">全部类型</option>
              <option value="deposit">充值</option>
              <option value="withdrawal">提现</option>
              <option value="task_budget">任务预算</option>
              <option value="task_reward">任务奖励</option>
              <option value="refund">退款</option>
            </select>
          </div>

          {/* 交易列表 */}
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {isLoadingTransactions ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              </div>
            ) : filteredTransactions.length > 0 ? (
              filteredTransactions.map((transaction) => (
                <TransactionItem key={transaction.id} transaction={transaction} isDark={isDark} />
              ))
            ) : (
              <div className="text-center py-12">
                <History className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>暂无交易记录</p>
              </div>
            )}
          </div>

          {/* 分页 */}
          {totalTransactions > pageSize && (
            <div className={`flex items-center justify-between px-6 py-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                共 {totalTransactions} 条记录
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const newPage = currentPage - 1;
                    if (newPage >= 1) {
                      setCurrentPage(newPage);
                      loadTransactions(newPage, transactionFilter);
                    }
                  }}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-lg transition-colors ${
                    currentPage === 1
                      ? 'opacity-50 cursor-not-allowed'
                      : isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  第 {currentPage} 页
                </span>
                <button
                  onClick={() => {
                    const newPage = currentPage + 1;
                    const maxPage = Math.ceil(totalTransactions / pageSize);
                    if (newPage <= maxPage) {
                      setCurrentPage(newPage);
                      loadTransactions(newPage, transactionFilter);
                    }
                  }}
                  disabled={currentPage >= Math.ceil(totalTransactions / pageSize)}
                  className={`p-2 rounded-lg transition-colors ${
                    currentPage >= Math.ceil(totalTransactions / pageSize)
                      ? 'opacity-50 cursor-not-allowed'
                      : isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                  }`}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* 充值标签 */}
      {activeTab === 'deposit' && (
        <DepositForm 
          isDark={isDark} 
          onDeposit={handleDeposit}
          onCancel={() => setActiveTab('overview')}
        />
      )}
    </motion.div>
  );
}

// 交易项组件
function TransactionItem({ transaction, isDark }: { transaction: BrandTransaction; isDark: boolean }) {
  const typeConfig = transactionTypeConfig[transaction.type] || transactionTypeConfig.adjustment;
  const statusConfig = transactionStatusConfig[transaction.status];
  const TypeIcon = typeConfig.icon;
  const StatusIcon = statusConfig.icon;
  
  const isPositive = ['deposit', 'refund'].includes(transaction.type);
  
  return (
    <div className={`flex items-center justify-between px-6 py-4 hover:${isDark ? 'bg-gray-700/50' : 'bg-gray-50'} transition-colors`}>
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${typeConfig.bgColor}`}>
          <TypeIcon className={`w-5 h-5 ${typeConfig.color}`} />
        </div>
        <div>
          <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {typeConfig.label}
          </p>
          <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
            {new Date(transaction.created_at).toLocaleString('zh-CN')}
          </p>
          {transaction.description && (
            <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {transaction.description}
            </p>
          )}
        </div>
      </div>
      
      <div className="text-right">
        <p className={`font-semibold ${isPositive ? 'text-emerald-600' : 'text-gray-900 dark:text-white'}`}>
          {isPositive ? '+' : '-'}¥{Math.abs(transaction.amount).toLocaleString()}
        </p>
        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs mt-1 ${statusConfig.bgColor}`}>
          <StatusIcon className={`w-3 h-3 ${statusConfig.color}`} />
          <span className={statusConfig.color}>{statusConfig.label}</span>
        </div>
      </div>
    </div>
  );
}

// 充值表单组件
function DepositForm({ 
  isDark, 
  onDeposit, 
  onCancel 
}: { 
  isDark: boolean; 
  onDeposit: (amount: number) => void;
  onCancel: () => void;
}) {
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const presetAmounts = [100, 500, 1000, 5000, 10000];

  const handleSubmit = async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      toast.error('请输入有效的充值金额');
      return;
    }
    if (numAmount < 10) {
      toast.error('最低充值金额为 10 元');
      return;
    }

    setIsSubmitting(true);
    await onDeposit(numAmount);
    setIsSubmitting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`max-w-lg mx-auto p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
    >
      <div className="text-center mb-6">
        <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 ${
          isDark ? 'bg-blue-500/20' : 'bg-blue-50'
        }`}>
          <CreditCard className={`w-8 h-8 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
        </div>
        <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>账户充值</h3>
        <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          充值后可用于创建品牌任务
        </p>
      </div>

      <div className="space-y-4">
        {/* 金额输入 */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            充值金额
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">¥</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="请输入充值金额"
              min="10"
              className={`w-full pl-8 pr-4 py-3 rounded-xl border text-lg font-semibold transition-colors ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' 
                  : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
              } focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500`}
            />
          </div>
          <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
            最低充值金额: ¥10
          </p>
        </div>

        {/* 快捷金额 */}
        <div className="grid grid-cols-5 gap-2">
          {presetAmounts.map((preset) => (
            <button
              key={preset}
              onClick={() => setAmount(preset.toString())}
              className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                amount === preset.toString()
                  ? 'bg-blue-600 text-white'
                  : isDark 
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ¥{preset}
            </button>
          ))}
        </div>

        {/* 支付方式 */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            支付方式
          </label>
          <div className={`p-4 rounded-xl border ${isDark ? 'border-gray-600 bg-gray-700/50' : 'border-gray-200 bg-gray-50'}`}>
            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5 text-blue-500" />
              <div className="flex-1">
                <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>银行转账</p>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>支持所有主流银行</p>
              </div>
              <div className="w-5 h-5 rounded-full border-2 border-blue-500 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              </div>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={onCancel}
            className={`flex-1 px-4 py-3 rounded-xl font-medium transition-colors ${
              isDark 
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            取消
          </button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            disabled={isSubmitting || !amount}
            className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ArrowDownLeft className="w-4 h-4" />
            )}
            确认充值
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
