import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';

export default function PlanLibrary() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [savedPlans, setSavedPlans] = useState<Array<{ id: string; title: string; query: string; aiText: string; ts: number }>>([]);

  useEffect(() => {
    // 从本地存储加载保存的方案
    try {
      const plansRaw = localStorage.getItem('TOOLS_SAVED_PLANS');
      if (plansRaw) {
        const plans = JSON.parse(plansRaw);
        setSavedPlans(plans);
      }
    } catch (error) {
      console.error('加载方案库失败:', error);
    }
  }, []);

  const applyPlanToCreate = (planId: string) => {
    const plan = savedPlans.find(x => x.id === planId);
    if (!plan) return;
    const content = plan.aiText || plan.query;
    const url = `/create?from=plan-library&prompt=${encodeURIComponent(content)}`;
    navigate(url);
  };

  const removePlan = (planId: string) => {
    const nextPlans = savedPlans.filter(x => x.id !== planId);
    setSavedPlans(nextPlans);
    try {
      localStorage.setItem('TOOLS_SAVED_PLANS', JSON.stringify(nextPlans));
    } catch (error) {
      console.error('保存方案库失败:', error);
    }
  };

  const clearPlans = () => {
    setSavedPlans([]);
    try {
      localStorage.removeItem('TOOLS_SAVED_PLANS');
      toast.success('已清空方案库');
    } catch (error) {
      console.error('清空方案库失败:', error);
    }
  };

  const copyPlanContent = async (plan: { aiText: string; query: string }) => {
    try {
      await navigator.clipboard.writeText(plan.aiText || plan.query);
      toast.success('已复制方案内容');
    } catch (error) {
      console.error('复制失败:', error);
    }
  };

  return (
    <div className="p-6">
      {/* 方案库标题和清空按钮 */}
      <div className="flex items-center justify-between mb-6 px-2">
        <h3 className="font-bold text-lg">我的方案库 ({savedPlans.length})</h3>
        {savedPlans.length > 0 && (
          <button 
            onClick={clearPlans} 
            className="text-xs text-red-500 hover:underline"
          >
            清空全部
          </button>
        )}
      </div>

      {/* 方案列表 */}
      <AnimatePresence>
        {savedPlans.length > 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {savedPlans.map(p => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`p-4 rounded-2xl border transition-all hover:shadow-md ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-sm line-clamp-1">{p.title}</h4>
                  <span className="text-[10px] opacity-50">{new Date(p.ts).toLocaleDateString()}</span>
                </div>
                <p className="text-xs opacity-60 line-clamp-2 mb-3 h-8">{p.aiText || p.query}</p>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => removePlan(p.id)} 
                      className="text-gray-400 hover:text-red-500 text-xs"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                    <button 
                      onClick={() => copyPlanContent(p)} 
                      className="text-gray-400 hover:text-blue-500 text-xs"
                    >
                      <i className="far fa-copy"></i>
                    </button>
                  </div>
                  <button 
                    onClick={() => applyPlanToCreate(p.id)} 
                    className="text-xs font-medium text-blue-600 hover:underline"
                  >
                    应用
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-12 opacity-50 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl"
          >
            <i className="fas fa-bookmark text-4xl mb-3 text-gray-300 dark:text-gray-700"></i>
            <p className="text-sm">暂无保存的方案</p>
            <p className="text-xs mt-2 opacity-70">在工具页面生成并保存创意方案后，将显示在这里</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
