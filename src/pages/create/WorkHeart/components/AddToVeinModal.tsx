import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import { GenerationResult, InspirationVein } from '../types/workheart';
import { useInspirationVeins, useCurrentVein, useWorkHeartStore } from '../hooks/useWorkHeartStore';

interface AddToVeinModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: GenerationResult | null;
}

export default function AddToVeinModal({ isOpen, onClose, result }: AddToVeinModalProps) {
  const { isDark } = useTheme();
  const veins = useInspirationVeins();
  const currentVein = useCurrentVein();
  const { createVein, addNodeToVein, setCurrentVein } = useWorkHeartStore();
  
  const [selectedVeinId, setSelectedVeinId] = useState<string>('');
  const [nodeType, setNodeType] = useState<'iteration' | 'reference' | 'derivative'>('iteration');
  const [nodeTitle, setNodeTitle] = useState('');
  const [showNewVeinForm, setShowNewVeinForm] = useState(false);
  const [newVeinName, setNewVeinName] = useState('');

  React.useEffect(() => {
    if (isOpen && currentVein) {
      setSelectedVeinId(currentVein.id);
    }
  }, [isOpen, currentVein]);

  React.useEffect(() => {
    if (result) {
      setNodeTitle(`作品 ${new Date(result.createdAt).toLocaleDateString()}`);
    }
  }, [result]);

  const handleAddToVein = () => {
    if (!result) return;

    if (showNewVeinForm) {
      if (!newVeinName.trim()) {
        toast.warning('请输入脉络名称');
        return;
      }
      createVein(newVeinName);
      // 新创建的脉络会自动设为当前脉络
      setTimeout(() => {
        const newVein = useWorkHeartStore.getState().inspirationVeins.slice(-1)[0];
        if (newVein) {
          addNodeToVein(newVein.id, {
            type: 'root',
            title: nodeTitle || '新作品',
            description: result.prompt.slice(0, 100),
            imageUrl: result.thumbnail || result.url,
            childrenIds: [],
            prompt: result.prompt,
            result: result
          });
          toast.success('已添加到新脉络');
        }
      }, 100);
    } else {
      if (!selectedVeinId) {
        toast.warning('请选择一个脉络');
        return;
      }

      const vein = veins.find(v => v.id === selectedVeinId);
      if (!vein) return;

      // 找到要关联的父节点（默认是根节点）
      const parentNode = vein.nodes[vein.rootNodeId];

      addNodeToVein(selectedVeinId, {
        type: nodeType,
        title: nodeTitle || '新作品',
        description: result.prompt.slice(0, 100),
        imageUrl: result.thumbnail || result.url,
        parentId: parentNode?.id,
        childrenIds: [],
        prompt: result.prompt,
        result: result
      });
      toast.success('已添加到灵感脉络');
    }

    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && result && (
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
            className={`fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[500px] rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col ${
              isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white border border-slate-200'
            }`}
          >
            {/* 头部 */}
            <div className={`flex items-center justify-between px-6 py-4 border-b ${
              isDark ? 'border-slate-700' : 'border-slate-200'
            }`}>
              <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                添加到灵感脉络
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
              {/* 作品预览 */}
              <div className={`p-3 rounded-xl border ${
                isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex gap-3">
                  <img 
                    src={result.thumbnail || result.url} 
                    alt="作品"
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm line-clamp-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      {result.prompt}
                    </p>
                    <span className={`text-xs mt-1 inline-block ${
                      isDark ? 'text-slate-500' : 'text-slate-400'
                    }`}>
                      {result.type === 'video' ? '视频' : '图片'} · {new Date(result.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* 选择脉络 */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  选择脉络
                </label>
                
                {veins.length > 0 && !showNewVeinForm ? (
                  <div className="space-y-2">
                    {veins.map((vein) => (
                      <button
                        key={vein.id}
                        onClick={() => setSelectedVeinId(vein.id)}
                        className={`w-full p-3 rounded-lg border text-left transition-all ${
                          selectedVeinId === vein.id
                            ? isDark 
                              ? 'bg-blue-500/20 border-blue-500' 
                              : 'bg-blue-50 border-blue-500'
                            : isDark 
                              ? 'bg-slate-800 border-slate-700 hover:border-slate-600' 
                              : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {vein.name}
                          </span>
                          <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                            {Object.keys(vein.nodes).length} 节点
                          </span>
                        </div>
                      </button>
                    ))}
                    <button
                      onClick={() => setShowNewVeinForm(true)}
                      className={`w-full p-3 rounded-lg border border-dashed transition-all ${
                        isDark 
                          ? 'border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300' 
                          : 'border-slate-300 text-slate-500 hover:border-slate-400 hover:text-slate-700'
                      }`}
                    >
                      <i className="fas fa-plus mr-2"></i>
                      创建新脉络
                    </button>
                  </div>
                ) : showNewVeinForm ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={newVeinName}
                      onChange={(e) => setNewVeinName(e.target.value)}
                      placeholder="输入新脉络名称..."
                      className={`w-full px-4 py-2 rounded-lg border outline-none transition-colors ${
                        isDark 
                          ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500' 
                          : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500'
                      }`}
                    />
                    <button
                      onClick={() => setShowNewVeinForm(false)}
                      className={`text-sm ${isDark ? 'text-slate-400 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      或选择现有脉络
                    </button>
                  </div>
                ) : (
                  <div className={`text-center py-4 rounded-lg border border-dashed ${
                    isDark ? 'border-slate-700 text-slate-500' : 'border-slate-300 text-slate-400'
                  }`}>
                    <p className="text-sm mb-2">还没有灵感脉络</p>
                    <button
                      onClick={() => setShowNewVeinForm(true)}
                      className="text-sm text-blue-500 hover:text-blue-600"
                    >
                      创建第一个脉络
                    </button>
                  </div>
                )}
              </div>

              {/* 节点类型 */}
              {!showNewVeinForm && veins.length > 0 && (
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    节点类型
                  </label>
                  <div className="flex gap-2">
                    {[
                      { id: 'iteration', label: '迭代', color: 'blue', desc: '基于前作的改进' },
                      { id: 'reference', label: '参考', color: 'green', desc: '作为参考素材' },
                      { id: 'derivative', label: '衍生', color: 'purple', desc: '衍生出新作品' }
                    ].map((type) => (
                      <button
                        key={type.id}
                        onClick={() => setNodeType(type.id as any)}
                        className={`flex-1 p-3 rounded-lg border text-left transition-all ${
                          nodeType === type.id
                            ? isDark 
                              ? `bg-${type.color}-500/20 border-${type.color}-500` 
                              : `bg-${type.color}-50 border-${type.color}-500`
                            : isDark 
                              ? 'bg-slate-800 border-slate-700 hover:border-slate-600' 
                              : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <span className={`text-sm font-medium block ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {type.label}
                        </span>
                        <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                          {type.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 节点标题 */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  节点标题
                </label>
                <input
                  type="text"
                  value={nodeTitle}
                  onChange={(e) => setNodeTitle(e.target.value)}
                  placeholder="给这个节点起个名字"
                  className={`w-full px-4 py-2 rounded-lg border outline-none transition-colors ${
                    isDark 
                      ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500' 
                      : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500'
                  }`}
                />
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
                onClick={handleAddToVein}
                className="px-6 py-2 rounded-lg text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors"
              >
                添加
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
