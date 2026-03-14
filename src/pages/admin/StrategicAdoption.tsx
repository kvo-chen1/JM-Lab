import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import { brandPartnershipService, BrandPartnership } from '@/services/brandPartnershipService';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText,
  Search,
  Building2,
  Calendar,
  MessageSquare,
  Loader2,
  Phone,
  Mail,
  User
} from 'lucide-react';

// 统计数据类型
interface PartnershipStats {
  totalApplications: number;
  pendingReview: number;
  approved: number;
  rejected: number;
  negotiating: number;
}

export default function StrategicAdoption() {
  const { isDark } = useTheme();
  const [applications, setApplications] = useState<BrandPartnership[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<BrandPartnership[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<BrandPartnership | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [activeTab, setActiveTab] = useState<'onboarding' | 'cooperation'>('onboarding');
  const [stats, setStats] = useState<PartnershipStats>({
    totalApplications: 0,
    pendingReview: 0,
    approved: 0,
    rejected: 0,
    negotiating: 0,
  });

  // 加载数据
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 获取所有品牌合作申请
      const { partnerships, total } = await brandPartnershipService.getAllPartnerships({
        status: filterStatus !== 'all' ? filterStatus : undefined,
      });

      setApplications(partnerships);
      
      // 计算统计数据
      const statsData = await brandPartnershipService.getStats();
      setStats({
        totalApplications: statsData.totalPartnerships,
        pendingReview: statsData.pendingPartnerships,
        approved: statsData.approvedPartnerships,
        rejected: 0, // 可以从 partnerships 中计算
        negotiating: 0,
      });
    } catch (error) {
      console.error('加载数据失败:', error);
      toast.error('加载数据失败');
    } finally {
      setIsLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 筛选和排序
  useEffect(() => {
    let filtered = applications;
    
    // 搜索筛选
    if (searchTerm) {
      filtered = filtered.filter(app => 
        app.brand_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.contact_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // 按时间排序
    filtered = [...filtered].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    
    setFilteredApplications(filtered);
  }, [applications, searchTerm]);

  // 处理状态变更
  const handleStatusChange = async (id: string, newStatus: BrandPartnership['status']) => {
    const success = await brandPartnershipService.updatePartnershipStatus(
      id, 
      newStatus, 
      adminNotes
    );
    
    if (success) {
      setApplications(prev => prev.map(app => 
        app.id === id ? { ...app, status: newStatus, admin_notes: adminNotes } : app
      ));
      
      const statusText = {
        pending: '待审核',
        negotiating: '洽谈中',
        approved: '已通过',
        rejected: '已拒绝'
      };
      
      toast.success(`申请状态已更新为${statusText[newStatus]}`);
      setAdminNotes('');
      
      // 刷新统计数据
      const statsData = await brandPartnershipService.getStats();
      setStats({
        totalApplications: statsData.totalPartnerships,
        pendingReview: statsData.pendingPartnerships,
        approved: statsData.approvedPartnerships,
        rejected: 0,
        negotiating: 0,
      });
    } else {
      toast.error('更新状态失败');
    }
  };

  // 获取状态样式
  const getStatusStyle = (status: BrandPartnership['status']) => {
    switch (status) {
      case 'pending':
        return {
          bg: isDark ? 'bg-yellow-500/20' : 'bg-yellow-100',
          text: isDark ? 'text-yellow-400' : 'text-yellow-700',
          icon: Clock,
          label: '待审核'
        };
      case 'approved':
        return {
          bg: isDark ? 'bg-green-500/20' : 'bg-green-100',
          text: isDark ? 'text-green-400' : 'text-green-700',
          icon: CheckCircle,
          label: '已通过'
        };
      case 'rejected':
        return {
          bg: isDark ? 'bg-red-500/20' : 'bg-red-100',
          text: isDark ? 'text-red-400' : 'text-red-700',
          icon: XCircle,
          label: '已拒绝'
        };
      case 'negotiating':
        return {
          bg: isDark ? 'bg-blue-500/20' : 'bg-blue-100',
          text: isDark ? 'text-blue-400' : 'text-blue-700',
          icon: MessageSquare,
          label: '洽谈中'
        };
    }
  };

  // 统计卡片组件
  const StatCard = ({ title, value, icon: Icon, color }: { 
    title: string; 
    value: string;
    icon: any;
    color: string;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-md`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{title}</p>
          <h3 className="text-2xl font-bold mt-1">{value}</h3>
        </div>
        <div 
          className="p-3 rounded-xl"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
      </div>
    </motion.div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* 页面标题 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">品牌管理</h2>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            管理品牌入驻申请和品牌合作
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={loadData}
            disabled={isLoading}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'
            } shadow-sm disabled:opacity-50`}
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            刷新
          </motion.button>
        </div>
      </div>

      {/* 标签切换 */}
      <div className="flex space-x-4 border-b border-gray-200 dark:border-gray-700">
        {[
          { id: 'onboarding', label: '品牌入驻' },
          { id: 'cooperation', label: '品牌合作' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'onboarding' | 'cooperation')}
            className={`pb-3 px-2 text-sm font-medium transition-colors relative ${
              activeTab === tab.id
                ? 'text-red-600 dark:text-red-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId="brandTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600"
              />
            )}
          </button>
        ))}
      </div>

      {/* 品牌入驻标签页 */}
      {activeTab === 'onboarding' && (
        <>
          {/* 统计卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
              title="总申请数" 
              value={stats.totalApplications.toString()}
              icon={FileText}
              color="#8b5cf6"
            />
            <StatCard 
              title="待审核" 
              value={stats.pendingReview.toString()}
              icon={Clock}
              color="#f59e0b"
            />
            <StatCard 
              title="已通过" 
              value={stats.approved.toString()}
              icon={CheckCircle}
              color="#10b981"
            />
            <StatCard 
              title="已拒绝" 
              value={stats.rejected.toString()}
              icon={XCircle}
              color="#ef4444"
            />
          </div>

          {/* 筛选和搜索栏 */}
          <div className={`flex flex-col md:flex-row gap-4 ${isDark ? 'bg-gray-800' : 'bg-white'} p-4 rounded-2xl shadow-md`}>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索品牌名称、联系人..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-xl text-sm outline-none transition-colors ${
                  isDark 
                    ? 'bg-gray-700 text-white placeholder-gray-400 focus:bg-gray-600' 
                    : 'bg-gray-100 text-gray-900 placeholder-gray-500 focus:bg-gray-200'
                }`}
              />
            </div>
            
            <div className="flex gap-3">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className={`px-4 py-2 rounded-xl text-sm outline-none transition-colors ${
                  isDark 
                    ? 'bg-gray-700 text-white' 
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <option value="all">全部状态</option>
                <option value="pending">待审核</option>
                <option value="negotiating">洽谈中</option>
                <option value="approved">已通过</option>
                <option value="rejected">已拒绝</option>
              </select>
            </div>
          </div>

          {/* 申请列表 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧列表 */}
        <div className="lg:col-span-2 space-y-4">
          {isLoading ? (
            <div className={`flex items-center justify-center py-16 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md`}>
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className={`flex flex-col items-center justify-center py-16 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md`}>
              <Building2 className="w-16 h-16 text-gray-400 mb-4" />
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                暂无品牌合作申请
              </p>
            </div>
          ) : (
            <AnimatePresence>
              {filteredApplications.map((app, index) => {
                const statusStyle = getStatusStyle(app.status);
                const StatusIcon = statusStyle.icon;
                
                return (
                  <motion.div
                    key={app.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => setSelectedApplication(app)}
                    className={`p-4 rounded-2xl cursor-pointer transition-all ${
                      selectedApplication?.id === app.id
                        ? isDark ? 'bg-gray-700 ring-2 ring-blue-500' : 'bg-white ring-2 ring-blue-500'
                        : isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'
                    } shadow-md`}
                  >
                    <div className="flex gap-4">
                      {/* 品牌Logo */}
                      <img 
                        src={app.brand_logo || 'https://via.placeholder.com/100'} 
                        alt={app.brand_name}
                        className="w-20 h-20 rounded-xl object-cover flex-shrink-0 border border-gray-200 dark:border-gray-600"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/100';
                        }}
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold text-lg truncate">{app.brand_name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <User className="w-4 h-4 text-gray-400" />
                              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                {app.contact_name}
                              </span>
                            </div>
                          </div>
                          
                          <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusStyle.label}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 mt-3">
                          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            <Phone className="w-3 h-3 inline mr-1" />
                            {app.contact_phone}
                          </div>
                          
                          {app.contact_email && (
                            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              <Mail className="w-3 h-3 inline mr-1" />
                              {app.contact_email}
                            </div>
                          )}
                          
                          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            <Calendar className="w-3 h-3 inline mr-1" />
                            {new Date(app.created_at).toLocaleDateString('zh-CN')}
                          </div>
                        </div>
                        
                        {/* 品牌介绍 */}
                        <p className={`text-sm mt-2 line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {app.description}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>

        {/* 右侧详情 */}
        <div className="lg:col-span-1">
          <AnimatePresence mode="wait">
            {selectedApplication ? (
              <motion.div
                key={selectedApplication.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md overflow-hidden sticky top-6`}
              >
                {/* 详情头部 */}
                <div className="relative p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-4">
                    <img 
                      src={selectedApplication.brand_logo || 'https://via.placeholder.com/100'} 
                      alt={selectedApplication.brand_name}
                      className="w-16 h-16 rounded-xl object-cover border border-gray-200 dark:border-gray-600"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/100';
                      }}
                    />
                    <div>
                      <h3 className="font-bold text-lg">{selectedApplication.brand_name}</h3>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        申请入驻
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 space-y-6">
                  {/* 联系人信息 */}
                  <div className="space-y-3">
                    <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      联系人信息
                    </p>
                    <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <User className="w-4 h-4 text-blue-500" />
                        <span className="text-sm">{selectedApplication.contact_name}</span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <Phone className="w-4 h-4 text-green-500" />
                        <span className="text-sm">{selectedApplication.contact_phone}</span>
                      </div>
                      {selectedApplication.contact_email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-purple-500" />
                          <span className="text-sm">{selectedApplication.contact_email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* 品牌介绍 */}
                  <div>
                    <p className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>品牌介绍</p>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {selectedApplication.description || '暂无描述'}
                    </p>
                  </div>

                  {/* 管理员备注 */}
                  <div>
                    <p className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>管理员备注</p>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="添加审核备注..."
                      rows={3}
                      className={`w-full px-3 py-2 rounded-xl text-sm outline-none resize-none ${
                        isDark 
                          ? 'bg-gray-700 text-white placeholder-gray-400' 
                          : 'bg-gray-100 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                  </div>
                  
                  {/* 操作按钮 */}
                  <div className="flex gap-2">
                    {selectedApplication.status === 'pending' && (
                      <>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleStatusChange(selectedApplication.id, 'approved')}
                          className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-medium transition-colors"
                        >
                          通过
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleStatusChange(selectedApplication.id, 'rejected')}
                          className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium transition-colors"
                        >
                          拒绝
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleStatusChange(selectedApplication.id, 'negotiating')}
                          className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-medium transition-colors"
                        >
                          洽谈
                        </motion.button>
                      </>
                    )}
                    {selectedApplication.status === 'negotiating' && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleStatusChange(selectedApplication.id, 'approved')}
                        className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-medium transition-colors"
                      >
                        确认通过
                      </motion.button>
                    )}
                  </div>
                  
                  {/* 审核历史 */}
                  {selectedApplication.admin_notes && (
                    <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
                      <p className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>历史备注</p>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {selectedApplication.admin_notes}
                      </p>
                      {selectedApplication.reviewed_at && (
                        <p className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          审核时间: {new Date(selectedApplication.reviewed_at).toLocaleString('zh-CN')}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md p-8 text-center`}
              >
                <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  选择一个申请查看详情
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
        </>
      )}

      {/* 品牌合作标签页 */}
      {activeTab === 'cooperation' && (
        <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
                品牌合作功能开发中
              </p>
              <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                此功能将用于管理品牌之间的合作项目
              </p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
