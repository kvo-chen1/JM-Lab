import { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { AuthContext } from '@/contexts/authContext';
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
  created_at: number;
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
  { name: 'favorites', display_name: '收藏', icon: 'star' }
];

export default function AuditLog() {
  const { isDark } = useTheme();
  const { user: currentUser } = useContext(AuthContext);
  
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTable, setFilterTable] = useState('all');
  const [filterOperation, setFilterOperation] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  
  // 获取审计日志
  useEffect(() => {
    const fetchAuditLogs = async () => {
      setLoading(true);
      try {
        // 模拟API调用，实际项目中替换为真实API
        const response = await fetch('/api/admin/audit-logs', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setLogs(data.logs || []);
          setTotalCount(data.total || 0);
        } else {
          // 模拟数据
          setLogs([
            {
              id: '1',
              table_name: 'users',
              record_id: 'user1',
              operation: 'INSERT',
              new_data: {
                id: 'user1',
                username: 'user1',
                email: 'user1@example.com',
                created_at: Date.now() - 86400000 * 7
              },
              changed_by: 'system',
              changed_by_name: '系统',
              created_at: Date.now() - 86400000 * 7
            },
            {
              id: '2',
              table_name: 'posts',
              record_id: 'post1',
              operation: 'INSERT',
              new_data: {
                id: 'post1',
                title: '国潮插画设计',
                content: '这是一幅国潮插画设计',
                user_id: 'user1',
                created_at: Date.now() - 86400000 * 6
              },
              changed_by: 'user1',
              changed_by_name: 'user1',
              created_at: Date.now() - 86400000 * 6
            },
            {
              id: '3',
              table_name: 'users',
              record_id: 'user1',
              operation: 'UPDATE',
              old_data: {
                membership_level: 'free'
              },
              new_data: {
                membership_level: 'premium'
              },
              changed_by: 'admin1',
              changed_by_name: '管理员1',
              created_at: Date.now() - 86400000 * 5
            },
            {
              id: '4',
              table_name: 'comments',
              record_id: 'comment1',
              operation: 'INSERT',
              new_data: {
                id: 'comment1',
                post_id: 'post1',
                user_id: 'user2',
                content: '这个设计很棒！',
                created_at: Date.now() - 86400000 * 4
              },
              changed_by: 'user2',
              changed_by_name: 'user2',
              created_at: Date.now() - 86400000 * 4
            },
            {
              id: '5',
              table_name: 'posts',
              record_id: 'post2',
              operation: 'DELETE',
              old_data: {
                id: 'post2',
                title: '测试帖子',
                content: '这是一个测试帖子',
                user_id: 'user3',
                created_at: Date.now() - 86400000 * 3
              },
              changed_by: 'admin1',
              changed_by_name: '管理员1',
              created_at: Date.now() - 86400000 * 2
            }
          ]);
          setTotalCount(5);
        }
      } catch (error) {
        console.error('获取审计日志失败:', error);
        toast.error('获取审计日志失败');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAuditLogs();
  }, [filterTable, filterOperation, searchTerm, sortBy, sortOrder, dateRange, page, pageSize]);
  
  // 筛选和排序日志
  const filteredAndSortedLogs = logs
    .filter(log => {
      if (filterTable !== 'all' && log.table_name !== filterTable) return false;
      if (filterOperation !== 'all' && log.operation !== filterOperation) return false;
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        if (!log.record_id.toLowerCase().includes(searchLower) && 
            !log.changed_by_name?.toLowerCase().includes(searchLower) &&
            !log.table_name.toLowerCase().includes(searchLower)) return false;
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
        <h2 className="text-xl font-bold mb-4">审计日志</h2>
        
        {/* 筛选和搜索 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
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
      
      {/* 日志统计 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>总记录数</div>
          <div className="text-2xl font-bold">{filteredAndSortedLogs.length}</div>
        </div>
        <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>创建操作</div>
          <div className="text-2xl font-bold">{filteredAndSortedLogs.filter(log => log.operation === 'INSERT').length}</div>
        </div>
        <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>更新操作</div>
          <div className="text-2xl font-bold">{filteredAndSortedLogs.filter(log => log.operation === 'UPDATE').length}</div>
        </div>
        <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>删除操作</div>
          <div className="text-2xl font-bold">{filteredAndSortedLogs.filter(log => log.operation === 'DELETE').length}</div>
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
              <th className="px-4 py-3 text-left text-sm font-medium">详情</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {paginatedLogs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center">
                  <div className="text-gray-400">
                    <i className="fas fa-file-alt text-4xl mb-2"></i>
                    <p>暂无符合条件的审计日志</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedLogs.map((log) => (
                <tr key={log.id} className={`hover:bg-gray-700/50 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
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
                  <td className="px-4 py-3 text-sm">
                    {log.record_id}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {log.changed_by_name || log.changed_by}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <button 
                      onClick={() => {
                        // 展开详情
                        const details = renderDataDiff(log.old_data, log.new_data);
                        // 在实际项目中，可以使用模态框展示详情
                        console.log('Log details:', log);
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
        <div className="text-sm">
          显示 {paginatedLogs.length} 条，共 {filteredAndSortedLogs.length} 条
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
    </motion.div>
  );
}
