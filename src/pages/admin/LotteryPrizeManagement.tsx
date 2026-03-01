/**
 * 转盘奖品管理页面
 * 用于管理上架转盘的奖励与转盘内容配置
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import {
  lotteryAdminService,
  type LotteryActivity,
  type LotteryPrize,
} from '@/services/lotteryAdminService';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Check,
  AlertCircle,
  Package,
  Percent,
  Coins,
  GripVertical,
  Eye,
  Settings,
  ArrowLeft,
  RefreshCw,
  Upload,
} from 'lucide-react';

// 转盘颜色配置
const WHEEL_COLORS = [
  { color: '#EF4444', textColor: '#FFFFFF' },
  { color: '#F97316', textColor: '#FFFFFF' },
  { color: '#EAB308', textColor: '#FFFFFF' },
  { color: '#22C55E', textColor: '#FFFFFF' },
  { color: '#3B82F6', textColor: '#FFFFFF' },
  { color: '#A855F7', textColor: '#FFFFFF' },
  { color: '#EC4899', textColor: '#FFFFFF' },
  { color: '#DC2626', textColor: '#FFFFFF' },
  { color: '#14B8A6', textColor: '#FFFFFF' },
  { color: '#F59E0B', textColor: '#FFFFFF' },
  { color: '#6366F1', textColor: '#FFFFFF' },
  { color: '#84CC16', textColor: '#FFFFFF' },
];

export default function LotteryPrizeManagement() {
  const { isDark } = useTheme();

  // 状态管理
  const [activities, setActivities] = useState<LotteryActivity[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<LotteryActivity | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // 奖品编辑状态
  const [editingPrizes, setEditingPrizes] = useState<LotteryPrize[]>([]);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  // 筛选状态
  const [filter, setFilter] = useState({
    keyword: '',
    status: '',
  });

  // 弹窗状态
  const [showPrizeModal, setShowPrizeModal] = useState(false);
  const [editingPrize, setEditingPrize] = useState<LotteryPrize | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // 加载活动列表
  const loadActivities = useCallback(async () => {
    setLoading(true);
    try {
      const result = await lotteryAdminService.getActivities(
        {
          keyword: filter.keyword || undefined,
          status: filter.status || undefined,
        },
        1,
        100
      );
      setActivities(result.data);
    } catch (error) {
      console.error('加载活动列表失败:', error);
      toast.error('加载活动列表失败');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  // 初始加载
  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  // 选择活动进行奖品管理
  const handleSelectActivity = (activity: LotteryActivity) => {
    setSelectedActivity(activity);
    setEditingPrizes([...activity.prizes]);
  };

  // 返回活动列表
  const handleBackToList = () => {
    setSelectedActivity(null);
    setEditingPrizes([]);
  };

  // 添加奖品
  const handleAddPrize = () => {
    const newPrize: LotteryPrize = {
      id: `temp-${Date.now()}`,
      name: '',
      description: '',
      probability: 0,
      points: 0,
      stock: -1,
      sortOrder: editingPrizes.length,
      isEnabled: true,
      isRare: false,
    };
    setEditingPrize(newPrize);
    setEditingIndex(null);
    setShowPrizeModal(true);
  };

  // 编辑奖品
  const handleEditPrize = (prize: LotteryPrize, index: number) => {
    setEditingPrize({ ...prize });
    setEditingIndex(index);
    setShowPrizeModal(true);
  };

  // 删除奖品
  const handleDeletePrize = (index: number) => {
    if (!confirm('确定要删除这个奖品吗？')) return;
    const newPrizes = editingPrizes.filter((_, i) => i !== index);
    // 重新排序
    newPrizes.forEach((prize, i) => {
      prize.sortOrder = i;
    });
    setEditingPrizes(newPrizes);
    toast.success('奖品已删除');
  };

  // 保存奖品编辑
  const handleSavePrize = () => {
    if (!editingPrize) return;

    if (!editingPrize.name.trim()) {
      toast.error('请输入奖品名称');
      return;
    }

    if (editingIndex !== null) {
      // 更新现有奖品
      const newPrizes = [...editingPrizes];
      newPrizes[editingIndex] = editingPrize;
      setEditingPrizes(newPrizes);
    } else {
      // 添加新奖品
      setEditingPrizes([...editingPrizes, editingPrize]);
    }

    setShowPrizeModal(false);
    setEditingPrize(null);
    setEditingIndex(null);
    toast.success('奖品已保存');
  };

  // 保存所有奖品配置
  const handleSaveAllPrizes = async () => {
    if (!selectedActivity) return;

    // 验证概率总和
    const totalProb = editingPrizes.reduce((sum, p) => sum + p.probability, 0);
    if (Math.abs(totalProb - 1) > 0.001) {
      toast.error(`奖品总概率必须等于100%，当前为${(totalProb * 100).toFixed(1)}%`);
      return;
    }

    // 验证奖品数量
    if (editingPrizes.length < 2) {
      toast.error('至少需要2个奖品');
      return;
    }

    setSaving(true);
    try {
      await lotteryAdminService.updateActivity(selectedActivity.id, {
        prizes: editingPrizes,
      });
      toast.success('奖品配置保存成功');
      // 刷新活动数据
      loadActivities();
    } catch (error) {
      console.error('保存奖品配置失败:', error);
      toast.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  // 拖拽排序
  const handleDragStart = (index: number) => {
    setDraggingIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggingIndex === null || draggingIndex === index) return;

    const newPrizes = [...editingPrizes];
    const draggedPrize = newPrizes[draggingIndex];
    newPrizes.splice(draggingIndex, 1);
    newPrizes.splice(index, 0, draggedPrize);

    // 更新排序
    newPrizes.forEach((prize, i) => {
      prize.sortOrder = i;
    });

    setEditingPrizes(newPrizes);
    setDraggingIndex(index);
  };

  const handleDragEnd = () => {
    setDraggingIndex(null);
  };

  // 计算概率总和
  const totalProbability = editingPrizes.reduce((sum, p) => sum + p.probability, 0);
  const isProbabilityValid = Math.abs(totalProbability - 1) < 0.001;

  // 渲染活动列表
  const renderActivityList = () => (
    <div className="space-y-4">
      {/* 筛选栏 */}
      <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索活动名称..."
                value={filter.keyword}
                onChange={(e) => setFilter({ ...filter, keyword: e.target.value })}
                className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                  isDark
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-200 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
            </div>
          </div>
          <select
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            className={`px-4 py-2 rounded-lg border ${
              isDark
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-200 text-gray-900'
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
          >
            <option value="">全部状态</option>
            <option value="draft">草稿</option>
            <option value="active">进行中</option>
            <option value="paused">已暂停</option>
            <option value="ended">已结束</option>
          </select>
          <button
            onClick={loadActivities}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            刷新
          </button>
        </div>
      </div>

      {/* 活动卡片网格 */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
        </div>
      ) : activities.length === 0 ? (
        <div className={`p-12 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm text-center`}>
          <Package className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
          <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>暂无活动数据</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activities.map((activity) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm hover:shadow-md transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-500`}
              onClick={() => handleSelectActivity(activity)}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-lg mb-1">{activity.name}</h3>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {activity.prizes.length} 个奖品
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    activity.status === 'active'
                      ? 'bg-green-100 text-green-600'
                      : activity.status === 'draft'
                      ? 'bg-gray-100 text-gray-600'
                      : activity.status === 'paused'
                      ? 'bg-yellow-100 text-yellow-600'
                      : 'bg-red-100 text-red-600'
                  }`}
                >
                  {activity.status === 'active'
                    ? '进行中'
                    : activity.status === 'draft'
                    ? '草稿'
                    : activity.status === 'paused'
                    ? '已暂停'
                    : '已结束'}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Coins className="w-4 h-4 text-yellow-500" />
                  <span>每次消耗 {activity.spinCost} 积分</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Percent className="w-4 h-4 text-blue-500" />
                  <span>总抽奖 {activity.totalSpins} 次</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-blue-500">点击管理奖品</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );

  // 渲染奖品管理界面
  const renderPrizeManagement = () => {
    if (!selectedActivity) return null;

    return (
      <div className="space-y-6">
        {/* 头部导航 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackToList}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isDark
                  ? 'bg-gray-800 hover:bg-gray-700 text-white'
                  : 'bg-white hover:bg-gray-100 text-gray-900'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              返回列表
            </button>
            <div>
              <h2 className="text-2xl font-bold">{selectedActivity.name}</h2>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                管理转盘奖品配置
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleAddPrize}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              添加奖品
            </button>
            <button
              onClick={handleSaveAllPrizes}
              disabled={saving || !isProbabilityValid}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              保存配置
            </button>
          </div>
        </div>

        {/* 概率校验提示 */}
        <div
          className={`p-4 rounded-xl ${
            isProbabilityValid
              ? 'bg-green-100 dark:bg-green-900/30'
              : 'bg-red-100 dark:bg-red-900/30'
          }`}
        >
          <div
            className={`flex items-center gap-2 ${
              isProbabilityValid
                ? 'text-green-700 dark:text-green-400'
                : 'text-red-700 dark:text-red-400'
            }`}
          >
            {isProbabilityValid ? (
              <Check className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span className="font-medium">
              总概率: {(totalProbability * 100).toFixed(1)}%
              {isProbabilityValid
                ? ' (有效)'
                : ` (需调整 ${((1 - totalProbability) * 100).toFixed(1)}%)`}
            </span>
          </div>
        </div>

        {/* 转盘预览 */}
        <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            转盘预览
          </h3>
          <div className="flex justify-center">
            <div className="relative w-80 h-80">
              <svg viewBox="0 0 200 200" className="w-full h-full">
                {editingPrizes.map((prize, index) => {
                  const angle = (360 / editingPrizes.length) * index;
                  const nextAngle = (360 / editingPrizes.length) * (index + 1);
                  const colorConfig = WHEEL_COLORS[index % WHEEL_COLORS.length];

                  // 计算扇形路径
                  const startAngle = (angle - 90) * (Math.PI / 180);
                  const endAngle = (nextAngle - 90) * (Math.PI / 180);
                  const x1 = 100 + 80 * Math.cos(startAngle);
                  const y1 = 100 + 80 * Math.sin(startAngle);
                  const x2 = 100 + 80 * Math.cos(endAngle);
                  const y2 = 100 + 80 * Math.sin(endAngle);

                  const pathData = `M 100 100 L ${x1} ${y1} A 80 80 0 0 1 ${x2} ${y2} Z`;

                  // 计算文字位置
                  const textAngle = (angle + nextAngle) / 2 - 90;
                  const textRadius = 60;
                  const textX = 100 + textRadius * Math.cos(textAngle * (Math.PI / 180));
                  const textY = 100 + textRadius * Math.sin(textAngle * (Math.PI / 180));

                  return (
                    <g key={prize.id}>
                      <path d={pathData} fill={colorConfig.color} stroke="white" strokeWidth="2" />
                      <text
                        x={textX}
                        y={textY}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill={colorConfig.textColor}
                        fontSize="8"
                        fontWeight="bold"
                      >
                        {prize.name.slice(0, 4)}
                      </text>
                    </g>
                  );
                })}
                {/* 中心圆 */}
                <circle cx="100" cy="100" r="20" fill={isDark ? '#374151' : '#F3F4F6'} stroke="white" strokeWidth="2" />
              </svg>
              {/* 指针 */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2">
                <div className="w-0 h-0 border-l-8 border-r-8 border-t-12 border-l-transparent border-r-transparent border-t-red-500" />
              </div>
            </div>
          </div>
        </div>

        {/* 奖品列表 */}
        <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Package className="w-5 h-5" />
            奖品列表 ({editingPrizes.length}个)
          </h3>

          {editingPrizes.length === 0 ? (
            <div className="text-center py-12">
              <Package className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
              <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>暂无奖品，请点击"添加奖品"</p>
            </div>
          ) : (
            <div className="space-y-3">
              {editingPrizes.map((prize, index) => {
                const colorConfig = WHEEL_COLORS[index % WHEEL_COLORS.length];
                return (
                  <motion.div
                    key={prize.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-4 rounded-xl ${
                      isDark ? 'bg-gray-700' : 'bg-gray-50'
                    } flex items-center gap-4 cursor-move hover:shadow-md transition-shadow`}
                  >
                    {/* 拖拽手柄 */}
                    <div className="text-gray-400 hover:text-gray-600">
                      <GripVertical className="w-5 h-5" />
                    </div>

                    {/* 序号和颜色 */}
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                      style={{ backgroundColor: colorConfig.color }}
                    >
                      {index + 1}
                    </div>

                    {/* 奖品信息 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{prize.name || '未命名奖品'}</span>
                        {prize.isRare && (
                          <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 text-xs rounded-full">
                            稀有
                          </span>
                        )}
                        {!prize.isEnabled && (
                          <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                            禁用
                          </span>
                        )}
                      </div>
                      <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} flex items-center gap-4 mt-1`}>
                        <span className="flex items-center gap-1">
                          <Coins className="w-3 h-3" />
                          {prize.points} 积分
                        </span>
                        <span className="flex items-center gap-1">
                          <Percent className="w-3 h-3" />
                          {(prize.probability * 100).toFixed(1)}%
                        </span>
                        <span>库存: {prize.stock === -1 ? '无限' : prize.stock}</span>
                      </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditPrize(prize, index)}
                        className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-600 rounded-lg transition-colors"
                        title="编辑"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePrize(index)}
                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900 text-red-600 rounded-lg transition-colors"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  // 渲染奖品编辑弹窗
  const renderPrizeModal = () => {
    if (!showPrizeModal || !editingPrize) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className={`w-full max-w-lg rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-2xl`}
        >
          {/* 头部 */}
          <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
            <h3 className="text-xl font-bold">
              {editingIndex !== null ? '编辑奖品' : '添加奖品'}
            </h3>
            <button
              onClick={() => setShowPrizeModal(false)}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 表单内容 */}
          <div className="p-6 space-y-4">
            {/* 奖品名称 */}
            <div>
              <label className="block text-sm font-medium mb-1">奖品名称 *</label>
              <input
                type="text"
                value={editingPrize.name}
                onChange={(e) => setEditingPrize({ ...editingPrize, name: e.target.value })}
                placeholder="例如：10元红包"
                className={`w-full px-4 py-2 rounded-lg border ${
                  isDark
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-200 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
            </div>

            {/* 描述 */}
            <div>
              <label className="block text-sm font-medium mb-1">奖品描述</label>
              <input
                type="text"
                value={editingPrize.description || ''}
                onChange={(e) => setEditingPrize({ ...editingPrize, description: e.target.value })}
                placeholder="奖品详细描述"
                className={`w-full px-4 py-2 rounded-lg border ${
                  isDark
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-200 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* 积分价值 */}
              <div>
                <label className="block text-sm font-medium mb-1">积分价值</label>
                <input
                  type="number"
                  min={0}
                  value={editingPrize.points}
                  onChange={(e) => setEditingPrize({ ...editingPrize, points: parseInt(e.target.value) || 0 })}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-200 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>

              {/* 概率 */}
              <div>
                <label className="block text-sm font-medium mb-1">概率 (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={(editingPrize.probability * 100).toFixed(1)}
                  onChange={(e) =>
                    setEditingPrize({
                      ...editingPrize,
                      probability: parseFloat(e.target.value) / 100 || 0,
                    })
                  }
                  className={`w-full px-4 py-2 rounded-lg border ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-200 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* 库存 */}
              <div>
                <label className="block text-sm font-medium mb-1">库存 (-1为无限)</label>
                <input
                  type="number"
                  min={-1}
                  value={editingPrize.stock}
                  onChange={(e) => setEditingPrize({ ...editingPrize, stock: parseInt(e.target.value) || -1 })}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-200 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>

              {/* 排序 */}
              <div>
                <label className="block text-sm font-medium mb-1">排序</label>
                <input
                  type="number"
                  min={0}
                  value={editingPrize.sortOrder}
                  onChange={(e) =>
                    setEditingPrize({ ...editingPrize, sortOrder: parseInt(e.target.value) || 0 })
                  }
                  className={`w-full px-4 py-2 rounded-lg border ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-200 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>
            </div>

            {/* 图片URL */}
            <div>
              <label className="block text-sm font-medium mb-1">奖品图片URL</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={editingPrize.imageUrl || ''}
                  onChange={(e) => setEditingPrize({ ...editingPrize, imageUrl: e.target.value })}
                  placeholder="图片链接地址"
                  className={`flex-1 px-4 py-2 rounded-lg border ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-200 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                <button className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                  <Upload className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 选项 */}
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingPrize.isEnabled}
                  onChange={(e) => setEditingPrize({ ...editingPrize, isEnabled: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm">启用</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingPrize.isRare}
                  onChange={(e) => setEditingPrize({ ...editingPrize, isRare: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm">稀有奖品</span>
              </label>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className={`px-6 py-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} flex justify-end gap-3`}>
            <button
              onClick={() => setShowPrizeModal(false)}
              className={`px-4 py-2 rounded-lg border ${
                isDark
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-100'
              } transition-colors`}
            >
              取消
            </button>
            <button
              onClick={handleSavePrize}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              保存
            </button>
          </div>
        </motion.div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="container mx-auto px-4 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">转盘奖品管理</h1>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
            管理转盘活动的奖励配置与内容设置
          </p>
        </div>

        {/* 内容区域 */}
        <AnimatePresence mode="wait">
          {selectedActivity ? (
            <motion.div
              key="prize-management"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {renderPrizeManagement()}
            </motion.div>
          ) : (
            <motion.div
              key="activity-list"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              {renderActivityList()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 弹窗 */}
      <AnimatePresence>{renderPrizeModal()}</AnimatePresence>
    </div>
  );
}
