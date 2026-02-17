/**
 * 奖品管理组件
 * 用于活动创建/编辑时管理奖品列表
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import {
  Prize,
  PrizeCreateRequest,
  PrizeLevel,
  PrizeCombinationType,
  PrizeTemplate,
  PRIZE_LEVEL_NAMES,
  PRIZE_LEVEL_COLORS,
} from '@/types/prize';
import { prizeService } from '@/services/prizeService';
import PrizeEditor from './PrizeEditor';
import PrizeDisplay from './PrizeDisplay';
import {
  Plus,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  GripVertical,
  Sparkles,
  ChevronDown,
  Save,
  X,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface PrizeManagerProps {
  eventId: string;
  initialPrizes?: Prize[];
  onPrizesChange?: (prizes: Prize[]) => void;
  readOnly?: boolean;
}

export const PrizeManager: React.FC<PrizeManagerProps> = ({
  eventId,
  initialPrizes = [],
  onPrizesChange,
  readOnly = false,
}) => {
  const { isDark } = useTheme();

  // 状态
  const [prizes, setPrizes] = useState<Prize[]>(initialPrizes);
  const [templates, setTemplates] = useState<PrizeTemplate[]>([]);
  const [showEditor, setShowEditor] = useState(false);
  const [editingPrize, setEditingPrize] = useState<Prize | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 加载模板
  useEffect(() => {
    setTemplates(prizeService.getPrizeTemplates());
  }, []);

  // 同步外部数据变化
  useEffect(() => {
    setPrizes(initialPrizes);
  }, [initialPrizes]);

  // 通知父组件
  const notifyChange = useCallback((newPrizes: Prize[]) => {
    onPrizesChange?.(newPrizes);
  }, [onPrizesChange]);

  // 添加奖品
  const handleAddPrize = useCallback((data: PrizeCreateRequest) => {
    const newPrize: Prize = {
      id: `temp-${Date.now()}`,
      eventId,
      ...data,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const newPrizes = [...prizes, newPrize].sort((a, b) => a.level - b.level);
    setPrizes(newPrizes);
    notifyChange(newPrizes);
    setShowEditor(false);
    toast.success('奖品添加成功');
  }, [prizes, eventId, notifyChange]);

  // 更新奖品
  const handleUpdatePrize = useCallback((data: PrizeCreateRequest) => {
    if (!editingPrize) return;

    const updatedPrizes = prizes.map(p =>
      p.id === editingPrize.id
        ? { ...p, ...data, updatedAt: new Date() }
        : p
    );

    setPrizes(updatedPrizes);
    notifyChange(updatedPrizes);
    setEditingPrize(null);
    setShowEditor(false);
    toast.success('奖品更新成功');
  }, [prizes, editingPrize, notifyChange]);

  // 删除奖品
  const handleDeletePrize = useCallback((prizeId: string) => {
    if (!confirm('确定要删除这个奖品吗？')) return;

    const newPrizes = prizes.filter(p => p.id !== prizeId);
    setPrizes(newPrizes);
    notifyChange(newPrizes);
    toast.success('奖品已删除');
  }, [prizes, notifyChange]);

  // 复制奖品
  const handleDuplicatePrize = useCallback((prize: Prize) => {
    const newPrize: Prize = {
      ...prize,
      id: `temp-${Date.now()}`,
      rankName: `${prize.rankName} (复制)`,
      displayOrder: prizes.length + 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const newPrizes = [...prizes, newPrize];
    setPrizes(newPrizes);
    notifyChange(newPrizes);
    toast.success('奖品已复制');
  }, [prizes, notifyChange]);

  // 应用模板
  const handleApplyTemplate = useCallback(async (template: PrizeTemplate) => {
    setIsLoading(true);
    try {
      const newPrizes: Prize[] = template.prizes.map((req, index) => ({
        id: `temp-${Date.now()}-${index}`,
        eventId,
        ...req,
        displayOrder: req.displayOrder || index + 1,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      setPrizes(newPrizes);
      notifyChange(newPrizes);
      setShowTemplates(false);
      toast.success(`已应用模板：${template.name}`);
    } finally {
      setIsLoading(false);
    }
  }, [eventId, notifyChange]);

  // 清空所有奖品
  const handleClearAll = useCallback(() => {
    if (!confirm('确定要清空所有奖品吗？此操作不可恢复。')) return;

    setPrizes([]);
    notifyChange([]);
    toast.success('已清空所有奖品');
  }, [notifyChange]);

  // 编辑奖品
  const handleEdit = useCallback((prize: Prize) => {
    setEditingPrize(prize);
    setShowEditor(true);
  }, []);

  // 取消编辑
  const handleCancelEdit = useCallback(() => {
    setEditingPrize(null);
    setShowEditor(false);
  }, []);

  // 获取已使用的等级
  const usedLevels = useMemo(() => {
    return new Set(prizes.map(p => p.level));
  }, [prizes]);

  // 获取下一个建议等级
  const getNextSuggestedLevel = useMemo(() => {
    const levels = [PrizeLevel.FIRST, PrizeLevel.SECOND, PrizeLevel.THIRD, PrizeLevel.FOURTH, PrizeLevel.FIFTH];
    return levels.find(l => !usedLevels.has(l)) || PrizeLevel.CONSOLATION;
  }, [usedLevels]);

  if (readOnly) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            活动奖品
          </h3>
          <span className="text-sm text-gray-500">
            共 {prizes.length} 个奖项
          </span>
        </div>
        <PrizeDisplay
          prizes={prizes}
          config={{ layout: 'podium', animationEnabled: true }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 头部工具栏 */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            奖品设置
          </h3>
          <p className="text-sm text-gray-500">
            配置活动的奖品信息，支持单一奖品和复合奖品
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* 模板按钮 */}
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              showTemplates
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            使用模板
            <ChevronDown className={`w-4 h-4 transition-transform ${showTemplates ? 'rotate-180' : ''}`} />
          </button>

          {/* 预览按钮 */}
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              showPreview
                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200'
            }`}
          >
            {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showPreview ? '关闭预览' : '预览效果'}
          </button>

          {/* 添加按钮 */}
          <button
            onClick={() => {
              setEditingPrize(null);
              setShowEditor(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            添加奖品
          </button>
        </div>
      </div>

      {/* 模板选择区域 */}
      <AnimatePresence>
        {showTemplates && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  选择奖品模板
                </h4>
                <button
                  onClick={() => setShowTemplates(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map(template => (
                  <button
                    key={template.id}
                    onClick={() => handleApplyTemplate(template)}
                    disabled={isLoading}
                    className={`p-4 rounded-xl border text-left transition-all hover:shadow-md ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 hover:border-blue-500'
                        : 'bg-white border-gray-200 hover:border-blue-500'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium text-gray-900 dark:text-white">
                        {template.name}
                      </h5>
                      {template.isDefault && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                          默认
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mb-3">
                      {template.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-600 rounded">
                        {template.prizes.length} 个奖项
                      </span>
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-600 rounded capitalize">
                        {template.category}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 主要内容区域 */}
      <div className="space-y-6">
        {/* 奖品列表区域 */}
        <div className="space-y-4">
          {/* 奖品列表 */}
          {prizes.length === 0 ? (
            <div className={`p-12 text-center rounded-xl border-2 border-dashed ${
              isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
            }`}>
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-gray-400" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                还没有设置奖品
              </h4>
              <p className="text-sm text-gray-500 mb-4">
                添加奖品可以吸引更多用户参与活动
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setShowTemplates(true)}
                  className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  使用模板
                </button>
                <button
                  onClick={() => setShowEditor(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  添加奖品
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* 奖品列表 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {prizes
                  .sort((a, b) => a.displayOrder - b.displayOrder)
                  .map((prize, index) => (
                    <motion.div
                      key={prize.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`group flex items-center gap-3 p-4 rounded-xl border transition-all hover:shadow-md ${
                        isDark
                          ? 'bg-gray-800 border-gray-700 hover:border-gray-600'
                          : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}
                      style={{
                        borderLeftWidth: '4px',
                        borderLeftColor: prize.highlightColor || PRIZE_LEVEL_COLORS[prize.level],
                      }}
                    >
                      {/* 拖拽手柄 */}
                      <div className="cursor-move text-gray-400 hover:text-gray-600">
                        <GripVertical className="w-5 h-5" />
                      </div>

                      {/* 等级 */}
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                        style={{ backgroundColor: prize.highlightColor || PRIZE_LEVEL_COLORS[prize.level] }}
                      >
                        {prize.level <= 3 ? prize.level : <Sparkles className="w-4 h-4" />}
                      </div>

                      {/* 信息 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-900 dark:text-white truncate">
                            {prize.rankName}
                          </h4>
                          {prize.combinationType === PrizeCombinationType.COMPOUND && (
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full flex-shrink-0">
                              复合
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 truncate">
                          {prize.combinationType === PrizeCombinationType.COMPOUND
                            ? `${prize.subPrizes?.length || 0} 项奖励组合`
                            : prize.singlePrize?.name}
                        </p>
                      </div>

                      {/* 操作按钮 */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleDuplicatePrize(prize)}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="复制"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(prize)}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="编辑"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePrize(prize.id)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
              </div>

              {/* 清空按钮 */}
              {prizes.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="w-full py-3 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                >
                  清空所有奖品
                </button>
              )}
            </>
          )}

          {/* 添加/编辑编辑器 */}
          <AnimatePresence>
            {showEditor && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <PrizeEditor
                  initialData={editingPrize ? {
                    level: editingPrize.level,
                    rankName: editingPrize.rankName,
                    combinationType: editingPrize.combinationType,
                    singlePrize: editingPrize.singlePrize,
                    subPrizes: editingPrize.subPrizes,
                    displayOrder: editingPrize.displayOrder,
                    isHighlight: editingPrize.isHighlight,
                    highlightColor: editingPrize.highlightColor,
                  } : {
                    level: getNextSuggestedLevel,
                  }}
                  onSave={editingPrize ? handleUpdatePrize : handleAddPrize}
                  onCancel={handleCancelEdit}
                  isEdit={!!editingPrize}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 预览区域 */}
        {showPreview && prizes.length > 0 && (
          <div className={`p-6 rounded-2xl ${
            isDark ? 'bg-gray-800' : 'bg-white'
          } border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between mb-6">
              <h4 className="font-semibold text-gray-900 dark:text-white">
                奖品预览
              </h4>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                {prizes.length} 个奖项
              </div>
            </div>

            {prizes.length > 0 ? (
              <PrizeDisplay
                prizes={prizes}
                config={{ layout: 'podium', animationEnabled: false }}
              />
            ) : (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <Eye className="w-10 h-10 text-gray-300" />
                </div>
                <p className="text-gray-500">
                  添加奖品后将在此处预览展示效果
                </p>
              </div>
            )}

            {/* 提示信息 */}
            <div className="mt-6 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  <p className="font-medium mb-1">提示</p>
                  <ul className="space-y-1 text-blue-600 dark:text-blue-400">
                    <li>• 一等奖、二等奖、三等奖将在领奖台上特殊展示</li>
                    <li>• 建议为每个奖品上传清晰的图片</li>
                    <li>• 复合奖品适合"奖品+证书+积分"的组合场景</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrizeManager;
