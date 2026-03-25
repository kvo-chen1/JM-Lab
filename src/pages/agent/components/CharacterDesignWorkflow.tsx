/**
 * 角色设计工作流组件
 * 使用工作流引擎引导用户一步步完成IP形象设计
 */

import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useAgentStore } from '../hooks/useAgentStore';
import { 
  User, Palette, Sparkles, 
  CheckCircle, Clock, Wand2, RefreshCw 
} from 'lucide-react';
import { toast } from 'sonner';
import { getWorkflowEngine, WorkflowInstance } from '../services/workflowEngine';
import { llmService } from '@/services/llmService';
import WorkflowProgress from './WorkflowProgress';

// 角色设定信息
export interface CharacterProfile {
  name: string;
  gender: 'male' | 'female' | 'neutral';
  age: string;
  personality: string[];
  appearance: {
    hairColor: string;
    hairStyle: string;
    eyeColor: string;
    skinTone: string;
    height: string;
    build: string;
    distinctiveFeatures: string[];
  };
  clothing: {
    style: string;
    colors: string[];
    accessories: string[];
  };
  background: string;
  story: string;
  targetAudience: string;
  usageScenario: string;
}

// 工作流步骤 - 对应 illustrator-workflow 的节点
export type WorkflowStep = 
  | 'collecting_basic'      // requirement_understanding: 收集基本信息
  | 'collecting_appearance' // sketch_drawing: 收集外貌特征
  | 'collecting_clothing'   // lineart_drawing: 收集服装风格
  | 'collecting_background' // coloring_rendering: 收集背景故事
  | 'generating_profile'    // detail_refinement: 生成角色设定
  | 'showing_profile'       // final_artwork: 展示角色设定
  | 'selecting_style'       // 选择艺术风格
  | 'generating_concept'    // 生成概念图
  | 'showing_concept'       // 展示概念图
  | 'satisfaction_check'    // 满意度确认
  | 'derivative_selection'; // 延伸创作选择

// 生成进度
export interface GenerationProgress {
  status: 'idle' | 'generating' | 'completed' | 'failed';
  currentStep: string;
  progress: number; // 0-100
  elapsedTime: number; // 秒
  estimatedTotalTime: number; // 秒
  message: string;
}

// 风格选项
const ART_STYLES = [
  { id: 'cute', name: 'Q版可爱', description: '大头小身，萌系风格', color: '#FFB6C1' },
  { id: 'anime', name: '日式动漫', description: '日系二次元风格', color: '#87CEEB' },
  { id: 'realistic', name: '写实风格', description: '逼真写实风格', color: '#DDA0DD' },
  { id: 'cartoon', name: '美式卡通', description: '夸张卡通风格', color: '#F0E68C' },
  { id: 'chinese', name: '国风古韵', description: '中国传统风格', color: '#98FB98' },
  { id: 'pixel', name: '像素艺术', description: '复古像素风格', color: '#D3D3D3' },
];

// 衍生创作选项
const DERIVATIVE_OPTIONS = [
  { id: 'short_video', name: '角色短片', icon: '🎬', description: '制作15-30秒角色展示视频' },
  { id: 'more_images', name: '更多角度', icon: '🖼️', description: '生成角色的不同姿势和表情' },
  { id: 'merchandise', name: '衍生周边', icon: '🎁', description: '设计角色周边产品概念图' },
  { id: 'story', name: '角色故事', icon: '📖', description: '创作角色的背景故事' },
  { id: '3d_model', name: '3D模型', icon: '🎨', description: '生成角色3D模型概念图' },
  { id: 'emoji', name: '表情包', icon: '😊', description: '设计角色表情包系列' },
];

interface CharacterDesignWorkflowProps {
  onComplete?: (result: { profile: CharacterProfile; images: string[] }) => void;
}

export default function CharacterDesignWorkflow({ onComplete }: CharacterDesignWorkflowProps) {
  const { isDark } = useTheme();
  const { 
    addMessage, 
    addOutput, 
    currentAgent,
    setCurrentAgent,
    currentTask
  } = useAgentStore();
  
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('collecting_basic');
  const [completedSteps, setCompletedSteps] = useState<WorkflowStep[]>([]);
  const [characterProfile, setCharacterProfile] = useState<Partial<CharacterProfile>>({});
  const [generationProgress, setGenerationProgress] = useState<GenerationProgress>({
    status: 'idle',
    currentStep: '',
    progress: 0,
    elapsedTime: 0,
    estimatedTotalTime: 20,
    message: ''
  });
  const [selectedStyle, setSelectedStyle] = useState<string>('');
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isSatisfied, setIsSatisfied] = useState<boolean | null>(null);
  
  // 工作流引擎实例
  const [workflowInstance, setWorkflowInstance] = useState<WorkflowInstance | null>(null);
  const workflowEngine = getWorkflowEngine();

  // 初始化工作流
  useEffect(() => {
    // 创建插画师工作流实例
    const instance = workflowEngine.createWorkflow('illustrator-workflow', {
      characterProfile: {},
      currentStep: 'collecting_basic'
    });
    
    if (instance) {
      setWorkflowInstance(instance);
      console.log('[CharacterDesignWorkflow] 工作流已创建:', instance.id);
    }
    
    // 设置当前Agent为插画师
    setCurrentAgent('illustrator');
    
    return () => {
      // 清理工作流
      if (instance) {
        workflowEngine.cancelWorkflow(instance.id);
      }
    };
  }, []);

  // 模拟进度更新
  const startProgressSimulation = useCallback((message: string, estimatedTime: number = 20) => {
    setGenerationProgress({
      status: 'generating',
      currentStep: message,
      progress: 0,
      elapsedTime: 0,
      estimatedTotalTime: estimatedTime,
      message: message
    });

    const interval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev.status !== 'generating') {
          clearInterval(interval);
          return prev;
        }
        
        const newElapsed = prev.elapsedTime + 0.5;
        const newProgress = Math.min((newElapsed / prev.estimatedTotalTime) * 100, 95);
        
        return {
          ...prev,
          elapsedTime: newElapsed,
          progress: newProgress
        };
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const stopProgressSimulation = useCallback((success: boolean = true) => {
    setGenerationProgress(prev => ({
      ...prev,
      status: success ? 'completed' : 'failed',
      progress: success ? 100 : prev.progress
    }));
  }, []);

  // 更新工作流数据
  const updateWorkflowData = useCallback((data: Record<string, any>) => {
    if (workflowInstance) {
      workflowInstance.data = { ...workflowInstance.data, ...data };
    }
  }, [workflowInstance]);

  // 更新当前步骤并追踪完成状态
  const updateCurrentStep = useCallback((newStep: WorkflowStep) => {
    setCurrentStep(prevStep => {
      // 如果前一个步骤不是新步骤，且不在已完成列表中，则添加
      if (prevStep !== newStep && !completedSteps.includes(prevStep)) {
        setCompletedSteps(prev => [...prev, prevStep]);
      }
      return newStep;
    });
  }, [completedSteps]);

  // 步骤 1: 收集基本信息
  const handleBasicInfoCollected = (info: Partial<CharacterProfile>) => {
    setCharacterProfile(prev => ({ ...prev, ...info }));
    updateCurrentStep('collecting_appearance');
    
    // 更新工作流数据
    updateWorkflowData({ 
      characterProfile: { ...characterProfile, ...info },
      currentStep: 'collecting_appearance'
    });
    
    addMessage({
      role: 'illustrator',
      content: `很好！现在让我了解一下${info.name || '这个角色'}的外貌特征。请告诉我：

1. 发色和发型是什么样的？
2. 眼睛是什么颜色？
3. 有什么特别的外貌特征吗？（比如雀斑、疤痕、特殊标记等）`,
      type: 'text'
    });
  };

  // 步骤 2: 收集外貌特征
  const handleAppearanceCollected = (appearance: CharacterProfile['appearance']) => {
    setCharacterProfile(prev => ({ ...prev, appearance }));
    updateCurrentStep('collecting_clothing');
    
    updateWorkflowData({ 
      characterProfile: { ...characterProfile, appearance },
      currentStep: 'collecting_clothing'
    });
    
    addMessage({
      role: 'illustrator',
      content: '了解了！现在来说说服装风格吧。你希望角色穿什么样的衣服？\n\n• 日常休闲风\n• 职场正式风\n• 潮流街头风\n• 古风汉服\n• 未来科幻风\n• 还是其他风格？',
      type: 'text'
    });
  };

  // 步骤 3: 收集服装信息
  const handleClothingCollected = (clothing: CharacterProfile['clothing']) => {
    setCharacterProfile(prev => ({ ...prev, clothing }));
    updateCurrentStep('collecting_background');
    
    updateWorkflowData({ 
      characterProfile: { ...characterProfile, clothing },
      currentStep: 'collecting_background'
    });
    
    addMessage({
      role: 'illustrator',
      content: '完美！最后，这个角色有什么背景故事吗？\n\n比如：\n• 职业是什么？\n• 性格特点？\n• 有什么特殊能力或爱好？\n• 目标受众是谁？',
      type: 'text'
    });
  };

  // 步骤 4: 收集背景故事
  const handleBackgroundCollected = (info: { background: string; story: string; targetAudience: string }) => {
    const updatedProfile = { ...characterProfile, ...info };
    setCharacterProfile(updatedProfile);
    updateCurrentStep('generating_profile');
    
    updateWorkflowData({ 
      characterProfile: updatedProfile,
      currentStep: 'generating_profile'
    });
    
    // 开始生成角色设定 - 对应工作流的 detail_refinement 节点
    generateCharacterProfile();
  };

  // 生成角色设定
  const generateCharacterProfile = async () => {
    startProgressSimulation('正在整理角色设定...', 5);
    
    try {
      // 模拟AI处理时间 - 对应工作流节点执行
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // 完成工作流节点
      if (workflowInstance) {
        await workflowEngine.completeNode(workflowInstance.id, 'detail_refinement', {
          profileDescription: generateProfileDescription()
        });
      }
      
      stopProgressSimulation(true);
      updateCurrentStep('showing_profile');
      
      const profileDescription = generateProfileDescription();
      
      // 添加角色设定到对话消息
      addMessage({
        role: 'illustrator',
        content: `## 📋 ${characterProfile.name} 的角色档案\n\n${profileDescription}\n\n---\n*角色设定已完成！确认无误后，我们就可以开始创作概念图了！*`,
        type: 'text'
      });
      
      // 同时添加到画布展示
      addOutput({
        type: 'text',
        url: '',
        title: `${characterProfile.name} - 角色设定`,
        description: profileDescription,
        agentType: 'illustrator'
      });
      
    } catch (error) {
      stopProgressSimulation(false);
      toast.error('角色设定生成失败，请重试');
    }
  };

  // 生成角色设定描述
  const generateProfileDescription = () => {
    const p = characterProfile;
    return `
## 基础信息
- **姓名**: ${p.name}
- **性别**: ${p.gender === 'male' ? '男' : p.gender === 'female' ? '女' : '中性'}
- **年龄**: ${p.age}
- **性格**: ${p.personality?.join('、')}

## 外貌特征
- **发色/发型**: ${p.appearance?.hairColor} ${p.appearance?.hairStyle}
- **眼睛**: ${p.appearance?.eyeColor}
- **肤色**: ${p.appearance?.skinTone}
- **体型**: ${p.appearance?.height} ${p.appearance?.build}
- **特征**: ${p.appearance?.distinctiveFeatures?.join('、') || '无'}

## 服装风格
- **风格**: ${p.clothing?.style}
- **颜色**: ${p.clothing?.colors?.join('、')}
- **配饰**: ${p.clothing?.accessories?.join('、') || '无'}

## 背景设定
- **职业/身份**: ${p.background}
- **背景故事**: ${p.story}
- **目标受众**: ${p.targetAudience}
    `.trim();
  };

  // 步骤 5: 选择风格并生成概念图
  const handleStyleSelected = async (styleId: string) => {
    setSelectedStyle(styleId);
    updateCurrentStep('generating_concept');
    
    updateWorkflowData({ 
      selectedStyle: styleId,
      currentStep: 'generating_concept'
    });
    
    const style = ART_STYLES.find(s => s.id === styleId);
    
    addMessage({
      role: 'illustrator',
      content: `选择了${style?.name}风格！现在开始生成角色概念图...`,
      type: 'text'
    });
    
    // 开始生成概念图
    await generateConceptImage(styleId);
  };

  // 生成概念图
  const generateConceptImage = async (styleId: string) => {
    startProgressSimulation('正在绘制角色概念图...', 30);
    
    try {
      const style = ART_STYLES.find(s => s.id === styleId);
      const prompt = buildCharacterPrompt(style?.name || '');
      
      const result = await llmService.generateImage({
        model: 'qwen-image-2.0-pro',
        prompt: prompt,
        size: '1024x1024',
        n: 1
      });
      
      if (!result.ok) {
        throw new Error(result.error || '生成失败');
      }
      
      const imageUrl = result.data?.data?.[0]?.url || result.data?.[0]?.url;
      if (!imageUrl) {
        throw new Error('无法获取图像URL');
      }
      
      // 完成工作流
      if (workflowInstance) {
        await workflowEngine.completeNode(workflowInstance.id, 'final_artwork', {
          conceptImage: imageUrl,
          style: style?.name
        });
      }
      
      stopProgressSimulation(true);
      setGeneratedImages([imageUrl]);
      updateCurrentStep('showing_concept');
      
      // 添加图像到聊天
      addMessage({
        role: 'illustrator',
        content: `✨ ${characterProfile.name}的角色概念图已完成！这是${style?.name}风格的呈现效果。`,
        type: 'image',
        metadata: { images: [imageUrl] }
      });
      
      // 添加到画布
      addOutput({
        type: 'image',
        url: imageUrl,
        thumbnail: imageUrl,
        title: `${characterProfile.name} - 概念图`,
        description: `${style?.name}风格`,
        agentType: 'illustrator',
        cardType: 'concept_art'
      });
      
      // 延迟显示满意度确认
      setTimeout(() => {
        updateCurrentStep('satisfaction_check');
        updateWorkflowData({ currentStep: 'satisfaction_check' });
      }, 1500);
      
    } catch (error: any) {
      stopProgressSimulation(false);
      toast.error(`概念图生成失败: ${error.message}`);
      addMessage({
        role: 'illustrator',
        content: '抱歉，概念图生成遇到了问题。请重试或换一种风格。',
        type: 'text'
      });
    }
  };

  // 构建角色生成提示词
  const buildCharacterPrompt = (styleName: string) => {
    const p = characterProfile;
    const a = p.appearance;
    const c = p.clothing;
    
    // 获取品牌信息
    const brandName = currentTask?.requirements?.mentionedBrand;
    
    let prompt = `${styleName}风格的角色设计`;
    
    // 如果用户引用了品牌，添加品牌风格参考
    if (brandName) {
      prompt += `，参考品牌"${brandName}"的风格和调性`;
    }
    
    prompt += `，
${p.gender === 'male' ? '男性' : p.gender === 'female' ? '女性' : '中性'}角色，
${p.age}岁，
${a?.hairColor}色${a?.hairStyle}，
${a?.eyeColor}眼睛，
穿着${c?.style}风格的${c?.colors?.join('和')}色服装，
${c?.accessories?.length ? '佩戴' + c?.accessories?.join('、') : ''}，
${a?.distinctiveFeatures?.length ? '特征：' + a?.distinctiveFeatures?.join('、') : ''}，
${p.personality?.join('、')}的性格，
高质量，精美细节，专业角色设计，白色背景，全身像`;
    
    return prompt;
  };

  // 满意度确认
  const handleSatisfactionResponse = (satisfied: boolean) => {
    setIsSatisfied(satisfied);
    
    if (satisfied) {
      setCurrentStep('derivative_selection');
      updateWorkflowData({ 
        isSatisfied: true,
        currentStep: 'derivative_selection'
      });
      
      addMessage({
        role: 'illustrator',
        content: '太棒了！🎉 你对这个角色满意吗？我们还可以为它创作更多精彩内容：',
        type: 'text'
      });
      
      // 完成工作流
      if (workflowInstance) {
        workflowEngine.completeWorkflow(workflowInstance.id);
      }
    } else {
      setCurrentStep('selecting_style');
      updateWorkflowData({ 
        isSatisfied: false,
        currentStep: 'selecting_style'
      });
      
      addMessage({
        role: 'illustrator',
        content: '没问题！让我们调整一下。你可以：\n1. 修改角色设定\n2. 换一种艺术风格\n3. 告诉我具体哪里需要改进',
        type: 'text'
      });
    }
  };

  // 选择衍生创作
  const handleDerivativeSelected = (optionId: string) => {
    const option = DERIVATIVE_OPTIONS.find(o => o.id === optionId);
    
    addMessage({
      role: 'illustrator',
      content: `选择了${option?.name}！这是一个很棒的想法。让我开始为你创作...`,
      type: 'text'
    });
    
    // 这里可以触发相应的衍生创作流程
    toast.success(`开始创作${option?.name}`);
  };

  // 渲染进度显示
  const renderProgress = () => {
    if (generationProgress.status === 'idle') return null;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}
      >
        <div className="flex items-center gap-3 mb-3">
          {generationProgress.status === 'generating' ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <RefreshCw className="w-5 h-5 text-[#C02C38]" />
            </motion.div>
          ) : generationProgress.status === 'completed' ? (
            <CheckCircle className="w-5 h-5 text-green-500" />
          ) : (
            <Clock className="w-5 h-5 text-red-500" />
          )}
          <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {generationProgress.message}
          </span>
        </div>
        
        {/* 进度条 */}
        <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
          <motion.div
            className="h-full bg-gradient-to-r from-[#C02C38] to-[#E85D75]"
            initial={{ width: 0 }}
            animate={{ width: `${generationProgress.progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        
        {/* 时间显示 */}
        <div className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          {generationProgress.status === 'generating' ? (
            <>生成中... ({generationProgress.elapsedTime.toFixed(1)}s) / {generationProgress.estimatedTotalTime}s</>
          ) : generationProgress.status === 'completed' ? (
            <>✓ 完成！耗时 {generationProgress.elapsedTime.toFixed(1)}s</>
          ) : (
            <>✗ 生成失败</>
          )}
        </div>
      </motion.div>
    );
  };

  // 渲染角色设定展示
  const renderCharacterProfile = () => {
    if (currentStep !== 'showing_profile') return null;
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}
      >
        <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          👤 {characterProfile.name} 的角色档案
        </h3>
        
        <div className="space-y-4">
          <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <h4 className={`font-semibold mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
              <User className="w-4 h-4 inline mr-2" />
              基础信息
            </h4>
            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              {characterProfile.gender === 'male' ? '男性' : characterProfile.gender === 'female' ? '女性' : '中性'} 
              · {characterProfile.age}岁
              · {characterProfile.personality?.join('、')}
            </p>
          </div>
          
          <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <h4 className={`font-semibold mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
              <Palette className="w-4 h-4 inline mr-2" />
              外貌特征
            </h4>
            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              {characterProfile.appearance?.hairColor}色{characterProfile.appearance?.hairStyle} · 
              {characterProfile.appearance?.eyeColor}眼睛 · 
              {characterProfile.appearance?.distinctiveFeatures?.join('、') || '无特殊标记'}
            </p>
          </div>
          
          <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <h4 className={`font-semibold mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
              <Sparkles className="w-4 h-4 inline mr-2" />
              服装风格
            </h4>
            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              {characterProfile.clothing?.style}风格 · 
              {characterProfile.clothing?.colors?.join('、')}色
              {characterProfile.clothing?.accessories?.length ? ` · 配饰：${characterProfile.clothing?.accessories?.join('、')}` : ''}
            </p>
          </div>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setCurrentStep('selecting_style')}
          className="mt-6 w-full py-3 bg-gradient-to-r from-[#C02C38] to-[#E85D75] text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-shadow"
        >
          <Wand2 className="w-4 h-4 inline mr-2" />
          确认设定，开始创作概念图
        </motion.button>
      </motion.div>
    );
  };

  // 渲染风格选择 - 优化样式
  const renderStyleSelection = () => {
    if (currentStep !== 'selecting_style') return null;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        {/* 标题 */}
        <div className={`text-base font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
          选择你喜欢的风格
        </div>
        
        {/* 风格选择网格 - 参考 oii 设计 */}
        <div className="grid grid-cols-2 gap-2">
          {ART_STYLES.map((style) => (
            <motion.button
              key={style.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleStyleSelected(style.id)}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all group text-left ${
                selectedStyle === style.id
                  ? 'bg-[#C02C38]/10 border border-[#C02C38]/50'
                  : isDark
                    ? 'bg-[#1E1E2E]/60 border border-[#2A2A3E] hover:border-[#C02C38]/30'
                    : 'bg-white/60 border border-gray-200 hover:border-[#C02C38]/30'
              }`}
            >
              <div 
                className="w-10 h-10 rounded-lg flex-shrink-0"
                style={{ backgroundColor: style.color }}
              />
              <div className="min-w-0">
                <div className={`text-sm font-medium truncate transition-colors ${
                  selectedStyle === style.id 
                    ? 'text-[#E85D75]' 
                    : isDark ? 'text-gray-200' : 'text-gray-800'
                }`}>
                  {style.name}
                </div>
                <div className={`text-xs truncate ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  {style.description}
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>
    );
  };

  // 渲染满意度确认
  const renderSatisfactionCheck = () => {
    if (currentStep !== 'satisfaction_check') return null;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}
      >
        <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          💭 你对当前角色满意吗？
        </h3>
        <p className={`mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          你还可以为这个角色制作更多内容（短片、生一张图、做一套衍生周边）
        </p>
        
        <div className="space-y-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSatisfactionResponse(true)}
            className="w-full py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-medium shadow-lg"
          >
            <CheckCircle className="w-5 h-5 inline mr-2" />
            满意，继续创作更多内容
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSatisfactionResponse(false)}
            className={`w-full py-4 rounded-xl font-medium border-2 transition-colors ${
              isDark
                ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <RefreshCw className="w-5 h-5 inline mr-2" />
            差点意思，我要修改
          </motion.button>
        </div>
      </motion.div>
    );
  };

  // 渲染衍生创作选择
  const renderDerivativeSelection = () => {
    if (currentStep !== 'derivative_selection') return null;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}
      >
        <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          🚀 延伸创作
        </h3>
        <p className={`mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          想为 {characterProfile.name} 创作什么内容？
        </p>
        
        <div className="grid grid-cols-2 gap-3">
          {DERIVATIVE_OPTIONS.map((option) => (
            <motion.button
              key={option.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleDerivativeSelected(option.id)}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                isDark
                  ? 'border-gray-700 hover:border-gray-600 hover:bg-gray-700'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span className="text-2xl mb-2 block">{option.icon}</span>
              <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {option.name}
              </h4>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {option.description}
              </p>
            </motion.button>
          ))}
        </div>
      </motion.div>
    );
  };

  // 主渲染
  return (
    <div className="space-y-4">
      {/* 工作流进度指示器 */}
      <WorkflowProgress 
        currentStep={currentStep}
        completedSteps={completedSteps}
        compact={false}
      />
      
      {/* 进度显示 */}
      {renderProgress()}
      
      {/* 角色设定展示 */}
      {renderCharacterProfile()}
      
      {/* 风格选择 */}
      {renderStyleSelection()}
      
      {/* 满意度确认 */}
      {renderSatisfactionCheck()}
      
      {/* 衍生创作选择 */}
      {renderDerivativeSelection()}
    </div>
  );
}
