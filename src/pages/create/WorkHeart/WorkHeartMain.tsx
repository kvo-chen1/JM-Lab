import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useActiveTab, useStylePresets, useSelectedPreset, useWorkHeartStore } from './hooks/useWorkHeartStore';
import StylePresetCard from './components/StylePresetCard';
import InspirationInput from './components/InspirationInput';
import GenerationButton from './components/GenerationButton';
import VideoGenerationButton from './components/VideoGenerationButton';
import ResultsGrid from './components/ResultsGrid';
import InspirationVeinComponent from './components/InspirationVein';
import PresetModal from './components/PresetModal';
import { StylePreset } from './types/workheart';

// 创作标签页
function CreateTab() {
  const { isDark } = useTheme();
  const presets = useStylePresets();
  const selectedPreset = useSelectedPreset();
  const { selectPreset, deletePreset } = useWorkHeartStore();
  
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState<StylePreset | null>(null);

  const handleCreatePreset = () => {
    setEditingPreset(null);
    setIsPresetModalOpen(true);
  };

  const handleEditPreset = (preset: StylePreset) => {
    setEditingPreset(preset);
    setIsPresetModalOpen(true);
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 风格预设区域 */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                风格预设
              </h2>
              <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                选择或创建风格预设，快速开始创作
              </p>
            </div>
            <button
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isDark 
                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' 
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
              onClick={handleCreatePreset}
            >
              <i className="fas fa-plus mr-2"></i>
              新建预设
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {presets.map((preset) => (
              <StylePresetCard
                key={preset.id}
                preset={preset}
                isSelected={selectedPreset?.id === preset.id}
                onClick={() => selectPreset(preset.id)}
                onEdit={() => handleEditPreset(preset)}
                onDelete={() => {
                  if (confirm('确定要删除这个预设吗？')) {
                    deletePreset(preset.id);
                  }
                }}
              />
            ))}
          </div>
        </section>
        
        {/* 预设模态框 */}
        <PresetModal
          isOpen={isPresetModalOpen}
          onClose={() => setIsPresetModalOpen(false)}
          preset={editingPreset}
        />

        {/* 创作输入区域 */}
        <section>
          <h2 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            开始创作
          </h2>
          <InspirationInput />
        </section>

        {/* 生成按钮 */}
        <section className="space-y-3">
          <GenerationButton />
          <VideoGenerationButton />
        </section>

        {/* 生成结果 */}
        <section>
          <ResultsGrid />
        </section>
      </div>
    </div>
  );
}

// 一键设计标签页
function DesignTab() {
  const { isDark } = useTheme();

  return (
    <div className="h-full flex items-center justify-center">
      <div className={`text-center ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
        <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 ${
          isDark ? 'bg-slate-800' : 'bg-slate-100'
        }`}>
          <i className="fas fa-magic text-4xl"></i>
        </div>
        <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          一键设计
        </h3>
        <p className="text-sm max-w-md mx-auto">
          智能分析您的需求，自动生成完整的设计方案。功能开发中，敬请期待...
        </p>
      </div>
    </div>
  );
}

// 生成结果标签页
function ResultsTab() {
  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-6">
      <div className="max-w-6xl mx-auto">
        <ResultsGrid />
      </div>
    </div>
  );
}

// 历史记录标签页
function HistoryTab() {
  const { isDark } = useTheme();

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-6">
      <div className="max-w-6xl mx-auto">
        <div className={`flex items-center justify-between mb-6 ${
          isDark ? 'text-white' : 'text-slate-900'
        }`}>
          <h2 className="text-lg font-bold">历史记录</h2>
          <div className="flex gap-2">
            <select className={`px-3 py-1.5 rounded-lg text-sm border ${
              isDark 
                ? 'bg-slate-800 border-slate-700 text-white' 
                : 'bg-white border-slate-200 text-slate-700'
            }`}>
              <option>全部</option>
              <option>图片</option>
              <option>视频</option>
              <option>收藏</option>
            </select>
            <select className={`px-3 py-1.5 rounded-lg text-sm border ${
              isDark 
                ? 'bg-slate-800 border-slate-700 text-white' 
                : 'bg-white border-slate-200 text-slate-700'
            }`}>
              <option>最新优先</option>
              <option>最早优先</option>
            </select>
          </div>
        </div>
        <ResultsGrid />
      </div>
    </div>
  );
}

// 灵感脉络标签页
function VeinTab() {
  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-6">
      <div className="max-w-4xl mx-auto">
        <InspirationVeinComponent />
      </div>
    </div>
  );
}

export default function WorkHeartMain() {
  const activeTab = useActiveTab();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.2 }}
        className="h-full"
      >
        {activeTab === 'create' && <CreateTab />}
        {activeTab === 'design' && <DesignTab />}
        {activeTab === 'results' && <ResultsTab />}
        {activeTab === 'history' && <HistoryTab />}
        {activeTab === 'vein' && <VeinTab />}
      </motion.div>
    </AnimatePresence>
  );
}
