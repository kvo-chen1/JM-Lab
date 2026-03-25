// Agent案例列表页

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useAgentCases } from './hooks/useAgentCases';
import { CaseGrid } from './components/CaseGrid';
import { AgentCase, CasesTab } from './types';
import {
  Sparkles,
  TrendingUp,
  Clock,
  Filter,
  Plus,
  ChevronLeft,
} from 'lucide-react';

const AgentCasesPage: React.FC = () => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const {
    cases,
    loading,
    hasMore,
    total,
    currentTab,
    sort,
    popularTags,
    selectedTag,
    error,
    setCurrentTab,
    setSort,
    setSelectedTag,
    loadMore,
  } = useAgentCases();

  // 调试：查看 currentTab 变化
  useEffect(() => {
    console.log('[AgentCases] currentTab:', currentTab, 'cases:', cases.length);
  }, [currentTab, cases]);

  // 处理案例点击
  const handleCaseClick = (caseData: AgentCase) => {
    navigate(`/agent-cases/${caseData.id}`);
  };

  // 处理作者点击
  const handleAuthorClick = (authorId: string) => {
    navigate(`/author/${authorId}`);
  };

  // Tab配置
  const tabs: { value: CasesTab; label: string }[] = [
    { value: 'all', label: '全部案例' },
    { value: 'agent', label: 'Agent案例' },
    { value: 'skill', label: 'Skill案例' },
  ];

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0a0f0a]' : 'bg-gray-50'}`}>
      {/* Header */}
      <header className={`
        sticky top-0 z-30 px-4 sm:px-6 py-4
        border-b backdrop-blur-md
        ${isDark 
          ? 'bg-[#0a0f0a]/80 border-[#2a2f2a]' 
          : 'bg-white/80 border-gray-200'
        }
      `}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            {/* 左侧：返回按钮和标题 */}
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(-1)}
                className={`
                  p-2 rounded-lg transition-colors
                  ${isDark 
                    ? 'hover:bg-[#2a2f2a] text-gray-400' 
                    : 'hover:bg-gray-100 text-gray-600'
                  }
                `}
              >
                <ChevronLeft className="w-5 h-5" />
              </motion.button>

              <div className="flex items-center gap-3">
                <div className="
                  w-10 h-10 rounded-xl flex items-center justify-center
                  bg-gradient-to-br from-[#C02C38] to-[#E85D75]
                ">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className={`
                    text-xl font-bold
                    ${isDark ? 'text-white' : 'text-gray-900'}
                  `}>
                    Agent案例
                  </h1>
                  <p className={`
                    text-xs
                    ${isDark ? 'text-gray-500' : 'text-gray-500'}
                  `}>
                    {total > 0 ? `共 ${total} 个案例` : '探索AI创作灵感'}
                  </p>
                </div>
              </div>
            </div>

            {/* 右侧：发布按钮 */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/agent')}
              className="
                flex items-center gap-2 px-4 py-2 rounded-xl
                bg-gradient-to-r from-[#C02C38] to-[#E85D75]
                text-white text-sm font-medium
                shadow-lg shadow-red-500/20
                hover:shadow-xl hover:shadow-red-500/30
                transition-shadow
              "
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">发布案例</span>
            </motion.button>
          </div>
        </div>
      </header>

      {/* Filter Bar */}
      <div className={`
        sticky top-[73px] z-20 px-4 sm:px-6 py-3
        border-b backdrop-blur-md
        ${isDark 
          ? 'bg-[#0a0f0a]/80 border-[#2a2f2a]' 
          : 'bg-gray-50/80 border-gray-200'
        }
      `}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center gap-4">
            {/* Tabs */}
            <div className={`
              flex items-center p-1 rounded-xl
              ${isDark ? 'bg-[#1a1f1a]' : 'bg-white'}
            `}>
              {tabs.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setCurrentTab(tab.value)}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium
                    transition-all duration-200
                    ${currentTab === tab.value
                      ? isDark
                        ? 'bg-[#2a2f2a] text-white'
                        : 'bg-gray-100 text-gray-900'
                      : isDark
                        ? 'text-gray-400 hover:text-gray-300'
                        : 'text-gray-500 hover:text-gray-700'
                    }
                  `}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* 排序选项 */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSort('newest')}
                className={`
                  flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm
                  transition-colors
                  ${sort === 'newest'
                    ? isDark
                      ? 'bg-[#2a2f2a] text-white'
                      : 'bg-white text-gray-900 shadow-sm'
                    : isDark
                      ? 'text-gray-400 hover:text-gray-300'
                      : 'text-gray-500 hover:text-gray-700'
                  }
                `}
              >
                <Clock className="w-4 h-4" />
                <span className="hidden sm:inline">最新</span>
              </button>
              <button
                onClick={() => setSort('popular')}
                className={`
                  flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm
                  transition-colors
                  ${sort === 'popular'
                    ? isDark
                      ? 'bg-[#2a2f2a] text-white'
                      : 'bg-white text-gray-900 shadow-sm'
                    : isDark
                      ? 'text-gray-400 hover:text-gray-300'
                      : 'text-gray-500 hover:text-gray-700'
                  }
                `}
              >
                <TrendingUp className="w-4 h-4" />
                <span className="hidden sm:inline">热门</span>
              </button>
            </div>

            {/* 标签筛选 */}
            {popularTags.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                <Filter className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                <button
                  onClick={() => setSelectedTag(null)}
                  className={`
                    px-3 py-1.5 rounded-full text-xs whitespace-nowrap
                    transition-colors
                    ${selectedTag === null
                      ? 'bg-gradient-to-r from-[#C02C38] to-[#E85D75] text-white'
                      : isDark
                        ? 'bg-[#1a1f1a] text-gray-400 hover:bg-[#2a2f2a]'
                        : 'bg-white text-gray-600 hover:bg-gray-100'
                    }
                  `}
                >
                  全部
                </button>
                {popularTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                    className={`
                      px-3 py-1.5 rounded-full text-xs whitespace-nowrap
                      transition-colors
                      ${selectedTag === tag
                        ? 'bg-gradient-to-r from-[#C02C38] to-[#E85D75] text-white'
                        : isDark
                          ? 'bg-[#1a1f1a] text-gray-400 hover:bg-[#2a2f2a]'
                          : 'bg-white text-gray-600 hover:bg-gray-100'
                      }
                    `}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="px-4 sm:px-6 py-6">
        <div className="max-w-7xl mx-auto">
          {/* 错误提示 */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="
                mb-6 p-4 rounded-xl text-center
                bg-red-50 dark:bg-red-900/20
                text-red-600 dark:text-red-400
              "
            >
              {error}
            </motion.div>
          )}

          {/* 案例网格 */}
          <CaseGrid
            cases={cases}
            loading={loading}
            hasMore={hasMore}
            onLoadMore={loadMore}
            onCaseClick={handleCaseClick}
            onAuthorClick={handleAuthorClick}
            emptyText={
              currentTab === 'agent' ? '暂无Agent案例' :
              currentTab === 'skill' ? '暂无Skill案例' :
              '暂无案例'
            }
          />
        </div>
      </main>
    </div>
  );
};

export default AgentCasesPage;
