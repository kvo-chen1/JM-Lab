// 创建同款页

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { getCaseDetail } from './services/agentCaseService';
import { CaseDetail } from './types';
import {
  ChevronLeft,
  Sparkles,
  Send,
  Loader2,
  AlertCircle,
} from 'lucide-react';

const CreateSimilarPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark } = useTheme();

  const [caseDetail, setCaseDetail] = useState<CaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 从location state获取预填充数据
  const prefillData = location.state?.prefillData;

  // 加载参考案例
  useEffect(() => {
    const loadCase = async () => {
      if (!id) return;

      try {
        const detail = await getCaseDetail(id);
        setCaseDetail(detail);
        
        // 如果有预填充数据，设置初始输入
        if (prefillData?.prompt) {
          setInputMessage(prefillData.prompt);
        } else if (detail.conversation.length > 0) {
          // 使用第一条用户消息作为参考
          const firstUserMessage = detail.conversation.find(m => m.role === 'user');
          if (firstUserMessage) {
            setInputMessage(`参考以下设计，创作类似风格的作品：\n${firstUserMessage.content}`);
          }
        }
      } catch (err) {
        console.error('加载案例失败:', err);
        setError('加载参考案例失败');
      } finally {
        setLoading(false);
      }
    };

    loadCase();
  }, [id, prefillData]);

  // 处理发送消息
  const handleSubmit = async () => {
    if (!inputMessage.trim() || isSubmitting) return;

    setIsSubmitting(true);
    
    // 构建跳转参数
    const params = new URLSearchParams();
    params.set('mode', 'similar');
    params.set('refCase', id || '');
    params.set('prompt', inputMessage);
    
    if (prefillData?.referenceImages?.length > 0) {
      params.set('refImages', JSON.stringify(prefillData.referenceImages));
    }

    // 跳转到Agent页面
    navigate(`/agent?${params.toString()}`);
  };

  // 处理键盘提交
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // 加载中
  if (loading) {
    return (
      <div className={`
        min-h-screen flex items-center justify-center
        ${isDark ? 'bg-[#0a0f0a]' : 'bg-gray-50'}
      `}>
        <div className="flex items-center gap-3">
          <Loader2 className={`w-6 h-6 animate-spin ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
          <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>加载中...</span>
        </div>
      </div>
    );
  }

  // 错误
  if (error || !caseDetail) {
    return (
      <div className={`
        min-h-screen flex flex-col items-center justify-center px-4
        ${isDark ? 'bg-[#0a0f0a]' : 'bg-gray-50'}
      `}>
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          加载失败
        </h2>
        <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          {error || '参考案例不存在'}
        </p>
        <button
          onClick={() => navigate('/agent-cases')}
          className="
            px-6 py-2 rounded-xl
            bg-gradient-to-r from-[#C02C38] to-[#E85D75]
            text-white font-medium
          "
        >
          返回案例列表
        </button>
      </div>
    );
  }

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
                  text-lg font-bold
                  ${isDark ? 'text-white' : 'text-gray-900'}
                `}>
                  创作同款
                </h1>
                <p className={`
                  text-xs
                  ${isDark ? 'text-gray-500' : 'text-gray-500'}
                `}>
                  参考：{caseDetail.title}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 sm:px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 左侧：参考作品 */}
            <div className="space-y-4">
              <h2 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                参考作品
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {caseDetail.images.length > 0 ? (
                  caseDetail.images.map((image, index) => (
                    <motion.div
                      key={image.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`
                        aspect-[3/4] rounded-xl overflow-hidden
                        ${isDark ? 'bg-[#1a1f1a]' : 'bg-gray-100'}
                      `}
                    >
                      <img
                        src={image.url}
                        alt={`参考图片 ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </motion.div>
                  ))
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`
                      aspect-[3/4] rounded-xl overflow-hidden col-span-2
                      ${isDark ? 'bg-[#1a1f1a]' : 'bg-gray-100'}
                    `}
                  >
                    <img
                      src={caseDetail.coverImage}
                      alt="参考封面"
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                )}
              </div>

              {/* 参考提示词 */}
              {caseDetail.conversation.length > 0 && (
                <div className={`
                  p-4 rounded-xl mt-6
                  ${isDark ? 'bg-[#1a1f1a]' : 'bg-white'}
                `}>
                  <h3 className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    原始提示词
                  </h3>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {caseDetail.conversation.find(m => m.role === 'user')?.content || '无'}
                  </p>
                </div>
              )}
            </div>

            {/* 右侧：AI对话面板 */}
            <div className="space-y-4">
              <h2 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                开始创作
              </h2>
              
              {/* AI欢迎消息 */}
              <div className={`
                p-4 rounded-2xl
                ${isDark ? 'bg-[#1a1f1a]' : 'bg-white'}
              `}>
                <div className="flex items-start gap-3">
                  <div className="
                    w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                    bg-gradient-to-br from-[#C02C38] to-[#E85D75]
                  ">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      你好！我是你的AI设计师。我已经了解了参考作品的风格特点。
                    </p>
                    <p className={`text-sm leading-relaxed mt-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      你可以在下方输入框中描述你想要的创作内容，我会参考原作品的风格为你生成新的设计。
                    </p>
                  </div>
                </div>
              </div>

              {/* 输入区域 */}
              <div className={`
                p-4 rounded-2xl
                ${isDark ? 'bg-[#1a1f1a]' : 'bg-white'}
              `}>
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      你的创作需求
                    </label>
                    <textarea
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="描述你想要的创作内容..."
                      rows={6}
                      className={`
                        w-full px-4 py-3 rounded-xl resize-none
                        text-sm leading-relaxed
                        border-2 transition-colors
                        focus:outline-none
                        ${isDark 
                          ? 'bg-[#0a0f0a] border-[#2a2f2a] text-white placeholder-gray-600 focus:border-[#C02C38]' 
                          : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-[#C02C38]'
                        }
                      `}
                    />
                  </div>

                  {/* 快捷提示 */}
                  <div className="flex flex-wrap gap-2">
                    {['保持原风格', '调整颜色', '改变主题', '添加元素'].map((tip) => (
                      <button
                        key={tip}
                        onClick={() => setInputMessage(prev => `${prev}，${tip}`)}
                        className={`
                          px-3 py-1.5 rounded-full text-xs
                          transition-colors
                          ${isDark 
                            ? 'bg-[#2a2f2a] text-gray-400 hover:bg-[#3a3f3a]' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }
                        `}
                      >
                        + {tip}
                      </button>
                    ))}
                  </div>

                  {/* 提交按钮 */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSubmit}
                    disabled={!inputMessage.trim() || isSubmitting}
                    className="
                      w-full flex items-center justify-center gap-2
                      px-6 py-3 rounded-xl
                      bg-gradient-to-r from-[#C02C38] to-[#E85D75]
                      text-white font-medium
                      shadow-lg shadow-red-500/20
                      hover:shadow-xl hover:shadow-red-500/30
                      transition-shadow
                      disabled:opacity-50 disabled:cursor-not-allowed
                    "
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>准备中...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        <span>开始创作</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </div>

              {/* 提示信息 */}
              <p className={`text-xs text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                按 Enter 发送，Shift + Enter 换行
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CreateSimilarPage;
