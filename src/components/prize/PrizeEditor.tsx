/**
 * 奖品编辑器组件
 * 支持创建和编辑奖品信息，包括单一奖品和复合奖品
 */

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import {
  PrizeCreateRequest,
  PrizeUpdateRequest,
  PrizeType,
  PrizeLevel,
  PrizeCombinationType,
  PRIZE_TYPE_NAMES,
  PRIZE_TYPE_ICONS,
  PRIZE_LEVEL_NAMES,
  PRIZE_LEVEL_COLORS,
  PrizeBase,
} from '@/types/prize';
import {
  Gift,
  Monitor,
  Ticket,
  Coins,
  Banknote,
  Award,
  Medal,
  Package,
  Plus,
  X,
  Upload,
  Image as ImageIcon,
  Trash2,
  Copy,
  ChevronDown,
  ChevronUp,
  GripVertical,
  AlertCircle,
} from 'lucide-react';

// 图标映射
const iconComponents: Record<string, React.ComponentType<{ className?: string }>> = {
  Gift,
  Monitor,
  Ticket,
  Coins,
  Banknote,
  Award,
  Medal,
  Package,
};

interface PrizeEditorProps {
  initialData?: Partial<PrizeCreateRequest>;
  onSave: (data: PrizeCreateRequest) => void;
  onCancel?: () => void;
  isEdit?: boolean;
}

export const PrizeEditor: React.FC<PrizeEditorProps> = ({
  initialData,
  onSave,
  onCancel,
  isEdit = false,
}) => {
  const { isDark } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  // 表单状态
  const [formData, setFormData] = useState<PrizeCreateRequest>({
    level: initialData?.level || PrizeLevel.FIRST,
    rankName: initialData?.rankName || PRIZE_LEVEL_NAMES[PrizeLevel.FIRST],
    combinationType: initialData?.combinationType || PrizeCombinationType.SINGLE,
    singlePrize: initialData?.singlePrize || {
      name: '',
      description: '',
      type: PrizeType.PHYSICAL,
      quantity: 1,
    },
    subPrizes: initialData?.subPrizes || [],
    displayOrder: initialData?.displayOrder || 1,
    isHighlight: initialData?.isHighlight ?? true,
    highlightColor: initialData?.highlightColor || PRIZE_LEVEL_COLORS[PrizeLevel.FIRST],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // 处理表单变更
  const handleChange = useCallback(<K extends keyof PrizeCreateRequest>(
    field: K,
    value: PrizeCreateRequest[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 清除对应错误
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  // 处理单一奖品字段变更
  const handleSinglePrizeChange = useCallback(<K extends keyof PrizeBase>(
    field: K,
    value: PrizeBase[K]
  ) => {
    setFormData(prev => ({
      ...prev,
      singlePrize: {
        ...prev.singlePrize,
        [field]: value,
      } as PrizeBase,
    }));
  }, []);

  // 处理等级变更（自动更新名次名称和颜色）
  const handleLevelChange = useCallback((level: PrizeLevel) => {
    setFormData(prev => ({
      ...prev,
      level,
      rankName: PRIZE_LEVEL_NAMES[level],
      highlightColor: PRIZE_LEVEL_COLORS[level],
    }));
  }, []);

  // 添加子奖品（复合奖品）
  const handleAddSubPrize = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      subPrizes: [
        ...(prev.subPrizes || []),
        {
          prize: {
            name: '',
            type: PrizeType.PHYSICAL,
            quantity: 1,
          },
          quantity: 1,
        },
      ],
    }));
  }, []);

  // 更新子奖品
  const handleUpdateSubPrize = useCallback((index: number, field: string, value: any) => {
    setFormData(prev => {
      const newSubPrizes = [...(prev.subPrizes || [])];
      if (field.startsWith('prize.')) {
        const prizeField = field.replace('prize.', '');
        newSubPrizes[index] = {
          ...newSubPrizes[index],
          prize: {
            ...newSubPrizes[index].prize,
            [prizeField]: value,
          },
        };
      } else {
        newSubPrizes[index] = {
          ...newSubPrizes[index],
          [field]: value,
        };
      }
      return { ...prev, subPrizes: newSubPrizes };
    });
  }, []);

  // 删除子奖品
  const handleRemoveSubPrize = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      subPrizes: prev.subPrizes?.filter((_, i) => i !== index) || [],
    }));
  }, []);

  // 处理图片上传
  const handleImageUpload = useCallback(async (file: File, isSubPrize?: number) => {
    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      toast.error('请上传图片文件');
      return;
    }

    // 验证文件大小 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('图片大小不能超过5MB');
      return;
    }

    setIsUploading(true);
    try {
      // 创建本地预览URL
      const imageUrl = URL.createObjectURL(file);
      
      // 实际项目中这里应该调用上传服务
      // const uploadedUrl = await uploadService.uploadImage(file, 'prizes');
      
      if (isSubPrize !== undefined) {
        handleUpdateSubPrize(isSubPrize, 'prize.imageUrl', imageUrl);
      } else {
        handleSinglePrizeChange('imageUrl', imageUrl);
      }
      toast.success('图片上传成功');
    } catch (error) {
      toast.error('图片上传失败');
    } finally {
      setIsUploading(false);
    }
  }, [handleSinglePrizeChange, handleUpdateSubPrize]);

  // 验证表单
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.rankName.trim()) {
      newErrors.rankName = '请输入名次名称';
    }

    if (formData.combinationType === PrizeCombinationType.SINGLE) {
      if (!formData.singlePrize?.name.trim()) {
        newErrors['singlePrize.name'] = '请输入奖品名称';
      }
      if (!formData.singlePrize?.quantity || formData.singlePrize.quantity < 1) {
        newErrors['singlePrize.quantity'] = '奖品数量至少为1';
      }
    } else {
      if (!formData.subPrizes || formData.subPrizes.length === 0) {
        newErrors.subPrizes = '复合奖品至少需要包含一个子奖品';
      } else {
        formData.subPrizes.forEach((sub, index) => {
          if (!sub.prize.name.trim()) {
            newErrors[`subPrizes.${index}.name`] = `子奖品 ${index + 1} 名称不能为空`;
          }
        });
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // 保存
  const handleSave = useCallback(() => {
    if (validateForm()) {
      onSave(formData);
    } else {
      toast.error('请完善奖品信息');
    }
  }, [formData, onSave, validateForm]);

  // 获取图标组件
  const getIconComponent = (iconName: string) => {
    const Icon = iconComponents[iconName] || Package;
    return <Icon className="w-5 h-5" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border overflow-hidden ${
        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}
    >
      {/* 头部 */}
      <div
        className={`flex items-center justify-between px-6 py-4 cursor-pointer ${
          isDark ? 'bg-gray-750' : 'bg-gray-50'
        }`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
            style={{ backgroundColor: formData.highlightColor }}
          >
            {formData.level <= 3 ? (
              <Medal className="w-5 h-5" />
            ) : (
              <Gift className="w-5 h-5" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {formData.rankName}
            </h3>
            <p className="text-sm text-gray-500">
              {formData.combinationType === PrizeCombinationType.SINGLE ? '单一奖品' : '复合奖品'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </div>

      {/* 表单内容 */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-gray-200 dark:border-gray-700"
          >
            <div className="p-6 space-y-6">
              {/* 等级选择 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  奖品等级
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {Object.entries(PRIZE_LEVEL_NAMES).map(([level, name]) => (
                    <button
                      key={level}
                      onClick={() => handleLevelChange(Number(level) as PrizeLevel)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        formData.level === Number(level)
                          ? 'ring-2 ring-offset-2'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                      style={{
                        backgroundColor: formData.level === Number(level) ? PRIZE_LEVEL_COLORS[Number(level) as PrizeLevel] : undefined,
                        color: formData.level === Number(level) ? 'white' : undefined,
                        '--tw-ring-color': PRIZE_LEVEL_COLORS[Number(level) as PrizeLevel],
                      } as React.CSSProperties}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>

              {/* 名次名称 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  名次名称
                </label>
                <input
                  type="text"
                  value={formData.rankName}
                  onChange={(e) => handleChange('rankName', e.target.value)}
                  placeholder="如：一等奖、金奖等"
                  className={`w-full px-4 py-3 rounded-xl border text-sm transition-all ${
                    errors.rankName ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'
                  } ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                />
                {errors.rankName && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.rankName}
                  </p>
                )}
              </div>

              {/* 奖品类型切换 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  奖品类型
                </label>
                <div className="flex gap-3">
                  {[
                    { type: PrizeCombinationType.SINGLE, label: '单一奖品', desc: '一个独立奖品' },
                    { type: PrizeCombinationType.COMPOUND, label: '复合奖品', desc: '多个奖品组合' },
                  ].map(({ type, label, desc }) => (
                    <button
                      key={type}
                      onClick={() => handleChange('combinationType', type)}
                      className={`flex-1 p-4 rounded-xl border text-left transition-all ${
                        formData.combinationType === type
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium text-gray-900 dark:text-white">{label}</div>
                      <div className="text-sm text-gray-500 mt-1">{desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 单一奖品表单 */}
              {formData.combinationType === PrizeCombinationType.SINGLE && formData.singlePrize && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  {/* 奖品图片上传 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      奖品图片
                    </label>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl overflow-hidden cursor-pointer transition-all ${
                        formData.singlePrize.imageUrl
                          ? 'border-transparent'
                          : 'border-gray-300 dark:border-gray-600 hover:border-blue-500'
                      }`}
                    >
                      {formData.singlePrize.imageUrl ? (
                        <div className="relative aspect-video">
                          <img
                            src={formData.singlePrize.imageUrl}
                            alt="奖品预览"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <div className="text-white text-center">
                              <Upload className="w-8 h-8 mx-auto mb-2" />
                              <span className="text-sm">点击更换图片</span>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSinglePrizeChange('imageUrl', undefined);
                            }}
                            className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="p-8 text-center">
                          {isUploading ? (
                            <div className="animate-pulse">
                              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-200 dark:bg-gray-700" />
                              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mx-auto" />
                            </div>
                          ) : (
                            <>
                              <ImageIcon className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                点击上传奖品图片
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                支持 JPG、PNG 格式，最大 5MB
                              </p>
                            </>
                          )}
                        </div>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file);
                        }}
                      />
                    </div>
                  </div>

                  {/* 奖品名称 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      奖品名称 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.singlePrize.name}
                      onChange={(e) => handleSinglePrizeChange('name', e.target.value)}
                      placeholder="输入奖品名称"
                      className={`w-full px-4 py-3 rounded-xl border text-sm transition-all ${
                        errors['singlePrize.name'] ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'
                      } ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                    />
                    {errors['singlePrize.name'] && (
                      <p className="mt-1 text-sm text-red-500">{errors['singlePrize.name']}</p>
                    )}
                  </div>

                  {/* 奖品类型和数量 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        奖品类别
                      </label>
                      <div className="relative">
                        <select
                          value={formData.singlePrize.type}
                          onChange={(e) => handleSinglePrizeChange('type', e.target.value as PrizeType)}
                          className={`w-full px-4 py-3 rounded-xl border text-sm appearance-none ${
                            isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-gray-50 text-gray-900 border-gray-200'
                          } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                        >
                          {Object.entries(PRIZE_TYPE_NAMES).map(([type, name]) => (
                            <option key={type} value={type}>{name}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        数量 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={formData.singlePrize.quantity}
                        onChange={(e) => handleSinglePrizeChange('quantity', parseInt(e.target.value) || 1)}
                        className={`w-full px-4 py-3 rounded-xl border text-sm ${
                          errors['singlePrize.quantity'] ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'
                        } ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                      />
                    </div>
                  </div>

                  {/* 奖品描述 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      奖品描述
                    </label>
                    <textarea
                      value={formData.singlePrize.description || ''}
                      onChange={(e) => handleSinglePrizeChange('description', e.target.value)}
                      placeholder="描述奖品的特点、规格等信息"
                      rows={3}
                      className={`w-full px-4 py-3 rounded-xl border text-sm resize-none ${
                        isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-gray-50 text-gray-900 border-gray-200'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                    />
                  </div>

                  {/* 奖品价值 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      奖品价值（元）
                    </label>
                    <div className="relative">
                      <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="number"
                        min={0}
                        value={formData.singlePrize.value || ''}
                        onChange={(e) => handleSinglePrizeChange('value', parseFloat(e.target.value) || undefined)}
                        placeholder="可选，用于展示"
                        className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm ${
                          isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-gray-50 text-gray-900 border-gray-200'
                        } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* 复合奖品表单 */}
              {formData.combinationType === PrizeCombinationType.COMPOUND && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  {formData.subPrizes?.map((subPrize, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-xl border ${
                        isDark ? 'bg-gray-750 border-gray-600' : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          子奖品 {index + 1}
                        </span>
                        <button
                          onClick={() => handleRemoveSubPrize(index)}
                          className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-3">
                        {/* 子奖品名称 */}
                        <input
                          type="text"
                          value={subPrize.prize.name}
                          onChange={(e) => handleUpdateSubPrize(index, 'prize.name', e.target.value)}
                          placeholder="奖品名称"
                          className={`w-full px-3 py-2 rounded-lg border text-sm ${
                            errors[`subPrizes.${index}.name`] ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'
                          } ${isDark ? 'bg-gray-700 text-white' : 'bg-white'}`}
                        />

                        <div className="grid grid-cols-2 gap-3">
                          {/* 子奖品类型 */}
                          <select
                            value={subPrize.prize.type}
                            onChange={(e) => handleUpdateSubPrize(index, 'prize.type', e.target.value)}
                            className={`px-3 py-2 rounded-lg border text-sm ${
                              isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-gray-200'
                            }`}
                          >
                            {Object.entries(PRIZE_TYPE_NAMES).map(([type, name]) => (
                              <option key={type} value={type}>{name}</option>
                            ))}
                          </select>

                          {/* 子奖品数量 */}
                          <input
                            type="number"
                            min={1}
                            value={subPrize.quantity}
                            onChange={(e) => handleUpdateSubPrize(index, 'quantity', parseInt(e.target.value) || 1)}
                            placeholder="数量"
                            className={`px-3 py-2 rounded-lg border text-sm ${
                              isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-gray-200'
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={handleAddSubPrize}
                    className={`w-full py-3 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 text-sm font-medium transition-all ${
                      isDark
                        ? 'border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-300'
                        : 'border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700'
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                    添加子奖品
                  </button>

                  {errors.subPrizes && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.subPrizes}
                    </p>
                  )}
                </motion.div>
              )}

              {/* 高亮设置 */}
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isHighlight}
                    onChange={(e) => handleChange('isHighlight', e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">高亮展示</span>
                </label>

                {formData.isHighlight && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">颜色：</span>
                    <input
                      type="color"
                      value={formData.highlightColor}
                      onChange={(e) => handleChange('highlightColor', e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer"
                    />
                  </div>
                )}
              </div>

              {/* 操作按钮 */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                {onCancel && (
                  <button
                    onClick={onCancel}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    取消
                  </button>
                )}
                <button
                  onClick={handleSave}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {isEdit ? '保存修改' : '添加奖品'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default PrizeEditor;
