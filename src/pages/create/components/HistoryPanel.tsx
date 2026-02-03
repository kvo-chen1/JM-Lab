import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCreateStore } from '@/pages/create/hooks/useCreateStore';
import { useTheme } from '@/hooks/useTheme';

export default function HistoryPanel({ onClose }: { onClose: () => void }) {
  const { isDark } = useTheme();
  const generatedResults = useCreateStore((state) => state.generatedResults);
  const setGeneratedResults = useCreateStore((state) => state.setGeneratedResults);
  const setSelectedResult = useCreateStore((state) => state.setSelectedResult);
  const setPrompt = useCreateStore((state) => state.setPrompt);
  const [drafts, setDrafts] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'session' | 'drafts' | 'history'>('session');

  useEffect(() => {
    console.log('HistoryPanel mounted');
    // Load drafts from localStorage
    try {
      const savedDrafts = JSON.parse(localStorage.getItem('CREATE_DRAFTS') || '[]');
      setDrafts(savedDrafts);
      
      // Load history from localStorage
      const savedHistory = JSON.parse(localStorage.getItem('CREATE_HISTORY') || '[]');
      setHistory(savedHistory);
    } catch (e) {
      console.error('Failed to load drafts or history', e);
    }
  }, []);

  const handleSelectResult = (id: number) => {
    setSelectedResult(id);
    onClose();
  };

  const handleSelectHistory = (historyItem: any) => {
    // 从历史记录中恢复创作
    const result = {
      id: Date.now(),
      thumbnail: historyItem.thumbnail,
      score: 80,
    };
    setGeneratedResults([result]);
    setSelectedResult(result.id);
    if (historyItem.prompt) {
      setPrompt(historyItem.prompt);
    }
    onClose();
  };

  const handleClearHistory = () => {
    if (confirm('确定要清空所有历史记录吗？此操作不可恢复。')) {
      localStorage.removeItem('CREATE_HISTORY');
      setHistory([]);
    }
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
        <>
          <button 
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
          >
            <i className="fas fa-times"></i>
          </button>
        </>

        {/* Tabs */}
        <>
          <button
            onClick={() => setActiveTab('session')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'session' ? (isDark ? 'border-blue-500 text-blue-400' : 'border-blue-600 text-blue-600') : (isDark ? 'border-transparent text-gray-400 hover:text-gray-200' : 'border-transparent text-gray-500 hover:text-gray-700')}`}
          >
            本次创作 ({generatedResults.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'history' ? (isDark ? 'border-blue-500 text-blue-400' : 'border-blue-600 text-blue-600') : (isDark ? 'border-transparent text-gray-400 hover:text-gray-200' : 'border-transparent text-gray-500 hover:text-gray-700')}`}
          >
            历史记录 ({history.length})
          </button>
          <button
            onClick={() => setActiveTab('drafts')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'drafts' ? (isDark ? 'border-blue-500 text-blue-400' : 'border-blue-600 text-blue-600') : (isDark ? 'border-transparent text-gray-400 hover:text-gray-200' : 'border-transparent text-gray-500 hover:text-gray-700')}`}
          >
            草稿箱 ({drafts.length})
          </button>
        </>

        {/* Content */}
        <>
          {activeTab === 'session' ? (
            generatedResults.length > 0 ? (
              <>
                {generatedResults.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => handleSelectResult(result.id)}
                    className="relative aspect-square rounded-xl overflow-hidden group border border-transparent hover:border-blue-500 transition-all"
                  >
                    <img src={result.thumbnail} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </>
            ) : (
              <>
                <i className="fas fa-image text-4xl mb-3 opacity-30"></i>
                <p>暂无本次创作记录</p>
              </>
            )
          ) : activeTab === 'history' ? (
            history.length > 0 ? (
              <>
                <>
                  <button
                    onClick={handleClearHistory}
                    className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${isDark ? 'text-red-400 hover:bg-red-900/30' : 'text-red-500 hover:bg-red-50'}`}
                  >
                    <i className="fas fa-trash-alt mr-1"></i>清空历史
                  </button>
                </>
                {history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelectHistory(item)}
                    className={`w-full p-3 rounded-xl border flex gap-3 transition-all text-left ${isDark ? 'bg-gray-800 border-gray-700 hover:border-gray-600' : 'bg-gray-50 border-gray-200 hover:border-gray-300'}`}
                  >
                    <>
                      <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
                    </>
                    <>
                      <p className={`text-xs line-clamp-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{item.prompt || '无描述'}</p>
                      {item.stylePreset && (
                        <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full ${isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                          {item.stylePreset}
                        </span>
                      )}
                      <>
                        {new Date(item.timestamp).toLocaleString()}
                      </>
                    </>
                  </button>
                ))}
              </>
            ) : (
              <>
                <i className="fas fa-history text-4xl mb-3 opacity-30"></i>
                <p>暂无历史记录</p>
                <p className="text-xs mt-1 opacity-60">修改纹样属性后会自动保存</p>
              </>
            )
          ) : (
            drafts.length > 0 ? (
              <>
                {drafts.map((draft) => (
                  <>
                    <>
                      {draft.generatedResults && draft.generatedResults.length > 0 ? (
                        <img src={draft.generatedResults[0].thumbnail} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <>
                          <i className="fas fa-image"></i>
                        </>
                      )}
                    </>
                    <>
                      <h3 className={`font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{draft.name}</h3>
                      <p className={`text-xs mt-1 line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{draft.prompt}</p>
                      <>
                        {new Date(draft.createdAt).toLocaleString()}
                      </>
                    </>
                  </>
                ))}
              </>
            ) : (
              <>
                <i className="fas fa-archive text-4xl mb-3 opacity-30"></i>
                <p>草稿箱空空如也</p>
              </>
            )
          )}
        </>
      </motion.div>
    </motion.div>,
    document.body
  );
}
