import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useAgentStore, PRESET_STYLES } from '../hooks/useAgentStore';
import { Shuffle, ChevronRight, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function StyleSelector() {
  const { isDark } = useTheme();
  const { selectedStyle, selectStyle, addMessage, setCurrentAgent } = useAgentStore();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleStyleSelect = (styleId: string) => {
    selectStyle(styleId);
    const style = PRESET_STYLES.find(s => s.id === styleId);
    if (style) {
      toast.success(`已选择风格：${style.name}`);
    }
  };

  const handleSurpriseMe = () => {
    const randomStyle = PRESET_STYLES[Math.floor(Math.random() * PRESET_STYLES.length)];
    selectStyle(randomStyle.id);
    toast.success(`随机选择了：${randomStyle.name}`);
  };

  const handleStartDesign = async () => {
    if (!selectedStyle) {
      toast.error('请先选择一个风格');
      return;
    }

    setIsGenerating(true);
    const style = PRESET_STYLES.find(s => s.id === selectedStyle);

    // 添加设计师消息
    addMessage({
      role: 'designer',
      content: `好的！我将以「${style?.name}」风格为你设计。正在调用AI模型生成概念图，请稍候...`,
      type: 'text'
    });

    // 模拟生成延迟
    setTimeout(() => {
      setIsGenerating(false);
      
      // 添加生成结果消息
      addMessage({
        role: 'designer',
        content: '概念图已生成！这是根据你选择的风格设计的IP形象初稿。你觉得怎么样？',
        type: 'image',
        metadata: {
          images: [
            `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=400&fit=crop&random=${Date.now()}`,
            `https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400&h=400&fit=crop&random=${Date.now() + 1}`,
            `https://images.unsplash.com/photo-1560964645-6c9e2c3c5b8e?w=400&h=400&fit=crop&random=${Date.now() + 2}`,
            `https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop&random=${Date.now() + 3}`
          ]
        }
      });

      // 添加满意度检查消息
      setTimeout(() => {
        addMessage({
          role: 'designer',
          content: '请问你对当前设计满意吗？如果满意，我可以继续为你制作：\n• 短视频\n• 剧情故事短片\n• 文创周边\n• 宣传海报',
          type: 'satisfaction-check'
        });
      }, 1000);
    }, 3000);
  };

  return (
    <div className="space-y-4">
      {/* Style Grid */}
      <div className="grid grid-cols-2 gap-2">
        {PRESET_STYLES.map((style, index) => (
          <motion.button
            key={style.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => handleStyleSelect(style.id)}
            className={`relative group rounded-xl overflow-hidden border-2 transition-all ${
              selectedStyle === style.id
                ? 'border-[#C02C38] ring-2 ring-[#C02C38]/20'
                : isDark 
                  ? 'border-gray-700 hover:border-gray-600' 
                  : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {/* Style Image */}
            <div className="aspect-square relative">
              <img 
                src={style.thumbnail} 
                alt={style.name}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
              {/* Overlay */}
              <div className={`absolute inset-0 transition-opacity ${
                selectedStyle === style.id 
                  ? 'bg-[#C02C38]/20' 
                  : 'bg-black/0 group-hover:bg-black/10'
              }`} />
              
              {/* Selected Indicator */}
              {selectedStyle === style.id && (
                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#C02C38] flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>
            
            {/* Style Name */}
            <div className={`p-2 text-center ${
              isDark ? 'bg-gray-800' : 'bg-white'
            }`}>
              <p className={`text-xs font-medium truncate ${
                selectedStyle === style.id
                  ? 'text-[#C02C38]'
                  : isDark ? 'text-gray-200' : 'text-gray-700'
              }`}>
                {style.name}
              </p>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Surprise Me Button */}
      <motion.button
        onClick={handleSurpriseMe}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed transition-colors ${
          isDark 
            ? 'border-gray-600 hover:border-gray-500 text-gray-400 hover:text-gray-300' 
            : 'border-gray-300 hover:border-gray-400 text-gray-500 hover:text-gray-600'
        }`}
      >
        <Shuffle className="w-4 h-4" />
        <span className="text-sm">Surprise Me</span>
      </motion.button>

      {/* Style Library Link */}
      <div className={`flex items-center justify-between text-xs ${
        isDark ? 'text-gray-400' : 'text-gray-500'
      }`}>
        <button className="flex items-center gap-1 hover:text-[#C02C38] transition-colors">
          <Sparkles className="w-3 h-3" />
          风格库
        </button>
        <button className="flex items-center gap-1 hover:text-[#C02C38] transition-colors">
          143 Style
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* Start Design Button */}
      {selectedStyle && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={handleStartDesign}
          disabled={isGenerating}
          className={`w-full py-3 rounded-xl font-medium text-white shadow-lg transition-all ${
            isGenerating
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-[#C02C38] to-[#E85D75] hover:shadow-xl hover:shadow-[#C02C38]/25'
          }`}
        >
          {isGenerating ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              AI生成中...
            </span>
          ) : (
            '开始设计'
          )}
        </motion.button>
      )}

      {/* Custom Input Hint */}
      <p className={`text-xs text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
        没找到合适的选项？你可以直接在输入框中描述你想要的风格
      </p>
    </div>
  );
}
