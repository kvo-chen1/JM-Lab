import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import { StylePreset, PRESET_TAGS, BRAND_STORIES } from '../types/workheart';
import { useWorkHeartStore } from '../hooks/useWorkHeartStore';

interface PresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  preset?: StylePreset | null;
}

export default function PresetModal({ isOpen, onClose, preset }: PresetModalProps) {
  const { isDark } = useTheme();
  const { addPreset, updatePreset } = useWorkHeartStore();
  
  const isEditing = !!preset;
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    brand: '',
    tags: [] as string[],
    prompt: '',
    engine: 'sdxl' as 'sdxl' | 'qwen' | 'doubao',
    textStyle: 'creative' as 'formal' | 'humorous' | 'creative' | 'poetic'
  });

  useEffect(() => {
    if (preset) {
      setFormData({
        name: preset.name,
        description: preset.description || '',
        brand: preset.brand,
        tags: preset.tags,
        prompt: preset.prompt,
        engine: preset.engine,
        textStyle: preset.textStyle
      });
    } else {
      setFormData({
        name: '',
        description: '',
        brand: '',
        tags: [],
        prompt: '',
        engine: 'sdxl',
        textStyle: 'creative'
      });
    }
  }, [preset, isOpen]);

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast.warning('请输入预设名称');
      return;
    }
    if (!formData.prompt.trim()) {
      toast.warning('请输入提示词');
      return;
    }

    if (isEditing && preset) {
      updatePreset(preset.id, formData);
      toast.success('预设更新成功');
    } else {
      addPreset(formData);
      toast.success('预设创建成功');
    }
    onClose();
  };

  const toggleTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />
          
          {/* 模态框 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[600px] md:max-h-[85vh] rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col ${
              isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white border border-slate-200'
            }`}
          >
            {/* 头部 */}
            <div className={`flex items-center justify-between px-6 py-4 border-b ${
              isDark ? 'border-slate-700' : 'border-slate-200'
            }`}>
              <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {isEditing ? '编辑预设' : '新建预设'}
              </h2>
              <button
                onClick={onClose}
                className={`p-2 rounded-lg transition-colors ${
                  isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* 内容 */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* 名称 */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  预设名称 *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="例如：国潮风格"
                  className={`w-full px-4 py-2 rounded-lg border outline-none transition-colors ${
                    isDark 
                      ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500' 
                      : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500'
                  }`}
                />
              </div>

              {/* 描述 */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  描述
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="简短描述这个预设的特点"
                  className={`w-full px-4 py-2 rounded-lg border outline-none transition-colors ${
                    isDark 
                      ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500' 
                      : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500'
                  }`}
                />
              </div>

              {/* 品牌选择 */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  关联品牌
                </label>
                <select
                  value={formData.brand}
                  onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                  className={`w-full px-4 py-2 rounded-lg border outline-none transition-colors ${
                    isDark 
                      ? 'bg-slate-800 border-slate-700 text-white focus:border-blue-500' 
                      : 'bg-white border-slate-200 text-slate-900 focus:border-blue-500'
                  }`}
                >
                  <option value="">不指定品牌</option>
                  {Object.entries(BRAND_STORIES).map(([key, brand]) => (
                    <option key={key} value={key}>{brand.name}</option>
                  ))}
                </select>
              </div>

              {/* 标签 */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  标签
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_TAGS.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                        formData.tags.includes(tag)
                          ? isDark 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-blue-500 text-white'
                          : isDark 
                            ? 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600' 
                            : 'bg-slate-100 text-slate-600 border border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* AI引擎 */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  AI引擎
                </label>
                <div className="flex gap-2">
                  {[
                    { id: 'sdxl', name: 'SDXL', icon: 'image' },
                    { id: 'qwen', name: '通义万相', icon: 'magic' },
                    { id: 'doubao', name: '豆包', icon: 'robot' }
                  ].map((engine) => (
                    <button
                      key={engine.id}
                      onClick={() => setFormData(prev => ({ ...prev, engine: engine.id as any }))}
                      className={`flex-1 px-4 py-3 rounded-lg border text-sm font-medium transition-all ${
                        formData.engine === engine.id
                          ? isDark 
                            ? 'bg-blue-500/20 border-blue-500 text-blue-400' 
                            : 'bg-blue-50 border-blue-500 text-blue-600'
                          : isDark 
                            ? 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600' 
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <i className={`fas fa-${engine.icon} mr-2`}></i>
                      {engine.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* 提示词 */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  提示词 *
                </label>
                <textarea
                  value={formData.prompt}
                  onChange={(e) => setFormData(prev => ({ ...prev, prompt: e.target.value }))}
                  placeholder="描述你想要的画面..."
                  rows={4}
                  className={`w-full px-4 py-3 rounded-lg border outline-none transition-colors resize-none ${
                    isDark 
                      ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500' 
                      : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500'
                  }`}
                />
                <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  {formData.prompt.length} 字符
                </p>
              </div>
            </div>

            {/* 底部按钮 */}
            <div className={`flex justify-end gap-3 px-6 py-4 border-t ${
              isDark ? 'border-slate-700' : 'border-slate-200'
            }`}>
              <button
                onClick={onClose}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isDark 
                    ? 'text-slate-300 hover:bg-slate-800' 
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                className="px-6 py-2 rounded-lg text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors"
              >
                {isEditing ? '保存修改' : '创建预设'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
