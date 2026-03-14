import React, { useState, useEffect } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import { historyService, HistoryFilter } from '@/services/historyService';

export default function OperationHistory() {
  const { isDark } = useTheme();
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<HistoryFilter>({});
  const [keyword, setKeyword] = useState('');

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      // Use historyService to fetch data (merges server and local pending)
      const items = await historyService.getHistory(filter);
      
      const formattedItems = items.map(item => ({
        id: item.id || `local_${item.timestamp}`,
        type: 'history',
        operationType: item.action_type,
        status: item.synced === false ? 'pending' : 'synced', // If synced is undefined (from server), it's synced
        data: item.content,
        createdAt: item.timestamp,
        syncedAt: item.synced !== false ? item.timestamp : undefined,
        isServer: !!item.id
      }));
      
      setHistory(formattedItems);
    } catch (e) {
      console.error('Failed to load history', e);
      toast.error('加载历史记录失败');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
    const interval = setInterval(loadHistory, 30000); // Auto refresh
    return () => clearInterval(interval);
  }, [filter]); // Reload when filter changes

  const handleSearch = () => {
    setFilter(prev => ({ ...prev, keyword }));
  };

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
        + "Time,Action,Content\n"
        + history.map(e => `${new Date(e.createdAt).toLocaleString()},${e.operationType},${JSON.stringify(e.data).replace(/,/g, ' ')}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "history_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ... (keep helper functions like getStatusIcon, getStatusText, formatTime)

  const getActionDescription = (item: any) => {
      // Generic description based on content
      if (item.data?.description) return item.data.description;
      if (item.data?.title) return `${item.operationType}: ${item.data.title}`;
      return `${item.operationType}`;
  };

  // Helper functions
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return 'fa-clock text-yellow-500';
      case 'syncing': return 'fa-spinner fa-spin text-blue-500';
      case 'synced': return 'fa-check-circle text-green-500';
      case 'failed': return 'fa-times-circle text-red-500';
      default: return 'fa-question-circle text-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '等待同步';
      case 'syncing': return '正在同步';
      case 'synced': return '已同步';
      case 'failed': return '同步失败';
      default: return '未知状态';
    }
  };

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className={`rounded-xl p-4 shadow-sm border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
      <div className="flex flex-col gap-4 mb-4">
        <div className="flex justify-between items-center">
          <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-300 flex items-center">
            <i className="fas fa-history text-purple-500 mr-2"></i>
            操作历史
          </h4>
          <div className="flex gap-2">
             <button onClick={handleExport} className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600">
               导出
             </button>
             <button onClick={loadHistory} className="text-xs text-gray-500 hover:text-purple-500">
               <i className={`fas fa-sync ${isLoading ? 'fa-spin' : ''}`}></i>
             </button>
          </div>
        </div>
        
        <div className="flex gap-2">
            <input 
                type="text" 
                placeholder="搜索关键词..." 
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="text-xs p-1 rounded border flex-1"
            />
            <button onClick={handleSearch} className="text-xs bg-gray-200 px-2 rounded">搜索</button>
        </div>
      </div>

      <div className="space-y-3 max-h-60 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
        {history.length === 0 ? (
          <div className="text-center py-8 text-xs text-gray-500 dark:text-gray-400">
            <i className="fas fa-clipboard-list mb-2 text-2xl opacity-50"></i>
            <p>暂无操作记录</p>
          </div>
        ) : (
          history.map((item) => (
            <div 
              key={item.id}
              className={`flex items-start gap-3 p-3 rounded-lg ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100'} border transition-all hover:shadow-md`}
            >
              <div className="flex-shrink-0 mt-0.5">
                <i className={`${getStatusIcon(item.status)}`}></i>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <p className="text-xs font-medium text-gray-800 dark:text-gray-200">
                    {getActionDescription(item)}
                  </p>
                  <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                    {formatTime(item.createdAt)}
                  </span>
                </div>
                
                {item.error && (
                  <p className="text-[10px] text-red-500 mt-1 break-all">
                    {item.error}
                  </p>
                )}
                
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                    item.status === 'synced' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                    item.status === 'failed' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                    item.status === 'syncing' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                    'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'
                  }`}>
                    {getStatusText(item.status)}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
