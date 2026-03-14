import React, { useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import {
  Image,
  Video,
  FileText,
  Sparkles,
  Lightbulb,
  Palette,
  ArrowRight,
  MessageSquare,
  Search,
  BookOpen,
  Compass,
  CheckCircle,
  ExternalLink,
  X
} from 'lucide-react';
import { aiGenerationService, ImageGenerationParams, VideoGenerationParams } from '@/services/aiGenerationService';
import { toast } from 'sonner';

export type ActionType = 
  | 'generate_image'
  | 'generate_video'
  | 'create_design'
  | 'get_inspiration'
  | 'cultural_info'
  | 'write_text'
  | 'navigate'
  | 'search';

export interface ActionSuggestion {
  id: string;
  type: ActionType;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  gradient: string;
  action: () => void;
  navigateTo?: string; // 可选的导航路径
}

interface AIActionSuggestionsProps {
  input: string;
  onSuggestionClick: (suggestion: ActionSuggestion) => void;
  onNavigate?: (path: string) => void; // 导航回调
  onImageGenerated?: (imageUrl: string, prompt: string) => void; // 图片生成完成回调
  onVideoGenerated?: (videoUrl: string, prompt: string) => void; // 视频生成完成回调
  onDesignAdvice?: (advice: string, prompt: string) => void; // 设计建议完成回调
  className?: string;
}

export const AIActionSuggestions: React.FC<AIActionSuggestionsProps> = ({
  input,
  onSuggestionClick,
  onNavigate,
  onImageGenerated,
  onVideoGenerated,
  onDesignAdvice,
  className = ''
}) => {
  const { isDark } = useTheme();

  // 生成状态
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generatedImage, setGeneratedImage] = useState<{ url: string; prompt: string } | null>(null);
  const [generatedVideo, setGeneratedVideo] = useState<{ url: string; prompt: string } | null>(null);
  const [generationType, setGenerationType] = useState<'image' | 'video' | null>(null);

  // 设计建议状态
  const [designAdvice, setDesignAdvice] = useState<{ advice: string; prompt: string } | null>(null);
  const [isLoadingDesignAdvice, setIsLoadingDesignAdvice] = useState(false);

  // 灵感建议状态
  const [inspirationAdvice, setInspirationAdvice] = useState<{ advice: string; prompt: string } | null>(null);
  const [isLoadingInspiration, setIsLoadingInspiration] = useState(false);

  // 文化知识状态
  const [culturalKnowledge, setCulturalKnowledge] = useState<{ knowledge: string; prompt: string } | null>(null);
  const [isLoadingCultural, setIsLoadingCultural] = useState(false);

  // 文案写作状态
  const [writtenContent, setWrittenContent] = useState<{ content: string; prompt: string } | null>(null);
  const [isLoadingWriting, setIsLoadingWriting] = useState(false);

  // 处理图片生成
  const handleGenerateImage = useCallback(async () => {
    if (!input.trim() || isGenerating) return;

    setIsGenerating(true);
    setGenerationType('image');
    setGenerationProgress(0);
    setGeneratedImage(null);

    // 提取提示词（去掉"生成图片"等前缀）
    let prompt = input.trim();
    const prefixes = ['生成图片', '生成一张图', '画一张', '画一个', '画个', '生成图像', 'create image', 'generate image'];
    for (const prefix of prefixes) {
      if (prompt.toLowerCase().startsWith(prefix.toLowerCase())) {
        prompt = prompt.substring(prefix.length).trim();
        break;
      }
    }

    if (!prompt) {
      prompt = input.trim();
    }

    // 模拟进度
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 15 + 5;
      });
    }, 1000);

    try {
      const params: ImageGenerationParams = {
        prompt,
        size: '1024x1024',
        n: 1,
        style: 'auto',
        quality: 'hd'
      };

      const task = await aiGenerationService.generateImage(params);

      clearInterval(progressInterval);
      setGenerationProgress(100);

      if (task.status === 'completed' && task.result?.urls?.[0]) {
        const imageUrl = task.result.urls[0];
        setGeneratedImage({ url: imageUrl, prompt });
        toast.success('图片生成完成！');

        // 通知父组件
        if (onImageGenerated) {
          onImageGenerated(imageUrl, prompt);
        }
      } else {
        throw new Error(task.error || '生成失败');
      }
    } catch (error) {
      clearInterval(progressInterval);
      toast.error(error instanceof Error ? error.message : '图片生成失败');
    } finally {
      setIsGenerating(false);
    }
  }, [input, isGenerating, onImageGenerated]);

  // 处理视频生成
  const handleGenerateVideo = useCallback(async () => {
    if (!input.trim() || isGenerating) return;

    setIsGenerating(true);
    setGenerationType('video');
    setGenerationProgress(0);
    setGeneratedVideo(null);

    // 提取提示词（去掉"生成视频"等前缀）
    let prompt = input.trim();
    const prefixes = ['生成视频', '生成一段视频', '做个视频', 'create video', 'generate video'];
    for (const prefix of prefixes) {
      if (prompt.toLowerCase().startsWith(prefix.toLowerCase())) {
        prompt = prompt.substring(prefix.length).trim();
        break;
      }
    }

    if (!prompt) {
      prompt = input.trim();
    }

    // 模拟进度
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 10 + 3;
      });
    }, 2000);

    try {
      const params: VideoGenerationParams = {
        prompt,
        duration: 5,
        resolution: '720p',
        aspectRatio: '16:9'
      };

      const task = await aiGenerationService.generateVideo(params);

      clearInterval(progressInterval);
      setGenerationProgress(100);

      if (task.status === 'completed' && task.result?.urls?.[0]) {
        const videoUrl = task.result.urls[0];
        setGeneratedVideo({ url: videoUrl, prompt });
        toast.success('视频生成完成！');

        // 通知父组件
        if (onVideoGenerated) {
          onVideoGenerated(videoUrl, prompt);
        }
      } else {
        throw new Error(task.error || '生成失败');
      }
    } catch (error) {
      clearInterval(progressInterval);
      toast.error(error instanceof Error ? error.message : '视频生成失败');
    } finally {
      setIsGenerating(false);
    }
  }, [input, isGenerating, onVideoGenerated]);
  
  // 跳转到创作中心
  const handleNavigateToCreate = useCallback(() => {
    if (onNavigate) {
      // 将生成的图片或视频信息存储到 sessionStorage，以便创作中心页面读取
      if (generatedImage) {
        sessionStorage.setItem('ai_generated_image', JSON.stringify(generatedImage));
      }
      if (generatedVideo) {
        sessionStorage.setItem('ai_generated_video', JSON.stringify(generatedVideo));
      }
      onNavigate('/create');
    }
    // 清除生成状态
    setGeneratedImage(null);
    setGeneratedVideo(null);
  }, [onNavigate, generatedImage, generatedVideo]);

  // 关闭生成结果提示
  const handleCloseResult = useCallback(() => {
    setGeneratedImage(null);
    setGeneratedVideo(null);
    setDesignAdvice(null);
    setInspirationAdvice(null);
    setCulturalKnowledge(null);
    setWrittenContent(null);
  }, []);

  // 处理设计建议
  const handleCreateDesign = useCallback(async () => {
    if (!input.trim() || isLoadingDesignAdvice) return;

    setIsLoadingDesignAdvice(true);
    setDesignAdvice(null);

    // 提取提示词
    let prompt = input.trim();
    const prefixes = ['设计', '创作', '方案', '设计创作'];
    for (const prefix of prefixes) {
      if (prompt.toLowerCase().startsWith(prefix.toLowerCase())) {
        prompt = prompt.substring(prefix.length).trim();
        break;
      }
    }
    if (!prompt) {
      prompt = input.trim();
    }

    try {
      // 模拟调用 LLM 获取设计建议
      // 实际项目中应该调用 llmService.generateResponse
      await new Promise(resolve => setTimeout(resolve, 1500));

      // 生成设计建议内容
      const advice = `## 🎨 设计建议

基于您的需求"${prompt}"，我为您提供以下专业设计建议：

### 1. 设计理念
- **核心概念**：建议采用简约现代的设计风格，突出主题
- **视觉层次**：使用对比色增强视觉冲击力
- **文化融合**：可以融入天津本地文化元素

### 2. 配色方案
- 主色调：建议使用暖色调（橙色/琥珀色）传递活力
- 辅助色：搭配中性色（灰白/米色）保持平衡
- 点缀色：使用亮色（金色/黄色）突出重点

### 3. 排版建议
- 标题：使用粗体大号字体，居中对齐
- 正文：保持适当的行间距（1.5-1.8倍）
- 留白：四周保持足够的留白空间

### 4. 下一步行动
💡 您可以选择：
- 点击"去创作中心完善"开始具体设计
- 继续与我对话，获取更多建议
- 生成参考图片查看效果

需要我帮您生成一些参考图片吗？`;

      setDesignAdvice({ advice, prompt });
      toast.success('设计建议已生成！');

      // 通知父组件
      if (onDesignAdvice) {
        onDesignAdvice(advice, prompt);
      }
    } catch (error) {
      toast.error('获取设计建议失败');
    } finally {
      setIsLoadingDesignAdvice(false);
    }
  }, [input, isLoadingDesignAdvice, onDesignAdvice]);

  // 处理灵感建议
  const handleGetInspiration = useCallback(async () => {
    if (!input.trim() || isLoadingInspiration) return;

    setIsLoadingInspiration(true);
    setInspirationAdvice(null);

    // 提取提示词
    let prompt = input.trim();
    const prefixes = ['灵感', '想法', '创意', '获取灵感'];
    for (const prefix of prefixes) {
      if (prompt.toLowerCase().startsWith(prefix.toLowerCase())) {
        prompt = prompt.substring(prefix.length).trim();
        break;
      }
    }
    if (!prompt) {
      prompt = input.trim();
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 1200));

      const advice = `## 💡 创意灵感

基于"${prompt}"，为您提供以下创意方向：

### 1. 核心创意概念
- **主题定位**：将传统与现代融合，打造独特的视觉语言
- **情感共鸣**：唤起用户对美好生活的向往和情感连接
- **故事性**：每个设计都讲述一个有趣的故事

### 2. 创意方向
🎨 **视觉风格**
- 国潮风：传统元素 + 现代设计手法
- 极简风：少即是多，突出核心信息
- 复古风：怀旧情怀，温暖治愈

🎯 **互动形式**
- 用户参与式：让用户成为创作的一部分
- 社交分享型：易于传播的设计
- 沉浸式体验：AR/VR 等新技术应用

### 3. 应用场景
- 文创产品：书签、明信片、帆布袋
- 数字媒体：海报、H5、短视频
- 空间设计：展览、快闪店、装置艺术

### 4. 创新点建议
✨ 尝试将天津非遗元素（杨柳青年画、泥人张等）与现代设计语言结合
✨ 考虑可持续设计理念，使用环保材料
✨ 融入互动元素，让作品"活"起来

需要我帮您深入某个方向，或者生成参考图片吗？`;

      setInspirationAdvice({ advice, prompt });
      toast.success('灵感建议已生成！');
    } catch (error) {
      toast.error('获取灵感建议失败');
    } finally {
      setIsLoadingInspiration(false);
    }
  }, [input, isLoadingInspiration]);

  // 处理文化知识
  const handleGetCulturalKnowledge = useCallback(async () => {
    if (!input.trim() || isLoadingCultural) return;

    setIsLoadingCultural(true);
    setCulturalKnowledge(null);

    // 提取提示词
    const prompt = input.trim();
    const prefixes = ['文化', '历史', '传统', '杨柳青', '泥人张', '风筝'];
    for (const prefix of prefixes) {
      if (prompt.toLowerCase().includes(prefix.toLowerCase())) {
        // 对于文化关键词，保留整个查询
        break;
      }
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 根据输入内容返回相关的文化知识
      let knowledge = '';

      if (prompt.toLowerCase().includes('杨柳青')) {
        knowledge = `## 🎨 杨柳青年画

### 历史渊源
杨柳青年画起源于明代崇祯年间，距今已有400多年历史，与苏州桃花坞年画并称"南桃北柳"。

### 艺术特色
- **构图饱满**：画面充实，主次分明
- **色彩鲜艳**：以红、黄、蓝、绿为主色调
- **线条流畅**：工笔细腻，人物生动
- **寓意吉祥**：多表现喜庆、吉祥的主题

### 制作工艺
1. **勾线**：用墨线勾勒轮廓
2. **刻版**：将画稿刻在梨木板上
3. **印刷**：先印墨线，再手工填色
4. **开脸**：最后描绘人物面部

### 现代应用
杨柳青年画的元素可以应用于：
- 文创产品设计
- 现代插画创作
- 品牌视觉设计
- 数字媒体艺术

### 文化价值
2006年，杨柳青年画被列入首批国家级非物质文化遗产名录。`;
      } else if (prompt.toLowerCase().includes('泥人张')) {
        knowledge = `## 🎭 泥人张彩塑

### 历史传承
泥人张创始于清代道光年间，由张明山先生创立，历经六代传承，是中国北方泥塑艺术的代表。

### 艺术特点
- **形神兼备**：不仅形似，更注重神似
- **色彩丰富**：使用矿物颜料，色彩鲜艳持久
- **题材广泛**：戏曲人物、民间故事、现实生活
- **手工精制**：每件作品都是独一无二的手工艺术品

### 制作工艺
1. **选泥**：使用天津特有的胶泥
2. **塑型**：手工捏制基本形态
3. **阴干**：自然风干，保持形状
4. **上色**：层层渲染，细致入微

### 代表作品
- 《钟馗嫁妹》
- 《霸王别姬》
- 《三百六十行》

### 现代意义
泥人张彩塑不仅是艺术品，更是研究中国民俗、戏曲、服饰的珍贵资料。`;
      } else if (prompt.toLowerCase().includes('风筝')) {
        knowledge = `## 🪁 天津风筝魏

### 历史背景
风筝魏是天津著名的风筝制作世家，由魏元泰先生于清末创立，被誉为"风筝魏"。

### 独特工艺
- **骨架精巧**：使用竹材，轻巧坚固
- **造型多样**：人物、动物、器物应有尽有
- **彩绘精美**：工笔重彩，栩栩如生
- **飞行稳定**：科学设计，平衡性好

### 创新之处
魏元泰发明了"拍子风筝"和"折叠风筝"，使风筝更便于携带和收藏。

### 文化影响
风筝魏的作品不仅在国内享有盛誉，还远销海外，成为传播中国文化的重要载体。

### 现代传承
如今，风筝魏技艺已被列入国家级非物质文化遗产，在天津设有专门的传习所。`;
      } else {
        knowledge = `## 🏛️ 天津传统文化

### 津门文化概览
天津作为历史文化名城，拥有丰富的非物质文化遗产：

### 主要非遗项目
1. **杨柳青年画** - 中国四大年画之一
2. **泥人张彩塑** - 北方泥塑艺术代表
3. **风筝魏** - 天津风筝制作技艺
4. **天津相声** - 中国曲艺瑰宝
5. **狗不理包子** - 传统美食制作技艺

### 文化特色
- **兼容并蓄**：南北文化交融
- **市井气息**：贴近百姓生活
- **幽默风趣**：天津人独特的幽默感
- **工匠精神**：精益求精的制作态度

### 现代价值
这些传统文化元素可以为现代设计提供：
- 丰富的视觉素材
- 深厚的文化内涵
- 独特的地域特色
- 情感共鸣的基础

想要了解更多具体的文化元素吗？`;
      }

      setCulturalKnowledge({ knowledge, prompt });
      toast.success('文化知识已获取！');
    } catch (error) {
      toast.error('获取文化知识失败');
    } finally {
      setIsLoadingCultural(false);
    }
  }, [input, isLoadingCultural]);

  // 处理文案写作
  const handleWriteText = useCallback(async () => {
    if (!input.trim() || isLoadingWriting) return;

    setIsLoadingWriting(true);
    setWrittenContent(null);

    // 提取提示词
    let prompt = input.trim();
    const prefixes = ['写', '文案', '描述', '介绍', '说明'];
    for (const prefix of prefixes) {
      if (prompt.toLowerCase().startsWith(prefix.toLowerCase())) {
        prompt = prompt.substring(prefix.length).trim();
        break;
      }
    }
    if (!prompt) {
      prompt = input.trim();
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      const content = `## ✍️ 文案创作

### 主题：${prompt}

---

**【短文案 - 适合社交媒体】**

${prompt}，让传统遇见现代，让文化融入生活。

每一笔触都是传承，每一抹色彩都是创新。

#津门文化 #非遗传承 #文创设计

---

**【中长文案 - 适合产品介绍】**

在这个快节奏的时代，我们依然相信慢工出细活的力量。

${prompt}，汲取天津传统文化的精髓，将杨柳青年画的色彩、泥人张的神韵、风筝魏的巧思融入现代设计。

这不仅是一件产品，更是一份文化的传承，一段历史的延续。

让传统不再遥远，让文化触手可及。

---

**【长文案 - 适合品牌故事】**

🏛️ 一座城市，一种文化，一份传承

天津，这座拥有600多年历史的城市，承载着太多文化的记忆。从杨柳青年画的浓墨重彩，到泥人张彩塑的栩栩如生，再到风筝魏的巧夺天工...

${prompt}，正是源于对这份文化的热爱与敬意。

我们相信，传统文化不是博物馆里的陈列品，而是可以融入现代生活的美好存在。通过创新的设计语言，我们让古老的技艺焕发新生，让历史的记忆活在当下。

每一件作品，都是一次文化的对话；
每一次创作，都是一场传统的复兴。

让我们一起，用设计传承文化，用创意连接过去与未来。

---

**【标语/Slogan】**

- 传承不守旧，创新不忘本
- 让文化，触手可及
- 传统新生，创意无限
- 津门文化，世界表达

---

需要我帮您调整风格或生成更多版本吗？`;

      setWrittenContent({ content, prompt });
      toast.success('文案已生成！');
    } catch (error) {
      toast.error('文案生成失败');
    } finally {
      setIsLoadingWriting(false);
    }
  }, [input, isLoadingWriting]);

  const suggestions = useMemo(() => {
    const lowerInput = input.toLowerCase();
    const matchedSuggestions: ActionSuggestion[] = [];

    // 图片生成建议
    if (lowerInput.includes('图') || lowerInput.includes('画') || lowerInput.includes('照片') ||
        lowerInput.includes('生成') || lowerInput.includes('绘制')) {
      matchedSuggestions.push({
        id: 'generate_image',
        type: 'generate_image',
        title: isGenerating ? '生成中...' : '生成图片',
        description: isGenerating ? `进度: ${Math.round(generationProgress)}%` : '基于描述直接生成AI图片',
        icon: isGenerating ? <Sparkles className="w-5 h-5 animate-spin" /> : <Image className="w-5 h-5" />,
        color: 'from-purple-500 to-pink-500',
        gradient: 'from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20',
        action: handleGenerateImage,
        navigateTo: undefined // 不再直接跳转，而是直接生成
      });
    }

    // 视频生成建议
    if (lowerInput.includes('视频') || lowerInput.includes('动画') || lowerInput.includes('影片')) {
      matchedSuggestions.push({
        id: 'generate_video',
        type: 'generate_video',
        title: isGenerating && generationType === 'video' ? '生成中...' : '生成视频',
        description: isGenerating && generationType === 'video' ? `进度: ${Math.round(generationProgress)}%` : '基于描述直接生成AI视频',
        icon: isGenerating && generationType === 'video' ? <Sparkles className="w-5 h-5 animate-spin" /> : <Video className="w-5 h-5" />,
        color: 'from-blue-500 to-cyan-500',
        gradient: 'from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20',
        action: handleGenerateVideo,
        navigateTo: undefined // 不再直接跳转，而是直接生成
      });
    }

    // 设计创作建议
    if (lowerInput.includes('设计') || lowerInput.includes('创作') || lowerInput.includes('方案')) {
      matchedSuggestions.push({
        id: 'create_design',
        type: 'create_design',
        title: isLoadingDesignAdvice ? '获取建议中...' : '设计创作',
        description: isLoadingDesignAdvice ? '正在分析您的需求...' : '获取专业设计建议',
        icon: isLoadingDesignAdvice ? <Sparkles className="w-5 h-5 animate-spin" /> : <Palette className="w-5 h-5" />,
        color: 'from-amber-500 to-orange-500',
        gradient: 'from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20',
        action: handleCreateDesign,
        navigateTo: undefined // 不再直接跳转，而是通过 action 控制
      });
    }

    // 灵感建议
    if (lowerInput.includes('灵感') || lowerInput.includes('想法') || lowerInput.includes('创意')) {
      matchedSuggestions.push({
        id: 'get_inspiration',
        type: 'get_inspiration',
        title: isLoadingInspiration ? '获取灵感中...' : '获取灵感',
        description: isLoadingInspiration ? '正在探索创意方向...' : '探索创意可能性',
        icon: isLoadingInspiration ? <Sparkles className="w-5 h-5 animate-spin" /> : <Lightbulb className="w-5 h-5" />,
        color: 'from-yellow-500 to-amber-500',
        gradient: 'from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20',
        action: handleGetInspiration,
        navigateTo: undefined
      });
    }

    // 文化知识建议
    if (lowerInput.includes('文化') || lowerInput.includes('历史') || lowerInput.includes('传统') ||
        lowerInput.includes('杨柳青') || lowerInput.includes('泥人张') || lowerInput.includes('风筝')) {
      matchedSuggestions.push({
        id: 'cultural_info',
        type: 'cultural_info',
        title: isLoadingCultural ? '查询中...' : '文化知识',
        description: isLoadingCultural ? '正在查询传统文化...' : '了解传统文化背景',
        icon: isLoadingCultural ? <Sparkles className="w-5 h-5 animate-spin" /> : <BookOpen className="w-5 h-5" />,
        color: 'from-red-500 to-rose-500',
        gradient: 'from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20',
        action: handleGetCulturalKnowledge,
        navigateTo: undefined
      });
    }

    // 文案写作建议
    if (lowerInput.includes('写') || lowerInput.includes('文案') || lowerInput.includes('描述') ||
        lowerInput.includes('介绍') || lowerInput.includes('说明')) {
      matchedSuggestions.push({
        id: 'write_text',
        type: 'write_text',
        title: isLoadingWriting ? '创作中...' : '文案写作',
        description: isLoadingWriting ? '正在生成文案内容...' : '生成专业文案内容',
        icon: isLoadingWriting ? <Sparkles className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />,
        color: 'from-emerald-500 to-teal-500',
        gradient: 'from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20',
        action: handleWriteText,
        navigateTo: undefined
      });
    }

    // 导航建议
    if (lowerInput.includes('导航') || lowerInput.includes('去') || lowerInput.includes('打开') ||
        lowerInput.includes('前往') || lowerInput.includes('跳转')) {
      matchedSuggestions.push({
        id: 'navigate',
        type: 'navigate',
        title: '页面导航',
        description: '快速跳转到相关页面',
        icon: <Compass className="w-5 h-5" />,
        color: 'from-indigo-500 to-violet-500',
        gradient: 'from-indigo-50 to-violet-50 dark:from-indigo-900/20 dark:to-violet-900/20',
        action: () => {
          toast.info('正在跳转...');
          setTimeout(() => {
            if (onNavigate) {
              onNavigate('/');
            }
          }, 500);
        },
        navigateTo: undefined
      });
    }

    // 搜索建议
    if (lowerInput.includes('搜索') || lowerInput.includes('查找') || lowerInput.includes('查询')) {
      matchedSuggestions.push({
        id: 'search',
        type: 'search',
        title: '智能搜索',
        description: '搜索相关内容',
        icon: <Search className="w-5 h-5" />,
        color: 'from-cyan-500 to-blue-500',
        gradient: 'from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20',
        action: () => {
          toast.info('正在打开搜索...');
          setTimeout(() => {
            if (onNavigate) {
              onNavigate('/search');
            }
          }, 500);
        },
        navigateTo: undefined
      });
    }

    // 如果没有匹配到任何建议，显示通用建议
    if (matchedSuggestions.length === 0 && input.length > 0) {
      matchedSuggestions.push({
        id: 'general_chat',
        type: 'generate_image',
        title: '智能对话',
        description: '继续与AI交流',
        icon: <MessageSquare className="w-5 h-5" />,
        color: 'from-gray-500 to-slate-500',
        gradient: 'from-gray-50 to-slate-50 dark:from-gray-800/50 dark:to-slate-800/50',
        action: () => {}
      });
    }

    return matchedSuggestions.slice(0, 4); // 最多显示4个建议
  }, [input, isGenerating, generationProgress, generationType, isLoadingDesignAdvice, isLoadingInspiration, isLoadingCultural, isLoadingWriting, handleGenerateImage, handleGenerateVideo, handleCreateDesign, handleGetInspiration, handleGetCulturalKnowledge, handleWriteText]);

  if (suggestions.length === 0 || !input.trim()) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className={`space-y-2 ${className}`}
      >
        <div className={`text-xs font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          快捷操作
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          {suggestions.map((suggestion, index) => (
            <motion.button
              key={suggestion.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              disabled={isGenerating && (suggestion.type === 'generate_image' || suggestion.type === 'generate_video')}
              onClick={() => {
                // 所有操作都通过 action 执行，不再直接触发 onSuggestionClick
                if (suggestion.action) {
                  suggestion.action();
                }
                // 对于没有自定义 action 的操作（如果有的话），再触发 onSuggestionClick
                if (!suggestion.action) {
                  onSuggestionClick(suggestion);
                }
              }}
              className={`relative p-3 rounded-xl border-2 transition-all duration-200 text-left group ${
                isDark
                  ? 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              } ${isGenerating && (suggestion.type === 'generate_image' || suggestion.type === 'generate_video') ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {/* 背景渐变 */}
              <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${suggestion.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-200`} />
              
              <div className="relative flex items-center gap-2">
                {/* 图标 */}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br ${suggestion.color} text-white shadow-md`}>
                  {suggestion.icon}
                </div>
                
                {/* 文字内容 */}
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-semibold truncate ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                    {suggestion.title}
                  </div>
                  <div className={`text-xs truncate ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    {suggestion.description}
                  </div>
                </div>
                
                {/* 箭头 */}
                <ArrowRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
              </div>
            </motion.button>
          ))}
        </div>
        
        {/* 生成完成提示 */}
        <AnimatePresence>
          {(generatedImage || generatedVideo || designAdvice || inspirationAdvice || culturalKnowledge || writtenContent) && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className={`mt-3 p-3 rounded-xl border-2 ${
                writtenContent
                  ? (isDark
                      ? 'bg-gradient-to-br from-emerald-900/30 to-teal-900/30 border-emerald-500/30'
                      : 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200')
                  : culturalKnowledge
                    ? (isDark
                        ? 'bg-gradient-to-br from-red-900/30 to-rose-900/30 border-red-500/30'
                        : 'bg-gradient-to-br from-red-50 to-rose-50 border-red-200')
                    : inspirationAdvice
                      ? (isDark
                          ? 'bg-gradient-to-br from-yellow-900/30 to-amber-900/30 border-yellow-500/30'
                          : 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200')
                      : designAdvice
                        ? (isDark
                            ? 'bg-gradient-to-br from-amber-900/30 to-orange-900/30 border-amber-500/30'
                            : 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200')
                        : generatedVideo
                          ? (isDark
                              ? 'bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border-blue-500/30'
                              : 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200')
                          : (isDark
                              ? 'bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-500/30'
                              : 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200')
              }`}
            >
              {writtenContent ? (
                /* 文案写作展示 */
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'
                      }`}>
                        <FileText className="w-4 h-4 text-emerald-500" />
                      </div>
                      <p className={`text-sm font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                        文案创作
                      </p>
                    </div>
                    <button
                      onClick={handleCloseResult}
                      className={`p-1 rounded-full transition-colors ${
                        isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-500'
                      }`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* 文案内容 */}
                  <div className={`max-h-72 overflow-y-auto text-xs leading-relaxed whitespace-pre-wrap ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {writtenContent.content}
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex items-center gap-2 pt-2 border-t border-emerald-200/30 dark:border-emerald-700/30">
                    <motion.button
                      onClick={handleNavigateToCreate}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        isDark
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                      }`}
                    >
                      <ExternalLink className="w-3 h-3" />
                      去创作中心完善
                    </motion.button>
                  </div>
                </div>
              ) : culturalKnowledge ? (
                /* 文化知识展示 */
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isDark ? 'bg-red-500/20' : 'bg-red-100'
                      }`}>
                        <BookOpen className="w-4 h-4 text-red-500" />
                      </div>
                      <p className={`text-sm font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                        文化知识
                      </p>
                    </div>
                    <button
                      onClick={handleCloseResult}
                      className={`p-1 rounded-full transition-colors ${
                        isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-500'
                      }`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* 文化知识内容 */}
                  <div className={`max-h-60 overflow-y-auto text-xs leading-relaxed whitespace-pre-wrap ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {culturalKnowledge.knowledge}
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex items-center gap-2 pt-2 border-t border-red-200/30 dark:border-red-700/30">
                    <motion.button
                      onClick={handleNavigateToCreate}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        isDark
                          ? 'bg-red-600 hover:bg-red-500 text-white'
                          : 'bg-red-500 hover:bg-red-600 text-white'
                      }`}
                    >
                      <ExternalLink className="w-3 h-3" />
                      去创作中心完善
                    </motion.button>
                  </div>
                </div>
              ) : inspirationAdvice ? (
                /* 灵感建议展示 */
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isDark ? 'bg-yellow-500/20' : 'bg-yellow-100'
                      }`}>
                        <Lightbulb className="w-4 h-4 text-yellow-500" />
                      </div>
                      <p className={`text-sm font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                        创意灵感
                      </p>
                    </div>
                    <button
                      onClick={handleCloseResult}
                      className={`p-1 rounded-full transition-colors ${
                        isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-500'
                      }`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* 灵感建议内容 */}
                  <div className={`max-h-60 overflow-y-auto text-xs leading-relaxed whitespace-pre-wrap ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {inspirationAdvice.advice}
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex items-center gap-2 pt-2 border-t border-yellow-200/30 dark:border-yellow-700/30">
                    <motion.button
                      onClick={handleNavigateToCreate}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        isDark
                          ? 'bg-yellow-600 hover:bg-yellow-500 text-white'
                          : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                      }`}
                    >
                      <ExternalLink className="w-3 h-3" />
                      去创作中心完善
                    </motion.button>
                  </div>
                </div>
              ) : designAdvice ? (
                /* 设计建议展示 */
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isDark ? 'bg-amber-500/20' : 'bg-amber-100'
                      }`}>
                        <Palette className="w-4 h-4 text-amber-500" />
                      </div>
                      <p className={`text-sm font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                        设计建议
                      </p>
                    </div>
                    <button
                      onClick={handleCloseResult}
                      className={`p-1 rounded-full transition-colors ${
                        isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-500'
                      }`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* 设计建议内容 */}
                  <div className={`max-h-60 overflow-y-auto text-xs leading-relaxed whitespace-pre-wrap ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {designAdvice.advice}
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex items-center gap-2 pt-2 border-t border-amber-200/30 dark:border-amber-700/30">
                    <motion.button
                      onClick={handleNavigateToCreate}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        isDark
                          ? 'bg-amber-600 hover:bg-amber-500 text-white'
                          : 'bg-amber-500 hover:bg-amber-600 text-white'
                      }`}
                    >
                      <ExternalLink className="w-3 h-3" />
                      去创作中心完善
                    </motion.button>
                  </div>
                </div>
              ) : (
                /* 图片/视频生成完成展示 */
                <div className="flex items-start gap-3">
                  {/* 生成的媒体缩略图 */}
                  <div className="relative flex-shrink-0">
                    {generatedVideo ? (
                      <video
                        src={generatedVideo.url}
                        className="w-16 h-16 rounded-lg object-cover border-2 border-white dark:border-gray-700 shadow-md"
                      />
                    ) : (
                      <img
                        src={generatedImage?.url}
                        alt="生成的图片"
                        className="w-16 h-16 rounded-lg object-cover border-2 border-white dark:border-gray-700 shadow-md"
                      />
                    )}
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                        {generatedVideo ? '视频生成完成！' : '图片生成完成！'}
                      </p>
                      <button
                        onClick={handleCloseResult}
                        className={`p-1 rounded-full transition-colors ${
                          isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-500'
                        }`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <p className={`text-xs mt-1 line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {generatedVideo?.prompt || generatedImage?.prompt}
                    </p>

                    {/* 操作按钮 */}
                    <div className="flex items-center gap-2 mt-2">
                      <motion.button
                        onClick={handleNavigateToCreate}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          generatedVideo
                            ? (isDark
                                ? 'bg-blue-600 hover:bg-blue-500 text-white'
                                : 'bg-blue-500 hover:bg-blue-600 text-white')
                            : (isDark
                                ? 'bg-purple-600 hover:bg-purple-500 text-white'
                                : 'bg-purple-500 hover:bg-purple-600 text-white')
                        }`}
                      >
                        <ExternalLink className="w-3 h-3" />
                        去创作中心完善
                      </motion.button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
};

export default AIActionSuggestions;
