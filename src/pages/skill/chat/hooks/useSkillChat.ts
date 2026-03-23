import { useState, useCallback, useRef } from 'react';
import type { ChatMessage, SkillCallInfo, RequirementPhase, Attachment } from '../types';
import { PastedImage } from '@/components/ImagePasteInput';
import { 
  createChatContext, 
  sendMessageStream, 
  generateImage
} from '../services/chatService';
import { recognizeIntent, getIntentDisplayName, IntentType } from '../services/intentService';
import { analyzeRequirements, isRequirementsComplete, RequirementField, MerchandiseCategory } from '../services/requirementService';
import { uploadPastedImages } from '../services/imageUploadService';
import { toast } from 'sonner';

// 多轮对话状态
interface ConversationState {
  intent?: IntentType;
  collectedInfo: Record<string, string>;
  missingFields: RequirementField[];
  phase: RequirementPhase;
}

export const useSkillChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentSkillCall, setCurrentSkillCall] = useState<SkillCallInfo | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const messageIdRef = useRef(0);
  
  // 多轮对话状态
  const conversationStateRef = useRef<ConversationState | null>(null);

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
      if (prev.length === 0) {
        console.warn('[updateLastMessage] 消息列表为空，无法更新');
        return prev;
      }
      const lastIndex = prev.length - 1;
      const lastMessage = prev[lastIndex];
      
      // 只允许更新 agent 角色的消息
      if (lastMessage.role !== 'agent') {
        console.warn('[updateLastMessage] 最后一条消息不是 agent 消息，角色:', lastMessage.role);
        // 如果不是 agent 消息，添加一条新的 agent 消息
        const newAgentMessage: ChatMessage = {
          role: 'agent',
          content: '',
          timestamp: Date.now(),
          id: generateMessageId(),
          ...updates,
        };
        return [...prev, newAgentMessage];
      }
      
      return [
        ...prev.slice(0, lastIndex),
        { ...lastMessage, ...updates },
      ];
    });
  }, []);

  // 执行技能
  const executeSkill = async (
    intent: IntentType,
    userMessage: string,
    collectedInfo: Record<string, string>,
    onDelta: (content: string) => void
  ): Promise<{ content: string; attachments?: ChatMessage['attachments'] }> => {
    const context = createChatContext(messages);
    
    // 构建完整的提示词
    const fullPrompt = Object.keys(collectedInfo).length > 0
      ? `${userMessage}\n\n【已收集的信息】\n${Object.entries(collectedInfo).map(([k, v]) => `${k}: ${v}`).join('\n')}`
      : userMessage;
    
    switch (intent) {
      case 'image-generation':
      case 'logo-design':
      case 'poster-design': {
        try {
          console.log('[executeSkill] 开始生成图片，intent:', intent);
          console.log('[executeSkill] fullPrompt:', fullPrompt);
          
          // 先发送思考中的消息
          const thinkingContent = `🎨 **${getIntentDisplayName(intent)}**\n\n正在根据您的需求生成图片...\n\n${Object.entries(collectedInfo).map(([k, v]) => `• ${k}: ${v}`).join('\n')}`;
          onDelta(thinkingContent);
          
          // 调用图片生成
          const imageUrl = await generateImage(fullPrompt);
          console.log('[executeSkill] 图片 URL:', imageUrl);
          
          if (!imageUrl) {
            throw new Error('图片生成失败：返回 URL 为空');
          }
          
          // 生成描述文字
          let description = '';
          await sendMessageStream(
            `请为这张图片写一段简短的描述，说明这是根据以下需求生成的：${fullPrompt}`,
            context,
            (delta) => {
              description += delta;
            },
            abortControllerRef.current?.signal
          );
          
          const attachment = {
            id: `img_${Date.now()}`,
            type: 'image' as const,
            url: imageUrl,
            thumbnailUrl: imageUrl,
            title: getIntentDisplayName(intent),
            status: 'completed' as const,
          };
          
          console.log('[executeSkill] 返回 attachment:', attachment);
          
          return {
            content: `✅ **${getIntentDisplayName(intent)}完成**\n\n${description}`,
            attachments: [attachment],
          };
        } catch (error) {
          console.error('[executeSkill] 图片生成失败:', error);
          return {
            content: `❌ **${getIntentDisplayName(intent)}失败**\n\n${error instanceof Error ? error.message : '未知错误'}`,
            attachments: [],
          };
        }
      }

      case 'text-generation':
      case 'brand-copy':
      case 'marketing-copy':
      case 'social-copy':
      case 'color-scheme':
      case 'creative-idea': {
        let content = '';
        await sendMessageStream(
          fullPrompt,
          context,
          (delta) => {
            content += delta;
            onDelta(content);
          },
          abortControllerRef.current?.signal
        );

        // 将生成的文案作为文本附件返回，以便在画布上显示
        const attachment = {
          type: 'text' as const,
          content: content,
          title: getIntentDisplayName(intent),
        };

        return {
          content,
          attachments: [attachment],
        };
      }

      case 'greeting': {
        return {
          content: '你好！我是津小脉 Skill Agent，很高兴为你服务。😊\n\n我可以帮助你完成以下任务：\n\n🎨 **图片生成** - Logo设计、海报设计、创意图片\n📝 **文案创作** - 品牌文案、营销文案、社媒内容\n🎨 **配色方案** - 品牌配色、设计配色建议\n💡 **创意点子** - 营销创意、活动方案\n\n请告诉我你需要什么帮助？',
        };
      }

      case 'help': {
        return {
          content: '**津小脉 Skill Agent 使用指南**\n\n🎯 **如何使用**\n直接在对话框中描述你的需求，例如：\n- "帮我设计一个科技公司的Logo"\n- "写一段品牌宣传文案"\n- "推荐一套适合电商的配色方案"\n\n🛠️ **支持的技能**\n- 图片生成（Logo、海报、创意图）\n- 文案创作（品牌、营销、社媒）\n- 配色方案推荐\n- 创意点子生成\n\n💡 **小贴士**\n- 描述越详细，生成效果越好\n- 可以多次调整直到满意\n- 生成的作品会显示在左侧画布中\n\n有什么我可以帮你的吗？',
        };
      }

      case 'general':
      default: {
        // 一般对话，使用流式输出
        let content = '';
        await sendMessageStream(
          userMessage,
          context,
          (delta) => {
            content += delta;
            onDelta(content);
          },
          abortControllerRef.current?.signal
        );
        
        return { content };
      }
    }
  };

  // 收集信息阶段
  const collectRequirements = async (
    intent: IntentType,
    userMessage: string
  ): Promise<{
    ready: boolean;
    collectedInfo: Record<string, string>;
    skillCall: SkillCallInfo;
  }> => {
    // 检查是否是确认词（如"好的"、"是的"、"没错"等）
    const confirmationPatterns = [
      /^好的?$/i, /^是的?$/i, /^没错?$/i, /^正确?$/i,
      /^ok$/i, /^okay$/i, /^yep$/i, /^yeah$/i, /^yes$/i,
      /^好$/i, /^行$/i, /^可以$/i, /^同意$/i,
    ];
    const isConfirmation = confirmationPatterns.some(p => p.test(userMessage.trim()));

    // 如果是确认词，检查之前是否有已推断的信息
    let analysis;
    if (isConfirmation && conversationStateRef.current?.collectedInfo) {
      // 用户确认了之前的推断，使用之前的状态继续收集
      const previousCollectedInfo = conversationStateRef.current.collectedInfo;

      // 重新分析，传入历史信息以便继续收集缺失字段
      analysis = await analyzeRequirements(
        intent,
        userMessage,
        messages.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content })),
        abortControllerRef.current?.signal
      );

      // 合并之前收集的信息和新分析的信息
      analysis.collectedInfo = { ...previousCollectedInfo, ...analysis.collectedInfo };
    } else {
      // 正常分析
      analysis = await analyzeRequirements(
        intent,
        userMessage,
        messages.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content })),
        abortControllerRef.current?.signal
      );
    }

    // 更新对话状态
    conversationStateRef.current = {
      intent,
      collectedInfo: analysis.collectedInfo,
      missingFields: analysis.missingFields,
      phase: analysis.ready ? 'confirming' : 'collecting',
    };

    const progress = {
      current: Object.keys(analysis.collectedInfo).length,
      total: Object.keys(analysis.collectedInfo).length + analysis.missingFields.length,
    };

    // 检查是否需要收集周边类型信息
    const merchandiseField = analysis.missingFields?.find(f => f.key === 'merchandiseType');
    let merchandiseSelection: SkillCallInfo['merchandiseSelection'];

    if (merchandiseField && merchandiseField.categories) {
      merchandiseSelection = {
        categories: merchandiseField.categories,
        selectedIds: [],
      };
    }

    const skillCall: SkillCallInfo = {
      skillId: 'requirement-collection',
      skillName: 'RequirementCollectionSkill',
      intent,
      confidence: 0.9,
      status: 'calling',
      phase: analysis.ready ? 'confirming' : 'collecting',
      collectedInfo: analysis.collectedInfo,
      missingFields: analysis.missingFields,
      currentQuestion: analysis.nextQuestion,
      suggestions: analysis.suggestions,
      summary: analysis.summary,
      progress,
      ...(merchandiseSelection && { merchandiseSelection }),
    };

    return {
      ready: analysis.ready,
      collectedInfo: analysis.collectedInfo,
      skillCall,
    };
  }

  // 从历史消息中提取图片描述
  const extractImagePrompt = (msgs: ChatMessage[]): string => {
    // 查找包含"图片描述"的消息
    for (let i = msgs.length - 1; i >= 0; i--) {
      const msg = msgs[i];
      if (msg.content.includes('图片描述') || msg.content.includes('图片生成')) {
        // 提取描述内容
        const match = msg.content.match(/(?:图片描述|生成).*?(?::|：)?\s*([\s\S]+)/);
        if (match) {
          return match[1].trim();
        }
      }
    }
    return '现代风格的设计';
  };

  const sendMessage = useCallback(
    async (content: string, images?: PastedImage[]) => {
      // 空消息校验（允许只发送图片）
      const trimmedContent = content.trim();
      const hasImages = images && images.length > 0;
      
      if (!trimmedContent && !hasImages) {
        toast.warning('请输入内容或粘贴图片');
        return;
      }

      // 输入长度限制（最大 2000 字符）
      const MAX_INPUT_LENGTH = 2000;
      if (trimmedContent.length > MAX_INPUT_LENGTH) {
        toast.warning(`输入内容过长，请控制在 ${MAX_INPUT_LENGTH} 字符以内`);
        return;
      }

      if (isProcessing) {
        toast.warning('请等待当前任务完成');
        return;
      }

      // 特殊处理：检查是否是对"是否需要生成图片"的回复
      const lastAgentMessage = messages.filter(m => m.role === 'agent').pop();
      // 扩展匹配条件，支持更多类似的询问语句
      const isGenerationRequest = lastAgentMessage?.content.includes('是否需要我生成') ||
                                  lastAgentMessage?.content.includes('您是否希望我立即生成') ||
                                  lastAgentMessage?.content.includes('是否希望我生成') ||
                                  lastAgentMessage?.content.includes('是否需要生成');
      if (isGenerationRequest &&
          (content === '需要' || content === '是的' || content === '好' || content === 'ok' || content === 'OK')) {
        
        console.log('[sendMessage] 检测到图片生成确认，开始提取描述并生成图片');
        
        // 从历史消息中提取图片描述
        const imagePrompt = extractImagePrompt(messages);
        console.log('[sendMessage] 提取到的图片描述:', imagePrompt);
        
        if (imagePrompt) {
          // 添加用户消息
          addMessage({
            role: 'user',
            content,
          });
          setIsProcessing(true);
          
          // 直接执行图片生成
          try {
            const imageUrl = await generateImage(imagePrompt);
            console.log('[sendMessage] 图片 URL:', imageUrl);
            
            if (!imageUrl) {
              throw new Error('图片生成失败：返回 URL 为空');
            }
            
            addMessage({
              role: 'agent',
              content: `✅ **图片生成完成**\n\n已为您生成预览图。`,
              attachments: [{
                id: `img_${Date.now()}`,
                type: 'image',
                url: imageUrl,
                thumbnailUrl: imageUrl,
                title: '生成的预览图',
                status: 'completed',
              }],
            });
            
            toast.success('图片生成完成！');
            setIsProcessing(false);
            return;
          } catch (error) {
            console.error('[sendMessage] 图片生成失败:', error);
            addMessage({
              role: 'agent',
              content: `❌ **图片生成失败**\n\n${error instanceof Error ? error.message : '请稍后重试'}`,
            });
            setIsProcessing(false);
            return;
          }
        }
      }

      // 取消之前的请求
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setIsProcessing(true);

      // 处理图片上传
      let attachments: Attachment[] = [];
      if (hasImages) {
        console.log('[sendMessage] 开始上传图片，数量:', images.length);
        try {
          const userId = 'anonymous'; // TODO: 从用户认证中获取
          attachments = await uploadPastedImages(images, userId);
          console.log('[sendMessage] 图片上传完成，成功数量:', attachments.length);
        } catch (error) {
          console.error('[sendMessage] 上传图片失败:', error);
          toast.error('图片上传失败，请重试');
          setIsProcessing(false);
          return;
        }
      }

      // 添加用户消息（包含附件）
      const userMessage = {
        role: 'user' as const,
        content: trimmedContent,
        attachments: attachments.length > 0 ? attachments : undefined,
      };
      console.log('[sendMessage] 添加用户消息:', userMessage);
      addMessage(userMessage);

      try {
        // 检查是否处于信息收集阶段
        const currentState = conversationStateRef.current;
        
        if (currentState && currentState.phase === 'collecting' && currentState.intent) {
          // 继续收集信息
          const { ready, collectedInfo, skillCall } = await collectRequirements(
            currentState.intent,
            content
          );

          if (ready) {
            // 信息收集完成，显示确认
            conversationStateRef.current = {
              ...currentState,
              collectedInfo,
              phase: 'confirming',
            };

            addMessage({
              role: 'agent',
              content: `📋 **信息收集完成**\n\n我已了解您的需求：\n\n${Object.entries(collectedInfo).map(([k, v]) => `• ${k}: ${v}`).join('\n')}\n\n请确认以上信息是否正确，如果没问题我将开始为您${getIntentDisplayName(currentState.intent)}。`,
              skillCall: {
                ...skillCall,
                phase: 'confirming',
              },
            });
          } else {
            // 继续询问
            addMessage({
              role: 'agent',
              content: skillCall.currentQuestion || '请提供更多信息',
              skillCall,
            });
          }
          
          setIsProcessing(false);
          return;
        }

        if (currentState && currentState.phase === 'confirming' && currentState.intent) {
          // 用户确认了信息，开始执行
          const intent = currentState.intent;
          const collectedInfo = currentState.collectedInfo;
          
          // 重置对话状态
          conversationStateRef.current = null;

          // 开始执行
          const executingSkillCall: SkillCallInfo = {
            skillId: 'skill-execution',
            skillName: 'SkillExecutionSkill',
            intent,
            confidence: 0.95,
            status: 'executing',
            phase: 'executing',
            collectedInfo,
          };
          setCurrentSkillCall(executingSkillCall);

          // 更新最后一条消息为"开始执行..."
          updateLastMessage({
            content: `⚙️ **开始执行${getIntentDisplayName(intent)}**\n\n正在为您生成...`,
            skillCall: executingSkillCall,
          });

          // 执行技能
          let finalContent = '';
          const result = await executeSkill(
            intent,
            content,
            collectedInfo,
            (delta) => {
              finalContent = delta;
              updateLastMessage({
                content: delta,
                skillCall: executingSkillCall,
              });
            }
          );

          // 完成
          const completedSkillCall: SkillCallInfo = {
            ...executingSkillCall,
            status: 'completed',
            phase: 'completed',
            result,
          };
          setCurrentSkillCall(completedSkillCall);

          // 使用函数形式更新消息，确保能访问最新的 messages 状态
          setMessages((prevMessages) => {
            const lastMessageIsAgent = prevMessages.length > 0 && prevMessages[prevMessages.length - 1].role === 'agent';
            
            if (lastMessageIsAgent) {
              // 更新最后一条消息，添加附件
              const lastIndex = prevMessages.length - 1;
              return [
                ...prevMessages.slice(0, lastIndex),
                { 
                  ...prevMessages[lastIndex],
                  content: result.content,
                  skillCall: completedSkillCall,
                  attachments: result.attachments,
                },
              ];
            } else {
              // 添加新的 agent 消息
              const newMessage: ChatMessage = {
                id: generateMessageId(),
                role: 'agent',
                content: result.content,
                skillCall: completedSkillCall,
                attachments: result.attachments,
                timestamp: Date.now(),
              };
              return [...prevMessages, newMessage];
            }
          });

          toast.success(`${getIntentDisplayName(intent)}完成！`);
          setIsProcessing(false);
          return;
        }

        // 新对话，开始意图识别
        const skillCallInfo: SkillCallInfo = {
          skillId: 'intent-recognition',
          skillName: 'IntentRecognitionSkill',
          intent: 'analyzing',
          confidence: 0,
          status: 'thinking',
          phase: 'analyzing',
        };
        setCurrentSkillCall(skillCallInfo);

        addMessage({
          role: 'agent',
          content: '🤖 正在分析您的需求...',
          skillCall: skillCallInfo,
        });

        // 识别意图
        const intentResult = await recognizeIntent(content, abortControllerRef.current.signal);
        
        // 更新意图识别状态
        const recognizingSkillCall: SkillCallInfo = {
          ...skillCallInfo,
          intent: intentResult.intent,
          confidence: intentResult.confidence,
          status: 'recognizing',
          phase: 'analyzing',
          params: intentResult.params,
        };
        setCurrentSkillCall(recognizingSkillCall);
        
        updateLastMessage({
          content: `🔍 **意图识别**\n\n识别到意图：**${getIntentDisplayName(intentResult.intent as IntentType)}**\n置信度：**${Math.round(intentResult.confidence * 100)}%**`,
          skillCall: recognizingSkillCall,
        });

        // 短暂延迟让用户看到识别结果
        await new Promise((resolve) => setTimeout(resolve, 600));

        // 如果有图片附件，根据意图自动处理
        if (attachments && attachments.length > 0) {
          const firstImage = attachments.find(att => att.type === 'image');
          if (firstImage && firstImage.url) {
            console.log('[sendMessage] 检测到图片，当前意图:', intentResult.intent);
            
            // 根据意图类型自动执行对应的操作
            if (intentResult.intent === 'image-beautification' || intentResult.intent === 'image-style-transfer') {
              // 需要执行美化或风格转换
              console.log('[sendMessage] 自动执行图片美化/风格转换');
              
              // 显示执行中的消息
              addMessage({
                role: 'agent',
                content: '✨ **正在为您美化图片**\n\n请稍候...',
                skillCall: {
                  ...recognizingSkillCall,
                  status: 'executing',
                  phase: 'executing',
                },
              });
              
              try {
                // 首先识别原图内容
                const recognitionPrompt = `请简要描述这张图片的内容，包括主要物体、风格、颜色等。图片 URL: ${firstImage.url}`;
                const context = createChatContext(messages);
                let imageDescription = '';
                
                await sendMessageStream(
                  recognitionPrompt,
                  context,
                  (delta) => {
                    imageDescription = delta;
                  },
                  abortControllerRef.current?.signal
                );
                
                // 构建图片生成提示词
                const isBeautify = intentResult.intent === 'image-beautification' || content.includes('美化');
                const generationPrompt = isBeautify 
                  ? `基于以下图片描述，生成一张美化优化后的高质量版本，提升画质、色彩和细节：${imageDescription}。用户要求：${content}`
                  : `基于以下图片描述，将图片转换为指定风格：${imageDescription}。用户要求：${content}`;
                
                console.log('[sendMessage] 调用图片生成 API，提示词:', generationPrompt);
                
                // 调用真实的图片生成 API
                const imageUrl = await generateImage(generationPrompt, {
                  size: '1024x1024',
                  quality: 'hd',
                });
                
                console.log('[sendMessage] 图片生成完成，URL:', imageUrl);
                
                // 显示生成的图片
                addMessage({
                  role: 'agent',
                  content: isBeautify ? '✅ **美化完成！**' : '✅ **风格转换完成！**',
                  attachments: [
                    {
                      type: 'image',
                      url: imageUrl,
                      status: 'completed',
                      title: isBeautify ? '美化后的图片' : '转换风格后的图片',
                    },
                  ],
                  skillCall: {
                    ...recognizingSkillCall,
                    status: 'completed',
                    phase: 'completed',
                  },
                });
                
                toast.success('图片处理完成');
              } catch (error) {
                console.error('[sendMessage] 图片处理失败:', error);
                toast.error('图片处理失败，请稍后重试');
                updateLastMessage({
                  content: '❌ **图片处理失败**\n\n抱歉，处理图片时遇到了问题，请稍后重试。',
                  skillCall: {
                    ...recognizingSkillCall,
                    status: 'error',
                    phase: 'error',
                  },
                });
              }
            } else if (intentResult.intent === 'image-recognition' || content.includes('识别') || content.includes('分析') || content.includes('描述')) {
              // 执行图片识别
              console.log('[sendMessage] 自动触发图片识别');
              
              // 发送图片识别的提示
              addMessage({
                role: 'agent',
                content: '🖼️ **检测到图片**\n\n我正在分析这张图片...',
              });
              
              try {
                // 调用图片识别服务
                const recognitionPrompt = `请详细描述这张图片的内容，包括：\n1. 主要物体和元素\n2. 场景和环境\n3. 颜色和风格\n4. 可能的用途或主题\n\n图片 URL: ${firstImage.url}`;
                
                const context = createChatContext(messages);
                let recognitionResult = '';
                
                await sendMessageStream(
                  recognitionPrompt,
                  context,
                  (delta) => {
                    recognitionResult = delta;
                    updateLastMessage({
                      content: `🖼️ **图片识别结果**\n\n${recognitionResult}`,
                    });
                  },
                  abortControllerRef.current?.signal
                );
                
                toast.success('图片识别完成');
              } catch (error) {
                console.error('[sendMessage] 图片识别失败:', error);
                toast.error('图片识别失败，请稍后重试');
              }
            } else {
              // 默认行为：只识别不执行其他操作
              console.log('[sendMessage] 默认图片识别');
              
              addMessage({
                role: 'agent',
                content: '🖼️ **检测到图片**\n\n我正在分析这张图片...',
              });
              
              try {
                const recognitionPrompt = `请详细描述这张图片的内容。\n\n图片 URL: ${firstImage.url}`;
                
                const context = createChatContext(messages);
                let recognitionResult = '';
                
                await sendMessageStream(
                  recognitionPrompt,
                  context,
                  (delta) => {
                    recognitionResult = delta;
                    updateLastMessage({
                      content: `🖼️ **图片识别结果**\n\n${recognitionResult}`,
                    });
                  },
                  abortControllerRef.current?.signal
                );
                
                toast.success('图片识别完成');
              } catch (error) {
                console.error('[sendMessage] 图片识别失败:', error);
                toast.error('图片识别失败，请稍后重试');
              }
            }
          }
        }

        // 如果是问候或帮助，直接回复
        if (intentResult.intent === 'greeting' || intentResult.intent === 'help') {
          const result = await executeSkill(
            intentResult.intent as IntentType,
            content,
            {},
            (delta) => {
              updateLastMessage({
                content: delta,
                skillCall: recognizingSkillCall,
              });
            }
          );

          const completedSkillCall: SkillCallInfo = {
            ...recognizingSkillCall,
            status: 'completed',
            phase: 'completed',
            result,
          };
          setCurrentSkillCall(completedSkillCall);

          // 更新最后一条消息，添加附件
          updateLastMessage({
            content: result.content,
            skillCall: completedSkillCall,
            attachments: result.attachments,
          });

          setIsProcessing(false);
          return;
        }

        // 开始收集需求（对于 general 意图也尝试分析需求）
        const { ready, collectedInfo, skillCall } = await collectRequirements(
          intentResult.intent as IntentType,
          content
        );

        if (ready) {
          // 信息已完整，显示确认
          conversationStateRef.current = {
            intent: intentResult.intent as IntentType,
            collectedInfo,
            missingFields: [],
            phase: 'confirming',
          };

          addMessage({
            role: 'agent',
            content: `📋 **需求已明确**\n\n我已了解您的需求：\n\n${Object.entries(collectedInfo).map(([k, v]) => `• ${k}: ${v}`).join('\n')}\n\n请确认以上信息是否正确，如果没问题我将开始为您${getIntentDisplayName(intentResult.intent as IntentType)}。`,
            skillCall: {
              ...skillCall,
              phase: 'confirming',
            },
          });
        } else {
          // 需要收集更多信息
          conversationStateRef.current = {
            intent: intentResult.intent as IntentType,
            collectedInfo,
            missingFields: skillCall.missingFields || [],
            phase: 'collecting',
          };

          addMessage({
            role: 'agent',
            content: `📝 **需求分析**\n\n${skillCall.currentQuestion || '为了更好地完成您的需求，我需要了解一些信息：'}`,
            skillCall,
          });
        }

      } catch (error: any) {
        console.error('[useSkillChat] Error:', error);
        
        const errorMessage = error.message || '执行失败';
        const errorSkillCall: SkillCallInfo = {
          skillId: currentSkillCall?.skillId || 'unknown',
          skillName: currentSkillCall?.skillName || 'Unknown',
          intent: currentSkillCall?.intent || 'error',
          confidence: 0,
          status: 'error',
          phase: 'error',
          error: errorMessage,
        };
        
        setCurrentSkillCall(errorSkillCall);
        conversationStateRef.current = null;

        if (errorMessage === '请求已取消') {
          updateLastMessage({
            content: '❌ 请求已取消',
            skillCall: errorSkillCall,
          });
        } else {
          updateLastMessage({
            content: `❌ **执行失败**\n\n${errorMessage}\n\n请稍后重试，或尝试换一种方式描述您的需求。`,
            skillCall: errorSkillCall,
          });
          toast.error('执行失败：' + errorMessage);
        }
      } finally {
        setIsProcessing(false);
        abortControllerRef.current = null;
      }
    },
    [isProcessing, messages, addMessage, updateLastMessage, currentSkillCall]
  );

  const clearMessages = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setMessages([]);
    setCurrentSkillCall(null);
    conversationStateRef.current = null;
    setIsProcessing(false);
  }, []);

  // 加载消息（用于切换会话时恢复历史消息）
  const loadMessages = useCallback((newMessages: ChatMessage[]) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setMessages(newMessages);
    setCurrentSkillCall(null);
    conversationStateRef.current = null;
    setIsProcessing(false);
  }, []);

  const cancelProcessing = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsProcessing(false);
    setCurrentSkillCall(null);
  }, []);

  return {
    messages,
    isProcessing,
    currentSkillCall,
    sendMessage,
    clearMessages,
    loadMessages,
    cancelProcessing,
  };
};

export default useSkillChat;
