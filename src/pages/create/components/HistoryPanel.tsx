import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCreateStore } from '@/pages/create/hooks/useCreateStore';
import { useTheme } from '@/hooks/useTheme';

export default function HistoryPanel({ onClose }: { onClose: () => void }) {
  const { isDark } = useTheme();
  const generatedResults = useCreateStore((state) => state.generatedResults);
  const setSelectedResult = useCreateStore((state) => state.setSelectedResult);
  const [drafts, setDrafts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'session' | 'drafts'>('session');

  useEffect(() => {
    console.log('HistoryPanel mounted');
    // Load drafts from localStorage
    try {
      const savedDrafts = JSON.parse(localStorage.getItem('CREATE_DRAFTS') || '[]');
      setDrafts(savedDrafts);
    } catch (e) {
      console.error('Failed to load drafts', e);
    }
  }, []);

  const handleSelectResult = (id: number) => {
    setSelectedResult(id);
    onClose();
  };

  // 临时调试：移除 Portal 和 Animation，直接返回最简单的 UI
  return createPortal(
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-end bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={`w-full max-w-md h-full shadow-2xl overflow-hidden flex flex-col ${isDark ? 'bg-gray-900' : 'bg-white'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
          <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>创作历史</h2>
          <button 
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Tabs */}
        <div className={`flex px-6 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
          <button
            onClick={() => setActiveTab('session')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'session' ? (isDark ? 'border-blue-500 text-blue-400' : 'border-blue-600 text-blue-600') : (isDark ? 'border-transparent text-gray-400 hover:text-gray-200' : 'border-transparent text-gray-500 hover:text-gray-700')}`}
          >
            本次创作 ({generatedResults.length})
          </button>
          <button
            onClick={() => setActiveTab('drafts')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'drafts' ? (isDark ? 'border-blue-500 text-blue-400' : 'border-blue-600 text-blue-600') : (isDark ? 'border-transparent text-gray-400 hover:text-gray-200' : 'border-transparent text-gray-500 hover:text-gray-700')}`}
          >
            草稿箱 ({drafts.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'session' ? (
            generatedResults.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {generatedResults.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => handleSelectResult(result.id)}
                    className="relative aspect-square rounded-xl overflow-hidden group border border-transparent hover:border-blue-500 transition-all"
                  >
                    <img src={result.thumbnail} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <i className="fas fa-image text-4xl mb-3 opacity-30"></i>
                <p>暂无本次创作记录</p>
              </div>
            )
          ) : (
            drafts.length > 0 ? (
              <div className="space-y-4">
                {drafts.map((draft) => (
                  <div 
                    key={draft.id}
                    // onClick={() => loadDraft(draft)}
                    className={`p-3 rounded-xl border flex gap-3 cursor-pointer transition-all ${isDark ? 'bg-gray-800 border-gray-700 hover:border-gray-600' : 'bg-gray-50 border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200">
                      {draft.generatedResults && draft.generatedResults.length > 0 ? (
                        <img src={draft.generatedResults[0].thumbnail} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <i className="fas fa-image"></i>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{draft.name}</h3>
                      <p className={`text-xs mt-1 line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{draft.prompt}</p>
                      <div className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        {new Date(draft.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <i className="fas fa-archive text-4xl mb-3 opacity-30"></i>
                <p>草稿箱空空如也</p>
              </div>
            )
          )}
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}
