import { useState, useEffect, useContext, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { AuthContext } from '@/contexts/authContext';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { toast } from 'sonner';

interface AuditLog {
  id: string;
  table_name: string;
  record_id: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  old_data?: any;
  new_data?: any;
  changed_by: string;
  changed_by_name?: string;
  changed_by_role?: string;
  created_at: number;
  ip_address?: string;
  user_agent?: string;
  is_sensitive: boolean;
  description?: string;
}

interface TableInfo {
  name: string;
  display_name: string;
  icon: string;
}

const TABLES: TableInfo[] = [
  { name: 'users', display_name: '用户', icon: 'users' },
  { name: 'posts', display_name: '帖子', icon: 'file-image' },
  { name: 'comments', display_name: '评论', icon: 'comment' },
  { name: 'communities', display_name: '社区', icon: 'users-cog' },
  { name: 'activities', display_name: '活动', icon: 'calendar-alt' },
  { name: 'friends', display_name: '好友', icon: 'user-friends' },
  { name: 'favorites', display_name: '收藏', icon: 'star' },
  { name: 'works', display_name: '作品', icon: 'paint-brush' },
  { name: 'events', display_name: '活动', icon: 'calendar-check' },
  { name: 'orders', display_name: '订单', icon: 'shopping-cart' },
];

// 敏感操作类型
const SENSITIVE_OPERATIONS = ['DELETE', 'UPDATE'];
const SENSITIVE_TABLES = ['users', 'orders', 'permissions'];

export default function AuditLog() {
  const { isDark } = useTheme();
  const { user: currentUser } = useContext(AuthContext);
  
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTable, setFilterTable] = useState('all');
  const [filterOperation, setFilterOperation] = useState('all');
  const [filterSensitive, setFilterSensitive] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  
  // 详情弹窗状态
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // 导出状态
  const [isExporting, setIsExporting] = useState(false);
  
  // 统计状态
  const [stats, setStats] = useState({
    total: 0,
    insert: 0,
    update: 0,
    delete: 0,
    sensitive: 0
  });
  
  // 生成操作描述
  const generateDescription = (operation: string, table: string): string => {
    const tableName = TABLES.find(t => t.name === table)?.display_name || table;
    switch (operation) {
      case 'INSERT':
        return `创建了新的${tableName}记录`;
      case 'UPDATE':
        return `更新了${tableName}记录`;
      case 'DELETE':
        return `删除了${tableName}记录`;
      default:
        return `操作了${tableName}`;
    }
  };
  
  // 获取审计日志
  useEffect(() => {
    const fetchAuditLogs = async () => {
      setLoading(true);
      try {
        // 从 Supabase 获取真实的审计日志
        let query = supabaseAdmin
          .from('audit_logs')
          .select('*', { count: 'exact' });
        
        // 应用筛选
        if (filterTable !== 'all') {
          query = query.eq('table_name', filterTable);
        }
        if (filterOperation !== 'all') {
          query = query.eq('operation_type', filterOperation);
        }
        if (dateRange.start) {
          query = query.gte('created_at', new Date(dateRange.start).getTime());
        }
        if (dateRange.end) {
          query = query.lte('created_at', new Date(dateRange.end).getTime());
        }
        
        // 分页
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        
        const { data, error, count } = await query
          .order('created_at', { ascending: sortOrder === 'asc' })
          .range(from, to);
        
        if (error) {
          console.error('获取审计日志失败:', error);
          toast.error('获取审计日志失败');
          return;
        }
        
        // 转换数据格式
        const formattedLogs: AuditLog[] = data?.map((log: any) => {
          const isSensitive = SENSITIVE_OPERATIONS.includes(log.operation_type) && 
                             SENSITIVE_TABLES.includes(log.table_name);
          
          return {
            id: log.id,
            table_name: log.table_name,
            record_id: log.record_id,
            operation: log.operation_type,
            old_data: log.old_data,
            new_data: log.new_data,
            changed_by: log.user_id || 'system',
            changed_by_name: log.user_name || '系统',
            changed_by_role: log.user_role || 'system',
            created_at: log.created_at,
            ip_address: log.ip_address,
            user_agent: log.user_agent,
            is_sensitive: isSensitive,
            description: generateDescription(log.operation_type, log.table_name)
          };
        }) || [];
        
        // 应用搜索筛选
        let filteredLogs = formattedLogs;
        if (searchTerm) {
          const lowerSearch = searchTerm.toLowerCase();
          filteredLogs = formattedLogs.filter(log => 
            log.record_id.toLowerCase().includes(lowerSearch) ||
            log.changed_by_name?.toLowerCase().includes(lowerSearch) ||
            log.description?.toLowerCase().includes(lowerSearch)
          );
        }
        
        // 应用敏感操作筛选
        if (filterSensitive) {
          filteredLogs = filteredLogs.filter(log => log.is_sensitive);
        }
        
        setLogs(filteredLogs);
        setTotalCount(count || 0);
        
        // 获取统计数据
        const { data: statsData } = await supabaseAdmin
          .from('audit_logs')
          .select('operation_type');
        
        const allLogs = statsData || [];
        setStats({
          total: allLogs.length,
          insert: allLogs.filter((l: any) => l.operation_type === 'INSERT').length,
          update: allLogs.filter((l: any) => l.operation_type === 'UPDATE').length,
          delete: allLogs.filter((l: any) => l.operation_type === 'DELETE').length,
          sensitive: allLogs.filter((l: any) => 
            SENSITIVE_OPERATIONS.includes(l.operation_type) && 
            SENSITIVE_TABLES.includes(l.table_name)
          ).length
        });
      } catch (error) {
        console.error('获取审计日志失败:', error);
        toast.error('获取审计日志失败');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAuditLogs();
  }, [filterTable, filterOperation, filterSensitive, searchTerm, dateRange.start, dateRange.end, page, pageSize, sortOrder]);
  
  // 筛选和排序日志
  const filteredAndSortedLogs = logs
    .filter(log => {
      if (filterTable !== 'all' && log.table_name !== filterTable) return false;
      if (filterOperation !== 'all' && log.operation !== filterOperation) return false;
      if (filterSensitive && !log.is_sensitive) return false;
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        if (!log.record_id.toLowerCase().includes(searchLower) && 
            !log.changed_by_name?.toLowerCase().includes(searchLower) &&
            !log.table_name.toLowerCase().includes(searchLower) &&
            !log.description?.toLowerCase().includes(searchLower)) return false;
      }
      if (dateRange.start) {
        const logDate = new Date(log.created_at).toISOString().split('T')[0];
        if (logDate < dateRange.start) return false;
      }
      if (dateRange.end) {
        const logDate = new Date(log.created_at).toISOString().split('T')[0];
        if (logDate > dateRange.end) return false;
      }
      return true;
    })
    .sort((a, b) => {
      let aValue = a[sortBy as keyof AuditLog];
      let bValue = b[sortBy as keyof AuditLog];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      return 0;
    });
  
  // 分页
  const paginatedLogs = filteredAndSortedLogs.slice((page - 1) * pageSize, page * pageSize);
  
  // 格式化时间
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };
  
  // 获取表的显示名称
  const getTableDisplayName = (tableName: string) => {
    const table = TABLES.find(t => t.name === tableName);
    return table?.display_name || tableName;
  };
  
  // 获取表的图标
  const getTableIcon = (tableName: string) => {
    const table = TABLES.find(t => t.name === tableName);
    return table?.icon || 'table';
  };
  
  // 获取操作的显示名称
  const getOperationDisplayName = (operation: string) => {
    switch (operation) {
      case 'INSERT':
        return '创建';
      case 'UPDATE':
        return '更新';
      case 'DELETE':
        return '删除';
      default:
        return operation;
    }
  };
  
  // 获取操作的颜色
  const getOperationColor = (operation: string) => {
    switch (operation) {
      case 'INSERT':
        return 'text-green-500';
      case 'UPDATE':
        return 'text-blue-500';
      case 'DELETE':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };
  
  // 获取操作的背景颜色
  const getOperationBgColor = (operation: string) => {
    switch (operation) {
      case 'INSERT':
        return 'bg-green-100';
      case 'UPDATE':
        return 'bg-blue-100';
      case 'DELETE':
        return 'bg-red-100';
      default:
        return 'bg-gray-100';
    }
  };
  
  // 导出日志为CSV
  const exportLogs = async (format: 'csv' | 'json' = 'csv') => {
    setIsExporting(true);
    try {
      const exportData = filteredAndSortedLogs.map(log => ({
        ID: log.id,
        时间: formatTime(log.created_at),
        表名: getTableDisplayName(log.table_name),
        操作: getOperationDisplayName(log.operation),
        记录ID: log.record_id,
        操作人: log.changed_by_name,
        角色: log.changed_by_role,
        IP地址: log.ip_address,
        描述: log.description,
        敏感操作: log.is_sensitive ? '是' : '否'
      }));
      
      if (format === 'csv') {
        // 生成CSV内容
        const headers = Object.keys(exportData[0] || {});
        const csvContent = [
          headers.join(','),
          ...exportData.map(row => headers.map(h => {
            const value = (row as any)[h];
            // 处理包含逗号或引号的值
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          }).join(','))
        ].join('\n');
        
        // 下载文件
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `审计日志_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
      } else {
        // 导出JSON
        const jsonContent = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `审计日志_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
      }
      
      toast.success(`成功导出 ${exportData.length} 条日志`);
    } catch (error) {
      console.error('导出日志失败:', error);
      toast.error('导出日志失败');
    } finally {
      setIsExporting(false);
    }
  };
  
  // 渲染数据差异
  const renderDataDiff = (oldData?: any, newData?: any) => {
    if (!oldData && !newData) return null;
    
    if (!oldData) {
      return (
        <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-600' : 'bg-gray-100'} text-sm`}>
          <div className="font-medium mb-2">创建数据：</div>
          <pre className={`whitespace-pre-wrap ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            {JSON.stringify(newData, null, 2)}
          </pre>
        </div>
      );
    }
    
    if (!newData) {
      return (
        <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-600' : 'bg-gray-100'} text-sm`}>
          <div className="font-medium mb-2">删除数据：</div>
          <pre className={`whitespace-pre-wrap ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            {JSON.stringify(oldData, null, 2)}
          </pre>
        </div>
      );
    }
    
    // 渲染更新差异
    const getDiff = () => {
      const diff: any = {};
      const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);
      
      allKeys.forEach(key => {
        if (oldData[key] !== newData[key]) {
          diff[key] = {
            old: oldData[key],
            new: newData[key]
          };
        }
      });
      
      return diff;
    };
    
    const diff = getDiff();
    
    return (
      <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-600' : 'bg-gray-100'} text-sm`}>
        <div className="font-medium mb-2">更新差异：</div>
        {Object.entries(diff).map(([key, value]: [string, any]) => (
          <div key={key} className="mb-2">
            <div className="font-medium">{key}：</div>
            <div className="flex gap-2">
              <div className={`flex-1 p-2 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                <div className="text-xs text-red-500 mb-1">旧值：</div>
                <div>{JSON.stringify(value.old)}</div>
              </div>
              <div className={`flex-1 p-2 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                <div className="text-xs text-green-500 mb-1">新值：</div>
                <div>{JSON.stringify(value.new)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  // 计算总页数
  const totalPages = Math.ceil(filteredAndSortedLogs.length / pageSize);
  
  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="flex flex-col items-center gap-4">
          <div className={`w-12 h-12 border-4 ${isDark ? 'border-gray-600 border-t-red-600' : 'border-gray-200 border-t-red-600'} border-t-transparent rounded-full animate-spin`}></div>
          <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>正在加载审计日志...</p>
        </div>
      </div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
    >
      <div className="mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
          <h2 className="text-xl font-bold">审计日志</h2>
          
          {/* 导出按钮 */}
          <div className="flex gap-2">
            <button
              onClick={() => exportLogs('csv')}
              disabled={isExporting || filteredAndSortedLogs.length === 0}
              className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 ${
                isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
              } transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <i className="fas fa-file-csv"></i>
              {isExporting ? '导出中...' : '导出CSV'}
            </button>
            <button
              onClick={() => exportLogs('json')}
              disabled={isExporting || filteredAndSortedLogs.length === 0}
              className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 ${
                isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
              } transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <i className="fas fa-file-code"></i>
              导出JSON
            </button>
          </div>
        </div>
        
        {/* 统计卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {[
            { label: '总记录数', value: stats.total, color: 'blue', icon: 'database' },
            { label: '创建操作', value: stats.insert, color: 'green', icon: 'plus-circle' },
            { label: '更新操作', value: stats.update, color: 'blue', icon: 'edit' },
            { label: '删除操作', value: stats.delete, color: 'red', icon: 'trash' },
            { label: '敏感操作', value: stats.sensitive, color: 'orange', icon: 'exclamation-triangle' },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <i className={`fas fa-${stat.icon} text-${stat.color}-500`}></i>
                <span className={`text-2xl font-bold text-${stat.color}-500`}>{stat.value}</span>
              </div>
              <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{stat.label}</div>
            </motion.div>
          ))}
        </div>
        
        {/* 筛选和搜索 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-1">表名</label>
            <select
              value={filterTable}
              onChange={(e) => setFilterTable(e.target.value)}
              className={`w-full p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} border`}
            >
              <option value="all">全部表</option>
              {TABLES.map(table => (
                <option key={table.name} value={table.name}>
                  {table.display_name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">操作类型</label>
            <select
              value={filterOperation}
              onChange={(e) => setFilterOperation(e.target.value)}
              className={`w-full p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} border`}
            >
              <option value="all">全部操作</option>
              <option value="INSERT">创建</option>
              <option value="UPDATE">更新</option>
              <option value="DELETE">删除</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">搜索</label>
            <div className={`relative ${isDark ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg`}>
              <input
                type="text"
                placeholder="搜索记录ID、用户..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full p-2 pl-10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} border`}
              />
              <i className={`fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}></i>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">筛选</label>
            <label className="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <input
                type="checkbox"
                checked={filterSensitive}
                onChange={(e) => setFilterSensitive(e.target.checked)}
                className="w-4 h-4 rounded text-red-600"
              />
              <span className="text-sm">仅显示敏感操作</span>
            </label>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">日期范围</label>
            <div className="flex gap-2">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className={`flex-1 p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} border`}
              />
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className={`flex-1 p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} border`}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">排序</label>
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={`flex-1 p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} border`}
              >
                <option value="created_at">时间</option>
                <option value="table_name">表名</option>
                <option value="operation">操作类型</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className={`p-2 rounded-lg ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'} border ${isDark ? 'border-gray-600' : 'border-gray-200'}`}
              >
                <i className={`fas ${sortOrder === 'asc' ? 'fa-sort-up' : 'fa-sort-down'}`}></i>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* 日志列表 */}
      <div className={`overflow-x-auto rounded-xl border ${isDark ? 'border-gray-700' : 'border-gray-200'} mb-6`}>
        <table className="min-w-full">
          <thead>
            <tr className={isDark ? 'bg-gray-700' : 'bg-gray-50'}>
              <th className="px-4 py-3 text-left text-sm font-medium">时间</th>
              <th className="px-4 py-3 text-left text-sm font-medium">表名</th>
              <th className="px-4 py-3 text-left text-sm font-medium">操作类型</th>
              <th className="px-4 py-3 text-left text-sm font-medium">记录ID</th>
              <th className="px-4 py-3 text-left text-sm font-medium">操作人</th>
              <th className="px-4 py-3 text-left text-sm font-medium">IP地址</th>
              <th className="px-4 py-3 text-left text-sm font-medium">敏感</th>
              <th className="px-4 py-3 text-left text-sm font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {paginatedLogs.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center">
                  <div className="text-gray-400">
                    <i className="fas fa-file-alt text-4xl mb-2"></i>
                    <p>暂无符合条件的审计日志</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedLogs.map((log) => (
                <tr key={log.id} className={`hover:bg-gray-700/50 ${isDark ? 'bg-gray-800' : 'bg-white'} ${log.is_sensitive ? 'bg-red-50/5' : ''}`}>
                  <td className="px-4 py-3 text-sm">
                    {formatTime(log.created_at)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center">
                      <i className={`fas fa-${getTableIcon(log.table_name)} mr-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}></i>
                      {getTableDisplayName(log.table_name)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${getOperationBgColor(log.operation)} ${getOperationColor(log.operation)}`}>
                      {getOperationDisplayName(log.operation)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-xs">
                    {log.record_id}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div>
                      <div>{log.changed_by_name || log.changed_by}</div>
                      <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{log.changed_by_role}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-xs">
                    {log.ip_address}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {log.is_sensitive ? (
                      <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-600">
                        <i className="fas fa-exclamation-triangle mr-1"></i>敏感
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <button 
                      onClick={() => {
                        setSelectedLog(log);
                        setShowDetailModal(true);
                      }}
                      className={`p-2 rounded ${isDark ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'} transition-colors`}
                    >
                      <i className="fas fa-eye"></i>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* 分页 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="text-sm">
            显示 {paginatedLogs.length} 条，共 {filteredAndSortedLogs.length} 条
          </div>
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
            className={`p-1 rounded text-sm ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'} border`}
          >
            <option value={10}>10条/页</option>
            <option value={20}>20条/页</option>
            <option value={50}>50条/页</option>
            <option value={100}>100条/页</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className={`px-3 py-1 rounded ${isDark ? 'bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800' : 'bg-gray-100 hover:bg-gray-200 disabled:bg-gray-200'} transition-colors disabled:cursor-not-allowed`}
          >
            <i className="fas fa-chevron-left"></i>
          </button>
          <div className="flex gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <button 
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`px-3 py-1 rounded ${page === pageNum ? 'bg-red-600 text-white' : isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
                >
                  {pageNum}
                </button>
              );
            })}
            {totalPages > 5 && (
              <button className={`px-3 py-1 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                ...
              </button>
            )}
            {totalPages > 5 && (
              <button 
                onClick={() => setPage(totalPages)}
                className={`px-3 py-1 rounded ${page === totalPages ? 'bg-red-600 text-white' : isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
              >
                {totalPages}
              </button>
            )}
          </div>
          <button 
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className={`px-3 py-1 rounded ${isDark ? 'bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800' : 'bg-gray-100 hover:bg-gray-200 disabled:bg-gray-200'} transition-colors disabled:cursor-not-allowed`}
          >
            <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>
      
      {/* 详情弹窗 */}
      <AnimatePresence>
        {showDetailModal && selectedLog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4"
            onClick={() => setShowDetailModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-xl p-6`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold mb-1">日志详情</h3>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{selectedLog.id}</p>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              
              {/* 基本信息 */}
              <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'} mb-4`}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>操作时间</div>
                    <div className="font-medium">{formatTime(selectedLog.created_at)}</div>
                  </div>
                  <div>
                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>操作类型</div>
                    <span className={`px-2 py-1 rounded-full text-xs ${getOperationBgColor(selectedLog.operation)} ${getOperationColor(selectedLog.operation)}`}>
                      {getOperationDisplayName(selectedLog.operation)}
                    </span>
                  </div>
                  <div>
                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>目标表</div>
                    <div className="font-medium">{getTableDisplayName(selectedLog.table_name)}</div>
                  </div>
                  <div>
                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>记录ID</div>
                    <div className="font-mono text-sm">{selectedLog.record_id}</div>
                  </div>
                </div>
              </div>
              
              {/* 操作人信息 */}
              <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'} mb-4`}>
                <h4 className="font-medium mb-3">操作人信息</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>用户名</div>
                    <div className="font-medium">{selectedLog.changed_by_name}</div>
                  </div>
                  <div>
                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>角色</div>
                    <div className="font-medium">{selectedLog.changed_by_role}</div>
                  </div>
                  <div>
                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>IP地址</div>
                    <div className="font-mono text-sm">{selectedLog.ip_address}</div>
                  </div>
                  <div>
                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>用户代理</div>
                    <div className="text-xs truncate">{selectedLog.user_agent}</div>
                  </div>
                </div>
              </div>
              
              {/* 操作描述 */}
              {selectedLog.description && (
                <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'} mb-4`}>
                  <h4 className="font-medium mb-2">操作描述</h4>
                  <p>{selectedLog.description}</p>
                </div>
              )}
              
              {/* 敏感操作警告 */}
              {selectedLog.is_sensitive && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 mb-4">
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                    <i className="fas fa-exclamation-triangle"></i>
                    <span className="font-medium">敏感操作警告</span>
                  </div>
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                    此操作涉及敏感数据或高风险操作，请仔细审查。
                  </p>
                </div>
              )}
              
              {/* 数据变更 */}
              <div className="mb-4">
                <h4 className="font-medium mb-3">数据变更</h4>
                {renderDataDiff(selectedLog.old_data, selectedLog.new_data)}
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className={`px-4 py-2 rounded-lg ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
                >
                  关闭
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
