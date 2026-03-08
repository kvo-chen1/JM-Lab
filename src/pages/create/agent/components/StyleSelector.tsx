import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useAgentStore, PRESET_STYLES } from '../hooks/useAgentStore';
import { Shuffle, ChevronRight, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { llmService } from '@/services/llmService';

export default function StyleSelector() {
  const { isDark } = useTheme();
  const { selectedStyle, selectStyle, addMessage, addOutput, currentTask } = useAgentStore();
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

    try {
      // 构建生成提示词
      const taskDescription = currentTask?.requirements.description || 'IP形象设计';
      const stylePrompt = style?.prompt || '';
      const prompt = `${taskDescription}，${stylePrompt}，高质量，精美细节`;

      console.log('[StyleSelector] 开始生成图像，prompt:', prompt);

      // 调用真实图像生成API
      const result = await llmService.generateImage({
        model: 'wanx-v1',
        prompt: prompt,
        size: '1024x1024',
        n: 1 // 只生成1张
      });

      console.log('[StyleSelector] 图像生成结果:', result);

      if (result.ok && result.data?.data && result.data.data.length > 0) {
        const imageUrl = result.data.data[0].url;

        console.log('[StyleSelector] 准备添加到画布，imageUrl:', imageUrl);

        // 添加到画布（这样右边才能显示）
        const outputId = addOutput({
          type: 'image',
          url: imageUrl,
          thumbnail: imageUrl,
          prompt: prompt,
          style: selectedStyle,
          agentType: 'designer'
        });

        console.log('[StyleSelector] 已添加到画布，outputId:', outputId);

        // 添加生成结果消息（只显示1张）
        addMessage({
          role: 'designer',
          content: '概念图已生成！这是根据你选择的风格设计的IP形象初稿。你觉得怎么样？',
          type: 'image',
          metadata: {
            images: [imageUrl]
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

        toast.success('图像生成成功！');
      } else {
        throw new Error(result.error || '图像生成失败');
      }
    } catch (error: any) {
      console.error('[StyleSelector] 图像生成失败:', error);
      toast.error(`图像生成失败: ${error.message || '请重试'}`);

      // 添加错误提示消息
      addMessage({
        role: 'designer',
        content: '抱歉，图像生成遇到了问题。请稍后重试，或者尝试换一种描述方式。',
        type: 'text'
      });
    } finally {
      setIsGenerating(false);
    }
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
