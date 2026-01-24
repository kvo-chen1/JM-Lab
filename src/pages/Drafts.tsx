import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/hooks/useTheme';
import { useCreateStore } from './create/hooks/useCreateStore';
import { toast } from 'sonner';
import { 
  Clock, 
  Search, 
  Trash2, 
  Edit3, 
  Download, 
  FileEdit, 
  LayoutGrid, 
  List as ListIcon,
  MoreVertical,
  Calendar,
  AlertCircle
} from 'lucide-react';

interface DraftData {
  id?: string; // Saved drafts have IDs
  name?: string;
  prompt: string;
  selectedResult: number | null;
  currentStep: number;
  aiExplanation: string;
  updatedAt: number;
  generatedResults?: any[];
  [key: string]: any;
}

export default function Drafts() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const { loadDraft } = useCreateStore();

  // State
  const [activeDraft, setActiveDraft] = useState<DraftData | null>(null);
  const [savedDrafts, setSavedDrafts] = useState<DraftData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Load Data
  useEffect(() => {
    // Load Active Session
    try {
      const rawActive = localStorage.getItem('CREATE_DRAFT');
      if (rawActive) {
        const parsed = JSON.parse(rawActive);
        // Simple validation
        if (parsed && typeof parsed === 'object') {
          setActiveDraft(parsed);
        }
      }
    } catch (e) {
      console.error('Failed to load active draft', e);
    }

    // Load Saved Drafts
    try {
      const rawSaved = localStorage.getItem('CREATE_DRAFTS');
      if (rawSaved) {
        const parsed = JSON.parse(rawSaved);
        if (Array.isArray(parsed)) {
          setSavedDrafts(parsed);
        }
      }
    } catch (e) {
      console.error('Failed to load saved drafts', e);
    }
  }, []);

  // Filter & Sort
  const filteredDrafts = useMemo(() => {
    let result = [...savedDrafts];

    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(d => 
        (d.name && d.name.toLowerCase().includes(term)) || 
        (d.prompt && d.prompt.toLowerCase().includes(term))
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'newest') return (b.updatedAt || 0) - (a.updatedAt || 0);
      if (sortBy === 'oldest') return (a.updatedAt || 0) - (b.updatedAt || 0);
      if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
      return 0;
    });

    return result;
  }, [savedDrafts, searchTerm, sortBy]);

  // Actions
  const handleResumeActive = () => {
    // Active draft is already in CREATE_DRAFT, just go to create page
    // The store initializes from defaults, but we might want to explicitly load it if the store doesn't auto-load from CREATE_DRAFT on mount.
    // Based on previous analysis, Drafts.tsx handled resume by just navigating.
    // However, to be safe and use our new loadDraft:
    if (activeDraft) {
      loadDraft(activeDraft);
      navigate('/create');
    }
  };

  const handleLoadDraft = (draft: DraftData) => {
    loadDraft(draft);
    navigate('/create');
    toast.success('已加载草稿');
  };

  const handleDeleteDraft = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('确定要删除这个草稿吗？此操作无法撤销。')) {
      const newDrafts = savedDrafts.filter(d => d.id !== id);
      setSavedDrafts(newDrafts);
      localStorage.setItem('CREATE_DRAFTS', JSON.stringify(newDrafts));
      toast.success('草稿已删除');
    }
  };

  const handleClearActive = () => {
    if (confirm('确定要清除当前未保存的活动会话吗？')) {
      localStorage.removeItem('CREATE_DRAFT');
      setActiveDraft(null);
      toast.success('活动会话已清除');
    }
  };

  const handleExport = (e: React.MouseEvent, draft: DraftData) => {
    e.stopPropagation();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(draft, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${draft.name || 'draft'}-${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    toast.success('导出成功');
  };

  // Helper for Thumbnail
  const getThumbnail = (draft: DraftData) => {
    if (draft.generatedResults && draft.generatedResults.length > 0 && draft.selectedResult) {
       const selected = draft.generatedResults.find((r: any) => r.id === draft.selectedResult);
       return selected ? selected.imageUrl : draft.generatedResults[0].imageUrl; // Fallback
    }
    // Try to find any image
    if (draft.generatedResults && draft.generatedResults.length > 0) {
        return draft.generatedResults[0].imageUrl;
    }
    return null;
  };

  return (
    <main className={`container mx-auto px-4 py-8 min-h-screen ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">草稿箱</h1>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            管理您的所有创作草稿与历史存档
          </p>
        </div>
        
        {/* Search & Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="搜索草稿..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`pl-9 pr-4 py-2 rounded-lg border w-full sm:w-64 ${
                isDark 
                  ? 'bg-gray-800 border-gray-700 focus:ring-blue-500' 
                  : 'bg-white border-gray-200 focus:ring-blue-500'
              } focus:outline-none focus:ring-2`}
            />
          </div>
          
          <div className="flex gap-2">
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className={`px-3 py-2 rounded-lg border ${
                isDark 
                  ? 'bg-gray-800 border-gray-700' 
                  : 'bg-white border-gray-200'
              } focus:outline-none`}
            >
              <option value="newest">最新修改</option>
              <option value="oldest">最早创建</option>
              <option value="name">名称排序</option>
            </select>
            
            <div className={`flex rounded-lg border overflow-hidden ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? (isDark ? 'bg-gray-700' : 'bg-gray-100') : ''}`}
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? (isDark ? 'bg-gray-700' : 'bg-gray-100') : ''}`}
              >
                <ListIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Active Session Section */}
      {activeDraft && (
        <section className="mb-10 animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="w-2 h-8 rounded-full bg-green-500 block"></span>
              当前活动会话
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200">
              自动保存
            </span>
          </div>
          
          <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl p-6 shadow-sm relative overflow-hidden group`}>
            <div className="flex flex-col md:flex-row gap-6">
               {/* Content Preview */}
               <div className="flex-1 space-y-4">
                 <div className="flex justify-between items-start">
                   <div>
                      <h3 className="text-lg font-medium mb-1">未命名创作</h3>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} flex items-center gap-4`}>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(activeDraft.updatedAt).toLocaleString()}</span>
                        <span className="flex items-center gap-1">步骤 {activeDraft.currentStep}/3</span>
                      </p>
                   </div>
                   <div className="flex gap-2">
                      <button 
                        onClick={handleResumeActive}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
                      >
                        <Edit3 className="w-4 h-4" /> 继续编辑
                      </button>
                      <button 
                        onClick={handleClearActive}
                        className={`px-3 py-2 rounded-lg border transition-colors ${
                          isDark 
                            ? 'border-gray-700 hover:bg-gray-700 text-gray-400' 
                            : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                        }`}
                        title="清除此会话"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                   </div>
                 </div>

                 <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
                    <p className="text-sm font-medium mb-1 opacity-70">提示词</p>
                    <p className="line-clamp-2">{activeDraft.prompt || '（无提示词）'}</p>
                 </div>
               </div>
            </div>
          </div>
        </section>
      )}

      {/* Saved Drafts List */}
      <section>
        <div className="flex items-center justify-between mb-4">
           <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="w-2 h-8 rounded-full bg-blue-500 block"></span>
              已保存草稿 ({savedDrafts.length})
           </h2>
        </div>

        {filteredDrafts.length === 0 ? (
          <div className={`text-center py-20 rounded-2xl border ${isDark ? 'border-gray-800 bg-gray-900/50' : 'border-gray-100 bg-gray-50'}`}>
            <FileEdit className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium mb-1">暂无保存的草稿</h3>
            <p className="text-gray-500 text-sm">
              {searchTerm ? '没有找到匹配的草稿' : '在创作中心点击"保存草稿"可将作品存档于此'}
            </p>
            {!searchTerm && (
              <button 
                onClick={() => navigate('/create')}
                className="mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors"
              >
                开始创作
              </button>
            )}
          </div>
        ) : (
          <div className={
            viewMode === 'grid' 
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
              : "flex flex-col gap-4"
          }>
            {filteredDrafts.map((draft) => {
              const thumbnail = getThumbnail(draft);
              
              return (
                <div 
                  key={draft.id || Math.random().toString()}
                  className={`group relative rounded-xl border overflow-hidden transition-all hover:shadow-lg ${
                    isDark ? 'bg-gray-800 border-gray-700 hover:border-gray-600' : 'bg-white border-gray-200 hover:border-gray-300'
                  } ${viewMode === 'list' ? 'flex flex-row h-32' : 'flex flex-col'}`}
                  onClick={() => handleLoadDraft(draft)}
                >
                  {/* Thumbnail */}
                  <div className={`relative overflow-hidden ${viewMode === 'list' ? 'w-48 h-full' : 'aspect-video w-full'}`}>
                    {thumbnail ? (
                      <img 
                        src={thumbnail} 
                        alt="Preview" 
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className={`w-full h-full flex flex-col items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        {draft.activeTool === 'layout' ? (
                             <LayoutGrid className="w-8 h-8 text-gray-400 mb-2" />
                         ) : draft.activeTool === 'trace' ? (
                             <div className="w-8 h-8 text-gray-400 mb-2 flex items-center justify-center">
                                 <i className="fas fa-landmark text-2xl"></i>
                             </div>
                         ) : draft.activeTool === 'mockup' ? (
                             <div className="w-8 h-8 text-gray-400 mb-2 flex items-center justify-center">
                                 <i className="fas fa-box-open text-2xl"></i>
                             </div>
                         ) : draft.activeTool === 'tile' ? (
                             <div className="w-8 h-8 text-gray-400 mb-2 flex items-center justify-center">
                                 <i className="fas fa-border-all text-2xl"></i>
                             </div>
                         ) : (
                             <FileEdit className="w-8 h-8 text-gray-400 mb-2" />
                         )}
                         <span className="text-xs text-gray-500">
                             {draft.activeTool === 'layout' ? '版式设计' : 
                              draft.activeTool === 'trace' ? '文化溯源' : 
                              draft.activeTool === 'mockup' ? '模型预览' :
                              draft.activeTool === 'tile' ? '图案平铺' : '无预览图'}
                         </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold line-clamp-1 group-hover:text-blue-500 transition-colors" title={draft.name}>
                          {draft.name || '未命名草稿'}
                        </h3>
                      </div>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} line-clamp-2 mb-3 h-8`}>
                        {draft.prompt || '无提示词内容...'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(draft.updatedAt || Date.now()).toLocaleDateString()}
                      </span>
                      
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                         <button 
                            onClick={(e) => handleExport(e, draft)}
                            className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500"
                            title="导出"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={(e) => handleDeleteDraft(e, draft.id!)}
                            className="p-1.5 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500"
                            title="删除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
