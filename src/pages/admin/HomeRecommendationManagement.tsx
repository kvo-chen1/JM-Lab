import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  homeRecommendationService,
  type HomeRecommendationItem,
  type RecommendationOperationLog,
} from '@/services/homeRecommendationService';
import { workService } from '@/services/workService';
import { eventService } from '@/services/eventService';
import templateService from '@/services/templateService';
import {
  GripVertical,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Undo2,
  Redo2,
  History,
  Image,
  Calendar,
  TrendingUp,
  Search,
  Filter,
  X,
  Save,
  Copy,
  ChevronUp,
  ChevronDown,
  Home,
  FileText,
  Trophy,
  Palette,
} from 'lucide-react';

// 推荐项类型选项
const ITEM_TYPE_OPTIONS = [
  { value: 'work', label: '作品', icon: FileText },
  { value: 'event', label: '活动', icon: Calendar },
  { value: 'template', label: '模板', icon: Palette },
];

const MOCK_WORKS = [
  { id: '1', title: '津门文化创意设计', thumbnail: '/api/placeholder/200/120', author: '张三' },
  { id: '2', title: '传统工艺现代演绎', thumbnail: '/api/placeholder/200/120', author: '李四' },
  { id: '3', title: '城市印象插画系列', thumbnail: '/api/placeholder/200/120', author: '王五' },
];

const MOCK_EVENTS = [
  { id: '101', title: '2026 文化创意大赛', thumbnail: '/api/placeholder/200/120', start_date: '2026-03-01' },
  { id: '102', title: '非遗传承工作坊', thumbnail: '/api/placeholder/200/120', start_date: '2026-03-15' },
];

const MOCK_TEMPLATES = [
  { id: '201', title: '国潮风格模板', thumbnail: '/api/placeholder/200/120', category: '设计' },
  { id: '202', title: '水墨画风格模板', thumbnail: '/api/placeholder/200/120', category: '艺术' },
];

export default function HomeRecommendationManagement() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // 状态管理
  const [recommendations, setRecommendations] = useState<HomeRecommendationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<HomeRecommendationItem | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<HomeRecommendationItem[]>([]);
  const [operationLogs, setOperationLogs] = useState<RecommendationOperationLog[]>([]);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [undoStack, setUndoStack] = useState<any[]>([]);
  const [redoStack, setRedoStack] = useState<any[]>([]);
  const [isReordering, setIsReordering] = useState(false);
  const [selectedItemType, setSelectedItemType] = useState<'work' | 'event' | 'template'>('work');
  const [availableItems, setAvailableItems] = useState<any[]>([]);
  const [loadingAvailableItems, setLoadingAvailableItems] = useState(false);

  // 表单状态
  const [formData, setFormData] = useState({
    item_id: '',
    item_type: 'work' as 'work' | 'event' | 'template',
    title: '',
    description: '',
    thumbnail: '',
    order_index: 0,
    is_active: true,
    start_date: '',
    end_date: '',
    metadata: {},
  });

  // 加载推荐列表
  const loadRecommendations = useCallback(async () => {
    setLoading(true);
    try {
      const result = await homeRecommendationService.getRecommendations({
        page: 1,
        limit: 100,
        item_type: typeFilter === 'all' ? undefined : typeFilter,
        is_active: statusFilter === 'all' ? undefined : statusFilter === 'active',
        search: searchQuery || undefined,
        order_by: 'order_index',
        order_direction: 'asc',
      });

      // 初始化 order_index
      const items = result.items.map((item, index) => ({
        ...item,
        order_index: item.order_index ?? index,
      }));

      setRecommendations(items);
    } catch (error) {
      console.error('加载推荐列表失败:', error);
      toast.error('加载推荐列表失败');
    } finally {
      setLoading(false);
    }
  }, [typeFilter, statusFilter, searchQuery]);

  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  // 加载操作日志
  const loadOperationLogs = useCallback(async () => {
    try {
      const result = await homeRecommendationService.getOperationLogs({
        page: 1,
        limit: 50,
      });
      setOperationLogs(result.logs);
    } catch (error) {
      console.error('加载操作日志失败:', error);
    }
  }, []);

  useEffect(() => {
    if (showLogsModal) {
      loadOperationLogs();
    }
  }, [showLogsModal, loadOperationLogs]);

  // 加载可用项目 (用于添加推荐)
  const loadAvailableItems = useCallback(async () => {
    if (!showAddModal && !editingItem) return;
    
    setLoadingAvailableItems(true);
    try {
      let items: any[] = [];
      
      switch (selectedItemType) {
        case 'work':
          const works = await workService.getAllPublishedWorks(100);
          items = works;
          console.log('[HomeRecommendation] 获取到作品数量:', works.length);
          break;
        case 'event':
          const events = await eventService.getPublishedEvents();
          items = events;
          console.log('[HomeRecommendation] 获取到活动数量:', events.length);
          break;
        case 'template':
          const templates = templateService.getAllTemplates();
          items = templates;
          console.log('[HomeRecommendation] 获取到模板数量:', templates.length);
          break;
      }
      
      setAvailableItems(items);
    } catch (error) {
      console.error('加载可用项目失败:', error);
      // 使用模拟数据作为降级方案
      setAvailableItems([
        ...MOCK_WORKS.map(w => ({ ...w, type: 'work' })),
        ...MOCK_EVENTS.map(e => ({ ...e, type: 'event' })),
        ...MOCK_TEMPLATES.map(t => ({ ...t, type: 'template' })),
      ]);
    } finally {
      setLoadingAvailableItems(false);
    }
  }, [showAddModal, editingItem, selectedItemType]);

  useEffect(() => {
    loadAvailableItems();
  }, [loadAvailableItems]);

  // 处理拖拽排序
  const handleReorder = async (newOrder: HomeRecommendationItem[]) => {
    if (isReordering) return;
    setIsReordering(true);

    // 保存当前状态用于撤销
    const previousState = [...recommendations];
    
    setRecommendations(newOrder);

    try {
      // 更新顺序索引
      const updates = newOrder.map((item, index) => ({
        id: item.id!,
        order_index: index,
      }));

      await homeRecommendationService.reorderRecommendations(
        updates,
        user?.id || 'admin'
      );

      // 添加到撤销栈
      setUndoStack(prev => [
        ...prev,
        {
          type: 'reorder',
          previousState,
          newState: [...newOrder],
          updates,
        },
      ]);
      setRedoStack([]); // 清空重做栈
    } catch (error) {
      console.error('调整顺序失败:', error);
      setRecommendations(previousState); // 恢复原状态
      toast.error('调整顺序失败');
    } finally {
      setIsReordering(false);
    }
  };

  // 打开添加弹窗
  const handleOpenAddModal = () => {
    setFormData({
      item_id: '',
      item_type: 'work',
      title: '',
      description: '',
      thumbnail: '',
      order_index: recommendations.length,
      is_active: true,
      start_date: '',
      end_date: '',
      metadata: {},
    });
    setEditingItem(null);
    setShowAddModal(true);
    setSelectedItemType('work');
  };

  // 打开编辑弹窗
  const handleEdit = (item: HomeRecommendationItem) => {
    setFormData({
      item_id: item.item_id,
      item_type: item.item_type,
      title: item.title,
      description: item.description || '',
      thumbnail: item.thumbnail || '',
      order_index: item.order_index,
      is_active: item.is_active,
      start_date: item.start_date || '',
      end_date: item.end_date || '',
      metadata: item.metadata || {},
    });
    setEditingItem(item);
    setSelectedItemType(item.item_type);
    setShowAddModal(true);
  };

  // 保存推荐项
  const handleSave = async () => {
    if (!formData.title || !formData.item_id) {
      toast.error('请填写必填项');
      return;
    }

    try {
      // 保存前状态用于撤销
      const previousState = [...recommendations];
      let savedItem: HomeRecommendationItem;

      if (editingItem && editingItem.id) {
        // 更新
        savedItem = await homeRecommendationService.updateRecommendation(
          editingItem.id,
          formData,
          user?.id || 'admin'
        );

        setRecommendations(prev =>
          prev.map(item => (item.id === editingItem.id ? { ...item, ...formData } : item))
        );

        setUndoStack(prev => [
          ...prev,
          {
            type: 'update',
            previousState,
            newState: [...recommendations.map(item => (item.id === editingItem.id ? { ...item, ...formData } : item))],
            itemId: editingItem.id,
          },
        ]);
      } else {
        // 新增
        savedItem = await homeRecommendationService.createRecommendation(
          formData,
          user?.id || 'admin'
        );

        setRecommendations(prev => [...prev, savedItem]);

        setUndoStack(prev => [
          ...prev,
          {
            type: 'create',
            previousState,
            newState: [...prev, savedItem],
            itemId: savedItem.id,
          },
        ]);
      }

      setRedoStack([]); // 清空重做栈
      setShowAddModal(false);
      loadRecommendations();
    } catch (error) {
      console.error('保存失败:', error);
    }
  };

  // 删除推荐项
  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`确定要删除推荐项"${title}"吗？`)) return;

    try {
      const previousState = [...recommendations];
      const deletedItem = recommendations.find(item => item.id === id);

      await homeRecommendationService.deleteRecommendation(id, user?.id || 'admin');

      setRecommendations(prev => prev.filter(item => item.id !== id));

      setUndoStack(prev => [
        ...prev,
        {
          type: 'delete',
          previousState,
          deletedItem,
        },
      ]);
      setRedoStack([]);
      loadRecommendations();
    } catch (error) {
      console.error('删除失败:', error);
    }
  };

  // 切换激活状态
  const handleToggleActive = async (id: string) => {
    try {
      const previousState = [...recommendations];
      
      await homeRecommendationService.toggleRecommendationStatus(id, user?.id || 'admin');

      setRecommendations(prev =>
        prev.map(item =>
          item.id === id ? { ...item, is_active: !item.is_active } : item
        )
      );

      setUndoStack(prev => [
        ...prev,
        {
          type: 'toggle',
          previousState,
          itemId: id,
        },
      ]);
      setRedoStack([]);
      loadRecommendations();
    } catch (error) {
      console.error('切换状态失败:', error);
    }
  };

  // 撤销操作
  const handleUndo = async () => {
    if (undoStack.length === 0) {
      toast.warning('没有可撤销的操作');
      return;
    }

    const lastAction = undoStack[undoStack.length - 1];
    const newUndoStack = undoStack.slice(0, -1);

    try {
      switch (lastAction.type) {
        case 'create':
          if (lastAction.itemId) {
            await homeRecommendationService.deleteRecommendation(lastAction.itemId, user?.id || 'admin');
            setRecommendations(lastAction.previousState);
          }
          break;

        case 'delete':
          if (lastAction.deletedItem) {
            await homeRecommendationService.createRecommendation(lastAction.deletedItem, user?.id || 'admin');
            setRecommendations(lastAction.previousState);
          }
          break;

        case 'update':
          setRecommendations(lastAction.previousState);
          // TODO: 恢复数据库中的值
          break;

        case 'reorder':
          await homeRecommendationService.reorderRecommendations(
            lastAction.updates.map((u: any) => ({
              id: u.id,
              order_index: lastAction.previousState.find((i: any) => i.id === u.id)?.order_index || 0,
            })),
            user?.id || 'admin'
          );
          setRecommendations(lastAction.previousState);
          break;

        case 'toggle':
          await homeRecommendationService.toggleRecommendationStatus(lastAction.itemId, user?.id || 'admin');
          setRecommendations(lastAction.previousState);
          break;
      }

      setUndoStack(newUndoStack);
      setRedoStack(prev => [lastAction, ...prev]);
      toast.success('已撤销操作');
    } catch (error) {
      console.error('撤销失败:', error);
      toast.error('撤销失败');
    }
  };

  // 重做操作
  const handleRedo = async () => {
    if (redoStack.length === 0) {
      toast.warning('没有可重做的操作');
      return;
    }

    const nextAction = redoStack[0];
    const newRedoStack = redoStack.slice(1);

    try {
      switch (nextAction.type) {
        case 'create':
          if (nextAction.deletedItem) {
            await homeRecommendationService.createRecommendation(nextAction.deletedItem, user?.id || 'admin');
            setRecommendations(nextAction.newState);
          }
          break;

        case 'delete':
          if (nextAction.itemId) {
            await homeRecommendationService.deleteRecommendation(nextAction.itemId, user?.id || 'admin');
            setRecommendations(nextAction.newState);
          }
          break;

        case 'update':
          setRecommendations(nextAction.newState);
          break;

        case 'reorder':
          await homeRecommendationService.reorderRecommendations(nextAction.updates, user?.id || 'admin');
          setRecommendations(nextAction.newState);
          break;

        case 'toggle':
          await homeRecommendationService.toggleRecommendationStatus(nextAction.itemId, user?.id || 'admin');
          setRecommendations(nextAction.newState);
          break;
      }

      setUndoStack(prev => [...prev, nextAction]);
      setRedoStack(newRedoStack);
      toast.success('已重做操作');
    } catch (error) {
      console.error('重做失败:', error);
      toast.error('重做失败');
    }
  };

  // 预览功能
  const handlePreview = () => {
    setPreviewData([...recommendations].sort((a, b) => a.order_index - b.order_index));
    setShowPreview(true);
  };

  // 选择可用项目
  const handleSelectItem = (item: any) => {
    setFormData(prev => ({
      ...prev,
      item_id: item.id,
      title: item.title,
      thumbnail: item.thumbnail || item.cover_image || '',
      description: item.description || item.content || '',
    }));
  };

  // 获取类型图标
  const getTypeIcon = (type: string) => {
    const option = ITEM_TYPE_OPTIONS.find(opt => opt.value === type);
    const Icon = option?.icon || FileText;
    return <Icon className="w-4 h-4" />;
  };

  // 获取类型名称
  const getTypeLabel = (type: string) => {
    const option = ITEM_TYPE_OPTIONS.find(opt => opt.value === type);
    return option?.label || type;
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* 顶部操作栏 */}
      <div className={`sticky top-0 z-10 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b shadow-sm`}>
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">首页推荐位管理</h1>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                可视化拖拽排序，管理首页推荐内容
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleUndo}
                disabled={undoStack.length === 0}
                className={`p-2 rounded-lg transition-colors ${
                  undoStack.length === 0
                    ? 'opacity-50 cursor-not-allowed'
                    : isDark
                    ? 'hover:bg-gray-700'
                    : 'hover:bg-gray-100'
                }`}
                title="撤销"
              >
                <Undo2 className="w-5 h-5" />
              </button>
              <button
                onClick={handleRedo}
                disabled={redoStack.length === 0}
                className={`p-2 rounded-lg transition-colors ${
                  redoStack.length === 0
                    ? 'opacity-50 cursor-not-allowed'
                    : isDark
                    ? 'hover:bg-gray-700'
                    : 'hover:bg-gray-100'
                }`}
                title="重做"
              >
                <Redo2 className="w-5 h-5" />
              </button>
              <button
                onClick={handlePreview}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isDark
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-blue-500 hover:bg-blue-600'
                } text-white`}
              >
                <Eye className="w-4 h-4" />
                <span>预览</span>
              </button>
              <button
                onClick={handleOpenAddModal}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isDark
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-green-500 hover:bg-green-600'
                } text-white`}
              >
                <Plus className="w-4 h-4" />
                <span>添加推荐</span>
              </button>
            </div>
          </div>

          {/* 筛选栏 */}
          <div className="flex items-center gap-4">
            <div className={`flex-1 relative ${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg`}>
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
              <input
                type="text"
                placeholder="搜索推荐项..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 bg-transparent border-none outline-none ${
                  isDark ? 'text-white placeholder-gray-400' : 'text-gray-900 placeholder-gray-500'
                }`}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Filter className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                className={`px-3 py-2 rounded-lg border-none outline-none ${
                  isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'
                }`}
              >
                <option value="all">全部类型</option>
                {ITEM_TYPE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className={`px-3 py-2 rounded-lg border-none outline-none ${
                  isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'
                }`}
              >
                <option value="all">全部状态</option>
                <option value="active">已激活</option>
                <option value="inactive">已停用</option>
              </select>

              <button
                onClick={() => setShowLogsModal(true)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isDark
                    ? 'bg-gray-700 hover:bg-gray-600'
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                <History className="w-4 h-4" />
                <span>操作日志</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 推荐列表 */}
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${isDark ? 'border-blue-400' : 'border-blue-500'}`}></div>
          </div>
        ) : recommendations.length === 0 ? (
          <div className={`text-center py-20 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            <Home className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">暂无推荐项</p>
            <p className="text-sm mt-2">点击右上角"添加推荐"开始管理</p>
          </div>
        ) : (
          <Reorder.Group
            axis="y"
            values={recommendations}
            onReorder={handleReorder}
            className="space-y-3"
          >
            <AnimatePresence>
              {recommendations.map((item) => (
                <Reorder.Item
                  key={item.id}
                  value={item}
                  id={item.id}
                  className={`relative group ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm border ${
                    isDark ? 'border-gray-700' : 'border-gray-200'
                  } overflow-hidden`}
                  whileDrag={{ scale: 1.02, zIndex: 50 }}
                  dragListener={!isReordering}
                >
                  <div className="flex items-center gap-4 p-4">
                    {/* 拖拽手柄 */}
                    <div
                      className={`cursor-grab active:cursor-grabbing p-2 rounded-lg transition-colors ${
                        isDark
                          ? 'hover:bg-gray-700 text-gray-400'
                          : 'hover:bg-gray-100 text-gray-500'
                      }`}
                    >
                      <GripVertical className="w-5 h-5" />
                    </div>

                    {/* 缩略图 */}
                    <div className={`w-24 h-16 rounded-lg overflow-hidden flex-shrink-0 relative ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      {(() => {
                        const videoUrl = item.metadata?.video_url || item.metadata?.video;
                        const thumb = item.thumbnail || item.metadata?.thumbnail;
                        const isVideo = !!videoUrl;

                        if (isVideo && videoUrl) {
                          return (
                            <>
                              <video
                                src={videoUrl}
                                className="w-full h-full object-cover"
                                muted
                                loop
                                autoPlay
                                playsInline
                                onError={(e) => {
                                  (e.target as HTMLVideoElement).style.display = 'none';
                                }}
                              />
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-8 h-8 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                                  <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z"/>
                                  </svg>
                                </div>
                              </div>
                            </>
                          );
                        }

                        if (thumb) {
                          return (
                            <img
                              src={thumb}
                              alt={item.title}
                              className="w-full h-full object-cover"
                              onError={e => {
                                (e.target as HTMLImageElement).src = '/api/placeholder/96/64';
                              }}
                            />
                          );
                        }

                        return (
                          <div className="w-full h-full flex items-center justify-center">
                            <Image className={`w-6 h-6 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                          </div>
                        );
                      })()}
                    </div>

                    {/* 内容 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`flex items-center gap-1 px-2 py-0.5 text-xs rounded ${
                          isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {getTypeIcon(item.item_type)}
                          {getTypeLabel(item.item_type)}
                        </span>
                        {item.is_active ? (
                          <span className="flex items-center gap-1 px-2 py-0.5 text-xs rounded bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                            <TrendingUp className="w-3 h-3" />
                            已激活
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                            已停用
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold truncate">{item.title}</h3>
                      {item.description && (
                        <p className={`text-sm truncate ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {item.description}
                        </p>
                      )}
                      <div className={`flex items-center gap-4 text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        <span>排序：{item.order_index}</span>
                        {item.click_count !== undefined && (
                          <span>点击：{item.click_count}</span>
                        )}
                        {item.impression_count !== undefined && (
                          <span>曝光：{item.impression_count}</span>
                        )}
                      </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleToggleActive(item.id!)}
                        className={`p-2 rounded-lg transition-colors ${
                          isDark
                            ? 'hover:bg-gray-700 text-gray-400'
                            : 'hover:bg-gray-100 text-gray-500'
                        }`}
                        title={item.is_active ? '停用' : '激活'}
                      >
                        {item.is_active ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleEdit(item)}
                        className={`p-2 rounded-lg transition-colors ${
                          isDark
                            ? 'hover:bg-gray-700 text-blue-400'
                            : 'hover:bg-gray-100 text-blue-500'
                        }`}
                        title="编辑"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id!, item.title)}
                        className={`p-2 rounded-lg transition-colors ${
                          isDark
                            ? 'hover:bg-gray-700 text-red-400'
                            : 'hover:bg-gray-100 text-red-500'
                        }`}
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* 排序指示器 */}
                    <div className={`flex flex-col ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                      <ChevronUp className="w-4 h-4" />
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>
                </Reorder.Item>
              ))}
            </AnimatePresence>
          </Reorder.Group>
        )}
      </div>

      {/* 添加/编辑弹窗 */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl ${
                isDark ? 'bg-gray-800' : 'bg-white'
              } shadow-2xl`}
            >
              <div className={`sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b ${
                isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
              }`}>
                <h2 className="text-xl font-bold">
                  {editingItem ? '编辑推荐项' : '添加推荐项'}
                </h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className={`p-2 rounded-lg transition-colors ${
                    isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* 选择项目类型 */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    项目类型 *
                  </label>
                  <div className="grid grid-cols-4 gap-3">
                    {ITEM_TYPE_OPTIONS.map(opt => {
                      const Icon = opt.icon;
                      return (
                        <button
                          key={opt.value}
                          onClick={() => {
                            setSelectedItemType(opt.value as any);
                            setFormData(prev => ({ ...prev, item_type: opt.value as any }));
                          }}
                          className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                            selectedItemType === opt.value
                              ? isDark
                                ? 'border-blue-500 bg-blue-900 bg-opacity-20'
                                : 'border-blue-500 bg-blue-50'
                              : isDark
                              ? 'border-gray-700 hover:border-gray-600'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <Icon className={`w-6 h-6 ${
                            selectedItemType === opt.value
                              ? 'text-blue-500'
                              : isDark
                              ? 'text-gray-400'
                              : 'text-gray-500'
                          }`} />
                          <span className="text-sm font-medium">{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 选择具体项目 */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    选择{getTypeLabel(selectedItemType)} *
                  </label>
                  {loadingAvailableItems ? (
                    <div className="flex items-center justify-center py-8">
                      <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${isDark ? 'border-blue-400' : 'border-blue-500'}`}></div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                      {availableItems.map(item => {
                        const videoUrl = item.video_url || item.content?.video_url || item.metadata?.video_url;
                        const thumbnail = item.thumbnail || item.cover_image || item.image_url || item.thumbnail_url;
                        const isVideo = !!videoUrl;

                        return (
                          <button
                            key={item.id}
                            onClick={() => handleSelectItem(item)}
                            className={`flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                              formData.item_id === item.id
                                ? isDark
                                  ? 'border-blue-500 bg-blue-900 bg-opacity-20'
                                  : 'border-blue-500 bg-blue-50'
                                : isDark
                                ? 'border-gray-700 hover:border-gray-600'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className={`w-12 h-12 rounded overflow-hidden flex-shrink-0 relative ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                              {isVideo && videoUrl ? (
                                <video
                                  src={videoUrl}
                                  className="w-full h-full object-cover"
                                  muted
                                  loop
                                  autoPlay
                                  playsInline
                                  onLoadedData={(e) => {
                                    // 视频加载成功
                                  }}
                                  onWaiting={() => {
                                    // 视频等待加载
                                  }}
                                  onPlaying={() => {
                                    // 视频开始播放
                                  }}
                                  onError={(e) => {
                                    // 视频加载失败
                                    (e.target as HTMLVideoElement).style.display = 'none';
                                    const fallback = e.currentTarget.parentElement?.querySelector('.fallback-image');
                                    if (fallback) {
                                      fallback.style.display = 'flex';
                                    }
                                  }}
                                />
                              ) : null}
                              {!isVideo || !videoUrl ? (
                                thumbnail ? (
                                  <img
                                    src={thumbnail}
                                    alt={item.title}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = '/api/placeholder/48/48';
                                    }}
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Image className={`w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                                  </div>
                                )
                              ) : null}
                              {isVideo && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                  <div className="w-6 h-6 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                                    <svg className="w-3 h-3 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M8 5v14l11-7z"/>
                                    </svg>
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate text-sm">{item.title}</p>
                              {item.author && (
                                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                  {item.author}
                                </p>
                              )}
                              {isVideo && (
                                <span className="text-xs text-blue-500">视频</span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 标题 */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    标题 *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="输入标题"
                    className={`w-full px-4 py-2 rounded-lg border outline-none transition-colors ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 focus:border-blue-500'
                        : 'bg-white border-gray-300 focus:border-blue-500'
                    }`}
                  />
                </div>

                {/* 描述 */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    描述
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="输入描述（可选）"
                    rows={3}
                    className={`w-full px-4 py-2 rounded-lg border outline-none transition-colors resize-none ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 focus:border-blue-500'
                        : 'bg-white border-gray-300 focus:border-blue-500'
                    }`}
                  />
                </div>

                {/* 缩略图 URL */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    缩略图 URL
                  </label>
                  <input
                    type="text"
                    value={formData.thumbnail}
                    onChange={e => setFormData(prev => ({ ...prev, thumbnail: e.target.value }))}
                    placeholder="输入缩略图 URL"
                    className={`w-full px-4 py-2 rounded-lg border outline-none transition-colors ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 focus:border-blue-500'
                        : 'bg-white border-gray-300 focus:border-blue-500'
                    }`}
                  />
                  {formData.thumbnail && (
                    <div className={`mt-2 w-32 h-20 rounded-lg overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <img
                        src={formData.thumbnail}
                        alt="预览"
                        className="w-full h-full object-cover"
                        onError={e => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* 日期范围 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      开始日期
                    </label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={e => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                      className={`w-full px-4 py-2 rounded-lg border outline-none transition-colors ${
                        isDark
                          ? 'bg-gray-700 border-gray-600 focus:border-blue-500'
                          : 'bg-white border-gray-300 focus:border-blue-500'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      结束日期
                    </label>
                    <input
                      type="date"
                      value={formData.end_date}
                      onChange={e => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                      className={`w-full px-4 py-2 rounded-lg border outline-none transition-colors ${
                        isDark
                          ? 'bg-gray-700 border-gray-600 focus:border-blue-500'
                          : 'bg-white border-gray-300 focus:border-blue-500'
                      }`}
                    />
                  </div>
                </div>

                {/* 激活状态 */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={e => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="is_active" className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    立即激活
                  </label>
                </div>
              </div>

              <div className={`sticky bottom-0 flex items-center justify-end gap-3 px-6 py-4 border-t ${
                isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
              }`}>
                <button
                  onClick={() => setShowAddModal(false)}
                  className={`px-6 py-2 rounded-lg transition-colors ${
                    isDark
                      ? 'bg-gray-700 hover:bg-gray-600'
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  取消
                </button>
                <button
                  onClick={handleSave}
                  className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-colors ${
                    isDark
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-blue-500 hover:bg-blue-600'
                  } text-white`}
                >
                  <Save className="w-4 h-4" />
                  <span>{editingItem ? '保存' : '添加'}</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 预览弹窗 */}
      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
            onClick={() => setShowPreview(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className={`w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl ${
                isDark ? 'bg-gray-800' : 'bg-white'
              } shadow-2xl`}
            >
              <div className={`sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b ${
                isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
              }`}>
                <h2 className="text-xl font-bold">首页推荐预览</h2>
                <button
                  onClick={() => setShowPreview(false)}
                  className={`p-2 rounded-lg transition-colors ${
                    isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {previewData.map((item, index) => (
                    <div
                      key={item.id}
                      className={`rounded-xl overflow-hidden border ${
                        isDark ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className={`aspect-video ${isDark ? 'bg-gray-600' : 'bg-gray-200'} relative`}>
                        {(item.thumbnail || item.metadata?.thumbnail) ? (
                          <img
                            src={item.thumbnail || item.metadata?.thumbnail}
                            alt={item.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/api/placeholder/320/180';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Image className={`w-8 h-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                          </div>
                        )}
                        <div className="absolute top-2 left-2 px-2 py-1 bg-black bg-opacity-70 text-white text-xs rounded">
                          #{index + 1}
                        </div>
                      </div>
                      <div className="p-3">
                        <div className="flex items-center gap-1 mb-1">
                          {getTypeIcon(item.item_type)}
                          <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {getTypeLabel(item.item_type)}
                          </span>
                        </div>
                        <h3 className="font-medium text-sm truncate">{item.title}</h3>
                        {!item.is_active && (
                          <p className="text-xs text-red-500 mt-1">已停用</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {previewData.length === 0 && (
                  <div className={`text-center py-20 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    <Home className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">暂无推荐项</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 操作日志弹窗 */}
      <AnimatePresence>
        {showLogsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
            onClick={() => setShowLogsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className={`w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl ${
                isDark ? 'bg-gray-800' : 'bg-white'
              } shadow-2xl`}
            >
              <div className={`sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b ${
                isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
              }`}>
                <h2 className="text-xl font-bold">操作日志</h2>
                <button
                  onClick={() => setShowLogsModal(false)}
                  className={`p-2 rounded-lg transition-colors ${
                    isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                {operationLogs.length === 0 ? (
                  <div className={`text-center py-20 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    <History className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">暂无操作记录</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {operationLogs.map(log => (
                      <div
                        key={log.id}
                        className={`p-4 rounded-lg border ${
                          isDark ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 text-xs rounded ${
                              log.operation_type === 'create'
                                ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                : log.operation_type === 'delete'
                                ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                                : log.operation_type === 'update'
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                                : log.operation_type === 'reorder'
                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                                : 'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300'
                            }`}>
                              {log.operation_type}
                            </span>
                            <span className="font-medium">{log.item_id}</span>
                          </div>
                          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {log.operated_at ? new Date(log.operated_at).toLocaleString('zh-CN') : '-'}
                          </span>
                        </div>
                        {log.notes && (
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {log.notes}
                          </p>
                        )}
                        <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          操作人：{log.operated_by}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
