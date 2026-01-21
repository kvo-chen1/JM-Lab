import React from 'react';
import { useCreateStore } from '../../hooks/useCreateStore';
import { useTheme } from '@/hooks/useTheme';
import { llmService } from '@/services/llmService';
import { promptTemplates } from '@/data/promptTemplates';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function SketchPanel() {
  const { isDark } = useTheme();
  const { 
    prompt, setPrompt, 
    isGenerating, setIsGenerating, 
    stylePreset, updateState,
    generateCount,
    setGeneratedResults,
    setSelectedResult,
    setCurrentStep,
    streamStatus
  } = useCreateStore();

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    updateState({ streamStatus: 'running' });
    
    try {
        // 创作中心始终使用千问模型
        llmService.setCurrentModel('qwen');
        
        const inputBase = (prompt || '天津文化设计灵感').trim();
        const input = stylePreset ? `${inputBase}；风格：${stylePreset}` : inputBase;
        const currentModel = llmService.getCurrentModel();
        
        const r = await llmService.generateImage({ 
            prompt: input, 
            size: '1024x1024', 
            n: Math.min(Math.max(generateCount, 1), 6), 
            response_format: 'url', 
            watermark: true 
        });

        // 处理数据格式，兼容API返回和模拟数据
        const dataArray = (r as any)?.data?.data || (r as any)?.data || [];
        const urls = dataArray.map((d: any) => d.url || (d.b64_json ? `data:image/png;base64,${d.b64_json}` : '')).filter(Boolean);

        if (urls.length) {
            const mapped = urls.map((u: string, idx: number) => ({ id: Date.now() + idx, thumbnail: u, score: 80 }));
            setGeneratedResults(mapped);
            setSelectedResult(mapped[0]?.id ?? null);
            setCurrentStep(2);
            toast.success(`${currentModel.name}已生成${urls.length}张方案，可在下方查看并进行下载、编辑等操作`);
        } else {
             toast.info('未返回图片，使用模拟数据');
             const fallback = [
                 { id: Date.now(), thumbnail: 'https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=600&h=400&fit=crop', score: 85 },
                 { id: Date.now()+1, thumbnail: 'https://images.unsplash.com/photo-1558981806-ec527fa84f3d?w=600&h=400&fit=crop', score: 82 }
             ];
             setGeneratedResults(fallback);
             setSelectedResult(fallback[0].id);
        }
    } catch (e) {
        console.error(e);
        toast.error('生成失败，请重试');
    } finally {
        setIsGenerating(false);
        updateState({ streamStatus: 'completed' });
    }
  };

  return (
    <div className="space-y-8">
      {/* Intro Section */}
      <div className={`p-4 rounded-xl border ${
        isDark ? 'bg-gray-800/30 border-gray-800' : 'bg-blue-50/50 border-blue-100'
      }`}>
        <div className="flex items-start gap-3">
          <div className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
            isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-[#003366]'
          }`}>
            <i className="fas fa-magic text-sm"></i>
          </div>
          <div>
            <h3 className={`text-sm font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>智能设计助手</h3>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              输入您的创意构想，AI 将结合天津文化元素为您生成专业的设计方案。支持多风格探索与快速迭代。
            </p>
          </div>
        </div>
      </div>

      {/* Prompt Input */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className={`text-sm font-semibold flex items-center gap-2 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
            <i className="fas fa-pen-fancy text-xs text-red-500"></i>
            创意描述
          </label>
          <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            {prompt.length}/200
          </span>
        </div>
        
        <div className="relative group">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="描述您想要创作的内容，例如：具有中国传统元素的现代包装设计，融入杨柳青年画风格..."
            className={`w-full p-4 rounded-2xl h-40 text-sm focus:outline-none focus:ring-2 focus:ring-[#C02C38]/50 transition-all resize-none shadow-sm ${
              isDark 
                ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-500 border group-hover:border-gray-600' 
                : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 border group-hover:border-red-200'
            }`}
          />
          <div className="absolute bottom-3 right-3 flex gap-2">
            <button 
              onClick={async () => {
                if (!prompt.trim()) return;
                
                // 添加优化提示词功能
                try {
                  // 创作中心始终使用千问模型
                  llmService.setCurrentModel('qwen');
                  const instruction = `请将下面的创作提示优化为更清晰的中文指令，保留原意，突出关键元素（主题、风格、色彩、素材）。用1-3个短句表达，避免礼貌语或解释，只输出优化后的文本：

${prompt}`;
                  const result = await llmService.generateResponse(instruction);
                  const polished = String(result || '').trim();
                  if (polished) {
                    setPrompt(polished);
                    toast.success('提示词优化完成');
                  } else {
                    toast.warning('未获得有效优化结果');
                  }
                } catch (e) {
                  toast.error('优化失败，请稍后重试');
                }
              }}
              disabled={!prompt.trim()}
              className={`p-1.5 rounded-lg text-xs transition-colors ${(
                isDark 
                  ? 'hover:bg-gray-700 text-gray-500 disabled:text-gray-700' 
                  : 'hover:bg-gray-100 text-gray-400 hover:text-blue-600 disabled:text-gray-300'
              )}`}
              title="AI优化提示词"
            >
              <i className="fas fa-magic"></i>
            </button>
            <button 
              onClick={() => setPrompt('')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${(
                isDark 
                  ? 'hover:bg-gray-700 text-gray-500' 
                  : 'hover:bg-gray-100 text-gray-400 hover:text-red-600'
              )}`}
              title="清空"
            >
              <i className="fas fa-trash-alt"></i>
            </button>
          </div>
        </div>
        
        {/* Templates Pills */}
        <div className="flex flex-wrap gap-2 pt-1">
          {promptTemplates?.slice(0, 5).map((t: any) => (
            <button
              key={t.id}
              onClick={() => setPrompt(t.text)}
              className={`text-[11px] px-3 py-1.5 rounded-full border transition-all hover:scale-105 active:scale-95 ${
                isDark 
                  ? 'bg-gray-800/50 border-gray-700 hover:border-gray-600 text-gray-300' 
                  : 'bg-white border-gray-200 hover:border-red-200 hover:text-[#C02C38] text-gray-600 shadow-sm'
              }`}
            >
              {t.name}
            </button>
          ))}
          <button
            onClick={async () => {
              try {
                setIsGenerating(true);
                const randomPrompt = promptTemplates[Math.floor(Math.random() * promptTemplates.length)];
                setPrompt(randomPrompt.text);
                toast.success('已获取随机灵感');
              } catch (e) {
                console.error(e);
                toast.error('获取随机灵感失败');
              } finally {
                setIsGenerating(false);
              }
            }}
            className={`text-[11px] px-3 py-1.5 rounded-full border transition-all hover:scale-105 active:scale-95 ${
              isDark 
                ? 'bg-blue-900/30 border-blue-700 hover:border-blue-500 text-blue-300' 
                : 'bg-blue-50 border-blue-200 hover:border-blue-400 hover:text-blue-600 text-blue-700 shadow-sm'
            }`}
          >
            <i className="fas fa-random mr-1"></i>随机灵感
          </button>
        </div>
      </div>

      <div className={`h-px w-full ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}></div>

      {/* Settings Grid */}
      <div className="grid grid-cols-2 gap-5">
        <div className="space-y-2.5">
          <label className={`text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            风格预设
          </label>
          <div className="relative">
            <select
              value={stylePreset}
              onChange={(e) => updateState({ stylePreset: e.target.value })}
              className={`w-full p-2.5 pl-3 pr-8 rounded-xl text-sm appearance-none cursor-pointer transition-colors ${
                isDark 
                  ? 'bg-gray-800 border-gray-700 text-white hover:border-gray-600' 
                  : 'bg-white border-gray-200 text-gray-900 hover:border-red-200 shadow-sm'
              } border focus:outline-none focus:ring-2 focus:ring-[#C02C38]/20`}
            >
              <option value="">默认风格</option>
              <option value="国潮">国潮</option>
              <option value="极简">极简</option>
              <option value="复古">复古</option>
              <option value="赛博朋克">赛博朋克</option>
              <option value="水墨">水墨</option>
            </select>
            <div className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${
              isDark ? 'text-gray-500' : 'text-gray-400'
            }`}>
              <i className="fas fa-chevron-down text-xs"></i>
            </div>
          </div>
        </div>

        <div className="space-y-2.5">
          <label className={`text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            生成数量
          </label>
          <div className={`flex items-center justify-between p-1 rounded-xl border ${
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'
          }`}>
            <button 
              onClick={() => updateState({ generateCount: Math.max(1, generateCount - 1) })}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-50 text-gray-500'
              }`}
            >
              <i className="fas fa-minus text-xs"></i>
            </button>
            <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {generateCount}
            </span>
            <button 
              onClick={() => updateState({ generateCount: Math.min(6, generateCount + 1) })}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-50 text-gray-500'
              }`}
            >
              <i className="fas fa-plus text-xs"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="pt-4">
        <motion.button
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`w-full py-4 rounded-2xl font-bold text-white shadow-xl transition-all relative overflow-hidden group ${
            isGenerating 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-gradient-to-r from-[#C02C38] to-[#E60012] hover:shadow-red-500/40'
          }`}
        >
          {/* Shine effect */}
          <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-shine" />
          
          {isGenerating ? (
            <span className="flex items-center justify-center gap-2">
              <i className="fas fa-circle-notch fa-spin"></i>
              <span>正在设计中...</span>
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <i className="fas fa-magic"></i>
              <span>立即生成方案</span>
            </span>
          )}
        </motion.button>
        <p className={`text-center mt-3 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          <i className="fas fa-info-circle mr-1"></i>
          每次生成消耗 2 点算力
        </p>
      </div>
    </div>
  );
}
