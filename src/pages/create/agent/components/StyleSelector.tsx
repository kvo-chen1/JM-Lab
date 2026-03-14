import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useAgentStore, PRESET_STYLES } from '../hooks/useAgentStore';
import { Shuffle, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { llmService } from '@/services/llmService';

// 生成标题和描述的辅助函数
async function generateTitleAndDescription(
  taskDescription: string,
  styleName: string
): Promise<{ title: string; description: string }> {
  console.log('[generateTitleAndDescription] 开始生成标题和描述:', { taskDescription, styleName });
  
  const prompt = `作为一位专业的创意设计师，请为以下设计作品生成一个吸引人的标题和详细的描述。

设计任务：${taskDescription}
设计风格：${styleName}

要求：
1. 标题（≤15字）：简洁有力，富有创意，能体现作品特色
2. 描述（50-100字）：详细描述作品的视觉特点、设计理念、适用场景等

请直接返回JSON格式：
{
  "title": "作品标题",
  "description": "作品描述..."
}`;

  try {
    console.log('[generateTitleAndDescription] 调用 llmService.generateResponse...');
    // 使用llmService的generateResponse方法
    const response = await llmService.generateResponse(prompt, {
      priority: 'normal'
    });
    console.log('[generateTitleAndDescription] 收到响应:', response);

    // 尝试解析JSON
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      console.log('[generateTitleAndDescription] 解析成功:', result);
      return {
        title: result.title?.slice(0, 15) || '未命名作品',
        description: result.description || '暂无描述'
      };
    } else {
      console.warn('[generateTitleAndDescription] 未找到JSON格式响应');
    }
  } catch (error) {
    console.error('[generateTitleAndDescription] 生成标题描述失败:', error);
  }

  // 返回默认值
  console.log('[generateTitleAndDescription] 返回默认值');
  return {
    title: `${styleName}作品`,
    description: taskDescription
  };
}

// 构建优化的图像生成提示词
function buildOptimizedPrompt(
  taskDescription: string,
  stylePrompt: string,
  requirements: any,
  agentDescription: string = ''
): string {
  // 优先使用Agent生成的详细描述，如果没有则使用任务描述
  let prompt = agentDescription || taskDescription;

  // 添加风格描述
  if (stylePrompt) {
    prompt += `，${stylePrompt}`;
  }

  // 根据需求添加详细描述
  if (requirements) {
    const details: string[] = [];

    // 添加受众描述
    if (requirements.audience) {
      details.push(`面向${requirements.audience}`);
    }

    // 添加场景描述
    if (requirements.scenario) {
      details.push(`适用于${requirements.scenario}`);
    }

    // 添加色调偏好
    if (requirements.colorTone) {
      details.push(`${requirements.colorTone}色调`);
    }

    // 添加情感氛围
    if (requirements.mood) {
      details.push(`${requirements.mood}氛围`);
    }

    if (details.length > 0) {
      prompt += `，${details.join('，')}`;
    }
  }

  // 添加质量要求
  prompt += '，高质量，精美细节，专业设计作品';

  return prompt;
}

export default function StyleSelector() {
  const { isDark } = useTheme();
  const { selectedStyle, selectStyle, addMessage, addOutput, updateOutput, currentTask, messages } = useAgentStore();
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
      // 从消息历史中提取Agent生成的详细描述（查找最近一条包含IP形象描述的设计师消息）
      const lastAgentMessage = messages.slice().reverse().find(m =>
        m.role === 'designer' &&
        (m.content.includes('IP') || m.content.includes('形象') || m.content.includes('设计') || m.content.includes('主形象'))
      );
      const agentDescription = lastAgentMessage?.content || '';

      // 构建生成提示词（使用优化后的提示词构建函数）
      const taskDescription = currentTask?.requirements?.description || 'IP形象设计';
      const stylePrompt = style?.prompt || '';
      const requirements = currentTask?.requirements;

      console.log('[StyleSelector] === 开始生成图像 ===');
      console.log('[StyleSelector] currentTask:', currentTask);
      console.log('[StyleSelector] taskDescription:', taskDescription);
      console.log('[StyleSelector] agentDescription:', agentDescription.slice(0, 200));
      console.log('[StyleSelector] stylePrompt:', stylePrompt);
      console.log('[StyleSelector] requirements:', requirements);

      // 优先使用Agent生成的详细描述来构建提示词
      const prompt = buildOptimizedPrompt(taskDescription, stylePrompt, requirements, agentDescription);

      console.log('[StyleSelector] 最终生成的prompt:', prompt);

      // 调用真实图像生成API
      console.log('[StyleSelector] 调用 llmService.generateImage...');
      const result = await llmService.generateImage({
        model: 'wanx-v1',
        prompt: prompt,
        size: '1024x1024',
        n: 1 // 只生成1张
      });

      console.log('[StyleSelector] 图像生成结果:', JSON.stringify(result, null, 2));

      // 检查结果是否成功
      if (!result.ok) {
        console.error('[StyleSelector] 图像生成失败:', result.error);
        throw new Error(result.error || '图像生成失败');
      }
      
      // 检查数据结构
      let imageUrl: string | undefined;
      
      console.log('[StyleSelector] 检查数据结构...');
      console.log('[StyleSelector] result.data:', result.data);
      
      if (result.data?.data && Array.isArray(result.data.data) && result.data.data.length > 0) {
        // 标准结构：{ data: { data: [{url}] } }
        imageUrl = result.data.data[0].url;
        console.log('[StyleSelector] 从 result.data.data[0].url 获取图片URL:', imageUrl);
      } else if (result.data && Array.isArray(result.data) && result.data.length > 0) {
        // 备选结构：{ data: [{url}] }
        imageUrl = result.data[0].url;
        console.log('[StyleSelector] 从 result.data[0].url 获取图片URL:', imageUrl);
      }
      
      if (!imageUrl || typeof imageUrl !== 'string' || imageUrl.trim() === '') {
        console.error('[StyleSelector] 图片URL无效:', imageUrl);
        throw new Error('生成的图片URL无效');
      }

      console.log('[StyleSelector] 准备添加到画布，imageUrl:', imageUrl);

      // 使用前面提取的Agent描述，提取标题（第一行或前30个字符）
      const title = agentDescription.split('\n')[0].slice(0, 30) || `${style?.name || '设计'}作品`;

      console.log('[StyleSelector] 提取的描述:', {
        title,
        descriptionLength: agentDescription.length,
        hasDescription: !!agentDescription
      });

      // 先添加到画布（这样右边才能显示），包含描述信息
      const outputId = addOutput({
        type: 'image',
        url: imageUrl,
        thumbnail: imageUrl,
        prompt: prompt,
        style: selectedStyle,
        agentType: 'designer',
        title: title,
        description: agentDescription || taskDescription
      });

      console.log('[StyleSelector] 已添加到画布，outputId:', outputId);

      // 如果描述为空，尝试调用AI生成标题和描述
      if (!agentDescription) {
        try {
          const { title: aiTitle, description: aiDescription } = await generateTitleAndDescription(
            taskDescription,
            style?.name || '默认风格'
          );

          // 更新作品信息
          updateOutput(outputId, { title: aiTitle, description: aiDescription });
          console.log('[StyleSelector] AI生成标题和描述:', { title: aiTitle, description: aiDescription });
        } catch (error) {
          console.error('[StyleSelector] AI生成标题描述失败:', error);
        }
      }

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
    } catch (error: any) {
      console.error('[StyleSelector] 图像生成失败:', error);
      console.error('[StyleSelector] 错误详情:', error.stack);
      toast.error(`图像生成失败: ${error.message || '请重试'}`);

      // 添加错误提示消息
      addMessage({
        role: 'designer',
        content: `抱歉，图像生成遇到了问题：${error.message || '请稍后重试，或者尝试换一种描述方式。'}`,
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
            <div className="aspect-square relative bg-gray-100 dark:bg-gray-700">
              <img
                src={style.thumbnail}
                alt={style.name}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                onError={(e) => {
                  // 图片加载失败时显示备用内容
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = `<div class="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500"><span class="text-2xl">${style.name.charAt(0)}</span></div>`;
                  }
                }}
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
        <span className="flex items-center gap-1 text-gray-400">
          <Sparkles className="w-3 h-3" />
          更多风格请在对话区点击"风格库"
        </span>
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
