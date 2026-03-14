import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import { adminService } from '@/services/adminService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface Notification {
  id: string;
  title: string;
  content: string;
  type: 'system' | 'activity' | 'reminder' | 'marketing';
  target: 'all' | 'specific' | 'vip';
  status: 'draft' | 'scheduled' | 'sent' | 'failed';
  created_at: number;
  scheduled_at?: number;
  sent_at?: number;
  recipients_count: number;
  read_count: number;
  click_count: number;
  target_users?: string[];
}

interface NotificationStats {
  totalSent: number;
  totalRead: number;
  totalClick: number;
  readRate: number;
  clickRate: number;
  dailyStats: { date: string; sent: number; read: number; click: number }[];
  typeDistribution: { name: string; value: number }[];
}

const COLORS = ['#f59e0b', '#34d399', '#60a5fa', '#f87171'];

export default function NotificationManagement() {
  const { isDark } = useTheme();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'list' | 'stats' | 'create'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [stats, setStats] = useState<NotificationStats>({
    totalSent: 0,
    totalRead: 0,
    totalClick: 0,
    readRate: 0,
    clickRate: 0,
    dailyStats: [],
    typeDistribution: []
  });

  // 新建通知表单
  const [newNotification, setNewNotification] = useState({
    title: '',
    content: '',
    type: 'system' as Notification['type'],
    target: 'all' as Notification['target'],
    scheduled_at: '',
    target_users: [] as string[]
  });

  useEffect(() => {
    fetchNotifications();
    fetchStats();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await adminService.getNotifications();
      setNotifications(data || []);
    } catch (error) {
      console.error('获取通知列表失败:', error);
      toast.error('获取通知列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await adminService.getNotificationStats();
      setStats(data || {
        totalSent: 0,
        totalRead: 0,
        totalClick: 0,
        readRate: 0,
        clickRate: 0,
        dailyStats: [],
        typeDistribution: []
      });
    } catch (error) {
      console.error('获取通知统计失败:', error);
    }
  };

  const handleCreateNotification = async () => {
    if (!newNotification.title.trim() || !newNotification.content.trim()) {
      toast.error('请填写标题和内容');
      return;
    }

    try {
      await adminService.createNotification({
        ...newNotification,
        scheduled_at: newNotification.scheduled_at ? new Date(newNotification.scheduled_at).getTime() : undefined
      });
      toast.success('通知创建成功');
      setCurrentView('list');
      setNewNotification({
        title: '',
        content: '',
        type: 'system',
        target: 'all',
        scheduled_at: '',
        target_users: []
      });
      fetchNotifications();
      fetchStats();
    } catch (error) {
      console.error('创建通知失败:', error);
      toast.error('创建通知失败');
    }
  };

  const handleSendNotification = async (id: string) => {
    try {
      await adminService.sendNotification(id);
      toast.success('通知发送成功');
      fetchNotifications();
      fetchStats();
    } catch (error) {
      console.error('发送通知失败:', error);
      toast.error('发送通知失败');
    }
  };

  const handleDeleteNotification = async (id: string) => {
    if (!confirm('确定要删除这条通知吗？')) return;

    try {
      await adminService.deleteNotification(id);
      toast.success('通知删除成功');
      fetchNotifications();
      fetchStats();
    } catch (error) {
      console.error('删除通知失败:', error);
      toast.error('删除通知失败');
    }
  };

  const handleBatchDelete = async () => {
    if (selectedNotifications.size === 0) {
      toast.error('请先选择要删除的通知');
      return;
    }

    if (!confirm(`确定要删除选中的 ${selectedNotifications.size} 条通知吗？`)) return;

    try {
      await Promise.all(Array.from(selectedNotifications).map(id => adminService.deleteNotification(id)));
      toast.success('批量删除成功');
      setSelectedNotifications(new Set());
      fetchNotifications();
      fetchStats();
    } catch (error) {
      console.error('批量删除失败:', error);
      toast.error('批量删除失败');
    }
  };

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedNotifications);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedNotifications(newSelection);
  };

  const toggleAllSelection = () => {
    if (selectedNotifications.size === filteredNotifications.length) {
      setSelectedNotifications(new Set());
    } else {
      setSelectedNotifications(new Set(filteredNotifications.map(n => n.id)));
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || notification.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || notification.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      system: '系统通知',
      activity: '活动通知',
      reminder: '提醒通知',
      marketing: '营销通知'
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      system: 'bg-blue-100 text-blue-600',
      activity: 'bg-green-100 text-green-600',
      reminder: 'bg-yellow-100 text-yellow-600',
      marketing: 'bg-purple-100 text-purple-600'
    };
    return colors[type] || 'bg-gray-100 text-gray-600';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      draft: '草稿',
      scheduled: '已计划',
      sent: '已发送',
      failed: '发送失败'
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-600',
      scheduled: 'bg-yellow-100 text-yellow-600',
      sent: 'bg-green-100 text-green-600',
      failed: 'bg-red-100 text-red-600'
    };
    return colors[status] || 'bg-gray-100 text-gray-600';
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN');
  };

  return (
    <div className="space-y-6">
      {/* 视图切换标签 */}
      <div className="flex justify-between items-center">
        <div className="flex space-x-4 border-b border-gray-200 dark:border-gray-700">
          {[
            { id: 'list', label: '通知列表', icon: 'list' },
            { id: 'stats', label: '发送统计', icon: 'chart-bar' },
            { id: 'create', label: '新建通知', icon: 'plus' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCurrentView(tab.id as any)}
              className={`pb-3 px-2 text-sm font-medium transition-colors relative ${
                currentView === tab.id
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
              }`}
            >
              <i className={`fas fa-${tab.icon} mr-2`}></i>
              {tab.label}
              {currentView === tab.id && (
                <motion.div
                  layoutId="notificationTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600"
                />
              )}
            </button>
          ))}
        </div>

        {currentView === 'list' && selectedNotifications.size > 0 && (
          <button
            onClick={handleBatchDelete}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center"
          >
            <i className="fas fa-trash mr-2"></i>
            删除选中 ({selectedNotifications.size})
          </button>
        )}
      </div>

      {/* 通知列表视图 */}
      {currentView === 'list' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* 筛选栏 */}
          <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className={`relative ${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg`}>
                  <input
                    type="text"
                    placeholder="搜索通知标题或内容..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 pl-10 bg-transparent border-none outline-none text-sm"
                  />
                  <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                </div>
              </div>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className={`px-4 py-2 rounded-lg text-sm ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'} border`}
              >
                <option value="all">所有类型</option>
                <option value="system">系统通知</option>
                <option value="activity">活动通知</option>
                <option value="reminder">提醒通知</option>
                <option value="marketing">营销通知</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`px-4 py-2 rounded-lg text-sm ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'} border`}
              >
                <option value="all">所有状态</option>
                <option value="draft">草稿</option>
                <option value="scheduled">已计划</option>
                <option value="sent">已发送</option>
                <option value="failed">发送失败</option>
              </select>
            </div>
          </div>

          {/* 通知列表 */}
          <div className={`rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm overflow-hidden`}>
            <table className="min-w-full">
              <thead>
                <tr className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedNotifications.size === filteredNotifications.length && filteredNotifications.length > 0}
                      onChange={toggleAllSelection}
                      className="rounded text-red-600 focus:ring-red-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">标题</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">类型</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">目标</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">状态</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">发送时间</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">数据</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center">
                      <i className="fas fa-spinner fa-spin text-2xl text-red-600"></i>
                    </td>
                  </tr>
                ) : filteredNotifications.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center">
                      <div className="text-gray-400">
                        <i className="fas fa-inbox text-4xl mb-2"></i>
                        <p>暂无通知数据</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredNotifications.map((notification) => (
                    <tr key={notification.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedNotifications.has(notification.id)}
                          onChange={() => toggleSelection(notification.id)}
                          className="rounded text-red-600 focus:ring-red-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-sm">{notification.title}</p>
                          <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {notification.content?.substring(0, 50) || '无内容'}...
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${getTypeColor(notification.type)}`}>
                          {getTypeLabel(notification.type)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {notification.target === 'all' ? '全部用户' :
                         notification.target === 'vip' ? 'VIP用户' :
                         `指定用户 (${notification.target_users?.length || 0})`}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(notification.status)}`}>
                          {getStatusLabel(notification.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {notification.sent_at ? formatTime(notification.sent_at) :
                         notification.scheduled_at ? `计划: ${formatTime(notification.scheduled_at)}` :
                         '未发送'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {notification.status === 'sent' ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <i className="fas fa-paper-plane text-blue-500 text-xs"></i>
                              <span>{notification.recipients_count}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <i className="fas fa-eye text-green-500 text-xs"></i>
                              <span>{notification.read_count} ({((notification.read_count / notification.recipients_count) * 100).toFixed(1)}%)</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <i className="fas fa-mouse-pointer text-purple-500 text-xs"></i>
                              <span>{notification.click_count} ({((notification.click_count / notification.recipients_count) * 100).toFixed(1)}%)</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedNotification(notification);
                              setShowDetailModal(true);
                            }}
                            className={`p-1.5 rounded ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
                            title="查看详情"
                          >
                            <i className="fas fa-eye text-blue-500"></i>
                          </button>
                          {notification.status === 'draft' && (
                            <button
                              onClick={() => handleSendNotification(notification.id)}
                              className={`p-1.5 rounded ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
                              title="立即发送"
                            >
                              <i className="fas fa-paper-plane text-green-500"></i>
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteNotification(notification.id)}
                            className={`p-1.5 rounded ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
                            title="删除"
                          >
                            <i className="fas fa-trash text-red-500"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* 统计视图 */}
      {currentView === 'stats' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* 统计卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { title: '总发送量', value: stats.totalSent.toLocaleString(), icon: 'paper-plane', color: 'blue' },
              { title: '总阅读量', value: stats.totalRead.toLocaleString(), icon: 'eye', color: 'green' },
              { title: '总点击量', value: stats.totalClick.toLocaleString(), icon: 'mouse-pointer', color: 'purple' },
              { title: '平均阅读率', value: `${stats.readRate.toFixed(1)}%`, icon: 'chart-line', color: 'yellow' }
            ].map((stat, index) => (
              <div key={index} className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{stat.title}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-full bg-${stat.color}-100 text-${stat.color}-600`}>
                    <i className={`fas fa-${stat.icon} text-lg`}></i>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 趋势图表 */}
          <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
            <h3 className="font-medium mb-4">发送趋势（近7天）</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.dailyStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
                  <XAxis dataKey="date" stroke={isDark ? '#9ca3af' : '#4b5563'} />
                  <YAxis stroke={isDark ? '#9ca3af' : '#4b5563'} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#1f2937' : '#ffffff',
                      borderColor: isDark ? '#374151' : '#e5e7eb',
                      borderRadius: '0.5rem'
                    }}
                  />
                  <Line type="monotone" dataKey="sent" name="发送量" stroke="#f59e0b" strokeWidth={2} />
                  <Line type="monotone" dataKey="read" name="阅读量" stroke="#34d399" strokeWidth={2} />
                  <Line type="monotone" dataKey="click" name="点击量" stroke="#60a5fa" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 类型分布 */}
          <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
            <h3 className="font-medium mb-4">通知类型分布</h3>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.typeDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {stats.typeDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>
      )}

      {/* 新建通知视图 */}
      {currentView === 'create' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}
        >
          <div className="space-y-6 max-w-2xl">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                通知标题
              </label>
              <input
                type="text"
                value={newNotification.title}
                onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
                placeholder="请输入通知标题"
                className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-red-500`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                通知内容
              </label>
              <textarea
                value={newNotification.content}
                onChange={(e) => setNewNotification({ ...newNotification, content: e.target.value })}
                placeholder="请输入通知内容"
                rows={4}
                className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-red-500`}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  通知类型
                </label>
                <select
                  value={newNotification.type}
                  onChange={(e) => setNewNotification({ ...newNotification, type: e.target.value as any })}
                  className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-red-500`}
                >
                  <option value="system">系统通知</option>
                  <option value="activity">活动通知</option>
                  <option value="reminder">提醒通知</option>
                  <option value="marketing">营销通知</option>
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  发送目标
                </label>
                <select
                  value={newNotification.target}
                  onChange={(e) => setNewNotification({ ...newNotification, target: e.target.value as any })}
                  className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-red-500`}
                >
                  <option value="all">全部用户</option>
                  <option value="vip">VIP用户</option>
                  <option value="specific">指定用户</option>
                </select>
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                计划发送时间（可选，留空则立即发送）
              </label>
              <input
                type="datetime-local"
                value={newNotification.scheduled_at}
                onChange={(e) => setNewNotification({ ...newNotification, scheduled_at: e.target.value })}
                className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-red-500`}
              />
            </div>

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setCurrentView('list')}
                className={`px-6 py-2 rounded-lg ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
              >
                取消
              </button>
              <button
                onClick={handleCreateNotification}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                创建通知
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* 详情弹窗 */}
      <AnimatePresence>
        {showDetailModal && selectedNotification && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-xl`}
            >
              <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
                <h3 className="text-xl font-bold">通知详情</h3>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>标题</label>
                  <p className="font-medium">{selectedNotification.title}</p>
                </div>

                <div>
                  <label className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>内容</label>
                  <p className={`mt-1 p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    {selectedNotification.content}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>类型</label>
                    <p>
                      <span className={`px-2 py-1 rounded-full text-xs ${getTypeColor(selectedNotification.type)}`}>
                        {getTypeLabel(selectedNotification.type)}
                      </span>
                    </p>
                  </div>

                  <div>
                    <label className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>状态</label>
                    <p>
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(selectedNotification.status)}`}>
                        {getStatusLabel(selectedNotification.status)}
                      </span>
                    </p>
                  </div>
                </div>

                {selectedNotification.status === 'sent' && (
                  <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <h4 className="font-medium mb-3">发送数据</h4>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold">{selectedNotification.recipients_count}</p>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>接收人数</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{selectedNotification.read_count}</p>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>阅读人数</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{selectedNotification.click_count}</p>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>点击人数</p>
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>阅读率</span>
                          <span>{((selectedNotification.read_count / selectedNotification.recipients_count) * 100).toFixed(1)}%</span>
                        </div>
                        <div className={`h-2 rounded-full ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>
                          <div
                            className="h-2 rounded-full bg-green-500 transition-all"
                            style={{ width: `${(selectedNotification.read_count / selectedNotification.recipients_count) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>点击率</span>
                          <span>{((selectedNotification.click_count / selectedNotification.recipients_count) * 100).toFixed(1)}%</span>
                        </div>
                        <div className={`h-2 rounded-full ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>
                          <div
                            className="h-2 rounded-full bg-blue-500 transition-all"
                            style={{ width: `${(selectedNotification.click_count / selectedNotification.recipients_count) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className={`px-6 py-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} flex justify-end`}>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className={`px-4 py-2 rounded-lg ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
                >
                  关闭
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
