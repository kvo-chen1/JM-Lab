import { useState, useCallback, useRef } from 'react';
import type { ChatMessage, SkillCallInfo } from '../types';
import { SkillRegistry } from '../../skills/registry/SkillRegistry';
import { IntentRecognitionSkill } from '../../skills/analysis/IntentRecognitionSkill';
import { ImageGenerationSkill } from '../../skills/creation/ImageGenerationSkill';

// Initialize skill registry
const skillRegistry = new SkillRegistry();
const intentSkill = new IntentRecognitionSkill();
const imageSkill = new ImageGenerationSkill();

skillRegistry.register(intentSkill);
skillRegistry.register(imageSkill);

// Mock image URLs for demo
const mockImages = [
  'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=800&h=600&fit=crop',
];

export const useSkillChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentSkillCall, setCurrentSkillCall] = useState<SkillCallInfo | null>(null);
  const messageIdRef = useRef(0);

  const generateMessageId = () => `msg_${++messageIdRef.current}`;

  const addMessage = useCallback((message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: generateMessageId(),
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, newMessage]);
    return newMessage;
  }, []);

  const updateLastMessage = useCallback((updates: Partial<ChatMessage>) => {
    setMessages((prev) => {
      if (prev.length === 0) return prev;
      const lastIndex = prev.length - 1;
      return [
        ...prev.slice(0, lastIndex),
        { ...prev[lastIndex], ...updates },
      ];
    });
  }, []);

  const simulateSkillExecution = async (
    userMessage: string,
    intent: string,
    confidence: number
  ): Promise<{ content: string; attachments?: ChatMessage['attachments'] }> => {
    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Update status to recognizing
    setCurrentSkillCall((prev) =>
      prev ? { ...prev, status: 'recognizing' } : null
    );
    await new Promise((resolve) => setTimeout(resolve, 600));

    // Update status to calling
    setCurrentSkillCall((prev) =>
      prev ? { ...prev, status: 'calling' } : null
    );
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Update status to executing
    setCurrentSkillCall((prev) =>
      prev ? { ...prev, status: 'executing' } : null
    );
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Generate response based on intent
    let content = '';
    let attachments: ChatMessage['attachments'] = undefined;

    switch (intent) {
      case 'image-generation':
      case 'logo-design':
        content = `我注意到您选择了品牌Logo技能，想要设计一套品牌周边。不过我需要先了解您的Logo设计，才能为您创建配套的品牌周边应用。

让我先获取品牌Logo技能的指导：

好的，我了解了品牌周边设计的流程。现在我需要您提供一些信息：

• 您的Logo图片 - 请上传或分享您现有的Logo设计
• 品牌名称 - 如果Logo中没有明确显示
• 想要设计的周边类型 - 例如：
  📝 商务文具（名片、信纸、信封）
  👕 服饰周边（T恤、帽子、帆布袋）
  📦 包装产品（包装盒、手提袋、贴纸）
  ☕ 生活用品（马克杯、笔记本、徽章）
  🏪 环境应用（店面招牌、指示牌）

请先上传您的Logo，我会根据它为您设计配套的品牌周边应用！`;
        attachments = [
          {
            type: 'image',
            url: mockImages[Math.floor(Math.random() * mockImages.length)],
            title: '品牌周边设计预览',
          },
        ];
        break;

      case 'text-generation':
      case 'brand-copy':
        content = `好的，我为您生成了一段品牌宣传文案：

---

**品牌宣言**

在这个快节奏的时代，我们坚持慢工出细活。
每一个产品，都承载着我们对品质的执着；
每一次服务，都倾注着我们对客户的真诚。

我们不只是在创造产品，
更是在传递一种生活态度——
精致、优雅、与众不同。

选择我们，选择品质生活。

---

这段文案突出了品牌的品质感和独特性。您觉得怎么样？需要调整风格或内容吗？`;
        break;

      case 'color-scheme':
        content = `为您推荐一套适合科技公司的品牌配色方案：

**主色调**
• 深海蓝 #1E3A5F - 专业、可靠、科技感
• 电光紫 #6366F1 - 创新、活力、未来感

**辅助色**
• 云雾灰 #F1F5F9 - 简洁、现代、背景
• 薄荷绿 #10B981 - 成长、环保、点缀

**文字色**
• 深空黑 #0F172A - 标题、重要内容
• 石墨灰 #475569 - 正文、描述

这套配色既有科技公司的专业感，又不失活力和创新。您觉得这个配色方案如何？`;
        break;

      case 'creative-idea':
        content = `为您构思了几个创新的营销活动点子：

**1. "24小时创意马拉松"**
邀请用户参与24小时不间断的创意挑战，通过直播形式展示创作过程，增加品牌曝光和用户互动。

**2. "用户故事征集计划"**
鼓励用户分享与品牌相关的故事，优秀作品可获得奖励并在官方渠道展示，增强用户归属感。

**3. "AR互动体验"**
开发AR滤镜或小程序，让用户可以通过手机体验虚拟产品试用，提升购买欲望。

**4. "限量版盲盒营销"**
推出神秘盲盒产品，每盒包含不同惊喜，刺激用户收集和分享欲望。

这些点子您觉得哪个比较适合您的品牌？我可以帮您进一步完善。`;
        break;

      default:
        content = `我理解您的需求了。让我为您分析一下...

根据您的描述，我识别到这是一个关于「${intent}」的需求。我可以帮您处理这个任务。

不过为了给您提供最准确的解决方案，您能否提供更多细节？比如：
- 具体的使用场景
- 目标受众
- 期望的风格或效果

这样我就能更好地为您服务了！`;
    }

    return { content, attachments };
  };

  const sendMessage = useCallback(
    async (content: string) => {
      if (isProcessing) return;

      // Add user message
      addMessage({
        role: 'user',
        content,
      });

      setIsProcessing(true);

      // Initialize skill call info
      const skillCallInfo: SkillCallInfo = {
        skillId: 'intent-recognition',
        skillName: 'IntentRecognitionSkill',
        intent: 'analyzing',
        confidence: 0,
        status: 'thinking',
      };
      setCurrentSkillCall(skillCallInfo);

      // Add initial agent message
      addMessage({
        role: 'agent',
        content: '🤖 正在思考...',
        skillCall: skillCallInfo,
      });

      try {
        // Simulate intent recognition
        const lowerContent = content.toLowerCase();
        let intent = 'general';
        let confidence = 0.7;

        if (lowerContent.includes('logo') || lowerContent.includes('设计') || lowerContent.includes('图片')) {
          intent = 'image-generation';
          confidence = 0.95;
        } else if (lowerContent.includes('文案') || lowerContent.includes('文字') || lowerContent.includes('宣传')) {
          intent = 'text-generation';
          confidence = 0.88;
        } else if (lowerContent.includes('配色') || lowerContent.includes('颜色') || lowerContent.includes('色彩')) {
          intent = 'color-scheme';
          confidence = 0.92;
        } else if (lowerContent.includes('创意') || lowerContent.includes('点子') || lowerContent.includes('想法')) {
          intent = 'creative-idea';
          confidence = 0.85;
        }

        // Update skill call info
        const updatedSkillCall: SkillCallInfo = {
          ...skillCallInfo,
          intent,
          confidence,
          status: 'thinking',
        };
        setCurrentSkillCall(updatedSkillCall);

        // Execute skill
        const result = await simulateSkillExecution(content, intent, confidence);

        // Update skill call to completed
        const completedSkillCall: SkillCallInfo = {
          ...updatedSkillCall,
          status: 'completed',
          result,
        };
        setCurrentSkillCall(completedSkillCall);

        // Update agent message with result
        updateLastMessage({
          content: result.content,
          skillCall: completedSkillCall,
          attachments: result.attachments,
        });
      } catch (error) {
        // Handle error
        const errorSkillCall: SkillCallInfo = {
          ...skillCallInfo,
          status: 'error',
          error: error instanceof Error ? error.message : '执行失败',
        };
        setCurrentSkillCall(errorSkillCall);

        updateLastMessage({
          content: '抱歉，处理您的请求时出现了错误。请稍后重试。',
          skillCall: errorSkillCall,
        });
      } finally {
        setIsProcessing(false);
        setCurrentSkillCall(null);
      }
    },
    [isProcessing, addMessage, updateLastMessage]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setCurrentSkillCall(null);
  }, []);

  return {
    messages,
    isProcessing,
    currentSkillCall,
    sendMessage,
    clearMessages,
  };
};

export default useSkillChat;
