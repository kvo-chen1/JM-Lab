import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BRANDS from '@/lib/brands';
import { 
  Send, 
  Sparkles, 
  User, 
  Phone, 
  FileText,
  Lightbulb,
  Zap,
  Users,
  Star,
  Award,
  X
} from 'lucide-react';

interface CooperationFormProps {
  isDark: boolean;
  selectedBrand: typeof BRANDS[0];
  onSubmit: (data: { contact: string; phone: string; idea: string }) => void;
}

const CooperationForm: React.FC<CooperationFormProps> = ({ isDark, selectedBrand, onSubmit }) => {
  const [contact, setContact] = useState('');
  const [phone, setPhone] = useState('');
  const [idea, setIdea] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const quickIdeas = [
    { icon: Zap, label: '赛博朋克风', prompt: '赛博朋克风格联名设计' },
    { icon: Users, label: '校园潮流', prompt: '校园潮流联名系列' },
    { icon: Star, label: '数字文创', prompt: '数字文创表情包设计' },
    { icon: Award, label: '非遗传承', prompt: '非遗文化联名合作' },
  ];

  const generateSuggestions = async () => {
    if (!chatInput.trim()) return;
    
    setIsGenerating(true);
    setShowSuggestions(true);
    
    // 模拟AI生成
    setTimeout(() => {
      const suggestions = [
        `${selectedBrand.name} × 校园潮流：${chatInput}，推出限定周边礼盒，融合传统与现代设计元素`,
        `${selectedBrand.name} 城市记忆计划：${chatInput}，设计主题海报与KV，讲述品牌故事`,
        `${selectedBrand.name} 数字文创：${chatInput}，发布数字藏品或表情包，触达年轻用户`,
      ];
      setAiSuggestions(suggestions);
      setIsGenerating(false);
    }, 1500);
  };

  const applySuggestion = (suggestion: string) => {
    setIdea(suggestion);
    setShowSuggestions(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ contact, phone, idea });
  };

  const isValid = contact.trim() && phone.trim() && idea.trim();

  return (
    <section className="mb-16">
      {/* 标题 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          提交合作意向
        </h2>
        <p className={`text-lg max-w-2xl mx-auto ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          填写以下信息，我们将尽快与您联系
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* AI 辅助区域 */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className={`
            p-8 rounded-3xl
            ${isDark 
              ? 'bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-500/20' 
              : 'bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200'}
          `}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                AI 创意助手
              </h3>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                让AI帮您构思合作方案
              </p>
            </div>
          </div>

          {/* 快捷灵感 */}
          <div className="mb-6">
            <p className={`text-sm mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>快捷灵感：</p>
            <div className="flex flex-wrap gap-2">
              {quickIdeas.map((item) => (
                <button
                  key={item.label}
                  onClick={() => setChatInput(`把${selectedBrand.name}做成${item.prompt}`)}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all
                    ${isDark 
                      ? 'bg-slate-800 hover:bg-slate-700 text-gray-300 border border-slate-700' 
                      : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'}
                  `}
                >
                  <item.icon className="w-4 h-4 text-blue-500" />
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* 输入框 */}
          <div className="relative mb-4">
            <textarea
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={`描述您对 ${selectedBrand.name} 的创意想法...`}
              className={`
                w-full h-32 p-4 pr-12 rounded-xl resize-none transition-all
                ${isDark 
                  ? 'bg-slate-800 text-white placeholder-gray-500 border border-slate-700 focus:border-blue-500' 
                  : 'bg-white text-gray-900 placeholder-gray-400 border border-gray-200 focus:border-blue-500'}
                focus:outline-none focus:ring-2 focus:ring-blue-500/20
              `}
            />
            <button
              onClick={generateSuggestions}
              disabled={!chatInput.trim() || isGenerating}
              className={`
                absolute bottom-3 right-3 p-2 rounded-lg transition-all
                ${chatInput.trim() && !isGenerating
                  ? 'bg-blue-500 text-white hover:bg-blue-600' 
                  : (isDark ? 'bg-slate-700 text-gray-500' : 'bg-gray-100 text-gray-400')}
              `}
            >
              {isGenerating ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Sparkles className="w-5 h-5" />
                </motion.div>
              ) : (
                <Sparkles className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* AI 建议结果 */}
          <AnimatePresence>
            {showSuggestions && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3"
              >
                <div className="flex items-center justify-between">
                  <p className={`text-sm font-medium ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                    AI 生成的方案建议：
                  </p>
                  <button 
                    onClick={() => setShowSuggestions(false)}
                    className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {isGenerating ? (
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-500/10">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Sparkles className="w-5 h-5 text-blue-500" />
                    </motion.div>
                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      AI正在生成创意方案...
                    </span>
                  </div>
                ) : (
                  aiSuggestions.map((suggestion, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => applySuggestion(suggestion)}
                      className={`
                        p-4 rounded-xl cursor-pointer transition-all group
                        ${isDark 
                          ? 'bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-blue-500/50' 
                          : 'bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-300'}
                      `}
                    >
                      <div className="flex items-start gap-3">
                        <Lightbulb className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <p className={`text-sm flex-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {suggestion}
                        </p>
                        <button className="opacity-0 group-hover:opacity-100 px-3 py-1 bg-blue-500 text-white text-xs rounded-lg transition-opacity">
                          采用
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* 表单区域 */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className={`
            p-8 rounded-3xl
            ${isDark 
              ? 'bg-slate-800/50 border border-slate-700' 
              : 'bg-white border border-gray-200'}
          `}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 联系人 */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  联系人姓名
                </div>
              </label>
              <input
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="请输入您的姓名"
                className={`
                  w-full px-4 py-3 rounded-xl transition-all
                  ${isDark 
                    ? 'bg-slate-800 text-white placeholder-gray-500 border border-slate-700 focus:border-blue-500' 
                    : 'bg-gray-50 text-gray-900 placeholder-gray-400 border border-gray-200 focus:border-blue-500'}
                  focus:outline-none focus:ring-2 focus:ring-blue-500/20
                `}
              />
            </div>

            {/* 联系方式 */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  联系方式
                </div>
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="手机号或微信号"
                className={`
                  w-full px-4 py-3 rounded-xl transition-all
                  ${isDark 
                    ? 'bg-slate-800 text-white placeholder-gray-500 border border-slate-700 focus:border-blue-500' 
                    : 'bg-gray-50 text-gray-900 placeholder-gray-400 border border-gray-200 focus:border-blue-500'}
                  focus:outline-none focus:ring-2 focus:ring-blue-500/20
                `}
              />
            </div>

            {/* 合作方案 */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  合作方案描述
                </div>
              </label>
              <textarea
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder={`描述您对 ${selectedBrand.name} 的合作想法...`}
                rows={5}
                className={`
                  w-full px-4 py-3 rounded-xl resize-none transition-all
                  ${isDark 
                    ? 'bg-slate-800 text-white placeholder-gray-500 border border-slate-700 focus:border-blue-500' 
                    : 'bg-gray-50 text-gray-900 placeholder-gray-400 border border-gray-200 focus:border-blue-500'}
                  focus:outline-none focus:ring-2 focus:ring-blue-500/20
                `}
              />
            </div>

            {/* 提交按钮 */}
            <button
              type="submit"
              disabled={!isValid}
              className={`
                w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition-all
                ${isValid
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02]'
                  : (isDark ? 'bg-slate-700 text-gray-500 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed')
                }
              `}
            >
              <Send className="w-5 h-5" />
              提交合作申请
            </button>

            <p className={`text-xs text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              提交即表示您同意我们的服务条款和隐私政策
            </p>
          </form>
        </motion.div>
      </div>
    </section>
  );
};

export default CooperationForm;
